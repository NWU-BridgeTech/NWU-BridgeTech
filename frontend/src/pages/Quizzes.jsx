import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { CheckCircle2, XCircle, Bell } from "lucide-react";
import StudentSidebar from "../components/StudentSidebar";
import { SidebarProvider } from "../components/ui/sidebar";
import { apiFetch } from "../utils/apiClient";
import "./Quizzes.css";

export default function Quizzes() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [quizzesToRetake, setQuizzesToRetake] = useState([]);
  const [completedQuizzes, setCompletedQuizzes] = useState([]);

  useEffect(() => {
    async function loadDashboardData() {
      try {
        setLoading(true);
        const attempts = await apiFetch("/api/quizzes/my-attempts");
        setCompletedQuizzes(attempts || []);

        const pending = await apiFetch("/api/quizzes/pending");
        setQuizzesToRetake(pending || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    loadDashboardData();
  }, []);

  const handleStartQuiz = (quizId) => {
    navigate(`/quizzes/${quizId}`);
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
              </div>
            </div>
          </header>

          <div className="p-8">
            {loading ? (
              <p className="text-slate-500">Loading assessments...</p>
            ) : (
              <div className="quizzes-sections-wrapper space-y-8">
                <section className="card p-6 bg-white border border-slate-200 rounded-xl">
                  <div className="flex justify-between items-center mb-1">
                    <h2 className="text-lg font-bold">Quizzes to Retake</h2>
                    <span className="bg-blue-50 text-blue-600 font-semibold text-xs px-3 py-1 rounded-full">
                      {quizzesToRetake.length} pending
                    </span>
                  </div>
                  <p className="sub text-sm text-slate-500 mb-4">
                    Select an attempted quiz below to retake and improve your score.
                  </p>

                  {quizzesToRetake.length > 0 ? (
                    <div className="quizzes-grid grid grid-cols-1 md:grid-cols-2 gap-4">
                      {quizzesToRetake.map((quiz) => (
                        <div key={quiz.quizId} className="quiz-card p-4 border rounded-lg flex flex-col justify-between">
                          <div>
                            <span className="quiz-module-badge text-xs bg-slate-100 px-2 py-1 rounded font-medium text-slate-600">
                              {quiz.moduleTitle}
                            </span>
                            <h3 className="text-md font-semibold mt-2">{quiz.title}</h3>
                          </div>
                          <button
                            className="btn blue mt-4 self-start"
                            onClick={() => handleStartQuiz(quiz.quizId)}
                          >
                            Retake Quiz
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-4 text-center text-slate-500">
                      <p>You have passed all your attempted quizzes.</p>
                    </div>
                  )}
                </section>

                <section className="card p-6 bg-white border border-slate-200 rounded-xl">
                  <h2 className="text-lg font-bold">Completed Quizzes & Marks</h2>
                  <p className="sub text-sm text-slate-500 mb-4">
                    History of your finished attempts and exact scores.
                  </p>

                  <div className="table-container">
                    <table className="w-full text-left text-sm">
                      <thead>
                        <tr className="border-b text-slate-500">
                          <th className="py-2">Quiz Title</th>
                          <th>Completed At</th>
                          <th>Score</th>
                          <th>Result</th>
                        </tr>
                      </thead>
                      <tbody>
                        {completedQuizzes.map((attempt) => (
                          <tr key={attempt.attemptId} className="border-b border-slate-100">
                            <td className="py-3 font-medium text-slate-800">{attempt.quizTitle || "Quiz"}</td>
                            <td className="text-slate-600">{new Date(attempt.startedAt).toLocaleDateString()}</td>
                            <td className="font-semibold text-slate-800">{attempt.score}%</td>
                            <td>
                              <span
                                className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full ${
                                  attempt.passed ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"
                                }`}
                              >
                                {attempt.passed ? <CheckCircle2 size={12} /> : <XCircle size={12} />}
                                {attempt.passed ? "Passed" : "Failed"}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </section>
              </div>
            )}
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}