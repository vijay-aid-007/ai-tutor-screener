"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import {
  CheckCircle,
  XCircle,
  AlertCircle,
  Download,
  RotateCcw,
  Star,
  Quote,
  Sparkles,
  FileText,
  BarChart2,
  Moon,
  Sun,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Dimension {
  score: number;
  evidence: string;
}

interface Assessment {
  candidate_name: string;
  recommendation: "PROCEED" | "CONSIDER" | "REJECT";
  overall_score: number;
  summary: string;
  dimensions: {
    communication_clarity: Dimension;
    warmth: Dimension;
    patience: Dimension;
    ability_to_simplify: Dimension;
    english_fluency: Dimension;
  };
  strengths: string[];
  concerns: string[];
  interviewer_notes: string;
  source?: "groq" | "fallback";
  fallbackReason?: string;
}

type ThemeMode = "dark" | "light";

// ─── Constants ────────────────────────────────────────────────────────────────

const DIMENSION_LABELS: Record<string, string> = {
  communication_clarity: "Clarity",
  warmth: "Warmth",
  patience: "Patience",
  ability_to_simplify: "Simplicity",
  english_fluency: "Fluency",
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function clampScore(score: number) {
  return Math.max(1, Math.min(10, Math.round(score) || 1));
}

function isFallbackAssessment(assessment: Assessment): boolean {
  return assessment.source === "fallback";
}

function computeConfidence(assessment: Assessment): { label: string; pct: number; isLow: boolean } {
  if (assessment.source === "fallback") {
    return { label: "Low — fallback mode", pct: 40, isLow: true };
  }

  const dimEntries = Object.values(assessment.dimensions ?? {});

  if (dimEntries.length === 0) {
    return { label: "Low", pct: 35, isLow: true };
  }

  const dimScores = dimEntries.map((d) => clampScore(d.score));
  const avg = dimScores.reduce((a, b) => a + b, 0) / dimScores.length;
  const spread = dimScores.length > 1
    ? Math.max(...dimScores) - Math.min(...dimScores)
    : 0;

  const evidenceCount = dimEntries.filter(
    (d) => d.evidence && d.evidence.length > 20 && d.evidence !== "Insufficient evidence from transcript"
  ).length;

  let score = 50;
  score += (evidenceCount / dimEntries.length) * 30;
  score -= spread * 2;
  score += Math.min(avg - 1, 9) * 2;

  const pct = Math.round(Math.max(30, Math.min(95, score)));

  if (pct >= 75) return { label: "High", pct, isLow: false };
  if (pct >= 55) return { label: "Moderate", pct, isLow: false };
  return { label: "Low", pct, isLow: true };
}

function getScoreTextColor(score: number, isDark: boolean) {
  if (score >= 7) return isDark ? "text-emerald-300" : "text-emerald-700";
  if (score >= 5) return isDark ? "text-amber-300" : "text-amber-700";
  return isDark ? "text-rose-300" : "text-rose-700";
}

function getScoreBarColor(score: number) {
  if (score >= 7) return "bg-emerald-500";
  if (score >= 5) return "bg-amber-500";
  return "bg-rose-500";
}

function getRecommendationConfig(
  recommendation: Assessment["recommendation"],
  isDark: boolean
) {
  const darkMap = {
    PROCEED: { icon: CheckCircle, color: "text-emerald-300", bg: "bg-emerald-400/10 border-emerald-400/20", label: "Proceed to Next Round" },
    CONSIDER: { icon: AlertCircle, color: "text-amber-300", bg: "bg-amber-400/10 border-amber-400/20", label: "Consider with Review" },
    REJECT: { icon: XCircle, color: "text-rose-300", bg: "bg-rose-400/10 border-rose-400/20", label: "Do Not Proceed" },
  };
  const lightMap = {
    PROCEED: { icon: CheckCircle, color: "text-emerald-700", bg: "bg-emerald-50 border-emerald-200", label: "Proceed to Next Round" },
    CONSIDER: { icon: AlertCircle, color: "text-amber-700", bg: "bg-amber-50 border-amber-200", label: "Consider with Review" },
    REJECT: { icon: XCircle, color: "text-rose-700", bg: "bg-rose-50 border-rose-200", label: "Do Not Proceed" },
  };
  return isDark ? darkMap[recommendation] : lightMap[recommendation];
}

// FIX: Use indexOf to split only on the FIRST colon — preserves colons in content
// (e.g. "ratio 3:4", "time 10:30 AM", "Maya: Great, the ratio is 3:1 here").
function parseTranscriptLine(line: string): { speaker: string; content: string } | null {
  const colonIdx = line.indexOf(":");
  if (colonIdx === -1) return null;
  const speaker = line.slice(0, colonIdx).trim();
  const content = line.slice(colonIdx + 1).trim();
  if (!speaker || content.length < 1) return null;
  return { speaker, content };
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function ReportPage() {
  const router = useRouter();
  const [assessment, setAssessment] = useState<Assessment | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"overview" | "details" | "transcript">("overview");
  const [transcript, setTranscript] = useState("");
  const [theme, setTheme] = useState<ThemeMode>("dark");

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme_mode") as ThemeMode | null;
    if (savedTheme === "light" || savedTheme === "dark") setTheme(savedTheme);
  }, []);

  useEffect(() => { localStorage.setItem("theme_mode", theme); }, [theme]);

  useEffect(() => {
    const result = localStorage.getItem("assessment_result");
    const savedTranscript = localStorage.getItem("interview_transcript");
    if (result) {
      try { setAssessment(JSON.parse(result) as Assessment); } catch { setAssessment(null); }
      setTranscript(savedTranscript ?? "");
    }
    setLoading(false);
  }, []);

  const isDark = theme === "dark";

  const T = useMemo(
    () =>
      isDark
        ? {
            page: "bg-[radial-gradient(circle_at_top,rgba(124,58,237,0.12),transparent_24%),linear-gradient(180deg,#060D1A_0%,#081120_42%,#060D1A_100%)] text-white",
            header: "bg-[#081221]/78 border-white/10 backdrop-blur-xl",
            card: "border border-white/10 bg-[linear-gradient(180deg,rgba(16,26,45,0.98)_0%,rgba(10,18,34,0.98)_100%)] shadow-[0_20px_56px_rgba(2,8,23,0.42)]",
            panel: "border border-white/10 bg-[linear-gradient(180deg,rgba(12,22,40,0.95)_0%,rgba(9,18,34,0.95)_100%)]",
            soft: "text-white/68",
            muted: "text-white/48",
            strong: "text-white",
            chip: "border-violet-400/20 bg-violet-400/10 text-violet-300",
            buttonSecondary: "border-white/12 bg-white/[0.04] text-white/75 hover:bg-white/[0.07] hover:text-white",
            progressTrack: "bg-white/10",
            quote: "bg-white/[0.03] border-white/10",
            transcriptMaya: "bg-violet-500/10 border-violet-400/20",
            transcriptCandidate: "bg-white/[0.03] border-white/10",
            emptyCard: "border border-white/10 bg-[linear-gradient(180deg,rgba(16,26,45,0.98)_0%,rgba(10,18,34,0.98)_100%)]",
            summaryPanel: "border border-white/10 bg-[linear-gradient(180deg,rgba(10,20,36,0.94)_0%,rgba(8,17,32,0.94)_100%)]",
            toggleBg: "bg-white/[0.04]",
            toggleText: "text-white/70",
          }
        : {
            page: "bg-[radial-gradient(circle_at_top,rgba(124,58,237,0.08),transparent_22%),linear-gradient(180deg,#F8FAFF_0%,#F4F7FB_55%,#EEF3FA_100%)] text-slate-900",
            header: "bg-white/84 border-slate-200 backdrop-blur-xl",
            card: "border border-slate-200 bg-[linear-gradient(180deg,rgba(255,255,255,1)_0%,rgba(248,250,253,1)_100%)] shadow-[0_16px_40px_rgba(15,23,42,0.08)]",
            panel: "border border-slate-200 bg-[linear-gradient(180deg,rgba(248,250,252,1)_0%,rgba(255,255,255,1)_100%)]",
            soft: "text-slate-600",
            muted: "text-slate-500",
            strong: "text-slate-900",
            chip: "border-violet-200 bg-violet-50 text-violet-700",
            buttonSecondary: "border-slate-300/80 bg-slate-100 text-slate-700 hover:bg-slate-200 hover:text-slate-900",
            progressTrack: "bg-slate-200",
            quote: "bg-slate-50 border-slate-200",
            transcriptMaya: "bg-violet-50 border-violet-200",
            transcriptCandidate: "bg-white border-slate-200",
            emptyCard: "border border-slate-200 bg-[linear-gradient(180deg,rgba(255,255,255,1)_0%,rgba(248,250,253,1)_100%)]",
            summaryPanel: "border border-slate-200 bg-[linear-gradient(180deg,rgba(248,250,252,1)_0%,rgba(255,255,255,1)_100%)]",
            toggleBg: "bg-slate-100",
            toggleText: "text-slate-700",
          },
    [isDark]
  );

  const escapeHtml = (str: string): string => {
    return str
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  };

  const handleDownload = () => {
    if (!assessment) return;

    const dimRows = Object.entries(assessment.dimensions ?? {}).map(([key, val]) => {
      const label = DIMENSION_LABELS[key] ?? key;
      const score = clampScore(val.score);
      const color = score >= 7 ? "#10b981" : score >= 5 ? "#f59e0b" : "#ef4444";
      return `
        <tr>
          <td style="padding:10px 14px;font-weight:600;color:#334155">${escapeHtml(label)}</td>
          <td style="padding:10px 14px;text-align:center;font-weight:700;color:${color}">${score}/10</td>
          <td style="padding:10px 14px;color:#64748b;font-style:italic">&ldquo;${escapeHtml(val.evidence || "No evidence captured")}&rdquo;</td>
        </tr>`;
    }).join("");

    const strengthItems = (assessment.strengths || []).map((s) => `<li style="margin:4px 0">${escapeHtml(s)}</li>`).join("");
    const concernItems = (assessment.concerns || []).map((c) => `<li style="margin:4px 0">${escapeHtml(c)}</li>`).join("");

    const recColor = assessment.recommendation === "PROCEED"
      ? "#10b981" : assessment.recommendation === "CONSIDER" ? "#f59e0b" : "#ef4444";

    const safeName = escapeHtml(assessment.candidate_name);
    const safeSummary = escapeHtml(assessment.summary);
    const safeNotes = escapeHtml(assessment.interviewer_notes);

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Cuemath Assessment &mdash; ${safeName}</title>
<style>
  body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;margin:0;padding:40px;background:#f8faff;color:#1e293b;max-width:860px;margin:0 auto}
  h1{font-size:2rem;font-weight:700;margin:0 0 4px}
  .meta{color:#64748b;font-size:0.9rem;margin-bottom:32px}
  .section{background:#fff;border:1px solid #e2e8f0;border-radius:16px;padding:24px;margin-bottom:20px;box-shadow:0 2px 8px rgba(0,0,0,0.04)}
  h2{font-size:1rem;font-weight:700;color:#7c3aed;margin:0 0 14px;text-transform:uppercase;letter-spacing:0.08em}
  .badge{display:inline-block;padding:6px 16px;border-radius:999px;font-weight:700;font-size:0.9rem;color:#fff;background:${recColor};margin-bottom:16px}
  .score-big{font-size:3rem;font-weight:800;color:${recColor};line-height:1}
  table{width:100%;border-collapse:collapse}
  th{background:#f1f5f9;padding:10px 14px;text-align:left;font-size:0.8rem;text-transform:uppercase;letter-spacing:0.06em;color:#94a3b8}
  tr:nth-child(even){background:#f8faff}
  ul{margin:0;padding-left:20px;color:#475569}
  .note{color:#64748b;font-size:0.88rem;margin-top:24px;padding-top:16px;border-top:1px solid #e2e8f0}
  .transcript-maya{background:#f5f3ff;border-left:3px solid #7c3aed;padding:10px 14px;margin:8px 0;border-radius:0 8px 8px 0}
  .transcript-candidate{background:#f8faff;border-left:3px solid #94a3b8;padding:10px 14px;margin:8px 0;border-radius:0 8px 8px 0}
  .speaker{font-weight:700;font-size:0.8rem;margin-bottom:4px}
  .maya-name{color:#7c3aed}
  .candidate-name{color:#475569}
</style>
</head>
<body>
  <h1>${safeName}</h1>
  <p class="meta">Cuemath AI Tutor Screener &middot; ${new Date().toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}</p>

  <div class="section">
    <h2>Recommendation</h2>
    <div class="badge">${escapeHtml(assessment.recommendation)}</div>
    <div class="score-big">${clampScore(assessment.overall_score)}<span style="font-size:1.2rem;font-weight:400;color:#94a3b8">/10</span></div>
    <p style="margin:16px 0 0;color:#475569;line-height:1.7">${safeSummary}</p>
  </div>

  <div class="section">
    <h2>Dimension Scores &amp; Evidence</h2>
    <table>
      <thead><tr><th>Dimension</th><th style="text-align:center">Score</th><th>Evidence</th></tr></thead>
      <tbody>${dimRows}</tbody>
    </table>
  </div>

  <div class="section">
    <h2>Strengths</h2>
    <ul>${strengthItems || "<li>None noted</li>"}</ul>
  </div>

  <div class="section">
    <h2>Areas of Concern</h2>
    <ul>${concernItems || "<li>No major concerns</li>"}</ul>
  </div>

  <div class="section">
    <h2>Interviewer Notes</h2>
    <p style="color:#475569;line-height:1.7;margin:0">${safeNotes}</p>
  </div>

  <div class="section">
    <h2>Full Transcript</h2>
    ${transcript
      ? transcript.split("\n\n").filter(Boolean).map((line) => {
          const isMaya = line.startsWith("Maya:");
          const colonIdx = line.indexOf(":");
          const content = colonIdx !== -1 ? escapeHtml(line.slice(colonIdx + 1).trim()) : escapeHtml(line);
          return `<div class="${isMaya ? "transcript-maya" : "transcript-candidate"}">
            <div class="speaker ${isMaya ? "maya-name" : "candidate-name"}">${isMaya ? "Maya" : "Candidate"}</div>
            ${content}
          </div>`;
        }).join("")
      : "<p style='color:#94a3b8'>No transcript available.</p>"}
  </div>

  <p class="note">Generated by Cuemath AI Tutor Screener. This report is confidential and intended for internal hiring use only.</p>
</body>
</html>`;

    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${assessment.candidate_name.replace(/[^a-zA-Z0-9\s]/g, "").replace(/\s+/g, "_")}_Cuemath_Assessment.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className={cn("min-h-screen flex items-center justify-center", T.page)}>
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-fuchsia-400 shadow-[0_14px_34px_rgba(124,58,237,0.28)]">
            <span className="text-2xl font-bold text-white">M</span>
          </div>
          <p className={cn("text-sm", T.soft)}>Generating assessment report...</p>
        </div>
      </div>
    );
  }

  if (!assessment) {
    return (
      <div className={cn("min-h-screen flex items-center justify-center px-5", T.page)}>
        <div className={cn("w-full max-w-md rounded-[30px] p-8 text-center", T.emptyCard)}>
          <p className={cn("mb-4 text-sm", T.soft)}>No assessment found.</p>
          <button onClick={() => router.push("/")} className="rounded-[18px] bg-gradient-to-r from-violet-600 to-fuchsia-500 px-6 py-3 text-sm font-semibold text-white shadow-[0_14px_30px_rgba(124,58,237,0.18)] transition hover:from-violet-500 hover:to-fuchsia-400">
            Start New Interview
          </button>
        </div>
      </div>
    );
  }

  // ── Derived values ───────────────────────────────────────────────────────────

  const recommendationConfig = getRecommendationConfig(assessment.recommendation, isDark);
  const RecommendIcon = recommendationConfig.icon;
  const fallbackMode = isFallbackAssessment(assessment);
  const confidence = computeConfidence(assessment);

  // FIX: guard against missing/empty dimensions before mapping
  const dimensionEntries = Object.entries(assessment.dimensions ?? {});

  const radarData = dimensionEntries.map(([key, val]) => ({
    dimension: DIMENSION_LABELS[key] ?? key,
    score: clampScore(val.score),
    fullMark: 10,
  }));

  // FIX: guard for empty dimensions
  const dimValues = Object.values(assessment.dimensions ?? {});
  const averageDimensionScore = dimValues.length > 0
    ? Math.max(1, Math.min(10, Math.round(
        dimValues.reduce((sum, d) => sum + clampScore(d.score), 0) / dimValues.length
      )))
    : 1;

  const transcriptLines = transcript
    .split("\n\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const parsed = parseTranscriptLine(line);
      if (!parsed) return null;
      return { ...parsed, isMaya: parsed.speaker === "Maya" };
    })
    .filter((entry): entry is { speaker: string; content: string; isMaya: boolean } => entry !== null);

  return (
    <div className={cn("min-h-screen", T.page)}>
      {/* Header */}
      <header className={cn("sticky top-0 z-20 border-b", T.header)}>
        <div className="mx-auto flex w-full max-w-[1500px] items-center justify-between px-6 py-4 xl:px-8">
          <div className="flex items-center gap-3.5">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-600 to-fuchsia-500 shadow-[0_12px_28px_rgba(124,58,237,0.26)]">
              <Star size={16} className="fill-white text-white" />
            </div>
            <div>
              <p className={cn("text-[18px] font-semibold tracking-tight", T.strong)}>Cuemath</p>
              <p className={cn("text-xs", T.muted)}>Assessment Report</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className={cn("hidden rounded-full border px-4 py-2 text-xs font-medium md:block", T.buttonSecondary)}>
              AI Interview Workflow
            </div>

            <button
              onClick={() => setTheme((p) => (p === "dark" ? "light" : "dark"))}
              type="button"
              aria-label="Toggle theme"
              className={cn("flex h-10 w-10 items-center justify-center rounded-full border transition", T.toggleBg, T.toggleText, isDark ? "border-white/12" : "border-slate-300/80")}
            >
              {isDark ? <Sun size={17} /> : <Moon size={17} />}
            </button>

            <motion.button onClick={handleDownload} whileTap={{ scale: 0.97 }} className={cn("flex items-center gap-2 rounded-[18px] border px-4 py-2.5 text-sm font-medium transition", T.buttonSecondary)}>
              <Download size={15} />
              Download
            </motion.button>

            <motion.button onClick={() => router.push("/")} whileTap={{ scale: 0.97 }} className="flex items-center gap-2 rounded-[18px] bg-gradient-to-r from-violet-600 to-fuchsia-500 px-4 py-2.5 text-sm font-semibold tracking-wide text-white shadow-[0_14px_30px_rgba(124,58,237,0.18)] transition hover:scale-[1.01] hover:from-violet-500 hover:to-fuchsia-400 active:scale-[0.99]">
              <RotateCcw size={15} />
              New Interview
            </motion.button>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-[1500px] space-y-6 px-6 py-6 xl:px-8 xl:py-8">

        {/* Summary card */}
        <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className={cn("rounded-[34px] p-8 md:p-10", T.card)}>
          <div className="grid gap-6 xl:grid-cols-[1fr_1fr] xl:items-start">
            <div className="max-w-[44rem]">
              <div className={cn("mb-6 inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium", T.chip)}>
                <Sparkles size={14} />
                Report summary
              </div>

              <div>
                <p className={cn("text-sm", T.muted)}>Assessment for</p>
                <h1 className={cn("mt-2 text-[34px] font-semibold leading-[1.08] tracking-[-0.02em] md:text-[42px] xl:text-[48px]", T.strong)}>
                  {assessment.candidate_name}
                </h1>
                <p className={cn("mt-3 text-[15px]", T.soft)}>
                  {new Date().toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })} · Cuemath AI Tutor Screener
                </p>
              </div>

              <div className={cn("mt-6 rounded-[20px] p-5", T.summaryPanel)}>
                <p className={cn("text-[15px] leading-8 italic", T.soft)}>&ldquo;{assessment.summary}&rdquo;</p>
              </div>

              {fallbackMode && (
                <div className={cn("mt-5 inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-xs font-medium", isDark ? "border-amber-400/20 bg-amber-400/10 text-amber-300" : "border-amber-200 bg-amber-50 text-amber-700")}>
                  <AlertCircle size={13} />
                  Preliminary fallback assessment — manual review recommended
                </div>
              )}
            </div>

            {/* Score panel */}
            <div className="w-full">
              <div className={cn("rounded-[30px] p-7 md:p-8", T.panel)}>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className={cn("text-xs uppercase tracking-[0.18em]", T.muted)}>Overall Score</p>
                    <div className={cn("mt-2 text-5xl font-bold", getScoreTextColor(assessment.overall_score, isDark))}>
                      {clampScore(assessment.overall_score)}
                      <span className={cn("ml-1 text-xl font-medium", T.muted)}>/10</span>
                    </div>
                  </div>

                  <div className={cn("flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold", recommendationConfig.bg)}>
                    <RecommendIcon size={16} className={recommendationConfig.color} />
                    <span className={recommendationConfig.color}>{recommendationConfig.label}</span>
                  </div>
                </div>

                <div className="mt-6 space-y-4">
                  <div>
                    <div className="mb-1.5 flex items-center justify-between text-xs">
                      <span className={T.muted}>Dimension Average</span>
                      <span className={cn("font-semibold", getScoreTextColor(averageDimensionScore, isDark))}>{averageDimensionScore}/10</span>
                    </div>
                    <div className={cn("h-2 rounded-full overflow-hidden", T.progressTrack)}>
                      <div className={cn("h-full rounded-full", getScoreBarColor(averageDimensionScore))} style={{ width: `${(averageDimensionScore / 10) * 100}%` }} />
                    </div>
                  </div>

                  <div>
                    <div className="mb-1.5 flex items-center justify-between text-xs">
                      <span className={T.muted}>Assessment Confidence</span>
                      <span className={cn("font-semibold", confidence.isLow ? isDark ? "text-amber-300" : "text-amber-700" : confidence.pct >= 75 ? isDark ? "text-emerald-300" : "text-emerald-700" : isDark ? "text-amber-300" : "text-amber-700")}>
                        {confidence.label}
                      </span>
                    </div>
                    <div className={cn("h-2 rounded-full overflow-hidden", T.progressTrack)}>
                      <div className={cn("h-full rounded-full", confidence.isLow ? "bg-amber-500" : confidence.pct >= 75 ? "bg-emerald-500" : "bg-amber-500")} style={{ width: `${confidence.pct}%` }} />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.section>

        {/* Tabs */}
        <section className="flex flex-wrap gap-2">
          {([
            { key: "overview", label: "Overview", icon: BarChart2 },
            { key: "details", label: "Details", icon: Quote },
            { key: "transcript", label: "Transcript", icon: FileText },
          ] as const).map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.key;
            return (
              <button key={tab.key} onClick={() => setActiveTab(tab.key)} className={cn("inline-flex items-center gap-2 rounded-[18px] border px-4 py-2.5 text-sm font-medium transition", active ? "border-transparent bg-gradient-to-r from-violet-600 to-fuchsia-500 text-white shadow-[0_14px_30px_rgba(124,58,237,0.18)]" : T.buttonSecondary)}>
                <Icon size={15} />
                {tab.label}
              </button>
            );
          })}
        </section>

        {/* Overview tab */}
        {activeTab === "overview" && (
          <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_1fr]">
            <div className={cn("rounded-[30px] p-6", T.card)}>
              <h3 className={cn("mb-5 text-base font-semibold", T.strong)}>Performance Radar</h3>
              {radarData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <RadarChart data={radarData}>
                    <PolarGrid stroke={isDark ? "rgba(255,255,255,0.12)" : "rgba(15,23,42,0.12)"} />
                    <PolarAngleAxis dataKey="dimension" tick={{ fill: isDark ? "#CBD5E1" : "#475569", fontSize: 12 }} />
                    <PolarRadiusAxis domain={[0, 10]} tick={{ fill: isDark ? "#94A3B8" : "#64748B", fontSize: 10 }} />
                    <Radar name="Score" dataKey="score" stroke="#8B5CF6" fill="#8B5CF6" fillOpacity={0.18} strokeWidth={2} />
                    <Tooltip contentStyle={{ background: isDark ? "#0F172A" : "#FFFFFF", border: isDark ? "1px solid rgba(255,255,255,0.08)" : "1px solid rgba(15,23,42,0.10)", borderRadius: "14px", color: isDark ? "#FFFFFF" : "#0F172A" }} />
                  </RadarChart>
                </ResponsiveContainer>
              ) : (
                <p className={cn("text-sm", T.soft)}>No dimension data available.</p>
              )}
            </div>

            <div className={cn("rounded-[30px] p-6", T.card)}>
              <h3 className={cn("mb-5 text-base font-semibold", T.strong)}>Dimension Scores</h3>
              <div className="space-y-5">
                {dimensionEntries.map(([key, val]) => {
                  const score = clampScore(val.score);
                  return (
                    <div key={key}>
                      <div className="mb-2 flex items-center justify-between">
                        <span className={cn("text-sm", T.soft)}>{DIMENSION_LABELS[key] ?? key}</span>
                        <span className={cn("text-sm font-semibold", getScoreTextColor(score, isDark))}>{score}/10</span>
                      </div>
                      <div className={cn("h-2.5 rounded-full overflow-hidden", T.progressTrack)}>
                        <motion.div className={cn("h-full rounded-full", getScoreBarColor(score))} initial={{ width: 0 }} animate={{ width: `${(score / 10) * 100}%` }} transition={{ duration: 0.6 }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className={cn("rounded-[30px] p-6", T.card)}>
              <h3 className={cn("mb-4 flex items-center gap-2 text-base font-semibold", isDark ? "text-emerald-300" : "text-emerald-700")}>
                <CheckCircle size={18} />
                Strengths
              </h3>
              <ul className="space-y-3">
                {(assessment.strengths || []).map((s, i) => (
                  <li key={i} className={cn("flex items-start gap-3 rounded-[20px] p-4", T.panel)}>
                    <div className={cn("mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold", isDark ? "bg-emerald-400/15 text-emerald-300" : "bg-emerald-100 text-emerald-700")}>{i + 1}</div>
                    <span className={cn("text-sm leading-6", T.soft)}>{s}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className={cn("rounded-[30px] p-6", T.card)}>
              <h3 className={cn("mb-4 flex items-center gap-2 text-base font-semibold", isDark ? "text-rose-300" : "text-rose-700")}>
                <AlertCircle size={18} />
                Areas of Concern
              </h3>
              {(assessment.concerns || []).length > 0 ? (
                <ul className="space-y-3">
                  {assessment.concerns.map((c, i) => (
                    <li key={i} className={cn("flex items-start gap-3 rounded-[20px] p-4", T.panel)}>
                      <div className={cn("mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold", isDark ? "bg-rose-400/15 text-rose-300" : "bg-rose-100 text-rose-700")}>{i + 1}</div>
                      <span className={cn("text-sm leading-6", T.soft)}>{c}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className={cn("text-sm", T.soft)}>No major concerns noted.</p>
              )}
            </div>
          </motion.section>
        )}

        {/* Details tab */}
        {activeTab === "details" && (
          <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
            {dimensionEntries.map(([key, val]) => {
              const score = clampScore(val.score);
              return (
                <div key={key} className={cn("rounded-[30px] p-6", T.card)}>
                  <div className="mb-4 flex items-center justify-between">
                    <h3 className={cn("text-base font-semibold", T.strong)}>{DIMENSION_LABELS[key] ?? key}</h3>
                    <div className={cn("text-2xl font-bold", getScoreTextColor(score, isDark))}>
                      {score}<span className={cn("ml-1 text-sm font-medium", T.muted)}>/10</span>
                    </div>
                  </div>

                  <div className={cn("mb-4 h-2 rounded-full overflow-hidden", T.progressTrack)}>
                    <motion.div className={cn("h-full rounded-full", getScoreBarColor(score))} initial={{ width: 0 }} animate={{ width: `${(score / 10) * 100}%` }} transition={{ duration: 0.55 }} />
                  </div>

                  <div className={cn("flex items-start gap-3 rounded-[20px] p-4", T.quote)}>
                    <Quote size={15} className={cn("mt-0.5 shrink-0", isDark ? "text-violet-300" : "text-violet-600")} />
                    <p className={cn("text-sm italic leading-7", T.soft)}>{val.evidence || "Insufficient evidence available."}</p>
                  </div>
                </div>
              );
            })}

            <div className={cn("rounded-[30px] p-6", T.card)}>
              <h3 className={cn("mb-3 text-base font-semibold", isDark ? "text-violet-300" : "text-violet-700")}>Interviewer Notes</h3>
              <p className={cn("text-sm leading-7", T.soft)}>{assessment.interviewer_notes}</p>
            </div>
          </motion.section>
        )}

        {/* Transcript tab */}
        {activeTab === "transcript" && (
          <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className={cn("rounded-[30px] p-6", T.card)}>
            <h3 className={cn("mb-5 text-base font-semibold", T.strong)}>Full Interview Transcript</h3>

            {transcriptLines.length > 0 ? (
              <div className="space-y-3">
                {transcriptLines.map((entry, i) => (
                  <div key={i} className={cn("rounded-[20px] border p-4 text-sm", entry.isMaya ? T.transcriptMaya : T.transcriptCandidate)}>
                    <span className={cn("font-semibold", entry.isMaya ? isDark ? "text-violet-300" : "text-violet-700" : isDark ? "text-orange-300" : "text-orange-700")}>
                      {entry.speaker}:{" "}
                    </span>
                    <span className={T.soft}>{entry.content}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className={cn("text-sm", T.soft)}>No transcript available.</p>
            )}
          </motion.section>
        )}
      </main>
    </div>
  );
}