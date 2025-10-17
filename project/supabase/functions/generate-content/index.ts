import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'jsr:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

const MISTRAL_API_URL = 'https://api.mistral.ai/v1/chat/completions';

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

    const { operation, data: requestData } = await req.json();

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { data: apiKeyData, error: keyError } = await supabaseAdmin
      .from('api_keys')
      .select('api_key, usage_count')
      .eq('service_name', 'mistral')
      .eq('is_active', true)
      .limit(1)
      .maybeSingle();

    if (keyError || !apiKeyData) {
      throw new Error('Mistral API key not configured. Please contact administrator.');
    }

    const mistralKey = apiKeyData.api_key;

    let messages = [];
    let maxTokens = 2000;

    switch (operation) {
      case 'generate_titles':
        messages = [
          {
            role: 'system',
            content: 'You are a creative book title generator. Generate compelling, marketable book titles.',
          },
          {
            role: 'user',
            content: `Generate 5 unique and engaging book titles for:\nTopic: ${requestData.topic}\nAudience: ${requestData.audience}\nTone: ${requestData.tone}\n\nReturn only the titles, one per line, without numbering or explanation.`,
          },
        ];
        maxTokens = 200;
        break;

      case 'generate_outline':
        const chapterCount = requestData.chapterCount || 8;
        messages = [
          {
            role: 'system',
            content: 'You are an expert book outline creator. Create clear, logical chapter structures.',
          },
          {
            role: 'user',
            content: `Create a ${chapterCount}-chapter outline for an eBook:\nTitle: ${requestData.title}\nTopic: ${requestData.topic}\nAudience: ${requestData.audience}\nTone: ${requestData.tone}\n\nReturn only the chapter titles, one per line, without numbering or explanation.`,
          },
        ];
        maxTokens = 500;
        break;

      case 'generate_chapter':
        messages = [
          {
            role: 'system',
            content: `You are a professional book writer. Write engaging, well-structured chapter content in a ${requestData.tone} tone for ${requestData.audience}.`,
          },
          {
            role: 'user',
            content: `Write the full content for this chapter:\n\nBook Title: ${requestData.bookTitle}\nChapter ${requestData.chapterNumber}: ${requestData.chapterTitle}\nAudience: ${requestData.audience}\nTone: ${requestData.tone}\n\nWrite approximately 1500-2000 words. Include an engaging introduction, well-developed main points with examples, and a smooth transition.`,
          },
        ];
        maxTokens = 3000;
        break;

      default:
        throw new Error('Invalid operation');
    }

    const mistralResponse = await fetch(MISTRAL_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${mistralKey}`,
      },
      body: JSON.stringify({
        model: 'mistral-small-latest',
        messages,
        max_tokens: maxTokens,
        temperature: 0.7,
      }),
    });

    if (!mistralResponse.ok) {
      const errorText = await mistralResponse.text();
      throw new Error(`Mistral API error: ${errorText}`);
    }

    const result = await mistralResponse.json();
    const content = result.choices[0].message.content;

    await supabaseAdmin.from('usage_logs').insert({
      user_id: user.id,
      ebook_id: requestData.ebookId || null,
      service_name: 'mistral',
      operation,
      tokens_used: result.usage?.total_tokens || 0,
      success: true,
    });

    await supabaseAdmin
      .from('api_keys')
      .update({
        usage_count: (apiKeyData.usage_count || 0) + 1,
        last_used_at: new Date().toISOString(),
      })
      .eq('service_name', 'mistral')
      .eq('is_active', true);

    return new Response(
      JSON.stringify({ success: true, content }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});