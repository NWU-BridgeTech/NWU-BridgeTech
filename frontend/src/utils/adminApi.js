// API calls used by the admin Modules and Lessons pages.
import { API_URL } from "../config.js";

async function request(path, options = {}) {
  const token = localStorage.getItem("token");

  if (!path.startsWith("/api/")) {
    throw new Error(`API paths must start with /api/: ${path}`);
  }

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    cache: "no-store",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  if (!response.ok) {
    throw new Error(await readErrorMessage(response));
  }

  return response.status === 204 ? null : response.json();
}

// Turns an error response from the backend into a message an admin can read.
async function readErrorMessage(response) {
  if (response.status === 401) {
    return "Your session has expired. Please log in again.";
  }
  if (response.status === 403) {
    return "You need an admin account to do this.";
  }

  try {
    const body = await response.json();
    if (body.message) return body.message;
    if (body.errors) {
      const firstError = Object.values(body.errors).flat()[0];
      if (firstError) return firstError;
    }
    if (body.title) return body.title;
  } catch {
    // The response had no JSON body, so fall through to the generic message.
  }

  return `Request failed (${response.status}). Please try again.`;
}

// Modules
export function getAdminModules() {
  return request(`/api/modules/admin?timestamp=${Date.now()}`);
}

export function createModule(module) {
  return request("/api/modules", { method: "POST", body: JSON.stringify(module) });
}

export function updateModule(moduleId, changes) {
  return request(`/api/modules/${moduleId}`, {
    method: "PUT",
    body: JSON.stringify(changes),
  });
}

export function deleteModule(moduleId) {
  return request(`/api/modules/${moduleId}`, { method: "DELETE" });
}

// Lessons
export function getAdminLessons() {
  return request("/api/lessons/admin");
}

export function createLesson(moduleId, lesson) {
  return request(`/api/modules/${moduleId}/lessons`, {
    method: "POST",
    body: JSON.stringify(lesson),
  });
}

export function updateLesson(lessonId, changes) {
  return request(`/api/lessons/${lessonId}`, {
    method: "PUT",
    body: JSON.stringify(changes),
  });
}
