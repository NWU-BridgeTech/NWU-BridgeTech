namespace BridgeTech.Api.Domain.Entities;

// Stores the option selected for a question and the result of grading it.
public class QuizAnswer
{
    public Guid AnswerId { get; set; }
    public Guid AttemptId { get; set; }
    public Guid QuestionId { get; set; }
    public Guid OptionId { get; set; }
    public bool IsCorrect { get; set; }

    public QuizAttempt Attempt { get; set; } = null!;
    public QuizQuestion Question { get; set; } = null!;
    public QuizOption Option { get; set; } = null!;
}