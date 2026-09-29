using BridgeTech.Api.Services.Certificates;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace BridgeTech.Api.Controllers;

[ApiController]
[Route("api/certificates")]
[Authorize]
// Provides certificate lookup after a learner completes a module.
public class CertificatesController(ICertificateService service) : ControllerBase
{
    [HttpGet("{certificateId:guid}")]
    // Returns a certificate by its public identifier.
    public async Task<IActionResult> GetCertificate(Guid certificateId, CancellationToken cancellationToken)
    {
        var certificate = await service.GetByIdAsync(certificateId, cancellationToken);

        return certificate is null ? NotFound() : Ok(certificate);
    }

    [HttpGet("user/{userId:guid}")]
    // Lists a user's certificates with the newest certificate first.
    public async Task<IActionResult> GetUserCertificates(Guid userId, CancellationToken cancellationToken)
    {
        var certificates = await service.GetByUserAsync(userId, cancellationToken);

        return Ok(certificates);
    }
    [HttpGet]
    public async Task<IActionResult> GetCertificates(
    CancellationToken cancellationToken)
    {
        var certificates = await service.GetAllAsync(cancellationToken);

        return Ok(certificates);
    }
}