import { useEffect, useState, useCallback } from 'react';
import {
  BLOCKS, getTraining, M_RULE, N_RULE, K_RULE,
  LADDERS, SESSIONS, WEEKLY_SPLIT, RETURN_GATE,
  ACTIVATION_DAYS, GATE_DAY, FIRST_SESSION_DAY, setsForDay,
  RED_LINES_FAST, RED_LINES_STOP, START_STEP, HITS_TO_ADVANCE,
  getBlockItems, itemKey, type BlockId,
} from '../data/training';
import { getPhase } from '../data/phases';
import { dayKey, dateFromDay, formatDate } from '../lib/date';
import {
  getTrainingEntry, toggleBlock, saveTrainingEntry,
  getAllLadderProgress, reportLadderResult, type LadderProgress,
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
  const [toast, setToast] = useState<string | null>(null);

  /** Basamağı PROGRAM belirler: kayıt yoksa plandaki başlangıç basamağı. */
  const stepOf = (id: string) => ladders[id]?.step ?? START_STEP[id] ?? 0;
  const hitsOf = (id: string) => ladders[id]?.hits ?? 0;

  const report = async (ladderId: string, hit: boolean) => {
    const lad = LADDERS.find((l) => l.id === ladderId)!;
    const r = await reportLadderResult(
      ladderId, hit, START_STEP[ladderId] ?? 0, lad.steps.length - 1, HITS_TO_ADVANCE,
    );
    setLadders((p) => ({ ...p, [ladderId]: { ladderId, step: r.step, hits: r.hits, updatedAt: Date.now() } }));
    if (r.advanced) {
      setToast(`${lad.name}: yeni basamak → ${lad.steps[r.step].tr}`);
      if (navigator.vibrate) navigator.vibrate([10, 40, 10]);
    } else if (hit) {
      setToast(`Kaydedildi · ${HITS_TO_ADVANCE - r.hits} seans sonra basamak yükselir`);
    } else {
      setToast('Kaydedildi · aynı basamakta kalıyoruz');
    }
    setTimeout(() => setToast(null), 2600);
  };

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

  /**
   * Blok içi hareket işaretleme.
   * Kural: son hareket de işaretlenince BLOK OTOMATİK tamamlanır;
   * işaretli hareket geri alınırsa blok da otomatik açılır.
   * Böylece "blok tikli ama içi boş" gibi tutarsız bir durum oluşamaz.
   */
  const tapItem = useCallback(async (block: BlockId, i: number, total: number) => {
    const k = itemKey(block, i);
    const has = done.includes(k);
    let next = has ? done.filter((x) => x !== k) : [...done, k];

    const checked = Array.from({ length: total }, (_, n) => itemKey(block, n))
      .filter((ik) => next.includes(ik)).length;
    const complete = checked === total;

    if (complete && !next.includes(block)) next = [...next, block];
    if (!complete && next.includes(block)) next = next.filter((x) => x !== block);

    setDone(next);
    await saveTrainingEntry({ dayKey: key, done: next, walkMin: walk, postPulse, neuroOk });
    if (navigator.vibrate) navigator.vibrate(complete && !has ? [10, 40, 10] : 8);
  }, [done, key, walk, postPulse, neuroOk]);

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
              {t.blocks.map((b: BlockId) => {
                const meta = BLOCKS[b];
                const items = getBlockItems(b, day, t);
                const doneCount = items.filter((_, i) => done.includes(itemKey(b, i))).length;
                const isDone = done.includes(b);
                const detail =
                  b === 'W' ? `${t.walkMin} dk${t.pulseCap ? ` · nabız ≤ ${t.pulseCap}` : ''}` :
                  b === 'M' ? `${t.mMin ?? 10} dk mobilite` :
                  b === 'N' ? '5 dk nefes' : '~6 dk · setler arası 90 sn';
                return (
                  <div className="card" key={b} style={{ marginBottom: 10 }}>
                    {/* Blok başlığı — tik hareketlerden otomatik gelir, elle de basılabilir */}
                    <div className={`item${isDone ? ' done' : ''}`} style={{ paddingTop: 0 }}>
                      <span className="item-time" style={{ color: meta.color, fontWeight: 700, fontSize: 13 }}>
                        {meta.short}
                      </span>
                      <div className="item-body">
                        <div className="item-label" style={{ fontWeight: 600 }}>{meta.name}</div>
                        <div className="item-note">
                          {detail} · <span style={{ color: doneCount === items.length ? 'var(--ok)' : undefined }}>
                            {doneCount}/{items.length}
                          </span>
                        </div>
                      </div>
                      <button className={`tick ${isDone ? 'full' : 'none'}`} onClick={() => tap(b)}>✓</button>
                    </div>

                    {/* Blok içi hareketler */}
                    {items.map((it, i) => {
                      const ik = itemKey(b, i);
                      const checked = done.includes(ik);
                      return (
                        <div key={ik} className={`item${checked ? ' done' : ''}`}
                          style={{ paddingLeft: 42, minHeight: 44 }}>
                          <div className="item-body">
                            <div className="item-label" style={{ fontSize: 13.5 }}>
                              {it.tr} <span className="muted" style={{ fontSize: 12 }}>· {it.dose}</span>
                            </div>
                            {it.note && <div className="item-note">{it.note}</div>}
                          </div>
                          <button className={`tick ${checked ? 'full' : 'none'}`}
                            onClick={() => tapItem(b, i, items.length)}
                            aria-label={it.tr}>✓</button>
                        </div>
                      );
                    })}
                  </div>
                );
              })}
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
          {(['W', 'M', 'N'] as BlockId[]).map((b) => {
            const items = getBlockItems(b, day, { blocks: [], walkMin: 15 });
            const doneCount = items.filter((_, i) => done.includes(itemKey(b, i))).length;
            const isDone = done.includes(b);
            return (
              <div className="card" key={b} style={{ marginBottom: 10 }}>
                <div className={`item${isDone ? ' done' : ''}`} style={{ paddingTop: 0 }}>
                  <span className="item-time" style={{ color: BLOCKS[b].color, fontWeight: 700, fontSize: 13 }}>
                    {BLOCKS[b].short}
                  </span>
                  <div className="item-body">
                    <div className="item-label" style={{ fontWeight: 600 }}>{BLOCKS[b].name}</div>
                    <div className="item-note">
                      <span style={{ color: doneCount === items.length ? 'var(--ok)' : undefined }}>
                        {doneCount}/{items.length}
                      </span>
                    </div>
                  </div>
                  <button className={`tick ${isDone ? 'full' : 'none'}`} onClick={() => tap(b)}>✓</button>
                </div>
                {items.map((it, i) => {
                  const ik = itemKey(b, i);
                  const checked = done.includes(ik);
                  return (
                    <div key={ik} className={`item${checked ? ' done' : ''}`}
                      style={{ paddingLeft: 42, minHeight: 44 }}>
                      <div className="item-body">
                        <div className="item-label" style={{ fontSize: 13.5 }}>
                          {it.tr} <span className="muted" style={{ fontSize: 12 }}>· {it.dose}</span>
                        </div>
                        {it.note && <div className="item-note">{it.note}</div>}
                      </div>
                      <button className={`tick ${checked ? 'full' : 'none'}`}
                        onClick={() => tapItem(b, i, items.length)} aria-label={it.tr}>✓</button>
                    </div>
                  );
                })}
              </div>
            );
          })}
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
                  const prog = stepOf(m.ladder);
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
        Basamağı <b>program belirler</b>, sen seçmezsin. Seans sonrası tek soru var:
        hedefi tutturdun mu? İki seans üst üste tutturursan bir üst basamağa geçer.
        Tutturamazsan aynı basamakta kalır — bu gerileme değil, plan böyle.
      </div>
      <div className="card">
        {LADDERS.map((lad) => {
          const prog = stepOf(lad.id);
          const hits = hitsOf(lad.id);
          const open = openLadder === lad.id;
          return (
            <div key={lad.id} style={{ borderBottom: '1px solid var(--border)', paddingBottom: open ? 10 : 0 }}>
              <div className="item" style={{ borderBottom: 'none' }}
                onClick={() => setOpenLadder(open ? null : lad.id)}>
                <span className="item-time" style={{ fontSize: 15 }}>{lad.icon}</span>
                <div className="item-body">
                  <div className="item-label">{lad.name}</div>
                  <div className="item-note">
                    Basamak {prog + 1}/{lad.steps.length} · <b style={{ color: 'var(--accent)' }}>{lad.steps[prog].tr}</b> · {lad.steps[prog].target}
                  </div>
                </div>
                <span className="muted" style={{ fontSize: 15 }}>{open ? '▴' : '▾'}</span>
              </div>
              {open && (
                <div style={{ paddingLeft: 54 }}>
                  {/* Basamağı PROGRAM belirler — liste bilgi amaçlı, tıklanmaz. */}
                  {lad.steps.map((s, i) => {
                    const state = i < prog ? 'done' : i === prog ? 'now' : 'next';
                    return (
                      <div key={i} style={{
                        display: 'flex', gap: 9, alignItems: 'flex-start',
                        padding: '7px 0', opacity: state === 'next' ? 0.4 : 1,
                      }}>
                        <span style={{
                          fontSize: 12, minWidth: 16, paddingTop: 1,
                          color: state === 'now' ? 'var(--accent)' : state === 'done' ? 'var(--ok)' : 'var(--fg-dim)',
                        }}>{state === 'done' ? '✓' : state === 'now' ? '▸' : i + 1}</span>
                        <div>
                          <div style={{
                            fontSize: 13.5,
                            color: state === 'now' ? 'var(--accent)' : undefined,
                            fontWeight: state === 'now' ? 600 : 400,
                          }}>
                            {s.tr} <span className="muted" style={{ fontWeight: 400 }}>· {s.target}</span>
                          </div>
                          <div className="muted" style={{ fontSize: 11, marginTop: 2 }}>{s.how}</div>
                        </div>
                      </div>
                    );
                  })}

                  {/* Seans sonrası tek soru — basamak kararını uygulama verir. */}
                  {day >= FIRST_SESSION_DAY && (
                    <>
                      <div className="muted" style={{ fontSize: 11.5, margin: '10px 0 6px', lineHeight: 1.45 }}>
                        Bugünkü seansta <b>{lad.steps[prog].target}</b> hedefini form bozulmadan tutturdun mu?
                        {hits > 0 && ` · ${HITS_TO_ADVANCE - hits} seans kaldı`}
                      </div>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button className="sc-btn" style={{ flex: 1, justifyContent: 'center' }}
                          onClick={() => report(lad.id, true)}>Tutturdum</button>
                        <button className="sc-btn" style={{ flex: 1, justifyContent: 'center' }}
                          onClick={() => report(lad.id, false)}>Tutturamadım</button>
                      </div>
                    </>
                  )}
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

      {/* Blok kuralları — hareketler yukarıda listelendiği için burada sadece kurallar */}
      {isFast && !t?.rest && (
        <div className="muted" style={{ fontSize: 11.5, lineHeight: 1.5, marginTop: 12 }}>
          {t?.blocks.includes('M') && <p style={{ margin: '0 0 6px' }}><b>M:</b> {M_RULE}</p>}
          {t?.blocks.includes('N') && <p style={{ margin: '0 0 6px' }}><b>N:</b> {N_RULE}</p>}
          {t?.blocks.includes('K') && <p style={{ margin: '0 0 6px' }}><b>K:</b> {K_RULE}</p>}
        </div>
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

      {toast && (
        <div style={{
          position: 'fixed', left: 14, right: 14,
          bottom: 'calc(var(--tabbar-h) + var(--safe-b) + 14px)',
          background: 'var(--surface-2)', border: '1px solid var(--accent)',
          borderRadius: 'var(--r)', padding: '11px 14px',
          fontSize: 13, textAlign: 'center', zIndex: 50,
          boxShadow: '0 6px 24px rgba(0,0,0,.4)',
        }}>{toast}</div>
      )}
    </>
  );
}
