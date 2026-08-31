interface Props {
  pct: number;
  size?: number;
}

/** SVG ilerleme halkası — 0 KB kütüphane, compositor dostu (sadece stroke-dashoffset). */
export default function ProgressRing({ pct, size = 74 }: Props) {
  const r = (size - 8) / 2;
  const circumference = 2 * Math.PI * r;
  const offset = circumference * (1 - Math.min(100, Math.max(0, pct)) / 100);

  return (
    <div className="ring-label" style={{ width: size, height: size, position: 'relative' }}>
      <svg className="ring" width={size} height={size}>
        <circle className="track" cx={size / 2} cy={size / 2} r={r} />
        <circle
          className="bar"
          cx={size / 2}
          cy={size / 2}
          r={r}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
        />
      </svg>
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'grid',
          placeItems: 'center',
        }}
      >
        <span className="ring-pct">{pct}</span>
      </div>
    </div>
  );
}
