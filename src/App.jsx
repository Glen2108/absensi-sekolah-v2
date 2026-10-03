import React, { useState, useEffect } from 'react';
import StudentView from './components/StudentView';
import TeacherDashboard from './components/TeacherDashboard';
import { GraduationCap, ShieldCheck, Clock, User, Sparkles, BookOpen } from 'lucide-react';

export default function App() {
  const [view, setView] = useState('student'); // 'student' atau 'teacher'
  const [time, setTime] = useState(new Date());

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
      
      {/* Background Ambient Glowing Blobs */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-sky-600/15 rounded-full blur-[120px] pointer-events-none animate-pulse"></div>
      <div className="absolute bottom-10 right-1/4 w-[400px] h-[400px] bg-indigo-600/15 rounded-full blur-[100px] pointer-events-none"></div>

      {/* Header Utama */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-slate-900/80 border-b border-slate-800">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex flex-col md:flex-row items-center justify-between gap-4">
          
          {/* Info Sekolah & Mata Pelajaran */}
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-sky-500 via-indigo-500 to-purple-500 p-0.5 shadow-lg shadow-sky-500/20 shrink-0">
              <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
                <GraduationCap className="w-6 h-6 text-sky-400" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-extrabold text-base sm:text-lg tracking-tight bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
                  ABSENSI DIGITAL INFORMATIKA
                </h1>
                <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 bg-sky-500/10 text-sky-400 border border-sky-500/20 rounded-full">
                  <Sparkles className="w-2.5 h-2.5" /> 2026/2027
                </span>
              </div>
              <p className="text-xs text-sky-400 font-semibold">SMA NEGERI 4 MANADO</p>
              <p className="text-[11px] text-slate-400 flex items-center gap-2 mt-0.5">
                <span>Guru: <strong className="text-slate-200">Glendy A. Taawoeda, S.Pd</strong></span>
                <span>•</span>
                <span className="text-purple-400 font-medium">Kurikulum Pembelajaran Mendalam</span>
              </p>
            </div>
          </div>

          {/* Navigasi Switch & Jam Realtime */}
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono text-slate-300">
              <Clock className="w-3.5 h-3.5 text-sky-400" />
              <span>{formattedTime} WITA</span>
            </div>

            <button
              onClick={() => setView(view === 'student' ? 'teacher' : 'student')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all shadow-lg ${
                view === 'student'
                  ? 'bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white shadow-sky-500/20'
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

      {/* Konten Halaman */}
      <main className="flex-1 max-w-6xl w-full mx-auto p-4 sm:p-6 lg:p-8 flex items-center justify-center relative z-10">
        {view === 'student' ? <StudentView /> : <TeacherDashboard />}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800 bg-slate-950/80 backdrop-blur-md relative z-10 py-5 text-xs text-slate-500">
        <div className="max-w-6xl mx-auto px-4 text-center sm:flex sm:justify-between sm:text-left">
          <p>© 2026 Informatika SMA Negeri 4 Manado — Guru Pengampu: Glendy A. Taawoeda, S.Pd</p>
          <p className="mt-2 sm:mt-0 text-slate-400">Tahun Ajaran 2026/2027</p>
        </div>
      </footer>

    </div>
  );
}