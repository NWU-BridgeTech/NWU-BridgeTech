using System.Security.Claims;
using BridgeTech.Api.DTOs.Lessons;
using BridgeTech.Api.Services.Lessons;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace BridgeTech.Api.Controllers;

[ApiController]
[Route("api")]
[Authorize]
public class LessonsController(ILessonService service) : ControllerBase
{
    [HttpGet("modules/{moduleId:guid}/lessons")]
    public async Task<IActionResult> GetLessonsForModule(
        Guid moduleId, CancellationToken cancellationToken)
    {
        var result = await service.GetLessonsForModuleAsync(moduleId, GetUserId(), cancellationToken);
        return Ok(result);
    }

    [HttpGet("lessons/{lessonId:guid}")]
    public async Task<IActionResult> GetLesson(
        Guid lessonId, CancellationToken cancellationToken)
    {
        var lesson = await service.GetByIdAsync(lessonId, GetUserId(), cancellationToken);
        return lesson is null ? NotFound() : Ok(lesson);
    }

    [HttpPost("lessons/{lessonId:guid}/complete")]
    public async Task<IActionResult> MarkComplete(
        Guid lessonId, CancellationToken cancellationToken)
    {
        var result = await service.MarkCompleteAsync(lessonId, GetUserId(), cancellationToken);
        return result is null ? NotFound() : Ok(result);
    }

    [HttpPost("modules/{moduleId:guid}/lessons")]
    [Authorize(Roles = "Admin,SuperAdmin")]
    public async Task<IActionResult> CreateLesson(
        Guid moduleId, [FromBody] CreateLessonRequest request, CancellationToken cancellationToken)
    {
        var lesson = await service.CreateAsync(moduleId, request, cancellationToken);
        return CreatedAtAction(nameof(GetLesson), new { lessonId = lesson.LessonId }, lesson);
    }

    private Guid GetUserId()
    {
        var idClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
        return Guid.TryParse(idClaim, out var id)
            ? id
            : throw new UnauthorizedAccessException("User id claim missing or invalid.");
    }
}