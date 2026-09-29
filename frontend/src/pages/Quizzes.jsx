import React, { useState } from "react";
import { Clock, HelpCircle, Target, CheckCircle2, XCircle, ArrowLeft, Bell } from "lucide-react";
import StudentSidebar from "../components/StudentSidebar";
import { SidebarProvider } from "../components/ui/sidebar";
import "./Quizzes.css";

const QUIZ_QUESTIONS_BANK = {
  "git-fundamentals-quiz": [
    {
      id: 1,
      question: "Which command is used to record changes to the repository?",
      options: ["git add", "git commit", "git push", "git checkout"],
      correctIndex: 1,
    },
    {
      id: 2,
      question: "What does 'git status' display?",
      options: [
        "The state of the working directory and staging area",
        "The complete commit history",
        "Remote repository credentials",
        "Branch merge conflicts only",
      ],
      correctIndex: 0,
    },
  ],
};

export default function Quizzes() {
  const [quizzesToRetake, setQuizzesToRetake] = useState([
    {
      id: "git-fundamentals-quiz",
      title: "Git fundamentals quiz",
      module: "Git & Version Control",
      description: "Check understanding of repositories, commits and branches.",
      duration: "15 min",
      totalQuestions: 2,
      passMarkPercent: 70,
    },
  ]);

  const [completedQuizzes, setCompletedQuizzes] = useState([
    {
      id: "git-fundamentals-quiz-1",
      quizId: "git-fundamentals-quiz",
      title: "Git fundamentals quiz",
      module: "Git & Version Control",
      dateCompleted: "2026-09-20",
      scorePercent: 50,
      correctAnswers: 1,
      totalQuestions: 2,
      passMarkPercent: 70,
      result: "Failed",
    },
  ]);

  const [activeQuiz, setActiveQuiz] = useState(null);
  const [userAnswers, setUserAnswers] = useState({});

  const handleStartQuiz = (quiz) => {
    setActiveQuiz(quiz);
    setUserAnswers({});
  };

  const handleSelectOption = (questionId, optionIndex) => {
    setUserAnswers((prev) => ({ ...prev, [questionId]: optionIndex }));
  };

  const handleSubmitQuiz = () => {
    if (!activeQuiz) return;

    const questions = QUIZ_QUESTIONS_BANK[activeQuiz.id] || [];
    let correctCount = 0;

    questions.forEach((q) => {
      if (userAnswers[q.id] === q.correctIndex) {
        correctCount += 1;
      }
    });

    const scorePercent = Math.round((correctCount / questions.length) * 100);
    const passed = scorePercent >= activeQuiz.passMarkPercent;
    const currentDate = new Date().toISOString().split("T")[0];

    const newAttempt = {
      id: `${activeQuiz.id}-${Date.now()}`,
      quizId: activeQuiz.id,
      title: activeQuiz.title,
      module: activeQuiz.module,
      dateCompleted: currentDate,
      scorePercent,
      correctAnswers: correctCount,
      totalQuestions: questions.length,
      passMarkPercent: activeQuiz.passMarkPercent,
      result: passed ? "Passed" : "Failed",
    };

    setCompletedQuizzes((prev) => [newAttempt, ...prev]);

    if (passed) {
      setQuizzesToRetake((prev) => prev.filter((q) => q.id !== activeQuiz.id));
    }

    setActiveQuiz(null);
  };

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <StudentSidebar />

        <main className="flex-1 w-full min-h-screen transition-all duration-300 ease-in-out">
          <header className="page-header flex items-center justify-between px-8 py-6 bg-white border-b border-slate-200">
            <h1 className="text-2xl font-bold text-slate-900">Assessments and Quizzes</h1>

            <div className="flex items-center gap-4">
              <div className="relative cursor-pointer">
                <Bell size={20} className="text-slate-600" />
                <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-blue-600 text-[10px] font-bold text-white">
                  2
                </span>
              </div>

              <div className="flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-100 text-sm font-semibold text-blue-700">
                  AM
                </div>
                <span className="text-sm font-medium text-slate-800">Alex M.</span>
              </div>
            </div>
          </header>

          <div className="p-8">
            {activeQuiz ? (
              <div className="quizzes-sections-wrapper">
                <section className="card">
                  <button className="btn secondary" onClick={() => setActiveQuiz(null)}>
                    <ArrowLeft size={16} /> Back to Quizzes
                  </button>

                  <h2>{activeQuiz.title}</h2>
                  <p className="sub">
                    Pass mark: <strong>{activeQuiz.passMarkPercent}%</strong> | Questions:{" "}
                    <strong>{(QUIZ_QUESTIONS_BANK[activeQuiz.id] || []).length}</strong>
                  </p>

                  <div className="quiz-questions-list">
                    {(QUIZ_QUESTIONS_BANK[activeQuiz.id] || []).map((q, idx) => (
                      <div key={q.id} className="quiz-question-block">
                        <p className="quiz-question-text">
                          {idx + 1}. {q.question}
                        </p>

                        <div className="quiz-options-group">
                          {q.options.map((opt, optIdx) => (
                            <label key={optIdx} className="quiz-option-label">
                              <input
                                type="radio"
                                name={`q-${q.id}`}
                                checked={userAnswers[q.id] === optIdx}
                                onChange={() => handleSelectOption(q.id, optIdx)}
                              />
                              <span>{opt}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="quiz-submit-wrapper">
                    <button
                      className="btn blue"
                      disabled={
                        !(QUIZ_QUESTIONS_BANK[activeQuiz.id] || []).every(
                          (q) => userAnswers[q.id] !== undefined
                        )
                      }
                      onClick={handleSubmitQuiz}
                    >
                      Submit Quiz
                    </button>
                  </div>
                </section>
              </div>
            ) : (
              <div className="quizzes-sections-wrapper">
                <section className="card">
                  <div className="flex justify-between items-center mb-1">
                    <h2>Quizzes to Retake</h2>
                    <span className="bg-blue-50 text-blue-600 font-semibold text-xs px-3 py-1 rounded-full">
                      {quizzesToRetake.length} pending
                    </span>
                  </div>
                  <p className="sub">
                    Select an attempted quiz below to retake and improve your score.
                  </p>

                  {quizzesToRetake.length > 0 ? (
                    <div className="quizzes-grid">
                      {quizzesToRetake.map((quiz) => (
                        <div key={quiz.id} className="quiz-card">
                          <div>
                            <span className="quiz-module-badge">{quiz.module}</span>
                            <h3>{quiz.title}</h3>
                            <p>{quiz.description}</p>
                          </div>

                          <div>
                            <div className="quiz-card-meta">
                              <span className="meta-item">
                                <Clock size={14} />
                                {quiz.duration}
                              </span>
                              <span className="meta-item">
                                <HelpCircle size={14} />
                                {quiz.totalQuestions} questions
                              </span>
                              <span className="meta-item">
                                <Target size={14} />
                                {quiz.passMarkPercent}% pass mark
                              </span>
                            </div>

                            <div className="quiz-card-footer">
                              <button className="btn blue" onClick={() => handleStartQuiz(quiz)}>
                                Retake Quiz
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="modules-empty">
                      <h3>No quizzes to retake</h3>
                      <p>You have passed all your attempted quizzes.</p>
                    </div>
                  )}
                </section>

                <section className="card">
                  <h2>Completed Quizzes & Marks</h2>
                  <p className="sub">History of your finished attempts and exact scores.</p>

                  <div className="table-container">
                    <table>
                      <thead>
                        <tr>
                          <th>Quiz Title</th>
                          <th>Module</th>
                          <th>Date Completed</th>
                          <th>Score</th>
                          <th>Result</th>
                        </tr>
                      </thead>
                      <tbody>
                        {completedQuizzes.map((quiz) => {
                          const isPassed = quiz.result === "Passed";

                          return (
                            <tr key={quiz.id}>
                              <td>
                                <strong>{quiz.title}</strong>
                              </td>
                              <td>{quiz.module}</td>
                              <td>{quiz.dateCompleted}</td>
                              <td>
                                <strong>
                                  {quiz.scorePercent}% ({quiz.correctAnswers}/{quiz.totalQuestions})
                                </strong>
                              </td>
                              <td>
                                <span className={isPassed ? "badge-published" : "badge-draft"}>
                                  {isPassed ? <CheckCircle2 size={12} /> : <XCircle size={12} />}
                                  {quiz.result}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </section>
              </div>
            )}
          </div>
        </main>
      </div>s
    </SidebarProvider>
  );
}