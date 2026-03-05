import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import { useState } from 'react';
import { Menu } from 'lucide-react';

export default function DashboardLayout() {
    const [sidebarOpen, setSidebarOpen] = useState(false);

    return (
        <div className="min-h-screen bg-background text-foreground flex">
            <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />

            <main className="flex-1 md:ml-64 relative min-h-screen flex flex-col transition-all duration-300">
                <header className="md:hidden flex items-center p-4 border-b border-white/5 bg-black/20 backdrop-blur-md sticky top-0 z-30">
                    <button
                        onClick={() => setSidebarOpen(true)}
                        className="p-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 transition-colors"
                    >
                        <Menu className="w-6 h-6 text-white" />
                    </button>
                    <span className="ml-4 font-semibold text-lg tracking-wide">Lumina</span>
                </header>

                <div className="flex-1 p-4 md:p-8 max-w-7xl mx-auto w-full">
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 ease-out h-full">
                        <Outlet />
                    </div>
                </div>
            </main>
        </div>
    );
}
