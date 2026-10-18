namespace BridgeTech.Api.Domain.Entities;

public class ExerciseCompletion
{
    public Guid CompletionId { get; set; }

    public Guid UserId { get; set; }

    public Guid ExerciseId { get; set; }

    public DateTimeOffset CompletedAt { get; set; }

    public User User { get; set; } = null!;

    public Exercise Exercise { get; set; } = null!;
}