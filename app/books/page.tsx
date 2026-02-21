'use client';

import { useState, useEffect, FormEvent } from 'react';
import { motion } from 'framer-motion';
import { BookOpen, Eye, EyeOff } from 'lucide-react';
import BooksDashboard from '@/components/books/BooksDashboard';

// Simple credential check — no Firebase needed
const VALID_USERS = [
  { username: 'sumi', password: 'akku@gramakam' },
  { username: 'pandaboy', password: 'Panda@admin' },
];

export default function BooksPage() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  // Restore login state from sessionStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined' && sessionStorage.getItem('gramakam_books_auth') === 'true') {
      setIsLoggedIn(true); // eslint-disable-line react-hooks/set-state-in-effect
    }
  }, []);

  const handleLogin = (e: FormEvent) => {
    e.preventDefault();
    const found = VALID_USERS.find(
      (u) => u.username === username.toLowerCase().trim() && u.password === password
    );
    if (found) {
      setIsLoggedIn(true);
      sessionStorage.setItem('gramakam_books_auth', 'true');
      setError('');
    } else {
      setError('Invalid username or password.');
    }
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setUsername('');
    setPassword('');
    sessionStorage.removeItem('gramakam_books_auth');
  };

  if (isLoggedIn) {
    return <BooksDashboard onLogout={handleLogout} />;
  }

  return (
    <div className="min-h-screen bg-charcoal flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md"
      >
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-full bg-maroon/10 flex items-center justify-center mx-auto mb-4">
            <BookOpen size={28} className="text-maroon" />
          </div>
          <h1 className="text-2xl font-bold text-charcoal" style={{ fontFamily: 'var(--font-heading)' }}>
            Book Festival Manager
          </h1>
          <p className="text-gray-500 text-sm mt-2">Gramakam 2026 — Inventory &amp; Billing</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-maroon focus:border-transparent outline-none"
              placeholder="Enter username"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-maroon focus:border-transparent outline-none pr-12"
                placeholder="Enter password"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {error && (
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-red-500 text-sm text-center">
              {error}
            </motion.p>
          )}

          <button type="submit" className="w-full btn-primary rounded-xl py-3.5 text-base">
            Login
          </button>
        </form>
      </motion.div>
    </div>
  );
}
