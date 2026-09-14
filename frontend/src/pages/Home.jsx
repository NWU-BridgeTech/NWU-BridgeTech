import "./Home.css";

const myCourses = [
  {
    number: "01",
    title: "Git & Version Control",
    description:
      "Learn branches, pull requests, code reviews and collaborative development.",
    progress: 62,
    lessonsDone: 5,
    lessonsTotal: 8,
  },
  {
    number: "02",
    title: "APIs & Web Services",
    description: "Understand REST, HTTP, JSON and the basics of authentication.",
    progress: 34,
    lessonsDone: 3,
    lessonsTotal: 9,
  },
  {
    number: "03",
    title: "Cloud Basics",
    description:
      "Explore hosting, cloud platforms, deployment and serverless concepts.",
    progress: 18,
    lessonsDone: 2,
    lessonsTotal: 10,
  },
];

const exploreCourses = [
  {
    number: "01",
    title: "CI/CD Pipelines",
    description:
      "Learn automated builds, testing and delivery workflows used by modern development teams.",
    lessons: 8,
    level: "Intermediate",
  },
  {
    number: "02",
    title: "Advanced Git Workflows",
    description:
      "Go deeper into branching strategies, collaboration and professional repository workflows.",
    lessons: 7,
    level: "Intermediate",
  },
  {
    number: "03",
    title: "Web Development Essentials",
    description:
      "Build a stronger understanding of web applications, clients, servers and common workflows.",
    lessons: 10,
    level: "Beginner",
  },
  {
    number: "04",
    title: "Software Team Practices",
    description:
      "Explore collaboration, code reviews, task management and working effectively in teams.",
    lessons: 6,
    level: "Beginner",
  },
];

const filters = ["All courses", "Development", "Cloud", "DevOps"];

export default function Home() {
  return (
    <div className="home-page">
      <div className="app">
        <aside className="side">
          <div className="brand">
            Bridge<b>Tech</b>
          </div>

          <div className="label">LEARNING</div>
          <a className="nav active" href="/home">
            Home
          </a>
          <a className="nav" href="/client">
            My courses
          </a>
          <a className="nav" href="#">
            Assessments
          </a>
          <a className="nav" href="#">
            Practical work
          </a>

          <div className="label">YOUR PROGRESS</div>
          <a className="nav" href="#">
            Certificates
          </a>
          <a className="nav" href="#">
            GitHub activity
          </a>

          <div className="label">OTHER</div>
          <a className="nav" href="/">
            Public website
          </a>
        </aside>

        <main className="main">
          <header className="top">
            <div>
              <h1>Student Home</h1>
              <p>Find your next course and keep learning.</p>
            </div>
            <div className="profile">
              <button className="btn">Notifications</button>
              <div className="avatar">AM</div>
              <span style={{ fontSize: 13, fontWeight: 650 }}>Alex M.</span>
            </div>
          </header>

          <div className="content">
            <div className="welcome">
              <div>
                <h2>Good morning, Alex 👋</h2>
                <p>Choose a course to continue learning or explore something new.</p>
              </div>
              <div className="search">
                <input type="text" placeholder="Search courses..." />
                <button className="btn blue">Search</button>
              </div>
            </div>

            <div className="section-title">
              <h3>My Courses</h3>
              <a href="/client">View all courses →</a>
            </div>

            <div className="my-grid">
              {myCourses.map((course) => (
                <div className="course" key={course.number}>
                  <div className="course-top">
                    <span className="tag">IN PROGRESS</span>
                    <small style={{ color: "#89929e" }}>{course.number}</small>
                  </div>
                  <h4>{course.title}</h4>
                  <p>{course.description}</p>
                  <div className="progress-label">
                    <span>Progress</span>
                    <b>{course.progress}%</b>
                  </div>
                  <div className="bar">
                    <i style={{ width: `${course.progress}%` }} />
                  </div>
                  <div className="course-footer">
                    <small>
                      {course.lessonsDone} of {course.lessonsTotal} lessons
                    </small>
                    <button className="btn blue">Continue</button>
                  </div>
                </div>
              ))}
            </div>

            <div className="section-title">
              <h3>Explore Courses</h3>
            </div>

            <div className="filters">
              {filters.map((filter, i) => (
                <button
                  className={`filter${i === 0 ? " active" : ""}`}
                  key={filter}
                >
                  {filter}
                </button>
              ))}
            </div>

            <div className="explore-grid">
              {exploreCourses.map((course) => (
                <div className="explore-card" key={course.number}>
                  <span className="number">{course.number}</span>
                  <h4>{course.title}</h4>
                  <p>{course.description}</p>
                  <div className="meta">
                    <span>{course.lessons} lessons</span>
                    <span>{course.level}</span>
                  </div>
                  <button className="btn blue" style={{ width: "100%" }}>
                    Register for course
                  </button>
                </div>
              ))}
            </div>

            <div className="recommend">
              <div>
                <h3>Recommended for you</h3>
                <p>
                  Based on your progress in Git & Version Control, CI/CD Pipelines
                  is a good next step.
                </p>
              </div>
              <button className="btn blue">View course</button>
            </div>

            <div className="stats">
              <div className="stat">
                <small>Courses registered</small>
                <b>3</b>
                <span>Keep going</span>
              </div>
              <div className="stat">
                <small>Overall progress</small>
                <b>47%</b>
                <span>▲ 8% this month</span>
              </div>
              <div className="stat">
                <small>Certificates earned</small>
                <b>1</b>
                <span>1 course completed</span>
              </div>
            </div>
          </div>

          <footer className="site">
            <div className="foot-inner">
              <div className="foot-grid">
                <div className="foot-brand">
                  <div className="brand">
                    Bridge<b>Tech</b>
                  </div>
                  <p>
                    Bridging the university-industry gap — hands-on modules in
                    Git, APIs, CI/CD and cloud, verified by GitHub, not a quiz.
                  </p>
                  <div className="foot-social">
                    <a href="#">in</a>
                    <a href="#">gh</a>
                    <a href="#">x</a>
                  </div>
                </div>
                <div className="foot-col">
                  <h5>LEARNING</h5>
                  <a href="/home">Home</a>
                  <a href="/client">My courses</a>
                  <a href="#">Assessments</a>
                  <a href="#">Practical work</a>
                </div>
                <div className="foot-col">
                  <h5>PROGRESS</h5>
                  <a href="#">Certificates</a>
                  <a href="#">GitHub activity</a>
                  <a href="#">Transcripts</a>
                </div>
                <div className="foot-col">
                  <h5>SUPPORT</h5>
                  <a href="#">Help centre</a>
                  <a href="#">Contact us</a>
                  <a href="/">Public website</a>
                </div>
              </div>
              <div className="foot-bottom">
                <span>© 2026 BridgeTech. All rights reserved.</span>
                <div className="legal">
                  <a href="#">Privacy</a>
                  <a href="#">Terms</a>
                </div>
              </div>
            </div>
          </footer>
        </main>
      </div>
    </div>
  );
}
