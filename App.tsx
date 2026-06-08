import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  Receipt, 
  ShoppingCart, 
  History, 
  Users, 
  Package, 
  TrendingUp, 
  Building2, 
  Settings, 
  Truck, 
  Download, 
  Wallet,
  Menu,
  ChevronLeft,
  ChevronRight,
  Plus,
  Search,
  Bell,
  LogOut,
  Files,
  Landmark,
  Hotel,
  Wrench,
  Sparkles
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { erpApi } from './lib/erpApi';

// Pages
import Dashboard from './pages/Dashboard';
import Companies from './pages/Companies';
import Billing from './pages/Billing';
import Purchases from './pages/Purchases';
import Repairs from './pages/Repairs';
import AiAssistant from './pages/AiAssistant';
import Inventory from './pages/Inventory';
import Reports from './pages/Reports';
import Customers from './pages/Customers';
import Vendors from './pages/Vendors';
import Financials from './pages/Financials';
import BillHistory from './pages/BillHistory';
import Importer from './pages/Importer';
import DesignStudio from './pages/DesignStudio';
import SettingsPage from './pages/Settings';

export default function App() {
  const [activeCompany, setActiveCompany] = useState<any>(null);
  const [companies, setCompanies] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  useEffect(() => {
    loadCompanies();
  }, []);

  const loadCompanies = async () => {
    const data = await erpApi.getCompanies();
    setCompanies(data);
    if (data.length > 0 && !activeCompany) {
      setActiveCompany(data[0]);
    }
  };

  const menuItems = [
    { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { id: 'billing', icon: Receipt, label: 'Smart Sales Billing' },
    { id: 'purchase', icon: ShoppingCart, label: 'Purchase Voucher' },
    { id: 'repairs', icon: Wrench, label: 'Camera Repairs RepairHub' },
    { id: 'ai_assistant', icon: Sparkles, label: 'DAMSON AI Assistant' },
    { id: 'history', icon: History, label: 'Billing History' },
    { id: 'inventory', icon: Package, label: 'Stock Management' },
    { id: 'customers', icon: Users, label: 'Customer Due Statement' },
    { id: 'vendors', icon: Users, label: 'Vendor Ledger' },
    { id: 'financials', icon: TrendingUp, label: 'Profit & Loss' },
    { id: 'bank', icon: Landmark, label: 'Bank & Cash' },
    { id: 'importer', icon: Files, label: 'Old Bill Import' },
    { id: 'reports', icon: Download, label: 'Reports Centre' },
    { id: 'design', icon: LayoutDashboard, label: 'Design Studio' },
    { id: 'companies', icon: Building2, label: 'Company Configurator' },
    { id: 'settings', icon: Settings, label: 'ERP Settings' },
  ];

  const renderContent = () => {
    if (!activeCompany && activeTab !== 'companies') {
      return (
        <div className="flex flex-col items-center justify-center h-full text-zinc-500">
          <Building2 size={64} className="mb-4 opacity-20" />
          <h2 className="text-xl font-semibold">No Company Selected</h2>
          <p>Please create or select a company to continue.</p>
          <button 
            onClick={() => setActiveTab('companies')}
            className="mt-4 px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition font-medium"
          >
            Go to Company Management
          </button>
        </div>
      );
    }

    switch (activeTab) {
      case 'dashboard': return <Dashboard companyId={activeCompany?.id} />;
      case 'companies': return <Companies onCompanyCreated={loadCompanies} activeCompany={activeCompany} onSelect={setActiveCompany} />;
      case 'billing': return <Billing company={activeCompany} />;
      case 'purchase': return <Purchases company={activeCompany} />;
      case 'repairs': return <Repairs company={activeCompany} />;
      case 'ai_assistant': return <AiAssistant company={activeCompany} />;
      case 'inventory': return <Inventory companyId={activeCompany?.id} />;
      case 'customers': return <Customers companyId={activeCompany?.id} />;
      case 'vendors': return <Vendors companyId={activeCompany?.id} />;
      case 'financials': return <Financials companyId={activeCompany?.id} />;
      case 'history': return <BillHistory company={activeCompany} />;
      case 'importer': return <Importer companyId={activeCompany?.id} />;
      case 'reports': return <Reports companyId={activeCompany?.id} />;
      case 'design': return <DesignStudio company={activeCompany} />;
      case 'settings': return <SettingsPage />;
      default: return <Dashboard companyId={activeCompany?.id} />;
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-beige-50 text-zinc-800 font-sans">
      {/* Sidebar - Pro Light Grey */}
      <motion.aside 
        initial={false}
        animate={{ width: isSidebarOpen ? 280 : 80 }}
        className="relative flex flex-col border-r border-zinc-200 bg-[#ECEEF1] transition-all shadow-md z-20"
      >
        <div className="flex items-center justify-between p-4 border-b border-zinc-200 bg-[#ECEEF1]">
          {isSidebarOpen ? (
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-beige-700 rounded-lg flex items-center justify-center">
                <LayoutDashboard className="text-white" size={18} />
              </div>
              <span className="font-bold text-lg tracking-tight text-zinc-850">DAMSON ERP PRO</span>
            </div>
          ) : (
            <div className="w-full flex justify-center">
              <div className="w-8 h-8 bg-beige-700 rounded-lg flex items-center justify-center">
                <LayoutDashboard className="text-white" size={18} />
              </div>
            </div>
          )}
        </div>

        <nav className="flex-1 overflow-y-auto overflow-x-hidden py-4 px-3 space-y-1 custom-scrollbar">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center rounded-xl p-2.5 transition-all duration-200 group ${
                activeTab === item.id 
                  ? 'bg-white text-beige-750 font-bold shadow-sm border-l-4 border-beige-600' 
                  : 'text-zinc-650 hover:bg-beige-100'
              }`}
            >
              <item.icon size={18} className={`shrink-0 ${activeTab === item.id ? 'text-beige-650' : 'text-zinc-500 group-hover:text-zinc-800'}`} />
              <AnimatePresence>
                {isSidebarOpen && (
                  <motion.span 
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="ml-3 truncate text-xs font-medium"
                  >
                    {item.label}
                  </motion.span>
                )}
              </AnimatePresence>
            </button>
          ))}
        </nav>

        <div className="p-3 border-t border-zinc-200">
          <button 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="w-full flex items-center justify-center p-2 rounded-lg hover:bg-zinc-200 text-zinc-500 hover:text-zinc-800 transition"
          >
            {isSidebarOpen ? <ChevronLeft size={20} /> : <ChevronRight size={20} />}
          </button>
        </div>
      </motion.aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden relative">
        {/* Top Header - White bg, border-b */}
        <header className="h-16 flex items-center justify-between px-8 bg-white border-b border-zinc-200 z-10 shadow-sm">
          <div className="flex items-center gap-6">
            <h1 className="text-base font-bold text-zinc-800 uppercase tracking-wider">{activeTab.replace(/_/g, ' ')}</h1>
            
            {companies.length > 0 && (
              <div className="relative group">
                <button className="flex items-center gap-2 px-3 py-1.5 bg-zinc-100 rounded-lg hover:bg-zinc-200 transition border border-zinc-250">
                  <div className="w-5 h-5 bg-beige-700 rounded flex items-center justify-center text-[10px] text-white font-bold">
                    {activeCompany?.name?.[0]}
                  </div>
                  <span className="text-xs font-semibold text-zinc-700">{activeCompany?.name}</span>
                </button>
                <div className="absolute top-full left-0 mt-2 w-56 bg-white border border-zinc-200 rounded-xl shadow-2xl invisible group-hover:visible opacity-0 group-hover:opacity-100 transition-all p-2 z-50">
                  <p className="px-3 py-2 text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Switch Company Workspace</p>
                  {companies.map(c => (
                    <button 
                      key={c.id} 
                      onClick={() => setActiveCompany(c)}
                      className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left text-xs ${activeCompany?.id === c.id ? 'bg-beige-50 text-beige-755 font-bold border-l-2 border-beige-600' : 'hover:bg-zinc-100 text-zinc-650'}`}
                    >
                      <div className="w-7 h-7 rounded bg-zinc-100 flex items-center justify-center font-bold text-zinc-700 text-xs shrink-0">
                        {c.name[0]}
                      </div>
                      <div className="flex-1 overflow-hidden">
                        <p className="truncate font-medium">{c.name}</p>
                        <p className="text-[9px] text-zinc-400 truncate">{c.gstin || 'No GSTIN'}</p>
                      </div>
                    </button>
                  ))}
                  <div className="border-t border-zinc-100 mt-2 pt-2">
                    <button 
                      onClick={() => setActiveTab('companies')}
                      className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left text-xs text-beige-600 hover:bg-beige-50 font-semibold"
                    >
                      <Plus size={14} /> Manage Companies
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center gap-4">
            <div className="relative hidden md:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={14} />
              <input 
                type="text" 
                placeholder="Universal Search..." 
                className="pl-9 pr-4 py-1.5 bg-zinc-100 border border-zinc-200 rounded-xl text-xs focus:ring-1 focus:ring-emerald-500 focus:bg-white w-60 outline-none text-zinc-700 transition-all"
              />
            </div>
            <button className="p-2 text-zinc-500 hover:bg-zinc-100 rounded-xl relative border border-zinc-200 bg-beige-50">
              <Bell size={16} />
              <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-red-500 rounded-full"></span>
            </button>
            <div className="h-6 w-px bg-zinc-200"></div>
            <div className="flex items-center gap-2 pl-2">
              <div className="text-right hidden sm:block">
                <p className="text-xs font-semibold text-zinc-800">Master Admin</p>
                <p className="text-[9px] text-zinc-400">Offline ERP Mode</p>
              </div>
              <div className="w-8 h-8 rounded-lg bg-beige-100 text-beige-700 flex items-center justify-center font-bold text-xs ring-1 ring-beige-200 shadow-sm">
                ERP
              </div>
            </div>
          </div>
        </header>

        {/* Dynamic Content Frame - Beige Milk Paper */}
        <div className="flex-1 overflow-y-auto p-6 bg-beige-50 custom-scrollbar">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab + (activeCompany?.id || '')}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.15 }}
              className="h-full"
            >
              {renderContent()}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
