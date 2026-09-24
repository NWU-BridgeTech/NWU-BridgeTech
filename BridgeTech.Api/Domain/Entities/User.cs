using BridgeTech.Api.Domain.Enums;

namespace BridgeTech.Api.Domain.Entities;

// Represents an account that can learn, teach, or administer the platform.
public class User
{
    public Guid UserId { get; set; }
    public string Username { get; set; } = null!;
    public string FirstName { get; set; } = null!;
    public string LastName { get; set; } = null!;
    public string Email { get; set; } = null!;
    public string PasswordHash { get; set; } = null!;
    public string? GithubUsername { get; set; }
    public UserRole Role { get; set; }
    public DateTimeOffset CreatedAt { get; set; }
    public DateTimeOffset UpdatedAt { get; set; }
    public bool EmailVerified { get; set; }
    public string? VerificationCode { get; set; }
    public DateTimeOffset? VerificationCodeExpiresAt { get; set; }
    public int VerificationAttempts { get; set; }
    public DateTimeOffset? LastCodeSentAt { get; set; }
    public string? PasswordResetCode { get; set; }
    public DateTimeOffset? PasswordResetCodeExpiresAt { get; set; }
    public int PasswordResetAttempts { get; set; }
    public DateTimeOffset? PasswordResetLastSentAt { get; set; }

    // Navigation collections allow EF Core to load the user's activity and awards.
    public ICollection<QuizAttempt> QuizAttempts { get; set; } = new List<QuizAttempt>();
    public ICollection<ExerciseSubmission> ExerciseSubmissions { get; set; } = new List<ExerciseSubmission>();
    public ICollection<Enrollment> Enrollments { get; set; } = new List<Enrollment>();
    public ICollection<Certificate> Certificates { get; set; } = new List<Certificate>();
    public ICollection<Notification> Notifications { get; set; } = new List<Notification>();
}