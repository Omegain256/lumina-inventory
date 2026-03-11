import { useState, useEffect } from 'react';
import { supabase } from '../../config/supabase';
import { Store, Plus, MapPin, Phone, Edit, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Shops() {
    const [shops, setShops] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        location: '',
        phone: '',
        manager: ''
    });

    const fetchData = async () => {
        const { data } = await supabase
            .from('shops')
            .select('*')
            .order('created_at', { ascending: false });
        if (data) setShops(data);
    };

    useEffect(() => {
        fetchData();
        const channel = supabase.channel('shops').on('postgres_changes', { event: '*', schema: 'public', table: 'shops' }, fetchData).subscribe();
        return () => supabase.removeChannel(channel);
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const { error } = await supabase.from('shops').insert(formData);
            if (error) throw error;
            toast.success("Shop added successfully!");
            setIsModalOpen(false);
            setFormData({ name: '', location: '', phone: '', manager: '' });
        } catch (error) {
            console.error("Error adding shop:", error);
            toast.error("Failed to add shop.");
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to delete this shop?")) return;
        try {
            const { error } = await supabase.from('shops').delete().eq('id', id);
            if (error) throw error;
            toast.success("Shop deleted.");
        } catch (error) {
            console.error("Error deleting shop:", error);
            toast.error("Failed to delete.");
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-white/60 flex items-center gap-3">
                        Shops
                    </h1>
                    <p className="text-white/50 mt-1">Manage standard retail locations and branches.</p>
                </div>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="bg-primary text-primary-foreground px-4 py-2.5 rounded-xl font-medium flex items-center gap-2 hover:opacity-90 transition-opacity flex-shrink-0"
                >
                    <Plus className="w-5 h-5" />
                    Add Shop
                </button>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {shops.length === 0 ? (
                    <div className="col-span-full glass-panel p-12 flex flex-col items-center justify-center text-white/30 gap-4">
                        <Store className="w-16 h-16 opacity-50" />
                        <p>No retail shops configured.</p>
                    </div>
                ) : (
                    shops.map(shop => (
                        <div key={shop.id} className="glass-panel p-5 flex flex-col gap-4 group">
                            <div className="flex justify-between items-start">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center border border-primary/30">
                                        <Store className="w-5 h-5 text-primary" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-white text-lg">{shop.name}</h3>
                                        <p className="text-xs text-white/40">Shop Branch</p>
                                    </div>
                                </div>
                                <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                                    <button onClick={() => handleDelete(shop.id)} className="p-1.5 text-white/40 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"><Trash2 className="w-4 h-4" /></button>
                                </div>
                            </div>

                            <div className="space-y-2 mt-2">
                                <div className="flex items-center gap-2 text-sm text-white/70">
                                    <MapPin className="w-4 h-4 text-white/40" />
                                    <span className="truncate">{shop.location || 'No location set'}</span>
                                </div>
                                <div className="flex items-center gap-2 text-sm text-white/70">
                                    <Phone className="w-4 h-4 text-white/40" />
                                    <span>{shop.phone || 'No phone set'}</span>
                                </div>
                            </div>

                            <div className="pt-4 border-t border-white/5 flex justify-between items-center text-xs mt-auto">
                                <span className="text-white/40">Manager</span>
                                <span className="font-medium text-white/90">{shop.manager || 'Unassigned'}</span>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {isModalOpen && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-[#1a1a1a] rounded-2xl w-full max-w-md border border-white/10 shadow-2xl">
                        <div className="p-6 border-b border-white/10 flex justify-between items-center">
                            <h2 className="text-xl font-bold text-white">Add Shop Location</h2>
                            <button onClick={() => setIsModalOpen(false)} className="text-white/50 hover:text-white">✕</button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-white/70 mb-1.5">Shop Name *</label>
                                <input type="text" required value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-white/70 mb-1.5">Physical Location</label>
                                <input type="text" value={formData.location} onChange={e => setFormData({ ...formData, location: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-white/70 mb-1.5">Phone Number</label>
                                <input type="tel" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-white/70 mb-1.5">Branch Manager</label>
                                <input type="text" value={formData.manager} onChange={e => setFormData({ ...formData, manager: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary" />
                            </div>
                            <div className="flex gap-3 pt-4 border-t border-white/10">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 px-4 py-3 rounded-xl font-medium text-white/70 hover:bg-white/10">Cancel</button>
                                <button type="submit" disabled={loading} className="flex-1 bg-primary text-black px-4 py-3 rounded-xl font-bold bg-white hover:bg-white/90">
                                    {loading ? 'Saving...' : 'Save Shop'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
