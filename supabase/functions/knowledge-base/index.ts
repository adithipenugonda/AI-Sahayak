import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { className, subject, topic, language } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const prompt = `You are an expert teacher for rural Indian schools. Generate a clear explanation for the following:

Class: ${className}
Subject: ${subject}
Topic: ${topic}
Local Language: ${language}

Follow these instructions strictly:

1. **English Explanation**: Give a simple explanation in English (3–5 lines). Use very easy words suitable for the given class level.

2. **${language} Explanation**: Explain the same concept in ${language} using very simple, everyday words that village children can understand. Write this in the native script of ${language}.

3. **Real-Life Example**: Give one real-life example related to village or rural life (farming, animals, nature, local markets, festivals, etc.)

4. **Practice Question**: Provide one small practice question that a teacher can ask students.

5. **Blackboard Summary**: Give 3-4 key points that can be written on a blackboard.

Rules:
- Keep everything short, clear, and easy to understand
- Avoid difficult vocabulary
- Make it suitable for blackboard teaching
- The explanation should help students understand clearly even if their English level is low
- Use bullet points and clear formatting

Format your response using these exact section headers:
## English Explanation
## ${language} Explanation
## Real-Life Example
## Practice Question
## Blackboard Summary`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: "You are a helpful educational assistant for rural Indian school teachers. Always respond in the exact format requested." },
          { role: "user", content: prompt },
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again later." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Credits exhausted. Please add funds." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI error:", response.status, t);
      throw new Error("AI gateway error");
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    return new Response(JSON.stringify({ content }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("knowledge-base error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
