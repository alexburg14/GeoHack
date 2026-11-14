import React, { useEffect, useRef, useState } from 'react';
import ArPreview from './ArPreview';
import FactorPanel from './FactorPanel';
import LongRunStory from './LongRunStory';
import NeighborhoodPage from './NeighborhoodPage';
import GuaranteeSlides from './GuaranteeSlides';
import GenossenschaftPage from './GenossenschaftPage';
import MitgliederPage from './MitgliederPage';
import FragenPage from './FragenPage';
import { STREETS, PHASES, findStreet, areaOfStreet } from '../data/town';
import { compare, connectionYear, START_YEAR, YEARS, ASSUMPTIONS_NOTE } from '../data/costModel';
import './landing.css';

// How long to wait after the last keystroke before a complete address forwards to step 2.
const AUTO_FORWARD_MS = 1200;

const BUILDING_OPTIONS = [
  { id: 'efh', label: 'Einfamilienhaus', emoji: '🏠', desc: 'Freistehend oder Doppelhaushälfte' },
  { id: 'rh', label: 'Reihenhaus', emoji: '🏘️', desc: 'Mittel- oder Endhaus' },
  { id: 'zfh', label: 'Zweifamilienhaus', emoji: '🏡', desc: 'Zwei getrennte Wohneinheiten' },
  { id: 'mfh', label: 'Mehrfamilienhaus', emoji: '🏢', desc: 'Ab 3 Wohneinheiten' },
];

// Alex's cost model covers gas and oil boilers.
const HEATING_OPTIONS = [
  { id: 'gas', label: 'Gasheizung', emoji: '🔥', fuel: 'Gas' },
  { id: 'oel', label: 'Ölheizung', emoji: '🛢️', fuel: 'Öl' },
];

const RENOVATION_OPTIONS = [
  { id: 'unsaniert', label: 'Unsaniert' },
  { id: 'teilsaniert', label: 'Teilsaniert' },
  { id: 'vollsaniert', label: 'Vollsaniert' },
];

const OPTION_META = {
  fernwaerme: { label: 'Geothermie-Fernwärme', color: '#bf4416', width: 4 },
  waermepumpe: { label: 'Wärmepumpe', color: '#2f6f8f', width: 2.5 },
  bestand: { label: 'Weiter mit Gas', color: '#7a6e65', width: 2.5, dash: '6 5' },
};

// "Der Preis allein sagt nichts" (same rows as the Wärme-Pakt app)
const FACTS = [
  ['Gerät im Haus', 'kleine Übergabestation', 'Außengerät + Speicher', 'Kessel + Schornstein'],
  ['Wartung', 'durch den Betreiber', 'jährlich', 'jährlich + Schornsteinfeger'],
  ['CO₂-Preis', 'kaum betroffen', 'über den Strommix', 'steigt jedes Jahr'],
  ['Wärme aus', 'über 3.000 m Tiefe', 'Außenluft + Strom', 'Importgas / Öl'],
];

// Expected connection year from the street data; unknown streets get an estimate after the last phase.
const expectedConnection = (street) => {
  const year = street && connectionYear(street.expectedConnection);
  return year ? { year, estimated: false } : { year: START_YEAR + 6, estimated: true };
};

const TOTAL_PLEDGED = STREETS.reduce((n, s) => n + s.pledged, 0);

const eur = (n) => `${Math.round(n).toLocaleString('de-DE')} €`;
const clampNum = (val, min, max, fallback) => {
  const n = Number(val);
  return Number.isFinite(n) && n >= min && n <= max ? n : fallback;
};

const isAddressComplete = (street, houseNo, zip) =>
  street.trim().length >= 3 && houseNo.trim().length > 0 && /^\d{5}$/.test(zip.trim());

// Spectacle uses the arrow keys for slide navigation; keep them inside form fields.
const stopKeys = (e) => e.stopPropagation();

export default function AdLandingPage({ clickedFrom, onBackToSearch }) {
  // Pages: 'home', 'pruefen' (step 1), 'rechnen' (step 2), 'ergebnis', 'nachbarschaft', 'genossenschaft', 'mitglieder', 'fragen', 'about'
  const [page, setPage] = useState('home');
  const [chat, setChat] = useState([]); // advisor conversation, kept across tab switches
  const [portalTab, setPortalTab] = useState('fortschritt');
  const mainRef = useRef(null);
  // On phones the nav scrolls sideways: keep the active tab visible.
  useEffect(() => {
    const nav = document.querySelector('.ep-nav');
    const active = nav?.querySelector('button.active');
    if (nav && active && nav.scrollWidth > nav.clientWidth) {
      nav.scrollTo({ left: active.offsetLeft - (nav.clientWidth - active.offsetWidth) / 2, behavior: 'smooth' });
    }
  }, [page]);
  // Each page starts at the top.
  useEffect(() => {
    if (mainRef.current) mainRef.current.scrollTop = 0;
  }, [page]);

  const [street, setStreet] = useState('');
  const [houseNo, setHouseNo] = useState('');
  const [zipCode, setZipCode] = useState('');
  const [addressDone, setAddressDone] = useState(false);
  const [forwarding, setForwarding] = useState(false);

  const [buildingType, setBuildingType] = useState('efh');
  const [buildYear, setBuildYear] = useState('1985');
  const [renovation, setRenovation] = useState('unsaniert');
  const [livingArea, setLivingArea] = useState('140');
  const [persons, setPersons] = useState('4');
  const [currentHeating, setCurrentHeating] = useState('gas');
  const [heatingAge, setHeatingAge] = useState('17');
  const [hasResult, setHasResult] = useState(false);
  // "What if" price factors from the result page (empty = assumptions.json).
  const [factors, setFactors] = useState({});
  const [requestSent, setRequestSent] = useState(false);

  const addressOk = isAddressComplete(street, houseNo, zipCode);
  const matchedStreet = findStreet(street);
  const myArea = areaOfStreet(matchedStreet);

  // Auto-forward: once the address is complete and the user stops typing, go to step 2.
  useEffect(() => {
    if (page !== 'pruefen' || !addressOk) {
      setForwarding(false);
      return undefined;
    }
    setForwarding(true);
    const t = setTimeout(() => {
      setForwarding(false);
      setAddressDone(true);
      setPage('rechnen');
    }, AUTO_FORWARD_MS);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [street, houseNo, zipCode]);

  const submitAddress = (e) => {
    e.preventDefault();
    if (!addressOk) return;
    setAddressDone(true);
    setPage('rechnen');
  };

  const showResult = () => {
    setHasResult(true);
    setRequestSent(false);
    setPage('ergebnis');
  };

  const restart = () => {
    setStreet('');
    setHouseNo('');
    setZipCode('');
    setAddressDone(false);
    setHasResult(false);
    setRequestSent(false);
    setPage('pruefen');
  };

  const selectedBuilding = BUILDING_OPTIONS.find((b) => b.id === buildingType);
  const selectedHeating = HEATING_OPTIONS.find((h) => h.id === currentHeating);
  const addressLabel = `${street.trim()} ${houseNo.trim()}, ${zipCode.trim()}`;

  // Same input ranges as Alex's validate_inputs(); out-of-range values fall back to the demo household.
  const inputs = {
    baujahr: clampNum(buildYear, 1800, 2026, 1985),
    heizung: currentHeating,
    heizungsalter: clampNum(heatingAge, 0, 60, 17),
    wohnflaeche: clampNum(livingArea, 20, 1000, 140),
    personen: clampNum(persons, 1, 15, 4),
    sanierung: renovation,
  };
  const conn = expectedConnection(matchedStreet);
  const result = compare(inputs, conn.year, { factors });
  const baseline = compare(inputs, conn.year);
  const longRun = compare(inputs, conn.year, { years: 40, factors });
  const optionKeys = ['fernwaerme', 'waermepumpe', 'bestand'];
  const cheapest = optionKeys.reduce((x, y) => (result.optionen[x].gesamt_eur <= result.optionen[y].gesamt_eur ? x : y));
  const cleanest = optionKeys.reduce((x, y) => (result.optionen[x].co2_t <= result.optionen[y].co2_t ? x : y));
  const optionLabel = (k) => (k === 'bestand' ? `Weiter mit ${selectedHeating.fuel}` : OPTION_META[k].label);

  const steps = [
    { id: 'pruefen', num: '1', label: 'Prüfen', done: addressDone, enabled: true },
    { id: 'rechnen', num: '2', label: 'Rechnen', done: hasResult, enabled: addressDone },
    { id: 'ergebnis', num: '✓', label: 'Ergebnis', done: false, enabled: hasResult },
    { id: 'fragen', num: null, label: 'Fragen?', done: false, enabled: true },
  ];
  const links = [
    { id: 'nachbarschaft', label: 'Nachbarschaft' },
    { id: 'genossenschaft', label: 'Genossenschaft' },
    { id: 'mitglieder', label: 'Mitglieder' },
    { id: 'about', label: 'Über uns' },
  ];

  const StreetStatus = ({ compact }) => {
    if (!matchedStreet) {
      return (
        <div className="ep-status">
          <span className="dot" style={{ background: 'var(--keep)' }} />
          <span className="muted" style={{ fontSize: 13.5 }}>
            {compact ? addressLabel : 'Straße noch nicht im Ausbauplan'} — wir prüfen Ihre Adresse persönlich.
          </span>
        </div>
      );
    }
    const meta = PHASES[matchedStreet.phase];
    return (
      <div className="ep-status">
        <span className="dot" style={{ background: meta.color }} />
        <div>
          <strong style={{ fontSize: 14 }}>{compact ? addressLabel : matchedStreet.name}</strong>
          <div className="muted" style={{ fontSize: 13 }}>
            Bauphase {matchedStreet.phase} · Anschluss {matchedStreet.expectedConnection}
            {myArea && ` · ${Math.round((myArea.pledged / myArea.households) * 100)} % in ${myArea.name} haben zugesagt`}
          </div>
        </div>
        <span className="pill" style={{ background: meta.bg, color: meta.text }}>
          {meta.label}
        </span>
      </div>
    );
  };

  return (
    <div className="ep animate-fade-up">
      {/* Fake browser bar */}
      <div className="ep-browser">
        <div className="dots">
          <span style={{ background: '#ff5f56' }} />
          <span style={{ background: '#ffbd2e' }} />
          <span style={{ background: '#27c93f' }} />
        </div>
        <button type="button" className="back" onClick={onBackToSearch}>
          ← Zurück zu Google
        </button>
        <div className="url">https://www.fernwaerme-anschluss.example.de/{page}</div>
        <div className="tag">🎯 Ad-Klick: {clickedFrom}</div>
      </div>

      {/* Top bar: brand + steps (Wärme-Pakt style) */}
      <header className="ep-top">
        <button type="button" className="ep-brand" onClick={() => setPage('home')} title="Zur Startseite">
          <span className="logo">E+</span>
          <span>
            <b>EnergiePlus</b>
            <small>Fernwärme-Check</small>
          </span>
        </button>
        <nav className="ep-nav">
          {steps.map((s) => (
            <button
              key={s.id}
              type="button"
              disabled={!s.enabled}
              className={`${page === s.id ? 'active' : ''} ${s.done && page !== s.id ? 'done' : ''}`}
              onClick={() => setPage(s.id)}
            >
              {s.num && <span className="num">{s.num}</span>}
              {s.label}
            </button>
          ))}
          <span className="sep" />
          {links.map((l) => (
            <button
              key={l.id}
              type="button"
              className={`link ${page === l.id ? 'active' : ''}`}
              onClick={() => {
                if (l.id === 'mitglieder') setPortalTab('fortschritt');
                setPage(l.id);
              }}
            >
              {l.label}
            </button>
          ))}
        </nav>
      </header>

      <div ref={mainRef} className={`ep-main ${page === 'home' ? 'flush' : ''}`}>
        {/* STARTSEITE: die Garantien als Slideshow, darunter die Nachbarschaft */}
        {page === 'home' && (
          <div className="ep-home" key="home">
            <GuaranteeSlides
              onStart={() => setPage('pruefen')}
              pledgedTotal={TOTAL_PLEDGED}
              onNeighbourhood={() =>
                mainRef.current?.scrollTo({ top: mainRef.current.querySelector('.ep-home-section').offsetTop, behavior: 'smooth' })
              }
            />
            <section className="ep-home-section">
              <NeighborhoodPage embedded myAreaId={myArea?.id} onCheckAddress={() => setPage('pruefen')} />
            </section>
          </div>
        )}

        {/* SCHRITT 1: PRÜFEN */}
        {page === 'pruefen' && (
          <div className="ep-page" key="pruefen" style={{ maxWidth: 760 }}>
            <div>
              <p className="eyebrow">Schritt 1 · Adresse prüfen</p>
              <h1>Kommt die Fernwärme in Ihre Straße?</h1>
              <p className="muted" style={{ marginTop: 10, fontSize: 16 }}>
                Geben Sie Ihre Adresse ein. Sobald sie vollständig ist, geht es automatisch weiter zu Schritt 2.
              </p>
            </div>

            <form className="ep-card" onSubmit={submitAddress} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div className="ep-address">
                <label className="field">
                  Straße
                  <input
                    className="text"
                    autoFocus
                    value={street}
                    onChange={(e) => setStreet(e.target.value)}
                    onKeyDown={stopKeys}
                    placeholder="z. B. Ottostraße"
                    list="ep-streets"
                    autoComplete="off"
                  />
                  <datalist id="ep-streets">
                    {STREETS.map((s) => (
                      <option key={s.id} value={s.name} />
                    ))}
                  </datalist>
                </label>
                <label className="field">
                  Nr.
                  <input
                    className="text"
                    value={houseNo}
                    onChange={(e) => setHouseNo(e.target.value)}
                    onKeyDown={stopKeys}
                    placeholder="12"
                    autoComplete="off"
                  />
                </label>
                <label className="field">
                  PLZ
                  <input
                    className="text"
                    inputMode="numeric"
                    maxLength={5}
                    value={zipCode}
                    onChange={(e) => setZipCode(e.target.value.replace(/\D/g, ''))}
                    onKeyDown={stopKeys}
                    placeholder="82319"
                    autoComplete="off"
                  />
                </label>
              </div>

              {street.trim().length >= 3 && <StreetStatus />}

              {forwarding ? (
                <div className="ep-forward" key={`${street}|${houseNo}|${zipCode}`}>
                  <span>Adresse erkannt — weiter zu Schritt 2 …</span>
                  <span className="bar" style={{ '--ep-delay': `${AUTO_FORWARD_MS}ms` }}>
                    <span />
                  </span>
                </div>
              ) : (
                <button type="submit" className="ep-btn primary" disabled={!addressOk} style={{ width: '100%' }}>
                  Adresse prüfen
                </button>
              )}
            </form>
          </div>
        )}

        {/* SCHRITT 2: RECHNEN */}
        {page === 'rechnen' && (
          <div className="ep-page" key="rechnen">
            <div>
              <p className="eyebrow">Schritt 2 · Kosten rechnen</p>
              <h1>Erzählen Sie uns von Ihrem Gebäude</h1>
            </div>

            <StreetStatus compact />

            <div className="ep-card" style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              <div>
                <p className="ep-section-label">Gebäudetyp</p>
                <div className="ep-grid2">
                  {BUILDING_OPTIONS.map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      className={`ep-option ${buildingType === opt.id ? 'selected' : ''}`}
                      onClick={() => setBuildingType(opt.id)}
                    >
                      <span className="emoji">{opt.emoji}</span>
                      <span>
                        <span className="t">{opt.label}</span>
                        <span className="d" style={{ display: 'block' }}>{opt.desc}</span>
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="ep-grid2" style={{ gap: 18 }}>
                <NumberField label="Baujahr" value={buildYear} onChange={setBuildYear} presets={['1965', '1985', '2000', '2015']} />
                <div>
                  <p className="ep-section-label">Sanierungsstand</p>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {RENOVATION_OPTIONS.map((r) => (
                      <button
                        key={r.id}
                        type="button"
                        className={`ep-chip ${renovation === r.id ? 'selected' : ''}`}
                        onClick={() => setRenovation(r.id)}
                      >
                        {r.label}
                      </button>
                    ))}
                  </div>
                </div>
                <NumberField label="Beheizte Wohnfläche" unit="m²" value={livingArea} onChange={setLivingArea} presets={['110', '140', '200']} />
                <NumberField label="Personen im Haushalt" value={persons} onChange={setPersons} presets={['1', '2', '4']} />
              </div>

              <div>
                <p className="ep-section-label">Aktuelle Heizung</p>
                <div className="ep-grid2">
                  {HEATING_OPTIONS.map((h) => (
                    <button
                      key={h.id}
                      type="button"
                      className={`ep-option ${currentHeating === h.id ? 'selected' : ''}`}
                      onClick={() => setCurrentHeating(h.id)}
                    >
                      <span className="emoji" style={{ fontSize: 22 }}>{h.emoji}</span>
                      <span className="t">{h.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <NumberField label="Alter der Heizung" unit="Jahre" value={heatingAge} onChange={setHeatingAge} presets={['5', '10', '17', '25']} />

              <div className="ep-actions">
                <button type="button" className="ep-btn ghost" onClick={() => setPage('pruefen')}>
                  ← Adresse ändern
                </button>
                <button type="button" className="ep-btn primary" onClick={showResult}>
                  Vergleich berechnen →
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ERGEBNIS: eigene Seite, Aufbau wie im Wärme-Pakt-Vergleich */}
        {page === 'ergebnis' && (
          <div className="ep-page" key="ergebnis" style={{ maxWidth: 1080 }}>
            <div>
              <p className="eyebrow">Ihr Ergebnis</p>
              <h1>Ihre Heizkosten über 20 Jahre</h1>
              <div className="ep-summary" style={{ marginTop: 12 }}>
                <span>📍 {addressLabel}</span>
                <span>{selectedBuilding?.label}</span>
                <span>Baujahr {inputs.baujahr}</span>
                <span>{inputs.wohnflaeche} m²</span>
                <span>{inputs.personen} Personen</span>
                <span>{selectedHeating.label}, {inputs.heizungsalter} Jahre</span>
              </div>
              <p className="muted" style={{ fontSize: 13, marginTop: 10 }}>
                Geschätzter Wärmebedarf: {result.waermebedarf_kwh.toLocaleString('de-DE')} kWh pro Jahr · Zeitraum{' '}
                {START_YEAR}–{START_YEAR + YEARS - 1}
              </p>
            </div>

            <div className="ep-options">
              {optionKeys.map((k) => {
                const o = result.optionen[k];
                const running = (o.gesamt_eur - o.investition_eur) / YEARS;
                return (
                  <div key={k} className={`ep-card ep-opt ${k}`}>
                    <h3>{optionLabel(k)}</h3>
                    <div className="total">{eur(o.gesamt_eur)}</div>
                    <small className="muted">Gesamtkosten in 20 Jahren</small>
                    <dl>
                      <dt>Investition</dt>
                      <dd>{eur(o.investition_eur)}</dd>
                      <dt>Laufend Ø pro Jahr</dt>
                      <dd>{eur(running)}</dd>
                      <dt>CO₂ in 20 Jahren</dt>
                      <dd>{o.co2_t.toLocaleString('de-DE', { minimumFractionDigits: 1 })} t</dd>
                      {k === 'fernwaerme' && (
                        <>
                          <dt>Anschluss</dt>
                          <dd>
                            {conn.estimated ? 'ca. ' : ''}
                            {result.anschlussjahr}
                            {o.jahre_bis_anschluss ? `, bis dahin ${selectedHeating.fuel}` : ''}
                          </dd>
                        </>
                      )}
                      {k === 'bestand' && o.investition_eur > 0 && (
                        <>
                          <dt>Kesseltausch</dt>
                          <dd>enthalten</dd>
                        </>
                      )}
                    </dl>
                    <div className="badges">
                      {k === cheapest && <span className="ep-tag">Niedrigste Kosten</span>}
                      {k === cleanest && <span className="ep-tag ok">Wenigste CO₂</span>}
                    </div>
                  </div>
                );
              })}
            </div>

            <FactorPanel
              factors={factors}
              setFactors={setFactors}
              defaultJaz={baseline.jaz}
              result={result}
              baseline={baseline}
              keys={optionKeys}
              meta={OPTION_META}
              label={optionLabel}
            />

            <LongRunStory
              scrollRoot={mainRef}
              result={longRun}
              keys={optionKeys}
              meta={OPTION_META}
              label={optionLabel}
              heatingAge={inputs.heizungsalter}
            />

            <div className="ep-card">
              <h2 style={{ marginBottom: 12 }}>Der Preis allein sagt nichts</h2>
                <table className="ep-facts">
                  <thead>
                    <tr>
                      <th />
                      <th>Fernwärme</th>
                      <th>Wärme&shy;pumpe</th>
                      <th>Bisher</th>
                    </tr>
                  </thead>
                  <tbody>
                    {FACTS.map((row) => (
                      <tr key={row[0]}>
                        {row.map((cell) => (
                          <td key={cell}>{cell}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
            </div>

            <ArPreview />

            <p className="muted" style={{ fontSize: 12.5 }}>{ASSUMPTIONS_NOTE}</p>

            <div className="ep-actions">
              <button type="button" className="ep-btn ghost" onClick={() => setPage('rechnen')}>
                ← Angaben ändern
              </button>
              <div style={{ display: 'flex', gap: 10 }}>
                <button type="button" className="ep-btn ghost" onClick={restart}>
                  Neuen Check starten
                </button>
                <button type="button" className="ep-btn primary" onClick={() => setRequestSent(true)}>
                  {requestSent ? '✓ Beratung angefordert' : 'Kostenloses Angebot →'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* NACHBARSCHAFT: Karte mit Zusagen und Bauphasen */}
        {page === 'nachbarschaft' && (
          <NeighborhoodPage key="nachbarschaft" myAreaId={myArea?.id} onCheckAddress={() => setPage('pruefen')} />
        )}

        {/* GENOSSENSCHAFT */}
        {page === 'genossenschaft' && (
          <GenossenschaftPage
            key="genossenschaft"
            demandKwh={hasResult ? result.waermebedarf_kwh : null}
            onOpenPortal={() => { setPortalTab('fortschritt'); setPage('mitglieder'); }}
          />
        )}

        {/* MITGLIEDERPORTAL */}
        {page === 'mitglieder' && (
          <MitgliederPage
            key={`mitglieder-${portalTab}`}
            initialTab={portalTab}
            demandKwh={hasResult ? result.waermebedarf_kwh : null}
            onCheckAddress={() => setPage('pruefen')}
          />
        )}

        {/* FRAGEN: der KI-Berater aus der Wärme-Pakt-App */}
        {page === 'fragen' && (
          <FragenPage
            key="fragen"
            street={addressDone && matchedStreet ? matchedStreet.name : null}
            houseNo={houseNo.trim()}
            outsideNetwork={addressDone && !matchedStreet}
            connection={matchedStreet ? `${matchedStreet.expectedConnection} (${PHASES[matchedStreet.phase].label})` : ''}
            inputs={hasResult ? inputs : null}
            houseLabel={`${selectedBuilding.label}, Baujahr ${inputs.baujahr}, ${inputs.wohnflaeche} m², ${selectedHeating.label} (${inputs.heizungsalter} Jahre)`}
            chat={chat}
            setChat={setChat}
            onCheckAddress={() => setPage('pruefen')}
            onReportProblem={() => { setPortalTab('stoerung'); setPage('mitglieder'); }}
          />
        )}

        {/* ÜBER UNS */}
        {page === 'about' && (
          <div className="ep-page" key="about" style={{ maxWidth: 820 }}>
            <div className="ep-card">
              <p className="eyebrow">Über EnergiePlus</p>
              <h1 style={{ fontSize: 28, marginBottom: 10 }}>Klimafreundliche Wärme ohne Kompromisse</h1>
              <p className="muted" style={{ marginBottom: 20, lineHeight: 1.6 }}>
                Wir helfen Hausbesitzern beim Umstieg auf zukunftssichere Heizsysteme. Mit unserem digitalen Gebäude-Check
                vergleichen Sie in 60 Sekunden, ob ein <strong>Fernwärme-Anschluss</strong> oder eine{' '}
                <strong>Wärmepumpe</strong> besser zu Ihrem Gebäude passt — transparent, unabhängig und inklusive
                Förder-Check.
              </p>
              <div className="ep-grid3" style={{ marginBottom: 20 }}>
                {[
                  ['14.500+', 'Beratene Haushalte'],
                  ['Bis 70 %', 'Staatliche Förderung'],
                  ['4,9 / 5 ★', 'Kundenzufriedenheit'],
                ].map(([stat, label]) => (
                  <div key={label} className="ep-stat">
                    <b>{stat}</b>
                    <small>{label}</small>
                  </div>
                ))}
              </div>
              <button type="button" className="ep-btn primary" onClick={() => setPage('pruefen')}>
                Jetzt Adresse prüfen →
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function NumberField({ label, unit, value, onChange, presets }) {
  return (
    <div>
      <p className="ep-section-label">
        {label}
        {unit ? ` (${unit})` : ''}
      </p>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        <input
          className="text"
          type="number"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={stopKeys}
          style={{ width: 100, marginTop: 0 }}
        />
        {presets.map((p) => (
          <button key={p} type="button" className={`ep-chip ${value === p ? 'selected' : ''}`} onClick={() => onChange(p)}>
            {p}
          </button>
        ))}
      </div>
    </div>
  );
}
