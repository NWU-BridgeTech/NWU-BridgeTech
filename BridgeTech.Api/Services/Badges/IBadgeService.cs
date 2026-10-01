using BridgeTech.Api.DTOs.Badges;

namespace BridgeTech.Api.Services.Badges;

public interface IBadgeService
{
    Task<BadgeResponse> AwardForLessonCompletionAsync(Guid userId, Guid lessonId, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<BadgeResponse>> GetByUserAsync(Guid userId, CancellationToken cancellationToken = default);
}
