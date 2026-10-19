
using BridgeTech.Api.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace BridgeTech.Api.Controllers;

[ApiController]
[Route("api/lessons/{lessonId:guid}/video-url")]
[Authorize(Roles = "Instructor,Admin,SuperAdmin")]
public class LessonVideoUrlsController(
    AppDbContext db) : ControllerBase
{
    public sealed class VideoUrlRequest
    {
        public string? VideoUrl { get; set; }
    }

    [HttpGet]
    public async Task<IActionResult> Get(
        Guid lessonId,
        CancellationToken ct)
    {
        var exists = await db.Lessons
            .AnyAsync(x => x.LessonId == lessonId, ct);

        if (!exists)
            return NotFound();

        var url = await db.Database
            .SqlQueryRaw<string>(
                """
                SELECT video_url AS "Value"
                FROM public.video_summaries
                WHERE lesson_id = {0}
                """,
                lessonId)
            .FirstOrDefaultAsync(ct);

        return Ok(new { videoUrl = url ?? "" });
    }

    [HttpPut]
    public async Task<IActionResult> Save(
        Guid lessonId,
        [FromBody] VideoUrlRequest request,
        CancellationToken ct)
    {
        var exists = await db.Lessons
            .AnyAsync(x => x.LessonId == lessonId, ct);

        if (!exists)
            return NotFound("Lesson not found.");

        var url = request.VideoUrl?.Trim() ?? "";

        if (!string.IsNullOrEmpty(url))
        {
            if (url.Length > 2000 ||
                !Uri.TryCreate(
                    url,
                    UriKind.Absolute,
                    out var parsedUrl) ||
                (parsedUrl.Scheme != Uri.UriSchemeHttp &&
                 parsedUrl.Scheme != Uri.UriSchemeHttps))
            {
                return BadRequest(
                    "Enter a valid HTTP or HTTPS video URL."
                );
            }

            await db.Database.ExecuteSqlInterpolatedAsync(
                $"""
                INSERT INTO public.video_summaries
                    (video_id, lesson_id, video_url)
                VALUES
                    (gen_random_uuid(), {lessonId}, {url})
                ON CONFLICT (lesson_id)
                DO UPDATE SET video_url = EXCLUDED.video_url
                """,
                ct);
        }
        else
        {
            await db.Database.ExecuteSqlInterpolatedAsync(
                $"""
                DELETE FROM public.video_summaries
                WHERE lesson_id = {lessonId}
                """,
                ct);
        }

        return Ok(new { videoUrl = url });
    }
}
