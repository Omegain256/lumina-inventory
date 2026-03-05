import { useState, useEffect } from 'react';
import { supabase } from '../../config/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { X, Loader2 } from 'lucide-react';

export default function CreateTransferModal({ isOpen, onClose }) {
    const { currentUser } = useAuth();
    const [locations, setLocations] = useState([]);
    const [products, setProducts] = useState([]);
    const [inventory, setInventory] = useState([]);

    const [fromLocation, setFromLocation] = useState('');
    const [toLocation, setToLocation] = useState('');
    const [selectedProduct, setSelectedProduct] = useState('');
    const [quantity, setQuantity] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isOpen) {
            const fetchData = async () => {
                const { data: locData } = await supabase.from('locations').select('*');
                if (locData) setLocations(locData);

                const { data: prodData } = await supabase.from('products').select('*');
                if (prodData) setProducts(prodData);

                const { data: invData } = await supabase.from('inventory').select('*');
                if (invData) setInventory(invData);
            };
            fetchData();
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const availableInventory = inventory.filter(i => i.location_id === fromLocation && i.quantity > 0);
    const availableProducts = products.filter(p => availableInventory.some(i => i.product_id === p.id));
    const maxQty = availableInventory.find(i => i.product_id === selectedProduct)?.quantity || 0;

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!fromLocation || !toLocation || !selectedProduct || !quantity || quantity > maxQty) return;

        setLoading(true);
        try {
            const prod = products.find(p => p.id === selectedProduct);
            const totalValue = (prod.selling_price || 0) * Number(quantity);

            const { error } = await supabase.from('transfers').insert({
                from_location_id: fromLocation,
                from_location_name: locations.find(l => l.id === fromLocation).name,
                to_location_id: toLocation,
                to_location_name: locations.find(l => l.id === toLocation).name,
                status: 'pending',
                created_by: currentUser?.email || 'Demo User',
                total_value: totalValue,
                items: [{ productId: selectedProduct, quantity: Number(quantity) }]
            });

            if (error) throw error;
            onClose();
        } catch (e) {
            console.error("Error creating transfer:", e);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
            <div className="glass-panel max-w-lg w-full p-6 animate-in zoom-in duration-300 relative shadow-[0_0_50px_rgba(0,0,0,0.5)]">
                <button onClick={onClose} className="absolute right-4 top-4 text-white/50 hover:text-white transition-colors">
                    <X className="w-5 h-5" />
                </button>

                <h2 className="text-xl font-semibold mb-6">Create Stock Transfer</h2>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-white/70 mb-1">From Location</label>
                            <select
                                value={fromLocation}
                                onChange={(e) => { setFromLocation(e.target.value); setSelectedProduct(''); }}
                                className="w-full bg-black/40 border border-white/10 rounded-lg p-2.5 text-white/90 focus:border-primary outline-none" required
                            >
                                <option value="">Select Origin...</option>
                                {locations.filter(l => l.id !== toLocation).map(l => (
                                    <option key={l.id} value={l.id}>{l.name}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-white/70 mb-1">To Location</label>
                            <select
                                value={toLocation}
                                onChange={(e) => setToLocation(e.target.value)}
                                className="w-full bg-black/40 border border-white/10 rounded-lg p-2.5 text-white/90 focus:border-primary outline-none" required
                            >
                                <option value="">Select Destination...</option>
                                {locations.filter(l => l.id !== fromLocation).map(l => (
                                    <option key={l.id} value={l.id}>{l.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-white/70 mb-1">Select Item from Stock</label>
                        <select
                            value={selectedProduct}
                            onChange={(e) => setSelectedProduct(e.target.value)}
                            disabled={!fromLocation}
                            className="w-full bg-black/40 border border-white/10 rounded-lg p-2.5 text-white/90 focus:border-primary outline-none disabled:opacity-50" required
                        >
                            <option value="">Choose item...</option>
                            {availableProducts.map(p => (
                                <option key={p.id} value={p.id}>{p.name} (Max: {availableInventory.find(i => i.productId === p.id).quantity})</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-white/70 mb-1">Quantity</label>
                        <input
                            type="number"
                            min="1"
                            max={maxQty}
                            value={quantity}
                            onChange={(e) => setQuantity(e.target.value)}
                            disabled={!selectedProduct}
                            className="w-full bg-black/40 border border-white/10 rounded-lg p-2.5 text-white/90 focus:border-primary outline-none disabled:opacity-50 appearance-none m-0 focus:ring-1 focus:ring-primary/50"
                            placeholder="0" required
                        />
                        {selectedProduct && maxQty > 0 && (
                            <p className="text-xs text-primary mt-1">Available in stock: {maxQty}</p>
                        )}
                    </div>

                    <button
                        type="submit"
                        disabled={loading || !quantity || quantity > maxQty}
                        className="w-full mt-6 bg-primary text-primary-foreground py-3 rounded-xl font-medium flex justify-center items-center gap-2 hover:opacity-90 disabled:opacity-50 transition-opacity button-primary"
                    >
                        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Initiate Transfer"}
                    </button>
                </form>
            </div>
        </div>
    );
}
