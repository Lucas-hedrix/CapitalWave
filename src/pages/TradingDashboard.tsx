import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { XAxis, YAxis, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';
import { ArrowUpRight, ArrowDownRight, Star } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useUserStore } from '../store/useUserStore';
import clsx from 'clsx';
import toast from 'react-hot-toast';

// Mock Data
const WATCHLIST = [
  { symbol: 'BTC', name: 'Bitcoin', price: 64231.50, change: 2.4 },
  { symbol: 'ETH', name: 'Ethereum', price: 3450.20, change: 1.8 },
  { symbol: 'SOL', name: 'Solana', price: 145.60, change: -5.1 },
  { symbol: 'AAPL', name: 'Apple Inc.', price: 185.92, change: 0.5 },
  { symbol: 'NVDA', name: 'NVIDIA Corp.', price: 875.28, change: 4.2 },
];

const generateChartData = () => {
  let basePrice = 64000;
  return Array.from({ length: 60 }).map((_, i) => {
    basePrice = basePrice + (Math.random() - 0.48) * 200;
    return { time: `10:${i < 10 ? '0'+i : i}`, price: basePrice };
  });
};

export default function TradingDashboard() {
  const { user } = useUserStore();
  const [selectedAsset, setSelectedAsset] = useState(WATCHLIST[0]);
  const [chartData, setChartData] = useState(generateChartData());
  const [orderType, setOrderType] = useState<'Market' | 'Limit'>('Market');
  const [quantity, setQuantity] = useState('1');
  const [isBuying, setIsBuying] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [cashBalance, setCashBalance] = useState(0);

  useEffect(() => {
    if (!user) return;
    
    // Fetch user's actual portfolio balance
    const fetchPortfolio = async () => {
      const { data, error } = await supabase
        .from('portfolios')
        .select('*')
        .eq('user_id', user.id)
        .single();
        
      if (!error && data) {
        setCashBalance(data.cash_balance);
      }
    };
    
    fetchPortfolio();
  }, [user]);

  // Simulate live price updates
  useEffect(() => {
    const interval = setInterval(() => {
      setChartData(prev => {
        const last = prev[prev.length - 1];
        const nextPrice = last.price + (Math.random() - 0.5) * 100;
        const newPoint = { 
          time: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit', second:'2-digit'}), 
          price: nextPrice 
        };
        return [...prev.slice(1), newPoint];
      });
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  const estimatedCost = (parseFloat(quantity) || 0) * selectedAsset.price;

  const handleExecuteTrade = async () => {
    if (!user) {
      toast.error('You must be logged in to trade.');
      return;
    }

    if (isBuying && estimatedCost > cashBalance) {
      toast.error('Insufficient buying power.');
      return;
    }

    setIsProcessing(true);
    const side = isBuying ? 'Buy' : 'Sell';
    
    try {
      // 1. Insert Transaction Record
      const { error: txError } = await supabase
        .from('transactions')
        .insert({
          user_id: user.id,
          type: side,
          asset_symbol: selectedAsset.symbol,
          quantity: parseFloat(quantity),
          price: selectedAsset.price,
          status: 'Completed'
        });

      if (txError) throw txError;

      // 2. Update Portfolio Balance
      const newBalance = isBuying
        ? cashBalance - estimatedCost 
        : cashBalance + estimatedCost;

      const { error: pfError } = await supabase
        .from('portfolios')
        .update({ cash_balance: newBalance })
        .eq('user_id', user.id);

      if (pfError) throw pfError;

      // 3. Update Positions manually
      // First, fetch existing position
      const { data: posData } = await supabase
        .from('positions')
        .select('*')
        .eq('user_id', user.id)
        .eq('asset_symbol', selectedAsset.symbol)
        .single();

      if (posData) {
        // Update existing
        const newQty = isBuying
          ? Number(posData.quantity) + parseFloat(quantity)
          : Number(posData.quantity) - parseFloat(quantity);
          
        await supabase
          .from('positions')
          .update({ quantity: newQty })
          .eq('id', posData.id);
      } else if (isBuying) {
        // Insert new position
        await supabase
          .from('positions')
          .insert({
            user_id: user.id,
            asset_symbol: selectedAsset.symbol,
            asset_name: selectedAsset.name,
            quantity: parseFloat(quantity),
            average_entry_price: selectedAsset.price
          });
      } else {
         throw new Error("You do not own any " + selectedAsset.symbol + " to sell");
      }

      setCashBalance(newBalance);
      toast.success(`${side} order for ${quantity} ${selectedAsset.symbol} submitted!`);
      setQuantity('1');
    } catch (err: any) {
      toast.error(err.message || 'Failed to execute trade.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="flex flex-col lg:flex-row h-[calc(100vh-4rem)] bg-background">
      
      {/* Left: Watchlist */}
      <div className="w-full lg:w-80 border-r border-white/5 bg-navy-light flex flex-col flex-shrink-0">
        <div className="p-4 border-b border-white/5">
          <h2 className="text-lg font-bold text-white tracking-tight">Watchlist</h2>
          <div className="relative mt-3">
            <input 
              type="text" 
              placeholder="Search assets..." 
              className="w-full bg-navy border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-primary transition-colors"
            />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          {WATCHLIST.map((item) => (
            <button
              key={item.symbol}
              onClick={() => setSelectedAsset(item)}
              className={clsx(
                "w-full flex items-center justify-between p-4 border-b border-white/5 hover:bg-white/5 transition-colors",
                selectedAsset.symbol === item.symbol && "bg-white/5 border-l-2 border-l-primary"
              )}
            >
              <div className="flex items-center gap-3">
                <Star className={clsx("w-4 h-4", selectedAsset.symbol === item.symbol ? "text-primary fill-primary" : "text-slate-500")} />
                <div className="text-left">
                  <div className="text-white font-semibold">{item.symbol}</div>
                  <div className="text-xs text-slate-400">{item.name}</div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-white font-medium">${item.price.toLocaleString()}</div>
                <div className={clsx("text-xs flex items-center justify-end font-medium", item.change >= 0 ? "text-success" : "text-danger")}>
                  {item.change >= 0 ? <ArrowUpRight className="w-3 h-3 mr-0.5" /> : <ArrowDownRight className="w-3 h-3 mr-0.5" />}
                  {Math.abs(item.change)}%
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Center: Chart Area */}
      <div className="flex-1 flex flex-col min-w-0 bg-navy relative">
        <div className="p-4 sm:p-6 border-b border-white/5 flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-2xl sm:text-3xl font-bold text-white">{selectedAsset.symbol}</h1>
              <span className="text-sm text-slate-400 font-medium px-2 py-1 bg-white/5 rounded-md">Crypto</span>
            </div>
            <div className="flex items-baseline gap-3">
              <span className="text-3xl font-bold text-white">${selectedAsset.price.toLocaleString()}</span>
              <span className={clsx("text-sm font-medium flex items-center", selectedAsset.change >= 0 ? "text-success" : "text-danger")}>
                {selectedAsset.change >= 0 ? '+' : ''}{selectedAsset.change}% Today
              </span>
            </div>
          </div>
          <div className="flex gap-2 bg-navy-light p-1 rounded-lg border border-white/5 hidden sm:flex">
            {['1H', '1D', '1W', '1M', '1Y', 'ALL'].map(tf => (
              <button 
                key={tf}
                className={clsx(
                  "px-3 py-1.5 text-xs font-semibold rounded-md transition-colors",
                  tf === '1D' ? "bg-white/10 text-white" : "text-slate-400 hover:text-white hover:bg-white/5"
                )}
              >
                {tf}
              </button>
            ))}
          </div>
        </div>

        {/* Real simple looking chart simulation */}
        <div className="flex-1 p-4 w-full h-full min-h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 20, right: 0, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={selectedAsset.change >= 0 ? '#10b981' : '#ef4444'} stopOpacity={0.3}/>
                  <stop offset="95%" stopColor={selectedAsset.change >= 0 ? '#10b981' : '#ef4444'} stopOpacity={0}/>
                </linearGradient>
              </defs>
              <Tooltip 
                contentStyle={{ backgroundColor: '#121826', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff' }}
                itemStyle={{ color: '#fff' }}
              />
              <Area 
                type="monotone" 
                dataKey="price" 
                stroke={selectedAsset.change >= 0 ? '#10b981' : '#ef4444'} 
                strokeWidth={2}
                fillOpacity={1} 
                fill="url(#colorPrice)" 
                isAnimationActive={false}
              />
              <XAxis dataKey="time" hide />
              <YAxis domain={['auto', 'auto']} hide />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Right: Order Form */}
      <div className="w-full lg:w-80 border-l border-white/5 bg-navy-light flex flex-col flex-shrink-0">
        <div className="p-4 sm:p-6 flex-1 overflow-y-auto">
          
          <div className="flex bg-navy p-1 rounded-lg border border-white/5 mb-6">
            <button 
              onClick={() => setIsBuying(true)}
              className={clsx(
                "flex-1 py-2 text-sm font-semibold rounded-md transition-all",
                isBuying ? "bg-success text-white shadow-lg" : "text-slate-400 hover:text-white"
              )}
            >
              Buy
            </button>
            <button 
              onClick={() => setIsBuying(false)}
              className={clsx(
                "flex-1 py-2 text-sm font-semibold rounded-md transition-all",
                !isBuying ? "bg-danger text-white shadow-lg" : "text-slate-400 hover:text-white"
              )}
            >
              Sell
            </button>
          </div>

          <div className="space-y-5">
            <div>
              <div className="flex items-center gap-4 mb-3">
                {['Market', 'Limit', 'Stop'].map(type => (
                  <button 
                    key={type}
                    onClick={() => setOrderType(type as any)}
                    className={clsx(
                      "text-sm font-medium pb-2 border-b-2 transition-colors",
                      orderType === type ? "border-primary text-white" : "border-transparent text-slate-400 hover:text-slate-300"
                    )}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>

            {orderType === 'Limit' && (
              <div className="space-y-1.5">
                <label className="text-xs text-slate-400 font-medium">Limit Price</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">$</span>
                  <input type="number" defaultValue={selectedAsset.price} className="w-full bg-navy border border-white/10 rounded-lg pl-7 pr-3 py-2.5 text-white focus:outline-none focus:border-primary transition-colors font-medium" />
                </div>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-xs text-slate-400 font-medium pb-1 flex justify-between">
                <span>Shares / Amount</span>
                <span>Buying Power: ${cashBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </label>
              <div className="relative">
                <input 
                  type="number" 
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  className="w-full bg-navy border border-white/10 rounded-lg pl-3 pr-16 py-2.5 text-white focus:outline-none focus:border-primary transition-colors font-medium" 
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-medium">
                  {selectedAsset.symbol}
                </span>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs text-slate-400 font-medium pb-1 flex justify-between">
                <span>Time in Force</span>
              </label>
              <select className="w-full bg-navy border border-white/10 rounded-lg px-3 py-2.5 text-white focus:outline-none focus:border-primary appearance-none">
                <option>Day</option>
                <option>Good 'Til Canceled (GTC)</option>
                <option>Fill or Kill (FOK)</option>
              </select>
            </div>

            <div className="pt-4 border-t border-white/5 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Estimated Cost</span>
                <span className="text-white font-medium">${estimatedCost.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Trading Fee</span>
                <span className="text-success font-medium">Free</span>
              </div>
            </div>
          </div>
        </div>

        <div className="p-4 sm:p-6 border-t border-white/5 bg-navy-lighter mt-auto">
          <motion.button 
            whileTap={{ scale: 0.98 }}
            onClick={handleExecuteTrade}
            disabled={isProcessing}
            className={clsx(
              "w-full py-4 rounded-xl font-bold text-lg text-white shadow-xl transition-colors disabled:opacity-50",
              isBuying ? "bg-success hover:bg-emerald-400 shadow-success/20" : "bg-danger hover:bg-rose-400 shadow-danger/20"
            )}
          >
            {isProcessing ? 'Processing...' : `${isBuying ? 'Buy' : 'Sell'} ${selectedAsset.symbol}`}
          </motion.button>
        </div>
      </div>

    </div>
  );
}
