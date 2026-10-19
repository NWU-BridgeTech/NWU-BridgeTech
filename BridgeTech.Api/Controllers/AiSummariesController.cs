using BridgeTech.Api.Services.Ai;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace BridgeTech.Api.Controllers;

[ApiController]
[Route("api/ai-summaries")]
[Authorize]
// Reads AI-generated summaries associated with lesson videos.
public class AiSummariesController(IAiService service) : ControllerBase
{
    [HttpGet("{videoId:guid}")]
    // Returns the latest stored content for a specific video record.
    public async Task<IActionResult> GetSummary(Guid videoId, CancellationToken cancellationToken)
    {
        var summary = await service.GetSummaryAsync(videoId, cancellationToken);

        return summary is null ? NotFound() : Ok(summary);
    }

    [HttpGet("lesson/{lessonId:guid}")]
    // Lists all summaries belonging to a lesson, newest first.
    public async Task<IActionResult> GetLessonSummaries(Guid lessonId, CancellationToken cancellationToken)
    {
        var summaries = await service.GetLessonSummariesAsync(lessonId, cancellationToken);

        return Ok(summaries);
    }
}