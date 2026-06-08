import React, { useState, useEffect } from 'react';
import { Download, FileText, Table, PieChart, BarChart } from 'lucide-react';
import { erpApi } from '../lib/erpApi';
import * as XLSX from 'xlsx';

export default function Reports({ companyId }: { companyId: number }) {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (companyId) load();
  }, [companyId]);

  const load = async () => {
    const data = await erpApi.getStats(companyId);
    setStats(data);
    setLoading(false);
  };

  const exportGeneralReport = () => {
    const data = [
      { Metric: 'Total Sales', Value: stats.sales },
      { Metric: 'Total Purchases', Value: stats.purchases },
      { Metric: 'Inventory Value', Value: stats.stockValue },
      { Metric: 'Profit/Loss', Value: stats.sales - stats.purchases }
    ];
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Business Summary");
    XLSX.writeFile(wb, "ERP_Summary_Report.xlsx");
  };

  const reportsList = [
    { title: 'GST Summary Report', desc: 'Monthly SGST/CGST breakdown', icon: Table, color: 'text-[#8C725E]', bg: 'bg-[#F3ECE1]' },
    { title: 'Stock Movement Report', desc: 'Inflow vs Outflow analysis', icon: BarChart, color: 'text-[#6E5A4D]', bg: 'bg-grey-200' },
    { title: 'Vendor Liability Ledger', desc: 'Pending bills and transport charges', icon: FileText, color: 'text-[#8C725E]', bg: 'bg-[#F3ECE1]' },
    { title: 'Customer Aging Report', desc: 'Detailed receivables analysis', icon: PieChart, color: 'text-[#6E5A4D]', bg: 'bg-grey-200' },
  ];

  if (loading) return <div className="text-center py-20 text-[#6E5A4D] font-bold">Generating reports...</div>;

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div>
        <h2 className="text-2xl font-black tracking-tight text-[#4E3E34]">Financial Reporting Center</h2>
        <p className="text-zinc-550">Generate and export professional business intelligence reports</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-[#FAF8F5] border-2 border-[#E6D8C3] p-8 rounded-3xl text-[#4E3E34] shadow-sm relative overflow-hidden group">
          <div className="absolute inset-0 bg-[#F3ECE1]/20 blur-[50px] pointer-events-none"></div>
          <div className="relative z-10">
            <h3 className="text-xl font-bold mb-4">Complete Business Snapshot</h3>
            <p className="text-[#6E5A4D] text-sm mb-10 max-w-sm">One-click export of all financial metrics, sales, and purchase data for this company profile.</p>
            <button 
              onClick={exportGeneralReport}
              className="flex items-center gap-3 px-8 py-4 bg-[#6E5A4D] text-white rounded-2xl font-black hover:scale-105 transition shadow-md hover:bg-[#8C725E]"
            >
              <Download size={20} /> DOWNLOAD FULL EXCEL REPORT
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-[#FAF8F5] p-6 rounded-3xl border border-[#E6D8C3] shadow-sm">
            <p className="text-[10px] font-bold text-[#6E5A4D] uppercase tracking-widest mb-1">Total Sales</p>
            <h4 className="text-xl font-black text-[#4E3E34]">₹{stats?.sales?.toLocaleString()}</h4>
            <div className="mt-4 h-1.5 bg-grey-200 rounded-full overflow-hidden">
              <div className="h-full bg-[#8C725E] w-[70%]"></div>
            </div>
          </div>
          <div className="bg-[#FAF8F5] p-6 rounded-3xl border border-[#E6D8C3] shadow-sm">
            <p className="text-[10px] font-bold text-[#6E5A4D] uppercase tracking-widest mb-1">Stock Value</p>
            <h4 className="text-xl font-black text-[#4E3E34]">₹{stats?.stockValue?.toLocaleString()}</h4>
            <div className="mt-4 h-1.5 bg-grey-200 rounded-full overflow-hidden">
              <div className="h-full bg-[#6E5A4D] w-[45%]"></div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {reportsList.map((rpt, i) => (
          <button key={i} className="flex items-center gap-6 p-8 bg-[#FAF8F5] rounded-3xl border border-[#E6D8C3] shadow-sm hover:shadow-md hover:bg-white transition group text-left">
            <div className={`w-16 h-16 ${rpt.bg} ${rpt.color} rounded-2xl flex items-center justify-center transition group-hover:scale-110 border border-[#E6D8C3]`}>
              <rpt.icon size={32} />
            </div>
            <div className="flex-1">
              <h4 className="font-bold text-lg text-zinc-800">{rpt.title}</h4>
              <p className="text-sm text-zinc-500">{rpt.desc}</p>
            </div>
            <Download className="text-zinc-400 group-hover:text-[#6E5A4D] transition" size={24} />
          </button>
        ))}
      </div>
    </div>
  );
}
