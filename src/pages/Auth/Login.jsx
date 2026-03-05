import { useAuth } from '../../contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import { LogIn } from 'lucide-react';

import { useState } from 'react';

export default function Login() {
    const { loginWithGoogle, loginDemo, currentUser } = useAuth();
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);

    if (currentUser) {
        return <Navigate to="/" />;
    }

    const handleGoogleLogin = async () => {
        try {
            setLoading(true);
            await loginWithGoogle();
        } catch (err) {
            console.error("Login failed:", err);
            setError(err.message);
            setLoading(false);
        }
    };

    const handleDemoLogin = async () => {
        try {
            setLoading(true);
            await loginDemo();
        } catch (err) {
            console.error("Demo login failed:", err);
            setError(err.message);
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-primary/20 rounded-full blur-[100px] pointer-events-none z-0"></div>

            <div className="glass-panel max-w-md w-full p-8 md:p-10 relative z-10">
                <div className="text-center mb-10">
                    <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-gradient-to-tr from-primary to-accent flex items-center justify-center shadow-[0_0_30px_rgba(255,255,255,0.2)]">
                        <div className="w-8 h-8 bg-white rounded-md rotate-45"></div>
                    </div>
                    <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-white/70">
                        Welcome to Lumina
                    </h1>
                    <p className="text-white/50 mt-2">Premium Inventory Management</p>
                </div>

                {error && <div className="text-red-400 text-sm mb-4 bg-red-400/10 p-3 rounded-lg border border-red-400/20">{error}</div>}

                <button
                    onClick={handleGoogleLogin}
                    disabled={loading}
                    className="w-full relative group overflow-hidden rounded-xl bg-white/5 border border-white/10 p-[1px] mb-4 transition-all hover:bg-white/10 hover:shadow-[0_0_20px_rgba(255,255,255,0.1)] disabled:opacity-50"
                >
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-[100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
                    <div className="bg-background/80 backdrop-blur-sm rounded-xl px-6 py-4 flex items-center justify-center gap-3 w-full h-full">
                        <LogIn className="w-5 h-5 text-white/80" />
                        <span className="font-semibold text-white/90">Continue with Google</span>
                    </div>
                </button>

                <button
                    onClick={handleDemoLogin}
                    disabled={loading}
                    className="w-full relative group overflow-hidden rounded-xl bg-primary/20 border border-primary/50 p-[1px] transition-all hover:bg-primary/30 hover:shadow-[0_0_20px_rgba(var(--primary),0.3)] disabled:opacity-50"
                >
                    <div className="bg-background/80 backdrop-blur-sm rounded-xl px-6 py-4 flex items-center justify-center gap-3 w-full h-full">
                        <span className="font-semibold text-primary">{loading ? "Logging in..." : "Demo Login (Test)"}</span>
                    </div>
                </button>
            </div>
        </div>
    );
}
