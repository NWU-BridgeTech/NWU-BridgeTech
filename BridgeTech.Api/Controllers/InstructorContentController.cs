using BridgeTech.Api.DTOs.InstructorContent;
using BridgeTech.Api.DTOs.Modules;
using BridgeTech.Api.Services.InstructorContent;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace BridgeTech.Api.Controllers;

[ApiController]
[Route("api/instructor/content")]
[Authorize(Roles = "Instructor")]
public sealed class InstructorContentController(IInstructorContentService service) : ControllerBase
{
    [HttpPost("modules")]
    public async Task<IActionResult> CreateModule(
        CreateInstructorModuleRequest request,
        CancellationToken cancellationToken)
    {
        if (!TryGetInstructorId(out var instructorId))
        {
            return Unauthorized();
        }
        var module = await service.CreateModuleAsync(instructorId, request, cancellationToken);
        return CreatedAtAction(nameof(GetModuleContent), new { moduleId = module.ModuleId }, module);
    }

    [HttpGet("modules")]
    public async Task<IActionResult> GetModules(CancellationToken cancellationToken) =>
        TryGetInstructorId(out var instructorId)
            ? Ok(await service.GetModulesAsync(instructorId, cancellationToken))
            : Unauthorized();

    [HttpGet("modules/{moduleId:guid}")]
    public async Task<IActionResult> GetModuleContent(Guid moduleId, CancellationToken cancellationToken)
    {
        if (!TryGetInstructorId(out var instructorId))
        {
            return Unauthorized();
        }
        var content = await service.GetModuleContentAsync(instructorId, moduleId, cancellationToken);
        return content is null ? NotFound() : Ok(content);
    }

    [HttpPut("modules/{moduleId:guid}")]
    public async Task<IActionResult> UpdateModule(
        Guid moduleId,
        UpdateModuleRequest request,
        CancellationToken cancellationToken)
    {
        if (!TryGetInstructorId(out var instructorId))
        {
            return Unauthorized();
        }
        try
        {
            var module = await service.UpdateModuleAsync(instructorId, moduleId, request, cancellationToken);
            return module is null ? NotFound() : Ok(module);
        }
        catch (InvalidOperationException exception)
        {
            return BadRequest(new { message = exception.Message });
        }
    }

    [HttpDelete("modules/{moduleId:guid}")]
    public async Task<IActionResult> DeleteModule(Guid moduleId, CancellationToken cancellationToken)
    {
        if (!TryGetInstructorId(out var instructorId))
        {
            return Unauthorized();
        }
        var deleted = await service.DeleteModuleAsync(instructorId, moduleId, cancellationToken);
        return deleted ? NoContent() : NotFound();
    }

    [HttpPost("modules/{moduleId:guid}/lessons")]
    public async Task<IActionResult> CreateLesson(
        Guid moduleId,
        SaveInstructorLessonRequest request,
        CancellationToken cancellationToken)
    {
        if (!TryGetInstructorId(out var instructorId))
        {
            return Unauthorized();
        }
        try
        {
            try
            {
                var lesson = await service.CreateLessonAsync(instructorId, moduleId, request, cancellationToken);
                return lesson is null ? NotFound() : Ok(lesson);
            }
            catch (InvalidOperationException exception)
            {
                return BadRequest(new { message = exception.Message });
            }
        }
        catch (InvalidOperationException exception)
        {
            return BadRequest(new { message = exception.Message });
        }
    }

    [HttpPut("lessons/{lessonId:guid}")]
    public async Task<IActionResult> UpdateLesson(
        Guid lessonId,
        SaveInstructorLessonRequest request,
        CancellationToken cancellationToken)
    {
        if (!TryGetInstructorId(out var instructorId))
        {
            return Unauthorized();
        }
        try
        {
            var lesson = await service.UpdateLessonAsync(instructorId, lessonId, request, cancellationToken);
            return lesson is null ? NotFound() : Ok(lesson);
        }
        catch (InvalidOperationException exception)
        {
            return BadRequest(new { message = exception.Message });
        }
    }

    [HttpPost("lessons/{lessonId:guid}/move")]
    public async Task<IActionResult> MoveLesson(
        Guid lessonId,
        [FromBody] MoveInstructorLessonRequest request,
        CancellationToken cancellationToken)
    {
        if (!TryGetInstructorId(out var instructorId))
        {
            return Unauthorized();
        }
        try
        {
            var moved = await service.MoveLessonAsync(instructorId, lessonId, request.Direction, cancellationToken);
            return moved ? NoContent() : NotFound();
        }
        catch (ArgumentOutOfRangeException)
        {
            return BadRequest(new { message = "Direction must be -1 or 1." });
        }
    }

    [HttpPost("lessons/{lessonId:guid}/quizzes")]
    public async Task<IActionResult> AddQuiz(
        Guid lessonId,
        AddInstructorQuizRequest request,
        CancellationToken cancellationToken)
    {
        if (!TryGetInstructorId(out var instructorId))
        {
            return Unauthorized();
        }
        try
        {
            var quiz = await service.AddQuizAsync(instructorId, lessonId, request, cancellationToken);
            return quiz is null ? NotFound() : Ok(quiz);
        }
        catch (InvalidOperationException exception)
        {
            return BadRequest(new { message = exception.Message });
        }
    }

    [HttpPost("quizzes/{quizId:guid}/questions")]
    public async Task<IActionResult> AddQuizQuestion(
        Guid quizId,
        InstructorQuizQuestionRequest request,
        CancellationToken cancellationToken)
    {
        if (!TryGetInstructorId(out var instructorId))
        {
            return Unauthorized();
        }
        try
        {
            var question = await service.AddQuizQuestionAsync(instructorId, quizId, request, cancellationToken);
            return question is null ? NotFound() : Ok(question);
        }
        catch (InvalidOperationException exception)
        {
            return BadRequest(new { message = exception.Message });
        }
    }

    [HttpPut("quizzes/{quizId:guid}/questions/{questionIndex:int}")]
    public async Task<IActionResult> UpdateQuizQuestion(
        Guid quizId,
        int questionIndex,
        InstructorQuizQuestionRequest request,
        CancellationToken cancellationToken)
    {
        if (!TryGetInstructorId(out var instructorId))
        {
            return Unauthorized();
        }
        if (questionIndex < 0)
        {
            return BadRequest(new { message = "Question index must be zero or greater." });
        }
        try
        {
            var question = await service.UpdateQuizQuestionAsync(
                instructorId, quizId, questionIndex, request, cancellationToken);
            return question is null ? NotFound() : Ok(question);
        }
        catch (InvalidOperationException exception)
        {
            return BadRequest(new { message = exception.Message });
        }
    }

    [HttpDelete("quizzes/{quizId:guid}/questions/{questionIndex:int}")]
    public async Task<IActionResult> DeleteQuizQuestion(
        Guid quizId,
        int questionIndex,
        CancellationToken cancellationToken)
    {
        if (!TryGetInstructorId(out var instructorId))
        {
            return Unauthorized();
        }
        if (questionIndex < 0)
        {
            return BadRequest(new { message = "Question index must be zero or greater." });
        }
        var deleted = await service.DeleteQuizQuestionAsync(
            instructorId, quizId, questionIndex, cancellationToken);
        return deleted ? NoContent() : NotFound();
    }

    [HttpPost("modules/{moduleId:guid}/exercises")]
    public async Task<IActionResult> AddExercise(
        Guid moduleId,
        AddInstructorExerciseRequest request,
        CancellationToken cancellationToken)
    {
        if (!TryGetInstructorId(out var instructorId))
        {
            return Unauthorized();
        }
        var created = await service.AddExerciseAsync(instructorId, moduleId, request, cancellationToken);
        return created is null ? NotFound() : NoContent();
    }

    [HttpPut("modules/{moduleId:guid}/exercises/{exerciseId:guid}")]
    public async Task<IActionResult> UpdateExercise(
        Guid moduleId,
        Guid exerciseId,
        AddInstructorExerciseRequest request,
        CancellationToken cancellationToken)
    {
        if (!TryGetInstructorId(out var instructorId))
        {
            return Unauthorized();
        }
        var updated = await service.UpdateExerciseAsync(
            instructorId, moduleId, exerciseId, request, cancellationToken);
        return updated is null ? NotFound() : Ok(updated);
    }

    [HttpDelete("modules/{moduleId:guid}/exercises/{exerciseId:guid}")]
    public async Task<IActionResult> DeleteExercise(
        Guid moduleId,
        Guid exerciseId,
        CancellationToken cancellationToken)
    {
        if (!TryGetInstructorId(out var instructorId))
        {
            return Unauthorized();
        }
        var deleted = await service.DeleteExerciseAsync(
            instructorId, moduleId, exerciseId, cancellationToken);
        return deleted ? NoContent() : NotFound();
    }

    private bool TryGetInstructorId(out Guid instructorId) =>
        Guid.TryParse(User.FindFirstValue(ClaimTypes.NameIdentifier), out instructorId);
}

public sealed record MoveInstructorLessonRequest(int Direction);
