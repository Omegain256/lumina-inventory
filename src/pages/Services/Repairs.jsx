import { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot, addDoc, updateDoc, doc, serverTimestamp, deleteDoc } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { Wrench, Plus, User, Smartphone, Calendar, CheckCircle2, CircleDashed, Clock, AlertCircle, Edit, Trash2, Printer } from 'lucide-react';
import toast from 'react-hot-toast';
import Receipt from '../../components/shared/Receipt';

export default function Repairs() {
    const [repairs, setRepairs] = useState([]);
    const [customers, setCustomers] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [showReceipt, setShowReceipt] = useState(null); // stores job data for receipt

    const [formData, setFormData] = useState({
        customerId: '',
        deviceModel: '',
        imei: '',
        issueDescription: '',
        estimatedCost: '',
        technician: '',
        status: 'Pending',
        repairType: '',
        serviceCategory: 'Mobile Repair',
        mobileType: '',
        commissionPercentage: '0'
    });

    const technicians = ['John Doe', 'Jane Smith', 'Mike Johnson'];
    const statuses = ['Pending', 'In Progress', 'Waiting for Parts', 'Completed', 'Delivered'];

    useEffect(() => {
        const unsubR = onSnapshot(query(collection(db, 'repairs'), orderBy('createdAt', 'desc')), (snap) => {
            setRepairs(snap.docs.map(d => ({ id: d.id, ...d.data(), createdAt: d.data().createdAt?.toDate() })));
        });
        const unsubC = onSnapshot(query(collection(db, 'customers'), orderBy('name')), (snap) => {
            setCustomers(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        });
        return () => { unsubR(); unsubC(); };
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await addDoc(collection(db, 'repairs'), {
                ...formData,
                estimatedCost: Number(formData.estimatedCost),
                createdAt: serverTimestamp()
            });
            toast.success("Repair job created!");
            setIsModalOpen(false);
            setFormData({ customerId: '', deviceModel: '', imei: '', issueDescription: '', estimatedCost: '', technician: '', status: 'Pending', repairType: '', commissionPercentage: '0', serviceCategory: 'Mobile Repair', mobileType: '' });
        } catch (error) {
            console.error("Error adding repair:", error);
            toast.error("Failed to create repair job.");
        } finally {
            setLoading(false);
        }
    };

    const handleStatusChange = async (repairId, newStatus) => {
        try {
            await updateDoc(doc(db, 'repairs', repairId), { status: newStatus });
            toast.success(`Status updated to ${newStatus}`);
        } catch (error) {
            console.error("Error updating status:", error);
            toast.error("Failed to update status.");
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Delete this repair record?")) return;
        try {
            await deleteDoc(doc(db, 'repairs', id));
            toast.success("Deleted successfully.");
        } catch (error) {
            console.error("Error deleting:", error);
            toast.error("Failed to delete.");
        }
    };

    const StatusBadge = ({ status }) => {
        switch (status) {
            case 'Completed': return <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-green-500/10 text-green-400 border border-green-500/20 flex items-center gap-1 w-fit"><CheckCircle2 className="w-3 h-3" /> Completed</span>;
            case 'In Progress': return <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-blue-500/10 text-blue-400 border border-blue-500/20 flex items-center gap-1 w-fit"><CircleDashed className="w-3 h-3 animate-spin-slow" /> In Progress</span>;
            case 'Waiting for Parts': return <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-orange-500/10 text-orange-400 border border-orange-500/20 flex items-center gap-1 w-fit"><AlertCircle className="w-3 h-3" /> Waiting for Parts</span>;
            case 'Delivered': return <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-white/10 text-white/70 border border-white/20 flex items-center gap-1 w-fit"><CheckCircle2 className="w-3 h-3" /> Delivered</span>;
            default: return <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-white/5 text-white/50 border border-white/10 flex items-center gap-1 w-fit"><Clock className="w-3 h-3" /> Pending</span>;
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-white/60 flex items-center gap-3">
                        Repairs
                    </h1>
                    <p className="text-white/50 mt-1">Manage technician workflows and customer device repairs.</p>
                </div>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="bg-primary text-primary-foreground px-4 py-2.5 rounded-xl font-medium flex items-center gap-2 hover:opacity-90 transition-opacity flex-shrink-0"
                >
                    <Plus className="w-5 h-5" />
                    New Repair Job
                </button>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {repairs.length === 0 ? (
                    <div className="col-span-full glass-panel p-12 flex flex-col items-center justify-center text-white/30 gap-4">
                        <Wrench className="w-16 h-16 opacity-50" />
                        <p>No active repair jobs.</p>
                    </div>
                ) : (
                    repairs.map(job => (
                        <div key={job.id} className="glass-panel p-5 flex flex-col gap-4 relative group">
                            <div className="flex justify-between items-start">
                                <StatusBadge status={job.status} />
                                <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                                    <button onClick={() => handleDelete(job.id)} className="text-white/40 hover:text-red-400"><Trash2 className="w-4 h-4" /></button>
                                </div>
                            </div>

                            <div>
                                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                    <Smartphone className="w-5 h-5 text-primary" /> {job.deviceModel}
                                </h3>
                                <p className="text-white/40 text-xs font-mono mt-1">IMEI: {job.imei || 'N/A'}</p>
                            </div>

                            <p className="text-sm text-white/70 line-clamp-2 min-h-[40px]">
                                {job.issueDescription}
                            </p>

                            <div className="grid grid-cols-2 gap-4 text-xs pt-4 border-t border-white/5">
                                <div className="space-y-1 text-white/50">
                                    <span className="flex items-center gap-1"><User className="w-3 h-3" /> Customer</span>
                                    <span className="text-white font-medium block truncate">
                                        {customers.find(c => c.id === job.customerId)?.name || 'Unknown'}
                                    </span>
                                </div>
                                <div className="space-y-1 text-white/50 text-right">
                                    <span className="flex items-center gap-1 justify-end"><Wrench className="w-3 h-3" /> Tech</span>
                                    <span className="text-white font-medium block truncate">{job.technician || 'Unassigned'}</span>
                                </div>
                            </div>

                            {job.repairType && (
                                <div className="text-[10px] bg-white/5 p-3 rounded-lg space-y-2">
                                    <div className="flex justify-between items-center text-white/40">
                                        <span>Category: {job.serviceCategory || 'N/A'}</span>
                                        <span>Type: {job.repairType}</span>
                                    </div>
                                    <div className="flex justify-between items-center pt-2 border-t border-white/5">
                                        <span className="text-white/30 italic">Tech Cut ({job.commissionPercentage}%):</span>
                                        <span className="text-primary font-bold font-mono text-xs">
                                            Ksh {((Number(job.estimatedCost) * (Number(job.commissionPercentage) || 0)) / 100).toLocaleString()}
                                        </span>
                                    </div>
                                </div>
                            )}

                            <div className="flex items-center justify-between pt-4 mt-auto gap-2">
                                <button
                                    onClick={() => setShowReceipt(job)}
                                    className="p-2 hover:bg-white/10 rounded-lg text-white/50 hover:text-primary transition-colors border border-white/10"
                                    title="Print Receipt"
                                >
                                    <Printer className="w-4 h-4" />
                                </button>
                                <select
                                    value={job.status}
                                    onChange={(e) => handleStatusChange(job.id, e.target.value)}
                                    className="bg-white/5 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-white/30 appearance-none flex-1"
                                >
                                    {statuses.map(s => <option key={s} value={s}>{s}</option>)}
                                </select>
                                <div className="font-mono text-white text-sm whitespace-nowrap">
                                    Ksh {job.estimatedCost.toLocaleString()}
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {showReceipt && (
                <Receipt
                    data={showReceipt}
                    onClose={() => setShowReceipt(null)}
                />
            )}

            {
                isModalOpen && (
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                        <div className="bg-[#1a1a1a] rounded-2xl w-full max-w-2xl border border-white/10 shadow-2xl overflow-y-auto max-h-[90vh]">
                            <div className="p-6 border-b border-white/10 flex justify-between items-center sticky top-0 bg-[#1a1a1a] z-10">
                                <h2 className="text-xl font-bold text-white">Create Repair Job</h2>
                                <button onClick={() => setIsModalOpen(false)} className="text-white/50 hover:text-white">✕</button>
                            </div>
                            <form onSubmit={handleSubmit} className="p-6 space-y-6">

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-white/70 mb-1.5">Customer *</label>
                                        <select required value={formData.customerId} onChange={e => setFormData({ ...formData, customerId: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary appearance-none">
                                            <option value="">Select Customer</option>
                                            {customers.map(c => <option key={c.id} value={c.id}>{c.name} ({c.phone})</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-white/70 mb-1.5">Assigned Technician</label>
                                        <select value={formData.technician} onChange={e => setFormData({ ...formData, technician: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary appearance-none">
                                            <option value="">Unassigned</option>
                                            {technicians.map(t => <option key={t} value={t}>{t}</option>)}
                                        </select>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-white/70 mb-1.5">Device Model *</label>
                                        <input type="text" required placeholder="e.g. iPhone 13 Pro" value={formData.deviceModel} onChange={e => setFormData({ ...formData, deviceModel: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-white/70 mb-1.5">IMEI / Serial Number</label>
                                        <input type="text" placeholder="Optional" value={formData.imei} onChange={e => setFormData({ ...formData, imei: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary font-mono" />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-white/70 mb-1.5">Service Category *</label>
                                        <input type="text" required placeholder="e.g. Mobile Repair" value={formData.serviceCategory} onChange={e => setFormData({ ...formData, serviceCategory: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-white/70 mb-1.5">Brand / Mobile Type *</label>
                                        <input type="text" required placeholder="e.g. Samsung" value={formData.mobileType} onChange={e => setFormData({ ...formData, mobileType: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary" />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-white/70 mb-1.5">Type of Repair *</label>
                                        <input type="text" required placeholder="e.g. Screen Replacement" value={formData.repairType} onChange={e => setFormData({ ...formData, repairType: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-white/70 mb-1.5">Commission (%) *</label>
                                        <input type="number" required min="0" max="100" value={formData.commissionPercentage} onChange={e => setFormData({ ...formData, commissionPercentage: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary font-mono" />
                                    </div>
                                </div>

                                <div className="p-4 rounded-xl bg-primary/5 border border-primary/20 flex justify-between items-center">
                                    <div>
                                        <p className="text-[10px] text-primary/50 uppercase font-bold tracking-wider">Technician's Cut</p>
                                        <p className="text-white/40 text-[10px] mt-0.5">Calculated from total amount</p>
                                    </div>
                                    <div className="text-right">
                                        <span className="text-2xl font-bold text-primary font-mono block">
                                            Ksh {((Number(formData.estimatedCost) * (Number(formData.commissionPercentage) || 0)) / 100).toLocaleString()}
                                        </span>
                                        <span className="text-[10px] text-white/30">Immediate Payout</span>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-white/70 mb-1.5">Issue Description *</label>
                                    <textarea required rows="3" placeholder="Describe the problem, visible damage, etc." value={formData.issueDescription} onChange={e => setFormData({ ...formData, issueDescription: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary resize-none" />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-white/70 mb-1.5">Estimated Cost (Ksh) *</label>
                                    <input type="number" required min="0" value={formData.estimatedCost} onChange={e => setFormData({ ...formData, estimatedCost: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary text-xl font-mono" />
                                </div>

                                <div className="flex gap-3 pt-4 border-t border-white/10">
                                    <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 px-4 py-3 rounded-xl font-medium text-white/70 hover:bg-white/10">Cancel</button>
                                    <button type="submit" disabled={loading} className="flex-1 bg-primary text-black px-4 py-3 rounded-xl font-bold bg-white hover:bg-white/90 shadow-[0_0_20px_rgba(11,211,211,0.2)]">
                                        {loading ? 'Creating...' : 'Create Job'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )
            }
        </div >
    );
}
