using PolicyCopilot.Api.Models;

namespace PolicyCopilot.Api.Services;

public interface IDocumentService
{
    Task<Document> UploadDocumentAsync(IFormFile file);
    Task<List<Document>> GetDocumentsAsync();
    Task ProcessDocumentInBackgroundAsync(Guid documentId);
}

public interface IEmbeddingService
{
    Task<float[]> GenerateEmbeddingAsync(string text);
    Task<List<RelevantChunk>> FindSimilarChunksAsync(string query, int maxResults = 5);
}

public interface IRagService
{
    Task<QueryResponse> ProcessQueryAsync(QueryRequest request);
}
