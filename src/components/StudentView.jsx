import React, { useState } from 'react';
import { CheckCircle, Clock, AlertCircle, MapPin } from 'lucide-react';

export default function StudentView({ student, onMarkAttendance }) {
  const [status, setStatus] = useState('Hadir');
  const [notes, setNotes] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    onMarkAttendance({
      studentId: student?.id || 'GUEST',
      studentName: student?.name || 'Siswa',
      status,
      notes,
      timestamp: new Date().toISOString()
    });
    alert('Absensi berhasil dikirim!');
  };

  return (
    <div className="max-w-2xl mx-auto p-4 sm:p-6 bg-slate-800 rounded-xl border border-slate-700 shadow-xl mt-6">
      <div className="flex items-center justify-between pb-4 border-b border-slate-700">
        <div>
          <span className="text-xs font-semibold px-2.5 py-1 bg-sky-500/20 text-sky-400 border border-sky-500/30 rounded-full">
            Sistem Absensi Online
          </span>
          <h2 className="text-xl sm:text-2xl font-bold mt-2">
            {student ? "Halo, " + student.name + "!" : "Selamat Datang, Siswa!"}
          </h2>
          {student && (
            <p className="text-xs text-slate-300 mt-0.5">
              Kelas Terdaftar: <strong className="text-white">{student.class || 'Umum'}</strong>
            </p>
          )}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Status Kehadiran
          </label>
          <div className="grid grid-cols-3 gap-3">
            {['Hadir', 'Izin', 'Sakit'].map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setStatus(item)}
                className={`py-2.5 px-4 rounded-lg font-medium text-sm transition-all border ${
                  status === item
                    ? 'bg-sky-600 border-sky-500 text-white shadow-lg'
                    : 'bg-slate-700/50 border-slate-600 text-slate-300 hover:bg-slate-700'
                }`}
              >
                {item}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1">
            Catatan / Keterangan (Opsional)
          </label>
          <textarea
            rows="3"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Tuliskan alasan jika Izin/Sakit..."
            className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-sm text-slate-200 focus:outline-none focus:border-sky-500"
          ></textarea>
        </div>

        <button
          type="submit"
          className="w-full bg-sky-500 hover:bg-sky-600 text-white font-semibold py-3 rounded-lg shadow-lg transition-all"
        >
          Kirim Absensi Sekarang
        </button>
      </form>
    </div>
  );
}