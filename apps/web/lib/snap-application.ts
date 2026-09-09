/**
 * M1 — Snap → Application workspace.
 *
 * Maps a snap-to-apply result into the `/api/applications/from-cv` payload so
 * the killer workflow survives persistence: job → match → tailored CV →
 * tracker entry. The API endpoint already exists (from-cv, one-shot); this
 * module is the pure, unit-tested shape builder the snap client POSTs.
 *
 * Rules:
 *  - No job context (no jobTitle AND no JD) → returns null. A bare CV save is
 *    NOT an application; we never create empty junk rows in the tracker.
 *  - Empty/whitespace fields are trimmed and omitted, never sent as "".
 *  - matchScore is clamped to 0..100 (the route rejects out-of-range scores,
 *    so a defensive clamp keeps the write from failing on weird input).
 *  - status is always "draft" — the tracker's default. The user moves it to
 *    "applied" when they actually submit (state machine in lib/applications).
 */

export type SnapApplicationInput = {
  cvId: string;
  jobTitle: string;
  jobDescription: string; // the JD used — pasted or OCR text
  matchScore: number | null; // match.after.score — the tailored number
};

export type SnapApplicationPayload = {
  cvId: string;
  jobTitle?: string;
  jobDescription?: string;
  matchScore?: number;
  status: "draft";
};

export function snapApplicationPayload(input: SnapApplicationInput): SnapApplicationPayload | null {
  const jobTitle = input.jobTitle.trim();
  const jobDescription = input.jobDescription.trim();

  // No job context → this is just a CV save, not an application.
  if (!jobTitle && !jobDescription) return null;

  const payload: SnapApplicationPayload = { cvId: input.cvId, status: "draft" };
  if (jobTitle) payload.jobTitle = jobTitle;
  if (jobDescription) payload.jobDescription = jobDescription;
  if (input.matchScore !== null && input.matchScore !== undefined) {
    payload.matchScore = Math.min(100, Math.max(0, Math.round(input.matchScore)));
  }
  return payload;
}
