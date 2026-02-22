import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { className, topic, subjectIntegration, length, language } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const lengthGuide = length === "Short" ? "about 150 words total" : length === "Long" ? "about 500 words total" : "about 300 words total";
    const bilingualInstruction = language ? `\n\nAFTER the full English story, provide a complete bilingual version:\n- Write each scene again in ${language} (native script) side by side with English.\n- Keep the ${language} version simple and easy to read.` : "";

    const topicInstruction = topic ? `\n- Topic to teach through the story: "${topic}" — The story MUST revolve around teaching this topic. Weave the concept naturally into the plot so students learn it through the narrative.` : "";

    const prompt = `You are a creative storyteller for rural Indian school children.

Generate an educational story with these parameters:
- Class: ${className}
- Subject Integration: ${subjectIntegration || "General / Moral"}
- Setting: Rural Indian village
- Length: ${length} (${lengthGuide})${topicInstruction}
${language ? `- Local Language: ${language}` : ""}

Follow this EXACT structure using these markdown headers:

## Title
[Give a creative, child-friendly title]

## Scene 1
### Image Description
[Write a clear, simple 1-line description of what should be illustrated - rural village setting, simple characters, bright colors, child-friendly]

### Story
[Write the first part of the story - introduction of characters and setting]

## Scene 2
### Image Description
[Write a clear, simple 1-line description for the middle scene illustration]

### Story
[Write the middle part - the main event or challenge]

## Scene 3
### Image Description
[Write a clear, simple 1-line description for the ending scene illustration]

### Story
[Write the ending - resolution and lesson learned]

## Moral of the Story
[One clear moral lesson]

## Vocabulary
[List exactly 5 new vocabulary words with simple meanings, one per line like: **Word** - meaning]

## Comprehension Questions
[List exactly 3 questions about the story, numbered 1-3]
${bilingualInstruction}

Rules:
- Keep language simple, clear, age-appropriate for Class ${className}
- Use village characters: farmers, teachers, animals, nature
- Make it educational and engaging
- If subject is Math/Science, weave those concepts naturally into the story
- Images should depict simple rural scenes`;

    // Step 1: Generate the story text
    const storyResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: "You are a creative educational storyteller for rural Indian children. Always follow the exact format requested." },
          { role: "user", content: prompt },
        ],
      }),
    });

    if (!storyResponse.ok) {
      if (storyResponse.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again later." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (storyResponse.status === 402) {
        return new Response(JSON.stringify({ error: "Credits exhausted. Please add funds." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error("AI gateway error generating story");
    }

    const storyData = await storyResponse.json();
    const storyContent = storyData.choices?.[0]?.message?.content || "";

    // Step 2: Extract image descriptions and generate images
    const imageDescRegex = /### Image Description\s*\n([^\n#]+)/gi;
    const imageDescs: string[] = [];
    let match;
    while ((match = imageDescRegex.exec(storyContent)) !== null) {
      imageDescs.push(match[1].trim());
    }

    const images: string[] = [];
    for (const desc of imageDescs.slice(0, 3)) {
      try {
        const imgPrompt = `A simple, colorful, child-friendly illustration for a children's storybook: ${desc}. Style: warm watercolor, rural Indian village, bright and cheerful, no text in image.`;
        const imgResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${LOVABLE_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "google/gemini-2.5-flash-image",
            messages: [{ role: "user", content: imgPrompt }],
            modalities: ["image", "text"],
          }),
        });

        if (imgResponse.ok) {
          const imgData = await imgResponse.json();
          const imageUrl = imgData.choices?.[0]?.message?.images?.[0]?.image_url?.url;
          images.push(imageUrl || "");
        } else {
          console.error("Image generation failed for:", desc);
          images.push("");
        }
      } catch (e) {
        console.error("Image generation error:", e);
        images.push("");
      }
    }

    return new Response(JSON.stringify({ content: storyContent, images }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("story-generator error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
