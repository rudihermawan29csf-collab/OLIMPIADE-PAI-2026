export const GOOGLE_APPS_SCRIPT_CODE = `/**
 * ==============================================================================
 * BACKEND & CLOUD DATABASE GOOGLE APPS SCRIPT
 * CBT OLIMPIADE PAI SMP KABUPATEN MOJOKERTO
 * ==============================================================================
 * Kemenag Kabupaten Mojokerto & MGMP PAI SMP Kabupaten Mojokerto
 *
 * FITUR DATABASE ONLINE MULTI-PERANGKAT:
 * 1. setupSheets()     : Membuat seluruh Sheet dan Header kolom otomatis.
 * 2. doPost(e)         : Menerima Soal Baru, Peserta, dan Nilai Siswa dari Perangkat Admin/Siswa.
 * 3. doGet(e)          : Mengirimkan Soal ke HP Siswa & Nilai ke Laptop Admin (Mendukung JSONP Bebas CORS).
 * ==============================================================================
 */

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
 * ==============================================================================
 * MENANGANI REQUEST GET (PENGAMBILAN DATA ONLINE KE HP SISWA & LAPTOP ADMIN)
 * Mendukung JSONP agar 100% bebas blokir CORS di semua jenis HP & browser!
 * ==============================================================================
 */
function doGet(e) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var action = (e && e.parameter && e.parameter.action) ? e.parameter.action : 'STATUS';
  var callback = (e && e.parameter && e.parameter.callback) ? e.parameter.callback : null;

  var response = {
    status: 'online',
    appName: 'CBT Olimpiade PAI SMP Kab. Mojokerto',
    author: 'MGMP PAI & Kemenag Kab. Mojokerto',
    serverTime: new Date().toISOString()
  };

  if (action === 'GET_QUESTIONS') {
    response.questions = getQuestionsFromSheet(ss);
  } else if (action === 'GET_RESULTS') {
    response.results = getResultsFromSheet(ss);
  } else if (action === 'GET_ALL') {
    response.questions = getQuestionsFromSheet(ss);
    response.results = getResultsFromSheet(ss);
  }

  var output = JSON.stringify(response);

  // Jika dipanggil via JSONP
  if (callback) {
    return ContentService.createTextOutput(callback + '(' + output + ');')
      .setMimeType(ContentService.MimeType.JAVASCRIPT);
  }

  // Jika dipanggil via fetch biasa
  return ContentService.createTextOutput(output)
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * Mengambil seluruh Bank Soal dari Spreadsheet untuk dikirim ke HP Peserta
 */
function getQuestionsFromSheet(ss) {
  var sheet = ss.getSheetByName(SHEET_BANK_SOAL);
  if (!sheet) return [];
  var values = sheet.getDataRange().getValues();
  if (values.length <= 1) return [];

  var list = [];
  for (var i = 1; i < values.length; i++) {
    var row = values[i];
    if (!row[0] && !row[4]) continue;

    var optA = row[5] ? String(row[5]) : '';
    var optB = row[6] ? String(row[6]) : '';
    var optC = row[7] ? String(row[7]) : '';
    var optD = row[8] ? String(row[8]) : '';
    var options = [];
    if (optA) options.push({ id: 'A', text: optA });
    if (optB) options.push({ id: 'B', text: optB });
    if (optC) options.push({ id: 'C', text: optC });
    if (optD) options.push({ id: 'D', text: optD });

    var rawAnswers = row[9] ? String(row[9]).split(',') : ['A'];
    var correctAnswers = rawAnswers.map(function(s) { return s.trim(); });

    list.push({
      id: String(row[0] || ('Q-' + i)),
      type: row[1] || 'PG',
      subject: 'Pendidikan Agama Islam',
      topic: row[2] || 'Materi PAI',
      difficulty: row[3] || 'Sedang',
      question: String(row[4] || ''),
      options: options,
      correctAnswers: correctAnswers,
      explanation: String(row[10] || ''),
      isActive: true,
      createdAt: new Date().toISOString()
    });
  }
  return list;
}

/**
 * Mengambil seluruh Hasil Ujian dari Spreadsheet untuk dikirim ke Laptop Admin
 */
function getResultsFromSheet(ss) {
  var sheet = ss.getSheetByName(SHEET_HASIL);
  if (!sheet) return [];
  var values = sheet.getDataRange().getValues();
  if (values.length <= 1) return [];

  var list = [];
  for (var i = 1; i < values.length; i++) {
    var row = values[i];
    if (!row[0]) continue;

    list.push({
      id: String(row[0]),
      participantName: String(row[1] || ''),
      schoolName: String(row[2] || ''),
      participantNumber: String(row[3] || ''),
      examTitle: String(row[4] || 'Olimpiade PAI SMP'),
      score: Number(row[5] || 0),
      correctCount: Number(row[6] || 0),
      wrongCount: Number(row[7] || 0),
      unansweredCount: Number(row[8] || 0),
      totalQuestions: Number(row[9] || 0),
      percentage: Number(String(row[10] || '0').replace('%', '')),
      durationSeconds: Number(row[11] || 0) * 60,
      submittedAt: row[12] ? new Date(row[12]).toISOString() : new Date().toISOString(),
      status: Number(row[5] || 0) >= 75 ? 'passed' : 'evaluated'
    });
  }
  return list;
}

/**
 * ==============================================================================
 * MENANGANI REQUEST POST (PENYIMPANAN DATA DARI APLIKASI CBT)
 * ==============================================================================
 */
function doPost(e) {
  try {
    var json;
    if (e.parameter && e.parameter.payload) {
      json = JSON.parse(e.parameter.payload);
    } else if (e.postData && e.postData.contents) {
      json = JSON.parse(e.postData.contents);
    } else {
      return responseJson({ status: 'error', error: 'Payload tidak ditemukan' });
    }

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

    if (action === 'SYNC_QUESTIONS') {
      saveQuestions(ss, data);
      return responseJson({ status: 'ok', message: 'Bank soal tersimpan' });
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

// Simpan Nilai Hasil Ujian Siswa
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

// Simpan Seluruh Bank Soal ke Spreadsheet
function saveQuestions(ss, questions) {
  if (!questions || questions.length === 0) return;
  var sheet = getOrCreateSheet(ss, SHEET_BANK_SOAL);

  // Bersihkan baris lama di bawah header
  var lastRow = sheet.getLastRow();
  if (lastRow > 1) {
    sheet.getRange(2, 1, lastRow - 1, 11).clearContent();
  }

  var rows = questions.map(function(q) {
    var optA = '', optB = '', optC = '', optD = '';
    (q.options || []).forEach(function(o) {
      if (o.id === 'A') optA = o.text;
      if (o.id === 'B') optB = o.text;
      if (o.id === 'C') optC = o.text;
      if (o.id === 'D') optD = o.text;
    });

    return [
      q.id,
      q.type || 'PG',
      q.topic || q.subject || 'PAI',
      q.difficulty || 'Sedang',
      q.question || '',
      optA,
      optB,
      optC,
      optD,
      (q.correctAnswers || []).join(', '),
      q.explanation || '-'
    ];
  });

  if (rows.length > 0) {
    sheet.getRange(2, 1, rows.length, 11).setValues(rows);
  }
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

// Ekspor Seluruh Data Sekaligus (Peserta, Hasil, Bank Soal)
function exportAllData(ss, data) {
  if (data.questions && data.questions.length > 0) {
    saveQuestions(ss, data.questions);
  }

  if (data.participants && data.participants.length > 0) {
    data.participants.forEach(function(p) {
      saveOrUpdateParticipant(ss, p);
    });
  }

  if (data.results && data.results.length > 0) {
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
