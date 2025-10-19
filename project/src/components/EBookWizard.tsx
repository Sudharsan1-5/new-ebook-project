
import React, { useState } from 'react';
import { ChevronRight, ChevronLeft, BookOpen, Sparkles, Palette, FileText, Download, Wand2 } from 'lucide-react';
import { Button } from './Button';
import { Input } from './Input';
import { TextArea } from './TextArea';
import { Modal } from './Modal';
import { Chapter } from '../types';
import { MistralService } from '../lib/mistral';
import { supabase } from '../lib/supabase';

interface EBookWizardProps {
  onClose: () => void;
  onComplete: (project: any) => void;
}

type WizardStep = 'input' | 'titles' | 'outline' | 'content' | 'template' | 'cover' | 'export';

export const EBookWizard: React.FC<EBookWizardProps> = ({ onClose, onComplete }) => {
  const [currentStep, setCurrentStep] = useState<WizardStep>('input');
  const [loading, setLoading] = useState(false);

  const [topic, setTopic] = useState('');
  const [audience, setAudience] = useState('');
  const [tone, setTone] = useState<'self-help' | 'fiction' | 'journal' | 'guide' | 'professional'>('guide');

  const [selectedTitle, setSelectedTitle] = useState('');
  const [generatedTitles, setGeneratedTitles] = useState<string[]>([]);

  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState('minimal-professional');
  const [error, setError] = useState('');

  // Cover generation state
  const [coverPrompt, setCoverPrompt] = useState('');
  const [coverStyle, setCoverStyle] = useState<'minimal' | 'artistic' | 'professional'>('professional');
  const [primaryColor, setPrimaryColor] = useState('#3B82F6');
  const [secondaryColor, setSecondaryColor] = useState('#1E40AF');
  const [generatingCover, setGeneratingCover] = useState(false);
  const [generatedCoverUrl, setGeneratedCoverUrl] = useState<string | null>(null);

  const steps: { id: WizardStep; label: string; icon: any }[] = [
    { id: 'input', label: 'Details', icon: BookOpen },
    { id: 'titles', label: 'Title', icon: Sparkles },
    { id: 'outline', label: 'Outline', icon: FileText },
    { id: 'content', label: 'Generate', icon: Sparkles },
    { id: 'template', label: 'Template', icon: FileText },
    { id: 'cover', label: 'Cover', icon: Palette },
    { id: 'export', label: 'Export', icon: Download },
  ];

  const getCurrentStepIndex = () => steps.findIndex(s => s.id === currentStep);

  const handleNext = async () => {
    const stepIndex = getCurrentStepIndex();
    if (stepIndex < steps.length - 1) {
      const nextStep = steps[stepIndex + 1].id;

      if (currentStep === 'input' && nextStep === 'titles') {
        await generateTitles();
      } else if (currentStep === 'titles' && nextStep === 'outline') {
        await generateOutline();
      } else if (currentStep === 'outline' && nextStep === 'content') {
        await generateContent();
      }

      setCurrentStep(nextStep);
    }
  };

  const handlePrevious = () => {
    const stepIndex = getCurrentStepIndex();
    if (stepIndex > 0) {
      setCurrentStep(steps[stepIndex - 1].id);
    }
  };

  const generateTitles = async () => {
    setLoading(true);
    setError('');
    try {
      const mistral = new MistralService();
      const titles = await mistral.generateTitles({ topic, audience, tone });
      setGeneratedTitles(titles);
      setSelectedTitle(titles[0] || `The Complete Guide to ${topic}`);
    } catch (err: any) {
      setError(err.message || 'Failed to generate titles');
      console.error('Title generation error:', err);
    } finally {
      setLoading(false);
    }
  };

  const generateOutline = async () => {
    setLoading(true);
    setError('');
    try {
      const mistral = new MistralService();
      const outline = await mistral.generateChapterOutline({ title: selectedTitle, topic, audience, tone, chapterCount: 8 });
      const chapterList: Chapter[] = outline.map((ch) => ({
        id: ch.number.toString(),
        ebook_id: '',
        chapter_number: ch.number,
        title: ch.title,
        content: '',
        word_count: 0,
        created_at: new Date().toISOString()
      }));
      setChapters(chapterList);
    } catch (err: any) {
      setError(err.message || 'Failed to generate outline');
      console.error('Outline generation error:', err);
    } finally {
      setLoading(false);
    }
  };

  const generateContent = async () => {
    setLoading(true);
    setError('');
    try {
      const mistral = new MistralService();
      const updatedChapters = [];

      for (const chapter of chapters) {
        const content = await mistral.generateChapterContent(
          selectedTitle,
          chapter.title,
          chapter.chapter_number,
          tone,
          audience
        );
        updatedChapters.push({
          ...chapter,
          content,
          word_count: content.split(/\s+/).length
        });
      }

      setChapters(updatedChapters);
    } catch (err: any) {
      setError(err.message || 'Failed to generate content');
      console.error('Content generation error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateCover = async () => {
    setGeneratingCover(true);
    setError('');

    try {
      // Build the prompt with user input and book context
      let theme = selectedTitle;
      if (coverPrompt.trim()) {
        theme += `, ${coverPrompt}`;
      }
      theme += `, colors: ${primaryColor} and ${secondaryColor}`;

      // Get the current session for auth
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Not authenticated. Please log in again.');
      }

      // Get Supabase URL from environment
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      if (!supabaseUrl) {
        throw new Error('Supabase URL not configured');
      }
      const functionUrl = `${supabaseUrl}/functions/v1/generate-cover`;

      console.log('Calling Edge Function:', functionUrl);
      console.log('Request payload:', { theme, mood: tone, style: coverStyle, aspectRatio: '2:3' });

      // Call the Edge Function directly with fetch for better control
      const response = await fetch(functionUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          theme,
          mood: tone,
          style: coverStyle,
          aspectRatio: '2:3'
        })
      });

      console.log('Response status:', response.status);
      console.log('Response headers:', Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Edge Function error response:', errorText);
        
        // Try to parse as JSON for better error message
        try {
          const errorJson = JSON.parse(errorText);
          throw new Error(errorJson.error || errorText);
        } catch {
          throw new Error(`Server error (${response.status}): ${errorText}`);
        }
      }

      // Check content type
      const contentType = response.headers.get('content-type');
      console.log('Response content-type:', contentType);

      // Get the image blob
      const imageBlob = await response.blob();
      console.log('Received blob size:', imageBlob.size, 'bytes');

      // Verify the blob has content
      if (imageBlob.size === 0) {
        throw new Error('Received empty image data');
      }

      const url = URL.createObjectURL(imageBlob);
      setGeneratedCoverUrl(url);
      console.log('Cover generated successfully!');
    } catch (err: any) {
      console.error('Cover generation error:', err);
      let errorMessage = 'Failed to generate cover.';
      
      if (err.message?.includes('Stability AI API key not configured')) {
        errorMessage = 'Stability AI API key not configured. Please contact administrator.';
      } else if (err.message?.includes('Unauthorized') || err.message?.includes('Not authenticated')) {
        errorMessage = 'Authentication failed. Please log in again.';
      } else if (err.message?.includes('Stability AI error')) {
        errorMessage = 'Stability AI service error. Please check your API key and credits.';
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
    } finally {
      setGeneratingCover(false);
    }
  };

  const handleComplete = () => {
    const projectId = Date.now().toString();
    const now = new Date().toISOString();

    const project = {
      id: projectId,
      user_id: '',
      title: selectedTitle,
      topic: topic,
      audience: audience,
      tone: tone,
      status: 'completed' as const,
      word_count: chapters.reduce((sum, ch) => sum + ch.word_count, 0),
      chapter_count: chapters.length,
      created_at: now,
      updated_at: now,
      cover_url: generatedCoverUrl,
      chapters: chapters
    };
    onComplete(project);
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 'input':
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Let's Create Your eBook</h3>
              <p className="text-gray-600">Tell us about your book and we'll generate amazing content</p>
            </div>

            <div className="space-y-4">
              <Input
                label="Book Topic"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="e.g., Digital Marketing, Healthy Cooking, Personal Finance"
                required
              />

              <Input
                label="Target Audience"
                value={audience}
                onChange={(e) => setAudience(e.target.value)}
                placeholder="e.g., Beginners, Small Business Owners, Students"
                required
              />

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Tone</label>
                <div className="grid grid-cols-2 gap-3">
                  {['self-help', 'fiction', 'journal', 'guide', 'professional'].map((t) => (
                    <button
                      key={t}
                      onClick={() => setTone(t as any)}
                      className={`px-4 py-3 rounded-lg border-2 transition-all ${
                        tone === t
                          ? 'border-blue-600 bg-blue-50 text-blue-700 font-medium'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      {t.charAt(0).toUpperCase() + t.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 mt-6">
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              )}
            </div>
          </div>
        );

      case 'titles':
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Choose Your Title</h3>
              <p className="text-gray-600">Select or customize a title for your eBook</p>
            </div>

            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Generating title suggestions...</p>
              </div>
            ) : (
              <div className="space-y-3">
                {generatedTitles.map((title, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedTitle(title)}
                    className={`w-full p-4 rounded-lg border-2 text-left transition-all ${
                      selectedTitle === title
                        ? 'border-blue-600 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <p className="font-medium text-gray-900">{title}</p>
                  </button>
                ))}
                <Input
                  label="Or enter your own title"
                  value={selectedTitle}
                  onChange={(e) => setSelectedTitle(e.target.value)}
                  placeholder="Custom title"
                />
              </div>
            )}
          </div>
        );

      case 'outline':
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Chapter Outline</h3>
              <p className="text-gray-600">Review and edit your book's structure</p>
            </div>

            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Creating chapter outline...</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {chapters.map((chapter, index) => (
                  <div key={chapter.id} className="flex items-center p-3 bg-gray-50 rounded-lg">
                    <span className="text-sm font-medium text-gray-500 mr-3">{index + 1}</span>
                    <Input
                      value={chapter.title}
                      onChange={(e) => {
                        const newChapters = [...chapters];
                        newChapters[index].title = e.target.value;
                        setChapters(newChapters);
                      }}
                      className="flex-1"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        );

      case 'content':
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Generate Content</h3>
              <p className="text-gray-600">AI will write your entire eBook</p>
            </div>

            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Writing your eBook... This may take a few minutes</p>
                <p className="text-sm text-gray-500 mt-2">
                  {chapters.filter(c => c.content).length} of {chapters.length} chapters completed
                </p>
              </div>
            ) : (
              <div>
                <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
                  <Sparkles className="w-12 h-12 text-green-600 mx-auto mb-3" />
                  <h4 className="text-lg font-semibold text-green-900 mb-2">Content Generated!</h4>
                  <p className="text-green-700">
                    Your eBook has {chapters.length} chapters with a total of{' '}
                    {chapters.reduce((sum, ch) => sum + ch.word_count, 0).toLocaleString()} words
                  </p>
                </div>

                <div className="mt-6 space-y-2">
                  {chapters.map((chapter) => (
                    <div key={chapter.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <span className="font-medium text-gray-900">{chapter.title}</span>
                      <span className="text-sm text-gray-600">{chapter.word_count} words</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        );

      case 'template':
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Choose a Template</h3>
              <p className="text-gray-600">Select a formatting style for your eBook</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                { id: 'minimal-professional', name: 'Minimal Professional', gradient: 'from-slate-100 via-gray-100 to-zinc-100', icon: '📄' },
                { id: 'creative-journal', name: 'Creative Journal', gradient: 'from-orange-100 via-amber-100 to-yellow-100', icon: '✨' },
                { id: 'elegant-typography', name: 'Elegant Typography', gradient: 'from-purple-100 via-indigo-100 to-blue-100', icon: '📖' }
              ].map((template) => (
                <button
                  key={template.id}
                  onClick={() => setSelectedTemplate(template.id)}
                  className={`p-6 rounded-lg border-2 transition-all ${
                    selectedTemplate === template.id
                      ? 'border-blue-600 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className={`aspect-[3/4] bg-gradient-to-br ${template.gradient} rounded mb-3 flex items-center justify-center relative overflow-hidden`}>
                    <div className="absolute inset-0 flex flex-col items-center justify-center p-4">
                      <div className="text-4xl mb-2">{template.icon}</div>
                      <div className="w-full space-y-2">
                        <div className="h-2 bg-white/40 rounded w-3/4 mx-auto"></div>
                        <div className="h-2 bg-white/30 rounded w-full"></div>
                        <div className="h-2 bg-white/30 rounded w-5/6 mx-auto"></div>
                        <div className="h-2 bg-white/20 rounded w-4/5 mx-auto mt-4"></div>
                        <div className="h-1 bg-white/20 rounded w-full"></div>
                        <div className="h-1 bg-white/20 rounded w-full"></div>
                        <div className="h-1 bg-white/20 rounded w-3/4"></div>
                      </div>
                    </div>
                  </div>
                  <h4 className="font-semibold text-gray-900">
                    {template.name}
                  </h4>
                </button>
              ))}
            </div>
          </div>
        );

      case 'cover':
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Design Your Cover</h3>
              <p className="text-gray-600">AI will generate a professional book cover based on your preferences</p>
            </div>

            {generatedCoverUrl ? (
              <div className="space-y-4">
                <div className="relative aspect-[2/3] max-w-md mx-auto rounded-lg overflow-hidden shadow-xl">
                  <img src={generatedCoverUrl} alt="Generated cover" className="w-full h-full object-cover" />
                </div>
                <div className="flex justify-center gap-3">
                  <Button
                    variant="primary"
                    onClick={() => {
                      const a = document.createElement('a');
                      a.href = generatedCoverUrl;
                      a.download = `${selectedTitle.replace(/[^a-z0-9]/gi, '_')}_cover.png`;
                      document.body.appendChild(a);
                      a.click();
                      document.body.removeChild(a);
                    }}
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Download Cover Image
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setGeneratedCoverUrl(null);
                      setCoverPrompt('');
                    }}
                  >
                    Generate New Cover
                  </Button>
                </div>
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <p className="text-sm text-green-800 text-center">
                    ✓ Cover generated successfully! You can download it or generate a new one.
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="bg-gradient-to-br from-blue-50 to-purple-50 border-2 border-blue-200 rounded-lg p-6">
                  <div className="flex items-start gap-3 mb-4">
                    <Wand2 className="w-6 h-6 text-blue-600 mt-1" />
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-1">AI-Powered Cover Generation</h4>
                      <p className="text-sm text-gray-600">
                        Describe your vision for the cover. The AI will use your book title "{selectedTitle}" as the main influence.
                      </p>
                    </div>
                  </div>

                  <TextArea
                    label="Cover Description"
                    value={coverPrompt}
                    onChange={(e) => setCoverPrompt(e.target.value)}
                    placeholder="e.g., Modern design with geometric shapes, vibrant sunset colors, minimalist tech theme..."
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Cover Style</label>
                    <div className="grid grid-cols-3 gap-2">
                      {(['minimal', 'artistic', 'professional'] as const).map((style) => (
                        <button
                          key={style}
                          onClick={() => setCoverStyle(style)}
                          className={`px-3 py-2 rounded-lg border-2 text-sm font-medium transition-all ${
                            coverStyle === style
                              ? 'border-blue-600 bg-blue-50 text-blue-700'
                              : 'border-gray-200 hover:border-gray-300 text-gray-700'
                          }`}
                        >
                          {style.charAt(0).toUpperCase() + style.slice(1)}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Brand Colors</label>
                    <div className="flex gap-3">
                      <div className="flex-1">
                        <label className="block text-xs text-gray-600 mb-1">Primary</label>
                        <input
                          type="color"
                          value={primaryColor}
                          onChange={(e) => setPrimaryColor(e.target.value)}
                          className="w-full h-10 rounded border border-gray-300 cursor-pointer"
                        />
                      </div>
                      <div className="flex-1">
                        <label className="block text-xs text-gray-600 mb-1">Secondary</label>
                        <input
                          type="color"
                          value={secondaryColor}
                          onChange={(e) => setSecondaryColor(e.target.value)}
                          className="w-full h-10 rounded border border-gray-300 cursor-pointer"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <Button
                  variant="primary"
                  size="lg"
                  className="w-full"
                  onClick={handleGenerateCover}
                  disabled={generatingCover}
                >
                  {generatingCover ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      Generating Cover...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-5 h-5 mr-2" />
                      Generate Cover with AI
                    </>
                  )}
                </Button>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm text-blue-800">
                    <strong>Required:</strong> Generate a professional cover for your eBook. This will be used in PDF exports and marketing materials.
                  </p>
                </div>

                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <p className="text-sm text-red-700">{error}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        );

      case 'export':
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Export Your eBook</h3>
              <p className="text-gray-600">Download in your preferred format</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button className="p-6 border-2 border-gray-200 rounded-lg hover:border-blue-600 hover:bg-blue-50 transition-all">
                <FileText className="w-10 h-10 text-gray-600 mb-3" />
                <h4 className="font-semibold text-gray-900 mb-1">PDF</h4>
                <p className="text-sm text-gray-600">Perfect for Gumroad, Etsy, Whop</p>
              </button>

              <button className="p-6 border-2 border-gray-200 rounded-lg hover:border-blue-600 hover:bg-blue-50 transition-all">
                <BookOpen className="w-10 h-10 text-gray-600 mb-3" />
                <h4 className="font-semibold text-gray-900 mb-1">EPUB</h4>
                <p className="text-sm text-gray-600">Optimized for Amazon KDP</p>
              </button>
            </div>

            <Button
              variant="primary"
              size="lg"
              className="w-full"
              onClick={handleComplete}
            >
              Complete & Save to Dashboard
            </Button>
          </div>
        );

      default:
        return null;
    }
  };

  const canProceed = () => {
    if (currentStep === 'input') {
      return topic && audience && tone;
    }
    if (currentStep === 'titles') {
      return selectedTitle;
    }
    if (currentStep === 'cover') {
      return generatedCoverUrl !== null; // Cover is now required
    }
    return true;
  };

  return (
    <Modal isOpen={true} onClose={onClose} size="xl">
      <div className="min-h-[600px] flex flex-col">
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            {steps.map((step, index) => {
              const Icon = step.icon;
              const isActive = step.id === currentStep;
              const isCompleted = getCurrentStepIndex() > index;

              return (
                <div key={step.id} className="flex items-center flex-1">
                  <div className={`flex flex-col items-center ${index > 0 ? 'flex-1' : ''}`}>
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        isActive
                          ? 'bg-blue-600 text-white'
                          : isCompleted
                          ? 'bg-green-500 text-white'
                          : 'bg-gray-200 text-gray-400'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className={`text-xs mt-1 ${isActive ? 'font-medium text-blue-600' : 'text-gray-500'}`}>
                      {step.label}
                    </span>
                  </div>
                  {index < steps.length - 1 && (
                    <div className={`h-0.5 flex-1 ${isCompleted ? 'bg-green-500' : 'bg-gray-200'}`} />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {renderStepContent()}
        </div>

        <div className="flex justify-between mt-6 pt-6 border-t border-gray-200">
          <Button
            variant="outline"
            onClick={handlePrevious}
            disabled={getCurrentStepIndex() === 0}
          >
            <ChevronLeft className="w-5 h-5 mr-1" />
            Previous
          </Button>

          <Button
            variant="primary"
            onClick={handleNext}
            disabled={!canProceed() || loading || getCurrentStepIndex() === steps.length - 1}
          >
            {loading ? 'Processing...' : 'Next'}
            <ChevronRight className="w-5 h-5 ml-1" />
          </Button>
        </div>
      </div>
    </Modal>
  );
};
