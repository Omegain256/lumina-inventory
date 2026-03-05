import { useState, useEffect, useMemo } from 'react';
import { collection, query, orderBy, onSnapshot, addDoc, doc, updateDoc, serverTimestamp, increment } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { ShoppingCart, Search, Plus, Minus, Trash2, User, CreditCard, Banknote, Smartphone, Printer } from 'lucide-react';
import toast from 'react-hot-toast';
import Receipt from '../../components/shared/Receipt';

export default function NewSale() {
    const [products, setProducts] = useState([]);
    const [customers, setCustomers] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [cart, setCart] = useState([]);
    const [selectedCustomer, setSelectedCustomer] = useState('');
    const [paymentMethod, setPaymentMethod] = useState('Cash');
    const [loading, setLoading] = useState(false);
    const [showReceipt, setShowReceipt] = useState(null);

    useEffect(() => {
        const unsubP = onSnapshot(query(collection(db, 'products'), orderBy('name')), (snap) => setProducts(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
        const unsubC = onSnapshot(query(collection(db, 'customers'), orderBy('name')), (snap) => setCustomers(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
        return () => { unsubP(); unsubC(); };
    }, []);

    const filteredProducts = useMemo(() => {
        return products.filter(p =>
            p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (p.sku && p.sku.toLowerCase().includes(searchQuery.toLowerCase()))
        );
    }, [products, searchQuery]);

    const addToCart = (product) => {
        if (product.stock <= 0) {
            toast.error("Out of stock!");
            return;
        }

        setCart(prev => {
            const existing = prev.find(item => item.product.id === product.id);
            if (existing) {
                if (existing.quantity >= product.stock) {
                    toast.error(`Only ${product.stock} available in stock.`);
                    return prev;
                }
                return prev.map(item => item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
            }
            return [...prev, { product, quantity: 1, discount: 0 }];
        });
    };

    const updateQuantity = (productId, delta) => {
        setCart(prev => prev.map(item => {
            if (item.product.id === productId) {
                const newQuantity = item.quantity + delta;
                if (newQuantity < 1) return item;
                if (newQuantity > item.product.stock) {
                    toast.error(`Only ${item.product.stock} available in stock.`);
                    return item;
                }
                return { ...item, quantity: newQuantity };
            }
            return item;
        }));
    };

    const removeFromCart = (productId) => {
        setCart(prev => prev.filter(item => item.product.id !== productId));
    };

    const handleCheckout = async () => {
        if (cart.length === 0) return toast.error("Cart is empty");

        setLoading(true);
        try {
            const subtotal = cart.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
            const totalDiscount = cart.reduce((sum, item) => sum + (item.discount * item.quantity), 0);
            const total = subtotal - totalDiscount;

            // 1. Record Sale
            const saleRef = await addDoc(collection(db, 'sales'), {
                items: cart.map(i => ({
                    productId: i.product.id,
                    name: i.product.name,
                    sku: i.product.sku,
                    quantity: i.quantity,
                    price: i.product.price,
                    discount: i.discount
                })),
                subtotal,
                totalDiscount,
                total,
                customerId: selectedCustomer,
                paymentMethod,
                createdAt: serverTimestamp()
            });

            // 2. Adjust Stock
            for (const item of cart) {
                const productRef = doc(db, 'products', item.product.id);
                await updateDoc(productRef, {
                    stock: increment(-item.quantity)
                });
            }

            toast.success("Sale completed successfully!");

            // Show receipt after successful sale
            const saleData = {
                id: saleRef.id,
                total: total,
                paymentMethod,
                items: cart.map(i => ({ name: i.product.name, price: i.product.price, quantity: i.quantity })),
                createdAt: new Date()
            };
            setShowReceipt(saleData);

            setCart([]);
            setSelectedCustomer('');
            setSearchQuery('');
        } catch (error) {
            console.error("Checkout error:", error);
            toast.error("Failed to process sale.");
        } finally {
            setLoading(false);
        }
    };

    const subtotal = cart.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
    const totalDiscount = cart.reduce((sum, item) => sum + (item.discount * item.quantity), 0);
    const total = subtotal - totalDiscount;

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
                            cart.map(item => (
                                <div key={item.product.id} className="bg-[#0a0a0a] border border-white/10 rounded-xl p-3 flex flex-col gap-3">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <div className="font-medium text-white text-sm">{item.product.name}</div>
                                            <div className="text-white/40 text-xs mt-0.5">{item.product.sku}</div>
                                        </div>
                                        <button onClick={() => removeFromCart(item.product.id)} className="text-white/40 hover:text-red-400 transition-colors">
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2 bg-white/5 rounded-lg border border-white/10 p-1">
                                            <button onClick={() => updateQuantity(item.product.id, -1)} className="p-1 hover:bg-white/10 rounded-md text-white/70"><Minus className="w-3 h-3" /></button>
                                            <span className="w-6 text-center text-sm font-medium">{item.quantity}</span>
                                            <button onClick={() => updateQuantity(item.product.id, 1)} className="p-1 hover:bg-white/10 rounded-md text-white/70"><Plus className="w-3 h-3" /></button>
                                        </div>
                                        <div className="font-mono text-white text-sm">
                                            Ksh {(item.product.price * item.quantity).toLocaleString()}
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    {/* Checkout Details */}
                    <div className="p-4 border-t border-white/5 bg-[#0a0a0a]/50 space-y-4">
                        <div className="space-y-2 text-sm">
                            <div className="flex justify-between text-white/50">
                                <span>Subtotal</span>
                                <span>Ksh {subtotal.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between text-white/50">
                                <span>Discount</span>
                                <span>- Ksh {totalDiscount.toLocaleString()}</span>
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
                                        onClick={() => setPaymentMethod(pm)}
                                        className={`py-2 text-xs font-medium rounded-lg border transition-colors flex flex-col items-center gap-1 ${paymentMethod === pm ? 'bg-primary/20 border-primary text-primary' : 'bg-[#0a0a0a] border-white/10 text-white/50 hover:bg-white/5'}`}
                                    >
                                        {pm === 'Cash' && <Banknote className="w-4 h-4" />}
                                        {pm === 'M-Pesa' && <Smartphone className="w-4 h-4" />}
                                        {pm === 'Card' && <CreditCard className="w-4 h-4" />}
                                        {pm}
                                    </button>
                                ))}
                            </div>

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

            {/* RIGHT PANE - PRODUCTS (2/3 Width) */}
            <div className="w-2/3 flex flex-col gap-4">
                <div className="glass-panel p-4 flex gap-4">
                    <div className="relative flex-1">
                        <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
                        <input
                            type="text"
                            placeholder="Search products by name or SKU..."
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            className="w-full bg-[#0a0a0a] border border-white/10 rounded-xl pl-10 pr-4 py-3 text-white placeholder:text-white/30 focus:outline-none focus:border-white/30 transition-colors"
                        />
                    </div>
                </div>

                <div className="glass-panel flex-1 p-4 overflow-y-auto custom-scrollbar">
                    {filteredProducts.length === 0 ? (
                        <div className="h-full flex items-center justify-center text-white/40">
                            No products found matching "{searchQuery}"
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                            {filteredProducts.map(product => {
                                const inCart = cart.find(i => i.product.id === product.id)?.quantity || 0;
                                const isOutOfStock = product.stock <= 0;

                                return (
                                    <div
                                        key={product.id}
                                        onClick={() => addToCart(product)}
                                        className={`bg-[#0a0a0a] border border-white/10 rounded-xl p-4 cursor-pointer transition-all hover:border-white/30 relative overflow-hidden group ${isOutOfStock ? 'opacity-50' : ''}`}
                                    >
                                        {inCart > 0 && (
                                            <div className="absolute top-0 right-0 bg-primary text-black font-bold text-xs px-2 py-1 rounded-bl-lg">
                                                {inCart}
                                            </div>
                                        )}
                                        <div className="aspect-square bg-white/5 rounded-lg mb-3 flex items-center justify-center border border-white/5">
                                            {/* Placeholder for Product Image */}
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
                                                {isOutOfStock ? 'OUT' : `${product.stock} left`}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
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
