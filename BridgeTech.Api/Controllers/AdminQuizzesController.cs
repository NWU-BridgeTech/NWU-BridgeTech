
using BridgeTech.Api.DTOs.Quizzes;
using BridgeTech.Api.Services.Quizzes;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace BridgeTech.Api.Controllers;

[ApiController]
[Route("api/admin/quizzes")]
[Authorize(Roles = "Instructor,Admin,SuperAdmin")]
public class AdminQuizzesController(IQuizService quizService) : ControllerBase
{
    // GET: api/admin/quizzes
    [HttpGet]
    public async Task<IActionResult> GetAll(
        CancellationToken cancellationToken)
    {
        var quizzes = await quizService.GetAllAsync(cancellationToken);
        return Ok(quizzes);
    }

    // GET: api/admin/quizzes/{quizId}
    
    [HttpGet("{quizId:guid}")]
    public async Task<ActionResult<AdminQuizDetailResponse>> GetById(
        Guid quizId,
        CancellationToken cancellationToken)
    {
        var quiz = await quizService.GetForAdminAsync(
            quizId,
            cancellationToken
        );

        if (quiz is null)
        {
            return NotFound(new
            {
                message = "Quiz not found."
            });
        }

        return Ok(quiz);
    }


    // POST: api/admin/quizzes
    [HttpPost]
    public async Task<IActionResult> Create(
        [FromBody] CreateQuizRequest request,
        CancellationToken cancellationToken)
    {
        var created = await quizService.CreateAsync(
            request,
            cancellationToken
        );

        return CreatedAtAction(
            nameof(GetById),
            new { quizId = created.QuizId },
            created
        );
    }

    // PUT: api/admin/quizzes/{quizId}
    [HttpPut("{quizId:guid}")]
    public async Task<IActionResult> Update(
        Guid quizId,
        [FromBody] UpdateQuizRequest request,
        CancellationToken cancellationToken)
    {
        var updated = await quizService.UpdateAsync(
            quizId,
            request,
            cancellationToken
        );

        if (updated is null)
        {
            return NotFound(new
            {
                message = "Quiz not found."
            });
        }

        return Ok(updated);
    }

    // DELETE: api/admin/quizzes/{quizId}
    [HttpDelete("{quizId:guid}")]
    public async Task<IActionResult> Delete(
        Guid quizId,
        CancellationToken cancellationToken)
    {
        var deleted = await quizService.DeleteAsync(
            quizId,
            cancellationToken
        );

        if (!deleted)
        {
            return NotFound(new
            {
                message = "Quiz not found."
            });
        }

        return NoContent();
    }
}
