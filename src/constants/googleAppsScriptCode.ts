export const GOOGLE_APPS_SCRIPT_CODE = `/**
 * ==============================================================================
 * BACKEND GOOGLE APPS SCRIPT - CBT OLIMPIADE PAI SMP KABUPATEN MOJOKERTO
 * ==============================================================================
 * Kemenag Kabupaten Mojokerto & MGMP PAI SMP Kabupaten Mojokerto
 *
 * FUNGSI:
 * 1. setupSheets()     : Otomatis membuat seluruh Sheet & Header Kolom jika baru dibuat.
 * 2. doPost(e)         : Menerima data kiriman dari aplikasi CBT (Peserta, Jawaban, Nilai).
 * 3. doGet(e)          : Health check / ping dan pengambilan ringkasan data.
 * ==============================================================================
 */

// Konfigurasi Nama-Nama Sheet
var SHEET_PESERTA = 'PESERTA';
var SHEET_HASIL = 'HASIL_UJIAN';
var SHEET_PELANGGARAN = 'PELANGGARAN';
var SHEET_SESI = 'SESI_UJIAN';
var SHEET_BANK_SOAL = 'BANK_SOAL';

/**
 * JALANKAN FUNGSI INI 1x SETELAH MEMASANG KODE DI APPS SCRIPT
 * Untuk membuat seluruh Sheet dan Header Kolom secara otomatis!
 */
function setupSheets() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();

  // 1. Sheet PESERTA
  var sPeserta = getOrCreateSheet(ss, SHEET_PESERTA);
  sPeserta.getRange(1, 1, 1, 12).setValues([[
    'ID Peserta',
    'Nama Lengkap Siswa',
    'Asal Sekolah',
    'Nomor / ID Peserta',
    'ID Sesi Ujian',
    'Status Ujian',
    'Soal Terjawab',
    'Pelanggaran (Strike)',
    'Waktu Mulai',
    'Terakhir Aktif',
    'Attempt ID',
    'Waktu Catat Server'
  ]]).setFontWeight('bold').setBackground('#EAF8F0').setFontColor('#087443');
  sPeserta.setFrozenRows(1);

  // 2. Sheet HASIL_UJIAN
  var sHasil = getOrCreateSheet(ss, SHEET_HASIL);
  sHasil.getRange(1, 1, 1, 15).setValues([[
    'ID Hasil',
    'Nama Lengkap Siswa',
    'Asal Sekolah',
    'Nomor Peserta',
    'Sesi Ujian',
    'Skor Nilai Akhir (0-100)',
    'Jawaban Benar',
    'Jawaban Salah',
    'Kosong / Tidak Dijawab',
    'Total Soal',
    'Persentase Ketuntasan',
    'Durasi (Menit)',
    'Waktu Penyerahan',
    'Status Kelulusan',
    'Waktu Catat Server'
  ]]).setFontWeight('bold').setBackground('#EAF8F0').setFontColor('#087443');
  sHasil.setFrozenRows(1);

  // 3. Sheet PELANGGARAN
  var sPelanggaran = getOrCreateSheet(ss, SHEET_PELANGGARAN);
  sPelanggaran.getRange(1, 1, 1, 8).setValues([[
    'ID Log',
    'Nama Siswa',
    'Asal Sekolah',
    'Jenis Pelanggaran',
    'Pelanggaran Ke (Strike)',
    'Detail Pelanggaran',
    'Waktu Kejadian',
    'Waktu Catat Server'
  ]]).setFontWeight('bold').setBackground('#FEE2E2').setFontColor('#991B1B');
  sPelanggaran.setFrozenRows(1);

  // 4. Sheet SESI_UJIAN
  var sSesi = getOrCreateSheet(ss, SHEET_SESI);
  sSesi.getRange(1, 1, 1, 8).setValues([[
    'ID Sesi',
    'Judul Sesi Ujian',
    'Token Rilis',
    'Jumlah Soal',
    'Durasi (Menit)',
    'Waktu Mulai',
    'Waktu Selesai',
    'Status Sesi'
  ]]).setFontWeight('bold').setBackground('#E0F2FE').setFontColor('#0369A1');
  sSesi.setFrozenRows(1);

  // 5. Sheet BANK_SOAL
  var sSoal = getOrCreateSheet(ss, SHEET_BANK_SOAL);
  sSoal.getRange(1, 1, 1, 11).setValues([[
    'ID Soal',
    'Tipe Soal',
    'Topik / Kompetensi',
    'Tingkat Kesulitan',
    'Butir Pertanyaan',
    'Opsi A',
    'Opsi B',
    'Opsi C',
    'Opsi D',
    'Kunci Jawaban',
    'Pembahasan'
  ]]).setFontWeight('bold').setBackground('#FEF3C7').setFontColor('#92400E');
  sSoal.setFrozenRows(1);

  Logger.log('Semua sheet dan kolom berhasil dibuat!');
}

function getOrCreateSheet(ss, sheetName) {
  var sheet = ss.getSheetByName(sheetName);
  if (!sheet) {
    sheet = ss.insertSheet(sheetName);
  }
  return sheet;
}

/**
 * MENANGANI REQUEST POST DARI APLIKASI CBT
 */
function doPost(e) {
  try {
    var contents = e.postData.contents;
    var json = JSON.parse(contents);
    var action = json.action;
    var data = json.data;
    var ss = SpreadsheetApp.getActiveSpreadsheet();

    if (action === 'PING') {
      return responseJson({ status: 'ok', message: 'Koneksi ke Google Sheets berhasil!' });
    }

    if (action === 'SYNC_PARTICIPANT') {
      saveOrUpdateParticipant(ss, data);
      return responseJson({ status: 'ok', message: 'Peserta tersimpan' });
    }

    if (action === 'SYNC_RESULT') {
      saveResult(ss, data.result, data.participant);
      return responseJson({ status: 'ok', message: 'Hasil ujian tersimpan' });
    }

    if (action === 'SYNC_VIOLATION') {
      saveViolation(ss, data);
      return responseJson({ status: 'ok', message: 'Log pelanggaran tersimpan' });
    }

    if (action === 'EXPORT_ALL') {
      exportAllData(ss, data);
      return responseJson({ status: 'ok', message: 'Seluruh data berhasil diekspor' });
    }

    return responseJson({ status: 'ignored', message: 'Aksi tidak dikenali' });
  } catch (err) {
    return responseJson({ status: 'error', error: err.toString() });
  }
}

/**
 * MENANGANI REQUEST GET (Tes Koneksi Browser)
 */
function doGet(e) {
  return ContentService.createTextOutput(JSON.stringify({
    status: 'online',
    appName: 'CBT Olimpiade PAI SMP Kab. Mojokerto',
    author: 'MGMP PAI & Kemenag Kab. Mojokerto',
    serverTime: new Date().toISOString()
  })).setMimeType(ContentService.MimeType.JSON);
}

// Simpan / Update Data Peserta
function saveOrUpdateParticipant(ss, p) {
  var sheet = getOrCreateSheet(ss, SHEET_PESERTA);
  var values = sheet.getDataRange().getValues();
  var foundRow = -1;

  for (var i = 1; i < values.length; i++) {
    if (values[i][0] == p.id || values[i][3] == p.participantNumber) {
      foundRow = i + 1;
      break;
    }
  }

  var answeredCount = Object.keys(p.answers || {}).length;
  var rowData = [
    p.id,
    p.name,
    p.schoolName,
    p.participantNumber,
    p.examId,
    p.status,
    answeredCount,
    p.violationCount || 0,
    p.startedAt || '',
    p.lastActiveAt || '',
    p.attemptId || '',
    new Date()
  ];

  if (foundRow > 0) {
    sheet.getRange(foundRow, 1, 1, rowData.length).setValues([rowData]);
  } else {
    sheet.appendRow(rowData);
  }
}

// Simpan Nilai Hasil Ujian
function saveResult(ss, r, p) {
  var sheet = getOrCreateSheet(ss, SHEET_HASIL);
  var durationMin = Math.round(r.durationSeconds / 60);
  var passStatus = r.score >= 75 ? 'LULUS (MEMENUHI KKM)' : 'TEREVALUASI';

  sheet.appendRow([
    r.id,
    r.participantName || (p ? p.name : ''),
    r.schoolName || (p ? p.schoolName : ''),
    r.participantNumber || (p ? p.participantNumber : ''),
    r.examTitle || 'Olimpiade PAI SMP',
    r.score,
    r.correctCount,
    r.wrongCount,
    r.unansweredCount,
    r.totalQuestions,
    r.percentage + '%',
    durationMin,
    r.submittedAt,
    passStatus,
    new Date()
  ]);
}

// Simpan Pelanggaran
function saveViolation(ss, v) {
  var sheet = getOrCreateSheet(ss, SHEET_PELANGGARAN);
  sheet.appendRow([
    v.id,
    v.participantName || v.participantId,
    v.schoolName || '-',
    v.type,
    v.violationNumber,
    v.detail || '',
    v.timestamp,
    new Date()
  ]);
}

// Ekspor Seluruh Data Sekaligus
function exportAllData(ss, data) {
  if (data.participants && data.participants.length > 0) {
    var pSheet = getOrCreateSheet(ss, SHEET_PESERTA);
    data.participants.forEach(function(p) {
      saveOrUpdateParticipant(ss, p);
    });
  }

  if (data.results && data.results.length > 0) {
    var rSheet = getOrCreateSheet(ss, SHEET_HASIL);
    data.results.forEach(function(r) {
      saveResult(ss, r);
    });
  }
}

function responseJson(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
`;
