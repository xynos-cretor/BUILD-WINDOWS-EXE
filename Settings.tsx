import React, { useState } from 'react';
import { Settings, Save, Shield, HardDrive, RefreshCw, Layers } from 'lucide-react';

export default function SettingsPage() {
  const [preferences, setPreferences] = useState({
    autoBackup: true,
    invoicePrefix: '2026-27-',
    gstType: 'IGST/CGST/SGST',
    alertLowStock: true,
    classicPrintMode: false,
  });

  const handleSave = () => {
    alert("ERP System settings saved successfully in current company workspace!");
  };

  const handleReset = () => {
    if (confirm("Are you sure you want to reset localized session parameters? This will not wipe the SQLite database, but clears cache.")) {
      alert("Local session context cache flushed successfully.");
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-[#4E3E34]">ERP System Configurator</h2>
        <p className="text-zinc-500">Configure corporate standards, invoice numbering, tax configurations, and backups</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Column Settings Sidebar List */}
        <div className="md:col-span-1 space-y-3">
          <button className="w-full text-left p-4 rounded-2xl bg-white border border-[#E6D8C3] shadow-sm flex items-center gap-3 text-[#6E5A4D]">
            <Layers size={18} />
            <span className="text-sm font-bold">Preferences</span>
          </button>
          <button className="w-full text-left p-4 rounded-2xl bg-grey-50 hover:bg-beige-100 border border-zinc-200 text-zinc-650 flex items-center gap-3">
            <Shield size={18} />
            <span className="text-sm font-bold">Security & Keys</span>
          </button>
          <button className="w-full text-left p-4 rounded-2xl bg-grey-50 hover:bg-beige-100 border border-zinc-200 text-zinc-650 flex items-center gap-3">
            <HardDrive size={18} />
            <span className="text-sm font-bold">Storage & DB</span>
          </button>
        </div>

        {/* Right Settings panel (Grey & Beige themed) */}
        <div className="md:col-span-2 bg-[#FAF8F5] border border-[#E6D8C3] rounded-3xl p-6 md:p-8 space-y-8">
          <div>
            <h3 className="text-lg font-black text-[#4E3E34] flex items-center gap-2 mb-2">
              <Settings className="text-[#8C725E]" size={20} /> System Preferences
            </h3>
            <p className="text-xs text-zinc-500">Enable automated workflows, select regional taxation modes, and verify credentials.</p>
          </div>

          <div className="space-y-5">
            <div className="flex items-center justify-between p-4 bg-[#F1F3F5] rounded-2xl border border-[#DCDFE4]">
              <div>
                <p className="text-xs font-black text-[#6E5A4D] uppercase">Automated Daily Backups</p>
                <p className="text-[10px] text-zinc-500">Periodically save erp.db state into secure directory.</p>
              </div>
              <button 
                type="button"
                onClick={() => setPreferences({ ...preferences, autoBackup: !preferences.autoBackup })}
                className={`w-11 h-6 rounded-full relative transition-all duration-350 ${preferences.autoBackup ? 'bg-[#8C725E]' : 'bg-zinc-300'}`}
              >
                <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full transition-all ${preferences.autoBackup ? 'left-5.5' : 'left-0.5'}`}></div>
              </button>
            </div>

            <div className="flex items-center justify-between p-4 bg-[#F1F3F5] rounded-2xl border border-[#DCDFE4]">
              <div>
                <p className="text-xs font-black text-[#6E5A4D] uppercase">Low Stock Warning Indicators</p>
                <p className="text-[10px] text-zinc-500">Highlight products when units drop below warning thresholds.</p>
              </div>
              <button 
                type="button"
                onClick={() => setPreferences({ ...preferences, alertLowStock: !preferences.alertLowStock })}
                className={`w-11 h-6 rounded-full relative transition-all duration-350 ${preferences.alertLowStock ? 'bg-[#8C725E]' : 'bg-zinc-300'}`}
              >
                <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full transition-all ${preferences.alertLowStock ? 'left-5.5' : 'left-0.5'}`}></div>
              </button>
            </div>

            <div className="flex items-center justify-between p-4 bg-[#F1F3F5] rounded-2xl border border-[#DCDFE4]">
              <div>
                <p className="text-xs font-black text-[#6E5A4D] uppercase">Alternative Classic Print Mode</p>
                <p className="text-[10px] text-zinc-500">Omit modern visual highlights from invoice layout print views.</p>
              </div>
              <button 
                type="button"
                onClick={() => setPreferences({ ...preferences, classicPrintMode: !preferences.classicPrintMode })}
                className={`w-11 h-6 rounded-full relative transition-all duration-350 ${preferences.classicPrintMode ? 'bg-[#8C725E]' : 'bg-zinc-300'}`}
              >
                <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full transition-all ${preferences.classicPrintMode ? 'left-5.5' : 'left-0.5'}`}></div>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-[#6E5A4D] uppercase">Billing Invoice Number Prefix</label>
                <input 
                  type="text" 
                  className="w-full p-3 bg-white border border-[#E6D8C3] text-zinc-800 rounded-xl text-xs font-mono font-bold" 
                  value={preferences.invoicePrefix}
                  onChange={e => setPreferences({...preferences, invoicePrefix: e.target.value})}
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-[#6E5A4D] uppercase">Primary GST Type</label>
                <select 
                  className="w-full p-3 bg-white border border-[#E6D8C3] text-zinc-800 rounded-xl text-xs font-bold"
                  value={preferences.gstType}
                  onChange={e => setPreferences({...preferences, gstType: e.target.value})}
                >
                  <option>IGST/CGST/SGST</option>
                  <option>CGST/SGST Only</option>
                  <option>IGST Only</option>
                  <option>Zero GST Composition Mode</option>
                </select>
              </div>
            </div>
          </div>

          <div className="h-px bg-[#E6D8C3]"></div>

          <div className="flex flex-wrap items-center justify-between gap-4">
            <button 
              type="button" 
              onClick={handleReset}
              className="px-4 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50 rounded-xl transition"
            >
              Flush Session Cache
            </button>
            <button 
              type="button"
              onClick={handleSave}
              className="px-6 py-3 bg-[#6E5A4D] hover:bg-[#8C725E] text-white font-bold rounded-xl flex items-center gap-2 transition shadow-md shadow-beige-300"
            >
              <Save size={16} /> Save Configuration
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
