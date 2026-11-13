import React, { useState } from 'react';
import { STAKE } from '../data/unterhaching';

// Genossenschaft pitch + calculator, modelled on the Bürgerbeteiligung page of the Wärme-Pakt app.
// Conditions come from config/assumptions.json ("beteiligung"); all values are demo placeholders.
const SHARE_EUR = STAKE.mindestbetrag_eur.wert; // one cooperative share = minimum stake
const MAX_EUR = STAKE.hoechstbetrag_eur.wert;
const ZINS = STAKE.zins.wert;
const YEARS = STAKE.laufzeit_jahre.wert;
const BONUS_CT = STAKE.waermepreis_rabatt_ct.wert;
const BONUS_FROM = STAKE.rabatt_ab_eur.wert;
const NETWORK_EUR = STAKE.netz_investition_eur.wert;

// Demo figures for the pitch (placeholders, not real membership data)
const DEMO_MEMBERS = 1284;
const DEMO_RAISED = 7.9e6;

const eur = (n) => `${Math.round(n).toLocaleString('de-DE')} €`;
const stopKeys = (e) => e.stopPropagation();

export default function GenossenschaftPage({ demandKwh }) {
  const [amount, setAmount] = useState(2000);
  const [stage, setStage] = useState('info'); // 'info' | 'confirm' | 'done'

  const shares = Math.round(amount / SHARE_EUR);
  const interest = amount * ZINS;
  const bonus = amount >= BONUS_FROM && demandKwh ? (demandKwh * BONUS_CT) / 100 : null;
  const setClamped = (v) => setAmount(Math.min(MAX_EUR, Math.max(SHARE_EUR, Math.round(Number(v) / SHARE_EUR) * SHARE_EUR || SHARE_EUR)));

  return (
    <div className="ep-page" style={{ maxWidth: 1040 }}>
      <div className="ep-coop-hero">
        <div>
          <p className="eyebrow">Wärme-Genossenschaft Unterhaching</p>
          <h1>Das Netz gehört denen, die es nutzen</h1>
          <p>
            Als Mitglied der Genossenschaft finanzieren Sie das Geothermie-Netz vor Ihrer Haustür mit, bestimmen mit und
            bekommen feste Zinsen und günstigere Wärme. Ihr Geld bleibt im Ort.
          </p>
        </div>
        <div className="ep-coop-progress">
          <small>Schon gezeichnet (Demo)</small>
          <b>{(DEMO_RAISED / 1e6).toLocaleString('de-DE', { maximumFractionDigits: 1 })} Mio. €</b>
          <div className="ep-progress dark">
            <span style={{ width: `${(DEMO_RAISED / NETWORK_EUR) * 100}%` }} />
          </div>
          <small>
            von {(NETWORK_EUR / 1e6).toLocaleString('de-DE')} Mio. € Netzausbau · {DEMO_MEMBERS.toLocaleString('de-DE')} Mitglieder
          </small>
        </div>
      </div>

      <div className="ep-grid3">
        {[
          ['🗳️', 'Ein Mitglied, eine Stimme', 'Egal wie viele Anteile: Jedes Mitglied entscheidet in der Generalversammlung mit, auch über die Wärmepreise.'],
          ['📈', `${(ZINS * 100).toLocaleString('de-DE')} % feste Verzinsung`, `Über ${YEARS} Jahre Laufzeit, planbar und unabhängig vom Börsenkurs.`],
          ['🔥', `${BONUS_CT.toLocaleString('de-DE')} ct/kWh günstigere Wärme`, `Für alle Mitglieder ab ${eur(BONUS_FROM)} Einlage, jedes Jahr auf die Heizrechnung.`],
        ].map(([emoji, title, text]) => (
          <div key={title} className="ep-card ep-info">
            <span className="emoji">{emoji}</span>
            <div>
              <h3>{title}</h3>
              <p>{text}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="ep-grid2" style={{ gap: 16, alignItems: 'start' }}>
        <div className="ep-card">
          <h2>Ihr Beitrag</h2>
          <label className="field" htmlFor="coop-amount">
            Einlage ({shares} {shares === 1 ? 'Anteil' : 'Anteile'} à {eur(SHARE_EUR)})
          </label>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 8 }}>
            <input
              type="range"
              min={SHARE_EUR}
              max={MAX_EUR}
              step={SHARE_EUR}
              value={amount}
              onChange={(e) => setClamped(e.target.value)}
              onKeyDown={stopKeys}
              style={{ flex: 1, accentColor: 'var(--accent)' }}
              aria-label="Einlage wählen"
            />
            <input
              id="coop-amount"
              className="text"
              type="number"
              min={SHARE_EUR}
              max={MAX_EUR}
              step={SHARE_EUR}
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value))}
              onBlur={(e) => setClamped(e.target.value)}
              onKeyDown={stopKeys}
              style={{ width: 110, marginTop: 0 }}
            />
            <span>€</span>
          </div>

          <div className="ep-kpis two" style={{ margin: '18px 0' }}>
            <div className="ep-kpi">
              <small>Zinsen pro Jahr</small>
              <b>{eur(interest)}</b>
            </div>
            <div className="ep-kpi">
              <small>Zinsen in {YEARS} Jahren</small>
              <b>{eur(interest * YEARS)}</b>
            </div>
            <div className="ep-kpi">
              <small>Wärmepreis-Bonus pro Jahr</small>
              <b>{amount < BONUS_FROM ? `ab ${eur(BONUS_FROM)}` : bonus === null ? 'nach Schritt 2' : eur(bonus)}</b>
            </div>
            <div className="ep-kpi">
              <small>Ihr Anteil am Netz</small>
              <b>{((amount / NETWORK_EUR) * 100).toLocaleString('de-DE', { maximumFractionDigits: 4 })} %</b>
            </div>
          </div>

          {stage === 'info' && (
            <button type="button" className="ep-btn primary" style={{ width: '100%' }} onClick={() => setStage('confirm')}>
              Mitglied werden
            </button>
          )}
          {stage === 'confirm' && (
            <div className="ep-confirm">
              <p>
                <strong>{eur(amount)}</strong> Einlage ({shares} Anteile) in der Wärme-Genossenschaft Unterhaching
              </p>
              <p className="muted" style={{ fontSize: 12.5, margin: '4px 0 12px' }}>
                Demo: Hier würden Beitrittserklärung und SEPA-Lastschrift folgen. Es wird nichts abgebucht.
              </p>
              <div style={{ display: 'flex', gap: 10 }}>
                <button type="button" className="ep-btn primary" onClick={() => setStage('done')}>
                  Beitritt bestätigen (Demo)
                </button>
                <button type="button" className="ep-btn ghost" onClick={() => setStage('info')}>
                  Abbrechen
                </button>
              </div>
            </div>
          )}
          {stage === 'done' && (
            <div className="ep-confirm ok">
              <strong>Willkommen in der Genossenschaft!</strong>
              <p className="muted" style={{ fontSize: 13, marginTop: 4 }}>
                Mitglied Nr. {(DEMO_MEMBERS + 1).toLocaleString('de-DE')} · {eur(amount)} Einlage (Demo)
              </p>
            </div>
          )}
        </div>

        <div className="ep-card">
          <h2>So funktioniert es</h2>
          <ol className="ep-steps-list">
            <li>
              <span className="n">1</span>
              <div>
                <strong>Anteile zeichnen</strong>
                <p>Ab {eur(SHARE_EUR)} pro Anteil, bis {eur(MAX_EUR)} pro Haushalt.</p>
              </div>
            </li>
            <li>
              <span className="n">2</span>
              <div>
                <strong>Das Netz wird gebaut</strong>
                <p>Ihr Geld fließt in den Ausbau der Straßen in Unterhaching, Straße für Straße.</p>
              </div>
            </li>
            <li>
              <span className="n">3</span>
              <div>
                <strong>Zinsen und günstigere Wärme</strong>
                <p>
                  {(ZINS * 100).toLocaleString('de-DE')} % pro Jahr auf Ihre Einlage, dazu der Wärmepreis-Bonus auf Ihre Rechnung.
                </p>
              </div>
            </li>
            <li>
              <span className="n">4</span>
              <div>
                <strong>Mitbestimmen</strong>
                <p>Eine Stimme in der Generalversammlung, Einblick in Preise und Ausbauplan.</p>
              </div>
            </li>
          </ol>
          <p className="muted" style={{ fontSize: 12, marginTop: 14 }}>
            Demo: Konditionen und Mitgliederzahlen sind Platzhalter, es findet keine echte Zahlung statt.
          </p>
        </div>
      </div>
    </div>
  );
}
