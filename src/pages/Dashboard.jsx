import { TrendingUp, Package, AlertCircle, Users, Activity } from 'lucide-react';
import { cn } from '../utils/cn';
import { useState, useEffect } from 'react';
import { supabase } from '../config/supabase';

// eslint-disable-next-line no-unused-vars
const MetricCard = ({ title, value, icon: Icon, isPositive, trend }) => (
    <div className="glass-panel p-6 relative overflow-hidden group">
        <div className="absolute -right-6 -top-6 w-24 h-24 bg-white/5 rounded-full blur-2xl group-hover:bg-primary/10 transition-colors duration-500"></div>
        <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-white/5 rounded-xl border border-white/10">
                <Icon className="w-6 h-6 text-white/80" />
            </div>
            {trend && (
                <span className={cn(
                    "px-2.5 py-1 rounded-full text-xs font-medium backdrop-blur-sm border flex items-center gap-1",
                    isPositive ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-red-500/10 text-red-400 border-red-500/20"
                )}>
                    {trend}
                </span>
            )}
        </div>
        <div>
            <h3 className="text-white/50 font-medium text-sm mb-1">{title}</h3>
            <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold text-white tracking-tight">{value}</span>
            </div>
        </div>
    </div>
);

export default function Dashboard() {
    const [stats, setStats] = useState({
        revenue: 0,
        products: 0,
        lowStock: 0,
        shops: 0,
        sales: []
    });

    const fetchStats = async () => {
        // Fetch Sales & Revenue
        const { data: sales, error: salesError } = await supabase
            .from('sales')
            .select('id, total_amount, payment_method, created_at')
            .order('created_at', { ascending: false })
            .limit(5);

        const { data: totalRevenue, error: revError } = await supabase
            .from('sales')
            .select('total_amount');

        if (!salesError && !revError) {
            const revenue = (totalRevenue || []).reduce((sum, s) => sum + Number(s.total_amount || 0), 0);
            setStats(prev => ({ ...prev, sales: sales || [], revenue }));
        }

        // Fetch Products & Low Stock
        const { data: products, error: prodError } = await supabase
            .from('products')
            .select('stock_quantity');

        if (!prodError) {
            const lowStock = (products || []).filter(p => p.stock_quantity < 10).length;
            setStats(prev => ({ ...prev, products: products.length, lowStock }));
        }

        // Fetch Shops
        const { count: shopCount, error: shopError } = await supabase
            .from('shops')
            .select('*', { count: 'exact', head: true });

        if (!shopError) {
            setStats(prev => ({ ...prev, shops: shopCount || 0 }));
        }
    };

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        fetchStats();

        // Real-time subscription for all changes
        const channel = supabase
            .channel('db-changes')
            .on('postgres_changes', { event: '*', schema: 'public' }, () => {
                fetchStats();
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    return (
        <div className="space-y-8 animate-in fade-in duration-700">
            <header>
                <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-white/60">
                    Dashboard Overview
                </h1>
                <p className="text-white/50 mt-1">Real-time performance and inventory insights.</p>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                <MetricCard
                    title="Total Revenue"
                    value={`Ksh ${stats.revenue.toLocaleString()}`}
                    trend="+100%"
                    isPositive={true}
                    icon={TrendingUp}
                />
                <MetricCard
                    title="Total Products"
                    value={stats.products}
                    icon={Package}
                />
                <MetricCard
                    title="Low Stock Items"
                    value={stats.lowStock}
                    trend={stats.lowStock > 0 ? "Needs Attention" : "All Good"}
                    isPositive={stats.lowStock === 0}
                    icon={AlertCircle}
                />
                <MetricCard
                    title="Active Shops"
                    value={stats.shops}
                    icon={Users}
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 glass-panel p-6 h-96 flex flex-col">
                    <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
                        <Activity className="w-5 h-5 text-primary" /> Revenue Analytics
                    </h2>
                    <div className="flex-1 border border-white/5 rounded-2xl bg-white/[0.02] flex items-center justify-center relative overflow-hidden">
                        <div className="absolute inset-0 flex items-end justify-around px-8 opacity-20">
                            {[40, 70, 45, 90, 65, 110, 85, 120, 100].map((h, i) => (
                                <div key={i} className="w-8 bg-primary rounded-t-lg transition-all duration-1000" style={{ height: `${h}%` }}></div>
                            ))}
                        </div>
                        <p className="text-white/30 text-sm z-10 font-medium bg-black/40 px-4 py-2 rounded-full backdrop-blur-md border border-white/10">
                            Live charts will scale as data grows
                        </p>
                    </div>
                </div>

                <div className="glass-panel p-6 flex flex-col">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-lg font-semibold">Recent Sales</h2>
                    </div>
                    <div className="space-y-4 flex-1 overflow-y-auto custom-scrollbar">
                        {stats.sales.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-white/20 gap-2">
                                <TrendingUp className="w-8 h-8" />
                                <p className="text-sm">No sales yet</p>
                            </div>
                        ) : (
                            stats.sales.map((sale) => (
                                <div key={sale.id} className="flex items-center gap-4 p-3 rounded-xl hover:bg-white/5 transition-colors border border-transparent hover:border-white/5 cursor-pointer group">
                                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20 text-primary">
                                        <TrendingUp className="w-4 h-4" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-white truncate">Sale #{sale.id.slice(-4)}</p>
                                        <p className="text-xs text-white/50 truncate">{sale.payment_method || 'Cash'}</p>
                                    </div>
                                    <span className="text-sm font-bold text-white group-hover:text-primary transition-colors">
                                        Ksh {Number(sale.total_amount || 0).toLocaleString()}
                                    </span>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
