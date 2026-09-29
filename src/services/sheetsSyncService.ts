import { Participant, ExamResult, ViolationLog, Question } from '../types';
import { storageService } from './storageService';

export const DEFAULT_APPS_SCRIPT_URL =
  'https://script.google.com/macros/s/AKfycbx_InSTl85DNt0EauMtqEXmXXwIkEcxVAuTfxtLCmKvA_CbiarWzKr8Tu3cikgo4pELPg/exec';

const OLD_APPS_SCRIPT_URL =
  'https://script.google.com/macros/s/AKfycbzqWOwYOggXLgLmlCi_Gqm8DReSPxwEgKUtsJGoLgrkWn3o5cak9nhiXPB0YVJ-TP1Drg/exec';

const STORAGE_KEY_APPS_SCRIPT_URL = 'PAI_APPS_SCRIPT_URL';

export const sheetsSyncService = {
  getUrl(): string {
    const saved = localStorage.getItem(STORAGE_KEY_APPS_SCRIPT_URL);
    if (saved !== null && saved !== undefined && saved.trim() !== '') {
      const clean = saved.trim();
      if (clean === OLD_APPS_SCRIPT_URL) {
        localStorage.setItem(STORAGE_KEY_APPS_SCRIPT_URL, DEFAULT_APPS_SCRIPT_URL);
        return DEFAULT_APPS_SCRIPT_URL;
      }
      return clean;
    }
    return DEFAULT_APPS_SCRIPT_URL;
  },

  setUrl(url: string): void {
    localStorage.setItem(STORAGE_KEY_APPS_SCRIPT_URL, url.trim());
  },

  isConfigured(): boolean {
    const url = this.getUrl();
    return Boolean(url && url.startsWith('https://script.google.com/macros/s/'));
  },

  /**
   * Mengirim payload ke Google Apps Script Web App
   * Menggunakan kombinasi Fetch text/plain dan Form Post tersembunyi
   */
  async sendPayload(action: string, data: any): Promise<boolean> {
    const url = this.getUrl();
    if (!url) return false;

    const payload = {
      action,
      timestamp: new Date().toISOString(),
      data,
    };
    const jsonString = JSON.stringify(payload);

    // 1. Kirim via Fetch text/plain (bebas CORS preflight)
    try {
      await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain;charset=utf-8',
        },
        body: jsonString,
        mode: 'no-cors',
      });
    } catch (err) {
      console.warn('Sync via fetch warning:', err);
    }

    // 2. Kirim via Hidden HTML Form Submit (membawa cookie sesi browser)
    try {
      if (typeof document !== 'undefined') {
        let iframe = document.getElementById('gscript_sync_iframe') as HTMLIFrameElement;
        if (!iframe) {
          iframe = document.createElement('iframe');
          iframe.id = 'gscript_sync_iframe';
          iframe.name = 'gscript_sync_iframe';
          iframe.style.display = 'none';
          document.body.appendChild(iframe);
        }

        const form = document.createElement('form');
        form.method = 'POST';
        form.action = url;
        form.target = 'gscript_sync_iframe';
        form.style.display = 'none';

        const input = document.createElement('input');
        input.type = 'hidden';
        input.name = 'payload';
        input.value = jsonString;
        form.appendChild(input);

        document.body.appendChild(form);
        form.submit();
        setTimeout(() => form.remove(), 2500);
      }
    } catch (err) {
      console.warn('Sync via form submit warning:', err);
    }

    return true;
  },

  /**
   * Mengambil data dari Google Apps Script via JSONP
   * 100% Bebas CORS di semua jenis HP siswa dan browser admin!
   */
  async fetchViaJsonp<T>(action: string): Promise<T | null> {
    const url = this.getUrl();
    if (!url || typeof document === 'undefined') return null;

    return new Promise((resolve) => {
      const callbackName = 'gscript_cb_' + Math.random().toString(36).substring(2, 9);
      const script = document.createElement('script');
      let timeoutId: any = null;

      (window as any)[callbackName] = (response: any) => {
        clearTimeout(timeoutId);
        cleanup();
        resolve(response as T);
      };

      const cleanup = () => {
        delete (window as any)[callbackName];
        if (script.parentNode) script.parentNode.removeChild(script);
      };

      timeoutId = setTimeout(() => {
        cleanup();
        resolve(null);
      }, 9000);

      const sep = url.includes('?') ? '&' : '?';
      script.src = `${url}${sep}action=${action}&callback=${callbackName}&_t=${Date.now()}`;
      script.onerror = () => {
        clearTimeout(timeoutId);
        cleanup();
        resolve(null);
      };

      document.body.appendChild(script);
    });
  },

  /**
   * Tarik Bank Soal terbaru dari Google Spreadsheet ke perangkat siswa/admin
   */
  async pullQuestionsFromSheets(): Promise<Question[] | null> {
    if (!this.isConfigured()) return null;
    try {
      const resp = await this.fetchViaJsonp<{ status: string; questions?: Question[] }>('GET_QUESTIONS');
      if (resp && resp.questions && Array.isArray(resp.questions) && resp.questions.length > 0) {
        // Gabungkan dan simpan ke database lokal perangkat
        storageService.saveQuestions(resp.questions);
        return resp.questions;
      }
    } catch (err) {
      console.warn('Gagal menarik soal dari Google Spreadsheet:', err);
    }
    return null;
  },

  /**
   * Tarik Hasil Ujian terbaru dari Google Spreadsheet ke laptop admin
   */
  async pullResultsFromSheets(): Promise<ExamResult[] | null> {
    if (!this.isConfigured()) return null;
    try {
      const resp = await this.fetchViaJsonp<{ status: string; results?: ExamResult[] }>('GET_RESULTS');
      if (resp && resp.results && Array.isArray(resp.results) && resp.results.length > 0) {
        const currentResults = storageService.getResults();
        const merged = [...currentResults];
        
        resp.results.forEach((remoteResult) => {
          const idx = merged.findIndex((r) => r.id === remoteResult.id);
          if (idx >= 0) {
            merged[idx] = remoteResult;
          } else {
            merged.push(remoteResult);
          }
        });

        localStorage.setItem('mgmp_cbt_results', JSON.stringify(merged));
        return resp.results;
      }
    } catch (err) {
      console.warn('Gagal menarik hasil dari Google Spreadsheet:', err);
    }
    return null;
  },

  /**
   * Tarik semua data (Soal & Hasil) dari Google Spreadsheet
   */
  async pullAllFromSheets(): Promise<{ questionsCount: number; resultsCount: number }> {
    if (!this.isConfigured()) return { questionsCount: 0, resultsCount: 0 };
    try {
      const resp = await this.fetchViaJsonp<{
        status: string;
        questions?: Question[];
        results?: ExamResult[];
      }>('GET_ALL');

      let qCount = 0;
      let rCount = 0;

      if (resp?.questions && resp.questions.length > 0) {
        storageService.saveQuestions(resp.questions);
        qCount = resp.questions.length;
      }

      if (resp?.results && resp.results.length > 0) {
        localStorage.setItem('mgmp_cbt_results', JSON.stringify(resp.results));
        rCount = resp.results.length;
      }

      return { questionsCount: qCount, resultsCount: rCount };
    } catch (err) {
      console.warn('Pull all error:', err);
      return { questionsCount: 0, resultsCount: 0 };
    }
  },

  async testConnection(testUrl: string): Promise<boolean> {
    if (!testUrl || !testUrl.startsWith('https://script.google.com/macros/s/')) {
      throw new Error('URL harus berawalan https://script.google.com/macros/s/...');
    }

    try {
      await fetch(testUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain;charset=utf-8',
        },
        body: JSON.stringify({
          action: 'PING',
          data: { message: 'Tes koneksi CBT MGMP PAI Mojokerto' },
        }),
        mode: 'no-cors',
      });
      return true;
    } catch (err: any) {
      throw new Error(err.message || 'Koneksi ke Web App gagal.');
    }
  },

  async syncParticipant(participant: Participant) {
    if (!this.isConfigured()) return;
    return this.sendPayload('SYNC_PARTICIPANT', participant);
  },

  async syncResult(result: ExamResult, participant?: Participant) {
    if (!this.isConfigured()) return;
    return this.sendPayload('SYNC_RESULT', {
      result,
      participant,
    });
  },

  async syncViolation(violation: ViolationLog) {
    if (!this.isConfigured()) return;
    return this.sendPayload('SYNC_VIOLATION', violation);
  },

  async syncQuestions(questions: Question[]) {
    if (!this.isConfigured()) return;
    return this.sendPayload('SYNC_QUESTIONS', questions);
  },

  async exportAll(payloadData: {
    participants: Participant[];
    results: ExamResult[];
    exams: any[];
    questions: any[];
  }) {
    if (!this.isConfigured()) return false;
    return this.sendPayload('EXPORT_ALL', payloadData);
  },
};
