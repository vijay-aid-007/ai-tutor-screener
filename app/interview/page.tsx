"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Loader2,
  Mic,
  MicOff,
  Volume2,
  CheckCircle,
  Clock,
  MessageSquare,
  BarChart2,
  Camera,
  Sun,
  Moon,
  ChevronRight,
  AlertTriangle,
  UserX,
  BrainCircuit,
  ShieldCheck,
  WindIcon,
} from "lucide-react";

// ─── Constants ────────────────────────────────────────────────────────────────
const SILENCE_MS = 6000;
const EMPTY_RESPONSE_MS = 10000;
const TOTAL_Q = 6;
const EMPTY_RESPONSE_TOKEN = "__EMPTY_RESPONSE__";

const FACE_ABSENCE_TERMINATE_MS = 15000;
const FACE_CHECK_INTERVAL_MS = 400;
const PRESENCE_WARMUP_FRAMES = 6;
const CONSECUTIVE_ABSENT_THRESHOLD = 2;
const UNKNOWN_STREAK_BEFORE_SOFT_ABSENT = 6;
const FALLBACK_SAMPLE_W = 224;
const FALLBACK_SAMPLE_H = 168;
const MIN_FACE_WIDTH_RATIO = 0.04;
const MIN_FACE_HEIGHT_RATIO = 0.04;
const CENTER_SKIN_RATIO_MIN = 0.06;
const FULL_SKIN_RATIO_MIN = 0.03;
const EDGE_RATIO_MIN = 0.04;
const EDGE_RATIO_MAX = 0.16;
const TEXTURE_COMPLEXITY_MAX = 0.13;
const THEME_STORAGE_KEY = "maya_theme";

// ─── ASR corrections ──────────────────────────────────────────────────────────
const ASR_CORRECTIONS: [RegExp, string][] = [
  [/\bgen only\b/gi, "genuinely"],
  [/\bgenu only\b/gi, "genuinely"],
  [/\bgenuinely only\b/gi, "genuinely"],
  [/\binteract to like\b/gi, "interactive, like a"],
  [/\binteract to\b/gi, "interactive"],
  [/\backnowledg(?:e|ing) (?:the )?feeling/gi, "acknowledge their feeling"],
  [/\bfeel judge\b/gi, "feel judged"],
  [/\bfeel judges\b/gi, "feel judged"],
  [/\bor present\b/gi, "or pressured"],
  [/\bleading question[s]?\b/gi, "leading questions"],
  [/\bmanageable step[s]?\b/gi, "manageable steps"],
  [/\bmanage a step[s]?\b/gi, "manageable steps"],
  [/\bmomentom\b/gi, "momentum"],
  [/\bmomentem\b/gi, "momentum"],
  [/\bcelebrate small\b/gi, "celebrate small"],
  [/\bcelebreat\b/gi, "celebrate"],
  [/\bdistract\b(?!ed|ing)/gi, "distracted"],
  [/\bit'?s in about\b/gi, "it's not about"],
  [/\bin about explaining\b/gi, "not about explaining"],
  [/\bthat is in about\b/gi, "that is not about"],
  [/\b(\w{3,})\s+\1\b/gi, "$1"],
  [/\s+na\b\.?/gi, ""],
  [/\s+yaar\b\.?/gi, ""],
  [/\s+hai\b\.?/gi, ""],
  [/\s+na\?\s*/g, ". "],
  [/\s+only na\b/gi, " only"],
  [/\bmachine learnings\b/gi, "machine learning"],
  [/\bmission learning\b/gi, "machine learning"],
  [/\bmy shin learning\b/gi, "machine learning"],
  [/\bmisin learning\b/gi, "machine learning"],
  [/\bmissing learning\b/gi, "machine learning"],
  [/\bmy scene learning\b/gi, "machine learning"],
  [/\bmy chin learning\b/gi, "machine learning"],
  [/\bmachine learner\b/gi, "machine learning"],
  [/\bmy shin learner\b/gi, "machine learning"],
  [/\bartificial intelligent\b/gi, "artificial intelligence"],
  [/\bdeep learnings\b/gi, "deep learning"],
  [/\bneural network's\b/gi, "neural networks"],
  [/\bcue math\b/gi, "Cuemath"],
  [/\bcue maths\b/gi, "Cuemath"],
  [/\bque math\b/gi, "Cuemath"],
  [/\bque maths\b/gi, "Cuemath"],
  [/\bq math\b/gi, "Cuemath"],
  [/\bkew math\b/gi, "Cuemath"],
  [/\bqueue math\b/gi, "Cuemath"],
  [/\bcue mat\b/gi, "Cuemath"],
  [/\bcu math\b/gi, "Cuemath"],
  [/\bkyoomath\b/gi, "Cuemath"],
  [/\bmath's\b/gi, "maths"],
  [/\bi would of\b/gi, "I would have"],
  [/\bcould of\b/gi, "could have"],
  [/\bshould of\b/gi, "should have"],
  [/\bwould of\b/gi, "would have"],
  [/\btheir going\b/gi, "they're going"],
  [/\btheir doing\b/gi, "they're doing"],
  [/\byour welcome\b/gi, "you're welcome"],
  [/\bits a\b/gi, "it's a"],
  [/\bi am having\b/gi, "I have"],
  [/\bI done\b/g, "I did"],
  [/\bI am knowing\b/gi, "I know"],
  [/\bI am understanding\b/gi, "I understand"],
  [/\bI am thinking\b/gi, "I think"],
  [/\btry your different\b/gi, "try a different"],
  [/\brelated to something they are familiar\b/gi, "related to something they're familiar"],
  [/\bbuild the confidence\b/gi, "build their confidence"],
  [/\bbuild (?:a )?confidence\b/gi, "build confidence"],
  [/\bgiving them right answer\b/gi, "giving them the right answer"],
  [/\bgiving (?:the )?right answer\b/gi, "giving the right answer"],
  [/\bsmall manageable\b/gi, "smaller, manageable"],
  [/\bbreak (?:the )?problem into\b/gi, "break the problem into"],
  [/\bsort reset\b/gi, "sort of a reset"],
  [/\beven is sort reset\b/gi, "which is sort of a reset"],
  [/\bsometimes even is\b/gi, "sometimes, even a"],
  [/\bthink out loud\b/gi, "think out loud"],
  [/\bthink aloud\b/gi, "think out loud"],
  [/\bto all them more\b/gi, "to ask them more"],
  [/\ball them\b/gi, "ask them"],
  [/\s{2,}/g, " "],
];

function correctASRText(text: string): string {
  let r = text;
  for (const [p, s] of ASR_CORRECTIONS) r = r.replace(p, s);
  return r.trim();
}

// ─── Types ────────────────────────────────────────────────────────────────────
interface Message {
  role: "user" | "assistant";
  content: string;
}
interface DetectedFace {
  boundingBox: DOMRectReadOnly;
}
interface BrowserFaceDetector {
  detect: (image: CanvasImageSource) => Promise<DetectedFace[]>;
}

declare global {
  interface Window {
    SpeechRecognition?: new () => BSR;
    webkitSpeechRecognition?: new () => BSR;
    FaceDetector?: new (options?: {
      fastMode?: boolean;
      maxDetectedFaces?: number;
    }) => BrowserFaceDetector;
  }
}

interface BSR {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  onresult: ((e: BSREvent) => void) | null;
  onend: (() => void) | null;
  onerror: ((e: BSRError) => void) | null;
  onaudiostart: (() => void) | null;
}
interface BSREvent {
  resultIndex: number;
  results: {
    length: number;
    [i: number]: { isFinal: boolean; 0: { transcript: string } };
  };
}
interface BSRError {
  error?: string;
}
type PresenceState = "present" | "absent" | "unknown";

// ─── Fallback question bank ───────────────────────────────────────────────────
const QUESTION_BANK = [
  "To kick things off, could you tell me a little about yourself and what drew you to tutoring?",
  "Imagine you're explaining fractions to a 9-year-old who's been staring blankly — how would you approach that?",
  "Picture a student who's been stuck on the same problem for 5 minutes and says they want to give up. What do you do in that moment?",
  "How do you keep a child engaged and motivated when you can tell they're bored or distracted?",
  "What does patience genuinely mean to you as a tutor — not just in theory, but day to day?",
  "[name], thank you so much for your time today. We'll be in touch soon with next steps. Best of luck — I'm rooting for you!",
];

const QUESTION_OPENERS = [
  "",
  "Great, let's move to the next one.",
  "Good, here's the next scenario.",
  "Thanks for that. Next question:",
  "Appreciated. One more:",
  "",
];

function buildFallbackReply(
  questionCount: number,
  name: string,
  userText: string,
  retryCount: number
): { reply: string; shouldAdvance: boolean } {
  const t = userText.toLowerCase();
  const questionIndex = Math.max(
    0,
    Math.min(questionCount - 1, QUESTION_BANK.length - 2)
  );
  const nextIdx = Math.min(questionIndex + 1, QUESTION_BANK.length - 1);
  const wantsToSkip =
    t.includes("next question") ||
    t.includes("move on") ||
    t.includes("skip") ||
    t.includes("next one") ||
    (t.includes("next") && t.length <= 10);

  if (wantsToSkip) {
    if (nextIdx >= QUESTION_BANK.length - 1) {
      return {
        reply: QUESTION_BANK[QUESTION_BANK.length - 1].replace("[name]", name),
        shouldAdvance: true,
      };
    }
    const opener = QUESTION_OPENERS[nextIdx] || "Of course, let's move on.";
    return {
      reply: `${opener} ${QUESTION_BANK[nextIdx]}`,
      shouldAdvance: true,
    };
  }

  const currentQuestion = QUESTION_BANK[questionIndex];
  const isCasualOrGreeting =
    t.includes("good morning") ||
    t.includes("good afternoon") ||
    t.includes("good evening") ||
    t.includes("nice to meet") ||
    t.includes("how are you") ||
    (t.includes("hi") && userText.split(" ").length <= 5);

  if (retryCount === 0) {
    const isNonAnswer =
      t === "no" ||
      t === "nothing" ||
      t === "idk" ||
      t.includes("don't know") ||
      t.includes("not sure") ||
      t.includes("no idea") ||
      t === "(no verbal response given)" ||
      t === "no response";

    const isClarificationRequest =
      t.includes("means what") ||
      t.includes("explain me") ||
      t.includes("more detail") ||
      t.includes("what should i") ||
      t.includes("what do you mean") ||
      t.includes("rephrase") ||
      t.includes("clarify");

    if (isCasualOrGreeting) {
      const warmResponses = [
        "I'm doing wonderfully, thank you so much for asking!",
        "That's so sweet of you to ask! I'm great, thank you!",
        "Aww, I appreciate that! Doing really well, thank you!",
      ];
      return {
        reply: `${warmResponses[Math.floor(Math.random() * warmResponses.length)]} ${currentQuestion}`,
        shouldAdvance: false,
      };
    }
    if (isNonAnswer) {
      return {
        reply: `No worries at all — take your time! ${currentQuestion}`,
        shouldAdvance: false,
      };
    }
    if (isClarificationRequest) {
      return {
        reply: `Of course! Just share what you personally would do in that moment — there's no right or wrong answer. ${currentQuestion}`,
        shouldAdvance: false,
      };
    }
    return {
      reply: `I'd love to hear a little bit more from you on this. ${currentQuestion}`,
      shouldAdvance: false,
    };
  }

  if (nextIdx >= QUESTION_BANK.length - 1) {
    return {
      reply: QUESTION_BANK[QUESTION_BANK.length - 1].replace("[name]", name),
      shouldAdvance: true,
    };
  }

  const advanceMessages = isCasualOrGreeting
    ? "No worries at all — let's jump into it together!"
    : "Absolutely no pressure — let's move forward.";
  return {
    reply: `${advanceMessages} ${QUESTION_BANK[nextIdx]}`,
    shouldAdvance: true,
  };
}

// ─── Skin detection helpers ───────────────────────────────────────────────────
function rgbToYCrCb(r: number, g: number, b: number) {
  const y = 0.299 * r + 0.587 * g + 0.114 * b;
  const cb = 128 - 0.168736 * r - 0.331264 * g + 0.5 * b;
  const cr = 128 + 0.5 * r - 0.418688 * g - 0.081312 * b;
  return { y, cb, cr };
}

function isSkinPixel(r: number, g: number, b: number): boolean {
  const { y, cb, cr } = rgbToYCrCb(r, g, b);
  const rgbRule =
    r > 60 &&
    g > 30 &&
    b > 15 &&
    Math.max(r, g, b) - Math.min(r, g, b) > 20 &&
    Math.abs(r - g) > 12 &&
    r >= g &&
    r >= b;
  const ycbcrRule =
    y > 50 && cb >= 80 && cb <= 130 && cr >= 135 && cr <= 175;
  return rgbRule && ycbcrRule;
}

function sobelLikeEdgeScore(
  gray: Uint8ClampedArray,
  w: number,
  h: number
): number {
  let strongEdges = 0;
  const total = (w - 2) * (h - 2);
  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      const i = y * w + x;
      const gx =
        -gray[i - w - 1] -
        2 * gray[i - 1] -
        gray[i + w - 1] +
        gray[i - w + 1] +
        2 * gray[i + 1] +
        gray[i + w + 1];
      const gy =
        -gray[i - w - 1] -
        2 * gray[i - w] -
        gray[i - w + 1] +
        gray[i + w - 1] +
        2 * gray[i + w] +
        gray[i + w + 1];
      if (Math.abs(gx) + Math.abs(gy) > 180) strongEdges++;
    }
  }
  return total > 0 ? strongEdges / total : 0;
}

// ─── Briefing steps ───────────────────────────────────────────────────────────
const BRIEFING_STEPS = [
  {
    icon: MessageSquare,
    title: "Natural conversation",
    desc: "I'll ask you thoughtful tutor-screening questions. Speak naturally — the goal is to understand how you communicate and connect with students.",
  },
  {
    icon: Clock,
    title: "About 8–10 minutes",
    desc: "The interview is short and focused. There are no trick questions — I'm here to understand how you think and explain.",
  },
  {
    icon: Mic,
    title: "Voice-first interview",
    desc: "This interview is designed for speaking, since tutoring happens through live conversation. Microphone is required to proceed.",
  },
  {
    icon: BarChart2,
    title: "Structured assessment",
    desc: "After the conversation, you'll get a detailed report across clarity, warmth, patience, simplification, and English fluency.",
  },
  {
    icon: CheckCircle,
    title: "Be yourself",
    desc: "There are no perfect answers. I'm looking for warmth, clarity, and genuine care for students — not rehearsed lines.",
  },
];

// ─── Design tokens ────────────────────────────────────────────────────────────
const FONTS = `
@import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;1,9..40,400;1,9..40,500&family=DM+Serif+Display:ital@0;1&display=swap');
*,*::before,*::after { box-sizing: border-box; }
html,body { margin: 0; padding: 0; font-family: "DM Sans", system-ui, sans-serif; }
`;

function getTokens(isDark: boolean) {
  return isDark
    ? {
        pageBg: "#080C14",
        pageBg2: "#0C1220",
        gridLine: "rgba(255,255,255,0.03)",
        text: "#F0F4FF",
        textSoft: "rgba(220,228,255,0.68)",
        textMuted: "rgba(220,228,255,0.38)",
        surface: "#0E1628",
        surfaceElevated: "#111E35",
        inset: "#0A1120",
        border: "rgba(255,255,255,0.08)",
        borderStrong: "rgba(255,255,255,0.13)",
        accent: "#4F7BFF",
        accentAlt: "#8B5CF6",
        accentGlow: "rgba(79,123,255,0.16)",
        accentRing: "rgba(79,123,255,0.22)",
        accentText: "#7BA8FF",
        success: "#10D9A0",
        successBg: "rgba(16,217,160,0.08)",
        successBorder: "rgba(16,217,160,0.18)",
        danger: "#F87171",
        dangerBg: "rgba(248,113,113,0.10)",
        dangerBorder: "rgba(248,113,113,0.22)",
        warning: "#FBBF24",
        warningBg: "rgba(251,191,36,0.10)",
        warningBorder: "rgba(251,191,36,0.22)",
        inputBg: "rgba(6,10,20,0.95)",
        inputBorder: "rgba(255,255,255,0.09)",
        inputFocus: "rgba(79,123,255,0.22)",
        topbar: "rgba(8,12,20,0.88)",
        bubbleAI: "#0E1628",
        bubbleAIBorder: "rgba(255,255,255,0.08)",
        bubbleUser: "linear-gradient(135deg, #4F7BFF 0%, #8B5CF6 100%)",
        shadow: "0 24px 64px rgba(0,0,0,0.50)",
        shadowMd: "0 12px 36px rgba(0,0,0,0.32)",
        heroGlow1: "rgba(79,123,255,0.10)",
        heroGlow2: "rgba(139,92,246,0.07)",
      }
    : {
        pageBg: "#F4F6FB",
        pageBg2: "#EBF0FF",
        gridLine: "rgba(13,21,38,0.04)",
        text: "#0D1526",
        textSoft: "rgba(13,21,38,0.64)",
        textMuted: "rgba(13,21,38,0.38)",
        surface: "#FFFFFF",
        surfaceElevated: "#FFFFFF",
        inset: "#F5F8FF",
        border: "rgba(13,21,38,0.08)",
        borderStrong: "rgba(13,21,38,0.14)",
        accent: "#3B63E8",
        accentAlt: "#7C3AED",
        accentGlow: "rgba(59,99,232,0.10)",
        accentRing: "rgba(59,99,232,0.14)",
        accentText: "#3B63E8",
        success: "#059669",
        successBg: "rgba(5,150,105,0.07)",
        successBorder: "rgba(5,150,105,0.18)",
        danger: "#DC2626",
        dangerBg: "rgba(220,38,38,0.06)",
        dangerBorder: "rgba(220,38,38,0.18)",
        warning: "#D97706",
        warningBg: "rgba(217,119,6,0.07)",
        warningBorder: "rgba(217,119,6,0.18)",
        inputBg: "#FFFFFF",
        inputBorder: "rgba(13,21,38,0.10)",
        inputFocus: "rgba(59,99,232,0.16)",
        topbar: "rgba(244,246,251,0.90)",
        bubbleAI: "#FFFFFF",
        bubbleAIBorder: "rgba(13,21,38,0.09)",
        bubbleUser: "linear-gradient(135deg, #3B63E8 0%, #7C3AED 100%)",
        shadow: "0 24px 64px rgba(13,21,38,0.09)",
        shadowMd: "0 12px 36px rgba(13,21,38,0.07)",
        heroGlow1: "rgba(59,99,232,0.08)",
        heroGlow2: "rgba(124,58,237,0.05)",
      };
}

function StatusPill({
  ok,
  icon,
  label,
  T,
}: {
  ok: boolean;
  icon: React.ReactNode;
  label: string;
  T: ReturnType<typeof getTokens>;
}) {
  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        padding: "4px 10px",
        borderRadius: 999,
        border: `1px solid ${ok ? T.successBorder : T.border}`,
        background: ok ? T.successBg : "transparent",
        color: ok ? T.success : T.textMuted,
        fontSize: 11,
        fontWeight: 600,
      }}
    >
      {icon}
      {label}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function InterviewPage() {
  const router = useRouter();

  // ─── messagesRef: keeps messages in sync to avoid stale closures ─────────
  const messagesRef = useRef<Message[]>([]);

  // Refs
  const chatEndRef = useRef<HTMLDivElement | null>(null);
  const recognitionRef = useRef<BSR | null>(null);
  const silenceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const emptyResponseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const sendMessageRef = useRef<(t: string) => Promise<void>>(
    () => Promise.resolve()
  );
  const finalTranscriptRef = useRef<string>("");
  const interimTranscriptRef = useRef<string>("");
  const isListeningRef = useRef(false);
  const questionCountRef = useRef(1);
  const isLoadingRef = useRef(false);
  const interviewDoneRef = useRef(false);
  const micStateRef = useRef<"idle" | "requesting" | "granted" | "denied">("idle");
  const supportsSpeechRef = useRef(false);
  const silenceAttemptRef = useRef<Record<number, number>>({});
  const retryCountRef = useRef<Record<number, number>>({});
  const briefingVideoRef = useRef<HTMLVideoElement | null>(null);
  const interviewVideoRef = useRef<HTMLVideoElement | null>(null);
  const cameraStreamRef = useRef<MediaStream | null>(null);
  const sendInProgressRef = useRef(false);
  const utteranceSentRef = useRef(false);
  const faceCheckIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  // ─── OLDER VERSION: faceAbsenceTimerRef restored pin-to-pin ──────────────
  // The newer version removed this ref entirely, which broke the camera
  // absence-termination behaviour. Restored from the older version so that
  // stopPresenceDetection properly clears the timeout and ghost-terminations
  // after a presence-restore no longer occur.
  const faceAbsenceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const faceCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const faceAbsenceStartRef = useRef<number | null>(null);
  const faceTerminatedRef = useRef(false);
  const nativeFaceDetectorRef = useRef<BrowserFaceDetector | null>(null);
  const presenceCheckBusyRef = useRef(false);
  const consecutiveAbsentCountRef = useRef(0);
  const unknownPresenceCountRef = useRef(0);
  const visibilityHandlerRef = useRef<(() => void) | null>(null);
  const hardAbortRef = useRef(false);
  const mountedRef = useRef(true);
  const deviceCheckRunningRef = useRef(false);
  // From newer version: track whether onend already handled to prevent
  // onerror + onend double-send
  const recognitionEndHandledRef = useRef(false);

  // State
  const [theme, setTheme] = useState<"dark" | "light">("dark");

  const T = useMemo(() => getTokens(theme === "dark"), [theme]);

  const [screen, setScreen] = useState<"briefing" | "interview">("briefing");
  const [briefingStep, setBriefingStep] = useState(0);
  const [mayaIntroPlayed, setMayaIntroPlayed] = useState(false);
  const [nameLoaded, setNameLoaded] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [candidateName, setCandidateName] = useState("Candidate");
  const [candidateEmail, setCandidateEmail] = useState("");
  const [transcriptPreview, setTranscriptPreview] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [questionCount, setQuestionCount] = useState(1);
  const [usingFallback, setUsingFallback] = useState(false);
  const [reportError, setReportError] = useState("");
  const [micState, setMicState] = useState<"idle" | "requesting" | "granted" | "denied">("idle");
  const [supportsSpeech, setSupportsSpeech] = useState(false);
  const [isBeginning, setIsBeginning] = useState(false);
  const [cameraState, setCameraState] = useState<"idle" | "requesting" | "granted" | "denied">("idle");
  const [micVerified, setMicVerified] = useState(false);
  const [cameraVerified, setCameraVerified] = useState(false);
  const [deviceCheckRunning, setDeviceCheckRunning] = useState(false);
  const [deviceCheckTranscript, setDeviceCheckTranscript] = useState("");
  const [showMandatoryWarning, setShowMandatoryWarning] = useState(false);
  const [faceAbsenceCountdown, setFaceAbsenceCountdown] = useState<number | null>(null);
  const [terminated, setTerminated] = useState(false);
  const [terminationReason, setTerminationReason] = useState("");
  const [interviewDone, setInterviewDone] = useState(false);

  const css = useMemo(
    () => `
    .ip-shell { min-height: 100vh; background: linear-gradient(160deg, ${T.pageBg} 0%, ${T.pageBg2} 100%); color: ${T.text}; font-family: "DM Sans", system-ui, sans-serif; }
    .ip-grid::before { content:""; position:absolute; inset:0; pointer-events:none; z-index:0; background-image: linear-gradient(${T.gridLine} 1px, transparent 1px), linear-gradient(90deg, ${T.gridLine} 1px, transparent 1px); background-size: 48px 48px; }
    .ip-topbar { position:sticky; top:0; z-index:100; height:62px; display:flex; align-items:center; border-bottom:1px solid ${T.border}; background:${T.topbar}; backdrop-filter:blur(20px); -webkit-backdrop-filter:blur(20px); }
    .ip-container { max-width:1360px; margin:0 auto; padding:0 28px; width:100%; }
    .ip-topbar-inner { display:flex; align-items:center; justify-content:space-between; width:100%; }
    .ip-brand { display:flex; align-items:center; gap:10px; }
    .ip-brandmark { width:34px; height:34px; border-radius:10px; background:linear-gradient(135deg,${T.accent},${T.accentAlt}); display:grid; place-items:center; color:#fff; }
    .ip-brand-name { font-size:15px; font-weight:700; letter-spacing:-0.02em; color:${T.text}; }
    .ip-brand-sub { font-size:10px; text-transform:uppercase; letter-spacing:0.10em; color:${T.textMuted}; margin-top:1px; }
    .ip-theme-btn { width:36px; height:36px; border-radius:10px; border:1px solid ${T.border}; background:transparent; color:${T.textSoft}; display:grid; place-items:center; cursor:pointer; transition:border-color 0.15s,background 0.15s; }
    .ip-theme-btn:hover { border-color:${T.borderStrong}; background:${T.surfaceElevated}; }
    .ip-maya-pulse { animation: ip-pulse 2s infinite; }
    .ip-card { border:1px solid ${T.border}; border-radius:20px; background:${T.surface}; box-shadow:${T.shadow}; }
    .ip-panel { border:1px solid ${T.border}; border-radius:16px; background:${T.surfaceElevated}; }
    .ip-inset { border:1px solid ${T.border}; border-radius:14px; background:${T.inset}; }
    .ip-btn-primary { display:inline-flex; align-items:center; justify-content:center; gap:8px; border:0; border-radius:12px; padding:0 18px; height:42px; font-size:13.5px; font-weight:700; font-family:inherit; color:#fff; cursor:pointer; background:linear-gradient(135deg,${T.accent} 0%,${T.accentAlt} 100%); box-shadow:0 10px 28px ${T.accentRing}; transition:transform 0.15s,box-shadow 0.15s,opacity 0.15s; }
    .ip-btn-primary:hover:not(:disabled) { transform:translateY(-1px); box-shadow:0 16px 36px ${T.accentRing}; }
    .ip-btn-primary:disabled { opacity:0.45; cursor:not-allowed; }
    .ip-btn-secondary { display:inline-flex; align-items:center; justify-content:center; gap:7px; border:1px solid ${T.border}; border-radius:12px; padding:0 16px; height:40px; font-size:13px; font-weight:600; font-family:inherit; color:${T.textSoft}; cursor:pointer; background:transparent; transition:border-color 0.15s,color 0.15s,background 0.15s; }
    .ip-btn-secondary:hover { border-color:${T.borderStrong}; color:${T.text}; background:${T.surfaceElevated}; }
    .ip-btn-danger { display:inline-flex; align-items:center; gap:7px; border:0; border-radius:12px; padding:0 16px; height:40px; font-size:13px; font-weight:600; font-family:inherit; color:#fff; cursor:pointer; background:linear-gradient(135deg,#EF4444,#DC2626); }
    .ip-btn-full { width:100%; }
    .ip-bubble-ai { border:1px solid ${T.bubbleAIBorder}; border-radius:18px 18px 18px 4px; padding:14px 18px; background:${T.bubbleAI}; box-shadow:${T.shadowMd}; }
    .ip-bubble-user { border-radius:18px 18px 4px 18px; padding:14px 18px; background:${T.bubbleUser}; color:#fff; }
    .ip-bubble-label { font-size:11px; font-weight:700; opacity:0.65; margin-bottom:6px; letter-spacing:0.02em; }
    .ip-bubble-text { font-size:14.5px; line-height:1.65; }
    .ip-step-active { border:1px solid ${T.accentRing}; background:${T.accentGlow}; border-radius:16px; padding:14px 16px; display:flex; align-items:flex-start; gap:14px; text-align:left; cursor:pointer; transition:border-color 0.15s,background 0.15s; width:100%; }
    .ip-step-inactive { border:1px solid ${T.border}; background:transparent; border-radius:16px; padding:14px 16px; display:flex; align-items:flex-start; gap:14px; text-align:left; cursor:pointer; opacity:0.55; transition:opacity 0.15s,border-color 0.15s; width:100%; }
    .ip-step-inactive:hover { opacity:0.75; border-color:${T.borderStrong}; }
    .ip-step-icon-active { width:40px; height:40px; min-width:40px; border-radius:12px; background:${T.accentGlow}; border:1px solid ${T.accentRing}; display:grid; place-items:center; }
    .ip-step-icon-inactive { width:40px; height:40px; min-width:40px; border-radius:12px; background:${T.surfaceElevated}; border:1px solid ${T.border}; display:grid; place-items:center; }
    .ip-progress-bg { height:4px; border-radius:999px; background:${T.border}; overflow:hidden; }
    .ip-progress-fill { height:100%; border-radius:999px; background:linear-gradient(90deg,${T.accent},${T.accentAlt}); transition:width 0.5s ease; }
    .ip-device-btn { width:100%; border:1px solid ${T.border}; border-radius:12px; background:transparent; color:${T.textSoft}; font-size:13px; font-weight:600; font-family:inherit; padding:11px 16px; cursor:pointer; text-align:left; transition:border-color 0.15s,color 0.15s,background 0.15s; }
    .ip-device-btn:hover { border-color:${T.borderStrong}; color:${T.text}; background:${T.surfaceElevated}; }
    .ip-device-btn:disabled { opacity:0.5; cursor:not-allowed; }
    @keyframes ip-pulse { 0%,100%{box-shadow:0 0 0 0 ${T.accentGlow}} 50%{box-shadow:0 0 0 6px transparent} }
    @keyframes ip-spin { to{transform:rotate(360deg)} }
    .ip-spin { animation:ip-spin 0.8s linear infinite; }
    .ip-chip-ok { display:inline-flex; align-items:center; gap:5px; padding:4px 10px; border-radius:999px; border:1px solid ${T.successBorder}; background:${T.successBg}; color:${T.success}; font-size:11px; font-weight:600; }
    .ip-chip-neutral { display:inline-flex; align-items:center; gap:5px; padding:4px 10px; border-radius:999px; border:1px solid ${T.border}; background:transparent; color:${T.textMuted}; font-size:11px; font-weight:600; }
    .ip-chip-accent { display:inline-flex; align-items:center; gap:5px; padding:4px 10px; border-radius:999px; border:1px solid ${T.accentRing}; background:${T.accentGlow}; color:${T.accentText}; font-size:11px; font-weight:600; }
    .ip-warn-box { border:1px solid ${T.warningBorder}; background:${T.warningBg}; border-radius:12px; padding:10px 14px; font-size:12px; color:${T.warning}; }
    .ip-danger-box { border:1px solid ${T.dangerBorder}; background:${T.dangerBg}; border-radius:12px; padding:10px 14px; font-size:12px; color:${T.danger}; }
  `,
    [T]
  );

  const displayCount = Math.min(Math.max(questionCount - 1, 0), TOTAL_Q);
  const progress = Math.min((displayCount / TOTAL_Q) * 100, 100);

  const setQCount = useCallback((n: number) => {
    questionCountRef.current = n;
    setQuestionCount(n);
  }, []);

  const setLoading = useCallback((v: boolean) => {
    isLoadingRef.current = v;
    setIsLoading(v);
  }, []);

  const setDone = useCallback((v: boolean) => {
    interviewDoneRef.current = v;
    setInterviewDone(v);
  }, []);

  const setMicStateSynced = useCallback(
    (v: "idle" | "requesting" | "granted" | "denied") => {
      micStateRef.current = v;
      setMicState(v);
    },
    []
  );

  const screenRef = useRef<"briefing" | "interview">(screen);
  useEffect(() => {
    screenRef.current = screen;
  }, [screen]);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      deviceCheckRunningRef.current = false;
    };
  }, []);

  useEffect(() => {
    const name = localStorage.getItem("candidate_name") || "Candidate";
    const email = localStorage.getItem("candidate_email") || "";
    setCandidateName(name);
    setCandidateEmail(email);
    setNameLoaded(true);
    const hasSpeech =
      typeof window !== "undefined" &&
      (!!window.SpeechRecognition || !!window.webkitSpeechRecognition);
    supportsSpeechRef.current = hasSpeech;
    setSupportsSpeech(hasSpeech);
    const savedTheme = localStorage.getItem(THEME_STORAGE_KEY) as
      | "dark"
      | "light"
      | null;
    if (savedTheme) setTheme(savedTheme);
    hardAbortRef.current = false;
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if ("FaceDetector" in window && !nativeFaceDetectorRef.current) {
      try {
        nativeFaceDetectorRef.current = new (window.FaceDetector!)({
          fastMode: true,
          maxDetectedFaces: 1,
        });
      } catch (err) {
        console.error("face_detector_init_failed:", err);
        nativeFaceDetectorRef.current = null;
      }
    }
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme((t) => {
      const next = t === "dark" ? "light" : "dark";
      localStorage.setItem(THEME_STORAGE_KEY, next);
      return next;
    });
  }, []);

  const clearListeningTimers = useCallback(() => {
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
    if (emptyResponseTimerRef.current) {
      clearTimeout(emptyResponseTimerRef.current);
      emptyResponseTimerRef.current = null;
    }
  }, []);

  const stopCameraPreview = useCallback(() => {
    if (cameraStreamRef.current) {
      cameraStreamRef.current.getTracks().forEach((t) => t.stop());
      cameraStreamRef.current = null;
    }
    if (briefingVideoRef.current) briefingVideoRef.current.srcObject = null;
    if (interviewVideoRef.current) interviewVideoRef.current.srcObject = null;
  }, []);

  const attachCameraStreamToVisibleVideo = useCallback(
    async (retryOnNull = true) => {
      const stream = cameraStreamRef.current;
      if (!stream) return;
      const currentScreen = screenRef.current;
      const targetVideo =
        currentScreen === "briefing"
          ? briefingVideoRef.current
          : interviewVideoRef.current;
      if (!targetVideo) {
        if (retryOnNull)
          setTimeout(() => void attachCameraStreamToVisibleVideo(false), 200);
        return;
      }
      if (targetVideo.srcObject !== stream) targetVideo.srcObject = stream;
      try {
        await targetVideo.play();
      } catch (e) {
        console.error("camera_preview_play_failed:", e);
      }
    },
    []
  );

  useEffect(() => {
    void attachCameraStreamToVisibleVideo();
  }, [screen, cameraState, attachCameraStreamToVisibleVideo]);

  const speak = useCallback((text: string): Promise<void> => {
    return new Promise((resolve) => {
      if (typeof window === "undefined" || !window.speechSynthesis) {
        resolve();
        return;
      }
      if (hardAbortRef.current) {
        resolve();
        return;
      }

      const synth = window.speechSynthesis;
      synth.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.8;
      utterance.pitch = 1.4;
      utterance.volume = 1;
      utterance.lang = "en-US";

      let settled = false;

      const settle = () => {
        if (settled) return;
        settled = true;
        if (mountedRef.current) setIsSpeaking(false);
        resolve();
      };

      // Minimum safety timer of 4000ms to prevent premature resolution
      // on slow voice-loading browsers; cap at 30s for very long responses.
      const estimatedMs = Math.max(text.length * 85 + 3500, 4000);
      const safetyTimer = setTimeout(
        () => settle(),
        Math.min(estimatedMs, 30000)
      );

      const finish = () => {
        synth.onvoiceschanged = null;
        clearTimeout(safetyTimer);
        settle();
      };

      utterance.onstart = () => {
        if (hardAbortRef.current) {
          synth.cancel();
          finish();
          return;
        }
        if (mountedRef.current) setIsSpeaking(true);
      };

      utterance.onend = finish;
      utterance.onerror = finish;

      const pickFemaleVoice = () => {
        const voices = synth.getVoices();
        return (
          voices.find((v) => /jenny|aria|zira|samantha/i.test(v.name)) ||
          voices.find((v) => /google uk english female/i.test(v.name)) ||
          voices.find((v) => /female|woman/i.test(v.name)) ||
          null
        );
      };

      const speakNow = () => {
        const femaleVoice = pickFemaleVoice();
        if (femaleVoice) utterance.voice = femaleVoice;
        try {
          synth.speak(utterance);
        } catch {
          finish();
        }
      };

      const voices = synth.getVoices();
      if (voices.length > 0) {
        speakNow();
      } else {
        const handleVoicesChanged = () => {
          synth.onvoiceschanged = null;
          speakNow();
        };
        synth.onvoiceschanged = handleVoicesChanged;
        setTimeout(() => {
          if (!settled) {
            synth.onvoiceschanged = null;
            speakNow();
          }
        }, 1200);
      }
    });
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, transcriptPreview, isLoading]);
  

  const introStartedRef = useRef(false);

  useEffect(() => {

    if (typeof window === "undefined") return;

    console.log("INTRO EFFECT RUN", {
      screen,
      mayaIntroPlayed,
      introStartedRef: introStartedRef.current,
      sessionLock: sessionStorage.getItem("maya_intro_played"),
      windowLock: (window as typeof window & { __mayaIntroStarted?: boolean }).__mayaIntroStarted,
      nameLoaded,
      candidateName,
    });

    const introLockedInSession = 
      sessionStorage.getItem("maya_intro_played") === "true";
    
    const introLockedInWindow = 
      (window as typeof window & { __mayaIntroStarted?: boolean }).__mayaIntroStarted === true;

    if (
      screen !== "briefing" ||
      mayaIntroPlayed ||
      introStartedRef.current ||
      introLockedInSession ||
      introLockedInWindow ||
      !nameLoaded ||
      candidateName === "Candidate"
    ) {
      return;
    }
    introStartedRef.current = true;
    (window as typeof window & { __mayaIntroStarted?: boolean }).__mayaIntroStarted = true;
    sessionStorage.setItem("maya_intro_played", "true");

    const intro = `Hi ${candidateName}! I'm Maya, your AI interviewer from Cuemath. This is a short, voice-first screening interview. Please enable both your microphone and camera before starting — both are required for this interview. I'll guide you through each step.`;
    
    const t = setTimeout(() => {
      console.log("INTRO SPEAKING NOW");
      hardAbortRef.current = false;
      setMayaIntroPlayed(true);
      void speak(intro);
    }, 800);
    return () => clearTimeout(t);
  }, [screen, nameLoaded, candidateName, mayaIntroPlayed]);

  
  const requestMicPermission = useCallback(async () => {
    setMicStateSynced("requesting");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach((t) => t.stop());
      setMicStateSynced("granted");
    } catch {
      setMicStateSynced("denied");
      setMicVerified(false);
    }
  }, [setMicStateSynced]);

  const requestCameraPermission = useCallback(async () => {
    if (cameraStreamRef.current) {
      cameraStreamRef.current.getTracks().forEach((t) => t.stop());
      cameraStreamRef.current = null;
    }
    setCameraState("requesting");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "user",
          width: { ideal: 640 },
          height: { ideal: 360 },
        },
        audio: false,
      });
      cameraStreamRef.current = stream;
      const videoTrack = stream.getVideoTracks()[0];
      if (videoTrack)
        console.log("camera_track_settings:", videoTrack.getSettings());
      setCameraState("granted");
      setCameraVerified(true);
      const targetVideo =
        screenRef.current === "briefing"
          ? briefingVideoRef.current
          : interviewVideoRef.current;
      if (targetVideo) {
        targetVideo.srcObject = stream;
        try {
          await targetVideo.play();
        } catch (e) {
          console.error("camera_preview_initial_play_failed:", e);
        }
      }
    } catch (error) {
      console.error("camera_permission_failed:", error);
      setCameraState("denied");
      setCameraVerified(false);
    }
  }, []);

  const verifyMicrophoneWithMaya = useCallback(async () => {
    if (hardAbortRef.current || deviceCheckRunningRef.current) return;
    if (typeof window === "undefined" || micStateRef.current !== "granted")
      return;
    const SpeechAPI =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechAPI) {
      await speak(
        "Your browser does not support microphone verification. You can still continue."
      );
      return;
    }
    deviceCheckRunningRef.current = true;
    setDeviceCheckRunning(true);
    setDeviceCheckTranscript("");
    setMicVerified(false);
    await speak(
      "Let's quickly test your microphone. Please say: Maya, can you hear me clearly?"
    );
    if (hardAbortRef.current) {
      deviceCheckRunningRef.current = false;
      if (mountedRef.current) setDeviceCheckRunning(false);
      return;
    }
    const rec = new SpeechAPI();
    rec.continuous = false;
    rec.interimResults = true;
    rec.lang = "en-IN";
    let transcript = "";
    let settled = false;

    const settle = async (ok: boolean, heardText: string) => {
      if (settled) return;
      settled = true;
      try {
        rec.stop?.();
      } catch {}
      deviceCheckRunningRef.current = false;
      if (!mountedRef.current) return;
      setDeviceCheckRunning(false);
      setDeviceCheckTranscript(heardText);
      if (hardAbortRef.current) return;
      if (ok) {
        setMicVerified(true);
        await speak("Yes, I can hear you properly. Your microphone looks good to go.");
      } else {
        setMicVerified(false);
        await speak(
          "I'm not hearing you clearly yet. Please check your microphone and try the test again."
        );
      }
    };

    const timeout = setTimeout(
      () => void settle(transcript.trim().length >= 6, transcript.trim()),
      6000
    );
    rec.onresult = (e: BSREvent) => {
      let finalText = "";
      let interim = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        if (e.results[i].isFinal) finalText += e.results[i][0].transcript + " ";
        else interim += e.results[i][0].transcript;
      }
      transcript = (finalText || interim).trim();
      if (mountedRef.current) setDeviceCheckTranscript(transcript);
    };
    rec.onerror = () => {
      clearTimeout(timeout);
      void settle(false, transcript.trim());
    };
    rec.onend = () => {
      clearTimeout(timeout);
      void settle(transcript.trim().length >= 6, transcript.trim());
    };
    try {
      rec.start();
    } catch {
      clearTimeout(timeout);
      deviceCheckRunningRef.current = false;
      if (mountedRef.current) setDeviceCheckRunning(false);
      await speak("I couldn't start the microphone test. Please try again.");
    }
  }, [speak]);

  const doSend = useCallback(
    (text: string) => {
      if (hardAbortRef.current) return;
      if (sendInProgressRef.current) return;
      if (isLoadingRef.current || interviewDoneRef.current) return;
      sendInProgressRef.current = true;
      void sendMessageRef.current(text).finally(() => {
        sendInProgressRef.current = false;
      });
    },
    []
  );

  const startListening = useCallback(() => {
    if (hardAbortRef.current) return;
    if (typeof window === "undefined" || micStateRef.current !== "granted")
      return;
    if (isListeningRef.current) {
      recognitionRef.current?.stop();
      isListeningRef.current = false;
      setIsListening(false);
    }
    const SpeechAPI =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechAPI) return;

    finalTranscriptRef.current = "";
    interimTranscriptRef.current = "";
    setTranscriptPreview("");
    clearListeningTimers();

    // Reset both send guards together at the start of each new listening
    // session so stale flags from a previous question can't block this one.
    sendInProgressRef.current = false;
    utteranceSentRef.current = false;
    // Reset the onerror/onend double-fire guard per listening session.
    recognitionEndHandledRef.current = false;

    const qAtStart = questionCountRef.current;
    if (silenceAttemptRef.current[qAtStart] === undefined)
      silenceAttemptRef.current[qAtStart] = 0;

    const rec = new SpeechAPI();
    rec.continuous = true;
    rec.interimResults = true;
    rec.lang = "en-IN";

    emptyResponseTimerRef.current = setTimeout(() => {
      if (hardAbortRef.current) return;
      if (isListeningRef.current) {
        rec.stop();
        isListeningRef.current = false;
        setIsListening(false);
        setTranscriptPreview("");
      }
      if (
        !utteranceSentRef.current &&
        !sendInProgressRef.current &&
        !isLoadingRef.current &&
        !interviewDoneRef.current
      ) {
        const liveQ = questionCountRef.current;
        const attempts = silenceAttemptRef.current[liveQ] ?? 0;
        silenceAttemptRef.current[liveQ] = attempts + 1;
        utteranceSentRef.current = true;
        doSend(EMPTY_RESPONSE_TOKEN);
      }
    }, EMPTY_RESPONSE_MS);

    rec.onresult = (e: BSREvent) => {
      if (hardAbortRef.current) return;
      let newFinal = "";
      let interim = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        if (e.results[i].isFinal) newFinal += e.results[i][0].transcript + " ";
        else interim += e.results[i][0].transcript;
      }
      if (newFinal.trim())
        finalTranscriptRef.current = (
          finalTranscriptRef.current +
          " " +
          newFinal
        ).trim();
      interimTranscriptRef.current = interim.trim();
      const raw = (finalTranscriptRef.current + " " + interim).trim();
      const display = correctASRText(raw);
      if (display) {
        setTranscriptPreview(display);
        // Cancel the empty-response timer as soon as any speech is
        // detected — prevents the 10s timer and 7s silence timer from both
        // firing when the user speaks close to the 10s boundary.
        if (emptyResponseTimerRef.current) {
          clearTimeout(emptyResponseTimerRef.current);
          emptyResponseTimerRef.current = null;
        }
      }
      const liveQ = questionCountRef.current;
      silenceAttemptRef.current[liveQ] = 0;
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
      const toSubmit = (finalTranscriptRef.current + " " + interim).trim();
      if (toSubmit) {
        silenceTimerRef.current = setTimeout(() => {
          if (hardAbortRef.current || !isListeningRef.current) return;
          rec.stop();
          isListeningRef.current = false;
          setIsListening(false);
          const corrected = correctASRText(toSubmit);
          if (
            !utteranceSentRef.current &&
            !sendInProgressRef.current &&
            !isLoadingRef.current &&
            !interviewDoneRef.current
          ) {
            utteranceSentRef.current = true;
            doSend(corrected);
          }
        }, SILENCE_MS);
      }
    };

    rec.onerror = (e: BSRError) => {
      isListeningRef.current = false;
      setIsListening(false);
      clearListeningTimers();
      recognitionRef.current = null;
      if (e?.error === "aborted") return;
      if (e?.error === "not-allowed") {
        setMicStateSynced("denied");
        return;
      }
      if (
        hardAbortRef.current ||
        isLoadingRef.current ||
        interviewDoneRef.current
      )
        return;

      // Mark as handled so onend (which fires after onerror in some
      // browsers) does not attempt a second send.
      recognitionEndHandledRef.current = true;

      const combined = (
        finalTranscriptRef.current +
        " " +
        interimTranscriptRef.current
      ).trim();
      const partial = correctASRText(combined);
      if (partial && !utteranceSentRef.current && !sendInProgressRef.current) {
        utteranceSentRef.current = true;
        doSend(partial);
      } else if (
        !utteranceSentRef.current &&
        !sendInProgressRef.current
      ) {
        setTimeout(() => {
          if (
            hardAbortRef.current ||
            isLoadingRef.current ||
            interviewDoneRef.current ||
            sendInProgressRef.current ||
            utteranceSentRef.current
          )
            return;
          utteranceSentRef.current = true;
          doSend(EMPTY_RESPONSE_TOKEN);
        }, 1500);
      }
    };

    rec.onend = () => {
      isListeningRef.current = false;
      setIsListening(false);
      clearListeningTimers();
      recognitionRef.current = null;

      // Skip if onerror already handled this recognition session to
      // prevent the double-send that occurs when browsers fire both onerror
      // and onend for the same recognition instance.
      if (recognitionEndHandledRef.current) return;

      if (
        hardAbortRef.current ||
        isLoadingRef.current ||
        interviewDoneRef.current
      )
        return;
      const combined = (
        finalTranscriptRef.current +
        " " +
        interimTranscriptRef.current
      ).trim();
      const partial = correctASRText(combined);
      if (partial && !utteranceSentRef.current && !sendInProgressRef.current) {
        utteranceSentRef.current = true;
        doSend(partial);
      }
    };

    try {
      rec.start();
      recognitionRef.current = rec;
      isListeningRef.current = true;
      setIsListening(true);
    } catch (err) {
      console.error("recognition_start_failed:", err);
      recognitionRef.current = null;
      isListeningRef.current = false;
      setIsListening(false);
      clearListeningTimers();
    }
  }, [clearListeningTimers, doSend, setMicStateSynced]);

  const stopListening = useCallback(() => {
    clearListeningTimers();
    if (recognitionRef.current && isListeningRef.current)
      recognitionRef.current.stop();
    isListeningRef.current = false;
    setIsListening(false);

    // Capture transcript snapshot immediately — before the async
    // setTimeout — so we always submit what was said at stop-time, not
    // whatever refs contain after a potential re-render cycle.
    const combinedAtStop = (
      finalTranscriptRef.current +
      " " +
      interimTranscriptRef.current
    ).trim();
    const capturedAtStop = correctASRText(combinedAtStop);

    if (
      hardAbortRef.current ||
      isLoadingRef.current ||
      sendInProgressRef.current
    )
      return;

    setTimeout(() => {
      if (
        hardAbortRef.current ||
        sendInProgressRef.current ||
        isLoadingRef.current ||
        interviewDoneRef.current ||
        utteranceSentRef.current
      )
        return;
      utteranceSentRef.current = true;
      doSend(capturedAtStop || EMPTY_RESPONSE_TOKEN);
    }, 300);
  }, [clearListeningTimers, doSend]);

  const maybeStartListening = useCallback(() => {
    if (hardAbortRef.current) return;
    if (supportsSpeechRef.current && micStateRef.current === "granted")
      setTimeout(() => startListening(), 700);
  }, [startListening]);

  // ─── generateReport ───────────────────────────────────────────────────────
  const generateReport = useCallback(
    async (finalMessages: Message[]) => {
      if (hardAbortRef.current) return;
      const validMessages = finalMessages.filter(
        (m) =>
          (m.role === "user" || m.role === "assistant") &&
          typeof m.content === "string" &&
          m.content.trim().length > 0
      );
      const transcript = validMessages
        .map(
          (m) =>
            `${m.role === "user" ? "Candidate" : "Maya"}: ${m.content}`
        )
        .join("\n\n");

      try {
        localStorage.setItem("interview_transcript", transcript);
        localStorage.setItem(
          "interview_messages",
          JSON.stringify(validMessages)
        );
        localStorage.setItem("assessment_saved_at", Date.now().toString());
      } catch (e) {
        console.error("localStorage_save_failed:", e);
      }

      const tryAssess = async () => {
        if (hardAbortRef.current) return;
        const payload = { transcript, candidateName };
        const res = await fetch("/api/assess", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) {
          const errText = await res.text();
          throw new Error(
            `assess_${res.status}: ${errText.slice(0, 200)}`
          );
        }
        const raw = await res.text();
        if (!raw || !raw.trim()) throw new Error("Empty response from /api/assess");
        let data: unknown;
        try {
          data = JSON.parse(raw);
        } catch {
          throw new Error(`assess_bad_json: ${raw.slice(0, 120)}`);
        }
        try {
          localStorage.setItem("assessment_result", JSON.stringify(data));
        } catch {
          /* non-critical */
        }
        if (!hardAbortRef.current) router.push("/report");
      };

      try {
        await tryAssess();
      } catch (err) {
        console.error("assess_first_attempt_failed:", err);
        if (hardAbortRef.current) return;
        setReportError("Generating your report… please wait.");
        setTimeout(async () => {
          try {
            if (!hardAbortRef.current) await tryAssess();
          } catch (err2) {
            console.error("assess_second_attempt_failed:", err2);
            if (!hardAbortRef.current) {
              const fallback = {
                candidateName,
                overallScore: 5.5,
                overallLabel: "Adequate",
                summary: `${candidateName} completed the interview. Assessment service was temporarily unavailable.`,
                recommendation: "Consider",
                dimensions: {
                  communication: {
                    score: 5.5,
                    label: "Adequate",
                    feedback: "Manual review required.",
                    highlights: [],
                  },
                  warmth: {
                    score: 5.5,
                    label: "Adequate",
                    feedback: "Manual review required.",
                    highlights: [],
                  },
                  patience: {
                    score: 5.5,
                    label: "Adequate",
                    feedback: "Manual review required.",
                    highlights: [],
                  },
                  simplification: {
                    score: 5.5,
                    label: "Adequate",
                    feedback: "Manual review required.",
                    highlights: [],
                  },
                  fluency: {
                    score: 5.5,
                    label: "Adequate",
                    feedback: "Manual review required.",
                    highlights: [],
                  },
                },
                strengths: ["Completed the full interview"],
                improvements: [
                  "Manual review required — AI assessment unavailable",
                ],
                generatedAt: new Date().toISOString(),
                _fallback: true,
              };
              try {
                localStorage.setItem(
                  "assessment_result",
                  JSON.stringify(fallback)
                );
              } catch {
                /* ignore */
              }
              router.push("/report");
            }
          }
        }, 4000);
      }
    },
    [candidateName, router]
  );

  // ─── OLDER VERSION: stopPresenceDetection — restored pin-to-pin ──────────
  // The newer version dropped faceAbsenceTimerRef from this cleanup function.
  // That omission meant the absence-termination timeout was never cancelled
  // when the user's face returned to frame, causing ghost terminations.
  // Both faceCheckIntervalRef AND faceAbsenceTimerRef are now cleared here,
  // exactly matching the older version's behaviour.
  const stopPresenceDetection = useCallback(() => {
    if (faceCheckIntervalRef.current) {
      clearInterval(faceCheckIntervalRef.current);
      faceCheckIntervalRef.current = null;
    }
    if (faceAbsenceTimerRef.current) {
      clearTimeout(faceAbsenceTimerRef.current);
      faceAbsenceTimerRef.current = null;
    }
    if (visibilityHandlerRef.current) {
      document.removeEventListener(
        "visibilitychange",
        visibilityHandlerRef.current
      );
      visibilityHandlerRef.current = null;
    }
    faceAbsenceStartRef.current = null;
    consecutiveAbsentCountRef.current = 0;
    unknownPresenceCountRef.current = 0;
    setFaceAbsenceCountdown(null);
  }, []);

  // ─── sendMessage: always reads from messagesRef (never stale) ────────────
  const sendMessage = useCallback(
    async (text: string) => {
      if (hardAbortRef.current) return;
      const trimmed = text.trim();
      const isToken = text === EMPTY_RESPONSE_TOKEN;
      const normalizedInput = isToken ? "no response" : trimmed;
      if (
        (!trimmed && !isToken) ||
        isLoadingRef.current ||
        interviewDoneRef.current
      )
        return;

      clearListeningTimers();

      const userMsg: Message = {
        role: "user",
        content: isToken ? "(No verbal response given)" : trimmed,
      };

      // Always read from ref — never stale
      const currentMessages = messagesRef.current;
      const validPrev = currentMessages.filter(
        (m) =>
          (m.role === "user" || m.role === "assistant") &&
          typeof m.content === "string" &&
          m.content.trim().length > 0
      );
      const updatedMessages: Message[] = [...validPrev, userMsg];

      messagesRef.current = updatedMessages;
      setMessages(updatedMessages);

      setTranscriptPreview("");
      finalTranscriptRef.current = "";
      interimTranscriptRef.current = "";
      setLoading(true);

      const currentCount = questionCountRef.current;
      const currentRetryCount = retryCountRef.current[currentCount] ?? 0;

      try {
        if (hardAbortRef.current) {
          setLoading(false);
          return;
        }

        const payload = {
          messages: updatedMessages.map((m) => ({
            role: m.role,
            content: m.content,
          })),
          candidateName,
          questionCount: currentCount,
          retryCount: currentRetryCount,
        };

        console.log(
          "chat_request: msgs=" + payload.messages.length + " q=" + currentCount
        );

        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        if (hardAbortRef.current) {
          setLoading(false);
          return;
        }

        if (!res.ok) {
          const errText = await res.text();
          console.error("chat_api_error:", res.status, errText.slice(0, 200));
          throw new Error(`chat_${res.status}`);
        }

        const rawText = await res.text();
        if (!rawText || !rawText.trim()) throw new Error("Empty chat response");

        let data: Record<string, unknown>;
        try {
          data = JSON.parse(rawText) as Record<string, unknown>;
        } catch {
          throw new Error("chat_bad_json");
        }

        if (hardAbortRef.current) {
          setLoading(false);
          return;
        }
        if (
          data?.code === "QUOTA_EXCEEDED" ||
          data?.source === "fallback"
        )
          throw new Error("quota_fallback");
        if (!data?.text)
          throw new Error((data?.error as string) || "unavailable");

        const aiMsg: Message = {
          role: "assistant",
          content: data.text as string,
        };
        const nextCount = data.isFollowUp ? currentCount : currentCount + 1;
        const finalMessages: Message[] = [...updatedMessages, aiMsg];

        if (data.isFollowUp) {
          retryCountRef.current = {
            ...retryCountRef.current,
            [currentCount]: currentRetryCount + 1,
          };
        } else {
          retryCountRef.current = {
            ...retryCountRef.current,
            [currentCount]: 0,
            [nextCount]: 0,
          };
          silenceAttemptRef.current[nextCount] = 0;
        }

        messagesRef.current = finalMessages;
        setMessages(finalMessages);
        setQCount(nextCount);

        if (hardAbortRef.current) {
          setLoading(false);
          return;
        }
        await speak(data.text as string);
        if (hardAbortRef.current) {
          setLoading(false);
          return;
        }

        if (data.isComplete || nextCount >= 7) {
          setDone(true);
          setTimeout(() => void generateReport(finalMessages), 1200);
        } else {
          maybeStartListening();
        }
      } catch (err) {
        if (hardAbortRef.current) {
          setLoading(false);
          return;
        }
        const msg = err instanceof Error ? err.message : String(err);
        if (!msg.includes("quota") && msg !== "quota_fallback")
          console.error("sendMessage_error:", err);

        const { reply: fb, shouldAdvance } = buildFallbackReply(
          currentCount,
          candidateName,
          normalizedInput,
          currentRetryCount
        );
        const nextCount = shouldAdvance ? currentCount + 1 : currentCount;

        if (shouldAdvance) {
          retryCountRef.current = {
            ...retryCountRef.current,
            [currentCount]: 0,
            [nextCount]: 0,
          };
          silenceAttemptRef.current[nextCount] = 0;
        } else {
          retryCountRef.current = {
            ...retryCountRef.current,
            [currentCount]: currentRetryCount + 1,
          };
        }

        const aiMsg: Message = { role: "assistant", content: fb };
        const finalMessages: Message[] = [...updatedMessages, aiMsg];

        messagesRef.current = finalMessages;
        setMessages(finalMessages);
        setQCount(nextCount);
        setUsingFallback(true);

        if (hardAbortRef.current) {
          setLoading(false);
          return;
        }
        await speak(fb);
        if (hardAbortRef.current) {
          setLoading(false);
          return;
        }

        if (nextCount >= 7) {
          setDone(true);
          setTimeout(() => void generateReport(finalMessages), 1200);
        } else {
          maybeStartListening();
        }
      } finally {
        setLoading(false);
      }
    },
    [
      candidateName,
      clearListeningTimers,
      generateReport,
      maybeStartListening,
      setDone,
      setLoading,
      setQCount,
      speak,
    ]
  );

  useEffect(() => {
    sendMessageRef.current = sendMessage;
  }, [sendMessage]);

  const checkPresence = useCallback(async (): Promise<PresenceState> => {
    const video = interviewVideoRef.current;
    if (!video) return "unknown";
    if (
      video.readyState < 2 ||
      video.videoWidth === 0 ||
      video.videoHeight === 0
    )
      return "unknown";
    if (presenceCheckBusyRef.current) return "unknown";
    presenceCheckBusyRef.current = true;
    try {
      const vw = video.videoWidth;
      const vh = video.videoHeight;
      if (nativeFaceDetectorRef.current) {
        try {
          const faces = await nativeFaceDetectorRef.current.detect(video);
          if (faces.length === 0) return "absent";
          const validFace = faces.some((face) => {
            const box = face.boundingBox;
            const cx = box.x + box.width / 2;
            const cy = box.y + box.height / 2;
            const insideCentralRegion =
              cx > vw * 0.12 &&
              cx < vw * 0.88 &&
              cy > vh * 0.08 &&
              cy < vh * 0.92;
            const bigEnough =
              box.width >= vw * MIN_FACE_WIDTH_RATIO &&
              box.height >= vh * MIN_FACE_HEIGHT_RATIO;
            return insideCentralRegion && bigEnough;
          });
          return validFace ? "present" : "absent";
        } catch (err) {
          console.error("face_detector_detect_failed:", err);
        }
      }
      const canvas = faceCanvasRef.current;
      if (!canvas) return "unknown";
      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      if (!ctx) return "unknown";
      canvas.width = FALLBACK_SAMPLE_W;
      canvas.height = FALLBACK_SAMPLE_H;
      ctx.drawImage(video, 0, 0, FALLBACK_SAMPLE_W, FALLBACK_SAMPLE_H);
      const imageData = ctx.getImageData(
        0,
        0,
        FALLBACK_SAMPLE_W,
        FALLBACK_SAMPLE_H
      );
      const data = imageData.data;
      const gray = new Uint8ClampedArray(FALLBACK_SAMPLE_W * FALLBACK_SAMPLE_H);
      let fullSkin = 0;
      let centerSkin = 0;
      let centerPixels = 0;
      const cx1 = Math.floor(FALLBACK_SAMPLE_W * 0.25);
      const cx2 = Math.floor(FALLBACK_SAMPLE_W * 0.75);
      const cy1 = Math.floor(FALLBACK_SAMPLE_H * 0.12);
      const cy2 = Math.floor(FALLBACK_SAMPLE_H * 0.78);
      for (let y = 0; y < FALLBACK_SAMPLE_H; y++) {
        for (let x = 0; x < FALLBACK_SAMPLE_W; x++) {
          const i = y * FALLBACK_SAMPLE_W + x;
          const di = i * 4;
          const r = data[di];
          const g = data[di + 1];
          const b = data[di + 2];
          gray[i] = Math.round(0.299 * r + 0.587 * g + 0.114 * b);
          const skin = isSkinPixel(r, g, b);
          if (skin) fullSkin++;
          const inCenter =
            x >= cx1 && x <= cx2 && y >= cy1 && y <= cy2;
          if (inCenter) {
            centerPixels++;
            if (skin) centerSkin++;
          }
        }
      }
      const fullSkinRatio = fullSkin / (FALLBACK_SAMPLE_W * FALLBACK_SAMPLE_H);
      const centerSkinRatio =
        centerPixels > 0 ? centerSkin / centerPixels : 0;
      const edgeRatio = sobelLikeEdgeScore(
        gray,
        FALLBACK_SAMPLE_W,
        FALLBACK_SAMPLE_H
      );
      if (edgeRatio > TEXTURE_COMPLEXITY_MAX) return "absent";
      const looksHumanish =
        centerSkinRatio >= CENTER_SKIN_RATIO_MIN &&
        fullSkinRatio >= FULL_SKIN_RATIO_MIN &&
        edgeRatio >= EDGE_RATIO_MIN &&
        edgeRatio <= EDGE_RATIO_MAX;
      return looksHumanish ? "present" : "absent";
    } catch (err) {
      console.error("presence_check_failed:", err);
      return "unknown";
    } finally {
      presenceCheckBusyRef.current = false;
    }
  }, []);

  const stopEverythingNow = useCallback(() => {
    hardAbortRef.current = true;
    stopPresenceDetection();
    clearListeningTimers();
    try {
      recognitionRef.current?.stop();
    } catch {}
    recognitionRef.current = null;
    isListeningRef.current = false;
    sendInProgressRef.current = false;
    if (typeof window !== "undefined" && window.speechSynthesis)
      window.speechSynthesis.cancel();
    stopCameraPreview();
    setIsListening(false);
    setIsSpeaking(false);
    setIsLoading(false);
  }, [clearListeningTimers, stopCameraPreview, stopPresenceDetection]);

  const terminateInterview = useCallback(
    (reason: string) => {
      if (faceTerminatedRef.current) return;
      faceTerminatedRef.current = true;
      stopEverythingNow();
      setTerminated(true);
      setTerminationReason(reason);
    },
    [stopEverythingNow]
  );

  // ─── OLDER VERSION: startPresenceDetection — restored pin-to-pin ─────────
  // The key difference vs the newer version: the absence countdown and
  // termination are driven by faceAbsenceTimerRef (a real setTimeout) in
  // addition to the polling interval.  The newer version collapsed this into
  // the interval alone and removed faceAbsenceTimerRef, which caused the
  // timer to keep accumulating during background/hidden states and to not
  // cancel properly on presence-restore.  The older version's dual
  // mechanism (interval for polling + dedicated timeout for termination) is
  // restored here verbatim.
  const startPresenceDetection = useCallback(() => {
    if (faceCheckIntervalRef.current) return;
    faceAbsenceStartRef.current = null;
    faceTerminatedRef.current = false;
    consecutiveAbsentCountRef.current = 0;
    unknownPresenceCountRef.current = 0;
    let warmupCount = 0;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        faceAbsenceStartRef.current = null;
        consecutiveAbsentCountRef.current = 0;
        unknownPresenceCountRef.current = 0;
        if (mountedRef.current) setFaceAbsenceCountdown(null);
      }
    };
    visibilityHandlerRef.current = handleVisibilityChange;
    document.addEventListener("visibilitychange", handleVisibilityChange);

    faceCheckIntervalRef.current = setInterval(() => {
      if (
        faceTerminatedRef.current ||
        interviewDoneRef.current ||
        hardAbortRef.current
      ) {
        if (faceCheckIntervalRef.current) {
          clearInterval(faceCheckIntervalRef.current);
          faceCheckIntervalRef.current = null;
        }
        if (visibilityHandlerRef.current) {
          document.removeEventListener(
            "visibilitychange",
            visibilityHandlerRef.current
          );
          visibilityHandlerRef.current = null;
        }
        return;
      }
      if (document.hidden) return;
      if (warmupCount < PRESENCE_WARMUP_FRAMES) {
        warmupCount++;
        return;
      }
      void (async () => {
        const state = await checkPresence();
        if (state === "present") {
          // ── OLDER VERSION: cancel the absence timer on presence-restore ──
          // This is the critical difference — when the face returns to frame,
          // the dedicated faceAbsenceTimerRef timeout is explicitly cleared
          // so it cannot fire after the user has already returned.
          if (faceAbsenceTimerRef.current) {
            clearTimeout(faceAbsenceTimerRef.current);
            faceAbsenceTimerRef.current = null;
          }
          faceAbsenceStartRef.current = null;
          consecutiveAbsentCountRef.current = 0;
          unknownPresenceCountRef.current = 0;
          if (mountedRef.current) setFaceAbsenceCountdown(null);
          return;
        }
        if (state === "unknown") {
          unknownPresenceCountRef.current += 1;
          if (
            unknownPresenceCountRef.current <
            UNKNOWN_STREAK_BEFORE_SOFT_ABSENT
          ) {
            if (
              faceAbsenceStartRef.current !== null &&
              mountedRef.current
            ) {
              const absenceMs =
                Date.now() - faceAbsenceStartRef.current;
              const remainingSecs = Math.max(
                0,
                Math.ceil(
                  (FACE_ABSENCE_TERMINATE_MS - absenceMs) / 1000
                )
              );
              setFaceAbsenceCountdown(remainingSecs);
              if (absenceMs >= FACE_ABSENCE_TERMINATE_MS) {
                terminateInterview(
                  "You were not visible in the camera frame for more than 9 seconds. The interview has been terminated as per our proctoring policy."
                );
                if (mountedRef.current) setFaceAbsenceCountdown(null);
              }
            }
            return;
          }
          consecutiveAbsentCountRef.current += 1;
        } else {
          unknownPresenceCountRef.current = 0;
          consecutiveAbsentCountRef.current += 1;
        }
        if (
          consecutiveAbsentCountRef.current < CONSECUTIVE_ABSENT_THRESHOLD
        )
          return;

        // ── OLDER VERSION: set absence start and arm the dedicated timer ──
        if (faceAbsenceStartRef.current === null) {
          faceAbsenceStartRef.current = Date.now();
          // Arm faceAbsenceTimerRef as a dedicated termination timeout,
          // exactly as the older version did.  This fires independently of
          // the polling interval so termination is not delayed by a slow
          // checkPresence() call or a busy interval tick.
          if (faceAbsenceTimerRef.current) {
            clearTimeout(faceAbsenceTimerRef.current);
          }
          faceAbsenceTimerRef.current = setTimeout(() => {
            if (faceTerminatedRef.current || interviewDoneRef.current || hardAbortRef.current) return;
            terminateInterview(
              "You were not visible in the camera frame for more than 9 seconds. The interview has been terminated as per our proctoring policy."
            );
            if (mountedRef.current) setFaceAbsenceCountdown(null);
          }, FACE_ABSENCE_TERMINATE_MS);
        }

        const absenceMs = Date.now() - faceAbsenceStartRef.current;
        const remainingSecs = Math.max(
          0,
          Math.ceil((FACE_ABSENCE_TERMINATE_MS - absenceMs) / 1000)
        );
        if (mountedRef.current) setFaceAbsenceCountdown(remainingSecs);
        if (absenceMs >= FACE_ABSENCE_TERMINATE_MS) {
          terminateInterview(
            "You were not visible in the camera frame for more than 9 seconds. The interview has been terminated as per our proctoring policy."
          );
          if (mountedRef.current) setFaceAbsenceCountdown(null);
        }
      })();
    }, FACE_CHECK_INTERVAL_MS);
  }, [checkPresence, terminateInterview]);

  useEffect(() => {
    return () => {
      hardAbortRef.current = true;
      stopPresenceDetection();
      clearListeningTimers();
      try {
        recognitionRef.current?.stop();
      } catch {}
      recognitionRef.current = null;
      if (typeof window !== "undefined" && window.speechSynthesis)
        window.speechSynthesis.cancel();
      stopCameraPreview();
    };
  }, [clearListeningTimers, stopCameraPreview, stopPresenceDetection]);

  const canBeginInterview =
    micState === "granted" && cameraState === "granted";

  const beginInterview = useCallback(async () => {
    if (!canBeginInterview) {
      setShowMandatoryWarning(true);
      await speak(
        "Please enable both your microphone and camera before starting the interview. Both are required."
      );
      return;
    }
    if (isBeginning) return;
    setIsBeginning(true);
    setShowMandatoryWarning(false);
    window.speechSynthesis?.cancel();
    clearListeningTimers();
    hardAbortRef.current = false;
    faceTerminatedRef.current = false;
    setTerminated(false);
    setTerminationReason("");
    setFaceAbsenceCountdown(null);
    consecutiveAbsentCountRef.current = 0;
    unknownPresenceCountRef.current = 0;
    retryCountRef.current = Object.create(null) as Record<number, number>;
    silenceAttemptRef.current = Object.create(null) as Record<number, number>;

    // Reset all send-guard flags together when a new interview begins
    // so no stale state from a previous attempt can block the first send.
    sendInProgressRef.current = false;
    utteranceSentRef.current = false;
    recognitionEndHandledRef.current = false;

    setUsingFallback(false);

    // Set both ref and state synchronously before any await so that
    // the API call always starts with a clean message list regardless of
    // React's batching schedule.
    messagesRef.current = [];
    setMessages([]);
    setTranscriptPreview("");
    setQuestionCount(1);
    questionCountRef.current = 1;
    setDone(false);

    if (
      supportsSpeechRef.current &&
      micStateRef.current === "idle"
    ) {
      setMicStateSynced("requesting");
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
        });
        stream.getTracks().forEach((t) => t.stop());
        setMicStateSynced("granted");
      } catch {
        setMicStateSynced("denied");
      }
    }

    setScreen("interview");
    // Use a slightly longer delay (400ms vs 250ms) to ensure the
    // interview video element is mounted before we try to attach the stream,
    // reducing the "camera blank on interview start" race condition.
    setTimeout(() => {
      if (!hardAbortRef.current) {
        startPresenceDetection();
        void attachCameraStreamToVisibleVideo(true);
      }
    }, 400);

    setLoading(true);
    try {
      const initial: Message[] = [
        { role: "user", content: `Hi, my name is ${candidateName}.` },
      ];
      // Set messagesRef before the fetch so any concurrent path that
      // reads messagesRef sees the initial message, not an empty array.
      messagesRef.current = initial;
      setMessages(initial);

      const payload = {
        messages: initial.map((m) => ({
          role: m.role,
          content: m.content,
        })),
        candidateName,
        questionCount: 1,
        retryCount: 0,
        beginInterview: true,
      };

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error(`begin_interview_${res.status}`);

      const rawText = await res.text();
      let data: Record<string, unknown> = {};
      try {
        if (rawText) data = JSON.parse(rawText) as Record<string, unknown>;
      } catch {
        /* use fallback */
      }

      const text = (data?.text as string) || QUESTION_BANK[0];
      const aiMsg: Message = { role: "assistant", content: text };
      const final: Message[] = [...initial, aiMsg];

      messagesRef.current = final;
      setMessages(final);
      setQCount(2);

      if (hardAbortRef.current) return;
      await speak(text);
      if (!hardAbortRef.current) maybeStartListening();
    } catch (err) {
      console.error("beginInterview_error:", err);
      if (hardAbortRef.current) return;
      const fallback = QUESTION_BANK[0];
      const initial: Message[] = [
        { role: "user", content: `Hi, my name is ${candidateName}.` },
      ];
      const aiMsg: Message = { role: "assistant", content: fallback };
      const final: Message[] = [...initial, aiMsg];

      messagesRef.current = final;
      setMessages(final);
      setQCount(2);

      await speak(fallback);
      if (!hardAbortRef.current) maybeStartListening();
    } finally {
      setLoading(false);
      setIsBeginning(false);
    }
  }, [
    attachCameraStreamToVisibleVideo,
    canBeginInterview,
    candidateName,
    clearListeningTimers,
    isBeginning,
    maybeStartListening,
    setDone,
    setLoading,
    setMicStateSynced,
    setQCount,
    speak,
    startPresenceDetection,
  ]);

  const handleReturnHome = useCallback(() => {
    stopEverythingNow();
    router.push("/");
  }, [router, stopEverythingNow]);

  // Suppress unused variable warnings for state used only in JSX
  void micVerified;
  void cameraVerified;
  void interviewDone;

  // ─── Terminated screen ─────────────────────────────────────────────────────
  if (terminated) {
    return (
      <>
        <style dangerouslySetInnerHTML={{ __html: FONTS + css }} />
        <div
          className="ip-shell"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "40px 20px",
            position: "relative",
          }}
        >
          <div
            className="ip-grid"
            style={{ position: "absolute", inset: 0 }}
          />
          <div
            className="ip-card"
            style={{
              width: "100%",
              maxWidth: 560,
              padding: "40px",
              position: "relative",
              zIndex: 1,
            }}
          >
            <div
              style={{
                width: 72,
                height: 72,
                borderRadius: "50%",
                background: T.dangerBg,
                border: `1px solid ${T.dangerBorder}`,
                display: "grid",
                placeItems: "center",
                margin: "0 auto 24px",
              }}
            >
              <UserX size={32} color={T.danger} />
            </div>
            <h1
              style={{
                margin: "0 0 12px",
                fontSize: 24,
                fontWeight: 700,
                letterSpacing: "-0.03em",
                textAlign: "center",
              }}
            >
              Interview terminated
            </h1>
            <p
              style={{
                margin: "0 0 24px",
                fontSize: 14,
                lineHeight: 1.7,
                color: T.textSoft,
                textAlign: "center",
              }}
            >
              {terminationReason}
            </p>
            <div
              className="ip-warn-box"
              style={{
                marginBottom: 24,
                display: "flex",
                alignItems: "flex-start",
                gap: 10,
              }}
            >
              <AlertTriangle
                size={15}
                color={T.warning}
                style={{ flexShrink: 0, marginTop: 1 }}
              />
              <span>
                Please ensure you remain visible in the camera throughout the
                interview.
              </span>
            </div>
            <button
              onClick={handleReturnHome}
              className="ip-btn-primary ip-btn-full"
              style={{ height: 48, fontSize: 15 }}
            >
              Return to Home <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </>
    );
  }

  // ─── Briefing screen ────────────────────────────────────────────────────────
  if (screen === "briefing") {
    return (
      <>
        <style dangerouslySetInnerHTML={{ __html: FONTS + css }} />
        <canvas
          ref={faceCanvasRef}
          style={{ display: "none" }}
          aria-hidden="true"
        />
        <div
          className="ip-shell"
          style={{
            display: "flex",
            flexDirection: "column",
            minHeight: "100vh",
            position: "relative",
          }}
        >
          <div
            className="ip-grid"
            style={{ position: "absolute", inset: 0 }}
          />
          <header className="ip-topbar" style={{ position: "sticky", zIndex: 100 }}>
            <div className="ip-container ip-topbar-inner">
              <div className="ip-brand">
                <div className="ip-brandmark">
                  <BrainCircuit size={16} />
                </div>
                <div>
                  <div className="ip-brand-name">Cuemath</div>
                  <div className="ip-brand-sub">Tutor Screening</div>
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                <div style={{ textAlign: "right" }}>
                  <div
                    style={{
                      fontSize: 13,
                      fontWeight: 600,
                      color: T.text,
                    }}
                  >
                    {candidateName}
                  </div>
                  {candidateEmail && (
                    <div style={{ fontSize: 11, color: T.textMuted }}>
                      {candidateEmail}
                    </div>
                  )}
                </div>
                <button
                  className="ip-theme-btn"
                  onClick={toggleTheme}
                  aria-label="Toggle theme"
                >
                  {theme === "dark" ? <Sun size={15} /> : <Moon size={15} />}
                </button>
              </div>
            </div>
          </header>

          <main
            className="ip-container"
            style={{
              position: "relative",
              zIndex: 1,
              flex: 1,
              display: "grid",
              gridTemplateColumns: "400px 1fr",
              gap: 24,
              padding: "28px 28px",
              alignItems: "start",
            }}
          >
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div className="ip-card" style={{ padding: 20 }}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    marginBottom: 16,
                  }}
                >
                  <div
                    style={{
                      width: 48,
                      height: 48,
                      borderRadius: 14,
                      background: `linear-gradient(135deg,${T.accent},${T.accentAlt})`,
                      display: "grid",
                      placeItems: "center",
                      color: "#fff",
                      fontSize: 18,
                      fontWeight: 800,
                      boxShadow: `0 8px 20px ${T.accentRing}`,
                    }}
                    className={isSpeaking ? "ip-maya-pulse" : ""}
                  >
                    M
                  </div>
                  <div>
                    <div
                      style={{
                        fontSize: 15,
                        fontWeight: 700,
                        letterSpacing: "-0.025em",
                        color: T.text,
                      }}
                    >
                      Maya
                    </div>
                    <div
                      style={{
                        fontSize: 11,
                        color: T.textMuted,
                        marginTop: 2,
                      }}
                    >
                      AI Interviewer · Cuemath
                    </div>
                  </div>
                  <div style={{ marginLeft: "auto" }} className="ip-chip-ok">
                    <span
                      style={{
                        width: 6,
                        height: 6,
                        borderRadius: "50%",
                        background: T.success,
                      }}
                    />{" "}
                    Ready
                  </div>
                </div>
                <div
                  style={{
                    borderRadius: 12,
                    overflow: "hidden",
                    border: `1px solid ${T.border}`,
                    aspectRatio: "16/9",
                    background: T.inset,
                    position: "relative",
                  }}
                >
                  {cameraState === "granted" ? (
                    <video
                      ref={briefingVideoRef}
                      autoPlay
                      muted
                      playsInline
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                      }}
                    />
                  ) : (
                    <div
                      style={{
                        height: "100%",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 10,
                      }}
                    >
                      <Camera size={28} color={T.accentText} />
                      <span style={{ fontSize: 12, color: T.textMuted }}>
                        Camera preview will appear here
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <div className="ip-card" style={{ padding: 20 }}>
                <div
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: "0.10em",
                    color: T.textMuted,
                    marginBottom: 14,
                  }}
                >
                  Device Setup
                </div>
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 8,
                    marginBottom: 14,
                  }}
                >
                  <button
                    className="ip-device-btn"
                    onClick={requestMicPermission}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                      }}
                    >
                      <span
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                        }}
                      >
                        <Mic size={14} color={T.accentText} />
                        {micState === "granted"
                          ? "Microphone enabled ✓"
                          : "Enable microphone"}
                      </span>
                      {micState === "granted" && (
                        <span style={{ fontSize: 10, color: T.success }}>
                          ✓
                        </span>
                      )}
                    </div>
                  </button>
                  <button
                    className="ip-device-btn"
                    onClick={requestCameraPermission}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                      }}
                    >
                      <span
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                        }}
                      >
                        <Camera size={14} color={T.accentText} />
                        {cameraState === "granted"
                          ? "Camera enabled ✓"
                          : "Enable camera"}
                      </span>
                      {cameraState === "granted" && (
                        <span style={{ fontSize: 10, color: T.success }}>
                          ✓
                        </span>
                      )}
                    </div>
                  </button>
                  <button
                    className="ip-device-btn"
                    onClick={verifyMicrophoneWithMaya}
                    disabled={micState !== "granted" || deviceCheckRunning}
                  >
                    <span
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                      }}
                    >
                      {deviceCheckRunning ? (
                        <Loader2 size={14} className="ip-spin" />
                      ) : (
                        <Volume2 size={14} color={T.accentText} />
                      )}
                      {deviceCheckRunning
                        ? "Testing microphone…"
                        : "Test microphone with Maya"}
                    </span>
                  </button>
                </div>
                <div
                  style={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: 7,
                    marginBottom: 14,
                  }}
                >
                  <StatusPill
                    T={T}
                    ok={micState === "granted"}
                    icon={<Mic size={12} />}
                    label={micState === "granted" ? "Mic on" : "Mic off"}
                  />
                  <StatusPill
                    T={T}
                    ok={cameraState === "granted"}
                    icon={<Camera size={12} />}
                    label={
                      cameraState === "granted" ? "Camera on" : "Camera off"
                    }
                  />
                  <StatusPill
                    T={T}
                    ok={supportsSpeech}
                    icon={<Volume2 size={12} />}
                    label={
                      supportsSpeech ? "Voice support" : "No voice support"
                    }
                  />
                </div>
                {deviceCheckTranscript && (
                  <div
                    className="ip-inset"
                    style={{
                      padding: "10px 12px",
                      marginBottom: 12,
                      fontSize: 12,
                      color: T.textSoft,
                    }}
                  >
                    Heard: <em>{deviceCheckTranscript}</em>
                  </div>
                )}
                {showMandatoryWarning && (
                  <div className="ip-danger-box" style={{ marginBottom: 12 }}>
                    Please enable both microphone and camera before starting.
                  </div>
                )}
                <button
                  className="ip-btn-primary ip-btn-full"
                  onClick={beginInterview}
                  disabled={!canBeginInterview || isBeginning}
                  style={{ height: 46, fontSize: 14 }}
                >
                  {isBeginning ? (
                    <>
                      <Loader2 size={15} className="ip-spin" />
                      Starting…
                    </>
                  ) : (
                    <>
                      Begin Interview <ChevronRight size={15} />
                    </>
                  )}
                </button>
              </div>
            </div>

            <div className="ip-card" style={{ padding: 28 }}>
              <div style={{ marginBottom: 24 }}>
                <div
                  style={{
                    fontSize: 10,
                    fontWeight: 800,
                    textTransform: "uppercase",
                    letterSpacing: "0.14em",
                    color: T.accentText,
                    marginBottom: 10,
                  }}
                >
                  Interview Briefing
                </div>
                <h2
                  style={{
                    margin: "0 0 10px",
                    fontSize: 26,
                    fontWeight: 700,
                    letterSpacing: "-0.035em",
                    lineHeight: 1.2,
                  }}
                >
                  Quick overview before we start
                </h2>
                <p
                  style={{
                    margin: 0,
                    fontSize: 14,
                    lineHeight: 1.7,
                    color: T.textSoft,
                    maxWidth: 600,
                  }}
                >
                  This interview follows a consistent, voice-first screening
                  flow designed to evaluate communication, warmth, patience, and
                  teaching presence.
                </p>
              </div>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 10,
                  marginBottom: 20,
                }}
              >
                {BRIEFING_STEPS.map((step, idx) => {
                  const Icon = step.icon;
                  const active = idx === briefingStep;
                  return (
                    <button
                      key={step.title}
                      onClick={() => setBriefingStep(idx)}
                      className={active ? "ip-step-active" : "ip-step-inactive"}
                    >
                      <div
                        className={
                          active
                            ? "ip-step-icon-active"
                            : "ip-step-icon-inactive"
                        }
                      >
                        <Icon size={18} color={T.accentText} />
                      </div>
                      <div style={{ textAlign: "left" }}>
                        <div
                          style={{
                            fontSize: 13.5,
                            fontWeight: 700,
                            color: T.text,
                            marginBottom: 4,
                          }}
                        >
                          {step.title}
                        </div>
                        <div
                          style={{
                            fontSize: 12.5,
                            lineHeight: 1.55,
                            color: T.textSoft,
                          }}
                        >
                          {step.desc}
                        </div>
                      </div>
                      <div
                        style={{
                          marginLeft: "auto",
                          fontSize: 10,
                          color: T.textMuted,
                          flexShrink: 0,
                        }}
                      >
                        {idx + 1}/{BRIEFING_STEPS.length}
                      </div>
                    </button>
                  );
                })}
              </div>
              <div className="ip-inset" style={{ padding: "16px 18px" }}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    marginBottom: 10,
                  }}
                >
                  <ShieldCheck size={14} color={T.accentText} />
                  <span
                    style={{ fontSize: 12, fontWeight: 700, color: T.text }}
                  >
                    Interview rules
                  </span>
                </div>
                <ul
                  style={{
                    margin: 0,
                    padding: 0,
                    listStyle: "none",
                    display: "flex",
                    flexDirection: "column",
                    gap: 7,
                  }}
                >
                  {[
                    "Stay visible in camera throughout the interview.",
                    "If absent for more than 9 seconds, the interview ends automatically.",
                    "Speak naturally and answer in your own words.",
                  ].map((r) => (
                    <li
                      key={r}
                      style={{
                        display: "flex",
                        alignItems: "flex-start",
                        gap: 8,
                        fontSize: 12.5,
                        lineHeight: 1.5,
                        color: T.textSoft,
                      }}
                    >
                      <span
                        style={{
                          width: 5,
                          height: 5,
                          borderRadius: "50%",
                          background: T.accentText,
                          marginTop: 6,
                          flexShrink: 0,
                        }}
                      />
                      {r}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </main>
        </div>
      </>
    );
  }

  // ─── Interview screen ───────────────────────────────────────────────────────
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: FONTS + css }} />
      <canvas
        ref={faceCanvasRef}
        style={{ display: "none" }}
        aria-hidden="true"
      />

      <div
        className="ip-shell"
        style={{
          height: "100vh",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          position: "relative",
        }}
      >
        <div className="ip-grid" style={{ position: "absolute", inset: 0 }} />

        <header
          className="ip-topbar"
          style={{ flexShrink: 0, position: "relative", zIndex: 100 }}
        >
          <div className="ip-container ip-topbar-inner">
            <div className="ip-brand">
              <div className="ip-brandmark">
                <BrainCircuit size={16} />
              </div>
              <div>
                <div className="ip-brand-name">Cuemath</div>
                <div className="ip-brand-sub">Tutor Screening</div>
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
              <div style={{ textAlign: "right" }}>
                <div
                  style={{ fontSize: 13, fontWeight: 600, color: T.text }}
                >
                  {candidateName}
                </div>
                {candidateEmail && (
                  <div style={{ fontSize: 11, color: T.textMuted }}>
                    {candidateEmail}
                  </div>
                )}
              </div>
              <button
                className="ip-theme-btn"
                onClick={toggleTheme}
                aria-label="Toggle theme"
              >
                {theme === "dark" ? <Sun size={15} /> : <Moon size={15} />}
              </button>
            </div>
          </div>
        </header>

        <div
          style={{
            flex: 1,
            overflow: "hidden",
            position: "relative",
            zIndex: 1,
          }}
        >
          <div
            className="ip-container"
            style={{
              height: "100%",
              display: "grid",
              gridTemplateColumns: "320px 1fr",
              gap: 20,
              padding: "20px 28px",
              alignItems: "stretch",
            }}
          >
            {/* Sidebar */}
            <aside
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 14,
                height: "100%",
                overflowY: "auto",
              }}
            >
              <div className="ip-card" style={{ padding: 18, flexShrink: 0 }}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    marginBottom: 14,
                  }}
                >
                  <div
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: 13,
                      background: `linear-gradient(135deg,${T.accent},${T.accentAlt})`,
                      display: "grid",
                      placeItems: "center",
                      color: "#fff",
                      fontSize: 17,
                      fontWeight: 800,
                      boxShadow: `0 8px 20px ${T.accentRing}`,
                    }}
                    className={isSpeaking ? "ip-maya-pulse" : ""}
                  >
                    M
                  </div>
                  <div>
                    <div
                      style={{
                        fontSize: 14,
                        fontWeight: 700,
                        letterSpacing: "-0.025em",
                        color: T.text,
                      }}
                    >
                      Maya
                    </div>
                    <div style={{ fontSize: 11, color: T.textMuted }}>
                      AI Interviewer · Cuemath
                    </div>
                  </div>
                  <div style={{ marginLeft: "auto" }}>
                    <div
                      className={
                        isSpeaking
                          ? "ip-chip-accent"
                          : isListening
                          ? "ip-chip-ok"
                          : "ip-chip-neutral"
                      }
                    >
                      <span
                        style={{
                          width: 6,
                          height: 6,
                          borderRadius: "50%",
                          background: isSpeaking
                            ? T.accentText
                            : isListening
                            ? T.success
                            : "currentColor",
                        }}
                      />
                      {isSpeaking
                        ? "Speaking"
                        : isListening
                        ? "Listening"
                        : "Waiting"}
                    </div>
                  </div>
                </div>
                <div
                  style={{
                    borderRadius: 10,
                    overflow: "hidden",
                    border: `1px solid ${T.border}`,
                    aspectRatio: "16/9",
                    background: T.inset,
                  }}
                >
                  {cameraState === "granted" ? (
                    <video
                      ref={interviewVideoRef}
                      autoPlay
                      muted
                      playsInline
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                      }}
                    />
                  ) : (
                    <div
                      style={{
                        height: "100%",
                        display: "grid",
                        placeItems: "center",
                      }}
                    >
                      <Camera size={24} color={T.accentText} />
                    </div>
                  )}
                </div>
              </div>

              <div className="ip-card" style={{ padding: 18, flexShrink: 0 }}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    marginBottom: 10,
                  }}
                >
                  <span
                    style={{ fontSize: 12, fontWeight: 700, color: T.text }}
                  >
                    Progress
                  </span>
                  <span style={{ fontSize: 11, color: T.textMuted }}>
                    {displayCount} / {TOTAL_Q}
                  </span>
                </div>
                <div className="ip-progress-bg" style={{ marginBottom: 14 }}>
                  <div
                    className="ip-progress-fill"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
                  <StatusPill
                    T={T}
                    ok={micState === "granted"}
                    icon={<Mic size={11} />}
                    label={micState === "granted" ? "Mic on" : "Mic off"}
                  />
                  <StatusPill
                    T={T}
                    ok={cameraState === "granted"}
                    icon={<Camera size={11} />}
                    label={
                      cameraState === "granted" ? "Camera on" : "Camera off"
                    }
                  />
                </div>
              </div>

              <div className="ip-card" style={{ padding: 18, flexShrink: 0 }}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    marginBottom: 10,
                  }}
                >
                  <ShieldCheck size={13} color={T.accentText} />
                  <span
                    style={{ fontSize: 11, fontWeight: 700, color: T.text }}
                  >
                    Interview rules
                  </span>
                </div>
                <ul
                  style={{
                    margin: 0,
                    padding: 0,
                    listStyle: "none",
                    display: "flex",
                    flexDirection: "column",
                    gap: 7,
                  }}
                >
                  {[
                    "Stay visible in camera throughout.",
                    "Absent 9s+ = auto-termination.",
                    "Speak naturally in your own words.",
                  ].map((r) => (
                    <li
                      key={r}
                      style={{
                        display: "flex",
                        alignItems: "flex-start",
                        gap: 7,
                        fontSize: 11.5,
                        lineHeight: 1.5,
                        color: T.textSoft,
                      }}
                    >
                      <span
                        style={{
                          width: 4,
                          height: 4,
                          borderRadius: "50%",
                          background: T.accentText,
                          marginTop: 6,
                          flexShrink: 0,
                        }}
                      />
                      {r}
                    </li>
                  ))}
                </ul>
              </div>

              {faceAbsenceCountdown !== null && (
                <div
                  className="ip-warn-box"
                  style={{ display: "flex", gap: 8, alignItems: "flex-start" }}
                >
                  <AlertTriangle
                    size={14}
                    color={T.warning}
                    style={{ flexShrink: 0, marginTop: 1 }}
                  />
                  <span>
                    Stay visible. Terminating in{" "}
                    <strong>{faceAbsenceCountdown}s</strong>
                  </span>
                </div>
              )}
              {usingFallback && (
                <div
                  className="ip-inset"
                  style={{ padding: "10px 12px", fontSize: 11, color: T.textMuted }}
                >
                  Fallback mode active — model unavailable.
                </div>
              )}
              {reportError && (
                <div className="ip-warn-box">{reportError}</div>
              )}
            </aside>

            {/* Chat panel */}
            <div
              className="ip-card"
              style={{ display: "flex", flexDirection: "column", overflow: "hidden" }}
            >
              <div
                style={{
                  padding: "16px 22px",
                  borderBottom: `1px solid ${T.border}`,
                  flexShrink: 0,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 16,
                }}
              >
                <div>
                  <div
                    style={{
                      fontSize: 14,
                      fontWeight: 700,
                      letterSpacing: "-0.02em",
                      color: T.text,
                    }}
                  >
                    Live Interview
                  </div>
                  <div
                    style={{
                      fontSize: 12,
                      color: T.textSoft,
                      marginTop: 2,
                    }}
                  >
                    Speak naturally — Maya will guide you through each question.
                  </div>
                </div>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    flexShrink: 0,
                  }}
                >
                  <button
                    className={isListening ? "ip-btn-danger" : "ip-btn-primary"}
                    style={{
                      height: 36,
                      fontSize: 12,
                      opacity: isLoading || isSpeaking ? 0.6 : 1,
                    }}
                    onClick={isListening ? stopListening : startListening}
                    disabled={
                      isLoading || isSpeaking || micState !== "granted"
                    }
                  >
                    {isListening ? (
                      <>
                        <MicOff size={14} />
                        Stop
                      </>
                    ) : (
                      <>
                        <Mic size={14} />
                        Listen
                      </>
                    )}
                  </button>
                </div>
              </div>

              <div
                style={{ flex: 1, overflowY: "auto", padding: "20px 22px" }}
              >
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 14,
                    maxWidth: 900,
                    margin: "0 auto",
                  }}
                >
                  {messages.map((message, idx) => {
                    const isUser = message.role === "user";
                    return (
                      <div
                        key={`${message.role}-${idx}`}
                        style={{
                          display: "flex",
                          justifyContent: isUser ? "flex-end" : "flex-start",
                        }}
                      >
                        <div
                          className={
                            isUser ? "ip-bubble-user" : "ip-bubble-ai"
                          }
                          style={{ maxWidth: "78%" }}
                        >
                          <div className="ip-bubble-label">
                            {isUser ? "You" : "Maya"}
                          </div>
                          <div className="ip-bubble-text">
                            {message.content}
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  {transcriptPreview && (
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "flex-end",
                      }}
                    >
                      <div
                        className="ip-bubble-user"
                        style={{ maxWidth: "78%", opacity: 0.8 }}
                      >
                        <div className="ip-bubble-label">You</div>
                        <div className="ip-bubble-text">
                          {transcriptPreview}
                        </div>
                      </div>
                    </div>
                  )}

                  {isLoading && (
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "flex-start",
                      }}
                    >
                      <div
                        className="ip-bubble-ai"
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 10,
                        }}
                      >
                        <Loader2
                          size={16}
                          color={T.accentText}
                          className="ip-spin"
                        />
                        <span
                          style={{ fontSize: 13.5, color: T.textSoft }}
                        >
                          Maya is thinking…
                        </span>
                      </div>
                    </div>
                  )}

                  <div ref={chatEndRef} />
                </div>
              </div>

              <div
                style={{
                  padding: "12px 22px",
                  borderTop: `1px solid ${T.border}`,
                  flexShrink: 0,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <span style={{ fontSize: 12.5, color: T.textSoft }}>
                  {micState === "granted"
                    ? "Voice mode — click Listen to respond when Maya finishes speaking."
                    : "Microphone access required to participate."}
                </span>
                <div
                  className={
                    isSpeaking
                      ? "ip-chip-accent"
                      : isListening
                      ? "ip-chip-ok"
                      : "ip-chip-neutral"
                  }
                >
                  <span
                    style={{
                      width: 6,
                      height: 6,
                      borderRadius: "50%",
                      background: isSpeaking
                        ? T.accentText
                        : isListening
                        ? T.success
                        : "currentColor",
                    }}
                  />
                  {isSpeaking
                    ? "Maya speaking"
                    : isListening
                    ? "Listening"
                    : "Waiting"}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}