import { createContext, useContext, useEffect, useState } from 'react';
import { auth, googleProvider, db } from '../config/firebase';
import { signInWithPopup, signInWithEmailAndPassword, onAuthStateChanged, signOut as firebaseSignOut } from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [currentUser, setCurrentUser] = useState(null);
    const [userRole, setUserRole] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (user) {
                const userDoc = await getDoc(doc(db, 'users', user.uid));
                if (userDoc.exists()) {
                    let role = userDoc.data().role || 'staff';
                    // Force admin for demo user
                    if (user.email === 'demo@lumina.com' && role !== 'admin') {
                        role = 'admin';
                        await updateDoc(doc(db, 'users', user.uid), { role: 'admin' });
                    }
                    setUserRole(role);
                } else {
                    // Create user record if not exists
                    const defaultRole = user.email === 'demo@lumina.com' ? 'admin' : 'staff';
                    await setDoc(doc(db, 'users', user.uid), {
                        email: user.email,
                        name: user.displayName || user.email.split('@')[0],
                        role: defaultRole,
                        createdAt: serverTimestamp()
                    });
                    setUserRole(defaultRole);
                }
            } else {
                setUserRole(null);
            }
            setCurrentUser(user);
            setLoading(false);
        });
        return unsubscribe;
    }, []);

    const loginWithGoogle = () => signInWithPopup(auth, googleProvider);
    const loginWithEmail = (email, password) => signInWithEmailAndPassword(auth, email, password);

    const loginDemo = async () => {
        try {
            await signInWithEmailAndPassword(auth, "demo@lumina.com", "password123");
        } catch (e) {
            if (e.code === 'auth/user-not-found' || e.code === 'auth/invalid-credential') {
                const { createUserWithEmailAndPassword } = await import('firebase/auth');
                await createUserWithEmailAndPassword(auth, "demo@lumina.com", "password123");
            } else {
                throw e;
            }
        }
    };

    const logout = () => firebaseSignOut(auth);
    const isAdmin = userRole === 'admin';
    const isManager = userRole === 'manager' || userRole === 'admin';

    const value = { currentUser, userRole, isAdmin, isManager, loginWithGoogle, loginWithEmail, loginDemo, logout };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
};
