// @ts-ignore
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

declare const Deno: { env: { get(key: string): string | undefined } };

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { prompt } = await req.json();
    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
    const REPLICATE_API_TOKEN = Deno.env.get("REPLICATE_API_TOKEN");

    if (!GEMINI_API_KEY) throw new Error("GEMINI_API_KEY is not configured");
    if (!REPLICATE_API_TOKEN) throw new Error("REPLICATE_API_TOKEN is not configured");

    // --- 1. Generate poster text via Gemini ---
    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: `You are a world-class creative director. Create iconic poster copy for: "${prompt}".
Return ONLY valid JSON (no markdown, no code block) with these exact fields:
{
  "headline": "2-4 word iconic headline",
  "subheadline": "5-15 word evocative tagline",
  "detail": "short detail line like date or brand, 3-8 words",
  "accent": "one decorative symbol like ✦ ◆ / № × — ∞",
  "style": "one of: luxury, editorial, bold, minimal, artistic, cinematic, retro, vogue, brutalist, neon"
}`,
                },
              ],
            },
          ],
          generationConfig: { temperature: 0.9, maxOutputTokens: 300 },
        }),
      }
    );

    let posterText = {
      headline: prompt.split(" ").slice(0, 3).join(" ").toUpperCase(),
      subheadline: "An extraordinary visual experience",
      detail: "SPARKX · 2026",
      accent: "✦",
      style: "luxury",
    };

    if (geminiRes.ok) {
      const geminiData = await geminiRes.json();
      try {
        const raw = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || "";
        const cleaned = raw.replace(/```json|```/g, "").trim();
        posterText = { ...posterText, ...JSON.parse(cleaned) };
      } catch (e) {
        console.error("Failed to parse Gemini response:", e);
      }
    } else {
      console.error("Gemini error:", await geminiRes.text());
    }

    // --- 2. Generate image via Replicate (Flux Schnell) ---
    const imagePrompt = `A breathtaking photorealistic poster image for: "${prompt}". Cinematic lighting, dramatic composition, rich colors, ultra high quality. Leave space for text overlay. No text, no words, no letters, no watermarks.`;

    const replicateRes = await fetch("https://api.replicate.com/v1/models/black-forest-labs/flux-schnell/predictions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${REPLICATE_API_TOKEN}`,
        "Content-Type": "application/json",
        Prefer: "wait",
      },
      body: JSON.stringify({
        input: {
          prompt: imagePrompt,
          aspect_ratio: "2:3",
          output_format: "webp",
          output_quality: 90,
          num_outputs: 1,
        },
      }),
    });

    if (!replicateRes.ok) {
      const errText = await replicateRes.text();
      console.error("Replicate error:", replicateRes.status, errText);
      throw new Error(`Image generation failed: ${replicateRes.status}`);
    }

    const replicateData = await replicateRes.json();
    let imageUrl: string = replicateData.output?.[0] ?? "";

    // Poll if not done yet
    if (!imageUrl && replicateData.urls?.get) {
      for (let i = 0; i < 20; i++) {
        await new Promise((r) => setTimeout(r, 2000));
        const poll = await fetch(replicateData.urls.get, {
          headers: { Authorization: `Bearer ${REPLICATE_API_TOKEN}` },
        });
        const pollData = await poll.json();
        if (pollData.status === "succeeded") {
          imageUrl = pollData.output?.[0] ?? "";
          break;
        }
        if (pollData.status === "failed") throw new Error("Image generation failed");
      }
    }

    if (!imageUrl) throw new Error("No image was generated");

    // Convert to base64 to avoid CORS issues
    let finalImage = imageUrl;
    try {
      const imgRes = await fetch(imageUrl);
      const buffer = await imgRes.arrayBuffer();
      const base64 = btoa(String.fromCharCode(...new Uint8Array(buffer)));
      const mime = imgRes.headers.get("content-type") || "image/webp";
      finalImage = `data:${mime};base64,${base64}`;
    } catch (e) {
      console.error("Failed to convert image to base64:", e);
    }

    return new Response(
      JSON.stringify({ image: finalImage, text: posterText }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("generate-poster error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
