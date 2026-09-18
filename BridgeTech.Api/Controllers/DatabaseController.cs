using BridgeTech.Api.Data;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace BridgeTech.Api.Controllers;

[ApiController]
[Route("api/database")]
public class DatabaseController(AppDbContext dbContext) : ControllerBase
{
    [HttpGet("status")]
    public async Task<IActionResult> GetStatus(CancellationToken cancellationToken)
    {
        try
        {
            var connected = await dbContext.Database.CanConnectAsync(cancellationToken);

            return connected
                ? Ok(new
                {
                    connected = true,
                    message = "Database connection successful."
                })
                : StatusCode(StatusCodes.Status503ServiceUnavailable, new
                {
                    connected = false,
                    message = "Database connection failed."
                });
        }
        catch (Exception ex)
        {
            return StatusCode(StatusCodes.Status500InternalServerError, new
            {
                connected = false,
                error = ex.Message,
                innerError = ex.InnerException?.Message
            });
        }
    }
}