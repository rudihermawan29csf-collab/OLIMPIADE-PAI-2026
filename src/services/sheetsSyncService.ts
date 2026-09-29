import { Participant, ExamResult, ViolationLog, Question } from '../types';

export const DEFAULT_APPS_SCRIPT_URL =
  'https://script.google.com/macros/s/AKfycbzqWOwYOggXLgLmlCi_Gqm8DReSPxwEgKUtsJGoLgrkWn3o5cak9nhiXPB0YVJ-TP1Drg/exec';

const STORAGE_KEY_APPS_SCRIPT_URL = 'PAI_APPS_SCRIPT_URL';

export const sheetsSyncService = {
  getUrl(): string {
    const saved = localStorage.getItem(STORAGE_KEY_APPS_SCRIPT_URL);
    if (saved !== null && saved !== undefined && saved.trim() !== '') {
      return saved.trim();
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
   * Form Post penting agar cookie sesi login Google (termasuk akun belajar.id) ikut terkirim
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

    // 2. Kirim via Hidden HTML Form Submit
    // Ini mengikutsertakan sesi akun Google yang sedang aktif di browser
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
