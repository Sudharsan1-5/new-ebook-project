import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Login } from './pages/Login';
import { SignUp } from './pages/SignUp';
import { Dashboard } from './pages/Dashboard';
import { AdminPanel } from './pages/AdminPanel';
import { Loader2 } from 'lucide-react';
import { supabase } from './lib/supabase';

type AuthView = 'login' | 'signup';
type AppView = 'dashboard' | 'admin';

const AppContent: React.FC = () => {
  const { user, loading: authLoading } = useAuth();
  const [authView, setAuthView] = useState<AuthView>('login');
  const [appView, setAppView] = useState<AppView>('dashboard');
  const [userRole, setUserRole] = useState<'user' | 'admin'>('user');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUserRole();
  }, [user]);

  const loadUserRole = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .maybeSingle();

      if (error) throw error;
      if (data) {
        setUserRole(data.role);
      }
    } catch (error) {
      console.error('Error loading user role:', error);
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-slate-100">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return authView === 'login' ? (
      <Login onNavigateToSignUp={() => setAuthView('signup')} />
    ) : (
      <SignUp onNavigateToLogin={() => setAuthView('login')} />
    );
  }

  if (appView === 'admin' && userRole === 'admin') {
    return <AdminPanel onNavigateToDashboard={() => setAppView('dashboard')} />;
  }

  return <Dashboard onNavigateToAdmin={userRole === 'admin' ? () => setAppView('admin') : undefined} />;
};

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
