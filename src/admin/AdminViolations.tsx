import React, { useState } from 'react';
import { ViolationLog } from '../types';
import { storageService } from '../services/storageService';
import { ShieldAlert, Search } from 'lucide-react';

export const AdminViolations: React.FC = () => {
  const [violations] = useState<ViolationLog[]>(() =>
    storageService.getViolations()
  );
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');

  const filtered = violations.filter((v) => {
    const matchSearch =
      v.participantName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.schoolName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (v.detail && v.detail.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchType = typeFilter === 'ALL' || v.type === typeFilter;

    return matchSearch && matchType;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl sm:text-2xl font-bold text-slate-900 flex items-center gap-2">
          <ShieldAlert className="w-5 h-5 text-rose-600" />
          <span>Log Audit Integritas & Anti-Curang</span>
        </h2>
        <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
          Rekaman forensik insiden perpindahan tab, kehilangan fokus, keluar layar penuh, dan shortcut terlarang.
        </p>
      </div>

      {/* Filter and Search */}
      <div className="bg-white p-3.5 rounded-xl border border-emerald-950/10 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Cari peserta, sekolah, detail..."
            className="w-full pl-9 pr-3.5 py-1.5 rounded-lg border border-slate-300 text-xs focus:outline-none focus:border-[#087443]"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="py-1.5 px-3 rounded-lg border border-slate-300 text-xs font-medium bg-white focus:outline-none focus:border-[#087443]"
          >
            <option value="ALL">Semua Jenis Pelanggaran</option>
            <option value="TAB_SWITCH">TAB_SWITCH (Pindah Tab / Minimize)</option>
            <option value="BLUR">BLUR (Hilang Fokus Jendela)</option>
            <option value="FULLSCREEN_EXIT">FULLSCREEN_EXIT (Keluar Layar Penuh)</option>
            <option value="KEY_SHORTCUT">KEY_SHORTCUT (Shortcut Keyboard Terlarang)</option>
            <option value="DEVTOOLS">DEVTOOLS (F12 / Console)</option>
          </select>
        </div>
      </div>

      {/* Violations List */}
      <div className="bg-white rounded-xl border border-emerald-950/10 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F8FAF8] border-b border-slate-200 text-slate-700 font-semibold uppercase text-[11px] tracking-wider">
              <tr>
                <th className="py-3 px-3.5 w-12 text-center">No</th>
                <th className="py-3 px-3.5">Waktu Insiden</th>
                <th className="py-3 px-3.5">Nama Peserta</th>
                <th className="py-3 px-3.5">Asal Sekolah</th>
                <th className="py-3 px-3.5 text-center">Strike</th>
                <th className="py-3 px-3.5">Tipe Pelanggaran</th>
                <th className="py-3 px-3.5">Keterangan Forensik</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-slate-400 text-xs">
                    Tidak ada log pelanggaran tercatat. Seluruh peserta mematuhi tata tertib CBT.
                  </td>
                </tr>
              ) : (
                filtered.map((v, index) => {
                  let typeBadge = 'bg-amber-50 text-amber-900 border border-amber-200';
                  if (v.type === 'FULLSCREEN_EXIT') typeBadge = 'bg-rose-50 text-rose-900 border border-rose-200';
                  if (v.type === 'DEVTOOLS') typeBadge = 'bg-purple-50 text-purple-900 border border-purple-200';

                  return (
                    <tr key={v.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-3.5 text-center font-mono text-slate-400">
                        {index + 1}
                      </td>
                      <td className="py-3 px-3.5 font-mono text-xs text-slate-600">
                        {new Date(v.timestamp).toLocaleString('id-ID')}
                      </td>
                      <td className="py-3 px-3.5 font-bold text-slate-900">
                        {v.participantName}
                      </td>
                      <td className="py-3 px-3.5 text-slate-600">
                        {v.schoolName}
                      </td>
                      <td className="py-3 px-3.5 text-center">
                        <span
                          className={`font-mono font-medium px-2 py-0.5 rounded text-[11px] ${
                            v.violationNumber >= 3
                              ? 'bg-rose-50 text-rose-800 border border-rose-300 font-bold'
                              : 'bg-amber-50 text-amber-800 border border-amber-200'
                          }`}
                        >
                          Strike {v.violationNumber}/3
                        </span>
                      </td>
                      <td className="py-3 px-3.5 font-mono font-medium text-xs">
                        <span className={`px-2 py-0.5 rounded ${typeBadge}`}>
                          {v.type}
                        </span>
                      </td>
                      <td className="py-3 px-3.5 text-slate-600 text-xs">
                        {v.detail || '-'}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
