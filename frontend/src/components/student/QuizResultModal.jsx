
import { CheckCircle2, XCircle } from "lucide-react";
import "./QuizResultModal.css";

export default function QuizResultModal({
  result,
  onContinue,
}) {
  if (!result) return null;

  const { passed, score, passingScore } = result;

  return (
    <div className="quiz-result-overlay">
      <div
        className="quiz-result-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="quiz-result-title"
        aria-describedby="quiz-result-description"
      >
        <div className="quiz-result-icon">
          {passed ? (
            <CheckCircle2 size={64} color="#16a34a" />
          ) : (
            <XCircle size={64} color="#dc2626" />
          )}
        </div>

        <h2 id="quiz-result-title">
          {passed ? "Quiz Passed!" : "Quiz Failed"}
        </h2>

        <div
          className={`quiz-result-score ${
            passed ? "success" : "failure"
          }`}
        >
          {score}%
        </div>

        <p className="quiz-result-requirement">
          Required passing mark: {passingScore}%
        </p>

        <p
          id="quiz-result-description"
          className="quiz-result-description"
        >
          {passed
            ? "Congratulations! You have successfully passed this quiz. Return to your lesson to continue learning."
            : "You did not achieve the required passing mark. You can review your assessments and retake this quiz."}
        </p>

        <button
          type="button"
          className={`quiz-result-button ${
            passed ? "success" : "failure"
          }`}
          onClick={onContinue}
          autoFocus
        >
          {passed ? "Return to Lesson" : "View Assessments"}
        </button>
      </div>
    </div>
  );
}
