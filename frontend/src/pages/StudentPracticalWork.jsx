import { useRef, useState } from "react";
import StudentLayout from "../layouts/StudentLayout";
import { practicalWork } from "../data/studentDashboard";
import "./StudentPracticalWork.css";

const STORAGE_KEY = "student-practical-completed-exercises";

function readCompletedIds() {
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    return Array.isArray(stored) ? stored.map(String) : [];
  } catch {
    return [];
  }
}

function ExerciseCard({ exercise, onInstructions, onComplete, isComplete }) {
  return (
    <li className="practical-card">
      <div className="practical-card-details">
        <span className="practical-module">{exercise.course || exercise.moduleTitle || "Module not specified"}</span>
        <h3>{exercise.title}</h3>
      </div>
      <div className="practical-card-buttons">
        <button
          type="button"
          className="practical-button practical-button-outline"
          onClick={() => onInstructions(exercise)}
        >
          Exercise instructions
        </button>
        {!isComplete && (
          <button
            type="button"
            className="practical-button practical-button-primary"
            onClick={() => onComplete(exercise)}
          >
            Mark as completed
          </button>
        )}
      </div>
    </li>
  );
}

export default function StudentPracticalWork() {
  const instructionsDialog = useRef(null);
  const [selectedExercise, setSelectedExercise] = useState(null);
  const [completedIds, setCompletedIds] = useState(readCompletedIds);

  // Existing demo records marked Passed appear in the completed section.
  // Newly completed exercises are stored locally until a backend endpoint exists.
  const isComplete = (exercise) =>
    exercise.status === "Passed" || completedIds.includes(String(exercise.id));

  const exercisesToComplete = practicalWork.filter((exercise) => !isComplete(exercise));
  const completedExercises = practicalWork.filter(isComplete);

  function openInstructions(exercise) {
    setSelectedExercise(exercise);
    instructionsDialog.current?.showModal();
  }

  function closeInstructions() {
    instructionsDialog.current?.close();
  }

  function markAsCompleted(exercise) {
    const id = String(exercise.id);
    const updated = [...new Set([...completedIds, id])];
    setCompletedIds(updated);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch {
      // The UI still updates for this session if browser storage is unavailable.
    }
  }

  const renderExerciseList = (items, emptyTitle, emptyMessage, completed = false) =>
    items.length ? (
      <ul className="practical-list">
        {items.map((exercise) => (
          <ExerciseCard
            key={exercise.id}
            exercise={exercise}
            isComplete={completed}
            onInstructions={openInstructions}
            onComplete={markAsCompleted}
          />
        ))}
      </ul>
    ) : (
      <div className="practical-empty">
        <h3>{emptyTitle}</h3>
        <p>{emptyMessage}</p>
      </div>
    );

  return (
    <StudentLayout title="Practical work">
      <div className="content student-practical">
        <section className="practical-section" aria-labelledby="exercises-to-complete">
          <div className="practical-section-heading">
            <div>
              <h2 id="exercises-to-complete">Exercises to Complete</h2>
              <p>Review the instructions and complete your practical exercises.</p>
            </div>
            <span className="practical-count">{exercisesToComplete.length} to complete</span>
          </div>
          {renderExerciseList(
            exercisesToComplete,
            "No exercises to complete",
            "You're all caught up with your practical exercises."
          )}
        </section>

        <section className="practical-section practical-completed" aria-labelledby="completed-exercises">
          <div className="practical-section-heading">
            <div>
              <h2 id="completed-exercises">Completed Exercises</h2>
              <p>Review the exercises you've marked as completed.</p>
            </div>
            <span className="practical-count">{completedExercises.length} completed</span>
          </div>
          {renderExerciseList(
            completedExercises,
            "No completed exercises",
            "Exercises you complete will appear here.",
            true
          )}
        </section>

        <dialog
          ref={instructionsDialog}
          className="practical-instructions-dialog"
          aria-labelledby="practical-instructions-title"
          onClick={(event) => {
            if (event.target === instructionsDialog.current) closeInstructions();
          }}
        >
          {selectedExercise && (
            <div className="practical-dialog-content">
              <div className="practical-dialog-heading">
                <div>
                  <span className="practical-module">
                    {selectedExercise.course || selectedExercise.moduleTitle || "Module not specified"}
                  </span>
                  <h2 id="practical-instructions-title">{selectedExercise.title}</h2>
                </div>
                <button
                  type="button"
                  className="practical-dialog-close"
                  onClick={closeInstructions}
                  aria-label="Close instructions"
                >
                  ×
                </button>
              </div>
              <div className="practical-dialog-section">
                <h3>Exercise instructions</h3>
                <p>{selectedExercise.instructions || selectedExercise.instruction || "Instructions have not been provided for this exercise yet."}</p>
              </div>
              <div className="practical-dialog-section">
                <h3>Expected outcomes</h3>
                {Array.isArray(selectedExercise.expectedOutcomes) && selectedExercise.expectedOutcomes.length ? (
                  <ul>
                    {selectedExercise.expectedOutcomes.map((outcome, index) => <li key={index}>{outcome}</li>)}
                  </ul>
                ) : (
                  <p>{selectedExercise.expectedOutcomes || selectedExercise.expectedOutcome || "Expected outcomes have not been provided for this exercise yet."}</p>
                )}
              </div>
              <div className="practical-dialog-footer">
                <button type="button" className="practical-button practical-button-primary" onClick={closeInstructions}>
                  Close
                </button>
              </div>
            </div>
          )}
        </dialog>
      </div>
    </StudentLayout>
  );
}
