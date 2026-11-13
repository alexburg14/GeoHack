import React, { useState } from 'react';

// Cumulative cost lines, styled like the Chart.js chart in the Wärme-Pakt app.
// `horizon` (in years, may be fractional) shows only the first part of the data; the long-run story
// animates it from 20 to 40 to "zoom out". `markers` label single years, e.g. a device replacement.
const W = 640;
const H = 300;
const PAD = { l: 64, r: 12, t: 12, b: 28 };

const eur = (n) => `${Math.round(n).toLocaleString('de-DE')} €`;

// Value of a series at a fractional index (linear between years).
const at = (data, f) => {
  const i = Math.min(Math.floor(f), data.length - 1);
  const j = Math.min(i + 1, data.length - 1);
  return data[i] + (data[j] - data[i]) * (f - i);
};

export default function CostChart({ years, series, horizon = years.length, markers = [], height = H }) {
  const [hover, setHover] = useState(null);
  const last = Math.max(1, Math.min(years.length, horizon) - 1);
  const visible = Math.floor(last) + 1;
  const max = Math.max(...series.map((s) => at(s.data, last)), ...series.flatMap((s) => s.data.slice(0, visible)));
  const step = max > 400000 ? 100000 : max > 200000 ? 50000 : max > 120000 ? 20000 : 10000;
  const top = Math.ceil(max / step) * step || step;
  const x = (i) => PAD.l + (i * (W - PAD.l - PAD.r)) / last;
  const yearStep = last > 24 ? 5 : 2;
  const y = (val) => PAD.t + (1 - val / top) * (height - PAD.t - PAD.b);
  const ticks = Array.from({ length: top / step + 1 }, (_, i) => i * step);

  const onMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const px = ((e.clientX - rect.left) / rect.width) * W;
    const i = Math.round(((px - PAD.l) / (W - PAD.l - PAD.r)) * last);
    setHover(Math.max(0, Math.min(visible - 1, i)));
  };

  const tipLeft = hover !== null && x(hover) > W * 0.6;

  return (
    <div style={{ position: 'relative' }}>
      <svg viewBox={`0 0 ${W} ${height}`} width="100%" onMouseMove={onMove} onMouseLeave={() => setHover(null)} style={{ display: 'block' }}>
        {ticks.map((t) => (
          <g key={t}>
            <line x1={PAD.l} x2={W - PAD.r} y1={y(t)} y2={y(t)} stroke="#e6dccf" />
            <text x={PAD.l - 8} y={y(t) + 4} textAnchor="end" fontSize="11" fill="#5a4e45">
              {(t / 1000).toLocaleString('de-DE')} Tsd. €
            </text>
          </g>
        ))}
        {years.slice(0, visible).map((yr, i) =>
          i % yearStep === 0 ? (
            <text key={yr} x={x(i)} y={height - 8} textAnchor="middle" fontSize="11" fill="#5a4e45">
              {yr}
            </text>
          ) : null,
        )}
        {markers
          .filter((m) => m.index <= last)
          .map((m) => (
            <g key={m.label}>
              <line x1={x(m.index)} x2={x(m.index)} y1={PAD.t} y2={height - PAD.b} stroke={m.color} strokeDasharray="3 4" />
              <text x={x(m.index) - 6} y={PAD.t + 14 + (m.row || 0) * 15} textAnchor="end" fontSize="11" fontWeight="600" fill={m.color}>
                {m.label}
              </text>
            </g>
          ))}
        {hover !== null && <line x1={x(hover)} x2={x(hover)} y1={PAD.t} y2={height - PAD.b} stroke="#cfc2b1" />}
        {series.map((s) => (
          <polyline
            key={s.label}
            fill="none"
            stroke={s.color}
            strokeWidth={s.width}
            strokeDasharray={s.dash || 'none'}
            strokeLinejoin="round"
            points={[...s.data.slice(0, visible).map((d, i) => `${x(i)},${y(d)}`), `${x(last)},${y(at(s.data, last))}`].join(' ')}
          />
        ))}
        {hover !== null &&
          series.map((s) => <circle key={s.label} cx={x(hover)} cy={y(s.data[hover])} r="4" fill={s.color} stroke="#fff" strokeWidth="1.5" />)}
        <rect x={PAD.l} y={PAD.t} width={W - PAD.l - PAD.r} height={height - PAD.t - PAD.b} fill="transparent" />
      </svg>

      {hover !== null && (
        <div
          style={{
            position: 'absolute',
            top: 16,
            left: tipLeft ? undefined : `${(x(hover) / W) * 100 + 2}%`,
            right: tipLeft ? `${100 - (x(hover) / W) * 100 + 2}%` : undefined,
            background: 'rgba(34, 28, 24, 0.92)',
            color: '#f6f1ea',
            borderRadius: 8,
            padding: '8px 10px',
            fontSize: 12.5,
            pointerEvents: 'none',
            whiteSpace: 'nowrap',
          }}
        >
          <strong style={{ display: 'block', marginBottom: 4 }}>{years[hover]}</strong>
          {series.map((s) => (
            <div key={s.label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ width: 10, height: 10, background: s.color, display: 'inline-block' }} />
              {s.label}: {eur(s.data[hover])}
            </div>
          ))}
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'center', gap: 16, marginTop: 8, fontSize: 12.5 }}>
        {series.map((s) => (
          <span key={s.label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 9, height: 9, borderRadius: '50%', background: s.color }} />
            {s.label}
          </span>
        ))}
      </div>
    </div>
  );
}
