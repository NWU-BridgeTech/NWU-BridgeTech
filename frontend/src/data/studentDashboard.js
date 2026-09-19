// All sample data for the student pages lives here until the API is connected.

export const student = {
  firstName: "Alex",
  displayName: "Alex M.",
  initials: "AM",
  certificatesEarned: 1,
};

export const githubConnection = {
  username: null,
  repository: null,
};

export const courseCategories = ["All courses", "Development", "Cloud", "DevOps"];

export const myCourses = [
  {
    number: "01",
    title: "Git & Version Control",
    nextTask: "Your first pull request",
    taskType: "Practical · Changes requested",
    action: "View feedback",
    lessonsDone: 5,
    lessonsTotal: 8,
  },
  {
    number: "02",
    title: "APIs & Web Services",
    nextTask: "HTTP & REST fundamentals",
    taskType: "Assessment · In progress",
    action: "Continue assessment",
    lessonsDone: 3,
    lessonsTotal: 9,
  },
  {
    number: "03",
    title: "Cloud Basics",
    nextTask: "Deploying your first application",
    taskType: "Lesson 3 · About 20 minutes",
    action: "Continue lesson",
    lessonsDone: 2,
    lessonsTotal: 10,
  },
];

export const exploreCourses = [
  {
    number: "01",
    title: "CI/CD Pipelines",
    description:
      "Learn automated builds, testing and delivery workflows used by modern development teams.",
    lessons: 8,
    level: "Intermediate",
    category: "DevOps",
    prerequisite: "Basic Git and command-line knowledge",
    outcomes: [
      "Create an automated build pipeline",
      "Run tests on each pull request",
      "Understand deployment workflows",
    ],
  },
  {
    number: "02",
    title: "Advanced Git Workflows",
    description:
      "Go deeper into branching strategies, collaboration and professional repository workflows.",
    lessons: 7,
    level: "Intermediate",
    category: "Development",
    prerequisite: "Comfort with commits, branches and pull requests",
    outcomes: [
      "Choose a branching strategy",
      "Resolve merge conflicts",
      "Review changes with your team",
    ],
  },
  {
    number: "03",
    title: "Web Development Essentials",
    description:
      "Build a stronger understanding of web applications, clients, servers and common workflows.",
    lessons: 10,
    level: "Beginner",
    category: "Development",
    prerequisite: "Basic programming knowledge",
    outcomes: [
      "Explain how clients and servers communicate",
      "Build a simple web interface",
      "Connect an interface to an API",
    ],
  },
  {
    number: "04",
    title: "Software Team Practices",
    description:
      "Explore collaboration, code reviews, task management and working effectively in teams.",
    lessons: 6,
    level: "Beginner",
    category: "Development",
    prerequisite: "No previous team development experience needed",
    outcomes: [
      "Break work into manageable tasks",
      "Give useful code review feedback",
      "Collaborate on a shared repository",
    ],
  },
];

// Sample activity for the layout preview until student activity is connected.
export const lastActivity = {
  courseNumber: "01",
  lesson: "Pull requests & code reviews",
  minutes: 15,
};

export const attentionItems = [
  {
    id: "git-practical",
    type: "practical",
    status: "Changes requested",
    tone: "warning",
    title: "Your first pull request",
    course: "Git & Version Control",
    detail: "Review the feedback and update your submission.",
    action: "View feedback",
  },
  {
    id: "api-assessment",
    type: "assessment",
    status: "Unfinished assessment",
    tone: "info",
    title: "HTTP & REST fundamentals",
    course: "APIs & Web Services",
    detail: "Finish the assessment you started.",
    action: "Continue assessment",
  },
];

// Illustrative submissions and feedback, not live student records.
export const practicalWork = [
  {
    id: "git-practical",
    title: "Your first pull request",
    course: "Git & Version Control",
    status: "Changes requested",
    action: "View feedback",
    tone: "warning",
    detail: "Update your submission after reviewing the feedback.",
    feedback: {
      summary:
        "Explain your changes and add steps for testing the pull request.",
      points: [
        "Add a short description of the problem your changes solve.",
        "Include the steps a reviewer can follow to test your changes.",
        "Update the existing pull request before submitting it for another review.",
      ],
    },
  },
  {
    id: "api-practical",
    title: "Build a REST endpoint",
    course: "APIs & Web Services",
    status: "Awaiting review",
    action: "View submission",
    tone: "info",
    detail: "Your submission is awaiting feedback.",
  },
  {
    id: "cloud-practical",
    title: "Deploy your first application",
    course: "Cloud Basics",
    status: "Not submitted",
    action: "Start exercise",
    tone: "neutral",
    detail: "Complete the exercise and submit your work when you’re ready.",
  },
  {
    id: "git-branches",
    title: "Create and merge a branch",
    course: "Git & Version Control",
    status: "Passed",
    action: "View feedback",
    tone: "success",
    detail: "You’ve completed this practical exercise.",
    feedback: {
      summary:
        "Your branch was merged successfully, with clear commit messages.",
      points: [
        "Your changes were isolated on a separate branch.",
        "The merge preserved the intended changes.",
        "Keep using descriptive commit messages in your next exercise.",
      ],
    },
  },
];

export const courseRecommendation = {
  courseNumber: "01",
  description: "Interested in automation? Explore CI/CD Pipelines after you’re comfortable with Git and the command line.",
};

export const initialNotifications = [
  {
    id: "feedback",
    title: "New feedback on your practical",
    message:
      "Your first pull request needs a few changes. Review the feedback on the Practical work page.",
    unread: true,
  },
  {
    id: "assessment",
    title: "You have an unfinished assessment",
    message:
      "Pick up HTTP & REST fundamentals from Needs attention when you’re ready.",
    unread: true,
  },
  {
    id: "passed",
    title: "Practical completed",
    message:
      "You passed Create and merge a branch. Keep building your Git skills.",
    unread: false,
  },
];

