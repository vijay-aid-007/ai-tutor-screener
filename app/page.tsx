"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Mail,
  Moon,
  Sun,
  UserRound,
  Sparkles,
  Mic,
  Clock3,
  BarChart3,
  CheckCircle2,
  BrainCircuit,
  ShieldCheck,
  Waves,
} from "lucide-react";

type ThemeMode = "dark" | "light";

const FONTS = `
@import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;1,9..40,400;1,9..40,500&family=DM+Serif+Display:ital@0;1&display=swap');

*,*::before,*::after { box-sizing: border-box; }
html,body { margin: 0; padding: 0; font-family: "DM Sans", system-ui, sans-serif; }
.font-display { font-family: "DM Serif Display", Georgia, serif; }
`;

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function LandingPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [theme, setTheme] = useState<ThemeMode>("dark");
  const [mounted, setMounted] = useState(false);
  const [heroReady, setHeroReady] = useState(false);

  const [nameTouched, setNameTouched] = useState(false);
  const [emailTouched, setEmailTouched] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("theme_mode") as ThemeMode | null;
    if (saved === "light" || saved === "dark") setTheme(saved);
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    localStorage.setItem("theme_mode", theme);
  }, [theme, mounted]);

  useEffect(() => {
    if (!mounted) return;
    const id = window.setTimeout(() => setHeroReady(true), 100);
    return () => window.clearTimeout(id);
  }, [mounted]);

  const isDark = theme === "dark";
  const toggleTheme = () => setTheme((p) => (p === "dark" ? "light" : "dark"));

  const cleanName = name.trim();
  const cleanEmail = email.trim();

  const isNameValid = cleanName.length >= 4;
  const isEmailValid = EMAIL_REGEX.test(cleanEmail);

  const nameError =
    !cleanName
      ? "Full name is required."
      : cleanName.length < 4
      ? "Name must be more than 3 characters."
      : "";

  const emailError =
    !cleanEmail
      ? "Email address is required."
      : !isEmailValid
      ? "Enter a valid email address."
      : "";

  const handleStart = () => {
    setNameTouched(true);
    setEmailTouched(true);

    if (!isNameValid || !isEmailValid) return;

    localStorage.setItem("candidate_name", cleanName);
    localStorage.setItem("candidate_email", cleanEmail);
    router.push("/interview");
  };

  const canStart = isNameValid && isEmailValid;

  const T = useMemo(() => isDark ? {
    bg: "#080C14",
    bg2: "#0C1220",
    gridLine: "rgba(255,255,255,0.035)",
    text: "#F0F4FF",
    textSoft: "rgba(220,228,255,0.70)",
    textMuted: "rgba(220,228,255,0.40)",
    panel: "rgba(255,255,255,0.03)",
    panelBorder: "rgba(255,255,255,0.08)",
    panelBorderHover: "rgba(255,255,255,0.14)",
    surface: "#0E1628",
    surfaceElevated: "#111E35",
    inset: "#0A1120",
    accent: "#4F7BFF",
    accentAlt: "#8B5CF6",
    accentGlow: "rgba(79,123,255,0.18)",
    accentRing: "rgba(79,123,255,0.22)",
    accentText: "#7BA8FF",
    success: "#10D9A0",
    successBg: "rgba(16,217,160,0.08)",
    successBorder: "rgba(16,217,160,0.20)",
    inputBg: "rgba(6,10,20,0.95)",
    inputBorder: "rgba(255,255,255,0.09)",
    inputFocus: "rgba(79,123,255,0.24)",
    chipBg: "rgba(79,123,255,0.07)",
    chipBorder: "rgba(79,123,255,0.15)",
    shadow: "0 32px 80px rgba(0,0,0,0.55)",
    shadowMd: "0 16px 48px rgba(0,0,0,0.38)",
    topbar: "rgba(8,12,20,0.85)",
    heroGlow1: "rgba(79,123,255,0.12)",
    heroGlow2: "rgba(139,92,246,0.08)",
    danger: "#FF6B6B",
    dangerBorder: "rgba(255,107,107,0.34)",
    dangerBg: "rgba(255,107,107,0.08)",
  } : {
    bg: "#F4F6FB",
    bg2: "#EBF0FF",
    gridLine: "rgba(15,23,42,0.05)",
    text: "#0D1526",
    textSoft: "rgba(13,21,38,0.65)",
    textMuted: "rgba(13,21,38,0.40)",
    panel: "rgba(255,255,255,0.80)",
    panelBorder: "rgba(13,21,38,0.08)",
    panelBorderHover: "rgba(13,21,38,0.14)",
    surface: "#FFFFFF",
    surfaceElevated: "#FFFFFF",
    inset: "#F8FAFF",
    accent: "#3B63E8",
    accentAlt: "#7C3AED",
    accentGlow: "rgba(59,99,232,0.10)",
    accentRing: "rgba(59,99,232,0.14)",
    accentText: "#3B63E8",
    success: "#059669",
    successBg: "rgba(5,150,105,0.07)",
    successBorder: "rgba(5,150,105,0.18)",
    inputBg: "#FFFFFF",
    inputBorder: "rgba(13,21,38,0.10)",
    inputFocus: "rgba(59,99,232,0.16)",
    chipBg: "rgba(59,99,232,0.06)",
    chipBorder: "rgba(59,99,232,0.14)",
    shadow: "0 32px 80px rgba(13,21,38,0.10)",
    shadowMd: "0 16px 48px rgba(13,21,38,0.07)",
    topbar: "rgba(244,246,251,0.88)",
    heroGlow1: "rgba(59,99,232,0.08)",
    heroGlow2: "rgba(124,58,237,0.06)",
    danger: "#DC2626",
    dangerBorder: "rgba(220,38,38,0.24)",
    dangerBg: "rgba(220,38,38,0.06)",
  }, [isDark]);

  const dimensions = [
    "Communication clarity",
    "Warmth & tone",
    "Patience under pressure",
    "Ability to simplify concepts",
    "English fluency",
  ];

  if (!mounted) return null;

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: FONTS }} />
      <style dangerouslySetInnerHTML={{ __html: `
        .lp-shell { position: relative; min-height: 100vh; overflow: hidden; background: linear-gradient(160deg, ${T.bg} 0%, ${T.bg2} 100%); color: ${T.text}; }
        .lp-grid::before { content: ""; position: absolute; inset: 0; background-image: linear-gradient(${T.gridLine} 1px, transparent 1px), linear-gradient(90deg, ${T.gridLine} 1px, transparent 1px); background-size: 48px 48px; pointer-events: none; z-index: 0; }
        .lp-glow-1 { position: absolute; top: -120px; left: -100px; width: 700px; height: 700px; border-radius: 50%; background: radial-gradient(circle, ${T.heroGlow1} 0%, transparent 70%); pointer-events: none; z-index: 0; }
        .lp-glow-2 { position: absolute; top: -60px; right: -80px; width: 500px; height: 500px; border-radius: 50%; background: radial-gradient(circle, ${T.heroGlow2} 0%, transparent 70%); pointer-events: none; z-index: 0; }
        .lp-topbar { position: sticky; top: 0; z-index: 100; height: 60px; display: flex; align-items: center; border-bottom: 1px solid ${T.panelBorder}; background: ${T.topbar}; backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px); }
        .lp-container { position: relative; z-index: 1; max-width: 1360px; margin: 0 auto; padding: 0 32px; width: 100%; }
        .lp-topbar-inner { display: flex; align-items: center; justify-content: space-between; width: 100%; }
        .lp-brand { display: flex; align-items: center; gap: 10px; }
        .lp-brandmark { width: 34px; height: 34px; border-radius: 10px; background: linear-gradient(135deg, ${T.accent} 0%, ${T.accentAlt} 100%); display: grid; place-items: center; color: #fff; box-shadow: 0 6px 20px ${T.accentRing}; }
        .lp-brand-name { font-size: 15px; font-weight: 700; letter-spacing: -0.02em; color: ${T.text}; }
        .lp-brand-sub { font-size: 10px; text-transform: uppercase; letter-spacing: 0.10em; color: ${T.textMuted}; margin-top: 1px; }
        .lp-theme-btn { width: 36px; height: 36px; border-radius: 10px; border: 1px solid ${T.panelBorder}; background: ${T.panel}; color: ${T.textSoft}; display: grid; place-items: center; cursor: pointer; transition: border-color 0.15s, background 0.15s; }
        .lp-theme-btn:hover { border-color: ${T.panelBorderHover}; background: ${T.surfaceElevated}; }
        .lp-main { display: grid; grid-template-columns: 1fr 420px; gap: 24px; align-items: center; min-height: calc(100vh - 60px); padding: 28px 0; }
        .lp-hero { display: flex; flex-direction: column; justify-content: center; padding-right: 8px; }
        .lp-live-badge { display: inline-flex; align-items: center; gap: 8px; padding: 5px 12px 5px 8px; border-radius: 999px; border: 1px solid ${T.successBorder}; background: ${T.successBg}; color: ${T.success}; font-size: 11px; font-weight: 600; letter-spacing: 0.04em; margin-bottom: 22px; width: fit-content; }
        .lp-live-dot { width: 7px; height: 7px; border-radius: 50%; background: ${T.success}; animation: lp-pulse 1.8s infinite; }
        .lp-h1 { margin: 0 0 16px 0; font-size: clamp(36px, 3.6vw, 54px); line-height: 1.05; letter-spacing: -0.04em; font-weight: 400; color: ${T.text}; max-width: 580px; }
        .lp-h1-em { font-style: italic; color: ${T.accentText}; font-weight: 400; display: inline-block; opacity: 0; transform: translateY(8px); animation: lp-fadein 600ms cubic-bezier(.2,.8,.2,1) 200ms forwards; }
        .lp-h1-em.ready { opacity: 1; transform: translateY(0); }
        .lp-copy { max-width: 480px; font-size: 15px; line-height: 1.7; color: ${T.textSoft}; margin: 0 0 28px 0; font-weight: 400; }
        .lp-stats { display: grid; grid-template-columns: repeat(3,1fr); border: 1px solid ${T.panelBorder}; border-radius: 16px; overflow: hidden; background: ${T.surface}; box-shadow: ${T.shadowMd}; margin-bottom: 20px; }
        .lp-stat { padding: 16px 18px; }
        .lp-stat + .lp-stat { border-left: 1px solid ${T.panelBorder}; }
        .lp-stat-val { display: flex; align-items: baseline; gap: 5px; margin-bottom: 4px; }
        .lp-stat-val strong { font-size: 24px; letter-spacing: -0.04em; font-weight: 700; color: ${T.text}; }
        .lp-stat-val span { font-size: 9px; font-weight: 800; letter-spacing: 0.12em; color: ${T.accentText}; }
        .lp-stat-label { font-size: 11px; color: ${T.textMuted}; font-weight: 500; }
        .lp-feat-grid { display: grid; grid-template-columns: 1.05fr 0.95fr; gap: 12px; }
        .lp-feat-card { border: 1px solid ${T.panelBorder}; border-radius: 16px; padding: 18px; background: ${T.surface}; box-shadow: ${T.shadowMd}; transition: border-color 0.2s, transform 0.2s; }
        .lp-feat-card:hover { border-color: ${T.panelBorderHover}; transform: translateY(-2px); }
        .lp-feat-eyebrow { display: flex; align-items: center; gap: 7px; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.10em; color: ${T.textMuted}; margin-bottom: 12px; }
        .lp-criteria-item { display: flex; align-items: center; gap: 8px; font-size: 12.5px; color: ${T.textSoft}; line-height: 1.4; margin-bottom: 8px; }
        .lp-feat-title { font-size: 13.5px; font-weight: 700; letter-spacing: -0.02em; color: ${T.text}; margin: 10px 0 6px; }
        .lp-feat-copy { font-size: 12px; color: ${T.textSoft}; line-height: 1.55; margin: 0; }
        .lp-consistency { display: inline-flex; align-items: center; gap: 6px; margin-top: 12px; padding: 5px 9px; border-radius: 10px; border: 1px solid ${T.successBorder}; background: ${T.successBg}; color: ${T.success}; font-size: 10.5px; font-weight: 700; }
        .lp-panel { width: 100%; border-radius: 22px; border: 1px solid ${T.panelBorder}; background: ${T.surface}; box-shadow: ${T.shadow}; overflow: hidden; transition: border-color 0.2s, box-shadow 0.2s; }
        .lp-panel:hover { border-color: ${T.panelBorderHover}; }
        .lp-panel-head { padding: 20px 22px 16px; border-bottom: 1px solid ${T.panelBorder}; display: flex; align-items: center; justify-content: space-between; }
        .lp-avatar { width: 48px; height: 48px; border-radius: 14px; background: linear-gradient(135deg, ${T.accent} 0%, ${T.accentAlt} 100%); display: grid; place-items: center; color: #fff; font-size: 20px; font-weight: 800; box-shadow: 0 10px 24px ${T.accentRing}; }
        .lp-maya-name { font-size: 16px; font-weight: 700; letter-spacing: -0.025em; color: ${T.text}; }
        .lp-maya-role { font-size: 11px; color: ${T.textMuted}; margin-top: 3px; }
        .lp-ready-pill { padding: 5px 12px; border-radius: 999px; border: 1px solid ${T.successBorder}; background: ${T.successBg}; color: ${T.success}; font-size: 11px; font-weight: 700; }
        .lp-panel-body { padding: 18px 22px 20px; }
        .lp-info-card { border: 1px solid ${T.panelBorder}; border-radius: 14px; padding: 14px; background: ${T.inset}; margin-bottom: 16px; }
        .lp-info-text { font-size: 13px; line-height: 1.6; color: ${T.textSoft}; margin: 0; }
        .lp-chip-row { display: flex; gap: 7px; flex-wrap: wrap; margin-top: 10px; }
        .lp-chip { display: inline-flex; align-items: center; gap: 5px; padding: 4px 9px; border-radius: 8px; border: 1px solid ${T.chipBorder}; background: ${T.chipBg}; color: ${T.accentText}; font-size: 10.5px; font-weight: 600; }
        .lp-form-group { margin-bottom: 10px; }
        .lp-label { display: block; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.10em; color: ${T.textMuted}; margin-bottom: 6px; }
        .lp-input-wrap { position: relative; }
        .lp-input-icon { position: absolute; left: 13px; top: 50%; transform: translateY(-50%); color: ${T.textMuted}; pointer-events: none; }
        .lp-input { width: 100%; height: 44px; border-radius: 12px; border: 1px solid ${T.inputBorder}; background: ${T.inputBg}; color: ${T.text}; padding: 0 14px 0 40px; font-size: 13.5px; font-family: inherit; outline: none; transition: border-color 0.15s, box-shadow 0.15s; }
        .lp-input::placeholder { color: ${T.textMuted}; }
        .lp-input:focus { border-color: ${T.accent}; box-shadow: 0 0 0 3px ${T.inputFocus}; }
        .lp-input-error { border-color: ${T.dangerBorder}; box-shadow: 0 0 0 3px ${T.dangerBg}; }
        .lp-error-text { margin-top: 6px; font-size: 11px; line-height: 1.4; color: ${T.danger}; font-weight: 600; }
        .lp-cta { width: 100%; height: 46px; margin-top: 6px; border: 0; border-radius: 13px; display: inline-flex; align-items: center; justify-content: center; gap: 8px; font-size: 14px; font-weight: 700; font-family: inherit; letter-spacing: 0.01em; color: #fff; cursor: pointer; background: linear-gradient(135deg, ${T.accent} 0%, ${T.accentAlt} 100%); box-shadow: 0 12px 32px ${T.accentRing}; transition: transform 0.15s, box-shadow 0.15s, opacity 0.15s; }
        .lp-cta:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 18px 40px ${T.accentRing}; }
        .lp-cta:disabled { opacity: 0.45; cursor: not-allowed; }
        .lp-panel-footer { display: flex; justify-content: space-between; margin-top: 12px; padding-top: 12px; border-top: 1px solid ${T.panelBorder}; font-size: 10px; color: ${T.textMuted}; }
        @keyframes lp-pulse { 0%{box-shadow:0 0 0 0 rgba(16,217,160,0.4)} 70%{box-shadow:0 0 0 7px rgba(16,217,160,0)} 100%{box-shadow:0 0 0 0 rgba(16,217,160,0)} }
        @keyframes lp-fadein { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
        @media (max-width: 1100px) { .lp-main { grid-template-columns: 1fr; } .lp-hero { padding-right: 0; } }
        @media (max-width: 720px) { .lp-container { padding: 0 18px; } .lp-stats { grid-template-columns: 1fr; } .lp-stat + .lp-stat { border-left: none; border-top: 1px solid ${T.panelBorder}; } .lp-feat-grid { grid-template-columns: 1fr; } .lp-h1 { font-size: 36px; } }
      ` }} />

      <div className="lp-shell lp-grid">
        <div className="lp-glow-1" />
        <div className="lp-glow-2" />

        <header className="lp-topbar">
          <div className="lp-container lp-topbar-inner">
            <div className="lp-brand">
              <div className="lp-brandmark"><BrainCircuit size={16} /></div>
              <div>
                <div className="lp-brand-name">Cuemath</div>
                <div className="lp-brand-sub">Tutor Screening</div>
              </div>
            </div>
            <button type="button" className="lp-theme-btn" onClick={toggleTheme} aria-label="Toggle theme">
              {isDark ? <Sun size={15} /> : <Moon size={15} />}
            </button>
          </div>
        </header>

        <main className="lp-container lp-main">
          <section className="lp-hero">
            <div className="lp-live-badge">
              <span className="lp-live-dot" />
              Screening assistant live
            </div>

            <h1 className="lp-h1 font-display">
              Assess tutor{" "}
              <span className={`lp-h1-em${heroReady ? " ready" : ""}`}>communication</span>
              <br />through structured<br />voice interviews.
            </h1>

            <p className="lp-copy">
              A focused screening experience designed to evaluate clarity, warmth, patience, and teaching presence — consistent, scalable, and interviewer-independent.
            </p>

            <div className="lp-stats">
              {[
                { v: "5", u: "MIN", l: "Avg. session" },
                { v: "5", u: "DIMS", l: "Eval criteria" },
                { v: "AI", u: "GRADED", l: "Instant report" },
              ].map((s) => (
                <div key={s.l} className="lp-stat">
                  <div className="lp-stat-val">
                    <strong>{s.v}</strong>
                    <span>{s.u}</span>
                  </div>
                  <div className="lp-stat-label">{s.l}</div>
                </div>
              ))}
            </div>

            <div className="lp-feat-grid">
              <div className="lp-feat-card">
                <div className="lp-feat-eyebrow">
                  <BarChart3 size={13} color={T.accentText} />
                  Assessment criteria
                </div>
                {dimensions.map((d) => (
                  <div key={d} className="lp-criteria-item">
                    <CheckCircle2 size={13} color={T.accentText} />
                    <span>{d}</span>
                  </div>
                ))}
              </div>
              <div className="lp-feat-card">
                <Waves size={17} color={T.success} />
                <div className="lp-feat-title">Standardized flow</div>
                <p className="lp-feat-copy">
                  Every candidate follows the same evaluation pattern — eliminating interviewer variance and improving hiring consistency.
                </p>
                <div className="lp-consistency">
                  <ShieldCheck size={13} />
                  Consistent evaluation path
                </div>
              </div>
            </div>
          </section>

          <section>
            <div className="lp-panel">
              <div className="lp-panel-head">
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div className="lp-avatar">M</div>
                  <div>
                    <div className="lp-maya-name">Maya</div>
                    <div className="lp-maya-role">AI Interviewer · Cuemath</div>
                  </div>
                </div>
                <div className="lp-ready-pill">Ready</div>
              </div>

              <div className="lp-panel-body">
                <div className="lp-info-card">
                  <p className="lp-info-text">
                    This interview takes around five minutes. You'll answer a short set of voice-based questions designed to understand how you explain, respond, and connect with students.
                  </p>
                  <div className="lp-chip-row">
                    <div className="lp-chip"><Mic size={11} />Voice-first</div>
                    <div className="lp-chip"><Clock3 size={11} />5 min</div>
                    <div className="lp-chip"><Sparkles size={11} />Instant report</div>
                  </div>
                </div>

                <div className="lp-form-group">
                  <label className="lp-label" htmlFor="lp-name">Full name</label>
                  <div className="lp-input-wrap">
                    <UserRound className="lp-input-icon" size={14} />
                    <input
                      id="lp-name"
                      className={`lp-input ${(nameTouched || cleanName.length > 0) && !isNameValid ? "lp-input-error" : ""}`}
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      onBlur={() => setNameTouched(true)}
                      placeholder="Enter your full name"
                      autoComplete="name"
                    />
                  </div>
                  {(nameTouched || cleanName.length > 0) && !isNameValid && (
                    <div className="lp-error-text">{nameError}</div>
                  )}
                </div>

                <div className="lp-form-group">
                  <label className="lp-label" htmlFor="lp-email">Email address</label>
                  <div className="lp-input-wrap">
                    <Mail className="lp-input-icon" size={14} />
                    <input
                      id="lp-email"
                      className={`lp-input ${(emailTouched || cleanEmail.length > 0) && !isEmailValid ? "lp-input-error" : ""}`}
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      onBlur={() => setEmailTouched(true)}
                      placeholder="Enter your email address --> name@gmail.com"
                      autoComplete="email"
                    />
                  </div>
                  {(emailTouched || cleanEmail.length > 0) && !isEmailValid && (
                    <div className="lp-error-text">{emailError}</div>
                  )}
                </div>

                <button type="button" className="lp-cta" onClick={handleStart} disabled={!canStart}>
                  Begin Assessment
                  <ArrowRight size={15} />
                </button>

                <div className="lp-panel-footer">
                  <span>Microphone access required</span>
                  <span>Best on Chrome</span>
                </div>
              </div>
            </div>
          </section>
        </main>
      </div>
    </>
  );
}