
import { useState, useCallback, useEffect } from 'react';
import type { Models } from 'appwrite';
import type { UserPrefs } from '../types';
import { getAccount, logout } from '../services/authService';

export function useAuth() {
    const [currentUser, setCurrentUser] = useState<Models.User<UserPrefs> | null>(null);
    // Initialize as true to block UI only on first render
    const [isInitialLoading, setIsInitialLoading] = useState(true);

    const refreshUser = useCallback(async () => {
        try {
            const user = await getAccount();
            setCurrentUser(user);
        } catch (e) {
            setCurrentUser(null);
        } finally {
            // We only turn off the initial loading flag once. 
            // Future calls to refreshUser won't trigger the global loading spinner.
            setIsInitialLoading(false);
        }
    }, []);

    useEffect(() => {
        refreshUser();
    }, [refreshUser]);

    const handleLogout = async () => {
        await logout();
        setCurrentUser(null);
    };

    return {
        currentUser,
        setCurrentUser,
        isAuthLoading: isInitialLoading, // Renamed to clarify intent in App.tsx
        refreshUser,
        handleLogout,
    };
}
