import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { UploadCloud, Copy, CheckCircle2, AlertCircle, X, ChevronRight, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useUserStore } from '../store/useUserStore';
import toast from 'react-hot-toast';
import clsx from 'clsx';
import Navbar from '../components/layout/Navbar';

// Defined Wallets from requirements
const WALLETS = {
  BTC: 'bc1qarlvunv38mhewdrdz6mfurjdnq0fe6gdreydlk',
  USDT: 'TYqFs9VwDRvWZtWDbYnCz7k8p69D7EEyV9',
  ETH: '0x40B8D54d0518169f20BEBF0f962DD6161C58e0A0'
};

export default function Deposit() {
  const { user, depositStatus, setDepositStatus } = useUserStore();
  const navigate = useNavigate();
  
  const [currency, setCurrency] = useState<'BTC' | 'USDT' | 'ETH'>('BTC');
  const [amount, setAmount] = useState('');
  const [receiptBase64, setReceiptBase64] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // If user's deposit is already approved, they might be accessing this from the dashboard.
    // If they access it directly via URL and aren't logged in, they'll be blocked by AuthGuard.
  }, [user, depositStatus, navigate]);

  const handleCopy = () => {
    navigator.clipboard.writeText(WALLETS[currency]);
    setIsCopied(true);
    toast.success('Wallet address copied!', {
      style: { background: '#10b981', color: '#fff' },
      iconTheme: { primary: '#fff', secondary: '#10b981' }
    });
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file (PNG, JPG, etc.)');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size must be less than 5MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      setReceiptBase64(event.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const removeReceipt = () => {
    setReceiptBase64(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = async () => {
    if (!user) {
      toast.error('Authentication Error. Please log in again.');
      return;
    }
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      toast.error('Please enter a valid amount.');
      return;
    }
    if (!receiptBase64) {
      toast.error('Please upload a screenshot of your transaction receipt.');
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from('deposits')
        .insert({
          user_id: user.id,
          currency: currency,
          amount: Number(amount),
          receipt_url: receiptBase64,
          status: 'pending'
        });

      if (error) throw error;

      if (depositStatus !== 'approved') {
        setDepositStatus('pending');
      }
      toast.success('Deposit submitted successfully! Awaiting approval.');
      setAmount('');
      setReceiptBase64(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      
      // We don't necessarily redirect if they are restricted
      // They stay in the pending view.
    } catch (err: any) {
      toast.error(err.message || 'Failed to submit deposit.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Content for pending users
  if (depositStatus === 'pending') {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Navbar toggleSidebar={() => {}} isSidebarOpen={false} isAuthenticated={true} />
        <div className="flex-1 flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-md bg-navy-light/90 backdrop-blur-xl border border-warning/30 rounded-2xl p-8 text-center shadow-2xl relative overflow-hidden"
          >
            <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-warning to-amber-500" />
            <div className="w-20 h-20 bg-warning/10 rounded-full flex items-center justify-center text-warning mx-auto mb-6 ring-4 ring-warning/5">
              <Loader2 className="w-10 h-10 animate-spin" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-3">Deposit Pending</h2>
            <p className="text-slate-300 mb-6 leading-relaxed">
              Your deposit is currently being reviewed by our team. 
              Once approved, you will gain full access to the Trading Dashboard.
            </p>
            <div className="bg-navy p-4 rounded-xl border border-white/5 flex items-start gap-3 text-left">
              <AlertCircle className="w-5 h-5 text-sky-400 mt-0.5 flex-shrink-0" />
              <div className="text-sm">
                <p className="text-white font-medium mb-1">Estimated Review Time</p>
                <p className="text-slate-400">Usually under 1 hour during business hours.</p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  // Normal / None / Approved Deposit View
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar toggleSidebar={() => {}} isSidebarOpen={false} isAuthenticated={true} />
      
      <div className="flex-1 flex flex-col items-center justify-center p-4 py-12 lg:py-20">
        <div className="w-full max-w-3xl">
          <div className="mb-8 text-center lg:text-left">
            <h1 className="text-3xl sm:text-4xl font-bold text-white mb-3 tracking-tight">Fund Your Account</h1>
            <p className="text-slate-400 text-lg">Complete your deposit to access the trading platform.</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
            {/* Left Side: Form */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-navy-light/80 backdrop-blur-xl border border-white/10 rounded-2xl p-6 sm:p-8 shadow-2xl relative"
            >
              <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-[80px] -z-10 pointer-events-none" />
              
              <div className="space-y-6 relative z-10">
                
                {/* Currency Selection */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Select Currency</label>
                  <div className="grid grid-cols-3 gap-3">
                    {(['BTC', 'USDT', 'ETH'] as const).map(c => (
                      <button
                        key={c}
                        onClick={() => setCurrency(c)}
                        className={clsx(
                          "py-3 rounded-xl border font-semibold text-sm transition-all",
                          currency === c 
                            ? "border-primary bg-primary/10 text-primary shadow-[0_0_15px_rgba(56,189,248,0.15)]" 
                            : "border-white/10 bg-navy hover:bg-white/5 text-slate-400"
                        )}
                      >
                        {c}
                        {c === 'USDT' && <span className="block text-[10px] font-normal opacity-70 mt-0.5">TRC20</span>}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Amount */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Amount (USD equivalent)</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-medium">$</span>
                    <input 
                      type="number" 
                      value={amount}
                      onChange={e => setAmount(e.target.value)}
                      placeholder="Enter amount"
                      className="w-full bg-navy border border-white/10 rounded-xl pl-8 pr-4 py-3.5 text-white focus:outline-none focus:border-primary transition-colors text-lg"
                    />
                  </div>
                </div>

                {/* Wallet Address Display */}
                <div className="bg-navy rounded-xl border border-white/5 p-4 relative group">
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Send {currency} to this address</span>
                  </div>
                  <div className="font-mono text-sm sm:text-base text-primary break-all bg-navy-lighter/50 p-3 rounded-lg border border-primary/20 cursor-text select-all">
                    {WALLETS[currency]}
                  </div>
                  <button 
                    onClick={handleCopy}
                    className="absolute top-3 right-3 p-2 bg-navy-light hover:bg-white/10 rounded-lg text-slate-400 hover:text-white transition-colors flex items-center gap-2 text-xs font-medium"
                  >
                    {isCopied ? <CheckCircle2 className="w-4 h-4 text-success" /> : <Copy className="w-4 h-4" />}
                    <span className="hidden sm:inline">{isCopied ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>

              </div>
            </motion.div>

            {/* Right Side: Receipt Upload & Action */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="space-y-6"
            >
              
              <div className="bg-navy-light/80 backdrop-blur-xl border border-white/10 rounded-2xl p-6 sm:p-8 shadow-2xl text-center">
                <h3 className="text-lg font-semibold text-white mb-2">Upload Payment Receipt</h3>
                <p className="text-sm text-slate-400 mb-6">Screenshot of your completed transaction.</p>

                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleFileChange} 
                  accept="image/*" 
                  className="hidden" 
                />

                {!receiptBase64 ? (
                  <div 
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-white/10 hover:border-primary/50 bg-navy/50 rounded-xl p-8 transition-colors cursor-pointer group flex flex-col items-center justify-center min-h-[160px]"
                  >
                    <UploadCloud className="w-10 h-10 text-slate-500 group-hover:text-primary mb-3 transition-colors" />
                    <p className="text-white font-medium mb-1 text-sm">Click to upload screenshot</p>
                    <p className="text-xs text-slate-500">JPG, PNG (max. 5MB)</p>
                  </div>
                ) : (
                  <div className="relative rounded-xl border border-white/10 bg-navy/50 p-2 overflow-hidden group">
                    <img src={receiptBase64} alt="Receipt Preview" className="w-full h-40 object-cover rounded-lg opacity-80 transition-opacity group-hover:opacity-40" />
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={removeReceipt}
                        className="bg-danger/90 hover:bg-danger text-white p-2 rounded-full shadow-lg backdrop-blur-sm transition-transform hover:scale-105"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <motion.button
                whileTap={{ scale: 0.98 }}
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="w-full py-4 rounded-xl font-bold text-lg text-white bg-gradient-to-r from-primary to-sky-500 shadow-xl shadow-primary/20 hover:shadow-primary/40 transition-all disabled:opacity-50 flex items-center justify-center gap-2 group"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    Submit Deposit Request
                    <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </motion.button>
              
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
