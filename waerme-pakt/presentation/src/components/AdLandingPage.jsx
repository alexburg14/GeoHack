import React, { useState } from 'react';
import { NeighborhoodMap, SavingsAndBenefitsCharts } from './NeighborhoodAndCharts';
import BeratungsChatbot from './BeratungsChatbot';

const BUILDING_OPTIONS = [
  { id: 'efh', label: 'Einfamilienhaus', emoji: '🏠', desc: 'Freistehend oder Doppelhaushälfte' },
  { id: 'rh', label: 'Reihenhaus', emoji: '🏘️', desc: 'Mittel- oder Endhaus' },
  { id: 'zfh', label: 'Zweifamilienhaus', emoji: '🏡', desc: 'Zwei getrennte Wohneinheiten' },
  { id: 'mfh', label: 'Mehrfamilienhaus', emoji: '🏢', desc: 'Ab 3 Wohneinheiten' },
];

const YEAR_OPTIONS = [
  { id: 'old', label: 'Vor 1980 (Altbau)', hint: 'Meist höhere Vorlauftemperatur' },
  { id: 'mid', label: '1980 – 2005', hint: 'Teilsaniert / Standarddämmung' },
  { id: 'new', label: 'Nach 2005 (Neubau)', hint: 'Gute Wärmedämmung' },
];

const HEATING_OPTIONS = [
  { id: 'gas', label: 'Gasheizung', emoji: '🔥' },
  { id: 'oil', label: 'Ölheizung', emoji: '🛢️' },
  { id: 'electric', label: 'Elektro / Nachtspeicher', emoji: '⚡' },
  { id: 'other', label: 'Sonstige / Neubau', emoji: '🏗️' },
];

const COMPARISON_ROWS = [
  {
    criterion: 'Platzbedarf im Haus',
    fernwaerme: 'Minimal — nur kompakte Übergabestation',
    waermepumpe: 'Hoch — Innengerät, Speicher & Außengerät',
  },
  {
    criterion: 'Wartung & Service',
    fernwaerme: 'Rundum-Sorglos durch Energieversorger',
    waermepumpe: 'Jährliche Wartung am eigenen Gerät nötig',
  },
  {
    criterion: 'Eignung für Altbau',
    fernwaerme: 'Sehr hoch, auch mit bestehenden Heizkörpern',
    waermepumpe: 'Oft Heizkörpertausch oder Dämmung nötig',
  },
  {
    criterion: 'Lautstärke',
    fernwaerme: '100 % lautlos im Haus & Garten',
    waermepumpe: 'Hörbares Außengerät',
  },
  {
    criterion: 'Staatliche Förderung',
    fernwaerme: 'Bis zu 70 % BEG-Förderung möglich',
    waermepumpe: 'Bis zu 70 % BEG-Förderung möglich',
  },
];

export default function AdLandingPage({ clickedFrom, onBackToSearch }) {
  // Top nav: 'home' (summary landing page), 'advice' (4-step funnel), 'neighborhood', 'progress', 'about'
  const [activeNav, setActiveNav] = useState('home');

  // Step-by-step building info (1 to 4)
  const [step, setStep] = useState(1);
  const [buildingType, setBuildingType] = useState('efh');
  const [buildYear, setBuildYear] = useState('old');
  const [livingArea, setLivingArea] = useState('140');
  const [currentHeating, setCurrentHeating] = useState('gas');
  const [zipCode, setZipCode] = useState('10115');
  const [requestSent, setRequestSent] = useState(false);

  const selectedBuilding = BUILDING_OPTIONS.find((b) => b.id === buildingType);
  const selectedYear = YEAR_OPTIONS.find((y) => y.id === buildYear);
  const selectedHeating = HEATING_OPTIONS.find((h) => h.id === currentHeating);

  const progressPercent = Math.round((step / 4) * 100);

  const stopKeys = (e) => {
    e.stopPropagation();
  };

  const getRecommendation = () => {
    if (buildYear === 'old' || buildingType === 'mfh') {
      return {
        title: 'Klare Empfehlung: Fernwärme Anschluss',
        text: `Für Ihr ${selectedBuilding?.label} (${selectedYear?.label}, ${livingArea || 140} m²) ist Fernwärme ideal: keine Umrüstung der Heizkörper nötig, kein Platzverlust im Keller und bis zu 70 % Förderung.`,
        fernwaermePrice: 'ab 11.900 € (vor Förderung)',
        waermepumpePrice: 'ab 29.500 € (inkl. Anpassung)',
      };
    }
    return {
      title: 'Beide Systeme geeignet — Fernwärme punktet beim Komfort',
      text: `In Ihrem ${selectedBuilding?.label} (${selectedYear?.label}, ${livingArea || 140} m²) arbeiten beide Systeme effizient. Fernwärme überzeugt durch minimalen Wartungsaufwand und null Platzbedarf.`,
      fernwaermePrice: 'ab 10.500 € (vor Förderung)',
      waermepumpePrice: 'ab 24.000 € (vor Förderung)',
    };
  };

  const rec = getRecommendation();

  return (
    <div
      className="animate-fade-up"
      style={{
        width: '100%',
        height: '100%',
        backgroundColor: '#f8fafc',
        color: '#0f172a',
        borderRadius: '14px',
        boxShadow: '0 20px 50px rgba(0, 0, 0, 0.25)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      {/* Fake Browser Bar */}
      <div
        style={{
          height: '38px',
          backgroundColor: '#f1f3f4',
          borderBottom: '1px solid #dadce0',
          display: 'flex',
          alignItems: 'center',
          padding: '0 14px',
          gap: '10px',
          flexShrink: 0,
        }}
      >
        <div style={{ display: 'flex', gap: '6px' }}>
          <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#ff5f56' }} />
          <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#ffbd2e' }} />
          <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#27c93f' }} />
        </div>
        <button
          type="button"
          onClick={onBackToSearch}
          style={{
            border: '1px solid #cbd5e1',
            backgroundColor: '#ffffff',
            color: '#1e293b',
            borderRadius: '6px',
            padding: '3px 9px',
            fontSize: '11.5px',
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          ← Zurück zu Google
        </button>
        <div
          style={{
            flex: 1,
            maxWidth: '420px',
            backgroundColor: '#ffffff',
            borderRadius: '999px',
            padding: '3px 12px',
            fontSize: '11.5px',
            color: '#475569',
            border: '1px solid #e2e8f0',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          https://www.fernwaerme-anschluss.example.de/{activeNav}
        </div>
        <div
          style={{
            marginLeft: 'auto',
            fontSize: '11px',
            fontWeight: 600,
            color: '#0f766e',
            backgroundColor: '#ccfbf1',
            padding: '2px 9px',
            borderRadius: '999px',
          }}
        >
          🎯 Ad-Klick: {clickedFrom}
        </div>
      </div>

      {/* Enpal-inspired Top Navigation Bar */}
      <header
        style={{
          backgroundColor: '#091e2c',
          color: '#ffffff',
          padding: '12px 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexShrink: 0,
        }}
      >
        <button
          type="button"
          onClick={() => setActiveNav('home')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            border: 'none',
            background: 'transparent',
            color: '#ffffff',
            cursor: 'pointer',
            padding: 0,
          }}
          title="Zur Startseite"
        >
          <span
            style={{
              width: '28px',
              height: '28px',
              borderRadius: '8px',
              backgroundColor: '#f59e0b',
              color: '#091e2c',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 800,
              fontSize: '15px',
            }}
          >
            E+
          </span>
          <span style={{ fontWeight: 700, fontSize: '17px', letterSpacing: '-0.02em' }}>
            EnergiePlus
          </span>
        </button>

        <nav style={{ display: 'flex', alignItems: 'center', gap: '7px', flexWrap: 'wrap' }}>
          {[
            { id: 'home', label: 'Startseite' },
            { id: 'about', label: 'Über uns' },
            { id: 'neighborhood', label: 'Netzkarte & Ersparnis' },
            { id: 'progress', label: `Fortschritt (${progressPercent}%)` },
            { id: 'advice', label: 'Beratung erhalten', primary: true },
          ].map((item) => {
            const isActive = activeNav === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveNav(item.id)}
                style={{
                  border: item.primary
                    ? 'none'
                    : isActive
                      ? '1px solid #f59e0b'
                      : '1px solid rgba(255,255,255,0.18)',
                  backgroundColor: item.primary
                    ? '#f59e0b'
                    : isActive
                      ? 'rgba(245, 158, 11, 0.16)'
                      : 'transparent',
                  color: item.primary ? '#091e2c' : '#ffffff',
                  borderRadius: '999px',
                  padding: '7px 15px',
                  fontSize: '13px',
                  fontWeight: item.primary || isActive ? 700 : 500,
                  cursor: 'pointer',
                }}
              >
                {item.label}
              </button>
            );
          })}
        </nav>
      </header>

      {/* Main Content Area */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '20px 28px 24px' }}>
        {/* LANDING PAGE (HOME): SUMMARY OF IMPORTANT THINGS */}
        {activeNav === 'home' && (
          <div style={{ maxWidth: '900px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Hero Section */}
            <div
              style={{
                background: 'linear-gradient(135deg, #091e2c 0%, #0f766e 100%)',
                color: '#ffffff',
                borderRadius: '16px',
                padding: '24px 28px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: '20px',
              }}
            >
              <div>
                <div
                  style={{
                    display: 'inline-block',
                    fontSize: '11px',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.07em',
                    backgroundColor: 'rgba(245, 158, 11, 0.2)',
                    color: '#fcd34d',
                    padding: '4px 10px',
                    borderRadius: '999px',
                    marginBottom: '10px',
                  }}
                >
                  Fernwärme Anschluss • Alles Wichtige auf einen Blick
                </div>
                <h1 style={{ margin: '0 0 8px 0', fontSize: '27px', fontWeight: 800, lineHeight: 1.2 }}>
                  Klimafreundlich heizen — ohne eigenen Heizkessel
                </h1>
                <p style={{ margin: '0 0 16px 0', fontSize: '14px', color: '#cbd5e1', maxWidth: '580px', lineHeight: 1.5 }}>
                  Erfahren Sie in 60 Sekunden, wie viel Sie mit Fernwärme sparen, ob Ihr Viertel
                  bereits geplant ist und wie Fernwärme im Vergleich zur Wärmepumpe abschneidet.
                </p>
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    onClick={() => setActiveNav('advice')}
                    style={{
                      border: 'none',
                      backgroundColor: '#f59e0b',
                      color: '#091e2c',
                      borderRadius: '10px',
                      padding: '10px 18px',
                      fontSize: '14px',
                      fontWeight: 800,
                      cursor: 'pointer',
                    }}
                  >
                    Gebäude-Check starten →
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveNav('neighborhood')}
                    style={{
                      border: '1px solid rgba(255,255,255,0.3)',
                      backgroundColor: 'rgba(255,255,255,0.08)',
                      color: '#ffffff',
                      borderRadius: '10px',
                      padding: '10px 16px',
                      fontSize: '13.5px',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    Netzkarte &amp; Ersparnis ansehen
                  </button>
                </div>
              </div>

              <div
                style={{
                  backgroundColor: 'rgba(255,255,255,0.1)',
                  border: '1px solid rgba(255,255,255,0.18)',
                  borderRadius: '14px',
                  padding: '14px 18px',
                  textAlign: 'center',
                  flexShrink: 0,
                }}
              >
                <div style={{ fontSize: '28px', fontWeight: 800, color: '#fcd34d' }}>Bis 70 %</div>
                <div style={{ fontSize: '12px', color: '#e2e8f0', marginTop: '2px' }}>
                  Staatliche BEG-Förderung
                </div>
                <div style={{ fontSize: '11px', color: '#99f6e4', marginTop: '6px', fontWeight: 600 }}>
                  ✓ GEG-konform
                </div>
              </div>
            </div>

            {/* 4 Key Summary Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
              {[
                {
                  emoji: '💰',
                  title: 'Bis zu 7.400 € in 10 Jahren sparen',
                  desc: 'Planbare Wärmekosten, keine Schornsteinfeger-Gebühren und bis zu 70 % staatliche Förderung beim Umstieg.',
                },
                {
                  emoji: '📦',
                  title: 'Minimaler Platzbedarf & wartungsarm',
                  desc: 'Nur eine kompakte Übergabestation an der Wand — kein Heizkessel, kein Öltank und kein lautes Außengerät.',
                },
                {
                  emoji: '⚖️',
                  title: 'Fernwärme vs. Wärmepumpe im Vergleich',
                  desc: 'Ideal für Altbau & Mehrfamilienhäuser: hohe Vorlauftemperaturen ohne aufwendigen Heizkörpertausch.',
                },
                {
                  emoji: '🗺️',
                  title: 'Ausbau nach Nachbarschafts-Interesse',
                  desc: 'Straßen wie Sonnenallee (84 %) & Gartenstraße (78 %) sind bereits geplant — prüfen Sie Ihr Viertel live.',
                },
              ].map((card, idx) => (
                <div
                  key={idx}
                  style={{
                    backgroundColor: '#ffffff',
                    border: '1px solid #e2e8f0',
                    borderRadius: '14px',
                    padding: '15px 18px',
                    display: 'flex',
                    gap: '12px',
                    alignItems: 'flex-start',
                  }}
                >
                  <span style={{ fontSize: '26px', lineHeight: 1 }}>{card.emoji}</span>
                  <div>
                    <div style={{ fontSize: '14.5px', fontWeight: 700, color: '#091e2c', marginBottom: '4px' }}>
                      {card.title}
                    </div>
                    <div style={{ fontSize: '12.8px', color: '#475569', lineHeight: 1.45 }}>
                      {card.desc}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Bottom Quick-Action Strip */}
            <div
              style={{
                backgroundColor: '#ffffff',
                border: '1px solid #e2e8f0',
                borderRadius: '14px',
                padding: '14px 18px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '12px',
              }}
            >
              <div style={{ fontSize: '13.5px', color: '#334155' }}>
                <strong>Nächster Schritt:</strong> Geben Sie in 4 kurzen Schritten Ihre Gebäudedaten ein für Ihren persönlichen Vergleich.
              </div>
              <button
                type="button"
                onClick={() => setActiveNav('advice')}
                style={{
                  border: 'none',
                  backgroundColor: '#091e2c',
                  color: '#ffffff',
                  borderRadius: '8px',
                  padding: '9px 16px',
                  fontSize: '13px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  flexShrink: 0,
                }}
              >
                Jetzt starten →
              </button>
            </div>
          </div>
        )}

        {/* TAB 1: ÜBER UNS */}
        {activeNav === 'about' && (
          <div style={{ maxWidth: '820px', margin: '0 auto' }}>
            <div
              style={{
                backgroundColor: '#ffffff',
                borderRadius: '16px',
                border: '1px solid #e2e8f0',
                padding: '24px',
              }}
            >
              <div
                style={{
                  fontSize: '12px',
                  fontWeight: 700,
                  color: '#d97706',
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  marginBottom: '6px',
                }}
              >
                Über EnergiePlus
              </div>
              <h2 style={{ margin: '0 0 10px 0', fontSize: '24px', color: '#091e2c' }}>
                Klimafreundliche Wärme ohne Kompromisse
              </h2>
              <p style={{ margin: '0 0 20px 0', fontSize: '14.5px', color: '#475569', lineHeight: 1.6 }}>
                Wir helfen Hausbesitzern beim Umstieg auf zukunftssichere Heizsysteme. Mit unserem
                digitalen Gebäude-Check vergleichen Sie in 60 Sekunden, ob ein{' '}
                <strong>Fernwärme-Anschluss</strong> oder eine <strong>Wärmepumpe</strong> besser
                zu Ihrem Gebäude passt — transparent, unabhängig und inklusive Förder-Check.
              </p>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(3, 1fr)',
                  gap: '14px',
                  marginBottom: '20px',
                }}
              >
                {[
                  { stat: '14.500+', label: 'Beratene Haushalte' },
                  { stat: 'Bis 70 %', label: 'Staatliche Förderung' },
                  { stat: '4,9 / 5 ★', label: 'Kundenzufriedenheit' },
                ].map((box, idx) => (
                  <div
                    key={idx}
                    style={{
                      backgroundColor: '#f8fafc',
                      border: '1px solid #e2e8f0',
                      borderRadius: '12px',
                      padding: '14px',
                      textAlign: 'center',
                    }}
                  >
                    <div style={{ fontSize: '22px', fontWeight: 800, color: '#091e2c' }}>
                      {box.stat}
                    </div>
                    <div style={{ fontSize: '12.5px', color: '#64748b', marginTop: '3px' }}>
                      {box.label}
                    </div>
                  </div>
                ))}
              </div>

              <button
                type="button"
                onClick={() => setActiveNav('advice')}
                style={{
                  border: 'none',
                  backgroundColor: '#f59e0b',
                  color: '#091e2c',
                  borderRadius: '10px',
                  padding: '11px 20px',
                  fontSize: '14px',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                Jetzt Gebäude-Check starten →
              </button>
            </div>
          </div>
        )}

        {/* TAB 2: NETZKARTE & ERSPARNIS */}
        {activeNav === 'neighborhood' && (
          <div style={{ maxWidth: '900px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <NeighborhoodMap />
            <SavingsAndBenefitsCharts livingArea={livingArea} />
          </div>
        )}

        {/* TAB 3: AKTUELLER FORTSCHRITT */}
        {activeNav === 'progress' && (
          <div style={{ maxWidth: '760px', margin: '0 auto' }}>
            <div
              style={{
                backgroundColor: '#ffffff',
                borderRadius: '16px',
                border: '1px solid #e2e8f0',
                padding: '24px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <h2 style={{ margin: 0, fontSize: '22px', color: '#091e2c' }}>
                  Ihr aktueller Beratungs-Fortschritt
                </h2>
                <span
                  style={{
                    backgroundColor: '#fef3c7',
                    color: '#92400e',
                    fontWeight: 700,
                    fontSize: '13px',
                    padding: '4px 12px',
                    borderRadius: '999px',
                  }}
                >
                  Schritt {step} von 4 ({progressPercent}%)
                </span>
              </div>

              <div
                style={{
                  height: '10px',
                  backgroundColor: '#e2e8f0',
                  borderRadius: '999px',
                  overflow: 'hidden',
                  marginBottom: '20px',
                }}
              >
                <div
                  style={{
                    width: `${progressPercent}%`,
                    height: '100%',
                    backgroundColor: '#f59e0b',
                    transition: 'width 0.3s ease',
                  }}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
                {[
                  { s: 1, title: 'Gebäudetyp', value: selectedBuilding?.label },
                  { s: 2, title: 'Baujahr & Wohnfläche', value: `${selectedYear?.label}, ${livingArea} m²` },
                  { s: 3, title: 'Aktuelle Heizung & PLZ', value: `${selectedHeating?.label} (PLZ ${zipCode})` },
                  { s: 4, title: 'Fernwärme vs. Wärmepumpe Vergleich', value: step === 4 ? 'Ergebnis bereit' : 'Ausstehend' },
                ].map((item) => {
                  const done = step >= item.s;
                  return (
                    <div
                      key={item.s}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '12px 14px',
                        borderRadius: '10px',
                        border: '1px solid #e2e8f0',
                        backgroundColor: done ? '#f0fdf4' : '#f8fafc',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span
                          style={{
                            width: '24px',
                            height: '24px',
                            borderRadius: '50%',
                            backgroundColor: done ? '#16a34a' : '#cbd5e1',
                            color: '#ffffff',
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '12px',
                            fontWeight: 700,
                          }}
                        >
                          {done ? '✓' : item.s}
                        </span>
                        <span style={{ fontWeight: 600, fontSize: '14px' }}>{item.title}</span>
                      </div>
                      <span style={{ fontSize: '13px', color: '#475569', fontWeight: 500 }}>
                        {item.value}
                      </span>
                    </div>
                  );
                })}
              </div>

              <button
                type="button"
                onClick={() => setActiveNav('advice')}
                style={{
                  border: 'none',
                  backgroundColor: '#091e2c',
                  color: '#ffffff',
                  borderRadius: '10px',
                  padding: '11px 20px',
                  fontSize: '14px',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                Zurück zur Beratung (Schritt {step}) →
              </button>
            </div>
          </div>
        )}

        {/* TAB 3 (MAIN): BERATUNG ERHALTEN — STEP-BY-STEP FUNNEL */}
        {activeNav === 'advice' && (
          <div style={{ maxWidth: '860px', margin: '0 auto' }}>
            {/* Step Progress Header */}
            <div style={{ marginBottom: '16px' }}>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '6px',
                }}
              >
                <span style={{ fontSize: '13px', fontWeight: 700, color: '#091e2c' }}>
                  Schritt {step} von 4 — Fernwärme vs. Wärmepumpe Check
                </span>
                <span style={{ fontSize: '12.5px', fontWeight: 600, color: '#d97706' }}>
                  {progressPercent} % abgeschlossen
                </span>
              </div>
              <div
                style={{
                  height: '8px',
                  backgroundColor: '#e2e8f0',
                  borderRadius: '999px',
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    width: `${progressPercent}%`,
                    height: '100%',
                    backgroundColor: '#f59e0b',
                    transition: 'width 0.3s ease',
                  }}
                />
              </div>
            </div>

            {/* STEP 1: GEBÄUDETYP */}
            {step === 1 && (
              <div
                style={{
                  backgroundColor: '#ffffff',
                  borderRadius: '16px',
                  border: '1px solid #e2e8f0',
                  padding: '24px',
                }}
              >
                <h2 style={{ margin: '0 0 6px 0', fontSize: '23px', color: '#091e2c' }}>
                  Welche Art von Gebäude möchten Sie beheizen?
                </h2>
                <p style={{ margin: '0 0 18px 0', fontSize: '14px', color: '#64748b' }}>
                  Wählen Sie Ihren Gebäudetyp, um Fernwärme und Wärmepumpe passend zu vergleichen.
                </p>

                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(2, 1fr)',
                    gap: '12px',
                    marginBottom: '20px',
                  }}
                >
                  {BUILDING_OPTIONS.map((opt) => {
                    const selected = buildingType === opt.id;
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => {
                          setBuildingType(opt.id);
                          setStep(2);
                        }}
                        style={{
                          textAlign: 'left',
                          padding: '16px',
                          borderRadius: '12px',
                          border: selected ? '2px solid #f59e0b' : '1px solid #cbd5e1',
                          backgroundColor: selected ? '#fffbeb' : '#ffffff',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '14px',
                        }}
                      >
                        <span style={{ fontSize: '30px' }}>{opt.emoji}</span>
                        <div>
                          <div style={{ fontWeight: 700, fontSize: '15px', color: '#091e2c' }}>
                            {opt.label}
                          </div>
                          <div style={{ fontSize: '12.5px', color: '#64748b', marginTop: '2px' }}>
                            {opt.desc}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* STEP 2: BAUJAHR & WOHNFLÄCHE */}
            {step === 2 && (
              <div
                style={{
                  backgroundColor: '#ffffff',
                  borderRadius: '16px',
                  border: '1px solid #e2e8f0',
                  padding: '24px',
                }}
              >
                <h2 style={{ margin: '0 0 6px 0', fontSize: '23px', color: '#091e2c' }}>
                  Wann wurde Ihr Gebäude gebaut &amp; wie groß ist es?
                </h2>
                <p style={{ margin: '0 0 18px 0', fontSize: '14px', color: '#64748b' }}>
                  Baujahr und Wohnfläche bestimmen den Wärmebedarf und die Eignung der Systeme.
                </p>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginBottom: '18px' }}>
                  {YEAR_OPTIONS.map((yr) => {
                    const selected = buildYear === yr.id;
                    return (
                      <button
                        key={yr.id}
                        type="button"
                        onClick={() => setBuildYear(yr.id)}
                        style={{
                          padding: '14px',
                          borderRadius: '12px',
                          border: selected ? '2px solid #f59e0b' : '1px solid #cbd5e1',
                          backgroundColor: selected ? '#fffbeb' : '#ffffff',
                          textAlign: 'left',
                          cursor: 'pointer',
                        }}
                      >
                        <div style={{ fontWeight: 700, fontSize: '14px', color: '#091e2c' }}>
                          {yr.label}
                        </div>
                        <div style={{ fontSize: '12px', color: '#64748b', marginTop: '3px' }}>
                          {yr.hint}
                        </div>
                      </button>
                    );
                  })}
                </div>

                <div style={{ marginBottom: '20px' }}>
                  <label
                    htmlFor="living-area-input"
                    style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}
                  >
                    Beheizte Wohnfläche (in m²):
                  </label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <input
                      id="living-area-input"
                      type="number"
                      value={livingArea}
                      onChange={(e) => setLivingArea(e.target.value)}
                      onKeyDown={stopKeys}
                      style={{
                        width: '140px',
                        padding: '9px 12px',
                        borderRadius: '8px',
                        border: '1px solid #cbd5e1',
                        fontSize: '15px',
                        fontWeight: 600,
                      }}
                    />
                    {['110', '140', '200', '300'].map((val) => (
                      <button
                        key={val}
                        type="button"
                        onClick={() => setLivingArea(val)}
                        style={{
                          border: livingArea === val ? '1px solid #091e2c' : '1px solid #cbd5e1',
                          backgroundColor: livingArea === val ? '#091e2c' : '#f8fafc',
                          color: livingArea === val ? '#ffffff' : '#334155',
                          borderRadius: '8px',
                          padding: '8px 12px',
                          fontSize: '13px',
                          fontWeight: 600,
                          cursor: 'pointer',
                        }}
                      >
                        {val} m²
                      </button>
                    ))}
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    style={{
                      border: '1px solid #cbd5e1',
                      backgroundColor: '#ffffff',
                      color: '#334155',
                      borderRadius: '10px',
                      padding: '10px 18px',
                      fontSize: '14px',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    ← Zurück
                  </button>
                  <button
                    type="button"
                    onClick={() => setStep(3)}
                    style={{
                      border: 'none',
                      backgroundColor: '#f59e0b',
                      color: '#091e2c',
                      borderRadius: '10px',
                      padding: '10px 22px',
                      fontSize: '14px',
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                  >
                    Weiter →
                  </button>
                </div>
              </div>
            )}

            {/* STEP 3: AKTUELLE HEIZUNG & PLZ */}
            {step === 3 && (
              <div
                style={{
                  backgroundColor: '#ffffff',
                  borderRadius: '16px',
                  border: '1px solid #e2e8f0',
                  padding: '24px',
                }}
              >
                <h2 style={{ margin: '0 0 6px 0', fontSize: '23px', color: '#091e2c' }}>
                  Wie heizen Sie aktuell &amp; wo liegt das Gebäude?
                </h2>
                <p style={{ margin: '0 0 18px 0', fontSize: '14px', color: '#64748b' }}>
                  So prüfen wir die Förderhöhe (z. B. Geschwindigkeitsbonus) und Netzverfügbarkeit.
                </p>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px', marginBottom: '18px' }}>
                  {HEATING_OPTIONS.map((h) => {
                    const selected = currentHeating === h.id;
                    return (
                      <button
                        key={h.id}
                        type="button"
                        onClick={() => setCurrentHeating(h.id)}
                        style={{
                          padding: '13px 15px',
                          borderRadius: '12px',
                          border: selected ? '2px solid #f59e0b' : '1px solid #cbd5e1',
                          backgroundColor: selected ? '#fffbeb' : '#ffffff',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '10px',
                          fontSize: '14px',
                          fontWeight: 700,
                          color: '#091e2c',
                          cursor: 'pointer',
                        }}
                      >
                        <span style={{ fontSize: '22px' }}>{h.emoji}</span>
                        <span>{h.label}</span>
                      </button>
                    );
                  })}
                </div>

                <div style={{ marginBottom: '20px' }}>
                  <label
                    htmlFor="zip-input"
                    style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}
                  >
                    Postleitzahl des Gebäudes:
                  </label>
                  <input
                    id="zip-input"
                    type="text"
                    maxLength={5}
                    value={zipCode}
                    onChange={(e) => setZipCode(e.target.value)}
                    onKeyDown={stopKeys}
                    placeholder="z. B. 10115"
                    style={{
                      width: '160px',
                      padding: '9px 12px',
                      borderRadius: '8px',
                      border: '1px solid #cbd5e1',
                      fontSize: '15px',
                      fontWeight: 600,
                    }}
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <button
                    type="button"
                    onClick={() => setStep(2)}
                    style={{
                      border: '1px solid #cbd5e1',
                      backgroundColor: '#ffffff',
                      color: '#334155',
                      borderRadius: '10px',
                      padding: '10px 18px',
                      fontSize: '14px',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    ← Zurück
                  </button>
                  <button
                    type="button"
                    onClick={() => setStep(4)}
                    style={{
                      border: 'none',
                      backgroundColor: '#f59e0b',
                      color: '#091e2c',
                      borderRadius: '10px',
                      padding: '10px 22px',
                      fontSize: '14px',
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                  >
                    Vergleich berechnen →
                  </button>
                </div>
              </div>
            )}

            {/* STEP 4: ERGEBNIS — FERNWÄRME VS. WÄRMEPUMPE VERGLEICH */}
            {step === 4 && (
              <div>
                <div
                  style={{
                    backgroundColor: '#ecfdf5',
                    border: '1px solid #a7f3d0',
                    borderRadius: '14px',
                    padding: '14px 18px',
                    marginBottom: '14px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '14px',
                  }}
                >
                  <div>
                    <div style={{ fontSize: '15px', fontWeight: 800, color: '#065f46', marginBottom: '3px' }}>
                      {rec.title}
                    </div>
                    <div style={{ fontSize: '13px', color: '#047857', lineHeight: 1.45 }}>
                      {rec.text}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setRequestSent(true)}
                    style={{
                      flexShrink: 0,
                      border: 'none',
                      borderRadius: '10px',
                      backgroundColor: '#091e2c',
                      color: '#ffffff',
                      padding: '10px 16px',
                      fontSize: '13px',
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                  >
                    {requestSent ? '✓ Beratung angefordert' : 'Kostenloses Angebot →'}
                  </button>
                </div>

                {/* Visual Savings & Benefits Charts + Neighborhood Map */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '14px' }}>
                  <SavingsAndBenefitsCharts livingArea={livingArea} />
                  <NeighborhoodMap />
                </div>

                {/* Comparison Table */}
                <div
                  style={{
                    backgroundColor: '#ffffff',
                    border: '1px solid #e2e8f0',
                    borderRadius: '14px',
                    overflow: 'hidden',
                    marginBottom: '12px',
                  }}
                >
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr 1.3fr 1.3fr',
                      backgroundColor: '#f1f5f9',
                      borderBottom: '1px solid #e2e8f0',
                      fontWeight: 700,
                      fontSize: '13px',
                    }}
                  >
                    <div style={{ padding: '10px 14px' }}>Kriterium</div>
                    <div style={{ padding: '10px 14px', color: '#0f766e', backgroundColor: '#f0fdfa' }}>
                      🔥 Fernwärme Anschluss
                    </div>
                    <div style={{ padding: '10px 14px', color: '#0369a1' }}>⚡ Wärmepumpe</div>
                  </div>

                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr 1.3fr 1.3fr',
                      borderBottom: '1px solid #f1f5f9',
                      fontSize: '13px',
                    }}
                  >
                    <div style={{ padding: '9px 14px', fontWeight: 600 }}>Geschätzte Kosten</div>
                    <div style={{ padding: '9px 14px', backgroundColor: '#f0fdfa', fontWeight: 700, color: '#0f766e' }}>
                      {rec.fernwaermePrice}
                    </div>
                    <div style={{ padding: '9px 14px', color: '#334155' }}>{rec.waermepumpePrice}</div>
                  </div>

                  {COMPARISON_ROWS.map((row, idx) => (
                    <div
                      key={idx}
                      style={{
                        display: 'grid',
                        gridTemplateColumns: '1fr 1.3fr 1.3fr',
                        borderBottom: idx < COMPARISON_ROWS.length - 1 ? '1px solid #f1f5f9' : 'none',
                        fontSize: '12.5px',
                      }}
                    >
                      <div style={{ padding: '8px 14px', fontWeight: 600, color: '#334155' }}>
                        {row.criterion}
                      </div>
                      <div style={{ padding: '8px 14px', backgroundColor: '#f0fdfa', color: '#134e4a' }}>
                        {row.fernwaerme}
                      </div>
                      <div style={{ padding: '8px 14px', color: '#475569' }}>{row.waermepumpe}</div>
                    </div>
                  ))}
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <button
                    type="button"
                    onClick={() => setStep(3)}
                    style={{
                      border: '1px solid #cbd5e1',
                      backgroundColor: '#ffffff',
                      color: '#334155',
                      borderRadius: '8px',
                      padding: '8px 14px',
                      fontSize: '13px',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    ← Angaben ändern
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setStep(1);
                      setRequestSent(false);
                    }}
                    style={{
                      border: '1px solid #cbd5e1',
                      backgroundColor: '#ffffff',
                      color: '#334155',
                      borderRadius: '8px',
                      padding: '8px 14px',
                      fontSize: '13px',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    Neuen Check starten
                  </button>
                </div>
              </div>
            )}

            <BeratungsChatbot />
          </div>
        )}
      </div>
    </div>
  );
}
