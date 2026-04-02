// @ts-ignore
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { LayoutDashboard, Wallet, TrendingUp, Lock, Star, Briefcase } from 'lucide-react';

export default function DemoDashboard() {
  const mockChartData = [
    { name: 'Jan', value: 4000 },
    { name: 'Feb', value: 3000 },
    { name: 'Mar', value: 5000 },
    { name: 'Apr', value: 8780 },
    { name: 'May', value: 12000 },
    { name: 'Jun', value: 16400 },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground relative">
      {/* Demo Header */}
      <header className="fixed top-0 w-full z-50 bg-navy/80 backdrop-blur-md border-b border-white/5 flex items-center justify-between px-6 py-4">
        <div className="flex items-center gap-4">
          <div className="w-8 h-8 md:w-10 md:h-10 bg-primary rounded-xl flex items-center justify-center transform rotate-12 shadow-[0_0_20px_rgba(59,130,246,0.3)]">
            <span className="font-bold text-white text-lg md:text-xl -rotate-12">CW</span>
          </div>
          <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-emerald-400">
            CapitalWave
          </span>
          <span className="ml-4 px-3 py-1 bg-primary/20 text-primary text-xs font-bold rounded-full border border-primary/20">
            PREVIEW MODE
          </span>
        </div>
        <div className="flex items-center gap-4">
          <Link 
            to="/login"
            className="hidden md:flex items-center gap-2 bg-transparent text-white border border-white/20 font-bold px-6 py-2 rounded-xl hover:bg-white/5 transition-all"
          >
            Sign In
          </Link>
          <Link 
            to="/onboarding"
            className="flex items-center gap-2 bg-primary hover:bg-primary-hover text-white font-bold px-6 py-2 rounded-xl shadow-[0_0_20px_rgba(59,130,246,0.2)] transition-all"
          >
            Get Started
          </Link>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex-1 flex pt-20 h-screen overflow-hidden relative">
        
        {/* Mock Sidebar */}
        <aside className="hidden md:flex w-64 bg-navy-light border-r border-white/10 flex-col pt-8 opacity-70 filter blur-[1px]">
          <div className="flex-1 px-4 space-y-2">
            {[{ name: 'Dashboard', icon: LayoutDashboard }, { name: 'Portfolio', icon: Wallet }, { name: 'Assets', icon: Briefcase }, { name: 'Watchlist', icon: Star }, { name: 'Markets', icon: TrendingUp }].map((item) => (
              <div key={item.name} className="flex items-center gap-3 px-4 py-3 rounded-lg text-slate-400">
                <item.icon className="w-5 h-5" />
                <span className="text-sm font-medium">{item.name}</span>
              </div>
            ))}
          </div>
        </aside>

        {/* Dashboard Content */}
        <main className="flex-1 p-6 md:p-12 overflow-hidden relative">
          {/* Overlay Blocker */}
          <div className="absolute inset-0 bg-navy/40 backdrop-blur-sm z-20 flex flex-col items-center justify-center text-center p-6 mt-16">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
              className="max-w-xl w-full bg-navy border border-white/10 rounded-2xl p-8 sm:p-12 shadow-2xl relative overflow-hidden"
            >
              <div className="absolute -top-32 -left-32 w-64 h-64 bg-primary/20 rounded-full blur-[80px]" />
              <div className="absolute -bottom-32 -right-32 w-64 h-64 bg-emerald-500/20 rounded-full blur-[80px]" />
              
              <Lock className="w-16 h-16 text-primary mx-auto mb-6" />
              <h2 className="text-3xl sm:text-4xl font-extrabold text-white mb-4">
                Unlock Your Potential
              </h2>
              <p className="text-lg text-slate-300 mb-8 leading-relaxed font-light">
                This is just a preview. Join CapitalWave to unlock live markets, advanced charting, real-time analytics, and personalized portfolio tracking. Start your institutional-grade trading journey today.
              </p>
              
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link 
                  to="/login"
                  className="w-full sm:w-auto bg-primary hover:bg-primary-hover text-white text-lg font-bold py-4 px-10 rounded-xl transition-all shadow-[0_0_20px_rgba(59,130,246,0.3)] hover:scale-105"
                >
                  Log In
                </Link>
                <Link 
                  to="/onboarding"
                  className="w-full sm:w-auto bg-transparent border border-white/20 hover:bg-white/5 text-white text-lg font-bold py-4 px-10 rounded-xl transition-all hover:scale-105"
                >
                  Create Account
                </Link>
              </div>
            </motion.div>
          </div>

          <div className="space-y-8 filter blur-[2px] opacity-60">
            {/* Header info */}
            <div>
              <h1 className="text-3xl font-bold">Total Balance</h1>
              <div className="text-5xl font-mono mt-2 text-white">$124,592.40</div>
              <div className="text-emerald-400 mt-2 flex items-center gap-1 font-medium">
                <TrendingUp className="w-4 h-4" />
                +12.5% ($13,843.10) Today
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Chart Mock */}
              <div className="lg:col-span-2 glass-panel p-6 h-96 flex flex-col justify-end relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-t from-primary/10 to-transparent bottom-0" />
                <div className="flex items-end justify-between h-full w-full gap-2 relative z-10">
                  {mockChartData.map((d, i) => (
                    <div key={i} className="w-full bg-primary/40 rounded-t-sm" style={{ height: `${(d.value / 20000) * 100}%` }}></div>
                  ))}
                </div>
              </div>

              {/* Assets Mock */}
              <div className="glass-panel p-6">
                <h3 className="font-bold text-white mb-6">Your Assets</h3>
                <div className="space-y-4">
                  {[
                    { name: 'Bitcoin (BTC)', image: 'https://assets.coingecko.com/coins/images/1/small/bitcoin.png' },
                    { name: 'Ethereum (ETH)', image: 'https://assets.coingecko.com/coins/images/279/small/ethereum.png' },
                    { name: 'Apple (AAPL)', image: 'https://upload.wikimedia.org/wikipedia/commons/3/31/Apple_logo_white.svg' },
                    { name: 'Nvidia (NVDA)', image: 'https://www.vectorlogo.zone/logos/nvidia/nvidia-icon.svg' }
                  ].map((asset, i) => (
                    <div key={i} className="flex justify-between items-center p-3 bg-white/5 rounded-xl border border-white/5">
                      <div className="flex items-center gap-3">
                        <img src={asset.image} alt={asset.name} className="w-8 h-8 rounded-full bg-navy-lighter" />
                        <div className="font-medium text-white">{asset.name}</div>
                      </div>
                      <div className="text-right">
                        <div className="font-mono text-white">${(Math.random() * 10000).toFixed(2)}</div>
                        <div className="text-xs text-emerald-400">+{Math.random().toFixed(2)}%</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
