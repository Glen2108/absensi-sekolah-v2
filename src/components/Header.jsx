import React, { useState, useEffect } from 'react';
import { School, Clock, UserCheck, LogOut } from 'lucide-react';

export default function Header({ userRole, onLogout, onOpenLogin }) {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <header className="bg-slate-900 text-white shadow-md sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-sky-500 rounded-lg">
            <School className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-base sm:text-lg leading-tight">Absensi Digital</h1>
            <p className="text-xs text-slate-400 hidden sm:block">SMA Negeri 1 Indonesia</p>
          </div>
        </div>

        <div className="flex items-center gap-4 text-xs sm:text-sm">
          <div className="hidden md:flex items-center gap-2 bg-slate-800/80 px-3 py-1.5 rounded-full border border-slate-700">
            <Clock className="w-4 h-4 text-sky-400" />
            <span className="font-mono">{time.toLocaleTimeString('id-ID')} WITA</span>
          </div>

          {userRole === 'guru' ? (
            <div className="flex items-center gap-2">
              <span className="bg-sky-500/20 text-sky-300 border border-sky-500/30 px-2.5 py-1 rounded-md text-xs font-medium">
                Akses Guru
              </span>
              <button 
                onClick={onLogout}
                className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 px-3 py-1.5 rounded-md transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Keluar</span>
              </button>
            </div>
          ) : (
            <button
              onClick={onOpenLogin}
              className="flex items-center gap-1.5 bg-sky-500 hover:bg-sky-600 text-white px-3.5 py-1.5 rounded-lg font-medium transition-colors shadow-sm"
            >
              <UserCheck className="w-4 h-4" />
              <span>Portal Guru</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
}