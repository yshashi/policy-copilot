using Microsoft.AspNetCore.Mvc;
using PolicyCopilot.Api.Models;
using PolicyCopilot.Api.Services;

namespace PolicyCopilot.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class DocumentsController(IDocumentService documentService) : ControllerBase
{
    [HttpPost("upload")]
    public async Task<ActionResult<Document>> UploadDocument(IFormFile file)
    {
        if (file == null || file.Length == 0)
            return BadRequest("No file provided");

        if (!file.ContentType.Equals("application/pdf", StringComparison.OrdinalIgnoreCase))
            return BadRequest("Only PDF files are supported");

        var document = await documentService.UploadDocumentAsync(file);
        return Ok(document);
    }

    [HttpGet]
    public async Task<ActionResult<List<Document>>> GetDocuments()
    {
        var documents = await documentService.GetDocumentsAsync();
        return Ok(documents);
    }

    [HttpPost("process")]
    public async Task<ActionResult> ProcessDocument([FromBody] ProcessDocumentRequest request)
    {
        await documentService.ProcessDocumentInBackgroundAsync(request.DocumentId);
        return Ok();
    }
}


