using BridgeTech.Api.Data;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace BridgeTech.Api.Controllers;

[ApiController]
[Route("api/ai-summaries")]
// Reads AI-generated summaries associated with lesson videos.
public class AiSummariesController(AppDbContext dbContext) : ControllerBase
{
    [HttpGet("{videoId:guid}")]
    // Returns the latest stored content for a specific video record.
    public async Task<IActionResult> GetSummary(Guid videoId, CancellationToken cancellationToken)
    {
        var summary = await dbContext.VideoSummaries
            .AsNoTracking()
            .Where(candidate => candidate.VideoId == videoId)
            .Select(candidate => new
            {
                candidate.VideoId,
                candidate.LessonId,
                candidate.VideoUrl,
                candidate.Transcript,
                candidate.AiSummary,
                candidate.GeneratedAt
            })
            .SingleOrDefaultAsync(cancellationToken);

        return summary is null ? NotFound() : Ok(summary);
    }

    [HttpGet("lesson/{lessonId:guid}")]
    // Lists all summaries belonging to a lesson, newest first.
    public async Task<IActionResult> GetLessonSummaries(Guid lessonId, CancellationToken cancellationToken)
    {
        var summaries = await dbContext.VideoSummaries
            .AsNoTracking()
            .Where(summary => summary.LessonId == lessonId)
            .OrderByDescending(summary => summary.GeneratedAt)
            .Select(summary => new
            {
                summary.VideoId,
                summary.LessonId,
                summary.VideoUrl,
                summary.Transcript,
                summary.AiSummary,
                summary.GeneratedAt
            })
            .ToListAsync(cancellationToken);

        return Ok(summaries);
    }
}