"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Loader2,
  Mic,
  MicOff,
  Send,
  Sparkles,
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
} from "lucide-react";

// 7s silence after user starts speaking -> accept partial answer
const SILENCE_MS = 7000;
// 10s total silence before repeat/fallback
const EMPTY_RESPONSE_MS = 10000;
// 5 main questions + intro = 6 total
const TOTAL_Q = 6;
const EMPTY_RESPONSE_TOKEN = "__EMPTY_RESPONSE__";

// 9s absence before termination
const FACE_ABSENCE_TERMINATE_MS = 9000;
// How often to run face detection (ms)
const FACE_CHECK_INTERVAL_MS = 500;

// ─── FIX 1: Tuned thresholds so distant-but-present faces don't false-trigger ──
// Minimum ratio of non-flat pixels in center ROI to consider someone present
const CENTER_MIN_BRIGHT_PIXELS_RATIO = 0.02; // lowered from 0.04
// Minimum edge density to consider someone present
const CENTER_EDGE_RATIO_THRESHOLD = 0.008; // lowered from 0.015
// Frames to skip at the start of detection (camera warm-up)
const PRESENCE_WARMUP_FRAMES = 10; // increased from 6
// Consecutive "absent" reads needed before starting the absence timer
// This prevents single-frame glitches from starting the countdown
const CONSECUTIVE_ABSENT_THRESHOLD = 3;

const FALLBACK_SAMPLE_W = 160;
const FALLBACK_SAMPLE_H = 120;

// ASR cleanup
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
  let result = text;
  for (const [pattern, replacement] of ASR_CORRECTIONS) {
    result = result.replace(pattern, replacement);
  }
  return result.trim();
}

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
    t.includes("agle question") ||
    t.includes("next pe") ||
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
    t.includes("how is your day") ||
    t.includes("how's your day") ||
    t.includes("hello") ||
    (t.includes("hi") && userText.split(" ").length <= 5);

  if (retryCount === 0) {
    const isNonAnswer =
      t === "no" ||
      t === "nothing" ||
      t === "idk" ||
      t.includes("don't know") ||
      t.includes("dont know") ||
      t.includes("not sure") ||
      t.includes("no idea") ||
      t === "(no verbal response given)" ||
      t === "no response";

    const isClarificationRequest =
      t.includes("means what") ||
      t.includes("explain me") ||
      t.includes("more detail") ||
      t.includes("what should i") ||
      t.includes("how should i") ||
      t.includes("what to say") ||
      t.includes("what do you mean") ||
      t.includes("can you explain") ||
      t.includes("rephrase") ||
      t.includes("clarify");

    if (isCasualOrGreeting) {
      const warmResponses = [
        "I'm doing wonderfully, thank you so much for asking — it really means a lot!",
        "That's so sweet of you to ask! I'm great, thank you!",
        "Aww, I appreciate that! Doing really well, thank you!",
      ];
      const warmResponse =
        warmResponses[Math.floor(Math.random() * warmResponses.length)];
      return {
        reply: `${warmResponse} ${currentQuestion}`,
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
        reply: `Of course! Just share what you personally would do or say in that moment — there's no right or wrong answer. ${currentQuestion}`,
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

function normalizeText(text: string) {
  return text.toLowerCase().replace(/\s+/g, " ").trim();
}

function getWordCount(text: string) {
  return normalizeText(text).split(" ").filter(Boolean).length;
}

function isNonAnswerText(text: string) {
  const t = normalizeText(text);
  const exact = new Set([
    "i don't know",
    "dont know",
    "do not know",
    "idk",
    "not sure",
    "no idea",
    "i have no idea",
    "can't say",
    "cannot say",
    "nothing",
    "no",
    "nope",
    "nah",
    "i dont know",
    "no i don't know",
    "no i dont know",
    "no response",
    "[no response]",
    "(no verbal response given)",
  ]);

  const strongPatterns = [
    "don't know",
    "dont know",
    "not sure",
    "no idea",
    "i have no idea",
    "cannot say",
    "can't say",
    "not familiar",
    "unfamiliar",
    "no response",
  ];

  return (
    exact.has(t) ||
    strongPatterns.some((p) => t.includes(p)) ||
    (getWordCount(t) <= 6 && (t === "no" || t === "nothing" || t === "idk"))
  );
}

export { isNonAnswerText };

const isQuotaError = (m: string) => {
  const s = m.toLowerCase();
  return (
    s.includes("quota") ||
    s.includes("429") ||
    s.includes("503") ||
    s.includes("unavailable") ||
    s.includes("resource_exhausted") ||
    s.includes("rate_limit") ||
    s.includes("rate limit")
  );
};

// ─── Sobel-like edge scoring for fallback presence detection ─────────────────
function sobelLikeEdgeScore(gray: Uint8ClampedArray, w: number, h: number) {
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

      const mag = Math.abs(gx) + Math.abs(gy);
      if (mag > 180) strongEdges++;
    }
  }

  return total > 0 ? strongEdges / total : 0;
}

const DARK = {
  page: "bg-[radial-gradient(circle_at_top,rgba(99,102,241,0.10),transparent_28%),linear-gradient(180deg,#07101f_0%,#081120_38%,#060d1a_100%)] text-white",
  header:
    "bg-[#081221]/88 border-white/10 supports-[backdrop-filter]:bg-[#081221]/72 backdrop-blur-xl",
  card: "border border-white/10 bg-[linear-gradient(180deg,rgba(16,26,45,0.98),rgba(10,18,34,0.98))] shadow-[0_18px_60px_rgba(2,8,23,0.45)]",
  panel:
    "border border-white/10 bg-[linear-gradient(180deg,rgba(12,22,40,0.95),rgba(9,18,34,0.95))]",
  bubbleAssistant:
    "border border-white/10 bg-[linear-gradient(180deg,rgba(17,28,49,0.98),rgba(12,20,36,0.98))] text-white shadow-[0_10px_30px_rgba(2,8,23,0.25)]",
  bubbleUser:
    "bg-gradient-to-br from-violet-500 via-fuchsia-500 to-violet-600 text-white shadow-[0_12px_34px_rgba(168,85,247,0.34)]",
  textSoft: "text-white/68",
  textMuted: "text-white/45",
  input:
    "border-white/10 bg-[#091321] text-white placeholder:text-white/30 shadow-inner shadow-black/20",
  actionSecondary:
    "bg-white/5 hover:bg-white/10 border-white/10 text-white/80 hover:text-white",
  actionDanger:
    "bg-gradient-to-r from-rose-500 to-red-500 hover:from-rose-400 hover:to-red-400 shadow-[0_14px_34px_rgba(239,68,68,0.32)]",
  progressBg: "bg-white/10",
  footer: "border-white/10",
  chip: "border-violet-400/20 bg-violet-400/10 text-violet-300",
  emeraldChip: "border-emerald-400/20 bg-emerald-400/10 text-emerald-300",
  stepActive:
    "border-violet-400/30 bg-violet-400/5 shadow-[0_8px_24px_rgba(124,58,237,0.10)]",
  stepInactive: "opacity-55",
  toggleBg: "bg-white/5 border-white/10",
  toggleIcon: "text-violet-300",
  stepIconActive: "bg-violet-500/20",
  stepIconInactive: "bg-white/5",
};

const LIGHT = {
  page: "bg-[radial-gradient(circle_at_top,rgba(139,92,246,0.08),transparent_30%),linear-gradient(180deg,#f5f3ff_0%,#ede9fe_40%,#f8fafc_100%)] text-gray-900",
  header:
    "bg-white/90 border-violet-100 supports-[backdrop-filter]:bg-white/80 backdrop-blur-xl",
  card: "border border-violet-100 bg-white shadow-[0_18px_60px_rgba(139,92,246,0.08)]",
  panel: "border border-violet-100/60 bg-violet-50/50",
  bubbleAssistant:
    "border border-violet-100 bg-white text-gray-800 shadow-[0_10px_30px_rgba(139,92,246,0.08)]",
  bubbleUser:
    "bg-gradient-to-br from-violet-500 via-fuchsia-500 to-violet-600 text-white shadow-[0_12px_34px_rgba(168,85,247,0.25)]",
  textSoft: "text-gray-600",
  textMuted: "text-gray-400",
  input:
    "border-violet-200 bg-white text-gray-900 placeholder:text-gray-400 shadow-inner shadow-violet-50",
  actionSecondary:
    "bg-violet-50 hover:bg-violet-100 border-violet-200 text-violet-700 hover:text-violet-800",
  actionDanger:
    "bg-gradient-to-r from-rose-500 to-red-500 hover:from-rose-400 hover:to-red-400 shadow-[0_14px_34px_rgba(239,68,68,0.20)]",
  progressBg: "bg-violet-100",
  footer: "border-violet-100",
  chip: "border-violet-300/40 bg-violet-100 text-violet-600",
  emeraldChip: "border-emerald-300/40 bg-emerald-50 text-emerald-600",
  stepActive:
    "border-violet-300/50 bg-violet-50 shadow-[0_8px_24px_rgba(124,58,237,0.06)]",
  stepInactive: "opacity-50",
  toggleBg: "bg-violet-50 border-violet-200",
  toggleIcon: "text-violet-500",
  stepIconActive: "bg-violet-100",
  stepIconInactive: "bg-gray-100",
};

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

export default function InterviewPage() {
  const router = useRouter();

  const chatEndRef = useRef<HTMLDivElement | null>(null);
  const recognitionRef = useRef<BSR | null>(null);
  const silenceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const emptyResponseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const sendMessageRef = useRef<(t: string) => Promise<void>>(() => Promise.resolve());
  const finalTranscriptRef = useRef<string>("");
  const interimTranscriptRef = useRef<string>("");
  const isListeningRef = useRef(false);
  const questionCountRef = useRef(1);
  const isLoadingRef = useRef(false);
  const interviewDoneRef = useRef(false);
  const micStateRef = useRef<"idle" | "requesting" | "granted" | "denied">("idle");
  const inputModeRef = useRef<"voice" | "typing">("voice");
  const supportsSpeechRef = useRef(false);

  const silenceAttemptRef = useRef<Record<number, number>>({});
  const retryCountRef = useRef<Record<number, number>>({});

  const briefingVideoRef = useRef<HTMLVideoElement | null>(null);
  const interviewVideoRef = useRef<HTMLVideoElement | null>(null);
  const cameraStreamRef = useRef<MediaStream | null>(null);
  const sendInProgressRef = useRef(false);

  const faceCheckIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const faceAbsenceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const faceCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const faceAbsenceStartRef = useRef<number | null>(null);
  const faceTerminatedRef = useRef(false);
  const nativeFaceDetectorRef = useRef<BrowserFaceDetector | null>(null);
  const presenceCheckBusyRef = useRef(false);
  // FIX 2: Track consecutive absent reads to avoid single-frame false positives
  const consecutiveAbsentCountRef = useRef(0);

  // FIX 3: Master hard-abort ref — set this TRUE on termination/home nav
  // and check it everywhere before doing any async work
  const hardAbortRef = useRef(false);

  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const C = theme === "dark" ? DARK : LIGHT;

  const [screen, setScreen] = useState<"briefing" | "interview">("briefing");
  const [briefingStep, setBriefingStep] = useState(0);
  const [mayaIntroPlayed, setMayaIntroPlayed] = useState(false);
  const [nameLoaded, setNameLoaded] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [candidateName, setCandidateName] = useState("Candidate");
  const [candidateEmail, setCandidateEmail] = useState("");
  const [inputText, setInputText] = useState("");
  const [transcriptPreview, setTranscriptPreview] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [interviewDone, setInterviewDone] = useState(false);
  const [questionCount, setQuestionCount] = useState(1);
  const [usingFallback, setUsingFallback] = useState(false);
  const [reportError, setReportError] = useState("");
  const [micState, setMicState] = useState<"idle" | "requesting" | "granted" | "denied">("idle");
  const [supportsSpeech, setSupportsSpeech] = useState(false);
  const [inputMode, setInputMode] = useState<"voice" | "typing">("voice");
  const [isBeginning, setIsBeginning] = useState(false);
  const [cameraState, setCameraState] = useState<"idle" | "requesting" | "granted" | "denied">("idle");
  const [micVerified, setMicVerified] = useState(false);
  const [cameraVerified, setCameraVerified] = useState(false);
  const [deviceCheckRunning, setDeviceCheckRunning] = useState(false);
  const [deviceCheckTranscript, setDeviceCheckTranscript] = useState("");
  const [silenceAttempt, setSilenceAttempt] = useState(0);
  const [showMandatoryWarning, setShowMandatoryWarning] = useState(false);
  const [faceAbsenceCountdown, setFaceAbsenceCountdown] = useState<number | null>(null);
  const [terminated, setTerminated] = useState(false);
  const [terminationReason, setTerminationReason] = useState("");

  const displayCount = Math.min(Math.max(questionCount - 1, 0), TOTAL_Q);
  const progress = Math.min((displayCount / TOTAL_Q) * 100, 100);

  const isTypingFallback = !supportsSpeech || micState === "denied";
  const isManualTypingMode =
    supportsSpeech && micState === "granted" && inputMode === "typing";
  const canUseTyping = isTypingFallback || isManualTypingMode;

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

  const setInputModeSynced = useCallback((v: "voice" | "typing") => {
    inputModeRef.current = v;
    setInputMode(v);
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
    setInputModeSynced(hasSpeech ? "voice" : "typing");

    const savedTheme = localStorage.getItem("maya_theme") as
      | "dark"
      | "light"
      | null;
    if (savedTheme) setTheme(savedTheme);

    // Always reset hard abort on mount
    hardAbortRef.current = false;
  }, [setInputModeSynced]);

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
      localStorage.setItem("maya_theme", next);
      return next;
    });
  }, []);

  const parseJson = useCallback(async (res: Response) => {
    const raw = await res.text();
    try {
      return JSON.parse(raw);
    } catch {
      throw new Error(`Bad response: ${raw.slice(0, 100)}`);
    }
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
      cameraStreamRef.current.getTracks().forEach((track) => track.stop());
      cameraStreamRef.current = null;
    }
    if (briefingVideoRef.current) briefingVideoRef.current.srcObject = null;
    if (interviewVideoRef.current) interviewVideoRef.current.srcObject = null;
  }, []);

  const attachCameraStreamToVisibleVideo = useCallback(async () => {
    const stream = cameraStreamRef.current;
    if (!stream) return;

    const targetVideo =
      screen === "briefing" ? briefingVideoRef.current : interviewVideoRef.current;
    if (!targetVideo) return;

    if (targetVideo.srcObject !== stream) {
      targetVideo.srcObject = stream;
    }

    try {
      await targetVideo.play();
    } catch (error) {
      console.error("camera_preview_play_failed:", error);
    }
  }, [screen]);

  useEffect(() => {
    void attachCameraStreamToVisibleVideo();
  }, [screen, cameraState, attachCameraStreamToVisibleVideo]);

  const speak = useCallback((text: string): Promise<void> => {
    return new Promise((resolve) => {
      if (typeof window === "undefined" || !window.speechSynthesis) {
        resolve();
        return;
      }

      // FIX 4: Check hard abort before speaking — critical for post-termination silence
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
        setIsSpeaking(false);
        resolve();
      };

      const pickVoice = () => {
        const voices = synth.getVoices();
        const chosen =
          voices.find(
            (v) =>
              v.name ===
              "Microsoft Jenny Online (Natural) - English (United States)"
          ) ||
          voices.find(
            (v) =>
              v.name ===
              "Microsoft Aria Online (Natural) - English (United States)"
          ) ||
          voices.find((v) => v.name === "Microsoft Zira - English (United States)") ||
          voices.find((v) => /jenny|aria|zira|samantha/i.test(v.name)) ||
          voices.find((v) => /google uk english female/i.test(v.name)) ||
          voices.find((v) => /female|woman/i.test(v.name)) ||
          voices.find((v) => /^en(-|_)/i.test(v.lang)) ||
          null;

        if (chosen) utterance.voice = chosen;
      };

      if (synth.getVoices().length > 0) {
        pickVoice();
      } else {
        synth.onvoiceschanged = () => pickVoice();
      }

      const safetyTimer = window.setTimeout(() => {
        settle();
      }, Math.min(text.length * 85 + 3500, 20000));

      const finish = () => {
        window.clearTimeout(safetyTimer);
        settle();
      };

      utterance.onstart = () => {
        // FIX 5: If hard abort fires while TTS is starting, cancel immediately
        if (hardAbortRef.current) {
          synth.cancel();
          finish();
          return;
        }
        setIsSpeaking(true);
      };

      utterance.onend = finish;
      utterance.onerror = finish;

      try {
        synth.speak(utterance);
      } catch {
        finish();
      }
    });
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, transcriptPreview, isLoading]);

  useEffect(() => {
    if (
      screen !== "briefing" ||
      mayaIntroPlayed ||
      !nameLoaded ||
      candidateName === "Candidate"
    ) {
      return;
    }

    const intro = `Hi ${candidateName}! I'm Maya, your AI interviewer from Cuemath. This is a short, voice-first screening interview. Please enable both your microphone and camera before starting — both are required for this interview. I'll guide you through each step.`;

    const t = setTimeout(() => {
      hardAbortRef.current = false;
      void speak(intro);
      setMayaIntroPlayed(true);
    }, 800);

    return () => clearTimeout(t);
  }, [screen, mayaIntroPlayed, nameLoaded, candidateName, speak]);

  const requestMicPermission = useCallback(async () => {
    setMicStateSynced("requesting");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach((track) => track.stop());
      setMicStateSynced("granted");
      setInputModeSynced("voice");
    } catch {
      setMicStateSynced("denied");
      setInputModeSynced("typing");
      setMicVerified(false);
    }
  }, [setMicStateSynced, setInputModeSynced]);

  const requestCameraPermission = useCallback(async () => {
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
      setCameraState("granted");
      setCameraVerified(true);

      const targetVideo =
        screen === "briefing" ? briefingVideoRef.current : interviewVideoRef.current;

      if (targetVideo) {
        targetVideo.srcObject = stream;
        try {
          await targetVideo.play();
        } catch (error) {
          console.error("camera_preview_initial_play_failed:", error);
        }
      }
    } catch (error) {
      console.error("camera_permission_failed:", error);
      setCameraState("denied");
      setCameraVerified(false);
    }
  }, [screen]);

  const verifyMicrophoneWithMaya = useCallback(async () => {
    if (typeof window === "undefined" || micStateRef.current !== "granted") return;

    const SpeechAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechAPI) {
      await speak(
        "Your browser does not support microphone verification in voice mode. You can still continue."
      );
      return;
    }

    setDeviceCheckRunning(true);
    setDeviceCheckTranscript("");
    setMicVerified(false);

    await speak(
      "Let's quickly test your microphone. Please say: Maya, can you hear me clearly?"
    );

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
      setDeviceCheckRunning(false);
      setDeviceCheckTranscript(heardText);

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

    const timeout = setTimeout(() => {
      void settle(transcript.trim().length >= 6, transcript.trim());
    }, 6000);

    rec.onresult = (e: BSREvent) => {
      let finalText = "";
      let interim = "";

      for (let i = e.resultIndex; i < e.results.length; i++) {
        if (e.results[i].isFinal) finalText += e.results[i][0].transcript + " ";
        else interim += e.results[i][0].transcript;
      }

      transcript = (finalText || interim).trim();
      setDeviceCheckTranscript(transcript);
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
      setDeviceCheckRunning(false);
      await speak("I couldn't start the microphone test. Please try again.");
    }
  }, [speak]);

  const doSend = useCallback((text: string) => {
    // FIX 6: Gate all sends on hardAbortRef
    if (hardAbortRef.current) return;
    if (sendInProgressRef.current) return;
    if (isLoadingRef.current || interviewDoneRef.current) return;

    sendInProgressRef.current = true;
    void sendMessageRef.current(text).finally(() => {
      sendInProgressRef.current = false;
    });
  }, []);

  const startListening = useCallback(() => {
    if (hardAbortRef.current) return;
    if (typeof window === "undefined" || micStateRef.current !== "granted") return;

    if (isListeningRef.current) {
      recognitionRef.current?.stop();
      isListeningRef.current = false;
      setIsListening(false);
    }

    const SpeechAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechAPI) return;

    finalTranscriptRef.current = "";
    interimTranscriptRef.current = "";
    setTranscriptPreview("");
    clearListeningTimers();
    sendInProgressRef.current = false;

    const qAtStart = questionCountRef.current;
    if (silenceAttemptRef.current[qAtStart] === undefined) {
      silenceAttemptRef.current[qAtStart] = 0;
    }

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

      if (!sendInProgressRef.current && !isLoadingRef.current && !interviewDoneRef.current) {
        const liveQ = questionCountRef.current;
        const attempts = silenceAttemptRef.current[liveQ] ?? 0;
        silenceAttemptRef.current[liveQ] = attempts + 1;
        setSilenceAttempt(attempts + 1);
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

      if (newFinal.trim()) {
        finalTranscriptRef.current = (finalTranscriptRef.current + " " + newFinal).trim();
      }

      interimTranscriptRef.current = interim.trim();

      const raw = (finalTranscriptRef.current + " " + interim).trim();
      const display = correctASRText(raw);

      if (display) {
        setTranscriptPreview(display);
        if (emptyResponseTimerRef.current) {
          clearTimeout(emptyResponseTimerRef.current);
          emptyResponseTimerRef.current = null;
        }
      }

      const liveQ = questionCountRef.current;
      silenceAttemptRef.current[liveQ] = 0;
      setSilenceAttempt(0);

      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);

      const toSubmit = (finalTranscriptRef.current + " " + interim).trim();
      if (toSubmit) {
        silenceTimerRef.current = setTimeout(() => {
          if (hardAbortRef.current) return;
          if (!isListeningRef.current) return;

          rec.stop();
          isListeningRef.current = false;
          setIsListening(false);

          const corrected = correctASRText(toSubmit);
          if (!sendInProgressRef.current && !isLoadingRef.current && !interviewDoneRef.current) {
            doSend(corrected);
          }
        }, SILENCE_MS);
      }
    };

    rec.onerror = (e: BSRError) => {
      isListeningRef.current = false;
      setIsListening(false);
      clearListeningTimers();

      if (e?.error === "aborted") return;
      if (e?.error === "not-allowed") {
        setMicStateSynced("denied");
        setInputModeSynced("typing");
        return;
      }
      if (hardAbortRef.current || isLoadingRef.current || interviewDoneRef.current) return;

      const combined = (finalTranscriptRef.current + " " + interimTranscriptRef.current).trim();
      const partial = correctASRText(combined);

      if (partial && !sendInProgressRef.current) {
        doSend(partial);
      } else if (!sendInProgressRef.current) {
        setTimeout(() => {
          if (
            hardAbortRef.current ||
            isLoadingRef.current ||
            interviewDoneRef.current ||
            sendInProgressRef.current
          ) {
            return;
          }
          doSend(EMPTY_RESPONSE_TOKEN);
        }, 1500);
      }
    };

    rec.onend = () => {
      isListeningRef.current = false;
      setIsListening(false);
      clearListeningTimers();

      if (hardAbortRef.current || isLoadingRef.current || interviewDoneRef.current) return;

      const combined = (finalTranscriptRef.current + " " + interimTranscriptRef.current).trim();
      const partial = correctASRText(combined);

      if (partial && !sendInProgressRef.current) {
        doSend(partial);
      }
    };

    recognitionRef.current = rec;
    rec.start();
    isListeningRef.current = true;
    setIsListening(true);
  }, [clearListeningTimers, doSend, setInputModeSynced, setMicStateSynced]);

  const stopListening = useCallback(() => {
    clearListeningTimers();

    if (recognitionRef.current && isListeningRef.current) {
      recognitionRef.current.stop();
    }

    isListeningRef.current = false;
    setIsListening(false);

    if (hardAbortRef.current || isLoadingRef.current || sendInProgressRef.current) return;

    const combined = (finalTranscriptRef.current + " " + interimTranscriptRef.current).trim();
    const captured = correctASRText(combined);

    setTimeout(() => {
      if (
        hardAbortRef.current ||
        sendInProgressRef.current ||
        isLoadingRef.current ||
        interviewDoneRef.current
      ) {
        return;
      }
      doSend(captured || EMPTY_RESPONSE_TOKEN);
    }, 300);
  }, [clearListeningTimers, doSend]);

  const stopSpeakingAndListen = useCallback(() => {
    if (
      typeof window === "undefined" ||
      !supportsSpeechRef.current ||
      micStateRef.current !== "granted"
    ) {
      return;
    }

    window.speechSynthesis.cancel();
    setIsSpeaking(false);
    setTimeout(() => startListening(), 700);
  }, [startListening]);

  const maybeStartListening = useCallback(() => {
    if (hardAbortRef.current) return;
    if (
      supportsSpeechRef.current &&
      micStateRef.current === "granted" &&
      inputModeRef.current === "voice"
    ) {
      setTimeout(() => startListening(), 700);
    }
  }, [startListening]);

  const generateReport = useCallback(
    async (finalMessages: Message[]) => {
      if (hardAbortRef.current) return;

      const transcript = finalMessages
        .map((m) => `${m.role === "user" ? "Candidate" : "Maya"}: ${m.content}`)
        .join("\n\n");

      try {
        localStorage.setItem("interview_transcript", transcript);
        localStorage.setItem("interview_messages", JSON.stringify(finalMessages));
        localStorage.setItem("assessment_saved_at", Date.now().toString());
      } catch {}

      const tryAssess = async () => {
        if (hardAbortRef.current) return;

        const res = await fetch("/api/assess", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ transcript, candidateName }),
        });

        const data = await parseJson(res);

        try {
          localStorage.setItem("assessment_result", JSON.stringify(data));
        } catch {}

        if (!hardAbortRef.current) {
          router.push("/report");
        }
      };

      try {
        await tryAssess();
      } catch {
        if (hardAbortRef.current) return;
        setReportError("Generating report... please wait.");
        setTimeout(async () => {
          try {
            if (!hardAbortRef.current) await tryAssess();
          } catch {
            if (!hardAbortRef.current) setReportError("Report failed. Please refresh.");
          }
        }, 3000);
      }
    },
    [candidateName, parseJson, router]
  );

  const sendMessage = useCallback(
    async (text: string) => {
      // FIX 7: Gate entire sendMessage on hardAbortRef
      if (hardAbortRef.current) return;

      const trimmed = text.trim();
      const isToken = text === EMPTY_RESPONSE_TOKEN;
      const normalizedInput = isToken ? "no response" : trimmed;

      if ((!trimmed && !isToken) || isLoadingRef.current || interviewDoneRef.current) return;

      clearListeningTimers();

      const userMsg: Message = {
        role: "user",
        content: isToken ? "(No verbal response given)" : trimmed,
      };

      const updated = [...messages, userMsg];
      setMessages(updated);
      setInputText("");
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

        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: updated,
            candidateName,
            questionCount: currentCount,
            retryCount: currentRetryCount,
          }),
        });

        if (hardAbortRef.current) {
          setLoading(false);
          return;
        }

        const data = await parseJson(res);

        if (hardAbortRef.current) {
          setLoading(false);
          return;
        }

        if (data?.code === "QUOTA_EXCEEDED" || data?.source === "fallback") {
          throw new Error("quota_fallback");
        }

        if (!res.ok || !data?.text) {
          throw new Error(data?.error || "unavailable");
        }

        const aiMsg: Message = { role: "assistant", content: data.text };
        const final = [...updated, aiMsg];
        const nextCount = data.isFollowUp ? currentCount : currentCount + 1;

        if (data.isFollowUp) {
          retryCountRef.current = {
            ...retryCountRef.current,
            [currentCount]: currentRetryCount + 1,
          };
        } else {
          retryCountRef.current = {
            ...retryCountRef.current,
            [currentCount]: 0,
          };
          silenceAttemptRef.current[nextCount] = 0;
          setSilenceAttempt(0);
        }

        setMessages(final);
        setQCount(nextCount);

        // FIX 8: Check hard abort before every speak call
        if (hardAbortRef.current) {
          setLoading(false);
          return;
        }

        await speak(data.text);

        if (hardAbortRef.current) {
          setLoading(false);
          return;
        }

        if (data.isComplete || nextCount >= 7) {
          setDone(true);
          setTimeout(() => void generateReport(final), 1200);
        } else {
          maybeStartListening();
        }
      } catch (err) {
        if (hardAbortRef.current) {
          setLoading(false);
          return;
        }

        const msg = err instanceof Error ? err.message : String(err);
        if (!isQuotaError(msg) && msg !== "quota_fallback") {
          console.error("sendMessage:", err);
        }

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
          };
          silenceAttemptRef.current[nextCount] = 0;
          setSilenceAttempt(0);
        } else {
          retryCountRef.current = {
            ...retryCountRef.current,
            [currentCount]: currentRetryCount + 1,
          };
        }

        const aiMsg: Message = { role: "assistant", content: fb };
        const final = [...updated, aiMsg];

        setMessages(final);
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
          setTimeout(() => void generateReport(final), 1200);
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
      messages,
      parseJson,
      setDone,
      setLoading,
      setQCount,
      speak,
    ]
  );

  useEffect(() => {
    sendMessageRef.current = sendMessage;
  }, [sendMessage]);

  // ─── FIX 9: Improved presence check with lower sensitivity thresholds ────────
  const checkPresence = useCallback(async (): Promise<boolean> => {
    const video = interviewVideoRef.current;
    if (!video || video.readyState < 2 || video.videoWidth === 0) return true;

    if (presenceCheckBusyRef.current) return true;
    presenceCheckBusyRef.current = true;

    try {
      // Try native FaceDetector API first (most accurate)
      if (nativeFaceDetectorRef.current) {
        try {
          const faces = await nativeFaceDetectorRef.current.detect(video);

          if (faces.length > 0) {
            const vw = video.videoWidth;
            const vh = video.videoHeight;

            const validFace = faces.some((face) => {
              const box = face.boundingBox;
              const cx = box.x + box.width / 2;
              const cy = box.y + box.height / 2;

              // FIX 10: Widened region — face can be small/distant and still valid
              const insideCentralRegion =
                cx > vw * 0.1 &&
                cx < vw * 0.9 &&
                cy > vh * 0.05 &&
                cy < vh * 0.95;

              // FIX 11: Smaller minimum size — allows for faces further from camera
              const bigEnough =
                box.width >= vw * 0.03 &&
                box.height >= vh * 0.03;

              return insideCentralRegion && bigEnough;
            });

            if (validFace) return true;
          }

          // Native API found no valid face
          return false;
        } catch (err) {
          console.error("face_detector_detect_failed:", err);
          // Fall through to pixel-based fallback
        }
      }

      // ── Pixel-based fallback (no native API or it threw) ──────────────────
      const canvas = faceCanvasRef.current;
      if (!canvas) return true;

      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      if (!ctx) return true;

      canvas.width = FALLBACK_SAMPLE_W;
      canvas.height = FALLBACK_SAMPLE_H;
      ctx.drawImage(video, 0, 0, FALLBACK_SAMPLE_W, FALLBACK_SAMPLE_H);

      // FIX 12: Wider ROI — covers more of the frame so distant faces are included
      const roiX = Math.floor(FALLBACK_SAMPLE_W * 0.1);
      const roiY = Math.floor(FALLBACK_SAMPLE_H * 0.05);
      const roiW = Math.floor(FALLBACK_SAMPLE_W * 0.8);
      const roiH = Math.floor(FALLBACK_SAMPLE_H * 0.9);

      const imageData = ctx.getImageData(roiX, roiY, roiW, roiH);
      const data = imageData.data;

      const gray = new Uint8ClampedArray(roiW * roiH);

      let nonFlatPixels = 0;
      for (let i = 0; i < gray.length; i++) {
        const r = data[i * 4];
        const g = data[i * 4 + 1];
        const b = data[i * 4 + 2];
        const lum = Math.round(0.299 * r + 0.587 * g + 0.114 * b);
        gray[i] = lum;

        // Non-flat = not pure black or white
        if (lum > 20 && lum < 245) nonFlatPixels++;
      }

      const nonFlatRatio = nonFlatPixels / gray.length;
      const edgeRatio = sobelLikeEdgeScore(gray, roiW, roiH);

      // FIX 13: Both thresholds lowered — person present even at a distance
      const looksLikePersonInFrame =
        nonFlatRatio > CENTER_MIN_BRIGHT_PIXELS_RATIO &&
        edgeRatio > CENTER_EDGE_RATIO_THRESHOLD;

      return looksLikePersonInFrame;
    } catch {
      return true;
    } finally {
      presenceCheckBusyRef.current = false;
    }
  }, []);

  const stopPresenceDetection = useCallback(() => {
    if (faceCheckIntervalRef.current) {
      clearInterval(faceCheckIntervalRef.current);
      faceCheckIntervalRef.current = null;
    }
    if (faceAbsenceTimerRef.current) {
      clearTimeout(faceAbsenceTimerRef.current);
      faceAbsenceTimerRef.current = null;
    }
    faceAbsenceStartRef.current = null;
    consecutiveAbsentCountRef.current = 0;
    setFaceAbsenceCountdown(null);
  }, []);

  // FIX 14: stopEverythingNow — guaranteed to kill ALL async activity
  const stopEverythingNow = useCallback(() => {
    // Set hard abort FIRST so all in-flight async ops bail out
    hardAbortRef.current = true;

    // Stop presence detection
    if (faceCheckIntervalRef.current) {
      clearInterval(faceCheckIntervalRef.current);
      faceCheckIntervalRef.current = null;
    }
    if (faceAbsenceTimerRef.current) {
      clearTimeout(faceAbsenceTimerRef.current);
      faceAbsenceTimerRef.current = null;
    }

    // Stop listening timers
    clearListeningTimers();

    // Stop speech recognition
    try {
      recognitionRef.current?.stop();
    } catch {}
    recognitionRef.current = null;
    isListeningRef.current = false;
    sendInProgressRef.current = false;

    // Stop TTS
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }

    // Stop camera
    stopCameraPreview();

    // Reset tracking
    faceAbsenceStartRef.current = null;
    consecutiveAbsentCountRef.current = 0;

    setFaceAbsenceCountdown(null);
    setIsListening(false);
    setIsSpeaking(false);
    setIsLoading(false);
  }, [clearListeningTimers, stopCameraPreview]);

  const terminateInterview = useCallback(
    (reason: string) => {
      if (faceTerminatedRef.current) return;
      faceTerminatedRef.current = true;

      // Kill EVERYTHING — no more API calls, no more TTS, no more listening
      stopEverythingNow();

      setTerminated(true);
      setTerminationReason(reason);
    },
    [stopEverythingNow]
  );

  const startPresenceDetection = useCallback(() => {
    if (faceCheckIntervalRef.current) return;

    faceAbsenceStartRef.current = null;
    faceTerminatedRef.current = false;
    consecutiveAbsentCountRef.current = 0;

    let warmupCount = 0;

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
        return;
      }

      if (warmupCount < PRESENCE_WARMUP_FRAMES) {
        warmupCount++;
        return;
      }

      void (async () => {
        const video = interviewVideoRef.current;
        if (!video || video.readyState < 2 || video.videoWidth === 0) return;

        const personPresent = await checkPresence();

        if (!personPresent) {
          // FIX 15: Require multiple consecutive absent reads before starting timer
          consecutiveAbsentCountRef.current += 1;

          if (consecutiveAbsentCountRef.current < CONSECUTIVE_ABSENT_THRESHOLD) {
            // Not enough consecutive absent frames — don't start the timer yet
            return;
          }

          // We have enough consecutive absent frames — start/continue the timer
          if (faceAbsenceStartRef.current === null) {
            faceAbsenceStartRef.current = Date.now();
          }

          const absenceMs = Date.now() - faceAbsenceStartRef.current;
          const remainingSecs = Math.max(
            0,
            Math.ceil((FACE_ABSENCE_TERMINATE_MS - absenceMs) / 1000)
          );

          setFaceAbsenceCountdown(remainingSecs);

          if (absenceMs >= FACE_ABSENCE_TERMINATE_MS) {
            terminateInterview(
              "You were not visible in the camera frame for more than 9 seconds. The interview has been terminated as per our proctoring policy."
            );
            setFaceAbsenceCountdown(null);
          }
        } else {
          // Person is present — reset ALL absence tracking
          if (
            faceAbsenceStartRef.current !== null ||
            consecutiveAbsentCountRef.current > 0
          ) {
            faceAbsenceStartRef.current = null;
            consecutiveAbsentCountRef.current = 0;
            setFaceAbsenceCountdown(null);
          }
        }
      })();
    }, FACE_CHECK_INTERVAL_MS);
  }, [checkPresence, terminateInterview]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      hardAbortRef.current = true;

      if (faceCheckIntervalRef.current) {
        clearInterval(faceCheckIntervalRef.current);
        faceCheckIntervalRef.current = null;
      }
      if (faceAbsenceTimerRef.current) {
        clearTimeout(faceAbsenceTimerRef.current);
        faceAbsenceTimerRef.current = null;
      }

      clearListeningTimers();

      try {
        recognitionRef.current?.stop();
      } catch {}

      if (typeof window !== "undefined" && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }

      stopCameraPreview();
    };
  }, [clearListeningTimers, stopCameraPreview]);

  const canBeginInterview = micState === "granted" && cameraState === "granted";

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

    // Reset all abort/termination state for a fresh interview
    hardAbortRef.current = false;
    faceTerminatedRef.current = false;
    setTerminated(false);
    setTerminationReason("");
    setFaceAbsenceCountdown(null);
    consecutiveAbsentCountRef.current = 0;

    retryCountRef.current = Object.create(null) as Record<number, number>;
    silenceAttemptRef.current = Object.create(null) as Record<number, number>;
    setSilenceAttempt(0);
    sendInProgressRef.current = false;
    setUsingFallback(false);
    setMessages([]);
    setTranscriptPreview("");
    setInputText("");
    setQuestionCount(1);
    questionCountRef.current = 1;
    setDone(false);

    if (supportsSpeechRef.current && micStateRef.current === "idle") {
      setMicStateSynced("requesting");
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        stream.getTracks().forEach((t) => t.stop());
        setMicStateSynced("granted");
        setInputModeSynced("voice");
      } catch {
        setMicStateSynced("denied");
        setInputModeSynced("typing");
      }
    }

    setScreen("interview");

    setTimeout(() => {
      if (!hardAbortRef.current) startPresenceDetection();
    }, 2000);

    setLoading(true);

    try {
      const initial: Message[] = [
        { role: "user", content: `Hi, my name is ${candidateName}.` },
      ];

      setMessages(initial);

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: initial,
          candidateName,
          questionCount: 1,
          retryCount: 0,
          beginInterview: true,
        }),
      });

      const data = await parseJson(res);

      const text = data?.text || QUESTION_BANK[0];

      const aiMsg: Message = { role: "assistant", content: text };
      const final = [...initial, aiMsg];
      setMessages(final);
      setQCount(2);

      if (hardAbortRef.current) return;
      await speak(text);

      if (!hardAbortRef.current) {
        maybeStartListening();
      }
    } catch (err) {
      console.error("beginInterview:", err);

      if (hardAbortRef.current) return;

      const fallback = QUESTION_BANK[0];
      const initial: Message[] = [
        { role: "user", content: `Hi, my name is ${candidateName}.` },
      ];
      const aiMsg: Message = { role: "assistant", content: fallback };
      const final = [...initial, aiMsg];

      setMessages(final);
      setQCount(2);
      await speak(fallback);

      if (!hardAbortRef.current) {
        maybeStartListening();
      }
    } finally {
      setLoading(false);
      setIsBeginning(false);
    }
  }, [
    canBeginInterview,
    candidateName,
    clearListeningTimers,
    isBeginning,
    maybeStartListening,
    parseJson,
    setDone,
    setInputModeSynced,
    setLoading,
    setMicStateSynced,
    setQCount,
    speak,
    startPresenceDetection,
  ]);

  // FIX 16: handleReturnHome calls stopEverythingNow before navigating
  const handleReturnHome = useCallback(() => {
    stopEverythingNow();
    stopPresenceDetection();
    router.push("/");
  }, [router, stopEverythingNow, stopPresenceDetection]);

  const handleManualSend = useCallback(() => {
    if (!inputText.trim()) return;
    doSend(inputText.trim());
    setInputText("");
  }, [doSend, inputText]);

  const StatusPill = ({
    ok,
    icon,
    label,
  }: {
    ok: boolean;
    icon: React.ReactNode;
    label: string;
  }) => (
    <div
      className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium ${
        ok ? C.emeraldChip : C.chip
      }`}
    >
      {icon}
      {label}
    </div>
  );

  // ─── Terminated screen ───────────────────────────────────────────────────────
  if (terminated) {
    return (
      <div className={`min-h-screen ${C.page} flex items-center justify-center px-6 py-10`}>
        <canvas ref={faceCanvasRef} className="hidden" />
        <div className={`w-full max-w-[680px] rounded-[32px] p-8 md:p-10 ${C.card}`}>
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-rose-500/15 text-rose-400">
            <UserX size={40} />
          </div>
          <h1 className="mt-6 text-center text-2xl font-bold md:text-3xl">
            Interview terminated
          </h1>
          <p className={`mt-4 text-center text-sm leading-7 ${C.textSoft}`}>
            {terminationReason}
          </p>

          <div
            className={`mt-8 rounded-[22px] border px-5 py-4 text-sm ${
              theme === "dark"
                ? "border-amber-400/20 bg-amber-400/10 text-amber-300"
                : "border-amber-200 bg-amber-50 text-amber-700"
            }`}
          >
            <AlertTriangle size={16} className="mr-2 inline-block" />
            Please ensure you remain visible in the camera throughout the interview.
          </div>

          <button
            onClick={handleReturnHome}
            className="mt-8 w-full rounded-[22px] bg-gradient-to-r from-violet-600 to-fuchsia-500 px-8 py-4 text-base font-semibold text-white shadow-[0_14px_34px_rgba(124,58,237,0.25)] transition hover:from-violet-500 hover:to-fuchsia-400"
          >
            Return to Home
          </button>
        </div>
      </div>
    );
  }

  // ─── Briefing screen ─────────────────────────────────────────────────────────
  if (screen === "briefing") {
    return (
      <div className={`min-h-screen flex flex-col transition-colors duration-300 ${C.page}`}>
        <canvas ref={faceCanvasRef} className="hidden" />

        <header className={`border-b ${C.header}`}>
          <div className="mx-auto flex w-full max-w-[1320px] items-center justify-between px-6 py-4">
            <div className="flex items-center gap-3">
              <div
                className={`flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-fuchsia-400 text-sm font-semibold text-white shadow-[0_10px_30px_rgba(168,85,247,0.35)] ${
                  isSpeaking ? "animate-pulse" : ""
                }`}
              >
                M
              </div>
              <div>
                <p
                  className={`text-sm font-semibold ${
                    theme === "dark" ? "text-white" : "text-gray-900"
                  }`}
                >
                  Maya · AI Interviewer
                </p>
                <p className="text-xs text-violet-400">Cuemath Tutor Screener</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className={`text-sm ${C.textSoft}`}>{candidateName}</p>
                <p className={`text-xs ${C.textMuted}`}>{candidateEmail}</p>
              </div>
              <button
                onClick={toggleTheme}
                className={`flex h-10 w-10 items-center justify-center rounded-2xl border transition hover:scale-105 ${C.toggleBg} ${C.toggleIcon}`}
                title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
              >
                {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
              </button>
            </div>
          </div>
        </header>

        <main className="mx-auto flex w-full max-w-[1320px] flex-1 flex-col px-6 py-8 lg:px-8">
          <div className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr]">
            <section className={`rounded-[32px] p-8 md:p-10 ${C.card}`}>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div
                    className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium ${C.chip}`}
                  >
                    <Sparkles size={14} />
                    AI tutor screening
                  </div>
                  <h1 className="mt-5 text-3xl font-bold tracking-tight md:text-4xl">
                    Welcome, {candidateName}
                  </h1>
                  <p className={`mt-4 max-w-2xl text-sm leading-7 ${C.textSoft}`}>
                    Before we begin, please enable your microphone and camera, review
                    the short briefing, and stay visible throughout the interview. If
                    you are not visible for more than 9 seconds, the interview will
                    automatically terminate.
                  </p>
                </div>
              </div>

              <div
                className={`mt-6 rounded-[22px] border px-5 py-4 text-sm ${
                  theme === "dark"
                    ? "border-amber-400/20 bg-amber-400/10 text-amber-300"
                    : "border-amber-200 bg-amber-50 text-amber-700"
                }`}
              >
                <AlertTriangle size={16} className="mr-2 inline-block" />
                Important: if your face is not visible in the camera frame for more
                than 9 seconds, the interview will be terminated automatically.
              </div>

              <div className="mt-8 grid gap-4">
                {BRIEFING_STEPS.map((step, index) => {
                  const Icon = step.icon;
                  const active = index <= briefingStep;
                  return (
                    <button
                      key={step.title}
                      onClick={() => setBriefingStep(index)}
                      className={`flex w-full items-start gap-4 rounded-[24px] border p-5 text-left transition ${
                        active ? C.stepActive : `${C.panel} ${C.stepInactive}`
                      }`}
                    >
                      <div
                        className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${
                          active ? C.stepIconActive : C.stepIconInactive
                        }`}
                      >
                        <Icon
                          size={20}
                          className={active ? "text-violet-400" : `${C.textMuted}`}
                        />
                      </div>
                      <div>
                        <p className="text-sm font-semibold">{step.title}</p>
                        <p className={`mt-1 text-sm leading-6 ${C.textSoft}`}>
                          {step.desc}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>

              <div className="mt-8 flex items-center justify-between">
                <button
                  onClick={() => setBriefingStep((s) => Math.max(0, s - 1))}
                  disabled={briefingStep === 0}
                  className={`rounded-[18px] border px-5 py-3 text-sm font-medium transition disabled:opacity-40 ${C.actionSecondary}`}
                >
                  Back
                </button>
                <button
                  onClick={() =>
                    setBriefingStep((s) => Math.min(BRIEFING_STEPS.length - 1, s + 1))
                  }
                  disabled={briefingStep >= BRIEFING_STEPS.length - 1}
                  className={`inline-flex items-center gap-2 rounded-[18px] border px-5 py-3 text-sm font-medium transition disabled:opacity-40 ${C.actionSecondary}`}
                >
                  Next
                  <ChevronRight size={16} />
                </button>
              </div>
            </section>

            <section className={`rounded-[32px] p-8 md:p-10 ${C.card}`}>
              <h2 className="text-xl font-semibold">Device setup</h2>
              <p className={`mt-2 text-sm leading-7 ${C.textSoft}`}>
                Both microphone and camera are mandatory. You can retry permissions if
                previously denied.
              </p>

              <div className="mt-6 grid gap-4">
                <div className={`rounded-[24px] p-5 ${C.panel}`}>
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-sm font-semibold">Microphone</p>
                      <p className={`mt-1 text-xs ${C.textMuted}`}>
                        Required for the voice-first interview
                      </p>
                    </div>
                    <StatusPill
                      ok={micState === "granted"}
                      icon={
                        micState === "granted" ? (
                          <CheckCircle size={14} />
                        ) : (
                          <MicOff size={14} />
                        )
                      }
                      label={
                        micState === "granted"
                          ? "Enabled"
                          : micState === "requesting"
                          ? "Requesting"
                          : micState === "denied"
                          ? "Denied"
                          : "Not enabled"
                      }
                    />
                  </div>

                  <div className="mt-4 flex flex-wrap gap-3">
                    <button
                      onClick={requestMicPermission}
                      disabled={micState === "requesting"}
                      className="rounded-[18px] bg-gradient-to-r from-violet-600 to-fuchsia-500 px-5 py-3 text-sm font-semibold text-white transition hover:from-violet-500 hover:to-fuchsia-400 disabled:opacity-60"
                    >
                      {micState === "denied" ? "Try again" : "Enable microphone"}
                    </button>

                    {micState === "granted" && (
                      <button
                        onClick={verifyMicrophoneWithMaya}
                        disabled={deviceCheckRunning}
                        className={`rounded-[18px] border px-5 py-3 text-sm font-medium transition ${C.actionSecondary}`}
                      >
                        {deviceCheckRunning ? "Testing..." : "Verify mic with Maya"}
                      </button>
                    )}
                  </div>

                  {deviceCheckTranscript && (
                    <p className={`mt-3 text-xs ${C.textMuted}`}>
                      Heard: {deviceCheckTranscript}
                    </p>
                  )}
                </div>

                <div className={`rounded-[24px] p-5 ${C.panel}`}>
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-sm font-semibold">Camera</p>
                      <p className={`mt-1 text-xs ${C.textMuted}`}>
                        Required for interview monitoring
                      </p>
                    </div>
                    <StatusPill
                      ok={cameraState === "granted"}
                      icon={
                        cameraState === "granted" ? (
                          <CheckCircle size={14} />
                        ) : (
                          <Camera size={14} />
                        )
                      }
                      label={
                        cameraState === "granted"
                          ? "Enabled"
                          : cameraState === "requesting"
                          ? "Requesting"
                          : cameraState === "denied"
                          ? "Denied"
                          : "Not enabled"
                      }
                    />
                  </div>

                  <div className="mt-4 flex flex-wrap gap-3">
                    <button
                      onClick={requestCameraPermission}
                      disabled={cameraState === "requesting"}
                      className="rounded-[18px] bg-gradient-to-r from-violet-600 to-fuchsia-500 px-5 py-3 text-sm font-semibold text-white transition hover:from-violet-500 hover:to-fuchsia-400 disabled:opacity-60"
                    >
                      {cameraState === "denied" ? "Try again" : "Enable camera"}
                    </button>
                  </div>

                  <div className="mt-4 overflow-hidden rounded-[22px] border border-white/10 bg-black/30">
                    <video
                      ref={briefingVideoRef}
                      autoPlay
                      muted
                      playsInline
                      className="aspect-video w-full object-cover"
                    />
                  </div>
                </div>
              </div>

              {showMandatoryWarning && !canBeginInterview && (
                <div className="mt-6 rounded-[22px] border border-rose-400/35 bg-rose-500/10 px-5 py-4 text-sm text-rose-300">
                  <div className="flex items-start gap-3">
                    <AlertTriangle size={18} className="mt-0.5 shrink-0" />
                    <div>
                      <p className="font-semibold">Microphone and camera are required</p>
                      <p className="mt-1">
                        {micState !== "granted" && cameraState !== "granted"
                          ? "Please enable both your microphone and camera above."
                          : micState !== "granted"
                          ? "Please enable your microphone above to proceed."
                          : "Please enable your camera above to proceed."}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <div className="mt-6 flex flex-wrap items-center gap-3">
                <StatusPill
                  ok={micVerified}
                  icon={<Mic size={14} />}
                  label={micVerified ? "Mic verified" : "Mic not verified"}
                />
                <StatusPill
                  ok={cameraVerified}
                  icon={<Camera size={14} />}
                  label={cameraVerified ? "Camera ready" : "Camera not ready"}
                />
              </div>

              {briefingStep >= BRIEFING_STEPS.length - 1 && (
                <button
                  onClick={beginInterview}
                  disabled={
                    isBeginning ||
                    (supportsSpeech && micState === "requesting") ||
                    cameraState === "requesting"
                  }
                  className={`mt-8 w-full rounded-[24px] px-8 py-5 text-base font-semibold text-white shadow-[0_18px_45px_rgba(168,85,247,0.28)] transition-all active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60 ${
                    canBeginInterview
                      ? "bg-gradient-to-r from-violet-600 to-fuchsia-500 hover:scale-[1.01] hover:from-violet-500 hover:to-fuchsia-400"
                      : "bg-gradient-to-r from-slate-600 to-slate-500 cursor-not-allowed opacity-70"
                  }`}
                >
                  {isBeginning
                    ? "Starting…"
                    : canBeginInterview
                    ? "I'm ready — Begin Interview with Maya 🎙️"
                    : "Enable Mic & Camera to Begin"}
                </button>
              )}

              <p className={`mt-4 text-center text-xs ${C.textMuted}`}>
                By continuing you agree that this interview may be used for hiring
                assessment purposes.
              </p>
            </section>
          </div>
        </main>
      </div>
    );
  }

  // ─── Interview screen ─────────────────────────────────────────────────────────
  return (
    <div className={`h-screen flex flex-col transition-colors duration-300 ${C.page}`}>
      <canvas ref={faceCanvasRef} className="hidden" />

      {faceAbsenceCountdown !== null && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-6 pointer-events-none">
          <div className="mx-4 flex items-center gap-3 rounded-[20px] border border-rose-400/40 bg-rose-500/95 px-6 py-4 shadow-[0_16px_40px_rgba(239,68,68,0.35)] backdrop-blur-xl pointer-events-auto">
            <AlertTriangle size={20} className="text-white shrink-0 animate-pulse" />
            <div>
              <p className="text-sm font-bold text-white">You are not visible in the camera!</p>
              <p className="text-xs text-white/85 mt-0.5">
                Please return to camera frame — interview terminates in{" "}
                {faceAbsenceCountdown}s
              </p>
            </div>
          </div>
        </div>
      )}

      <header className={`shrink-0 border-b ${C.header}`}>
        <div className="mx-auto flex w-full max-w-[1720px] items-center justify-between px-6 py-4 xl:px-8">
          <div className="flex items-center gap-4">
            <div
              className={`flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-fuchsia-400 text-sm font-semibold text-white shadow-[0_12px_34px_rgba(168,85,247,0.32)] ${
                isSpeaking ? "animate-pulse" : ""
              }`}
            >
              M
            </div>
            <div>
              <p
                className={`text-sm font-semibold ${
                  theme === "dark" ? "text-white" : "text-gray-900"
                }`}
              >
                Maya · AI Interviewer
              </p>
              <p className="text-xs text-violet-400">Cuemath Tutor Screener</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden text-right sm:block">
              <p className={`text-sm ${C.textSoft}`}>{candidateName}</p>
              <p className={`text-xs ${C.textMuted}`}>{candidateEmail}</p>
            </div>

            <button
              onClick={toggleTheme}
              className={`flex h-10 w-10 items-center justify-center rounded-2xl border transition hover:scale-105 ${C.toggleBg} ${C.toggleIcon}`}
              title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
            >
              {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto flex w-full max-w-[1720px] flex-1 gap-6 overflow-hidden px-6 py-6 xl:px-8">
        <aside className={`hidden w-[360px] shrink-0 xl:flex xl:flex-col rounded-[30px] p-5 ${C.card}`}>
          <div className="overflow-hidden rounded-[24px] border border-white/10 bg-black/30">
            <video
              ref={interviewVideoRef}
              autoPlay
              muted
              playsInline
              className="aspect-video w-full object-cover"
            />
          </div>

          <div className="mt-5">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold">Interview progress</p>
              <p className={`text-xs ${C.textMuted}`}>
                {displayCount}/{TOTAL_Q}
              </p>
            </div>
            <div className={`mt-3 h-2 rounded-full ${C.progressBg}`}>
              <div
                className="h-2 rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-500 transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            <StatusPill
              ok={micState === "granted"}
              icon={<Mic size={14} />}
              label={micState === "granted" ? "Mic on" : "Mic off"}
            />
            <StatusPill
              ok={cameraState === "granted"}
              icon={<Camera size={14} />}
              label={cameraState === "granted" ? "Camera on" : "Camera off"}
            />
            <StatusPill
              ok={inputMode === "voice"}
              icon={<Volume2 size={14} />}
              label={inputMode === "voice" ? "Voice mode" : "Typing mode"}
            />
          </div>

          <div className={`mt-5 rounded-[22px] border px-4 py-4 text-sm ${C.panel}`}>
            <p className="font-semibold">Interview rules</p>
            <ul className={`mt-2 space-y-2 text-xs leading-6 ${C.textSoft}`}>
              <li>• Stay visible in camera throughout the interview.</li>
              <li>• If absent for more than 9 seconds, interview ends automatically.</li>
              <li>• Speak naturally and answer in your own words.</li>
            </ul>
          </div>

          {usingFallback && (
            <div className={`mt-4 rounded-[20px] border px-4 py-3 text-xs ${C.panel}`}>
              Fallback mode is active for this turn due to model/API unavailability.
            </div>
          )}

          {reportError && (
            <div className="mt-4 rounded-[20px] border border-amber-400/30 bg-amber-400/10 px-4 py-3 text-xs text-amber-300">
              {reportError}
            </div>
          )}
        </aside>

        <main className={`flex min-w-0 flex-1 flex-col rounded-[30px] ${C.card}`}>
          <div className="border-b border-white/10 px-5 py-4 md:px-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-lg font-semibold">Live interview</p>
                <p className={`text-sm ${C.textSoft}`}>
                  Answer naturally. Maya will move through the screening step by step.
                </p>
              </div>

              <div className="flex items-center gap-2">
                {supportsSpeech && micState === "granted" && (
                  <button
                    onClick={() =>
                      setInputModeSynced(inputMode === "voice" ? "typing" : "voice")
                    }
                    className={`rounded-[16px] border px-4 py-2 text-sm font-medium ${C.actionSecondary}`}
                  >
                    Switch to {inputMode === "voice" ? "typing" : "voice"}
                  </button>
                )}

                {inputMode === "voice" && micState === "granted" ? (
                  <button
                    onClick={isListening ? stopListening : startListening}
                    className={`inline-flex items-center gap-2 rounded-[16px] px-4 py-2 text-sm font-semibold text-white ${
                      isListening
                        ? "bg-rose-500 hover:bg-rose-400"
                        : "bg-gradient-to-r from-violet-600 to-fuchsia-500 hover:from-violet-500 hover:to-fuchsia-400"
                    }`}
                  >
                    {isListening ? <MicOff size={16} /> : <Mic size={16} />}
                    {isListening ? "Stop listening" : "Start listening"}
                  </button>
                ) : (
                  <button
                    onClick={stopSpeakingAndListen}
                    disabled={!supportsSpeech || micState !== "granted"}
                    className={`inline-flex items-center gap-2 rounded-[16px] border px-4 py-2 text-sm font-medium ${C.actionSecondary} disabled:opacity-50`}
                  >
                    <Volume2 size={16} />
                    Interrupt Maya
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5 md:px-6">
            <div className="mx-auto flex max-w-[980px] flex-col gap-4">
              {messages.map((msg, idx) => (
                <div
                  key={`${msg.role}-${idx}`}
                  className={`max-w-[88%] rounded-[24px] px-5 py-4 text-sm leading-7 ${
                    msg.role === "assistant"
                      ? `${C.bubbleAssistant} self-start`
                      : `${C.bubbleUser} self-end ml-auto`
                  }`}
                >
                  <p className="mb-1 text-xs font-semibold opacity-75">
                    {msg.role === "assistant" ? "Maya" : "You"}
                  </p>
                  <p>{msg.content}</p>
                </div>
              ))}

              {transcriptPreview && (
                <div
                  className={`max-w-[88%] rounded-[24px] px-5 py-4 text-sm leading-7 border border-dashed ${C.panel} self-end ml-auto`}
                >
                  <p className="mb-1 text-xs font-semibold opacity-75">Listening…</p>
                  <p>{transcriptPreview}</p>
                </div>
              )}

              {isLoading && (
                <div
                  className={`max-w-[88%] rounded-[24px] px-5 py-4 text-sm leading-7 ${C.bubbleAssistant} self-start`}
                >
                  <div className="flex items-center gap-3">
                    <Loader2 size={16} className="animate-spin" />
                    Maya is thinking...
                  </div>
                </div>
              )}

              <div ref={chatEndRef} />
            </div>
          </div>

          <div className={`border-t px-5 py-4 md:px-6 ${C.footer}`}>
            {canUseTyping ? (
              <div className="mx-auto flex max-w-[980px] items-end gap-3">
                <textarea
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder="Type your answer here..."
                  rows={2}
                  className={`min-h-[56px] flex-1 resize-none rounded-[20px] border px-4 py-3 text-sm outline-none ${C.input}`}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleManualSend();
                    }
                  }}
                />
                <button
                  onClick={handleManualSend}
                  disabled={!inputText.trim() || isLoading}
                  className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-r from-violet-600 to-fuchsia-500 text-white transition hover:from-violet-500 hover:to-fuchsia-400 disabled:opacity-50"
                >
                  <Send size={18} />
                </button>
              </div>
            ) : (
              <div className="mx-auto flex max-w-[980px] items-center justify-between gap-4">
                <p className={`text-sm ${C.textSoft}`}>
                  Voice mode is active. Click{" "}
                  <span className="font-semibold">Start listening</span> if Maya is
                  waiting for your response.
                </p>
                <div className="flex items-center gap-2 text-xs">
                  {isListening && (
                    <span className="inline-flex items-center gap-2 rounded-full bg-emerald-500/15 px-3 py-1.5 text-emerald-400">
                      <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                      Listening
                    </span>
                  )}
                  {isSpeaking && (
                    <span className="inline-flex items-center gap-2 rounded-full bg-violet-500/15 px-3 py-1.5 text-violet-400">
                      <span className="h-2 w-2 rounded-full bg-violet-400 animate-pulse" />
                      Maya speaking
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}