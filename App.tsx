
import React, { useState } from 'react';
import LoginPage from './components/LoginPage';
import { AgentApp } from './components/AgentApp';
import { LandingPage } from './components/LandingPage';
import { LoadingSpinnerIcon } from './components/Icons';
import { useAuth } from './hooks/useAuth';

const App: React.FC = () => {
    // isAuthLoading is now only true during the very first session check
    const { currentUser, setCurrentUser, isAuthLoading, handleLogout, refreshUser } = useAuth();
    const [showLanding, setShowLanding] = useState(true);

    if (isAuthLoading) {
        return (
            <div className="flex items-center justify-center h-screen bg-gray-950 text-gray-100 font-sans">
                <div className="flex flex-col items-center gap-4 animate-fade-in">
                    <LoadingSpinnerIcon />
                    <p className="text-gray-400 text-sm tracking-wider uppercase">Initializing Studio...</p>
                </div>
            </div>
        );
    }

    if (currentUser) {
        return <AgentApp currentUser={currentUser} onLogout={handleLogout} refreshUser={refreshUser} />;
    }

    if (showLanding) {
        return <LandingPage onGetStarted={() => setShowLanding(false)} />;
    }

    return <LoginPage onLoginSuccess={setCurrentUser} />;
};

export default App;
