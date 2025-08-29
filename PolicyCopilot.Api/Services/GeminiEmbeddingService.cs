using Microsoft.EntityFrameworkCore;
using PolicyCopilot.Api.Data;
using PolicyCopilot.Api.Models;
using System.Text;
using System.Text.Json;

namespace PolicyCopilot.Api.Services;

public class GeminiEmbeddingService : IEmbeddingService
{
    private readonly HttpClient _httpClient;
    private readonly ApplicationDbContext _context;
    private readonly string _apiKey;
    private readonly string _baseUrl = "https://generativelanguage.googleapis.com/v1beta";

     public GeminiEmbeddingService(HttpClient httpClient, ApplicationDbContext context, IConfiguration configuration)
    {
        _httpClient = httpClient ?? throw new ArgumentNullException(nameof(httpClient));
        _httpClient.Timeout = TimeSpan.FromSeconds(30);
        _context = context ?? throw new ArgumentNullException(nameof(context));
        _apiKey = configuration.GetValue<string>("GeminiApiKey") 
                  ?? throw new InvalidOperationException("GeminiApiKey not configured");
    }

    public async Task<float[]> GenerateEmbeddingAsync(string text)
    {
        try
        {
            var request = new
            {
                content = new { parts = new[] { new { text } } }
            };

            var json = JsonSerializer.Serialize(request);
            var content = new StringContent(json, Encoding.UTF8, "application/json");

            var response = await _httpClient.PostAsync($"{_baseUrl}/models/text-embedding-004:embedContent?key={_apiKey}", content);
            
            if (!response.IsSuccessStatusCode)
            {
                var errorContent = await response.Content.ReadAsStringAsync();
                throw new HttpRequestException($"Gemini API error: {response.StatusCode} - {errorContent}");
            }

            var responseJson = await response.Content.ReadAsStringAsync();
            var result = JsonSerializer.Deserialize<JsonElement>(responseJson);
            
            var embedding = result.GetProperty("embedding").GetProperty("values").EnumerateArray()
                .Select(x => (float)x.GetDouble()).ToArray();

            return embedding;
        }
        catch (Exception ex)
        {
            throw new InvalidOperationException($"Failed to generate embedding: {ex.Message}", ex);
        }
    }

    public async Task<List<RelevantChunk>> FindSimilarChunksAsync(string query, int maxResults = 5)
    {
        var chunks = await _context.DocumentChunks
            .Include(c => c.Document)
            .Where(c => c.Embedding.Length > 0)
            .ToListAsync();

        if (chunks.Count == 0)
        {
            return [];
        }

        var queryEmbedding = await GenerateEmbeddingAsync(query);

        var similarities = chunks.Select(chunk => new
        {
            Chunk = chunk,
            Similarity = CosineSimilarity(queryEmbedding, chunk.Embedding)
        })
        .OrderByDescending(x => x.Similarity)
        .Take(maxResults)
        .ToList();

        return similarities.Select(s => new RelevantChunk
        {
            Content = s.Chunk.Content,
            FileName = s.Chunk.Document.FileName,
            Similarity = s.Similarity,
            ChunkIndex = s.Chunk.ChunkIndex
        }).ToList();
    }

    private static float CosineSimilarity(float[] a, float[] b)
    {
        if (a.Length != b.Length) return 0;

        var dotProduct = a.Zip(b, (x, y) => x * y).Sum();
        var magnitudeA = Math.Sqrt(a.Sum(x => x * x));
        var magnitudeB = Math.Sqrt(b.Sum(x => x * x));

        return (float)(dotProduct / (magnitudeA * magnitudeB));
    }
}
