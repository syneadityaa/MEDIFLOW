import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { apiRequest } from "../services/api";

function formatDate(dateString) {
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return "Date unavailable";

  return date.toLocaleDateString("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
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

function getSavedUser() {
  try {
    return JSON.parse(localStorage.getItem("mediflow_user") || "null");
  } catch {
    return null;
  }
}

function LockIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-7 w-7" aria-hidden="true">
      <rect x="4.5" y="10" width="15" height="11" rx="2.5" stroke="currentColor" strokeWidth="1.8" />
      <path d="M8 10V7a4 4 0 1 1 8 0v3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M12 14.5v2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

export default function Slots() {
  const { doctorId } = useParams();
  const navigate = useNavigate();

  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [bookingSlotId, setBookingSlotId] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loginModalOpen, setLoginModalOpen] = useState(false);
  const [selectedSlotId, setSelectedSlotId] = useState(null);

  const user = getSavedUser();

  const loadSlots = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await apiRequest(`/doctors/${doctorId}/slots`);
      setSlots(response.data ?? []);
    } catch (err) {
      setError(err.message || "Could not load appointment slots.");
    } finally {
      setLoading(false);
    }
  }, [doctorId]);

  useEffect(() => {
    loadSlots();
  }, [loadSlots]);

  async function handleBooking(slotId) {
    const token = localStorage.getItem("mediflow_token");
    const currentUser = getSavedUser();

    setError("");
    setSuccess("");

    if (!token || !currentUser) {
      setSelectedSlotId(slotId);
      setLoginModalOpen(true);
      return;
    }

    if (currentUser.role !== "PATIENT") {
      setError("Only patient accounts can book appointments.");
      return;
    }

    setBookingSlotId(slotId);

    try {
      const response = await apiRequest("/appointments", {
        method: "POST",
        token,
        body: JSON.stringify({ slotId }),
      });

      setSuccess(response.message || "Appointment booked successfully!");
      setSlots((currentSlots) =>
        currentSlots.filter((slot) => slot.id !== slotId)
      );
    } catch (err) {
      setError(err.message || "Could not book this appointment.");
    } finally {
      setBookingSlotId(null);
    }
  }

  function continueToLogin() {
    setLoginModalOpen(false);
    navigate("/login", {
      state: {
        message: "Please sign in to your patient account to book an appointment.",
        from: `/doctors/${doctorId}/slots`,
        slotId: selectedSlotId,
      },
    });
  }

  function handleLogout() {
    localStorage.removeItem("mediflow_token");
    localStorage.removeItem("mediflow_user");
    navigate("/login", { replace: true });
  }

  const bookedCount = slots.length;
  const initials = (user?.name || "Patient")
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();

  return (
    <div className="min-h-screen bg-[#F4F7FA] text-slate-900">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-[250px] flex-col border-r border-slate-200 bg-white px-5 py-7 lg:flex">
        <Link to="/" className="flex items-center gap-3 px-2">
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-teal-700 text-xl font-black text-white shadow-lg shadow-teal-900/15">M</span>
          <span className="text-2xl font-extrabold tracking-tight">Medi<span className="text-teal-700">Flow</span></span>
        </Link>

        <p className="mb-3 mt-12 px-3 text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400">Workspace</p>
        <nav className="space-y-2">
          <Link to="/patient/dashboard" className="flex items-center gap-3 rounded-xl px-4 py-3 font-semibold text-slate-500 transition hover:bg-slate-50 hover:text-slate-900"><span className="text-lg">⌂</span> Dashboard</Link>
          <Link to="/doctors" className="flex items-center gap-3 rounded-xl bg-teal-50 px-4 py-3 font-bold text-teal-800"><span className="text-lg">✚</span> Find Doctors</Link>
          <Link to="/appointments" className="flex items-center gap-3 rounded-xl px-4 py-3 font-semibold text-slate-500 transition hover:bg-slate-50 hover:text-slate-900"><span className="text-lg">▣</span> My Appointments</Link>
        </nav>

        <div className="mt-auto rounded-2xl bg-gradient-to-br from-[#064E48] to-[#0B8275] p-5 text-white">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/15 text-xl">♡</div>
          <p className="mt-4 font-bold">Your care, made simpler.</p>
          <p className="mt-1 text-xs leading-5 text-teal-50">Choose a convenient time and stay informed about your clinic queue.</p>
        </div>
      </aside>

      <div className="min-h-screen lg:ml-[250px]">
        <header className="sticky top-0 z-20 border-b border-slate-200/80 bg-white/95 backdrop-blur">
          <div className="mx-auto flex max-w-[1450px] items-center justify-between px-5 py-4 sm:px-8">
            <div className="lg:hidden"><Link to="/" className="text-xl font-extrabold tracking-tight">Medi<span className="text-teal-700">Flow</span></Link></div>
            <div className="hidden lg:block">
              <p className="text-sm font-semibold text-slate-500">Patient portal</p>
              <p className="text-xs text-slate-400">Choose your appointment time</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="hidden text-right sm:block">
                <p className="text-sm font-bold text-slate-800">{user?.name || "Patient"}</p>
                <p className="text-xs text-slate-400">Patient account</p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-teal-100 font-bold text-teal-800">{initials}</div>
              <button type="button" onClick={handleLogout} className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-700">Logout</button>
            </div>
          </div>
          <nav className="flex gap-2 overflow-x-auto border-t border-slate-100 px-5 py-2 lg:hidden">
            <Link to="/patient/dashboard" className="whitespace-nowrap rounded-lg px-3 py-2 text-sm font-semibold text-slate-500">Dashboard</Link>
            <Link to="/doctors" className="whitespace-nowrap rounded-lg bg-teal-50 px-3 py-2 text-sm font-bold text-teal-800">Find Doctors</Link>
            <Link to="/appointments" className="whitespace-nowrap rounded-lg px-3 py-2 text-sm font-semibold text-slate-500">My Appointments</Link>
          </nav>
        </header>

        <main className="mx-auto max-w-[1200px] px-5 py-7 sm:px-8 sm:py-9">
          <Link to="/doctors" className="inline-flex items-center gap-2 text-sm font-semibold text-teal-700 transition hover:text-teal-900">← Back to doctors</Link>

          <section className="relative mt-6 overflow-hidden rounded-[28px] bg-gradient-to-r from-[#064E48] via-[#08796F] to-[#12A795] px-7 py-8 text-white shadow-xl shadow-teal-900/10 sm:px-10 sm:py-10">
            <div className="pointer-events-none absolute -right-16 -top-28 h-80 w-80 rounded-full border-[35px] border-white/10" />
            <div className="pointer-events-none absolute -bottom-32 right-44 h-64 w-64 rounded-full bg-white/5" />
            <div className="relative max-w-2xl">
              <p className="text-xs font-bold uppercase tracking-[0.22em] text-teal-100">MediFlow appointments</p>
              <h1 className="mt-3 text-3xl font-extrabold tracking-tight sm:text-4xl">Available appointment slots</h1>
              <p className="mt-3 max-w-xl text-sm leading-6 text-teal-50 sm:text-base">Choose a time that works for you. Once booked, you can check in and follow your clinic queue from My Appointments.</p>
            </div>
            <div className="relative mt-7 flex flex-wrap gap-3 text-xs font-semibold text-white/90">
              <span className="rounded-full border border-white/20 bg-white/10 px-4 py-2">Simple booking</span>
              <span className="rounded-full border border-white/20 bg-white/10 px-4 py-2">Live queue updates</span>
            </div>
          </section>

          <section className="mt-8">
            <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-teal-700">Choose your time</p>
                <h2 className="mt-2 text-2xl font-extrabold tracking-tight text-slate-900">Upcoming availability</h2>
                <p className="mt-1 text-sm text-slate-500">Select an available slot to continue with your booking.</p>
              </div>
              <span className="w-fit rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 shadow-sm">
                {loading ? "Loading slots…" : `${bookedCount} ${bookedCount === 1 ? "slot" : "slots"} available`}
              </span>
            </div>

            {success && (
              <div role="status" className="mt-6 flex flex-col justify-between gap-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-5 sm:flex-row sm:items-center">
                <div>
                  <p className="font-bold text-emerald-900">{success}</p>
                  <p className="mt-1 text-sm text-emerald-800">Your appointment has been created successfully.</p>
                </div>
                <Link to="/appointments" className="w-fit rounded-xl bg-emerald-700 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-emerald-800">View my appointments →</Link>
              </div>
            )}

            {error && (
              <div role="alert" className="mt-6 rounded-2xl border border-rose-200 bg-rose-50 p-5 text-sm text-rose-700">
                <p className="font-bold">Something went wrong</p>
                <p className="mt-1">{error}</p>
                <button type="button" onClick={loadSlots} className="mt-3 font-bold underline">Reload slots</button>
              </div>
            )}

            {loading && (
              <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {[1, 2, 3].map((item) => <div key={item} className="animate-pulse rounded-3xl border border-slate-200 bg-white p-6"><div className="h-4 w-32 rounded bg-slate-100" /><div className="mt-5 h-7 w-40 rounded bg-slate-100" /><div className="mt-3 h-4 w-24 rounded bg-slate-100" /><div className="mt-7 h-11 rounded-xl bg-slate-100" /></div>)}
              </div>
            )}

            {!loading && !error && slots.length === 0 && (
              <div className="mt-7 rounded-3xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-50 text-3xl text-amber-600">◷</div>
                <h3 className="mt-5 text-xl font-extrabold text-slate-900">{success ? "You're all set!" : "No available slots"}</h3>
                <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">{success ? "You can view your booking and track its status from My Appointments." : "This doctor has no available future slots right now. Please check again later or explore another doctor."}</p>
                <Link to={success ? "/appointments" : "/doctors"} className="mt-5 inline-flex rounded-xl bg-teal-700 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-teal-800">{success ? "View my appointments" : "Explore other doctors"}</Link>
              </div>
            )}

            {!loading && !error && slots.length > 0 && (
              <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {slots.map((slot, index) => {
                  const busy = bookingSlotId === slot.id;
                  const palettes = [
                    { top: "bg-sky-500", icon: "bg-sky-100 text-sky-700", date: "text-sky-700", button: "bg-sky-600 hover:bg-sky-700" },
                    { top: "bg-violet-500", icon: "bg-violet-100 text-violet-700", date: "text-violet-700", button: "bg-violet-600 hover:bg-violet-700" },
                    { top: "bg-emerald-500", icon: "bg-emerald-100 text-emerald-700", date: "text-emerald-700", button: "bg-emerald-600 hover:bg-emerald-700" },
                    { top: "bg-amber-500", icon: "bg-amber-100 text-amber-700", date: "text-amber-700", button: "bg-amber-600 hover:bg-amber-700" },
                  ];
                  const palette = palettes[index % palettes.length];

                  return (
                    <article key={slot.id} className="group relative overflow-hidden rounded-[24px] border border-slate-200 bg-white p-6 shadow-sm transition duration-200 hover:-translate-y-1 hover:shadow-xl hover:shadow-slate-900/8">
                      <div className={`absolute inset-x-0 top-0 h-1.5 ${palette.top}`} />
                      <div className="flex items-center justify-between gap-3">
                        <span className={`flex h-11 w-11 items-center justify-center rounded-2xl ${palette.icon} text-xl`}>◷</span>
                        <span className="rounded-full bg-emerald-50 px-3 py-1.5 text-[11px] font-bold text-emerald-700">Available</span>
                      </div>
                      <p className={`mt-5 text-sm font-bold ${palette.date}`}>{formatDate(slot.startsAt)}</p>
                      <h3 className="mt-2 text-2xl font-extrabold tracking-tight text-slate-900">{formatTime(slot.startsAt)}</h3>
                      <p className="mt-1 text-sm font-medium text-slate-500">to {formatTime(slot.endsAt)}</p>
                      <div className="mt-5 flex items-center gap-2 border-t border-slate-100 pt-4 text-xs font-medium text-slate-500">
                        <span className="h-2 w-2 rounded-full bg-emerald-500" />
                        Available for booking
                      </div>
                      <button type="button" onClick={() => handleBooking(slot.id)} disabled={bookingSlotId !== null} className={`mt-5 flex w-full items-center justify-center gap-2 rounded-xl ${palette.button} px-4 py-3.5 text-sm font-bold text-white shadow-md transition disabled:cursor-not-allowed disabled:opacity-60`}>
                        {busy ? "Booking…" : "Book appointment"} {!busy && <span aria-hidden="true">→</span>}
                      </button>
                    </article>
                  );
                })}
              </div>
            )}
          </section>

          <footer className="mt-12 flex flex-col justify-between gap-2 border-t border-slate-200 py-6 text-xs text-slate-400 sm:flex-row">
            <span>© MediFlow · Your healthcare, simplified.</span>
            <Link to="/doctors" className="font-semibold text-teal-700 hover:text-teal-800">Back to doctors →</Link>
          </footer>
        </main>
      </div>

      {loginModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 px-5 py-8 backdrop-blur-sm" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setLoginModalOpen(false); }}>
          <section role="dialog" aria-modal="true" aria-labelledby="login-required-title" className="w-full max-w-md rounded-[28px] bg-white p-7 shadow-2xl sm:p-8">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-50 text-amber-600"><LockIcon /></div>
            <h2 id="login-required-title" className="mt-5 text-center text-2xl font-extrabold text-slate-900">Login required</h2>
            <p className="mt-3 text-center text-sm leading-6 text-slate-500">Please sign in to your patient account to book an appointment.</p>
            <button type="button" onClick={continueToLogin} className="mt-7 w-full rounded-xl bg-teal-700 px-5 py-3.5 text-sm font-bold text-white shadow-lg shadow-teal-900/15 transition hover:bg-teal-800">Sign in to continue</button>
            <button type="button" onClick={() => setLoginModalOpen(false)} className="mt-3 w-full rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-50">Maybe later</button>
          </section>
        </div>
      )}
    </div>
  );
}
