import { apiFetch } from "../utils/apiClient";

export async function listCourseOutline() {
  const modules = await apiFetch("/modules");
  return Promise.all(
    modules.map(async (module) => {
      const lessons = await apiFetch(`/modules/${module.moduleId}/lessons`);
      return {
        moduleId: module.moduleId,
        title: module.title,
        status: module.status ?? "Published",
        lessons: lessons.map((lesson) => ({
          lessonId: lesson.lessonId,
          title: lesson.title,
          orderIndex: lesson.orderIndex,
          status: lesson.status ?? "Published",
        })),
      };
    }),
  );
}

export async function listQuizzes() {
  return apiFetch("/admin/quizzes");
}

export async function getQuiz(quizId) {
  return apiFetch(`/admin/quizzes/${quizId}`);
}

export async function saveQuiz(quiz) {
  return apiFetch(
    quiz.quizId ? `/admin/quizzes/${quiz.quizId}` : "/admin/quizzes",
    {
      method: quiz.quizId ? "PUT" : "POST",
      body: JSON.stringify(quiz),
    },
  );
}

export async function deleteQuiz(quizId) {
  await apiFetch(`/admin/quizzes/${quizId}`, { method: "DELETE" });
}
