import { useState, useEffect } from 'react';
import { supabase } from '../../config/supabase';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';

export default function AddProduct() {
    const navigate = useNavigate();
    const { isAdmin } = useAuth();
    const [loading, setLoading] = useState(false);

    // Form state corresponding to the UI
    const [formData, setFormData] = useState({
        name: '',
        categoryId: '',
        unitId: '',
        purchasePrice: '',
        sellingPrice: '',
        stock: '',
        lowStockAlert: '3',
        discountAmount: '0',
        brandId: '',
        barcode: '',
        supplierId: '',
        paymentMode: ''
    });

    const [autoBarcode, setAutoBarcode] = useState(false);

    // Metadata state from Supabase
    const [categories, setCategories] = useState([]);
    const [brands, setBrands] = useState([]);
    const [units, setUnits] = useState([]);
    const [suppliers, setSuppliers] = useState([]);

    const paymentModes = ['Cash', 'M-Pesa', 'Credit Card', 'Bank Transfer'];

    const fetchMetadata = async () => {
        const { data: cData } = await supabase.from('categories').select('*').order('name');
        const { data: bData } = await supabase.from('brands').select('*').order('name');
        const { data: uData } = await supabase.from('units').select('*').order('name');
        const { data: sData } = await supabase.from('customers').select('*').order('name'); // Using customers as suppliers for now if no separate table

        if (cData) setCategories(cData);
        if (bData) setBrands(bData);
        if (uData) setUnits(uData);
        if (sData) setSuppliers(sData);
    };

    useEffect(() => {
        fetchMetadata();
    }, []);

    const handleChange = (e) => {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const finalBarcode = (autoBarcode && !formData.barcode)
                ? 'LUM-' + Math.floor(Math.random() * 10000000)
                : formData.barcode;

            const { error } = await supabase.from('products').insert({
                name: formData.name,
                sku: finalBarcode,
                category_id: formData.categoryId,
                brand_id: formData.brandId,
                unit_id: formData.unitId,
                price: Number(formData.sellingPrice),
                cost: Number(formData.purchasePrice),
                stock_quantity: Number(formData.stock),
            });

            if (error) throw error;

            toast.success("Product added successfully!");
            navigate('/products');
        } catch (error) {
            console.error("Error adding product:", error);
            toast.error(error.message || "Failed to add product");
        } finally {
            setLoading(false);
        }
    };

    // UI Helper for Input Label
    const Label = ({ children, required = false }) => (
        <label className="block text-xs font-bold text-white/50 tracking-wider uppercase mb-2">
            {children} {required && <span className="text-white/40">*</span>}
        </label>
    );

    // UI Helper for Numbered Section Header
    const SectionHeader = ({ number, title }) => (
        <div className="flex items-center gap-3 mb-6">
            <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center text-xs font-bold text-white shadow-inner border border-white/5">
                {number}
            </div>
            <h2 className="text-base font-bold text-white tracking-wide uppercase">{title}</h2>
        </div>
    );

    return (
        <div className="w-full max-w-5xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">
            <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-white/5">
                <div>
                    <h1 className="text-3xl font-bold text-white">Add New Product</h1>
                    <p className="text-white/50 mt-1">Fill in the details below to catalog a new item in your inventory.</p>
                </div>
                <div className="flex gap-3">
                    <Link
                        to="/products"
                        className="bg-white text-black px-5 py-2.5 rounded-lg font-medium hover:bg-white/90 transition-colors shadow-sm"
                    >
                        Product List
                    </Link>
                    <button className="bg-white text-black px-5 py-2.5 rounded-lg font-medium hover:bg-white/90 transition-colors shadow-sm">
                        Add Bulk Products
                    </button>
                </div>
            </header>

            <form onSubmit={handleSubmit} className="space-y-10">

                {/* 1. GENERAL INFORMATION */}
                <section>
                    <SectionHeader number="1" title="GENERAL INFORMATION" />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-8 border-b border-white/5">
                        <div className="md:col-span-1">
                            <Label required>PRODUCT NAME</Label>
                            <input
                                type="text"
                                name="name"
                                required
                                value={formData.name}
                                onChange={handleChange}
                                placeholder="e.g. Wireless Mouse"
                                className="w-full bg-[#0a0a0a] border border-white/10 rounded-lg px-4 py-3.5 text-white placeholder:text-white/20 focus:outline-none focus:border-white/30 transition-colors"
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-6">
                            <div>
                                <Label required>CATEGORY</Label>
                                <select
                                    name="categoryId"
                                    required
                                    value={formData.categoryId}
                                    onChange={handleChange}
                                    className="w-full bg-[#0a0a0a] border border-white/10 rounded-lg px-4 py-3.5 text-white focus:outline-none focus:border-white/30 transition-colors appearance-none cursor-pointer"
                                >
                                    <option value="">Select Category</option>
                                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                </select>
                            </div>
                            <div>
                                <Label required>UNIT</Label>
                                <select
                                    name="unitId"
                                    required
                                    value={formData.unitId}
                                    onChange={handleChange}
                                    className="w-full bg-[#0a0a0a] border border-white/10 rounded-lg px-4 py-3.5 text-white focus:outline-none focus:border-white/30 transition-colors appearance-none cursor-pointer"
                                >
                                    <option value="">Select Unit</option>
                                    {units.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                                </select>
                            </div>
                        </div>
                    </div>
                </section>

                {/* 2. PRICING & STOCK */}
                <section>
                    <SectionHeader number="2" title="PRICING & STOCK" />
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pb-8 border-b border-white/5">
                        {isAdmin && (
                            <div>
                                <Label required>PURCHASE PRICE</Label>
                                <input type="number" name="purchasePrice" required min="0" step="0.01" value={formData.purchasePrice} onChange={handleChange} className="w-full bg-[#0a0a0a] border border-white/10 rounded-lg px-4 py-3.5 text-white placeholder:text-white/20 focus:outline-none focus:border-white/30 transition-colors" />
                            </div>
                        )}
                        <div>
                            <Label required>SELLING PRICE</Label>
                            <input type="number" name="sellingPrice" required min="0" step="0.01" value={formData.sellingPrice} onChange={handleChange} className="w-full bg-[#0a0a0a] border border-white/10 rounded-lg px-4 py-3.5 text-white placeholder:text-white/20 focus:outline-none focus:border-white/30 transition-colors" />
                        </div>
                        <div>
                            <Label required>STOCK</Label>
                            <input type="number" name="stock" required min="0" value={formData.stock} onChange={handleChange} className="w-full bg-[#0a0a0a] border border-white/10 rounded-lg px-4 py-3.5 text-white placeholder:text-white/20 focus:outline-none focus:border-white/30 transition-colors" />
                        </div>
                        <div>
                            <Label>LOW STOCK ALERT</Label>
                            <input type="number" name="lowStockAlert" min="0" value={formData.lowStockAlert} onChange={handleChange} className="w-full bg-[#0a0a0a] border border-white/10 rounded-lg px-4 py-3.5 text-white placeholder:text-white/20 focus:outline-none focus:border-white/30 transition-colors" />
                        </div>
                        <div>
                            <Label>DISCOUNT AMOUNT</Label>
                            <input type="number" name="discountAmount" min="0" step="0.01" value={formData.discountAmount} onChange={handleChange} className="w-full bg-[#0a0a0a] border border-white/10 rounded-lg px-4 py-3.5 text-white placeholder:text-white/20 focus:outline-none focus:border-white/30 transition-colors" />
                        </div>
                        <div>
                            <Label>BRAND</Label>
                            <select name="brandId" value={formData.brandId} onChange={handleChange} className="w-full bg-[#0a0a0a] border border-white/10 rounded-lg px-4 py-3.5 text-white focus:outline-none focus:border-white/30 transition-colors appearance-none cursor-pointer">
                                <option value="">Brand Name</option>
                                {brands.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                            </select>
                        </div>
                    </div>
                </section>

                {/* 3. MEDIA & BARCODE */}
                <section>
                    <SectionHeader number="3" title="MEDIA & BARCODE" />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pb-8 border-b border-white/5">

                        <div className="border border-white/5 bg-white/[0.02] p-6 rounded-xl">
                            <label className="block text-sm font-medium text-white/50 mb-4">Picture</label>
                            <div className="flex items-center gap-4 bg-[#0a0a0a] border border-white/10 rounded-lg p-1.5 focus-within:border-white/30 transition-colors">
                                <button type="button" className="bg-white/10 hover:bg-white/15 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors">
                                    Choose File
                                </button>
                                <span className="text-white/40 text-sm">No file chosen</span>
                            </div>
                        </div>

                        <div>
                            <div className="flex items-center gap-3 mb-2">
                                {/* Simulated Toggle Switch with AUTO text */}
                                <button
                                    type="button"
                                    onClick={() => setAutoBarcode(!autoBarcode)}
                                    className={`flex items-center justify-center px-2 py-0.5 rounded text-[10px] font-bold transition-colors ${autoBarcode ? 'bg-white text-black' : 'bg-white/20 text-white/50'}`}
                                >
                                    AUTO
                                </button>
                                <Label>BARCODE</Label>
                            </div>
                            <input
                                type="text"
                                name="barcode"
                                value={formData.barcode}
                                onChange={handleChange}
                                disabled={autoBarcode}
                                placeholder="Scan item barcode..."
                                className="w-full bg-[#0a0a0a] border border-white/10 rounded-lg px-4 py-3.5 text-white placeholder:text-white/20 focus:outline-none focus:border-white/30 transition-colors font-mono disabled:opacity-50"
                            />
                        </div>

                    </div>
                </section>

                {/* 4. SUPPLIER & PAYMENT */}
                <section>
                    <SectionHeader number="4" title="SUPPLIER & PAYMENT" />
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pb-2">
                        <div className="md:col-span-1">
                            <Label required>Supplier</Label>
                            <select
                                name="supplierId"
                                value={formData.supplierId}
                                onChange={handleChange}
                                className="w-full bg-[#0a0a0a] border border-white/10 rounded-lg px-4 py-3.5 text-white focus:outline-none focus:border-white/30 transition-colors appearance-none cursor-pointer"
                            >
                                <option value="">Select Supplier</option>
                                {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                            </select>
                        </div>
                        <div className="md:col-span-1">
                            <Label required>Mode of Payment</Label>
                            <select
                                name="paymentMode"
                                value={formData.paymentMode}
                                onChange={handleChange}
                                className="w-full bg-[#0a0a0a] border border-white/10 rounded-lg px-4 py-3.5 text-white focus:outline-none focus:border-white/30 transition-colors appearance-none cursor-pointer"
                            >
                                <option value="">Select Mode...</option>
                                {paymentModes.map(pm => <option key={pm} value={pm}>{pm}</option>)}
                            </select>
                        </div>
                    </div>
                </section>

                <div className="mt-8 pt-6 border-t border-white/10 flex justify-end">
                    <button
                        type="submit"
                        disabled={loading}
                        className="bg-white text-black px-8 py-3.5 rounded-lg font-bold hover:bg-white/90 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? 'Saving...' : 'Save Product'}
                    </button>
                </div>

            </form>
        </div>
    );
}
