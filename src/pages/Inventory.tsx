import React, { useState, useEffect } from 'react';
import { Package, Plus, Search, Filter, AlertTriangle, ArrowUpRight, ArrowDownRight, Edit3 } from 'lucide-react';
import { erpApi } from '../lib/erpApi';

export default function Inventory({ companyId }: { companyId: number }) {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [search, setSearch] = useState('');
  const [editingProduct, setEditingProduct] = useState<any | null>(null);
  const [sellingPriceInput, setSellingPriceInput] = useState<string>('');
  const [totalSellingPriceInput, setTotalSellingPriceInput] = useState<string>('');
  
  const [newProduct, setNewProduct] = useState({
    name: '', category: 'Laptops', hsn_code: '', purchase_price: 0, selling_price: 0, gst_rate: 18, stock: 0, min_stock: 5
  });

  useEffect(() => {
    if (companyId) loadProducts();
  }, [companyId]);

  const loadProducts = async () => {
    const data = await erpApi.getProducts(companyId);
    setProducts(data);
    setLoading(false);
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingProduct) {
      await erpApi.updateProduct(editingProduct.id, { 
        ...newProduct, 
        stock: newProduct.category === 'Service' ? 0 : newProduct.stock,
        min_stock: newProduct.category === 'Service' ? 0 : newProduct.min_stock,
        company_id: companyId 
      });
    } else {
      await erpApi.createProduct({ 
        ...newProduct, 
        stock: newProduct.category === 'Service' ? 0 : newProduct.stock,
        min_stock: newProduct.category === 'Service' ? 0 : newProduct.min_stock,
        company_id: companyId 
      });
    }
    setShowAdd(false);
    setEditingProduct(null);
    setNewProduct({
      name: '', category: 'Laptops', hsn_code: '', purchase_price: 0, selling_price: 0, gst_rate: 18, stock: 0, min_stock: 5
    });
    setSellingPriceInput('');
    setTotalSellingPriceInput('');
    loadProducts();
  };

  const handleEditClick = (product: any) => {
    setEditingProduct(product);
    const sp = product.selling_price || 0;
    const rate = product.gst_rate || 18;
    const gstAmt = (sp * rate) / 100;
    const total = sp + gstAmt;

    setNewProduct({
      name: product.name,
      category: product.category || 'Laptops',
      hsn_code: product.hsn_code || '',
      purchase_price: product.purchase_price || 0,
      selling_price: sp,
      gst_rate: rate,
      stock: product.stock || 0,
      min_stock: product.min_stock || 5
    });
    setSellingPriceInput(sp === 0 ? '' : sp.toString());
    setTotalSellingPriceInput(total === 0 ? '' : Number(total.toFixed(2)).toString());
    setShowAdd(true);
  };

  const filtered = products.filter(p => p.name.toLowerCase().includes(search.toLowerCase()));

  const calculatedGstAmount = Number(((Number(sellingPriceInput) || 0) * (newProduct.gst_rate || 0) / 100).toFixed(2));
  const calculatedTotalSellingPrice = Number(((Number(sellingPriceInput) || 0) + calculatedGstAmount).toFixed(2));

  const updateSellingPriceExcl = (valStr: string, currentGstRate: number = newProduct.gst_rate) => {
    setSellingPriceInput(valStr);
    const amountVal = Number(valStr) || 0;
    const finalGst = currentGstRate || 0;
    const calculatedGst = (amountVal * finalGst) / 100;
    const calculatedTotal = amountVal + calculatedGst;
    
    setTotalSellingPriceInput(valStr === '' ? '' : Number(calculatedTotal.toFixed(2)).toString());
    setNewProduct(prev => ({ ...prev, selling_price: Number(amountVal.toFixed(2)) || 0 }));
  };

  const updateSellingPriceIncl = (valStr: string, currentGstRate: number = newProduct.gst_rate) => {
    setTotalSellingPriceInput(valStr);
    const totalVal = Number(valStr) || 0;
    const finalGst = currentGstRate || 0;
    
    // Backward calculation: excl = total / (1 + gst_rate/100)
    const calculatedExcl = totalVal / (1 + finalGst / 100);
    setSellingPriceInput(valStr === '' ? '' : Number(calculatedExcl.toFixed(2)).toString());
    setNewProduct(prev => ({ ...prev, selling_price: Number(calculatedExcl.toFixed(2)) || 0 }));
  };

  const handleGstRateChange = (newRate: number) => {
    setNewProduct(prev => ({ ...prev, gst_rate: newRate }));
    // Keep Excl price constant, recalculate Incl price
    const exclVal = Number(sellingPriceInput) || 0;
    if (exclVal > 0) {
      const calculatedGst = (exclVal * newRate) / 100;
      const calculatedTotal = exclVal + calculatedGst;
      setTotalSellingPriceInput(Number(calculatedTotal.toFixed(2)).toString());
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-[#4E3E34]">Stock Management</h2>
          <p className="text-zinc-500">Track stock levels, prices, and categories</p>
        </div>
        <button 
          onClick={() => {
            setEditingProduct(null);
            setNewProduct({
              name: '', category: 'Laptops', hsn_code: '', purchase_price: 0, selling_price: 0, gst_rate: 18, stock: 0, min_stock: 5
            });
            setShowAdd(true);
          }}
          className="flex items-center gap-2 px-5 py-2.5 bg-[#6E5A4D] hover:bg-[#8C725E] text-white rounded-xl transition font-bold shadow-sm shadow-[#E6D8C3]"
        >
          <Plus size={20} /> Add New Product
        </button>
      </div>

      <div className="bg-[#FAF8F5] rounded-3xl p-8 border border-[#E6D8C3] shadow-sm">
        <div className="flex gap-4 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
            <input 
              type="text" 
              placeholder="Search products by name, category or SKU..." 
              className="w-full pl-12 pr-4 py-3 bg-white border border-[#E6D8C3] text-zinc-800 rounded-xl outline-none focus:ring-1 focus:ring-[#8C725E]"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <button className="px-4 py-3 bg-grey-100 border border-grey-300 rounded-xl text-zinc-650 hover:bg-beige-100 transition flex items-center gap-2">
            <Filter size={18} /> Filter
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-[#E6D8C3]">
                <th className="py-4 text-xs font-bold text-[#6E5A4D] uppercase tracking-widest px-2">Product Name</th>
                <th className="py-4 text-xs font-bold text-[#6E5A4D] uppercase tracking-widest">Category</th>
                <th className="py-4 text-xs font-bold text-[#6E5A4D] uppercase tracking-widest text-right">Purchase Price</th>
                <th className="py-4 text-xs font-bold text-[#6E5A4D] uppercase tracking-widest text-right">Selling Price</th>
                <th className="py-4 text-xs font-bold text-[#6E5A4D] uppercase tracking-widest text-center">Stock</th>
                <th className="py-4 text-xs font-bold text-[#6E5A4D] uppercase tracking-widest text-center px-2">Status</th>
                <th className="py-4 text-xs font-bold text-[#6E5A4D] uppercase tracking-widest text-right px-2">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-50 dark:divide-zinc-800">
              {filtered.map(p => {
                const isLowStock = p.stock <= p.min_stock;
                return (
                  <tr key={p.id} className={`group border-b border-zinc-100/50 dark:border-zinc-800/50 transition duration-150 ${isLowStock ? 'bg-red-50/40 dark:bg-red-950/15 hover:bg-red-50/80 dark:hover:bg-red-950/25 border-l-4 border-l-red-500' : 'hover:bg-zinc-50 dark:hover:bg-zinc-800/30'}`}>
                    <td className="py-5 px-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center transition-colors ${isLowStock ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500 group-hover:bg-emerald-100 group-hover:text-emerald-600 text-zinc-500'}`}>
                          <Package size={20} />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-bold text-sm text-zinc-900 dark:text-zinc-100">{p.name}</p>
                            {isLowStock && (
                              <span className="inline-flex items-center gap-1 bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300 text-[10px] px-1.5 py-0.5 rounded-md font-extrabold uppercase animate-pulse">Low</span>
                            )}
                          </div>
                          <p className="text-[10px] text-zinc-400 dark:text-zinc-500 font-mono">HSN: {p.hsn_code || 'N/A'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-5 text-sm text-zinc-500 dark:text-zinc-400 font-medium">{p.category}</td>
                    <td className="py-5 text-right font-mono text-sm text-zinc-600 dark:text-zinc-400">₹{p.purchase_price}</td>
                    <td className="py-5 text-right font-bold text-sm text-zinc-900 dark:text-zinc-100">₹{p.selling_price}</td>
                    <td className="py-5 text-center">
                      <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${isLowStock ? 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300' : 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300'}`}>
                        {p.stock} Units
                      </span>
                    </td>
                    <td className="py-5 text-center px-2">
                      {isLowStock ? (
                        <div className="flex items-center justify-center gap-1 text-red-600 dark:text-red-400">
                          <AlertTriangle size={14} /> <span className="text-[10px] font-bold uppercase tracking-wider">Low Stock ({p.min_stock} limit)</span>
                        </div>
                      ) : (
                        <div className="flex items-center justify-center gap-1 text-emerald-600 dark:text-emerald-400">
                          <span className="text-[10px] font-bold uppercase tracking-wider">Healthy</span>
                        </div>
                      )}
                    </td>
                    <td className="py-5 text-right px-4">
                      <button 
                        onClick={() => handleEditClick(p)} 
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-zinc-100 hover:bg-emerald-50 hover:text-emerald-600 dark:bg-zinc-800 dark:hover:bg-zinc-700 rounded-xl text-xs font-bold transition text-zinc-600 dark:text-zinc-300"
                      >
                        <Edit3 size={13} /> Edit Item
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {showAdd && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-[100] flex items-center justify-center p-4">
          <div className="bg-[#FAF8F5] border border-[#E6D8C3] w-full max-w-xl rounded-3xl p-8 shadow-2xl">
            <h2 className="text-2xl font-bold mb-2 text-[#4E3E34]">{editingProduct ? 'Edit Inventory Item' : 'Add New Inventory Item'}</h2>
            <p className="text-zinc-500 text-sm mb-6">
              {editingProduct ? 'Modify the product pricing, details, and current stock count below.' : 'Create a new product with stock, code and categories.'}
            </p>
            <form onSubmit={handleAdd} className="grid grid-cols-2 gap-4">
              <div className="col-span-2 space-y-2">
                <label className="text-sm font-bold text-[#6E5A4D]">Product Name</label>
                <input required className="w-full px-4 py-3 bg-white text-zinc-805 rounded-xl border border-[#E6D8C3] outline-none focus:border-[#8C725E]" value={newProduct.name} onChange={e => setNewProduct({...newProduct, name: e.target.value})} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-[#6E5A4D]">Category</label>
                <select className="w-full px-4 py-3 bg-white text-zinc-805 rounded-xl border border-[#E6D8C3] outline-none focus:border-[#8C725E]" value={newProduct.category} onChange={e => setNewProduct({...newProduct, category: e.target.value})}>
                  <option>Laptops</option>
                  <option>Cameras</option>
                  <option>Lenses</option>
                  <option>Accessories</option>
                  <option>Printers</option>
                  <option>Monitors</option>
                  <option>Service</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-[#6E5A4D]">HSN Code</label>
                <input className="w-full px-4 py-3 bg-white text-zinc-850 rounded-xl border border-[#E6D8C3] outline-none" value={newProduct.hsn_code} onChange={e => setNewProduct({...newProduct, hsn_code: e.target.value})} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-[#6E5A4D]">Purchase Price (₹)</label>
                <input type="number" step="any" min="0" className="w-full px-4 py-3 bg-white text-zinc-850 rounded-xl border border-[#E6D8C3] outline-none" value={newProduct.purchase_price} onChange={e => setNewProduct({...newProduct, purchase_price: Number(e.target.value)})} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-[#6E5A4D]">GST (CGST+SGST) (%)</label>
                <select 
                  className="w-full px-4 py-3 bg-white text-zinc-805 rounded-xl border border-[#E6D8C3] outline-none focus:border-[#8C725E]" 
                  value={newProduct.gst_rate} 
                  onChange={e => handleGstRateChange(Number(e.target.value))}
                >
                  <option value={0}>0%</option>
                  <option value={5}>5%</option>
                  <option value={12}>12%</option>
                  <option value={18}>18%</option>
                  <option value={20}>20%</option>
                  <option value={22}>22%</option>
                  <option value={25}>25%</option>
                </select>
              </div>
              <div className="col-span-2 space-y-2">
                <label className="text-sm font-bold text-[#6E5A4D]">Selling Price (Excl. GST) (₹)</label>
                <input 
                  type="number" 
                  step="any" 
                  min="0" 
                  className="w-full px-4 py-3 bg-white rounded-xl border border-[#E6D8C3] outline-none font-bold text-[#6E5A4D] focus:border-[#8C725E]" 
                  value={sellingPriceInput} 
                  onChange={e => updateSellingPriceExcl(e.target.value)} 
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-[#6E5A4D]">GST Amount (Auto) (₹)</label>
                <input type="number" readOnly className="w-full px-4 py-3 bg-amber-50/50 text-[#8C725E] rounded-xl border border-[#E6D8C3] outline-none font-semibold cursor-not-allowed" value={calculatedGstAmount} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-[#6E5A4D]">Total Selling Price (Incl. GST) (₹)</label>
                <input 
                  type="number" 
                  step="any" 
                  min="0" 
                  className="w-full px-4 py-3 bg-white text-zinc-800 rounded-xl border border-[#E6D8C3] outline-none font-bold focus:border-[#8C725E]" 
                  value={totalSellingPriceInput} 
                  onChange={e => updateSellingPriceIncl(e.target.value)} 
                />
              </div>
              {newProduct.category !== 'Service' && (
                <>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-[#6E5A4D]">{editingProduct ? 'Current Stock' : 'Opening Stock'}</label>
                    <input type="number" min="0" className="w-full px-4 py-3 bg-white rounded-xl border border-[#E6D8C3] outline-none" value={newProduct.stock} onChange={e => setNewProduct({...newProduct, stock: Number(e.target.value)})} />
                  </div>
                  <div className="col-span-1 space-y-2">
                    <label className="text-sm font-bold text-[#6E5A4D]">Min Stock Warning Limit</label>
                    <input type="number" min="0" className="w-full px-4 py-3 bg-white rounded-xl border border-[#E6D8C3] outline-none" value={newProduct.min_stock} onChange={e => setNewProduct({...newProduct, min_stock: Number(e.target.value)})} />
                  </div>
                </>
              )}
              <div className="col-span-2 flex gap-4 mt-8">
                <button 
                  type="button" 
                  onClick={() => {
                    setShowAdd(false);
                    setEditingProduct(null);
                    setNewProduct({
                      name: '', category: 'Laptops', hsn_code: '', purchase_price: 0, selling_price: 0, gst_rate: 18, stock: 0, min_stock: 5
                    });
                    setSellingPriceInput('');
                    setTotalSellingPriceInput('');
                  }} 
                  className="flex-1 py-3 bg-zinc-100 border border-zinc-250 font-bold rounded-xl text-zinc-700"
                >
                  Cancel
                </button>
                <button type="submit" className="flex-1 py-3 bg-[#6E5A4D] text-white font-bold rounded-xl">{editingProduct ? 'Update Product' : 'Save Product'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
