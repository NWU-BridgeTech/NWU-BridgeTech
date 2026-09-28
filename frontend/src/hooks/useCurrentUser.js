import { useEffect, useState } from "react";
import { clearAuthTokens, getToken } from "../utils/authStorage";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5174";

export default function useCurrentUser() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(() => Boolean(getToken()));
  const [error, setError] = useState("");

  useEffect(() => {
    const token = getToken();
    if (!token) return;

    function loadUser() {
      return fetch(`${API_URL}/api/users/me`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      })
        .then((response) => {
          if (response.status === 401) {
            clearAuthTokens();
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
