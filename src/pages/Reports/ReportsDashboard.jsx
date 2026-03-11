import { useState, useEffect } from 'react';
import { supabase } from '../../config/supabase';
import { BarChart3, TrendingUp, Wallet, Banknote, Users, Activity } from 'lucide-react';
import { useLocation, NavLink } from 'react-router-dom';

// eslint-disable-next-line no-unused-vars
const MetricCard = ({ title, value, subtitle, icon: Icon, colorClass }) => (
    <div className="glass-panel p-6 flex flex-col gap-3 relative overflow-hidden group">
        <div className={`absolute -right-4 -top-4 w-24 h-24 bg-gradient-to-br ${colorClass} opacity-10 rounded-full blur-xl group-hover:opacity-20 transition-opacity duration-500`} />
        <div className="flex justify-between items-start z-10">
            <div className={`p-3 rounded-xl bg-gradient-to-br ${colorClass} bg-opacity-10 backdrop-blur-md border border-white/10`}>
                <Icon className="w-6 h-6 text-white" />
            </div>
        </div>
        <div className="z-10 mt-2">
            <h3 className="text-white/50 text-sm font-medium tracking-wide mb-1">{title}</h3>
            <div className="text-3xl font-bold text-white tracking-tight">{value}</div>
            {subtitle && <p className="text-xs text-white/40 mt-2">{subtitle}</p>}
        </div>
    </div>
);

export default function ReportsDashboard() {
    const location = useLocation();
    const [sales, setSales] = useState([]);
    const [transactions, setTransactions] = useState([]);
    const [metrics, setMetrics] = useState({ revenue: 0, cost: 0, grossProfit: 0 });

    const fetchData = async () => {
        const { data: salesData } = await supabase.from('sales').select('*, sale_items(quantity, unit_price, product_id, product:products(cost))').order('created_at', { ascending: false });
        if (salesData) {
            setSales(salesData);
            let revenue = 0;
            let cost = 0;
            salesData.forEach(sale => {
                revenue += (sale.total_amount || 0);
                if (sale.sale_items && sale.sale_items.length > 0) {
                    sale.sale_items.forEach(item => {
                        const itemCost = Number(item.product?.cost) || 0;
                        cost += (itemCost * item.quantity);
                    });
                }
            });
            setMetrics({ revenue, cost, grossProfit: revenue - cost });
        }

        const { data: txData } = await supabase.from('inventory_transactions').select('*').order('created_at', { ascending: false });
        if (txData) setTransactions(txData);
    };

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        fetchData();
        const salesChannel = supabase.channel('sales').on('postgres_changes', { event: '*', schema: 'public', table: 'sales' }, fetchData).subscribe();
        const txChannel = supabase.channel('inventory_transactions').on('postgres_changes', { event: '*', schema: 'public', table: 'inventory_transactions' }, fetchData).subscribe();
        return () => {
            supabase.removeChannel(salesChannel);
            supabase.removeChannel(txChannel);
        };
    }, []);

    // Calculate metrics
    const totalRevenue = metrics.revenue;
    const totalSalesCount = sales.length;
    const grossProfit = metrics.grossProfit;

    const currentTab = location.pathname.split('/').pop();

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-white/60 flex items-center gap-3 capitalize">
                        {currentTab.replace('-', ' ')} Report
                    </h1>
                    <p className="text-white/50 mt-1">Unified analytics and business performance overview.</p>
                </div>
                <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-lg p-1 text-sm font-medium">
                    <button className="px-4 py-1.5 rounded-md text-white bg-white/10 shadow-sm">This Month</button>
                    <button className="px-4 py-1.5 rounded-md text-white/50 hover:text-white transition-colors">Last Month</button>
                    <button className="px-4 py-1.5 rounded-md text-white/50 hover:text-white transition-colors">YTD</button>
                </div>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <MetricCard
                    title="Total Revenue"
                    value={`Ksh ${totalRevenue.toLocaleString()}`}
                    subtitle={`${totalSalesCount} total sales recorded`}
                    icon={Wallet}
                    colorClass="from-green-500 to-emerald-600"
                />
                <MetricCard
                    title="Gross Profit"
                    value={`Ksh ${grossProfit.toLocaleString()}`}
                    subtitle="Based on actual product costs"
                    icon={TrendingUp}
                    colorClass="from-blue-500 to-cyan-600"
                />
                <MetricCard
                    title="Avg Order Value"
                    value={`Ksh ${totalSalesCount ? Math.round(totalRevenue / totalSalesCount).toLocaleString() : 0}`}
                    icon={Banknote}
                    colorClass="from-orange-500 to-amber-600"
                />
                <MetricCard
                    title="Inventory Activity"
                    value={transactions.length}
                    subtitle="Purchases & Returns"
                    icon={Activity}
                    colorClass="from-purple-500 to-pink-600"
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Chart Placeholder */}
                <div className="glass-panel p-6 lg:col-span-2 flex flex-col min-h-[400px]">
                    <h3 className="text-lg font-bold text-white mb-6">Revenue Overview</h3>
                    <div className="flex-1 flex flex-col items-center justify-center border-2 border-dashed border-white/5 rounded-xl bg-white/[0.01]">
                        <BarChart3 className="w-16 h-16 text-white/20 mb-4" />
                        <p className="text-white/40">Visual charts will render here (e.g. Recharts)</p>
                        <div className="flex items-end gap-2 mt-8 h-32 opacity-20 w-3/4 justify-center">
                            {/* Fake bar chart */}
                            {[40, 70, 45, 90, 65, 110, 85].map((h, i) => (
                                <div key={i} className="w-12 bg-white rounded-t-sm" style={{ height: `${h}%` }}></div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Recent Sales Feed */}
                <div className="glass-panel p-6 flex flex-col min-h-[400px]">
                    <h3 className="text-lg font-bold text-white mb-6">Recent Sales</h3>
                    <div className="flex-1 overflow-y-auto custom-scrollbar space-y-4 pr-2">
                        {sales.slice(0, 10).map(sale => (
                            <div key={sale.id} className="flex items-center justify-between pb-4 border-b border-white/5 last:border-0 last:pb-0">
                                <div>
                                    <p className="font-medium text-white text-sm">
                                        {sale.items?.length || 0} items
                                    </p>
                                    <p className="text-xs text-white/40 mt-1">
                                        {sale.paymentMethod || 'Cash'}
                                    </p>
                                </div>
                                <div className="text-right">
                                    <p className="font-bold text-green-400 font-mono text-sm">
                                        +Ksh {sale.total_amount?.toLocaleString() || 0}
                                    </p>
                                    <p className="text-[10px] text-white/30 mt-1">
                                        {sale.created_at ? new Date(sale.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Just now'}
                                    </p>
                                </div>
                            </div>
                        ))}
                        {sales.length === 0 && (
                            <div className="text-center text-white/30 pt-12">No sales data yet.</div>
                        )}
                    </div>
                </div>
            </div>

            {(currentTab === 'workshift' || currentTab === 'employees' || currentTab === 'pnl') && (
                <div className="glass-panel p-6 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Users className="w-12 h-12 text-blue-400/50" />
                        <div>
                            <h3 className="text-lg font-bold text-white">Employee Performance</h3>
                            <p className="text-white/50 text-sm">Track shifts, commissions, and individual sales.</p>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <button className="bg-white/10 hover:bg-white/15 text-white px-6 py-2 rounded-lg text-sm font-medium transition-colors">
                            Manage Staff
                        </button>
                        <NavLink to="/reports/commission" className="bg-primary/20 hover:bg-primary/30 text-primary px-6 py-2 rounded-lg text-sm font-medium transition-colors border border-primary/20">
                            View Commissions
                        </NavLink>
                    </div>
                </div>
            )}
        </div>
    );
}
