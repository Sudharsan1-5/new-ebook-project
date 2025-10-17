import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'jsr:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

const STABILITY_API_URL = 'https://api.stability.ai/v2beta/stable-image/generate/core';

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) {
      throw new Error('Unauthorized');
    }

    const { theme, mood, style, aspectRatio = '2:3' } = await req.json();

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { data: apiKeyData, error: keyError } = await supabaseAdmin
      .from('api_keys')
      .select('api_key, usage_count')
      .eq('service_name', 'stability_ai')
      .eq('is_active', true)
      .limit(1)
      .maybeSingle();

    if (keyError || !apiKeyData) {
      throw new Error('Stability AI API key not configured. Please contact administrator.');
    }

    const stabilityKey = apiKeyData.api_key;

    const styleDescriptors = {
      minimal: 'minimalist, clean, simple design, modern, elegant, negative space',
      artistic: 'artistic, creative, expressive, vibrant colors, unique composition',
      professional: 'professional, corporate, polished, sophisticated, business-like',
    };

    const prompt = `Book cover design, ${theme}, ${mood} mood, ${styleDescriptors[style] || styleDescriptors.professional}, high quality, professional book cover, suitable for publishing, no text, centered composition, high resolution`;

    const formData = new FormData();
    formData.append('prompt', prompt);
    formData.append('output_format', 'png');
    formData.append('aspect_ratio', aspectRatio);

    const stabilityResponse = await fetch(STABILITY_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${stabilityKey}`,
        'Accept': 'image/*',
      },
      body: formData,
    });

    if (!stabilityResponse.ok) {
      const errorText = await stabilityResponse.text();
      throw new Error(`Stability AI error: ${errorText}`);
    }

    const imageBlob = await stabilityResponse.blob();
    const imageBuffer = await imageBlob.arrayBuffer();

    await supabaseAdmin.from('usage_logs').insert({
      user_id: user.id,
      service_name: 'stability_ai',
      operation: 'generate_cover',
      success: true,
    });

    await supabaseAdmin
      .from('api_keys')
      .update({
        usage_count: (apiKeyData.usage_count || 0) + 1,
        last_used_at: new Date().toISOString(),
      })
      .eq('service_name', 'stability_ai')
      .eq('is_active', true);

    return new Response(imageBuffer, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'image/png',
      },
    });
  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});