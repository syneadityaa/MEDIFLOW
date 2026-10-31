import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { apiRequest } from "../services/api";

function formatDate(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Date unavailable";
  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "Asia/Kolkata",
  });
}

function formatTime(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Time unavailable";
  return date.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
    timeZone: "Asia/Kolkata",
  });
}

function statusClasses(status) {
  switch (status) {
    case "BOOKED":
      return "bg-blue-100 text-blue-700";
    case "CHECKED_IN":
      return "bg-amber-100 text-amber-800";
    case "IN_CONSULTATION":
      return "bg-violet-100 text-violet-700";
    case "DONE":
      return "bg-emerald-100 text-emerald-700";
    case "CANCELLED":
      return "bg-rose-100 text-rose-700";
    case "NO_SHOW":
      return "bg-slate-200 text-slate-700";
    default:
      return "bg-slate-100 text-slate-700";
  }
}

function Icon({ name, className = "h-5 w-5" }) {
  const common = {
    className,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    "aria-hidden": true,
  };

  const paths = {
    home: <><path d="m3 10 9-7 9 7" /><path d="M5 9v11h14V9M9 20v-6h6v6" /></>,
    doctor: <><path d="M8 3v5a4 4 0 0 0 8 0V3" /><path d="M6 3h4M14 3h4M12 12v2a4 4 0 0 0 8 0v-1" /><circle cx="20" cy="11" r="1" /></>,
    calendar: <><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M16 3v4M8 3v4M3 11h18M8 15h3" /></>,
    clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
    check: <path d="m5 12 4 4L19 6" />,
    activity: <path d="M3 12h4l3-8 4 16 3-8h4" />,
    arrow: <><path d="M5 12h14M13 6l6 6-6 6" /></>,
    search: <><circle cx="10.8" cy="10.8" r="6.8" /><path d="m16 16 5 5" /></>,
    queue: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
  };

  return <svg {...common}>{paths[name]}</svg>;
}

function StatCard({ title, value, subtitle, tone, icon }) {
  const tones = {
    blue: "border-blue-100 bg-gradient-to-br from-blue-50 to-sky-100 text-blue-700",
    green: "border-emerald-100 bg-gradient-to-br from-emerald-50 to-teal-100 text-emerald-700",
    purple: "border-violet-100 bg-gradient-to-br from-violet-50 to-purple-100 text-violet-700",
    orange: "border-orange-100 bg-gradient-to-br from-orange-50 to-amber-100 text-orange-700",
  };

  return (
    <div className={`rounded-xl border p-3 shadow-sm transition hover:-translate-y-1 hover:shadow-md ${tones[tone]}`}>
      <div className="flex items-center justify-between gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/80 shadow-sm">
          <Icon name={icon} className="h-5 w-5" />
        </div>
        <Icon name="arrow" className="h-5 w-5 opacity-70" />
      </div>
      <p className="mt-2 text-xs font-semibold">{title}</p>
      <p className="mt-0.5 text-2xl font-extrabold text-slate-900">{value}</p>
      <p className="mt-0.5 text-[10px] text-slate-500">{subtitle}</p>
    </div>
  );
}

export default function PatientDashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [doctorSearch, setDoctorSearch] = useState("");

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
      setError(err.message || "Could not load your appointments.");
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
        navigate(parsedUser.role === "DOCTOR" ? "/doctor/dashboard" : "/login", { replace: true });
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

  const sortedAppointments = useMemo(() => [...appointments].sort((a, b) => {
    return new Date(a.slot?.startsAt || 0) - new Date(b.slot?.startsAt || 0);
  }), [appointments]);

  const stats = useMemo(() => ({
    total: appointments.length,
    upcoming: appointments.filter((a) => ["BOOKED", "CHECKED_IN"].includes(a.status)).length,
    completed: appointments.filter((a) => a.status === "DONE").length,
    active: appointments.filter((a) => ["CHECKED_IN", "IN_CONSULTATION"].includes(a.status)).length,
  }), [appointments]);

  const nextAppointment = useMemo(() => {
    const inConsultation = sortedAppointments.find((a) => a.status === "IN_CONSULTATION");
    if (inConsultation) return inConsultation;
    const now = new Date();
    return sortedAppointments.find((a) => {
      const start = new Date(a.slot?.startsAt);
      return ["BOOKED", "CHECKED_IN"].includes(a.status) && !Number.isNaN(start.getTime()) && start >= now;
    }) || null;
  }, [sortedAppointments]);

  const recentAppointments = useMemo(() => [...appointments]
    .sort((a, b) => new Date(b.slot?.startsAt || 0) - new Date(a.slot?.startsAt || 0))
    .slice(0, 4), [appointments]);

  function handleLogout() {
    localStorage.removeItem("mediflow_token");
    localStorage.removeItem("mediflow_user");
    navigate("/login", { replace: true });
  }

  function searchDoctors(event) {
    event.preventDefault();
    navigate(doctorSearch.trim() ? `/doctors?search=${encodeURIComponent(doctorSearch.trim())}` : "/doctors");
  }

  if (!user) {
    return <main className="flex min-h-screen items-center justify-center bg-[#F4F9FC]"><p className="text-sm font-medium text-slate-500">Preparing your dashboard...</p></main>;
  }

  const firstName = user.name?.trim().split(/\s+/)[0] || "there";

  return (
    <main className="h-screen overflow-hidden bg-[#F4F9FC] text-slate-800">
      <div className="flex h-screen overflow-hidden">
        {/* Sidebar */}
        <aside className="hidden w-60 shrink-0 flex-col border-r border-sky-100 bg-white px-5 py-6 lg:flex">
          <Link to="/" className="flex items-center gap-3 px-1">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-teal-700 text-2xl font-bold text-white">M</span>
            <span className="text-[25px] font-extrabold tracking-tight text-slate-900">Medi<span className="text-teal-700">Flow</span></span>
          </Link>

          <nav className="mt-12 space-y-2">
            <Link to="/patient/dashboard" className="flex items-center gap-4 rounded-xl bg-teal-50 px-4 py-3.5 font-semibold text-teal-800">
              <Icon name="home" /> Dashboard
            </Link>
            <Link to="/doctors" className="flex items-center gap-4 rounded-xl px-4 py-3.5 font-medium text-slate-600 transition hover:bg-slate-50 hover:text-teal-700">
              <Icon name="doctor" /> Find Doctors
            </Link>
            <Link to="/appointments" className="flex items-center gap-4 rounded-xl px-4 py-3.5 font-medium text-slate-600 transition hover:bg-slate-50 hover:text-teal-700">
              <Icon name="calendar" /> My Appointments
            </Link>
          </nav>

          <div className="mt-auto rounded-2xl bg-gradient-to-br from-teal-50 to-cyan-50 p-4 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-teal-200 bg-white text-teal-700">
              <Icon name="activity" className="h-9 w-9" />
            </div>
            <p className="mt-4 font-bold text-slate-800">Your health matters</p>
            <p className="mt-2 text-xs leading-5 text-slate-500">We're here to support your wellness journey.</p>
          </div>
        </aside>

        {/* Main dashboard */}
        <div className="min-w-0 flex-1">
          <header className="sticky top-0 z-20 flex h-16 shrink-0 items-center justify-between gap-4 border-b border-sky-100 bg-white/95 px-5 backdrop-blur md:px-8">
            <Link to="/" className="flex items-center gap-2 lg:hidden">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-700 text-xl font-bold text-white">M</span>
              <span className="text-xl font-extrabold text-slate-900">Medi<span className="text-teal-700">Flow</span></span>
            </Link>
            <form onSubmit={searchDoctors} className="hidden max-w-xl flex-1 items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm md:flex">
              <Icon name="search" className="h-5 w-5 text-slate-400" />
              <input value={doctorSearch} onChange={(e) => setDoctorSearch(e.target.value)} placeholder="Search doctors, specialties..." className="w-full bg-transparent text-sm outline-none placeholder:text-slate-400" aria-label="Search doctors or specialties" />
            </form>
            <div className="ml-auto flex items-center gap-3 sm:gap-4">
              <div className="hidden text-right sm:block">
                <p className="text-sm font-bold text-slate-800">{user.name || "Patient"}</p>
                <p className="text-xs text-slate-400">Patient</p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 font-bold text-teal-800">{(user.name || "P").charAt(0).toUpperCase()}</div>
              <button onClick={handleLogout} className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-700">Logout</button>
            </div>
          </header>

          <div className="mx-auto flex h-[calc(100vh-64px)] max-w-[1600px] flex-col gap-3 overflow-y-auto p-4 md:p-5 lg:overflow-hidden xl:p-5">
            {/* Welcome hero */}
            <section className="relative min-h-[138px] shrink-0 overflow-hidden rounded-2xl bg-gradient-to-r from-[#087C78] via-[#079B91] to-[#20B6A5] px-6 py-4 text-white shadow-lg shadow-teal-900/10 md:px-8 md:py-5">
              <div className="absolute -right-12 -top-28 h-80 w-80 rounded-full border-[35px] border-white/10" />
              <div className="absolute right-44 top-8 h-48 w-48 rounded-full bg-white/10 blur-3xl" />
              <div className="relative z-10 max-w-[620px]">
                <p className="text-xs font-bold tracking-[0.2em] text-teal-50">PATIENT PORTAL</p>
                <h1 className="mt-1.5 text-2xl font-extrabold tracking-tight md:text-3xl">Welcome, {firstName}!</h1>
                <p className="mt-1.5 max-w-xl text-xs leading-5 text-white/95 md:text-sm">Your healthcare, all in one place. Manage your appointments, find doctors and stay updated on your clinic queue.</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Link to="/doctors" className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2 text-xs font-bold text-teal-800 shadow-sm transition hover:-translate-y-0.5 hover:bg-teal-50"><Icon name="calendar" className="h-4 w-4" /> Book an appointment</Link>
                  <Link to="/doctors" className="inline-flex items-center gap-2 rounded-xl border border-white/60 bg-white/5 px-4 py-2 text-xs font-semibold text-white transition hover:bg-white/15"><Icon name="doctor" className="h-4 w-4" /> Find doctors</Link>
                </div>
              </div>
              <div className="pointer-events-none absolute bottom-0 right-8 hidden h-48 w-48 items-center justify-center rounded-t-full border border-white/15 bg-white/10 lg:flex">
                <div className="flex h-32 w-32 items-center justify-center rounded-full bg-white/10"><Icon name="doctor" className="h-20 w-20 text-white/90" /></div>
              </div>
            </section>

            {/* Stats */}
            <section className="grid shrink-0 grid-cols-4 gap-3">
              <StatCard title="Total Appointments" value={loading ? "—" : stats.total} subtitle="All your appointments" tone="blue" icon="calendar" />
              <StatCard title="Upcoming" value={loading ? "—" : stats.upcoming} subtitle="Next scheduled visits" tone="green" icon="clock" />
              <StatCard title="Completed" value={loading ? "—" : stats.completed} subtitle="Past consultations" tone="purple" icon="check" />
              <StatCard title="Active Visits" value={loading ? "—" : stats.active} subtitle="Currently in queue / consultation" tone="orange" icon="activity" />
            </section>

            {error && <div role="alert" className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700"><span>{error}</span><button onClick={loadAppointments} className="font-bold underline">Try again</button></div>}

            {/* Next appointment and quick actions */}
            <section className="grid min-h-0 flex-1 items-stretch gap-4 overflow-hidden xl:grid-cols-5">
              <div className="flex min-h-0 flex-col xl:col-span-3">
                <div className="mb-2 flex shrink-0 items-center justify-between">
                  <h2 className="text-lg font-extrabold text-slate-900">Next appointment</h2>
                  <Link to="/appointments" className="text-sm font-semibold text-teal-700 hover:underline">View all →</Link>
                </div>
                <div className="shrink-0 rounded-2xl border border-sky-100 bg-white p-3 shadow-sm md:p-4">
                  {loading ? <p className="py-12 text-center text-sm text-slate-400">Loading your next appointment...</p> : nextAppointment ? (
                    <>
                      <div className="flex items-center justify-between gap-3">
                        <span className="rounded-full bg-teal-50 px-3 py-1.5 text-[11px] font-bold uppercase tracking-wide text-teal-700">Next appointment</span>
                        <span className={`rounded-full px-3 py-1.5 text-[11px] font-bold ${statusClasses(nextAppointment.status)}`}>{nextAppointment.status.replaceAll("_", " ")}</span>
                      </div>
                      <div className="mt-3 grid gap-3 md:grid-cols-[1.1fr_1fr] md:items-center">
                        <div className="flex items-center gap-4">
                          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-teal-100 to-cyan-50 text-xl font-extrabold text-teal-800 ring-4 ring-teal-50">{(nextAppointment.slot?.doctor?.user?.name || "D").replace(/^Dr\.?\s*/i, "").charAt(0).toUpperCase()}</div>
                          <div className="min-w-0">
                            <h3 className="truncate text-lg font-extrabold text-slate-900">{nextAppointment.slot?.doctor?.user?.name || "Doctor"}</h3>
                            <p className="mt-1 text-sm font-semibold text-teal-700">{nextAppointment.slot?.doctor?.specialty?.name || "Specialist"}</p>
                            <p className="mt-1 text-xs text-slate-400">Appointment #{nextAppointment.id}</p>
                          </div>
                        </div>
                        <div className="space-y-3 border-t border-slate-100 pt-4 md:border-l md:border-t-0 md:pl-5 md:pt-0">
                          <div className="flex items-start gap-3"><Icon name="calendar" className="mt-0.5 h-4 w-4 text-teal-700" /><div><p className="text-sm font-semibold text-slate-800">{formatDate(nextAppointment.slot?.startsAt)}</p><p className="text-xs text-slate-500">Appointment date</p></div></div>
                          <div className="flex items-start gap-3"><Icon name="clock" className="mt-0.5 h-4 w-4 text-teal-700" /><div><p className="text-sm font-semibold text-slate-800">{formatTime(nextAppointment.slot?.startsAt)} – {formatTime(nextAppointment.slot?.endsAt)}</p><p className="text-xs text-slate-500">Appointment time</p></div></div>
                        </div>
                      </div>
                      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-xl bg-gradient-to-r from-teal-50 to-cyan-50 p-2.5">
                        <div className="flex items-center gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-full bg-teal-700 text-white"><Icon name="queue" /></span><div><p className="text-sm font-bold text-teal-900">Live queue tracking available</p><p className="mt-0.5 text-xs text-slate-500">Check your position and estimated waiting time.</p></div></div>
                        {nextAppointment.slot?.doctor?.id && <Link to={`/queue/${nextAppointment.slot.doctor.id}?appointmentId=${nextAppointment.id}`} className="inline-flex items-center gap-2 rounded-xl bg-teal-700 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-teal-800">View queue <Icon name="arrow" className="h-4 w-4" /></Link>}
                      </div>
                    </>
                  ) : (
                    <div className="flex min-h-[220px] flex-col items-center justify-center text-center"><span className="flex h-14 w-14 items-center justify-center rounded-full bg-teal-50 text-teal-700"><Icon name="calendar" className="h-7 w-7" /></span><h3 className="mt-4 font-bold text-slate-900">No upcoming appointments</h3><p className="mt-1 max-w-sm text-sm text-slate-500">Book a doctor to see your next appointment here.</p><Link to="/doctors" className="mt-4 rounded-xl bg-teal-700 px-4 py-2.5 text-sm font-bold text-white hover:bg-teal-800">Find a doctor</Link></div>
                  )}
                </div>

                {/* Recent appointments */}
                <div className="mb-2 mt-3 flex shrink-0 items-center justify-between gap-3">
                  <h2 className="text-lg font-extrabold text-slate-900">Recent appointments</h2>
                  <Link to="/appointments" className="text-sm font-semibold text-teal-700 hover:underline">View all →</Link>
                </div>
                {loading ? <div className="rounded-2xl border border-sky-100 bg-white p-6 text-sm text-slate-400">Loading appointment history...</div> : recentAppointments.length ? (
                  <div className="grid grid-cols-4 gap-2">
                    {recentAppointments.map((appointment, index) => {
                      const palette = [
                        "border-blue-200 bg-gradient-to-br from-blue-50 to-sky-100",
                        "border-orange-200 bg-gradient-to-br from-orange-50 to-amber-100",
                        "border-violet-200 bg-gradient-to-br from-violet-50 to-purple-100",
                        "border-teal-200 bg-gradient-to-br from-teal-50 to-emerald-100",
                      ][index % 4];
                      const doctorName = appointment.slot?.doctor?.user?.name || "Doctor";
                      return (
                        <article key={appointment.id} className={`rounded-xl border p-2.5 shadow-sm transition hover:-translate-y-1 hover:shadow-md ${palette}`}>
                          <div className="flex items-center gap-3">
                            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border-2 border-white bg-white/80 text-sm font-extrabold text-teal-800 shadow-sm">{doctorName.replace(/^Dr\.?\s*/i, "").charAt(0).toUpperCase()}</div>
                            <div className="min-w-0"><h3 className="truncate text-sm font-extrabold text-slate-900">{doctorName}</h3><p className="truncate text-xs text-slate-600">{appointment.slot?.doctor?.specialty?.name || "Specialist"}</p></div>
                          </div>
                          <div className="mt-2 space-y-1 text-[10px] text-slate-600">
                            <p className="flex items-center gap-2"><Icon name="calendar" className="h-4 w-4" />{formatDate(appointment.slot?.startsAt)}</p>
                            <p className="flex items-center gap-2"><Icon name="clock" className="h-4 w-4" />{formatTime(appointment.slot?.startsAt)} – {formatTime(appointment.slot?.endsAt)}</p>
                          </div>
                          <div className="mt-2 flex items-center justify-between gap-2"><span className={`rounded-full px-3 py-1.5 text-[10px] font-extrabold ${statusClasses(appointment.status)}`}>{appointment.status.replaceAll("_", " ")}</span><Link to="/appointments" aria-label={`View appointment ${appointment.id}`} className="flex h-8 w-8 items-center justify-center rounded-full bg-white/80 text-teal-700 shadow-sm transition hover:bg-white"><Icon name="arrow" className="h-4 w-4" /></Link></div>
                        </article>
                      );
                    })}
                  </div>
                ) : <div className="rounded-2xl border border-sky-100 bg-white p-6 text-sm text-slate-500">No appointment records yet. Your bookings will appear here.</div>}
              </div>

              {/* Quick actions */}
              <aside className="min-h-0 overflow-hidden rounded-2xl border border-sky-100 bg-white/70 p-4 shadow-sm xl:col-span-2">
                <p className="text-xs font-extrabold tracking-[0.16em] text-teal-700">QUICK ACTIONS</p>
                <h2 className="mt-2 text-lg font-extrabold text-slate-900">What would you like to do?</h2>
                <div className="mt-3 space-y-2">
                  <Link to="/doctors" className="group flex items-center gap-3 rounded-xl border border-sky-100 bg-white p-3 shadow-sm transition hover:-translate-y-0.5 hover:border-teal-200 hover:shadow-md"><span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-teal-50 text-teal-700"><Icon name="doctor" className="h-6 w-6" /></span><span className="min-w-0 flex-1"><span className="block text-sm font-extrabold text-slate-900">Find a doctor</span><span className="mt-1 block text-xs text-slate-500">Explore specialists and available slots.</span></span><Icon name="arrow" className="h-4 w-4 text-slate-400 transition group-hover:translate-x-1 group-hover:text-teal-700" /></Link>
                  <Link to="/appointments" className="group flex items-center gap-3 rounded-xl border border-sky-100 bg-white p-3 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md"><span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-700"><Icon name="calendar" className="h-6 w-6" /></span><span className="min-w-0 flex-1"><span className="block text-sm font-extrabold text-slate-900">My appointments</span><span className="mt-1 block text-xs text-slate-500">View bookings and manage your visits.</span></span><Icon name="arrow" className="h-4 w-4 text-slate-400 transition group-hover:translate-x-1 group-hover:text-blue-700" /></Link>
                  <Link to={nextAppointment?.slot?.doctor?.id ? `/queue/${nextAppointment.slot.doctor.id}?appointmentId=${nextAppointment.id}` : "/appointments"} className="group relative block overflow-hidden rounded-xl bg-gradient-to-r from-[#087C78] to-[#079B91] p-3 text-white shadow-sm transition hover:shadow-md"><div className="absolute -right-5 -top-8 h-28 w-28 rounded-full bg-white/10" /><div className="relative flex items-center gap-3"><span className="flex h-11 w-11 items-center justify-center rounded-full bg-white/15"><Icon name="queue" className="h-6 w-6" /></span><span className="flex-1"><span className="block text-sm font-extrabold">Live queue tracking</span><span className="mt-1 block text-xs text-teal-50">Stay informed about your clinic visit.</span></span><Icon name="arrow" className="h-4 w-4" /></div><p className="relative mt-3 text-xs leading-5 text-teal-50">Track your queue position and estimated waiting time for an active appointment.</p></Link>
                </div>
              </aside>
            </section>

            <footer className="mt-auto shrink-0 border-t border-sky-100 pt-2 text-[10px] text-slate-400">© MediFlow · Your healthcare, simplified.</footer>
          </div>
        </div>
      </div>
    </main>
  );
}
