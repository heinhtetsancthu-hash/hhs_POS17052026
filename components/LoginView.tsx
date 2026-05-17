import React, { useState } from 'react';
import { ArrowLeft, Lock, User } from 'lucide-react';

interface LoginViewProps {
  onBack: () => void;
  onLoginSuccess: () => void;
  title: string;
  subtitle: string;
}

export const LoginView: React.FC<LoginViewProps> = ({ onBack, onLoginSuccess, title, subtitle }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (username === 'admin' && password === '1471656') {
      onLoginSuccess();
    } else {
      setError('Invalid username or password');
    }
  };

  return (
    <div className="w-full max-w-md animate-slide-up">
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-slate-500 hover:text-slate-900 mb-8 group transition-colors"
      >
        <div className="p-2 rounded-full bg-slate-200 group-hover:bg-slate-300 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </div>
        <span className="font-medium">Back to Home</span>
      </button>

      <div className="glass-panel rounded-3xl p-8 md:p-12 border-white/60 shadow-2xl relative overflow-hidden">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-display font-bold text-slate-900">{title}</h2>
          <div className="mt-2 inline-block px-4 py-1 rounded-full bg-indigo-50 border border-indigo-100">
            <p className="text-indigo-600 font-bold tracking-widest text-xs uppercase">{subtitle}</p>
          </div>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wide ml-1">Username</label>
            <div className="relative group">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full bg-white/60 border border-slate-200 rounded-xl py-4 pl-12 pr-4 text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all placeholder-slate-400 font-medium"
                placeholder="Enter username"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wide ml-1">Password</label>
            <div className="relative group">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-white/60 border border-slate-200 rounded-xl py-4 pl-12 pr-4 text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all placeholder-slate-400 font-medium"
                placeholder="Enter password"
              />
            </div>
          </div>

          {error && (
            <div className="flex items-center justify-center gap-2 text-red-500 text-sm bg-red-50 py-3 rounded-xl border border-red-100 font-medium animate-fade-in">
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            className="w-full py-4 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-lg hover:shadow-indigo-500/30 transform hover:-translate-y-1 mt-4"
          >
            Login Securely
          </button>
        </form>
      </div>
    </div>
  );
};
