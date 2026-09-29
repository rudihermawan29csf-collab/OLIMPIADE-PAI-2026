import React, { useState } from 'react';
import { isFirebaseConfigured, firebaseEnvConfig } from '../firebase/firebaseConfig';
import { storageService } from '../services/storageService';
import { sheetsSyncService } from '../services/sheetsSyncService';
import { GOOGLE_APPS_SCRIPT_CODE } from '../constants/googleAppsScriptCode';
import { useToast } from '../components/Toast';
import {
  Settings,
  Database,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  Info,
  FileSpreadsheet,
  Link,
  Copy,
  Check,
  Send,
  Code,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Layers,
  Sparkles
} from 'lucide-react';

export const AdminSettings: React.FC = () => {
  const { showToast } = useToast();

  // Apps Script URL state
  const [appsScriptUrl, setAppsScriptUrl] = useState(() => sheetsSyncService.getUrl());
  const [isTesting, setIsTesting] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [showCodePreview, setShowCodePreview] = useState(false);
  const [showGuide, setShowGuide] = useState(true);

  const handleSaveUrl = () => {
    sheetsSyncService.setUrl(appsScriptUrl);
    showToast('URL Google Apps Script berhasil disimpan!', 'success');
  };

  const handleTestConnection = async () => {
    if (!appsScriptUrl.trim()) {
      showToast('Masukkan URL Web App Google Apps Script terlebih dahulu.', 'error');
      return;
    }

    setIsTesting(true);
    try {
      await sheetsSyncService.testConnection(appsScriptUrl.trim());
      sheetsSyncService.setUrl(appsScriptUrl.trim());
      showToast('Sinyal tes berhasil dikirim ke Google Apps Script!', 'success');
    } catch (err: any) {
      showToast(err.message || 'Gagal terhubung ke Google Apps Script.', 'error');
    } finally {
      setIsTesting(false);
    }
  };

  const handleExportAll = async () => {
    if (!sheetsSyncService.isConfigured()) {
      showToast('Konfigurasikan dan simpan URL Web App terlebih dahulu.', 'error');
      return;
    }

    setIsExporting(true);
    try {
      const participants = storageService.getParticipants();
      const results = storageService.getResults();
      const exams = storageService.getExams();
      const questions = storageService.getQuestions();

      await sheetsSyncService.exportAll({
        participants,
        results,
        exams,
        questions,
      });

      showToast('Seluruh data peserta dan hasil ujian berhasil dikirim ke Google Sheets!', 'success');
    } catch (err: any) {
      showToast('Gagal mengekspor data ke Google Sheets.', 'error');
    } finally {
      setIsExporting(false);
    }
  };

  const handleCopyCode = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(GOOGLE_APPS_SCRIPT_CODE);
      setCopiedCode(true);
      showToast('Kode Google Apps Script berhasil disalin ke clipboard!', 'success');
      setTimeout(() => setCopiedCode(false), 2500);
    }
  };

  const handleResetData = () => {
    if (
      window.confirm(
        'PERINGATAN: Seluruh data hasil ujian, log pelanggaran, dan peserta akan direset kembali ke data awal demo. Apakah Anda yakin?'
      )
    ) {
      storageService.resetAllData();
      showToast('Seluruh data CBT telah berhasil direset ke kondisi default demo!', 'info');
    }
  };

  const isConfigured = sheetsSyncService.isConfigured();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl sm:text-2xl font-bold text-slate-900 flex items-center gap-2">
          <Settings className="w-5 h-5 text-[#087443]" />
          <span>Pengaturan Sistem & Integrasi Database</span>
        </h2>
        <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
          Kelola sinkronisasi otomatis Google Spreadsheet, Apps Script Webhook, dan penyimpanan Cloud.
        </p>
      </div>

      {/* CARD 1: GOOGLE SPREADSHEET & APPS SCRIPT INTEGRATION */}
      <div className="bg-white rounded-xl p-5 sm:p-6 border border-emerald-950/10 shadow-xs space-y-5">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 flex-wrap gap-2">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-[#EAF8F0] text-[#087443] flex items-center justify-center">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <span>Integrasi Google Spreadsheet & Apps Script</span>
                <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded uppercase">
                  Rekomendasi
                </span>
              </h3>
              <p className="text-xs text-slate-500">
                Penyimpanan online multi-perangkat gratis menggunakan Google Sheets Anda sendiri
              </p>
            </div>
          </div>

          <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-semibold uppercase tracking-wide ${
              isConfigured
                ? 'bg-[#EAF8F0] text-emerald-900 border border-emerald-300'
                : 'bg-amber-50 text-amber-900 border border-amber-300'
            }`}
          >
            {isConfigured ? (
              <>
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
                <span>Webhook Aktif</span>
              </>
            ) : (
              <>
                <AlertCircle className="w-3.5 h-3.5 text-amber-700" />
                <span>Belum Terhubung</span>
              </>
            )}
          </span>
        </div>

        <p className="text-xs text-slate-600 leading-relaxed">
          Dengan menghubungkan Web App Google Apps Script, setiap ada siswa yang login, mengerjakan soal, atau menyelesaikan ujian di HP/Laptop mana pun, datanya akan <strong>otomatis tersimpan secara langsung (live autosync)</strong> ke dalam Google Spreadsheet Anda.
        </p>

        {/* Input Web App URL */}
        <div className="bg-[#FAFDFB] p-4 rounded-xl border border-emerald-900/15 space-y-3">
          <label className="block text-xs font-bold text-slate-800 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Link className="w-3.5 h-3.5 text-[#087443]" />
              <span>URL Web App Google Apps Script (Exec URL)</span>
            </span>
            <span className="text-[11px] font-normal text-slate-400">
              Contoh: https://script.google.com/macros/s/.../exec
            </span>
          </label>

          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="url"
              value={appsScriptUrl}
              onChange={(e) => setAppsScriptUrl(e.target.value)}
              placeholder="https://script.google.com/macros/s/AKfycbx.../exec"
              className="flex-1 p-2.5 rounded-lg border border-slate-300 text-xs font-mono text-slate-900 focus:outline-none focus:border-[#087443] focus:ring-1 focus:ring-[#087443] bg-white"
            />
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleSaveUrl}
                className="py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold transition cursor-pointer"
              >
                Simpan
              </button>
              <button
                type="button"
                onClick={handleTestConnection}
                disabled={isTesting}
                className="py-2.5 px-4 bg-[#087443] hover:bg-[#065b34] text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{isTesting ? 'Menguji...' : 'Tes Koneksi'}</span>
              </button>
            </div>
          </div>

          {isConfigured && (
            <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
              <span className="text-emerald-800 flex items-center gap-1.5 font-medium">
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span>Aplikasi siap mengirim data secara real-time ke Google Spreadsheet Anda.</span>
              </span>
              <button
                type="button"
                onClick={handleExportAll}
                disabled={isExporting}
                className="py-1.5 px-3 bg-emerald-100 hover:bg-emerald-200 text-emerald-950 font-bold rounded-lg text-xs transition flex items-center gap-1.5 cursor-pointer self-start sm:self-auto"
              >
                <Sparkles className="w-3.5 h-3.5 text-emerald-800" />
                <span>{isExporting ? 'Mengekspor...' : 'Sinkronkan Semua Data Sekarang'}</span>
              </button>
            </div>
          )}
        </div>

        {/* PANDUAN STRUKTUR SPREADSHEET & KODE APPS SCRIPT */}
        <div className="border border-slate-200 rounded-xl overflow-hidden">
          <button
            type="button"
            onClick={() => setShowGuide(!showGuide)}
            className="w-full p-3.5 bg-[#F8FAF8] hover:bg-slate-100 text-left font-bold text-xs text-slate-800 flex items-center justify-between transition cursor-pointer"
          >
            <span className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-[#087443]" />
              <span>Panduan Struktur File Spreadsheet & Nama Kolom</span>
            </span>
            {showGuide ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
          </button>

          {showGuide && (
            <div className="p-4 bg-white text-xs space-y-4 border-t border-slate-200">
              {/* Nama File */}
              <div className="p-3 bg-[#EAF8F0] rounded-lg border border-emerald-300">
                <span className="text-[11px] uppercase font-bold text-emerald-900 block mb-0.5">
                  1. Nama File Google Spreadsheet:
                </span>
                <span className="font-bold text-slate-900 font-mono text-sm">
                  DATABASE CBT OLIMPIADE PAI KAB. MOJOKERTO 2026
                </span>
              </div>

              {/* Daftar Sheet & Kolom */}
              <div>
                <span className="text-[11px] uppercase font-bold text-slate-700 block mb-2">
                  2. Nama Sheet & Urutan Kolom (Dibuat Otomatis oleh Kode):
                </span>

                <div className="space-y-2.5">
                  {/* Sheet PESERTA */}
                  <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-emerald-900">Sheet: PESERTA</span>
                      <span className="text-[10px] text-slate-500 font-mono">12 Kolom</span>
                    </div>
                    <div className="text-[11px] font-mono text-slate-700 leading-relaxed bg-white p-2 rounded border border-slate-200">
                      ID Peserta | Nama Lengkap Siswa | Asal Sekolah | Nomor / ID Peserta | ID Sesi Ujian | Status Ujian | Soal Terjawab | Pelanggaran (Strike) | Waktu Mulai | Terakhir Aktif | Attempt ID | Waktu Catat Server
                    </div>
                  </div>

                  {/* Sheet HASIL_UJIAN */}
                  <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-emerald-900">Sheet: HASIL_UJIAN</span>
                      <span className="text-[10px] text-slate-500 font-mono">15 Kolom</span>
                    </div>
                    <div className="text-[11px] font-mono text-slate-700 leading-relaxed bg-white p-2 rounded border border-slate-200">
                      ID Hasil | Nama Lengkap Siswa | Asal Sekolah | Nomor Peserta | Sesi Ujian | Skor Nilai Akhir (0-100) | Jawaban Benar | Jawaban Salah | Kosong / Tidak Dijawab | Total Soal | Persentase Ketuntasan | Durasi (Menit) | Waktu Penyerahan | Status Kelulusan | Waktu Catat Server
                    </div>
                  </div>

                  {/* Sheet PELANGGARAN */}
                  <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-rose-900">Sheet: PELANGGARAN</span>
                      <span className="text-[10px] text-slate-500 font-mono">8 Kolom</span>
                    </div>
                    <div className="text-[11px] font-mono text-slate-700 leading-relaxed bg-white p-2 rounded border border-slate-200">
                      ID Log | Nama Siswa | Asal Sekolah | Jenis Pelanggaran | Pelanggaran Ke (Strike) | Detail Pelanggaran | Waktu Kejadian | Waktu Catat Server
                    </div>
                  </div>

                  {/* Sheet SESI_UJIAN */}
                  <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-sky-900">Sheet: SESI_UJIAN</span>
                      <span className="text-[10px] text-slate-500 font-mono">8 Kolom</span>
                    </div>
                    <div className="text-[11px] font-mono text-slate-700 leading-relaxed bg-white p-2 rounded border border-slate-200">
                      ID Sesi | Judul Sesi Ujian | Token Rilis | Jumlah Soal | Durasi (Menit) | Waktu Mulai | Waktu Selesai | Status Sesi
                    </div>
                  </div>

                  {/* Sheet BANK_SOAL */}
                  <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-amber-900">Sheet: BANK_SOAL</span>
                      <span className="text-[10px] text-slate-500 font-mono">11 Kolom</span>
                    </div>
                    <div className="text-[11px] font-mono text-slate-700 leading-relaxed bg-white p-2 rounded border border-slate-200">
                      ID Soal | Tipe Soal | Topik / Kompetensi | Tingkat Kesulitan | Butir Pertanyaan | Opsi A | Opsi B | Opsi C | Opsi D | Kunci Jawaban | Pembahasan
                    </div>
                  </div>
                </div>
              </div>

              {/* Panduan 5 Langkah Deploy */}
              <div className="pt-2 border-t border-slate-200">
                <span className="text-[11px] uppercase font-bold text-slate-700 block mb-2">
                  3. Cara Pasang & Deploy di Google Apps Script (5 Menit):
                </span>
                <ol className="list-decimal pl-5 space-y-1.5 text-slate-600">
                  <li>Buka <strong>Google Drive</strong> dan buat Google Spreadsheet baru dengan nama <code>DATABASE CBT OLIMPIADE PAI KAB. MOJOKERTO 2026</code>.</li>
                  <li>Di menu atas spreadsheet, klik <strong>Ekstensi (Extensions)</strong> &gt; <strong>Apps Script</strong>.</li>
                  <li>Hapus kode bawaan di <code>Code.gs</code>, lalu tempel kode yang sudah kami siapkan di bawah.</li>
                  <li>Pilih fungsi <code>setupSheets</code> di dropdown toolbar lalu klik <strong>Jalankan (Run)</strong> untuk membuat semua sheet dan header secara otomatis.</li>
                  <li>Klik tombol biru <strong>Terapkan (Deploy)</strong> &gt; <strong>Deployment Baru (New Deployment)</strong>:
                    <ul className="list-disc pl-5 mt-1 space-y-0.5 text-slate-700">
                      <li>Pilih jenis: <strong>Aplikasi Web (Web App)</strong></li>
                      <li>Jalankan sebagai: <strong>Saya (email Anda)</strong></li>
                      <li>Siapa yang memiliki akses: <strong>Siapa saja (Anyone)</strong> <em>(Wajib agar siswa dapat mengirim hasil)</em></li>
                    </ul>
                  </li>
                  <li>Salin <strong>URL Aplikasi Web (Web App URL)</strong> yang berakhiran <code>/exec</code>, lalu tempel di kolom URL di atas dan klik <strong>Simpan</strong>.</li>
                </ol>
              </div>

              {/* Action Tombol Salin Kode */}
              <div className="pt-2 flex items-center justify-between gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={handleCopyCode}
                  className="py-2.5 px-4 bg-[#087443] hover:bg-[#065b34] text-white font-bold rounded-lg text-xs flex items-center gap-2 cursor-pointer shadow-xs transition"
                >
                  {copiedCode ? <Check className="w-4 h-4 text-emerald-200" /> : <Copy className="w-4 h-4" />}
                  <span>{copiedCode ? 'Kode Berhasil Disalin!' : 'Salin Kode Google Apps Script (Code.gs)'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowCodePreview(!showCodePreview)}
                  className="py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg text-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <Code className="w-3.5 h-3.5" />
                  <span>{showCodePreview ? 'Sembunyikan Kode' : 'Lihat Tampilan Kode'}</span>
                </button>
              </div>

              {/* Code Preview Box */}
              {showCodePreview && (
                <div className="mt-3 relative">
                  <pre className="p-4 bg-slate-900 text-emerald-300 font-mono text-[11px] rounded-xl overflow-x-auto max-h-96 leading-relaxed">
                    {GOOGLE_APPS_SCRIPT_CODE}
                  </pre>
                  <button
                    type="button"
                    onClick={handleCopyCode}
                    className="absolute right-3 top-3 py-1 px-2.5 bg-white/20 hover:bg-white/30 text-white rounded text-[10px] font-bold flex items-center gap-1 cursor-pointer"
                  >
                    {copiedCode ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedCode ? 'Disalin' : 'Salin'}</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* CARD 2: FIREBASE CLOUD DATABASE STATUS */}
      <div className="bg-white rounded-xl p-5 sm:p-6 border border-emerald-950/10 shadow-xs">
        <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100 flex-wrap gap-2">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#EAF8F0] text-[#087443] flex items-center justify-center">
              <Database className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Penyimpanan Lokal & Firebase
              </h3>
              <p className="text-xs text-slate-500">
                Status Local Storage Engine & Sinkronisasi Cloud Firestore
              </p>
            </div>
          </div>

          <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-semibold uppercase tracking-wide ${
              isFirebaseConfigured
                ? 'bg-[#EAF8F0] text-emerald-900 border border-emerald-300'
                : 'bg-slate-100 text-slate-700 border border-slate-300'
            }`}
          >
            {isFirebaseConfigured ? (
              <>
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
                <span>Terhubung Firebase</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
                <span>Local Storage Aktif</span>
              </>
            )}
          </span>
        </div>

        <p className="text-xs text-slate-600 leading-relaxed mb-4">
          Aplikasi menggunakan sistem penyimpanan hybrid: <strong>Local Storage & Memory Engine</strong> untuk eksekusi kuis berkecepatan tinggi tanpa lag di browser peserta, dan secara otomatis mengirim rekapan ke <strong>Google Spreadsheet / Cloud</strong> saat koneksi tersedia.
        </p>

        <div className="p-3 bg-[#FAFDFB] border border-emerald-900/10 rounded-lg text-xs text-emerald-950 flex items-start gap-2.5">
          <Info className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
          <span className="leading-relaxed">
            Data peserta, timer sisa waktu, dan jawaban siswa tetap terlindungi di perangkat masing-masing meskipun jaringan internet sekolah sempat terputus (anti-gangguan sinyal).
          </span>
        </div>
      </div>

      {/* CARD 3: MAINTENANCE & RESET CARD */}
      <div className="bg-white rounded-xl p-5 sm:p-6 border border-emerald-950/10 shadow-xs">
        <h3 className="text-base font-bold text-slate-900 mb-1.5 flex items-center gap-2">
          <RotateCcw className="w-4 h-4 text-rose-600" />
          <span>Pemeliharaan & Inisialisasi Data Demo</span>
        </h3>
        <p className="text-xs text-slate-600 mb-4 leading-relaxed">
          Kembalikan data ke kondisi awal demo (10 butir soal PAI, 3 sekolah terdaftar: SMPN 3 Pacet, SMPN 1 Puri, SMPN 2 Pacet, dan membersihkan seluruh sesi riwayat peserta).
        </p>

        <button
          onClick={handleResetData}
          className="py-2 px-3.5 bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200 font-medium rounded-lg text-xs flex items-center gap-2 transition cursor-pointer"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset ke Data Awal Demo MGMP PAI</span>
        </button>
      </div>
    </div>
  );
};
