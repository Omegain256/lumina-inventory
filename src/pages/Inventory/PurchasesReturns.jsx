import { useState, useEffect } from 'react';
import { supabase } from '../../config/supabase';
import { Plus, Replace, ArrowDownToLine, PackageSearch, Package } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';

function CreateTransactionModal({ isOpen, onClose, products }) {
    const { currentUser } = useAuth();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        productId: '',
        type: 'purchase',
        quantity: '',
        reference: '',
        notes: ''
    });

    if (!isOpen) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const product = products.find(p => p.id === formData.productId);

            const { error } = await supabase.from('inventory_transactions').insert({
                product_id: formData.productId,
                type: formData.type,
                quantity: Number(formData.quantity),
                product_name: product?.name || 'Unknown',
                product_sku: product?.sku || '',
                created_by: currentUser?.email || 'Demo User',
                reference: formData.reference,
                notes: formData.notes
            });

            if (error) throw error;

            toast.success(`${formData.type === 'purchase' ? 'Purchase' : 'Return'} recorded successfully!`);
            onClose();
        } catch (error) {
            console.error("Error creating transaction:", error);
            toast.error(error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-[#1a1a1a] rounded-2xl w-full max-w-lg border border-white/10 shadow-2xl my-8">
                <div className="p-6 border-b border-white/10 flex justify-between items-center sticky top-0 bg-[#1a1a1a] rounded-t-2xl z-10">
                    <div>
                        <h2 className="text-xl font-bold text-white">Record Transaction</h2>
                        <p className="text-white/50 text-sm mt-1">Log a new purchase or supplier return</p>
                    </div>
                    <button onClick={onClose} className="p-2 text-white/50 hover:text-white hover:bg-white/10 rounded-xl transition-colors">
                        ✕
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-white/70 mb-1.5">Transaction Type *</label>
                            <div className="grid grid-cols-2 gap-3">
                                <button
                                    type="button"
                                    onClick={() => setFormData({ ...formData, type: 'purchase' })}
                                    className={`flex items-center justify-center gap-2 p-3 rounded-xl border transition-colors ${formData.type === 'purchase'
                                        ? 'bg-primary/20 border-primary text-primary'
                                        : 'bg-white/5 border-white/10 text-white/50 hover:bg-white/10'
                                        }`}
                                >
                                    <ArrowDownToLine className="w-4 h-4" />
                                    Purchase
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setFormData({ ...formData, type: 'return' })}
                                    className={`flex items-center justify-center gap-2 p-3 rounded-xl border transition-colors ${formData.type === 'return'
                                        ? 'bg-orange-500/20 border-orange-500 text-orange-400'
                                        : 'bg-white/5 border-white/10 text-white/50 hover:bg-white/10'
                                        }`}
                                >
                                    <Replace className="w-4 h-4" />
                                    Return
                                </button>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-white/70 mb-1.5">Product *</label>
                            <select
                                required
                                value={formData.productId}
                                onChange={e => setFormData({ ...formData, productId: e.target.value })}
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all appearance-none"
                            >
                                <option value="">Select a product</option>
                                {products.map(p => (
                                    <option key={p.id} value={p.id} className="bg-[#1a1a1a]">
                                        {p.sku} - {p.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="flex gap-4">
                            <div className="flex-1">
                                <label className="block text-sm font-medium text-white/70 mb-1.5">Quantity *</label>
                                <input
                                    type="number"
                                    required
                                    min="1"
                                    value={formData.quantity}
                                    onChange={e => setFormData({ ...formData, quantity: e.target.value })}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
                                    placeholder="0"
                                />
                            </div>
                            <div className="flex-1">
                                <label className="block text-sm font-medium text-white/70 mb-1.5">Reference / Invoice #</label>
                                <input
                                    type="text"
                                    value={formData.reference}
                                    onChange={e => setFormData({ ...formData, reference: e.target.value })}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
                                    placeholder="INV-12345"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-white/70 mb-1.5">Internal Notes (Optional)</label>
                            <textarea
                                value={formData.notes}
                                onChange={e => setFormData({ ...formData, notes: e.target.value })}
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all resize-none h-24"
                                placeholder="Any additional details..."
                            />
                        </div>
                    </div>

                    <div className="flex gap-3 pt-4 border-t border-white/10 sticky bottom-0 bg-[#1a1a1a] pb-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-3 rounded-xl font-medium text-white/70 hover:text-white hover:bg-white/10 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex-1 bg-primary text-primary-foreground px-4 py-3 rounded-xl font-medium hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {loading ? (
                                <div className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                            ) : (
                                "Record Transaction"
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default function PurchasesReturns() {
    const [transactions, setTransactions] = useState([]);
    const [products, setProducts] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const fetchData = async () => {
        const { data: prodData } = await supabase.from('products').select('*');
        if (prodData) setProducts(prodData);

        const { data: txData } = await supabase.from('inventory_transactions').select('*').order('created_at', { ascending: false });
        if (txData) setTransactions(txData.map(t => ({ ...t, date: new Date(t.created_at) })));
    };

    useEffect(() => {
        fetchData();
        const prodChannel = supabase.channel('products').on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, fetchData).subscribe();
        const txChannel = supabase.channel('inventory_transactions').on('postgres_changes', { event: '*', schema: 'public', table: 'inventory_transactions' }, fetchData).subscribe();
        return () => {
            supabase.removeChannel(prodChannel);
            supabase.removeChannel(txChannel);
        };
    }, []);

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-white/60">
                        Purchases & Returns
                    </h1>
                    <p className="text-white/50 mt-1">Manage stock intake and supplier returns.</p>
                </div>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="bg-primary text-primary-foreground px-4 py-2.5 rounded-xl font-medium flex items-center gap-2 hover:opacity-90 transition-opacity shadow-[0_0_20px_rgba(11,211,211,0.2)]"
                >
                    <Plus className="w-5 h-5" />
                    Record Transaction
                </button>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <div className="glass-panel p-6 flex flex-col gap-2">
                    <div className="text-white/50 text-sm font-medium flex items-center gap-2">
                        <ArrowDownToLine className="w-4 h-4 text-primary" />
                        Total Purchases
                    </div>
                    <div className="text-3xl font-bold text-white">
                        {transactions.filter(t => t.type === 'purchase').length}
                    </div>
                </div>
                <div className="glass-panel p-6 flex flex-col gap-2">
                    <div className="text-white/50 text-sm font-medium flex items-center gap-2">
                        <Replace className="w-4 h-4 text-orange-400" />
                        Total Returns
                    </div>
                    <div className="text-3xl font-bold text-white">
                        {transactions.filter(t => t.type === 'return').length}
                    </div>
                </div>
                <div className="glass-panel p-6 flex flex-col gap-2">
                    <div className="text-white/50 text-sm font-medium flex items-center gap-2">
                        <PackageSearch className="w-4 h-4 text-blue-400" />
                        Items Transacted
                    </div>
                    <div className="text-3xl font-bold text-white">
                        {transactions.reduce((acc, curr) => acc + curr.quantity, 0)}
                    </div>
                </div>
            </div>

            <div className="glass-panel overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-white/10 bg-white/5 text-white/50 text-sm">
                                <th className="p-4 font-medium">Date</th>
                                <th className="p-4 font-medium">Type</th>
                                <th className="p-4 font-medium">Product</th>
                                <th className="p-4 font-medium">Reference</th>
                                <th className="p-4 font-medium text-right">Quantity</th>
                                <th className="p-4 font-medium">User</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {transactions.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="p-8 text-center text-white/40 border-b-0">
                                        No transactions recorded yet.
                                    </td>
                                </tr>
                            ) : (
                                transactions.map(t => (
                                    <tr key={t.id} className="hover:bg-white/[0.02] transition-colors">
                                        <td className="p-4 text-white/70 text-sm">
                                            {t.date ? new Intl.DateTimeFormat('en-GB', {
                                                day: 'numeric', month: 'short', year: 'numeric',
                                                hour: '2-digit', minute: '2-digit'
                                            }).format(t.date) : '...'}
                                        </td>
                                        <td className="p-4">
                                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${t.type === 'purchase'
                                                ? 'bg-primary/10 text-primary border-primary/20'
                                                : 'bg-orange-500/10 text-orange-400 border-orange-500/20'
                                                }`}>
                                                {t.type === 'purchase' ? <ArrowDownToLine className="w-3 h-3" /> : <Replace className="w-3 h-3" />}
                                                {t.type === 'purchase' ? 'Purchase' : 'Return'}
                                            </span>
                                        </td>
                                        <td className="p-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center border border-white/10 shrink-0">
                                                    <Package className="w-4 h-4 text-white/50" />
                                                </div>
                                                <div>
                                                    <div className="font-medium text-white">{t.productName}</div>
                                                    <div className="text-xs text-white/40">{t.productSku}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-4 text-white/60 text-sm">{t.reference || '-'}</td>
                                        <td className="p-4 text-right font-mono text-white/80">
                                            {t.type === 'purchase' ? '+' : '-'}{t.quantity}
                                        </td>
                                        <td className="p-4 text-white/50 text-sm">{t.createdBy}</td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <CreateTransactionModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                products={products}
            />
        </div>
    );
}
