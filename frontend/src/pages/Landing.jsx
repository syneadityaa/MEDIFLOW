import { Link } from "react-router-dom";

const steps = [
  {
    number: "01",
    title: "Discover",
    description:
      "Explore doctors and specialties to find the healthcare professional you need.",
  },
  {
    number: "02",
    title: "Book",
    description:
      "Choose an available time slot and confirm your appointment with your patient account.",
  },
  {
    number: "03",
    title: "Track",
    description:
      "Follow your queue and check your estimated waiting time before your consultation.",
  },
];

const faqs = [
  {
    question: "Can I see my queue before reaching the clinic?",
    answer:
      "Yes. After booking, you can view your estimated waiting time before checking in.",
  },
  {
    question: "Does the estimated waiting time change?",
    answer:
      "Yes. The estimate can change as appointments move through the queue and consultation statuses are updated.",
  },
  {
    question: "Can I browse doctors without an account?",
    answer:
      "Yes. Doctor profiles and available slots can be explored publicly. You need a patient account to book an appointment.",
  },
  {
    question: "Is the waiting time guaranteed?",
    answer:
      "No. It is an estimate based on current queue and consultation information. Actual waiting times may vary.",
  },
];

function Brand({ inverse = false }) {
  return (
    <Link
      to="/"
      aria-label="MediFlow home"
      className={`inline-flex items-center gap-2.5 ${
        inverse ? "text-white" : "text-[#101d20]"
      }`}
    >
      <svg
        viewBox="0 0 52 52"
        className="h-10 w-10 shrink-0 sm:h-12 sm:w-12"
        fill="none"
        aria-hidden="true"
      >
        <rect x="1" y="1" width="50" height="50" rx="16" fill="#087F72" />
        <path
          d="M10 31V19C10 16.9 12.7 16 14 17.8L22 28L30 17.8C31.3 16 34 16.9 34 19V31"
          stroke="white"
          strokeWidth="3.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M34 31H39"
          stroke="#83F0D8"
          strokeWidth="3.5"
          strokeLinecap="round"
        />
        <circle cx="40" cy="31" r="3" fill="#83F0D8" />
      </svg>

      <span className="text-[26px] font-black leading-none tracking-[-1.5px] sm:text-[32px]">
        Medi<span className="text-[#0BA58F]">Flow</span>
      </span>
    </Link>
  );
}

function Arrow() {
  return <span aria-hidden="true" className="ml-2 text-base">↗</span>;
}

function QueuePreview() {
  return (
    <div className="relative mx-auto w-full max-w-[480px]">
      <div className="absolute -right-6 -top-6 h-40 w-40 rounded-full bg-[#18c8a9]/30 blur-[70px]" />

      <div className="relative rounded-[22px] bg-[#111f21] p-5 text-white shadow-2xl sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#71dcca]">
              MediFlow / Queue preview
            </p>
            <h2 className="mt-2 text-xl font-extrabold tracking-tight sm:text-2xl">
              Your visit. At a glance.
            </h2>
          </div>
          <span className="rounded-full border border-[#f2c66d]/40 bg-[#f2c66d]/10 px-2.5 py-1 text-[9px] font-extrabold tracking-wider text-[#f2d493]">
            DEMO
          </span>
        </div>

        <div className="mt-5 rounded-xl bg-[#1b3435] p-4 sm:p-5">
          <p className="text-xs font-semibold text-[#b7ceca]">
            Estimated waiting time
          </p>
          <div className="mt-1.5 flex items-end justify-between">
            <p className="text-5xl font-black tracking-[-3px]">
              25<span className="ml-1.5 text-lg font-bold tracking-normal text-[#75dfcc]">min</span>
            </p>
            <div className="mb-1 rounded-lg bg-[#087f72] p-2.5 text-[#a9f4e5]">
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none">
                <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8" />
                <path d="M12 7v5l3.5 2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
              </svg>
            </div>
          </div>
          <div className="mt-3.5 h-1.5 overflow-hidden rounded-full bg-[#35504e]">
            <div className="h-full w-[65%] rounded-full bg-[#43d6b9]" />
          </div>
          <p className="mt-2 text-[10px] leading-4 text-[#b7ceca]">
            Illustrative estimate only. Actual waiting time may vary.
          </p>
        </div>

        <div className="mt-5">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-xs font-bold">Appointment progress</p>
            <p className="text-[9px] text-[#a8c1bd]">SAMPLE DATA</p>
          </div>

          <div className="space-y-3.5">
            {[
              ["01", "Appointment booked", "Booking confirmed", "Complete"],
              ["02", "Waiting in queue", "Queue status can update", "Current"],
              ["03", "Consultation", "Your turn is upcoming", "Next"],
            ].map(([number, title, description, status], index) => (
              <div key={number} className="flex items-center gap-3">
                <div
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-black ${
                    index === 0
                      ? "bg-[#087f72] text-white"
                      : index === 1
                        ? "border-2 border-[#55d8bf] text-[#8cebd9]"
                        : "border border-[#607674] text-[#9db2ae]"
                  }`}
                >
                  {index === 0 ? "✓" : number}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold">{title}</p>
                  <p className="text-[11px] text-[#a8c1bd]">{description}</p>
                </div>
                <span
                  className={`text-[10px] font-bold ${
                    index === 1 ? "text-[#8cebd9]" : "text-[#9db2ae]"
                  }`}
                >
                  {status}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-5 border-t border-white/10 pt-3">
          <p className="text-[10px] leading-4 text-[#a8c1bd]">
            Example interface only — not real patient or clinic information.
          </p>
        </div>
      </div>
    </div>
  );
}

export default function Landing() {
  return (
    <div className="min-h-screen bg-white text-[#101d20]">
      {/* Brand header */}
      <header className="border-b border-[#e8eeec] bg-white sticky top-0 z-50">
        <div className="mx-auto flex h-20 max-w-[1440px] items-center justify-between gap-5 px-5 sm:px-10 lg:px-16">
          <Brand />

          <nav className="flex items-center gap-3 sm:gap-6">
            <Link
              to="/login"
              className="px-2 py-2 text-sm font-bold text-[#253b3c] transition hover:text-[#087f72]"
            >
              Sign in
            </Link>
            <Link
              to="/register"
              className="rounded-xl bg-[#087f72] px-4.5 py-2.5 text-sm font-extrabold text-white transition hover:bg-[#06685e]"
            >
              Get started <Arrow />
            </Link>
          </nav>
        </div>
      </header>

      <main>
        {/* Hero */}
        <section className="relative overflow-hidden bg-white py-12 lg:py-20">
          <div className="pointer-events-none absolute -right-40 top-10 h-[400px] w-[400px] rounded-full border border-[#e9efed]" />

          <div className="relative mx-auto grid max-w-[1440px] items-center gap-10 px-5 sm:px-10 lg:grid-cols-[1fr_0.9fr] lg:gap-12 lg:px-16">
            <div className="max-w-[620px]">
              <p className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-[0.2em] text-[#087f72]">
                <span className="h-2 w-2 rounded-full bg-[#0aa58d]" />
                Healthcare, with more clarity
              </p>

              <h1 className="mt-4 text-4xl font-black leading-[1.05] tracking-[-0.05em] sm:text-5xl lg:text-6xl">
                Know your place in the{" "}
                <span className="text-[#087f72]">clinic queue.</span>
              </h1>

              <p className="mt-4 max-w-[540px] text-sm leading-7 text-[#536568] sm:text-base">
                Book your doctor appointment and follow your estimated
                waiting time. Know what is happening with your clinic visit
                before your consultation begins.
              </p>

              <div className="mt-6 flex flex-wrap gap-3">
                <Link
                  to="/register"
                  className="rounded-xl bg-[#087f72] px-6 py-3.5 text-sm font-extrabold text-white shadow-md transition hover:-translate-y-0.5 hover:bg-[#06685e]"
                >
                  Create your account <Arrow />
                </Link>
                <Link
                  to="/login"
                  className="rounded-xl border-2 border-[#dce6e3] px-6 py-3.5 text-sm font-extrabold text-[#173332] transition hover:border-[#087f72] hover:text-[#087f72]"
                >
                  Sign in
                </Link>
              </div>

              <div className="mt-6 flex flex-wrap gap-x-6 gap-y-2 text-xs font-bold text-[#536568]">
                <span>✓ Appointment booking</span>
                <span>✓ Queue updates</span>
                <span>✓ Waiting-time estimates</span>
              </div>
            </div>

            <QueuePreview />
          </div>
        </section>

        {/* Process */}
        <section className="bg-[#111f21] px-5 py-14 text-white sm:px-10 lg:px-16 lg:py-18">
          <div className="mx-auto max-w-[1440px]">
            <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
              <div className="max-w-2xl">
                <p className="text-xs font-black uppercase tracking-[0.22em] text-[#64d9c3]">
                  A simple process
                </p>
                <h2 className="mt-3 text-3xl font-black leading-[1.05] tracking-[-0.05em] sm:text-5xl">
                  Three steps. <span className="text-[#67dcc6]">One clearer visit.</span>
                </h2>
              </div>
              <p className="max-w-md text-xs leading-6 text-[#b4c4c2] sm:text-sm">
                Everything from discovering a doctor to following your queue,
                brought together in one place.
              </p>
            </div>

            <div className="mt-10 grid gap-0 border-t border-white/25 md:grid-cols-3">
              {steps.map((step, index) => (
                <article
                  key={step.number}
                  className={`py-6 md:pr-6 ${
                    index > 0 ? "md:border-l md:border-white/20 md:pl-6" : ""
                  }`}
                >
                  <p className="text-xs font-black tracking-[0.2em] text-[#61d9c2]">
                    / {step.number}
                  </p>
                  <h3 className="mt-4 text-xl font-extrabold tracking-tight">
                    {step.title}
                  </h3>
                  <p className="mt-2 max-w-sm text-xs leading-6 text-[#b4c4c2]">
                    {step.description}
                  </p>
                  <div className="mt-6 h-1 w-10 bg-[#3ed0b4]" />
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* Queue feature */}
        <section className="overflow-hidden bg-[#087f72] px-5 py-14 text-white sm:px-10 lg:px-16 lg:py-20">
          <div className="mx-auto grid max-w-[1240px] items-center gap-10 lg:grid-cols-2 lg:gap-16">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.22em] text-[#b7f5e8]">
                More than appointment booking
              </p>
              <h2 className="mt-3 text-3xl font-black leading-[1.06] tracking-[-0.055em] sm:text-5xl">
                Your appointment is booked. <span className="text-[#a6f0df]">Now follow the queue.</span>
              </h2>
              <p className="mt-5 max-w-xl text-sm leading-7 text-[#e0f5f0]">
                You can view your estimated waiting time after booking,
                even before checking in. Follow queue changes as appointments
                move through the clinic.
              </p>

              <div className="mt-8 space-y-5">
                {[
                  ["01", "Check before you arrive", "View your estimated wait after booking, before clinic check-in."],
                  ["02", "Follow queue changes", "Queue information can update as consultation statuses change."],
                  ["03", "Plan with more clarity", "Use the estimate as a guide for your clinic visit."],
                ].map(([number, title, description]) => (
                  <div key={number} className="flex gap-3.5">
                    <span className="text-xs font-black text-[#a6f0df]">
                      {number}
                    </span>
                    <div>
                      <h3 className="text-sm font-extrabold">{title}</h3>
                      <p className="text-xs leading-5 text-[#d5f0e9]">
                        {description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative">
              <div className="absolute -right-8 -top-8 h-44 w-44 rounded-full border border-white/20" />
              <div className="relative rounded-[20px] bg-[#075b54] p-6 sm:p-8">
                <p className="text-[11px] font-black uppercase tracking-[0.2em] text-[#a6f0df]">
                  The MediFlow difference
                </p>
                <h3 className="mt-3 text-2xl font-black leading-tight sm:text-3xl">
                  See more than just a booking confirmation.
                </h3>
                <p className="mt-3 text-xs leading-6 text-[#d2eee7]">
                  Keep appointment status, queue progress and estimated
                  waiting time together.
                </p>

                <div className="mt-6 space-y-2.5">
                  <div className="flex items-center gap-3 rounded-xl border border-white/15 bg-white/10 p-3">
                    <span className="text-base font-bold">01</span>
                    <span className="text-xs font-bold">Appointment status</span>
                  </div>
                  <div className="flex items-center gap-3 rounded-xl border border-white/15 bg-white/10 p-3">
                    <span className="text-base font-bold">02</span>
                    <span className="text-xs font-bold">Live queue progress</span>
                  </div>
                  <div className="flex items-center gap-3 rounded-xl border border-white/15 bg-white/10 p-3">
                    <span className="text-base font-bold">03</span>
                    <span className="text-xs font-bold">Estimated waiting time</span>
                  </div>
                </div>
              </div>
              <p className="mt-3 text-center text-[11px] text-[#d5f0e9]">
                Estimates are indicative, not guaranteed consultation times.
              </p>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="bg-white px-5 py-14 sm:px-10 lg:px-16 lg:py-18">
          <div className="mx-auto grid max-w-[1240px] gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.2em] text-[#087f72]">
                Need to know
              </p>
              <h2 className="mt-3 text-3xl font-black leading-tight tracking-[-0.05em] sm:text-4xl">
                Good questions. Clear answers.
              </h2>
              <p className="mt-4 max-w-sm text-xs leading-6 text-[#536568]">
                A little more information about booking and queue tracking
                with MediFlow.
              </p>
            </div>

            <div className="divide-y divide-[#e3eae8] border-y border-[#e3eae8]">
              {faqs.map((faq) => (
                <details key={faq.question} className="group py-4.5">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-left text-sm font-extrabold text-[#172c2e] [&::-webkit-details-marker]:hidden">
                    {faq.question}
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[#dce6e3] text-lg text-[#087f72] transition group-open:rotate-45 group-open:bg-[#087f72] group-open:text-white">
                      +
                    </span>
                  </summary>
                  <p className="max-w-2xl pt-2.5 pr-8 text-xs leading-6 text-[#536568]">
                    {faq.answer}
                  </p>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="bg-[#111f21] px-5 py-14 text-center text-white sm:px-10 lg:px-16 lg:py-18">
          <div className="mx-auto max-w-3xl">
            <Brand inverse />
            <p className="mt-6 text-xs font-black uppercase tracking-[0.22em] text-[#69ddc7]">
              Your next clinic visit starts here
            </p>
            <h2 className="mt-3 text-3xl font-black leading-[1.08] tracking-[-0.05em] sm:text-5xl">
              Make your clinic visit easier to follow.
            </h2>
            <p className="mx-auto mt-4 max-w-lg text-sm leading-6 text-[#b8c9c5]">
              Create your patient account to book appointments and keep
              track of your queue.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <Link
                to="/register"
                className="rounded-xl bg-[#42d4b8] px-6 py-3.5 text-sm font-black text-[#102c2b] transition hover:-translate-y-0.5 hover:bg-[#79e7d2]"
              >
                Get started <Arrow />
              </Link>
              <Link
                to="/login"
                className="rounded-xl border border-white/25 px-6 py-3.5 text-sm font-bold text-white transition hover:bg-white/10"
              >
                Sign in
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/10 bg-[#0b1719] px-5 py-6 text-white sm:px-10 lg:px-16">
        <div className="mx-auto flex max-w-[1440px] flex-col items-center justify-between gap-3 sm:flex-row">
          <Brand inverse />
          <p className="text-center text-xs text-[#aabbb7]">
            Healthcare appointments and queue tracking, made clearer.
          </p>
          <p className="text-xs text-[#aabbb7]">
            © {new Date().getFullYear()} MediFlow
          </p>
        </div>
      </footer>
    </div>
  );
}