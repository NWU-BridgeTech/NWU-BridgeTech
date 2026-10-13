# BridgeTech

BridgeTech is a learning platform for software engineering students. It provides
structured modules, lessons, quizzes, practical exercises, GitHub learning
activity, badges, certificates, progress tracking, and an AI learning assistant
called **Blui**.

## Project structure

```text
NWU-BridgeTech/
├── BridgeTech.Api/       ASP.NET Core API and PostgreSQL data access
├── frontend/             React and Vite student and staff interface
└── README.md             Project documentation
```

## Technology

- **Frontend:** React, Vite, React Router, Tailwind CSS, Radix UI, Lucide
- **Interactive diagrams:** React Flow, Dagre, Mermaid, AWS SVG icons
- **Backend:** ASP.NET Core Web API on .NET 10 preview
- **Database:** PostgreSQL through Entity Framework Core
- **Authentication:** JWT authentication, refresh tokens, Google sign-in, role-based access
- **Integrations:** GitHub API, OpenAI-compatible AI provider, Brevo email service

## Blui AI assistant

Blui is available from the student sidebar under **Blui AI summary**. It provides:

- Learning progress statistics
- AI-generated learning analysis
- Persistent chat history
- Chat memory clearing with confirmation
- Chat message editing and regeneration
- Automatic scrolling to new responses
- Fixed liquid-glass chat composer
- A header that fades while scrolling down and returns while scrolling up
- Animated Blui navigation icon
- Dark-mode and light-mode styling

### Blui API endpoints

Authenticated student endpoints are provided by the learning insights controller:

```text
GET    /api/learning-insights
GET    /api/learning-insights/chat
POST   /api/learning-insights/chat
POST   /api/learning-insights/generate
DELETE /api/learning-insights/chat
```

Refreshing the browser reloads saved statistics and chat history. It does not
automatically call the AI provider to regenerate a response. AI calls happen
when the student sends a message, generates an analysis, or regenerates a
diagram response.

## Rich diagrams

Blui uses a custom `blui-diagram` JSON format for architecture, infrastructure,
cloud, AWS, request-flow, pipeline, walkthrough, and diagram requests.

The prompt rules require:

- 6–12 meaningful nodes
- Side-by-side branches for parallel or alternative paths
- No unnecessarily long vertical chains
- Separate failure and alternative end nodes
- Reading-order step numbering
- 2–5 meaningful groups
- Distinct group colors
- Icons on architecture nodes
- Labelled edges with `request`, `response`, `error`, or `async` kinds
- Valid JSON with no comments or trailing commas

The frontend validates and repairs model output in:

```text
frontend/src/components/diagramUtils.js
```

The interactive renderer is:

```text
frontend/src/components/RichDiagram.jsx
```

It supports:

- Automatic Dagre layout
- Step selection and navigation
- Full-screen viewing
- Animated nodes and edges
- Red error edges
- Dashed asynchronous edges
- Per-step colors
- Generic and AWS service icons
- Dark mode
- Regeneration when a diagram cannot be drawn

Prompt rules are maintained in:

```text
BridgeTech.Api/Prompts/blui-system-prompt.md
BridgeTech.Api/Prompts/blui-diagram-rules.md
```

Mermaid remains available for sequence diagrams, entity-relationship diagrams,
state machines, and Git branch graphs. It is not used for architecture diagrams.

## Performance improvements

### Route-level lazy loading

The frontend now uses React lazy loading in `frontend/src/App.jsx`. Pages are
loaded only when their routes are opened. Heavy areas such as AI diagrams,
admin pages, quizzes, lessons, and GitHub activity no longer need to be
downloaded before the initial page can render.

A loading fallback is displayed while a route chunk is fetched.

### Home summary cache

The Home page stores recently loaded course progress and learning statistics in
per-user local storage:

- Cache duration: five minutes
- Cached data renders immediately on repeat visits and logins
- Fresh data is requested in the background
- Server data replaces the cached data when it arrives

This improves repeat-login speed without making cached data the permanent source
of truth.

### Backend summary considerations

The learning insights summary currently calculates several database counts and
may request GitHub repository metrics. For the fastest first login, future
backend improvements could:

- Combine related statistics into fewer aggregate queries
- Return core database statistics before optional GitHub metrics
- Cache short-lived summary results server-side
- Load GitHub metrics separately in the background

## Theme behavior

Theme preferences are handled in:

```text
frontend/src/contexts/ThemeContext.jsx
```

Supported themes are:

- Light
- Dark
- System

Theme preferences are stored locally and saved to the authenticated user
preferences endpoint. Preferences are loaded once per authenticated session
instead of on every route change. This prevents an older server response from
overwriting a theme the user has just selected.

## Blui visual styling

The Blui-specific styling is maintained in:

```text
frontend/src/pages/StudentAiSummary.css
```

The active Blui sparkle icon has:

- Purple animated neon styling in light mode
- Sky-blue animated neon styling in dark mode
- A subtle pulse and rotation effect
- Reduced-motion support

The BridgeTech `bt` brand logo is not modified by this effect.

## Super Admin Blui analytics

Super Admins can view Blui usage data on the Reports page. The report uses the
existing `LearningChatMessages` table and does not require a new migration.

Endpoint:

```text
GET /api/admin/reports/blui-usage
```

Access is restricted to the `SuperAdmin` role.

The report covers the previous 30 days and provides:

- Total student questions
- Assistant responses
- Unique students
- Students active in the last seven days
- Failed or unavailable responses
- Daily question activity
- Ten most frequently repeated exact questions

The report is displayed in:

```text
frontend/src/pages/AdminReports.jsx
```

The endpoint is implemented in:

```text
BridgeTech.Api/Controllers/AdminReportsController.cs
```

The current frequent-question report groups exact repeated wording. Similar
questions with different wording are intentionally kept separate until topic
classification is added.

## Existing reports

Administrators and Super Admins can also download:

```text
GET /api/admin/reports/overview.csv
GET /api/admin/reports/users.csv
```

The Blui usage report is more restricted and is available only to Super Admins.

## Local development

### Frontend

```powershell
cd frontend
npm install
npm run dev
```

Production build:

```powershell
npm run build
npm run preview
```

### API

```powershell
cd BridgeTech.Api
dotnet restore
dotnet run
```

The frontend defaults to:

```text
http://localhost:5174
```

Set `VITE_API_URL` when the API is hosted at another address.

## Configuration

The API expects configuration for the database, JWT signing key, and external
providers. Provider credentials must be supplied through local secrets or
environment variables and must never be committed.

Common configuration sections include:

```text
ConnectionStrings:DefaultConnection
Jwt:Key
OpenAI:ApiKey
OpenAI:Endpoint
OpenAI:Model
GitHub:ClientId
GitHub:ClientSecret
```

## Validation completed

- Frontend diagnostics passed without errors.
- Frontend production builds passed after the implemented frontend changes.
- Route-level chunks were generated successfully.
- The API usage-report endpoint was compiled after correcting its controller
  accessibility issue.
- Some isolated API build attempts were affected by stale generated output
  artifacts and locked or missing intermediate files in the local environment.

## Security and privacy notes

- Authentication remains required for student Blui data.
- Super Admin authorization is required for Blui usage analytics.
- API keys, JWT secrets, GitHub tokens, and provider credentials must remain
  outside source control.
- Blui reports should be treated as internal administrative data.
- Raw chat history is not exposed by the usage summary endpoint; it returns
  aggregate usage and repeated question text only.
