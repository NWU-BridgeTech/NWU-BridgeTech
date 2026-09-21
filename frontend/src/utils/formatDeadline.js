// Student deadlines and sync times are displayed in South African time.
export default function formatDeadline(date) {
  return new Date(date).toLocaleString("en-ZA", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "Africa/Johannesburg",
  });
}
