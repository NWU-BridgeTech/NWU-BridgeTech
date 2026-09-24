using BridgeTech.Api.Data;
using BridgeTech.Api.DTOs.Ai;
using Microsoft.EntityFrameworkCore;

namespace BridgeTech.Api.Services.Ai;

public sealed class AiService(AppDbContext db) : IAiService
{
    public Task<AiSummaryResponse?> GetSummaryAsync(
        Guid id,
        CancellationToken ct = default) =>
        db.VideoSummaries
            .AsNoTracking()
            .Where(x => x.VideoId == id)
            .Select(x => new AiSummaryResponse
            {
                VideoId = x.VideoId,
                LessonId = x.LessonId,
                VideoUrl = x.VideoUrl,
                Transcript = x.Transcript,
                AiSummary = x.AiSummary,
                GeneratedAt = x.GeneratedAt
            })
            .SingleOrDefaultAsync(ct);

    public async Task<IReadOnlyList<AiSummaryResponse>> GetLessonSummariesAsync(
        Guid id,
        CancellationToken ct = default) =>
        await db.VideoSummaries
            .AsNoTracking()
            .Where(x => x.LessonId == id)
            .OrderByDescending(x => x.GeneratedAt)
            .Select(x => new AiSummaryResponse
            {
                VideoId = x.VideoId,
                LessonId = x.LessonId,
                VideoUrl = x.VideoUrl,
                Transcript = x.Transcript,
                AiSummary = x.AiSummary,
                GeneratedAt = x.GeneratedAt
            })
            .ToListAsync(ct);
}
