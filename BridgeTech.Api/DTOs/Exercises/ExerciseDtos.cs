using System.ComponentModel.DataAnnotations;
using System.Text.Json;
using BridgeTech.Api.Domain.Enums;

namespace BridgeTech.Api.DTOs.Exercises;

public class ExerciseResponse
{
    public Guid ExerciseId { get; set; }
    public Guid ModuleId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public VerificationType VerificationType { get; set; }
    public JsonElement? VerificationCriteria { get; set; }
    public DateTimeOffset CreatedAt { get; set; }
    public int ProgressPercentage { get; set; }
}

public class CreateExerciseRequest
{
    [Required]
    public Guid ModuleId { get; set; }

    [Required]
    [StringLength(200, MinimumLength = 3)]
    public string Title { get; set; } = string.Empty;

    [StringLength(2000)]
    public string? Description { get; set; }

    [Required]
    public VerificationType VerificationType { get; set; }

    public JsonElement? VerificationCriteria { get; set; }
}

public class UpdateExerciseRequest
{
    [StringLength(200, MinimumLength = 3)]
    public string? Title { get; set; }

    [StringLength(2000)]
    public string? Description { get; set; }

    public VerificationType? VerificationType { get; set; }

    public JsonElement? VerificationCriteria { get; set; }
}

public class ExerciseListItemResponse
{
    public Guid ExerciseId { get; set; }
    public Guid ModuleId { get; set; }
    public string Title { get; set; } = string.Empty;
    public VerificationType VerificationType { get; set; }
    public DateTimeOffset CreatedAt { get; set; }
}
