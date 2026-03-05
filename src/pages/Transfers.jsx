import { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot, doc, updateDoc, writeBatch, getDocs, serverTimestamp } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from '../contexts/AuthContext';
import { Plus, ArrowRight, CheckCircle2, Clock } from 'lucide-react';
import CreateTransferModal from '../components/transfers/CreateTransferModal';

export default function Transfers() {
    const [transfers, setTransfers] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Quick Mock data initialization for the prompt requirements
    const seedData = async () => {
        try {
            const locSnap = await getDocs(collection(db, 'locations'));
            if (locSnap.empty) {
                console.log('Seeding initial data...');
                const batch = writeBatch(db);

                const warehouseRef = doc(collection(db, 'locations'));
                batch.set(warehouseRef, { name: 'Warehouse A', type: 'warehouse' });

                const shopRef = doc(collection(db, 'locations'));
                batch.set(shopRef, { name: 'Shop B', type: 'shop' });

                const productRef = doc(collection(db, 'products'));
                batch.set(productRef, { name: 'Premium Coffee Beans', price: 1200, sku: 'CB-001' });

                const invRef = doc(collection(db, 'inventory'));
                batch.set(invRef, { productId: productRef.id, locationId: warehouseRef.id, quantity: 50 });

                await batch.commit();
                window.location.reload();
            }
        } catch (e) { console.error('Seeding error', e); }
    };

    useEffect(() => {
        seedData();
        const q = query(collection(db, 'transfers'), orderBy('createdAt', 'desc'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            setTransfers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        });
        return unsubscribe;
    }, []);

    const markCompleted = async (transfer) => {
        try {
            const batch = writeBatch(db);

            for (const item of transfer.items) {
                // Find inventory document for 'From'
                const fromInvQ = query(collection(db, 'inventory'));
                const fromInvSnap = await getDocs(fromInvQ);
                let fromDocId = null, fromQty = 0;
                let toDocId = null, toQty = 0;

                fromInvSnap.forEach(d => {
                    if (d.data().locationId === transfer.fromLocationId && d.data().productId === item.productId) {
                        fromDocId = d.id; fromQty = d.data().quantity;
                    }
                    if (d.data().locationId === transfer.toLocationId && d.data().productId === item.productId) {
                        toDocId = d.id; toQty = d.data().quantity;
                    }
                });

                if (fromDocId) batch.update(doc(db, 'inventory', fromDocId), { quantity: fromQty - item.quantity });

                if (toDocId) {
                    batch.update(doc(db, 'inventory', toDocId), { quantity: toQty + item.quantity });
                } else {
                    batch.set(doc(collection(db, 'inventory')), {
                        locationId: transfer.toLocationId,
                        productId: item.productId,
                        quantity: item.quantity
                    });
                }
            }

            batch.update(doc(db, 'transfers', transfer.id), {
                status: 'completed',
                completedAt: serverTimestamp()
            });
            await batch.commit();
        } catch (e) { console.error("Error completing transfer: ", e); }
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-white/60">
                        Stock Transfers
                    </h1>
                    <p className="text-white/50 mt-1">Manage and track internal stock movements.</p>
                </div>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="bg-primary text-primary-foreground px-4 py-2.5 rounded-xl font-medium flex items-center gap-2 hover:opacity-90 transition-opacity shadow-[0_0_20px_rgba(255,255,255,0.2)]"
                >
                    <Plus className="w-5 h-5" />
                    Create Transfer
                </button>
            </header>

            <div className="glass-panel overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-white/10 bg-white/5 text-white/50 text-sm">
                                <th className="p-4 font-medium">Date</th>
                                <th className="p-4 font-medium">From</th>
                                <th className="p-4 font-medium">To</th>
                                <th className="p-4 font-medium">Status</th>
                                <th className="p-4 font-medium">Created By</th>
                                <th className="p-4 font-medium text-right">Grand Total</th>
                                <th className="p-4 font-medium text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {transfers.length === 0 ? (
                                <tr>
                                    <td colSpan="7" className="p-8 text-center text-white/40">No transfers found.</td>
                                </tr>
                            ) : (
                                transfers.map(t => (
                                    <tr key={t.id} className="hover:bg-white/[0.02] transition-colors group">
                                        <td className="p-4 text-sm text-white/80">{t.createdAt?.toDate ? t.createdAt.toDate().toLocaleDateString() : 'Today'}</td>
                                        <td className="p-4 font-medium">{t.fromLocationName || 'Warehouse A'}</td>
                                        <td className="p-4 text-white/60">
                                            <ArrowRight className="w-4 h-4 inline mx-2" />
                                            <span className="font-medium text-white">{t.toLocationName || 'Shop B'}</span>
                                        </td>
                                        <td className="p-4">
                                            {t.status === 'completed' ? (
                                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                                    <CheckCircle2 className="w-3.5 h-3.5" /> Completed
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20">
                                                    <Clock className="w-3.5 h-3.5" /> Pending
                                                </span>
                                            )}
                                        </td>
                                        <td className="p-4 text-sm text-white/60">{t.createdBy}</td>
                                        <td className="p-4 text-sm font-semibold text-right flex items-center justify-end gap-1">
                                            <span className="text-white/40 font-normal pr-1">Ksh</span>
                                            {t.totalValue?.toLocaleString() || '0'}
                                        </td>
                                        <td className="p-4 text-right">
                                            {t.status === 'pending' && (
                                                <button
                                                    onClick={() => markCompleted(t)}
                                                    className="text-xs bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-lg transition-colors border border-white/10"
                                                >
                                                    Mark Complete
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <CreateTransferModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
        </div>
    );
}
