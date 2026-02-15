const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

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

    const { imageData, mimeType, prompt } = await req.json();

    if (!imageData || !prompt) {
      return new Response(JSON.stringify({ error: 'Missing imageData or prompt' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
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
                image_url: {
                  url: `data:${mimeType || 'image/jpeg'};base64,${imageData}`,
                },
              },
              {
                type: 'text',
                text: prompt,
              },
            ],
          },
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI gateway error:', response.status, errorText);

      if (response.status === 429) {
        return new Response(JSON.stringify({ error: 'Rate limit exceeded. Please wait a moment and try again.' }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: 'AI usage credits exhausted. Please add funds in Settings -> Workspace -> Usage.' }), {
          status: 402,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      return new Response(JSON.stringify({ error: `AI gateway error (${response.status})` }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const data = await response.json();
    console.log('Gateway response structure:', JSON.stringify(data).substring(0, 1000));
    
    const message = data.choices?.[0]?.message;
    const content = message?.content;

    // Format 1: images array (LiteLLM/proxy format)
    const images = message?.images;
    if (images && images.length > 0) {
      const imgUrl = images[0]?.image_url?.url || images[0]?.url;
      if (imgUrl) {
        const base64Data = imgUrl.replace(/^data:image\/[^;]+;base64,/, '');
        return new Response(JSON.stringify({ imageBase64: base64Data }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    // Format 2: content contains base64 data URL
    if (content && typeof content === 'string') {
      const base64Match = content.match(/data:image\/[^;]+;base64,([A-Za-z0-9+/=\n\r]+)/);
      if (base64Match) {
        return new Response(JSON.stringify({ imageBase64: base64Match[1].replace(/[\n\r]/g, '') }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    // Format 3: content is array with inline_data parts
    if (Array.isArray(content)) {
      for (const part of content) {
        const imgData = part?.inline_data?.data || part?.inlineData?.data;
        if (imgData) {
          return new Response(JSON.stringify({ imageBase64: imgData }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
      }
    }

    // Format 4: parts field on message
    const parts = message?.parts;
    if (parts) {
      for (const part of parts) {
        const imgData = part?.inline_data?.data || part?.inlineData?.data;
        if (imgData) {
          return new Response(JSON.stringify({ imageBase64: imgData }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
      }
    }

    // Safety check
    if (content?.includes?.('SAFETY') || content?.includes?.('blocked')) {
      return new Response(JSON.stringify({ error: 'AI_POLICY_REJECTION' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ error: 'No image data returned from AI', rawContent: typeof content === 'string' ? content?.substring(0, 300) : JSON.stringify(content)?.substring(0, 300) }), {
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
