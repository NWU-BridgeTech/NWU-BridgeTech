import AppLayout from "../layouts/AppLayout";
import InstructorPlanner from "../components/InstructorPlanner";
import "./TeamArea.css";
import "./InstructorCalendar.css";

export default function InstructorCalendar() {
  return (
    <AppLayout>
      <header className="top dashboard-header">
        <div>
          <h1>Calendar &amp; notes</h1>
          <p>Plan your schedule and keep personal teaching notes in one place.</p>
        </div>
      </header>
      <section className="content instructor-calendar-page">
        <InstructorPlanner pageLayout />
      </section>
    </AppLayout>
  );
}
