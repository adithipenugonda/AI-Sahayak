import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { schoolName, className, subject, examType, totalMarks, duration, topics, paperType } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    if (!schoolName || !className || !subject || !examType || !totalMarks || !duration || !topics || !paperType) {
      return new Response(
        JSON.stringify({ error: "All fields are required." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let sectionInstructions = "";
    switch (paperType) {
      case "mcq":
        sectionInstructions = `Create ONLY one section: SECTION A – Multiple Choice Questions. All questions must be MCQs with 4 options (a, b, c, d). Distribute marks to total exactly ${totalMarks}.`;
        break;
      case "fill_blanks":
        sectionInstructions = `Create ONLY one section: SECTION A – Fill in the Blanks. All questions must be fill-in-the-blank type (1 mark each). Total questions = ${totalMarks}.`;
        break;
      case "short_answer":
        sectionInstructions = `Create ONLY one section: SECTION A – Short Answer Questions (2-3 marks each). Distribute marks to total exactly ${totalMarks}.`;
        break;
      case "long_answer":
        sectionInstructions = `Create ONLY one section: SECTION A – Long Answer / Descriptive Questions (5 marks each). Distribute marks to total exactly ${totalMarks}. Include internal choices.`;
        break;
      case "mixed":
        sectionInstructions = `Divide the paper into sections:
SECTION A – Multiple Choice Questions (1 mark each) – approximately 25% of total marks
SECTION B – Short Answer Questions (2-3 marks each) – approximately 30% of total marks  
SECTION C – Long Answer Questions (5 marks each) – approximately 30% of total marks
SECTION D – Application / Case Study Based Questions (4-5 marks each) – approximately 15% of total marks
Include internal choices in Section C and D. Total marks must be exactly ${totalMarks}.`;
        break;
    }

    const prompt = `You are an expert exam paper setter for Indian schools. Generate a professional examination question paper with the following details:

School Name: ${schoolName}
Class: ${className}
Subject: ${subject}
Exam Type: ${examType}
Total Marks: ${totalMarks}
Time Duration: ${duration}
Topics: ${topics}
Paper Type: ${paperType === "mixed" ? "Mixed" : paperType}

${sectionInstructions}

Follow these STRICT rules:

1. Format like a REAL Indian school exam paper
2. Questions must be:
   - Balanced across Easy (30%), Medium (40%), Hard (30%) difficulty
   - Clear and age-appropriate for ${className}
   - Match the total marks EXACTLY (${totalMarks} marks)
   - Cover the given topics: ${topics}
3. Include general instructions at the top
4. Include internal choices where appropriate (especially for long answers)
5. Do NOT include answers

Return ONLY valid JSON with this exact structure:
{
  "header": {
    "school_name": "${schoolName}",
    "exam_title": "${examType} Examination",
    "class": "${className}",
    "subject": "${subject}",
    "time": "${duration}",
    "total_marks": ${totalMarks}
  },
  "general_instructions": [
    "All questions are compulsory unless stated otherwise.",
    "Read all questions carefully before answering.",
    "Marks are indicated against each question."
  ],
  "sections": [
    {
      "section_id": "A",
      "section_title": "SECTION A – Multiple Choice Questions",
      "section_instruction": "Choose the correct option. (1 mark each)",
      "questions": [
        {
          "q_number": 1,
          "question": "...",
          "marks": 1,
          "type": "mcq",
          "options": ["(a) ...", "(b) ...", "(c) ...", "(d) ..."],
          "internal_choice": null
        }
      ]
    },
    {
      "section_id": "B",
      "section_title": "SECTION B – Short Answer Questions",
      "section_instruction": "Answer in 2-3 sentences. (2 marks each)",
      "questions": [
        {
          "q_number": 6,
          "question": "...",
          "marks": 2,
          "type": "short_answer",
          "options": null,
          "internal_choice": null
        }
      ]
    }
  ]
}

Adjust sections based on the paper type. For single-type papers, use only ONE section.
For mixed papers, use all four sections (A, B, C, D).
Question numbering must be continuous across sections.
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
          { role: "system", content: "You are an expert Indian school exam paper setter. Always return valid JSON only." },
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
      return new Response(JSON.stringify({ error: "Failed to generate question paper." }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    let content = data.choices?.[0]?.message?.content || "";
    content = content.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();

    let paper;
    try {
      paper = JSON.parse(content);
    } catch {
      console.error("Failed to parse question paper JSON:", content);
      return new Response(JSON.stringify({ error: "Failed to parse question paper. Please try again." }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ paper }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("question-paper error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
