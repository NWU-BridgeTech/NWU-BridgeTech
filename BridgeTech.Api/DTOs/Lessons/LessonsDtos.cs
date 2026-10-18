using System.ComponentModel.DataAnnotations;

namespace BridgeTech.Api.DTOs.Lessons;

public class LessonResponse
{
    public Guid LessonId { get; set; }
    public Guid ModuleId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string? Content { get; set; }
    public short OrderIndex { get; set; }
    public DateTimeOffset CreatedAt { get; set; }
    public DateTimeOffset UpdatedAt { get; set; }
    public string? VideoUrl { get; set; }
    public string? AiSummary { get; set; }
    public bool Completed { get; set; }
}

// Full lesson details returned to admins for the admin Lessons table.
public class AdminLessonResponse
{
    public Guid LessonId { get; set; }
    public Guid ModuleId { get; set; }
    public string ModuleTitle { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string? Content { get; set; }
    public short OrderIndex { get; set; }
    public short DurationMinutes { get; set; }
    public string Status { get; set; } = string.Empty;
    public string? VideoUrl { get; set; }
    public DateTimeOffset CreatedAt { get; set; }
    public DateTimeOffset UpdatedAt { get; set; }
}

public class LessonListItemResponse
{
    public Guid LessonId { get; set; }
    public string Title { get; set; } = string.Empty;
    public short OrderIndex { get; set; }
    public bool Completed { get; set; }
}

public class CreateLessonRequest
{
    [Required]
    [StringLength(200, MinimumLength = 3)]
    public string Title { get; set; } = string.Empty;

    [StringLength(500)]
    public string? Description { get; set; }

    public string? Content { get; set; }

    // Optional. When left out, the lesson is placed after the module's existing lessons.
    [Range(1, short.MaxValue)]
    public short? OrderIndex { get; set; }

    [Range(1, 600)]
    public short DurationMinutes { get; set; }

    [RegularExpression("^(Draft|Published)$",
        ErrorMessage = "Status must be Draft or Published.")]
    public string Status { get; set; } = "Draft";

    [Url]
    public string? VideoUrl { get; set; }
}

// Every field is optional: only the fields that are sent get updated.
public class UpdateLessonRequest
{
    // Send a different module id to move the lesson to that module.
    public Guid? ModuleId { get; set; }

    [StringLength(200, MinimumLength = 3)]
    public string? Title { get; set; }

    [StringLength(500)]
    public string? Description { get; set; }

    public string? Content { get; set; }

    [Range(1, short.MaxValue)]
    public short? OrderIndex { get; set; }

    [Range(1, 600)]
    public short? DurationMinutes { get; set; }

    [RegularExpression("^(Draft|Published)$",
        ErrorMessage = "Status must be Draft or Published.")]
    public string? Status { get; set; }

    [Url]
    public string? VideoUrl { get; set; }
}

public class LessonProgressResponse
{
    public Guid LessonId { get; set; }
    public bool Completed { get; set; }
    public DateTimeOffset? CompletedAt { get; set; }
    public short ModuleProgressPercent { get; set; }
    public string ModuleStatus { get; set; } = string.Empty;
}

public class LessonQuizInfo
{
    public Guid QuizId { get; set; }
    public string Title { get; set; } = string.Empty;
    public short PassingScore { get; set; }
    public short? BestScore { get; set; }
    public bool Passed { get; set; }
}

public class LessonViewResponse
{
    public Guid LessonId { get; set; }
    public Guid ModuleId { get; set; }
    public string ModuleTitle { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string? Content { get; set; }
    public int LessonNumber { get; set; }
    public int LessonTotal { get; set; }
    public string? VideoUrl { get; set; }
    public string? AiSummary { get; set; }
    public bool Completed { get; set; }
    public bool CanComplete { get; set; }   // quiz passed (or lesson has no quiz)
    public Guid? PreviousLessonId { get; set; }
    public Guid? NextLessonId { get; set; }
    public LessonQuizInfo? Quiz { get; set; }
}