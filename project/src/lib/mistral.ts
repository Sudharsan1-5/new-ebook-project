import { AIGenerationOptions } from '../types';
import { supabase } from './supabase';
import { fetchWithRetry } from './retry';

/**
 * Edge Function request data types
 */
interface GenerateTitlesData {
  topic: string;
  audience: string;
  tone: string;
}

interface GenerateOutlineData {
  title: string;
  topic: string;
  audience: string;
  tone: string;
  chapterCount: number;
}

interface GenerateChapterData {
  bookTitle: string;
  chapterTitle: string;
  chapterNumber: number;
  tone: string;
  audience: string;
  ebookId?: string;
}

type EdgeFunctionData = GenerateTitlesData | GenerateOutlineData | GenerateChapterData;

/**
 * AI Content Generation Service using Google Gemini AI
 * This service generates book titles, chapter outlines, and chapter content
 */
export class MistralService {
  private async callEdgeFunction(operation: string, data: EdgeFunctionData): Promise<string> {
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      throw new Error('Not authenticated');
    }

    const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-content`;

    // Use retry logic with timeout for resilient API calls
    // Content generation can take 30-60s, so use generous timeout
    const response = await fetchWithRetry(
      apiUrl,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ operation, data })
      },
      {
        maxAttempts: 3,
        timeoutMs: 60000, // 60 second timeout for AI generation
        initialDelayMs: 2000, // Start with 2s delay
        onRetry: (attempt, error) => {
          console.error(`API call failed (attempt ${attempt}):`, error);
        }
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Content generation failed');
    }

    const result = await response.json();
    return result.content;
  }

  async generateTitles(options: AIGenerationOptions): Promise<string[]> {
    const response = await this.callEdgeFunction('generate_titles', {
      topic: options.topic,
      audience: options.audience,
      tone: options.tone
    });

    return response.split('\n').filter((title: string) => title.trim().length > 0).slice(0, 5);
  }

  async generateChapterOutline(options: AIGenerationOptions): Promise<{ number: number; title: string }[]> {
    const chapterCount = options.chapterCount || 8;

    const response = await this.callEdgeFunction('generate_outline', {
      title: options.title || options.topic,
      topic: options.topic,
      audience: options.audience,
      tone: options.tone,
      chapterCount
    });

    const titles = response.split('\n').filter((title: string) => title.trim().length > 0);

    return titles.slice(0, chapterCount).map((title: string, index: number) => ({
      number: index + 1,
      title: title.trim().replace(/^\d+[\.\)]\s*/, '').replace(/^Chapter\s+\d+:\s*/i, '')
    }));
  }

  async generateChapterContent(
    bookTitle: string,
    chapterTitle: string,
    chapterNumber: number,
    tone: string,
    audience: string,
    ebookId?: string
  ): Promise<string> {
    return await this.callEdgeFunction('generate_chapter', {
      bookTitle,
      chapterTitle,
      chapterNumber,
      tone,
      audience,
      ebookId
    });
  }
}
