import React, { useState } from 'react';
import { STAKE } from '../data/town';
import {
  HEAT_PRICE_CT,
  DISCOUNT_YEARS,
  DISCOUNT_PCT_PER_SHARE,
  DISCOUNT_PCT_MAX,
  EXAMPLE_DEMAND_KWH,
  DEMO_MEMBERS,
  DEMO_RAISED,
  memberDiscount,
} from '../data/genossenschaft';
import './genossenschaft.css';

// Genossenschaft pitch + calculator, modelled on the Bürgerbeteiligung page of the Wärme-Pakt app.
// Members are co-owners: they pay in shares and get a discount on their heat price for a fixed period.
// Share size and limits come from config/assumptions.json ("beteiligung"), the discount rule from
// data/genossenschaft.js. Everything is a proposal of the team, not agreed with the operator yet.
const SHARE_EUR = STAKE.mindestbetrag_eur.wert; // one cooperative share = minimum stake
const MAX_EUR = STAKE.hoechstbetrag_eur.wert;
const NETWORK_EUR = STAKE.netz_investition_eur.wert;
const CAP_EUR = (DISCOUNT_PCT_MAX / DISCOUNT_PCT_PER_SHARE) * SHARE_EUR; // stake that reaches the highest discount

const eur = (n) => `${Math.round(n).toLocaleString('de-DE')} €`;
const num = (n, digits = 0) => n.toLocaleString('de-DE', { minimumFractionDigits: digits, maximumFractionDigits: digits });
const pctText = (n) => `${n.toLocaleString('de-DE')} %`;
const stopKeys = (e) => e.stopPropagation();

export default function GenossenschaftPage({ demandKwh, onOpenPortal }) {
  const [amount, setAmount] = useState(2000);
  const [stage, setStage] = useState('info'); // 'info' | 'confirm' | 'done'

  const shares = Math.round(amount / SHARE_EUR);
  const sharesText = `${shares} ${shares === 1 ? 'Anteil' : 'Anteile'}`;
  const ownDemand = Boolean(demandKwh);
  const discount = memberDiscount(shares, ownDemand ? demandKwh : EXAMPLE_DEMAND_KWH);
  const setClamped = (v) => setAmount(Math.min(MAX_EUR, Math.max(SHARE_EUR, Math.round(Number(v) / SHARE_EUR) * SHARE_EUR || SHARE_EUR)));

  return (
    <div className="ep-page" style={{ maxWidth: 1040 }}>
      <div className="ep-coop-hero">
        <div>
          <p className="eyebrow">Wärme-Genossenschaft Starnberg</p>
          <h1>Das Netz gehört denen, die es nutzen</h1>
          <p>
            Als Mitglied gehört Ihnen ein Stück des Geothermie-Netzes vor Ihrer Haustür. Sie bestimmen mit und zahlen{' '}
            {DISCOUNT_YEARS} Jahre lang weniger für Ihre Wärme. Ihr Geld bleibt im Ort.
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
          [
            '🔥',
            `${pctText(DISCOUNT_PCT_PER_SHARE)} Rabatt pro Anteil`,
            `Auf Ihren Wärmepreis, bis höchstens ${pctText(DISCOUNT_PCT_MAX)}. ${DISCOUNT_YEARS} Jahre lang, direkt auf der Wärmerechnung.`,
          ],
          ['🏠', 'Ihre Einlage bleibt Ihr Eigentum', 'Sie kaufen Anteile am Netz, kein Finanzprodukt. Beim Austritt erhalten Sie Ihre Einlage zurück.'],
          ['🗳️', 'Ein Mitglied, eine Stimme', 'Egal wie viele Anteile: Jedes Mitglied entscheidet in der Generalversammlung mit, auch über die Wärmepreise.'],
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
            Einlage ({sharesText} à {eur(SHARE_EUR)})
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

          <div className="ep-coop-benefit">
            <h3>Ihr Vorteil als Mitglied</h3>
            <span className="ep-coop-tag">Vorschlag</span>
          </div>
          <div className="ep-kpis two">
            <div className="ep-kpi">
              <small>Rabatt auf Ihren Wärmepreis</small>
              <b>{pctText(discount.pct)}</b>
              <small className="sub">{discount.capped ? 'Höchstrabatt erreicht' : `${DISCOUNT_YEARS} Jahre lang`}</small>
            </div>
            <div className="ep-kpi">
              <small>Ihr Wärmepreis</small>
              <b>{num(discount.priceCt, 2)} ct</b>
              <small className="sub">pro kWh statt {num(HEAT_PRICE_CT, 2)} ct</small>
            </div>
            <div className="ep-kpi save">
              <small>Ersparnis pro Jahr</small>
              <b>{eur(discount.perYear)}</b>
            </div>
            <div className="ep-kpi save">
              <small>Ersparnis über {DISCOUNT_YEARS} Jahre</small>
              <b>{eur(discount.total)}</b>
            </div>
          </div>
          <p className="ep-coop-basis">
            {ownDemand
              ? `Berechnet mit Ihrem Wärmebedarf von ${num(demandKwh)} kWh pro Jahr und dem heutigen Wärmepreis.`
              : `Beispiel für ein Haus mit ${num(EXAMPLE_DEMAND_KWH)} kWh Wärmebedarf pro Jahr. Ihre eigenen Zahlen sehen Sie hier, sobald Sie unter „Rechnen“ Ihr Haus berechnet haben.`}
            {amount > CAP_EUR &&
              ` Ab ${eur(CAP_EUR)} Einlage steigt der Rabatt nicht weiter, Ihr Anteil am Netz schon.`}
          </p>

          {stage === 'info' && (
            <button type="button" className="ep-btn primary" style={{ width: '100%' }} onClick={() => setStage('confirm')}>
              Jetzt Genosse werden
            </button>
          )}
          {stage === 'confirm' && (
            <div className="ep-confirm">
              <p>
                <strong>{eur(amount)}</strong> Einlage ({sharesText}) in der Wärme-Genossenschaft Starnberg
              </p>
              <p style={{ marginTop: 2 }}>
                Dafür: {pctText(discount.pct)} Rabatt auf Ihren Wärmepreis, {DISCOUNT_YEARS} Jahre lang.
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
                Mitglied Nr. {(DEMO_MEMBERS + 1).toLocaleString('de-DE')} · {eur(amount)} Einlage · {pctText(discount.pct)} Wärmerabatt für{' '}
                {DISCOUNT_YEARS} Jahre (Demo)
              </p>
              {onOpenPortal && (
                <button type="button" className="ep-btn primary" style={{ marginTop: 10 }} onClick={onOpenPortal}>
                  Zum Mitgliederportal →
                </button>
              )}
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
                <p>Ab {eur(SHARE_EUR)} pro Anteil, bis {eur(MAX_EUR)} pro Haushalt. Damit sind Sie Miteigentümer.</p>
              </div>
            </li>
            <li>
              <span className="n">2</span>
              <div>
                <strong>Das Netz wird gebaut</strong>
                <p>Ihr Geld fließt in den Ausbau der Straßen in Starnberg, Straße für Straße.</p>
              </div>
            </li>
            <li>
              <span className="n">3</span>
              <div>
                <strong>{DISCOUNT_YEARS} Jahre günstigere Wärme</strong>
                <p>
                  {pctText(DISCOUNT_PCT_PER_SHARE)} Rabatt pro Anteil auf Ihren Wärmepreis, höchstens {pctText(DISCOUNT_PCT_MAX)} (ab{' '}
                  {eur(CAP_EUR)} Einlage). Der Rabatt gilt ab Ihrem Anschluss.
                </p>
              </div>
            </li>
            <li>
              <span className="n">4</span>
              <div>
                <strong>Mitbestimmen und Miteigentümer bleiben</strong>
                <p>Eine Stimme in der Generalversammlung, Einblick in Preise und Ausbauplan, auch nach den {DISCOUNT_YEARS} Jahren.</p>
              </div>
            </li>
          </ol>
          <div className="ep-coop-own">
            <span className="emoji">🏠</span>
            <p>
              <strong>Und Ihre Einlage?</strong> Sie bleibt Ihr Anteil am Netz. Treten Sie aus der Genossenschaft aus, wird sie
              zurückgezahlt. Sie ist Eigenkapital der Genossenschaft, keine Spareinlage.
            </p>
          </div>
          <p className="muted" style={{ fontSize: 12, marginTop: 14 }}>
            Vorschlag des Teams, noch nicht mit dem Betreiber abgestimmt: Rabatt, Laufzeit und Rückzahlung der Einlage sind
            Platzhalter. Demo: Mitgliederzahlen sind erfunden, es findet keine echte Zahlung statt.
          </p>
        </div>
      </div>
    </div>
  );
}
