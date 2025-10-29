import React from 'react';
import LoginPage from './components/LoginPage';
import { AgentApp } from './components/AgentApp';
import { LoadingSpinnerIcon } from './components/Icons';
import { useAuth } from './hooks/useAuth';

const App: React.FC = () => {
    const { currentUser, setCurrentUser, isAuthLoading, handleLogout, refreshUser } = useAuth();

    if (isAuthLoading) {
        return (
            <div className="flex items-center justify-center h-screen bg-gray-900 text-gray-100">
                <LoadingSpinnerIcon />
                <p className="ml-4">Checking session...</p>
            </div>
        );
    }

    if (!currentUser) {
        return <LoginPage onLoginSuccess={setCurrentUser} />;
    }
    
    return <AgentApp currentUser={currentUser} onLogout={handleLogout} refreshUser={refreshUser} />;
};

export default App;
