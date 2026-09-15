namespace BridgeTech.Api.Domain.Entities;

// Records one user's attempt at completing a quiz.
public class QuizAttempt
{
    public Guid AttemptId { get; set; }
    public Guid UserId { get; set; }
    public Guid QuizId { get; set; }
    public short? Score { get; set; }
    public bool? Passed { get; set; }
    public DateTimeOffset StartedAt { get; set; }
    public DateTimeOffset? CompletedAt { get; set; }

    public User User { get; set; } = null!;
    public Quiz Quiz { get; set; } = null!;
    public ICollection<QuizAnswer> Answers { get; set; } = new List<QuizAnswer>();
}