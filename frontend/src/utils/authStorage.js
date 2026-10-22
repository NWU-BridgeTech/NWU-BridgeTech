const storage = window.localStorage;
export const AUTH_STATE_CHANGED_EVENT = "bridgetech-auth-state-changed";

function announceAuthStateChanged() {
  window.dispatchEvent(new Event(AUTH_STATE_CHANGED_EVENT));
}

export function getToken() {
  return storage.getItem("token");
}

export function getRefreshToken() {
  return storage.getItem("refreshToken");
}

export function setAuthTokens(token, refreshToken) {
  storage.setItem("token", token);
  if (refreshToken) storage.setItem("refreshToken", refreshToken);
  announceAuthStateChanged();
}

export function clearAuthTokens() {
  storage.removeItem("token");
  storage.removeItem("refreshToken");
  storage.removeItem("user");
  announceAuthStateChanged();
}
