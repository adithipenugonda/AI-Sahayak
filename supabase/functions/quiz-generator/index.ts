import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { subject, topic, grades } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    if (!subject || !topic || !grades || !Array.isArray(grades) || grades.length === 0) {
      return new Response(
        JSON.stringify({ error: "Please provide subject, topic, and at least one grade." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const gradesList = grades.sort((a: number, b: number) => a - b);
    const gradesStr = gradesList.map((g: number) => `Grade ${g}`).join(", ");

    const prompt = `You are a teacher in a multigrade classroom with ${gradesStr} students sitting together.

Generate a simple classroom activity quiz for:
Subject: ${subject}
Topic: ${topic}

Follow these rules strictly:
1. Give exactly 1 COMMON question for ALL grades (simple enough for the lowest grade but relevant to all).
2. For each grade (${gradesStr}), give exactly 3 questions at the appropriate difficulty:
   - Lower grades (1-3): Very easy, basic recall questions
   - Middle grades (4-6): Medium difficulty, some application
   - Upper grades (7-9): Slightly difficult, requires reasoning
   - Higher grades (10-12): Challenging, analytical thinking
3. Keep ALL questions short and clear.
4. Do NOT use complicated language.
5. Make questions easy to write on a blackboard.
6. Provide a short answer key at the end.

Return your response as valid JSON with this exact structure:
{
  "common_question": {
    "question": "...",
    "answer": "..."
  },
  "grade_questions": [
    {
      "grade": 3,
      "difficulty": "Easy",
      "questions": [
        { "number": 1, "question": "...", "answer": "..." },
        { "number": 2, "question": "...", "answer": "..." },
        { "number": 3, "question": "...", "answer": "..." }
      ]
    }
  ]
}

IMPORTANT: Return ONLY the JSON object, no markdown, no code blocks, no extra text.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: "You are an expert multigrade classroom teacher. Always return valid JSON only." },
          { role: "user", content: prompt },
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again shortly." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add credits." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI error:", response.status, t);
      return new Response(JSON.stringify({ error: "Failed to generate quiz." }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    let content = data.choices?.[0]?.message?.content || "";

    // Clean markdown code blocks if present
    content = content.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();

    let quiz;
    try {
      quiz = JSON.parse(content);
    } catch {
      console.error("Failed to parse quiz JSON:", content);
      return new Response(JSON.stringify({ error: "Failed to parse quiz. Please try again." }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ quiz }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("quiz-generator error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
