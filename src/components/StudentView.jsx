import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { UserCheck, Edit3, CheckCircle2, User, School } from 'lucide-react';

const DAFTAR_KELAS = ['10 IPA 1', '10 IPA 2', '11 IPS 1', '11 IPS 2', '12 IPA 1', '12 IPS 1'];

export default function StudentView() {
  const [studentInfo, setStudentInfo] = useState({ name: '', className: '' });
  const [isSaved, setIsSaved] = useState(false);
  const [status, setStatus] = useState('Hadir');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [submittedToday, setSubmittedToday] = useState(false);

  // Memuat data siswa yang tersimpan di browser
  useEffect(() => {
    const savedProfile = localStorage.getItem('absensi_student_profile');
    if (savedProfile) {
      setStudentInfo(JSON.parse(savedProfile));
      setIsSaved(true);
    }
  }, []);

  const handleSaveProfile = (e) => {
    e.preventDefault();
    if (!studentInfo.name || !studentInfo.className) {
      alert('Silakan isi Nama Lengkap dan Pilih Kelas!');
      return;
    }
    localStorage.setItem('absensi_student_profile', JSON.stringify(studentInfo));
    setIsSaved(true);
  };

  const handleResetProfile = () => {
    if (confirm('Apakah Anda yakin ingin mengganti profil identitas siswa?')) {
      localStorage.removeItem('absensi_student_profile');
      setStudentInfo({ name: '', className: '' });
      setIsSaved(false);
      setSubmittedToday(false);
    }
  };

  const handleSubmitAttendance = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await addDoc(collection(db, 'attendance'), {
        studentName: studentInfo.name,
        className: studentInfo.className,
        status: status,
        notes: notes,
        date: new Date().toLocaleDateString('id-ID'),
        timestamp: serverTimestamp()
      });

      setSubmittedToday(true);
      setNotes('');
      alert('Presensi berhasil dikirim ke sistem Firebase!');
    } catch (error) {
      console.error('Error adding document: ', error);
      alert('Gagal mengirim absensi. Periksa koneksi internet Anda.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto p-4 sm:p-6">
      {/* Pengaturan Identitas Siswa */}
      {!isSaved ? (
        <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 shadow-2xl backdrop-blur-md">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-sky-500/10 text-sky-400 rounded-xl">
              <User className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Profil Identitas Siswa</h2>
              <p className="text-xs text-slate-400">Data ini akan disimpan untuk absensi berikutnya</p>
            </div>
          </div>

          <form onSubmit={handleSaveProfile} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Nama Lengkap Siswa</label>
              <input
                type="text"
                required
                value={studentInfo.name}
                onChange={(e) => setStudentInfo({ ...studentInfo, name: e.target.value })}
                placeholder="Contoh: Budi Santoso"
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-slate-100 text-sm focus:outline-none focus:border-sky-500 transition-colors"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Pilih Kelas</label>
              <select
                required
                value={studentInfo.className}
                onChange={(e) => setStudentInfo({ ...studentInfo, className: e.target.value })}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-slate-100 text-sm focus:outline-none focus:border-sky-500 transition-colors"
              >
                <option value="">-- Pilih Kelas --</option>
                {DAFTAR_KELAS.map((k) => (
                  <option key={k} value={k}>{k}</option>
                ))}
              </select>
            </div>

            <button
              type="submit"
              className="w-full bg-sky-500 hover:bg-sky-600 text-white font-semibold py-3 rounded-xl shadow-lg transition-all"
            >
              Simpan Identitas Siswa
            </button>
          </form>
        </div>
      ) : (
        /* Form Presensi Utama */
        <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 shadow-2xl">
          <div className="flex items-center justify-between pb-5 border-b border-slate-700/80">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-emerald-500/10 text-emerald-400 rounded-xl">
                <UserCheck className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-lg text-white">{studentInfo.name}</h3>
                <p className="text-xs text-sky-400 font-medium">{studentInfo.className}</p>
              </div>
            </div>
            <button
              onClick={handleResetProfile}
              className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-rose-400 bg-slate-900/60 hover:bg-rose-500/10 border border-slate-700 px-3 py-1.5 rounded-lg transition-all"
            >
              <Edit3 className="w-3.5 h-3.5" /> Ganti Profil
            </button>
          </div>

          {submittedToday ? (
            <div className="py-8 text-center space-y-3">
              <CheckCircle2 className="w-16 h-16 text-emerald-400 mx-auto animate-bounce" />
              <h4 className="text-xl font-bold text-white">Presensi Berhasil Dikirim!</h4>
              <p className="text-sm text-slate-400">Terima kasih, data kehadiran Anda sudah tercatat di sistem sekolah hari ini.</p>
              <button
                onClick={() => setSubmittedToday(false)}
                className="mt-4 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 text-xs rounded-lg transition-all"
              >
                Kirim Presensi Lagi
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmitAttendance} className="mt-6 space-y-5">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Status Kehadiran Hari Ini</label>
                <div className="grid grid-cols-3 gap-3">
                  {['Hadir', 'Izin', 'Sakit'].map((item) => (
                    <button
                      key={item}
                      type="button"
                      onClick={() => setStatus(item)}
                      className={`py-3 px-4 rounded-xl font-semibold text-sm transition-all border ${
                        status === item
                          ? item === 'Hadir'
                            ? 'bg-emerald-600 border-emerald-500 text-white shadow-lg shadow-emerald-900/40'
                            : item === 'Izin'
                            ? 'bg-amber-600 border-amber-500 text-white shadow-lg shadow-amber-900/40'
                            : 'bg-rose-600 border-rose-500 text-white shadow-lg shadow-rose-900/40'
                          : 'bg-slate-900/60 border-slate-700 text-slate-300 hover:bg-slate-700'
                      }`}
                    >
                      {item}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Catatan Tambahan (Opsional)</label>
                <textarea
                  rows="3"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Keterangan jika Izin/Sakit..."
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-sm text-slate-200 focus:outline-none focus:border-sky-500"
                ></textarea>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-emerald-500 hover:bg-emerald-600 active:scale-[0.99] text-white font-bold py-3.5 rounded-xl shadow-xl shadow-emerald-950/50 transition-all disabled:opacity-50"
              >
                {loading ? 'Mengirim Data...' : 'Kirim Presensi Sekarang'}
              </button>
            </form>
          )}
        </div>
      )}
    </div>
  );
}