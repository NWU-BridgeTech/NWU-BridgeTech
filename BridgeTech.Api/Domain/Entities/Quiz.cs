namespace BridgeTech.Api.Domain.Entities;

// A scored assessment associated with a learning module.
public class Quiz
{
    public Guid QuizId { get; set; }
    public Guid ModuleId { get; set; }
    public string Title { get; set; } = null!;
    public short PassingScore { get; set; }
    public DateTimeOffset CreatedAt { get; set; }

    public Module Module { get; set; } = null!;
    public ICollection<QuizQuestion> Questions { get; set; } = new List<QuizQuestion>();
    public ICollection<QuizAttempt> Attempts { get; set; } = new List<QuizAttempt>();
}