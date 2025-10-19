import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/Button';
import { BookOpen, Plus, LogOut, FileText, Download, Settings } from 'lucide-react';
import { EBookWizard } from '../components/EBookWizard';
import { ExportModal } from '../components/ExportModal';
import { EBook, Chapter } from '../types';
import { supabase } from '../lib/supabase';

interface EBookProject extends EBook {
  chapters: Chapter[];
}

export const Dashboard: React.FC<{ onNavigateToAdmin?: () => void }> = ({ onNavigateToAdmin }) => {
  const { user, signOut } = useAuth();
  const [projects, setProjects] = useState<EBookProject[]>([]);
  const [showWizard, setShowWizard] = useState(false);
  const [exportingProject, setExportingProject] = useState<EBookProject | null>(null);
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState<any>(null);

  useEffect(() => {
    loadUserProfile();
    loadProjects();
  }, [user]);

  const loadUserProfile = async () => {
    if (!user) return;

    try {
      let { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();

      if (error) throw error;
      
      // If profile doesn't exist, create it
      if (!data) {
        console.log('Profile not found, creating new profile for user:', user.id);
        const { data: newProfile, error: createError } = await supabase
          .from('profiles')
          .insert({
            id: user.id,
            email: user.email,
            role: 'user',
            subscription_tier: 'free',
            ebooks_limit: 3,
            ebooks_created: 0
          })
          .select()
          .single();
        
        if (createError) {
          console.error('Error creating profile:', createError);
          throw createError;
        }
        
        data = newProfile;
      }
      
      setUserProfile(data);
    } catch (error) {
      console.error('Error loading profile:', error);
    }
  };

  const loadProjects = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const { data: ebooks, error: ebooksError } = await supabase
        .from('ebooks')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (ebooksError) throw ebooksError;

      const projectsWithChapters = await Promise.all(
        (ebooks || []).map(async (ebook) => {
          const { data: chapters, error: chaptersError } = await supabase
            .from('chapters')
            .select('*')
            .eq('ebook_id', ebook.id)
            .order('chapter_number');

          if (chaptersError) {
            console.error('Error loading chapters:', chaptersError);
            return { ...ebook, chapters: [] };
          }

          return { ...ebook, chapters: chapters || [] };
        })
      );

      setProjects(projectsWithChapters);
    } catch (error) {
      console.error('Error loading projects:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateNew = () => {
    if (!userProfile) {
      alert('Loading your profile... Please try again in a moment.');
      loadUserProfile(); // Retry loading profile
      return;
    }

    if (userProfile.ebooks_created >= userProfile.ebooks_limit) {
      alert(`You've reached your limit of ${userProfile.ebooks_limit} eBooks. Please upgrade your subscription to create more.`);
      return;
    }

    setShowWizard(true);
  };

  const handleWizardComplete = async (projectData: EBookProject) => {
    if (!user) return;

    try {
      const { data: ebook, error: ebookError } = await supabase
        .from('ebooks')
        .insert({
          user_id: user.id,
          title: projectData.title,
          topic: projectData.topic,
          audience: projectData.audience,
          tone: projectData.tone,
          status: projectData.status,
          word_count: projectData.word_count,
          chapter_count: projectData.chapter_count,
          template_id: 'minimal-professional',
          cover_url: projectData.cover_url || null
        })
        .select()
        .single();

      if (ebookError) throw ebookError;

      const chaptersToInsert = projectData.chapters.map((ch, index) => ({
        ebook_id: ebook.id,
        chapter_number: index + 1,
        title: ch.title,
        content: ch.content,
        word_count: ch.word_count
      }));

      const { error: chaptersError } = await supabase
        .from('chapters')
        .insert(chaptersToInsert);

      if (chaptersError) throw chaptersError;

      await supabase
        .from('profiles')
        .update({ ebooks_created: (userProfile?.ebooks_created || 0) + 1 })
        .eq('id', user.id);

      await loadProjects();
      await loadUserProfile();
    } catch (error: any) {
      console.error('Error saving ebook:', error);
      alert('Failed to save eBook: ' + error.message);
    } finally {
      setShowWizard(false);
    }
  };

  const handleExportClick = (project: EBookProject, e: React.MouseEvent) => {
    e.stopPropagation();
    setExportingProject(project);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <nav className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="bg-blue-600 p-2 rounded-lg">
                <BookOpen className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-xl font-bold text-gray-900">eBook Generator</h1>
            </div>

            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">{user?.email}</span>
              {userProfile?.role === 'admin' && onNavigateToAdmin && (
                <Button variant="secondary" size="sm" onClick={onNavigateToAdmin}>
                  <Settings className="w-4 h-4 mr-2" />
                  Admin Panel
                </Button>
              )}
              <Button variant="outline" size="sm" onClick={signOut}>
                <LogOut className="w-4 h-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-3xl font-bold text-gray-900">My eBooks</h2>
              <p className="text-gray-600 mt-1">
                {userProfile && (
                  <span>
                    {userProfile.ebooks_created} / {userProfile.ebooks_limit} eBooks created
                    {userProfile.subscription_tier !== 'free' && ` • ${userProfile.subscription_tier.toUpperCase()} Plan`}
                  </span>
                )}
              </p>
            </div>
            <Button variant="primary" onClick={handleCreateNew} disabled={loading}>
              <Plus className="w-5 h-5 mr-2" />
              Create New eBook
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading your eBooks...</p>
          </div>
        ) : projects.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
            <div className="bg-blue-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
              <BookOpen className="w-10 h-10 text-blue-600" />
            </div>
            <h3 className="text-2xl font-semibold text-gray-900 mb-2">No eBooks yet</h3>
            <p className="text-gray-600 mb-6 max-w-md mx-auto">
              Start creating your first eBook with AI-powered content generation and professional cover design
            </p>
            <Button variant="primary" onClick={handleCreateNew}>
              <Plus className="w-5 h-5 mr-2" />
              Create Your First eBook
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project) => (
              <div
                key={project.id}
                className="bg-white rounded-xl shadow-md hover:shadow-xl transition-shadow p-6 cursor-pointer"
              >
                <div className="flex items-start justify-between mb-4">
                  <FileText className="w-8 h-8 text-blue-600" />
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-medium ${
                      project.status === 'completed'
                        ? 'bg-green-100 text-green-700'
                        : project.status === 'generating'
                        ? 'bg-yellow-100 text-yellow-700'
                        : 'bg-gray-100 text-gray-700'
                    }`}
                  >
                    {project.status}
                  </span>
                </div>

                <h3 className="text-xl font-semibold text-gray-900 mb-2 line-clamp-2">
                  {project.title}
                </h3>

                <div className="space-y-2 mb-4">
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>Chapters:</span>
                    <span className="font-medium">{project.chapter_count}</span>
                  </div>
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>Word Count:</span>
                    <span className="font-medium">{project.word_count.toLocaleString()}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                  <span className="text-xs text-gray-500">
                    Updated {new Date(project.updated_at).toLocaleDateString()}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={(e) => handleExportClick(project, e)}
                  >
                    <Download className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {showWizard && (
        <EBookWizard
          onClose={() => setShowWizard(false)}
          onComplete={handleWizardComplete}
        />
      )}

      {exportingProject && (
        <ExportModal
          isOpen={true}
          onClose={() => setExportingProject(null)}
          ebook={exportingProject}
          chapters={exportingProject.chapters}
        />
      )}
    </div>
  );
};
