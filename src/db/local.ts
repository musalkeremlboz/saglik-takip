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

export interface TrainingEntry {
  dayKey: string;
  /** Yapılan bloklar: 'W' | 'M' | 'N' | 'K' veya seans id'si */
  done: string[];
  /** Yürüyüş gerçekte kaç dakika */
  walkMin?: number;
  /** Yürüyüş sonrası nabız */
  postPulse?: number;
  /** Nörolojik kontrol geçildi mi (Gün 15+) */
  neuroOk?: boolean;
  note?: string;
  updatedAt: number;
}

export interface LadderProgress {
  /** hareket merdiveni id'si: itis, cekis, squat, mentese, govde */
  ladderId: string;
  /** 0-tabanlı basamak indeksi */
  step: number;
  /** Üst tekrar sınırına form bozulmadan ulaşılan ardışık antrenman sayısı */
  hits: number;
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
  training: { key: string; value: TrainingEntry };
  ladder: { key: string; value: LadderProgress };
  outbox: { key: number; value: { id?: number; table: string; payload: unknown; queuedAt: number } };
  meta: { key: string; value: unknown };
}

const DB_NAME = 'saglik-takip';
const DB_VERSION = 2;

let dbPromise: Promise<IDBPDatabase<HealthDB>> | null = null;

export function getDB() {
  if (!dbPromise) {
    dbPromise = openDB<HealthDB>(DB_NAME, DB_VERSION, {
      // ⚠️ Sürüm yükseltmede (v1→v2) mevcut store'lar YENİDEN YARATILAMAZ —
      // createObjectStore ikinci kez çağrılırsa ConstraintError fırlatır ve
      // uygulama tamamen açılmaz. Her store varlık kontrolünden geçer.
      upgrade(db) {
        if (!db.objectStoreNames.contains('checks')) {
          const checks = db.createObjectStore('checks', { keyPath: 'id' });
          checks.createIndex('by-day', 'dayKey');
        }
        if (!db.objectStoreNames.contains('vitals')) {
          db.createObjectStore('vitals', { keyPath: 'dayKey' });
        }
        if (!db.objectStoreNames.contains('selfcheck')) {
          db.createObjectStore('selfcheck', { keyPath: 'dayKey' });
        }
        if (!db.objectStoreNames.contains('outbox')) {
          db.createObjectStore('outbox', { keyPath: 'id', autoIncrement: true });
        }
        if (!db.objectStoreNames.contains('meta')) {
          db.createObjectStore('meta');
        }
        // v2 — antrenman
        if (!db.objectStoreNames.contains('training')) {
          db.createObjectStore('training', { keyPath: 'dayKey' });
        }
        if (!db.objectStoreNames.contains('ladder')) {
          db.createObjectStore('ladder', { keyPath: 'ladderId' });
        }
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

/* ─────────── ANTRENMAN ─────────── */

export async function getTrainingEntry(dayKey: string): Promise<TrainingEntry | undefined> {
  return (await getDB()).get('training', dayKey);
}

export async function saveTrainingEntry(e: Omit<TrainingEntry, 'updatedAt'>): Promise<void> {
  await (await getDB()).put('training', { ...e, updatedAt: Date.now() });
}

/** Bir bloğu aç/kapa — en sık yapılan işlem, tek çağrıda halleder. */
export async function toggleBlock(dayKey: string, blockId: string): Promise<string[]> {
  const db = await getDB();
  const cur = await db.get('training', dayKey);
  const done = cur?.done ?? [];
  const next = done.includes(blockId)
    ? done.filter((b) => b !== blockId)
    : [...done, blockId];
  await db.put('training', { ...(cur ?? { dayKey }), dayKey, done: next, updatedAt: Date.now() });
  return next;
}

/* ─────────── MERDİVEN İLERLEMESİ ─────────── */

export async function getAllLadderProgress(): Promise<Record<string, LadderProgress>> {
  const rows = await (await getDB()).getAll('ladder');
  return Object.fromEntries(rows.map((r) => [r.ladderId, r]));
}

export async function setLadderStep(ladderId: string, step: number): Promise<void> {
  await (await getDB()).put('ladder', { ladderId, step, hits: 0, updatedAt: Date.now() });
}
