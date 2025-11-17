import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'jsr:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

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
      .eq('service_name', 'gemini')
      .eq('is_active', true)
      .limit(1)
      .maybeSingle();

    if (keyError || !apiKeyData) {
      throw new Error('Gemini API key not configured. Please contact administrator.');
    }

    const geminiKey = apiKeyData.api_key;

    let systemPrompt = '';
    let userPrompt = '';
    let maxTokens = 2048;

    switch (operation) {
      case 'generate_titles':
        systemPrompt = 'You are a creative book title generator. Generate compelling, marketable book titles that will sell immediately and impress readers.';
        userPrompt = `Generate 5 unique, engaging, and highly marketable book titles for:
Topic: ${requestData.topic}
Audience: ${requestData.audience}
Tone: ${requestData.tone}

These titles should be attention-grabbing, memorable, and make people want to buy the book immediately.
Return only the titles, one per line, without numbering or explanation.`;
        maxTokens = 300;
        break;

      case 'generate_outline':
        const chapterCount = requestData.chapterCount || 8;
        systemPrompt = 'You are an expert book outline creator. Create clear, logical chapter structures that build upon each other for maximum impact.';
        userPrompt = `Create a ${chapterCount}-chapter outline for an eBook:
Title: ${requestData.title}
Topic: ${requestData.topic}
Audience: ${requestData.audience}
Tone: ${requestData.tone}

Create chapter titles that are compelling, flow logically, and build reader engagement throughout the book.
Return only the chapter titles, one per line, without numbering or explanation.`;
        maxTokens = 600;
        break;

      case 'generate_chapter':
        systemPrompt = `You are a professional bestselling author. Write engaging, well-structured, and highly valuable chapter content in a ${requestData.tone} tone for ${requestData.audience}. Your writing should be compelling, easy to read, and provide real value that makes readers feel they've learned something important.`;
        userPrompt = `Write the full content for this chapter:

Book Title: ${requestData.bookTitle}
Chapter ${requestData.chapterNumber}: ${requestData.chapterTitle}
Audience: ${requestData.audience}
Tone: ${requestData.tone}

Write approximately 1500-2000 words. Structure your content with:
- An engaging opening that hooks the reader
- Clear section headings using ## for main sections and ### for subsections
- Well-developed main points with concrete examples and actionable advice
- Bullet points or numbered lists where appropriate for clarity
- A compelling conclusion that transitions smoothly to the next chapter

Make the content valuable, professional, and engaging - something people would be excited to read and share.`;
        maxTokens = 4096;
        break;

      default:
        throw new Error('Invalid operation');
    }

    // Combine system and user prompts for Gemini
    const fullPrompt = `${systemPrompt}\n\n${userPrompt}`;

    // Call Gemini API using REST endpoint
    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`;

    const geminiResponse = await fetch(geminiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: fullPrompt
          }]
        }],
        generationConfig: {
          temperature: 0.8,
          maxOutputTokens: maxTokens,
          topP: 0.95,
          topK: 40,
        },
        safetySettings: [
          {
            category: 'HARM_CATEGORY_HARASSMENT',
            threshold: 'BLOCK_NONE'
          },
          {
            category: 'HARM_CATEGORY_HATE_SPEECH',
            threshold: 'BLOCK_NONE'
          },
          {
            category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
            threshold: 'BLOCK_NONE'
          },
          {
            category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
            threshold: 'BLOCK_NONE'
          }
        ]
      }),
    });

    if (!geminiResponse.ok) {
      const errorText = await geminiResponse.text();
      throw new Error(`Gemini API error: ${errorText}`);
    }

    const result = await geminiResponse.json();

    // Extract content from Gemini response format
    if (!result.candidates || result.candidates.length === 0) {
      throw new Error('No content generated by Gemini');
    }

    const content = result.candidates[0].content.parts[0].text;

    // Estimate tokens used (Gemini doesn't provide exact token count in response)
    const tokensUsed = Math.ceil((fullPrompt.length + content.length) / 4);

    await supabaseAdmin.from('usage_logs').insert({
      user_id: user.id,
      ebook_id: requestData.ebookId || null,
      service_name: 'gemini',
      operation,
      tokens_used: tokensUsed,
      success: true,
    });

    await supabaseAdmin
      .from('api_keys')
      .update({
        usage_count: (apiKeyData.usage_count || 0) + 1,
        last_used_at: new Date().toISOString(),
      })
      .eq('service_name', 'gemini')
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
