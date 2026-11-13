import React, { useState } from 'react';

const STREETS = [
  {
    id: 'sonnenallee',
    name: 'Sonnenallee',
    status: 'planned',
    interestedPct: 84,
    households: 32,
    timeline: 'Baustart Q2 2027',
    note: 'Haupttrasse bereits genehmigt. Hausanschlüsse können direkt reserviert werden.',
  },
  {
    id: 'gartenstrasse',
    name: 'Gartenstraße',
    status: 'planned',
    interestedPct: 78,
    households: 24,
    timeline: 'Baustart Q3 2027',
    note: 'Ausreichend Vorverträge vorhanden. Tiefbau in Vorbereitung.',
  },
  {
    id: 'eichenweg',
    name: 'Eichenweg',
    status: 'interested',
    interestedPct: 58,
    households: 19,
    timeline: 'Prüfphase (Ziel: 65 %)',
    note: 'Noch 2 weitere Haushalte nötig, um den Ausbau priorisiert zu starten.',
  },
  {
    id: 'lindenplatz',
    name: 'Lindenplatz',
    status: 'interested',
    interestedPct: 52,
    households: 21,
    timeline: 'Interessenbekundung aktiv',
    note: 'Hohes Interesse bei Mehrfamilienhäusern. Wirtschaftlichkeitsprüfung läuft.',
  },
  {
    id: 'birkenallee',
    name: 'Birkenallee',
    status: 'unplanned',
    interestedPct: 18,
    households: 28,
    timeline: 'Noch nicht geplant',
    note: 'Aktuell zu geringe Nachfrage. Jetzt unverbindlich Interesse vormerken.',
  },
  {
    id: 'muehlenweg',
    name: 'Mühlenweg',
    status: 'unplanned',
    interestedPct: 14,
    households: 16,
    timeline: 'Noch nicht geplant',
    note: 'Randlage — Ausbau erst ab mindestens 50 % Interesse wirtschaftlich.',
  },
];

const STATUS_META = {
  planned: { label: 'Geplant', color: '#10b981', bg: '#d1fae5', text: '#065f46' },
  interested: { label: 'Interessiert', color: '#f59e0b', bg: '#fef3c7', text: '#92400e' },
  unplanned: { label: 'Nicht geplant', color: '#94a3b8', bg: '#f1f5f9', text: '#475569' },
};

export function NeighborhoodMap({ defaultStreetId = 'eichenweg' }) {
  const [filter, setFilter] = useState('all');
  const [selectedId, setSelectedId] = useState(defaultStreetId);
  const [pledgedStreets, setPledgedStreets] = useState([]);

  const selectedStreet = STREETS.find((s) => s.id === selectedId) || STREETS[0];
  const isPledged = pledgedStreets.includes(selectedStreet.id);
  const effectivePct = Math.min(100, selectedStreet.interestedPct + (isPledged ? 6 : 0));

  const getStreetColor = (street) => {
    if (filter !== 'all' && street.status !== filter) return '#e2e8f0';
    return STATUS_META[street.status].color;
  };

  const getStreetOpacity = (street) => {
    if (filter !== 'all' && street.status !== filter) return 0.45;
    return 1;
  };

  return (
    <div
      style={{
        backgroundColor: '#ffffff',
        border: '1px solid #e2e8f0',
        borderRadius: '16px',
        padding: '18px 20px',
      }}
    >
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '10px',
          marginBottom: '14px',
        }}
      >
        <div>
          <h3 style={{ margin: 0, fontSize: '18px', color: '#091e2c' }}>
            🏘️ Musterquartier: Netzausbau &amp; Nachbarschafts-Interesse
          </h3>
          <p style={{ margin: '2px 0 0 0', fontSize: '12.5px', color: '#64748b' }}>
            Klicken Sie auf eine Straße, um Ausbaustatus und Haushalts-Interesse zu prüfen.
          </p>
        </div>

        {/* Filter Pills */}
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          {[
            { id: 'all', label: 'Alle Straßen' },
            { id: 'planned', label: '● Geplant', dot: '#10b981' },
            { id: 'interested', label: '● Interessiert', dot: '#f59e0b' },
            { id: 'unplanned', label: '● Nicht geplant', dot: '#94a3b8' },
          ].map((f) => {
            const active = filter === f.id;
            return (
              <button
                key={f.id}
                type="button"
                onClick={() => setFilter(f.id)}
                style={{
                  border: active ? '1px solid #091e2c' : '1px solid #cbd5e1',
                  backgroundColor: active ? '#091e2c' : '#f8fafc',
                  color: active ? '#ffffff' : f.dot || '#334155',
                  borderRadius: '999px',
                  padding: '5px 11px',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                {f.label}
              </button>
            );
          })}
        </div>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1.45fr) minmax(240px, 1fr)',
          gap: '16px',
          alignItems: 'stretch',
        }}
      >
        {/* Interactive SVG Neighborhood Map */}
        <div
          style={{
            backgroundColor: '#f8fafc',
            border: '1px solid #e2e8f0',
            borderRadius: '12px',
            padding: '10px',
            position: 'relative',
          }}
        >
          <svg viewBox="0 0 520 290" style={{ width: '100%', height: 'auto', display: 'block' }}>
            {/* Park / Green Zone */}
            <rect x="195" y="95" width="130" height="92" rx="14" fill="#dcfce7" stroke="#bbf7d0" />
            <text x="260" y="145" textAnchor="middle" fontSize="11" fill="#15803d" fontWeight="600">
              🌳 Stadtpark
            </text>

            {/* Heating Plant / Heizwerk */}
            <rect x="16" y="18" width="92" height="44" rx="8" fill="#091e2c" />
            <text x="62" y="38" textAnchor="middle" fontSize="10" fill="#f59e0b" fontWeight="700">
              🔥 HEIZWERK
            </text>
            <text x="62" y="52" textAnchor="middle" fontSize="9" fill="#cbd5e1">
              Haupttrasse
            </text>

            {/* Street 1: Sonnenallee (Top horizontal) */}
            <g
              onClick={() => setSelectedId('sonnenallee')}
              style={{ cursor: 'pointer', opacity: getStreetOpacity(STREETS[0]) }}
            >
              <line
                x1="108"
                y1="44"
                x2="490"
                y2="44"
                stroke={getStreetColor(STREETS[0])}
                strokeWidth={selectedId === 'sonnenallee' ? 16 : 12}
                strokeLinecap="round"
              />
              <text x="280" y="28" textAnchor="middle" fontSize="11" fontWeight="700" fill="#0f172a">
                Sonnenallee (84% ✓)
              </text>
              {[150, 200, 250, 310, 360, 410, 460].map((x) => (
                <rect key={x} x={x - 7} y="54" width="14" height="11" rx="2" fill="#10b981" />
              ))}
            </g>

            {/* Street 2: Gartenstraße (Left vertical) */}
            <g
              onClick={() => setSelectedId('gartenstrasse')}
              style={{ cursor: 'pointer', opacity: getStreetOpacity(STREETS[1]) }}
            >
              <line
                x1="145"
                y1="44"
                x2="145"
                y2="255"
                stroke={getStreetColor(STREETS[1])}
                strokeWidth={selectedId === 'gartenstrasse' ? 16 : 12}
                strokeLinecap="round"
              />
              <text
                x="118"
                y="155"
                textAnchor="middle"
                fontSize="11"
                fontWeight="700"
                fill="#0f172a"
                transform="rotate(-90 118 155)"
              >
                Gartenstraße (78% ✓)
              </text>
              {[90, 130, 170, 210].map((y) => (
                <rect key={y} x="157" y={y - 6} width="12" height="12" rx="2" fill="#10b981" />
              ))}
            </g>

            {/* Street 3: Eichenweg (Middle-right vertical) */}
            <g
              onClick={() => setSelectedId('eichenweg')}
              style={{ cursor: 'pointer', opacity: getStreetOpacity(STREETS[2]) }}
            >
              <line
                x1="365"
                y1="44"
                x2="365"
                y2="245"
                stroke={getStreetColor(STREETS[2])}
                strokeWidth={selectedId === 'eichenweg' ? 16 : 12}
                strokeLinecap="round"
              />
              <text
                x="392"
                y="148"
                textAnchor="middle"
                fontSize="11"
                fontWeight="700"
                fill="#0f172a"
                transform="rotate(-90 392 148)"
              >
                Eichenweg (58%)
              </text>
              {[88, 128, 168, 208].map((y, idx) => (
                <rect
                  key={y}
                  x="342"
                  y={y - 6}
                  width="12"
                  height="12"
                  rx="2"
                  fill={idx < 3 ? '#f59e0b' : '#cbd5e1'}
                />
              ))}
            </g>

            {/* Street 4: Lindenplatz (Bottom-left horizontal) */}
            <g
              onClick={() => setSelectedId('lindenplatz')}
              style={{ cursor: 'pointer', opacity: getStreetOpacity(STREETS[3]) }}
            >
              <line
                x1="145"
                y1="235"
                x2="365"
                y2="235"
                stroke={getStreetColor(STREETS[3])}
                strokeWidth={selectedId === 'lindenplatz' ? 16 : 12}
                strokeLinecap="round"
              />
              <text x="255" y="260" textAnchor="middle" fontSize="11" fontWeight="700" fill="#0f172a">
                Lindenplatz (52%)
              </text>
              {[185, 225, 265, 305].map((x, idx) => (
                <rect
                  key={x}
                  x={x - 6}
                  y="213"
                  width="12"
                  height="11"
                  rx="2"
                  fill={idx < 2 ? '#f59e0b' : '#cbd5e1'}
                />
              ))}
            </g>

            {/* Street 5: Birkenallee (Far-right vertical) */}
            <g
              onClick={() => setSelectedId('birkenallee')}
              style={{ cursor: 'pointer', opacity: getStreetOpacity(STREETS[4]) }}
            >
              <line
                x1="470"
                y1="44"
                x2="470"
                y2="255"
                stroke={getStreetColor(STREETS[4])}
                strokeWidth={selectedId === 'birkenallee' ? 16 : 12}
                strokeLinecap="round"
              />
              <text
                x="496"
                y="150"
                textAnchor="middle"
                fontSize="11"
                fontWeight="700"
                fill="#475569"
                transform="rotate(-90 496 150)"
              >
                Birkenallee (18%)
              </text>
              {[90, 135, 180, 225].map((y, idx) => (
                <rect
                  key={y}
                  x="448"
                  y={y - 6}
                  width="12"
                  height="12"
                  rx="2"
                  fill={idx === 0 ? '#f59e0b' : '#cbd5e1'}
                />
              ))}
            </g>

            {/* Street 6: Mühlenweg (Bottom-right spur) */}
            <g
              onClick={() => setSelectedId('muehlenweg')}
              style={{ cursor: 'pointer', opacity: getStreetOpacity(STREETS[5]) }}
            >
              <line
                x1="365"
                y1="235"
                x2="470"
                y2="235"
                stroke={getStreetColor(STREETS[5])}
                strokeWidth={selectedId === 'muehlenweg' ? 16 : 12}
                strokeLinecap="round"
              />
              <text x="418" y="260" textAnchor="middle" fontSize="11" fontWeight="700" fill="#475569">
                Mühlenweg (14%)
              </text>
            </g>
          </svg>
        </div>

        {/* Selected Street Inspector Card */}
        <div
          style={{
            backgroundColor: '#f8fafc',
            border: '1px solid #e2e8f0',
            borderRadius: '12px',
            padding: '16px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <span style={{ fontSize: '18px', fontWeight: 800, color: '#091e2c' }}>
                {selectedStreet.name}
              </span>
              <span
                style={{
                  fontSize: '11.5px',
                  fontWeight: 700,
                  padding: '3px 10px',
                  borderRadius: '999px',
                  backgroundColor: STATUS_META[selectedStreet.status].bg,
                  color: STATUS_META[selectedStreet.status].text,
                }}
              >
                {STATUS_META[selectedStreet.status].label}
              </span>
            </div>

            <div style={{ fontSize: '12.5px', color: '#475569', marginBottom: '12px' }}>
              {selectedStreet.timeline} • {selectedStreet.households} Haushalte
            </div>

            {/* Interest Progress Bar */}
            <div style={{ marginBottom: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', fontWeight: 700, marginBottom: '4px' }}>
                <span>Interesse in der Straße</span>
                <span style={{ color: STATUS_META[selectedStreet.status].color }}>
                  {effectivePct} %
                </span>
              </div>
              <div style={{ height: '9px', backgroundColor: '#e2e8f0', borderRadius: '999px', overflow: 'hidden' }}>
                <div
                  style={{
                    width: `${effectivePct}%`,
                    height: '100%',
                    backgroundColor: STATUS_META[selectedStreet.status].color,
                    transition: 'width 0.3s ease',
                  }}
                />
              </div>
            </div>

            <p style={{ margin: '0 0 14px 0', fontSize: '12.5px', color: '#334155', lineHeight: 1.45 }}>
              {selectedStreet.note}
            </p>
          </div>

          <button
            type="button"
            onClick={() =>
              setPledgedStreets((prev) =>
                prev.includes(selectedStreet.id) ? prev : [...prev, selectedStreet.id]
              )
            }
            style={{
              width: '100%',
              border: 'none',
              borderRadius: '8px',
              backgroundColor: isPledged ? '#10b981' : '#091e2c',
              color: '#ffffff',
              padding: '9px 12px',
              fontSize: '12.5px',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            {isPledged
              ? '✓ Interesse für diese Straße vorgemerkt!'
              : '+ Mein Interesse für diese Straße melden'}
          </button>
        </div>
      </div>
    </div>
  );
}

export function SavingsAndBenefitsCharts({ livingArea = 140 }) {
  const area = Number(livingArea) || 140;
  const annualGasCost = Math.round(area * 17.5);
  const annualFernwaermeCost = Math.round(area * 12.2);
  const annualWaermepumpeCost = Math.round(area * 13.4);
  const tenYearSavings = (annualGasCost - annualFernwaermeCost) * 10;
  const co2SavedKg = Math.round(area * 22);

  // Build 10-year cumulative points for SVG line chart
  const years = [0, 2, 4, 6, 8, 10];
  const maxVal = annualGasCost * 10;
  const toSvgX = (yr) => 42 + (yr / 10) * 290;
  const toSvgY = (val) => 155 - (val / maxVal) * 125;

  const gasPoints = years.map((y) => `${toSvgX(y)},${toSvgY(y * annualGasCost)}`).join(' ');
  const wpPoints = years.map((y) => `${toSvgX(y)},${toSvgY(y * annualWaermepumpeCost)}`).join(' ');
  const fwPoints = years.map((y) => `${toSvgX(y)},${toSvgY(y * annualFernwaermeCost)}`).join(' ');

  const benefitScores = [
    { label: 'Platzersparnis im Haus', fw: 96, wp: 48 },
    { label: 'Wartungsfreiheit & Komfort', fw: 94, wp: 62 },
    { label: 'Altbau-Tauglichkeit', fw: 92, wp: 54 },
    { label: 'Geräuschlosigkeit', fw: 100, wp: 58 },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Top KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
        <div
          style={{
            background: 'linear-gradient(135deg, #0f766e, #115e59)',
            color: '#ffffff',
            borderRadius: '14px',
            padding: '14px 16px',
          }}
        >
          <div style={{ fontSize: '11.5px', color: '#99f6e4', fontWeight: 600 }}>
            10-Jahres-Ersparnis vs. Gas ({area} m²)
          </div>
          <div style={{ fontSize: '24px', fontWeight: 800, marginTop: '4px' }}>
            {tenYearSavings.toLocaleString('de-DE')} €
          </div>
        </div>

        <div
          style={{
            background: 'linear-gradient(135deg, #091e2c, #1e293b)',
            color: '#ffffff',
            borderRadius: '14px',
            padding: '14px 16px',
          }}
        >
          <div style={{ fontSize: '11.5px', color: '#fcd34d', fontWeight: 600 }}>
            Jährliche CO₂-Einsparung
          </div>
          <div style={{ fontSize: '24px', fontWeight: 800, marginTop: '4px' }}>
            {co2SavedKg.toLocaleString('de-DE')} kg / Jahr
          </div>
        </div>

        <div
          style={{
            background: 'linear-gradient(135deg, #d97706, #b45309)',
            color: '#ffffff',
            borderRadius: '14px',
            padding: '14px 16px',
          }}
        >
          <div style={{ fontSize: '11.5px', color: '#fef3c7', fontWeight: 600 }}>
            Maximale BEG-Förderung
          </div>
          <div style={{ fontSize: '24px', fontWeight: 800, marginTop: '4px' }}>
            Bis zu 70 % Zuschuss
          </div>
        </div>
      </div>

      {/* Charts Row: 10-Year Cost Line Chart + Benefit Score Bars */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.15fr 1fr', gap: '14px' }}>
        {/* 10-Year Cost Line Chart */}
        <div
          style={{
            backgroundColor: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: '14px',
            padding: '14px 16px',
          }}
        >
          <div style={{ fontSize: '14px', fontWeight: 700, color: '#091e2c', marginBottom: '4px' }}>
            📈 Kumulierte Heizkosten über 10 Jahre
          </div>
          <div style={{ display: 'flex', gap: '12px', fontSize: '11px', marginBottom: '6px' }}>
            <span style={{ color: '#ef4444', fontWeight: 700 }}>● Gasheizung</span>
            <span style={{ color: '#0284c7', fontWeight: 700 }}>● Wärmepumpe</span>
            <span style={{ color: '#10b981', fontWeight: 700 }}>● Fernwärme</span>
          </div>

          <svg viewBox="0 0 360 180" style={{ width: '100%', height: 'auto', display: 'block' }}>
            {/* Grid lines */}
            {[30, 72, 114, 155].map((y) => (
              <line key={y} x1="42" y1={y} x2="335" y2={y} stroke="#f1f5f9" strokeWidth="1" />
            ))}
            {/* Y labels */}
            <text x="36" y="34" textAnchor="end" fontSize="9.5" fill="#64748b">
              {Math.round(maxVal / 1000)}k €
            </text>
            <text x="36" y="96" textAnchor="end" fontSize="9.5" fill="#64748b">
              {Math.round(maxVal / 2000)}k €
            </text>
            <text x="36" y="158" textAnchor="end" fontSize="9.5" fill="#64748b">
              0 €
            </text>

            {/* X labels */}
            {years.map((yr) => (
              <text key={yr} x={toSvgX(yr)} y="172" textAnchor="middle" fontSize="9.5" fill="#64748b">
                J{yr}
              </text>
            ))}

            {/* Lines */}
            <polyline fill="none" stroke="#ef4444" strokeWidth="2.8" points={gasPoints} />
            <polyline fill="none" stroke="#0284c7" strokeWidth="2.8" strokeDasharray="4 3" points={wpPoints} />
            <polyline fill="none" stroke="#10b981" strokeWidth="3.2" points={fwPoints} />

            {/* End Dots */}
            <circle cx={toSvgX(10)} cy={toSvgY(10 * annualGasCost)} r="4" fill="#ef4444" />
            <circle cx={toSvgX(10)} cy={toSvgY(10 * annualWaermepumpeCost)} r="4" fill="#0284c7" />
            <circle cx={toSvgX(10)} cy={toSvgY(10 * annualFernwaermeCost)} r="4.5" fill="#10b981" />
          </svg>
        </div>

        {/* Visual Benefit Comparison Bars */}
        <div
          style={{
            backgroundColor: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: '14px',
            padding: '14px 16px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <div style={{ fontSize: '14px', fontWeight: 700, color: '#091e2c', marginBottom: '4px' }}>
              📊 Vorteile im Direktvergleich
            </div>
            <div style={{ display: 'flex', gap: '12px', fontSize: '11px', marginBottom: '12px' }}>
              <span style={{ color: '#0f766e', fontWeight: 700 }}>■ Fernwärme</span>
              <span style={{ color: '#0284c7', fontWeight: 700 }}>■ Wärmepumpe</span>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '11px' }}>
            {benefitScores.map((item) => (
              <div key={item.label}>
                <div style={{ fontSize: '12px', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
                  {item.label}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ flex: 1, height: '8px', backgroundColor: '#f1f5f9', borderRadius: '999px', overflow: 'hidden' }}>
                      <div style={{ width: `${item.fw}%`, height: '100%', backgroundColor: '#10b981', borderRadius: '999px' }} />
                    </div>
                    <span style={{ fontSize: '11px', fontWeight: 700, color: '#0f766e', width: '32px' }}>
                      {item.fw}%
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ flex: 1, height: '8px', backgroundColor: '#f1f5f9', borderRadius: '999px', overflow: 'hidden' }}>
                      <div style={{ width: `${item.wp}%`, height: '100%', backgroundColor: '#38bdf8', borderRadius: '999px' }} />
                    </div>
                    <span style={{ fontSize: '11px', fontWeight: 700, color: '#0369a1', width: '32px' }}>
                      {item.wp}%
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
