import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ShieldCheck, Zap, BarChart3, ArrowRight } from 'lucide-react';
import { useEffect, useState } from 'react';

// Mock Ticker Data
const MOCK_TICKERS = [
  { symbol: 'BTC', price: '64,231.50', change: 2.4 },
  { symbol: 'ETH', price: '3,450.20', change: 1.8 },
  { symbol: 'AAPL', price: '185.92', change: -0.5 },
  { symbol: 'TSLA', price: '178.43', change: -1.2 },
  { symbol: 'SPY', price: '512.30', change: 0.8 },
  { symbol: 'NVDA', price: '875.28', change: 4.2 },
  { symbol: 'GOLD', price: '2,145.00', change: 0.3 },
  { symbol: 'SOL', price: '145.60', change: 5.1 },
];

function AnimatedTicker() {
  return (
    <div className="w-full bg-navy border-b border-white/5 overflow-hidden flex whitespace-nowrap py-2 sticky top-16 z-40">
      <motion.div
        animate={{ x: ['0%', '-50%'] }}
        transition={{ ease: 'linear', duration: 30, repeat: Infinity }}
        className="flex gap-8 items-center min-w-max px-4"
      >
        {[...MOCK_TICKERS, ...MOCK_TICKERS].map((item, i) => (
          <div key={i} className="flex items-center gap-2 text-sm font-medium">
            <span className="text-slate-300">{item.symbol}</span>
            <span className="text-white">${item.price}</span>
            <span className={item.change >= 0 ? 'text-success' : 'text-danger'}>
              {item.change > 0 ? '+' : ''}{item.change}%
            </span>
            <span className="mx-2 text-white/20">•</span>
          </div>
        ))}
      </motion.div>
    </div>
  );
}

// Simple Counter Hook for numbers
function useCounter(end: number, duration: number = 2000) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let startTimestamp: number | null = null;
    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      
      // easeOutExpo
      const easeProgress = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      
      setCount(Math.floor(easeProgress * end));
      if (progress < 1) {
        window.requestAnimationFrame(step);
      }
    };
    window.requestAnimationFrame(step);
  }, [end, duration]);

  return count;
}

export default function LandingPage() {
  const users = useCounter(250000);
  const volume = useCounter(15);

  return (
    <div className="flex flex-col min-h-screen">
      <AnimatedTicker />

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-20 pb-32 lg:pt-32 lg:pb-48 px-4 sm:px-6 lg:px-8">
        
        {/* Background glow effects */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-[120px] -z-10 mix-blend-screen" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-[120px] -z-10 mix-blend-screen" />

        <div className="max-w-6xl mx-auto text-center space-y-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-white mb-6 leading-tight">
              Next-Gen Trading, <br className="hidden md:block"/>
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary to-emerald-400">
                Institutional Power.
              </span>
            </h1>
            <p className="text-xl md:text-2xl text-slate-400 max-w-3xl mx-auto font-light">
              Access global markets with zero commissions, millisecond execution, and advanced charting. Reimagined for the modern portfolio.
            </p>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-8"
          >
            <Link 
              to="/onboarding"
              className="group relative flex items-center gap-2 bg-white text-navy font-bold text-lg px-8 py-4 rounded-xl hover:bg-slate-200 transition-all active:scale-95 shadow-[0_0_40px_rgba(255,255,255,0.1)] w-full sm:w-auto justify-center"
            >
              Open Free Account
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link 
              to="/dashboard"
              className="flex items-center gap-2 bg-transparent text-white border border-white/20 font-bold text-lg px-8 py-4 rounded-xl hover:bg-white/5 transition-all w-full sm:w-auto justify-center"
            >
              Explore Platform
            </Link>
          </motion.div>

          {/* Social Proof Stats */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 0.6 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-8 pt-20 border-t border-white/10 mt-20"
          >
            <div className="flex flex-col gap-2">
              <span className="text-4xl font-bold text-white">0%</span>
              <span className="text-sm text-slate-400">Commission Fees</span>
            </div>
            <div className="flex flex-col gap-2">
              <span className="text-4xl font-bold text-white">{(users / 1000).toFixed(0)}k+</span>
              <span className="text-sm text-slate-400">Active Traders</span>
            </div>
            <div className="flex flex-col gap-2">
              <span className="text-4xl font-bold text-white">&lt;5ms</span>
              <span className="text-sm text-slate-400">Execution Speed</span>
            </div>
            <div className="flex flex-col gap-2">
              <span className="text-4xl font-bold text-white">${volume}B+</span>
              <span className="text-sm text-slate-400">Quarterly Volume</span>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="bg-navy-lighter py-24 px-4 sm:px-6 lg:px-8 border-y border-white/5">
        <div className="max-w-6xl mx-auto grid md:grid-cols-3 gap-8">
          <div className="glass-panel p-8 hover:bg-white/5 transition-colors group cursor-default">
            <div className="w-14 h-14 bg-primary/20 rounded-2xl flex items-center justify-center text-primary mb-6 group-hover:scale-110 transition-transform">
              <Zap className="w-7 h-7" />
            </div>
            <h3 className="text-xl font-bold text-white mb-3">Lightning Fast</h3>
            <p className="text-slate-400 leading-relaxed">
              Our matching engine is built in Rust, delivering institutional-grade latency and deterministic execution for every trade.
            </p>
          </div>
          
          <div className="glass-panel p-8 hover:bg-white/5 transition-colors group cursor-default">
            <div className="w-14 h-14 bg-emerald-500/20 rounded-2xl flex items-center justify-center text-emerald-400 mb-6 group-hover:scale-110 transition-transform">
              <ShieldCheck className="w-7 h-7" />
            </div>
            <h3 className="text-xl font-bold text-white mb-3">Bank-Grade Security</h3>
            <p className="text-slate-400 leading-relaxed">
              Assets are held 1:1. Regulated by top-tier authorities. SOC 2 Type II certified with cold storage architecture.
            </p>
          </div>

          <div className="glass-panel p-8 hover:bg-white/5 transition-colors group cursor-default">
            <div className="w-14 h-14 bg-purple-500/20 rounded-2xl flex items-center justify-center text-purple-400 mb-6 group-hover:scale-110 transition-transform">
              <BarChart3 className="w-7 h-7" />
            </div>
            <h3 className="text-xl font-bold text-white mb-3">Pro Charting</h3>
            <p className="text-slate-400 leading-relaxed">
              Integrated technical analysis tools, 100+ indicators, and real-time order book depth directly in your browser.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
