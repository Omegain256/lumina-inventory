import { useAuth } from '../../contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import { LogIn } from 'lucide-react';

import { useState } from 'react';

export default function Login() {
    const { loginWithEmail, loginWithGoogle, loginDemo, loginAsGuest, currentUser } = useAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);

    if (currentUser) {
        return <Navigate to="/" />;
    }

    const handleEmailLogin = async (e) => {
        e.preventDefault();
        try {
            setLoading(true);
            setError(null);
            await loginWithEmail(email, password);
        } catch (err) {
            console.error("Login failed:", err);
            setError(err.message);
            setLoading(false);
        }
    };

    const handleGoogleLogin = async () => {
        try {
            setLoading(true);
            setError(null);
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
            setError(null);
            await loginDemo();
        } catch (err) {
            console.error("Demo login failed:", err);
            setError(err.message);
            setLoading(false);
        }
    };


    const handleGuestLogin = () => {
        setLoading(true);
        loginAsGuest();
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-primary/20 rounded-full blur-[100px] pointer-events-none z-0"></div>

            <div className="glass-panel max-w-md w-full p-8 md:p-10 relative z-10">
                <div className="text-center mb-10">
                    <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-tr from-primary to-accent flex items-center justify-center shadow-[0_0_40px_rgba(0,170,255,0.4)] border border-white/10">
                        <span className="text-white font-black text-3xl tracking-tighter">AK</span>
                    </div>
                    <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-white/70">
                        AKISA LIMITED
                    </h1>
                    <p className="text-white/50 mt-2 text-sm">We Sell Mobile Phone Spares & Accessories</p>
                    <p className="text-primary/60 text-[10px] mt-1 uppercase tracking-widest font-bold">Fast. Affordable. Trusted</p>
                </div>

                {error && <div className="text-red-400 text-sm mb-4 bg-red-400/10 p-3 rounded-lg border border-red-400/20">{error}</div>}

                <form onSubmit={handleEmailLogin} className="space-y-4 mb-6">
                    <div>
                        <label className="block text-xs font-semibold text-white/40 uppercase tracking-wider mb-1.5 ml-1">Email Address</label>
                        <input
                            type="email"
                            placeholder="name@company.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary/50 transition-colors"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-white/40 uppercase tracking-wider mb-1.5 ml-1">Password</label>
                        <input
                            type="password"
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary/50 transition-colors"
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-white text-black py-3.5 rounded-xl font-bold hover:opacity-90 transition-opacity disabled:opacity-50"
                    >
                        {loading ? "Signing in..." : "Sign In"}
                    </button>
                </form>

                <div className="relative mb-6">
                    <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/10"></div></div>
                    <div className="relative flex justify-center text-xs uppercase"><span className="bg-[#0a0a0b] px-2 text-white/30">Quick Access</span></div>
                </div>

                <div className="grid grid-cols-1 gap-3">
                    <button
                        onClick={handleGuestLogin}
                        disabled={loading}
                        className="w-full bg-primary text-primary-foreground py-3.5 rounded-xl font-bold hover:opacity-90 transition-all shadow-[0_0_20px_rgba(139,92,246,0.3)] flex items-center justify-center gap-2"
                    >
                        Explore Demo as Guest
                    </button>

                    <div className="grid grid-cols-2 gap-3">
                        <button
                            onClick={handleGoogleLogin}
                            disabled={loading}
                            className="flex items-center justify-center gap-2 rounded-xl bg-white/5 border border-white/10 py-3 transition-all hover:bg-white/10 disabled:opacity-50"
                        >
                            <span className="text-sm font-medium text-white/80">Google</span>
                        </button>

                        <button
                            onClick={handleDemoLogin}
                            disabled={loading}
                            title="Sign in with demo account (Requires manual auth confirmation in Supabase)"
                            className="flex items-center justify-center gap-2 rounded-xl bg-white/5 border border-white/10 py-3 transition-all hover:bg-white/10 disabled:opacity-50"
                        >
                            <span className="text-sm font-medium text-white/60">Demo Login</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
