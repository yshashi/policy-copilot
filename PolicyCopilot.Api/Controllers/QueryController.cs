using Microsoft.AspNetCore.Mvc;
using PolicyCopilot.Api.Models;
using PolicyCopilot.Api.Services;

namespace PolicyCopilot.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class QueryController(IRagService ragService) : ControllerBase
{

    [HttpPost]
    public async Task<ActionResult<QueryResponse>> ProcessQuery([FromBody] QueryRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Question))
            return BadRequest("Question is required");

        try
        {
            var response = await ragService.ProcessQueryAsync(request);
            return Ok(response);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
        catch (HttpRequestException ex)
        {
            return StatusCode(502, new { error = "External API error", details = ex.Message });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { error = "Internal server error", details = ex.Message });
        }
    }
}
