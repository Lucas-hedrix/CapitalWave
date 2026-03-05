import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, ArrowUpRight, ArrowDownRight, Activity, Loader2 } from 'lucide-react';
import clsx from 'clsx';

interface CryptoData {
  id: string;
  symbol: string;
  name: string;
  current_price: number;
  price_change_percentage_24h: number;
  total_volume: number;
  market_cap: number;
}

export default function Markets() {
  const [marketData, setMarketData] = useState<CryptoData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // We use CoinGecko's free API for market data
  useEffect(() => {
    const fetchMarketData = async () => {
      try {
        const response = await fetch(
          'https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=50&page=1&sparkline=false'
        );
        if (!response.ok) throw new Error('Failed to fetch market data');
        const data = await response.json();
        setMarketData(data);
      } catch (error) {
        console.error('Error fetching market data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchMarketData();

    // Refresh every 60 seconds
    const interval = setInterval(fetchMarketData, 60000);
    return () => clearInterval(interval);
  }, []);

  const filteredData = marketData.filter(crypto => 
    crypto.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    crypto.symbol.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-4 sm:p-8 max-w-7xl mx-auto space-y-8 min-h-screen">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight leading-tight flex items-center gap-3">
            <Activity className="w-8 h-8 text-primary" />
            Live Markets
          </h1>
          <p className="text-slate-400 mt-2">Real-time cryptocurrency prices and market metrics.</p>
        </div>

        <div className="relative w-full md:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
          <input
            type="text"
            placeholder="Search assets..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-navy border border-white/10 rounded-xl pl-10 pr-4 py-3 text-white placeholder:text-slate-500 focus:outline-none focus:border-primary/50 transition-colors"
          />
        </div>
      </div>

      <div className="glass-panel overflow-hidden border border-white/5 relative shadow-2xl">
        {/* Subtle background glow */}
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-primary/5 rounded-full blur-[100px] pointer-events-none" />
        
        <div className="overflow-x-auto relative z-10">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/5 text-xs uppercase tracking-wider text-slate-400 font-semibold bg-navy-light/50">
                <th className="p-6 font-medium">Asset</th>
                <th className="p-6 font-medium text-right">Price</th>
                <th className="p-6 font-medium text-right">24h Change</th>
                <th className="p-6 font-medium text-right hidden sm:table-cell">24h Volume</th>
                <th className="p-6 font-medium text-right hidden md:table-cell">Market Cap</th>
                <th className="p-6 font-medium text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? (
                <tr>
                  <td colSpan={6} className="p-12 text-center">
                    <Loader2 className="w-8 h-8 text-primary animate-spin mx-auto mb-4" />
                    <p className="text-slate-400">Loading live market data...</p>
                  </td>
                </tr>
              ) : filteredData.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-12 text-center text-slate-400">
                    No assets found matching your search.
                  </td>
                </tr>
              ) : (
                filteredData.map((crypto, index) => (
                  <motion.tr 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05, duration: 0.3 }}
                    key={crypto.id} 
                    className="hover:bg-white/[0.02] transition-colors group"
                  >
                    <td className="p-6">
                      <div className="flex items-center gap-3">
                        <img 
                          src={`https://assets.coingecko.com/coins/images/${index + 1}/small/${crypto.symbol}.png`} 
                          alt={crypto.name}
                          onError={(e) => {
                            // Fallback if image fails to load
                            (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${crypto.symbol}&background=1e293b&color=fff&rounded=true&bold=true`;
                          }}
                          className="w-8 h-8 rounded-full bg-navy"
                        />
                        <div>
                          <div className="font-bold text-white group-hover:text-primary transition-colors">{crypto.name}</div>
                          <div className="text-xs text-slate-500 uppercase font-mono">{crypto.symbol}</div>
                        </div>
                      </div>
                    </td>
                    <td className="p-6 text-right font-mono font-medium text-white">
                      ${crypto.current_price.toLocaleString(undefined, { minimumFractionDigits: crypto.current_price < 1 ? 4 : 2, maximumFractionDigits: crypto.current_price < 1 ? 4 : 2 })}
                    </td>
                    <td className="p-6 text-right font-mono">
                      <div className={clsx(
                        "inline-flex items-center gap-1 font-medium px-2.5 py-1 rounded-md text-sm",
                        crypto.price_change_percentage_24h >= 0 
                          ? "text-success bg-success/10" 
                          : "text-danger bg-danger/10"
                      )}>
                        {crypto.price_change_percentage_24h >= 0 ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                        {Math.abs(crypto.price_change_percentage_24h).toFixed(2)}%
                      </div>
                    </td>
                    <td className="p-6 text-right text-slate-400 font-mono hidden sm:table-cell">
                      ${(crypto.total_volume / 1000000).toLocaleString(undefined, { maximumFractionDigits: 1 })}M
                    </td>
                    <td className="p-6 text-right text-slate-400 font-mono hidden md:table-cell">
                      ${(crypto.market_cap / 1000000000).toLocaleString(undefined, { maximumFractionDigits: 2 })}B
                    </td>
                    <td className="p-6 text-center">
                      <button className="trade-btn bg-primary/10 hover:bg-primary text-primary hover:text-white px-4 py-2 text-sm">
                        Trade
                      </button>
                    </td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
