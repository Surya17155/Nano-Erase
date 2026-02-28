const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

function extractImageBase64(data: any): string | null {
  const message = data.choices?.[0]?.message;
  const content = message?.content;

  // Format 1: images array (LiteLLM/proxy format)
  const images = message?.images;
  if (images && images.length > 0) {
    const imgUrl = images[0]?.image_url?.url || images[0]?.url;
    if (imgUrl) {
      return imgUrl.replace(/^data:image\/[^;]+;base64,/, '');
    }
  }

  // Format 2: content contains base64 data URL
  if (content && typeof content === 'string') {
    const base64Match = content.match(/data:image\/[^;]+;base64,([A-Za-z0-9+/=\n\r]+)/);
    if (base64Match) {
      return base64Match[1].replace(/[\n\r]/g, '');
    }
  }

  // Format 3: content is array with inline_data parts
  if (Array.isArray(content)) {
    for (const part of content) {
      const imgData = part?.inline_data?.data || part?.inlineData?.data;
      if (imgData) return imgData;
    }
  }

  // Format 4: parts field on message
  const parts = message?.parts;
  if (parts) {
    for (const part of parts) {
      const imgData = part?.inline_data?.data || part?.inlineData?.data;
      if (imgData) return imgData;
    }
  }

  // Safety check
  if (content?.includes?.('SAFETY') || content?.includes?.('blocked')) {
    throw new Error('AI_POLICY_REJECTION');
  }

  return null;
}

async function processOneImage(
  apiKey: string,
  imageData: string,
  mimeType: string,
  prompt: string
): Promise<{ imageBase64?: string; error?: string }> {
  try {
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash-image',
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'image_url',
                image_url: { url: `data:${mimeType || 'image/jpeg'};base64,${imageData}` },
              },
              { type: 'text', text: prompt },
            ],
          },
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI gateway error:', response.status, errorText);
      if (response.status === 429) return { error: 'Rate limit exceeded. Please wait and retry.' };
      if (response.status === 402) return { error: 'AI usage credits exhausted.' };
      return { error: `AI gateway error (${response.status})` };
    }

    const data = await response.json();
    const imageBase64 = extractImageBase64(data);
    if (!imageBase64) {
      return { error: 'No image data returned from AI' };
    }
    return { imageBase64 };
  } catch (err) {
    const msg = err.message || 'Unknown error';
    if (msg === 'AI_POLICY_REJECTION') return { error: 'AI_POLICY_REJECTION' };
    return { error: msg };
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: 'LOVABLE_API_KEY is not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const body = await req.json();

    // === BATCH MODE: { batch: [{ id, imageData, mimeType, prompt }] } ===
    if (body.batch && Array.isArray(body.batch)) {
      const items = body.batch as Array<{ id: string; imageData: string; mimeType?: string; prompt: string }>;

      // Process ALL images in parallel
      const results = await Promise.all(
        items.map(async (item) => {
          const result = await processOneImage(LOVABLE_API_KEY, item.imageData, item.mimeType || 'image/jpeg', item.prompt);
          return { id: item.id, ...result };
        })
      );

      return new Response(JSON.stringify({ results }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // === SINGLE MODE (backward compat): { imageData, mimeType, prompt } ===
    const { imageData, mimeType, prompt } = body;
    if (!imageData || !prompt) {
      return new Response(JSON.stringify({ error: 'Missing imageData or prompt' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const result = await processOneImage(LOVABLE_API_KEY, imageData, mimeType || 'image/jpeg', prompt);
    if (result.error) {
      const status = result.error === 'AI_POLICY_REJECTION' ? 400 : 500;
      return new Response(JSON.stringify({ error: result.error }), {
        status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ imageBase64: result.imageBase64 }), {
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
