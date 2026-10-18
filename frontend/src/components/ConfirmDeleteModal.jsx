
import { useEffect, useId, useRef } from "react";
import { createPortal } from "react-dom";
import "./ConfirmDeleteModal.css";

export default function ConfirmDeleteModal({
  open,
  title = "Confirm deletion",
  message,
  confirmText = "Delete",
  loading = false,
  onConfirm,
  onCancel,
}) {
  const titleId = useId();
  const messageId = useId();
  const cancelButtonRef = useRef(null);
  const dialogRef = useRef(null);

  useEffect(() => {
    if (!open) return;

    const previousFocus = document.activeElement;
    cancelButtonRef.current?.focus();

    function handleKeyDown(event) {
      if (event.key === "Escape" && !loading) {
        event.preventDefault();
        onCancel();
      }

      if (event.key === "Tab") {
        const buttons = [...dialogRef.current.querySelectorAll(
          "button:not(:disabled)"
        )];

        if (!buttons.length) return;

        const first = buttons[0];
        const last = buttons[buttons.length - 1];

        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    }

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      previousFocus?.focus?.();
    };
  }, [open, loading, onCancel]);

  if (!open) return null;

  return createPortal(
    <div
      className="confirm-delete-overlay"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !loading) {
          onCancel();
        }
      }}
    >
      <div
        ref={dialogRef}
        className="confirm-delete-modal"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={messageId}
      >
        <div className="confirm-delete-icon" aria-hidden="true">
          !
        </div>

        <h2 id={titleId}>{title}</h2>

        <p id={messageId}>{message}</p>

        <div className="confirm-delete-actions">
          <button
            ref={cancelButtonRef}
            className="confirm-delete-cancel"
            type="button"
            disabled={loading}
            onClick={onCancel}
          >
            Cancel
          </button>

          <button
            className="confirm-delete-submit"
            type="button"
            disabled={loading}
            onClick={onConfirm}
          >
            {loading ? "Processing..." : confirmText}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
