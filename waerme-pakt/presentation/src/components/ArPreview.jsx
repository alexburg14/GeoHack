import React, { useEffect, useState } from 'react';

// Concept mock of an AR view: the phone "scans" the basement, finds the floor and places the device
// at true scale, so residents see how little room the district-heating station needs compared to a
// heat pump. Sizes are typical example dimensions, not a specific product.
const M = 120; // pixels per metre in the phone scene
const FLOOR_Y = 330; // where wall meets floor

const DEVICES = {
  fernwaerme: {
    label: 'Fernwärme-Übergabestation',
    short: 'Übergabestation',
    w: 0.6,
    h: 0.9,
    d: 0.35,
    lift: 1.0, // wall-mounted: bottom edge 1 m above the floor
    color: '#bf4416',
    summary: 'Hängt an der Wand. Kein Platz am Boden, kein Gerät im Garten.',
    rows: [
      ['Im Keller', 'ca. 60 × 90 cm an der Wand'],
      ['Draußen', 'nichts'],
      ['Geräusch', 'praktisch lautlos'],
      ['Brennstoff, Tank, Schornstein', 'entfällt'],
    ],
  },
  waermepumpe: {
    label: 'Wärmepumpe mit Speicher',
    short: 'Inneneinheit + Speicher',
    w: 0.6,
    h: 1.9,
    d: 0.65,
    lift: 0,
    color: '#2f6f8f',
    summary: 'Steht am Boden, dazu kommt ein Außengerät im Garten.',
    rows: [
      ['Im Keller', 'ca. 60 × 190 cm, 0,4 m² Boden'],
      ['Draußen', 'Außengerät ca. 110 × 140 cm'],
      ['Geräusch', 'Ventilator draußen hörbar'],
      ['Abstand zum Nachbarn', 'je nach Lärmschutz nötig'],
    ],
  },
};

const PHASE_MS = [1600, 1100, 900];

export default function ArPreview() {
  const [mode, setMode] = useState('fernwaerme');
  const [phase, setPhase] = useState(0); // 0 scan, 1 floor found, 2 placed, 3 measured
  const [run, setRun] = useState(0);
  const [qr, setQr] = useState(false);
  const dev = DEVICES[mode];

  useEffect(() => {
    setPhase(0);
    let t = 0;
    const timers = PHASE_MS.map((ms, i) => {
      t += ms;
      return setTimeout(() => setPhase(i + 1), t);
    });
    return () => timers.forEach(clearTimeout);
  }, [mode, run]);

  // Device box in scene coordinates (front face plus a skewed side face for depth).
  const bw = dev.w * M;
  const bh = dev.h * M;
  const bx = 112;
  const by = FLOOR_Y - dev.lift * M - bh;
  const dx = dev.d * M * 0.45;
  const dy = -dev.d * M * 0.3;

  const status = ['Boden wird erkannt …', 'Fläche gefunden', `${dev.short} wird platziert`, 'In Originalgröße'][phase];

  return (
    <div className="ep-card ep-ar">
      <div className="ep-ar-text">
        <p className="eyebrow">Neu · AR-Vorschau (Konzept)</p>
        <h2>Wie viel Platz braucht das?</h2>
        <p className="muted">
          Halten Sie Ihr Handy in den Keller und sehen Sie das Gerät in Originalgröße an Ihrer Wand, bevor Sie sich
          entscheiden.
        </p>
        <div className="ep-ar-toggle" role="group" aria-label="Gerät auswählen">
          {Object.entries(DEVICES).map(([k, d]) => (
            <button key={k} type="button" className={k === mode ? 'active' : ''} onClick={() => setMode(k)}>
              <span style={{ background: d.color }} />
              {k === 'fernwaerme' ? 'Fernwärme' : 'Wärmepumpe'}
            </button>
          ))}
        </div>
        <dl className="ep-ar-rows" key={mode}>
          {dev.rows.map(([k, val]) => (
            <React.Fragment key={k}>
              <dt>{k}</dt>
              <dd>{val}</dd>
            </React.Fragment>
          ))}
        </dl>
        <p className="muted" style={{ fontSize: 12 }}>Typische Beispielmaße, je nach Gerät und Haus verschieden.</p>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 4 }}>
          <button type="button" className="ep-btn primary" onClick={() => setQr((q) => !q)}>
            📱 Im eigenen Keller ansehen
          </button>
          <button type="button" className="ep-btn ghost" onClick={() => setRun((r) => r + 1)}>
            ↻ Nochmal
          </button>
        </div>
        {qr && (
          <div className="ep-ar-qr">
            <FakeQr />
            <p>
              Code mit der Handykamera scannen, dann die Kamera auf die Kellerwand richten.
              <br />
              <small className="muted">Konzept für den Pitch, noch ohne echte AR-Funktion.</small>
            </p>
          </div>
        )}
      </div>

      <div className="ep-ar-phone" aria-label={`AR-Vorschau: ${dev.label}, ${dev.summary}`}>
        <svg viewBox="0 0 280 520" width="100%" key={`${mode}-${run}`}>
          <defs>
            <linearGradient id="arWall" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#d9d2c8" />
              <stop offset="1" stopColor="#c9c0b4" />
            </linearGradient>
            <linearGradient id="arFloor" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#9c9184" />
              <stop offset="1" stopColor="#7d7266" />
            </linearGradient>
          </defs>

          {/* Camera image: a plain basement corner */}
          <rect width="280" height={FLOOR_Y} fill="url(#arWall)" />
          <polygon points={`0,${FLOOR_Y} 280,${FLOOR_Y} 280,520 0,520`} fill="url(#arFloor)" />
          <line x1="0" y1={FLOOR_Y} x2="280" y2={FLOOR_Y} stroke="#6f655a" strokeWidth="2" />
          <rect x="18" y="60" width="54" height="40" rx="3" fill="#b9b0a4" stroke="#a69c8f" />
          <line x1="230" y1="0" x2="230" y2={FLOOR_Y} stroke="#8c8276" strokeWidth="5" />
          <line x1="246" y1="0" x2="246" y2={FLOOR_Y} stroke="#8c8276" strokeWidth="5" />
          <rect x="196" y={FLOOR_Y - 70} width="60" height="70" fill="#a89e91" stroke="#968c80" />

          {/* Scan line */}
          {phase === 0 && <rect className="ar-scan" x="0" width="280" height="4" fill="#ffffff" opacity="0.8" />}

          {/* Detected floor plane */}
          {phase >= 1 && (
            <g className="ar-fade">
              <polygon points={`8,${FLOOR_Y + 8} 272,${FLOOR_Y + 8} 280,512 0,512`} fill="#ffffff" opacity="0.12" />
              {Array.from({ length: 6 }, (_, r) =>
                Array.from({ length: 8 }, (_, c) => (
                  <circle
                    key={`${r}-${c}`}
                    cx={20 + c * 34 + r * 2}
                    cy={FLOOR_Y + 22 + r * 30}
                    r="1.8"
                    fill="#ffffff"
                    opacity="0.85"
                    style={{ animationDelay: `${(r + c) * 30}ms` }}
                    className="ar-dot"
                  />
                )),
              )}
            </g>
          )}

          {/* Device */}
          {phase >= 2 && (
            <g className="ar-drop">
              {dev.lift === 0 && (
                <polygon
                  points={`${bx},${FLOOR_Y} ${bx + bw},${FLOOR_Y} ${bx + bw + dx * 1.6},${FLOOR_Y + 38} ${bx + dx * 1.6},${FLOOR_Y + 38}`}
                  fill={dev.color}
                  opacity="0.28"
                />
              )}
              <polygon
                points={`${bx + bw},${by} ${bx + bw + dx},${by + dy} ${bx + bw + dx},${by + bh + dy} ${bx + bw},${by + bh}`}
                fill={dev.color}
                opacity="0.55"
              />
              <polygon points={`${bx},${by} ${bx + dx},${by + dy} ${bx + bw + dx},${by + dy} ${bx + bw},${by}`} fill={dev.color} opacity="0.4" />
              <rect x={bx} y={by} width={bw} height={bh} fill={dev.color} opacity="0.82" stroke="#ffffff" strokeWidth="1.5" />
              <rect x={bx + 10} y={by + 12} width={bw - 20} height="10" rx="2" fill="#ffffff" opacity="0.6" />
              <circle cx={bx + bw / 2} cy={by + bh * 0.55} r="6" fill="#ffffff" opacity="0.7" />
            </g>
          )}

          {/* Measurements */}
          {phase >= 3 && (
            <g className="ar-measure" stroke="#ffffff" strokeWidth="1.5" fill="#ffffff">
              <line x1={bx - 12} y1={by} x2={bx - 12} y2={by + bh} />
              <line x1={bx - 16} y1={by} x2={bx - 8} y2={by} />
              <line x1={bx - 16} y1={by + bh} x2={bx - 8} y2={by + bh} />
              <MeasureTag x={bx - 12} y={by + bh / 2} text={`${Math.round(dev.h * 100)} cm`} />
              <line x1={bx} y1={by - 14} x2={bx + bw} y2={by - 14} />
              <line x1={bx} y1={by - 18} x2={bx} y2={by - 10} />
              <line x1={bx + bw} y1={by - 18} x2={bx + bw} y2={by - 10} />
              <MeasureTag x={bx + bw / 2} y={by - 14} text={`${Math.round(dev.w * 100)} cm`} />
            </g>
          )}

          {/* Outdoor unit inset for the heat pump */}
          {phase >= 3 && mode === 'waermepumpe' && (
            <g className="ar-fade" transform="translate(150 360)">
              <rect width="118" height="98" rx="10" fill="#221c18" opacity="0.85" />
              <text x="10" y="18" fontSize="10" fill="#f6f1ea" fontWeight="700">
                + im Garten
              </text>
              <rect x="22" y="28" width="58" height="52" rx="3" fill="#2f6f8f" />
              <circle cx="51" cy="54" r="17" fill="none" stroke="#f6f1ea" strokeWidth="2" />
              <path d="M51 40v28M37 54h28" stroke="#f6f1ea" strokeWidth="1.5" />
              <text x="86" y="58" fontSize="9" fill="#f6f1ea">
                110 ×
              </text>
              <text x="86" y="70" fontSize="9" fill="#f6f1ea">
                140 cm
              </text>
            </g>
          )}

          {/* AR interface chrome */}
          <rect x="10" y="12" width="86" height="24" rx="12" fill="#221c18" opacity="0.75" />
          <text x="22" y="28" fontSize="11" fill="#f6f1ea" fontWeight="700">
            AR · Keller
          </text>
          <rect x="14" y="470" width="252" height="34" rx="17" fill="#221c18" opacity="0.8" />
          <text x="140" y="492" fontSize="12" fill="#f6f1ea" textAnchor="middle" fontWeight="600">
            {status}
          </text>
          {phase < 2 && (
            <g transform="translate(140 400)" className="ar-reticle">
              <circle r="18" fill="none" stroke="#ffffff" strokeWidth="2" />
              <circle r="3" fill="#ffffff" />
            </g>
          )}
        </svg>
        <p className="ep-ar-caption">
          <b style={{ color: dev.color }}>{dev.label}:</b> {dev.summary}
        </p>
      </div>
    </div>
  );
}

function MeasureTag({ x, y, text }) {
  return (
    <g>
      <rect x={x - 24} y={y - 9} width="48" height="18" rx="9" fill="#221c18" stroke="none" />
      <text x={x} y={y + 4} fontSize="10" textAnchor="middle" fill="#ffffff" stroke="none" fontWeight="700">
        {text}
      </text>
    </g>
  );
}

// A static, made-up QR-like pattern for the mock (it encodes nothing).
function FakeQr() {
  const n = 17;
  const cells = [];
  for (let r = 0; r < n; r += 1) {
    for (let c = 0; c < n; c += 1) {
      const finder = (r < 5 && c < 5) || (r < 5 && c >= n - 5) || (r >= n - 5 && c < 5);
      const on = finder ? r % 4 === 0 || c % 4 === 0 || (r % 4 === 2 && c % 4 === 2) : (r * 7 + c * 13 + r * c) % 5 < 2;
      if (on) cells.push(<rect key={`${r}-${c}`} x={c} y={r} width="1" height="1" />);
    }
  }
  return (
    <svg viewBox={`-1 -1 ${n + 2} ${n + 2}`} width="96" height="96" style={{ background: '#fff', borderRadius: 8, flexShrink: 0 }} aria-hidden="true">
      <g fill="#221c18">{cells}</g>
    </svg>
  );
}
