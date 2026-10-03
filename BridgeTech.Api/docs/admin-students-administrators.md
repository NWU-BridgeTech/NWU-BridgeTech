# Admin API: Students and Administrators

Backend for `frontend/src/pages/AdminStudents.jsx` and `AdminAdministrators.jsx`.
All routes need a JWT (`Authorization: Bearer ...`). Errors use `{ "code": "...", "message": "..." }`.

## Setup

```bash
cd BridgeTech.Api
dotnet ef database update      # applies 20261002090000_AdminUserManagement (users.is_active, users.last_login_at)
```

Optional config: `Frontend:BaseUrl` (defaults to `http://localhost:5173`) is used for the links in invitation emails.
Invitations are sent through the existing Brevo settings (`Email:BrevoApiKey`, `Email:FromAddress`).

## Roles

| UI label | `UserRole` | Students page | Administrators page |
|---|---|---|---|
| Administrator | `Admin` | yes | yes |
| Content manager | `Instructor` | no | no |
| Reviewer | `Reviewer` (new, value 4) | yes | no |
| Super administrator | `SuperAdmin` | yes | yes, but its accounts are read-only here |

Super administrators can only be created directly in the database.

## Students (read-only) — `Admin`, `SuperAdmin`, `Reviewer`

`GET /api/admin/students?search=&moduleId=&status=&page=1&pageSize=50`

```json
{
  "items": [{
    "id": "guid", "name": "Alice Anders", "email": "alice@example.com",
    "moduleId": "guid", "moduleTitle": "Git & Version Control", "progress": 40,
    "lastActiveAt": "2026-10-01T08:12:00Z", "lastActive": "Yesterday",
    "status": "Active", "note": "No concerns flagged.",
    "quizScore": 80, "completedPracticals": 1, "githubConnected": true
  }],
  "page": 1, "pageSize": 50,
  "filteredCount": 1, "totalStudents": 5, "activeCount": 1, "needsSupportCount": 2, "inactiveCount": 2
}
```

`GET /api/admin/students/{id}` returns the same fields plus `username`, `githubUsername`, `joinedAt`,
`quizAttemptsCompleted`, `certificatesEarned` and `enrollments[]` (module, status, progress, dates).

The field names match the mock objects in `adminData.js`, so the page can swap `initialStudents` for the response.
`moduleId` is now a GUID, not a number.

**How status is derived** (all thresholds live in `Services/Admin/StudentStatusRules.cs`):
- **Inactive**: account deactivated, or no activity for 14 days (sign-in, quiz, practical, lesson or enrolment).
- **Needs support** (and not inactive): average quiz score under 50% over at least 2 completed attempts; or 3+ failed
  practical submissions outnumbering verified ones; or enrolled 7+ days ago with 0% progress. `note` explains which.
- **Active**: everything else.

"Current module" is the active enrolment the student last completed a lesson in (or enrolled in).
`moduleId` filters on it. `quizScore` is `null` until a quiz is completed.

## Administrators — `Admin`, `SuperAdmin`

| Method | Route | Purpose |
|---|---|---|
| GET | `/api/admin/administrators?search=&role=&status=&page=&pageSize=` | List staff; returns `items`, `filteredCount`, `totalAdministrators`, `activeCount`, `inactiveCount` |
| GET | `/api/admin/administrators/roles` | The three assignable roles with descriptions (replaces the static `adminRoles`) |
| GET | `/api/admin/administrators/{id}` | One staff member |
| POST | `/api/admin/administrators` | Add: `{ name, email, role, status }`. Returns 201 plus `invitationSent` / `invitationMessage` |
| PUT | `/api/admin/administrators/{id}` | Edit: same body. `status: "Inactive"` deactivates |
| POST | `/api/admin/administrators/{id}/resend-invitation` | Re-send the invitation (never-signed-in, active accounts only) |

Item shape: `id, name, email, role, status, lastActiveAt, lastActive, editable, isCurrentUser`.
Use `editable` / `isCurrentUser` to disable the Edit button for super admins and to lock role/status on your own row.

**Adding someone** creates a real account (email pre-verified, random unusable password, username derived from the email).
The invitation email tells them to use *Forgot password* to choose their own password. No password is ever emailed.
If the email fails the account is still created and `invitationSent` is `false`.

**Rules enforced server-side** (error codes):
- `INSUFFICIENT_ROLE` 403: caller must be an *active* Admin/SuperAdmin in the database, not just in the token.
- `SELF_MODIFICATION` 403: you can't change your own role or status (renaming yourself is fine).
- `SUPERADMIN_PROTECTED` 403: super admin accounts can't be edited, deactivated or invited here.
- `EMAIL_IN_USE` 409: case-insensitive; also checks pending sign-ups.
- `INVALID_ROLE`, `INVALID_STATUS`, `INVALID_NAME` 400. `ADMIN_NOT_FOUND` 404.
- `ACCOUNT_INACTIVE`, `ALREADY_SIGNED_IN` 409 and `EMAIL_FAILED` 502 on resend.

There is no delete: deactivate instead, so history is kept.

## Deactivated accounts

A deactivated account can't sign in or refresh (`401`, code `ACCOUNT_DEACTIVATED`), and its existing access token stops
working on the next request. `Program.cs` now looks the account up on every authenticated request; a token whose role
claim no longer matches the database is also rejected, so demotions apply immediately.

## Also changed

- `GET /api/users` is now limited to Admin/SuperAdmin/Reviewer, and `GET /api/users/{id}` to staff or the user themself.
  Before, any signed-in student could list every account's email and role.
- `users.last_login_at` is updated on sign-in, Google sign-in and token refresh.
