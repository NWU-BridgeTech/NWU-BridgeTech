namespace BridgeTech.Api.Domain.Entities;

public class Badge
{
    public Guid BadgeId { get; set; }
    public Guid UserId { get; set; }
    public Guid LessonId { get; set; }
    public DateTimeOffset AwardedAt { get; set; }

    public User User { get; set; } = null!;
    public Lesson Lesson { get; set; } = null!;
}
