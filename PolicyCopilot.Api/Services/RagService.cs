using PolicyCopilot.Api.Models;
using System.Text;
using System.Text.Json;

namespace PolicyCopilot.Api.Services;

public class RagService : IRagService
{
    private readonly IEmbeddingService _embeddingService;
    private readonly HttpClient _httpClient;
    private readonly string _apiKey;
    private readonly string _baseUrl = "https://generativelanguage.googleapis.com/v1beta";

    public RagService(IEmbeddingService embeddingService, HttpClient httpClient, IConfiguration configuration)
    {
        _embeddingService = embeddingService;
        _httpClient = httpClient;
        _apiKey = configuration.GetValue<string>("GeminiApiKey") ?? throw new InvalidOperationException("GeminiApiKey not configured");
    }

    public async Task<QueryResponse> ProcessQueryAsync(QueryRequest request)
    {
        try
        {
            var relevantChunks = await _embeddingService.FindSimilarChunksAsync(request.Question, request.MaxResults);

            if (relevantChunks.Count == 0)
            {
                return new QueryResponse
                {
                    Answer = "I don't have any processed documents to answer your question. Please upload and wait for documents to be processed first.",
                    Sources = new List<RelevantChunk>(),
                    Model = "system"
                };
            }

            var context = string.Join("\n\n", relevantChunks.Select(c =>
                $"Source: {c.FileName} (Chunk {c.ChunkIndex})\nContent: {c.Content}"));

            var prompt = $@"You are a helpful assistant that answers questions based on the provided document context. 
Use only the information from the context to answer the question. If the answer cannot be found in the context, say so.

Context:
{context}

Question: {request.Question}

Answer:";

            var answer = await GenerateAnswerAsync(prompt);

            return new QueryResponse
            {
                Answer = answer,
                Sources = relevantChunks,
                Model = "gemini-2.0-flash"
            };
        }
        catch (Exception ex)
        {
            return new QueryResponse
            {
                Answer = $"Sorry, I encountered an error processing your question: {ex.Message}",
                Sources = [],
                Model = "error"
            };
        }
    }

    private async Task<string> GenerateAnswerAsync(string prompt)
    {
        try
        {
            var request = new
            {
                contents = new[]
                {
                    new
                    {
                        parts = new[] { new { text = prompt } }
                    }
                },
                generationConfig = new
                {
                    temperature = 0.1,
                    maxOutputTokens = 1000
                }
            };

            var json = JsonSerializer.Serialize(request);
            var content = new StringContent(json, Encoding.UTF8, "application/json");

            var response = await _httpClient.PostAsync($"{_baseUrl}/models/gemini-1.5-flash:generateContent?key={_apiKey}", content);

            if (!response.IsSuccessStatusCode)
            {
                var errorContent = await response.Content.ReadAsStringAsync();
                throw new HttpRequestException($"Gemini API error: {response.StatusCode} - {errorContent}");
            }

            var responseJson = await response.Content.ReadAsStringAsync();
            var result = JsonSerializer.Deserialize<JsonElement>(responseJson);

            return result.GetProperty("candidates")[0]
                .GetProperty("content")
                .GetProperty("parts")[0]
                .GetProperty("text")
                .GetString() ?? "No response generated";
        }
        catch (Exception ex)
        {
            throw new InvalidOperationException($"Failed to generate answer: {ex.Message}", ex);
        }
    }
}
