const API_BASE = "http://localhost:5174/api"; // match your actual backend port

export async function apiFetch(path, options = {}) {
  const token = localStorage.getItem("token"); // or wherever the JWT is stored after login

  const res = await fetch(`${API_BASE}${path}`, {
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
