import { ID, type Models } from 'appwrite';
import { account } from './appwrite';
import type { UserPrefs } from '../types';

export async function login(email: string, password: string) {
    return await account.createEmailPasswordSession(email, password);
}

export async function createAccount(email: string, password: string, name: string) {
    await account.create(ID.unique(), email, password, name);
    // After creating the account, automatically log the user in
    return await login(email, password);
}

export async function getAccount(): Promise<Models.User<UserPrefs> | null> {
    try {
        return await account.get<UserPrefs>();
    } catch (error) {
        // This is an expected error when the user is not logged in.
        // console.warn('No active Appwrite session');
        return null;
    }
}

export async function logout() {
    try {
        await account.deleteSession('current');
    } catch (error) {
        console.error('Failed to logout', error);
    }
}

export async function updateGeminiPrefs(prefs: { apiKey?: string | null; model?: string | null; thinking?: boolean | null }): Promise<void> {
    const user = await account.get<UserPrefs>();
    const currentPrefs = user.prefs || {};
    
    const newPrefs = { ...currentPrefs };

    if (prefs.apiKey !== undefined) {
        newPrefs.geminiApiKey = prefs.apiKey;
    }
    if (prefs.model !== undefined) {
        newPrefs.geminiModel = prefs.model;
    }
    if (prefs.thinking !== undefined) {
        newPrefs.geminiThinking = prefs.thinking;
    }

    await account.updatePrefs(newPrefs);
}