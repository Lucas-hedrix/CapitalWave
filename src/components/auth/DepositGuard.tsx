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
        // Fetch all of the user's deposits
        const { data, error } = await supabase
          .from('deposits')
          .select('status')
          .eq('user_id', user.id);

        if (error) {
          console.error('Error fetching deposit:', error);
        }

        if (isMounted) {
          if (data && data.length > 0) {
            if (data.some(d => d.status === 'approved')) {
              setDepositStatus('approved');
            } else if (data.some(d => d.status === 'pending')) {
              setDepositStatus('pending');
            } else {
              setDepositStatus('none');
            }
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
