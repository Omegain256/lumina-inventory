import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { User, Key, SlidersHorizontal, Settings2, Receipt, CreditCard, Bell, Save, Users, Shield, Mail, Trash2, Plus, X, Loader2 } from 'lucide-react';
import { createClient } from '@supabase/supabase-js';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../config/supabase';
import toast from 'react-hot-toast';

export default function Settings() {
    const location = useLocation();
    const navigate = useNavigate();

    const currentTabId = location.pathname.split('/').pop() || 'account';

    const [isSaving, setIsSaving] = useState(false);
    const { isAdmin, isManager } = useAuth();
    const [users, setUsers] = useState([]);
    const [shopSettings, setShopSettings] = useState({
        shop_name: 'AKISA LIMITED',
        shop_address: 'Simara Mall, 1st Floor, Shop No. 1, Behind National Archives',
        shop_phone: '0768 888 661',
        receipt_header: 'AKISA LIMITED: We Sell Mobile Phone Spares & Accessories.',
        receipt_footer: 'Fast. Affordable. Trusted. Goods once sold are not returnable.',
        kra_pin: 'P052225992Z',
        whatsapp_phone: '0768 888 661',
        paybill_number: '516600',
        account_number: '777767',
        account_name: 'Akisa Limited.'
    });
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isAddingStaff, setIsAddingStaff] = useState(false);
    const [newStaff, setNewStaff] = useState({ name: '', email: '', password: '', role: 'staff' });

    const fetchSettings = async () => {
        const { data } = await supabase.from('settings').select('*').eq('id', 'global').single();
        if (data) setShopSettings(data);
    };

    const fetchUsers = async () => {
        const { data } = await supabase
            .from('profiles')
            .select('*')
            .order('created_at', { ascending: false });
        if (data) setUsers(data);
    };

    useEffect(() => {
        fetchSettings();
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
            fetchUsers();
        } catch (error) {
            console.error(error);
            toast.error("Failed to update role");
        }
    };

    const handleDeleteUser = async (userId) => {
        if (!window.confirm("Are you sure you want to remove this user profile? This won't delete their auth account but will remove their access role.")) return;
        try {
            const { error } = await supabase.from('profiles').delete().eq('id', userId);
            if (error) throw error;
            toast.success("User profile removed");
            fetchUsers();
        } catch (error) {
            console.error(error);
            toast.error("Failed to remove user");
        }
    };

    const handleAddStaff = async (e) => {
        e.preventDefault();
        setIsAddingStaff(true);
        try {
            // Create a temporary client that doesn't persist the session
            // This allows us to sign up a new user without logging out the current admin
            const tempClient = createClient(
                import.meta.env.VITE_SUPABASE_URL || 'https://qezekvatrufxrxjpzdea.supabase.co',
                import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_JJVL0uWY-qiQ6Y0c0oec7A__ljh1VVm',
                { auth: { persistSession: false } }
            );

            const { data: authData, error: authError } = await tempClient.auth.signUp({
                email: newStaff.email,
                password: newStaff.password,
                options: {
                    data: { name: newStaff.name }
                }
            });

            if (authError) throw authError;

            // The profile might already be created by the handle_new_user trigger, 
            // but we want to ensure the role and name are correct
            const { error: profileError } = await supabase
                .from('profiles')
                .update({
                    name: newStaff.name,
                    role: newStaff.role
                })
                .eq('id', authData.user.id);

            if (profileError) {
                console.error("Profile update error:", profileError);
                // Not a fatal error as the trigger might have created it
            }

            toast.success("Staff account created! They will need to confirm their email.");
            setIsAddModalOpen(false);
            setNewStaff({ name: '', email: '', password: '', role: 'staff' });
            fetchUsers();
        } catch (error) {
            console.error(error);
            toast.error(error.message || "Failed to add staff");
        } finally {
            setIsAddingStaff(false);
        }
    };

    const tabs = [
        { id: 'account', label: 'Account Settings', icon: User },
        { id: 'password', label: 'Change Password', icon: Key },
        ...(isAdmin || isManager ? [
            { id: 'preferences', label: 'Preferences Settings', icon: SlidersHorizontal },
            { id: 'shop', label: 'Shop settings', icon: Settings2 },
            { id: 'receipt', label: 'Receipt Setting', icon: Receipt },
            { id: 'payment', label: 'Payment Settings', icon: CreditCard },
            { id: 'notifications', label: 'Notifications', icon: Bell }
        ] : []),
        ...(isAdmin ? [{ id: 'users', label: 'User Management', icon: Users }] : []),
    ];

    const currentTab = tabs.find(t => t.id === currentTabId) || tabs[0];

    // Mock save function
    const handleSave = async () => {
        setIsSaving(true);
        try {
            const { error } = await supabase.from('settings').upsert({
                id: 'global',
                ...shopSettings,
                updated_at: new Date().toISOString()
            });
            if (error) throw error;
            toast.success("Settings saved successfully.");
        } catch (error) {
            console.error(error);
            toast.error("Failed to save settings.");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="max-w-6xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
            <header className="mb-8 flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-white/60 flex items-center gap-3">
                        Settings
                    </h1>
                    <p className="text-white/50 mt-1">Manage Akisa Limited application and business configuration.</p>
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
                                            <input type="email" defaultValue="admin@akisalimited.com" className="w-full bg-[#0a0a0a] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary" />
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
                                            <p className="text-sm text-white/50 mt-1">Akisa Limited is designed natively in dark mode.</p>
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
                                        <input
                                            type="text"
                                            value={shopSettings.shop_name}
                                            onChange={(e) => setShopSettings({ ...shopSettings, shop_name: e.target.value })}
                                            className="w-full bg-[#0a0a0a] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-white/70 mb-1.5">Store Phone</label>
                                        <input
                                            type="text"
                                            value={shopSettings.shop_phone}
                                            onChange={(e) => setShopSettings({ ...shopSettings, shop_phone: e.target.value })}
                                            className="w-full bg-[#0a0a0a] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-white/70 mb-1.5">Main Headquarter Address</label>
                                        <input
                                            type="text"
                                            value={shopSettings.shop_address}
                                            onChange={(e) => setShopSettings({ ...shopSettings, shop_address: e.target.value })}
                                            className="w-full bg-[#0a0a0a] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary"
                                        />
                                    </div>
                                    <div className="pt-6 border-t border-white/5">
                                        <h3 className="text-lg font-bold text-white mb-4">Banking & Payment Info</h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium text-white/70 mb-1.5">KRA PIN</label>
                                                <input
                                                    type="text"
                                                    value={shopSettings.kra_pin || ''}
                                                    onChange={(e) => setShopSettings({ ...shopSettings, kra_pin: e.target.value })}
                                                    className="w-full bg-[#0a0a0a] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-white/70 mb-1.5">WhatsApp / Call</label>
                                                <input
                                                    type="text"
                                                    value={shopSettings.whatsapp_phone || ''}
                                                    onChange={(e) => setShopSettings({ ...shopSettings, whatsapp_phone: e.target.value })}
                                                    className="w-full bg-[#0a0a0a] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-white/70 mb-1.5">M-Pesa Paybill</label>
                                                <input
                                                    type="text"
                                                    value={shopSettings.paybill_number || ''}
                                                    onChange={(e) => setShopSettings({ ...shopSettings, paybill_number: e.target.value })}
                                                    className="w-full bg-[#0a0a0a] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-white/70 mb-1.5">Account Number</label>
                                                <input
                                                    type="text"
                                                    value={shopSettings.account_number || ''}
                                                    onChange={(e) => setShopSettings({ ...shopSettings, account_number: e.target.value })}
                                                    className="w-full bg-[#0a0a0a] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary"
                                                />
                                            </div>
                                            <div className="md:col-span-2">
                                                <label className="block text-sm font-medium text-white/70 mb-1.5">Account Name</label>
                                                <input
                                                    type="text"
                                                    value={shopSettings.account_name || ''}
                                                    onChange={(e) => setShopSettings({ ...shopSettings, account_name: e.target.value })}
                                                    className="w-full bg-[#0a0a0a] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {currentTabId === 'receipt' && (
                                <div className="space-y-6">
                                    <div>
                                        <label className="block text-sm font-medium text-white/70 mb-1.5">Receipt Header Message</label>
                                        <textarea
                                            rows="2"
                                            value={shopSettings.receipt_header}
                                            onChange={(e) => setShopSettings({ ...shopSettings, receipt_header: e.target.value })}
                                            className="w-full bg-[#0a0a0a] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary resize-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-white/70 mb-1.5">Receipt Footer Message</label>
                                        <textarea
                                            rows="2"
                                            value={shopSettings.receipt_footer}
                                            onChange={(e) => setShopSettings({ ...shopSettings, receipt_footer: e.target.value })}
                                            className="w-full bg-[#0a0a0a] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary resize-none"
                                        />
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
                                        <p className="text-white/50 text-sm italic">Note: Manage roles, remove access, or create new staff accounts.</p>
                                        <button
                                            onClick={() => setIsAddModalOpen(true)}
                                            className="bg-primary/20 text-primary border border-primary/30 px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-primary hover:text-black transition-all"
                                        >
                                            <Plus className="w-4 h-4" /> Add New Staff
                                        </button>
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
                                                                <option value="super_admin">Super Admin</option>
                                                                <option value="admin">Admin</option>
                                                                <option value="manager">Manager</option>
                                                                <option value="staff">Staff</option>
                                                                <option value="repair_technician">Repair Technician</option>
                                                            </select>
                                                        </div>
                                                        <button
                                                            onClick={() => handleDeleteUser(user.id)}
                                                            className="p-2.5 rounded-xl bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-all border border-red-500/20"
                                                            title="Delete Profile"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
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
            {/* ADD STAFF MODAL */}
            {isAddModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="glass-panel w-full max-w-md p-8 border-primary/20 shadow-[0_0_50px_rgba(11,211,211,0.1)] relative">
                        <button
                            onClick={() => setIsAddModalOpen(false)}
                            className="absolute top-4 right-4 text-white/40 hover:text-white transition-colors"
                        >
                            <X className="w-6 h-6" />
                        </button>

                        <div className="flex items-center gap-4 mb-6">
                            <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center border border-primary/30">
                                <Users className="w-6 h-6 text-primary" />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-white">Add New Staff</h3>
                                <p className="text-white/40 text-xs">Create a new login for your employee.</p>
                            </div>
                        </div>

                        <form onSubmit={handleAddStaff} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-white/40 uppercase tracking-widest mb-1.5 ml-1">Full Name</label>
                                <input
                                    required
                                    type="text"
                                    value={newStaff.name}
                                    onChange={(e) => setNewStaff({ ...newStaff, name: e.target.value })}
                                    placeholder="Enter full name"
                                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary transition-colors placeholder:text-white/20"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-white/40 uppercase tracking-widest mb-1.5 ml-1">Email Address</label>
                                <input
                                    required
                                    type="email"
                                    value={newStaff.email}
                                    onChange={(e) => setNewStaff({ ...newStaff, email: e.target.value })}
                                    placeholder="staff@akisalimited.com"
                                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary transition-colors placeholder:text-white/20"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-white/40 uppercase tracking-widest mb-1.5 ml-1">Password</label>
                                <input
                                    required
                                    min={6}
                                    type="password"
                                    value={newStaff.password}
                                    onChange={(e) => setNewStaff({ ...newStaff, password: e.target.value })}
                                    placeholder="Minimum 6 characters"
                                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary transition-colors placeholder:text-white/20"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-white/40 uppercase tracking-widest mb-1.5 ml-1">System Role</label>
                                <select
                                    value={newStaff.role}
                                    onChange={(e) => setNewStaff({ ...newStaff, role: e.target.value })}
                                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary transition-colors appearance-none"
                                >
                                    <option value="staff">Staff (Sales/Repairs)</option>
                                    <option value="repair_technician">Repair Technician</option>
                                    <option value="manager">Manager (Inventory/Reports)</option>
                                    <option value="admin">Admin (Full Control)</option>
                                    <option value="super_admin">Super Admin</option>
                                </select>
                            </div>

                            <button
                                type="submit"
                                disabled={isAddingStaff}
                                className="w-full bg-primary text-black font-bold py-4 rounded-xl mt-6 flex items-center justify-center gap-2 hover:bg-white/90 transition-all shadow-[0_0_20px_rgba(11,211,211,0.2)] disabled:opacity-50"
                            >
                                {isAddingStaff ? (
                                    <>
                                        <Loader2 className="w-5 h-5 animate-spin" /> Creating Account...
                                    </>
                                ) : (
                                    <>Create Staff Account</>
                                )}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
