import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function SignOut() {
  const navigate = useNavigate();

  useEffect(() => {
    localStorage.removeItem("token");
    localStorage.removeItem("refreshToken");
    navigate("/login", { replace: true });
  }, [navigate]);

  return <p>Signing you out...</p>;
}
