import { useState, useEffect } from 'react';
import { AreaChart, Area, ResponsiveContainer } from 'recharts';
import { ArrowUpRight, Wallet, PieChart, Activity, Download } from 'lucide-react';
import clsx from 'clsx';
import { supabase } from '../lib/supabase';
import { useUserStore } from '../store/useUserStore';

// Mock Data
const PORTFOLIO_DATA = Array.from({ length: 30 }).map((_, i) => ({
  date: `Day ${i}`,
  value: 45000 + Math.sin(i / 3) * 5000 + (i * 200),
}));

const OPEN_POSITIONS = [
  { asset: 'BTC', name: 'Bitcoin', qty: 0.45, entry: 61200, current: 64231.50 },
  { asset: 'ETH', name: 'Ethereum', qty: 4.2, entry: 3100, current: 3450.20 },
  { asset: 'AAPL', name: 'Apple Inc.', qty: 50, entry: 175.50, current: 185.92 },
  { asset: 'TSLA', name: 'Tesla Inc.', qty: 25, entry: 205.10, current: 178.43 },
];

export default function PortfolioScreen() {
  const { user } = useUserStore();
  const [activeTab, setActiveTab] = useState<'Positions' | 'History'>('Positions');
  const [cashBalance, setCashBalance] = useState(0);
  const [positions, setPositions] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);

  useEffect(() => {
    if (!user) return;

    const fetchData = async () => {
      // Fetch Portfolio
      const { data: pfData } = await supabase
        .from('portfolios')
        .select('*')
        .eq('user_id', user.id)
        .single();
      if (pfData) setCashBalance(Number(pfData.cash_balance));

      // Fetch Positions
      const { data: posData } = await supabase
        .from('positions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      if (posData) setPositions(posData);

      // Fetch Transactions
      const { data: txData } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      if (txData) setTransactions(txData);
    };

    fetchData();
  }, [user]);

  const calculateTotalValue = () => {
    const positionsValue = positions.reduce((acc, pos) => {
      const mockPrice = OPEN_POSITIONS.find(p => p.asset === pos.asset_symbol)?.current || Number(pos.average_entry_price);
      return acc + (Number(pos.quantity) * mockPrice);
    }, 0);
    return cashBalance + positionsValue;
  };

  const calculateOpenPnL = () => {
    return positions.reduce((acc, pos) => {
      const currentPrice = OPEN_POSITIONS.find(p => p.asset === pos.asset_symbol)?.current || Number(pos.average_entry_price);
      return acc + ((currentPrice - Number(pos.average_entry_price)) * Number(pos.quantity));
    }, 0);
  };

  const totalBalance = calculateTotalValue();
  const totalPnL = calculateOpenPnL();

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 lg:space-y-8 max-w-7xl mx-auto">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">Portfolio</h1>
          <p className="text-slate-400">Manage your assets and track performance.</p>
        </div>
        <button className="flex items-center gap-2 bg-navy-lighter hover:bg-white/10 text-white px-4 py-2 font-medium rounded-lg border border-white/10 transition-colors w-fit">
          <Download className="w-4 h-4" />
          Export Report
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-6">
        
        {/* Total Balance */}
        <div className="glass-panel p-6 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-6 opacity-20 group-hover:scale-110 transition-transform group-hover:opacity-40">
            <Wallet className="w-16 h-16 text-primary" />
          </div>
          <p className="text-slate-400 font-medium mb-1">Total Balance</p>
          <h2 className="text-3xl sm:text-4xl font-bold text-white tracking-tight mb-2">${totalBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</h2>
          <div className="flex items-center gap-2 text-sm font-medium text-success">
            <ArrowUpRight className="w-4 h-4" />
            +4.2% All Time
          </div>
        </div>

        {/* Open P&L */}
        <div className="glass-panel p-6 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-6 opacity-20 group-hover:scale-110 transition-transform group-hover:opacity-40">
            <Activity className="w-16 h-16 text-emerald-400" />
          </div>
          <p className="text-slate-400 font-medium mb-1">Open P&L</p>
          <h2 className="text-3xl sm:text-4xl font-bold text-white tracking-tight mb-2">
            {totalPnL >= 0 ? '+' : '-'}${Math.abs(totalPnL).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </h2>
          <div className="flex items-center gap-2 text-sm font-medium text-success">
            <ArrowUpRight className="w-4 h-4" />
            +8.5% Return
          </div>
        </div>

        {/* Margin Used */}
        <div className="glass-panel p-6 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-6 opacity-20 group-hover:scale-110 transition-transform group-hover:opacity-40">
            <PieChart className="w-16 h-16 text-purple-400" />
          </div>
          <p className="text-slate-400 font-medium mb-1">Buying Power</p>
          <h2 className="text-3xl sm:text-4xl font-bold text-white tracking-tight mb-2">${cashBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</h2>
          <div className="flex items-center gap-2 text-sm font-medium text-slate-400">
            Margin Usage: 15%
          </div>
        </div>

      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 lg:gap-8">
        
        {/* Left Column (Chart + Table) */}
        <div className="xl:col-span-2 space-y-6 lg:space-y-8">
          
          {/* Performance Chart */}
          <div className="glass-panel p-6 h-[350px] flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-white">Performance</h3>
              <div className="flex gap-2">
                {['1W', '1M', '3M', '1Y', 'ALL'].map(tf => (
                  <button 
                    key={tf}
                    className={clsx(
                      "px-3 py-1 text-xs font-semibold rounded-md transition-colors",
                      tf === '1M' ? "bg-white/10 text-white" : "text-slate-400 hover:text-white hover:bg-white/5"
                    )}
                  >
                    {tf}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex-1 min-h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={PORTFOLIO_DATA}>
                  <defs>
                    <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <Area 
                    type="monotone" 
                    dataKey="value" 
                    stroke="#3b82f6" 
                    strokeWidth={3}
                    fillOpacity={1} 
                    fill="url(#colorValue)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-6 border-b border-white/10">
            <button 
              onClick={() => setActiveTab('Positions')}
              className={clsx(
                "pb-3 text-sm font-semibold transition-colors border-b-2",
                activeTab === 'Positions' ? "border-primary text-white" : "border-transparent text-slate-400 hover:text-slate-300"
              )}
            >
              Open Positions
            </button>
            <button 
              onClick={() => setActiveTab('History')}
              className={clsx(
                "pb-3 text-sm font-semibold transition-colors border-b-2",
                activeTab === 'History' ? "border-primary text-white" : "border-transparent text-slate-400 hover:text-slate-300"
              )}
            >
              Transaction History
            </button>
          </div>

          {/* Open Positions Table */}
          {activeTab === 'Positions' && (
            <div className="glass-panel overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-white/5 text-xs uppercase tracking-wider text-slate-500 bg-navy-lighter/50">
                    <th className="p-4 font-medium">Asset</th>
                    <th className="p-4 font-medium">Quantity</th>
                    <th className="p-4 font-medium">Avg Entry</th>
                    <th className="p-4 font-medium">Current Price</th>
                    <th className="p-4 font-medium text-right">P&L</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {positions.length === 0 && (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-slate-400">No open positions</td>
                    </tr>
                  )}
                  {positions.map((pos) => {
                    const currentPrice = OPEN_POSITIONS.find(p => p.asset === pos.asset_symbol)?.current || pos.average_entry_price;
                    const pnl = (currentPrice - pos.average_entry_price) * pos.quantity;
                    const pnlPercent = ((currentPrice - pos.average_entry_price) / pos.average_entry_price) * 100;
                    return (
                      <tr key={pos.id} className="hover:bg-white/5 transition-colors group">
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded bg-primary/20 text-primary flex items-center justify-center font-bold text-xs uppercase">
                              {pos.asset_symbol.substring(0,2)}
                            </div>
                            <div>
                              <div className="text-white font-medium">{pos.asset_symbol}</div>
                              <div className="text-xs text-slate-500">{pos.asset_name}</div>
                            </div>
                          </div>
                        </td>
                        <td className="p-4 text-slate-300 font-medium">{Number(pos.quantity).toLocaleString()}</td>
                        <td className="p-4 text-slate-300">${Number(pos.average_entry_price).toLocaleString()}</td>
                        <td className="p-4 text-white font-medium">${Number(currentPrice).toLocaleString()}</td>
                        <td className="p-4 text-right">
                          <div className={clsx("font-bold", pnl >= 0 ? "text-success" : "text-danger")}>
                            {pnl >= 0 ? '+' : '-'}${Math.abs(pnl).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                          </div>
                          <div className={clsx("text-xs font-medium", pnl >= 0 ? "text-success/80" : "text-danger/80")}>
                            {pnl >= 0 ? '+' : ''}{pnlPercent.toFixed(2)}%
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Transaction History Table */}
          {activeTab === 'History' && (
            <div className="glass-panel overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-white/5 text-xs uppercase tracking-wider text-slate-500 bg-navy-lighter/50">
                    <th className="p-4 font-medium">Type</th>
                    <th className="p-4 font-medium">Asset/Amount</th>
                    <th className="p-4 font-medium">Price/Value</th>
                    <th className="p-4 font-medium">Date</th>
                    <th className="p-4 font-medium text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {transactions.length === 0 && (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-slate-400">No transactions</td>
                    </tr>
                  )}
                  {transactions.map((txn) => (
                    <tr key={txn.id} className="hover:bg-white/5 transition-colors">
                      <td className="p-4">
                        <span className={clsx(
                          "px-2 py-1 text-xs font-bold rounded-md",
                          txn.type === 'Buy' ? "bg-success/20 text-success" :
                          txn.type === 'Sell' ? "bg-danger/20 text-danger" :
                          "bg-primary/20 text-primary"
                        )}>
                          {txn.type}
                        </span>
                      </td>
                      <td className="p-4 text-white font-medium">{Number(txn.quantity).toLocaleString()} <span className="text-slate-500">{txn.asset_symbol}</span></td>
                      <td className="p-4 text-slate-300">${Number(txn.price).toLocaleString()}</td>
                      <td className="p-4 text-sm text-slate-400">{new Date(txn.created_at).toLocaleString()}</td>
                      <td className="p-4 text-right text-sm text-slate-300">{txn.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

        </div>

        {/* Right Column (Asset Allocation) */}
        <div className="space-y-6">
          <div className="glass-panel p-6">
            <h3 className="text-lg font-bold text-white mb-6">Asset Allocation</h3>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-white font-medium">Crypto</span>
                  <span className="text-slate-400">65%</span>
                </div>
                <div className="w-full h-2 bg-navy-lighter rounded-full overflow-hidden">
                  <div className="h-full bg-primary rounded-full" style={{ width: '65%' }} />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-white font-medium">Stocks</span>
                  <span className="text-slate-400">25%</span>
                </div>
                <div className="w-full h-2 bg-navy-lighter rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-400 rounded-full" style={{ width: '25%' }} />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-white font-medium">Cash</span>
                  <span className="text-slate-400">10%</span>
                </div>
                <div className="w-full h-2 bg-navy-lighter rounded-full overflow-hidden">
                  <div className="h-full bg-purple-400 rounded-full" style={{ width: '10%' }} />
                </div>
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-white/5 space-y-3">
              <button className="w-full py-2.5 bg-navy border border-white/10 hover:bg-white/5 text-white font-medium rounded-lg transition-colors">
                Deposit Funds
              </button>
              <button className="w-full py-2.5 text-slate-400 hover:text-white font-medium transition-colors">
                Withdraw
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
