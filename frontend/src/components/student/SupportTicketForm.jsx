import { useState } from "react";
import {
  SUPPORT_CATEGORIES,
  createSupportTicket,
} from "../../services/supportTicketApi";
import "../../pages/StudentProfile.css";

const MAX_DESCRIPTION_LENGTH = 2000;

function submitErrorMessage(error) {
  if (error.status === 400 && error.message) return error.message;
  if (error.status === 401) {
    return "Your session has expired. Sign in again to send your report.";
  }
  return "Unable to send your report. Check your connection and try again.";
}

export default function SupportTicketForm({ defaultCategory = "" }) {
  const [category, setCategory] = useState(defaultCategory);
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function submit(event) {
    event.preventDefault();
    setMessage("");
    setError("");

    if (!description.trim()) {
      setError("Describe the problem before submitting.");
      return;
    }

    setSubmitting(true);
    try {
      await createSupportTicket(category, description.trim());
      setCategory(defaultCategory);
      setDescription("");
      setMessage("Thanks, your report was sent to the BridgeTech team.");
    } catch (submitError) {
      setError(submitErrorMessage(submitError));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form className="profile-form support-ticket-form" onSubmit={submit}>
      <label className="wide-field">
        What's this about?
        <select
          value={category}
          onChange={(event) => setCategory(event.target.value)}
          required
        >
          <option value="" disabled>
            Select a category
          </option>
          {SUPPORT_CATEGORIES.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>
      <label className="wide-field">
        Describe the problem
        <textarea
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          maxLength={MAX_DESCRIPTION_LENGTH}
          rows="5"
          placeholder="What happened, and where on BridgeTech did it happen?"
          required
        />
      </label>
      <div className="profile-actions wide-field">
        <button className="btn blue" type="submit" disabled={submitting}>
          {submitting ? "Sending..." : "Submit"}
        </button>
        {message ? (
          <span className="profile-message success" role="status">
            {message}
          </span>
        ) : null}
        {error ? (
          <span className="profile-message error" role="alert">
            {error}
          </span>
        ) : null}
      </div>
    </form>
  );
}
