// Member benefit of the Wärme-Genossenschaft: no interest, but a discount on the heat price
// for a fixed period. All values are a proposal of the team ("Vorschlag des Teams, noch nicht
// mit dem Betreiber abgestimmt"), not agreed conditions. The heat price is read from
// config/assumptions.json and never changed here.
import assumptions from '../../../config/assumptions.json';

export const HEAT_PRICE_CT = assumptions.fernwaerme.mischpreis_ct.wert; // ct/kWh, incl. base price

export const DISCOUNT_YEARS = 10; // how long members get the discount (team range: 5–10 years)
export const DISCOUNT_PCT_PER_SHARE = 1; // percent off the heat price per share
export const DISCOUNT_PCT_MAX = 10; // cap: more shares mean more ownership, not more discount
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
