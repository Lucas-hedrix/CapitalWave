import { Link } from 'react-router-dom';
import { Menu, Bell, UserCircle } from 'lucide-react';
import clsx from 'clsx';
import { useUserStore } from '../../store/useUserStore';

interface NavbarProps {
  toggleSidebar: () => void;
  isSidebarOpen: boolean;
  isAuthenticated?: boolean;
}

export default function Navbar({ toggleSidebar, isAuthenticated = true }: NavbarProps) {
  const isScrolled = false;
  const { user } = useUserStore();

  // Consider adding a scroll listener in a real app to update isScrolled
  // So the navbar gets a backdrop blur when scrolled down

  return (
    <nav className={clsx(
      "fixed top-0 inset-x-0 z-50 h-16 border-b transition-colors duration-200",
      isScrolled ? "bg-navy/80 backdrop-blur-md border-white/10" : "bg-navy border-white/5"
    )}>
      <div className="h-full px-4 mx-auto flex items-center justify-between">
        
        {/* Left Side: Logo & Menu Toggle */}
        <div className="flex items-center gap-4">
          {isAuthenticated && (
            <button 
              onClick={toggleSidebar}
              className="p-2 -ml-2 text-slate-400 hover:text-white rounded-lg hover:bg-white/5 transition-colors md:hidden"
            >
              <Menu className="w-5 h-5" />
            </button>
          )}
          
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-emerald-400 flex items-center justify-center transform transition-transform group-hover:scale-105">
              <span className="text-white font-bold text-lg leading-none">W</span>
            </div>
            <span className="text-xl font-bold tracking-tight text-white hidden sm:block">
              CapitalWave
            </span>
          </Link>
        </div>

        {/* Right Side: Navigation & Actions */}
        <div className="flex items-center gap-2 sm:gap-4">
          {!isAuthenticated ? (
            <div className="flex items-center gap-3">
              <Link 
                to="/login" 
                className="text-sm font-medium text-slate-300 hover:text-white px-3 py-2 transition-colors hidden sm:block"
              >
                Log In
              </Link>
              <Link 
                to="/onboarding"
                className="trade-btn bg-white text-navy hover:bg-slate-200"
              >
                Open Account
              </Link>
            </div>
          ) : (
            <div className="flex items-center gap-1 sm:gap-3">
              <button className="p-2 text-slate-400 hover:text-white rounded-full hover:bg-white/5 transition-colors relative">
                <Bell className="w-5 h-5" />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-primary rounded-full border border-navy" />
              </button>
              <div className="h-6 w-px bg-white/10 mx-1 hidden sm:block" />
              <button className="flex items-center gap-2 p-1.5 pr-3 bg-navy-lighter hover:bg-white/5 border border-white/5 rounded-full transition-colors group">
                <UserCircle className="w-6 h-6 text-slate-400 group-hover:text-white transition-colors" />
                <span className="text-sm font-medium text-slate-200 hidden sm:block">
                  {user?.user_metadata?.first_name} {user?.user_metadata?.last_name?.charAt(0)}.
                </span>
              </button>
            </div>
          )}
        </div>

      </div>
    </nav>
  );
}
