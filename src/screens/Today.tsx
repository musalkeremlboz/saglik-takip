import { useEffect, useState, useCallback } from 'react';
import { getPhase, getFastWeek, PHASES } from '../data/phases';
import { getDailyPlan, type PlanItem } from '../data/daily-plan';
import { SUPPLEMENTS } from '../data/supplements';
import { dayKey, dateFromDay, formatDate, shiftOf, SHIFT_LABEL, dayNameShort } from '../lib/date';
import {
  getChecksForDay, setCheck, getSelfCheck, saveSelfCheck,
  type CheckLevel, type SelfCheckEntry,
} from '../db/local';
import ProgressRing from '../components/ProgressRing';

const SC_LABELS: Array<[keyof Omit<SelfCheckEntry, 'dayKey' | 'updatedAt'>, string]> = [
  ['vision', 'Çift görme yok'],
  ['balance', 'Denge normal'],
  ['clarity', 'Zihin berrak'],
  ['rhythm', 'Nabız ritmi düzenli'],
  ['breathing', 'Nefes normal'],
];

interface Props {
  day: number;
  onChangeDay: (d: number) => void;
  today: number;
}

export default function Today({ day, onChangeDay, today }: Props) {
  const [checks, setChecks] = useState<Record<string, CheckLevel>>({});
  const [sc, setSc] = useState<Partial<SelfCheckEntry>>({});
  const key = dayKey(day);
  const phase = getPhase(day);
  const week = getFastWeek(day);
  const date = dateFromDay(day);
  const items = getDailyPlan(phase.id, day);

  useEffect(() => {
    let alive = true;
    Promise.all([getChecksForDay(key), getSelfCheck(key)]).then(([c, s]) => {
      if (!alive) return;
      setChecks(c);
      setSc(s ?? {});
    });
    return () => { alive = false; };
  }, [key]);

  const cycle = useCallback(
    (item: PlanItem) => {
      const cur = checks[item.key] ?? 'none';
      const next: CheckLevel =
        cur === 'none' ? 'full' : cur === 'full' && item.minimum ? 'min' : 'none';
      setChecks((p) => ({ ...p, [item.key]: next })); // optimistic
      setCheck(key, item.key, next);
      if (next === 'full' && navigator.vibrate) navigator.vibrate(8);
    },
    [checks, key],
  );

  const toggleSc = (field: keyof Omit<SelfCheckEntry, 'dayKey' | 'updatedAt'>) => {
    const next = { ...sc, [field]: !sc[field] };
    setSc(next);
    saveSelfCheck({
      dayKey: key,
      vision: !!next.vision, balance: !!next.balance, clarity: !!next.clarity,
      rhythm: !!next.rhythm, breathing: !!next.breathing,
    });
  };

  const required = items.filter((i) => !i.optional);
  const doneCount = required.filter((i) => checks[i.key] === 'full').length;
  const minCount = required.filter((i) => checks[i.key] === 'min').length;
  const pct = required.length ? Math.round(((doneCount + minCount * 0.5) / required.length) * 100) : 0;

  const missedCritical = required.filter(
    (i) => i.critical && (checks[i.key] ?? 'none') === 'none',
  );

  /* ─── o güne özel uyarılar ─── */
  const alerts: Array<{ text: string; danger?: boolean }> = [];
  if (day >= 1 && day <= 3)
    alerts.push({ text: '<b>Kan tahlili penceresi açık.</b> Gün 1-3 hâlâ ≈baseline sayılır. Gün 7’den sonra "nereden başladım" bilgisi kaybolur.' });
  // Tahlil günleri 5/12/19: 4 Eylül başlangıçta bunlar SALI (8/15/22 Eylül) = Musa'nın
  // izinli günü. (3 Eylül başlangıcında 6/13/20 idi; bir gün kaydı, takvim tarihi aynı kaldı.)
  if ([5, 12, 19, 30].includes(day))
    alerts.push({ text: `<b>Bugün kan tahlili günü.</b> ${day === 30 ? 'Fosfor MUTLAKA — son gün.' : 'Na, K, Mg, fosfor, kreatinin. ASM\'de EKG de iste (QT için).'}` });
  if (day >= 7 && day <= 9)
    alerts.push({ text: '<b>Elektrolit stoğu bitiyor.</b> Yeni kavanozlar geldi mi?' });
  if (week?.critical)
    alerts.push({ text: `<b>${week.label}.</b> ${week.note}` });
  if (day === 28 || day === 29)
    alerts.push({ text: '<b>Refeeding hazırlığı.</b> Termos, tiamin, alarm, mesai arkadaşına haber.' });
  if (day === 31)
    alerts.push({ danger: true, text: '<b>Refeeding gün 1 — iş günü (eve 18:00).</b> Termos protokolü. İlk lokmadan ÖNCE tiamin 100 mg. Elektroliti DÜŞÜRME.' });
  if (day === 32 || day === 33)
    alerts.push({ danger: true, text: '<b>Refeeding ilk 72 saat — İZİNLİ gün.</b> Evde kal, küçük porsiyon, 2 saatte bir. Tiamin her öğün öncesi. Günde >1 kg artış = sıvı, panik yok.' });
  if (day >= 31 && day <= 45 && day > 33)
    alerts.push({ text: '<b>Refeeding sürüyor.</b> Kalori açığı YOK. Günde >1 kg artış = sıvı tutulumu.' });

  return (
    <>
      <DayStrip day={day} today={today} onPick={onChangeDay} />

      <div className="day-head">
        <span className="day-num">Gün {day}</span>
        <span className="day-date">{formatDate(date)}</span>
      </div>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 14 }}>
        <span className="phase-pill" style={{ color: phase.color }}>{phase.name}</span>
        <span className="muted" style={{ fontSize: 12 }}>{SHIFT_LABEL[shiftOf(date)]}</span>
      </div>

      <div className="card" style={{ marginBottom: 12 }}>
        <div className="ring-wrap">
          <ProgressRing pct={pct} />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 3 }}>
              {doneCount}/{required.length} tamamlandı
            </div>
            <div className="muted" style={{ fontSize: 12, lineHeight: 1.45 }}>
              {minCount > 0 && `${minCount} minimum · `}
              {week ? week.label : phase.short}
            </div>
          </div>
        </div>
      </div>

      {alerts.map((a, i) => (
        <div key={i} className={`alert${a.danger ? ' danger' : ''}`} dangerouslySetInnerHTML={{ __html: a.text }} />
      ))}

      {missedCritical.length > 0 && day <= today && (
        <div className="alert danger">
          <b>Kritik kalem eksik:</b> {missedCritical.map((i) => i.label).join(' · ')}
        </div>
      )}

      <div className="section-title">Günlük plan</div>
      <div className="card">
        {items.map((item) => {
          const lvl = checks[item.key] ?? 'none';
          const sup = item.supplement ? SUPPLEMENTS[item.supplement] : null;
          return (
            <div key={item.key} className={`item${lvl === 'full' ? ' done' : ''}${lvl === 'min' ? ' min' : ''}${item.critical ? ' crit' : ''}`}>
              <span className="item-time">{item.time}</span>
              <div className="item-body">
                <div className="item-label">
                  {item.label}
                  {item.optional && <span className="muted" style={{ fontSize: 11 }}> · isteğe bağlı</span>}
                </div>
                {(item.note || sup?.warning) && (
                  <div className="item-note">{item.note ?? sup?.warning}</div>
                )}
                {lvl === 'min' && item.minimum && (
                  <div className="item-note" style={{ color: 'var(--warn)' }}>Minimum: {item.minimum}</div>
                )}
              </div>
              <button
                className={`tick ${lvl}`}
                onClick={() => cycle(item)}
                aria-label={item.label}
              >
                {lvl === 'min' ? '–' : '✓'}
              </button>
            </div>
          );
        })}
      </div>

      {phase.id === 'oruc' && (
        <>
          <div className="section-title">Sabah öz-kontrolü</div>
          <div className="muted" style={{ fontSize: 12, marginBottom: 8, lineHeight: 1.45 }}>
            EKG yok — bu 60 saniye tek erken uyarı sistemin. Biri bozuksa oruç biter.
          </div>
          <div className="card">
            <div className="selfcheck">
              {SC_LABELS.map(([field, label]) => (
                <button
                  key={field}
                  className={`sc-btn${sc[field] ? ' ok' : ''}`}
                  onClick={() => toggleSc(field)}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </>
      )}

      <div className="section-title">Faz takvimi</div>
      <div className="card">
        {PHASES.map((p) => (
          <div key={p.id} className="item" style={{ minHeight: 0 }}>
            <span className="item-time" style={{ color: p.color }}>
              {p.startDay}-{p.endDay}
            </span>
            <div className="item-body">
              <div className="item-label" style={{ fontSize: 13.5 }}>{p.name}</div>
              <div className="item-note">{p.description}</div>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

function DayStrip({ day, today, onPick }: { day: number; today: number; onPick: (d: number) => void }) {
  const from = Math.max(1, Math.min(day - 3, 88));
  const days = Array.from({ length: 7 }, (_, i) => from + i).filter((d) => d >= 1 && d <= 91);
  return (
    <div className="daystrip">
      {days.map((d) => {
        const dt = dateFromDay(d);
        return (
          <button
            key={d}
            className={`${d === day ? 'sel' : ''} ${d === today ? 'today' : ''}`}
            onClick={() => onPick(d)}
          >
            <span>{dayNameShort(dt)}</span>
            <span className="n">{d}</span>
          </button>
        );
      })}
    </div>
  );
}
