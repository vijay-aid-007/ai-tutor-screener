"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Loader2, Mic, MicOff, Send, Sparkles,
  Volume2, CheckCircle, Clock, MessageSquare, BarChart2
} from "lucide-react";

// ─── Constants ────────────────────────────────────────────────────────────────
const SILENCE_MS = 4000;
const TOTAL_Q    = 6;

// ─── Types ────────────────────────────────────────────────────────────────────
interface Message { role: "user" | "assistant"; content: string; }

declare global {
  interface Window {
    SpeechRecognition?: new () => BSR;
    webkitSpeechRecognition?: new () => BSR;
  }
}

interface BSR {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  onresult: ((e: BSREvent) => void) | null;
  onend:    (() => void) | null;
  onerror:  ((e: BSRError) => void) | null;
}

interface BSREvent {
  resultIndex: number;
  results: { length: number; [i: number]: { isFinal: boolean; 0: { transcript: string } } };
}

interface BSRError { error?: string; }

// ─── Fallback WITH acknowledgement ───────────────────────────────────────────
const FALLBACK = (name: string) => [
  `Hi ${name}, it's so lovely to meet you! To kick things off, could you tell me a little about yourself and what drew you to tutoring?`,
  `Thank you for sharing that — it really helps me understand your background. I'd love to know: how would you explain a difficult concept to a young student who's confused?`,
  `That's a really thoughtful approach — using visuals and examples like that can make such a difference. Now, imagine a student has been stuck for 5 minutes and wants to give up. What do you do in that moment?`,
  `I love that — staying calm and encouraging really matters. How do you keep a child engaged when they're clearly bored or distracted?`,
  `That shows real creativity as a tutor. One more — what does patience genuinely mean to you, day to day, when working with students?`,
  `${name}, thank you so much — I've really enjoyed our conversation today. We'll be in touch soon with next steps. Best of luck, I'm rooting for you!`,
];

const fallbackReply = (count: number, name: string) =>
  FALLBACK(name)[Math.min(count, FALLBACK(name).length - 1)];

const isQuotaError = (m: string) => {
  const s = m.toLowerCase();
  return s.includes("quota") || s.includes("429") || s.includes("503") ||
         s.includes("unavailable") || s.includes("resource_exhausted");
};

// ─── Colors ───────────────────────────────────────────────────────────────────
const C = {
  page:            "bg-[#081120] text-white",
  header:          "bg-[#0A1324]/90 border-white/10",
  card:            "bg-[#101A2D] border-white/10",
  panel:           "bg-[#0C1628] border-white/10",
  bubbleAssistant: "bg-[#111C31] border-white/10 text-white",
  bubbleUser:      "bg-violet-600 text-white",
  textSoft:        "text-white/60",
  textMuted:       "text-white/45",
  input:           "bg-[#091321] border-white/10 text-white placeholder:text-white/30",
  actionSecondary: "bg-white/5 hover:bg-white/10 border-white/10",
  actionDanger:    "bg-red-500 hover:bg-red-400",
  progressBg:      "bg-white/10",
  footer:          "border-white/10",
};

// ─── Briefing steps ───────────────────────────────────────────────────────────
const BRIEFING_STEPS = [
  {
    icon: MessageSquare,
    title: "Natural conversation",
    desc: "I'll ask you 6 thoughtful questions. Answer naturally — like you're talking to a colleague, not filling a form.",
  },
  {
    icon: Clock,
    title: "About 8–10 minutes",
    desc: "The interview is short and focused. There are no trick questions — I'm here to understand how you think and communicate.",
  },
  {
    icon: Mic,
    title: "Speak or type",
    desc: "You can speak your answers (recommended) or type them. If using voice, I'll auto-detect when you've finished speaking.",
  },
  {
    icon: BarChart2,
    title: "Instant assessment",
    desc: "Right after we finish, you'll get a detailed report scoring you across 5 dimensions with specific feedback.",
  },
  {
    icon: CheckCircle,
    title: "Be yourself",
    desc: "There are no perfect answers. I'm looking for warmth, clarity, and genuine care for students — not scripted responses.",
  },
];

// ─── Component ────────────────────────────────────────────────────────────────
export default function InterviewPage() {
  const router = useRouter();

  const chatEndRef         = useRef<HTMLDivElement | null>(null);
  const recognitionRef     = useRef<BSR | null>(null);
  const silenceTimerRef    = useRef<ReturnType<typeof setTimeout> | null>(null);
  const sendMessageRef     = useRef<(t: string) => Promise<void>>(() => Promise.resolve());
  const finalTranscriptRef = useRef<string>("");
  const isListeningRef     = useRef(false);

  const [screen, setScreen]                   = useState<"briefing"|"interview">("briefing");
  const [briefingStep, setBriefingStep]       = useState(0);
  const [mayaIntroPlayed, setMayaIntroPlayed] = useState(false);

  const [messages,          setMessages]          = useState<Message[]>([]);
  const [candidateName,     setCandidateName]     = useState("Candidate");
  const [candidateEmail,    setCandidateEmail]    = useState("");
  const [inputText,         setInputText]         = useState("");
  const [transcriptPreview, setTranscriptPreview] = useState("");
  const [isListening,       setIsListening]       = useState(false);
  const [isSpeaking,        setIsSpeaking]        = useState(false);
  const [isLoading,         setIsLoading]         = useState(false);
  const [interviewDone,     setInterviewDone]     = useState(false);
  const [questionCount,     setQuestionCount]     = useState(1);
  const [usingFallback,     setUsingFallback]     = useState(false);
  const [reportError,       setReportError]       = useState("");
  const [micState,          setMicState]          = useState<"idle"|"requesting"|"granted"|"denied">("idle");
  const [supportsSpeech,    setSupportsSpeech]    = useState(false);

  const displayCount = Math.min(questionCount, TOTAL_Q);
  const progress     = Math.min((questionCount / TOTAL_Q) * 100, 100);

  // ─── Init ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    const name  = localStorage.getItem("candidate_name")  || "Candidate";
    const email = localStorage.getItem("candidate_email") || "";
    setCandidateName(name);
    setCandidateEmail(email);
    const has = typeof window !== "undefined" &&
      (!!window.SpeechRecognition || !!window.webkitSpeechRecognition);
    setSupportsSpeech(has);
  }, []);

  useEffect(() => { sendMessageRef.current = sendMessage; });

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, transcriptPreview, isLoading]);

  // ─── Play Maya intro voice on briefing screen ──────────────────────────────
  useEffect(() => {
    if (screen === "briefing" && !mayaIntroPlayed && candidateName !== "Candidate") {
      const intro = `Hi ${candidateName}! I'm Maya, your AI interviewer from Cuemath. Before we begin, let me quickly walk you through how this works. Take a moment to read through the steps, and whenever you're ready, click Begin Interview. There's no rush — I'm looking forward to our conversation!`;
      setTimeout(() => {
        void speak(intro);
        setMayaIntroPlayed(true);
      }, 800);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [screen, candidateName]);

  const parseJson = async (res: Response) => {
    const raw = await res.text();
    try   { return JSON.parse(raw); }
    catch { throw new Error(`Bad response: ${raw.slice(0, 100)}`); }
  };

  // ─── ✅ Sweet, slow, warm voice ────────────────────────────────────────────
  const speak = useCallback((text: string): Promise<void> => {
    return new Promise((resolve) => {
      if (typeof window === "undefined" || !window.speechSynthesis) {
        resolve(); return;
      }
      window.speechSynthesis.cancel();

      const u   = new SpeechSynthesisUtterance(text);
      u.rate    = 0.82;  // ✅ noticeably slower — warm and deliberate
      u.pitch   = 1.38;   // ✅ higher pitch — sweet and friendly
      u.volume  = 1;

      const assignVoice = () => {
        const voices = window.speechSynthesis.getVoices();
        const v =
          voices.find(v => v.name === "Microsoft Jenny Online (Natural) - English (United States)") ||
          voices.find(v => v.name === "Microsoft Aria Online (Natural) - English (United States)")  ||
          voices.find(v => v.name === "Microsoft Zira - English (United States)")              ||
          voices.find(v => /jenny|aria|zira|samantha/i.test(v.name))                           ||
          voices.find(v => /google uk english female/i.test(v.name))                           ||
          voices.find(v => /female|woman/i.test(v.name))                                       ||
          voices.find(v => v.lang.startsWith("en"))                                            ||
          null;
        if (v) { u.voice = v; console.log("🎙️ Voice:", v.name); }
      };

      if (window.speechSynthesis.getVoices().length > 0) assignVoice();
      else window.speechSynthesis.onvoiceschanged = assignVoice;

      u.onstart = () => setIsSpeaking(true);
      u.onend   = () => { setIsSpeaking(false); resolve(); };
      u.onerror = () => { setIsSpeaking(false); resolve(); };
      window.speechSynthesis.speak(u);
    });
  }, []);

  // ─── Mic permission ────────────────────────────────────────────────────────
  const requestMicPermission = async () => {
    setMicState("requesting");
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });
      setMicState("granted");
    } catch {
      setMicState("denied");
    }
  };

  // ─── Start listening ───────────────────────────────────────────────────────
  const startListening = useCallback(() => {
    if (typeof window === "undefined") return;
    if (micState !== "granted") return;
    if (isListeningRef.current) return;

    const SpeechAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechAPI) return;

    finalTranscriptRef.current = "";
    setTranscriptPreview("");
    if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);

    const rec          = new SpeechAPI();
    rec.continuous     = true;
    rec.interimResults = true;
    rec.lang           = "en-IN";

    rec.onresult = (e: BSREvent) => {
      let newFinal = "";
      let interim  = "";
      for (let i = 0; i < e.results.length; i++) {
        if (e.results[i].isFinal) newFinal += e.results[i][0].transcript + " ";
        else interim += e.results[i][0].transcript;
      }
      if (newFinal.trim()) finalTranscriptRef.current = newFinal.trim();
      const display = (finalTranscriptRef.current + " " + interim).trim();
      if (display) setTranscriptPreview(display);
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
      const toSubmit = finalTranscriptRef.current || display;
      if (toSubmit) {
        silenceTimerRef.current = setTimeout(() => {
          rec.stop();
          isListeningRef.current = false;
          setIsListening(false);
          void sendMessageRef.current(toSubmit);
        }, SILENCE_MS);
      }
    };

    rec.onerror = (e: BSRError) => {
      isListeningRef.current = false;
      setIsListening(false);
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
      if (e?.error === "aborted") return;
      if (e?.error === "not-allowed") setMicState("denied");
    };

    rec.onend = () => {
      isListeningRef.current = false;
      setIsListening(false);
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
    };

    recognitionRef.current = rec;
    rec.start();
    isListeningRef.current = true;
    setIsListening(true);
  }, [micState]);

  const stopListening = useCallback(() => {
    if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
    recognitionRef.current?.stop();
    isListeningRef.current = false;
    setIsListening(false);
    const captured = (finalTranscriptRef.current || transcriptPreview).trim();
    if (captured) setTimeout(() => void sendMessageRef.current(captured), 300);
  }, [transcriptPreview]);

  // ─── Generate report ───────────────────────────────────────────────────────
  const generateReport = useCallback(async (finalMessages: Message[]) => {
    const transcript = finalMessages
      .map(m => `${m.role === "user" ? "Candidate" : "Maya"}: ${m.content}`)
      .join("\n\n");
    localStorage.setItem("interview_transcript", transcript);
    localStorage.setItem("interview_messages",   JSON.stringify(finalMessages));
    const tryAssess = async () => {
      const res  = await fetch("/api/assess", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transcript, candidateName }),
      });
      const data = await parseJson(res);
      localStorage.setItem("assessment_result", JSON.stringify(data));
      router.push("/report");
    };
    try { await tryAssess(); }
    catch {
      setReportError("Generating report... please wait.");
      setTimeout(async () => {
        try { await tryAssess(); }
        catch { setReportError("Report failed. Please refresh."); }
      }, 3000);
    }
  }, [candidateName, router]);

  // ─── Send message ──────────────────────────────────────────────────────────
  // eslint-disable-next-line react-hooks/exhaustive-deps
  async function sendMessage(text: string) {
    const trimmed = text.trim();
    if (!trimmed || isLoading || interviewDone) return;
    const userMsg: Message = { role: "user", content: trimmed };
    const updated          = [...messages, userMsg];
    setMessages(updated);
    setInputText("");
    setTranscriptPreview("");
    finalTranscriptRef.current = "";
    setIsLoading(true);
    try {
      const res  = await fetch("/api/chat", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: updated, candidateName }),
      });
      const data = await parseJson(res);
      if (!res.ok || !data?.text) throw new Error(data?.error || "unavailable");
      const aiMsg: Message = { role: "assistant", content: data.text };
      const final          = [...updated, aiMsg];
      const nextCount      = questionCount + 1;
      setMessages(final);
      setQuestionCount(nextCount);
      await speak(data.text);
      if (data.isComplete || nextCount >= TOTAL_Q) {
        setInterviewDone(true);
        setTimeout(() => void generateReport(final), 1200);
      } else if (micState === "granted") {
        setTimeout(() => startListening(), 500);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (!isQuotaError(msg)) console.error("sendMessage:", err);
      const nextCount      = questionCount + 1;
      const fb             = fallbackReply(nextCount - 1, candidateName);
      const aiMsg: Message = { role: "assistant", content: fb };
      const final          = [...updated, aiMsg];
      setMessages(final);
      setQuestionCount(nextCount);
      setUsingFallback(true);
      await speak(fb);
      if (nextCount >= TOTAL_Q) {
        setInterviewDone(true);
        setTimeout(() => void generateReport(final), 1200);
      } else if (micState === "granted") {
        setTimeout(() => startListening(), 500);
      }
    } finally {
      setIsLoading(false);
    }
  }

  // ─── Begin interview ───────────────────────────────────────────────────────
  const beginInterview = async () => {
    window.speechSynthesis?.cancel();
    setScreen("interview");
    setIsLoading(true);
    const initial: Message[] = [{ role: "user", content: `Hi, my name is ${candidateName}.` }];
    try {
      const res  = await fetch("/api/chat", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: initial, candidateName }),
      });
      const data = await parseJson(res);
      if (!res.ok || !data?.text) throw new Error(data?.error || "unavailable");
      setMessages([...initial, { role: "assistant", content: data.text }]);
      setQuestionCount(1);
      await speak(data.text);
      if (micState === "granted") setTimeout(() => startListening(), 500);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (!isQuotaError(msg)) console.error("beginInterview:", err);
      const fb = fallbackReply(0, candidateName);
      setMessages([...initial, { role: "assistant", content: fb }]);
      setQuestionCount(1);
      setUsingFallback(true);
      await speak(fb);
      if (micState === "granted") setTimeout(() => startListening(), 500);
    } finally {
      setIsLoading(false);
    }
  };

  // ══════════════════════════════════════════════════════════════════════════
  // BRIEFING SCREEN
  // ══════════════════════════════════════════════════════════════════════════
  if (screen === "briefing") {
    return (
      <div className={`min-h-screen ${C.page} flex flex-col`}>

        {/* Header */}
        <header className={`border-b backdrop-blur-md ${C.header}`}>
          <div className="mx-auto flex max-w-4xl items-center justify-between px-5 py-4">
            <div className="flex items-center gap-3">
              <div className={`flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-fuchsia-400 text-sm font-semibold text-white ${isSpeaking ? "speaking-animation" : ""}`}>
                M
              </div>
              <div>
                <p className="text-sm font-semibold text-white">Maya · AI Interviewer</p>
                <p className="text-xs text-violet-400">Cuemath Tutor Screener</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-white/70">{candidateName}</p>
              <p className="text-xs text-white/40">{candidateEmail}</p>
            </div>
          </div>
        </header>

        <main className="flex-1 mx-auto w-full max-w-4xl px-5 py-10">

          {/* Maya intro card */}
          <div className={`rounded-[28px] border p-8 mb-6 ${C.card}`}>
            <div className="flex items-start gap-5">
              <div className={`flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-fuchsia-400 text-2xl font-bold text-white shadow-lg ${isSpeaking ? "speaking-animation" : ""}`}>
                M
              </div>
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <p className="text-lg font-semibold text-white">Hi {candidateName}, I'm Maya! 👋</p>
                  {isSpeaking && (
                    <div className="flex items-end gap-0.5">
                      {[1,2,3,4,3].map((_, i) => (
                        <div key={i} className="w-0.5 rounded-full bg-violet-400 waveform-bar"
                          style={{ animationDelay: `${i * 0.1}s` }} />
                      ))}
                    </div>
                  )}
                </div>
                <p className={`text-sm leading-7 ${C.textSoft}`}>
                  I'm your AI interviewer for Cuemath today. This is a short, conversational screening — 
                  not a test. I want to understand how you think, how you communicate, and how you'd 
                  connect with students. Read through how this works below, then we'll get started 
                  whenever you're ready.
                </p>
              </div>
            </div>
          </div>

          {/* How it works */}
          <div className={`rounded-[28px] border p-8 mb-6 ${C.card}`}>
            <h2 className="text-base font-semibold text-white mb-5">
              How this interview works
            </h2>
            <div className="space-y-4">
              {BRIEFING_STEPS.map((step, i) => {
                const Icon = step.icon;
                const isActive = briefingStep >= i;
                return (
                  <div
                    key={i}
                    className={`flex items-start gap-4 rounded-2xl border p-4 transition-all duration-300
                      ${isActive
                        ? "border-violet-400/30 bg-violet-400/5"
                        : `${C.panel} opacity-50`}`}
                  >
                    <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl
                      ${isActive ? "bg-violet-500/20" : "bg-white/5"}`}>
                      <Icon size={18} className={isActive ? "text-violet-400" : "text-white/30"} />
                    </div>
                    <div>
                      <p className={`text-sm font-semibold ${isActive ? "text-white" : "text-white/30"}`}>
                        {step.title}
                      </p>
                      <p className={`text-sm mt-0.5 leading-6 ${isActive ? C.textSoft : "text-white/20"}`}>
                        {step.desc}
                      </p>
                    </div>
                    {isActive && i === briefingStep && (
                      <div className="ml-auto shrink-0">
                        <div className="h-2 w-2 rounded-full bg-violet-400 animate-pulse" />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Step through button */}
            {briefingStep < BRIEFING_STEPS.length - 1 && (
              <button
                onClick={() => setBriefingStep(s => s + 1)}
                className="mt-5 text-sm text-violet-400 hover:text-violet-300 transition underline underline-offset-4"
              >
                Next →
              </button>
            )}
          </div>

          {/* Mic setup */}
          {supportsSpeech && briefingStep >= 2 && (
            <div className={`rounded-[28px] border p-6 mb-6 ${C.card}`}>
              <h2 className="text-sm font-semibold text-white mb-4">
                Set up your microphone
              </h2>
              {micState === "idle" && (
                <button
                  onClick={requestMicPermission}
                  className="w-full flex items-center justify-center gap-3 rounded-2xl border border-violet-400/30 bg-violet-400/10 px-5 py-4 text-sm font-medium text-violet-300 hover:bg-violet-400/20 transition"
                >
                  <Mic size={18} />
                  Enable microphone for hands-free interview
                </button>
              )}
              {micState === "requesting" && (
                <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-5 py-4 text-sm text-white/60">
                  <Loader2 size={16} className="animate-spin text-violet-400" />
                  Waiting for permission...
                </div>
              )}
              {micState === "granted" && (
                <div className="flex items-center gap-3 rounded-2xl border border-emerald-400/20 bg-emerald-400/10 px-5 py-4 text-sm text-emerald-300">
                  <CheckCircle size={16} />
                  Microphone ready — hands-free mode enabled
                </div>
              )}
              {micState === "denied" && (
                <div className="rounded-2xl border border-amber-400/20 bg-amber-400/10 px-5 py-4 text-sm text-amber-300">
                  Mic not available — you can still type your answers
                </div>
              )}
            </div>
          )}

          {/* CTA */}
          {briefingStep >= BRIEFING_STEPS.length - 1 && (
            <button
              onClick={beginInterview}
              className="w-full rounded-2xl bg-gradient-to-r from-violet-600 to-fuchsia-500 hover:from-violet-500 hover:to-fuchsia-400 px-8 py-5 text-base font-semibold text-white shadow-lg transition-all hover:scale-[1.01] active:scale-[0.99]"
            >
              I'm ready — Begin Interview with Maya 🎙️
            </button>
          )}

          <p className={`text-center text-xs mt-4 ${C.textMuted}`}>
            By continuing you agree that this interview may be used for hiring assessment purposes.
          </p>
        </main>
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════════════════════
  // INTERVIEW SCREEN
  // ══════════════════════════════════════════════════════════════════════════
  return (
    <div className={`min-h-screen ${C.page}`}>

      {/* Header */}
      <header className={`sticky top-0 z-20 border-b backdrop-blur-md ${C.header}`}>
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4">
          <div className="flex items-center gap-4">
            <div className={`flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-fuchsia-400 text-sm font-semibold text-white shadow-lg ${isSpeaking ? "speaking-animation" : ""}`}>
              M
            </div>
            <div>
              <p className="text-sm font-semibold text-white">Maya · AI Interviewer</p>
              <div className="mt-1 flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-xs text-emerald-400">
                  {usingFallback ? "Guided interview" : "Live interview in progress"}
                </span>
              </div>
            </div>
          </div>
          <div className="text-right">
            <p className={`text-sm font-medium ${C.textSoft}`}>{candidateName}</p>
            <p className={`text-xs ${C.textMuted}`}>{candidateEmail || "Candidate"}</p>
          </div>
        </div>
        <div className={`h-1 w-full ${C.progressBg}`}>
          <div
            className="h-full bg-gradient-to-r from-violet-500 to-fuchsia-400 transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </header>

      <main className="mx-auto grid max-w-6xl gap-6 px-5 py-6 lg:grid-cols-[0.95fr_1.05fr]">

        {/* Left panel */}
        <section className={`rounded-[28px] border p-6 md:p-7 ${C.card}`}>
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-violet-400/20 bg-violet-400/10 px-3 py-1 text-xs font-medium text-violet-300">
                {usingFallback ? "Guided assessment" : "Live AI assessment"}
              </div>
              <h1 className="mt-4 text-2xl font-semibold leading-tight text-white md:text-3xl">
                Tutor communication interview
              </h1>
              <p className={`mt-3 max-w-md text-sm leading-7 ${C.textSoft}`}>
                Respond naturally. Maya acknowledges your answers and asks one question at a time.
              </p>
            </div>
            <div className={`shrink-0 rounded-2xl border px-4 py-3 text-right ${C.panel}`}>
              <p className="text-xs uppercase tracking-widest text-violet-300">Progress</p>
              <p className="mt-1 text-2xl font-semibold text-white">{displayCount} / {TOTAL_Q}</p>
            </div>
          </div>

          {/* Status card */}
          <div className={`mt-5 rounded-2xl border p-5 ${C.panel}`}>
            <div className="flex items-start gap-4">
              <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-fuchsia-400 font-semibold text-white ${isSpeaking ? "speaking-animation" : ""}`}>
                M
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-white">Interviewer status</p>
                <p className={`mt-1 text-sm ${C.textSoft}`}>
                  {isLoading   ? "Thinking of a response..."   :
                   isSpeaking  ? "Maya is speaking..."          :
                   isListening ? "Listening to you..."          :
                                 "Awaiting your response"}
                </p>
                {isListening && transcriptPreview && (
                  <p className="mt-1 text-xs text-violet-400">
                    ⏱ Auto-submits after {SILENCE_MS/1000}s silence
                  </p>
                )}
                {isSpeaking && (
                  <div className="mt-3 flex items-end gap-1">
                    {[1,2,3,4,5,4,3].map((_, i) => (
                      <div key={i} className="w-1 rounded-full bg-violet-400 waveform-bar"
                        style={{ animationDelay: `${i * 0.08}s` }} />
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {micState === "granted" && (
            <div className="mt-4 flex items-center gap-2 rounded-2xl border border-emerald-400/20 bg-emerald-400/10 px-4 py-2.5 text-xs text-emerald-300">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Hands-free mode active
            </div>
          )}

          {reportError && interviewDone && (
            <div className="mt-5 rounded-2xl border border-amber-400/20 bg-amber-400/10 p-4 text-sm text-amber-300">
              {reportError}
            </div>
          )}

          {interviewDone && (
            <div className={`mt-5 rounded-2xl border p-5 text-center ${C.panel}`}>
              <p className="text-lg font-semibold text-white">🎉 Interview complete!</p>
              <p className={`mt-2 text-sm ${C.textSoft}`}>Generating your assessment report...</p>
              <Loader2 size={20} className="text-violet-400 animate-spin mx-auto mt-3" />
            </div>
          )}
        </section>

        {/* Right — Chat */}
        <section className={`flex flex-col rounded-[28px] border p-6 md:p-7 ${C.card}`}>
          <div className="flex-1 space-y-4 overflow-y-auto">
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[82%] rounded-2xl border px-4 py-3 text-sm leading-7
                  ${msg.role === "assistant"
                    ? C.bubbleAssistant + " rounded-tl-sm"
                    : C.bubbleUser + " border-transparent rounded-tr-sm"}`}>
                  <div className="mb-1 flex items-center gap-2 text-xs font-medium opacity-70">
                    {msg.role === "assistant" ? <><Sparkles size={12} />Maya</> : <>You</>}
                  </div>
                  {msg.content}
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex justify-start">
                <div className={`rounded-2xl border px-4 py-3 ${C.bubbleAssistant}`}>
                  <div className="flex items-center gap-2 text-sm">
                    <Loader2 size={15} className="animate-spin" /> Maya is thinking...
                  </div>
                </div>
              </div>
            )}

            {isSpeaking && !isLoading && (
              <div className="flex justify-start">
                <div className={`rounded-2xl border px-4 py-3 ${C.bubbleAssistant}`}>
                  <div className="flex items-center gap-2 text-sm">
                    <Volume2 size={15} /> Maya is speaking...
                  </div>
                </div>
              </div>
            )}

            {transcriptPreview && (
              <div className="flex justify-end">
                <div className="max-w-[82%] rounded-2xl border border-violet-400/20 bg-violet-400/10 px-4 py-3 text-sm text-violet-200 rounded-tr-sm">
                  <div className="mb-1 text-xs opacity-60">
                    🎙 Recording · submits after {SILENCE_MS/1000}s silence
                  </div>
                  {transcriptPreview}
                </div>
              </div>
            )}

            <div ref={chatEndRef} />
          </div>

          {!interviewDone && (
            <div className={`mt-6 border-t pt-5 ${C.footer}`}>
              <div className="flex gap-3">
                <input
                  type="text"
                  value={inputText}
                  onChange={e => setInputText(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter") void sendMessage(inputText); }}
                  placeholder={isListening ? "Listening... speak freely" : "Type your response..."}
                  disabled={isLoading || isListening}
                  className={`h-14 flex-1 rounded-2xl border px-4 outline-none transition focus:border-violet-500 disabled:opacity-50 ${C.input}`}
                />
                <button
                  onClick={() => void sendMessage(inputText)}
                  disabled={!inputText.trim() || isLoading}
                  className="flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-600 text-white hover:bg-violet-500 disabled:opacity-40 disabled:cursor-not-allowed transition"
                >
                  <Send size={18} />
                </button>
                {micState === "granted" && (
                  <button
                    onClick={isListening ? stopListening : startListening}
                    disabled={isLoading || isSpeaking}
                    className={`flex h-14 items-center justify-center gap-2 rounded-2xl border px-4 text-sm font-medium transition disabled:opacity-40 disabled:cursor-not-allowed
                      ${isListening
                        ? C.actionDanger + " border-transparent text-white"
                        : C.actionSecondary}`}
                  >
                    {isListening ? <><MicOff size={17} /> Stop</> : <><Mic size={17} /> Mic</>}
                  </button>
                )}
              </div>
              <p className={`mt-3 text-xs ${C.textMuted}`}>
                {micState === "granted"
                  ? isListening
                    ? `🔴 Recording · auto-submits after ${SILENCE_MS/1000}s silence`
                    : "🎤 Click Mic to speak · or type below"
                  : "💬 Type your response and press Enter"}
              </p>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}