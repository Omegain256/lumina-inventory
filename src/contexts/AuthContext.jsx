import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../config/supabase';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [currentUser, setCurrentUser] = useState(null);
    const [userRole, setUserRole] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Initial session check
        supabase.auth.getSession().then(({ data: { session } }) => {
            handleUserChange(session?.user ?? null);
        });

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            handleUserChange(session?.user ?? null);
        });

        return () => subscription.unsubscribe();
    }, []);

    async function handleUserChange(user) {
        if (user) {
            setCurrentUser(user);
            // Fetch profile including role
            const { data, error } = await supabase
                .from('profiles')
                .select('role')
                .eq('id', user.id)
                .single();

            if (error) {
                console.error("Error fetching profile:", error);
                setUserRole('staff');
            } else {
                setUserRole(data.role);
            }
        } else {
            setCurrentUser(null);
            setUserRole(null);
        }
        setLoading(false);
    }

    const loginWithEmail = async (email, password) => {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        return data;
    };

    const loginWithGoogle = async () => {
        const { data, error } = await supabase.auth.signInWithOAuth({ provider: 'google' });
        if (error) throw error;
        return data;
    };

    const logout = async () => {
        await supabase.auth.signOut();
        setCurrentUser(null);
        setUserRole(null);
    };

    const isAdmin = userRole === 'admin';
    const isManager = userRole === 'manager' || userRole === 'admin';

    const value = { currentUser, userRole, isAdmin, isManager, loginWithEmail, loginWithGoogle, logout };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
};
