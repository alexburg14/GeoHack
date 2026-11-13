// 20-year cost and CO₂ comparison: JavaScript port of waerme-pakt/lib/cost_model.py (Alex's model).
// All numbers come from waerme-pakt/config/assumptions.json, the same file the Python app uses,
// so the landing page and the Wärme-Pakt app always show the same results.
import assumptions from '../../../config/assumptions.json';

const a = assumptions;
const v = (group, key) => a[group][key].wert;

const lookupByYear = (stufen, baujahr) => (stufen.find((s) => baujahr <= s.bis_baujahr) || stufen[stufen.length - 1]).wert;

export const START_YEAR = v('allgemein', 'startjahr');
export const YEARS = v('allgemein', 'jahre');

export function connectionYear(text) {
  const m = String(text || '').match(/(19|20)\d\d/);
  return m ? Number(m[0]) : null;
}

export function heatDemandKwh(inputs) {
  const w = a.waermebedarf;
  const specific = lookupByYear(w.spezifisch.stufen, inputs.baujahr);
  const factor = w.sanierung_faktor.werte[inputs.sanierung];
  return inputs.wohnflaeche * specific * factor + inputs.personen * v('waermebedarf', 'warmwasser_kwh_person');
}

function co2Price(year) {
  const points = Object.entries(a.co2.preis_pfad.punkte)
    .map(([y, p]) => [Number(y), p])
    .sort((x, y) => x[0] - y[0]);
  if (year <= points[0][0]) return points[0][1];
  for (let i = 1; i < points.length; i += 1) {
    const [y0, p0] = points[i - 1];
    const [y1, p1] = points[i];
    if (year <= y1) return p0 + ((p1 - p0) * (year - y0)) / (y1 - y0);
  }
  return points[points.length - 1][1];
}

function fossilYear(inputs, demand, i) {
  const fuelKwh = demand / v('bestand', 'wirkungsgrad');
  const growth = (1 + v('bestand', 'preissteigerung')) ** i;
  const baseCt = v('bestand', `${inputs.heizung}_arbeitspreis_ct`) * growth;
  const factor = v('co2', `faktor_${inputs.heizung}`);
  const priceCt = baseCt + (factor * co2Price(START_YEAR + i)) / 10;
  const cost = (fuelKwh * priceCt) / 100 + v('bestand', 'grundpreis_eur') * growth + v('bestand', 'wartung_eur');
  return [cost, fuelKwh * factor];
}

function summary(yearly, invest, co2Kg) {
  let total = 0;
  const cumulative = yearly.map((c) => Math.round((total += c)));
  return { gesamt_eur: Math.round(total), investition_eur: Math.round(invest), kumuliert_eur: cumulative, co2_t: Math.round(co2Kg / 100) / 10 };
}

function scenarioKeep(inputs, demand) {
  const lifetime = v('bestand', 'kessel_lebensdauer');
  const yearly = [];
  let co2Kg = 0;
  let invest = 0;
  let replaced = false;
  for (let i = 0; i < YEARS; i += 1) {
    let [cost, co2] = fossilYear(inputs, demand, i);
    if (!replaced && inputs.heizungsalter + i >= lifetime) {
      cost += v('bestand', 'kesseltausch_eur');
      invest += v('bestand', 'kesseltausch_eur');
      replaced = true;
    }
    yearly.push(cost);
    co2Kg += co2;
  }
  return summary(yearly, invest, co2Kg);
}

function scenarioHeatPump(inputs, demand) {
  const w = 'waermepumpe';
  let invest = v(w, 'investition_eur') * (1 - v(w, 'foerderquote'));
  if (inputs.baujahr <= v(w, 'altbau_bis_baujahr')) invest += v(w, 'zusatzkosten_altbau_eur');
  const powerKwh = demand / lookupByYear(a[w].jaz.stufen, inputs.baujahr);
  const yearly = [];
  let co2Kg = 0;
  for (let i = 0; i < YEARS; i += 1) {
    const priceCt = v(w, 'strompreis_ct') * (1 + v(w, 'preissteigerung')) ** i;
    const cost = (powerKwh * priceCt) / 100 + v(w, 'grundpreis_eur') + v(w, 'wartung_eur');
    yearly.push(cost + (i === 0 ? invest : 0));
    co2Kg += powerKwh * v('co2', 'faktor_strom') * (1 - v('co2', 'strom_rueckgang')) ** i;
  }
  return summary(yearly, invest, co2Kg);
}

// Keep the old boiler until the connection year, then geothermal district heating.
function scenarioDistrict(inputs, demand, connYear) {
  const f = 'fernwaerme';
  const k = Math.max(0, connYear - START_YEAR);
  const invest = Math.max(0, v(f, 'anschlusskosten_eur') * (1 - v(f, 'foerderquote')) - v(f, 'fruehzeichner_rabatt_eur'));
  const yearly = [];
  let co2Kg = 0;
  for (let i = 0; i < YEARS; i += 1) {
    if (i < k) {
      const [cost, co2] = fossilYear(inputs, demand, i);
      yearly.push(cost);
      co2Kg += co2;
    } else {
      const priceCt = v(f, 'mischpreis_ct') * (1 + v(f, 'preissteigerung')) ** i;
      yearly.push((demand * priceCt) / 100 + v(f, 'wartung_eur') + (i === k ? invest : 0));
      co2Kg += demand * v('co2', 'faktor_geothermie');
    }
  }
  return { ...summary(yearly, invest, co2Kg), jahre_bis_anschluss: k };
}

export function compare(inputs, connYear) {
  const demand = heatDemandKwh(inputs);
  return {
    waermebedarf_kwh: Math.round(demand),
    jahre: Array.from({ length: YEARS }, (_, i) => START_YEAR + i),
    anschlussjahr: connYear,
    optionen: {
      fernwaerme: scenarioDistrict(inputs, demand, connYear),
      waermepumpe: scenarioHeatPump(inputs, demand),
      bestand: scenarioKeep(inputs, demand),
    },
  };
}

export const ASSUMPTIONS_NOTE = a.hinweis;
