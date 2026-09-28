import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { clearAuthTokens } from "../utils/authStorage";

export default function SignOut() {
  const navigate = useNavigate();

  useEffect(() => {
    clearAuthTokens();
    navigate("/login", { replace: true });
  }, [navigate]);

  return <p>Signing you out...</p>;
}
