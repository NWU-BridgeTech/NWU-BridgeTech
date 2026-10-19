import { Navigate } from "react-router-dom";
import PublicHomepage from "../pages/PublicHomepage";
import { getToken } from "../utils/authStorage";

function getTokenPayload() {
  const token = getToken();
  if (!token) return null;

  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    return payload.exp && payload.exp * 1000 > Date.now() ? payload : null;
  } catch {
    return null;
  }
}

export default function RootRoute() {
  const payload = getTokenPayload();

  if (payload?.account_setup_required === "true") {
    return <Navigate to="/account/setup" replace />;
  }

  if (payload) return <Navigate to="/home" replace />;

  return <PublicHomepage />;
}
