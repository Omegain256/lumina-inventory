import { useState, useEffect } from 'react';
import { supabase } from '../config/supabase';
import { X, Edit2, Save, Trash2, Printer, AlertCircle } from 'lucide-react';
import { cn } from '../utils/cn';

export default function SaleDetailsModal({ isOpen, onClose, saleId, onUpdate }) {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [sale, setSale] = useState(null);
    const [isEditing, setIsEditing] = useState(false);
    
    // Edit state
    const [editItems, setEditItems] = useState([]);
    const [paymentMethod, setPaymentMethod] = useState('');
    const [error, setError] = useState('');

    useEffect(() => {
        if (!isOpen || !saleId) return;

        const fetchSaleDetails = async () => {
            setLoading(true);
            setError('');
            try {
                const { data, error } = await supabase
                    .from('sales')
                    .select(`
                        *,
                        sale_items (
                            id,
                            product_id,
                            quantity,
                            unit_price,
                            product:products (
                                id,
                                name,
                                stock_quantity,
                                price
                            )
                        )
                    `)
                    .eq('id', saleId)
                    .single();

                if (error) throw error;
                setSale({
                    ...data,
                    // Filter out any items where product might have been deleted completely
                    sale_items: data.sale_items.filter(item => item.product)
                });
                
                // Initialize edit state
                setPaymentMethod(data.payment_method || 'Cash');
                setEditItems(data.sale_items.filter(item => item.product).map(item => ({
                    ...item,
                    newQuantity: item.quantity
                })));
            } catch (err) {
                console.error("Error fetching sale:", err);
                setError(err.message || "Failed to load sale details");
            } finally {
                setLoading(false);
            }
        };

        fetchSaleDetails();
    }, [isOpen, saleId]);

    // Handle Closing
    const handleClose = () => {
        setIsEditing(false);
        setError('');
        onClose();
    };

    // Calculate totals based on edit state
    const editTotal = editItems.reduce((sum, item) => sum + (item.newQuantity * item.unit_price), 0);

    const handleQuantityChange = (itemId, newQty) => {
        const qty = parseInt(newQty);
        if (isNaN(qty) || qty < 0) return;
        
        setEditItems(prev => prev.map(item => {
            if (item.id === itemId) {
                // Ensure we don't exceed current inventory stock (if increasing quantity)
                // available stock = current stock + what they already bought (original quantity)
                const maxAvailable = item.product.stock_quantity + item.quantity;
                const safeQty = Math.min(qty, maxAvailable);
                return { ...item, newQuantity: safeQty };
            }
            return item;
        }));
    };

    const handleRemoveItem = (itemId) => {
        setEditItems(prev => prev.filter(item => item.id !== itemId));
    };

    const handleSave = async () => {
        setSaving(true);
        setError('');
        try {
            // If they removed all items, perhaps Void the sale completely?
            if (editItems.length === 0) {
                if (!window.confirm("Removing all items will VOID this sale. Are you sure?")) {
                    setSaving(false);
                    return;
                }
                
                // Restore stock for all original items
                for (const item of sale.sale_items) {
                    const { data: pData } = await supabase.from('products').select('stock_quantity').eq('id', item.product_id).single();
                    const currentStock = pData?.stock_quantity || 0;
                    await supabase.from('products').update({ stock_quantity: currentStock + item.quantity }).eq('id', item.product_id);
                }
                // 2. Delete sale
                await supabase.from('sales').delete().eq('id', saleId);
                onUpdate?.();
                handleClose();
                return;
            }

            // Standard Update Process
            const originalItemsMap = new Map(sale.sale_items.map(i => [i.id, i]));
            
            // Track stock updates needed:
            // stockAdjustment = originalQuantity - newQuantity
            // e.g. Orig 2, New 1 -> Adjustment +1 (Return to stock)
            // e.g. Orig 2, New 3 -> Adjustment -1 (Deduct from stock)
            
            const updates = [];
            const itemUpdates = [];
            const itemsToDelete = [];

            // Find modifications and deletions
            for (const orig of sale.sale_items) {
                const edit = editItems.find(e => e.id === orig.id);
                if (!edit) {
                    // Item was completely removed, restore full original qty
                    updates.push({ productId: orig.product_id, adjustment: orig.quantity });
                    itemsToDelete.push(orig.id);
                } else if (edit.newQuantity !== orig.quantity) {
                    // Item quantity changed
                    const difference = orig.quantity - edit.newQuantity;
                    if (difference !== 0) {
                        updates.push({ productId: orig.product_id, adjustment: difference });
                    }
                    itemUpdates.push({ id: orig.id, quantity: edit.newQuantity });
                } else {
                    // Unchanged, just ensuring we keep it
                }
            }

            // Proceed with updates safely
            // 1. Adjust inventory
            for (const update of updates) {
                // If adjustment is positive, we increase stock
                // If negative, we decrease (meaning we sell more)
                const { data: pData } = await supabase.from('products').select('stock_quantity').eq('id', update.productId).single();
                const currentStock = pData?.stock_quantity || 0;
                await supabase.from('products').update({ stock_quantity: currentStock + update.adjustment }).eq('id', update.productId);
                
                // Optional: Insert to inventory_transactions to track correction
                await supabase.from('inventory_transactions').insert({
                    product_id: update.productId,
                    type: update.adjustment > 0 ? 'return' : 'sale_correction',
                    quantity: Math.abs(update.adjustment),
                    reference: `Sale Edit: #${saleId.slice(-6)}`,
                    product_name: sale.sale_items.find(i => i.product_id === update.productId)?.product?.name
                });
            }

            // 2. Delete removed items
            if (itemsToDelete.length > 0) {
                await supabase.from('sale_items').delete().in('id', itemsToDelete);
            }

            // 3. Update changed items
            for (const iu of itemUpdates) {
                await supabase.from('sale_items').update({ quantity: iu.quantity }).eq('id', iu.id);
            }

            // 4. Update the parent Sale record
            await supabase.from('sales').update({
                payment_method: paymentMethod,
                total_amount: editTotal
            }).eq('id', saleId);

            setIsEditing(false);
            onUpdate?.(); // Trigger dashboard refetch
            
            // Re-fetch local UI state to show immediate new non-edit details
            const { data: newData } = await supabase
                .from('sales')
                .select('*, sale_items(*, product:products(*))')
                .eq('id', saleId)
                .single();
            setSale({
                 ...newData,
                 sale_items: newData.sale_items.filter(item => item.product)
            });
            
        } catch (err) {
            console.error("Save failed:", err);
            setError(err.message || "Failed to update the sale.");
        } finally {
            setSaving(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex justify-end">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={saving ? undefined : handleClose}></div>
            <div className="relative w-full max-w-lg bg-[#0a0a0a] border-l border-white/10 h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
                
                {/* Header */}
                <div className="p-6 border-b border-white/10 flex justify-between items-center bg-white/[0.02]">
                    <div>
                        <h2 className="text-xl font-bold font-mono text-white flex items-center gap-2">
                            Receipt #{saleId?.slice(-6)}
                            {sale && !isEditing && (
                                <span className="text-xs px-2 py-0.5 rounded-full bg-primary/20 text-primary border border-primary/30 uppercase font-sans font-semibold">
                                    {sale.payment_method}
                                </span>
                            )}
                        </h2>
                        {sale && <p className="text-sm text-white/50 mt-1">{new Date(sale.created_at).toLocaleString()}</p>}
                    </div>
                    
                    <div className="flex gap-2">
                        {sale && !isEditing && (
                            <>
                                <button className="p-2 bg-white/5 hover:bg-white/10 rounded-lg text-white/70 transition-colors" onClick={() => window.print()} title="Print">
                                    <Printer className="w-5 h-5" />
                                </button>
                                <button className="p-2 bg-white/5 hover:bg-white/10 rounded-lg text-white/70 transition-colors" onClick={() => setIsEditing(true)} title="Edit Sale">
                                    <Edit2 className="w-5 h-5" />
                                </button>
                            </>
                        )}
                        <button className="p-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-lg transition-colors ml-2" onClick={handleClose}>
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto p-6">
                    {loading ? (
                        <div className="h-full flex items-center justify-center">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                        </div>
                    ) : error ? (
                         <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-xl flex gap-3 text-red-400">
                            <AlertCircle className="w-5 h-5 shrink-0" />
                            <p className="text-sm">{error}</p>
                         </div>
                    ) : (
                        <div className="space-y-6">
                            
                            {/* Items List */}
                            <div>
                                <h3 className="text-sm font-semibold text-white/50 uppercase tracking-wider mb-4">Items Sold</h3>
                                <div className="space-y-3">
                                    {isEditing ? (
                                        // Edit Mode Items
                                        editItems.map((item) => (
                                            <div key={item.id} className="glass-panel p-4 rounded-xl flex items-center gap-4">
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-white font-medium truncate">{item.product.name}</p>
                                                    <p className="text-white/50 text-sm">@ Ksh {Number(item.unit_price).toLocaleString()}</p>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <div className="flex items-center gap-2 bg-black/50 p-1 rounded-lg border border-white/10">
                                                        <button 
                                                            onClick={() => handleQuantityChange(item.id, item.newQuantity - 1)}
                                                            className="w-8 h-8 rounded hover:bg-white/10 text-white flex items-center justify-center font-bold"
                                                        >-</button>
                                                        <input 
                                                            type="number" 
                                                            min="0"
                                                            value={item.newQuantity}
                                                            onChange={(e) => handleQuantityChange(item.id, e.target.value)}
                                                            className="w-10 bg-transparent text-center text-white font-medium focus:outline-none"
                                                        />
                                                        <button 
                                                            onClick={() => handleQuantityChange(item.id, item.newQuantity + 1)}
                                                            className="w-8 h-8 rounded hover:bg-white/10 text-white flex items-center justify-center font-bold"
                                                        >+</button>
                                                    </div>
                                                    <button onClick={() => handleRemoveItem(item.id)} className="p-2 text-white/30 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors">
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        // View Mode Items
                                        sale.sale_items.map((item) => (
                                            <div key={item.id} className="flex justify-between items-center pb-3 border-b border-white/5 last:border-0 last:pb-0">
                                                <div>
                                                    <p className="text-white font-medium">{item.product.name}</p>
                                                    <p className="text-white/50 text-xs mt-0.5">{item.quantity} × Ksh {Number(item.unit_price).toLocaleString()}</p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-white font-mono">Ksh {(item.quantity * item.unit_price).toLocaleString()}</p>
                                                </div>
                                            </div>
                                        ))
                                    )}

                                    {(!sale.sale_items.length || (isEditing && !editItems.length)) && (
                                        <div className="text-center py-6 text-white/30 text-sm">
                                            No explicit items found or all items removed.
                                        </div>
                                    )}
                                </div>
                            </div>
                            
                            {/* Editing Details */}
                            {isEditing && (
                                <div className="mt-8 pt-6 border-t border-white/10">
                                    <h3 className="text-sm font-semibold text-white/50 uppercase tracking-wider mb-4">Payment Method</h3>
                                    <select 
                                        value={paymentMethod}
                                        onChange={(e) => setPaymentMethod(e.target.value)}
                                        className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-colors outline-none"
                                    >
                                        <option value="Cash">Cash</option>
                                        <option value="M-Pesa">M-Pesa</option>
                                        <option value="Card">Bank / Card</option>
                                    </select>
                                    
                                </div>
                            )}

                        </div>
                    )}
                </div>

                {/* Footer (Totals & Actions) */}
                {!loading && sale && (
                    <div className="p-6 bg-black/60 border-t border-white/10 backdrop-blur-md">
                        <div className="flex justify-between items-center mb-6">
                            <span className="text-white/60">Total Amount</span>
                            <span className="text-2xl font-bold font-mono text-primary">
                                Ksh {(isEditing ? editTotal : sale.total_amount).toLocaleString()}
                            </span>
                        </div>
                        
                        {isEditing && (
                            <div className="flex gap-3">
                                <button 
                                    onClick={() => {
                                        setIsEditing(false);
                                        // Reset edit state to current
                                        setEditItems(sale.sale_items.map(item => ({...item, newQuantity: item.quantity})));
                                        setPaymentMethod(sale.payment_method);
                                        setError('');
                                    }}
                                    className="flex-1 px-4 py-3 rounded-xl border border-white/10 hover:bg-white/5 text-white transition-colors"
                                    disabled={saving}
                                >
                                    Cancel
                                </button>
                                <button 
                                    onClick={handleSave}
                                    className="flex-1 px-4 py-3 rounded-xl bg-primary hover:bg-primary/90 text-black font-semibold flex items-center justify-center gap-2 disabled:opacity-50 transition-colors"
                                    disabled={saving}
                                >
                                    {saving ? <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-black"></div> : <><Save className="w-4 h-4" /> Save Changes</>}
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
