import { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, Lock, AlertCircle } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';
import emailjs from '@emailjs/browser';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
      
      // Attempt to send login notification email via EmailJS
      // Note: The user will need to configure their own EmailJS credentials
      try {
        const templateParams = {
          to_email: email,
          user_name: data.user?.user_metadata?.first_name || 'User',
          login_time: new Date().toLocaleString(),
          browser: navigator.userAgent
        };
        
        await emailjs.send(
          'YOUR_SERVICE_ID', // Replace with EmailJS Service ID
          'YOUR_TEMPLATE_ID', // Replace with EmailJS Template ID
          templateParams,
          'YOUR_PUBLIC_KEY' // Replace with EmailJS Public Key
        );
        console.log('Login notification email sent successfully.');
      } catch (emailErr) {
        console.error('Failed to send login notification email:', emailErr);
        // We don't throw here because the user successfully logged in, 
        // we just failed to send the notification.
      }
      
      toast.success('Welcome back!');
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Failed to login');
      toast.error(err.message || 'Failed to login');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-[calc(100vh-4rem)] items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-navy-light/80 backdrop-blur-xl border border-white/10 rounded-2xl p-6 sm:p-10 shadow-2xl relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-[80px] -z-10" />

        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-white tracking-tight mb-2">
            Welcome Back
          </h2>
          <p className="text-slate-400">Sign in to access your portfolio</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-danger/10 border border-danger/20 rounded-lg flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-danger flex-shrink-0 mt-0.5" />
            <p className="text-sm text-danger/90">{error}</p>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-5">
          <label className="space-y-1.5 block">
            <span className="text-sm font-medium text-slate-300">Email Address</span>
            <div className="relative">
              <Mail className="absolute left-3 top-3.5 w-5 h-5 text-slate-500" />
              <input 
                type="email" 
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-navy border border-white/10 rounded-lg pl-10 pr-4 py-3 text-white focus:outline-none focus:border-primary transition-colors" 
                placeholder="john@example.com" 
              />
            </div>
          </label>

          <label className="space-y-1.5 block">
            <span className="text-sm font-medium text-slate-300">Password</span>
            <div className="relative">
              <Lock className="absolute left-3 top-3.5 w-5 h-5 text-slate-500" />
              <input 
                type="password" 
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-navy border border-white/10 rounded-lg pl-10 pr-4 py-3 text-white focus:outline-none focus:border-primary transition-colors" 
                placeholder="••••••••" 
              />
            </div>
          </label>

          <div className="flex justify-end">
            <a href="#" className="text-sm text-primary hover:text-primary-hover transition-colors">
              Forgot password?
            </a>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary hover:bg-primary-hover text-white font-bold py-3 px-6 rounded-lg transition-all active:scale-95 disabled:opacity-50 disabled:active:scale-100 mt-2"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div className="mt-8 text-center text-sm text-slate-400">
          Don't have an account?{' '}
          <Link to="/onboarding" className="text-primary hover:text-primary-hover font-medium transition-colors">
            Open an account
          </Link>
        </div>

      </motion.div>
    </div>
  );
}
