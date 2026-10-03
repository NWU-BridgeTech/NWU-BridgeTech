import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import AppLayout from "../layouts/AppLayout";
import "./Admin.css";
import "./AdminModules.css";
import "./AdminAdministrators.css";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5174";
const STAFF_ROLES = [
  { value: "Instructor", label: "Instructor" },
  { value: "Admin", label: "Administrator" },
  { value: "SuperAdmin", label: "Super Admin" },
];
const ROLE_DESCRIPTIONS = [
  { name: "Instructor", description: "Access the instructor learning area." },
  { name: "Administrator", description: "Manage learning content and students." },
  { name: "Super Admin", description: "Manage administrator accounts and the platform." },
];

async function staffRequest(path, options = {}) {
  const send = (token) =>
    fetch(`${API_URL}${path}`, {
      ...options,
      headers: {
        ...(options.body ? { "Content-Type": "application/json" } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options.headers,
      },
    });

  let response = await send(localStorage.getItem("token"));
  if (response.status === 401) {
    const refreshToken = localStorage.getItem("refreshToken");
    if (refreshToken) {
      const refreshResponse = await fetch(`${API_URL}/api/auth/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken }),
      });
      const refreshData = await refreshResponse.json().catch(() => ({}));
      if (refreshResponse.ok && refreshData.token) {
        localStorage.setItem("token", refreshData.token);
        if (refreshData.refreshToken) {
          localStorage.setItem("refreshToken", refreshData.refreshToken);
        }
        response = await send(refreshData.token);
      }
    }
  }

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message =
      response.status === 401
        ? "Your Admin session has expired or is not authorized. Sign in with an Admin or Super Admin account."
        : data.message || `Request failed (${response.status}).`;
    throw new Error(message);
  }
  return data;
}

function mapStaffUser(user) {
  return {
    id: user.userId,
    name: `${user.firstName} ${user.lastName}`,
    email: user.email,
    role: user.role,
    status: user.accountSetupRequired ? "Pending" : "Active",
    lastActive: "Not tracked",
  };
}

async function getStaffUsers() {
  const users = await staffRequest("/api/users/staff");
  return users.map(mapStaffUser);
}

export default function AdminAdministrators() {
  const [administrators, setAdministrators] = useState([]);
  const [search, setSearch] = useState("");
  const [role, setRole] = useState("All");
  const [status, setStatus] = useState("All");
  const [formOpen, setFormOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [resendingId, setResendingId] = useState(null);
  const [loadError, setLoadError] = useState("");
  const [message, setMessage] = useState("");
  const currentUser = JSON.parse(localStorage.getItem("user") || "null");
  const availableRoles =
    currentUser?.role === "SuperAdmin"
      ? STAFF_ROLES
      : STAFF_ROLES.filter((staffRole) => staffRole.value !== "SuperAdmin");

  useEffect(() => {
    let cancelled = false;
    async function loadStaffUsers() {
      try {
        const users = await getStaffUsers();
        if (!cancelled) {
          setAdministrators(users);
          setLoadError("");
        }
      } catch (error) {
        if (!cancelled) setLoadError(error.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadStaffUsers();
    window.addEventListener("focus", loadStaffUsers);

    return () => {
      cancelled = true;
      window.removeEventListener("focus", loadStaffUsers);
    };
  }, []);

  const activeCount = administrators.filter(
    (admin) => admin.status === "Active",
  ).length;
  const invitedCount = administrators.length - activeCount;

  const visibleAdmins = administrators.filter((admin) => {
    const matchesSearch = `${admin.name} ${admin.email}`
      .toLowerCase()
      .includes(search.trim().toLowerCase());
    return (
      matchesSearch &&
      (role === "All" || admin.role === role) &&
      (status === "All" || admin.status === status)
    );
  });

  function clearFilters() {
    setSearch("");
    setRole("All");
    setStatus("All");
  }

  async function saveAdmin(event) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const nameParts = form.get("name").trim().split(/\s+/);
    const email = form.get("email").trim().toLowerCase();
    if (nameParts.length < 2) {
      setMessage("Enter the team member's first and last name.");
      return;
    }
    if (
      administrators.some(
        (admin) => admin.email.toLowerCase() === email,
      )
    ) {
      setMessage("A team account with this email address already exists.");
      return;
    }

    setSaving(true);
    setMessage("");
    try {
      const result = await staffRequest("/api/users/staff", {
        method: "POST",
        body: JSON.stringify({
          firstName: nameParts[0],
          lastName: nameParts.slice(1).join(" "),
          email,
          role: form.get("role"),
        }),
      });
      setAdministrators((current) => [mapStaffUser(result), ...current]);
      clearFilters();
      setFormOpen(false);
      setMessage(
        result.invitationSent
          ? `Staff account for ${nameParts.join(" ")} was created as Pending. An invitation was emailed to ${email}.`
          : `Staff account for ${nameParts.join(" ")} was created as Pending, but the invitation email could not be sent. Use Resend invitation after checking the email configuration.`,
      );
    } catch (error) {
      setMessage(error.message || "Unable to create the staff account.");
    } finally {
      setSaving(false);
    }
  }

  async function resendInvitation(admin) {
    setResendingId(admin.id);
    setMessage("");
    try {
      const result = await staffRequest(
        `/api/users/staff/${admin.id}/invitation`,
        { method: "POST" },
      );
      setMessage(
        result.invitationSent
          ? `A new invitation link was sent to ${admin.email}. Earlier links are now invalid.`
          : `The account is still Pending, but the invitation email could not be sent. Check the email configuration.`,
      );
    } catch (error) {
      setMessage(error.message || "Unable to resend the invitation.");
    } finally {
      setResendingId(null);
    }
  }

  return (
    <AppLayout>
      <header className="top dashboard-header modules-header">
        <div>
          <h1>Team accounts</h1>
          <p>Manage instructor and administrator access.</p>
        </div>
        <button
          className="btn blue"
          type="button"
          disabled={formOpen || saving}
          onClick={() => {
            setMessage("");
            setFormOpen(true);
          }}
        >
          Add team account
        </button>
      </header>
      <div className="content modules-page administrators-page">
        <p className="modules-message" role="status">
          {message}
        </p>
        {loadError && (
          <p className="modules-message" role="alert">
            {loadError} <Link to="/team-login">Go to Team Login</Link>
          </p>
        )}
        {formOpen && (
          <section
            className="card module-editor"
            aria-labelledby="administrator-editor-heading"
          >
            <h2 id="administrator-editor-heading">
              Add team account
            </h2>
            <p className="sub">
              The account is saved to the database and setup instructions are sent by email.
            </p>
            <form onSubmit={saveAdmin}>
              <label htmlFor="administrator-name">Full name</label>
              <input
                id="administrator-name"
                name="name"
                required
                maxLength={100}
                defaultValue=""
                autoFocus
              />
              <label htmlFor="administrator-email">Email address</label>
              <input
                id="administrator-email"
                name="email"
                type="email"
                required
                maxLength={254}
                defaultValue=""
              />
              <div className="module-form-row">
                <div>
                  <label htmlFor="administrator-role">Role</label>
                  <select
                    id="administrator-role"
                    name="role"
                    defaultValue="Admin"
                  >
                    {availableRoles.map((staffRole) => (
                      <option key={staffRole.value} value={staffRole.value}>
                        {staffRole.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="module-form-actions">
                <button className="btn blue" type="submit" disabled={saving}>
                  {saving ? "Creating account..." : "Create account"}
                </button>
                <button
                  className="btn"
                  type="button"
                  onClick={() => {
                    setFormOpen(false);
                    setMessage("");
                  }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </section>
        )}
        <section className="card" aria-labelledby="administrator-list-heading">
          <h2 id="administrator-list-heading">All team accounts</h2>
          <p className="sub">
            {loadError
              ? "Team account list is unavailable."
              : `${administrators.length} accounts · ${activeCount} active · ${invitedCount} pending`}
          </p>
          <div className="module-toolbar">
            <div className="module-search">
              <label htmlFor="administrator-search">
                Search administrators
              </label>
              <input
                id="administrator-search"
                type="search"
                placeholder="Search by name or email"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </div>
            <div>
              <label htmlFor="administrator-role-filter">Role</label>
              <select
                id="administrator-role-filter"
                value={role}
                onChange={(event) => setRole(event.target.value)}
              >
                <option value="All">All roles</option>
                {STAFF_ROLES.map((staffRole) => (
                  <option key={staffRole.value} value={staffRole.value}>
                    {staffRole.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="administrator-status-filter">Status</label>
              <select
                id="administrator-status-filter"
                value={status}
                onChange={(event) => setStatus(event.target.value)}
              >
                <option value="All">All statuses</option>
                <option>Active</option>
                <option>Pending</option>
              </select>
            </div>
          </div>
          <table className="modules-table">
            <thead>
              <tr>
                <th scope="col">Team member</th>
                <th scope="col">Role</th>
                <th scope="col">Last active</th>
                <th scope="col">Status</th>
                <th scope="col">Action</th>
              </tr>
            </thead>
            <tbody>
              {visibleAdmins.map((admin) => (
                <tr key={admin.id}>
                  <td>
                    <strong>{admin.name}</strong>
                    <p>{admin.email}</p>
                  </td>
                  <td>
                    {admin.status === "Pending" && (
                      <button
                        className="module-edit"
                        type="button"
                        disabled={resendingId === admin.id}
                        onClick={() => resendInvitation(admin)}
                      >
                        {resendingId === admin.id ? "Sending..." : "Resend invitation"}
                      </button>
                    )}
                  </td>
                  <td>{STAFF_ROLES.find((staffRole) => staffRole.value === admin.role)?.label || admin.role}</td>
                  <td>{admin.lastActive}</td>
                  <td>
                    <span
                      className={`module-status ${admin.status === "Active" ? "published" : "administrator-inactive"}`}
                    >
                      {admin.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!loading && !loadError && visibleAdmins.length === 0 && (
            <div className="modules-empty">
              <h3>No administrators found</h3>
              <p>Try a different search, role or status.</p>
              <button className="btn" type="button" onClick={clearFilters}>
                Clear filters
              </button>
            </div>
          )}
          {loading && <p className="sub">Loading team accounts...</p>}
          <p className="module-result-count" role="status">
            {loadError
              ? "Team accounts could not be loaded."
              : `Showing ${visibleAdmins.length} of ${administrators.length} team accounts`}
          </p>
        </section>
        <section
          className="administrator-roles"
          aria-labelledby="administrator-roles-heading"
        >
          <h2 id="administrator-roles-heading">Team roles</h2>
          <div className="administrator-role-list">
            {ROLE_DESCRIPTIONS.map((staffRole) => (
              <div key={staffRole.name}>
                <h3>{staffRole.name}</h3>
                <p>{staffRole.description}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </AppLayout>
  );
}
