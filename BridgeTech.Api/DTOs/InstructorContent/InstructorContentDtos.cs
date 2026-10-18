using System.ComponentModel.DataAnnotations;
using BridgeTech.Api.Domain.Enums;
using BridgeTech.Api.DTOs.Modules;

namespace BridgeTech.Api.DTOs.InstructorContent;

public sealed class InstructorModuleResponse
{
    public Guid ModuleId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string Level { get; set; } = "Beginner";
    public string Status { get; set; } = "Draft";
    public int LessonCount { get; set; }
    public int PublishedLessonCount { get; set; }
    public int StudentCount { get; set; }
}

public sealed class CreateInstructorModuleRequest
{
    [Required, StringLength(200, MinimumLength = 3)]
    public string Title { get; set; } = string.Empty;

    [StringLength(2000)]
    public string? Description { get; set; }
}

public sealed class InstructorModuleContentResponse
{
    public Guid ModuleId { get; set; }
    public string ModuleTitle { get; set; } = string.Empty;
    public string ModuleStatus { get; set; } = "Draft";
    public int TotalLessons { get; set; }
    public int AttachedQuizzes { get; set; }
    public double? AverageQuizScore { get; set; }
    public int ModuleExerciseCount { get; set; }
    public IReadOnlyList<InstructorExerciseResponse> Exercises { get; set; } = [];
    public IReadOnlyList<InstructorLessonResponse> Lessons { get; set; } = [];
}

public sealed class InstructorExerciseResponse
{
    public Guid ExerciseId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string? Instructions { get; set; }
    public string? Outcomes { get; set; }
}

public sealed class InstructorLessonResponse
{
    public Guid LessonId { get; set; }
    public Guid ModuleId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string? Content { get; set; }
    public string? VideoUrl { get; set; }
    public short OrderIndex { get; set; }
    public short DurationMinutes { get; set; }
    public string Status { get; set; } = "Draft";
    public IReadOnlyList<InstructorQuizPreviewResponse> Quizzes { get; set; } = [];
}

public sealed class InstructorQuizPreviewResponse
{
    public Guid QuizId { get; set; }
    public string Title { get; set; } = string.Empty;
    public int QuestionCount { get; set; }
    public double? AverageScore { get; set; }
    public IReadOnlyList<InstructorQuizQuestionResponse> Questions { get; set; } = [];
}

public sealed class InstructorQuizQuestionResponse
{
    public string QuestionText { get; set; } = string.Empty;
    public IReadOnlyList<InstructorQuizOptionResponse> Options { get; set; } = [];
}

public sealed class InstructorQuizOptionResponse
{
    public string Text { get; set; } = string.Empty;
    public bool IsCorrect { get; set; }
}

public sealed class SaveInstructorLessonRequest
{
    [Required, StringLength(100, MinimumLength = 3)]
    public string Title { get; set; } = string.Empty;

    [StringLength(500)]
    public string? Description { get; set; }

    public string? Content { get; set; }

    [Range(1, 600)]
    public short DurationMinutes { get; set; } = 20;

    [Required]
    public string Status { get; set; } = "Draft";

    [StringLength(500), Url]
    public string? VideoUrl { get; set; }
}

public sealed class AddInstructorQuizRequest
{
    [Required, StringLength(200, MinimumLength = 3)]
    public string Title { get; set; } = string.Empty;

    [Range(0, 100)]
    public short PassingScore { get; set; } = 70;

    [Required, MinLength(1)]
    public List<InstructorQuizQuestionRequest> Questions { get; set; } = [];
}

public sealed class InstructorQuizQuestionRequest
{
    [Required, StringLength(500, MinimumLength = 3)]
    public string QuestionText { get; set; } = string.Empty;

    [Required, MinLength(2)]
    public List<InstructorQuizOptionRequest> Options { get; set; } = [];
}

public sealed class InstructorQuizOptionRequest
{
    [Required, StringLength(500, MinimumLength = 1)]
    public string Text { get; set; } = string.Empty;

    public bool IsCorrect { get; set; }
}

public sealed class AddInstructorExerciseRequest
{
    [Required, StringLength(200, MinimumLength = 3)]
    public string Title { get; set; } = string.Empty;

    [StringLength(10000)]
    public string? Instructions { get; set; }

    [StringLength(5000)]
    public string? Outcomes { get; set; }
}
