namespace BridgeTech.Api.DTOs.Badges;

public class BadgeResponse
{
    public Guid BadgeId { get; set; }
    public Guid UserId { get; set; }
    public Guid LessonId { get; set; }
    public Guid ModuleId { get; set; }
    public string ConceptTitle { get; set; } = string.Empty;
    public string ModuleTitle { get; set; } = string.Empty;
    public DateTimeOffset AwardedAt { get; set; }
}
