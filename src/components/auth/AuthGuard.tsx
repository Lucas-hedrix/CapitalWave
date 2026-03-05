import { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useUserStore } from '../../store/useUserStore';
import { supabase } from '../../lib/supabase';
import { Loader2 } from 'lucide-react';

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, session, setUser, setSession } = useUserStore();
  const [isLoading, setIsLoading] = useState(true);
  const location = useLocation();

  useEffect(() => {
    // Internal helper to fetch both session and KYC Status
    const updateSessionAndKyc = async (currentSession: any) => {
      setSession(currentSession);
      const currentUser = currentSession?.user ?? null;
      setUser(currentUser);

      if (currentUser) {
        // Fetch the user's latest KYC document
        const { data } = await supabase
          .from('kyc_documents')
          .select('status')
          .eq('user_id', currentUser.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (data) {
          useUserStore.getState().setKycStatus(data.status as 'pending' | 'approved' | 'rejected');
        } else {
          useUserStore.getState().setKycStatus('none');
        }
      } else {
        useUserStore.getState().setKycStatus('none');
      }
      
      setIsLoading(false);
    };

    // Check active sessions and sets the user
    supabase.auth.getSession().then(({ data: { session: currentSession } }) => {
      updateSessionAndKyc(currentSession);
    });

    // Listen for changes on auth state (log in, log out, etc.)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, currentSession) => {
      updateSessionAndKyc(currentSession);
    });

    return () => subscription.unsubscribe();
  }, [setUser, setSession]);

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-navy">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  if (!user || !session) {
    // Redirect them to the /login page, but save the current location they were
    // trying to go to when they were redirected. This allows us to send them
    // along to that page after they login, which is a nicer user experience.
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
}
