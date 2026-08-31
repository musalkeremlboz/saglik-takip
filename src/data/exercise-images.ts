/**
 * Hareket görselleri — free-exercise-db (Unlicense / public domain).
 * Kaynak: https://github.com/yuhonas/free-exercise-db
 *
 * ⚠️ NEDEN YAPAY ZEKÂ GÖRSELİ DEĞİL:
 * Test edildi (2026-09-01): AI'dan kedi-deve (cat-cow) istendi, "kedi" (sırt yukarı)
 * tarif edilmesine rağmen "deve" (sırt çukur) çizdi — yani hareketin tanımlayıcı
 * özelliğini ters gösterdi. Eller/parmaklar da bozuktu. Sakatlık riski taşıyan bir
 * uygulamada uydurma anatomi kabul edilemez. Bunlar gerçek insan fotoğrafları.
 *
 * Her hareket için 2 kare: [0] başlangıç, [1] bitiş pozisyonu.
 * Eşleşmesi olmayan hareketler burada YOK — yanlış görsel göstermektense hiç
 * göstermemek doğru. (Yatarak gövde rotasyonu, duvarda bacak yukarı,
 * havluyla izometrik çekiş: veri setinde güvenilir karşılığı yok.)
 */

const EX_IMAGES: Record<string, string> = {
  // ── M Bloğu (mobilite) ──
  'Kedi-deve': 'Cat_Stretch',
  'Sırtüstü 90/90 kalça esnetme': 'IT_Band_and_Glute_Stretch',
  'Diz göğse çekme': 'One_Knee_To_Chest',
  'Oturarak boyun yana esnetme': 'Side_Neck_Stretch',
  'Oturarak omuz çemberi': 'Shoulder_Circles',
  'Ayak bileği alfabe': 'Ankle_Circles',
  'Havluyla yatarak baldır esnetme': 'Calf_Stretch_Hands_Against_Wall',

  // ── K Bloğu (Eylül mikro-doz) ──
  'Duvar şınavı': 'Incline_Push-Up',
  'Sandalyeye oturup kalkma': 'Chair_Squat',
  'Kalça köprüsü': 'Butt_Lift_Bridge',
  'Ayakta duvar plank': 'Plank',

  // ── İtiş merdiveni ──
  'Yüksek eğik şınav': 'Incline_Push-Up',
  'Alçak eğik şınav': 'Incline_Push-Up_Medium',
  'Diz şınavı': 'Push-Ups_With_Feet_Elevated',
  'Tam şınav': 'Pushups',

  // ── Çekiş merdiveni ──
  'Kapı kolu ters kürek': 'Inverted_Row',
  'Masa altı ters kürek': 'Inverted_Row',
  'Ayak yükseltilmiş ters kürek': 'Inverted_Row_with_Straps',

  // ── Squat merdiveni ──
  'Kutu squat': 'Chair_Squat',
  'Serbest yarım squat': 'Bodyweight_Squat',
  'Tam derinlik squat': 'Bodyweight_Squat',

  // ── Menteşe merdiveni ──
  'Tek bacak köprü': 'Butt_Lift_Bridge',
  'Vücut ağırlığı iyi sabah': 'Hyperextensions_With_No_Hyperextension_Bench',
  'Destekli tek bacak Romen': 'Romanian_Deadlift',

  // ── Gövde merdiveni ──
  'Eğik plank': 'Plank',
  'Diz plank': 'Plank',
  'Tam plank': 'Plank',
};

/** Vite base yolu — GitHub Pages alt dizininde de çalışır. */
const BASE = import.meta.env.BASE_URL;

/** Hareketin görselleri: [başlangıç, bitiş]. Eşleşme yoksa null. */
export function exerciseImages(name: string): [string, string] | null {
  const slug = EX_IMAGES[name];
  if (!slug) return null;
  return [`${BASE}ex/${slug}_0.webp`, `${BASE}ex/${slug}_1.webp`];
}

/**
 * Bazı hareketler veri setindeki en yakın komşusuyla eşleşti — birebir aynı değil.
 * Kullanıcıya dürüst olmak için bu not görselin altında gösterilir.
 */
export const IMAGE_NOTES: Record<string, string> = {
  'Duvar şınavı': 'Görselde eğik şınav var — sen duvarda yapıyorsun, hareket aynı.',
  'Kapı kolu ters kürek': 'Görselde barla yapılıyor — sen kapı koluna havlu dolayarak yapıyorsun.',
  'Masa altı ters kürek': 'Görselde bar var — sen masa kenarını tutuyorsun.',
  'Ayak yükseltilmiş ters kürek': 'Görselde askı var — sen masa + sandalye kullanıyorsun.',
  'Ayakta duvar plank': 'Görselde yerde plank var — sen önkolların duvarda, ayakta yapıyorsun.',
  'Eğik plank': 'Görselde yerde plank var — sen önkolların masada, eğik yapıyorsun.',
  'Diz plank': 'Görselde tam plank var — sen dizlerin yerde yapıyorsun.',
  'Diz şınavı': 'Görselde ayak yükseltilmiş şınav var — sen dizlerin yerde yapıyorsun.',
  'Kutu squat': 'Görselde sandalye squat var — sen sandalyeye değip oturmadan kalkıyorsun.',
  'Serbest yarım squat': 'Görselde tam squat var — sen yarı derinlikte duruyorsun.',
  'Tek bacak köprü': 'Görselde çift bacak var — sen bir bacağı havada tutuyorsun.',
  'Destekli tek bacak Romen': 'Görselde barla yapılıyor — sen bir elin sandalyede, ağırlıksız.',
  'Vücut ağırlığı iyi sabah': 'Görselde bench var — sen ayakta, eller ensede yapıyorsun.',
  'Sırtüstü 90/90 kalça esnetme': 'Görsel benzer bir kalça esnetmesi gösteriyor.',
};
