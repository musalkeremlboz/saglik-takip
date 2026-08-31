/**
 * Günlük plan — faza göre hangi kalem, ne zaman, ne kadar.
 *
 * B6 TAVANI KURALI (EFSA UL 12 mg/gün) — otomatik testle korunuyor:
 *   Oruç + refeeding : B Complex (10) + Magni4 (2) = 12 mg. Multivitamin YOK.
 *     Gerekçe: multivitaminin içeriği zaten örtüşüyor (C→Ester-C, çinko→Picozinc,
 *     D→D3K2, Mg/Ca→elektrolit) ve 8 mg demir oruçta mide tahrişi yapar.
 *   Kilo verme : Multivitamin (4) + Magni4 (2) = 6 mg. B Complex YOK.
 *     Gerekçe: beslenirken tiamin gıdadan gelir, multivitamin yeterli.
 *   ⚠️ B6 nöropatisi (uyuşma, ataksi) Wernicke'yi TAKLİT eder — alarmı bozar.
 *
 * TASARIM KURALI (klinik denetimden):
 *   Her kalemin TAM ve MİNİMUM seviyesi var. Streak mantığı reddedildi
 *   (abstinence violation effect); kötü günde MİNİMUM işaretlemek "başarısızlık" değil.
 */

import type { SupplementId } from './supplements';

export interface PlanItem {
  /** Kararlı kimlik — gün numarasından bağımsız, log kaydı bununla eşleşir. */
  key: string;
  time: string;
  label: string;
  /** Kötü günde kabul edilebilir asgari — "hiç yapmamak"tan iyidir. */
  minimum?: string;
  supplement?: SupplementId;
  critical?: boolean;
  /** Gün aşırı alınan kalemler: sadece tek/çift günlerde görünür. */
  alternating?: 'odd' | 'even';
  /** Sadece istendiğinde — zorunlu değil, eksikse uyarı çıkmaz. */
  optional?: boolean;
  note?: string;
}

/* ─────────── ORUÇ FAZI (Gün 1-30) ─────────── */
const ORUC: PlanItem[] = [
  {
    key: 'sabah-olcum',
    time: '07:00',
    label: 'Tartı + nabız + tansiyon',
    minimum: 'Sadece nabız (ritim düzenli mi?)',
    critical: true,
    note: 'EKG olmadığı için tek kardiyak sinyal bu. Nabzı elle say — ritmi cihaz göstermez.',
  },
  { key: 'elektrolit-1', time: '07:00', label: 'Elektrolit 1 servis + 300 ml su', supplement: 'elektrolit' },
  {
    key: 'b-complex',
    time: '09:00',
    label: 'B Complex 1 kapsül',
    supplement: 'b-complex',
    critical: true,
    note: 'Planın belkemiği. Unutursan aynı gün telafi et.',
  },
  { key: 'd3k2', time: '09:00', label: 'D3K2 2 damla', supplement: 'd3k2' },
  { key: 'ester-c', time: '09:00', label: 'Ester-C 1 kapsül', supplement: 'ester-c' },
  { key: 'elektrolit-2', time: '11:00', label: 'Elektrolit 2 servis', supplement: 'elektrolit' },
  {
    key: 'elektrolit-3',
    time: '13:00',
    label: 'Elektrolit 2 servis + Efsina tuzu 2 g',
    supplement: 'efsina',
  },
  { key: 'elektrolit-4', time: '16:00', label: 'Elektrolit 1 servis', supplement: 'elektrolit' },
  {
    key: 'picozinc',
    time: '16:00',
    label: 'Picozinc 1 tablet',
    supplement: 'picozinc',
    alternating: 'even',
    note: 'Gün aşırı — magnezyumla emilimde yarışır.',
  },
  {
    key: 'elektrolit-5',
    time: '19:00',
    label: 'Elektrolit 2 servis + Efsina 2 g + maden suyu',
    supplement: 'efsina',
  },
  { key: 'magni4', time: '22:00', label: 'Magni4 1 tablet', supplement: 'magni4' },
  {
    key: 'sleep-formula',
    time: '22:00',
    label: 'Sleep Formula 2 kapsül',
    supplement: 'sleep-formula',
    optional: true,
    note: 'Sadece uyuyamazsan. Haftada max 3. O gece Magni4 + Picozinc atla.',
  },
  { key: 'su', time: '—', label: 'Su toplam 2-3 L', minimum: '2 L', note: 'Fazlası sodyumu seyreltir.' },
  {
    key: 'oz-kontrol',
    time: '—',
    label: 'Sabah öz-kontrolü (5 madde)',
    critical: true,
    note: 'Göz · denge · zihin · nabız ritmi · nefes. Biri bozuksa oruç biter.',
  },
];

/* ─────────── REFEEDING (Gün 31-45) ─────────── */
const REFEEDING: PlanItem[] = [
  {
    key: 'tiamin-sabah',
    time: '08:00',
    label: 'Tiamin (B1) 100 mg — İLK LOKMADAN ÖNCE',
    supplement: 'tiamin',
    critical: true,
    note: 'Karbonhidrat tiamin tüketir. Boş rezervle karbonhidrat = Wernicke tetikleyicisi.',
  },
  { key: 'sabah-olcum', time: '08:00', label: 'Tartı + nabız + tansiyon', critical: true,
    note: 'Günde >1 kg artış = sıvı tutulumu, refeeding sendromu habercisi.' },
  { key: 'b-complex', time: '09:00', label: 'B Complex 1 kapsül (ARTIRMA!)', supplement: 'b-complex',
    critical: true, note: '2 kapsüle çıkarma — B6 24 mg olur, UL 12. Tiamin ayrı üründen.' },
  { key: 'ogun-1', time: '09:00', label: 'Öğün 1 — plana göre', critical: true },
  { key: 'tiamin-ogle', time: '13:00', label: 'Tiamin (B1) 100 mg', supplement: 'tiamin', critical: true },
  { key: 'ogun-2', time: '13:00', label: 'Öğün 2 — plana göre', critical: true },
  {
    key: 'elektrolit-refeed',
    time: '13:00',
    label: 'Elektrolit — DÜŞÜRME, sadece sodyumu azalt',
    supplement: 'elektrolit',
    critical: true,
    note: 'İnsülin K/Mg/PO4’ü hücreye süpürür → ihtiyaç ARTAR. Yarı doz TALİMATI YANLIŞTI.',
  },
  { key: 'ogun-3', time: '17:00', label: 'Öğün 3 — plana göre' },
  { key: 'tiamin-aksam', time: '19:00', label: 'Tiamin (B1) 100 mg', supplement: 'tiamin', critical: true },
  { key: 'ogun-4', time: '20:00', label: 'Öğün 4 — plana göre' },
  { key: 'magni4', time: '22:00', label: 'Magni4 1 tablet', supplement: 'magni4' },
  { key: 'd3k2', time: '09:00', label: 'D3K2 2 damla', supplement: 'd3k2' },
];

/* ─────────── KİLO VERME (Gün 46-91) ─────────── */
const KILO_VERME: PlanItem[] = [
  { key: 'sabah-olcum', time: '07:00', label: 'Tartı + nabız', minimum: 'Sadece tartı' },
  {
    key: 'multivitamin',
    time: '09:00',
    label: 'Multivitamin 2 kapsül (tam servis)',
    supplement: 'multivitamin',
    note: 'Beslenirken B Complex’in yerini alır — B6 tavanı için ikisi birlikte alınmaz.',
  },
  { key: 'd3k2', time: '09:00', label: 'D3K2 2 damla', supplement: 'd3k2' },
  { key: 'omega3', time: '09:00', label: 'Omega 3', supplement: 'omega3' },
  {
    key: 'hunger-buster',
    time: '11:00',
    label: 'Hunger Buster 3 kapsül — yemekten 1 saat önce',
    supplement: 'hunger-buster',
    optional: true,
    note: 'BOL SUYLA. Kuru yutulursa yemek borusunda şişer.',
  },
  { key: 'protein', time: '—', label: 'Protein hedefi 135-170 g', critical: true,
    note: 'Kas kaybını telafi eden tek kalem. Kolajen SAYILMAZ.' },
  { key: 'ester-c', time: '13:00', label: 'Ester-C 1 kapsül', supplement: 'ester-c' },
  { key: 'picozinc', time: '16:00', label: 'Picozinc 1 tablet', supplement: 'picozinc', alternating: 'even' },
  { key: 'collagen', time: '17:00', label: 'Collagen 10 g', supplement: 'collagen', optional: true },
  { key: 'magni4', time: '22:00', label: 'Magni4 1 tablet', supplement: 'magni4' },
  { key: 'su', time: '—', label: 'Su 2,5-3 L' },
];

import type { PhaseId } from './phases';

const PLANS: Record<PhaseId, PlanItem[]> = {
  oruc: ORUC,
  refeeding: REFEEDING,
  'kilo-verme': KILO_VERME,
};

/**
 * O günün listesini döndürür — gün aşırı kalemler filtrelenmiş hâlde.
 */
export function getDailyPlan(phaseId: PhaseId, day: number): PlanItem[] {
  const items = PLANS[phaseId] ?? [];
  const isOdd = day % 2 === 1;
  return items.filter((it) => {
    if (!it.alternating) return true;
    return it.alternating === 'odd' ? isOdd : !isOdd;
  });
}
