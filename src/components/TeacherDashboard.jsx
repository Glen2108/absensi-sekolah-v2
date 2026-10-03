import React, { useState, useMemo } from 'react';
import { 
  getAttendanceRecords, 
  updateAttendanceRecord, 
  deleteAttendanceRecord 
} from '../utils/storage';
import { Edit2, Trash2, ChevronLeft, ChevronRight, ArrowUpDown, Filter, Search } from 'lucide-react';

const CLASSES = [
  ...Array.from({ length: 4 }, (_, i) => `X-${i + 1}`),
  ...Array.from({ length: 5 }, (_, i) => `XI-${i + 1}`),
  ...Array.from({ length: 5 }, (_, i) => `XII-${i + 1}`)
];

export default function TeacherDashboard() {
  const [records, setRecords] = useState(getAttendanceRecords());
  const [selectedClass, setSelectedClass] = useState('X-1');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOrder, setSortOrder] = useState('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // State Edit Modal
  const [editingItem, setEditingItem] = useState(null);

  // Filter Data
  const filteredData = useMemo(() => {
    return records.filter(item => {
      const matchClass = item.classGrade === selectedClass;
      const matchSearch = item.studentName.toLowerCase().includes(searchQuery.toLowerCase());
      return matchClass && matchSearch;
    });
  }, [records, selectedClass, searchQuery]);

  // Sorting A-Z / Z-A
  const sortedData = useMemo(() => {
    return [...filteredData].sort((a, b) => {
      if (sortOrder === 'asc') return a.studentName.localeCompare(b.studentName);
      return b.studentName.localeCompare(a.studentName);
    });
  }, [filteredData, sortOrder]);

  // Pagination
  const totalPages = Math.ceil(sortedData.length / itemsPerPage) || 1;
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return sortedData.slice(start, start + itemsPerPage);
  }, [sortedData, currentPage]);

  const handleDelete = (id) => {
    if (confirm("Apakah Anda yakin ingin menghapus data absensi ini?")) {
      const updated = deleteAttendanceRecord(id);
      setRecords(updated);
    }
  };

  const handleUpdateSubmit = (e) => {
    e.preventDefault();
    const updated = updateAttendanceRecord(editingItem);
    setRecords(updated);
    setEditingItem(null);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
      {/* Top Action Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Dashboard Monitoring Absensi</h2>
          <p className="text-xs text-slate-500">Kelola dan atur status presensi siswa secara realtime</p>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-3">
          {/* Search Bar */}
          <div className="relative w-full sm:w-auto">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Cari nama siswa..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full sm:w-48 pl-9 pr-3 py-1.5 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-sky-500 focus:outline-none"
            />
          </div>

          {/* Class Filter Dropdown */}
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Filter className="w-4 h-4 text-slate-500 hidden sm:block" />
            <select
              value={selectedClass}
              onChange={(e) => { setSelectedClass(e.target.value); setCurrentPage(1); }}
              className="w-full sm:w-auto px-3 py-1.5 border border-slate-300 rounded-lg bg-white text-xs font-semibold text-slate-700 focus:ring-2 focus:ring-sky-500 focus:outline-none"
            >
              {CLASSES.map((c) => (
                <option key={c} value={c}>Kelas {c}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-900 text-white text-xs font-semibold">
                <th 
                  className="p-4 cursor-pointer select-none hover:bg-slate-800 transition-colors"
                  onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
                >
                  <div className="flex items-center gap-1.5">
                    Nama Siswa <ArrowUpDown className="w-3.5 h-3.5" />
                  </div>
                </th>
                <th className="p-4">Kelas</th>
                <th className="p-4">Hari / Tanggal</th>
                <th className="p-4">Jam Realtime</th>
                <th className="p-4">Status</th>
                <th className="p-4">Keterangan / Lampiran</th>
                <th className="p-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
              {paginatedData.length > 0 ? (
                paginatedData.map((row) => (
                  <tr key={row.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-4 font-semibold text-slate-900">{row.studentName}</td>
                    <td className="p-4">{row.classGrade}</td>
                    <td className="p-4">{row.date}</td>
                    <td className="p-4 font-mono">{row.time}</td>
                    <td className="p-4">
                      <span className={`px-2.5 py-1 rounded-full text-[11px] font-semibold ${
                        row.status === 'Hadir' ? 'bg-emerald-100 text-emerald-700' :
                        row.status === 'Izin' ? 'bg-amber-100 text-amber-700' : 'bg-rose-100 text-rose-700'
                      }`}>
                        {row.status}
                      </span>
                    </td>
                    <td className="p-4 max-w-xs truncate">
                      <span>{row.notes}</span>
                      {row.attachmentName && (
                        <span className="block text-[10px] text-sky-600 underline font-mono mt-0.5">
                          📎 {row.attachmentName}
                        </span>
                      )}
                    </td>
                    <td className="p-4 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button 
                          onClick={() => setEditingItem(row)}
                          className="p-1.5 text-slate-600 hover:text-sky-600 hover:bg-slate-100 rounded-md transition-colors"
                          title="Edit"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleDelete(row.id)}
                          className="p-1.5 text-slate-600 hover:text-rose-600 hover:bg-slate-100 rounded-md transition-colors"
                          title="Hapus"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" className="p-8 text-center text-slate-400">
                    Tidak ada data absensi untuk kelas {selectedClass}.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-600">
          <span>Halaman {currentPage} dari {totalPages}</span>
          <div className="flex items-center gap-1.5">
            <button
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
              className="p-1.5 border border-slate-300 rounded-md disabled:opacity-40 hover:bg-white transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
              className="p-1.5 border border-slate-300 rounded-md disabled:opacity-40 hover:bg-white transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Modal Edit Status */}
      {editingItem && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl p-6 shadow-xl space-y-4">
            <h3 className="font-bold text-lg text-slate-800">Edit Data Absensi</h3>
            <p className="text-xs text-slate-500">Ubah status kehadiran untuk <strong>{editingItem.studentName}</strong></p>

            <form onSubmit={handleUpdateSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Status Kehadiran</label>
                <select
                  value={editingItem.status}
                  onChange={(e) => setEditingItem({ ...editingItem, status: e.target.value })}
                  className="w-full p-2 border border-slate-300 rounded-lg text-sm bg-white"
                >
                  <option value="Hadir">Hadir</option>
                  <option value="Izin">Izin</option>
                  <option value="Sakit">Sakit</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Keterangan / Catatan</label>
                <textarea
                  rows={3}
                  value={editingItem.notes}
                  onChange={(e) => setEditingItem({ ...editingItem, notes: e.target.value })}
                  className="w-full p-2 border border-slate-300 rounded-lg text-sm"
                />
              </div>

              <div className="flex gap-2 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setEditingItem(null)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-sky-500 hover:bg-sky-600 text-white rounded-lg text-xs font-medium"
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