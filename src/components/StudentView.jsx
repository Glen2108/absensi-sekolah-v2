import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, addDoc, doc, onSnapshot } from 'firebase/firestore';
import { 
  UserCheck, Edit3, CheckCircle2, User, Send, 
  AlertCircle, Clock, ArrowRight, Lock, Radio, CalendarDays, Sparkles
} from 'lucide-react';
import { JADWAL_GURU } from '../data/schedule';

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
  
  const [sessionData, setSessionData] = useState({ isOpen: false, targetClass: 'SEMUA', sessionTitle: '' });

  useEffect(() => {
    const unsubscribe = onSnapshot(doc(db, 'settings', 'active_session'), (docSnap) => {
      if (docSnap.exists()) {
        setSessionData(docSnap.data());
      } else {
        setSessionData({ isOpen: false, targetClass: 'SEMUA', sessionTitle: '' });
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const savedProfile = localStorage.getItem('absensi_student_profile');
    if (savedProfile) {
      try {
        const parsed = JSON.parse(savedProfile);
        if (parsed.name && parsed.className) {
          setStudentInfo(parsed);
          setIsSaved(true);

          const todayKey = `absen_done_${parsed.name}_${parsed.className}_${new Date().toLocaleDateString('id-ID')}`;
          if (localStorage.getItem(todayKey)) {
            setSubmittedToday(true);
          }
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

    const todayKey = `absen_done_${studentInfo.name}_${studentInfo.className}_${new Date().toLocaleDateString('id-ID')}`;
    if (localStorage.getItem(todayKey)) {
      setSubmittedToday(true);
    }
  };

  const handleResetProfile = () => {
    if (confirm('Apakah Anda yakin ingin mengganti identitas siswa di perangkat ini?')) {
      localStorage.removeItem('absensi_student_profile');
      setStudentInfo({ name: '', className: '' });
      setIsSaved(false);
      setSubmittedToday(false);
    }
  };

  const handleSubmitAttendance = async (e) => {
    e.preventDefault();
    setLoading(true);

    const todayDate = new Date().toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });

    const payload = {
      studentName: studentInfo.name,
      className: studentInfo.className,
      status: status,
      notes: notes,
      subject: 'Informatika',
      teacher: 'Glendy A. Taawoeda, S.Pd',
      date: todayDate,
      timestamp: Date.now()
    };

    const todayKey = `absen_done_${studentInfo.name}_${studentInfo.className}_${new Date().toLocaleDateString('id-ID')}`;
    localStorage.setItem(todayKey, 'true');

    setSubmittedToday(true);
    setLoading(false);

    try {
      await addDoc(collection(db, 'attendance'), payload);
      setNotes('');
    } catch (error) {
      console.warn('Sync Firestore background:', error);
    }
  };

  const isClassEligible = sessionData.targetClass === 'SEMUA' || sessionData.targetClass === studentInfo.className;
  const classSchedule = JADWAL_GURU.find(j => j.className === studentInfo.className);

  return (
    <div className="w-full max-w-xl mx-auto space-y-4">
      
      {!isSaved ? (
        <div className="bg-slate-900/90 border border-amber-500/30 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-sky-400 via-amber-400 to-indigo-500"></div>

          <div className="flex items-center gap-4 mb-6 pb-6 border-b border-slate-800">
            <div className="w-12 h-12 rounded-2xl bg-amber-400/10 border border-amber-400/30 text-amber-300 flex items-center justify-center shrink-0">
              <User className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Identitas Siswa Digital</h2>
              <p className="text-xs text-sky-200/80 mt-0.5">SMA Negeri 4 Manado — Informatika</p>
            </div>
          </div>

          <form onSubmit={handleSaveProfile} className="space-y-5">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-amber-300/90 mb-2">
                Nama Lengkap Siswa
              </label>
              <input
                type="text"
                required
                value={studentInfo.name}
                onChange={(e) => setStudentInfo({ ...studentInfo, name: e.target.value })}
                placeholder="Contoh: Hizkia Wenas"
                className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-3.5 text-slate-100 text-sm focus:outline-none focus:border-sky-400"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-amber-300/90 mb-2">
                Pilih Kelas
              </label>
              <select
                required
                value={studentInfo.className}
                onChange={(e) => setStudentInfo({ ...studentInfo, className: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-3.5 text-slate-100 text-sm focus:outline-none focus:border-sky-400 cursor-pointer"
              >
                <option value="">-- Pilih Kelas --</option>
                <optgroup label="Kelas X">
                  {DAFTAR_KELAS.filter(k => k.startsWith('X-')).map((k) => (
                    <option key={k} value={k}>Kelas {k}</option>
                  ))}
                </optgroup>
                <optgroup label="Kelas XI">
                  {DAFTAR_KELAS.filter(k => k.startsWith('XI-')).map((k) => (
                    <option key={k} value={k}>Kelas {k}</option>
                  ))}
                </optgroup>
                <optgroup label="Kelas XII">
                  {DAFTAR_KELAS.filter(k => k.startsWith('XII-')).map((k) => (
                    <option key={k} value={k}>Kelas {k}</option>
                  ))}
                </optgroup>
              </select>
            </div>

            <button
              type="submit"
              className="w-full bg-gradient-to-r from-sky-500 via-sky-600 to-amber-500 hover:from-sky-400 hover:to-amber-400 text-slate-950 font-black py-4 rounded-2xl shadow-lg shadow-sky-500/20 transition-all flex items-center justify-center gap-2 uppercase text-xs"
            >
              <span>Simpan & Masuk Halaman Absensi</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        </div>
      ) : (

        <div className="bg-slate-900/90 border border-sky-500/30 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-sky-400 via-amber-400 to-indigo-500"></div>

          {/* Header Identitas Siswa */}
          <div className="flex items-center justify-between pb-6 border-b border-slate-800">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-sky-400 to-amber-400 p-0.5 shadow-md shadow-sky-500/20">
                <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center text-amber-300 font-extrabold text-lg">
                  {studentInfo.name ? studentInfo.name.charAt(0).toUpperCase() : 'S'}
                </div>
              </div>
              <div>
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  {studentInfo.name}
                  <span className="text-[10px] bg-amber-400/20 text-amber-300 border border-amber-400/40 px-2 py-0.5 rounded-full font-mono">
                    Siswa Aktif
                  </span>
                </h2>
                <p className="text-xs text-sky-400 font-semibold">Kelas {studentInfo.className} — Informatika</p>
              </div>
            </div>

            <button
              onClick={handleResetProfile}
              className="p-2.5 text-slate-400 hover:text-amber-300 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded-xl transition-all"
              title="Ganti Profil Siswa"
            >
              <Edit3 className="w-4 h-4" />
            </button>
          </div>

          {/* WIDGET JADWAL SISWA */}
          {classSchedule && (
            <div className="mt-5 p-4 bg-slate-950/80 border border-amber-500/20 rounded-2xl space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-amber-300 font-bold text-xs">
                  <CalendarDays className="w-4 h-4 text-sky-400" />
                  <span>JADWAL KELAS {studentInfo.className}</span>
                </div>
                <span className="text-[10px] bg-amber-400/10 text-amber-300 px-2 py-0.5 rounded-full font-mono border border-amber-400/20">
                  {classSchedule.totalJP}
                </span>
              </div>
              <div className="grid grid-cols-1 gap-2 pt-1">
                {classSchedule.schedules.map((s, idx) => (
                  <div key={idx} className="flex items-center justify-between bg-slate-900/90 px-3 py-2 rounded-xl text-xs">
                    <span className="font-semibold text-white">{s.day} ({s.hours})</span>
                    <span className="text-sky-300/80 font-mono text-[11px]">{s.time} WITA</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {!sessionData.isOpen ? (
            <div className="py-10 text-center space-y-4">
              <div className="w-16 h-16 bg-amber-400/10 border border-amber-400/20 text-amber-300 rounded-2xl flex items-center justify-center mx-auto shadow-lg shadow-amber-500/10">
                <Lock className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold text-white">Sesi Absensi Belum Dibuka</h3>
              <p className="text-xs text-sky-200/80 max-w-sm mx-auto leading-relaxed">
                Guru Pengampu <strong className="text-amber-300">Glendy A. Taawoeda, S.Pd</strong> belum membuka sesi absensi untuk mata pelajaran Informatika.
              </p>
            </div>
          ) : !isClassEligible ? (
            <div className="py-10 text-center space-y-4">
              <div className="w-16 h-16 bg-sky-500/10 border border-sky-500/20 text-sky-400 rounded-2xl flex items-center justify-center mx-auto">
                <Radio className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold text-white">Sesi Khusus Kelas {sessionData.targetClass}</h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Sesi absensi saat ini khusus ditujukan untuk <strong className="text-amber-300">Kelas {sessionData.targetClass}</strong>.
              </p>
            </div>
          ) : submittedToday ? (
            <div className="py-10 text-center space-y-4">
              <div className="w-20 h-20 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-3xl flex items-center justify-center mx-auto shadow-xl shadow-emerald-950/50">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <div>
                <h3 className="text-2xl font-extrabold text-white tracking-tight">Presensi Berhasil Dicatat!</h3>
                <p className="text-xs text-slate-400 mt-2 max-w-xs mx-auto leading-relaxed">
                  Terima kasih <strong className="text-amber-300">{studentInfo.name}</strong> ({studentInfo.className}), kehadiranmu sudah tersimpan.
                </p>
              </div>
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-slate-950 border border-slate-800 rounded-full text-[11px] text-slate-400">
                <Lock className="w-3 h-3 text-emerald-400" /> Absensi Terkunci (Batas 1x Sehari)
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmitAttendance} className="mt-6 space-y-6">
              <div className="p-3 bg-amber-400/10 border border-amber-400/20 rounded-2xl flex items-center gap-3">
                <span className="relative flex h-2.5 w-2.5 shrink-0">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-400"></span>
                </span>
                <p className="text-xs text-amber-300 font-medium">
                  Sesi Absensi Informatika DIBUKA oleh Guru Glendy A. Taawoeda, S.Pd
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-amber-300/90 mb-3">
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
                        className={`relative p-4 rounded-2xl flex flex-col items-center justify-center gap-2 border transition-all ${
                          isSelected
                            ? item.color === 'emerald'
                              ? 'bg-emerald-500/10 border-emerald-500 text-emerald-400'
                              : item.color === 'amber'
                              ? 'bg-amber-500/10 border-amber-400 text-amber-300'
                              : 'bg-rose-500/10 border-rose-500 text-rose-400'
                            : 'bg-slate-950 border-slate-800 text-slate-400 hover:bg-slate-800'
                        }`}
                      >
                        <IconComp className="w-6 h-6" />
                        <span className="text-xs font-bold">{item.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-amber-300/90 mb-2">
                  Catatan / Keterangan <span className="text-slate-500 font-normal lowercase">(opsional)</span>
                </label>
                <textarea
                  rows="3"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Tuliskan alasan jika Izin/Sakit..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 text-slate-100 text-sm focus:outline-none focus:border-sky-400 resize-none"
                ></textarea>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-sky-500 via-sky-600 to-amber-500 hover:from-sky-400 hover:to-amber-400 text-slate-950 font-black py-4 rounded-2xl shadow-xl shadow-sky-500/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50 uppercase text-xs"
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