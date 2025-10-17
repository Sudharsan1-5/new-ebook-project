const STABILITY_API_URL = 'https://api.stability.ai/v2beta/stable-image/generate/core';

export interface CoverGenerationOptions {
  theme: string;
  mood: string;
  style: 'minimal' | 'artistic' | 'professional';
  aspectRatio?: '1:1' | '16:9' | '21:9' | '2:3' | '3:2' | '4:5' | '5:4' | '9:16' | '9:21';
}

export class StabilityAIService {
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async generateCover(options: CoverGenerationOptions): Promise<string> {
    const prompt = this.buildPrompt(options);

    try {
      const formData = new FormData();
      formData.append('prompt', prompt);
      formData.append('output_format', 'png');
      formData.append('aspect_ratio', options.aspectRatio || '2:3');

      const response = await fetch(STABILITY_API_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Accept': 'image/*'
        },
        body: formData
      });

      if (!response.ok) {
        if (response.status === 403) {
          throw new Error('Invalid API key or insufficient credits');
        }
        const error = await response.json().catch(() => ({ message: 'Unknown error' }));
        throw new Error(error.message || 'StabilityAI API request failed');
      }

      const blob = await response.blob();
      return URL.createObjectURL(blob);
    } catch (error) {
      console.error('StabilityAI API Error:', error);
      throw error;
    }
  }

  private buildPrompt(options: CoverGenerationOptions): string {
    const styleDescriptors = {
      minimal: 'minimalist, clean, simple design, modern, elegant, negative space',
      artistic: 'artistic, creative, expressive, vibrant colors, unique composition',
      professional: 'professional, corporate, polished, sophisticated, business-like'
    };

    const prompt = `Book cover design, ${options.theme}, ${options.mood} mood, ${styleDescriptors[options.style]}, high quality, professional book cover, suitable for publishing, no text, centered composition, high resolution`;

    return prompt;
  }

  async generateMultipleCovers(options: CoverGenerationOptions, count: number = 3): Promise<string[]> {
    const promises = Array(count).fill(null).map(() => this.generateCover(options));

    try {
      return await Promise.all(promises);
    } catch (error) {
      console.error('Error generating multiple covers:', error);
      throw error;
    }
  }
}
