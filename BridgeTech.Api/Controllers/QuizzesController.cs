using System.Security.Claims;
using BridgeTech.Api.DTOs.Quizzes;
using BridgeTech.Api.Services.Quizzes;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace BridgeTech.Api.Controllers;
[Authorize]
[ApiController]
[Route("api/quizzes")]

public class QuizzesController(IQuizService service) : ControllerBase
{
    [HttpGet("{quizId:guid}")]
    public async Task<IActionResult> GetQuiz(Guid quizId, CancellationToken cancellationToken)
    {
        var quiz = await service.GetQuizAsync(quizId, cancellationToken);
        return quiz is null ? NotFound() : Ok(quiz);
    }

    [HttpPost("{quizId:guid}/attempts")]
    public async Task<IActionResult> StartAttempt(Guid quizId, CancellationToken cancellationToken)
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (!Guid.TryParse(userIdClaim, out var userId)) return Unauthorized();

        var request = new CreateQuizAttemptRequest { QuizId = quizId };
        var result = await service.StartAttemptAsync(userId, request, cancellationToken);

        return result is null ? NotFound() : Ok(result);
    }

    [HttpPost("{quizId:guid}/submit")]
    public async Task<IActionResult> SubmitQuiz(Guid quizId, [FromBody] SubmitQuizAttemptRequest request, CancellationToken cancellationToken)
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (!Guid.TryParse(userIdClaim, out var userId)) return Unauthorized();

        var result = await service.SubmitAttemptAsync(userId, request, cancellationToken);
        return result is null ? NotFound() : Ok(result);
    }
    [HttpGet("my-attempts")]
public async Task<IActionResult> GetMyAttempts(CancellationToken cancellationToken)
{
    var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
    if (!Guid.TryParse(userIdClaim, out var userId)) return Unauthorized();

    return Ok(await service.GetMyAttemptsAsync(userId, cancellationToken));
}

[HttpGet("pending")]
public async Task<IActionResult> GetQuizzesToRetake(CancellationToken cancellationToken)
{
    var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
    if (!Guid.TryParse(userIdClaim, out var userId)) return Unauthorized();

    return Ok(await service.GetQuizzesToRetakeAsync(userId, cancellationToken));
}
}
