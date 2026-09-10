/**
 * Local job-applications store (SQLite, device-only).
 *
 * An Application is the unit of the job search: one saved job + the JD + a
 * tailored CV + a cover letter + a status. Fully local — no /api/mobile/*
 * endpoint needed. Syncs to the server later when that lands.
 *
 * Opens the same DB file as the offline CV store (expo-sqlite hands back the
 * same connection for the same name) and adds one table.
 */
import * as SQLite from "expo-sqlite";

export type AppStatus = "saved" | "applied" | "interview" | "offer" | "closed";

export const STATUS_ORDER: AppStatus[] = ["saved", "applied", "interview", "offer", "closed"];

export const STATUS_META: Record<AppStatus, { en: string; sw: string }> = {
  saved: { en: "Saved", sw: "Imehifadhiwa" },
  applied: { en: "Applied", sw: "Nimeomba" },
  interview: { en: "Interview", sw: "Usaili" },
  offer: { en: "Offer", sw: "Ofa" },
  closed: { en: "Closed", sw: "Imefungwa" },
};

export interface Application {
  id: string;
  company: string;
  role: string;
  location?: string;
  jobDescription?: string;
  jobUrl?: string;
  cvId?: string;
  coverLetter?: string;
  status: AppStatus;
  fitScore?: number;
  notes?: string;
  createdAt: number;
  updatedAt: number;
  appliedAt?: number;
}

let db: SQLite.SQLiteDatabase | null = null;

async function conn(): Promise<SQLite.SQLiteDatabase> {
  if (db) return db;
  db = await SQLite.openDatabaseAsync("sumaiya.db");
  // This is a second connection to the same file the offline CV store uses.
  // WAL + a busy timeout means a transient write lock retries rather than
  // throwing SQLITE_BUSY.
  await db.execAsync(`PRAGMA journal_mode = WAL; PRAGMA busy_timeout = 4000;`);
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS applications (
      id TEXT PRIMARY KEY,
      company TEXT NOT NULL,
      role TEXT NOT NULL,
      location TEXT,
      jobDescription TEXT,
      jobUrl TEXT,
      cvId TEXT,
      coverLetter TEXT,
      status TEXT NOT NULL DEFAULT 'saved',
      fitScore INTEGER,
      notes TEXT,
      createdAt INTEGER NOT NULL,
      updatedAt INTEGER NOT NULL,
      appliedAt INTEGER
    );
    CREATE INDEX IF NOT EXISTS idx_applications_status ON applications(status);
  `);
  return db;
}

function rowToApp(r: any): Application {
  return {
    id: r.id,
    company: r.company,
    role: r.role,
    location: r.location ?? undefined,
    jobDescription: r.jobDescription ?? undefined,
    jobUrl: r.jobUrl ?? undefined,
    cvId: r.cvId ?? undefined,
    coverLetter: r.coverLetter ?? undefined,
    status: r.status as AppStatus,
    fitScore: r.fitScore ?? undefined,
    notes: r.notes ?? undefined,
    createdAt: r.createdAt,
    updatedAt: r.updatedAt,
    appliedAt: r.appliedAt ?? undefined,
  };
}

export async function listApplications(): Promise<Application[]> {
  const d = await conn();
  const rows = await d.getAllAsync<any>(
    `SELECT * FROM applications ORDER BY
       CASE status WHEN 'interview' THEN 0 WHEN 'offer' THEN 1 WHEN 'applied' THEN 2 WHEN 'saved' THEN 3 ELSE 4 END,
       updatedAt DESC`,
  );
  return rows.map(rowToApp);
}

export async function getApplication(id: string): Promise<Application | null> {
  const d = await conn();
  const row = await d.getFirstAsync<any>(`SELECT * FROM applications WHERE id = ?`, id);
  return row ? rowToApp(row) : null;
}

let counter = 0;
const newId = () => `app-${Date.now()}-${++counter}`;

export async function createApplication(
  input: Partial<Application> & { company: string; role: string },
): Promise<Application> {
  const d = await conn();
  const now = Date.now();
  const app: Application = {
    id: newId(),
    company: input.company,
    role: input.role,
    location: input.location,
    jobDescription: input.jobDescription,
    jobUrl: input.jobUrl,
    cvId: input.cvId,
    coverLetter: input.coverLetter,
    status: input.status ?? "saved",
    fitScore: input.fitScore,
    notes: input.notes,
    createdAt: now,
    updatedAt: now,
    appliedAt: input.status === "applied" ? now : undefined,
  };
  await d.runAsync(
    `INSERT INTO applications
       (id, company, role, location, jobDescription, jobUrl, cvId, coverLetter, status, fitScore, notes, createdAt, updatedAt, appliedAt)
     VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
    app.id, app.company, app.role, app.location ?? null, app.jobDescription ?? null, app.jobUrl ?? null,
    app.cvId ?? null, app.coverLetter ?? null, app.status, app.fitScore ?? null, app.notes ?? null,
    app.createdAt, app.updatedAt, app.appliedAt ?? null,
  );
  return app;
}

export async function updateApplication(id: string, patch: Partial<Application>): Promise<void> {
  const d = await conn();
  const current = await getApplication(id);
  if (!current) return;
  const next: Application = { ...current, ...patch, id, updatedAt: Date.now() };
  if (patch.status === "applied" && !current.appliedAt) next.appliedAt = Date.now();
  await d.runAsync(
    `UPDATE applications SET company=?, role=?, location=?, jobDescription=?, jobUrl=?, cvId=?,
       coverLetter=?, status=?, fitScore=?, notes=?, updatedAt=?, appliedAt=? WHERE id=?`,
    next.company, next.role, next.location ?? null, next.jobDescription ?? null, next.jobUrl ?? null,
    next.cvId ?? null, next.coverLetter ?? null, next.status, next.fitScore ?? null, next.notes ?? null,
    next.updatedAt, next.appliedAt ?? null, id,
  );
}

export async function deleteApplication(id: string): Promise<void> {
  const d = await conn();
  await d.runAsync(`DELETE FROM applications WHERE id = ?`, id);
}

export async function applicationCounts(): Promise<Record<AppStatus, number>> {
  const d = await conn();
  const rows = await d.getAllAsync<{ status: AppStatus; n: number }>(
    `SELECT status, COUNT(*) as n FROM applications GROUP BY status`,
  );
  const out = { saved: 0, applied: 0, interview: 0, offer: 0, closed: 0 } as Record<AppStatus, number>;
  for (const r of rows) out[r.status] = r.n;
  return out;
}
