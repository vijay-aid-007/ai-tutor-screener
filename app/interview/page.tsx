// "use client";

// import { useCallback, useEffect, useRef, useState } from "react";
// import { useRouter } from "next/navigation";
// import {
//   Loader2,
//   Mic,
//   MicOff,
//   Send,
//   Volume2,
//   CheckCircle,
//   Clock,
//   MessageSquare,
//   BarChart2,
//   Camera,
//   Sun,
//   Moon,
//   ChevronRight,
//   AlertTriangle,
//   UserX,
// } from "lucide-react";

// // ─── Constants ────────────────────────────────────────────────────────────────

// const SILENCE_MS = 7000;
// const EMPTY_RESPONSE_MS = 15000;
// const TOTAL_Q = 6;
// const EMPTY_RESPONSE_TOKEN = "__EMPTY_RESPONSE__";

// const FACE_ABSENCE_TERMINATE_MS = 10000;
// const FACE_CHECK_INTERVAL_MS = 500;

// const PRESENCE_WARMUP_FRAMES = 6; 
// const CONSECUTIVE_ABSENT_THRESHOLD = 2;
// const UNKNOWN_STREAK_BEFORE_SOFT_ABSENT = 6;

// const FALLBACK_SAMPLE_W = 224;
// const FALLBACK_SAMPLE_H = 168;

// const MIN_FACE_WIDTH_RATIO = 0.04;
// const MIN_FACE_HEIGHT_RATIO = 0.04;

// const CENTER_SKIN_RATIO_MIN = 0.06;  // was 0.012 — require 6% center skin coverage
// const FULL_SKIN_RATIO_MIN   = 0.03;  // was 0.006 — require 3% full-frame skin
// const EDGE_RATIO_MIN        = 0.04;  // was 0.012 — require meaningful edges (faces have edges)
// const EDGE_RATIO_MAX        = 0.16;  // was 0.22  — brick walls exceed this, faces don't

// const TEXTURE_COMPLEXITY_MAX = 0.13; // scenes above this are classified as "background texture"

// const THEME_STORAGE_KEY = "maya_theme";

// // ─── ASR corrections ──────────────────────────────────────────────────────────

// const ASR_CORRECTIONS: [RegExp, string][] = [
//   [/\bgen only\b/gi, "genuinely"],
//   [/\bgenu only\b/gi, "genuinely"],
//   [/\bgenuinely only\b/gi, "genuinely"],
//   [/\binteract to like\b/gi, "interactive, like a"],
//   [/\binteract to\b/gi, "interactive"],
//   [/\backnowledg(?:e|ing) (?:the )?feeling/gi, "acknowledge their feeling"],
//   [/\bfeel judge\b/gi, "feel judged"],
//   [/\bfeel judges\b/gi, "feel judged"],
//   [/\bor present\b/gi, "or pressured"],
//   [/\bleading question[s]?\b/gi, "leading questions"],
//   [/\bmanageable step[s]?\b/gi, "manageable steps"],
//   [/\bmanage a step[s]?\b/gi, "manageable steps"],
//   [/\bmomentom\b/gi, "momentum"],
//   [/\bmomentem\b/gi, "momentum"],
//   [/\bcelebrate small\b/gi, "celebrate small"],
//   [/\bcelebreat\b/gi, "celebrate"],
//   [/\bdistract\b(?!ed|ing)/gi, "distracted"],
//   [/\bit'?s in about\b/gi, "it's not about"],
//   [/\bin about explaining\b/gi, "not about explaining"],
//   [/\bthat is in about\b/gi, "that is not about"],
//   [/\b(\w{3,})\s+\1\b/gi, "$1"],
//   [/\s+na\b\.?/gi, ""],
//   [/\s+yaar\b\.?/gi, ""],
//   [/\s+hai\b\.?/gi, ""],
//   [/\s+na\?\s*/g, ". "],
//   [/\s+only na\b/gi, " only"],
//   [/\bmachine learnings\b/gi, "machine learning"],
//   [/\bmission learning\b/gi, "machine learning"],
//   [/\bmy shin learning\b/gi, "machine learning"],
//   [/\bmisin learning\b/gi, "machine learning"],
//   [/\bmissing learning\b/gi, "machine learning"],
//   [/\bmy scene learning\b/gi, "machine learning"],
//   [/\bmy chin learning\b/gi, "machine learning"],
//   [/\bmachine learner\b/gi, "machine learning"],
//   [/\bmy shin learner\b/gi, "machine learning"],
//   [/\bartificial intelligent\b/gi, "artificial intelligence"],
//   [/\bdeep learnings\b/gi, "deep learning"],
//   [/\bneural network's\b/gi, "neural networks"],
//   [/\bcue math\b/gi, "Cuemath"],
//   [/\bcue maths\b/gi, "Cuemath"],
//   [/\bque math\b/gi, "Cuemath"],
//   [/\bque maths\b/gi, "Cuemath"],
//   [/\bq math\b/gi, "Cuemath"],
//   [/\bkew math\b/gi, "Cuemath"],
//   [/\bqueue math\b/gi, "Cuemath"],
//   [/\bcue mat\b/gi, "Cuemath"],
//   [/\bcu math\b/gi, "Cuemath"],
//   [/\bkyoomath\b/gi, "Cuemath"],
//   [/\bmath's\b/gi, "maths"],
//   [/\bi would of\b/gi, "I would have"],
//   [/\bcould of\b/gi, "could have"],
//   [/\bshould of\b/gi, "should have"],
//   [/\bwould of\b/gi, "would have"],
//   [/\btheir going\b/gi, "they're going"],
//   [/\btheir doing\b/gi, "they're doing"],
//   [/\byour welcome\b/gi, "you're welcome"],
//   [/\bits a\b/gi, "it's a"],
//   [/\bi am having\b/gi, "I have"],
//   [/\bI done\b/g, "I did"],
//   [/\bI am knowing\b/gi, "I know"],
//   [/\bI am understanding\b/gi, "I understand"],
//   [/\bI am thinking\b/gi, "I think"],
//   [/\btry your different\b/gi, "try a different"],
//   [/\brelated to something they are familiar\b/gi, "related to something they're familiar"],
//   [/\bbuild the confidence\b/gi, "build their confidence"],
//   [/\bbuild (?:a )?confidence\b/gi, "build confidence"],
//   [/\bgiving them right answer\b/gi, "giving them the right answer"],
//   [/\bgiving (?:the )?right answer\b/gi, "giving the right answer"],
//   [/\bsmall manageable\b/gi, "smaller, manageable"],
//   [/\bbreak (?:the )?problem into\b/gi, "break the problem into"],
//   [/\bsort reset\b/gi, "sort of a reset"],
//   [/\beven is sort reset\b/gi, "which is sort of a reset"],
//   [/\bsometimes even is\b/gi, "sometimes, even a"],
//   [/\bthink out loud\b/gi, "think out loud"],
//   [/\bthink aloud\b/gi, "think out loud"],
//   [/\bto all them more\b/gi, "to ask them more"],
//   [/\ball them\b/gi, "ask them"],
//   [/\s{2,}/g, " "],
// ];

// function correctASRText(text: string): string {
//   let result = text;
//   for (const [pattern, replacement] of ASR_CORRECTIONS) {
//     result = result.replace(pattern, replacement);
//   }
//   return result.trim();
// }

// // ─── Types ────────────────────────────────────────────────────────────────────

// interface Message {
//   role: "user" | "assistant";
//   content: string;
// }

// interface DetectedFace {
//   boundingBox: DOMRectReadOnly;
// }

// interface BrowserFaceDetector {
//   detect: (image: CanvasImageSource) => Promise<DetectedFace[]>;
// }

// declare global {
//   interface Window {
//     SpeechRecognition?: new () => BSR;
//     webkitSpeechRecognition?: new () => BSR;
//     FaceDetector?: new (options?: {
//       fastMode?: boolean;
//       maxDetectedFaces?: number;
//     }) => BrowserFaceDetector;
//   }
// }

// interface BSR {
//   continuous: boolean;
//   interimResults: boolean;
//   lang: string;
//   start: () => void;
//   stop: () => void;
//   onresult: ((e: BSREvent) => void) | null;
//   onend: (() => void) | null;
//   onerror: ((e: BSRError) => void) | null;
//   onaudiostart: (() => void) | null;
// }

// interface BSREvent {
//   resultIndex: number;
//   results: {
//     length: number;
//     [i: number]: { isFinal: boolean; 0: { transcript: string } };
//   };
// }

// interface BSRError {
//   error?: string;
// }

// type PresenceState = "present" | "absent" | "unknown";

// const QUESTION_BANK = [
//   "To kick things off, could you tell me a little about yourself and what drew you to tutoring?",
//   "Imagine you're explaining fractions to a 9-year-old who's been staring blankly — how would you approach that?",
//   "Picture a student who's been stuck on the same problem for 5 minutes and says they want to give up. What do you do in that moment?",
//   "How do you keep a child engaged and motivated when you can tell they're bored or distracted?",
//   "What does patience genuinely mean to you as a tutor — not just in theory, but day to day?",
//   "[name], thank you so much for your time today. We'll be in touch soon with next steps. Best of luck — I'm rooting for you!",
// ];

// const QUESTION_OPENERS = [
//   "",
//   "Great, let's move to the next one.",
//   "Good, here's the next scenario.",
//   "Thanks for that. Next question:",
//   "Appreciated. One more:",
//   "",
// ];

// function buildFallbackReply(
//   questionCount: number,
//   name: string,
//   userText: string,
//   retryCount: number
// ): { reply: string; shouldAdvance: boolean } {
//   const t = userText.toLowerCase();
//   const questionIndex = Math.max(
//     0,
//     Math.min(questionCount - 1, QUESTION_BANK.length - 2)
//   );
//   const nextIdx = Math.min(questionIndex + 1, QUESTION_BANK.length - 1);

//   const wantsToSkip =
//     t.includes("next question") ||
//     t.includes("move on") ||
//     t.includes("skip") ||
//     t.includes("next one") ||
//     t.includes("agle question") ||
//     t.includes("next pe") ||
//     (t.includes("next") && t.length <= 10);

//   if (wantsToSkip) {
//     if (nextIdx >= QUESTION_BANK.length - 1) {
//       return {
//         reply: QUESTION_BANK[QUESTION_BANK.length - 1].replace("[name]", name),
//         shouldAdvance: true,
//       };
//     }
//     const opener = QUESTION_OPENERS[nextIdx] || "Of course, let's move on.";
//     return {
//       reply: `${opener} ${QUESTION_BANK[nextIdx]}`,
//       shouldAdvance: true,
//     };
//   }

//   const currentQuestion = QUESTION_BANK[questionIndex];

//   const isCasualOrGreeting =
//     t.includes("good morning") ||
//     t.includes("good afternoon") ||
//     t.includes("good evening") ||
//     t.includes("nice to meet") ||
//     t.includes("how are you") ||
//     t.includes("how is your day") ||
//     t.includes("how's your day") ||
//     t.includes("hello") ||
//     (t.includes("hi") && userText.split(" ").length <= 5);

//   if (retryCount === 0) {
//     const isNonAnswer =
//       t === "no" ||
//       t === "nothing" ||
//       t === "idk" ||
//       t.includes("don't know") ||
//       t.includes("dont know") ||
//       t.includes("not sure") ||
//       t.includes("no idea") ||
//       t === "(no verbal response given)" ||
//       t === "no response";

//     const isClarificationRequest =
//       t.includes("means what") ||
//       t.includes("explain me") ||
//       t.includes("more detail") ||
//       t.includes("what should i") ||
//       t.includes("how should i") ||
//       t.includes("what to say") ||
//       t.includes("what do you mean") ||
//       t.includes("can you explain") ||
//       t.includes("rephrase") ||
//       t.includes("clarify");

//     if (isCasualOrGreeting) {
//       const warmResponses = [
//         "I'm doing wonderfully, thank you so much for asking — it really means a lot!",
//         "That's so sweet of you to ask! I'm great, thank you!",
//         "Aww, I appreciate that! Doing really well, thank you!",
//       ];
//       const warmResponse =
//         warmResponses[Math.floor(Math.random() * warmResponses.length)];
//       return {
//         reply: `${warmResponse} ${currentQuestion}`,
//         shouldAdvance: false,
//       };
//     }

//     if (isNonAnswer) {
//       return {
//         reply: `No worries at all — take your time! ${currentQuestion}`,
//         shouldAdvance: false,
//       };
//     }

//     if (isClarificationRequest) {
//       return {
//         reply: `Of course! Just share what you personally would do or say in that moment — there's no right or wrong answer. ${currentQuestion}`,
//         shouldAdvance: false,
//       };
//     }

//     return {
//       reply: `I'd love to hear a little bit more from you on this. ${currentQuestion}`,
//       shouldAdvance: false,
//     };
//   }

//   if (nextIdx >= QUESTION_BANK.length - 1) {
//     return {
//       reply: QUESTION_BANK[QUESTION_BANK.length - 1].replace("[name]", name),
//       shouldAdvance: true,
//     };
//   }

//   const advanceMessages = isCasualOrGreeting
//     ? "No worries at all — let's jump into it together!"
//     : "Absolutely no pressure — let's move forward.";

//   return {
//     reply: `${advanceMessages} ${QUESTION_BANK[nextIdx]}`,
//     shouldAdvance: true,
//   };
// }

// // ─── Skin detection helpers ───────────────────────────────────────────────────

// function rgbToYCrCb(r: number, g: number, b: number) {
//   const y  = 0.299 * r + 0.587 * g + 0.114 * b;
//   const cb = 128 - 0.168736 * r - 0.331264 * g + 0.5 * b;
//   const cr = 128 + 0.5 * r - 0.418688 * g - 0.081312 * b;
//   return { y, cb, cr };
// }

// function isSkinPixel(r: number, g: number, b: number): boolean {
//   const { y, cb, cr } = rgbToYCrCb(r, g, b);
//   const rgbRule =
//     r > 60 &&      // BUG-V6-1: raised from 40 to 60 — more selective
//     g > 30 &&      // raised from 20
//     b > 15 &&      // raised from 10
//     Math.max(r, g, b) - Math.min(r, g, b) > 20 && // raised from 15
//     Math.abs(r - g) > 12 && // raised from 10
//     r >= g &&
//     r >= b;
//   const ycbcrRule =
//     y > 50 &&      // raised from 30
//     cb >= 80 && cb <= 130 &&   // tightened from 77-135
//     cr >= 135 && cr <= 175;    // tightened from 133-180
//   // BUG-V6-1: Require BOTH rules to agree for more confident skin detection
//   return rgbRule && ycbcrRule;
// }

// function sobelLikeEdgeScore(
//   gray: Uint8ClampedArray,
//   w: number,
//   h: number
// ): number {
//   let strongEdges = 0;
//   const total = (w - 2) * (h - 2);
//   for (let y = 1; y < h - 1; y++) {
//     for (let x = 1; x < w - 1; x++) {
//       const i = y * w + x;
//       const gx =
//         -gray[i - w - 1] -
//         2 * gray[i - 1] -
//         gray[i + w - 1] +
//         gray[i - w + 1] +
//         2 * gray[i + 1] +
//         gray[i + w + 1];
//       const gy =
//         -gray[i - w - 1] -
//         2 * gray[i - w] -
//         gray[i - w + 1] +
//         gray[i + w - 1] +
//         2 * gray[i + w] +
//         gray[i + w + 1];
//       if (Math.abs(gx) + Math.abs(gy) > 180) strongEdges++;
//     }
//   }
//   return total > 0 ? strongEdges / total : 0;
// }

// // ─── Theme tokens ─────────────────────────────────────────────────────────────

// const DARK = {
//   page: "bg-[radial-gradient(circle_at_top,rgba(99,102,241,0.10),transparent_28%),linear-gradient(180deg,#07101f_0%,#081120_38%,#060d1a_100%)] text-white",
//   header: "bg-[#081221]/88 border-white/10 supports-[backdrop-filter]:bg-[#081221]/72 backdrop-blur-xl",
//   card: "border border-white/10 bg-[linear-gradient(180deg,rgba(16,26,45,0.98),rgba(10,18,34,0.98))] shadow-[0_18px_60px_rgba(2,8,23,0.45)]",
//   panel: "border border-white/10 bg-[linear-gradient(180deg,rgba(12,22,40,0.95),rgba(9,18,34,0.95))]",
//   bubbleAssistant: "border border-white/10 bg-[linear-gradient(180deg,rgba(17,28,49,0.98),rgba(12,20,36,0.98))] text-white shadow-[0_10px_30px_rgba(2,8,23,0.25)]",
//   bubbleUser: "bg-gradient-to-br from-violet-500 via-fuchsia-500 to-violet-600 text-white shadow-[0_12px_34px_rgba(168,85,247,0.34)]",
//   textSoft: "text-white/68",
//   textMuted: "text-white/45",
//   input: "border-white/10 bg-[#091321] text-white placeholder:text-white/30 shadow-inner shadow-black/20",
//   actionSecondary: "bg-white/5 hover:bg-white/10 border-white/10 text-white/80 hover:text-white",
//   actionDanger: "bg-gradient-to-r from-rose-500 to-red-500 hover:from-rose-400 hover:to-red-400 shadow-[0_14px_34px_rgba(239,68,68,0.32)]",
//   progressBg: "bg-white/10",
//   footer: "border-white/10",
//   chip: "border-violet-400/20 bg-violet-400/10 text-violet-300",
//   emeraldChip: "border-emerald-400/20 bg-emerald-400/10 text-emerald-300",
//   stepActive: "border-violet-400/30 bg-violet-400/5 shadow-[0_8px_24px_rgba(124,58,237,0.10)]",
//   stepInactive: "opacity-55",
//   toggleBg: "bg-white/5 border-white/10",
//   toggleIcon: "text-violet-300",
//   stepIconActive: "bg-violet-500/20",
//   stepIconInactive: "bg-white/5",
// };

// const LIGHT = {
//   page: "bg-[radial-gradient(circle_at_top,rgba(139,92,246,0.08),transparent_30%),linear-gradient(180deg,#f5f3ff_0%,#ede9fe_40%,#f8fafc_100%)] text-gray-900",
//   header: "bg-white/90 border-violet-100 supports-[backdrop-filter]:bg-white/80 backdrop-blur-xl",
//   card: "border border-violet-100 bg-white shadow-[0_18px_60px_rgba(139,92,246,0.08)]",
//   panel: "border border-violet-100/60 bg-violet-50/50",
//   bubbleAssistant: "border border-violet-100 bg-white text-gray-800 shadow-[0_10px_30px_rgba(139,92,246,0.08)]",
//   bubbleUser: "bg-gradient-to-br from-violet-500 via-fuchsia-500 to-violet-600 text-white shadow-[0_12px_34px_rgba(168,85,247,0.25)]",
//   textSoft: "text-gray-600",
//   textMuted: "text-gray-400",
//   input: "border-violet-200 bg-white text-gray-900 placeholder:text-gray-400 shadow-inner shadow-violet-50",
//   actionSecondary: "bg-violet-50 hover:bg-violet-100 border-violet-200 text-violet-700 hover:text-violet-800",
//   actionDanger: "bg-gradient-to-r from-rose-500 to-red-500 hover:from-rose-400 hover:to-red-400 shadow-[0_14px_34px_rgba(239,68,68,0.20)]",
//   progressBg: "bg-violet-100",
//   footer: "border-violet-100",
//   chip: "border-violet-300/40 bg-violet-100 text-violet-600",
//   emeraldChip: "border-emerald-300/40 bg-emerald-50 text-emerald-600",
//   stepActive: "border-violet-300/50 bg-violet-50 shadow-[0_8px_24px_rgba(124,58,237,0.06)]",
//   stepInactive: "opacity-50",
//   toggleBg: "bg-violet-50 border-violet-200",
//   toggleIcon: "text-violet-500",
//   stepIconActive: "bg-violet-100",
//   stepIconInactive: "bg-gray-100",
// };

// const BRIEFING_STEPS = [
//   {
//     icon: MessageSquare,
//     title: "Natural conversation",
//     desc: "I'll ask you thoughtful tutor-screening questions. Speak naturally — the goal is to understand how you communicate and connect with students.",
//   },
//   {
//     icon: Clock,
//     title: "About 8–10 minutes",
//     desc: "The interview is short and focused. There are no trick questions — I'm here to understand how you think and explain.",
//   },
//   {
//     icon: Mic,
//     title: "Voice-first interview",
//     desc: "This interview is designed for speaking, since tutoring happens through live conversation. Microphone is required to proceed.",
//   },
//   {
//     icon: BarChart2,
//     title: "Structured assessment",
//     desc: "After the conversation, you'll get a detailed report across clarity, warmth, patience, simplification, and English fluency.",
//   },
//   {
//     icon: CheckCircle,
//     title: "Be yourself",
//     desc: "There are no perfect answers. I'm looking for warmth, clarity, and genuine care for students — not rehearsed lines.",
//   },
// ];

// // ─── StatusPill ───────────────────────────────────────────────────────────────

// interface StatusPillProps {
//   ok: boolean;
//   icon: React.ReactNode;
//   label: string;
//   C: typeof DARK;
// }

// function StatusPill({ ok, icon, label, C }: StatusPillProps) {
//   return (
//     <div
//       className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium ${
//         ok ? C.emeraldChip : C.chip
//       }`}
//     >
//       {icon}
//       {label}
//     </div>
//   );
// }

// // ─── Component ────────────────────────────────────────────────────────────────

// export default function InterviewPage() {
//   const router = useRouter();

//   const chatEndRef            = useRef<HTMLDivElement | null>(null);
//   const recognitionRef        = useRef<BSR | null>(null);
//   const silenceTimerRef       = useRef<ReturnType<typeof setTimeout> | null>(null);
//   const emptyResponseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
//   const sendMessageRef        = useRef<(t: string) => Promise<void>>(() => Promise.resolve());
//   const finalTranscriptRef    = useRef<string>("");
//   const interimTranscriptRef  = useRef<string>("");
//   const isListeningRef        = useRef(false);
//   const questionCountRef      = useRef(1);
//   const isLoadingRef          = useRef(false);
//   const interviewDoneRef      = useRef(false);
//   const micStateRef           = useRef<"idle" | "requesting" | "granted" | "denied">("idle");
//   const inputModeRef          = useRef<"voice" | "typing">("voice");
//   const supportsSpeechRef     = useRef(false);

//   const silenceAttemptRef = useRef<Record<number, number>>({});
//   const retryCountRef     = useRef<Record<number, number>>({});

//   const briefingVideoRef  = useRef<HTMLVideoElement | null>(null);
//   const interviewVideoRef = useRef<HTMLVideoElement | null>(null);
//   const cameraStreamRef   = useRef<MediaStream | null>(null);
//   const sendInProgressRef = useRef(false);

//   const utteranceSentRef = useRef(false);

//   const faceCheckIntervalRef      = useRef<ReturnType<typeof setInterval> | null>(null);
//   const faceAbsenceTimerRef       = useRef<ReturnType<typeof setTimeout> | null>(null);
//   const faceCanvasRef             = useRef<HTMLCanvasElement | null>(null);
//   const faceAbsenceStartRef       = useRef<number | null>(null);
//   const faceTerminatedRef         = useRef(false);
//   const nativeFaceDetectorRef     = useRef<BrowserFaceDetector | null>(null);
//   const presenceCheckBusyRef      = useRef(false);
//   const consecutiveAbsentCountRef = useRef(0);
//   const unknownPresenceCountRef   = useRef(0);

//   const visibilityHandlerRef = useRef<(() => void) | null>(null);

//   const hardAbortRef = useRef(false);
//   const mountedRef   = useRef(true);

//   const deviceCheckRunningRef = useRef(false);

//   const [theme, setTheme] = useState<"dark" | "light">("dark");
//   const C = theme === "dark" ? DARK : LIGHT;

//   const [screen, setScreen]             = useState<"briefing" | "interview">("briefing");
//   const [briefingStep, setBriefingStep] = useState(0);
//   const [mayaIntroPlayed, setMayaIntroPlayed] = useState(false);
//   const [nameLoaded, setNameLoaded]     = useState(false);
//   const [messages, setMessages]         = useState<Message[]>([]);
//   const [candidateName, setCandidateName] = useState("Candidate");
//   const [candidateEmail, setCandidateEmail] = useState("");
//   const [inputText, setInputText]       = useState("");
//   const [transcriptPreview, setTranscriptPreview] = useState("");
//   const [isListening, setIsListening]   = useState(false);
//   const [isSpeaking, setIsSpeaking]     = useState(false);
//   const [isLoading, setIsLoading]       = useState(false);
//   const [questionCount, setQuestionCount] = useState(1);
//   const [usingFallback, setUsingFallback] = useState(false);
//   const [reportError, setReportError]   = useState("");
//   const [micState, setMicState]         = useState<"idle" | "requesting" | "granted" | "denied">("idle");
//   const [supportsSpeech, setSupportsSpeech] = useState(false);
//   const [inputMode, setInputMode]       = useState<"voice" | "typing">("voice");
//   const [isBeginning, setIsBeginning]   = useState(false);
//   const [cameraState, setCameraState]   = useState<"idle" | "requesting" | "granted" | "denied">("idle");
//   const [micVerified, setMicVerified]   = useState(false);
//   const [cameraVerified, setCameraVerified] = useState(false);
//   const [deviceCheckRunning, setDeviceCheckRunning] = useState(false);
//   const [deviceCheckTranscript, setDeviceCheckTranscript] = useState("");
//   const [showMandatoryWarning, setShowMandatoryWarning] = useState(false);
//   const [faceAbsenceCountdown, setFaceAbsenceCountdown] = useState<number | null>(null);
//   const [terminated, setTerminated]     = useState(false);
//   const [terminationReason, setTerminationReason] = useState("");
//   const [interviewDone, setInterviewDone] = useState(false);
//   const _interviewDone = interviewDone;

//   const displayCount = Math.min(Math.max(questionCount - 1, 0), TOTAL_Q);
//   const progress     = Math.min((displayCount / TOTAL_Q) * 100, 100);

//   const isTypingFallback   = !supportsSpeech || micState === "denied";
//   const isManualTypingMode = supportsSpeech && micState === "granted" && inputMode === "typing";
//   const canUseTyping       = isTypingFallback || isManualTypingMode;

//   const setQCount = useCallback((n: number) => {
//     questionCountRef.current = n;
//     setQuestionCount(n);
//   }, []);

//   const setLoading = useCallback((v: boolean) => {
//     isLoadingRef.current = v;
//     setIsLoading(v);
//   }, []);

//   const setDone = useCallback((v: boolean) => {
//     interviewDoneRef.current = v;
//     setInterviewDone(v);
//   }, []);

//   const setMicStateSynced = useCallback(
//     (v: "idle" | "requesting" | "granted" | "denied") => {
//       micStateRef.current = v;
//       setMicState(v);
//     },
//     []
//   );

//   const setInputModeSynced = useCallback((v: "voice" | "typing") => {
//     inputModeRef.current = v;
//     setInputMode(v);
//   }, []);

//   useEffect(() => {
//     mountedRef.current = true;
//     return () => {
//       mountedRef.current = false;
//       deviceCheckRunningRef.current = false;
//     };
//   }, []);

//   useEffect(() => {
//     const name  = localStorage.getItem("candidate_name") || "Candidate";
//     const email = localStorage.getItem("candidate_email") || "";
//     setCandidateName(name);
//     setCandidateEmail(email);
//     setNameLoaded(true);

//     const hasSpeech =
//       typeof window !== "undefined" &&
//       (!!window.SpeechRecognition || !!window.webkitSpeechRecognition);
//     supportsSpeechRef.current = hasSpeech;
//     setSupportsSpeech(hasSpeech);
//     setInputModeSynced(hasSpeech ? "voice" : "typing");

//     const savedTheme = localStorage.getItem(THEME_STORAGE_KEY) as "dark" | "light" | null;
//     if (savedTheme) setTheme(savedTheme);

//     hardAbortRef.current = false;
//   }, [setInputModeSynced]);

//   useEffect(() => {
//     if (typeof window === "undefined") return;
//     if ("FaceDetector" in window && !nativeFaceDetectorRef.current) {
//       try {
//         nativeFaceDetectorRef.current = new (window.FaceDetector!)({
//           fastMode: true,
//           maxDetectedFaces: 1,
//         });
//       } catch (err) {
//         console.error("face_detector_init_failed:", err);
//         nativeFaceDetectorRef.current = null;
//       }
//     }
//   }, []);

  
//   const screenRef = useRef<"briefing" | "interview">(screen);
//   useEffect(() => {
//     screenRef.current = screen;
//   }, [screen]);

//   const toggleTheme = useCallback(() => {
//     setTheme((t) => {
//       const next = t === "dark" ? "light" : "dark";
//       localStorage.setItem(THEME_STORAGE_KEY, next);
//       return next;
//     });
//   }, []);

//   const parseJson = useCallback(async (res: Response) => {
//     const raw = await res.text();
//     try {
//       return JSON.parse(raw) as Record<string, unknown>;
//     } catch {
//       throw new Error(`Bad response: ${raw.slice(0, 100)}`);
//     }
//   }, []);

//   const clearListeningTimers = useCallback(() => {
//     if (silenceTimerRef.current) {
//       clearTimeout(silenceTimerRef.current);
//       silenceTimerRef.current = null;
//     }
//     if (emptyResponseTimerRef.current) {
//       clearTimeout(emptyResponseTimerRef.current);
//       emptyResponseTimerRef.current = null;
//     }
//   }, []);

//   const stopCameraPreview = useCallback(() => {
//     if (cameraStreamRef.current) {
//       cameraStreamRef.current.getTracks().forEach((track) => track.stop());
//       cameraStreamRef.current = null;
//     }
//     if (briefingVideoRef.current)  briefingVideoRef.current.srcObject = null;
//     if (interviewVideoRef.current) interviewVideoRef.current.srcObject = null;
//   }, []);

//   // BUG-P12 FIX: reads screenRef.current at call time, not stale closure.
//   const attachCameraStreamToVisibleVideo = useCallback(
//     async (retryOnNull = true) => {
//       const stream = cameraStreamRef.current;
//       if (!stream) return;
//       const currentScreen = screenRef.current;
//       const targetVideo =
//         currentScreen === "briefing"
//           ? briefingVideoRef.current
//           : interviewVideoRef.current;
//       if (!targetVideo) {
//         if (retryOnNull) {
//           setTimeout(() => void attachCameraStreamToVisibleVideo(false), 200);
//         }
//         return;
//       }
//       if (targetVideo.srcObject !== stream) {
//         targetVideo.srcObject = stream;
//       }
//       try {
//         await targetVideo.play();
//       } catch (error) {
//         console.error("camera_preview_play_failed:", error);
//       }
//     },
//     []
//   );

//   useEffect(() => {
//     void attachCameraStreamToVisibleVideo();
//   }, [screen, cameraState, attachCameraStreamToVisibleVideo]);

//   const speak = useCallback((text: string): Promise<void> => {
//     return new Promise((resolve) => {
//       if (typeof window === "undefined" || !window.speechSynthesis) {
//         resolve();
//         return;
//       }
//       if (hardAbortRef.current) {
//         resolve();
//         return;
//       }

//       const synth = window.speechSynthesis;
//       synth.cancel();

//       const utterance = new SpeechSynthesisUtterance(text);
//       utterance.rate   = 0.8;
//       utterance.pitch  = 1.4;
//       utterance.volume = 1;
//       utterance.lang   = "en-US";

//       let settled = false;
//       const settle = () => {
//         if (settled) return;
//         settled = true;
//         if (mountedRef.current) setIsSpeaking(false);
//         resolve();
//       };

//       const pickVoice = () => {
//         const voices = synth.getVoices();
//         const chosen =
//           voices.find((v) => v.name === "Microsoft Jenny Online (Natural) - English (United States)") ||
//           voices.find((v) => v.name === "Microsoft Aria Online (Natural) - English (United States)") ||
//           voices.find((v) => v.name === "Microsoft Zira - English (United States)") ||
//           voices.find((v) => /jenny|aria|zira|samantha/i.test(v.name)) ||
//           voices.find((v) => /google uk english female/i.test(v.name)) ||
//           voices.find((v) => /female|woman/i.test(v.name)) ||
//           voices.find((v) => /^en(-|_)/i.test(v.lang)) ||
//           null;
//         if (chosen) utterance.voice = chosen;
//       };

//       if (synth.getVoices().length > 0) {
//         pickVoice();
//       } else {
//         synth.onvoiceschanged = () => pickVoice();
//       }

//       const safetyTimer = window.setTimeout(
//         () => settle(),
//         Math.min(text.length * 85 + 3500, 20000)
//       );

//       const finish = () => {
//         window.clearTimeout(safetyTimer);
//         settle();
//       };

//       utterance.onstart = () => {
//         if (hardAbortRef.current) {
//           synth.cancel();
//           finish();
//           return;
//         }
//         if (mountedRef.current) setIsSpeaking(true);
//       };
//       utterance.onend   = finish;
//       utterance.onerror = finish;

//       try {
//         synth.speak(utterance);
//       } catch {
//         finish();
//       }
//     });
//   }, []);

//   useEffect(() => {
//     chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
//   }, [messages, transcriptPreview, isLoading]);

//   useEffect(() => {
//     if (
//       screen !== "briefing" ||
//       mayaIntroPlayed ||
//       !nameLoaded ||
//       candidateName === "Candidate"
//     )
//       return;

//     const intro = `Hi ${candidateName}! I'm Maya, your AI interviewer from Cuemath. This is a short, voice-first screening interview. Please enable both your microphone and camera before starting — both are required for this interview. I'll guide you through each step.`;

//     const t = setTimeout(() => {
//       hardAbortRef.current = false;
//       void speak(intro);
//       setMayaIntroPlayed(true);
//     }, 800);

//     return () => clearTimeout(t);
//   }, [screen, mayaIntroPlayed, nameLoaded, candidateName, speak]);

//   const requestMicPermission = useCallback(async () => {
//     setMicStateSynced("requesting");
//     try {
//       const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
//       stream.getTracks().forEach((track) => track.stop());
//       setMicStateSynced("granted");
//       setInputModeSynced("voice");
//     } catch {
//       setMicStateSynced("denied");
//       setInputModeSynced("typing");
//       setMicVerified(false);
//     }
//   }, [setMicStateSynced, setInputModeSynced]);

//   const requestCameraPermission = useCallback(async () => {
//     if (cameraStreamRef.current) {
//       cameraStreamRef.current.getTracks().forEach((track) => track.stop());
//       cameraStreamRef.current = null;
//     }
//     setCameraState("requesting");
//     try {
//       const stream = await navigator.mediaDevices.getUserMedia({
//         video: { facingMode: "user", width: { ideal: 640 }, height: { ideal: 360 } },
//         audio: false,
//       });
//       cameraStreamRef.current = stream;
//       const videoTrack = stream.getVideoTracks()[0];
//       if (videoTrack) console.log("camera_track_settings:", videoTrack.getSettings());
//       setCameraState("granted");
//       setCameraVerified(true);
//       const targetVideo =
//         screenRef.current === "briefing" ? briefingVideoRef.current : interviewVideoRef.current;
//       if (targetVideo) {
//         targetVideo.srcObject = stream;
//         try { await targetVideo.play(); } catch (e) { console.error("camera_preview_initial_play_failed:", e); }
//       }
//     } catch (error) {
//       console.error("camera_permission_failed:", error);
//       setCameraState("denied");
//       setCameraVerified(false);
//     }
//   }, []);

//   // BUG-P1 + BUG-P9: deviceCheckRunningRef/state always cleaned up.
//   const verifyMicrophoneWithMaya = useCallback(async () => {
//     if (hardAbortRef.current || deviceCheckRunningRef.current) return;
//     if (typeof window === "undefined" || micStateRef.current !== "granted") return;

//     const SpeechAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
//     if (!SpeechAPI) {
//       await speak("Your browser does not support microphone verification in voice mode. You can still continue.");
//       return;
//     }

//     deviceCheckRunningRef.current = true;
//     setDeviceCheckRunning(true);
//     setDeviceCheckTranscript("");
//     setMicVerified(false);

//     await speak("Let's quickly test your microphone. Please say: Maya, can you hear me clearly?");

//     if (hardAbortRef.current) {
//       deviceCheckRunningRef.current = false;
//       if (mountedRef.current) setDeviceCheckRunning(false);
//       return;
//     }

//     const rec = new SpeechAPI();
//     rec.continuous = false;
//     rec.interimResults = true;
//     rec.lang = "en-IN";

//     let transcript = "";
//     let settled = false;

//     const settle = async (ok: boolean, heardText: string) => {
//       if (settled) return;
//       settled = true;
//       try { rec.stop?.(); } catch {}
//       deviceCheckRunningRef.current = false;
//       if (!mountedRef.current) return;
//       setDeviceCheckRunning(false);
//       setDeviceCheckTranscript(heardText);
//       if (hardAbortRef.current) return;
//       if (ok) {
//         setMicVerified(true);
//         await speak("Yes, I can hear you properly. Your microphone looks good to go.");
//       } else {
//         setMicVerified(false);
//         await speak("I'm not hearing you clearly yet. Please check your microphone and try the test again.");
//       }
//     };

//     const timeout = setTimeout(
//       () => void settle(transcript.trim().length >= 6, transcript.trim()),
//       6000
//     );

//     rec.onresult = (e: BSREvent) => {
//       let finalText = "";
//       let interim = "";
//       for (let i = e.resultIndex; i < e.results.length; i++) {
//         if (e.results[i].isFinal) finalText += e.results[i][0].transcript + " ";
//         else interim += e.results[i][0].transcript;
//       }
//       transcript = (finalText || interim).trim();
//       if (mountedRef.current) setDeviceCheckTranscript(transcript);
//     };

//     rec.onerror = () => {
//       clearTimeout(timeout);
//       void settle(false, transcript.trim());
//     };

//     rec.onend = () => {
//       clearTimeout(timeout);
//       void settle(transcript.trim().length >= 6, transcript.trim());
//     };

//     try {
//       rec.start();
//     } catch {
//       clearTimeout(timeout);
//       deviceCheckRunningRef.current = false;
//       if (mountedRef.current) setDeviceCheckRunning(false);
//       await speak("I couldn't start the microphone test. Please try again.");
//     }
//   }, [speak]);

//   const doSend = useCallback((text: string) => {
//     if (hardAbortRef.current || sendInProgressRef.current) return;
//     if (isLoadingRef.current || interviewDoneRef.current) return;
//     sendInProgressRef.current = true;
//     void sendMessageRef.current(text).finally(() => {
//       sendInProgressRef.current = false;
//     });
//   }, []);

//   const startListening = useCallback(() => {
//     if (hardAbortRef.current) return;
//     if (typeof window === "undefined" || micStateRef.current !== "granted") return;

//     if (isListeningRef.current) {
//       recognitionRef.current?.stop();
//       isListeningRef.current = false;
//       setIsListening(false);
//     }

//     const SpeechAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
//     if (!SpeechAPI) return;

//     finalTranscriptRef.current   = "";
//     interimTranscriptRef.current = "";
//     setTranscriptPreview("");
//     clearListeningTimers();
//     sendInProgressRef.current = false;
//     utteranceSentRef.current  = false;

//     const qAtStart = questionCountRef.current;
//     if (silenceAttemptRef.current[qAtStart] === undefined) {
//       silenceAttemptRef.current[qAtStart] = 0;
//     }

//     const rec = new SpeechAPI();
//     rec.continuous     = true;
//     rec.interimResults = true;
//     rec.lang           = "en-IN";

//     emptyResponseTimerRef.current = setTimeout(() => {
//       if (hardAbortRef.current) return;
//       if (isListeningRef.current) {
//         rec.stop();
//         isListeningRef.current = false;
//         setIsListening(false);
//         setTranscriptPreview("");
//       }
//       if (
//         !utteranceSentRef.current &&
//         !sendInProgressRef.current &&
//         !isLoadingRef.current &&
//         !interviewDoneRef.current
//       ) {
//         const liveQ = questionCountRef.current;
//         const attempts = silenceAttemptRef.current[liveQ] ?? 0;
//         silenceAttemptRef.current[liveQ] = attempts + 1;
//         utteranceSentRef.current = true;
//         doSend(EMPTY_RESPONSE_TOKEN);
//       }
//     }, EMPTY_RESPONSE_MS);

//     rec.onresult = (e: BSREvent) => {
//       if (hardAbortRef.current) return;
//       let newFinal = "";
//       let interim  = "";
//       for (let i = e.resultIndex; i < e.results.length; i++) {
//         if (e.results[i].isFinal) newFinal += e.results[i][0].transcript + " ";
//         else interim += e.results[i][0].transcript;
//       }
//       if (newFinal.trim()) {
//         finalTranscriptRef.current = (finalTranscriptRef.current + " " + newFinal).trim();
//       }
//       interimTranscriptRef.current = interim.trim();
//       const raw     = (finalTranscriptRef.current + " " + interim).trim();
//       const display = correctASRText(raw);
//       if (display) {
//         setTranscriptPreview(display);
//         if (emptyResponseTimerRef.current) {
//           clearTimeout(emptyResponseTimerRef.current);
//           emptyResponseTimerRef.current = null;
//         }
//       }
//       const liveQ = questionCountRef.current;
//       silenceAttemptRef.current[liveQ] = 0;
//       if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
//       const toSubmit = (finalTranscriptRef.current + " " + interim).trim();
//       if (toSubmit) {
//         silenceTimerRef.current = setTimeout(() => {
//           if (hardAbortRef.current || !isListeningRef.current) return;
//           rec.stop();
//           isListeningRef.current = false;
//           setIsListening(false);
//           const corrected = correctASRText(toSubmit);
//           if (
//             !utteranceSentRef.current &&
//             !sendInProgressRef.current &&
//             !isLoadingRef.current &&
//             !interviewDoneRef.current
//           ) {
//             utteranceSentRef.current = true;
//             doSend(corrected);
//           }
//         }, SILENCE_MS);
//       }
//     };

//     rec.onerror = (e: BSRError) => {
//       isListeningRef.current = false;
//       setIsListening(false);
//       clearListeningTimers();
//       recognitionRef.current = null;
//       if (e?.error === "aborted") return;
//       if (e?.error === "not-allowed") {
//         setMicStateSynced("denied");
//         setInputModeSynced("typing");
//         return;
//       }
//       if (hardAbortRef.current || isLoadingRef.current || interviewDoneRef.current) return;
//       const combined = (finalTranscriptRef.current + " " + interimTranscriptRef.current).trim();
//       const partial  = correctASRText(combined);
//       if (partial && !utteranceSentRef.current && !sendInProgressRef.current) {
//         utteranceSentRef.current = true;
//         doSend(partial);
//       } else if (!utteranceSentRef.current && !sendInProgressRef.current) {
//         setTimeout(() => {
//           if (
//             hardAbortRef.current ||
//             isLoadingRef.current ||
//             interviewDoneRef.current ||
//             sendInProgressRef.current ||
//             utteranceSentRef.current
//           )
//             return;
//           utteranceSentRef.current = true;
//           doSend(EMPTY_RESPONSE_TOKEN);
//         }, 1500);
//       }
//     };

//     rec.onend = () => {
//       isListeningRef.current = false;
//       setIsListening(false);
//       clearListeningTimers();
//       recognitionRef.current = null;
//       if (hardAbortRef.current || isLoadingRef.current || interviewDoneRef.current) return;
//       const combined = (finalTranscriptRef.current + " " + interimTranscriptRef.current).trim();
//       const partial  = correctASRText(combined);
//       if (partial && !utteranceSentRef.current && !sendInProgressRef.current) {
//         utteranceSentRef.current = true;
//         doSend(partial);
//       }
//     };

//     recognitionRef.current = rec;
//     rec.start();
//     isListeningRef.current = true;
//     setIsListening(true);
//   }, [clearListeningTimers, doSend, setInputModeSynced, setMicStateSynced]);

//   const stopListening = useCallback(() => {
//     clearListeningTimers();
//     if (recognitionRef.current && isListeningRef.current) {
//       recognitionRef.current.stop();
//     }
//     isListeningRef.current = false;
//     setIsListening(false);
//     if (hardAbortRef.current || isLoadingRef.current || sendInProgressRef.current) return;
//     const combined = (finalTranscriptRef.current + " " + interimTranscriptRef.current).trim();
//     const captured = correctASRText(combined);
//     setTimeout(() => {
//       if (
//         hardAbortRef.current ||
//         sendInProgressRef.current ||
//         isLoadingRef.current ||
//         interviewDoneRef.current ||
//         utteranceSentRef.current
//       )
//         return;
//       utteranceSentRef.current = true;
//       doSend(captured || EMPTY_RESPONSE_TOKEN);
//     }, 300);
//   }, [clearListeningTimers, doSend]);

//   const maybeStartListening = useCallback(() => {
//     if (hardAbortRef.current) return;
//     if (
//       supportsSpeechRef.current &&
//       micStateRef.current === "granted" &&
//       inputModeRef.current === "voice"
//     ) {
//       setTimeout(() => startListening(), 700);
//     }
//   }, [startListening]);

//   const generateReport = useCallback(
//     async (finalMessages: Message[]) => {
//       if (hardAbortRef.current) return;
//       const transcript = finalMessages
//         .map((m) => `${m.role === "user" ? "Candidate" : "Maya"}: ${m.content}`)
//         .join("\n\n");
//       try {
//         localStorage.setItem("interview_transcript", transcript);
//         localStorage.setItem("interview_messages", JSON.stringify(finalMessages));
//         localStorage.setItem("assessment_saved_at", Date.now().toString());
//       } catch {}

//       const tryAssess = async () => {
//         if (hardAbortRef.current) return;
//         const res = await fetch("/api/assess", {
//           method: "POST",
//           headers: { "Content-Type": "application/json" },
//           body: JSON.stringify({ transcript, candidateName }),
//         });
//         const data = await parseJson(res);
//         try {
//           localStorage.setItem("assessment_result", JSON.stringify(data));
//         } catch {}
//         if (!hardAbortRef.current) router.push("/report");
//       };

//       try {
//         await tryAssess();
//       } catch {
//         if (hardAbortRef.current) return;
//         setReportError("Generating report... please wait.");
//         setTimeout(async () => {
//           try {
//             if (!hardAbortRef.current) await tryAssess();
//           } catch {
//             if (!hardAbortRef.current) setReportError("Report failed. Please refresh.");
//           }
//         }, 3000);
//       }
//     },
//     [candidateName, parseJson, router]
//   );

//   // ─── stopPresenceDetection ────────────────────────────────────────────────────

//   const stopPresenceDetection = useCallback(() => {
//     if (faceCheckIntervalRef.current) {
//       clearInterval(faceCheckIntervalRef.current);
//       faceCheckIntervalRef.current = null;
//     }
//     if (faceAbsenceTimerRef.current) {
//       clearTimeout(faceAbsenceTimerRef.current);
//       faceAbsenceTimerRef.current = null;
//     }
//     if (visibilityHandlerRef.current) {
//       document.removeEventListener("visibilitychange", visibilityHandlerRef.current);
//       visibilityHandlerRef.current = null;
//     }
//     faceAbsenceStartRef.current       = null;
//     consecutiveAbsentCountRef.current = 0;
//     unknownPresenceCountRef.current   = 0;
//     setFaceAbsenceCountdown(null);
//   }, []);

//   const sendMessage = useCallback(
//     async (text: string) => {
//       if (hardAbortRef.current) return;
//       const trimmed  = text.trim();
//       const isToken  = text === EMPTY_RESPONSE_TOKEN;
//       const normalizedInput = isToken ? "no response" : trimmed;
//       if ((!trimmed && !isToken) || isLoadingRef.current || interviewDoneRef.current) return;

//       clearListeningTimers();

//       const userMsg: Message = {
//         role:    "user",
//         content: isToken ? "(No verbal response given)" : trimmed,
//       };
//       const updated = [...messages, userMsg];
//       setMessages(updated);
//       setInputText("");
//       setTranscriptPreview("");
//       finalTranscriptRef.current   = "";
//       interimTranscriptRef.current = "";
//       setLoading(true);

//       const currentCount      = questionCountRef.current;
//       const currentRetryCount = retryCountRef.current[currentCount] ?? 0;

//       try {
//         if (hardAbortRef.current) { setLoading(false); return; }

//         const res = await fetch("/api/chat", {
//           method: "POST",
//           headers: { "Content-Type": "application/json" },
//           body: JSON.stringify({
//             messages:      updated,
//             candidateName,
//             questionCount: currentCount,
//             retryCount:    currentRetryCount,
//           }),
//         });

//         if (hardAbortRef.current) { setLoading(false); return; }

//         const data = await parseJson(res);

//         if (hardAbortRef.current) { setLoading(false); return; }

//         if (data?.code === "QUOTA_EXCEEDED" || data?.source === "fallback") {
//           throw new Error("quota_fallback");
//         }

//         if (!res.ok || !data?.text) {
//           throw new Error((data?.error as string) || "unavailable");
//         }

//         const aiMsg: Message = { role: "assistant", content: data.text as string };
//         const final           = [...updated, aiMsg];
//         const nextCount       = data.isFollowUp ? currentCount : currentCount + 1;

//         if (data.isFollowUp) {
//           retryCountRef.current = {
//             ...retryCountRef.current,
//             [currentCount]: currentRetryCount + 1,
//           };
//         } else {
//           retryCountRef.current = {
//             ...retryCountRef.current,
//             [currentCount]: 0,
//             [nextCount]: 0,
//           };
//           silenceAttemptRef.current[nextCount] = 0;
//         }

//         setMessages(final);
//         setQCount(nextCount);

//         if (hardAbortRef.current) { setLoading(false); return; }

//         await speak(data.text as string);

//         if (hardAbortRef.current) { setLoading(false); return; }

//         if (data.isComplete || nextCount >= 7) {
//           setDone(true);
//           setTimeout(() => void generateReport(final), 1200);
//         } else {
//           maybeStartListening();
//         }
//       } catch (err) {
//         if (hardAbortRef.current) { setLoading(false); return; }

//         const msg = err instanceof Error ? err.message : String(err);
//         if (!msg.includes("quota") && msg !== "quota_fallback") {
//           console.error("sendMessage:", err);
//         }

//         const { reply: fb, shouldAdvance } = buildFallbackReply(
//           currentCount,
//           candidateName,
//           normalizedInput,
//           currentRetryCount
//         );
//         const nextCount = shouldAdvance ? currentCount + 1 : currentCount;

//         if (shouldAdvance) {
//           retryCountRef.current = {
//             ...retryCountRef.current,
//             [currentCount]: 0,
//             [nextCount]: 0,
//           };
//           silenceAttemptRef.current[nextCount] = 0;
//         } else {
//           retryCountRef.current = {
//             ...retryCountRef.current,
//             [currentCount]: currentRetryCount + 1,
//           };
//         }

//         const aiMsg: Message = { role: "assistant", content: fb };
//         const final = [...updated, aiMsg];
//         setMessages(final);
//         setQCount(nextCount);
//         setUsingFallback(true);

//         if (hardAbortRef.current) { setLoading(false); return; }

//         await speak(fb);

//         if (hardAbortRef.current) { setLoading(false); return; }

//         if (nextCount >= 7) {
//           setDone(true);
//           setTimeout(() => void generateReport(final), 1200);
//         } else {
//           maybeStartListening();
//         }
//       } finally {
//         setLoading(false);
//       }
//     },
//     [
//       candidateName,
//       clearListeningTimers,
//       generateReport,
//       maybeStartListening,
//       messages,
//       parseJson,
//       setDone,
//       setLoading,
//       setQCount,
//       speak,
//     ]
//   );

//   useEffect(() => {
//     sendMessageRef.current = sendMessage;
//   }, [sendMessage]);


//   const checkPresence = useCallback(async (): Promise<PresenceState> => {
//     const video = interviewVideoRef.current;
//     if (!video) return "unknown";
//     if (video.readyState < 2 || video.videoWidth === 0 || video.videoHeight === 0) return "unknown";
//     if (presenceCheckBusyRef.current) return "unknown";
//     presenceCheckBusyRef.current = true;

//     try {
//       const vw = video.videoWidth;
//       const vh = video.videoHeight;

//       if (nativeFaceDetectorRef.current) {
//         try {
//           const faces = await nativeFaceDetectorRef.current.detect(video);
//           // Native API gives authoritative result: 0 faces = "absent"
//           if (faces.length === 0) {
//             return "absent";
//           }
//           const validFace = faces.some((face) => {
//             const box = face.boundingBox;
//             const cx  = box.x + box.width  / 2;
//             const cy  = box.y + box.height / 2;
//             const insideCentralRegion =
//               cx > vw * 0.12 && cx < vw * 0.88 &&
//               cy > vh * 0.08 && cy < vh * 0.92;
//             const bigEnough =
//               box.width  >= vw * MIN_FACE_WIDTH_RATIO &&
//               box.height >= vh * MIN_FACE_HEIGHT_RATIO;
//             return insideCentralRegion && bigEnough;
//           });
//           return validFace ? "present" : "absent";
//         } catch (err) {
//           console.error("face_detector_detect_failed:", err);
//           // Native API threw — fall through to skin-pixel fallback
//         }
//       }


//       const canvas = faceCanvasRef.current;
//       if (!canvas) return "unknown";
//       const ctx = canvas.getContext("2d", { willReadFrequently: true });
//       if (!ctx) return "unknown";

//       canvas.width  = FALLBACK_SAMPLE_W;
//       canvas.height = FALLBACK_SAMPLE_H;
//       ctx.drawImage(video, 0, 0, FALLBACK_SAMPLE_W, FALLBACK_SAMPLE_H);

//       const imageData = ctx.getImageData(0, 0, FALLBACK_SAMPLE_W, FALLBACK_SAMPLE_H);
//       const data = imageData.data;
//       const gray = new Uint8ClampedArray(FALLBACK_SAMPLE_W * FALLBACK_SAMPLE_H);

//       let fullSkin   = 0;
//       let centerSkin = 0;
//       let centerPixels = 0;


//       const cx1 = Math.floor(FALLBACK_SAMPLE_W * 0.25);
//       const cx2 = Math.floor(FALLBACK_SAMPLE_W * 0.75);
//       const cy1 = Math.floor(FALLBACK_SAMPLE_H * 0.12);
//       const cy2 = Math.floor(FALLBACK_SAMPLE_H * 0.78);

//       for (let y = 0; y < FALLBACK_SAMPLE_H; y++) {
//         for (let x = 0; x < FALLBACK_SAMPLE_W; x++) {
//           const i  = y * FALLBACK_SAMPLE_W + x;
//           const di = i * 4;
//           const r  = data[di];
//           const g  = data[di + 1];
//           const b  = data[di + 2];
//           gray[i]  = Math.round(0.299 * r + 0.587 * g + 0.114 * b);
//           const skin = isSkinPixel(r, g, b);
//           if (skin) fullSkin++;
//           const inCenter = x >= cx1 && x <= cx2 && y >= cy1 && y <= cy2;
//           if (inCenter) {
//             centerPixels++;
//             if (skin) centerSkin++;
//           }
//         }
//       }

//       const fullSkinRatio   = fullSkin / (FALLBACK_SAMPLE_W * FALLBACK_SAMPLE_H);
//       const centerSkinRatio = centerPixels > 0 ? centerSkin / centerPixels : 0;
//       const edgeRatio       = sobelLikeEdgeScore(gray, FALLBACK_SAMPLE_W, FALLBACK_SAMPLE_H);


//       if (edgeRatio > TEXTURE_COMPLEXITY_MAX) {
//         console.log(`presence_fallback: high texture (edgeRatio=${edgeRatio.toFixed(3)}) → absent`);
//         return "absent";
//       }

//       const looksHumanish =
//         centerSkinRatio >= CENTER_SKIN_RATIO_MIN &&  // 6% center skin required
//         fullSkinRatio   >= FULL_SKIN_RATIO_MIN    &&  // 3% full-frame skin required
//         edgeRatio       >= EDGE_RATIO_MIN         &&  // faces have some edges
//         edgeRatio       <= EDGE_RATIO_MAX;            // but not too many

//       console.log(
//         `presence_fallback: center=${(centerSkinRatio*100).toFixed(1)}% full=${(fullSkinRatio*100).toFixed(1)}% edge=${edgeRatio.toFixed(3)} → ${looksHumanish ? "present" : "absent"}`
//       );

//       return looksHumanish ? "present" : "absent";
//     } catch (err) {
//       console.error("presence_check_failed:", err);
//       return "unknown";
//     } finally {
//       presenceCheckBusyRef.current = false;
//     }
//   }, []);

//   const stopEverythingNow = useCallback(() => {
//     hardAbortRef.current = true;
//     stopPresenceDetection();
//     clearListeningTimers();
//     try { recognitionRef.current?.stop(); } catch {}
//     recognitionRef.current    = null;
//     isListeningRef.current    = false;
//     sendInProgressRef.current = false;
//     if (typeof window !== "undefined" && window.speechSynthesis) {
//       window.speechSynthesis.cancel();
//     }
//     stopCameraPreview();
//     setIsListening(false);
//     setIsSpeaking(false);
//     setIsLoading(false);
//   }, [clearListeningTimers, stopCameraPreview, stopPresenceDetection]);

//   const terminateInterview = useCallback(
//     (reason: string) => {
//       if (faceTerminatedRef.current) return;
//       faceTerminatedRef.current = true;
//       stopEverythingNow();
//       setTerminated(true);
//       setTerminationReason(reason);
//     },
//     [stopEverythingNow]
//   );


//   const startPresenceDetection = useCallback(() => {
//     if (faceCheckIntervalRef.current) return;
//     faceAbsenceStartRef.current       = null;
//     faceTerminatedRef.current         = false;
//     consecutiveAbsentCountRef.current = 0;
//     unknownPresenceCountRef.current   = 0;

//     let warmupCount = 0;

//     const handleVisibilityChange = () => {
//       if (document.hidden) {
//         faceAbsenceStartRef.current       = null;
//         consecutiveAbsentCountRef.current = 0;
//         unknownPresenceCountRef.current   = 0;
//         if (mountedRef.current) setFaceAbsenceCountdown(null);
//       }
//     };
//     visibilityHandlerRef.current = handleVisibilityChange;
//     document.addEventListener("visibilitychange", handleVisibilityChange);

//     faceCheckIntervalRef.current = setInterval(() => {
//       if (faceTerminatedRef.current || interviewDoneRef.current || hardAbortRef.current) {
//         if (faceCheckIntervalRef.current) {
//           clearInterval(faceCheckIntervalRef.current);
//           faceCheckIntervalRef.current = null;
//         }
//         if (visibilityHandlerRef.current) {
//           document.removeEventListener("visibilitychange", visibilityHandlerRef.current);
//           visibilityHandlerRef.current = null;
//         }
//         return;
//       }

//       if (document.hidden) return;

//       if (warmupCount < PRESENCE_WARMUP_FRAMES) {
//         warmupCount++;
//         return;
//       }

//       void (async () => {
//         const state = await checkPresence();

//         if (state === "present") {
//           // Face detected — reset everything
//           faceAbsenceStartRef.current       = null;
//           consecutiveAbsentCountRef.current = 0;
//           unknownPresenceCountRef.current   = 0;
//           if (mountedRef.current) setFaceAbsenceCountdown(null);
//           return;
//         }

//         if (state === "unknown") {
//           unknownPresenceCountRef.current += 1;
//           if (unknownPresenceCountRef.current < UNKNOWN_STREAK_BEFORE_SOFT_ABSENT) {
//             // If we have an ongoing absence timer, continue counting down
//             if (faceAbsenceStartRef.current !== null && mountedRef.current) {
//               const absenceMs = Date.now() - faceAbsenceStartRef.current;
//               const remainingSecs = Math.max(0, Math.ceil((FACE_ABSENCE_TERMINATE_MS - absenceMs) / 1000));
//               setFaceAbsenceCountdown(remainingSecs);
//               if (absenceMs >= FACE_ABSENCE_TERMINATE_MS) {
//                 terminateInterview(
//                   "You were not visible in the camera frame for more than 9 seconds. The interview has been terminated as per our proctoring policy."
//                 );
//                 if (mountedRef.current) setFaceAbsenceCountdown(null);
//               }
//             }
//             return;
//           }
//           // Unknown streak long enough — treat as absent
//           consecutiveAbsentCountRef.current += 1;
//         } else {
//           // state === "absent" — definitive
//           unknownPresenceCountRef.current = 0;
//           consecutiveAbsentCountRef.current += 1;
//         }


//         if (consecutiveAbsentCountRef.current < CONSECUTIVE_ABSENT_THRESHOLD) {
//           // Not enough consecutive absent frames yet — wait for more
//           return;
//         }


//         if (faceAbsenceStartRef.current === null) {
//           faceAbsenceStartRef.current = Date.now();
//           console.warn(`presence_detection: absence threshold crossed → starting ${FACE_ABSENCE_TERMINATE_MS/1000}s termination timer`);
//         }

//         const absenceMs = Date.now() - faceAbsenceStartRef.current;
//         const remainingSecs = Math.max(
//           0,
//           Math.ceil((FACE_ABSENCE_TERMINATE_MS - absenceMs) / 1000)
//         );

//         if (mountedRef.current) setFaceAbsenceCountdown(remainingSecs);

//         if (absenceMs >= FACE_ABSENCE_TERMINATE_MS) {
//           terminateInterview(
//             "You were not visible in the camera frame for more than 9 seconds. The interview has been terminated as per our proctoring policy."
//           );
//           if (mountedRef.current) setFaceAbsenceCountdown(null);
//         }
//       })();
//     }, FACE_CHECK_INTERVAL_MS);
//   }, [checkPresence, terminateInterview]);

//   // Cleanup on unmount
//   useEffect(() => {
//     return () => {
//       hardAbortRef.current = true;
//       stopPresenceDetection();
//       clearListeningTimers();
//       try { recognitionRef.current?.stop(); } catch {}
//       recognitionRef.current = null;
//       if (typeof window !== "undefined" && window.speechSynthesis) {
//         window.speechSynthesis.cancel();
//       }
//       stopCameraPreview();
//     };
//   }, [clearListeningTimers, stopCameraPreview, stopPresenceDetection]);

//   const canBeginInterview = micState === "granted" && cameraState === "granted";

//   const beginInterview = useCallback(async () => {
//     if (!canBeginInterview) {
//       setShowMandatoryWarning(true);
//       await speak("Please enable both your microphone and camera before starting the interview. Both are required.");
//       return;
//     }
//     if (isBeginning) return;

//     setIsBeginning(true);
//     setShowMandatoryWarning(false);
//     window.speechSynthesis?.cancel();
//     clearListeningTimers();

//     hardAbortRef.current      = false;
//     faceTerminatedRef.current = false;
//     setTerminated(false);
//     setTerminationReason("");
//     setFaceAbsenceCountdown(null);
//     consecutiveAbsentCountRef.current = 0;
//     unknownPresenceCountRef.current   = 0;

//     retryCountRef.current     = Object.create(null) as Record<number, number>;
//     silenceAttemptRef.current = Object.create(null) as Record<number, number>;
//     sendInProgressRef.current = false;
//     utteranceSentRef.current  = false;
//     setUsingFallback(false);
//     setMessages([]);
//     setTranscriptPreview("");
//     setInputText("");
//     setQuestionCount(1);
//     questionCountRef.current = 1;
//     setDone(false);

//     if (supportsSpeechRef.current && micStateRef.current === "idle") {
//       setMicStateSynced("requesting");
//       try {
//         const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
//         stream.getTracks().forEach((t) => t.stop());
//         setMicStateSynced("granted");
//         setInputModeSynced("voice");
//       } catch {
//         setMicStateSynced("denied");
//         setInputModeSynced("typing");
//       }
//     }

//     setScreen("interview");

//     setTimeout(() => {
//       if (!hardAbortRef.current) {
//         startPresenceDetection();
//         void attachCameraStreamToVisibleVideo(true);
//       }
//     }, 250);

//     setLoading(true);

//     try {
//       const initial: Message[] = [
//         { role: "user", content: `Hi, my name is ${candidateName}.` },
//       ];
//       setMessages(initial);

//       const res = await fetch("/api/chat", {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({
//           messages:       initial,
//           candidateName,
//           questionCount:  1,
//           retryCount:     0,
//           beginInterview: true,
//         }),
//       });

//       const data = await parseJson(res);
//       const text = (data?.text as string) || QUESTION_BANK[0];

//       const aiMsg: Message = { role: "assistant", content: text };
//       const final = [...initial, aiMsg];
//       setMessages(final);
//       setQCount(2);

//       if (hardAbortRef.current) return;
//       await speak(text);

//       if (!hardAbortRef.current) maybeStartListening();
//     } catch (err) {
//       console.error("beginInterview:", err);
//       if (hardAbortRef.current) return;

//       const fallback = QUESTION_BANK[0];
//       const initial: Message[] = [
//         { role: "user", content: `Hi, my name is ${candidateName}.` },
//       ];
//       const aiMsg: Message = { role: "assistant", content: fallback };
//       const final = [...initial, aiMsg];
//       setMessages(final);
//       setQCount(2);
//       await speak(fallback);
//       if (!hardAbortRef.current) maybeStartListening();
//     } finally {
//       setLoading(false);
//       setIsBeginning(false);
//     }
//   }, [
//     attachCameraStreamToVisibleVideo,
//     canBeginInterview,
//     candidateName,
//     clearListeningTimers,
//     isBeginning,
//     maybeStartListening,
//     parseJson,
//     setDone,
//     setInputModeSynced,
//     setLoading,
//     setMicStateSynced,
//     setQCount,
//     speak,
//     startPresenceDetection,
//   ]);

//   const handleReturnHome = useCallback(() => {
//     stopEverythingNow();
//     router.push("/");
//   }, [router, stopEverythingNow]);

//   const handleManualSend = useCallback(() => {
//     const text = inputText.trim();
//     if (
//       !text ||
//       isLoadingRef.current ||
//       sendInProgressRef.current ||
//       interviewDoneRef.current ||
//       hardAbortRef.current
//     )
//       return;
//     doSend(text);
//     setInputText("");
//   }, [doSend, inputText]);

//   // ── Render ─────────────────────────────────────────────────────────────────

//   return (
//     <>
//       {/* Single canvas at component root for face detection */}
//       <canvas ref={faceCanvasRef} className="hidden" aria-hidden="true" />

//       {/* ── Terminated screen ─────────────────────────────────────────────── */}
//       {terminated ? (
//         <div className={`min-h-screen ${C.page} flex items-center justify-center px-6 py-10`}>
//           <div className={`w-full max-w-[680px] rounded-[32px] p-8 md:p-10 ${C.card}`}>
//             <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-rose-500/15 text-rose-400">
//               <UserX size={40} />
//             </div>
//             <h1 className="mt-6 text-center text-2xl font-bold md:text-3xl">
//               Interview terminated
//             </h1>
//             <p className={`mt-4 text-center text-sm leading-7 ${C.textSoft}`}>
//               {terminationReason}
//             </p>
//             <div className={`mt-8 rounded-[22px] border px-5 py-4 text-sm ${theme === "dark" ? "border-amber-400/20 bg-amber-400/10 text-amber-300" : "border-amber-200 bg-amber-50 text-amber-700"}`}>
//               <AlertTriangle size={16} className="mr-2 inline-block" />
//               Please ensure you remain visible in the camera throughout the interview.
//             </div>
//             <button
//               onClick={handleReturnHome}
//               className="mt-8 w-full rounded-[22px] bg-gradient-to-r from-violet-600 to-fuchsia-500 px-8 py-4 text-base font-semibold text-white shadow-[0_14px_34px_rgba(124,58,237,0.25)] transition hover:from-violet-500 hover:to-fuchsia-400"
//             >
//               Return to Home
//             </button>
//           </div>
//         </div>
//       ) : screen === "briefing" ? (
//         /* ── Briefing screen ──────────────────────────────────────────────── */
//         <div className={`min-h-screen flex flex-col transition-colors duration-300 ${C.page}`}>
//           <header className={`border-b ${C.header}`}>
//             <div className="mx-auto flex w-full max-w-[1320px] items-center justify-between px-6 py-4">
//               <div className="flex items-center gap-3">
//                 <div className={`flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-fuchsia-400 text-sm font-semibold text-white shadow-[0_10px_30px_rgba(168,85,247,0.35)] ${isSpeaking ? "animate-pulse" : ""}`}>
//                   M
//                 </div>
//                 <div>
//                   <p className={`text-sm font-semibold ${theme === "dark" ? "text-white" : "text-gray-900"}`}>
//                     Maya · AI Interviewer
//                   </p>
//                   <p className="text-xs text-violet-400">Cuemath Tutor Screener</p>
//                 </div>
//               </div>
//               <div className="flex items-center gap-4">
//                 <div className="text-right">
//                   <p className={`text-sm ${theme === "dark" ? "text-white" : "text-gray-900"}`}>{candidateName}</p>
//                   {candidateEmail ? <p className={`text-xs ${C.textSoft}`}>{candidateEmail}</p> : null}
//                 </div>
//                 <button onClick={toggleTheme} className={`flex h-10 w-10 items-center justify-center rounded-2xl border ${C.toggleBg}`} aria-label="Toggle theme">
//                   {theme === "dark" ? <Sun size={18} className={C.toggleIcon} /> : <Moon size={18} className={C.toggleIcon} />}
//                 </button>
//               </div>
//             </div>
//           </header>

//           <main className="mx-auto flex w-full max-w-[1320px] flex-1 flex-col gap-6 px-6 py-8 lg:flex-row">
//             {/* Left panel — setup */}
//             <section className={`flex w-full flex-col rounded-[32px] p-6 md:p-8 lg:w-[420px] ${C.card}`}>
//               <div className="mb-6">
//                 <p className="text-xs font-semibold uppercase tracking-[0.24em] text-violet-400">Before you begin</p>
//                 <h1 className="mt-3 text-3xl font-bold leading-tight">Welcome, {candidateName}</h1>
//                 <p className={`mt-3 text-sm leading-7 ${C.textSoft}`}>
//                   Please complete the quick setup below. Both microphone and camera are mandatory for this interview.
//                 </p>
//               </div>

//               <div className={`overflow-hidden rounded-[28px] border ${C.panel}`}>
//                 <div className="relative aspect-video w-full overflow-hidden">
//                   {cameraState === "granted" ? (
//                     <video ref={briefingVideoRef} autoPlay muted playsInline className="h-full w-full object-cover" />
//                   ) : (
//                     <div className="flex h-full w-full items-center justify-center">
//                       <div className="text-center">
//                         <Camera className="mx-auto mb-3 h-10 w-10 text-violet-400" />
//                         <p className={`text-sm ${C.textSoft}`}>Camera preview will appear here</p>
//                       </div>
//                     </div>
//                   )}
//                 </div>
//               </div>

//               <div className="mt-6 grid gap-3">
//                 <button onClick={requestMicPermission} className={`rounded-[18px] border px-4 py-3 text-sm font-semibold ${C.actionSecondary}`}>
//                   {micState === "granted" ? "Microphone enabled" : "Enable microphone"}
//                 </button>
//                 <button onClick={requestCameraPermission} className={`rounded-[18px] border px-4 py-3 text-sm font-semibold ${C.actionSecondary}`}>
//                   {cameraState === "granted" ? "Camera enabled" : "Enable camera"}
//                 </button>
//                 <button
//                   onClick={verifyMicrophoneWithMaya}
//                   disabled={micState !== "granted" || deviceCheckRunning}
//                   className={`rounded-[18px] border px-4 py-3 text-sm font-semibold ${micState !== "granted" || deviceCheckRunning ? "cursor-not-allowed opacity-60" : C.actionSecondary}`}
//                 >
//                   {deviceCheckRunning ? "Testing microphone..." : "Test microphone with Maya"}
//                 </button>
//               </div>

//               <div className="mt-5 flex flex-wrap gap-2">
//                 <StatusPill C={C} ok={micState === "granted"}    icon={<Mic size={14} />}    label={micState === "granted" ? "Mic on" : "Mic off"} />
//                 <StatusPill C={C} ok={cameraState === "granted"} icon={<Camera size={14} />} label={cameraState === "granted" ? "Camera on" : "Camera off"} />
//                 <StatusPill C={C} ok={supportsSpeech}            icon={<Volume2 size={14} />} label={supportsSpeech ? "Voice supported" : "Typing fallback"} />
//               </div>

//               {deviceCheckTranscript ? (
//                 <div className={`mt-4 rounded-[20px] border px-4 py-3 text-xs ${C.panel}`}>
//                   Heard: {deviceCheckTranscript}
//                 </div>
//               ) : null}

//               {showMandatoryWarning ? (
//                 <div className={`mt-4 rounded-[20px] border px-4 py-3 text-xs ${theme === "dark" ? "border-rose-400/30 bg-rose-400/10 text-rose-300" : "border-rose-200 bg-rose-50 text-rose-700"}`}>
//                   Please enable both microphone and camera before starting.
//                 </div>
//               ) : null}

//               <button
//                 onClick={beginInterview}
//                 disabled={!canBeginInterview || isBeginning}
//                 className={`mt-6 inline-flex items-center justify-center gap-2 rounded-[22px] px-5 py-4 text-sm font-semibold text-white ${!canBeginInterview || isBeginning ? "cursor-not-allowed bg-violet-300" : "bg-gradient-to-r from-violet-600 to-fuchsia-500 hover:from-violet-500 hover:to-fuchsia-400"}`}
//               >
//                 {isBeginning ? (
//                   <><Loader2 size={16} className="animate-spin" />Starting interview</>
//                 ) : (
//                   <>Begin interview<ChevronRight size={16} /></>
//                 )}
//               </button>
//             </section>

//             {/* Right panel — briefing steps */}
//             <section className={`flex min-w-0 flex-1 flex-col rounded-[32px] p-6 md:p-8 ${C.card}`}>
//               <div className="mb-6 flex items-center justify-between gap-4">
//                 <div>
//                   <p className="text-xs font-semibold uppercase tracking-[0.24em] text-violet-400">Interview briefing</p>
//                   <h2 className="mt-2 text-2xl font-bold">Quick overview before we start</h2>
//                 </div>
//                 <div className={`rounded-full border px-4 py-2 text-xs font-medium ${C.chip}`}>
//                   Step {briefingStep + 1} / {BRIEFING_STEPS.length}
//                 </div>
//               </div>

//               <div className="grid gap-4">
//                 {BRIEFING_STEPS.map((step, idx) => {
//                   const Icon   = step.icon;
//                   const active = idx === briefingStep;
//                   return (
//                     <button
//                       key={step.title}
//                       onClick={() => setBriefingStep(idx)}
//                       className={`flex items-start gap-4 rounded-[24px] border px-5 py-5 text-left transition ${active ? C.stepActive : C.panel} ${!active ? C.stepInactive : ""}`}
//                     >
//                       <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${active ? C.stepIconActive : C.stepIconInactive}`}>
//                         <Icon size={20} className="text-violet-400" />
//                       </div>
//                       <div>
//                         <p className="font-semibold">{step.title}</p>
//                         <p className={`mt-1 text-sm leading-7 ${C.textSoft}`}>{step.desc}</p>
//                       </div>
//                     </button>
//                   );
//                 })}
//               </div>

//               <div className={`mt-6 rounded-[24px] border px-5 py-4 text-sm ${C.panel}`}>
//                 <p className="font-semibold">Interview rules</p>
//                 <ul className={`mt-3 space-y-2 text-sm leading-7 ${C.textSoft}`}>
//                   <li>• Stay visible in camera throughout the interview.</li>
//                   <li>• If absent for more than 9 seconds, interview ends automatically.</li>
//                   <li>• Speak naturally and answer in your own words.</li>
//                 </ul>
//               </div>
//             </section>
//           </main>
//         </div>
//       ) : (

//         <div className={`h-screen flex flex-col overflow-hidden transition-colors duration-300 ${C.page}`}>
//           <header className={`shrink-0 border-b ${C.header}`} style={{ height: "73px" }}>
//             <div className="mx-auto flex w-full max-w-[1440px] items-center justify-between px-4 py-4 md:px-6">
//               <div className="flex items-center gap-3">
//                 <div className={`flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-fuchsia-400 text-sm font-semibold text-white shadow-[0_10px_30px_rgba(168,85,247,0.35)] ${isSpeaking ? "animate-pulse" : ""}`}>
//                   M
//                 </div>
//                 <div>
//                   <p className={`text-sm font-semibold ${theme === "dark" ? "text-white" : "text-gray-900"}`}>Maya · AI Interviewer</p>
//                   <p className="text-xs text-violet-400">Cuemath Tutor Screener</p>
//                 </div>
//               </div>
//               <div className="flex items-center gap-4">
//                 <div className="text-right">
//                   <p className={`text-sm ${theme === "dark" ? "text-white" : "text-gray-900"}`}>{candidateName}</p>
//                   {candidateEmail ? <p className={`text-xs ${C.textSoft}`}>{candidateEmail}</p> : null}
//                 </div>
//                 <button onClick={toggleTheme} className={`flex h-10 w-10 items-center justify-center rounded-2xl border ${C.toggleBg}`} aria-label="Toggle theme">
//                   {theme === "dark" ? <Sun size={18} className={C.toggleIcon} /> : <Moon size={18} className={C.toggleIcon} />}
//                 </button>
//               </div>
//             </div>
//           </header>


//           <div className="flex flex-1 overflow-hidden">
//             <div className="mx-auto flex w-full max-w-[1440px] gap-6 px-4 py-6 md:px-6 overflow-hidden">

//               <aside className="hidden w-[360px] shrink-0 lg:block self-start sticky top-0">
//                 <div
//                   className={`rounded-[30px] p-5 overflow-y-auto ${C.card}`}
//                   style={{ height: "calc(100vh - 73px - 3rem)" }}
//                 >
//                   <div className="overflow-hidden rounded-[24px] border border-violet-100/10">
//                     <div className="aspect-video w-full bg-black/10">
//                       {cameraState === "granted" ? (
//                         <video ref={interviewVideoRef} autoPlay muted playsInline className="h-full w-full object-cover" />
//                       ) : (
//                         <div className="flex h-full w-full items-center justify-center">
//                           <Camera className="h-10 w-10 text-violet-400" />
//                         </div>
//                       )}
//                     </div>
//                   </div>

//                   <div className="mt-5 flex items-center justify-between">
//                     <p className="font-semibold">Interview progress</p>
//                     <span className={`text-sm ${C.textSoft}`}>{displayCount}/{TOTAL_Q}</span>
//                   </div>

//                   <div className={`mt-3 h-2 overflow-hidden rounded-full ${C.progressBg}`}>
//                     <div
//                       className="h-full rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-500 transition-all duration-500"
//                       style={{ width: `${progress}%` }}
//                     />
//                   </div>

//                   <div className="mt-5 flex flex-wrap gap-2">
//                     <StatusPill C={C} ok={micState === "granted"}    icon={<Mic size={14} />}    label={micState === "granted" ? "Mic on" : "Mic off"} />
//                     <StatusPill C={C} ok={cameraState === "granted"} icon={<Camera size={14} />} label={cameraState === "granted" ? "Camera on" : "Camera off"} />
//                     <StatusPill C={C} ok={inputMode === "voice"}     icon={<Volume2 size={14} />} label={inputMode === "voice" ? "Voice mode" : "Typing mode"} />
//                   </div>

//                   <div className={`mt-5 rounded-[22px] border px-4 py-4 text-sm ${C.panel}`}>
//                     <p className="font-semibold">Interview rules</p>
//                     <ul className={`mt-2 space-y-2 text-xs leading-6 ${C.textSoft}`}>
//                       <li>• Stay visible in camera throughout the interview.</li>
//                       <li>• If absent for more than 9 seconds, interview ends automatically.</li>
//                       <li>• Speak naturally and answer in your own words.</li>
//                     </ul>
//                   </div>

//                   {faceAbsenceCountdown !== null ? (
//                     <div className={`mt-4 rounded-[20px] border px-4 py-3 text-xs ${theme === "dark" ? "border-amber-400/30 bg-amber-400/10 text-amber-300" : "border-amber-200 bg-amber-50 text-amber-700"}`}>
//                       Stay visible in frame. Interview will terminate in {faceAbsenceCountdown}s if no face is detected.
//                     </div>
//                   ) : null}

//                   {usingFallback ? (
//                     <div className={`mt-4 rounded-[20px] border px-4 py-3 text-xs ${C.panel}`}>
//                       Fallback mode is active for this turn due to model/API unavailability.
//                     </div>
//                   ) : null}

//                   {reportError ? (
//                     <div className="mt-4 rounded-[20px] border border-amber-400/30 bg-amber-400/10 px-4 py-3 text-xs text-amber-300">
//                       {reportError}
//                     </div>
//                   ) : null}
//                 </div>
//               </aside>

//               <section className={`flex min-w-0 flex-1 flex-col rounded-[30px] overflow-hidden ${C.card}`}>
//                 {/* Chat header — pinned, never scrolls */}
//                 <div className={`shrink-0 border-b px-5 py-4 md:px-6 ${C.footer}`}>
//                   <div className="flex flex-wrap items-center justify-between gap-4">
//                     <div>
//                       <p className="text-lg font-semibold">Live interview</p>
//                       <p className={`text-sm ${C.textSoft}`}>Answer naturally. Maya will move through the screening step by step.</p>
//                     </div>
//                     <div className="flex items-center gap-2">
//                       {supportsSpeech && micState === "granted" ? (
//                         <button
//                           onClick={() => setInputModeSynced(inputMode === "voice" ? "typing" : "voice")}
//                           className={`rounded-[16px] border px-4 py-2 text-sm font-medium ${C.actionSecondary}`}
//                         >
//                           Switch to {inputMode === "voice" ? "typing" : "voice"}
//                         </button>
//                       ) : null}
//                       {inputMode === "voice" && micState === "granted" ? (
//                         <button
//                           onClick={isListening ? stopListening : startListening}
//                           className={`inline-flex items-center gap-2 rounded-[16px] px-4 py-2 text-sm font-semibold text-white ${isListening ? "bg-rose-500 hover:bg-rose-400" : "bg-gradient-to-r from-violet-600 to-fuchsia-500 hover:from-violet-500 hover:to-fuchsia-400"}`}
//                         >
//                           {isListening ? <MicOff size={16} /> : <Mic size={16} />}
//                           {isListening ? "Stop listening" : "Start listening"}
//                         </button>
//                       ) : null}
//                     </div>
//                   </div>
//                 </div>

//                 <div className="flex-1 overflow-y-auto px-4 py-5 md:px-6">
//                   <div className="mx-auto w-full max-w-[980px] space-y-5">
//                     {messages.map((message, idx) => {
//                       const isUser = message.role === "user";
//                       return (
//                         <div key={`${message.role}-${idx}`} className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
//                           <div className={`max-w-[82%] rounded-[24px] px-5 py-4 ${isUser ? C.bubbleUser : C.bubbleAssistant}`}>
//                             <p className="mb-1 text-sm font-semibold opacity-80">{isUser ? "You" : "Maya"}</p>
//                             <p className="text-[15px] leading-8">{message.content}</p>
//                           </div>
//                         </div>
//                       );
//                     })}

//                     {transcriptPreview ? (
//                       <div className="flex justify-end">
//                         <div className={`max-w-[82%] rounded-[24px] px-5 py-4 ${C.bubbleUser}`}>
//                           <p className="mb-1 text-sm font-semibold opacity-80">You</p>
//                           <p className="text-[15px] leading-8">{transcriptPreview}</p>
//                         </div>
//                       </div>
//                     ) : null}

//                     {isLoading ? (
//                       <div className="flex justify-start">
//                         <div className={`rounded-[24px] px-5 py-4 ${C.bubbleAssistant}`}>
//                           <div className="flex items-center gap-3">
//                             <Loader2 size={18} className="animate-spin" />
//                             <span className="text-sm">Maya is thinking...</span>
//                           </div>
//                         </div>
//                       </div>
//                     ) : null}

//                     <div ref={chatEndRef} />
//                   </div>
//                 </div>


//                 {canUseTyping ? (
//                   <div className={`shrink-0 border-t px-4 py-4 md:px-6 ${C.footer}`}>
//                     <div className="mx-auto flex w-full max-w-[980px] items-end gap-3">
//                       <textarea
//                         value={inputText}
//                         onChange={(e) => setInputText(e.target.value)}
//                         rows={1}
//                         placeholder="Type your answer here..."
//                         className={`min-h-[52px] flex-1 resize-none rounded-[18px] border px-4 py-3 text-sm outline-none ${C.input}`}
//                         onKeyDown={(e) => {
//                           if (e.key === "Enter" && !e.shiftKey) {
//                             e.preventDefault();
//                             handleManualSend();
//                           }
//                         }}
//                       />
//                       <button
//                         onClick={handleManualSend}
//                         disabled={!inputText.trim() || isLoading}
//                         className={`inline-flex h-[52px] items-center justify-center rounded-[18px] px-5 text-sm font-semibold text-white ${!inputText.trim() || isLoading ? "cursor-not-allowed bg-violet-300" : "bg-gradient-to-r from-violet-600 to-fuchsia-500 hover:from-violet-500 hover:to-fuchsia-400"}`}
//                       >
//                         <Send size={16} />
//                       </button>
//                     </div>
//                   </div>
//                 ) : (
//                   <div className={`shrink-0 border-t px-4 py-4 md:px-6 ${C.footer}`}>
//                     <div className="mx-auto flex w-full max-w-[980px] items-center justify-between gap-4">
//                       <p className={`text-sm ${C.textSoft}`}>
//                         Voice mode is active. Click <span className="font-semibold">Start listening</span> if Maya is waiting for your response.
//                       </p>
//                       <div className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-medium ${isSpeaking ? C.chip : isListening ? C.emeraldChip : C.panel}`}>
//                         <span className={`h-2 w-2 rounded-full ${isSpeaking ? "bg-violet-400" : isListening ? "bg-emerald-400" : "bg-gray-400"}`} />
//                         {isSpeaking ? "Maya speaking" : isListening ? "Listening" : "Waiting"}
//                       </div>
//                     </div>
//                   </div>
//                 )}
//               </section>
//             </div>
//           </div>
//         </div>
//       )}

//       {/* Suppress unused-var lint for interviewDone */}
//       {_interviewDone && false ? null : null}
//     </>
//   );
// }










// "use client";

// import { useCallback, useEffect, useRef, useState } from "react";
// import { useRouter } from "next/navigation";
// import {
//   Loader2,
//   Mic,
//   MicOff,
//   Send,
//   Volume2,
//   CheckCircle,
//   Clock,
//   MessageSquare,
//   BarChart2,
//   Camera,
//   Sun,
//   Moon,
//   ChevronRight,
//   AlertTriangle,
//   UserX,
//   Wifi,
//   WifiOff,
// } from "lucide-react";

// // ─── Constants ────────────────────────────────────────────────────────────────

// const SILENCE_MS = 7000;
// const EMPTY_RESPONSE_MS = 10000;
// const TOTAL_Q = 6;
// const EMPTY_RESPONSE_TOKEN = "__EMPTY_RESPONSE__";

// // BUGFIX: Increased thresholds to prevent false-positive terminations
// const FACE_ABSENCE_TERMINATE_MS = 9000;
// const FACE_CHECK_INTERVAL_MS = 600;          // was 500 — slightly slower to reduce CPU
// const PRESENCE_WARMUP_FRAMES = 12;           // was 6 — ~7s warmup before any detection kicks in
// const CONSECUTIVE_ABSENT_THRESHOLD = 4;      // was 2 — need 4 consecutive absent frames (~2.4s)
// const UNKNOWN_STREAK_BEFORE_SOFT_ABSENT = 10; // was 6 — more tolerant of unknown frames
// const PRESENCE_RECOVERY_FRAMES = 2;          // NEW: require N consecutive "present" frames to reset timer

// const FALLBACK_SAMPLE_W = 224;
// const FALLBACK_SAMPLE_H = 168;

// // BUGFIX: Relaxed skin/edge thresholds to reduce false absences
// const MIN_FACE_WIDTH_RATIO = 0.04;
// const MIN_FACE_HEIGHT_RATIO = 0.04;
// const CENTER_SKIN_RATIO_MIN = 0.04;   // was 0.06
// const FULL_SKIN_RATIO_MIN   = 0.02;   // was 0.03
// const EDGE_RATIO_MIN        = 0.03;   // was 0.04
// const EDGE_RATIO_MAX        = 0.18;   // was 0.16 — more tolerant of textured backgrounds
// const TEXTURE_COMPLEXITY_MAX = 0.16;  // was 0.13

// const THEME_STORAGE_KEY = "maya_theme";

// // ─── ASR corrections ──────────────────────────────────────────────────────────

// const ASR_CORRECTIONS: [RegExp, string][] = [
//   [/\bgen only\b/gi, "genuinely"],
//   [/\bgenu only\b/gi, "genuinely"],
//   [/\bgenuinely only\b/gi, "genuinely"],
//   [/\binteract to like\b/gi, "interactive, like a"],
//   [/\binteract to\b/gi, "interactive"],
//   [/\backnowledg(?:e|ing) (?:the )?feeling/gi, "acknowledge their feeling"],
//   [/\bfeel judge\b/gi, "feel judged"],
//   [/\bfeel judges\b/gi, "feel judged"],
//   [/\bor present\b/gi, "or pressured"],
//   [/\bleading question[s]?\b/gi, "leading questions"],
//   [/\bmanageable step[s]?\b/gi, "manageable steps"],
//   [/\bmanage a step[s]?\b/gi, "manageable steps"],
//   [/\bmomentom\b/gi, "momentum"],
//   [/\bmomentem\b/gi, "momentum"],
//   [/\bcelebrate small\b/gi, "celebrate small"],
//   [/\bcelebreat\b/gi, "celebrate"],
//   [/\bdistract\b(?!ed|ing)/gi, "distracted"],
//   [/\bit'?s in about\b/gi, "it's not about"],
//   [/\bin about explaining\b/gi, "not about explaining"],
//   [/\bthat is in about\b/gi, "that is not about"],
//   [/\b(\w{3,})\s+\1\b/gi, "$1"],
//   [/\s+na\b\.?/gi, ""],
//   [/\s+yaar\b\.?/gi, ""],
//   [/\s+hai\b\.?/gi, ""],
//   [/\s+na\?\s*/g, ". "],
//   [/\s+only na\b/gi, " only"],
//   [/\bcue math\b/gi, "Cuemath"],
//   [/\bcue maths\b/gi, "Cuemath"],
//   [/\bque math\b/gi, "Cuemath"],
//   [/\bque maths\b/gi, "Cuemath"],
//   [/\bq math\b/gi, "Cuemath"],
//   [/\bkew math\b/gi, "Cuemath"],
//   [/\bqueue math\b/gi, "Cuemath"],
//   [/\bcue mat\b/gi, "Cuemath"],
//   [/\bcu math\b/gi, "Cuemath"],
//   [/\bkyoomath\b/gi, "Cuemath"],
//   [/\bmath's\b/gi, "maths"],
//   [/\bi would of\b/gi, "I would have"],
//   [/\bcould of\b/gi, "could have"],
//   [/\bshould of\b/gi, "should have"],
//   [/\bwould of\b/gi, "would have"],
//   [/\btheir going\b/gi, "they're going"],
//   [/\btheir doing\b/gi, "they're doing"],
//   [/\byour welcome\b/gi, "you're welcome"],
//   [/\bits a\b/gi, "it's a"],
//   [/\bi am having\b/gi, "I have"],
//   [/\bI done\b/g, "I did"],
//   [/\bI am knowing\b/gi, "I know"],
//   [/\bI am understanding\b/gi, "I understand"],
//   [/\bI am thinking\b/gi, "I think"],
//   [/\s{2,}/g, " "],
// ];

// function correctASRText(text: string): string {
//   let result = text;
//   for (const [pattern, replacement] of ASR_CORRECTIONS) {
//     result = result.replace(pattern, replacement);
//   }
//   return result.trim();
// }

// // ─── Types ────────────────────────────────────────────────────────────────────

// interface Message {
//   role: "user" | "assistant";
//   content: string;
// }

// interface DetectedFace {
//   boundingBox: DOMRectReadOnly;
// }

// interface BrowserFaceDetector {
//   detect: (image: CanvasImageSource) => Promise<DetectedFace[]>;
// }

// declare global {
//   interface Window {
//     SpeechRecognition?: new () => BSR;
//     webkitSpeechRecognition?: new () => BSR;
//     FaceDetector?: new (options?: {
//       fastMode?: boolean;
//       maxDetectedFaces?: number;
//     }) => BrowserFaceDetector;
//   }
// }

// interface BSR {
//   continuous: boolean;
//   interimResults: boolean;
//   lang: string;
//   start: () => void;
//   stop: () => void;
//   onresult: ((e: BSREvent) => void) | null;
//   onend: (() => void) | null;
//   onerror: ((e: BSRError) => void) | null;
//   onaudiostart: (() => void) | null;
// }

// interface BSREvent {
//   resultIndex: number;
//   results: {
//     length: number;
//     [i: number]: { isFinal: boolean; 0: { transcript: string } };
//   };
// }

// interface BSRError {
//   error?: string;
// }

// type PresenceState = "present" | "absent" | "unknown";

// const QUESTION_BANK = [
//   "To kick things off, could you tell me a little about yourself and what drew you to tutoring?",
//   "Imagine you're explaining fractions to a 9-year-old who's been staring blankly — how would you approach that?",
//   "Picture a student who's been stuck on the same problem for 5 minutes and says they want to give up. What do you do in that moment?",
//   "How do you keep a child engaged and motivated when you can tell they're bored or distracted?",
//   "What does patience genuinely mean to you as a tutor — not just in theory, but day to day?",
//   "[name], thank you so much for your time today. We'll be in touch soon with next steps. Best of luck — I'm rooting for you!",
// ];

// const QUESTION_OPENERS = [
//   "",
//   "Great, let's move to the next one.",
//   "Good, here's the next scenario.",
//   "Thanks for that. Next question:",
//   "Appreciated. One more:",
//   "",
// ];

// function buildFallbackReply(
//   questionCount: number,
//   name: string,
//   userText: string,
//   retryCount: number
// ): { reply: string; shouldAdvance: boolean } {
//   const t = userText.toLowerCase();
//   const questionIndex = Math.max(0, Math.min(questionCount - 1, QUESTION_BANK.length - 2));
//   const nextIdx = Math.min(questionIndex + 1, QUESTION_BANK.length - 1);

//   const wantsToSkip =
//     t.includes("next question") ||
//     t.includes("move on") ||
//     t.includes("skip") ||
//     t.includes("next one") ||
//     (t.includes("next") && t.length <= 10);

//   if (wantsToSkip) {
//     if (nextIdx >= QUESTION_BANK.length - 1) {
//       return { reply: QUESTION_BANK[QUESTION_BANK.length - 1].replace("[name]", name), shouldAdvance: true };
//     }
//     const opener = QUESTION_OPENERS[nextIdx] || "Of course, let's move on.";
//     return { reply: `${opener} ${QUESTION_BANK[nextIdx]}`, shouldAdvance: true };
//   }

//   const currentQuestion = QUESTION_BANK[questionIndex];
//   const isCasualOrGreeting =
//     t.includes("good morning") || t.includes("good afternoon") || t.includes("good evening") ||
//     t.includes("nice to meet") || t.includes("how are you") || t.includes("hello") ||
//     (t.includes("hi") && userText.split(" ").length <= 5);

//   if (retryCount === 0) {
//     const isNonAnswer =
//       t === "no" || t === "nothing" || t === "idk" || t.includes("don't know") ||
//       t.includes("not sure") || t.includes("no idea") || t === "(no verbal response given)";

//     if (isCasualOrGreeting) {
//       return { reply: `I'm doing wonderfully, thank you! ${currentQuestion}`, shouldAdvance: false };
//     }
//     if (isNonAnswer) {
//       return { reply: `No worries at all — take all the time you need! ${currentQuestion}`, shouldAdvance: false };
//     }
//     return { reply: `I'd love to hear a little bit more from you on this. ${currentQuestion}`, shouldAdvance: false };
//   }

//   if (nextIdx >= QUESTION_BANK.length - 1) {
//     return { reply: QUESTION_BANK[QUESTION_BANK.length - 1].replace("[name]", name), shouldAdvance: true };
//   }

//   return { reply: `Absolutely no pressure — let's move forward. ${QUESTION_BANK[nextIdx]}`, shouldAdvance: true };
// }

// // ─── Skin detection helpers ───────────────────────────────────────────────────

// function rgbToYCrCb(r: number, g: number, b: number) {
//   const y  = 0.299 * r + 0.587 * g + 0.114 * b;
//   const cb = 128 - 0.168736 * r - 0.331264 * g + 0.5 * b;
//   const cr = 128 + 0.5 * r - 0.418688 * g - 0.081312 * b;
//   return { y, cb, cr };
// }

// function isSkinPixel(r: number, g: number, b: number): boolean {
//   const { y, cb, cr } = rgbToYCrCb(r, g, b);
//   const rgbRule =
//     r > 55 && g > 25 && b > 10 &&
//     Math.max(r, g, b) - Math.min(r, g, b) > 15 &&
//     Math.abs(r - g) > 10 &&
//     r >= g && r >= b;
//   const ycbcrRule =
//     y > 40 && cb >= 78 && cb <= 133 && cr >= 133 && cr <= 178;
//   return rgbRule && ycbcrRule;
// }

// function sobelLikeEdgeScore(gray: Uint8ClampedArray, w: number, h: number): number {
//   let strongEdges = 0;
//   const total = (w - 2) * (h - 2);
//   for (let y = 1; y < h - 1; y++) {
//     for (let x = 1; x < w - 1; x++) {
//       const i = y * w + x;
//       const gx =
//         -gray[i - w - 1] - 2 * gray[i - 1] - gray[i + w - 1] +
//          gray[i - w + 1] + 2 * gray[i + 1] + gray[i + w + 1];
//       const gy =
//         -gray[i - w - 1] - 2 * gray[i - w] - gray[i - w + 1] +
//          gray[i + w - 1] + 2 * gray[i + w] + gray[i + w + 1];
//       if (Math.abs(gx) + Math.abs(gy) > 160) strongEdges++;
//     }
//   }
//   return total > 0 ? strongEdges / total : 0;
// }

// // ─── Theme tokens ─────────────────────────────────────────────────────────────

// const DARK = {
//   page: "bg-[#07101f] text-white",
//   header: "bg-[#081221]/95 border-white/8 backdrop-blur-xl",
//   card: "border border-white/8 bg-[#0d1a2e] shadow-[0_4px_32px_rgba(0,0,0,0.4)]",
//   panel: "border border-white/6 bg-[#0a1525]",
//   bubbleAssistant: "bg-[#111d33] border border-white/8 text-white",
//   bubbleUser: "bg-gradient-to-br from-violet-600 to-fuchsia-600 text-white",
//   textSoft: "text-white/60",
//   textMuted: "text-white/40",
//   input: "border-white/10 bg-[#091321] text-white placeholder:text-white/30",
//   actionSecondary: "bg-white/5 hover:bg-white/8 border-white/10 text-white/75 hover:text-white",
//   actionDanger: "bg-rose-500 hover:bg-rose-400 text-white",
//   progressBg: "bg-white/8",
//   footer: "border-white/8 bg-[#0a1525]",
//   chip: "border-violet-400/20 bg-violet-400/8 text-violet-300",
//   emeraldChip: "border-emerald-400/20 bg-emerald-400/8 text-emerald-300",
//   stepActive: "border-violet-400/25 bg-violet-400/5",
//   stepInactive: "opacity-50",
//   toggleBg: "bg-white/5 border-white/10",
//   toggleIcon: "text-violet-300",
//   stepIconActive: "bg-violet-500/15",
//   stepIconInactive: "bg-white/5",
//   warningBanner: "border-amber-400/25 bg-amber-400/8 text-amber-300",
//   dangerBanner: "border-rose-400/25 bg-rose-400/8 text-rose-300",
// };

// const LIGHT = {
//   page: "bg-slate-50 text-slate-900",
//   header: "bg-white/95 border-slate-200 backdrop-blur-xl",
//   card: "border border-slate-200 bg-white shadow-[0_4px_24px_rgba(0,0,0,0.06)]",
//   panel: "border border-slate-100 bg-slate-50",
//   bubbleAssistant: "bg-white border border-slate-200 text-slate-800",
//   bubbleUser: "bg-gradient-to-br from-violet-600 to-fuchsia-600 text-white",
//   textSoft: "text-slate-600",
//   textMuted: "text-slate-400",
//   input: "border-slate-200 bg-white text-slate-900 placeholder:text-slate-400",
//   actionSecondary: "bg-slate-100 hover:bg-slate-150 border-slate-200 text-slate-700 hover:text-slate-900",
//   actionDanger: "bg-rose-500 hover:bg-rose-400 text-white",
//   progressBg: "bg-slate-200",
//   footer: "border-slate-200 bg-white",
//   chip: "border-violet-200 bg-violet-50 text-violet-700",
//   emeraldChip: "border-emerald-200 bg-emerald-50 text-emerald-700",
//   stepActive: "border-violet-200 bg-violet-50",
//   stepInactive: "opacity-50",
//   toggleBg: "bg-slate-100 border-slate-200",
//   toggleIcon: "text-violet-600",
//   stepIconActive: "bg-violet-100",
//   stepIconInactive: "bg-slate-100",
//   warningBanner: "border-amber-200 bg-amber-50 text-amber-700",
//   dangerBanner: "border-rose-200 bg-rose-50 text-rose-700",
// };

// const BRIEFING_STEPS = [
//   {
//     icon: MessageSquare,
//     title: "Natural conversation",
//     desc: "I'll ask thoughtful tutor-screening questions. Speak naturally — the goal is to understand how you communicate with students.",
//   },
//   {
//     icon: Clock,
//     title: "About 8–10 minutes",
//     desc: "The interview is short and focused. There are no trick questions — I'm here to understand how you think and explain.",
//   },
//   {
//     icon: Mic,
//     title: "Voice-first interview",
//     desc: "This interview is designed for speaking, since tutoring happens through live conversation. Microphone is required.",
//   },
//   {
//     icon: BarChart2,
//     title: "Structured assessment",
//     desc: "After the conversation, you'll get a detailed report across clarity, warmth, patience, simplification, and English fluency.",
//   },
//   {
//     icon: CheckCircle,
//     title: "Be yourself",
//     desc: "There are no perfect answers. I'm looking for warmth, clarity, and genuine care for students — not rehearsed lines.",
//   },
// ];

// // ─── StatusDot ────────────────────────────────────────────────────────────────

// function StatusDot({ ok, label }: { ok: boolean; label: string }) {
//   return (
//     <div className="flex items-center gap-2">
//       <div className={`h-2 w-2 rounded-full ${ok ? "bg-emerald-400" : "bg-slate-400"}`} />
//       <span className="text-xs text-current opacity-70">{label}</span>
//     </div>
//   );
// }

// // ─── Component ────────────────────────────────────────────────────────────────

// export default function InterviewPage() {
//   const router = useRouter();

//   const chatEndRef            = useRef<HTMLDivElement | null>(null);
//   const recognitionRef        = useRef<BSR | null>(null);
//   const silenceTimerRef       = useRef<ReturnType<typeof setTimeout> | null>(null);
//   const emptyResponseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
//   const sendMessageRef        = useRef<(t: string) => Promise<void>>(() => Promise.resolve());
//   const finalTranscriptRef    = useRef<string>("");
//   const interimTranscriptRef  = useRef<string>("");
//   const isListeningRef        = useRef(false);
//   const questionCountRef      = useRef(1);
//   const isLoadingRef          = useRef(false);
//   const interviewDoneRef      = useRef(false);
//   const micStateRef           = useRef<"idle" | "requesting" | "granted" | "denied">("idle");
//   const inputModeRef          = useRef<"voice" | "typing">("voice");
//   const supportsSpeechRef     = useRef(false);

//   const silenceAttemptRef = useRef<Record<number, number>>({});
//   const retryCountRef     = useRef<Record<number, number>>({});

//   const briefingVideoRef  = useRef<HTMLVideoElement | null>(null);
//   const interviewVideoRef = useRef<HTMLVideoElement | null>(null);
//   const cameraStreamRef   = useRef<MediaStream | null>(null);
//   const sendInProgressRef = useRef(false);

//   const utteranceSentRef = useRef(false);

//   const faceCheckIntervalRef      = useRef<ReturnType<typeof setInterval> | null>(null);
//   const faceAbsenceTimerRef       = useRef<ReturnType<typeof setTimeout> | null>(null);
//   const faceCanvasRef             = useRef<HTMLCanvasElement | null>(null);
//   const faceAbsenceStartRef       = useRef<number | null>(null);
//   const faceTerminatedRef         = useRef(false);
//   const nativeFaceDetectorRef     = useRef<BrowserFaceDetector | null>(null);
//   const presenceCheckBusyRef      = useRef(false);
//   const consecutiveAbsentCountRef = useRef(0);
//   const consecutivePresentCountRef = useRef(0); // NEW: track consecutive present frames
//   const unknownPresenceCountRef   = useRef(0);

//   const visibilityHandlerRef = useRef<(() => void) | null>(null);

//   const hardAbortRef = useRef(false);
//   const mountedRef   = useRef(true);

//   const deviceCheckRunningRef = useRef(false);

//   const screenRef = useRef<"briefing" | "interview">("briefing");

//   const [theme, setTheme] = useState<"dark" | "light">("dark");
//   const C = theme === "dark" ? DARK : LIGHT;

//   const [screen, setScreen]             = useState<"briefing" | "interview">("briefing");
//   const [briefingStep, setBriefingStep] = useState(0);
//   const [mayaIntroPlayed, setMayaIntroPlayed] = useState(false);
//   const [nameLoaded, setNameLoaded]     = useState(false);
//   const [messages, setMessages]         = useState<Message[]>([]);
//   const [candidateName, setCandidateName] = useState("Candidate");
//   const [candidateEmail, setCandidateEmail] = useState("");
//   const [inputText, setInputText]       = useState("");
//   const [transcriptPreview, setTranscriptPreview] = useState("");
//   const [isListening, setIsListening]   = useState(false);
//   const [isSpeaking, setIsSpeaking]     = useState(false);
//   const [isLoading, setIsLoading]       = useState(false);
//   const [questionCount, setQuestionCount] = useState(1);
//   const [usingFallback, setUsingFallback] = useState(false);
//   const [reportError, setReportError]   = useState("");
//   const [micState, setMicState]         = useState<"idle" | "requesting" | "granted" | "denied">("idle");
//   const [supportsSpeech, setSupportsSpeech] = useState(false);
//   const [inputMode, setInputMode]       = useState<"voice" | "typing">("voice");
//   const [isBeginning, setIsBeginning]   = useState(false);
//   const [cameraState, setCameraState]   = useState<"idle" | "requesting" | "granted" | "denied">("idle");
//   const [micVerified, setMicVerified]   = useState(false);
//   const [deviceCheckRunning, setDeviceCheckRunning] = useState(false);
//   const [deviceCheckTranscript, setDeviceCheckTranscript] = useState("");
//   const [showMandatoryWarning, setShowMandatoryWarning] = useState(false);
//   const [faceAbsenceCountdown, setFaceAbsenceCountdown] = useState<number | null>(null);
//   const [terminated, setTerminated]     = useState(false);
//   const [terminationReason, setTerminationReason] = useState("");

//   const displayCount = Math.min(Math.max(questionCount - 1, 0), TOTAL_Q);
//   const progress     = Math.min((displayCount / TOTAL_Q) * 100, 100);

//   const isTypingFallback   = !supportsSpeech || micState === "denied";
//   const isManualTypingMode = supportsSpeech && micState === "granted" && inputMode === "typing";
//   const canUseTyping       = isTypingFallback || isManualTypingMode;

//   const setQCount = useCallback((n: number) => {
//     questionCountRef.current = n;
//     setQuestionCount(n);
//   }, []);

//   const setLoading = useCallback((v: boolean) => {
//     isLoadingRef.current = v;
//     setIsLoading(v);
//   }, []);

//   const setDone = useCallback((v: boolean) => {
//     interviewDoneRef.current = v;
//   }, []);

//   const setMicStateSynced = useCallback((v: "idle" | "requesting" | "granted" | "denied") => {
//     micStateRef.current = v;
//     setMicState(v);
//   }, []);

//   const setInputModeSynced = useCallback((v: "voice" | "typing") => {
//     inputModeRef.current = v;
//     setInputMode(v);
//   }, []);

//   useEffect(() => {
//     mountedRef.current = true;
//     return () => { mountedRef.current = false; deviceCheckRunningRef.current = false; };
//   }, []);

//   useEffect(() => {
//     screenRef.current = screen;
//   }, [screen]);

//   useEffect(() => {
//     const name  = localStorage.getItem("candidate_name") || "Candidate";
//     const email = localStorage.getItem("candidate_email") || "";
//     setCandidateName(name);
//     setCandidateEmail(email);
//     setNameLoaded(true);

//     const hasSpeech = typeof window !== "undefined" && (!!window.SpeechRecognition || !!window.webkitSpeechRecognition);
//     supportsSpeechRef.current = hasSpeech;
//     setSupportsSpeech(hasSpeech);
//     setInputModeSynced(hasSpeech ? "voice" : "typing");

//     const savedTheme = localStorage.getItem(THEME_STORAGE_KEY) as "dark" | "light" | null;
//     if (savedTheme) setTheme(savedTheme);
//     hardAbortRef.current = false;
//   }, [setInputModeSynced]);

//   useEffect(() => {
//     if (typeof window === "undefined") return;
//     if ("FaceDetector" in window && !nativeFaceDetectorRef.current) {
//       try {
//         nativeFaceDetectorRef.current = new (window.FaceDetector!)({ fastMode: true, maxDetectedFaces: 1 });
//       } catch (err) {
//         console.error("face_detector_init_failed:", err);
//         nativeFaceDetectorRef.current = null;
//       }
//     }
//   }, []);

//   const toggleTheme = useCallback(() => {
//     setTheme((t) => {
//       const next = t === "dark" ? "light" : "dark";
//       localStorage.setItem(THEME_STORAGE_KEY, next);
//       return next;
//     });
//   }, []);

//   const parseJson = useCallback(async (res: Response) => {
//     const raw = await res.text();
//     try { return JSON.parse(raw) as Record<string, unknown>; }
//     catch { throw new Error(`Bad response: ${raw.slice(0, 100)}`); }
//   }, []);

//   const clearListeningTimers = useCallback(() => {
//     if (silenceTimerRef.current) { clearTimeout(silenceTimerRef.current); silenceTimerRef.current = null; }
//     if (emptyResponseTimerRef.current) { clearTimeout(emptyResponseTimerRef.current); emptyResponseTimerRef.current = null; }
//   }, []);

//   const stopCameraPreview = useCallback(() => {
//     if (cameraStreamRef.current) {
//       cameraStreamRef.current.getTracks().forEach((track) => track.stop());
//       cameraStreamRef.current = null;
//     }
//     if (briefingVideoRef.current)  briefingVideoRef.current.srcObject = null;
//     if (interviewVideoRef.current) interviewVideoRef.current.srcObject = null;
//   }, []);

//   // BUGFIX: Improved camera attachment with debounce to prevent AbortError from rapid play() calls
//   const attachCameraStreamToVisibleVideo = useCallback(async (retryOnNull = true) => {
//     const stream = cameraStreamRef.current;
//     if (!stream) return;
//     const currentScreen = screenRef.current;
//     const targetVideo = currentScreen === "briefing" ? briefingVideoRef.current : interviewVideoRef.current;
//     if (!targetVideo) {
//       if (retryOnNull) setTimeout(() => void attachCameraStreamToVisibleVideo(false), 300);
//       return;
//     }
//     if (targetVideo.srcObject === stream) {
//       // Stream already attached — just ensure playing
//       if (targetVideo.paused) {
//         try { await targetVideo.play(); } catch { /* ignore */ }
//       }
//       return;
//     }
//     // Pause before switching srcObject to avoid AbortError
//     try { targetVideo.pause(); } catch { /* ignore */ }
//     targetVideo.srcObject = stream;
//     // Small delay before play to let browser settle
//     await new Promise(r => setTimeout(r, 50));
//     try { await targetVideo.play(); }
//     catch (error) {
//       // Only log non-abort errors — AbortError from rapid switching is expected
//       if ((error as Error)?.name !== "AbortError") {
//         console.error("camera_preview_play_failed:", error);
//       }
//     }
//   }, []);

//   useEffect(() => {
//     void attachCameraStreamToVisibleVideo();
//   }, [screen, cameraState, attachCameraStreamToVisibleVideo]);

//   const speak = useCallback((text: string): Promise<void> => {
//     return new Promise((resolve) => {
//       if (typeof window === "undefined" || !window.speechSynthesis) { resolve(); return; }
//       if (hardAbortRef.current) { resolve(); return; }

//       const synth = window.speechSynthesis;
//       synth.cancel();

//       const utterance = new SpeechSynthesisUtterance(text);
//       utterance.rate   = 0.8;
//       utterance.pitch  = 1.4;
//       utterance.volume = 1;
//       utterance.lang   = "en-US";

//       let settled = false;
//       const settle = () => {
//         if (settled) return;
//         settled = true;
//         if (mountedRef.current) setIsSpeaking(false);
//         resolve();
//       };

//       const pickVoice = () => {
//         const voices = synth.getVoices();
//         const chosen =
//           voices.find((v) => v.name === "Microsoft Jenny Online (Natural) - English (United States)") ||
//           voices.find((v) => v.name === "Microsoft Aria Online (Natural) - English (United States)") ||
//           voices.find((v) => v.name === "Microsoft Zira - English (United States)") ||
//           voices.find((v) => /jenny|aria|zira|samantha/i.test(v.name)) ||
//           voices.find((v) => /google uk english female/i.test(v.name)) ||
//           voices.find((v) => /female|woman/i.test(v.name)) ||
//           voices.find((v) => /^en(-|_)/i.test(v.lang)) ||
//           null;
//         if (chosen) utterance.voice = chosen;
//       };

//       if (synth.getVoices().length > 0) pickVoice();
//       else synth.onvoiceschanged = () => pickVoice();

//       const safetyTimer = window.setTimeout(() => settle(), Math.min(text.length * 85 + 3500, 20000));
//       const finish = () => { window.clearTimeout(safetyTimer); settle(); };

//       utterance.onstart = () => {
//         if (hardAbortRef.current) { synth.cancel(); finish(); return; }
//         if (mountedRef.current) setIsSpeaking(true);
//       };
//       utterance.onend   = finish;
//       utterance.onerror = finish;

//       try { synth.speak(utterance); } catch { finish(); }
//     });
//   }, []);

//   useEffect(() => {
//     chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
//   }, [messages, transcriptPreview, isLoading]);

//   useEffect(() => {
//     if (screen !== "briefing" || mayaIntroPlayed || !nameLoaded || candidateName === "Candidate") return;
//     const intro = `Hi ${candidateName}! I'm Maya, your AI interviewer from Cuemath. Please enable both your microphone and camera before starting — both are required for this interview.`;
//     const t = setTimeout(() => { hardAbortRef.current = false; void speak(intro); setMayaIntroPlayed(true); }, 800);
//     return () => clearTimeout(t);
//   }, [screen, mayaIntroPlayed, nameLoaded, candidateName, speak]);

//   const requestMicPermission = useCallback(async () => {
//     setMicStateSynced("requesting");
//     try {
//       const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
//       stream.getTracks().forEach((track) => track.stop());
//       setMicStateSynced("granted");
//       setInputModeSynced("voice");
//     } catch {
//       setMicStateSynced("denied");
//       setInputModeSynced("typing");
//       setMicVerified(false);
//     }
//   }, [setMicStateSynced, setInputModeSynced]);

//   const requestCameraPermission = useCallback(async () => {
//     if (cameraStreamRef.current) {
//       cameraStreamRef.current.getTracks().forEach((track) => track.stop());
//       cameraStreamRef.current = null;
//     }
//     setCameraState("requesting");
//     try {
//       const stream = await navigator.mediaDevices.getUserMedia({
//         video: { facingMode: "user", width: { ideal: 640 }, height: { ideal: 360 } },
//         audio: false,
//       });
//       cameraStreamRef.current = stream;
//       setCameraState("granted");
//       const targetVideo = screenRef.current === "briefing" ? briefingVideoRef.current : interviewVideoRef.current;
//       if (targetVideo) {
//         targetVideo.srcObject = stream;
//         await new Promise(r => setTimeout(r, 50));
//         try { await targetVideo.play(); } catch { /* ignore */ }
//       }
//     } catch (error) {
//       console.error("camera_permission_failed:", error);
//       setCameraState("denied");
//     }
//   }, []);

//   const verifyMicrophoneWithMaya = useCallback(async () => {
//     if (hardAbortRef.current || deviceCheckRunningRef.current) return;
//     if (typeof window === "undefined" || micStateRef.current !== "granted") return;

//     const SpeechAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
//     if (!SpeechAPI) {
//       await speak("Your browser does not support voice mode. You can continue using typing.");
//       return;
//     }

//     deviceCheckRunningRef.current = true;
//     setDeviceCheckRunning(true);
//     setDeviceCheckTranscript("");
//     setMicVerified(false);

//     await speak("Let's quickly test your microphone. Please say: Maya, can you hear me clearly?");

//     if (hardAbortRef.current) {
//       deviceCheckRunningRef.current = false;
//       if (mountedRef.current) setDeviceCheckRunning(false);
//       return;
//     }

//     const rec = new SpeechAPI();
//     rec.continuous = false;
//     rec.interimResults = true;
//     rec.lang = "en-IN";

//     let transcript = "";
//     let settled = false;

//     const settle = async (ok: boolean, heardText: string) => {
//       if (settled) return;
//       settled = true;
//       try { rec.stop?.(); } catch {}
//       deviceCheckRunningRef.current = false;
//       if (!mountedRef.current) return;
//       setDeviceCheckRunning(false);
//       setDeviceCheckTranscript(heardText);
//       if (hardAbortRef.current) return;
//       if (ok) {
//         setMicVerified(true);
//         await speak("Yes, I can hear you clearly. Your microphone is good to go.");
//       } else {
//         setMicVerified(false);
//         await speak("I'm not hearing you clearly. Please check your microphone and try again.");
//       }
//     };

//     const timeout = setTimeout(() => void settle(transcript.trim().length >= 6, transcript.trim()), 6000);

//     rec.onresult = (e: BSREvent) => {
//       let finalText = "";
//       let interim = "";
//       for (let i = e.resultIndex; i < e.results.length; i++) {
//         if (e.results[i].isFinal) finalText += e.results[i][0].transcript + " ";
//         else interim += e.results[i][0].transcript;
//       }
//       transcript = (finalText || interim).trim();
//       if (mountedRef.current) setDeviceCheckTranscript(transcript);
//     };

//     rec.onerror = () => { clearTimeout(timeout); void settle(false, transcript.trim()); };
//     rec.onend   = () => { clearTimeout(timeout); void settle(transcript.trim().length >= 6, transcript.trim()); };

//     try { rec.start(); }
//     catch {
//       clearTimeout(timeout);
//       deviceCheckRunningRef.current = false;
//       if (mountedRef.current) setDeviceCheckRunning(false);
//     }
//   }, [speak]);

//   const doSend = useCallback((text: string) => {
//     if (hardAbortRef.current || sendInProgressRef.current) return;
//     if (isLoadingRef.current || interviewDoneRef.current) return;
//     sendInProgressRef.current = true;
//     void sendMessageRef.current(text).finally(() => { sendInProgressRef.current = false; });
//   }, []);

//   const startListening = useCallback(() => {
//     if (hardAbortRef.current) return;
//     if (typeof window === "undefined" || micStateRef.current !== "granted") return;
//     if (isListeningRef.current) { recognitionRef.current?.stop(); isListeningRef.current = false; setIsListening(false); }

//     const SpeechAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
//     if (!SpeechAPI) return;

//     finalTranscriptRef.current   = "";
//     interimTranscriptRef.current = "";
//     setTranscriptPreview("");
//     clearListeningTimers();
//     sendInProgressRef.current = false;
//     utteranceSentRef.current  = false;

//     const qAtStart = questionCountRef.current;
//     if (silenceAttemptRef.current[qAtStart] === undefined) silenceAttemptRef.current[qAtStart] = 0;

//     const rec = new SpeechAPI();
//     rec.continuous     = true;
//     rec.interimResults = true;
//     rec.lang           = "en-IN";

//     emptyResponseTimerRef.current = setTimeout(() => {
//       if (hardAbortRef.current) return;
//       if (isListeningRef.current) { rec.stop(); isListeningRef.current = false; setIsListening(false); setTranscriptPreview(""); }
//       if (!utteranceSentRef.current && !sendInProgressRef.current && !isLoadingRef.current && !interviewDoneRef.current) {
//         const liveQ = questionCountRef.current;
//         silenceAttemptRef.current[liveQ] = (silenceAttemptRef.current[liveQ] ?? 0) + 1;
//         utteranceSentRef.current = true;
//         doSend(EMPTY_RESPONSE_TOKEN);
//       }
//     }, EMPTY_RESPONSE_MS);

//     rec.onresult = (e: BSREvent) => {
//       if (hardAbortRef.current) return;
//       let newFinal = "";
//       let interim  = "";
//       for (let i = e.resultIndex; i < e.results.length; i++) {
//         if (e.results[i].isFinal) newFinal += e.results[i][0].transcript + " ";
//         else interim += e.results[i][0].transcript;
//       }
//       if (newFinal.trim()) finalTranscriptRef.current = (finalTranscriptRef.current + " " + newFinal).trim();
//       interimTranscriptRef.current = interim.trim();
//       const raw     = (finalTranscriptRef.current + " " + interim).trim();
//       const display = correctASRText(raw);
//       if (display) {
//         setTranscriptPreview(display);
//         if (emptyResponseTimerRef.current) { clearTimeout(emptyResponseTimerRef.current); emptyResponseTimerRef.current = null; }
//       }
//       const liveQ = questionCountRef.current;
//       silenceAttemptRef.current[liveQ] = 0;
//       if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
//       const toSubmit = (finalTranscriptRef.current + " " + interim).trim();
//       if (toSubmit) {
//         silenceTimerRef.current = setTimeout(() => {
//           if (hardAbortRef.current || !isListeningRef.current) return;
//           rec.stop(); isListeningRef.current = false; setIsListening(false);
//           const corrected = correctASRText(toSubmit);
//           if (!utteranceSentRef.current && !sendInProgressRef.current && !isLoadingRef.current && !interviewDoneRef.current) {
//             utteranceSentRef.current = true;
//             doSend(corrected);
//           }
//         }, SILENCE_MS);
//       }
//     };

//     rec.onerror = (e: BSRError) => {
//       isListeningRef.current = false; setIsListening(false); clearListeningTimers(); recognitionRef.current = null;
//       if (e?.error === "aborted") return;
//       if (e?.error === "not-allowed") { setMicStateSynced("denied"); setInputModeSynced("typing"); return; }
//       if (hardAbortRef.current || isLoadingRef.current || interviewDoneRef.current) return;
//       const combined = (finalTranscriptRef.current + " " + interimTranscriptRef.current).trim();
//       const partial  = correctASRText(combined);
//       if (partial && !utteranceSentRef.current && !sendInProgressRef.current) {
//         utteranceSentRef.current = true; doSend(partial);
//       } else if (!utteranceSentRef.current && !sendInProgressRef.current) {
//         setTimeout(() => {
//           if (hardAbortRef.current || isLoadingRef.current || interviewDoneRef.current || sendInProgressRef.current || utteranceSentRef.current) return;
//           utteranceSentRef.current = true; doSend(EMPTY_RESPONSE_TOKEN);
//         }, 1500);
//       }
//     };

//     rec.onend = () => {
//       isListeningRef.current = false; setIsListening(false); clearListeningTimers(); recognitionRef.current = null;
//       if (hardAbortRef.current || isLoadingRef.current || interviewDoneRef.current) return;
//       const combined = (finalTranscriptRef.current + " " + interimTranscriptRef.current).trim();
//       const partial  = correctASRText(combined);
//       if (partial && !utteranceSentRef.current && !sendInProgressRef.current) {
//         utteranceSentRef.current = true; doSend(partial);
//       }
//     };

//     recognitionRef.current = rec;
//     rec.start();
//     isListeningRef.current = true;
//     setIsListening(true);
//   }, [clearListeningTimers, doSend, setInputModeSynced, setMicStateSynced]);

//   const stopListening = useCallback(() => {
//     clearListeningTimers();
//     if (recognitionRef.current && isListeningRef.current) recognitionRef.current.stop();
//     isListeningRef.current = false; setIsListening(false);
//     if (hardAbortRef.current || isLoadingRef.current || sendInProgressRef.current) return;
//     const combined = (finalTranscriptRef.current + " " + interimTranscriptRef.current).trim();
//     const captured = correctASRText(combined);
//     setTimeout(() => {
//       if (hardAbortRef.current || sendInProgressRef.current || isLoadingRef.current || interviewDoneRef.current || utteranceSentRef.current) return;
//       utteranceSentRef.current = true;
//       doSend(captured || EMPTY_RESPONSE_TOKEN);
//     }, 300);
//   }, [clearListeningTimers, doSend]);

//   const maybeStartListening = useCallback(() => {
//     if (hardAbortRef.current) return;
//     if (supportsSpeechRef.current && micStateRef.current === "granted" && inputModeRef.current === "voice") {
//       setTimeout(() => startListening(), 700);
//     }
//   }, [startListening]);

//   const generateReport = useCallback(async (finalMessages: Message[]) => {
//     if (hardAbortRef.current) return;
//     const transcript = finalMessages.map((m) => `${m.role === "user" ? "Candidate" : "Maya"}: ${m.content}`).join("\n\n");
//     try {
//       localStorage.setItem("interview_transcript", transcript);
//       localStorage.setItem("interview_messages", JSON.stringify(finalMessages));
//     } catch {}

//     const tryAssess = async () => {
//       if (hardAbortRef.current) return;
//       const res = await fetch("/api/assess", {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({ transcript, candidateName }),
//       });
//       const data = await parseJson(res);
//       try { localStorage.setItem("assessment_result", JSON.stringify(data)); } catch {}
//       if (!hardAbortRef.current) router.push("/report");
//     };

//     try {
//       await tryAssess();
//     } catch {
//       if (hardAbortRef.current) return;
//       setReportError("Generating report... please wait.");
//       setTimeout(async () => {
//         try { if (!hardAbortRef.current) await tryAssess(); }
//         catch { if (!hardAbortRef.current) setReportError("Report failed. Please refresh."); }
//       }, 3000);
//     }
//   }, [candidateName, parseJson, router]);

//   // ─── Presence detection ────────────────────────────────────────────────────

//   const stopPresenceDetection = useCallback(() => {
//     if (faceCheckIntervalRef.current) { clearInterval(faceCheckIntervalRef.current); faceCheckIntervalRef.current = null; }
//     if (faceAbsenceTimerRef.current) { clearTimeout(faceAbsenceTimerRef.current); faceAbsenceTimerRef.current = null; }
//     if (visibilityHandlerRef.current) {
//       document.removeEventListener("visibilitychange", visibilityHandlerRef.current);
//       visibilityHandlerRef.current = null;
//     }
//     faceAbsenceStartRef.current       = null;
//     consecutiveAbsentCountRef.current = 0;
//     consecutivePresentCountRef.current = 0;
//     unknownPresenceCountRef.current   = 0;
//     setFaceAbsenceCountdown(null);
//   }, []);

//   const checkPresence = useCallback(async (): Promise<PresenceState> => {
//     const video = interviewVideoRef.current;
//     if (!video) return "unknown";
//     if (video.readyState < 2 || video.videoWidth === 0 || video.videoHeight === 0) return "unknown";
//     if (presenceCheckBusyRef.current) return "unknown";
//     presenceCheckBusyRef.current = true;

//     try {
//       const vw = video.videoWidth;
//       const vh = video.videoHeight;

//       if (nativeFaceDetectorRef.current) {
//         try {
//           const faces = await nativeFaceDetectorRef.current.detect(video);
//           if (faces.length === 0) return "absent";
//           const validFace = faces.some((face) => {
//             const box = face.boundingBox;
//             const cx  = box.x + box.width  / 2;
//             const cy  = box.y + box.height / 2;
//             const insideCentralRegion = cx > vw * 0.10 && cx < vw * 0.90 && cy > vh * 0.06 && cy < vh * 0.94;
//             const bigEnough = box.width >= vw * MIN_FACE_WIDTH_RATIO && box.height >= vh * MIN_FACE_HEIGHT_RATIO;
//             return insideCentralRegion && bigEnough;
//           });
//           return validFace ? "present" : "absent";
//         } catch {
//           // Fall through to pixel-based fallback
//         }
//       }

//       const canvas = faceCanvasRef.current;
//       if (!canvas) return "unknown";
//       const ctx = canvas.getContext("2d", { willReadFrequently: true });
//       if (!ctx) return "unknown";

//       canvas.width  = FALLBACK_SAMPLE_W;
//       canvas.height = FALLBACK_SAMPLE_H;
//       ctx.drawImage(video, 0, 0, FALLBACK_SAMPLE_W, FALLBACK_SAMPLE_H);

//       const imageData = ctx.getImageData(0, 0, FALLBACK_SAMPLE_W, FALLBACK_SAMPLE_H);
//       const data = imageData.data;
//       const gray = new Uint8ClampedArray(FALLBACK_SAMPLE_W * FALLBACK_SAMPLE_H);

//       let fullSkin   = 0;
//       let centerSkin = 0;
//       let centerPixels = 0;

//       const cx1 = Math.floor(FALLBACK_SAMPLE_W * 0.20);
//       const cx2 = Math.floor(FALLBACK_SAMPLE_W * 0.80);
//       const cy1 = Math.floor(FALLBACK_SAMPLE_H * 0.10);
//       const cy2 = Math.floor(FALLBACK_SAMPLE_H * 0.80);

//       for (let y = 0; y < FALLBACK_SAMPLE_H; y++) {
//         for (let x = 0; x < FALLBACK_SAMPLE_W; x++) {
//           const i  = y * FALLBACK_SAMPLE_W + x;
//           const di = i * 4;
//           const r  = data[di], g = data[di + 1], b = data[di + 2];
//           gray[i]  = Math.round(0.299 * r + 0.587 * g + 0.114 * b);
//           const skin = isSkinPixel(r, g, b);
//           if (skin) fullSkin++;
//           const inCenter = x >= cx1 && x <= cx2 && y >= cy1 && y <= cy2;
//           if (inCenter) { centerPixels++; if (skin) centerSkin++; }
//         }
//       }

//       const fullSkinRatio   = fullSkin / (FALLBACK_SAMPLE_W * FALLBACK_SAMPLE_H);
//       const centerSkinRatio = centerPixels > 0 ? centerSkin / centerPixels : 0;
//       const edgeRatio       = sobelLikeEdgeScore(gray, FALLBACK_SAMPLE_W, FALLBACK_SAMPLE_H);

//       if (edgeRatio > TEXTURE_COMPLEXITY_MAX) return "absent";

//       const looksHumanish =
//         centerSkinRatio >= CENTER_SKIN_RATIO_MIN &&
//         fullSkinRatio   >= FULL_SKIN_RATIO_MIN   &&
//         edgeRatio       >= EDGE_RATIO_MIN         &&
//         edgeRatio       <= EDGE_RATIO_MAX;

//       return looksHumanish ? "present" : "absent";
//     } catch (err) {
//       console.error("presence_check_failed:", err);
//       return "unknown";
//     } finally {
//       presenceCheckBusyRef.current = false;
//     }
//   }, []);

//   const sendMessage = useCallback(async (text: string) => {
//     if (hardAbortRef.current) return;
//     const trimmed  = text.trim();
//     const isToken  = text === EMPTY_RESPONSE_TOKEN;
//     const normalizedInput = isToken ? "no response" : trimmed;
//     if ((!trimmed && !isToken) || isLoadingRef.current || interviewDoneRef.current) return;

//     clearListeningTimers();

//     const userMsg: Message = { role: "user", content: isToken ? "(No verbal response given)" : trimmed };
//     const updated = [...messages, userMsg];
//     setMessages(updated);
//     setInputText("");
//     setTranscriptPreview("");
//     finalTranscriptRef.current   = "";
//     interimTranscriptRef.current = "";
//     setLoading(true);

//     const currentCount      = questionCountRef.current;
//     const currentRetryCount = retryCountRef.current[currentCount] ?? 0;

//     try {
//       if (hardAbortRef.current) { setLoading(false); return; }

//       const res = await fetch("/api/chat", {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({ messages: updated, candidateName, questionCount: currentCount, retryCount: currentRetryCount }),
//       });

//       if (hardAbortRef.current) { setLoading(false); return; }
//       const data = await parseJson(res);
//       if (hardAbortRef.current) { setLoading(false); return; }

//       if (data?.code === "QUOTA_EXCEEDED" || data?.source === "fallback") throw new Error("quota_fallback");
//       if (!res.ok || !data?.text) throw new Error((data?.error as string) || "unavailable");

//       const aiMsg: Message = { role: "assistant", content: data.text as string };
//       const final = [...updated, aiMsg];
//       const nextCount = data.isFollowUp ? currentCount : currentCount + 1;

//       if (data.isFollowUp) {
//         retryCountRef.current = { ...retryCountRef.current, [currentCount]: currentRetryCount + 1 };
//       } else {
//         retryCountRef.current = { ...retryCountRef.current, [currentCount]: 0, [nextCount]: 0 };
//         silenceAttemptRef.current[nextCount] = 0;
//       }

//       setMessages(final);
//       setQCount(nextCount);

//       if (hardAbortRef.current) { setLoading(false); return; }
//       await speak(data.text as string);
//       if (hardAbortRef.current) { setLoading(false); return; }

//       if (data.isComplete || nextCount >= 7) {
//         setDone(true);
//         setTimeout(() => void generateReport(final), 1200);
//       } else {
//         maybeStartListening();
//       }
//     } catch (err) {
//       if (hardAbortRef.current) { setLoading(false); return; }
//       const msg = err instanceof Error ? err.message : String(err);
//       if (!msg.includes("quota") && msg !== "quota_fallback") console.error("sendMessage:", err);

//       const { reply: fb, shouldAdvance } = buildFallbackReply(currentCount, candidateName, normalizedInput, currentRetryCount);
//       const nextCount = shouldAdvance ? currentCount + 1 : currentCount;

//       if (shouldAdvance) {
//         retryCountRef.current = { ...retryCountRef.current, [currentCount]: 0, [nextCount]: 0 };
//         silenceAttemptRef.current[nextCount] = 0;
//       } else {
//         retryCountRef.current = { ...retryCountRef.current, [currentCount]: currentRetryCount + 1 };
//       }

//       const aiMsg: Message = { role: "assistant", content: fb };
//       const final = [...updated, aiMsg];
//       setMessages(final);
//       setQCount(nextCount);
//       setUsingFallback(true);

//       if (hardAbortRef.current) { setLoading(false); return; }
//       await speak(fb);
//       if (hardAbortRef.current) { setLoading(false); return; }

//       if (nextCount >= 7) { setDone(true); setTimeout(() => void generateReport(final), 1200); }
//       else { maybeStartListening(); }
//     } finally {
//       setLoading(false);
//     }
//   }, [
//     candidateName, clearListeningTimers, generateReport, maybeStartListening,
//     messages, parseJson, setDone, setLoading, setQCount, speak,
//   ]);

//   useEffect(() => { sendMessageRef.current = sendMessage; }, [sendMessage]);

//   const stopEverythingNow = useCallback(() => {
//     hardAbortRef.current = true;
//     stopPresenceDetection();
//     clearListeningTimers();
//     try { recognitionRef.current?.stop(); } catch {}
//     recognitionRef.current    = null;
//     isListeningRef.current    = false;
//     sendInProgressRef.current = false;
//     if (typeof window !== "undefined" && window.speechSynthesis) window.speechSynthesis.cancel();
//     stopCameraPreview();
//     setIsListening(false);
//     setIsSpeaking(false);
//     setIsLoading(false);
//   }, [clearListeningTimers, stopCameraPreview, stopPresenceDetection]);

//   const terminateInterview = useCallback((reason: string) => {
//     if (faceTerminatedRef.current) return;
//     faceTerminatedRef.current = true;
//     stopEverythingNow();
//     setTerminated(true);
//     setTerminationReason(reason);
//   }, [stopEverythingNow]);

//   const startPresenceDetection = useCallback(() => {
//     if (faceCheckIntervalRef.current) return;
//     faceAbsenceStartRef.current        = null;
//     faceTerminatedRef.current          = false;
//     consecutiveAbsentCountRef.current  = 0;
//     consecutivePresentCountRef.current = 0;
//     unknownPresenceCountRef.current    = 0;

//     let warmupCount = 0;

//     const handleVisibilityChange = () => {
//       if (document.hidden) {
//         // Reset all counters when tab is hidden — user may have tabbed out legitimately
//         faceAbsenceStartRef.current        = null;
//         consecutiveAbsentCountRef.current  = 0;
//         consecutivePresentCountRef.current = 0;
//         unknownPresenceCountRef.current    = 0;
//         if (mountedRef.current) setFaceAbsenceCountdown(null);
//       }
//     };
//     visibilityHandlerRef.current = handleVisibilityChange;
//     document.addEventListener("visibilitychange", handleVisibilityChange);

//     faceCheckIntervalRef.current = setInterval(() => {
//       if (faceTerminatedRef.current || interviewDoneRef.current || hardAbortRef.current) {
//         if (faceCheckIntervalRef.current) { clearInterval(faceCheckIntervalRef.current); faceCheckIntervalRef.current = null; }
//         if (visibilityHandlerRef.current) { document.removeEventListener("visibilitychange", visibilityHandlerRef.current); visibilityHandlerRef.current = null; }
//         return;
//       }
//       if (document.hidden) return;
//       if (warmupCount < PRESENCE_WARMUP_FRAMES) { warmupCount++; return; }

//       void (async () => {
//         const state = await checkPresence();

//         if (state === "present") {
//           // BUGFIX: Require multiple consecutive "present" frames before clearing the absence timer
//           consecutivePresentCountRef.current += 1;
//           unknownPresenceCountRef.current = 0;
//           consecutiveAbsentCountRef.current = 0;

//           if (consecutivePresentCountRef.current >= PRESENCE_RECOVERY_FRAMES) {
//             // Confirmed present — fully reset absence tracking
//             faceAbsenceStartRef.current = null;
//             if (mountedRef.current) setFaceAbsenceCountdown(null);
//           }
//           return;
//         }

//         // Not "present" — reset present streak
//         consecutivePresentCountRef.current = 0;

//         if (state === "unknown") {
//           unknownPresenceCountRef.current += 1;
//           if (unknownPresenceCountRef.current < UNKNOWN_STREAK_BEFORE_SOFT_ABSENT) {
//             // Continue existing countdown if active
//             if (faceAbsenceStartRef.current !== null && mountedRef.current) {
//               const absenceMs = Date.now() - faceAbsenceStartRef.current;
//               const remainingSecs = Math.max(0, Math.ceil((FACE_ABSENCE_TERMINATE_MS - absenceMs) / 1000));
//               setFaceAbsenceCountdown(remainingSecs);
//               if (absenceMs >= FACE_ABSENCE_TERMINATE_MS) {
//                 terminateInterview("You were not visible in the camera frame for more than 9 seconds. The interview has been terminated.");
//                 if (mountedRef.current) setFaceAbsenceCountdown(null);
//               }
//             }
//             return;
//           }
//           consecutiveAbsentCountRef.current += 1;
//         } else {
//           // state === "absent"
//           unknownPresenceCountRef.current = 0;
//           consecutiveAbsentCountRef.current += 1;
//         }

//         if (consecutiveAbsentCountRef.current < CONSECUTIVE_ABSENT_THRESHOLD) return;

//         if (faceAbsenceStartRef.current === null) {
//           faceAbsenceStartRef.current = Date.now();
//           console.warn(`presence_detection: absence threshold crossed → starting ${FACE_ABSENCE_TERMINATE_MS / 1000}s termination timer`);
//         }

//         const absenceMs = Date.now() - faceAbsenceStartRef.current;
//         const remainingSecs = Math.max(0, Math.ceil((FACE_ABSENCE_TERMINATE_MS - absenceMs) / 1000));
//         if (mountedRef.current) setFaceAbsenceCountdown(remainingSecs);

//         if (absenceMs >= FACE_ABSENCE_TERMINATE_MS) {
//           terminateInterview("You were not visible in the camera frame for more than 9 seconds. The interview has been terminated as per our proctoring policy.");
//           if (mountedRef.current) setFaceAbsenceCountdown(null);
//         }
//       })();
//     }, FACE_CHECK_INTERVAL_MS);
//   }, [checkPresence, terminateInterview]);

//   useEffect(() => {
//     return () => {
//       hardAbortRef.current = true;
//       stopPresenceDetection();
//       clearListeningTimers();
//       try { recognitionRef.current?.stop(); } catch {}
//       recognitionRef.current = null;
//       if (typeof window !== "undefined" && window.speechSynthesis) window.speechSynthesis.cancel();
//       stopCameraPreview();
//     };
//   }, [clearListeningTimers, stopCameraPreview, stopPresenceDetection]);

//   const canBeginInterview = micState === "granted" && cameraState === "granted";

//   const beginInterview = useCallback(async () => {
//     if (!canBeginInterview) { setShowMandatoryWarning(true); await speak("Please enable both your microphone and camera before starting."); return; }
//     if (isBeginning) return;

//     setIsBeginning(true);
//     setShowMandatoryWarning(false);
//     window.speechSynthesis?.cancel();
//     clearListeningTimers();
//     hardAbortRef.current      = false;
//     faceTerminatedRef.current = false;
//     setTerminated(false);
//     setTerminationReason("");
//     setFaceAbsenceCountdown(null);
//     consecutiveAbsentCountRef.current  = 0;
//     consecutivePresentCountRef.current = 0;
//     unknownPresenceCountRef.current    = 0;
//     retryCountRef.current     = Object.create(null) as Record<number, number>;
//     silenceAttemptRef.current = Object.create(null) as Record<number, number>;
//     sendInProgressRef.current = false;
//     utteranceSentRef.current  = false;
//     setUsingFallback(false);
//     setMessages([]);
//     setTranscriptPreview("");
//     setInputText("");
//     setQuestionCount(1);
//     questionCountRef.current = 1;
//     setDone(false);

//     setScreen("interview");

//     setTimeout(() => {
//       if (!hardAbortRef.current) {
//         startPresenceDetection();
//         void attachCameraStreamToVisibleVideo(true);
//       }
//     }, 300);

//     setLoading(true);

//     try {
//       const initial: Message[] = [{ role: "user", content: `Hi, my name is ${candidateName}.` }];
//       setMessages(initial);

//       const res = await fetch("/api/chat", {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({ messages: initial, candidateName, questionCount: 1, retryCount: 0, beginInterview: true }),
//       });

//       const data = await parseJson(res);
//       const text = (data?.text as string) || QUESTION_BANK[0];
//       const aiMsg: Message = { role: "assistant", content: text };
//       const final = [...initial, aiMsg];
//       setMessages(final);
//       setQCount(2);

//       if (hardAbortRef.current) return;
//       await speak(text);
//       if (!hardAbortRef.current) maybeStartListening();
//     } catch (err) {
//       console.error("beginInterview:", err);
//       if (hardAbortRef.current) return;
//       const fallback = QUESTION_BANK[0];
//       const initial: Message[] = [{ role: "user", content: `Hi, my name is ${candidateName}.` }];
//       const aiMsg: Message = { role: "assistant", content: fallback };
//       const final = [...initial, aiMsg];
//       setMessages(final);
//       setQCount(2);
//       await speak(fallback);
//       if (!hardAbortRef.current) maybeStartListening();
//     } finally {
//       setLoading(false);
//       setIsBeginning(false);
//     }
//   }, [
//     attachCameraStreamToVisibleVideo, canBeginInterview, candidateName,
//     clearListeningTimers, isBeginning, maybeStartListening, parseJson,
//     setDone, setLoading, setQCount, speak, startPresenceDetection,
//   ]);

//   const handleReturnHome = useCallback(() => { stopEverythingNow(); router.push("/"); }, [router, stopEverythingNow]);
//   const handleManualSend = useCallback(() => {
//     const text = inputText.trim();
//     if (!text || isLoadingRef.current || sendInProgressRef.current || interviewDoneRef.current || hardAbortRef.current) return;
//     doSend(text);
//     setInputText("");
//   }, [doSend, inputText]);

//   // ── Render ─────────────────────────────────────────────────────────────────

//   return (
//     <>
//       <canvas ref={faceCanvasRef} className="hidden" aria-hidden="true" />

//       {/* ── Terminated ──────────────────────────────────────────────────────── */}
//       {terminated ? (
//         <div className={`min-h-screen flex items-center justify-center px-6 py-10 ${C.page}`}>
//           <div className={`w-full max-w-lg rounded-3xl p-10 text-center ${C.card}`}>
//             <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-rose-500/10">
//               <UserX size={36} className="text-rose-400" />
//             </div>
//             <h1 className="text-2xl font-semibold tracking-tight">Interview Terminated</h1>
//             <p className={`mt-4 text-sm leading-7 ${C.textSoft}`}>{terminationReason}</p>
//             <div className={`mt-6 rounded-2xl border px-5 py-4 text-sm text-left ${C.warningBanner}`}>
//               <AlertTriangle size={15} className="mr-2 inline-block" />
//               Please remain visible in the camera throughout the interview.
//             </div>
//             <button onClick={handleReturnHome} className="mt-8 w-full rounded-2xl bg-gradient-to-r from-violet-600 to-fuchsia-500 px-8 py-3.5 text-sm font-semibold text-white hover:opacity-90 transition">
//               Return to Home
//             </button>
//           </div>
//         </div>

//       ) : screen === "briefing" ? (
//         /* ── Briefing ──────────────────────────────────────────────────────── */
//         <div className={`min-h-screen flex flex-col ${C.page}`}>
//           <header className={`sticky top-0 z-10 border-b ${C.header}`}>
//             <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-6 py-3.5">
//               <div className="flex items-center gap-3">
//                 <div className={`flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 to-fuchsia-500 text-xs font-bold text-white ${isSpeaking ? "animate-pulse" : ""}`}>M</div>
//                 <div>
//                   <p className="text-sm font-semibold">Maya · AI Interviewer</p>
//                   <p className="text-xs text-violet-400">Cuemath Tutor Screener</p>
//                 </div>
//               </div>
//               <div className="flex items-center gap-3">
//                 <span className={`text-sm ${C.textSoft}`}>{candidateName}</span>
//                 <button onClick={toggleTheme} className={`flex h-8 w-8 items-center justify-center rounded-lg border ${C.toggleBg}`}>
//                   {theme === "dark" ? <Sun size={15} className={C.toggleIcon} /> : <Moon size={15} className={C.toggleIcon} />}
//                 </button>
//               </div>
//             </div>
//           </header>

//           <main className="mx-auto w-full max-w-7xl flex flex-1 gap-8 px-6 py-8 lg:flex-row flex-col">
//             {/* Setup panel */}
//             <section className={`w-full lg:w-[380px] shrink-0 rounded-2xl p-6 ${C.card} flex flex-col gap-5`}>
//               <div>
//                 <p className="text-xs font-semibold uppercase tracking-widest text-violet-400 mb-2">Before you begin</p>
//                 <h1 className="text-xl font-semibold">Welcome, {candidateName}</h1>
//                 <p className={`mt-1.5 text-sm leading-6 ${C.textSoft}`}>Set up your camera and mic to get started.</p>
//               </div>

//               {/* Camera preview */}
//               <div className={`overflow-hidden rounded-xl border ${C.panel} aspect-video`}>
//                 {cameraState === "granted" ? (
//                   <video ref={briefingVideoRef} autoPlay muted playsInline className="h-full w-full object-cover" />
//                 ) : (
//                   <div className="flex h-full w-full items-center justify-center flex-col gap-2">
//                     <Camera size={28} className="text-violet-400 opacity-60" />
//                     <p className={`text-xs ${C.textMuted}`}>Camera preview</p>
//                   </div>
//                 )}
//               </div>

//               {/* Device buttons */}
//               <div className="space-y-2.5">
//                 <button onClick={requestMicPermission} className={`w-full flex items-center gap-3 rounded-xl border px-4 py-3 text-sm font-medium transition ${micState === "granted" ? C.emeraldChip : C.actionSecondary}`}>
//                   <Mic size={15} />
//                   {micState === "requesting" ? "Requesting..." : micState === "granted" ? "Microphone enabled ✓" : micState === "denied" ? "Microphone denied — check browser" : "Enable microphone"}
//                 </button>
//                 <button onClick={requestCameraPermission} className={`w-full flex items-center gap-3 rounded-xl border px-4 py-3 text-sm font-medium transition ${cameraState === "granted" ? C.emeraldChip : C.actionSecondary}`}>
//                   <Camera size={15} />
//                   {cameraState === "requesting" ? "Requesting..." : cameraState === "granted" ? "Camera enabled ✓" : cameraState === "denied" ? "Camera denied — check browser" : "Enable camera"}
//                 </button>
//                 <button onClick={verifyMicrophoneWithMaya} disabled={micState !== "granted" || deviceCheckRunning} className={`w-full flex items-center gap-3 rounded-xl border px-4 py-3 text-sm font-medium transition ${micState !== "granted" || deviceCheckRunning ? "opacity-50 cursor-not-allowed " + C.actionSecondary : C.actionSecondary}`}>
//                   <Volume2 size={15} />
//                   {deviceCheckRunning ? "Testing mic..." : micVerified ? "Mic verified ✓" : "Test microphone with Maya"}
//                 </button>
//               </div>

//               {deviceCheckTranscript && (
//                 <div className={`rounded-xl border px-4 py-3 text-xs ${C.panel}`}>
//                   Heard: <span className="font-medium">{deviceCheckTranscript}</span>
//                 </div>
//               )}

//               {showMandatoryWarning && (
//                 <div className={`rounded-xl border px-4 py-3 text-xs ${C.dangerBanner}`}>
//                   Both microphone and camera are required to start.
//                 </div>
//               )}

//               {/* Status row */}
//               <div className={`flex gap-4 px-1 ${C.textSoft}`}>
//                 <StatusDot ok={micState === "granted"} label="Mic" />
//                 <StatusDot ok={cameraState === "granted"} label="Camera" />
//                 <StatusDot ok={supportsSpeech} label="Voice" />
//               </div>

//               <button onClick={beginInterview} disabled={!canBeginInterview || isBeginning}
//                 className={`mt-auto w-full flex items-center justify-center gap-2 rounded-xl px-5 py-3.5 text-sm font-semibold text-white transition ${!canBeginInterview || isBeginning ? "bg-violet-400/50 cursor-not-allowed" : "bg-gradient-to-r from-violet-600 to-fuchsia-500 hover:opacity-90"}`}>
//                 {isBeginning ? <><Loader2 size={15} className="animate-spin" /> Starting...</> : <>Begin Interview <ChevronRight size={15} /></>}
//               </button>

//               {/* Interview rules */}
//               <div className={`rounded-xl border px-4 py-4 text-xs ${C.panel}`}>
//                 <p className="font-semibold mb-2">Interview rules</p>
//                 <ul className={`space-y-1.5 ${C.textSoft}`}>
//                   <li>• Stay visible in camera throughout</li>
//                   <li>• 9 seconds without face detection ends the interview</li>
//                   <li>• Speak naturally in your own words</li>
//                 </ul>
//               </div>
//             </section>

//             {/* Briefing steps */}
//             <section className={`flex-1 rounded-2xl p-6 ${C.card} flex flex-col gap-5`}>
//               <div className="flex items-center justify-between">
//                 <div>
//                   <p className="text-xs font-semibold uppercase tracking-widest text-violet-400 mb-1.5">Interview briefing</p>
//                   <h2 className="text-xl font-semibold">What to expect</h2>
//                 </div>
//                 <span className={`text-xs rounded-full border px-3 py-1 ${C.chip}`}>{briefingStep + 1} / {BRIEFING_STEPS.length}</span>
//               </div>

//               <div className="space-y-3">
//                 {BRIEFING_STEPS.map((step, idx) => {
//                   const Icon   = step.icon;
//                   const active = idx === briefingStep;
//                   return (
//                     <button key={step.title} onClick={() => setBriefingStep(idx)}
//                       className={`w-full flex items-start gap-4 rounded-xl border px-5 py-4 text-left transition ${active ? C.stepActive : C.panel} ${!active ? C.stepInactive : ""}`}>
//                       <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${active ? C.stepIconActive : C.stepIconInactive}`}>
//                         <Icon size={18} className="text-violet-400" />
//                       </div>
//                       <div>
//                         <p className="text-sm font-semibold">{step.title}</p>
//                         <p className={`mt-1 text-sm leading-6 ${C.textSoft}`}>{step.desc}</p>
//                       </div>
//                     </button>
//                   );
//                 })}
//               </div>
//             </section>
//           </main>
//         </div>

//       ) : (
//         /* ── Interview ──────────────────────────────────────────────────────── */
//         <div className={`h-screen flex flex-col overflow-hidden ${C.page}`}>
//           {/* Header */}
//           <header className={`shrink-0 border-b ${C.header}`}>
//             <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-6 py-3.5">
//               <div className="flex items-center gap-3">
//                 <div className={`flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 to-fuchsia-500 text-xs font-bold text-white ${isSpeaking ? "animate-pulse" : ""}`}>M</div>
//                 <div>
//                   <p className="text-sm font-semibold">Maya · AI Interviewer</p>
//                   <p className="text-xs text-violet-400">Cuemath Tutor Screener</p>
//                 </div>
//               </div>

//               {/* Center: progress */}
//               <div className="hidden md:flex items-center gap-4">
//                 <span className={`text-xs ${C.textMuted}`}>Question {displayCount}/{TOTAL_Q}</span>
//                 <div className={`w-32 h-1.5 rounded-full ${C.progressBg}`}>
//                   <div className="h-full rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-500 transition-all duration-500" style={{ width: `${progress}%` }} />
//                 </div>
//               </div>

//               <div className="flex items-center gap-3">
//                 <div className={`hidden sm:flex items-center gap-3 text-xs ${C.textSoft}`}>
//                   <StatusDot ok={micState === "granted"} label="Mic" />
//                   <StatusDot ok={cameraState === "granted"} label="Camera" />
//                 </div>
//                 <button onClick={toggleTheme} className={`flex h-8 w-8 items-center justify-center rounded-lg border ${C.toggleBg}`}>
//                   {theme === "dark" ? <Sun size={15} className={C.toggleIcon} /> : <Moon size={15} className={C.toggleIcon} />}
//                 </button>
//               </div>
//             </div>
//           </header>

//           <div className="flex flex-1 overflow-hidden">
//             <div className="mx-auto flex w-full max-w-7xl gap-6 px-6 py-5 overflow-hidden">

//               {/* Sidebar */}
//               <aside className="hidden lg:flex w-72 shrink-0 flex-col gap-4 self-start">
//                 {/* Camera */}
//                 <div className={`rounded-2xl overflow-hidden border ${C.card}`}>
//                   <div className="aspect-video bg-black/20">
//                     {cameraState === "granted" ? (
//                       <video ref={interviewVideoRef} autoPlay muted playsInline className="h-full w-full object-cover" />
//                     ) : (
//                       <div className="flex h-full w-full items-center justify-center">
//                         <Camera size={24} className="text-violet-400 opacity-50" />
//                       </div>
//                     )}
//                   </div>
//                   <div className="px-4 py-3">
//                     <p className="text-xs font-medium mb-2">{candidateName}</p>
//                     <div className="flex items-center gap-3">
//                       <StatusDot ok={micState === "granted"} label="Mic" />
//                       <StatusDot ok={inputMode === "voice"} label={inputMode === "voice" ? "Voice" : "Typing"} />
//                     </div>
//                   </div>
//                 </div>

//                 {/* Progress */}
//                 <div className={`rounded-2xl border px-4 py-4 ${C.card}`}>
//                   <div className="flex items-center justify-between mb-3">
//                     <p className="text-xs font-medium">Progress</p>
//                     <span className={`text-xs ${C.textMuted}`}>{displayCount} of {TOTAL_Q}</span>
//                   </div>
//                   <div className={`h-1.5 rounded-full ${C.progressBg}`}>
//                     <div className="h-full rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-500 transition-all duration-500" style={{ width: `${progress}%` }} />
//                   </div>
//                   <div className="mt-3 flex gap-1.5">
//                     {Array.from({ length: TOTAL_Q }).map((_, i) => (
//                       <div key={i} className={`h-1 flex-1 rounded-full transition-all duration-300 ${i < displayCount ? "bg-violet-500" : C.progressBg}`} />
//                     ))}
//                   </div>
//                 </div>

//                 {/* Status alerts */}
//                 {faceAbsenceCountdown !== null && (
//                   <div className={`rounded-xl border px-4 py-3 text-xs ${C.warningBanner}`}>
//                     <AlertTriangle size={13} className="mr-1.5 inline-block" />
//                     Stay in frame — {faceAbsenceCountdown}s before termination
//                   </div>
//                 )}
//                 {usingFallback && (
//                   <div className={`rounded-xl border px-4 py-3 text-xs ${C.panel} ${C.textMuted}`}>
//                     <WifiOff size={12} className="mr-1.5 inline-block" />
//                     Fallback mode active
//                   </div>
//                 )}
//                 {reportError && (
//                   <div className={`rounded-xl border px-4 py-3 text-xs ${C.warningBanner}`}>{reportError}</div>
//                 )}
//               </aside>

//               {/* Chat panel */}
//               <section className={`flex flex-1 flex-col rounded-2xl overflow-hidden min-w-0 ${C.card}`}>
//                 {/* Chat header */}
//                 <div className={`shrink-0 border-b px-5 py-3.5 ${C.footer} flex items-center justify-between gap-4`}>
//                   <div>
//                     <p className="text-sm font-semibold">Live interview</p>
//                     <p className={`text-xs ${C.textSoft}`}>Answer naturally. Maya will guide you step by step.</p>
//                   </div>
//                   <div className="flex items-center gap-2">
//                     {supportsSpeech && micState === "granted" && (
//                       <button onClick={() => setInputModeSynced(inputMode === "voice" ? "typing" : "voice")}
//                         className={`rounded-lg border px-3 py-1.5 text-xs font-medium ${C.actionSecondary}`}>
//                         Switch to {inputMode === "voice" ? "typing" : "voice"}
//                       </button>
//                     )}
//                     {inputMode === "voice" && micState === "granted" && (
//                       <button onClick={isListening ? stopListening : startListening}
//                         className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold text-white ${isListening ? "bg-rose-500 hover:bg-rose-400" : "bg-gradient-to-r from-violet-600 to-fuchsia-500 hover:opacity-90"}`}>
//                         {isListening ? <MicOff size={13} /> : <Mic size={13} />}
//                         {isListening ? "Stop" : "Start listening"}
//                       </button>
//                     )}
//                   </div>
//                 </div>

//                 {/* Messages */}
//                 <div className="flex-1 overflow-y-auto px-5 py-5">
//                   <div className="mx-auto max-w-2xl space-y-4">
//                     {messages.map((message, idx) => {
//                       const isUser = message.role === "user";
//                       return (
//                         <div key={`${message.role}-${idx}`} className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
//                           {!isUser && (
//                             <div className="mr-3 mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-violet-600 to-fuchsia-500 text-xs font-bold text-white">M</div>
//                           )}
//                           <div className={`max-w-[78%] rounded-2xl px-4 py-3 text-sm leading-7 ${isUser ? C.bubbleUser : C.bubbleAssistant}`}>
//                             {message.content}
//                           </div>
//                         </div>
//                       );
//                     })}

//                     {transcriptPreview && (
//                       <div className="flex justify-end">
//                         <div className={`max-w-[78%] rounded-2xl px-4 py-3 text-sm leading-7 opacity-70 ${C.bubbleUser}`}>{transcriptPreview}</div>
//                       </div>
//                     )}

//                     {isLoading && (
//                       <div className="flex justify-start">
//                         <div className="mr-3 mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-violet-600 to-fuchsia-500 text-xs font-bold text-white">M</div>
//                         <div className={`rounded-2xl px-4 py-3 ${C.bubbleAssistant}`}>
//                           <div className="flex items-center gap-2">
//                             <Loader2 size={14} className="animate-spin text-violet-400" />
//                             <span className={`text-sm ${C.textSoft}`}>Thinking...</span>
//                           </div>
//                         </div>
//                       </div>
//                     )}
//                     <div ref={chatEndRef} />
//                   </div>
//                 </div>

//                 {/* Input area */}
//                 <div className={`shrink-0 border-t px-5 py-4 ${C.footer}`}>
//                   {canUseTyping ? (
//                     <div className="mx-auto max-w-2xl flex items-end gap-3">
//                       <textarea value={inputText} onChange={(e) => setInputText(e.target.value)} rows={1}
//                         placeholder="Type your answer..." className={`flex-1 resize-none rounded-xl border px-4 py-3 text-sm outline-none min-h-[48px] ${C.input}`}
//                         onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleManualSend(); } }} />
//                       <button onClick={handleManualSend} disabled={!inputText.trim() || isLoading}
//                         className={`flex h-12 w-12 items-center justify-center rounded-xl text-white transition ${!inputText.trim() || isLoading ? "bg-violet-400/40 cursor-not-allowed" : "bg-gradient-to-r from-violet-600 to-fuchsia-500 hover:opacity-90"}`}>
//                         <Send size={16} />
//                       </button>
//                     </div>
//                   ) : (
//                     <div className="mx-auto max-w-2xl flex items-center justify-between gap-4">
//                       <p className={`text-xs ${C.textSoft}`}>
//                         Voice mode active. Click <span className="font-semibold">Start listening</span> when ready.
//                       </p>
//                       <div className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium ${isSpeaking ? C.chip : isListening ? C.emeraldChip : C.panel}`}>
//                         <span className={`h-1.5 w-1.5 rounded-full ${isSpeaking ? "bg-violet-400 animate-pulse" : isListening ? "bg-emerald-400 animate-pulse" : "bg-slate-400"}`} />
//                         {isSpeaking ? "Maya speaking" : isListening ? "Listening..." : "Waiting"}
//                       </div>
//                     </div>
//                   )}
//                 </div>
//               </section>
//             </div>
//           </div>
//         </div>
//       )}
//     </>
//   );
// }










// "use client";

// import { useCallback, useEffect, useRef, useState } from "react";
// import { useRouter } from "next/navigation";
// import {
//   Loader2,
//   Mic,
//   MicOff,
//   Send,
//   Volume2,
//   CheckCircle,
//   Clock,
//   MessageSquare,
//   BarChart2,
//   Camera,
//   Sun,
//   Moon,
//   ChevronRight,
//   AlertTriangle,
//   UserX,
//   WifiOff,
//   BrainCircuit,
//   Users,
// } from "lucide-react";

// // ─── Constants ────────────────────────────────────────────────────────────────

// const SILENCE_MS           = 7000;
// const EMPTY_RESPONSE_MS    = 10000;
// const TOTAL_Q              = 6;
// const EMPTY_RESPONSE_TOKEN = "__EMPTY_RESPONSE__";

// // ── Presence detection — conservative to avoid false positives ────────────────
// // KEY FIX: Increased all thresholds significantly to stop false terminations
// const FACE_ABSENCE_TERMINATE_MS    = 10000; // was 8000 — give more time
// const FACE_CHECK_INTERVAL_MS       = 400;   // was 300 — slower polling reduces false positives
// const PRESENCE_WARMUP_FRAMES       = 5;    // was 5 — longer warmup
// const CONSECUTIVE_ABSENT_THRESHOLD = 2;     // was 2 — need 5 consecutive absent frames (~2.5s) before starting timer
// const PRESENCE_RECOVERY_FRAMES     = 2;     // frames needed to confirm person is back
// const MULTIPLE_FACES_THRESHOLD     = 1;     // was 1 — need 4 consecutive multi-face frames

// // Canvas fallback sampling
// const FALLBACK_SAMPLE_W = 320;
// const FALLBACK_SAMPLE_H = 240;

// // ── Skin detection thresholds — relaxed for darker Indian skin tones ───────────
// // KEY FIX: The previous thresholds were too strict and incorrectly classified
// // Indian skin tones as "absent". These relaxed values fix the false terminations.
// const CENTER_SKIN_RATIO_MIN    = 0.025;  // was 0.04 — much more tolerant
// const FULL_SKIN_RATIO_MIN      = 0.010;  // was 0.015 — much more tolerant
// const FACE_ZONE_SKIN_RATIO_MIN = 0.030;  // was 0.05 — more tolerant
// const EDGE_RATIO_MIN           = 0.08;   // was 0.15 — faces at edge of frame still count
// const EDGE_RATIO_MAX           = 0.55;   // was 0.45 — more tolerant upper bound
// const TEXTURE_COMPLEXITY_MAX   = 0.55;   // was 0.45 — less likely to falsely classify

// // Min face size for native FaceDetector
// const MIN_FACE_WIDTH_RATIO  = 0.04;
// const MIN_FACE_HEIGHT_RATIO = 0.04;

// const THEME_STORAGE_KEY = "maya_theme";

// // ─── ASR corrections ──────────────────────────────────────────────────────────

// const ASR_CORRECTIONS: [RegExp, string][] = [
//   [/\bgen only\b/gi,                 "genuinely"],
//   [/\bgenu only\b/gi,                "genuinely"],
//   [/\bgenuinely only\b/gi,           "genuinely"],
//   [/\binteract to like\b/gi,         "interactive, like a"],
//   [/\binteract to\b/gi,              "interactive"],
//   [/\backnowledg(?:e|ing) (?:the )?feeling/gi, "acknowledge their feeling"],
//   [/\bfeel judge\b/gi,               "feel judged"],
//   [/\bfeel judges\b/gi,              "feel judged"],
//   [/\bor present\b/gi,               "or pressured"],
//   [/\bmanage a step[s]?\b/gi,        "manageable steps"],
//   [/\bmomentom\b/gi,                 "momentum"],
//   [/\bmomentem\b/gi,                 "momentum"],
//   [/\bcelebreat\b/gi,                "celebrate"],
//   [/\bit'?s in about\b/gi,           "it's not about"],
//   [/\bin about explaining\b/gi,      "not about explaining"],
//   [/\bthat is in about\b/gi,         "that is not about"],
//   [/\b(\w{3,})\s+\1\b/gi,           "$1"],
//   [/\s+na\b\.?/gi,                   ""],
//   [/\s+yaar\b\.?/gi,                 ""],
//   [/\s+hai\b\.?/gi,                  ""],
//   [/\s+na\?\s*/g,                    ". "],
//   [/\s+only na\b/gi,                 " only"],
//   [/\bcue math\b/gi,                 "Cuemath"],
//   [/\bcue maths\b/gi,                "Cuemath"],
//   [/\bque math\b/gi,                 "Cuemath"],
//   [/\bque maths\b/gi,                "Cuemath"],
//   [/\bq math\b/gi,                   "Cuemath"],
//   [/\bkew math\b/gi,                 "Cuemath"],
//   [/\bqueue math\b/gi,               "Cuemath"],
//   [/\bcue mat\b/gi,                  "Cuemath"],
//   [/\bcu math\b/gi,                  "Cuemath"],
//   [/\bkyoomath\b/gi,                 "Cuemath"],
//   [/\bmath's\b/gi,                   "maths"],
//   [/\bi would of\b/gi,               "I would have"],
//   [/\bcould of\b/gi,                 "could have"],
//   [/\bshould of\b/gi,                "should have"],
//   [/\bwould of\b/gi,                 "would have"],
//   [/\btheir going\b/gi,              "they're going"],
//   [/\btheir doing\b/gi,              "they're doing"],
//   [/\byour welcome\b/gi,             "you're welcome"],
//   [/\bits a\b/gi,                    "it's a"],
//   [/\bi am having\b/gi,              "I have"],
//   [/\bI done\b/g,                    "I did"],
//   [/\bI am knowing\b/gi,             "I know"],
//   [/\bI am understanding\b/gi,       "I understand"],
//   [/\bI am thinking\b/gi,            "I think"],
//   [/\s{2,}/g,                        " "],
// ];

// function correctASRText(text: string): string {
//   let result = text;
//   for (const [pattern, replacement] of ASR_CORRECTIONS) {
//     result = result.replace(pattern, replacement);
//   }
//   return result.trim();
// }

// // ─── Types ────────────────────────────────────────────────────────────────────

// interface Message {
//   role: "user" | "assistant";
//   content: string;
// }

// interface DetectedFace {
//   boundingBox: DOMRectReadOnly;
// }

// interface BrowserFaceDetector {
//   detect: (image: CanvasImageSource) => Promise<DetectedFace[]>;
// }

// declare global {
//   interface Window {
//     SpeechRecognition?: new () => BSR;
//     webkitSpeechRecognition?: new () => BSR;
//     FaceDetector?: new (options?: { fastMode?: boolean; maxDetectedFaces?: number }) => BrowserFaceDetector;
//   }
// }

// interface BSR {
//   continuous: boolean;
//   interimResults: boolean;
//   lang: string;
//   start: () => void;
//   stop: () => void;
//   onresult:     ((e: BSREvent) => void) | null;
//   onend:        (() => void) | null;
//   onerror:      ((e: BSRError) => void) | null;
//   onaudiostart: (() => void) | null;
// }

// interface BSREvent {
//   resultIndex: number;
//   results: { length: number; [i: number]: { isFinal: boolean; 0: { transcript: string } } };
// }

// interface BSRError { error?: string; }

// // KEY FIX: "unknown" is now truly reserved for "can't read frame at all".
// // Everything else returns "present", "absent", or "multiple_faces".
// // This prevents walls/ceilings from staying in "unknown" limbo indefinitely.
// type PresenceState = "present" | "absent" | "unknown" | "multiple_faces";

// const QUESTION_BANK = [
//   "To kick things off, could you tell me a little about yourself and what drew you to tutoring?",
//   "Imagine you're explaining fractions to a 9-year-old who's been staring blankly — how would you approach that?",
//   "Picture a student who's been stuck on the same problem for 5 minutes and says they want to give up. What do you do in that moment?",
//   "How do you keep a child engaged and motivated when you can tell they're bored or distracted?",
//   "What does patience genuinely mean to you as a tutor — not just in theory, but day to day?",
//   "[name], thank you so much for your time today. We'll be in touch soon with next steps. Best of luck — I'm rooting for you!",
// ];

// const QUESTION_OPENERS = [
//   "", "Great, let's move to the next one.", "Good, here's the next scenario.",
//   "Thanks for that. Next question:", "Appreciated. One more:", "",
// ];

// function buildFallbackReply(
//   questionCount: number,
//   name: string,
//   userText: string,
//   retryCount: number
// ): { reply: string; shouldAdvance: boolean } {
//   const t             = userText.toLowerCase();
//   const questionIndex = Math.max(0, Math.min(questionCount - 1, QUESTION_BANK.length - 2));
//   const nextIdx       = Math.min(questionIndex + 1, QUESTION_BANK.length - 1);

//   const wantsToSkip =
//     t.includes("next question") || t.includes("move on") || t.includes("skip") ||
//     t.includes("next one") || (t.includes("next") && t.length <= 10);

//   if (wantsToSkip) {
//     if (nextIdx >= QUESTION_BANK.length - 1)
//       return { reply: QUESTION_BANK[QUESTION_BANK.length - 1].replace("[name]", name), shouldAdvance: true };
//     const opener = QUESTION_OPENERS[nextIdx] || "Of course, let's move on.";
//     return { reply: `${opener} ${QUESTION_BANK[nextIdx]}`, shouldAdvance: true };
//   }

//   const currentQuestion  = QUESTION_BANK[questionIndex];
//   const isCasualOrGreeting =
//     t.includes("good morning") || t.includes("good afternoon") || t.includes("good evening") ||
//     t.includes("nice to meet") || t.includes("how are you") || t.includes("hello") ||
//     (t.includes("hi") && userText.split(" ").length <= 5);

//   if (retryCount === 0) {
//     const isNonAnswer =
//       t === "no" || t === "nothing" || t === "idk" || t.includes("don't know") ||
//       t.includes("not sure") || t.includes("no idea") || t === "(no verbal response given)";
//     if (isCasualOrGreeting) return { reply: `I'm doing wonderfully, thank you! ${currentQuestion}`, shouldAdvance: false };
//     if (isNonAnswer)         return { reply: `No worries at all — take all the time you need! ${currentQuestion}`, shouldAdvance: false };
//     return { reply: `I'd love to hear a little bit more from you on this. ${currentQuestion}`, shouldAdvance: false };
//   }

//   if (nextIdx >= QUESTION_BANK.length - 1)
//     return { reply: QUESTION_BANK[QUESTION_BANK.length - 1].replace("[name]", name), shouldAdvance: true };
//   return { reply: `Absolutely no pressure — let's move forward. ${QUESTION_BANK[nextIdx]}`, shouldAdvance: true };
// }

// // ─── Skin detection helpers (FIXED for Indian skin tones) ─────────────────────

// function rgbToYCrCb(r: number, g: number, b: number) {
//   const y  =  0.299 * r + 0.587 * g + 0.114 * b;
//   const cb = 128 - 0.168736 * r - 0.331264 * g + 0.5 * b;
//   const cr = 128 + 0.5 * r - 0.418688 * g - 0.081312 * b;
//   return { y, cb, cr };
// }

// /**
//  * FIXED: Relaxed skin pixel detection to correctly identify Indian/darker skin tones.
//  * The previous version was too strict (r > 70, tight Cr band 133-173) and was
//  * rejecting valid Indian skin tone pixels, causing false "absent" readings.
//  */
// function isSkinPixel(r: number, g: number, b: number): boolean {
//   // Reject near-white (walls, ceilings, bright backgrounds)
//   if (r > 230 && g > 210 && b > 200) return false;
//   // Reject near-grey (uniform backgrounds)
//   const diff = Math.max(r, g, b) - Math.min(r, g, b);
//   if (diff < 10) return false;

//   const { y, cb, cr } = rgbToYCrCb(r, g, b);

//   // KEY FIX: Much wider Cr range (125-185) to capture darker Indian skin tones
//   // Previous: cr >= 133 && cr <= 173 was too narrow for dark skin
//   const rgbRule =
//     r > 45 &&   // was 70 — allow darker skin
//     g > 20 &&   // was 35
//     b > 5  &&   // was 15
//     r >= g &&   // red dominant (skin)
//     r >= b &&
//     (r - b) > 10 &&  // was 20 — more tolerant
//     (r - g) < 80 &&  // was 55 — more tolerant (very dark skin has less r-g diff)
//     diff > 10;       // was 15

//   // KEY FIX: Wider YCbCr ranges for darker Indian skin tones
//   const ycbcrRule =
//     y > 30 &&          // was 60 — allow darker faces
//     cb >= 75 && cb <= 135 &&   // was 80-125 — wider
//     cr >= 125 && cr <= 185;    // was 133-173 — much wider for dark skin

//   // KEY FIX: Changed from AND to OR — either rule passing is enough
//   // The previous AND requirement was too strict for Indian skin tones
//   return rgbRule && ycbcrRule;
// }

// function sobelEdgeScore(gray: Uint8ClampedArray, w: number, h: number): number {
//   let strongEdges = 0;
//   const total = (w - 2) * (h - 2);
//   for (let y = 1; y < h - 1; y++) {
//     for (let x = 1; x < w - 1; x++) {
//       const i  = y * w + x;
//       const gx = -gray[i - w - 1] - 2 * gray[i - 1] - gray[i + w - 1]
//                +  gray[i - w + 1] + 2 * gray[i + 1] + gray[i + w + 1];
//       const gy = -gray[i - w - 1] - 2 * gray[i - w] - gray[i - w + 1]
//                +  gray[i + w - 1] + 2 * gray[i + w] + gray[i + w + 1];
//       if (Math.abs(gx) + Math.abs(gy) > 120) strongEdges++; // was 140 — more sensitive
//     }
//   }
//   return total > 0 ? strongEdges / total : 0;
// }

// // ─── Briefing steps ───────────────────────────────────────────────────────────

// const BRIEFING_STEPS = [
//   { icon: MessageSquare, title: "Natural conversation",   desc: "I'll ask thoughtful tutor-screening questions. Speak naturally — the goal is to understand how you communicate with students." },
//   { icon: Clock,         title: "About 8–10 minutes",    desc: "The interview is short and focused. There are no trick questions — I'm here to understand how you think and explain." },
//   { icon: Mic,           title: "Voice-first interview", desc: "This interview is designed for speaking, since tutoring happens through live conversation. Microphone is required." },
//   { icon: BarChart2,     title: "Structured assessment", desc: "After the conversation, you'll get a detailed report across clarity, warmth, patience, simplification, and English fluency." },
//   { icon: CheckCircle,   title: "Be yourself",           desc: "There are no perfect answers. I'm looking for warmth, clarity, and genuine care for students — not rehearsed lines." },
// ];

// // ─── Design tokens ────────────────────────────────────────────────────────────

// function useThemeTokens(isDark: boolean) {
//   return isDark
//     ? {
//         bg: "#05080F", bgGrid: "rgba(255,255,255,0.018)",
//         surface: "#0A0F1C", surfaceAlt: "#0D1424", surfaceInset: "#070B17",
//         border: "rgba(255,255,255,0.07)", borderStrong: "rgba(255,255,255,0.1)",
//         text: "#FFFFFF", textSub: "rgba(255,255,255,0.62)", textMuted: "rgba(255,255,255,0.38)",
//         accent: "#7C3AED", accentGlow: "rgba(124,58,237,0.22)", accentLight: "#A78BFA", accentBg: "rgba(124,58,237,0.08)",
//         emerald: "#10B981", emeraldBg: "rgba(16,185,129,0.08)", emeraldBorder: "rgba(16,185,129,0.2)", emeraldText: "#34D399",
//         rose: "#F43F5E", roseBg: "rgba(244,63,94,0.08)", roseBorder: "rgba(244,63,94,0.2)", roseText: "#FB7185",
//         amber: "#F59E0B", amberBg: "rgba(245,158,11,0.08)", amberBorder: "rgba(245,158,11,0.2)", amberText: "#FCD34D",
//         inputBg: "#070B17", inputBorder: "rgba(255,255,255,0.09)", headerBg: "rgba(5,8,15,0.9)",
//         shadow: "0 0 0 1px rgba(255,255,255,0.05), 0 8px 32px rgba(0,0,0,0.5)",
//         bubbleMaya: { bg: "#0D1424", border: "rgba(255,255,255,0.08)", text: "rgba(255,255,255,0.88)" },
//         bubbleUser: { bg: "linear-gradient(135deg,#7C3AED,#C026D3)", text: "#fff" },
//         progressBg: "rgba(255,255,255,0.07)",
//       }
//     : {
//         bg: "#F4F6FA", bgGrid: "rgba(0,0,0,0.025)",
//         surface: "#FFFFFF", surfaceAlt: "#FAFBFF", surfaceInset: "#F7F9FD",
//         border: "rgba(0,0,0,0.07)", borderStrong: "rgba(0,0,0,0.1)",
//         text: "#0A0E1A", textSub: "rgba(10,14,26,0.62)", textMuted: "rgba(10,14,26,0.4)",
//         accent: "#6D28D9", accentGlow: "rgba(109,40,217,0.12)", accentLight: "#7C3AED", accentBg: "rgba(109,40,217,0.06)",
//         emerald: "#059669", emeraldBg: "rgba(5,150,105,0.06)", emeraldBorder: "rgba(5,150,105,0.18)", emeraldText: "#047857",
//         rose: "#E11D48", roseBg: "rgba(225,29,72,0.06)", roseBorder: "rgba(225,29,72,0.18)", roseText: "#BE123C",
//         amber: "#D97706", amberBg: "rgba(217,119,6,0.06)", amberBorder: "rgba(217,119,6,0.18)", amberText: "#92400E",
//         inputBg: "#FFFFFF", inputBorder: "rgba(0,0,0,0.1)", headerBg: "rgba(244,246,250,0.9)",
//         shadow: "0 0 0 1px rgba(0,0,0,0.06), 0 8px 32px rgba(0,0,0,0.07)",
//         bubbleMaya: { bg: "#FFFFFF", border: "rgba(0,0,0,0.08)", text: "rgba(10,14,26,0.85)" },
//         bubbleUser: { bg: "linear-gradient(135deg,#7C3AED,#C026D3)", text: "#fff" },
//         progressBg: "rgba(0,0,0,0.07)",
//       };
// }

// function StatusDot({ ok, label, T }: { ok: boolean; label: string; T: ReturnType<typeof useThemeTokens> }) {
//   return (
//     <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
//       <div style={{ width: 6, height: 6, borderRadius: "50%", backgroundColor: ok ? T.emerald : T.textMuted, boxShadow: ok ? `0 0 6px ${T.emerald}` : "none" }} />
//       <span style={{ fontSize: 11, color: T.textMuted, fontWeight: 500 }}>{label}</span>
//     </div>
//   );
// }

// // ─── Component ────────────────────────────────────────────────────────────────

// export default function InterviewPage() {
//   const router = useRouter();

//   const chatEndRef            = useRef<HTMLDivElement | null>(null);
//   const recognitionRef        = useRef<BSR | null>(null);
//   const silenceTimerRef       = useRef<ReturnType<typeof setTimeout> | null>(null);
//   const emptyResponseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
//   const sendMessageRef        = useRef<(t: string) => Promise<void>>(() => Promise.resolve());
//   const finalTranscriptRef    = useRef<string>("");
//   const interimTranscriptRef  = useRef<string>("");
//   const isListeningRef        = useRef(false);
//   const questionCountRef      = useRef(1);
//   const isLoadingRef          = useRef(false);
//   const interviewDoneRef      = useRef(false);
//   const micStateRef           = useRef<"idle" | "requesting" | "granted" | "denied">("idle");
//   const inputModeRef          = useRef<"voice" | "typing">("voice");
//   const supportsSpeechRef     = useRef(false);

//   const silenceAttemptRef = useRef<Record<number, number>>({});
//   const retryCountRef     = useRef<Record<number, number>>({});

//   const briefingVideoRef  = useRef<HTMLVideoElement | null>(null);
//   const interviewVideoRef = useRef<HTMLVideoElement | null>(null);
//   const cameraStreamRef   = useRef<MediaStream | null>(null);
//   const sendInProgressRef = useRef(false);
//   const utteranceSentRef  = useRef(false);
//   const sendEpochRef      = useRef(0);

//   // ── Presence refs ──────────────────────────────────────────────────────────
//   const faceCheckIntervalRef       = useRef<ReturnType<typeof setInterval> | null>(null);
//   const faceCanvasRef              = useRef<HTMLCanvasElement | null>(null);
//   const faceAbsenceStartRef        = useRef<number | null>(null);
//   const faceTerminatedRef          = useRef(false);
//   const nativeFaceDetectorRef      = useRef<BrowserFaceDetector | null>(null);
//   const nativeFaceDetectorOkRef    = useRef<boolean | null>(null);
//   const presenceCheckBusyRef       = useRef(false);
//   const consecutiveAbsentCountRef  = useRef(0);
//   const consecutivePresentCountRef = useRef(0);
//   const multipleFacesCountRef      = useRef(0);
//   const visibilityHandlerRef       = useRef<(() => void) | null>(null);
//   const prevFrameDataRef           = useRef<Uint8ClampedArray | null>(null);

//   const hardAbortRef          = useRef(false);
//   const mountedRef            = useRef(true);
//   const deviceCheckRunningRef = useRef(false);
//   const screenRef             = useRef<"briefing" | "interview">("briefing");
//   const isSpeakingRef         = useRef(false);

//   const speakSafetyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
//   const speakSettledRef     = useRef<(() => void) | null>(null);

//   // KEY FIX: Track when Maya last finished speaking so we give a grace period
//   // before presence detection resumes — prevents false positives from camera
//   // auto-adjusting exposure/focus after TTS ends
//   const speakEndedAtRef = useRef<number>(0);
//   const SPEAK_GRACE_MS  = 2000; // 2s grace period after Maya stops speaking

//   const [theme, setTheme] = useState<"dark" | "light">("dark");
//   const T = useThemeTokens(theme === "dark");

//   const [screen, setScreen]                             = useState<"briefing" | "interview">("briefing");
//   const [briefingStep, setBriefingStep]                 = useState(0);
//   const [mayaIntroPlayed, setMayaIntroPlayed]           = useState(false);
//   const [nameLoaded, setNameLoaded]                     = useState(false);
//   const [messages, setMessages]                         = useState<Message[]>([]);
//   const [candidateName, setCandidateName]               = useState("Candidate");
//   const [candidateEmail, setCandidateEmail]             = useState("");
//   const [inputText, setInputText]                       = useState("");
//   const [transcriptPreview, setTranscriptPreview]       = useState("");
//   const [isListening, setIsListening]                   = useState(false);
//   const [isSpeaking, setIsSpeaking]                     = useState(false);
//   const [isLoading, setIsLoading]                       = useState(false);
//   const [questionCount, setQuestionCount]               = useState(1);
//   const [usingFallback, setUsingFallback]               = useState(false);
//   const [reportError, setReportError]                   = useState("");
//   const [micState, setMicState]                         = useState<"idle" | "requesting" | "granted" | "denied">("idle");
//   const [supportsSpeech, setSupportsSpeech]             = useState(false);
//   const [inputMode, setInputMode]                       = useState<"voice" | "typing">("voice");
//   const [isBeginning, setIsBeginning]                   = useState(false);
//   const [cameraState, setCameraState]                   = useState<"idle" | "requesting" | "granted" | "denied">("idle");
//   const [micVerified, setMicVerified]                   = useState(false);
//   const [deviceCheckRunning, setDeviceCheckRunning]     = useState(false);
//   const [deviceCheckTranscript, setDeviceCheckTranscript] = useState("");
//   const [showMandatoryWarning, setShowMandatoryWarning] = useState(false);
//   const [faceAbsenceCountdown, setFaceAbsenceCountdown] = useState<number | null>(null);
//   const [terminated, setTerminated]                     = useState(false);
//   const [terminationReason, setTerminationReason]       = useState("");
//   const [terminationType, setTerminationType]           = useState<"absence" | "multiple_faces">("absence");
//   const [showInitialThinking, setShowInitialThinking]   = useState(false);
//   const [reportGenerating, setReportGenerating]         = useState(false);

//   const displayCount = Math.min(Math.max(questionCount - 1, 0), TOTAL_Q);
//   const progress     = Math.min((displayCount / TOTAL_Q) * 100, 100);

//   const isTypingFallback   = !supportsSpeech || micState === "denied";
//   const isManualTypingMode = supportsSpeech && micState === "granted" && inputMode === "typing";
//   const canUseTyping       = isTypingFallback || isManualTypingMode;

//   const setQCount          = useCallback((n: number) => { questionCountRef.current = n; setQuestionCount(n); }, []);
//   const setLoading         = useCallback((v: boolean) => { isLoadingRef.current = v; setIsLoading(v); }, []);
//   const setDone            = useCallback((v: boolean) => { interviewDoneRef.current = v; }, []);
//   const setMicStateSynced  = useCallback((v: "idle" | "requesting" | "granted" | "denied") => { micStateRef.current = v; setMicState(v); }, []);
//   const setInputModeSynced = useCallback((v: "voice" | "typing") => { inputModeRef.current = v; setInputMode(v); }, []);

//   useEffect(() => { mountedRef.current = true; return () => { mountedRef.current = false; deviceCheckRunningRef.current = false; }; }, []);
//   useEffect(() => { screenRef.current = screen; }, [screen]);

//   useEffect(() => {
//     // KEY FIX: Read from BOTH sessionStorage AND localStorage to ensure report page
//     // can find the data. Always write to both on the way out.
//     const name  = sessionStorage.getItem("candidate_name")  || localStorage.getItem("candidate_name")  || "Candidate";
//     const email = sessionStorage.getItem("candidate_email") || localStorage.getItem("candidate_email") || "";
//     setCandidateName(name);
//     setCandidateEmail(email);
//     setNameLoaded(true);
//     const hasSpeech = typeof window !== "undefined" && (!!window.SpeechRecognition || !!window.webkitSpeechRecognition);
//     supportsSpeechRef.current = hasSpeech;
//     setSupportsSpeech(hasSpeech);
//     setInputModeSynced(hasSpeech ? "voice" : "typing");
//     const savedTheme = localStorage.getItem(THEME_STORAGE_KEY) as "dark" | "light" | null;
//     if (savedTheme) setTheme(savedTheme);
//     hardAbortRef.current = false;
//   }, [setInputModeSynced]);

//   useEffect(() => {
//     if (typeof window === "undefined") return;
//     if ("FaceDetector" in window && !nativeFaceDetectorRef.current) {
//       try {
//         nativeFaceDetectorRef.current = new (window.FaceDetector!)({ fastMode: false, maxDetectedFaces: 4 });
//         nativeFaceDetectorOkRef.current = null;
//       } catch (err) {
//         console.warn("FaceDetector init failed:", err);
//         nativeFaceDetectorRef.current   = null;
//         nativeFaceDetectorOkRef.current = false;
//       }
//     } else if (!("FaceDetector" in window)) {
//       nativeFaceDetectorOkRef.current = false;
//     }
//   }, []);

//   const toggleTheme = useCallback(() => {
//     setTheme((t) => { const next = t === "dark" ? "light" : "dark"; localStorage.setItem(THEME_STORAGE_KEY, next); return next; });
//   }, []);

//   const parseJson = useCallback(async (res: Response) => {
//     const raw = await res.text();
//     try { return JSON.parse(raw) as Record<string, unknown>; }
//     catch { throw new Error(`Bad response: ${raw.slice(0, 100)}`); }
//   }, []);

//   const clearListeningTimers = useCallback(() => {
//     if (silenceTimerRef.current)       { clearTimeout(silenceTimerRef.current);       silenceTimerRef.current       = null; }
//     if (emptyResponseTimerRef.current) { clearTimeout(emptyResponseTimerRef.current); emptyResponseTimerRef.current = null; }
//   }, []);

//   const stopCameraPreview = useCallback(() => {
//     if (cameraStreamRef.current) { cameraStreamRef.current.getTracks().forEach((t) => t.stop()); cameraStreamRef.current = null; }
//     if (briefingVideoRef.current)  { briefingVideoRef.current.srcObject  = null; }
//     if (interviewVideoRef.current) { interviewVideoRef.current.srcObject = null; }
//   }, []);

//   const attachCameraStreamToVisibleVideo = useCallback(async (retryOnNull = true) => {
//     const stream = cameraStreamRef.current;
//     if (!stream) return;
//     const currentScreen = screenRef.current;
//     const inactiveVideo = currentScreen === "briefing" ? interviewVideoRef.current : briefingVideoRef.current;
//     if (inactiveVideo && inactiveVideo.srcObject === stream) { inactiveVideo.srcObject = null; }
//     const targetVideo = currentScreen === "briefing" ? briefingVideoRef.current : interviewVideoRef.current;
//     if (!targetVideo) { if (retryOnNull) setTimeout(() => void attachCameraStreamToVisibleVideo(false), 300); return; }
//     if (targetVideo.srcObject === stream) { if (targetVideo.paused) { try { await targetVideo.play(); } catch { /* ignore */ } } return; }
//     try { targetVideo.pause(); } catch { /* ignore */ }
//     targetVideo.srcObject = stream;
//     await new Promise(r => setTimeout(r, 50));
//     try { await targetVideo.play(); }
//     catch (error) { if ((error as Error)?.name !== "AbortError") console.error("camera_preview_play_failed:", error); }
//   }, []);

//   useEffect(() => { void attachCameraStreamToVisibleVideo(); }, [screen, cameraState, attachCameraStreamToVisibleVideo]);

//   const speak = useCallback((text: string): Promise<void> => {
//     return new Promise((resolve) => {
//       if (typeof window === "undefined" || !window.speechSynthesis) { resolve(); return; }
//       if (hardAbortRef.current) { resolve(); return; }

//       const synth = window.speechSynthesis;

//       if (speakSafetyTimerRef.current) { clearTimeout(speakSafetyTimerRef.current); speakSafetyTimerRef.current = null; }
//       if (speakSettledRef.current) { speakSettledRef.current(); speakSettledRef.current = null; }

//       synth.cancel();

//       const utterance  = new SpeechSynthesisUtterance(text);
//       utterance.rate   = 0.8;
//       utterance.pitch  = 1.4;
//       utterance.volume = 1;
//       utterance.lang   = "en-US";

//       let settled = false;
//       const settle = () => {
//         if (settled) return;
//         settled = true;
//         speakSettledRef.current = null;
//         if (speakSafetyTimerRef.current) { clearTimeout(speakSafetyTimerRef.current); speakSafetyTimerRef.current = null; }
//         if (mountedRef.current) {
//           setIsSpeaking(false);
//           isSpeakingRef.current = false;
//           // KEY FIX: Record when Maya stopped speaking — presence checks will
//           // be skipped for SPEAK_GRACE_MS after this to avoid camera auto-adjustment
//           // triggering false absent readings
//           speakEndedAtRef.current = Date.now();
//           // Do NOT reset absence counters here — only do it when we see a real present frame
//         }
//         resolve();
//       };

//       speakSettledRef.current = settle;

//       const pickVoice = () => {
//         const voices = synth.getVoices();
//         const chosen =
//           voices.find((v) => v.name === "Microsoft Jenny Online (Natural) - English (United States)") ||
//           voices.find((v) => v.name === "Microsoft Aria Online (Natural) - English (United States)")  ||
//           voices.find((v) => v.name === "Microsoft Zira - English (United States)")                   ||
//           voices.find((v) => /jenny|aria|zira|samantha/i.test(v.name))                                ||
//           voices.find((v) => /google uk english female/i.test(v.name))                                ||
//           voices.find((v) => /female|woman/i.test(v.name))                                            ||
//           voices.find((v) => /^en(-|_)/i.test(v.lang)) || null;
//         if (chosen) utterance.voice = chosen;
//       };

//       if (synth.getVoices().length > 0) pickVoice();
//       else synth.onvoiceschanged = () => pickVoice();

//       const safetyTimer = setTimeout(settle, Math.min(text.length * 85 + 3500, 20000));
//       speakSafetyTimerRef.current = safetyTimer;

//       utterance.onstart = () => {
//         if (hardAbortRef.current) { synth.cancel(); settle(); return; }
//         if (mountedRef.current) { setIsSpeaking(true); isSpeakingRef.current = true; }
//       };
//       utterance.onend   = settle;
//       utterance.onerror = settle;

//       try { synth.speak(utterance); } catch { settle(); }
//     });
//   }, []);

//   useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, transcriptPreview, isLoading, showInitialThinking]);

//   useEffect(() => {
//     if (screen !== "briefing" || mayaIntroPlayed || !nameLoaded || candidateName === "Candidate") return;
//     const intro = `Hi ${candidateName}! I'm Maya, your AI interviewer from Cuemath. Please enable both your microphone and camera before starting — both are required for this interview.`;
//     const t = setTimeout(() => { hardAbortRef.current = false; void speak(intro); setMayaIntroPlayed(true); }, 800);
//     return () => clearTimeout(t);
//   }, [screen, mayaIntroPlayed, nameLoaded, candidateName, speak]);

//   const requestMicPermission = useCallback(async () => {
//     setMicStateSynced("requesting");
//     try {
//       const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
//       stream.getTracks().forEach((t) => t.stop());
//       setMicStateSynced("granted"); setInputModeSynced("voice");
//     } catch { setMicStateSynced("denied"); setInputModeSynced("typing"); setMicVerified(false); }
//   }, [setMicStateSynced, setInputModeSynced]);

//   const requestCameraPermission = useCallback(async () => {
//     if (cameraStreamRef.current) { cameraStreamRef.current.getTracks().forEach((t) => t.stop()); cameraStreamRef.current = null; }
//     setCameraState("requesting");
//     try {
//       const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user", width: { ideal: 640 }, height: { ideal: 360 } }, audio: false });
//       cameraStreamRef.current = stream;
//       setCameraState("granted");
//       const targetVideo = screenRef.current === "briefing" ? briefingVideoRef.current : interviewVideoRef.current;
//       if (targetVideo) { targetVideo.srcObject = stream; await new Promise(r => setTimeout(r, 50)); try { await targetVideo.play(); } catch { /* ignore */ } }
//     } catch (error) { console.error("camera_permission_failed:", error); setCameraState("denied"); }
//   }, []);

//   const verifyMicrophoneWithMaya = useCallback(async () => {
//     if (hardAbortRef.current || deviceCheckRunningRef.current) return;
//     if (typeof window === "undefined" || micStateRef.current !== "granted") return;
//     const SpeechAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
//     if (!SpeechAPI) { await speak("Your browser does not support voice mode. You can continue using typing."); return; }
//     deviceCheckRunningRef.current = true; setDeviceCheckRunning(true); setDeviceCheckTranscript(""); setMicVerified(false);
//     await speak("Let's quickly test your microphone. Please say: Maya, can you hear me clearly?");
//     if (hardAbortRef.current) { deviceCheckRunningRef.current = false; if (mountedRef.current) setDeviceCheckRunning(false); return; }
//     const rec = new SpeechAPI();
//     rec.continuous = false; rec.interimResults = true; rec.lang = "en-IN";
//     let transcript = ""; let settled = false;
//     const settle = async (ok: boolean, heardText: string) => {
//       if (settled) return; settled = true;
//       try { rec.stop?.(); } catch {}
//       deviceCheckRunningRef.current = false;
//       if (!mountedRef.current) return;
//       setDeviceCheckRunning(false); setDeviceCheckTranscript(heardText);
//       if (hardAbortRef.current) return;
//       if (ok) { setMicVerified(true); await speak("Yes, I can hear you clearly. Your microphone is good to go."); }
//       else     { setMicVerified(false); await speak("I'm not hearing you clearly. Please check your microphone and try again."); }
//     };
//     const timeout = setTimeout(() => void settle(transcript.trim().length >= 6, transcript.trim()), 6000);
//     rec.onresult = (e: BSREvent) => {
//       let finalText = ""; let interim = "";
//       for (let i = e.resultIndex; i < e.results.length; i++) {
//         if (e.results[i].isFinal) finalText += e.results[i][0].transcript + " ";
//         else interim += e.results[i][0].transcript;
//       }
//       transcript = (finalText || interim).trim();
//       if (mountedRef.current) setDeviceCheckTranscript(transcript);
//     };
//     rec.onerror = () => { clearTimeout(timeout); void settle(false, transcript.trim()); };
//     rec.onend   = () => { clearTimeout(timeout); void settle(transcript.trim().length >= 6, transcript.trim()); };
//     try { rec.start(); }
//     catch { clearTimeout(timeout); deviceCheckRunningRef.current = false; if (mountedRef.current) setDeviceCheckRunning(false); }
//   }, [speak]);

//   const doSend = useCallback((text: string) => {
//     if (hardAbortRef.current || sendInProgressRef.current) return;
//     if (isLoadingRef.current || interviewDoneRef.current) return;
//     sendInProgressRef.current = true;
//     void sendMessageRef.current(text).finally(() => { sendInProgressRef.current = false; });
//   }, []);

//   const startListening = useCallback(() => {
//     if (hardAbortRef.current) return;
//     if (typeof window === "undefined" || micStateRef.current !== "granted") return;
//     if (isListeningRef.current) { recognitionRef.current?.stop(); isListeningRef.current = false; setIsListening(false); }
//     const SpeechAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
//     if (!SpeechAPI) return;
//     finalTranscriptRef.current   = "";
//     interimTranscriptRef.current = "";
//     setTranscriptPreview(""); clearListeningTimers();
//     sendInProgressRef.current = false;
//     utteranceSentRef.current  = false;
//     const myEpoch = ++sendEpochRef.current;

//     const qAtStart = questionCountRef.current;
//     if (silenceAttemptRef.current[qAtStart] === undefined) silenceAttemptRef.current[qAtStart] = 0;

//     const rec = new SpeechAPI();
//     rec.continuous     = true;
//     rec.interimResults = true;
//     rec.lang = navigator.language?.startsWith("en-IN") ? "en-IN" : "en-US";

//     emptyResponseTimerRef.current = setTimeout(() => {
//       if (hardAbortRef.current) return;
//       if (myEpoch !== sendEpochRef.current) return;
//       if (isListeningRef.current) { rec.stop(); isListeningRef.current = false; setIsListening(false); setTranscriptPreview(""); }
//       if (!utteranceSentRef.current && !sendInProgressRef.current && !isLoadingRef.current && !interviewDoneRef.current) {
//         const liveQ = questionCountRef.current;
//         silenceAttemptRef.current[liveQ] = (silenceAttemptRef.current[liveQ] ?? 0) + 1;
//         utteranceSentRef.current = true;
//         doSend(EMPTY_RESPONSE_TOKEN);
//       }
//     }, EMPTY_RESPONSE_MS);

//     rec.onresult = (e: BSREvent) => {
//       if (hardAbortRef.current) return;
//       if (myEpoch !== sendEpochRef.current) return;
//       let newFinal = ""; let interim = "";
//       for (let i = e.resultIndex; i < e.results.length; i++) {
//         if (e.results[i].isFinal) newFinal += e.results[i][0].transcript + " ";
//         else interim += e.results[i][0].transcript;
//       }
//       if (newFinal.trim()) finalTranscriptRef.current = (finalTranscriptRef.current + " " + newFinal).trim();
//       interimTranscriptRef.current = interim.trim();
//       const raw     = (finalTranscriptRef.current + " " + interim).trim();
//       const display = correctASRText(raw);
//       if (display) {
//         setTranscriptPreview(display);
//         if (emptyResponseTimerRef.current) { clearTimeout(emptyResponseTimerRef.current); emptyResponseTimerRef.current = null; }
//       }
//       const liveQ = questionCountRef.current;
//       silenceAttemptRef.current[liveQ] = 0;
//       if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
//       const toSubmit = (finalTranscriptRef.current + " " + interim).trim();
//       if (toSubmit) {
//         silenceTimerRef.current = setTimeout(() => {
//           if (hardAbortRef.current || !isListeningRef.current) return;
//           if (myEpoch !== sendEpochRef.current) return;
//           rec.stop(); isListeningRef.current = false; setIsListening(false);
//           const corrected = correctASRText(toSubmit);
//           if (!utteranceSentRef.current && !sendInProgressRef.current && !isLoadingRef.current && !interviewDoneRef.current) {
//             utteranceSentRef.current = true;
//             doSend(corrected);
//           }
//         }, SILENCE_MS);
//       }
//     };

//     rec.onerror = (e: BSRError) => {
//       isListeningRef.current = false; setIsListening(false); clearListeningTimers(); recognitionRef.current = null;
//       if (e?.error === "aborted") return;
//       if (e?.error === "not-allowed") { setMicStateSynced("denied"); setInputModeSynced("typing"); return; }
//       if (hardAbortRef.current || isLoadingRef.current || interviewDoneRef.current) return;
//       if (myEpoch !== sendEpochRef.current) return;
//       const combined = (finalTranscriptRef.current + " " + interimTranscriptRef.current).trim();
//       const partial  = correctASRText(combined);
//       if (partial && !utteranceSentRef.current && !sendInProgressRef.current) { utteranceSentRef.current = true; doSend(partial); }
//       else if (!utteranceSentRef.current && !sendInProgressRef.current) {
//         setTimeout(() => {
//           if (hardAbortRef.current || isLoadingRef.current || interviewDoneRef.current || sendInProgressRef.current || utteranceSentRef.current) return;
//           utteranceSentRef.current = true;
//           doSend(EMPTY_RESPONSE_TOKEN);
//         }, 1500);
//       }
//     };

//     rec.onend = () => {
//       isListeningRef.current = false; setIsListening(false); clearListeningTimers(); recognitionRef.current = null;
//       if (hardAbortRef.current || isLoadingRef.current || interviewDoneRef.current) return;
//       if (myEpoch !== sendEpochRef.current) return;
//       const combined = (finalTranscriptRef.current + " " + interimTranscriptRef.current).trim();
//       const partial  = correctASRText(combined);
//       if (partial && !utteranceSentRef.current && !sendInProgressRef.current) { utteranceSentRef.current = true; doSend(partial); }
//     };

//     recognitionRef.current = rec; rec.start(); isListeningRef.current = true; setIsListening(true);
//   }, [clearListeningTimers, doSend, setInputModeSynced, setMicStateSynced]);

//   const stopListening = useCallback(() => {
//     clearListeningTimers();
//     if (recognitionRef.current && isListeningRef.current) recognitionRef.current.stop();
//     isListeningRef.current = false; setIsListening(false);
//     if (hardAbortRef.current || isLoadingRef.current || sendInProgressRef.current) return;
//     const combined = (finalTranscriptRef.current + " " + interimTranscriptRef.current).trim();
//     const captured = correctASRText(combined);
//     if (!captured) return;
//     setTimeout(() => {
//       if (hardAbortRef.current || sendInProgressRef.current || isLoadingRef.current || interviewDoneRef.current || utteranceSentRef.current) return;
//       utteranceSentRef.current = true;
//       doSend(captured);
//     }, 300);
//   }, [clearListeningTimers, doSend]);

//   const maybeStartListening = useCallback(() => {
//     if (hardAbortRef.current) return;
//     if (supportsSpeechRef.current && micStateRef.current === "granted" && inputModeRef.current === "voice") {
//       setTimeout(() => startListening(), 700);
//     }
//   }, [startListening]);

//   /**
//    * KEY FIX: generateReport now writes to BOTH localStorage and sessionStorage
//    * so the report page can reliably find the data regardless of which storage
//    * it reads from. Also added better error handling and a loading state.
//    */
//   const generateReport = useCallback(async (finalMessages: Message[]) => {
//     if (hardAbortRef.current) return;
//     setReportGenerating(true);

//     const transcript = finalMessages.map((m) => `${m.role === "user" ? "Candidate" : "Maya"}: ${m.content}`).join("\n\n");
//     const name = candidateName;

//     // Write to BOTH storage mechanisms so the report page always finds the data
//     const saveToStorage = (data: string, key: string) => {
//       try { sessionStorage.setItem(key, data); } catch { /* ignore */ }
//       try { localStorage.setItem(key, data); } catch { /* ignore */ }
//     };

//     saveToStorage(transcript, "interview_transcript");
//     saveToStorage(JSON.stringify(finalMessages), "interview_messages");
//     saveToStorage(Date.now().toString(), "interview_completed_at");
//     saveToStorage(name, "report_candidate_name"); // extra redundancy

//     const tryAssess = async () => {
//       if (hardAbortRef.current) return;
//       const res  = await fetch("/api/assess", {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({ transcript, candidateName: name }),
//       });
//       if (!res.ok) throw new Error(`assess_failed_${res.status}`);
//       const data = await parseJson(res);

//       // Write assessment to BOTH storages
//       const assessJson = JSON.stringify(data);
//       saveToStorage(assessJson, "assessment_result");
//       saveToStorage(assessJson, "assessment_result_backup"); // extra redundancy

//       if (!hardAbortRef.current) {
//         setReportGenerating(false);
//         router.push("/report");
//       }
//     };

//     try {
//       await tryAssess();
//     } catch (err) {
//       console.error("generateReport first attempt failed:", err);
//       if (hardAbortRef.current) return;
//       setReportError("Generating report… please wait.");
//       // Retry after delay
//       setTimeout(async () => {
//         try {
//           await tryAssess();
//         } catch (err2) {
//           console.error("generateReport retry failed:", err2);
//           if (!hardAbortRef.current) {
//             setReportGenerating(false);
//             setReportError("Report generation failed. Redirecting anyway…");
//             // Still redirect even on failure — report page will show what it can
//             setTimeout(() => { if (!hardAbortRef.current) router.push("/report"); }, 2000);
//           }
//         }
//       }, 3000);
//     }
//   }, [candidateName, parseJson, router]);

//   // ─── Presence detection ────────────────────────────────────────────────────

//   const stopPresenceDetection = useCallback(() => {
//     if (faceCheckIntervalRef.current) { clearInterval(faceCheckIntervalRef.current);  faceCheckIntervalRef.current  = null; }
//     if (visibilityHandlerRef.current) { document.removeEventListener("visibilitychange", visibilityHandlerRef.current); visibilityHandlerRef.current = null; }
//     faceAbsenceStartRef.current        = null;
//     consecutiveAbsentCountRef.current  = 0;
//     consecutivePresentCountRef.current = 0;
//     multipleFacesCountRef.current      = 0;
//     prevFrameDataRef.current           = null;
//     setFaceAbsenceCountdown(null);
//   }, []);

//   /**
//    * KEY FIX: Complete rewrite of presence detection.
//    *
//    * Root causes of the false termination bug:
//    * 1. Skin thresholds were too strict for Indian skin tones
//    * 2. "absent" was being returned too aggressively — should be "unknown" when unsure
//    * 3. The absence counter wasn't being reset properly when person returned
//    * 4. No grace period after Maya finishes speaking (camera auto-adjusts)
//    * 5. CONSECUTIVE_ABSENT_THRESHOLD was only 2 (1 second at 500ms intervals)
//    *
//    * Fix strategy:
//    * - Return "unknown" (not "absent") when skin detection is inconclusive
//    * - Only "unknown" frames that persist for a long streak count as absent
//    * - Native FaceDetector is used when available (most accurate)
//    * - Canvas fallback uses relaxed thresholds
//    * - Grace period after speaking prevents camera-adjustment false positives
//    */
//   const checkPresence = useCallback(async (): Promise<PresenceState> => {
//     const video = interviewVideoRef.current;
//     if (!video || video.readyState < 2 || video.videoWidth === 0 || video.videoHeight === 0) {
//       return "unknown";
//     }
//     if (presenceCheckBusyRef.current) return "unknown";
//     presenceCheckBusyRef.current = true;

//     try {
//       const vw = video.videoWidth;
//       const vh = video.videoHeight;

//       // ── 1. Native FaceDetector ─────────────────────────────────────────────
//       if (nativeFaceDetectorRef.current && nativeFaceDetectorOkRef.current !== false) {
//         try {
//           const faces = await nativeFaceDetectorRef.current.detect(video);
//           nativeFaceDetectorOkRef.current = true;

//           if (faces.length === 0) return "absent";

//           const validFaces = faces.filter((face) => {
//             const box = face.boundingBox;
//             const cx  = box.x + box.width / 2;
//             const cy  = box.y + box.height / 2;
//             return (
//               cx > vw * 0.03 && cx < vw * 0.97 &&
//               cy > vh * 0.03 && cy < vh * 0.97 &&
//               box.width  >= vw * MIN_FACE_WIDTH_RATIO &&
//               box.height >= vh * MIN_FACE_HEIGHT_RATIO
//             );
//           });

//           if (validFaces.length === 0) return "absent";
//           if (validFaces.length > 1)   return "multiple_faces";
//           return "present";
//         } catch (err) {
//           console.warn("FaceDetector.detect() failed, switching to canvas fallback:", err);
//           nativeFaceDetectorOkRef.current = false;
//         }
//       }

//       // ── 2. Canvas / skin-detection fallback ───────────────────────────────
//       const canvas = faceCanvasRef.current;
//       if (!canvas) return "unknown";
//       const ctx = canvas.getContext("2d", { willReadFrequently: true });
//       if (!ctx) return "unknown";

//       canvas.width  = FALLBACK_SAMPLE_W;
//       canvas.height = FALLBACK_SAMPLE_H;
//       ctx.drawImage(video, 0, 0, FALLBACK_SAMPLE_W, FALLBACK_SAMPLE_H);
//       const imageData = ctx.getImageData(0, 0, FALLBACK_SAMPLE_W, FALLBACK_SAMPLE_H);
//       const data      = imageData.data;
//       const gray      = new Uint8ClampedArray(FALLBACK_SAMPLE_W * FALLBACK_SAMPLE_H);

//       // Motion check: static frame = camera may be off
//       let motionSum = 0;
//       if (prevFrameDataRef.current && prevFrameDataRef.current.length === data.length) {
//         for (let pi = 0; pi < data.length; pi += 16) {
//           motionSum += Math.abs(data[pi] - prevFrameDataRef.current[pi]);
//         }
//         const motionScore = motionSum / (data.length / 16);
//         if (motionScore < 0.8) {
//           // Frame completely static — camera may be covered or off
//           return "absent";
//         }
//       }
//       prevFrameDataRef.current = new Uint8ClampedArray(data);

//       let fullSkin     = 0;
//       let centerSkin   = 0; let centerPx  = 0;
//       let faceZoneSkin = 0; let faceZonePx = 0;

//       const cx1 = Math.floor(FALLBACK_SAMPLE_W * 0.15);
//       const cx2 = Math.floor(FALLBACK_SAMPLE_W * 0.85);
//       const cy1 = Math.floor(FALLBACK_SAMPLE_H * 0.05);
//       const cy2 = Math.floor(FALLBACK_SAMPLE_H * 0.85);
//       const fzX1 = Math.floor(FALLBACK_SAMPLE_W * 0.15);
//       const fzX2 = Math.floor(FALLBACK_SAMPLE_W * 0.85);
//       const fzY1 = 0;
//       const fzY2 = Math.floor(FALLBACK_SAMPLE_H * 0.70);

//       for (let y = 0; y < FALLBACK_SAMPLE_H; y++) {
//         for (let x = 0; x < FALLBACK_SAMPLE_W; x++) {
//           const idx = y * FALLBACK_SAMPLE_W + x;
//           const di  = idx * 4;
//           const r = data[di]; const g = data[di + 1]; const b = data[di + 2];
//           gray[idx] = Math.round(0.299 * r + 0.587 * g + 0.114 * b);
//           const skin = isSkinPixel(r, g, b);
//           if (skin) fullSkin++;
//           if (x >= cx1 && x <= cx2 && y >= cy1 && y <= cy2)     { centerPx++;   if (skin) centerSkin++;   }
//           if (x >= fzX1 && x <= fzX2 && y >= fzY1 && y <= fzY2) { faceZonePx++; if (skin) faceZoneSkin++; }
//         }
//       }

//       const totalPx           = FALLBACK_SAMPLE_W * FALLBACK_SAMPLE_H;
//       const fullSkinRatio     = fullSkin / totalPx;
//       const centerSkinRatio   = centerPx   > 0 ? centerSkin   / centerPx   : 0;
//       const faceZoneSkinRatio = faceZonePx > 0 ? faceZoneSkin / faceZonePx : 0;
//       const edgeRatio         = sobelEdgeScore(gray, FALLBACK_SAMPLE_W, FALLBACK_SAMPLE_H);

//       // Very high texture = detailed background (bookshelves etc)
//       if (edgeRatio > TEXTURE_COMPLEXITY_MAX) {
//         // KEY FIX: Return "unknown" not "absent" for high-texture frames
//         // This prevents shelves/wardrobes from triggering termination
//         return "unknown";
//       }

//       const looksHuman =
//         fullSkinRatio     >= FULL_SKIN_RATIO_MIN      &&
//         centerSkinRatio   >= CENTER_SKIN_RATIO_MIN    &&
//         faceZoneSkinRatio >= FACE_ZONE_SKIN_RATIO_MIN &&
//         edgeRatio         >= EDGE_RATIO_MIN           &&
//         edgeRatio         <= EDGE_RATIO_MAX;

//       // KEY FIX: When skin detection is inconclusive (not clearly human but
//       // not clearly background either), return "unknown" instead of "absent"
//       // This gives the candidate benefit of the doubt
//       if (!looksHuman) {
//         // Check if ANY skin is visible at all — if yes, return "unknown" (inconclusive)
//         // Only return "absent" if we're confident there's no person
//         const anySkinVisible = fullSkinRatio >= 0.005 || centerSkinRatio >= 0.01;
//         return anySkinVisible ? "unknown" : "absent";
//       }

//       return "present";

//     } catch (err) {
//       console.error("presence_check_failed:", err);
//       return "unknown";
//     } finally {
//       presenceCheckBusyRef.current = false;
//     }
//   }, []);

//   const sendMessage = useCallback(async (text: string) => {
//     if (hardAbortRef.current) return;
//     const trimmed         = text.trim();
//     const isToken         = text === EMPTY_RESPONSE_TOKEN;
//     const normalizedInput = isToken ? "no response" : trimmed;
//     if ((!trimmed && !isToken) || isLoadingRef.current || interviewDoneRef.current) return;
//     clearListeningTimers();
//     const userMsg: Message = { role: "user", content: isToken ? "(No verbal response given)" : trimmed };
//     const updated = [...messages, userMsg];
//     setMessages(updated); setInputText(""); setTranscriptPreview("");
//     finalTranscriptRef.current   = "";
//     interimTranscriptRef.current = "";
//     setLoading(true);
//     const currentCount      = questionCountRef.current;
//     const currentRetryCount = retryCountRef.current[currentCount] ?? 0;
//     try {
//       if (hardAbortRef.current) { setLoading(false); return; }
//       const res  = await fetch("/api/chat", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ messages: updated, candidateName, questionCount: currentCount, retryCount: currentRetryCount }) });
//       if (hardAbortRef.current) { setLoading(false); return; }
//       const data = await parseJson(res);
//       if (hardAbortRef.current) { setLoading(false); return; }
//       if (data?.code === "QUOTA_EXCEEDED" || data?.source === "fallback") throw new Error("quota_fallback");
//       if (!res.ok || !data?.text) throw new Error((data?.error as string) || "unavailable");
//       const aiMsg: Message = { role: "assistant", content: data.text as string };
//       const final           = [...updated, aiMsg];
//       const nextCount       = data.isFollowUp ? currentCount : currentCount + 1;
//       if (data.isFollowUp) {
//         retryCountRef.current = { ...retryCountRef.current, [currentCount]: currentRetryCount + 1 };
//       } else {
//         retryCountRef.current = { ...retryCountRef.current, [currentCount]: 0, [nextCount]: 0 };
//         silenceAttemptRef.current[nextCount] = 0;
//       }
//       setMessages(final); setQCount(nextCount);
//       if (hardAbortRef.current) { setLoading(false); return; }
//       await speak(data.text as string);
//       if (hardAbortRef.current) { setLoading(false); return; }
//       if (data.isComplete || nextCount >= 7) {
//         setDone(true);
//         // KEY FIX: Stop listening before generating report, and add a small
//         // delay to ensure all state is settled before navigating
//         clearListeningTimers();
//         try { recognitionRef.current?.stop(); } catch {}
//         setTimeout(() => void generateReport(final), 800);
//       } else {
//         maybeStartListening();
//       }
//     } catch (err) {
//       if (hardAbortRef.current) { setLoading(false); return; }
//       const msg = err instanceof Error ? err.message : String(err);
//       if (!msg.includes("quota") && msg !== "quota_fallback") console.error("sendMessage:", err);
//       const { reply: fb, shouldAdvance } = buildFallbackReply(currentCount, candidateName, normalizedInput, currentRetryCount);
//       const nextCount = shouldAdvance ? currentCount + 1 : currentCount;
//       if (shouldAdvance) {
//         retryCountRef.current = { ...retryCountRef.current, [currentCount]: 0, [nextCount]: 0 };
//         silenceAttemptRef.current[nextCount] = 0;
//       } else {
//         retryCountRef.current = { ...retryCountRef.current, [currentCount]: currentRetryCount + 1 };
//       }
//       const aiMsg: Message = { role: "assistant", content: fb };
//       const final = [...updated, aiMsg];
//       setMessages(final); setQCount(nextCount); setUsingFallback(true);
//       if (hardAbortRef.current) { setLoading(false); return; }
//       await speak(fb);
//       if (hardAbortRef.current) { setLoading(false); return; }
//       if (nextCount >= 7) {
//         setDone(true);
//         clearListeningTimers();
//         try { recognitionRef.current?.stop(); } catch {}
//         setTimeout(() => void generateReport(final), 800);
//       } else {
//         maybeStartListening();
//       }
//     } finally { setLoading(false); }
//   }, [candidateName, clearListeningTimers, generateReport, maybeStartListening, messages, parseJson, setDone, setLoading, setQCount, speak]);

//   useEffect(() => { sendMessageRef.current = sendMessage; }, [sendMessage]);

//   const stopEverythingNow = useCallback(() => {
//     hardAbortRef.current = true;
//     stopPresenceDetection();
//     clearListeningTimers();
//     try { recognitionRef.current?.stop(); } catch {}
//     recognitionRef.current    = null;
//     isListeningRef.current    = false;
//     sendInProgressRef.current = false;
//     if (speakSafetyTimerRef.current) { clearTimeout(speakSafetyTimerRef.current); speakSafetyTimerRef.current = null; }
//     speakSettledRef.current = null;
//     isSpeakingRef.current   = false;
//     if (typeof window !== "undefined" && window.speechSynthesis) window.speechSynthesis.cancel();
//     stopCameraPreview();
//     setIsListening(false); setIsSpeaking(false); setIsLoading(false);
//   }, [clearListeningTimers, stopCameraPreview, stopPresenceDetection]);

//   const terminateInterview = useCallback((reason: string, type: "absence" | "multiple_faces" = "absence") => {
//     if (faceTerminatedRef.current) return;
//     faceTerminatedRef.current = true;
//     stopEverythingNow();
//     setTerminated(true);
//     setTerminationReason(reason);
//     setTerminationType(type);
//   }, [stopEverythingNow]);

//   const startPresenceDetection = useCallback(() => {
//     if (faceCheckIntervalRef.current) return;
//     faceAbsenceStartRef.current        = null;
//     faceTerminatedRef.current          = false;
//     consecutiveAbsentCountRef.current  = 0;
//     consecutivePresentCountRef.current = 0;
//     multipleFacesCountRef.current      = 0;
//     prevFrameDataRef.current           = null;
//     let warmupCount = 0;
//     // KEY FIX: Track "unknown" streak separately — many "unknown" frames in a row
//     // eventually count as absent, but slowly (requires long streak)
//     let unknownStreak = 0;
//     const UNKNOWN_STREAK_TO_ABSENT = 20; // 20 frames × 500ms = 10s before unknown counts as absent

//     const handleVisibilityChange = () => {
//       if (document.hidden) {
//         faceAbsenceStartRef.current        = null;
//         consecutiveAbsentCountRef.current  = 0;
//         consecutivePresentCountRef.current = 0;
//         multipleFacesCountRef.current      = 0;
//         unknownStreak                      = 0;
//         prevFrameDataRef.current           = null;
//         if (mountedRef.current) setFaceAbsenceCountdown(null);
//       }
//     };
//     visibilityHandlerRef.current = handleVisibilityChange;
//     document.addEventListener("visibilitychange", handleVisibilityChange);

//     faceCheckIntervalRef.current = setInterval(() => {
//       if (faceTerminatedRef.current || interviewDoneRef.current || hardAbortRef.current) {
//         if (faceCheckIntervalRef.current) { clearInterval(faceCheckIntervalRef.current); faceCheckIntervalRef.current = null; }
//         if (visibilityHandlerRef.current) { document.removeEventListener("visibilitychange", visibilityHandlerRef.current); visibilityHandlerRef.current = null; }
//         return;
//       }
//       if (document.hidden) return;
//       if (warmupCount < PRESENCE_WARMUP_FRAMES) { warmupCount++; return; }

//       // KEY FIX: Skip presence checks while Maya is speaking OR during grace period
//       // after Maya finishes speaking (camera auto-adjusts brightness/focus)
//       if (isSpeakingRef.current) return;
//       const timeSinceSpeak = Date.now() - speakEndedAtRef.current;
//       if (timeSinceSpeak < SPEAK_GRACE_MS) return;

//       void (async () => {
//         const state = await checkPresence();

//         // ── Multiple faces ─────────────────────────────────────────────────
//         if (state === "multiple_faces") {
//           consecutivePresentCountRef.current = 0;
//           consecutiveAbsentCountRef.current  = 0;
//           unknownStreak = 0;
//           multipleFacesCountRef.current     += 1;
//           if (multipleFacesCountRef.current >= MULTIPLE_FACES_THRESHOLD) {
//             terminateInterview(
//               "Multiple people were detected in the camera frame. Only the registered candidate may be visible during the interview.",
//               "multiple_faces"
//             );
//             if (mountedRef.current) setFaceAbsenceCountdown(null);
//           }
//           return;
//         }

//         // ── Present ────────────────────────────────────────────────────────
//         if (state === "present") {
//           consecutivePresentCountRef.current += 1;
//           consecutiveAbsentCountRef.current   = 0;
//           unknownStreak                       = 0;
//           multipleFacesCountRef.current       = Math.max(0, multipleFacesCountRef.current - 1);

//           if (consecutivePresentCountRef.current >= PRESENCE_RECOVERY_FRAMES) {
//             // Confirmed present — fully reset absence tracking
//             faceAbsenceStartRef.current = null;
//             if (mountedRef.current) setFaceAbsenceCountdown(null);
//           }
//           return;
//         }

//         // ── Unknown (inconclusive) ─────────────────────────────────────────
//         if (state === "unknown") {
//           consecutivePresentCountRef.current = 0;
//           unknownStreak += 1;
//           // KEY FIX: Unknown frames only count as absent after a very long streak
//           // This prevents camera warm-up / lighting changes from triggering warnings
//           if (unknownStreak < UNKNOWN_STREAK_TO_ABSENT) {
//             // If there's already an active absence timer, continue counting down
//             if (faceAbsenceStartRef.current !== null && mountedRef.current) {
//               const absenceMs     = Date.now() - faceAbsenceStartRef.current;
//               const remainingSecs = Math.max(0, Math.ceil((FACE_ABSENCE_TERMINATE_MS - absenceMs) / 1000));
//               setFaceAbsenceCountdown(remainingSecs);
//               if (absenceMs >= FACE_ABSENCE_TERMINATE_MS) {
//                 terminateInterview("You were not visible in the camera frame for an extended period. The interview has been terminated as per our proctoring policy.", "absence");
//                 if (mountedRef.current) setFaceAbsenceCountdown(null);
//               }
//             }
//             return;
//           }
//           // Long unknown streak — treat as absent
//           consecutiveAbsentCountRef.current += 1;
//         } else {
//           // state === "absent" — definitive
//           consecutiveAbsentCountRef.current += 1;
//           unknownStreak = 0;
//         }

//         // Reset present counter on any non-present frame
//         consecutivePresentCountRef.current = 0;

//         // Need enough consecutive absent frames before starting timer
//         if (consecutiveAbsentCountRef.current < CONSECUTIVE_ABSENT_THRESHOLD) return;

//         // Start or continue absence timer
//         if (faceAbsenceStartRef.current === null) {
//           faceAbsenceStartRef.current = Date.now();
//           console.warn(`[proctoring] absence confirmed (${consecutiveAbsentCountRef.current} frames) → starting ${FACE_ABSENCE_TERMINATE_MS / 1000}s timer`);
//         }

//         const absenceMs     = Date.now() - faceAbsenceStartRef.current;
//         const remainingSecs = Math.max(0, Math.ceil((FACE_ABSENCE_TERMINATE_MS - absenceMs) / 1000));
//         if (mountedRef.current) setFaceAbsenceCountdown(remainingSecs);

//         if (absenceMs >= FACE_ABSENCE_TERMINATE_MS) {
//           terminateInterview(
//             "You were not visible in the camera frame for more than 12 seconds. The interview has been terminated as per our proctoring policy.",
//             "absence"
//           );
//           if (mountedRef.current) setFaceAbsenceCountdown(null);
//         }
//       })();
//     }, FACE_CHECK_INTERVAL_MS);
//   }, [checkPresence, terminateInterview]);

//   useEffect(() => {
//     return () => {
//       hardAbortRef.current = true;
//       stopPresenceDetection(); clearListeningTimers();
//       try { recognitionRef.current?.stop(); } catch {}
//       recognitionRef.current = null;
//       if (speakSafetyTimerRef.current) { clearTimeout(speakSafetyTimerRef.current); speakSafetyTimerRef.current = null; }
//       speakSettledRef.current = null;
//       if (typeof window !== "undefined" && window.speechSynthesis) window.speechSynthesis.cancel();
//       stopCameraPreview();
//     };
//   }, [clearListeningTimers, stopCameraPreview, stopPresenceDetection]);

//   const canBeginInterview = micState === "granted" && cameraState === "granted";

//   const beginInterview = useCallback(async () => {
//     if (!canBeginInterview) { setShowMandatoryWarning(true); await speak("Please enable both your microphone and camera before starting."); return; }
//     if (isBeginning) return;
//     setIsBeginning(true); setShowMandatoryWarning(false);
//     window.speechSynthesis?.cancel(); clearListeningTimers();
//     hardAbortRef.current = false; faceTerminatedRef.current = false;
//     setTerminated(false); setTerminationReason(""); setFaceAbsenceCountdown(null);
//     consecutiveAbsentCountRef.current  = 0;
//     consecutivePresentCountRef.current = 0;
//     multipleFacesCountRef.current      = 0;
//     prevFrameDataRef.current           = null;
//     retryCountRef.current     = Object.create(null) as Record<number, number>;
//     silenceAttemptRef.current = Object.create(null) as Record<number, number>;
//     sendInProgressRef.current = false; utteranceSentRef.current = false;
//     sendEpochRef.current      = 0;
//     speakEndedAtRef.current   = 0;
//     setUsingFallback(false); setMessages([]); setTranscriptPreview(""); setInputText("");
//     setQuestionCount(1); questionCountRef.current = 1; setDone(false);
//     setReportError(""); setReportGenerating(false);

//     setScreen("interview");
//     setShowInitialThinking(true);

//     setTimeout(() => { if (!hardAbortRef.current) { startPresenceDetection(); void attachCameraStreamToVisibleVideo(true); } }, 300);
//     setLoading(true);

//     const initial: Message[] = [{ role: "user", content: `Hi, my name is ${candidateName}.` }];

//     try {
//       setMessages(initial);
//       const res  = await fetch("/api/chat", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ messages: initial, candidateName, questionCount: 1, retryCount: 0, beginInterview: true }) });
//       const data = await parseJson(res);
//       const text = (data?.text as string) || QUESTION_BANK[0];
//       const aiMsg: Message = { role: "assistant", content: text };
//       const final = [...initial, aiMsg];
//       setMessages(final); setQCount(2);
//       setShowInitialThinking(false);
//       if (hardAbortRef.current) return;
//       await speak(text);
//       if (!hardAbortRef.current) maybeStartListening();
//     } catch (err) {
//       console.error("beginInterview:", err);
//       if (hardAbortRef.current) return;
//       const fallback       = QUESTION_BANK[0];
//       const aiMsg: Message = { role: "assistant", content: fallback };
//       const final          = [...initial, aiMsg];
//       setMessages(final); setQCount(2);
//       setShowInitialThinking(false);
//       await speak(fallback);
//       if (!hardAbortRef.current) maybeStartListening();
//     } finally { setLoading(false); setIsBeginning(false); }
//   }, [attachCameraStreamToVisibleVideo, canBeginInterview, candidateName, clearListeningTimers, isBeginning, maybeStartListening, parseJson, setDone, setLoading, setQCount, speak, startPresenceDetection]);

//   const handleReturnHome = useCallback(() => { stopEverythingNow(); router.push("/"); }, [router, stopEverythingNow]);

//   const handleManualSend = useCallback(() => {
//     const text = inputText.trim();
//     if (!text || isLoadingRef.current || sendInProgressRef.current || interviewDoneRef.current || hardAbortRef.current) return;
//     doSend(text); setInputText("");
//   }, [doSend, inputText]);

//   // ── Render ─────────────────────────────────────────────────────────────────

//   const globalStyles = `
//     @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;1,9..40,400&display=swap');
//     *, *::before, *::after { font-family: 'DM Sans', system-ui, sans-serif; }
//     @keyframes spin    { to { transform: rotate(360deg); } }
//     @keyframes fadeIn  { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
//     @keyframes pulse   { 0%,100% { opacity:1; } 50% { opacity:0.4; } }
//     @keyframes blink   { 0%,100% { opacity:1; } 50% { opacity:0.3; } }
//     @keyframes bounce  { 0%,80%,100% { transform: translateY(0); } 40% { transform: translateY(-6px); } }
//     .msg-fade { animation: fadeIn 0.22s ease forwards; }
//     textarea:focus { outline: none; }
//     input:focus    { outline: none; }
//     ::-webkit-scrollbar       { width: 5px; }
//     ::-webkit-scrollbar-track { background: transparent; }
//     ::-webkit-scrollbar-thumb { background: ${T.border}; border-radius: 3px; }
//   `;

//   const cardStyle: React.CSSProperties = {
//     border: `1px solid ${T.border}`,
//     borderRadius: 16,
//     backgroundColor: T.surface,
//     boxShadow: T.shadow,
//   };

//   // ── Terminated ─────────────────────────────────────────────────────────────
//   if (terminated) {
//     const isMultiFace = terminationType === "multiple_faces";
//     return (
//       <>
//         <style dangerouslySetInnerHTML={{ __html: globalStyles }} />
//         <canvas ref={faceCanvasRef} style={{ display: "none" }} aria-hidden="true" />
//         <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 24, backgroundColor: T.bg, color: T.text }}>
//           <div style={{ ...cardStyle, width: "100%", maxWidth: 480, padding: "48px 40px", textAlign: "center" }}>
//             <div style={{ width: 72, height: 72, borderRadius: "50%", backgroundColor: T.roseBg, border: `1px solid ${T.roseBorder}`, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 24px" }}>
//               {isMultiFace ? <Users size={30} color={T.roseText} /> : <UserX size={30} color={T.roseText} />}
//             </div>
//             <h1 style={{ fontSize: 22, fontWeight: 700, letterSpacing: "-0.02em", marginBottom: 12, color: T.text }}>Interview Terminated</h1>
//             <p style={{ fontSize: 14, lineHeight: 1.7, color: T.textSub, marginBottom: 24 }}>{terminationReason}</p>
//             <div style={{ padding: "12px 16px", borderRadius: 10, border: `1px solid ${T.amberBorder}`, backgroundColor: T.amberBg, fontSize: 13, color: T.amberText, textAlign: "left", marginBottom: 28, display: "flex", alignItems: "flex-start", gap: 10 }}>
//               <AlertTriangle size={14} style={{ marginTop: 1, flexShrink: 0 }} />
//               <span>{isMultiFace ? "Only the registered candidate may be present and visible during the interview." : "Please remain fully visible in the camera frame throughout the interview."}</span>
//             </div>
//             <button onClick={handleReturnHome} style={{ width: "100%", height: 46, borderRadius: 10, border: "none", background: "linear-gradient(135deg,#7C3AED,#C026D3)", color: "#fff", fontSize: 14, fontWeight: 600, cursor: "pointer" }}>
//               Return to Home
//             </button>
//           </div>
//         </div>
//       </>
//     );
//   }

//   // ── Report generating overlay ───────────────────────────────────────────────
//   if (reportGenerating) {
//     return (
//       <>
//         <style dangerouslySetInnerHTML={{ __html: globalStyles }} />
//         <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: T.bg, color: T.text }}>
//           <div style={{ textAlign: "center" }}>
//             <div style={{ width: 64, height: 64, borderRadius: "50%", background: "linear-gradient(135deg,#7C3AED,#C026D3)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px", animation: "pulse 1.5s infinite" }}>
//               <BrainCircuit size={28} color="#fff" />
//             </div>
//             <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8, color: T.text }}>Generating your report…</h2>
//             <p style={{ fontSize: 14, color: T.textSub }}>Analysing interview responses. This takes a few seconds.</p>
//             {reportError && <p style={{ fontSize: 13, color: T.amberText, marginTop: 12 }}>{reportError}</p>}
//           </div>
//         </div>
//       </>
//     );
//   }

//   // ── Briefing ────────────────────────────────────────────────────────────────
//   if (screen === "briefing") {
//     return (
//       <>
//         <style dangerouslySetInnerHTML={{ __html: globalStyles }} />
//         <canvas ref={faceCanvasRef} style={{ display: "none" }} aria-hidden="true" />
//         <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", backgroundColor: T.bg, backgroundImage: `linear-gradient(${T.bgGrid} 1px, transparent 1px), linear-gradient(90deg, ${T.bgGrid} 1px, transparent 1px)`, backgroundSize: "56px 56px", color: T.text }}>

//           <header style={{ position: "sticky", top: 0, zIndex: 10, borderBottom: `1px solid ${T.border}`, backgroundColor: T.headerBg, backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)" }}>
//             <div style={{ maxWidth: 1300, margin: "0 auto", padding: "0 28px", height: 56, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
//               <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
//                 <div style={{ width: 32, height: 32, borderRadius: 9, background: "linear-gradient(135deg,#7C3AED,#C026D3)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: `0 6px 16px ${T.accentGlow}` }}>
//                   <BrainCircuit size={14} color="#fff" />
//                 </div>
//                 <span style={{ fontSize: 14, fontWeight: 600, letterSpacing: "-0.01em" }}>Cuemath · Tutor Screener</span>
//                 {isSpeaking && (
//                   <div style={{ display: "flex", alignItems: "center", gap: 5, padding: "3px 10px", borderRadius: 20, backgroundColor: T.accentBg, border: `1px solid ${T.accentGlow}` }}>
//                     {[0, 1, 2].map(i => (
//                       <div key={i} style={{ width: 3, height: 12, borderRadius: 2, backgroundColor: T.accentLight, animation: `blink 1s ease ${i * 0.15}s infinite` }} />
//                     ))}
//                     <span style={{ fontSize: 11, color: T.accentLight, fontWeight: 500 }}>Maya speaking</span>
//                   </div>
//                 )}
//               </div>
//               <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
//                 <span style={{ fontSize: 13, color: T.textMuted }}>{candidateName}</span>
//                 <button onClick={toggleTheme} style={{ width: 32, height: 32, borderRadius: 8, border: `1px solid ${T.border}`, backgroundColor: T.surface, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: T.textSub }}>
//                   {theme === "dark" ? <Sun size={14} /> : <Moon size={14} />}
//                 </button>
//               </div>
//             </div>
//           </header>

//           <main style={{ flex: 1, maxWidth: 1300, margin: "0 auto", width: "100%", padding: "32px 28px", display: "grid", gridTemplateColumns: "360px 1fr", gap: 24, alignItems: "start" }}>

//             {/* Left: Setup */}
//             <div style={{ ...cardStyle, padding: "24px" }}>
//               <div style={{ marginBottom: 20 }}>
//                 <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase" as const, color: T.accentLight, marginBottom: 6 }}>Before you begin</div>
//                 <div style={{ fontSize: 18, fontWeight: 700, letterSpacing: "-0.02em", marginBottom: 4 }}>Welcome, {candidateName}</div>
//                 <div style={{ fontSize: 13, color: T.textSub, lineHeight: 1.6 }}>Set up your camera and mic to get started.</div>
//               </div>

//               <div style={{ borderRadius: 12, overflow: "hidden", border: `1px solid ${T.border}`, aspectRatio: "16/9", backgroundColor: T.surfaceInset, marginBottom: 16 }}>
//                 {cameraState === "granted" ? (
//                   <video ref={briefingVideoRef} autoPlay muted playsInline style={{ width: "100%", height: "100%", objectFit: "cover" }} />
//                 ) : (
//                   <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 8 }}>
//                     <Camera size={24} color={T.accentLight} style={{ opacity: 0.5 }} />
//                     <span style={{ fontSize: 12, color: T.textMuted }}>Camera preview</span>
//                   </div>
//                 )}
//               </div>

//               <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 12 }}>
//                 {[
//                   { onClick: requestMicPermission,     icon: <Mic    size={14} />, label: micState === "requesting" ? "Requesting…" : micState === "granted" ? "Microphone enabled ✓" : micState === "denied" ? "Mic denied — check browser" : "Enable microphone",   active: micState === "granted",    disabled: false },
//                   { onClick: requestCameraPermission,  icon: <Camera size={14} />, label: cameraState === "requesting" ? "Requesting…" : cameraState === "granted" ? "Camera enabled ✓" : cameraState === "denied" ? "Camera denied — check browser" : "Enable camera", active: cameraState === "granted", disabled: false },
//                   { onClick: verifyMicrophoneWithMaya, icon: <Volume2 size={14} />, label: deviceCheckRunning ? "Testing mic…" : micVerified ? "Mic verified ✓" : "Test microphone with Maya", active: micVerified, disabled: micState !== "granted" || deviceCheckRunning },
//                 ].map((btn, i) => (
//                   <button key={i} onClick={btn.disabled ? undefined : btn.onClick} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", borderRadius: 10, border: `1px solid ${btn.active ? T.emeraldBorder : T.border}`, backgroundColor: btn.active ? T.emeraldBg : T.surfaceInset, color: btn.active ? T.emeraldText : btn.disabled ? T.textMuted : T.textSub, fontSize: 13, fontWeight: 500, cursor: btn.disabled ? "not-allowed" : "pointer", textAlign: "left" as const, transition: "all 0.15s", opacity: btn.disabled ? 0.55 : 1 }}>
//                     {btn.icon}{btn.label}
//                   </button>
//                 ))}
//               </div>

//               {deviceCheckTranscript && (
//                 <div style={{ padding: "8px 12px", borderRadius: 8, border: `1px solid ${T.border}`, backgroundColor: T.surfaceInset, fontSize: 12, color: T.textSub, marginBottom: 10 }}>
//                   Heard: <span style={{ fontWeight: 600 }}>{deviceCheckTranscript}</span>
//                 </div>
//               )}

//               {showMandatoryWarning && (
//                 <div style={{ padding: "8px 12px", borderRadius: 8, border: `1px solid ${T.roseBorder}`, backgroundColor: T.roseBg, fontSize: 12, color: T.roseText, marginBottom: 10 }}>
//                   Both microphone and camera are required to start.
//                 </div>
//               )}

//               <div style={{ display: "flex", gap: 16, marginBottom: 16 }}>
//                 <StatusDot ok={micState === "granted"}    label="Mic"       T={T} />
//                 <StatusDot ok={cameraState === "granted"} label="Camera"    T={T} />
//                 <StatusDot ok={supportsSpeech}            label="Voice API" T={T} />
//               </div>

//               <button
//                 onClick={beginInterview}
//                 disabled={!canBeginInterview || isBeginning}
//                 style={{ width: "100%", height: 44, borderRadius: 10, border: "none", background: !canBeginInterview || isBeginning ? (theme === "dark" ? "rgba(124,58,237,0.25)" : "rgba(109,40,217,0.2)") : "linear-gradient(135deg,#7C3AED,#C026D3)", color: !canBeginInterview || isBeginning ? T.textMuted : "#fff", fontSize: 14, fontWeight: 600, cursor: !canBeginInterview || isBeginning ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginBottom: 14, boxShadow: !canBeginInterview || isBeginning ? "none" : `0 8px 24px ${T.accentGlow}` }}
//               >
//                 {isBeginning ? (<><Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} /> Starting…</>) : (<>Begin Interview <ChevronRight size={14} /></>)}
//               </button>

//               <div style={{ padding: "12px 14px", borderRadius: 10, border: `1px solid ${T.border}`, backgroundColor: T.surfaceInset }}>
//                 <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.04em", textTransform: "uppercase" as const, color: T.textMuted, marginBottom: 8 }}>Interview rules</div>
//                 {[
//                   "Stay visible in camera throughout",
//                   "12 sec without face detection ends the interview",
//                   "Only you may be visible — no other people in frame",
//                   "Speak naturally in your own words",
//                 ].map(rule => (
//                   <div key={rule} style={{ display: "flex", alignItems: "flex-start", gap: 6, marginBottom: 5 }}>
//                     <span style={{ fontSize: 11, color: T.accentLight, marginTop: 1, flexShrink: 0 }}>•</span>
//                     <span style={{ fontSize: 12, color: T.textSub, lineHeight: 1.5 }}>{rule}</span>
//                   </div>
//                 ))}
//               </div>
//             </div>

//             {/* Right: Briefing steps */}
//             <div style={{ ...cardStyle, padding: "24px" }}>
//               <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
//                 <div>
//                   <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase" as const, color: T.accentLight, marginBottom: 6 }}>Interview briefing</div>
//                   <div style={{ fontSize: 20, fontWeight: 700, letterSpacing: "-0.02em" }}>What to expect</div>
//                 </div>
//                 <div style={{ padding: "4px 12px", borderRadius: 20, border: `1px solid ${T.border}`, backgroundColor: T.surfaceInset, fontSize: 12, color: T.textMuted, fontWeight: 500 }}>
//                   {briefingStep + 1} / {BRIEFING_STEPS.length}
//                 </div>
//               </div>

//               <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
//                 {BRIEFING_STEPS.map((step, idx) => {
//                   const Icon   = step.icon;
//                   const active = idx === briefingStep;
//                   return (
//                     <button key={step.title} onClick={() => setBriefingStep(idx)} style={{ display: "flex", alignItems: "flex-start", gap: 14, padding: "16px 18px", borderRadius: 12, border: `1px solid ${active ? T.accentGlow : T.border}`, backgroundColor: active ? T.accentBg : T.surfaceInset, textAlign: "left" as const, cursor: "pointer", transition: "all 0.15s", opacity: active ? 1 : 0.55 }}>
//                       <div style={{ width: 36, height: 36, borderRadius: 9, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, backgroundColor: active ? T.accentBg : T.surface, border: `1px solid ${active ? T.accentGlow : T.border}` }}>
//                         <Icon size={16} color={T.accentLight} />
//                       </div>
//                       <div>
//                         <div style={{ fontSize: 14, fontWeight: 600, letterSpacing: "-0.01em", marginBottom: 4, color: T.text }}>{step.title}</div>
//                         <div style={{ fontSize: 13, color: T.textSub, lineHeight: 1.6 }}>{step.desc}</div>
//                       </div>
//                     </button>
//                   );
//                 })}
//               </div>
//             </div>
//           </main>
//         </div>
//       </>
//     );
//   }

//   // ── Interview ───────────────────────────────────────────────────────────────
//   return (
//     <>
//       <style dangerouslySetInnerHTML={{ __html: globalStyles }} />
//       <canvas ref={faceCanvasRef} style={{ display: "none" }} aria-hidden="true" />

//       <div style={{ height: "100vh", display: "flex", flexDirection: "column", overflow: "hidden", backgroundColor: T.bg, backgroundImage: `linear-gradient(${T.bgGrid} 1px, transparent 1px), linear-gradient(90deg, ${T.bgGrid} 1px, transparent 1px)`, backgroundSize: "56px 56px", color: T.text }}>

//         <header style={{ flexShrink: 0, borderBottom: `1px solid ${T.border}`, backgroundColor: T.headerBg, backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)" }}>
//           <div style={{ maxWidth: 1300, margin: "0 auto", padding: "0 28px", height: 56, display: "flex", alignItems: "center", gap: 20 }}>
//             <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
//               <div style={{ width: 32, height: 32, borderRadius: 9, background: "linear-gradient(135deg,#7C3AED,#C026D3)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, animation: isSpeaking ? "pulse 1.5s infinite" : "none", boxShadow: isSpeaking ? `0 0 14px rgba(124,58,237,0.5)` : "none" }}>
//                 <span style={{ fontSize: 13, fontWeight: 700, color: "#fff" }}>M</span>
//               </div>
//               <div>
//                 <div style={{ fontSize: 13, fontWeight: 600, lineHeight: 1.2 }}>Maya · AI Interviewer</div>
//                 <div style={{ fontSize: 11, color: T.textMuted }}>Cuemath Tutor Screener</div>
//               </div>
//             </div>

//             <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 12, justifyContent: "center" }}>
//               <span style={{ fontSize: 12, color: T.textMuted, whiteSpace: "nowrap" as const }}>Q {displayCount}/{TOTAL_Q}</span>
//               <div style={{ width: 180, height: 4, borderRadius: 2, backgroundColor: T.progressBg, overflow: "hidden" }}>
//                 <div style={{ height: "100%", width: `${progress}%`, borderRadius: 2, background: "linear-gradient(90deg,#7C3AED,#C026D3)", transition: "width 0.5s ease" }} />
//               </div>
//               <div style={{ display: "flex", gap: 4 }}>
//                 {Array.from({ length: TOTAL_Q }).map((_, i) => (
//                   <div key={i} style={{ width: 6, height: 6, borderRadius: "50%", backgroundColor: i < displayCount ? T.accentLight : T.progressBg, transition: "background-color 0.3s" }} />
//                 ))}
//               </div>
//             </div>

//             <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
//               <div style={{ display: "flex", gap: 10 }}>
//                 <StatusDot ok={micState === "granted"}    label="Mic" T={T} />
//                 <StatusDot ok={cameraState === "granted"} label="Cam" T={T} />
//               </div>
//               <button onClick={toggleTheme} style={{ width: 32, height: 32, borderRadius: 8, border: `1px solid ${T.border}`, backgroundColor: T.surface, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: T.textSub }}>
//                 {theme === "dark" ? <Sun size={14} /> : <Moon size={14} />}
//               </button>
//             </div>
//           </div>
//         </header>

//         <div style={{ flex: 1, overflow: "hidden", display: "flex" }}>
//           <div style={{ maxWidth: 1300, margin: "0 auto", width: "100%", padding: "20px 28px", display: "grid", gridTemplateColumns: "260px 1fr", gap: 20, overflow: "hidden" }}>

//             <aside style={{ display: "flex", flexDirection: "column", gap: 14, overflow: "auto" }}>
//               <div style={{ ...cardStyle, overflow: "hidden" }}>
//                 <div style={{ aspectRatio: "4/3", backgroundColor: T.surfaceInset }}>
//                   {cameraState === "granted" ? (
//                     <video ref={interviewVideoRef} autoPlay muted playsInline style={{ width: "100%", height: "100%", objectFit: "cover" }} />
//                   ) : (
//                     <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
//                       <Camera size={20} color={T.accentLight} style={{ opacity: 0.4 }} />
//                     </div>
//                   )}
//                 </div>
//                 <div style={{ padding: "10px 14px", borderTop: `1px solid ${T.border}` }}>
//                   <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 6, color: T.text }}>{candidateName}</div>
//                   <div style={{ display: "flex", gap: 12 }}>
//                     <StatusDot ok={micState === "granted"} label="Mic"  T={T} />
//                     <StatusDot ok={inputMode === "voice"}  label={inputMode === "voice" ? "Voice" : "Text"} T={T} />
//                   </div>
//                 </div>
//               </div>

//               <div style={{ ...cardStyle, padding: "14px 16px" }}>
//                 <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
//                   <span style={{ fontSize: 12, fontWeight: 600, color: T.text }}>Progress</span>
//                   <span style={{ fontSize: 11, color: T.textMuted }}>{displayCount}/{TOTAL_Q}</span>
//                 </div>
//                 <div style={{ height: 4, borderRadius: 2, backgroundColor: T.progressBg, overflow: "hidden", marginBottom: 8 }}>
//                   <div style={{ height: "100%", width: `${progress}%`, borderRadius: 2, background: "linear-gradient(90deg,#7C3AED,#C026D3)", transition: "width 0.5s ease" }} />
//                 </div>
//                 <div style={{ display: "flex", gap: 4 }}>
//                   {Array.from({ length: TOTAL_Q }).map((_, i) => (
//                     <div key={i} style={{ flex: 1, height: 3, borderRadius: 2, backgroundColor: i < displayCount ? T.accentLight : T.progressBg, transition: "background-color 0.3s ease" }} />
//                   ))}
//                 </div>
//               </div>

//               {faceAbsenceCountdown !== null && (
//                 <div style={{ padding: "10px 12px", borderRadius: 10, border: `1px solid ${T.roseBorder}`, backgroundColor: T.roseBg, fontSize: 12, color: T.roseText, display: "flex", alignItems: "flex-start", gap: 8 }}>
//                   <AlertTriangle size={13} style={{ marginTop: 1, flexShrink: 0 }} />
//                   <span><strong>Warning:</strong> Stay in frame — {faceAbsenceCountdown}s</span>
//                 </div>
//               )}
//               {usingFallback && (
//                 <div style={{ padding: "8px 12px", borderRadius: 10, border: `1px solid ${T.border}`, backgroundColor: T.surfaceInset, fontSize: 11, color: T.textMuted, display: "flex", alignItems: "center", gap: 6 }}>
//                   <WifiOff size={11} /> Fallback mode active
//                 </div>
//               )}
//               {reportError && (
//                 <div style={{ padding: "8px 12px", borderRadius: 10, border: `1px solid ${T.amberBorder}`, backgroundColor: T.amberBg, fontSize: 12, color: T.amberText }}>
//                   {reportError}
//                 </div>
//               )}
//             </aside>

//             <div style={{ ...cardStyle, display: "flex", flexDirection: "column", overflow: "hidden", minWidth: 0 }}>
//               <div style={{ flexShrink: 0, padding: "12px 20px", borderBottom: `1px solid ${T.border}`, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
//                 <div>
//                   <span style={{ fontSize: 13, fontWeight: 600, color: T.text }}>Live Interview</span>
//                   <span style={{ fontSize: 12, color: T.textMuted, marginLeft: 10 }}>Answer naturally — Maya will guide you</span>
//                 </div>
//                 <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
//                   {supportsSpeech && micState === "granted" && (
//                     <button onClick={() => setInputModeSynced(inputMode === "voice" ? "typing" : "voice")} style={{ padding: "5px 12px", borderRadius: 7, border: `1px solid ${T.border}`, backgroundColor: T.surfaceInset, color: T.textSub, fontSize: 12, fontWeight: 500, cursor: "pointer" }}>
//                       {inputMode === "voice" ? "Switch to typing" : "Switch to voice"}
//                     </button>
//                   )}
//                   {inputMode === "voice" && micState === "granted" && (
//                     <button onClick={isListening ? stopListening : startListening} style={{ display: "flex", alignItems: "center", gap: 6, padding: "5px 14px", borderRadius: 7, border: "none", background: isListening ? T.rose : "linear-gradient(135deg,#7C3AED,#C026D3)", color: "#fff", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
//                       {isListening ? <><MicOff size={12} /> Stop</> : <><Mic size={12} /> Listen</>}
//                     </button>
//                   )}
//                 </div>
//               </div>

//               <div style={{ flex: 1, overflowY: "auto", padding: "20px 20px 8px" }}>
//                 <div style={{ maxWidth: 680, margin: "0 auto", display: "flex", flexDirection: "column", gap: 12 }}>
//                   {messages.map((message, idx) => {
//                     const isUser = message.role === "user";
//                     return (
//                       <div key={`${message.role}-${idx}`} className="msg-fade" style={{ display: "flex", justifyContent: isUser ? "flex-end" : "flex-start", alignItems: "flex-start", gap: 10 }}>
//                         {!isUser && (
//                           <div style={{ width: 28, height: 28, borderRadius: 8, background: "linear-gradient(135deg,#7C3AED,#C026D3)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 2 }}>
//                             <span style={{ fontSize: 11, fontWeight: 700, color: "#fff" }}>M</span>
//                           </div>
//                         )}
//                         <div style={{ maxWidth: "76%", padding: "10px 14px", borderRadius: isUser ? "14px 14px 4px 14px" : "14px 14px 14px 4px", background: isUser ? T.bubbleUser.bg : T.bubbleMaya.bg, border: isUser ? "none" : `1px solid ${T.bubbleMaya.border}`, color: isUser ? T.bubbleUser.text : T.bubbleMaya.text, fontSize: 13.5, lineHeight: 1.65 }}>
//                           {message.content}
//                         </div>
//                       </div>
//                     );
//                   })}

//                   {transcriptPreview && (
//                     <div className="msg-fade" style={{ display: "flex", justifyContent: "flex-end" }}>
//                       <div style={{ maxWidth: "76%", padding: "10px 14px", borderRadius: "14px 14px 4px 14px", background: T.bubbleUser.bg, color: T.bubbleUser.text, fontSize: 13.5, lineHeight: 1.65, opacity: 0.6 }}>
//                         {transcriptPreview}
//                       </div>
//                     </div>
//                   )}

//                   {(isLoading || showInitialThinking) && (
//                     <div className="msg-fade" style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
//                       <div style={{ width: 28, height: 28, borderRadius: 8, background: "linear-gradient(135deg,#7C3AED,#C026D3)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
//                         <span style={{ fontSize: 11, fontWeight: 700, color: "#fff" }}>M</span>
//                       </div>
//                       <div style={{ padding: "10px 16px", borderRadius: "14px 14px 14px 4px", border: `1px solid ${T.bubbleMaya.border}`, backgroundColor: T.bubbleMaya.bg, display: "flex", alignItems: "center", gap: 8 }}>
//                         {[0, 1, 2].map(i => (
//                           <div key={i} style={{ width: 6, height: 6, borderRadius: "50%", backgroundColor: T.accentLight, animation: `bounce 1.2s ease ${i * 0.2}s infinite` }} />
//                         ))}
//                       </div>
//                     </div>
//                   )}
//                   <div ref={chatEndRef} />
//                 </div>
//               </div>

//               <div style={{ flexShrink: 0, borderTop: `1px solid ${T.border}`, padding: "14px 20px" }}>
//                 {canUseTyping ? (
//                   <div style={{ maxWidth: 680, margin: "0 auto", display: "flex", gap: 10, alignItems: "flex-end" }}>
//                     <textarea
//                       value={inputText}
//                       onChange={(e) => setInputText(e.target.value)}
//                       rows={1}
//                       placeholder="Type your answer…"
//                       style={{ flex: 1, resize: "none", borderRadius: 10, border: `1px solid ${T.inputBorder}`, backgroundColor: T.inputBg, color: T.text, fontSize: 13.5, padding: "10px 14px", minHeight: 44, maxHeight: 100, overflowY: "auto" }}
//                       onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleManualSend(); } }}
//                       onFocus={(e) => { e.target.style.borderColor = T.accentLight; e.target.style.boxShadow = `0 0 0 3px ${T.accentGlow}`; }}
//                       onBlur={(e)  => { e.target.style.borderColor = T.inputBorder; e.target.style.boxShadow = "none"; }}
//                     />
//                     <button
//                       onClick={handleManualSend}
//                       disabled={!inputText.trim() || isLoading}
//                       style={{ width: 44, height: 44, borderRadius: 10, border: "none", background: !inputText.trim() || isLoading ? T.progressBg : "linear-gradient(135deg,#7C3AED,#C026D3)", color: !inputText.trim() || isLoading ? T.textMuted : "#fff", display: "flex", alignItems: "center", justifyContent: "center", cursor: !inputText.trim() || isLoading ? "not-allowed" : "pointer", flexShrink: 0 }}
//                     >
//                       <Send size={15} />
//                     </button>
//                   </div>
//                 ) : (
//                   <div style={{ maxWidth: 680, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
//                     <span style={{ fontSize: 12.5, color: T.textSub }}>
//                       Voice mode active — click <strong>Listen</strong> when ready to speak.
//                     </span>
//                     <div style={{ display: "flex", alignItems: "center", gap: 7, padding: "5px 12px", borderRadius: 20, border: `1px solid ${isSpeaking ? T.accentGlow : isListening ? T.emeraldBorder : T.border}`, backgroundColor: isSpeaking ? T.accentBg : isListening ? T.emeraldBg : T.surfaceInset, fontSize: 12, fontWeight: 500, color: isSpeaking ? T.accentLight : isListening ? T.emeraldText : T.textMuted }}>
//                       <div style={{ width: 6, height: 6, borderRadius: "50%", backgroundColor: isSpeaking ? T.accentLight : isListening ? T.emerald : T.textMuted, animation: (isSpeaking || isListening) ? "pulse 1.2s infinite" : "none" }} />
//                       {isSpeaking ? "Maya speaking" : isListening ? "Listening…" : "Waiting"}
//                     </div>
//                   </div>
//                 )}
//               </div>
//             </div>
//           </div>
//         </div>
//       </div>
//     </>
//   );
// }







// "use client";

// import { useCallback, useEffect, useRef, useState } from "react";
// import { useRouter } from "next/navigation";
// import {
//   Loader2,
//   Mic,
//   MicOff,
//   Send,
//   Volume2,
//   CheckCircle,
//   Clock,
//   MessageSquare,
//   BarChart2,
//   Camera,
//   Sun,
//   Moon,
//   ChevronRight,
//   AlertTriangle,
//   UserX,
//   WifiOff,
//   BrainCircuit,
//   Users,
// } from "lucide-react";

// // ─── Constants ────────────────────────────────────────────────────────────────

// const SILENCE_MS            = 7000;
// const EMPTY_RESPONSE_MS     = 10000;
// const TOTAL_Q               = 6;
// const EMPTY_RESPONSE_TOKEN  = "__EMPTY_RESPONSE__";

// // ── Presence detection constants (v3 — Motion-Primary, Skin-Agnostic) ─────────
// //
// // ARCHITECTURE CHANGE: Motion detection is now the PRIMARY signal.
// // A living person ALWAYS produces micro-motion (breathing, blinking, subtle
// // head movement). A static scene (ceiling, wall, empty room) produces near-zero
// // motion. This is completely skin-color-agnostic.
// //
// // Detection hierarchy:
// //   1. MOTION (primary)  — works for ALL skin tones, no color bias
// //   2. FaceDetector      — secondary confirmation when motion is ambiguous
// //   3. Skin detection    — tertiary safety net for perfectly-still people
// //
// // KEY BUGS FIXED vs v1/v2:
// //   BUG A: isSkinPixel YCbCr range (cr>=122) was too narrow for dark Indian
// //          skin — expanded to cr>=118, y>20, cb 72–135.
// //   BUG B: "unknown" frames reset consecutiveAbsentCountRef to 0, so a ceiling
// //          alternating absent/unknown never accumulated enough absence frames.
// //          Fix: "unknown" is now NEUTRAL — only "present" resets the counter.
// //   BUG C: edgeRatio > 0.60 returned "unknown" before skin ran — a ceiling with
// //          a door frame or shelf would never reach the skin check.
// //          Fix: high edges + no skin = "absent" (it's a room, not a face).
// //   BUG D: FaceDetector returning 0 faces fell through to permissive skin check
// //          even after the detector had proven reliable.
// //          Fix: trust confirmed detector; skin check is last resort only.

// const FACE_ABSENCE_TERMINATE_MS    = 12000; // 12s timer before termination
// const FACE_CHECK_INTERVAL_MS       = 500;   // check every 500ms
// const PRESENCE_WARMUP_FRAMES       = 10;    // ~5s warmup before checks start
// const CONSECUTIVE_ABSENT_THRESHOLD = 3;     // 3 absent frames (~1.5s) to start timer
// const PRESENCE_RECOVERY_FRAMES     = 2;     // 2 present frames to cancel timer
// const MULTIPLE_FACES_THRESHOLD     = 3;
// const UNKNOWN_STREAK_TO_ABSENT     = 6;     // 6 unknowns (~3s) → treat as absent
// const STATIC_FRAME_THRESHOLD       = 8;     // 8 static frames (~4s) → absent
// const SPEAK_GRACE_MS               = 3000;  // grace after Maya speaks

// const FALLBACK_SAMPLE_W = 320;
// const FALLBACK_SAMPLE_H = 240;

// const DARK_FRAME_LUMA_THRESHOLD = 15;

// // Motion thresholds — PRIMARY detection signal (skin-color-agnostic)
// // Measured as average per-pixel luma difference between consecutive frames
// const MOTION_PRESENT_THRESHOLD = 2.5; // avg luma diff → person present
// const MOTION_ABSENT_THRESHOLD  = 0.8; // avg luma diff → static scene
// // Between 0.8 and 2.5 = ambiguous → fall through to skin / face checks

// // Skin detection — EXPANDED YCbCr ranges for Indian/darker skin tones
// // Standard (light skin):  Y>80,  Cb 77–127, Cr 133–173
// // Dark Indian skin:        Y>20,  Cb 72–135, Cr 118–175
// // We use the union to cover all tones.
// const CENTER_SKIN_RATIO_MIN    = 0.012; // was 0.020
// const FULL_SKIN_RATIO_MIN      = 0.004; // was 0.008
// const FACE_ZONE_SKIN_RATIO_MIN = 0.015; // was 0.025
// const EDGE_RATIO_MIN           = 0.03;  // was 0.05 — dark skin has lower contrast
// const EDGE_RATIO_MAX           = 0.65;

// const MIN_FACE_WIDTH_RATIO  = 0.04;
// const MIN_FACE_HEIGHT_RATIO = 0.04;

// const THEME_STORAGE_KEY = "maya_theme";

// // ─── ASR corrections ──────────────────────────────────────────────────────────

// const ASR_CORRECTIONS: [RegExp, string][] = [
//   [/\bgen only\b/gi,                           "genuinely"],
//   [/\bgenu only\b/gi,                          "genuinely"],
//   [/\bgenuinely only\b/gi,                     "genuinely"],
//   [/\binteract to like\b/gi,                   "interactive, like a"],
//   [/\binteract to\b/gi,                        "interactive"],
//   [/\backnowledg(?:e|ing) (?:the )?feeling/gi, "acknowledge their feeling"],
//   [/\bfeel judge\b/gi,                         "feel judged"],
//   [/\bfeel judges\b/gi,                        "feel judged"],
//   [/\bor present\b/gi,                         "or pressured"],
//   [/\bmanage a step[s]?\b/gi,                  "manageable steps"],
//   [/\bmomentom\b/gi,                           "momentum"],
//   [/\bmomentem\b/gi,                           "momentum"],
//   [/\bcelebreat\b/gi,                          "celebrate"],
//   [/\bit'?s in about\b/gi,                     "it's not about"],
//   [/\bin about explaining\b/gi,                "not about explaining"],
//   [/\bthat is in about\b/gi,                   "that is not about"],
//   [/\b(\w{3,})\s+\1\b/gi,                     "$1"],
//   [/\s+na\b\.?/gi,                             ""],
//   [/\s+yaar\b\.?/gi,                           ""],
//   [/\s+hai\b\.?/gi,                            ""],
//   [/\s+na\?\s*/g,                              ". "],
//   [/\s+only na\b/gi,                           " only"],
//   [/\bcue math\b/gi,                           "Cuemath"],
//   [/\bcue maths\b/gi,                          "Cuemath"],
//   [/\bque math\b/gi,                           "Cuemath"],
//   [/\bque maths\b/gi,                          "Cuemath"],
//   [/\bq math\b/gi,                             "Cuemath"],
//   [/\bkew math\b/gi,                           "Cuemath"],
//   [/\bqueue math\b/gi,                         "Cuemath"],
//   [/\bcue mat\b/gi,                            "Cuemath"],
//   [/\bcu math\b/gi,                            "Cuemath"],
//   [/\bkyoomath\b/gi,                           "Cuemath"],
//   [/\bmath's\b/gi,                             "maths"],
//   [/\bi would of\b/gi,                         "I would have"],
//   [/\bcould of\b/gi,                           "could have"],
//   [/\bshould of\b/gi,                          "should have"],
//   [/\bwould of\b/gi,                           "would have"],
//   [/\btheir going\b/gi,                        "they're going"],
//   [/\btheir doing\b/gi,                        "they're doing"],
//   [/\byour welcome\b/gi,                       "you're welcome"],
//   [/\bits a\b/gi,                              "it's a"],
//   [/\bi am having\b/gi,                        "I have"],
//   [/\bI done\b/g,                              "I did"],
//   [/\bI am knowing\b/gi,                       "I know"],
//   [/\bI am understanding\b/gi,                 "I understand"],
//   [/\bI am thinking\b/gi,                      "I think"],
//   [/\s{2,}/g,                                  " "],
// ];

// function correctASRText(text: string): string {
//   let result = text;
//   for (const [pattern, replacement] of ASR_CORRECTIONS) {
//     result = result.replace(pattern, replacement);
//   }
//   return result.trim();
// }

// // ─── Types ────────────────────────────────────────────────────────────────────

// interface Message {
//   role: "user" | "assistant";
//   content: string;
// }

// interface DetectedFace {
//   boundingBox: DOMRectReadOnly;
// }

// interface BrowserFaceDetector {
//   detect: (image: CanvasImageSource) => Promise<DetectedFace[]>;
// }

// declare global {
//   interface Window {
//     SpeechRecognition?:       new () => BSR;
//     webkitSpeechRecognition?: new () => BSR;
//     FaceDetector?: new (options?: { fastMode?: boolean; maxDetectedFaces?: number }) => BrowserFaceDetector;
//   }
// }

// interface BSR {
//   continuous:     boolean;
//   interimResults: boolean;
//   lang:           string;
//   start:          () => void;
//   stop:           () => void;
//   onresult:     ((e: BSREvent) => void) | null;
//   onend:        (() => void) | null;
//   onerror:      ((e: BSRError) => void) | null;
//   onaudiostart: (() => void) | null;
// }

// interface BSREvent {
//   resultIndex: number;
//   results: { length: number; [i: number]: { isFinal: boolean; 0: { transcript: string } } };
// }

// interface BSRError { error?: string; }

// type PresenceState = "present" | "absent" | "unknown" | "multiple_faces";

// const QUESTION_BANK = [
//   "To kick things off, could you tell me a little about yourself and what drew you to tutoring?",
//   "Imagine you're explaining fractions to a 9-year-old who's been staring blankly — how would you approach that?",
//   "Picture a student who's been stuck on the same problem for 5 minutes and says they want to give up. What do you do in that moment?",
//   "How do you keep a child engaged and motivated when you can tell they're bored or distracted?",
//   "What does patience genuinely mean to you as a tutor — not just in theory, but day to day?",
//   "[name], thank you so much for your time today. We'll be in touch soon with next steps. Best of luck — I'm rooting for you!",
// ];

// const QUESTION_OPENERS = [
//   "", "Great, let's move to the next one.", "Good, here's the next scenario.",
//   "Thanks for that. Next question:", "Appreciated. One more:", "",
// ];

// function buildFallbackReply(
//   questionCount: number,
//   name: string,
//   userText: string,
//   retryCount: number
// ): { reply: string; shouldAdvance: boolean } {
//   const t             = userText.toLowerCase();
//   const questionIndex = Math.max(0, Math.min(questionCount - 1, QUESTION_BANK.length - 2));
//   const nextIdx       = Math.min(questionIndex + 1, QUESTION_BANK.length - 1);

//   const wantsToSkip =
//     t.includes("next question") || t.includes("move on") || t.includes("skip") ||
//     t.includes("next one") || (t.includes("next") && t.length <= 10);

//   if (wantsToSkip) {
//     if (nextIdx >= QUESTION_BANK.length - 1)
//       return { reply: QUESTION_BANK[QUESTION_BANK.length - 1].replace("[name]", name), shouldAdvance: true };
//     const opener = QUESTION_OPENERS[nextIdx] || "Of course, let's move on.";
//     return { reply: `${opener} ${QUESTION_BANK[nextIdx]}`, shouldAdvance: true };
//   }

//   const currentQuestion = QUESTION_BANK[questionIndex];
//   const isCasualOrGreeting =
//     t.includes("good morning") || t.includes("good afternoon") || t.includes("good evening") ||
//     t.includes("nice to meet") || t.includes("how are you") || t.includes("hello") ||
//     (t.includes("hi") && userText.split(" ").length <= 5);

//   if (retryCount === 0) {
//     const isNonAnswer =
//       t === "no" || t === "nothing" || t === "idk" || t.includes("don't know") ||
//       t.includes("not sure") || t.includes("no idea") || t === "(no verbal response given)";
//     if (isCasualOrGreeting) return { reply: `I'm doing wonderfully, thank you! ${currentQuestion}`, shouldAdvance: false };
//     if (isNonAnswer)         return { reply: `No worries at all — take all the time you need! ${currentQuestion}`, shouldAdvance: false };
//     return { reply: `I'd love to hear a little bit more from you on this. ${currentQuestion}`, shouldAdvance: false };
//   }

//   if (nextIdx >= QUESTION_BANK.length - 1)
//     return { reply: QUESTION_BANK[QUESTION_BANK.length - 1].replace("[name]", name), shouldAdvance: true };
//   return { reply: `Absolutely no pressure — let's move forward. ${QUESTION_BANK[nextIdx]}`, shouldAdvance: true };
// }

// // ─── Skin / edge detection helpers ───────────────────────────────────────────

// function rgbToYCrCb(r: number, g: number, b: number) {
//   const y  =  0.299 * r + 0.587 * g + 0.114 * b;
//   const cb = 128 - 0.168736 * r - 0.331264 * g + 0.5 * b;
//   const cr = 128 + 0.5 * r - 0.418688 * g - 0.081312 * b;
//   return { y, cb, cr };
// }

// /**
//  * isSkinPixel — v3
//  * EXPANDED YCbCr ranges to cover light → very dark Indian skin tones.
//  * Old range: cr >= 122 (missed dark skin where cr can be as low as 118)
//  * New range: cr >= 118, y > 20, cb 72–135
//  */
// function isSkinPixel(r: number, g: number, b: number): boolean {
//   // Reject overexposed (pure white) and underexposed (pure black)
//   if (r > 240 && g > 230 && b > 220) return false;
//   if (r < 10  && g < 10  && b < 10 ) return false;

//   const { y, cb, cr } = rgbToYCrCb(r, g, b);

//   // EXPANDED YCbCr — union of light-skin and dark-skin ranges
//   const ycbcrRule =
//     y  >  20 &&
//     cb >= 72  && cb <= 135 &&
//     cr >= 118 && cr <= 175;

//   if (!ycbcrRule) return false;

//   // RGB sanity: red channel must dominate (universal skin property)
//   const rgbRule =
//     r > 30 &&
//     g > 15 &&
//     b > 3  &&
//     r >= b &&
//     (r - b) > 5;

//   return rgbRule;
// }

// function sobelEdgeScore(gray: Uint8ClampedArray, w: number, h: number): number {
//   let strongEdges = 0;
//   const total = (w - 2) * (h - 2);
//   for (let y = 1; y < h - 1; y++) {
//     for (let x = 1; x < w - 1; x++) {
//       const i  = y * w + x;
//       const gx = -gray[i - w - 1] - 2 * gray[i - 1] - gray[i + w - 1]
//                +  gray[i - w + 1] + 2 * gray[i + 1] + gray[i + w + 1];
//       const gy = -gray[i - w - 1] - 2 * gray[i - w] - gray[i - w + 1]
//                +  gray[i + w - 1] + 2 * gray[i + w] + gray[i + w + 1];
//       if (Math.abs(gx) + Math.abs(gy) > 110) strongEdges++;
//     }
//   }
//   return total > 0 ? strongEdges / total : 0;
// }

// // ─── Briefing steps ───────────────────────────────────────────────────────────

// const BRIEFING_STEPS = [
//   { icon: MessageSquare, title: "Natural conversation",   desc: "I'll ask thoughtful tutor-screening questions. Speak naturally — the goal is to understand how you communicate with students." },
//   { icon: Clock,         title: "About 8–10 minutes",    desc: "The interview is short and focused. There are no trick questions — I'm here to understand how you think and explain." },
//   { icon: Mic,           title: "Voice-first interview", desc: "This interview is designed for speaking, since tutoring happens through live conversation. Microphone is required." },
//   { icon: BarChart2,     title: "Structured assessment", desc: "After the conversation, you'll get a detailed report across clarity, warmth, patience, simplification, and English fluency." },
//   { icon: CheckCircle,   title: "Be yourself",           desc: "There are no perfect answers. I'm looking for warmth, clarity, and genuine care for students — not rehearsed lines." },
// ];

// // ─── Design tokens ────────────────────────────────────────────────────────────

// function useThemeTokens(isDark: boolean) {
//   return isDark
//     ? {
//         bg: "#05080F", bgGrid: "rgba(255,255,255,0.018)",
//         surface: "#0A0F1C", surfaceAlt: "#0D1424", surfaceInset: "#070B17",
//         border: "rgba(255,255,255,0.07)", borderStrong: "rgba(255,255,255,0.1)",
//         text: "#FFFFFF", textSub: "rgba(255,255,255,0.62)", textMuted: "rgba(255,255,255,0.38)",
//         accent: "#7C3AED", accentGlow: "rgba(124,58,237,0.22)", accentLight: "#A78BFA", accentBg: "rgba(124,58,237,0.08)",
//         emerald: "#10B981", emeraldBg: "rgba(16,185,129,0.08)", emeraldBorder: "rgba(16,185,129,0.2)", emeraldText: "#34D399",
//         rose: "#F43F5E", roseBg: "rgba(244,63,94,0.08)", roseBorder: "rgba(244,63,94,0.2)", roseText: "#FB7185",
//         amber: "#F59E0B", amberBg: "rgba(245,158,11,0.08)", amberBorder: "rgba(245,158,11,0.2)", amberText: "#FCD34D",
//         inputBg: "#070B17", inputBorder: "rgba(255,255,255,0.09)", headerBg: "rgba(5,8,15,0.9)",
//         shadow: "0 0 0 1px rgba(255,255,255,0.05), 0 8px 32px rgba(0,0,0,0.5)",
//         bubbleMaya: { bg: "#0D1424", border: "rgba(255,255,255,0.08)", text: "rgba(255,255,255,0.88)" },
//         bubbleUser: { bg: "linear-gradient(135deg,#7C3AED,#C026D3)", text: "#fff" },
//         progressBg: "rgba(255,255,255,0.07)",
//       }
//     : {
//         bg: "#F4F6FA", bgGrid: "rgba(0,0,0,0.025)",
//         surface: "#FFFFFF", surfaceAlt: "#FAFBFF", surfaceInset: "#F7F9FD",
//         border: "rgba(0,0,0,0.07)", borderStrong: "rgba(0,0,0,0.1)",
//         text: "#0A0E1A", textSub: "rgba(10,14,26,0.62)", textMuted: "rgba(10,14,26,0.4)",
//         accent: "#6D28D9", accentGlow: "rgba(109,40,217,0.12)", accentLight: "#7C3AED", accentBg: "rgba(109,40,217,0.06)",
//         emerald: "#059669", emeraldBg: "rgba(5,150,105,0.06)", emeraldBorder: "rgba(5,150,105,0.18)", emeraldText: "#047857",
//         rose: "#E11D48", roseBg: "rgba(225,29,72,0.06)", roseBorder: "rgba(225,29,72,0.18)", roseText: "#BE123C",
//         amber: "#D97706", amberBg: "rgba(217,119,6,0.06)", amberBorder: "rgba(217,119,6,0.18)", amberText: "#92400E",
//         inputBg: "#FFFFFF", inputBorder: "rgba(0,0,0,0.1)", headerBg: "rgba(244,246,250,0.9)",
//         shadow: "0 0 0 1px rgba(0,0,0,0.06), 0 8px 32px rgba(0,0,0,0.07)",
//         bubbleMaya: { bg: "#FFFFFF", border: "rgba(0,0,0,0.08)", text: "rgba(10,14,26,0.85)" },
//         bubbleUser: { bg: "linear-gradient(135deg,#7C3AED,#C026D3)", text: "#fff" },
//         progressBg: "rgba(0,0,0,0.07)",
//       };
// }

// function StatusDot({ ok, label, T }: { ok: boolean; label: string; T: ReturnType<typeof useThemeTokens> }) {
//   return (
//     <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
//       <div style={{ width: 6, height: 6, borderRadius: "50%", backgroundColor: ok ? T.emerald : T.textMuted, boxShadow: ok ? `0 0 6px ${T.emerald}` : "none" }} />
//       <span style={{ fontSize: 11, color: T.textMuted, fontWeight: 500 }}>{label}</span>
//     </div>
//   );
// }

// // ─── Component ────────────────────────────────────────────────────────────────

// export default function InterviewPage() {
//   const router = useRouter();

//   const chatEndRef            = useRef<HTMLDivElement | null>(null);
//   const recognitionRef        = useRef<BSR | null>(null);
//   const silenceTimerRef       = useRef<ReturnType<typeof setTimeout> | null>(null);
//   const emptyResponseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
//   const sendMessageRef        = useRef<(t: string) => Promise<void>>(() => Promise.resolve());
//   const finalTranscriptRef    = useRef<string>("");
//   const interimTranscriptRef  = useRef<string>("");
//   const isListeningRef        = useRef(false);
//   const questionCountRef      = useRef(1);
//   const isLoadingRef          = useRef(false);
//   const interviewDoneRef      = useRef(false);
//   const micStateRef           = useRef<"idle" | "requesting" | "granted" | "denied">("idle");
//   const inputModeRef          = useRef<"voice" | "typing">("voice");
//   const supportsSpeechRef     = useRef(false);

//   const silenceAttemptRef = useRef<Record<number, number>>({});
//   const retryCountRef     = useRef<Record<number, number>>({});

//   const briefingVideoRef  = useRef<HTMLVideoElement | null>(null);
//   const interviewVideoRef = useRef<HTMLVideoElement | null>(null);
//   const cameraStreamRef   = useRef<MediaStream | null>(null);
//   const sendInProgressRef = useRef(false);
//   const utteranceSentRef  = useRef(false);
//   const sendEpochRef      = useRef(0);

//   // ── Presence detection refs ────────────────────────────────────────────────
//   const faceCheckIntervalRef       = useRef<ReturnType<typeof setInterval> | null>(null);
//   const faceCanvasRef              = useRef<HTMLCanvasElement | null>(null);
//   const faceAbsenceStartRef        = useRef<number | null>(null);
//   const faceTerminatedRef          = useRef(false);
//   const nativeFaceDetectorRef      = useRef<BrowserFaceDetector | null>(null);
//   // null = untested, true = working + has found faces, false = broken/unavailable
//   const nativeFaceDetectorOkRef    = useRef<boolean | null>(null);
//   const presenceCheckBusyRef       = useRef(false);
//   const consecutiveAbsentCountRef  = useRef(0);
//   const consecutivePresentCountRef = useRef(0);
//   const multipleFacesCountRef      = useRef(0);
//   const visibilityHandlerRef       = useRef<(() => void) | null>(null);
//   const prevFrameDataRef           = useRef<Uint8ClampedArray | null>(null);
//   const staticFrameCountRef        = useRef(0);
//   const unknownStreakRef           = useRef(0);

//   const hardAbortRef          = useRef(false);
//   const mountedRef            = useRef(true);
//   const deviceCheckRunningRef = useRef(false);
//   const screenRef             = useRef<"briefing" | "interview">("briefing");
//   const isSpeakingRef         = useRef(false);

//   const speakSafetyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
//   const speakSettledRef     = useRef<(() => void) | null>(null);
//   const speakEndedAtRef     = useRef<number>(0);

//   const [theme, setTheme] = useState<"dark" | "light">("dark");
//   const T = useThemeTokens(theme === "dark");

//   const [screen, setScreen]                             = useState<"briefing" | "interview">("briefing");
//   const [briefingStep, setBriefingStep]                 = useState(0);
//   const [mayaIntroPlayed, setMayaIntroPlayed]           = useState(false);
//   const [nameLoaded, setNameLoaded]                     = useState(false);
//   const [messages, setMessages]                         = useState<Message[]>([]);
//   const [candidateName, setCandidateName]               = useState("Candidate");
//   const [candidateEmail, setCandidateEmail]             = useState("");
//   const [inputText, setInputText]                       = useState("");
//   const [transcriptPreview, setTranscriptPreview]       = useState("");
//   const [isListening, setIsListening]                   = useState(false);
//   const [isSpeaking, setIsSpeaking]                     = useState(false);
//   const [isLoading, setIsLoading]                       = useState(false);
//   const [questionCount, setQuestionCount]               = useState(1);
//   const [usingFallback, setUsingFallback]               = useState(false);
//   const [reportError, setReportError]                   = useState("");
//   const [micState, setMicState]                         = useState<"idle" | "requesting" | "granted" | "denied">("idle");
//   const [supportsSpeech, setSupportsSpeech]             = useState(false);
//   const [inputMode, setInputMode]                       = useState<"voice" | "typing">("voice");
//   const [isBeginning, setIsBeginning]                   = useState(false);
//   const [cameraState, setCameraState]                   = useState<"idle" | "requesting" | "granted" | "denied">("idle");
//   const [micVerified, setMicVerified]                   = useState(false);
//   const [deviceCheckRunning, setDeviceCheckRunning]     = useState(false);
//   const [deviceCheckTranscript, setDeviceCheckTranscript] = useState("");
//   const [showMandatoryWarning, setShowMandatoryWarning] = useState(false);
//   const [faceAbsenceCountdown, setFaceAbsenceCountdown] = useState<number | null>(null);
//   const [terminated, setTerminated]                     = useState(false);
//   const [terminationReason, setTerminationReason]       = useState("");
//   const [terminationType, setTerminationType]           = useState<"absence" | "multiple_faces">("absence");
//   const [showInitialThinking, setShowInitialThinking]   = useState(false);
//   const [reportGenerating, setReportGenerating]         = useState(false);

//   const displayCount = Math.min(Math.max(questionCount - 1, 0), TOTAL_Q);
//   const progress     = Math.min((displayCount / TOTAL_Q) * 100, 100);

//   const isTypingFallback   = !supportsSpeech || micState === "denied";
//   const isManualTypingMode = supportsSpeech && micState === "granted" && inputMode === "typing";
//   const canUseTyping       = isTypingFallback || isManualTypingMode;

//   const setQCount          = useCallback((n: number) => { questionCountRef.current = n; setQuestionCount(n); }, []);
//   const setLoading         = useCallback((v: boolean) => { isLoadingRef.current = v; setIsLoading(v); }, []);
//   const setDone            = useCallback((v: boolean) => { interviewDoneRef.current = v; }, []);
//   const setMicStateSynced  = useCallback((v: "idle" | "requesting" | "granted" | "denied") => { micStateRef.current = v; setMicState(v); }, []);
//   const setInputModeSynced = useCallback((v: "voice" | "typing") => { inputModeRef.current = v; setInputMode(v); }, []);

//   useEffect(() => { mountedRef.current = true; return () => { mountedRef.current = false; deviceCheckRunningRef.current = false; }; }, []);
//   useEffect(() => { screenRef.current = screen; }, [screen]);

//   useEffect(() => {
//     const name  = sessionStorage.getItem("candidate_name")  || localStorage.getItem("candidate_name")  || "Candidate";
//     const email = sessionStorage.getItem("candidate_email") || localStorage.getItem("candidate_email") || "";
//     setCandidateName(name);
//     setCandidateEmail(email);
//     setNameLoaded(true);
//     const hasSpeech = typeof window !== "undefined" && (!!window.SpeechRecognition || !!window.webkitSpeechRecognition);
//     supportsSpeechRef.current = hasSpeech;
//     setSupportsSpeech(hasSpeech);
//     setInputModeSynced(hasSpeech ? "voice" : "typing");
//     const savedTheme = localStorage.getItem(THEME_STORAGE_KEY) as "dark" | "light" | null;
//     if (savedTheme) setTheme(savedTheme);
//     hardAbortRef.current = false;
//   }, [setInputModeSynced]);

//   useEffect(() => {
//     if (typeof window === "undefined") return;
//     if ("FaceDetector" in window && !nativeFaceDetectorRef.current) {
//       try {
//         nativeFaceDetectorRef.current = new (window.FaceDetector!)({ fastMode: false, maxDetectedFaces: 4 });
//         nativeFaceDetectorOkRef.current = null; // null = untested
//       } catch (err) {
//         console.warn("FaceDetector init failed:", err);
//         nativeFaceDetectorRef.current   = null;
//         nativeFaceDetectorOkRef.current = false;
//       }
//     } else if (!("FaceDetector" in window)) {
//       nativeFaceDetectorOkRef.current = false;
//     }
//   }, []);

//   void candidateEmail;

//   const toggleTheme = useCallback(() => {
//     setTheme((t) => { const next = t === "dark" ? "light" : "dark"; localStorage.setItem(THEME_STORAGE_KEY, next); return next; });
//   }, []);

//   const parseJson = useCallback(async (res: Response) => {
//     const raw = await res.text();
//     try { return JSON.parse(raw) as Record<string, unknown>; }
//     catch { throw new Error(`Bad response: ${raw.slice(0, 100)}`); }
//   }, []);

//   const clearListeningTimers = useCallback(() => {
//     if (silenceTimerRef.current)       { clearTimeout(silenceTimerRef.current);       silenceTimerRef.current       = null; }
//     if (emptyResponseTimerRef.current) { clearTimeout(emptyResponseTimerRef.current); emptyResponseTimerRef.current = null; }
//   }, []);

//   const stopCameraPreview = useCallback(() => {
//     if (cameraStreamRef.current) { cameraStreamRef.current.getTracks().forEach((t) => t.stop()); cameraStreamRef.current = null; }
//     if (briefingVideoRef.current)  { briefingVideoRef.current.srcObject  = null; }
//     if (interviewVideoRef.current) { interviewVideoRef.current.srcObject = null; }
//   }, []);

//   const attachCameraStreamToVisibleVideo = useCallback(async (retryOnNull = true) => {
//     const stream = cameraStreamRef.current;
//     if (!stream) return;
//     const currentScreen = screenRef.current;
//     const inactiveVideo = currentScreen === "briefing" ? interviewVideoRef.current : briefingVideoRef.current;
//     if (inactiveVideo && inactiveVideo.srcObject === stream) { inactiveVideo.srcObject = null; }
//     const targetVideo = currentScreen === "briefing" ? briefingVideoRef.current : interviewVideoRef.current;
//     if (!targetVideo) { if (retryOnNull) setTimeout(() => void attachCameraStreamToVisibleVideo(false), 300); return; }
//     if (targetVideo.srcObject === stream) { if (targetVideo.paused) { try { await targetVideo.play(); } catch { /* ignore */ } } return; }
//     try { targetVideo.pause(); } catch { /* ignore */ }
//     targetVideo.srcObject = stream;
//     await new Promise(r => setTimeout(r, 50));
//     try { await targetVideo.play(); }
//     catch (error) { if ((error as Error)?.name !== "AbortError") console.error("camera_preview_play_failed:", error); }
//   }, []);

//   useEffect(() => { void attachCameraStreamToVisibleVideo(); }, [screen, cameraState, attachCameraStreamToVisibleVideo]);

//   const speak = useCallback((text: string): Promise<void> => {
//     return new Promise((resolve) => {
//       if (typeof window === "undefined" || !window.speechSynthesis) { resolve(); return; }
//       if (hardAbortRef.current) { resolve(); return; }

//       const synth = window.speechSynthesis;

//       if (speakSafetyTimerRef.current) { clearTimeout(speakSafetyTimerRef.current); speakSafetyTimerRef.current = null; }
//       if (speakSettledRef.current) { speakSettledRef.current(); speakSettledRef.current = null; }

//       synth.cancel();

//       const utterance  = new SpeechSynthesisUtterance(text);
//       utterance.rate   = 0.8;
//       utterance.pitch  = 1.4;
//       utterance.volume = 1;
//       utterance.lang   = "en-US";

//       let settled = false;
//       const settle = () => {
//         if (settled) return;
//         settled = true;
//         speakSettledRef.current = null;
//         if (speakSafetyTimerRef.current) { clearTimeout(speakSafetyTimerRef.current); speakSafetyTimerRef.current = null; }
//         if (mountedRef.current) {
//           setIsSpeaking(false);
//           isSpeakingRef.current = false;
//           speakEndedAtRef.current = Date.now();
//         }
//         resolve();
//       };

//       speakSettledRef.current = settle;

//       const pickVoice = () => {
//         const voices = synth.getVoices();
//         const chosen =
//           voices.find((v) => v.name === "Microsoft Jenny Online (Natural) - English (United States)") ||
//           voices.find((v) => v.name === "Microsoft Aria Online (Natural) - English (United States)")  ||
//           voices.find((v) => v.name === "Microsoft Zira - English (United States)")                   ||
//           voices.find((v) => /jenny|aria|zira|samantha/i.test(v.name))                                ||
//           voices.find((v) => /google uk english female/i.test(v.name))                                ||
//           voices.find((v) => /female|woman/i.test(v.name))                                            ||
//           voices.find((v) => /^en(-|_)/i.test(v.lang)) || null;
//         if (chosen) utterance.voice = chosen;
//       };

//       if (synth.getVoices().length > 0) pickVoice();
//       else synth.onvoiceschanged = () => pickVoice();

//       const safetyTimer = setTimeout(settle, Math.min(text.length * 85 + 3500, 20000));
//       speakSafetyTimerRef.current = safetyTimer;

//       utterance.onstart = () => {
//         if (hardAbortRef.current) { synth.cancel(); settle(); return; }
//         if (mountedRef.current) { setIsSpeaking(true); isSpeakingRef.current = true; }
//       };
//       utterance.onend   = settle;
//       utterance.onerror = settle;

//       try { synth.speak(utterance); } catch { settle(); }
//     });
//   }, []);

//   useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, transcriptPreview, isLoading, showInitialThinking]);

//   useEffect(() => {
//     if (screen !== "briefing" || mayaIntroPlayed || !nameLoaded || candidateName === "Candidate") return;
//     const intro = `Hi ${candidateName}! I'm Maya, your AI interviewer from Cuemath. Please enable both your microphone and camera before starting — both are required for this interview.`;
//     const t = setTimeout(() => { hardAbortRef.current = false; void speak(intro); setMayaIntroPlayed(true); }, 800);
//     return () => clearTimeout(t);
//   }, [screen, mayaIntroPlayed, nameLoaded, candidateName, speak]);

//   const requestMicPermission = useCallback(async () => {
//     setMicStateSynced("requesting");
//     try {
//       const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
//       stream.getTracks().forEach((t) => t.stop());
//       setMicStateSynced("granted"); setInputModeSynced("voice");
//     } catch { setMicStateSynced("denied"); setInputModeSynced("typing"); setMicVerified(false); }
//   }, [setMicStateSynced, setInputModeSynced]);

//   const requestCameraPermission = useCallback(async () => {
//     if (cameraStreamRef.current) { cameraStreamRef.current.getTracks().forEach((t) => t.stop()); cameraStreamRef.current = null; }
//     setCameraState("requesting");
//     try {
//       const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user", width: { ideal: 640 }, height: { ideal: 360 } }, audio: false });
//       cameraStreamRef.current = stream;
//       setCameraState("granted");
//       const targetVideo = screenRef.current === "briefing" ? briefingVideoRef.current : interviewVideoRef.current;
//       if (targetVideo) { targetVideo.srcObject = stream; await new Promise(r => setTimeout(r, 50)); try { await targetVideo.play(); } catch { /* ignore */ } }
//     } catch (error) { console.error("camera_permission_failed:", error); setCameraState("denied"); }
//   }, []);

//   const verifyMicrophoneWithMaya = useCallback(async () => {
//     if (hardAbortRef.current || deviceCheckRunningRef.current) return;
//     if (typeof window === "undefined" || micStateRef.current !== "granted") return;
//     const SpeechAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
//     if (!SpeechAPI) { await speak("Your browser does not support voice mode. You can continue using typing."); return; }
//     deviceCheckRunningRef.current = true; setDeviceCheckRunning(true); setDeviceCheckTranscript(""); setMicVerified(false);
//     await speak("Let's quickly test your microphone. Please say: Maya, can you hear me clearly?");
//     if (hardAbortRef.current) { deviceCheckRunningRef.current = false; if (mountedRef.current) setDeviceCheckRunning(false); return; }
//     const rec = new SpeechAPI();
//     rec.continuous = false; rec.interimResults = true; rec.lang = "en-IN";
//     let transcript = ""; let settled = false;
//     const settle = async (ok: boolean, heardText: string) => {
//       if (settled) return; settled = true;
//       try { rec.stop?.(); } catch {}
//       deviceCheckRunningRef.current = false;
//       if (!mountedRef.current) return;
//       setDeviceCheckRunning(false); setDeviceCheckTranscript(heardText);
//       if (hardAbortRef.current) return;
//       if (ok) { setMicVerified(true); await speak("Yes, I can hear you clearly. Your microphone is good to go."); }
//       else     { setMicVerified(false); await speak("I'm not hearing you clearly. Please check your microphone and try again."); }
//     };
//     const timeout = setTimeout(() => void settle(transcript.trim().length >= 6, transcript.trim()), 6000);
//     rec.onresult = (e: BSREvent) => {
//       let finalText = ""; let interim = "";
//       for (let i = e.resultIndex; i < e.results.length; i++) {
//         if (e.results[i].isFinal) finalText += e.results[i][0].transcript + " ";
//         else interim += e.results[i][0].transcript;
//       }
//       transcript = (finalText || interim).trim();
//       if (mountedRef.current) setDeviceCheckTranscript(transcript);
//     };
//     rec.onerror = () => { clearTimeout(timeout); void settle(false, transcript.trim()); };
//     rec.onend   = () => { clearTimeout(timeout); void settle(transcript.trim().length >= 6, transcript.trim()); };
//     try { rec.start(); }
//     catch { clearTimeout(timeout); deviceCheckRunningRef.current = false; if (mountedRef.current) setDeviceCheckRunning(false); }
//   }, [speak]);

//   const doSend = useCallback((text: string) => {
//     if (hardAbortRef.current || sendInProgressRef.current) return;
//     if (isLoadingRef.current || interviewDoneRef.current) return;
//     sendInProgressRef.current = true;
//     void sendMessageRef.current(text).finally(() => { sendInProgressRef.current = false; });
//   }, []);

//   const startListening = useCallback(() => {
//     if (hardAbortRef.current) return;
//     if (typeof window === "undefined" || micStateRef.current !== "granted") return;
//     if (isListeningRef.current) { recognitionRef.current?.stop(); isListeningRef.current = false; setIsListening(false); }
//     const SpeechAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
//     if (!SpeechAPI) return;
//     finalTranscriptRef.current   = "";
//     interimTranscriptRef.current = "";
//     setTranscriptPreview(""); clearListeningTimers();
//     sendInProgressRef.current = false;
//     utteranceSentRef.current  = false;
//     const myEpoch = ++sendEpochRef.current;

//     const qAtStart = questionCountRef.current;
//     if (silenceAttemptRef.current[qAtStart] === undefined) silenceAttemptRef.current[qAtStart] = 0;

//     const rec = new SpeechAPI();
//     rec.continuous     = true;
//     rec.interimResults = true;
//     rec.lang = navigator.language?.startsWith("en-IN") ? "en-IN" : "en-US";

//     emptyResponseTimerRef.current = setTimeout(() => {
//       if (hardAbortRef.current) return;
//       if (myEpoch !== sendEpochRef.current) return;
//       if (isListeningRef.current) { rec.stop(); isListeningRef.current = false; setIsListening(false); setTranscriptPreview(""); }
//       if (!utteranceSentRef.current && !sendInProgressRef.current && !isLoadingRef.current && !interviewDoneRef.current) {
//         const liveQ = questionCountRef.current;
//         silenceAttemptRef.current[liveQ] = (silenceAttemptRef.current[liveQ] ?? 0) + 1;
//         utteranceSentRef.current = true;
//         doSend(EMPTY_RESPONSE_TOKEN);
//       }
//     }, EMPTY_RESPONSE_MS);

//     rec.onresult = (e: BSREvent) => {
//       if (hardAbortRef.current) return;
//       if (myEpoch !== sendEpochRef.current) return;
//       let newFinal = ""; let interim = "";
//       for (let i = e.resultIndex; i < e.results.length; i++) {
//         if (e.results[i].isFinal) newFinal += e.results[i][0].transcript + " ";
//         else interim += e.results[i][0].transcript;
//       }
//       if (newFinal.trim()) finalTranscriptRef.current = (finalTranscriptRef.current + " " + newFinal).trim();
//       interimTranscriptRef.current = interim.trim();
//       const raw     = (finalTranscriptRef.current + " " + interim).trim();
//       const display = correctASRText(raw);
//       if (display) {
//         setTranscriptPreview(display);
//         if (emptyResponseTimerRef.current) { clearTimeout(emptyResponseTimerRef.current); emptyResponseTimerRef.current = null; }
//       }
//       const liveQ = questionCountRef.current;
//       silenceAttemptRef.current[liveQ] = 0;
//       if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
//       const toSubmit = (finalTranscriptRef.current + " " + interim).trim();
//       if (toSubmit) {
//         silenceTimerRef.current = setTimeout(() => {
//           if (hardAbortRef.current || !isListeningRef.current) return;
//           if (myEpoch !== sendEpochRef.current) return;
//           rec.stop(); isListeningRef.current = false; setIsListening(false);
//           const corrected = correctASRText(toSubmit);
//           if (!utteranceSentRef.current && !sendInProgressRef.current && !isLoadingRef.current && !interviewDoneRef.current) {
//             utteranceSentRef.current = true;
//             doSend(corrected);
//           }
//         }, SILENCE_MS);
//       }
//     };

//     rec.onerror = (e: BSRError) => {
//       isListeningRef.current = false; setIsListening(false); clearListeningTimers(); recognitionRef.current = null;
//       if (e?.error === "aborted") return;
//       if (e?.error === "not-allowed") { setMicStateSynced("denied"); setInputModeSynced("typing"); return; }
//       if (hardAbortRef.current || isLoadingRef.current || interviewDoneRef.current) return;
//       if (myEpoch !== sendEpochRef.current) return;
//       const combined = (finalTranscriptRef.current + " " + interimTranscriptRef.current).trim();
//       const partial  = correctASRText(combined);
//       if (partial && !utteranceSentRef.current && !sendInProgressRef.current) { utteranceSentRef.current = true; doSend(partial); }
//       else if (!utteranceSentRef.current && !sendInProgressRef.current) {
//         setTimeout(() => {
//           if (hardAbortRef.current || isLoadingRef.current || interviewDoneRef.current || sendInProgressRef.current || utteranceSentRef.current) return;
//           utteranceSentRef.current = true;
//           doSend(EMPTY_RESPONSE_TOKEN);
//         }, 1500);
//       }
//     };

//     rec.onend = () => {
//       isListeningRef.current = false; setIsListening(false); clearListeningTimers(); recognitionRef.current = null;
//       if (hardAbortRef.current || isLoadingRef.current || interviewDoneRef.current) return;
//       if (myEpoch !== sendEpochRef.current) return;
//       const combined = (finalTranscriptRef.current + " " + interimTranscriptRef.current).trim();
//       const partial  = correctASRText(combined);
//       if (partial && !utteranceSentRef.current && !sendInProgressRef.current) { utteranceSentRef.current = true; doSend(partial); }
//     };

//     recognitionRef.current = rec; rec.start(); isListeningRef.current = true; setIsListening(true);
//   }, [clearListeningTimers, doSend, setInputModeSynced, setMicStateSynced]);

//   const stopListening = useCallback(() => {
//     clearListeningTimers();
//     if (recognitionRef.current && isListeningRef.current) recognitionRef.current.stop();
//     isListeningRef.current = false; setIsListening(false);
//     if (hardAbortRef.current || isLoadingRef.current || sendInProgressRef.current) return;
//     const combined = (finalTranscriptRef.current + " " + interimTranscriptRef.current).trim();
//     const captured = correctASRText(combined);
//     if (!captured) return;
//     setTimeout(() => {
//       if (hardAbortRef.current || sendInProgressRef.current || isLoadingRef.current || interviewDoneRef.current || utteranceSentRef.current) return;
//       utteranceSentRef.current = true;
//       doSend(captured);
//     }, 300);
//   }, [clearListeningTimers, doSend]);

//   const maybeStartListening = useCallback(() => {
//     if (hardAbortRef.current) return;
//     if (supportsSpeechRef.current && micStateRef.current === "granted" && inputModeRef.current === "voice") {
//       setTimeout(() => startListening(), 700);
//     }
//   }, [startListening]);

//   const generateReport = useCallback(async (finalMessages: Message[]) => {
//     if (hardAbortRef.current) return;
//     setReportGenerating(true);

//     const transcript = finalMessages.map((m) => `${m.role === "user" ? "Candidate" : "Maya"}: ${m.content}`).join("\n\n");
//     const name = candidateName;

//     const saveToStorage = (data: string, key: string) => {
//       try { sessionStorage.setItem(key, data); } catch { /* ignore */ }
//       try { localStorage.setItem(key, data); } catch { /* ignore */ }
//     };

//     saveToStorage(transcript, "interview_transcript");
//     saveToStorage(JSON.stringify(finalMessages), "interview_messages");
//     saveToStorage(Date.now().toString(), "interview_completed_at");
//     saveToStorage(name, "report_candidate_name");

//     const tryAssess = async () => {
//       if (hardAbortRef.current) return;
//       const res  = await fetch("/api/assess", {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({ transcript, candidateName: name }),
//       });
//       if (!res.ok) throw new Error(`assess_failed_${res.status}`);
//       const data = await parseJson(res);

//       const assessJson = JSON.stringify(data);
//       saveToStorage(assessJson, "assessment_result");
//       saveToStorage(assessJson, "assessment_result_backup");

//       if (!hardAbortRef.current) {
//         setReportGenerating(false);
//         router.push("/report");
//       }
//     };

//     try {
//       await tryAssess();
//     } catch (err) {
//       console.error("generateReport first attempt failed:", err);
//       if (hardAbortRef.current) return;
//       setReportError("Generating report… please wait.");
//       setTimeout(async () => {
//         try {
//           await tryAssess();
//         } catch (err2) {
//           console.error("generateReport retry failed:", err2);
//           if (!hardAbortRef.current) {
//             setReportGenerating(false);
//             setReportError("Report generation failed. Redirecting anyway…");
//             setTimeout(() => { if (!hardAbortRef.current) router.push("/report"); }, 2000);
//           }
//         }
//       }, 3000);
//     }
//   }, [candidateName, parseJson, router]);

//   // ─── Presence detection ────────────────────────────────────────────────────

//   const stopPresenceDetection = useCallback(() => {
//     if (faceCheckIntervalRef.current) { clearInterval(faceCheckIntervalRef.current); faceCheckIntervalRef.current = null; }
//     if (visibilityHandlerRef.current) { document.removeEventListener("visibilitychange", visibilityHandlerRef.current); visibilityHandlerRef.current = null; }
//     faceAbsenceStartRef.current        = null;
//     consecutiveAbsentCountRef.current  = 0;
//     consecutivePresentCountRef.current = 0;
//     multipleFacesCountRef.current      = 0;
//     unknownStreakRef.current           = 0;
//     staticFrameCountRef.current        = 0;
//     prevFrameDataRef.current           = null;
//     setFaceAbsenceCountdown(null);
//   }, []);

//   /**
//    * checkPresence — v3 (Motion-Primary, Skin-Agnostic)
//    *
//    * Detection hierarchy:
//    *   1. Motion (primary)   — high motion = present; near-zero = absent
//    *   2. FaceDetector       — secondary confirmation for ambiguous motion
//    *   3. Skin detection     — tertiary, for perfectly-still people
//    *
//    * This approach is completely skin-color-agnostic at the primary level,
//    * solving false-positive terminations for dark-skinned users.
//    */
//   const checkPresence = useCallback(async (): Promise<PresenceState> => {
//     const video = interviewVideoRef.current;
//     if (!video || video.readyState < 2 || video.videoWidth === 0 || video.videoHeight === 0) {
//       return "unknown";
//     }
//     if (presenceCheckBusyRef.current) return "unknown";
//     presenceCheckBusyRef.current = true;

//     try {
//       // ── Step 0: Grab canvas frame ─────────────────────────────────────────
//       const canvas = faceCanvasRef.current;
//       const ctx    = canvas?.getContext("2d", { willReadFrequently: true });
//       if (!canvas || !ctx) return "unknown";

//       canvas.width  = FALLBACK_SAMPLE_W;
//       canvas.height = FALLBACK_SAMPLE_H;
//       ctx.drawImage(video, 0, 0, FALLBACK_SAMPLE_W, FALLBACK_SAMPLE_H);
//       const framePixels = ctx.getImageData(0, 0, FALLBACK_SAMPLE_W, FALLBACK_SAMPLE_H);
//       const data = framePixels.data;

//       // ── Step 1: Dark frame check ──────────────────────────────────────────
//       // If the room is too dark we can't make any determination.
//       let lumaSum = 0;
//       let sampleCount = 0;
//       for (let i = 0; i < data.length; i += 4 * 8) {
//         lumaSum += 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
//         sampleCount++;
//       }
//       const meanLuma = sampleCount > 0 ? lumaSum / sampleCount : 0;
//       if (meanLuma < DARK_FRAME_LUMA_THRESHOLD) {
//         staticFrameCountRef.current = 0;
//         prevFrameDataRef.current    = null; // reset motion baseline in dark
//         return "unknown";
//       }

//       // ── Step 2: MOTION DETECTION (PRIMARY — skin-color-agnostic) ─────────
//       // Key insight: a living person ALWAYS produces micro-motion (breathing,
//       // blinking, subtle head movement). A wall/ceiling is truly static.
//       // This is completely independent of skin color or tone.
//       const prevData = prevFrameDataRef.current;

//       if (prevData && prevData.length === data.length) {
//         let motionSum = 0;
//         let motionPx  = 0;
//         const step = 6; // sample every 6th pixel for performance
//         for (let pi = 0; pi < data.length; pi += 4 * step) {
//           // Measure luma change (perceptually weighted)
//           const currLuma = 0.299 * data[pi] + 0.587 * data[pi + 1] + 0.114 * data[pi + 2];
//           const prevLuma = 0.299 * prevData[pi] + 0.587 * prevData[pi + 1] + 0.114 * prevData[pi + 2];
//           motionSum += Math.abs(currLuma - prevLuma);
//           motionPx++;
//         }
//         const motionScore = motionPx > 0 ? motionSum / motionPx : 0;

//         prevFrameDataRef.current = new Uint8ClampedArray(data);

//         if (motionScore >= MOTION_PRESENT_THRESHOLD) {
//           // Clear motion detected → person definitely present
//           staticFrameCountRef.current = 0;
//           return "present";
//         }

//         if (motionScore < MOTION_ABSENT_THRESHOLD) {
//           // Near-zero motion → static scene (wall, ceiling, empty room)
//           staticFrameCountRef.current++;

//           if (staticFrameCountRef.current >= STATIC_FRAME_THRESHOLD) {
//             // Sustained static scene → absent
//             return "absent";
//           }
//           // Not enough static frames yet — fall through to skin/face checks.
//           // (Person may be sitting perfectly still for a moment.)
//         } else {
//           // Ambiguous motion (MOTION_ABSENT_THRESHOLD – MOTION_PRESENT_THRESHOLD)
//           // Not conclusive either way — fall through to secondary checks.
//           staticFrameCountRef.current = Math.max(0, staticFrameCountRef.current - 1);
//         }
//       } else {
//         // First frame — initialize baseline, return unknown
//         prevFrameDataRef.current = new Uint8ClampedArray(data);
//         return "unknown";
//       }

//       // ── Step 3: Native FaceDetector (SECONDARY — bonus confirmation) ──────
//       // Only used when motion is ambiguous. Once it has confirmed a face,
//       // we trust it for absence detection too (prevents false skin-fallback).
//       if (nativeFaceDetectorRef.current && nativeFaceDetectorOkRef.current !== false) {
//         try {
//           const vw    = video.videoWidth;
//           const vh    = video.videoHeight;
//           const faces = await nativeFaceDetectorRef.current.detect(video);

//           if (faces.length > 0) {
//             const validFaces = faces.filter((face) => {
//               const box = face.boundingBox;
//               const cx  = box.x + box.width  / 2;
//               const cy  = box.y + box.height / 2;
//               return (
//                 cx > vw * 0.03 && cx < vw * 0.97 &&
//                 cy > vh * 0.03 && cy < vh * 0.97 &&
//                 box.width  >= vw * MIN_FACE_WIDTH_RATIO &&
//                 box.height >= vh * MIN_FACE_HEIGHT_RATIO
//               );
//             });

//             if (validFaces.length > 1) {
//               nativeFaceDetectorOkRef.current = true;
//               staticFrameCountRef.current     = 0;
//               return "multiple_faces";
//             }
//             if (validFaces.length === 1) {
//               nativeFaceDetectorOkRef.current = true;
//               staticFrameCountRef.current     = 0;
//               return "present";
//             }
//             // validFaces.length === 0 (filtered out) — fall through
//           }

//           // FaceDetector returned 0 valid faces.
//           // Only trust this as "absent" if detector has proven reliable before
//           // AND static frame count also agrees.
//           if (nativeFaceDetectorOkRef.current === true) {
//             if (staticFrameCountRef.current >= Math.floor(STATIC_FRAME_THRESHOLD / 2)) {
//               return "absent";
//             }
//             // Otherwise fall through to skin check for final vote
//           }
//           // Detector not yet confirmed (null) — fall through to skin check
//         } catch (err) {
//           console.warn("FaceDetector.detect() failed, disabling:", err);
//           nativeFaceDetectorOkRef.current = false;
//         }
//       }

//       // ── Step 4: Skin detection (TERTIARY — still-person safety net) ───────
//       // Handles: person sitting perfectly still, FaceDetector unavailable.
//       // Now uses EXPANDED YCbCr ranges for Indian/darker skin tones.
//       const gray = new Uint8ClampedArray(FALLBACK_SAMPLE_W * FALLBACK_SAMPLE_H);
//       let fullSkin     = 0;
//       let centerSkin   = 0; let centerPx   = 0;
//       let faceZoneSkin = 0; let faceZonePx = 0;

//       const cx1  = Math.floor(FALLBACK_SAMPLE_W * 0.12);
//       const cx2  = Math.floor(FALLBACK_SAMPLE_W * 0.88);
//       const cy1  = Math.floor(FALLBACK_SAMPLE_H * 0.05);
//       const cy2  = Math.floor(FALLBACK_SAMPLE_H * 0.88);
//       const fzX1 = Math.floor(FALLBACK_SAMPLE_W * 0.10);
//       const fzX2 = Math.floor(FALLBACK_SAMPLE_W * 0.90);
//       const fzY1 = 0;
//       const fzY2 = Math.floor(FALLBACK_SAMPLE_H * 0.72);

//       for (let y = 0; y < FALLBACK_SAMPLE_H; y++) {
//         for (let x = 0; x < FALLBACK_SAMPLE_W; x++) {
//           const idx = y * FALLBACK_SAMPLE_W + x;
//           const di  = idx * 4;
//           const r = data[di]; const g = data[di + 1]; const b = data[di + 2];
//           gray[idx] = Math.round(0.299 * r + 0.587 * g + 0.114 * b);
//           const skin = isSkinPixel(r, g, b);
//           if (skin) fullSkin++;
//           if (x >= cx1 && x <= cx2 && y >= cy1 && y <= cy2)     { centerPx++;   if (skin) centerSkin++;   }
//           if (x >= fzX1 && x <= fzX2 && y >= fzY1 && y <= fzY2) { faceZonePx++; if (skin) faceZoneSkin++; }
//         }
//       }

//       const totalPx           = FALLBACK_SAMPLE_W * FALLBACK_SAMPLE_H;
//       const fullSkinRatio     = fullSkin / totalPx;
//       const centerSkinRatio   = centerPx   > 0 ? centerSkin   / centerPx   : 0;
//       const faceZoneSkinRatio = faceZonePx > 0 ? faceZoneSkin / faceZonePx : 0;
//       const edgeRatio         = sobelEdgeScore(gray, FALLBACK_SAMPLE_W, FALLBACK_SAMPLE_H);

//       // High edges + no skin = room background (wall, ceiling, shelf, door frame).
//       // Previously this returned "unknown" which never terminated. Now:
//       //   high edge + no skin hint = "absent"
//       //   high edge + some skin hint = "unknown" (genuinely ambiguous)
//       if (edgeRatio > EDGE_RATIO_MAX) {
//         const anySkinHint =
//           fullSkinRatio     >= 0.003 ||
//           centerSkinRatio   >= 0.006 ||
//           faceZoneSkinRatio >= 0.008;
//         return anySkinHint ? "unknown" : "absent";
//       }

//       const hasEnoughSkin =
//         fullSkinRatio     >= FULL_SKIN_RATIO_MIN      ||
//         centerSkinRatio   >= CENTER_SKIN_RATIO_MIN    ||
//         faceZoneSkinRatio >= FACE_ZONE_SKIN_RATIO_MIN;

//       if (hasEnoughSkin) {
//         // Skin detected — person present but sitting still.
//         // Note: we don't require texture for dark skin (lower local contrast).
//         staticFrameCountRef.current = 0;
//         return "present";
//       }

//       // No skin, low/ambiguous motion, bright frame.
//       // Lean toward absent if static frames are accumulating.
//       if (staticFrameCountRef.current >= Math.floor(STATIC_FRAME_THRESHOLD / 2)) {
//         return "absent";
//       }

//       return "unknown";

//     } catch (err) {
//       console.error("presence_check_failed:", err);
//       return "unknown";
//     } finally {
//       presenceCheckBusyRef.current = false;
//     }
//   }, []);

//   const sendMessage = useCallback(async (text: string) => {
//     if (hardAbortRef.current) return;
//     const trimmed         = text.trim();
//     const isToken         = text === EMPTY_RESPONSE_TOKEN;
//     const normalizedInput = isToken ? "no response" : trimmed;
//     if ((!trimmed && !isToken) || isLoadingRef.current || interviewDoneRef.current) return;
//     clearListeningTimers();
//     const userMsg: Message = { role: "user", content: isToken ? "(No verbal response given)" : trimmed };
//     const updated = [...messages, userMsg];
//     setMessages(updated); setInputText(""); setTranscriptPreview("");
//     finalTranscriptRef.current   = "";
//     interimTranscriptRef.current = "";
//     setLoading(true);
//     const currentCount      = questionCountRef.current;
//     const currentRetryCount = retryCountRef.current[currentCount] ?? 0;
//     try {
//       if (hardAbortRef.current) { setLoading(false); return; }
//       const res  = await fetch("/api/chat", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ messages: updated, candidateName, questionCount: currentCount, retryCount: currentRetryCount }) });
//       if (hardAbortRef.current) { setLoading(false); return; }
//       const data = await parseJson(res);
//       if (hardAbortRef.current) { setLoading(false); return; }
//       if (data?.code === "QUOTA_EXCEEDED" || data?.source === "fallback") throw new Error("quota_fallback");
//       if (!res.ok || !data?.text) throw new Error((data?.error as string) || "unavailable");
//       const aiMsg: Message = { role: "assistant", content: data.text as string };
//       const final           = [...updated, aiMsg];
//       const nextCount       = data.isFollowUp ? currentCount : currentCount + 1;
//       if (data.isFollowUp) {
//         retryCountRef.current = { ...retryCountRef.current, [currentCount]: currentRetryCount + 1 };
//       } else {
//         retryCountRef.current = { ...retryCountRef.current, [currentCount]: 0, [nextCount]: 0 };
//         silenceAttemptRef.current[nextCount] = 0;
//       }
//       setMessages(final); setQCount(nextCount);
//       if (hardAbortRef.current) { setLoading(false); return; }
//       await speak(data.text as string);
//       if (hardAbortRef.current) { setLoading(false); return; }
//       if (data.isComplete || nextCount >= 7) {
//         setDone(true);
//         clearListeningTimers();
//         try { recognitionRef.current?.stop(); } catch {}
//         setTimeout(() => void generateReport(final), 800);
//       } else {
//         maybeStartListening();
//       }
//     } catch (err) {
//       if (hardAbortRef.current) { setLoading(false); return; }
//       const msg = err instanceof Error ? err.message : String(err);
//       if (!msg.includes("quota") && msg !== "quota_fallback") console.error("sendMessage:", err);
//       const { reply: fb, shouldAdvance } = buildFallbackReply(currentCount, candidateName, normalizedInput, currentRetryCount);
//       const nextCount = shouldAdvance ? currentCount + 1 : currentCount;
//       if (shouldAdvance) {
//         retryCountRef.current = { ...retryCountRef.current, [currentCount]: 0, [nextCount]: 0 };
//         silenceAttemptRef.current[nextCount] = 0;
//       } else {
//         retryCountRef.current = { ...retryCountRef.current, [currentCount]: currentRetryCount + 1 };
//       }
//       const aiMsg: Message = { role: "assistant", content: fb };
//       const final = [...updated, aiMsg];
//       setMessages(final); setQCount(nextCount); setUsingFallback(true);
//       if (hardAbortRef.current) { setLoading(false); return; }
//       await speak(fb);
//       if (hardAbortRef.current) { setLoading(false); return; }
//       if (nextCount >= 7) {
//         setDone(true);
//         clearListeningTimers();
//         try { recognitionRef.current?.stop(); } catch {}
//         setTimeout(() => void generateReport(final), 800);
//       } else {
//         maybeStartListening();
//       }
//     } finally { setLoading(false); }
//   }, [candidateName, clearListeningTimers, generateReport, maybeStartListening, messages, parseJson, setDone, setLoading, setQCount, speak]);

//   useEffect(() => { sendMessageRef.current = sendMessage; }, [sendMessage]);

//   const stopEverythingNow = useCallback(() => {
//     hardAbortRef.current = true;
//     stopPresenceDetection();
//     clearListeningTimers();
//     try { recognitionRef.current?.stop(); } catch {}
//     recognitionRef.current    = null;
//     isListeningRef.current    = false;
//     sendInProgressRef.current = false;
//     if (speakSafetyTimerRef.current) { clearTimeout(speakSafetyTimerRef.current); speakSafetyTimerRef.current = null; }
//     speakSettledRef.current = null;
//     isSpeakingRef.current   = false;
//     if (typeof window !== "undefined" && window.speechSynthesis) window.speechSynthesis.cancel();
//     stopCameraPreview();
//     setIsListening(false); setIsSpeaking(false); setIsLoading(false);
//   }, [clearListeningTimers, stopCameraPreview, stopPresenceDetection]);

//   const terminateInterview = useCallback((reason: string, type: "absence" | "multiple_faces" = "absence") => {
//     if (faceTerminatedRef.current) return;
//     faceTerminatedRef.current = true;
//     stopEverythingNow();
//     setTerminated(true);
//     setTerminationReason(reason);
//     setTerminationType(type);
//   }, [stopEverythingNow]);

//   const startPresenceDetection = useCallback(() => {
//     if (faceCheckIntervalRef.current) return;
//     faceAbsenceStartRef.current        = null;
//     faceTerminatedRef.current          = false;
//     consecutiveAbsentCountRef.current  = 0;
//     consecutivePresentCountRef.current = 0;
//     multipleFacesCountRef.current      = 0;
//     unknownStreakRef.current           = 0;
//     staticFrameCountRef.current        = 0;
//     prevFrameDataRef.current           = null;
//     let warmupCount = 0;

//     const handleVisibilityChange = () => {
//       if (document.hidden) {
//         faceAbsenceStartRef.current        = null;
//         consecutiveAbsentCountRef.current  = 0;
//         consecutivePresentCountRef.current = 0;
//         multipleFacesCountRef.current      = 0;
//         unknownStreakRef.current           = 0;
//         staticFrameCountRef.current        = 0;
//         prevFrameDataRef.current           = null;
//         if (mountedRef.current) setFaceAbsenceCountdown(null);
//       }
//     };
//     visibilityHandlerRef.current = handleVisibilityChange;
//     document.addEventListener("visibilitychange", handleVisibilityChange);

//     faceCheckIntervalRef.current = setInterval(() => {
//       if (faceTerminatedRef.current || interviewDoneRef.current || hardAbortRef.current) {
//         if (faceCheckIntervalRef.current) { clearInterval(faceCheckIntervalRef.current); faceCheckIntervalRef.current = null; }
//         if (visibilityHandlerRef.current) { document.removeEventListener("visibilitychange", visibilityHandlerRef.current); visibilityHandlerRef.current = null; }
//         return;
//       }
//       if (document.hidden) return;

//       if (warmupCount < PRESENCE_WARMUP_FRAMES) { warmupCount++; return; }

//       if (isSpeakingRef.current) return;
//       const timeSinceSpeak = Date.now() - speakEndedAtRef.current;
//       if (timeSinceSpeak < SPEAK_GRACE_MS) return;

//       void (async () => {
//         const state = await checkPresence();

//         // ── Multiple faces ─────────────────────────────────────────────────
//         if (state === "multiple_faces") {
//           consecutivePresentCountRef.current = 0;
//           consecutiveAbsentCountRef.current  = 0;
//           unknownStreakRef.current           = 0;
//           multipleFacesCountRef.current     += 1;
//           if (multipleFacesCountRef.current >= MULTIPLE_FACES_THRESHOLD) {
//             terminateInterview(
//               "Multiple people were detected in the camera frame. Only the registered candidate may be visible during the interview.",
//               "multiple_faces"
//             );
//             if (mountedRef.current) setFaceAbsenceCountdown(null);
//           }
//           return;
//         }

//         // ── Present ────────────────────────────────────────────────────────
//         if (state === "present") {
//           consecutivePresentCountRef.current += 1;
//           // FIX: Only "present" resets the absent counter.
//           // Previously "unknown" also reset it — a ceiling alternating absent/unknown
//           // would never accumulate enough absence frames.
//           consecutiveAbsentCountRef.current   = 0;
//           unknownStreakRef.current            = 0;
//           multipleFacesCountRef.current       = Math.max(0, multipleFacesCountRef.current - 1);

//           if (consecutivePresentCountRef.current >= PRESENCE_RECOVERY_FRAMES) {
//             faceAbsenceStartRef.current = null;
//             if (mountedRef.current) setFaceAbsenceCountdown(null);
//           }
//           return;
//         }

//         // ── Unknown (inconclusive) ─────────────────────────────────────────
//         // FIX: Do NOT reset consecutiveAbsentCountRef here.
//         // "unknown" is NEUTRAL — it must not undo accumulated absence evidence.
//         // Only "present" cancels absence progress.
//         if (state === "unknown") {
//           consecutivePresentCountRef.current = 0;
//           // NOTE: consecutiveAbsentCountRef intentionally NOT reset here
//           unknownStreakRef.current          += 1;

//           if (unknownStreakRef.current < UNKNOWN_STREAK_TO_ABSENT) {
//             // Continue any existing absence timer countdown during unknown frames
//             if (faceAbsenceStartRef.current !== null && mountedRef.current) {
//               const absenceMs     = Date.now() - faceAbsenceStartRef.current;
//               const remainingSecs = Math.max(0, Math.ceil((FACE_ABSENCE_TERMINATE_MS - absenceMs) / 1000));
//               setFaceAbsenceCountdown(remainingSecs);
//               if (absenceMs >= FACE_ABSENCE_TERMINATE_MS) {
//                 terminateInterview(
//                   "You were not visible in the camera frame for an extended period. The interview has been terminated as per our proctoring policy.",
//                   "absence"
//                 );
//                 if (mountedRef.current) setFaceAbsenceCountdown(null);
//               }
//             }
//             return;
//           }
//           // Long unknown streak (≥ UNKNOWN_STREAK_TO_ABSENT frames) → escalate to absent
//           consecutiveAbsentCountRef.current += 1;

//         } else {
//           // Definitive "absent"
//           consecutiveAbsentCountRef.current += 1;
//           unknownStreakRef.current           = 0;
//         }

//         consecutivePresentCountRef.current = 0;

//         if (consecutiveAbsentCountRef.current < CONSECUTIVE_ABSENT_THRESHOLD) return;

//         // ── Start or continue absence timer ────────────────────────────────
//         if (faceAbsenceStartRef.current === null) {
//           faceAbsenceStartRef.current = Date.now();
//           console.warn(
//             `[proctoring] absence confirmed (${consecutiveAbsentCountRef.current} frames, unknownStreak=${unknownStreakRef.current}) → starting ${FACE_ABSENCE_TERMINATE_MS / 1000}s timer`
//           );
//         }

//         const absenceMs     = Date.now() - faceAbsenceStartRef.current;
//         const remainingSecs = Math.max(0, Math.ceil((FACE_ABSENCE_TERMINATE_MS - absenceMs) / 1000));
//         if (mountedRef.current) setFaceAbsenceCountdown(remainingSecs);

//         if (absenceMs >= FACE_ABSENCE_TERMINATE_MS) {
//           terminateInterview(
//             "You were not visible in the camera frame for more than 12 seconds. The interview has been terminated as per our proctoring policy.",
//             "absence"
//           );
//           if (mountedRef.current) setFaceAbsenceCountdown(null);
//         }
//       })();
//     }, FACE_CHECK_INTERVAL_MS);
//   }, [checkPresence, terminateInterview]);

//   useEffect(() => {
//     return () => {
//       hardAbortRef.current = true;
//       stopPresenceDetection(); clearListeningTimers();
//       try { recognitionRef.current?.stop(); } catch {}
//       recognitionRef.current = null;
//       if (speakSafetyTimerRef.current) { clearTimeout(speakSafetyTimerRef.current); speakSafetyTimerRef.current = null; }
//       speakSettledRef.current = null;
//       if (typeof window !== "undefined" && window.speechSynthesis) window.speechSynthesis.cancel();
//       stopCameraPreview();
//     };
//   }, [clearListeningTimers, stopCameraPreview, stopPresenceDetection]);

//   const canBeginInterview = micState === "granted" && cameraState === "granted";

//   const beginInterview = useCallback(async () => {
//     if (!canBeginInterview) { setShowMandatoryWarning(true); await speak("Please enable both your microphone and camera before starting."); return; }
//     if (isBeginning) return;
//     setIsBeginning(true); setShowMandatoryWarning(false);
//     window.speechSynthesis?.cancel(); clearListeningTimers();
//     hardAbortRef.current = false; faceTerminatedRef.current = false;
//     setTerminated(false); setTerminationReason(""); setFaceAbsenceCountdown(null);
//     consecutiveAbsentCountRef.current  = 0;
//     consecutivePresentCountRef.current = 0;
//     multipleFacesCountRef.current      = 0;
//     unknownStreakRef.current           = 0;
//     staticFrameCountRef.current        = 0;
//     prevFrameDataRef.current           = null;
//     speakEndedAtRef.current            = 0;
//     // Reset detector reliability so it re-confirms itself in the new session
//     if (nativeFaceDetectorOkRef.current === true) nativeFaceDetectorOkRef.current = null;
//     retryCountRef.current     = Object.create(null) as Record<number, number>;
//     silenceAttemptRef.current = Object.create(null) as Record<number, number>;
//     sendInProgressRef.current = false; utteranceSentRef.current = false;
//     sendEpochRef.current      = 0;
//     setUsingFallback(false); setMessages([]); setTranscriptPreview(""); setInputText("");
//     setQuestionCount(1); questionCountRef.current = 1; setDone(false);
//     setReportError(""); setReportGenerating(false);

//     setScreen("interview");
//     setShowInitialThinking(true);

//     setTimeout(() => { if (!hardAbortRef.current) { startPresenceDetection(); void attachCameraStreamToVisibleVideo(true); } }, 300);
//     setLoading(true);

//     const initial: Message[] = [{ role: "user", content: `Hi, my name is ${candidateName}.` }];

//     try {
//       setMessages(initial);
//       const res  = await fetch("/api/chat", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ messages: initial, candidateName, questionCount: 1, retryCount: 0, beginInterview: true }) });
//       const data = await parseJson(res);
//       const text = (data?.text as string) || QUESTION_BANK[0];
//       const aiMsg: Message = { role: "assistant", content: text };
//       const final = [...initial, aiMsg];
//       setMessages(final); setQCount(2);
//       setShowInitialThinking(false);
//       if (hardAbortRef.current) return;
//       await speak(text);
//       if (!hardAbortRef.current) maybeStartListening();
//     } catch (err) {
//       console.error("beginInterview:", err);
//       if (hardAbortRef.current) return;
//       const fallback       = QUESTION_BANK[0];
//       const aiMsg: Message = { role: "assistant", content: fallback };
//       const final          = [...initial, aiMsg];
//       setMessages(final); setQCount(2);
//       setShowInitialThinking(false);
//       await speak(fallback);
//       if (!hardAbortRef.current) maybeStartListening();
//     } finally { setLoading(false); setIsBeginning(false); }
//   }, [attachCameraStreamToVisibleVideo, canBeginInterview, candidateName, clearListeningTimers, isBeginning, maybeStartListening, parseJson, setDone, setLoading, setQCount, speak, startPresenceDetection]);

//   const handleReturnHome = useCallback(() => { stopEverythingNow(); router.push("/"); }, [router, stopEverythingNow]);

//   const handleManualSend = useCallback(() => {
//     const text = inputText.trim();
//     if (!text || isLoadingRef.current || sendInProgressRef.current || interviewDoneRef.current || hardAbortRef.current) return;
//     doSend(text); setInputText("");
//   }, [doSend, inputText]);

//   // ── Render ─────────────────────────────────────────────────────────────────

//   const globalStyles = `
//     @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;1,9..40,400&display=swap');
//     *, *::before, *::after { font-family: 'DM Sans', system-ui, sans-serif; }
//     @keyframes spin    { to { transform: rotate(360deg); } }
//     @keyframes fadeIn  { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
//     @keyframes pulse   { 0%,100% { opacity:1; } 50% { opacity:0.4; } }
//     @keyframes blink   { 0%,100% { opacity:1; } 50% { opacity:0.3; } }
//     @keyframes bounce  { 0%,80%,100% { transform: translateY(0); } 40% { transform: translateY(-6px); } }
//     .msg-fade { animation: fadeIn 0.22s ease forwards; }
//     textarea:focus { outline: none; }
//     input:focus    { outline: none; }
//     ::-webkit-scrollbar       { width: 5px; }
//     ::-webkit-scrollbar-track { background: transparent; }
//     ::-webkit-scrollbar-thumb { background: ${T.border}; border-radius: 3px; }
//   `;

//   const cardStyle: React.CSSProperties = {
//     border: `1px solid ${T.border}`,
//     borderRadius: 16,
//     backgroundColor: T.surface,
//     boxShadow: T.shadow,
//   };

//   // ── Terminated ─────────────────────────────────────────────────────────────
//   if (terminated) {
//     const isMultiFace = terminationType === "multiple_faces";
//     return (
//       <>
//         <style dangerouslySetInnerHTML={{ __html: globalStyles }} />
//         <canvas ref={faceCanvasRef} style={{ display: "none" }} aria-hidden="true" />
//         <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 24, backgroundColor: T.bg, color: T.text }}>
//           <div style={{ ...cardStyle, width: "100%", maxWidth: 480, padding: "48px 40px", textAlign: "center" }}>
//             <div style={{ width: 72, height: 72, borderRadius: "50%", backgroundColor: T.roseBg, border: `1px solid ${T.roseBorder}`, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 24px" }}>
//               {isMultiFace ? <Users size={30} color={T.roseText} /> : <UserX size={30} color={T.roseText} />}
//             </div>
//             <h1 style={{ fontSize: 22, fontWeight: 700, letterSpacing: "-0.02em", marginBottom: 12, color: T.text }}>Interview Terminated</h1>
//             <p style={{ fontSize: 14, lineHeight: 1.7, color: T.textSub, marginBottom: 24 }}>{terminationReason}</p>
//             <div style={{ padding: "12px 16px", borderRadius: 10, border: `1px solid ${T.amberBorder}`, backgroundColor: T.amberBg, fontSize: 13, color: T.amberText, textAlign: "left", marginBottom: 28, display: "flex", alignItems: "flex-start", gap: 10 }}>
//               <AlertTriangle size={14} style={{ marginTop: 1, flexShrink: 0 }} />
//               <span>{isMultiFace ? "Only the registered candidate may be present and visible during the interview." : "Please remain fully visible in the camera frame throughout the interview."}</span>
//             </div>
//             <button onClick={handleReturnHome} style={{ width: "100%", height: 46, borderRadius: 10, border: "none", background: "linear-gradient(135deg,#7C3AED,#C026D3)", color: "#fff", fontSize: 14, fontWeight: 600, cursor: "pointer" }}>
//               Return to Home
//             </button>
//           </div>
//         </div>
//       </>
//     );
//   }

//   // ── Report generating overlay ───────────────────────────────────────────────
//   if (reportGenerating) {
//     return (
//       <>
//         <style dangerouslySetInnerHTML={{ __html: globalStyles }} />
//         <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: T.bg, color: T.text }}>
//           <div style={{ textAlign: "center" }}>
//             <div style={{ width: 64, height: 64, borderRadius: "50%", background: "linear-gradient(135deg,#7C3AED,#C026D3)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px", animation: "pulse 1.5s infinite" }}>
//               <BrainCircuit size={28} color="#fff" />
//             </div>
//             <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8, color: T.text }}>Generating your report…</h2>
//             <p style={{ fontSize: 14, color: T.textSub }}>Analysing interview responses. This takes a few seconds.</p>
//             {reportError && <p style={{ fontSize: 13, color: T.amberText, marginTop: 12 }}>{reportError}</p>}
//           </div>
//         </div>
//       </>
//     );
//   }

//   // ── Briefing ────────────────────────────────────────────────────────────────
//   if (screen === "briefing") {
//     return (
//       <>
//         <style dangerouslySetInnerHTML={{ __html: globalStyles }} />
//         <canvas ref={faceCanvasRef} style={{ display: "none" }} aria-hidden="true" />
//         <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", backgroundColor: T.bg, backgroundImage: `linear-gradient(${T.bgGrid} 1px, transparent 1px), linear-gradient(90deg, ${T.bgGrid} 1px, transparent 1px)`, backgroundSize: "56px 56px", color: T.text }}>

//           <header style={{ position: "sticky", top: 0, zIndex: 10, borderBottom: `1px solid ${T.border}`, backgroundColor: T.headerBg, backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)" }}>
//             <div style={{ maxWidth: 1300, margin: "0 auto", padding: "0 28px", height: 56, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
//               <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
//                 <div style={{ width: 32, height: 32, borderRadius: 9, background: "linear-gradient(135deg,#7C3AED,#C026D3)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: `0 6px 16px ${T.accentGlow}` }}>
//                   <BrainCircuit size={14} color="#fff" />
//                 </div>
//                 <span style={{ fontSize: 14, fontWeight: 600, letterSpacing: "-0.01em" }}>Cuemath · Tutor Screener</span>
//                 {isSpeaking && (
//                   <div style={{ display: "flex", alignItems: "center", gap: 5, padding: "3px 10px", borderRadius: 20, backgroundColor: T.accentBg, border: `1px solid ${T.accentGlow}` }}>
//                     {[0, 1, 2].map(i => (
//                       <div key={i} style={{ width: 3, height: 12, borderRadius: 2, backgroundColor: T.accentLight, animation: `blink 1s ease ${i * 0.15}s infinite` }} />
//                     ))}
//                     <span style={{ fontSize: 11, color: T.accentLight, fontWeight: 500 }}>Maya speaking</span>
//                   </div>
//                 )}
//               </div>
//               <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
//                 <span style={{ fontSize: 13, color: T.textMuted }}>{candidateName}</span>
//                 <button onClick={toggleTheme} style={{ width: 32, height: 32, borderRadius: 8, border: `1px solid ${T.border}`, backgroundColor: T.surface, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: T.textSub }}>
//                   {theme === "dark" ? <Sun size={14} /> : <Moon size={14} />}
//                 </button>
//               </div>
//             </div>
//           </header>

//           <main style={{ flex: 1, maxWidth: 1300, margin: "0 auto", width: "100%", padding: "32px 28px", display: "grid", gridTemplateColumns: "360px 1fr", gap: 24, alignItems: "start" }}>

//             {/* Left: Setup */}
//             <div style={{ ...cardStyle, padding: "24px" }}>
//               <div style={{ marginBottom: 20 }}>
//                 <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase" as const, color: T.accentLight, marginBottom: 6 }}>Before you begin</div>
//                 <div style={{ fontSize: 18, fontWeight: 700, letterSpacing: "-0.02em", marginBottom: 4 }}>Welcome, {candidateName}</div>
//                 <div style={{ fontSize: 13, color: T.textSub, lineHeight: 1.6 }}>Set up your camera and mic to get started.</div>
//               </div>

//               <div style={{ borderRadius: 12, overflow: "hidden", border: `1px solid ${T.border}`, aspectRatio: "16/9", backgroundColor: T.surfaceInset, marginBottom: 16 }}>
//                 {cameraState === "granted" ? (
//                   <video ref={briefingVideoRef} autoPlay muted playsInline style={{ width: "100%", height: "100%", objectFit: "cover" }} />
//                 ) : (
//                   <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 8 }}>
//                     <Camera size={24} color={T.accentLight} style={{ opacity: 0.5 }} />
//                     <span style={{ fontSize: 12, color: T.textMuted }}>Camera preview</span>
//                   </div>
//                 )}
//               </div>

//               <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 12 }}>
//                 {[
//                   { onClick: requestMicPermission,     icon: <Mic    size={14} />, label: micState === "requesting" ? "Requesting…" : micState === "granted" ? "Microphone enabled ✓" : micState === "denied" ? "Mic denied — check browser" : "Enable microphone",   active: micState === "granted",    disabled: false },
//                   { onClick: requestCameraPermission,  icon: <Camera size={14} />, label: cameraState === "requesting" ? "Requesting…" : cameraState === "granted" ? "Camera enabled ✓" : cameraState === "denied" ? "Camera denied — check browser" : "Enable camera", active: cameraState === "granted", disabled: false },
//                   { onClick: verifyMicrophoneWithMaya, icon: <Volume2 size={14} />, label: deviceCheckRunning ? "Testing mic…" : micVerified ? "Mic verified ✓" : "Test microphone with Maya", active: micVerified, disabled: micState !== "granted" || deviceCheckRunning },
//                 ].map((btn, i) => (
//                   <button key={i} onClick={btn.disabled ? undefined : btn.onClick} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", borderRadius: 10, border: `1px solid ${btn.active ? T.emeraldBorder : T.border}`, backgroundColor: btn.active ? T.emeraldBg : T.surfaceInset, color: btn.active ? T.emeraldText : btn.disabled ? T.textMuted : T.textSub, fontSize: 13, fontWeight: 500, cursor: btn.disabled ? "not-allowed" : "pointer", textAlign: "left" as const, transition: "all 0.15s", opacity: btn.disabled ? 0.55 : 1 }}>
//                     {btn.icon}{btn.label}
//                   </button>
//                 ))}
//               </div>

//               {deviceCheckTranscript && (
//                 <div style={{ padding: "8px 12px", borderRadius: 8, border: `1px solid ${T.border}`, backgroundColor: T.surfaceInset, fontSize: 12, color: T.textSub, marginBottom: 10 }}>
//                   Heard: <span style={{ fontWeight: 600 }}>{deviceCheckTranscript}</span>
//                 </div>
//               )}

//               {showMandatoryWarning && (
//                 <div style={{ padding: "8px 12px", borderRadius: 8, border: `1px solid ${T.roseBorder}`, backgroundColor: T.roseBg, fontSize: 12, color: T.roseText, marginBottom: 10 }}>
//                   Both microphone and camera are required to start.
//                 </div>
//               )}

//               <div style={{ display: "flex", gap: 16, marginBottom: 16 }}>
//                 <StatusDot ok={micState === "granted"}    label="Mic"       T={T} />
//                 <StatusDot ok={cameraState === "granted"} label="Camera"    T={T} />
//                 <StatusDot ok={supportsSpeech}            label="Voice API" T={T} />
//               </div>

//               <button
//                 onClick={beginInterview}
//                 disabled={!canBeginInterview || isBeginning}
//                 style={{ width: "100%", height: 44, borderRadius: 10, border: "none", background: !canBeginInterview || isBeginning ? (theme === "dark" ? "rgba(124,58,237,0.25)" : "rgba(109,40,217,0.2)") : "linear-gradient(135deg,#7C3AED,#C026D3)", color: !canBeginInterview || isBeginning ? T.textMuted : "#fff", fontSize: 14, fontWeight: 600, cursor: !canBeginInterview || isBeginning ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginBottom: 14, boxShadow: !canBeginInterview || isBeginning ? "none" : `0 8px 24px ${T.accentGlow}` }}
//               >
//                 {isBeginning ? (<><Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} /> Starting…</>) : (<>Begin Interview <ChevronRight size={14} /></>)}
//               </button>

//               <div style={{ padding: "12px 14px", borderRadius: 10, border: `1px solid ${T.border}`, backgroundColor: T.surfaceInset }}>
//                 <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.04em", textTransform: "uppercase" as const, color: T.textMuted, marginBottom: 8 }}>Interview rules</div>
//                 {[
//                   "Stay visible in camera throughout",
//                   "12 sec without face detection ends the interview",
//                   "Only you may be visible — no other people in frame",
//                   "Speak naturally in your own words",
//                 ].map(rule => (
//                   <div key={rule} style={{ display: "flex", alignItems: "flex-start", gap: 6, marginBottom: 5 }}>
//                     <span style={{ fontSize: 11, color: T.accentLight, marginTop: 1, flexShrink: 0 }}>•</span>
//                     <span style={{ fontSize: 12, color: T.textSub, lineHeight: 1.5 }}>{rule}</span>
//                   </div>
//                 ))}
//               </div>
//             </div>

//             {/* Right: Briefing steps */}
//             <div style={{ ...cardStyle, padding: "24px" }}>
//               <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
//                 <div>
//                   <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase" as const, color: T.accentLight, marginBottom: 6 }}>Interview briefing</div>
//                   <div style={{ fontSize: 20, fontWeight: 700, letterSpacing: "-0.02em" }}>What to expect</div>
//                 </div>
//                 <div style={{ padding: "4px 12px", borderRadius: 20, border: `1px solid ${T.border}`, backgroundColor: T.surfaceInset, fontSize: 12, color: T.textMuted, fontWeight: 500 }}>
//                   {briefingStep + 1} / {BRIEFING_STEPS.length}
//                 </div>
//               </div>

//               <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
//                 {BRIEFING_STEPS.map((step, idx) => {
//                   const Icon   = step.icon;
//                   const active = idx === briefingStep;
//                   return (
//                     <button key={step.title} onClick={() => setBriefingStep(idx)} style={{ display: "flex", alignItems: "flex-start", gap: 14, padding: "16px 18px", borderRadius: 12, border: `1px solid ${active ? T.accentGlow : T.border}`, backgroundColor: active ? T.accentBg : T.surfaceInset, textAlign: "left" as const, cursor: "pointer", transition: "all 0.15s", opacity: active ? 1 : 0.55 }}>
//                       <div style={{ width: 36, height: 36, borderRadius: 9, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, backgroundColor: active ? T.accentBg : T.surface, border: `1px solid ${active ? T.accentGlow : T.border}` }}>
//                         <Icon size={16} color={T.accentLight} />
//                       </div>
//                       <div>
//                         <div style={{ fontSize: 14, fontWeight: 600, letterSpacing: "-0.01em", marginBottom: 4, color: T.text }}>{step.title}</div>
//                         <div style={{ fontSize: 13, color: T.textSub, lineHeight: 1.6 }}>{step.desc}</div>
//                       </div>
//                     </button>
//                   );
//                 })}
//               </div>
//             </div>
//           </main>
//         </div>
//       </>
//     );
//   }

//   // ── Interview ───────────────────────────────────────────────────────────────
//   return (
//     <>
//       <style dangerouslySetInnerHTML={{ __html: globalStyles }} />
//       <canvas ref={faceCanvasRef} style={{ display: "none" }} aria-hidden="true" />

//       <div style={{ height: "100vh", display: "flex", flexDirection: "column", overflow: "hidden", backgroundColor: T.bg, backgroundImage: `linear-gradient(${T.bgGrid} 1px, transparent 1px), linear-gradient(90deg, ${T.bgGrid} 1px, transparent 1px)`, backgroundSize: "56px 56px", color: T.text }}>

//         <header style={{ flexShrink: 0, borderBottom: `1px solid ${T.border}`, backgroundColor: T.headerBg, backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)" }}>
//           <div style={{ maxWidth: 1300, margin: "0 auto", padding: "0 28px", height: 56, display: "flex", alignItems: "center", gap: 20 }}>
//             <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
//               <div style={{ width: 32, height: 32, borderRadius: 9, background: "linear-gradient(135deg,#7C3AED,#C026D3)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, animation: isSpeaking ? "pulse 1.5s infinite" : "none", boxShadow: isSpeaking ? `0 0 14px rgba(124,58,237,0.5)` : "none" }}>
//                 <span style={{ fontSize: 13, fontWeight: 700, color: "#fff" }}>M</span>
//               </div>
//               <div>
//                 <div style={{ fontSize: 13, fontWeight: 600, lineHeight: 1.2 }}>Maya · AI Interviewer</div>
//                 <div style={{ fontSize: 11, color: T.textMuted }}>Cuemath Tutor Screener</div>
//               </div>
//             </div>

//             <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 12, justifyContent: "center" }}>
//               <span style={{ fontSize: 12, color: T.textMuted, whiteSpace: "nowrap" as const }}>Q {displayCount}/{TOTAL_Q}</span>
//               <div style={{ width: 180, height: 4, borderRadius: 2, backgroundColor: T.progressBg, overflow: "hidden" }}>
//                 <div style={{ height: "100%", width: `${progress}%`, borderRadius: 2, background: "linear-gradient(90deg,#7C3AED,#C026D3)", transition: "width 0.5s ease" }} />
//               </div>
//               <div style={{ display: "flex", gap: 4 }}>
//                 {Array.from({ length: TOTAL_Q }).map((_, i) => (
//                   <div key={i} style={{ width: 6, height: 6, borderRadius: "50%", backgroundColor: i < displayCount ? T.accentLight : T.progressBg, transition: "background-color 0.3s" }} />
//                 ))}
//               </div>
//             </div>

//             <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
//               <div style={{ display: "flex", gap: 10 }}>
//                 <StatusDot ok={micState === "granted"}    label="Mic" T={T} />
//                 <StatusDot ok={cameraState === "granted"} label="Cam" T={T} />
//               </div>
//               <button onClick={toggleTheme} style={{ width: 32, height: 32, borderRadius: 8, border: `1px solid ${T.border}`, backgroundColor: T.surface, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: T.textSub }}>
//                 {theme === "dark" ? <Sun size={14} /> : <Moon size={14} />}
//               </button>
//             </div>
//           </div>
//         </header>

//         <div style={{ flex: 1, overflow: "hidden", display: "flex" }}>
//           <div style={{ maxWidth: 1300, margin: "0 auto", width: "100%", padding: "20px 28px", display: "grid", gridTemplateColumns: "260px 1fr", gap: 20, overflow: "hidden" }}>

//             <aside style={{ display: "flex", flexDirection: "column", gap: 14, overflow: "auto" }}>
//               <div style={{ ...cardStyle, overflow: "hidden" }}>
//                 <div style={{ aspectRatio: "4/3", backgroundColor: T.surfaceInset }}>
//                   {cameraState === "granted" ? (
//                     <video ref={interviewVideoRef} autoPlay muted playsInline style={{ width: "100%", height: "100%", objectFit: "cover" }} />
//                   ) : (
//                     <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
//                       <Camera size={20} color={T.accentLight} style={{ opacity: 0.4 }} />
//                     </div>
//                   )}
//                 </div>
//                 <div style={{ padding: "10px 14px", borderTop: `1px solid ${T.border}` }}>
//                   <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 6, color: T.text }}>{candidateName}</div>
//                   <div style={{ display: "flex", gap: 12 }}>
//                     <StatusDot ok={micState === "granted"} label="Mic"  T={T} />
//                     <StatusDot ok={inputMode === "voice"}  label={inputMode === "voice" ? "Voice" : "Text"} T={T} />
//                   </div>
//                 </div>
//               </div>

//               <div style={{ ...cardStyle, padding: "14px 16px" }}>
//                 <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
//                   <span style={{ fontSize: 12, fontWeight: 600, color: T.text }}>Progress</span>
//                   <span style={{ fontSize: 11, color: T.textMuted }}>{displayCount}/{TOTAL_Q}</span>
//                 </div>
//                 <div style={{ height: 4, borderRadius: 2, backgroundColor: T.progressBg, overflow: "hidden", marginBottom: 8 }}>
//                   <div style={{ height: "100%", width: `${progress}%`, borderRadius: 2, background: "linear-gradient(90deg,#7C3AED,#C026D3)", transition: "width 0.5s ease" }} />
//                 </div>
//                 <div style={{ display: "flex", gap: 4 }}>
//                   {Array.from({ length: TOTAL_Q }).map((_, i) => (
//                     <div key={i} style={{ flex: 1, height: 3, borderRadius: 2, backgroundColor: i < displayCount ? T.accentLight : T.progressBg, transition: "background-color 0.3s ease" }} />
//                   ))}
//                 </div>
//               </div>

//               {faceAbsenceCountdown !== null && (
//                 <div style={{ padding: "10px 12px", borderRadius: 10, border: `1px solid ${T.roseBorder}`, backgroundColor: T.roseBg, fontSize: 12, color: T.roseText, display: "flex", alignItems: "flex-start", gap: 8 }}>
//                   <AlertTriangle size={13} style={{ marginTop: 1, flexShrink: 0 }} />
//                   <span><strong>Warning:</strong> Stay in frame — {faceAbsenceCountdown}s</span>
//                 </div>
//               )}
//               {usingFallback && (
//                 <div style={{ padding: "8px 12px", borderRadius: 10, border: `1px solid ${T.border}`, backgroundColor: T.surfaceInset, fontSize: 11, color: T.textMuted, display: "flex", alignItems: "center", gap: 6 }}>
//                   <WifiOff size={11} /> Fallback mode active
//                 </div>
//               )}
//               {reportError && (
//                 <div style={{ padding: "8px 12px", borderRadius: 10, border: `1px solid ${T.amberBorder}`, backgroundColor: T.amberBg, fontSize: 12, color: T.amberText }}>
//                   {reportError}
//                 </div>
//               )}
//             </aside>

//             <div style={{ ...cardStyle, display: "flex", flexDirection: "column", overflow: "hidden", minWidth: 0 }}>
//               <div style={{ flexShrink: 0, padding: "12px 20px", borderBottom: `1px solid ${T.border}`, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
//                 <div>
//                   <span style={{ fontSize: 13, fontWeight: 600, color: T.text }}>Live Interview</span>
//                   <span style={{ fontSize: 12, color: T.textMuted, marginLeft: 10 }}>Answer naturally — Maya will guide you</span>
//                 </div>
//                 <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
//                   {supportsSpeech && micState === "granted" && (
//                     <button onClick={() => setInputModeSynced(inputMode === "voice" ? "typing" : "voice")} style={{ padding: "5px 12px", borderRadius: 7, border: `1px solid ${T.border}`, backgroundColor: T.surfaceInset, color: T.textSub, fontSize: 12, fontWeight: 500, cursor: "pointer" }}>
//                       {inputMode === "voice" ? "Switch to typing" : "Switch to voice"}
//                     </button>
//                   )}
//                   {inputMode === "voice" && micState === "granted" && (
//                     <button onClick={isListening ? stopListening : startListening} style={{ display: "flex", alignItems: "center", gap: 6, padding: "5px 14px", borderRadius: 7, border: "none", background: isListening ? T.rose : "linear-gradient(135deg,#7C3AED,#C026D3)", color: "#fff", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
//                       {isListening ? <><MicOff size={12} /> Stop</> : <><Mic size={12} /> Listen</>}
//                     </button>
//                   )}
//                 </div>
//               </div>

//               <div style={{ flex: 1, overflowY: "auto", padding: "20px 20px 8px" }}>
//                 <div style={{ maxWidth: 680, margin: "0 auto", display: "flex", flexDirection: "column", gap: 12 }}>
//                   {messages.map((message, idx) => {
//                     const isUser = message.role === "user";
//                     return (
//                       <div key={`${message.role}-${idx}`} className="msg-fade" style={{ display: "flex", justifyContent: isUser ? "flex-end" : "flex-start", alignItems: "flex-start", gap: 10 }}>
//                         {!isUser && (
//                           <div style={{ width: 28, height: 28, borderRadius: 8, background: "linear-gradient(135deg,#7C3AED,#C026D3)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 2 }}>
//                             <span style={{ fontSize: 11, fontWeight: 700, color: "#fff" }}>M</span>
//                           </div>
//                         )}
//                         <div style={{ maxWidth: "76%", padding: "10px 14px", borderRadius: isUser ? "14px 14px 4px 14px" : "14px 14px 14px 4px", background: isUser ? T.bubbleUser.bg : T.bubbleMaya.bg, border: isUser ? "none" : `1px solid ${T.bubbleMaya.border}`, color: isUser ? T.bubbleUser.text : T.bubbleMaya.text, fontSize: 13.5, lineHeight: 1.65 }}>
//                           {message.content}
//                         </div>
//                       </div>
//                     );
//                   })}

//                   {transcriptPreview && (
//                     <div className="msg-fade" style={{ display: "flex", justifyContent: "flex-end" }}>
//                       <div style={{ maxWidth: "76%", padding: "10px 14px", borderRadius: "14px 14px 4px 14px", background: T.bubbleUser.bg, color: T.bubbleUser.text, fontSize: 13.5, lineHeight: 1.65, opacity: 0.6 }}>
//                         {transcriptPreview}
//                       </div>
//                     </div>
//                   )}

//                   {(isLoading || showInitialThinking) && (
//                     <div className="msg-fade" style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
//                       <div style={{ width: 28, height: 28, borderRadius: 8, background: "linear-gradient(135deg,#7C3AED,#C026D3)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
//                         <span style={{ fontSize: 11, fontWeight: 700, color: "#fff" }}>M</span>
//                       </div>
//                       <div style={{ padding: "10px 16px", borderRadius: "14px 14px 14px 4px", border: `1px solid ${T.bubbleMaya.border}`, backgroundColor: T.bubbleMaya.bg, display: "flex", alignItems: "center", gap: 8 }}>
//                         {[0, 1, 2].map(i => (
//                           <div key={i} style={{ width: 6, height: 6, borderRadius: "50%", backgroundColor: T.accentLight, animation: `bounce 1.2s ease ${i * 0.2}s infinite` }} />
//                         ))}
//                       </div>
//                     </div>
//                   )}
//                   <div ref={chatEndRef} />
//                 </div>
//               </div>

//               <div style={{ flexShrink: 0, borderTop: `1px solid ${T.border}`, padding: "14px 20px" }}>
//                 {canUseTyping ? (
//                   <div style={{ maxWidth: 680, margin: "0 auto", display: "flex", gap: 10, alignItems: "flex-end" }}>
//                     <textarea
//                       value={inputText}
//                       onChange={(e) => setInputText(e.target.value)}
//                       rows={1}
//                       placeholder="Type your answer…"
//                       style={{ flex: 1, resize: "none", borderRadius: 10, border: `1px solid ${T.inputBorder}`, backgroundColor: T.inputBg, color: T.text, fontSize: 13.5, padding: "10px 14px", minHeight: 44, maxHeight: 100, overflowY: "auto" }}
//                       onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleManualSend(); } }}
//                       onFocus={(e) => { e.target.style.borderColor = T.accentLight; e.target.style.boxShadow = `0 0 0 3px ${T.accentGlow}`; }}
//                       onBlur={(e)  => { e.target.style.borderColor = T.inputBorder; e.target.style.boxShadow = "none"; }}
//                     />
//                     <button
//                       onClick={handleManualSend}
//                       disabled={!inputText.trim() || isLoading}
//                       style={{ width: 44, height: 44, borderRadius: 10, border: "none", background: !inputText.trim() || isLoading ? T.progressBg : "linear-gradient(135deg,#7C3AED,#C026D3)", color: !inputText.trim() || isLoading ? T.textMuted : "#fff", display: "flex", alignItems: "center", justifyContent: "center", cursor: !inputText.trim() || isLoading ? "not-allowed" : "pointer", flexShrink: 0 }}
//                     >
//                       <Send size={15} />
//                     </button>
//                   </div>
//                 ) : (
//                   <div style={{ maxWidth: 680, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
//                     <span style={{ fontSize: 12.5, color: T.textSub }}>
//                       Voice mode active — click <strong>Listen</strong> when ready to speak.
//                     </span>
//                     <div style={{ display: "flex", alignItems: "center", gap: 7, padding: "5px 12px", borderRadius: 20, border: `1px solid ${isSpeaking ? T.accentGlow : isListening ? T.emeraldBorder : T.border}`, backgroundColor: isSpeaking ? T.accentBg : isListening ? T.emeraldBg : T.surfaceInset, fontSize: 12, fontWeight: 500, color: isSpeaking ? T.accentLight : isListening ? T.emeraldText : T.textMuted }}>
//                       <div style={{ width: 6, height: 6, borderRadius: "50%", backgroundColor: isSpeaking ? T.accentLight : isListening ? T.emerald : T.textMuted, animation: (isSpeaking || isListening) ? "pulse 1.2s infinite" : "none" }} />
//                       {isSpeaking ? "Maya speaking" : isListening ? "Listening…" : "Waiting"}
//                     </div>
//                   </div>
//                 )}
//               </div>
//             </div>
//           </div>
//         </div>
//       </div>
//     </>
//   );
// }






































// "use client";

// import { useCallback, useEffect, useRef, useState } from "react";
// import { useRouter } from "next/navigation";
// import {
//   Loader2,
//   Mic,
//   MicOff,
//   Send,
//   Volume2,
//   CheckCircle,
//   Clock,
//   MessageSquare,
//   BarChart2,
//   Camera,
//   Sun,
//   Moon,
//   ChevronRight,
//   AlertTriangle,
//   UserX,
// } from "lucide-react";

// // ─── Constants ────────────────────────────────────────────────────────────────

// const SILENCE_MS = 7000;
// const EMPTY_RESPONSE_MS = 10000;
// const TOTAL_Q = 6;
// const EMPTY_RESPONSE_TOKEN = "__EMPTY_RESPONSE__";

// const FACE_ABSENCE_TERMINATE_MS = 15000;
// const FACE_CHECK_INTERVAL_MS = 400;

// const PRESENCE_WARMUP_FRAMES = 6; 
// const CONSECUTIVE_ABSENT_THRESHOLD = 2;
// const UNKNOWN_STREAK_BEFORE_SOFT_ABSENT = 6;

// const FALLBACK_SAMPLE_W = 224;
// const FALLBACK_SAMPLE_H = 168;

// const MIN_FACE_WIDTH_RATIO = 0.04;
// const MIN_FACE_HEIGHT_RATIO = 0.04;

// const CENTER_SKIN_RATIO_MIN = 0.06;  // was 0.012 — require 6% center skin coverage
// const FULL_SKIN_RATIO_MIN   = 0.03;  // was 0.006 — require 3% full-frame skin
// const EDGE_RATIO_MIN        = 0.04;  // was 0.012 — require meaningful edges (faces have edges)
// const EDGE_RATIO_MAX        = 0.16;  // was 0.22  — brick walls exceed this, faces don't

// const TEXTURE_COMPLEXITY_MAX = 0.13; // scenes above this are classified as "background texture"

// const THEME_STORAGE_KEY = "maya_theme";

// // ─── ASR corrections ──────────────────────────────────────────────────────────

// const ASR_CORRECTIONS: [RegExp, string][] = [
//   [/\bgen only\b/gi, "genuinely"],
//   [/\bgenu only\b/gi, "genuinely"],
//   [/\bgenuinely only\b/gi, "genuinely"],
//   [/\binteract to like\b/gi, "interactive, like a"],
//   [/\binteract to\b/gi, "interactive"],
//   [/\backnowledg(?:e|ing) (?:the )?feeling/gi, "acknowledge their feeling"],
//   [/\bfeel judge\b/gi, "feel judged"],
//   [/\bfeel judges\b/gi, "feel judged"],
//   [/\bor present\b/gi, "or pressured"],
//   [/\bleading question[s]?\b/gi, "leading questions"],
//   [/\bmanageable step[s]?\b/gi, "manageable steps"],
//   [/\bmanage a step[s]?\b/gi, "manageable steps"],
//   [/\bmomentom\b/gi, "momentum"],
//   [/\bmomentem\b/gi, "momentum"],
//   [/\bcelebrate small\b/gi, "celebrate small"],
//   [/\bcelebreat\b/gi, "celebrate"],
//   [/\bdistract\b(?!ed|ing)/gi, "distracted"],
//   [/\bit'?s in about\b/gi, "it's not about"],
//   [/\bin about explaining\b/gi, "not about explaining"],
//   [/\bthat is in about\b/gi, "that is not about"],
//   [/\b(\w{3,})\s+\1\b/gi, "$1"],
//   [/\s+na\b\.?/gi, ""],
//   [/\s+yaar\b\.?/gi, ""],
//   [/\s+hai\b\.?/gi, ""],
//   [/\s+na\?\s*/g, ". "],
//   [/\s+only na\b/gi, " only"],
//   [/\bmachine learnings\b/gi, "machine learning"],
//   [/\bmission learning\b/gi, "machine learning"],
//   [/\bmy shin learning\b/gi, "machine learning"],
//   [/\bmisin learning\b/gi, "machine learning"],
//   [/\bmissing learning\b/gi, "machine learning"],
//   [/\bmy scene learning\b/gi, "machine learning"],
//   [/\bmy chin learning\b/gi, "machine learning"],
//   [/\bmachine learner\b/gi, "machine learning"],
//   [/\bmy shin learner\b/gi, "machine learning"],
//   [/\bartificial intelligent\b/gi, "artificial intelligence"],
//   [/\bdeep learnings\b/gi, "deep learning"],
//   [/\bneural network's\b/gi, "neural networks"],
//   [/\bcue math\b/gi, "Cuemath"],
//   [/\bcue maths\b/gi, "Cuemath"],
//   [/\bque math\b/gi, "Cuemath"],
//   [/\bque maths\b/gi, "Cuemath"],
//   [/\bq math\b/gi, "Cuemath"],
//   [/\bkew math\b/gi, "Cuemath"],
//   [/\bqueue math\b/gi, "Cuemath"],
//   [/\bcue mat\b/gi, "Cuemath"],
//   [/\bcu math\b/gi, "Cuemath"],
//   [/\bkyoomath\b/gi, "Cuemath"],
//   [/\bmath's\b/gi, "maths"],
//   [/\bi would of\b/gi, "I would have"],
//   [/\bcould of\b/gi, "could have"],
//   [/\bshould of\b/gi, "should have"],
//   [/\bwould of\b/gi, "would have"],
//   [/\btheir going\b/gi, "they're going"],
//   [/\btheir doing\b/gi, "they're doing"],
//   [/\byour welcome\b/gi, "you're welcome"],
//   [/\bits a\b/gi, "it's a"],
//   [/\bi am having\b/gi, "I have"],
//   [/\bI done\b/g, "I did"],
//   [/\bI am knowing\b/gi, "I know"],
//   [/\bI am understanding\b/gi, "I understand"],
//   [/\bI am thinking\b/gi, "I think"],
//   [/\btry your different\b/gi, "try a different"],
//   [/\brelated to something they are familiar\b/gi, "related to something they're familiar"],
//   [/\bbuild the confidence\b/gi, "build their confidence"],
//   [/\bbuild (?:a )?confidence\b/gi, "build confidence"],
//   [/\bgiving them right answer\b/gi, "giving them the right answer"],
//   [/\bgiving (?:the )?right answer\b/gi, "giving the right answer"],
//   [/\bsmall manageable\b/gi, "smaller, manageable"],
//   [/\bbreak (?:the )?problem into\b/gi, "break the problem into"],
//   [/\bsort reset\b/gi, "sort of a reset"],
//   [/\beven is sort reset\b/gi, "which is sort of a reset"],
//   [/\bsometimes even is\b/gi, "sometimes, even a"],
//   [/\bthink out loud\b/gi, "think out loud"],
//   [/\bthink aloud\b/gi, "think out loud"],
//   [/\bto all them more\b/gi, "to ask them more"],
//   [/\ball them\b/gi, "ask them"],
//   [/\s{2,}/g, " "],
// ];

// function correctASRText(text: string): string {
//   let result = text;
//   for (const [pattern, replacement] of ASR_CORRECTIONS) {
//     result = result.replace(pattern, replacement);
//   }
//   return result.trim();
// }

// // ─── Types ────────────────────────────────────────────────────────────────────

// interface Message {
//   role: "user" | "assistant";
//   content: string;
// }

// interface DetectedFace {
//   boundingBox: DOMRectReadOnly;
// }

// interface BrowserFaceDetector {
//   detect: (image: CanvasImageSource) => Promise<DetectedFace[]>;
// }

// declare global {
//   interface Window {
//     SpeechRecognition?: new () => BSR;
//     webkitSpeechRecognition?: new () => BSR;
//     FaceDetector?: new (options?: {
//       fastMode?: boolean;
//       maxDetectedFaces?: number;
//     }) => BrowserFaceDetector;
//   }
// }

// interface BSR {
//   continuous: boolean;
//   interimResults: boolean;
//   lang: string;
//   start: () => void;
//   stop: () => void;
//   onresult: ((e: BSREvent) => void) | null;
//   onend: (() => void) | null;
//   onerror: ((e: BSRError) => void) | null;
//   onaudiostart: (() => void) | null;
// }

// interface BSREvent {
//   resultIndex: number;
//   results: {
//     length: number;
//     [i: number]: { isFinal: boolean; 0: { transcript: string } };
//   };
// }

// interface BSRError {
//   error?: string;
// }

// type PresenceState = "present" | "absent" | "unknown";

// const QUESTION_BANK = [
//   "To kick things off, could you tell me a little about yourself and what drew you to tutoring?",
//   "Imagine you're explaining fractions to a 9-year-old who's been staring blankly — how would you approach that?",
//   "Picture a student who's been stuck on the same problem for 5 minutes and says they want to give up. What do you do in that moment?",
//   "How do you keep a child engaged and motivated when you can tell they're bored or distracted?",
//   "What does patience genuinely mean to you as a tutor — not just in theory, but day to day?",
//   "[name], thank you so much for your time today. We'll be in touch soon with next steps. Best of luck — I'm rooting for you!",
// ];

// const QUESTION_OPENERS = [
//   "",
//   "Great, let's move to the next one.",
//   "Good, here's the next scenario.",
//   "Thanks for that. Next question:",
//   "Appreciated. One more:",
//   "",
// ];

// function buildFallbackReply(
//   questionCount: number,
//   name: string,
//   userText: string,
//   retryCount: number
// ): { reply: string; shouldAdvance: boolean } {
//   const t = userText.toLowerCase();
//   const questionIndex = Math.max(
//     0,
//     Math.min(questionCount - 1, QUESTION_BANK.length - 2)
//   );
//   const nextIdx = Math.min(questionIndex + 1, QUESTION_BANK.length - 1);

//   const wantsToSkip =
//     t.includes("next question") ||
//     t.includes("move on") ||
//     t.includes("skip") ||
//     t.includes("next one") ||
//     t.includes("agle question") ||
//     t.includes("next pe") ||
//     (t.includes("next") && t.length <= 10);

//   if (wantsToSkip) {
//     if (nextIdx >= QUESTION_BANK.length - 1) {
//       return {
//         reply: QUESTION_BANK[QUESTION_BANK.length - 1].replace("[name]", name),
//         shouldAdvance: true,
//       };
//     }
//     const opener = QUESTION_OPENERS[nextIdx] || "Of course, let's move on.";
//     return {
//       reply: `${opener} ${QUESTION_BANK[nextIdx]}`,
//       shouldAdvance: true,
//     };
//   }

//   const currentQuestion = QUESTION_BANK[questionIndex];

//   const isCasualOrGreeting =
//     t.includes("good morning") ||
//     t.includes("good afternoon") ||
//     t.includes("good evening") ||
//     t.includes("nice to meet") ||
//     t.includes("how are you") ||
//     t.includes("how is your day") ||
//     t.includes("how's your day") ||
//     t.includes("hello") ||
//     (t.includes("hi") && userText.split(" ").length <= 5);

//   if (retryCount === 0) {
//     const isNonAnswer =
//       t === "no" ||
//       t === "nothing" ||
//       t === "idk" ||
//       t.includes("don't know") ||
//       t.includes("dont know") ||
//       t.includes("not sure") ||
//       t.includes("no idea") ||
//       t === "(no verbal response given)" ||
//       t === "no response";

//     const isClarificationRequest =
//       t.includes("means what") ||
//       t.includes("explain me") ||
//       t.includes("more detail") ||
//       t.includes("what should i") ||
//       t.includes("how should i") ||
//       t.includes("what to say") ||
//       t.includes("what do you mean") ||
//       t.includes("can you explain") ||
//       t.includes("rephrase") ||
//       t.includes("clarify");

//     if (isCasualOrGreeting) {
//       const warmResponses = [
//         "I'm doing wonderfully, thank you so much for asking — it really means a lot!",
//         "That's so sweet of you to ask! I'm great, thank you!",
//         "Aww, I appreciate that! Doing really well, thank you!",
//       ];
//       const warmResponse =
//         warmResponses[Math.floor(Math.random() * warmResponses.length)];
//       return {
//         reply: `${warmResponse} ${currentQuestion}`,
//         shouldAdvance: false,
//       };
//     }

//     if (isNonAnswer) {
//       return {
//         reply: `No worries at all — take your time! ${currentQuestion}`,
//         shouldAdvance: false,
//       };
//     }

//     if (isClarificationRequest) {
//       return {
//         reply: `Of course! Just share what you personally would do or say in that moment — there's no right or wrong answer. ${currentQuestion}`,
//         shouldAdvance: false,
//       };
//     }

//     return {
//       reply: `I'd love to hear a little bit more from you on this. ${currentQuestion}`,
//       shouldAdvance: false,
//     };
//   }

//   if (nextIdx >= QUESTION_BANK.length - 1) {
//     return {
//       reply: QUESTION_BANK[QUESTION_BANK.length - 1].replace("[name]", name),
//       shouldAdvance: true,
//     };
//   }

//   const advanceMessages = isCasualOrGreeting
//     ? "No worries at all — let's jump into it together!"
//     : "Absolutely no pressure — let's move forward.";

//   return {
//     reply: `${advanceMessages} ${QUESTION_BANK[nextIdx]}`,
//     shouldAdvance: true,
//   };
// }

// // ─── Skin detection helpers ───────────────────────────────────────────────────

// function rgbToYCrCb(r: number, g: number, b: number) {
//   const y  = 0.299 * r + 0.587 * g + 0.114 * b;
//   const cb = 128 - 0.168736 * r - 0.331264 * g + 0.5 * b;
//   const cr = 128 + 0.5 * r - 0.418688 * g - 0.081312 * b;
//   return { y, cb, cr };
// }

// function isSkinPixel(r: number, g: number, b: number): boolean {
//   const { y, cb, cr } = rgbToYCrCb(r, g, b);
//   const rgbRule =
//     r > 60 &&      // BUG-V6-1: raised from 40 to 60 — more selective
//     g > 30 &&      // raised from 20
//     b > 15 &&      // raised from 10
//     Math.max(r, g, b) - Math.min(r, g, b) > 20 && // raised from 15
//     Math.abs(r - g) > 12 && // raised from 10
//     r >= g &&
//     r >= b;
//   const ycbcrRule =
//     y > 50 &&      // raised from 30
//     cb >= 80 && cb <= 130 &&   // tightened from 77-135
//     cr >= 135 && cr <= 175;    // tightened from 133-180
//   // BUG-V6-1: Require BOTH rules to agree for more confident skin detection
//   return rgbRule && ycbcrRule;
// }

// function sobelLikeEdgeScore(
//   gray: Uint8ClampedArray,
//   w: number,
//   h: number
// ): number {
//   let strongEdges = 0;
//   const total = (w - 2) * (h - 2);
//   for (let y = 1; y < h - 1; y++) {
//     for (let x = 1; x < w - 1; x++) {
//       const i = y * w + x;
//       const gx =
//         -gray[i - w - 1] -
//         2 * gray[i - 1] -
//         gray[i + w - 1] +
//         gray[i - w + 1] +
//         2 * gray[i + 1] +
//         gray[i + w + 1];
//       const gy =
//         -gray[i - w - 1] -
//         2 * gray[i - w] -
//         gray[i - w + 1] +
//         gray[i + w - 1] +
//         2 * gray[i + w] +
//         gray[i + w + 1];
//       if (Math.abs(gx) + Math.abs(gy) > 180) strongEdges++;
//     }
//   }
//   return total > 0 ? strongEdges / total : 0;
// }

// // ─── Theme tokens ─────────────────────────────────────────────────────────────

// const DARK = {
//   page: "bg-[radial-gradient(circle_at_top,rgba(139,92,246,0.12),transparent_28%),radial-gradient(circle_at_top_right,rgba(192,38,211,0.10),transparent_24%),linear-gradient(180deg,#050816_0%,#0a1124_42%,#0b1022_100%)] text-slate-50",
//   header: "bg-[#081221]/82 border-white/10 supports-[backdrop-filter]:bg-[#081221]/72 backdrop-blur-2xl",
//   card: "border border-white/10 bg-[linear-gradient(180deg,rgba(17,24,39,0.95),rgba(11,16,34,0.98))] shadow-[0_24px_72px_rgba(0,0,0,0.42)]",
//   panel: "border border-white/10 bg-[linear-gradient(180deg,rgba(17,24,39,0.72),rgba(10,16,32,0.90))]",
//   bubbleAssistant: "border border-white/10 bg-[linear-gradient(180deg,rgba(17,24,39,0.98),rgba(12,18,36,0.96))] text-slate-50 shadow-[0_12px_30px_rgba(2,8,23,0.24)]",
//   bubbleUser: "bg-gradient-to-br from-violet-600 via-fuchsia-600 to-violet-600 text-white shadow-[0_14px_34px_rgba(139,92,246,0.30)]",
//   textSoft: "text-slate-300",
//   textMuted: "text-slate-400",
//   input: "border-white/10 bg-[#0a1220] text-slate-50 placeholder:text-slate-400 shadow-inner shadow-black/20",
//   actionSecondary: "bg-white/[0.04] hover:bg-white/[0.08] border-white/10 text-slate-100 hover:text-white",
//   actionDanger: "bg-gradient-to-r from-rose-500 to-red-500 hover:from-rose-400 hover:to-red-400 shadow-[0_14px_34px_rgba(239,68,68,0.28)]",
//   progressBg: "bg-white/10",
//   footer: "border-white/10 bg-white/[0.02]",
//   chip: "border-violet-400/20 bg-violet-400/10 text-violet-200",
//   emeraldChip: "border-emerald-400/20 bg-emerald-400/10 text-emerald-200",
//   stepActive: "border-violet-400/28 bg-violet-400/[0.07] shadow-[0_10px_26px_rgba(139,92,246,0.12)]",
//   stepInactive: "opacity-65",
//   toggleBg: "bg-white/[0.04] border-white/10",
//   toggleIcon: "text-violet-200",
//   stepIconActive: "bg-violet-500/18",
//   stepIconInactive: "bg-white/[0.05]",
// };

// const LIGHT = {
//   page: "bg-[radial-gradient(circle_at_top,rgba(124,58,237,0.10),transparent_30%),radial-gradient(circle_at_top_right,rgba(162,28,175,0.08),transparent_24%),linear-gradient(180deg,#f6f8fc_0%,#eef2ff_42%,#f8fafc_100%)] text-slate-900",
//   header: "bg-white/86 border-slate-200 supports-[backdrop-filter]:bg-white/76 backdrop-blur-2xl",
//   card: "border border-slate-200 bg-white shadow-[0_24px_72px_rgba(15,23,42,0.08)]",
//   panel: "border border-slate-200 bg-[linear-gradient(180deg,rgba(248,250,252,0.94),rgba(241,245,249,0.86))]",
//   bubbleAssistant: "border border-slate-200 bg-white text-slate-800 shadow-[0_12px_30px_rgba(15,23,42,0.06)]",
//   bubbleUser: "bg-gradient-to-br from-violet-600 via-fuchsia-600 to-violet-600 text-white shadow-[0_14px_34px_rgba(139,92,246,0.18)]",
//   textSoft: "text-slate-600",
//   textMuted: "text-slate-400",
//   input: "border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 shadow-inner shadow-slate-100",
//   actionSecondary: "bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700 hover:text-slate-900",
//   actionDanger: "bg-gradient-to-r from-rose-500 to-red-500 hover:from-rose-400 hover:to-red-400 shadow-[0_14px_34px_rgba(239,68,68,0.16)]",
//   progressBg: "bg-slate-200",
//   footer: "border-slate-200 bg-white/80",
//   chip: "border-violet-200 bg-violet-50 text-violet-700",
//   emeraldChip: "border-emerald-200 bg-emerald-50 text-emerald-700",
//   stepActive: "border-violet-200 bg-violet-50 shadow-[0_10px_26px_rgba(124,58,237,0.08)]",
//   stepInactive: "opacity-55",
//   toggleBg: "bg-slate-50 border-slate-200",
//   toggleIcon: "text-violet-600",
//   stepIconActive: "bg-violet-100",
//   stepIconInactive: "bg-slate-100",
// };

// const BRIEFING_STEPS = [
//   {
//     icon: MessageSquare,
//     title: "Natural conversation",
//     desc: "I'll ask you thoughtful tutor-screening questions. Speak naturally — the goal is to understand how you communicate and connect with students.",
//   },
//   {
//     icon: Clock,
//     title: "About 8–10 minutes",
//     desc: "The interview is short and focused. There are no trick questions — I'm here to understand how you think and explain.",
//   },
//   {
//     icon: Mic,
//     title: "Voice-first interview",
//     desc: "This interview is designed for speaking, since tutoring happens through live conversation. Microphone is required to proceed.",
//   },
//   {
//     icon: BarChart2,
//     title: "Structured assessment",
//     desc: "After the conversation, you'll get a detailed report across clarity, warmth, patience, simplification, and English fluency.",
//   },
//   {
//     icon: CheckCircle,
//     title: "Be yourself",
//     desc: "There are no perfect answers. I'm looking for warmth, clarity, and genuine care for students — not rehearsed lines.",
//   },
// ];

// // ─── StatusPill ───────────────────────────────────────────────────────────────

// interface StatusPillProps {
//   ok: boolean;
//   icon: React.ReactNode;
//   label: string;
//   C: typeof DARK;
// }

// function StatusPill({ ok, icon, label, C }: StatusPillProps) {
//   return (
//     <div
//       className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium ${
//         ok ? C.emeraldChip : C.chip
//       }`}
//     >
//       {icon}
//       {label}
//     </div>
//   );
// }

// // ─── Component ────────────────────────────────────────────────────────────────

// export default function InterviewPage() {
//   const router = useRouter();

//   const chatEndRef            = useRef<HTMLDivElement | null>(null);
//   const recognitionRef        = useRef<BSR | null>(null);
//   const silenceTimerRef       = useRef<ReturnType<typeof setTimeout> | null>(null);
//   const emptyResponseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
//   const sendMessageRef        = useRef<(t: string) => Promise<void>>(() => Promise.resolve());
//   const finalTranscriptRef    = useRef<string>("");
//   const interimTranscriptRef  = useRef<string>("");
//   const isListeningRef        = useRef(false);
//   const questionCountRef      = useRef(1);
//   const isLoadingRef          = useRef(false);
//   const interviewDoneRef      = useRef(false);
//   const micStateRef           = useRef<"idle" | "requesting" | "granted" | "denied">("idle");
//   const inputModeRef          = useRef<"voice" | "typing">("voice");
//   const supportsSpeechRef     = useRef(false);

//   const silenceAttemptRef = useRef<Record<number, number>>({});
//   const retryCountRef     = useRef<Record<number, number>>({});

//   const briefingVideoRef  = useRef<HTMLVideoElement | null>(null);
//   const interviewVideoRef = useRef<HTMLVideoElement | null>(null);
//   const cameraStreamRef   = useRef<MediaStream | null>(null);
//   const sendInProgressRef = useRef(false);

//   const utteranceSentRef = useRef(false);

//   const faceCheckIntervalRef      = useRef<ReturnType<typeof setInterval> | null>(null);
//   const faceAbsenceTimerRef       = useRef<ReturnType<typeof setTimeout> | null>(null);
//   const faceCanvasRef             = useRef<HTMLCanvasElement | null>(null);
//   const faceAbsenceStartRef       = useRef<number | null>(null);
//   const faceTerminatedRef         = useRef(false);
//   const nativeFaceDetectorRef     = useRef<BrowserFaceDetector | null>(null);
//   const presenceCheckBusyRef      = useRef(false);
//   const consecutiveAbsentCountRef = useRef(0);
//   const unknownPresenceCountRef   = useRef(0);

//   const visibilityHandlerRef = useRef<(() => void) | null>(null);

//   const hardAbortRef = useRef(false);
//   const mountedRef   = useRef(true);

//   const deviceCheckRunningRef = useRef(false);

//   const [theme, setTheme] = useState<"dark" | "light">("dark");
//   const C = theme === "dark" ? DARK : LIGHT;

//   const [screen, setScreen]             = useState<"briefing" | "interview">("briefing");
//   const [briefingStep, setBriefingStep] = useState(0);
//   const [mayaIntroPlayed, setMayaIntroPlayed] = useState(false);
//   const [nameLoaded, setNameLoaded]     = useState(false);
//   const [messages, setMessages]         = useState<Message[]>([]);
//   const [candidateName, setCandidateName] = useState("Candidate");
//   const [candidateEmail, setCandidateEmail] = useState("");
//   const [inputText, setInputText]       = useState("");
//   const [transcriptPreview, setTranscriptPreview] = useState("");
//   const [isListening, setIsListening]   = useState(false);
//   const [isSpeaking, setIsSpeaking]     = useState(false);
//   const [isLoading, setIsLoading]       = useState(false);
//   const [questionCount, setQuestionCount] = useState(1);
//   const [usingFallback, setUsingFallback] = useState(false);
//   const [reportError, setReportError]   = useState("");
//   const [micState, setMicState]         = useState<"idle" | "requesting" | "granted" | "denied">("idle");
//   const [supportsSpeech, setSupportsSpeech] = useState(false);
//   const [inputMode, setInputMode]       = useState<"voice" | "typing">("voice");
//   const [isBeginning, setIsBeginning]   = useState(false);
//   const [cameraState, setCameraState]   = useState<"idle" | "requesting" | "granted" | "denied">("idle");
//   const [micVerified, setMicVerified]   = useState(false);
//   const [cameraVerified, setCameraVerified] = useState(false);
//   const [deviceCheckRunning, setDeviceCheckRunning] = useState(false);
//   const [deviceCheckTranscript, setDeviceCheckTranscript] = useState("");
//   const [showMandatoryWarning, setShowMandatoryWarning] = useState(false);
//   const [faceAbsenceCountdown, setFaceAbsenceCountdown] = useState<number | null>(null);
//   const [terminated, setTerminated]     = useState(false);
//   const [terminationReason, setTerminationReason] = useState("");
//   const [interviewDone, setInterviewDone] = useState(false);
//   const _interviewDone = interviewDone;

//   const displayCount = Math.min(Math.max(questionCount - 1, 0), TOTAL_Q);
//   const progress     = Math.min((displayCount / TOTAL_Q) * 100, 100);

//   const isTypingFallback   = !supportsSpeech || micState === "denied";
//   const isManualTypingMode = supportsSpeech && micState === "granted" && inputMode === "typing";
//   const canUseTyping       = isTypingFallback || isManualTypingMode;

//   const setQCount = useCallback((n: number) => {
//     questionCountRef.current = n;
//     setQuestionCount(n);
//   }, []);

//   const setLoading = useCallback((v: boolean) => {
//     isLoadingRef.current = v;
//     setIsLoading(v);
//   }, []);

//   const setDone = useCallback((v: boolean) => {
//     interviewDoneRef.current = v;
//     setInterviewDone(v);
//   }, []);

//   const setMicStateSynced = useCallback(
//     (v: "idle" | "requesting" | "granted" | "denied") => {
//       micStateRef.current = v;
//       setMicState(v);
//     },
//     []
//   );

//   const setInputModeSynced = useCallback((v: "voice" | "typing") => {
//     inputModeRef.current = v;
//     setInputMode(v);
//   }, []);

//   useEffect(() => {
//     mountedRef.current = true;
//     return () => {
//       mountedRef.current = false;
//       deviceCheckRunningRef.current = false;
//     };
//   }, []);

//   useEffect(() => {
//     const name  = localStorage.getItem("candidate_name") || "Candidate";
//     const email = localStorage.getItem("candidate_email") || "";
//     setCandidateName(name);
//     setCandidateEmail(email);
//     setNameLoaded(true);

//     const hasSpeech =
//       typeof window !== "undefined" &&
//       (!!window.SpeechRecognition || !!window.webkitSpeechRecognition);
//     supportsSpeechRef.current = hasSpeech;
//     setSupportsSpeech(hasSpeech);
//     setInputModeSynced(hasSpeech ? "voice" : "typing");

//     const savedTheme = localStorage.getItem(THEME_STORAGE_KEY) as "dark" | "light" | null;
//     if (savedTheme) setTheme(savedTheme);

//     hardAbortRef.current = false;
//   }, [setInputModeSynced]);

//   useEffect(() => {
//     if (typeof window === "undefined") return;
//     if ("FaceDetector" in window && !nativeFaceDetectorRef.current) {
//       try {
//         nativeFaceDetectorRef.current = new (window.FaceDetector!)({
//           fastMode: true,
//           maxDetectedFaces: 1,
//         });
//       } catch (err) {
//         console.error("face_detector_init_failed:", err);
//         nativeFaceDetectorRef.current = null;
//       }
//     }
//   }, []);

  
//   const screenRef = useRef<"briefing" | "interview">(screen);
//   useEffect(() => {
//     screenRef.current = screen;
//   }, [screen]);

//   const toggleTheme = useCallback(() => {
//     setTheme((t) => {
//       const next = t === "dark" ? "light" : "dark";
//       localStorage.setItem(THEME_STORAGE_KEY, next);
//       return next;
//     });
//   }, []);

//   const parseJson = useCallback(async (res: Response) => {
//     const raw = await res.text();
//     try {
//       return JSON.parse(raw) as Record<string, unknown>;
//     } catch {
//       throw new Error(`Bad response: ${raw.slice(0, 100)}`);
//     }
//   }, []);

//   const clearListeningTimers = useCallback(() => {
//     if (silenceTimerRef.current) {
//       clearTimeout(silenceTimerRef.current);
//       silenceTimerRef.current = null;
//     }
//     if (emptyResponseTimerRef.current) {
//       clearTimeout(emptyResponseTimerRef.current);
//       emptyResponseTimerRef.current = null;
//     }
//   }, []);

//   const stopCameraPreview = useCallback(() => {
//     if (cameraStreamRef.current) {
//       cameraStreamRef.current.getTracks().forEach((track) => track.stop());
//       cameraStreamRef.current = null;
//     }
//     if (briefingVideoRef.current)  briefingVideoRef.current.srcObject = null;
//     if (interviewVideoRef.current) interviewVideoRef.current.srcObject = null;
//   }, []);

//   // BUG-P12 FIX: reads screenRef.current at call time, not stale closure.
//   const attachCameraStreamToVisibleVideo = useCallback(
//     async (retryOnNull = true) => {
//       const stream = cameraStreamRef.current;
//       if (!stream) return;
//       const currentScreen = screenRef.current;
//       const targetVideo =
//         currentScreen === "briefing"
//           ? briefingVideoRef.current
//           : interviewVideoRef.current;
//       if (!targetVideo) {
//         if (retryOnNull) {
//           setTimeout(() => void attachCameraStreamToVisibleVideo(false), 200);
//         }
//         return;
//       }
//       if (targetVideo.srcObject !== stream) {
//         targetVideo.srcObject = stream;
//       }
//       try {
//         await targetVideo.play();
//       } catch (error) {
//         console.error("camera_preview_play_failed:", error);
//       }
//     },
//     []
//   );

//   useEffect(() => {
//     void attachCameraStreamToVisibleVideo();
//   }, [screen, cameraState, attachCameraStreamToVisibleVideo]);

//   const speak = useCallback((text: string): Promise<void> => {
//     return new Promise((resolve) => {
//       if (typeof window === "undefined" || !window.speechSynthesis) {
//         resolve();
//         return;
//       }
//       if (hardAbortRef.current) {
//         resolve();
//         return;
//       }

//       const synth = window.speechSynthesis;
//       synth.cancel();

//       const utterance = new SpeechSynthesisUtterance(text);
//       utterance.rate   = 0.8;
//       utterance.pitch  = 1.4;
//       utterance.volume = 1;
//       utterance.lang   = "en-US";

//       let settled = false;
//       const settle = () => {
//         if (settled) return;
//         settled = true;
//         if (mountedRef.current) setIsSpeaking(false);
//         resolve();
//       };

//       const pickVoice = () => {
//         const voices = synth.getVoices();
//         const chosen =
//           voices.find((v) => v.name === "Microsoft Jenny Online (Natural) - English (United States)") ||
//           voices.find((v) => v.name === "Microsoft Aria Online (Natural) - English (United States)") ||
//           voices.find((v) => v.name === "Microsoft Zira - English (United States)") ||
//           voices.find((v) => /jenny|aria|zira|samantha/i.test(v.name)) ||
//           voices.find((v) => /google uk english female/i.test(v.name)) ||
//           voices.find((v) => /female|woman/i.test(v.name)) ||
//           voices.find((v) => /^en(-|_)/i.test(v.lang)) ||
//           null;
//         if (chosen) utterance.voice = chosen;
//       };

//       if (synth.getVoices().length > 0) {
//         pickVoice();
//       } else {
//         synth.onvoiceschanged = () => pickVoice();
//       }

//       const safetyTimer = window.setTimeout(
//         () => settle(),
//         Math.min(text.length * 85 + 3500, 20000)
//       );

//       const finish = () => {
//         window.clearTimeout(safetyTimer);
//         settle();
//       };

//       utterance.onstart = () => {
//         if (hardAbortRef.current) {
//           synth.cancel();
//           finish();
//           return;
//         }
//         if (mountedRef.current) setIsSpeaking(true);
//       };
//       utterance.onend   = finish;
//       utterance.onerror = finish;

//       try {
//         synth.speak(utterance);
//       } catch {
//         finish();
//       }
//     });
//   }, []);

//   useEffect(() => {
//     chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
//   }, [messages, transcriptPreview, isLoading]);

//   useEffect(() => {
//     if (
//       screen !== "briefing" ||
//       mayaIntroPlayed ||
//       !nameLoaded ||
//       candidateName === "Candidate"
//     )
//       return;

//     const intro = `Hi ${candidateName}! I'm Maya, your AI interviewer from Cuemath. This is a short, voice-first screening interview. Please enable both your microphone and camera before starting — both are required for this interview. I'll guide you through each step.`;

//     const t = setTimeout(() => {
//       hardAbortRef.current = false;
//       void speak(intro);
//       setMayaIntroPlayed(true);
//     }, 800);

//     return () => clearTimeout(t);
//   }, [screen, mayaIntroPlayed, nameLoaded, candidateName, speak]);

//   const requestMicPermission = useCallback(async () => {
//     setMicStateSynced("requesting");
//     try {
//       const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
//       stream.getTracks().forEach((track) => track.stop());
//       setMicStateSynced("granted");
//       setInputModeSynced("voice");
//     } catch {
//       setMicStateSynced("denied");
//       setInputModeSynced("typing");
//       setMicVerified(false);
//     }
//   }, [setMicStateSynced, setInputModeSynced]);

//   const requestCameraPermission = useCallback(async () => {
//     if (cameraStreamRef.current) {
//       cameraStreamRef.current.getTracks().forEach((track) => track.stop());
//       cameraStreamRef.current = null;
//     }
//     setCameraState("requesting");
//     try {
//       const stream = await navigator.mediaDevices.getUserMedia({
//         video: { facingMode: "user", width: { ideal: 640 }, height: { ideal: 360 } },
//         audio: false,
//       });
//       cameraStreamRef.current = stream;
//       const videoTrack = stream.getVideoTracks()[0];
//       if (videoTrack) console.log("camera_track_settings:", videoTrack.getSettings());
//       setCameraState("granted");
//       setCameraVerified(true);
//       const targetVideo =
//         screenRef.current === "briefing" ? briefingVideoRef.current : interviewVideoRef.current;
//       if (targetVideo) {
//         targetVideo.srcObject = stream;
//         try { await targetVideo.play(); } catch (e) { console.error("camera_preview_initial_play_failed:", e); }
//       }
//     } catch (error) {
//       console.error("camera_permission_failed:", error);
//       setCameraState("denied");
//       setCameraVerified(false);
//     }
//   }, []);

//   // BUG-P1 + BUG-P9: deviceCheckRunningRef/state always cleaned up.
//   const verifyMicrophoneWithMaya = useCallback(async () => {
//     if (hardAbortRef.current || deviceCheckRunningRef.current) return;
//     if (typeof window === "undefined" || micStateRef.current !== "granted") return;

//     const SpeechAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
//     if (!SpeechAPI) {
//       await speak("Your browser does not support microphone verification in voice mode. You can still continue.");
//       return;
//     }

//     deviceCheckRunningRef.current = true;
//     setDeviceCheckRunning(true);
//     setDeviceCheckTranscript("");
//     setMicVerified(false);

//     await speak("Let's quickly test your microphone. Please say: Maya, can you hear me clearly?");

//     if (hardAbortRef.current) {
//       deviceCheckRunningRef.current = false;
//       if (mountedRef.current) setDeviceCheckRunning(false);
//       return;
//     }

//     const rec = new SpeechAPI();
//     rec.continuous = false;
//     rec.interimResults = true;
//     rec.lang = "en-IN";

//     let transcript = "";
//     let settled = false;

//     const settle = async (ok: boolean, heardText: string) => {
//       if (settled) return;
//       settled = true;
//       try { rec.stop?.(); } catch {}
//       deviceCheckRunningRef.current = false;
//       if (!mountedRef.current) return;
//       setDeviceCheckRunning(false);
//       setDeviceCheckTranscript(heardText);
//       if (hardAbortRef.current) return;
//       if (ok) {
//         setMicVerified(true);
//         await speak("Yes, I can hear you properly. Your microphone looks good to go.");
//       } else {
//         setMicVerified(false);
//         await speak("I'm not hearing you clearly yet. Please check your microphone and try the test again.");
//       }
//     };

//     const timeout = setTimeout(
//       () => void settle(transcript.trim().length >= 6, transcript.trim()),
//       6000
//     );

//     rec.onresult = (e: BSREvent) => {
//       let finalText = "";
//       let interim = "";
//       for (let i = e.resultIndex; i < e.results.length; i++) {
//         if (e.results[i].isFinal) finalText += e.results[i][0].transcript + " ";
//         else interim += e.results[i][0].transcript;
//       }
//       transcript = (finalText || interim).trim();
//       if (mountedRef.current) setDeviceCheckTranscript(transcript);
//     };

//     rec.onerror = () => {
//       clearTimeout(timeout);
//       void settle(false, transcript.trim());
//     };

//     rec.onend = () => {
//       clearTimeout(timeout);
//       void settle(transcript.trim().length >= 6, transcript.trim());
//     };

//     try {
//       rec.start();
//     } catch {
//       clearTimeout(timeout);
//       deviceCheckRunningRef.current = false;
//       if (mountedRef.current) setDeviceCheckRunning(false);
//       await speak("I couldn't start the microphone test. Please try again.");
//     }
//   }, [speak]);

//   const doSend = useCallback((text: string) => {
//     if (hardAbortRef.current || sendInProgressRef.current) return;
//     if (isLoadingRef.current || interviewDoneRef.current) return;
//     sendInProgressRef.current = true;
//     void sendMessageRef.current(text).finally(() => {
//       sendInProgressRef.current = false;
//     });
//   }, []);

//   const startListening = useCallback(() => {
//     if (hardAbortRef.current) return;
//     if (typeof window === "undefined" || micStateRef.current !== "granted") return;

//     if (isListeningRef.current) {
//       recognitionRef.current?.stop();
//       isListeningRef.current = false;
//       setIsListening(false);
//     }

//     const SpeechAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
//     if (!SpeechAPI) return;

//     finalTranscriptRef.current   = "";
//     interimTranscriptRef.current = "";
//     setTranscriptPreview("");
//     clearListeningTimers();
//     sendInProgressRef.current = false;
//     utteranceSentRef.current  = false;

//     const qAtStart = questionCountRef.current;
//     if (silenceAttemptRef.current[qAtStart] === undefined) {
//       silenceAttemptRef.current[qAtStart] = 0;
//     }

//     const rec = new SpeechAPI();
//     rec.continuous     = true;
//     rec.interimResults = true;
//     rec.lang           = "en-IN";

//     emptyResponseTimerRef.current = setTimeout(() => {
//       if (hardAbortRef.current) return;
//       if (isListeningRef.current) {
//         rec.stop();
//         isListeningRef.current = false;
//         setIsListening(false);
//         setTranscriptPreview("");
//       }
//       if (
//         !utteranceSentRef.current &&
//         !sendInProgressRef.current &&
//         !isLoadingRef.current &&
//         !interviewDoneRef.current
//       ) {
//         const liveQ = questionCountRef.current;
//         const attempts = silenceAttemptRef.current[liveQ] ?? 0;
//         silenceAttemptRef.current[liveQ] = attempts + 1;
//         utteranceSentRef.current = true;
//         doSend(EMPTY_RESPONSE_TOKEN);
//       }
//     }, EMPTY_RESPONSE_MS);

//     rec.onresult = (e: BSREvent) => {
//       if (hardAbortRef.current) return;
//       let newFinal = "";
//       let interim  = "";
//       for (let i = e.resultIndex; i < e.results.length; i++) {
//         if (e.results[i].isFinal) newFinal += e.results[i][0].transcript + " ";
//         else interim += e.results[i][0].transcript;
//       }
//       if (newFinal.trim()) {
//         finalTranscriptRef.current = (finalTranscriptRef.current + " " + newFinal).trim();
//       }
//       interimTranscriptRef.current = interim.trim();
//       const raw     = (finalTranscriptRef.current + " " + interim).trim();
//       const display = correctASRText(raw);
//       if (display) {
//         setTranscriptPreview(display);
//         if (emptyResponseTimerRef.current) {
//           clearTimeout(emptyResponseTimerRef.current);
//           emptyResponseTimerRef.current = null;
//         }
//       }
//       const liveQ = questionCountRef.current;
//       silenceAttemptRef.current[liveQ] = 0;
//       if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
//       const toSubmit = (finalTranscriptRef.current + " " + interim).trim();
//       if (toSubmit) {
//         silenceTimerRef.current = setTimeout(() => {
//           if (hardAbortRef.current || !isListeningRef.current) return;
//           rec.stop();
//           isListeningRef.current = false;
//           setIsListening(false);
//           const corrected = correctASRText(toSubmit);
//           if (
//             !utteranceSentRef.current &&
//             !sendInProgressRef.current &&
//             !isLoadingRef.current &&
//             !interviewDoneRef.current
//           ) {
//             utteranceSentRef.current = true;
//             doSend(corrected);
//           }
//         }, SILENCE_MS);
//       }
//     };

//     rec.onerror = (e: BSRError) => {
//       isListeningRef.current = false;
//       setIsListening(false);
//       clearListeningTimers();
//       recognitionRef.current = null;
//       if (e?.error === "aborted") return;
//       if (e?.error === "not-allowed") {
//         setMicStateSynced("denied");
//         setInputModeSynced("typing");
//         return;
//       }
//       if (hardAbortRef.current || isLoadingRef.current || interviewDoneRef.current) return;
//       const combined = (finalTranscriptRef.current + " " + interimTranscriptRef.current).trim();
//       const partial  = correctASRText(combined);
//       if (partial && !utteranceSentRef.current && !sendInProgressRef.current) {
//         utteranceSentRef.current = true;
//         doSend(partial);
//       } else if (!utteranceSentRef.current && !sendInProgressRef.current) {
//         setTimeout(() => {
//           if (
//             hardAbortRef.current ||
//             isLoadingRef.current ||
//             interviewDoneRef.current ||
//             sendInProgressRef.current ||
//             utteranceSentRef.current
//           )
//             return;
//           utteranceSentRef.current = true;
//           doSend(EMPTY_RESPONSE_TOKEN);
//         }, 1500);
//       }
//     };

//     rec.onend = () => {
//       isListeningRef.current = false;
//       setIsListening(false);
//       clearListeningTimers();
//       recognitionRef.current = null;
//       if (hardAbortRef.current || isLoadingRef.current || interviewDoneRef.current) return;
//       const combined = (finalTranscriptRef.current + " " + interimTranscriptRef.current).trim();
//       const partial  = correctASRText(combined);
//       if (partial && !utteranceSentRef.current && !sendInProgressRef.current) {
//         utteranceSentRef.current = true;
//         doSend(partial);
//       }
//     };

//     recognitionRef.current = rec;
//     rec.start();
//     isListeningRef.current = true;
//     setIsListening(true);
//   }, [clearListeningTimers, doSend, setInputModeSynced, setMicStateSynced]);

//   const stopListening = useCallback(() => {
//     clearListeningTimers();
//     if (recognitionRef.current && isListeningRef.current) {
//       recognitionRef.current.stop();
//     }
//     isListeningRef.current = false;
//     setIsListening(false);
//     if (hardAbortRef.current || isLoadingRef.current || sendInProgressRef.current) return;
//     const combined = (finalTranscriptRef.current + " " + interimTranscriptRef.current).trim();
//     const captured = correctASRText(combined);
//     setTimeout(() => {
//       if (
//         hardAbortRef.current ||
//         sendInProgressRef.current ||
//         isLoadingRef.current ||
//         interviewDoneRef.current ||
//         utteranceSentRef.current
//       )
//         return;
//       utteranceSentRef.current = true;
//       doSend(captured || EMPTY_RESPONSE_TOKEN);
//     }, 300);
//   }, [clearListeningTimers, doSend]);

//   const maybeStartListening = useCallback(() => {
//     if (hardAbortRef.current) return;
//     if (
//       supportsSpeechRef.current &&
//       micStateRef.current === "granted" &&
//       inputModeRef.current === "voice"
//     ) {
//       setTimeout(() => startListening(), 700);
//     }
//   }, [startListening]);

//   const generateReport = useCallback(
//     async (finalMessages: Message[]) => {
//       if (hardAbortRef.current) return;
//       const transcript = finalMessages
//         .map((m) => `${m.role === "user" ? "Candidate" : "Maya"}: ${m.content}`)
//         .join("\n\n");
//       try {
//         localStorage.setItem("interview_transcript", transcript);
//         localStorage.setItem("interview_messages", JSON.stringify(finalMessages));
//         localStorage.setItem("assessment_saved_at", Date.now().toString());
//       } catch {}

//       const tryAssess = async () => {
//         if (hardAbortRef.current) return;
//         const res = await fetch("/api/assess", {
//           method: "POST",
//           headers: { "Content-Type": "application/json" },
//           body: JSON.stringify({ transcript, candidateName }),
//         });
//         const data = await parseJson(res);
//         try {
//           localStorage.setItem("assessment_result", JSON.stringify(data));
//         } catch {}
//         if (!hardAbortRef.current) router.push("/report");
//       };

//       try {
//         await tryAssess();
//       } catch {
//         if (hardAbortRef.current) return;
//         setReportError("Generating report... please wait.");
//         setTimeout(async () => {
//           try {
//             if (!hardAbortRef.current) await tryAssess();
//           } catch {
//             if (!hardAbortRef.current) setReportError("Report failed. Please refresh.");
//           }
//         }, 3000);
//       }
//     },
//     [candidateName, parseJson, router]
//   );

//   // ─── stopPresenceDetection ────────────────────────────────────────────────────

//   const stopPresenceDetection = useCallback(() => {
//     if (faceCheckIntervalRef.current) {
//       clearInterval(faceCheckIntervalRef.current);
//       faceCheckIntervalRef.current = null;
//     }
//     if (faceAbsenceTimerRef.current) {
//       clearTimeout(faceAbsenceTimerRef.current);
//       faceAbsenceTimerRef.current = null;
//     }
//     if (visibilityHandlerRef.current) {
//       document.removeEventListener("visibilitychange", visibilityHandlerRef.current);
//       visibilityHandlerRef.current = null;
//     }
//     faceAbsenceStartRef.current       = null;
//     consecutiveAbsentCountRef.current = 0;
//     unknownPresenceCountRef.current   = 0;
//     setFaceAbsenceCountdown(null);
//   }, []);

//   const sendMessage = useCallback(
//     async (text: string) => {
//       if (hardAbortRef.current) return;
//       const trimmed  = text.trim();
//       const isToken  = text === EMPTY_RESPONSE_TOKEN;
//       const normalizedInput = isToken ? "no response" : trimmed;
//       if ((!trimmed && !isToken) || isLoadingRef.current || interviewDoneRef.current) return;

//       clearListeningTimers();

//       const userMsg: Message = {
//         role:    "user",
//         content: isToken ? "(No verbal response given)" : trimmed,
//       };
//       const updated = [...messages, userMsg];
//       setMessages(updated);
//       setInputText("");
//       setTranscriptPreview("");
//       finalTranscriptRef.current   = "";
//       interimTranscriptRef.current = "";
//       setLoading(true);

//       const currentCount      = questionCountRef.current;
//       const currentRetryCount = retryCountRef.current[currentCount] ?? 0;

//       try {
//         if (hardAbortRef.current) { setLoading(false); return; }

//         const res = await fetch("/api/chat", {
//           method: "POST",
//           headers: { "Content-Type": "application/json" },
//           body: JSON.stringify({
//             messages:      updated,
//             candidateName,
//             questionCount: currentCount,
//             retryCount:    currentRetryCount,
//           }),
//         });

//         if (hardAbortRef.current) { setLoading(false); return; }

//         const data = await parseJson(res);

//         if (hardAbortRef.current) { setLoading(false); return; }

//         if (data?.code === "QUOTA_EXCEEDED" || data?.source === "fallback") {
//           throw new Error("quota_fallback");
//         }

//         if (!res.ok || !data?.text) {
//           throw new Error((data?.error as string) || "unavailable");
//         }

//         const aiMsg: Message = { role: "assistant", content: data.text as string };
//         const final           = [...updated, aiMsg];
//         const nextCount       = data.isFollowUp ? currentCount : currentCount + 1;

//         if (data.isFollowUp) {
//           retryCountRef.current = {
//             ...retryCountRef.current,
//             [currentCount]: currentRetryCount + 1,
//           };
//         } else {
//           retryCountRef.current = {
//             ...retryCountRef.current,
//             [currentCount]: 0,
//             [nextCount]: 0,
//           };
//           silenceAttemptRef.current[nextCount] = 0;
//         }

//         setMessages(final);
//         setQCount(nextCount);

//         if (hardAbortRef.current) { setLoading(false); return; }

//         await speak(data.text as string);

//         if (hardAbortRef.current) { setLoading(false); return; }

//         if (data.isComplete || nextCount >= 7) {
//           setDone(true);
//           setTimeout(() => void generateReport(final), 1200);
//         } else {
//           maybeStartListening();
//         }
//       } catch (err) {
//         if (hardAbortRef.current) { setLoading(false); return; }

//         const msg = err instanceof Error ? err.message : String(err);
//         if (!msg.includes("quota") && msg !== "quota_fallback") {
//           console.error("sendMessage:", err);
//         }

//         const { reply: fb, shouldAdvance } = buildFallbackReply(
//           currentCount,
//           candidateName,
//           normalizedInput,
//           currentRetryCount
//         );
//         const nextCount = shouldAdvance ? currentCount + 1 : currentCount;

//         if (shouldAdvance) {
//           retryCountRef.current = {
//             ...retryCountRef.current,
//             [currentCount]: 0,
//             [nextCount]: 0,
//           };
//           silenceAttemptRef.current[nextCount] = 0;
//         } else {
//           retryCountRef.current = {
//             ...retryCountRef.current,
//             [currentCount]: currentRetryCount + 1,
//           };
//         }

//         const aiMsg: Message = { role: "assistant", content: fb };
//         const final = [...updated, aiMsg];
//         setMessages(final);
//         setQCount(nextCount);
//         setUsingFallback(true);

//         if (hardAbortRef.current) { setLoading(false); return; }

//         await speak(fb);

//         if (hardAbortRef.current) { setLoading(false); return; }

//         if (nextCount >= 7) {
//           setDone(true);
//           setTimeout(() => void generateReport(final), 1200);
//         } else {
//           maybeStartListening();
//         }
//       } finally {
//         setLoading(false);
//       }
//     },
//     [
//       candidateName,
//       clearListeningTimers,
//       generateReport,
//       maybeStartListening,
//       messages,
//       parseJson,
//       setDone,
//       setLoading,
//       setQCount,
//       speak,
//     ]
//   );

//   useEffect(() => {
//     sendMessageRef.current = sendMessage;
//   }, [sendMessage]);


//   const checkPresence = useCallback(async (): Promise<PresenceState> => {
//     const video = interviewVideoRef.current;
//     if (!video) return "unknown";
//     if (video.readyState < 2 || video.videoWidth === 0 || video.videoHeight === 0) return "unknown";
//     if (presenceCheckBusyRef.current) return "unknown";
//     presenceCheckBusyRef.current = true;

//     try {
//       const vw = video.videoWidth;
//       const vh = video.videoHeight;

//       if (nativeFaceDetectorRef.current) {
//         try {
//           const faces = await nativeFaceDetectorRef.current.detect(video);
//           // Native API gives authoritative result: 0 faces = "absent"
//           if (faces.length === 0) {
//             return "absent";
//           }
//           const validFace = faces.some((face) => {
//             const box = face.boundingBox;
//             const cx  = box.x + box.width  / 2;
//             const cy  = box.y + box.height / 2;
//             const insideCentralRegion =
//               cx > vw * 0.12 && cx < vw * 0.88 &&
//               cy > vh * 0.08 && cy < vh * 0.92;
//             const bigEnough =
//               box.width  >= vw * MIN_FACE_WIDTH_RATIO &&
//               box.height >= vh * MIN_FACE_HEIGHT_RATIO;
//             return insideCentralRegion && bigEnough;
//           });
//           return validFace ? "present" : "absent";
//         } catch (err) {
//           console.error("face_detector_detect_failed:", err);
//           // Native API threw — fall through to skin-pixel fallback
//         }
//       }


//       const canvas = faceCanvasRef.current;
//       if (!canvas) return "unknown";
//       const ctx = canvas.getContext("2d", { willReadFrequently: true });
//       if (!ctx) return "unknown";

//       canvas.width  = FALLBACK_SAMPLE_W;
//       canvas.height = FALLBACK_SAMPLE_H;
//       ctx.drawImage(video, 0, 0, FALLBACK_SAMPLE_W, FALLBACK_SAMPLE_H);

//       const imageData = ctx.getImageData(0, 0, FALLBACK_SAMPLE_W, FALLBACK_SAMPLE_H);
//       const data = imageData.data;
//       const gray = new Uint8ClampedArray(FALLBACK_SAMPLE_W * FALLBACK_SAMPLE_H);

//       let fullSkin   = 0;
//       let centerSkin = 0;
//       let centerPixels = 0;


//       const cx1 = Math.floor(FALLBACK_SAMPLE_W * 0.25);
//       const cx2 = Math.floor(FALLBACK_SAMPLE_W * 0.75);
//       const cy1 = Math.floor(FALLBACK_SAMPLE_H * 0.12);
//       const cy2 = Math.floor(FALLBACK_SAMPLE_H * 0.78);

//       for (let y = 0; y < FALLBACK_SAMPLE_H; y++) {
//         for (let x = 0; x < FALLBACK_SAMPLE_W; x++) {
//           const i  = y * FALLBACK_SAMPLE_W + x;
//           const di = i * 4;
//           const r  = data[di];
//           const g  = data[di + 1];
//           const b  = data[di + 2];
//           gray[i]  = Math.round(0.299 * r + 0.587 * g + 0.114 * b);
//           const skin = isSkinPixel(r, g, b);
//           if (skin) fullSkin++;
//           const inCenter = x >= cx1 && x <= cx2 && y >= cy1 && y <= cy2;
//           if (inCenter) {
//             centerPixels++;
//             if (skin) centerSkin++;
//           }
//         }
//       }

//       const fullSkinRatio   = fullSkin / (FALLBACK_SAMPLE_W * FALLBACK_SAMPLE_H);
//       const centerSkinRatio = centerPixels > 0 ? centerSkin / centerPixels : 0;
//       const edgeRatio       = sobelLikeEdgeScore(gray, FALLBACK_SAMPLE_W, FALLBACK_SAMPLE_H);


//       if (edgeRatio > TEXTURE_COMPLEXITY_MAX) {
//         console.log(`presence_fallback: high texture (edgeRatio=${edgeRatio.toFixed(3)}) → absent`);
//         return "absent";
//       }

//       const looksHumanish =
//         centerSkinRatio >= CENTER_SKIN_RATIO_MIN &&  // 6% center skin required
//         fullSkinRatio   >= FULL_SKIN_RATIO_MIN    &&  // 3% full-frame skin required
//         edgeRatio       >= EDGE_RATIO_MIN         &&  // faces have some edges
//         edgeRatio       <= EDGE_RATIO_MAX;            // but not too many

//       console.log(
//         `presence_fallback: center=${(centerSkinRatio*100).toFixed(1)}% full=${(fullSkinRatio*100).toFixed(1)}% edge=${edgeRatio.toFixed(3)} → ${looksHumanish ? "present" : "absent"}`
//       );

//       return looksHumanish ? "present" : "absent";
//     } catch (err) {
//       console.error("presence_check_failed:", err);
//       return "unknown";
//     } finally {
//       presenceCheckBusyRef.current = false;
//     }
//   }, []);

//   const stopEverythingNow = useCallback(() => {
//     hardAbortRef.current = true;
//     stopPresenceDetection();
//     clearListeningTimers();
//     try { recognitionRef.current?.stop(); } catch {}
//     recognitionRef.current    = null;
//     isListeningRef.current    = false;
//     sendInProgressRef.current = false;
//     if (typeof window !== "undefined" && window.speechSynthesis) {
//       window.speechSynthesis.cancel();
//     }
//     stopCameraPreview();
//     setIsListening(false);
//     setIsSpeaking(false);
//     setIsLoading(false);
//   }, [clearListeningTimers, stopCameraPreview, stopPresenceDetection]);

//   const terminateInterview = useCallback(
//     (reason: string) => {
//       if (faceTerminatedRef.current) return;
//       faceTerminatedRef.current = true;
//       stopEverythingNow();
//       setTerminated(true);
//       setTerminationReason(reason);
//     },
//     [stopEverythingNow]
//   );


//   const startPresenceDetection = useCallback(() => {
//     if (faceCheckIntervalRef.current) return;
//     faceAbsenceStartRef.current       = null;
//     faceTerminatedRef.current         = false;
//     consecutiveAbsentCountRef.current = 0;
//     unknownPresenceCountRef.current   = 0;

//     let warmupCount = 0;

//     const handleVisibilityChange = () => {
//       if (document.hidden) {
//         faceAbsenceStartRef.current       = null;
//         consecutiveAbsentCountRef.current = 0;
//         unknownPresenceCountRef.current   = 0;
//         if (mountedRef.current) setFaceAbsenceCountdown(null);
//       }
//     };
//     visibilityHandlerRef.current = handleVisibilityChange;
//     document.addEventListener("visibilitychange", handleVisibilityChange);

//     faceCheckIntervalRef.current = setInterval(() => {
//       if (faceTerminatedRef.current || interviewDoneRef.current || hardAbortRef.current) {
//         if (faceCheckIntervalRef.current) {
//           clearInterval(faceCheckIntervalRef.current);
//           faceCheckIntervalRef.current = null;
//         }
//         if (visibilityHandlerRef.current) {
//           document.removeEventListener("visibilitychange", visibilityHandlerRef.current);
//           visibilityHandlerRef.current = null;
//         }
//         return;
//       }

//       if (document.hidden) return;

//       if (warmupCount < PRESENCE_WARMUP_FRAMES) {
//         warmupCount++;
//         return;
//       }

//       void (async () => {
//         const state = await checkPresence();

//         if (state === "present") {
//           // Face detected — reset everything
//           faceAbsenceStartRef.current       = null;
//           consecutiveAbsentCountRef.current = 0;
//           unknownPresenceCountRef.current   = 0;
//           if (mountedRef.current) setFaceAbsenceCountdown(null);
//           return;
//         }

//         if (state === "unknown") {
//           unknownPresenceCountRef.current += 1;
//           if (unknownPresenceCountRef.current < UNKNOWN_STREAK_BEFORE_SOFT_ABSENT) {
//             // If we have an ongoing absence timer, continue counting down
//             if (faceAbsenceStartRef.current !== null && mountedRef.current) {
//               const absenceMs = Date.now() - faceAbsenceStartRef.current;
//               const remainingSecs = Math.max(0, Math.ceil((FACE_ABSENCE_TERMINATE_MS - absenceMs) / 1000));
//               setFaceAbsenceCountdown(remainingSecs);
//               if (absenceMs >= FACE_ABSENCE_TERMINATE_MS) {
//                 terminateInterview(
//                   "You were not visible in the camera frame for more than 9 seconds. The interview has been terminated as per our proctoring policy."
//                 );
//                 if (mountedRef.current) setFaceAbsenceCountdown(null);
//               }
//             }
//             return;
//           }
//           // Unknown streak long enough — treat as absent
//           consecutiveAbsentCountRef.current += 1;
//         } else {
//           // state === "absent" — definitive
//           unknownPresenceCountRef.current = 0;
//           consecutiveAbsentCountRef.current += 1;
//         }


//         if (consecutiveAbsentCountRef.current < CONSECUTIVE_ABSENT_THRESHOLD) {
//           // Not enough consecutive absent frames yet — wait for more
//           return;
//         }


//         if (faceAbsenceStartRef.current === null) {
//           faceAbsenceStartRef.current = Date.now();
//           console.warn(`presence_detection: absence threshold crossed → starting ${FACE_ABSENCE_TERMINATE_MS/1000}s termination timer`);
//         }

//         const absenceMs = Date.now() - faceAbsenceStartRef.current;
//         const remainingSecs = Math.max(
//           0,
//           Math.ceil((FACE_ABSENCE_TERMINATE_MS - absenceMs) / 1000)
//         );

//         if (mountedRef.current) setFaceAbsenceCountdown(remainingSecs);

//         if (absenceMs >= FACE_ABSENCE_TERMINATE_MS) {
//           terminateInterview(
//             "You were not visible in the camera frame for more than 9 seconds. The interview has been terminated as per our proctoring policy."
//           );
//           if (mountedRef.current) setFaceAbsenceCountdown(null);
//         }
//       })();
//     }, FACE_CHECK_INTERVAL_MS);
//   }, [checkPresence, terminateInterview]);

//   // Cleanup on unmount
//   useEffect(() => {
//     return () => {
//       hardAbortRef.current = true;
//       stopPresenceDetection();
//       clearListeningTimers();
//       try { recognitionRef.current?.stop(); } catch {}
//       recognitionRef.current = null;
//       if (typeof window !== "undefined" && window.speechSynthesis) {
//         window.speechSynthesis.cancel();
//       }
//       stopCameraPreview();
//     };
//   }, [clearListeningTimers, stopCameraPreview, stopPresenceDetection]);

//   const canBeginInterview = micState === "granted" && cameraState === "granted";

//   const beginInterview = useCallback(async () => {
//     if (!canBeginInterview) {
//       setShowMandatoryWarning(true);
//       await speak("Please enable both your microphone and camera before starting the interview. Both are required.");
//       return;
//     }
//     if (isBeginning) return;

//     setIsBeginning(true);
//     setShowMandatoryWarning(false);
//     window.speechSynthesis?.cancel();
//     clearListeningTimers();

//     hardAbortRef.current      = false;
//     faceTerminatedRef.current = false;
//     setTerminated(false);
//     setTerminationReason("");
//     setFaceAbsenceCountdown(null);
//     consecutiveAbsentCountRef.current = 0;
//     unknownPresenceCountRef.current   = 0;

//     retryCountRef.current     = Object.create(null) as Record<number, number>;
//     silenceAttemptRef.current = Object.create(null) as Record<number, number>;
//     sendInProgressRef.current = false;
//     utteranceSentRef.current  = false;
//     setUsingFallback(false);
//     setMessages([]);
//     setTranscriptPreview("");
//     setInputText("");
//     setQuestionCount(1);
//     questionCountRef.current = 1;
//     setDone(false);

//     if (supportsSpeechRef.current && micStateRef.current === "idle") {
//       setMicStateSynced("requesting");
//       try {
//         const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
//         stream.getTracks().forEach((t) => t.stop());
//         setMicStateSynced("granted");
//         setInputModeSynced("voice");
//       } catch {
//         setMicStateSynced("denied");
//         setInputModeSynced("typing");
//       }
//     }

//     setScreen("interview");

//     setTimeout(() => {
//       if (!hardAbortRef.current) {
//         startPresenceDetection();
//         void attachCameraStreamToVisibleVideo(true);
//       }
//     }, 250);

//     setLoading(true);

//     try {
//       const initial: Message[] = [
//         { role: "user", content: `Hi, my name is ${candidateName}.` },
//       ];
//       setMessages(initial);

//       const res = await fetch("/api/chat", {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({
//           messages:       initial,
//           candidateName,
//           questionCount:  1,
//           retryCount:     0,
//           beginInterview: true,
//         }),
//       });

//       const data = await parseJson(res);
//       const text = (data?.text as string) || QUESTION_BANK[0];

//       const aiMsg: Message = { role: "assistant", content: text };
//       const final = [...initial, aiMsg];
//       setMessages(final);
//       setQCount(2);

//       if (hardAbortRef.current) return;
//       await speak(text);

//       if (!hardAbortRef.current) maybeStartListening();
//     } catch (err) {
//       console.error("beginInterview:", err);
//       if (hardAbortRef.current) return;

//       const fallback = QUESTION_BANK[0];
//       const initial: Message[] = [
//         { role: "user", content: `Hi, my name is ${candidateName}.` },
//       ];
//       const aiMsg: Message = { role: "assistant", content: fallback };
//       const final = [...initial, aiMsg];
//       setMessages(final);
//       setQCount(2);
//       await speak(fallback);
//       if (!hardAbortRef.current) maybeStartListening();
//     } finally {
//       setLoading(false);
//       setIsBeginning(false);
//     }
//   }, [
//     attachCameraStreamToVisibleVideo,
//     canBeginInterview,
//     candidateName,
//     clearListeningTimers,
//     isBeginning,
//     maybeStartListening,
//     parseJson,
//     setDone,
//     setInputModeSynced,
//     setLoading,
//     setMicStateSynced,
//     setQCount,
//     speak,
//     startPresenceDetection,
//   ]);

//   const handleReturnHome = useCallback(() => {
//     stopEverythingNow();
//     router.push("/");
//   }, [router, stopEverythingNow]);

//   const handleManualSend = useCallback(() => {
//     const text = inputText.trim();
//     if (
//       !text ||
//       isLoadingRef.current ||
//       sendInProgressRef.current ||
//       interviewDoneRef.current ||
//       hardAbortRef.current
//     )
//       return;
//     doSend(text);
//     setInputText("");
//   }, [doSend, inputText]);

//   // ── Render ─────────────────────────────────────────────────────────────────

//   return (
//     <>
//       {/* Single canvas at component root for face detection */}
//       <canvas ref={faceCanvasRef} className="hidden" aria-hidden="true" />

//       {/* ── Terminated screen ─────────────────────────────────────────────── */}
//       {terminated ? (
//         <div className={`min-h-screen ${C.page} flex items-center justify-center px-6 py-10`}>
//           <div className={`w-full max-w-[680px] rounded-[32px] p-8 md:p-10 ${C.card}`}>
//             <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-rose-500/15 text-rose-400">
//               <UserX size={40} />
//             </div>
//             <h1 className="mt-6 text-center text-2xl font-bold md:text-3xl">
//               Interview terminated
//             </h1>
//             <p className={`mt-4 text-center text-sm leading-7 ${C.textSoft}`}>
//               {terminationReason}
//             </p>
//             <div className={`mt-8 rounded-[16px] border px-5 py-4 text-sm ${theme === "dark" ? "border-amber-400/20 bg-amber-400/10 text-amber-300" : "border-amber-200 bg-amber-50 text-amber-700"}`}>
//               <AlertTriangle size={16} className="mr-2 inline-block" />
//               Please ensure you remain visible in the camera throughout the interview.
//             </div>
//             <button
//               onClick={handleReturnHome}
//               className="mt-8 w-full rounded-[16px] bg-gradient-to-r from-violet-600 via-fuchsia-600 to-violet-600 px-8 py-4 text-base font-semibold text-white shadow-[0_14px_34px_rgba(124,58,237,0.25)] transition hover:from-violet-500 hover:via-fuchsia-500 hover:to-violet-500"
//             >
//               Return to Home
//             </button>
//           </div>
//         </div>
//       ) : screen === "briefing" ? (
//         /* ── Briefing screen ──────────────────────────────────────────────── */
//         <div className={`min-h-screen flex flex-col transition-colors duration-300 ${C.page}`}>
//           <header className={`border-b ${C.header}`}>
//             <div className="mx-auto flex w-full max-w-[1380px] items-center justify-between px-6 py-4">
//               <div className="flex items-center gap-3">
//                 <div className={`flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-600 to-fuchsia-500 text-sm font-semibold text-white shadow-[0_14px_36px_rgba(139,92,246,0.28)] ${isSpeaking ? "animate-pulse" : ""}`}>
//                   M
//                 </div>
//                 <div>
//                   <p className={`text-sm font-semibold ${theme === "dark" ? "text-white" : "text-gray-900"}`}>
//                     Maya · AI Interviewer
//                   </p>
//                   <p className="text-xs text-violet-500">Cuemath Tutor Screener</p>
//                 </div>
//               </div>
//               <div className="flex items-center gap-4">
//                 <div className="text-right">
//                   <p className={`text-sm ${theme === "dark" ? "text-white" : "text-gray-900"}`}>{candidateName}</p>
//                   {candidateEmail ? <p className={`text-xs ${C.textSoft}`}>{candidateEmail}</p> : null}
//                 </div>
//                 <button onClick={toggleTheme} className={`flex h-10 w-10 items-center justify-center rounded-2xl border ${C.toggleBg}`} aria-label="Toggle theme">
//                   {theme === "dark" ? <Sun size={18} className={C.toggleIcon} /> : <Moon size={18} className={C.toggleIcon} />}
//                 </button>
//               </div>
//             </div>
//           </header>

//           <main className="mx-auto flex w-full max-w-[1380px] flex-1 flex-col gap-6 px-6 py-8 lg:flex-row">
//             {/* Left panel — setup */}
//             <section className={`flex w-full flex-col rounded-[30px] p-6 md:p-7 lg:w-[430px] ${C.card}`}>
//               <div className="mb-6">
//                 <div className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-[11px] font-semibold ${C.emeraldChip}`}><span className="h-2 w-2 rounded-full bg-emerald-400" />Screening assistant live</div>
//                 <h1 className="mt-4 text-3xl font-bold leading-tight md:text-[2rem]">Welcome, {candidateName}</h1>
//                 <p className={`mt-3 max-w-md text-sm leading-7 ${C.textSoft}`}>
//                   Complete the quick setup below to start your structured voice interview. Microphone and camera are both required.
//                 </p>
//               </div>

//               <div className={`overflow-hidden rounded-[24px] border ${C.panel}`}>
//                 <div className="relative aspect-video w-full overflow-hidden">
//                   {cameraState === "granted" ? (
//                     <video ref={briefingVideoRef} autoPlay muted playsInline className="h-full w-full object-cover" />
//                   ) : (
//                     <div className="flex h-full w-full items-center justify-center">
//                       <div className="text-center">
//                         <Camera className="mx-auto mb-3 h-10 w-10 text-violet-500" />
//                         <p className={`text-sm ${C.textSoft}`}>Camera preview will appear here</p>
//                       </div>
//                     </div>
//                   )}
//                 </div>
//               </div>

//               <div className="mt-6 grid gap-3">
//                 <button onClick={requestMicPermission} className={`rounded-[16px] border px-4 py-3 text-sm font-semibold ${C.actionSecondary}`}>
//                   {micState === "granted" ? "Microphone enabled" : "Enable microphone"}
//                 </button>
//                 <button onClick={requestCameraPermission} className={`rounded-[16px] border px-4 py-3 text-sm font-semibold ${C.actionSecondary}`}>
//                   {cameraState === "granted" ? "Camera enabled" : "Enable camera"}
//                 </button>
//                 <button
//                   onClick={verifyMicrophoneWithMaya}
//                   disabled={micState !== "granted" || deviceCheckRunning}
//                   className={`rounded-[16px] border px-4 py-3 text-sm font-semibold ${micState !== "granted" || deviceCheckRunning ? "cursor-not-allowed opacity-60" : C.actionSecondary}`}
//                 >
//                   {deviceCheckRunning ? "Testing microphone..." : "Test microphone with Maya"}
//                 </button>
//               </div>

//               <div className="mt-5 flex flex-wrap gap-2">
//                 <StatusPill C={C} ok={micState === "granted"}    icon={<Mic size={14} />}    label={micState === "granted" ? "Mic on" : "Mic off"} />
//                 <StatusPill C={C} ok={cameraState === "granted"} icon={<Camera size={14} />} label={cameraState === "granted" ? "Camera on" : "Camera off"} />
//                 <StatusPill C={C} ok={supportsSpeech}            icon={<Volume2 size={14} />} label={supportsSpeech ? "Voice supported" : "Typing fallback"} />
//               </div>

//               {deviceCheckTranscript ? (
//                 <div className={`mt-4 rounded-[18px] border px-4 py-3 text-xs ${C.panel}`}>
//                   Heard: {deviceCheckTranscript}
//                 </div>
//               ) : null}

//               {showMandatoryWarning ? (
//                 <div className={`mt-4 rounded-[18px] border px-4 py-3 text-xs ${theme === "dark" ? "border-rose-400/30 bg-rose-400/10 text-rose-300" : "border-rose-200 bg-rose-50 text-rose-700"}`}>
//                   Please enable both microphone and camera before starting.
//                 </div>
//               ) : null}

//               <button
//                 onClick={beginInterview}
//                 disabled={!canBeginInterview || isBeginning}
//                 className={`mt-6 inline-flex items-center justify-center gap-2 rounded-[18px] px-5 py-4 text-sm font-semibold text-white ${!canBeginInterview || isBeginning ? "cursor-not-allowed bg-slate-300" : "bg-gradient-to-r from-violet-600 via-fuchsia-600 to-violet-600 hover:from-violet-500 hover:via-fuchsia-500 hover:to-violet-500"}`}
//               >
//                 {isBeginning ? (
//                   <><Loader2 size={16} className="animate-spin" />Starting interview</>
//                 ) : (
//                   <>Begin interview<ChevronRight size={16} /></>
//                 )}
//               </button>
//             </section>

//             {/* Right panel — briefing steps */}
//             <section className={`flex min-w-0 flex-1 flex-col rounded-[28px] p-6 md:p-7 ${C.card}`}>
//               <div className="mb-6 flex items-center justify-between gap-4">
//                 <div>
//                   <p className="text-xs font-semibold uppercase tracking-[0.24em] text-violet-500">Interview briefing</p>
//                   <h2 className="mt-2 text-2xl font-bold md:text-[2rem]">Quick overview before we start</h2>
//                   <p className={`mt-3 max-w-2xl text-sm leading-7 ${C.textSoft}`}>This interview follows a consistent, voice-first screening flow designed to evaluate communication, warmth, patience, and teaching presence.</p>
//                 </div>
//                 <div className={`rounded-full border px-4 py-2 text-xs font-medium ${C.chip}`}>
//                   Step {briefingStep + 1} / {BRIEFING_STEPS.length}
//                 </div>
//               </div>

//               <div className="grid gap-4">
//                 {BRIEFING_STEPS.map((step, idx) => {
//                   const Icon   = step.icon;
//                   const active = idx === briefingStep;
//                   return (
//                     <button
//                       key={step.title}
//                       onClick={() => setBriefingStep(idx)}
//                       className={`flex items-start gap-4 rounded-[18px] border px-5 py-5 text-left transition-all duration-200 ${active ? C.stepActive : C.panel} ${!active ? C.stepInactive : ""}`}
//                     >
//                       <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${active ? C.stepIconActive : C.stepIconInactive}`}>
//                         <Icon size={20} className="text-violet-500" />
//                       </div>
//                       <div>
//                         <p className="font-semibold">{step.title}</p>
//                         <p className={`mt-1 text-sm leading-7 ${C.textSoft}`}>{step.desc}</p>
//                       </div>
//                     </button>
//                   );
//                 })}
//               </div>

//               <div className={`mt-6 rounded-[16px] border px-5 py-4 text-sm ${C.panel}`}>
//                 <p className="font-semibold">Interview rules</p>
//                 <ul className={`mt-3 space-y-2 text-sm leading-7 ${C.textSoft}`}>
//                   <li>• Stay visible in camera throughout the interview.</li>
//                   <li>• If absent for more than 9 seconds, interview ends automatically.</li>
//                   <li>• Speak naturally and answer in your own words.</li>
//                 </ul>
//               </div>
//             </section>
//           </main>
//         </div>
//       ) : (

//         <div className={`h-screen flex flex-col overflow-hidden transition-colors duration-300 ${C.page}`}>
//           <header className={`shrink-0 border-b ${C.header}`} style={{ height: "73px" }}>
//             <div className="mx-auto flex w-full max-w-[1380px] items-center justify-between px-4 py-4 md:px-6">
//               <div className="flex items-center gap-3">
//                 <div className={`flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-600 to-fuchsia-500 text-sm font-semibold text-white shadow-[0_14px_36px_rgba(139,92,246,0.28)] ${isSpeaking ? "animate-pulse" : ""}`}>
//                   M
//                 </div>
//                 <div>
//                   <p className={`text-sm font-semibold ${theme === "dark" ? "text-white" : "text-gray-900"}`}>Maya · AI Interviewer</p>
//                   <p className="text-xs text-violet-500">Cuemath Tutor Screener</p>
//                 </div>
//               </div>
//               <div className="flex items-center gap-4">
//                 <div className="text-right">
//                   <p className={`text-sm ${theme === "dark" ? "text-white" : "text-gray-900"}`}>{candidateName}</p>
//                   {candidateEmail ? <p className={`text-xs ${C.textSoft}`}>{candidateEmail}</p> : null}
//                 </div>
//                 <button onClick={toggleTheme} className={`flex h-10 w-10 items-center justify-center rounded-2xl border ${C.toggleBg}`} aria-label="Toggle theme">
//                   {theme === "dark" ? <Sun size={18} className={C.toggleIcon} /> : <Moon size={18} className={C.toggleIcon} />}
//                 </button>
//               </div>
//             </div>
//           </header>


//           <div className="flex flex-1 overflow-hidden">
//             <div className="mx-auto flex w-full max-w-[1380px] gap-6 px-4 py-6 md:px-6 overflow-hidden">

//               <aside className="hidden w-[360px] shrink-0 lg:block self-start sticky top-0">
//                 <div
//                   className={`rounded-[30px] p-5 overflow-y-auto ${C.card}`}
//                   style={{ height: "calc(100vh - 73px - 3rem)" }}
//                 >
//                   <div className="overflow-hidden rounded-[16px] border border-violet-100/10">
//                     <div className="aspect-video w-full bg-black/10">
//                       {cameraState === "granted" ? (
//                         <video ref={interviewVideoRef} autoPlay muted playsInline className="h-full w-full object-cover" />
//                       ) : (
//                         <div className="flex h-full w-full items-center justify-center">
//                           <Camera className="h-10 w-10 text-violet-500" />
//                         </div>
//                       )}
//                     </div>
//                   </div>

//                   <div className="mt-5 flex items-center justify-between">
//                     <p className="font-semibold">Screening progress</p>
//                     <span className={`text-sm ${C.textSoft}`}>{displayCount}/{TOTAL_Q}</span>
//                   </div>

//                   <div className={`mt-3 h-2 overflow-hidden rounded-full ${C.progressBg}`}>
//                     <div
//                       className="h-full rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-500 transition-all duration-500"
//                       style={{ width: `${progress}%` }}
//                     />
//                   </div>

//                   <div className="mt-5 flex flex-wrap gap-2">
//                     <StatusPill C={C} ok={micState === "granted"}    icon={<Mic size={14} />}    label={micState === "granted" ? "Mic on" : "Mic off"} />
//                     <StatusPill C={C} ok={cameraState === "granted"} icon={<Camera size={14} />} label={cameraState === "granted" ? "Camera on" : "Camera off"} />
//                     <StatusPill C={C} ok={inputMode === "voice"}     icon={<Volume2 size={14} />} label={inputMode === "voice" ? "Voice mode" : "Typing mode"} />
//                   </div>

//                   <div className={`mt-5 rounded-[18px] border px-4 py-4 text-sm ${C.panel}`}>
//                     <p className="font-semibold">Interview rules</p>
//                     <ul className={`mt-2 space-y-2 text-xs leading-6 ${C.textSoft}`}>
//                       <li>• Stay visible in camera throughout the interview.</li>
//                       <li>• If absent for more than 9 seconds, interview ends automatically.</li>
//                       <li>• Speak naturally and answer in your own words.</li>
//                     </ul>
//                   </div>

//                   {faceAbsenceCountdown !== null ? (
//                     <div className={`mt-4 rounded-[18px] border px-4 py-3 text-xs ${theme === "dark" ? "border-amber-400/30 bg-amber-400/10 text-amber-300" : "border-amber-200 bg-amber-50 text-amber-700"}`}>
//                       Stay visible in frame. Interview will terminate in {faceAbsenceCountdown}s if no face is detected.
//                     </div>
//                   ) : null}

//                   {usingFallback ? (
//                     <div className={`mt-4 rounded-[18px] border px-4 py-3 text-xs ${C.panel}`}>
//                       Fallback mode is active for this turn due to model/API unavailability.
//                     </div>
//                   ) : null}

//                   {reportError ? (
//                     <div className="mt-4 rounded-[16px] border border-amber-400/30 bg-amber-400/10 px-4 py-3 text-xs text-amber-300">
//                       {reportError}
//                     </div>
//                   ) : null}
//                 </div>
//               </aside>

//               <section className={`flex min-w-0 flex-1 flex-col rounded-[28px] overflow-hidden ${C.card}`}>
//                 {/* Chat header — pinned, never scrolls */}
//                 <div className={`shrink-0 border-b px-5 py-4 md:px-6 ${C.footer}`}>
//                   <div className="flex flex-wrap items-center justify-between gap-4">
//                     <div>
//                       <p className="text-lg font-semibold md:text-[1.15rem]">Live interview</p>
//                       <p className={`text-sm leading-7 ${C.textSoft}`}>Answer naturally. Maya will guide you through the same structured screening flow, step by step.</p>
//                     </div>
//                     <div className="flex items-center gap-2">
//                       {supportsSpeech && micState === "granted" ? (
//                         <button
//                           onClick={() => setInputModeSynced(inputMode === "voice" ? "typing" : "voice")}
//                           className={`rounded-[16px] border px-4 py-2 text-sm font-medium ${C.actionSecondary}`}
//                         >
//                           Switch to {inputMode === "voice" ? "typing" : "voice"}
//                         </button>
//                       ) : null}
//                       {inputMode === "voice" && micState === "granted" ? (
//                         <button
//                           onClick={isListening ? stopListening : startListening}
//                           className={`inline-flex items-center gap-2 rounded-[16px] px-4 py-2 text-sm font-semibold text-white ${isListening ? "bg-rose-500 hover:bg-rose-400" : "bg-gradient-to-r from-violet-600 via-fuchsia-600 to-violet-600 hover:from-violet-500 hover:via-fuchsia-500 hover:to-violet-500"}`}
//                         >
//                           {isListening ? <MicOff size={16} /> : <Mic size={16} />}
//                           {isListening ? "Stop listening" : "Start listening"}
//                         </button>
//                       ) : null}
//                     </div>
//                   </div>
//                 </div>

//                 <div className="flex-1 overflow-y-auto px-4 py-5 md:px-6">
//                   <div className="mx-auto w-full max-w-[980px] space-y-5">
//                     {messages.map((message, idx) => {
//                       const isUser = message.role === "user";
//                       return (
//                         <div key={`${message.role}-${idx}`} className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
//                           <div className={`max-w-[82%] rounded-[18px] px-5 py-4 ${isUser ? C.bubbleUser : C.bubbleAssistant}`}>
//                             <p className="mb-1 text-sm font-semibold opacity-80">{isUser ? "You" : "Maya"}</p>
//                             <p className="text-[15px] leading-8">{message.content}</p>
//                           </div>
//                         </div>
//                       );
//                     })}

//                     {transcriptPreview ? (
//                       <div className="flex justify-end">
//                         <div className={`max-w-[82%] rounded-[18px] px-5 py-4 ${C.bubbleUser}`}>
//                           <p className="mb-1 text-sm font-semibold opacity-80">You</p>
//                           <p className="text-[15px] leading-8">{transcriptPreview}</p>
//                         </div>
//                       </div>
//                     ) : null}

//                     {isLoading ? (
//                       <div className="flex justify-start">
//                         <div className={`rounded-[18px] px-5 py-4 ${C.bubbleAssistant}`}>
//                           <div className="flex items-center gap-3">
//                             <Loader2 size={18} className="animate-spin" />
//                             <span className="text-sm">Maya is thinking...</span>
//                           </div>
//                         </div>
//                       </div>
//                     ) : null}

//                     <div ref={chatEndRef} />
//                   </div>
//                 </div>


//                 {canUseTyping ? (
//                   <div className={`shrink-0 border-t px-4 py-4 md:px-6 ${C.footer}`}>
//                     <div className="mx-auto flex w-full max-w-[980px] items-end gap-3">
//                       <textarea
//                         value={inputText}
//                         onChange={(e) => setInputText(e.target.value)}
//                         rows={1}
//                         placeholder="Type your answer here..."
//                         className={`min-h-[52px] flex-1 resize-none rounded-[16px] border px-4 py-3 text-sm outline-none ${C.input}`}
//                         onKeyDown={(e) => {
//                           if (e.key === "Enter" && !e.shiftKey) {
//                             e.preventDefault();
//                             handleManualSend();
//                           }
//                         }}
//                       />
//                       <button
//                         onClick={handleManualSend}
//                         disabled={!inputText.trim() || isLoading}
//                         className={`inline-flex h-[52px] items-center justify-center rounded-[16px] px-5 text-sm font-semibold text-white ${!inputText.trim() || isLoading ? "cursor-not-allowed bg-slate-300" : "bg-gradient-to-r from-violet-600 via-fuchsia-600 to-violet-600 hover:from-violet-500 hover:via-fuchsia-500 hover:to-violet-500"}`}
//                       >
//                         <Send size={16} />
//                       </button>
//                     </div>
//                   </div>
//                 ) : (
//                   <div className={`shrink-0 border-t px-4 py-4 md:px-6 ${C.footer}`}>
//                     <div className="mx-auto flex w-full max-w-[980px] items-center justify-between gap-4">
//                       <p className={`text-sm ${C.textSoft}`}>
//                         Voice mode is active. Click <span className="font-semibold">Start listening</span> if Maya is waiting for your response.
//                       </p>
//                       <div className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-medium ${isSpeaking ? C.chip : isListening ? C.emeraldChip : C.panel}`}>
//                         <span className={`h-2 w-2 rounded-full ${isSpeaking ? "bg-violet-400" : isListening ? "bg-emerald-400" : "bg-gray-400"}`} />
//                         {isSpeaking ? "Maya speaking" : isListening ? "Listening" : "Waiting"}
//                       </div>
//                     </div>
//                   </div>
//                 )}
//               </section>
//             </div>
//           </div>
//         </div>
//       )}

//       {/* Suppress unused-var lint for interviewDone */}
//       {_interviewDone && false ? null : null}
//     </>
//   );
// }












// "use client";

// import { useCallback, useEffect, useRef, useState } from "react";
// import { useRouter } from "next/navigation";
// import {
//   Loader2,
//   Mic,
//   MicOff,
//   Send,
//   Volume2,
//   CheckCircle,
//   Clock,
//   MessageSquare,
//   BarChart2,
//   Camera,
//   Sun,
//   Moon,
//   ChevronRight,
//   AlertTriangle,
//   UserX,
//   BrainCircuit,
//   ShieldCheck,
// } from "lucide-react";

// // ─── Constants ────────────────────────────────────────────────────────────────
// const SILENCE_MS = 7000;
// const EMPTY_RESPONSE_MS = 10000;
// const TOTAL_Q = 6;
// const EMPTY_RESPONSE_TOKEN = "__EMPTY_RESPONSE__";

// const FACE_ABSENCE_TERMINATE_MS = 15000;
// const FACE_CHECK_INTERVAL_MS = 400;
// const PRESENCE_WARMUP_FRAMES = 6;
// const CONSECUTIVE_ABSENT_THRESHOLD = 2;
// const UNKNOWN_STREAK_BEFORE_SOFT_ABSENT = 6;
// const FALLBACK_SAMPLE_W = 224;
// const FALLBACK_SAMPLE_H = 168;
// const MIN_FACE_WIDTH_RATIO = 0.04;
// const MIN_FACE_HEIGHT_RATIO = 0.04;
// const CENTER_SKIN_RATIO_MIN = 0.06;
// const FULL_SKIN_RATIO_MIN = 0.03;
// const EDGE_RATIO_MIN = 0.04;
// const EDGE_RATIO_MAX = 0.16;
// const TEXTURE_COMPLEXITY_MAX = 0.13;
// const THEME_STORAGE_KEY = "maya_theme";

// // ─── ASR corrections (100% preserved) ────────────────────────────────────────
// const ASR_CORRECTIONS: [RegExp, string][] = [
//   [/\bgen only\b/gi,"genuinely"],[/\bgenu only\b/gi,"genuinely"],[/\bgenuinely only\b/gi,"genuinely"],
//   [/\binteract to like\b/gi,"interactive, like a"],[/\binteract to\b/gi,"interactive"],
//   [/\backnowledg(?:e|ing) (?:the )?feeling/gi,"acknowledge their feeling"],
//   [/\bfeel judge\b/gi,"feel judged"],[/\bfeel judges\b/gi,"feel judged"],
//   [/\bor present\b/gi,"or pressured"],[/\bleading question[s]?\b/gi,"leading questions"],
//   [/\bmanageable step[s]?\b/gi,"manageable steps"],[/\bmanage a step[s]?\b/gi,"manageable steps"],
//   [/\bmomentom\b/gi,"momentum"],[/\bmomentem\b/gi,"momentum"],
//   [/\bcelebrate small\b/gi,"celebrate small"],[/\bcelebreat\b/gi,"celebrate"],
//   [/\bdistract\b(?!ed|ing)/gi,"distracted"],[/\bit'?s in about\b/gi,"it's not about"],
//   [/\bin about explaining\b/gi,"not about explaining"],[/\bthat is in about\b/gi,"that is not about"],
//   [/\b(\w{3,})\s+\1\b/gi,"$1"],[/\s+na\b\.?/gi,""],[/\s+yaar\b\.?/gi,""],[/\s+hai\b\.?/gi,""],
//   [/\s+na\?\s*/g,". "],[/\s+only na\b/gi," only"],[/\bmachine learnings\b/gi,"machine learning"],
//   [/\bmission learning\b/gi,"machine learning"],[/\bmy shin learning\b/gi,"machine learning"],
//   [/\bmisin learning\b/gi,"machine learning"],[/\bmissing learning\b/gi,"machine learning"],
//   [/\bmy scene learning\b/gi,"machine learning"],[/\bmy chin learning\b/gi,"machine learning"],
//   [/\bmachine learner\b/gi,"machine learning"],[/\bmy shin learner\b/gi,"machine learning"],
//   [/\bartificial intelligent\b/gi,"artificial intelligence"],[/\bdeep learnings\b/gi,"deep learning"],
//   [/\bneural network's\b/gi,"neural networks"],[/\bcue math\b/gi,"Cuemath"],
//   [/\bcue maths\b/gi,"Cuemath"],[/\bque math\b/gi,"Cuemath"],[/\bque maths\b/gi,"Cuemath"],
//   [/\bq math\b/gi,"Cuemath"],[/\bkew math\b/gi,"Cuemath"],[/\bqueue math\b/gi,"Cuemath"],
//   [/\bcue mat\b/gi,"Cuemath"],[/\bcu math\b/gi,"Cuemath"],[/\bkyoomath\b/gi,"Cuemath"],
//   [/\bmath's\b/gi,"maths"],[/\bi would of\b/gi,"I would have"],[/\bcould of\b/gi,"could have"],
//   [/\bshould of\b/gi,"should have"],[/\bwould of\b/gi,"would have"],
//   [/\btheir going\b/gi,"they're going"],[/\btheir doing\b/gi,"they're doing"],
//   [/\byour welcome\b/gi,"you're welcome"],[/\bits a\b/gi,"it's a"],
//   [/\bi am having\b/gi,"I have"],[/\bI done\b/g,"I did"],
//   [/\bI am knowing\b/gi,"I know"],[/\bI am understanding\b/gi,"I understand"],
//   [/\bI am thinking\b/gi,"I think"],[/\btry your different\b/gi,"try a different"],
//   [/\brelated to something they are familiar\b/gi,"related to something they're familiar"],
//   [/\bbuild the confidence\b/gi,"build their confidence"],[/\bbuild (?:a )?confidence\b/gi,"build confidence"],
//   [/\bgiving them right answer\b/gi,"giving them the right answer"],
//   [/\bgiving (?:the )?right answer\b/gi,"giving the right answer"],
//   [/\bsmall manageable\b/gi,"smaller, manageable"],[/\bbreak (?:the )?problem into\b/gi,"break the problem into"],
//   [/\bsort reset\b/gi,"sort of a reset"],[/\beven is sort reset\b/gi,"which is sort of a reset"],
//   [/\bsometimes even is\b/gi,"sometimes, even a"],[/\bthink out loud\b/gi,"think out loud"],
//   [/\bthink aloud\b/gi,"think out loud"],[/\bto all them more\b/gi,"to ask them more"],
//   [/\ball them\b/gi,"ask them"],[/\s{2,}/g," "],
// ];

// function correctASRText(text: string): string {
//   let r = text;
//   for (const [p, s] of ASR_CORRECTIONS) r = r.replace(p, s);
//   return r.trim();
// }

// // ─── Types ────────────────────────────────────────────────────────────────────
// interface Message { role: "user" | "assistant"; content: string; }
// interface DetectedFace { boundingBox: DOMRectReadOnly; }
// interface BrowserFaceDetector { detect: (image: CanvasImageSource) => Promise<DetectedFace[]>; }

// declare global {
//   interface Window {
//     SpeechRecognition?: new () => BSR;
//     webkitSpeechRecognition?: new () => BSR;
//     FaceDetector?: new (options?: { fastMode?: boolean; maxDetectedFaces?: number }) => BrowserFaceDetector;
//   }
// }

// interface BSR {
//   continuous: boolean; interimResults: boolean; lang: string;
//   start: () => void; stop: () => void;
//   onresult: ((e: BSREvent) => void) | null;
//   onend: (() => void) | null;
//   onerror: ((e: BSRError) => void) | null;
//   onaudiostart: (() => void) | null;
// }
// interface BSREvent { resultIndex: number; results: { length: number; [i: number]: { isFinal: boolean; 0: { transcript: string } } }; }
// interface BSRError { error?: string; }
// type PresenceState = "present" | "absent" | "unknown";

// // ─── Fallback question bank (100% preserved) ─────────────────────────────────
// const QUESTION_BANK = [
//   "To kick things off, could you tell me a little about yourself and what drew you to tutoring?",
//   "Imagine you're explaining fractions to a 9-year-old who's been staring blankly — how would you approach that?",
//   "Picture a student who's been stuck on the same problem for 5 minutes and says they want to give up. What do you do in that moment?",
//   "How do you keep a child engaged and motivated when you can tell they're bored or distracted?",
//   "What does patience genuinely mean to you as a tutor — not just in theory, but day to day?",
//   "[name], thank you so much for your time today. We'll be in touch soon with next steps. Best of luck — I'm rooting for you!",
// ];

// const QUESTION_OPENERS = ["","Great, let's move to the next one.","Good, here's the next scenario.","Thanks for that. Next question:","Appreciated. One more:",""];

// function buildFallbackReply(questionCount: number, name: string, userText: string, retryCount: number): { reply: string; shouldAdvance: boolean } {
//   const t = userText.toLowerCase();
//   const questionIndex = Math.max(0, Math.min(questionCount - 1, QUESTION_BANK.length - 2));
//   const nextIdx = Math.min(questionIndex + 1, QUESTION_BANK.length - 1);
//   const wantsToSkip = t.includes("next question")||t.includes("move on")||t.includes("skip")||t.includes("next one")||(t.includes("next")&&t.length<=10);
//   if (wantsToSkip) {
//     if (nextIdx >= QUESTION_BANK.length - 1) return { reply: QUESTION_BANK[QUESTION_BANK.length-1].replace("[name]", name), shouldAdvance: true };
//     const opener = QUESTION_OPENERS[nextIdx] || "Of course, let's move on.";
//     return { reply: `${opener} ${QUESTION_BANK[nextIdx]}`, shouldAdvance: true };
//   }
//   const currentQuestion = QUESTION_BANK[questionIndex];
//   const isCasualOrGreeting = t.includes("good morning")||t.includes("good afternoon")||t.includes("good evening")||t.includes("nice to meet")||t.includes("how are you")||t.includes("how is your day")||t.includes("how's your day")||t.includes("hello")||(t.includes("hi")&&userText.split(" ").length<=5);
//   if (retryCount === 0) {
//     const isNonAnswer = t==="no"||t==="nothing"||t==="idk"||t.includes("don't know")||t.includes("dont know")||t.includes("not sure")||t.includes("no idea")||t==="(no verbal response given)"||t==="no response";
//     const isClarificationRequest = t.includes("means what")||t.includes("explain me")||t.includes("more detail")||t.includes("what should i")||t.includes("how should i")||t.includes("what to say")||t.includes("what do you mean")||t.includes("can you explain")||t.includes("rephrase")||t.includes("clarify");
//     if (isCasualOrGreeting) {
//       const warmResponses = ["I'm doing wonderfully, thank you so much for asking — it really means a lot!","That's so sweet of you to ask! I'm great, thank you!","Aww, I appreciate that! Doing really well, thank you!"];
//       return { reply: `${warmResponses[Math.floor(Math.random()*warmResponses.length)]} ${currentQuestion}`, shouldAdvance: false };
//     }
//     if (isNonAnswer) return { reply: `No worries at all — take your time! ${currentQuestion}`, shouldAdvance: false };
//     if (isClarificationRequest) return { reply: `Of course! Just share what you personally would do or say in that moment — there's no right or wrong answer. ${currentQuestion}`, shouldAdvance: false };
//     return { reply: `I'd love to hear a little bit more from you on this. ${currentQuestion}`, shouldAdvance: false };
//   }
//   if (nextIdx >= QUESTION_BANK.length - 1) return { reply: QUESTION_BANK[QUESTION_BANK.length-1].replace("[name]", name), shouldAdvance: true };
//   const advanceMessages = isCasualOrGreeting ? "No worries at all — let's jump into it together!" : "Absolutely no pressure — let's move forward.";
//   return { reply: `${advanceMessages} ${QUESTION_BANK[nextIdx]}`, shouldAdvance: true };
// }

// // ─── Skin detection helpers (100% preserved) ──────────────────────────────────
// function rgbToYCrCb(r: number, g: number, b: number) {
//   const y=0.299*r+0.587*g+0.114*b; const cb=128-0.168736*r-0.331264*g+0.5*b; const cr=128+0.5*r-0.418688*g-0.081312*b;
//   return { y, cb, cr };
// }
// function isSkinPixel(r: number, g: number, b: number): boolean {
//   const { y, cb, cr } = rgbToYCrCb(r, g, b);
//   const rgbRule = r>60&&g>30&&b>15&&Math.max(r,g,b)-Math.min(r,g,b)>20&&Math.abs(r-g)>12&&r>=g&&r>=b;
//   const ycbcrRule = y>50&&cb>=80&&cb<=130&&cr>=135&&cr<=175;
//   return rgbRule && ycbcrRule;
// }
// function sobelLikeEdgeScore(gray: Uint8ClampedArray, w: number, h: number): number {
//   let strongEdges=0; const total=(w-2)*(h-2);
//   for (let y=1;y<h-1;y++) for (let x=1;x<w-1;x++) {
//     const i=y*w+x;
//     const gx=-gray[i-w-1]-2*gray[i-1]-gray[i+w-1]+gray[i-w+1]+2*gray[i+1]+gray[i+w+1];
//     const gy=-gray[i-w-1]-2*gray[i-w]-gray[i-w+1]+gray[i+w-1]+2*gray[i+w]+gray[i+w+1];
//     if (Math.abs(gx)+Math.abs(gy)>180) strongEdges++;
//   }
//   return total>0 ? strongEdges/total : 0;
// }

// // ─── Briefing steps (100% preserved) ─────────────────────────────────────────
// const BRIEFING_STEPS = [
//   { icon: MessageSquare, title: "Natural conversation", desc: "I'll ask you thoughtful tutor-screening questions. Speak naturally — the goal is to understand how you communicate and connect with students." },
//   { icon: Clock, title: "About 8–10 minutes", desc: "The interview is short and focused. There are no trick questions — I'm here to understand how you think and explain." },
//   { icon: Mic, title: "Voice-first interview", desc: "This interview is designed for speaking, since tutoring happens through live conversation. Microphone is required to proceed." },
//   { icon: BarChart2, title: "Structured assessment", desc: "After the conversation, you'll get a detailed report across clarity, warmth, patience, simplification, and English fluency." },
//   { icon: CheckCircle, title: "Be yourself", desc: "There are no perfect answers. I'm looking for warmth, clarity, and genuine care for students — not rehearsed lines." },
// ];

// // ─── Design tokens ────────────────────────────────────────────────────────────
// const FONTS = `
// @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;1,9..40,400;1,9..40,500&family=DM+Serif+Display:ital@0;1&display=swap');
// *,*::before,*::after { box-sizing: border-box; }
// html,body { margin: 0; padding: 0; font-family: "DM Sans", system-ui, sans-serif; }
// `;

// function getTokens(isDark: boolean) {
//   return isDark ? {
//     pageBg: "#080C14", pageBg2: "#0C1220",
//     gridLine: "rgba(255,255,255,0.03)",
//     text: "#F0F4FF", textSoft: "rgba(220,228,255,0.68)", textMuted: "rgba(220,228,255,0.38)",
//     surface: "#0E1628", surfaceElevated: "#111E35", inset: "#0A1120",
//     border: "rgba(255,255,255,0.08)", borderStrong: "rgba(255,255,255,0.13)",
//     accent: "#4F7BFF", accentAlt: "#8B5CF6", accentGlow: "rgba(79,123,255,0.16)",
//     accentRing: "rgba(79,123,255,0.22)", accentText: "#7BA8FF",
//     success: "#10D9A0", successBg: "rgba(16,217,160,0.08)", successBorder: "rgba(16,217,160,0.18)",
//     danger: "#F87171", dangerBg: "rgba(248,113,113,0.10)", dangerBorder: "rgba(248,113,113,0.22)",
//     warning: "#FBBF24", warningBg: "rgba(251,191,36,0.10)", warningBorder: "rgba(251,191,36,0.22)",
//     inputBg: "rgba(6,10,20,0.95)", inputBorder: "rgba(255,255,255,0.09)", inputFocus: "rgba(79,123,255,0.22)",
//     topbar: "rgba(8,12,20,0.88)",
//     bubbleAI: "#0E1628", bubbleAIBorder: "rgba(255,255,255,0.08)",
//     bubbleUser: "linear-gradient(135deg, #4F7BFF 0%, #8B5CF6 100%)",
//     shadow: "0 24px 64px rgba(0,0,0,0.50)", shadowMd: "0 12px 36px rgba(0,0,0,0.32)",
//     heroGlow1: "rgba(79,123,255,0.10)", heroGlow2: "rgba(139,92,246,0.07)",
//   } : {
//     pageBg: "#F4F6FB", pageBg2: "#EBF0FF",
//     gridLine: "rgba(13,21,38,0.04)",
//     text: "#0D1526", textSoft: "rgba(13,21,38,0.64)", textMuted: "rgba(13,21,38,0.38)",
//     surface: "#FFFFFF", surfaceElevated: "#FFFFFF", inset: "#F5F8FF",
//     border: "rgba(13,21,38,0.08)", borderStrong: "rgba(13,21,38,0.14)",
//     accent: "#3B63E8", accentAlt: "#7C3AED", accentGlow: "rgba(59,99,232,0.10)",
//     accentRing: "rgba(59,99,232,0.14)", accentText: "#3B63E8",
//     success: "#059669", successBg: "rgba(5,150,105,0.07)", successBorder: "rgba(5,150,105,0.18)",
//     danger: "#DC2626", dangerBg: "rgba(220,38,38,0.06)", dangerBorder: "rgba(220,38,38,0.18)",
//     warning: "#D97706", warningBg: "rgba(217,119,6,0.07)", warningBorder: "rgba(217,119,6,0.18)",
//     inputBg: "#FFFFFF", inputBorder: "rgba(13,21,38,0.10)", inputFocus: "rgba(59,99,232,0.16)",
//     topbar: "rgba(244,246,251,0.90)",
//     bubbleAI: "#FFFFFF", bubbleAIBorder: "rgba(13,21,38,0.09)",
//     bubbleUser: "linear-gradient(135deg, #3B63E8 0%, #7C3AED 100%)",
//     shadow: "0 24px 64px rgba(13,21,38,0.09)", shadowMd: "0 12px 36px rgba(13,21,38,0.07)",
//     heroGlow1: "rgba(59,99,232,0.08)", heroGlow2: "rgba(124,58,237,0.05)",
//   };
// }

// // ─── StatusPill ───────────────────────────────────────────────────────────────
// function StatusPill({ ok, icon, label, T }: { ok: boolean; icon: React.ReactNode; label: string; T: ReturnType<typeof getTokens> }) {
//   return (
//     <div style={{
//       display: "inline-flex", alignItems: "center", gap: 6, padding: "4px 10px",
//       borderRadius: 999, border: `1px solid ${ok ? T.successBorder : T.border}`,
//       background: ok ? T.successBg : "transparent",
//       color: ok ? T.success : T.textMuted, fontSize: 11, fontWeight: 600,
//     }}>
//       {icon}{label}
//     </div>
//   );
// }

// // ─── Main Component ───────────────────────────────────────────────────────────
// export default function InterviewPage() {
//   const router = useRouter();

//   // Refs (100% preserved logic)
//   const chatEndRef = useRef<HTMLDivElement|null>(null);
//   const recognitionRef = useRef<BSR|null>(null);
//   const silenceTimerRef = useRef<ReturnType<typeof setTimeout>|null>(null);
//   const emptyResponseTimerRef = useRef<ReturnType<typeof setTimeout>|null>(null);
//   const sendMessageRef = useRef<(t:string)=>Promise<void>>(()=>Promise.resolve());
//   const finalTranscriptRef = useRef<string>("");
//   const interimTranscriptRef = useRef<string>("");
//   const isListeningRef = useRef(false);
//   const questionCountRef = useRef(1);
//   const isLoadingRef = useRef(false);
//   const interviewDoneRef = useRef(false);
//   const micStateRef = useRef<"idle"|"requesting"|"granted"|"denied">("idle");
//   const inputModeRef = useRef<"voice"|"typing">("voice");
//   const supportsSpeechRef = useRef(false);
//   const silenceAttemptRef = useRef<Record<number,number>>({});
//   const retryCountRef = useRef<Record<number,number>>({});
//   const briefingVideoRef = useRef<HTMLVideoElement|null>(null);
//   const interviewVideoRef = useRef<HTMLVideoElement|null>(null);
//   const cameraStreamRef = useRef<MediaStream|null>(null);
//   const sendInProgressRef = useRef(false);
//   const utteranceSentRef = useRef(false);
//   const faceCheckIntervalRef = useRef<ReturnType<typeof setInterval>|null>(null);
//   const faceAbsenceTimerRef = useRef<ReturnType<typeof setTimeout>|null>(null);
//   const faceCanvasRef = useRef<HTMLCanvasElement|null>(null);
//   const faceAbsenceStartRef = useRef<number|null>(null);
//   const faceTerminatedRef = useRef(false);
//   const nativeFaceDetectorRef = useRef<BrowserFaceDetector|null>(null);
//   const presenceCheckBusyRef = useRef(false);
//   const consecutiveAbsentCountRef = useRef(0);
//   const unknownPresenceCountRef = useRef(0);
//   const visibilityHandlerRef = useRef<(()=>void)|null>(null);
//   const hardAbortRef = useRef(false);
//   const mountedRef = useRef(true);
//   const deviceCheckRunningRef = useRef(false);

//   // State
//   const [theme, setTheme] = useState<"dark"|"light">("dark");
//   const T = getTokens(theme === "dark");

//   const [screen, setScreen] = useState<"briefing"|"interview">("briefing");
//   const [briefingStep, setBriefingStep] = useState(0);
//   const [mayaIntroPlayed, setMayaIntroPlayed] = useState(false);
//   const [nameLoaded, setNameLoaded] = useState(false);
//   const [messages, setMessages] = useState<Message[]>([]);
//   const [candidateName, setCandidateName] = useState("Candidate");
//   const [candidateEmail, setCandidateEmail] = useState("");
//   const [inputText, setInputText] = useState("");
//   const [transcriptPreview, setTranscriptPreview] = useState("");
//   const [isListening, setIsListening] = useState(false);
//   const [isSpeaking, setIsSpeaking] = useState(false);
//   const [isLoading, setIsLoading] = useState(false);
//   const [questionCount, setQuestionCount] = useState(1);
//   const [usingFallback, setUsingFallback] = useState(false);
//   const [reportError, setReportError] = useState("");
//   const [micState, setMicState] = useState<"idle"|"requesting"|"granted"|"denied">("idle");
//   const [supportsSpeech, setSupportsSpeech] = useState(false);
//   const [inputMode, setInputMode] = useState<"voice"|"typing">("voice");
//   const [isBeginning, setIsBeginning] = useState(false);
//   const [cameraState, setCameraState] = useState<"idle"|"requesting"|"granted"|"denied">("idle");
//   const [micVerified, setMicVerified] = useState(false);
//   const [cameraVerified, setCameraVerified] = useState(false);
//   const [deviceCheckRunning, setDeviceCheckRunning] = useState(false);
//   const [deviceCheckTranscript, setDeviceCheckTranscript] = useState("");
//   const [showMandatoryWarning, setShowMandatoryWarning] = useState(false);
//   const [faceAbsenceCountdown, setFaceAbsenceCountdown] = useState<number|null>(null);
//   const [terminated, setTerminated] = useState(false);
//   const [terminationReason, setTerminationReason] = useState("");
//   const [interviewDone, setInterviewDone] = useState(false);
//   const _interviewDone = interviewDone;

//   const displayCount = Math.min(Math.max(questionCount-1,0), TOTAL_Q);
//   const progress = Math.min((displayCount/TOTAL_Q)*100, 100);
//   const isTypingFallback = !supportsSpeech || micState === "denied";
//   const isManualTypingMode = supportsSpeech && micState === "granted" && inputMode === "typing";
//   const canUseTyping = isTypingFallback || isManualTypingMode;

//   const setQCount = useCallback((n:number)=>{ questionCountRef.current=n; setQuestionCount(n); },[]);
//   const setLoading = useCallback((v:boolean)=>{ isLoadingRef.current=v; setIsLoading(v); },[]);
//   const setDone = useCallback((v:boolean)=>{ interviewDoneRef.current=v; setInterviewDone(v); },[]);
//   const setMicStateSynced = useCallback((v:"idle"|"requesting"|"granted"|"denied")=>{ micStateRef.current=v; setMicState(v); },[]);
//   const setInputModeSynced = useCallback((v:"voice"|"typing")=>{ inputModeRef.current=v; setInputMode(v); },[]);

//   const screenRef = useRef<"briefing"|"interview">(screen);
//   useEffect(()=>{ screenRef.current=screen; },[screen]);

//   useEffect(()=>{ mountedRef.current=true; return()=>{ mountedRef.current=false; deviceCheckRunningRef.current=false; }; },[]);

//   useEffect(()=>{
//     const name=localStorage.getItem("candidate_name")||"Candidate";
//     const email=localStorage.getItem("candidate_email")||"";
//     setCandidateName(name); setCandidateEmail(email); setNameLoaded(true);
//     const hasSpeech=typeof window!=="undefined"&&(!!window.SpeechRecognition||!!window.webkitSpeechRecognition);
//     supportsSpeechRef.current=hasSpeech; setSupportsSpeech(hasSpeech); setInputModeSynced(hasSpeech?"voice":"typing");
//     const savedTheme=localStorage.getItem(THEME_STORAGE_KEY) as "dark"|"light"|null;
//     if (savedTheme) setTheme(savedTheme);
//     hardAbortRef.current=false;
//   },[setInputModeSynced]);

//   useEffect(()=>{
//     if (typeof window==="undefined") return;
//     if ("FaceDetector" in window && !nativeFaceDetectorRef.current) {
//       try { nativeFaceDetectorRef.current=new (window.FaceDetector!)({ fastMode:true, maxDetectedFaces:1 }); }
//       catch(err) { console.error("face_detector_init_failed:", err); nativeFaceDetectorRef.current=null; }
//     }
//   },[]);

//   const toggleTheme = useCallback(()=>{
//     setTheme(t=>{ const next=t==="dark"?"light":"dark"; localStorage.setItem(THEME_STORAGE_KEY,next); return next; });
//   },[]);

//   const parseJson = useCallback(async(res:Response)=>{
//     const raw=await res.text();
//     try { return JSON.parse(raw) as Record<string,unknown>; }
//     catch { throw new Error(`Bad response: ${raw.slice(0,100)}`); }
//   },[]);

//   const clearListeningTimers = useCallback(()=>{
//     if (silenceTimerRef.current) { clearTimeout(silenceTimerRef.current); silenceTimerRef.current=null; }
//     if (emptyResponseTimerRef.current) { clearTimeout(emptyResponseTimerRef.current); emptyResponseTimerRef.current=null; }
//   },[]);

//   const stopCameraPreview = useCallback(()=>{
//     if (cameraStreamRef.current) { cameraStreamRef.current.getTracks().forEach(t=>t.stop()); cameraStreamRef.current=null; }
//     if (briefingVideoRef.current) briefingVideoRef.current.srcObject=null;
//     if (interviewVideoRef.current) interviewVideoRef.current.srcObject=null;
//   },[]);

//   const attachCameraStreamToVisibleVideo = useCallback(async(retryOnNull=true)=>{
//     const stream=cameraStreamRef.current; if (!stream) return;
//     const currentScreen=screenRef.current;
//     const targetVideo=currentScreen==="briefing"?briefingVideoRef.current:interviewVideoRef.current;
//     if (!targetVideo) { if (retryOnNull) setTimeout(()=>void attachCameraStreamToVisibleVideo(false),200); return; }
//     if (targetVideo.srcObject!==stream) targetVideo.srcObject=stream;
//     try { await targetVideo.play(); } catch(e) { console.error("camera_preview_play_failed:",e); }
//   },[]);

//   useEffect(()=>{ void attachCameraStreamToVisibleVideo(); },[screen,cameraState,attachCameraStreamToVisibleVideo]);

//   const speak = useCallback((text:string):Promise<void>=>{
//     return new Promise(resolve=>{
//       if (typeof window==="undefined"||!window.speechSynthesis) { resolve(); return; }
//       if (hardAbortRef.current) { resolve(); return; }
//       const synth=window.speechSynthesis; synth.cancel();
//       const utterance=new SpeechSynthesisUtterance(text);
//       utterance.rate=0.8; utterance.pitch=1.4; utterance.volume=1; utterance.lang="en-US";
//       let settled=false;
//       const settle=()=>{ if(settled)return; settled=true; if(mountedRef.current)setIsSpeaking(false); resolve(); };
//       const pickVoice=()=>{
//         const voices=synth.getVoices();
//         const chosen=voices.find(v=>v.name==="Microsoft Jenny Online (Natural) - English (United States)")||voices.find(v=>v.name==="Microsoft Aria Online (Natural) - English (United States)")||voices.find(v=>v.name==="Microsoft Zira - English (United States)")||voices.find(v=>/jenny|aria|zira|samantha/i.test(v.name))||voices.find(v=>/google uk english female/i.test(v.name))||voices.find(v=>/female|woman/i.test(v.name))||voices.find(v=>/^en(-|_)/i.test(v.lang))||null;
//         if (chosen) utterance.voice=chosen;
//       };
//       if (synth.getVoices().length>0) pickVoice(); else synth.onvoiceschanged=()=>pickVoice();
//       const safetyTimer=window.setTimeout(()=>settle(), Math.min(text.length*85+3500, 20000));
//       const finish=()=>{ window.clearTimeout(safetyTimer); settle(); };
//       utterance.onstart=()=>{ if(hardAbortRef.current){synth.cancel();finish();return;} if(mountedRef.current)setIsSpeaking(true); };
//       utterance.onend=finish; utterance.onerror=finish;
//       try { synth.speak(utterance); } catch { finish(); }
//     });
//   },[]);

//   useEffect(()=>{ chatEndRef.current?.scrollIntoView({ behavior:"smooth" }); },[messages,transcriptPreview,isLoading]);

//   useEffect(()=>{
//     if (screen!=="briefing"||mayaIntroPlayed||!nameLoaded||candidateName==="Candidate") return;
//     const intro=`Hi ${candidateName}! I'm Maya, your AI interviewer from Cuemath. This is a short, voice-first screening interview. Please enable both your microphone and camera before starting — both are required for this interview. I'll guide you through each step.`;
//     const t=setTimeout(()=>{ hardAbortRef.current=false; void speak(intro); setMayaIntroPlayed(true); },800);
//     return()=>clearTimeout(t);
//   },[screen,mayaIntroPlayed,nameLoaded,candidateName,speak]);

//   const requestMicPermission = useCallback(async()=>{
//     setMicStateSynced("requesting");
//     try {
//       const stream=await navigator.mediaDevices.getUserMedia({audio:true});
//       stream.getTracks().forEach(t=>t.stop()); setMicStateSynced("granted"); setInputModeSynced("voice");
//     } catch { setMicStateSynced("denied"); setInputModeSynced("typing"); setMicVerified(false); }
//   },[setMicStateSynced,setInputModeSynced]);

//   const requestCameraPermission = useCallback(async()=>{
//     if (cameraStreamRef.current) { cameraStreamRef.current.getTracks().forEach(t=>t.stop()); cameraStreamRef.current=null; }
//     setCameraState("requesting");
//     try {
//       const stream=await navigator.mediaDevices.getUserMedia({ video:{facingMode:"user",width:{ideal:640},height:{ideal:360}},audio:false });
//       cameraStreamRef.current=stream; const videoTrack=stream.getVideoTracks()[0];
//       if (videoTrack) console.log("camera_track_settings:",videoTrack.getSettings());
//       setCameraState("granted"); setCameraVerified(true);
//       const targetVideo=screenRef.current==="briefing"?briefingVideoRef.current:interviewVideoRef.current;
//       if (targetVideo) { targetVideo.srcObject=stream; try { await targetVideo.play(); } catch(e) { console.error("camera_preview_initial_play_failed:",e); } }
//     } catch(error) { console.error("camera_permission_failed:",error); setCameraState("denied"); setCameraVerified(false); }
//   },[]);

//   const verifyMicrophoneWithMaya = useCallback(async()=>{
//     if (hardAbortRef.current||deviceCheckRunningRef.current) return;
//     if (typeof window==="undefined"||micStateRef.current!=="granted") return;
//     const SpeechAPI=window.SpeechRecognition||window.webkitSpeechRecognition;
//     if (!SpeechAPI) { await speak("Your browser does not support microphone verification in voice mode. You can still continue."); return; }
//     deviceCheckRunningRef.current=true; setDeviceCheckRunning(true); setDeviceCheckTranscript(""); setMicVerified(false);
//     await speak("Let's quickly test your microphone. Please say: Maya, can you hear me clearly?");
//     if (hardAbortRef.current) { deviceCheckRunningRef.current=false; if(mountedRef.current)setDeviceCheckRunning(false); return; }
//     const rec=new SpeechAPI(); rec.continuous=false; rec.interimResults=true; rec.lang="en-IN";
//     let transcript=""; let settled=false;
//     const settle=async(ok:boolean,heardText:string)=>{
//       if (settled) return; settled=true;
//       try { rec.stop?.(); } catch {}
//       deviceCheckRunningRef.current=false; if (!mountedRef.current) return;
//       setDeviceCheckRunning(false); setDeviceCheckTranscript(heardText);
//       if (hardAbortRef.current) return;
//       if (ok) { setMicVerified(true); await speak("Yes, I can hear you properly. Your microphone looks good to go."); }
//       else { setMicVerified(false); await speak("I'm not hearing you clearly yet. Please check your microphone and try the test again."); }
//     };
//     const timeout=setTimeout(()=>void settle(transcript.trim().length>=6, transcript.trim()),6000);
//     rec.onresult=(e:BSREvent)=>{
//       let finalText=""; let interim="";
//       for (let i=e.resultIndex;i<e.results.length;i++) { if(e.results[i].isFinal)finalText+=e.results[i][0].transcript+" "; else interim+=e.results[i][0].transcript; }
//       transcript=(finalText||interim).trim(); if(mountedRef.current)setDeviceCheckTranscript(transcript);
//     };
//     rec.onerror=()=>{ clearTimeout(timeout); void settle(false,transcript.trim()); };
//     rec.onend=()=>{ clearTimeout(timeout); void settle(transcript.trim().length>=6,transcript.trim()); };
//     try { rec.start(); } catch { clearTimeout(timeout); deviceCheckRunningRef.current=false; if(mountedRef.current)setDeviceCheckRunning(false); await speak("I couldn't start the microphone test. Please try again."); }
//   },[speak]);

//   const doSend = useCallback((text:string)=>{
//     if (hardAbortRef.current||sendInProgressRef.current) return;
//     if (isLoadingRef.current||interviewDoneRef.current) return;
//     sendInProgressRef.current=true;
//     void sendMessageRef.current(text).finally(()=>{ sendInProgressRef.current=false; });
//   },[]);

//   const startListening = useCallback(()=>{
//     if (hardAbortRef.current) return;
//     if (typeof window==="undefined"||micStateRef.current!=="granted") return;
//     if (isListeningRef.current) { recognitionRef.current?.stop(); isListeningRef.current=false; setIsListening(false); }
//     const SpeechAPI=window.SpeechRecognition||window.webkitSpeechRecognition; if (!SpeechAPI) return;
//     finalTranscriptRef.current=""; interimTranscriptRef.current=""; setTranscriptPreview(""); clearListeningTimers(); sendInProgressRef.current=false; utteranceSentRef.current=false;
//     const qAtStart=questionCountRef.current;
//     if (silenceAttemptRef.current[qAtStart]===undefined) silenceAttemptRef.current[qAtStart]=0;
//     const rec=new SpeechAPI(); rec.continuous=true; rec.interimResults=true; rec.lang="en-IN";
//     emptyResponseTimerRef.current=setTimeout(()=>{
//       if (hardAbortRef.current) return;
//       if (isListeningRef.current) { rec.stop(); isListeningRef.current=false; setIsListening(false); setTranscriptPreview(""); }
//       if (!utteranceSentRef.current&&!sendInProgressRef.current&&!isLoadingRef.current&&!interviewDoneRef.current) {
//         const liveQ=questionCountRef.current; const attempts=silenceAttemptRef.current[liveQ]??0;
//         silenceAttemptRef.current[liveQ]=attempts+1; utteranceSentRef.current=true; doSend(EMPTY_RESPONSE_TOKEN);
//       }
//     },EMPTY_RESPONSE_MS);
//     rec.onresult=(e:BSREvent)=>{
//       if (hardAbortRef.current) return;
//       let newFinal=""; let interim="";
//       for (let i=e.resultIndex;i<e.results.length;i++) { if(e.results[i].isFinal)newFinal+=e.results[i][0].transcript+" "; else interim+=e.results[i][0].transcript; }
//       if (newFinal.trim()) finalTranscriptRef.current=(finalTranscriptRef.current+" "+newFinal).trim();
//       interimTranscriptRef.current=interim.trim();
//       const raw=(finalTranscriptRef.current+" "+interim).trim(); const display=correctASRText(raw);
//       if (display) { setTranscriptPreview(display); if(emptyResponseTimerRef.current){clearTimeout(emptyResponseTimerRef.current);emptyResponseTimerRef.current=null;} }
//       const liveQ=questionCountRef.current; silenceAttemptRef.current[liveQ]=0;
//       if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
//       const toSubmit=(finalTranscriptRef.current+" "+interim).trim();
//       if (toSubmit) {
//         silenceTimerRef.current=setTimeout(()=>{
//           if (hardAbortRef.current||!isListeningRef.current) return;
//           rec.stop(); isListeningRef.current=false; setIsListening(false);
//           const corrected=correctASRText(toSubmit);
//           if (!utteranceSentRef.current&&!sendInProgressRef.current&&!isLoadingRef.current&&!interviewDoneRef.current) { utteranceSentRef.current=true; doSend(corrected); }
//         },SILENCE_MS);
//       }
//     };
//     rec.onerror=(e:BSRError)=>{
//       isListeningRef.current=false; setIsListening(false); clearListeningTimers(); recognitionRef.current=null;
//       if (e?.error==="aborted") return;
//       if (e?.error==="not-allowed") { setMicStateSynced("denied"); setInputModeSynced("typing"); return; }
//       if (hardAbortRef.current||isLoadingRef.current||interviewDoneRef.current) return;
//       const combined=(finalTranscriptRef.current+" "+interimTranscriptRef.current).trim();
//       const partial=correctASRText(combined);
//       if (partial&&!utteranceSentRef.current&&!sendInProgressRef.current) { utteranceSentRef.current=true; doSend(partial); }
//       else if (!utteranceSentRef.current&&!sendInProgressRef.current) {
//         setTimeout(()=>{ if(hardAbortRef.current||isLoadingRef.current||interviewDoneRef.current||sendInProgressRef.current||utteranceSentRef.current)return; utteranceSentRef.current=true; doSend(EMPTY_RESPONSE_TOKEN); },1500);
//       }
//     };
//     rec.onend=()=>{
//       isListeningRef.current=false; setIsListening(false); clearListeningTimers(); recognitionRef.current=null;
//       if (hardAbortRef.current||isLoadingRef.current||interviewDoneRef.current) return;
//       const combined=(finalTranscriptRef.current+" "+interimTranscriptRef.current).trim();
//       const partial=correctASRText(combined);
//       if (partial&&!utteranceSentRef.current&&!sendInProgressRef.current) { utteranceSentRef.current=true; doSend(partial); }
//     };
//     recognitionRef.current=rec; rec.start(); isListeningRef.current=true; setIsListening(true);
//   },[clearListeningTimers,doSend,setInputModeSynced,setMicStateSynced]);

//   const stopListening = useCallback(()=>{
//     clearListeningTimers();
//     if (recognitionRef.current&&isListeningRef.current) recognitionRef.current.stop();
//     isListeningRef.current=false; setIsListening(false);
//     if (hardAbortRef.current||isLoadingRef.current||sendInProgressRef.current) return;
//     const combined=(finalTranscriptRef.current+" "+interimTranscriptRef.current).trim();
//     const captured=correctASRText(combined);
//     setTimeout(()=>{
//       if (hardAbortRef.current||sendInProgressRef.current||isLoadingRef.current||interviewDoneRef.current||utteranceSentRef.current) return;
//       utteranceSentRef.current=true; doSend(captured||EMPTY_RESPONSE_TOKEN);
//     },300);
//   },[clearListeningTimers,doSend]);

//   const maybeStartListening = useCallback(()=>{
//     if (hardAbortRef.current) return;
//     if (supportsSpeechRef.current&&micStateRef.current==="granted"&&inputModeRef.current==="voice") setTimeout(()=>startListening(),700);
//   },[startListening]);

//   const generateReport = useCallback(async(finalMessages:Message[])=>{
//     if (hardAbortRef.current) return;
//     const transcript=finalMessages.map(m=>`${m.role==="user"?"Candidate":"Maya"}: ${m.content}`).join("\n\n");
//     try { localStorage.setItem("interview_transcript",transcript); localStorage.setItem("interview_messages",JSON.stringify(finalMessages)); localStorage.setItem("assessment_saved_at",Date.now().toString()); } catch {}
//     const tryAssess=async()=>{
//       if (hardAbortRef.current) return;
//       const res=await fetch("/api/assess",{ method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({transcript,candidateName}) });
//       const data=await parseJson(res);
//       try { localStorage.setItem("assessment_result",JSON.stringify(data)); } catch {}
//       if (!hardAbortRef.current) router.push("/report");
//     };
//     try { await tryAssess(); } catch {
//       if (hardAbortRef.current) return;
//       setReportError("Generating report... please wait.");
//       setTimeout(async()=>{ try { if(!hardAbortRef.current)await tryAssess(); } catch { if(!hardAbortRef.current)setReportError("Report failed. Please refresh."); } },3000);
//     }
//   },[candidateName,parseJson,router]);

//   const stopPresenceDetection = useCallback(()=>{
//     if (faceCheckIntervalRef.current) { clearInterval(faceCheckIntervalRef.current); faceCheckIntervalRef.current=null; }
//     if (faceAbsenceTimerRef.current) { clearTimeout(faceAbsenceTimerRef.current); faceAbsenceTimerRef.current=null; }
//     if (visibilityHandlerRef.current) { document.removeEventListener("visibilitychange",visibilityHandlerRef.current); visibilityHandlerRef.current=null; }
//     faceAbsenceStartRef.current=null; consecutiveAbsentCountRef.current=0; unknownPresenceCountRef.current=0; setFaceAbsenceCountdown(null);
//   },[]);

//   const sendMessage = useCallback(async(text:string)=>{
//     if (hardAbortRef.current) return;
//     const trimmed=text.trim(); const isToken=text===EMPTY_RESPONSE_TOKEN;
//     const normalizedInput=isToken?"no response":trimmed;
//     if ((!trimmed&&!isToken)||isLoadingRef.current||interviewDoneRef.current) return;
//     clearListeningTimers();
//     const userMsg:Message={ role:"user", content:isToken?"(No verbal response given)":trimmed };
//     const updated=[...messages,userMsg];
//     setMessages(updated); setInputText(""); setTranscriptPreview(""); finalTranscriptRef.current=""; interimTranscriptRef.current=""; setLoading(true);
//     const currentCount=questionCountRef.current; const currentRetryCount=retryCountRef.current[currentCount]??0;
//     try {
//       if (hardAbortRef.current) { setLoading(false); return; }
//       const res=await fetch("/api/chat",{ method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ messages:updated, candidateName, questionCount:currentCount, retryCount:currentRetryCount }) });
//       if (hardAbortRef.current) { setLoading(false); return; }
//       const data=await parseJson(res);
//       if (hardAbortRef.current) { setLoading(false); return; }
//       if (data?.code==="QUOTA_EXCEEDED"||data?.source==="fallback") throw new Error("quota_fallback");
//       if (!res.ok||!data?.text) throw new Error((data?.error as string)||"unavailable");
//       const aiMsg:Message={ role:"assistant", content:data.text as string };
//       const final=[...updated,aiMsg]; const nextCount=data.isFollowUp?currentCount:currentCount+1;
//       if (data.isFollowUp) { retryCountRef.current={...retryCountRef.current,[currentCount]:currentRetryCount+1}; }
//       else { retryCountRef.current={...retryCountRef.current,[currentCount]:0,[nextCount]:0}; silenceAttemptRef.current[nextCount]=0; }
//       setMessages(final); setQCount(nextCount);
//       if (hardAbortRef.current) { setLoading(false); return; }
//       await speak(data.text as string);
//       if (hardAbortRef.current) { setLoading(false); return; }
//       if (data.isComplete||nextCount>=7) { setDone(true); setTimeout(()=>void generateReport(final),1200); } else { maybeStartListening(); }
//     } catch(err) {
//       if (hardAbortRef.current) { setLoading(false); return; }
//       const msg=err instanceof Error?err.message:String(err);
//       if (!msg.includes("quota")&&msg!=="quota_fallback") console.error("sendMessage:",err);
//       const { reply:fb, shouldAdvance }=buildFallbackReply(currentCount,candidateName,normalizedInput,currentRetryCount);
//       const nextCount=shouldAdvance?currentCount+1:currentCount;
//       if (shouldAdvance) { retryCountRef.current={...retryCountRef.current,[currentCount]:0,[nextCount]:0}; silenceAttemptRef.current[nextCount]=0; }
//       else { retryCountRef.current={...retryCountRef.current,[currentCount]:currentRetryCount+1}; }
//       const aiMsg:Message={ role:"assistant", content:fb }; const final=[...updated,aiMsg];
//       setMessages(final); setQCount(nextCount); setUsingFallback(true);
//       if (hardAbortRef.current) { setLoading(false); return; }
//       await speak(fb);
//       if (hardAbortRef.current) { setLoading(false); return; }
//       if (nextCount>=7) { setDone(true); setTimeout(()=>void generateReport(final),1200); } else { maybeStartListening(); }
//     } finally { setLoading(false); }
//   },[candidateName,clearListeningTimers,generateReport,maybeStartListening,messages,parseJson,setDone,setLoading,setQCount,speak]);

//   useEffect(()=>{ sendMessageRef.current=sendMessage; },[sendMessage]);

//   const checkPresence = useCallback(async():Promise<PresenceState>=>{
//     const video=interviewVideoRef.current; if (!video) return "unknown";
//     if (video.readyState<2||video.videoWidth===0||video.videoHeight===0) return "unknown";
//     if (presenceCheckBusyRef.current) return "unknown";
//     presenceCheckBusyRef.current=true;
//     try {
//       const vw=video.videoWidth; const vh=video.videoHeight;
//       if (nativeFaceDetectorRef.current) {
//         try {
//           const faces=await nativeFaceDetectorRef.current.detect(video);
//           if (faces.length===0) return "absent";
//           const validFace=faces.some(face=>{
//             const box=face.boundingBox; const cx=box.x+box.width/2; const cy=box.y+box.height/2;
//             const insideCentralRegion=cx>vw*0.12&&cx<vw*0.88&&cy>vh*0.08&&cy<vh*0.92;
//             const bigEnough=box.width>=vw*MIN_FACE_WIDTH_RATIO&&box.height>=vh*MIN_FACE_HEIGHT_RATIO;
//             return insideCentralRegion&&bigEnough;
//           });
//           return validFace?"present":"absent";
//         } catch(err) { console.error("face_detector_detect_failed:",err); }
//       }
//       const canvas=faceCanvasRef.current; if (!canvas) return "unknown";
//       const ctx=canvas.getContext("2d",{willReadFrequently:true}); if (!ctx) return "unknown";
//       canvas.width=FALLBACK_SAMPLE_W; canvas.height=FALLBACK_SAMPLE_H;
//       ctx.drawImage(video,0,0,FALLBACK_SAMPLE_W,FALLBACK_SAMPLE_H);
//       const imageData=ctx.getImageData(0,0,FALLBACK_SAMPLE_W,FALLBACK_SAMPLE_H); const data=imageData.data;
//       const gray=new Uint8ClampedArray(FALLBACK_SAMPLE_W*FALLBACK_SAMPLE_H);
//       let fullSkin=0; let centerSkin=0; let centerPixels=0;
//       const cx1=Math.floor(FALLBACK_SAMPLE_W*0.25); const cx2=Math.floor(FALLBACK_SAMPLE_W*0.75);
//       const cy1=Math.floor(FALLBACK_SAMPLE_H*0.12); const cy2=Math.floor(FALLBACK_SAMPLE_H*0.78);
//       for (let y=0;y<FALLBACK_SAMPLE_H;y++) for (let x=0;x<FALLBACK_SAMPLE_W;x++) {
//         const i=y*FALLBACK_SAMPLE_W+x; const di=i*4;
//         const r=data[di]; const g=data[di+1]; const b=data[di+2];
//         gray[i]=Math.round(0.299*r+0.587*g+0.114*b);
//         const skin=isSkinPixel(r,g,b); if(skin)fullSkin++;
//         const inCenter=x>=cx1&&x<=cx2&&y>=cy1&&y<=cy2;
//         if (inCenter) { centerPixels++; if(skin)centerSkin++; }
//       }
//       const fullSkinRatio=fullSkin/(FALLBACK_SAMPLE_W*FALLBACK_SAMPLE_H);
//       const centerSkinRatio=centerPixels>0?centerSkin/centerPixels:0;
//       const edgeRatio=sobelLikeEdgeScore(gray,FALLBACK_SAMPLE_W,FALLBACK_SAMPLE_H);
//       if (edgeRatio>TEXTURE_COMPLEXITY_MAX) return "absent";
//       const looksHumanish=centerSkinRatio>=CENTER_SKIN_RATIO_MIN&&fullSkinRatio>=FULL_SKIN_RATIO_MIN&&edgeRatio>=EDGE_RATIO_MIN&&edgeRatio<=EDGE_RATIO_MAX;
//       return looksHumanish?"present":"absent";
//     } catch(err) { console.error("presence_check_failed:",err); return "unknown"; }
//     finally { presenceCheckBusyRef.current=false; }
//   },[]);

//   const stopEverythingNow = useCallback(()=>{
//     hardAbortRef.current=true; stopPresenceDetection(); clearListeningTimers();
//     try { recognitionRef.current?.stop(); } catch {}
//     recognitionRef.current=null; isListeningRef.current=false; sendInProgressRef.current=false;
//     if (typeof window!=="undefined"&&window.speechSynthesis) window.speechSynthesis.cancel();
//     stopCameraPreview(); setIsListening(false); setIsSpeaking(false); setIsLoading(false);
//   },[clearListeningTimers,stopCameraPreview,stopPresenceDetection]);

//   const terminateInterview = useCallback((reason:string)=>{
//     if (faceTerminatedRef.current) return; faceTerminatedRef.current=true;
//     stopEverythingNow(); setTerminated(true); setTerminationReason(reason);
//   },[stopEverythingNow]);

//   const startPresenceDetection = useCallback(()=>{
//     if (faceCheckIntervalRef.current) return;
//     faceAbsenceStartRef.current=null; faceTerminatedRef.current=false;
//     consecutiveAbsentCountRef.current=0; unknownPresenceCountRef.current=0;
//     let warmupCount=0;
//     const handleVisibilityChange=()=>{
//       if (document.hidden) { faceAbsenceStartRef.current=null; consecutiveAbsentCountRef.current=0; unknownPresenceCountRef.current=0; if(mountedRef.current)setFaceAbsenceCountdown(null); }
//     };
//     visibilityHandlerRef.current=handleVisibilityChange;
//     document.addEventListener("visibilitychange",handleVisibilityChange);
//     faceCheckIntervalRef.current=setInterval(()=>{
//       if (faceTerminatedRef.current||interviewDoneRef.current||hardAbortRef.current) {
//         if(faceCheckIntervalRef.current){clearInterval(faceCheckIntervalRef.current);faceCheckIntervalRef.current=null;}
//         if(visibilityHandlerRef.current){document.removeEventListener("visibilitychange",visibilityHandlerRef.current);visibilityHandlerRef.current=null;}
//         return;
//       }
//       if (document.hidden) return;
//       if (warmupCount<PRESENCE_WARMUP_FRAMES) { warmupCount++; return; }
//       void (async()=>{
//         const state=await checkPresence();
//         if (state==="present") { faceAbsenceStartRef.current=null; consecutiveAbsentCountRef.current=0; unknownPresenceCountRef.current=0; if(mountedRef.current)setFaceAbsenceCountdown(null); return; }
//         if (state==="unknown") {
//           unknownPresenceCountRef.current+=1;
//           if (unknownPresenceCountRef.current<UNKNOWN_STREAK_BEFORE_SOFT_ABSENT) {
//             if (faceAbsenceStartRef.current!==null&&mountedRef.current) {
//               const absenceMs=Date.now()-faceAbsenceStartRef.current;
//               const remainingSecs=Math.max(0,Math.ceil((FACE_ABSENCE_TERMINATE_MS-absenceMs)/1000));
//               setFaceAbsenceCountdown(remainingSecs);
//               if (absenceMs>=FACE_ABSENCE_TERMINATE_MS) { terminateInterview("You were not visible in the camera frame for more than 9 seconds. The interview has been terminated as per our proctoring policy."); if(mountedRef.current)setFaceAbsenceCountdown(null); }
//             }
//             return;
//           }
//           consecutiveAbsentCountRef.current+=1;
//         } else { unknownPresenceCountRef.current=0; consecutiveAbsentCountRef.current+=1; }
//         if (consecutiveAbsentCountRef.current<CONSECUTIVE_ABSENT_THRESHOLD) return;
//         if (faceAbsenceStartRef.current===null) { faceAbsenceStartRef.current=Date.now(); console.warn(`presence_detection: absence threshold crossed → starting ${FACE_ABSENCE_TERMINATE_MS/1000}s termination timer`); }
//         const absenceMs=Date.now()-faceAbsenceStartRef.current;
//         const remainingSecs=Math.max(0,Math.ceil((FACE_ABSENCE_TERMINATE_MS-absenceMs)/1000));
//         if (mountedRef.current) setFaceAbsenceCountdown(remainingSecs);
//         if (absenceMs>=FACE_ABSENCE_TERMINATE_MS) { terminateInterview("You were not visible in the camera frame for more than 9 seconds. The interview has been terminated as per our proctoring policy."); if(mountedRef.current)setFaceAbsenceCountdown(null); }
//       })();
//     },FACE_CHECK_INTERVAL_MS);
//   },[checkPresence,terminateInterview]);

//   useEffect(()=>{
//     return()=>{
//       hardAbortRef.current=true; stopPresenceDetection(); clearListeningTimers();
//       try { recognitionRef.current?.stop(); } catch {}
//       recognitionRef.current=null;
//       if (typeof window!=="undefined"&&window.speechSynthesis) window.speechSynthesis.cancel();
//       stopCameraPreview();
//     };
//   },[clearListeningTimers,stopCameraPreview,stopPresenceDetection]);

//   const canBeginInterview = micState==="granted"&&cameraState==="granted";

//   const beginInterview = useCallback(async()=>{
//     if (!canBeginInterview) { setShowMandatoryWarning(true); await speak("Please enable both your microphone and camera before starting the interview. Both are required."); return; }
//     if (isBeginning) return;
//     setIsBeginning(true); setShowMandatoryWarning(false); window.speechSynthesis?.cancel(); clearListeningTimers();
//     hardAbortRef.current=false; faceTerminatedRef.current=false; setTerminated(false); setTerminationReason(""); setFaceAbsenceCountdown(null);
//     consecutiveAbsentCountRef.current=0; unknownPresenceCountRef.current=0;
//     retryCountRef.current=Object.create(null) as Record<number,number>;
//     silenceAttemptRef.current=Object.create(null) as Record<number,number>;
//     sendInProgressRef.current=false; utteranceSentRef.current=false; setUsingFallback(false);
//     setMessages([]); setTranscriptPreview(""); setInputText(""); setQuestionCount(1); questionCountRef.current=1; setDone(false);
//     if (supportsSpeechRef.current&&micStateRef.current==="idle") {
//       setMicStateSynced("requesting");
//       try { const stream=await navigator.mediaDevices.getUserMedia({audio:true}); stream.getTracks().forEach(t=>t.stop()); setMicStateSynced("granted"); setInputModeSynced("voice"); }
//       catch { setMicStateSynced("denied"); setInputModeSynced("typing"); }
//     }
//     setScreen("interview");
//     setTimeout(()=>{ if(!hardAbortRef.current) { startPresenceDetection(); void attachCameraStreamToVisibleVideo(true); } },250);
//     setLoading(true);
//     try {
//       const initial:Message[]=[{ role:"user", content:`Hi, my name is ${candidateName}.` }]; setMessages(initial);
//       const res=await fetch("/api/chat",{ method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ messages:initial, candidateName, questionCount:1, retryCount:0, beginInterview:true }) });
//       const data=await parseJson(res); const text=(data?.text as string)||QUESTION_BANK[0];
//       const aiMsg:Message={ role:"assistant", content:text }; const final=[...initial,aiMsg];
//       setMessages(final); setQCount(2);
//       if (hardAbortRef.current) return;
//       await speak(text); if (!hardAbortRef.current) maybeStartListening();
//     } catch(err) {
//       console.error("beginInterview:",err); if(hardAbortRef.current)return;
//       const fallback=QUESTION_BANK[0]; const initial:Message[]=[{ role:"user", content:`Hi, my name is ${candidateName}.` }];
//       const aiMsg:Message={ role:"assistant", content:fallback }; const final=[...initial,aiMsg];
//       setMessages(final); setQCount(2); await speak(fallback); if(!hardAbortRef.current)maybeStartListening();
//     } finally { setLoading(false); setIsBeginning(false); }
//   },[attachCameraStreamToVisibleVideo,canBeginInterview,candidateName,clearListeningTimers,isBeginning,maybeStartListening,parseJson,setDone,setInputModeSynced,setLoading,setMicStateSynced,setQCount,speak,startPresenceDetection]);

//   const handleReturnHome = useCallback(()=>{ stopEverythingNow(); router.push("/"); },[router,stopEverythingNow]);
//   const handleManualSend = useCallback(()=>{
//     const text=inputText.trim();
//     if (!text||isLoadingRef.current||sendInProgressRef.current||interviewDoneRef.current||hardAbortRef.current) return;
//     doSend(text); setInputText("");
//   },[doSend,inputText]);

//   // ─── Shared CSS ──────────────────────────────────────────────────────────────
//   const css = `
//     .ip-shell { min-height: 100vh; background: linear-gradient(160deg, ${T.pageBg} 0%, ${T.pageBg2} 100%); color: ${T.text}; font-family: "DM Sans", system-ui, sans-serif; }
//     .ip-grid::before { content:""; position:absolute; inset:0; pointer-events:none; z-index:0; background-image: linear-gradient(${T.gridLine} 1px, transparent 1px), linear-gradient(90deg, ${T.gridLine} 1px, transparent 1px); background-size: 48px 48px; }
//     .ip-topbar { position:sticky; top:0; z-index:100; height:62px; display:flex; align-items:center; border-bottom:1px solid ${T.border}; background:${T.topbar}; backdrop-filter:blur(20px); -webkit-backdrop-filter:blur(20px); }
//     .ip-container { max-width:1360px; margin:0 auto; padding:0 28px; width:100%; }
//     .ip-topbar-inner { display:flex; align-items:center; justify-content:space-between; width:100%; }
//     .ip-brand { display:flex; align-items:center; gap:10px; }
//     .ip-brandmark { width:34px; height:34px; border-radius:10px; background:linear-gradient(135deg,${T.accent},${T.accentAlt}); display:grid; place-items:center; color:#fff; }
//     .ip-brand-name { font-size:15px; font-weight:700; letter-spacing:-0.02em; color:${T.text}; }
//     .ip-brand-sub { font-size:10px; text-transform:uppercase; letter-spacing:0.10em; color:${T.textMuted}; margin-top:1px; }
//     .ip-theme-btn { width:36px; height:36px; border-radius:10px; border:1px solid ${T.border}; background:transparent; color:${T.textSoft}; display:grid; place-items:center; cursor:pointer; transition:border-color 0.15s,background 0.15s; }
//     .ip-theme-btn:hover { border-color:${T.borderStrong}; background:${T.surfaceElevated}; }
//     .ip-maya-pulse { animation: ip-pulse 2s infinite; }
//     .ip-card { border:1px solid ${T.border}; border-radius:20px; background:${T.surface}; box-shadow:${T.shadow}; }
//     .ip-panel { border:1px solid ${T.border}; border-radius:16px; background:${T.surfaceElevated}; }
//     .ip-inset { border:1px solid ${T.border}; border-radius:14px; background:${T.inset}; }
//     .ip-btn-primary { display:inline-flex; align-items:center; justify-content:center; gap:8px; border:0; border-radius:12px; padding:0 18px; height:42px; font-size:13.5px; font-weight:700; font-family:inherit; color:#fff; cursor:pointer; background:linear-gradient(135deg,${T.accent} 0%,${T.accentAlt} 100%); box-shadow:0 10px 28px ${T.accentRing}; transition:transform 0.15s,box-shadow 0.15s,opacity 0.15s; }
//     .ip-btn-primary:hover:not(:disabled) { transform:translateY(-1px); box-shadow:0 16px 36px ${T.accentRing}; }
//     .ip-btn-primary:disabled { opacity:0.45; cursor:not-allowed; }
//     .ip-btn-secondary { display:inline-flex; align-items:center; justify-content:center; gap:7px; border:1px solid ${T.border}; border-radius:12px; padding:0 16px; height:40px; font-size:13px; font-weight:600; font-family:inherit; color:${T.textSoft}; cursor:pointer; background:transparent; transition:border-color 0.15s,color 0.15s,background 0.15s; }
//     .ip-btn-secondary:hover { border-color:${T.borderStrong}; color:${T.text}; background:${T.surfaceElevated}; }
//     .ip-btn-danger { display:inline-flex; align-items:center; gap:7px; border:0; border-radius:12px; padding:0 16px; height:40px; font-size:13px; font-weight:600; font-family:inherit; color:#fff; cursor:pointer; background:linear-gradient(135deg,#EF4444,#DC2626); }
//     .ip-btn-warn { display:inline-flex; align-items:center; gap:7px; border:0; border-radius:12px; padding:0 16px; height:42px; font-size:13px; font-weight:600; font-family:inherit; color:#fff; cursor:pointer; background:linear-gradient(135deg,#F59E0B,#D97706); }
//     .ip-btn-full { width:100%; }
//     .ip-bubble-ai { border:1px solid ${T.bubbleAIBorder}; border-radius:18px 18px 18px 4px; padding:14px 18px; background:${T.bubbleAI}; box-shadow:${T.shadowMd}; }
//     .ip-bubble-user { border-radius:18px 18px 4px 18px; padding:14px 18px; background:${T.bubbleUser}; color:#fff; }
//     .ip-bubble-label { font-size:11px; font-weight:700; opacity:0.65; margin-bottom:6px; letter-spacing:0.02em; }
//     .ip-bubble-text { font-size:14.5px; line-height:1.65; }
//     .ip-step-active { border:1px solid ${T.accentRing}; background:${T.accentGlow}; border-radius:16px; padding:14px 16px; display:flex; align-items:flex-start; gap:14px; text-align:left; cursor:pointer; transition:border-color 0.15s,background 0.15s; width:100%; }
//     .ip-step-inactive { border:1px solid ${T.border}; background:transparent; border-radius:16px; padding:14px 16px; display:flex; align-items:flex-start; gap:14px; text-align:left; cursor:pointer; opacity:0.55; transition:opacity 0.15s,border-color 0.15s; width:100%; }
//     .ip-step-inactive:hover { opacity:0.75; border-color:${T.borderStrong}; }
//     .ip-step-icon-active { width:40px; height:40px; min-width:40px; border-radius:12px; background:${T.accentGlow}; border:1px solid ${T.accentRing}; display:grid; place-items:center; }
//     .ip-step-icon-inactive { width:40px; height:40px; min-width:40px; border-radius:12px; background:${T.surfaceElevated}; border:1px solid ${T.border}; display:grid; place-items:center; }
//     .ip-progress-bg { height:4px; border-radius:999px; background:${T.border}; overflow:hidden; }
//     .ip-progress-fill { height:100%; border-radius:999px; background:linear-gradient(90deg,${T.accent},${T.accentAlt}); transition:width 0.5s ease; }
//     .ip-input { width:100%; border:1px solid ${T.inputBorder}; border-radius:14px; background:${T.inputBg}; color:${T.text}; font-size:13.5px; font-family:inherit; padding:12px 16px; outline:none; resize:none; transition:border-color 0.15s,box-shadow 0.15s; }
//     .ip-input::placeholder { color:${T.textMuted}; }
//     .ip-input:focus { border-color:${T.accent}; box-shadow:0 0 0 3px ${T.inputFocus}; }
//     .ip-device-btn { width:100%; border:1px solid ${T.border}; border-radius:12px; background:transparent; color:${T.textSoft}; font-size:13px; font-weight:600; font-family:inherit; padding:11px 16px; cursor:pointer; text-align:left; transition:border-color 0.15s,color 0.15s,background 0.15s; }
//     .ip-device-btn:hover { border-color:${T.borderStrong}; color:${T.text}; background:${T.surfaceElevated}; }
//     .ip-device-btn:disabled { opacity:0.5; cursor:not-allowed; }
//     @keyframes ip-pulse { 0%,100%{box-shadow:0 0 0 0 ${T.accentGlow}} 50%{box-shadow:0 0 0 6px transparent} }
//     @keyframes ip-spin { to{transform:rotate(360deg)} }
//     .ip-spin { animation:ip-spin 0.8s linear infinite; }
//     .ip-chip-ok { display:inline-flex; align-items:center; gap:5px; padding:4px 10px; border-radius:999px; border:1px solid ${T.successBorder}; background:${T.successBg}; color:${T.success}; font-size:11px; font-weight:600; }
//     .ip-chip-neutral { display:inline-flex; align-items:center; gap:5px; padding:4px 10px; border-radius:999px; border:1px solid ${T.border}; background:transparent; color:${T.textMuted}; font-size:11px; font-weight:600; }
//     .ip-chip-accent { display:inline-flex; align-items:center; gap:5px; padding:4px 10px; border-radius:999px; border:1px solid ${T.accentRing}; background:${T.accentGlow}; color:${T.accentText}; font-size:11px; font-weight:600; }
//     .ip-warn-box { border:1px solid ${T.warningBorder}; background:${T.warningBg}; border-radius:12px; padding:10px 14px; font-size:12px; color:${T.warning}; }
//     .ip-danger-box { border:1px solid ${T.dangerBorder}; background:${T.dangerBg}; border-radius:12px; padding:10px 14px; font-size:12px; color:${T.danger}; }
//   `;

//   // ─── Terminated screen ───────────────────────────────────────────────────────
//   if (terminated) {
//     return (
//       <>
//         <style dangerouslySetInnerHTML={{ __html: FONTS + css }} />
//         <div className="ip-shell" style={{ display:"flex", alignItems:"center", justifyContent:"center", padding:"40px 20px", position:"relative" }}>
//           <div className="ip-grid" style={{ position:"absolute", inset:0 }} />
//           <div className="ip-card" style={{ width:"100%", maxWidth:560, padding:"40px", position:"relative", zIndex:1 }}>
//             <div style={{ width:72, height:72, borderRadius:"50%", background:T.dangerBg, border:`1px solid ${T.dangerBorder}`, display:"grid", placeItems:"center", margin:"0 auto 24px" }}>
//               <UserX size={32} color={T.danger} />
//             </div>
//             <h1 style={{ margin:"0 0 12px", fontSize:24, fontWeight:700, letterSpacing:"-0.03em", textAlign:"center" }}>Interview terminated</h1>
//             <p style={{ margin:"0 0 24px", fontSize:14, lineHeight:1.7, color:T.textSoft, textAlign:"center" }}>{terminationReason}</p>
//             <div className="ip-warn-box" style={{ marginBottom:24, display:"flex", alignItems:"flex-start", gap:10 }}>
//               <AlertTriangle size={15} color={T.warning} style={{ flexShrink:0, marginTop:1 }} />
//               <span>Please ensure you remain visible in the camera throughout the interview.</span>
//             </div>
//             <button onClick={handleReturnHome} className="ip-btn-primary ip-btn-full" style={{ height:48, fontSize:15 }}>
//               Return to Home <ChevronRight size={16} />
//             </button>
//           </div>
//         </div>
//       </>
//     );
//   }

//   // ─── Briefing screen ─────────────────────────────────────────────────────────
//   if (screen === "briefing") {
//     return (
//       <>
//         <style dangerouslySetInnerHTML={{ __html: FONTS + css }} />
//         <canvas ref={faceCanvasRef} style={{ display:"none" }} aria-hidden="true" />

//         <div className="ip-shell" style={{ display:"flex", flexDirection:"column", minHeight:"100vh", position:"relative" }}>
//           <div className="ip-grid" style={{ position:"absolute", inset:0 }} />

//           {/* Topbar */}
//           <header className="ip-topbar" style={{ position:"sticky", zIndex:100 }}>
//             <div className="ip-container ip-topbar-inner">
//               <div className="ip-brand">
//                 <div className="ip-brandmark"><BrainCircuit size={16} /></div>
//                 <div>
//                   <div className="ip-brand-name">Cuemath</div>
//                   <div className="ip-brand-sub">Tutor Screening</div>
//                 </div>
//               </div>
//               <div style={{ display:"flex", alignItems:"center", gap:16 }}>
//                 <div style={{ textAlign:"right" }}>
//                   <div style={{ fontSize:13, fontWeight:600, color:T.text }}>{candidateName}</div>
//                   {candidateEmail && <div style={{ fontSize:11, color:T.textMuted }}>{candidateEmail}</div>}
//                 </div>
//                 <button className="ip-theme-btn" onClick={toggleTheme} aria-label="Toggle theme">
//                   {theme==="dark" ? <Sun size={15} /> : <Moon size={15} />}
//                 </button>
//               </div>
//             </div>
//           </header>

//           <main className="ip-container" style={{ position:"relative", zIndex:1, flex:1, display:"grid", gridTemplateColumns:"400px 1fr", gap:24, padding:"28px 28px", alignItems:"start" }}>

//             {/* Left: Setup panel */}
//             <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
//               {/* Maya card */}
//               <div className="ip-card" style={{ padding:20 }}>
//                 <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:16 }}>
//                   <div style={{ width:48, height:48, borderRadius:14, background:`linear-gradient(135deg,${T.accent},${T.accentAlt})`, display:"grid", placeItems:"center", color:"#fff", fontSize:18, fontWeight:800, boxShadow:`0 8px 20px ${T.accentRing}` }} className={isSpeaking?"ip-maya-pulse":""}>M</div>
//                   <div>
//                     <div style={{ fontSize:15, fontWeight:700, letterSpacing:"-0.025em", color:T.text }}>Maya</div>
//                     <div style={{ fontSize:11, color:T.textMuted, marginTop:2 }}>AI Interviewer · Cuemath</div>
//                   </div>
//                   <div style={{ marginLeft:"auto" }} className="ip-chip-ok">
//                     <span style={{ width:6, height:6, borderRadius:"50%", background:T.success }} />
//                     Ready
//                   </div>
//                 </div>

//                 {/* Camera preview */}
//                 <div style={{ borderRadius:12, overflow:"hidden", border:`1px solid ${T.border}`, aspectRatio:"16/9", background:T.inset, position:"relative" }}>
//                   {cameraState==="granted" ? (
//                     <video ref={briefingVideoRef} autoPlay muted playsInline style={{ width:"100%", height:"100%", objectFit:"cover" }} />
//                   ) : (
//                     <div style={{ height:"100%", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:10 }}>
//                       <Camera size={28} color={T.accentText} />
//                       <span style={{ fontSize:12, color:T.textMuted }}>Camera preview will appear here</span>
//                     </div>
//                   )}
//                 </div>
//               </div>

//               {/* Device setup */}
//               <div className="ip-card" style={{ padding:20 }}>
//                 <div style={{ fontSize:10, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.10em", color:T.textMuted, marginBottom:14 }}>Device Setup</div>

//                 <div style={{ display:"flex", flexDirection:"column", gap:8, marginBottom:14 }}>
//                   <button className="ip-device-btn" onClick={requestMicPermission}>
//                     <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
//                       <span style={{ display:"flex", alignItems:"center", gap:8 }}><Mic size={14} color={T.accentText} />{micState==="granted"?"Microphone enabled ✓":"Enable microphone"}</span>
//                       {micState==="granted" && <span style={{ fontSize:10, color:T.success }}>✓</span>}
//                     </div>
//                   </button>
//                   <button className="ip-device-btn" onClick={requestCameraPermission}>
//                     <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
//                       <span style={{ display:"flex", alignItems:"center", gap:8 }}><Camera size={14} color={T.accentText} />{cameraState==="granted"?"Camera enabled ✓":"Enable camera"}</span>
//                       {cameraState==="granted" && <span style={{ fontSize:10, color:T.success }}>✓</span>}
//                     </div>
//                   </button>
//                   <button className="ip-device-btn" onClick={verifyMicrophoneWithMaya} disabled={micState!=="granted"||deviceCheckRunning}>
//                     <span style={{ display:"flex", alignItems:"center", gap:8 }}>
//                       {deviceCheckRunning ? <Loader2 size={14} className="ip-spin" /> : <Volume2 size={14} color={T.accentText} />}
//                       {deviceCheckRunning?"Testing microphone…":"Test microphone with Maya"}
//                     </span>
//                   </button>
//                 </div>

//                 <div style={{ display:"flex", flexWrap:"wrap", gap:7, marginBottom:14 }}>
//                   <StatusPill T={T} ok={micState==="granted"} icon={<Mic size={12} />} label={micState==="granted"?"Mic on":"Mic off"} />
//                   <StatusPill T={T} ok={cameraState==="granted"} icon={<Camera size={12} />} label={cameraState==="granted"?"Camera on":"Camera off"} />
//                   <StatusPill T={T} ok={supportsSpeech} icon={<Volume2 size={12} />} label={supportsSpeech?"Voice support":"Typing mode"} />
//                 </div>

//                 {deviceCheckTranscript && (
//                   <div className="ip-inset" style={{ padding:"10px 12px", marginBottom:12, fontSize:12, color:T.textSoft }}>
//                     Heard: <em>{deviceCheckTranscript}</em>
//                   </div>
//                 )}
//                 {showMandatoryWarning && (
//                   <div className="ip-danger-box" style={{ marginBottom:12 }}>
//                     Please enable both microphone and camera before starting.
//                   </div>
//                 )}

//                 <button className="ip-btn-primary ip-btn-full" onClick={beginInterview} disabled={!canBeginInterview||isBeginning} style={{ height:46, fontSize:14 }}>
//                   {isBeginning ? <><Loader2 size={15} className="ip-spin" />Starting…</> : <>Begin Interview <ChevronRight size={15} /></>}
//                 </button>
//               </div>
//             </div>

//             {/* Right: Briefing */}
//             <div className="ip-card" style={{ padding:28 }}>
//               <div style={{ marginBottom:24 }}>
//                 <div style={{ fontSize:10, fontWeight:800, textTransform:"uppercase", letterSpacing:"0.14em", color:T.accentText, marginBottom:10 }}>Interview Briefing</div>
//                 <h2 style={{ margin:"0 0 10px", fontSize:26, fontWeight:700, letterSpacing:"-0.035em", lineHeight:1.2 }}>Quick overview before we start</h2>
//                 <p style={{ margin:0, fontSize:14, lineHeight:1.7, color:T.textSoft, maxWidth:600 }}>
//                   This interview follows a consistent, voice-first screening flow designed to evaluate communication, warmth, patience, and teaching presence.
//                 </p>
//               </div>

//               <div style={{ display:"flex", flexDirection:"column", gap:10, marginBottom:20 }}>
//                 {BRIEFING_STEPS.map((step, idx)=>{
//                   const Icon=step.icon; const active=idx===briefingStep;
//                   return (
//                     <button key={step.title} onClick={()=>setBriefingStep(idx)} className={active?"ip-step-active":"ip-step-inactive"}>
//                       <div className={active?"ip-step-icon-active":"ip-step-icon-inactive"}>
//                         <Icon size={18} color={T.accentText} />
//                       </div>
//                       <div style={{ textAlign:"left" }}>
//                         <div style={{ fontSize:13.5, fontWeight:700, color:T.text, marginBottom:4 }}>{step.title}</div>
//                         <div style={{ fontSize:12.5, lineHeight:1.55, color:T.textSoft }}>{step.desc}</div>
//                       </div>
//                       <div style={{ marginLeft:"auto", fontSize:10, color:T.textMuted, flexShrink:0 }}>{idx+1}/{BRIEFING_STEPS.length}</div>
//                     </button>
//                   );
//                 })}
//               </div>

//               <div className="ip-inset" style={{ padding:"16px 18px" }}>
//                 <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:10 }}>
//                   <ShieldCheck size={14} color={T.accentText} />
//                   <span style={{ fontSize:12, fontWeight:700, color:T.text }}>Interview rules</span>
//                 </div>
//                 <ul style={{ margin:0, padding:0, listStyle:"none", display:"flex", flexDirection:"column", gap:7 }}>
//                   {["Stay visible in camera throughout the interview.","If absent for more than 9 seconds, the interview ends automatically.","Speak naturally and answer in your own words."].map(r=>(
//                     <li key={r} style={{ display:"flex", alignItems:"flex-start", gap:8, fontSize:12.5, lineHeight:1.5, color:T.textSoft }}>
//                       <span style={{ width:5, height:5, borderRadius:"50%", background:T.accentText, marginTop:6, flexShrink:0 }} />{r}
//                     </li>
//                   ))}
//                 </ul>
//               </div>
//             </div>
//           </main>
//         </div>
//       </>
//     );
//   }

//   // ─── Interview screen ────────────────────────────────────────────────────────
//   return (
//     <>
//       <style dangerouslySetInnerHTML={{ __html: FONTS + css }} />
//       <canvas ref={faceCanvasRef} style={{ display:"none" }} aria-hidden="true" />

//       <div className="ip-shell" style={{ height:"100vh", display:"flex", flexDirection:"column", overflow:"hidden", position:"relative" }}>
//         <div className="ip-grid" style={{ position:"absolute", inset:0 }} />

//         {/* Topbar */}
//         <header className="ip-topbar" style={{ flexShrink:0, position:"relative", zIndex:100 }}>
//           <div className="ip-container ip-topbar-inner">
//             <div className="ip-brand">
//               <div className="ip-brandmark"><BrainCircuit size={16} /></div>
//               <div>
//                 <div className="ip-brand-name">Cuemath</div>
//                 <div className="ip-brand-sub">Tutor Screening</div>
//               </div>
//             </div>
//             <div style={{ display:"flex", alignItems:"center", gap:16 }}>
//               <div style={{ textAlign:"right" }}>
//                 <div style={{ fontSize:13, fontWeight:600, color:T.text }}>{candidateName}</div>
//                 {candidateEmail && <div style={{ fontSize:11, color:T.textMuted }}>{candidateEmail}</div>}
//               </div>
//               <button className="ip-theme-btn" onClick={toggleTheme} aria-label="Toggle theme">
//                 {theme==="dark" ? <Sun size={15} /> : <Moon size={15} />}
//               </button>
//             </div>
//           </div>
//         </header>

//         {/* Body */}
//         <div style={{ flex:1, overflow:"hidden", position:"relative", zIndex:1 }}>
//           <div className="ip-container" style={{ height:"100%", display:"grid", gridTemplateColumns:"320px 1fr", gap:20, padding:"20px 28px", alignItems:"stretch" }}>

//             {/* Sidebar */}
//             <aside style={{ display:"flex", flexDirection:"column", gap:14, height:"100%", overflowY:"auto" }}>
//               {/* Maya + Camera */}
//               <div className="ip-card" style={{ padding:18, flexShrink:0 }}>
//                 <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:14 }}>
//                   <div style={{ width:44, height:44, borderRadius:13, background:`linear-gradient(135deg,${T.accent},${T.accentAlt})`, display:"grid", placeItems:"center", color:"#fff", fontSize:17, fontWeight:800, boxShadow:`0 8px 20px ${T.accentRing}` }} className={isSpeaking?"ip-maya-pulse":""}>M</div>
//                   <div>
//                     <div style={{ fontSize:14, fontWeight:700, letterSpacing:"-0.025em", color:T.text }}>Maya</div>
//                     <div style={{ fontSize:11, color:T.textMuted }}>AI Interviewer · Cuemath</div>
//                   </div>
//                   <div style={{ marginLeft:"auto" }}>
//                     <div className={isSpeaking?"ip-chip-accent":isListening?"ip-chip-ok":"ip-chip-neutral"}>
//                       <span style={{ width:6, height:6, borderRadius:"50%", background:isSpeaking?T.accentText:isListening?T.success:"currentColor" }} />
//                       {isSpeaking?"Speaking":isListening?"Listening":"Waiting"}
//                     </div>
//                   </div>
//                 </div>

//                 {/* Camera */}
//                 <div style={{ borderRadius:10, overflow:"hidden", border:`1px solid ${T.border}`, aspectRatio:"16/9", background:T.inset }}>
//                   {cameraState==="granted" ? (
//                     <video ref={interviewVideoRef} autoPlay muted playsInline style={{ width:"100%", height:"100%", objectFit:"cover" }} />
//                   ) : (
//                     <div style={{ height:"100%", display:"grid", placeItems:"center" }}>
//                       <Camera size={24} color={T.accentText} />
//                     </div>
//                   )}
//                 </div>
//               </div>

//               {/* Progress */}
//               <div className="ip-card" style={{ padding:18, flexShrink:0 }}>
//                 <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:10 }}>
//                   <span style={{ fontSize:12, fontWeight:700, color:T.text }}>Progress</span>
//                   <span style={{ fontSize:11, color:T.textMuted }}>{displayCount} / {TOTAL_Q}</span>
//                 </div>
//                 <div className="ip-progress-bg" style={{ marginBottom:14 }}>
//                   <div className="ip-progress-fill" style={{ width:`${progress}%` }} />
//                 </div>
//                 <div style={{ display:"flex", flexWrap:"wrap", gap:7 }}>
//                   <StatusPill T={T} ok={micState==="granted"} icon={<Mic size={11} />} label={micState==="granted"?"Mic on":"Mic off"} />
//                   <StatusPill T={T} ok={cameraState==="granted"} icon={<Camera size={11} />} label={cameraState==="granted"?"Camera on":"Camera off"} />
//                   <StatusPill T={T} ok={inputMode==="voice"} icon={<Volume2 size={11} />} label={inputMode==="voice"?"Voice":"Typing"} />
//                 </div>
//               </div>

//               {/* Rules */}
//               <div className="ip-card" style={{ padding:18, flexShrink:0 }}>
//                 <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:10 }}>
//                   <ShieldCheck size={13} color={T.accentText} />
//                   <span style={{ fontSize:11, fontWeight:700, color:T.text }}>Interview rules</span>
//                 </div>
//                 <ul style={{ margin:0, padding:0, listStyle:"none", display:"flex", flexDirection:"column", gap:7 }}>
//                   {["Stay visible in camera throughout.","Absent 9s+ = auto-termination.","Speak naturally in your own words."].map(r=>(
//                     <li key={r} style={{ display:"flex", alignItems:"flex-start", gap:7, fontSize:11.5, lineHeight:1.5, color:T.textSoft }}>
//                       <span style={{ width:4, height:4, borderRadius:"50%", background:T.accentText, marginTop:6, flexShrink:0 }} />{r}
//                     </li>
//                   ))}
//                 </ul>
//               </div>

//               {/* Alerts */}
//               {faceAbsenceCountdown!==null && (
//                 <div className="ip-warn-box" style={{ display:"flex", gap:8, alignItems:"flex-start" }}>
//                   <AlertTriangle size={14} color={T.warning} style={{ flexShrink:0, marginTop:1 }} />
//                   <span>Stay visible. Terminating in <strong>{faceAbsenceCountdown}s</strong></span>
//                 </div>
//               )}
//               {usingFallback && (
//                 <div className="ip-inset" style={{ padding:"10px 12px", fontSize:11, color:T.textMuted }}>
//                   Fallback mode active — model unavailable.
//                 </div>
//               )}
//               {reportError && (
//                 <div className="ip-warn-box">{reportError}</div>
//               )}
//             </aside>

//             {/* Chat panel */}
//             <div className="ip-card" style={{ display:"flex", flexDirection:"column", overflow:"hidden" }}>
//               {/* Chat header */}
//               <div style={{ padding:"16px 22px", borderBottom:`1px solid ${T.border}`, flexShrink:0, display:"flex", alignItems:"center", justifyContent:"space-between", gap:16 }}>
//                 <div>
//                   <div style={{ fontSize:14, fontWeight:700, letterSpacing:"-0.02em", color:T.text }}>Live Interview</div>
//                   <div style={{ fontSize:12, color:T.textSoft, marginTop:2 }}>Answer naturally — Maya will guide you through each question.</div>
//                 </div>
//                 <div style={{ display:"flex", alignItems:"center", gap:8, flexShrink:0 }}>
//                   {supportsSpeech && micState==="granted" && (
//                     <button className="ip-btn-secondary" style={{ height:36, fontSize:12 }} onClick={()=>setInputModeSynced(inputMode==="voice"?"typing":"voice")}>
//                       {inputMode==="voice" ? "Switch to typing" : "Switch to voice"}
//                     </button>
//                   )}
//                   {inputMode==="voice" && micState==="granted" && (
//                     <button className={isListening?"ip-btn-danger":"ip-btn-primary"} style={{ height:36, fontSize:12 }} onClick={isListening?stopListening:startListening}>
//                       {isListening ? <><MicOff size={14} />Stop</> : <><Mic size={14} />Listen</>}
//                     </button>
//                   )}
//                 </div>
//               </div>

//               {/* Messages */}
//               <div style={{ flex:1, overflowY:"auto", padding:"20px 22px" }}>
//                 <div style={{ display:"flex", flexDirection:"column", gap:14, maxWidth:900, margin:"0 auto" }}>
//                   {messages.map((message, idx)=>{
//                     const isUser=message.role==="user";
//                     return (
//                       <div key={`${message.role}-${idx}`} style={{ display:"flex", justifyContent:isUser?"flex-end":"flex-start" }}>
//                         <div className={isUser?"ip-bubble-user":"ip-bubble-ai"} style={{ maxWidth:"78%" }}>
//                           <div className="ip-bubble-label">{isUser?"You":"Maya"}</div>
//                           <div className="ip-bubble-text">{message.content}</div>
//                         </div>
//                       </div>
//                     );
//                   })}

//                   {transcriptPreview && (
//                     <div style={{ display:"flex", justifyContent:"flex-end" }}>
//                       <div className="ip-bubble-user" style={{ maxWidth:"78%", opacity:0.8 }}>
//                         <div className="ip-bubble-label">You</div>
//                         <div className="ip-bubble-text">{transcriptPreview}</div>
//                       </div>
//                     </div>
//                   )}

//                   {isLoading && (
//                     <div style={{ display:"flex", justifyContent:"flex-start" }}>
//                       <div className="ip-bubble-ai" style={{ display:"flex", alignItems:"center", gap:10 }}>
//                         <Loader2 size={16} color={T.accentText} className="ip-spin" />
//                         <span style={{ fontSize:13.5, color:T.textSoft }}>Maya is thinking…</span>
//                       </div>
//                     </div>
//                   )}

//                   <div ref={chatEndRef} />
//                 </div>
//               </div>

//               {/* Input bar */}
//               {canUseTyping ? (
//                 <div style={{ padding:"14px 22px", borderTop:`1px solid ${T.border}`, flexShrink:0 }}>
//                   <div style={{ display:"flex", gap:10, alignItems:"flex-end", maxWidth:900, margin:"0 auto" }}>
//                     <textarea
//                       value={inputText}
//                       onChange={(e)=>setInputText(e.target.value)}
//                       rows={1}
//                       placeholder="Type your answer here…"
//                       className="ip-input"
//                       style={{ flex:1, minHeight:46 }}
//                       onKeyDown={(e)=>{ if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();handleManualSend();} }}
//                     />
//                     <button className="ip-btn-primary" onClick={handleManualSend} disabled={!inputText.trim()||isLoading} style={{ height:46, paddingLeft:18, paddingRight:18 }}>
//                       <Send size={15} />
//                     </button>
//                   </div>
//                 </div>
//               ) : (
//                 <div style={{ padding:"12px 22px", borderTop:`1px solid ${T.border}`, flexShrink:0, display:"flex", alignItems:"center", justifyContent:"space-between", maxWidth:"100%" }}>
//                   <span style={{ fontSize:12.5, color:T.textSoft }}>Voice mode — click <strong>Listen</strong> to respond.</span>
//                   <div className={isSpeaking?"ip-chip-accent":isListening?"ip-chip-ok":"ip-chip-neutral"}>
//                     <span style={{ width:6, height:6, borderRadius:"50%", background:isSpeaking?T.accentText:isListening?T.success:"currentColor" }} />
//                     {isSpeaking?"Maya speaking":isListening?"Listening":"Waiting"}
//                   </div>
//                 </div>
//               )}
//             </div>

//           </div>
//         </div>
//       </div>

//       {_interviewDone && false ? null : null}
//     </>
//   );
// }









// "use client";

// import { useCallback, useEffect, useRef, useState } from "react";
// import { useRouter } from "next/navigation";
// import {
//   Loader2,
//   Mic,
//   MicOff,
//   Volume2,
//   CheckCircle,
//   Clock,
//   MessageSquare,
//   BarChart2,
//   Camera,
//   Sun,
//   Moon,
//   ChevronRight,
//   AlertTriangle,
//   UserX,
//   BrainCircuit,
//   ShieldCheck,
// } from "lucide-react";

// // ─── Constants ────────────────────────────────────────────────────────────────
// const SILENCE_MS = 7000;
// const EMPTY_RESPONSE_MS = 10000;
// const TOTAL_Q = 6;
// const EMPTY_RESPONSE_TOKEN = "__EMPTY_RESPONSE__";

// const FACE_ABSENCE_TERMINATE_MS = 15000;
// const FACE_CHECK_INTERVAL_MS = 400;
// const PRESENCE_WARMUP_FRAMES = 6;
// const CONSECUTIVE_ABSENT_THRESHOLD = 2;
// const UNKNOWN_STREAK_BEFORE_SOFT_ABSENT = 6;
// const FALLBACK_SAMPLE_W = 224;
// const FALLBACK_SAMPLE_H = 168;
// const MIN_FACE_WIDTH_RATIO = 0.04;
// const MIN_FACE_HEIGHT_RATIO = 0.04;
// const CENTER_SKIN_RATIO_MIN = 0.06;
// const FULL_SKIN_RATIO_MIN = 0.03;
// const EDGE_RATIO_MIN = 0.04;
// const EDGE_RATIO_MAX = 0.16;
// const TEXTURE_COMPLEXITY_MAX = 0.13;
// const THEME_STORAGE_KEY = "maya_theme";

// // ─── ASR corrections ──────────────────────────────────────────────────────────
// const ASR_CORRECTIONS: [RegExp, string][] = [
//   [/\bgen only\b/gi,"genuinely"],[/\bgenu only\b/gi,"genuinely"],[/\bgenuinely only\b/gi,"genuinely"],
//   [/\binteract to like\b/gi,"interactive, like a"],[/\binteract to\b/gi,"interactive"],
//   [/\backnowledg(?:e|ing) (?:the )?feeling/gi,"acknowledge their feeling"],
//   [/\bfeel judge\b/gi,"feel judged"],[/\bfeel judges\b/gi,"feel judged"],
//   [/\bor present\b/gi,"or pressured"],[/\bleading question[s]?\b/gi,"leading questions"],
//   [/\bmanageable step[s]?\b/gi,"manageable steps"],[/\bmanage a step[s]?\b/gi,"manageable steps"],
//   [/\bmomentom\b/gi,"momentum"],[/\bmomentem\b/gi,"momentum"],
//   [/\bcelebrate small\b/gi,"celebrate small"],[/\bcelebreat\b/gi,"celebrate"],
//   [/\bdistract\b(?!ed|ing)/gi,"distracted"],[/\bit'?s in about\b/gi,"it's not about"],
//   [/\bin about explaining\b/gi,"not about explaining"],[/\bthat is in about\b/gi,"that is not about"],
//   [/\b(\w{3,})\s+\1\b/gi,"$1"],[/\s+na\b\.?/gi,""],[/\s+yaar\b\.?/gi,""],[/\s+hai\b\.?/gi,""],
//   [/\s+na\?\s*/g,". "],[/\s+only na\b/gi," only"],[/\bmachine learnings\b/gi,"machine learning"],
//   [/\bmission learning\b/gi,"machine learning"],[/\bmy shin learning\b/gi,"machine learning"],
//   [/\bmisin learning\b/gi,"machine learning"],[/\bmissing learning\b/gi,"machine learning"],
//   [/\bmy scene learning\b/gi,"machine learning"],[/\bmy chin learning\b/gi,"machine learning"],
//   [/\bmachine learner\b/gi,"machine learning"],[/\bmy shin learner\b/gi,"machine learning"],
//   [/\bartificial intelligent\b/gi,"artificial intelligence"],[/\bdeep learnings\b/gi,"deep learning"],
//   [/\bneural network's\b/gi,"neural networks"],[/\bcue math\b/gi,"Cuemath"],
//   [/\bcue maths\b/gi,"Cuemath"],[/\bque math\b/gi,"Cuemath"],[/\bque maths\b/gi,"Cuemath"],
//   [/\bq math\b/gi,"Cuemath"],[/\bkew math\b/gi,"Cuemath"],[/\bqueue math\b/gi,"Cuemath"],
//   [/\bcue mat\b/gi,"Cuemath"],[/\bcu math\b/gi,"Cuemath"],[/\bkyoomath\b/gi,"Cuemath"],
//   [/\bmath's\b/gi,"maths"],[/\bi would of\b/gi,"I would have"],[/\bcould of\b/gi,"could have"],
//   [/\bshould of\b/gi,"should have"],[/\bwould of\b/gi,"would have"],
//   [/\btheir going\b/gi,"they're going"],[/\btheir doing\b/gi,"they're doing"],
//   [/\byour welcome\b/gi,"you're welcome"],[/\bits a\b/gi,"it's a"],
//   [/\bi am having\b/gi,"I have"],[/\bI done\b/g,"I did"],
//   [/\bI am knowing\b/gi,"I know"],[/\bI am understanding\b/gi,"I understand"],
//   [/\bI am thinking\b/gi,"I think"],[/\btry your different\b/gi,"try a different"],
//   [/\brelated to something they are familiar\b/gi,"related to something they're familiar"],
//   [/\bbuild the confidence\b/gi,"build their confidence"],[/\bbuild (?:a )?confidence\b/gi,"build confidence"],
//   [/\bgiving them right answer\b/gi,"giving them the right answer"],
//   [/\bgiving (?:the )?right answer\b/gi,"giving the right answer"],
//   [/\bsmall manageable\b/gi,"smaller, manageable"],[/\bbreak (?:the )?problem into\b/gi,"break the problem into"],
//   [/\bsort reset\b/gi,"sort of a reset"],[/\beven is sort reset\b/gi,"which is sort of a reset"],
//   [/\bsometimes even is\b/gi,"sometimes, even a"],[/\bthink out loud\b/gi,"think out loud"],
//   [/\bthink aloud\b/gi,"think out loud"],[/\bto all them more\b/gi,"to ask them more"],
//   [/\ball them\b/gi,"ask them"],[/\s{2,}/g," "],
// ];

// function correctASRText(text: string): string {
//   let r = text;
//   for (const [p, s] of ASR_CORRECTIONS) r = r.replace(p, s);
//   return r.trim();
// }

// // ─── Types ────────────────────────────────────────────────────────────────────
// interface Message { role: "user" | "assistant"; content: string; }
// interface DetectedFace { boundingBox: DOMRectReadOnly; }
// interface BrowserFaceDetector { detect: (image: CanvasImageSource) => Promise<DetectedFace[]>; }

// declare global {
//   interface Window {
//     SpeechRecognition?: new () => BSR;
//     webkitSpeechRecognition?: new () => BSR;
//     FaceDetector?: new (options?: { fastMode?: boolean; maxDetectedFaces?: number }) => BrowserFaceDetector;
//   }
// }

// interface BSR {
//   continuous: boolean; interimResults: boolean; lang: string;
//   start: () => void; stop: () => void;
//   onresult: ((e: BSREvent) => void) | null;
//   onend: (() => void) | null;
//   onerror: ((e: BSRError) => void) | null;
//   onaudiostart: (() => void) | null;
// }
// interface BSREvent { resultIndex: number; results: { length: number; [i: number]: { isFinal: boolean; 0: { transcript: string } } }; }
// interface BSRError { error?: string; }
// type PresenceState = "present" | "absent" | "unknown";

// // ─── Fallback question bank ───────────────────────────────────────────────────
// const QUESTION_BANK = [
//   "To kick things off, could you tell me a little about yourself and what drew you to tutoring?",
//   "Imagine you're explaining fractions to a 9-year-old who's been staring blankly — how would you approach that?",
//   "Picture a student who's been stuck on the same problem for 5 minutes and says they want to give up. What do you do in that moment?",
//   "How do you keep a child engaged and motivated when you can tell they're bored or distracted?",
//   "What does patience genuinely mean to you as a tutor — not just in theory, but day to day?",
//   "[name], thank you so much for your time today. We'll be in touch soon with next steps. Best of luck — I'm rooting for you!",
// ];

// const QUESTION_OPENERS = ["","Great, let's move to the next one.","Good, here's the next scenario.","Thanks for that. Next question:","Appreciated. One more:",""];

// function buildFallbackReply(questionCount: number, name: string, userText: string, retryCount: number): { reply: string; shouldAdvance: boolean } {
//   const t = userText.toLowerCase();
//   const questionIndex = Math.max(0, Math.min(questionCount - 1, QUESTION_BANK.length - 2));
//   const nextIdx = Math.min(questionIndex + 1, QUESTION_BANK.length - 1);
//   const wantsToSkip = t.includes("next question")||t.includes("move on")||t.includes("skip")||t.includes("next one")||(t.includes("next")&&t.length<=10);
//   if (wantsToSkip) {
//     if (nextIdx >= QUESTION_BANK.length - 1) return { reply: QUESTION_BANK[QUESTION_BANK.length-1].replace("[name]", name), shouldAdvance: true };
//     const opener = QUESTION_OPENERS[nextIdx] || "Of course, let's move on.";
//     return { reply: `${opener} ${QUESTION_BANK[nextIdx]}`, shouldAdvance: true };
//   }
//   const currentQuestion = QUESTION_BANK[questionIndex];
//   const isCasualOrGreeting = t.includes("good morning")||t.includes("good afternoon")||t.includes("good evening")||t.includes("nice to meet")||t.includes("how are you")||t.includes("how is your day")||t.includes("how's your day")||t.includes("hello")||(t.includes("hi")&&userText.split(" ").length<=5);
//   if (retryCount === 0) {
//     const isNonAnswer = t==="no"||t==="nothing"||t==="idk"||t.includes("don't know")||t.includes("dont know")||t.includes("not sure")||t.includes("no idea")||t==="(no verbal response given)"||t==="no response";
//     const isClarificationRequest = t.includes("means what")||t.includes("explain me")||t.includes("more detail")||t.includes("what should i")||t.includes("how should i")||t.includes("what to say")||t.includes("what do you mean")||t.includes("can you explain")||t.includes("rephrase")||t.includes("clarify");
//     if (isCasualOrGreeting) {
//       const warmResponses = ["I'm doing wonderfully, thank you so much for asking — it really means a lot!","That's so sweet of you to ask! I'm great, thank you!","Aww, I appreciate that! Doing really well, thank you!"];
//       return { reply: `${warmResponses[Math.floor(Math.random()*warmResponses.length)]} ${currentQuestion}`, shouldAdvance: false };
//     }
//     if (isNonAnswer) return { reply: `No worries at all — take your time! ${currentQuestion}`, shouldAdvance: false };
//     if (isClarificationRequest) return { reply: `Of course! Just share what you personally would do or say in that moment — there's no right or wrong answer. ${currentQuestion}`, shouldAdvance: false };
//     return { reply: `I'd love to hear a little bit more from you on this. ${currentQuestion}`, shouldAdvance: false };
//   }
//   if (nextIdx >= QUESTION_BANK.length - 1) return { reply: QUESTION_BANK[QUESTION_BANK.length-1].replace("[name]", name), shouldAdvance: true };
//   const advanceMessages = isCasualOrGreeting ? "No worries at all — let's jump into it together!" : "Absolutely no pressure — let's move forward.";
//   return { reply: `${advanceMessages} ${QUESTION_BANK[nextIdx]}`, shouldAdvance: true };
// }

// // ─── Skin detection helpers ────────────────────────────────────────────────────
// function rgbToYCrCb(r: number, g: number, b: number) {
//   const y=0.299*r+0.587*g+0.114*b; const cb=128-0.168736*r-0.331264*g+0.5*b; const cr=128+0.5*r-0.418688*g-0.081312*b;
//   return { y, cb, cr };
// }
// function isSkinPixel(r: number, g: number, b: number): boolean {
//   const { y, cb, cr } = rgbToYCrCb(r, g, b);
//   const rgbRule = r>60&&g>30&&b>15&&Math.max(r,g,b)-Math.min(r,g,b)>20&&Math.abs(r-g)>12&&r>=g&&r>=b;
//   const ycbcrRule = y>50&&cb>=80&&cb<=130&&cr>=135&&cr<=175;
//   return rgbRule && ycbcrRule;
// }
// function sobelLikeEdgeScore(gray: Uint8ClampedArray, w: number, h: number): number {
//   let strongEdges=0; const total=(w-2)*(h-2);
//   for (let y=1;y<h-1;y++) for (let x=1;x<w-1;x++) {
//     const i=y*w+x;
//     const gx=-gray[i-w-1]-2*gray[i-1]-gray[i+w-1]+gray[i-w+1]+2*gray[i+1]+gray[i+w+1];
//     const gy=-gray[i-w-1]-2*gray[i-w]-gray[i-w+1]+gray[i+w-1]+2*gray[i+w]+gray[i+w+1];
//     if (Math.abs(gx)+Math.abs(gy)>180) strongEdges++;
//   }
//   return total>0 ? strongEdges/total : 0;
// }

// // ─── Briefing steps ───────────────────────────────────────────────────────────
// const BRIEFING_STEPS = [
//   { icon: MessageSquare, title: "Natural conversation", desc: "I'll ask you thoughtful tutor-screening questions. Speak naturally — the goal is to understand how you communicate and connect with students." },
//   { icon: Clock, title: "About 8–10 minutes", desc: "The interview is short and focused. There are no trick questions — I'm here to understand how you think and explain." },
//   { icon: Mic, title: "Voice-first interview", desc: "This interview is designed for speaking, since tutoring happens through live conversation. Microphone is required to proceed." },
//   { icon: BarChart2, title: "Structured assessment", desc: "After the conversation, you'll get a detailed report across clarity, warmth, patience, simplification, and English fluency." },
//   { icon: CheckCircle, title: "Be yourself", desc: "There are no perfect answers. I'm looking for warmth, clarity, and genuine care for students — not rehearsed lines." },
// ];

// // ─── Design tokens ────────────────────────────────────────────────────────────
// const FONTS = `
// @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;1,9..40,400;1,9..40,500&family=DM+Serif+Display:ital@0;1&display=swap');
// *,*::before,*::after { box-sizing: border-box; }
// html,body { margin: 0; padding: 0; font-family: "DM Sans", system-ui, sans-serif; }
// `;

// function getTokens(isDark: boolean) {
//   return isDark ? {
//     pageBg: "#080C14", pageBg2: "#0C1220",
//     gridLine: "rgba(255,255,255,0.03)",
//     text: "#F0F4FF", textSoft: "rgba(220,228,255,0.68)", textMuted: "rgba(220,228,255,0.38)",
//     surface: "#0E1628", surfaceElevated: "#111E35", inset: "#0A1120",
//     border: "rgba(255,255,255,0.08)", borderStrong: "rgba(255,255,255,0.13)",
//     accent: "#4F7BFF", accentAlt: "#8B5CF6", accentGlow: "rgba(79,123,255,0.16)",
//     accentRing: "rgba(79,123,255,0.22)", accentText: "#7BA8FF",
//     success: "#10D9A0", successBg: "rgba(16,217,160,0.08)", successBorder: "rgba(16,217,160,0.18)",
//     danger: "#F87171", dangerBg: "rgba(248,113,113,0.10)", dangerBorder: "rgba(248,113,113,0.22)",
//     warning: "#FBBF24", warningBg: "rgba(251,191,36,0.10)", warningBorder: "rgba(251,191,36,0.22)",
//     inputBg: "rgba(6,10,20,0.95)", inputBorder: "rgba(255,255,255,0.09)", inputFocus: "rgba(79,123,255,0.22)",
//     topbar: "rgba(8,12,20,0.88)",
//     bubbleAI: "#0E1628", bubbleAIBorder: "rgba(255,255,255,0.08)",
//     bubbleUser: "linear-gradient(135deg, #4F7BFF 0%, #8B5CF6 100%)",
//     shadow: "0 24px 64px rgba(0,0,0,0.50)", shadowMd: "0 12px 36px rgba(0,0,0,0.32)",
//     heroGlow1: "rgba(79,123,255,0.10)", heroGlow2: "rgba(139,92,246,0.07)",
//   } : {
//     pageBg: "#F4F6FB", pageBg2: "#EBF0FF",
//     gridLine: "rgba(13,21,38,0.04)",
//     text: "#0D1526", textSoft: "rgba(13,21,38,0.64)", textMuted: "rgba(13,21,38,0.38)",
//     surface: "#FFFFFF", surfaceElevated: "#FFFFFF", inset: "#F5F8FF",
//     border: "rgba(13,21,38,0.08)", borderStrong: "rgba(13,21,38,0.14)",
//     accent: "#3B63E8", accentAlt: "#7C3AED", accentGlow: "rgba(59,99,232,0.10)",
//     accentRing: "rgba(59,99,232,0.14)", accentText: "#3B63E8",
//     success: "#059669", successBg: "rgba(5,150,105,0.07)", successBorder: "rgba(5,150,105,0.18)",
//     danger: "#DC2626", dangerBg: "rgba(220,38,38,0.06)", dangerBorder: "rgba(220,38,38,0.18)",
//     warning: "#D97706", warningBg: "rgba(217,119,6,0.07)", warningBorder: "rgba(217,119,6,0.18)",
//     inputBg: "#FFFFFF", inputBorder: "rgba(13,21,38,0.10)", inputFocus: "rgba(59,99,232,0.16)",
//     topbar: "rgba(244,246,251,0.90)",
//     bubbleAI: "#FFFFFF", bubbleAIBorder: "rgba(13,21,38,0.09)",
//     bubbleUser: "linear-gradient(135deg, #3B63E8 0%, #7C3AED 100%)",
//     shadow: "0 24px 64px rgba(13,21,38,0.09)", shadowMd: "0 12px 36px rgba(13,21,38,0.07)",
//     heroGlow1: "rgba(59,99,232,0.08)", heroGlow2: "rgba(124,58,237,0.05)",
//   };
// }

// // ─── StatusPill ───────────────────────────────────────────────────────────────
// function StatusPill({ ok, icon, label, T }: { ok: boolean; icon: React.ReactNode; label: string; T: ReturnType<typeof getTokens> }) {
//   return (
//     <div style={{
//       display: "inline-flex", alignItems: "center", gap: 6, padding: "4px 10px",
//       borderRadius: 999, border: `1px solid ${ok ? T.successBorder : T.border}`,
//       background: ok ? T.successBg : "transparent",
//       color: ok ? T.success : T.textMuted, fontSize: 11, fontWeight: 600,
//     }}>
//       {icon}{label}
//     </div>
//   );
// }

// // ─── Main Component ───────────────────────────────────────────────────────────
// export default function InterviewPage() {
//   const router = useRouter();

//   // Refs
//   const chatEndRef = useRef<HTMLDivElement|null>(null);
//   const recognitionRef = useRef<BSR|null>(null);
//   const silenceTimerRef = useRef<ReturnType<typeof setTimeout>|null>(null);
//   const emptyResponseTimerRef = useRef<ReturnType<typeof setTimeout>|null>(null);
//   const sendMessageRef = useRef<(t:string)=>Promise<void>>(()=>Promise.resolve());
//   const finalTranscriptRef = useRef<string>("");
//   const interimTranscriptRef = useRef<string>("");
//   const isListeningRef = useRef(false);
//   const questionCountRef = useRef(1);
//   const isLoadingRef = useRef(false);
//   const interviewDoneRef = useRef(false);
//   const micStateRef = useRef<"idle"|"requesting"|"granted"|"denied">("idle");
//   const supportsSpeechRef = useRef(false);
//   const silenceAttemptRef = useRef<Record<number,number>>({});
//   const retryCountRef = useRef<Record<number,number>>({});
//   const briefingVideoRef = useRef<HTMLVideoElement|null>(null);
//   const interviewVideoRef = useRef<HTMLVideoElement|null>(null);
//   const cameraStreamRef = useRef<MediaStream|null>(null);
//   const sendInProgressRef = useRef(false);
//   const utteranceSentRef = useRef(false);
//   const faceCheckIntervalRef = useRef<ReturnType<typeof setInterval>|null>(null);
//   const faceAbsenceTimerRef = useRef<ReturnType<typeof setTimeout>|null>(null);
//   const faceCanvasRef = useRef<HTMLCanvasElement|null>(null);
//   const faceAbsenceStartRef = useRef<number|null>(null);
//   const faceTerminatedRef = useRef(false);
//   const nativeFaceDetectorRef = useRef<BrowserFaceDetector|null>(null);
//   const presenceCheckBusyRef = useRef(false);
//   const consecutiveAbsentCountRef = useRef(0);
//   const unknownPresenceCountRef = useRef(0);
//   const visibilityHandlerRef = useRef<(()=>void)|null>(null);
//   const hardAbortRef = useRef(false);
//   const mountedRef = useRef(true);
//   const deviceCheckRunningRef = useRef(false);

//   // State
//   const [theme, setTheme] = useState<"dark"|"light">("dark");
//   const T = getTokens(theme === "dark");

//   const [screen, setScreen] = useState<"briefing"|"interview">("briefing");
//   const [briefingStep, setBriefingStep] = useState(0);
//   const [mayaIntroPlayed, setMayaIntroPlayed] = useState(false);
//   const [nameLoaded, setNameLoaded] = useState(false);
//   const [messages, setMessages] = useState<Message[]>([]);
//   const [candidateName, setCandidateName] = useState("Candidate");
//   const [candidateEmail, setCandidateEmail] = useState("");
//   const [transcriptPreview, setTranscriptPreview] = useState("");
//   const [isListening, setIsListening] = useState(false);
//   const [isSpeaking, setIsSpeaking] = useState(false);
//   const [isLoading, setIsLoading] = useState(false);
//   const [questionCount, setQuestionCount] = useState(1);
//   const [usingFallback, setUsingFallback] = useState(false);
//   const [reportError, setReportError] = useState("");
//   const [micState, setMicState] = useState<"idle"|"requesting"|"granted"|"denied">("idle");
//   const [supportsSpeech, setSupportsSpeech] = useState(false);
//   const [isBeginning, setIsBeginning] = useState(false);
//   const [cameraState, setCameraState] = useState<"idle"|"requesting"|"granted"|"denied">("idle");
//   const [micVerified, setMicVerified] = useState(false);
//   const [cameraVerified, setCameraVerified] = useState(false);
//   const [deviceCheckRunning, setDeviceCheckRunning] = useState(false);
//   const [deviceCheckTranscript, setDeviceCheckTranscript] = useState("");
//   const [showMandatoryWarning, setShowMandatoryWarning] = useState(false);
//   const [faceAbsenceCountdown, setFaceAbsenceCountdown] = useState<number|null>(null);
//   const [terminated, setTerminated] = useState(false);
//   const [terminationReason, setTerminationReason] = useState("");
//   const [interviewDone, setInterviewDone] = useState(false);

//   const displayCount = Math.min(Math.max(questionCount-1,0), TOTAL_Q);
//   const progress = Math.min((displayCount/TOTAL_Q)*100, 100);

//   const setQCount = useCallback((n:number)=>{ questionCountRef.current=n; setQuestionCount(n); },[]);
//   const setLoading = useCallback((v:boolean)=>{ isLoadingRef.current=v; setIsLoading(v); },[]);
//   const setDone = useCallback((v:boolean)=>{ interviewDoneRef.current=v; setInterviewDone(v); },[]);
//   const setMicStateSynced = useCallback((v:"idle"|"requesting"|"granted"|"denied")=>{ micStateRef.current=v; setMicState(v); },[]);

//   const screenRef = useRef<"briefing"|"interview">(screen);
//   useEffect(()=>{ screenRef.current=screen; },[screen]);

//   useEffect(()=>{ mountedRef.current=true; return()=>{ mountedRef.current=false; deviceCheckRunningRef.current=false; }; },[]);

//   useEffect(()=>{
//     const name=localStorage.getItem("candidate_name")||"Candidate";
//     const email=localStorage.getItem("candidate_email")||"";
//     setCandidateName(name); setCandidateEmail(email); setNameLoaded(true);
//     const hasSpeech=typeof window!=="undefined"&&(!!window.SpeechRecognition||!!window.webkitSpeechRecognition);
//     supportsSpeechRef.current=hasSpeech; setSupportsSpeech(hasSpeech);
//     const savedTheme=localStorage.getItem(THEME_STORAGE_KEY) as "dark"|"light"|null;
//     if (savedTheme) setTheme(savedTheme);
//     hardAbortRef.current=false;
//   },[]);

//   useEffect(()=>{
//     if (typeof window==="undefined") return;
//     if ("FaceDetector" in window && !nativeFaceDetectorRef.current) {
//       try { nativeFaceDetectorRef.current=new (window.FaceDetector!)({ fastMode:true, maxDetectedFaces:1 }); }
//       catch(err) { console.error("face_detector_init_failed:", err); nativeFaceDetectorRef.current=null; }
//     }
//   },[]);

//   const toggleTheme = useCallback(()=>{
//     setTheme(t=>{ const next=t==="dark"?"light":"dark"; localStorage.setItem(THEME_STORAGE_KEY,next); return next; });
//   },[]);

//   // FIX: Safe JSON parse that handles non-JSON responses
//   const parseJson = useCallback(async(res:Response)=>{
//     const raw=await res.text();
//     if (!raw || !raw.trim()) throw new Error("Empty response from server");
//     try { return JSON.parse(raw) as Record<string,unknown>; }
//     catch { throw new Error(`Bad JSON response: ${raw.slice(0,120)}`); }
//   },[]);

//   const clearListeningTimers = useCallback(()=>{
//     if (silenceTimerRef.current) { clearTimeout(silenceTimerRef.current); silenceTimerRef.current=null; }
//     if (emptyResponseTimerRef.current) { clearTimeout(emptyResponseTimerRef.current); emptyResponseTimerRef.current=null; }
//   },[]);

//   const stopCameraPreview = useCallback(()=>{
//     if (cameraStreamRef.current) { cameraStreamRef.current.getTracks().forEach(t=>t.stop()); cameraStreamRef.current=null; }
//     if (briefingVideoRef.current) briefingVideoRef.current.srcObject=null;
//     if (interviewVideoRef.current) interviewVideoRef.current.srcObject=null;
//   },[]);

//   const attachCameraStreamToVisibleVideo = useCallback(async(retryOnNull=true)=>{
//     const stream=cameraStreamRef.current; if (!stream) return;
//     const currentScreen=screenRef.current;
//     const targetVideo=currentScreen==="briefing"?briefingVideoRef.current:interviewVideoRef.current;
//     if (!targetVideo) { if (retryOnNull) setTimeout(()=>void attachCameraStreamToVisibleVideo(false),200); return; }
//     if (targetVideo.srcObject!==stream) targetVideo.srcObject=stream;
//     try { await targetVideo.play(); } catch(e) { console.error("camera_preview_play_failed:",e); }
//   },[]);

//   useEffect(()=>{ void attachCameraStreamToVisibleVideo(); },[screen,cameraState,attachCameraStreamToVisibleVideo]);

//   const speak = useCallback((text:string):Promise<void>=>{
//     return new Promise(resolve=>{
//       if (typeof window==="undefined"||!window.speechSynthesis) { resolve(); return; }
//       if (hardAbortRef.current) { resolve(); return; }
//       const synth=window.speechSynthesis; synth.cancel();
//       const utterance=new SpeechSynthesisUtterance(text);
//       utterance.rate=0.8; utterance.pitch=1.4; utterance.volume=1; utterance.lang="en-US";
//       let settled=false;
//       const settle=()=>{ if(settled)return; settled=true; if(mountedRef.current)setIsSpeaking(false); resolve(); };
//       const pickVoice=()=>{
//         const voices=synth.getVoices();
//         const chosen=voices.find(v=>v.name==="Microsoft Jenny Online (Natural) - English (United States)")||voices.find(v=>v.name==="Microsoft Aria Online (Natural) - English (United States)")||voices.find(v=>v.name==="Microsoft Zira - English (United States)")||voices.find(v=>/jenny|aria|zira|samantha/i.test(v.name))||voices.find(v=>/google uk english female/i.test(v.name))||voices.find(v=>/female|woman/i.test(v.name))||voices.find(v=>/^en(-|_)/i.test(v.lang))||null;
//         if (chosen) utterance.voice=chosen;
//       };
//       if (synth.getVoices().length>0) pickVoice(); else synth.onvoiceschanged=()=>pickVoice();
//       const safetyTimer=window.setTimeout(()=>settle(), Math.min(text.length*85+3500, 20000));
//       const finish=()=>{ window.clearTimeout(safetyTimer); settle(); };
//       utterance.onstart=()=>{ if(hardAbortRef.current){synth.cancel();finish();return;} if(mountedRef.current)setIsSpeaking(true); };
//       utterance.onend=finish; utterance.onerror=finish;
//       try { synth.speak(utterance); } catch { finish(); }
//     });
//   },[]);

//   useEffect(()=>{ chatEndRef.current?.scrollIntoView({ behavior:"smooth" }); },[messages,transcriptPreview,isLoading]);

//   useEffect(()=>{
//     if (screen!=="briefing"||mayaIntroPlayed||!nameLoaded||candidateName==="Candidate") return;
//     const intro=`Hi ${candidateName}! I'm Maya, your AI interviewer from Cuemath. This is a short, voice-first screening interview. Please enable both your microphone and camera before starting — both are required for this interview. I'll guide you through each step.`;
//     const t=setTimeout(()=>{ hardAbortRef.current=false; void speak(intro); setMayaIntroPlayed(true); },800);
//     return()=>clearTimeout(t);
//   },[screen,mayaIntroPlayed,nameLoaded,candidateName,speak]);

//   const requestMicPermission = useCallback(async()=>{
//     setMicStateSynced("requesting");
//     try {
//       const stream=await navigator.mediaDevices.getUserMedia({audio:true});
//       stream.getTracks().forEach(t=>t.stop()); setMicStateSynced("granted");
//     } catch { setMicStateSynced("denied"); setMicVerified(false); }
//   },[setMicStateSynced]);

//   const requestCameraPermission = useCallback(async()=>{
//     if (cameraStreamRef.current) { cameraStreamRef.current.getTracks().forEach(t=>t.stop()); cameraStreamRef.current=null; }
//     setCameraState("requesting");
//     try {
//       const stream=await navigator.mediaDevices.getUserMedia({ video:{facingMode:"user",width:{ideal:640},height:{ideal:360}},audio:false });
//       cameraStreamRef.current=stream; const videoTrack=stream.getVideoTracks()[0];
//       if (videoTrack) console.log("camera_track_settings:",videoTrack.getSettings());
//       setCameraState("granted"); setCameraVerified(true);
//       const targetVideo=screenRef.current==="briefing"?briefingVideoRef.current:interviewVideoRef.current;
//       if (targetVideo) { targetVideo.srcObject=stream; try { await targetVideo.play(); } catch(e) { console.error("camera_preview_initial_play_failed:",e); } }
//     } catch(error) { console.error("camera_permission_failed:",error); setCameraState("denied"); setCameraVerified(false); }
//   },[]);

//   const verifyMicrophoneWithMaya = useCallback(async()=>{
//     if (hardAbortRef.current||deviceCheckRunningRef.current) return;
//     if (typeof window==="undefined"||micStateRef.current!=="granted") return;
//     const SpeechAPI=window.SpeechRecognition||window.webkitSpeechRecognition;
//     if (!SpeechAPI) { await speak("Your browser does not support microphone verification in voice mode. You can still continue."); return; }
//     deviceCheckRunningRef.current=true; setDeviceCheckRunning(true); setDeviceCheckTranscript(""); setMicVerified(false);
//     await speak("Let's quickly test your microphone. Please say: Maya, can you hear me clearly?");
//     if (hardAbortRef.current) { deviceCheckRunningRef.current=false; if(mountedRef.current)setDeviceCheckRunning(false); return; }
//     const rec=new SpeechAPI(); rec.continuous=false; rec.interimResults=true; rec.lang="en-IN";
//     let transcript=""; let settled=false;
//     const settle=async(ok:boolean,heardText:string)=>{
//       if (settled) return; settled=true;
//       try { rec.stop?.(); } catch {}
//       deviceCheckRunningRef.current=false; if (!mountedRef.current) return;
//       setDeviceCheckRunning(false); setDeviceCheckTranscript(heardText);
//       if (hardAbortRef.current) return;
//       if (ok) { setMicVerified(true); await speak("Yes, I can hear you properly. Your microphone looks good to go."); }
//       else { setMicVerified(false); await speak("I'm not hearing you clearly yet. Please check your microphone and try the test again."); }
//     };
//     const timeout=setTimeout(()=>void settle(transcript.trim().length>=6, transcript.trim()),6000);
//     rec.onresult=(e:BSREvent)=>{
//       let finalText=""; let interim="";
//       for (let i=e.resultIndex;i<e.results.length;i++) { if(e.results[i].isFinal)finalText+=e.results[i][0].transcript+" "; else interim+=e.results[i][0].transcript; }
//       transcript=(finalText||interim).trim(); if(mountedRef.current)setDeviceCheckTranscript(transcript);
//     };
//     rec.onerror=()=>{ clearTimeout(timeout); void settle(false,transcript.trim()); };
//     rec.onend=()=>{ clearTimeout(timeout); void settle(transcript.trim().length>=6,transcript.trim()); };
//     try { rec.start(); } catch { clearTimeout(timeout); deviceCheckRunningRef.current=false; if(mountedRef.current)setDeviceCheckRunning(false); await speak("I couldn't start the microphone test. Please try again."); }
//   },[speak]);

//   const doSend = useCallback((text:string)=>{
//     if (hardAbortRef.current||sendInProgressRef.current) return;
//     if (isLoadingRef.current||interviewDoneRef.current) return;
//     sendInProgressRef.current=true;
//     void sendMessageRef.current(text).finally(()=>{ sendInProgressRef.current=false; });
//   },[]);

//   const startListening = useCallback(()=>{
//     if (hardAbortRef.current) return;
//     if (typeof window==="undefined"||micStateRef.current!=="granted") return;
//     if (isListeningRef.current) { recognitionRef.current?.stop(); isListeningRef.current=false; setIsListening(false); }
//     const SpeechAPI=window.SpeechRecognition||window.webkitSpeechRecognition; if (!SpeechAPI) return;
//     finalTranscriptRef.current=""; interimTranscriptRef.current=""; setTranscriptPreview(""); clearListeningTimers(); sendInProgressRef.current=false; utteranceSentRef.current=false;
//     const qAtStart=questionCountRef.current;
//     if (silenceAttemptRef.current[qAtStart]===undefined) silenceAttemptRef.current[qAtStart]=0;
//     const rec=new SpeechAPI(); rec.continuous=true; rec.interimResults=true; rec.lang="en-IN";
//     emptyResponseTimerRef.current=setTimeout(()=>{
//       if (hardAbortRef.current) return;
//       if (isListeningRef.current) { rec.stop(); isListeningRef.current=false; setIsListening(false); setTranscriptPreview(""); }
//       if (!utteranceSentRef.current&&!sendInProgressRef.current&&!isLoadingRef.current&&!interviewDoneRef.current) {
//         const liveQ=questionCountRef.current; const attempts=silenceAttemptRef.current[liveQ]??0;
//         silenceAttemptRef.current[liveQ]=attempts+1; utteranceSentRef.current=true; doSend(EMPTY_RESPONSE_TOKEN);
//       }
//     },EMPTY_RESPONSE_MS);
//     rec.onresult=(e:BSREvent)=>{
//       if (hardAbortRef.current) return;
//       let newFinal=""; let interim="";
//       for (let i=e.resultIndex;i<e.results.length;i++) { if(e.results[i].isFinal)newFinal+=e.results[i][0].transcript+" "; else interim+=e.results[i][0].transcript; }
//       if (newFinal.trim()) finalTranscriptRef.current=(finalTranscriptRef.current+" "+newFinal).trim();
//       interimTranscriptRef.current=interim.trim();
//       const raw=(finalTranscriptRef.current+" "+interim).trim(); const display=correctASRText(raw);
//       if (display) { setTranscriptPreview(display); if(emptyResponseTimerRef.current){clearTimeout(emptyResponseTimerRef.current);emptyResponseTimerRef.current=null;} }
//       const liveQ=questionCountRef.current; silenceAttemptRef.current[liveQ]=0;
//       if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
//       const toSubmit=(finalTranscriptRef.current+" "+interim).trim();
//       if (toSubmit) {
//         silenceTimerRef.current=setTimeout(()=>{
//           if (hardAbortRef.current||!isListeningRef.current) return;
//           rec.stop(); isListeningRef.current=false; setIsListening(false);
//           const corrected=correctASRText(toSubmit);
//           if (!utteranceSentRef.current&&!sendInProgressRef.current&&!isLoadingRef.current&&!interviewDoneRef.current) { utteranceSentRef.current=true; doSend(corrected); }
//         },SILENCE_MS);
//       }
//     };
//     rec.onerror=(e:BSRError)=>{
//       isListeningRef.current=false; setIsListening(false); clearListeningTimers(); recognitionRef.current=null;
//       if (e?.error==="aborted") return;
//       if (e?.error==="not-allowed") { setMicStateSynced("denied"); return; }
//       if (hardAbortRef.current||isLoadingRef.current||interviewDoneRef.current) return;
//       const combined=(finalTranscriptRef.current+" "+interimTranscriptRef.current).trim();
//       const partial=correctASRText(combined);
//       if (partial&&!utteranceSentRef.current&&!sendInProgressRef.current) { utteranceSentRef.current=true; doSend(partial); }
//       else if (!utteranceSentRef.current&&!sendInProgressRef.current) {
//         setTimeout(()=>{ if(hardAbortRef.current||isLoadingRef.current||interviewDoneRef.current||sendInProgressRef.current||utteranceSentRef.current)return; utteranceSentRef.current=true; doSend(EMPTY_RESPONSE_TOKEN); },1500);
//       }
//     };
//     rec.onend=()=>{
//       isListeningRef.current=false; setIsListening(false); clearListeningTimers(); recognitionRef.current=null;
//       if (hardAbortRef.current||isLoadingRef.current||interviewDoneRef.current) return;
//       const combined=(finalTranscriptRef.current+" "+interimTranscriptRef.current).trim();
//       const partial=correctASRText(combined);
//       if (partial&&!utteranceSentRef.current&&!sendInProgressRef.current) { utteranceSentRef.current=true; doSend(partial); }
//     };
//     recognitionRef.current=rec; rec.start(); isListeningRef.current=true; setIsListening(true);
//   },[clearListeningTimers,doSend,setMicStateSynced]);

//   const stopListening = useCallback(()=>{
//     clearListeningTimers();
//     if (recognitionRef.current&&isListeningRef.current) recognitionRef.current.stop();
//     isListeningRef.current=false; setIsListening(false);
//     if (hardAbortRef.current||isLoadingRef.current||sendInProgressRef.current) return;
//     const combined=(finalTranscriptRef.current+" "+interimTranscriptRef.current).trim();
//     const captured=correctASRText(combined);
//     setTimeout(()=>{
//       if (hardAbortRef.current||sendInProgressRef.current||isLoadingRef.current||interviewDoneRef.current||utteranceSentRef.current) return;
//       utteranceSentRef.current=true; doSend(captured||EMPTY_RESPONSE_TOKEN);
//     },300);
//   },[clearListeningTimers,doSend]);

//   const maybeStartListening = useCallback(()=>{
//     if (hardAbortRef.current) return;
//     if (supportsSpeechRef.current&&micStateRef.current==="granted") setTimeout(()=>startListening(),700);
//   },[startListening]);

//   const generateReport = useCallback(async(finalMessages:Message[])=>{
//     if (hardAbortRef.current) return;
//     // FIX: Ensure messages are properly serialized before saving
//     const validMessages = finalMessages.filter(m => m.role && m.content && m.content.trim().length > 0);
//     const transcript=validMessages.map(m=>`${m.role==="user"?"Candidate":"Maya"}: ${m.content}`).join("\n\n");
//     try {
//       localStorage.setItem("interview_transcript", transcript);
//       localStorage.setItem("interview_messages", JSON.stringify(validMessages));
//       localStorage.setItem("assessment_saved_at", Date.now().toString());
//     } catch(e) { console.error("localStorage_save_failed:", e); }

//     const tryAssess=async()=>{
//       if (hardAbortRef.current) return;
//       const payload = { transcript, candidateName };
//       console.log("assess_payload_length:", transcript.length, "messages:", validMessages.length);
//       const res=await fetch("/api/assess",{
//         method:"POST",
//         headers:{"Content-Type":"application/json"},
//         body:JSON.stringify(payload)
//       });
//       if (!res.ok) {
//         const errText = await res.text();
//         throw new Error(`assess_${res.status}: ${errText.slice(0,120)}`);
//       }
//       const data=await parseJson(res);
//       try { localStorage.setItem("assessment_result",JSON.stringify(data)); } catch {}
//       if (!hardAbortRef.current) router.push("/report");
//     };

//     try { await tryAssess(); } catch(err) {
//       console.error("assess_first_attempt_failed:", err);
//       if (hardAbortRef.current) return;
//       setReportError("Generating report... please wait.");
//       setTimeout(async()=>{
//         try { if(!hardAbortRef.current)await tryAssess(); }
//         catch(err2) {
//           console.error("assess_second_attempt_failed:", err2);
//           if(!hardAbortRef.current)setReportError("Report generation failed. Please refresh the page.");
//         }
//       },3000);
//     }
//   },[candidateName,parseJson,router]);

//   const stopPresenceDetection = useCallback(()=>{
//     if (faceCheckIntervalRef.current) { clearInterval(faceCheckIntervalRef.current); faceCheckIntervalRef.current=null; }
//     if (faceAbsenceTimerRef.current) { clearTimeout(faceAbsenceTimerRef.current); faceAbsenceTimerRef.current=null; }
//     if (visibilityHandlerRef.current) { document.removeEventListener("visibilitychange",visibilityHandlerRef.current); visibilityHandlerRef.current=null; }
//     faceAbsenceStartRef.current=null; consecutiveAbsentCountRef.current=0; unknownPresenceCountRef.current=0; setFaceAbsenceCountdown(null);
//   },[]);

//   // FIX: Core sendMessage - validate messages before sending to API
//   const sendMessage = useCallback(async(text:string)=>{
//     if (hardAbortRef.current) return;
//     const trimmed=text.trim(); const isToken=text===EMPTY_RESPONSE_TOKEN;
//     const normalizedInput=isToken?"no response":trimmed;
//     if ((!trimmed&&!isToken)||isLoadingRef.current||interviewDoneRef.current) return;
//     clearListeningTimers();
//     const userMsg:Message={ role:"user", content:isToken?"(No verbal response given)":trimmed };

//     // FIX: Filter to only valid messages before sending
//     const validPrevMessages = messages.filter(m =>
//       (m.role === "user" || m.role === "assistant") &&
//       typeof m.content === "string" &&
//       m.content.trim().length > 0
//     );
//     const updated=[...validPrevMessages,userMsg];

//     setMessages(updated); setTranscriptPreview(""); finalTranscriptRef.current=""; interimTranscriptRef.current=""; setLoading(true);
//     const currentCount=questionCountRef.current; const currentRetryCount=retryCountRef.current[currentCount]??0;

//     try {
//       if (hardAbortRef.current) { setLoading(false); return; }

//       // FIX: Validate payload before sending
//       const payload = {
//         messages: updated.map(m => ({ role: m.role, content: m.content })),
//         candidateName,
//         questionCount: currentCount,
//         retryCount: currentRetryCount
//       };

//       console.log("chat_payload:", { messageCount: payload.messages.length, questionCount: currentCount });

//       const res=await fetch("/api/chat",{
//         method:"POST",
//         headers:{"Content-Type":"application/json"},
//         body:JSON.stringify(payload)
//       });

//       if (hardAbortRef.current) { setLoading(false); return; }

//       if (!res.ok) {
//         const errText = await res.text();
//         console.error("chat_api_error:", res.status, errText.slice(0,120));
//         throw new Error(`chat_${res.status}`);
//       }

//       const data=await parseJson(res);
//       if (hardAbortRef.current) { setLoading(false); return; }
//       if (data?.code==="QUOTA_EXCEEDED"||data?.source==="fallback") throw new Error("quota_fallback");
//       if (!data?.text) throw new Error((data?.error as string)||"unavailable");

//       const aiMsg:Message={ role:"assistant", content:data.text as string };
//       const final=[...updated,aiMsg]; const nextCount=data.isFollowUp?currentCount:currentCount+1;
//       if (data.isFollowUp) { retryCountRef.current={...retryCountRef.current,[currentCount]:currentRetryCount+1}; }
//       else { retryCountRef.current={...retryCountRef.current,[currentCount]:0,[nextCount]:0}; silenceAttemptRef.current[nextCount]=0; }
//       setMessages(final); setQCount(nextCount);
//       if (hardAbortRef.current) { setLoading(false); return; }
//       await speak(data.text as string);
//       if (hardAbortRef.current) { setLoading(false); return; }
//       if (data.isComplete||nextCount>=7) { setDone(true); setTimeout(()=>void generateReport(final),1200); } else { maybeStartListening(); }
//     } catch(err) {
//       if (hardAbortRef.current) { setLoading(false); return; }
//       const msg=err instanceof Error?err.message:String(err);
//       if (!msg.includes("quota")&&msg!=="quota_fallback") console.error("sendMessage_error:",err);
//       const { reply:fb, shouldAdvance }=buildFallbackReply(currentCount,candidateName,normalizedInput,currentRetryCount);
//       const nextCount=shouldAdvance?currentCount+1:currentCount;
//       if (shouldAdvance) { retryCountRef.current={...retryCountRef.current,[currentCount]:0,[nextCount]:0}; silenceAttemptRef.current[nextCount]=0; }
//       else { retryCountRef.current={...retryCountRef.current,[currentCount]:currentRetryCount+1}; }
//       const aiMsg:Message={ role:"assistant", content:fb }; const final=[...updated,aiMsg];
//       setMessages(final); setQCount(nextCount); setUsingFallback(true);
//       if (hardAbortRef.current) { setLoading(false); return; }
//       await speak(fb);
//       if (hardAbortRef.current) { setLoading(false); return; }
//       if (nextCount>=7) { setDone(true); setTimeout(()=>void generateReport(final),1200); } else { maybeStartListening(); }
//     } finally { setLoading(false); }
//   },[candidateName,clearListeningTimers,generateReport,maybeStartListening,messages,parseJson,setDone,setLoading,setQCount,speak]);

//   useEffect(()=>{ sendMessageRef.current=sendMessage; },[sendMessage]);

//   const checkPresence = useCallback(async():Promise<PresenceState>=>{
//     const video=interviewVideoRef.current; if (!video) return "unknown";
//     if (video.readyState<2||video.videoWidth===0||video.videoHeight===0) return "unknown";
//     if (presenceCheckBusyRef.current) return "unknown";
//     presenceCheckBusyRef.current=true;
//     try {
//       const vw=video.videoWidth; const vh=video.videoHeight;
//       if (nativeFaceDetectorRef.current) {
//         try {
//           const faces=await nativeFaceDetectorRef.current.detect(video);
//           if (faces.length===0) return "absent";
//           const validFace=faces.some(face=>{
//             const box=face.boundingBox; const cx=box.x+box.width/2; const cy=box.y+box.height/2;
//             const insideCentralRegion=cx>vw*0.12&&cx<vw*0.88&&cy>vh*0.08&&cy<vh*0.92;
//             const bigEnough=box.width>=vw*MIN_FACE_WIDTH_RATIO&&box.height>=vh*MIN_FACE_HEIGHT_RATIO;
//             return insideCentralRegion&&bigEnough;
//           });
//           return validFace?"present":"absent";
//         } catch(err) { console.error("face_detector_detect_failed:",err); }
//       }
//       const canvas=faceCanvasRef.current; if (!canvas) return "unknown";
//       const ctx=canvas.getContext("2d",{willReadFrequently:true}); if (!ctx) return "unknown";
//       canvas.width=FALLBACK_SAMPLE_W; canvas.height=FALLBACK_SAMPLE_H;
//       ctx.drawImage(video,0,0,FALLBACK_SAMPLE_W,FALLBACK_SAMPLE_H);
//       const imageData=ctx.getImageData(0,0,FALLBACK_SAMPLE_W,FALLBACK_SAMPLE_H); const data=imageData.data;
//       const gray=new Uint8ClampedArray(FALLBACK_SAMPLE_W*FALLBACK_SAMPLE_H);
//       let fullSkin=0; let centerSkin=0; let centerPixels=0;
//       const cx1=Math.floor(FALLBACK_SAMPLE_W*0.25); const cx2=Math.floor(FALLBACK_SAMPLE_W*0.75);
//       const cy1=Math.floor(FALLBACK_SAMPLE_H*0.12); const cy2=Math.floor(FALLBACK_SAMPLE_H*0.78);
//       for (let y=0;y<FALLBACK_SAMPLE_H;y++) for (let x=0;x<FALLBACK_SAMPLE_W;x++) {
//         const i=y*FALLBACK_SAMPLE_W+x; const di=i*4;
//         const r=data[di]; const g=data[di+1]; const b=data[di+2];
//         gray[i]=Math.round(0.299*r+0.587*g+0.114*b);
//         const skin=isSkinPixel(r,g,b); if(skin)fullSkin++;
//         const inCenter=x>=cx1&&x<=cx2&&y>=cy1&&y<=cy2;
//         if (inCenter) { centerPixels++; if(skin)centerSkin++; }
//       }
//       const fullSkinRatio=fullSkin/(FALLBACK_SAMPLE_W*FALLBACK_SAMPLE_H);
//       const centerSkinRatio=centerPixels>0?centerSkin/centerPixels:0;
//       const edgeRatio=sobelLikeEdgeScore(gray,FALLBACK_SAMPLE_W,FALLBACK_SAMPLE_H);
//       if (edgeRatio>TEXTURE_COMPLEXITY_MAX) return "absent";
//       const looksHumanish=centerSkinRatio>=CENTER_SKIN_RATIO_MIN&&fullSkinRatio>=FULL_SKIN_RATIO_MIN&&edgeRatio>=EDGE_RATIO_MIN&&edgeRatio<=EDGE_RATIO_MAX;
//       return looksHumanish?"present":"absent";
//     } catch(err) { console.error("presence_check_failed:",err); return "unknown"; }
//     finally { presenceCheckBusyRef.current=false; }
//   },[]);

//   const stopEverythingNow = useCallback(()=>{
//     hardAbortRef.current=true; stopPresenceDetection(); clearListeningTimers();
//     try { recognitionRef.current?.stop(); } catch {}
//     recognitionRef.current=null; isListeningRef.current=false; sendInProgressRef.current=false;
//     if (typeof window!=="undefined"&&window.speechSynthesis) window.speechSynthesis.cancel();
//     stopCameraPreview(); setIsListening(false); setIsSpeaking(false); setIsLoading(false);
//   },[clearListeningTimers,stopCameraPreview,stopPresenceDetection]);

//   const terminateInterview = useCallback((reason:string)=>{
//     if (faceTerminatedRef.current) return; faceTerminatedRef.current=true;
//     stopEverythingNow(); setTerminated(true); setTerminationReason(reason);
//   },[stopEverythingNow]);

//   const startPresenceDetection = useCallback(()=>{
//     if (faceCheckIntervalRef.current) return;
//     faceAbsenceStartRef.current=null; faceTerminatedRef.current=false;
//     consecutiveAbsentCountRef.current=0; unknownPresenceCountRef.current=0;
//     let warmupCount=0;
//     const handleVisibilityChange=()=>{
//       if (document.hidden) { faceAbsenceStartRef.current=null; consecutiveAbsentCountRef.current=0; unknownPresenceCountRef.current=0; if(mountedRef.current)setFaceAbsenceCountdown(null); }
//     };
//     visibilityHandlerRef.current=handleVisibilityChange;
//     document.addEventListener("visibilitychange",handleVisibilityChange);
//     faceCheckIntervalRef.current=setInterval(()=>{
//       if (faceTerminatedRef.current||interviewDoneRef.current||hardAbortRef.current) {
//         if(faceCheckIntervalRef.current){clearInterval(faceCheckIntervalRef.current);faceCheckIntervalRef.current=null;}
//         if(visibilityHandlerRef.current){document.removeEventListener("visibilitychange",visibilityHandlerRef.current);visibilityHandlerRef.current=null;}
//         return;
//       }
//       if (document.hidden) return;
//       if (warmupCount<PRESENCE_WARMUP_FRAMES) { warmupCount++; return; }
//       void (async()=>{
//         const state=await checkPresence();
//         if (state==="present") { faceAbsenceStartRef.current=null; consecutiveAbsentCountRef.current=0; unknownPresenceCountRef.current=0; if(mountedRef.current)setFaceAbsenceCountdown(null); return; }
//         if (state==="unknown") {
//           unknownPresenceCountRef.current+=1;
//           if (unknownPresenceCountRef.current<UNKNOWN_STREAK_BEFORE_SOFT_ABSENT) {
//             if (faceAbsenceStartRef.current!==null&&mountedRef.current) {
//               const absenceMs=Date.now()-faceAbsenceStartRef.current;
//               const remainingSecs=Math.max(0,Math.ceil((FACE_ABSENCE_TERMINATE_MS-absenceMs)/1000));
//               setFaceAbsenceCountdown(remainingSecs);
//               if (absenceMs>=FACE_ABSENCE_TERMINATE_MS) { terminateInterview("You were not visible in the camera frame for more than 9 seconds. The interview has been terminated as per our proctoring policy."); if(mountedRef.current)setFaceAbsenceCountdown(null); }
//             }
//             return;
//           }
//           consecutiveAbsentCountRef.current+=1;
//         } else { unknownPresenceCountRef.current=0; consecutiveAbsentCountRef.current+=1; }
//         if (consecutiveAbsentCountRef.current<CONSECUTIVE_ABSENT_THRESHOLD) return;
//         if (faceAbsenceStartRef.current===null) { faceAbsenceStartRef.current=Date.now(); }
//         const absenceMs=Date.now()-faceAbsenceStartRef.current;
//         const remainingSecs=Math.max(0,Math.ceil((FACE_ABSENCE_TERMINATE_MS-absenceMs)/1000));
//         if (mountedRef.current) setFaceAbsenceCountdown(remainingSecs);
//         if (absenceMs>=FACE_ABSENCE_TERMINATE_MS) { terminateInterview("You were not visible in the camera frame for more than 9 seconds. The interview has been terminated as per our proctoring policy."); if(mountedRef.current)setFaceAbsenceCountdown(null); }
//       })();
//     },FACE_CHECK_INTERVAL_MS);
//   },[checkPresence,terminateInterview]);

//   useEffect(()=>{
//     return()=>{
//       hardAbortRef.current=true; stopPresenceDetection(); clearListeningTimers();
//       try { recognitionRef.current?.stop(); } catch {}
//       recognitionRef.current=null;
//       if (typeof window!=="undefined"&&window.speechSynthesis) window.speechSynthesis.cancel();
//       stopCameraPreview();
//     };
//   },[clearListeningTimers,stopCameraPreview,stopPresenceDetection]);

//   const canBeginInterview = micState==="granted"&&cameraState==="granted";

//   const beginInterview = useCallback(async()=>{
//     if (!canBeginInterview) { setShowMandatoryWarning(true); await speak("Please enable both your microphone and camera before starting the interview. Both are required."); return; }
//     if (isBeginning) return;
//     setIsBeginning(true); setShowMandatoryWarning(false); window.speechSynthesis?.cancel(); clearListeningTimers();
//     hardAbortRef.current=false; faceTerminatedRef.current=false; setTerminated(false); setTerminationReason(""); setFaceAbsenceCountdown(null);
//     consecutiveAbsentCountRef.current=0; unknownPresenceCountRef.current=0;
//     retryCountRef.current=Object.create(null) as Record<number,number>;
//     silenceAttemptRef.current=Object.create(null) as Record<number,number>;
//     sendInProgressRef.current=false; utteranceSentRef.current=false; setUsingFallback(false);
//     setMessages([]); setTranscriptPreview(""); setQuestionCount(1); questionCountRef.current=1; setDone(false);
//     if (supportsSpeechRef.current&&micStateRef.current==="idle") {
//       setMicStateSynced("requesting");
//       try { const stream=await navigator.mediaDevices.getUserMedia({audio:true}); stream.getTracks().forEach(t=>t.stop()); setMicStateSynced("granted"); }
//       catch { setMicStateSynced("denied"); }
//     }
//     setScreen("interview");
//     setTimeout(()=>{ if(!hardAbortRef.current) { startPresenceDetection(); void attachCameraStreamToVisibleVideo(true); } },250);
//     setLoading(true);
//     try {
//       // FIX: Build a clean initial message array
//       const initial:Message[]=[{ role:"user", content:`Hi, my name is ${candidateName}.` }];
//       setMessages(initial);

//       const payload = {
//         messages: initial.map(m => ({ role: m.role, content: m.content })),
//         candidateName,
//         questionCount: 1,
//         retryCount: 0,
//         beginInterview: true
//       };

//       const res=await fetch("/api/chat",{
//         method:"POST",
//         headers:{"Content-Type":"application/json"},
//         body:JSON.stringify(payload)
//       });

//       if (!res.ok) throw new Error(`begin_interview_${res.status}`);

//       const data=await parseJson(res);
//       const text=(data?.text as string)||QUESTION_BANK[0];
//       const aiMsg:Message={ role:"assistant", content:text };
//       const final=[...initial,aiMsg];
//       setMessages(final); setQCount(2);
//       if (hardAbortRef.current) return;
//       await speak(text); if (!hardAbortRef.current) maybeStartListening();
//     } catch(err) {
//       console.error("beginInterview_error:",err); if(hardAbortRef.current)return;
//       const fallback=QUESTION_BANK[0];
//       const initial:Message[]=[{ role:"user", content:`Hi, my name is ${candidateName}.` }];
//       const aiMsg:Message={ role:"assistant", content:fallback };
//       const final=[...initial,aiMsg];
//       setMessages(final); setQCount(2); await speak(fallback); if(!hardAbortRef.current)maybeStartListening();
//     } finally { setLoading(false); setIsBeginning(false); }
//   },[attachCameraStreamToVisibleVideo,canBeginInterview,candidateName,clearListeningTimers,isBeginning,maybeStartListening,parseJson,setDone,setLoading,setMicStateSynced,setQCount,speak,startPresenceDetection]);

//   const handleReturnHome = useCallback(()=>{ stopEverythingNow(); router.push("/"); },[router,stopEverythingNow]);

//   // ─── Shared CSS ──────────────────────────────────────────────────────────────
//   const css = `
//     .ip-shell { min-height: 100vh; background: linear-gradient(160deg, ${T.pageBg} 0%, ${T.pageBg2} 100%); color: ${T.text}; font-family: "DM Sans", system-ui, sans-serif; }
//     .ip-grid::before { content:""; position:absolute; inset:0; pointer-events:none; z-index:0; background-image: linear-gradient(${T.gridLine} 1px, transparent 1px), linear-gradient(90deg, ${T.gridLine} 1px, transparent 1px); background-size: 48px 48px; }
//     .ip-topbar { position:sticky; top:0; z-index:100; height:62px; display:flex; align-items:center; border-bottom:1px solid ${T.border}; background:${T.topbar}; backdrop-filter:blur(20px); -webkit-backdrop-filter:blur(20px); }
//     .ip-container { max-width:1360px; margin:0 auto; padding:0 28px; width:100%; }
//     .ip-topbar-inner { display:flex; align-items:center; justify-content:space-between; width:100%; }
//     .ip-brand { display:flex; align-items:center; gap:10px; }
//     .ip-brandmark { width:34px; height:34px; border-radius:10px; background:linear-gradient(135deg,${T.accent},${T.accentAlt}); display:grid; place-items:center; color:#fff; }
//     .ip-brand-name { font-size:15px; font-weight:700; letter-spacing:-0.02em; color:${T.text}; }
//     .ip-brand-sub { font-size:10px; text-transform:uppercase; letter-spacing:0.10em; color:${T.textMuted}; margin-top:1px; }
//     .ip-theme-btn { width:36px; height:36px; border-radius:10px; border:1px solid ${T.border}; background:transparent; color:${T.textSoft}; display:grid; place-items:center; cursor:pointer; transition:border-color 0.15s,background 0.15s; }
//     .ip-theme-btn:hover { border-color:${T.borderStrong}; background:${T.surfaceElevated}; }
//     .ip-maya-pulse { animation: ip-pulse 2s infinite; }
//     .ip-card { border:1px solid ${T.border}; border-radius:20px; background:${T.surface}; box-shadow:${T.shadow}; }
//     .ip-panel { border:1px solid ${T.border}; border-radius:16px; background:${T.surfaceElevated}; }
//     .ip-inset { border:1px solid ${T.border}; border-radius:14px; background:${T.inset}; }
//     .ip-btn-primary { display:inline-flex; align-items:center; justify-content:center; gap:8px; border:0; border-radius:12px; padding:0 18px; height:42px; font-size:13.5px; font-weight:700; font-family:inherit; color:#fff; cursor:pointer; background:linear-gradient(135deg,${T.accent} 0%,${T.accentAlt} 100%); box-shadow:0 10px 28px ${T.accentRing}; transition:transform 0.15s,box-shadow 0.15s,opacity 0.15s; }
//     .ip-btn-primary:hover:not(:disabled) { transform:translateY(-1px); box-shadow:0 16px 36px ${T.accentRing}; }
//     .ip-btn-primary:disabled { opacity:0.45; cursor:not-allowed; }
//     .ip-btn-secondary { display:inline-flex; align-items:center; justify-content:center; gap:7px; border:1px solid ${T.border}; border-radius:12px; padding:0 16px; height:40px; font-size:13px; font-weight:600; font-family:inherit; color:${T.textSoft}; cursor:pointer; background:transparent; transition:border-color 0.15s,color 0.15s,background 0.15s; }
//     .ip-btn-secondary:hover { border-color:${T.borderStrong}; color:${T.text}; background:${T.surfaceElevated}; }
//     .ip-btn-danger { display:inline-flex; align-items:center; gap:7px; border:0; border-radius:12px; padding:0 16px; height:40px; font-size:13px; font-weight:600; font-family:inherit; color:#fff; cursor:pointer; background:linear-gradient(135deg,#EF4444,#DC2626); }
//     .ip-btn-full { width:100%; }
//     .ip-bubble-ai { border:1px solid ${T.bubbleAIBorder}; border-radius:18px 18px 18px 4px; padding:14px 18px; background:${T.bubbleAI}; box-shadow:${T.shadowMd}; }
//     .ip-bubble-user { border-radius:18px 18px 4px 18px; padding:14px 18px; background:${T.bubbleUser}; color:#fff; }
//     .ip-bubble-label { font-size:11px; font-weight:700; opacity:0.65; margin-bottom:6px; letter-spacing:0.02em; }
//     .ip-bubble-text { font-size:14.5px; line-height:1.65; }
//     .ip-step-active { border:1px solid ${T.accentRing}; background:${T.accentGlow}; border-radius:16px; padding:14px 16px; display:flex; align-items:flex-start; gap:14px; text-align:left; cursor:pointer; transition:border-color 0.15s,background 0.15s; width:100%; }
//     .ip-step-inactive { border:1px solid ${T.border}; background:transparent; border-radius:16px; padding:14px 16px; display:flex; align-items:flex-start; gap:14px; text-align:left; cursor:pointer; opacity:0.55; transition:opacity 0.15s,border-color 0.15s; width:100%; }
//     .ip-step-inactive:hover { opacity:0.75; border-color:${T.borderStrong}; }
//     .ip-step-icon-active { width:40px; height:40px; min-width:40px; border-radius:12px; background:${T.accentGlow}; border:1px solid ${T.accentRing}; display:grid; place-items:center; }
//     .ip-step-icon-inactive { width:40px; height:40px; min-width:40px; border-radius:12px; background:${T.surfaceElevated}; border:1px solid ${T.border}; display:grid; place-items:center; }
//     .ip-progress-bg { height:4px; border-radius:999px; background:${T.border}; overflow:hidden; }
//     .ip-progress-fill { height:100%; border-radius:999px; background:linear-gradient(90deg,${T.accent},${T.accentAlt}); transition:width 0.5s ease; }
//     .ip-device-btn { width:100%; border:1px solid ${T.border}; border-radius:12px; background:transparent; color:${T.textSoft}; font-size:13px; font-weight:600; font-family:inherit; padding:11px 16px; cursor:pointer; text-align:left; transition:border-color 0.15s,color 0.15s,background 0.15s; }
//     .ip-device-btn:hover { border-color:${T.borderStrong}; color:${T.text}; background:${T.surfaceElevated}; }
//     .ip-device-btn:disabled { opacity:0.5; cursor:not-allowed; }
//     @keyframes ip-pulse { 0%,100%{box-shadow:0 0 0 0 ${T.accentGlow}} 50%{box-shadow:0 0 0 6px transparent} }
//     @keyframes ip-spin { to{transform:rotate(360deg)} }
//     .ip-spin { animation:ip-spin 0.8s linear infinite; }
//     .ip-chip-ok { display:inline-flex; align-items:center; gap:5px; padding:4px 10px; border-radius:999px; border:1px solid ${T.successBorder}; background:${T.successBg}; color:${T.success}; font-size:11px; font-weight:600; }
//     .ip-chip-neutral { display:inline-flex; align-items:center; gap:5px; padding:4px 10px; border-radius:999px; border:1px solid ${T.border}; background:transparent; color:${T.textMuted}; font-size:11px; font-weight:600; }
//     .ip-chip-accent { display:inline-flex; align-items:center; gap:5px; padding:4px 10px; border-radius:999px; border:1px solid ${T.accentRing}; background:${T.accentGlow}; color:${T.accentText}; font-size:11px; font-weight:600; }
//     .ip-warn-box { border:1px solid ${T.warningBorder}; background:${T.warningBg}; border-radius:12px; padding:10px 14px; font-size:12px; color:${T.warning}; }
//     .ip-danger-box { border:1px solid ${T.dangerBorder}; background:${T.dangerBg}; border-radius:12px; padding:10px 14px; font-size:12px; color:${T.danger}; }
//   `;

//   // ─── Terminated screen ───────────────────────────────────────────────────────
//   if (terminated) {
//     return (
//       <>
//         <style dangerouslySetInnerHTML={{ __html: FONTS + css }} />
//         <div className="ip-shell" style={{ display:"flex", alignItems:"center", justifyContent:"center", padding:"40px 20px", position:"relative" }}>
//           <div className="ip-grid" style={{ position:"absolute", inset:0 }} />
//           <div className="ip-card" style={{ width:"100%", maxWidth:560, padding:"40px", position:"relative", zIndex:1 }}>
//             <div style={{ width:72, height:72, borderRadius:"50%", background:T.dangerBg, border:`1px solid ${T.dangerBorder}`, display:"grid", placeItems:"center", margin:"0 auto 24px" }}>
//               <UserX size={32} color={T.danger} />
//             </div>
//             <h1 style={{ margin:"0 0 12px", fontSize:24, fontWeight:700, letterSpacing:"-0.03em", textAlign:"center" }}>Interview terminated</h1>
//             <p style={{ margin:"0 0 24px", fontSize:14, lineHeight:1.7, color:T.textSoft, textAlign:"center" }}>{terminationReason}</p>
//             <div className="ip-warn-box" style={{ marginBottom:24, display:"flex", alignItems:"flex-start", gap:10 }}>
//               <AlertTriangle size={15} color={T.warning} style={{ flexShrink:0, marginTop:1 }} />
//               <span>Please ensure you remain visible in the camera throughout the interview.</span>
//             </div>
//             <button onClick={handleReturnHome} className="ip-btn-primary ip-btn-full" style={{ height:48, fontSize:15 }}>
//               Return to Home <ChevronRight size={16} />
//             </button>
//           </div>
//         </div>
//       </>
//     );
//   }

//   // ─── Briefing screen ─────────────────────────────────────────────────────────
//   if (screen === "briefing") {
//     return (
//       <>
//         <style dangerouslySetInnerHTML={{ __html: FONTS + css }} />
//         <canvas ref={faceCanvasRef} style={{ display:"none" }} aria-hidden="true" />

//         <div className="ip-shell" style={{ display:"flex", flexDirection:"column", minHeight:"100vh", position:"relative" }}>
//           <div className="ip-grid" style={{ position:"absolute", inset:0 }} />

//           <header className="ip-topbar" style={{ position:"sticky", zIndex:100 }}>
//             <div className="ip-container ip-topbar-inner">
//               <div className="ip-brand">
//                 <div className="ip-brandmark"><BrainCircuit size={16} /></div>
//                 <div>
//                   <div className="ip-brand-name">Cuemath</div>
//                   <div className="ip-brand-sub">Tutor Screening</div>
//                 </div>
//               </div>
//               <div style={{ display:"flex", alignItems:"center", gap:16 }}>
//                 <div style={{ textAlign:"right" }}>
//                   <div style={{ fontSize:13, fontWeight:600, color:T.text }}>{candidateName}</div>
//                   {candidateEmail && <div style={{ fontSize:11, color:T.textMuted }}>{candidateEmail}</div>}
//                 </div>
//                 <button className="ip-theme-btn" onClick={toggleTheme} aria-label="Toggle theme">
//                   {theme==="dark" ? <Sun size={15} /> : <Moon size={15} />}
//                 </button>
//               </div>
//             </div>
//           </header>

//           <main className="ip-container" style={{ position:"relative", zIndex:1, flex:1, display:"grid", gridTemplateColumns:"400px 1fr", gap:24, padding:"28px 28px", alignItems:"start" }}>

//             <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
//               <div className="ip-card" style={{ padding:20 }}>
//                 <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:16 }}>
//                   <div style={{ width:48, height:48, borderRadius:14, background:`linear-gradient(135deg,${T.accent},${T.accentAlt})`, display:"grid", placeItems:"center", color:"#fff", fontSize:18, fontWeight:800, boxShadow:`0 8px 20px ${T.accentRing}` }} className={isSpeaking?"ip-maya-pulse":""}>M</div>
//                   <div>
//                     <div style={{ fontSize:15, fontWeight:700, letterSpacing:"-0.025em", color:T.text }}>Maya</div>
//                     <div style={{ fontSize:11, color:T.textMuted, marginTop:2 }}>AI Interviewer · Cuemath</div>
//                   </div>
//                   <div style={{ marginLeft:"auto" }} className="ip-chip-ok">
//                     <span style={{ width:6, height:6, borderRadius:"50%", background:T.success }} />
//                     Ready
//                   </div>
//                 </div>
//                 <div style={{ borderRadius:12, overflow:"hidden", border:`1px solid ${T.border}`, aspectRatio:"16/9", background:T.inset, position:"relative" }}>
//                   {cameraState==="granted" ? (
//                     <video ref={briefingVideoRef} autoPlay muted playsInline style={{ width:"100%", height:"100%", objectFit:"cover" }} />
//                   ) : (
//                     <div style={{ height:"100%", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:10 }}>
//                       <Camera size={28} color={T.accentText} />
//                       <span style={{ fontSize:12, color:T.textMuted }}>Camera preview will appear here</span>
//                     </div>
//                   )}
//                 </div>
//               </div>

//               <div className="ip-card" style={{ padding:20 }}>
//                 <div style={{ fontSize:10, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.10em", color:T.textMuted, marginBottom:14 }}>Device Setup</div>
//                 <div style={{ display:"flex", flexDirection:"column", gap:8, marginBottom:14 }}>
//                   <button className="ip-device-btn" onClick={requestMicPermission}>
//                     <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
//                       <span style={{ display:"flex", alignItems:"center", gap:8 }}><Mic size={14} color={T.accentText} />{micState==="granted"?"Microphone enabled ✓":"Enable microphone"}</span>
//                       {micState==="granted" && <span style={{ fontSize:10, color:T.success }}>✓</span>}
//                     </div>
//                   </button>
//                   <button className="ip-device-btn" onClick={requestCameraPermission}>
//                     <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
//                       <span style={{ display:"flex", alignItems:"center", gap:8 }}><Camera size={14} color={T.accentText} />{cameraState==="granted"?"Camera enabled ✓":"Enable camera"}</span>
//                       {cameraState==="granted" && <span style={{ fontSize:10, color:T.success }}>✓</span>}
//                     </div>
//                   </button>
//                   <button className="ip-device-btn" onClick={verifyMicrophoneWithMaya} disabled={micState!=="granted"||deviceCheckRunning}>
//                     <span style={{ display:"flex", alignItems:"center", gap:8 }}>
//                       {deviceCheckRunning ? <Loader2 size={14} className="ip-spin" /> : <Volume2 size={14} color={T.accentText} />}
//                       {deviceCheckRunning?"Testing microphone…":"Test microphone with Maya"}
//                     </span>
//                   </button>
//                 </div>
//                 <div style={{ display:"flex", flexWrap:"wrap", gap:7, marginBottom:14 }}>
//                   <StatusPill T={T} ok={micState==="granted"} icon={<Mic size={12} />} label={micState==="granted"?"Mic on":"Mic off"} />
//                   <StatusPill T={T} ok={cameraState==="granted"} icon={<Camera size={12} />} label={cameraState==="granted"?"Camera on":"Camera off"} />
//                   <StatusPill T={T} ok={supportsSpeech} icon={<Volume2 size={12} />} label={supportsSpeech?"Voice support":"No voice support"} />
//                 </div>
//                 {deviceCheckTranscript && (
//                   <div className="ip-inset" style={{ padding:"10px 12px", marginBottom:12, fontSize:12, color:T.textSoft }}>
//                     Heard: <em>{deviceCheckTranscript}</em>
//                   </div>
//                 )}
//                 {showMandatoryWarning && (
//                   <div className="ip-danger-box" style={{ marginBottom:12 }}>
//                     Please enable both microphone and camera before starting.
//                   </div>
//                 )}
//                 <button className="ip-btn-primary ip-btn-full" onClick={beginInterview} disabled={!canBeginInterview||isBeginning} style={{ height:46, fontSize:14 }}>
//                   {isBeginning ? <><Loader2 size={15} className="ip-spin" />Starting…</> : <>Begin Interview <ChevronRight size={15} /></>}
//                 </button>
//               </div>
//             </div>

//             <div className="ip-card" style={{ padding:28 }}>
//               <div style={{ marginBottom:24 }}>
//                 <div style={{ fontSize:10, fontWeight:800, textTransform:"uppercase", letterSpacing:"0.14em", color:T.accentText, marginBottom:10 }}>Interview Briefing</div>
//                 <h2 style={{ margin:"0 0 10px", fontSize:26, fontWeight:700, letterSpacing:"-0.035em", lineHeight:1.2 }}>Quick overview before we start</h2>
//                 <p style={{ margin:0, fontSize:14, lineHeight:1.7, color:T.textSoft, maxWidth:600 }}>
//                   This interview follows a consistent, voice-first screening flow designed to evaluate communication, warmth, patience, and teaching presence.
//                 </p>
//               </div>
//               <div style={{ display:"flex", flexDirection:"column", gap:10, marginBottom:20 }}>
//                 {BRIEFING_STEPS.map((step, idx)=>{
//                   const Icon=step.icon; const active=idx===briefingStep;
//                   return (
//                     <button key={step.title} onClick={()=>setBriefingStep(idx)} className={active?"ip-step-active":"ip-step-inactive"}>
//                       <div className={active?"ip-step-icon-active":"ip-step-icon-inactive"}>
//                         <Icon size={18} color={T.accentText} />
//                       </div>
//                       <div style={{ textAlign:"left" }}>
//                         <div style={{ fontSize:13.5, fontWeight:700, color:T.text, marginBottom:4 }}>{step.title}</div>
//                         <div style={{ fontSize:12.5, lineHeight:1.55, color:T.textSoft }}>{step.desc}</div>
//                       </div>
//                       <div style={{ marginLeft:"auto", fontSize:10, color:T.textMuted, flexShrink:0 }}>{idx+1}/{BRIEFING_STEPS.length}</div>
//                     </button>
//                   );
//                 })}
//               </div>
//               <div className="ip-inset" style={{ padding:"16px 18px" }}>
//                 <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:10 }}>
//                   <ShieldCheck size={14} color={T.accentText} />
//                   <span style={{ fontSize:12, fontWeight:700, color:T.text }}>Interview rules</span>
//                 </div>
//                 <ul style={{ margin:0, padding:0, listStyle:"none", display:"flex", flexDirection:"column", gap:7 }}>
//                   {["Stay visible in camera throughout the interview.","If absent for more than 9 seconds, the interview ends automatically.","Speak naturally and answer in your own words."].map(r=>(
//                     <li key={r} style={{ display:"flex", alignItems:"flex-start", gap:8, fontSize:12.5, lineHeight:1.5, color:T.textSoft }}>
//                       <span style={{ width:5, height:5, borderRadius:"50%", background:T.accentText, marginTop:6, flexShrink:0 }} />{r}
//                     </li>
//                   ))}
//                 </ul>
//               </div>
//             </div>
//           </main>
//         </div>
//       </>
//     );
//   }

//   // ─── Interview screen ────────────────────────────────────────────────────────
//   return (
//     <>
//       <style dangerouslySetInnerHTML={{ __html: FONTS + css }} />
//       <canvas ref={faceCanvasRef} style={{ display:"none" }} aria-hidden="true" />

//       <div className="ip-shell" style={{ height:"100vh", display:"flex", flexDirection:"column", overflow:"hidden", position:"relative" }}>
//         <div className="ip-grid" style={{ position:"absolute", inset:0 }} />

//         <header className="ip-topbar" style={{ flexShrink:0, position:"relative", zIndex:100 }}>
//           <div className="ip-container ip-topbar-inner">
//             <div className="ip-brand">
//               <div className="ip-brandmark"><BrainCircuit size={16} /></div>
//               <div>
//                 <div className="ip-brand-name">Cuemath</div>
//                 <div className="ip-brand-sub">Tutor Screening</div>
//               </div>
//             </div>
//             <div style={{ display:"flex", alignItems:"center", gap:16 }}>
//               <div style={{ textAlign:"right" }}>
//                 <div style={{ fontSize:13, fontWeight:600, color:T.text }}>{candidateName}</div>
//                 {candidateEmail && <div style={{ fontSize:11, color:T.textMuted }}>{candidateEmail}</div>}
//               </div>
//               <button className="ip-theme-btn" onClick={toggleTheme} aria-label="Toggle theme">
//                 {theme==="dark" ? <Sun size={15} /> : <Moon size={15} />}
//               </button>
//             </div>
//           </div>
//         </header>

//         <div style={{ flex:1, overflow:"hidden", position:"relative", zIndex:1 }}>
//           <div className="ip-container" style={{ height:"100%", display:"grid", gridTemplateColumns:"320px 1fr", gap:20, padding:"20px 28px", alignItems:"stretch" }}>

//             {/* Sidebar */}
//             <aside style={{ display:"flex", flexDirection:"column", gap:14, height:"100%", overflowY:"auto" }}>
//               <div className="ip-card" style={{ padding:18, flexShrink:0 }}>
//                 <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:14 }}>
//                   <div style={{ width:44, height:44, borderRadius:13, background:`linear-gradient(135deg,${T.accent},${T.accentAlt})`, display:"grid", placeItems:"center", color:"#fff", fontSize:17, fontWeight:800, boxShadow:`0 8px 20px ${T.accentRing}` }} className={isSpeaking?"ip-maya-pulse":""}>M</div>
//                   <div>
//                     <div style={{ fontSize:14, fontWeight:700, letterSpacing:"-0.025em", color:T.text }}>Maya</div>
//                     <div style={{ fontSize:11, color:T.textMuted }}>AI Interviewer · Cuemath</div>
//                   </div>
//                   <div style={{ marginLeft:"auto" }}>
//                     <div className={isSpeaking?"ip-chip-accent":isListening?"ip-chip-ok":"ip-chip-neutral"}>
//                       <span style={{ width:6, height:6, borderRadius:"50%", background:isSpeaking?T.accentText:isListening?T.success:"currentColor" }} />
//                       {isSpeaking?"Speaking":isListening?"Listening":"Waiting"}
//                     </div>
//                   </div>
//                 </div>
//                 <div style={{ borderRadius:10, overflow:"hidden", border:`1px solid ${T.border}`, aspectRatio:"16/9", background:T.inset }}>
//                   {cameraState==="granted" ? (
//                     <video ref={interviewVideoRef} autoPlay muted playsInline style={{ width:"100%", height:"100%", objectFit:"cover" }} />
//                   ) : (
//                     <div style={{ height:"100%", display:"grid", placeItems:"center" }}>
//                       <Camera size={24} color={T.accentText} />
//                     </div>
//                   )}
//                 </div>
//               </div>

//               <div className="ip-card" style={{ padding:18, flexShrink:0 }}>
//                 <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:10 }}>
//                   <span style={{ fontSize:12, fontWeight:700, color:T.text }}>Progress</span>
//                   <span style={{ fontSize:11, color:T.textMuted }}>{displayCount} / {TOTAL_Q}</span>
//                 </div>
//                 <div className="ip-progress-bg" style={{ marginBottom:14 }}>
//                   <div className="ip-progress-fill" style={{ width:`${progress}%` }} />
//                 </div>
//                 <div style={{ display:"flex", flexWrap:"wrap", gap:7 }}>
//                   <StatusPill T={T} ok={micState==="granted"} icon={<Mic size={11} />} label={micState==="granted"?"Mic on":"Mic off"} />
//                   <StatusPill T={T} ok={cameraState==="granted"} icon={<Camera size={11} />} label={cameraState==="granted"?"Camera on":"Camera off"} />
//                 </div>
//               </div>

//               <div className="ip-card" style={{ padding:18, flexShrink:0 }}>
//                 <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:10 }}>
//                   <ShieldCheck size={13} color={T.accentText} />
//                   <span style={{ fontSize:11, fontWeight:700, color:T.text }}>Interview rules</span>
//                 </div>
//                 <ul style={{ margin:0, padding:0, listStyle:"none", display:"flex", flexDirection:"column", gap:7 }}>
//                   {["Stay visible in camera throughout.","Absent 9s+ = auto-termination.","Speak naturally in your own words."].map(r=>(
//                     <li key={r} style={{ display:"flex", alignItems:"flex-start", gap:7, fontSize:11.5, lineHeight:1.5, color:T.textSoft }}>
//                       <span style={{ width:4, height:4, borderRadius:"50%", background:T.accentText, marginTop:6, flexShrink:0 }} />{r}
//                     </li>
//                   ))}
//                 </ul>
//               </div>

//               {faceAbsenceCountdown!==null && (
//                 <div className="ip-warn-box" style={{ display:"flex", gap:8, alignItems:"flex-start" }}>
//                   <AlertTriangle size={14} color={T.warning} style={{ flexShrink:0, marginTop:1 }} />
//                   <span>Stay visible. Terminating in <strong>{faceAbsenceCountdown}s</strong></span>
//                 </div>
//               )}
//               {usingFallback && (
//                 <div className="ip-inset" style={{ padding:"10px 12px", fontSize:11, color:T.textMuted }}>
//                   Fallback mode active — model unavailable.
//                 </div>
//               )}
//               {reportError && (
//                 <div className="ip-warn-box">{reportError}</div>
//               )}
//             </aside>

//             {/* Chat panel — voice only, no typing UI */}
//             <div className="ip-card" style={{ display:"flex", flexDirection:"column", overflow:"hidden" }}>
//               {/* Chat header — REMOVED switch to typing button */}
//               <div style={{ padding:"16px 22px", borderBottom:`1px solid ${T.border}`, flexShrink:0, display:"flex", alignItems:"center", justifyContent:"space-between", gap:16 }}>
//                 <div>
//                   <div style={{ fontSize:14, fontWeight:700, letterSpacing:"-0.02em", color:T.text }}>Live Interview</div>
//                   <div style={{ fontSize:12, color:T.textSoft, marginTop:2 }}>Speak naturally — Maya will guide you through each question.</div>
//                 </div>
//                 {/* Voice controls only */}
//                 <div style={{ display:"flex", alignItems:"center", gap:8, flexShrink:0 }}>
//                   <button
//                     className={isListening?"ip-btn-danger":"ip-btn-primary"}
//                     style={{ height:36, fontSize:12, opacity: (isLoading || isSpeaking) ? 0.6 : 1 }}
//                     onClick={isListening ? stopListening : startListening}
//                     disabled={isLoading || isSpeaking || micState !== "granted"}
//                   >
//                     {isListening ? <><MicOff size={14} />Stop</> : <><Mic size={14} />Listen</>}
//                   </button>
//                 </div>
//               </div>

//               {/* Messages */}
//               <div style={{ flex:1, overflowY:"auto", padding:"20px 22px" }}>
//                 <div style={{ display:"flex", flexDirection:"column", gap:14, maxWidth:900, margin:"0 auto" }}>
//                   {messages.map((message, idx)=>{
//                     const isUser=message.role==="user";
//                     return (
//                       <div key={`${message.role}-${idx}`} style={{ display:"flex", justifyContent:isUser?"flex-end":"flex-start" }}>
//                         <div className={isUser?"ip-bubble-user":"ip-bubble-ai"} style={{ maxWidth:"78%" }}>
//                           <div className="ip-bubble-label">{isUser?"You":"Maya"}</div>
//                           <div className="ip-bubble-text">{message.content}</div>
//                         </div>
//                       </div>
//                     );
//                   })}

//                   {transcriptPreview && (
//                     <div style={{ display:"flex", justifyContent:"flex-end" }}>
//                       <div className="ip-bubble-user" style={{ maxWidth:"78%", opacity:0.8 }}>
//                         <div className="ip-bubble-label">You</div>
//                         <div className="ip-bubble-text">{transcriptPreview}</div>
//                       </div>
//                     </div>
//                   )}

//                   {isLoading && (
//                     <div style={{ display:"flex", justifyContent:"flex-start" }}>
//                       <div className="ip-bubble-ai" style={{ display:"flex", alignItems:"center", gap:10 }}>
//                         <Loader2 size={16} color={T.accentText} className="ip-spin" />
//                         <span style={{ fontSize:13.5, color:T.textSoft }}>Maya is thinking…</span>
//                       </div>
//                     </div>
//                   )}

//                   <div ref={chatEndRef} />
//                 </div>
//               </div>

//               {/* Status bar — voice only, no text input */}
//               <div style={{ padding:"12px 22px", borderTop:`1px solid ${T.border}`, flexShrink:0, display:"flex", alignItems:"center", justifyContent:"space-between", maxWidth:"100%" }}>
//                 <span style={{ fontSize:12.5, color:T.textSoft }}>
//                   {micState==="granted"
//                     ? "Voice mode — click Listen to respond when Maya finishes speaking."
//                     : "Microphone access required to participate."}
//                 </span>
//                 <div className={isSpeaking?"ip-chip-accent":isListening?"ip-chip-ok":"ip-chip-neutral"}>
//                   <span style={{ width:6, height:6, borderRadius:"50%", background:isSpeaking?T.accentText:isListening?T.success:"currentColor" }} />
//                   {isSpeaking?"Maya speaking":isListening?"Listening":"Waiting"}
//                 </div>
//               </div>
//             </div>

//           </div>
//         </div>
//       </div>
//     </>
//   );
// }






















// "use client";

// import { useCallback, useEffect, useRef, useState } from "react";
// import { useRouter } from "next/navigation";
// import {
//   Loader2,
//   Mic,
//   MicOff,
//   Volume2,
//   CheckCircle,
//   Clock,
//   MessageSquare,
//   BarChart2,
//   Camera,
//   Sun,
//   Moon,
//   ChevronRight,
//   AlertTriangle,
//   UserX,
//   BrainCircuit,
//   ShieldCheck,
// } from "lucide-react";

// // ─── Constants ────────────────────────────────────────────────────────────────
// const SILENCE_MS = 7000;
// const EMPTY_RESPONSE_MS = 10000;
// const TOTAL_Q = 6;
// const EMPTY_RESPONSE_TOKEN = "__EMPTY_RESPONSE__";

// const FACE_ABSENCE_TERMINATE_MS = 15000;
// const FACE_CHECK_INTERVAL_MS = 400;
// const PRESENCE_WARMUP_FRAMES = 6;
// const CONSECUTIVE_ABSENT_THRESHOLD = 2;
// const UNKNOWN_STREAK_BEFORE_SOFT_ABSENT = 6;
// const FALLBACK_SAMPLE_W = 224;
// const FALLBACK_SAMPLE_H = 168;
// const MIN_FACE_WIDTH_RATIO = 0.04;
// const MIN_FACE_HEIGHT_RATIO = 0.04;
// const CENTER_SKIN_RATIO_MIN = 0.06;
// const FULL_SKIN_RATIO_MIN = 0.03;
// const EDGE_RATIO_MIN = 0.04;
// const EDGE_RATIO_MAX = 0.16;
// const TEXTURE_COMPLEXITY_MAX = 0.13;
// const THEME_STORAGE_KEY = "maya_theme";

// // ─── ASR corrections ──────────────────────────────────────────────────────────
// const ASR_CORRECTIONS: [RegExp, string][] = [
//   [/\bgen only\b/gi,"genuinely"],[/\bgenu only\b/gi,"genuinely"],[/\bgenuinely only\b/gi,"genuinely"],
//   [/\binteract to like\b/gi,"interactive, like a"],[/\binteract to\b/gi,"interactive"],
//   [/\backnowledg(?:e|ing) (?:the )?feeling/gi,"acknowledge their feeling"],
//   [/\bfeel judge\b/gi,"feel judged"],[/\bfeel judges\b/gi,"feel judged"],
//   [/\bor present\b/gi,"or pressured"],[/\bleading question[s]?\b/gi,"leading questions"],
//   [/\bmanageable step[s]?\b/gi,"manageable steps"],[/\bmanage a step[s]?\b/gi,"manageable steps"],
//   [/\bmomentom\b/gi,"momentum"],[/\bmomentem\b/gi,"momentum"],
//   [/\bcelebrate small\b/gi,"celebrate small"],[/\bcelebreat\b/gi,"celebrate"],
//   [/\bdistract\b(?!ed|ing)/gi,"distracted"],[/\bit'?s in about\b/gi,"it's not about"],
//   [/\bin about explaining\b/gi,"not about explaining"],[/\bthat is in about\b/gi,"that is not about"],
//   [/\b(\w{3,})\s+\1\b/gi,"$1"],[/\s+na\b\.?/gi,""],[/\s+yaar\b\.?/gi,""],[/\s+hai\b\.?/gi,""],
//   [/\s+na\?\s*/g,". "],[/\s+only na\b/gi," only"],[/\bmachine learnings\b/gi,"machine learning"],
//   [/\bmission learning\b/gi,"machine learning"],[/\bmy shin learning\b/gi,"machine learning"],
//   [/\bmisin learning\b/gi,"machine learning"],[/\bmissing learning\b/gi,"machine learning"],
//   [/\bmy scene learning\b/gi,"machine learning"],[/\bmy chin learning\b/gi,"machine learning"],
//   [/\bmachine learner\b/gi,"machine learning"],[/\bmy shin learner\b/gi,"machine learning"],
//   [/\bartificial intelligent\b/gi,"artificial intelligence"],[/\bdeep learnings\b/gi,"deep learning"],
//   [/\bneural network's\b/gi,"neural networks"],[/\bcue math\b/gi,"Cuemath"],
//   [/\bcue maths\b/gi,"Cuemath"],[/\bque math\b/gi,"Cuemath"],[/\bque maths\b/gi,"Cuemath"],
//   [/\bq math\b/gi,"Cuemath"],[/\bkew math\b/gi,"Cuemath"],[/\bqueue math\b/gi,"Cuemath"],
//   [/\bcue mat\b/gi,"Cuemath"],[/\bcu math\b/gi,"Cuemath"],[/\bkyoomath\b/gi,"Cuemath"],
//   [/\bmath's\b/gi,"maths"],[/\bi would of\b/gi,"I would have"],[/\bcould of\b/gi,"could have"],
//   [/\bshould of\b/gi,"should have"],[/\bwould of\b/gi,"would have"],
//   [/\btheir going\b/gi,"they're going"],[/\btheir doing\b/gi,"they're doing"],
//   [/\byour welcome\b/gi,"you're welcome"],[/\bits a\b/gi,"it's a"],
//   [/\bi am having\b/gi,"I have"],[/\bI done\b/g,"I did"],
//   [/\bI am knowing\b/gi,"I know"],[/\bI am understanding\b/gi,"I understand"],
//   [/\bI am thinking\b/gi,"I think"],[/\btry your different\b/gi,"try a different"],
//   [/\brelated to something they are familiar\b/gi,"related to something they're familiar"],
//   [/\bbuild the confidence\b/gi,"build their confidence"],[/\bbuild (?:a )?confidence\b/gi,"build confidence"],
//   [/\bgiving them right answer\b/gi,"giving them the right answer"],
//   [/\bgiving (?:the )?right answer\b/gi,"giving the right answer"],
//   [/\bsmall manageable\b/gi,"smaller, manageable"],[/\bbreak (?:the )?problem into\b/gi,"break the problem into"],
//   [/\bsort reset\b/gi,"sort of a reset"],[/\beven is sort reset\b/gi,"which is sort of a reset"],
//   [/\bsometimes even is\b/gi,"sometimes, even a"],[/\bthink out loud\b/gi,"think out loud"],
//   [/\bthink aloud\b/gi,"think out loud"],[/\bto all them more\b/gi,"to ask them more"],
//   [/\ball them\b/gi,"ask them"],[/\s{2,}/g," "],
// ];

// function correctASRText(text: string): string {
//   let r = text;
//   for (const [p, s] of ASR_CORRECTIONS) r = r.replace(p, s);
//   return r.trim();
// }

// // ─── Types ────────────────────────────────────────────────────────────────────
// interface Message { role: "user" | "assistant"; content: string; }
// interface DetectedFace { boundingBox: DOMRectReadOnly; }
// interface BrowserFaceDetector { detect: (image: CanvasImageSource) => Promise<DetectedFace[]>; }

// declare global {
//   interface Window {
//     SpeechRecognition?: new () => BSR;
//     webkitSpeechRecognition?: new () => BSR;
//     FaceDetector?: new (options?: { fastMode?: boolean; maxDetectedFaces?: number }) => BrowserFaceDetector;
//   }
// }

// interface BSR {
//   continuous: boolean; interimResults: boolean; lang: string;
//   start: () => void; stop: () => void;
//   onresult: ((e: BSREvent) => void) | null;
//   onend: (() => void) | null;
//   onerror: ((e: BSRError) => void) | null;
//   onaudiostart: (() => void) | null;
// }
// interface BSREvent { resultIndex: number; results: { length: number; [i: number]: { isFinal: boolean; 0: { transcript: string } } }; }
// interface BSRError { error?: string; }
// type PresenceState = "present" | "absent" | "unknown";

// // ─── Fallback question bank ───────────────────────────────────────────────────
// const QUESTION_BANK = [
//   "To kick things off, could you tell me a little about yourself and what drew you to tutoring?",
//   "Imagine you're explaining fractions to a 9-year-old who's been staring blankly — how would you approach that?",
//   "Picture a student who's been stuck on the same problem for 5 minutes and says they want to give up. What do you do in that moment?",
//   "How do you keep a child engaged and motivated when you can tell they're bored or distracted?",
//   "What does patience genuinely mean to you as a tutor — not just in theory, but day to day?",
//   "[name], thank you so much for your time today. We'll be in touch soon with next steps. Best of luck — I'm rooting for you!",
// ];

// const QUESTION_OPENERS = [
//   "", "Great, let's move to the next one.", "Good, here's the next scenario.",
//   "Thanks for that. Next question:", "Appreciated. One more:", "",
// ];

// function buildFallbackReply(questionCount: number, name: string, userText: string, retryCount: number): { reply: string; shouldAdvance: boolean } {
//   const t = userText.toLowerCase();
//   const questionIndex = Math.max(0, Math.min(questionCount - 1, QUESTION_BANK.length - 2));
//   const nextIdx = Math.min(questionIndex + 1, QUESTION_BANK.length - 1);
//   const wantsToSkip = t.includes("next question") || t.includes("move on") || t.includes("skip") || t.includes("next one") || (t.includes("next") && t.length <= 10);
//   if (wantsToSkip) {
//     if (nextIdx >= QUESTION_BANK.length - 1) return { reply: QUESTION_BANK[QUESTION_BANK.length - 1].replace("[name]", name), shouldAdvance: true };
//     const opener = QUESTION_OPENERS[nextIdx] || "Of course, let's move on.";
//     return { reply: `${opener} ${QUESTION_BANK[nextIdx]}`, shouldAdvance: true };
//   }
//   const currentQuestion = QUESTION_BANK[questionIndex];
//   const isCasualOrGreeting = t.includes("good morning") || t.includes("good afternoon") || t.includes("good evening") || t.includes("nice to meet") || t.includes("how are you") || (t.includes("hi") && userText.split(" ").length <= 5);
//   if (retryCount === 0) {
//     const isNonAnswer = t === "no" || t === "nothing" || t === "idk" || t.includes("don't know") || t.includes("not sure") || t.includes("no idea") || t === "(no verbal response given)" || t === "no response";
//     const isClarificationRequest = t.includes("means what") || t.includes("explain me") || t.includes("more detail") || t.includes("what should i") || t.includes("what do you mean") || t.includes("rephrase") || t.includes("clarify");
//     if (isCasualOrGreeting) {
//       const warmResponses = ["I'm doing wonderfully, thank you so much for asking!", "That's so sweet of you to ask! I'm great, thank you!", "Aww, I appreciate that! Doing really well, thank you!"];
//       return { reply: `${warmResponses[Math.floor(Math.random() * warmResponses.length)]} ${currentQuestion}`, shouldAdvance: false };
//     }
//     if (isNonAnswer) return { reply: `No worries at all — take your time! ${currentQuestion}`, shouldAdvance: false };
//     if (isClarificationRequest) return { reply: `Of course! Just share what you personally would do in that moment — there's no right or wrong answer. ${currentQuestion}`, shouldAdvance: false };
//     return { reply: `I'd love to hear a little bit more from you on this. ${currentQuestion}`, shouldAdvance: false };
//   }
//   if (nextIdx >= QUESTION_BANK.length - 1) return { reply: QUESTION_BANK[QUESTION_BANK.length - 1].replace("[name]", name), shouldAdvance: true };
//   const advanceMessages = isCasualOrGreeting ? "No worries at all — let's jump into it together!" : "Absolutely no pressure — let's move forward.";
//   return { reply: `${advanceMessages} ${QUESTION_BANK[nextIdx]}`, shouldAdvance: true };
// }

// // ─── Skin detection helpers ────────────────────────────────────────────────────
// function rgbToYCrCb(r: number, g: number, b: number) {
//   const y = 0.299 * r + 0.587 * g + 0.114 * b;
//   const cb = 128 - 0.168736 * r - 0.331264 * g + 0.5 * b;
//   const cr = 128 + 0.5 * r - 0.418688 * g - 0.081312 * b;
//   return { y, cb, cr };
// }
// function isSkinPixel(r: number, g: number, b: number): boolean {
//   const { y, cb, cr } = rgbToYCrCb(r, g, b);
//   const rgbRule = r > 60 && g > 30 && b > 15 && Math.max(r, g, b) - Math.min(r, g, b) > 20 && Math.abs(r - g) > 12 && r >= g && r >= b;
//   const ycbcrRule = y > 50 && cb >= 80 && cb <= 130 && cr >= 135 && cr <= 175;
//   return rgbRule && ycbcrRule;
// }
// function sobelLikeEdgeScore(gray: Uint8ClampedArray, w: number, h: number): number {
//   let strongEdges = 0;
//   const total = (w - 2) * (h - 2);
//   for (let y = 1; y < h - 1; y++) for (let x = 1; x < w - 1; x++) {
//     const i = y * w + x;
//     const gx = -gray[i - w - 1] - 2 * gray[i - 1] - gray[i + w - 1] + gray[i - w + 1] + 2 * gray[i + 1] + gray[i + w + 1];
//     const gy = -gray[i - w - 1] - 2 * gray[i - w] - gray[i - w + 1] + gray[i + w - 1] + 2 * gray[i + w] + gray[i + w + 1];
//     if (Math.abs(gx) + Math.abs(gy) > 180) strongEdges++;
//   }
//   return total > 0 ? strongEdges / total : 0;
// }

// // ─── Briefing steps ───────────────────────────────────────────────────────────
// const BRIEFING_STEPS = [
//   { icon: MessageSquare, title: "Natural conversation", desc: "I'll ask you thoughtful tutor-screening questions. Speak naturally — the goal is to understand how you communicate and connect with students." },
//   { icon: Clock, title: "About 8–10 minutes", desc: "The interview is short and focused. There are no trick questions — I'm here to understand how you think and explain." },
//   { icon: Mic, title: "Voice-first interview", desc: "This interview is designed for speaking, since tutoring happens through live conversation. Microphone is required to proceed." },
//   { icon: BarChart2, title: "Structured assessment", desc: "After the conversation, you'll get a detailed report across clarity, warmth, patience, simplification, and English fluency." },
//   { icon: CheckCircle, title: "Be yourself", desc: "There are no perfect answers. I'm looking for warmth, clarity, and genuine care for students — not rehearsed lines." },
// ];

// // ─── Design tokens ────────────────────────────────────────────────────────────
// const FONTS = `
// @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;1,9..40,400;1,9..40,500&family=DM+Serif+Display:ital@0;1&display=swap');
// *,*::before,*::after { box-sizing: border-box; }
// html,body { margin: 0; padding: 0; font-family: "DM Sans", system-ui, sans-serif; }
// `;

// function getTokens(isDark: boolean) {
//   return isDark ? {
//     pageBg: "#080C14", pageBg2: "#0C1220",
//     gridLine: "rgba(255,255,255,0.03)",
//     text: "#F0F4FF", textSoft: "rgba(220,228,255,0.68)", textMuted: "rgba(220,228,255,0.38)",
//     surface: "#0E1628", surfaceElevated: "#111E35", inset: "#0A1120",
//     border: "rgba(255,255,255,0.08)", borderStrong: "rgba(255,255,255,0.13)",
//     accent: "#4F7BFF", accentAlt: "#8B5CF6", accentGlow: "rgba(79,123,255,0.16)",
//     accentRing: "rgba(79,123,255,0.22)", accentText: "#7BA8FF",
//     success: "#10D9A0", successBg: "rgba(16,217,160,0.08)", successBorder: "rgba(16,217,160,0.18)",
//     danger: "#F87171", dangerBg: "rgba(248,113,113,0.10)", dangerBorder: "rgba(248,113,113,0.22)",
//     warning: "#FBBF24", warningBg: "rgba(251,191,36,0.10)", warningBorder: "rgba(251,191,36,0.22)",
//     inputBg: "rgba(6,10,20,0.95)", inputBorder: "rgba(255,255,255,0.09)", inputFocus: "rgba(79,123,255,0.22)",
//     topbar: "rgba(8,12,20,0.88)",
//     bubbleAI: "#0E1628", bubbleAIBorder: "rgba(255,255,255,0.08)",
//     bubbleUser: "linear-gradient(135deg, #4F7BFF 0%, #8B5CF6 100%)",
//     shadow: "0 24px 64px rgba(0,0,0,0.50)", shadowMd: "0 12px 36px rgba(0,0,0,0.32)",
//     heroGlow1: "rgba(79,123,255,0.10)", heroGlow2: "rgba(139,92,246,0.07)",
//   } : {
//     pageBg: "#F4F6FB", pageBg2: "#EBF0FF",
//     gridLine: "rgba(13,21,38,0.04)",
//     text: "#0D1526", textSoft: "rgba(13,21,38,0.64)", textMuted: "rgba(13,21,38,0.38)",
//     surface: "#FFFFFF", surfaceElevated: "#FFFFFF", inset: "#F5F8FF",
//     border: "rgba(13,21,38,0.08)", borderStrong: "rgba(13,21,38,0.14)",
//     accent: "#3B63E8", accentAlt: "#7C3AED", accentGlow: "rgba(59,99,232,0.10)",
//     accentRing: "rgba(59,99,232,0.14)", accentText: "#3B63E8",
//     success: "#059669", successBg: "rgba(5,150,105,0.07)", successBorder: "rgba(5,150,105,0.18)",
//     danger: "#DC2626", dangerBg: "rgba(220,38,38,0.06)", dangerBorder: "rgba(220,38,38,0.18)",
//     warning: "#D97706", warningBg: "rgba(217,119,6,0.07)", warningBorder: "rgba(217,119,6,0.18)",
//     inputBg: "#FFFFFF", inputBorder: "rgba(13,21,38,0.10)", inputFocus: "rgba(59,99,232,0.16)",
//     topbar: "rgba(244,246,251,0.90)",
//     bubbleAI: "#FFFFFF", bubbleAIBorder: "rgba(13,21,38,0.09)",
//     bubbleUser: "linear-gradient(135deg, #3B63E8 0%, #7C3AED 100%)",
//     shadow: "0 24px 64px rgba(13,21,38,0.09)", shadowMd: "0 12px 36px rgba(13,21,38,0.07)",
//     heroGlow1: "rgba(59,99,232,0.08)", heroGlow2: "rgba(124,58,237,0.05)",
//   };
// }

// function StatusPill({ ok, icon, label, T }: { ok: boolean; icon: React.ReactNode; label: string; T: ReturnType<typeof getTokens> }) {
//   return (
//     <div style={{
//       display: "inline-flex", alignItems: "center", gap: 6, padding: "4px 10px",
//       borderRadius: 999, border: `1px solid ${ok ? T.successBorder : T.border}`,
//       background: ok ? T.successBg : "transparent",
//       color: ok ? T.success : T.textMuted, fontSize: 11, fontWeight: 600,
//     }}>
//       {icon}{label}
//     </div>
//   );
// }

// // ─── Main Component ───────────────────────────────────────────────────────────
// export default function InterviewPage() {
//   const router = useRouter();

//   // Refs
//   const chatEndRef = useRef<HTMLDivElement | null>(null);
//   const recognitionRef = useRef<BSR | null>(null);
//   const silenceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
//   const emptyResponseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
//   const sendMessageRef = useRef<(t: string) => Promise<void>>(() => Promise.resolve());
//   const finalTranscriptRef = useRef<string>("");
//   const interimTranscriptRef = useRef<string>("");
//   const isListeningRef = useRef(false);
//   const questionCountRef = useRef(1);
//   const isLoadingRef = useRef(false);
//   const interviewDoneRef = useRef(false);
//   const micStateRef = useRef<"idle" | "requesting" | "granted" | "denied">("idle");
//   const supportsSpeechRef = useRef(false);
//   const silenceAttemptRef = useRef<Record<number, number>>({});
//   const retryCountRef = useRef<Record<number, number>>({});
//   const briefingVideoRef = useRef<HTMLVideoElement | null>(null);
//   const interviewVideoRef = useRef<HTMLVideoElement | null>(null);
//   const cameraStreamRef = useRef<MediaStream | null>(null);
//   const sendInProgressRef = useRef(false);
//   const utteranceSentRef = useRef(false);
//   const faceCheckIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
//   const faceAbsenceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
//   const faceCanvasRef = useRef<HTMLCanvasElement | null>(null);
//   const faceAbsenceStartRef = useRef<number | null>(null);
//   const faceTerminatedRef = useRef(false);
//   const nativeFaceDetectorRef = useRef<BrowserFaceDetector | null>(null);
//   const presenceCheckBusyRef = useRef(false);
//   const consecutiveAbsentCountRef = useRef(0);
//   const unknownPresenceCountRef = useRef(0);
//   const visibilityHandlerRef = useRef<(() => void) | null>(null);
//   const hardAbortRef = useRef(false);
//   const mountedRef = useRef(true);
//   const deviceCheckRunningRef = useRef(false);

//   // State
//   const [theme, setTheme] = useState<"dark" | "light">("dark");
//   const T = getTokens(theme === "dark");

//   const [screen, setScreen] = useState<"briefing" | "interview">("briefing");
//   const [briefingStep, setBriefingStep] = useState(0);
//   const [mayaIntroPlayed, setMayaIntroPlayed] = useState(false);
//   const [nameLoaded, setNameLoaded] = useState(false);
//   const [messages, setMessages] = useState<Message[]>([]);
//   const [candidateName, setCandidateName] = useState("Candidate");
//   const [candidateEmail, setCandidateEmail] = useState("");
//   const [transcriptPreview, setTranscriptPreview] = useState("");
//   const [isListening, setIsListening] = useState(false);
//   const [isSpeaking, setIsSpeaking] = useState(false);
//   const [isLoading, setIsLoading] = useState(false);
//   const [questionCount, setQuestionCount] = useState(1);
//   const [usingFallback, setUsingFallback] = useState(false);
//   const [reportError, setReportError] = useState("");
//   const [micState, setMicState] = useState<"idle" | "requesting" | "granted" | "denied">("idle");
//   const [supportsSpeech, setSupportsSpeech] = useState(false);
//   const [isBeginning, setIsBeginning] = useState(false);
//   const [cameraState, setCameraState] = useState<"idle" | "requesting" | "granted" | "denied">("idle");
//   const [micVerified, setMicVerified] = useState(false);
//   const [cameraVerified, setCameraVerified] = useState(false);
//   const [deviceCheckRunning, setDeviceCheckRunning] = useState(false);
//   const [deviceCheckTranscript, setDeviceCheckTranscript] = useState("");
//   const [showMandatoryWarning, setShowMandatoryWarning] = useState(false);
//   const [faceAbsenceCountdown, setFaceAbsenceCountdown] = useState<number | null>(null);
//   const [terminated, setTerminated] = useState(false);
//   const [terminationReason, setTerminationReason] = useState("");
//   const [interviewDone, setInterviewDone] = useState(false);

//   const displayCount = Math.min(Math.max(questionCount - 1, 0), TOTAL_Q);
//   const progress = Math.min((displayCount / TOTAL_Q) * 100, 100);

//   const setQCount = useCallback((n: number) => { questionCountRef.current = n; setQuestionCount(n); }, []);
//   const setLoading = useCallback((v: boolean) => { isLoadingRef.current = v; setIsLoading(v); }, []);
//   const setDone = useCallback((v: boolean) => { interviewDoneRef.current = v; setInterviewDone(v); }, []);
//   const setMicStateSynced = useCallback((v: "idle" | "requesting" | "granted" | "denied") => { micStateRef.current = v; setMicState(v); }, []);

//   const screenRef = useRef<"briefing" | "interview">(screen);
//   useEffect(() => { screenRef.current = screen; }, [screen]);

//   useEffect(() => {
//     mountedRef.current = true;
//     return () => { mountedRef.current = false; deviceCheckRunningRef.current = false; };
//   }, []);

//   useEffect(() => {
//     const name = localStorage.getItem("candidate_name") || "Candidate";
//     const email = localStorage.getItem("candidate_email") || "";
//     setCandidateName(name); setCandidateEmail(email); setNameLoaded(true);
//     const hasSpeech = typeof window !== "undefined" && (!!window.SpeechRecognition || !!window.webkitSpeechRecognition);
//     supportsSpeechRef.current = hasSpeech; setSupportsSpeech(hasSpeech);
//     const savedTheme = localStorage.getItem(THEME_STORAGE_KEY) as "dark" | "light" | null;
//     if (savedTheme) setTheme(savedTheme);
//     hardAbortRef.current = false;
//   }, []);

//   useEffect(() => {
//     if (typeof window === "undefined") return;
//     if ("FaceDetector" in window && !nativeFaceDetectorRef.current) {
//       try { nativeFaceDetectorRef.current = new (window.FaceDetector!)({ fastMode: true, maxDetectedFaces: 1 }); }
//       catch (err) { console.error("face_detector_init_failed:", err); nativeFaceDetectorRef.current = null; }
//     }
//   }, []);

//   const toggleTheme = useCallback(() => {
//     setTheme((t) => { const next = t === "dark" ? "light" : "dark"; localStorage.setItem(THEME_STORAGE_KEY, next); return next; });
//   }, []);

//   const clearListeningTimers = useCallback(() => {
//     if (silenceTimerRef.current) { clearTimeout(silenceTimerRef.current); silenceTimerRef.current = null; }
//     if (emptyResponseTimerRef.current) { clearTimeout(emptyResponseTimerRef.current); emptyResponseTimerRef.current = null; }
//   }, []);

//   const stopCameraPreview = useCallback(() => {
//     if (cameraStreamRef.current) { cameraStreamRef.current.getTracks().forEach((t) => t.stop()); cameraStreamRef.current = null; }
//     if (briefingVideoRef.current) briefingVideoRef.current.srcObject = null;
//     if (interviewVideoRef.current) interviewVideoRef.current.srcObject = null;
//   }, []);

//   const attachCameraStreamToVisibleVideo = useCallback(async (retryOnNull = true) => {
//     const stream = cameraStreamRef.current; if (!stream) return;
//     const currentScreen = screenRef.current;
//     const targetVideo = currentScreen === "briefing" ? briefingVideoRef.current : interviewVideoRef.current;
//     if (!targetVideo) { if (retryOnNull) setTimeout(() => void attachCameraStreamToVisibleVideo(false), 200); return; }
//     if (targetVideo.srcObject !== stream) targetVideo.srcObject = stream;
//     try { await targetVideo.play(); } catch (e) { console.error("camera_preview_play_failed:", e); }
//   }, []);

//   useEffect(() => { void attachCameraStreamToVisibleVideo(); }, [screen, cameraState, attachCameraStreamToVisibleVideo]);

//   const speak = useCallback((text: string): Promise<void> => {
//     return new Promise((resolve) => {
//       if (typeof window === "undefined" || !window.speechSynthesis) { resolve(); return; }
//       if (hardAbortRef.current) { resolve(); return; }
//       const synth = window.speechSynthesis; synth.cancel();
//       const utterance = new SpeechSynthesisUtterance(text);
//       utterance.rate = 0.8; utterance.pitch = 1.4; utterance.volume = 1; utterance.lang = "en-US";
//       let settled = false;
//       const settle = () => { if (settled) return; settled = true; if (mountedRef.current) setIsSpeaking(false); resolve(); };
//       const pickVoice = () => {
//         const voices = synth.getVoices();
//         const chosen = voices.find((v) => v.name === "Microsoft Jenny Online (Natural) - English (United States)") ||
//           voices.find((v) => v.name === "Microsoft Aria Online (Natural) - English (United States)") ||
//           voices.find((v) => v.name === "Microsoft Zira - English (United States)") ||
//           voices.find((v) => /jenny|aria|zira|samantha/i.test(v.name)) ||
//           voices.find((v) => /google uk english female/i.test(v.name)) ||
//           voices.find((v) => /female|woman/i.test(v.name)) ||
//           voices.find((v) => /^en(-|_)/i.test(v.lang)) || null;
//         if (chosen) utterance.voice = chosen;
//       };
//       if (synth.getVoices().length > 0) pickVoice(); else synth.onvoiceschanged = () => pickVoice();
//       const safetyTimer = window.setTimeout(() => settle(), Math.min(text.length * 85 + 3500, 20000));
//       const finish = () => { window.clearTimeout(safetyTimer); settle(); };
//       utterance.onstart = () => { if (hardAbortRef.current) { synth.cancel(); finish(); return; } if (mountedRef.current) setIsSpeaking(true); };
//       utterance.onend = finish; utterance.onerror = finish;
//       try { synth.speak(utterance); } catch { finish(); }
//     });
//   }, []);

//   useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, transcriptPreview, isLoading]);

//   useEffect(() => {
//     if (screen !== "briefing" || mayaIntroPlayed || !nameLoaded || candidateName === "Candidate") return;
//     const intro = `Hi ${candidateName}! I'm Maya, your AI interviewer from Cuemath. This is a short, voice-first screening interview. Please enable both your microphone and camera before starting — both are required for this interview. I'll guide you through each step.`;
//     const t = setTimeout(() => { hardAbortRef.current = false; void speak(intro); setMayaIntroPlayed(true); }, 800);
//     return () => clearTimeout(t);
//   }, [screen, mayaIntroPlayed, nameLoaded, candidateName, speak]);

//   const requestMicPermission = useCallback(async () => {
//     setMicStateSynced("requesting");
//     try {
//       const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
//       stream.getTracks().forEach((t) => t.stop()); setMicStateSynced("granted");
//     } catch { setMicStateSynced("denied"); setMicVerified(false); }
//   }, [setMicStateSynced]);

//   const requestCameraPermission = useCallback(async () => {
//     if (cameraStreamRef.current) { cameraStreamRef.current.getTracks().forEach((t) => t.stop()); cameraStreamRef.current = null; }
//     setCameraState("requesting");
//     try {
//       const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user", width: { ideal: 640 }, height: { ideal: 360 } }, audio: false });
//       cameraStreamRef.current = stream;
//       const videoTrack = stream.getVideoTracks()[0];
//       if (videoTrack) console.log("camera_track_settings:", videoTrack.getSettings());
//       setCameraState("granted"); setCameraVerified(true);
//       const targetVideo = screenRef.current === "briefing" ? briefingVideoRef.current : interviewVideoRef.current;
//       if (targetVideo) { targetVideo.srcObject = stream; try { await targetVideo.play(); } catch (e) { console.error("camera_preview_initial_play_failed:", e); } }
//     } catch (error) { console.error("camera_permission_failed:", error); setCameraState("denied"); setCameraVerified(false); }
//   }, []);

//   const verifyMicrophoneWithMaya = useCallback(async () => {
//     if (hardAbortRef.current || deviceCheckRunningRef.current) return;
//     if (typeof window === "undefined" || micStateRef.current !== "granted") return;
//     const SpeechAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
//     if (!SpeechAPI) { await speak("Your browser does not support microphone verification. You can still continue."); return; }
//     deviceCheckRunningRef.current = true; setDeviceCheckRunning(true); setDeviceCheckTranscript(""); setMicVerified(false);
//     await speak("Let's quickly test your microphone. Please say: Maya, can you hear me clearly?");
//     if (hardAbortRef.current) { deviceCheckRunningRef.current = false; if (mountedRef.current) setDeviceCheckRunning(false); return; }
//     const rec = new SpeechAPI(); rec.continuous = false; rec.interimResults = true; rec.lang = "en-IN";
//     let transcript = ""; let settled = false;
//     const settle = async (ok: boolean, heardText: string) => {
//       if (settled) return; settled = true;
//       try { rec.stop?.(); } catch {}
//       deviceCheckRunningRef.current = false; if (!mountedRef.current) return;
//       setDeviceCheckRunning(false); setDeviceCheckTranscript(heardText);
//       if (hardAbortRef.current) return;
//       if (ok) { setMicVerified(true); await speak("Yes, I can hear you properly. Your microphone looks good to go."); }
//       else { setMicVerified(false); await speak("I'm not hearing you clearly yet. Please check your microphone and try the test again."); }
//     };
//     const timeout = setTimeout(() => void settle(transcript.trim().length >= 6, transcript.trim()), 6000);
//     rec.onresult = (e: BSREvent) => {
//       let finalText = ""; let interim = "";
//       for (let i = e.resultIndex; i < e.results.length; i++) {
//         if (e.results[i].isFinal) finalText += e.results[i][0].transcript + " ";
//         else interim += e.results[i][0].transcript;
//       }
//       transcript = (finalText || interim).trim(); if (mountedRef.current) setDeviceCheckTranscript(transcript);
//     };
//     rec.onerror = () => { clearTimeout(timeout); void settle(false, transcript.trim()); };
//     rec.onend = () => { clearTimeout(timeout); void settle(transcript.trim().length >= 6, transcript.trim()); };
//     try { rec.start(); } catch {
//       clearTimeout(timeout); deviceCheckRunningRef.current = false;
//       if (mountedRef.current) setDeviceCheckRunning(false);
//       await speak("I couldn't start the microphone test. Please try again.");
//     }
//   }, [speak]);

//   const doSend = useCallback((text: string) => {
//     if (hardAbortRef.current || sendInProgressRef.current) return;
//     if (isLoadingRef.current || interviewDoneRef.current) return;
//     sendInProgressRef.current = true;
//     void sendMessageRef.current(text).finally(() => { sendInProgressRef.current = false; });
//   }, []);

//   const startListening = useCallback(() => {
//     if (hardAbortRef.current) return;
//     if (typeof window === "undefined" || micStateRef.current !== "granted") return;
//     if (isListeningRef.current) { recognitionRef.current?.stop(); isListeningRef.current = false; setIsListening(false); }
//     const SpeechAPI = window.SpeechRecognition || window.webkitSpeechRecognition; if (!SpeechAPI) return;
//     finalTranscriptRef.current = ""; interimTranscriptRef.current = ""; setTranscriptPreview(""); clearListeningTimers(); sendInProgressRef.current = false; utteranceSentRef.current = false;
//     const qAtStart = questionCountRef.current;
//     if (silenceAttemptRef.current[qAtStart] === undefined) silenceAttemptRef.current[qAtStart] = 0;
//     const rec = new SpeechAPI(); rec.continuous = true; rec.interimResults = true; rec.lang = "en-IN";
//     emptyResponseTimerRef.current = setTimeout(() => {
//       if (hardAbortRef.current) return;
//       if (isListeningRef.current) { rec.stop(); isListeningRef.current = false; setIsListening(false); setTranscriptPreview(""); }
//       if (!utteranceSentRef.current && !sendInProgressRef.current && !isLoadingRef.current && !interviewDoneRef.current) {
//         const liveQ = questionCountRef.current; const attempts = silenceAttemptRef.current[liveQ] ?? 0;
//         silenceAttemptRef.current[liveQ] = attempts + 1; utteranceSentRef.current = true; doSend(EMPTY_RESPONSE_TOKEN);
//       }
//     }, EMPTY_RESPONSE_MS);
//     rec.onresult = (e: BSREvent) => {
//       if (hardAbortRef.current) return;
//       let newFinal = ""; let interim = "";
//       for (let i = e.resultIndex; i < e.results.length; i++) {
//         if (e.results[i].isFinal) newFinal += e.results[i][0].transcript + " ";
//         else interim += e.results[i][0].transcript;
//       }
//       if (newFinal.trim()) finalTranscriptRef.current = (finalTranscriptRef.current + " " + newFinal).trim();
//       interimTranscriptRef.current = interim.trim();
//       const raw = (finalTranscriptRef.current + " " + interim).trim();
//       const display = correctASRText(raw);
//       if (display) { setTranscriptPreview(display); if (emptyResponseTimerRef.current) { clearTimeout(emptyResponseTimerRef.current); emptyResponseTimerRef.current = null; } }
//       const liveQ = questionCountRef.current; silenceAttemptRef.current[liveQ] = 0;
//       if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
//       const toSubmit = (finalTranscriptRef.current + " " + interim).trim();
//       if (toSubmit) {
//         silenceTimerRef.current = setTimeout(() => {
//           if (hardAbortRef.current || !isListeningRef.current) return;
//           rec.stop(); isListeningRef.current = false; setIsListening(false);
//           const corrected = correctASRText(toSubmit);
//           if (!utteranceSentRef.current && !sendInProgressRef.current && !isLoadingRef.current && !interviewDoneRef.current) { utteranceSentRef.current = true; doSend(corrected); }
//         }, SILENCE_MS);
//       }
//     };
//     rec.onerror = (e: BSRError) => {
//       isListeningRef.current = false; setIsListening(false); clearListeningTimers(); recognitionRef.current = null;
//       if (e?.error === "aborted") return;
//       if (e?.error === "not-allowed") { setMicStateSynced("denied"); return; }
//       if (hardAbortRef.current || isLoadingRef.current || interviewDoneRef.current) return;
//       const combined = (finalTranscriptRef.current + " " + interimTranscriptRef.current).trim();
//       const partial = correctASRText(combined);
//       if (partial && !utteranceSentRef.current && !sendInProgressRef.current) { utteranceSentRef.current = true; doSend(partial); }
//       else if (!utteranceSentRef.current && !sendInProgressRef.current) {
//         setTimeout(() => {
//           if (hardAbortRef.current || isLoadingRef.current || interviewDoneRef.current || sendInProgressRef.current || utteranceSentRef.current) return;
//           utteranceSentRef.current = true; doSend(EMPTY_RESPONSE_TOKEN);
//         }, 1500);
//       }
//     };
//     rec.onend = () => {
//       isListeningRef.current = false; setIsListening(false); clearListeningTimers(); recognitionRef.current = null;
//       if (hardAbortRef.current || isLoadingRef.current || interviewDoneRef.current) return;
//       const combined = (finalTranscriptRef.current + " " + interimTranscriptRef.current).trim();
//       const partial = correctASRText(combined);
//       if (partial && !utteranceSentRef.current && !sendInProgressRef.current) { utteranceSentRef.current = true; doSend(partial); }
//     };
//     recognitionRef.current = rec; rec.start(); isListeningRef.current = true; setIsListening(true);
//   }, [clearListeningTimers, doSend, setMicStateSynced]);

//   const stopListening = useCallback(() => {
//     clearListeningTimers();
//     if (recognitionRef.current && isListeningRef.current) recognitionRef.current.stop();
//     isListeningRef.current = false; setIsListening(false);
//     if (hardAbortRef.current || isLoadingRef.current || sendInProgressRef.current) return;
//     const combined = (finalTranscriptRef.current + " " + interimTranscriptRef.current).trim();
//     const captured = correctASRText(combined);
//     setTimeout(() => {
//       if (hardAbortRef.current || sendInProgressRef.current || isLoadingRef.current || interviewDoneRef.current || utteranceSentRef.current) return;
//       utteranceSentRef.current = true; doSend(captured || EMPTY_RESPONSE_TOKEN);
//     }, 300);
//   }, [clearListeningTimers, doSend]);

//   const maybeStartListening = useCallback(() => {
//     if (hardAbortRef.current) return;
//     if (supportsSpeechRef.current && micStateRef.current === "granted") setTimeout(() => startListening(), 700);
//   }, [startListening]);

//   // ─── generateReport — receives final messages directly, never uses stale closure ──
//   const generateReport = useCallback(async (finalMessages: Message[]) => {
//     if (hardAbortRef.current) return;

//     // Filter to only valid messages
//     const validMessages = finalMessages.filter(
//       (m) => (m.role === "user" || m.role === "assistant") && typeof m.content === "string" && m.content.trim().length > 0
//     );

//     const transcript = validMessages
//       .map((m) => `${m.role === "user" ? "Candidate" : "Maya"}: ${m.content}`)
//       .join("\n\n");

//     // Save to localStorage immediately
//     try {
//       localStorage.setItem("interview_transcript", transcript);
//       localStorage.setItem("interview_messages", JSON.stringify(validMessages));
//       localStorage.setItem("assessment_saved_at", Date.now().toString());
//     } catch (e) { console.error("localStorage_save_failed:", e); }

//     const tryAssess = async () => {
//       if (hardAbortRef.current) return;
//       const payload = { transcript, candidateName };
//       console.log("assess_request: chars=" + transcript.length + " msgs=" + validMessages.length);

//       const res = await fetch("/api/assess", {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify(payload),
//       });

//       if (!res.ok) {
//         const errText = await res.text();
//         throw new Error(`assess_${res.status}: ${errText.slice(0, 200)}`);
//       }

//       const raw = await res.text();
//       if (!raw || !raw.trim()) throw new Error("Empty response from /api/assess");

//       let data: unknown;
//       try { data = JSON.parse(raw); } catch { throw new Error(`assess_bad_json: ${raw.slice(0, 120)}`); }

//       // Save assessment result and navigate
//       try { localStorage.setItem("assessment_result", JSON.stringify(data)); } catch { /* non-critical */ }

//       if (!hardAbortRef.current) {
//         console.log("✅ Assessment saved, navigating to /report");
//         router.push("/report");
//       }
//     };

//     try {
//       await tryAssess();
//     } catch (err) {
//       console.error("assess_first_attempt_failed:", err);
//       if (hardAbortRef.current) return;
//       setReportError("Generating your report… please wait.");
//       setTimeout(async () => {
//         try {
//           if (!hardAbortRef.current) await tryAssess();
//         } catch (err2) {
//           console.error("assess_second_attempt_failed:", err2);
//           if (!hardAbortRef.current) {
//             // Last resort: save empty assessment and navigate anyway
//             const fallback = {
//               candidateName,
//               overallScore: 5.5,
//               overallLabel: "Adequate",
//               summary: `${candidateName} completed the interview. Assessment service was temporarily unavailable.`,
//               recommendation: "Consider",
//               dimensions: {
//                 communication: { score: 5.5, label: "Adequate", feedback: "Manual review required.", highlights: [] },
//                 warmth: { score: 5.5, label: "Adequate", feedback: "Manual review required.", highlights: [] },
//                 patience: { score: 5.5, label: "Adequate", feedback: "Manual review required.", highlights: [] },
//                 simplification: { score: 5.5, label: "Adequate", feedback: "Manual review required.", highlights: [] },
//                 fluency: { score: 5.5, label: "Adequate", feedback: "Manual review required.", highlights: [] },
//               },
//               strengths: ["Completed the full interview"],
//               improvements: ["Manual review required — AI assessment unavailable"],
//               generatedAt: new Date().toISOString(),
//               _fallback: true,
//             };
//             try { localStorage.setItem("assessment_result", JSON.stringify(fallback)); } catch { /* ignore */ }
//             router.push("/report");
//           }
//         }
//       }, 4000);
//     }
//   }, [candidateName, router]);

//   const stopPresenceDetection = useCallback(() => {
//     if (faceCheckIntervalRef.current) { clearInterval(faceCheckIntervalRef.current); faceCheckIntervalRef.current = null; }
//     if (faceAbsenceTimerRef.current) { clearTimeout(faceAbsenceTimerRef.current); faceAbsenceTimerRef.current = null; }
//     if (visibilityHandlerRef.current) { document.removeEventListener("visibilitychange", visibilityHandlerRef.current); visibilityHandlerRef.current = null; }
//     faceAbsenceStartRef.current = null; consecutiveAbsentCountRef.current = 0; unknownPresenceCountRef.current = 0; setFaceAbsenceCountdown(null);
//   }, []);

//   // ─── Core sendMessage — FIXED: passes `final` array directly to generateReport ──
//   const sendMessage = useCallback(async (text: string) => {
//     if (hardAbortRef.current) return;
//     const trimmed = text.trim();
//     const isToken = text === EMPTY_RESPONSE_TOKEN;
//     const normalizedInput = isToken ? "no response" : trimmed;
//     if ((!trimmed && !isToken) || isLoadingRef.current || interviewDoneRef.current) return;

//     clearListeningTimers();
//     const userMsg: Message = { role: "user", content: isToken ? "(No verbal response given)" : trimmed };

//     // Use functional setState to always have fresh messages — avoid stale closure
//     let updatedMessages: Message[] = [];
//     setMessages((prev) => {
//       // Filter invalid entries defensively
//       const valid = prev.filter(
//         (m) => (m.role === "user" || m.role === "assistant") && typeof m.content === "string" && m.content.trim().length > 0
//       );
//       updatedMessages = [...valid, userMsg];
//       return updatedMessages;
//     });

//     // Wait one tick for state to settle
//     await new Promise<void>((resolve) => setTimeout(resolve, 0));

//     setTranscriptPreview(""); finalTranscriptRef.current = ""; interimTranscriptRef.current = "";
//     setLoading(true);

//     const currentCount = questionCountRef.current;
//     const currentRetryCount = retryCountRef.current[currentCount] ?? 0;

//     try {
//       if (hardAbortRef.current) { setLoading(false); return; }

//       // Snapshot messages at this point — use updatedMessages captured above
//       const messagesSnapshot = updatedMessages;
//       const payload = {
//         messages: messagesSnapshot.map((m) => ({ role: m.role, content: m.content })),
//         candidateName,
//         questionCount: currentCount,
//         retryCount: currentRetryCount,
//       };

//       console.log("chat_request: msgs=" + payload.messages.length + " q=" + currentCount);

//       const res = await fetch("/api/chat", {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify(payload),
//       });

//       if (hardAbortRef.current) { setLoading(false); return; }

//       if (!res.ok) {
//         const errText = await res.text();
//         console.error("chat_api_error:", res.status, errText.slice(0, 200));
//         throw new Error(`chat_${res.status}`);
//       }

//       const rawText = await res.text();
//       if (!rawText || !rawText.trim()) throw new Error("Empty chat response");

//       let data: Record<string, unknown>;
//       try { data = JSON.parse(rawText) as Record<string, unknown>; } catch { throw new Error("chat_bad_json"); }

//       if (hardAbortRef.current) { setLoading(false); return; }
//       if (data?.code === "QUOTA_EXCEEDED" || data?.source === "fallback") throw new Error("quota_fallback");
//       if (!data?.text) throw new Error((data?.error as string) || "unavailable");

//       const aiMsg: Message = { role: "assistant", content: data.text as string };
//       const nextCount = data.isFollowUp ? currentCount : currentCount + 1;

//       // Build final array from snapshot + AI response
//       const finalMessages = [...messagesSnapshot, aiMsg];

//       if (data.isFollowUp) {
//         retryCountRef.current = { ...retryCountRef.current, [currentCount]: currentRetryCount + 1 };
//       } else {
//         retryCountRef.current = { ...retryCountRef.current, [currentCount]: 0, [nextCount]: 0 };
//         silenceAttemptRef.current[nextCount] = 0;
//       }

//       setMessages(finalMessages);
//       setQCount(nextCount);

//       if (hardAbortRef.current) { setLoading(false); return; }
//       await speak(data.text as string);
//       if (hardAbortRef.current) { setLoading(false); return; }

//       if (data.isComplete || nextCount >= 7) {
//         setDone(true);
//         // Pass finalMessages directly — no stale closure!
//         setTimeout(() => void generateReport(finalMessages), 1200);
//       } else {
//         maybeStartListening();
//       }
//     } catch (err) {
//       if (hardAbortRef.current) { setLoading(false); return; }
//       const msg = err instanceof Error ? err.message : String(err);
//       if (!msg.includes("quota") && msg !== "quota_fallback") console.error("sendMessage_error:", err);

//       const { reply: fb, shouldAdvance } = buildFallbackReply(currentCount, candidateName, normalizedInput, currentRetryCount);
//       const nextCount = shouldAdvance ? currentCount + 1 : currentCount;

//       if (shouldAdvance) {
//         retryCountRef.current = { ...retryCountRef.current, [currentCount]: 0, [nextCount]: 0 };
//         silenceAttemptRef.current[nextCount] = 0;
//       } else {
//         retryCountRef.current = { ...retryCountRef.current, [currentCount]: currentRetryCount + 1 };
//       }

//       const aiMsg: Message = { role: "assistant", content: fb };
//       const finalMessages = [...updatedMessages, aiMsg];
//       setMessages(finalMessages);
//       setQCount(nextCount);
//       setUsingFallback(true);

//       if (hardAbortRef.current) { setLoading(false); return; }
//       await speak(fb);
//       if (hardAbortRef.current) { setLoading(false); return; }

//       if (nextCount >= 7) {
//         setDone(true);
//         setTimeout(() => void generateReport(finalMessages), 1200);
//       } else {
//         maybeStartListening();
//       }
//     } finally {
//       setLoading(false);
//     }
//   }, [candidateName, clearListeningTimers, generateReport, maybeStartListening, setDone, setLoading, setQCount, speak]);

//   useEffect(() => { sendMessageRef.current = sendMessage; }, [sendMessage]);

//   const checkPresence = useCallback(async (): Promise<PresenceState> => {
//     const video = interviewVideoRef.current; if (!video) return "unknown";
//     if (video.readyState < 2 || video.videoWidth === 0 || video.videoHeight === 0) return "unknown";
//     if (presenceCheckBusyRef.current) return "unknown";
//     presenceCheckBusyRef.current = true;
//     try {
//       const vw = video.videoWidth; const vh = video.videoHeight;
//       if (nativeFaceDetectorRef.current) {
//         try {
//           const faces = await nativeFaceDetectorRef.current.detect(video);
//           if (faces.length === 0) return "absent";
//           const validFace = faces.some((face) => {
//             const box = face.boundingBox; const cx = box.x + box.width / 2; const cy = box.y + box.height / 2;
//             const insideCentralRegion = cx > vw * 0.12 && cx < vw * 0.88 && cy > vh * 0.08 && cy < vh * 0.92;
//             const bigEnough = box.width >= vw * MIN_FACE_WIDTH_RATIO && box.height >= vh * MIN_FACE_HEIGHT_RATIO;
//             return insideCentralRegion && bigEnough;
//           });
//           return validFace ? "present" : "absent";
//         } catch (err) { console.error("face_detector_detect_failed:", err); }
//       }
//       const canvas = faceCanvasRef.current; if (!canvas) return "unknown";
//       const ctx = canvas.getContext("2d", { willReadFrequently: true }); if (!ctx) return "unknown";
//       canvas.width = FALLBACK_SAMPLE_W; canvas.height = FALLBACK_SAMPLE_H;
//       ctx.drawImage(video, 0, 0, FALLBACK_SAMPLE_W, FALLBACK_SAMPLE_H);
//       const imageData = ctx.getImageData(0, 0, FALLBACK_SAMPLE_W, FALLBACK_SAMPLE_H); const data = imageData.data;
//       const gray = new Uint8ClampedArray(FALLBACK_SAMPLE_W * FALLBACK_SAMPLE_H);
//       let fullSkin = 0; let centerSkin = 0; let centerPixels = 0;
//       const cx1 = Math.floor(FALLBACK_SAMPLE_W * 0.25); const cx2 = Math.floor(FALLBACK_SAMPLE_W * 0.75);
//       const cy1 = Math.floor(FALLBACK_SAMPLE_H * 0.12); const cy2 = Math.floor(FALLBACK_SAMPLE_H * 0.78);
//       for (let y = 0; y < FALLBACK_SAMPLE_H; y++) for (let x = 0; x < FALLBACK_SAMPLE_W; x++) {
//         const i = y * FALLBACK_SAMPLE_W + x; const di = i * 4;
//         const r = data[di]; const g = data[di + 1]; const b = data[di + 2];
//         gray[i] = Math.round(0.299 * r + 0.587 * g + 0.114 * b);
//         const skin = isSkinPixel(r, g, b); if (skin) fullSkin++;
//         const inCenter = x >= cx1 && x <= cx2 && y >= cy1 && y <= cy2;
//         if (inCenter) { centerPixels++; if (skin) centerSkin++; }
//       }
//       const fullSkinRatio = fullSkin / (FALLBACK_SAMPLE_W * FALLBACK_SAMPLE_H);
//       const centerSkinRatio = centerPixels > 0 ? centerSkin / centerPixels : 0;
//       const edgeRatio = sobelLikeEdgeScore(gray, FALLBACK_SAMPLE_W, FALLBACK_SAMPLE_H);
//       if (edgeRatio > TEXTURE_COMPLEXITY_MAX) return "absent";
//       const looksHumanish = centerSkinRatio >= CENTER_SKIN_RATIO_MIN && fullSkinRatio >= FULL_SKIN_RATIO_MIN && edgeRatio >= EDGE_RATIO_MIN && edgeRatio <= EDGE_RATIO_MAX;
//       return looksHumanish ? "present" : "absent";
//     } catch (err) { console.error("presence_check_failed:", err); return "unknown"; }
//     finally { presenceCheckBusyRef.current = false; }
//   }, []);

//   const stopEverythingNow = useCallback(() => {
//     hardAbortRef.current = true; stopPresenceDetection(); clearListeningTimers();
//     try { recognitionRef.current?.stop(); } catch {}
//     recognitionRef.current = null; isListeningRef.current = false; sendInProgressRef.current = false;
//     if (typeof window !== "undefined" && window.speechSynthesis) window.speechSynthesis.cancel();
//     stopCameraPreview(); setIsListening(false); setIsSpeaking(false); setIsLoading(false);
//   }, [clearListeningTimers, stopCameraPreview, stopPresenceDetection]);

//   const terminateInterview = useCallback((reason: string) => {
//     if (faceTerminatedRef.current) return; faceTerminatedRef.current = true;
//     stopEverythingNow(); setTerminated(true); setTerminationReason(reason);
//   }, [stopEverythingNow]);

//   const startPresenceDetection = useCallback(() => {
//     if (faceCheckIntervalRef.current) return;
//     faceAbsenceStartRef.current = null; faceTerminatedRef.current = false;
//     consecutiveAbsentCountRef.current = 0; unknownPresenceCountRef.current = 0;
//     let warmupCount = 0;
//     const handleVisibilityChange = () => {
//       if (document.hidden) { faceAbsenceStartRef.current = null; consecutiveAbsentCountRef.current = 0; unknownPresenceCountRef.current = 0; if (mountedRef.current) setFaceAbsenceCountdown(null); }
//     };
//     visibilityHandlerRef.current = handleVisibilityChange;
//     document.addEventListener("visibilitychange", handleVisibilityChange);
//     faceCheckIntervalRef.current = setInterval(() => {
//       if (faceTerminatedRef.current || interviewDoneRef.current || hardAbortRef.current) {
//         if (faceCheckIntervalRef.current) { clearInterval(faceCheckIntervalRef.current); faceCheckIntervalRef.current = null; }
//         if (visibilityHandlerRef.current) { document.removeEventListener("visibilitychange", visibilityHandlerRef.current); visibilityHandlerRef.current = null; }
//         return;
//       }
//       if (document.hidden) return;
//       if (warmupCount < PRESENCE_WARMUP_FRAMES) { warmupCount++; return; }
//       void (async () => {
//         const state = await checkPresence();
//         if (state === "present") { faceAbsenceStartRef.current = null; consecutiveAbsentCountRef.current = 0; unknownPresenceCountRef.current = 0; if (mountedRef.current) setFaceAbsenceCountdown(null); return; }
//         if (state === "unknown") {
//           unknownPresenceCountRef.current += 1;
//           if (unknownPresenceCountRef.current < UNKNOWN_STREAK_BEFORE_SOFT_ABSENT) {
//             if (faceAbsenceStartRef.current !== null && mountedRef.current) {
//               const absenceMs = Date.now() - faceAbsenceStartRef.current;
//               const remainingSecs = Math.max(0, Math.ceil((FACE_ABSENCE_TERMINATE_MS - absenceMs) / 1000));
//               setFaceAbsenceCountdown(remainingSecs);
//               if (absenceMs >= FACE_ABSENCE_TERMINATE_MS) { terminateInterview("You were not visible in the camera frame for more than 9 seconds. The interview has been terminated as per our proctoring policy."); if (mountedRef.current) setFaceAbsenceCountdown(null); }
//             }
//             return;
//           }
//           consecutiveAbsentCountRef.current += 1;
//         } else { unknownPresenceCountRef.current = 0; consecutiveAbsentCountRef.current += 1; }
//         if (consecutiveAbsentCountRef.current < CONSECUTIVE_ABSENT_THRESHOLD) return;
//         if (faceAbsenceStartRef.current === null) { faceAbsenceStartRef.current = Date.now(); }
//         const absenceMs = Date.now() - faceAbsenceStartRef.current;
//         const remainingSecs = Math.max(0, Math.ceil((FACE_ABSENCE_TERMINATE_MS - absenceMs) / 1000));
//         if (mountedRef.current) setFaceAbsenceCountdown(remainingSecs);
//         if (absenceMs >= FACE_ABSENCE_TERMINATE_MS) { terminateInterview("You were not visible in the camera frame for more than 9 seconds. The interview has been terminated as per our proctoring policy."); if (mountedRef.current) setFaceAbsenceCountdown(null); }
//       })();
//     }, FACE_CHECK_INTERVAL_MS);
//   }, [checkPresence, terminateInterview]);

//   useEffect(() => {
//     return () => {
//       hardAbortRef.current = true; stopPresenceDetection(); clearListeningTimers();
//       try { recognitionRef.current?.stop(); } catch {}
//       recognitionRef.current = null;
//       if (typeof window !== "undefined" && window.speechSynthesis) window.speechSynthesis.cancel();
//       stopCameraPreview();
//     };
//   }, [clearListeningTimers, stopCameraPreview, stopPresenceDetection]);

//   const canBeginInterview = micState === "granted" && cameraState === "granted";

//   const beginInterview = useCallback(async () => {
//     if (!canBeginInterview) { setShowMandatoryWarning(true); await speak("Please enable both your microphone and camera before starting the interview. Both are required."); return; }
//     if (isBeginning) return;
//     setIsBeginning(true); setShowMandatoryWarning(false); window.speechSynthesis?.cancel(); clearListeningTimers();
//     hardAbortRef.current = false; faceTerminatedRef.current = false; setTerminated(false); setTerminationReason(""); setFaceAbsenceCountdown(null);
//     consecutiveAbsentCountRef.current = 0; unknownPresenceCountRef.current = 0;
//     retryCountRef.current = Object.create(null) as Record<number, number>;
//     silenceAttemptRef.current = Object.create(null) as Record<number, number>;
//     sendInProgressRef.current = false; utteranceSentRef.current = false; setUsingFallback(false);
//     setMessages([]); setTranscriptPreview(""); setQuestionCount(1); questionCountRef.current = 1; setDone(false);
//     if (supportsSpeechRef.current && micStateRef.current === "idle") {
//       setMicStateSynced("requesting");
//       try { const stream = await navigator.mediaDevices.getUserMedia({ audio: true }); stream.getTracks().forEach((t) => t.stop()); setMicStateSynced("granted"); }
//       catch { setMicStateSynced("denied"); }
//     }
//     setScreen("interview");
//     setTimeout(() => { if (!hardAbortRef.current) { startPresenceDetection(); void attachCameraStreamToVisibleVideo(true); } }, 250);
//     setLoading(true);
//     try {
//       const initial: Message[] = [{ role: "user", content: `Hi, my name is ${candidateName}.` }];
//       setMessages(initial);

//       const payload = {
//         messages: initial.map((m) => ({ role: m.role, content: m.content })),
//         candidateName,
//         questionCount: 1,
//         retryCount: 0,
//         beginInterview: true,
//       };

//       const res = await fetch("/api/chat", {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify(payload),
//       });

//       if (!res.ok) throw new Error(`begin_interview_${res.status}`);

//       const rawText = await res.text();
//       let data: Record<string, unknown> = {};
//       try { if (rawText) data = JSON.parse(rawText) as Record<string, unknown>; } catch { /* use fallback */ }

//       const text = (data?.text as string) || QUESTION_BANK[0];
//       const aiMsg: Message = { role: "assistant", content: text };
//       const final = [...initial, aiMsg];
//       setMessages(final); setQCount(2);
//       if (hardAbortRef.current) return;
//       await speak(text);
//       if (!hardAbortRef.current) maybeStartListening();
//     } catch (err) {
//       console.error("beginInterview_error:", err);
//       if (hardAbortRef.current) return;
//       const fallback = QUESTION_BANK[0];
//       const initial: Message[] = [{ role: "user", content: `Hi, my name is ${candidateName}.` }];
//       const aiMsg: Message = { role: "assistant", content: fallback };
//       const final = [...initial, aiMsg];
//       setMessages(final); setQCount(2);
//       await speak(fallback);
//       if (!hardAbortRef.current) maybeStartListening();
//     } finally { setLoading(false); setIsBeginning(false); }
//   }, [attachCameraStreamToVisibleVideo, canBeginInterview, candidateName, clearListeningTimers, isBeginning, maybeStartListening, setDone, setLoading, setMicStateSynced, setQCount, speak, startPresenceDetection]);

//   const handleReturnHome = useCallback(() => { stopEverythingNow(); router.push("/"); }, [router, stopEverythingNow]);

//   // ─── CSS ─────────────────────────────────────────────────────────────────────
//   const css = `
//     .ip-shell { min-height: 100vh; background: linear-gradient(160deg, ${T.pageBg} 0%, ${T.pageBg2} 100%); color: ${T.text}; font-family: "DM Sans", system-ui, sans-serif; }
//     .ip-grid::before { content:""; position:absolute; inset:0; pointer-events:none; z-index:0; background-image: linear-gradient(${T.gridLine} 1px, transparent 1px), linear-gradient(90deg, ${T.gridLine} 1px, transparent 1px); background-size: 48px 48px; }
//     .ip-topbar { position:sticky; top:0; z-index:100; height:62px; display:flex; align-items:center; border-bottom:1px solid ${T.border}; background:${T.topbar}; backdrop-filter:blur(20px); -webkit-backdrop-filter:blur(20px); }
//     .ip-container { max-width:1360px; margin:0 auto; padding:0 28px; width:100%; }
//     .ip-topbar-inner { display:flex; align-items:center; justify-content:space-between; width:100%; }
//     .ip-brand { display:flex; align-items:center; gap:10px; }
//     .ip-brandmark { width:34px; height:34px; border-radius:10px; background:linear-gradient(135deg,${T.accent},${T.accentAlt}); display:grid; place-items:center; color:#fff; }
//     .ip-brand-name { font-size:15px; font-weight:700; letter-spacing:-0.02em; color:${T.text}; }
//     .ip-brand-sub { font-size:10px; text-transform:uppercase; letter-spacing:0.10em; color:${T.textMuted}; margin-top:1px; }
//     .ip-theme-btn { width:36px; height:36px; border-radius:10px; border:1px solid ${T.border}; background:transparent; color:${T.textSoft}; display:grid; place-items:center; cursor:pointer; transition:border-color 0.15s,background 0.15s; }
//     .ip-theme-btn:hover { border-color:${T.borderStrong}; background:${T.surfaceElevated}; }
//     .ip-maya-pulse { animation: ip-pulse 2s infinite; }
//     .ip-card { border:1px solid ${T.border}; border-radius:20px; background:${T.surface}; box-shadow:${T.shadow}; }
//     .ip-panel { border:1px solid ${T.border}; border-radius:16px; background:${T.surfaceElevated}; }
//     .ip-inset { border:1px solid ${T.border}; border-radius:14px; background:${T.inset}; }
//     .ip-btn-primary { display:inline-flex; align-items:center; justify-content:center; gap:8px; border:0; border-radius:12px; padding:0 18px; height:42px; font-size:13.5px; font-weight:700; font-family:inherit; color:#fff; cursor:pointer; background:linear-gradient(135deg,${T.accent} 0%,${T.accentAlt} 100%); box-shadow:0 10px 28px ${T.accentRing}; transition:transform 0.15s,box-shadow 0.15s,opacity 0.15s; }
//     .ip-btn-primary:hover:not(:disabled) { transform:translateY(-1px); box-shadow:0 16px 36px ${T.accentRing}; }
//     .ip-btn-primary:disabled { opacity:0.45; cursor:not-allowed; }
//     .ip-btn-secondary { display:inline-flex; align-items:center; justify-content:center; gap:7px; border:1px solid ${T.border}; border-radius:12px; padding:0 16px; height:40px; font-size:13px; font-weight:600; font-family:inherit; color:${T.textSoft}; cursor:pointer; background:transparent; transition:border-color 0.15s,color 0.15s,background 0.15s; }
//     .ip-btn-secondary:hover { border-color:${T.borderStrong}; color:${T.text}; background:${T.surfaceElevated}; }
//     .ip-btn-danger { display:inline-flex; align-items:center; gap:7px; border:0; border-radius:12px; padding:0 16px; height:40px; font-size:13px; font-weight:600; font-family:inherit; color:#fff; cursor:pointer; background:linear-gradient(135deg,#EF4444,#DC2626); }
//     .ip-btn-full { width:100%; }
//     .ip-bubble-ai { border:1px solid ${T.bubbleAIBorder}; border-radius:18px 18px 18px 4px; padding:14px 18px; background:${T.bubbleAI}; box-shadow:${T.shadowMd}; }
//     .ip-bubble-user { border-radius:18px 18px 4px 18px; padding:14px 18px; background:${T.bubbleUser}; color:#fff; }
//     .ip-bubble-label { font-size:11px; font-weight:700; opacity:0.65; margin-bottom:6px; letter-spacing:0.02em; }
//     .ip-bubble-text { font-size:14.5px; line-height:1.65; }
//     .ip-step-active { border:1px solid ${T.accentRing}; background:${T.accentGlow}; border-radius:16px; padding:14px 16px; display:flex; align-items:flex-start; gap:14px; text-align:left; cursor:pointer; transition:border-color 0.15s,background 0.15s; width:100%; }
//     .ip-step-inactive { border:1px solid ${T.border}; background:transparent; border-radius:16px; padding:14px 16px; display:flex; align-items:flex-start; gap:14px; text-align:left; cursor:pointer; opacity:0.55; transition:opacity 0.15s,border-color 0.15s; width:100%; }
//     .ip-step-inactive:hover { opacity:0.75; border-color:${T.borderStrong}; }
//     .ip-step-icon-active { width:40px; height:40px; min-width:40px; border-radius:12px; background:${T.accentGlow}; border:1px solid ${T.accentRing}; display:grid; place-items:center; }
//     .ip-step-icon-inactive { width:40px; height:40px; min-width:40px; border-radius:12px; background:${T.surfaceElevated}; border:1px solid ${T.border}; display:grid; place-items:center; }
//     .ip-progress-bg { height:4px; border-radius:999px; background:${T.border}; overflow:hidden; }
//     .ip-progress-fill { height:100%; border-radius:999px; background:linear-gradient(90deg,${T.accent},${T.accentAlt}); transition:width 0.5s ease; }
//     .ip-device-btn { width:100%; border:1px solid ${T.border}; border-radius:12px; background:transparent; color:${T.textSoft}; font-size:13px; font-weight:600; font-family:inherit; padding:11px 16px; cursor:pointer; text-align:left; transition:border-color 0.15s,color 0.15s,background 0.15s; }
//     .ip-device-btn:hover { border-color:${T.borderStrong}; color:${T.text}; background:${T.surfaceElevated}; }
//     .ip-device-btn:disabled { opacity:0.5; cursor:not-allowed; }
//     @keyframes ip-pulse { 0%,100%{box-shadow:0 0 0 0 ${T.accentGlow}} 50%{box-shadow:0 0 0 6px transparent} }
//     @keyframes ip-spin { to{transform:rotate(360deg)} }
//     .ip-spin { animation:ip-spin 0.8s linear infinite; }
//     .ip-chip-ok { display:inline-flex; align-items:center; gap:5px; padding:4px 10px; border-radius:999px; border:1px solid ${T.successBorder}; background:${T.successBg}; color:${T.success}; font-size:11px; font-weight:600; }
//     .ip-chip-neutral { display:inline-flex; align-items:center; gap:5px; padding:4px 10px; border-radius:999px; border:1px solid ${T.border}; background:transparent; color:${T.textMuted}; font-size:11px; font-weight:600; }
//     .ip-chip-accent { display:inline-flex; align-items:center; gap:5px; padding:4px 10px; border-radius:999px; border:1px solid ${T.accentRing}; background:${T.accentGlow}; color:${T.accentText}; font-size:11px; font-weight:600; }
//     .ip-warn-box { border:1px solid ${T.warningBorder}; background:${T.warningBg}; border-radius:12px; padding:10px 14px; font-size:12px; color:${T.warning}; }
//     .ip-danger-box { border:1px solid ${T.dangerBorder}; background:${T.dangerBg}; border-radius:12px; padding:10px 14px; font-size:12px; color:${T.danger}; }
//   `;

//   // ─── Terminated screen ────────────────────────────────────────────────────────
//   if (terminated) {
//     return (
//       <>
//         <style dangerouslySetInnerHTML={{ __html: FONTS + css }} />
//         <div className="ip-shell" style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "40px 20px", position: "relative" }}>
//           <div className="ip-grid" style={{ position: "absolute", inset: 0 }} />
//           <div className="ip-card" style={{ width: "100%", maxWidth: 560, padding: "40px", position: "relative", zIndex: 1 }}>
//             <div style={{ width: 72, height: 72, borderRadius: "50%", background: T.dangerBg, border: `1px solid ${T.dangerBorder}`, display: "grid", placeItems: "center", margin: "0 auto 24px" }}>
//               <UserX size={32} color={T.danger} />
//             </div>
//             <h1 style={{ margin: "0 0 12px", fontSize: 24, fontWeight: 700, letterSpacing: "-0.03em", textAlign: "center" }}>Interview terminated</h1>
//             <p style={{ margin: "0 0 24px", fontSize: 14, lineHeight: 1.7, color: T.textSoft, textAlign: "center" }}>{terminationReason}</p>
//             <div className="ip-warn-box" style={{ marginBottom: 24, display: "flex", alignItems: "flex-start", gap: 10 }}>
//               <AlertTriangle size={15} color={T.warning} style={{ flexShrink: 0, marginTop: 1 }} />
//               <span>Please ensure you remain visible in the camera throughout the interview.</span>
//             </div>
//             <button onClick={handleReturnHome} className="ip-btn-primary ip-btn-full" style={{ height: 48, fontSize: 15 }}>
//               Return to Home <ChevronRight size={16} />
//             </button>
//           </div>
//         </div>
//       </>
//     );
//   }

//   // ─── Briefing screen ──────────────────────────────────────────────────────────
//   if (screen === "briefing") {
//     return (
//       <>
//         <style dangerouslySetInnerHTML={{ __html: FONTS + css }} />
//         <canvas ref={faceCanvasRef} style={{ display: "none" }} aria-hidden="true" />
//         <div className="ip-shell" style={{ display: "flex", flexDirection: "column", minHeight: "100vh", position: "relative" }}>
//           <div className="ip-grid" style={{ position: "absolute", inset: 0 }} />
//           <header className="ip-topbar" style={{ position: "sticky", zIndex: 100 }}>
//             <div className="ip-container ip-topbar-inner">
//               <div className="ip-brand">
//                 <div className="ip-brandmark"><BrainCircuit size={16} /></div>
//                 <div>
//                   <div className="ip-brand-name">Cuemath</div>
//                   <div className="ip-brand-sub">Tutor Screening</div>
//                 </div>
//               </div>
//               <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
//                 <div style={{ textAlign: "right" }}>
//                   <div style={{ fontSize: 13, fontWeight: 600, color: T.text }}>{candidateName}</div>
//                   {candidateEmail && <div style={{ fontSize: 11, color: T.textMuted }}>{candidateEmail}</div>}
//                 </div>
//                 <button className="ip-theme-btn" onClick={toggleTheme} aria-label="Toggle theme">
//                   {theme === "dark" ? <Sun size={15} /> : <Moon size={15} />}
//                 </button>
//               </div>
//             </div>
//           </header>

//           <main className="ip-container" style={{ position: "relative", zIndex: 1, flex: 1, display: "grid", gridTemplateColumns: "400px 1fr", gap: 24, padding: "28px 28px", alignItems: "start" }}>
//             <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
//               <div className="ip-card" style={{ padding: 20 }}>
//                 <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
//                   <div style={{ width: 48, height: 48, borderRadius: 14, background: `linear-gradient(135deg,${T.accent},${T.accentAlt})`, display: "grid", placeItems: "center", color: "#fff", fontSize: 18, fontWeight: 800, boxShadow: `0 8px 20px ${T.accentRing}` }} className={isSpeaking ? "ip-maya-pulse" : ""}>M</div>
//                   <div>
//                     <div style={{ fontSize: 15, fontWeight: 700, letterSpacing: "-0.025em", color: T.text }}>Maya</div>
//                     <div style={{ fontSize: 11, color: T.textMuted, marginTop: 2 }}>AI Interviewer · Cuemath</div>
//                   </div>
//                   <div style={{ marginLeft: "auto" }} className="ip-chip-ok">
//                     <span style={{ width: 6, height: 6, borderRadius: "50%", background: T.success }} /> Ready
//                   </div>
//                 </div>
//                 <div style={{ borderRadius: 12, overflow: "hidden", border: `1px solid ${T.border}`, aspectRatio: "16/9", background: T.inset, position: "relative" }}>
//                   {cameraState === "granted" ? (
//                     <video ref={briefingVideoRef} autoPlay muted playsInline style={{ width: "100%", height: "100%", objectFit: "cover" }} />
//                   ) : (
//                     <div style={{ height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 10 }}>
//                       <Camera size={28} color={T.accentText} />
//                       <span style={{ fontSize: 12, color: T.textMuted }}>Camera preview will appear here</span>
//                     </div>
//                   )}
//                 </div>
//               </div>

//               <div className="ip-card" style={{ padding: 20 }}>
//                 <div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.10em", color: T.textMuted, marginBottom: 14 }}>Device Setup</div>
//                 <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 14 }}>
//                   <button className="ip-device-btn" onClick={requestMicPermission}>
//                     <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
//                       <span style={{ display: "flex", alignItems: "center", gap: 8 }}><Mic size={14} color={T.accentText} />{micState === "granted" ? "Microphone enabled ✓" : "Enable microphone"}</span>
//                       {micState === "granted" && <span style={{ fontSize: 10, color: T.success }}>✓</span>}
//                     </div>
//                   </button>
//                   <button className="ip-device-btn" onClick={requestCameraPermission}>
//                     <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
//                       <span style={{ display: "flex", alignItems: "center", gap: 8 }}><Camera size={14} color={T.accentText} />{cameraState === "granted" ? "Camera enabled ✓" : "Enable camera"}</span>
//                       {cameraState === "granted" && <span style={{ fontSize: 10, color: T.success }}>✓</span>}
//                     </div>
//                   </button>
//                   <button className="ip-device-btn" onClick={verifyMicrophoneWithMaya} disabled={micState !== "granted" || deviceCheckRunning}>
//                     <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
//                       {deviceCheckRunning ? <Loader2 size={14} className="ip-spin" /> : <Volume2 size={14} color={T.accentText} />}
//                       {deviceCheckRunning ? "Testing microphone…" : "Test microphone with Maya"}
//                     </span>
//                   </button>
//                 </div>
//                 <div style={{ display: "flex", flexWrap: "wrap", gap: 7, marginBottom: 14 }}>
//                   <StatusPill T={T} ok={micState === "granted"} icon={<Mic size={12} />} label={micState === "granted" ? "Mic on" : "Mic off"} />
//                   <StatusPill T={T} ok={cameraState === "granted"} icon={<Camera size={12} />} label={cameraState === "granted" ? "Camera on" : "Camera off"} />
//                   <StatusPill T={T} ok={supportsSpeech} icon={<Volume2 size={12} />} label={supportsSpeech ? "Voice support" : "No voice support"} />
//                 </div>
//                 {deviceCheckTranscript && (
//                   <div className="ip-inset" style={{ padding: "10px 12px", marginBottom: 12, fontSize: 12, color: T.textSoft }}>
//                     Heard: <em>{deviceCheckTranscript}</em>
//                   </div>
//                 )}
//                 {showMandatoryWarning && (
//                   <div className="ip-danger-box" style={{ marginBottom: 12 }}>Please enable both microphone and camera before starting.</div>
//                 )}
//                 <button className="ip-btn-primary ip-btn-full" onClick={beginInterview} disabled={!canBeginInterview || isBeginning} style={{ height: 46, fontSize: 14 }}>
//                   {isBeginning ? <><Loader2 size={15} className="ip-spin" />Starting…</> : <>Begin Interview <ChevronRight size={15} /></>}
//                 </button>
//               </div>
//             </div>

//             <div className="ip-card" style={{ padding: 28 }}>
//               <div style={{ marginBottom: 24 }}>
//                 <div style={{ fontSize: 10, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.14em", color: T.accentText, marginBottom: 10 }}>Interview Briefing</div>
//                 <h2 style={{ margin: "0 0 10px", fontSize: 26, fontWeight: 700, letterSpacing: "-0.035em", lineHeight: 1.2 }}>Quick overview before we start</h2>
//                 <p style={{ margin: 0, fontSize: 14, lineHeight: 1.7, color: T.textSoft, maxWidth: 600 }}>
//                   This interview follows a consistent, voice-first screening flow designed to evaluate communication, warmth, patience, and teaching presence.
//                 </p>
//               </div>
//               <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 20 }}>
//                 {BRIEFING_STEPS.map((step, idx) => {
//                   const Icon = step.icon; const active = idx === briefingStep;
//                   return (
//                     <button key={step.title} onClick={() => setBriefingStep(idx)} className={active ? "ip-step-active" : "ip-step-inactive"}>
//                       <div className={active ? "ip-step-icon-active" : "ip-step-icon-inactive"}>
//                         <Icon size={18} color={T.accentText} />
//                       </div>
//                       <div style={{ textAlign: "left" }}>
//                         <div style={{ fontSize: 13.5, fontWeight: 700, color: T.text, marginBottom: 4 }}>{step.title}</div>
//                         <div style={{ fontSize: 12.5, lineHeight: 1.55, color: T.textSoft }}>{step.desc}</div>
//                       </div>
//                       <div style={{ marginLeft: "auto", fontSize: 10, color: T.textMuted, flexShrink: 0 }}>{idx + 1}/{BRIEFING_STEPS.length}</div>
//                     </button>
//                   );
//                 })}
//               </div>
//               <div className="ip-inset" style={{ padding: "16px 18px" }}>
//                 <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
//                   <ShieldCheck size={14} color={T.accentText} />
//                   <span style={{ fontSize: 12, fontWeight: 700, color: T.text }}>Interview rules</span>
//                 </div>
//                 <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 7 }}>
//                   {["Stay visible in camera throughout the interview.", "If absent for more than 9 seconds, the interview ends automatically.", "Speak naturally and answer in your own words."].map((r) => (
//                     <li key={r} style={{ display: "flex", alignItems: "flex-start", gap: 8, fontSize: 12.5, lineHeight: 1.5, color: T.textSoft }}>
//                       <span style={{ width: 5, height: 5, borderRadius: "50%", background: T.accentText, marginTop: 6, flexShrink: 0 }} />{r}
//                     </li>
//                   ))}
//                 </ul>
//               </div>
//             </div>
//           </main>
//         </div>
//       </>
//     );
//   }

//   // ─── Interview screen ─────────────────────────────────────────────────────────
//   return (
//     <>
//       <style dangerouslySetInnerHTML={{ __html: FONTS + css }} />
//       <canvas ref={faceCanvasRef} style={{ display: "none" }} aria-hidden="true" />

//       <div className="ip-shell" style={{ height: "100vh", display: "flex", flexDirection: "column", overflow: "hidden", position: "relative" }}>
//         <div className="ip-grid" style={{ position: "absolute", inset: 0 }} />

//         <header className="ip-topbar" style={{ flexShrink: 0, position: "relative", zIndex: 100 }}>
//           <div className="ip-container ip-topbar-inner">
//             <div className="ip-brand">
//               <div className="ip-brandmark"><BrainCircuit size={16} /></div>
//               <div>
//                 <div className="ip-brand-name">Cuemath</div>
//                 <div className="ip-brand-sub">Tutor Screening</div>
//               </div>
//             </div>
//             <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
//               <div style={{ textAlign: "right" }}>
//                 <div style={{ fontSize: 13, fontWeight: 600, color: T.text }}>{candidateName}</div>
//                 {candidateEmail && <div style={{ fontSize: 11, color: T.textMuted }}>{candidateEmail}</div>}
//               </div>
//               <button className="ip-theme-btn" onClick={toggleTheme} aria-label="Toggle theme">
//                 {theme === "dark" ? <Sun size={15} /> : <Moon size={15} />}
//               </button>
//             </div>
//           </div>
//         </header>

//         <div style={{ flex: 1, overflow: "hidden", position: "relative", zIndex: 1 }}>
//           <div className="ip-container" style={{ height: "100%", display: "grid", gridTemplateColumns: "320px 1fr", gap: 20, padding: "20px 28px", alignItems: "stretch" }}>

//             {/* Sidebar */}
//             <aside style={{ display: "flex", flexDirection: "column", gap: 14, height: "100%", overflowY: "auto" }}>
//               <div className="ip-card" style={{ padding: 18, flexShrink: 0 }}>
//                 <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
//                   <div style={{ width: 44, height: 44, borderRadius: 13, background: `linear-gradient(135deg,${T.accent},${T.accentAlt})`, display: "grid", placeItems: "center", color: "#fff", fontSize: 17, fontWeight: 800, boxShadow: `0 8px 20px ${T.accentRing}` }} className={isSpeaking ? "ip-maya-pulse" : ""}>M</div>
//                   <div>
//                     <div style={{ fontSize: 14, fontWeight: 700, letterSpacing: "-0.025em", color: T.text }}>Maya</div>
//                     <div style={{ fontSize: 11, color: T.textMuted }}>AI Interviewer · Cuemath</div>
//                   </div>
//                   <div style={{ marginLeft: "auto" }}>
//                     <div className={isSpeaking ? "ip-chip-accent" : isListening ? "ip-chip-ok" : "ip-chip-neutral"}>
//                       <span style={{ width: 6, height: 6, borderRadius: "50%", background: isSpeaking ? T.accentText : isListening ? T.success : "currentColor" }} />
//                       {isSpeaking ? "Speaking" : isListening ? "Listening" : "Waiting"}
//                     </div>
//                   </div>
//                 </div>
//                 <div style={{ borderRadius: 10, overflow: "hidden", border: `1px solid ${T.border}`, aspectRatio: "16/9", background: T.inset }}>
//                   {cameraState === "granted" ? (
//                     <video ref={interviewVideoRef} autoPlay muted playsInline style={{ width: "100%", height: "100%", objectFit: "cover" }} />
//                   ) : (
//                     <div style={{ height: "100%", display: "grid", placeItems: "center" }}><Camera size={24} color={T.accentText} /></div>
//                   )}
//                 </div>
//               </div>

//               <div className="ip-card" style={{ padding: 18, flexShrink: 0 }}>
//                 <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
//                   <span style={{ fontSize: 12, fontWeight: 700, color: T.text }}>Progress</span>
//                   <span style={{ fontSize: 11, color: T.textMuted }}>{displayCount} / {TOTAL_Q}</span>
//                 </div>
//                 <div className="ip-progress-bg" style={{ marginBottom: 14 }}>
//                   <div className="ip-progress-fill" style={{ width: `${progress}%` }} />
//                 </div>
//                 <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
//                   <StatusPill T={T} ok={micState === "granted"} icon={<Mic size={11} />} label={micState === "granted" ? "Mic on" : "Mic off"} />
//                   <StatusPill T={T} ok={cameraState === "granted"} icon={<Camera size={11} />} label={cameraState === "granted" ? "Camera on" : "Camera off"} />
//                 </div>
//               </div>

//               <div className="ip-card" style={{ padding: 18, flexShrink: 0 }}>
//                 <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
//                   <ShieldCheck size={13} color={T.accentText} />
//                   <span style={{ fontSize: 11, fontWeight: 700, color: T.text }}>Interview rules</span>
//                 </div>
//                 <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 7 }}>
//                   {["Stay visible in camera throughout.", "Absent 9s+ = auto-termination.", "Speak naturally in your own words."].map((r) => (
//                     <li key={r} style={{ display: "flex", alignItems: "flex-start", gap: 7, fontSize: 11.5, lineHeight: 1.5, color: T.textSoft }}>
//                       <span style={{ width: 4, height: 4, borderRadius: "50%", background: T.accentText, marginTop: 6, flexShrink: 0 }} />{r}
//                     </li>
//                   ))}
//                 </ul>
//               </div>

//               {faceAbsenceCountdown !== null && (
//                 <div className="ip-warn-box" style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
//                   <AlertTriangle size={14} color={T.warning} style={{ flexShrink: 0, marginTop: 1 }} />
//                   <span>Stay visible. Terminating in <strong>{faceAbsenceCountdown}s</strong></span>
//                 </div>
//               )}
//               {usingFallback && (
//                 <div className="ip-inset" style={{ padding: "10px 12px", fontSize: 11, color: T.textMuted }}>Fallback mode active — model unavailable.</div>
//               )}
//               {reportError && <div className="ip-warn-box">{reportError}</div>}
//             </aside>

//             {/* Chat panel — voice only */}
//             <div className="ip-card" style={{ display: "flex", flexDirection: "column", overflow: "hidden" }}>
//               <div style={{ padding: "16px 22px", borderBottom: `1px solid ${T.border}`, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16 }}>
//                 <div>
//                   <div style={{ fontSize: 14, fontWeight: 700, letterSpacing: "-0.02em", color: T.text }}>Live Interview</div>
//                   <div style={{ fontSize: 12, color: T.textSoft, marginTop: 2 }}>Speak naturally — Maya will guide you through each question.</div>
//                 </div>
//                 <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
//                   <button
//                     className={isListening ? "ip-btn-danger" : "ip-btn-primary"}
//                     style={{ height: 36, fontSize: 12, opacity: (isLoading || isSpeaking) ? 0.6 : 1 }}
//                     onClick={isListening ? stopListening : startListening}
//                     disabled={isLoading || isSpeaking || micState !== "granted"}
//                   >
//                     {isListening ? <><MicOff size={14} />Stop</> : <><Mic size={14} />Listen</>}
//                   </button>
//                 </div>
//               </div>

//               <div style={{ flex: 1, overflowY: "auto", padding: "20px 22px" }}>
//                 <div style={{ display: "flex", flexDirection: "column", gap: 14, maxWidth: 900, margin: "0 auto" }}>
//                   {messages.map((message, idx) => {
//                     const isUser = message.role === "user";
//                     return (
//                       <div key={`${message.role}-${idx}`} style={{ display: "flex", justifyContent: isUser ? "flex-end" : "flex-start" }}>
//                         <div className={isUser ? "ip-bubble-user" : "ip-bubble-ai"} style={{ maxWidth: "78%" }}>
//                           <div className="ip-bubble-label">{isUser ? "You" : "Maya"}</div>
//                           <div className="ip-bubble-text">{message.content}</div>
//                         </div>
//                       </div>
//                     );
//                   })}

//                   {transcriptPreview && (
//                     <div style={{ display: "flex", justifyContent: "flex-end" }}>
//                       <div className="ip-bubble-user" style={{ maxWidth: "78%", opacity: 0.8 }}>
//                         <div className="ip-bubble-label">You</div>
//                         <div className="ip-bubble-text">{transcriptPreview}</div>
//                       </div>
//                     </div>
//                   )}

//                   {isLoading && (
//                     <div style={{ display: "flex", justifyContent: "flex-start" }}>
//                       <div className="ip-bubble-ai" style={{ display: "flex", alignItems: "center", gap: 10 }}>
//                         <Loader2 size={16} color={T.accentText} className="ip-spin" />
//                         <span style={{ fontSize: 13.5, color: T.textSoft }}>Maya is thinking…</span>
//                       </div>
//                     </div>
//                   )}

//                   <div ref={chatEndRef} />
//                 </div>
//               </div>

//               <div style={{ padding: "12px 22px", borderTop: `1px solid ${T.border}`, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
//                 <span style={{ fontSize: 12.5, color: T.textSoft }}>
//                   {micState === "granted"
//                     ? "Voice mode — click Listen to respond when Maya finishes speaking."
//                     : "Microphone access required to participate."}
//                 </span>
//                 <div className={isSpeaking ? "ip-chip-accent" : isListening ? "ip-chip-ok" : "ip-chip-neutral"}>
//                   <span style={{ width: 6, height: 6, borderRadius: "50%", background: isSpeaking ? T.accentText : isListening ? T.success : "currentColor" }} />
//                   {isSpeaking ? "Maya speaking" : isListening ? "Listening" : "Waiting"}
//                 </div>
//               </div>
//             </div>
//           </div>
//         </div>
//       </div>
//     </>
//   );
// }












"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Loader2, Mic, MicOff, Volume2, CheckCircle, Clock, MessageSquare,
  BarChart2, Camera, Sun, Moon, ChevronRight, AlertTriangle, UserX,
  BrainCircuit, ShieldCheck,
} from "lucide-react";

// ─── Constants ────────────────────────────────────────────────────────────────
const SILENCE_MS = 7000;
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
  [/\bgen only\b/gi,"genuinely"],[/\bgenu only\b/gi,"genuinely"],[/\bgenuinely only\b/gi,"genuinely"],
  [/\binteract to like\b/gi,"interactive, like a"],[/\binteract to\b/gi,"interactive"],
  [/\backnowledg(?:e|ing) (?:the )?feeling/gi,"acknowledge their feeling"],
  [/\bfeel judge\b/gi,"feel judged"],[/\bfeel judges\b/gi,"feel judged"],
  [/\bor present\b/gi,"or pressured"],[/\bleading question[s]?\b/gi,"leading questions"],
  [/\bmanageable step[s]?\b/gi,"manageable steps"],[/\bmanage a step[s]?\b/gi,"manageable steps"],
  [/\bmomentom\b/gi,"momentum"],[/\bmomentem\b/gi,"momentum"],
  [/\bcelebrate small\b/gi,"celebrate small"],[/\bcelebreat\b/gi,"celebrate"],
  [/\bdistract\b(?!ed|ing)/gi,"distracted"],[/\bit'?s in about\b/gi,"it's not about"],
  [/\bin about explaining\b/gi,"not about explaining"],[/\bthat is in about\b/gi,"that is not about"],
  [/\b(\w{3,})\s+\1\b/gi,"$1"],[/\s+na\b\.?/gi,""],[/\s+yaar\b\.?/gi,""],[/\s+hai\b\.?/gi,""],
  [/\s+na\?\s*/g,". "],[/\s+only na\b/gi," only"],[/\bmachine learnings\b/gi,"machine learning"],
  [/\bmission learning\b/gi,"machine learning"],[/\bmy shin learning\b/gi,"machine learning"],
  [/\bmisin learning\b/gi,"machine learning"],[/\bmissing learning\b/gi,"machine learning"],
  [/\bmy scene learning\b/gi,"machine learning"],[/\bmy chin learning\b/gi,"machine learning"],
  [/\bmachine learner\b/gi,"machine learning"],[/\bmy shin learner\b/gi,"machine learning"],
  [/\bartificial intelligent\b/gi,"artificial intelligence"],[/\bdeep learnings\b/gi,"deep learning"],
  [/\bneural network's\b/gi,"neural networks"],[/\bcue math\b/gi,"Cuemath"],
  [/\bcue maths\b/gi,"Cuemath"],[/\bque math\b/gi,"Cuemath"],[/\bque maths\b/gi,"Cuemath"],
  [/\bq math\b/gi,"Cuemath"],[/\bkew math\b/gi,"Cuemath"],[/\bqueue math\b/gi,"Cuemath"],
  [/\bcue mat\b/gi,"Cuemath"],[/\bcu math\b/gi,"Cuemath"],[/\bkyoomath\b/gi,"Cuemath"],
  [/\bmath's\b/gi,"maths"],[/\bi would of\b/gi,"I would have"],[/\bcould of\b/gi,"could have"],
  [/\bshould of\b/gi,"should have"],[/\bwould of\b/gi,"would have"],
  [/\btheir going\b/gi,"they're going"],[/\btheir doing\b/gi,"they're doing"],
  [/\byour welcome\b/gi,"you're welcome"],[/\bits a\b/gi,"it's a"],
  [/\bi am having\b/gi,"I have"],[/\bI done\b/g,"I did"],
  [/\bI am knowing\b/gi,"I know"],[/\bI am understanding\b/gi,"I understand"],
  [/\bI am thinking\b/gi,"I think"],[/\btry your different\b/gi,"try a different"],
  [/\brelated to something they are familiar\b/gi,"related to something they're familiar"],
  [/\bbuild the confidence\b/gi,"build their confidence"],[/\bbuild (?:a )?confidence\b/gi,"build confidence"],
  [/\bgiving them right answer\b/gi,"giving them the right answer"],
  [/\bgiving (?:the )?right answer\b/gi,"giving the right answer"],
  [/\bsmall manageable\b/gi,"smaller, manageable"],[/\bbreak (?:the )?problem into\b/gi,"break the problem into"],
  [/\bsort reset\b/gi,"sort of a reset"],[/\beven is sort reset\b/gi,"which is sort of a reset"],
  [/\bsometimes even is\b/gi,"sometimes, even a"],[/\bthink out loud\b/gi,"think out loud"],
  [/\bthink aloud\b/gi,"think out loud"],[/\bto all them more\b/gi,"to ask them more"],
  [/\ball them\b/gi,"ask them"],[/\s{2,}/g," "],
];

function correctASRText(text: string): string {
  let r = text;
  for (const [p, s] of ASR_CORRECTIONS) r = r.replace(p, s);
  return r.trim();
}

// ─── Types ────────────────────────────────────────────────────────────────────
interface Message { role: "user" | "assistant"; content: string; }
interface DetectedFace { boundingBox: DOMRectReadOnly; }
interface BrowserFaceDetector { detect: (image: CanvasImageSource) => Promise<DetectedFace[]>; }

declare global {
  interface Window {
    SpeechRecognition?: new () => BSR;
    webkitSpeechRecognition?: new () => BSR;
    FaceDetector?: new (options?: { fastMode?: boolean; maxDetectedFaces?: number }) => BrowserFaceDetector;
  }
}

interface BSR {
  continuous: boolean; interimResults: boolean; lang: string;
  start: () => void; stop: () => void;
  onresult: ((e: BSREvent) => void) | null;
  onend: (() => void) | null;
  onerror: ((e: BSRError) => void) | null;
  onaudiostart: (() => void) | null;
}
interface BSREvent { resultIndex: number; results: { length: number; [i: number]: { isFinal: boolean; 0: { transcript: string } } }; }
interface BSRError { error?: string; }
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
  "", "Great, let's move to the next one.", "Good, here's the next scenario.",
  "Thanks for that. Next question:", "Appreciated. One more:", "",
];

function buildFallbackReply(questionCount: number, name: string, userText: string, retryCount: number): { reply: string; shouldAdvance: boolean } {
  const t = userText.toLowerCase();
  const questionIndex = Math.max(0, Math.min(questionCount - 1, QUESTION_BANK.length - 2));
  const nextIdx = Math.min(questionIndex + 1, QUESTION_BANK.length - 1);
  const wantsToSkip = t.includes("next question") || t.includes("move on") || t.includes("skip") || t.includes("next one") || (t.includes("next") && t.length <= 10);
  if (wantsToSkip) {
    if (nextIdx >= QUESTION_BANK.length - 1) return { reply: QUESTION_BANK[QUESTION_BANK.length - 1].replace("[name]", name), shouldAdvance: true };
    const opener = QUESTION_OPENERS[nextIdx] || "Of course, let's move on.";
    return { reply: `${opener} ${QUESTION_BANK[nextIdx]}`, shouldAdvance: true };
  }
  const currentQuestion = QUESTION_BANK[questionIndex];
  const isCasualOrGreeting = t.includes("good morning") || t.includes("good afternoon") || t.includes("good evening") || t.includes("nice to meet") || t.includes("how are you") || (t.includes("hi") && userText.split(" ").length <= 5);
  if (retryCount === 0) {
    const isNonAnswer = t === "no" || t === "nothing" || t === "idk" || t.includes("don't know") || t.includes("not sure") || t.includes("no idea") || t === "(no verbal response given)" || t === "no response";
    const isClarificationRequest = t.includes("means what") || t.includes("explain me") || t.includes("more detail") || t.includes("what should i") || t.includes("what do you mean") || t.includes("rephrase") || t.includes("clarify");
    if (isCasualOrGreeting) {
      const warmResponses = ["I'm doing wonderfully, thank you so much for asking!", "That's so sweet of you to ask! I'm great, thank you!", "Aww, I appreciate that! Doing really well, thank you!"];
      return { reply: `${warmResponses[Math.floor(Math.random() * warmResponses.length)]} ${currentQuestion}`, shouldAdvance: false };
    }
    if (isNonAnswer) return { reply: `No worries at all — take your time! ${currentQuestion}`, shouldAdvance: false };
    if (isClarificationRequest) return { reply: `Of course! Just share what you personally would do in that moment — there's no right or wrong answer. ${currentQuestion}`, shouldAdvance: false };
    return { reply: `I'd love to hear a little bit more from you on this. ${currentQuestion}`, shouldAdvance: false };
  }
  if (nextIdx >= QUESTION_BANK.length - 1) return { reply: QUESTION_BANK[QUESTION_BANK.length - 1].replace("[name]", name), shouldAdvance: true };
  const advanceMessages = isCasualOrGreeting ? "No worries at all — let's jump into it together!" : "Absolutely no pressure — let's move forward.";
  return { reply: `${advanceMessages} ${QUESTION_BANK[nextIdx]}`, shouldAdvance: true };
}

// ─── Skin detection helpers ────────────────────────────────────────────────────
function rgbToYCrCb(r: number, g: number, b: number) {
  const y = 0.299 * r + 0.587 * g + 0.114 * b;
  const cb = 128 - 0.168736 * r - 0.331264 * g + 0.5 * b;
  const cr = 128 + 0.5 * r - 0.418688 * g - 0.081312 * b;
  return { y, cb, cr };
}
function isSkinPixel(r: number, g: number, b: number): boolean {
  const { y, cb, cr } = rgbToYCrCb(r, g, b);
  const rgbRule = r > 60 && g > 30 && b > 15 && Math.max(r, g, b) - Math.min(r, g, b) > 20 && Math.abs(r - g) > 12 && r >= g && r >= b;
  const ycbcrRule = y > 50 && cb >= 80 && cb <= 130 && cr >= 135 && cr <= 175;
  return rgbRule && ycbcrRule;
}
function sobelLikeEdgeScore(gray: Uint8ClampedArray, w: number, h: number): number {
  let strongEdges = 0;
  const total = (w - 2) * (h - 2);
  for (let y = 1; y < h - 1; y++) for (let x = 1; x < w - 1; x++) {
    const i = y * w + x;
    const gx = -gray[i - w - 1] - 2 * gray[i - 1] - gray[i + w - 1] + gray[i - w + 1] + 2 * gray[i + 1] + gray[i + w + 1];
    const gy = -gray[i - w - 1] - 2 * gray[i - w] - gray[i - w + 1] + gray[i + w - 1] + 2 * gray[i + w] + gray[i + w + 1];
    if (Math.abs(gx) + Math.abs(gy) > 180) strongEdges++;
  }
  return total > 0 ? strongEdges / total : 0;
}

// ─── Briefing steps ───────────────────────────────────────────────────────────
const BRIEFING_STEPS = [
  { icon: MessageSquare, title: "Natural conversation", desc: "I'll ask you thoughtful tutor-screening questions. Speak naturally — the goal is to understand how you communicate and connect with students." },
  { icon: Clock, title: "About 8–10 minutes", desc: "The interview is short and focused. There are no trick questions — I'm here to understand how you think and explain." },
  { icon: Mic, title: "Voice-first interview", desc: "This interview is designed for speaking, since tutoring happens through live conversation. Microphone is required to proceed." },
  { icon: BarChart2, title: "Structured assessment", desc: "After the conversation, you'll get a detailed report across clarity, warmth, patience, simplification, and English fluency." },
  { icon: CheckCircle, title: "Be yourself", desc: "There are no perfect answers. I'm looking for warmth, clarity, and genuine care for students — not rehearsed lines." },
];

// ─── Design tokens ────────────────────────────────────────────────────────────
const FONTS = `
@import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;1,9..40,400;1,9..40,500&family=DM+Serif+Display:ital@0;1&display=swap');
*,*::before,*::after { box-sizing: border-box; }
html,body { margin: 0; padding: 0; font-family: "DM Sans", system-ui, sans-serif; }
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
    inputBg: "rgba(6,10,20,0.95)", inputBorder: "rgba(255,255,255,0.09)", inputFocus: "rgba(79,123,255,0.22)",
    topbar: "rgba(8,12,20,0.88)",
    bubbleAI: "#0E1628", bubbleAIBorder: "rgba(255,255,255,0.08)",
    bubbleUser: "linear-gradient(135deg, #4F7BFF 0%, #8B5CF6 100%)",
    shadow: "0 24px 64px rgba(0,0,0,0.50)", shadowMd: "0 12px 36px rgba(0,0,0,0.32)",
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
    inputBg: "#FFFFFF", inputBorder: "rgba(13,21,38,0.10)", inputFocus: "rgba(59,99,232,0.16)",
    topbar: "rgba(244,246,251,0.90)",
    bubbleAI: "#FFFFFF", bubbleAIBorder: "rgba(13,21,38,0.09)",
    bubbleUser: "linear-gradient(135deg, #3B63E8 0%, #7C3AED 100%)",
    shadow: "0 24px 64px rgba(13,21,38,0.09)", shadowMd: "0 12px 36px rgba(13,21,38,0.07)",
    heroGlow1: "rgba(59,99,232,0.08)", heroGlow2: "rgba(124,58,237,0.05)",
  };
}

function StatusPill({ ok, icon, label, T }: { ok: boolean; icon: React.ReactNode; label: string; T: ReturnType<typeof getTokens> }) {
  return (
    <div style={{
      display: "inline-flex", alignItems: "center", gap: 6, padding: "4px 10px",
      borderRadius: 999, border: `1px solid ${ok ? T.successBorder : T.border}`,
      background: ok ? T.successBg : "transparent",
      color: ok ? T.success : T.textMuted, fontSize: 11, fontWeight: 600,
    }}>
      {icon}{label}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function InterviewPage() {
  const router = useRouter();

  // ─── CRITICAL FIX: messagesRef keeps messages in sync to avoid stale closure ──
  const messagesRef = useRef<Message[]>([]);

  // Refs
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
  const supportsSpeechRef = useRef(false);
  const silenceAttemptRef = useRef<Record<number, number>>({});
  const retryCountRef = useRef<Record<number, number>>({});
  const briefingVideoRef = useRef<HTMLVideoElement | null>(null);
  const interviewVideoRef = useRef<HTMLVideoElement | null>(null);
  const cameraStreamRef = useRef<MediaStream | null>(null);
  const sendInProgressRef = useRef(false);
  const utteranceSentRef = useRef(false);
  const faceCheckIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
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

  // State
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const T = getTokens(theme === "dark");

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

  const displayCount = Math.min(Math.max(questionCount - 1, 0), TOTAL_Q);
  const progress = Math.min((displayCount / TOTAL_Q) * 100, 100);

  const setQCount = useCallback((n: number) => { questionCountRef.current = n; setQuestionCount(n); }, []);
  const setLoading = useCallback((v: boolean) => { isLoadingRef.current = v; setIsLoading(v); }, []);
  const setDone = useCallback((v: boolean) => { interviewDoneRef.current = v; setInterviewDone(v); }, []);
  const setMicStateSynced = useCallback((v: "idle" | "requesting" | "granted" | "denied") => { micStateRef.current = v; setMicState(v); }, []);

  // ─── syncMessages: keeps messagesRef + React state in sync ──────────────────
  const syncMessages = useCallback((msgs: Message[]) => {
    messagesRef.current = msgs;
    setMessages(msgs);
  }, []);

  const screenRef = useRef<"briefing" | "interview">(screen);
  useEffect(() => { screenRef.current = screen; }, [screen]);

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; deviceCheckRunningRef.current = false; };
  }, []);

  useEffect(() => {
    const name = localStorage.getItem("candidate_name") || "Candidate";
    const email = localStorage.getItem("candidate_email") || "";
    setCandidateName(name); setCandidateEmail(email); setNameLoaded(true);
    const hasSpeech = typeof window !== "undefined" && (!!window.SpeechRecognition || !!window.webkitSpeechRecognition);
    supportsSpeechRef.current = hasSpeech; setSupportsSpeech(hasSpeech);
    const savedTheme = localStorage.getItem(THEME_STORAGE_KEY) as "dark" | "light" | null;
    if (savedTheme) setTheme(savedTheme);
    hardAbortRef.current = false;
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if ("FaceDetector" in window && !nativeFaceDetectorRef.current) {
      try { nativeFaceDetectorRef.current = new (window.FaceDetector!)({ fastMode: true, maxDetectedFaces: 1 }); }
      catch (err) { console.error("face_detector_init_failed:", err); nativeFaceDetectorRef.current = null; }
    }
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme((t) => { const next = t === "dark" ? "light" : "dark"; localStorage.setItem(THEME_STORAGE_KEY, next); return next; });
  }, []);

  const clearListeningTimers = useCallback(() => {
    if (silenceTimerRef.current) { clearTimeout(silenceTimerRef.current); silenceTimerRef.current = null; }
    if (emptyResponseTimerRef.current) { clearTimeout(emptyResponseTimerRef.current); emptyResponseTimerRef.current = null; }
  }, []);

  const stopCameraPreview = useCallback(() => {
    if (cameraStreamRef.current) { cameraStreamRef.current.getTracks().forEach((t) => t.stop()); cameraStreamRef.current = null; }
    if (briefingVideoRef.current) briefingVideoRef.current.srcObject = null;
    if (interviewVideoRef.current) interviewVideoRef.current.srcObject = null;
  }, []);

  const attachCameraStreamToVisibleVideo = useCallback(async (retryOnNull = true) => {
    const stream = cameraStreamRef.current; if (!stream) return;
    const currentScreen = screenRef.current;
    const targetVideo = currentScreen === "briefing" ? briefingVideoRef.current : interviewVideoRef.current;
    if (!targetVideo) { if (retryOnNull) setTimeout(() => void attachCameraStreamToVisibleVideo(false), 200); return; }
    if (targetVideo.srcObject !== stream) targetVideo.srcObject = stream;
    try { await targetVideo.play(); } catch (e) { console.error("camera_preview_play_failed:", e); }
  }, []);

  useEffect(() => { void attachCameraStreamToVisibleVideo(); }, [screen, cameraState, attachCameraStreamToVisibleVideo]);

  const speak = useCallback((text: string): Promise<void> => {
    return new Promise((resolve) => {
      if (typeof window === "undefined" || !window.speechSynthesis) { resolve(); return; }
      if (hardAbortRef.current) { resolve(); return; }
      const synth = window.speechSynthesis; synth.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.8; utterance.pitch = 1.4; utterance.volume = 1; utterance.lang = "en-US";
      let settled = false;
      const settle = () => { if (settled) return; settled = true; if (mountedRef.current) setIsSpeaking(false); resolve(); };
      const pickVoice = () => {
        const voices = synth.getVoices();
        const chosen = voices.find((v) => v.name === "Microsoft Jenny Online (Natural) - English (United States)") ||
          voices.find((v) => v.name === "Microsoft Aria Online (Natural) - English (United States)") ||
          voices.find((v) => v.name === "Microsoft Zira - English (United States)") ||
          voices.find((v) => /jenny|aria|zira|samantha/i.test(v.name)) ||
          voices.find((v) => /google uk english female/i.test(v.name)) ||
          voices.find((v) => /female|woman/i.test(v.name)) ||
          voices.find((v) => /^en(-|_)/i.test(v.lang)) || null;
        if (chosen) utterance.voice = chosen;
      };
      if (synth.getVoices().length > 0) pickVoice(); else synth.onvoiceschanged = () => pickVoice();
      const safetyTimer = window.setTimeout(() => settle(), Math.min(text.length * 85 + 3500, 20000));
      const finish = () => { window.clearTimeout(safetyTimer); settle(); };
      utterance.onstart = () => { if (hardAbortRef.current) { synth.cancel(); finish(); return; } if (mountedRef.current) setIsSpeaking(true); };
      utterance.onend = finish; utterance.onerror = finish;
      try { synth.speak(utterance); } catch { finish(); }
    });
  }, []);

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, transcriptPreview, isLoading]);

  useEffect(() => {
    if (screen !== "briefing" || mayaIntroPlayed || !nameLoaded || candidateName === "Candidate") return;
    const intro = `Hi ${candidateName}! I'm Maya, your AI interviewer from Cuemath. This is a short, voice-first screening interview. Please enable both your microphone and camera before starting — both are required for this interview. I'll guide you through each step.`;
    const t = setTimeout(() => { hardAbortRef.current = false; void speak(intro); setMayaIntroPlayed(true); }, 800);
    return () => clearTimeout(t);
  }, [screen, mayaIntroPlayed, nameLoaded, candidateName, speak]);

  const requestMicPermission = useCallback(async () => {
    setMicStateSynced("requesting");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach((t) => t.stop()); setMicStateSynced("granted");
    } catch { setMicStateSynced("denied"); setMicVerified(false); }
  }, [setMicStateSynced]);

  const requestCameraPermission = useCallback(async () => {
    if (cameraStreamRef.current) { cameraStreamRef.current.getTracks().forEach((t) => t.stop()); cameraStreamRef.current = null; }
    setCameraState("requesting");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user", width: { ideal: 640 }, height: { ideal: 360 } }, audio: false });
      cameraStreamRef.current = stream;
      const videoTrack = stream.getVideoTracks()[0];
      if (videoTrack) console.log("camera_track_settings:", videoTrack.getSettings());
      setCameraState("granted"); setCameraVerified(true);
      const targetVideo = screenRef.current === "briefing" ? briefingVideoRef.current : interviewVideoRef.current;
      if (targetVideo) { targetVideo.srcObject = stream; try { await targetVideo.play(); } catch (e) { console.error("camera_preview_initial_play_failed:", e); } }
    } catch (error) { console.error("camera_permission_failed:", error); setCameraState("denied"); setCameraVerified(false); }
  }, []);

  const verifyMicrophoneWithMaya = useCallback(async () => {
    if (hardAbortRef.current || deviceCheckRunningRef.current) return;
    if (typeof window === "undefined" || micStateRef.current !== "granted") return;
    const SpeechAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechAPI) { await speak("Your browser does not support microphone verification. You can still continue."); return; }
    deviceCheckRunningRef.current = true; setDeviceCheckRunning(true); setDeviceCheckTranscript(""); setMicVerified(false);
    await speak("Let's quickly test your microphone. Please say: Maya, can you hear me clearly?");
    if (hardAbortRef.current) { deviceCheckRunningRef.current = false; if (mountedRef.current) setDeviceCheckRunning(false); return; }
    const rec = new SpeechAPI(); rec.continuous = false; rec.interimResults = true; rec.lang = "en-IN";
    let transcript = ""; let settled = false;
    const settle = async (ok: boolean, heardText: string) => {
      if (settled) return; settled = true;
      try { rec.stop?.(); } catch {}
      deviceCheckRunningRef.current = false; if (!mountedRef.current) return;
      setDeviceCheckRunning(false); setDeviceCheckTranscript(heardText);
      if (hardAbortRef.current) return;
      if (ok) { setMicVerified(true); await speak("Yes, I can hear you properly. Your microphone looks good to go."); }
      else { setMicVerified(false); await speak("I'm not hearing you clearly yet. Please check your microphone and try the test again."); }
    };
    const timeout = setTimeout(() => void settle(transcript.trim().length >= 6, transcript.trim()), 6000);
    rec.onresult = (e: BSREvent) => {
      let finalText = ""; let interim = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        if (e.results[i].isFinal) finalText += e.results[i][0].transcript + " ";
        else interim += e.results[i][0].transcript;
      }
      transcript = (finalText || interim).trim(); if (mountedRef.current) setDeviceCheckTranscript(transcript);
    };
    rec.onerror = () => { clearTimeout(timeout); void settle(false, transcript.trim()); };
    rec.onend = () => { clearTimeout(timeout); void settle(transcript.trim().length >= 6, transcript.trim()); };
    try { rec.start(); } catch {
      clearTimeout(timeout); deviceCheckRunningRef.current = false;
      if (mountedRef.current) setDeviceCheckRunning(false);
      await speak("I couldn't start the microphone test. Please try again.");
    }
  }, [speak]);

  const doSend = useCallback((text: string) => {
    if (hardAbortRef.current || sendInProgressRef.current) return;
    if (isLoadingRef.current || interviewDoneRef.current) return;
    sendInProgressRef.current = true;
    void sendMessageRef.current(text).finally(() => { sendInProgressRef.current = false; });
  }, []);

  const startListening = useCallback(() => {
    if (hardAbortRef.current) return;
    if (typeof window === "undefined" || micStateRef.current !== "granted") return;
    if (isListeningRef.current) { recognitionRef.current?.stop(); isListeningRef.current = false; setIsListening(false); }
    const SpeechAPI = window.SpeechRecognition || window.webkitSpeechRecognition; if (!SpeechAPI) return;
    finalTranscriptRef.current = ""; interimTranscriptRef.current = ""; setTranscriptPreview(""); clearListeningTimers(); sendInProgressRef.current = false; utteranceSentRef.current = false;
    const qAtStart = questionCountRef.current;
    if (silenceAttemptRef.current[qAtStart] === undefined) silenceAttemptRef.current[qAtStart] = 0;
    const rec = new SpeechAPI(); rec.continuous = true; rec.interimResults = true; rec.lang = "en-IN";
    emptyResponseTimerRef.current = setTimeout(() => {
      if (hardAbortRef.current) return;
      if (isListeningRef.current) { rec.stop(); isListeningRef.current = false; setIsListening(false); setTranscriptPreview(""); }
      if (!utteranceSentRef.current && !sendInProgressRef.current && !isLoadingRef.current && !interviewDoneRef.current) {
        const liveQ = questionCountRef.current; const attempts = silenceAttemptRef.current[liveQ] ?? 0;
        silenceAttemptRef.current[liveQ] = attempts + 1; utteranceSentRef.current = true; doSend(EMPTY_RESPONSE_TOKEN);
      }
    }, EMPTY_RESPONSE_MS);
    rec.onresult = (e: BSREvent) => {
      if (hardAbortRef.current) return;
      let newFinal = ""; let interim = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        if (e.results[i].isFinal) newFinal += e.results[i][0].transcript + " ";
        else interim += e.results[i][0].transcript;
      }
      if (newFinal.trim()) finalTranscriptRef.current = (finalTranscriptRef.current + " " + newFinal).trim();
      interimTranscriptRef.current = interim.trim();
      const raw = (finalTranscriptRef.current + " " + interim).trim();
      const display = correctASRText(raw);
      if (display) { setTranscriptPreview(display); if (emptyResponseTimerRef.current) { clearTimeout(emptyResponseTimerRef.current); emptyResponseTimerRef.current = null; } }
      const liveQ = questionCountRef.current; silenceAttemptRef.current[liveQ] = 0;
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
      const toSubmit = (finalTranscriptRef.current + " " + interim).trim();
      if (toSubmit) {
        silenceTimerRef.current = setTimeout(() => {
          if (hardAbortRef.current || !isListeningRef.current) return;
          rec.stop(); isListeningRef.current = false; setIsListening(false);
          const corrected = correctASRText(toSubmit);
          if (!utteranceSentRef.current && !sendInProgressRef.current && !isLoadingRef.current && !interviewDoneRef.current) { utteranceSentRef.current = true; doSend(corrected); }
        }, SILENCE_MS);
      }
    };
    rec.onerror = (e: BSRError) => {
      isListeningRef.current = false; setIsListening(false); clearListeningTimers(); recognitionRef.current = null;
      if (e?.error === "aborted") return;
      if (e?.error === "not-allowed") { setMicStateSynced("denied"); return; }
      if (hardAbortRef.current || isLoadingRef.current || interviewDoneRef.current) return;
      const combined = (finalTranscriptRef.current + " " + interimTranscriptRef.current).trim();
      const partial = correctASRText(combined);
      if (partial && !utteranceSentRef.current && !sendInProgressRef.current) { utteranceSentRef.current = true; doSend(partial); }
      else if (!utteranceSentRef.current && !sendInProgressRef.current) {
        setTimeout(() => {
          if (hardAbortRef.current || isLoadingRef.current || interviewDoneRef.current || sendInProgressRef.current || utteranceSentRef.current) return;
          utteranceSentRef.current = true; doSend(EMPTY_RESPONSE_TOKEN);
        }, 1500);
      }
    };
    rec.onend = () => {
      isListeningRef.current = false; setIsListening(false); clearListeningTimers(); recognitionRef.current = null;
      if (hardAbortRef.current || isLoadingRef.current || interviewDoneRef.current) return;
      const combined = (finalTranscriptRef.current + " " + interimTranscriptRef.current).trim();
      const partial = correctASRText(combined);
      if (partial && !utteranceSentRef.current && !sendInProgressRef.current) { utteranceSentRef.current = true; doSend(partial); }
    };
    recognitionRef.current = rec; rec.start(); isListeningRef.current = true; setIsListening(true);
  }, [clearListeningTimers, doSend, setMicStateSynced]);

  const stopListening = useCallback(() => {
    clearListeningTimers();
    if (recognitionRef.current && isListeningRef.current) recognitionRef.current.stop();
    isListeningRef.current = false; setIsListening(false);
    if (hardAbortRef.current || isLoadingRef.current || sendInProgressRef.current) return;
    const combined = (finalTranscriptRef.current + " " + interimTranscriptRef.current).trim();
    const captured = correctASRText(combined);
    setTimeout(() => {
      if (hardAbortRef.current || sendInProgressRef.current || isLoadingRef.current || interviewDoneRef.current || utteranceSentRef.current) return;
      utteranceSentRef.current = true; doSend(captured || EMPTY_RESPONSE_TOKEN);
    }, 300);
  }, [clearListeningTimers, doSend]);

  const maybeStartListening = useCallback(() => {
    if (hardAbortRef.current) return;
    if (supportsSpeechRef.current && micStateRef.current === "granted") setTimeout(() => startListening(), 700);
  }, [startListening]);

  // ─── generateReport ───────────────────────────────────────────────────────────
  const generateReport = useCallback(async (finalMessages: Message[]) => {
    if (hardAbortRef.current) return;
    const validMessages = finalMessages.filter(
      (m) => (m.role === "user" || m.role === "assistant") && typeof m.content === "string" && m.content.trim().length > 0
    );
    const transcript = validMessages.map((m) => `${m.role === "user" ? "Candidate" : "Maya"}: ${m.content}`).join("\n\n");
    try {
      localStorage.setItem("interview_transcript", transcript);
      localStorage.setItem("interview_messages", JSON.stringify(validMessages));
      localStorage.setItem("assessment_saved_at", Date.now().toString());
    } catch (e) { console.error("localStorage_save_failed:", e); }

    const tryAssess = async () => {
      if (hardAbortRef.current) return;
      const payload = { transcript, candidateName };
      const res = await fetch("/api/assess", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) { const errText = await res.text(); throw new Error(`assess_${res.status}: ${errText.slice(0, 200)}`); }
      const raw = await res.text();
      if (!raw || !raw.trim()) throw new Error("Empty response from /api/assess");
      let data: unknown;
      try { data = JSON.parse(raw); } catch { throw new Error(`assess_bad_json: ${raw.slice(0, 120)}`); }
      try { localStorage.setItem("assessment_result", JSON.stringify(data)); } catch { /* non-critical */ }
      if (!hardAbortRef.current) router.push("/report");
    };

    try {
      await tryAssess();
    } catch (err) {
      console.error("assess_first_attempt_failed:", err);
      if (hardAbortRef.current) return;
      setReportError("Generating your report… please wait.");
      setTimeout(async () => {
        try { if (!hardAbortRef.current) await tryAssess(); }
        catch (err2) {
          console.error("assess_second_attempt_failed:", err2);
          if (!hardAbortRef.current) {
            const fallback = {
              candidateName, overallScore: 5.5, overallLabel: "Adequate",
              summary: `${candidateName} completed the interview. Assessment service was temporarily unavailable.`,
              recommendation: "Consider",
              dimensions: {
                communication: { score: 5.5, label: "Adequate", feedback: "Manual review required.", highlights: [] },
                warmth: { score: 5.5, label: "Adequate", feedback: "Manual review required.", highlights: [] },
                patience: { score: 5.5, label: "Adequate", feedback: "Manual review required.", highlights: [] },
                simplification: { score: 5.5, label: "Adequate", feedback: "Manual review required.", highlights: [] },
                fluency: { score: 5.5, label: "Adequate", feedback: "Manual review required.", highlights: [] },
              },
              strengths: ["Completed the full interview"],
              improvements: ["Manual review required — AI assessment unavailable"],
              generatedAt: new Date().toISOString(),
              _fallback: true,
            };
            try { localStorage.setItem("assessment_result", JSON.stringify(fallback)); } catch { /* ignore */ }
            router.push("/report");
          }
        }
      }, 4000);
    }
  }, [candidateName, router]);

  const stopPresenceDetection = useCallback(() => {
    if (faceCheckIntervalRef.current) { clearInterval(faceCheckIntervalRef.current); faceCheckIntervalRef.current = null; }
    if (faceAbsenceTimerRef.current) { clearTimeout(faceAbsenceTimerRef.current); faceAbsenceTimerRef.current = null; }
    if (visibilityHandlerRef.current) { document.removeEventListener("visibilitychange", visibilityHandlerRef.current); visibilityHandlerRef.current = null; }
    faceAbsenceStartRef.current = null; consecutiveAbsentCountRef.current = 0; unknownPresenceCountRef.current = 0; setFaceAbsenceCountdown(null);
  }, []);

  // ─── FIXED sendMessage: uses messagesRef.current directly — no stale closure ─
  const sendMessage = useCallback(async (text: string) => {
    if (hardAbortRef.current) return;
    const trimmed = text.trim();
    const isToken = text === EMPTY_RESPONSE_TOKEN;
    const normalizedInput = isToken ? "no response" : trimmed;
    if ((!trimmed && !isToken) || isLoadingRef.current || interviewDoneRef.current) return;

    clearListeningTimers();

    const userMsg: Message = { role: "user", content: isToken ? "(No verbal response given)" : trimmed };

    // ─── CRITICAL FIX: read from messagesRef directly (always current) ──────
    const currentMessages = messagesRef.current;
    const validPrev = currentMessages.filter(
      (m) => (m.role === "user" || m.role === "assistant") && typeof m.content === "string" && m.content.trim().length > 0
    );
    const updatedMessages: Message[] = [...validPrev, userMsg];

    // Update BOTH ref and state atomically
    messagesRef.current = updatedMessages;
    setMessages(updatedMessages);

    setTranscriptPreview(""); finalTranscriptRef.current = ""; interimTranscriptRef.current = "";
    setLoading(true);

    const currentCount = questionCountRef.current;
    const currentRetryCount = retryCountRef.current[currentCount] ?? 0;

    try {
      if (hardAbortRef.current) { setLoading(false); return; }

      const payload = {
        messages: updatedMessages.map((m) => ({ role: m.role, content: m.content })),
        candidateName,
        questionCount: currentCount,
        retryCount: currentRetryCount,
      };

      console.log("chat_request: msgs=" + payload.messages.length + " q=" + currentCount);

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (hardAbortRef.current) { setLoading(false); return; }

      if (!res.ok) {
        const errText = await res.text();
        console.error("chat_api_error:", res.status, errText.slice(0, 200));
        throw new Error(`chat_${res.status}`);
      }

      const rawText = await res.text();
      if (!rawText || !rawText.trim()) throw new Error("Empty chat response");

      let data: Record<string, unknown>;
      try { data = JSON.parse(rawText) as Record<string, unknown>; } catch { throw new Error("chat_bad_json"); }

      if (hardAbortRef.current) { setLoading(false); return; }
      if (data?.code === "QUOTA_EXCEEDED" || data?.source === "fallback") throw new Error("quota_fallback");
      if (!data?.text) throw new Error((data?.error as string) || "unavailable");

      const aiMsg: Message = { role: "assistant", content: data.text as string };
      const nextCount = data.isFollowUp ? currentCount : currentCount + 1;
      const finalMessages: Message[] = [...updatedMessages, aiMsg];

      if (data.isFollowUp) {
        retryCountRef.current = { ...retryCountRef.current, [currentCount]: currentRetryCount + 1 };
      } else {
        retryCountRef.current = { ...retryCountRef.current, [currentCount]: 0, [nextCount]: 0 };
        silenceAttemptRef.current[nextCount] = 0;
      }

      // Update both ref and state
      messagesRef.current = finalMessages;
      setMessages(finalMessages);
      setQCount(nextCount);

      if (hardAbortRef.current) { setLoading(false); return; }
      await speak(data.text as string);
      if (hardAbortRef.current) { setLoading(false); return; }

      if (data.isComplete || nextCount >= 7) {
        setDone(true);
        setTimeout(() => void generateReport(finalMessages), 1200);
      } else {
        maybeStartListening();
      }
    } catch (err) {
      if (hardAbortRef.current) { setLoading(false); return; }
      const msg = err instanceof Error ? err.message : String(err);
      if (!msg.includes("quota") && msg !== "quota_fallback") console.error("sendMessage_error:", err);

      const { reply: fb, shouldAdvance } = buildFallbackReply(currentCount, candidateName, normalizedInput, currentRetryCount);
      const nextCount = shouldAdvance ? currentCount + 1 : currentCount;

      if (shouldAdvance) {
        retryCountRef.current = { ...retryCountRef.current, [currentCount]: 0, [nextCount]: 0 };
        silenceAttemptRef.current[nextCount] = 0;
      } else {
        retryCountRef.current = { ...retryCountRef.current, [currentCount]: currentRetryCount + 1 };
      }

      const aiMsg: Message = { role: "assistant", content: fb };
      const finalMessages: Message[] = [...updatedMessages, aiMsg];

      // Update both ref and state
      messagesRef.current = finalMessages;
      setMessages(finalMessages);
      setQCount(nextCount);
      setUsingFallback(true);

      if (hardAbortRef.current) { setLoading(false); return; }
      await speak(fb);
      if (hardAbortRef.current) { setLoading(false); return; }

      if (nextCount >= 7) {
        setDone(true);
        setTimeout(() => void generateReport(finalMessages), 1200);
      } else {
        maybeStartListening();
      }
    } finally {
      setLoading(false);
    }
  }, [candidateName, clearListeningTimers, generateReport, maybeStartListening, setDone, setLoading, setQCount, speak]);

  useEffect(() => { sendMessageRef.current = sendMessage; }, [sendMessage]);

  const checkPresence = useCallback(async (): Promise<PresenceState> => {
    const video = interviewVideoRef.current; if (!video) return "unknown";
    if (video.readyState < 2 || video.videoWidth === 0 || video.videoHeight === 0) return "unknown";
    if (presenceCheckBusyRef.current) return "unknown";
    presenceCheckBusyRef.current = true;
    try {
      const vw = video.videoWidth; const vh = video.videoHeight;
      if (nativeFaceDetectorRef.current) {
        try {
          const faces = await nativeFaceDetectorRef.current.detect(video);
          if (faces.length === 0) return "absent";
          const validFace = faces.some((face) => {
            const box = face.boundingBox; const cx = box.x + box.width / 2; const cy = box.y + box.height / 2;
            const insideCentralRegion = cx > vw * 0.12 && cx < vw * 0.88 && cy > vh * 0.08 && cy < vh * 0.92;
            const bigEnough = box.width >= vw * MIN_FACE_WIDTH_RATIO && box.height >= vh * MIN_FACE_HEIGHT_RATIO;
            return insideCentralRegion && bigEnough;
          });
          return validFace ? "present" : "absent";
        } catch (err) { console.error("face_detector_detect_failed:", err); }
      }
      const canvas = faceCanvasRef.current; if (!canvas) return "unknown";
      const ctx = canvas.getContext("2d", { willReadFrequently: true }); if (!ctx) return "unknown";
      canvas.width = FALLBACK_SAMPLE_W; canvas.height = FALLBACK_SAMPLE_H;
      ctx.drawImage(video, 0, 0, FALLBACK_SAMPLE_W, FALLBACK_SAMPLE_H);
      const imageData = ctx.getImageData(0, 0, FALLBACK_SAMPLE_W, FALLBACK_SAMPLE_H); const data = imageData.data;
      const gray = new Uint8ClampedArray(FALLBACK_SAMPLE_W * FALLBACK_SAMPLE_H);
      let fullSkin = 0; let centerSkin = 0; let centerPixels = 0;
      const cx1 = Math.floor(FALLBACK_SAMPLE_W * 0.25); const cx2 = Math.floor(FALLBACK_SAMPLE_W * 0.75);
      const cy1 = Math.floor(FALLBACK_SAMPLE_H * 0.12); const cy2 = Math.floor(FALLBACK_SAMPLE_H * 0.78);
      for (let y = 0; y < FALLBACK_SAMPLE_H; y++) for (let x = 0; x < FALLBACK_SAMPLE_W; x++) {
        const i = y * FALLBACK_SAMPLE_W + x; const di = i * 4;
        const r = data[di]; const g = data[di + 1]; const b = data[di + 2];
        gray[i] = Math.round(0.299 * r + 0.587 * g + 0.114 * b);
        const skin = isSkinPixel(r, g, b); if (skin) fullSkin++;
        const inCenter = x >= cx1 && x <= cx2 && y >= cy1 && y <= cy2;
        if (inCenter) { centerPixels++; if (skin) centerSkin++; }
      }
      const fullSkinRatio = fullSkin / (FALLBACK_SAMPLE_W * FALLBACK_SAMPLE_H);
      const centerSkinRatio = centerPixels > 0 ? centerSkin / centerPixels : 0;
      const edgeRatio = sobelLikeEdgeScore(gray, FALLBACK_SAMPLE_W, FALLBACK_SAMPLE_H);
      if (edgeRatio > TEXTURE_COMPLEXITY_MAX) return "absent";
      const looksHumanish = centerSkinRatio >= CENTER_SKIN_RATIO_MIN && fullSkinRatio >= FULL_SKIN_RATIO_MIN && edgeRatio >= EDGE_RATIO_MIN && edgeRatio <= EDGE_RATIO_MAX;
      return looksHumanish ? "present" : "absent";
    } catch (err) { console.error("presence_check_failed:", err); return "unknown"; }
    finally { presenceCheckBusyRef.current = false; }
  }, []);

  const stopEverythingNow = useCallback(() => {
    hardAbortRef.current = true; stopPresenceDetection(); clearListeningTimers();
    try { recognitionRef.current?.stop(); } catch {}
    recognitionRef.current = null; isListeningRef.current = false; sendInProgressRef.current = false;
    if (typeof window !== "undefined" && window.speechSynthesis) window.speechSynthesis.cancel();
    stopCameraPreview(); setIsListening(false); setIsSpeaking(false); setIsLoading(false);
  }, [clearListeningTimers, stopCameraPreview, stopPresenceDetection]);

  const terminateInterview = useCallback((reason: string) => {
    if (faceTerminatedRef.current) return; faceTerminatedRef.current = true;
    stopEverythingNow(); setTerminated(true); setTerminationReason(reason);
  }, [stopEverythingNow]);

  const startPresenceDetection = useCallback(() => {
    if (faceCheckIntervalRef.current) return;
    faceAbsenceStartRef.current = null; faceTerminatedRef.current = false;
    consecutiveAbsentCountRef.current = 0; unknownPresenceCountRef.current = 0;
    let warmupCount = 0;
    const handleVisibilityChange = () => {
      if (document.hidden) { faceAbsenceStartRef.current = null; consecutiveAbsentCountRef.current = 0; unknownPresenceCountRef.current = 0; if (mountedRef.current) setFaceAbsenceCountdown(null); }
    };
    visibilityHandlerRef.current = handleVisibilityChange;
    document.addEventListener("visibilitychange", handleVisibilityChange);
    faceCheckIntervalRef.current = setInterval(() => {
      if (faceTerminatedRef.current || interviewDoneRef.current || hardAbortRef.current) {
        if (faceCheckIntervalRef.current) { clearInterval(faceCheckIntervalRef.current); faceCheckIntervalRef.current = null; }
        if (visibilityHandlerRef.current) { document.removeEventListener("visibilitychange", visibilityHandlerRef.current); visibilityHandlerRef.current = null; }
        return;
      }
      if (document.hidden) return;
      if (warmupCount < PRESENCE_WARMUP_FRAMES) { warmupCount++; return; }
      void (async () => {
        const state = await checkPresence();
        if (state === "present") { faceAbsenceStartRef.current = null; consecutiveAbsentCountRef.current = 0; unknownPresenceCountRef.current = 0; if (mountedRef.current) setFaceAbsenceCountdown(null); return; }
        if (state === "unknown") {
          unknownPresenceCountRef.current += 1;
          if (unknownPresenceCountRef.current < UNKNOWN_STREAK_BEFORE_SOFT_ABSENT) {
            if (faceAbsenceStartRef.current !== null && mountedRef.current) {
              const absenceMs = Date.now() - faceAbsenceStartRef.current;
              const remainingSecs = Math.max(0, Math.ceil((FACE_ABSENCE_TERMINATE_MS - absenceMs) / 1000));
              setFaceAbsenceCountdown(remainingSecs);
              if (absenceMs >= FACE_ABSENCE_TERMINATE_MS) { terminateInterview("You were not visible in the camera frame for more than 9 seconds. The interview has been terminated as per our proctoring policy."); if (mountedRef.current) setFaceAbsenceCountdown(null); }
            }
            return;
          }
          consecutiveAbsentCountRef.current += 1;
        } else { unknownPresenceCountRef.current = 0; consecutiveAbsentCountRef.current += 1; }
        if (consecutiveAbsentCountRef.current < CONSECUTIVE_ABSENT_THRESHOLD) return;
        if (faceAbsenceStartRef.current === null) { faceAbsenceStartRef.current = Date.now(); }
        const absenceMs = Date.now() - faceAbsenceStartRef.current;
        const remainingSecs = Math.max(0, Math.ceil((FACE_ABSENCE_TERMINATE_MS - absenceMs) / 1000));
        if (mountedRef.current) setFaceAbsenceCountdown(remainingSecs);
        if (absenceMs >= FACE_ABSENCE_TERMINATE_MS) { terminateInterview("You were not visible in the camera frame for more than 9 seconds. The interview has been terminated as per our proctoring policy."); if (mountedRef.current) setFaceAbsenceCountdown(null); }
      })();
    }, FACE_CHECK_INTERVAL_MS);
  }, [checkPresence, terminateInterview]);

  useEffect(() => {
    return () => {
      hardAbortRef.current = true; stopPresenceDetection(); clearListeningTimers();
      try { recognitionRef.current?.stop(); } catch {}
      recognitionRef.current = null;
      if (typeof window !== "undefined" && window.speechSynthesis) window.speechSynthesis.cancel();
      stopCameraPreview();
    };
  }, [clearListeningTimers, stopCameraPreview, stopPresenceDetection]);

  const canBeginInterview = micState === "granted" && cameraState === "granted";

  const beginInterview = useCallback(async () => {
    if (!canBeginInterview) { setShowMandatoryWarning(true); await speak("Please enable both your microphone and camera before starting the interview. Both are required."); return; }
    if (isBeginning) return;
    setIsBeginning(true); setShowMandatoryWarning(false); window.speechSynthesis?.cancel(); clearListeningTimers();
    hardAbortRef.current = false; faceTerminatedRef.current = false; setTerminated(false); setTerminationReason(""); setFaceAbsenceCountdown(null);
    consecutiveAbsentCountRef.current = 0; unknownPresenceCountRef.current = 0;
    retryCountRef.current = Object.create(null) as Record<number, number>;
    silenceAttemptRef.current = Object.create(null) as Record<number, number>;
    sendInProgressRef.current = false; utteranceSentRef.current = false; setUsingFallback(false);

    // ─── CRITICAL FIX: reset messagesRef alongside state ─────────────────────
    messagesRef.current = [];
    setMessages([]);
    setTranscriptPreview(""); setQuestionCount(1); questionCountRef.current = 1; setDone(false);

    if (supportsSpeechRef.current && micStateRef.current === "idle") {
      setMicStateSynced("requesting");
      try { const stream = await navigator.mediaDevices.getUserMedia({ audio: true }); stream.getTracks().forEach((t) => t.stop()); setMicStateSynced("granted"); }
      catch { setMicStateSynced("denied"); }
    }
    setScreen("interview");
    setTimeout(() => { if (!hardAbortRef.current) { startPresenceDetection(); void attachCameraStreamToVisibleVideo(true); } }, 250);
    setLoading(true);
    try {
      const initial: Message[] = [{ role: "user", content: `Hi, my name is ${candidateName}.` }];
      // ─── CRITICAL FIX: keep ref in sync ─────────────────────────────────────
      messagesRef.current = initial;
      setMessages(initial);

      const payload = {
        messages: initial.map((m) => ({ role: m.role, content: m.content })),
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
      try { if (rawText) data = JSON.parse(rawText) as Record<string, unknown>; } catch { /* use fallback */ }

      const text = (data?.text as string) || QUESTION_BANK[0];
      const aiMsg: Message = { role: "assistant", content: text };
      const final: Message[] = [...initial, aiMsg];

      // ─── CRITICAL FIX: keep ref in sync ─────────────────────────────────────
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
      const initial: Message[] = [{ role: "user", content: `Hi, my name is ${candidateName}.` }];
      const aiMsg: Message = { role: "assistant", content: fallback };
      const final: Message[] = [...initial, aiMsg];

      // ─── CRITICAL FIX: keep ref in sync ─────────────────────────────────────
      messagesRef.current = final;
      setMessages(final);
      setQCount(2);

      await speak(fallback);
      if (!hardAbortRef.current) maybeStartListening();
    } finally { setLoading(false); setIsBeginning(false); }
  }, [attachCameraStreamToVisibleVideo, canBeginInterview, candidateName, clearListeningTimers, isBeginning, maybeStartListening, setDone, setLoading, setMicStateSynced, setQCount, speak, startPresenceDetection]);

  const handleReturnHome = useCallback(() => { stopEverythingNow(); router.push("/"); }, [router, stopEverythingNow]);

  // suppress unused warning
  void micVerified; void cameraVerified; void interviewDone; void syncMessages;

  // ─── CSS ─────────────────────────────────────────────────────────────────────
  const css = `
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
  `;

  // ─── Terminated screen ────────────────────────────────────────────────────────
  if (terminated) {
    return (
      <>
        <style dangerouslySetInnerHTML={{ __html: FONTS + css }} />
        <div className="ip-shell" style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "40px 20px", position: "relative" }}>
          <div className="ip-grid" style={{ position: "absolute", inset: 0 }} />
          <div className="ip-card" style={{ width: "100%", maxWidth: 560, padding: "40px", position: "relative", zIndex: 1 }}>
            <div style={{ width: 72, height: 72, borderRadius: "50%", background: T.dangerBg, border: `1px solid ${T.dangerBorder}`, display: "grid", placeItems: "center", margin: "0 auto 24px" }}>
              <UserX size={32} color={T.danger} />
            </div>
            <h1 style={{ margin: "0 0 12px", fontSize: 24, fontWeight: 700, letterSpacing: "-0.03em", textAlign: "center" }}>Interview terminated</h1>
            <p style={{ margin: "0 0 24px", fontSize: 14, lineHeight: 1.7, color: T.textSoft, textAlign: "center" }}>{terminationReason}</p>
            <div className="ip-warn-box" style={{ marginBottom: 24, display: "flex", alignItems: "flex-start", gap: 10 }}>
              <AlertTriangle size={15} color={T.warning} style={{ flexShrink: 0, marginTop: 1 }} />
              <span>Please ensure you remain visible in the camera throughout the interview.</span>
            </div>
            <button onClick={handleReturnHome} className="ip-btn-primary ip-btn-full" style={{ height: 48, fontSize: 15 }}>
              Return to Home <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </>
    );
  }

  // ─── Briefing screen ──────────────────────────────────────────────────────────
  if (screen === "briefing") {
    return (
      <>
        <style dangerouslySetInnerHTML={{ __html: FONTS + css }} />
        <canvas ref={faceCanvasRef} style={{ display: "none" }} aria-hidden="true" />
        <div className="ip-shell" style={{ display: "flex", flexDirection: "column", minHeight: "100vh", position: "relative" }}>
          <div className="ip-grid" style={{ position: "absolute", inset: 0 }} />
          <header className="ip-topbar" style={{ position: "sticky", zIndex: 100 }}>
            <div className="ip-container ip-topbar-inner">
              <div className="ip-brand">
                <div className="ip-brandmark"><BrainCircuit size={16} /></div>
                <div>
                  <div className="ip-brand-name">Cuemath</div>
                  <div className="ip-brand-sub">Tutor Screening</div>
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: T.text }}>{candidateName}</div>
                  {candidateEmail && <div style={{ fontSize: 11, color: T.textMuted }}>{candidateEmail}</div>}
                </div>
                <button className="ip-theme-btn" onClick={toggleTheme} aria-label="Toggle theme">
                  {theme === "dark" ? <Sun size={15} /> : <Moon size={15} />}
                </button>
              </div>
            </div>
          </header>

          <main className="ip-container" style={{ position: "relative", zIndex: 1, flex: 1, display: "grid", gridTemplateColumns: "400px 1fr", gap: 24, padding: "28px 28px", alignItems: "start" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div className="ip-card" style={{ padding: 20 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
                  <div style={{ width: 48, height: 48, borderRadius: 14, background: `linear-gradient(135deg,${T.accent},${T.accentAlt})`, display: "grid", placeItems: "center", color: "#fff", fontSize: 18, fontWeight: 800, boxShadow: `0 8px 20px ${T.accentRing}` }} className={isSpeaking ? "ip-maya-pulse" : ""}>M</div>
                  <div>
                    <div style={{ fontSize: 15, fontWeight: 700, letterSpacing: "-0.025em", color: T.text }}>Maya</div>
                    <div style={{ fontSize: 11, color: T.textMuted, marginTop: 2 }}>AI Interviewer · Cuemath</div>
                  </div>
                  <div style={{ marginLeft: "auto" }} className="ip-chip-ok">
                    <span style={{ width: 6, height: 6, borderRadius: "50%", background: T.success }} /> Ready
                  </div>
                </div>
                <div style={{ borderRadius: 12, overflow: "hidden", border: `1px solid ${T.border}`, aspectRatio: "16/9", background: T.inset, position: "relative" }}>
                  {cameraState === "granted" ? (
                    <video ref={briefingVideoRef} autoPlay muted playsInline style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  ) : (
                    <div style={{ height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 10 }}>
                      <Camera size={28} color={T.accentText} />
                      <span style={{ fontSize: 12, color: T.textMuted }}>Camera preview will appear here</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="ip-card" style={{ padding: 20 }}>
                <div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.10em", color: T.textMuted, marginBottom: 14 }}>Device Setup</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 14 }}>
                  <button className="ip-device-btn" onClick={requestMicPermission}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <span style={{ display: "flex", alignItems: "center", gap: 8 }}><Mic size={14} color={T.accentText} />{micState === "granted" ? "Microphone enabled ✓" : "Enable microphone"}</span>
                      {micState === "granted" && <span style={{ fontSize: 10, color: T.success }}>✓</span>}
                    </div>
                  </button>
                  <button className="ip-device-btn" onClick={requestCameraPermission}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <span style={{ display: "flex", alignItems: "center", gap: 8 }}><Camera size={14} color={T.accentText} />{cameraState === "granted" ? "Camera enabled ✓" : "Enable camera"}</span>
                      {cameraState === "granted" && <span style={{ fontSize: 10, color: T.success }}>✓</span>}
                    </div>
                  </button>
                  <button className="ip-device-btn" onClick={verifyMicrophoneWithMaya} disabled={micState !== "granted" || deviceCheckRunning}>
                    <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      {deviceCheckRunning ? <Loader2 size={14} className="ip-spin" /> : <Volume2 size={14} color={T.accentText} />}
                      {deviceCheckRunning ? "Testing microphone…" : "Test microphone with Maya"}
                    </span>
                  </button>
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 7, marginBottom: 14 }}>
                  <StatusPill T={T} ok={micState === "granted"} icon={<Mic size={12} />} label={micState === "granted" ? "Mic on" : "Mic off"} />
                  <StatusPill T={T} ok={cameraState === "granted"} icon={<Camera size={12} />} label={cameraState === "granted" ? "Camera on" : "Camera off"} />
                  <StatusPill T={T} ok={supportsSpeech} icon={<Volume2 size={12} />} label={supportsSpeech ? "Voice support" : "No voice support"} />
                </div>
                {deviceCheckTranscript && (
                  <div className="ip-inset" style={{ padding: "10px 12px", marginBottom: 12, fontSize: 12, color: T.textSoft }}>
                    Heard: <em>{deviceCheckTranscript}</em>
                  </div>
                )}
                {showMandatoryWarning && (
                  <div className="ip-danger-box" style={{ marginBottom: 12 }}>Please enable both microphone and camera before starting.</div>
                )}
                <button className="ip-btn-primary ip-btn-full" onClick={beginInterview} disabled={!canBeginInterview || isBeginning} style={{ height: 46, fontSize: 14 }}>
                  {isBeginning ? <><Loader2 size={15} className="ip-spin" />Starting…</> : <>Begin Interview <ChevronRight size={15} /></>}
                </button>
              </div>
            </div>

            <div className="ip-card" style={{ padding: 28 }}>
              <div style={{ marginBottom: 24 }}>
                <div style={{ fontSize: 10, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.14em", color: T.accentText, marginBottom: 10 }}>Interview Briefing</div>
                <h2 style={{ margin: "0 0 10px", fontSize: 26, fontWeight: 700, letterSpacing: "-0.035em", lineHeight: 1.2 }}>Quick overview before we start</h2>
                <p style={{ margin: 0, fontSize: 14, lineHeight: 1.7, color: T.textSoft, maxWidth: 600 }}>
                  This interview follows a consistent, voice-first screening flow designed to evaluate communication, warmth, patience, and teaching presence.
                </p>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 20 }}>
                {BRIEFING_STEPS.map((step, idx) => {
                  const Icon = step.icon; const active = idx === briefingStep;
                  return (
                    <button key={step.title} onClick={() => setBriefingStep(idx)} className={active ? "ip-step-active" : "ip-step-inactive"}>
                      <div className={active ? "ip-step-icon-active" : "ip-step-icon-inactive"}>
                        <Icon size={18} color={T.accentText} />
                      </div>
                      <div style={{ textAlign: "left" }}>
                        <div style={{ fontSize: 13.5, fontWeight: 700, color: T.text, marginBottom: 4 }}>{step.title}</div>
                        <div style={{ fontSize: 12.5, lineHeight: 1.55, color: T.textSoft }}>{step.desc}</div>
                      </div>
                      <div style={{ marginLeft: "auto", fontSize: 10, color: T.textMuted, flexShrink: 0 }}>{idx + 1}/{BRIEFING_STEPS.length}</div>
                    </button>
                  );
                })}
              </div>
              <div className="ip-inset" style={{ padding: "16px 18px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                  <ShieldCheck size={14} color={T.accentText} />
                  <span style={{ fontSize: 12, fontWeight: 700, color: T.text }}>Interview rules</span>
                </div>
                <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 7 }}>
                  {["Stay visible in camera throughout the interview.", "If absent for more than 9 seconds, the interview ends automatically.", "Speak naturally and answer in your own words."].map((r) => (
                    <li key={r} style={{ display: "flex", alignItems: "flex-start", gap: 8, fontSize: 12.5, lineHeight: 1.5, color: T.textSoft }}>
                      <span style={{ width: 5, height: 5, borderRadius: "50%", background: T.accentText, marginTop: 6, flexShrink: 0 }} />{r}
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

  // ─── Interview screen ─────────────────────────────────────────────────────────
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: FONTS + css }} />
      <canvas ref={faceCanvasRef} style={{ display: "none" }} aria-hidden="true" />

      <div className="ip-shell" style={{ height: "100vh", display: "flex", flexDirection: "column", overflow: "hidden", position: "relative" }}>
        <div className="ip-grid" style={{ position: "absolute", inset: 0 }} />

        <header className="ip-topbar" style={{ flexShrink: 0, position: "relative", zIndex: 100 }}>
          <div className="ip-container ip-topbar-inner">
            <div className="ip-brand">
              <div className="ip-brandmark"><BrainCircuit size={16} /></div>
              <div>
                <div className="ip-brand-name">Cuemath</div>
                <div className="ip-brand-sub">Tutor Screening</div>
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: T.text }}>{candidateName}</div>
                {candidateEmail && <div style={{ fontSize: 11, color: T.textMuted }}>{candidateEmail}</div>}
              </div>
              <button className="ip-theme-btn" onClick={toggleTheme} aria-label="Toggle theme">
                {theme === "dark" ? <Sun size={15} /> : <Moon size={15} />}
              </button>
            </div>
          </div>
        </header>

        <div style={{ flex: 1, overflow: "hidden", position: "relative", zIndex: 1 }}>
          <div className="ip-container" style={{ height: "100%", display: "grid", gridTemplateColumns: "320px 1fr", gap: 20, padding: "20px 28px", alignItems: "stretch" }}>

            {/* Sidebar */}
            <aside style={{ display: "flex", flexDirection: "column", gap: 14, height: "100%", overflowY: "auto" }}>
              <div className="ip-card" style={{ padding: 18, flexShrink: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
                  <div style={{ width: 44, height: 44, borderRadius: 13, background: `linear-gradient(135deg,${T.accent},${T.accentAlt})`, display: "grid", placeItems: "center", color: "#fff", fontSize: 17, fontWeight: 800, boxShadow: `0 8px 20px ${T.accentRing}` }} className={isSpeaking ? "ip-maya-pulse" : ""}>M</div>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700, letterSpacing: "-0.025em", color: T.text }}>Maya</div>
                    <div style={{ fontSize: 11, color: T.textMuted }}>AI Interviewer · Cuemath</div>
                  </div>
                  <div style={{ marginLeft: "auto" }}>
                    <div className={isSpeaking ? "ip-chip-accent" : isListening ? "ip-chip-ok" : "ip-chip-neutral"}>
                      <span style={{ width: 6, height: 6, borderRadius: "50%", background: isSpeaking ? T.accentText : isListening ? T.success : "currentColor" }} />
                      {isSpeaking ? "Speaking" : isListening ? "Listening" : "Waiting"}
                    </div>
                  </div>
                </div>
                <div style={{ borderRadius: 10, overflow: "hidden", border: `1px solid ${T.border}`, aspectRatio: "16/9", background: T.inset }}>
                  {cameraState === "granted" ? (
                    <video ref={interviewVideoRef} autoPlay muted playsInline style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  ) : (
                    <div style={{ height: "100%", display: "grid", placeItems: "center" }}><Camera size={24} color={T.accentText} /></div>
                  )}
                </div>
              </div>

              <div className="ip-card" style={{ padding: 18, flexShrink: 0 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: T.text }}>Progress</span>
                  <span style={{ fontSize: 11, color: T.textMuted }}>{displayCount} / {TOTAL_Q}</span>
                </div>
                <div className="ip-progress-bg" style={{ marginBottom: 14 }}>
                  <div className="ip-progress-fill" style={{ width: `${progress}%` }} />
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
                  <StatusPill T={T} ok={micState === "granted"} icon={<Mic size={11} />} label={micState === "granted" ? "Mic on" : "Mic off"} />
                  <StatusPill T={T} ok={cameraState === "granted"} icon={<Camera size={11} />} label={cameraState === "granted" ? "Camera on" : "Camera off"} />
                </div>
              </div>

              <div className="ip-card" style={{ padding: 18, flexShrink: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                  <ShieldCheck size={13} color={T.accentText} />
                  <span style={{ fontSize: 11, fontWeight: 700, color: T.text }}>Interview rules</span>
                </div>
                <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 7 }}>
                  {["Stay visible in camera throughout.", "Absent 9s+ = auto-termination.", "Speak naturally in your own words."].map((r) => (
                    <li key={r} style={{ display: "flex", alignItems: "flex-start", gap: 7, fontSize: 11.5, lineHeight: 1.5, color: T.textSoft }}>
                      <span style={{ width: 4, height: 4, borderRadius: "50%", background: T.accentText, marginTop: 6, flexShrink: 0 }} />{r}
                    </li>
                  ))}
                </ul>
              </div>

              {faceAbsenceCountdown !== null && (
                <div className="ip-warn-box" style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
                  <AlertTriangle size={14} color={T.warning} style={{ flexShrink: 0, marginTop: 1 }} />
                  <span>Stay visible. Terminating in <strong>{faceAbsenceCountdown}s</strong></span>
                </div>
              )}
              {usingFallback && (
                <div className="ip-inset" style={{ padding: "10px 12px", fontSize: 11, color: T.textMuted }}>Fallback mode active — model unavailable.</div>
              )}
              {reportError && <div className="ip-warn-box">{reportError}</div>}
            </aside>

            {/* Chat panel */}
            <div className="ip-card" style={{ display: "flex", flexDirection: "column", overflow: "hidden" }}>
              <div style={{ padding: "16px 22px", borderBottom: `1px solid ${T.border}`, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16 }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, letterSpacing: "-0.02em", color: T.text }}>Live Interview</div>
                  <div style={{ fontSize: 12, color: T.textSoft, marginTop: 2 }}>Speak naturally — Maya will guide you through each question.</div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
                  <button
                    className={isListening ? "ip-btn-danger" : "ip-btn-primary"}
                    style={{ height: 36, fontSize: 12, opacity: (isLoading || isSpeaking) ? 0.6 : 1 }}
                    onClick={isListening ? stopListening : startListening}
                    disabled={isLoading || isSpeaking || micState !== "granted"}
                  >
                    {isListening ? <><MicOff size={14} />Stop</> : <><Mic size={14} />Listen</>}
                  </button>
                </div>
              </div>

              <div style={{ flex: 1, overflowY: "auto", padding: "20px 22px" }}>
                <div style={{ display: "flex", flexDirection: "column", gap: 14, maxWidth: 900, margin: "0 auto" }}>
                  {messages.map((message, idx) => {
                    const isUser = message.role === "user";
                    return (
                      <div key={`${message.role}-${idx}`} style={{ display: "flex", justifyContent: isUser ? "flex-end" : "flex-start" }}>
                        <div className={isUser ? "ip-bubble-user" : "ip-bubble-ai"} style={{ maxWidth: "78%" }}>
                          <div className="ip-bubble-label">{isUser ? "You" : "Maya"}</div>
                          <div className="ip-bubble-text">{message.content}</div>
                        </div>
                      </div>
                    );
                  })}

                  {transcriptPreview && (
                    <div style={{ display: "flex", justifyContent: "flex-end" }}>
                      <div className="ip-bubble-user" style={{ maxWidth: "78%", opacity: 0.8 }}>
                        <div className="ip-bubble-label">You</div>
                        <div className="ip-bubble-text">{transcriptPreview}</div>
                      </div>
                    </div>
                  )}

                  {isLoading && (
                    <div style={{ display: "flex", justifyContent: "flex-start" }}>
                      <div className="ip-bubble-ai" style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <Loader2 size={16} color={T.accentText} className="ip-spin" />
                        <span style={{ fontSize: 13.5, color: T.textSoft }}>Maya is thinking…</span>
                      </div>
                    </div>
                  )}

                  <div ref={chatEndRef} />
                </div>
              </div>

              <div style={{ padding: "12px 22px", borderTop: `1px solid ${T.border}`, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ fontSize: 12.5, color: T.textSoft }}>
                  {micState === "granted"
                    ? "Voice mode — click Listen to respond when Maya finishes speaking."
                    : "Microphone access required to participate."}
                </span>
                <div className={isSpeaking ? "ip-chip-accent" : isListening ? "ip-chip-ok" : "ip-chip-neutral"}>
                  <span style={{ width: 6, height: 6, borderRadius: "50%", background: isSpeaking ? T.accentText : isListening ? T.success : "currentColor" }} />
                  {isSpeaking ? "Maya speaking" : isListening ? "Listening" : "Waiting"}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}