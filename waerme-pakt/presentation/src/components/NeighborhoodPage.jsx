import React, { useEffect, useMemo, useRef, useState } from 'react';
import { AREAS, PHASES, STREETS, THRESHOLD, TOWN } from '../data/town';

// Anonymised district map in the style of the official Ausbauplanung map:
// pastel district areas, the heating network as red lines on top. Pledges only per district.
// round down, so a share is never shown as reaching the threshold before it does
const pct = (x) => `${Math.floor(x * 100 + 1e-9)}\u00a0%`;
const shareColor = (x) => (x >= THRESHOLD ? '#8a3210' : x >= 0.5 ? '#bf4416' : x >= 0.35 ? '#e8763a' : '#f4b98a');
const NETWORK = '#d8453a';

export default function NeighborhoodPage({ myAreaId, onCheckAddress, embedded = false }) {
  const mapEl = useRef(null);
  const layersRef = useRef({});
  const labelsRef = useRef({});
  const networkRef = useRef([]);
  const [mode, setMode] = useState('gebiete'); // 'gebiete' (Ausbaugebiete) | 'zusagen'
  const [selectedId, setSelectedId] = useState(myAreaId || 'west');
  const [myPledge, setMyPledge] = useState(null); // demo: area the visitor pledged for

  const extra = (a) => (myPledge === a.id ? 1 : 0);
  const share = (a) => (a.pledged + extra(a)) / a.households;
  const totals = useMemo(() => {
    const households = AREAS.reduce((n, a) => n + a.households, 0);
    const pledged = AREAS.reduce((n, a) => n + a.pledged, 0) + (myPledge ? 1 : 0);
    return { households, pledged };
  }, [myPledge]);

  const styleFor = (a) => {
    const fill = mode === 'gebiete' ? a.color : shareColor(share(a));
    const selected = a.id === selectedId;
    return {
      color: selected ? '#221c18' : '#ffffff',
      weight: selected ? 3 : 2,
      opacity: 1,
      fillColor: fill,
      fillOpacity: mode === 'gebiete' ? (selected ? 0.85 : 0.7) : selected ? 0.8 : 0.62,
    };
  };
  const labelHtml = (a) => {
    const value = mode === 'gebiete' ? `Anschluss ${a.years}` : `${pct(share(a))} dabei`;
    return `<div class="ep-area-label${a.id === selectedId ? ' on' : ''}"><b>${a.name.replace(`${TOWN} `, '')}</b><span>${value}</span></div>`;
  };

  useEffect(() => {
    const L = window.L;
    if (!L || !mapEl.current) return undefined;
    const map = L.map(mapEl.current, { scrollWheelZoom: false, zoomControl: true, zoomSnap: 0.25 });
    // OpenStreetMap, faded in CSS (.ep-map) so the districts read like the printed Ausbauplanung
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 18, attribution: '© OpenStreetMap-Mitwirkende' }).addTo(map);

    const group = L.featureGroup().addTo(map);
    AREAS.forEach((a) => {
      const poly = L.geoJSON(a.feature, { style: styleFor(a) }).addTo(group);
      poly.on('click', () => setSelectedId(a.id));
      layersRef.current[a.id] = poly;
    });

    // Fernwärmenetz: solid where it is being built, dashed where it is planned. No data per street.
    networkRef.current = STREETS.map((s) =>
      L.geoJSON(s.geometry, {
        interactive: false,
        style: { color: NETWORK, weight: s.phase === 1 ? 4 : 3, opacity: 0.95, dashArray: s.phase === 1 ? null : '6 6', lineCap: 'round' },
      }).addTo(map),
    );

    AREAS.forEach((a) => {
      const label = L.marker(a.center, { icon: L.divIcon({ className: '', html: labelHtml(a), iconSize: null }) }).addTo(map);
      label.on('click', () => setSelectedId(a.id));
      labelsRef.current[a.id] = label;
    });
    map.fitBounds(group.getBounds(), { padding: [12, 12] });
    return () => {
      map.remove();
      layersRef.current = {};
      labelsRef.current = {};
      networkRef.current = [];
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const L = window.L;
    AREAS.forEach((a) => {
      layersRef.current[a.id]?.setStyle(styleFor(a));
      labelsRef.current[a.id]?.setIcon(L.divIcon({ className: '', html: labelHtml(a), iconSize: null }));
      labelsRef.current[a.id]?.setZIndexOffset(a.id === selectedId ? 1000 : 0);
    });
    layersRef.current[selectedId]?.bringToFront();
    // the network stays on top of the districts
    networkRef.current.forEach((l) => l.bringToFront());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, selectedId, myPledge]);

  const sel = AREAS.find((a) => a.id === selectedId) || AREAS[0];
  const selShare = share(sel);
  const ranking = [...AREAS].sort((x, y) => share(y) - share(x));

  return (
    <div className="ep-page" style={{ maxWidth: 1120 }}>
      <div>
        <p className="eyebrow">Nachbarschaft · {TOWN}</p>
        <h1>{embedded ? 'Ihre Nachbarn sind schon dabei' : 'Wer in Ihrer Nachbarschaft schon dabei ist'}</h1>
        <p className="muted" style={{ marginTop: 10, fontSize: 16 }}>
          Zusagen und Ausbauplan nach Stadtviertel. Einzelne Straßen und Haushalte zeigen wir bewusst nicht.
        </p>
      </div>

      <div className="ep-kpis">
        <div className="ep-kpi">
          <small>Haushalte haben zugesagt</small>
          <b>{totals.pledged.toLocaleString('de-DE')}</b>
        </div>
        <div className="ep-kpi">
          <small>Anteil im Ausbaugebiet</small>
          <b>{pct(totals.pledged / totals.households)}</b>
        </div>
        <div className="ep-kpi">
          <small>Viertel über {pct(THRESHOLD)}</small>
          <b>
            {AREAS.filter((a) => share(a) >= THRESHOLD).length} von {AREAS.length}
          </b>
        </div>
      </div>

      <div className="ep-mapgrid">
        <div className="ep-card" style={{ padding: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <div className="ep-toggle">
              <button type="button" className={mode === 'gebiete' ? 'on' : ''} onClick={() => setMode('gebiete')}>
                Ausbaugebiete
              </button>
              <button type="button" className={mode === 'zusagen' ? 'on' : ''} onClick={() => setMode('zusagen')}>
                Zusagen
              </button>
            </div>
            <span className="muted" style={{ fontSize: 12.5 }}>Gebiet anklicken</span>
          </div>
          <div ref={mapEl} className="ep-map" />
          <div className="ep-legend">
            <span>
              <i style={{ background: NETWORK }} />
              Fernwärmenetz im Bau
            </span>
            <span>
              <i className="dashed" style={{ color: NETWORK }} />
              geplant
            </span>
            {mode === 'gebiete'
              ? AREAS.map((a) => (
                  <span key={a.id}>
                    <i className="area" style={{ background: a.color }} />
                    {a.name.replace(`${TOWN} `, '')}: {a.years}
                  </span>
                ))
              : [
                  ['#f4b98a', 'unter 35 %'],
                  ['#e8763a', '35–50 %'],
                  ['#bf4416', '50–65 %'],
                  ['#8a3210', 'über der Schwelle'],
                ].map(([c, l]) => (
                  <span key={l}>
                    <i className="area" style={{ background: c }} />
                    {l}
                  </span>
                ))}
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="ep-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 }}>
              <h2 style={{ margin: 0 }}>{sel.name}</h2>
              {sel.id === myAreaId && <span className="ep-tag">Ihr Viertel</span>}
            </div>
            <p className="muted" style={{ fontSize: 13.5, marginTop: 4 }}>
              Anschlüsse {sel.years} · rund {Math.round(sel.households / 10) * 10} Haushalte
            </p>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 16, fontSize: 14 }}>
              <strong>Zusagen im Viertel</strong>
              <strong style={{ color: 'var(--accent)' }}>{pct(selShare)}</strong>
            </div>
            <div className="ep-progress">
              <span style={{ width: `${Math.min(100, selShare * 100)}%` }} />
              <i style={{ left: `${THRESHOLD * 100}%` }} />
            </div>
            <div className="ep-phasebar" title="Anteil der Haushalte je Bauphase">
              {sel.byPhase.map((n, i) =>
                n ? <span key={i} style={{ flex: n, background: PHASES[i + 1].color }} /> : null,
              )}
            </div>
            <div className="ep-legend" style={{ marginTop: 6 }}>
              {sel.byPhase.map((n, i) =>
                n ? (
                  <span key={i}>
                    <i style={{ background: PHASES[i + 1].color }} />
                    {PHASES[i + 1].label} ({pct(n / sel.households)})
                  </span>
                ) : null,
              )}
            </div>
            <button
              type="button"
              className={`ep-btn ${myPledge === sel.id ? 'ghost' : 'primary'}`}
              style={{ width: '100%', marginTop: 14 }}
              onClick={() => setMyPledge((p) => (p === sel.id ? null : sel.id))}
            >
              {myPledge === sel.id ? '✓ Sie sind dabei (zurücknehmen)' : 'Ich bin dabei'}
            </button>
          </div>

          <div className="ep-card">
            <h3 style={{ marginBottom: 10 }}>Welches Viertel liegt vorne?</h3>
            <ol className="ep-ranking">
              {ranking.map((a, i) => (
                <li key={a.id} className={a.id === selectedId ? 'on' : ''}>
                  <button type="button" onClick={() => setSelectedId(a.id)}>
                    <span className="n">{i + 1}</span>
                    <span className="name">{a.name}</span>
                    <span className="bar">
                      <span style={{ width: `${Math.min(100, share(a) * 100)}%` }} />
                    </span>
                    <span className="v">{pct(share(a))}</span>
                  </button>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </div>

      <div className="ep-card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
        <span style={{ fontSize: 14 }}>
          <strong>Wann kommt die Fernwärme zu Ihnen?</strong>{' '}
          <span className="muted">Prüfen Sie Ihre Adresse und rechnen Sie Ihre Kosten durch.</span>
        </span>
        <button type="button" className="ep-btn primary" onClick={onCheckAddress}>
          Adresse prüfen →
        </button>
      </div>
      <p className="muted" style={{ fontSize: 12 }}>
        Demodaten: Haushalte und Zusagen sind Platzhalter, zusammengefasst nach Viertel. Kartendaten © OpenStreetMap-Mitwirkende.
      </p>
    </div>
  );
}
