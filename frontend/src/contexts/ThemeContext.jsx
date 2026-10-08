import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import { getToken } from "../utils/authStorage";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5174";
const ThemeContext = createContext(null);

function getStoredTheme() {
  const storedTheme = window.localStorage.getItem("bridgetech-theme");
  return ["system", "light", "dark"].includes(storedTheme) ? storedTheme : "light";
}

function getSystemTheme() {
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function getStoredProfilePicture() {
  return window.localStorage.getItem("bridgetech-profile-picture") || null;
}

export function ThemeProvider({ children }) {
  const location = useLocation();
  const [theme, setTheme] = useState(getStoredTheme);
  const [profilePictureUrl, setProfilePictureUrl] = useState(
    getStoredProfilePicture,
  );

  const effectiveTheme = theme === "system" ? getSystemTheme() : theme;
  const isAuthenticated = Boolean(getToken());

  useEffect(() => {
    if (isAuthenticated) {
      document.documentElement.dataset.theme = effectiveTheme;
    } else {
      delete document.documentElement.dataset.theme;
    }
    window.localStorage.setItem("bridgetech-theme", theme);
  }, [theme, effectiveTheme, isAuthenticated, location.pathname]);

  useEffect(() => {
    const token = getToken();
    if (!token) {
      setProfilePictureUrl(null);
      window.localStorage.removeItem("bridgetech-profile-picture");
      return undefined;
    }

    const controller = new AbortController();
    fetch(`${API_URL}/api/users/me/preferences`, {
      headers: { Authorization: `Bearer ${token}` },
      signal: controller.signal,
    })
      .then((response) => {
        if (!response.ok) throw new Error("Unable to load preferences.");
        return response.json();
      })
      .then((preferences) => {
        if (["system", "light", "dark"].includes(preferences.theme)) {
          setTheme(preferences.theme);
        }
        const nextProfilePictureUrl = preferences.profilePictureUrl ?? null;
        setProfilePictureUrl(nextProfilePictureUrl);
        if (nextProfilePictureUrl) {
          window.localStorage.setItem(
            "bridgetech-profile-picture",
            nextProfilePictureUrl,
          );
        } else {
          window.localStorage.removeItem("bridgetech-profile-picture");
        }
      })
      .catch((error) => {
        if (error.name !== "AbortError") console.error(error);
      });

    return () => controller.abort();
  }, [location.pathname]);

  function updateProfilePictureUrl(nextProfilePictureUrl) {
    setProfilePictureUrl(nextProfilePictureUrl);
    if (nextProfilePictureUrl) {
      window.localStorage.setItem(
        "bridgetech-profile-picture",
        nextProfilePictureUrl,
      );
    } else {
      window.localStorage.removeItem("bridgetech-profile-picture");
    }
  }

  useEffect(() => {
    if (theme !== "system") return undefined;
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const updateTheme = () => {
      document.documentElement.dataset.theme = getSystemTheme();
    };
    mediaQuery.addEventListener("change", updateTheme);
    return () => mediaQuery.removeEventListener("change", updateTheme);
  }, [theme]);

  async function updateTheme(nextTheme) {
    setTheme(nextTheme);
    const token = getToken();
    if (!token) return;

    const response = await fetch(`${API_URL}/api/users/me/preferences`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ theme: nextTheme }),
    });
    if (!response.ok) throw new Error("Unable to save your theme preference.");
  }

  const value = useMemo(
    () => ({
      theme,
      effectiveTheme,
      profilePictureUrl,
      setProfilePictureUrl: updateProfilePictureUrl,
      updateTheme,
    }),
    [theme, effectiveTheme, profilePictureUrl],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error("useTheme must be used within ThemeProvider.");
  return context;
}
