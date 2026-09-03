/**
 * Mantık doğrulaması — build sonrası çalıştırılır.
 * Amaç: tarih hesapları, faz sınırları ve gün aşırı filtrelerin doğruluğu.
 */
import { getPhase, getFastWeek } from '../src/data/phases';
import { getDailyPlan } from '../src/data/daily-plan';
import { dayFromDate, dateFromDay, dayKey, shiftOf } from '../src/lib/date';
import { SUPPLEMENTS, B6_UPPER_LIMIT } from '../src/data/supplements';
import { existsSync, readFileSync } from 'node:fs';
import {
  getTraining, LADDERS, WEEKLY_SPLIT, SESSIONS, setsForDay,
  FIRST_SESSION_DAY, GATE_DAY, ACTIVATION_DAYS, START_STEP, HITS_TO_ADVANCE,
  getBlockItems, itemKey,
} from '../src/data/training';

let fail = 0;
function check(name: string, cond: boolean, detail = '') {
  if (cond) console.log(`  ok   ${name}`);
  else { console.log(`  FAIL ${name} ${detail}`); fail++; }
}

console.log('\n== Tarih ==');
check('Gün 1 = 4 Eylül 2026 Cuma',
  dateFromDay(1).getDate() === 4 && dateFromDay(1).getMonth() === 8 && dateFromDay(1).getDay() === 5);
check('Gün 30 = 3 Ekim Cumartesi',
  dateFromDay(30).getDate() === 3 && dateFromDay(30).getMonth() === 9 && dateFromDay(30).getDay() === 6);
check('Gün 31 = 4 Ekim Pazar',
  dateFromDay(31).getDate() === 4 && dateFromDay(31).getMonth() === 9 && dateFromDay(31).getDay() === 0);
check('Gün 45 = 18 Ekim (refeeding sonu)',
  dateFromDay(45).getDate() === 18 && dateFromDay(45).getMonth() === 9);
check('Gün 46 = 19 Ekim (kilo verme başlar)',
  dateFromDay(46).getDate() === 19 && dateFromDay(46).getMonth() === 9);
check('dayKey formatı', dayKey(1) === '2026-09-04', dayKey(1));
check('dayFromDate tersine çalışıyor', dayFromDate(dateFromDay(17)) === 17);

console.log('\n== Faz sınırları ==');
check('Gün 1 → oruç', getPhase(1).id === 'oruc');
check('Gün 30 → oruç', getPhase(30).id === 'oruc');
check('Gün 31 → refeeding', getPhase(31).id === 'refeeding');
check('Gün 45 → refeeding', getPhase(45).id === 'refeeding');
check('Gün 46 → kilo-verme', getPhase(46).id === 'kilo-verme');

console.log('\n== Kritik haftalar ==');
check('Gün 18 tiamin kritik bölgede', getFastWeek(18)?.critical === true);
check('Gün 10 kritik değil', !getFastWeek(10)?.critical);

console.log('\n== Vardiya (Musa beyanı) ==');
check('Gün 1 (4 Eylül Cum) → geç vardiya', shiftOf(dateFromDay(1)) === 'gec');
check('Gün 5 (8 Eylül Salı) → izinli — TAHLİL GÜNÜ', shiftOf(dateFromDay(5)) === 'izinli');
check('Refeeding g1 (4 Ekim Paz) → eve 18:00 (23:00 DEĞİL)',
  shiftOf(dateFromDay(31)) === 'normal');
check('Refeeding g2-3 (5-6 Ekim Pzt/Salı) → İZİNLİ',
  shiftOf(dateFromDay(32)) === 'izinli' && shiftOf(dateFromDay(33)) === 'izinli');

console.log('\n== Gün aşırı filtre ==');
const odd = getDailyPlan('oruc', 3).map(i => i.key);
const even = getDailyPlan('oruc', 4).map(i => i.key);
check('Tek günde picozinc YOK', !odd.includes('picozinc'));
check('Çift günde picozinc var', even.includes('picozinc'));
check('Oruçta multivitamin YOK (B6 tavanı)',
  !odd.includes('multivitamin') && !even.includes('multivitamin'));
check('Kilo vermede multivitamin VAR',
  getDailyPlan('kilo-verme', 50).some(i => i.key === 'multivitamin'));
check('Kilo vermede B Complex YOK (B6 tavanı)',
  !getDailyPlan('kilo-verme', 50).some(i => i.key === 'b-complex'));

console.log('\n== B6 tavanı (EFSA UL 12 mg) ==');
const b6day = (phase: 'oruc' | 'refeeding' | 'kilo-verme', day: number) =>
  getDailyPlan(phase, day)
    .filter(i => !i.optional && i.supplement)
    .reduce((s, i) => s + (SUPPLEMENTS[i.supplement!].b6mg ?? 0), 0);

for (const [phase, days] of [
  ['oruc', [3, 4, 17, 30]],
  ['refeeding', [31, 40, 45]],
  ['kilo-verme', [46, 60, 91]],
] as const) {
  for (const d of days) {
    const v = b6day(phase, d);
    check(`${phase} gün ${d}: B6 ${v} mg ≤ ${B6_UPPER_LIMIT}`, v <= B6_UPPER_LIMIT, `${v} mg`);
  }
}

console.log('\n== Refeeding planı ==');
const rf = getDailyPlan('refeeding', 31);
check('Tiamin kalemi var', rf.some(i => i.supplement === 'tiamin'));
check('Elektrolit "düşürme" uyarısı var',
  rf.some(i => i.key === 'elektrolit-refeed' && /DÜŞÜRME/.test(i.label)));
check('B Complex "artırma" uyarısı var',
  rf.some(i => i.key === 'b-complex' && /ARTIRMA/.test(i.label)));

console.log('\n== Tahlil gunleri izinli gune denk mi ==');
for (const d of [5, 12, 19]) {
  check(`Gun ${d} tahlil -> izinli`, shiftOf(dateFromDay(d)) === 'izinli',
    `${dateFromDay(d).toDateString()}`);
}
check('Gun 30 son gun tahlili (kaydirilamaz)', getPhase(30).id === 'oruc');

console.log('\n== Antrenman: Eylül ==');
const sept = Array.from({ length: 30 }, (_, i) => i + 1);
check('30 günün hepsinde plan var', sept.every(d => getTraining(d) !== null));
check('K Bloğu sadece gün ≤14',
  sept.every(d => !(getTraining(d)?.blocks.includes('K')) || d <= 14));
check('Gün 15+ nörolojik kontrol açık',
  sept.filter(d => d >= 15).every(d => getTraining(d)?.neuro === true));
check('Nabız tavanı H1-2 = 110',
  [2,4,6,7,8,10,13,14].every(d => (getTraining(d)?.pulseCap ?? 110) === 110));
check('Nabız tavanı H3-4 = 100',
  [15,17,20,21,22,24,26].every(d => getTraining(d)?.pulseCap === 100));
check('Gün 30 hareket yok', getTraining(30)?.rest === true);
check('Yürüyüş zirvesi 25 dk (gün 10,13)',
  getTraining(10)?.walkMin === 25 && getTraining(13)?.walkMin === 25);
check('Tahlil günleri (5,12,19) dinlenme',
  [5,12,19].every(d => getTraining(d)?.rest === true));
check('Tahlil günleri 8/15/22 Eylül SALI',
  [5,12,19].every(d => dateFromDay(d).getDay() === 2 && [8,15,22].includes(dateFromDay(d).getDate())));
check('Hafta 4 yürüyüş azalıyor', (getTraining(24)?.walkMin ?? 99) <= 15);

console.log('\n== Antrenman: rampa — 15 gunluk refeeding ==');
check('Refeeding boyunca seans yok', FIRST_SESSION_DAY > 45, `ilk seans gün ${FIRST_SESSION_DAY}`);
check('Kapı günü = refeeding bitişi', GATE_DAY === 46);
check('Aktivasyon refeeding içinde', ACTIVATION_DAYS.every(d => d >= 31 && d <= 45));
check('İlk seans 20 Ekim Salı (izinli)',
  dateFromDay(FIRST_SESSION_DAY).getDate() === 20 && dateFromDay(FIRST_SESSION_DAY).getDay() === 2);
check('Kapı günü 19 Ekim Pazartesi (izinli)',
  dateFromDay(GATE_DAY).getDate() === 19 && dateFromDay(GATE_DAY).getDay() === 1);
check('İlk hafta 2 set', setsForDay(FIRST_SESSION_DAY) === 2);
check('İkinci hafta 3 set', setsForDay(FIRST_SESSION_DAY + 7) === 3);
check('Seans öncesi 0 set', setsForDay(40) === 0);

console.log('\n== Haftalık bölünme ==');
check('Perşembe dinlenme (eve 23:00)', WEEKLY_SPLIT[3] === 'rest');
check('Çar+Cum mikro doz', WEEKLY_SPLIT[2] === 'micro' && WEEKLY_SPLIT[4] === 'micro');
check('Pzt+Salı uzun seans (izinli)', WEEKLY_SPLIT[0] === 'A' && WEEKLY_SPLIT[1] === 'B');

console.log('\n== Merdivenler ==');
check('5 merdiven var', LADDERS.length === 5);
check('Her merdivende ≥4 basamak', LADDERS.every(l => l.steps.length >= 4));
check('Çekiş merdiveninde güvenlik uyarısı var',
  !!LADDERS.find(l => l.id === 'cekis')?.warning);
check('Şınavda negatif köprüsü var', !!LADDERS.find(l => l.id === 'itis')?.bridge);
check('Seansların hepsi geçerli merdivene işaret ediyor',
  SESSIONS.every(s => s.movements.every(m => LADDERS.some(l => l.id === m.ladder))));

console.log('\n== Baslangic basamaklari (program belirler) ==');
check('Her merdivenin baslangic basamagi tanimli',
  LADDERS.every(l => START_STEP[l.id] !== undefined));
check('Baslangic basamaklari gecerli aralikta',
  LADDERS.every(l => START_STEP[l.id] >= 0 && START_STEP[l.id] < l.steps.length));
check('Itis basamak 2 (yuksek egik sinav)', START_STEP.itis === 1);
check('Squat basamak 1 (sit-to-stand)', START_STEP.squat === 0);
check('Cekis basamak 2 (kapi kolu)', START_STEP.cekis === 1);
check('Hicbiri en ust basamaktan baslamiyor',
  LADDERS.every(l => START_STEP[l.id] < l.steps.length - 1));
check('Yukseltme icin 2 ardisik basari', HITS_TO_ADVANCE === 2);

// İlerleme mantığını simüle et
function simulate(ladderId: string, results: boolean[]) {
  const lad = LADDERS.find(l => l.id === ladderId)!;
  let step = START_STEP[ladderId], hits = 0;
  for (const hit of results) {
    if (hit) {
      hits += 1;
      if (hits >= HITS_TO_ADVANCE && step < lad.steps.length - 1) { step += 1; hits = 0; }
    } else hits = 0;
  }
  return step;
}
check('2 basari -> 1 basamak yukari', simulate('itis', [true, true]) === START_STEP.itis + 1);
check('1 basari -> ayni basamak', simulate('itis', [true]) === START_STEP.itis);
check('basari-basarisiz-basari -> ayni basamak',
  simulate('itis', [true, false, true]) === START_STEP.itis);
check('Tavanda kaliyor (10 basari)',
  simulate('squat', Array(10).fill(true)) === LADDERS.find(l => l.id === 'squat')!.steps.length - 1);

console.log('\n== Blok ici hareket listeleri ==');
let allOk = true, emptyBlocks: string[] = [];
for (let d = 1; d <= 30; d++) {
  const t = getTraining(d);
  if (!t || t.rest) continue;
  for (const b of t.blocks) {
    const items = getBlockItems(b, d, t);
    if (items.length === 0) { allOk = false; emptyBlocks.push(`gun ${d} blok ${b}`); }
  }
}
check('Her blogun hareket listesi dolu', allOk, emptyBlocks.slice(0, 3).join(', '));
check('M blogu 9 hareket', getBlockItems('M', 1, getTraining(1)).length === 9);
check('N blogu 3 hareket', getBlockItems('N', 1, getTraining(1)).length === 3);
check('K blogu 4 hareket', getBlockItems('K', 5, getTraining(5)).length === 4);
check('W blogu 3 adim (hazirlik+yuruyus+soguma)',
  getBlockItems('W', 2, getTraining(2)).length === 3);
check('W blogu gunun suresini yansitiyor',
  getBlockItems('W', 10, getTraining(10))[1].dose.includes('25'));
check('W blogu nabiz tavanini yansitiyor',
  getBlockItems('W', 17, getTraining(17))[1].dose.includes('100'));
check('itemKey benzersiz', itemKey('M', 0) !== itemKey('M', 1) && itemKey('M', 0) !== itemKey('N', 0));

// Otomatik blok tamamlama mantığı
function completeSim(total: number) {
  let done: string[] = [];
  for (let i = 0; i < total; i++) {
    done = [...done, itemKey('M', i)];
    const checked = Array.from({ length: total }, (_, n) => itemKey('M', n)).filter(k => done.includes(k)).length;
    if (checked === total && !done.includes('M')) done = [...done, 'M'];
  }
  return done.includes('M');
}
check('Tum hareketler bitince blok otomatik tiklenir', completeSim(9));
// Eksik hareket bırakıldığında blok tiklenmemeli
function partialSim(total: number, skipIndex: number) {
  let done: string[] = [];
  for (let i = 0; i < total; i++) {
    if (i === skipIndex) continue;
    done = [...done, itemKey('M', i)];
    const checked = Array.from({ length: total }, (_, n) => itemKey('M', n)).filter(k => done.includes(k)).length;
    if (checked === total && !done.includes('M')) done = [...done, 'M'];
  }
  return done.includes('M');
}
check('Eksik hareket varken blok tiklenmez', partialSim(9, 4) === false);

console.log('\n== Hareket gorselleri ==');
// exercise-images.ts'i ham metin olarak oku (import.meta.env tsx'te yok)
const imgSrc = readFileSync('src/data/exercise-images.ts', 'utf8');
const slugs = [...imgSrc.matchAll(/'([^']+)':\s*'([A-Za-z0-9_\-()]+)',/g)]
  .filter(m => !m[1].includes(' — ') && !m[1].startsWith('G'))
  .map(m => ({ name: m[1], slug: m[2] }));

check('En az 25 hareket eslesti', slugs.length >= 25, `${slugs.length} adet`);

let missingFiles: string[] = [];
for (const { slug } of slugs) {
  for (const i of [0, 1]) {
    const f = `public/ex/${slug}_${i}.webp`;
    if (!existsSync(f)) missingFiles.push(f);
  }
}
check('Tum gorsel dosyalari mevcut', missingFiles.length === 0,
  missingFiles.slice(0, 3).join(', '));

// Görseli olan her hareket adı gerçekten planda geçmeli (yazım hatası yakalar)
const allNames = new Set<string>();
for (const l of LADDERS) for (const s of l.steps) allNames.add(s.tr);
for (let d = 1; d <= 30; d++) {
  const t = getTraining(d);
  if (!t || t.rest) continue;
  for (const b of t.blocks) for (const it of getBlockItems(b, d, t)) allNames.add(it.tr);
}
const orphan = slugs.filter(s => !allNames.has(s.name)).map(s => s.name);
check('Gorsel adlari planla eslesiyor', orphan.length === 0, orphan.slice(0, 3).join(', '));

console.log(fail === 0 ? '\n✅ TÜM TESTLER GEÇTİ\n' : `\n❌ ${fail} TEST BAŞARISIZ\n`);
if (fail > 0) process.exit(1);
