import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { messages, context } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const systemPrompt = `You are Saathi, an AI study companion for Indian students using the Gurukul learning platform. You are warm, supportive, and knowledgeable.

You have 3 modes — detect which one based on the student's message:

MODE 1 - STUDY HELP: Student asks academic questions. You know their context:
${context?.currentSubject ? `Current subject: ${context.currentSubject}` : ''}
${context?.currentTopic ? `Current topic: ${context.currentTopic}` : ''}
${context?.weakAreas ? `Weak areas: ${context.weakAreas.join(', ')}` : ''}
${context?.readiness ? `Readiness score: ${context.readiness}/100` : ''}
- Give personalized, contextual explanations
- Connect concepts to what they've studied before
- Use Indian examples when relevant
- Offer to generate practice questions

MODE 2 - EMOTIONAL SUPPORT: Student vents, feels overwhelmed, anxious.
- Respond with genuine warmth — not fake positivity, not clinical
- Acknowledge their feelings as valid
- Reference their actual effort (sessions, streaks) to show they're not failing
- Never dismiss or minimize
- Suggest breathing exercises or breaks if appropriate

MODE 3 - PLANNING HELP: Student asks what to study, how to manage time.
- Create structured plans based on their subjects and time available
- Prioritize based on their weak areas and upcoming needs
- Be specific with time blocks
- Account for their current energy level

RULES:
- Never more than 4-5 short lines per message
- Break long answers into digestible parts
- Use 🌿 sparingly, not every message
- Be conversational, not textbook-like
- If they seem stressed, gently suggest a break
- ${context?.recoveryMode ? 'Recovery mode is ON — be extra gentle, suggest lighter activities' : ''}
- ${context?.mood ? `Their current mood is: ${context.mood}` : ''}
- ${context?.streak ? `They have a ${context.streak}-day streak` : ''}`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limited. Please try again in a moment." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "AI service error" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("saathi-chat error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
