import { useCallback, useEffect, useState } from "react";
import {
  Link,
  useParams,
  useSearchParams,
  useNavigate,
} from "react-router-dom";
import { apiRequest } from "../services/api";

const navigation = [
  { label: "Dashboard", to: "/patient/dashboard", icon: "▦" },
  { label: "Find Doctors", to: "/doctors", icon: "⌕" },
  { label: "My Appointments", to: "/appointments", icon: "▣" },
];

function getSavedUser() {
  try {
    return JSON.parse(localStorage.getItem("mediflow_user") || "null");
  } catch {
    return null;
  }
}

function formatTime(dateString) {
  if (!dateString) return "Not available";

  const date = new Date(dateString);

  if (Number.isNaN(date.getTime())) return "Not available";

  return date.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
    timeZone: "Asia/Kolkata",
  });
}

function formatUpdatedAt(date) {
  if (!date) return "Waiting for first update";

  return date.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
    timeZone: "Asia/Kolkata",
  });
}

function StatCard({ icon, label, value, detail, color }) {
  const styles = {
    blue: "bg-sky-50 text-sky-700 border-sky-100",
    teal: "bg-teal-50 text-teal-700 border-teal-100",
    violet: "bg-violet-50 text-violet-700 border-violet-100",
    amber: "bg-amber-50 text-amber-700 border-amber-100",
  };

  return (
    <div className="group rounded-3xl border border-slate-100 bg-white p-5 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-slate-200/60">
      <div
        className={`mb-5 flex h-12 w-12 items-center justify-center rounded-2xl border text-xl ${styles[color]}`}
      >
        {icon}
      </div>

      <p className="text-sm font-semibold text-slate-500">{label}</p>

      <p className="mt-2 text-3xl font-black tracking-tight text-slate-900">
        {value}
      </p>

      <p className="mt-2 text-xs leading-5 text-slate-400">{detail}</p>
    </div>
  );
}

function QueueStep({ number, title, description, active, completed }) {
  return (
    <div className="relative flex flex-1 items-start gap-3">
      <div
        className={`relative z-10 flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-sm font-black ${
          completed
            ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/20"
            : active
              ? "bg-teal-600 text-white shadow-lg shadow-teal-600/25"
              : "bg-slate-100 text-slate-400"
        }`}
      >
        {completed ? "✓" : number}
      </div>

      <div className="pt-1">
        <p
          className={`text-sm font-extrabold ${
            active || completed ? "text-slate-900" : "text-slate-400"
          }`}
        >
          {title}
        </p>
        <p className="mt-1 text-xs leading-5 text-slate-400">
          {description}
        </p>
      </div>
    </div>
  );
}

export default function QueueTracking() {
  const { doctorId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const appointmentId = Number(searchParams.get("appointmentId"));
  const user = getSavedUser();

  const [queueData, setQueueData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [lastUpdated, setLastUpdated] = useState(null);

  const loadQueue = useCallback(
    async (isAutomatic = false) => {
      const token = localStorage.getItem("mediflow_token");

      if (!token) {
        setError("Please sign in to track your queue.");
        setLoading(false);
        return;
      }

      if (!doctorId || !appointmentId || Number.isNaN(appointmentId)) {
        setError(
          "We couldn't identify this appointment. Please open queue tracking from My Appointments."
        );
        setLoading(false);
        return;
      }

      if (isAutomatic) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError("");

      try {
        const response = await apiRequest(`/doctors/${doctorId}/queue`, {
          token,
        });

        setQueueData(response);
        setLastUpdated(new Date());
      } catch (err) {
        setError(
          err.message || "Could not load queue information. Please try again."
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [doctorId, appointmentId]
  );

  useEffect(() => {
    loadQueue();

    const intervalId = setInterval(() => {
      loadQueue(true);
    }, 15000);

    return () => clearInterval(intervalId);
  }, [loadQueue]);

  const activeConsultation = queueData?.activeConsultation;

  const isInConsultation =
    activeConsultation?.appointmentId === appointmentId;

  const myQueueEntry = queueData?.queue?.find(
    (item) => item.appointmentId === appointmentId
  );

  const handleLogout = () => {
    localStorage.removeItem("mediflow_token");
    localStorage.removeItem("mediflow_user");
    navigate("/login");
  };

  const position = myQueueEntry?.position ?? 0;
  const estimatedWait = myQueueEntry?.estimatedWaitMins ?? 0;
  const patientsAhead = Math.max(0, position - 1);

  return (
    <div className="min-h-screen bg-[#F3F7F8] text-slate-800">
      {/* SIDEBAR */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-slate-200/70 bg-white px-5 py-7 lg:flex">
        <Link to="/" className="flex items-center gap-3 px-2">
          <span className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-teal-700 to-emerald-400 text-2xl font-black text-white shadow-lg shadow-teal-700/20">
            M
          </span>

          <span className="text-xl font-black tracking-tight text-slate-900">
            Medi<span className="text-teal-600">Flow</span>
          </span>
        </Link>

        <div className="mt-11 px-3 text-[10px] font-black uppercase tracking-[0.22em] text-slate-400">
          Workspace
        </div>

        <nav className="mt-4 space-y-2">
          {navigation.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className={`flex items-center gap-3 rounded-2xl px-4 py-3.5 text-sm font-bold transition ${
                item.label === "My Appointments"
                  ? "bg-teal-50 text-teal-700"
                  : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
              }`}
            >
              <span className="w-5 text-center text-lg">{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="mt-auto overflow-hidden rounded-3xl bg-gradient-to-br from-[#063E3A] via-[#087F75] to-[#12A795] p-5 text-white">
          <div className="mb-4 grid h-11 w-11 place-items-center rounded-2xl bg-white/15 text-xl">
            ✦
          </div>

          <p className="text-base font-black">Care, without the wait.</p>

          <p className="mt-2 text-xs leading-5 text-teal-50/80">
            Stay informed. Plan your time. Know when your turn is approaching.
          </p>

          <div className="mt-5 h-1.5 overflow-hidden rounded-full bg-white/20">
            <div className="h-full w-3/4 rounded-full bg-emerald-300" />
          </div>

          <p className="mt-2 text-[10px] font-bold uppercase tracking-widest text-teal-100/70">
            Smarter clinic experience
          </p>
        </div>
      </aside>

      <div className="lg:pl-64">
        {/* TOP NAVIGATION */}
        <header className="sticky top-0 z-20 flex h-[72px] items-center justify-between border-b border-slate-200/70 bg-white/90 px-5 backdrop-blur-xl sm:px-8">
          <div>
            <p className="text-xs font-semibold text-slate-400">
              Patient workspace
            </p>
            <p className="text-sm font-black text-slate-800">
              Live Queue Intelligence
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden text-right sm:block">
              <p className="text-sm font-bold text-slate-800">
                {user?.name || user?.fullName || "Patient"}
              </p>
              <p className="text-[11px] text-slate-400">Patient account</p>
            </div>

            <div className="grid h-10 w-10 place-items-center rounded-xl bg-teal-100 font-black text-teal-800">
              {(user?.name || user?.fullName || "P")
                .charAt(0)
                .toUpperCase()}
            </div>

            <button
              onClick={handleLogout}
              className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold text-slate-600 transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600"
            >
              Log out
            </button>
          </div>
        </header>

        <main className="mx-auto max-w-[1450px] px-5 py-6 sm:px-8 sm:py-8">
          {/* HERO */}
          <section className="relative overflow-hidden rounded-[32px] bg-[#063F3B] shadow-2xl shadow-teal-950/10">
            <div className="pointer-events-none absolute -right-24 -top-36 h-[430px] w-[430px] rounded-full border-[65px] border-white/[0.045]" />
            <div className="pointer-events-none absolute -bottom-48 right-[25%] h-[400px] w-[400px] rounded-full bg-teal-400/10 blur-3xl" />
            <div className="pointer-events-none absolute right-0 top-0 h-full w-1/2 bg-gradient-to-l from-teal-400/10 to-transparent" />

            <div className="relative grid gap-8 p-6 sm:p-9 lg:grid-cols-[1.1fr_0.9fr] lg:items-center lg:p-11">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full border border-emerald-300/20 bg-emerald-300/10 px-3.5 py-2 text-[10px] font-black tracking-[0.16em] text-emerald-200">
                  <span className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-300 opacity-70" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-300" />
                  </span>
                  LIVE CLINIC QUEUE
                </div>

                <h1 className="mt-6 max-w-xl text-4xl font-black leading-[1.08] tracking-tight text-white sm:text-5xl xl:text-6xl">
                  Your time
                  <br />
                  matters.
                  <span className="text-emerald-300"> We track it.</span>
                </h1>

                <p className="mt-5 max-w-lg text-sm leading-7 text-teal-50/75 sm:text-base">
                  No more guessing how long you need to wait. Follow your
                  position in the clinic queue and get an updated estimate as
                  consultations progress.
                </p>

                <div className="mt-7 flex flex-wrap items-center gap-3">
                  <button
                    onClick={() => loadQueue()}
                    disabled={loading || refreshing}
                    className="rounded-2xl bg-white px-5 py-3.5 text-sm font-black text-teal-900 shadow-lg transition hover:-translate-y-0.5 hover:bg-emerald-50 disabled:opacity-60"
                  >
                    {loading || refreshing ? "Updating..." : "↻ Refresh queue"}
                  </button>

                  <Link
                    to="/appointments"
                    className="rounded-2xl border border-white/20 bg-white/10 px-5 py-3.5 text-sm font-bold text-white transition hover:bg-white/20"
                  >
                    My appointments →
                  </Link>
                </div>

                <p className="mt-6 text-xs font-semibold text-teal-100/60">
                  Appointment ID: {appointmentId || "Unavailable"}
                </p>
              </div>

              {/* HERO QUEUE CARD */}
              <div className="relative">
                <div className="absolute -inset-3 rounded-[34px] bg-emerald-300/10 blur-2xl" />

                <div className="relative overflow-hidden rounded-[28px] border border-white/15 bg-white/[0.09] p-6 backdrop-blur-xl sm:p-8">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-black uppercase tracking-[0.18em] text-teal-100/70">
                      {isInConsultation
                        ? "Consultation status"
                        : "Your current position"}
                    </p>

                    <span className="rounded-full bg-emerald-300/15 px-3 py-1.5 text-[10px] font-black text-emerald-200">
                      {isInConsultation
                        ? "IN PROGRESS"
                        : myQueueEntry
                          ? "IN QUEUE"
                          : "LIVE STATUS"}
                    </span>
                  </div>

                  {loading && !queueData ? (
                    <div className="mt-8 space-y-4">
                      <div className="h-24 w-36 animate-pulse rounded-2xl bg-white/10" />
                      <div className="h-5 w-40 animate-pulse rounded bg-white/10" />
                      <div className="h-16 animate-pulse rounded-2xl bg-white/10" />
                    </div>
                  ) : isInConsultation ? (
                    <div className="mt-7">
                      <div className="grid h-20 w-20 place-items-center rounded-3xl bg-emerald-300/15 text-4xl text-emerald-200">
                        ✓
                      </div>

                      <h2 className="mt-6 text-3xl font-black text-white">
                        It's your turn!
                      </h2>

                      <p className="mt-3 text-sm leading-6 text-teal-100/70">
                        Your consultation has started. You are no longer
                        waiting in the queue.
                      </p>
                    </div>
                  ) : myQueueEntry ? (
                    <>
                      <div className="mt-7 flex items-end gap-3">
                        <span className="text-8xl font-black leading-none tracking-tighter text-white sm:text-9xl">
                          #{position}
                        </span>
                        <span className="pb-3 text-sm font-bold text-teal-100/65">
                          in the queue
                        </span>
                      </div>

                      <p className="mt-4 text-sm text-teal-100/65">
                        Your place updates as consultations are completed.
                      </p>

                      <div className="mt-7 grid grid-cols-2 gap-3">
                        <div className="rounded-2xl border border-white/10 bg-white/10 p-4">
                          <p className="text-[10px] font-bold uppercase tracking-wider text-teal-100/65">
                            Estimated wait
                          </p>
                          <p className="mt-2 text-3xl font-black text-emerald-300">
                            {estimatedWait}
                            <span className="ml-1 text-sm">min</span>
                          </p>
                        </div>

                        <div className="rounded-2xl border border-white/10 bg-white/10 p-4">
                          <p className="text-[10px] font-bold uppercase tracking-wider text-teal-100/65">
                            Patients ahead
                          </p>
                          <p className="mt-2 text-3xl font-black text-white">
                            {patientsAhead}
                          </p>
                        </div>
                      </div>

                      <div className="mt-3 flex items-center justify-between rounded-2xl bg-emerald-300 px-4 py-4 text-[#063F3B]">
                        <div>
                          <p className="text-[10px] font-black uppercase tracking-wider opacity-70">
                            Estimated consultation
                          </p>
                          <p className="mt-1 text-xl font-black">
                            {formatTime(myQueueEntry.estimatedStartAt)}
                          </p>
                        </div>
                        <span className="text-2xl">◷</span>
                      </div>
                    </>
                  ) : (
                    <div className="mt-7">
                      <div className="grid h-16 w-16 place-items-center rounded-2xl bg-amber-300/15 text-3xl text-amber-200">
                        !
                      </div>

                      <h2 className="mt-5 text-2xl font-black text-white">
                        Queue status unavailable
                      </h2>

                      <p className="mt-3 text-sm leading-6 text-teal-100/70">
                        Your appointment may not have been checked in yet, or
                        its status may have changed.
                      </p>
                    </div>
                  )}

                  <div className="mt-6 flex items-center justify-between border-t border-white/10 pt-4 text-xs text-teal-100/60">
                    <span>Last synced</span>
                    <span className="font-bold text-white">
                      {formatUpdatedAt(lastUpdated)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* LIVE SYNC STATUS */}
          <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
              <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
              Automatically refreshes every 15 seconds
            </div>

            <div className="text-xs font-medium text-slate-400">
              {refreshing
                ? "Checking for updates..."
                : `Last updated: ${formatUpdatedAt(lastUpdated)}`}
            </div>
          </div>

          {/* ERROR */}
          {error && (
            <div className="mt-6 flex flex-col gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-5 text-rose-800 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm font-semibold">{error}</p>

              <button
                onClick={() => loadQueue()}
                className="rounded-xl bg-rose-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-rose-700"
              >
                Try again
              </button>
            </div>
          )}

          {/* LOADING */}
          {loading && !queueData && (
            <div className="mt-8 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {[1, 2, 3].map((item) => (
                <div
                  key={item}
                  className="h-44 animate-pulse rounded-3xl bg-white shadow-sm"
                />
              ))}
            </div>
          )}

          {!loading && !error && queueData && (
            <div className="mt-8 space-y-8">
              {/* QUEUE JOURNEY */}
              <section className="rounded-[28px] border border-slate-100 bg-white p-6 shadow-sm sm:p-8">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-teal-700">
                      Your appointment journey
                    </p>
                    <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-900">
                      Every step, in view.
                    </h2>
                    <p className="mt-2 text-sm text-slate-500">
                      See where you are in your clinic visit.
                    </p>
                  </div>

                  <span className="rounded-xl bg-teal-50 px-3 py-2 text-xs font-bold text-teal-700">
                    Live journey
                  </span>
                </div>

                <div className="mt-8 grid gap-6 md:grid-cols-3">
                  <QueueStep
                    number="01"
                    title="Appointment booked"
                    description="Your appointment is registered."
                    completed
                  />

                  <QueueStep
                    number="02"
                    title="Waiting in queue"
                    description={
                      isInConsultation
                        ? "You have moved through the queue."
                        : myQueueEntry
                          ? "Your queue position is being tracked."
                          : "Waiting for check-in or queue entry."
                    }
                    active={!!myQueueEntry && !isInConsultation}
                    completed={isInConsultation}
                  />

                  <QueueStep
                    number="03"
                    title="Consultation"
                    description={
                      isInConsultation
                        ? "Your consultation is in progress."
                        : "Your turn with the doctor."
                    }
                    active={isInConsultation}
                  />
                </div>

                <div className="mt-8 h-2 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className={`h-full rounded-full transition-all duration-700 ${
                      isInConsultation
                        ? "w-full bg-gradient-to-r from-teal-500 to-emerald-400"
                        : myQueueEntry
                          ? "w-2/3 bg-gradient-to-r from-teal-500 to-emerald-400"
                          : "w-1/3 bg-gradient-to-r from-teal-500 to-emerald-400"
                    }`}
                  />
                </div>
              </section>

              {/* CLINIC OVERVIEW */}
              <section>
                <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-teal-700">
                      Live clinic insights
                    </p>
                    <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-900">
                      The clinic at a glance.
                    </h2>
                  </div>

                  <span className="rounded-full bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-700">
                    ● Live information
                  </span>
                </div>

                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  <StatCard
                    icon="♙"
                    label="Patients waiting"
                    value={queueData.waitingCount ?? 0}
                    detail="Currently in the waiting queue"
                    color="blue"
                  />

                  <StatCard
                    icon="◷"
                    label="Average consultation"
                    value={`${queueData.averageConsultationMins ?? "—"} min`}
                    detail="Average time per consultation"
                    color="teal"
                  />

                  <StatCard
                    icon="✚"
                    label="Doctor's availability"
                    value={activeConsultation ? "Busy" : "Available"}
                    detail={
                      activeConsultation
                        ? "A consultation is in progress"
                        : "No active consultation reported"
                    }
                    color="violet"
                  />
                </div>
              </section>

              {/* ACTIVE CONSULTATION */}
              {activeConsultation && (
                <section className="relative overflow-hidden rounded-[28px] border border-violet-100 bg-gradient-to-r from-violet-950 to-indigo-900 p-6 text-white shadow-lg shadow-violet-900/10 sm:p-8">
                  <div className="pointer-events-none absolute -right-10 -top-20 h-64 w-64 rounded-full border-[35px] border-white/5" />

                  <div className="relative flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
                    <div>
                      <span className="rounded-full bg-violet-400/20 px-3 py-1.5 text-[10px] font-black uppercase tracking-wider text-violet-200">
                        Consultation in progress
                      </span>

                      <h3 className="mt-4 text-2xl font-black">
                        The clinic is moving.
                      </h3>

                      <p className="mt-2 max-w-lg text-sm leading-6 text-violet-200/80">
                        An active consultation is currently taking place.
                        This estimate helps you understand the clinic's
                        progress.
                      </p>
                    </div>

                    <div className="rounded-3xl border border-white/10 bg-white/10 px-7 py-5 text-center backdrop-blur">
                      <p className="text-[10px] font-black uppercase tracking-wider text-violet-200">
                        Estimated remaining
                      </p>

                      <p className="mt-2 text-4xl font-black">
                        {activeConsultation.estimatedRemainingMins}
                        <span className="ml-1 text-base">min</span>
                      </p>
                    </div>
                  </div>
                </section>
              )}

              {/* ESTIMATE INFORMATION */}
              <section className="rounded-[26px] border border-sky-100 bg-gradient-to-r from-sky-50 to-white p-6 sm:p-7">
                <div className="flex items-start gap-4">
                  <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-sky-100 text-xl text-sky-700">
                    ⓘ
                  </div>

                  <div>
                    <h3 className="text-base font-black text-slate-900">
                      How reliable is your waiting-time estimate?
                    </h3>

                    <p className="mt-2 text-sm leading-6 text-slate-600">
                      {queueData.estimateNote ||
                        "Waiting times are estimates and may change as consultations progress. Please use the latest update as a guide, not a guaranteed start time."}
                    </p>

                    <p className="mt-3 text-xs font-bold text-sky-700">
                      Estimates update as the clinic queue changes.
                    </p>
                  </div>
                </div>
              </section>
            </div>
          )}

          {/* FOOTER LINKS */}
          <div className="mt-10 flex flex-wrap gap-5 border-t border-slate-200 pt-6">
            <Link
              to="/patient/dashboard"
              className="text-sm font-bold text-teal-700 transition hover:text-teal-900"
            >
              ← Back to dashboard
            </Link>

            <Link
              to="/appointments"
              className="text-sm font-bold text-slate-500 transition hover:text-slate-900"
            >
              My appointments
            </Link>
          </div>
        </main>
      </div>
    </div>
  );
}