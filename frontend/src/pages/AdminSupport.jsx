import { useEffect, useState } from "react";
import AppLayout from "../layouts/AppLayout";
import {
  categoryLabel,
  listSupportTickets,
  updateSupportTicketStatus,
} from "../services/supportTicketApi";
import "./Admin.css";
import "./AdminModules.css";
import "./AdminStudents.css";
import "./AdminSupport.css";

const dateFormatter = new Intl.DateTimeFormat("en-ZA", {
  dateStyle: "medium",
  timeStyle: "short",
});

function byOpenThenNewest(a, b) {
  if (a.status !== b.status) return a.status === "Open" ? -1 : 1;
  return new Date(b.createdAt) - new Date(a.createdAt);
}

export default function AdminSupport() {
  const [tickets, setTickets] = useState([]);
  const [loadState, setLoadState] = useState("loading");
  const [reloadToken, setReloadToken] = useState(0);
  const [message, setMessage] = useState("");
  const [updatingId, setUpdatingId] = useState(null);

  useEffect(() => {
    let cancelled = false;
    listSupportTickets().then(
      (loaded) => {
        if (cancelled) return;
        setTickets(loaded ?? []);
        setLoadState("ready");
      },
      () => {
        if (!cancelled) setLoadState("error");
      },
    );
    return () => {
      cancelled = true;
    };
  }, [reloadToken]);

  function retryLoad() {
    setMessage("");
    setLoadState("loading");
    setReloadToken((token) => token + 1);
  }

  async function changeStatus(ticket, status) {
    setUpdatingId(ticket.id);
    setMessage("");
    try {
      await updateSupportTicketStatus(ticket.id, status);
      setTickets((current) =>
        current.map((item) =>
          item.id === ticket.id ? { ...item, status } : item,
        ),
      );
      setMessage(
        `${ticket.studentName}'s ticket was marked ${status.toLowerCase()}.`,
      );
    } catch (error) {
      setMessage(`Could not update the ticket: ${error.message}`);
    } finally {
      setUpdatingId(null);
    }
  }

  const sortedTickets = [...tickets].sort(byOpenThenNewest);
  const openCount = tickets.filter((ticket) => ticket.status === "Open").length;

  return (
    <AppLayout>
      <header className="top dashboard-header">
        <div>
          <h1>Support tickets</h1>
          <p>Problems and feedback reported by students.</p>
        </div>
      </header>
      <div className="content modules-page students-page support-page">
        <p className="modules-message" role="status">
          {loadState === "loading" ? "Loading support tickets..." : message}
        </p>
        {loadState === "error" && (
          <section className="card modules-empty" role="alert">
            <h3>Couldn&apos;t load support tickets</h3>
            <p>Check your connection and try again.</p>
            <button className="btn" type="button" onClick={retryLoad}>
              Retry
            </button>
          </section>
        )}
        {loadState === "ready" && (
          <section className="card" aria-labelledby="support-list-heading">
            <h2 id="support-list-heading">All tickets</h2>
            <p className="sub">
              {openCount} open · {tickets.length - openCount} resolved
            </p>
            {sortedTickets.length > 0 ? (
              <table className="modules-table">
                <thead>
                  <tr>
                    <th scope="col">Student</th>
                    <th scope="col">Category</th>
                    <th scope="col">Description</th>
                    <th scope="col">Submitted</th>
                    <th scope="col">Status</th>
                    <th scope="col">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedTickets.map((ticket) => (
                    <tr key={ticket.id}>
                      <td>
                        <strong>{ticket.studentName}</strong>
                        <p>
                          <a href={`mailto:${ticket.studentEmail}`}>
                            {ticket.studentEmail}
                          </a>
                        </p>
                      </td>
                      <td data-label="Category">{categoryLabel(ticket.category)}</td>
                      <td className="support-description" data-label="Description">
                        {ticket.description}
                      </td>
                      <td data-label="Submitted">
                        {dateFormatter.format(new Date(ticket.createdAt))}
                      </td>
                      <td data-label="Status">
                        <span
                          className={`module-status ${ticket.status === "Open" ? "draft" : "published"}`}
                        >
                          {ticket.status}
                        </span>
                      </td>
                      <td className="support-action">
                        <button
                          className="module-edit"
                          type="button"
                          disabled={updatingId === ticket.id}
                          onClick={() =>
                            changeStatus(
                              ticket,
                              ticket.status === "Open" ? "Resolved" : "Open",
                            )
                          }
                        >
                          {ticket.status === "Open" ? "Mark resolved" : "Reopen"}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="modules-empty">
                <h3>No support tickets yet</h3>
                <p>Reports from students will appear here.</p>
              </div>
            )}
          </section>
        )}
      </div>
    </AppLayout>
  );
}
