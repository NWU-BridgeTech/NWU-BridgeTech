import StudentLayout from "../layouts/StudentLayout";
import SupportTicketForm from "../components/student/SupportTicketForm";
import "./StudentProfile.css";

export default function StudentFeedback() {
  return (
    <StudentLayout title="Feedback">
      <div className="content student-profile-page">
        <header className="profile-page-heading">
          <p className="eyebrow">Support</p>
          <h2>Tell us what you think</h2>
          <p>
            Share a suggestion or let us know about a problem. The BridgeTech
            team reads every message.
          </p>
        </header>
        <section
          className="profile-section"
          aria-labelledby="feedback-form-heading"
        >
          <div className="profile-section-heading">
            <h3 id="feedback-form-heading">Send feedback</h3>
            <p>Pick the category that fits best, then add the details.</p>
          </div>
          <SupportTicketForm defaultCategory="Feedback" />
        </section>
      </div>
    </StudentLayout>
  );
}
