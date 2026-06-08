import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  Package, 
  Users, 
  ShoppingCart, 
  Receipt,
  ArrowUpRight,
  ArrowDownRight,
  MoreVertical
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell
} from 'recharts';
import { erpApi } from '../lib/erpApi';

export default function Dashboard({ companyId }: { companyId: number }) {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (companyId) loadStats();
  }, [companyId]);

  const loadStats = async () => {
    try {
      const data = await erpApi.getStats(companyId);
      setStats(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>Loading dashboard...</div>;

  const cardData = [
    { title: 'Total Sales', value: `₹${stats?.sales?.toLocaleString()}`, change: '+12%', icon: Receipt, color: 'bg-[#8C725E] text-white', trend: 'up' },
    { title: 'Total Purchases', value: `₹${stats?.purchases?.toLocaleString()}`, change: '+5%', icon: ShoppingCart, color: 'bg-[#6E5A4D] text-white', trend: 'up' },
    { title: 'Stock Value', value: `₹${stats?.stockValue?.toLocaleString()}`, change: '-2%', icon: Package, color: 'bg-grey-200 text-zinc-700', trend: 'down' },
    { title: 'Customers', value: stats?.customers, change: '+18%', icon: Users, color: 'bg-[#A89178] text-white', trend: 'up' },
  ];

  return (
    <div className="space-y-8">
      {/* Today's Profit Snapshot Panel */}
      <div className="bg-[#FAF8F5] text-zinc-900 rounded-3xl p-6 border border-[#E6D8C3] shadow-sm overflow-hidden relative">
        <div className="absolute right-0 top-0 translate-x-12 -translate-y-6 w-72 h-72 bg-beige-100/30 rounded-full blur-3xl pointer-events-none"></div>
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="flex items-center gap-4">
            <div className="p-4 rounded-2xl bg-grey-100 text-zinc-805 border border-grey-300 shadow-sm shrink-0">
              {(stats?.todayProfit || 0) >= 0 ? <TrendingUp size={28} className="text-[#8C725E]" /> : <TrendingDown size={28} className="text-rose-500" />}
            </div>
            <div>
              <span className="bg-[#F3ECE1] text-[#6E5A4D] border border-[#E6D8C3] px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest font-mono">
                🚀 LIVE REPORTING
              </span>
              <h2 className="text-xl font-bold mt-2 tracking-tight text-[#4E3E34]">Today's Profit Snapshot</h2>
              <p className="text-zinc-500 text-xs mt-1">Calculated by subtracting purchase costs from sales revenue recorded today.</p>
            </div>
          </div>
          
          <div className="flex flex-wrap items-center gap-6 divide-y md:divide-y-0 md:divide-x divide-zinc-200">
            <div className="pt-4 md:pt-0">
              <span className="text-[10px] text-[#A89178] font-bold uppercase tracking-wider block">Today's Sales Revenue</span>
              <span className="text-lg font-extrabold font-mono text-zinc-800">₹{(stats?.todaySales || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>
            <div className="pt-4 md:pt-0 md:pl-6 col-span-1">
              <span className="text-[10px] text-[#A89178] font-bold uppercase tracking-wider block">Today's Purchase Costs</span>
              <span className="text-lg font-extrabold font-mono text-zinc-600">₹{(stats?.todayPurchases || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>
            <div className="pt-4 md:pt-0 md:pl-6">
              <span className="text-[10px] text-[#4E3E34] font-bold uppercase tracking-wider block">Today's Net Profit</span>
              <span className={`text-2xl font-black font-mono ${(stats?.todayProfit || 0) >= 0 ? "text-emerald-650" : "text-rose-655"}`}>
                ₹{(stats?.todayProfit || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {cardData.map((card, i) => (
          <div key={i} className="bg-[#FAF8F5] p-6 rounded-2xl shadow-sm border border-[#E6D8C3] hover:shadow-md transition-all">
            <div className="flex justify-between items-start mb-4">
              <div className={`p-3 rounded-xl ${card.color} text-white`}>
                <card.icon size={24} />
              </div>
              <button className="text-zinc-400 hover:text-zinc-600"><MoreVertical size={20} /></button>
            </div>
            <div>
              <p className="text-zinc-500 text-sm font-medium">{card.title}</p>
              <h3 className="text-2xl font-bold mt-1 tracking-tight">{card.value}</h3>
              <div className="flex items-center gap-1 mt-2">
                {card.trend === 'up' ? (
                  <span className="flex items-center text-xs font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 px-2 py-0.5 rounded-full">
                    <ArrowUpRight size={12} className="mr-1" /> {card.change}
                  </span>
                ) : (
                  <span className="flex items-center text-xs font-bold text-red-600 bg-red-50 dark:bg-red-900/20 px-2 py-0.5 rounded-full">
                    <ArrowDownRight size={12} className="mr-1" /> {card.change}
                  </span>
                )}
                <span className="text-[10px] text-zinc-400 font-medium">vs last month</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sales Chart */}
        <div className="lg:col-span-2 bg-[#FAF8F5] p-8 rounded-2xl shadow-sm border border-[#E6D8C3]">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h3 className="text-lg font-bold text-[#4E3E34]">Sales Overview</h3>
              <p className="text-sm text-zinc-500">Revenue performance over time</p>
            </div>
            <select className="bg-grey-100 border border-[#E6D8C3] text-xs font-medium rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-beige-400">
              <option>Last 6 Months</option>
              <option>Last Year</option>
            </select>
          </div>
          <div className="h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stats?.monthlySales?.reverse() || []}>
                <defs>
                  <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8C725E" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#8C725E" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E6D8C3" />
                <XAxis 
                  dataKey="month" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 12, fill: '#94a3b8' }}
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 12, fill: '#94a3b8' }}
                  tickFormatter={(val) => `₹${val/1000}k`}
                />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="total" 
                  stroke="#8C725E" 
                  strokeWidth={3}
                  fillOpacity={1} 
                  fill="url(#colorSales)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Quick Inventory Status */}
        <div className="bg-[#FAF8F5] p-8 rounded-2xl shadow-sm border border-[#E6D8C3]">
          <h3 className="text-lg font-bold mb-1 text-[#4E3E34]">Inventory Status</h3>
          <p className="text-sm text-zinc-500 mb-6">Stock health check</p>
          
          <div className="space-y-6">
            <div className="p-4 bg-red-50 dark:bg-red-900/10 rounded-xl border border-red-100 dark:border-red-900/20">
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs font-bold text-red-700 dark:text-red-400 uppercase tracking-wider">Out of Stock</span>
                <span className="text-lg font-bold text-red-700 dark:text-red-400">03</span>
              </div>
              <div className="flex -space-x-2">
                {[1,2,3].map(i => (
                  <div key={i} className="w-8 h-8 rounded-full border-2 border-red-50 bg-red-200 dark:bg-red-800"></div>
                ))}
              </div>
            </div>

            <div className="p-4 bg-orange-50 dark:bg-orange-900/10 rounded-xl border border-orange-100 dark:border-orange-900/20">
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs font-bold text-orange-700 dark:text-orange-400 uppercase tracking-wider">Low Stock Warnings</span>
                <span className="text-lg font-bold text-orange-700 dark:text-orange-400">08</span>
              </div>
              <div className="w-full bg-orange-200 dark:bg-orange-800 h-1.5 rounded-full overflow-hidden">
                <div className="bg-orange-600 h-full w-[65%]"></div>
              </div>
            </div>

            <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800">
              <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-4">Top Selling Categories</p>
              <div className="space-y-3">
                {[
                  { label: 'Laptops', value: 45, color: '#3b82f6' },
                  { label: 'Cameras', value: 30, color: '#a855f7' },
                  { label: 'Accessories', value: 25, color: '#10b981' }
                ].map((cat, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: cat.color }}></div>
                    <span className="text-sm font-medium flex-1">{cat.label}</span>
                    <span className="text-sm font-bold">{cat.value}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
