using BridgeTech.Api.Domain.Enums;

namespace BridgeTech.Api.Domain.Entities;

// A single question within a quiz, with ordered answer options.
public class QuizQuestion
{
    public Guid QuestionId { get; set; }
    public Guid QuizId { get; set; }
    public string QuestionText { get; set; } = null!;
    public QuestionType QuestionType { get; set; }
    public short OrderIndex { get; set; }

    public Quiz Quiz { get; set; } = null!;
    public ICollection<QuizOption> Options { get; set; } = new List<QuizOption>();
    public ICollection<QuizAnswer> Answers { get; set; } = new List<QuizAnswer>();
}