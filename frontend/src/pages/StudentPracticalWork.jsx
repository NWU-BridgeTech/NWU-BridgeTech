
import { useCallback, useEffect, useRef, useState } from "react";
import StudentLayout from "../layouts/StudentLayout";
import { apiFetch } from "../utils/apiClient";
import "./StudentPracticalWork.css";


function ExerciseBulletList({ text, fallback }) {
  if (!text || !text.trim()) {
    return <p>{fallback}</p>;
  }

  const items = text
    .split("#")
    .map((item) => item.trim())
    .filter(Boolean);

  return (
    <ul className="practical-instructions-list">
      {items.map((item, index) => (
        <li key={index}>{item}</li>
      ))}
    </ul>
  );
}

function ExerciseCard({
  exercise,
  onInstructions,
  onComplete,
  isComplete,
  isCompleting,
}) {
  return (
    <li className="practical-card">
      <div className="practical-card-details">
        <span className="practical-module">
          {exercise.moduleTitle || "Module not specified"}
        </span>

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
            disabled={isCompleting}
          >
            {isCompleting ? "Saving..." : "Mark as completed"}
          </button>
        )}
      </div>
    </li>
  );
}

export default function StudentPracticalWork() {
  const instructionsDialog = useRef(null);

  const [selectedExercise, setSelectedExercise] = useState(null);
  const [exercises, setExercises] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [completingId, setCompletingId] = useState(null);

  // Retrieve exercises belonging to the student's registered modules
  const loadExercises = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const data = await apiFetch("/api/exercises/my");

      setExercises(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to load exercises:", err);

      setError(
        err.message || "Unable to load practical exercises."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadExercises();
  }, [loadExercises]);

  // Separate pending and completed exercises
  const exercisesToComplete = exercises.filter(
    (exercise) => !exercise.completed
  );

  const completedExercises = exercises.filter(
    (exercise) => exercise.completed
  );

  // Open exercise instructions
  function openInstructions(exercise) {
    setSelectedExercise(exercise);

    if (instructionsDialog.current) {
      instructionsDialog.current.showModal();
    }
  }

  // Close instructions modal
  function closeInstructions() {
    instructionsDialog.current?.close();
  }

  // Mark exercise as completed using the backend API
  async function markAsCompleted(exercise) {
    if (completingId !== null) return;

    setCompletingId(exercise.exerciseId);
    setError("");

    try {
      const result = await apiFetch(
        `/api/exercises/${exercise.exerciseId}/complete`,
        {
          method: "POST",
        }
      );

      // Only update the UI after the backend confirms completion
      setExercises((currentExercises) =>
        currentExercises.map((currentExercise) => {
          if (
            currentExercise.exerciseId === exercise.exerciseId
          ) {
            return {
              ...currentExercise,
              completed: true,
              completedAt: result?.completedAt ?? null,
              progressPercentage: 100,
            };
          }

          return currentExercise;
        })
      );
    } catch (err) {
      console.error("Failed to complete exercise:", err);

      setError(
        err.message || "Unable to mark the exercise as completed."
      );
    } finally {
      setCompletingId(null);
    }
  }

  // Render a reusable exercise list
  function renderExerciseList(
    items,
    emptyTitle,
    emptyMessage,
    completed = false
  ) {
    if (items.length === 0) {
      return (
        <div className="practical-empty">
          <h3>{emptyTitle}</h3>
          <p>{emptyMessage}</p>
        </div>
      );
    }

    return (
      <ul className="practical-list">
        {items.map((exercise) => (
          <ExerciseCard
            key={exercise.exerciseId}
            exercise={exercise}
            isComplete={completed}
            isCompleting={completingId === exercise.exerciseId}
            onInstructions={openInstructions}
            onComplete={markAsCompleted}
          />
        ))}
      </ul>
    );
  }

  return (
    <StudentLayout title="Practical work">
      <div className="content student-practical">

        {/* API error message */}
        {error && (
          <div
            className="practical-error"
            role="alert"
          >
            <p>{error}</p>

            <button
              type="button"
              className="practical-button practical-button-outline"
              onClick={loadExercises}
              disabled={loading}
            >
              Retry
            </button>
          </div>
        )}

        {/* EXERCISES TO COMPLETE */}
        <section
          className="practical-section"
          aria-labelledby="exercises-to-complete"
        >
          <div className="practical-section-heading">
            <div>
              <h2 id="exercises-to-complete">
                Exercises to Complete
              </h2>

              <p>
                Review the instructions and complete your
                practical exercises.
              </p>
            </div>

            <span className="practical-count">
              {exercisesToComplete.length} to complete
            </span>
          </div>

          {loading ? (
            <div className="practical-empty">
              <p>Loading exercises...</p>
            </div>
          ) : error && exercises.length === 0 ? null : (
            renderExerciseList(
              exercisesToComplete,
              "No exercises to complete",
              exercises.length === 0
                ? "Register for a module to view available practical exercises."
                : "You're all caught up with your practical exercises."
            )
          )}
        </section>

        {/* COMPLETED EXERCISES */}
        <section
          className="practical-section practical-completed"
          aria-labelledby="completed-exercises"
        >
          <div className="practical-section-heading">
            <div>
              <h2 id="completed-exercises">
                Completed Exercises
              </h2>

              <p>
                Review the exercises you've marked as completed.
              </p>
            </div>

            <span className="practical-count">
              {completedExercises.length} completed
            </span>
          </div>

          {loading ? (
            <div className="practical-empty">
              <p>Loading completed exercises...</p>
            </div>
          ) : (
            renderExerciseList(
              completedExercises,
              "No completed exercises",
              "Exercises you complete will appear here.",
              true
            )
          )}
        </section>

        {/* EXERCISE INSTRUCTIONS MODAL */}
        <dialog
          ref={instructionsDialog}
          className="practical-instructions-dialog"
          aria-labelledby="practical-instructions-title"
          onClick={(event) => {
            if (event.target === instructionsDialog.current) {
              closeInstructions();
            }
          }}
        >
          {selectedExercise && (
            <div className="practical-dialog-content">

              <div className="practical-dialog-heading">
                <div>
                  <span className="practical-module">
                    {selectedExercise.moduleTitle ||
                      "Module not specified"}
                  </span>

                  <h2 id="practical-instructions-title">
                    {selectedExercise.title}
                  </h2>
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

                <ExerciseBulletList
                  text={selectedExercise.description}
                  fallback="Instructions have not been provided for this exercise yet."
                />
              </div>


              
              <div className="practical-dialog-section">
                <h3>Expected outcomes</h3>

                <ExerciseBulletList
                  text={selectedExercise.outcomes}
                  fallback="Expected outcomes have not been provided for this exercise yet."
                />
              </div>


              <div className="practical-dialog-footer">
                <button
                  type="button"
                  className="practical-button practical-button-primary"
                  onClick={closeInstructions}
                >
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
