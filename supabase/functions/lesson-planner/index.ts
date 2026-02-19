import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { syllabi } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    if (!syllabi || !Array.isArray(syllabi) || syllabi.length < 2) {
      return new Response(
        JSON.stringify({ error: "Please provide syllabi for at least 2 grades." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const syllabiText = syllabi
      .map((s: { grade: string; subject: string; content: string }) =>
        `--- ${s.grade} | Subject: ${s.subject} ---\n${s.content}`
      )
      .join("\n\n");

    const systemPrompt = `You are an expert multigrade classroom lesson planner for Indian schools where multiple grades sit together in one classroom.

Your task:
1. Analyze the syllabi (with grade and subject) from different grades provided by the teacher.
2. Identify SIMILAR/RELATED topics across grades that can be taught together.
   - Example: "Plants" in Class 1 and "Photosynthesis" in Class 7 share a botanical theme.
   - Even across subjects: "Measurements" in Maths Class 3 and "Units of Measurement" in Science Class 4 can overlap.
3. Identify topics that are COMPLETELY DIFFERENT and must be taught separately.

For MERGED topics: Create a combined lesson plan with differentiated activities per grade.
For SEPARATE topics: Suggest what the other grade(s) do as a PARALLEL ACTIVITY (worksheet, group project, revision, independent reading, peer-teaching, etc.) while one grade is being taught.

Output ONLY valid JSON (no markdown, no code fences):
{
  "merged_topics": [
    {
      "theme": "Common theme name",
      "grades_involved": [
        { "grade": "Class 1", "chapter": "Chapter name", "topic": "Topic name" },
        { "grade": "Class 7", "chapter": "Chapter name", "topic": "Topic name" }
      ],
      "why_mergeable": "Brief explanation of why these can be taught together",
      "lesson_plan": {
        "duration": "estimated time e.g. 45 minutes",
        "introduction": "How to introduce the common theme to all grades together",
        "activities_by_grade": [
          { "grade": "Class 1", "activity": "What this grade does (simpler)" },
          { "grade": "Class 7", "activity": "What this grade does (advanced)" }
        ],
        "assessment": "How to check understanding for each grade"
      }
    }
  ],
  "separate_topics": [
    {
      "grade": "Class X",
      "chapter": "Chapter name",
      "topic": "Topic name",
      "suggestion": "When and how to teach this topic",
      "parallel_activity": "What the OTHER grade(s) do meanwhile (specific activity, not vague)"
    }
  ],
  "weekly_schedule": [
    {
      "day": "Day 1",
      "slot": "Slot description (e.g. Period 1, Morning Session)",
      "type": "merged | separate",
      "details": "What happens in this slot"
    }
  ],
  "tips": ["Practical tips for managing the multigrade classroom"]
}`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          {
            role: "user",
            content: `Here are the syllabi for the multigrade classroom:\n\n${syllabiText}\n\nPlease analyze and create a merged + separate lesson plan with parallel activities.`,
          },
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add credits to continue." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "AI processing failed. Please try again." }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    let parsed;
    try {
      const jsonStr = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      parsed = JSON.parse(jsonStr);
    } catch {
      parsed = { raw_response: content };
    }

    return new Response(JSON.stringify(parsed), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("lesson-planner error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
