using System.Security.Claims;
using BridgeTech.Api.Common.Options;
using BridgeTech.Api.Services.GitHub;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;

namespace BridgeTech.Api.Controllers;

[ApiController]
[Route("api/github")]
public sealed class GitHubController : ControllerBase
{
    private readonly IGitHubService _githubService;
    private readonly GitHubApiOptions _options;

    public GitHubController(IGitHubService githubService, IOptions<GitHubApiOptions> options)
    {
        _githubService = githubService;
        _options = options.Value;
    }

    [Authorize]
    [HttpGet("connect")]
    public IActionResult Connect()
    {
        if (!Guid.TryParse(User.FindFirstValue(ClaimTypes.NameIdentifier), out var userId))
            return Unauthorized();

        return Ok(new { authorizationUrl = _githubService.CreateAuthorizationUrl(userId) });
    }

    [Authorize]
    [HttpGet("me")]
    public async Task<IActionResult> Me(CancellationToken cancellationToken)
    {
        if (!Guid.TryParse(User.FindFirstValue(ClaimTypes.NameIdentifier), out var userId))
            return Unauthorized();

        return Ok(new
        {
            username = await _githubService.GetUsernameAsync(userId, cancellationToken),
            repository = await _githubService.GetLinkedRepositoryAsync(userId, cancellationToken)
        });
    }

    [Authorize]
    [HttpGet("repositories")]
    public async Task<IActionResult> Repositories(CancellationToken cancellationToken)
    {
        if (!Guid.TryParse(User.FindFirstValue(ClaimTypes.NameIdentifier), out var userId)) return Unauthorized();
        return Ok(await _githubService.GetRepositoriesAsync(userId, cancellationToken));
    }

    [Authorize]
    [HttpPut("repository")]
    public async Task<IActionResult> LinkRepository([FromBody] LinkRepositoryRequest request, CancellationToken cancellationToken)
    {
        if (!Guid.TryParse(User.FindFirstValue(ClaimTypes.NameIdentifier), out var userId)) return Unauthorized();
        if (string.IsNullOrWhiteSpace(request.FullName)) return BadRequest(new { message = "Repository full name is required." });
        try { return Ok(await _githubService.LinkRepositoryAsync(userId, request.FullName, cancellationToken)); }
        catch (InvalidOperationException exception) { return BadRequest(new { message = exception.Message }); }
        return Ok(new { username = await _githubService.GetUsernameAsync(userId, cancellationToken) });
    }

    [AllowAnonymous]
    [HttpGet("callback")]
    public async Task<IActionResult> Callback([FromQuery] string? code, [FromQuery] string? state, CancellationToken cancellationToken)
    {
        var redirectUrl = $"{_options.FrontendUrl.TrimEnd('/')}/student/github";
        if (string.IsNullOrWhiteSpace(code) || string.IsNullOrWhiteSpace(state))
            return Redirect($"{redirectUrl}?github=error&message=GitHub+did+not+return+a+valid+connection+request");

        try
        {
            await _githubService.ConnectUserAsync(state, code, cancellationToken);
            return Redirect($"{redirectUrl}?github=connected");
        }
        catch (Exception exception) when (exception is InvalidOperationException or HttpRequestException)
        {
            return Redirect($"{redirectUrl}?github=error&message={Uri.EscapeDataString(exception.Message)}");
        }
    }
}

public sealed record LinkRepositoryRequest(string FullName);
