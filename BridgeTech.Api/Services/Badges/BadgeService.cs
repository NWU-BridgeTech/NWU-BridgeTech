using BridgeTech.Api.Data;
using BridgeTech.Api.Domain.Entities;
using BridgeTech.Api.DTOs.Badges;
using Microsoft.EntityFrameworkCore;

namespace BridgeTech.Api.Services.Badges;

public sealed class BadgeService(AppDbContext db) : IBadgeService
{
    public async Task<BadgeResponse> AwardForLessonCompletionAsync(
        Guid userId, Guid lessonId, CancellationToken cancellationToken = default)
    {
        var existing = await Query()
            .SingleOrDefaultAsync(x => x.UserId == userId && x.LessonId == lessonId, cancellationToken);

        if (existing is not null)
        {
            return ToResponse(existing);
        }

        var lesson = await db.Lessons
            .AsNoTracking()
            .Include(x => x.Module)
            .SingleAsync(x => x.LessonId == lessonId, cancellationToken);

        var badge = new Badge
        {
            BadgeId = Guid.NewGuid(),
            UserId = userId,
            LessonId = lessonId,
            AwardedAt = DateTimeOffset.UtcNow,
            Lesson = lesson
        };

        db.Badges.Add(badge);
        await db.SaveChangesAsync(cancellationToken);
        badge.Lesson = lesson;

        return ToResponse(badge);
    }

    public async Task<IReadOnlyList<BadgeResponse>> GetByUserAsync(
        Guid userId, CancellationToken cancellationToken = default) =>
        (await Query()
            .Where(x => x.UserId == userId)
            .OrderByDescending(x => x.AwardedAt)
            .ToListAsync(cancellationToken))
        .Select(ToResponse)
        .ToList();

    private IQueryable<Badge> Query() => db.Badges
        .AsNoTracking()
        .Include(x => x.Lesson)
        .ThenInclude(x => x.Module);

    private static BadgeResponse ToResponse(Badge badge) => new()
    {
        BadgeId = badge.BadgeId,
        UserId = badge.UserId,
        LessonId = badge.LessonId,
        ModuleId = badge.Lesson.ModuleId,
        ConceptTitle = badge.Lesson.Title,
        ModuleTitle = badge.Lesson.Module.Title,
        AwardedAt = badge.AwardedAt
    };
}
