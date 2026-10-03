using Microsoft.EntityFrameworkCore;
using BridgeTech.Api.Data;
using BridgeTech.Api.Domain.Entities;
using BridgeTech.Api.DTOs.Quizzes;

namespace BridgeTech.Api.Services.Quizzes;

public class QuizService : IQuizService
{
    private readonly AppDbContext _context;

    public QuizService(AppDbContext context)
    {
        _context = context;
    }

   public async Task<QuizContentResponse?> GetQuizAsync(Guid quizId, CancellationToken cancellationToken = default)
{
    var quiz = await _context.Quizzes
        .AsNoTracking()
        .Where(q => q.QuizId == quizId)
        .Select(q => new QuizContentResponse
        {
            QuizId = q.QuizId,
            Title = q.Title,
            ModuleId = q.ModuleId,
            PassingScore = q.PassingScore,
            Questions = q.Questions
                .OrderBy(quest => quest.OrderIndex)
                .Select(quest => new QuizQuestionResponse
                {
                    QuestionId = quest.QuestionId,
                    QuizId = quest.QuizId,
                    QuestionText = quest.QuestionText,
                    QuestionType = quest.QuestionType,
                    OrderIndex = quest.OrderIndex,
                    Options = quest.Options
                        .OrderBy(opt => opt.OrderIndex)
                        .Select(opt => new QuizOptionResponse
                        {
                            OptionId = opt.OptionId,
                            QuestionId = opt.QuestionId,
                            OptionText = opt.OptionText,
                            OrderIndex = opt.OrderIndex
                        })
                        .ToList()
                })
                .ToList()
        })
        .FirstOrDefaultAsync(cancellationToken);

    if (quiz is null) return null;


    foreach (var question in quiz.Questions)
    {
        question.Options = question.Options
            .OrderBy(_ => Random.Shared.Next())
            .ToList();

       
        for (short i = 0; i < question.Options.Count; i++)
        {
            question.Options[i].OrderIndex = i;
        }
    }

    return quiz;
}
    public async Task<QuizResponse?> GetByIdAsync(Guid quizId, CancellationToken cancellationToken = default)
    {
        return await _context.Quizzes
            .AsNoTracking()
            .Where(q => q.QuizId == quizId)
            .Select(q => new QuizResponse
            {
                QuizId = q.QuizId,
                Title = q.Title,
                ModuleId = q.ModuleId,
                PassingScore = q.PassingScore,
                CreatedAt = q.CreatedAt
            })
            .FirstOrDefaultAsync(cancellationToken);
    }

    public async Task<IReadOnlyList<QuizListItemResponse>> GetAllAsync(CancellationToken cancellationToken = default)
    {
        return await _context.Quizzes
            .AsNoTracking()
            .Select(q => new QuizListItemResponse
            {
                QuizId = q.QuizId,
                Title = q.Title,
                ModuleId = q.ModuleId,
                PassingScore = q.PassingScore,
                CreatedAt = q.CreatedAt
            })
            .ToListAsync(cancellationToken);
    }

    public async Task<QuizResponse> CreateAsync(CreateQuizRequest request, CancellationToken cancellationToken = default)
    {
        var quiz = new Quiz
        {
            QuizId = Guid.NewGuid(),
            Title = request.Title,
            ModuleId = request.ModuleId ?? Guid.Empty,
            PassingScore = request.PassingScore,
            CreatedAt = DateTimeOffset.UtcNow
        };

        _context.Quizzes.Add(quiz);
        await _context.SaveChangesAsync(cancellationToken);

        return new QuizResponse
        {
            QuizId = quiz.QuizId,
            Title = quiz.Title,
            ModuleId = quiz.ModuleId,
            PassingScore = quiz.PassingScore,
            CreatedAt = quiz.CreatedAt
        };
    }

    public async Task<QuizResponse?> UpdateAsync(Guid id, UpdateQuizRequest request, CancellationToken cancellationToken = default)
    {
        var quiz = await _context.Quizzes.FindAsync(new object[] { id }, cancellationToken);
        if (quiz is null) return null;

        if (!string.IsNullOrWhiteSpace(request.Title))
        {
            quiz.Title = request.Title;
        }

        if (request.PassingScore.HasValue)
        {
            quiz.PassingScore = request.PassingScore.Value;
        }

        await _context.SaveChangesAsync(cancellationToken);

        return new QuizResponse
        {
            QuizId = quiz.QuizId,
            Title = quiz.Title,
            ModuleId = quiz.ModuleId,
            PassingScore = quiz.PassingScore,
            CreatedAt = quiz.CreatedAt
        };
    }

    public async Task<bool> DeleteAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var quiz = await _context.Quizzes.FindAsync(new object[] { id }, cancellationToken);
        if (quiz is null) return false;

        _context.Quizzes.Remove(quiz);
        await _context.SaveChangesAsync(cancellationToken);
        return true;
    }

    public async Task<QuizAttemptResponse?> StartAttemptAsync(Guid userId, CreateQuizAttemptRequest request, CancellationToken cancellationToken = default)
{
    if (request.QuizId is null) return null;

    var quiz = await _context.Quizzes.FindAsync(new object[] { request.QuizId.Value }, cancellationToken);
    if (quiz is null) return null;

    
    var existing = await _context.QuizAttempts
        .Where(a => a.UserId == userId && a.QuizId == quiz.QuizId && a.CompletedAt == null)
        .OrderByDescending(a => a.StartedAt)
        .FirstOrDefaultAsync(cancellationToken);

    if (existing is not null)
    {
        return new QuizAttemptResponse
        {
            AttemptId = existing.AttemptId,
            UserId = existing.UserId,
            QuizId = existing.QuizId,
            StartedAt = existing.StartedAt
        };
    }

    var attempt = new QuizAttempt
    {
        AttemptId = Guid.NewGuid(),
        UserId = userId,
        QuizId = request.QuizId.Value,
        StartedAt = request.StartedAt != default ? request.StartedAt : DateTimeOffset.UtcNow
    };

    _context.QuizAttempts.Add(attempt);
    await _context.SaveChangesAsync(cancellationToken);

    return new QuizAttemptResponse
    {
        AttemptId = attempt.AttemptId,
        UserId = attempt.UserId,
        QuizId = attempt.QuizId,
        StartedAt = attempt.StartedAt
    };
}
    public async Task<QuizAttemptResponse?> SubmitAttemptAsync(Guid userId, SubmitQuizAttemptRequest request, CancellationToken cancellationToken = default)
{
    if (request.AttemptId is null) return null;

    var attempt = await _context.QuizAttempts
        .Include(a => a.Quiz)
        .ThenInclude(q => q.Questions)
        .ThenInclude(q => q.Options)
        .FirstOrDefaultAsync(a => a.AttemptId == request.AttemptId.Value && a.UserId == userId, cancellationToken);

    if (attempt is null) return null;
    if (attempt.CompletedAt is not null) return null; 

    int correct = 0;
    var answeredQuestions = new HashSet<Guid>();
    var answersToSave = new List<QuizAnswer>();

    foreach (var answerReq in request.Answers)
    {
        if (answerReq.QuestionId is null || answerReq.OptionId is null) continue;
        if (!answeredQuestions.Add(answerReq.QuestionId.Value)) continue; 

        var question = attempt.Quiz.Questions.FirstOrDefault(q => q.QuestionId == answerReq.QuestionId.Value);
        if (question is null) continue;

        var selectedOption = question.Options.FirstOrDefault(o => o.OptionId == answerReq.OptionId.Value);
        bool isCorrect = selectedOption?.IsCorrect ?? false;

        if (isCorrect) correct++;

        answersToSave.Add(new QuizAnswer
        {
            AnswerId = Guid.NewGuid(),
            AttemptId = attempt.AttemptId,
            QuestionId = answerReq.QuestionId.Value,
            OptionId = answerReq.OptionId.Value,
            IsCorrect = isCorrect
        });
    }

    
    int totalQuestions = attempt.Quiz.Questions.Count;
    int percent = totalQuestions == 0 ? 0 : (int)Math.Round(correct * 100.0 / totalQuestions);

    attempt.CompletedAt = DateTimeOffset.UtcNow;
    attempt.Score = (short)percent;
    attempt.Passed = percent >= attempt.Quiz.PassingScore;

    await _context.QuizAnswers.AddRangeAsync(answersToSave, cancellationToken);
    await _context.SaveChangesAsync(cancellationToken);

    return new QuizAttemptResponse
    {
        AttemptId = attempt.AttemptId,
        UserId = attempt.UserId,
        QuizId = attempt.QuizId,
        StartedAt = attempt.StartedAt,
        Score = attempt.Score,
        Passed = attempt.Passed,
        CompletedAt = attempt.CompletedAt
    };
}
    public async Task<IReadOnlyList<QuizAttemptSummaryResponse>> GetMyAttemptsAsync(Guid userId, CancellationToken cancellationToken = default)
{
    return await _context.QuizAttempts
        .AsNoTracking()
        .Where(a => a.UserId == userId && a.CompletedAt != null)
        .OrderByDescending(a => a.CompletedAt)
        .Select(a => new QuizAttemptSummaryResponse
        {
            AttemptId = a.AttemptId,
            QuizId = a.QuizId,
            QuizTitle = a.Quiz.Title,
            Score = a.Score ?? 0,
            PassingScore = a.Quiz.PassingScore,
            Passed = a.Passed ?? false,
            StartedAt = a.StartedAt,
            CompletedAt = a.CompletedAt!.Value
        })
        .ToListAsync(cancellationToken);
}

public async Task<IReadOnlyList<QuizRetakeResponse>> GetQuizzesToRetakeAsync(Guid userId, CancellationToken cancellationToken = default)
{
    var attempts = await _context.QuizAttempts
        .AsNoTracking()
        .Where(a => a.UserId == userId && a.CompletedAt != null)
        .Select(a => new { a.QuizId, a.Score, a.Passed, CompletedAt = a.CompletedAt!.Value })
        .ToListAsync(cancellationToken);

    var lastScoreByFailedQuiz = attempts
        .GroupBy(a => a.QuizId)
        .Select(g => g.OrderByDescending(a => a.CompletedAt).First())
        .Where(a => a.Passed != true)
        .ToDictionary(a => a.QuizId, a => a.Score ?? 0);

    if (lastScoreByFailedQuiz.Count == 0) return Array.Empty<QuizRetakeResponse>();

    var quizIds = lastScoreByFailedQuiz.Keys.ToList();

    var result = await _context.Quizzes
        .AsNoTracking()
        .Where(q => quizIds.Contains(q.QuizId))
        .Join(_context.Modules, q => q.ModuleId, m => m.ModuleId, (q, m) => new QuizRetakeResponse
        {
            QuizId = q.QuizId,
            ModuleId = q.ModuleId,
            ModuleTitle = m.Title,
            Title = q.Title,
            PassingScore = q.PassingScore
        })
        .ToListAsync(cancellationToken);

    foreach (var r in result) r.LastScore = (short)lastScoreByFailedQuiz[r.QuizId];
    return result;
}
}