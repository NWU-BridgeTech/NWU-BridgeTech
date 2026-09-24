using BridgeTech.Api.Services.Exercises;
using Microsoft.AspNetCore.Mvc;

namespace BridgeTech.Api.Controllers;

[ApiController]
[Route("api/exercises")]
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
        var submission = await service.CreateSubmissionAsync(exerciseId, request.UserId, request.GithubRepoUrl, cancellationToken);
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
}

// Request body used when a learner submits an exercise repository.
public sealed record SubmitExerciseRequest(Guid UserId, string GithubRepoUrl);