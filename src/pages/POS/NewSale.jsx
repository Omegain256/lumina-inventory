import { useState, useEffect, useMemo } from 'react';
import { supabase } from '../../config/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { ShoppingCart, Search, Plus, Minus, Trash2, User, CreditCard, Banknote, Smartphone, Printer, Clock } from 'lucide-react';
import toast from 'react-hot-toast';
import Receipt from '../../components/shared/Receipt';

export default function NewSale() {
    const { currentUser } = useAuth();
    const [cart, setCart] = useState([]);
    const [products, setProducts] = useState([]);
    const [customers, setCustomers] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCustomer, setSelectedCustomer] = useState('');
    const [paymentMethod, setPaymentMethod] = useState('Cash');
    const [paymentReference, setPaymentReference] = useState('');
    const [loading, setLoading] = useState(false);
    const [showReceipt, setShowReceipt] = useState(null);
    const [repairs, setRepairs] = useState([]);
    const [activeTab, setActiveTab] = useState('products'); // 'products' or 'repairs'

    const fetchData = async () => {
        const { data: pData } = await supabase.from('products').select('*').order('name');
        const { data: cData } = await supabase.from('customers').select('*').order('name');
        const { data: rData } = await supabase.from('repairs').select('*, customer:customers(name)').eq('status', 'Completed').order('created_at');

        if (pData) setProducts(pData);
        if (cData) setCustomers(cData);
        if (rData) setRepairs(rData);
    };

    useEffect(() => {
        fetchData();
        const productChannel = supabase.channel('products-pos').on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, fetchData).subscribe();
        const repairChannel = supabase.channel('repairs-pos').on('postgres_changes', { event: '*', schema: 'public', table: 'repairs' }, fetchData).subscribe();
        return () => {
            supabase.removeChannel(productChannel);
            supabase.removeChannel(repairChannel);
        };
    }, []);

    const filteredProducts = useMemo(() => {
        return products.filter(p =>
            p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (p.sku && p.sku.toLowerCase().includes(searchQuery.toLowerCase()))
        );
    }, [products, searchQuery]);

    const filteredRepairs = useMemo(() => {
        return repairs.filter(r =>
            r.device_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (r.customer?.name && r.customer.name.toLowerCase().includes(searchQuery.toLowerCase()))
        );
    }, [repairs, searchQuery]);

    const addToCart = (item, type = 'product') => {
        if (type === 'product') {
            if (item.stock_quantity <= 0) {
                toast.error("Out of stock!");
                return;
            }

            setCart(prev => {
                const existing = prev.find(i => i.product?.id === item.id);
                if (existing) {
                    if (existing.quantity >= item.stock_quantity) {
                        toast.error(`Only ${item.stock_quantity} available in stock.`);
                        return prev;
                    }
                    return prev.map(i => i.product?.id === item.id ? { ...i, quantity: i.quantity + 1 } : i);
                }
                return [...prev, { product: item, quantity: 1, discount: 0, type: 'product' }];
            });
        } else {
            // Add Repair Job
            setCart(prev => {
                if (prev.find(i => i.repair?.id === item.id)) {
                    toast.error("Repair job already in cart.");
                    return prev;
                }
                return [...prev, {
                    repair: item,
                    quantity: 1,
                    discount: 0,
                    type: 'repair',
                    // Map to a structure the cart/receipt understands
                    product: { name: `Repair: ${item.device_name}`, price: item.cost, id: `repair-${item.id}` }
                }];
            });
            if (item.customer_id) setSelectedCustomer(item.customer_id);
        }
    };

    const updateQuantity = (id, delta) => {
        setCart(prev => prev.map(item => {
            const itemId = item.type === 'product' ? item.product.id : item.repair.id;
            if (itemId === id) {
                if (item.type === 'repair') return item; // Repairs have quantity 1 always
                const newQuantity = item.quantity + delta;
                if (newQuantity < 1) return item;
                if (newQuantity > item.product.stock_quantity) {
                    toast.error(`Only ${item.product.stock_quantity} available in stock.`);
                    return item;
                }
                return { ...item, quantity: newQuantity };
            }
            return item;
        }));
    };

    const removeFromCart = (id) => {
        setCart(prev => prev.filter(item => {
            const itemId = item.type === 'product' ? item.product.id : item.repair.id;
            return itemId !== id;
        }));
    };

    const subtotal = cart.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
    const totalDiscount = cart.reduce((sum, item) => sum + ((item.discount || 0) * item.quantity), 0);
    const total = subtotal - totalDiscount;

    const handleCheckout = async () => {
        if (cart.length === 0) return toast.error("Cart is empty");
        if (!currentUser) return toast.error("Please log in to complete sale");
        if (paymentMethod !== 'Cash' && !paymentReference.trim()) {
            return toast.error(`Please enter ${paymentMethod} transaction reference.`);
        }

        setLoading(true);
        try {
            const { data: sale, error: saleError } = await supabase
                .from('sales')
                .insert({
                    total_amount: total,
                    payment_method: paymentMethod,
                    payment_reference: paymentMethod !== 'Cash' ? paymentReference : null,
                    user_id: currentUser.id,
                    customer_id: selectedCustomer || null,
                })
                .select()
                .single();

            if (saleError) throw saleError;

            // 2. Record Sale Items & Update Repairs/Stock
            for (const item of cart) {
                if (item.type === 'product') {
                    // Record Item
                    await supabase.from('sale_items').insert({
                        sale_id: sale.id,
                        product_id: item.product.id,
                        quantity: item.quantity,
                        unit_price: item.product.price
                    });

                    // Update Stock
                    await supabase
                        .from('products')
                        .update({ stock_quantity: item.product.stock_quantity - item.quantity })
                        .eq('id', item.product.id);
                } else if (item.type === 'repair') {
                    // Mark repair as delivered
                    await supabase
                        .from('repairs')
                        .update({ status: 'Delivered' })
                        .eq('id', item.repair.id);

                    // Optional: Link repair to sale if schema allows (not currently in schema, but good to note)
                }
            }

            toast.success("Transaction completed!");

            setShowReceipt({
                id: sale.id,
                total: total,
                paymentMethod,
                paymentReference: paymentMethod !== 'Cash' ? paymentReference : null,
                items: cart.map(i => ({
                    name: i.type === 'repair' ? `REPAIR: ${i.repair.device_name}` : i.product.name,
                    price: i.product.price,
                    quantity: i.quantity
                })),
                createdAt: new Date(),
                customerName: customers.find(c => c.id === (selectedCustomer))?.name || 'Walk-in'
            });

            setCart([]);
            setSelectedCustomer('');
            setSearchQuery('');
            setPaymentReference('');
        } catch (error) {
            console.error("Checkout error:", error);
            toast.error(error.message || "Failed to process transaction.");
        } finally {
            setLoading(false);
        }
    };



    return (
        <div className="h-[calc(100vh-6rem)] flex gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">

            {/* LEFT PANE - CART (1/3 Width) */}
            <div className="w-1/3 flex flex-col gap-4">
                <div className="glass-panel flex-1 flex flex-col overflow-hidden">
                    <div className="p-4 border-b border-white/5 bg-white/5 flex items-center gap-3">
                        <ShoppingCart className="w-5 h-5 text-primary" />
                        <h2 className="font-bold text-white tracking-wide uppercase text-sm">Current Sale</h2>
                    </div>

                    {/* Cart Items */}
                    <div className="flex-1 overflow-y-auto p-4 custom-scrollbar space-y-3">
                        {cart.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-white/30 gap-3">
                                <ShoppingCart className="w-12 h-12 opacity-50" />
                                <p>Cart is empty</p>
                            </div>
                        ) : (
                            cart.map(item => {
                                const itemId = item.type === 'product' ? item.product.id : item.repair.id;
                                return (
                                    <div key={itemId} className={`border rounded-xl p-3 flex flex-col gap-3 ${item.type === 'repair' ? 'bg-primary/5 border-primary/20' : 'bg-[#0a0a0a] border-white/10'}`}>
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <div className="font-medium text-white text-sm">
                                                    {item.type === 'repair' ? `Service: ${item.repair.device_name}` : item.product.name}
                                                </div>
                                                <div className="text-white/40 text-xs mt-0.5">
                                                    {item.type === 'repair' ? (item.repair.repair_type || 'Repair Job') : item.product.sku}
                                                </div>
                                            </div>
                                            <button onClick={() => removeFromCart(itemId)} className="text-white/40 hover:text-red-400 transition-colors">
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2 bg-white/5 rounded-lg border border-white/10 p-1">
                                                <button
                                                    onClick={() => item.type === 'product' && updateQuantity(itemId, -1)}
                                                    disabled={item.type === 'repair'}
                                                    className="p-1 hover:bg-white/10 rounded-md text-white/70 disabled:opacity-20"
                                                >
                                                    <Minus className="w-3 h-3" />
                                                </button>
                                                <span className="w-6 text-center text-sm font-medium">{item.quantity}</span>
                                                <button
                                                    onClick={() => item.type === 'product' && updateQuantity(itemId, 1)}
                                                    disabled={item.type === 'repair'}
                                                    className="p-1 hover:bg-white/10 rounded-md text-white/70 disabled:opacity-20"
                                                >
                                                    <Plus className="w-3 h-3" />
                                                </button>
                                            </div>
                                            <div className="font-mono text-white text-sm">
                                                Ksh {(item.product.price * item.quantity).toLocaleString()}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>

                    {/* Checkout Details */}
                    <div className="p-4 border-t border-white/5 bg-[#0a0a0a]/50 space-y-4">
                        <div className="space-y-2 text-sm">
                            <div className="flex justify-between text-white/50">
                                <span>Subtotal</span>
                                <span>Ksh {subtotal.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between text-xl font-bold text-white pt-2 border-t border-white/10">
                                <span>Total</span>
                                <span>Ksh {total.toLocaleString()}</span>
                            </div>
                        </div>

                        <div className="space-y-3 pt-2">
                            <select
                                value={selectedCustomer}
                                onChange={e => setSelectedCustomer(e.target.value)}
                                className="w-full bg-[#0a0a0a] border border-white/10 rounded-lg px-3 py-2.5 text-white/80 focus:outline-none focus:border-white/30 text-sm appearance-none"
                            >
                                <option value="">Walk-in Customer</option>
                                {customers.map(c => <option key={c.id} value={c.id}>{c.name} ({c.phone})</option>)}
                            </select>

                            <div className="grid grid-cols-3 gap-2">
                                {['Cash', 'M-Pesa', 'Card'].map(pm => (
                                    <button
                                        key={pm}
                                        onClick={() => { setPaymentMethod(pm); setPaymentReference(''); }}
                                        className={`py-2 text-xs font-medium rounded-lg border transition-colors flex flex-col items-center gap-1 ${paymentMethod === pm ? 'bg-primary/20 border-primary text-primary' : 'bg-[#0a0a0a] border-white/10 text-white/50 hover:bg-white/5'}`}
                                    >
                                        {pm === 'Cash' && <Banknote className="w-4 h-4" />}
                                        {pm === 'M-Pesa' && <Smartphone className="w-4 h-4" />}
                                        {pm === 'Card' && <CreditCard className="w-4 h-4" />}
                                        {pm}
                                    </button>
                                ))}
                            </div>

                            {paymentMethod !== 'Cash' && (
                                <div className="pt-2">
                                    <input
                                        type="text"
                                        placeholder={`${paymentMethod} Transaction Reference`}
                                        value={paymentReference}
                                        onChange={e => setPaymentReference(e.target.value)}
                                        className="w-full bg-[#0a0a0a] border border-white/10 rounded-lg px-3 py-2.5 text-white/80 focus:outline-none focus:border-white/30 text-sm font-mono uppercase"
                                    />
                                </div>
                            )}

                            <button
                                onClick={handleCheckout}
                                disabled={cart.length === 0 || loading}
                                className="w-full bg-white text-black py-3.5 rounded-xl font-bold hover:bg-white/90 transition-colors shadow-sm disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {loading ? 'Processing...' : `Charge Ksh ${total.toLocaleString()}`}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* RIGHT PANE - PRODUCTS/REPAIRS (2/3 Width) */}
            <div className="w-2/3 flex flex-col gap-4">
                <div className="glass-panel p-4 flex flex-col gap-4">
                    <div className="flex gap-2 p-1 bg-[#0a0a0a] border border-white/10 rounded-xl w-fit">
                        <button
                            onClick={() => { setActiveTab('products'); setSearchQuery(''); }}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'products' ? 'bg-primary/20 text-primary border border-primary/30' : 'text-white/40 hover:text-white'}`}
                        >
                            Products
                        </button>
                        <button
                            onClick={() => { setActiveTab('repairs'); setSearchQuery(''); }}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'repairs' ? 'bg-primary/20 text-primary border border-primary/30' : 'text-white/40 hover:text-white'}`}
                        >
                            Completed Repairs
                        </button>
                    </div>
                    <div className="relative">
                        <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
                        <input
                            type="text"
                            placeholder={activeTab === 'products' ? "Search products by name or SKU..." : "Search repairs by device or customer..."}
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            className="w-full bg-[#0a0a0a] border border-white/10 rounded-xl pl-10 pr-4 py-3 text-white placeholder:text-white/30 focus:outline-none focus:border-white/30 transition-colors"
                        />
                    </div>
                </div>

                <div className="glass-panel flex-1 p-4 overflow-y-auto custom-scrollbar">
                    {activeTab === 'products' ? (
                        filteredProducts.length === 0 ? (
                            <div className="h-full flex items-center justify-center text-white/40">
                                No products found matching "{searchQuery}"
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                                {filteredProducts.map(product => {
                                    const inCart = cart.find(i => i.product.id === product.id)?.quantity || 0;
                                    const isOutOfStock = product.stock_quantity <= 0;

                                    return (
                                        <div
                                            key={product.id}
                                            onClick={() => addToCart(product, 'product')}
                                            className={`bg-[#0a0a0a] border border-white/10 rounded-xl p-4 cursor-pointer transition-all hover:border-white/30 relative overflow-hidden group ${isOutOfStock ? 'opacity-50' : ''}`}
                                        >
                                            {inCart > 0 && (
                                                <div className="absolute top-0 right-0 bg-primary text-black font-bold text-xs px-2 py-1 rounded-bl-lg">
                                                    {inCart}
                                                </div>
                                            )}
                                            <div className="aspect-square bg-white/5 rounded-lg mb-3 flex items-center justify-center border border-white/5">
                                                <ShoppingCart className="w-8 h-8 text-white/20" />
                                            </div>
                                            <div className="font-medium text-white text-sm line-clamp-2 leading-tight mb-1 group-hover:text-primary transition-colors">
                                                {product.name}
                                            </div>
                                            <div className="flex items-end justify-between mt-2">
                                                <div className="font-mono text-white text-sm">
                                                    Ksh {product.price?.toLocaleString() || 0}
                                                </div>
                                                <div className={`text-[10px] font-medium px-2 py-0.5 rounded ${isOutOfStock ? 'bg-red-500/20 text-red-400' : 'bg-green-500/20 text-green-400'}`}>
                                                    {isOutOfStock ? 'OUT' : `${product.stock_quantity} left`}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )
                    ) : (
                        filteredRepairs.length === 0 ? (
                            <div className="h-full flex items-center justify-center text-white/40 text-center">
                                <div className="space-y-2">
                                    <Clock className="w-12 h-12 mx-auto opacity-20" />
                                    <p>No completed repairs found.<br /><span className="text-xs text-white/20">Only jobs marked as 'Completed' appear here for pickup.</span></p>
                                </div>
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                                {filteredRepairs.map(repair => {
                                    const inCart = cart.find(i => i.repair?.id === repair.id);
                                    return (
                                        <div
                                            key={repair.id}
                                            onClick={() => addToCart(repair, 'repair')}
                                            className={`bg-primary/5 border border-primary/20 rounded-xl p-4 cursor-pointer transition-all hover:border-primary/40 relative overflow-hidden group ${inCart ? 'ring-2 ring-primary bg-primary/10' : ''}`}
                                        >
                                            <div className="font-bold text-white text-sm line-clamp-1 mb-1 group-hover:text-primary transition-colors">
                                                {repair.device_name}
                                            </div>
                                            <div className="text-white/40 text-[10px] mb-3 flex items-center gap-1">
                                                <User className="w-3 h-3" /> {repair.customer?.name || 'Unknown'}
                                            </div>
                                            <div className="flex items-end justify-between mt-2">
                                                <div className="font-mono text-primary font-bold text-sm">
                                                    Ksh {Number(repair.cost).toLocaleString()}
                                                </div>
                                                <div className="text-[10px] bg-primary text-black px-2 py-0.5 rounded font-bold">
                                                    PICKUP
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )
                    )}
                </div>
            </div>

            {showReceipt && (
                <Receipt
                    data={showReceipt}
                    type="sale"
                    onClose={() => setShowReceipt(null)}
                />
            )}
        </div>
    );
}
