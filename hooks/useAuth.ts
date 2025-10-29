import { useState, useCallback, useEffect } from 'react';
import type { Models } from 'appwrite';
import type { UserPrefs } from '../types';
import { getAccount, logout } from '../services/authService';

export function useAuth() {
    const [currentUser, setCurrentUser] = useState<Models.User<UserPrefs> | null>(null);
    const [isAuthLoading, setIsAuthLoading] = useState(true);

    const refreshUser = useCallback(async () => {
        setIsAuthLoading(true);
        try {
            const user = await getAccount();
            setCurrentUser(user);
        } catch (e) {
            setCurrentUser(null);
        } finally {
            setIsAuthLoading(false);
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
        isAuthLoading,
        refreshUser,
        handleLogout,
    };
}
