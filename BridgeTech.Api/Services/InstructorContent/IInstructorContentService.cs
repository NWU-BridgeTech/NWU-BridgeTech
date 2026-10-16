using BridgeTech.Api.DTOs.InstructorContent;
using BridgeTech.Api.DTOs.Modules;

namespace BridgeTech.Api.Services.InstructorContent;

public interface IInstructorContentService
{
    Task<InstructorModuleResponse> CreateModuleAsync(Guid instructorId, CreateInstructorModuleRequest request, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<InstructorModuleResponse>> GetModulesAsync(Guid instructorId, CancellationToken cancellationToken = default);
    Task<InstructorModuleResponse?> UpdateModuleAsync(Guid instructorId, Guid moduleId, UpdateModuleRequest request, CancellationToken cancellationToken = default);
    Task<bool> DeleteModuleAsync(Guid instructorId, Guid moduleId, CancellationToken cancellationToken = default);
    Task<InstructorModuleContentResponse?> GetModuleContentAsync(Guid instructorId, Guid moduleId, CancellationToken cancellationToken = default);
    Task<InstructorLessonResponse?> CreateLessonAsync(Guid instructorId, Guid moduleId, SaveInstructorLessonRequest request, CancellationToken cancellationToken = default);
    Task<InstructorLessonResponse?> UpdateLessonAsync(Guid instructorId, Guid lessonId, SaveInstructorLessonRequest request, CancellationToken cancellationToken = default);
    Task<bool> MoveLessonAsync(Guid instructorId, Guid lessonId, int direction, CancellationToken cancellationToken = default);
    Task<InstructorQuizPreviewResponse?> AddQuizAsync(Guid instructorId, Guid lessonId, AddInstructorQuizRequest request, CancellationToken cancellationToken = default);
    Task<InstructorQuizQuestionResponse?> AddQuizQuestionAsync(Guid instructorId, Guid quizId, InstructorQuizQuestionRequest request, CancellationToken cancellationToken = default);
    Task<InstructorQuizQuestionResponse?> UpdateQuizQuestionAsync(Guid instructorId, Guid quizId, int questionIndex, InstructorQuizQuestionRequest request, CancellationToken cancellationToken = default);
    Task<bool?> AddExerciseAsync(Guid instructorId, Guid moduleId, AddInstructorExerciseRequest request, CancellationToken cancellationToken = default);
}
