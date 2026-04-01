/** Shape matches `LeadRecord` from progression (avoid importing to prevent cycles). */
export type LeadSheetPayload = {
  id: string;
  username: string;
  email: string;
  source: string;
  createdAt: string;
};

/**
 * Fire-and-forget POST to our API route (forwards to Google Apps Script when configured).
 * `keepalive` helps the request finish if the tab closes right after submit.
 */
export function submitLeadToBackend(lead: LeadSheetPayload): void {
  void fetch("/api/leads", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(lead),
    keepalive: true,
  }).catch(() => {});
}
