import { API_URL } from "../config.js";

export async function apiFetch(path, options = {}) {
  if (!path.startsWith("/api/")) {
    throw new Error(`API paths must start with /api/: ${path}`);
  }

  const token = localStorage.getItem("token"); // or wherever the JWT is stored after login

  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: token ? `Bearer ${token}` : "",
      ...options.headers,
    },
  });

  const text = await res.text();

  if (!res.ok) {
    const body = parseJson(text);
    const error = new Error(
      body?.message ?? body?.title ?? `Request failed: ${res.status}`,
    );
    error.status = res.status;
    throw error;
  }

  return text ? JSON.parse(text) : null;
}

function parseJson(text) {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}
