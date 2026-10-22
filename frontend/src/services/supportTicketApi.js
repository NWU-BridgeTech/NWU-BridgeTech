import { apiFetch } from "../utils/apiClient";

export const SUPPORT_CATEGORIES = [
  { value: "Bug", label: "Something isn't working" },
  { value: "CourseContent", label: "Course or lesson content" },
  { value: "Account", label: "Account or sign-in" },
  { value: "Feedback", label: "Suggestion or feedback" },
  { value: "Other", label: "Other" },
];

export function categoryLabel(value) {
  return (
    SUPPORT_CATEGORIES.find((category) => category.value === value)?.label ??
    value
  );
}

export function createSupportTicket(category, description) {
  return apiFetch("/api/support-tickets", {
    method: "POST",
    body: JSON.stringify({ category, description }),
  });
}

export function listSupportTickets() {
  return apiFetch("/api/admin/support-tickets");
}

export function updateSupportTicketStatus(id, status) {
  return apiFetch(`/api/admin/support-tickets/${id}`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
}
