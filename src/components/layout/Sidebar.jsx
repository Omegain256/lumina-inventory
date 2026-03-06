import { NavLink } from 'react-router-dom';
import {
    LayoutDashboard, Tag, ListPlus, Grid2X2, Ruler, ShoppingCart,
    Boxes, Store, Warehouse, ClipboardList, ArrowLeftRight,
    BarChart3, CircleDollarSign, TrendingUp, Clock, PieChart, Users, HandCoins,
    UserPlus, Wrench, LogOut, Menu, User, Key, SlidersHorizontal, Settings2, Receipt, CreditCard, Bell
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { cn } from '../../utils/cn';
import { useState } from 'react';

const NavGroup = ({ title, children }) => (
    <div className="mb-6">
        {title && <h3 className="px-4 text-[10px] font-bold text-white/40 tracking-widest uppercase mb-3">{title}</h3>}
        <div className="flex flex-col gap-1">
            {children}
        </div>
    </div>
);

const NavItem = ({ to, icon: Icon, label, end = false, onClick }) => (
    <NavLink
        to={to}
        end={end}
        onClick={onClick}
        className={({ isActive }) => cn(
            "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 ease-out group relative overflow-hidden",
            isActive
                ? "bg-glass-light text-white shadow-lg border border-white/10"
                : "text-white/70 hover:text-white hover:bg-glass-dark hover:border-white/5 border border-transparent"
        )}
    >
        {({ isActive }) => (
            <>
                {isActive && (
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-primary to-accent shadow-[0_0_10px_rgba(255,255,255,0.5)] rounded-r-md"></div>
                )}
                <Icon className={cn(
                    "w-5 h-5 transition-transform duration-300",
                    isActive ? "scale-110 drop-shadow-[0_0_5px_rgba(255,255,255,0.5)]" : "group-hover:scale-110 group-hover:rotate-3"
                )} />
                <span className="font-medium tracking-wide">{label}</span>
            </>
        )}
    </NavLink>
);

export default function Sidebar({ isOpen, setIsOpen }) {
    const { logout, isAdmin, isManager } = useAuth();

    return (
        <>
            {/* Mobile overlay */}
            {isOpen && (
                <div
                    className="md:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-40 transition-opacity"
                    onClick={() => setIsOpen(false)}
                />
            )}

            <aside className={cn(
                "w-64 h-[100dvh] fixed left-0 top-0 p-3 md:p-4 z-50 flex flex-col transition-transform duration-500 ease-[cubic-bezier(0.4,0,0.2,1)]",
                isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
            )}>
                <div className="glass-panel h-full w-full flex flex-col pt-6 pb-4 px-3 relative overflow-hidden shadow-2xl md:shadow-none">
                    {/* Glow effect inside sidebar */}
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-32 bg-primary/20 rounded-full blur-[50px] pointer-events-none"></div>

                    <div className="flex items-center justify-between px-4 mb-8 z-10">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-primary to-accent border border-white/20 flex items-center justify-center shadow-[0_0_20px_rgba(0,170,255,0.3)]">
                                <span className="text-white font-bold text-xl tracking-tighter">AK</span>
                            </div>
                            <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-white/60 drop-shadow-sm font-sans tracking-tight">
                                AKISA LIMITED
                            </h1>
                        </div>
                    </div>

                    <nav className="flex-1 overflow-y-auto custom-scrollbar flex flex-col z-10 pb-6 pr-2 -mr-2">
                        <NavGroup title="Main">
                            <NavItem to="/" icon={LayoutDashboard} label="Dashboard" end onClick={() => setIsOpen(false)} />
                        </NavGroup>

                        <NavGroup title="Products">
                            <NavItem to="/pos" icon={Tag} label="New Sale - POS" onClick={() => setIsOpen(false)} />
                            <NavItem to="/products/add" icon={ListPlus} label="Add Product" onClick={() => setIsOpen(false)} />
                            <NavItem to="/products/categories" icon={Grid2X2} label="Category" onClick={() => setIsOpen(false)} />
                            <NavItem to="/products/units" icon={Ruler} label="Units" onClick={() => setIsOpen(false)} />
                            <NavItem to="/products/brands" icon={ShoppingCart} label="Brands" onClick={() => setIsOpen(false)} />
                        </NavGroup>

                        <NavGroup title="Inventory">
                            <NavItem to="/products" icon={Boxes} label="Product List" end onClick={() => setIsOpen(false)} />
                            <NavItem to="/shops" icon={Store} label="Shops" onClick={() => setIsOpen(false)} />
                            <NavItem to="/warehouses" icon={Warehouse} label="Warehouse" onClick={() => setIsOpen(false)} />
                            <NavItem to="/purchases" icon={ClipboardList} label="Purchases & Returns" onClick={() => setIsOpen(false)} />
                            <NavItem to="/transfers" icon={ArrowLeftRight} label="Transfers" onClick={() => setIsOpen(false)} />
                        </NavGroup>

                        {(isAdmin || isManager) && (
                            <NavGroup title="Reports">
                                <NavItem to="/reports/pnl" icon={BarChart3} label="Profits and Loss" onClick={() => setIsOpen(false)} />
                                <NavItem to="/reports/sales" icon={CircleDollarSign} label="Sales" onClick={() => setIsOpen(false)} />
                                <NavItem to="/reports/cashflow" icon={TrendingUp} label="Cashflow" onClick={() => setIsOpen(false)} />
                                <NavItem to="/reports/workshift" icon={Clock} label="Workshift" onClick={() => setIsOpen(false)} />
                                <NavItem to="/reports/expenses" icon={PieChart} label="Expenses" onClick={() => setIsOpen(false)} />
                                <NavItem to="/reports/employees" icon={Users} label="Employees" onClick={() => setIsOpen(false)} />
                                <NavItem to="/reports/commission" icon={HandCoins} label="Commission" onClick={() => setIsOpen(false)} />
                                <NavItem to="/reports/stock-movement" icon={TrendingUp} label="Stock Movement" onClick={() => setIsOpen(false)} />
                            </NavGroup>
                        )}

                        {isAdmin && (
                            <NavGroup title="Stakeholders">
                                <NavItem to="/stakeholders/customers" icon={UserPlus} label="Customers" onClick={() => setIsOpen(false)} />
                                <NavItem to="/stakeholders/suppliers" icon={Users} label="Suppliers" onClick={() => setIsOpen(false)} />
                            </NavGroup>
                        )}

                        <NavGroup title="Services">
                            <NavItem to="/repairs" icon={Wrench} label="Repairs" onClick={() => setIsOpen(false)} />
                        </NavGroup>

                        <NavGroup title="Settings">
                            <NavItem to="/settings/account" icon={User} label="Account Settings" onClick={() => setIsOpen(false)} />
                            <NavItem to="/settings/password" icon={Key} label="Change Password" onClick={() => setIsOpen(false)} />
                            <NavItem to="/settings/preferences" icon={SlidersHorizontal} label="Preferences Settings" onClick={() => setIsOpen(false)} />
                            <NavItem to="/settings/shop" icon={Settings2} label="Shop settings" onClick={() => setIsOpen(false)} />
                            <NavItem to="/settings/receipt" icon={Receipt} label="Receipt Setting" onClick={() => setIsOpen(false)} />
                            <NavItem to="/settings/payment" icon={CreditCard} label="Payment Settings" onClick={() => setIsOpen(false)} />
                            <NavItem to="/settings/notifications" icon={Bell} label="Notifications" onClick={() => setIsOpen(false)} />
                            {isAdmin && <NavItem to="/settings/users" icon={Users} label="User Management" onClick={() => setIsOpen(false)} />}
                        </NavGroup>
                    </nav>

                    <div className="mt-auto pt-4 border-t border-glass-border z-10">
                        <button
                            onClick={logout}
                            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 text-white/70 hover:text-white hover:bg-destructive/20 hover:border-destructive/30 border border-transparent group"
                        >
                            <LogOut className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                            <span className="font-medium tracking-wide">Sign Out</span>
                        </button>
                    </div>
                </div>
            </aside>
        </>
    );
}
