import React, { useState, useEffect, useRef } from 'react';
import { 
  Plus, 
  Search, 
  Trash2, 
  Printer, 
  Save, 
  UserPlus, 
  PackageSearch, 
  CreditCard, 
  Wallet, 
  Landmark, 
  Sparkles,
  FileCheck2,
  X,
  Keyboard,
  BadgeAlert,
  AlertCircle,
  CheckCircle
} from 'lucide-react';
import { erpApi } from '../lib/erpApi';
import { generateInvoicePDF } from '../lib/pdfGenerator';

interface BillingProps {
  company: any;
}

export default function Billing({ company }: BillingProps) {
  const [customers, setCustomers] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [items, setItems] = useState<any[]>([]);
  const [paymentMode, setPaymentMode] = useState('Cash');
  const [transportCharge, setTransportCharge] = useState(0);
  const [invoiceNo, setInvoiceNo] = useState('2026-27-100');
  const [stockWarning, setStockWarning] = useState<string | null>(null);
  
  // Custom Toasts state
  const [toasts, setToasts] = useState<Array<{ id: string; message: string; type: 'error' | 'success' | 'warning' | 'info' }>>([]);

  const triggerToast = (message: string, type: 'error' | 'success' | 'warning' | 'info' = 'error') => {
    const id = Date.now().toString() + Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };
  
  // Customer Details
  const [custName, setCustName] = useState('');
  const [custMobile, setCustMobile] = useState('');
  const [custAddress, setCustAddress] = useState('');
  const [showCustomerSuggestions, setShowCustomerSuggestions] = useState(false);
  const [showCustomerModal, setShowCustomerModal] = useState(false);

  // New Customer Modal form fields
  const [modalName, setModalName] = useState('');
  const [modalMobile, setModalMobile] = useState('');
  const [modalAddress, setModalAddress] = useState('');
  const [modalDue, setModalDue] = useState('0');
  const [modalLimit, setModalLimit] = useState('50000');

  // Single Smart Item row states
  const [smartItemName, setSmartItemName] = useState('');
  const [smartQty, setSmartQty] = useState(1);
  const [smartTotal, setSmartTotal] = useState('1000'); // total amount option filled by user
  const [smartGst, setSmartGst] = useState(18); // default standard 18% GST select
  const [smartHsn, setSmartHsn] = useState('8471'); // HSN Code
  const [pricingMode, setPricingMode] = useState<'flat' | 'standard'>('flat'); // flat: 1000 at 18% -> 820 price + 180 GST, standard: mathematical
  const [showItemDropdown, setShowItemDropdown] = useState(false);

  useEffect(() => {
    if (company?.id) {
      loadData();
    }
  }, [company]);

  // Hook for Windows Fast Keyboard Billing Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // F2: Trigger New Customer Modal
      if (e.key === 'F2') {
        e.preventDefault();
        setShowCustomerModal(prev => !prev);
      }
      
      // F4: Cycle Payment Mode
      if (e.key === 'F4') {
        e.preventDefault();
        const modes = ['Cash', 'Bank', 'UPI'];
        const currentIdx = modes.indexOf(paymentMode);
        const nextIdx = (currentIdx + 1) % modes.length;
        setPaymentMode(modes[nextIdx]);
      }

      // F8: Clear Active Bill
      if (e.key === 'F8') {
        e.preventDefault();
        if (confirm("Restore Bill items? This will reset all current items.")) {
          setItems([]);
        }
      }

      // F9: Save & Print Invoice (also Ctrl+S)
      if (e.key === 'F9' || ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's')) {
        e.preventDefault();
        handleSave();
      }

      // Ctrl + Enter: Quick Save & Print Key
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        handleSave();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [items, custName, custMobile, custAddress, selectedCustomer, paymentMode, transportCharge, company, invoiceNo, products, customers, smartItemName, smartTotal, smartGst, smartQty, pricingMode]);

  const loadData = async () => {
    const [custs, prods, invs] = await Promise.all([
      erpApi.getCustomers(company.id),
      erpApi.getProducts(company.id),
      erpApi.getInvoices(company.id)
    ]);
    setCustomers(custs || []);
    setProducts(prods || []);

    // Calculate next invoice sequence automatically
    let nextNum = 100;
    if (invs && invs.length > 0) {
      invs.forEach((inv: any) => {
        const match = inv.invoice_no?.match(/^2026-27-(\d+)$/);
        if (match) {
          const num = parseInt(match[1]);
          if (num >= nextNum) {
            nextNum = num + 1;
          }
        }
      });
    }
    setInvoiceNo(`2026-27-${nextNum}`);
  };

  // Amount based calculations for smart item row
  const getSmartEvaluations = () => {
    const total = Number(smartTotal) || 0;
    const qty = Number(smartQty) || 1;
    const gstRate = Number(smartGst) || 0;

    let basePricePerUnit = 0;
    let gstPerUnit = 0;

    if (pricingMode === 'flat') {
      const gstTotal = total * (gstRate / 100);
      const baseTotal = total - gstTotal;
      basePricePerUnit = baseTotal / qty;
      gstPerUnit = gstTotal / qty;
    } else {
      const baseTotal = total / (1 + (gstRate / 100));
      basePricePerUnit = baseTotal / qty;
      gstPerUnit = (total - baseTotal) / qty;
    }

    return {
      price: Number(basePricePerUnit.toFixed(2)),
      gstAmount: Number((gstPerUnit * qty).toFixed(2)),
      totalAmountInclusive: total
    };
  };

  const handleAddSmartItem = () => {
    if (!smartItemName.trim()) {
      triggerToast("Please enter an active item name.", "warning");
      return;
    }
    const qtyVal = Number(smartQty);
    if (isNaN(qtyVal) || qtyVal <= 0) {
      triggerToast("Item Quantity cannot be zero or negative!", "error");
      return;
    }

    const evals = getSmartEvaluations();
    const tempId = -Date.now(); // mark raw manual items

    // Warn if existing matching product has low stock
    const matchingProduct = products.find(p => p.name.toLowerCase() === smartItemName.trim().toLowerCase());
    if (matchingProduct && matchingProduct.category !== 'Service' && qtyVal > matchingProduct.stock) {
      setStockWarning(`⚠️ Low stock alert: "${matchingProduct.name}" has only ${matchingProduct.stock} left in store.`);
    }

    setItems([...items, {
      product_id: matchingProduct ? matchingProduct.id : tempId,
      name: smartItemName.trim(),
      price: evals.price,
      quantity: qtyVal,
      gst_rate: Number(smartGst),
      hsn: smartHsn || '8471'
    }]);

    // Reset input fields
    setSmartItemName('');
    setSmartQty(1);
    setSmartTotal('1000');
    setSmartHsn('8471');
    setShowItemDropdown(false);
    triggerToast(`Added "${smartItemName.trim()}" to bill worksheet.`, "success");
  };

  const handleSave = async () => {
    if (!custName.trim()) return alert("Customer Name is required.");
    if (!custMobile.trim()) return alert("Customer Contact is required.");
    if (items.length === 0) return alert("Please add at least one item first.");

    let finalCustomerId = selectedCustomer?.id;

    if (!finalCustomerId) {
      const exist = customers.find(c => c.name.toLowerCase() === custName.trim().toLowerCase() && c.mobile === custMobile.trim());
      if (exist) {
        finalCustomerId = exist.id;
      } else {
        try {
          const res = await erpApi.createCustomer({
            company_id: company.id,
            name: custName.trim(),
            mobile: custMobile.trim(),
            address: custAddress.trim(),
            previous_due: 0,
            credit_limit: 50000
          });
          finalCustomerId = res.id;
        } catch (err) {
          console.error("Backlog customer creation failed: ", err);
        }
      }
    }

    const finalizedItems = [];
    for (const i of items) {
      if (i.product_id < 0) {
        try {
          const freshProd = await erpApi.createProduct({
            company_id: company.id,
            name: i.name,
            category: 'Smart Bill Entry',
            hsn_code: i.hsn || '8471',
            purchase_price: Number((i.price * 0.82).toFixed(2)),
            selling_price: i.price,
            gst_rate: i.gst_rate,
            stock: i.quantity,
            min_stock: 5
          });
          finalizedItems.push({
            ...i,
            product_id: freshProd.id
          });
        } catch (e) {
          console.error("Auto-adding billing material failed:", e);
        }
      } else {
        finalizedItems.push(i);
      }
    }

    const subTotalVal = finalizedItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const totalGstVal = finalizedItems.reduce((sum, item) => sum + (item.price * item.quantity * item.gst_rate / 100), 0);
    const grandTotalVal = subTotalVal + totalGstVal + Number(transportCharge);

    const invoiceData = {
      company_id: company.id,
      customer_id: finalCustomerId,
      invoice_no: invoiceNo,
      total_amount: grandTotalVal,
      total_gst: totalGstVal,
      payment_mode: paymentMode,
      transport_charge: transportCharge,
      items: finalizedItems.map(item => ({
        product_id: item.product_id,
        quantity: item.quantity,
        price: item.price,
        gst_amount: (item.price * item.quantity * item.gst_rate / 100)
      }))
    };

    try {
      const res = await erpApi.createInvoice(invoiceData);
      if (res.success || res.id) {
        const invoiceHeaders = {
          invoice_no: invoiceNo,
          total_amount: grandTotalVal,
          total_gst: totalGstVal,
          payment_mode: paymentMode,
          transport_charge: transportCharge,
          date: new Date()
        };
        const activeCustomerObj = {
          name: custName,
          address: custAddress,
          mobile: custMobile,
          gstin: ''
        };
        generateInvoicePDF(company, invoiceHeaders, finalizedItems, activeCustomerObj);

        alert("Generated! Invoice Saved & printed successfully.");
        setItems([]);
        setCustName('');
        setCustMobile('');
        setCustAddress('');
        setSelectedCustomer(null);
        setTransportCharge(0);
        loadData();
      } else {
        alert("Failed to save invoice.");
      }
    } catch (err: any) {
      alert("Error: " + err.message);
    }
  };

  const handleDownload = () => {
    const subTotalVal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const totalGstVal = items.reduce((sum, item) => sum + (item.price * item.quantity * item.gst_rate / 100), 0);
    const grandTotalVal = subTotalVal + totalGstVal + Number(transportCharge);

    const invoiceHeaders = {
      invoice_no: invoiceNo,
      total_amount: grandTotalVal,
      total_gst: totalGstVal,
      payment_mode: paymentMode,
      transport_charge: transportCharge,
      date: new Date()
    };
    const currentCustomer = {
      name: custName || 'Walk-In Customer',
      address: custAddress || '',
      mobile: custMobile || '',
      gstin: ''
    };
    generateInvoicePDF(company, invoiceHeaders, items, currentCustomer);
  };

  const handleCreateCustomerLedger = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!modalName || !modalMobile) return alert("Name & Mobile is required.");

    try {
      const res = await erpApi.createCustomer({
        company_id: company.id,
        name: modalName.trim(),
        mobile: modalMobile.trim(),
        address: modalAddress.trim(),
        previous_due: Number(modalDue) || 0,
        credit_limit: Number(modalLimit) || 50000
      });
      if (res.id) {
        alert("Customer Ledger account registered!");
        const freshCusts = await erpApi.getCustomers(company.id);
        setCustomers(freshCusts);
        setSelectedCustomer(res);
        setCustName(modalName.trim());
        setCustMobile(modalMobile.trim());
        setCustAddress(modalAddress.trim());
        setModalName('');
        setModalMobile('');
        setModalAddress('');
        setModalDue('0');
        setShowCustomerModal(false);
      }
    } catch (e: any) {
      alert("Failed creating ledger: " + e.message);
    }
  };

  const subTotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const totalGst = items.reduce((sum, item) => sum + (item.price * item.quantity * item.gst_rate / 100), 0);
  const grandTotal = subTotal + totalGst + Number(transportCharge);

  return (
    <div className="space-y-4 max-w-7xl mx-auto text-zinc-800 relative">
      {/* Toast Notification Mount */}
      <div className="fixed top-6 right-6 z-[9999] flex flex-col gap-3 pointer-events-none max-w-sm w-full">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-center gap-3 px-4 py-3.5 rounded-xl shadow-2xl border transition-all duration-300 transform translate-y-0 ${
              toast.type === 'error'
                ? 'bg-rose-50 border-rose-200 text-rose-850 shadow-rose-100/50 animate-bounce'
                : toast.type === 'success'
                ? 'bg-emerald-50 border-emerald-200 text-emerald-850 shadow-emerald-100/50'
                : toast.type === 'warning'
                ? 'bg-amber-50 border-amber-200 text-amber-850 shadow-amber-100/50'
                : 'bg-zinc-900 border-zinc-800 text-white'
            }`}
          >
            {toast.type === 'error' ? (
              <AlertCircle size={18} className="text-rose-600 shrink-0" />
            ) : toast.type === 'success' ? (
              <CheckCircle size={18} className="text-emerald-600 shrink-0" />
            ) : toast.type === 'warning' ? (
              <AlertCircle size={18} className="text-amber-600 shrink-0" />
            ) : (
              <AlertCircle size={18} className="text-sky-600 shrink-0" />
            )}
            <span className="text-xs font-bold font-sans mr-2">{toast.message}</span>
            <button
              onClick={() => setToasts((prev) => prev.filter((t) => t.id !== toast.id))}
              className="ml-auto text-zinc-400 hover:text-zinc-650 font-extrabold focus:outline-none shrink-0"
              type="button"
            >
              <X size={14} />
            </button>
          </div>
        ))}
      </div>

      {/* Marg Classical Status & Stats Bar */}
      <div className="bg-emerald-700 text-white p-3 rounded-xl shadow-sm flex flex-wrap items-center justify-between gap-4 text-xs font-semibold">
        <div className="flex items-center gap-2">
          <span className="bg-white/25 px-2 py-0.5 rounded uppercase font-black text-[9px] tracking-widest text-[#E0FBEF] shadow-inner font-mono">MARG CORE</span>
          <span className="text-[11px] font-bold text-emerald-100">Workspace Ledger:</span>
          <span className="uppercase tracking-wide font-black">{company?.name || 'SANDBOX CORP'}</span>
        </div>
        <div className="flex items-center gap-4 text-[11px] font-mono">
          <div>GST REG NO: <span className="font-bold text-amber-300">{company?.gstin || 'UNREGISTERED'}</span></div>
          <div className="hidden sm:block">FINANCIAL YEAR: <span className="text-white font-bold">2026-2027</span></div>
          <div>ACTIVE SCHEME: <span className="text-emerald-100 font-bold">GST INCLUSIVE MODE</span></div>
        </div>
      </div>

      {stockWarning && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2.5 rounded-xl flex items-center justify-between text-xs font-semibold shadow-sm">
          <div className="flex items-center gap-2">
            <span className="text-sm">⚠️</span>
            <span>{stockWarning}</span>
          </div>
          <button onClick={() => setStockWarning(null)} className="text-zinc-400 hover:text-zinc-600 font-black">×</button>
        </div>
      )}

      {/* Main Marg classical fast deck */}
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-4 items-start">
        {/* Left Side Column: Party Info Box & Fast Spreadsheet Grid */}
        <div className="xl:col-span-3 space-y-4">
          
          {/* Party/Ledger Details Deck (Fast load) */}
          <div className="bg-zinc-50 rounded-xl border border-zinc-200 p-4 shadow-sm space-y-3">
            <div className="flex items-center justify-between border-b border-zinc-200 pb-2">
              <span className="text-[11px] font-extrabold text-emerald-850 uppercase tracking-widest flex items-center gap-1 font-mono">
                👤 [PARTY / LEDGER DETAILS]
              </span>
              <button
                type="button"
                onClick={() => setShowCustomerModal(true)}
                className="px-2.5 py-1 bg-white hover:bg-zinc-100 text-emerald-700 border border-emerald-200 rounded text-[9px] font-black uppercase tracking-wider transition"
              >
                + Register New Ledger (F2)
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1 relative">
                <label className="block text-[9px] font-bold text-zinc-500 uppercase tracking-wider">Party Name Lookup *</label>
                <div className="relative">
                  <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-400" />
                  <input
                    type="text"
                    required
                    placeholder="Type name (e.g. Anand Sharma)"
                    value={custName}
                    onChange={(e) => {
                      setCustName(e.target.value);
                      setShowCustomerSuggestions(true);
                      if (selectedCustomer && selectedCustomer.name !== e.target.value) {
                        setSelectedCustomer(null);
                      }
                    }}
                    className="w-full pl-8 pr-3 py-1.5 bg-white border border-zinc-300 rounded text-xs text-zinc-800 focus:border-emerald-600 outline-none font-bold"
                  />
                </div>

                {showCustomerSuggestions && custName && (
                  <div className="absolute top-full left-0 w-full mt-1 bg-white border border-zinc-200 rounded shadow-xl z-50 p-1.5 max-h-48 overflow-y-auto">
                    {customers.filter(c => c.name.toLowerCase().includes(custName.toLowerCase())).map(c => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => {
                          setSelectedCustomer(c);
                          setCustName(c.name);
                          setCustMobile(c.mobile || '');
                          setCustAddress(c.address || '');
                          setShowCustomerSuggestions(false);
                        }}
                        className="w-full text-left p-2 rounded hover:bg-zinc-100 transition flex items-center justify-between text-xs"
                      >
                        <div>
                          <div className="font-bold text-zinc-800">{c.name}</div>
                          <div className="text-[10px] text-zinc-404 font-medium">Mob: {c.mobile}</div>
                        </div>
                        <span className="text-[9px] bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded font-black font-mono">
                          Bal: ₹{c.outstanding_balance || 0}
                        </span>
                      </button>
                    ))}
                    {customers.filter(c => c.name.toLowerCase().includes(custName.toLowerCase())).length === 0 && (
                      <div className="p-2 text-center text-zinc-400 text-[10px] italic bg-zinc-50 rounded font-sans">
                        New Party. Will auto-register upon saving.
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="space-y-1">
                <label className="block text-[9px] font-bold text-zinc-500 uppercase tracking-wider">Party Mobile No. *</label>
                <input
                  type="text"
                  required
                  placeholder="Mobile/WhatsApp"
                  value={custMobile}
                  onChange={(e) => {
                    setCustMobile(e.target.value);
                    if (selectedCustomer && selectedCustomer.mobile !== e.target.value) {
                      setSelectedCustomer(null);
                    }
                  }}
                  className="w-full px-3 py-1.5 bg-white border border-zinc-300 rounded text-xs text-zinc-800 focus:border-emerald-600 outline-none font-bold font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[9px] font-bold text-zinc-500 uppercase tracking-wider">Party Address / City</label>
                <input
                  type="text"
                  placeholder="Billing Location Address"
                  value={custAddress}
                  onChange={(e) => setCustAddress(e.target.value)}
                  className="w-full px-3 py-1.5 bg-white border border-zinc-300 rounded text-xs text-zinc-800 focus:border-emerald-600 outline-none font-medium"
                />
              </div>
            </div>

            {/* Account ledger details overlay */}
            {selectedCustomer && (
              <div className="bg-emerald-50 border border-emerald-100 rounded p-2 grid grid-cols-3 gap-2 text-[11px] font-bold text-emerald-800">
                <div className="bg-white/80 p-1 rounded border border-emerald-150">
                  <span className="text-[8px] text-zinc-500 uppercase block">Op. Due / Advance</span>
                  <span className="font-mono text-xs font-black text-zinc-800">₹{Number(selectedCustomer.previous_due || 0).toFixed(2)}</span>
                </div>
                <div className="bg-white/80 p-1 rounded border border-emerald-150">
                  <span className="text-[8px] text-zinc-500 uppercase block">Present Outstanding</span>
                  <span className="font-mono text-xs font-black text-rose-600">₹{Number(selectedCustomer.outstanding_balance || 0).toFixed(2)}</span>
                </div>
                <div className="bg-white/80 p-1 rounded border border-emerald-150">
                  <span className="text-[8px] text-zinc-500 uppercase block">Approved Credit Limit</span>
                  <span className="font-mono text-xs font-black text-emerald-800">₹{Number(selectedCustomer.credit_limit || 50000).toFixed(2)}</span>
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4 pt-2 border-t border-dashed border-zinc-200">
              <div className="space-y-1">
                <label className="block text-[9px] font-bold text-zinc-500 uppercase tracking-wider">Invoice Serial No.</label>
                <input
                  type="text"
                  value={invoiceNo}
                  onChange={(e) => setInvoiceNo(e.target.value)}
                  className="w-full px-3 py-1 bg-emerald-50/50 border border-emerald-200 rounded font-mono text-xs font-black text-emerald-800 outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[9px] font-bold text-zinc-500 uppercase tracking-wider">Voucher Billing Date</label>
                <input
                  type="date"
                  defaultValue={new Date().toISOString().split('T')[0]}
                  className="w-full px-3 py-1 bg-white border border-zinc-200 rounded text-xs font-bold focus:border-emerald-600 text-zinc-700 font-mono outline-none"
                />
              </div>
            </div>
          </div>

          {/* Marg Spreadsheet fast-entry horizontal board */}
          <div className="bg-[#EBF7F2] p-4 rounded-xl border border-emerald-200 shadow-sm space-y-3">
            <div className="flex items-center justify-between border-b border-emerald-100 pb-1.5 mb-2">
              <span className="text-[10px] font-black text-emerald-850 uppercase tracking-wider flex items-center gap-1 font-mono">
                🚀 FAST SPREADSHEET ROW DISPATCH ENTRY BAR (Press Enter to Append)
              </span>
              <span className="text-[9px] text-emerald-600 font-bold italic font-sans animate-pulse">Master inventory auto-indexing is loaded</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
              {/* Product item finder dropdown */}
              <div className="md:col-span-5 space-y-1 relative">
                <label className="block text-[9px] font-black text-emerald-900 uppercase">1. Item / Canon Model Name *</label>
                <div className="relative">
                  <PackageSearch size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-500" />
                  <input
                    type="text"
                    required
                    placeholder="Search master or type custom camera, stand, sensor..."
                    value={smartItemName}
                    onChange={(e) => {
                      setSmartItemName(e.target.value);
                      setShowItemDropdown(true);
                    }}
                    onFocus={() => setShowItemDropdown(true)}
                    className="w-full pl-8 pr-3 py-1.5 bg-white border border-emerald-300 rounded text-xs font-bold text-zinc-900 focus:ring-1 focus:ring-emerald-500 outline-none"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddSmartItem();
                      }
                    }}
                  />
                </div>

                {showItemDropdown && smartItemName && (
                  <div className="absolute top-full left-0 w-full mt-1 bg-white border border-zinc-300 rounded shadow-2xl z-50 p-1.5 max-h-48 overflow-y-auto">
                    {products.filter(p => p.name.toLowerCase().includes(smartItemName.toLowerCase())).map(p => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => {
                          setSmartItemName(p.name);
                          setSmartGst(p.gst_rate || 18);
                          setSmartHsn(p.hsn_code || '8471');
                          setSmartTotal((Number(p.selling_price) * smartQty).toString());
                          setShowItemDropdown(false);
                        }}
                        className="w-full text-left p-2 rounded hover:bg-emerald-50 transition flex justify-between text-xs items-center gap-2"
                      >
                        <div>
                          <div className="font-extrabold text-zinc-900">{p.name}</div>
                          <div className="text-[10px] text-zinc-500 font-sans">Stock: <span className="text-emerald-700 font-bold">{p.stock} Units</span> | HSN: {p.hsn_code}</div>
                        </div>
                        <span className="font-black text-emerald-700 font-mono text-[11px]">
                          ₹{Number(p.selling_price).toFixed(2)}
                        </span>
                      </button>
                    ))}
                    {products.filter(p => p.name.toLowerCase().includes(smartItemName.toLowerCase())).length === 0 && (
                      <div className="p-2 text-center text-zinc-400 text-[10px] italic bg-zinc-50 rounded font-sans">
                        Standalone item. Will register in Master catalog automatically.
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Total Row amount to backward evaluate */}
              <div className="md:col-span-2 space-y-1">
                <label className="block text-[9px] font-black text-emerald-900 uppercase">2. Total Row (₹)</label>
                <input
                  type="number"
                  placeholder="e.g. 1500"
                  value={smartTotal}
                  onChange={(e) => setSmartTotal(e.target.value)}
                  className="w-full px-3 py-1.5 bg-white border border-emerald-300 rounded text-xs font-mono font-bold text-zinc-900 focus:ring-1 focus:ring-emerald-500 outline-none"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddSmartItem();
                    }
                  }}
                />
              </div>

              {/* Enter Quantity */}
              <div className="md:col-span-1.5 space-y-1">
                <label className="block text-[9px] font-black text-emerald-900 uppercase">3. Qty</label>
                <input
                  type="number"
                  value={smartQty}
                  onChange={(e) => {
                    const typed = e.target.value;
                    setSmartQty(typed === '' ? '' as any : Number(typed));
                  }}
                  className="w-full px-2 py-1.5 bg-white border border-emerald-300 rounded text-xs font-mono font-bold text-center text-zinc-900 focus:ring-1 focus:ring-emerald-500 outline-none"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddSmartItem();
                    }
                  }}
                />
              </div>

              {/* GST rate */}
              <div className="md:col-span-2 space-y-1">
                <label className="block text-[9px] font-black text-emerald-900 uppercase">4. GST %</label>
                <select
                  value={smartGst}
                  onChange={(e) => setSmartGst(Number(e.target.value))}
                  className="w-full px-2 py-1.5 bg-white border border-emerald-300 rounded text-[11px] font-bold text-zinc-800 outline-none bg-white font-mono"
                >
                  <option value={0}>0% (Exempt)</option>
                  <option value={5}>5% GST</option>
                  <option value={12}>12% GST</option>
                  <option value={18}>18% GST (Std)</option>
                  <option value={28}>28% GST</option>
                </select>
              </div>

              {/* Dispatch Action */}
              <div className="md:col-span-1.5">
                <button
                  type="button"
                  onClick={handleAddSmartItem}
                  className="w-full py-1.5 bg-emerald-700 text-white rounded text-xs font-black uppercase hover:bg-emerald-800 shadow-sm transition tracking-wider flex items-center justify-center gap-1 cursor-pointer"
                >
                  <span>Add [Enter]</span>
                </button>
              </div>
            </div>

            {/* Price backward evaluator status */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between text-[11px] text-zinc-650 bg-white/70 p-2.5 rounded border border-emerald-100 gap-3">
              <div className="flex flex-wrap gap-4 font-sans">
                <label className="flex items-center gap-1 cursor-pointer text-emerald-900 font-extrabold">
                  <input
                    type="radio"
                    name="calcStyle"
                    checked={pricingMode === 'flat'}
                    onChange={() => setPricingMode('flat')}
                    className="accent-emerald-700"
                  />
                  <span>Marg Flat Mode (Net subtraction: ₹{smartTotal} total maps to ₹{(Number(smartTotal) * (1 - smartGst/100)).toFixed(2)} basic)</span>
                </label>
                <label className="flex items-center gap-1 cursor-pointer text-emerald-900 font-extrabold">
                  <input
                    type="radio"
                    name="calcStyle"
                    checked={pricingMode === 'standard'}
                    onChange={() => setPricingMode('standard')}
                    className="accent-emerald-700"
                  />
                  <span>Tally Standard Inclusive (e.g. ₹{smartTotal} inclusive = ₹{(Number(smartTotal) / (1 + smartGst/100)).toFixed(2)} taxable)</span>
                </label>
              </div>

              <div className="font-mono font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded tracking-wide text-[10px]">
                BACKWARD ESTIMATE &rarr; Taxable Basic: <span className="font-black font-mono">₹{getSmartEvaluations().price}</span> | Tax: <span className="font-black font-mono">₹{getSmartEvaluations().gstAmount}</span>
              </div>
            </div>
          </div>

          {/* Core Invoice Worksheet Table */}
          <div className="bg-white rounded-xl border border-zinc-200 p-0 shadow-sm overflow-hidden">
            <div className="bg-zinc-100/80 px-4 py-2 border-b border-zinc-200 flex justify-between items-center text-xs">
              <span className="font-extrabold text-zinc-600 block">[WORKSHEET BILLING DRAFT INVOICE ITEMS]</span>
              <span className="text-[10px] text-zinc-505 font-bold">Loaded Items Count: <span className="text-emerald-700 font-black font-mono">{items.length}</span></span>
            </div>

            <div className="overflow-x-auto font-sans">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-zinc-50 border-b border-zinc-200 text-zinc-500 font-black text-[10px] uppercase">
                    <th className="py-2.5 px-4 w-12 text-center">S.No.</th>
                    <th className="py-2.5 px-3">Item / Canon Model Particulars</th>
                    <th className="py-2.5 px-3 text-center">HSN</th>
                    <th className="py-2.5 px-3 text-center">Qty / Pcs</th>
                    <th className="py-2.5 px-3 text-right">Taxable Rate (Excl.)</th>
                    <th className="py-2.5 px-3 text-right">SGST+CGST Amount</th>
                    <th className="py-2.5 px-3 text-right px-4">Net Gross Total</th>
                    <th className="py-2.5 px-3 text-center w-16">Del</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-150 text-[11px]">
                  {items.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-zinc-400 bg-zinc-50/50">
                        <span className="text-3xl block filter saturate-0 mb-2">📥</span>
                        <p className="font-bold">Worksheet billing draft queue is empty.</p>
                        <p className="text-[10px] text-zinc-400 mt-0.5 font-sans">Please add canon camera equipment, lenses, or accessories using the Entry Bar above.</p>
                      </td>
                    </tr>
                  ) : (
                    items.map((item, index) => {
                      const rowBase = item.price * item.quantity;
                      const rowGst = rowBase * (item.gst_rate / 100);
                      const rowTotal = rowBase + rowGst;

                      return (
                        <tr key={index} className="hover:bg-zinc-50/50 transition duration-100">
                          <td className="py-2.5 px-4 text-center text-zinc-400 font-mono font-bold border-r border-zinc-100">{index + 1}</td>
                          <td className="py-2.5 px-3 font-extrabold text-zinc-900">{item.name}</td>
                          <td className="py-2.5 px-3 text-center text-zinc-500 font-mono text-[10px]">{item.hsn || '8471'}</td>
                          <td className="py-2.5 px-3 text-center text-zinc-900">
                            <div className="flex items-center justify-center gap-1">
                              <button
                                type="button"
                                onClick={() => {
                                  if (item.quantity <= 1) {
                                    triggerToast("Quantity cannot be less than 1!", "warning");
                                    return;
                                  }
                                  const target = item.quantity - 1;
                                  setItems(items.map((it, idx) => idx === index ? { ...it, quantity: target } : it));
                                }}
                                className="w-5 h-5 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 font-black rounded flex items-center justify-center text-xs"
                              >
                                -
                              </button>
                              <span className="font-black text-zinc-950 font-mono w-6 text-center">{item.quantity}</span>
                              <button
                                type="button"
                                onClick={() => {
                                  const target = item.quantity + 1;
                                  setItems(items.map((it, idx) => idx === index ? { ...it, quantity: target } : it));
                                }}
                                className="w-5 h-5 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 font-black rounded flex items-center justify-center text-xs"
                              >
                                +
                              </button>
                            </div>
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono font-semibold text-zinc-700">₹{Number(item.price).toFixed(2)}</td>
                          <td className="py-2.5 px-3 text-right font-mono text-zinc-600">
                            <div>₹{rowGst.toFixed(2)}</div>
                            <div className="text-[9px] text-[#A3A3A3] font-sans font-bold">CGST+SGST {item.gst_rate}%</div>
                          </td>
                          <td className="py-2.5 px-3 text-right font-black text-emerald-850 px-4 font-mono text-xs">₹{rowTotal.toFixed(2)}</td>
                          <td className="py-2.5 px-3 text-center">
                            <button
                              type="button"
                              onClick={() => {
                                setItems(items.filter((_, idx) => idx !== index));
                              }}
                              className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg transition"
                            >
                              <Trash2 size={13} />
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Bottom table metadata strip */}
            <div className="bg-zinc-50 border-t border-zinc-200 p-3 flex flex-wrap justify-between items-center text-[11px] font-bold text-zinc-500 font-mono">
              <div className="flex gap-4">
                <span>TOTAL ASSESSABLE: <span className="font-mono text-zinc-800">₹{subTotal.toFixed(2)}</span></span>
                <span>TOTAL TAX DUTY: <span className="font-mono text-zinc-850">₹{totalGst.toFixed(2)}</span></span>
              </div>
              <div className="text-emerald-700 font-black font-mono">
                READY TO BILL GROSS: &nbsp;₹{grandTotal.toFixed(2)}
              </div>
            </div>
          </div>
        </div>

        {/* Right Side Column: Bill Invoice Summary & Keyboard Cheatboard */}
        <div className="space-y-4">
          {/* Main Account Balance Sheet Summary Card */}
          <div className="bg-white rounded-xl border border-zinc-200 shadow-sm p-4 space-y-4 font-sans">
            <h4 className="text-[10px] font-black uppercase tracking-widest text-zinc-400 border-b pb-1.5">[FINAL ACCOUNT OUTCOME]</h4>

            <div className="space-y-3 text-xs font-semibold text-zinc-600">
              <div className="flex justify-between">
                <span>Taxable Basic Subtotal</span>
                <span className="font-mono text-zinc-800">₹{subTotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-sans">
                <span>Integrated GST (CGST+SGST)</span>
                <span className="font-mono text-zinc-800">₹{totalGst.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-zinc-500 font-sans">Packing / Freight</span>
                <input
                  type="number"
                  value={transportCharge}
                  onChange={(e) => setTransportCharge(Number(e.target.value))}
                  className="w-20 px-2 py-0.5 bg-zinc-50 border border-zinc-300 rounded text-right font-mono font-bold font-black text-rose-700 outline-none focus:border-emerald-600"
                />
              </div>

              <hr className="border-zinc-200 border-dashed" />
              
              <div className="pt-1.5 flex flex-col space-y-1 bg-zinc-50 p-3 rounded-lg border border-dashed border-zinc-200">
                <span className="text-[9px] uppercase font-black text-zinc-400 block tracking-wider leading-none font-sans">GRAND LEDGER DUPLICATE BILL</span>
                <span className="text-xl font-bold tracking-tight text-emerald-850 font-mono font-black">₹{grandTotal.toFixed(2)}</span>
              </div>
            </div>

            {/* Classical Traditional Payment select buttons */}
            <div className="space-y-2 pt-2">
              <p className="text-[9px] uppercase font-bold text-zinc-500 tracking-wider font-sans">Default Payment Method</p>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'Cash', icon: Wallet, label: 'CASH BILL' },
                  { id: 'Bank', icon: Landmark, label: 'BANK ACC' },
                  { id: 'UPI', icon: CreditCard, label: 'UPI / OR' }
                ].map(mode => (
                  <button
                    key={mode.id}
                    onClick={() => setPaymentMode(mode.id)}
                    className={`flex flex-col items-center justify-center p-2 rounded border text-[9px] font-black tracking-wider transition-all duration-150 cursor-pointer ${paymentMode === mode.id ? 'bg-emerald-50 border-emerald-500 text-emerald-800 shadow-sm ring-1 ring-emerald-100 font-sans' : 'bg-white border-zinc-200 text-zinc-550 hover:bg-zinc-50'}`}
                  >
                    <mode.icon size={14} className="mb-1 text-emerald-700" />
                    <span>{mode.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Saving dispatch actions */}
            <div className="space-y-2 pt-4 border-t border-dashed border-zinc-200 font-extrabold text-xs">
              <button
                onClick={handleSave}
                className="w-full py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-black rounded-lg text-xs flex items-center justify-center gap-1.5 shadow-sm uppercase tracking-wide cursor-pointer text-center font-sans"
              >
                <Save size={13} /> Save & Print GST Bill (F9)
              </button>

              <button
                onClick={handleDownload}
                className="w-full py-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 font-extrabold rounded-lg text-xs flex items-center justify-center gap-1.5 transition uppercase tracking-wide cursor-pointer text-center font-sans"
              >
                <Printer size={13} /> Immediate PDF Preview (F12)
              </button>
            </div>
          </div>

          {/* Traditional Marg Soft Cheat panel */}
          <div className="bg-zinc-50 rounded-xl border border-zinc-200 p-4 space-y-2 font-sans">
            <div className="flex items-center gap-1.5 text-[10px] font-black text-zinc-500 uppercase tracking-widest border-b border-zinc-200 pb-1.5">
              <Keyboard size={13} className="text-zinc-500" /> Classical keyboard guide keys
            </div>
            <div className="space-y-1.5 text-[10px] font-bold text-zinc-650 font-mono">
              <div className="flex justify-between font-sans"><span>New Entry Ledger:</span> <kbd className="bg-white border rounded px-1.5 py-0.5 shadow-sm text-zinc-850 font-sans">F2</kbd></div>
              <div className="flex justify-between font-sans"><span>Cycle payment mode:</span> <kbd className="bg-white border rounded px-1.5 py-0.5 shadow-sm text-zinc-855 font-sans font-mono">F4</kbd></div>
              <div className="flex justify-between font-sans"><span>Reset Draft items:</span> <kbd className="bg-white border rounded px-1.5 py-0.5 shadow-sm text-zinc-855 font-sans font-mono">F8</kbd></div>
              <div className="flex justify-between font-sans"><span>Save Bill & Download:</span> <kbd className="bg-white border rounded px-1.5 py-0.5 shadow-sm text-zinc-855 font-sans font-mono">F9 / Ctrl + S</kbd></div>
              <div className="flex justify-between font-sans"><span>Auto-Save & Preview:</span> <kbd className="bg-white border rounded px-1.5 py-0.5 shadow-sm text-zinc-855 font-sans font-mono">F12</kbd></div>
            </div>
          </div>
        </div>
      </div>

      {/* Registering customer modal */}
      {showCustomerModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4 backdrop-blur-xs font-sans">
          <form onSubmit={handleCreateCustomerLedger} className="bg-white rounded-2xl border border-zinc-200 shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-200 pb-2">
              <h4 className="text-xs font-black text-emerald-800 uppercase tracking-widest flex items-center gap-1.5 font-sans">
                <span>➕</span> REGISTER MARG LEDGER PROFILE
              </h4>
              <button type="button" onClick={() => setShowCustomerModal(false)} className="text-zinc-400 hover:text-zinc-700 p-1 font-semibold text-lg">
                &times;
              </button>
            </div>

            <div className="space-y-3">
              <div className="space-y-0.5">
                <label className="block text-[9px] font-bold text-zinc-400 uppercase">Customer Full Name *</label>
                <input
                  type="text"
                  required
                  value={modalName}
                  onChange={(e) => setModalName(e.target.value)}
                  placeholder="e.g. Anand Sharma"
                  className="w-full px-3 py-1.5 border border-zinc-200 rounded text-xs focus:ring-1 focus:ring-emerald-500 outline-none font-bold text-zinc-800"
                />
              </div>

              <div className="space-y-0.5">
                <label className="block text-[9px] font-bold text-zinc-400 uppercase">Mobile Contact Number (10 digits) *</label>
                <input
                  type="tel"
                  required
                  value={modalMobile}
                  onChange={(e) => setModalMobile(e.target.value)}
                  placeholder="e.g. 98290XXXXX"
                  className="w-full px-3 py-1.5 border border-zinc-200 rounded text-xs focus:ring-1 focus:ring-emerald-500 outline-none font-bold text-zinc-800"
                />
              </div>

              <div className="space-y-0.5">
                <label className="block text-[9px] font-bold text-zinc-400 uppercase">Contact Address Details</label>
                <input
                  type="text"
                  value={modalAddress}
                  onChange={(e) => setModalAddress(e.target.value)}
                  placeholder="e.g. Shastri Nagar, Jaipur"
                  className="w-full px-3 py-1.5 border border-zinc-200 rounded text-xs focus:ring-1 focus:ring-emerald-500 outline-none text-zinc-805"
                />
              </div>

              <div className="grid grid-cols-2 gap-4 font-sans">
                <div className="space-y-0.5">
                  <label className="block text-[9px] font-bold text-zinc-400 uppercase">Opening Balance Due (₹)</label>
                  <input
                    type="number"
                    value={modalDue}
                    onChange={(e) => setModalDue(e.target.value)}
                    className="w-full px-3 py-1.5 border border-zinc-200 rounded text-xs focus:ring-1 focus:ring-emerald-500 outline-none font-black text-zinc-750"
                  />
                </div>

                <div className="space-y-0.5">
                  <label className="block text-[9px] font-bold text-zinc-400 uppercase">Credit Limit Guard (₹)</label>
                  <input
                    type="number"
                    value={modalLimit}
                    onChange={(e) => setModalLimit(e.target.value)}
                    className="w-full px-3 py-1.5 border border-zinc-200 rounded text-xs focus:ring-1 focus:ring-emerald-500 outline-none font-black text-emerald-800"
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-2 pt-4 justify-end border-t border-zinc-100 font-sans">
              <button
                type="button"
                onClick={() => setShowCustomerModal(false)}
                className="px-4 py-2 bg-zinc-100 hover:bg-zinc-200 text-[11px] font-bold rounded text-zinc-650 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 transition text-[11px] font-extrabold rounded text-white shadow-sm cursor-pointer"
              >
                Register Ledger Account
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
