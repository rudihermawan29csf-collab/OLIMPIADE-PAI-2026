import { Participant, ExamResult, ViolationLog } from '../types';

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
   * Menggunakan Content-Type text/plain agar bebas dari CORS preflight di browser
   */
  async sendPayload(action: string, data: any): Promise<boolean> {
    const url = this.getUrl();
    if (!url) return false;

    try {
      const payload = {
        action,
        timestamp: new Date().toISOString(),
        data,
      };

      await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain;charset=utf-8',
        },
        body: JSON.stringify(payload),
        mode: 'no-cors',
      });

      return true;
    } catch (err) {
      console.warn('Gagal sinkronisasi ke Google Apps Script:', err);
      return false;
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
