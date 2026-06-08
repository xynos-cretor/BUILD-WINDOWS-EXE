import React, { useState, useEffect } from 'react';
import { ShoppingCart, Plus, Search, Trash2, Save, Users, PackageSearch, Download, FileText } from 'lucide-react';
import { erpApi } from '../lib/erpApi';
import { generatePurchasePDF } from '../lib/pdfGenerator';

export default function Purchases({ company }: any) {
  const [vendors, setVendors] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [selectedVendor, setSelectedVendor] = useState<any>(null);
  const [items, setItems] = useState<any[]>([]);
  const [billNo, setBillNo] = useState('');
  const [paymentMode, setPaymentMode] = useState('Cash');
  const [transportCharge, setTransportCharge] = useState(0);
  
  const [vendorSearch, setVendorSearch] = useState('');
  const [productSearch, setProductSearch] = useState('');
  const [showProductDropdown, setShowProductDropdown] = useState(false);
  
  const [purchaseHistory, setPurchaseHistory] = useState<any[]>([]);

  // Manual Custom Item and Reverse Calculator States
  const [addingMode, setAddingMode] = useState<'inventory' | 'manual'>('inventory');
  const [manualName, setManualName] = useState('');
  const [manualQty, setManualQty] = useState(1);
  const [manualGst, setManualGst] = useState(18);
  const [pricingMode, setPricingMode] = useState<'direct' | 'reverse'>('reverse');
  const [manualPrice, setManualPrice] = useState('0'); // for direct unit base price
  const [manualTotal, setManualTotal] = useState('1000'); // for reverse calculation total amount
  const [reverseTaxMethod, setReverseTaxMethod] = useState<'standard' | 'flat'>('flat'); // base default to flat discount (1000 -> 820 & 180)
  const [saveToMaster, setSaveToMaster] = useState(true);
  const [manualHsn, setManualHsn] = useState('');

  useEffect(() => {
    if (company?.id) loadData();
  }, [company]);

  // Windows Fast Download Keyboard Shortcuts Hook for Purchases
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Hotkey listeners for fast actions
      if (((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') || e.key === 'F9') {
        e.preventDefault();
        handleSave();
      }

      if (e.key === 'F8') {
        e.preventDefault();
        if (window.confirm("Clear purchase items? This will reset all current products draft entries.")) {
          setItems([]);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [items, selectedVendor, billNo, paymentMode, transportCharge, company, products, vendors]);

  const loadData = async () => {
    const [vends, prods, historyItems] = await Promise.all([
      erpApi.getVendors(company.id),
      erpApi.getProducts(company.id),
      erpApi.getPurchases(company.id)
    ]);
    setVendors(vends);
    setProducts(prods);
    setPurchaseHistory(historyItems || []);
  };

  const addItem = (product: any) => {
    const existing = items.find(i => i.product_id === product.id);
    if (existing) {
      setItems(items.map(i => i.product_id === product.id ? { ...i, quantity: i.quantity + 1 } : i));
    } else {
      setItems([...items, {
        product_id: product.id,
        name: product.name,
        price: product.purchase_price || 0,
        quantity: 1,
        gst_rate: product.gst_rate
      }]);
    }
  };

  const getManualItemCalculations = () => {
    const qty = Number(manualQty) || 1;
    const gstRate = Number(manualGst) || 0;
    
    let basePrice = 0;
    let gstAmountPerUnit = 0;
    
    if (pricingMode === 'direct') {
      basePrice = Number(manualPrice) || 0;
      gstAmountPerUnit = basePrice * (gstRate / 100);
    } else {
      const totalAmountInput = Number(manualTotal) || 0;
      if (reverseTaxMethod === 'standard') {
        const baseTotal = totalAmountInput / (1 + gstRate / 100);
        basePrice = baseTotal / qty;
        gstAmountPerUnit = (totalAmountInput - baseTotal) / qty;
      } else {
        // Flat style (e.g. 1000 at 18% -> gst is 180, base is 820)
        const gstTotal = totalAmountInput * (gstRate / 100);
        const baseTotal = totalAmountInput - gstTotal;
        basePrice = baseTotal / qty;
        gstAmountPerUnit = gstTotal / qty;
      }
    }
    
    return {
      basePrice, 
      gstAmountPerUnit, 
      totalBase: basePrice * qty,
      totalGst: gstAmountPerUnit * qty,
      grandTotal: (basePrice + gstAmountPerUnit) * qty
    };
  };

  const handleAddManualItem = () => {
    if (!manualName.trim()) {
      alert('Please enter Item Name');
      return;
    }
    if (Number(manualQty) <= 0) {
      alert('Quantity must be greater than 0');
      return;
    }

    const { basePrice } = getManualItemCalculations();
    const manualId = -Date.now(); // temporary negative ID to mark as custom raw manual entry

    setItems([...items, {
      product_id: manualId,
      name: manualName.trim(),
      price: Number(basePrice.toFixed(4)),
      quantity: Number(manualQty),
      gst_rate: Number(manualGst),
      hsn_code: manualHsn.trim() || 'AUTO',
      is_manual: true,
      save_to_master: saveToMaster
    }]);

    setManualName('');
    setManualHsn('');
    setManualPrice('0');
    alert('Custom Item registered to Bill draft!');
  };

  const subTotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const totalGst = items.reduce((sum, item) => sum + (item.price * item.quantity * item.gst_rate / 100), 0);
  const totalAmount = subTotal + totalGst;

  const handleSave = async () => {
    if (!selectedVendor || items.length === 0) return alert('Select vendor and items');
    
    // Auto-create any manual items first
    const itemsWithRealIds = [];
    for (const i of items) {
      if (i.product_id < 0) {
        try {
          const res = await erpApi.createProduct({
            company_id: company.id,
            name: i.name,
            category: i.save_to_master ? 'Raw Materials' : 'Standalone Bill Entry',
            hsn_code: i.hsn_code || 'N/A',
            purchase_price: i.price,
            selling_price: i.price * 1.2, 
            gst_rate: i.gst_rate,
            stock: 0, 
            min_stock: 0
          });
          itemsWithRealIds.push({
            ...i,
            product_id: res.id
          });
        } catch (createErr) {
          console.error("Failed to auto-create custom product:", i.name, createErr);
          alert(`Failed to register custom item "${i.name}" in the inventory.`);
          return;
        }
      } else {
        itemsWithRealIds.push(i);
      }
    }
    
    const data = {
      company_id: company.id,
      vendor_id: selectedVendor.id,
      bill_no: billNo,
      total_amount: totalAmount,
      total_gst: totalGst,
      transport_charge: transportCharge,
      payment_mode: paymentMode,
      items: itemsWithRealIds.map(i => ({
        product_id: i.product_id,
        quantity: i.quantity,
        price: i.price,
        gst_amount: (i.price * i.quantity * i.gst_rate / 100)
      }))
    };

    try {
      const res = await erpApi.createPurchase(data);
      alert('Purchase Recorded Successfully!');
      
      try {
        // Automatically download the recorded purchase bill PDF
        const simulatedPurchase = {
          id: res.id,
          vendor_id: selectedVendor.id,
          bill_no: billNo || 'N/A',
          date: new Date().toISOString(),
          payment_mode: paymentMode,
          total_amount: totalAmount,
          transport_charge: transportCharge,
          vendor_name: selectedVendor.name
        };
        
        const formattedItems = items.map(i => ({
          product_name: i.name,
          quantity: i.quantity,
          price: i.price,
          gst_rate: i.gst_rate
        }));
        
        generatePurchasePDF(company, simulatedPurchase, formattedItems, selectedVendor);
      } catch (pdfErr) {
        console.error("Auto PDF generation error: ", pdfErr);
      }

      setItems([]);
      setSelectedVendor(null);
      setBillNo('');
      setTransportCharge(0);
      
      // Refresh list
      const freshHistory = await erpApi.getPurchases(company.id);
      setPurchaseHistory(freshHistory || []);
    } catch (err: any) {
      console.error("Failed recording purchase bill", err);
      alert(`Error recording purchase bill: ${err?.message || err}`);
    }
  };

  const downloadPurchasePDF = async (purchase: any) => {
    try {
      const vend = {
        name: purchase.vendor_name || 'Walk-in Vendor',
        address: purchase.vendor_address || 'No Address Provided',
        gstin: purchase.vendor_gstin || 'N/A',
        mobile: purchase.vendor_mobile || 'N/A'
      };
      
      // Fetch the actual purchase items
      const pItems = await erpApi.getPurchaseItems(purchase.id);
      
      // Trigger PDF generation
      generatePurchasePDF(company, purchase, pItems, vend);
    } catch (err: any) {
      console.error("Failed to download purchase PDF", err);
      alert(`Error fetching purchase items: ${err?.message || err}`);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 text-zinc-850">
      <div className="bg-white rounded-2xl p-6 border border-zinc-200 shadow-sm">
        <h2 className="text-lg font-bold mb-6 text-zinc-900 flex items-center gap-2 border-b border-zinc-100 pb-3">
          <ShoppingCart className="text-emerald-600" /> Record Purchase Bill Voucher
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-6">
          <div className="relative space-y-1">
            <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">Vendor Name *</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={14} />
              <input 
                type="text" 
                className="w-full pl-9 pr-4 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-xs text-zinc-800 outline-none focus:ring-1 focus:ring-emerald-500 focus:bg-white transition"
                placeholder="Search vendor..."
                value={vendorSearch}
                onChange={e => setVendorSearch(e.target.value)}
              />
            </div>
            {vendorSearch && (
              <div className="absolute top-full left-0 w-full mt-1 bg-white border border-zinc-200 rounded-xl shadow-xl z-50 p-2 max-h-48 overflow-y-auto">
                {vendors.filter(v => v.name.toLowerCase().includes(vendorSearch.toLowerCase())).map(v => (
                  <button 
                    key={v.id} 
                    onClick={() => { setSelectedVendor(v); setVendorSearch(''); }} 
                    className="w-full text-left p-2 hover:bg-zinc-100 rounded-lg text-xs"
                  >
                    {v.name}
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">Bill Number *</label>
            <input 
              type="text" 
              className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-xs text-zinc-800 outline-none focus:ring-1 focus:ring-emerald-500 focus:bg-white transition"
              placeholder="e.g. VEND-123"
              value={billNo}
              onChange={e => setBillNo(e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">Transport / Freight (₹)</label>
            <input 
              type="number" 
              className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-xs text-zinc-800 outline-none focus:ring-1 focus:ring-emerald-500 focus:bg-white transition font-mono font-bold"
              value={transportCharge}
              onChange={e => setTransportCharge(Number(e.target.value))}
            />
          </div>
        </div>

        {selectedVendor && (
          <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-xl mb-6">
            <p className="font-bold flex items-center gap-1 text-emerald-800 text-xs">Selected Vendor Partner: {selectedVendor.name}</p>
            <p className="text-[10px] text-emerald-600 font-medium">GSTIN: {selectedVendor.gstin || 'Unregistered'} | Contact: {selectedVendor.mobile}</p>
          </div>
        )}

        {/* Toggle Mode Choice */}
        <div className="flex bg-zinc-100 p-1 rounded-xl mb-6 gap-2 max-w-md">
          <button
            type="button"
            onClick={() => setAddingMode('inventory')}
            className={`flex-1 py-1.5 px-3 rounded-lg font-bold text-[10px] uppercase tracking-wider transition-all duration-200 text-center ${addingMode === 'inventory' ? 'bg-emerald-600 text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-700'}`}
          >
            📦 From Inventory
          </button>
          <button
            type="button"
            onClick={() => setAddingMode('manual')}
            className={`flex-1 py-1.5 px-3 rounded-lg font-bold text-[10px] uppercase tracking-wider transition-all duration-200 text-center ${addingMode === 'manual' ? 'bg-emerald-600 text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-700'}`}
          >
            ✍️ Add Custom Item Direct
          </button>
        </div>

        {addingMode === 'inventory' ? (
          <div className="relative mb-6 space-y-1">
            <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">Search Inventory Stock Database *</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={14} />
              <input 
                type="text" 
                className="w-full pl-9 pr-4 py-2.5 bg-zinc-55 border border-zinc-200 rounded-xl text-xs text-zinc-800 select-none outline-none focus:ring-1 focus:ring-emerald-500 focus:bg-white"
                placeholder="Type item name or search from catalog..."
                value={productSearch}
                onChange={e => { setProductSearch(e.target.value); setShowProductDropdown(true); }}
              />
            </div>
            {showProductDropdown && productSearch && (
              <div className="absolute top-full left-0 w-full mt-1 bg-white border border-zinc-200 rounded-xl shadow-xl z-50 p-2 max-h-48 overflow-y-auto">
                {products.filter(p => p.name.toLowerCase().includes(productSearch.toLowerCase())).map(p => (
                  <button 
                    key={p.id} 
                    type="button" 
                    onClick={() => { addItem(p); setProductSearch(''); }} 
                    className="w-full text-left p-2.5 hover:bg-zinc-100 rounded-lg text-xs flex justify-between"
                  >
                    <span>{p.name} (GST {p.gst_rate}%)</span>
                    <span className="font-bold text-emerald-600">Rate: ₹{p.purchase_price}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="bg-zinc-50 p-5 rounded-xl border border-zinc-150 mb-6 space-y-4">
            <h4 className="text-[11px] font-black text-emerald-700 uppercase tracking-widest pb-2 border-b border-zinc-200">
              ✍️ Enter STANDALONE Item details
            </h4>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="md:col-span-2 space-y-1">
                <label className="text-[10px] font-bold text-zinc-400 uppercase">Item Description Name</label>
                <input 
                  type="text" 
                  className="w-full px-3 py-2 bg-white border border-zinc-200 rounded-xl text-xs text-zinc-800"
                  placeholder="e.g. Premium Camera stand, Charger, Lens covers"
                  value={manualName}
                  onChange={e => setManualName(e.target.value)}
                />
              </div>
              
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-zinc-400 uppercase">Quantity</label>
                <input 
                  type="number" 
                  min="1"
                  className="w-full px-3 py-2 bg-white border border-zinc-200 rounded-xl text-xs font-mono font-bold text-zinc-800"
                  value={manualQty}
                  onChange={e => setManualQty(Math.max(1, Number(e.target.value)))}
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-zinc-400 uppercase">Tax Rate Selection</label>
                <select 
                  className="w-full px-3 py-2 bg-white border border-zinc-200 rounded-xl text-xs text-zinc-800"
                  value={manualGst}
                  onChange={e => setManualGst(Number(e.target.value))}
                >
                  <option value="0">0% (Nil GST)</option>
                  <option value="5">5% GST</option>
                  <option value="12">12% GST</option>
                  <option value="18">18% GST (Standard)</option>
                  <option value="28">28% GST</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-zinc-400 uppercase">HSN Code</label>
                <input 
                  type="text" 
                  className="w-full px-3 py-2 bg-white border border-zinc-200 rounded-xl text-xs text-zinc-800"
                  placeholder="e.g. 8471"
                  value={manualHsn}
                  onChange={e => setManualHsn(e.target.value)}
                />
              </div>

              <div className="md:col-span-2 space-y-1">
                <label className="text-[10px] font-bold text-zinc-400 uppercase">Pricing method</label>
                <div className="flex p-1 bg-white border border-zinc-200 rounded-xl gap-1">
                  <button
                    type="button"
                    onClick={() => setPricingMode('reverse')}
                    className={`flex-1 py-1 px-2 rounded-lg text-[10px] font-bold transition-all ${pricingMode === 'reverse' ? 'bg-emerald-50 text-emerald-700' : 'text-zinc-500'}`}
                  >
                    💰 Total Amount (Deducted)
                  </button>
                  <button
                    type="button"
                    onClick={() => setPricingMode('direct')}
                    className={`flex-1 py-1 px-2 rounded-lg text-[10px] font-bold transition-all ${pricingMode === 'direct' ? 'bg-emerald-50 text-emerald-700' : 'text-zinc-500'}`}
                  >
                    🪙 Unit Base Price
                  </button>
                </div>
              </div>

              <div className="space-y-1">
                {pricingMode === 'direct' ? (
                  <>
                    <label className="text-[10px] font-bold text-zinc-400 uppercase">Unit Base Price (₹)</label>
                    <input 
                      type="number" 
                      className="w-full px-3 py-2 bg-white border border-zinc-200 rounded-xl text-xs font-mono font-bold text-zinc-800"
                      value={manualPrice}
                      onChange={e => setManualPrice(e.target.value)}
                    />
                  </>
                ) : (
                  <>
                    <label className="text-[10px] font-bold text-zinc-400 uppercase">Total Invoice Entry Amount (₹)</label>
                    <input 
                      type="number" 
                      className="w-full px-3 py-2 bg-white border border-zinc-200 rounded-xl text-xs font-mono font-bold text-zinc-800"
                      value={manualTotal}
                      onChange={e => setManualTotal(e.target.value)}
                    />
                  </>
                )}
              </div>
            </div>

            {pricingMode === 'reverse' && (
              <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center bg-white p-3 rounded-xl border border-zinc-200 text-xs text-zinc-650">
                <span className="font-black text-zinc-450 text-[10px]">Tax Calculation:</span>
                <div className="flex gap-4">
                  <label className="flex items-center gap-1.5 font-bold cursor-pointer text-zinc-700">
                    <input 
                      type="radio" 
                      name="pricingFormula" 
                      checked={reverseTaxMethod === 'flat'}
                      onChange={() => setReverseTaxMethod('flat')} 
                      className="accent-emerald-600"
                    />
                    <span>Straight Subtraction (Base Discounted)</span>
                  </label>
                  <label className="flex items-center gap-1.5 font-bold cursor-pointer text-zinc-700">
                    <input 
                      type="radio" 
                      name="pricingFormula" 
                      checked={reverseTaxMethod === 'standard'}
                      onChange={() => setReverseTaxMethod('standard')}
                      className="accent-emerald-600"
                    />
                    <span>Standard Inclusive</span>
                  </label>
                </div>
              </div>
            )}

            {/* Calculations Preview Sheet */}
            <div className="bg-emerald-50/50 p-4 rounded-xl border border-dashed border-emerald-200 grid grid-cols-2 md:grid-cols-4 gap-4 text-xs font-bold font-mono">
              <div>
                <p className="text-[9px] text-zinc-400 uppercase font-sans">Unit Base Rate</p>
                <p className="text-zinc-800 text-sm font-black">₹{getManualItemCalculations().basePrice.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-[9px] text-zinc-400 uppercase font-sans">CGST + SGST</p>
                <p className="text-zinc-800 text-sm font-black">₹{getManualItemCalculations().gstAmountPerUnit.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-[9px] text-zinc-400 uppercase font-sans">Total Base Amount</p>
                <p className="text-zinc-800 text-sm font-black">₹{getManualItemCalculations().totalBase.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-[9px] text-emerald-700 uppercase font-sans">Calculated Final Amount</p>
                <p className="text-emerald-700 text-base font-black">₹{getManualItemCalculations().grandTotal.toFixed(2)}</p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pt-2">
              <label className="flex items-center gap-2 text-xs font-bold text-zinc-600 cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={saveToMaster}
                  onChange={e => setSaveToMaster(e.target.checked)}
                  className="w-4 h-4 rounded border-zinc-300 accent-emerald-600 cursor-pointer"
                />
                <span>💾 Automatically save and register this item into Master Inventory Catalog</span>
              </label>

              <button
                type="button"
                onClick={handleAddManualItem}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-sm transition flex items-center gap-1.5 shrink-0"
              >
                <span>➕</span> Add Item to Voucher List
              </button>
            </div>
          </div>
        )}

        <div className="overflow-x-auto border border-zinc-200 rounded-xl mt-4">
          <table className="w-full text-left text-xs text-zinc-650">
            <thead>
              <tr className="bg-zinc-50 border-b border-zinc-200 font-bold text-zinc-500">
                <th className="py-3 px-4">Item description</th>
                <th className="py-3 px-4 text-center">Qty</th>
                <th className="py-3 px-4 text-right">Unit Rate (Excl.)</th>
                <th className="py-3 px-4 text-right">GST Rate</th>
                <th className="py-3 px-4 text-right px-4">Row Subtotal</th>
                <th className="py-3 px-4 text-center">Remove</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {items.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-zinc-400">
                    No active draft items loaded in purchase voucher list. Use controls above.
                  </td>
                </tr>
              ) : (
                items.map((item, index) => (
                  <tr key={index} className="hover:bg-[#FDFDFD]">
                    <td className="py-3 px-4 font-bold text-zinc-800">{item.name}</td>
                    <td className="py-3 px-4 text-center">
                      <input 
                        type="number" 
                        className="w-14 bg-zinc-50 border border-zinc-200 rounded p-1 text-center font-bold font-mono" 
                        value={item.quantity} 
                        onChange={e => setItems(items.map((it, idx) => idx === index ? {...it, quantity: Number(e.target.value)} : it))} 
                      />
                    </td>
                    <td className="py-3 px-4 text-right font-mono">
                      <input 
                        type="number" 
                        className="w-20 bg-zinc-50 border border-zinc-200 rounded p-1 text-right font-bold font-mono" 
                        value={item.price} 
                        onChange={e => setItems(items.map((it, idx) => idx === index ? {...it, price: Number(e.target.value)} : it))} 
                      />
                    </td>
                    <td className="py-3 px-4 text-right text-zinc-500 font-semibold">{item.gst_rate}%</td>
                    <td className="py-3 px-4 text-right font-bold text-zinc-800 px-4 font-mono">₹{(item.price * item.quantity * (1 + item.gst_rate/100)).toFixed(2)}</td>
                    <td className="py-3 px-4 text-center">
                      <button onClick={() => setItems(items.filter((_, idx) => idx !== index))} className="text-zinc-400 hover:text-rose-500 transition">
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="mt-8 flex flex-col md:flex-row justify-between items-start gap-8 border-t border-zinc-100 pt-6">
          {/* Windows Desktop & Shortcuts Panel */}
          <div className="bg-zinc-50 p-4 rounded-xl border border-zinc-200 space-y-2 max-w-sm w-full">
            <div className="flex items-center gap-1.5 pb-1 border-b border-zinc-200">
              <span className="text-xs">💻</span>
              <p className="text-[10px] font-black uppercase tracking-wider text-zinc-500">Fast Keys Shortcuts</p>
            </div>
            <div className="space-y-1 text-[11px] text-zinc-650 font-medium">
              <div className="flex justify-between">
                <span>Save Voucher:</span>
                <span className="bg-white px-1 rounded shadow-sm border font-mono">F9 / Ctrl + S</span>
              </div>
              <div className="flex justify-between">
                <span>Clear Voucher:</span>
                <span className="bg-white px-1 rounded shadow-sm border font-mono">F8</span>
              </div>
            </div>
          </div>

          <div className="w-80 space-y-3 text-xs font-semibold text-zinc-600">
            <div className="flex justify-between"><span>Voucher Total (Excl. Tax):</span><span className="font-mono text-zinc-850">₹{subTotal.toFixed(2)}</span></div>
            <div className="flex justify-between"><span>Input Tax Duty (CGST+SGST):</span><span className="font-mono text-zinc-850">₹{totalGst.toFixed(2)}</span></div>
            <div className="flex justify-between"><span>Transport Freight Charge:</span><span className="font-mono text-zinc-850">₹{transportCharge.toFixed(2)}</span></div>
            <hr className="border-zinc-200" />
            <div className="flex justify-between items-center pt-1">
              <span className="text-[11px] text-zinc-500 uppercase font-black">Grand Payable Total</span>
              <span className="text-xl font-black text-emerald-700 font-mono">₹{(totalAmount + transportCharge).toFixed(2)}</span>
            </div>
            <button 
              onClick={handleSave} 
              className="w-full py-2.5 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 transition flex items-center justify-center gap-1 shadow-sm mt-4 text-xs cursor-pointer"
            >
              <Save size={14} /> Record & Save Purchase Voucher (F9)
            </button>
          </div>
        </div>
      </div>

      {/* Recent Recorded Purchases History */}
      <div className="bg-white rounded-2xl p-6 border border-zinc-200 shadow-sm">
        <h3 className="text-xs font-bold uppercase tracking-wider mb-4 border-b border-zinc-150 pb-2 text-zinc-500 flex items-center gap-1">
          <FileText size={14} className="text-emerald-600" /> Recent Recorded Purchase Bills history logs
        </h3>
        {purchaseHistory.length === 0 ? (
          <p className="text-xs text-zinc-400 italic py-4">No records found. Save a bill to populate history logs.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-zinc-600 border-collapse">
              <thead>
                <tr className="bg-zinc-50 border-b border-zinc-200 text-zinc-500 font-bold">
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Supplier Bill No</th>
                  <th className="py-3 px-4">Vendor Partner</th>
                  <th className="py-3 px-4">Receipt Mode</th>
                  <th className="py-3 px-4 text-right">Grand Total Paid</th>
                  <th className="py-3 px-4 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {purchaseHistory.map((p) => (
                  <tr key={p.id} className="hover:bg-zinc-50/50 transition">
                    <td className="py-3 px-4 font-semibold">{new Date(p.date).toLocaleDateString()}</td>
                    <td className="py-3 px-4 font-mono font-bold text-zinc-700">{p.bill_no || 'N/A'}</td>
                    <td className="py-3 px-4 font-bold text-zinc-800">{p.vendor_name || 'General Supplier'}</td>
                    <td className="py-3 px-4"><span className="px-2 py-0.5 text-[10px] font-bold rounded bg-sky-50 text-sky-700 border border-sky-100">{p.payment_mode}</span></td>
                    <td className="py-3 px-4 text-right font-black text-rose-600 font-mono">₹{Number(p.total_amount + (p.transport_charge || 0)).toFixed(2)}</td>
                    <td className="py-3 px-4 text-center">
                      <button 
                        type="button"
                        onClick={() => downloadPurchasePDF(p)}
                        className="px-2.5 py-1 text-emerald-700 bg-emerald-50 hover:bg-emerald-100 transition rounded-lg text-[10px] font-bold flex items-center gap-1 mx-auto border border-emerald-100"
                      >
                        <Download size={11} /> Download voucher PDF
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
