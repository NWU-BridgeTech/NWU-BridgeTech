import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getToken } from "../utils/authStorage";

const BACKEND_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5174";

const QuizRunner = () => {
  const { quizId } = useParams();
  const navigate = useNavigate();

  const [quiz, setQuiz] = useState(null);
  const [attemptId, setAttemptId] = useState(null);
  const [answers, setAnswers] = useState({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [quizError, setQuizError] = useState(null);
  const [attemptError, setAttemptError] = useState(null);

  const getAuthHeaders = () => {
    const token = getToken();
    return {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
  };

  useEffect(() => {
    const initQuiz = async () => {
      setLoading(true);
      setQuizError(null);
      setAttemptError(null);

      try {
        console.log(`[QuizRunner] GET: ${BACKEND_URL}/api/quizzes/${quizId}`);
        const quizRes = await fetch(`${BACKEND_URL}/api/quizzes/${quizId}`, {
          headers: getAuthHeaders(),
        });

        if (!quizRes.ok) {
          const text = await quizRes.text();
          throw new Error(`HTTP ${quizRes.status}: ${text}`);
        }

        const quizData = await quizRes.json();
        console.log(
          "[QuizRunner] Quiz content fetched successfully:",
          quizData,
        );
        setQuiz(quizData);
      } catch (err) {
        console.error("[QuizRunner] Error fetching quiz:", err);
        setQuizError(err.message);
        setLoading(false);
        return;
      }

      try {
        console.log(
          `[QuizRunner] POST: ${BACKEND_URL}/api/quizzes/${quizId}/attempts`,
        );
        const attemptRes = await fetch(
          `${BACKEND_URL}/api/quizzes/${quizId}/attempts`,
          {
            method: "POST",
            headers: getAuthHeaders(),
          },
        );

        if (!attemptRes.ok) {
          const text = await attemptRes.text();
          throw new Error(`HTTP ${attemptRes.status}: ${text}`);
        }

        const attemptData = await attemptRes.json();
        console.log("[QuizRunner] Attempt started:", attemptData);

        const activeAttemptId = attemptData.attemptId || attemptData.AttemptId;
        if (!activeAttemptId) {
          throw new Error(
            "Backend returned attempt object without an AttemptId",
          );
        }

        setAttemptId(activeAttemptId);
      } catch (err) {
        console.error("[QuizRunner] Error starting attempt:", err);
        setAttemptError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (quizId) initQuiz();
  }, [quizId]);

  const handleOptionChange = (questionId, optionId) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: optionId,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!attemptId) {
      alert(
        `Cannot submit: Attempt failed to initialize. Error: ${attemptError}`,
      );
      return;
    }

    setSubmitting(true);

    try {
      const payload = {
        attemptId: attemptId,
        answers: Object.entries(answers).map(([qId, optId]) => ({
          questionId: qId,
          optionId: optId,
        })),
      };

      console.log("[QuizRunner] Submitting payload:", payload);

      const response = await fetch(
        `${BACKEND_URL}/api/quizzes/${quizId}/submit`,
        {
          method: "POST",
          headers: getAuthHeaders(),
          body: JSON.stringify(payload),
        },
      );

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(
          errData.message || `Submission failed (HTTP ${response.status})`,
        );
      }

      await response.json();
      navigate("/quizzes");
    } catch (err) {
      alert(`Submission Error: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading)
    return <div className="p-6 text-center text-gray-600">Loading quiz...</div>;
  if (quizError)
    return (
      <div className="p-6 text-red-600 text-center font-mono">
        Quiz Content Error: {quizError}
      </div>
    );
  if (!quiz) return <div className="p-6 text-center">Quiz not found.</div>;

  const questions = quiz.questions || quiz.Questions || [];

  return (
    <div className="max-w-3xl mx-auto p-6 bg-white rounded-lg shadow-md my-8">
      <h1 className="text-2xl font-bold mb-2">
        {quiz.title || quiz.Title || "Quiz"}
      </h1>

      {attemptError && (
        <div className="mb-6 p-4 bg-yellow-50 border-l-4 border-yellow-400 text-yellow-800 text-sm">
          <strong>Attempt Initialization Warning:</strong> {attemptError}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        {questions.map((question, index) => {
          const qId = question.questionId || question.QuestionId;
          const qText = question.questionText || question.QuestionText;
          const options = question.options || question.Options || [];

          return (
            <div key={qId || index} className="p-4 border rounded-md">
              <h3 className="text-lg font-semibold mb-4">
                {index + 1}. {qText}
              </h3>

              <div className="space-y-2">
                {options.map((option) => {
                  const optionVal = option.optionId || option.OptionId;
                  const optionText = option.optionText || option.OptionText;

                  return (
                    <label
                      key={optionVal}
                      className="flex items-center space-x-3 p-3 border rounded-md cursor-pointer hover:bg-gray-50 transition"
                    >
                      <input
                        type="radio"
                        name={`question-${qId}`}
                        value={optionVal}
                        checked={answers[qId] === optionVal}
                        onChange={() => handleOptionChange(qId, optionVal)}
                        className="h-4 w-4 text-blue-600"
                      />
                      <span className="text-gray-700">{optionText}</span>
                    </label>
                  );
                })}
              </div>
            </div>
          );
        })}

        <div className="pt-4">
          <button
            type="submit"
            disabled={submitting || !attemptId}
            className="w-full bg-blue-600 text-white font-medium py-3 px-6 rounded-md hover:bg-blue-700 disabled:bg-gray-400 transition"
          >
            {submitting ? "Submitting..." : "Submit Answers"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default QuizRunner;
