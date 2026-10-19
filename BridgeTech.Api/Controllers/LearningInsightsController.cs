using System.Security.Claims;
using BridgeTech.Api.Services.GitHub;
using BridgeTech.Api.DTOs.GitHub;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace BridgeTech.Api.Controllers;

[ApiController]
[Route("api/learning-insights")]
[Authorize(Roles = "Student")]
public sealed class LearningInsightsController(ILearningInsightsService service) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> Get(CancellationToken cancellationToken)
    {
        var value = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (!Guid.TryParse(value, out var userId))
            return Unauthorized();
        return Ok(await service.GetAsync(userId, cancellationToken: cancellationToken));
    }

    [HttpPost("generate")]
    public async Task<IActionResult> Generate(CancellationToken cancellationToken)
    {
        var value = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (!Guid.TryParse(value, out var userId))
            return Unauthorized();
        return Ok(await service.GetAsync(userId, true, cancellationToken));
    }

    [HttpPost("chat")]
    public async Task<IActionResult> Chat(
        LearningChatRequest request,
        CancellationToken cancellationToken)
    {
        var value = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (!Guid.TryParse(value, out var userId))
            return Unauthorized();
        return Ok(await service.ChatAsync(userId, request, cancellationToken));
    }

    [HttpGet("chat")]
    public async Task<IActionResult> ChatHistory(CancellationToken cancellationToken)
    {
        var value = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (!Guid.TryParse(value, out var userId))
            return Unauthorized();
        return Ok(await service.GetChatHistoryAsync(userId, cancellationToken));
    }

    [HttpDelete("chat")]
    public async Task<IActionResult> ClearChatHistory(CancellationToken cancellationToken)
    {
        var value = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (!Guid.TryParse(value, out var userId))
            return Unauthorized();
        await service.ClearChatHistoryAsync(userId, cancellationToken);
        return NoContent();
    }
}
