/**
 * Mantık doğrulaması — build sonrası çalıştırılır.
 * Amaç: tarih hesapları, faz sınırları ve gün aşırı filtrelerin doğruluğu.
 */
import { getPhase, getFastWeek } from '../src/data/phases';
import { getDailyPlan } from '../src/data/daily-plan';
import { dayFromDate, dateFromDay, dayKey, shiftOf } from '../src/lib/date';
import { SUPPLEMENTS, B6_UPPER_LIMIT } from '../src/data/supplements';
import {
  getTraining, LADDERS, WEEKLY_SPLIT, SESSIONS, setsForDay,
  FIRST_SESSION_DAY, GATE_DAY, ACTIVATION_DAYS, START_STEP, HITS_TO_ADVANCE,
} from '../src/data/training';

let fail = 0;
function check(name: string, cond: boolean, detail = '') {
  if (cond) console.log(`  ok   ${name}`);
  else { console.log(`  FAIL ${name} ${detail}`); fail++; }
}

console.log('\n== Tarih ==');
check('Gün 1 = 1 Eylül 2026 Salı',
  dateFromDay(1).getDate() === 1 && dateFromDay(1).getMonth() === 8 && dateFromDay(1).getDay() === 2);
check('Gün 30 = 30 Eylül Çarşamba',
  dateFromDay(30).getDate() === 30 && dateFromDay(30).getDay() === 3);
check('Gün 31 = 1 Ekim Perşembe',
  dateFromDay(31).getDate() === 1 && dateFromDay(31).getMonth() === 9 && dateFromDay(31).getDay() === 4);
check('Gün 45 = 15 Ekim (refeeding sonu)',
  dateFromDay(45).getDate() === 15 && dateFromDay(45).getMonth() === 9);
check('Gün 46 = 16 Ekim (kilo verme başlar)',
  dateFromDay(46).getDate() === 16 && dateFromDay(46).getMonth() === 9);
check('dayKey formatı', dayKey(1) === '2026-09-01', dayKey(1));
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
check('1 Eylül Salı → izinli', shiftOf(dateFromDay(1)) === 'izinli');
check('2 Eylül Çarşamba → geç vardiya', shiftOf(dateFromDay(2)) === 'gec');
check('1 Ekim Perşembe (refeeding g1) → geç vardiya',
  shiftOf(dateFromDay(31)) === 'gec');

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

console.log('\n== Antrenman: Eylül ==');
const sept = Array.from({ length: 30 }, (_, i) => i + 1);
check('30 günün hepsinde plan var', sept.every(d => getTraining(d) !== null));
check('K Bloğu sadece gün ≤14',
  sept.every(d => !(getTraining(d)?.blocks.includes('K')) || d <= 14));
check('Gün 15+ nörolojik kontrol açık',
  sept.filter(d => d >= 15).every(d => getTraining(d)?.neuro === true));
check('Nabız tavanı H1-2 = 110',
  [2,4,5,7,8,10,12,14].every(d => (getTraining(d)?.pulseCap ?? 110) === 110));
check('Nabız tavanı H3-4 = 100',
  [15,17,19,21,22,24,26].every(d => getTraining(d)?.pulseCap === 100));
check('Gün 30 hareket yok', getTraining(30)?.rest === true);
check('Yürüyüş zirvesi 25 dk (gün 10,12)',
  getTraining(10)?.walkMin === 25 && getTraining(12)?.walkMin === 25);
check('Hafta 4 yürüyüş azalıyor', (getTraining(24)?.walkMin ?? 99) <= 15);

console.log('\n== Antrenman: rampa — 15 gunluk refeeding ==');
check('Refeeding boyunca seans yok', FIRST_SESSION_DAY > 45, `ilk seans gün ${FIRST_SESSION_DAY}`);
check('Kapı günü = refeeding bitişi', GATE_DAY === 46);
check('Aktivasyon refeeding içinde', ACTIVATION_DAYS.every(d => d >= 31 && d <= 45));
check('İlk seans 17 Ekim Cumartesi',
  dateFromDay(FIRST_SESSION_DAY).getDate() === 17 && dateFromDay(FIRST_SESSION_DAY).getDay() === 6);
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

console.log(fail === 0 ? '\n✅ TÜM TESTLER GEÇTİ\n' : `\n❌ ${fail} TEST BAŞARISIZ\n`);
if (fail > 0) process.exit(1);
