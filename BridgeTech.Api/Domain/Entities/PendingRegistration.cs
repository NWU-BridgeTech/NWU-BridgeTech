namespace BridgeTech.Api.Domain.Entities;

public class PendingRegistration
{
    public Guid PendingRegistrationId { get; set; }
    public string Username { get; set; } = null!;
    public string FirstName { get; set; } = null!;
    public string LastName { get; set; } = null!;
    public string Email { get; set; } = null!;
    public string PasswordHash { get; set; } = null!;
    public string? GithubUsername { get; set; }
    public string VerificationCode { get; set; } = null!;
    public DateTimeOffset VerificationCodeExpiresAt { get; set; }
    public int VerificationAttempts { get; set; }
    public DateTimeOffset LastCodeSentAt { get; set; }
    public DateTimeOffset CreatedAt { get; set; }
}