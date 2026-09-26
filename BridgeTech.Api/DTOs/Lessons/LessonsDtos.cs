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

    public string? Content { get; set; }

    [Required]
    [Range(1, 6)]
    public short OrderIndex { get; set; }

    [Url]
    public string? VideoUrl { get; set; }
}

public class UpdateLessonRequest
{
    [StringLength(200, MinimumLength = 3)]
    public string? Title { get; set; }

    public string? Content { get; set; }

    [Range(1, 6)]
    public short? OrderIndex { get; set; }

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