const SPREADSHEET_ID = '10671KfFAoi4pl9q2JgXYs10TMRCOC-Tpg3FZgxUFUVw';
const SHEET_NAME = 'Enquiries';

function doGet() {
  return ContentService.createTextOutput('Aura Stories enquiry service is running.');
}

function doPost(e) {
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const p = e && e.parameter ? e.parameter : {};
    if (p.website) return ContentService.createTextOutput('OK');
    if (!p.name || !p.email || !p.service || !p.brief || p.consent !== 'on') {
      return ContentService.createTextOutput('Missing required fields');
    }
    const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(SHEET_NAME);
    sheet.appendRow([
      new Date(), safeCell_(p.name), safeCell_(p.email), safeCell_(p.phone || ''),
      safeCell_(p.service), safeCell_(p.brief), 'New', ''
    ]);
    return ContentService.createTextOutput('OK');
  } finally {
    lock.releaseLock();
  }
}

function safeCell_(value) {
  const text = String(value || '').trim().slice(0, 5000);
  return /^[=+\-@]/.test(text) ? "'" + text : text;
}
