import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { apiRequest } from "../services/api";

const specialtyStyles = {
  Cardiology: {
    card: "from-rose-50 via-white to-white",
    icon: "bg-rose-100 text-rose-700",
    badge: "bg-rose-100 text-rose-700",
    button: "bg-rose-600 hover:bg-rose-700",
    accent: "bg-rose-500",
  },
  Dermatology: {
    card: "from-violet-50 via-white to-white",
    icon: "bg-violet-100 text-violet-700",
    badge: "bg-violet-100 text-violet-700",
    button: "bg-violet-600 hover:bg-violet-700",
    accent: "bg-violet-500",
  },
};

const fallbackStyle = {
  card: "from-teal-50 via-white to-white",
  icon: "bg-teal-100 text-teal-700",
  badge: "bg-teal-100 text-teal-700",
  button: "bg-teal-700 hover:bg-teal-800",
  accent: "bg-teal-500",
};

function getInitials(name = "Doctor") {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

export default function Doctors() {
  const navigate = useNavigate();

  const [doctors, setDoctors] = useState([]);
  const [search, setSearch] = useState("");
  const [specialty, setSpecialty] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadDoctors = useCallback(async (selectedSpecialty = "") => {
    setLoading(true);
    setError("");

    try {
      const query = selectedSpecialty
        ? `?specialty=${encodeURIComponent(selectedSpecialty)}`
        : "";

      const response = await apiRequest(`/doctors${query}`);
      setDoctors(response.data ?? []);
    } catch (err) {
      setError(err.message || "Could not load doctors. Please try again.");
      setDoctors([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDoctors();
  }, [loadDoctors]);

  function handleSearch(event) {
    event.preventDefault();
    const selected = search.trim();
    setSpecialty(selected);
    loadDoctors(selected);
  }

  function handleClear() {
    setSearch("");
    setSpecialty("");
    loadDoctors("");
  }

  const user = (() => {
    try {
      return JSON.parse(localStorage.getItem("mediflow_user") || "null");
    } catch {
      return null;
    }
  })();

  function handleLogout() {
    localStorage.removeItem("mediflow_token");
    localStorage.removeItem("mediflow_user");
    navigate("/login", { replace: true });
  }

  return (
    <div className="min-h-screen bg-[#F4F7FA] text-slate-900">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-[250px] flex-col border-r border-slate-200 bg-white px-5 py-7 lg:flex">
        <Link to="/" className="flex items-center gap-3 px-2">
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-teal-700 text-xl font-black text-white shadow-lg shadow-teal-900/15">
            M
          </span>
          <span className="text-2xl font-extrabold tracking-tight">
            Medi<span className="text-teal-700">Flow</span>
          </span>
        </Link>

        <p className="mb-3 mt-12 px-3 text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400">
          Workspace
        </p>
        <nav className="space-y-2">
          <Link
            to="/patient/dashboard"
            className="flex items-center gap-3 rounded-xl px-4 py-3 font-semibold text-slate-500 transition hover:bg-slate-50 hover:text-slate-900"
          >
            <span className="text-lg">⌂</span> Dashboard
          </Link>
          <Link
            to="/doctors"
            className="flex items-center gap-3 rounded-xl bg-teal-50 px-4 py-3 font-bold text-teal-800"
          >
            <span className="text-lg">✚</span> Find Doctors
          </Link>
          <Link
            to="/appointments"
            className="flex items-center gap-3 rounded-xl px-4 py-3 font-semibold text-slate-500 transition hover:bg-slate-50 hover:text-slate-900"
          >
            <span className="text-lg">▣</span> My Appointments
          </Link>
        </nav>

        <div className="mt-auto rounded-2xl bg-gradient-to-br from-[#064E48] to-[#0B8275] p-5 text-white">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/15 text-xl">
            ♡
          </div>
          <p className="mt-4 font-bold">Your care, made simpler.</p>
          <p className="mt-1 text-xs leading-5 text-teal-50">
            Find a specialist and choose a time that works for you.
          </p>
        </div>
      </aside>

      <div className="min-h-screen lg:ml-[250px]">
        <header className="sticky top-0 z-20 border-b border-slate-200/80 bg-white/95 backdrop-blur">
          <div className="mx-auto flex max-w-[1450px] items-center justify-between px-5 py-4 sm:px-8">
            <div className="lg:hidden">
              <Link to="/" className="text-xl font-extrabold tracking-tight">
                Medi<span className="text-teal-700">Flow</span>
              </Link>
            </div>
            <div className="hidden lg:block">
              <p className="text-sm font-semibold text-slate-500">Patient portal</p>
              <p className="text-xs text-slate-400">Discover trusted specialists</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="hidden text-right sm:block">
                <p className="text-sm font-bold text-slate-800">{user?.name || "Patient"}</p>
                <p className="text-xs text-slate-400">Patient account</p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-teal-100 font-bold text-teal-800">
                {getInitials(user?.name || "Patient")}
              </div>
              <button
                type="button"
                onClick={handleLogout}
                className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-700"
              >
                Logout
              </button>
            </div>
          </div>
          <nav className="flex gap-2 overflow-x-auto border-t border-slate-100 px-5 py-2 lg:hidden">
            <Link to="/patient/dashboard" className="whitespace-nowrap rounded-lg px-3 py-2 text-sm font-semibold text-slate-500">Dashboard</Link>
            <Link to="/doctors" className="whitespace-nowrap rounded-lg bg-teal-50 px-3 py-2 text-sm font-bold text-teal-800">Find Doctors</Link>
            <Link to="/appointments" className="whitespace-nowrap rounded-lg px-3 py-2 text-sm font-semibold text-slate-500">My Appointments</Link>
          </nav>
        </header>

        <main className="mx-auto max-w-[1450px] px-5 py-7 sm:px-8 sm:py-9">
          <section className="relative overflow-hidden rounded-[28px] bg-gradient-to-r from-[#064E48] via-[#08796F] to-[#12A795] px-7 py-8 text-white shadow-xl shadow-teal-900/10 sm:px-10 sm:py-10">
            <div className="pointer-events-none absolute -right-16 -top-28 h-80 w-80 rounded-full border-[35px] border-white/10" />
            <div className="pointer-events-none absolute -bottom-32 right-44 h-64 w-64 rounded-full bg-white/5" />
            <div className="relative max-w-2xl">
              <p className="text-xs font-bold uppercase tracking-[0.22em] text-teal-100">
                Find the right care
              </p>
              <h1 className="mt-3 text-3xl font-extrabold tracking-tight sm:text-4xl">
                Find your doctor
              </h1>
              <p className="mt-3 max-w-xl text-sm leading-6 text-teal-50 sm:text-base">
                Explore specialists, compare consultation details and find an appointment slot that fits your schedule.
              </p>
            </div>
            <div className="relative mt-7 flex flex-wrap gap-3 text-xs font-semibold text-white/90">
              <span className="rounded-full border border-white/20 bg-white/10 px-4 py-2">Specialist discovery</span>
              <span className="rounded-full border border-white/20 bg-white/10 px-4 py-2">Available time slots</span>
              <span className="rounded-full border border-white/20 bg-white/10 px-4 py-2">Clinic queue tracking</span>
            </div>
          </section>

          <section className="mt-8">
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-teal-700">Specialist directory</p>
                <h2 className="mt-2 text-2xl font-extrabold tracking-tight text-slate-900">Explore our doctors</h2>
                <p className="mt-1 text-sm text-slate-500">Choose a specialty to narrow down your search.</p>
              </div>
              <span className="w-fit rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 shadow-sm">
                {loading ? "Loading directory…" : `${doctors.length} ${doctors.length === 1 ? "doctor" : "doctors"} found`}
              </span>
            </div>

            <form
              onSubmit={handleSearch}
              className="mt-5 flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm sm:flex-row"
            >
              <div className="flex flex-1 items-center gap-3 rounded-xl bg-slate-50 px-4">
                <span className="text-lg text-slate-400">⌕</span>
                <label htmlFor="specialty" className="sr-only">Medical specialty</label>
                <select
                  id="specialty"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  className="min-w-0 flex-1 bg-transparent py-3 text-sm font-medium text-slate-700 outline-none"
                >
                  <option value="">All specialties</option>
                  <option value="Cardiology">Cardiology</option>
                  <option value="Dermatology">Dermatology</option>
                </select>
              </div>
              <button
                type="submit"
                disabled={loading}
                className="rounded-xl bg-teal-700 px-6 py-3 text-sm font-bold text-white shadow-md shadow-teal-900/10 transition hover:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? "Searching…" : "Search doctors"}
              </button>
              {specialty && (
                <button
                  type="button"
                  onClick={handleClear}
                  className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
                >
                  Clear filter
                </button>
              )}
            </form>

            {specialty && (
              <p className="mt-4 text-sm text-slate-500">
                Showing results for <strong className="text-slate-800">{specialty}</strong>
              </p>
            )}

            {error && (
              <div role="alert" className="mt-6 rounded-2xl border border-rose-200 bg-rose-50 p-5 text-sm text-rose-700">
                <p className="font-bold">We couldn't load the doctor directory.</p>
                <p className="mt-1">{error}</p>
                <button type="button" onClick={() => loadDoctors(specialty)} className="mt-3 font-bold underline">
                  Try again
                </button>
              </div>
            )}

            {loading && (
              <div className="mt-7 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                {[1, 2, 3].map((item) => (
                  <div key={item} className="animate-pulse rounded-2xl border border-slate-200 bg-white p-6">
                    <div className="h-14 w-14 rounded-2xl bg-slate-100" />
                    <div className="mt-5 h-5 w-2/3 rounded bg-slate-100" />
                    <div className="mt-3 h-4 w-1/2 rounded bg-slate-100" />
                    <div className="mt-8 h-10 rounded-xl bg-slate-100" />
                  </div>
                ))}
              </div>
            )}

            {!loading && !error && doctors.length === 0 && (
              <div className="mt-7 rounded-3xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-teal-50 text-3xl text-teal-700">⌕</div>
                <h3 className="mt-5 text-xl font-extrabold text-slate-900">No doctors found</h3>
                <p className="mt-2 text-sm text-slate-500">Try viewing all specialties or choose another specialty.</p>
                {specialty && (
                  <button type="button" onClick={handleClear} className="mt-5 rounded-xl bg-teal-700 px-5 py-2.5 text-sm font-bold text-white hover:bg-teal-800">
                    View all doctors
                  </button>
                )}
              </div>
            )}

            {!loading && !error && doctors.length > 0 && (
              <div className="mt-6 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                {doctors.map((doctor, index) => {
                  const name = doctor.user?.name || "Doctor";
                  const specialtyName = doctor.specialty?.name || "Medical specialist";
                  const style = specialtyStyles[specialtyName] || fallbackStyle;
                  const initials = getInitials(name);
                  const rating = doctor.rating;
                  const colors = [
                    "from-sky-500 to-blue-600",
                    "from-violet-500 to-purple-600",
                    "from-emerald-500 to-teal-600",
                    "from-rose-500 to-pink-600",
                    "from-amber-500 to-orange-600",
                  ];
                  return (
                    <article
                      key={doctor.id}
                      className={`group relative overflow-hidden rounded-[24px] border border-slate-200 bg-gradient-to-br ${style.card} p-6 shadow-sm transition duration-200 hover:-translate-y-1 hover:shadow-xl hover:shadow-slate-900/8`}
                    >
                      <div className={`absolute left-0 top-0 h-1.5 w-full ${style.accent}`} />
                      <div className="flex items-start justify-between gap-3">
                        <div className={`flex h-[68px] w-[68px] items-center justify-center rounded-[22px] bg-gradient-to-br ${colors[index % colors.length]} text-xl font-extrabold text-white shadow-lg`}>
                          {initials}
                        </div>
                        <span className={`rounded-full px-3 py-1.5 text-[11px] font-bold ${style.badge}`}>
                          {specialtyName}
                        </span>
                      </div>

                      <h3 className="mt-5 text-xl font-extrabold tracking-tight text-slate-900">{name}</h3>
                      <p className="mt-1 text-sm text-slate-500">Medical specialist</p>

                      <div className="mt-6 grid grid-cols-2 gap-3">
                        <div className="rounded-2xl border border-white/80 bg-white/80 p-3">
                          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Consultation</p>
                          <p className="mt-1 text-lg font-extrabold text-slate-800">
                            {doctor.avgConsultMins ?? "—"}
                            {doctor.avgConsultMins != null ? <span className="ml-1 text-xs font-semibold text-slate-500">min</span> : null}
                          </p>
                        </div>
                        <div className="rounded-2xl border border-white/80 bg-white/80 p-3">
                          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Rating</p>
                          <p className="mt-1 text-lg font-extrabold text-slate-800">
                            {rating != null ? <><span className="text-amber-400">★</span> {rating}</> : "—"}
                          </p>
                          <p className="text-[10px] text-slate-400">{rating != null ? "Clinic rating" : "Not rated yet"}</p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => navigate(`/doctors/${doctor.id}/slots`)}
                        className={`mt-5 flex w-full items-center justify-center gap-2 rounded-xl ${style.button} px-4 py-3.5 text-sm font-bold text-white shadow-md transition`}
                      >
                        View available slots <span aria-hidden="true">→</span>
                      </button>
                    </article>
                  );
                })}
              </div>
            )}
          </section>

          <footer className="mt-12 flex flex-col justify-between gap-2 border-t border-slate-200 py-6 text-xs text-slate-400 sm:flex-row">
            <span>© MediFlow · Your healthcare, simplified.</span>
            <Link to="/patient/dashboard" className="font-semibold text-teal-700 hover:text-teal-800">Back to dashboard →</Link>
          </footer>
        </main>
      </div>
    </div>
  );
}
