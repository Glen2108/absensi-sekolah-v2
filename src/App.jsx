import React, { useState, useEffect } from 'react';
import StudentView from './components/StudentView';
import TeacherDashboard from './components/TeacherDashboard';
import { GraduationCap, ShieldCheck, Clock, User, LogOut, Sparkles } from 'lucide-react';

export default function App() {
  const [view, setView] = useState('student'); // 'student' atau 'teacher'
  const [time, setTime] = useState(new Date());

  // Jam Digital Realtime
  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const formattedTime = time.toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col relative overflow-hidden font-sans selection:bg-sky-500 selection:text-white">
      
      {/* Dynamic Background Mesh Glowing Blobs */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-sky-600/20 rounded-full blur-[120px] pointer-events-none animate-pulse"></div>
      <div className="absolute bottom-10 right-1/4 w-[400px] h-[400px] bg-indigo-600/20 rounded-full blur-[100px] pointer-events-none"></div>
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-600/10 rounded-full blur-[140px] pointer-events-none"></div>

      {/* Header Navigation Glassmorphism */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-slate-900/60 border-b border-slate-800/80">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-20 flex items-center justify-between">
          
          {/* Logo & Info Sekolah */}
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-sky-500 via-indigo-500 to-purple-500 p-0.5 shadow-lg shadow-sky-500/20">
              <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
                <GraduationCap className="w-6 h-6 text-sky-400" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
                  Absensi Digital
                </h1>
                <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 bg-sky-500/10 text-sky-400 border border-sky-500/20 rounded-full">
                  <Sparkles className="w-2.5 h-2.5" /> Live
                </span>
              </div>
              <p className="text-xs text-slate-400 font-medium">SMA Negeri 1 Indonesia</p>
            </div>
          </div>

          {/* Jam Realtime & Navigasi Portal */}
          <div className="flex items-center gap-3 sm:gap-4">
            {/* Jam Digital */}
            <div className="hidden md:flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-900/80 border border-slate-800 text-xs font-mono text-slate-300 shadow-inner">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <Clock className="w-3.5 h-3.5 text-sky-400" />
              <span className="font-semibold">{formattedTime}</span>
              <span className="text-slate-500 text-[10px]">WITA</span>
            </div>

            {/* Tombol Switch Portal Guru / Siswa */}
            <button
              onClick={() => setView(view === 'student' ? 'teacher' : 'student')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all duration-300 shadow-lg ${
                view === 'student'
                  ? 'bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white shadow-sky-500/25 hover:shadow-sky-500/40 hover:-translate-y-0.5'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
              }`}
            >
              {view === 'student' ? (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  <span>Portal Guru</span>
                </>
              ) : (
                <>
                  <User className="w-4 h-4" />
                  <span>Halaman Siswa</span>
                </>
              )}
            </button>
          </div>

        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-6xl w-full mx-auto p-4 sm:p-6 lg:p-8 flex items-center justify-center relative z-10">
        {view === 'student' ? <StudentView /> : <TeacherDashboard />}
      </main>

      {/* Footer Modern */}
      <footer className="border-t border-slate-800/80 bg-slate-950/80 backdrop-blur-md relative z-10 py-6 text-xs text-slate-500">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>© 2026 Sistem Absensi Sekolah Digital. Hak Cipta Dilindungi.</p>
          <div className="flex items-center gap-4 text-slate-400">
            <span className="px-2 py-0.5 bg-slate-900 border border-slate-800 rounded-md font-mono text-[10px]">v2.0 PWA Pro</span>
            <a href="#" className="hover:text-sky-400 transition-colors">Bantuan</a>
            <a href="#" className="hover:text-sky-400 transition-colors">Privasi</a>
          </div>
        </div>
      </footer>

    </div>
  );
}