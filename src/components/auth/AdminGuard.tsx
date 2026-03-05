import { Navigate, useLocation } from 'react-router-dom';
import { useUserStore } from '../../store/useUserStore';

// Add the admin emails here. I am hardcoding a placeholder email for now as I did not get a specific email from the user.
// The user will need to update this with their actual admin email.
export const ADMIN_EMAILS = ['gishisrael432@gmail.com', '']; 

interface AdminGuardProps {
  children: React.ReactNode;
}

export default function AdminGuard({ children }: AdminGuardProps) {
  const { user } = useUserStore();
  const location = useLocation();

  // If there's no user, or their email isn't in the admin list, redirect to the dashboard
  if (!user || !user.email || !ADMIN_EMAILS.includes(user.email)) {
    return <Navigate to="/dashboard" state={{ from: location }} replace />;
  }

  return <>{children}</>;
}
