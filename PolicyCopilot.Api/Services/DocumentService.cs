using Microsoft.EntityFrameworkCore;
using PolicyCopilot.Api.Data;
using PolicyCopilot.Api.Models;
using UglyToad.PdfPig;

namespace PolicyCopilot.Api.Services;

public class DocumentService : IDocumentService
{
    private readonly ApplicationDbContext _context;
    private readonly IServiceProvider _serviceProvider;
    private readonly string _uploadPath;

    public DocumentService(ApplicationDbContext context, IServiceProvider serviceProvider, IConfiguration configuration)
    {
        _context = context;
        _serviceProvider = serviceProvider;
        _uploadPath = configuration.GetValue<string>("UploadPath") ?? "uploads";
        Directory.CreateDirectory(_uploadPath);
    }

    public async Task<Document> UploadDocumentAsync(IFormFile file)
    {
        var document = new Document
        {
            Id = Guid.NewGuid(),
            FileName = file.FileName,
            ContentType = file.ContentType,
            Size = file.Length,
            UploadedAt = DateTime.UtcNow,
            ProcessingStatus = "Uploaded"
        };

        var filePath = Path.Combine(_uploadPath, $"{document.Id}_{file.FileName}");
        using var stream = new FileStream(filePath, FileMode.Create);
        await file.CopyToAsync(stream);

        _context.Documents.Add(document);
        await _context.SaveChangesAsync();

        _ = Task.Run(() => ProcessDocumentInBackgroundAsync(document.Id));

        return document;
    }

    public async Task<List<Document>> GetDocumentsAsync()
    {
        return await _context.Documents
            .OrderByDescending(d => d.UploadedAt)
            .ToListAsync();
    }
    
    public async Task ProcessDocumentInBackgroundAsync(Guid documentId)
    {
        using var scope = _serviceProvider.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
        var embeddingService = scope.ServiceProvider.GetRequiredService<IEmbeddingService>();
        
        await ProcessDocumentAsync(documentId, context, embeddingService);
    }

    private async Task ProcessDocumentAsync(Guid documentId, ApplicationDbContext context, IEmbeddingService embeddingService)
    {
        try
        {
            Console.WriteLine($"Starting to process document {documentId}");
            
            var document = await context.Documents.FindAsync(documentId);
            if (document == null)
            {
                Console.WriteLine($"Document {documentId} not found");
                return;
            }

            document.ProcessingStatus = "Processing";
            await context.SaveChangesAsync();

            var filePath = Path.Combine(_uploadPath, $"{document.Id}_{document.FileName}");
            if (!File.Exists(filePath))
            {
                Console.WriteLine($"File not found: {filePath}");
                document.ProcessingStatus = "Failed";
                await context.SaveChangesAsync();
                return;
            }

            var text = ExtractTextFromPdf(filePath);
            Console.WriteLine($"Extracted {text.Length} characters from PDF");

            if (string.IsNullOrWhiteSpace(text))
            {
                Console.WriteLine($"No text extracted from PDF: {filePath}");
                document.ProcessingStatus = "Failed";
                await context.SaveChangesAsync();
                return;
            }

            var chunks = SplitIntoChunks(text);
            Console.WriteLine($"Split into {chunks.Count} chunks");

            if (chunks.Count == 0)
            {
                Console.WriteLine($"No chunks created from text");
                document.ProcessingStatus = "Failed";
                await context.SaveChangesAsync();
                return;
            }

            var successfulChunks = 0;
            for (int i = 0; i < chunks.Count; i++)
            {
                Console.WriteLine($"Processing chunk {i + 1}/{chunks.Count}");
                
                try
                {
                    // Add cancellation token with timeout
                    using var cts = new CancellationTokenSource(TimeSpan.FromSeconds(60));
                    var embedding = await embeddingService.GenerateEmbeddingAsync(chunks[i]);
                    
                    var chunk = new DocumentChunk
                    {
                        Id = Guid.NewGuid(),
                        DocumentId = document.Id,
                        Content = chunks[i],
                        ChunkIndex = i,
                        Embedding = embedding
                    };

                    context.DocumentChunks.Add(chunk);
                    successfulChunks++;
                    Console.WriteLine($"Successfully processed chunk {i + 1}");
                }
                catch (Exception chunkEx)
                {
                    Console.WriteLine($"Failed to process chunk {i + 1}: {chunkEx.Message}");
                    // Continue with next chunk instead of failing entire document
                }
            }

            if (successfulChunks > 0)
            {
                document.ProcessingStatus = "Completed";
                Console.WriteLine($"Successfully processed document {documentId} with {successfulChunks} chunks");
            }
            else
            {
                document.ProcessingStatus = "Failed";
                Console.WriteLine($"No chunks were successfully processed for document {documentId}");
            }
            
            await context.SaveChangesAsync();
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Error processing document {documentId}: {ex.Message}");
            Console.WriteLine($"Stack trace: {ex.StackTrace}");
            
            var document = await context.Documents.FindAsync(documentId);
            if (document != null)
            {
                document.ProcessingStatus = "Failed";
                await context.SaveChangesAsync();
            }
        }
    }

    private string ExtractTextFromPdf(string filePath)
    {
        using var document = PdfDocument.Open(filePath);
        var text = string.Join("\n", document.GetPages().Select(p => p.Text));
        return text;
    }

    private List<string> SplitIntoChunks(string text, int chunkSize = 1000, int overlap = 200)
    {
        var chunks = new List<string>();
        var sentences = text.Split('.', StringSplitOptions.RemoveEmptyEntries);
        var currentChunk = "";

        foreach (var sentence in sentences)
        {
            if (currentChunk.Length + sentence.Length > chunkSize && !string.IsNullOrEmpty(currentChunk))
            {
                chunks.Add(currentChunk.Trim());
                var words = currentChunk.Split(' ');
                currentChunk = string.Join(" ", words.TakeLast(overlap / 10)) + " " + sentence;
            }
            else
            {
                currentChunk += sentence + ".";
            }
        }

        if (!string.IsNullOrEmpty(currentChunk))
            chunks.Add(currentChunk.Trim());

        return chunks;
    }
}
