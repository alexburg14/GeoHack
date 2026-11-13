import React from 'react';
import { FACTOR_DEFAULTS } from '../data/costModel';

// "What if" panel: the factors that move the comparison. The point to make visible: energy prices
// on world markets swing the heat pump and gas lines, while the geothermal price is set locally.
const pct = (x) => `${(x * 100).toLocaleString('de-DE', { maximumFractionDigits: 1 })} %`;

const SLIDERS = [
  { key: 'waermepumpe.strompreis_ct', label: 'Strompreis heute', min: 18, max: 45, step: 0.5, fmt: (x) => `${x.toLocaleString('de-DE')} ct/kWh`, hits: 'Wärmepumpe' },
  { key: 'waermepumpe.preissteigerung', label: 'Strompreis-Anstieg', min: 0, max: 0.08, step: 0.005, fmt: (x) => `${pct(x)} pro Jahr`, hits: 'Wärmepumpe' },
  { key: 'bestand.preissteigerung', label: 'Gas- und Ölpreis-Anstieg', min: 0, max: 0.1, step: 0.005, fmt: (x) => `${pct(x)} pro Jahr`, hits: 'Gas, und Fernwärme bis zum Anschluss' },
  { key: 'waermepumpe.jaz', label: 'Effizienz der Wärmepumpe (JAZ)', min: 2, max: 4.5, step: 0.1, fmt: (x) => x.toLocaleString('de-DE', { minimumFractionDigits: 1 }), hits: 'Wärmepumpe: ältere Häuser mit Heizkörpern liegen eher unten' },
];

const PRESETS = [
  { id: 'ruhig', label: 'Ruhige Märkte', values: { 'waermepumpe.strompreis_ct': 24, 'waermepumpe.preissteigerung': 0.01, 'bestand.preissteigerung': 0.015 } },
  { id: 'erwartung', label: 'Erwartung', values: {} },
  { id: 'krise', label: 'Energiekrise wie 2022', values: { 'waermepumpe.strompreis_ct': 40, 'waermepumpe.preissteigerung': 0.06, 'bestand.preissteigerung': 0.09 } },
];

const eur = (n) => `${Math.round(n).toLocaleString('de-DE')} €`;

export default function FactorPanel({ factors, setFactors, defaultJaz, result, baseline, keys, meta, label }) {
  const value = (s) => factors[s.key] ?? (s.key === 'waermepumpe.jaz' ? defaultJaz : FACTOR_DEFAULTS[s.key]);
  const set = (key, x) => setFactors((f) => ({ ...f, [key]: x }));
  const activePreset = PRESETS.find(
    (p) => Object.keys(factors).length === Object.keys(p.values).length && Object.entries(p.values).every(([k, x]) => factors[k] === x),
  );

  // How far each option moved away from the expected case.
  const swings = keys.map((k) => {
    const now = result.optionen[k].gesamt_eur;
    const before = baseline.optionen[k].gesamt_eur;
    return { k, now, change: (now - before) / before };
  });
  const maxSwing = Math.max(0.05, ...swings.map((s) => Math.abs(s.change)));

  return (
    <div className="ep-card ep-factors">
      <div className="ep-factors-head">
        <div>
          <p className="eyebrow">Was wäre, wenn …?</p>
          <h2>Welche Faktoren Ihre Kosten bewegen</h2>
        </div>
        <div className="ep-chips" role="group" aria-label="Szenario">
          {PRESETS.map((p) => (
            <button key={p.id} type="button" className={activePreset?.id === p.id ? 'active' : ''} onClick={() => setFactors(p.values)}>
              {p.label}
            </button>
          ))}
        </div>
      </div>

      <div className="ep-factors-body">
        <div className="ep-sliders">
          {SLIDERS.map((s) => (
            <label key={s.key} className="ep-slider">
              <span className="top">
                <span>{s.label}</span>
                <b>{s.fmt(value(s))}</b>
              </span>
              <input
                type="range"
                min={s.min}
                max={s.max}
                step={s.step}
                value={value(s)}
                onChange={(e) => set(s.key, Number(e.target.value))}
                onKeyDown={(e) => e.stopPropagation()}
              />
              <small className="muted">betrifft: {s.hits}</small>
            </label>
          ))}
          <div className="ep-lock">
            <span aria-hidden="true">🔒</span>
            <p>
              <b>Geothermie-Wärmepreis: {pct(FACTOR_DEFAULTS['fernwaerme.preissteigerung'])} pro Jahr.</b> Die Wärme kommt
              aus 3.000 m Tiefe in Unterhaching, nicht von der Gas- oder Strombörse.
              <br />
              <small className="muted">Annahme: hängt an der Preisgleitklausel, mit Geothermie Unterhaching zu prüfen.</small>
            </p>
          </div>
        </div>

        <div className="ep-swings">
          <p className="muted" style={{ fontSize: 13, marginBottom: 10 }}>
            Ihre Kosten über 20 Jahre, im Vergleich zur Erwartung
          </p>
          {swings.map((s) => (
            <div key={s.k} className="ep-swing">
              <div className="top">
                <span>{label(s.k)}</span>
                <b>{eur(s.now)}</b>
              </div>
              <div className="track">
                <span className="mid" />
                <span
                  className="bar"
                  style={{
                    background: meta[s.k].color,
                    width: `${(Math.abs(s.change) / maxSwing) * 50}%`,
                    left: s.change >= 0 ? '50%' : `${50 - (Math.abs(s.change) / maxSwing) * 50}%`,
                  }}
                />
              </div>
              <small className={s.change > 0.005 ? 'up' : s.change < -0.005 ? 'down' : 'muted'}>
                {Math.abs(s.change) < 0.005 ? 'unverändert' : `${s.change > 0 ? '+' : '−'}${pct(Math.abs(s.change))}`}
              </small>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
