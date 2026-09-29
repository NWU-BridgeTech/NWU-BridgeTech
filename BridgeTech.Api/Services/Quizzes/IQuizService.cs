using BridgeTech.Api.DTOs.Quizzes;

namespace BridgeTech.Api.Services.Quizzes;

public interface IQuizService
{
    Task<QuizContentResponse?> GetQuizAsync(Guid quizId, CancellationToken cancellationToken = default);
    Task<QuizResponse?> GetByIdAsync(Guid quizId, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<QuizListItemResponse>> GetAllAsync(CancellationToken cancellationToken = default);
    Task<QuizResponse> CreateAsync(CreateQuizRequest request, CancellationToken cancellationToken = default);
    Task<QuizResponse?> UpdateAsync(Guid id, UpdateQuizRequest request, CancellationToken cancellationToken = default);
    Task<bool> DeleteAsync(Guid id, CancellationToken cancellationToken = default);
    Task<QuizAttemptResponse?> StartAttemptAsync(Guid userId, CreateQuizAttemptRequest request, CancellationToken cancellationToken = default);
    Task<QuizAttemptResponse?> SubmitAttemptAsync(Guid userId, SubmitQuizAttemptRequest request, CancellationToken cancellationToken = default);
}
