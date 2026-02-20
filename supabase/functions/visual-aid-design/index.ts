import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function getComplexityPrompt(grade: number): string {
  if (grade <= 2) return "Very simple, colorful, cartoon-style diagram with big labels. Suitable for young children aged 5-7. Use bright primary colors, minimal text, large friendly shapes.";
  if (grade <= 5) return "Simple but informative educational diagram with clear labels and moderate detail. Suitable for children aged 8-10. Use colorful illustrations with some text annotations.";
  if (grade <= 8) return "Moderately detailed educational diagram with proper labels, arrows, and explanations. Suitable for students aged 11-13. Include scientific terminology where appropriate.";
  return "Detailed, comprehensive educational diagram with full scientific labels, annotations, and complexity. Suitable for high school students aged 14-17. Include technical terms, measurements, and detailed structures.";
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { topics } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    if (!topics || !Array.isArray(topics) || topics.length === 0) {
      return new Response(
        JSON.stringify({ error: "Please provide at least one topic." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Generate all images simultaneously
    const imagePromises = topics.map(async (topic: { grade: number; topicName: string; subject: string }) => {
      const gradeNum = topic.grade;
      const complexity = getComplexityPrompt(gradeNum);

      const prompt = `Generate a clear, educational visual aid diagram about "${topic.topicName}" for the subject "${topic.subject}" for Class ${gradeNum} students.

${complexity}

Requirements:
- Must be an educational diagram/chart/infographic (NOT a photograph)
- Include clear labels and annotations
- Use a clean white background
- Make it suitable for classroom teaching
- The diagram should help explain the concept visually
- Do NOT include any watermarks or logos`;

      try {
        const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${LOVABLE_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "google/gemini-2.5-flash-image",
            messages: [{ role: "user", content: prompt }],
            modalities: ["image", "text"],
          }),
        });

        if (!response.ok) {
          if (response.status === 429) {
            return { grade: gradeNum, topic: topic.topicName, subject: topic.subject, error: "Rate limit exceeded. Please try again shortly." };
          }
          if (response.status === 402) {
            return { grade: gradeNum, topic: topic.topicName, subject: topic.subject, error: "AI credits exhausted. Please add credits." };
          }
          const t = await response.text();
          console.error("AI image error:", response.status, t);
          return { grade: gradeNum, topic: topic.topicName, subject: topic.subject, error: "Failed to generate image." };
        }

        const data = await response.json();
        const imageUrl = data.choices?.[0]?.message?.images?.[0]?.image_url?.url;
        const description = data.choices?.[0]?.message?.content || "";

        if (!imageUrl) {
          return { grade: gradeNum, topic: topic.topicName, subject: topic.subject, error: "No image was generated. Try a different topic." };
        }

        return {
          grade: gradeNum,
          topic: topic.topicName,
          subject: topic.subject,
          imageUrl,
          description,
        };
      } catch (err) {
        console.error("Image generation error for", topic.topicName, err);
        return { grade: gradeNum, topic: topic.topicName, subject: topic.subject, error: "Generation failed." };
      }
    });

    const results = await Promise.all(imagePromises);

    return new Response(JSON.stringify({ results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("visual-aid-design error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
