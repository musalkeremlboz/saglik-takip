/**
 * IndexedDB katmanı — DOĞRULUK KAYNAĞI.
 * Uygulama ağ olmadan tam çalışır; Supabase (Aşama 3) sadece replikadır.
 */

import { openDB, type DBSchema, type IDBPDatabase } from 'idb';

/** Bir kalemin işaretlenme durumu. */
export type CheckLevel = 'none' | 'min' | 'full';

export interface CheckEntry {
  /** `${dayKey}|${itemKey}` */
  id: string;
  dayKey: string;
  itemKey: string;
  level: CheckLevel;
  updatedAt: number;
}

export interface VitalsEntry {
  dayKey: string;
  weight?: number;
  pulse?: number;
  /** Nabız ritmi düzenli mi? EKG olmadığı için kritik alan. */
  rhythmRegular?: boolean;
  systolic?: number;
  diastolic?: number;
  note?: string;
  updatedAt: number;
}

/** Sabah nörolojik öz-kontrolü — 5 madde. */
export interface SelfCheckEntry {
  dayKey: string;
  vision: boolean;   // çift görme yok
  balance: boolean;  // denge normal
  clarity: boolean;  // zihin berrak
  rhythm: boolean;   // nabız ritmi düzenli
  breathing: boolean; // nefes normal
  updatedAt: number;
}

interface HealthDB extends DBSchema {
  checks: { key: string; value: CheckEntry; indexes: { 'by-day': string } };
  vitals: { key: string; value: VitalsEntry };
  selfcheck: { key: string; value: SelfCheckEntry };
  outbox: { key: number; value: { id?: number; table: string; payload: unknown; queuedAt: number } };
  meta: { key: string; value: unknown };
}

const DB_NAME = 'saglik-takip';
const DB_VERSION = 1;

let dbPromise: Promise<IDBPDatabase<HealthDB>> | null = null;

export function getDB() {
  if (!dbPromise) {
    dbPromise = openDB<HealthDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        const checks = db.createObjectStore('checks', { keyPath: 'id' });
        checks.createIndex('by-day', 'dayKey');
        db.createObjectStore('vitals', { keyPath: 'dayKey' });
        db.createObjectStore('selfcheck', { keyPath: 'dayKey' });
        db.createObjectStore('outbox', { keyPath: 'id', autoIncrement: true });
        db.createObjectStore('meta');
      },
    });
  }
  return dbPromise;
}

/* ─── checks ─── */

export async function getChecksForDay(dayKey: string): Promise<Record<string, CheckLevel>> {
  const db = await getDB();
  const rows = await db.getAllFromIndex('checks', 'by-day', dayKey);
  const out: Record<string, CheckLevel> = {};
  for (const r of rows) out[r.itemKey] = r.level;
  return out;
}

export async function setCheck(dayKey: string, itemKey: string, level: CheckLevel) {
  const db = await getDB();
  const entry: CheckEntry = {
    id: `${dayKey}|${itemKey}`,
    dayKey,
    itemKey,
    level,
    updatedAt: Date.now(),
  };
  const tx = db.transaction(['checks', 'outbox'], 'readwrite');
  await tx.objectStore('checks').put(entry);
  await tx.objectStore('outbox').add({ table: 'checks', payload: entry, queuedAt: Date.now() });
  await tx.done;
  return entry;
}

/** Uyum yüzdesi için: verilen gün aralığındaki tüm işaretler. */
export async function getAllChecks(): Promise<CheckEntry[]> {
  const db = await getDB();
  return db.getAll('checks');
}

/* ─── vitals ─── */

export async function getVitals(dayKey: string) {
  return (await getDB()).get('vitals', dayKey);
}

export async function saveVitals(v: Omit<VitalsEntry, 'updatedAt'>) {
  const db = await getDB();
  const entry: VitalsEntry = { ...v, updatedAt: Date.now() };
  const tx = db.transaction(['vitals', 'outbox'], 'readwrite');
  await tx.objectStore('vitals').put(entry);
  await tx.objectStore('outbox').add({ table: 'vitals', payload: entry, queuedAt: Date.now() });
  await tx.done;
  return entry;
}

/* ─── self check ─── */

export async function getSelfCheck(dayKey: string) {
  return (await getDB()).get('selfcheck', dayKey);
}

export async function saveSelfCheck(s: Omit<SelfCheckEntry, 'updatedAt'>) {
  const db = await getDB();
  const entry: SelfCheckEntry = { ...s, updatedAt: Date.now() };
  const tx = db.transaction(['selfcheck', 'outbox'], 'readwrite');
  await tx.objectStore('selfcheck').put(entry);
  await tx.objectStore('outbox').add({ table: 'selfcheck', payload: entry, queuedAt: Date.now() });
  await tx.done;
  return entry;
}

/* ─── kalıcılık ─── */

/**
 * iOS'ta 7 gün kullanılmayan siteler temizlenebilir (ITP).
 * Ana Ekrana Ekle yapılmışsa risk çok düşük ama yine de talep ediyoruz.
 */
export async function requestPersistence(): Promise<boolean> {
  if (!navigator.storage?.persist) return false;
  if (await navigator.storage.persisted()) return true;
  return navigator.storage.persist();
}
