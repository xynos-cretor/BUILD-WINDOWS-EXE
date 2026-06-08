import React, { useState, useEffect } from 'react';
import { Files, Upload, Search, Download, Trash2, FileText, Image as ImageIcon } from 'lucide-react';
import { erpApi } from '../lib/erpApi';

export default function Importer({ companyId }: { companyId: number }) {
  const [imports, setImports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showUpload, setShowUpload] = useState(false);
  const [title, setTitle] = useState('');
  const [file, setFile] = useState<File | null>(null);

  useEffect(() => {
    if (companyId) load();
  }, [companyId]);

  const load = async () => {
    const data = await erpApi.getImports(companyId);
    setImports(data);
    setLoading(false);
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;
    
    const formData = new FormData();
    formData.append('file', file);
    formData.append('company_id', companyId.toString());
    formData.append('title', title);

    await erpApi.importFile(formData);
    setShowUpload(false);
    setTitle('');
    setFile(null);
    load();
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Old Bill Import</h2>
          <p className="text-zinc-500">Archive and search your legacy paper bills or external invoices</p>
        </div>
        <button 
          onClick={() => setShowUpload(true)}
          className="flex items-center gap-2 px-6 py-3 bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 rounded-2xl font-bold hover:scale-105 transition active:scale-95 shadow-xl"
        >
          <Upload size={20} /> Upload New Record
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {imports.map(item => (
          <div key={item.id} className="bg-white dark:bg-zinc-900 rounded-3xl p-6 border border-zinc-100 dark:border-zinc-800 shadow-sm group hover:shadow-xl transition-all">
            <div className="aspect-square bg-zinc-50 dark:bg-zinc-800 rounded-2xl mb-4 flex items-center justify-center relative overflow-hidden">
              {item.file_type.includes('image') ? <ImageIcon size={48} className="text-zinc-300" /> : <FileText size={48} className="text-zinc-300" />}
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-2">
                <button className="p-3 bg-white rounded-full text-zinc-900 hover:scale-110 transition"><Search size={20} /></button>
                <button className="p-3 bg-white rounded-full text-zinc-900 hover:scale-110 transition"><Download size={20} /></button>
              </div>
            </div>
            <h4 className="font-bold text-sm truncate mb-1">{item.title}</h4>
            <div className="flex justify-between items-center text-[10px] text-zinc-400 font-bold uppercase tracking-widest">
              <span>{new Date(item.date).toLocaleDateString()}</span>
              <span>{item.file_type.split('/')[1]}</span>
            </div>
          </div>
        ))}
      </div>

      {showUpload && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <form onSubmit={handleUpload} className="bg-white dark:bg-zinc-900 w-full max-w-md rounded-3xl p-8 space-y-6 shadow-2xl">
            <h3 className="text-xl font-bold">Import Document</h3>
            <div className="space-y-2">
              <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest ml-1">Document Title</label>
              <input 
                required
                className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-800 rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g. June 2025 Purchase Ledger"
                value={title}
                onChange={e => setTitle(e.target.value)}
              />
            </div>
            <div className="border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-2xl p-8 flex flex-col items-center justify-center gap-3 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition cursor-pointer relative">
              <input 
                type="file" 
                className="absolute inset-0 opacity-0 cursor-pointer"
                onChange={e => setFile(e.target.files?.[0] || null)}
              />
              <div className="w-12 h-12 bg-zinc-100 dark:bg-zinc-700 rounded-full flex items-center justify-center text-zinc-400">
                <Upload size={24} />
              </div>
              <p className="text-sm font-bold text-zinc-500">{file ? file.name : 'Select file or drag here'}</p>
              <p className="text-[10px] text-zinc-400 uppercase font-bold">PDF, JPG, PNG, XLSX (Max 10MB)</p>
            </div>
            <div className="flex gap-4 pt-4">
              <button type="button" onClick={() => setShowUpload(false)} className="flex-1 py-3 bg-zinc-100 dark:bg-zinc-800 rounded-xl font-bold">Cancel</button>
              <button type="submit" className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-bold">Start Import</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
