import { useState, useEffect } from 'react';
import { supabase } from '../../config/supabase';
import { Package, TrendingUp, AlertCircle, CheckCircle2, Flame, ArrowUpRight } from 'lucide-react';

export default function StockMovementSummary() {
    const [movementData, setMovementData] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchData = async () => {
        try {
            // Fetch sale items joined with product info
            const { data, error } = await supabase
                .from('sale_items')
                .select(`
                    product_id,
                    quantity,
                    products (
                        name
                    )
                `);

            if (error) throw error;

            // Aggregate quantity by product
            const aggregation = data.reduce((acc, item) => {
                const id = item.product_id;
                const name = item.products?.name || 'Unknown Product';
                if (!acc[id]) {
                    acc[id] = { name, totalSold: 0 };
                }
                acc[id].totalSold += item.quantity;
                return acc;
            }, {});

            // Convert to array and determine status
            const result = Object.entries(aggregation).map(([id, info]) => {
                let status = 'Normal';
                let statusIcon = null;
                let statusClass = 'text-white/60';

                if (info.totalSold > 40) {
                    status = 'Fast Moving';
                    statusIcon = <Flame className="w-4 h-4 text-orange-500" />;
                    statusClass = 'text-orange-500';
                } else if (info.totalSold > 20) {
                    status = 'High Demand';
                    statusClass = 'text-blue-400';
                }

                return {
                    id,
                    name: info.name,
                    totalSold: info.totalSold,
                    status,
                    statusIcon,
                    statusClass
                };
            }).sort((a, b) => b.totalSold - a.totalSold);

            setMovementData(result);
        } catch (error) {
            console.error('Error fetching stock movement:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
        const channel = supabase.channel('sale_items_changes')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'sale_items' }, fetchData)
            .subscribe();
        return () => supabase.removeChannel(channel);
    }, []);

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <header>
                <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-white/60">
                    Stock Movement Summary
                </h1>
                <p className="text-white/50 mt-1">Real-time analysis of product sales velocity and demand.</p>
            </header>

            <div className="glass-panel overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-white/10 bg-white/5 text-white/50 text-xs uppercase tracking-wider">
                                <th className="p-4 font-semibold">Item</th>
                                <th className="p-4 font-semibold">Product Name</th>
                                <th className="p-4 font-semibold">Total Sold</th>
                                <th className="p-4 font-semibold">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {loading ? (
                                <tr>
                                    <td colSpan="4" className="p-8 text-center text-white/30">Loading movement data...</td>
                                </tr>
                            ) : movementData.length === 0 ? (
                                <tr>
                                    <td colSpan="4" className="p-8 text-center text-white/30">No sales movements recorded.</td>
                                </tr>
                            ) : (
                                movementData.map((item, index) => (
                                    <tr key={item.id} className="hover:bg-white/[0.02] transition-colors group">
                                        <td className="p-4 text-sm text-white/40 font-mono">{index + 1}</td>
                                        <td className="p-4 font-medium text-white group-hover:text-primary transition-colors">{item.name}</td>
                                        <td className="p-4">
                                            <div className="flex items-center gap-2">
                                                <span className="text-lg font-bold text-white tracking-tight">{item.totalSold}</span>
                                                <ArrowUpRight className="w-3 h-3 text-white/20" />
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <div className={`flex items-center gap-2 text-sm font-semibold ${item.statusClass}`}>
                                                {item.statusIcon}
                                                {item.status}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Insight Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="glass-panel p-5 border-l-4 border-orange-500/50 hover:bg-white/[0.02] transition-colors">
                    <h4 className="text-white/40 text-xs uppercase font-bold tracking-widest mb-2">Top Performer</h4>
                    <p className="text-white font-bold text-lg">{movementData[0]?.name || '---'}</p>
                    <p className="text-orange-500 text-sm mt-1 flex items-center gap-1 font-semibold">
                        <Flame className="w-4 h-4" /> Leading in sales
                    </p>
                </div>
                <div className="glass-panel p-5 border-l-4 border-blue-500/50 hover:bg-white/[0.02] transition-colors">
                    <h4 className="text-white/40 text-xs uppercase font-bold tracking-widest mb-2">High Demand Items</h4>
                    <p className="text-white font-bold text-lg">{movementData.filter(i => i.totalSold > 20).length} Products</p>
                    <p className="text-blue-400 text-sm mt-1 font-semibold">Consistency in turnover</p>
                </div>
                <div className="glass-panel p-5 border-l-4 border-white/20 hover:bg-white/[0.02] transition-colors">
                    <h4 className="text-white/40 text-xs uppercase font-bold tracking-widest mb-2">Inventory Score</h4>
                    <p className="text-white font-bold text-lg">94.2%</p>
                    <p className="text-white/40 text-sm mt-1 font-semibold">Healthy movement ratio</p>
                </div>
            </div>
        </div>
    );
}
