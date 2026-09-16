using System.ComponentModel.DataAnnotations;
using BridgeTech.Api.Domain.Enums;

namespace BridgeTech.Api.DTOs.Quizzes;

public class QuizResponse
{
    public Guid QuizId { get; set; }
    public Guid ModuleId { get; set; }
    public string Title { get; set; } = string.Empty;
    public short PassingScore { get; set; }
    public DateTimeOffset CreatedAt { get; set; }
}

public class CreateQuizRequest
{
    [Required]
    public Guid? ModuleId { get; set; }

    [Required]
    [StringLength(200, MinimumLength = 3)]
    public string Title { get; set; } = string.Empty;

    [Range(0, 100)]
    public short PassingScore { get; set; } = 70;
}

public class UpdateQuizRequest
{
    [StringLength(200, MinimumLength = 3)]
    public string? Title { get; set; }

    [Range(0, 100)]
    public short? PassingScore { get; set; }
}

public class QuizListItemResponse
{
    public Guid QuizId { get; set; }
    public Guid ModuleId { get; set; }
    public string Title { get; set; } = string.Empty;
    public short PassingScore { get; set; }
    public DateTimeOffset CreatedAt { get; set; }
}

public class QuizQuestionResponse
{
    public Guid QuestionId { get; set; }
    public Guid QuizId { get; set; }
    public string QuestionText { get; set; } = string.Empty;
    public QuestionType QuestionType { get; set; }
    public short OrderIndex { get; set; }
    public List<QuizOptionResponse> Options { get; set; } = new();
}

public class QuizQuestionAdmin
{
    public Guid? QuestionId { get; set; }
    public Guid QuizId { get; set; }
    public string QuestionText { get; set; } = string.Empty;
    public QuestionType QuestionType { get; set; }
    public short OrderIndex { get; set; }
    public List<QuizOptionAdmin> Options { get; set; } = new();
}

public class CreateQuizQuestionRequest
{
    [Required]
    public Guid QuizId { get; set; }

    [Required]
    [StringLength(500, MinimumLength = 3)]
    public string QuestionText { get; set; } = string.Empty;

    [Required]
    public QuestionType QuestionType { get; set; }

    [Range(0, short.MaxValue)]
    public short OrderIndex { get; set; }
}

public class UpdateQuizQuestionRequest
{
    [StringLength(500, MinimumLength = 3)]
    public string? QuestionText { get; set; }

    public QuestionType? QuestionType { get; set; }

    [Range(0, short.MaxValue)]
    public short? OrderIndex { get; set; }
}

public class QuizOptionResponse
{
    public Guid QuestionId { get; set; }
    public string OptionText { get; set; } = string.Empty;
    public short OrderIndex { get; set; }
}

public class QuizOptionAdmin
{
    public Guid OptionId { get; set; }
    public Guid QuizId { get; set; }
    public Guid QuestionId { get; set; }
    public string OptionText { get; set; } = string.Empty;
    public bool IsCorrect { get; set; }
    public short OrderIndex { get; set; }
}

public class CreateQuizOptionRequest
{
    [Required]
    public Guid? QuizId { get; set; }

    [Required]
    public Guid? QuestionId { get; set; }

    [Required]
    [StringLength(500, MinimumLength = 1)]
    public string OptionText { get; set; } = string.Empty;

    public bool IsCorrect { get; set; }

    [Range(0, short.MaxValue)]
    public short OrderIndex { get; set; }
}

public class UpdateQuizOptionRequest
{
    [StringLength(500, MinimumLength = 1)]
    public string? OptionText { get; set; }
    public bool? IsCorrect { get; set; }
    
    [Range(0, short.MaxValue)]
    public short? OrderIndex { get; set; }
}

public class QuizAttemptResponse
{
    public Guid AttemptId { get; set; }
    public Guid UserId { get; set; }
    public Guid QuizId { get; set; }
    public short? Score { get; set; }
    public bool? Passed { get; set; }
    public DateTimeOffset StartedAt { get; set; }
    public DateTimeOffset? CompletedAt { get; set; }
}

public class CreateQuizAttemptRequest
{
    [Required]
    public Guid? QuizId { get; set; }

    public DateTimeOffset StartedAt { get; set; } = DateTimeOffset.UtcNow;
}

public class SubmitQuizAttemptRequest
{
    [Required]
    public Guid? AttemptId { get; set; }

    [Required]
    public List<QuizAnswerSubmissionRequest> Answers { get; set; } = new();
}

public class QuizAnswerSubmissionRequest
{
    [Required]
    public Guid? QuestionId { get; set; }

    [Required]
    public Guid OptionId { get; set; }
}

public class QuizAnswerResponse
{
    public Guid AnswerId { get; set; }
    public Guid AttemptId { get; set; }
    public Guid QuestionId { get; set; }
    public Guid OptionId { get; set; }
    public bool IsCorrect { get; set; }
}
