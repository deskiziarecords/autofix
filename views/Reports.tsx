
import React from 'react';
import { JobStatus, VehicleRecord, PaymentStatus } from '../types';
import { formatCurrency } from '../utils/helpers';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

interface ReportsProps {
  records: VehicleRecord[];
}

const Reports: React.FC<ReportsProps> = ({ records }) => {
  const completedJobs = records.filter(r => r.status === JobStatus.COMPLETED);
  const totalRevenue = completedJobs.reduce((acc, curr) => acc + (curr.finalAmount || 0), 0);
  const totalHours = completedJobs.reduce((acc, curr) => acc + (curr.hoursSpent || 0), 0);
  
  const statusData = [
    { name: 'Pending', value: records.filter(r => r.status === JobStatus.PENDING).length },
    { name: 'Progress', value: records.filter(r => r.status === JobStatus.IN_PROGRESS).length },
    { name: 'Awaiting', value: records.filter(r => r.status === JobStatus.AWAITING_APPROVAL).length },
    { name: 'Completed', value: completedJobs.length },
  ].filter(d => d.value > 0);

  const COLORS = ['#F59E0B', '#3B82F6', '#8B5CF6', '#10B981'];

  return (
    <div className="space-y-8 pb-12">
      <div>
        <h2 className="text-2xl font-bold text-slate-800">Business Reports</h2>
        <p className="text-slate-500">Analyze workshop performance and financials</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <p className="text-slate-400 text-sm font-semibold mb-1 uppercase tracking-wider">Total Revenue</p>
          <p className="text-3xl font-black text-slate-900">{formatCurrency(totalRevenue)}</p>
          <p className="text-[10px] text-emerald-500 font-bold mt-2">
            <i className="fa-solid fa-arrow-up mr-1"></i>
            12.5% from last month
          </p>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <p className="text-slate-400 text-sm font-semibold mb-1 uppercase tracking-wider">Jobs Completed</p>
          <p className="text-3xl font-black text-slate-900">{completedJobs.length}</p>
          <p className="text-[10px] text-slate-500 font-bold mt-2">
            Average 2.4 jobs / day
          </p>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <p className="text-slate-400 text-sm font-semibold mb-1 uppercase tracking-wider">Work Hours</p>
          <p className="text-3xl font-black text-slate-900">{totalHours.toFixed(1)}h</p>
          <p className="text-[10px] text-slate-500 font-bold mt-2">
            Estimated billable: {formatCurrency(totalHours * 120)}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 h-80">
          <h3 className="font-bold text-slate-700 mb-6">Job Status Distribution</h3>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={statusData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={5}
                dataKey="value"
              >
                {statusData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <h3 className="font-bold text-slate-700 mb-6">Recent Completions</h3>
          <div className="space-y-4">
            {completedJobs.slice(0, 5).map(job => (
              <div key={job.id} className="flex justify-between items-center p-3 hover:bg-slate-50 rounded-xl transition-colors">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-bold text-slate-800 text-sm">{job.licensePlate}</p>
                    <span className={`px-2 py-0.5 rounded text-[8px] font-bold border ${job.paymentStatus === PaymentStatus.PAID ? 'bg-emerald-50 border-emerald-100 text-emerald-600' : 'bg-amber-50 border-amber-100 text-amber-600'}`}>
                      {job.paymentStatus}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-500 uppercase font-bold">{job.clientName}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-emerald-600">{formatCurrency(job.finalAmount || 0)}</p>
                  <p className="text-[10px] text-slate-400">{new Date(job.createdAt).toLocaleDateString()}</p>
                </div>
              </div>
            ))}
            {completedJobs.length === 0 && (
              <div className="py-10 text-center text-slate-400">
                <p>No completed jobs to show.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Reports;
