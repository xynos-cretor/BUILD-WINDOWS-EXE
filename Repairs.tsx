import React, { useState, useEffect } from 'react';
import { 
  Wrench, 
  Plus, 
  Trash2, 
  Sliders, 
  PenTool, 
  Clock, 
  Camera, 
  CheckCircle2, 
  AlertCircle,
  Truck,
  Bookmark,
  Calendar,
  Search,
  CheckCircle,
  Hash
} from 'lucide-react';
import { erpApi } from '../lib/erpApi';

interface RepairsProps {
  company: any;
}

export default function Repairs({ company }: RepairsProps) {
  const [repairs, setRepairs] = useState<any[]>([]);
  const [jobNumber, setJobNumber] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [mobile, setMobile] = useState('');
  const [cameraBrand, setCameraBrand] = useState('');
  const [serialNumber, setSerialNumber] = useState('');
  const [problemDescription, setProblemDescription] = useState('');
  const [deliveryDate, setDeliveryDate] = useState('');
  const [estimatedCost, setEstimatedCost] = useState(1500);
  const [showAddForm, setShowAddForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (company?.id) {
      loadRepairs();
    }
  }, [company]);

  const loadRepairs = async () => {
    try {
      const data = await erpApi.getRepairs(company.id);
      setRepairs(data || []);
    } catch (err) {
      console.error("Error loading repairs:", err);
    }
  };

  // Generate a premium incremental job card card id when form is opened
  useEffect(() => {
    if (showAddForm) {
      const rn = Math.floor(100000 + Math.random() * 900000);
      setJobNumber(`JOB-${rn}`);
    }
  }, [showAddForm]);

  const handleCreateRepair = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName || !mobile || !cameraBrand || !problemDescription) {
      alert("Please fill all required job details.");
      return;
    }

    try {
      const repairData = {
        company_id: company.id,
        job_no: jobNumber,
        customer_name: customerName,
        mobile,
        camera_model: cameraBrand,
        serial_no: serialNumber,
        problem: problemDescription,
        delivery_date: deliveryDate || new Date(Date.now() + 5*24*60*60*1000).toISOString().split('T')[0], // 5 days from now defaults
        estimated_cost: estimatedCost,
        status: "Received"
      };

      const result = await erpApi.createRepair(repairData);
      if (result.success) {
        setCustomerName('');
        setMobile('');
        setCameraBrand('');
        setSerialNumber('');
        setProblemDescription('');
        setDeliveryDate('');
        setEstimatedCost(1500);
        setShowAddForm(false);
        loadRepairs();
      } else {
        alert("Failed to submit job card: " + result.error);
      }
    } catch (err: any) {
      alert("Error: " + err.message);
    }
  };

  const handleStatusCycle = async (id: number, currentStatus: string) => {
    const statuses = ["Received", "Under Repair", "Ready", "Delivered"];
    const currentIndex = statuses.indexOf(currentStatus);
    const nextStatus = statuses[(currentIndex + 1) % statuses.length];

    try {
      await erpApi.updateRepairStatus(id, nextStatus);
      loadRepairs();
    } catch (err) {
      console.error("Error toggling status:", err);
    }
  };

  const handleDelete = async (id: number) => {
    if (confirm("Are you sure you want to dismiss this camera job card?")) {
      await erpApi.deleteRepair(id);
      loadRepairs();
    }
  };

  const getStatusPill = (status: string) => {
    switch (status) {
      case "Received":
        return <span className="bg-sky-50 text-sky-700 ring-1 ring-sky-200 text-[10px] px-2 py-1 rounded-full font-bold flex items-center gap-1"><AlertCircle size={10} /> Received</span>;
      case "Under Repair":
        return <span className="bg-amber-50 text-amber-700 ring-1 ring-amber-200 text-[10px] px-2 py-1 rounded-full font-bold flex items-center gap-1"><Clock size={10} /> Under Repair</span>;
      case "Ready":
        return <span className="bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200 text-[10px] px-2 py-1 rounded-full font-bold flex items-center gap-1"><CheckCircle2 size={10} /> Ready for Delivery</span>;
      case "Delivered":
        return <span className="bg-zinc-100 text-zinc-600 ring-1 ring-zinc-200 text-[10px] px-2 py-1 rounded-full font-medium flex items-center gap-1"><Truck size={10} /> Out / Delivered</span>;
      default:
        return <span className="bg-zinc-100 text-zinc-700 text-[10px] px-2 py-1 rounded-full">Unknown</span>;
    }
  };

  const filteredRepairs = repairs.filter(r => 
    r.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    r.camera_model?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.job_no?.toString().includes(searchTerm)
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-zinc-800 flex items-center gap-2">
            <Wrench className="text-emerald-600" /> Camera & Electronics RepairHub
          </h2>
          <p className="text-xs text-zinc-500">Track professional electronic products repair status, estimate costs, and update repair progress with status pills.</p>
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="px-4 py-2 bg-emerald-600 text-white rounded-xl shadow-sm hover:bg-emerald-700 transition flex items-center gap-2 text-xs font-semibold"
        >
          <Plus size={16} /> {showAddForm ? "Hide Desk" : "Create Repair Job Card"}
        </button>
      </div>

      {showAddForm && (
        <form onSubmit={handleCreateRepair} className="bg-white rounded-2xl shadow-sm border border-zinc-200 p-6 space-y-6">
          <div className="border-b border-zinc-100 pb-3">
            <h3 className="text-sm font-bold text-emerald-700 uppercase tracking-wider flex items-center gap-2">
              <Plus size={16} /> New Camera / Electronics Service Intake
            </h3>
            <p className="text-[11px] text-zinc-400">Generates unique service ticket numbers for instant lookup.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Column 1: Client Contacts */}
            <div className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold text-zinc-500 uppercase mb-1">Job Number (Auto)</label>
                <div className="relative">
                  <Hash size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                  <input
                    type="text"
                    disabled
                    value={jobNumber}
                    className="w-full pl-9 pr-3 py-2 border border-zinc-100 bg-zinc-50 rounded-xl text-xs font-semibold text-zinc-600 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-zinc-500 uppercase mb-1">Customer Name *</label>
                <input
                  type="text"
                  required
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="e.g. Anand Kumar"
                  className="w-full px-3 py-2 border border-zinc-200 rounded-xl text-xs focus:ring-1 focus:ring-emerald-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-zinc-500 uppercase mb-1">Mobile No *</label>
                <input
                  type="tel"
                  required
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value)}
                  placeholder="e.g. 9876XXXXXX"
                  className="w-full px-3 py-2 border border-zinc-200 rounded-xl text-xs focus:ring-1 focus:ring-emerald-500 outline-none"
                />
              </div>
            </div>

            {/* Column 2: Equipment Assets details */}
            <div className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold text-zinc-500 uppercase mb-1">Camera Brand / Device Model *</label>
                <div className="relative">
                  <Camera size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                  <input
                    type="text"
                    required
                    value={cameraBrand}
                    onChange={(e) => setCameraBrand(e.target.value)}
                    placeholder="e.g. Sony Alpha 7 IV"
                    className="w-full pl-9 pr-3 py-2 border border-zinc-200 rounded-xl text-xs focus:ring-1 focus:ring-emerald-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-zinc-500 uppercase mb-1">Serial Number / Asset Tag</label>
                <input
                  type="text"
                  value={serialNumber}
                  onChange={(e) => setSerialNumber(e.target.value)}
                  placeholder="e.g. SN-8032711"
                  className="w-full px-3 py-2 border border-zinc-200 rounded-xl text-xs focus:ring-1 focus:ring-emerald-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-zinc-500 uppercase mb-1">Promised Delivery Date</label>
                <div className="relative">
                  <Calendar size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                  <input
                    type="date"
                    value={deliveryDate}
                    onChange={(e) => setDeliveryDate(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 border border-zinc-200 rounded-xl text-xs focus:ring-1 focus:ring-emerald-500 outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Column 3: Intricate Description and Costs */}
            <div className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold text-zinc-500 uppercase mb-1">Problem Diagnosed *</label>
                <textarea
                  required
                  value={problemDescription}
                  onChange={(e) => setProblemDescription(e.target.value)}
                  placeholder="describe defect (e.g. zoom lens stuck, broken mount, digital sensor spots)"
                  rows={2}
                  className="w-full px-3 py-2 border border-zinc-200 rounded-xl text-xs focus:ring-1 focus:ring-emerald-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-zinc-500 uppercase mb-1">Estimated Repairs Cost (Rs.)</label>
                <input
                  type="number"
                  value={estimatedCost}
                  onChange={(e) => setEstimatedCost(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-zinc-200 rounded-xl text-xs focus:ring-1 focus:ring-emerald-500 outline-none font-bold"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-2.5 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700 transition shadow-sm flex items-center justify-center gap-2"
                >
                  <CheckCircle size={15} /> Save & File Job Card
                </button>
              </div>
            </div>
          </div>
        </form>
      )}

      {/* Repairs Master list */}
      <div className="bg-white rounded-2xl shadow-sm border border-zinc-200 p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h3 className="font-bold text-zinc-800 text-sm">Active Repair Registries</h3>
            <p className="text-[11px] text-zinc-400">Click on status pills to sequentially cycle through job states.</p>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={14} />
            <input
              type="text"
              placeholder="Search Customer, Job No or Brand..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 pr-4 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-xs focus:ring-1 focus:ring-emerald-500 outline-none w-64"
            />
          </div>
        </div>

        {filteredRepairs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-zinc-400">
            <Wrench className="opacity-15 mb-2" size={48} />
            <p className="text-xs">No active repairs inside the queue.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-zinc-600 border-collapse">
              <thead>
                <tr className="bg-zinc-50/70 border-b border-zinc-200 text-zinc-500 font-bold">
                  <th className="py-3 px-4">Ticket</th>
                  <th className="py-3 px-4">Client Detail</th>
                  <th className="py-3 px-4">Camera / Defect</th>
                  <th className="py-3 px-4">Serial Number</th>
                  <th className="py-3 px-4 text-center">Delivery Target</th>
                  <th className="py-3 px-4 text-right">Est. Budget</th>
                  <th className="py-3 px-4 text-center">Ticket Status (Click to toggle)</th>
                  <th className="py-3 px-4">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {filteredRepairs.map((r) => (
                  <tr key={r.id} className="hover:bg-zinc-50/50 transition">
                    <td className="py-3 px-4 font-bold text-emerald-700">{r.job_no}</td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-zinc-800">{r.customer_name}</div>
                      <div className="text-[10px] text-zinc-400">Call: {r.mobile}</div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-medium text-zinc-800 flex items-center gap-1">
                        <Camera size={11} className="text-zinc-400" /> {r.camera_model}
                      </div>
                      <div className="text-[10px] text-zinc-400 italic">Defect: "{r.problem}"</div>
                    </td>
                    <td className="py-3 px-4 text-zinc-500 font-mono">{r.serial_no || 'N/A'}</td>
                    <td className="py-3 px-4 text-center font-semibold text-zinc-650">
                      {r.delivery_date}
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-zinc-800">
                      Rs. {Number(r.estimated_cost).toFixed(2)}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex justify-center">
                        <button
                          onClick={() => handleStatusCycle(r.id, r.status)}
                          className="hover:scale-105 active:scale-95 transition cursor-pointer"
                          title="Click to cycle status"
                        >
                          {getStatusPill(r.status)}
                        </button>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => handleDelete(r.id)}
                        className="p-1 px-2.5 text-rose-500 hover:bg-rose-50 rounded-lg transition"
                        title="Dismiss Ticket"
                      >
                        <Trash2 size={13} />
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
