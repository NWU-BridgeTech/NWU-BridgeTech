using Microsoft.AspNetCore.Mvc;

namespace BridgeTech.Api.Controllers;

[ApiController]
[Route("api/auth")]
// Authentication endpoints will delegate registration, login, and token work
// to the authentication service once that service is configured.
public class AuthController : ControllerBase
{
    [HttpGet("status")]
    // Exposes the current authentication configuration state to API clients.
    public IActionResult GetStatus()
    {
        return StatusCode(StatusCodes.Status501NotImplemented, new
        {
            message = "Authentication endpoints are not configured yet."
        });
    }
}