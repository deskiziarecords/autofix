
import React, { useState, useEffect } from 'react';
import { JobStatus, PaymentStatus, VehicleRecord, InventoryPart } from './types';
import OfficeDashboard from './views/OfficeDashboard';
import MechanicWorkflow from './views/MechanicWorkflow';
import Reports from './views/Reports';
import { apiService } from './services/apiService';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'office' | 'mechanic' | 'reports'>('office');
  const [records, setRecords] = useState<VehicleRecord[]>([]);
  const [inventory, setInventory] = useState<InventoryPart[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);

  // Initial Load from "Database"
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        const [recordsData, inventoryData] = await Promise.all([
          apiService.fetchRecords(),
          apiService.fetchInventory()
        ]);
        setRecords(recordsData);
        setInventory(inventoryData);
      } catch (error) {
        console.error("Database connection failed", error);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, []);

  const addRecord = async (record: VehicleRecord) => {
    setIsSyncing(true);
    try {
      const savedRecord = await apiService.createRecord(record);
      setRecords(prev => [savedRecord, ...prev]);
    } catch (error) {
      alert("Failed to save to database");
    } finally {
      setIsSyncing(false);
    }
  };

  const updateRecord = async (updatedRecord: VehicleRecord) => {
    setIsSyncing(true);
    try {
      const saved = await apiService.updateRecord(updatedRecord);
      setRecords(prev => prev.map(r => r.id === saved.id ? saved : r));
    } catch (error) {
      alert("Database update failed");
    } finally {
      setIsSyncing(false);
    }
  };

  const updateInventory = async (newInventory: InventoryPart[]) => {
    setIsSyncing(true);
    try {
      await apiService.updateInventory(newInventory);
      setInventory(newInventory);
    } catch (error) {
      alert("Inventory update failed");
    } finally {
      setIsSyncing(false);
    }
  };

  const togglePaymentStatus = async (id: string) => {
    setIsSyncing(true);
    try {
      const updated = await apiService.togglePayment(id);
      if (updated) {
        setRecords(prev => prev.map(r => r.id === id ? updated : r));
      }
    } catch (error) {
      alert("Payment status sync failed");
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      {/* Top Navbar */}
      <header className="bg-slate-900 text-white p-4 shadow-lg sticky top-0 z-40">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="bg-blue-600 p-2 rounded-lg">
              <i className="fa-solid fa-car-wrench text-xl"></i>
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight">AutoFix <span className="text-blue-400">Pro</span></h1>
              <div className="flex items-center gap-1.5">
                 <div className={`w-2 h-2 rounded-full ${isSyncing ? 'bg-amber-400 animate-pulse' : 'bg-emerald-400'}`}></div>
                 <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                   {isSyncing ? 'Syncing to DB' : 'PostgreSQL Connected'}
                 </span>
              </div>
            </div>
          </div>
          <div className="hidden md:flex gap-6 text-sm font-medium">
            <button 
              onClick={() => setActiveTab('office')}
              className={`${activeTab === 'office' ? 'text-blue-400' : 'text-slate-300'} hover:text-white transition-colors`}
            >
              Office
            </button>
            <button 
              onClick={() => setActiveTab('mechanic')}
              className={`${activeTab === 'mechanic' ? 'text-blue-400' : 'text-slate-300'} hover:text-white transition-colors`}
            >
              Mechanic
            </button>
            <button 
              onClick={() => setActiveTab('reports')}
              className={`${activeTab === 'reports' ? 'text-blue-400' : 'text-slate-300'} hover:text-white transition-colors`}
            >
              Reports
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto pb-24 md:pb-8">
        <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              <p className="font-bold text-slate-500 animate-pulse">Establishing Database Connection...</p>
            </div>
          ) : (
            <>
              {activeTab === 'office' && (
                <OfficeDashboard 
                  records={records} 
                  inventory={inventory}
                  onAddRecord={addRecord} 
                  onUpdateRecord={updateRecord}
                  onUpdateInventory={updateInventory}
                  onTogglePayment={togglePaymentStatus} 
                />
              )}
              {activeTab === 'mechanic' && <MechanicWorkflow records={records} onUpdateRecord={updateRecord} />}
              {activeTab === 'reports' && <Reports records={records} />}
            </>
          )}
        </div>
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 shadow-2xl z-40">
        <div className="flex justify-around items-center p-3">
          <button 
            onClick={() => setActiveTab('office')}
            className={`flex flex-col items-center gap-1 ${activeTab === 'office' ? 'text-blue-600' : 'text-slate-400'}`}
          >
            <i className="fa-solid fa-briefcase text-xl"></i>
            <span className="text-[10px] font-bold">OFFICE</span>
          </button>
          <button 
            onClick={() => setActiveTab('mechanic')}
            className={`flex flex-col items-center gap-1 ${activeTab === 'mechanic' ? 'text-blue-600' : 'text-slate-400'}`}
          >
            <i className="fa-solid fa-wrench text-xl"></i>
            <span className="text-[10px] font-bold">MECHANIC</span>
          </button>
          <button 
            onClick={() => setActiveTab('reports')}
            className={`flex flex-col items-center gap-1 ${activeTab === 'reports' ? 'text-blue-600' : 'text-slate-400'}`}
          >
            <i className="fa-solid fa-chart-line text-xl"></i>
            <span className="text-[10px] font-bold">REPORTS</span>
          </button>
        </div>
      </nav>
    </div>
  );
};

export default App;
