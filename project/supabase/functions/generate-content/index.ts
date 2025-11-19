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
    const { operation, data: requestData } = rawBody;

    // Validate operation
    const validOperations = ['generate_titles', 'generate_outline', 'generate_chapter'];
    if (!operation || !validOperations.includes(operation)) {
      throw new Error('Invalid operation specified');
    }

    // Validate and sanitize input data
    if (!requestData || typeof requestData !== 'object') {
      throw new Error('Invalid request data');
    }

    // Input length validation (prevent DoS)
    const validateString = (value: unknown, fieldName: string, minLength: number, maxLength: number): string => {
      if (typeof value !== 'string') {
        throw new Error(`${fieldName} must be a string`);
      }
      const trimmed = value.trim();
      if (trimmed.length < minLength || trimmed.length > maxLength) {
        throw new Error(`${fieldName} must be between ${minLength} and ${maxLength} characters`);
      }
      return trimmed;
    };

    // Validate common fields
    if (requestData.topic) {
      requestData.topic = validateString(requestData.topic, 'Topic', 1, 500);
    }
    if (requestData.audience) {
      requestData.audience = validateString(requestData.audience, 'Audience', 1, 200);
    }
    if (requestData.title) {
      requestData.title = validateString(requestData.title, 'Title', 1, 200);
    }
    if (requestData.bookTitle) {
      requestData.bookTitle = validateString(requestData.bookTitle, 'Book Title', 1, 200);
    }
    if (requestData.chapterTitle) {
      requestData.chapterTitle = validateString(requestData.chapterTitle, 'Chapter Title', 1, 200);
    }

    // Validate tone
    const validTones = ['self-help', 'fiction', 'journal', 'guide', 'professional'];
    if (requestData.tone && !validTones.includes(requestData.tone)) {
      throw new Error('Invalid tone specified');
    }

    // Validate chapter count and number
    if (requestData.chapterCount !== undefined) {
      const count = Number(requestData.chapterCount);
      if (isNaN(count) || count < 1 || count > 20) {
        throw new Error('Chapter count must be between 1 and 20');
      }
      requestData.chapterCount = count;
    }

    if (requestData.chapterNumber !== undefined) {
      const num = Number(requestData.chapterNumber);
      if (isNaN(num) || num < 1) {
        throw new Error('Invalid chapter number');
      }
      requestData.chapterNumber = num;
    }

    // Try to get Gemini API key from environment variable first, then database
    let geminiKey = Deno.env.get('GEMINI_API_KEY');
    let usageCount = 0;

    if (!geminiKey) {
      // Fallback to database if env variable not set
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
        throw new Error('Gemini API key not configured. Please add GEMINI_API_KEY environment variable or configure it in the database.');
      }

      geminiKey = apiKeyData.api_key;
      usageCount = apiKeyData.usage_count || 0;
    }

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

    // Log usage if we're using database API key (not env variable)
    if (!Deno.env.get('GEMINI_API_KEY')) {
      const supabaseAdmin = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
      );

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
          usage_count: usageCount + 1,
          last_used_at: new Date().toISOString(),
        })
        .eq('service_name', 'gemini')
        .eq('is_active', true);
    }

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
