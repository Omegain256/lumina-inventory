import { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot, addDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { Plus, Trash2, Tag } from 'lucide-react';

export default function Categories() {
    const [categories, setCategories] = useState([]);
    const [newCategory, setNewCategory] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const q = query(collection(db, 'categories'), orderBy('createdAt', 'desc'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            setCategories(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        });
        return unsubscribe;
    }, []);

    const handleAdd = async (e) => {
        e.preventDefault();
        if (!newCategory.trim()) return;
        setLoading(true);
        try {
            await addDoc(collection(db, 'categories'), {
                name: newCategory.trim(),
                createdAt: serverTimestamp(),
                businessId: 'demo-business' // Placeholder
            });
            setNewCategory('');
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Delete this category?")) return;
        try {
            await deleteDoc(doc(db, 'categories', id));
        } catch (err) {
            console.error(err);
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-5xl mx-auto">
            <header>
                <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-white/60">
                    Categories
                </h1>
                <p className="text-white/50 mt-1">Manage product categories for your inventory.</p>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-1">
                    <form onSubmit={handleAdd} className="glass-panel p-6 sticky top-6">
                        <h2 className="text-xl font-semibold text-white mb-4">Add Category</h2>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-white/70 mb-1.5">Category Name</label>
                                <input
                                    type="text"
                                    value={newCategory}
                                    onChange={(e) => setNewCategory(e.target.value)}
                                    placeholder="e.g., Phone Accessories"
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all font-sans"
                                    required
                                />
                            </div>
                            <button
                                type="submit"
                                disabled={loading || !newCategory.trim()}
                                className="w-full bg-primary text-primary-foreground py-3 rounded-xl font-medium flex items-center justify-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_20px_rgba(11,211,211,0.2)]"
                            >
                                <Plus className="w-5 h-5" />
                                {loading ? 'Adding...' : 'Add Category'}
                            </button>
                        </div>
                    </form>
                </div>

                <div className="md:col-span-2">
                    <div className="glass-panel overflow-hidden">
                        <ul className="divide-y divide-white/5">
                            {categories.length === 0 ? (
                                <li className="p-8 text-center text-white/40">No categories added yet.</li>
                            ) : (
                                categories.map(category => (
                                    <li key={category.id} className="p-4 flex items-center justify-between hover:bg-white/[0.02] transition-colors group">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center border border-white/10 group-hover:scale-110 transition-transform">
                                                <Tag className="w-4 h-4 text-white/50" />
                                            </div>
                                            <span className="font-medium text-white/90">{category.name}</span>
                                        </div>
                                        <button
                                            onClick={() => handleDelete(category.id)}
                                            className="p-2 text-white/40 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                                            title="Delete Category"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </li>
                                ))
                            )}
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
}
