import { useState, useEffect } from 'react';
import { supabase } from '../config/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Plus, ArrowRight, CheckCircle2, Clock } from 'lucide-react';
import CreateTransferModal from '../components/transfers/CreateTransferModal';

export default function Transfers() {
    const [transfers, setTransfers] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const fetchData = async () => {
        const { data, error } = await supabase
            .from('transfers')
            .select('*, product:products(name)')
            .order('created_at', { ascending: false });
        if (data) setTransfers(data.map(t => ({ ...t, createdAt: new Date(t.created_at) })));
    };

    useEffect(() => {
        fetchData();
        const channel = supabase.channel('transfers').on('postgres_changes', { event: '*', schema: 'public', table: 'transfers' }, fetchData).subscribe();
        return () => supabase.removeChannel(channel);
    }, []);

    const markCompleted = async (transfer) => {
        try {
            // In a real app, this should be a Supabase function or a transaction
            // For now, we'll do sequential updates (not ideal for race conditions)

            for (const item of transfer.items) {
                // Decrement from origin
                const { data: fromInv } = await supabase.from('inventory').select('quantity').eq('location_id', transfer.from_location_id).eq('product_id', item.productId).single();
                if (fromInv) {
                    await supabase.from('inventory').update({ quantity: fromInv.quantity - item.quantity }).eq('location_id', transfer.from_location_id).eq('product_id', item.productId);
                }

                // Increment at destination
                const { data: toInv } = await supabase.from('inventory').select('quantity').eq('location_id', transfer.to_location_id).eq('product_id', item.productId).single();
                if (toInv) {
                    await supabase.from('inventory').update({ quantity: toInv.quantity + item.quantity }).eq('location_id', transfer.to_location_id).eq('product_id', item.productId);
                } else {
                    await supabase.from('inventory').insert({
                        location_id: transfer.to_location_id,
                        product_id: item.productId,
                        quantity: item.quantity
                    });
                }
            }

            const { error } = await supabase.from('transfers').update({
                status: 'completed'
            }).eq('id', transfer.id);

            if (error) throw error;
        } catch (e) { console.error("Error completing transfer: ", e); }
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-white/60">
                        Stock Transfers
                    </h1>
                    <p className="text-white/50 mt-1">Manage and track internal stock movements.</p>
                </div>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="bg-primary text-primary-foreground px-4 py-2.5 rounded-xl font-medium flex items-center gap-2 hover:opacity-90 transition-opacity shadow-[0_0_20px_rgba(255,255,255,0.2)]"
                >
                    <Plus className="w-5 h-5" />
                    Create Transfer
                </button>
            </header>

            <div className="glass-panel overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-white/10 bg-white/5 text-white/50 text-sm">
                                <th className="p-4 font-medium">Date</th>
                                <th className="p-4 font-medium">From</th>
                                <th className="p-4 font-medium">To</th>
                                <th className="p-4 font-medium">Status</th>
                                <th className="p-4 font-medium">Created By</th>
                                <th className="p-4 font-medium text-right">Grand Total</th>
                                <th className="p-4 font-medium text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {transfers.length === 0 ? (
                                <tr>
                                    <td colSpan="7" className="p-8 text-center text-white/40">No transfers found.</td>
                                </tr>
                            ) : (
                                transfers.map(t => (
                                    <tr key={t.id} className="hover:bg-white/[0.02] transition-colors group">
                                        <td className="p-4 text-sm text-white/80">{t.created_at ? new Date(t.created_at).toLocaleDateString() : 'Today'}</td>
                                        <td className="p-4 font-medium">{t.from_location_name || 'Warehouse A'}</td>
                                        <td className="p-4 text-white/60">
                                            <ArrowRight className="w-4 h-4 inline mx-2" />
                                            <span className="font-medium text-white">{t.to_location_name || 'Shop B'}</span>
                                        </td>
                                        <td className="p-4">
                                            {t.status === 'completed' ? (
                                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                                    <CheckCircle2 className="w-3.5 h-3.5" /> Completed
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20">
                                                    <Clock className="w-3.5 h-3.5" /> Pending
                                                </span>
                                            )}
                                        </td>
                                        <td className="p-4 text-sm text-white/60">{t.created_by}</td>
                                        <td className="p-4 text-sm font-semibold text-right flex items-center justify-end gap-1">
                                            <span className="text-white/40 font-normal pr-1">Ksh</span>
                                            {t.total_value?.toLocaleString() || '0'}
                                        </td>
                                        <td className="p-4 text-right">
                                            {t.status === 'pending' && (
                                                <button
                                                    onClick={() => markCompleted(t)}
                                                    className="text-xs bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-lg transition-colors border border-white/10"
                                                >
                                                    Mark Complete
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <CreateTransferModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
        </div>
    );
}
