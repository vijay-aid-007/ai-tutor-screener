import { NextRequest, NextResponse } from "next/server";

// ─── Groq API (same provider as chat — no Gemini dependency) ─────────────────
const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";
// Order: best quality first, fastest/most-available last
const GROQ_ASSESS_MODELS = [
  "llama-3.3-70b-versatile",   // Primary: highest quality for assessment
  "llama-3.1-8b-instant",      // Fallback: fastest, most quota-friendly
];
const MODEL_TIMEOUT_MS = 25000; // Assessment needs more tokens → longer timeout
const RATE_LIMIT_BASE_DELAY_MS = 1200;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function normalizeText(text: string) {
  return text.toLowerCase().replace(/\s+/g, " ").trim();
}

function getWordCount(text: string) {
  return normalizeText(text).split(" ").filter(Boolean).length;
}

function clamp(n: number, min = 1, max = 10) {
  return Math.max(min, Math.min(max, n));
}

function average(nums: number[]) {
  if (!nums.length) return 0;
  return nums.reduce((a, b) => a + b, 0) / nums.length;
}

function safeEvidence(answer?: string): string {
  const text = (answer || "").trim();
  if (!text) return "Insufficient evidence from transcript";
  if (text.length <= 200) return text;
  const w = text.slice(0, 200);
  const lastPeriod = Math.max(w.lastIndexOf("."), w.lastIndexOf("!"), w.lastIndexOf("?"));
  if (lastPeriod > 80) return text.slice(0, lastPeriod + 1);
  const lastSpace = w.lastIndexOf(" ");
  return lastSpace > 0 ? text.slice(0, lastSpace) + "…" : w + "…";
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  try { return JSON.stringify(error); } catch { return String(error); }
}

function isQuotaError(message: string) {
  const m = message.toLowerCase();
  return m.includes("429") || m.includes("rate_limit") || m.includes("quota") ||
    m.includes("too many requests") || m.includes("rate limit") ||
    m.includes("resource_exhausted") || m.includes("exhausted");
}

function isTemporaryError(message: string) {
  const m = message.toLowerCase();
  return m.includes("503") || m.includes("unavailable") || m.includes("timeout") || m.includes("fetch failed");
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

function trimTranscript(text: string, maxChars = 12000) {
  return text.length > maxChars ? text.slice(-maxChars) : text;
}

function isGreetingOnly(text: string, candidateName: string) {
  const t = normalizeText(text);
  const name = normalizeText(candidateName);
  const patterns = [
    `hi my name is ${name}`, `hello my name is ${name}`,
    `hi i am ${name}`, `hello i am ${name}`, `my name is ${name}`,
  ];
  return patterns.some((p) => t === p || t === `${p}.`);
}

function isNonAnswer(text: string) {
  const t = normalizeText(text);
  const exact = new Set([
    "i don't know", "i dont know", "dont know", "do not know", "idk",
    "not sure", "no idea", "i have no idea", "can't say", "cannot say",
    "nothing", "no", "nope", "nah", "skip", "pass",
    "i don't know about that", "i dont know about that",
    "no response", "[no response]", "(no verbal response given)",
  ]);
  const strongPatterns = [
    "don't know", "dont know", "not sure", "no idea", "i have no idea",
    "cannot say", "can't say", "not familiar", "unfamiliar", "no response",
  ];
  return (
    exact.has(t) ||
    strongPatterns.some((p) => t.includes(p)) ||
    (getWordCount(t) <= 6 && (t === "no" || t === "nothing" || t === "idk"))
  );
}

function isConfusionText(text: string) {
  const t = normalizeText(text);
  return (
    t.includes("didn't understand") || t.includes("did not understand") ||
    t.includes("don't understand") || t.includes("do not understand") ||
    t.includes("not understand") || t.includes("i am confused") ||
    t.includes("i'm confused") || t.includes("confused") ||
    t.includes("can you repeat") || t.includes("repeat the question") ||
    t.includes("say again") || t.includes("what do you mean")
  );
}

// ─── Groq API call ────────────────────────────────────────────────────────────

async function callGroq(
  model: string,
  systemPrompt: string,
  userPrompt: string,
  maxTokens = 1500,
  temperature = 0.2,
  timeoutMs = MODEL_TIMEOUT_MS
): Promise<string> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new Error("GROQ_API_KEY not configured");

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(GROQ_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
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

// ─── Fallback report builder ──────────────────────────────────────────────────

function buildStrengths(totalAnswers: number, validAnswers: string[], avgWordsValid: number, nonAnswerRate: number) {
  const strengths: string[] = [];
  if (validAnswers.length >= 3 && avgWordsValid >= 10) strengths.push("Provided multiple interpretable responses");
  if (avgWordsValid >= 12) strengths.push("Showed some ability to elaborate when answering");
  if (totalAnswers >= 5 && nonAnswerRate < 0.5) strengths.push("Completed the full interview flow");
  if (strengths.length === 0) strengths.push("Limited usable evidence was captured");
  return strengths.slice(0, 3);
}

function buildConcerns(totalAnswers: number, nonAnswerRate: number, avgWordsAll: number, validAnswers: string[], severeLowEvidence: boolean) {
  const concerns: string[] = [];
  if (totalAnswers === 0) concerns.push("No usable candidate responses were captured");
  if (severeLowEvidence) {
    concerns.push("The interview contained mostly non-answers or insufficient verbal evidence");
  } else if (nonAnswerRate >= 0.5) {
    concerns.push("Multiple responses were non-answers or too brief for reliable evaluation");
  }
  if (avgWordsAll < 6) concerns.push("Limited verbal depth reduced confidence in scoring");
  if (validAnswers.length < 2) concerns.push("There was insufficient evidence of tutoring communication ability");
  concerns.push("Assessment generated from fallback mode — manual review recommended");
  return concerns.slice(0, 3);
}

function sanitizeWeakAssessment(candidateName: string, normalized: Record<string, unknown>) {
  const dimensions = (normalized.dimensions ?? {}) as Record<string, { score?: number; evidence?: string }>;
  const evidenceTexts = [
    dimensions.communication_clarity?.evidence,
    dimensions.warmth?.evidence,
    dimensions.patience?.evidence,
    dimensions.ability_to_simplify?.evidence,
    dimensions.english_fluency?.evidence,
  ].filter(Boolean).map((x) => normalizeText(x as string));

  const weakEvidenceCount = evidenceTexts.filter(
    (t) => isNonAnswer(t) || isConfusionText(t) || getWordCount(t) <= 2
  ).length;

  if (weakEvidenceCount < 4) return normalized;

  return {
    ...normalized,
    recommendation: "REJECT" as const,
    overall_score: Math.min(Number(normalized.overall_score ?? 2), 2),
    summary: `${candidateName} was unable to provide enough meaningful responses for evaluation. The transcript contains mostly non-answers or insufficient verbal evidence, so this assessment is intentionally conservative and the candidate is not recommended to proceed.`,
    dimensions: {
      communication_clarity: { score: Math.min(Number(dimensions.communication_clarity?.score ?? 2), 2), evidence: dimensions.communication_clarity?.evidence ?? "Insufficient evidence from transcript" },
      warmth: { score: Math.min(Number(dimensions.warmth?.score ?? 3), 3), evidence: dimensions.warmth?.evidence ?? "Insufficient evidence from transcript" },
      patience: { score: Math.min(Number(dimensions.patience?.score ?? 3), 3), evidence: dimensions.patience?.evidence ?? "Insufficient evidence from transcript" },
      ability_to_simplify: { score: Math.min(Number(dimensions.ability_to_simplify?.score ?? 2), 2), evidence: dimensions.ability_to_simplify?.evidence ?? "Insufficient evidence from transcript" },
      english_fluency: { score: Math.min(Number(dimensions.english_fluency?.score ?? 2), 2), evidence: dimensions.english_fluency?.evidence ?? "Insufficient evidence from transcript" },
    },
    strengths: ["Limited usable evidence was captured"],
    concerns: [
      "The interview contained mostly non-answers or insufficient verbal evidence",
      "There was insufficient evidence of tutoring communication ability",
      "Manual review confirms the candidate should not proceed without stronger responses",
    ],
  };
}

function pickEvidence(validAnswers: string[], realAnswers: string[], usedIndices: Set<number>): string {
  for (let i = 0; i < validAnswers.length; i++) {
    if (!usedIndices.has(i)) { usedIndices.add(i); return validAnswers[i]; }
  }
  for (let i = 0; i < realAnswers.length; i++) {
    if (!usedIndices.has(1000 + i)) { usedIndices.add(1000 + i); return realAnswers[i]; }
  }
  return validAnswers[0] || realAnswers[0] || "";
}

function getMostFluentAnswer(validAnswers: string[], realAnswers: string[]): string {
  const pool = validAnswers.length > 0 ? validAnswers : realAnswers;
  if (!pool.length) return "";
  return pool.reduce((best, a) => (getWordCount(a) > getWordCount(best) ? a : best), pool[0]);
}

function generateFallbackReport(transcript: string, candidateName: string) {
  const candidateLines = transcript
    .split("\n\n")
    .filter((line) => line.startsWith("Candidate:"))
    .map((line) => line.replace(/^Candidate:\s*/, "").trim())
    .filter(Boolean);

  const realAnswers = candidateLines.filter((answer) => !isGreetingOnly(answer, candidateName));
  const totalAnswers = realAnswers.length;
  const nonAnswers = realAnswers.filter((a) => isNonAnswer(a) || isConfusionText(a));
  const validAnswers = realAnswers.filter((a) => !isNonAnswer(a) && !isConfusionText(a));

  const nonAnswerRate = totalAnswers > 0 ? nonAnswers.length / totalAnswers : 1;
  const avgWordsAll = totalAnswers > 0 ? average(realAnswers.map(getWordCount)) : 0;
  const avgWordsValid = validAnswers.length > 0 ? average(validAnswers.map(getWordCount)) : 0;

  const severeLowEvidence =
    totalAnswers === 0 ||
    nonAnswerRate >= 0.8 ||
    (validAnswers.length === 0 && totalAnswers >= 3) ||
    (validAnswers.length <= 1 && avgWordsAll < 4);

  const lowEvidence = nonAnswerRate >= 0.6 || validAnswers.length < 2 || avgWordsAll < 5;

  let clarityScore = clamp(Math.round((avgWordsValid >= 18 ? 7 : avgWordsValid >= 10 ? 5 : avgWordsValid >= 5 ? 3 : 2) - nonAnswerRate * 4));
  let fluencyScore = clamp(Math.round((avgWordsAll >= 12 ? 7 : avgWordsAll >= 7 ? 5 : avgWordsAll >= 3 ? 3 : 2) - nonAnswerRate * 3));
  let simplicityScore = clamp(Math.round((validAnswers.length >= 2 && avgWordsValid >= 10 ? 6 : validAnswers.length >= 1 ? 4 : 2) - nonAnswerRate * 3));
  let warmthScore = clamp(Math.round((validAnswers.length >= 2 ? 5 : 3) - nonAnswerRate * 2));
  let patienceScore = clamp(Math.round((validAnswers.length >= 2 ? 5 : 3) - nonAnswerRate * 2));

  if (severeLowEvidence) {
    clarityScore = Math.min(clarityScore, 2); fluencyScore = Math.min(fluencyScore, 2);
    simplicityScore = Math.min(simplicityScore, 2); warmthScore = Math.min(warmthScore, 3); patienceScore = Math.min(patienceScore, 3);
  } else if (lowEvidence) {
    clarityScore = Math.min(clarityScore, 4); fluencyScore = Math.min(fluencyScore, 4);
    simplicityScore = Math.min(simplicityScore, 4); warmthScore = Math.min(warmthScore, 5); patienceScore = Math.min(patienceScore, 5);
  }

  let overall = clamp(Math.round((clarityScore + fluencyScore + simplicityScore + warmthScore + patienceScore) / 5));
  if (severeLowEvidence) overall = Math.min(overall, 2);
  else if (lowEvidence) overall = Math.min(overall, 4);

  const recommendation: "PROCEED" | "CONSIDER" | "REJECT" =
    severeLowEvidence ? "REJECT" :
    lowEvidence ? (overall >= 5 ? "CONSIDER" : "REJECT") :
    overall >= 7 ? "PROCEED" : overall >= 5 ? "CONSIDER" : "REJECT";

  const summary = severeLowEvidence
    ? `${candidateName} was unable to provide enough meaningful responses for evaluation. The transcript contains mostly non-answers or insufficient verbal evidence, so this assessment is intentionally conservative and the candidate is not recommended to proceed.`
    : lowEvidence
    ? `${candidateName} participated in the interview, but the available responses were too limited for a confident skills assessment. Manual review is possible, but the current evidence does not strongly support progression.`
    : `${candidateName} completed the interview with mixed response quality. This fallback report is based on observable response depth and consistency, so manual review is recommended for final judgment.`;

  const usedIndices = new Set<number>();
  const mostFluentAnswer = getMostFluentAnswer(validAnswers, realAnswers);

  return {
    candidate_name: candidateName,
    recommendation,
    overall_score: overall,
    summary,
    dimensions: {
      communication_clarity: { score: clarityScore, evidence: safeEvidence(pickEvidence(validAnswers, realAnswers, usedIndices)) },
      warmth: { score: warmthScore, evidence: safeEvidence(pickEvidence(validAnswers, realAnswers, usedIndices)) },
      patience: { score: patienceScore, evidence: safeEvidence(pickEvidence(validAnswers, realAnswers, usedIndices)) },
      ability_to_simplify: { score: simplicityScore, evidence: safeEvidence(pickEvidence(validAnswers, realAnswers, usedIndices)) },
      english_fluency: { score: fluencyScore, evidence: safeEvidence(mostFluentAnswer) },
    },
    strengths: buildStrengths(totalAnswers, validAnswers, avgWordsValid, nonAnswerRate),
    concerns: buildConcerns(totalAnswers, nonAnswerRate, avgWordsAll, validAnswers, severeLowEvidence),
    interviewer_notes: `Fallback report. totalAnswers=${totalAnswers}, validAnswers=${validAnswers.length}, nonAnswerRate=${nonAnswerRate.toFixed(2)}, avgWordsAll=${avgWordsAll.toFixed(1)}, avgWordsValid=${avgWordsValid.toFixed(1)}, severeLowEvidence=${severeLowEvidence}. Use as a strict conservative backup only when AI assessment is unavailable.`,
  };
}

function sanitizeAssessment(candidateName: string, parsed: Record<string, unknown>) {
  const safeDimensions = (parsed?.dimensions ?? {}) as Record<string, { score?: number; evidence?: string }>;

  const normalized: Record<string, unknown> = {
    candidate_name: parsed?.candidate_name || candidateName,
    recommendation:
      parsed?.recommendation === "PROCEED" || parsed?.recommendation === "CONSIDER" || parsed?.recommendation === "REJECT"
        ? parsed.recommendation : "CONSIDER",
    overall_score: clamp(Number(parsed?.overall_score ?? 5)),
    summary:
      typeof parsed?.summary === "string" && (parsed.summary as string).trim()
        ? (parsed.summary as string).trim()
        : `${candidateName} completed the interview. Manual review is recommended.`,
    dimensions: {
      communication_clarity: { score: clamp(Number(safeDimensions?.communication_clarity?.score ?? 5)), evidence: safeEvidence(safeDimensions?.communication_clarity?.evidence) },
      warmth: { score: clamp(Number(safeDimensions?.warmth?.score ?? 5)), evidence: safeEvidence(safeDimensions?.warmth?.evidence) },
      patience: { score: clamp(Number(safeDimensions?.patience?.score ?? 5)), evidence: safeEvidence(safeDimensions?.patience?.evidence) },
      ability_to_simplify: { score: clamp(Number(safeDimensions?.ability_to_simplify?.score ?? 5)), evidence: safeEvidence(safeDimensions?.ability_to_simplify?.evidence) },
      english_fluency: { score: clamp(Number(safeDimensions?.english_fluency?.score ?? 5)), evidence: safeEvidence(safeDimensions?.english_fluency?.evidence) },
    },
    strengths: Array.isArray(parsed?.strengths)
      ? (parsed.strengths as unknown[]).filter((x) => typeof x === "string").slice(0, 3)
      : ["Manual review recommended"],
    concerns: Array.isArray(parsed?.concerns)
      ? (parsed.concerns as unknown[]).filter((x) => typeof x === "string").slice(0, 3)
      : ["Manual review recommended"],
    interviewer_notes:
      typeof parsed?.interviewer_notes === "string" && (parsed.interviewer_notes as string).trim()
        ? (parsed.interviewer_notes as string).trim()
        : "Assessment generated successfully. Manual review is advised.",
  };

  return sanitizeWeakAssessment(candidateName, normalized);
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

  let rawTranscript = "";
  let candidateName = "Candidate";

  try {
    const body = await req.json();
    rawTranscript = body?.transcript || "";
    candidateName = body?.candidateName || "Candidate";

    if (!rawTranscript || !candidateName) {
      return NextResponse.json({ error: "transcript and candidateName are required" }, { status: 400 });
    }

    const safeTranscript = trimTranscript(rawTranscript, 10000); // Groq has smaller context, trim tighter

    const systemPrompt = `You are an expert hiring assessor for Cuemath. You return ONLY valid JSON. No markdown, no backticks, no extra text. Your entire response must be a single valid JSON object.`;

    const userPrompt = `Analyze this interview transcript for ${candidateName}.

You are evaluating for:
- communication clarity
- warmth
- patience
- ability to simplify
- english fluency

Important scoring rules:
- Be strict and evidence-based.
- If the candidate mostly gives non-answers such as "no", "I don't know", "not sure", silence, or extremely brief replies, the score must be very low.
- Do not reward participation alone.
- If evidence is weak, reflect that in both scores and concerns.
- recommendation must match the evidence realistically.
- If there is severe lack of usable evidence, recommendation should be REJECT.
- Note: "(No verbal response given)" in the transcript means the candidate was silent — treat as a non-answer.
- For english_fluency evidence: pick the candidate's LONGEST or most fluent answer, not the same quote used for clarity.
- Each dimension MUST use a DIFFERENT quote from the transcript. Do not repeat the same evidence across multiple dimensions.

TRANSCRIPT:
${safeTranscript}

Return exactly this JSON structure with real assessed values. No markdown, no backticks — pure JSON only:
{
  "candidate_name": "${candidateName}",
  "recommendation": "PROCEED",
  "overall_score": 7,
  "summary": "Write 2-3 sentences summarizing the candidate overall",
  "dimensions": {
    "communication_clarity": { "score": 7, "evidence": "exact quote from transcript showing clarity" },
    "warmth": { "score": 8, "evidence": "exact quote from transcript showing warmth — must be a DIFFERENT quote from clarity" },
    "patience": { "score": 7, "evidence": "exact quote from transcript showing patience — must be a DIFFERENT quote from the above" },
    "ability_to_simplify": { "score": 6, "evidence": "exact quote from transcript showing simplification — must be a DIFFERENT quote from the above" },
    "english_fluency": { "score": 8, "evidence": "exact quote from transcript showing fluency — use candidate's most fluent/longest answer, different from above quotes" }
  },
  "strengths": ["strength 1", "strength 2", "strength 3"],
  "concerns": ["concern 1", "concern 2"],
  "interviewer_notes": "1-2 sentences of candid internal notes"
}

Rules:
- recommendation must be exactly: PROCEED, CONSIDER, or REJECT
- scores must be integers between 1-10
- evidence must be real quotes from the transcript — each dimension MUST use a DIFFERENT quote
- Replace ALL placeholders with real content
- Return pure JSON only — no markdown fences, no extra commentary`;

    let lastError: unknown = null;
    let rateLimitCount = 0;

    for (const model of GROQ_ASSESS_MODELS) {
      try {
        console.log(`🔄 Assess (Groq) model=${model}`);

        const rawText = await callGroq(model, systemPrompt, userPrompt, 1500, 0.2, MODEL_TIMEOUT_MS);

        // Strip any accidental markdown fences
        const cleanedText = rawText.replace(/```json\s*/gi, "").replace(/```\s*/g, "").trim();
        if (!cleanedText) throw new Error(`Empty response from ${model}`);

        console.log(`✅ Groq ${model} assessment response received`);

        let parsed: Record<string, unknown>;
        try {
          parsed = JSON.parse(cleanedText);
        } catch (parseError) {
          // Try to extract JSON object if there's surrounding text
          const jsonMatch = cleanedText.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            try { parsed = JSON.parse(jsonMatch[0]); }
            catch { throw new Error(`json_parse_failed: ${getErrorMessage(parseError)}`); }
          } else {
            throw new Error(`json_parse_failed: ${getErrorMessage(parseError)}`);
          }
        }

        const sanitized = sanitizeAssessment(candidateName, parsed);
        return NextResponse.json({ ...sanitized, source: "groq", model });
      } catch (error: unknown) {
        lastError = error;
        const message = getErrorMessage(error);

        if (message.startsWith("json_parse_failed")) {
          console.warn(`⚠️ Groq ${model} returned unparseable JSON — trying next model`);
          continue;
        }

        if (isQuotaError(message)) {
          rateLimitCount++;
          const delay = RATE_LIMIT_BASE_DELAY_MS * rateLimitCount;
          console.warn(`⚠️ Groq ${model} rate limited — waiting ${delay}ms before next model`);
          await sleep(delay);
          continue;
        }

        console.error(`❌ Groq assess ${model}:`, message);

        if (isTemporaryError(message) || isTimeoutError(message)) {
          await sleep(1500);
          continue;
        }

        // Unknown error — try next model
        console.warn(`⚠️ Groq ${model} unknown error — trying next model`);
        continue;
      }
    }

    const errMsg = getErrorMessage(lastError);
    console.warn("⚠️ All Groq assessment models failed — using strict fallback. Last error:", errMsg);

    const fallback = generateFallbackReport(trimTranscript(rawTranscript, 10000), candidateName);
    return NextResponse.json({ ...fallback, source: "fallback", fallbackReason: "model_failure" });
  } catch (error: unknown) {
    const errMsg = getErrorMessage(error);
    console.error("❌ Fatal assess error:", errMsg);
    try {
      const fallback = generateFallbackReport(trimTranscript(rawTranscript || "", 10000), candidateName || "Candidate");
      return NextResponse.json({ ...fallback, source: "fallback", fallbackReason: "fatal_error" });
    } catch {
      return NextResponse.json({ error: errMsg || "Assessment failed" }, { status: 500 });
    }
  }
}