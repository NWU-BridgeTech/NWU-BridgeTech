using BridgeTech.Api.Data;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace BridgeTech.Api.Controllers;

[ApiController]
[Route("api/certificates")]
// Provides certificate lookup after a learner completes a module.
public class CertificatesController(AppDbContext dbContext) : ControllerBase
{
    [HttpGet("{certificateId:guid}")]
    // Returns a certificate by its public identifier.
    public async Task<IActionResult> GetCertificate(Guid certificateId, CancellationToken cancellationToken)
    {
        var certificate = await dbContext.Certificates
            .AsNoTracking()
            .Where(candidate => candidate.CertificateId == certificateId)
            .Select(candidate => new
            {
                candidate.CertificateId,
                candidate.UserId,
                candidate.ModuleId,
                candidate.CertificateHash,
                candidate.IssuedAt,

                User = new
                {
                    candidate.User.UserId,
                    candidate.User.Username,
                    candidate.User.FirstName,
                    candidate.User.LastName,
                    candidate.User.Email
                }
            })
            .SingleOrDefaultAsync(cancellationToken);

        return certificate is null ? NotFound() : Ok(certificate);
    }

    [HttpGet("user/{userId:guid}")]
    // Lists a user's certificates with the newest certificate first.
    public async Task<IActionResult> GetUserCertificates(Guid userId, CancellationToken cancellationToken)
    {
        var certificates = await dbContext.Certificates
            .AsNoTracking()
            .Where(certificate => certificate.UserId == userId)
            .OrderByDescending(certificate => certificate.IssuedAt)
            .Select(certificate => new
            {
                certificate.CertificateId,
                certificate.ModuleId,
                certificate.CertificateHash,
                certificate.IssuedAt,
                User = new
                {
                    certificate.User.UserId,
                    certificate.User.Username,
                    certificate.User.FirstName,
                    certificate.User.LastName,
                    certificate.User.Email
                }
            })
            .ToListAsync(cancellationToken);

        return Ok(certificates);
    }
    [HttpGet]
    public async Task<IActionResult> GetCertificates(
    CancellationToken cancellationToken)
    {
        var certificates = await dbContext.Certificates
            .AsNoTracking()
            .OrderByDescending(certificate => certificate.IssuedAt)
            .Select(certificate => new
            {
                certificate.CertificateId,
                certificate.ModuleId,
                certificate.CertificateHash,
                certificate.IssuedAt,
                User = new
                {
                    certificate.User.UserId,
                    certificate.User.Username,
                    certificate.User.FirstName,
                    certificate.User.LastName,
                    certificate.User.Email
                }
            })
            .ToListAsync(cancellationToken);

        return Ok(certificates);
    }
}