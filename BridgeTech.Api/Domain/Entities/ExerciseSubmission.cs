using BridgeTech.Api.Domain.Enums;

namespace BridgeTech.Api.Domain.Entities;

// Records a user's GitHub repository submission for an exercise.
public class ExerciseSubmission
{
    public Guid SubmissionId { get; set; }
    public Guid ExerciseId { get; set; }
    public Guid UserId { get; set; }
    public string GithubRepoUrl { get; set; } = null!;
    public SubmissionStatus Status { get; set; }
    public DateTimeOffset SubmittedAt { get; set; }
    public DateTimeOffset? VerifiedAt { get; set; }

    public Exercise Exercise { get; set; } = null!;
    public User User { get; set; } = null!;
}