using BridgeTech.Api.Services.Exercises;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace BridgeTech.Api.Controllers;

[ApiController]
[Route("api/exercises")]
[Authorize]
// Provides exercise instructions and records learner repository submissions.
public class ExercisesController(IExerciseService service) : ControllerBase
{
    [HttpGet]
    // Returns all exercise definitions ordered by creation time.
    public async Task<IActionResult> GetExercises(CancellationToken cancellationToken)
    {
        return Ok(await service.GetAllAsync(cancellationToken));
    }

    [HttpGet("{exerciseId:guid}")]
    // Returns one exercise definition needed by the learner.
    public async Task<IActionResult> GetExercise(Guid exerciseId, CancellationToken cancellationToken)
    {
        var exercise = await service.GetByIdAsync(exerciseId, cancellationToken);

        return exercise is null ? NotFound() : Ok(exercise);
    }

    [HttpPost("{exerciseId:guid}/submissions")]
    // Stores a repository URL for later GitHub verification.
    public async Task<IActionResult> SubmitExercise(
        Guid exerciseId,
        SubmitExerciseRequest request,
        CancellationToken cancellationToken)
    {
        if (!Guid.TryParse(User.FindFirstValue(ClaimTypes.NameIdentifier), out var userId))
        {
            return Unauthorized();
        }

        var submission = await service.CreateSubmissionAsync(exerciseId, userId, request.GithubRepoUrl, cancellationToken);
        if (submission is null)
        {
            return NotFound();
        }

        return CreatedAtAction(
            nameof(GetSubmission),
            new { submissionId = submission.SubmissionId },
            submission);
    }

    [HttpGet("submissions/{submissionId:guid}")]
    // Returns the current verification status of a submission.
    public async Task<IActionResult> GetSubmission(Guid submissionId, CancellationToken cancellationToken)
    {
        var submission = await service.GetSubmissionAsync(submissionId, cancellationToken);

        return submission is null ? NotFound() : Ok(submission);
    }

    private Guid? CurrentUserId()
{
    var value = User.FindFirstValue(
        ClaimTypes.NameIdentifier
    );

    return Guid.TryParse(value, out var id)
        ? id
        : null;
}


[HttpGet("my")]
public async Task<IActionResult> GetMyExercises(
    CancellationToken cancellationToken)
{
    var userId = CurrentUserId();

    if (userId is null)
    {
        return Unauthorized();
    }

    var exercises = await service.GetMyExercisesAsync(
        userId.Value,
        cancellationToken
    );

    return Ok(exercises);
}


[HttpPost("{exerciseId:guid}/complete")]
public async Task<IActionResult> CompleteExercise(
    Guid exerciseId,
    CancellationToken cancellationToken)
{
    var userId = CurrentUserId();

    if (userId is null)
    {
        return Unauthorized();
    }

    var completion = await service.MarkCompletedAsync(
        userId.Value,
        exerciseId,
        cancellationToken
    );

    if (completion is null)
    {
        return NotFound(new
        {
            message =
                "Exercise not found in your registered modules."
        });
    }

    return Ok(new
    {
        exerciseId = completion.ExerciseId,
        completed = true,
        completedAt = completion.CompletedAt
    });
}

}

// Request body used when a learner submits an exercise repository.
public sealed record SubmitExerciseRequest(Guid UserId, string GithubRepoUrl);