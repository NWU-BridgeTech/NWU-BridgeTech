using BridgeTech.Api.DTOs.Ai;

namespace BridgeTech.Api.Services.Ai;

public interface IAiService
{
    Task<AiSummaryResponse?> GetSummaryAsync(Guid videoId, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<AiSummaryResponse>> GetLessonSummariesAsync(Guid lessonId, CancellationToken cancellationToken = default);
}
