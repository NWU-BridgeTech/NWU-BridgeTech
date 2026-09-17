using BridgeTech.Api.Data;
using BridgeTech.Api.Domain.Entities;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace BridgeTech.Api.Controllers;

[ApiController]
[Route("api/exercises")]
// Provides exercise instructions and records learner repository submissions.
public class ExercisesController(AppDbContext dbContext) : ControllerBase
{
    [HttpGet]
    // Returns all exercise definitions ordered by creation time.
    public async Task<IActionResult> GetExercises(CancellationToken cancellationToken)
    {
        var exercises = await dbContext.Exercises
            .AsNoTracking()
            .OrderBy(exercise => exercise.CreatedAt)
            .Select(exercise => new
            {
                exercise.ExerciseId,
                exercise.ModuleId,
                exercise.Title,
                exercise.Description,
                exercise.VerificationType,
                exercise.VerificationCriteria,
                exercise.CreatedAt
            })
            .ToListAsync(cancellationToken);

        return Ok(exercises);
    }

    [HttpGet("{exerciseId:guid}")]
    // Returns one exercise definition needed by the learner.
    public async Task<IActionResult> GetExercise(Guid exerciseId, CancellationToken cancellationToken)
    {
        var exercise = await dbContext.Exercises
            .AsNoTracking()
            .Where(exercise => exercise.ExerciseId == exerciseId)
            .Select(exercise => new
            {
                exercise.ExerciseId,
                exercise.ModuleId,
                exercise.Title,
                exercise.Description,
                exercise.VerificationType,
                exercise.VerificationCriteria,
                exercise.CreatedAt
            })
            .SingleOrDefaultAsync(cancellationToken);

        return exercise is null ? NotFound() : Ok(exercise);
    }

    [HttpPost("{exerciseId:guid}/submissions")]
    // Stores a repository URL for later GitHub verification.
    public async Task<IActionResult> SubmitExercise(
        Guid exerciseId,
        SubmitExerciseRequest request,
        CancellationToken cancellationToken)
    {
        var exerciseExists = await dbContext.Exercises
            .AsNoTracking()
            .AnyAsync(exercise => exercise.ExerciseId == exerciseId, cancellationToken);

        if (!exerciseExists)
        {
            return NotFound();
        }

        var submission = new ExerciseSubmission
        {
            SubmissionId = Guid.NewGuid(),
            ExerciseId = exerciseId,
            UserId = request.UserId,
            GithubRepoUrl = request.GithubRepoUrl,
            SubmittedAt = DateTimeOffset.UtcNow
        };

        dbContext.ExerciseSubmissions.Add(submission);
        await dbContext.SaveChangesAsync(cancellationToken);

        return CreatedAtAction(
            nameof(GetSubmission),
            new { submissionId = submission.SubmissionId },
            submission);
    }

    [HttpGet("submissions/{submissionId:guid}")]
    // Returns the current verification status of a submission.
    public async Task<IActionResult> GetSubmission(Guid submissionId, CancellationToken cancellationToken)
    {
        var submission = await dbContext.ExerciseSubmissions
            .AsNoTracking()
            .SingleOrDefaultAsync(candidate => candidate.SubmissionId == submissionId, cancellationToken);

        return submission is null ? NotFound() : Ok(submission);
    }
}

// Request body used when a learner submits an exercise repository.
public sealed record SubmitExerciseRequest(Guid UserId, string GithubRepoUrl);