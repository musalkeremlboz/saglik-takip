/**
 * Takviye kataloğu — etiketten okunmuş gerçek değerler.
 * Kaynak: 01-Takviye-Plani.md (Luna, 2026-08-31, üretici besin tabloları doğrulandı)
 *
 * ⚠️ Doz değiştirirken B6 tavanına dikkat: normal gün toplamı 12 mg'ı aşmamalı.
 *    B6 nöropatisi Wernicke ensefalopatisini TAKLİT eder — alarm sistemini bozar.
 */

export type SupplementId =
  | 'b-complex'
  | 'elektrolit'
  | 'efsina'
  | 'magni4'
  | 'multivitamin'
  | 'd3k2'
  | 'ester-c'
  | 'picozinc'
  | 'sleep-formula'
  | 'tiamin'
  | 'hunger-buster'
  | 'thermo-burner'
  | 'l-carnitine'
  | 'collagen'
  | 'cla'
  | 'omega3';

export interface Supplement {
  id: SupplementId;
  name: string;
  brand: string;
  form: 'kapsül' | 'tablet' | 'toz' | 'damla' | 'yumuşak kapsül';
  /** Etiketten okunan içerik — bilgi amaçlı, ekranda "detay" olarak gösterilir. */
  content: string;
  /** B6 miktarı (mg) — tavan hesabı için. */
  b6mg?: number;
  /** Kritik kalem mi? (atlanırsa uyarı verilir) */
  critical?: boolean;
  warning?: string;
}

export const SUPPLEMENTS: Record<SupplementId, Supplement> = {
  'b-complex': {
    id: 'b-complex',
    name: 'B Complex',
    brand: 'Ocean',
    form: 'kapsül',
    content: 'B1 50 mg · B2 50 · B3 50 · B5 50 · B6 10 mg · B12 50 µg · Folik asit 400 µg · Biotin 100 µg',
    b6mg: 10,
    critical: true,
    warning: 'ASLA ATLANMAZ. Tiamin rezervi ~18. günde biter — Wernicke koruması bu.',
  },
  elektrolit: {
    id: 'elektrolit',
    name: 'Electrolyte Blend',
    brand: 'Protein Ocean',
    form: 'toz',
    content: '2 g serviste: Na 360 · K 150 · Ca 120 · Mg 24 mg (+ trikalsiyum fosfattan ~62 mg fosfor)',
    critical: true,
    warning: 'Güne yayılır, tek seferde alınmaz. Günde 8 servis.',
  },
  efsina: {
    id: 'efsina',
    name: 'Efsina Az Sodyumlu Tuz',
    brand: 'Efsina',
    form: 'toz',
    content: '1 g = Na 196 mg + K 262 mg + iyot ~15-24 µg (%50 kaya tuzu + %50 KCl)',
    critical: true,
    warning: 'Potasyum kaynağı. Kreatinin yüksekse doz düşürülür — böbrek potasyumu atamaz.',
  },
  magni4: {
    id: 'magni4',
    name: 'Magni4',
    brand: 'VitAgil',
    form: 'tablet',
    content: '200 mg elementel Mg (sitrat 80 + bisglisinat 40 + malat 40 + taurat) + D3 25 µg + B6 (P5P) 2 mg',
    b6mg: 2,
  },
  multivitamin: {
    id: 'multivitamin',
    name: 'Multivitamin',
    brand: 'FLAVA',
    form: 'kapsül',
    content: '½ servis (1 kapsül): C 40 · çinko 5 · D3 12,5 µg · Mg 37 · Ca 75 · demir 8 mg · B6 2 mg',
    b6mg: 2,
    warning: 'GÜN AŞIRI. Tam servis 2 kapsül = 16 mg demir; oruçta bu fazla. B6 tavanı için de gerekli.',
  },
  d3k2: {
    id: 'd3k2',
    name: 'D3K2 Damla',
    brand: 'Ocean',
    form: 'damla',
    content: '2 damla ≈ D3 1000 IU + K2 (MK-7) 22 µg',
  },
  'ester-c': {
    id: 'ester-c',
    name: 'Ester-C',
    brand: 'FLAVA',
    form: 'kapsül',
    content: 'Tamponlanmış C vitamini 500 mg',
  },
  picozinc: {
    id: 'picozinc',
    name: 'Picozinc',
    brand: 'Ocean',
    form: 'tablet',
    content: 'Çinko pikolinat 15 mg',
    warning: 'GÜN AŞIRI. Magnezyumla emilimde yarışır; uzun süreli yüksek çinko bakırı düşürür.',
  },
  'sleep-formula': {
    id: 'sleep-formula',
    name: 'Sleep Formula',
    brand: 'FLAVA',
    form: 'kapsül',
    content: '2 kapsül: L-Triptofan 150 · Mg 120 · valerian 100 · melisa 100 · 5-HTP 50 mg · B6 10 · çinko 10',
    b6mg: 10,
    warning:
      'Haftada max 3 gece, ardışık max 2. O gece Magni4 + Picozinc + Multivitamin ATLANIR (Mg 320, çinko 35, B6 24 mg olur).',
  },
  tiamin: {
    id: 'tiamin',
    name: 'Tiamin (B1) — tek başına',
    brand: '—',
    form: 'tablet',
    content: '200-300 mg/gün, bölünmüş dozda',
    critical: true,
    warning:
      'Refeeding için ŞART. B Complex artırılarak yapılamaz — B6 tavanı patlar. İlk lokmadan ÖNCE.',
  },
  'hunger-buster': {
    id: 'hunger-buster',
    name: 'Hunger Buster',
    brand: 'FLAVA',
    form: 'kapsül',
    content: '3 kapsül: konjak ekstresi 1000 mg (900 mg glukomannan) + garsinya 400 mg (240 mg HCA)',
    warning: 'Yemekten 1 saat önce, BOL SUYLA. Kuru yutulursa yemek borusunda şişer.',
  },
  'thermo-burner': {
    id: 'thermo-burner',
    name: 'Thermo Burner',
    brand: 'FLAVA',
    form: 'kapsül',
    content: 'Turunç ekstresi %6 sinefrin + kafein + yeşil çay + CLA + krom',
    warning: 'Kilo verme fazında, tansiyon normalse. Oruçta ve refeeding’de YASAK (aritmi riski).',
  },
  'l-carnitine': {
    id: 'l-carnitine',
    name: 'L-Carnitine',
    brand: 'Protein Ocean',
    form: 'toz',
    content: 'Egzersiz öncesi',
  },
  collagen: {
    id: 'collagen',
    name: 'Collagen Peptides',
    brand: 'Protein Ocean',
    form: 'toz',
    content: '10 g/servis',
    warning: 'Protein hedefine SAYILMAZ — triptofan yok, lösin düşük. Cilt/eklem için.',
  },
  cla: { id: 'cla', name: 'CLA', brand: 'FLAVA', form: 'yumuşak kapsül', content: 'Konjuge linoleik asit' },
  omega3: {
    id: 'omega3',
    name: 'Omega 3',
    brand: 'FLAVA',
    form: 'yumuşak kapsül',
    content: 'EPA/DHA',
    warning: 'Katı su orucunda ÇIKARILDI (kalori). Refeeding’den itibaren geri gelir.',
  },
};

/** B6 tavanı kontrolü — EFSA UL = 12 mg/gün */
export const B6_UPPER_LIMIT = 12;

export function totalB6(ids: SupplementId[]): number {
  return ids.reduce((sum, id) => sum + (SUPPLEMENTS[id].b6mg ?? 0), 0);
}
