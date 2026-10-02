const storage = window.localStorage;

export function getToken() {
  return storage.getItem("token");
}

export function getRefreshToken() {
  return storage.getItem("refreshToken");
}

export function setAuthTokens(token, refreshToken) {
  storage.setItem("token", token);
  if (refreshToken) storage.setItem("refreshToken", refreshToken);
}

export function clearAuthTokens() {
  storage.removeItem("token");
  storage.removeItem("refreshToken");
  storage.removeItem("user");
}
