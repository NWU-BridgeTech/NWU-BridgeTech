using BridgeTech.Api.Services.Quizzes;
using Microsoft.AspNetCore.Mvc;

namespace BridgeTech.Api.Controllers;

[ApiController]
[Route("api/quizzes")]
// Serves quiz content without exposing the correct answers to learners.
public class QuizzesController(IQuizService service) : ControllerBase
{
    [HttpGet("{quizId:guid}")]
    // Loads questions and ordered options for a single quiz.
    public async Task<IActionResult> GetQuiz(Guid quizId, CancellationToken cancellationToken)
    {
        var quiz = await service.GetQuizAsync(quizId, cancellationToken);

        return quiz is null ? NotFound() : Ok(quiz);
    }
}