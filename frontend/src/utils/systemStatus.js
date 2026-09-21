export const statusLabels = {
  operational: "Operational",
  degraded: "Degraded",
  unavailable: "Unavailable",
  unknown: "Not checked",
};

export function getSystemStatus(services) {
  if (services.some((service) => service.status === "unavailable")) {
    return { status: "unavailable", title: "Some services are unavailable" };
  }
  if (services.some((service) => service.status === "degraded")) {
    return { status: "degraded", title: "Some services need attention" };
  }
  if (
    services.length === 0 ||
    services.some((service) => service.status !== "operational")
  ) {
    return {
      status: "unknown",
      title: "Service status is not fully available",
    };
  }
  return { status: "operational", title: "All systems operational" };
}
