import React from 'react';

export default function Footer() {
  return (
    <footer className="bg-slate-900 border-t border-slate-800 text-slate-400 py-6 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-center sm:text-left">
        <div>
          <p>© 2026 Sistem Absensi Sekolah Digital. Hak Cipta Dilindungi.</p>
          <p className="text-slate-500 mt-0.5">Dirancang untuk kebutuhan responsif Android, iOS, Windows & Tablet.</p>
        </div>
        <div className="flex items-center gap-4 text-slate-400">
          <span className="px-2 py-0.5 bg-slate-800 border border-slate-700 rounded text-[11px]">v1.0.0 PWA</span>
          <a href="#" className="hover:text-white transition-colors">Bantuan</a>
          <a href="#" className="hover:text-white transition-colors">Privasi</a>
        </div>
      </div>
    </footer>
  );
}