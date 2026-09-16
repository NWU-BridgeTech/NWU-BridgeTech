using BridgeTech.Api.Data;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace BridgeTech.Api.Controllers;

[ApiController]
[Route("api/quizzes")]
// Serves quiz content without exposing the correct answers to learners.
public class QuizzesController(AppDbContext dbContext) : ControllerBase
{
    [HttpGet("{quizId:guid}")]
    // Loads questions and ordered options for a single quiz.
    public async Task<IActionResult> GetQuiz(Guid quizId, CancellationToken cancellationToken)
    {
        var quiz = await dbContext.Quizzes
            .AsNoTracking()
            .Where(candidate => candidate.QuizId == quizId)
            .Select(candidate => new
            {
                candidate.QuizId,
                candidate.ModuleId,
                candidate.Title,
                candidate.PassingScore,
                Questions = candidate.Questions
                    .OrderBy(question => question.OrderIndex)
                    .Select(question => new
                    {
                        question.QuestionId,
                        question.QuestionText,
                        question.QuestionType,
                        question.OrderIndex,
                        Options = question.Options
                            .OrderBy(option => option.OrderIndex)
                            .Select(option => new
                            {
                                option.OptionId,
                                option.OptionText,
                                option.OrderIndex
                            })
                    })
            })
            .SingleOrDefaultAsync(cancellationToken);

        return quiz is null ? NotFound() : Ok(quiz);
    }
}