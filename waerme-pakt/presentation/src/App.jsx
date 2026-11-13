import React from 'react';
import { Deck, Slide, Box } from 'spectacle';
import FakeGoogleSlide from './components/FakeGoogleSlide';
import GeothermieArt from './components/GeothermieArt';
import './pitch.css';

// Slide size matches the 16:9 pitch PDF, so all measurements can be taken from it directly.
const theme = {
  size: { width: 1456, height: 819 },
  colors: { primary: '#221c19', secondary: '#c04516', tertiary: '#f6f1eb' },
  fonts: { header: 'Montserrat, sans-serif', text: 'Inter, sans-serif' },
};

const ICONS = {
  home: <path d="M3 10.5 12 3l9 7.5V21h-6v-6H9v6H3z" />,
  globe: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18M12 3c2.5 2.5 3.8 5.5 3.8 9s-1.3 6.5-3.8 9c-2.5-2.5-3.8-5.5-3.8-9S9.5 5.5 12 3z" />
    </>
  ),
  bars: <path d="M4 20h16M6 16V9h2.5v7zM10.75 16V5h2.5v11zM15.5 16v-5H18v5z" />,
  chat: (
    <>
      <path d="M12 3a9 9 0 0 0-7.8 13.5L3 21l4.6-1.2A9 9 0 1 0 12 3z" />
      <path d="M8 12.5c1-1.5 2-1.5 3 0s2 1.5 3 0 1.5-1 2-.5" />
    </>
  ),
  people: (
    <>
      <circle cx="9" cy="8" r="3.2" />
      <path d="M3 19c.4-3.4 2.8-5.2 6-5.2s5.6 1.8 6 5.2zM16 5.2a3 3 0 0 1 0 5.6M17.5 13.9c2 .6 3.2 2.3 3.5 5.1h-3" />
    </>
  ),
  gear: (
    <>
      <circle cx="12" cy="12" r="3" />
      <path d="M12 2.5v3M12 18.5v3M2.5 12h3M18.5 12h3M5.3 5.3l2.1 2.1M16.6 16.6l2.1 2.1M5.3 18.7l2.1-2.1M16.6 7.4l2.1-2.1" />
    </>
  ),
  db: (
    <>
      <ellipse cx="12" cy="5.5" rx="7" ry="2.5" />
      <path d="M5 5.5v13c0 1.4 3.1 2.5 7 2.5s7-1.1 7-2.5v-13M5 12c0 1.4 3.1 2.5 7 2.5s7-1.1 7-2.5" />
    </>
  ),
  shield: (
    <>
      <path d="M12 3 4.5 6v5.5c0 4.6 3.2 8.2 7.5 9.5 4.3-1.3 7.5-4.9 7.5-9.5V6z" />
      <path d="m8.8 12 2.3 2.3 4.2-4.4" />
    </>
  ),
};

const Icon = ({ name, style }) => (
  <svg className="icon" viewBox="0 0 24 24" style={style}>
    {ICONS[name]}
  </svg>
);

const Footer = ({ left, page }) => (
  <div className="footer">
    <span>{left}</span>
    <span>{page}</span>
  </div>
);

// Plain slide wrapper: Spectacle handles navigation and scaling, the layout comes from pitch.css.
const PitchSlide = ({ variant = '', children }) => (
  <Slide backgroundColor="transparent" padding="0">
    <div className={`ps ${variant}`}>{children}</div>
  </Slide>
);

export default function App() {
  return (
    <Deck theme={theme}>
      {/* 1 · Titel */}
      <PitchSlide variant="dark">
        <p className="eyebrow">Geothermie Hackathon Pullach · Challenge 3 · NextGen Customer Voice</p>
        <h1 className="title-main">Wärme-Pakt</h1>
        <p className="title-sub">
          Gemeinsam ans Geothermie-Netz –<br />
          Straße für Straße.
        </p>
        <GeothermieArt className="title-art" />
        <div className="footer" style={{ right: 'auto' }}>
          <span>Team HolzHaus · 14. November 2026</span>
        </div>
      </PitchSlide>

      {/* 2 · Problem */}
      <PitchSlide>
        <p className="eyebrow">Das Problem</p>
        <h2 style={{ fontSize: 50, whiteSpace: 'nowrap' }}>
          Ein Netz braucht fünf Jahre – und die
          <br />
          Zusage der Nachbarn, bevor es gebaut wird.
        </h2>
        <div className="cards" style={{ gridTemplateColumns: 'repeat(3, 1fr)', marginTop: 50 }}>
          {[
            ['5', 'Jahre dauert ein Geothermie-Projekt', 'So lange müssen Haushalte warten und auf eine eigene Wärmepumpe verzichten.'],
            ['65 %', 'der Haushalte müssen zusagen, damit der Betreiber baut', 'Schwelle je Netzabschnitt (Annahme, mit dem Betreiber abzustimmen)'],
            ['5 %', 'der Heizungen werden jedes Jahr getauscht', 'Wer heute wechselt, ist für rund 20 Jahre gebunden: Wer zögert, verliert Anschlüsse.'],
          ].map(([stat, label, note]) => (
            <div className="card" key={stat} style={{ minHeight: 300 }}>
              <div className="stat">{stat}</div>
              <p className="stat-label">{label}</p>
              <p className="stat-note">{note}</p>
            </div>
          ))}
        </div>
        <Footer
          left="Quellen: W. Geisinger, Vortrag Hackathon Pullach 2026 (Bundesverband Geothermie; Modellannahme 20 Jahre Heizungslebensdauer)"
          page="2"
        />
      </PitchSlide>

      {/* 3 · Gründe */}
      <PitchSlide>
        <p className="eyebrow">Warum Haushalte nicht unterschreiben</p>
        <h2>Fünf Gründe zu zögern</h2>
        <table>
          <thead>
            <tr>
              <th style={{ width: '24%' }}>Risiko</th>
              <th style={{ width: '30%' }}>Was Bewohner denken</th>
              <th>Antwort im Wärme-Pakt</th>
            </tr>
          </thead>
          <tbody>
            {[
              ['Zeitrisiko', '„Kommt das überhaupt?“', 'Adress-Check, Baufortschritt, Wartegarantie'],
              ['Preisrisiko', '„Wird das teurer als Gas?“', '20-Jahres-Vergleich mit offenen Annahmen'],
              ['Lock-in-Risiko', '„Dann bin ich ausgeliefert.“', 'Bürgerbeteiligung: Anteil am eigenen Netz'],
              ['Informationsrisiko', '„Das versteht doch keiner.“', 'KI-Berater mit den eigenen Zahlen'],
              ['Bequemlichkeit', '„Zu viel Aufwand.“', 'Ein Ablauf: prüfen, rechnen, zusagen'],
            ].map((row) => (
              <tr key={row[0]}>
                {row.map((cell) => (
                  <td key={cell}>{cell}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        <p className="lead" style={{ marginTop: 22 }}>
          „Der Preis alleine sagt nichts“ (W. Geisinger): Wärme-Pakt beantwortet alle fünf Fragen an einem Ort.
        </p>
        <Footer left="Wärme-Pakt · Challenge 3" page="3" />
      </PitchSlide>

      {/* 4 · Lösung */}
      <PitchSlide>
        <p className="eyebrow">Die Lösung</p>
        <h2>So funktioniert der Wärme-Pakt</h2>
        <div className="cards" style={{ gridTemplateColumns: 'repeat(4, 1fr)', gap: 20, marginTop: 40 }}>
          {[
            ['1', 'Prüfen', 'Adresse eingeben: Bauphase, Anschlusstermin und Status der eigenen Straße auf der Karte.'],
            ['2', 'Rechnen', 'Baujahr, Heizung, Fläche: 20-Jahres-Kosten und CO₂ im Vergleich, alle Annahmen offen.'],
            ['3', 'Fragen', 'Der KI-Berater erklärt Zeitplan, Kosten und Wartegarantie – mit den Zahlen aus Schritt 1 und 2.'],
            ['4', 'Zusagen', '„Ich bin dabei“: Die Straße rückt näher an die Schwelle, das Ranking zeigt, wer vorne liegt.'],
          ].map(([n, title, text]) => (
            <div className="card step-card" key={n} style={{ padding: '24px 24px 34px' }}>
              <div className="step-num">{n}</div>
              <h3>{title}</h3>
              <p>{text}</p>
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginTop: 44 }}>
          <strong style={{ fontSize: 24, fontWeight: 600 }}>Jägerstraße (Demo)</strong>
          <strong style={{ fontSize: 24, fontWeight: 600, color: 'var(--rust)' }}>61 % → 67 % zugesagt</strong>
        </div>
        <div className="bar">
          <span style={{ width: '67%', background: 'var(--orange)' }} />
          <span style={{ width: '61%', background: 'var(--rust)' }} />
          <div className="marker" style={{ left: '65%' }} />
        </div>
        <p style={{ fontSize: 18, color: 'var(--muted)', marginTop: 22 }}>
          Schwelle bei 65 %: Ab hier lohnt sich der Bau des Abschnitts.
        </p>
        <Footer left="Wärme-Pakt · Challenge 3" page="4" />
      </PitchSlide>

      {/* 5 · Live-Demo */}
      <PitchSlide variant="rust">
        <div style={{ display: 'grid', gridTemplateColumns: '520px 1fr', gap: 100 }}>
          <div>
            <p className="eyebrow">Live-Demo</p>
            <h2>
              Familie Huber,
              <br />
              Unterhaching
            </h2>
            <p style={{ fontSize: 23, lineHeight: 1.6, marginTop: 30 }}>
              Einfamilienhaus, Baujahr 1985
              <br />
              Gasheizung, 17 Jahre alt
            </p>
          </div>
          <ol className="demo-list" style={{ marginTop: -8 }}>
            {[
              ['Adresse prüfen:', ' Straße in Bauphase 2, Anschluss voraussichtlich 2029'],
              ['Situation eingeben:', ' 20 Jahre Geothermie, Wärmepumpe und Gas im Vergleich'],
              ['Berater fragen:', ' „Was passiert, wenn meine Heizung vorher kaputtgeht?“'],
              ['Beteiligen:', ' 2.000 € anlegen und die erwartete Rendite sehen'],
              ['„Ich bin dabei“:', ' Die Jägerstraße springt von 61 % auf 67 % – über die Schwelle'],
            ].map(([b, rest], i) => (
              <li key={b}>
                <span className="n">{i + 1}</span>
                <span>
                  <strong>{b}</strong>
                  {rest}
                </span>
              </li>
            ))}
          </ol>
        </div>
        <Footer left="Live im Browser · Demodaten für Unterhaching" page="5" />
      </PitchSlide>

      {/* 6 · Technik */}
      <PitchSlide>
        <div style={{ display: 'grid', gridTemplateColumns: '480px 1fr', gap: 66 }}>
          <div className="tech-text">
            <p className="eyebrow" style={{ color: 'var(--rust)' }}>Technische Umsetzung</p>
            <h2 style={{ marginBottom: 40 }}>
              Echter Code,
              <br />
              ehrliche Zahlen
            </h2>
            <p>
              <strong>Ein Rechenmodell.</strong> Reine Python-Funktionen mit Unit-Tests, alle Annahmen in einer Datei.
            </p>
            <p>
              <strong>Ein ehrlicher Berater.</strong> Claude bekommt Adresse, Eingaben und Ergebnis – und erfindet keine
              Preise.
            </p>
            <p>
              <strong>Schlank.</strong> Keine Abhängigkeiten, echte Straßen aus OpenStreetMap.
            </p>
          </div>
          <div style={{ marginTop: 5 }}>
            <div className="arch-card" style={{ background: 'var(--dark)', color: 'var(--light)', display: 'flex', alignItems: 'center', gap: 16, padding: '22px 36px' }}>
              <Icon name="home" style={{ stroke: 'var(--orange)' }} />
              <span style={{ fontFamily: 'var(--head)', fontWeight: 700, fontSize: 24 }}>Bewohner im Browser</span>
              <span style={{ fontSize: 18, color: 'var(--light-muted)' }}>HTML · JavaScript · Chart.js</span>
            </div>
            <Arrow />
            <div className="cards" style={{ gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              {[
                ['globe', 'Karte', 'Leaflet und OpenStreetMap, 20 echte Straßen'],
                ['bars', 'Kostenmodell', 'cost_model.py: 20-Jahres-Kosten und CO₂, getestet'],
                ['chat', 'KI-Berater', '/api/chat: Claude-fähig, in der Demo mit festen Antworten'],
                ['people', 'Nachbarschaft', 'Zusagen live, Straßen-Ranking, Betreiber-Ansicht'],
              ].map(([icon, t, d]) => (
                <div className="card arch-card" key={t}>
                  <div className="t">
                    <Icon name={icon} />
                    {t}
                  </div>
                  <p>{d}</p>
                </div>
              ))}
            </div>
            <Arrow />
            <div className="cards" style={{ gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              {[
                ['gear', 'assumptions.json', 'Alle Preise und Faktoren'],
                ['db', 'data/*.json', 'Straßen, Netz, Baufortschritt'],
              ].map(([icon, t, d]) => (
                <div className="card outline arch-card" key={t}>
                  <div className="t">
                    <Icon name={icon} />
                    {t}
                  </div>
                  <p>{d}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
        <Footer left="Wärme-Pakt · Challenge 3" page="6" />
      </PitchSlide>

      {/* 7 · Wirtschaftlichkeit */}
      <PitchSlide>
        <p className="eyebrow">Wirtschaftlichkeit</p>
        <h2>Mehr Zusagen, früher bauen</h2>
        <p className="lead" style={{ marginTop: 18 }}>
          Jeder Haushalt, der jetzt auf eine andere Heizung umsteigt, fehlt dem Netz für rund 20 Jahre.
        </p>
        <div className="cards" style={{ gridTemplateColumns: 'repeat(3, 1fr)', marginTop: 44 }}>
          {[
            ['bars', 'Betreiber-Dashboard', 'Live-Stand je Straße: Wo die Schwelle fast erreicht ist, lohnt sich der nächste Hausbesuch.'],
            ['people', 'Lokale Ansprache', 'Haushalte mit alten Kesseln zuerst – gemeinsam mit Schornsteinfegern und Vereinen vor Ort.'],
            ['shield', 'Kapital aus dem Ort', 'Bürgerbeteiligung mit fester Verzinsung: Wer mitbesitzt, bleibt – und wirbt Nachbarn.'],
          ].map(([icon, t, d]) => (
            <div className="card econ-card" key={t} style={{ minHeight: 288 }}>
              <Icon name={icon} />
              <h3>{t}</h3>
              <p>{d}</p>
            </div>
          ))}
        </div>
        <Footer left="Annahme: rund 20 Jahre Heizungslebensdauer (Modellannahme, W. Geisinger)" page="7" />
      </PitchSlide>

      {/* 8 · Skalierung */}
      <PitchSlide>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 595px', gap: 70 }}>
          <div>
            <p className="eyebrow">Skalierung</p>
            <h2 style={{ marginBottom: 32 }}>
              Neue Gemeinde,
              <br />
              neuer Datensatz
            </h2>
            <p className="lead" style={{ marginBottom: 22 }}>
              Straßen, Netzplan, Preise und Zusage-Schwelle liegen in Daten-Dateien. Der Code bleibt gleich.
            </p>
            <p className="lead">
              Allein der Heizkosten-Vergleich des Praxisforums Geothermie Bayern führt 18 Geothermie-Wärmenetze.
            </p>
          </div>
          <div className="next-box" style={{ marginTop: 5 }}>
            <p className="eyebrow">Nächste Schritte</p>
            <ol style={{ listStyle: 'none', margin: 0, padding: 0 }}>
              {[
                'Echte Preise und Netzdaten von Geothermie Unterhaching einsetzen',
                'Pilot in einem Quartier vor Baubeginn',
                'Entscheiden: Preisgarantie, Frühzeichner-Rabatt, Schwellen-Vertrag, Ausstiegsklausel',
              ].map((t, i) => (
                <li key={t}>
                  <span className="n">{i + 1}</span>
                  <span>{t}</span>
                </li>
              ))}
            </ol>
          </div>
        </div>
        <Footer left="Quelle: Praxisforum Geothermie Bayern, Pressemitteilung Enerchange 13.02.2026" page="8" />
      </PitchSlide>

      {/* 9 · Abschluss */}
      <PitchSlide variant="dark">
        <h2 className="quote">
          „Die Tiefengeothermie entscheidet sich an
          <br />
          der Oberfläche.“
        </h2>
        <p className="quote-by">Wolfgang Geisinger, Geothermie Unterhaching</p>
        <p className="quote-punch">
          Wärme-Pakt bringt diese Entscheidung an den Küchentisch –
          <br />
          Straße für Straße.
        </p>
        <Footer left="Team HolzHaus · Live-Demo: Wärme-Pakt-App (Python, Leaflet, Claude)" page="9" />
      </PitchSlide>

      {/* Anhang · interaktive Such-Demo (aus der vorherigen Fassung übernommen) */}
      <Slide backgroundColor="#221c19" padding="28px">
        <Box width="100%" height="100%">
          <FakeGoogleSlide />
        </Box>
      </Slide>
    </Deck>
  );
}

function Arrow() {
  return (
    <div className="arrow">
      <svg width="16" height="32" viewBox="0 0 16 32">
        <line x1="8" y1="0" x2="8" y2="20" stroke="#c04516" strokeWidth="3" />
        <path d="M1 18h14L8 31z" fill="#c04516" />
      </svg>
    </div>
  );
}
