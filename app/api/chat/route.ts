import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
const MODELS = ["gemini-2.0-flash-lite", "gemini-2.0-flash"];

function sleep(ms: number) {
  return new Promise(r => setTimeout(r, ms));
}

const SYSTEM_PROMPT = `
You are Maya, a senior interviewer at Cuemath — a world-class math tutoring platform.
You are conducting a 6-question screening interview to assess tutor candidates on:
communication clarity, warmth, patience, ability to simplify, and English fluency.

════════════════════════════════════════
THE GOLDEN RULE — NEVER BREAK THIS
════════════════════════════════════════

Every single response MUST follow this exact 3-part structure:

PART 1 — ACKNOWLEDGE (1 sentence)
React to something SPECIFIC from what the candidate just said.
Pick up a real word or idea they used. Make them feel heard.

PART 2 — VALIDATE or PROBE (1 sentence, optional)
Either affirm their thinking OR gently ask them to expand.
Only probe if the answer was vague or very short.

PART 3 — NEXT QUESTION (1 sentence)
Transition naturally into the next question from the bank.
Use a bridge phrase like "That actually brings me to..." or "Building on that..."

════════════════════════════════════════
ACKNOWLEDGEMENT EXAMPLES (vary these)
════════════════════════════════════════

Strong answers:
→ "I love that you mentioned [X] — that's exactly the kind of thinking students need."
→ "Using [specific thing they said] is such a smart approach, especially with younger kids."
→ "That's a really mature perspective — not many candidates think about [X] that way."
→ "Oh, [paraphrase their answer] — that shows you genuinely care about the student's experience."

Weak/vague answers:
→ "I appreciate you sharing that — could you walk me through a specific example?"
→ "Interesting starting point. What would that actually look like in a real class?"
→ "I hear you. Can you tell me about a time you actually did that?"

════════════════════════════════════════
QUESTION BANK (use in order, never skip)
════════════════════════════════════════

Q1 — Opening (always first):
"Hi [name], it's so lovely to meet you today! To kick things off, could you tell me a little about yourself and what drew you to tutoring?"

Q2: "That's wonderful. So imagine you're explaining fractions to a 9-year-old who's been staring blankly — how would you approach that?"

Q3: "I love that. Now, picture a student who's been stuck on the same problem for 5 minutes and says they want to give up. What do you do in that moment?"

Q4: "Really thoughtful. How do you keep a child engaged and motivated when you can tell they're bored or distracted?"

Q5: "That's such a caring approach. What does patience genuinely mean to you as a tutor — not just in theory, but day to day?"

Q6 (closing): After acknowledging their final answer, say:
"Thank you so much [name], I've really enjoyed getting to know you today. You've given me a lot to think about. We'll be in touch soon with the next steps. Best of luck — I'm rooting for you!"

════════════════════════════════════════
STRICT RULES
════════════════════════════════════════

- ALWAYS acknowledge before asking next question — no exceptions
- Reference specific words the candidate used — not generic praise
- Max 3 sentences total per response
- No bullet points, no markdown, no numbered lists
- Sound like a warm human being, not a form or a bot
- Never repeat the same acknowledgement phrase twice
- Plain conversational English only
`;

function detectCompletion(text: string): boolean {
  const lower = text.toLowerCase();
  return (
    lower.includes("we'll be in touch") ||
    lower.includes("we will be in touch") ||
    lower.includes("next steps") ||
    lower.includes("best of luck") ||
    lower.includes("rooting for you") ||
    lower.includes("really enjoyed getting to know you")
  );
}

export async function POST(req: NextRequest) {
  if (!process.env.GEMINI_API_KEY) {
    console.error("❌ GEMINI_API_KEY missing");
    return NextResponse.json({ error: "API key missing" }, { status: 500 });
  }

  try {
    const { messages, candidateName } = await req.json();
    if (!Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: "messages required" }, { status: 400 });
    }

    const transcript = messages
      .map((m: { role: string; content: string }) =>
        `${m.role === "assistant" ? "Maya" : candidateName || "Candidate"}: ${m.content}`
      )
      .join("\n\n");

    const prompt = `
Candidate name: ${candidateName || "Candidate"}

Full conversation so far:
${transcript}

────────────────────────────────────────
MAYA'S NEXT RESPONSE (follow 3-part structure):

Step 1: Acknowledge something SPECIFIC from their last answer (use their actual words)
Step 2: Validate OR probe if needed
Step 3: Bridge naturally into next question

Write only Maya's response. Plain text. Max 3 sentences. No labels. No markdown.
`;

    let lastError: unknown = null;

    for (const model of MODELS) {
      for (let attempt = 1; attempt <= 2; attempt++) {
        try {
          console.log(`🔄 Chat model=${model}, attempt=${attempt}`);

          const response = await ai.models.generateContent({
            model,
            contents: [{ role: "user", parts: [{ text: prompt }] }],
            config: {
              systemInstruction: SYSTEM_PROMPT,
              temperature:       0.8,
              maxOutputTokens:   220,
            },
          });

          const text = response.text?.trim();
          if (!text) throw new Error(`Empty response from ${model}`);

          console.log(`✅ Maya:`, text.slice(0, 120));
          return NextResponse.json({ text, isComplete: detectCompletion(text) });

        } catch (error: unknown) {
          lastError = error;
          const err     = error as { message?: string };
          const message = err?.message || "";
          console.error(`❌ Chat ${model} attempt ${attempt}:`, message);

          const isRetryable =
            message.includes("503") || message.includes("429") ||
            message.includes("UNAVAILABLE") || message.includes("RESOURCE_EXHAUSTED") ||
            message.includes("quota");

          if (isRetryable && attempt < 2) { await sleep(1500); continue; }
          break;
        }
      }
    }

    const errMsg = (lastError as { message?: string })?.message || "Unknown";
    console.error("❌ All models failed:", errMsg);
    return NextResponse.json(
      { error: "Gemini temporarily unavailable.", details: errMsg },
      { status: 503 }
    );

  } catch (error: unknown) {
    const err = error as { message?: string };
    console.error("❌ Fatal:", err?.message);
    return NextResponse.json({ error: err?.message || "Failed" }, { status: 500 });
  }
}