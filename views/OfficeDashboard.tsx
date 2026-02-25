
import React, { useState } from 'react';
import { JobStatus, PaymentStatus, VehicleRecord, InventoryPart, CommunicationLogEntry } from '../types';
import { formatCurrency } from '../utils/helpers';

interface OfficeDashboardProps {
  records: VehicleRecord[];
  inventory: InventoryPart[];
  onAddRecord: (record: VehicleRecord) => void;
  onUpdateRecord: (record: VehicleRecord) => void;
  onUpdateInventory: (inventory: InventoryPart[]) => void;
  onTogglePayment: (id: string) => void;
}

const OfficeDashboard: React.FC<OfficeDashboardProps> = ({ 
  records, 
  inventory,
  onAddRecord, 
  onUpdateRecord,
  onUpdateInventory,
  onTogglePayment 
}) => {
  const [selectedJob, setSelectedJob] = useState<VehicleRecord | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isInventoryOpen, setIsInventoryOpen] = useState(false);
  const [isPartFormOpen, setIsPartFormOpen] = useState(false);
  const [newPart, setNewPart] = useState<Partial<InventoryPart>>({
    name: '',
    price: 0,
    laborEstimate: 0,
    stockQuantity: 0,
    lowStockThreshold: 5,
    condition: 'new',
    source: 'Local Supplier'
  });
  const [formData, setFormData] = useState({
    licensePlate: '',
    clientName: '',
    contactInfo: '',
    make: '',
    model: '',
    complaint: ''
  });

  const addLogEntry = (record: VehicleRecord, type: CommunicationLogEntry['type'], message: string): VehicleRecord => {
    const newEntry: CommunicationLogEntry = {
      id: Math.random().toString(36).substr(2, 5),
      timestamp: new Date().toISOString(),
      type,
      message
    };
    return {
      ...record,
      communicationLog: [...(record.communicationLog || []), newEntry]
    };
  };

  const handleSendReminder = (record: VehicleRecord) => {
    const updated = addLogEntry(record, 'REMINDER_SENT', `Automated reminder sent to ${record.clientName} regarding job status: ${record.status.replace('_', ' ')}.`);
    onUpdateRecord(updated);
    alert(`Reminder SMS sent to ${record.contactInfo}`);
  };

  const handleAssignMechanic = (record: VehicleRecord) => {
    const mechanic = prompt("Enter mechanic name to assign:");
    if (mechanic) {
      const updated = { ...record, mechanicName: mechanic };
      onUpdateRecord(updated);
      alert(`Job assigned to ${mechanic}`);
    }
  };

  const triggerStatusUpdate = (record: VehicleRecord, newStatus: JobStatus) => {
    let updated = { ...record, status: newStatus };
    const message = `Status update sent to client: Job is now ${newStatus.replace('_', ' ')}.`;
    updated = addLogEntry(updated, 'STATUS_UPDATE', message);
    onUpdateRecord(updated);
    alert(`Status update SMS sent to ${record.contactInfo}: ${message}`);
  };

  const handleAddPart = (e: React.FormEvent) => {
    e.preventDefault();
    const part: InventoryPart = {
      ...newPart as InventoryPart,
      id: Math.random().toString(36).substr(2, 5),
    };
    onUpdateInventory([...inventory, part]);
    setIsPartFormOpen(false);
    setNewPart({ name: '', price: 0, laborEstimate: 0, stockQuantity: 0, lowStockThreshold: 5, condition: 'new', source: 'Local Supplier' });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newRecord: VehicleRecord = {
      ...formData,
      id: Math.random().toString(36).substr(2, 9),
      status: JobStatus.PENDING,
      paymentStatus: PaymentStatus.PENDING,
      createdAt: new Date().toISOString()
    };
    onAddRecord(newRecord);
    setIsFormOpen(false);
    setFormData({ licensePlate: '', clientName: '', contactInfo: '', make: '', model: '', complaint: '' });
  };

  const statusColors = {
    [JobStatus.PENDING]: 'bg-amber-100 text-amber-700 border-amber-200',
    [JobStatus.INSPECTING]: 'bg-blue-100 text-blue-700 border-blue-200',
    [JobStatus.AWAITING_APPROVAL]: 'bg-purple-100 text-purple-700 border-purple-200',
    [JobStatus.IN_PROGRESS]: 'bg-indigo-100 text-indigo-700 border-indigo-200',
    [JobStatus.COMPLETED]: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    [JobStatus.CANCELLED]: 'bg-slate-100 text-slate-700 border-slate-200',
  };

  const activeRecords = records.filter(r => r.status !== JobStatus.COMPLETED);
  const completedRecords = records.filter(r => r.status === JobStatus.COMPLETED);

  return (
    <div className="space-y-10">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Workshop Overview</h2>
          <p className="text-slate-500">Manage vehicle intake and client communications</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => setIsInventoryOpen(true)}
            className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-xl flex items-center gap-2 transition-all border border-slate-200 relative"
          >
            <i className="fa-solid fa-boxes-stacked"></i>
            <span className="hidden sm:inline">Inventory</span>
            {inventory.some(p => p.stockQuantity <= p.lowStockThreshold) && (
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-white animate-pulse"></span>
            )}
          </button>
          <button 
            onClick={() => setIsFormOpen(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl flex items-center gap-2 transition-all shadow-md"
          >
            <i className="fa-solid fa-plus"></i>
            <span className="hidden sm:inline">New Intake</span>
          </button>
        </div>
      </div>

      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-slate-800">Vehicle Intake Form</h3>
              <button onClick={() => setIsFormOpen(false)} className="text-slate-400 hover:text-slate-600">
                <i className="fa-solid fa-xmark text-xl"></i>
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-sm font-semibold text-slate-600">License Plate</label>
                  <input 
                    required
                    className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" 
                    value={formData.licensePlate}
                    onChange={e => setFormData({...formData, licensePlate: e.target.value})}
                    placeholder="e.g. ABC-1234"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-semibold text-slate-600">Client Name</label>
                  <input 
                    required
                    className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" 
                    value={formData.clientName}
                    onChange={e => setFormData({...formData, clientName: e.target.value})}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-sm font-semibold text-slate-600">Contact Info (WhatsApp)</label>
                <input 
                  required
                  type="tel"
                  className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" 
                  value={formData.contactInfo}
                  onChange={e => setFormData({...formData, contactInfo: e.target.value})}
                  placeholder="+1 234 567 890"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-sm font-semibold text-slate-600">Make</label>
                  <input 
                    required
                    className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" 
                    value={formData.make}
                    onChange={e => setFormData({...formData, make: e.target.value})}
                    placeholder="e.g. Toyota"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-semibold text-slate-600">Model</label>
                  <input 
                    required
                    className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" 
                    value={formData.model}
                    onChange={e => setFormData({...formData, model: e.target.value})}
                    placeholder="e.g. Camry"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-sm font-semibold text-slate-600">Initial Complaint</label>
                <textarea 
                  required
                  className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none min-h-[100px]" 
                  value={formData.complaint}
                  onChange={e => setFormData({...formData, complaint: e.target.value})}
                  placeholder="Describe the issue reported by the client..."
                />
              </div>

              <button 
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl transition-all shadow-lg mt-4"
              >
                Create Record
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Active Jobs Grid */}
      <section>
        <h3 className="text-lg font-bold text-slate-700 mb-4 flex items-center gap-2">
          <i className="fa-solid fa-spinner text-blue-500"></i> Active Jobs
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {activeRecords.length === 0 ? (
            <div className="col-span-full py-12 text-center bg-white rounded-2xl border-2 border-dashed border-slate-200">
              <p className="text-slate-500">No active records found.</p>
            </div>
          ) : (
            activeRecords.map(record => (
              <div 
                key={record.id} 
                onClick={() => setSelectedJob(record)}
                className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden hover:shadow-md transition-shadow cursor-pointer group"
              >
                <div className="p-5 border-b flex justify-between items-start bg-slate-50/50 group-hover:bg-blue-50/30 transition-colors">
                  <div>
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Vehicle Info</div>
                    <h4 className="font-bold text-slate-800 text-lg">{record.licensePlate}</h4>
                    <p className="text-sm text-slate-500">{record.make} {record.model}</p>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-bold border uppercase ${statusColors[record.status]}`}>
                      {record.status.replace('_', ' ')}
                    </span>
                  </div>
                </div>
                <div className="p-5 space-y-4">
                  <div>
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Client</div>
                    <p className="text-sm font-medium text-slate-700">{record.clientName}</p>
                  </div>
                  <div>
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Issue</div>
                    <p className="text-sm text-slate-600 line-clamp-2">{record.complaint}</p>
                  </div>
                  {record.mechanicName && (
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <i className="fa-solid fa-user-gear"></i>
                      <span>Assigned: <span className="font-bold text-slate-700">{record.mechanicName}</span></span>
                    </div>
                  )}
                  
                  {/* Quick Actions */}
                  <div className="pt-4 flex flex-wrap gap-2 border-t border-slate-50">
                    <button 
                      onClick={(e) => { e.stopPropagation(); handleAssignMechanic(record); }}
                      className="flex-1 bg-slate-50 hover:bg-slate-100 text-slate-600 py-2 rounded-lg text-[10px] font-bold uppercase transition-colors border border-slate-200"
                    >
                      Assign
                    </button>
                    <button 
                      onClick={(e) => { e.stopPropagation(); handleSendReminder(record); }}
                      className="flex-1 bg-blue-50 hover:bg-blue-100 text-blue-600 py-2 rounded-lg text-[10px] font-bold uppercase transition-colors border border-blue-100"
                    >
                      Remind
                    </button>
                    <button 
                      onClick={(e) => { e.stopPropagation(); setSelectedJob(record); }}
                      className="flex-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 py-2 rounded-lg text-[10px] font-bold uppercase transition-colors border border-indigo-100"
                    >
                      Details
                    </button>
                  </div>

                  {record.communicationLog && record.communicationLog.length > 0 && (
                    <div className="pt-2 flex items-center gap-2 text-[10px] font-bold text-blue-500 uppercase">
                      <i className="fa-solid fa-clock-rotate-left"></i>
                      {record.communicationLog.length} Updates
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      {/* Completed Job History Section */}
      <section>
        <h3 className="text-lg font-bold text-slate-700 mb-4 flex items-center gap-2">
          <i className="fa-solid fa-circle-check text-emerald-500"></i> Completed Jobs History
        </h3>
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Client / Plate</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Description</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Amount</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Payment</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {completedRecords.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-slate-400">No completed jobs yet.</td>
                  </tr>
                ) : (
                  completedRecords.map(record => (
                    <tr key={record.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4">
                        <p className="font-bold text-slate-800">{record.clientName}</p>
                        <p className="text-xs text-slate-500">{record.licensePlate}</p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-xs text-slate-600 line-clamp-1 max-w-xs">{record.jobDescription || "No summary available"}</p>
                      </td>
                      <td className="px-6 py-4 font-bold text-slate-700">
                        {formatCurrency(record.finalAmount || 0)}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${record.paymentStatus === PaymentStatus.PAID ? 'bg-emerald-50 border-emerald-100 text-emerald-600' : 'bg-amber-50 border-amber-100 text-amber-600'}`}>
                          {record.paymentStatus}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button 
                          onClick={() => onTogglePayment(record.id)}
                          className={`text-xs font-bold px-3 py-1 rounded transition-colors ${record.paymentStatus === PaymentStatus.PAID ? 'text-slate-400 hover:text-slate-600' : 'text-blue-600 hover:text-blue-800'}`}
                        >
                          {record.paymentStatus === PaymentStatus.PAID ? 'Mark Unpaid' : 'Mark Paid'}
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>
      {/* Inventory Modal */}
      {isInventoryOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl p-6 max-h-[90vh] flex flex-col">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-xl font-bold text-slate-800">Parts Inventory</h3>
                <p className="text-sm text-slate-500">Manage stock, pricing, and labor estimates</p>
              </div>
              <div className="flex gap-3">
                <button 
                  onClick={() => setIsPartFormOpen(true)}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2"
                >
                  <i className="fa-solid fa-plus"></i> Add Part
                </button>
                <button onClick={() => setIsInventoryOpen(false)} className="text-slate-400 hover:text-slate-600">
                  <i className="fa-solid fa-xmark text-xl"></i>
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-50 sticky top-0">
                  <tr>
                    <th className="px-4 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Part Name</th>
                    <th className="px-4 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Stock</th>
                    <th className="px-4 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Threshold</th>
                    <th className="px-4 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Price</th>
                    <th className="px-4 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Labor</th>
                    <th className="px-4 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {inventory.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-10 text-center text-slate-400 italic">No parts in inventory.</td>
                    </tr>
                  ) : (
                    inventory.map(part => {
                      const isLowStock = part.stockQuantity <= part.lowStockThreshold;
                      return (
                        <tr key={part.id} className={`hover:bg-slate-50 transition-colors ${isLowStock ? 'bg-red-50/30' : ''}`}>
                          <td className="px-4 py-4">
                            <div className="flex items-center gap-2">
                              {isLowStock && <i className="fa-solid fa-triangle-exclamation text-red-500 text-xs"></i>}
                              <div>
                                <p className="font-bold text-slate-800">{part.name}</p>
                                <p className="text-[10px] text-slate-400">{part.source} • {part.condition}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-4">
                            <span className={`px-2 py-1 rounded text-xs font-bold ${isLowStock ? 'bg-red-100 text-red-700 border border-red-200' : 'bg-emerald-50 text-emerald-600'}`}>
                              {part.stockQuantity} units
                            </span>
                          </td>
                          <td className="px-4 py-4">
                            <input 
                              type="number" 
                              className="w-16 p-1 border rounded text-xs" 
                              value={part.lowStockThreshold}
                              onChange={(e) => {
                                const updated = inventory.map(p => p.id === part.id ? { ...p, lowStockThreshold: Number(e.target.value) } : p);
                                onUpdateInventory(updated);
                              }}
                            />
                          </td>
                          <td className="px-4 py-4 font-medium text-slate-700">{formatCurrency(part.price)}</td>
                          <td className="px-4 py-4 text-slate-500 text-sm">{formatCurrency(part.laborEstimate)}</td>
                          <td className="px-4 py-4 text-right">
                            <button 
                              onClick={() => onUpdateInventory(inventory.filter(p => p.id !== part.id))}
                              className="text-red-400 hover:text-red-600 p-2"
                            >
                              <i className="fa-solid fa-trash-can"></i>
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Add Part Form Modal */}
      {isPartFormOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-slate-800">Add New Part</h3>
              <button onClick={() => setIsPartFormOpen(false)} className="text-slate-400">
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>
            <form onSubmit={handleAddPart} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase">Part Name</label>
                <input 
                  required
                  className="w-full p-2 border rounded-lg" 
                  value={newPart.name}
                  onChange={e => setNewPart({...newPart, name: e.target.value})}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase">Price</label>
                  <input 
                    required
                    type="number"
                    className="w-full p-2 border rounded-lg" 
                    value={newPart.price}
                    onChange={e => setNewPart({...newPart, price: Number(e.target.value)})}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase">Labor Est.</label>
                  <input 
                    required
                    type="number"
                    className="w-full p-2 border rounded-lg" 
                    value={newPart.laborEstimate}
                    onChange={e => setNewPart({...newPart, laborEstimate: Number(e.target.value)})}
                  />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase">Initial Stock</label>
                  <input 
                    required
                    type="number"
                    className="w-full p-2 border rounded-lg" 
                    value={newPart.stockQuantity}
                    onChange={e => setNewPart({...newPart, stockQuantity: Number(e.target.value)})}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase">Threshold</label>
                  <input 
                    required
                    type="number"
                    className="w-full p-2 border rounded-lg" 
                    value={newPart.lowStockThreshold}
                    onChange={e => setNewPart({...newPart, lowStockThreshold: Number(e.target.value)})}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase">Condition</label>
                  <select 
                    className="w-full p-2 border rounded-lg"
                    value={newPart.condition}
                    onChange={e => setNewPart({...newPart, condition: e.target.value as any})}
                  >
                    <option value="new">New</option>
                    <option value="used">Used</option>
                    <option value="refurbished">Refurbished</option>
                  </select>
                </div>
              </div>
              <button type="submit" className="w-full bg-blue-600 text-white font-bold py-3 rounded-xl shadow-lg">
                Add to Inventory
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Job Details Modal */}
      {selectedJob && (
        <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/40 backdrop-blur-sm">
          <div className="bg-white h-full w-full max-w-md shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
            <div className="p-6 border-b flex justify-between items-center bg-slate-900 text-white">
              <div>
                <h3 className="text-xl font-bold">{selectedJob.licensePlate}</h3>
                <p className="text-xs text-slate-400">{selectedJob.make} {selectedJob.model}</p>
              </div>
              <button onClick={() => setSelectedJob(null)} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                <i className="fa-solid fa-xmark text-xl"></i>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-8">
              {/* Status Section */}
              <section>
                <div className="flex justify-between items-center mb-3">
                  <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Current Status</h4>
                  <div className="flex gap-2">
                    {selectedJob.status === JobStatus.PENDING && (
                      <button 
                        onClick={() => triggerStatusUpdate(selectedJob, JobStatus.INSPECTING)}
                        className="text-[9px] font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded border border-blue-100"
                      >
                        Start Inspection
                      </button>
                    )}
                    {selectedJob.status === JobStatus.IN_PROGRESS && (
                      <button 
                        onClick={() => triggerStatusUpdate(selectedJob, JobStatus.COMPLETED)}
                        className="text-[9px] font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded border border-emerald-100"
                      >
                        Notify Completed
                      </button>
                    )}
                  </div>
                </div>
                <div className={`inline-block px-4 py-2 rounded-xl text-xs font-bold border uppercase ${statusColors[selectedJob.status]}`}>
                  {selectedJob.status.replace('_', ' ')}
                </div>
              </section>

              {/* Client Info */}
              <section className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Client</h4>
                  <p className="text-sm font-bold text-slate-800">{selectedJob.clientName}</p>
                </div>
                <div>
                  <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Contact</h4>
                  <p className="text-sm text-blue-600 font-medium">{selectedJob.contactInfo}</p>
                </div>
              </section>

              {/* Communication Log */}
              <section>
                <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                  <i className="fa-solid fa-clock-rotate-left text-blue-500"></i> Communication Log
                </h4>
                <div className="space-y-4 relative before:absolute before:left-3 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-100">
                  {(!selectedJob.communicationLog || selectedJob.communicationLog.length === 0) ? (
                    <p className="text-xs text-slate-400 italic pl-8">No communication recorded yet.</p>
                  ) : (
                    selectedJob.communicationLog.map((log, idx) => (
                      <div key={log.id} className="relative pl-8 group">
                        <div className="absolute left-1.5 top-1.5 w-3 h-3 rounded-full bg-white border-2 border-blue-500 z-10 group-last:border-emerald-500"></div>
                        <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                          <div className="flex justify-between items-start mb-1">
                            <span className="text-[9px] font-black text-blue-600 uppercase tracking-tighter">{log.type.replace('_', ' ')}</span>
                            <span className="text-[9px] text-slate-400">{new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          </div>
                          <p className="text-xs text-slate-700 leading-relaxed">{log.message}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </section>

              {/* Job Details */}
              {selectedJob.identifiedPart && (
                <section className="bg-blue-50 p-4 rounded-2xl border border-blue-100">
                  <h4 className="text-[10px] font-bold text-blue-800 uppercase tracking-widest mb-3">Identified Parts & Labor</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-600">{selectedJob.identifiedPart.name}</span>
                      <span className="font-bold text-slate-800">{formatCurrency(selectedJob.identifiedPart.price)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-600">Labor Estimate</span>
                      <span className="font-bold text-slate-800">{formatCurrency(selectedJob.identifiedPart.laborEstimate)}</span>
                    </div>
                    <div className="pt-2 border-t border-blue-200 flex justify-between">
                      <span className="text-sm font-bold text-blue-900">Total Estimate</span>
                      <span className="text-sm font-black text-blue-700">{formatCurrency(selectedJob.identifiedPart.price + selectedJob.identifiedPart.laborEstimate)}</span>
                    </div>
                  </div>
                </section>
              )}
            </div>

            <div className="p-6 border-t bg-slate-50">
              <button 
                onClick={() => setSelectedJob(null)}
                className="w-full bg-slate-800 text-white font-bold py-3 rounded-xl hover:bg-slate-900 transition-all"
              >
                Close Details
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OfficeDashboard;
