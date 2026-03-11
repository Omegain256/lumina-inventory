import { useState, useEffect } from 'react';
import { supabase } from '../../config/supabase';
import { Plus, Package, Edit, Trash2, ArrowDownToLine, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../../contexts/AuthContext';

function RestockModal({ isOpen, onClose, product, onSuccess }) {
    const { currentUser } = useAuth();
    const [loading, setLoading] = useState(false);
    const [quantity, setQuantity] = useState('');
    const [reference, setReference] = useState('');

    if (!isOpen || !product) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const qty = Number(quantity);
            if (qty <= 0) throw new Error("Quantity must be greater than 0");

            // 1. Log transaction
            const { error: txError } = await supabase.from('inventory_transactions').insert({
                product_id: product.id,
                type: 'purchase',
                quantity: qty,
                product_name: product.name,
                product_sku: product.sku || '',
                created_by: currentUser?.email || 'Admin',
                reference: reference,
                notes: 'Quick Restock from Product List'
            });
            if (txError) throw txError;

            // 2. Adjust stock strictly using raw data
            const newStock = (product.stock_quantity || 0) + qty;
            const { error: updateError } = await supabase
                .from('products')
                .update({ stock_quantity: newStock })
                .eq('id', product.id);
            if (updateError) throw updateError;

            toast.success(`Restocked ${qty} units of ${product.name}`);
            onSuccess();
            onClose();
        } catch (error) {
            console.error("Restock error:", error);
            toast.error(error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-[#1a1a1a] rounded-2xl w-full max-w-md border border-white/10 shadow-2xl animate-in zoom-in-95 duration-200">
                <div className="p-6 border-b border-white/10 flex justify-between items-center bg-white/[0.02] rounded-t-2xl">
                    <div>
                        <h2 className="text-xl font-bold text-white flex items-center gap-2">
                            <ArrowDownToLine className="w-5 h-5 text-green-400" />
                            Quick Restock
                        </h2>
                        <p className="text-white/50 text-sm mt-1">{product.name} ({product.sku || 'No SKU'})</p>
                    </div>
                    <button onClick={onClose} className="p-2 text-white/50 hover:text-white hover:bg-white/10 rounded-xl transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>
                <form onSubmit={handleSubmit} className="p-6 space-y-5">
                    <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/10">
                        <span className="text-sm font-medium text-white/70">Current Stock</span>
                        <span className="text-xl font-bold text-white">{product.stock_quantity || 0}</span>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-white/70 mb-1.5">Quantity Received *</label>
                        <input
                            type="number"
                            required
                            min="1"
                            value={quantity}
                            onChange={e => setQuantity(e.target.value)}
                            className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-green-500/50 focus:ring-1 focus:ring-green-500/50 transition-all"
                            placeholder="e.g. 50"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-white/70 mb-1.5">Invoice / Reference (Optional)</label>
                        <input
                            type="text"
                            value={reference}
                            onChange={e => setReference(e.target.value)}
                            className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-green-500/50 focus:ring-1 focus:ring-green-500/50 transition-all"
                            placeholder="INV-2024..."
                        />
                    </div>
                    <div className="flex gap-3 pt-6 border-t border-white/10">
                        <button type="button" onClick={onClose} className="flex-1 px-4 py-3 rounded-xl font-medium text-white/70 hover:bg-white/10 hover:text-white transition-colors">Cancel</button>
                        <button type="submit" disabled={loading} className="flex-[2] bg-green-500 text-black px-4 py-3 rounded-xl font-bold hover:bg-green-400 disabled:opacity-50 transition-colors">
                            {loading ? 'Applying...' : 'Confirm Restock'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default function ProductList() {
    const { isAdmin, isManager } = useAuth();
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState({});
    const [brands, setBrands] = useState({});
    const [units, setUnits] = useState({});
    const [selectedRestock, setSelectedRestock] = useState(null);

    const fetchData = async () => {
        // Fetch Dictionary mappings
        const { data: cData } = await supabase.from('categories').select('*');
        const { data: bData } = await supabase.from('brands').select('*');
        const { data: uData } = await supabase.from('units').select('*');

        const cMap = {}; if (cData) cData.forEach(d => cMap[d.id] = d.name); setCategories(cMap);
        const bMap = {}; if (bData) bData.forEach(d => bMap[d.id] = d.name); setBrands(bMap);
        const uMap = {}; if (uData) uData.forEach(d => uMap[d.id] = d.abbreviation); setUnits(uMap);

        // Fetch Products
        const { data: pData, error } = await supabase
            .from('products')
            .select('*')
            .order('created_at', { ascending: false });

        if (pData) setProducts(pData);
        if (error) console.error("Error fetching products:", error);
    };

    useEffect(() => {
        fetchData();
        const productChannel = supabase.channel('products-list').on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, fetchData).subscribe();
        return () => supabase.removeChannel(productChannel);
    }, []);

    const handleDelete = async (productId) => {
        if (!window.confirm("Are you sure you want to delete this product?")) return;

        try {
            const { error } = await supabase.from('products').delete().eq('id', productId);
            if (error) throw error;
            toast.success("Product deleted successfully");
            fetchData();
        } catch (error) {
            console.error("Error deleting product:", error);
            toast.error("Failed to delete product");
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-white/60">
                        Product List
                    </h1>
                    <p className="text-white/50 mt-1">Manage your complete catalog of items and parts.</p>
                </div>
                <Link
                    to="/products/add"
                    className="bg-primary text-primary-foreground px-4 py-2.5 rounded-xl font-medium flex items-center gap-2 hover:opacity-90 transition-opacity shadow-[0_0_20px_rgba(11,211,211,0.2)]"
                >
                    <Plus className="w-5 h-5" />
                    Add Product
                </Link>
            </header>

            <div className="glass-panel overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-white/10 bg-white/5 text-white/50 text-sm">
                                <th className="p-4 font-medium">SKU</th>
                                <th className="p-4 font-medium">Product Name</th>
                                <th className="p-4 font-medium">Category</th>
                                <th className="p-4 font-medium">Brand</th>
                                <th className="p-4 font-medium text-right">Selling Price</th>
                                <th className="p-4 font-medium text-right">Stock</th>
                                <th className="p-4 font-medium text-center">Unit</th>
                                <th className="p-4 font-medium text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {products.length === 0 ? (
                                <tr>
                                    <td colSpan="7" className="p-8 text-center text-white/40">No products found. Click 'Add Product' to start.</td>
                                </tr>
                            ) : (
                                products.map(p => (
                                    <tr key={p.id} className="hover:bg-white/[0.02] transition-colors group">
                                        <td className="p-4 font-mono text-sm text-white/70">{p.sku}</td>
                                        <td className="p-4 font-medium text-white flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center border border-white/10">
                                                <Package className="w-4 h-4 text-white/50" />
                                            </div>
                                            {p.name}
                                        </td>
                                        <td className="p-4 text-white/60">{categories[p.category_id] || '-'}</td>
                                        <td className="p-4 text-white/60">{brands[p.brand_id] || '-'}</td>
                                        <td className="p-4 text-right font-mono">
                                            <span className="text-white/40 text-xs pr-1">Ksh</span>
                                            {Number(p.price || 0).toLocaleString()}
                                        </td>
                                        <td className="p-4 text-right font-mono text-white/80">
                                            {p.stock_quantity || 0}
                                        </td>
                                        <td className="p-4 text-center text-white/60 bg-white/[0.01]">{units[p.unit_id] || '-'}</td>
                                        <td className="p-4 text-right">
                                            <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                {(isAdmin || isManager) && (
                                                    <>
                                                        <button
                                                            title="Quick Restock"
                                                            onClick={() => setSelectedRestock(p)}
                                                            className="p-1.5 text-white/40 hover:text-green-400 hover:bg-green-400/10 rounded-lg transition-colors"
                                                        >
                                                            <ArrowDownToLine className="w-4 h-4" />
                                                        </button>
                                                        <button className="p-1.5 text-white/40 hover:text-white hover:bg-white/10 rounded-lg transition-colors"><Edit className="w-4 h-4" /></button>
                                                        <button
                                                            onClick={() => handleDelete(p.id)}
                                                            className="p-1.5 text-white/40 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <RestockModal
                isOpen={!!selectedRestock}
                onClose={() => setSelectedRestock(null)}
                product={selectedRestock}
                onSuccess={() => {
                    setSelectedRestock(null);
                    fetchData();
                }}
            />
        </div>
    );
}
