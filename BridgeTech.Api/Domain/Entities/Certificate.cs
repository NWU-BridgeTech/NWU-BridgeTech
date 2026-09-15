namespace BridgeTech.Api.Domain.Entities;

// Represents a certificate issued after a user completes a module.
public class Certificate
{
    public Guid CertificateId { get; set; }
    public Guid UserId { get; set; }
    public Guid ModuleId { get; set; }
    public string CertificateHash { get; set; } = null!;
    public DateTimeOffset IssuedAt { get; set; }

    public User User { get; set; } = null!;
    public Module Module { get; set; } = null!;
}