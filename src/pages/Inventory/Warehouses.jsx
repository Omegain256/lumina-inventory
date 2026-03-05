import { useState, useEffect } from 'react';
import { supabase } from '../../config/supabase';
import { Warehouse, Plus, MapPin, Package, Edit, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Warehouses() {
    const [warehouses, setWarehouses] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        location: '',
        capacity: ''
    });

    const fetchData = async () => {
        const { data, error } = await supabase
            .from('warehouses')
            .select('*')
            .order('created_at', { ascending: false });
        if (data) setWarehouses(data);
    };

    useEffect(() => {
        fetchData();
        const channel = supabase.channel('warehouses').on('postgres_changes', { event: '*', schema: 'public', table: 'warehouses' }, fetchData).subscribe();
        return () => supabase.removeChannel(channel);
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const { error } = await supabase.from('warehouses').insert({
                ...formData,
                capacity: Number(formData.capacity)
            });
            if (error) throw error;
            toast.success("Warehouse added successfully!");
            setIsModalOpen(false);
            setFormData({ name: '', location: '', capacity: '' });
        } catch (error) {
            console.error("Error adding warehouse:", error);
            toast.error("Failed to add warehouse.");
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to delete this warehouse?")) return;
        try {
            const { error } = await supabase.from('warehouses').delete().eq('id', id);
            if (error) throw error;
            toast.success("Warehouse deleted.");
        } catch (error) {
            console.error("Error deleting warehouse:", error);
            toast.error("Failed to delete.");
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-white/60 flex items-center gap-3">
                        Warehouses
                    </h1>
                    <p className="text-white/50 mt-1">Manage bulk storage locations and depots.</p>
                </div>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="bg-primary text-primary-foreground px-4 py-2.5 rounded-xl font-medium flex items-center gap-2 hover:opacity-90 transition-opacity flex-shrink-0"
                >
                    <Plus className="w-5 h-5" />
                    Add Warehouse
                </button>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {warehouses.length === 0 ? (
                    <div className="col-span-full glass-panel p-12 flex flex-col items-center justify-center text-white/30 gap-4">
                        <Warehouse className="w-16 h-16 opacity-50" />
                        <p>No warehouses configured.</p>
                    </div>
                ) : (
                    warehouses.map(wh => (
                        <div key={wh.id} className="glass-panel p-5 flex flex-col gap-4 group">
                            <div className="flex justify-between items-start">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center border border-orange-500/20">
                                        <Warehouse className="w-5 h-5 text-orange-400" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-white text-lg">{wh.name}</h3>
                                        <p className="text-xs text-white/40">Storage Depot</p>
                                    </div>
                                </div>
                                <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                                    <button onClick={() => handleDelete(wh.id)} className="p-1.5 text-white/40 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"><Trash2 className="w-4 h-4" /></button>
                                </div>
                            </div>

                            <div className="space-y-2 mt-2">
                                <div className="flex items-center gap-2 text-sm text-white/70">
                                    <MapPin className="w-4 h-4 text-white/40" />
                                    <span className="truncate">{wh.location || 'No location set'}</span>
                                </div>
                                <div className="flex items-center gap-2 text-sm text-white/70">
                                    <Package className="w-4 h-4 text-white/40" />
                                    <span>Capacity: {wh.capacity || 0} units</span>
                                </div>
                            </div>

                            <div className="pt-4 border-t border-white/5 flex justify-between items-center mt-auto">
                                <div className="w-full bg-white/5 h-2 rounded-full overflow-hidden">
                                    {/* Mock usage bar */}
                                    <div className="bg-orange-400 w-1/3 h-full rounded-full"></div>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {isModalOpen && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-[#1a1a1a] rounded-2xl w-full max-w-md border border-white/10 shadow-2xl">
                        <div className="p-6 border-b border-white/10 flex justify-between items-center">
                            <h2 className="text-xl font-bold text-white">Add Warehouse</h2>
                            <button onClick={() => setIsModalOpen(false)} className="text-white/50 hover:text-white">✕</button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-white/70 mb-1.5">Warehouse Name *</label>
                                <input type="text" required value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-white/70 mb-1.5">Physical Location</label>
                                <input type="text" value={formData.location} onChange={e => setFormData({ ...formData, location: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-white/70 mb-1.5">Max Storage Capacity (units) *</label>
                                <input type="number" required min="1" value={formData.capacity} onChange={e => setFormData({ ...formData, capacity: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary" />
                            </div>
                            <div className="flex gap-3 pt-4 border-t border-white/10">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 px-4 py-3 rounded-xl font-medium text-white/70 hover:bg-white/10">Cancel</button>
                                <button type="submit" disabled={loading} className="flex-1 bg-primary text-black px-4 py-3 rounded-xl font-bold bg-white hover:bg-white/90">
                                    {loading ? 'Saving...' : 'Save Warehouse'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
