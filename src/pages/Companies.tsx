import React, { useState } from 'react';
import { Plus, Building2, MapPin, Phone, Mail, CreditCard, ChevronRight } from 'lucide-react';
import { erpApi } from '../lib/erpApi';

export default function Companies({ onCompanyCreated, activeCompany, onSelect }: any) {
  const [companies, setCompanies] = useState<any[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [loading, setLoading] = useState(true);
  const [newCompany, setNewCompany] = useState({
    name: '',
    address: '',
    mobile: '',
    email: '',
    whatsapp: '',
    gstin: '',
    bank_name: '',
    account_no: '',
    ifsc: '',
    upi_id: '',
    terms: ''
  });

  React.useEffect(() => {
    loadCompanies();
  }, []);

  const loadCompanies = async () => {
    const data = await erpApi.getCompanies();
    setCompanies(data);
    setLoading(false);
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    await erpApi.createCompany(newCompany);
    setShowAdd(false);
    setNewCompany({
      name: '', address: '', mobile: '', email: '', whatsapp: '', gstin: '',
      bank_name: '', account_no: '', ifsc: '', upi_id: '', terms: ''
    });
    loadCompanies();
    onCompanyCreated();
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-zinc-900 flex items-center gap-2">
            <Building2 className="text-emerald-600" /> Company Configurations
          </h2>
          <p className="text-xs text-zinc-500">Manage multiple business entities from a single unified workspace dashboard</p>
        </div>
        <button 
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white text-xs font-bold rounded-xl hover:bg-emerald-700 transition shadow-sm"
        >
          <Plus size={16} /> Create New Company Profile
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {companies.map(c => (
          <div 
            key={c.id} 
            className={`group relative bg-white rounded-3xl p-6 border-2 transition-all cursor-pointer ${activeCompany?.id === c.id ? 'border-emerald-600 shadow-lg' : 'border-zinc-200 hover:border-zinc-300 shadow-sm'}`}
            onClick={() => onSelect(c)}
          >
            <div className="flex items-start justify-between mb-6">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-lg font-bold ${activeCompany?.id === c.id ? 'bg-emerald-600 text-white' : 'bg-zinc-100 text-zinc-500'}`}>
                {c.name[0]}
              </div>
              {activeCompany?.id === c.id && (
                <span className="px-2.5 py-0.5 bg-emerald-50 text-emerald-700 text-[9px] font-black uppercase tracking-wider rounded-full border border-emerald-100">Selected active</span>
              )}
            </div>
            
            <h3 className="text-base font-bold text-zinc-800 mb-4">{c.name}</h3>
            
            <div className="space-y-3">
              <div className="flex items-center gap-3 text-xs text-zinc-600">
                <MapPin size={14} className="text-zinc-400 shrink-0" /> <span className="truncate">{c.address || 'No Address'}</span>
              </div>
              <div className="flex items-center gap-3 text-xs text-zinc-600">
                <Phone size={14} className="text-zinc-400 shrink-0" /> <span>{c.mobile || 'No Mobile'}</span>
              </div>
              {c.email && (
                <div className="flex items-center gap-3 text-xs text-zinc-600">
                  <Mail size={14} className="text-zinc-400 shrink-0" /> <span className="truncate">{c.email}</span>
                </div>
              )}
              {c.whatsapp && (
                <div className="flex items-center gap-3 text-xs text-zinc-600 font-medium">
                  <span className="text-emerald-600 font-extrabold text-[10px] bg-emerald-50 px-1 py-0.5 rounded select-none shrink-0 border border-emerald-100">WA</span> <span>{c.whatsapp}</span>
                </div>
              )}
              <div className="flex items-center gap-3 text-xs text-zinc-600 font-medium">
                <CreditCard size={14} className="text-zinc-400 shrink-0" /> <span>GSTIN: {c.gstin || 'Unregistered'}</span>
              </div>
            </div>

            <div className="mt-8 pt-4 border-t border-zinc-100 flex items-center justify-between group-hover:text-emerald-700 font-semibold transition text-xs text-zinc-400">
              <span>Switch sandbox workspace</span>
              <ChevronRight size={14} />
            </div>
          </div>
        ))}
      </div>

      {showAdd && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-2xl rounded-2xl p-8 max-h-[90vh] border border-zinc-200 shadow-2xl overflow-y-auto custom-scrollbar">
            <div className="border-b border-zinc-100 pb-3 mb-6">
              <h2 className="text-sm font-bold text-emerald-700 uppercase tracking-widest flex items-center gap-2">
                <Building2 size={16} /> Setup New Business Profile Details
              </h2>
              <p className="text-[11px] text-zinc-400 mt-1">Fill out the official register configurations. Vouchers and invoices read directly from this card.</p>
            </div>

            <form onSubmit={handleAdd} className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="md:col-span-2 space-y-1">
                <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Business Name *</label>
                <input 
                  required
                  type="text" 
                  placeholder="e.g. Pixel Point Camera Shop" 
                  className="w-full px-3.5 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-xs focus:ring-1 focus:ring-emerald-500 focus:bg-white outline-none font-medium text-zinc-800"
                  value={newCompany.name}
                  onChange={e => setNewCompany({...newCompany, name: e.target.value})}
                />
              </div>
              <div className="md:col-span-2 space-y-1">
                <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Full Address</label>
                <textarea 
                  placeholder="Street, City, Zip Code" 
                  className="w-full px-3.5 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-xs focus:ring-1 focus:ring-emerald-500 focus:bg-white outline-none h-20 text-zinc-800"
                  value={newCompany.address}
                  onChange={e => setNewCompany({...newCompany, address: e.target.value})}
                />
              </div>
              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Mobile No.</label>
                <input 
                  type="text" 
                  placeholder="e.g. 98290XXXXX"
                  className="w-full px-3.5 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-xs focus:ring-1 focus:ring-emerald-500 focus:bg-white outline-none text-zinc-800 font-medium"
                  value={newCompany.mobile}
                  onChange={e => setNewCompany({...newCompany, mobile: e.target.value})}
                />
              </div>
              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest">GST Number</label>
                <input 
                  type="text" 
                  placeholder="e.g. 08AAAAA1111A1Z1"
                  className="w-full px-3.5 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-xs focus:ring-1 focus:ring-emerald-500 focus:bg-white outline-none text-zinc-800 font-mono font-bold"
                  value={newCompany.gstin}
                  onChange={e => setNewCompany({...newCompany, gstin: e.target.value})}
                />
              </div>
              <div className="md:col-span-2 mt-2">
                <h4 className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-3 block">Bank & Direct QR Details</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <input placeholder="Bank Name" className="px-3.5 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-xs focus:ring-1 focus:ring-emerald-500 outline-none text-zinc-800 font-medium" value={newCompany.bank_name} onChange={e => setNewCompany({...newCompany, bank_name: e.target.value})} />
                  <input placeholder="Account Number" className="px-3.5 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-xs focus:ring-1 focus:ring-emerald-500 outline-none text-zinc-800 font-mono font-bold" value={newCompany.account_no} onChange={e => setNewCompany({...newCompany, account_no: e.target.value})} />
                  <input placeholder="IFSC Code" className="px-3.5 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-xs focus:ring-1 focus:ring-emerald-500 outline-none text-zinc-800 font-mono font-bold" value={newCompany.ifsc} onChange={e => setNewCompany({...newCompany, ifsc: e.target.value})} />
                  <input placeholder="E-mail" type="email" className="px-3.5 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-xs focus:ring-1 focus:ring-emerald-500 outline-none text-zinc-800 font-semibold" value={newCompany.email} onChange={e => setNewCompany({...newCompany, email: e.target.value})} />
                  <input placeholder="UPI ID (for fast scan generation e.g. pay@upi)" className="px-3.5 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-xs focus:ring-1 focus:ring-emerald-500 outline-none text-zinc-800 font-semibold" value={newCompany.upi_id} onChange={e => setNewCompany({...newCompany, upi_id: e.target.value})} />
                  <input placeholder="WhatsApp No." className="px-3.5 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-xs focus:ring-1 focus:ring-emerald-500 outline-none text-zinc-800 font-medium" value={newCompany.whatsapp} onChange={e => setNewCompany({...newCompany, whatsapp: e.target.value})} />
                </div>
              </div>

              <div className="md:col-span-2 mt-2 space-y-1">
                <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Terms & Conditions (Generates on prints)</label>
                <textarea 
                  placeholder="e.g. 1. Goods once sold will not be returned.&#10;2. Please pay within 7 days from the invoice date." 
                  className="w-full px-3.5 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-xs focus:ring-1 focus:ring-emerald-500 focus:bg-white outline-none h-20 text-zinc-700 font-semibold"
                  value={newCompany.terms}
                  onChange={e => setNewCompany({...newCompany, terms: e.target.value})}
                />
              </div>
              
              <div className="md:col-span-2 flex gap-3 mt-4 justify-end">
                <button 
                  type="button" 
                  onClick={() => setShowAdd(false)}
                  className="px-5 py-2.5 bg-zinc-100 hover:bg-zinc-200 transition font-bold rounded-xl text-xs text-zinc-600"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="px-5 py-2.5 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 transition text-xs shadow-sm"
                >
                  Create Company Workspace
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
