import { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot, addDoc, updateDoc, doc, serverTimestamp, where, getDocs } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { Clock, Play, Square, User, TrendingUp, Calendar, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Workshift() {
    const { currentUser, userRole } = useAuth();
    const [shifts, setShifts] = useState([]);
    const [activeShift, setActiveShift] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const q = query(collection(db, 'workshifts'), orderBy('startTime', 'desc'));
        const unsubscribe = onSnapshot(q, (snap) => {
            const shiftData = snap.docs.map(d => ({ id: d.id, ...d.data() }));
            setShifts(shiftData);

            // Check for current user's active shift
            const active = shiftData.find(s => s.userId === currentUser?.uid && s.status === 'active');
            setActiveShift(active || null);
            setLoading(false);
        });
        return unsubscribe;
    }, [currentUser]);

    const startShift = async () => {
        try {
            await addDoc(collection(db, 'workshifts'), {
                userId: currentUser.uid,
                userName: currentUser.displayName || currentUser.email.split('@')[0],
                startTime: serverTimestamp(),
                status: 'active',
                totalSales: 0,
                salesCount: 0
            });
            toast.success("Shift started!");
        } catch (error) {
            toast.error("Failed to start shift");
        }
    };

    const endShift = async () => {
        if (!activeShift) return;

        try {
            // Find sales made during this shift
            const startTime = activeShift.startTime?.toDate?.() || new Date();
            const q = query(
                collection(db, 'sales'),
                where('createdAt', '>=', startTime)
            );
            const salesSnap = await getDocs(q);
            const sales = salesSnap.docs.map(d => d.data());

            const totalSales = sales.reduce((sum, s) => sum + (s.total || 0), 0);
            const salesCount = sales.length;

            await updateDoc(doc(db, 'workshifts', activeShift.id), {
                endTime: serverTimestamp(),
                status: 'completed',
                totalSales,
                salesCount
            });
            toast.success("Shift ended successfully!");
        } catch (error) {
            console.error(error);
            toast.error("Failed to end shift");
        }
    };

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
                                <p className="text-white/50 text-sm">Started at {activeShift.startTime?.toDate?.() ? activeShift.startTime.toDate().toLocaleTimeString() : 'Just now'}</p>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-8">
                            <div className="text-right">
                                <p className="text-white/30 text-xs font-bold uppercase tracking-widest mb-1">Duration</p>
                                <p className="text-xl text-white font-mono">Live</p>
                            </div>
                            <div className="text-right">
                                <p className="text-white/30 text-xs font-bold uppercase tracking-widest mb-1">Employee</p>
                                <p className="text-xl text-white font-medium">{activeShift.userName}</p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 gap-4">
                <h2 className="text-xl font-bold text-white flex items-center gap-2 mt-4 px-2">
                    <Calendar className="w-5 h-5 text-white/40" /> Recent Shift History
                </h2>
                {shifts.length === 0 ? (
                    <div className="glass-panel p-12 flex flex-col items-center justify-center text-white/30 gap-4">
                        <AlertCircle className="w-12 h-12 opacity-30" />
                        <p>No shift records found.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {shifts.map(shift => (
                            <div key={shift.id} className={`glass-panel p-5 flex flex-col gap-4 relative group hover:border-white/20 transition-all ${shift.status === 'active' ? 'border-primary/40' : ''}`}>
                                <div className="flex justify-between items-center">
                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-tighter border ${shift.status === 'active' ? 'bg-primary/10 text-primary border-primary/20' : 'bg-white/5 text-white/40 border-white/10'}`}>
                                        {shift.status}
                                    </span>
                                    <span className="text-xs text-white/30 font-mono">
                                        {shift.startTime?.toDate?.() ? shift.startTime.toDate().toLocaleDateString() : 'Pending...'}
                                    </span>
                                </div>

                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center border border-white/10">
                                        <User className="w-5 h-5 text-white/60" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-white">{shift.userName}</p>
                                        <p className="text-[10px] text-white/40">Employee ID: {shift.userId.slice(0, 8)}</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/5 mt-auto">
                                    <div className="space-y-1">
                                        <span className="text-[10px] text-white/30 font-bold uppercase block">Total Sales</span>
                                        <span className="text-sm text-primary font-bold font-mono">Ksh {shift.totalSales?.toLocaleString() || 0}</span>
                                    </div>
                                    <div className="space-y-1 text-right">
                                        <span className="text-[10px] text-white/30 font-bold uppercase block">Sales Count</span>
                                        <span className="text-sm text-white font-bold font-mono">{shift.salesCount || 0} items</span>
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
