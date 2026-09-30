using BridgeTech.Api.Services.Certificates;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;

namespace BridgeTech.Api.Controllers;

[ApiController]
[Route("api/certificates")]
[Authorize]
// Provides certificate lookup after a learner completes a module.
public class CertificatesController(ICertificateService service, ICertificateRenderer renderer) : ControllerBase
{
    [HttpGet("{certificateId:guid}")]
    // Returns a certificate by its public identifier.
    public async Task<IActionResult> GetCertificate(Guid certificateId, CancellationToken cancellationToken)
    {
        var certificate = await service.GetByIdAsync(certificateId, cancellationToken);

        return certificate is null ? NotFound() : Ok(certificate);
    }

    [HttpGet("{certificateId:guid}/image")]
    public async Task<IActionResult> GetCertificateImage(
        Guid certificateId,
        [FromQuery] string format = "png",
        CancellationToken cancellationToken = default)
    {
        if (!format.Equals("png", StringComparison.OrdinalIgnoreCase)
            && !format.Equals("jpeg", StringComparison.OrdinalIgnoreCase)
            && !format.Equals("jpg", StringComparison.OrdinalIgnoreCase)
            && !format.Equals("pdf", StringComparison.OrdinalIgnoreCase))
            return BadRequest(new { message = "Format must be png, jpeg, or pdf." });

        var certificate = await service.GetByIdAsync(certificateId, cancellationToken);
        if (certificate is null) return NotFound();
        if (!User.IsInRole("Admin") && certificate.UserId != CurrentUserId()) return Forbid();

        var bytes = renderer.Render(certificate, format);
        var contentType = format.Equals("png", StringComparison.OrdinalIgnoreCase)
            ? "image/png"
            : format.Equals("pdf", StringComparison.OrdinalIgnoreCase)
                ? "application/pdf"
                : "image/jpeg";
        return File(bytes, contentType);
    }

    [HttpGet("user/{userId:guid}")]
    // Lists a user's certificates with the newest certificate first.
    public async Task<IActionResult> GetUserCertificates(Guid userId, CancellationToken cancellationToken)
    {
        if (!User.IsInRole("Admin") && userId != CurrentUserId()) return Forbid();
        var certificates = await service.GetByUserAsync(userId, cancellationToken);

        return Ok(certificates);
    }

    [AllowAnonymous]
    [HttpGet("verify/{certificateNumber}")]
    public async Task<IActionResult> Verify(string certificateNumber, CancellationToken cancellationToken)
    {
        var certificate = await service.VerifyAsync(certificateNumber, cancellationToken);
        return certificate is null ? NotFound(new { message = "Certificate is invalid or has been revoked." }) : Ok(certificate);
    }

    private Guid CurrentUserId() => Guid.Parse(User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)!.Value);
    [HttpGet]
    public async Task<IActionResult> GetCertificates(
    CancellationToken cancellationToken)
    {
        var certificates = await service.GetAllAsync(cancellationToken);

        return Ok(certificates);
    }
}