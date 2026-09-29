import React, { useState } from 'react';
import { School } from '../types';
import { storageService } from '../services/storageService';
import { useToast } from '../components/Toast';
import { School as SchoolIcon, Plus, Edit2, Trash2, Search, X, MapPin, Hash } from 'lucide-react';

export const AdminSchools: React.FC = () => {
  const { showToast } = useToast();
  const [schools, setSchools] = useState<School[]>(() => storageService.getSchools());
  const [searchTerm, setSearchTerm] = useState('');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSchool, setEditingSchool] = useState<School | null>(null);

  const [name, setName] = useState('');
  const [npsn, setNpsn] = useState('');
  const [address, setAddress] = useState('');

  const refreshList = () => {
    setSchools(storageService.getSchools());
  };

  const handleOpenAdd = () => {
    setEditingSchool(null);
    setName('');
    setNpsn('');
    setAddress('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (s: School) => {
    setEditingSchool(s);
    setName(s.name);
    setNpsn(s.npsn || '');
    setAddress(s.address || '');
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      showToast('Nama sekolah wajib diisi.', 'error');
      return;
    }

    try {
      storageService.saveSchool({
        id: editingSchool?.id,
        name: name.trim(),
        npsn: npsn.trim() || undefined,
        address: address.trim() || undefined,
      });

      showToast('Data sekolah berhasil disimpan!', 'success');
      setIsModalOpen(false);
      refreshList();
    } catch (err) {
      showToast('Gagal menyimpan sekolah.', 'error');
    }
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Hapus sekolah ini dari daftar peserta?')) {
      storageService.deleteSchool(id);
      showToast('Sekolah telah dihapus.', 'info');
      refreshList();
    }
  };

  const filtered = schools.filter(
    (s) =>
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (s.npsn && s.npsn.includes(searchTerm)) ||
      (s.address && s.address.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 flex items-center gap-2">
            <SchoolIcon className="w-5 h-5 text-[#087443]" />
            <span>Sekolah Peserta</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Daftar SMP di Kabupaten Mojokerto yang terdaftar pada sistem CBT Olimpiade PAI.
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="flex items-center gap-2 bg-[#087443] hover:bg-[#065b34] text-white px-4 py-2.5 rounded-lg font-medium text-xs shadow-xs transition self-start sm:self-auto cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Tambah Sekolah</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="bg-white p-3.5 rounded-xl border border-emerald-950/10 shadow-xs flex items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Cari nama sekolah atau NPSN..."
            className="w-full pl-9 pr-3.5 py-1.5 rounded-lg border border-slate-300 text-xs focus:outline-none focus:border-[#087443]"
          />
        </div>
        <span className="text-xs text-slate-500 font-medium hidden sm:inline">
          {schools.length} Sekolah Terdaftar
        </span>
      </div>

      {/* Schools Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((school) => {
          const participantCount = storageService
            .getParticipants()
            .filter((p) => p.schoolId === school.id).length;

          return (
            <div
              key={school.id}
              className="bg-white rounded-xl p-5 border border-emerald-950/10 shadow-xs hover:border-emerald-700/40 transition-colors flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="w-8 h-8 rounded-lg bg-[#EAF8F0] text-[#087443] flex items-center justify-center shrink-0">
                    <SchoolIcon className="w-4 h-4" />
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOpenEdit(school)}
                      className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition cursor-pointer"
                      title="Edit Sekolah"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    {schools.length > 1 && (
                      <button
                        onClick={() => handleDelete(school.id)}
                        className="p-1.5 rounded-lg hover:bg-rose-50 text-rose-500 transition cursor-pointer"
                        title="Hapus Sekolah"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                <h3 className="text-base font-bold text-slate-900 mb-1">{school.name}</h3>

                {school.npsn && (
                  <div className="text-xs text-slate-500 flex items-center gap-1 mb-1 font-mono">
                    <Hash className="w-3.5 h-3.5 text-slate-400" />
                    <span>NPSN: {school.npsn}</span>
                  </div>
                )}

                {school.address && (
                  <div className="text-xs text-slate-500 flex items-center gap-1 mb-3">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">{school.address}</span>
                  </div>
                )}
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
                <span>Peserta Mengikuti:</span>
                <span className="font-semibold text-emerald-900 bg-[#EAF8F0] px-2 py-0.5 rounded border border-emerald-200">
                  {participantCount} Siswa
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-xl border border-emerald-950/10">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">
                {editingSchool ? 'Edit Data Sekolah' : 'Tambah Sekolah Baru'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4 text-xs sm:text-sm">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nama Sekolah (SMP) <span className="text-rose-600">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Contoh: SMPN 1 Sooko"
                  className="w-full p-2.5 rounded-lg border border-slate-300 font-medium focus:outline-none focus:border-[#087443]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  NPSN (Nomor Pokok Sekolah Nasional)
                </label>
                <input
                  type="text"
                  value={npsn}
                  onChange={(e) => setNpsn(e.target.value)}
                  placeholder="Contoh: 20502755"
                  className="w-full p-2.5 rounded-lg border border-slate-300 font-mono focus:outline-none focus:border-[#087443]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Alamat / Kecamatan
                </label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Contoh: Sooko, Kabupaten Mojokerto"
                  className="w-full p-2.5 rounded-lg border border-slate-300 focus:outline-none focus:border-[#087443]"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="py-2 px-4 rounded-lg border border-slate-300 hover:bg-slate-50 text-slate-700 font-medium text-xs cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="py-2 px-4 rounded-lg bg-[#087443] hover:bg-[#065b34] text-white font-medium text-xs shadow-xs cursor-pointer"
                >
                  Simpan Sekolah
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
