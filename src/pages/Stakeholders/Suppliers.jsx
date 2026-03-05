import { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot, addDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { Plus, Building, Mail, Phone, MapPin, Trash2, Edit } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Suppliers() {
    const [suppliers, setSuppliers] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        address: '',
        contactPerson: ''
    });

    useEffect(() => {
        const q = query(collection(db, 'suppliers'), orderBy('createdAt', 'desc'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            setSuppliers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        });
        return () => unsubscribe();
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await addDoc(collection(db, 'suppliers'), {
                ...formData,
                createdAt: serverTimestamp()
            });
            toast.success("Supplier added successfully!");
            setIsModalOpen(false);
            setFormData({ name: '', email: '', phone: '', address: '', contactPerson: '' });
        } catch (error) {
            console.error("Error adding supplier:", error);
            toast.error("Failed to add supplier.");
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to delete this supplier?")) return;
        try {
            await deleteDoc(doc(db, 'suppliers', id));
            toast.success("Supplier deleted.");
        } catch (error) {
            console.error("Error deleting supplier:", error);
            toast.error("Failed to delete.");
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-white/60 flex items-center gap-3">
                        Suppliers
                    </h1>
                    <p className="text-white/50 mt-1">Manage external vendors and wholesale partners.</p>
                </div>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="bg-primary text-primary-foreground px-4 py-2.5 rounded-xl font-medium flex items-center gap-2 hover:opacity-90 transition-opacity shadow-[0_0_20px_rgba(11,211,211,0.2)]"
                >
                    <Plus className="w-5 h-5" />
                    Add Supplier
                </button>
            </header>

            <div className="glass-panel overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-white/10 bg-white/5 text-white/50 text-sm">
                                <th className="p-4 font-medium">Company Name</th>
                                <th className="p-4 font-medium">Contact Person</th>
                                <th className="p-4 font-medium">Contact Info</th>
                                <th className="p-4 font-medium text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {suppliers.length === 0 ? (
                                <tr>
                                    <td colSpan="4" className="p-8 text-center text-white/40">No suppliers found.</td>
                                </tr>
                            ) : (
                                suppliers.map(s => (
                                    <tr key={s.id} className="hover:bg-white/[0.02] transition-colors group">
                                        <td className="p-4">
                                            <div className="flex items-center gap-3 text-white font-medium">
                                                <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center border border-white/10">
                                                    <Building className="w-4 h-4 text-white/50" />
                                                </div>
                                                {s.name}
                                            </div>
                                        </td>
                                        <td className="p-4 text-white/80">{s.contactPerson || '-'}</td>
                                        <td className="p-4 text-white/60 text-sm">
                                            <div className="flex flex-col gap-1">
                                                <div className="flex items-center gap-2"><Phone className="w-3 h-3" /> {s.phone || '-'}</div>
                                                <div className="flex items-center gap-2"><Mail className="w-3 h-3" /> {s.email || '-'}</div>
                                            </div>
                                        </td>
                                        <td className="p-4 text-right">
                                            <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button className="p-1.5 text-white/40 hover:text-white hover:bg-white/10 rounded-lg transition-colors"><Edit className="w-4 h-4" /></button>
                                                <button onClick={() => handleDelete(s.id)} className="p-1.5 text-white/40 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"><Trash2 className="w-4 h-4" /></button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {isModalOpen && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-[#1a1a1a] rounded-2xl w-full max-w-md border border-white/10 shadow-2xl">
                        <div className="p-6 border-b border-white/10 flex justify-between items-center">
                            <h2 className="text-xl font-bold text-white">Add Supplier</h2>
                            <button onClick={() => setIsModalOpen(false)} className="text-white/50 hover:text-white">✕</button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-white/70 mb-1.5">Company / Vendor Name *</label>
                                <input type="text" required value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-primary/50" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-white/70 mb-1.5">Contact Person</label>
                                <input type="text" value={formData.contactPerson} onChange={e => setFormData({ ...formData, contactPerson: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-primary/50" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-white/70 mb-1.5">Phone Number</label>
                                <input type="tel" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-primary/50" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-white/70 mb-1.5">Email Address</label>
                                <input type="email" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-primary/50" />
                            </div>
                            <div className="flex gap-3 pt-4 border-t border-white/10">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 px-4 py-3 rounded-xl font-medium text-white/70 hover:bg-white/10">Cancel</button>
                                <button type="submit" disabled={loading} className="flex-1 bg-primary text-black px-4 py-3 rounded-xl font-bold bg-white hover:bg-white/90">{loading ? 'Saving...' : 'Save Supplier'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
