import { apiFetch } from "../utils/apiClient";


export async function listCourseOutline() {
  // Load modules and staff-accessible lessons.
  const [modules, lessons] = await Promise.all([
    apiFetch("/api/modules/admin"),
    apiFetch("/api/lessons/admin"),
  ]);

  // Group lessons under their corresponding modules.
  return modules.map((module) => ({
    moduleId: module.moduleId,
    title: module.title,
    status: module.status ?? "Draft",

    lessons: lessons
      .filter((lesson) => lesson.moduleId === module.moduleId)
      .sort((a, b) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0))
      .map((lesson) => ({
        lessonId: lesson.lessonId,
        title: lesson.title,
        orderIndex: lesson.orderIndex,
        status: lesson.status ?? "Draft",
      })),
  }));
}


export async function listQuizzes() {
  return apiFetch("/api/admin/quizzes");
}

export async function getQuiz(quizId) {
  return apiFetch(`/api/admin/quizzes/${quizId}`);
}

export async function saveQuiz(quiz) {
  return apiFetch(
    quiz.quizId ? `/api/admin/quizzes/${quiz.quizId}` : "/api/admin/quizzes",
    {
      method: quiz.quizId ? "PUT" : "POST",
      body: JSON.stringify(quiz),
    },
  );
}

export async function deleteQuiz(quizId) {
  await apiFetch(`/api/admin/quizzes/${quizId}`, { method: "DELETE" });
}
