import { useState, useEffect } from 'react';
import { supabase } from '../../config/supabase';
import { PieChart, Plus, Trash2, Calendar, DollarSign, Tag, Loader2, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../contexts/AuthContext';

export default function Expenses() {
    const { currentUser } = useAuth();
    const [expenses, setExpenses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isAdding, setIsAdding] = useState(false);

    const [newExpense, setNewExpense] = useState({
        amount: '',
        category: 'Rent',
        description: '',
        expense_date: new Date().toISOString().split('T')[0] // yyyy-mm-dd
    });

    const expenseCategories = ['Rent', 'Utilities', 'Salaries', 'Transport', 'Marketing', 'Repairs/Maintenance', 'Other'];

    const fetchExpenses = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('expenses')
                .select('*')
                .order('expense_date', { ascending: false })
                .order('created_at', { ascending: false });

            if (error) throw error;
            if (data) setExpenses(data);
        } catch (error) {
            console.error("Error fetching expenses:", error);
            toast.error("Failed to load expenses");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchExpenses();
        // Subscribe to real-time changes
        const channel = supabase.channel('expenses-changes')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'expenses' }, fetchExpenses)
            .subscribe();

        return () => supabase.removeChannel(channel);
    }, []);

    const handleAddExpense = async (e) => {
        e.preventDefault();

        if (!newExpense.amount || Number(newExpense.amount) <= 0) {
            toast.error("Please enter a valid amount");
            return;
        }

        try {
            const { error } = await supabase.from('expenses').insert({
                amount: Number(newExpense.amount),
                category: newExpense.category,
                description: newExpense.description || null,
                expense_date: newExpense.expense_date,
                created_by: currentUser?.email || 'Unknown User'
            });

            if (error) throw error;

            toast.success("Expense recorded successfully");
            setIsAdding(false);
            setNewExpense({
                amount: '',
                category: 'Rent',
                description: '',
                expense_date: new Date().toISOString().split('T')[0]
            });
            fetchExpenses();
        } catch (error) {
            console.error("Error adding expense:", error);
            toast.error("Failed to record expense");
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to delete this expense record? This will alter your Profit & Loss calculations.")) return;

        try {
            const { error } = await supabase.from('expenses').delete().eq('id', id);
            if (error) throw error;
            toast.success("Expense deleted");
            fetchExpenses();
        } catch (error) {
            console.error("Error deleting expense:", error);
            toast.error("Failed to delete expense");
        }
    };

    const totalExpenses = expenses.reduce((sum, exp) => sum + Number(exp.amount || 0), 0);

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-white/60 flex items-center gap-3">
                        Operating Expenses
                    </h1>
                    <p className="text-white/50 mt-1">Track and manage your daily business expenditures.</p>
                </div>
                <button
                    onClick={() => setIsAdding(true)}
                    className="bg-primary text-black px-4 py-2.5 rounded-xl font-bold flex items-center gap-2 hover:bg-white/90 transition-colors shadow-[0_0_20px_rgba(11,211,211,0.2)]"
                >
                    <Plus className="w-5 h-5" />
                    Record Expense
                </button>
            </header>

            {/* Total Summary Card */}
            <div className="glass-panel p-6 flex items-center gap-6 max-w-sm relative overflow-hidden group">
                <div className="absolute -right-4 -top-4 w-24 h-24 bg-gradient-to-br from-red-500 to-orange-500 opacity-10 rounded-full blur-xl" />
                <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20">
                    <PieChart className="w-8 h-8 text-red-400" />
                </div>
                <div>
                    <p className="text-white/50 text-sm font-medium tracking-wide">Total Expenses Logged</p>
                    <h2 className="text-3xl font-bold text-white mt-1">Ksh {totalExpenses.toLocaleString()}</h2>
                </div>
            </div>

            {/* Expenses List */}
            <div className="glass-panel overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-white/10 bg-white/5 text-white/50 text-sm">
                                <th className="p-4 font-medium">Date</th>
                                <th className="p-4 font-medium">Category</th>
                                <th className="p-4 font-medium">Description</th>
                                <th className="p-4 font-medium">Logged By</th>
                                <th className="p-4 font-medium text-right">Amount (Ksh)</th>
                                <th className="p-4 font-medium text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {loading ? (
                                <tr>
                                    <td colSpan="6" className="p-8 text-center text-white/40">
                                        <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
                                        Loading expenses...
                                    </td>
                                </tr>
                            ) : expenses.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="p-8 text-center text-white/40 border-b-0">
                                        No expenses recorded yet. Click 'Record Expense' to add one.
                                    </td>
                                </tr>
                            ) : (
                                expenses.map(exp => (
                                    <tr key={exp.id} className="hover:bg-white/[0.02] transition-colors group">
                                        <td className="p-4 text-white/70">
                                            <div className="flex items-center gap-2">
                                                <Calendar className="w-4 h-4 text-white/30" />
                                                {new Date(exp.expense_date).toLocaleDateString()}
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <span className="px-2.5 py-1 rounded-md text-xs font-medium bg-white/10 text-white/70 border border-white/5">
                                                {exp.category}
                                            </span>
                                        </td>
                                        <td className="p-4 text-white/80">{exp.description || <span className="text-white/30 italic">No description</span>}</td>
                                        <td className="p-4 text-white/50 text-sm">{exp.created_by}</td>
                                        <td className="p-4 text-right font-bold text-red-400 font-mono">
                                            {Number(exp.amount).toLocaleString()}
                                        </td>
                                        <td className="p-4 text-right">
                                            <button
                                                onClick={() => handleDelete(exp.id)}
                                                className="p-1.5 text-white/30 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                                                title="Delete Expense"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Add Expense Modal */}
            {isAdding && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="glass-panel w-full max-w-md p-8 border-primary/20 shadow-[0_0_50px_rgba(11,211,211,0.1)] relative">
                        <button
                            onClick={() => setIsAdding(false)}
                            className="absolute top-4 right-4 text-white/40 hover:text-white transition-colors"
                        >
                            <X className="w-6 h-6" />
                        </button>

                        <div className="flex items-center gap-4 mb-6">
                            <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center border border-primary/30">
                                <DollarSign className="w-6 h-6 text-primary" />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-white">Record Expense</h3>
                                <p className="text-white/40 text-xs">Add a new operational cost.</p>
                            </div>
                        </div>

                        <form onSubmit={handleAddExpense} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-white/40 uppercase tracking-widest mb-1.5 ml-1">Amount (Ksh)</label>
                                <input
                                    required
                                    type="number"
                                    min="1"
                                    step="0.01"
                                    value={newExpense.amount}
                                    onChange={(e) => setNewExpense({ ...newExpense, amount: e.target.value })}
                                    placeholder="e.g. 5000"
                                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary transition-colors font-mono text-lg"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-white/40 uppercase tracking-widest mb-1.5 ml-1">Category</label>
                                <div className="relative">
                                    <Tag className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                                    <select
                                        value={newExpense.category}
                                        onChange={(e) => setNewExpense({ ...newExpense, category: e.target.value })}
                                        className="w-full bg-black/40 border border-white/10 rounded-xl pl-11 pr-4 py-3 text-white focus:outline-none focus:border-primary transition-colors appearance-none"
                                    >
                                        {expenseCategories.map(cat => (
                                            <option key={cat} value={cat}>{cat}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-white/40 uppercase tracking-widest mb-1.5 ml-1">Date</label>
                                <input
                                    required
                                    type="date"
                                    value={newExpense.expense_date}
                                    onChange={(e) => setNewExpense({ ...newExpense, expense_date: e.target.value })}
                                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary transition-colors"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-white/40 uppercase tracking-widest mb-1.5 ml-1">Description (Optional)</label>
                                <textarea
                                    rows="2"
                                    value={newExpense.description}
                                    onChange={(e) => setNewExpense({ ...newExpense, description: e.target.value })}
                                    placeholder="What was this for?"
                                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary transition-colors resize-none"
                                />
                            </div>

                            <button
                                type="submit"
                                className="w-full bg-primary text-black font-bold py-4 rounded-xl mt-6 hover:bg-white/90 transition-all shadow-[0_0_20px_rgba(11,211,211,0.2)]"
                            >
                                Save Expense Focus
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
