import { NextRequest, NextResponse } from "next/server";

const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";
const MODELS = ["llama-3.3-70b-versatile", "llama-3.1-8b-instant"];
const MODEL_TIMEOUT_MS = 28000;
const MAX_TRANSCRIPT_LENGTH = 14000;
const MAX_NAME_LENGTH = 80;

// ─── Types ────────────────────────────────────────────────────────────────────

export type DimensionScore = {
  score: number;
  label: string;
  feedback: string;
  highlights: string[];
};

export type AssessmentResult = {
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

// ─── Helpers ──────────────────────────────────────────────────────────────────

function sleep(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms));
}

function sanitize(text: string): string {
  return text.replace(/\s+/g, " ").trim();
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  try { return JSON.stringify(error); } catch { return String(error); }
}

function isQuotaError(message: string) {
  const m = message.toLowerCase();
  return m.includes("429") || m.includes("rate_limit") || m.includes("quota") || m.includes("too many requests");
}

function isTemporaryError(message: string) {
  const m = message.toLowerCase();
  return m.includes("503") || m.includes("unavailable") || m.includes("timeout") || m.includes("fetch failed") || m.includes("network");
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

// ─── Score helpers ────────────────────────────────────────────────────────────

function scoreLabel(score: number): string {
  if (score >= 9) return "Exceptional";
  if (score >= 8) return "Excellent";
  if (score >= 7) return "Good";
  if (score >= 6) return "Satisfactory";
  if (score >= 5) return "Adequate";
  if (score >= 4) return "Needs Improvement";
  return "Poor";
}

function overallRecommendation(score: number): "Proceed" | "Consider" | "Decline" {
  if (score >= 7) return "Proceed";
  if (score >= 5) return "Consider";
  return "Decline";
}

function clampScore(n: unknown, fallback = 5): number {
  if (typeof n !== "number" || isNaN(n)) return fallback;
  return Math.min(Math.max(Math.round(n * 10) / 10, 1), 10);
}

// ─── Request validation ───────────────────────────────────────────────────────

type NormalizedRequest = {
  transcript: string;
  candidateName: string;
};

function validateRequest(body: unknown): NormalizedRequest {
  if (!body || typeof body !== "object") throw new Error("Invalid request body");

  const data = body as Record<string, unknown>;

  // transcript can come from field "transcript" directly
  const rawTranscript = data.transcript;
  if (!rawTranscript || typeof rawTranscript !== "string") {
    throw new Error("transcript must be a non-empty string");
  }
  const transcript = sanitize(rawTranscript).slice(0, MAX_TRANSCRIPT_LENGTH);
  if (transcript.length < 10) throw new Error("transcript too short");

  const candidateName =
    typeof data.candidateName === "string" && data.candidateName.trim()
      ? sanitize(data.candidateName).slice(0, MAX_NAME_LENGTH)
      : "Candidate";

  return { transcript, candidateName };
}

// ─── Fallback assessment ──────────────────────────────────────────────────────

function buildFallbackAssessment(candidateName: string, transcript: string): AssessmentResult {
  const wordCount = transcript.split(/\s+/).filter(Boolean).length;
  const hasExamples = /for example|for instance|imagine|suppose|once i/i.test(transcript);
  const hasTeachingWords = /explain|encourage|patient|listen|guide|motivate|support|analogy|simplify/i.test(transcript);
  const hasConcrete = /i would|first|then|ask|show|help|break|step/i.test(transcript);
  const hasWarmth = /warm|care|kind|empathy|understand|feel|comfortable|safe/i.test(transcript);

  // Start at 5.5 baseline — not punish short responses harshly
  let base = 5.5;
  if (wordCount > 150) base += 0.5;
  if (wordCount > 300) base += 0.5;
  if (wordCount > 500) base += 0.3;
  if (hasExamples) base += 0.5;
  if (hasTeachingWords) base += 0.4;
  if (hasConcrete) base += 0.3;
  if (hasWarmth) base += 0.3;
  const overall = Math.min(Math.round(base * 10) / 10, 8.5);

  const dim = (s: number, name: string): DimensionScore => ({
    score: Math.min(Math.max(Math.round(s * 10) / 10, 1), 10),
    label: scoreLabel(s),
    feedback: `Assessment for ${name} was generated using offline heuristics because the AI scoring service was temporarily unavailable. A manual review of the transcript is recommended.`,
    highlights: [
      "Candidate completed the interview",
      "Transcript captured successfully — manual review recommended",
    ],
  });

  return {
    candidateName,
    overallScore: overall,
    overallLabel: scoreLabel(overall),
    summary: `${candidateName} completed the Cuemath tutor screening interview. This assessment was generated in fallback mode due to a temporary AI service issue. Please review the transcript manually for accurate scoring.`,
    recommendation: overallRecommendation(overall),
    dimensions: {
      communication: dim(clampScore(overall + 0.2), "Communication"),
      warmth: dim(clampScore(overall + 0.1), "Warmth"),
      patience: dim(clampScore(overall), "Patience"),
      simplification: dim(clampScore(overall - 0.2), "Simplification"),
      fluency: dim(clampScore(overall + 0.3), "Fluency"),
    },
    strengths: [
      "Candidate completed the full screening interview",
      "Responses were captured and transcript is available for review",
      "Demonstrated willingness to engage with the interview process",
    ],
    improvements: [
      "AI-powered detailed assessment unavailable — manual review required",
      "Please schedule a follow-up assessment if AI scoring remains unavailable",
    ],
    generatedAt: new Date().toISOString(),
    _fallback: true,
  };
}

// ─── JSON extraction ──────────────────────────────────────────────────────────

function extractAndParseJSON(raw: string): unknown {
  // Direct parse first
  try { return JSON.parse(raw); } catch { /* fall through */ }

  // Find the outermost JSON object
  const start = raw.indexOf("{");
  const end = raw.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) throw new Error("No JSON object found");
  try { return JSON.parse(raw.slice(start, end + 1)); } catch {
    throw new Error(`JSON parse failed: ${raw.slice(0, 120)}`);
  }
}

// ─── Schema normalization — airtight ─────────────────────────────────────────

function normalizeDim(d: unknown, fallbackScore = 5): DimensionScore {
  const obj = (d && typeof d === "object" ? d : {}) as Record<string, unknown>;
  const score = clampScore(obj.score, fallbackScore);
  return {
    score,
    label: typeof obj.label === "string" && obj.label ? obj.label : scoreLabel(score),
    feedback: typeof obj.feedback === "string" && obj.feedback ? obj.feedback : "No detailed feedback available.",
    highlights: Array.isArray(obj.highlights)
      ? (obj.highlights as unknown[]).filter((h): h is string => typeof h === "string" && h.trim().length > 0).slice(0, 4)
      : [],
  };
}

function normalizeAssessmentResult(parsed: unknown, candidateName: string): AssessmentResult {
  if (!parsed || typeof parsed !== "object") throw new Error("Result is not an object");
  const p = parsed as Record<string, unknown>;

  const dims = (p.dimensions && typeof p.dimensions === "object" ? p.dimensions : {}) as Record<string, unknown>;

  const overallScore = clampScore(p.overallScore, 5);

  // Ensure all required dimension keys exist
  const REQUIRED_DIMS = ["communication", "warmth", "patience", "simplification", "fluency"] as const;
  for (const dim of REQUIRED_DIMS) {
    if (!dims[dim]) {
      console.warn(`⚠️ Missing dimension "${dim}" — using fallback`);
      dims[dim] = { score: overallScore, label: scoreLabel(overallScore), feedback: "Not assessed.", highlights: [] };
    }
  }

  const recommendation = (["Proceed", "Consider", "Decline"] as const).includes(
    p.recommendation as "Proceed" | "Consider" | "Decline"
  )
    ? (p.recommendation as "Proceed" | "Consider" | "Decline")
    : overallRecommendation(overallScore);

  return {
    candidateName: typeof p.candidateName === "string" && p.candidateName ? p.candidateName : candidateName,
    overallScore,
    overallLabel: typeof p.overallLabel === "string" && p.overallLabel ? p.overallLabel : scoreLabel(overallScore),
    summary: typeof p.summary === "string" && p.summary ? p.summary : `${candidateName} completed the screening interview.`,
    recommendation,
    dimensions: {
      communication: normalizeDim(dims.communication, overallScore),
      warmth: normalizeDim(dims.warmth, overallScore),
      patience: normalizeDim(dims.patience, overallScore),
      simplification: normalizeDim(dims.simplification, overallScore),
      fluency: normalizeDim(dims.fluency, overallScore),
    },
    strengths: Array.isArray(p.strengths)
      ? (p.strengths as unknown[]).filter((s): s is string => typeof s === "string" && s.trim().length > 0).slice(0, 5)
      : ["Completed the interview"],
    improvements: Array.isArray(p.improvements)
      ? (p.improvements as unknown[]).filter((s): s is string => typeof s === "string" && s.trim().length > 0).slice(0, 4)
      : [],
    generatedAt: new Date().toISOString(),
  };
}

// ─── Groq call ────────────────────────────────────────────────────────────────

async function callGroq(
  model: string,
  systemPrompt: string,
  userPrompt: string,
  maxTokens = 2000,
  temperature = 0.25,
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
        response_format: { type: "json_object" },
      }),
      signal: controller.signal,
    });

    if (!res.ok) {
      const errBody = await res.text();
      throw new Error(`groq_${res.status}: ${errBody.slice(0, 200)}`);
    }

    const data = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> };
    const text = data?.choices?.[0]?.message?.content?.trim() ?? "";
    if (!text) throw new Error("Empty Groq response");
    return text;
  } catch (error) {
    if ((error as Error)?.name === "AbortError") throw new Error(`assess_timeout_${timeoutMs}ms`);
    throw error;
  } finally {
    clearTimeout(timer);
  }
}

// ─── Prompts ──────────────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `You are an expert Cuemath hiring assessor evaluating tutor candidates from interview transcripts.

Return ONLY a valid JSON object — no markdown, no code fences, no commentary. Match this schema exactly:

{
  "candidateName": "string",
  "overallScore": number (1.0-10.0, one decimal place),
  "overallLabel": "string",
  "summary": "string (3-4 sentences, specific to this candidate)",
  "recommendation": "Proceed" | "Consider" | "Decline",
  "dimensions": {
    "communication": {
      "score": number (1-10),
      "label": "string",
      "feedback": "string (2-3 sentences, cite specific things they said)",
      "highlights": ["string", "string", "string"]
    },
    "warmth": {
      "score": number,
      "label": "string",
      "feedback": "string",
      "highlights": ["string", "string"]
    },
    "patience": {
      "score": number,
      "label": "string",
      "feedback": "string",
      "highlights": ["string", "string"]
    },
    "simplification": {
      "score": number,
      "label": "string",
      "feedback": "string",
      "highlights": ["string", "string"]
    },
    "fluency": {
      "score": number,
      "label": "string",
      "feedback": "string",
      "highlights": ["string", "string"]
    }
  },
  "strengths": ["string", "string", "string"],
  "improvements": ["string", "string"]
}

SCORING GUIDE (be fair and specific — base everything on what was actually said):
- 9-10: Exceptional
- 7-8: Strong, recommended
- 5-6: Average, needs development
- 3-4: Weak, significant gaps
- 1-2: Not suitable

DIMENSIONS:
1. Communication clarity — logical structure, clear expression
2. Warmth & empathy — encouragement, emotional intelligence
3. Patience under pressure — handling struggling students, silence
4. Simplification ability — analogies, examples, child-appropriate language
5. English fluency — grammar, vocabulary, natural expression

Be honest and specific. Reference exact things the candidate said. Do not be harsh on short answers if they show quality. Do not be lenient on long answers that are vague.`;

function buildUserPrompt(transcript: string, candidateName: string): string {
  return `Candidate name: ${candidateName}

Full interview transcript:
${transcript}

Assess this candidate across all 5 dimensions and return only the JSON object.`;
}

// ─── Route handler ────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  if (!isValidOrigin(req)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (!process.env.GROQ_API_KEY) {
    console.error("❌ GROQ_API_KEY missing");
    return NextResponse.json({ error: "API key not configured" }, { status: 500 });
  }

  let candidateName = "Candidate";
  let transcript = "";

  try {
    const rawBody = (await req.json()) as unknown;
    const validated = validateRequest(rawBody);
    candidateName = validated.candidateName;
    transcript = validated.transcript;
    console.log(`🔄 Assess: candidate="${candidateName}", transcript_chars=${transcript.length}`);
  } catch (validationError) {
    const msg = getErrorMessage(validationError);
    console.error("❌ Assess validation failed:", msg);
    return NextResponse.json({ error: `Validation failed: ${msg}`, code: "VALIDATION_ERROR" }, { status: 400 });
  }

  const systemPrompt = SYSTEM_PROMPT;
  const userPrompt = buildUserPrompt(transcript, candidateName);
  let lastError: unknown = null;

  for (const model of MODELS) {
    try {
      console.log(`🔄 Assess: trying model=${model}`);
      const rawText = await callGroq(model, systemPrompt, userPrompt, 2000, 0.25, MODEL_TIMEOUT_MS);
      const parsed = extractAndParseJSON(rawText);
      const result = normalizeAssessmentResult(parsed, candidateName);
      console.log(`✅ Assess done: overall=${result.overallScore}, rec=${result.recommendation}`);
      return NextResponse.json(result);
    } catch (error: unknown) {
      lastError = error;
      const message = getErrorMessage(error);
      if (isQuotaError(message)) {
        console.warn(`⚠️ Assess ${model} rate limited — retrying`);
        await sleep(2000);
        continue;
      }
      console.error(`❌ Assess ${model} failed:`, message);
      if (isTemporaryError(message) || message.startsWith("assess_timeout")) {
        await sleep(2000);
        continue;
      }
      break;
    }
  }

  // All models failed — return a valid fallback so the report page always works
  console.warn("⚠️ All assess models failed. Using fallback. Last error:", getErrorMessage(lastError));
  const fallback = buildFallbackAssessment(candidateName, transcript);
  return NextResponse.json(fallback);
}