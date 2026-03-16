import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/authStore';
import { Loader2 } from 'lucide-react';

const API_BASE = 'https://leadgen-backend-production-4e93.up.railway.app';

const AuthCallback = () => {
  const navigate = useNavigate();
  const setSession = useAuthStore(s => s.setSession);
  const [error, setError] = useState('');

  useEffect(() => {
    let handled = false;

    const processSession = async (session: any) => {
      if (handled) return;
      handled = true;
      try {
        const res = await fetch(`${API_BASE}/api/auth/me`, {
          headers: { Authorization: `Bearer ${session.access_token}` },
        });
        if (!res.ok) throw new Error('Failed to fetch user profile');
        const data = await res.json();
        const user = data.user || data;
        setSession(
          {
            id: user.id || session.user.id,
            email: user.email || session.user.email || '',
            name: user.name || session.user.user_metadata?.full_name || '',
            role: user.role,
            useCases: user.useCases || [],
          },
          session.access_token,
          session.refresh_token || ''
        );
        navigate('/dashboard', { replace: true });
      } catch (err: any) {
        setError(err.message || 'Authentication failed');
        setTimeout(() => navigate('/login', { replace: true }), 3000);
      }
    };

    // Listen for auth state change (handles PKCE code exchange)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if ((event === 'SIGNED_IN' || event === 'INITIAL_SESSION') && session) {
        processSession(session);
      }
    });

    // Also try getSession directly (handles hash fragment flow)
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) processSession(session);
    });

    return () => subscription.unsubscribe();
  }, [navigate, setSession]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-2">
          <p className="text-destructive font-medium">{error}</p>
          <p className="text-sm text-muted-foreground">Redirecting to login...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-accent" />
        <p className="text-sm text-muted-foreground">Completing sign in...</p>
      </div>
    </div>
  );
};

export default AuthCallback;
