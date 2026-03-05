import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Wallet, ArrowUpRight, AlertCircle, DollarSign, Loader2, ShieldCheck, ShieldAlert, ShieldX } from 'lucide-react';
import { useUserStore } from '../store/useUserStore';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';

export default function Withdraw() {
  const { user, kycStatus } = useUserStore();
  const [amount, setAmount] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [availableCash, setAvailableCash] = useState<number>(0);

  useEffect(() => {
    async function fetchBalance() {
      if (!user) return;
      try {
        const { data, error } = await supabase
          .from('portfolios')
          .select('cash_balance')
          .eq('user_id', user.id)
          .single();
          
        if (error) throw error;
        if (data) setAvailableCash(data.cash_balance);
      } catch (err: any) {
        console.error('Error fetching balance:', err);
      } finally {
        setFetching(false);
      }
    }
    
    fetchBalance();
  }, [user]);

  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    const withdrawAmount = parseFloat(amount);
    if (isNaN(withdrawAmount) || withdrawAmount <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }
    
    if (withdrawAmount > availableCash) {
      toast.error('Insufficient available cash');
      return;
    }

    setLoading(true);

    try {
      // 1. Get the latest portfolio data to ensure we have the id
      const { data: portfolio, error: portfolioErr } = await supabase
        .from('portfolios')
        .select('*')
        .eq('user_id', user.id)
        .single();
        
      if (portfolioErr) throw portfolioErr;

      // 2. Insert the withdrawal transaction
      const { error: txErr } = await supabase
        .from('transactions')
        .insert({
          user_id: user.id,
          portfolio_id: portfolio.id,
          type: 'Withdrawal',
          asset_symbol: 'USD',
          quantity: withdrawAmount,
          price: 1, // Base currency
          total_value: withdrawAmount,
          status: 'completed'
        });

      if (txErr) throw txErr;

      // 3. Update the portfolio cash balance safely
      const newBalance = portfolio.cash_balance - withdrawAmount;
      const { error: updateErr } = await supabase
        .from('portfolios')
        .update({ cash_balance: newBalance })
        .eq('id', portfolio.id);

      if (updateErr) throw updateErr;

      // Update local state
      setAvailableCash(newBalance);
      setAmount('');
      toast.success(`Successfully withdrew $${withdrawAmount.toLocaleString()}`);

    } catch (err: any) {
      console.error('Withdrawal error:', err);
      toast.error('Failed to process withdrawal. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleMax = () => {
    setAmount(availableCash.toString());
  };

  if (fetching) {
    return (
      <div className="p-8 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-8 max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white tracking-tight mb-2">Withdraw Funds</h1>
        <p className="text-slate-400">Transfer cash from your CapitalWave account to your linked bank account.</p>
      </div>

      <div className="grid md:grid-cols-2 gap-8 gap-y-12">
        {/* Left Col: Form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-panel p-6 sm:p-8 relative overflow-hidden"
        >
          {/* Subtle background glow */}
          <div className="absolute -top-24 -right-24 w-48 h-48 bg-primary/10 rounded-full blur-3xl pointer-events-none" />

          {kycStatus === 'pending' && (
            <div className="mb-6 p-4 rounded-xl bg-warning/10 border border-warning/20 flex gap-3 text-warning items-start">
              <ShieldAlert className="w-6 h-6 flex-shrink-0" />
              <div>
                <h3 className="font-semibold mb-1">Identity Verification Pending</h3>
                <p className="text-sm opacity-90">Your ID is currently under review. Withdrawals will be unlocked once approved (usually within 24 hours).</p>
              </div>
            </div>
          )}

          {kycStatus === 'rejected' || kycStatus === 'none' ? (
            <div className="mb-6 p-4 rounded-xl bg-danger/10 border border-danger/20 flex gap-3 text-danger items-start">
              <ShieldX className="w-6 h-6 flex-shrink-0" />
              <div>
                <h3 className="font-semibold mb-1">Identity Verification Required</h3>
                <p className="text-sm opacity-90">You must verify your identity before withdrawing funds to comply with AML regulations. Please contact support.</p>
              </div>
            </div>
          ) : kycStatus === 'approved' ? (
            <div className="mb-6 p-4 rounded-xl bg-success/10 border border-success/20 flex gap-3 text-success items-center">
              <ShieldCheck className="w-6 h-6 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium">Identity Verified. Withdrawals are enabled.</p>
              </div>
            </div>
          ) : null}

          <form onSubmit={handleWithdraw} className="space-y-6 relative z-10">
            <div>
              <label className="text-sm font-medium text-slate-300 block mb-2">
                Available to Withdraw
              </label>
              <div className="text-2xl font-bold text-white font-mono">
                ${availableCash.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300 block">
                Withdrawal Amount (USD)
              </label>
              <div className="relative">
                <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max={availableCash}
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  disabled={kycStatus !== 'approved'}
                  className="w-full bg-navy border border-white/10 rounded-xl pl-12 pr-20 py-4 text-xl font-mono text-white focus:outline-none focus:border-primary/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  required
                />
                <button
                  type="button"
                  onClick={handleMax}
                  className="absolute right-3 top-1/2 -translate-y-1/2 bg-white/5 hover:bg-white/10 text-xs font-bold text-white px-3 py-1.5 rounded-lg transition-colors"
                >
                  MAX
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300 block">
                Transfer To
              </label>
              <div className="flex items-center justify-between p-4 bg-navy border border-white/10 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white/5 rounded-lg flex items-center justify-center">
                    <Wallet className="w-5 h-5 text-slate-400" />
                  </div>
                  <div>
                    <p className="text-white font-medium text-sm">Chase Checking</p>
                    <p className="text-slate-400 text-xs font-mono">**** 4301</p>
                  </div>
                </div>
                <div className="text-xs font-medium text-success px-2 py-1 bg-success/10 rounded-md">
                  Confirmed
                </div>
              </div>
            </div>

            <div className="pt-4">
              <button
                type="submit"
                disabled={loading || !amount || parseFloat(amount) <= 0 || parseFloat(amount) > availableCash || kycStatus !== 'approved'}
                className="w-full trade-btn bg-white hover:bg-slate-200 text-navy py-4 flex items-center justify-center gap-2 group disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <ArrowUpRight className="w-5 h-5 text-navy group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                    Review Withdrawal
                  </>
                )}
              </button>
            </div>
          </form>
        </motion.div>

        {/* Right Col: Info */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="space-y-6"
        >
          <div className="p-4 bg-primary/5 border border-primary/20 rounded-xl flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h4 className="text-sm font-medium text-primary">Standard Processing Time</h4>
              <p className="text-sm text-primary/80 leading-relaxed">
                Withdrawals typically take 1-3 business days to appear in your linked checking account. Wire transfers may take up to 24 hours.
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="font-semibold text-white">Important Details</h3>
            <ul className="space-y-3 text-sm text-slate-400">
              <li className="flex gap-2">
                <span className="text-slate-600">•</span>
                <span>You can only withdraw available settled cash. Funds from recent stock sales may take T+1 to settle.</span>
              </li>
              <li className="flex gap-2">
                <span className="text-slate-600">•</span>
                <span>CapitalWave does not charge fees for ACH withdrawals.</span>
              </li>
              <li className="flex gap-2">
                <span className="text-slate-600">•</span>
                <span>For security, withdrawals to newly linked bank accounts may be delayed by up to 5 business days.</span>
              </li>
            </ul>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
