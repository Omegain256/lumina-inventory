import { useAuth } from '../../contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import { LogIn, Mail, Lock, ArrowRight } from 'lucide-react';
import { useState } from 'react';

export default function Login() {
    const { loginWithEmail, loginWithGoogle, currentUser } = useAuth();
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

                <form onSubmit={handleEmailLogin} className="space-y-4">
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-white/40 uppercase tracking-widest ml-1">Email Address</label>
                        <div className="relative group">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                <Mail className="h-5 w-5 text-white/20 group-focus-within:text-primary transition-colors" />
                            </div>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="block w-full pl-11 pr-4 py-3.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-medium"
                                placeholder="name@akisa.com"
                                required
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-bold text-white/40 uppercase tracking-widest ml-1">Password</label>
                        <div className="relative group">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                <Lock className="h-5 w-5 text-white/20 group-focus-within:text-primary transition-colors" />
                            </div>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="block w-full pl-11 pr-4 py-3.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-medium"
                                placeholder="••••••••"
                                required
                            />
                        </div>
                    </div>

                    <div className="flex items-center justify-between py-1">
                        <label className="flex items-center gap-2 cursor-pointer group">
                            <input type="checkbox" className="w-4 h-4 rounded border-white/10 bg-white/5 checked:bg-primary transition-all cursor-pointer" />
                            <span className="text-xs text-white/40 group-hover:text-white/60 transition-colors">Remember me</span>
                        </label>
                        <button type="button" className="text-xs text-primary/80 hover:text-primary transition-colors font-medium">Forgot password?</button>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-white text-black py-4 rounded-xl font-black text-sm uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-white/90 transition-all shadow-[0_0_20px_rgba(255,255,255,0.2)] disabled:opacity-50 active:scale-[0.98]"
                    >
                        {loading ? 'Authenticating...' : 'Sign In to Dashboard'}
                        <ArrowRight className="w-4 h-4" />
                    </button>
                </form>

                <div className="mt-10 pt-8 border-t border-white/5 text-center">
                    <p className="text-white/30 text-xs">
                        Don't have an account? <span className="text-primary/70 cursor-pointer hover:underline">Contact System Admin</span>
                    </p>
                </div>
            </div>
        </div>
    );
}
