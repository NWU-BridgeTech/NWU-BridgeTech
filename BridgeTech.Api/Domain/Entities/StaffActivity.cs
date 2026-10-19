namespace BridgeTech.Api.Domain.Entities;

public class StaffActivity
{
    public Guid StaffActivityId { get; set; }
    public Guid UserId { get; set; }
    public string ActivityType { get; set; } = null!;
    public DateTimeOffset StartedAt { get; set; }
    public DateTimeOffset? EndedAt { get; set; }
    public string? Location { get; set; }
    public Guid? ModuleId { get; set; }
    public string? ModuleTitle { get; set; }

    public User User { get; set; } = null!;
}
