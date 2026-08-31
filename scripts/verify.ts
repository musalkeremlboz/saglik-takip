/**
 * Mantık doğrulaması — build sonrası çalıştırılır.
 * Amaç: tarih hesapları, faz sınırları ve gün aşırı filtrelerin doğruluğu.
 */
import { getPhase, getFastWeek } from '../src/data/phases';
import { getDailyPlan } from '../src/data/daily-plan';
import { dayFromDate, dateFromDay, dayKey, shiftOf } from '../src/lib/date';
import { SUPPLEMENTS, B6_UPPER_LIMIT } from '../src/data/supplements';

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

console.log(fail === 0 ? '\n✅ TÜM TESTLER GEÇTİ\n' : `\n❌ ${fail} TEST BAŞARISIZ\n`);
if (fail > 0) process.exit(1);
