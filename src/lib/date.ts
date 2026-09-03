/**
 * Tarih ↔ program günü dönüşümü.
 * Gün 1 = 4 Eylül 2026 (Cuma). Yerel saat kullanılır — UTC kayması olmaz.
 */

import { START_DATE } from '../data/phases';

const MS_PER_DAY = 86_400_000;

/** Saat/dakikayı sıfırlar — gün farkı hesabı için. */
function atMidnight(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

/** Verilen tarihin program günü (1 tabanlı). Program başlamadan önce ≤ 0 döner. */
export function dayFromDate(date: Date = new Date()): number {
  const diff = atMidnight(date).getTime() - atMidnight(START_DATE).getTime();
  return Math.floor(diff / MS_PER_DAY) + 1;
}

/** Program gününün takvim tarihi. */
export function dateFromDay(day: number): Date {
  const d = new Date(START_DATE);
  d.setDate(d.getDate() + day - 1);
  return d;
}

const AYLAR = [
  'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
  'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık',
];
const GUNLER = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'];
const GUNLER_KISA = ['Paz', 'Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt'];

export function formatDate(d: Date): string {
  return `${d.getDate()} ${AYLAR[d.getMonth()]} ${GUNLER[d.getDay()]}`;
}

export function formatShort(d: Date): string {
  return `${d.getDate()} ${AYLAR[d.getMonth()].slice(0, 3)}`;
}

export function dayName(d: Date): string {
  return GUNLER[d.getDay()];
}

export function dayNameShort(d: Date): string {
  return GUNLER_KISA[d.getDay()];
}

/** ISO gün anahtarı — IndexedDB kayıtlarında kullanılır (YYYY-MM-DD). */
export function dayKey(day: number): string {
  const d = dateFromDay(day);
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${m}-${dd}`;
}

/**
 * Musa'nın vardiya düzeni (2026-08-31 beyanı):
 *   Pzt+Salı izinli · Çar/Per/Cum eve 23:00 · Cmt/Paz eve 18:00
 */
export type ShiftKind = 'izinli' | 'gec' | 'normal';

export function shiftOf(d: Date): ShiftKind {
  const w = d.getDay(); // 0=Pazar
  if (w === 1 || w === 2) return 'izinli';
  if (w === 3 || w === 4 || w === 5) return 'gec';
  return 'normal';
}

export const SHIFT_LABEL: Record<ShiftKind, string> = {
  izinli: 'İzinli',
  gec: 'İş — eve 23:00',
  normal: 'İş — eve 18:00',
};
