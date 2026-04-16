"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  CheckCircle,
  XCircle,
  AlertTriangle,
  TrendingUp,
  MessageSquare,
  Heart,
  Clock,
  Layers,
  BookOpen,
  ChevronRight,
  Download,
  Sun,
  Moon,
  BrainCircuit,
  Star,
  ArrowLeft,
  Info,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

type DimensionScore = {
  score: number;
  label: string;
  feedback: string;
  highlights: string[];
};

type AssessmentResult = {
  candidateName: string;
  overallScore: number;
  overallLabel: string;
  summary: string;
  recommendation: "Proceed" | "Consider" | "Decline";
  dimensions: {
    communication: DimensionScore;
    warmth: DimensionScore;
    patience: DimensionScore;
    simplification: DimensionScore;
    fluency: DimensionScore;
  };
  strengths: string[];
  improvements: string[];
  generatedAt: string;
  _fallback?: boolean;
};

// ─── Default fallback (last resort — prevents blank page) ─────────────────────

function buildEmptyAssessment(name: string): AssessmentResult {
  const score = 5.5;
  const dim = (label: string): DimensionScore => ({
    score,
    label: "Adequate",
    feedback: `${label} data was not captured. Please review the transcript manually.`,
    highlights: ["Manual review recommended"],
  });
  return {
    candidateName: name || "Candidate",
    overallScore: score,
    overallLabel: "Adequate",
    summary: "The interview was completed but detailed assessment data was not available. Please review the transcript manually.",
    recommendation: "Consider",
    dimensions: {
      communication: dim("Communication"),
      warmth: dim("Warmth"),
      patience: dim("Patience"),
      simplification: dim("Simplification"),
      fluency: dim("Fluency"),
    },
    strengths: ["Completed the full interview process"],
    improvements: ["Detailed assessment unavailable — manual review required"],
    generatedAt: new Date().toISOString(),
    _fallback: true,
  };
}

/**
 * Safely parse and normalize an assessment result from any source.
 * Never throws — always returns a valid AssessmentResult.
 */
function safeParseAssessment(raw: unknown, fallbackName: string): AssessmentResult {
  if (!raw || typeof raw !== "object") return buildEmptyAssessment(fallbackName);

  const p = raw as Record<string, unknown>;
  const candidateName = typeof p.candidateName === "string" && p.candidateName.trim()
    ? p.candidateName.trim()
    : fallbackName || "Candidate";

  const clampScore = (n: unknown, def = 5): number => {
    const num = typeof n === "number" ? n : parseFloat(String(n));
    if (isNaN(num)) return def;
    return Math.min(Math.max(Math.round(num * 10) / 10, 1), 10);
  };

  const scoreLabel = (s: number): string => {
    if (s >= 9) return "Exceptional";
    if (s >= 8) return "Excellent";
    if (s >= 7) return "Good";
    if (s >= 6) return "Satisfactory";
    if (s >= 5) return "Adequate";
    if (s >= 4) return "Needs Improvement";
    return "Poor";
  };

  const normDim = (d: unknown, def = 5): DimensionScore => {
    if (!d || typeof d !== "object") {
      return { score: def, label: scoreLabel(def), feedback: "Not assessed.", highlights: [] };
    }
    const obj = d as Record<string, unknown>;
    const score = clampScore(obj.score, def);
    return {
      score,
      label: typeof obj.label === "string" && obj.label ? obj.label : scoreLabel(score),
      feedback: typeof obj.feedback === "string" && obj.feedback ? obj.feedback : "No detailed feedback available.",
      highlights: Array.isArray(obj.highlights)
        ? (obj.highlights as unknown[]).filter((h): h is string => typeof h === "string" && h.trim().length > 0)
        : [],
    };
  };

  const dims = (p.dimensions && typeof p.dimensions === "object" ? p.dimensions : {}) as Record<string, unknown>;
  const overallScore = clampScore(p.overallScore, 5);

  const rec = p.recommendation;
  const recommendation: "Proceed" | "Consider" | "Decline" =
    rec === "Proceed" ? "Proceed" : rec === "Decline" ? "Decline" : "Consider";

  return {
    candidateName,
    overallScore,
    overallLabel: typeof p.overallLabel === "string" && p.overallLabel ? p.overallLabel : scoreLabel(overallScore),
    summary: typeof p.summary === "string" && p.summary ? p.summary : `${candidateName} completed the screening interview.`,
    recommendation,
    dimensions: {
      communication: normDim(dims.communication, overallScore),
      warmth: normDim(dims.warmth, overallScore),
      patience: normDim(dims.patience, overallScore),
      simplification: normDim(dims.simplification, overallScore),
      fluency: normDim(dims.fluency, overallScore),
    },
    strengths: Array.isArray(p.strengths)
      ? (p.strengths as unknown[]).filter((s): s is string => typeof s === "string" && s.trim().length > 0)
      : ["Completed the interview"],
    improvements: Array.isArray(p.improvements)
      ? (p.improvements as unknown[]).filter((s): s is string => typeof s === "string" && s.trim().length > 0)
      : [],
    generatedAt: typeof p.generatedAt === "string" ? p.generatedAt : new Date().toISOString(),
    _fallback: p._fallback === true,
  };
}

// ─── Design tokens ────────────────────────────────────────────────────────────

const FONTS = `
@import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;1,9..40,400&family=DM+Serif+Display:ital@0;1&display=swap');
*,*::before,*::after{box-sizing:border-box;}
html,body{margin:0;padding:0;font-family:"DM Sans",system-ui,sans-serif;}
`;

function getTokens(isDark: boolean) {
  return isDark ? {
    pageBg: "#080C14", pageBg2: "#0C1220",
    gridLine: "rgba(255,255,255,0.03)",
    text: "#F0F4FF", textSoft: "rgba(220,228,255,0.68)", textMuted: "rgba(220,228,255,0.38)",
    surface: "#0E1628", surfaceElevated: "#111E35", inset: "#0A1120",
    border: "rgba(255,255,255,0.08)", borderStrong: "rgba(255,255,255,0.13)",
    accent: "#4F7BFF", accentAlt: "#8B5CF6", accentGlow: "rgba(79,123,255,0.16)",
    accentRing: "rgba(79,123,255,0.22)", accentText: "#7BA8FF",
    success: "#10D9A0", successBg: "rgba(16,217,160,0.08)", successBorder: "rgba(16,217,160,0.18)",
    danger: "#F87171", dangerBg: "rgba(248,113,113,0.10)", dangerBorder: "rgba(248,113,113,0.22)",
    warning: "#FBBF24", warningBg: "rgba(251,191,36,0.10)", warningBorder: "rgba(251,191,36,0.22)",
    topbar: "rgba(8,12,20,0.88)",
    shadow: "0 24px 64px rgba(0,0,0,0.50)", shadowMd: "0 8px 28px rgba(0,0,0,0.28)",
    heroGlow1: "rgba(79,123,255,0.10)", heroGlow2: "rgba(139,92,246,0.07)",
  } : {
    pageBg: "#F4F6FB", pageBg2: "#EBF0FF",
    gridLine: "rgba(13,21,38,0.04)",
    text: "#0D1526", textSoft: "rgba(13,21,38,0.64)", textMuted: "rgba(13,21,38,0.38)",
    surface: "#FFFFFF", surfaceElevated: "#FFFFFF", inset: "#F5F8FF",
    border: "rgba(13,21,38,0.08)", borderStrong: "rgba(13,21,38,0.14)",
    accent: "#3B63E8", accentAlt: "#7C3AED", accentGlow: "rgba(59,99,232,0.10)",
    accentRing: "rgba(59,99,232,0.14)", accentText: "#3B63E8",
    success: "#059669", successBg: "rgba(5,150,105,0.07)", successBorder: "rgba(5,150,105,0.18)",
    danger: "#DC2626", dangerBg: "rgba(220,38,38,0.06)", dangerBorder: "rgba(220,38,38,0.18)",
    warning: "#D97706", warningBg: "rgba(217,119,6,0.07)", warningBorder: "rgba(217,119,6,0.18)",
    topbar: "rgba(244,246,251,0.90)",
    shadow: "0 24px 64px rgba(13,21,38,0.09)", shadowMd: "0 8px 28px rgba(13,21,38,0.07)",
    heroGlow1: "rgba(59,99,232,0.08)", heroGlow2: "rgba(124,58,237,0.05)",
  };
}

// ─── Dimension config ─────────────────────────────────────────────────────────

const DIM_CONFIG: Array<{
  key: keyof AssessmentResult["dimensions"];
  label: string;
  Icon: React.ElementType;
  description: string;
}> = [
  { key: "communication", label: "Communication", Icon: MessageSquare, description: "Clarity and logical structure of expression" },
  { key: "warmth", label: "Warmth & Empathy", Icon: Heart, description: "Encouragement, emotional intelligence, tone" },
  { key: "patience", label: "Patience", Icon: Clock, description: "Handling struggling students and difficult moments" },
  { key: "simplification", label: "Simplification", Icon: Layers, description: "Use of analogies, examples, child-appropriate language" },
  { key: "fluency", label: "English Fluency", Icon: BookOpen, description: "Grammar, vocabulary, natural expression" },
];

// ─── Score ring component ─────────────────────────────────────────────────────

function ScoreRing({ score, size = 140, T }: { score: number; size?: number; T: ReturnType<typeof getTokens> }) {
  const r = (size - 16) / 2;
  const circ = 2 * Math.PI * r;
  const fill = (score / 10) * circ;
  const color = score >= 7 ? T.success : score >= 5 ? T.warning : T.danger;

  return (
    <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={T.border} strokeWidth={8} />
      <circle
        cx={size / 2} cy={size / 2} r={r}
        fill="none" stroke={color} strokeWidth={8}
        strokeDasharray={circ}
        strokeDashoffset={circ - fill}
        strokeLinecap="round"
        style={{ transition: "stroke-dashoffset 1.2s cubic-bezier(0.4,0,0.2,1)" }}
      />
    </svg>
  );
}

// ─── Gauge bar ────────────────────────────────────────────────────────────────

function GaugeBar({ score, T }: { score: number; T: ReturnType<typeof getTokens> }) {
  const color = score >= 7 ? T.success : score >= 5 ? T.warning : T.danger;
  return (
    <div style={{ height: 6, borderRadius: 999, background: T.border, overflow: "hidden", flex: 1 }}>
      <div style={{
        height: "100%", width: `${(score / 10) * 100}%`,
        background: color, borderRadius: 999,
        transition: "width 1s cubic-bezier(0.4,0,0.2,1)",
      }} />
    </div>
  );
}

// ─── Recommendation badge ─────────────────────────────────────────────────────

function RecBadge({ rec, T }: { rec: "Proceed" | "Consider" | "Decline"; T: ReturnType<typeof getTokens> }) {
  const config = {
    Proceed: { icon: <CheckCircle size={16} />, color: T.success, bg: T.successBg, border: T.successBorder },
    Consider: { icon: <AlertTriangle size={16} />, color: T.warning, bg: T.warningBg, border: T.warningBorder },
    Decline: { icon: <XCircle size={16} />, color: T.danger, bg: T.dangerBg, border: T.dangerBorder },
  }[rec];

  return (
    <div style={{
      display: "inline-flex", alignItems: "center", gap: 8,
      padding: "8px 16px", borderRadius: 999,
      border: `1px solid ${config.border}`, background: config.bg, color: config.color,
      fontSize: 14, fontWeight: 700,
    }}>
      {config.icon} {rec}
    </div>
  );
}

// ─── Main Report Page ─────────────────────────────────────────────────────────

export default function ReportPage() {
  const router = useRouter();
  const [assessment, setAssessment] = useState<AssessmentResult | null>(null);
  const [transcript, setTranscript] = useState<string>("");
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [loadError, setLoadError] = useState<string>("");
  const [showTranscript, setShowTranscript] = useState(false);

  const T = getTokens(theme === "dark");

  useEffect(() => {
    const savedTheme = localStorage.getItem("maya_theme") as "dark" | "light" | null;
    if (savedTheme) setTheme(savedTheme);

    // Load assessment — never throw, always recover
    const loadAssessment = () => {
      const fallbackName = localStorage.getItem("candidate_name") || "Candidate";

      try {
        const raw = localStorage.getItem("assessment_result");
        if (!raw || !raw.trim()) {
          console.warn("report: no assessment_result in localStorage");
          setLoadError("Assessment data not found. Showing a default report.");
          setAssessment(buildEmptyAssessment(fallbackName));
          return;
        }

        let parsed: unknown;
        try {
          parsed = JSON.parse(raw);
        } catch (parseErr) {
          console.error("report: JSON.parse failed:", parseErr, "raw:", raw.slice(0, 200));
          setLoadError("Assessment data was corrupted. Showing a default report.");
          setAssessment(buildEmptyAssessment(fallbackName));
          return;
        }

        // Normalize — never throws
        const result = safeParseAssessment(parsed, fallbackName);
        setAssessment(result);

        if (result._fallback) {
          setLoadError("Assessment was generated in fallback mode — scores are approximate.");
        }
      } catch (err) {
        console.error("report: unexpected error:", err);
        setLoadError("An unexpected error occurred loading the report.");
        setAssessment(buildEmptyAssessment(fallbackName));
      }

      // Load transcript separately — non-critical
      try {
        const t = localStorage.getItem("interview_transcript");
        if (t) setTranscript(t);
      } catch { /* not critical */ }
    };

    loadAssessment();
  }, []);

  const toggleTheme = () => {
    setTheme((t) => {
      const next = t === "dark" ? "light" : "dark";
      localStorage.setItem("maya_theme", next);
      return next;
    });
  };

  const handleDownload = () => {
    if (!assessment) return;
    const lines: string[] = [
      `CUEMATH TUTOR SCREENING REPORT`,
      `${"=".repeat(50)}`,
      `Candidate: ${assessment.candidateName}`,
      `Date: ${new Date(assessment.generatedAt).toLocaleString()}`,
      `Overall Score: ${assessment.overallScore}/10 — ${assessment.overallLabel}`,
      `Recommendation: ${assessment.recommendation}`,
      ``,
      `SUMMARY`,
      `-`.repeat(40),
      assessment.summary,
      ``,
      `DIMENSION SCORES`,
      `-`.repeat(40),
      ...DIM_CONFIG.map((d) => {
        const dim = assessment.dimensions[d.key];
        return `${d.label}: ${dim.score}/10 — ${dim.label}\n${dim.feedback}`;
      }),
      ``,
      `STRENGTHS`,
      `-`.repeat(40),
      ...assessment.strengths.map((s) => `• ${s}`),
      ``,
      `AREAS FOR IMPROVEMENT`,
      `-`.repeat(40),
      ...assessment.improvements.map((s) => `• ${s}`),
      ``,
      assessment._fallback ? `[Note: Generated in fallback mode — manual review recommended]` : "",
      ``,
      `Generated by Cuemath Maya AI Screener`,
    ];

    if (transcript) {
      lines.push(``, `INTERVIEW TRANSCRIPT`, `=`.repeat(50), transcript);
    }

    // FIX: revoke the object URL immediately after click to prevent the
    // browser from holding a reference to the blob for the lifetime of the page.
    const blob = new Blob([lines.join("\n")], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `cuemath-report-${assessment.candidateName.replace(/\s+/g, "-").toLowerCase()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    // Schedule revocation after the browser has had a chance to start the
    // download — immediate revocation can cancel the download in some browsers.
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  // ─── CSS ───────────────────────────────────────────────────────────────────

  const css = `
    .rp-shell { min-height:100vh; background:linear-gradient(160deg,${T.pageBg} 0%,${T.pageBg2} 100%); color:${T.text}; font-family:"DM Sans",system-ui,sans-serif; }
    .rp-grid::before { content:""; position:absolute; inset:0; pointer-events:none; z-index:0; background-image:linear-gradient(${T.gridLine} 1px,transparent 1px),linear-gradient(90deg,${T.gridLine} 1px,transparent 1px); background-size:48px 48px; }
    .rp-topbar { position:sticky; top:0; z-index:100; height:62px; display:flex; align-items:center; border-bottom:1px solid ${T.border}; background:${T.topbar}; backdrop-filter:blur(20px); -webkit-backdrop-filter:blur(20px); }
    .rp-container { max-width:1200px; margin:0 auto; padding:0 28px; width:100%; }
    .rp-brand { display:flex; align-items:center; gap:10px; }
    .rp-brandmark { width:34px; height:34px; border-radius:10px; background:linear-gradient(135deg,${T.accent},${T.accentAlt}); display:grid; place-items:center; color:#fff; }
    .rp-brand-name { font-size:15px; font-weight:700; letter-spacing:-0.02em; color:${T.text}; }
    .rp-brand-sub { font-size:10px; text-transform:uppercase; letter-spacing:0.10em; color:${T.textMuted}; margin-top:1px; }
    .rp-theme-btn { width:36px; height:36px; border-radius:10px; border:1px solid ${T.border}; background:transparent; color:${T.textSoft}; display:grid; place-items:center; cursor:pointer; transition:border-color 0.15s,background 0.15s; }
    .rp-theme-btn:hover { border-color:${T.borderStrong}; background:${T.surfaceElevated}; }
    .rp-card { border:1px solid ${T.border}; border-radius:20px; background:${T.surface}; box-shadow:${T.shadow}; }
    .rp-panel { border:1px solid ${T.border}; border-radius:16px; background:${T.surfaceElevated}; }
    .rp-inset { border:1px solid ${T.border}; border-radius:12px; background:${T.inset}; }
    .rp-btn-primary { display:inline-flex; align-items:center; justify-content:center; gap:8px; border:0; border-radius:12px; padding:0 20px; height:44px; font-size:14px; font-weight:700; font-family:inherit; color:#fff; cursor:pointer; background:linear-gradient(135deg,${T.accent} 0%,${T.accentAlt} 100%); box-shadow:0 10px 28px ${T.accentRing}; transition:transform 0.15s,box-shadow 0.15s; }
    .rp-btn-primary:hover { transform:translateY(-1px); box-shadow:0 16px 36px ${T.accentRing}; }
    .rp-btn-secondary { display:inline-flex; align-items:center; gap:7px; border:1px solid ${T.border}; border-radius:12px; padding:0 18px; height:42px; font-size:13px; font-weight:600; font-family:inherit; color:${T.textSoft}; cursor:pointer; background:transparent; transition:border-color 0.15s,color 0.15s,background 0.15s; }
    .rp-btn-secondary:hover { border-color:${T.borderStrong}; color:${T.text}; background:${T.surfaceElevated}; }
    .rp-chip-label { font-size:10px; font-weight:800; text-transform:uppercase; letter-spacing:0.12em; color:${T.textMuted}; }
    .rp-dim-card { border:1px solid ${T.border}; border-radius:16px; background:${T.surfaceElevated}; padding:20px; transition:border-color 0.2s,box-shadow 0.2s; }
    .rp-dim-card:hover { border-color:${T.borderStrong}; box-shadow:${T.shadowMd}; }
    .rp-warn-box { border:1px solid ${T.warningBorder}; background:${T.warningBg}; border-radius:12px; padding:12px 16px; font-size:13px; color:${T.warning}; display:flex; align-items:flex-start; gap:10px; }
    .rp-transcript-box { border:1px solid ${T.border}; border-radius:12px; background:${T.inset}; padding:20px; font-size:13px; line-height:1.8; color:${T.textSoft}; white-space:pre-wrap; max-height:480px; overflow-y:auto; font-family:monospace; }
    @keyframes rp-fadein { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
    .rp-fadein { animation:rp-fadein 0.5s ease both; }
    .rp-toggle-btn { border:0; background:none; cursor:pointer; color:${T.accentText}; font-size:13px; font-weight:600; font-family:inherit; display:flex; align-items:center; gap:6px; padding:0; }
    .rp-toggle-btn:hover { text-decoration:underline; }
  `;

  // ─── Loading state ─────────────────────────────────────────────────────────

  if (!assessment) {
    return (
      <>
        <style dangerouslySetInnerHTML={{ __html: FONTS + css }} />
        <div className="rp-shell" style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh" }}>
          <div style={{ textAlign: "center" }}>
            <div style={{ width: 48, height: 48, border: `3px solid ${T.accent}`, borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto 20px" }} />
            <p style={{ color: T.textSoft, fontSize: 14 }}>Loading your report…</p>
          </div>
          <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        </div>
      </>
    );
  }

  // ─── Score color ───────────────────────────────────────────────────────────

  const scoreColor = assessment.overallScore >= 7 ? T.success : assessment.overallScore >= 5 ? T.warning : T.danger;

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: FONTS + css }} />

      <div className="rp-shell rp-grid" style={{ position: "relative" }}>
        <div className="rp-grid" style={{ position: "absolute", inset: 0 }} />

        {/* Topbar */}
        <header className="rp-topbar">
          <div className="rp-container" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
              <div className="rp-brand">
                <div className="rp-brandmark"><BrainCircuit size={16} /></div>
                <div>
                  <div className="rp-brand-name">Cuemath</div>
                  <div className="rp-brand-sub">Screening Report</div>
                </div>
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <button className="rp-btn-secondary" onClick={handleDownload} style={{ height: 38, fontSize: 12 }}>
                <Download size={13} /> Download Report
              </button>
              <button className="rp-btn-secondary" onClick={() => router.push("/")} style={{ height: 38, fontSize: 12 }}>
                <ArrowLeft size={13} /> Home
              </button>
              <button className="rp-theme-btn" onClick={toggleTheme}>
                {theme === "dark" ? <Sun size={14} /> : <Moon size={14} />}
              </button>
            </div>
          </div>
        </header>

        <main className="rp-container" style={{ position: "relative", zIndex: 1, padding: "32px 28px 64px" }}>

          {/* Fallback warning */}
          {loadError && (
            <div className="rp-warn-box rp-fadein" style={{ marginBottom: 20 }}>
              <Info size={15} style={{ flexShrink: 0, marginTop: 1 }} />
              <span>{loadError}</span>
            </div>
          )}

          {/* Hero — Score + Summary */}
          <div className="rp-card rp-fadein" style={{ padding: "36px 40px", marginBottom: 24, display: "grid", gridTemplateColumns: "auto 1fr", gap: 40, alignItems: "center" }}>
            {/* Score ring */}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
              <div style={{ position: "relative", width: 140, height: 140 }}>
                <ScoreRing score={assessment.overallScore} size={140} T={T} />
                <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
                  <span style={{ fontSize: 32, fontWeight: 800, letterSpacing: "-0.04em", color: scoreColor, lineHeight: 1 }}>
                    {assessment.overallScore.toFixed(1)}
                  </span>
                  <span style={{ fontSize: 11, color: T.textMuted, marginTop: 2 }}>out of 10</span>
                </div>
              </div>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: scoreColor }}>{assessment.overallLabel}</div>
                <div style={{ marginTop: 8 }}>
                  <RecBadge rec={assessment.recommendation} T={T} />
                </div>
              </div>
            </div>

            {/* Summary */}
            <div>
              <div className="rp-chip-label" style={{ marginBottom: 10 }}>Candidate Assessment</div>
              <h1 style={{ margin: "0 0 8px", fontSize: 28, fontWeight: 700, letterSpacing: "-0.035em", lineHeight: 1.2 }}>
                {assessment.candidateName}
              </h1>
              <p style={{ margin: "0 0 20px", fontSize: 15, lineHeight: 1.75, color: T.textSoft }}>
                {assessment.summary}
              </p>
              <div style={{ fontSize: 12, color: T.textMuted }}>
                Generated {new Date(assessment.generatedAt).toLocaleString()}
                {assessment._fallback && " · Fallback mode"}
              </div>
            </div>
          </div>

          {/* Two-column grid: Dimensions + Strengths/Improvements */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 360px", gap: 24, marginBottom: 24 }}>

            {/* Dimensions */}
            <div>
              <div className="rp-chip-label" style={{ marginBottom: 16 }}>Dimension Scores</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                {DIM_CONFIG.map(({ key, label, Icon, description }, i) => {
                  const dim = assessment.dimensions[key];
                  const color = dim.score >= 7 ? T.success : dim.score >= 5 ? T.warning : T.danger;
                  return (
                    <div key={key} className="rp-dim-card rp-fadein" style={{ animationDelay: `${i * 0.07}s` }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
                        <div style={{ width: 38, height: 38, borderRadius: 11, background: T.accentGlow, border: `1px solid ${T.accentRing}`, display: "grid", placeItems: "center", flexShrink: 0 }}>
                          <Icon size={17} color={T.accentText} />
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                            <div>
                              <span style={{ fontSize: 14, fontWeight: 700, color: T.text }}>{label}</span>
                              <span style={{ fontSize: 11, color: T.textMuted, marginLeft: 8 }}>{description}</span>
                            </div>
                            <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
                              <span style={{ fontSize: 18, fontWeight: 800, color, letterSpacing: "-0.03em" }}>{dim.score.toFixed(1)}</span>
                              <span style={{ fontSize: 11, color: T.textMuted }}>/10</span>
                              <span style={{ fontSize: 11, fontWeight: 700, color, padding: "2px 8px", borderRadius: 999, border: `1px solid ${color}22`, background: `${color}11` }}>{dim.label}</span>
                            </div>
                          </div>
                          <GaugeBar score={dim.score} T={T} />
                        </div>
                      </div>
                      <p style={{ margin: "0 0 12px", fontSize: 13.5, lineHeight: 1.65, color: T.textSoft }}>
                        {dim.feedback}
                      </p>
                      {dim.highlights.length > 0 && (
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
                          {dim.highlights.map((h, j) => (
                            <span key={j} style={{ fontSize: 11.5, padding: "4px 10px", borderRadius: 999, border: `1px solid ${T.border}`, background: T.inset, color: T.textSoft }}>
                              {h}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Right column: Strengths + Improvements + Mini score grid */}
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

              {/* Score summary grid */}
              <div className="rp-panel rp-fadein" style={{ padding: 18 }}>
                <div className="rp-chip-label" style={{ marginBottom: 14 }}>Score Summary</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {DIM_CONFIG.map(({ key, label }) => {
                    const dim = assessment.dimensions[key];
                    const color = dim.score >= 7 ? T.success : dim.score >= 5 ? T.warning : T.danger;
                    return (
                      <div key={key} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <span style={{ fontSize: 12, color: T.textSoft, width: 110, flexShrink: 0 }}>{label}</span>
                        <GaugeBar score={dim.score} T={T} />
                        <span style={{ fontSize: 13, fontWeight: 700, color, width: 28, textAlign: "right", flexShrink: 0 }}>{dim.score.toFixed(0)}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Strengths */}
              <div className="rp-panel rp-fadein" style={{ padding: 18 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                  <TrendingUp size={14} color={T.success} />
                  <span className="rp-chip-label" style={{ color: T.success }}>Strengths</span>
                </div>
                <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 8 }}>
                  {assessment.strengths.map((s, i) => (
                    <li key={i} style={{ display: "flex", alignItems: "flex-start", gap: 9, fontSize: 13, lineHeight: 1.55, color: T.textSoft }}>
                      <Star size={12} color={T.success} style={{ flexShrink: 0, marginTop: 3 }} />
                      {s}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Improvements */}
              {assessment.improvements.length > 0 && (
                <div className="rp-panel rp-fadein" style={{ padding: 18 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                    <ChevronRight size={14} color={T.warning} />
                    <span className="rp-chip-label" style={{ color: T.warning }}>Areas to Improve</span>
                  </div>
                  <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 8 }}>
                    {assessment.improvements.map((s, i) => (
                      <li key={i} style={{ display: "flex", alignItems: "flex-start", gap: 9, fontSize: 13, lineHeight: 1.55, color: T.textSoft }}>
                        <span style={{ width: 5, height: 5, borderRadius: "50%", background: T.warning, flexShrink: 0, marginTop: 6 }} />
                        {s}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Actions */}
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <button className="rp-btn-primary" onClick={handleDownload} style={{ width: "100%", height: 46 }}>
                  <Download size={15} /> Download Full Report
                </button>
                <button className="rp-btn-secondary" onClick={() => router.push("/")} style={{ width: "100%", height: 42, justifyContent: "center" }}>
                  <ArrowLeft size={14} /> Return to Home
                </button>
              </div>
            </div>
          </div>

          {/* Transcript toggle */}
          {transcript && (
            <div className="rp-card rp-fadein" style={{ padding: 24 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: showTranscript ? 16 : 0 }}>
                <div>
                  <div className="rp-chip-label">Interview Transcript</div>
                  <p style={{ margin: "4px 0 0", fontSize: 13, color: T.textSoft }}>Full conversation recorded during the screening</p>
                </div>
                <button className="rp-toggle-btn" onClick={() => setShowTranscript((v) => !v)}>
                  {showTranscript ? "Hide transcript" : "View transcript"} <ChevronRight size={13} style={{ transform: showTranscript ? "rotate(90deg)" : "rotate(0deg)", transition: "transform 0.2s" }} />
                </button>
              </div>
              {showTranscript && (
                <div className="rp-transcript-box">
                  {transcript}
                </div>
              )}
            </div>
          )}
        </main>
      </div>
    </>
  );
}


