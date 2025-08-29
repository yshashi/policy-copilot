using Microsoft.AspNetCore.Mvc;
using PolicyCopilot.Api.Services;
using PolicyCopilot.Api.Data;
using Microsoft.EntityFrameworkCore;

namespace PolicyCopilot.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class TestController : ControllerBase
{
    private readonly IEmbeddingService _embeddingService;
    private readonly IDocumentService _documentService;
    private readonly ApplicationDbContext _context;

    public TestController(IEmbeddingService embeddingService, IDocumentService documentService, ApplicationDbContext context)
    {
        _embeddingService = embeddingService;
        _documentService = documentService;
        _context = context;
    }

    [HttpGet("embedding")]
    public async Task<ActionResult> TestEmbedding()
    {
        try
        {
            var embedding = await _embeddingService.GenerateEmbeddingAsync("Hello world");
            return Ok(new { success = true, embeddingLength = embedding.Length });
        }
        catch (Exception ex)
        {
            return BadRequest(new { error = ex.Message, innerError = ex.InnerException?.Message });
        }
    }

    [HttpPost("process-documents")]
    public async Task<ActionResult> ProcessPendingDocuments()
    {
        try
        {
            var pendingDocs = await _context.Documents
                .Where(d => d.ProcessingStatus == "Uploaded" || d.ProcessingStatus == "Processing")
                .ToListAsync();

            foreach (var doc in pendingDocs)
            {
                await _documentService.ProcessDocumentInBackgroundAsync(doc.Id);
            }

            return Ok(new { message = $"Processed {pendingDocs.Count} documents", documents = pendingDocs.Select(d => new { d.Id, d.FileName, d.ProcessingStatus }) });
        }
        catch (Exception ex)
        {
            return BadRequest(new { error = ex.Message, innerError = ex.InnerException?.Message });
        }
    }

    [HttpGet("chunks")]
    public async Task<ActionResult> GetChunks()
    {
        var chunks = await _context.DocumentChunks
            .Include(c => c.Document)
            .Select(c => new { c.Id, c.DocumentId, DocumentName = c.Document.FileName, c.ChunkIndex, ContentPreview = c.Content.Substring(0, Math.Min(100, c.Content.Length)) })
            .ToListAsync();

        return Ok(new { chunkCount = chunks.Count, chunks });
    }
}
