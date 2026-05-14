import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface ImagePrompt {
  id: string;
  text: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { prompts } = (await req.json()) as { prompts: ImagePrompt[] };
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const results: { id: string; url: string | null; error?: string }[] = [];

    for (const prompt of prompts) {
      try {
        const response = await fetch(
          "https://ai.gateway.lovable.dev/v1/chat/completions",
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${LOVABLE_API_KEY}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              model: "google/gemini-2.5-flash-image",
              messages: [
                {
                  role: "user",
                  content: prompt.text,
                },
              ],
              modalities: ["image", "text"],
            }),
          }
        );

        if (!response.ok) {
          if (response.status === 429) {
            results.push({ id: prompt.id, url: null, error: "Rate limited, please try again later" });
            await new Promise((r) => setTimeout(r, 3000));
            continue;
          }
          if (response.status === 402) {
            results.push({ id: prompt.id, url: null, error: "Credits exhausted" });
            continue;
          }
          const errText = await response.text();
          console.error(`AI gateway error for ${prompt.id}:`, response.status, errText);
          results.push({ id: prompt.id, url: null, error: `Gateway error: ${response.status}` });
          continue;
        }

        const data = await response.json();
        const imageUrl = data.choices?.[0]?.message?.images?.[0]?.image_url?.url;

        if (imageUrl) {
          results.push({ id: prompt.id, url: imageUrl });
        } else {
          results.push({ id: prompt.id, url: null, error: "No image in response" });
        }

        if (prompts.indexOf(prompt) < prompts.length - 1) {
          await new Promise((r) => setTimeout(r, 1000));
        }
      } catch (err) {
        console.error(`Failed to generate image ${prompt.id}:`, err);
        results.push({
          id: prompt.id,
          url: null,
          error: err instanceof Error ? err.message : "Unknown error",
        });
      }
    }

    return new Response(JSON.stringify({ images: results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-images error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
