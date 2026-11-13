import React, { useEffect, useState } from 'react';
import kellerFoto from '../assets/ar-keller.jpg'; // AI-generated basement photo (pollinations.ai), stands in for the camera

// Concept mock of an AR view: the phone "scans" the basement, finds the floor and places the device
// at true scale, so residents see how little room the district-heating station needs compared to a
// heat pump. Sizes are typical example dimensions, not a specific product.
//
// Camera fitted to the photo (scene px = photo px x 0.498). The two walls meet in a vertical corner at
// x 138.5. Their floor and ceiling lines vanish on one horizon at y 277 (left wall towards x 690, back
// wall towards x -1100), so the camera is level. Taking the corner (floor y 435, ceiling y 113) as 2.4 m
// high gives: eye 1.18 m above the floor, 6.15 m from the corner, focal length 825 px, and a back wall
// turned 33.7 deg away from frontal (cos 0.832, sin 0.554).
const CAM = { f: 825, cx: 138.5, horizon: 277, eye: 1.18, dist: 6.15, cos: 0.832, sin: 0.554 };

// Room coordinates in metres -> scene px. s runs along the back wall (0 = room corner, growing towards
// the window), d comes out of the back wall into the room (so the left wall is the plane s = 0),
// h is the height above the floor.
function project(s, d, h) {
  const x = CAM.cos * s - CAM.sin * d;
  const z = CAM.dist - CAM.sin * s - CAM.cos * d;
  return [CAM.cx + (CAM.f * x) / z, CAM.horizon + (CAM.f * (CAM.eye - h)) / z];
}
const pts = (...p) => p.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(' ');

// The device goes on the back wall, 10 cm from the corner. The window frame starts at s = 0.95, so a
// 60 cm wide device ends 25 cm before it.
const S0 = 0.1;
const PILL_Y = 478; // top of the status pill; floor dots stop above it

// Detected floor: the quadrant in front of both walls (s, d >= 0), drawn past the screen edges.
const FLOOR_EDGE = [project(0, 1.7, 0), project(0, 0, 0), project(1.3, 0, 0)];
const FLOOR_DOTS = [];
for (let i = 0; i < 7; i += 1) {
  for (let j = 0; j < 9; j += 1) {
    const [x, y] = project(0.1 + i * 0.2, 0.1 + j * 0.2, 0);
    if (x > 4 && x < 276 && y < PILL_Y - 5) FLOOR_DOTS.push([x, y, i + j]);
  }
}

const DEVICES = {
  fernwaerme: {
    label: 'Fernwärme-Übergabestation',
    short: 'Übergabestation',
    w: 0.6,
    h: 0.9,
    d: 0.35,
    lift: 0.7, // wall-mounted: bottom edge 70 cm above the floor, top at chest height
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

  // Device box, projected from room coordinates. From this camera only the front and the right side
  // are visible: the top (1.9 m) lies above eye level and the left side faces away.
  const s0 = S0;
  const s1 = S0 + dev.w;
  const h0 = dev.lift;
  const h1 = dev.lift + dev.h;
  const d = dev.d;
  const sm = (s0 + s1) / 2;
  const front = [project(s0, d, h1), project(s1, d, h1), project(s1, d, h0), project(s0, d, h0)];
  const side = [project(s1, d, h1), project(s1, 0, h1), project(s1, 0, h0), project(s1, d, h0)];
  const display = [
    project(s0 + 0.07, d, h1 - 0.08),
    project(s1 - 0.07, d, h1 - 0.08),
    project(s1 - 0.07, d, h1 - 0.15),
    project(s0 + 0.07, d, h1 - 0.15),
  ];
  const dial = project(sm, d, h0 + dev.h * 0.45);
  const dialRx = project(sm + 0.045, d, h0 + dev.h * 0.45)[0] - dial[0];
  const dialRy = dial[1] - project(sm, d, h0 + dev.h * 0.45 + 0.045)[1];
  // Shadow: on the floor around the footprint (floor-standing) or on the wall below the cabinet.
  const shadow =
    dev.lift === 0
      ? [project(0, 0, 0), project(s1 + 0.15, 0, 0), project(s1 + 0.15, d + 0.45, 0), project(0, d + 0.45, 0)]
      : [project(0.02, 0, h1), project(s1 + 0.06, 0, h1), project(s1 + 0.06, 0, h0 - 0.22), project(0.02, 0, h0 - 0.22)];
  // Dimension lines lie in the plane of the front face: height 25 cm left of it, width 10 cm above it.
  const hs = s0 - 0.25;
  const hTop = project(hs, d, h1);
  const hBot = project(hs, d, h0);
  const wh = h1 + 0.1;
  const wLeft = project(s0, d, wh);
  const wRight = project(s1, d, wh);
  const reticle = project(sm, d / 2, 0);

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
        <p className="muted" style={{ fontSize: 12 }}>
          Typische Beispielmaße, je nach Gerät und Haus verschieden. Kellerfoto KI-generiert (pollinations.ai).
        </p>
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
          {/* Camera image */}
          <image href={kellerFoto} x="0" y="0" width="280" height="520" preserveAspectRatio="xMidYMid slice" />

          {/* Scan line */}
          {phase === 0 && <rect className="ar-scan" x="0" width="280" height="4" fill="#ffffff" opacity="0.8" />}

          <defs>
            <filter id="arSoft" x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur stdDeviation="2.5" />
            </filter>
          </defs>

          {/* Detected floor plane: follows the photo's wall/floor lines */}
          {phase >= 1 && (
            <g className="ar-fade">
              <polygon points={`${pts(...FLOOR_EDGE)} 320,540 -40,540`} fill="#ffffff" opacity="0.14" />
              <polyline points={pts(...FLOOR_EDGE)} fill="none" stroke="#ffffff" strokeWidth="1" strokeDasharray="4 4" opacity="0.7" />
              {FLOOR_DOTS.map(([x, y, n]) => (
                <circle
                  key={`${x}-${y}`}
                  cx={x}
                  cy={y}
                  r="1.6"
                  fill="#ffffff"
                  opacity="0.9"
                  style={{ animationDelay: `${n * 30}ms` }}
                  className="ar-dot"
                />
              ))}
            </g>
          )}

          {/* Shadow stays on the floor / wall while the device drops in */}
          {phase >= 2 && (
            <polygon className="ar-fade" points={pts(...shadow)} fill="#120e0b" opacity={dev.lift === 0 ? 0.6 : 0.45} filter="url(#arSoft)" />
          )}

          {/* Device */}
          {phase >= 2 && (
            <g className="ar-drop" strokeLinejoin="round">
              <polygon points={pts(...side)} fill="#221c18" opacity="0.5" />
              <polygon points={pts(...side)} fill={dev.color} opacity="0.7" stroke="#ffffff" strokeWidth="1" />
              <polygon points={pts(...front)} fill={dev.color} opacity="0.88" stroke="#ffffff" strokeWidth="1.5" />
              <polygon points={pts(...display)} fill="#ffffff" opacity="0.6" />
              <ellipse cx={dial[0]} cy={dial[1]} rx={dialRx} ry={dialRy} fill="#ffffff" opacity="0.7" />
            </g>
          )}

          {/* Measurements, attached to the front face's left and top edges */}
          {phase >= 3 && (
            <g className="ar-measure" stroke="#ffffff" strokeWidth="1.5" fill="#ffffff">
              <line x1={hTop[0]} y1={hTop[1]} x2={hBot[0]} y2={hBot[1]} />
              <polyline points={pts(project(s0 - 0.04, d, h1), project(hs - 0.04, d, h1))} fill="none" strokeWidth="1" />
              <polyline points={pts(project(s0 - 0.04, d, h0), project(hs - 0.04, d, h0))} fill="none" strokeWidth="1" />
              <MeasureTag x={hTop[0]} y={(hTop[1] + hBot[1]) / 2} text={`${Math.round(dev.h * 100)} cm`} />
              <line x1={wLeft[0]} y1={wLeft[1]} x2={wRight[0]} y2={wRight[1]} />
              <polyline points={pts(project(s0, d, h1 + 0.03), project(s0, d, wh + 0.03))} fill="none" strokeWidth="1" />
              <polyline points={pts(project(s1, d, h1 + 0.03), project(s1, d, wh + 0.03))} fill="none" strokeWidth="1" />
              <MeasureTag x={(wLeft[0] + wRight[0]) / 2} y={(wLeft[1] + wRight[1]) / 2} text={`${Math.round(dev.w * 100)} cm`} />
            </g>
          )}

          {/* Outdoor unit inset for the heat pump (top left, on the empty part of the left wall) */}
          {phase >= 3 && mode === 'waermepumpe' && (
            <g className="ar-fade" transform="translate(10 42)">
              <rect width="112" height="88" rx="10" fill="#221c18" opacity="0.85" />
              <text x="10" y="17" fontSize="10" fill="#f6f1ea" fontWeight="700">
                + im Garten
              </text>
              <rect x="12" y="26" width="56" height="50" rx="3" fill="#2f6f8f" />
              <circle cx="40" cy="51" r="17" fill="none" stroke="#f6f1ea" strokeWidth="2" />
              <path d="M40 37v28M26 51h28" stroke="#f6f1ea" strokeWidth="1.5" />
              <text x="75" y="49" fontSize="9" fill="#f6f1ea">
                110 ×
              </text>
              <text x="75" y="61" fontSize="9" fill="#f6f1ea">
                140 cm
              </text>
            </g>
          )}

          {/* AR interface chrome */}
          <rect x="10" y="12" width="86" height="24" rx="12" fill="#221c18" opacity="0.75" />
          <text x="22" y="28" fontSize="11" fill="#f6f1ea" fontWeight="700">
            AR · Keller
          </text>
          <rect x="14" y={PILL_Y} width="252" height="30" rx="15" fill="#221c18" opacity="0.8" />
          <text x="140" y={PILL_Y + 19} fontSize="12" fill="#f6f1ea" textAnchor="middle" fontWeight="600">
            {status}
          </text>
          {/* Reticle lies flat on the floor where the device will go */}
          {phase < 2 && (
            <g transform={`translate(${reticle[0].toFixed(1)} ${reticle[1].toFixed(1)})`} className="ar-reticle">
              <ellipse rx="24" ry="5.5" fill="none" stroke="#ffffff" strokeWidth="2" />
              <ellipse rx="3.5" ry="1.2" fill="#ffffff" />
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
