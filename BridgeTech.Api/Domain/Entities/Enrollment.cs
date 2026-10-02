using BridgeTech.Api.Domain.Enums;

namespace BridgeTech.Api.Domain.Entities;

// Connects a user to a module and tracks their progress through it.
public class Enrollment
{
    public Guid EnrollmentId { get; set; }
    public Guid ModuleId { get; set; }
    public Guid UserId { get; set; }
    public EnrollmentStatus Status { get; set; }
    public short ProgressPercent { get; set; }
    public DateTimeOffset EnrolledAt { get; set; }
    public DateTimeOffset? CompletedAt { get; set; }

    public Module Module { get; set; } = null!;
    public User User { get; set; } = null!;
}