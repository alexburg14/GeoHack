// 20-year cost and CO₂ comparison: JavaScript port of waerme-pakt/lib/cost_model.py (Alex's model).
// All numbers come from waerme-pakt/config/assumptions.json, the same file the Python app uses,
// so the landing page and the Wärme-Pakt app always show the same results.
// On top of the Python model: any horizon (e.g. 40 years, with devices replaced at the end of their
// lifetime) and "what if" overrides for the price factors the user can move on the result page.
// Both models count replacement units per year they run inside the horizon (cost / lifetime),
// so the 20-year totals of the app and the landing page match.
import assumptions from '../../../config/assumptions.json';

const a = assumptions;
const base = (group, key) => a[group][key].wert;

// Overrides set by compare(); keys are "group.key", e.g. "waermepumpe.strompreis_ct".
let overrides = {};
const v = (group, key) => overrides[`${group}.${key}`] ?? base(group, key);

const lookupByYear = (stufen, baujahr) => (stufen.find((s) => baujahr <= s.bis_baujahr) || stufen[stufen.length - 1]).wert;

export const START_YEAR = v('allgemein', 'startjahr');
export const YEARS = base('allgemein', 'jahre');

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

// invest: all investments inside the horizon; upfront: what the option costs when it starts.
function summary(yearly, invest, co2Kg, upfront) {
  let total = 0;
  const cumulative = yearly.map((c) => Math.round((total += c)));
  return {
    gesamt_eur: Math.round(total),
    investition_eur: Math.round(invest),
    anschaffung_eur: Math.round(upfront),
    kumuliert_eur: cumulative,
    co2_t: Math.round(co2Kg / 100) / 10,
  };
}

function scenarioKeep(inputs, demand, years) {
  const lifetime = v('bestand', 'kessel_lebensdauer');
  const yearly = [];
  let co2Kg = 0;
  let invest = 0;
  for (let i = 0; i < years; i += 1) {
    let [cost, co2] = fossilYear(inputs, demand, i);
    // new boiler once the old one reaches its lifetime, counted per year it runs inside the horizon
    if (inputs.heizungsalter + i >= lifetime) {
      const share = v('bestand', 'kesseltausch_eur') / lifetime;
      cost += share;
      invest += share;
    }
    yearly.push(cost);
    co2Kg += co2;
  }
  return summary(yearly, invest, co2Kg, 0);
}

function scenarioHeatPump(inputs, demand, years) {
  const w = 'waermepumpe';
  let invest = v(w, 'investition_eur') * (1 - v(w, 'foerderquote'));
  if (inputs.baujahr <= v(w, 'altbau_bis_baujahr')) invest += v(w, 'zusatzkosten_altbau_eur');
  const powerKwh = demand / jaz(inputs);
  const lifetime = v(w, 'lebensdauer');
  const yearly = [];
  let co2Kg = 0;
  let replacements = 0;
  for (let i = 0; i < years; i += 1) {
    const priceCt = v(w, 'strompreis_ct') * (1 + v(w, 'preissteigerung')) ** i;
    const cost = (powerKwh * priceCt) / 100 + v(w, 'grundpreis_eur') + v(w, 'wartung_eur');
    // new unit at the end of the lifetime (no subsidy), counted per year it runs inside the horizon
    const replacement = i >= lifetime ? v(w, 'ersatz_eur') / lifetime : 0;
    yearly.push(cost + (i === 0 ? invest : 0) + replacement);
    replacements += replacement;
    co2Kg += powerKwh * v('co2', 'faktor_strom') * (1 - v('co2', 'strom_rueckgang')) ** i;
  }
  return summary(yearly, invest + replacements, co2Kg, invest);
}

// Keep the old boiler until the connection year, then geothermal district heating.
function scenarioDistrict(inputs, demand, connYear, years) {
  const f = 'fernwaerme';
  const k = Math.max(0, connYear - START_YEAR);
  const invest = Math.max(0, v(f, 'anschlusskosten_eur') * (1 - v(f, 'foerderquote')) - v(f, 'fruehzeichner_rabatt_eur'));
  const yearly = [];
  let co2Kg = 0;
  const renewalYear = k + v(f, 'station_lebensdauer');
  let renewals = 0;
  for (let i = 0; i < years; i += 1) {
    if (i < k) {
      const [cost, co2] = fossilYear(inputs, demand, i);
      yearly.push(cost);
      co2Kg += co2;
    } else {
      const priceCt = v(f, 'mischpreis_ct') * (1 + v(f, 'preissteigerung')) ** i;
      // new transfer station after its lifetime, counted per year it runs inside the horizon (like the other devices)
      const renewal = i >= renewalYear ? v(f, 'station_erneuerung_eur') / v(f, 'station_lebensdauer') : 0;
      renewals += renewal;
      yearly.push((demand * priceCt) / 100 + v(f, 'wartung_eur') + (i === k ? invest : 0) + renewal);
      co2Kg += demand * v('co2', 'faktor_geothermie');
    }
  }
  return { ...summary(yearly, invest + renewals, co2Kg, invest), jahre_bis_anschluss: k };
}

// Seasonal performance of the heat pump: from the building year unless the user moved the slider.
export function jaz(inputs) {
  return overrides['waermepumpe.jaz'] ?? lookupByYear(a.waermepumpe.jaz.stufen, inputs.baujahr);
}

// The factors the result page lets users move, with their defaults from assumptions.json.
export const FACTOR_DEFAULTS = {
  'waermepumpe.strompreis_ct': base('waermepumpe', 'strompreis_ct'),
  'waermepumpe.preissteigerung': base('waermepumpe', 'preissteigerung'),
  'bestand.preissteigerung': base('bestand', 'preissteigerung'),
  'fernwaerme.preissteigerung': base('fernwaerme', 'preissteigerung'),
};

export function compare(inputs, connYear, { years = YEARS, factors = {} } = {}) {
  overrides = factors;
  try {
    const demand = heatDemandKwh(inputs);
    return {
      waermebedarf_kwh: Math.round(demand),
      jahre: Array.from({ length: years }, (_, i) => START_YEAR + i),
      anschlussjahr: connYear,
      jaz: jaz(inputs),
      optionen: {
        fernwaerme: scenarioDistrict(inputs, demand, connYear, years),
        waermepumpe: scenarioHeatPump(inputs, demand, years),
        bestand: scenarioKeep(inputs, demand, years),
      },
    };
  } finally {
    overrides = {};
  }
}

// Years in which a device is replaced (for markers on the long-run chart).
export const LIFETIMES = {
  waermepumpe: base('waermepumpe', 'lebensdauer'),
  bestand: base('bestand', 'kessel_lebensdauer'),
  station: base('fernwaerme', 'station_lebensdauer'),
};

// What each replacement costs (for the captions of the long-run chart).
export const REPLACEMENT_EUR = {
  waermepumpe: base('waermepumpe', 'ersatz_eur'),
  bestand: base('bestand', 'kesseltausch_eur'),
  station: base('fernwaerme', 'station_erneuerung_eur'),
};

export const ASSUMPTIONS_NOTE = a.hinweis;
