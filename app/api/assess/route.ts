// import { NextRequest, NextResponse } from "next/server";
// import { GoogleGenAI } from "@google/genai";

// const ai = new GoogleGenAI({
//   apiKey: process.env.GEMINI_API_KEY!,
// });

// const MODELS = ["gemini-2.0-flash-lite", "gemini-2.0-flash"];

// function sleep(ms: number) {
//   return new Promise((resolve) => setTimeout(resolve, ms));
// }

// export async function POST(req: NextRequest) {
//   if (!process.env.GEMINI_API_KEY) {
//     console.error("❌ GEMINI_API_KEY missing");
//     return NextResponse.json(
//       { error: "API key missing" },
//       { status: 500 }
//     );
//   }

//   try {
//     const { transcript, candidateName } = await req.json();

//     if (!transcript || !candidateName) {
//       return NextResponse.json(
//         { error: "transcript and candidateName are required" },
//         { status: 400 }
//       );
//     }

//     const prompt = `You are an expert hiring assessor for Cuemath.
// Analyze this interview transcript for ${candidateName}.
// Return ONLY a valid JSON object. No markdown, no backticks, no extra text.

// TRANSCRIPT:
// ${transcript}

// Return exactly this JSON structure with real assessed values:
// {
//   "candidate_name": "${candidateName}",
//   "recommendation": "PROCEED",
//   "overall_score": 7,
//   "summary": "Write 2-3 sentences summarizing the candidate overall",
//   "dimensions": {
//     "communication_clarity": { "score": 7, "evidence": "exact quote from transcript" },
//     "warmth": { "score": 8, "evidence": "exact quote from transcript" },
//     "patience": { "score": 7, "evidence": "exact quote from transcript" },
//     "ability_to_simplify": { "score": 6, "evidence": "exact quote from transcript" },
//     "english_fluency": { "score": 8, "evidence": "exact quote from transcript" }
//   },
//   "strengths": ["strength 1", "strength 2", "strength 3"],
//   "concerns": ["concern 1", "concern 2"],
//   "interviewer_notes": "1-2 sentences of candid internal notes"
// }

// Strict rules:
// - recommendation must be exactly one of: PROCEED, CONSIDER, REJECT
// - all scores must be numbers between 1 and 10
// - evidence must be real quotes from the transcript above
// - Replace every placeholder with real content
// - Return pure JSON only — no extra words before or after`;

//     let lastError: unknown = null;

//     for (const model of MODELS) {
//       for (let attempt = 1; attempt <= 2; attempt++) {
//         try {
//           console.log(`🔄 Assess model=${model}, attempt=${attempt}`);

//           const response = await ai.models.generateContent({
//             model,
//             contents: [{ role: "user", parts: [{ text: prompt }] }],
//             config: {
//               temperature: 0.2,
//               maxOutputTokens: 1000,
//             },
//           });

//           let text = response.text ?? "";

//           // Strip markdown fences if Gemini adds them
//           text = text
//             .replace(/```json/gi, "")
//             .replace(/```/g, "")
//             .trim();

//           if (!text) {
//             throw new Error(`Empty assessment from ${model}`);
//           }

//           console.log("✅ Assessment raw:", text.slice(0, 200));

//           const parsed = JSON.parse(text);
//           return NextResponse.json(parsed);

//         } catch (error: unknown) {
//           lastError = error;
//           const err = error as { message?: string };
//           const message = err?.message || "";

//           console.error(
//             `❌ Assess error ${model} attempt ${attempt}:`,
//             message
//           );

//           const isRetryable =
//             message.includes("503") ||
//             message.includes("429") ||
//             message.includes("RESOURCE_EXHAUSTED") ||
//             message.includes("UNAVAILABLE") ||
//             message.includes("quota");

//           if (isRetryable && attempt < 2) {
//             console.log("⏳ Retrying assess in 2s...");
//             await sleep(2000);
//             continue;
//           }

//           // Non-retryable — break inner, try next model
//           break;
//         }
//       }
//     }

//     const errMsg =
//       (lastError as { message?: string })?.message || "Unknown error";
//     console.error("❌ All assess models failed:", errMsg);

//     return NextResponse.json(
//       {
//         error: "Assessment failed",
//         details: errMsg,
//       },
//       { status: 503 }
//     );

//   } catch (error: unknown) {
//     const err = error as { message?: string };
//     console.error("❌ Fatal assess error:", err?.message || error);
//     return NextResponse.json(
//       { error: err?.message || "Assessment failed" },
//       { status: 500 }
//     );
//   }
// }


import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
const MODELS = ["gemini-2.0-flash-lite", "gemini-2.0-flash"];

function sleep(ms: number) {
  return new Promise(r => setTimeout(r, ms));
}

// ✅ Fallback: generate report from transcript without AI
function generateFallbackReport(transcript: string, candidateName: string) {
  const lines = transcript.split("\n\n").filter(l => l.startsWith("Candidate:"));
  const answers = lines.map(l => l.replace("Candidate:", "").trim());
  const totalWords = answers.join(" ").split(" ").length;
  const avgWords = answers.length > 0 ? Math.round(totalWords / answers.length) : 0;

  // Score based on answer length and count
  const fluencyScore    = Math.min(10, Math.max(4, Math.round(avgWords / 4)));
  const clarityScore    = Math.min(10, Math.max(4, answers.length >= 4 ? 7 : 5));
  const warmthScore     = 6;
  const patienceScore   = 6;
  const simplicityScore = Math.min(10, Math.max(4, avgWords > 15 ? 7 : 5));
  const overall         = Math.round((fluencyScore + clarityScore + warmthScore + patienceScore + simplicityScore) / 5);

  const recommendation  = overall >= 7 ? "PROCEED" : overall >= 5 ? "CONSIDER" : "REJECT";

  const firstAnswer = answers[0] || "No response recorded";
  const secondAnswer = answers[1] || "No response recorded";

  return {
    candidate_name: candidateName,
    recommendation,
    overall_score: overall,
    summary: `${candidateName} completed the interview with ${answers.length} responses averaging ${avgWords} words each. This is a preliminary assessment generated from response patterns.`,
    dimensions: {
      communication_clarity: {
        score: clarityScore,
        evidence: firstAnswer.slice(0, 120),
      },
      warmth: {
        score: warmthScore,
        evidence: secondAnswer.slice(0, 120),
      },
      patience: {
        score: patienceScore,
        evidence: answers[2]?.slice(0, 120) || "Insufficient data",
      },
      ability_to_simplify: {
        score: simplicityScore,
        evidence: answers[3]?.slice(0, 120) || "Insufficient data",
      },
      english_fluency: {
        score: fluencyScore,
        evidence: firstAnswer.slice(0, 120),
      },
    },
    strengths: [
      answers.length >= 5 ? "Completed full interview flow" : "Engaged with the interview",
      avgWords > 20 ? "Provided detailed responses" : "Responded to all questions",
      "Demonstrated willingness to participate",
    ],
    concerns: [
      "Assessment generated from fallback mode — AI scoring unavailable",
      avgWords < 10 ? "Responses were brief — deeper evaluation recommended" : "Manual review recommended for accuracy",
    ],
    interviewer_notes: `Fallback report. ${answers.length} candidate responses captured. Manual human review strongly recommended before making hiring decisions.`,
  };
}

export async function POST(req: NextRequest) {
  if (!process.env.GEMINI_API_KEY) {
    console.error("❌ GEMINI_API_KEY missing");
    return NextResponse.json({ error: "API key missing" }, { status: 500 });
  }

  try {
    const { transcript, candidateName } = await req.json();

    if (!transcript || !candidateName) {
      return NextResponse.json(
        { error: "transcript and candidateName are required" },
        { status: 400 }
      );
    }

    const prompt = `You are an expert hiring assessor for Cuemath.
Analyze this interview transcript for ${candidateName}.
Return ONLY a valid JSON object. No markdown, no backticks, no extra text.

TRANSCRIPT:
${transcript}

Return exactly this JSON structure with real assessed values:
{
  "candidate_name": "${candidateName}",
  "recommendation": "PROCEED",
  "overall_score": 7,
  "summary": "Write 2-3 sentences summarizing the candidate overall",
  "dimensions": {
    "communication_clarity": { "score": 7, "evidence": "exact quote from transcript" },
    "warmth": { "score": 8, "evidence": "exact quote from transcript" },
    "patience": { "score": 7, "evidence": "exact quote from transcript" },
    "ability_to_simplify": { "score": 6, "evidence": "exact quote from transcript" },
    "english_fluency": { "score": 8, "evidence": "exact quote from transcript" }
  },
  "strengths": ["strength 1", "strength 2", "strength 3"],
  "concerns": ["concern 1", "concern 2"],
  "interviewer_notes": "1-2 sentences of candid internal notes"
}

Rules:
- recommendation must be exactly: PROCEED, CONSIDER, or REJECT
- scores must be numbers between 1-10
- evidence must be real quotes from the transcript
- Replace ALL placeholders with real content
- Return pure JSON only`;

    let lastError: unknown = null;

    for (const model of MODELS) {
      for (let attempt = 1; attempt <= 2; attempt++) {
        try {
          console.log(`🔄 Assess model=${model}, attempt=${attempt}`);

          const response = await ai.models.generateContent({
            model,
            contents: [{ role: "user", parts: [{ text: prompt }] }],
            config: { temperature: 0.2, maxOutputTokens: 1000 },
          });

          let text = response.text ?? "";
          text = text.replace(/```json/gi, "").replace(/```/g, "").trim();

          if (!text) throw new Error(`Empty response from ${model}`);

          console.log("✅ Assessment:", text.slice(0, 150));
          const parsed = JSON.parse(text);
          return NextResponse.json(parsed);

        } catch (error: unknown) {
          lastError = error;
          const err = error as { message?: string };
          const message = err?.message || "";

          console.error(`❌ Assess ${model} attempt ${attempt}:`, message);

          const isRetryable =
            message.includes("503") ||
            message.includes("429") ||
            message.includes("RESOURCE_EXHAUSTED") ||
            message.includes("UNAVAILABLE") ||
            message.includes("quota");

          if (isRetryable && attempt < 2) {
            console.log("⏳ Retrying in 2s...");
            await sleep(2000);
            continue;
          }
          break;
        }
      }
    }

    // ✅ All models failed — use offline fallback instead of erroring
    console.warn("⚠️ All AI models failed — using fallback assessment");
    const fallback = generateFallbackReport(transcript, candidateName);
    return NextResponse.json(fallback);

  } catch (error: unknown) {
    const err = error as { message?: string };
    console.error("❌ Fatal assess error:", err?.message || error);

    // ✅ Even fatal errors return fallback
    try {
      const body = await req.clone().json();
      const fallback = generateFallbackReport(
        body.transcript || "",
        body.candidateName || "Candidate"
      );
      return NextResponse.json(fallback);
    } catch {
      return NextResponse.json(
        { error: err?.message || "Assessment failed" },
        { status: 500 }
      );
    }
  }
}