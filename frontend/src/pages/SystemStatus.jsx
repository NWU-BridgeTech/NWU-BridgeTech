import { Link } from "react-router-dom";
import AppLayout from "../layouts/AppLayout";
import { systemStatus } from "../data/adminData";
import { getSystemStatus, statusLabels } from "../utils/systemStatus";
import "./Admin.css";
import "./SystemStatus.css";

export default function SystemStatus() {
  const { services, checkedAt } = systemStatus;

  const summary = getSystemStatus(services);

  const operationalCount = services.filter(
    (service) => service.status === "operational",
  ).length;

  const checkedDate = checkedAt ? new Date(checkedAt) : null;

  const hasCheckedDate =
    checkedDate && !Number.isNaN(checkedDate.getTime());

  return (
    <AppLayout>
      <div className="system-status-page">
        <header className="top">
          <div>
            <div className="greeting">
              System <b>status</b>
            </div>

            <p>
              Check service availability and issues affecting the platform.
            </p>
          </div>

          <div className="top-actions">
            <Link className="btn blue" to="/admin">
              Back to overview
            </Link>
          </div>
        </header>

        <div className="content">
          <section
            className={`system-summary status-${summary.status}`}
            aria-labelledby="system-summary-heading"
          >
            <div>
              <h2 id="system-summary-heading">{summary.title}</h2>

              <p>
                {services.length
                  ? `${operationalCount} of ${services.length} services are operational.`
                  : "No service checks are available yet."}
              </p>
            </div>

            <div className="system-last-check">
              <span>Last checked</span>

              {hasCheckedDate ? (
                <time dateTime={checkedAt}>
                  {checkedDate.toLocaleString("en-GB", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                    timeZoneName: "short",
                  })}
                </time>
              ) : (
                <span>Not available</span>
              )}
            </div>
          </section>

          <section
            className="card"
            aria-labelledby="services-heading"
          >
            <h2 id="services-heading">Services</h2>

            <p className="sub">
              Availability and the latest reported condition of each service.
            </p>

            {services.length > 0 ? (
              <table className="service-table">
                <thead>
                  <tr>
                    <th scope="col">Service</th>
                    <th scope="col">Status</th>
                    <th scope="col">Details</th>
                  </tr>
                </thead>

                <tbody>
                  {services.map((service) => {
                    const status = Object.hasOwn(
                      statusLabels,
                      service.status,
                    )
                      ? service.status
                      : "unknown";

                    return (
                      <tr key={service.id}>
                        <th scope="row">{service.name}</th>

                        <td>
                          <span
                            className={`service-badge status-${status}`}
                          >
                            {statusLabels[status]}
                          </span>
                        </td>

                        <td>
                          {service.message || "No details reported."}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            ) : (
              <p className="system-empty">
                Service details will appear when checks are available.
              </p>
            )}
          </section>
        </div>
      </div>
    </AppLayout>
  );
}