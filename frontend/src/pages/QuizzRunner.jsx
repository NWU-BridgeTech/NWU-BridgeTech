import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { apiFetch } from "../utils/apiClient";

export default function QuizzRunner({ quizId: propQuizId, lessonId: propLessonId, onBack, onComplete }) {
  const params = useParams();
  const navigate = useNavigate();

  const quizId = propQuizId || params.quizId;
  const lessonId = propLessonId || params.lessonId;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [quiz, setQuiz] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [userAnswers, setUserAnswers] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);

  useEffect(() => {
    fetchQuizData();
  }, [quizId, lessonId]);

  const fetchQuizData = async () => {
    try {
      setLoading(true);
      setError(null);

      const endpoint = quizId
        ? `/quizzes/${quizId}`
        : `/lessons/${lessonId}/quiz`;

      const data = await apiFetch(endpoint);

      setQuiz(data.quiz || data);
      setQuestions(data.questions || data.quiz_questions || []);
    } catch (err) {
      setError(err.message || "Failed to load quiz content.");
    } finally {
      setLoading(false);
    }
  };

  const handleOptionSelect = (questionId, optionId) => {
    if (result) return;
    setUserAnswers((prev) => ({
      ...prev,
      [questionId]: optionId,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submitting || result) return;

    if (Object.keys(userAnswers).length < questions.length) {
      alert("Please answer all questions before submitting.");
      return;
    }

    setSubmitting(true);

    try {
      const activeQuizId = quiz.quizId || quiz.quiz_id || quizId;
      const response = await apiFetch(`/quizzes/${activeQuizId}/submit`, {
        method: "POST",
        body: JSON.stringify({ answers: userAnswers }),
      });

      setResult(response);
      if (onComplete) onComplete(response);
    } catch (err) {
      alert(err.message || "An error occurred while submitting your answers.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      navigate(-1);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center p-12">
        <div className="text-gray-500 font-medium">Loading quiz…</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-xl mx-auto my-8 p-6 bg-red-50 border border-red-200 rounded-lg">
        <h3 className="text-lg font-bold text-red-800 mb-2">Quiz Loading Error</h3>
        <p className="text-sm text-red-600 mb-4">{error}</p>
        <button
          onClick={handleBack}
          className="px-4 py-2 bg-gray-600 text-white text-sm rounded-md hover:bg-gray-700 transition"
        >
          ← Back
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto p-6 bg-white rounded-xl shadow-md border border-gray-100 my-6">
      <div className="flex items-center justify-between border-b pb-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">{quiz.title}</h1>
          <p className="text-sm text-gray-500 mt-1">
            Pass Mark:{" "}
            <span className="font-semibold text-gray-700">
              {quiz.passingScore || quiz.passing_score || 70}%
            </span>{" "}
            | Questions:{" "}
            <span className="font-semibold text-gray-700">
              {questions.length}
            </span>
          </p>
        </div>
        <button
          onClick={handleBack}
          className="px-3 py-1.5 border border-gray-300 text-gray-600 rounded-md text-sm hover:bg-gray-50 transition"
        >
          ← Back
        </button>
      </div>

      {result && (
        <div
          className={`p-6 mb-8 rounded-xl border ${
            result.passed ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"
          }`}
        >
          <h2
            className={`text-xl font-bold ${
              result.passed ? "text-green-800" : "text-red-800"
            }`}
          >
            {result.passed ? "Quiz Passed!" : "Quiz Failed"}
          </h2>
          <p className="mt-2 text-gray-700">
            You scored <strong>{result.score}%</strong>.
          </p>
          <div className="mt-4 flex gap-3">
            <button
              onClick={() => {
                setResult(null);
                setUserAnswers({});
              }}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700 transition"
            >
              Retry Quiz
            </button>
            <button
              onClick={handleBack}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg text-sm hover:bg-gray-700 transition"
            >
              Return to Lesson
            </button>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        {questions.map((q, qIndex) => {
          const qId = q.questionId || q.question_id;
          const options = q.options || [];

          return (
            <div key={qId} className="p-5 border rounded-lg bg-gray-50">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">
                {qIndex + 1}. {q.questionText || q.question_text}
              </h3>

              <div className="space-y-3">
                {options.map((opt) => {
                  const optId = opt.optionId || opt.option_id;
                  const isSelected = userAnswers[qId] === optId;
                  let optionStyle =
                    "border-gray-200 bg-white hover:border-indigo-300";

                  if (result) {
                    if (opt.isCorrect || opt.is_correct) {
                      optionStyle =
                        "border-green-500 bg-green-50 text-green-900 font-medium";
                    } else if (isSelected && !(opt.isCorrect || opt.is_correct)) {
                      optionStyle = "border-red-500 bg-red-50 text-red-900";
                    }
                  } else if (isSelected) {
                    optionStyle =
                      "border-indigo-600 bg-indigo-50 ring-2 ring-indigo-500";
                  }

                  return (
                    <label
                      key={optId}
                      className={`flex items-center p-3 border rounded-lg cursor-pointer transition ${optionStyle}`}
                    >
                      <input
                        type="radio"
                        name={`question_${qId}`}
                        value={optId}
                        checked={isSelected}
                        disabled={!!result}
                        onChange={() => handleOptionSelect(qId, optId)}
                        className="h-4 w-4 text-indigo-600 border-gray-300 focus:ring-indigo-500"
                      />
                      <span className="ml-3 text-gray-800 text-sm">
                        {opt.optionText || opt.option_text}
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>
          );
        })}

        {!result && (
          <button
            type="submit"
            disabled={
              submitting || Object.keys(userAnswers).length < questions.length
            }
            className={`w-full py-3 px-6 text-white font-semibold rounded-lg shadow transition ${
              Object.keys(userAnswers).length === questions.length && !submitting
                ? "bg-indigo-600 hover:bg-indigo-700 cursor-pointer"
                : "bg-gray-400 cursor-not-allowed"
            }`}
          >
            {submitting ? "Submitting…" : "Submit Answers"}
          </button>
        )}
      </form>
    </div>
  );
}