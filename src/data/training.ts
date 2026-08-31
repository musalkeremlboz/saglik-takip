/**
 * Antrenman verisi — 03-Egzersiz-Plani.md'den.
 *
 * ⚠️ ÇAKIŞMA ÇÖZÜMÜ (2026-09-01):
 *   Egzersiz planı 8 GÜNLÜK refeeding'e göre yazılmıştı → gerçek antrenman 10 Ekim.
 *   Klinik denetim sonradan refeeding'i 15 GÜNE çıkardı (1-15 Ekim).
 *   10 Ekim artık refeeding'in ORTASI — elektrolit kayması sürüyor.
 *   → Ekim rampası 7 gün kaydırıldı:
 *       Aktivasyon Seti  : gün 44-45 (14-15 Ekim, refeeding son 2 günü)
 *       5 şartlı kapı    : gün 46   (16 Ekim, refeeding biter)
 *       İlk gerçek seans : gün 47   (17 Ekim Cmt) = C seansı (en kısa)
 *       Sonra Pzt=A, Salı=B → normal bölünme
 */

export type BlockId = 'W' | 'M' | 'N' | 'K';

export const BLOCKS: Record<BlockId, { name: string; short: string; color: string }> = {
  W: { name: 'Yürüyüş', short: 'W', color: '#5b8def' },
  M: { name: 'Mobilite bloğu', short: 'M', color: '#3ec98a' },
  N: { name: 'Nefes bloğu', short: 'N', color: '#9b8def' },
  K: { name: 'Kalistenik mikro-doz', short: 'K', color: '#e8a33d' },
};

/* ─────────── HAREKET MERDİVENLERİ ─────────── */

export interface LadderStep {
  tr: string;
  en: string;
  how: string;
  target: string;
}

export interface Ladder {
  id: string;
  name: string;
  icon: string;
  steps: LadderStep[];
  formLock: string;
  bridge?: string;
  warning?: string;
}

export const LADDER_RULE =
  'Bir basamakta 3 set × üst tekrar sınırına, iki antrenman üst üste, form bozulmadan ulaştıysan bir üst basamağa geç. Ulaşmadıysan aynı basamakta kal. Sıkıldığın için basamak atlanmaz — 105 kg’da omuz/bilek sakatlığının 1 numaralı yolu budur.';

export const LADDERS: Ladder[] = [
  {
    id: 'itis',
    name: 'İtiş — Şınav',
    icon: '↑',
    steps: [
      { tr: 'Duvar şınavı', en: 'Wall push-up', how: 'Ayaklar duvardan 60-70 cm, eller omuz hizasında', target: '3 × 15' },
      { tr: 'Yüksek eğik şınav', en: 'High incline push-up', how: 'Eller mutfak tezgâhında, gövde düz tahta', target: '3 × 12' },
      { tr: 'Alçak eğik şınav', en: 'Low incline push-up', how: 'Sandalye / kanepe kolu, yükseklik ~45 cm', target: '3 × 12' },
      { tr: 'Diz şınavı', en: 'Knee push-up', how: 'Dizler yerde, kalça-omuz aynı hatta (popo havada değil)', target: '3 × 10' },
      { tr: 'Tam şınav', en: 'Full push-up', how: 'Göğüs yumruk yüksekliğine iner', target: '3 × 5 → 3 × 10' },
    ],
    bridge: '4→5 köprü (negatif metodu): tam şınav pozisyonunda başla, 4 saniyede kontrollü in, dizlerini yere koyup kalk. 3 × 3. İki haftada 1 tam tekrar gelir.',
    formLock: 'Dirsek gövdeye ~45°, kanat gibi 90° değil (omuz sıkışması). Kalça sarkmaz. Boyun nötr. Bilek ağrırsa eğik basamağa geri dön.',
  },
  {
    id: 'cekis',
    name: 'Çekiş — Barsız',
    icon: '↓',
    steps: [
      { tr: 'Havluyla izometrik çekiş', en: 'Towel isometric row', how: 'Havluyu iki elle ger, 10 sn maksimum çekiş', target: '3 × 5 × 10 sn' },
      { tr: 'Kapı kolu ters kürek', en: 'Doorway row, upright', how: 'Havlu iki kapı koluna, ayaklar kapı dibinde, geriye yaslan', target: '3 × 12' },
      { tr: 'Masa altı ters kürek', en: 'Inverted row', how: 'Sırtüstü masa altında, kenardan tut, göğsü masaya çek', target: '3 × 8' },
      { tr: 'Ayak yükseltilmiş ters kürek', en: 'Feet-elevated inverted row', how: 'Ayaklar sandalyede, gövde yatay', target: '3 × 8' },
    ],
    warning: 'KAPI: havluyu kapının İKİ tarafındaki kollara dola, ayakların menteşe hattının iki yanında. Cam/sunta kapıya asla. MASA: katlanır/IKEA ayaklı/sallanan masa KULLANILMAZ — önce elinle sert çekiş yapıp test et. Devrilirse yüzüne düşer.',
    formLock: 'Programın en kritik boşluğu çekiş. Atlanırsa omuz dengesizliği ve öne düşük duruş gelir.',
  },
  {
    id: 'squat',
    name: 'Squat — Bacak',
    icon: '⌄',
    steps: [
      { tr: 'Sandalyeye oturup kalkma', en: 'Sit-to-stand', how: 'Yüksek sandalye, ellerle destek serbest', target: '3 × 10' },
      { tr: 'Kutu squat', en: 'Box squat', how: 'Sandalyeye değ, oturma; el desteği yok', target: '3 × 12' },
      { tr: 'Serbest yarım squat', en: 'Half squat', how: 'Uyluk yere paralele yakın, topuk yerde', target: '3 × 12' },
      { tr: 'Tam derinlik squat', en: 'Full-depth bodyweight squat', how: 'Kalça diz altına iner, sırt nötr', target: '3 × 15' },
    ],
    formLock: 'Diz ayak parmağı yönünde, içe çökmez. Topuk yerden kalkmaz — kalkıyorsa ayak bileği mobilitesi eksik, o gün duvara diz açma 2 × 10 ekle.',
  },
  {
    id: 'mentese',
    name: 'Menteşe — Arka zincir',
    icon: '⌐',
    steps: [
      { tr: 'Kalça köprüsü', en: 'Glute bridge', how: 'Sırtüstü, tepede 1 sn sık', target: '3 × 15' },
      { tr: 'Tek bacak köprü', en: 'Single-leg glute bridge', how: 'Bir bacak havada, kalça düşmez', target: '3 × 8 / bacak' },
      { tr: 'Vücut ağırlığı iyi sabah', en: 'Bodyweight good morning', how: 'Eller ensede, kalça geri, sırt düz', target: '3 × 12' },
      { tr: 'Destekli tek bacak Romen', en: 'Supported single-leg RDL', how: 'Bir el sandalyede, arka bacak uzanır', target: '3 × 8 / bacak' },
    ],
    formLock: 'Bel yuvarlanmaz. Hareket kalçadan olur, belden değil. Telefon kamerasıyla yandan çek — 105 kg’da bel yuvarlanmasını hissetmeden yaparsın.',
  },
  {
    id: 'govde',
    name: 'Gövde — Plank',
    icon: '▭',
    steps: [
      { tr: 'Ayakta duvar plank', en: 'Standing wall plank', how: 'Önkollar duvarda', target: '3 × 30 sn' },
      { tr: 'Eğik plank', en: 'Incline plank', how: 'Önkollar masa/tezgâhta', target: '3 × 30 sn' },
      { tr: 'Diz plank', en: 'Knee plank', how: 'Dizler yerde', target: '3 × 30 sn' },
      { tr: 'Tam plank', en: 'Full front plank', how: 'Ayak ucu + önkol', target: '3 × 30 → 60 sn' },
    ],
    formLock: 'Popo havaya kalkmaz, bel çökmez. NEFES TUTULMAZ. 20 saniyede form bozuluyorsa süreyi değil BASAMAĞI düşür.',
  },
];

/* ─────────── EYLÜL BLOKLARI ─────────── */

export const M_BLOCK = [
  { tr: 'Kedi-deve', en: 'Cat-cow', dose: '10 tekrar, yavaş' },
  { tr: 'Sırtüstü 90/90 kalça esnetme', en: 'Supine figure-4', dose: '2 × 30 sn / bacak' },
  { tr: 'Diz göğse çekme', en: 'Knee-to-chest', dose: '2 × 30 sn / bacak' },
  { tr: 'Yatarak gövde rotasyonu', en: 'Supine spinal twist', dose: '2 × 30 sn / yön' },
  { tr: 'Duvarda bacak yukarı', en: 'Legs-up-the-wall', dose: '3-5 dk' },
  { tr: 'Oturarak boyun yana esnetme', en: 'Seated neck lateral flexion', dose: '2 × 20 sn / yön' },
  { tr: 'Oturarak omuz çemberi', en: 'Seated shoulder circles', dose: '10 ileri / 10 geri' },
  { tr: 'Ayak bileği alfabe', en: 'Ankle alphabet', dose: '1 tur / ayak' },
  { tr: 'Havluyla yatarak baldır esnetme', en: 'Supine calf stretch', dose: '2 × 30 sn / bacak' },
];

export const M_RULE =
  'Hepsi yatarak veya otururken. Ayakta öne eğilme YOK — baş kalp seviyesinin altına inince doğrulurken bayılırsın. Statik tutuş, zorlama yok, nefes tutulmaz.';

export const N_BLOCK = [
  { tr: 'Kutu nefes', en: 'Box breathing', dose: '4 al / 4 tut / 4 ver / 4 bekle', when: 'Sabah, otururken' },
  { tr: 'Uyum nefesi', en: 'Coherent breathing', dose: '6 sn al / 6 sn ver, 5 dk', when: 'Akşam, yatmadan' },
  { tr: 'Diyafram nefesi', en: 'Diaphragmatic breathing', dose: 'El karında, karın şişer', when: 'Ara verirken' },
];

export const N_RULE = 'YASAK: Wim Hof, tummo, kapalbhati, nefes tutma yarışı, hiperventilasyon.';

export const K_BLOCK = [
  { tr: 'Duvar şınavı', en: 'Wall push-up', dose: '2 × 6', note: 'Yapabileceğinin yarısı kadar' },
  { tr: 'Sandalyeye oturup kalkma', en: 'Sit-to-stand', dose: '2 × 6', note: 'Ellerle destek serbest' },
  { tr: 'Kalça köprüsü', en: 'Glute bridge', dose: '2 × 8', note: 'Tepede sıkma yok' },
  { tr: 'Ayakta duvar plank', en: 'Standing wall plank', dose: '2 × 15 sn', note: 'Nefes tutulmaz' },
];

export const K_RULE =
  'Toplam ~6 dakika. Setler arası 60-90 sn, tam nefes dönene kadar. Ölçüt: bittiğinde "hiçbir şey yapmamışım gibi" hissetmelisin. Yorulduysan doz fazlaydı. 14 Eylül’den sonra K Bloğu BİTER — kalan 16 gün direnç hareketi yok.';

export const WALK_RULES = [
  'Yakın halka rota — 5 dakikada eve dönebileceğin halka. Bayılırsan 2 km uzakta olmayacaksın.',
  'Telefon yanında, konum paylaşımı açık, birine "çıkıyorum" de.',
  'Yanında elektrolitli su.',
  'Yorgunsan 2 × 10 dk böl. Bölmek başarısızlık değil.',
  '12:00-16:00 arası çıkma — terleme = sodyum kaybı = bayılma.',
  'Sonrasında oturarak 5 dk soğuma, sonra YAVAŞÇA ayağa kalk.',
];

/* ─────────── EYLÜL GÜN GÜN ─────────── */

export interface TrainingDay {
  blocks: BlockId[];
  walkMin?: number;
  mMin?: number;
  pulseCap?: number;
  neuro?: boolean;
  rest?: boolean;
  note?: string;
}

const SEPT: Record<number, TrainingDay> = {
  1:  { blocks: ['M', 'N'], mMin: 10 },
  2:  { blocks: ['W', 'M'], walkMin: 15, mMin: 8, pulseCap: 110 },
  3:  { blocks: ['M', 'N'], mMin: 10 },
  4:  { blocks: ['W', 'M'], walkMin: 15, mMin: 8, pulseCap: 110 },
  5:  { blocks: ['W', 'K'], walkMin: 20, pulseCap: 110 },
  6:  { blocks: [], rest: true, note: 'Tam dinlenme + esneme 10 dk' },
  7:  { blocks: ['W', 'K', 'M'], walkMin: 15, mMin: 8, pulseCap: 110, note: 'KAN TAHLİLİ' },
  8:  { blocks: ['W', 'K', 'M'], walkMin: 20, mMin: 8, pulseCap: 110 },
  9:  { blocks: ['M', 'N'], mMin: 10 },
  10: { blocks: ['W'], walkMin: 25, pulseCap: 110, note: 'Yorgunsan 2 × 12 dk böl' },
  11: { blocks: ['M'], mMin: 12, note: 'M Bloğu + duvarda bacak yukarı' },
  12: { blocks: ['W', 'K'], walkMin: 25, pulseCap: 110, note: 'Zirve hafta — daha fazla artırma' },
  13: { blocks: [], rest: true, note: 'Tam dinlenme + esneme 10 dk' },
  14: { blocks: ['W', 'M'], walkMin: 20, mMin: 8, pulseCap: 110, note: 'KAN TAHLİLİ · bugünden sonra K Bloğu BİTER' },
  15: { blocks: ['W'], walkMin: 20, pulseCap: 100, neuro: true, note: 'Nörolojik öz-kontrol başlar' },
  16: { blocks: ['M', 'N'], mMin: 10, neuro: true },
  17: { blocks: ['W'], walkMin: 20, pulseCap: 100, neuro: true },
  18: { blocks: ['M'], mMin: 12, neuro: true },
  19: { blocks: ['W'], walkMin: 20, pulseCap: 100, neuro: true },
  20: { blocks: [], rest: true, neuro: true, note: 'Tam dinlenme' },
  21: { blocks: ['W', 'M'], walkMin: 15, mMin: 8, pulseCap: 100, neuro: true, note: 'KAN TAHLİLİ' },
  22: { blocks: ['W'], walkMin: 20, pulseCap: 100, neuro: true },
  23: { blocks: ['M', 'N'], mMin: 10, neuro: true },
  24: { blocks: ['W'], walkMin: 15, pulseCap: 100, neuro: true },
  25: { blocks: ['M'], mMin: 10, neuro: true },
  26: { blocks: ['W'], walkMin: 15, pulseCap: 100, neuro: true },
  27: { blocks: [], rest: true, neuro: true, note: 'Tam dinlenme' },
  28: { blocks: ['M', 'N'], mMin: 10, neuro: true, note: 'Oruç sonrası plan hazır olmalı' },
  29: { blocks: ['M', 'N'], mMin: 10, neuro: true, note: 'Sadece M + N' },
  30: { blocks: [], rest: true, neuro: true, note: 'HAREKET YOK. Yatarak esneme, duvarda bacak yukarı 8 dk. KAN TAHLİLİ + FOSFOR ŞART' },
};

/* ─────────── EKİM-KASIM SEANSLARI ─────────── */

export interface Session {
  id: 'A' | 'B' | 'C' | 'micro';
  name: string;
  duration: string;
  movements: { ladder: string; dose: string }[];
}

export const SESSIONS: Session[] = [
  {
    id: 'A', name: 'A — İtiş + Squat', duration: '45-55 dk',
    movements: [
      { ladder: 'itis', dose: 'Merdivendeki basamağın × 3 set' },
      { ladder: 'squat', dose: 'Merdivendeki basamağın × 3 set' },
      { ladder: 'govde', dose: '3 × süre' },
      { ladder: 'mentese', dose: '2 set (destek)' },
    ],
  },
  {
    id: 'B', name: 'B — Çekiş + Menteşe', duration: '45-55 dk',
    movements: [
      { ladder: 'cekis', dose: 'Merdivendeki basamağın × 3 set' },
      { ladder: 'mentese', dose: 'Merdivendeki basamağın × 3 set' },
      { ladder: 'govde', dose: 'Kuş-köpek 3 × 8, ölü böcek 3 × 10' },
      { ladder: 'itis', dose: '2 set (destek)' },
    ],
  },
  {
    id: 'C', name: 'C — Tam vücut, kısa', duration: '30-40 dk',
    movements: [
      { ladder: 'itis', dose: '2 set' },
      { ladder: 'squat', dose: '2 set' },
      { ladder: 'cekis', dose: '2 set' },
      { ladder: 'govde', dose: '2 set' },
    ],
  },
  {
    id: 'micro', name: 'Mikro doz (sabah)', duration: '15 dk',
    movements: [
      { ladder: 'itis', dose: '1-2 set, kolay basamak' },
      { ladder: 'squat', dose: '1-2 set' },
      { ladder: 'govde', dose: '1 set' },
    ],
  },
];

/** Ekim-Kasım haftalık şablon: 0=Pzt ... 6=Paz */
export const WEEKLY_SPLIT: Record<number, Session['id'] | 'rest' | 'walk'> = {
  0: 'A',      // Pazartesi — izinli, uzun
  1: 'B',      // Salı — izinli, uzun
  2: 'micro',  // Çarşamba sabah 15 dk
  3: 'rest',   // Perşembe tam dinlenme
  4: 'micro',  // Cuma sabah 15 dk
  5: 'C',      // Cumartesi 19:00 orta
  6: 'walk',   // Pazar yürüyüş + mobilite
};

export const RETURN_GATE = [
  'Potasyum (K) ≥ 3,5 mmol/L',
  'Fosfor ≥ 0,8 mmol/L',
  '3 gün üst üste ≥ 1400 kcal yendi',
  '3 gün üst üste baş dönmesi yok',
  'Nabız ve tansiyon toparlandı',
];

/** Kaydırılmış Ekim rampası — 15 günlük refeeding'e göre */
export const ACTIVATION_DAYS = [44, 45];   // 14-15 Ekim
export const GATE_DAY = 46;                 // 16 Ekim
export const FIRST_SESSION_DAY = 47;        // 17 Ekim Cumartesi

/** Ekim ilk 3 hafta set sayısı rampası (gün 47'den itibaren hafta indeksi) */
export function setsForDay(day: number): number {
  if (day < FIRST_SESSION_DAY) return 0;
  const w = Math.floor((day - FIRST_SESSION_DAY) / 7);
  if (w === 0) return 2;
  if (w === 1) return 3;
  return 3;
}

export function getTraining(day: number): TrainingDay | null {
  if (day >= 1 && day <= 30) return SEPT[day] ?? null;
  return null;
}

export const RED_LINES_FAST = [
  'Anında dur ve otur: baş dönmesi, göz kararması, kulak çınlaması',
  'Nabız tavanı aşıldı ve 2 dk’da inmiyor',
  'Bacaklarda titreme / boşalma hissi',
  'Bulantı, soğuk terleme, nefes darlığı',
];

export const RED_LINES_STOP = [
  'Çarpıntı / düzensiz nabız / göğüs ağrısı',
  'Çift görme, göz kayması, dengesizlik, kelime bulamama',
  'Gerçek bayılma',
  'Yatarken nefes alamama, bacakta ödem',
  'İdrar kesilmesi veya koyu renk',
  'İdrar koyu kahve/kola rengi + kas ağrısı = RABDOMİYOLİZ, aynı gün acil',
];
