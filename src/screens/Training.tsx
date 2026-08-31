import { useEffect, useState, useCallback } from 'react';
import {
  BLOCKS, getTraining, M_BLOCK, M_RULE, N_BLOCK, N_RULE, K_BLOCK, K_RULE,
  WALK_RULES, LADDERS, LADDER_RULE, SESSIONS, WEEKLY_SPLIT, RETURN_GATE,
  ACTIVATION_DAYS, GATE_DAY, FIRST_SESSION_DAY, setsForDay,
  RED_LINES_FAST, RED_LINES_STOP, type BlockId,
} from '../data/training';
import { getPhase } from '../data/phases';
import { dayKey, dateFromDay, formatDate } from '../lib/date';
import {
  getTrainingEntry, toggleBlock, saveTrainingEntry,
  getAllLadderProgress, setLadderStep, type LadderProgress,
} from '../db/local';

export default function Training({ day }: { day: number }) {
  const key = dayKey(day);
  const phase = getPhase(day);
  const [done, setDone] = useState<string[]>([]);
  const [walk, setWalk] = useState<number | undefined>();
  const [postPulse, setPostPulse] = useState<number | undefined>();
  const [neuroOk, setNeuroOk] = useState<boolean | undefined>();
  const [ladders, setLadders] = useState<Record<string, LadderProgress>>({});
  const [openLadder, setOpenLadder] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    Promise.all([getTrainingEntry(key), getAllLadderProgress()]).then(([t, l]) => {
      if (!alive) return;
      setDone(t?.done ?? []);
      setWalk(t?.walkMin);
      setPostPulse(t?.postPulse);
      setNeuroOk(t?.neuroOk);
      setLadders(l);
    });
    return () => { alive = false; };
  }, [key]);

  const tap = useCallback(async (id: string) => {
    const next = await toggleBlock(key, id);
    setDone(next);
    if (navigator.vibrate) navigator.vibrate(8);
  }, [key]);

  const persist = (patch: Partial<{ walkMin: number; postPulse: number; neuroOk: boolean }>) => {
    const merged = { walkMin: walk, postPulse, neuroOk, ...patch };
    setWalk(merged.walkMin); setPostPulse(merged.postPulse); setNeuroOk(merged.neuroOk);
    saveTrainingEntry({ dayKey: key, done, ...merged });
  };

  const t = getTraining(day);
  const isFast = day <= 30;
  const dow = dateFromDay(day).getDay();          // 0=Paz
  const dowMon = (dow + 6) % 7;                    // 0=Pzt
  const planned = WEEKLY_SPLIT[dowMon];
  const session = SESSIONS.find((s) => s.id === planned);
  const sets = setsForDay(day);

  return (
    <>
      <div className="day-head">
        <span className="day-num">Gün {day}</span>
        <span className="day-date">{formatDate(dateFromDay(day))}</span>
      </div>
      <div style={{ marginBottom: 14 }}>
        <span className="phase-pill" style={{ color: phase.color }}>{phase.name}</span>
      </div>

      {/* ═══ ORUÇ DÖNEMİ ═══ */}
      {isFast && t && (
        <>
          {t.rest ? (
            <div className="card" style={{ textAlign: 'center', padding: 22 }}>
              <div style={{ fontSize: 30, marginBottom: 6 }}>◍</div>
              <div style={{ fontSize: 15, fontWeight: 600 }}>Dinlenme günü</div>
              {t.note && <div className="muted" style={{ fontSize: 12.5, marginTop: 6 }}>{t.note}</div>}
            </div>
          ) : (
            <>
              <div className="section-title">Bugünün blokları</div>
              <div className="card">
                {t.blocks.map((b: BlockId) => {
                  const meta = BLOCKS[b];
                  const isDone = done.includes(b);
                  const detail =
                    b === 'W' ? `${t.walkMin} dk${t.pulseCap ? ` · nabız ≤ ${t.pulseCap}` : ''}` :
                    b === 'M' ? `${t.mMin ?? 10} dk mobilite` :
                    b === 'N' ? '5 dk nefes' : '~6 dk · setler arası 90 sn';
                  return (
                    <div key={b} className={`item${isDone ? ' done' : ''}`}>
                      <span className="item-time" style={{ color: meta.color, fontWeight: 700 }}>{meta.short}</span>
                      <div className="item-body">
                        <div className="item-label">{meta.name}</div>
                        <div className="item-note">{detail}</div>
                      </div>
                      <button className={`tick ${isDone ? 'full' : 'none'}`} onClick={() => tap(b)}>✓</button>
                    </div>
                  );
                })}
              </div>
              {t.note && <div className="alert" style={{ marginTop: 10 }}><b>{t.note}</b></div>}
            </>
          )}

          {t.neuro && (
            <>
              <div className="section-title">Nörolojik kontrol — yürüyüşten önce</div>
              <div className="muted" style={{ fontSize: 12, marginBottom: 8, lineHeight: 1.45 }}>
                Parmağı gözle takip et (çift görme?) · 5 adım düz yürü (denge?) ·
                bugünün tarihini ve son 3 yaptığın şeyi söyle (bulanık?).
                <b style={{ color: 'var(--danger)' }}> Biri bile pozitifse yürüyüş yok, oruç biter, acile git.</b>
              </div>
              <div className="card">
                <div className="selfcheck">
                  <button className={`sc-btn${neuroOk === true ? ' ok' : ''}`}
                    onClick={() => persist({ neuroOk: true })}>Üçü de temiz</button>
                  <button className={`sc-btn${neuroOk === false ? ' ok' : ''}`}
                    style={neuroOk === false ? { borderColor: 'var(--danger)', color: 'var(--danger)' } : undefined}
                    onClick={() => persist({ neuroOk: false })}>Biri pozitif — DUR</button>
                </div>
              </div>
            </>
          )}

          {t.blocks.includes('W') && (
            <>
              <div className="section-title">Yürüyüş kaydı</div>
              <div className="card">
                <div className="field">
                  <label>Gerçek süre (dk)</label>
                  <input type="number" inputMode="numeric" value={walk ?? ''}
                    onChange={(e) => persist({ walkMin: e.target.value === '' ? undefined : Number(e.target.value) })} />
                </div>
                <div className="field">
                  <label>Sonrası nabız</label>
                  <input type="number" inputMode="numeric" value={postPulse ?? ''}
                    onChange={(e) => persist({ postPulse: e.target.value === '' ? undefined : Number(e.target.value) })} />
                </div>
              </div>
              {t.pulseCap && postPulse && postPulse > t.pulseCap && (
                <div className="alert danger"><b>Nabız tavanı aşıldı ({postPulse} &gt; {t.pulseCap}).</b> Otur, 2 dk’da inmiyorsa bugün bitti.</div>
              )}
            </>
          )}
        </>
      )}

      {/* ═══ REFEEDING ═══ */}
      {day >= 31 && day <= 45 && (
        <>
          <div className="alert danger">
            <b>Refeeding — antrenman YOK.</b> Bu 15 gün toparlanma. Direnç hareketi
            rabdomiyoliz riski taşır. Sadece hafif yürüyüş ve mobilite.
          </div>
          {ACTIVATION_DAYS.includes(day) && (
            <div className="alert">
              <b>Aktivasyon Seti.</b> Antrenman değil, sinyal: duvar şınavı 2×5,
              sit-to-stand 2×5, kalça köprüsü 2×8. Yorulma yok.
            </div>
          )}
          {day === GATE_DAY && (
            <>
              <div className="section-title">Dönüş kapısı — 5 şart</div>
              <div className="muted" style={{ fontSize: 12, marginBottom: 8 }}>
                Beşi de sağlanmadan gerçek antrenman başlamaz.
              </div>
              <div className="card">
                {RETURN_GATE.map((g, i) => (
                  <div key={i} className="item" style={{ minHeight: 0 }}>
                    <span className="item-time">{i + 1}</span>
                    <div className="item-body"><div className="item-label" style={{ fontSize: 13.5 }}>{g}</div></div>
                  </div>
                ))}
              </div>
            </>
          )}
          <div className="section-title">Serbest hareket</div>
          <div className="card">
            {(['W', 'M', 'N'] as BlockId[]).map((b) => {
              const isDone = done.includes(b);
              return (
                <div key={b} className={`item${isDone ? ' done' : ''}`}>
                  <span className="item-time" style={{ color: BLOCKS[b].color, fontWeight: 700 }}>{BLOCKS[b].short}</span>
                  <div className="item-body"><div className="item-label">{BLOCKS[b].name}</div></div>
                  <button className={`tick ${isDone ? 'full' : 'none'}`} onClick={() => tap(b)}>✓</button>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* ═══ ANTRENMAN DÖNEMİ ═══ */}
      {day >= FIRST_SESSION_DAY && (
        <>
          <div className="section-title">Bugünün seansı</div>
          {planned === 'rest' ? (
            <div className="card" style={{ textAlign: 'center', padding: 22 }}>
              <div style={{ fontSize: 30, marginBottom: 6 }}>◍</div>
              <div style={{ fontSize: 15, fontWeight: 600 }}>Tam dinlenme</div>
              <div className="muted" style={{ fontSize: 12.5, marginTop: 6 }}>
                Perşembe — eve 23:00 geliyorsun. Toparlanma bu programın darboğazı.
              </div>
            </div>
          ) : planned === 'walk' ? (
            <div className="card">
              <div className="item">
                <span className="item-time" style={{ color: BLOCKS.W.color, fontWeight: 700 }}>W</span>
                <div className="item-body">
                  <div className="item-label">Yürüyüş + mobilite</div>
                  <div className="item-note">Pazar — aktif toparlanma</div>
                </div>
                <button className={`tick ${done.includes('W') ? 'full' : 'none'}`} onClick={() => tap('W')}>✓</button>
              </div>
            </div>
          ) : session ? (
            <>
              <div className="card">
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                  <b style={{ fontSize: 15 }}>{session.name}</b>
                  <span className="muted" style={{ fontSize: 12 }}>{session.duration} · {sets} set</span>
                </div>
                {session.movements.map((m) => {
                  const lad = LADDERS.find((l) => l.id === m.ladder)!;
                  const prog = ladders[m.ladder]?.step ?? 0;
                  const step = lad.steps[Math.min(prog, lad.steps.length - 1)];
                  const isDone = done.includes(`${session.id}:${m.ladder}`);
                  return (
                    <div key={m.ladder} className={`item${isDone ? ' done' : ''}`}>
                      <span className="item-time" style={{ fontSize: 15 }}>{lad.icon}</span>
                      <div className="item-body">
                        <div className="item-label">{step.tr}</div>
                        <div className="item-note">
                          Basamak {prog + 1}/{lad.steps.length} · {sets} × {step.target.split('×')[1]?.trim() ?? step.target}
                        </div>
                      </div>
                      <button className={`tick ${isDone ? 'full' : 'none'}`}
                        onClick={() => tap(`${session.id}:${m.ladder}`)}>✓</button>
                    </div>
                  );
                })}
              </div>
              {sets === 2 && (
                <div className="alert" style={{ marginTop: 10 }}>
                  <b>Tanışma haftası — 2 set.</b> Ağırlaştırma. Kas ağrısı hedefin değil.
                </div>
              )}
            </>
          ) : null}
        </>
      )}

      {/* ═══ HAREKET MERDİVENLERİ (her zaman görünür) ═══ */}
      <div className="section-title">Hareket merdivenleri</div>
      <div className="muted" style={{ fontSize: 12, marginBottom: 8, lineHeight: 1.45 }}>
        {LADDER_RULE}
      </div>
      <div className="card">
        {LADDERS.map((lad) => {
          const prog = ladders[lad.id]?.step ?? 0;
          const open = openLadder === lad.id;
          return (
            <div key={lad.id} style={{ borderBottom: '1px solid var(--border)', paddingBottom: open ? 10 : 0 }}>
              <div className="item" style={{ borderBottom: 'none' }}
                onClick={() => setOpenLadder(open ? null : lad.id)}>
                <span className="item-time" style={{ fontSize: 15 }}>{lad.icon}</span>
                <div className="item-body">
                  <div className="item-label">{lad.name}</div>
                  <div className="item-note">
                    Şu an: <b style={{ color: 'var(--accent)' }}>{lad.steps[prog].tr}</b> · {lad.steps[prog].target}
                  </div>
                </div>
                <span className="muted" style={{ fontSize: 15 }}>{open ? '▴' : '▾'}</span>
              </div>
              {open && (
                <div style={{ paddingLeft: 54 }}>
                  {lad.steps.map((s, i) => (
                    <button key={i} className="sc-btn"
                      style={{
                        width: '100%', marginBottom: 6,
                        borderColor: i === prog ? 'var(--accent)' : undefined,
                        color: i === prog ? 'var(--accent)' : undefined,
                      }}
                      onClick={async () => {
                        await setLadderStep(lad.id, i);
                        setLadders((p) => ({ ...p, [lad.id]: { ladderId: lad.id, step: i, hits: 0, updatedAt: Date.now() } }));
                      }}>
                      <div style={{ textAlign: 'left' }}>
                        <div style={{ fontSize: 13.5 }}>{i + 1}. {s.tr} <span className="muted">· {s.target}</span></div>
                        <div className="muted" style={{ fontSize: 11, marginTop: 2 }}>{s.how}</div>
                      </div>
                    </button>
                  ))}
                  {lad.bridge && <div className="alert" style={{ fontSize: 12 }}>{lad.bridge}</div>}
                  {lad.warning && <div className="alert danger" style={{ fontSize: 12 }}>{lad.warning}</div>}
                  <div className="muted" style={{ fontSize: 11.5, lineHeight: 1.45, margin: '8px 0 4px' }}>
                    <b>Form:</b> {lad.formLock}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* ═══ BLOK İÇERİKLERİ (oruç dönemi) ═══ */}
      {isFast && (
        <>
          <Detail title="M Bloğu — Mobilite" rule={M_RULE}
            rows={M_BLOCK.map((x) => [x.tr, x.dose, x.en])} />
          <Detail title="N Bloğu — Nefes" rule={N_RULE}
            rows={N_BLOCK.map((x) => [x.tr, x.dose, x.when])} />
          {day <= 14 && (
            <Detail title="K Bloğu — Mikro doz" rule={K_RULE}
              rows={K_BLOCK.map((x) => [x.tr, x.dose, x.note])} />
          )}
          <div className="section-title">Yürüyüş kuralları</div>
          <div className="card">
            {WALK_RULES.map((r, i) => (
              <div key={i} className="item" style={{ minHeight: 0 }}>
                <span className="item-time">·</span>
                <div className="item-body"><div className="item-label" style={{ fontSize: 13 }}>{r}</div></div>
              </div>
            ))}
          </div>
        </>
      )}

      <div className="section-title" style={{ color: 'var(--danger)' }}>Kırmızı çizgiler</div>
      <div className="card">
        <div style={{ fontSize: 12.5, fontWeight: 600, marginBottom: 6 }}>Anında dur ve otur</div>
        {RED_LINES_FAST.map((r, i) => (
          <div key={i} className="muted" style={{ fontSize: 12, padding: '3px 0' }}>· {r}</div>
        ))}
        <div style={{ fontSize: 12.5, fontWeight: 600, margin: '12px 0 6px', color: 'var(--danger)' }}>
          Oruç biter, acile git
        </div>
        {RED_LINES_STOP.map((r, i) => (
          <div key={i} style={{ fontSize: 12, padding: '3px 0', color: 'var(--danger)', opacity: 0.85 }}>· {r}</div>
        ))}
      </div>
    </>
  );
}

function Detail({ title, rule, rows }: { title: string; rule: string; rows: (string | undefined)[][] }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <div className="section-title" style={{ cursor: 'pointer' }} onClick={() => setOpen(!open)}>
        {title} {open ? '▴' : '▾'}
      </div>
      {open && (
        <div className="card">
          {rows.map((r, i) => (
            <div key={i} className="item" style={{ minHeight: 0 }}>
              <div className="item-body">
                <div className="item-label" style={{ fontSize: 13.5 }}>{r[0]}</div>
                <div className="item-note">{r[1]}{r[2] ? ` · ${r[2]}` : ''}</div>
              </div>
            </div>
          ))}
          <div className="muted" style={{ fontSize: 11.5, lineHeight: 1.45, marginTop: 8 }}>{rule}</div>
        </div>
      )}
    </>
  );
}
