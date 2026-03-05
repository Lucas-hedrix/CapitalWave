import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, ArrowUpRight, Clock, CheckCircle2, Activity } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useUserStore } from '../../store/useUserStore';
import clsx from 'clsx';
import { useNavigate } from 'react-router-dom';

interface NotificationItem {
  id: string;
  title: string;
  message: string;
  timestamp: string;
  isRead: boolean;
  type: 'deposit' | 'withdrawal' | 'trade';
  status: 'pending' | 'approved' | 'completed' | 'rejected';
}

export default function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const { user } = useUserStore();
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Close dropdown when clicking outside
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (!user) return;

    const fetchNotifications = async () => {
      // 1. Fetch recent deposits
      const { data: depData } = await supabase
        .from('deposits')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(5);

      // 2. Fetch recent withdrawals/trades
      const { data: txData } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(5);

      let items: NotificationItem[] = [];

      if (depData) {
        items = [...items, ...depData.map(d => ({
          id: `dep-${d.id}`,
          title: `Deposit ${d.status === 'approved' ? 'Successful' : 'Pending'}`,
          message: `$${Number(d.amount).toLocaleString()} ${d.currency}`,
          timestamp: d.created_at,
          isRead: d.status === 'approved', // Automatically marking older ones assumed read if approved for simpler UX, or could use another local storage system.
          type: 'deposit' as const,
          status: d.status
        }))];
      }

      if (txData) {
        items = [...items, ...txData.map(t => ({
          id: `txt-${t.id}`,
          title: `${t.type} ${t.status === 'completed' || t.status === 'approved' ? 'Successful' : 'Pending'}`,
          message: t.type === 'Withdrawal' 
            ? `$${Number(t.price).toLocaleString()} ${t.asset_symbol}`
            : `${t.quantity} ${t.asset_symbol} @ $${Number(t.price).toLocaleString()}`,
          timestamp: t.created_at,
          isRead: t.status === 'completed' || t.status === 'approved',
          type: t.type === 'Withdrawal' ? 'withdrawal' as const : 'trade' as const,
          status: t.status
        }))];
      }

      // Sort by newest
      items.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      
      // Limit to 8 total
      setNotifications(items.slice(0, 8));
    };

    fetchNotifications();

    // Simple polling for now
    const interval = setInterval(fetchNotifications, 15000);
    return () => clearInterval(interval);
  }, [user]);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const handleNotificationClick = (n: NotificationItem) => {
    // Navigate based on type
    setIsOpen(false);
    if (n.type === 'deposit' || n.type === 'withdrawal') {
       navigate('/portfolio');
    } else {
       navigate('/dashboard');
    }
  };

  const getIcon = (type: string, status: string) => {
    if (status === 'pending') return <Clock className="w-4 h-4 text-amber-500" />;
    
    switch (type) {
      case 'deposit': return <CheckCircle2 className="w-4 h-4 text-emerald-500" />;
      case 'withdrawal': return <ArrowUpRight className="w-4 h-4 text-primary" />;
      case 'trade': return <Activity className="w-4 h-4 text-purple-400" />;
      default: return <Bell className="w-4 h-4 text-slate-400" />;
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-10 h-10 rounded-full bg-navy border border-white/10 flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/5 transition-colors relative"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-2 right-2.5 w-2 h-2 rounded-full bg-danger ring-2 ring-navy animate-pulse" />
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl bg-navy-light border border-white/10 shadow-2xl z-50 overflow-hidden backdrop-blur-xl"
          >
            <div className="p-4 border-b border-white/5 flex items-center justify-between bg-navy/50">
              <h3 className="font-bold text-white tracking-tight flex items-center gap-2">
                Notifications
                {unreadCount > 0 && (
                  <span className="bg-primary/20 text-primary text-xs px-2 py-0.5 rounded-full font-medium">
                    {unreadCount} new
                  </span>
                )}
              </h3>
            </div>

            <div className="max-h-[400px] overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="p-8 text-center text-slate-400 flex flex-col items-center">
                  <Bell className="w-8 h-8 opacity-20 mb-2" />
                  <p className="text-sm">You have no notifications yet.</p>
                </div>
              ) : (
                <div className="divide-y divide-white/5">
                  {notifications.map((n) => (
                    <button
                      key={n.id}
                      onClick={() => handleNotificationClick(n)}
                      className={clsx(
                        "w-full text-left p-4 hover:bg-white/5 transition-colors flex gap-4 cursor-pointer relative group",
                        !n.isRead ? "bg-primary/5" : ""
                      )}
                    >
                      {!n.isRead && (
                        <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-primary" />
                      )}
                      
                      <div className={clsx(
                        "w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center mt-1",
                        n.status === 'pending' ? "bg-amber-500/10" : 
                        n.type === 'deposit' ? "bg-emerald-500/10" :
                        n.type === 'trade' ? "bg-purple-500/10" : "bg-primary/10"
                      )}>
                        {getIcon(n.type, n.status)}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start mb-1 gap-2">
                          <p className={clsx("text-sm font-semibold truncate", !n.isRead ? "text-white" : "text-slate-300")}>
                            {n.title}
                          </p>
                          <span className="text-xs text-slate-500 flex-shrink-0 pt-0.5">
                            {new Date(n.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <p className="text-sm text-slate-400 truncate w-[90%] font-mono">
                          {n.message}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
            
            <div className="p-3 border-t border-white/5 bg-navy/50 text-center">
              <button 
                onClick={() => navigate('/portfolio')}
                className="text-xs font-medium text-primary hover:text-white transition-colors"
              >
                View all in Portfolio
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
