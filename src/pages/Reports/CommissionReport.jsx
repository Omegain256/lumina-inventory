import { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { Users, Wrench, Smartphone, DollarSign, Calculator, Calendar } from 'lucide-react';

export default function CommissionReport() {
    const [repairs, setRepairs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

    useEffect(() => {
        const q = query(collection(db, 'repairs'), orderBy('createdAt', 'desc'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const repairsData = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                createdAt: doc.data().createdAt?.toDate()
            }));
            setRepairs(repairsData);
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    // Filter repairs for the selected date (Summary / Evening report)
    const filteredRepairs = repairs.filter(job => {
        if (!job.createdAt) return false;
        const jobDate = job.createdAt.toISOString().split('T')[0];
        return jobDate === selectedDate;
    });

    const technicianStats = filteredRepairs.reduce((acc, job) => {
        if (!job.technician) return acc;
        const tech = job.technician;
        const cost = Number(job.estimatedCost) || 0;
        const commPercent = Number(job.commissionPercentage) || 0;
        const due = (cost * commPercent) / 100;

        if (!acc[tech]) {
            acc[tech] = { totalCharged: 0, totalDue: 0, jobCount: 0 };
        }
        acc[tech].totalCharged += cost;
        acc[tech].totalDue += due;
        acc[tech].jobCount += 1;
        return acc;
    }, {});

    const totalCommissionDue = Object.values(technicianStats).reduce((sum, tech) => sum + tech.totalDue, 0);

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-white/60 flex items-center gap-3">
                        Commission Report
                    </h1>
                    <p className="text-white/50 mt-1">Summary of earnings and amounts due for service providers.</p>
                </div>
                <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl p-2 px-4 text-white">
                    <Calendar className="w-4 h-4 text-primary" />
                    <span className="text-xs font-medium text-white/50">Report Date:</span>
                    <input
                        type="date"
                        value={selectedDate}
                        onChange={(e) => setSelectedDate(e.target.value)}
                        className="bg-transparent border-none text-white text-sm focus:outline-none [color-scheme:dark]"
                    />
                </div>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="glass-panel p-6 flex flex-col gap-3 relative overflow-hidden group">
                    <div className="absolute -right-4 -top-4 w-24 h-24 bg-gradient-to-br from-primary to-accent opacity-10 rounded-full blur-xl" />
                    <Calculator className="w-8 h-8 text-primary mb-2" />
                    <h3 className="text-white/50 text-sm font-medium italic">Commission to be given ({selectedDate === new Date().toISOString().split('T')[0] ? 'Today' : selectedDate})</h3>
                    <div className="text-3xl font-bold text-white font-mono">
                        Ksh {totalCommissionDue.toLocaleString()}
                    </div>
                </div>
                <div className="glass-panel p-6 flex flex-col gap-3 relative overflow-hidden group">
                    <div className="absolute -right-4 -top-4 w-24 h-24 bg-gradient-to-br from-blue-500 to-cyan-500 opacity-10 rounded-full blur-xl" />
                    <Users className="w-8 h-8 text-blue-400 mb-2" />
                    <h3 className="text-white/50 text-sm font-medium">Active Technicians</h3>
                    <div className="text-3xl font-bold text-white">
                        {Object.keys(technicianStats).length}
                    </div>
                </div>
                <div className="glass-panel p-6 flex flex-col gap-3 relative overflow-hidden group">
                    <div className="absolute -right-4 -top-4 w-24 h-24 bg-gradient-to-br from-green-500 to-emerald-500 opacity-10 rounded-full blur-xl" />
                    <Wrench className="w-8 h-8 text-green-400 mb-2" />
                    <h3 className="text-white/50 text-sm font-medium">Total Repair Jobs</h3>
                    <div className="text-3xl font-bold text-white">
                        {repairs.length}
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Detailed Table */}
                <div className="lg:col-span-2 glass-panel overflow-hidden">
                    <div className="p-6 border-b border-white/10 flex justify-between items-center">
                        <h3 className="text-lg font-bold text-white">Recent Commission History</h3>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-white/10 bg-white/5 text-white/50 text-xs uppercase tracking-wider">
                                    <th className="p-4 font-medium">Technician</th>
                                    <th className="p-4 font-medium">Service / Device</th>
                                    <th className="p-4 font-medium">Total Charged</th>
                                    <th className="p-4 font-medium">Comm %</th>
                                    <th className="p-4 font-medium text-right">Amount Due</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5 text-sm">
                                {filteredRepairs.length === 0 ? (
                                    <tr>
                                        <td colSpan="5" className="p-8 text-center text-white/40 italic">No commission data found for this date.</td>
                                    </tr>
                                ) : (
                                    filteredRepairs.map(job => (
                                        <tr key={job.id} className="hover:bg-white/[0.02] transition-colors border-l-2 border-transparent hover:border-primary">
                                            <td className="p-4">
                                                <div className="font-medium text-white">{job.technician || 'Unassigned'}</div>
                                                <div className="text-[10px] text-white/30 flex items-center gap-1 mt-1">
                                                    <Calendar className="w-3 h-3" />
                                                    {job.createdAt ? job.createdAt.toLocaleDateString() : 'N/A'}
                                                </div>
                                            </td>
                                            <td className="p-4">
                                                <div className="text-white/80 flex items-center gap-2">
                                                    <Smartphone className="w-3 h-3 text-primary" />
                                                    {job.mobileType || job.deviceModel}
                                                </div>
                                                <div className="text-[10px] text-white/40 mt-1 flex gap-2">
                                                    <span className="bg-white/5 px-1.5 py-0.5 rounded italic">{job.serviceCategory || 'Repair'}</span>
                                                    <span>-</span>
                                                    <span>{job.repairType || 'General'}</span>
                                                </div>
                                            </td>
                                            <td className="p-4 font-mono text-white/70">
                                                Ksh {(Number(job.estimatedCost) || 0).toLocaleString()}
                                            </td>
                                            <td className="p-4 text-white/60">
                                                {job.commissionPercentage || 0}%
                                            </td>
                                            <td className="p-4 text-right">
                                                <div className="font-bold text-primary font-mono bg-primary/10 px-2 py-1 rounded inline-block">
                                                    Ksh {((Number(job.estimatedCost) * (Number(job.commissionPercentage) || 0)) / 100).toLocaleString()}
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Technician Summary Side Panel */}
                <div className="glass-panel p-6 flex flex-col gap-6">
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                        <Users className="w-5 h-5 text-primary" />
                        Technician Summary
                    </h3>
                    <div className="space-y-4">
                        {Object.entries(technicianStats).length === 0 ? (
                            <p className="text-white/30 text-center py-8 italic text-sm">No summaries available.</p>
                        ) : (
                            Object.entries(technicianStats).map(([name, stats]) => (
                                <div key={name} className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-3">
                                    <div className="flex justify-between items-center">
                                        <span className="font-bold text-white">{name}</span>
                                        <span className="text-[10px] bg-primary/20 text-primary px-2 py-0.5 rounded-full border border-primary/20">
                                            {stats.jobCount} Jobs
                                        </span>
                                    </div>
                                    <div className="flex justify-between text-xs">
                                        <span className="text-white/40">Total Charged</span>
                                        <span className="text-white font-mono">Ksh {stats.totalCharged.toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between items-center pt-2 border-t border-white/5">
                                        <span className="text-sm font-medium text-white/60">Balance to be given</span>
                                        <span className="text-lg font-bold text-primary font-mono">Ksh {stats.totalDue.toLocaleString()}</span>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
