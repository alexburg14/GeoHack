import React, { useEffect, useRef, useState } from 'react';

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

const reducedMotion = () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// Carousel in the style of apple.com: the slides sit in a horizontally scrolling track with scroll snap,
// so they can be swiped natively on phones (and with the trackpad). Autoplay moves the track; a swipe
// moves the index. Play/pause button and progress dots below; on desktop the list on the left as well.
export default function GuaranteeSlides({ onStart, onJoin, onNeighbourhood, pledgedTotal }) {
  const [index, setIndex] = useState(0);
  const [userPaused, setUserPaused] = useState(reducedMotion); // no autoplay for people who asked for less motion
  const [hovered, setHovered] = useState(false); // mouse over the section (desktop)
  const [touching, setTouching] = useState(false); // finger on the track (phone)
  const trackRef = useRef(null);
  const settleTimer = useRef(null);
  const running = !userPaused && !hovered && !touching;

  // Autoplay: next slide after AUTOPLAY_MS, starting over whenever the slide changes
  useEffect(() => {
    if (!running) return undefined;
    const t = setTimeout(() => setIndex((i) => (i + 1) % GUARANTEES.length), AUTOPLAY_MS);
    return () => clearTimeout(t);
  }, [index, running]);

  // Distance between two slides in the track (slide width + gap)
  const step = () => {
    const t = trackRef.current;
    return t && t.children.length > 1 ? t.children[1].offsetLeft - t.children[0].offsetLeft : t?.clientWidth || 1;
  };

  // Index changed by autoplay, arrows, dots or the list: scroll the track there
  useEffect(() => {
    const t = trackRef.current;
    if (!t) return;
    const target = index * step();
    if (Math.abs(t.scrollLeft - target) > 2) t.scrollTo({ left: target, behavior: reducedMotion() ? 'auto' : 'smooth' });
  }, [index]);

  // Track scrolled by a swipe: once it comes to rest, take over the slide it snapped to
  const onScroll = () => {
    clearTimeout(settleTimer.current);
    settleTimer.current = setTimeout(() => {
      const t = trackRef.current;
      if (!t) return;
      const i = Math.max(0, Math.min(GUARANTEES.length - 1, Math.round(t.scrollLeft / step())));
      setIndex(i);
    }, 120);
  };
  useEffect(() => () => clearTimeout(settleTimer.current), []);

  const go = (i) => setIndex((i + GUARANTEES.length) % GUARANTEES.length);

  // Hover pause only for a real mouse: on phones a tap fires "enter" without a matching "leave"
  return (
    <section
      className="ep-guarantees hero"
      onPointerEnter={(e) => e.pointerType === 'mouse' && setHovered(true)}
      onPointerLeave={(e) => e.pointerType === 'mouse' && setHovered(false)}
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
                {i === index && running && <span className="timer" key={index} style={{ '--ep-delay': `${AUTOPLAY_MS}ms` }} />}
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

      <div className="ep-gcarousel" role="region" aria-roledescription="Karussell" aria-label="Fünf gute Gründe für Geothermie">
        <div
          className="ep-gtrack"
          ref={trackRef}
          onScroll={onScroll}
          onTouchStart={() => setTouching(true)}
          onTouchEnd={() => setTouching(false)}
          onTouchCancel={() => setTouching(false)}
        >
          {GUARANTEES.map((g, i) => (
            <article
              key={g.title}
              className={`ep-gslide ${i === index ? 'on' : ''}`}
              role="group"
              aria-roledescription="Folie"
              aria-label={`${i + 1} von ${GUARANTEES.length}: ${g.title}`}
              aria-hidden={i !== index}
            >
              <div className="ep-gslide-top">
                <span className="big-n">{i + 1}</span>
                <span className="icon" aria-hidden="true">{g.icon}</span>
              </div>
              <h3>{g.title}</h3>
              <p className="claim">{g.text}</p>
              <p className="detail">{g.detail}</p>
            </article>
          ))}
        </div>

        <div className="ep-gcontrols">
          <div className="ep-gdots">
            {GUARANTEES.map((item, i) => (
              <button
                key={item.title}
                type="button"
                className={i === index ? 'on' : ''}
                aria-label={`Grund ${i + 1}: ${item.title}`}
                aria-current={i === index}
                onClick={() => go(i)}
              >
                {i === index && (
                  <span key={`${index}-${running}`} className={running ? 'run' : ''} style={{ '--ep-delay': `${AUTOPLAY_MS}ms` }} />
                )}
              </button>
            ))}
          </div>
          <button
            type="button"
            className="ep-gplay"
            aria-label={userPaused ? 'Slideshow abspielen' : 'Slideshow pausieren'}
            aria-pressed={userPaused}
            onClick={() => setUserPaused((p) => !p)}
          >
            {userPaused ? (
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5.5v13l10.5-6.5z" fill="currentColor" /></svg>
            ) : (
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 5h3.5v14H7zM13.5 5H17v14h-3.5z" fill="currentColor" /></svg>
            )}
          </button>
          <span className="arrows">
            <button type="button" aria-label="Vorheriges Argument" onClick={() => go(index - 1)}>←</button>
            <button type="button" aria-label="Nächstes Argument" onClick={() => go(index + 1)}>→</button>
          </span>
        </div>
      </div>

      <p className="ep-gnote">Förderquote je nach Fall. CO₂-Werte aus unserem Kostenvergleich, alle Annahmen offen einsehbar.</p>
    </section>
  );
}
