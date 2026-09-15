namespace BridgeTech.Api.Domain.Entities;

// One selectable answer belonging to a quiz question.
public class QuizOption
{
    public Guid OptionId { get; set; }
    public Guid QuizId { get; set; }
    public Guid QuestionId { get; set; }
    public string OptionText { get; set; } = null!;
    public bool IsCorrect { get; set; }
    public short OrderIndex { get; set; }

    public Quiz Quiz { get; set; } = null!;
    public QuizQuestion Question { get; set; } = null!;
    public ICollection<QuizAnswer> Answers { get; set; } = new List<QuizAnswer>();
}