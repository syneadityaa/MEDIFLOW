import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { apiRequest } from "../services/api";

const ACTIVE_STATUSES = ["BOOKED", "CHECKED_IN", "IN_CONSULTATION"];

export default function MyAppointments() {
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [actionId, setActionId] = useState(null);
  const [activeFilter, setActiveFilter] = useState("ALL");

  const loadAppointments = useCallback(async () => {
    const token = localStorage.getItem("mediflow_token");

    if (!token) {
      navigate("/login", { replace: true });
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await apiRequest("/appointments/mine", { token });
      setAppointments(response.appointments ?? []);
    } catch (err) {
      setError(err.message || "Could not load appointments.");
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    const token = localStorage.getItem("mediflow_token");
    const savedUser = localStorage.getItem("mediflow_user");

    if (!token || !savedUser) {
      navigate("/login", { replace: true });
      return;
    }

    try {
      const parsedUser = JSON.parse(savedUser);
      if (parsedUser.role !== "PATIENT") {
        navigate(parsedUser.role === "DOCTOR" ? "/doctor/dashboard" : "/login", {
          replace: true,
        });
        return;
      }
      setUser(parsedUser);
      loadAppointments();
    } catch {
      localStorage.removeItem("mediflow_user");
      localStorage.removeItem("mediflow_token");
      navigate("/login", { replace: true });
    }
  }, [navigate, loadAppointments]);

  function formatDate(dateString) {
    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) return "Date unavailable";
    return date.toLocaleDateString("en-IN", {
      weekday: "short",
      day: "numeric",
      month: "short",
      year: "numeric",
      timeZone: "Asia/Kolkata",
    });
  }

  function formatTime(dateString) {
    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) return "Time unavailable";
    return date.toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
      timeZone: "Asia/Kolkata",
    });
  }

  async function handleCheckIn(appointmentId) {
    const token = localStorage.getItem("mediflow_token");
    setActionId(appointmentId);
    setError("");
    setMessage("");

    try {
      const response = await apiRequest(`/appointments/${appointmentId}/check-in`, {
        method: "PATCH",
        token,
      });
      setMessage(response.message || "Checked in successfully.");
      await loadAppointments();
    } catch (err) {
      setError(err.message || "Could not check in.");
    } finally {
      setActionId(null);
    }
  }

  async function handleCancel(appointmentId) {
    const confirmed = window.confirm(
      "Are you sure you want to cancel this appointment?"
    );
    if (!confirmed) return;

    const token = localStorage.getItem("mediflow_token");
    setActionId(appointmentId);
    setError("");
    setMessage("");

    try {
      const response = await apiRequest(`/appointments/${appointmentId}/cancel`, {
        method: "PATCH",
        token,
      });
      setMessage(response.message || "Appointment cancelled successfully.");
      await loadAppointments();
    } catch (err) {
      setError(err.message || "Could not cancel the appointment.");
    } finally {
      setActionId(null);
    }
  }

  function handleLogout() {
    localStorage.removeItem("mediflow_token");
    localStorage.removeItem("mediflow_user");
    navigate("/login", { replace: true });
  }

  function statusStyle(status) {
    switch (status) {
      case "BOOKED":
        return "bg-blue-50 text-blue-700 ring-blue-200";
      case "CHECKED_IN":
        return "bg-amber-50 text-amber-700 ring-amber-200";
      case "IN_CONSULTATION":
        return "bg-violet-50 text-violet-700 ring-violet-200";
      case "DONE":
        return "bg-emerald-50 text-emerald-700 ring-emerald-200";
      case "CANCELLED":
        return "bg-rose-50 text-rose-700 ring-rose-200";
      case "NO_SHOW":
        return "bg-slate-100 text-slate-600 ring-slate-200";
      default:
        return "bg-slate-100 text-slate-600 ring-slate-200";
    }
  }

  function appointmentCardStyle(status) {
    switch (status) {
      case "BOOKED":
        return "border-sky-200 border-l-sky-500 bg-gradient-to-r from-sky-50 to-white";
      case "CHECKED_IN":
        return "border-amber-200 border-l-amber-500 bg-gradient-to-r from-amber-50 to-white";
      case "IN_CONSULTATION":
        return "border-violet-200 border-l-violet-500 bg-gradient-to-r from-violet-50 to-white";
      case "DONE":
        return "border-emerald-200 border-l-emerald-500 bg-gradient-to-r from-emerald-50 to-white";
      case "CANCELLED":
        return "border-rose-200 border-l-rose-500 bg-gradient-to-r from-rose-50 to-white";
      case "NO_SHOW":
        return "border-slate-200 border-l-slate-400 bg-gradient-to-r from-slate-100 to-white";
      default:
        return "border-slate-200 border-l-teal-500 bg-gradient-to-r from-teal-50 to-white";
    }
  }

  const sortedAppointments = useMemo(() => {
    return [...appointments].sort(
      (a, b) =>
        new Date(a.slot?.startsAt || 0).getTime() -
        new Date(b.slot?.startsAt || 0).getTime()
    );
  }, [appointments]);

  const nextAppointment = useMemo(() => {
    const ongoing = sortedAppointments.find(
      (appointment) => appointment.status === "IN_CONSULTATION"
    );
    if (ongoing) return ongoing;

    const now = new Date();
    return sortedAppointments.find((appointment) => {
      const start = new Date(appointment.slot?.startsAt);
      return (
        ["BOOKED", "CHECKED_IN"].includes(appointment.status) &&
        !Number.isNaN(start.getTime()) &&
        start >= now
      );
    });
  }, [sortedAppointments]);

  const filteredAppointments = useMemo(() => {
    switch (activeFilter) {
      case "UPCOMING":
        return sortedAppointments.filter((item) => ACTIVE_STATUSES.includes(item.status));
      case "COMPLETED":
        return sortedAppointments.filter((item) => item.status === "DONE");
      case "CANCELLED":
        return sortedAppointments.filter((item) =>
          ["CANCELLED", "NO_SHOW"].includes(item.status)
        );
      default:
        return sortedAppointments;
    }
  }, [activeFilter, sortedAppointments]);

  const counts = useMemo(
    () => ({
      ALL: appointments.length,
      UPCOMING: appointments.filter((item) => ACTIVE_STATUSES.includes(item.status)).length,
      COMPLETED: appointments.filter((item) => item.status === "DONE").length,
      CANCELLED: appointments.filter((item) => ["CANCELLED", "NO_SHOW"].includes(item.status)).length,
    }),
    [appointments]
  );

  if (!user) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#F5F8FA]">
        <div className="text-center">
          <div className="mx-auto h-9 w-9 animate-spin rounded-full border-4 border-teal-100 border-t-teal-700" />
          <p className="mt-4 text-sm font-medium text-slate-500">Loading your appointments...</p>
        </div>
      </main>
    );
  }

  const nextDoctor = nextAppointment?.slot?.doctor;

  return (
    <main className="min-h-screen bg-[#F5F8FA] text-slate-900">
      <div className="flex min-h-screen">
        {/* Sidebar */}
        <aside className="hidden w-[238px] shrink-0 flex-col border-r border-slate-200 bg-white px-5 py-7 lg:flex">
          <Link to="/" className="flex items-center gap-2.5 px-1">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-700 text-xl font-bold text-white">M</span>
            <span className="text-[21px] font-extrabold tracking-tight text-slate-900">Medi<span className="text-teal-700">Flow</span></span>
          </Link>

          <nav className="mt-12 space-y-2">
            <Link to="/patient/dashboard" className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold text-slate-500 transition hover:bg-slate-50 hover:text-teal-700">
              <HomeIcon /> Dashboard
            </Link>
            <Link to="/doctors" className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold text-slate-500 transition hover:bg-slate-50 hover:text-teal-700">
              <DoctorIcon /> Find Doctors
            </Link>
            <Link to="/appointments" className="flex items-center gap-3 rounded-xl bg-[#E5F7F4] px-4 py-3 text-sm font-bold text-teal-800">
              <CalendarIcon /> My Appointments
            </Link>
          </nav>

          <div className="mt-auto rounded-2xl bg-gradient-to-br from-[#E5F8F5] to-[#F0FAFC] p-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white text-teal-700 shadow-sm">
              <HeartIcon />
            </div>
            <p className="mt-4 text-sm font-bold text-slate-800">Your health matters</p>
            <p className="mt-1 text-xs leading-5 text-slate-500">We're here to support your wellness journey.</p>
          </div>
        </aside>

        {/* Main page */}
        <div className="min-w-0 flex-1">
          <header className="flex h-[76px] items-center justify-end border-b border-slate-200/80 bg-white px-5 sm:px-8">
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="hidden text-right sm:block">
                <p className="text-sm font-bold text-slate-800">{user.name || "Patient"}</p>
                <p className="text-xs text-slate-400">Patient account</p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#C9F6EE] font-bold text-teal-800">
                {(user.name || "P").charAt(0).toUpperCase()}
              </div>
              <button onClick={handleLogout} className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-700">
                Logout
              </button>
            </div>
          </header>

          <div className="mx-auto max-w-[1500px] px-5 py-7 sm:px-8 lg:px-10">
            {/* Page banner */}
            <section className="relative overflow-hidden rounded-[24px] bg-gradient-to-r from-[#DDF8F3] via-[#CFF5EF] to-[#A8EDE2] px-7 py-8 sm:px-9 sm:py-9">
              <div className="pointer-events-none absolute -right-8 -top-20 h-64 w-64 rounded-full border-[34px] border-white/20" />
              <div className="pointer-events-none absolute right-40 top-10 h-40 w-40 rounded-full bg-white/20 blur-2xl" />
              <div className="relative z-10 max-w-2xl">
                <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-teal-800">Your healthcare, organized</p>
                <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-[38px]">Your Appointments</h1>
                <p className="mt-3 max-w-xl text-sm leading-6 text-teal-900/80 sm:text-base">View your appointment schedule, check status and manage your bookings.</p>
              </div>
              <div className="pointer-events-none absolute bottom-0 right-10 hidden h-40 w-48 items-center justify-center rounded-t-full bg-white/20 md:flex">
                <div className="relative flex h-24 w-24 items-center justify-center rounded-2xl border-[5px] border-teal-600 bg-white/70 shadow-lg">
                  <div className="absolute -top-3 left-5 h-6 w-2 rounded-full bg-teal-600" />
                  <div className="absolute -top-3 right-5 h-6 w-2 rounded-full bg-teal-600" />
                  <CalendarIcon large />
                  <span className="absolute -bottom-2 -right-2 flex h-8 w-8 items-center justify-center rounded-full bg-teal-600 text-white"><CheckIcon /></span>
                </div>
              </div>
            </section>

            {/* Filters and refresh */}
            <section className="mt-7 flex flex-wrap items-center justify-between gap-4">
              <button onClick={loadAppointments} disabled={loading} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 shadow-sm transition hover:border-teal-200 hover:text-teal-700 disabled:opacity-50">
                <RefreshIcon /> {loading ? "Refreshing..." : "Refresh"}
              </button>
              <div className="flex flex-wrap gap-2">
                {[
                  ["ALL", "All"],
                  ["UPCOMING", "Upcoming"],
                  ["COMPLETED", "Completed"],
                  ["CANCELLED", "Cancelled"],
                ].map(([value, label]) => (
                  <button key={value} onClick={() => setActiveFilter(value)} className={`rounded-full border px-5 py-2.5 text-sm font-semibold transition ${activeFilter === value ? "border-teal-700 bg-teal-700 text-white shadow-sm" : "border-slate-200 bg-white text-slate-600 hover:border-teal-200 hover:text-teal-700"}`}>
                    {label}<span className={`ml-2 text-xs ${activeFilter === value ? "text-teal-100" : "text-slate-400"}`}>{counts[value]}</span>
                  </button>
                ))}
              </div>
            </section>

            {message && <div role="status" className="mt-5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800">{message}</div>}
            {error && <div role="alert" className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700"><span>{error}</span><button onClick={loadAppointments} className="font-bold underline">Try again</button></div>}

            {/* Highlighted next appointment */}
            {activeFilter === "ALL" && nextAppointment && (
              <section className="mt-7 overflow-hidden rounded-2xl border border-sky-200 bg-gradient-to-r from-[#F0F8FF] to-white shadow-sm">
                <div className="grid gap-5 p-5 sm:grid-cols-[1.05fr_1.25fr_auto] sm:items-center sm:p-6">
                  <div className="min-w-0">
                    <span className="inline-flex rounded-full bg-[#D8F7F0] px-3 py-1 text-[11px] font-extrabold uppercase tracking-wide text-teal-800">Next appointment</span>
                    <div className="mt-4 flex items-center gap-3">
                      <Avatar name={nextDoctor?.user?.name || "Doctor"} color="blue" />
                      <div className="min-w-0">
                        <h2 className="truncate font-bold text-slate-900">{nextDoctor?.user?.name || "Doctor"}</h2>
                        <p className="mt-1 text-sm text-slate-500">{nextDoctor?.specialty?.name || "Specialist"}</p>
                      </div>
                    </div>
                  </div>
                  <div className="grid gap-3 border-t border-sky-100 pt-4 text-sm text-slate-600 sm:border-l sm:border-t-0 sm:pl-6 sm:pt-0">
                    <div className="flex items-center gap-3"><CalendarIcon /><span className="font-semibold">{formatDate(nextAppointment.slot?.startsAt)}</span></div>
                    <div className="flex items-center gap-3"><ClockIcon /><span>{formatTime(nextAppointment.slot?.startsAt)} – {formatTime(nextAppointment.slot?.endsAt)}</span></div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 sm:flex-col sm:items-end">
                    <StatusBadge status={nextAppointment.status} className={statusStyle(nextAppointment.status)} />
                    <Link to={`/queue/${nextDoctor?.id}?appointmentId=${nextAppointment.id}`} className="mt-1 inline-flex items-center gap-2 rounded-xl bg-teal-700 px-4 py-2.5 text-xs font-bold text-white transition hover:bg-teal-800"><PulseIcon /> Track Queue</Link>
                  </div>
                </div>
              </section>
            )}

            {/* Appointment cards */}
            <section className="mt-5 space-y-3">
              {loading ? (
                [1, 2, 3].map((item) => <div key={item} className="h-36 animate-pulse rounded-2xl border border-slate-200 bg-white" />)
              ) : filteredAppointments.length > 0 ? (
                filteredAppointments.map((appointment, index) => {
                  const doctor = appointment.slot?.doctor;
                  const isActive = ACTIVE_STATUSES.includes(appointment.status);
                  const busy = actionId === appointment.id;
                  const avatarColors = ["blue", "violet", "green", "pink", "cyan"];
                  return (
                    <article key={appointment.id} className={`group rounded-2xl border border-l-4 p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md sm:p-6 ${appointmentCardStyle(appointment.status)} ${appointment.id === nextAppointment?.id ? "ring-2 ring-teal-200 ring-offset-2" : ""}`}>
                      <div className="grid gap-5 sm:grid-cols-[1.05fr_1.25fr_auto] sm:items-center">
                        <div className="flex min-w-0 items-center gap-4">
                          <Avatar name={doctor?.user?.name || "Doctor"} color={avatarColors[index % avatarColors.length]} />
                          <div className="min-w-0">
                            <h3 className="truncate font-bold text-slate-900">{doctor?.user?.name || "Doctor"}</h3>
                            <p className="mt-1 text-sm text-slate-500">{doctor?.specialty?.name || "Specialist"}</p>
                            <p className="mt-2 text-xs text-slate-400">Appointment #{appointment.id}</p>
                          </div>
                        </div>

                        <div className="grid gap-2 border-t border-slate-100 pt-4 text-sm text-slate-600 sm:border-l sm:border-t-0 sm:pl-6 sm:pt-0">
                          <div className="flex items-center gap-3"><CalendarIcon /><span>{formatDate(appointment.slot?.startsAt)}</span></div>
                          <div className="flex items-center gap-3"><ClockIcon /><span>{formatTime(appointment.slot?.startsAt)} – {formatTime(appointment.slot?.endsAt)}</span></div>
                        </div>

                        <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                          <StatusBadge status={appointment.status} className={statusStyle(appointment.status)} />
                          {appointment.status === "BOOKED" && (
                            <>
                              <button onClick={() => handleCheckIn(appointment.id)} disabled={busy} className="rounded-xl bg-teal-700 px-3 py-2 text-xs font-bold text-white transition hover:bg-teal-800 disabled:opacity-50">{busy ? "Please wait..." : "Check In"}</button>
                              <button onClick={() => handleCancel(appointment.id)} disabled={busy} className="rounded-xl border border-rose-200 px-3 py-2 text-xs font-bold text-rose-700 transition hover:bg-rose-50 disabled:opacity-50">Cancel</button>
                            </>
                          )}
                          {isActive && doctor?.id && (
                            <Link to={`/queue/${doctor.id}?appointmentId=${appointment.id}`} className="rounded-xl border border-teal-200 bg-teal-50 px-3 py-2 text-xs font-bold text-teal-800 transition hover:bg-teal-100">Track Queue</Link>
                          )}
                        </div>
                      </div>
                    </article>
                  );
                })
              ) : (
                <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center">
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-teal-50 text-teal-700"><CalendarIcon large /></div>
                  <h2 className="mt-4 text-lg font-bold text-slate-900">{appointments.length === 0 ? "No appointments yet" : "No appointments in this category"}</h2>
                  <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-slate-500">{appointments.length === 0 ? "Your bookings will appear here. Find a doctor to schedule your first appointment." : "Try another filter to see your appointment records."}</p>
                  {appointments.length === 0 && <Link to="/doctors" className="mt-5 inline-flex rounded-xl bg-teal-700 px-5 py-3 text-sm font-bold text-white hover:bg-teal-800">Find a Doctor</Link>}
                </div>
              )}
            </section>

            <footer className="mt-9 flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 py-5 text-xs text-slate-400">
              <span>MediFlow · Your healthcare, simplified.</span>
              <Link to="/patient/dashboard" className="font-semibold text-teal-700 hover:underline">← Back to Dashboard</Link>
            </footer>
          </div>
        </div>
      </div>
    </main>
  );
}

function Avatar({ name, color = "blue" }) {
  const colors = {
    blue: "bg-blue-500",
    violet: "bg-violet-500",
    green: "bg-emerald-500",
    pink: "bg-pink-500",
    cyan: "bg-cyan-500",
  };
  const initials = name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
  return <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-sm font-extrabold text-white shadow-sm ${colors[color]}`}>{initials || "DR"}</div>;
}

function StatusBadge({ status, className }) {
  return <span className={`whitespace-nowrap rounded-full px-3 py-1.5 text-[11px] font-extrabold ring-1 ring-inset ${className}`}>{status.replaceAll("_", " ")}</span>;
}

function HomeIcon() {
  return <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1V10Z" /></svg>;
}
function DoctorIcon() {
  return <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M6 3v5a4 4 0 0 0 8 0V3M4 3h4M12 3h4M10 12v2a4 4 0 0 0 8 0v-1" /><circle cx="18" cy="10" r="2" /></svg>;
}
function CalendarIcon({ large = false }) {
  return <svg className={large ? "h-8 w-8" : "h-5 w-5 shrink-0"} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M16 3v4M8 3v4M3 11h18" /></svg>;
}
function ClockIcon() {
  return <svg className="h-5 w-5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg>;
}
function RefreshIcon() {
  return <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 7v5h-5M4 17v-5h5" /><path d="M5.6 9A7 7 0 0 1 18 6l2 6M4 12l2 6a7 7 0 0 0 12.4-3" /></svg>;
}
function CheckIcon() {
  return <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="m5 12 4 4L19 6" /></svg>;
}
function PulseIcon() {
  return <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 12h4l3-8 4 16 3-8h4" /></svg>;
}
function HeartIcon() {
  return <svg className="h-7 w-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M20.8 8.8c0 5.2-8.8 11-8.8 11S3.2 14 3.2 8.8A4.8 4.8 0 0 1 12 6.1a4.8 4.8 0 0 1 8.8 2.7Z" /><path d="M5 12h4l2-3 2.2 6 1.8-3H19" /></svg>;
}
