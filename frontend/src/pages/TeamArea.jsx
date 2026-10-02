import { Link } from "react-router-dom";
import AppLayout from "../layouts/AppLayout";

export default function TeamArea({ role }) {
  const isInstructor = role === "Instructor";

  return (
    <AppLayout>
      <header className="top dashboard-header">
        <div>
          <h1>{role} area</h1>
          <p>Welcome to your BridgeTech team workspace.</p>
        </div>
        <div className="dashboard-header-actions">
          <Link className="btn blue" to={isInstructor ? "/lessons" : "/admin"}>
            {isInstructor ? "View learning materials" : "Open administration"}
          </Link>
        </div>
      </header>
    </AppLayout>
  );
}