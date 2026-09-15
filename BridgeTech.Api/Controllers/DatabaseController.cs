using BridgeTech.Api.Data;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace BridgeTech.Api.Controllers;

[ApiController]
[Route("api/database")]
// Diagnostic endpoint used to prove that the backend can reach PostgreSQL.
// It does not expose credentials or database internals to the client.
public class DatabaseController(AppDbContext dbContext) : ControllerBase
{
    [HttpGet("status")]
    public async Task<IActionResult> GetStatus(CancellationToken cancellationToken)
    {
        // CanConnectAsync opens a database connection and returns false instead
        // of throwing for an expected connectivity failure.
        var connected = await dbContext.Database.CanConnectAsync(cancellationToken);

        return connected
            ? Ok(new { connected = true, message = "Database connection successful." })
            : StatusCode(StatusCodes.Status503ServiceUnavailable, new
            {
                connected = false,
                message = "Database connection failed."
            });
    }
}