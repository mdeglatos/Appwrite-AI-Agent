
import React, { useState } from 'react';
import type { Models } from 'appwrite';
import { RiRobot2Line } from 'react-icons/ri';
import { login, createAccount, getAccount } from '../services/authService';
import { LoadingSpinnerIcon } from './Icons';
import type { UserPrefs } from '../types';

interface LoginPageProps {
  onLoginSuccess: (user: Models.User<UserPrefs>) => void;
}

const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess }) => {
  const [isLoginView, setIsLoginView] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      if (isLoginView) {
        await login(email, password);
      } else {
        if (!name.trim()) {
          throw new Error('Name is a required field for signing up.');
        }
        await createAccount(email, password, name);
      }

      const user = await getAccount();
      if (user) {
        onLoginSuccess(user);
      } else {
        throw new Error('Authentication failed. Please check your credentials or try again.');
      }
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('An unknown error occurred.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative flex items-center justify-center h-screen bg-gray-950 text-gray-100 font-sans overflow-hidden">
      {/* Background Ambience */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-cyan-900/20 rounded-full blur-[120px]"></div>
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-purple-900/20 rounded-full blur-[120px]"></div>

      <div className="relative w-full max-w-sm p-8 space-y-8 bg-gray-900/60 backdrop-blur-xl rounded-3xl shadow-2xl border border-gray-800/50 animate-fade-in z-10">
        <div className="text-center space-y-2">
          <div className="flex justify-center items-center mb-6">
            <div className="relative group">
                <div className="absolute -inset-1 bg-gradient-to-r from-cyan-600 to-purple-600 rounded-full blur opacity-75 group-hover:opacity-100 transition duration-200"></div>
                <span className="relative p-4 bg-gray-900 rounded-full text-cyan-400 flex items-center justify-center">
                    <RiRobot2Line size={32} />
                </span>
            </div>
          </div>
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">DV Backend Studio</h1>
          <h2 className="text-lg font-medium text-gray-300">{isLoginView ? 'Welcome Back' : 'Create Account'}</h2>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {!isLoginView && (
            <div className="group">
              <label htmlFor="name" className="sr-only">Name</label>
              <input
                id="name"
                name="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your Name"
                required
                className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 text-gray-100 placeholder-gray-500 transition-all"
              />
            </div>
          )}
          <div>
            <label htmlFor="email" className="sr-only">Email address</label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email address"
              required
               className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 text-gray-100 placeholder-gray-500 transition-all"
            />
          </div>
          <div>
            <label htmlFor="password" className="sr-only">Password</label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete={isLoginView ? 'current-password' : 'new-password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              required
               className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 text-gray-100 placeholder-gray-500 transition-all"
            />
          </div>

          {error && (
              <div className="text-sm text-center text-red-200 bg-red-900/20 border border-red-900/30 p-3 rounded-lg animate-fade-in">
                  {error}
              </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full flex items-center justify-center py-3.5 px-4 bg-gradient-to-r from-cyan-600 to-cyan-700 hover:from-cyan-500 hover:to-cyan-600 rounded-xl font-semibold text-white shadow-lg shadow-cyan-900/30 transition-all transform hover:scale-[1.02] disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none"
          >
            {isLoading ? <LoadingSpinnerIcon /> : (isLoginView ? 'Sign In' : 'Create Account')}
          </button>
        </form>

        <div className="text-sm text-center">
          <span className="text-gray-500">{isLoginView ? "New here?" : 'Have an account?'}</span>
          <button
            onClick={() => {
              setIsLoginView(!isLoginView);
              setError(null);
              setPassword('');
            }}
            className="font-medium text-cyan-400 hover:text-cyan-300 ml-2 transition-colors"
            type="button"
          >
            {isLoginView ? 'Create an account' : 'Sign In'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
