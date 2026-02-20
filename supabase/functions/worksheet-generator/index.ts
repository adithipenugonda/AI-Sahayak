import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { subject, topic, grades, duration } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    if (!subject || !topic || !grades || !Array.isArray(grades) || grades.length === 0) {
      return new Response(
        JSON.stringify({ error: "Please provide subject, topic, and at least one grade." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const gradesStr = grades.sort((a: number, b: number) => a - b).map((g: number) => `Grade ${g}`).join(", ");
    const dur = duration || 20;

    const prompt = `You are an expert multigrade classroom teacher. Generate a ${dur}-minute printable worksheet for:

Subject: ${subject}
Topic: ${topic}
Grades: ${gradesStr}

Follow these rules STRICTLY:

1. Create 3 learning levels:
   - Level 1 (Basic) – for weak students
   - Level 2 (Practice) – for average students
   - Level 3 (Challenge) – for fast learners

2. Include:
   - 1 common warm-up question for all students
   - 4 questions for Level 1
   - 4 questions for Level 2
   - 4 questions for Level 3

3. Questions must be:
   - Short, clear, easy to write on a blackboard
   - Suitable for independent work
   - In practical, simple language

4. Include different question types across levels:
   - Fill in the blanks
   - Short answer
   - Match the following
   - Small problem-solving

5. At the end provide:
   - A short answer key for ALL questions
   - 2 simple explanation lines for the most difficult questions

Return ONLY valid JSON with this exact structure:
{
  "title": "Worksheet: [Topic]",
  "subject": "${subject}",
  "topic": "${topic}",
  "duration": "${dur} minutes",
  "grades": "${gradesStr}",
  "warm_up": {
    "question": "...",
    "type": "...",
    "answer": "..."
  },
  "level_1": {
    "label": "Level 1 – Basic (Weak Students)",
    "questions": [
      { "number": 1, "type": "fill_in_the_blanks", "question": "...", "answer": "..." },
      { "number": 2, "type": "short_answer", "question": "...", "answer": "..." },
      { "number": 3, "type": "match_the_following", "question": "...", "pairs": [{"left":"...","right":"..."}], "answer": "..." },
      { "number": 4, "type": "problem_solving", "question": "...", "answer": "..." }
    ]
  },
  "level_2": {
    "label": "Level 2 – Practice (Average Students)",
    "questions": [
      { "number": 1, "type": "fill_in_the_blanks", "question": "...", "answer": "..." },
      { "number": 2, "type": "short_answer", "question": "...", "answer": "..." },
      { "number": 3, "type": "match_the_following", "question": "...", "pairs": [{"left":"...","right":"..."}], "answer": "..." },
      { "number": 4, "type": "problem_solving", "question": "...", "answer": "..." }
    ]
  },
  "level_3": {
    "label": "Level 3 – Challenge (Fast Learners)",
    "questions": [
      { "number": 1, "type": "fill_in_the_blanks", "question": "...", "answer": "..." },
      { "number": 2, "type": "short_answer", "question": "...", "answer": "..." },
      { "number": 3, "type": "match_the_following", "question": "...", "pairs": [{"left":"...","right":"..."}], "answer": "..." },
      { "number": 4, "type": "problem_solving", "question": "...", "answer": "..." }
    ]
  },
  "answer_key": [
    { "section": "Warm-up", "answer": "..." },
    { "section": "Level 1", "answers": ["1. ...", "2. ...", "3. ...", "4. ..."] },
    { "section": "Level 2", "answers": ["1. ...", "2. ...", "3. ...", "4. ..."] },
    { "section": "Level 3", "answers": ["1. ...", "2. ...", "3. ...", "4. ..."] }
  ],
  "explanations": [
    { "question_ref": "Level X, Q#", "explanation": "..." },
    { "question_ref": "Level X, Q#", "explanation": "..." }
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
      return new Response(JSON.stringify({ error: "Failed to generate worksheet." }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    let content = data.choices?.[0]?.message?.content || "";
    content = content.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();

    let worksheet;
    try {
      worksheet = JSON.parse(content);
    } catch {
      console.error("Failed to parse worksheet JSON:", content);
      return new Response(JSON.stringify({ error: "Failed to parse worksheet. Please try again." }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ worksheet }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("worksheet-generator error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
