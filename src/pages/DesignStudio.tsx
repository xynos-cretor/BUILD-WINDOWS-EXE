import React, { useState } from 'react';
import { 
  Layout, 
  Type, 
  Palette, 
  Move, 
  Maximize, 
  Printer, 
  Save, 
  FileText, 
  Landmark, 
  GripVertical,
  ChevronUp,
  ChevronDown,
  Eye,
  EyeOff,
  Settings2,
  Table as TableIcon,
  Sun,
  Moon,
  Lock,
  Unlock
} from 'lucide-react';
import { 
  DndContext, 
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface Section {
  id: string;
  label: string;
  enabled: boolean;
  minHeight: number;
  padding: number;
}

const DEFAULT_SECTIONS: Section[] = [
  { id: 'header', label: 'Company Header', enabled: true, minHeight: 120, padding: 24 },
  { id: 'customer', label: 'Customer Details', enabled: true, minHeight: 100, padding: 24 },
  { id: 'items', label: 'Products Table', enabled: true, minHeight: 200, padding: 24 },
  { id: 'summary', label: 'Totals & Tax', enabled: true, minHeight: 120, padding: 24 },
  { id: 'footer', label: 'Bank & Terms', enabled: true, minHeight: 150, padding: 24 },
];

function SortableItem({ section, config, onToggle, studioTheme }: { section: Section, config: any, onToggle: any, studioTheme: 'light' | 'dark' }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: section.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : 0,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div 
      ref={setNodeRef} 
      style={style}
      className={`group flex items-center justify-between p-4 rounded-2xl border transition-all duration-300 ${
        studioTheme === 'light' 
          ? `bg-[#F9FAFB] hover:bg-zinc-50 ${section.enabled ? 'border-zinc-200 text-zinc-800' : 'border-zinc-100 text-zinc-400 opacity-60'}` 
          : `bg-zinc-800/50 hover:bg-zinc-800/80 ${section.enabled ? 'border-zinc-700 text-zinc-200' : 'border-zinc-850 text-zinc-650 opacity-60'}`
      }`}
    >
      <div className="flex items-center gap-3">
        <button {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing text-zinc-400 hover:text-zinc-600 p-1">
          <GripVertical size={18} />
        </button>
        <div>
          <p className={`text-sm font-bold ${studioTheme === 'light' ? 'text-zinc-800' : 'text-zinc-200'}`}>{section.label}</p>
          <p className="text-[10px] text-zinc-400 font-medium">Click to configure</p>
        </div>
      </div>
      <button 
        onClick={() => onToggle(section.id)}
        className={`p-2 rounded-xl transition ${section.enabled ? 'bg-sky-100 text-sky-600' : 'bg-zinc-200 text-zinc-400'}`}
      >
        {section.enabled ? <Eye size={16} /> : <EyeOff size={16} />}
      </button>
    </div>
  );
}

export default function DesignStudio({ company }: { company?: any }) {
  const [sections, setSections] = useState<Section[]>(DEFAULT_SECTIONS);
  const [studioTheme, setStudioTheme] = useState<'light' | 'dark'>('light');
  const [scrollLocked, setScrollLocked] = useState(false);
  
  // Custom watermark state stored/retrived from LocalStorage for persistence
  const storageKey = company?.id ? `premium_watermark_${company.id}` : 'premium_watermark_global';
  const initialWatermark = localStorage.getItem(storageKey) || company?.name || 'DAMSON BILLING';
  const [watermarkText, setWatermarkText] = useState(initialWatermark);

  const [config, setConfig] = useState({
    headerColor: '#0284c7', // Sky-600 primary Sky Theme default
    accentColor: '#0ea5e9', // Sky-500
    fontFamily: 'Inter',
    borderStyle: 'solid',
    tableHeaderGray: true,
    showLogos: true,
    fontSize: 'base',
  });

  const [activeSettings, setActiveSettings] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setSections((items) => {
        const oldIndex = items.findIndex((i) => i.id === active.id);
        const newIndex = items.findIndex((i) => i.id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const toggleSection = (id: string) => {
    setSections(prev => prev.map(s => s.id === id ? { ...s, enabled: !s.enabled } : s));
  };

  const updateSectionPadding = (id: string, padding: number) => {
    setSections(prev => prev.map(s => s.id === id ? { ...s, padding: Math.max(0, padding) } : s));
  };

  const renderSectionPreview = (id: string) => {
    const sectionConfig = sections.find(s => s.id === id);
    if (!sectionConfig?.enabled) return null;

    const commonPadding = { paddingTop: `${sectionConfig.padding}px`, paddingBottom: `${sectionConfig.padding}px` };

    switch (id) {
      case 'header':
        return (
          <div key={id} className="border-b-4" style={{ ...commonPadding, borderColor: config.headerColor }}>
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-4xl font-black uppercase tracking-tighter" style={{ color: config.headerColor }}>Damson Computer</h1>
                <p className="text-xs text-zinc-500 mt-2 max-w-[250px]">
                  Tower B, 4th Floor, Global Tech Park, <br />
                  Electronic City, Bangalore - 560100
                </p>
                <div className="mt-4 flex gap-4 text-[10px] font-bold text-zinc-400">
                  <span>GSTIN: 29AAAAA0000A1Z5</span>
                  <span>MOB: +91 98765 43210</span>
                </div>
              </div>
              <div className="text-right">
                <div className="inline-block px-4 py-1 text-white text-xs font-black rounded-lg mb-6" style={{ backgroundColor: config.headerColor }}>
                  TAX INVOICE
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-zinc-400 uppercase">Invoice Number</p>
                  <p className="text-xl font-black font-mono">INV-2026-8801</p>
                </div>
                <div className="mt-4">
                  <p className="text-[10px] font-bold text-zinc-400 uppercase">Date</p>
                  <p className="text-sm font-bold">19 May, 2026</p>
                </div>
              </div>
            </div>
          </div>
        );
      case 'customer':
        return (
          <div key={id} className="grid grid-cols-2 gap-12" style={commonPadding}>
            <div className="space-y-3">
              <div className="inline-block border-b-2 pb-1 text-[10px] font-black uppercase tracking-widest text-zinc-400" style={{ borderColor: config.accentColor }}>
                Bill To
              </div>
              <div>
                <h4 className="text-lg font-black text-zinc-800">Global Vision Corp</h4>
                <p className="text-xs text-zinc-500 leading-relaxed mt-1">
                  15th Avenue, Commercial Hub, <br />
                  Central District, Mumbai 400001
                </p>
                <p className="text-[10px] font-bold text-blue-600 mt-2">GSTIN: 27BBBBB1234B1Z9</p>
              </div>
            </div>
            <div className="flex flex-col items-end">
              <div className="text-right bg-zinc-50 p-6 rounded-2xl border-l-4" style={{ borderColor: config.headerColor }}>
                <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1">Status</p>
                <span className="text-xs font-black text-emerald-600">FULLY PAID</span>
                <div className="mt-4">
                  <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1">Amount Due</p>
                  <h4 className="text-4xl font-black" style={{ color: config.headerColor }}>₹0.00</h4>
                </div>
              </div>
            </div>
          </div>
        );
      case 'items':
        return (
          <div key={id} style={commonPadding}>
            <table className="w-full border-collapse">
              <thead>
                <tr className={config.tableHeaderGray ? 'bg-zinc-50' : ''} style={{ borderBottom: `2px solid ${config.headerColor}` }}>
                  <th className="py-4 px-2 text-left text-[10px] font-black uppercase tracking-widest">Description</th>
                  <th className="py-4 px-2 text-center text-[10px] font-black uppercase tracking-widest">HSN</th>
                  <th className="py-4 px-2 text-center text-[10px] font-black uppercase tracking-widest">Qty</th>
                  <th className="py-4 px-2 text-right text-[10px] font-black uppercase tracking-widest">Rate</th>
                  <th className="py-4 px-2 text-right text-[10px] font-black uppercase tracking-widest">GST</th>
                  <th className="py-4 px-2 text-right text-[10px] font-black uppercase tracking-widest">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {[
                  { name: 'Precision Workstation Z-800', hsn: '8471', qty: 1, price: 185000, gst: 18 },
                  { name: '4K Ultra-Wide Curved Monitor 49"', hsn: '8528', qty: 2, price: 65000, gst: 18 },
                  { name: 'Ergonomic Mechanical Keyboard', hsn: '8471', qty: 1, price: 12500, gst: 18 }
                ].map((item, i) => (
                  <tr key={i}>
                    <td className="py-5 px-2">
                      <p className="font-bold text-sm text-zinc-800">{item.name}</p>
                    </td>
                    <td className="py-5 px-2 text-center text-xs text-zinc-500">{item.hsn}</td>
                    <td className="py-5 px-2 text-center text-sm font-bold">{item.qty}</td>
                    <td className="py-5 px-2 text-right text-sm">₹{item.price.toLocaleString()}</td>
                    <td className="py-5 px-2 text-right text-[10px] text-zinc-500">{item.gst}%</td>
                    <td className="py-5 px-2 text-right font-black text-sm">₹{(item.price * item.qty * (1 + item.gst/100)).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      case 'summary':
        return (
          <div key={id} className="flex justify-end pt-8" style={commonPadding}>
            <div className="w-80 space-y-4">
              <div className="flex justify-between text-zinc-500 text-sm">
                <span className="font-medium">Subtotal</span>
                <span className="font-bold">₹327,500.00</span>
              </div>
              <div className="flex justify-between text-zinc-500 text-sm">
                <span className="font-medium">Taxable Amount</span>
                <span className="font-bold">₹327,500.00</span>
              </div>
              <div className="flex justify-between text-zinc-500 text-sm">
                <span className="font-medium">Total GST (18%)</span>
                <span className="font-bold">₹58,950.00</span>
              </div>
              <div className="flex justify-between text-zinc-500 text-sm">
                <span className="font-medium">Round Off</span>
                <span className="font-bold">₹0.00</span>
              </div>
              <div className="h-px bg-zinc-100 mt-4"></div>
              <div className="flex justify-between items-end pt-4" style={{ color: config.headerColor }}>
                <span className="text-[10px] font-black uppercase tracking-widest">Total Amount</span>
                <span className="text-3xl font-black tracking-tighter">₹386,450.00</span>
              </div>
              <div className="bg-zinc-50 p-2 rounded-lg text-[10px] text-center font-bold text-zinc-400 italic">
                Amount in words: Three Lakh Eighty Six Thousand Four Hundred Fifty Only
              </div>
            </div>
          </div>
        );
      case 'footer':
        return (
          <div key={id} className="grid grid-cols-2 gap-12 border-t pt-12" style={commonPadding}>
            <div className="space-y-6">
              <div className="p-6 bg-zinc-50 rounded-2xl border border-zinc-100">
                <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                  <Landmark size={14} className="text-blue-600" /> Bank Transfers
                </p>
                <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-zinc-500">Bank Name</span>
                    <span className="font-black">HDFC BANK INDIA</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-zinc-500">Account No.</span>
                    <span className="font-black font-mono tracking-wider">50100234567890</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-zinc-500">IFSC Code</span>
                    <span className="font-black">HDFC0001234</span>
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Terms & Conditions</p>
                <ul className="text-[9px] text-zinc-400 leading-relaxed font-medium space-y-1">
                  <li>• Goods once sold will not be returned or exchanged.</li>
                  <li>• Please pay within 7 days from the invoice date.</li>
                  <li>• This is a computer generated invoice and needs no signature.</li>
                </ul>
              </div>
            </div>
            <div className="flex flex-col items-center justify-end pb-4">
              <div className="w-32 h-32 bg-zinc-50 rounded-2xl flex items-center justify-center border-2 border-zinc-100 border-dashed mb-4">
                 <p className="text-[10px] text-zinc-400 font-bold">STAMP / SIGN</p>
              </div>
              <p className="text-sm font-black text-zinc-400 uppercase">Authorized Signatory</p>
              <p className="text-[10px] font-bold text-zinc-300 mt-1">For Damson Computer</p>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className={`max-w-[1600px] mx-auto grid grid-cols-1 xl:grid-cols-4 gap-8 h-[calc(100vh-140px)] overflow-hidden transition-all duration-300 ${studioTheme === 'light' ? 'text-zinc-805' : 'text-zinc-100 bg-zinc-950 p-1.5 rounded-3xl'}`}>
      
      {/* Sidebar Controls */}
      <div className={`rounded-3xl border shadow-sm overflow-hidden flex flex-col h-full transition-all duration-300 ${
        studioTheme === 'light' 
          ? 'bg-white border-zinc-200 text-zinc-800' 
          : 'bg-zinc-900 border-zinc-800 text-zinc-200'
      }`}>
        <div className={`p-6 border-b transition-colors ${studioTheme === 'light' ? 'border-zinc-100' : 'border-zinc-800'}`}>
          <h3 className="text-xl font-black flex items-center gap-2">
            <Settings2 size={24} className="text-sky-600 animate-pulse" /> Design Studio
          </h3>
          <p className="text-xs text-zinc-450 mt-1 font-medium">Advanced drag-and-drop layout builder</p>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
          
          <div className="space-y-4">
            <h4 className="text-[10px] font-black text-zinc-400 uppercase tracking-widest flex items-center gap-2">
              <Palette size={14} /> Global Styling
            </h4>
            
            <div className={`space-y-6 p-5 rounded-2xl transition-all duration-300 ${
              studioTheme === 'light' ? 'bg-[#F9FAFB] border border-zinc-150' : 'bg-zinc-800/20'
            }`}>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-zinc-405 uppercase tracking-wider block">Header Color</label>
                <div className="flex gap-2.5">
                  {['#0284c7', '#0ea5e9', '#06b6d4', '#10b981', '#f59e0b', '#000000'].map(c => (
                    <button 
                      key={c} 
                      type="button"
                      className={`w-9 h-9 rounded-full border-4 transition-all ${config.headerColor === c ? 'border-zinc-300 scale-110 shadow-lg ring-2 ring-sky-400' : 'border-transparent hover:scale-105'}`} 
                      style={{ backgroundColor: c }}
                      onClick={() => setConfig({...config, headerColor: c})}
                    />
                  ))}
                  <input type="color" className="w-9 h-9 rounded-full overflow-hidden p-0 border-none cursor-pointer" onChange={e => setConfig({...config, headerColor: e.target.value})} />
                </div>
              </div>

              {/* Watermark customized text option */}
              <div className="space-y-2">
                <label className="text-[10px] font-black text-zinc-405 uppercase tracking-wider block">PDF Watermark Text</label>
                <input 
                  type="text" 
                  className={`w-full p-3 border rounded-xl text-sm font-bold focus:ring-2 focus:ring-sky-500 outline-none transition-all duration-300 ${
                    studioTheme === 'light' 
                      ? 'bg-white border-zinc-200 text-zinc-800' 
                      : 'bg-zinc-800 border-zinc-700 text-white'
                  }`}
                  value={watermarkText}
                  onChange={e => {
                    const val = e.target.value;
                    setWatermarkText(val);
                    localStorage.setItem(storageKey, val);
                  }}
                  placeholder="e.g. COMPANY NAME"
                />
                <p className="text-[9px] text-zinc-400 mt-1 font-medium">Default is the company's name. Enter custom value to manually override.</p>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-zinc-405 uppercase tracking-wider block">Typography</label>
                <select 
                  className={`w-full p-3 border rounded-xl text-sm font-bold transition-all duration-300 ${
                    studioTheme === 'light' 
                      ? 'bg-white border-zinc-200 text-zinc-800' 
                      : 'bg-zinc-800 border-zinc-700 text-white'
                  }`}
                  value={config.fontFamily}
                  onChange={e => setConfig({...config, fontFamily: e.target.value})}
                >
                  <option value="Inter">Classic Inter</option>
                  <option value="Space Grotesk">Space Grotesk (Modern)</option>
                  <option value="Outfit">Outfit (Round)</option>
                  <option value="Mono">JetBrains Mono (Tech)</option>
                </select>
              </div>

              <div className="flex items-center justify-between">
                <span className={`text-xs font-bold ${studioTheme === 'light' ? 'text-zinc-600' : 'text-zinc-300'}`}>Gray Headers</span>
                <button 
                  type="button"
                  onClick={() => setConfig({...config, tableHeaderGray: !config.tableHeaderGray})}
                  className={`w-10 h-5 rounded-full relative transition-all duration-300 ${config.tableHeaderGray ? 'bg-sky-500' : 'bg-zinc-300'}`}
                >
                  <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-all ${config.tableHeaderGray ? 'left-5.5' : 'left-0.5'}`}></div>
                </button>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="text-[10px] font-black text-zinc-400 uppercase tracking-widest flex items-center gap-2">
              <Layout size={14} /> Layout Structure
            </h4>
            
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <SortableContext items={sections.map(s => s.id)} strategy={verticalListSortingStrategy}>
                <div className="space-y-3">
                  {sections.map((section) => (
                    <div key={section.id} className="space-y-2">
                      <SortableItem section={section} config={config} onToggle={toggleSection} studioTheme={studioTheme} />
                      {section.enabled && (
                        <div className="px-4 pb-4 animate-in fade-in slide-in-from-top-2">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-[10px] font-black text-zinc-400 uppercase">Vertical Padding</span>
                            <span className="text-xs font-bold text-sky-600">{section.padding}px</span>
                          </div>
                          <input 
                            type="range" 
                            min="0" max="100" 
                            className={`w-full h-1 rounded-lg appearance-none cursor-pointer accent-sky-500 ${
                              studioTheme === 'light' ? 'bg-zinc-200' : 'bg-zinc-800'
                            }`}
                            value={section.padding}
                            onChange={(e) => updateSectionPadding(section.id, parseInt(e.target.value))}
                          />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          </div>
        </div>

        <div className={`p-6 border-t transition-all duration-300 ${
          studioTheme === 'light' ? 'bg-[#F9FAFB] border-zinc-150' : 'bg-zinc-900 border-zinc-800'
        }`}>
          <button 
            type="button"
            onClick={() => alert("Billing Invoice template & PDF Watermark saved successfully!")}
            className="w-full py-4 bg-sky-500 hover:bg-sky-600 text-white rounded-2xl font-black flex items-center justify-center gap-3 shadow-xl shadow-sky-500/10 hover:scale-[1.02] transition active:scale-95"
          >
            <Save size={20} /> PUBLISH TEMPLATE
          </button>
        </div>
      </div>

      {/* Main Preview Area */}
      <div className="xl:col-span-3 flex flex-col h-full space-y-4">
        <div className={`flex flex-col sm:flex-row sm:items-center justify-between px-6 py-4 rounded-2xl border shadow-sm transition-all duration-300 gap-4 ${
          studioTheme === 'light' ? 'bg-white border-zinc-200' : 'bg-zinc-900 border-zinc-800 text-white'
        }`}>
          <div className="flex items-center gap-4 flex-wrap">
            <div className={`flex p-1 rounded-xl transition-colors duration-300 ${studioTheme === 'light' ? 'bg-zinc-100' : 'bg-zinc-800'}`}>
              <button type="button" className={`px-4 py-2 shadow-sm rounded-lg text-xs font-bold ${studioTheme === 'light' ? 'bg-white text-zinc-800' : 'bg-zinc-700 text-white'}`}>Paper Preview</button>
              <button type="button" className="px-4 py-2 text-zinc-500 text-xs font-bold">Live Editor</button>
            </div>
            <div className="h-4 w-px bg-zinc-250 hidden sm:block"></div>
            <span className="text-xs font-bold text-zinc-400">Page: A4 (Portrait) • Scale: 100%</span>
          </div>
          
          <div className="flex items-center gap-3.5 flex-wrap">
            {/* Scroll Lock State Controller Button */}
            <button 
              type="button"
              onClick={() => setScrollLocked(!scrollLocked)}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl text-[11px] font-black uppercase tracking-wider transition-all duration-300 hover:scale-[1.02] focus:scale-95 border ${
                scrollLocked 
                  ? 'bg-rose-500 text-white border-rose-600 shadow-md shadow-rose-500/15' 
                  : studioTheme === 'light' 
                  ? 'bg-zinc-105 hover:bg-zinc-200 text-zinc-705 border-zinc-150' 
                  : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-205 border-zinc-700'
              }`}
              title={scrollLocked ? "Unlock Scrolling of the document" : "Lock Scrolling of the document"}
            >
              {scrollLocked ? <Lock size={14} className="animate-bounce" /> : <Unlock size={14} />}
              <span>{scrollLocked ? 'SCROLL LOCKED' : 'SCROLL LOCK'}</span>
            </button>

            {/* Studio Interface Theme Controls */}
            <div className={`flex items-center border p-1 rounded-xl transition-all duration-300 ${
              studioTheme === 'light' ? 'bg-zinc-100 border-zinc-200' : 'bg-zinc-800 border-zinc-700'
            }`}>
              <button 
                type="button"
                onClick={() => setStudioTheme('light')}
                className={`p-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
                  studioTheme === 'light' 
                    ? 'bg-white text-sky-600 shadow-sm' 
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <Sun size={13} />
                <span className="hidden md:inline">Light UI</span>
              </button>
              <button 
                type="button"
                onClick={() => setStudioTheme('dark')}
                className={`p-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
                  studioTheme === 'dark' 
                    ? 'bg-zinc-700 text-amber-300 shadow-sm' 
                    : 'text-zinc-550 hover:text-zinc-750'
                }`}
              >
                <Moon size={13} />
                <span className="hidden md:inline">Dark UI</span>
              </button>
            </div>

            <div className="h-4 w-px bg-zinc-250 hidden md:block"></div>
            <button type="button" className="p-2 text-zinc-550 hover:bg-zinc-100 rounded-lg transition-colors"><Printer size={18} /></button>
            <button type="button" className="p-2 text-zinc-550 hover:bg-zinc-100 rounded-lg transition-colors"><Maximize size={18} /></button>
          </div>
        </div>

        {/* Live A4 Sheet Render Area with functional scroll-lock toggle */}
        <div className={`flex-1 p-12 custom-scrollbar flex items-start justify-center rounded-3xl transition-all duration-300 ${
          scrollLocked ? 'overflow-hidden pointer-events-none opacity-90' : 'overflow-y-auto pointer-events-auto'
        } ${
          studioTheme === 'light' ? 'bg-[#F2F4F7]' : 'bg-zinc-950/80 ring-1 ring-zinc-850'
        }`}>
          <div 
            className={`bg-white text-zinc-900 w-[793.7px] min-h-[1122.5px] p-12 transition-all duration-300 ${
              studioTheme === 'light' ? 'shadow-xl border border-zinc-200/50' : 'shadow-2xl ring-1 ring-zinc-800'
            }`} 
            style={{ fontFamily: config.fontFamily }}
          >
            {sections.map(section => renderSectionPreview(section.id))}
          </div>
        </div>
      </div>
    </div>
  );
}
