using BridgeTech.Api.Data;
using BridgeTech.Api.Domain.Entities;
using BridgeTech.Api.DTOs.Quizzes;
using Microsoft.EntityFrameworkCore;

namespace BridgeTech.Api.Services.Quizzes;

public sealed class QuizService(AppDbContext db) : IQuizService
{
    public async Task<QuizContentResponse?> GetQuizAsync(Guid id, CancellationToken ct = default)
    {
        var q = await db.Quizzes.AsNoTracking().Include(x => x.Questions).ThenInclude(x => x.Options).SingleOrDefaultAsync(x => x.QuizId == id, ct);
        if (q is null) return null;
        return new QuizContentResponse { QuizId=q.QuizId, ModuleId=q.ModuleId, Title=q.Title, PassingScore=q.PassingScore, Questions=q.Questions.OrderBy(x=>x.OrderIndex).Select(x=>new QuizQuestionResponse { QuestionId=x.QuestionId, QuizId=x.QuizId, QuestionText=x.QuestionText, QuestionType=x.QuestionType, OrderIndex=x.OrderIndex, Options=x.Options.OrderBy(o=>o.OrderIndex).Select(o=>new QuizOptionResponse { OptionId=o.OptionId, QuestionId=x.QuestionId, OptionText=o.OptionText, OrderIndex=o.OrderIndex }).ToList() }).ToList() };
    }
    public async Task<QuizResponse?> GetByIdAsync(Guid id, CancellationToken ct = default) => await db.Quizzes.AsNoTracking().Where(x => x.QuizId == id).Select(x => new QuizResponse { QuizId=x.QuizId, ModuleId=x.ModuleId, Title=x.Title, PassingScore=x.PassingScore, CreatedAt=x.CreatedAt }).SingleOrDefaultAsync(ct);
    public async Task<IReadOnlyList<QuizListItemResponse>> GetAllAsync(CancellationToken ct = default) => await db.Quizzes.AsNoTracking().OrderBy(x=>x.CreatedAt).Select(x=>new QuizListItemResponse { QuizId=x.QuizId, ModuleId=x.ModuleId, Title=x.Title, PassingScore=x.PassingScore, CreatedAt=x.CreatedAt }).ToListAsync(ct);
    public async Task<QuizResponse> CreateAsync(CreateQuizRequest r, CancellationToken ct = default) { var e = new Quiz { QuizId=Guid.NewGuid(), ModuleId=r.ModuleId!.Value, Title=r.Title, PassingScore=r.PassingScore, CreatedAt=DateTimeOffset.UtcNow }; db.Quizzes.Add(e); await db.SaveChangesAsync(ct); return ToResponse(e); }
    public async Task<QuizResponse?> UpdateAsync(Guid id, UpdateQuizRequest r, CancellationToken ct = default) { var e=await db.Quizzes.SingleOrDefaultAsync(x=>x.QuizId==id,ct); if(e is null)return null; if(r.Title is not null)e.Title=r.Title;if(r.PassingScore.HasValue)e.PassingScore=r.PassingScore.Value;await db.SaveChangesAsync(ct);return ToResponse(e); }
    public async Task<bool> DeleteAsync(Guid id, CancellationToken ct = default) { var e=await db.Quizzes.FindAsync([id],ct);if(e is null)return false;db.Quizzes.Remove(e);await db.SaveChangesAsync(ct);return true; }
    public async Task<QuizAttemptResponse?> StartAttemptAsync(Guid userId, CreateQuizAttemptRequest r, CancellationToken ct = default) { if(!await db.Quizzes.AnyAsync(x=>x.QuizId==r.QuizId,ct))return null;var e=new QuizAttempt{AttemptId=Guid.NewGuid(),UserId=userId,QuizId=r.QuizId!.Value,StartedAt=r.StartedAt};db.QuizAttempts.Add(e);await db.SaveChangesAsync(ct);return ToAttempt(e); }
    public async Task<QuizAttemptResponse?> SubmitAttemptAsync(Guid userId, SubmitQuizAttemptRequest r, CancellationToken ct = default)
    {
        var a=await db.QuizAttempts.Include(x=>x.Quiz).ThenInclude(x=>x.Questions).ThenInclude(x=>x.Options).Include(x=>x.Answers).SingleOrDefaultAsync(x=>x.AttemptId==r.AttemptId&&x.UserId==userId,ct);if(a is null||a.CompletedAt.HasValue)return null;
        var answeredQuestionIds = new HashSet<Guid>();
        foreach (var answer in r.Answers)
        {
            if (!answer.QuestionId.HasValue ||
                !answer.OptionId.HasValue ||
                !answeredQuestionIds.Add(answer.QuestionId.Value))
            {
                continue;
            }

            var question = a.Quiz.Questions
                .SingleOrDefault(x => x.QuestionId == answer.QuestionId.Value);
            var option = question?.Options
                .SingleOrDefault(x => x.OptionId == answer.OptionId.Value);

            if (question is null || option is null)
            {
                continue;
            }

            a.Answers.Add(new QuizAnswer
            {
                AnswerId = Guid.NewGuid(),
                AttemptId = a.AttemptId,
                QuestionId = question.QuestionId,
                OptionId = option.OptionId,
                IsCorrect = option.IsCorrect
            });
        }

        a.Score = (short)(a.Quiz.Questions.Count == 0
            ? 0
            : Math.Round(
                a.Answers.Count(x => x.IsCorrect) * 100m /
                a.Quiz.Questions.Count));
        a.Passed = a.Score >= a.Quiz.PassingScore;
        a.CompletedAt = DateTimeOffset.UtcNow;
        await db.SaveChangesAsync(ct);
        return ToAttempt(a);
    }
    private static QuizResponse ToResponse(Quiz x)=>new(){QuizId=x.QuizId,ModuleId=x.ModuleId,Title=x.Title,PassingScore=x.PassingScore,CreatedAt=x.CreatedAt};
    private static QuizAttemptResponse ToAttempt(QuizAttempt x)=>new(){AttemptId=x.AttemptId,UserId=x.UserId,QuizId=x.QuizId,Score=x.Score,Passed=x.Passed,StartedAt=x.StartedAt,CompletedAt=x.CompletedAt};
}
