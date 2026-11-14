import React, { useEffect, useState } from 'react';

// The five arguments for geothermal district heating, as an auto-playing slideshow on the home page.
// CO₂ figures match the cost comparison (example house, 20 years): geothermal 26 t, heat pump 41 t, gas 100 t.
const GUARANTEES = [
  {
    title: 'Stimmt so.',
    text: 'Bis zu 70 % Förderung nach KfW auf die Anschlusskosten.',
    icon: '💶',
    detail: 'Die Bundesförderung für effiziente Gebäude bezuschusst den Anschluss ans Wärmenetz: 30 % Grundförderung, mit Boni bis zu 70 %. Wie viel es bei Ihnen ist, prüfen wir gemeinsam.',
  },
  {
    title: 'Unabhängig',
    text: 'Die lokale Wärme, die auch Ihnen zusteht, ist die unabhängigste vom Weltgeschehen.',
    icon: '📍',
    detail: 'Die Wärme kommt aus über 3.000 m Tiefe unter Starnberg, nicht aus Importgas. Lieferstopps und Börsenpreise ändern daran nichts.',
  },
  {
    title: 'Grüner wird’s nicht.',
    text: 'Wärme aus der Erde: kein Verbrennen, kein Schornstein, kein Außengerät.',
    icon: '🌱',
    detail: 'Im Haus steht nur eine kleine Übergabestation. Die Wärme liefert das Thermalwasser, um die Wartung kümmert sich der Betreiber.',
  },
  {
    title: '75 % weniger CO₂',
    text: 'Als mit der Gasheizung. Und rund ein Drittel weniger als mit einer Wärmepumpe.',
    icon: '📉',
    detail: 'Über 20 Jahre rund 26 t statt 100 t CO₂ für ein typisches Einfamilienhaus (Wärmepumpe: rund 41 t).',
  },
  {
    title: 'Warm bis zum Anschluss',
    text: 'Geht Ihre alte Heizung vorher kaputt, helfen wir sofort.',
    icon: '🛠️',
    detail: 'Mit unserer Wartegarantie bekommen Sie eine Übergangsheizung (mobile Heizzentrale oder Mietkessel) ohne Investition, bis Ihr Haus am Netz ist. Sie zahlen nur die Wärme, die Sie verbrauchen. Einen neuen Gaskessel brauchen Sie nicht.',
  },
];

const AUTOPLAY_MS = 5000;

export default function GuaranteeSlides({ onStart, onJoin, onNeighbourhood, pledgedTotal }) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused) return undefined;
    const t = setTimeout(() => setIndex((i) => (i + 1) % GUARANTEES.length), AUTOPLAY_MS);
    return () => clearTimeout(t);
  }, [index, paused]);

  const go = (i) => setIndex((i + GUARANTEES.length) % GUARANTEES.length);
  const g = GUARANTEES[index];

  // Pause only for a real mouse: on phones a tap fires "enter" without a matching "leave"
  return (
    <section
      className="ep-guarantees hero"
      onPointerEnter={(e) => e.pointerType === 'mouse' && setPaused(true)}
      onPointerLeave={(e) => e.pointerType === 'mouse' && setPaused(false)}
    >
      <div className="ep-guarantees-intro">
        <p className="eyebrow">Geothermie-Fernwärme für Starnberg</p>
        <h2>Fünf gute Gründe für Geothermie</h2>
        <ol className="ep-gnav">
          {GUARANTEES.map((item, i) => (
            <li key={item.title}>
              <button type="button" className={i === index ? 'on' : ''} onClick={() => go(i)}>
                <span className="n">{i + 1}</span>
                <span>
                  <b>{item.title}</b>
                </span>
                {i === index && !paused && <span className="timer" key={index} style={{ '--ep-delay': `${AUTOPLAY_MS}ms` }} />}
              </button>
            </li>
          ))}
        </ol>
        {onStart && (
          <div className="ep-gcta">
            {onJoin && (
              <button type="button" className="ep-btn primary big" onClick={onJoin}>
                Jetzt Genosse werden <span aria-hidden="true">→</span>
              </button>
            )}
            <button type="button" className={`ep-btn ${onJoin ? 'ghost' : 'primary'} big`} onClick={onStart}>
              Adresse prüfen
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
          <span className="ep-gdots" aria-hidden="true">
            {GUARANTEES.map((item, i) => <i key={item.title} className={i === index ? 'on' : ''} />)}
          </span>
          <span className="arrows">
            <button type="button" aria-label="Vorheriges Argument" onClick={() => go(index - 1)}>
              ←
            </button>
            <button type="button" aria-label="Nächstes Argument" onClick={() => go(index + 1)}>
              →
            </button>
          </span>
        </div>
      </div>

      <p className="ep-gnote">Förderquote je nach Fall. CO₂-Werte aus unserem Kostenvergleich, alle Annahmen offen einsehbar.</p>
    </section>
  );
}
