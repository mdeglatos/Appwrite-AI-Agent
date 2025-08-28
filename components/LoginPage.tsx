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
    <div className="flex items-center justify-center h-screen bg-gray-900 text-gray-100 font-sans">
      <div className="w-full max-w-sm p-8 space-y-6 bg-gray-800 rounded-2xl shadow-2xl border border-gray-700">
        <div className="text-center">
          <div className="flex justify-center items-center gap-3 mb-4">
            <span className="p-3 bg-cyan-900/50 rounded-full text-cyan-400">
              <RiRobot2Line size={28} />
            </span>
            <h1 className="text-3xl font-bold text-cyan-400">Appwrite AI Agent</h1>
          </div>
          <h2 className="text-2xl font-semibold">{isLoginView ? 'Login to Your Account' : 'Create a New Account'}</h2>
          <p className="text-gray-400 mt-1">to manage your Appwrite projects</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLoginView && (
            <div>
              <label htmlFor="name" className="sr-only">Name</label>
              <input
                id="name"
                name="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your Name"
                required
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500 text-gray-100 placeholder-gray-400"
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
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500 text-gray-100 placeholder-gray-400"
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
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500 text-gray-100 placeholder-gray-400"
            />
          </div>

          {error && <p className="text-sm text-center text-red-400 bg-red-900/30 p-2 rounded-md">{error}</p>}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full flex items-center justify-center py-2.5 px-4 bg-cyan-600 hover:bg-cyan-700 rounded-md font-semibold transition-colors disabled:bg-gray-600 disabled:cursor-not-allowed"
          >
            {isLoading ? <LoadingSpinnerIcon /> : (isLoginView ? 'Login' : 'Sign Up')}
          </button>
        </form>

        <p className="text-sm text-center text-gray-400">
          {isLoginView ? "Don't have an account?" : 'Already have an account?'}
          <button
            onClick={() => {
              setIsLoginView(!isLoginView);
              setError(null);
              setPassword('');
            }}
            className="font-medium text-cyan-400 hover:underline ml-2"
            type="button"
          >
            {isLoginView ? 'Sign Up' : 'Login'}
          </button>
        </p>
      </div>
    </div>
  );
};

export default LoginPage;