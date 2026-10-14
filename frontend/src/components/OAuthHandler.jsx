import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../utils/supabase';
import api from '../utils/api';

export default function OAuthHandler() {
  const { login } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const handleAuthRedirect = async () => {
      // Check if URL contains Supabase OAuth hash fragments
      const hasAuthHash = window.location.hash.includes('access_token=') || window.location.hash.includes('error=');
      if (!hasAuthHash) return;

      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) {
          console.error('OAuth getSession error:', error);
          return;
        }

        if (session?.access_token) {
          const res = await api.post('/auth/google-sync', { token: session.access_token }, {
            headers: { Authorization: `Bearer ${session.access_token}` },
          });

          if (res.data?.user && res.data?.jwt) {
            login(res.data.user, res.data.jwt);
            // Clean hash from browser address bar
            window.history.replaceState(null, '', window.location.pathname);
            
            if (res.data.user.role === 'owner') {
              navigate('/admin', { replace: true });
            } else if (res.data.user.role === 'employee') {
              navigate('/employee', { replace: true });
            } else {
              navigate('/dashboard', { replace: true });
            }
          }
        }
      } catch (err) {
        console.error('OAuth sync error:', err);
      }
    };

    handleAuthRedirect();
  }, [login, navigate]);

  return null;
}
