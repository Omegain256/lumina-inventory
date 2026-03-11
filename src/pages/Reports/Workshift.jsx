import { useState, useEffect } from 'react';
import { supabase } from '../../config/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { Clock, Play, Square, User, TrendingUp, Calendar, AlertCircle, Filter, Power } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Workshift() {
    const { currentUser, userRole } = useAuth();
    const [shifts, setShifts] = useState([]);
    const [activeShift, setActiveShift] = useState(null);
    const [staffFilter, setStaffFilter] = useState('all');
    const [workers, setWorkers] = useState([]);

    const fetchData = async () => {
        const { data } = await supabase
            .from('workshifts')
            .select('*')
            .order('start_time', { ascending: false });

        if (data) {
            setShifts(data);
            const active = data.find(s => s.user_id === currentUser?.id && s.status === 'active');
            setActiveShift(active || null);
        }

        // If admin, fetch all workers for the filter
        if (userRole === 'admin') {
            const { data: profiles } = await supabase.from('profiles').select('id, name, email');
            if (profiles) setWorkers(profiles);
        }
    };

    useEffect(() => {
        if (!currentUser) return;
        fetchData();
        const channel = supabase.channel('workshifts').on('postgres_changes', { event: '*', schema: 'public', table: 'workshifts' }, fetchData).subscribe();
        return () => supabase.removeChannel(channel);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentUser]);

    const startShift = async () => {
        if (activeShift) {
            toast.error("You already have an active shift!");
            return;
        }

        try {
            const { error } = await supabase.from('workshifts').insert({
                user_id: currentUser.id,
                user_name: currentUser.user_metadata?.name || currentUser.email.split('@')[0],
                status: 'active',
                start_time: new Date().toISOString(),
                total_sales: 0,
                sales_count: 0
            });
            if (error) throw error;
            toast.success("Shift started!");
            fetchData();
        } catch (err) {
            console.error(err);
            toast.error("Failed to start shift");
        }
    };

    const endShift = async () => {
        if (!activeShift) return;
        await handleEndShift(activeShift.id, activeShift.user_id, activeShift.start_time);
    };

    const handleEndShift = async (shiftId, userId, startTime) => {
        try {
            // Find sales made during this shift
            const { data: sales, error: salesError } = await supabase
                .from('sales')
                .select('total_amount')
                .eq('user_id', userId)
                .gte('created_at', startTime);

            if (salesError) throw salesError;

            const totalSales = (sales || []).reduce((sum, s) => sum + Number(s.total_amount || 0), 0);
            const salesCount = (sales || []).length;

            const { error: updateError } = await supabase
                .from('workshifts')
                .update({
                    end_time: new Date().toISOString(),
                    status: 'completed',
                    total_sales: totalSales,
                    sales_count: salesCount
                })
                .eq('id', shiftId);

            if (updateError) throw updateError;
            toast.success("Shift ended successfully!");
            fetchData();
        } catch (error) {
            console.error(error);
            toast.error("Failed to end shift");
        }
    };

    const filteredShifts = staffFilter === 'all'
        ? shifts
        : shifts.filter(s => s.user_id === staffFilter);

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-white/60 flex items-center gap-3">
                        <Clock className="w-8 h-8 text-primary" /> Workshift Tracking
                    </h1>
                    <p className="text-white/50 mt-1">Manage and review employee shifts and sales performance.</p>
                </div>

                {!activeShift ? (
                    <button
                        onClick={startShift}
                        className="bg-white text-black px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-white/90 transition-all shadow-lg active:scale-95"
                    >
                        <Play className="w-5 h-5 fill-current" /> Start My Shift
                    </button>
                ) : (
                    <button
                        onClick={endShift}
                        className="bg-red-500 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-red-600 transition-all shadow-lg active:scale-95 animate-pulse"
                    >
                        <Square className="w-5 h-5 fill-current" /> End My Shift
                    </button>
                )}
            </header>

            {activeShift && (
                <div className="glass-panel p-6 border-primary/20 bg-primary/5 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4">
                        <span className="flex h-3 w-3 relative">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-3 w-3 bg-primary"></span>
                        </span>
                    </div>
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div className="flex items-center gap-4">
                            <div className="w-16 h-16 rounded-2xl bg-primary/20 flex items-center justify-center border border-primary/30">
                                <User className="w-8 h-8 text-primary" />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-white uppercase tracking-tight">Active Shift</h3>
                                <p className="text-white/50 text-sm">Started at {activeShift.start_time ? new Date(activeShift.start_time).toLocaleTimeString() : 'Just now'}</p>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-8">
                            <div className="text-right">
                                <p className="text-white/30 text-xs font-bold uppercase tracking-widest mb-1">Duration</p>
                                <p className="text-xl text-white font-mono">Live</p>
                            </div>
                            <div className="text-right">
                                <p className="text-white/30 text-xs font-bold uppercase tracking-widest mb-1">Employee</p>
                                <p className="text-xl text-white font-medium">{activeShift.user_name}</p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 gap-4">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mt-4 px-2">
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                        <Calendar className="w-5 h-5 text-white/40" /> Recent Shift History
                    </h2>

                    {userRole === 'admin' && (
                        <div className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-xl px-3 py-1.5 focus-within:border-primary transition-all">
                            <Filter className="w-4 h-4 text-white/40" />
                            <select
                                value={staffFilter}
                                onChange={(e) => setStaffFilter(e.target.value)}
                                className="bg-transparent text-sm text-white focus:outline-none appearance-none pr-6 cursor-pointer"
                            >
                                <option value="all">All Employees</option>
                                {workers.map(worker => (
                                    <option key={worker.id} value={worker.id}>{worker.name || worker.email}</option>
                                ))}
                            </select>
                        </div>
                    )}
                </div>
                {shifts.length === 0 ? (
                    <div className="glass-panel p-12 flex flex-col items-center justify-center text-white/30 gap-4">
                        <AlertCircle className="w-12 h-12 opacity-30" />
                        <p>No shift records found.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredShifts.map(shift => (
                            <div key={shift.id} className={`glass-panel p-5 flex flex-col gap-4 relative group hover:border-white/20 transition-all ${shift.status === 'active' ? 'border-primary/40' : ''}`}>
                                <div className="flex justify-between items-center">
                                    <div className="flex items-center gap-2">
                                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-tighter border ${shift.status === 'active' ? 'bg-primary/10 text-primary border-primary/20' : 'bg-white/5 text-white/40 border-white/10'}`}>
                                            {shift.status}
                                        </span>
                                        {userRole === 'admin' && shift.status === 'active' && shift.user_id !== currentUser?.id && (
                                            <button
                                                onClick={() => handleEndShift(shift.id, shift.user_id, shift.start_time)}
                                                className="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-tighter bg-red-500/10 text-red-500 border border-red-500/20 hover:bg-red-500 hover:text-white transition-all flex items-center gap-1"
                                                title="Force End Shift"
                                            >
                                                <Power className="w-3 h-3" /> Force End
                                            </button>
                                        )}
                                    </div>
                                    <span className="text-xs text-white/30 font-mono">
                                        {shift.start_time ? new Date(shift.start_time).toLocaleDateString() : 'Pending...'}
                                    </span>
                                </div>

                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center border border-white/10">
                                        <User className="w-5 h-5 text-white/60" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-white">{shift.user_name}</p>
                                        <p className="text-[10px] text-white/40">Employee ID: {shift.user_id.slice(0, 8)}</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/5 mt-auto">
                                    <div className="space-y-1">
                                        <span className="text-[10px] text-white/30 font-bold uppercase block">Total Sales</span>
                                        <span className="text-sm text-primary font-bold font-mono">Ksh {shift.total_sales?.toLocaleString() || 0}</span>
                                    </div>
                                    <div className="space-y-1 text-right">
                                        <span className="text-[10px] text-white/30 font-bold uppercase block">Sales Count</span>
                                        <span className="text-sm text-white font-bold font-mono">{shift.sales_count || 0} items</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
