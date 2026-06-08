import React, { useState, useEffect } from 'react';
import { Users, Plus, Search, Mail, Phone, MapPin, Download } from 'lucide-react';
import { erpApi } from '../lib/erpApi';
import * as XLSX from 'xlsx';

export default function Customers({ companyId }: { companyId: number }) {
  const [customers, setCustomers] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [newCustomer, setNewCustomer] = useState({ name: '', mobile: '', address: '', gstin: '' });

  useEffect(() => { if(companyId) load(); }, [companyId]);
  const load = async () => setCustomers(await erpApi.getCustomers(companyId));

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    await erpApi.createCustomer({ ...newCustomer, company_id: companyId });
    setShowAdd(false);
    load();
  };

  const exportExcel = () => {
    const ws = XLSX.utils.json_to_sheet(customers);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Customers");
    XLSX.writeFile(wb, "Customer_Ledger.xlsx");
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-[#4E3E34]">Customer Due Statement</h2>
        <div className="flex gap-3">
          <button onClick={exportExcel} className="p-2.5 bg-[#F1F3F5] border border-[#DCDFE4] rounded-xl text-zinc-500 hover:text-zinc-800 hover:bg-beige-100 transition duration-150"><Download size={20}/></button>
          <button onClick={() => setShowAdd(true)} className="px-5 py-2.5 bg-[#6E5A4D] hover:bg-[#8C725E] text-white rounded-xl flex items-center gap-2 font-bold transition duration-150 shadow-sm shadow-[#E6D8C3]"><Plus size={20}/> New Customer</button>
        </div>
      </div>

      <div className="bg-[#FAF8F5] rounded-3xl p-6 border border-[#E6D8C3]">
        <div className="relative mb-6">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
          <input type="text" placeholder="Search customers..." className="w-full pl-12 pr-4 py-3 bg-white border border-[#E6D8C3] rounded-xl outline-none focus:ring-1 focus:ring-[#8C725E] text-zinc-800 font-medium" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {customers.filter(c => c.name.toLowerCase().includes(search.toLowerCase())).map(c => (
            <div key={c.id} className="p-5 border border-[#E6D8C3] bg-white rounded-2xl hover:bg-beige-50 transition group">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 bg-[#F3ECE1] text-[#8C725E] rounded-xl flex items-center justify-center font-black text-lg">{c.name[0]}</div>
                <div>
                  <h4 className="font-bold text-zinc-800">{c.name}</h4>
                  <p className="text-xs text-zinc-500">{c.mobile || 'No mobile'}</p>
                </div>
              </div>
              <div className="space-y-2 text-sm text-zinc-500">
                <div className="flex items-center gap-2"><MapPin size={14}/> <span className="truncate">{c.address || 'N/A'}</span></div>
                <div className="flex items-center gap-2 font-bold text-[#6E5A4D] font-mono text-[10px]">GSTIN: {c.gstin || 'UNREGISTERED'}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {showAdd && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-[100] backdrop-blur-xs">
          <form onSubmit={handleAdd} className="bg-[#FAF8F5] border border-[#E6D8C3] p-8 rounded-3xl w-full max-w-md space-y-4 shadow-xl">
            <h3 className="text-xl font-bold text-[#4E3E34]">New Customer</h3>
            <input required placeholder="Name" className="w-full p-3 bg-white border border-[#E6D8C3] text-zinc-800 rounded-xl outline-none" value={newCustomer.name} onChange={e => setNewCustomer({...newCustomer, name: e.target.value})} />
            <input placeholder="Mobile" className="w-full p-3 bg-white border border-[#E6D8C3] text-zinc-800 rounded-xl outline-none" value={newCustomer.mobile} onChange={e => setNewCustomer({...newCustomer, mobile: e.target.value})} />
            <input placeholder="Address" className="w-full p-3 bg-white border border-[#E6D8C3] text-zinc-800 rounded-xl outline-none" value={newCustomer.address} onChange={e => setNewCustomer({...newCustomer, address: e.target.value})} />
            <input placeholder="GSTIN" className="w-full p-3 bg-white border border-[#E6D8C3] text-zinc-800 rounded-xl outline-none" value={newCustomer.gstin} onChange={e => setNewCustomer({...newCustomer, gstin: e.target.value})} />
            <div className="flex gap-4 pt-4">
              <button type="button" onClick={() => setShowAdd(false)} className="flex-1 py-3 bg-zinc-100 border border-zinc-250 text-zinc-700 rounded-xl font-bold">Cancel</button>
              <button type="submit" className="flex-1 py-3 bg-[#6E5A4D] text-white rounded-xl font-bold">Save</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
