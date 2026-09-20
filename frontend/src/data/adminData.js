export const initialModules = [
  {
    id: 1,
    title: "Git & Version Control",
    description:
      "Learn branches, pull requests, code reviews and collaborative development.",
    level: "Beginner",
    status: "Published",
    lessons: 8,
    students: 420,
  },
  {
    id: 2,
    title: "APIs & Web Services",
    description:
      "Understand REST, HTTP, JSON and the basics of authentication.",
    level: "Beginner",
    status: "Published",
    lessons: 9,
    students: 315,
  },
  {
    id: 3,
    title: "Cloud Basics",
    description:
      "Explore hosting, cloud platforms, deployment and serverless concepts.",
    level: "Beginner",
    status: "Published",
    lessons: 10,
    students: 268,
  },
  {
    id: 4,
    title: "CI/CD Pipelines",
    description: "Build automated testing and delivery workflows.",
    level: "Intermediate",
    status: "Published",
    lessons: 8,
    students: 245,
  },
  {
    id: 5,
    title: "Advanced Git Workflows",
    description:
      "Explore branching strategies and professional repository workflows.",
    level: "Intermediate",
    status: "Draft",
    lessons: 7,
    students: 0,
  },
  {
    id: 6,
    title: "Software Team Practices",
    description:
      "Develop collaboration, code review and task management skills.",
    level: "Beginner",
    status: "Draft",
    lessons: 6,
    students: 0,
  },
];

export const initialLessons = [
  {
    id: 1,
    moduleId: 1,
    title: "Getting started with Git",
    description: "Create a repository and record your first commit.",
    duration: 20,
    status: "Published",
    content:
      "Initialise a repository with git init. Use git status to inspect your changes, git add to stage files and git commit to save a snapshot of your work.",
  },
  {
    id: 2,
    moduleId: 1,
    title: "Branching and merging",
    description: "Work on changes independently and combine them safely.",
    duration: 30,
    status: "Published",
    content:
      "Create a branch for a small change. Commit your work, switch back to the main branch and merge your changes. Review the resulting history.",
  },
  {
    id: 3,
    moduleId: 2,
    title: "Introduction to APIs",
    description: "Understand how applications communicate over HTTP.",
    duration: 25,
    status: "Draft",
    content:
      "An API exposes operations that another application can call. Explore a GET request and identify its URL, headers, status code and response body.",
  },
  {
    id: 4,
    moduleId: 2,
    title: "Working with API responses",
    description: "Read JSON responses and handle errors.",
    duration: 20,
    status: "Draft",
    content:
      "Inspect a JSON response and identify its fields. Compare successful and unsuccessful HTTP responses, then explain how your application could handle each.",
  },
  {
    id: 5,
    moduleId: 2,
    title: "API authentication",
    description: "Learn how APIs control access to protected resources.",
    duration: 30,
    status: "Draft",
    content:
      "Compare public and protected endpoints. Discuss how authentication credentials are included in a request and why secrets must not be committed to a repository.",
  },
  {
    id: 6,
    moduleId: 3,
    title: "Cloud hosting basics",
    description: "Explore where applications run and how they are hosted.",
    duration: 25,
    status: "Published",
    content:
      "Compare local hosting with cloud hosting. Identify the compute, storage and network resources a small web application needs.",
  },
  {
    id: 7,
    moduleId: 4,
    title: "Your first build pipeline",
    description: "Automate the build and test steps for a project.",
    duration: 35,
    status: "Published",
    content:
      "Break a build pipeline into checkout, dependency installation, testing and build steps. Explain why a failed test should stop deployment.",
  },
  {
    id: 8,
    moduleId: 5,
    title: "Choosing a branching strategy",
    description: "Compare approaches to organising team changes.",
    duration: 20,
    status: "Draft",
    content:
      "Compare short-lived feature branches with longer release branches. Choose a strategy for a small team and explain the trade-offs.",
  },
];

export const initialAssessments = [
  {
    id: 1,
    moduleId: 1,
    title: "Git fundamentals quiz",
    description: "Check understanding of repositories, commits and branches.",
    duration: 15,
    passMark: 70,
    status: "Published",
    questions: [
      {
        id: 1,
        text: "Which command records staged changes?",
        options: ["git status", "git commit", "git branch", "git fetch"],
        answer: 1,
      },
      {
        id: 2,
        text: "What is a branch used for?",
        options: [
          "Deleting repository history",
          "Storing passwords",
          "Developing changes independently",
          "Installing Git",
        ],
        answer: 2,
      },
    ],
  },
  {
    id: 2,
    moduleId: 2,
    title: "HTTP and APIs quiz",
    description: "Review requests, responses and common HTTP methods.",
    duration: 20,
    passMark: 70,
    status: "Draft",
    questions: [
      {
        id: 1,
        text: "Which HTTP method normally retrieves a resource?",
        options: ["GET", "POST", "DELETE", "PATCH"],
        answer: 0,
      },
      {
        id: 2,
        text: "What does an HTTP 404 response indicate?",
        options: [
          "Request succeeded",
          "Resource not found",
          "Server is restarting",
          "Authentication succeeded",
        ],
        answer: 1,
      },
    ],
  },
  {
    id: 3,
    moduleId: 3,
    title: "Cloud essentials quiz",
    description: "Check the basics of cloud hosting and infrastructure.",
    duration: 15,
    passMark: 70,
    status: "Published",
    questions: [
      {
        id: 1,
        text: "What is a benefit of cloud computing?",
        options: [
          "No need for security",
          "Unlimited free storage",
          "Resources can scale with demand",
          "Applications never fail",
        ],
        answer: 2,
      },
    ],
  },
  {
    id: 4,
    moduleId: 4,
    title: "Pipeline readiness quiz",
    description: "Review automated builds, tests and deployment steps.",
    duration: 20,
    passMark: 80,
    status: "Draft",
    questions: [],
  },
];

export const initialExercises = [
  {
    id: 1,
    moduleId: 1,
    title: "Git basics",
    description: "Create a repository and demonstrate a clear commit history.",
    duration: 45,
    status: "Published",
    pendingReviews: 5,
    instructions:
      "Create a GitHub repository for a small project. Add a README, make at least three meaningful commits and submit your repository link.",
    requirements:
      "Repository includes a README explaining the project.\nAt least three commits with descriptive messages.\nNo passwords or secrets are committed.",
  },
  {
    id: 2,
    moduleId: 1,
    title: "Branching and merging",
    description:
      "Develop a change on a branch and merge it into the main branch.",
    duration: 60,
    status: "Published",
    pendingReviews: 4,
    instructions:
      "Create a feature branch, make a small change and merge it into the main branch. Explain your approach in the README and submit the repository link.",
    requirements:
      "Feature branch contains a meaningful change.\nChanges are merged into the main branch.\nREADME explains the workflow used.",
  },
  {
    id: 3,
    moduleId: 1,
    title: "Pull request workflow",
    description: "Open and document a pull request for review.",
    duration: 60,
    status: "Published",
    pendingReviews: 3,
    instructions:
      "Open a pull request from a feature branch. Write a description of the change and how you checked it. Submit the pull request link.",
    requirements:
      "Pull request has a clear title and description.\nChanges are limited to the stated task.\nDescription includes verification steps.",
  },
  {
    id: 4,
    moduleId: 2,
    title: "Build an API client",
    description: "Fetch and display data from a public API.",
    duration: 90,
    status: "Draft",
    pendingReviews: 0,
    instructions:
      "Build a small application that requests data from a public API. Display the response and handle loading and error states. Submit the repository link.",
    requirements:
      "Application displays data from the API.\nLoading and error states are visible.\nREADME includes setup instructions.",
  },
  {
    id: 5,
    moduleId: 4,
    title: "Set up a build pipeline",
    description: "Automate the build and test steps for a repository.",
    duration: 90,
    status: "Draft",
    pendingReviews: 0,
    instructions:
      "Add a workflow that installs dependencies, runs tests and builds your application when changes are pushed. Submit the repository link.",
    requirements:
      "Workflow runs on a push.\nTests must pass before the build proceeds.\nREADME explains the pipeline stages.",
  },
];

export const initialStudents = [
  {
    id: 1,
    name: "Alex Morgan",
    email: "alex.morgan@example.com",
    moduleId: 1,
    progress: 62,
    lastActive: "Today",
    status: "Active",
    quizScore: 84,
    completedPracticals: 2,
    githubConnected: true,
    note: "Learning is on track. No follow-up is needed.",
  },
  {
    id: 2,
    name: "Jamie Patel",
    email: "jamie.patel@example.com",
    moduleId: 2,
    progress: 88,
    lastActive: "Today",
    status: "Active",
    quizScore: 92,
    completedPracticals: 3,
    githubConnected: true,
    note: "Working towards the final activities in the current module.",
  },
  {
    id: 3,
    name: "Sam Wilson",
    email: "sam.wilson@example.com",
    moduleId: 4,
    progress: 41,
    lastActive: "5 days ago",
    status: "Needs support",
    quizScore: 58,
    completedPracticals: 1,
    githubConnected: true,
    note: "Progress has slowed in CI/CD Pipelines. Check whether help is needed with the build workflow.",
  },
  {
    id: 4,
    name: "Taylor Adams",
    email: "taylor.adams@example.com",
    moduleId: 1,
    progress: 25,
    lastActive: "3 days ago",
    status: "Needs support",
    quizScore: 72,
    completedPracticals: 0,
    githubConnected: false,
    note: "A practical task is overdue. Help the student connect GitHub and prepare their first submission.",
  },
  {
    id: 5,
    name: "Jordan Smith",
    email: "jordan.smith@example.com",
    moduleId: 2,
    progress: 34,
    lastActive: "Yesterday",
    status: "Needs support",
    quizScore: 52,
    completedPracticals: 1,
    githubConnected: true,
    note: "A quiz retry is needed. Review HTTP methods and response codes before the next attempt.",
  },
  {
    id: 6,
    name: "Casey Williams",
    email: "casey.williams@example.com",
    moduleId: 3,
    progress: 18,
    lastActive: "2 weeks ago",
    status: "Inactive",
    quizScore: null,
    completedPracticals: 0,
    githubConnected: false,
    note: "No recent learning activity. Check whether the student needs help getting started.",
  },
];

export const adminRoles = [
  {
    name: "Administrator",
    description:
      "Manage learning content, students and administrator settings.",
  },
  {
    name: "Content manager",
    description:
      "Manage modules, lessons, assessments and practical exercises.",
  },
  {
    name: "Reviewer",
    description:
      "Review student submissions and identify learners needing support.",
  },
];

export const initialAdministrators = [
  {
    id: 1,
    name: "John Doe",
    email: "john.doe@example.com",
    role: "Administrator",
    status: "Active",
    lastActive: "Today",
  },
  {
    id: 2,
    name: "Sarah Jacobs",
    email: "sarah.jacobs@example.com",
    role: "Content manager",
    status: "Active",
    lastActive: "Today",
  },
  {
    id: 3,
    name: "Michael Botha",
    email: "michael.botha@example.com",
    role: "Reviewer",
    status: "Active",
    lastActive: "Yesterday",
  },
  {
    id: 4,
    name: "Priya Naidoo",
    email: "priya.naidoo@example.com",
    role: "Reviewer",
    status: "Active",
    lastActive: "2 days ago",
  },
  {
    id: 5,
    name: "Chris Adams",
    email: "chris.adams@example.com",
    role: "Content manager",
    status: "Inactive",
    lastActive: "2 weeks ago",
  },
];

export const systemStatus = {
  checkedAt: "2026-09-20T08:30:00Z",
  services: [
    {
      id: "web",
      name: "Web app",
      status: "operational",
      message: "Student and administrator pages are available.",
    },
    {
      id: "api",
      name: "API",
      status: "operational",
      message: "Application requests are being handled normally.",
    },
    {
      id: "database",
      name: "Database",
      status: "operational",
      message: "Learning records can be read and saved.",
    },
    {
      id: "grading",
      name: "Auto-grading",
      status: "operational",
      message: "Submitted work is being processed normally.",
    },
    {
      id: "github",
      name: "GitHub verification",
      status: "degraded",
      message:
        "Repository checks are taking longer than usual. Results may be delayed.",
    },
    {
      id: "summaries",
      name: "AI video summaries",
      status: "operational",
      message: "Video summaries are available.",
    },
    {
      id: "certificates",
      name: "Certificates",
      status: "operational",
      message: "Certificates can be generated and viewed.",
    },
  ],
};
