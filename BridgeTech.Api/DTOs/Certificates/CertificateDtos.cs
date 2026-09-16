using System.ComponentModel.DataAnnotations;

namespace BridgeTech.Api.DTOs.Certificates;

public class CertificateResponse
{
    public Guid CertificateId { get; set; }
    public Guid UserId { get; set; }
    public Guid ModuleId { get; set; }
    public string CertificateHash { get; set; } = string.Empty;
    public DateTimeOffset IssuedAt { get; set; }
}

public class CreateCertificateRequest
{
    [Required]
    public Guid UserId { get; set; }

    [Required]
    public Guid ModuleId { get; set; }

    [Required]
    [StringLength(64, MinimumLength = 64)]
    public string CertificateHash { get; set; } = string.Empty;

    [Required]
    public DateTimeOffset IssuedAt { get; set; } = DateTimeOffset.UtcNow;
}

public class CertificateListItemResponse
{
    public Guid CertificateId { get; set; }
    public Guid UserId { get; set; }
    public Guid ModuleId { get; set; }
    public string CertificateHash { get; set; } = string.Empty;
    public DateTimeOffset IssuedAt { get; set; }
}
