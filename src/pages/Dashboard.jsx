import { TrendingUp, Package, AlertCircle, Users, Activity, BarChart3, Plus, Tag, ShoppingCart, ArrowRight, Sparkles } from 'lucide-react';
import { cn } from '../utils/cn';
import { useState, useEffect } from 'react';
import { supabase } from '../config/supabase';
import { NavLink } from 'react-router-dom';
import SaleDetailsModal from '../components/SaleDetailsModal';

const MetricCard = ({ title, value, icon: Icon, isPositive, trend, colorClass }) => (
    <div className="glass-panel p-6 relative overflow-hidden group">
        <div className={cn("absolute -right-6 -top-6 w-24 h-24 rounded-full blur-2xl group-hover:opacity-30 transition-opacity duration-500 opacity-20 bg-gradient-to-br", colorClass)}></div>
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

const SetupStep = ({ icon: Icon, title, description, to, colorClass, done }) => (
    <NavLink
        to={to}
        className="flex items-center gap-4 p-4 rounded-2xl border border-white/10 bg-white/[0.03] hover:bg-white/[0.07] hover:border-white/20 transition-all duration-300 group"
    >
        <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center shrink-0 bg-gradient-to-br", colorClass)}>
            <Icon className="w-5 h-5 text-white" />
        </div>
        <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-white">{title}</p>
            <p className="text-xs text-white/40 mt-0.5">{description}</p>
        </div>
        {done
            ? <span className="text-xs px-2 py-1 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/25 font-medium">Done</span>
            : <ArrowRight className="w-4 h-4 text-white/30 group-hover:text-white/70 group-hover:translate-x-1 transition-all duration-300" />
        }
    </NavLink>
);

export default function Dashboard() {
    const [stats, setStats] = useState({
        revenue: 0,
        revenueToday: 0,
        products: 0,
        lowStock: 0,
        shops: 0,
        sales: [],
        chartData: []
    });
    const [loading, setLoading] = useState(true);
    const [selectedSaleId, setSelectedSaleId] = useState(null);
    const isFresh = !loading && stats.products === 0 && stats.revenue === 0;

    const fetchStats = async () => {
        setLoading(true);
        try {
            // Fetch Sales & Revenue
            const { data: allSales, error: salesError } = await supabase
                .from('sales')
                .select('id, total_amount, payment_method, created_at')
                .order('created_at', { ascending: false });

            if (!salesError) {
                const totalRevenue = (allSales || []).reduce((sum, s) => sum + Number(s.total_amount || 0), 0);

                // Calculate Today's Revenue
                const today = new Date().toLocaleDateString();
                const revenueToday = (allSales || [])
                    .filter(s => new Date(s.created_at).toLocaleDateString() === today)
                    .reduce((sum, s) => sum + Number(s.total_amount || 0), 0);

                // Generate Chart Data (Last 7 Days)
                const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
                const last7Days = Array.from({ length: 7 }, (_, i) => {
                    const d = new Date();
                    d.setDate(d.getDate() - i);
                    return {
                        fullDate: d.toLocaleDateString(),
                        day: days[d.getDay()],
                        amount: 0
                    };
                }).reverse();

                (allSales || []).forEach(sale => {
                    const saleDate = new Date(sale.created_at).toLocaleDateString();
                    const chartDay = last7Days.find(d => d.fullDate === saleDate);
                    if (chartDay) chartDay.amount += Number(sale.total_amount || 0);
                });

                setStats(prev => ({
                    ...prev,
                    sales: (allSales || []).slice(0, 5),
                    revenue: totalRevenue,
                    revenueToday: revenueToday,
                    chartData: last7Days
                }));
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
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStats();
        const salesChannel = supabase.channel('dashboard-sales-hot').on('postgres_changes', { event: '*', schema: 'public', table: 'sales' }, fetchStats).subscribe();
        const prodChannel = supabase.channel('dashboard-products-hot').on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, fetchStats).subscribe();
        return () => {
            supabase.removeChannel(salesChannel);
            supabase.removeChannel(prodChannel);
        };
    }, []);

    // ── Fresh / Empty State ─────────────────────────────────────────────────
    if (isFresh) {
        return (
            <div className="space-y-8 animate-in fade-in duration-700">
                <header>
                    <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-white/60">
                        Dashboard
                    </h1>
                    <p className="text-white/50 mt-1">Real-time business performance and inventory tracking.</p>
                </header>

                {/* Welcome Hero */}
                <div className="glass-panel p-8 relative overflow-hidden">
                    <div className="absolute -right-20 -top-20 w-80 h-80 rounded-full bg-gradient-to-br from-primary/20 to-purple-500/10 blur-3xl pointer-events-none" />
                    <div className="relative flex flex-col sm:flex-row items-start sm:items-center gap-6">
                        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/30 to-purple-500/20 border border-primary/20 flex items-center justify-center shrink-0">
                            <Sparkles className="w-8 h-8 text-primary" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-white">Welcome — you're all set!</h2>
                            <p className="text-white/50 mt-1 max-w-lg">
                                Your store is live and ready. Follow the steps below to get your inventory up and running. Everything updates in real-time as you go.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Setup Checklist */}
                <div className="glass-panel p-6">
                    <h2 className="text-lg font-semibold text-white mb-1">Get Started</h2>
                    <p className="text-white/40 text-sm mb-6">Complete these steps to launch your store.</p>
                    <div className="space-y-3">
                        <SetupStep
                            icon={Tag}
                            title="Add your first category"
                            description="Organise products into categories for easy browsing."
                            to="/products/categories"
                            colorClass="from-blue-500 to-cyan-600"
                            done={false}
                        />
                        <SetupStep
                            icon={Package}
                            title="Add products to your inventory"
                            description="Stock your shelves — add names, prices, and quantities."
                            to="/products"
                            colorClass="from-purple-500 to-pink-600"
                            done={false}
                        />
                        <SetupStep
                            icon={Users}
                            title="Add stakeholders"
                            description="Register suppliers and customers to power your operations."
                            to="/stakeholders"
                            colorClass="from-amber-500 to-orange-600"
                            done={false}
                        />
                        <SetupStep
                            icon={ShoppingCart}
                            title="Make your first sale"
                            description="Head to the POS to process a transaction."
                            to="/pos"
                            colorClass="from-emerald-500 to-green-600"
                            done={false}
                        />
                    </div>
                </div>
            </div>
        );
    }

    // ── Live Dashboard ──────────────────────────────────────────────────────
    return (
        <div className="space-y-8 animate-in fade-in duration-700">
            <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-white/60">
                        Dashboard
                    </h1>
                    <p className="text-white/50 mt-1">Real-time business performance and inventory tracking.</p>
                </div>
                {loading && <Activity className="w-5 h-5 text-primary animate-spin" />}
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                <MetricCard
                    title="Revenue Today"
                    value={`Ksh ${stats.revenueToday.toLocaleString()}`}
                    trend={stats.revenueToday > 0 ? "Active" : "Steady"}
                    isPositive={stats.revenueToday > 0}
                    icon={TrendingUp}
                    colorClass="from-emerald-500 to-green-600"
                />
                <MetricCard
                    title="Shop Products"
                    value={stats.products}
                    icon={Package}
                    colorClass="from-blue-500 to-cyan-600"
                />
                <MetricCard
                    title="Low Stock"
                    value={stats.lowStock}
                    trend={stats.lowStock > 0 ? "Alert" : "Clean"}
                    isPositive={stats.lowStock === 0}
                    icon={AlertCircle}
                    colorClass="from-orange-500 to-amber-600"
                />
                <MetricCard
                    title="Total Revenue"
                    value={`Ksh ${stats.revenue.toLocaleString()}`}
                    icon={Activity}
                    colorClass="from-purple-500 to-pink-600"
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 glass-panel p-6 h-[450px] flex flex-col">
                    <h2 className="text-xl font-semibold mb-6 flex items-center gap-2 text-white">
                        <BarChart3 className="w-5 h-5 text-primary" /> Daily Revenue (Last 7 Days)
                    </h2>
                    <div className="flex-1 border border-white/5 rounded-2xl bg-white/[0.01] flex items-end justify-around px-8 pb-8 pt-4 relative overflow-hidden">
                        {stats.chartData.length > 0 ? (
                            stats.chartData.map((d, i) => {
                                const maxAmount = Math.max(...stats.chartData.map(cd => cd.amount), 1);
                                const height = (d.amount / (maxAmount * 1.2)) * 100;
                                return (
                                    <div key={i} className="flex flex-col items-center gap-2 group/bar w-full max-w-[40px]">
                                        <div className="text-[10px] text-white/40 font-mono opacity-0 group-hover/bar:opacity-100 transition-opacity">
                                            {d.amount > 0 ? `${(d.amount / 1000).toFixed(1)}k` : ''}
                                        </div>
                                        <div
                                            className="w-full bg-primary rounded-t-lg transition-all duration-700 hover:brightness-125"
                                            style={{ height: `${Math.max(height, 5)}%`, opacity: d.amount > 0 ? 0.8 : 0.1 }}
                                        ></div>
                                        <span className="text-xs text-white/30 font-medium">{d.day}</span>
                                    </div>
                                );
                            })
                        ) : (
                            <p className="text-white/30 text-sm font-medium">No sales data recorded.</p>
                        )}
                    </div>
                    <div className="mt-4 pt-4 border-t border-white/5 flex gap-6 text-sm">
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-primary"></div>
                            <span className="text-white/50">Daily Sales</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-white/10"></div>
                            <span className="text-white/50">No Activity</span>
                        </div>
                    </div>
                </div>

                <div className="glass-panel p-6 flex flex-col h-[450px]">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-lg font-semibold text-white">Recent Sales</h2>
                    </div>
                    <div className="space-y-4 flex-1 overflow-y-auto custom-scrollbar">
                        {stats.sales.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-white/20 gap-2">
                                <TrendingUp className="w-8 h-8 opacity-50" />
                                <p className="text-sm">Waiting for first sale...</p>
                            </div>
                        ) : (
                            stats.sales.map((sale) => (
                                <div key={sale.id} onClick={() => setSelectedSaleId(sale.id)} className="flex items-center gap-4 p-3 rounded-xl hover:bg-white/5 transition-colors border border-transparent hover:border-white/5 cursor-pointer group">
                                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20 text-primary">
                                        <TrendingUp className="w-4 h-4" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-white truncate">Sale #{sale.id.slice(-4)}</p>
                                        <p className="text-xs text-white/50 truncate">
                                            {new Date(sale.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {sale.payment_method || 'Cash'}
                                        </p>
                                    </div>
                                    <span className="text-sm font-bold text-white group-hover:text-primary transition-colors font-mono">
                                        Ksh {Number(sale.total_amount).toLocaleString()}
                                    </span>
                                </div>
                            ))
                        )}
                    </div>
                    <NavLink to="/reports/sales" className="mt-6 w-full py-3 rounded-xl bg-white/5 hover:bg-white/10 text-white/70 text-sm font-medium transition-colors text-center border border-white/10">
                        View All Sales
                    </NavLink>
                </div>
            </div>

            <SaleDetailsModal 
                isOpen={!!selectedSaleId} 
                onClose={() => setSelectedSaleId(null)} 
                saleId={selectedSaleId} 
                onUpdate={fetchStats} 
            />
        </div>
    );
}
