import React, { useState, useEffect } from 'react';
import { Wallet, Landmark, TrendingUp, TrendingDown, Clock, Search, Filter } from 'lucide-react';
import { erpApi } from '../lib/erpApi';

export default function Financials({ companyId }: { companyId: number }) {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (companyId) loadData();
  }, [companyId]);

  const loadData = async () => {
    const [txs, s] = await Promise.all([
      erpApi.getTransactions(companyId),
      erpApi.getStats(companyId)
    ]);
    setTransactions(txs);
    setStats(s);
    setLoading(false);
  };

  const netProfit = (stats?.sales || 0) - (stats?.purchases || 0);

  return (
    <div className="space-y-8">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-[#FAF8F5] p-8 rounded-3xl border-2 border-[#E6D8C3] text-zinc-900 shadow-sm relative overflow-hidden">
          <div className="absolute right-0 top-0 translate-x-4 -translate-y-4 w-32 h-32 bg-[#F3ECE1]/40 rounded-full pointer-events-none blur-xl"></div>
          <div className="flex items-center gap-3 mb-6">
            <Landmark size={20} className="text-[#8C725E]" />
            <span className="text-xs font-bold uppercase tracking-widest text-[#6E5A4D]">Available Balance</span>
          </div>
          <h3 className="text-4xl font-black tracking-tighter mb-2 text-[#4E3E34]">₹{(stats?.sales - stats?.purchases)?.toLocaleString() || 0}</h3>
          <p className="text-zinc-500 text-sm">Estimated net operating cash flow</p>
        </div>

        <div className="bg-[#FAF8F5] p-8 rounded-3xl border border-[#E6D8C3] shadow-sm">
          <div className="flex justify-between items-start mb-6">
            <div className="p-3 bg-[#F3ECE1] text-[#8C725E] rounded-xl border border-beige-300">
              <TrendingUp size={24} />
            </div>
            <span className="text-emerald-600 font-bold text-xs uppercase bg-[#FAF8F5] px-2 py-1 rounded border border-[#E6D8C3]">+15.2%</span>
          </div>
          <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest mb-1">Total Receivables</p>
          <h3 className="text-2xl font-bold text-[#4E3E34]">₹{stats?.sales?.toLocaleString() || 0}</h3>
        </div>

        <div className="bg-[#FAF8F5] p-8 rounded-3xl border border-[#E6D8C3] shadow-sm">
          <div className="flex justify-between items-start mb-6">
            <div className="p-3 bg-grey-100 text-[#6E5A4D] rounded-xl border border-grey-300">
              <TrendingDown size={24} />
            </div>
            <span className="text-rose-500 font-bold text-xs uppercase bg-[#FAF8F5] px-2 py-1 rounded border border-[#E6D8C3]">-5.8%</span>
          </div>
          <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest mb-1">Total Payables</p>
          <h3 className="text-2xl font-bold text-[#4E3E34]">₹{stats?.purchases?.toLocaleString() || 0}</h3>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Transaction History */}
        <div className="lg:col-span-2 bg-[#FAF8F5] rounded-3xl p-8 border border-[#E6D8C3] shadow-sm">
          <div className="flex justify-between items-center mb-8">
            <h3 className="text-xl font-bold text-[#4E3E34]">Transaction Ledger</h3>
            <button className="p-2 bg-grey-100 rounded-lg text-zinc-500 hover:text-zinc-805 border border-grey-300 transition"><Filter size={18} /></button>
          </div>

          <div className="space-y-4">
            {transactions.map(tx => (
              <div key={tx.id} className="flex items-center gap-4 p-4 rounded-2xl bg-white hover:bg-beige-50 transition border border-[#E6D8C3] hover:border-[#8C725E]">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${tx.type === 'Deposit' ? 'bg-[#F3ECE1] text-[#8C725E]' : 'bg-grey-200 text-zinc-650'}`}>
                  {tx.type === 'Deposit' ? <TrendingUp size={20} /> : <TrendingDown size={20} />}
                </div>
                <div className="flex-1">
                  <p className="font-bold text-sm text-zinc-800">{tx.description}</p>
                  <p className="text-[10px] text-zinc-400 uppercase tracking-widest font-bold flex items-center gap-2">
                    <Clock size={10} /> {new Date(tx.date).toLocaleDateString()} • {tx.mode} • {tx.category}
                  </p>
                </div>
                <div className="text-right">
                  <p className={`font-black text-sm ${tx.type === 'Deposit' ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {tx.type === 'Deposit' ? '+' : '-'} ₹{tx.amount.toLocaleString()}
                  </p>
                  <span className="text-[10px] font-bold text-zinc-400 uppercase">Confirmed</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* P&L Analysis */}
        <div className="bg-[#FAF8F5] text-zinc-900 rounded-3xl p-8 border border-[#E6D8C3] shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 w-40 h-40 bg-[#F3ECE1]/50 blur-[50px] rounded-full pointer-events-none"></div>
          
          <h3 className="text-lg font-bold mb-8 flex items-center gap-2 text-[#4E3E34]">
            <TrendingUp className="text-[#8C725E]" size={20} /> Profit & Loss Analysis
          </h3>
          
          <div className="space-y-6">
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-bold text-zinc-500 uppercase tracking-widest">
                <span>Revenue</span>
                <span>100%</span>
              </div>
              <div className="h-2 bg-grey-200 rounded-full overflow-hidden border border-zinc-200">
                <div className="h-full bg-[#8C725E] w-full"></div>
              </div>
              <p className="text-right font-bold text-[#4E3E34]">₹{stats?.sales?.toLocaleString() || 0}</p>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-xs font-bold text-zinc-500 uppercase tracking-widest">
                <span>Direct Costs (Purchases)</span>
                <span>{Math.round((stats?.purchases / stats?.sales) * 100) || 0}%</span>
              </div>
              <div className="h-2 bg-grey-200 rounded-full overflow-hidden border border-zinc-200">
                <div className="h-full bg-[#6E5A4D]" style={{ width: `${(stats?.purchases / stats?.sales) * 100}%` }}></div>
              </div>
              <p className="text-right font-bold text-[#4E3E34]">₹{stats?.purchases?.toLocaleString() || 0}</p>
            </div>

            <div className="h-px bg-[#E6D8C3] my-8"></div>

            <div className="p-6 bg-white border border-[#E6D8C3] rounded-2xl">
              <p className="text-[10px] font-bold text-[#6E5A4D] uppercase tracking-widest mb-2">Net Operating Profit</p>
              <h4 className={`text-3xl font-black tracking-tighter ${netProfit >= 0 ? 'text-emerald-650' : 'text-rose-655'}`}>
                ₹{netProfit.toLocaleString()}
              </h4>
              <p className="text-xs text-zinc-500 mt-2 flex items-center gap-1">
                {netProfit >= 0 ? <TrendingUp size={12} className="text-emerald-600" /> : <TrendingDown size={12} className="text-rose-500" />}
                {Math.round((netProfit / stats?.sales) * 100) || 0}% Margin this period
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
