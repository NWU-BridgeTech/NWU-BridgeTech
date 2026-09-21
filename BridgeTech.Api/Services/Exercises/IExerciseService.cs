using BridgeTech.Api.DTOs.Exercises;
using BridgeTech.Api.Domain.Entities;

namespace BridgeTech.Api.Services.Exercises;

public interface IExerciseService
{
    Task<IReadOnlyList<ExerciseListItemResponse>> GetAllAsync(CancellationToken cancellationToken = default);
    Task<ExerciseResponse?> GetByIdAsync(Guid exerciseId, CancellationToken cancellationToken = default);
    Task<ExerciseResponse> CreateAsync(CreateExerciseRequest request, CancellationToken cancellationToken = default);
    Task<ExerciseResponse?> UpdateAsync(Guid exerciseId, UpdateExerciseRequest request, CancellationToken cancellationToken = default);
    Task<bool> DeleteAsync(Guid exerciseId, CancellationToken cancellationToken = default);
    Task<ExerciseSubmission?> CreateSubmissionAsync(Guid exerciseId, Guid userId, string githubRepoUrl, CancellationToken cancellationToken = default);
    Task<ExerciseSubmission?> GetSubmissionAsync(Guid submissionId, CancellationToken cancellationToken = default);
}
