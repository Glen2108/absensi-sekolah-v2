import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, onSnapshot, doc, deleteDoc, updateDoc, query, orderBy } from 'firebase/firestore';
import { Trash2, Edit2, Filter, Search, RefreshCw, X, Check } from 'lucide-react';

const DAFTAR_KELAS = ['Semua Kelas', '10 IPA 1', '10 IPA 2', '11 IPS 1', '11 IPS 2', '12 IPA 1', '12 IPS 1'];

export default function TeacherDashboard() {
  const [attendances, setAttendances] = useState([]);
  const [selectedClass, setSelectedClass] = useState('Semua Kelas');
  const [searchQuery, setSearchQuery] = useState('');
  const [editingItem, setEditingItem] = useState(null);
  const [loading, setLoading] = useState(true);

  // Membaca data realtime dari Firebase Firestore
  useEffect(() => {
    const q = query(collection(db, 'attendance'), orderBy('timestamp', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setAttendances(data);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Hapus Data
  const handleDelete = async (id) => {
    if (confirm('Apakah Anda yakin ingin menghapus catatan presensi ini?')) {
      try {
        await deleteDoc(doc(db, 'attendance', id));
      } catch (err) {
        alert('Gagal menghapus data: ' + err.message);
      }
    }
  };

  // Simpan Edit Data
  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      await updateDoc(doc(db, 'attendance', editingItem.id), {
        status: editingItem.status,
        notes: editingItem.notes
      });
      setEditingItem(null);
    } catch (err) {
      alert('Gagal memperbarui data: ' + err.message);
    }
  };

  // Filter Data Berdasarkan Kelas & Pencarian
  const filteredData = attendances.filter(item => {
    const matchClass = selectedClass === 'Semua Kelas' || item.className === selectedClass;
    const matchSearch = item.studentName.toLowerCase().includes(searchQuery.toLowerCase());
    return matchClass && matchSearch;
  });

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6 space-y-6">
      {/* Header & Filter Controls */}
      <div className="bg-slate-800 border border-slate-700 rounded-2xl p-5 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-white">Rekapitulasi Presensi Siswa</h2>
            <p className="text-xs text-slate-400">Penyimpanan tersinkronisasi secara realtime melalui Firebase</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs bg-emerald-500/20 text-emerald-400 px-3 py-1.5 rounded-full font-semibold border border-emerald-500/30">
              Total: {filteredData.length} Data
            </span>
          </div>
        </div>

        {/* Baris Filter & Search */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
          <div className="relative">
            <Filter className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-9 pr-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-sky-500"
            >
              {DAFTAR_KELAS.map(k => (
                <option key={k} value={k}>{k}</option>
              ))}
            </select>
          </div>

          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
            <input
              type="text"
              placeholder="Cari nama siswa..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-9 pr-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-sky-500"
            />
          </div>
        </div>
      </div>

      {/* Responsive Table */}
      <div className="bg-slate-800 border border-slate-700 rounded-2xl shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-slate-900/80 text-xs text-slate-400 uppercase tracking-wider border-b border-slate-700">
              <tr>
                <th className="px-6 py-4">Siswa</th>
                <th className="px-6 py-4">Kelas</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Catatan</th>
                <th className="px-6 py-4">Tanggal</th>
                <th className="px-6 py-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/60">
              {loading ? (
                <tr>
                  <td colSpan="6" className="px-6 py-8 text-center text-slate-400">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-sky-400" />
                    Memuat data absensi...
                  </td>
                </tr>
              ) : filteredData.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-8 text-center text-slate-400">
                    Tidak ada data presensi yang ditemukan.
                  </td>
                </tr>
              ) : (
                filteredData.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-700/30 transition-colors">
                    <td className="px-6 py-4 font-semibold text-white">{item.studentName}</td>
                    <td className="px-6 py-4"><span className="bg-slate-900 px-2.5 py-1 rounded-md text-xs font-mono">{item.className}</span></td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${
                        item.status === 'Hadir'
                          ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                          : item.status === 'Izin'
                          ? 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                          : 'bg-rose-500/20 text-rose-400 border-rose-500/30'
                      }`}>
                        {item.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-400 max-w-xs truncate">{item.notes || '-'}</td>
                    <td className="px-6 py-4 text-xs font-mono text-slate-400">{item.date || '-'}</td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => setEditingItem(item)}
                          className="p-1.5 bg-sky-500/10 text-sky-400 hover:bg-sky-500 hover:text-white rounded-lg transition-all"
                          title="Edit"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(item.id)}
                          className="p-1.5 bg-rose-500/10 text-rose-400 hover:bg-rose-500 hover:text-white rounded-lg transition-all"
                          title="Hapus"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Edit Data */}
      {editingItem && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-800 border border-slate-700 rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-slate-700">
              <h3 className="font-bold text-white">Edit Presensi: {editingItem.studentName}</h3>
              <button onClick={() => setEditingItem(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdate} className="mt-4 space-y-4">
              <div>
                <label className="block text-sm text-slate-300 mb-1">Status Kehadiran</label>
                <select
                  value={editingItem.status}
                  onChange={(e) => setEditingItem({ ...editingItem, status: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-sm text-slate-200"
                >
                  <option value="Hadir">Hadir</option>
                  <option value="Izin">Izin</option>
                  <option value="Sakit">Sakit</option>
                </select>
              </div>

              <div>
                <label className="block text-sm text-slate-300 mb-1">Catatan</label>
                <textarea
                  rows="3"
                  value={editingItem.notes || ''}
                  onChange={(e) => setEditingItem({ ...editingItem, notes: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-sm text-slate-200"
                ></textarea>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingItem(null)}
                  className="px-4 py-2 bg-slate-700 text-slate-300 text-sm rounded-xl hover:bg-slate-600"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-sky-500 text-white text-sm font-semibold rounded-xl hover:bg-sky-600 shadow-lg"
                >
                  Simpan Perubahan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}