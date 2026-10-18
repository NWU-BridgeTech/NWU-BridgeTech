import { apiFetch } from "../utils/apiClient";


export async function listCourseOutline() {
  // Load modules and staff-accessible lessons.
  const [modules, lessons] = await Promise.all([
    apiFetch("/modules/admin"),
    apiFetch("/lessons/admin"),
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
