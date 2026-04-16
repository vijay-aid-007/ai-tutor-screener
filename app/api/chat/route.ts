import { NextRequest, NextResponse } from "next/server";

const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";
const MODELS = ["llama-3.3-70b-versatile", "llama-3.1-8b-instant"];
const MODEL_TIMEOUT_MS = 9000;
const MAX_MESSAGES = 18;
const MAX_CONTENT_LENGTH = 4000;
const MAX_NAME_LENGTH = 80;
const MAX_RETRIES_PER_QUESTION = 1;

type ChatRole = "user" | "assistant";
type ChatMessage = { role: ChatRole; content: string };

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
  clientRetryCount: number;
  beginInterview: boolean;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function sleep(ms: number): Promise<void> {
  return new Promise<void>((resolve) => setTimeout(resolve, ms));
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
  if (!input) throw new Error("messages field is missing");
  if (!Array.isArray(input)) throw new Error("messages must be an array");
  if (input.length === 0) throw new Error("messages array is empty");

  const normalized: ChatMessage[] = [];

  for (let i = 0; i < input.length; i++) {
    const item = input[i];
    if (!item || typeof item !== "object") {
      console.warn(`chat: skipping invalid message at index ${i} (not an object)`);
      continue;
    }
    const record = item as Record<string, unknown>;
    const role = record.role;
    const content = record.content;

    if (!isValidRole(role)) {
      console.warn(
        `chat: skipping message at index ${i} with invalid role "${String(role)}"`
      );
      continue;
    }
    if (content === null || content === undefined) {
      console.warn(`chat: skipping message at index ${i} with null content`);
      continue;
    }

    const contentStr = typeof content === "string" ? content : String(content);
    const cleanContent = sanitize(contentStr).slice(0, MAX_CONTENT_LENGTH);
    if (!cleanContent) {
      console.warn(
        `chat: skipping message at index ${i} with empty content after sanitization`
      );
      continue;
    }

    normalized.push({ role, content: cleanContent });
  }

  if (normalized.length === 0) {
    throw new Error("No valid messages found after normalization");
  }

  return trimMessages(normalized, MAX_MESSAGES);
}

function normalizeClientQuestionCount(input: unknown): number | undefined {
  if (
    typeof input === "number" &&
    Number.isInteger(input) &&
    input >= 0 &&
    input <= 8
  )
    return input;
  return undefined;
}

function normalizeClientRetryCount(input: unknown): number {
  if (
    typeof input === "number" &&
    Number.isInteger(input) &&
    input >= 0 &&
    input <= 10
  )
    return input;
  return 0;
}

function getSafeRequestBody(body: unknown): NormalizedRequestBody {
  if (!body || typeof body !== "object") throw new Error("Invalid request body");
  const data = body as {
    messages?: unknown;
    candidateName?: unknown;
    questionCount?: unknown;
    retryCount?: unknown;
    beginInterview?: unknown;
  };
  return {
    messages: normalizeMessages(data.messages),
    candidateName: normalizeCandidateName(data.candidateName),
    clientQuestionCount: normalizeClientQuestionCount(data.questionCount),
    clientRetryCount: normalizeClientRetryCount(data.retryCount),
    beginInterview: data.beginInterview === true,
  };
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  try {
    return JSON.stringify(error);
  } catch {
    return String(error);
  }
}

function isQuotaError(message: string): boolean {
  const m = message.toLowerCase();
  return (
    m.includes("429") ||
    m.includes("rate_limit") ||
    m.includes("quota") ||
    m.includes("too many requests") ||
    m.includes("rate limit")
  );
}

function isTemporaryError(message: string): boolean {
  const m = message.toLowerCase();
  return (
    m.includes("503") ||
    m.includes("unavailable") ||
    m.includes("timeout") ||
    m.includes("network") ||
    m.includes("fetch failed")
  );
}

function isTimeoutError(message: string): boolean {
  return message.startsWith("model_timeout_");
}

function isAbortError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  return (
    error.name === "AbortError" ||
    error.message === "AbortError" ||
    error.message.includes("aborted")
  );
}

function isValidOrigin(req: NextRequest): boolean {
  const origin = req.headers.get("origin");
  if (process.env.NODE_ENV !== "production") return true;
  if (!origin) return false;
  const host = req.headers.get("host") ?? "";
  const allowed = (process.env.ALLOWED_ORIGINS ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  try {
    const originHost = new URL(origin).host;
    return originHost === host || allowed.includes(origin);
  } catch {
    return false;
  }
}

function trimMessages(
  messages: ChatMessage[],
  maxMessages = 18
): ChatMessage[] {
  if (messages.length <= maxMessages) return messages;
  const anchor = messages.slice(0, 2);
  const rest = messages.slice(2);
  const trimmed = rest.slice(-(maxMessages - 2));
  return [...anchor, ...trimmed];
}

// ─── Answer/intent detection ──────────────────────────────────────────────────

function isWantsToSkip(text: string): boolean {
  const t = text.toLowerCase();
  return (
    t.includes("next question") ||
    t.includes("move to next") ||
    t.includes("move on") ||
    t.includes("let's move") ||
    t.includes("lets move") ||
    t.includes("skip this") ||
    t.includes("skip it") ||
    t.includes("can we move") ||
    t.includes("go to next") ||
    t.includes("next one") ||
    t.includes("pass this") ||
    t.includes("agle question") ||
    t.includes("next pe jao") ||
    t.includes("next question pe") ||
    (t.includes("move") && t.includes("question")) ||
    (t.includes("next") && t.length <= 10)
  );
}

function isCasualChat(text: string): boolean {
  const t = text.toLowerCase().trim();
  return (
    t === "hi" ||
    t === "hello" ||
    t === "hey" ||
    t === "hii" ||
    t === "helo" ||
    t === "good" ||
    t === "fine" ||
    t === "i'm good" ||
    t === "im good" ||
    t === "doing good" ||
    t === "doing well" ||
    t.includes("how are you") ||
    t.includes("how is your day") ||
    t.includes("how's your day") ||
    t.includes("how are you doing") ||
    t.includes("how do you do") ||
    t.includes("you doing") ||
    t.includes("are you okay") ||
    t.includes("are you good") ||
    t.includes("what's up") ||
    t.includes("whats up") ||
    t.includes("sup maya") ||
    t.includes("hello maya") ||
    t.includes("hi maya") ||
    t.includes("good morning") ||
    t.includes("good afternoon") ||
    t.includes("good evening") ||
    t.includes("nice to meet") ||
    t.includes("pleased to meet") ||
    (t.startsWith("how are") && t.length < 30)
  );
}

function isAskingForClarification(text: string): boolean {
  const t = text.toLowerCase();
  return (
    t.includes("what do you mean") ||
    t.includes("can you explain") ||
    t.includes("explain me") ||
    t.includes("explain a bit") ||
    t.includes("more detail") ||
    t.includes("more details") ||
    t.includes("what should i") ||
    t.includes("what kind of answer") ||
    t.includes("how should i answer") ||
    t.includes("means what") ||
    t.includes("matlab kya") ||
    t.includes("kya bolun") ||
    t.includes("what to say") ||
    t.includes("what do i say") ||
    t.includes("i don't understand the question") ||
    t.includes("i dont understand the question") ||
    t.includes("what exactly") ||
    t.includes("can you rephrase") ||
    t.includes("rephrase") ||
    t.includes("clarify")
  );
}

function isOffTopic(text: string): boolean {
  const t = text.toLowerCase().trim();

  if (isCasualChat(t)) return true;

  const wc = t.split(/\s+/).filter(Boolean).length;
  const isSocialOnly =
    (t.includes("good morning") ||
      t.includes("good evening") ||
      t.includes("good afternoon") ||
      t.includes("nice to meet") ||
      t.includes("pleased to meet") ||
      t.includes("how are you") ||
      t.includes("how is your day") ||
      t.includes("how's your day") ||
      t.includes("hello") ||
      t.includes("hi")) &&
    wc <= 20;

  return isSocialOnly;
}

// FIX: centralise apostrophe normalisation so ALL fingerprint comparisons
// go through the same transform. Previously some call sites normalised and
// others did not, causing fingerprint misses on the very first question when
// the assistant greeting contained a curly apostrophe.
function normalizeApostrophes(text: string): string {
  return text
    .replace(/[\u2018\u2019\u201A\u201B\u2032\u2035]/g, "'")
    .replace(/[\u201C\u201D\u201E\u201F\u2033\u2036]/g, '"');
}

// ─── Question tracking ────────────────────────────────────────────────────────

// FIX: The intro-question fingerprint ("what drew you to tutoring") also
// appears inside the opening greeting produced by buildAdaptiveInstruction
// when mode === "opening". The previous implementation counted that greeting
// message as a question, so the server always thought Q1 had been asked even
// before the candidate answered, producing an off-by-one that caused Q2 to
// be skipped on the very first retry. We now exclude the first assistant
// message (the greeting) from the count because it contains the question
// before any user answer has been received.
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

  const closingKeywordsNormalized = new Set([
    normalizeApostrophes("we'll be in touch"),
    "we will be in touch",
    "rooting for you",
  ]);
  let closingCounted = false;

  // FIX: only count a question as "asked" if at least one user message
  // follows it. This prevents the opening greeting (which embeds Q1) from
  // being counted before the candidate has responded.
  let assistantIndexes: number[] = [];
  for (let i = 0; i < messages.length; i++) {
    if (messages[i].role === "assistant") assistantIndexes.push(i);
  }

  for (const aIdx of assistantIndexes) {
    // Check whether there is at least one subsequent user message
    const hasFollowingUserMsg = messages
      .slice(aIdx + 1)
      .some((m) => m.role === "user");
    if (!hasFollowingUserMsg) continue;

    const m = messages[aIdx];
    const lower = normalizeApostrophes(m.content).toLowerCase();

    for (const kw of mainQuestionKeywords) {
      const normalizedKw = normalizeApostrophes(kw).toLowerCase();
      if (lower.includes(normalizedKw)) {
        if (closingKeywordsNormalized.has(normalizedKw)) {
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

function countRetriesOnCurrentQuestion(
  messages: ChatMessage[],
  currentStage: InterviewStage
): number {
  const currentQuestionFingerprint = normalizeApostrophes(
    (() => {
      switch (currentStage) {
        case "intro":
          return "what drew you to tutoring";
        case "simplify":
          return "explaining fractions to a 9-year-old";
        case "stuck_student":
          return "stuck on the same problem";
        case "engagement":
          return "keep a child engaged and motivated";
        case "patience":
          return "what does patience genuinely mean";
        case "closing":
          return "we'll be in touch";
      }
    })()
  );

  const otherQuestionFingerprints = [
    "what drew you to tutoring",
    "explaining fractions to a 9-year-old",
    "stuck on the same problem",
    "keep a child engaged and motivated",
    "what does patience genuinely mean",
    "we'll be in touch",
    "we will be in touch",
    "rooting for you",
  ].filter(
    (kw) =>
      normalizeApostrophes(kw).toLowerCase() !==
      currentQuestionFingerprint.toLowerCase()
  );

  let fingerprintCount = 0;
  let segmentStarted = false;

  for (const m of messages) {
    if (m.role !== "assistant") continue;
    const lower = normalizeApostrophes(m.content).toLowerCase();

    if (lower.includes(currentQuestionFingerprint.toLowerCase())) {
      segmentStarted = true;
      fingerprintCount++;
      continue;
    }

    if (
      segmentStarted &&
      otherQuestionFingerprints.some((kw) =>
        lower.includes(normalizeApostrophes(kw).toLowerCase())
      )
    ) {
      break;
    }
  }

  return Math.max(0, fingerprintCount - 1);
}

// ─── Answer profiling ─────────────────────────────────────────────────────────

function profileAnswer(text: string): LastAnswerProfile {
  const raw = sanitize(text);
  const words = raw ? raw.split(/\s+/).filter(Boolean) : [];
  const wordCount = words.length;
  const lower = raw.toLowerCase();

  const hasExample =
    /\b(for example|for instance|if a student|if a child|suppose|imagine|once|when i|i would say|let's say)\b/i.test(
      raw
    );
  const hasTeachingLanguage =
    /\b(explain|visual|draw|story|example|step by step|encourage|listen|guide|simplify|break it down|real life|analogy|patient|calm|motivate|support|reassure)\b/i.test(
      raw
    );
  const hasConcreteAction =
    /\b(i would|first|then|ask|explain|encourage|guide|break|show|listen|help|support|reassure|motivate|calm)\b/i.test(
      raw
    );

  const vaguePhrases = [
    "i will try",
    "i'll try",
    "i do my best",
    "i will help",
    "i'll help",
    "i will explain",
    "i'll explain",
    "i can do that",
    "it depends",
    "something like that",
    "maybe",
    "normally",
  ];

  const nonAnswerPatterns = [
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
    "i'm not sure",
    "am not sure",
    "no",
    "hmm",
    "uh",
    "uhh",
    "pass this",
    "pass the question",
    "next question",
    "unable to recall",
    "no verbal response",
    "no response",
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
    (wordCount <= 5 &&
      (lower === "no" ||
        lower === "nothing" ||
        lower === "idk" ||
        lower === "hmm" ||
        lower === "uh" ||
        lower === "uhh"));

  const isConfusion =
    lower.includes("didn't understand") ||
    lower.includes("did not understand") ||
    lower.includes("don't understand") ||
    lower.includes("do not understand") ||
    lower.includes("not understand") ||
    lower.includes("i am confused") ||
    lower.includes("i'm confused") ||
    lower.includes("confused") ||
    lower.includes("can you repeat") ||
    lower.includes("repeat the question") ||
    lower.includes("say again") ||
    lower.includes("what do you mean");

  const soundsVague =
    !isNonAnswer &&
    !isConfusion &&
    vaguePhrases.some((p) => lower.includes(p)) &&
    !hasExample &&
    !hasConcreteAction &&
    wordCount < 30;

  return {
    raw,
    wordCount,
    isVeryShort: wordCount <= 4,
    isShort: wordCount <= 15,
    isLong: wordCount >= 120,
    isVeryLong: wordCount >= 150,
    hasExample,
    hasTeachingLanguage,
    hasConcreteAction,
    soundsVague,
    isNonAnswer,
    isConfusion,
  };
}

// ─── Stage detection ──────────────────────────────────────────────────────────

function detectStageFromCount(questionCount: number): InterviewStage {
  if (questionCount <= 1) return "intro";
  if (questionCount === 2) return "simplify";
  if (questionCount === 3) return "stuck_student";
  if (questionCount === 4) return "engagement";
  if (questionCount === 5) return "patience";
  return "closing";
}

function getLastUserAnswer(messages: ChatMessage[]): string {
  const reversed = [...messages].reverse();
  const lastUser = reversed.find((m) => m.role === "user");
  return sanitize(lastUser?.content || "");
}

function getInterviewState(
  messages: ChatMessage[],
  clientQuestionCount?: number,
  clientRetryCount = 0,
  beginInterview = false
): InterviewState {
  if (beginInterview) {
    return {
      askedMainQuestions: 0,
      currentStage: "intro",
      followUpAction: null,
      followUpReason: null,
      retriesOnCurrentQuestion: 0,
    };
  }

  const lastRaw = getLastUserAnswer(messages);
  const lastAnswer = profileAnswer(lastRaw);

  const serverMainQuestionsAsked = countMainQuestionsAskedRobust(messages);

  const mainQuestionsAsked =
    serverMainQuestionsAsked > 0
      ? serverMainQuestionsAsked
      : (clientQuestionCount ?? 0);

  const currentStage = detectStageFromCount(mainQuestionsAsked);

  const serverRetryCount = countRetriesOnCurrentQuestion(messages, currentStage);

  const retriesOnCurrentQuestion =
    serverMainQuestionsAsked > 0
      ? serverRetryCount
      : Math.min(clientRetryCount, MAX_RETRIES_PER_QUESTION);

  if (mainQuestionsAsked === 0) {
    return {
      askedMainQuestions: mainQuestionsAsked,
      currentStage,
      followUpAction: null,
      followUpReason: null,
      retriesOnCurrentQuestion: 0,
    };
  }

  const wantsToSkip = isWantsToSkip(lastRaw);
  const askingClarification = isAskingForClarification(lastRaw);
  const casualChat = isCasualChat(lastRaw);
  const offTopic = isOffTopic(lastRaw);

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
  } else if (
    lastAnswer.isShort &&
    !lastAnswer.hasConcreteAction &&
    !lastAnswer.hasTeachingLanguage &&
    !lastAnswer.hasExample
  ) {
    followUpReason = "short";
  } else if (
    lastAnswer.soundsVague ||
    (lastAnswer.wordCount < 10 &&
      !lastAnswer.hasConcreteAction &&
      !lastAnswer.hasExample)
  ) {
    followUpReason = "vague";
  } else if (lastAnswer.isVeryLong) {
    followUpReason = "tangent";
  }

  let followUpAction: InterviewState["followUpAction"] = null;

  if (
    followUpReason !== null &&
    mainQuestionsAsked > 0 &&
    currentStage !== "closing"
  ) {
    if (followUpReason === "wants_skip") {
      followUpAction = "advance";
    } else if (followUpReason === "tangent") {
      followUpAction = "advance";
    } else if (followUpReason === "off_topic") {
      if (retriesOnCurrentQuestion < MAX_RETRIES_PER_QUESTION) {
        followUpAction = "retry_same";
      } else {
        followUpAction = "advance";
      }
    } else if (retriesOnCurrentQuestion < MAX_RETRIES_PER_QUESTION) {
      followUpAction = "retry_same";
    } else {
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
    case "intro":
      return "simplify";
    case "simplify":
      return "stuck_student";
    case "stuck_student":
      return "engagement";
    case "engagement":
      return "patience";
    case "patience":
      return "closing";
    case "closing":
      return "closing";
  }
}

// ─── Question bank ────────────────────────────────────────────────────────────

const QUESTION_BANK: Record<InterviewStage, string> = {
  intro: "To kick things off, could you tell me a little about yourself and what drew you to tutoring?",
  simplify:
    "Imagine you're explaining fractions to a 9-year-old who's been staring blankly — how would you approach that?",
  stuck_student:
    "Picture a student who's been stuck on the same problem for 5 minutes and says they want to give up. What do you do in that moment?",
  engagement:
    "How do you keep a child engaged and motivated when you can tell they're bored or distracted?",
  patience:
    "What does patience genuinely mean to you as a tutor — not just in theory, but day to day?",
  closing:
    "Thank you so much [name], I've really enjoyed getting to know you today. You've given me a lot to think about. We'll be in touch soon with the next steps. Best of luck — I'm rooting for you!",
};

const QUESTION_OPENERS: Record<InterviewStage, string> = {
  intro: "Hi [name], it's so lovely to meet you today!",
  simplify: "Great, let's move to the next one.",
  stuck_student: "Good, here's the next scenario.",
  engagement: "Thanks for that. Next question:",
  patience: "Appreciated. One more:",
  closing: "",
};

// ─── Deterministic retry responses ────────────────────────────────────────────

function buildDeterministicRetryResponse(
  mode: string,
  currentStage: InterviewStage,
  candidateName: string
): string | null {
  if (currentStage === "closing") return null;

  const currentQuestion = QUESTION_BANK[currentStage].replace(
    "[name]",
    candidateName
  );

  switch (mode) {
    case "retry_same_off_topic":
      return `I'm doing well, thank you! ${currentQuestion}`;
    case "retry_same_clarification":
      return `No worries at all — just answer in the way that feels most natural to you. ${currentQuestion}`;
    case "retry_same_non_answer":
      return `That's completely okay — take your time. ${currentQuestion}`;
    case "retry_same_short":
      return `That's a good start — could you share a little more? ${currentQuestion}`;
    default:
      return null;
  }
}

// ─── Response validators ──────────────────────────────────────────────────────

function enforceRetryContainsCurrentQuestion(
  text: string,
  currentStage: InterviewStage,
  candidateName: string
): string {
  if (currentStage === "closing") return text;

  const currentQuestion = QUESTION_BANK[currentStage].replace(
    "[name]",
    candidateName
  );
  const fingerprint = normalizeApostrophes(currentQuestion).toLowerCase();
  const normalizedText = normalizeApostrophes(text).toLowerCase();

  if (normalizedText.includes(fingerprint)) return text;

  const sentenceEnd = text.search(/[.!?]/);
  const acknowledgement =
    sentenceEnd > 5
      ? text.slice(0, sentenceEnd + 1).trim()
      : text.split(/\s+/).slice(0, 8).join(" ") + ".";

  return `${acknowledgement} ${currentQuestion}`.trim();
}

function enforceCorrectQuestion(
  text: string,
  mode: string,
  state: InterviewState,
  candidateName: string
): string {
  if (mode.startsWith("retry_same")) {
    return enforceRetryContainsCurrentQuestion(
      text,
      state.currentStage,
      candidateName
    );
  }

  if (mode === "redirect" || mode === "opening" || mode === "closing")
    return text;

  let requiredStage: InterviewStage | null = null;
  if (
    [
      "main_question",
      "advance_after_retry",
      "advance_skip_requested",
      "advance_after_off_topic",
      "advance_after_tangent",
    ].includes(mode)
  ) {
    requiredStage =
      state.currentStage === "closing"
        ? "closing"
        : nextMainStage(state.currentStage);
  }

  if (!requiredStage) return text;

  if (requiredStage === "closing") {
    const lower = normalizeApostrophes(text).toLowerCase();
    const hasClosingLanguage =
      lower.includes("we'll be in touch") ||
      lower.includes("we will be in touch") ||
      lower.includes("next steps") ||
      lower.includes("best of luck") ||
      lower.includes("rooting for you") ||
      lower.includes("really enjoyed getting to know you");

    if (!hasClosingLanguage) {
      const closingText = QUESTION_BANK.closing.replace("[name]", candidateName);
      const sentenceEnd = text.search(/[.!?]/);
      if (sentenceEnd > 5) {
        return `${text.slice(0, sentenceEnd + 1).trim()} ${closingText}`.trim();
      }
      return closingText;
    }
    return text;
  }

  const requiredQuestion = QUESTION_BANK[requiredStage].replace(
    "[name]",
    candidateName
  );
  const fingerprint = normalizeApostrophes(requiredQuestion).toLowerCase();
  if (normalizeApostrophes(text).toLowerCase().includes(fingerprint)) return text;

  const sentenceEnd = text.search(/[.!?]/);
  const acknowledgment =
    sentenceEnd > 5
      ? text.slice(0, sentenceEnd + 1).trim()
      : text.split(/\s+/).slice(0, 8).join(" ") + ".";

  return `${acknowledgment} ${requiredQuestion}`.trim();
}

// ─── Prompt builder ───────────────────────────────────────────────────────────

function buildAdaptiveInstruction(
  candidateName: string,
  messages: ChatMessage[],
  state: InterviewState,
  beginInterview: boolean
) {
  const lastAnswer = profileAnswer(getLastUserAnswer(messages));
  const lastRaw = getLastUserAnswer(messages);
  const transcript = messages
    .map(
      (m) =>
        `${m.role === "assistant" ? "Maya" : candidateName || "Candidate"}: ${m.content}`
    )
    .join("\n\n");

  const currentStage = state.currentStage;
  const nextStage = nextMainStage(currentStage);
  const currentQuestionText = QUESTION_BANK[currentStage].replace(
    "[name]",
    candidateName || "Candidate"
  );
  const nextQuestionOpener = QUESTION_OPENERS[nextStage].replace(
    "[name]",
    candidateName || "Candidate"
  );
  const nextQuestionText = QUESTION_BANK[nextStage].replace(
    "[name]",
    candidateName || "Candidate"
  );
  const nextQuestionFull =
    nextStage !== "closing"
      ? `${nextQuestionOpener} ${nextQuestionText}`.trim()
      : nextQuestionText;
  const closingText = QUESTION_BANK.closing.replace(
    "[name]",
    candidateName || "Candidate"
  );

  let mode = "main_question";
  let extraDirective = "";

  if (beginInterview || state.askedMainQuestions === 0) {
    mode = "opening";
    extraDirective = `
Greet the candidate warmly by name, then ask this exact question — do not change the wording:
"${QUESTION_BANK.intro}"

Output format: One warm greeting sentence + the question. Nothing else.
`;
  } else if (currentStage === "closing") {
    mode = "closing";
    extraDirective = `The interview is already at the closing stage. Wrap up warmly:\n"${closingText}"\n\nTotal response: 1-2 sentences maximum.`;
  } else if (state.followUpAction === "retry_same") {
    if (
      state.followUpReason === "off_topic" ||
      isCasualChat(lastRaw) ||
      isOffTopic(lastRaw)
    ) {
      mode = "retry_same_off_topic";
      extraDirective = `
The candidate responded with a social greeting or pleasantry instead of answering the interview question.

STEP 1 — Acknowledge their greeting warmly in ONE short natural sentence.
STEP 2 — Then ask this question VERBATIM:
"${currentQuestionText}"

CRITICAL:
- MUST include BOTH acknowledgement and the SAME current question.
- NEVER ask the next question.
- Total response: exactly 2 sentences.
`;
    } else if (isAskingForClarification(lastRaw) || lastAnswer.isConfusion) {
      mode = "retry_same_clarification";
      extraDirective = `
The candidate is asking for clarification or seems confused.

STEP 1 — ONE reassuring sentence.
STEP 2 — Then ask this question VERBATIM:
"${currentQuestionText}"

CRITICAL:
- MUST include BOTH reassurance and the SAME current question.
- NEVER ask the next question.
- Total response: exactly 2 sentences.
`;
    } else if (state.followUpReason === "non_answer") {
      mode = "retry_same_non_answer";
      extraDirective = `
The candidate said they don't know or gave no response.

STEP 1 — ONE warm, zero-pressure acknowledgement.
STEP 2 — Then ask this question VERBATIM:
"${currentQuestionText}"

CRITICAL:
- MUST include BOTH acknowledgement and the SAME current question.
- NEVER ask the next question.
- Total response: exactly 2 sentences.
`;
    } else {
      mode = "retry_same_short";
      extraDirective = `
The candidate gave a very brief or vague answer and needs to elaborate.

STEP 1 — ONE brief, warm invitation for more detail.
STEP 2 — Then ask this question VERBATIM:
"${currentQuestionText}"

CRITICAL:
- MUST include BOTH invitation and the SAME current question.
- NEVER ask the next question.
- Total response: exactly 2 sentences.
`;
    }
  } else if (state.followUpAction === "advance") {
    if (state.followUpReason === "wants_skip") {
      mode = "advance_skip_requested";
      extraDirective =
        nextStage === "closing"
          ? `Candidate wants to move on. Wrap up graciously:\n"${closingText}"`
          : `Acknowledge briefly then ask EXACTLY:\n"${nextQuestionText}"\n\nCRITICAL: 2 sentences max.`;
    } else if (state.followUpReason === "tangent") {
      mode = "advance_after_tangent";
      extraDirective =
        nextStage === "closing"
          ? `Wrap up warmly:\n"${closingText}"`
          : `Acknowledge warmly in ONE sentence then ask EXACTLY:\n"${nextQuestionText}"\n\nCRITICAL: 2 sentences max.`;
    } else if (state.followUpReason === "off_topic") {
      mode = "advance_after_off_topic";
      extraDirective =
        nextStage === "closing"
          ? `Wrap up warmly:\n"${closingText}"`
          : `Transition warmly, then ask EXACTLY:\n"${nextQuestionText}"\n\nCRITICAL: 2 sentences max.`;
    } else {
      mode = "advance_after_retry";
      extraDirective =
        nextStage === "closing"
          ? `Wrap up the interview warmly:\n"${closingText}"`
          : `Move naturally to next question. Ask EXACTLY:\n"${nextQuestionText}"\n\nCRITICAL: 2 sentences max.`;
    }
  } else if (nextStage === "closing" && state.followUpAction === null) {
    mode = "closing";
    extraDirective = `Acknowledge briefly, then close:\n"${closingText}"\n\nTotal response: 2 sentences maximum.`;
  } else {
    mode = "main_question";
    extraDirective = `
Acknowledge the last answer in ONE short, genuine phrase.

Then ask EXACTLY — copy word for word:
"${nextQuestionFull}"

CRITICAL: 2 sentences max. Do not paraphrase.
`;
  }

  return {
    prompt: `
Candidate name: ${candidateName || "Candidate"}

Stage: ${currentStage} | Mode: ${mode} | Action: ${state.followUpAction ?? "none"} | Reason: ${state.followUpReason ?? "none"}
Retries: ${state.retriesOnCurrentQuestion}/${MAX_RETRIES_PER_QUESTION}

Last answer (${lastAnswer.wordCount} words): ${lastAnswer.raw || "(none)"}
Profile: vague=${lastAnswer.soundsVague} | confused=${lastAnswer.isConfusion} | nonAnswer=${lastAnswer.isNonAnswer} | veryShort=${lastAnswer.isVeryShort} | veryLong=${lastAnswer.isVeryLong}

Transcript:
${transcript}

Instructions:
${extraDirective}

OUTPUT RULES:
- Maya's next response only
- Plain text only
- Maximum 2 sentences
- Do NOT ask more than one question
- For retry_same modes: repeat the CURRENT question, never the next one
`,
    mode,
  };
}

const SYSTEM_PROMPT = `You are Maya, a warm and genuinely caring senior interviewer at Cuemath.

You are conducting a short screening interview with a FIXED set of questions in a FIXED ORDER.

ABSOLUTE RULES:
1. Ask EXACTLY the question text given in Instructions
2. Maximum 2 sentences per response
3. Never ask multiple questions in one turn
4. Stay warm and human
5. Never jump ahead
6. For retry_same: re-ask the SAME current question
7. For advance: ask the NEXT question`;

function detectCompletion(
  text: string,
  mode: string,
  state: InterviewState
): boolean {
  const stageBasedClosing =
    mode === "closing" ||
    (mode === "advance_after_retry" &&
      nextMainStage(state.currentStage) === "closing") ||
    (mode === "advance_skip_requested" &&
      nextMainStage(state.currentStage) === "closing") ||
    (mode === "advance_after_off_topic" &&
      nextMainStage(state.currentStage) === "closing") ||
    (mode === "advance_after_tangent" &&
      nextMainStage(state.currentStage) === "closing") ||
    (mode === "main_question" &&
      nextMainStage(state.currentStage) === "closing") ||
    state.currentStage === "closing";

  if (!stageBasedClosing) return false;

  const lower = normalizeApostrophes(text).toLowerCase();
  return (
    lower.includes("we'll be in touch") ||
    lower.includes("we will be in touch") ||
    lower.includes("next steps") ||
    lower.includes("best of luck") ||
    lower.includes("rooting for you") ||
    lower.includes("really enjoyed getting to know you")
  );
}

// ─── Groq call ────────────────────────────────────────────────────────────────

async function callGroq(
  model: string,
  systemPrompt: string,
  userPrompt: string,
  maxTokens = 130,
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
      throw new Error(`groq_${res.status}: ${errBody.slice(0, 200)}`);
    }

    const data = (await res.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const text = data?.choices?.[0]?.message?.content?.trim() ?? "";
    if (!text) throw new Error("Empty response from Groq");
    return text;
  } catch (error) {
    if (isAbortError(error)) {
      throw new Error(`model_timeout_${timeoutMs}ms`);
    }
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
    const rawBody = (await req.json()) as unknown;

    let normalized: NormalizedRequestBody;
    try {
      normalized = getSafeRequestBody(rawBody);
    } catch (validationError) {
      const msg = getErrorMessage(validationError);
      console.error("❌ Chat validation failed:", msg);
      console.error("   Body sample:", JSON.stringify(rawBody)?.slice(0, 300));
      return NextResponse.json(
        { error: `Validation: ${msg}`, code: "BAD_REQUEST" },
        { status: 400 }
      );
    }

    const {
      messages,
      candidateName,
      clientQuestionCount,
      clientRetryCount,
      beginInterview,
    } = normalized;

    const state = getInterviewState(
      messages,
      clientQuestionCount,
      clientRetryCount,
      beginInterview
    );
    const { prompt, mode } = buildAdaptiveInstruction(
      candidateName,
      messages,
      state,
      beginInterview
    );

    const deterministicRetryText = buildDeterministicRetryResponse(
      mode,
      state.currentStage,
      candidateName
    );

    if (deterministicRetryText) {
      const text = enforceCorrectQuestion(
        deterministicRetryText,
        mode,
        state,
        candidateName
      );
      const isComplete = detectCompletion(text, mode, state);
      return NextResponse.json({
        text,
        isComplete,
        isFollowUp: true,
        source: "deterministic_retry",
        code: "OK",
      });
    }

    let lastError: unknown = null;

    for (const model of MODELS) {
      try {
        console.log(
          `🔄 Chat model=${model} mode=${mode} stage=${state.currentStage} action=${state.followUpAction}`
        );
        const rawText = await callGroq(
          model,
          SYSTEM_PROMPT,
          prompt,
          130,
          0.55,
          MODEL_TIMEOUT_MS
        );
        const text = enforceCorrectQuestion(rawText, mode, state, candidateName);
        const isComplete = detectCompletion(text, mode, state);
        const isFollowUp = state.followUpAction === "retry_same";

        return NextResponse.json({
          text,
          isComplete,
          isFollowUp,
          source: "groq",
          code: "OK",
        });
      } catch (error: unknown) {
        lastError = error;
        const message = getErrorMessage(error);

        if (isQuotaError(message)) {
          console.warn(`⚠️ Chat ${model} rate limited`);
          await sleep(1200);
          continue;
        }

        if (isTemporaryError(message) || isTimeoutError(message)) {
          console.warn(`⚠️ Chat ${model} temporary failure: ${message}`);
          await sleep(1200);
          continue;
        }

        console.error(`❌ Chat ${model}:`, message);
        break;
      }
    }

    const errMsg = getErrorMessage(lastError);
    console.error("❌ All chat models failed:", errMsg);

    return NextResponse.json({
      error: "Service temporarily unavailable",
      code: "CHAT_UNAVAILABLE",
      text: "I'm sorry — I'm having a little trouble right now. Please try again in just a moment.",
      isComplete: false,
      isFollowUp: false,
      source: "fallback",
    });
  } catch (error: unknown) {
    const errMsg = getErrorMessage(error);
    console.error("❌ Fatal chat error:", errMsg);
    return NextResponse.json(
      { error: "Internal server error", code: "INTERNAL_ERROR" },
      { status: 500 }
    );
  }
}