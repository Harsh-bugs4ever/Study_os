import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "Access-Control-Max-Age": "86400",
};

function extractJsonFromResponse(response: string): unknown {
  let cleaned = response
    .replace(/```json\s*/gi, "")
    .replace(/```\s*/g, "")
    .trim();

  const jsonStart = cleaned.search(/[\{\[]/);
  const jsonEnd = cleaned.lastIndexOf(jsonStart !== -1 && cleaned[jsonStart] === '[' ? ']' : '}');

  if (jsonStart === -1 || jsonEnd === -1) {
    throw new Error("No JSON object found in response");
  }

  cleaned = cleaned.substring(jsonStart, jsonEnd + 1);

  try {
    return JSON.parse(cleaned);
  } catch {
    cleaned = cleaned
      .replace(/,\s*}/g, "}")
      .replace(/,\s*]/g, "]")
      .replace(/[\x00-\x1F\x7F]/g, "");
    return JSON.parse(cleaned);
  }
}

async function generateWithGemini(systemPrompt: string, userPrompt: string): Promise<string> {
  const apiKey = Deno.env.get("GOOGLE_AI_API_KEY") || Deno.env.get("GEMINI_API_KEY");
  if (!apiKey) throw new Error("GOOGLE_AI_API_KEY is not configured");

  const model = Deno.env.get("GOOGLE_AI_MODEL") || "gemini-2.5-flash";
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: systemPrompt }] },
        contents: [{ role: "user", parts: [{ text: userPrompt }] }],
        generationConfig: {
          maxOutputTokens: 8192,
          responseMimeType: "application/json",
        },
      }),
    }
  );

  if (!response.ok) {
    if (response.status === 429) throw new Error("RATE_LIMITED");
    const text = await response.text();
    console.error("Gemini API error:", response.status, text.substring(0, 1000));
    throw new Error("AI_SERVICE_ERROR");
  }

  const data = await response.json();
  const parts = data.candidates?.[0]?.content?.parts ?? [];
  const content = parts.map((part: { text?: string }) => part.text ?? "").join("");

  if (!content.trim()) {
    console.error("Gemini returned no text:", JSON.stringify(data).substring(0, 1000));
    throw new Error("AI_EMPTY_RESPONSE");
  }

  return content;
}

async function generateWithLovable(systemPrompt: string, userPrompt: string): Promise<string> {
  const apiKey = Deno.env.get("LOVABLE_API_KEY");
  if (!apiKey) throw new Error("LOVABLE_API_KEY is not configured");

  const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      max_tokens: 8192,
    }),
  });

  if (!response.ok) {
    if (response.status === 429) throw new Error("RATE_LIMITED");
    if (response.status === 402) throw new Error("AI_CREDITS_EXHAUSTED");
    const text = await response.text();
    console.error("Lovable AI gateway error:", response.status, text.substring(0, 1000));
    throw new Error("AI_SERVICE_ERROR");
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content || "";
  if (!content.trim()) throw new Error("AI_EMPTY_RESPONSE");
  return content;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: corsHeaders });

  try {
    const { subject, subtopic, mode, numQuestions, studentExplanation } = await req.json();

    if (!subject || !subtopic || !mode) {
      return new Response(JSON.stringify({ error: "subject, subtopic, and mode are required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let systemPrompt = "";
    let userPrompt = "";

    if (mode === "learn") {
      systemPrompt = `You are Saathi, an AI tutor for Indian students. Generate interactive learning content.
Return ONLY valid JSON array with exactly 5 learning steps. No markdown, no code blocks, just JSON.
Each step must have: type, instruction, content, and optionally options (array of strings), correctIndex (number), explanation (string).
Step types in order: "hook", "fillblank", "choice", "teachback", "summary".
- hook: An intuitive question to start thinking. Has options and correctIndex.
- fillblank: Fill in the blank. Has options and correctIndex, plus explanation.
- choice: A deeper what-if question. Has options and correctIndex, plus explanation.
- teachback: Ask student to explain in own words. Has explanation (feedback template).
- summary: Key formula/concept. Has explanation with connections to related topics.
Use simple language. Add real-world examples. Make it feel like a conversation, not a textbook.`;

      userPrompt = `Generate 5 interactive learning steps for:
Subject: ${subject}
Topic: ${subtopic}

Make the hook question intuitive and surprising. Use Indian context examples where possible.`;
    } else if (mode === "quiz") {
      const count = numQuestions || 5;
      systemPrompt = `You are Saathi, an AI tutor. Generate adaptive quiz questions.
Return ONLY valid JSON array with exactly ${count} questions. No markdown, no code blocks, just JSON.
Each question must have: question (string), options (array of 4 strings), correct (number 0-3), explanation (string), concept (string), difficulty (easy/medium/hard), hint (string, optional).
Mix difficulties. Make explanations clear and connected to real life.`;

      userPrompt = `Generate exactly ${count} quiz questions for:
Subject: ${subject}
Topic: ${subtopic}

Include varied difficulty. Use Indian exam style (JEE/NEET level for science, Board level for others).`;
    } else if (mode === "boss-battle") {
      systemPrompt = `You are Saathi, an AI tutor. Generate 3 challenging boss battle questions.
Return ONLY valid JSON array with exactly 3 questions. No markdown, no code blocks, just JSON.
Each question must have: question (string), options (array of 4 strings), correct (number 0-3), explanation (string).
These should be tricky, application-based questions that test deep understanding. Make them feel epic!`;

      userPrompt = `Generate 3 boss battle questions for:
Subject: ${subject}
Topic: ${subtopic}

Make them challenging but fair. Test application, not just memorization.`;
    } else if (mode === "flashcards") {
      const count = numQuestions || 10;
      systemPrompt = `You are Saathi, an AI tutor. Generate flashcards for spaced repetition study.
Return ONLY valid JSON array with exactly ${count} flashcards. No markdown, no code blocks, just JSON.
Each flashcard must have: front (string - the question/prompt), back (string - detailed answer/explanation).
Make the fronts specific and testable. Make the backs concise but complete with key facts, formulas, or explanations.
Include a mix of: definitions, formulas, comparisons, applications, and key facts.`;

      userPrompt = `Generate ${count} high-quality flashcards for:
Subject: ${subject}
Topic: ${subtopic}

Include important formulas, definitions, key concepts, and application-based questions. Make answers detailed enough to learn from.`;
    } else if (mode === "teachback-evaluate") {
      systemPrompt = `You are Saathi, a warm AI tutor. Evaluate the student's explanation.
Return ONLY valid JSON with: score (number 1-10), feedback (string, 2-3 sentences, warm and encouraging), gaps (array of strings - concepts they missed), passed (boolean - true if score >= 6).
Be encouraging but honest. Never be harsh.`;

      userPrompt = `Topic: ${subject} - ${subtopic}
Student's explanation: ${studentExplanation || ""}
Evaluate how well they understand this concept.`;
    } else if (mode === "concepts") {
      systemPrompt = `You are Saathi. Generate a concept map for a topic.
Return ONLY valid JSON array of 5-7 concept names (strings) that form the learning path for this topic, ordered from foundational to advanced.`;

      userPrompt = `Generate concept map for: ${subject} - ${subtopic}`;
    } else {
      return new Response(JSON.stringify({ error: `Unsupported mode: ${mode}` }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    try {
      const content = Deno.env.get("GOOGLE_AI_API_KEY") || Deno.env.get("GEMINI_API_KEY")
        ? await generateWithGemini(systemPrompt, userPrompt)
        : await generateWithLovable(systemPrompt, userPrompt);

      try {
        const parsed = extractJsonFromResponse(content);
        return new Response(JSON.stringify({ result: parsed }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      } catch {
        console.error("Failed to parse AI response:", content.substring(0, 500));
        return new Response(JSON.stringify({ result: content, raw: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "AI_SERVICE_ERROR";
      if (message === "RATE_LIMITED") {
        return new Response(JSON.stringify({ error: "Rate limited. Please try again in a moment." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (message === "AI_CREDITS_EXHAUSTED") {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add funds." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const missingKey = message.includes("API_KEY") || message.includes("LOVABLE_API_KEY");
      return new Response(JSON.stringify({
        error: missingKey ? message : "AI service error. Please try again shortly.",
      }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
  } catch (e) {
    console.error("generate-learning error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
