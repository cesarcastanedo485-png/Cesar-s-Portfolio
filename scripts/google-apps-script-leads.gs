/**
 * Google Apps Script — append portfolio leads to the active spreadsheet.
 *
 * Setup (once):
 * 1. New Google Sheet → note its name (script binds to this file).
 * 2. Extensions → Apps Script → paste this file → save.
 * 3. Project Settings → Script properties → add LEADS_SECRET (same string as LEADS_SCRIPT_SECRET on Vercel).
 *    (Optional: omit property and empty secret on server to skip the check — not recommended public.)
 * 4. Deploy → New deployment → Type: Web app
 *    - Execute as: Me
 *    - Who has access: Anyone
 * 5. Copy the Web app URL → Vercel env GOOGLE_APPS_SCRIPT_WEB_APP_URL
 *
 * First row: optional header row — append starts on row after last used, or add headers in row 1 manually:
 *   receivedAt | id | username | email | source | createdAt
 */
function doPost(e) {
  try {
    var props = PropertiesService.getScriptProperties();
    var expected = props.getProperty("LEADS_SECRET");
    var data = JSON.parse(e.postData.contents);
    if (expected && data.secret !== expected) {
      return jsonOut({ ok: false, error: "forbidden" });
    }
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    if (sheet.getLastRow() === 0) {
      sheet.appendRow(["receivedAt", "id", "username", "email", "source", "createdAt"]);
    }
    sheet.appendRow([
      new Date().toISOString(),
      data.id || "",
      data.username || "",
      data.email || "",
      data.source || "",
      data.createdAt || "",
    ]);
    return jsonOut({ ok: true });
  } catch (err) {
    return jsonOut({ ok: false, error: String(err) });
  }
}

function jsonOut(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(
    ContentService.MimeType.JSON
  );
}
