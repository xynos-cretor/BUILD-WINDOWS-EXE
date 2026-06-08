import React, { useState, useEffect } from 'react';
import { History, Search, Download, Eye, Edit3, Trash2, Calendar, Loader2, ShoppingBag } from 'lucide-react';
import { erpApi } from '../lib/erpApi';
import { generateInvoicePDF, generatePurchasePDF } from '../lib/pdfGenerator';

export default function BillHistory({ company }: { company: any }) {
  const [historyType, setHistoryType] = useState<'sales' | 'purchases'>('sales');
  const [invoices, setInvoices] = useState<any[]>([]);
  const [purchases, setPurchases] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [downloadingId, setDownloadingId] = useState<number | null>(null);

  useEffect(() => {
    if (company?.id) {
      load();
    }
  }, [company?.id, historyType]);

  const load = async () => {
    setLoading(true);
    setSearch('');
    try {
      if (historyType === 'sales') {
        const data = await erpApi.getInvoices(company.id);
        setInvoices(data || []);
      } else {
        const data = await erpApi.getPurchases(company.id);
        setPurchases(data || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadInvoice = async (invoiceId: number) => {
    try {
      setDownloadingId(invoiceId);
      const details = await erpApi.getInvoiceDetails(invoiceId);
      
      // Support both nested { invoice, items } and flat { ...invoice, items } formats safely
      const invoice = details.invoice || details;
      const items = details.items || [];
      
      // Need customer details for PDF
      const customer = {
        name: invoice.customer_name,
        address: invoice.customer_address,
        gstin: invoice.customer_gstin,
        mobile: invoice.customer_mobile
      };

      generateInvoicePDF(company, invoice, items, customer);
    } catch (error) {
      console.error('Download failed', error);
      alert('Failed to generate PDF. Please try again.');
    } finally {
      setDownloadingId(null);
    }
  };

  const handleDownloadPurchase = async (purchase: any) => {
    try {
      setDownloadingId(purchase.id);
      const items = await erpApi.getPurchaseItems(purchase.id);
      const vendor = {
        name: purchase.vendor_name || 'Walk-in Vendor',
        address: purchase.vendor_address || 'No Address Provided',
        gstin: purchase.vendor_gstin || 'N/A',
        mobile: purchase.vendor_mobile || 'N/A'
      };
      generatePurchasePDF(company, purchase, items, vendor);
    } catch (error) {
      console.error('Download purchase PDF failed', error);
      alert('Failed to generate Purchase PDF. Please try again.');
    } finally {
      setDownloadingId(null);
    }
  };

  const filteredInvoices = invoices.filter(inv => 
    inv.invoice_no?.toLowerCase().includes(search.toLowerCase()) ||
    inv.customer_name?.toLowerCase().includes(search.toLowerCase())
  );

  const filteredPurchases = purchases.filter(p => 
    p.bill_no?.toLowerCase().includes(search.toLowerCase()) ||
    p.vendor_name?.toLowerCase().includes(search.toLowerCase())
  );

  const themeColor = historyType === 'sales' ? 'sky' : 'orange';

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 text-zinc-900">
        <div>
          <h2 className="text-2xl font-black text-[#4E3E34]">Billing & Inward History</h2>
          <p className="text-xs text-zinc-500 font-bold mt-1 uppercase tracking-wider">Review, manage and download outward invoices & inward bills</p>
        </div>
        <div className="flex gap-4 w-full sm:w-auto">
          <div className="relative flex-grow">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={16} />
            <input 
              type="text" 
              placeholder={historyType === 'sales' ? "Invoice # or Customer..." : "Bill # or Supplier..."} 
              className="w-full sm:w-64 pl-10 pr-4 py-2.5 bg-white border border-[#E6D8C3] rounded-xl text-sm focus:ring-2 focus:ring-[#8C725E] focus:outline-none transition-all font-medium text-zinc-805"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Modern Tabs */}
      <div className="flex border-b border-[#E6D8C3] gap-6">
        <button 
          onClick={() => setHistoryType('sales')}
          className={`pb-4 px-2 text-sm font-bold border-b-2 transition-all duration-200 ${
            historyType === 'sales' 
              ? 'border-[#8C725E] text-[#6E5A4D]' 
              : 'border-transparent text-zinc-400 hover:text-zinc-650'
          }`}
        >
          Sales Invoices (Customers)
        </button>
        <button 
          onClick={() => setHistoryType('purchases')}
          className={`pb-4 px-2 text-sm font-bold border-b-2 transition-all duration-200 ${
            historyType === 'purchases' 
              ? 'border-[#8C725E] text-[#6E5A4D]' 
              : 'border-transparent text-zinc-400 hover:text-zinc-650'
          }`}
        >
          Purchase Bills (Suppliers)
        </button>
      </div>

      <div className="bg-[#FAF8F5] rounded-3xl border border-[#E6D8C3] overflow-hidden shadow-sm">
        {historyType === 'sales' ? (
          <table className="w-full text-left">
            <thead className="bg-[#F1F3F5] border-b border-[#E6D8C3]">
              <tr>
                <th className="py-5 px-8 text-[10px] font-black text-[#6E5A4D] uppercase tracking-widest">Invoice #</th>
                <th className="py-5 px-8 text-[10px] font-black text-[#6E5A4D] uppercase tracking-widest">Customer</th>
                <th className="py-5 px-8 text-[10px] font-black text-[#6E5A4D] uppercase tracking-widest">Date</th>
                <th className="py-5 px-8 text-[10px] font-black text-[#6E5A4D] uppercase tracking-widest text-right">Amount</th>
                <th className="py-5 px-8 text-[10px] font-black text-[#6E5A4D] uppercase tracking-widest text-center">Status</th>
                <th className="py-5 px-8"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E6D8C3]">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-20 text-center">
                    <Loader2 className="animate-spin text-[#6E5A4D] mx-auto mb-2" size={32} />
                    <p className="text-sm font-bold text-zinc-400">Loading history...</p>
                  </td>
                </tr>
              ) : filteredInvoices.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-20 text-center text-zinc-400 font-bold">No invoices found.</td>
                </tr>
              ) : filteredInvoices.map(inv => (
                <tr key={inv.id} className="hover:bg-white transition group bg-transparent">
                  <td className="py-6 px-8 font-mono text-xs font-black text-[#6E5A4D] tracking-wider underline underline-offset-4 decoration-[#E6D8C3]">{inv.invoice_no}</td>
                  <td className="py-6 px-8">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 bg-grey-200 text-[#4E3E34] rounded-xl flex items-center justify-center font-black text-xs shadow-sm">{inv.customer_name ? inv.customer_name[0] : 'C'}</div>
                      <div>
                        <p className="font-extrabold text-zinc-800 text-sm tracking-tight">{inv.customer_name}</p>
                        <p className="text-[10px] font-bold text-zinc-400">{inv.payment_mode}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-6 px-8 text-xs text-zinc-500 font-bold">{new Date(inv.date).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}</td>
                  <td className="py-6 px-8 text-right font-black text-sm tracking-tighter text-zinc-850">₹{inv.total_amount.toLocaleString()}</td>
                  <td className="py-6 px-8 text-center">
                    <span className="px-3 py-1 bg-[#F3ECE1] text-[#6E5A4D] border border-beige-350 text-[10px] font-black rounded-lg uppercase tracking-widest">Paid</span>
                  </td>
                  <td className="py-6 px-8">
                    <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition translate-x-2 group-hover:translate-x-0">
                      <button 
                        onClick={() => handleDownloadInvoice(inv.id)}
                        disabled={downloadingId === inv.id}
                        className="p-2.5 bg-white border border-[#E6D8C3] rounded-xl text-zinc-400 hover:text-[#8C725E] shadow-sm hover:scale-110 transition active:scale-95 disabled:opacity-50"
                      >
                        {downloadingId === inv.id ? <Loader2 className="animate-spin" size={18} /> : <Download size={18} />}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <table className="w-full text-left">
            <thead className="bg-[#F1F3F5] border-b border-[#E6D8C3]">
              <tr>
                <th className="py-5 px-8 text-[10px] font-black text-[#6E5A4D] uppercase tracking-widest">Bill No / Inward #</th>
                <th className="py-5 px-8 text-[10px] font-black text-[#6E5A4D] uppercase tracking-widest">Supplier / Vendor</th>
                <th className="py-5 px-8 text-[10px] font-black text-[#6E5A4D] uppercase tracking-widest">Date</th>
                <th className="py-5 px-8 text-[10px] font-black text-[#6E5A4D] uppercase tracking-widest text-right">Amount</th>
                <th className="py-5 px-8 text-[10px] font-black text-[#6E5A4D] uppercase tracking-widest text-center">Payment Mode</th>
                <th className="py-5 px-8"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E6D8C3]">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-20 text-center">
                    <Loader2 className="animate-spin text-[#6E5A4D] mx-auto mb-2" size={32} />
                    <p className="text-sm font-bold text-zinc-400">Loading purchase bills...</p>
                  </td>
                </tr>
              ) : filteredPurchases.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-20 text-center text-zinc-400 font-bold">No purchase bills found.</td>
                </tr>
              ) : filteredPurchases.map(p => (
                <tr key={p.id} className="hover:bg-white transition group bg-transparent">
                  <td className="py-6 px-8 font-mono text-xs font-black text-[#6E5A4D] tracking-wider underline underline-offset-4 decoration-[#E6D8C3]">{p.bill_no || 'N/A'}</td>
                  <td className="py-6 px-8">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 bg-grey-200 text-[#4E3E34] rounded-xl flex items-center justify-center font-black text-xs shadow-sm">{p.vendor_name ? p.vendor_name[0] : 'V'}</div>
                      <div>
                        <p className="font-extrabold text-zinc-800 text-sm tracking-tight">{p.vendor_name || 'Walk-in Vendor'}</p>
                        <p className="text-[10px] font-bold text-zinc-400">Supplier Account Record</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-6 px-8 text-xs text-zinc-500 font-bold">{new Date(p.date).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}</td>
                  <td className="py-6 px-8 text-right font-black text-sm tracking-tighter text-zinc-800">₹{Number(p.total_amount + (p.transport_charge || 0)).toLocaleString()}</td>
                  <td className="py-6 px-8 text-center text-zinc-900">
                    <span className="px-2.5 py-1 text-xs font-semibold rounded bg-grey-100 border border-grey-300 text-zinc-700">{p.payment_mode}</span>
                  </td>
                  <td className="py-6 px-8">
                    <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition translate-x-2 group-hover:translate-x-0">
                      <button 
                        onClick={() => handleDownloadPurchase(p)}
                        disabled={downloadingId === p.id}
                        className="p-2.5 bg-white border border-[#E6D8C3] rounded-xl text-zinc-400 hover:text-[#8C725E] shadow-sm hover:scale-110 transition active:scale-95 disabled:opacity-50"
                      >
                        {downloadingId === p.id ? <Loader2 className="animate-spin shrink-0" size={18} /> : <Download size={18} />}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
