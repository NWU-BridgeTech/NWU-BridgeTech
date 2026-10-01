import { useEffect, useState } from "react";
import { BadgeCheck } from "lucide-react";
import StudentLayout from "../layouts/StudentLayout";
import useCurrentUser from "../hooks/useCurrentUser";
import { getToken } from "../utils/authStorage";
import "./StudentBadges.css";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5174";

function formatDate(date) {
  return new Date(date).toLocaleDateString("en-ZA", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Africa/Johannesburg",
  });
}

export default function StudentBadges() {
  const { user, loading: userLoading, error: userError } = useCurrentUser();
  const [badges, setBadges] = useState([]);
  const [badgesLoading, setBadgesLoading] = useState(true);
  const [badgesError, setBadgesError] = useState("");

  useEffect(() => {
    if (!user?.userId) return;

    fetch(`${API_URL}/api/badges/user/${user.userId}`, {
      headers: { Authorization: `Bearer ${getToken()}` },
    })
      .then((response) => {
        if (!response.ok) throw new Error("Unable to load badges.");
        return response.json();
      })
      .then(setBadges)
      .catch(() => setBadgesError("Unable to load your badges."))
      .finally(() => setBadgesLoading(false));
  }, [user]);

  const error = userError || badgesError;
  const loading = userLoading || (user?.userId && badgesLoading);

  return (
    <StudentLayout title="Badges">
      <div className="content student-badges">
        <section aria-labelledby="earned-badges-heading">
          <div className="badges-heading">
            <div>
              <h2 id="earned-badges-heading">Concept badges</h2>
              <p>Recognitions for the concepts you have mastered.</p>
            </div>
            <span className="badge-count">
              {badges.length}{" "}
              {badges.length === 1 ? "badge earned" : "badges earned"}
            </span>
          </div>

          {error ? (
            <p role="alert" className="badges-message">
              {error}
            </p>
          ) : loading ? (
            <p className="badges-message">Loading your badges...</p>
          ) : badges.length > 0 ? (
            <ul className="badge-list">
              {badges.map((badge) => (
                <li className="badge-card" key={badge.badgeId}>
                  <div className="badge-icon" aria-hidden="true">
                    <BadgeCheck size={30} strokeWidth={1.7} />
                  </div>
                  <div className="badge-info">
                    <span className="activity-status success">
                      Concept mastered
                    </span>
                    <h3>{badge.conceptTitle}</h3>
                    <p>{badge.moduleTitle}</p>
                    <time dateTime={badge.awardedAt}>
                      Earned {formatDate(badge.awardedAt)}
                    </time>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="badges-empty">
              <BadgeCheck size={34} strokeWidth={1.5} aria-hidden="true" />
              <h3>Your first badge starts with a concept</h3>
              <p>Complete a lesson to earn your first concept badge.</p>
            </div>
          )}
        </section>
      </div>
    </StudentLayout>
  );
}
