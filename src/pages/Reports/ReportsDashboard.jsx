import { useState, useEffect } from 'react';
import { supabase } from '../../config/supabase';
import { BarChart3, TrendingUp, Wallet, Banknote, Users, Activity, Calendar } from 'lucide-react';
import { useLocation, NavLink } from 'react-router-dom';
import SaleDetailsModal from '../../components/SaleDetailsModal';

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
    const [expenses, setExpenses] = useState([]);
    const [transactions, setTransactions] = useState([]);
    const [timeRange, setTimeRange] = useState('this-month'); // today, this-month, ytd
    const [loading, setLoading] = useState(true);
    const [selectedSaleId, setSelectedSaleId] = useState(null);
    const [metrics, setMetrics] = useState({ revenue: 0, cost: 0, grossProfit: 0, totalExpenses: 0, netProfit: 0 });

    const fetchData = async () => {
        setLoading(true);
        try {
            let salesQuery = supabase.from('sales').select('*, sale_items(quantity, unit_price, product_id, product:products(cost))');
            let expenseQuery = supabase.from('expenses').select('*');

            const now = new Date();
            const startOfDay = new Date(now.setHours(0, 0, 0, 0)).toISOString();
            const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
            const startOfYear = new Date(now.getFullYear(), 0, 1).toISOString();

            if (timeRange === 'today') {
                salesQuery = salesQuery.gte('created_at', startOfDay);
                expenseQuery = expenseQuery.gte('created_at', startOfDay);
            } else if (timeRange === 'this-month') {
                salesQuery = salesQuery.gte('created_at', startOfMonth);
                expenseQuery = expenseQuery.gte('created_at', startOfMonth);
            } else if (timeRange === 'ytd') {
                salesQuery = salesQuery.gte('created_at', startOfYear);
                expenseQuery = expenseQuery.gte('created_at', startOfYear);
            }

            const { data: salesData } = await salesQuery.order('created_at', { ascending: false });
            const { data: expData } = await expenseQuery.order('created_at', { ascending: false });

            let revenue = 0;
            let cost = 0;
            if (salesData) {
                setSales(salesData);
                salesData.forEach(sale => {
                    revenue += (Number(sale.total_amount) || 0);
                    if (sale.sale_items && sale.sale_items.length > 0) {
                        sale.sale_items.forEach(item => {
                            const itemCost = Number(item.product?.cost) || 0;
                            cost += (itemCost * item.quantity);
                        });
                    }
                });
            }

            let totalExp = 0;
            if (expData) {
                setExpenses(expData);
                totalExp = expData.reduce((sum, e) => sum + Number(e.amount || 0), 0);
            }

            setMetrics({
                revenue,
                cost,
                grossProfit: revenue - cost,
                totalExpenses: totalExp,
                netProfit: (revenue - cost) - totalExp
            });

            const { data: txData } = await supabase.from('inventory_transactions').select('*').order('created_at', { ascending: false }).limit(20);
            if (txData) setTransactions(txData);
        } catch (error) {
            console.error("Fetch error:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
        const salesChannel = supabase.channel('reports-sales-sync').on('postgres_changes', { event: '*', schema: 'public', table: 'sales' }, fetchData).subscribe();
        const expChannel = supabase.channel('reports-exp-sync').on('postgres_changes', { event: '*', schema: 'public', table: 'expenses' }, fetchData).subscribe();
        return () => {
            supabase.removeChannel(salesChannel);
            supabase.removeChannel(expChannel);
        };
    }, [timeRange]);

    const currentTab = location.pathname.split('/').pop();

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-white/60 flex items-center gap-3 capitalize">
                        {currentTab === 'pnl' ? 'Profit & Loss' : currentTab.replace('-', ' ')} Report
                    </h1>
                    <p className="text-white/50 mt-1">Real-time performance metrics and business overview.</p>
                </div>
                <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-lg p-1 text-sm font-medium">
                    {[
                        { id: 'today', label: 'Today' },
                        { id: 'this-month', label: 'This Month' },
                        { id: 'ytd', label: 'Year to Date' }
                    ].map(btn => (
                        <button
                            key={btn.id}
                            onClick={() => setTimeRange(btn.id)}
                            className={`px-4 py-1.5 rounded-md transition-all ${timeRange === btn.id ? 'text-white bg-white/10 shadow-sm' : 'text-white/40 hover:text-white/60'}`}
                        >
                            {btn.label}
                        </button>
                    ))}
                </div>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <MetricCard
                    title="Revenue"
                    value={`Ksh ${metrics.revenue.toLocaleString()}`}
                    subtitle={`${sales.length} sales ${timeRange.replace('-', ' ')}`}
                    icon={Wallet}
                    colorClass="from-green-500 to-emerald-600"
                />
                <MetricCard
                    title="Gross Profit"
                    value={`Ksh ${metrics.grossProfit.toLocaleString()}`}
                    subtitle="Revenue minus item costs"
                    icon={TrendingUp}
                    colorClass="from-blue-500 to-cyan-600"
                />
                <MetricCard
                    title="Expenses"
                    value={`Ksh ${metrics.totalExpenses.toLocaleString()}`}
                    subtitle={`${expenses.length} records found`}
                    icon={Banknote}
                    colorClass="from-orange-500 to-amber-600"
                />
                <MetricCard
                    title="Net Profit"
                    value={`Ksh ${metrics.netProfit.toLocaleString()}`}
                    subtitle="Total remaining income"
                    icon={Activity}
                    colorClass={metrics.netProfit >= 0 ? "from-emerald-500 to-green-600" : "from-red-500 to-rose-600"}
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="glass-panel p-6 lg:col-span-2 flex flex-col min-h-[400px]">
                    <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                        <BarChart3 className="w-5 h-5 text-primary" /> Daily Revenue (Period)
                    </h3>
                    <div className="flex-1 border-2 border-dashed border-white/5 rounded-xl bg-white/[0.01] flex items-end justify-around px-8 pb-8 pt-4 relative overflow-hidden">
                        {loading ? (
                            <div className="w-full flex items-center justify-center text-white/20 animate-pulse">Loading analytics...</div>
                        ) : sales.length > 0 ? (
                            Array.from({ length: 10 }, (_, i) => {
                                const d = new Date();
                                d.setDate(d.getDate() - i);
                                const dateStr = d.toLocaleDateString();
                                const dayAmount = sales
                                    .filter(s => new Date(s.created_at).toLocaleDateString() === dateStr)
                                    .reduce((sum, s) => sum + (Number(s.total_amount) || 0), 0);

                                const maxAmount = Math.max(...sales.map(s => Number(s.total_amount)), 1) * 1.5;
                                const height = (dayAmount / maxAmount) * 100;
                                const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

                                return (
                                    <div key={i} className="flex flex-col items-center gap-2 group/rev w-full max-w-[50px]">
                                        <div className="text-[10px] text-white/40 font-mono opacity-0 group-hover/rev:opacity-100 transition-opacity">
                                            {dayAmount > 0 ? `${(dayAmount / 1000).toFixed(1)}k` : ''}
                                        </div>
                                        <div
                                            className="w-full bg-blue-500/40 rounded-t-lg transition-all duration-700 hover:bg-blue-500/60"
                                            style={{ height: `${Math.max(height, 2)}%`, opacity: dayAmount > 0 ? 1 : 0.1 }}
                                        ></div>
                                        <span className="text-[10px] text-white/30 font-medium uppercase">{days[d.getDay()]}</span>
                                    </div>
                                );
                            }).reverse()
                        ) : (
                            <div className="flex flex-col items-center justify-center w-full h-full text-white/20">
                                <BarChart3 className="w-12 h-12 mb-2" />
                                <p>No sales records for this period.</p>
                            </div>
                        )}
                    </div>
                </div>

                <div className="glass-panel p-6 flex flex-col min-h-[400px]">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-lg font-bold text-white">Recent Transactions</h3>
                        {loading && <Activity className="w-4 h-4 text-primary animate-spin" />}
                    </div>
                    <div className="flex-1 overflow-y-auto custom-scrollbar space-y-4 pr-2">
                        {sales.slice(0, 10).map(sale => (
                            <div key={sale.id} onClick={() => setSelectedSaleId(sale.id)} className="flex items-center justify-between pb-4 border-b border-white/5 last:border-0 last:pb-0 cursor-pointer hover:bg-white/5 p-2 rounded-lg transition-colors">
                                <div>
                                    <p className="font-medium text-white text-sm">Sale #{sale.id.slice(-4)}</p>
                                    <p className="text-xs text-white/40 mt-1">{sale.payment_method || 'Cash'}</p>
                                </div>
                                <div className="text-right">
                                    <p className="font-bold text-primary font-mono text-sm leading-none">+Ksh {Number(sale.total_amount).toLocaleString()}</p>
                                    <p className="text-[10px] text-white/30 mt-2">
                                        {new Date(sale.created_at).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                                    </p>
                                </div>
                            </div>
                        ))}
                        {sales.length === 0 && !loading && (
                            <div className="text-center text-white/30 pt-12">No transactions found.</div>
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
                        <NavLink to="/settings/users" className="bg-white/10 hover:bg-white/15 text-white px-6 py-2 rounded-lg text-sm font-medium transition-colors">
                            Manage Staff
                        </NavLink>
                        <NavLink to="/reports/commission" className="bg-primary/20 hover:bg-primary/30 text-primary px-6 py-2 rounded-lg text-sm font-medium transition-colors border border-primary/20">
                            View Commissions
                        </NavLink>
                    </div>
                </div>
            )}

            <SaleDetailsModal 
                isOpen={!!selectedSaleId} 
                onClose={() => setSelectedSaleId(null)} 
                saleId={selectedSaleId} 
                onUpdate={fetchData} 
            />
        </div>
    );
}
