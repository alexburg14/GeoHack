import React, { useEffect, useState } from 'react';

// "Jede Sorge bekommt eine Garantie" (pitch slide 5) as an auto-playing slideshow.
const GUARANTEES = [
  {
    title: 'Wartegarantie',
    text: 'Übergangsheizung ohne Investition, bis der Anschluss kommt.',
    against: 'Wartezeit',
    icon: '⏳',
    detail: 'Fällt Ihre alte Heizung vorher aus, bekommen Sie eine mobile Heizzentrale oder einen Mietkessel. Ein neuer Gaskessel ist nicht nötig.',
  },
  {
    title: 'Schwellen-Vertrag',
    text: 'Die Zusage gilt erst, wenn die Straße die Schwelle erreicht.',
    against: 'Ungewissheit',
    icon: '🤝',
    detail: 'Bis genug Nachbarn dabei sind, gehen Sie keine Verpflichtung ein. Gebaut wird nur, wo es sich für alle lohnt.',
  },
  {
    title: 'Preisgarantie',
    text: 'Maximale Erhöhung von 10 %. Dazu ein offener 40-Jahres-Vergleich zur Wärmepumpe.',
    against: 'Preis',
    icon: '🛡️',
    detail: 'Alle Annahmen hinter dem Vergleich sind offen einsehbar, damit Sie selbst nachrechnen können.',
  },
  {
    title: 'Ausstiegsklausel',
    text: 'Kostenloser Rücktritt bei mehr als 2 Jahren Verzug.',
    against: 'Bindung',
    icon: '🚪',
    detail: 'Kommt Ihr Anschluss deutlich später als angekündigt, sind Sie frei und zahlen nichts.',
  },
];

const AUTOPLAY_MS = 5000;

export default function GuaranteeSlides({ onStart, onNeighbourhood, pledgedTotal }) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused) return undefined;
    const t = setTimeout(() => setIndex((i) => (i + 1) % GUARANTEES.length), AUTOPLAY_MS);
    return () => clearTimeout(t);
  }, [index, paused]);

  const go = (i) => setIndex((i + GUARANTEES.length) % GUARANTEES.length);
  const g = GUARANTEES[index];

  return (
    <section className="ep-guarantees hero" onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}>
      <div className="ep-guarantees-intro">
        <p className="eyebrow">Geothermie-Fernwärme für Unterhaching</p>
        <h2>Jede Sorge bekommt eine Garantie</h2>
        <ol className="ep-gnav">
          {GUARANTEES.map((item, i) => (
            <li key={item.title}>
              <button type="button" className={i === index ? 'on' : ''} onClick={() => go(i)}>
                <span className="n">{i + 1}</span>
                <span>
                  <b>{item.title}</b>
                  <small>Gegen: {item.against}</small>
                </span>
                {i === index && !paused && <span className="timer" key={index} style={{ '--ep-delay': `${AUTOPLAY_MS}ms` }} />}
              </button>
            </li>
          ))}
        </ol>
        {onStart && (
          <div className="ep-gcta">
            <button type="button" className="ep-btn primary big" onClick={onStart}>
              Adresse prüfen <span aria-hidden="true">→</span>
            </button>
            {pledgedTotal ? (
              <button type="button" className="ep-gproof" onClick={onNeighbourhood}>
                <b>{pledgedTotal.toLocaleString('de-DE')}</b> Haushalte sind schon dabei ↓
              </button>
            ) : null}
          </div>
        )}
      </div>

      <div className="ep-gslide" key={index}>
        <div className="ep-gslide-top">
          <span className="big-n">{index + 1}</span>
          <span className="icon" aria-hidden="true">{g.icon}</span>
        </div>
        <h3>{g.title}</h3>
        <p className="claim">{g.text}</p>
        <p className="detail">{g.detail}</p>
        <div className="ep-gslide-foot">
          <span className="against">Gegen: {g.against}</span>
          <span className="arrows">
            <button type="button" aria-label="Vorherige Garantie" onClick={() => go(index - 1)}>
              ←
            </button>
            <button type="button" aria-label="Nächste Garantie" onClick={() => go(index + 1)}>
              →
            </button>
          </span>
        </div>
      </div>

      <p className="ep-gnote">Garantien sind ein Vorschlag des Teams, noch nicht mit Geothermie Unterhaching abgestimmt.</p>
    </section>
  );
}
