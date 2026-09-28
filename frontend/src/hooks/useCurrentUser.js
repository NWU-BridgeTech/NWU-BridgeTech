import { useEffect, useState } from "react";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5174";

export default function useCurrentUser() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(() =>
    Boolean(localStorage.getItem("token")),
  );
  const [error, setError] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;

    function loadUser() {
      return fetch(`${API_URL}/api/users/me`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      })
        .then((response) => {
          if (response.status === 401) {
            localStorage.removeItem("token");
            localStorage.removeItem("refreshToken");
            window.location.href = "/login";
            return null;
          }
          if (!response.ok) throw new Error("Unable to load your profile.");
          return response.json();
        })
        .then((data) => {
          if (data) setUser(data);
        })
        .catch(() => setError("Unable to load your profile."))
        .finally(() => setLoading(false));
    }

    window.addEventListener("user-profile-updated", loadUser);
    loadUser();
    return () => window.removeEventListener("user-profile-updated", loadUser);
  }, []);

  return { user, loading, error };
}
