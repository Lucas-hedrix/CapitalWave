import { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useUserStore } from '../../store/useUserStore';
import { supabase } from '../../lib/supabase';
import { Loader2 } from 'lucide-react';

export default function DepositGuard({ children }: { children: React.ReactNode }) {
  const { user, depositStatus, setDepositStatus } = useUserStore();
  const [isLoading, setIsLoading] = useState(true);
  const location = useLocation();

  useEffect(() => {
    let isMounted = true;

    async function checkDeposit() {
      if (!user) {
        setIsLoading(false);
        return;
      }

      try {
        // Fetch the user's latest deposit
        const { data, error } = await supabase
          .from('deposits')
          .select('status')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (error) {
          console.error('Error fetching deposit:', error);
        }

        if (isMounted) {
          if (data) {
            setDepositStatus(data.status as 'pending' | 'approved');
          } else {
            setDepositStatus('none');
          }
        }
      } catch (err) {
        console.error('Failed to check deposit:', err);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    checkDeposit();

    return () => {
      isMounted = false;
    };
  }, [user, setDepositStatus]);

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-navy">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  // If the user's deposit is pending or none, don't let them access the children
  // (unless they are already on the deposit page, which we'll handle in App.tsx routing by placing /deposit outside this guard)
  if (depositStatus !== 'approved') {
    return <Navigate to="/deposit" state={{ from: location }} replace />;
  }

  return <>{children}</>;
}
