import { GoogleGenAI } from "npm:@google/genai@^1.41.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const apiKey = Deno.env.get('GEMINI_API_KEY');
    if (!apiKey) {
      return new Response(JSON.stringify({ error: 'API key not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { imageData, mimeType, prompt } = await req.json();

    if (!imageData || !prompt) {
      return new Response(JSON.stringify({ error: 'Missing imageData or prompt' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const ai = new GoogleGenAI({ apiKey });

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          { inlineData: { mimeType: mimeType || 'image/jpeg', data: imageData } },
          { text: prompt },
        ],
      },
    });

    const candidate = response.candidates?.[0];

    if (candidate?.finishReason === 'SAFETY') {
      return new Response(JSON.stringify({ error: 'AI_POLICY_REJECTION' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    for (const part of candidate?.content?.parts || []) {
      if (part.inlineData?.data) {
        return new Response(JSON.stringify({ imageBase64: part.inlineData.data }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    return new Response(JSON.stringify({ error: 'No image data returned from AI' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    const msg = error.message || 'Unknown error';
    console.error('Gemini proxy error:', msg);
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
