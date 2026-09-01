/**
 * Faz tanımları — programın omurgası.
 * Tarihler Musa'nın 2026-08-31 kararlarına göre kesinleşti:
 *   Oruç 1-30 Eylül (30 gün) · Refeeding 1-15 Ekim (15 gün) · Kilo verme 16 Ekim-30 Kasım
 */

export type PhaseId = 'oruc' | 'refeeding' | 'kilo-verme';

export interface Phase {
  id: PhaseId;
  name: string;
  short: string;
  startDay: number; // program günü (1 = 2 Eylül 2026)
  endDay: number;
  color: string;
  description: string;
}

/**
 * Program başlangıcı: 2 EYLÜL 2026, Çarşamba. Yerel saat (Europe/Istanbul).
 * (1 Eylül'den kaydırıldı — Musa o gün başlayamadı, 2026-09-01 kararı.)
 */
export const START_DATE = new Date(2026, 8, 2);

export const PHASES: Phase[] = [
  {
    id: 'oruc',
    name: 'Su Orucu',
    short: 'Oruç',
    startDay: 1,
    endDay: 30,
    color: 'var(--phase-fast)',
    description: 'Katı su orucu. Sadece su, elektrolit ve kalorisiz takviye.',
  },
  {
    id: 'refeeding',
    name: 'Refeeding',
    short: 'Refeeding',
    startDay: 31,
    endDay: 45,
    color: 'var(--phase-refeed)',
    description:
      'En riskli faz. Kalori kademeli artar. Elektrolit DÜŞÜRÜLMEZ — sadece sodyum azalır.',
  },
  {
    id: 'kilo-verme',
    name: 'Kilo Verme',
    short: 'Toparlanma',
    startDay: 46,
    endDay: 91,
    color: 'var(--phase-cut)',
    description:
      'Asıl iş burada. 0,5-0,75 kg/hafta. Protein 135-170 g/gün. Kalistenik antrenman.',
  },
];

/** Oruç fazının haftalık alt bölümleri — uyarı metinleri buradan gelir. */
export interface FastWeek {
  from: number;
  to: number;
  label: string;
  note: string;
  critical?: boolean;
}

export const FAST_WEEKS: FastWeek[] = [
  {
    from: 1,
    to: 7,
    label: 'Hafta 1 · Geçiş',
    note: 'Glikojen biter, ketoza geçiş. Baş ağrısı ve halsizlik normal — çoğu sodyum eksikliğidir.',
  },
  {
    from: 8,
    to: 14,
    label: 'Hafta 2 · Oturma',
    note: 'Ketoz yerleşir, açlık kesilir, zihin berraklaşır. Yanıltıcı iyilik hissi — protokolü gevşetme.',
  },
  {
    from: 15,
    to: 21,
    label: 'Hafta 3 · TİAMİN KRİTİK',
    note: 'B1 rezervi ~18. günde tükenir. B Complex hiçbir koşulda atlanmaz. Sabah öz-kontrolü şart.',
    critical: true,
  },
  {
    from: 22,
    to: 30,
    label: 'Hafta 4 · Bitiriş',
    note: 'Protein koruma fazı MAKSİMUMDA — yıkım hızı en düşük, kümülatif kayıp en yüksek. Ağır iş yok.',
  },
];

export function getPhase(day: number): Phase {
  return PHASES.find((p) => day >= p.startDay && day <= p.endDay) ?? PHASES[PHASES.length - 1];
}

export function getFastWeek(day: number): FastWeek | null {
  return FAST_WEEKS.find((w) => day >= w.from && day <= w.to) ?? null;
}
