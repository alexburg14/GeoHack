import React, { useEffect, useRef, useState } from 'react';
import CostChart from './CostChart';
import { START_YEAR, YEARS, LIFETIMES, REPLACEMENT_EUR } from '../data/costModel';

// "Zoom out" story: while the user scrolls, the chart stays pinned and its time axis grows from
// 20 to 40 years, so the second half of a heating system's life comes into view (new heat pump,
// new boiler). The scroll position drives everything; there is no slider.
const LONG = 40;
const SCROLL_SCREENS = 2.6; // scroll distance of the story, in heights of the scroll area

const eur = (n) => `${Math.round(n).toLocaleString('de-DE')} €`;
const ease = (t) => (t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2);
const valueAt = (data, f) => {
  const i = Math.min(Math.floor(f), data.length - 1);
  const j = Math.min(i + 1, data.length - 1);
  return data[i] + (data[j] - data[i]) * (f - i);
};

export default function LongRunStory({ scrollRoot, result, keys, meta, label, heatingAge }) {
  const outer = useRef(null);
  const [rootH, setRootH] = useState(600);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const root = scrollRoot.current;
    if (!root) return undefined;
    const update = () => {
      setRootH(root.clientHeight);
      const box = outer.current.getBoundingClientRect();
      const top = root.getBoundingClientRect().top;
      const travel = box.height - root.clientHeight;
      setProgress(travel > 0 ? Math.max(0, Math.min(1, (top - box.top) / travel)) : 0);
    };
    update();
    root.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    return () => {
      root.removeEventListener('scroll', update);
      window.removeEventListener('resize', update);
    };
  }, [scrollRoot]);

  // Hold at 20 years, zoom out, hold at 40 years.
  const zoom = ease(Math.max(0, Math.min(1, (progress - 0.12) / 0.7)));
  const horizon = YEARS + (LONG - YEARS) * zoom;
  const last = horizon - 1;
  const year = Math.round(START_YEAR + last);

  const o = result.optionen;
  // Same years as in costModel.js: the heat pump is replaced every `lebensdauer` years, the boiler
  // whenever it reaches its lifetime, the transfer station once after the connection.
  const firstBoiler = Math.max(0, LIFETIMES.bestand - heatingAge);
  const pumpSwaps = Array.from({ length: Math.floor((LONG - 1) / LIFETIMES.waermepumpe) }, (_, n) => (n + 1) * LIFETIMES.waermepumpe);
  // The first boiler replacement in the part of the chart that zooms into view (year 20 onwards).
  const boilerSwap = firstBoiler + Math.ceil(Math.max(0, YEARS - firstBoiler) / LIFETIMES.bestand) * LIFETIMES.bestand;
  const markers = [
    ...pumpSwaps.map((index, n) => ({ index, label: pumpSwaps.length > 1 ? `${n + 2}. Wärmepumpe` : 'Neue Wärmepumpe', color: meta.waermepumpe.color })),
    { index: boilerSwap, label: 'Neuer Kessel', color: meta.bestand.color, row: 1 },
    { index: o.fernwaerme.jahre_bis_anschluss + LIFETIMES.station, label: 'Station erneuert', color: meta.fernwaerme.color, row: 2 },
  ].filter((m) => m.index < LONG);

  const totals = keys.map((k) => ({ k, value: valueAt(o[k].kumuliert_eur, last) }));
  const fw = totals.find((t) => t.k === 'fernwaerme').value;
  const final = keys.map((k) => ({ k, value: o[k].gesamt_eur })).sort((x, y) => x.value - y.value);
  const winner = final[0];
  const fwFinal = o.fernwaerme.gesamt_eur;
  const at20 = keys.map((k) => ({ k, value: o[k].kumuliert_eur[YEARS - 1] })).sort((x, y) => x.value - y.value);
  const fw20 = o.fernwaerme.kumuliert_eur[YEARS - 1];
  const named = (k) => (k === 'bestand' ? `„${label(k)}“` : `die ${label(k)}`);
  const devices = (n) => (n === 1 ? 'ein neues Gerät' : `${n} neue Geräte`);

  // From which year on district heating also costs less per year than the heat pump (years with a
  // replacement left out). Only told if that happens in the second half of the chart.
  const swapYears = new Set(markers.map((m) => m.index));
  const yearCost = (k, i) => o[k].kumuliert_eur[i] - o[k].kumuliert_eur[i - 1];
  let cheaperFrom = null;
  for (let i = LONG - 1; i > 0 && (swapYears.has(i) || yearCost('fernwaerme', i) < yearCost('waermepumpe', i)); i -= 1) {
    if (!swapYears.has(i)) cheaperFrom = i;
  }

  // The caption follows the zoom; every number in it is computed, whichever option wins.
  let caption;
  if (horizon < YEARS + 1) {
    caption = {
      h: `Fast jeder Vergleich hört nach ${YEARS} Jahren auf.`,
      p:
        at20[0].k === 'fernwaerme'
          ? `Bis ${START_YEAR + YEARS - 1} gerechnet ist die Fernwärme ${eur(at20[1].value - fw20)} günstiger als ${named(at20[1].k)}. Scrollen Sie weiter: Ihre Heizung läuft länger.`
          : `Bis ${START_YEAR + YEARS - 1} gerechnet ist ${named(at20[0].k)} ${eur(fw20 - at20[0].value)} günstiger als die Fernwärme. Scrollen Sie weiter: Ihre Heizung läuft länger.`,
    };
  } else if (horizon < 31) {
    caption = {
      h: `Eine Wärmepumpe hält rund ${LIFETIMES.waermepumpe} Jahre.`,
      p: `Bis ${START_YEAR + LONG - 1} brauchen Sie ${devices(pumpSwaps.length)} für ${pumpSwaps.length > 1 ? 'je ' : ''}${eur(REPLACEMENT_EUR.waermepumpe)}, ohne Förderung gerechnet. Die Übergabestation der Fernwärme hält rund ${LIFETIMES.station} Jahre, ihre Erneuerung kostet ${eur(REPLACEMENT_EUR.station)}.`,
    };
  } else if (horizon < LONG - 0.5) {
    caption = {
      h: 'Und die Energiepreise laufen weiter.',
      p:
        cheaperFrom > YEARS
          ? `In dieser Rechnung wird Strom schneller teurer als Geothermie-Wärme: Ab ${START_YEAR + cheaperFrom} kostet die Fernwärme auch im laufenden Jahr weniger als die Wärmepumpe.`
          : 'Jeder Cent pro Kilowattstunde zählt jetzt doppelt so lange wie im 20-Jahres-Vergleich.',
    };
  } else if (winner.k === 'fernwaerme' && at20[0].k !== 'fernwaerme') {
    caption = {
      h: `Über ${LONG} Jahre dreht sich das Bild.`,
      p: `Die Geothermie ist jetzt am günstigsten: ${eur(final[1].value - fwFinal)} weniger als ${named(final[1].k)}. Nach ${YEARS} Jahren lag ${named(at20[0].k)} noch ${eur(fw20 - at20[0].value)} vorn. Mit den Annahmen oben.`,
    };
  } else if (winner.k === 'fernwaerme') {
    caption = {
      h: `Über ${LONG} Jahre ist die Geothermie am günstigsten.`,
      p: `${eur(final[1].value - fwFinal)} weniger als ${named(final[1].k)}, mit den Annahmen oben.`,
    };
  } else {
    caption = {
      h: `Über ${LONG} Jahre: ${label(winner.k)} ${eur(fwFinal - winner.value)} günstiger als Fernwärme.`,
      p: 'Mit diesen Annahmen. Verschieben Sie oben die Energiepreise: Die Fernwärme bewegt sich kaum, die anderen Linien schon.',
    };
  }

  return (
    <div ref={outer} className="ep-story" style={{ height: rootH * SCROLL_SCREENS }}>
      <div className="ep-story-pin" style={{ height: rootH - 56 }}>
        <div className="ep-card ep-story-card">
          <div className="ep-story-head">
            <div>
              <p className="eyebrow">20 oder 40 Jahre?</p>
              <h2 key={caption.h} className="ep-story-caption">
                {caption.h}
              </h2>
              <p className="muted">{caption.p}</p>
            </div>
            <div className="ep-story-year" aria-live="polite">
              <small>Zeitraum bis</small>
              <b>{year}</b>
            </div>
          </div>
          <div className="ep-story-body">
            <CostChart
              years={result.jahre}
              horizon={horizon}
              markers={markers}
              height={260}
              series={keys.map((k) => ({ ...meta[k], label: label(k), data: o[k].kumuliert_eur }))}
            />
            <ul className="ep-story-totals">
              {totals.map((t) => (
                <li key={t.k}>
                  <span className="dot" style={{ background: meta[t.k].color }} />
                  <span className="name">{label(t.k)}</span>
                  <b>{eur(t.value)}</b>
                  {t.k !== 'fernwaerme' && (
                    <small className={t.value > fw ? 'up' : 'down'}>
                      {t.value > fw ? '+' : '−'}
                      {eur(Math.abs(t.value - fw))} ggü. Fernwärme
                    </small>
                  )}
                </li>
              ))}
            </ul>
          </div>
          <div className="ep-story-progress">
            <span style={{ width: `${zoom * 100}%` }} />
          </div>
        </div>
      </div>
    </div>
  );
}
