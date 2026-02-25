
import React, { useState } from 'react';
import { JobStatus, VehicleRecord, Part, PaymentStatus, CommunicationLogEntry } from '../types';
import { performOCR, identifyPart, fetchSimulatedQuotes, generateJobSummary } from '../services/geminiService';
import { formatCurrency } from '../utils/helpers';
import CameraModal from '../components/CameraModal';

interface MechanicWorkflowProps {
  records: VehicleRecord[];
  onUpdateRecord: (record: VehicleRecord) => void;
}

const MechanicWorkflow: React.FC<MechanicWorkflowProps> = ({ records, onUpdateRecord }) => {
  const [activeJob, setActiveJob] = useState<VehicleRecord | null>(null);
  const [isCapturingPlate, setIsCapturingPlate] = useState(false);
  const [isCapturingPart, setIsCapturingPart] = useState(false);
  const [isManualPartInput, setIsManualPartInput] = useState(false);
  const [manualPart, setManualPart] = useState({ name: '', price: 0, laborEstimate: 0 });
  const [isLoading, setIsLoading] = useState(false);
  const [quotes, setQuotes] = useState<any[]>([]);
  const [selectedQuote, setSelectedQuote] = useState<any | null>(null);
  const [adjustedPrice, setAdjustedPrice] = useState(0);
  const [adjustedLabor, setAdjustedLabor] = useState(0);
  const [isVoiceInput, setIsVoiceInput] = useState(false);
  const [transcript, setTranscript] = useState('');

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

  const handlePlateCapture = async (base64: string) => {
    setIsLoading(true);
    try {
      const plate = await performOCR(base64);
      const found = records.find(r => r.licensePlate.toUpperCase().includes(plate.toUpperCase()) || plate.toUpperCase().includes(r.licensePlate.toUpperCase()));
      if (found) {
        let updated = { ...found, status: JobStatus.INSPECTING };
        updated = addLogEntry(updated, 'CHECK_IN', `Vehicle checked in for inspection by mechanic.`);
        setActiveJob(updated);
        onUpdateRecord(updated);
      } else {
        alert(`Record with plate ${plate} not found.`);
      }
    } catch (error) {
      alert("Error reading license plate.");
    } finally {
      setIsLoading(false);
    }
  };

  const handlePartCapture = async (base64: string) => {
    if (!activeJob) return;
    setIsLoading(true);
    try {
      const partInfo = await identifyPart(base64);
      const simulatedQuotes = await fetchSimulatedQuotes(partInfo.name);
      setQuotes(simulatedQuotes);
      setActiveJob({ ...activeJob, damagedPartPhoto: base64 });
    } catch (error) {
      alert("Error identifying part.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuoteClick = (quote: any) => {
    setSelectedQuote(quote);
    setAdjustedPrice(quote.price);
    setAdjustedLabor(quote.laborEstimate);
  };

  const handleManualPartSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const identifiedPart: Part = {
      id: Math.random().toString(36).substr(2, 5),
      name: manualPart.name,
      price: manualPart.price,
      laborEstimate: manualPart.laborEstimate,
      condition: 'new',
      source: 'Manual Entry'
    };
    
    let updated = {
      ...activeJob!,
      identifiedPart,
      status: JobStatus.AWAITING_APPROVAL
    };
    
    const message = `Manual quote for ${manualPart.name} sent: ${formatCurrency(manualPart.price + manualPart.laborEstimate)}`;
    updated = addLogEntry(updated, 'QUOTE_SENT', message);
    
    setActiveJob(updated);
    onUpdateRecord(updated);
    setIsManualPartInput(false);
    alert(`WhatsApp Update Sent to ${activeJob!.clientName}: ${message}`);
  };

  const finalizeQuoteSelection = () => {
    if (!activeJob || !selectedQuote) return;
    const identifiedPart: Part = {
      id: Math.random().toString(36).substr(2, 5),
      name: activeJob.damagedPartPhoto ? "Identified Part" : "Manual Part",
      price: adjustedPrice,
      laborEstimate: adjustedLabor,
      condition: 'new',
      source: selectedQuote.source,
      photoUrl: activeJob.damagedPartPhoto // Save the captured photo to the part record
    };
    
    let updated = {
      ...activeJob,
      identifiedPart,
      status: JobStatus.AWAITING_APPROVAL
    };
    
    const message = `Quote for ${selectedQuote.source} parts sent: ${formatCurrency(adjustedPrice + adjustedLabor)}`;
    updated = addLogEntry(updated, 'QUOTE_SENT', message);
    
    setActiveJob(updated);
    onUpdateRecord(updated);
    
    // Reset selection
    setSelectedQuote(null);
    
    // Simulate WhatsApp update
    alert(`WhatsApp Update Sent to ${activeJob.clientName}: ${message}`);
  };

  const approveJob = () => {
    if (!activeJob) return;
    let updated = { ...activeJob, status: JobStatus.IN_PROGRESS };
    updated = addLogEntry(updated, 'APPROVAL_RECEIVED', 'Client approved the quote via WhatsApp.');
    setActiveJob(updated);
    onUpdateRecord(updated);
  };

  const startVoiceRecording = () => {
    setIsVoiceInput(true);
    // Simulate speech recognition
    setTimeout(() => {
      setTranscript("Replaced the front brake pads, greased the rotors, and performed a short test drive to ensure the squeaking noise was gone.");
    }, 2000);
  };

  const completeJob = async () => {
    if (!activeJob) return;
    setIsLoading(true);
    try {
      const finalSummary = await generateJobSummary(transcript);
      const laborCost = activeJob.identifiedPart?.laborEstimate || 0;
      const partCost = activeJob.identifiedPart?.price || 0;
      const hours = 2.5; // Simulated
      
      let updated: VehicleRecord = {
        ...activeJob,
        status: JobStatus.COMPLETED,
        paymentStatus: PaymentStatus.PENDING,
        jobDescription: finalSummary,
        hoursSpent: hours,
        finalAmount: laborCost + partCost
      };
      
      updated = addLogEntry(updated, 'JOB_COMPLETED', 'Job completed. Final summary generated and client notified.');
      
      onUpdateRecord(updated);
      setActiveJob(null);
      setTranscript('');
      setIsVoiceInput(false);
      alert("Job Completed and recorded. Client notified via WhatsApp.");
    } catch (error) {
      alert("Error finalizing job.");
    } finally {
      setIsLoading(false);
    }
  };

  const JobStepper = ({ status }: { status: JobStatus }) => {
    const steps = [
      { id: JobStatus.INSPECTING, label: 'Inspecting', icon: 'fa-magnifying-glass' },
      { id: JobStatus.AWAITING_APPROVAL, label: 'Approval', icon: 'fa-paper-plane' },
      { id: JobStatus.IN_PROGRESS, label: 'In Progress', icon: 'fa-gears' },
      { id: JobStatus.COMPLETED, label: 'Completed', icon: 'fa-check-double' },
    ];

    const currentIdx = steps.findIndex(s => s.id === status);

    return (
      <div className="w-full py-4 px-2">
        <div className="flex items-center justify-between relative">
          {/* Progress Line */}
          <div className="absolute top-1/2 left-0 w-full h-0.5 bg-slate-200 -translate-y-1/2 z-0"></div>
          <div 
            className="absolute top-1/2 left-0 h-0.5 bg-blue-500 -translate-y-1/2 z-0 transition-all duration-500"
            style={{ width: `${(currentIdx / (steps.length - 1)) * 100}%` }}
          ></div>

          {steps.map((step, idx) => {
            const isCompleted = idx < currentIdx;
            const isActive = idx === currentIdx;
            
            return (
              <div key={step.id} className="relative z-10 flex flex-col items-center gap-2">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 border-2 ${
                  isCompleted ? 'bg-blue-500 border-blue-500 text-white' : 
                  isActive ? 'bg-white border-blue-500 text-blue-500 shadow-lg shadow-blue-100' : 
                  'bg-white border-slate-200 text-slate-300'
                }`}>
                  <i className={`fa-solid ${isCompleted ? 'fa-check' : step.icon} text-sm`}></i>
                </div>
                <span className={`text-[10px] font-bold uppercase tracking-tighter ${
                  isActive ? 'text-blue-600' : isCompleted ? 'text-slate-500' : 'text-slate-300'
                }`}>
                  {step.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  if (activeJob) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={() => setActiveJob(null)} className="p-2 text-slate-400 hover:text-slate-600 transition-colors">
              <i className="fa-solid fa-chevron-left text-xl"></i>
            </button>
            <div>
              <h2 className="text-xl font-bold text-slate-800">{activeJob.licensePlate}</h2>
              <p className="text-sm text-slate-500">{activeJob.make} {activeJob.model}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Current Status</p>
            <p className="text-sm font-bold text-blue-600">{activeJob.status.replace('_', ' ')}</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
          <JobStepper status={activeJob.status} />
        </div>

        {activeJob.status === JobStatus.INSPECTING && (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
              <h3 className="font-bold text-slate-800 mb-2">Step 1: Inspect Damage</h3>
              <p className="text-sm text-slate-600 mb-6">Take a photo of the damaged part to identify it and get pricing.</p>
              
              {!activeJob.damagedPartPhoto ? (
                <div className="grid grid-cols-2 gap-4">
                  <button 
                    onClick={() => setIsCapturingPart(true)}
                    className="h-40 border-2 border-dashed border-slate-300 rounded-xl flex flex-col items-center justify-center gap-2 hover:bg-slate-50 transition-colors"
                  >
                    <i className="fa-solid fa-camera text-3xl text-slate-300"></i>
                    <span className="text-slate-500 font-medium">Capture Damage</span>
                  </button>
                  <button 
                    onClick={() => setIsManualPartInput(true)}
                    className="h-40 border-2 border-dashed border-slate-300 rounded-xl flex flex-col items-center justify-center gap-2 hover:bg-slate-50 transition-colors"
                  >
                    <i className="fa-solid fa-pen-to-square text-3xl text-slate-300"></i>
                    <span className="text-slate-500 font-medium">Manual Input</span>
                  </button>
                </div>
              ) : (
                <div className="relative rounded-xl overflow-hidden mb-4">
                  <img src={`data:image/jpeg;base64,${activeJob.damagedPartPhoto}`} className="w-full aspect-video object-cover" alt="Damaged Part" />
                  <button onClick={() => setActiveJob({...activeJob, damagedPartPhoto: undefined})} className="absolute top-2 right-2 bg-black/50 text-white p-2 rounded-full">
                    <i className="fa-solid fa-rotate"></i>
                  </button>
                </div>
              )}

              {quotes.length > 0 && !selectedQuote && (
                <div className="mt-6 space-y-4">
                  <h4 className="text-sm font-bold text-slate-700 uppercase tracking-widest">Available Quotes</h4>
                  <div className="grid gap-3">
                    {quotes.map((q, idx) => (
                      <button 
                        key={idx} 
                        onClick={() => handleQuoteClick(q)}
                        className="flex justify-between items-center p-4 border rounded-xl hover:border-blue-500 hover:bg-blue-50 transition-all text-left group"
                      >
                        <div>
                          <p className="font-bold text-slate-800 group-hover:text-blue-700">{q.source}</p>
                          <p className="text-xs text-slate-500">Labor: {formatCurrency(q.laborEstimate)}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-blue-600">{formatCurrency(q.price)}</p>
                          <p className="text-[10px] text-slate-400">PART PRICE</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {selectedQuote && (
                <div className="mt-6 p-6 border-2 border-blue-500 bg-blue-50 rounded-2xl space-y-4">
                  <div className="flex justify-between items-center">
                    <h4 className="font-bold text-blue-900">Adjust Quote: {selectedQuote.source}</h4>
                    <button onClick={() => setSelectedQuote(null)} className="text-blue-400 hover:text-blue-600">
                      <i className="fa-solid fa-xmark"></i>
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-blue-800 uppercase">Part Price</label>
                      <input 
                        type="number" 
                        value={adjustedPrice} 
                        onChange={e => setAdjustedPrice(Number(e.target.value))}
                        className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" 
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-blue-800 uppercase">Labor Estimate</label>
                      <input 
                        type="number" 
                        value={adjustedLabor} 
                        onChange={e => setAdjustedLabor(Number(e.target.value))}
                        className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" 
                      />
                    </div>
                  </div>
                  <div className="pt-2 flex justify-between items-center border-t border-blue-200">
                    <span className="text-sm font-bold text-blue-900">Final Total</span>
                    <span className="text-xl font-black text-blue-700">{formatCurrency(adjustedPrice + adjustedLabor)}</span>
                  </div>
                  <button 
                    onClick={finalizeQuoteSelection}
                    className="w-full bg-blue-600 text-white font-bold py-3 rounded-xl shadow-md hover:bg-blue-700 transition-all"
                  >
                    Send Adjusted Quote to Client
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {activeJob.status === JobStatus.AWAITING_APPROVAL && (
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm text-center">
            <div className="w-16 h-16 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <i className="fa-solid fa-clock-rotate-left text-2xl"></i>
            </div>
            <h3 className="text-xl font-bold text-slate-800 mb-2">Awaiting Client Approval</h3>
            <p className="text-slate-600 mb-8">We've sent the quote to {activeJob.clientName}. Waiting for confirmation via WhatsApp.</p>
            
            <div className="p-4 bg-slate-50 rounded-xl mb-6 text-left">
              <div className="flex justify-between mb-2">
                <span className="text-sm text-slate-500">Estimated Total</span>
                <span className="font-bold text-slate-800">{formatCurrency((activeJob.identifiedPart?.price || 0) + (activeJob.identifiedPart?.laborEstimate || 0))}</span>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <button 
                onClick={approveJob}
                className="w-full bg-blue-600 text-white font-bold py-4 rounded-xl shadow-lg hover:bg-blue-700 active:scale-95 transition-all"
              >
                Client Approved (Manual)
              </button>
              <button className="text-slate-400 font-medium py-2">Resend Notification</button>
            </div>
          </div>
        )}

        {activeJob.status === JobStatus.IN_PROGRESS && (
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <h3 className="font-bold text-slate-800 mb-4">Job in Progress</h3>
            
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-600">Work Logs (Voice or Type)</label>
                <div className="relative">
                  <textarea 
                    className="w-full p-4 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none min-h-[120px] pb-12"
                    placeholder="Describe the work performed..."
                    value={transcript}
                    onChange={(e) => setTranscript(e.target.value)}
                  />
                  <button 
                    onClick={startVoiceRecording}
                    className={`absolute bottom-3 right-3 w-10 h-10 rounded-full flex items-center justify-center shadow-md transition-all ${isVoiceInput ? 'bg-red-500 text-white animate-pulse' : 'bg-blue-100 text-blue-600'}`}
                  >
                    <i className="fa-solid fa-microphone"></i>
                  </button>
                </div>
                {isVoiceInput && <p className="text-[10px] text-red-500 font-bold animate-pulse">LISTENING...</p>}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-500">Hours Worked</label>
                  <input type="number" step="0.5" className="w-full p-3 border rounded-lg" defaultValue="2.5" />
                </div>
                <div className="flex items-end">
                  <button 
                    disabled={isLoading}
                    onClick={completeJob}
                    className="w-full bg-emerald-600 text-white font-bold py-3 rounded-xl shadow-md hover:bg-emerald-700 active:scale-95 transition-all disabled:opacity-50"
                  >
                    {isLoading ? 'Finalizing...' : 'Mark Complete'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {isCapturingPart && (
          <CameraModal 
            title="Identify Damaged Part"
            onCapture={handlePartCapture}
            onClose={() => setIsCapturingPart(false)}
          />
        )}

        {isManualPartInput && (
          <div className="fixed inset-0 z-[60] bg-black/50 flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-bold text-slate-800">Manual Part Entry</h3>
                <button onClick={() => setIsManualPartInput(false)} className="text-slate-400">
                  <i className="fa-solid fa-xmark"></i>
                </button>
              </div>
              <form onSubmit={handleManualPartSubmit} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase">Part Name</label>
                  <input 
                    required
                    className="w-full p-2 border rounded-lg" 
                    value={manualPart.name}
                    onChange={e => setManualPart({...manualPart, name: e.target.value})}
                    placeholder="e.g. Front Brake Pads"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase">Price</label>
                    <input 
                      required
                      type="number"
                      className="w-full p-2 border rounded-lg" 
                      value={manualPart.price}
                      onChange={e => setManualPart({...manualPart, price: Number(e.target.value)})}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase">Labor Est.</label>
                    <input 
                      required
                      type="number"
                      className="w-full p-2 border rounded-lg" 
                      value={manualPart.laborEstimate}
                      onChange={e => setManualPart({...manualPart, laborEstimate: Number(e.target.value)})}
                    />
                  </div>
                </div>
                <button type="submit" className="w-full bg-blue-600 text-white font-bold py-3 rounded-xl shadow-lg">
                  Submit Manual Quote
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="text-center py-10 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-3xl text-white px-6 shadow-xl">
        <div className="w-20 h-20 bg-white/20 rounded-3xl flex items-center justify-center mx-auto mb-6 backdrop-blur-sm">
          <i className="fa-solid fa-magnifying-glass text-3xl"></i>
        </div>
        <h2 className="text-2xl font-bold mb-2">Scan Vehicle</h2>
        <p className="text-blue-100 text-sm mb-8">Take a photo of the license plate to start working or retrieve a record.</p>
        
        <button 
          onClick={() => setIsCapturingPlate(true)}
          className="bg-white text-blue-700 font-bold px-8 py-4 rounded-2xl shadow-xl hover:bg-blue-50 active:scale-95 transition-all inline-flex items-center gap-3"
        >
          <i className="fa-solid fa-camera"></i>
          Launch Camera
        </button>
      </div>

      <div className="space-y-4">
        <h3 className="font-bold text-slate-700 px-1">Recent Assignments</h3>
        {records.filter(r => r.status !== JobStatus.COMPLETED).map(record => (
          <button 
            key={record.id} 
            onClick={() => setActiveJob(record)}
            className="w-full flex items-center gap-4 bg-white p-4 rounded-2xl border border-slate-100 shadow-sm text-left hover:border-blue-300 transition-all"
          >
            <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center text-slate-500">
              <i className="fa-solid fa-car"></i>
            </div>
            <div className="flex-1">
              <p className="font-bold text-slate-800">{record.licensePlate}</p>
              <p className="text-xs text-slate-500">{record.make} {record.model}</p>
            </div>
            <div className={`px-2 py-1 rounded-md text-[9px] font-bold border uppercase ${record.status === JobStatus.PENDING ? 'bg-amber-100 border-amber-200 text-amber-600' : 'bg-blue-100 border-blue-200 text-blue-600'}`}>
              {record.status.replace('_', ' ')}
            </div>
            <i className="fa-solid fa-chevron-right text-slate-300"></i>
          </button>
        ))}
      </div>

      {isCapturingPlate && (
        <CameraModal 
          title="Scan License Plate"
          onCapture={handlePlateCapture}
          onClose={() => setIsCapturingPlate(false)}
        />
      )}

      {isLoading && (
        <div className="fixed inset-0 z-[60] bg-black/50 flex items-center justify-center backdrop-blur-sm">
          <div className="bg-white p-8 rounded-2xl flex flex-col items-center gap-4">
            <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            <p className="font-bold text-slate-700">AI Processing...</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default MechanicWorkflow;
