using System.ComponentModel.DataAnnotations;
using BridgeTech.Api.Domain.Enums;

namespace BridgeTech.Api.DTOs.Enrollments;

public class EnrollRequest
{
    [Required]
    public Guid ModuleId { get; set; }
}

public class EnrollmentResponse
{
    public Guid EnrollmentId { get; set; }
    public Guid ModuleId { get; set; }
    public string ModuleTitle { get; set; } = string.Empty;
    public EnrollmentStatus Status { get; set; }
    public short ProgressPercent { get; set; }
    public DateTimeOffset EnrolledAt { get; set; }
    public DateTimeOffset? CompletedAt { get; set; }
}