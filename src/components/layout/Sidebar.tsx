import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Wallet, 
  ArrowRightLeft, 
  Settings, 
  LogOut,
  LineChart
} from 'lucide-react';
import clsx from 'clsx';

interface SidebarProps {
  isOpen: boolean;
}

export default function Sidebar({ isOpen }: SidebarProps) {
  const navItems = [
    { name: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
    { name: 'Portfolio', icon: Wallet, path: '/portfolio' },
    { name: 'Markets', icon: LineChart, path: '/markets' },
    { name: 'Transfer', icon: ArrowRightLeft, path: '/transfer' },
  ];

  return (
    <aside
      className={clsx(
        "fixed inset-y-0 left-0 z-40 bg-navy-light border-r border-white/10 w-64 transform transition-transform duration-300 ease-in-out md:translate-x-0 pt-16 flex flex-col",
        isOpen ? "translate-x-0" : "-translate-x-full"
      )}
    >
      <div className="flex-1 py-6 px-4 space-y-2">
        {navItems.map((item) => (
          <NavLink
            key={item.name}
            to={item.path}
            className={({ isActive }) => clsx(
              "flex items-center gap-3 px-4 py-3 rounded-lg transition-colors group text-sm font-medium",
              isActive 
                ? "bg-primary/10 text-primary" 
                : "text-slate-400 hover:text-white hover:bg-white/5"
            )}
          >
            <item.icon className="w-5 h-5" />
            {item.name}
          </NavLink>
        ))}
      </div>

      <div className="p-4 border-t border-white/10 space-y-2">
        <NavLink
          to="/settings"
          className="flex items-center gap-3 px-4 py-3 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors text-sm font-medium"
        >
          <Settings className="w-5 h-5" />
          Settings
        </NavLink>
        <button className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-slate-400 hover:text-danger hover:bg-danger/10 transition-colors text-sm font-medium">
          <LogOut className="w-5 h-5" />
          Log Out
        </button>
      </div>
    </aside>
  );
}
