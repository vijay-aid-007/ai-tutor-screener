import { NextRequest, NextResponse } from "next/server";

const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";
const MODELS = ["llama-3.3-70b-versatile", "llama-3.1-8b-instant"];
const MODEL_TIMEOUT_MS = 8000;
const MAX_MESSAGES = 16;
const MAX_CONTENT_LENGTH = 4000;
const MAX_NAME_LENGTH = 80;

// FIX: Changed from 0 to 1.
// retryCount=0 (first time) → acknowledge the candidate's response and RE-ASK same question
// retryCount=1 (second time, same bad/casual response) → advance to next question
// This applies to: silence (no response), casual greetings, non-answers, short/vague answers
const MAX_RETRIES_PER_QUESTION = 1;

type ChatRole = "user" | "assistant";

type ChatMessage = {
  role: ChatRole;
  content: string;
};

type InterviewStage =
  | "intro"
  | "simplify"
  | "stuck_student"
  | "engagement"
  | "patience"
  | "closing";

type LastAnswerProfile = {
  raw: string;
  wordCount: number;
  isVeryShort: boolean;
  isShort: boolean;
  isLong: boolean;
  isVeryLong: boolean;
  hasExample: boolean;
  hasTeachingLanguage: boolean;
  hasConcreteAction: boolean;
  soundsVague: boolean;
  isNonAnswer: boolean;
  isConfusion: boolean;
};

type InterviewState = {
  askedMainQuestions: number;
  currentStage: InterviewStage;
  followUpAction: "retry_same" | "advance" | null;
  followUpReason:
    | "non_answer"
    | "short"
    | "vague"
    | "tangent"
    | "off_topic"
    | "wants_skip"
    | null;
  retriesOnCurrentQuestion: number;
};

type NormalizedRequestBody = {
  messages: ChatMessage[];
  candidateName: string;
  clientQuestionCount?: number;
  // FIX: Frontend now sends how many times it has retried THIS question.
  // 0 = first attempt → re-ask (acknowledge + same question)
  // 1+ = already retried once → advance to next question
  clientRetryCount: number;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function sanitize(text: string): string {
  return text
    .replace(/\s+/g, " ")
    .replace(/^[,.\-–—:;]+\s*/, "")
    .replace(/\s*[,.\-–—:;]+$/, "")
    .trim();
}

function isValidRole(role: unknown): role is ChatRole {
  return role === "user" || role === "assistant";
}

function normalizeCandidateName(input: unknown): string {
  if (typeof input !== "string") return "Candidate";
  const clean = sanitize(input).slice(0, MAX_NAME_LENGTH);
  return clean || "Candidate";
}

function normalizeMessages(input: unknown): ChatMessage[] {
  if (!Array.isArray(input)) throw new Error("Invalid messages payload");
  const normalized: ChatMessage[] = [];
  for (const item of input) {
    if (!item || typeof item !== "object") continue;
    const role = (item as { role?: unknown }).role;
    const content = (item as { content?: unknown }).content;
    if (!isValidRole(role)) continue;
    if (typeof content !== "string") continue;
    const cleanContent = sanitize(content).slice(0, MAX_CONTENT_LENGTH);
    if (!cleanContent) continue;
    normalized.push({ role, content: cleanContent });
  }
  if (normalized.length === 0) throw new Error("messages required");
  return trimMessages(normalized, MAX_MESSAGES);
}

function normalizeClientQuestionCount(input: unknown): number | undefined {
  if (typeof input === "number" && Number.isInteger(input) && input >= 0 && input <= 6) {
    return input;
  }
  return undefined;
}

// FIX: Parse retryCount sent from the frontend
function normalizeClientRetryCount(input: unknown): number {
  if (typeof input === "number" && Number.isInteger(input) && input >= 0 && input <= 10) {
    return input;
  }
  return 0;
}

function getSafeRequestBody(body: unknown): NormalizedRequestBody {
  if (!body || typeof body !== "object") throw new Error("Invalid request body");
  const data = body as { messages?: unknown; candidateName?: unknown; questionCount?: unknown; retryCount?: unknown };
  return {
    messages: normalizeMessages(data.messages),
    candidateName: normalizeCandidateName(data.candidateName),
    clientQuestionCount: normalizeClientQuestionCount(data.questionCount),
    clientRetryCount: normalizeClientRetryCount(data.retryCount),
  };
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  try { return JSON.stringify(error); } catch { return String(error); }
}

function isQuotaError(message: string) {
  const m = message.toLowerCase();
  return m.includes("429") || m.includes("rate_limit") || m.includes("quota") ||
    m.includes("too many requests") || m.includes("rate limit");
}

function isTemporaryError(message: string) {
  const m = message.toLowerCase();
  return m.includes("503") || m.includes("unavailable") || m.includes("timeout") ||
    m.includes("network") || m.includes("fetch failed");
}

function isTimeoutError(message: string) {
  return message.startsWith("model_timeout_");
}

function isValidOrigin(req: NextRequest): boolean {
  const origin = req.headers.get("origin");
  if (process.env.NODE_ENV !== "production") return true;
  if (!origin) return false;
  const host = req.headers.get("host") ?? "";
  const allowed = (process.env.ALLOWED_ORIGINS ?? "").split(",").map((s) => s.trim()).filter(Boolean);
  try {
    const originHost = new URL(origin).host;
    return originHost === host || allowed.includes(origin);
  } catch { return false; }
}

function trimMessages(messages: ChatMessage[], maxMessages = 16): ChatMessage[] {
  if (messages.length <= maxMessages) return messages;
  const anchor = messages.slice(0, 2);
  const rest = messages.slice(2);
  const trimmed = rest.slice(-(maxMessages - 2));
  return [...anchor, ...trimmed];
}

function isWantsToSkip(text: string): boolean {
  const t = text.toLowerCase();
  return (
    t.includes("next question") || t.includes("move to next") || t.includes("move on") ||
    t.includes("let's move") || t.includes("lets move") || t.includes("skip this") ||
    t.includes("skip it") || t.includes("can we move") || t.includes("go to next") ||
    t.includes("next one") || t.includes("pass this") || t.includes("agle question") ||
    t.includes("next pe jao") || t.includes("next question pe") ||
    (t.includes("move") && t.includes("question")) ||
    (t.includes("next") && t.length <= 10)
  );
}

function isCasualChat(text: string): boolean {
  const t = text.toLowerCase();
  return (
    t.includes("how are you") || t.includes("how is your day") || t.includes("how's your day") ||
    t.includes("how are you doing") || t.includes("how do you do") || t.includes("you doing") ||
    t.includes("are you okay") || t.includes("are you good") || t.includes("what's up") ||
    t.includes("whats up") || t.includes("sup maya") || t.includes("hello maya") ||
    t.includes("hi maya") || t.includes("good morning") || t.includes("good afternoon") ||
    t.includes("good evening") || t.includes("nice to meet") || t.includes("pleased to meet") ||
    (t.startsWith("how are") && t.length < 20)
  );
}

function isAskingForClarification(text: string): boolean {
  const t = text.toLowerCase();
  return (
    t.includes("what do you mean") || t.includes("can you explain") || t.includes("explain me") ||
    t.includes("explain a bit") || t.includes("more detail") || t.includes("more details") ||
    t.includes("what should i") || t.includes("what kind of answer") || t.includes("how should i answer") ||
    t.includes("means what") || t.includes("matlab kya") || t.includes("kya bolun") ||
    t.includes("what to say") || t.includes("what do i say") ||
    t.includes("i don't understand the question") || t.includes("i dont understand the question") ||
    t.includes("what exactly") || t.includes("can you rephrase") || t.includes("rephrase") || t.includes("clarify")
  );
}

function isOffTopic(text: string, currentStage: InterviewStage): boolean {
  const t = text.toLowerCase();
  const wc = t.split(/\s+/).filter(Boolean).length;
  const isSocialOnly =
    (t.includes("good morning") || t.includes("good evening") || t.includes("good afternoon") ||
      t.includes("nice to meet") || t.includes("pleased to meet") || t.includes("how are you") ||
      t.includes("how is your day") || t.includes("how's your day")) &&
    wc <= 12;
  // FIX: Off-topic check applies to ALL stages including intro.
  // Previously excluded intro stage, causing Maya to skip acknowledgment
  // when candidate gave a greeting as their first response.
  if (isSocialOnly) return true;
  return false;
}

// ─── Normalize apostrophes before fingerprint matching ───────────────────────
function normalizeApostrophes(text: string): string {
  return text
    .replace(/[\u2018\u2019\u201A\u201B\u2032\u2035]/g, "'")
    .replace(/[\u201C\u201D\u201E\u201F\u2033\u2036]/g, '"');
}

// ─── Retry counter ────────────────────────────────────────────────────────────
function countRetriesOnCurrentQuestion(messages: ChatMessage[], currentStage: InterviewStage): number {
  const newQuestionKeywords = [
    "what drew you to tutoring",
    "explaining fractions to a 9-year-old",
    "stuck on the same problem",
    "keep a child engaged and motivated",
    "what does patience genuinely mean",
    "we'll be in touch",
    "we will be in touch",
    "rooting for you",
  ];

  const retryKeywords = [
    "no pressure", "take your time", "share what you personally would do",
    "i'd love to hear", "let me bring us back", "that's completely okay",
    "a little bit more", "could you share", "tell me a bit more",
    "elaborate", "expand on", "just a bit more",
    "i'm doing", "i'm great", "doing wonderfully", "doing well, thank you",
    "thank you for asking",
  ];

  const currentQuestionFingerprint = normalizeApostrophes((() => {
    switch (currentStage) {
      case "intro": return "what drew you to tutoring";
      case "simplify": return "explaining fractions to a 9-year-old";
      case "stuck_student": return "stuck on the same problem";
      case "engagement": return "keep a child engaged and motivated";
      case "patience": return "what does patience genuinely mean";
      case "closing": return "we'll be in touch";
    }
  })());

  let retryCount = 0;
  let foundCurrentQuestion = false;

  for (let i = messages.length - 1; i >= 0; i--) {
    const m = messages[i];
    if (m.role !== "assistant") continue;

    const lower = normalizeApostrophes(m.content).toLowerCase();

    if (lower.includes(currentQuestionFingerprint)) {
      foundCurrentQuestion = true;
      break;
    }

    if (newQuestionKeywords.some((kw) => lower.includes(normalizeApostrophes(kw).toLowerCase()))) {
      break;
    }

    if (retryKeywords.some((kw) => lower.includes(kw))) {
      retryCount++;
    }
  }

  return foundCurrentQuestion ? retryCount : 0;
}

function profileAnswer(text: string): LastAnswerProfile {
  const raw = sanitize(text);
  const words = raw ? raw.split(/\s+/).filter(Boolean) : [];
  const wordCount = words.length;
  const lower = raw.toLowerCase();

  const hasExample = /\b(for example|for instance|if a student|if a child|suppose|imagine|once|when i|i would say|let's say)\b/i.test(raw);
  const hasTeachingLanguage = /\b(explain|visual|draw|story|example|step by step|encourage|listen|guide|simplify|break it down|real life|analogy|patient|calm|motivate|support|reassure)\b/i.test(raw);
  const hasConcreteAction = /\b(i would|first|then|ask|explain|encourage|guide|break|show|listen|help|support|reassure|motivate|calm)\b/i.test(raw);

  const vaguePhrases = [
    "i will try", "i'll try", "i do my best", "i will help", "i'll help",
    "i will explain", "i'll explain", "i can do that", "it depends",
    "something like that", "maybe", "normally",
  ];

  const nonAnswerPatterns = [
    "i don't know", "dont know", "do not know", "idk", "not sure", "no idea",
    "i have no idea", "can't say", "cannot say", "nothing", "i'm not sure",
    "am not sure", "no", "hmm", "uh", "uhh", "pass this", "pass the question",
    "no verbal response", "no response",
  ];

  const isNonAnswer =
    nonAnswerPatterns.some((p) => lower === p) ||
    lower.includes("not sure") ||
    lower.includes("don't know") ||
    lower.includes("dont know") ||
    lower.includes("do not know") ||
    lower.includes("no idea") ||
    lower.includes("have no idea") ||
    lower.includes("pass this") ||
    lower.includes("no verbal response") ||
    (wordCount <= 5 && (
      lower === "no" || lower === "nothing" || lower === "idk" ||
      lower === "hmm" || lower === "uh" || lower === "uhh"
    ));

  const isConfusion =
    lower.includes("didn't understand") || lower.includes("did not understand") ||
    lower.includes("don't understand") || lower.includes("do not understand") ||
    lower.includes("not understand") || lower.includes("i am confused") ||
    lower.includes("i'm confused") || lower.includes("confused") ||
    lower.includes("can you repeat") || lower.includes("repeat the question") ||
    lower.includes("say again") || lower.includes("what do you mean");

  const soundsVague =
    !isNonAnswer && !isConfusion &&
    vaguePhrases.some((p) => lower.includes(p)) &&
    !hasExample && !hasConcreteAction && wordCount < 30;

  return {
    raw,
    wordCount,
    isVeryShort: wordCount <= 4,
    isShort: wordCount <= 10,
    isLong: wordCount >= 80,
    isVeryLong: wordCount >= 120,
    hasExample,
    hasTeachingLanguage,
    hasConcreteAction,
    soundsVague,
    isNonAnswer,
    isConfusion,
  };
}

function detectStageFromCount(questionCount: number): InterviewStage {
  if (questionCount <= 1) return "intro";
  if (questionCount === 2) return "simplify";
  if (questionCount === 3) return "stuck_student";
  if (questionCount === 4) return "engagement";
  if (questionCount === 5) return "patience";
  return "closing";
}

function countMainQuestionsAskedRobust(messages: ChatMessage[]): number {
  const seenKeywords = new Set<string>();

  const mainQuestionKeywords = [
    "what drew you to tutoring",
    "explaining fractions to a 9-year-old",
    "stuck on the same problem",
    "keep a child engaged and motivated",
    "what does patience genuinely mean",
    "we'll be in touch",
    "we will be in touch",
    "rooting for you",
  ];

  const closingKeywords = new Set(["we'll be in touch", "we will be in touch", "rooting for you"]);
  let closingCounted = false;

  for (const m of messages) {
    if (m.role !== "assistant") continue;
    const lower = normalizeApostrophes(m.content).toLowerCase();

    for (const kw of mainQuestionKeywords) {
      const normalizedKw = normalizeApostrophes(kw).toLowerCase();
      if (lower.includes(normalizedKw)) {
        if (closingKeywords.has(kw)) {
          if (!closingCounted) {
            seenKeywords.add("__closing__");
            closingCounted = true;
          }
        } else {
          seenKeywords.add(kw);
        }
        break;
      }
    }
  }

  return Math.min(seenKeywords.size, 7);
}

function resolveQuestionCount(messages: ChatMessage[], clientQuestionCount?: number): number {
  const serverDerived = countMainQuestionsAskedRobust(messages);
  if (clientQuestionCount === undefined) return serverDerived;
  if (clientQuestionCount === serverDerived || clientQuestionCount === serverDerived + 1) {
    return serverDerived;
  }
  return serverDerived;
}

function getLastUserAnswer(messages: ChatMessage[]): string {
  const reversed = [...messages].reverse();
  const lastUser = reversed.find((m) => m.role === "user");
  return sanitize(lastUser?.content || "");
}

// FIX: Added clientRetryCount parameter.
// This is the authoritative source for retry tracking — the frontend increments
// it each time it receives isFollowUp=true, so the backend always knows exactly
// how many times this question has been retried without fragile keyword detection.
function getInterviewState(
  messages: ChatMessage[],
  clientQuestionCount?: number,
  clientRetryCount = 0
): InterviewState {
  const lastAnswer = profileAnswer(getLastUserAnswer(messages));
  const lastRaw = getLastUserAnswer(messages);

  const mainQuestionsAsked = resolveQuestionCount(messages, clientQuestionCount);
  const currentStage = detectStageFromCount(mainQuestionsAsked);

  // FIX: Use the max of server-derived and client-provided retry counts.
  // clientRetryCount is more reliable (tracked precisely on the frontend),
  // but we keep the server count as a fallback in case it's higher.
  const serverRetryCount = countRetriesOnCurrentQuestion(messages, currentStage);
  const retriesOnCurrentQuestion = Math.max(serverRetryCount, clientRetryCount);

  const wantsToSkip = isWantsToSkip(lastRaw);
  const askingClarification = isAskingForClarification(lastRaw);
  // FIX: casualChat check no longer excludes intro stage.
  // Previously: `isCasualChat(lastRaw) && currentStage !== "intro"`
  // This caused Maya to jump straight to Q2 when the candidate said "hi how are you"
  // as their first response, instead of acknowledging and re-asking Q1.
  const casualChat = isCasualChat(lastRaw);
  const offTopic = isOffTopic(lastRaw, currentStage);

  let followUpReason: InterviewState["followUpReason"] = null;

  if (wantsToSkip) {
    followUpReason = "wants_skip";
  } else if (askingClarification || lastAnswer.isConfusion) {
    followUpReason = "non_answer";
  } else if (offTopic || casualChat) {
    followUpReason = "off_topic";
  } else if (lastAnswer.isNonAnswer) {
    followUpReason = "non_answer";
  } else if (lastAnswer.isVeryShort && !lastAnswer.hasConcreteAction) {
    followUpReason = "short";
  } else if (lastAnswer.isShort && !lastAnswer.hasConcreteAction && !lastAnswer.hasTeachingLanguage && !lastAnswer.hasExample) {
    followUpReason = "short";
  } else if (lastAnswer.soundsVague || (lastAnswer.wordCount < 10 && !lastAnswer.hasConcreteAction && !lastAnswer.hasExample)) {
    followUpReason = "vague";
  } else if (lastAnswer.isVeryLong) {
    // Long detailed answers always advance immediately
    followUpReason = "tangent";
  }

  let followUpAction: InterviewState["followUpAction"] = null;

  if (followUpReason !== null && mainQuestionsAsked > 0 && currentStage !== "closing") {
    if (followUpReason === "wants_skip") {
      // Explicit skip → always advance
      followUpAction = "advance";
    } else if (followUpReason === "tangent") {
      // Long answers always advance, never retry
      followUpAction = "advance";
    } else if (retriesOnCurrentQuestion < MAX_RETRIES_PER_QUESTION) {
      // FIX: With MAX_RETRIES=1:
      // - First bad response (retries=0, 0 < 1 = true) → retry_same (acknowledge + re-ask)
      // - Second bad response (retries=1, 1 < 1 = false) → advance
      followUpAction = "retry_same";
    } else {
      // Already retried once → advance without lingering
      followUpAction = "advance";
    }
  }

  return {
    askedMainQuestions: mainQuestionsAsked,
    currentStage,
    followUpAction,
    followUpReason,
    retriesOnCurrentQuestion,
  };
}

function nextMainStage(current: InterviewStage): InterviewStage {
  switch (current) {
    case "intro": return "simplify";
    case "simplify": return "stuck_student";
    case "stuck_student": return "engagement";
    case "engagement": return "patience";
    case "patience": return "closing";
    case "closing": return "closing";
  }
}

// ─── Question bank ─────────────────────────────────────────────────────────────

const QUESTION_BANK: Record<InterviewStage, string> = {
  intro: "To kick things off, could you tell me a little about yourself and what drew you to tutoring?",
  simplify: "Imagine you're explaining fractions to a 9-year-old who's been staring blankly — how would you approach that?",
  stuck_student: "Picture a student who's been stuck on the same problem for 5 minutes and says they want to give up. What do you do in that moment?",
  engagement: "How do you keep a child engaged and motivated when you can tell they're bored or distracted?",
  patience: "What does patience genuinely mean to you as a tutor — not just in theory, but day to day?",
  closing: "Thank you so much [name], I've really enjoyed getting to know you today. You've given me a lot to think about. We'll be in touch soon with the next steps. Best of luck — I'm rooting for you!",
};

const QUESTION_OPENERS: Record<InterviewStage, string> = {
  intro: "Hi [name], it's so lovely to meet you today!",
  simplify: "Great, let's move to the next one.",
  stuck_student: "Good, here's the next scenario.",
  engagement: "Thanks for that. Next question:",
  patience: "Appreciated. One more:",
  closing: "",
};

// ─── Response validator ────────────────────────────────────────────────────────

function enforceCorrectQuestion(
  text: string,
  mode: string,
  state: InterviewState,
  candidateName: string
): string {
  if (
    mode.startsWith("retry_same") ||
    mode.startsWith("redirect") ||
    mode === "opening" ||
    mode === "closing"
  ) return text;

  let requiredStage: InterviewStage | null = null;

  if (mode === "main_question") {
    requiredStage = nextMainStage(state.currentStage);
  } else if (
    mode === "advance_after_retry" ||
    mode === "advance_skip_requested" ||
    mode === "advance_after_off_topic" ||
    mode === "advance_after_tangent"
  ) {
    requiredStage = nextMainStage(state.currentStage);
  }

  if (!requiredStage || requiredStage === "closing") return text;

  const requiredQuestion = QUESTION_BANK[requiredStage].replace("[name]", candidateName);
  const requiredOpener = QUESTION_OPENERS[requiredStage].replace("[name]", candidateName);

  const fingerprint = requiredQuestion.slice(0, 35).toLowerCase();
  if (normalizeApostrophes(text).toLowerCase().includes(fingerprint)) return text;

  console.warn(`⚠️ Question validator: model used wrong question for stage=${requiredStage}. Correcting.`);
  console.warn(`   Got: "${text.slice(0, 80)}"`);

  const sentenceEnd = text.search(/[.!?]/);
  let acknowledgment = "";
  if (sentenceEnd > 5) {
    acknowledgment = text.slice(0, sentenceEnd + 1).trim();
  } else {
    acknowledgment = text.split(/\s+/).slice(0, 8).join(" ") + ".";
  }

  const corrected = requiredOpener
    ? `${acknowledgment} ${requiredOpener} ${requiredQuestion}`
    : `${acknowledgment} ${requiredQuestion}`;

  console.log(`   Fixed: "${corrected.slice(0, 100)}"`);
  return corrected.trim();
}

// ─── Prompt builder ────────────────────────────────────────────────────────────

function buildAdaptiveInstruction(candidateName: string, messages: ChatMessage[], state: InterviewState) {
  const lastAnswer = profileAnswer(getLastUserAnswer(messages));
  const lastRaw = getLastUserAnswer(messages);

  const transcript = messages
    .map((m) => `${m.role === "assistant" ? "Maya" : candidateName || "Candidate"}: ${m.content}`)
    .join("\n\n");

  const currentStage = state.currentStage;
  const nextStage = nextMainStage(currentStage);

  const currentQuestionText = QUESTION_BANK[currentStage].replace("[name]", candidateName || "Candidate");
  const nextQuestionOpener = QUESTION_OPENERS[nextStage].replace("[name]", candidateName || "Candidate");
  const nextQuestionText = QUESTION_BANK[nextStage].replace("[name]", candidateName || "Candidate");
  const nextQuestionFull = nextStage !== "closing"
    ? `${nextQuestionOpener} ${nextQuestionText}`.trim()
    : nextQuestionText;
  const closingText = QUESTION_BANK.closing.replace("[name]", candidateName || "Candidate");

  let mode = "main_question";
  let extraDirective = "";

  if (state.askedMainQuestions === 0) {
    mode = "opening";
    extraDirective = `
Greet the candidate warmly by name, then ask this exact question — do not change the wording:
"${QUESTION_BANK.intro}"

Output format: One warm greeting sentence + the question. Nothing else.
`;
  } else if (state.followUpAction === "retry_same") {
    // FIX: This block is now reached for the FIRST bad/casual response to any question.
    // With MAX_RETRIES=1: first time (retries=0) → retry_same, second time → advance.
    if (state.followUpReason === "off_topic" || isCasualChat(lastRaw) || isOffTopic(lastRaw, currentStage)) {
      mode = "retry_same_off_topic";
      extraDirective = `
The candidate responded with a greeting or social pleasantry instead of answering the interview question.

Your job:
1. Warmly and GENUINELY acknowledge their greeting in ONE natural, human sentence.
   Examples: "I'm doing wonderfully, thank you so much for asking!"
             "That's so sweet of you to ask — I'm doing great!"
             "Aww, thank you! I'm having a lovely day!"
   Be warm and real — not robotic.
2. Then gently redirect by asking the EXACT question text again:
"${currentQuestionText}"

CRITICAL RULES:
- Total response: 2 sentences maximum
- The acknowledgment MUST be warm and genuine — NOT dismissive
- Use the exact question text above, word for word
- Do NOT say "Let me redirect you" or anything formal/cold
`;
    } else if (isAskingForClarification(lastRaw) || lastAnswer.isConfusion) {
      mode = "retry_same_clarification";
      extraDirective = `
The candidate is asking for clarification or seems unsure about what to say.

Your job:
1. In ONE reassuring sentence, let them know there's no pressure and give a simple, concrete hint.
2. Then ask the EXACT same question again using this VERBATIM text:
"${currentQuestionText}"

CRITICAL RULES:
- Total response: 2 sentences maximum
- Use the exact question text above, word for word
`;
    } else if (state.followUpReason === "non_answer") {
      mode = "retry_same_non_answer";
      extraDirective = `
The candidate said they don't know, gave no response, or was silent.

Your job:
1. ONE warm, encouraging acknowledgement with ZERO pressure — make them feel completely safe.
   Example: "No worries at all — take all the time you need!"
             "That's totally okay — there's no right or wrong answer here."
2. Then ask the EXACT same question again using this VERBATIM text:
"${currentQuestionText}"

CRITICAL RULES:
- Total response: 2 sentences maximum
- Use the exact question text above, word for word
- Do NOT move to the next question — repeat THIS question
`;
    } else if (state.followUpReason === "short" || state.followUpReason === "vague") {
      mode = "retry_same_short";
      extraDirective = `
The candidate's answer was too brief or vague.

Your job:
1. One brief, warm acknowledgement that gently invites a little more detail.
   Example: "I love that — could you tell me a bit more about how you'd do that?"
             "That's a great start! What would that look like in practice?"
2. Then ask the EXACT same question again using this VERBATIM text:
"${currentQuestionText}"

CRITICAL RULES:
- Total response: 2 sentences maximum
- Use the exact question text above, word for word
`;
    } else if (state.followUpReason === "tangent") {
      mode = "redirect_then_retry";
      extraDirective = `
The candidate's answer was very long and went on a tangent.

Your job:
1. One warm, polite redirect that acknowledges their enthusiasm.
2. Then ask the EXACT same question again using this VERBATIM text:
"${currentQuestionText}"

CRITICAL RULES:
- Total response: 2 sentences maximum
- Use the exact question text above, word for word
`;
    }
  } else if (state.followUpAction === "advance") {
    if (state.followUpReason === "wants_skip") {
      mode = "advance_skip_requested";
      extraDirective = nextStage === "closing"
        ? `The candidate wants to move on. Wrap up graciously:\n"${closingText}"`
        : `The candidate wants to move to the next question. Acknowledge briefly then ask EXACTLY:\n"${nextQuestionText}"\n\nCRITICAL: Use the exact question text above. Total response: 2 sentences maximum.`;
    } else if (state.followUpReason === "tangent") {
      mode = "advance_after_tangent";
      extraDirective = nextStage === "closing"
        ? `The candidate gave a detailed answer. Wrap up warmly:\n"${closingText}"`
        : `The candidate gave a thorough answer. Acknowledge it warmly in ONE sentence, then move on with EXACTLY:\n"${nextQuestionText}"\n\nCRITICAL: Use the exact question text above. Total response: 2 sentences maximum.`;
    } else if (state.followUpReason === "off_topic") {
      // FIX: Second time they gave casual/greeting response → advance naturally
      mode = "advance_after_off_topic";
      extraDirective = nextStage === "closing"
        ? `The candidate continued with social chat. Wrap up warmly:\n"${closingText}"`
        : `Transition warmly and naturally (do NOT reference that they were off-topic), then ask EXACTLY:\n"${nextQuestionText}"\n\nCRITICAL: Use the exact question text above. Total response: 2 sentences maximum.`;
    } else {
      // non_answer / short / vague — advance warmly without judgment
      mode = "advance_after_retry";
      extraDirective = nextStage === "closing"
        ? `The candidate wasn't able to answer fully. Wrap up the interview warmly:\n"${closingText}"`
        : `Move naturally and warmly to the next question. Do NOT reference their previous response or inability to answer. Just say something encouraging and transition with EXACTLY:\n"${nextQuestionText}"\n\nCRITICAL: Use the exact question text above. Total response: 2 sentences maximum.`;
    }
  } else if (nextStage === "closing" && state.followUpAction === null) {
    mode = "closing";
    extraDirective = `Acknowledge the candidate's last answer briefly, then close the interview:\n"${closingText}"\n\nTotal response: 2 sentences maximum.`;
  } else {
    mode = "main_question";
    extraDirective = `
Acknowledge the candidate's last answer in ONE short, genuine phrase.

Then ask this next question using EXACTLY this text — copy it word for word, do not paraphrase or substitute:
"${nextQuestionFull}"

CRITICAL RULES:
- The acknowledgment must be ONE sentence only
- The question text must be COPIED VERBATIM — do not change a single word
- Total response: 2 sentences maximum
- Do NOT invent a different question
- Do NOT skip ahead
`;
  }

  return {
    prompt: `
Candidate name: ${candidateName || "Candidate"}

Interview stage now: ${currentStage}
Response mode: ${mode}
Follow-up action: ${state.followUpAction ?? "none"}
Follow-up reason: ${state.followUpReason ?? "none"}
Retries on current question: ${state.retriesOnCurrentQuestion} / max ${MAX_RETRIES_PER_QUESTION}

Last candidate answer (${lastAnswer.wordCount} words):
${lastAnswer.raw || "(none)"}

Answer profile:
- words: ${lastAnswer.wordCount}
- hasExample: ${lastAnswer.hasExample}
- hasTeachingLanguage: ${lastAnswer.hasTeachingLanguage}
- hasConcreteAction: ${lastAnswer.hasConcreteAction}
- soundsVague: ${lastAnswer.soundsVague}
- isConfusion: ${lastAnswer.isConfusion}
- isVeryShort: ${lastAnswer.isVeryShort}
- isVeryLong: ${lastAnswer.isVeryLong}
- isNonAnswer: ${lastAnswer.isNonAnswer}
- wantsToSkip: ${isWantsToSkip(lastAnswer.raw)}
- askingClarification: ${isAskingForClarification(lastAnswer.raw)}
- isCasualChat: ${isCasualChat(lastAnswer.raw)}

Full conversation so far:
${transcript}

Instructions:
${extraDirective}

ABSOLUTE OUTPUT RULES:
- Write only Maya's next response
- Plain text only — no markdown, no bullets, no asterisks
- Maximum 2 sentences total
- Do NOT ask more than one question
- Do NOT explain, lecture, or teach anything
`,
    mode,
  };
}

const SYSTEM_PROMPT = `
You are Maya, a warm and genuinely caring senior interviewer at Cuemath.

You are conducting a short screening interview. Your role is to ask a FIXED set of questions in a FIXED ORDER and assess the candidate's responses.

ABSOLUTE RULES — NEVER BREAK THESE:
1. You ask EXACTLY the question text provided in the Instructions section — never rephrase, never substitute, never skip
2. Maximum 2 sentences per response
3. Never explain, teach, or elaborate
4. Never ask multiple questions in one turn
5. Never use bullet points or markdown
6. Stay warm and human
7. VERBATIM means copy every single word exactly as given — do not paraphrase
8. When the candidate is friendly or social, ALWAYS acknowledge their greeting warmly before redirecting
9. NEVER jump ahead to a question that wasn't assigned to you in this turn
10. When advancing after a non-answer, be warm and natural — do NOT reference the candidate's inability to answer, do NOT say "I understand you'd like to move forward"
11. For retry_same modes: always re-ask the SAME question — never move to the next one
12. For advance modes: always ask the NEXT question — never re-ask the current one

Tone: warm, human, encouraging, professional.
`;

function detectCompletion(text: string, mode: string, state: InterviewState): boolean {
  const stageBasedClosing =
    (mode === "closing" && state.currentStage === "patience") ||
    (mode === "advance_after_retry" && nextMainStage(state.currentStage) === "closing") ||
    (mode === "advance_skip_requested" && nextMainStage(state.currentStage) === "closing") ||
    (mode === "advance_after_off_topic" && nextMainStage(state.currentStage) === "closing") ||
    (mode === "advance_after_tangent" && nextMainStage(state.currentStage) === "closing") ||
    state.currentStage === "closing";

  if (!stageBasedClosing) return false;

  const lower = normalizeApostrophes(text).toLowerCase();
  return (
    lower.includes("we'll be in touch") || lower.includes("we will be in touch") ||
    lower.includes("next steps") || lower.includes("best of luck") ||
    lower.includes("rooting for you") || lower.includes("really enjoyed getting to know you")
  );
}

// ─── Groq API call ────────────────────────────────────────────────────────────

async function callGroq(
  model: string,
  systemPrompt: string,
  userPrompt: string,
  maxTokens = 120,
  temperature = 0.55,
  timeoutMs = MODEL_TIMEOUT_MS
): Promise<string> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(GROQ_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        max_tokens: maxTokens,
        temperature,
      }),
      signal: controller.signal,
    });

    if (!res.ok) {
      const errBody = await res.text();
      throw new Error(`groq_${res.status}: ${errBody}`);
    }

    const data = await res.json();
    const text = data?.choices?.[0]?.message?.content?.trim() ?? "";
    if (!text) throw new Error("Empty response from Groq");
    return text;
  } catch (error) {
    if ((error as Error)?.name === "AbortError") throw new Error(`model_timeout_${timeoutMs}ms`);
    throw error;
  } finally {
    clearTimeout(timer);
  }
}

// ─── Route handler ────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  if (!isValidOrigin(req)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (!process.env.GROQ_API_KEY) {
    console.error("❌ GROQ_API_KEY missing");
    return NextResponse.json({ error: "API key missing" }, { status: 500 });
  }

  try {
    const rawBody = await req.json();
    const { messages, candidateName, clientQuestionCount, clientRetryCount } = getSafeRequestBody(rawBody);

    // FIX: Pass clientRetryCount to getInterviewState so retry decisions are
    // based on accurate frontend tracking instead of fragile keyword detection
    const state = getInterviewState(messages, clientQuestionCount, clientRetryCount);
    const { prompt, mode } = buildAdaptiveInstruction(candidateName, messages, state);

    let lastError: unknown = null;

    for (const model of MODELS) {
      try {
        console.log(`🔄 Chat model=${model}, mode=${mode}, action=${state.followUpAction}, reason=${state.followUpReason}, retries=${state.retriesOnCurrentQuestion}/${MAX_RETRIES_PER_QUESTION}, stage=${state.currentStage}, askedQ=${state.askedMainQuestions}, clientRetry=${clientRetryCount}`);

        const rawText = await callGroq(model, SYSTEM_PROMPT, prompt, 120, 0.55, MODEL_TIMEOUT_MS);
        const text = enforceCorrectQuestion(rawText, mode, state, candidateName);

        console.log("✅ Maya:", text.slice(0, 140));

        const isComplete = detectCompletion(text, mode, state);
        const isFollowUp = state.followUpAction === "retry_same";

        return NextResponse.json({ text, isComplete, isFollowUp, source: "groq", code: "OK" });
      } catch (error: unknown) {
        lastError = error;
        const message = getErrorMessage(error);

        if (isQuotaError(message)) {
          console.warn(`⚠️ Chat ${model} rate limited — trying next model`);
          await sleep(1200);
          continue;
        }

        console.error(`❌ Chat ${model}:`, message);

        if (isTemporaryError(message) || isTimeoutError(message)) {
          await sleep(1200);
          continue;
        }

        break;
      }
    }

    const errMsg = getErrorMessage(lastError);
    console.error("❌ All chat models failed:", errMsg);

    return NextResponse.json({
      error: "Interview service unavailable",
      code: "CHAT_UNAVAILABLE",
      text: "I'm sorry — I'm having a little trouble right now. Please try again in just a moment.",
      isComplete: false,
      isFollowUp: false,
      source: "fallback",
    });
  } catch (error: unknown) {
    const errMsg = getErrorMessage(error);
    console.error("❌ Fatal chat error:", errMsg);
    return NextResponse.json({ error: "Failed", code: "BAD_REQUEST" }, { status: 500 });
  }
}