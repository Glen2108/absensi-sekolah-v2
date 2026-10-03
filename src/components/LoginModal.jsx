import React, { useState } from 'react';
import { Lock, User, X } from 'lucide-react';

export default function LoginModal({ isOpen, onClose, onLogin }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (username === 'guru' && password === 'guru123') {
      onLogin('guru');
      setError('');
      onClose();
    } else {
      setError('Username/password salah! (Gunakan: guru / guru123)');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-xl overflow-hidden border border-slate-100 animate-in fade-in zoom-in-95 duration-200">
        <div className="p-6 bg-slate-900 text-white flex justify-between items-center">
          <div>
            <h3 className="font-bold text-lg">Login Portal Guru</h3>
            <p className="text-xs text-slate-400">Otentikasi khusus Wali Kelas & Pengajar</p>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-600 text-xs rounded-lg">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Username</label>
            <div className="relative">
              <User className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Masukkan username"
                className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-sky-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-sky-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              className="w-full py-2.5 bg-sky-500 hover:bg-sky-600 text-white rounded-lg font-medium text-sm transition-colors shadow-sm"
            >
              Masuk Dashboard
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}