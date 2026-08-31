import { useState } from 'react';
import { exerciseImages, IMAGE_NOTES } from '../data/exercise-images';

/**
 * Hareket adının altında açılıp kapanan form görseli.
 * İki kare yan yana: başlangıç → bitiş. Görsel yoksa hiçbir şey çizmez.
 * loading="lazy": ekrana gelmeden indirilmez (30 hareketlik listede önemli).
 */
export default function ExerciseImage({ name }: { name: string }) {
  const [open, setOpen] = useState(false);
  const imgs = exerciseImages(name);
  if (!imgs) return null;

  const note = IMAGE_NOTES[name];

  return (
    <>
      <button
        onClick={() => setOpen(!open)}
        style={{
          background: 'none',
          border: 'none',
          padding: '3px 0 0',
          color: 'var(--accent)',
          fontSize: 11.5,
          display: 'flex',
          alignItems: 'center',
          gap: 4,
        }}
      >
        <span style={{ fontSize: 12 }}>◱</span>
        {open ? 'nasıl yapılır — gizle' : 'nasıl yapılır'}
      </button>

      {open && (
        <div style={{ marginTop: 7 }}>
          <div style={{ display: 'flex', gap: 6 }}>
            {imgs.map((src, i) => (
              <figure key={src} style={{ flex: 1, margin: 0, position: 'relative' }}>
                <img
                  src={src}
                  alt={`${name} — ${i === 0 ? 'başlangıç' : 'bitiş'}`}
                  loading="lazy"
                  decoding="async"
                  style={{
                    width: '100%',
                    aspectRatio: '3 / 2',
                    objectFit: 'cover',
                    borderRadius: 'var(--r-sm)',
                    border: '1px solid var(--border)',
                    display: 'block',
                  }}
                />
                <figcaption
                  style={{
                    position: 'absolute',
                    left: 5,
                    bottom: 5,
                    fontSize: 9.5,
                    padding: '2px 6px',
                    borderRadius: 5,
                    background: 'rgba(0,0,0,.62)',
                    color: '#fff',
                  }}
                >
                  {i === 0 ? 'başlangıç' : 'bitiş'}
                </figcaption>
              </figure>
            ))}
          </div>
          {note && (
            <div className="muted" style={{ fontSize: 10.5, marginTop: 5, lineHeight: 1.4 }}>
              ⓘ {note}
            </div>
          )}
        </div>
      )}
    </>
  );
}
