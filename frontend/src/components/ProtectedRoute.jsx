import { Navigate, Outlet } from "react-router-dom";
import { getToken } from "../utils/authStorage";

function getTokenPayload() {
  const token = getToken();
  if (!token) return null;

  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    if (!payload.exp || payload.exp * 1000 <= Date.now()) return null;
    return payload;
  } catch {
    return null;
  }
}

export default function ProtectedRoute({ requiredRole }) {
  const payload = getTokenPayload();
  const role =
    payload?.role ||
    payload?.["http://schemas.microsoft.com/ws/2008/06/identity/claims/role"];

  const roleAllowed = Array.isArray(requiredRole)
    ? requiredRole.includes(role)
    : !requiredRole || role === requiredRole;

  if (!payload || !roleAllowed) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}
