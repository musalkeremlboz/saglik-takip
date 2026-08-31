import { useEffect, useState } from 'react';
import { dayKey, dateFromDay, formatDate } from '../lib/date';
import { getVitals, saveVitals, type VitalsEntry } from '../db/local';

/**
 * Ölçüm ekranı — EKG olmadığı için bu ekran kritik.
 * Nabız RİTMİ alanı en önemli veri: cihaz ortalama gösterir, ritmi elle hissedersin.
 */
export default function Vitals({ day }: { day: number }) {
  const key = dayKey(day);
  const [v, setV] = useState<Partial<VitalsEntry>>({});
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    let alive = true;
    getVitals(key).then((row) => {
      if (alive) setV(row ?? {});
    });
    return () => { alive = false; };
  }, [key]);

  const update = (patch: Partial<VitalsEntry>) => {
    const next = { ...v, ...patch };
    setV(next);
    saveVitals({
      dayKey: key,
      weight: next.weight,
      pulse: next.pulse,
      rhythmRegular: next.rhythmRegular,
      systolic: next.systolic,
      diastolic: next.diastolic,
      note: next.note,
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 1200);
  };

  const num = (s: string) => (s === '' ? undefined : Number(s));

  /* uyarı eşikleri */
  const warns: string[] = [];
  if (v.pulse && v.pulse > 100) warns.push('Nabız > 100 — sürekliyse doktora git.');
  if (v.pulse && v.pulse < 45) warns.push('Nabız < 45 — ACİL.');
  if (v.rhythmRegular === false) warns.push('DÜZENSİZ NABIZ — oruç biter, acile git.');
  if (v.systolic && v.systolic < 90) warns.push('Tansiyon düşük — tuz artır, baş dönmesi varsa otur.');

  return (
    <>
      <div className="day-head">
        <span className="day-num">Gün {day}</span>
        <span className="day-date">{formatDate(dateFromDay(day))}</span>
      </div>

      <div className="alert" style={{ marginTop: 12 }}>
        <b>EKG yok — bu ekran tek kardiyak izleme katmanın.</b> Nabzı bilekten 30 saniye say,
        2 ile çarp. Ritmi <i>cihaz göstermez</i>, parmağınla hissedersin.
      </div>

      {warns.map((w, i) => (
        <div key={i} className="alert danger"><b>{w}</b></div>
      ))}

      <div className="section-title">Sabah ölçümü</div>
      <div className="card">
        <div className="field">
          <label>Kilo (kg)</label>
          <input
            type="number" inputMode="decimal" step="0.1"
            value={v.weight ?? ''}
            onChange={(e) => update({ weight: num(e.target.value) })}
          />
        </div>
        <div className="field">
          <label>Nabız (atım/dk)</label>
          <input
            type="number" inputMode="numeric"
            value={v.pulse ?? ''}
            onChange={(e) => update({ pulse: num(e.target.value) })}
          />
        </div>
        <div className="field">
          <label>Tansiyon büyük</label>
          <input
            type="number" inputMode="numeric"
            value={v.systolic ?? ''}
            onChange={(e) => update({ systolic: num(e.target.value) })}
          />
        </div>
        <div className="field">
          <label>Tansiyon küçük</label>
          <input
            type="number" inputMode="numeric"
            value={v.diastolic ?? ''}
            onChange={(e) => update({ diastolic: num(e.target.value) })}
          />
        </div>
      </div>

      <div className="section-title">Nabız ritmi</div>
      <div className="card">
        <div className="selfcheck">
          <button
            className={`sc-btn${v.rhythmRegular === true ? ' ok' : ''}`}
            onClick={() => update({ rhythmRegular: true })}
          >
            Düzenli — atışlar eşit aralıklı
          </button>
          <button
            className={`sc-btn${v.rhythmRegular === false ? ' ok' : ''}`}
            style={v.rhythmRegular === false ? { borderColor: 'var(--danger)', color: 'var(--danger)' } : undefined}
            onClick={() => update({ rhythmRegular: false })}
          >
            Düzensiz — atlama / duraklama var
          </button>
        </div>
      </div>

      {saved && (
        <div className="muted" style={{ fontSize: 11, textAlign: 'right', marginTop: 10 }}>
          kaydedildi ✓
        </div>
      )}
    </>
  );
}
