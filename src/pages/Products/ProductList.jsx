import { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { Plus, Package, Edit, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';

export default function ProductList() {
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState({});
    const [brands, setBrands] = useState({});
    const [units, setUnits] = useState({});

    useEffect(() => {
        // Fetch Dictionary mappings for easy lookup
        const unsubC = onSnapshot(collection(db, 'categories'), snap => {
            const map = {}; snap.forEach(d => map[d.id] = d.data().name); setCategories(map);
        });
        const unsubB = onSnapshot(collection(db, 'brands'), snap => {
            const map = {}; snap.forEach(d => map[d.id] = d.data().name); setBrands(map);
        });
        const unsubU = onSnapshot(collection(db, 'units'), snap => {
            const map = {}; snap.forEach(d => map[d.id] = d.data().abbreviation); setUnits(map);
        });

        // Fetch Products
        const q = query(collection(db, 'products'), orderBy('createdAt', 'desc'));
        const unsubP = onSnapshot(q, snap => {
            setProducts(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        });

        return () => { unsubC(); unsubB(); unsubU(); unsubP(); };
    }, []);

    const handleDelete = async (productId) => {
        if (!window.confirm("Are you sure you want to delete this product?")) return;

        try {
            const { doc, deleteDoc } = await import('firebase/firestore');
            await deleteDoc(doc(db, 'products', productId));
            toast.success("Product deleted successfully");
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
                                        <td className="p-4 text-white/60">{categories[p.categoryId] || '-'}</td>
                                        <td className="p-4 text-white/60">{brands[p.brandId] || '-'}</td>
                                        <td className="p-4 text-right font-mono">
                                            <span className="text-white/40 text-xs pr-1">Ksh</span>
                                            {p.price?.toLocaleString() || "0"}
                                        </td>
                                        <td className="p-4 text-center text-white/60 bg-white/[0.01]">{units[p.unitId] || '-'}</td>
                                        <td className="p-4 text-right">
                                            <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button className="p-1.5 text-white/40 hover:text-white hover:bg-white/10 rounded-lg transition-colors"><Edit className="w-4 h-4" /></button>
                                                <button
                                                    onClick={() => handleDelete(p.id)}
                                                    className="p-1.5 text-white/40 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
