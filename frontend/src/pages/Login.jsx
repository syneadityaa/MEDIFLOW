import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { apiRequest } from "../services/api";

export default function Login() {
  const navigate = useNavigate();
  const redirectTimer = useRef(null);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [modal, setModal] = useState({ isOpen: false, type: "", message: "" });

  useEffect(() => {
    return () => {
      if (redirectTimer.current) clearTimeout(redirectTimer.current);
    };
  }, []);

  async function handleSubmit(event) {
    event.preventDefault();
    if (loading) return;

    setLoading(true);
    try {
      const data = await apiRequest("/login", {
        method: "POST",
        body: JSON.stringify({ email: email.trim().toLowerCase(), password }),
      });

      if (!data?.token || !data?.user || !["PATIENT", "DOCTOR"].includes(data.user.role)) {
        throw new Error("Invalid login response");
      }

      localStorage.setItem("mediflow_token", data.token);
      localStorage.setItem("mediflow_user", JSON.stringify(data.user));

      setModal({
        isOpen: true,
        type: "success",
        message: "You have successfully signed in to MediFlow.",
      });

      const destination = data.user.role === "DOCTOR"
        ? "/doctor/dashboard"
        : "/patient/dashboard";

      redirectTimer.current = setTimeout(() => {
        navigate(destination, { replace: true });
      }, 1500);
    } catch (error) {
      console.error("Login error:", error);
      setModal({
        isOpen: true,
        type: "error",
        message: "Email or password is incorrect. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  }

  function closeModal() {
    if (modal.type === "success") return;
    setModal({ isOpen: false, type: "", message: "" });
  }

  return (
    <main className="relative min-h-screen w-full overflow-hidden bg-white font-sans">
      <div className="flex min-h-screen w-full flex-col lg:flex-row">
        {/* Left form section */}
        <section className="flex flex-1 flex-col justify-between overflow-y-auto p-8 sm:p-12 lg:p-16">
          <div>
            <Link to="/" className="inline-flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#004B43] text-lg font-bold text-white">+</div>
              <span className="text-xl font-bold tracking-tight text-slate-900">MediFlow</span>
            </Link>

            <div className="mt-12">
              <h1 className="text-3xl font-black text-slate-900 sm:text-4xl">Welcome back</h1>
              <p className="mt-2 text-sm font-medium text-slate-500">
                Sign in to manage your appointments and clinic queue.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="mt-8 max-w-md space-y-5">
              <div>
                <label htmlFor="email" className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                  Email address
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="username"
                  required
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  disabled={loading}
                  placeholder="you@example.com"
                  className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3.5 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-emerald-700 focus:ring-2 focus:ring-emerald-100 disabled:opacity-60"
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                  Password
                </label>
                <div className="relative mt-2">
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    disabled={loading}
                    placeholder="Enter your password"
                    className="w-full rounded-xl border border-slate-200 px-4 py-3.5 pr-14 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-emerald-700 focus:ring-2 focus:ring-emerald-100 disabled:opacity-60"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((visible) => !visible)}
                    disabled={loading}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    aria-pressed={showPassword}
                    className="absolute right-4 top-1/2 -translate-y-1/2 rounded-md p-1 text-slate-500 transition hover:text-[#004B43] focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:opacity-50"
                  >
                    {showPassword ? (
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <path d="M3 3l18 18" />
                        <path d="M10.6 10.6a2 2 0 0 0 2.8 2.8" />
                        <path d="M9.9 5.2A10.8 10.8 0 0 1 12 5c5 0 8.5 4.5 9.5 7-.4 1-1.2 2.2-2.3 3.3" />
                        <path d="M6.2 6.2C3.9 7.6 2.7 9.6 2 12c1 2.5 4.5 7 10 7 1.3 0 2.5-.3 3.5-.7" />
                      </svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-xl bg-[#004B43] px-4 py-4 text-sm font-bold text-white shadow-lg shadow-emerald-900/10 transition hover:bg-[#003831] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? "Signing in..." : "Sign in →"}
              </button>
            </form>

            <div className="mt-6 max-w-md text-xs">
              <span className="text-slate-500">Don't have an account? </span>
              <Link to="/register" className="font-bold text-[#004B43] hover:underline">Sign up</Link>
            </div>

            <div className="mt-4 flex max-w-md items-center gap-2 rounded-xl border border-slate-100 bg-slate-50 p-3.5 text-xs text-slate-500">
              <span aria-hidden="true">ℹ</span>
              <span>Doctor accounts are created by the clinic. Doctors can sign in here using their clinic-provided credentials.</span>
            </div>
          </div>

          <Link to="/" className="mt-8 block text-xs font-medium text-slate-400 hover:text-slate-600">
            ← Back to home
          </Link>
        </section>

        {/* Deep teal MediFlow brand panel */}
        <section className="relative hidden min-h-screen flex-col justify-between overflow-hidden bg-[#063F3A] p-12 text-white lg:flex lg:w-1/2 lg:p-16">
          {/* Decorative light */}
          <div className="pointer-events-none absolute -right-24 -top-24 h-96 w-96 rounded-full bg-[#18A999]/20 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-32 -left-20 h-96 w-96 rounded-full bg-[#0B8278]/30 blur-3xl" />
          <div className="pointer-events-none absolute inset-0 opacity-[0.08]" style={{ backgroundImage: "radial-gradient(#ffffff 1px, transparent 1px)", backgroundSize: "24px 24px" }} />

          <div className="relative z-10 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/20 bg-white/10 text-2xl font-bold text-[#6DE0D0]">+</div>
              <span className="text-2xl font-black tracking-tight">MediFlow</span>
            </div>
            <span className="rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-[#A9E9E0]">
              Smarter clinic visits
            </span>
          </div>

          <div className="relative z-10 mx-auto w-full max-w-lg py-12">
            <p className="mb-5 text-xs font-bold uppercase tracking-[0.25em] text-[#72D8CA]">Your visit, in better flow</p>
            <h2 className="max-w-lg text-4xl font-black leading-[1.12] tracking-tight xl:text-5xl">
              Less waiting.<br />
              <span className="text-[#72D8CA]">More clarity.</span>
            </h2>
            <p className="mt-5 max-w-md text-sm leading-7 text-teal-50/75">
              Keep track of your place in the clinic queue and see an estimated wait that updates as the queue changes.
            </p>

            {/* Queue preview card */}
            <div className="mt-10 rounded-3xl border border-white/15 bg-[#0B514A]/80 p-6 shadow-2xl shadow-black/20 backdrop-blur-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-teal-100/65">QUEUE PREVIEW</p>
                  <p className="mt-1 text-lg font-bold text-white">Your clinic visit</p>
                </div>
                <span className="rounded-full bg-[#72D8CA]/15 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-[#9CE9DF]">Live updates</span>
              </div>

              <div className="mt-7 flex items-center gap-3">
                <div className="flex -space-x-2">
                  {['A', 'M', 'R'].map((initial, index) => (
                    <div key={initial} className={`flex h-10 w-10 items-center justify-center rounded-full border-2 border-[#0B514A] text-xs font-bold text-white ${index === 0 ? 'bg-[#438C82]' : index === 1 ? 'bg-[#286E66]' : 'bg-[#174F49]'}`}>
                      {initial}
                    </div>
                  ))}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex justify-between text-xs font-semibold text-teal-50">
                    <span>Queue progress</span>
                    <span>3 ahead</span>
                  </div>
                  <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/10">
                    <div className="h-full w-[62%] rounded-full bg-gradient-to-r from-[#39B9A8] to-[#8AE4D8]" />
                  </div>
                </div>
              </div>

              <div className="mt-6 grid grid-cols-2 gap-3">
                <div className="rounded-2xl border border-white/10 bg-white/[0.06] p-4">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-teal-100/60">Estimated wait</p>
                  <p className="mt-1 text-2xl font-black text-white">~25 min</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/[0.06] p-4">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-teal-100/60">Your position</p>
                  <p className="mt-1 text-2xl font-black text-white">#4</p>
                </div>
              </div>
              <p className="mt-4 text-[10px] leading-5 text-teal-100/50">Illustrative preview only — not real patient data or a guaranteed waiting time.</p>
            </div>
          </div>

          <div className="relative z-10 flex items-center justify-between border-t border-white/15 pt-5 text-[10px] font-medium tracking-wide text-teal-100/55">
            <span>Appointments · Queue · Clarity</span>
            <span>MEDIFLOW</span>
          </div>
        </section>
      </div>

      {/* Login modal */}
      {modal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div role="dialog" aria-modal="true" aria-labelledby="login-modal-title" className="w-full max-w-sm rounded-3xl bg-white p-6 text-center shadow-2xl">
            <div className={`mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full text-2xl ${modal.type === "success" ? "bg-emerald-100 text-emerald-600" : "bg-red-100 text-red-600"}`}>
              {modal.type === "success" ? "✓" : "!"}
            </div>
            <h3 id="login-modal-title" className="text-lg font-bold text-slate-900">
              {modal.type === "success" ? "Login successful!" : "Unable to sign in"}
            </h3>
            <p className="mt-2 text-sm font-medium text-slate-600">{modal.message}</p>
            <button
              type="button"
              onClick={closeModal}
              disabled={modal.type === "success"}
              className={`mt-6 w-full rounded-xl px-4 py-3 text-xs font-bold text-white shadow-md transition disabled:cursor-default ${modal.type === "success" ? "bg-emerald-600" : "bg-slate-900 hover:bg-slate-800"}`}
            >
              {modal.type === "success" ? "Redirecting..." : "Try Again"}
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
