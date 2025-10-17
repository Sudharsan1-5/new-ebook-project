export interface User {
  id: string;
  email: string;
  name?: string;
  subscription_tier: 'free' | 'basic' | 'pro';
  credits_remaining: number;
  created_at: string;
}

export interface EBook {
  id: string;
  user_id: string;
  title: string;
  topic: string;
  audience: string;
  tone: 'self-help' | 'fiction' | 'journal' | 'guide' | 'professional';
  status: 'draft' | 'generating' | 'completed';
  word_count: number;
  chapter_count: number;
  cover_url?: string;
  created_at: string;
  updated_at: string;
}

export interface Chapter {
  id: string;
  ebook_id: string;
  chapter_number: number;
  title: string;
  content: string;
  word_count: number;
  created_at: string;
}

export interface Cover {
  id: string;
  ebook_id: string;
  image_url: string;
  title_text: string;
  subtitle_text?: string;
  author_text: string;
  title_color: string;
  subtitle_color: string;
  author_color: string;
  style: 'minimal' | 'artistic' | 'professional';
  created_at: string;
}

export interface Template {
  id: string;
  name: string;
  description: string;
  preview_image: string;
  styles: TemplateStyles;
}

export interface TemplateStyles {
  fontFamily: string;
  fontSize: {
    title: number;
    heading: number;
    body: number;
  };
  lineHeight: {
    title: number;
    heading: number;
    body: number;
  };
  margins: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
  colors: {
    text: string;
    heading: string;
    accent: string;
  };
}

export interface Subscription {
  id: string;
  user_id: string;
  plan_type: 'free' | 'basic' | 'pro';
  status: 'active' | 'cancelled' | 'expired';
  start_date: string;
  renewal_date?: string;
  payment_provider: 'stripe' | 'whop';
  payment_id?: string;
}

export interface ExportOptions {
  format: 'pdf' | 'epub' | 'mockup';
  includeTableOfContents: boolean;
  includeWatermark: boolean;
  template: Template;
}

export interface AIGenerationOptions {
  title?: string;
  topic: string;
  audience: string;
  tone: string;
  chapterCount?: number;
}
