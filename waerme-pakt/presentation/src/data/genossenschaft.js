// Member benefit of the Wärme-Genossenschaft: no interest, but a discount on the heat price
// for a fixed period. All values are a proposal of the team ("Vorschlag des Teams, noch nicht
// mit dem Betreiber abgestimmt"), not agreed conditions. The heat price is read from
// config/assumptions.json and never changed here.
import assumptions from '../../../config/assumptions.json';
import demo from '../../../data/genossenschaft.json';

export const HEAT_PRICE_CT = assumptions.fernwaerme.mischpreis_ct.wert; // ct/kWh, incl. base price

// Discount rule, shared with the member portal (server.py) via config/assumptions.json
const RULE = assumptions.genossenschaft;
export const DISCOUNT_YEARS = RULE.rabatt_jahre.wert; // how long members get the discount (team range: 5–10 years)
export const DISCOUNT_PCT_PER_SHARE = RULE.rabatt_prozent_pro_anteil.wert; // percent off the heat price per share
export const DISCOUNT_PCT_MAX = RULE.rabatt_prozent_max.wert; // cap: more shares mean more ownership, not more discount
export const INSTALLMENTS_MAX = RULE.raten_max.wert; // a stake can be paid in up to this many quarterly debits

// The demo member shown in the member portal (Familie Huber)
export const DEMO_MEMBER = demo.demo_mitglied;

// Demo membership figures (placeholders, not real members), shared with the member portal
export const DEMO_MEMBERS = demo.mitglieder_gesamt;
export const DEMO_RAISED = demo.kapital_eur;
export const EXAMPLE_DEMAND_KWH = 20000; // example house, used until the visitor has calculated their own

// Discount for a number of shares and a yearly heat demand, at today's heat price (no price increase assumed).
// The 10-year total is built from the rounded yearly figure so the two numbers on the page add up.
export function memberDiscount(shares, demandKwh) {
  const pct = Math.min(DISCOUNT_PCT_MAX, Math.max(0, shares) * DISCOUNT_PCT_PER_SHARE);
  const perYear = Math.round((demandKwh * HEAT_PRICE_CT * pct) / 10000);
  return {
    pct,
    capped: shares * DISCOUNT_PCT_PER_SHARE >= DISCOUNT_PCT_MAX,
    priceCt: HEAT_PRICE_CT * (1 - pct / 100),
    perYear,
    total: perYear * DISCOUNT_YEARS,
  };
}
