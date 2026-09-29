import React, { useState } from 'react';
import { KeyRound, Mail, ArrowLeft, ArrowRight, ShieldCheck, ChevronDown, Sparkles } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { AdminUser } from '../types';
import { DEMO_ADMINS } from '../services/seedData';
import { LOGO_KEMENAG_MOJOKERTO, LOGO_MGMP_PAI_MOJOKERTO } from '../constants/branding';

interface AdminLoginProps {
  onSuccess: (user: AdminUser) => void;
  onBack: () => void;
}

export const AdminLogin: React.FC<AdminLoginProps> = ({ onSuccess, onBack }) => {
  const { loginAdmin } = useAuth();
  const defaultAdminEmail = 'admin@mgmppai-mojokerto.sch.id';

  // Otomatis terisi pilihan akun login admin
  const [selectedPreset, setSelectedPreset] = useState<string>(defaultAdminEmail);
  const [email, setEmail] = useState<string>(defaultAdminEmail);
  const [password, setPassword] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Handle Preset Selection via Dropdown
  const handleDropdownChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setSelectedPreset(val);
    setError(null);

    if (!val || val === 'custom') {
      setEmail('');
      setPassword('');
      return;
    }

    const foundAdmin = DEMO_ADMINS.find((a) => a.email.toLowerCase() === val.toLowerCase());
    if (foundAdmin) {
      setEmail(foundAdmin.email);
      setPassword(''); // Password dikosongkan agar diisi manual oleh admin
    }
  };

  const handleManualLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email.trim()) {
      setError('Email admin wajib diisi.');
      return;
    }
    if (!password) {
      setError('Kata sandi admin wajib diisi.');
      return;
    }

    // Validasi kata sandi admin tetap menggunakan: admin123
    if (password !== 'admin123') {
      setError('Kata sandi yang Anda masukkan salah. Silakan periksa kembali.');
      return;
    }

    setIsSubmitting(true);
    try {
      const user = loginAdmin(email, password);
      onSuccess(user);
    } catch (err: any) {
      setError(err?.message || 'Login admin gagal. Periksa kembali akun Anda.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const currentAdminPreset = DEMO_ADMINS.find((a) => a.email.toLowerCase() === email.trim().toLowerCase());

  return (
    <div className="min-h-[calc(100vh-65px)] flex items-center justify-center p-4 sm:p-8 bg-[#F8FAF8]">
      <div className="bg-white rounded-xl max-w-lg w-full p-6 sm:p-8 shadow-xs border border-emerald-950/10">
        
        {/* Back Button */}
        <button
          onClick={onBack}
          type="button"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-emerald-800 mb-5 transition cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Kembali ke Halaman Peserta</span>
        </button>

        {/* Header */}
        <div className="text-center mb-6">
          <div className="flex items-center justify-center gap-3 mb-3">
            <div className="inline-block p-1 bg-white rounded-full border border-emerald-900/20 shadow-xs">
              <img
                src={LOGO_KEMENAG_MOJOKERTO}
                alt="Kemenag Kab. Mojokerto"
                className="w-12 h-12 object-contain p-0.5"
              />
            </div>
            <div className="inline-block p-1 bg-white rounded-full border border-emerald-900/20 shadow-xs">
              <img
                src={LOGO_MGMP_PAI_MOJOKERTO}
                alt="MGMP PAI Kabupaten Mojokerto"
                className="w-12 h-12 rounded-full object-cover"
              />
            </div>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900">Login Admin & Proktor</h2>
          <p className="text-xs text-slate-500 mt-1">
            Kemenag Kab. Mojokerto • MGMP PAI • Portal CBT
          </p>
        </div>

        {error && (
          <div className="mb-5 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium leading-relaxed">
            {error}
          </div>
        )}

        {/* Dropdown Pilihan Akun Admin (Otomatis Terpilih) */}
        <div className="mb-5 p-3.5 rounded-lg bg-[#EAF8F0]/80 border border-emerald-700/20">
          <label className="block text-xs font-bold text-emerald-950 mb-1.5 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-emerald-700" />
              <span>Pilihan Akun Admin</span>
            </span>
            <span className="text-[10px] font-semibold text-emerald-800 bg-emerald-100/80 px-2 py-0.5 rounded">
              Terpilih Otomatis
            </span>
          </label>
          <div className="relative">
            <select
              value={selectedPreset}
              onChange={handleDropdownChange}
              className="w-full bg-white px-3 py-2.5 pr-8 rounded-lg border border-emerald-600/30 text-xs sm:text-sm font-semibold text-slate-900 focus:outline-none focus:border-[#087443] focus:ring-1 focus:ring-[#087443] transition appearance-none cursor-pointer"
            >
              <option value="admin@mgmppai-mojokerto.sch.id">
                Admin MGMP PAI (Akses Penuh Pengawas)
              </option>
              <option value="custom">✏️ Masukkan Email Lain / Mandiri</option>
            </select>
            <ChevronDown className="w-4 h-4 text-emerald-700 absolute right-3 top-3 pointer-events-none" />
          </div>

          {currentAdminPreset && (
            <div className="mt-2.5 pt-2.5 border-t border-emerald-900/10 text-[11px] text-emerald-900 flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
                <span className="font-semibold">Akun Resmi Panitia & Proktor CBT</span>
              </div>
              <span className="font-mono text-[10px] bg-emerald-100/90 px-2 py-0.5 rounded text-emerald-800 font-bold uppercase">
                Admin MGMP
              </span>
            </div>
          )}
        </div>

        {/* Login Form */}
        <form onSubmit={handleManualLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Email Akun Admin
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setSelectedPreset('custom');
                }}
                placeholder="nama@mgmppai-mojokerto.sch.id"
                className="w-full pl-10 pr-3.5 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:border-[#087443] focus:ring-1 focus:ring-[#087443] text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 transition"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Kata Sandi (Password)
            </label>
            <div className="relative">
              <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Masukkan kata sandi admin..."
                autoComplete="current-password"
                className="w-full pl-10 pr-3.5 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:border-[#087443] focus:ring-1 focus:ring-[#087443] text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 transition"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full mt-2 flex items-center justify-center gap-2 bg-[#087443] hover:bg-[#065b34] text-white font-medium py-3 px-4 rounded-lg shadow-xs transition text-xs sm:text-sm cursor-pointer disabled:opacity-50"
          >
            <span>Masuk ke Dashboard Admin</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="mt-6 pt-4 border-t border-slate-100 text-center text-xs text-slate-400">
          Sistem Terotentikasi MGMP PAI Kabupaten Mojokerto
        </div>
      </div>
    </div>
  );
};
