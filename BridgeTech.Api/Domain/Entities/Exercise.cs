using System.Text.Json;
using BridgeTech.Api.Domain.Enums;

namespace BridgeTech.Api.Domain.Entities;

// A practical coding task whose completion is verified through GitHub criteria.
public class Exercise
{
    public Guid ExerciseId { get; set; }
    public Guid ModuleId { get; set; }
    public string Title { get; set; } = null!;
    public string? Description { get; set; }
    public VerificationType VerificationType { get; set; }
    public JsonDocument? VerificationCriteria { get; set; }
    public DateTimeOffset CreatedAt { get; set; }

    public Module Module { get; set; } = null!;
    public ICollection<ExerciseSubmission> Submissions { get; set; } = new List<ExerciseSubmission>();
}