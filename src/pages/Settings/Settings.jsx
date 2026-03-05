import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { User, Key, SlidersHorizontal, Settings2, Receipt, CreditCard, Bell, Save, Users, Shield, Mail, Trash2 } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../config/supabase';
import toast from 'react-hot-toast';

export default function Settings() {
    const location = useLocation();
    const navigate = useNavigate();

    const currentTabId = location.pathname.split('/').pop() || 'account';

    const [isSaving, setIsSaving] = useState(false);
    const { isAdmin } = useAuth();
    const [users, setUsers] = useState([]);

    const fetchUsers = async () => {
        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .order('created_at', { ascending: false });
        if (data) setUsers(data);
    };

    useEffect(() => {
        if (isAdmin) {
            fetchUsers();
            const channel = supabase.channel('profiles').on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, fetchUsers).subscribe();
            return () => supabase.removeChannel(channel);
        }
    }, [isAdmin]);

    const handleRoleChange = async (userId, newRole) => {
        try {
            const { error } = await supabase
                .from('profiles')
                .update({ role: newRole })
                .eq('id', userId);
            if (error) throw error;
            toast.success(`Role updated to ${newRole}`);
        } catch (error) {
            toast.error("Failed to update role");
        }
    };

    const tabs = [
        { id: 'account', label: 'Account Settings', icon: User },
        { id: 'password', label: 'Change Password', icon: Key },
        { id: 'preferences', label: 'Preferences Settings', icon: SlidersHorizontal },
        { id: 'shop', label: 'Shop settings', icon: Settings2 },
        { id: 'receipt', label: 'Receipt Setting', icon: Receipt },
        { id: 'payment', label: 'Payment Settings', icon: CreditCard },
        { id: 'notifications', label: 'Notifications', icon: Bell },
        ...(isAdmin ? [{ id: 'users', label: 'User Management', icon: Users }] : []),
    ];

    const currentTab = tabs.find(t => t.id === currentTabId) || tabs[0];

    // Mock save function
    const handleSave = () => {
        setIsSaving(true);
        setTimeout(() => {
            setIsSaving(false);
            toast.success("Settings saved successfully.");
        }, 800);
    };

    return (
        <div className="max-w-6xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
            <header className="mb-8 flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-white/60 flex items-center gap-3">
                        Settings
                    </h1>
                    <p className="text-white/50 mt-1">Manage your application and business configuration.</p>
                </div>
                <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="bg-primary text-black px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 hover:bg-white/90 transition-colors shadow-[0_0_20px_rgba(11,211,211,0.2)] disabled:opacity-50"
                >
                    <Save className="w-4 h-4" />
                    {isSaving ? 'Saving...' : 'Save Changes'}
                </button>
            </header>

            <div className="flex flex-col md:flex-row gap-8">
                {/* SETTINGS SIDEBAR MENU (Mimics the user's screenshot) */}
                <div className="w-full md:w-64 flex-shrink-0">
                    <div className="glass-panel p-2 flex flex-col gap-1 sticky top-24">
                        <div className="px-4 py-3 text-[10px] font-bold text-white/40 tracking-widest uppercase mb-1">
                            SETTINGS
                        </div>
                        {tabs.map((tab) => {
                            const Icon = tab.icon;
                            const isActive = currentTabId === tab.id;

                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => navigate(`/settings/${tab.id}`)}
                                    className={`flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all duration-300 text-sm font-medium w-full text-left ${isActive
                                        ? "bg-white/10 text-white shadow-lg border border-white/5"
                                        : "text-white/70 hover:text-white hover:bg-white/5 border border-transparent"
                                        }`}
                                >
                                    <Icon className={`w-5 h-5 ${isActive ? "text-primary drop-shadow-[0_0_5px_rgba(11,211,211,0.5)]" : "text-white/50"}`} />
                                    {tab.label}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* SETTINGS CONTENT AREA */}
                <div className="flex-1">
                    <div className="glass-panel p-8 min-h-[500px]">
                        <h2 className="text-2xl font-bold text-white mb-6 border-b border-white/10 pb-4">
                            {currentTab.label}
                        </h2>

                        <div className="space-y-6">
                            {currentTabId === 'account' && (
                                <>
                                    <div className="flex items-center gap-6 mb-8">
                                        <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-primary/30 to-purple-500/30 border-2 border-white/10 flex items-center justify-center text-4xl font-bold text-white shadow-[0_0_30px_rgba(11,211,211,0.1)]">
                                            A
                                        </div>
                                        <div>
                                            <button className="bg-white/10 hover:bg-white/15 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors mb-2">
                                                Upload Avatar
                                            </button>
                                            <p className="text-xs text-white/40">Supported formats: JPG, PNG. Max 2MB.</p>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-6">
                                        <div>
                                            <label className="block text-sm font-medium text-white/70 mb-1.5">First Name</label>
                                            <input type="text" defaultValue="Admin" className="w-full bg-[#0a0a0a] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary" />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-white/70 mb-1.5">Last Name</label>
                                            <input type="text" defaultValue="User" className="w-full bg-[#0a0a0a] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary" />
                                        </div>
                                        <div className="col-span-2">
                                            <label className="block text-sm font-medium text-white/70 mb-1.5">Email Address</label>
                                            <input type="email" defaultValue="admin@lumina.com" className="w-full bg-[#0a0a0a] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary" />
                                        </div>
                                    </div>
                                </>
                            )}

                            {currentTabId === 'password' && (
                                <div className="max-w-md space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-white/70 mb-1.5">Current Password</label>
                                        <input type="password" placeholder="••••••••" className="w-full bg-[#0a0a0a] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-white/70 mb-1.5">New Password</label>
                                        <input type="password" placeholder="••••••••" className="w-full bg-[#0a0a0a] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-white/70 mb-1.5">Confirm New Password</label>
                                        <input type="password" placeholder="••••••••" className="w-full bg-[#0a0a0a] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary" />
                                    </div>
                                </div>
                            )}

                            {currentTabId === 'preferences' && (
                                <div className="space-y-6">
                                    <div className="flex items-center justify-between p-4 bg-[#0a0a0a] border border-white/5 rounded-xl">
                                        <div>
                                            <h4 className="font-bold text-white">Dark Mode</h4>
                                            <p className="text-sm text-white/50 mt-1">Lumina is designed natively in dark mode.</p>
                                        </div>
                                        <div className="w-12 h-6 bg-primary rounded-full relative opacity-50 cursor-not-allowed">
                                            <div className="w-4 h-4 bg-black rounded-full absolute right-1 top-1"></div>
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between p-4 bg-[#0a0a0a] border border-white/5 rounded-xl">
                                        <div>
                                            <h4 className="font-bold text-white">Compact Sidebar</h4>
                                            <p className="text-sm text-white/50 mt-1">Shrink sidebar to icons only to save space.</p>
                                        </div>
                                        <div className="w-12 h-6 bg-white/10 rounded-full relative cursor-pointer hover:bg-white/20 transition-colors">
                                            <div className="w-4 h-4 bg-white/50 rounded-full absolute left-1 top-1"></div>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-white/70 mb-1.5">Language</label>
                                        <select className="w-full max-w-xs bg-[#0a0a0a] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary appearance-none">
                                            <option>English (US)</option>
                                            <option>Swahili</option>
                                            <option>French</option>
                                        </select>
                                    </div>
                                </div>
                            )}

                            {currentTabId === 'shop' && (
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-white/70 mb-1.5">Store Name</label>
                                        <input type="text" defaultValue="Lumina Test Store" className="w-full bg-[#0a0a0a] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-white/70 mb-1.5">Business Registration Number</label>
                                        <input type="text" defaultValue="BN-1234567" className="w-full bg-[#0a0a0a] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-white/70 mb-1.5">Main Headquarter Address</label>
                                        <input type="text" defaultValue="Nairobi CBD, Moi Avenue" className="w-full bg-[#0a0a0a] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary" />
                                    </div>
                                </div>
                            )}

                            {currentTabId === 'receipt' && (
                                <div className="space-y-6">
                                    <div>
                                        <label className="block text-sm font-medium text-white/70 mb-1.5">Receipt Header Message</label>
                                        <textarea rows="2" defaultValue="Welcome to Lumina Store! We sell the best phones." className="w-full bg-[#0a0a0a] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary resize-none" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-white/70 mb-1.5">Receipt Footer Message</label>
                                        <textarea rows="2" defaultValue="Thank you for your business. Goods once sold are not returnable." className="w-full bg-[#0a0a0a] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary resize-none" />
                                    </div>
                                    <div className="flex items-center justify-between p-4 bg-[#0a0a0a] border border-white/5 rounded-xl">
                                        <div>
                                            <h4 className="font-bold text-white">Auto-print Receipts</h4>
                                            <p className="text-sm text-white/50 mt-1">Automatically trigger printer after New Sale.</p>
                                        </div>
                                        <div className="w-12 h-6 bg-primary rounded-full relative cursor-pointer">
                                            <div className="w-4 h-4 bg-black rounded-full absolute right-1 top-1"></div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {currentTabId === 'payment' && (
                                <div className="space-y-4">
                                    <p className="text-white/50 text-sm mb-6">Configure available payment modes and integration keys.</p>

                                    <div className="p-4 bg-[#0a0a0a] border border-white/10 rounded-xl flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <CreditCard className="w-6 h-6 text-green-400" />
                                            <div>
                                                <h4 className="font-bold text-white">Credit/Debit Card Terminal</h4>
                                                <p className="text-xs text-white/50 mt-0.5">Connected (Terminal ID: TX-8821)</p>
                                            </div>
                                        </div>
                                        <button className="text-sm text-primary hover:text-white transition-colors">Configure</button>
                                    </div>

                                    <div className="p-4 bg-[#0a0a0a] border border-white/10 rounded-xl flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="w-6 h-6 rounded bg-green-500 font-bold text-[10px] text-white flex items-center justify-center">M</div>
                                            <div>
                                                <h4 className="font-bold text-white">M-Pesa API Integration</h4>
                                                <p className="text-xs text-white/50 mt-0.5">Paybill / Till Number active</p>
                                            </div>
                                        </div>
                                        <button className="text-sm text-primary hover:text-white transition-colors">Configure</button>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-white/70 mb-1.5 mt-6">Default Currency</label>
                                        <select className="w-full max-w-xs bg-[#0a0a0a] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary appearance-none">
                                            <option>Ksh (Kenyan Shilling)</option>
                                            <option>USD ($)</option>
                                        </select>
                                    </div>
                                </div>
                            )}

                            {currentTabId === 'notifications' && (
                                <div className="space-y-4">
                                    {[
                                        { title: 'Low Stock Alerts', desc: 'Get notified when items drop below threshold.', active: true },
                                        { title: 'Daily Sales Digest', desc: 'Receive a summary of sales at closing time.', active: false },
                                        { title: 'New System Updates', desc: 'Alerts regarding Lumina platform updates.', active: true },
                                        { title: 'Repair Status Changes', desc: 'Notify when a technician completes a repair.', active: true },
                                    ].map((item, i) => (
                                        <div key={i} className="flex items-center justify-between p-4 bg-[#0a0a0a] border border-white/5 rounded-xl">
                                            <div>
                                                <h4 className="font-bold text-white">{item.title}</h4>
                                                <p className="text-sm text-white/50 mt-1">{item.desc}</p>
                                            </div>
                                            <div className={`w-12 h-6 rounded-full relative cursor-pointer transition-colors ${item.active ? 'bg-primary' : 'bg-white/10 hover:bg-white/20'}`}>
                                                <div className={`w-4 h-4 rounded-full absolute top-1 transition-all ${item.active ? 'bg-black right-1' : 'bg-white/50 left-1'}`}></div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {currentTabId === 'users' && isAdmin && (
                                <div className="space-y-6">
                                    <div className="flex justify-between items-center mb-4">
                                        <p className="text-white/50 text-sm italic">Manage system users and their access levels.</p>
                                    </div>
                                    <div className="space-y-4">
                                        {users.length === 0 ? (
                                            <p className="text-center text-white/30 py-8">No users found.</p>
                                        ) : (
                                            users.map(user => (
                                                <div key={user.id} className="p-4 bg-[#0a0a0a] border border-white/5 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-white/10 transition-colors">
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xl uppercase border border-primary/20">
                                                            {user.name?.[0] || user.email?.[0]}
                                                        </div>
                                                        <div>
                                                            <h4 className="font-bold text-white">{user.name}</h4>
                                                            <div className="flex items-center gap-2 text-xs text-white/40 mt-0.5">
                                                                <Mail className="w-3 h-3" /> {user.email}
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-3">
                                                        <div className="relative group">
                                                            <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                                                                <Shield className="w-3.5 h-3.5 text-primary/50" />
                                                            </div>
                                                            <select
                                                                value={user.role || 'staff'}
                                                                onChange={(e) => handleRoleChange(user.id, e.target.value)}
                                                                className="bg-white/5 border border-white/10 rounded-xl pl-9 pr-4 py-2 text-xs text-white focus:outline-none focus:border-primary appearance-none min-w-[120px]"
                                                            >
                                                                <option value="admin">Admin</option>
                                                                <option value="manager">Manager</option>
                                                                <option value="staff">Staff</option>
                                                            </select>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>
                            )}

                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
