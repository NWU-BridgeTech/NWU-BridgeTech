import { apiFetch } from "./apiClient";

export function getInstructorModules() {
  return apiFetch("/instructor/content/modules");
}

export function createInstructorModule(module) {
  return apiFetch("/instructor/content/modules", {
    method: "POST",
    body: JSON.stringify(module),
  });
}

export function getInstructorModuleContent(moduleId) {
  return apiFetch(`/instructor/content/modules/${moduleId}`);
}

export function updateInstructorModule(moduleId, updates) {
  return apiFetch(`/instructor/content/modules/${moduleId}`, {
    method: "PUT",
    body: JSON.stringify(updates),
  });
}

export function deleteInstructorModule(moduleId) {
  return apiFetch(`/instructor/content/modules/${moduleId}`, {
    method: "DELETE",
  });
}

export function createInstructorLesson(moduleId, lesson) {
  return apiFetch(`/instructor/content/modules/${moduleId}/lessons`, {
    method: "POST",
    body: JSON.stringify(lesson),
  });
}

export function updateInstructorLesson(lessonId, lesson) {
  return apiFetch(`/instructor/content/lessons/${lessonId}`, {
    method: "PUT",
    body: JSON.stringify(lesson),
  });
}

export function moveInstructorLesson(lessonId, direction) {
  return apiFetch(`/instructor/content/lessons/${lessonId}/move`, {
    method: "POST",
    body: JSON.stringify({ direction }),
  });
}

export function addInstructorQuiz(lessonId, quiz) {
  return apiFetch(`/instructor/content/lessons/${lessonId}/quizzes`, {
    method: "POST",
    body: JSON.stringify(quiz),
  });
}

export function addInstructorQuizQuestion(quizId, question) {
  return apiFetch(`/instructor/content/quizzes/${quizId}/questions`, {
    method: "POST",
    body: JSON.stringify(question),
  });
}

export function updateInstructorQuizQuestion(quizId, questionIndex, question) {
  return apiFetch(`/instructor/content/quizzes/${quizId}/questions/${questionIndex}`, {
    method: "PUT",
    body: JSON.stringify(question),
  });
}

export function addInstructorExercise(moduleId, exercise) {
  return apiFetch(`/instructor/content/modules/${moduleId}/exercises`, {
    method: "POST",
    body: JSON.stringify(exercise),
  });
}
