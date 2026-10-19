import { useState } from "react";
import { PHOTOS } from "./authPhotos";
import "./AuthShell.css";

function BridgeMark() {
  const line = (props, delay) => (
    <line
      className="bm-line"
      pathLength="1"
      stroke="#f3f1ea"
      style={{ animationDelay: `${delay}s` }}
      {...props}
    />
  );
  const curve = (d, delay) => (
    <path
      className="bm-line"
      pathLength="1"
      d={d}
      stroke="#f3f1ea"
      strokeWidth="1.4"
      style={{ animationDelay: `${delay}s` }}
    />
  );

  return (
    <svg viewBox="0 0 520 300" fill="none" aria-hidden="true">
      {line({ x1: 0, y1: 230, x2: 520, y2: 230, strokeWidth: 2 }, 0)}
      {line({ x1: 90, y1: 230, x2: 90, y2: 10, strokeWidth: 3 }, 0.25)}
      {line({ x1: 330, y1: 230, x2: 330, y2: 10, strokeWidth: 3 }, 0.35)}
      {curve("M0 230 C 90 60, 90 60, 210 230", 0.5)}
      {curve("M210 230 C 330 30, 330 30, 450 230", 0.6)}
      {curve("M450 230 C 470 150, 500 120, 520 100", 0.7)}
      {Array.from({ length: 11 }).map((_, i) => {
        const x = 20 + i * 19;
        return (
          <line
            className="bm-line"
            pathLength="1"
            key={`a${x}`}
            x1={x}
            y1="230"
            x2={x}
            y2={230 - Math.max(6, 150 - Math.abs(x - 90) * 1.35)}
            stroke="#f3f1ea"
            strokeWidth="1"
            style={{ animationDelay: `${0.85 + i * 0.03}s` }}
          />
        );
      })}
      {Array.from({ length: 12 }).map((_, i) => {
        const x = 240 + i * 19;
        return (
          <line
            className="bm-line"
            pathLength="1"
            key={`b${x}`}
            x1={x}
            y1="230"
            x2={x}
            y2={230 - Math.max(6, 200 - Math.abs(x - 330) * 1.35)}
            stroke="#f3f1ea"
            strokeWidth="1"
            style={{ animationDelay: `${1.2 + i * 0.03}s` }}
          />
        );
      })}
    </svg>
  );
}

/* Shared layout for Sign up, Sign in and Reset password. */
export default function AuthShell({
  title,
  text,
  photo = PHOTOS.signup,
  children,
}) {
  const [photoFailed, setPhotoFailed] = useState(false);

  return (
    <div className="au">
      <div className="au-photo" aria-hidden="true">
        {!photoFailed && (
          <img
            src={photo}
            alt=""
            referrerPolicy="no-referrer"
            onError={() => setPhotoFailed(true)}
          />
        )}
      </div>

      <main className="au-stage">
        <aside className="au-side">
          <div className="au-brand">
            <div className="au-mark" aria-hidden="true">
              <BridgeMark />
            </div>
            <a className="au-logo" href="/" aria-label="BridgeTech home">
              Bridge<i>Tech</i>
            </a>
          </div>
          <div className="au-tagline">
            <h2>{title}</h2>
            {text && <p>{text}</p>}
          </div>
        </aside>

        <section className="au-card">{children}</section>
      </main>
    </div>
  );
}

/* Password field with a show/hide toggle. */
export function PasswordInput({ showToggle = true, ...props }) {
  const [show, setShow] = useState(false);

  return (
    <div className="au-pw">
      <input
        {...props}
        className="au-input"
        type={show ? "text" : "password"}
        style={{ paddingRight: showToggle ? 72 : undefined }}
      />
      {showToggle && (
        <button
          type="button"
          className="au-pw-toggle"
          onClick={() => setShow((v) => !v)}
          aria-pressed={show}
        >
          {show ? "Hide" : "Show"}
        </button>
      )}
    </div>
  );
}
