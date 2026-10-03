import { useState } from "react";
import AppLayout from "../layouts/AppLayout";
import { adminRoles, initialAdministrators } from "../data/adminData";
import "./Admin.css";
import "./AdminModules.css";
import "./AdminAdministrators.css";

export default function AdminAdministrators() {
  const [administrators, setAdministrators] = useState(initialAdministrators);
  const [search, setSearch] = useState("");
  const [role, setRole] = useState("All");
  const [status, setStatus] = useState("All");
  const [editingAdmin, setEditingAdmin] = useState(null);
  const [message, setMessage] = useState("");

  const activeCount = administrators.filter(
    (admin) => admin.status === "Active",
  ).length;
  const inactiveCount = administrators.length - activeCount;

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

  function saveAdmin(event) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const name = form.get("name").trim();
    const email = form.get("email").trim().toLowerCase();
    if (!name || !email) {
      setMessage("Enter a name and email address.");
      return;
    }
    if (
      administrators.some(
        (admin) =>
          admin.id !== editingAdmin.id && admin.email.toLowerCase() === email,
      )
    ) {
      setMessage("An administrator with this email address already exists.");
      return;
    }
    const savedAdmin = {
      ...editingAdmin,
      id: editingAdmin.id ?? Date.now(),
      name,
      email,
      role: form.get("role"),
      status: form.get("status"),
    };
    if (editingAdmin.id) {
      setAdministrators(
        administrators.map((admin) =>
          admin.id === savedAdmin.id ? savedAdmin : admin,
        ),
      );
    } else {
      setAdministrators([...administrators, savedAdmin]);
    }
    clearFilters();
    setEditingAdmin(null);
    setMessage(
      `${name} saved locally. Changes reset when you leave this page or reload.`,
    );
  }

  return (
    <AppLayout>
      <header className="top dashboard-header modules-header">
        <div>
          <h1>Administrators</h1>
          <p>Manage the team responsible for content and student support.</p>
        </div>
        <button
          className="btn blue"
          type="button"
          disabled={!!editingAdmin}
          onClick={() => {
            setMessage("");
            setEditingAdmin({
              name: "",
              email: "",
              role: "Reviewer",
              status: "Active",
              lastActive: "Not yet active",
            });
          }}
        >
          Add administrator
        </button>
      </header>
      <div className="content modules-page administrators-page">
        <p className="modules-message" role="status">
          {!editingAdmin && message}
        </p>
        {editingAdmin && (
          <section
            className="card module-editor"
            aria-labelledby="administrator-editor-heading"
          >
            <h2 id="administrator-editor-heading">
              {editingAdmin.id ? "Edit administrator" : "Add administrator"}
            </h2>
            <p className="sub">
              Changes apply to this page only. No account is created or email
              sent.
            </p>
            <form key={editingAdmin.id ?? "new"} onSubmit={saveAdmin}>
              <label htmlFor="administrator-name">Full name</label>
              <input
                id="administrator-name"
                name="name"
                required
                maxLength={100}
                defaultValue={editingAdmin.name}
                autoFocus
              />
              <label htmlFor="administrator-email">Email address</label>
              <input
                id="administrator-email"
                name="email"
                type="email"
                required
                maxLength={254}
                defaultValue={editingAdmin.email}
              />
              <div className="module-form-row">
                <div>
                  <label htmlFor="administrator-role">Role</label>
                  <select
                    id="administrator-role"
                    name="role"
                    defaultValue={editingAdmin.role}
                  >
                    {adminRoles.map((adminRole) => (
                      <option key={adminRole.name}>{adminRole.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="administrator-status">Status</label>
                  <select
                    id="administrator-status"
                    name="status"
                    defaultValue={editingAdmin.status}
                  >
                    <option>Active</option>
                    <option>Inactive</option>
                  </select>
                </div>
              </div>
              <p
                className="modules-message administrator-form-message"
                role="status"
              >
                {message}
              </p>
              <div className="module-form-actions">
                <button className="btn blue" type="submit">
                  Save administrator
                </button>
                <button
                  className="btn"
                  type="button"
                  onClick={() => {
                    setEditingAdmin(null);
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
          <h2 id="administrator-list-heading">All administrators</h2>
          <p className="sub">
            {administrators.length} administrators · {activeCount} active ·{" "}
            {inactiveCount} inactive
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
                {adminRoles.map((adminRole) => (
                  <option key={adminRole.name}>{adminRole.name}</option>
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
                <option>Inactive</option>
              </select>
            </div>
          </div>
          <table className="modules-table">
            <thead>
              <tr>
                <th scope="col">Administrator</th>
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
                  <td>{admin.role}</td>
                  <td>{admin.lastActive}</td>
                  <td>
                    <span
                      className={`module-status ${admin.status === "Active" ? "published" : "administrator-inactive"}`}
                    >
                      {admin.status}
                    </span>
                  </td>
                  <td>
                    <button
                      className="module-edit"
                      type="button"
                      disabled={!!editingAdmin}
                      aria-label={`Edit ${admin.name}`}
                      onClick={() => {
                        setEditingAdmin(admin);
                        setMessage("");
                      }}
                    >
                      Edit
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {visibleAdmins.length === 0 && (
            <div className="modules-empty">
              <h3>No administrators found</h3>
              <p>Try a different search, role or status.</p>
              <button className="btn" type="button" onClick={clearFilters}>
                Clear filters
              </button>
            </div>
          )}
          <p className="module-result-count" role="status">
            Showing {visibleAdmins.length} of {administrators.length}{" "}
            administrators
          </p>
        </section>
        <section
          className="administrator-roles"
          aria-labelledby="administrator-roles-heading"
        >
          <h2 id="administrator-roles-heading">Team roles</h2>
          <div className="administrator-role-list">
            {adminRoles.map((adminRole) => (
              <div key={adminRole.name}>
                <h3>{adminRole.name}</h3>
                <p>{adminRole.description}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </AppLayout>
  );
}
