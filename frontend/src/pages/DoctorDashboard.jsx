
import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { apiRequest } from "../services/api";

export default function DoctorDashboard() {
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [actionId, setActionId] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem("mediflow_token");
    const savedUser = localStorage.getItem("mediflow_user");

    if (!token || !savedUser) {
      navigate("/login", { replace: true });
      return;
    }

    try {
      const parsedUser = JSON.parse(savedUser);

      if (parsedUser.role !== "DOCTOR") {
        navigate(
          parsedUser.role === "PATIENT"
            ? "/patient/dashboard"
            : "/login",
          { replace: true }
        );
        return;
      }

      setUser(parsedUser);
    } catch {
      localStorage.removeItem("mediflow_token");
      localStorage.removeItem("mediflow_user");
      navigate("/login", { replace: true });
    }
  }, [navigate]);

  const loadAppointments = useCallback(async () => {
    const token = localStorage.getItem("mediflow_token");

    if (!token) {
      navigate("/login", { replace: true });
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await apiRequest("/appointments/doctor/today", {
        token,
      });

      setAppointments(response.appointments ?? []);
    } catch (err) {
      setError(err.message || "Could not load today's appointments.");
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    if (user) {
      loadAppointments();
    }
  }, [user, loadAppointments]);

  function handleLogout() {
    localStorage.removeItem("mediflow_token");
    localStorage.removeItem("mediflow_user");
    navigate("/login", { replace: true });
  }

  async function handleConsultationAction(appointment, action) {
    const token = localStorage.getItem("mediflow_token");
    const appointmentId = appointment.id;

    setActionId(appointmentId);
    setError("");
    setMessage("");

    try {
      const response = await apiRequest(
        `/appointments/${appointmentId}/${action}`,
        {
          method: "PATCH",
          token,
        }
      );

      setMessage(
        response.message ||
          (action === "start"
            ? "Consultation started successfully."
            : "Consultation completed successfully.")
      );

      await loadAppointments();
    } catch (err) {
      setError(err.message || "Could not update the appointment.");
    } finally {
      setActionId(null);
    }
  }

  function formatTime(value) {
    if (!value) return "Time unavailable";

    // The backend currently returns appointment times as IST-formatted
    // strings, so display those strings directly rather than parsing them.
    if (Number.isNaN(Date.parse(value))) {
      return value;
    }

    return new Date(value).toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
      timeZone: "Asia/Kolkata",
    });
  }

  function statusStyle(status) {
    switch (status) {
      case "BOOKED":
        return "bg-blue-50 text-blue-700";
      case "CHECKED_IN":
        return "bg-amber-50 text-amber-700";
      case "IN_CONSULTATION":
        return "bg-purple-50 text-purple-700";
      case "DONE":
        return "bg-green-50 text-green-700";
      case "CANCELLED":
        return "bg-red-50 text-red-700";
      case "NO_SHOW":
        return "bg-slate-100 text-slate-700";
      default:
        return "bg-slate-100 text-slate-700";
    }
  }

  const checkedInCount = appointments.filter(
    (appointment) => appointment.status === "CHECKED_IN"
  ).length;

  const activeCount = appointments.filter(
    (appointment) => appointment.status === "IN_CONSULTATION"
  ).length;

  const completedCount = appointments.filter(
    (appointment) => appointment.status === "DONE"
  ).length;

  if (!user) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50">
        <p className="text-slate-600">Loading doctor dashboard...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-5">
          <Link to="/" className="text-2xl font-bold text-teal-700">
            MediFlow
          </Link>

          <button
            type="button"
            onClick={handleLogout}
            className="rounded-xl border border-slate-200 px-4 py-2 font-medium text-slate-700 hover:bg-slate-100"
          >
            Logout
          </button>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-5 py-10">
        <section className="rounded-3xl bg-gradient-to-r from-slate-900 to-teal-800 p-8 text-white sm:p-10">
          <p className="text-sm font-semibold uppercase tracking-widest text-teal-200">
            Doctor portal
          </p>

          <h1 className="mt-3 text-3xl font-bold sm:text-4xl">
            Welcome, Dr. {user.name || "Doctor"}
          </h1>

          <p className="mt-3 text-slate-200">
            Manage today's appointments and patient consultations.
          </p>

          <button
            type="button"
            onClick={loadAppointments}
            disabled={loading}
            className="mt-6 rounded-xl bg-white px-5 py-3 font-semibold text-teal-800 hover:bg-teal-50 disabled:opacity-60"
          >
            {loading ? "Refreshing..." : "Refresh appointments"}
          </button>
        </section>

        <section className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            {
              label: "Today's appointments",
              value: appointments.length,
              color: "text-teal-700",
            },
            {
              label: "Waiting for consultation",
              value: checkedInCount,
              color: "text-amber-700",
            },
            {
              label: "In consultation",
              value: activeCount,
              color: "text-purple-700",
            },
            {
              label: "Completed",
              value: completedCount,
              color: "text-green-700",
            },
          ].map((item) => (
            <article
              key={item.label}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
            >
              <p className="text-sm text-slate-500">{item.label}</p>
              <p className={`mt-3 text-3xl font-bold ${item.color}`}>
                {loading ? "—" : item.value}
              </p>
            </article>
          ))}
        </section>

        {message && (
          <p
            role="status"
            className="mt-6 rounded-xl border border-green-200 bg-green-50 p-4 text-green-800"
          >
            {message}
          </p>
        )}

        {error && (
          <p
            role="alert"
            className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-red-700"
          >
            {error}
          </p>
        )}

        <section className="mt-10">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">
              Today's appointments
            </h2>
            <p className="mt-2 text-slate-600">
              Review patients and update consultation status.
            </p>
          </div>

          {loading && (
            <p className="mt-6 text-slate-600">
              Loading today's appointments...
            </p>
          )}

          {!loading && !error && appointments.length === 0 && (
            <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-8 text-center">
              <h3 className="text-lg font-semibold text-slate-900">
                No appointments today
              </h3>
              <p className="mt-2 text-slate-600">
                Appointments scheduled for today will appear here.
              </p>
            </div>
          )}

          {!loading && appointments.length > 0 && (
            <div className="mt-6 space-y-4">
              {appointments.map((appointment) => {
                const start = appointment.slot?.startsAt;
                const end = appointment.slot?.endsAt;
                const patient = appointment.patient;
                const busy = actionId === appointment.id;

                return (
                  <article
                    key={appointment.id}
                    className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
                  >
                    <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-start">
                      <div>
                        <h3 className="text-lg font-semibold text-slate-900">
                          {patient?.name || "Patient"}
                        </h3>

                        <p className="mt-1 text-sm text-slate-500">
                          {patient?.email || "Email unavailable"}
                        </p>

                        <p className="mt-4 font-medium text-slate-800">
                          {formatTime(start)}
                          {end ? ` – ${formatTime(end)}` : ""}
                        </p>

                        <p className="mt-2 text-xs text-slate-400">
                          Appointment ID: {appointment.id}
                        </p>
                      </div>

                      <div className="flex flex-col items-start gap-3 sm:items-end">
                        <span
                          className={`rounded-full px-3 py-1.5 text-xs font-semibold ${statusStyle(
                            appointment.status
                          )}`}
                        >
                          {(appointment.status || "UNKNOWN").replaceAll(
                            "_",
                            " "
                          )}
                        </span>

                        {appointment.status === "CHECKED_IN" && (
                          <button
                            type="button"
                            disabled={actionId !== null}
                            onClick={() =>
                              handleConsultationAction(appointment, "start")
                            }
                            className="rounded-xl bg-teal-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-teal-800 disabled:opacity-60"
                          >
                            {busy ? "Starting..." : "Start consultation"}
                          </button>
                        )}

                        {appointment.status === "IN_CONSULTATION" && (
                          <button
                            type="button"
                            disabled={actionId !== null}
                            onClick={() =>
                              handleConsultationAction(appointment, "complete")
                            }
                            className="rounded-xl bg-green-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-green-800 disabled:opacity-60"
                          >
                            {busy ? "Completing..." : "Complete consultation"}
                          </button>
                        )}
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
