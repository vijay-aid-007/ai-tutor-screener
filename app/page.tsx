"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  BrainCircuit,
  Mail,
  Moon,
  ShieldCheck,
  Sun,
  UserRound,
  Sparkles,
  Mic,
  Clock3,
  BarChart3,
} from "lucide-react";

type ThemeMode = "dark" | "light";

export default function LandingPage() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [theme, setTheme] = useState<ThemeMode>("dark");

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme_mode") as ThemeMode | null;
    if (savedTheme === "light" || savedTheme === "dark") {
      setTheme(savedTheme);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("theme_mode", theme);
  }, [theme]);

  const isDark = theme === "dark";

  const handleStart = () => {
    if (!name.trim() || !email.trim()) return;
    localStorage.setItem("candidate_name", name.trim());
    localStorage.setItem("candidate_email", email.trim());
    router.push("/interview");
  };

  const toggleTheme = () => {
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));
  };

  const colors = isDark
    ? {
        pageBg:
          "bg-[radial-gradient(circle_at_top,rgba(124,58,237,0.12),transparent_24%),linear-gradient(180deg,#060D1A_0%,#081120_42%,#060D1A_100%)]",
        headerBg: "bg-[#081221]/78",
        headerBorder: "border-white/10",
        heroPanel:
          "bg-[radial-gradient(circle_at_top_left,rgba(109,40,217,0.08),transparent_28%),linear-gradient(180deg,rgba(13,24,44,0.98)_0%,rgba(8,17,32,0.98)_100%)]",
        rightCardBg:
          "bg-[linear-gradient(180deg,rgba(16,26,45,0.98)_0%,rgba(10,18,34,0.98)_100%)]",
        surfaceBg:
          "bg-[linear-gradient(180deg,rgba(10,20,36,0.94)_0%,rgba(8,17,32,0.94)_100%)]",
        inputBg: "bg-[#091321]",
        textMain: "text-white",
        textSoft: "text-white/68",
        textMuted: "text-white/48",
        border: "border-white/10",
        borderStrong: "border-white/12",
        chipBg: "bg-white/[0.04]",
        chipText: "text-white/70",
        metricBg:
          "bg-[linear-gradient(180deg,rgba(255,255,255,0.035)_0%,rgba(255,255,255,0.015)_100%)]",
        infoBg:
          "bg-[linear-gradient(180deg,rgba(255,255,255,0.025)_0%,rgba(255,255,255,0.012)_100%)]",
        inputPlaceholder: "placeholder:text-white/28",
        toggleBg: "bg-white/[0.04]",
        toggleText: "text-white/70",
        heroBadgeBg: "bg-emerald-400/10",
        heroBadgeBorder: "border-emerald-400/20",
        heroBadgeText: "text-emerald-300",
        primaryBtn:
          "bg-gradient-to-r from-violet-600 to-fuchsia-500 hover:from-violet-500 hover:to-fuchsia-400 shadow-[0_16px_34px_rgba(124,58,237,0.32)]",
        disabledBtn:
          "disabled:from-violet-600/50 disabled:to-fuchsia-500/40 disabled:text-white/45",
        inputText: "text-white",
        inputFocusBg: "focus:bg-[#0B1628]",
        iconMuted: "text-white/28",
        readyBadge: "border-violet-400/20 bg-violet-400/10 text-violet-200",
        shadow: "shadow-[0_20px_56px_rgba(2,8,23,0.42)]",
      }
    : {
        pageBg:
          "bg-[radial-gradient(circle_at_top,rgba(124,58,237,0.08),transparent_22%),linear-gradient(180deg,#F8FAFF_0%,#F4F7FB_55%,#EEF3FA_100%)]",
        headerBg: "bg-white/84",
        headerBorder: "border-slate-200",
        heroPanel:
          "bg-[radial-gradient(circle_at_top_left,rgba(124,58,237,0.07),transparent_28%),linear-gradient(180deg,#FFFFFF_0%,#F8FAFD_100%)]",
        rightCardBg:
          "bg-[linear-gradient(180deg,rgba(255,255,255,1)_0%,rgba(248,250,253,1)_100%)]",
        surfaceBg:
          "bg-[linear-gradient(180deg,rgba(248,250,252,1)_0%,rgba(255,255,255,1)_100%)]",
        inputBg: "bg-white",
        textMain: "text-slate-900",
        textSoft: "text-slate-600",
        textMuted: "text-slate-500",
        border: "border-slate-200",
        borderStrong: "border-slate-300/80",
        chipBg: "bg-slate-100",
        chipText: "text-slate-600",
        metricBg: "bg-white",
        infoBg: "bg-white",
        inputPlaceholder: "placeholder:text-slate-400",
        toggleBg: "bg-slate-100",
        toggleText: "text-slate-700",
        heroBadgeBg: "bg-emerald-50",
        heroBadgeBorder: "border-emerald-200",
        heroBadgeText: "text-emerald-700",
        primaryBtn:
          "bg-gradient-to-r from-violet-600 to-fuchsia-500 hover:from-violet-500 hover:to-fuchsia-400 shadow-[0_14px_30px_rgba(124,58,237,0.18)]",
        disabledBtn:
          "disabled:from-violet-300 disabled:to-fuchsia-300 disabled:text-white/75",
        inputText: "text-slate-900",
        inputFocusBg: "focus:bg-white",
        iconMuted: "text-slate-400",
        readyBadge: "border-violet-200 bg-violet-50 text-violet-700",
        shadow: "shadow-[0_16px_40px_rgba(15,23,42,0.08)]",
      };

  const statCards = [
    {
      value: "5 min",
      label: "Average session",
      icon: Clock3,
    },
    {
      value: "5",
      label: "Evaluation dimensions",
      icon: BarChart3,
    },
    {
      value: "Instant",
      label: "Decision summary",
      icon: Sparkles,
    },
  ];

  const dimensions = [
    "Communication clarity",
    "Warmth and tone",
    "Patience under pressure",
    "Ability to simplify concepts",
    "English fluency",
  ];

  return (
    <div
      className={`min-h-screen ${colors.pageBg} ${colors.textMain} transition-colors duration-300`}
    >
      <header
        className={`sticky top-0 z-20 border-b ${colors.headerBorder} ${colors.headerBg} backdrop-blur-xl`}
      >
        <div className="mx-auto flex w-full max-w-[1500px] items-center justify-between px-6 py-4 xl:px-8">
          <div className="flex items-center gap-3.5">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-600 to-fuchsia-500 shadow-[0_12px_28px_rgba(124,58,237,0.26)]">
              <BrainCircuit size={18} className="text-white" />
            </div>

            <div>
              <p className="text-[18px] font-semibold tracking-tight">Cuemath</p>
              <p className={`text-xs ${colors.textMuted}`}>
                Tutor Screening Platform
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div
              className={`hidden rounded-full border px-4 py-2 text-xs font-medium md:block ${colors.borderStrong} ${colors.chipBg} ${colors.chipText}`}
            >
              AI Interview Workflow
            </div>

            <button
              onClick={toggleTheme}
              type="button"
              aria-label="Toggle theme"
              className={`flex h-10 w-10 items-center justify-center rounded-full border transition ${colors.borderStrong} ${colors.toggleBg} ${colors.toggleText}`}
            >
              {isDark ? <Sun size={17} /> : <Moon size={17} />}
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto grid min-h-[calc(100vh-76px)] w-full max-w-[1500px] gap-6 px-6 py-6 xl:grid-cols-[1fr_1fr] xl:items-center xl:px-8 xl:py-8">
        <section
          className={`rounded-[34px] border p-8 md:p-10 xl:p-10 ${colors.border} ${colors.heroPanel} ${colors.shadow}`}
        >
          <div
            className={`mb-6 inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium ${colors.heroBadgeBg} ${colors.heroBadgeBorder} ${colors.heroBadgeText}`}
          >
            <span className="h-2 w-2 rounded-full bg-emerald-400" />
            Interview assistant online
          </div>

          <div className="max-w-[44rem]">
            <h1 className="text-[34px] font-semibold leading-[1.08] tracking-[-0.02em] md:text-[42px] xl:text-[48px]">
              Assess tutor communication through a structured voice interview.
            </h1>

            <p className={`mt-5 max-w-[42rem] text-[16px] leading-8 ${colors.textSoft}`}>
              A focused screening experience designed to assess clarity, warmth,
              patience, and teaching presence in a consistent, scalable, and
              interviewer-independent way.
            </p>
          </div>

          <div className="mt-8 grid gap-3 sm:grid-cols-3">
            {statCards.map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.label}
                  className={`rounded-[20px] border p-5 ${colors.border} ${colors.metricBg}`}
                >
                  <div className="mb-5 flex h-10 w-10 items-center justify-center rounded-2xl bg-violet-500/10 text-violet-400">
                    <Icon size={17} />
                  </div>
                  <p className="text-[28px] font-semibold leading-tight tracking-tight md:text-[30px]">
                    {item.value}
                  </p>
                  <p className={`mt-2 text-sm leading-6 ${colors.textMuted}`}>
                    {item.label}
                  </p>
                </div>
              );
            })}
          </div>

          <div className="mt-8 grid gap-4 xl:grid-cols-[1.02fr_0.98fr]">
            <div className={`rounded-[20px] border p-5 ${colors.border} ${colors.infoBg}`}>
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-violet-500/10 text-violet-400">
                  <BarChart3 size={17} />
                </div>
                <div>
                  <p className="text-sm font-semibold">Assessment dimensions</p>
                  <p className={`text-xs ${colors.textMuted}`}>
                    Standardized evaluation criteria
                  </p>
                </div>
              </div>

              <div
                className={`grid gap-y-3 text-sm ${colors.textSoft} sm:grid-cols-2 sm:gap-x-6`}
              >
                {dimensions.map((item) => (
                  <div key={item} className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-violet-400/80" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className={`rounded-[20px] border p-5 ${colors.border} ${colors.infoBg}`}>
              <div className="flex items-start gap-4">
                <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-emerald-500/12">
                  <ShieldCheck size={17} className="text-emerald-400" />
                </div>
                <div className="max-w-[460px]">
                  <p className="text-sm font-semibold">
                    Standardized evaluation flow
                  </p>
                  <p className={`mt-2 text-sm leading-7 ${colors.textSoft}`}>
                    Each candidate goes through the same structured evaluation
                    pattern, reducing interviewer variance and improving hiring
                    consistency across teams.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="flex items-start">
          <div
            className={`w-full rounded-[34px] border p-8 md:p-9 xl:p-10 ${colors.border} ${colors.rightCardBg} ${colors.shadow}`}
          >
            <div className="mb-8 flex items-start justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-[22px] bg-gradient-to-br from-violet-500 to-fuchsia-400 text-xl font-semibold text-white shadow-[0_12px_30px_rgba(168,85,247,0.20)]">
                  M
                </div>
                <div>
                  <p className="text-[24px] font-semibold tracking-tight">Maya</p>
                  <p className={`text-sm ${colors.textMuted}`}>AI Interviewer</p>
                </div>
              </div>

              <div
                className={`rounded-full border px-3.5 py-1.5 text-xs font-medium ${colors.readyBadge}`}
              >
                Ready
              </div>
            </div>

            <div
              className={`mb-8 max-w-[460px] rounded-[20px] border p-5 ${colors.border} ${colors.surfaceBg}`}
            >
              <p className={`text-[15px] leading-8 ${colors.textSoft}`}>
                This interview takes around five minutes. You’ll answer a short
                set of voice-based questions designed to understand how you
                explain, respond, and connect with students.
              </p>

              <div className="mt-5 flex flex-wrap gap-2.5">
                <div
                  className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs ${colors.borderStrong} ${colors.chipBg} ${colors.chipText}`}
                >
                  <Mic size={13} />
                  Voice-first
                </div>
                <div
                  className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs ${colors.borderStrong} ${colors.chipBg} ${colors.chipText}`}
                >
                  <Clock3 size={13} />
                  5 minute flow
                </div>
                <div
                  className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs ${colors.borderStrong} ${colors.chipBg} ${colors.chipText}`}
                >
                  <Sparkles size={13} />
                  Instant report
                </div>
              </div>
            </div>

            <div className="space-y-5">
              <div>
                <label
                  className={`mb-2.5 block text-sm font-medium ${colors.textSoft}`}
                >
                  Full name
                </label>
                <div className="relative">
                  <UserRound
                    size={18}
                    className={`pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 ${colors.iconMuted}`}
                  />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter your full name"
                    className={`w-full rounded-[18px] border py-3.5 pl-11 pr-4 text-[15px] outline-none transition focus:border-violet-400/70 focus:ring-2 focus:ring-violet-500/20 ${colors.borderStrong} ${colors.inputBg} ${colors.inputPlaceholder} ${colors.inputText} ${colors.inputFocusBg}`}
                  />
                </div>
              </div>

              <div>
                <label
                  className={`mb-2.5 block text-sm font-medium ${colors.textSoft}`}
                >
                  Email address
                </label>
                <div className="relative">
                  <Mail
                    size={18}
                    className={`pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 ${colors.iconMuted}`}
                  />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email address"
                    className={`w-full rounded-[18px] border py-3.5 pl-11 pr-4 text-[15px] outline-none transition focus:border-violet-400/70 focus:ring-2 focus:ring-violet-500/20 ${colors.borderStrong} ${colors.inputBg} ${colors.inputPlaceholder} ${colors.inputText} ${colors.inputFocusBg}`}
                  />
                </div>
              </div>
            </div>

            <button
              onClick={handleStart}
              disabled={!name.trim() || !email.trim()}
              className={`mt-8 flex h-[52px] w-full items-center justify-center gap-2 rounded-[18px] text-sm font-semibold tracking-wide text-white transition ${colors.primaryBtn} ${colors.disabledBtn} hover:scale-[1.01] active:scale-[0.99] disabled:cursor-not-allowed`}
            >
              Begin assessment
              <ArrowRight size={18} />
            </button>

            <div
              className={`mt-6 flex items-center justify-between border-t pt-5 text-xs ${colors.border} ${colors.textMuted}`}
            >
              <span>Secure browser microphone access required</span>
              <span>Best experienced on Chrome</span>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}