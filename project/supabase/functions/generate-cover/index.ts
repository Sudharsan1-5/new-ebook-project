import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'jsr:@supabase/supabase-js@2';

// Security: Only allow requests from configured origin
const getAllowedOrigin = (requestOrigin: string | null): string => {
  const allowedOrigin = Deno.env.get('ALLOWED_ORIGIN');

  if (allowedOrigin && requestOrigin === allowedOrigin) {
    return allowedOrigin;
  }

  // Fallback: allow localhost for development
  if (requestOrigin?.includes('localhost') || requestOrigin?.includes('127.0.0.1')) {
    return requestOrigin;
  }

  // Default: no origin allowed (security)
  return 'null';
};

const getCorsHeaders = (origin: string | null) => ({
  'Access-Control-Allow-Origin': getAllowedOrigin(origin),
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Max-Age': '86400',
});

const STABILITY_API_URL = 'https://api.stability.ai/v2beta/stable-image/generate/core';

Deno.serve(async (req: Request) => {
  const origin = req.headers.get('origin');
  const corsHeaders = getCorsHeaders(origin);

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

    // Input validation
    const rawBody = await req.json();
    const { theme, mood, style, aspectRatio = '2:3' } = rawBody;

    // Validate theme (required)
    if (!theme || typeof theme !== 'string' || theme.trim().length === 0) {
      throw new Error('Theme is required');
    }
    if (theme.length > 500) {
      throw new Error('Theme must be less than 500 characters');
    }

    // Validate style
    const validStyles = ['minimal', 'artistic', 'professional'];
    if (style && !validStyles.includes(style)) {
      throw new Error('Invalid style specified');
    }

    // Validate mood
    const validMoods = ['self-help', 'fiction', 'journal', 'guide', 'professional'];
    if (mood && !validMoods.includes(mood)) {
      throw new Error('Invalid mood specified');
    }

    // Validate aspect ratio
    const validAspectRatios = ['1:1', '2:3', '3:2', '4:5', '16:9'];
    if (aspectRatio && !validAspectRatios.includes(aspectRatio)) {
      throw new Error('Invalid aspect ratio');
    }

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