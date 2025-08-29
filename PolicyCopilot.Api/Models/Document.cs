namespace PolicyCopilot.Api.Models;

public class Document
{
    public Guid Id { get; set; }
    public string FileName { get; set; } = string.Empty;
    public string ContentType { get; set; } = string.Empty;
    public long Size { get; set; }
    public DateTime UploadedAt { get; set; }
    public string ProcessingStatus { get; set; } = "Pending";
    public List<DocumentChunk> Chunks { get; set; } = new();
}

public class DocumentChunk
{
    public Guid Id { get; set; }
    public Guid DocumentId { get; set; }
    public string Content { get; set; } = string.Empty;
    public float[] Embedding { get; set; } = Array.Empty<float>();
    public int ChunkIndex { get; set; }
    public Document Document { get; set; } = null!;
}

public class QueryRequest
{
    public string Question { get; set; } = string.Empty;
    public int MaxResults { get; set; } = 5;
}

public class ProcessDocumentRequest
{
    public Guid DocumentId { get; set; }
}

public class QueryResponse
{
    public string Answer { get; set; } = string.Empty;
    public List<RelevantChunk> Sources { get; set; } = [];
    public string Model { get; set; } = string.Empty;
}

public class RelevantChunk
{
    public string Content { get; set; } = string.Empty;
    public string FileName { get; set; } = string.Empty;
    public float Similarity { get; set; }
    public int ChunkIndex { get; set; }
}
