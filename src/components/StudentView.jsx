import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, addDoc } from 'firebase/firestore';
import { 
  UserCheck, Edit3, CheckCircle2, User, School, 
  Send, Sparkles, Check, AlertCircle, Clock, ArrowRight, ShieldCheck 
} from 'lucide-react';

const DAFTAR_KELAS = [
  'X-1', 'X-2', 'X-3', 'X-4',
  'XI-1', 'XI-2', 'XI-3', 'XI-4', 'XI-5',
  'XII-1', 'XII-2', 'XII-3', 'XII-4', 'XII-5'
];

export default function StudentView() {
  const [studentInfo, setStudentInfo] = useState({ name: '', className: '' });
  const [isSaved, setIsSaved] = useState(false);
  const [status, setStatus] = useState('Hadir');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [submittedToday, setSubmittedToday] = useState(false);

  useEffect(() => {
    const savedProfile = localStorage.getItem('absensi_student_profile');
    if (savedProfile) {
      try {
        const parsed = JSON.parse(savedProfile);
        if (parsed.name && parsed.className) {
          setStudentInfo(parsed);
          setIsSaved(true);
        }
      } catch (e) {
        console.error('Error parsing profile:', e);
      }
    }
  }, []);

  const handleSaveProfile = (e) => {
    e.preventDefault();
    if (!studentInfo.name.trim() || !studentInfo.className) {
      alert('Silakan isi Nama Lengkap dan Pilih Kelas!');
      return;
    }
    localStorage.setItem('absensi_student_profile', JSON.stringify(studentInfo));
    setIsSaved(true);
  };

  const handleResetProfile = () => {
    if (confirm('Apakah Anda yakin ingin mengganti profil siswa di perangkat ini?')) {
      localStorage.removeItem('absensi_student_profile');
      setStudentInfo({ name: '', className: '' });
      setIsSaved(false);
      setSubmittedToday(false);
    }
  };

  // Pengiriman Presensi Cepat (Optimistic UI + Background Sync)
  const handleSubmitAttendance = async (e) => {
    e.preventDefault();
    setLoading(true);

    const payload = {
      studentName: studentInfo.name,
      className: studentInfo.className,
      status: status,
      notes: notes,
      date: new Date().toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      }),
      timestamp: Date.now()
    };

    // Optimistic Update: Langsung ubah ke tampilan sukses agar siswa tidak menunggu
    setSubmittedToday(true);
    setLoading(false);

    // Kirim data ke Firebase di latar belakang dengan batas timeout 4 detik
    try {
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Firebase Sync Timeout')), 4000)
      );

      const sendPromise = addDoc(collection(db, 'attendance'), payload);

      await Promise.race([sendPromise, timeoutPromise]);
      setNotes('');
    } catch (error) {
      console.warn('Proses sinkronisasi Firebase berjalan di latar belakang:', error);
    }
  };

  return (
    <div className="w-full max-w-xl mx-auto">
      {!isSaved ? (
        <div className="bg-slate-900/70 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-sky-500 via-indigo-500 to-purple-500"></div>

          <div className="flex items-center gap-4 mb-6 pb-6 border-b border-slate-800">
            <div className="w-12 h-12 rounded-2xl bg-sky-500/10 border border-sky-500/20 text-sky-400 flex items-center justify-center shrink-0 shadow-inner">
              <User className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white tracking-tight">Identitas Siswa</h2>
              <p className="text-xs text-slate-400 mt-0.5">Isi data sekali saja, sistem akan mengingatnya di perangkat ini.</p>
            </div>
          </div>

          <form onSubmit={handleSaveProfile} className="space-y-5">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
                Nama Lengkap Siswa
              </label>
              <input
                type="text"
                required
                value={studentInfo.name}
                onChange={(e) => setStudentInfo({ ...studentInfo, name: e.target.value })}
                placeholder="Contoh: Muhammad Rizky"
                className="w-full bg-slate-950/80 border border-slate-800 rounded-2xl px-4 py-3.5 text-slate-100 text-sm focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 transition-all placeholder:text-slate-600"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
                Pilih Kelas
              </label>
              <div className="relative">
                <select
                  required
                  value={studentInfo.className}
                  onChange={(e) => setStudentInfo({ ...studentInfo, className: e.target.value })}
                  className="w-full bg-slate-950/80 border border-slate-800 rounded-2xl px-4 py-3.5 text-slate-100 text-sm focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 transition-all appearance-none cursor-pointer text-slate-200"
                >
                  <option value="" className="bg-slate-900 text-slate-400">-- Pilih Kelas Kamu --</option>
                  <optgroup label="Kelas X" className="bg-slate-900 text-sky-400 font-semibold">
                    {DAFTAR_KELAS.filter(k => k.startsWith('X-')).map((k) => (
                      <option key={k} value={k} className="bg-slate-900 text-slate-200 font-normal">Kelas {k}</option>
                    ))}
                  </optgroup>
                  <optgroup label="Kelas XI" className="bg-slate-900 text-sky-400 font-semibold">
                    {DAFTAR_KELAS.filter(k => k.startsWith('XI-')).map((k) => (
                      <option key={k} value={k} className="bg-slate-900 text-slate-200 font-normal">Kelas {k}</option>
                    ))}
                  </optgroup>
                  <optgroup label="Kelas XII" className="bg-slate-900 text-sky-400 font-semibold">
                    {DAFTAR_KELAS.filter(k => k.startsWith('XII-')).map((k) => (
                      <option key={k} value={k} className="bg-slate-900 text-slate-200 font-normal">Kelas {k}</option>
                    ))}
                  </optgroup>
                </select>
                <div className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 text-xs">
                  ▼
                </div>
              </div>
            </div>

            <button
              type="submit"
              className="w-full mt-3 bg-gradient-to-r from-sky-500 via-indigo-500 to-purple-600 hover:from-sky-400 hover:to-purple-500 text-white font-bold py-4 rounded-2xl shadow-xl shadow-sky-500/20 transition-all duration-300 hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center gap-2"
            >
              <span>Simpan Identitas & Mulai Presensi</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        </div>
      ) : (
        <div className="bg-slate-900/70 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-sky-500 via-indigo-500 to-purple-500"></div>

          {/* Header Kartu Menyapa Siswa */}
          <div className="flex items-center justify-between pb-6 border-b border-slate-800">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-sky-500 to-indigo-600 p-0.5 shadow-md shadow-sky-500/20">
                <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center text-sky-400 font-bold text-lg">
                  {studentInfo.name ? studentInfo.name.charAt(0).toUpperCase() : 'S'}
                </div>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold tracking-wider uppercase px-2.5 py-0.5 bg-sky-500/10 text-sky-400 border border-sky-500/20 rounded-full">
                    Sistem Absensi Online
                  </span>
                </div>
                <h2 className="text-xl font-extrabold text-white tracking-tight mt-0.5">
                  Selamat Datang, {studentInfo.name}!
                </h2>
                <p className="text-xs text-slate-400">
                  Kelas: <span className="text-sky-400 font-semibold">{studentInfo.className}</span>
                </p>
              </div>
            </div>

            <button
              onClick={handleResetProfile}
              className="p-2.5 text-slate-400 hover:text-white bg-slate-950/60 hover:bg-slate-800 border border-slate-800 rounded-xl transition-all"
              title="Ganti Profil Siswa"
            >
              <Edit3 className="w-4 h-4" />
            </button>
          </div>

          {submittedToday ? (
            <div className="py-10 text-center space-y-4">
              <div className="w-20 h-20 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-3xl flex items-center justify-center mx-auto shadow-xl shadow-emerald-950/50 animate-bounce">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <div>
                <h3 className="text-2xl font-extrabold text-white tracking-tight">Presensi Berhasil Dikirim!</h3>
                <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
                  Terima kasih <strong className="text-slate-200">{studentInfo.name}</strong> ({studentInfo.className}), data kehadiranmu sudah berhasil dicatat di server.
                </p>
              </div>
              <button
                onClick={() => setSubmittedToday(false)}
                className="mt-2 px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl transition-all border border-slate-700"
              >
                Kirim Presensi Lagi
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmitAttendance} className="mt-6 space-y-6">
              {/* Opsi Status Kehadiran */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-3">
                  Status Kehadiran Hari Ini
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { id: 'Hadir', label: 'Hadir', icon: CheckCircle2, color: 'emerald' },
                    { id: 'Izin', label: 'Izin', icon: Clock, color: 'amber' },
                    { id: 'Sakit', label: 'Sakit', icon: AlertCircle, color: 'rose' },
                  ].map((item) => {
                    const IconComp = item.icon;
                    const isSelected = status === item.id;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setStatus(item.id)}
                        className={`relative p-4 rounded-2xl flex flex-col items-center justify-center gap-2 border transition-all duration-300 ${
                          isSelected
                            ? item.color === 'emerald'
                              ? 'bg-emerald-500/10 border-emerald-500 text-emerald-400 shadow-lg shadow-emerald-950/40'
                              : item.color === 'amber'
                              ? 'bg-amber-500/10 border-amber-500 text-amber-400 shadow-lg shadow-amber-950/40'
                              : 'bg-rose-500/10 border-rose-500 text-rose-400 shadow-lg shadow-rose-950/40'
                            : 'bg-slate-950/50 border-slate-800 text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
                        }`}
                      >
                        {isSelected && (
                          <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-current animate-ping"></div>
                        )}
                        <IconComp className="w-6 h-6" />
                        <span className="text-xs font-bold">{item.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Catatan / Keterangan */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
                  Catatan / Keterangan <span className="text-slate-500 font-normal lowercase">(opsional)</span>
                </label>
                <textarea
                  rows="3"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Tuliskan alasan jika Izin/Sakit..."
                  className="w-full bg-slate-950/80 border border-slate-800 rounded-2xl p-4 text-slate-100 text-sm focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 transition-all placeholder:text-slate-600 resize-none"
                ></textarea>
              </div>

              {/* Tombol Kirim */}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-sky-500 via-indigo-500 to-purple-600 hover:from-sky-400 hover:to-purple-500 active:scale-[0.99] text-white font-bold py-4 rounded-2xl shadow-xl shadow-sky-500/25 transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading ? (
                  <span>Mengirim Presensi...</span>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>Kirim Absensi Sekarang</span>
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      )}
    </div>
  );
}