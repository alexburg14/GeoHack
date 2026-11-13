"""20-year cost and CO₂ comparison: keep gas/oil vs. heat pump vs. geothermal district heating.

Pure functions only. Every number comes from config/assumptions.json (`a`), so the
model can be unit-tested and the assumptions shown to residents as they are.
Costs are nominal euros (no discounting).
"""
import json
import re
from pathlib import Path

ASSUMPTIONS_PATH = Path(__file__).resolve().parent.parent / "config" / "assumptions.json"

HEATING_TYPES = ("gas", "oel")
RENOVATION_LEVELS = ("unsaniert", "teilsaniert", "vollsaniert")


def load_assumptions(path=ASSUMPTIONS_PATH):
    return json.loads(Path(path).read_text(encoding="utf-8"))


def v(a, group, key):
    return a[group][key]["wert"]


def lookup_by_year(stufen, baujahr):
    for stufe in stufen:
        if baujahr <= stufe["bis_baujahr"]:
            return stufe["wert"]
    return stufen[-1]["wert"]


def connection_year(expected_connection):
    """'Herbst 2027' -> 2027."""
    match = re.search(r"(19|20)\d\d", str(expected_connection))
    if not match:
        raise ValueError(f"no year in {expected_connection!r}")
    return int(match.group(0))


def validate_inputs(raw):
    """Normalise form input; raises ValueError with a German message on bad input."""
    try:
        inputs = {
            "baujahr": int(raw["baujahr"]),
            "heizung": str(raw["heizung"]),
            "heizungsalter": int(raw["heizungsalter"]),
            "wohnflaeche": float(raw["wohnflaeche"]),
            "personen": int(raw["personen"]),
            "sanierung": str(raw["sanierung"]),
        }
    except (KeyError, TypeError, ValueError):
        raise ValueError("Bitte alle Felder ausfüllen.")
    if not 1800 <= inputs["baujahr"] <= 2026:
        raise ValueError("Baujahr muss zwischen 1800 und 2026 liegen.")
    if inputs["heizung"] not in HEATING_TYPES:
        raise ValueError("Heizungsart muss Gas oder Öl sein.")
    if not 0 <= inputs["heizungsalter"] <= 60:
        raise ValueError("Alter der Heizung muss zwischen 0 und 60 Jahren liegen.")
    if not 20 <= inputs["wohnflaeche"] <= 1000:
        raise ValueError("Wohnfläche muss zwischen 20 und 1000 m² liegen.")
    if not 1 <= inputs["personen"] <= 15:
        raise ValueError("Personen muss zwischen 1 und 15 liegen.")
    if inputs["sanierung"] not in RENOVATION_LEVELS:
        raise ValueError("Unbekannter Sanierungsgrad.")
    return inputs


def heat_demand_kwh(inputs, a):
    """Annual useful heat (space heating + hot water) in kWh."""
    w = a["waermebedarf"]
    specific = lookup_by_year(w["spezifisch"]["stufen"], inputs["baujahr"])
    factor = w["sanierung_faktor"]["werte"][inputs["sanierung"]]
    space = inputs["wohnflaeche"] * specific * factor
    water = inputs["personen"] * v(a, "waermebedarf", "warmwasser_kwh_person")
    return space + water


def co2_price(year, a):
    """CO₂ price in €/t, linear between the configured points, flat outside them."""
    points = sorted((int(y), p) for y, p in a["co2"]["preis_pfad"]["punkte"].items())
    if year <= points[0][0]:
        return points[0][1]
    for (y0, p0), (y1, p1) in zip(points, points[1:]):
        if year <= y1:
            return p0 + (p1 - p0) * (year - y0) / (y1 - y0)
    return points[-1][1]


def _fossil_year(inputs, a, demand, i):
    """Running cost (€) and CO₂ (kg) of the existing gas/oil boiler in year index i."""
    b = "bestand"
    fuel_kwh = demand / v(a, b, "wirkungsgrad")
    growth = (1 + v(a, b, "preissteigerung")) ** i
    base_ct = v(a, b, f"{inputs['heizung']}_arbeitspreis_ct") * growth
    factor = v(a, "co2", f"faktor_{inputs['heizung']}")
    price_ct = base_ct + factor * co2_price(v(a, "allgemein", "startjahr") + i, a) / 10
    cost = fuel_kwh * price_ct / 100 + v(a, b, "grundpreis_eur") * growth + v(a, b, "wartung_eur")
    return cost, fuel_kwh * factor


def scenario_keep(inputs, a, demand):
    """Keep gas/oil; the boiler is replaced once when it reaches its lifetime."""
    years = v(a, "allgemein", "jahre")
    lifetime = v(a, "bestand", "kessel_lebensdauer")
    yearly, co2_kg, invest, replaced = [], 0.0, 0.0, False
    for i in range(years):
        cost, co2 = _fossil_year(inputs, a, demand, i)
        if not replaced and inputs["heizungsalter"] + i >= lifetime:
            cost += v(a, "bestand", "kesseltausch_eur")
            invest += v(a, "bestand", "kesseltausch_eur")
            replaced = True
        yearly.append(cost)
        co2_kg += co2
    return _summary(yearly, invest, co2_kg)


def scenario_heat_pump(inputs, a, demand):
    """Install a heat pump now (year 0)."""
    w = "waermepumpe"
    invest = v(a, w, "investition_eur") * (1 - v(a, w, "foerderquote"))
    if inputs["baujahr"] <= v(a, w, "altbau_bis_baujahr"):
        invest += v(a, w, "zusatzkosten_altbau_eur")
    power_kwh = demand / lookup_by_year(a[w]["jaz"]["stufen"], inputs["baujahr"])
    yearly, co2_kg = [], 0.0
    for i in range(v(a, "allgemein", "jahre")):
        price_ct = v(a, w, "strompreis_ct") * (1 + v(a, w, "preissteigerung")) ** i
        cost = power_kwh * price_ct / 100 + v(a, w, "grundpreis_eur") + v(a, w, "wartung_eur")
        yearly.append(cost + (invest if i == 0 else 0))
        co2_kg += power_kwh * v(a, "co2", "faktor_strom") * (1 - v(a, "co2", "strom_rueckgang")) ** i
    return _summary(yearly, invest, co2_kg)


def scenario_district(inputs, a, demand, conn_year, stake_eur=0):
    """Keep the old boiler until the connection year, then geothermal district heating.

    No new boiler before the connection: the waiting guarantee covers a breakdown.
    """
    f = "fernwaerme"
    start = v(a, "allgemein", "startjahr")
    k = max(0, conn_year - start)
    invest = v(a, f, "anschlusskosten_eur") * (1 - v(a, f, "foerderquote")) - v(a, f, "fruehzeichner_rabatt_eur")
    invest = max(0.0, invest)
    bonus_ct = v(a, "beteiligung", "waermepreis_rabatt_ct") if stake_eur >= v(a, "beteiligung", "rabatt_ab_eur") else 0
    yearly, co2_kg = [], 0.0
    for i in range(v(a, "allgemein", "jahre")):
        if i < k:
            cost, co2 = _fossil_year(inputs, a, demand, i)
        else:
            price_ct = v(a, f, "mischpreis_ct") * (1 + v(a, f, "preissteigerung")) ** i - bonus_ct
            cost = demand * price_ct / 100 + v(a, f, "wartung_eur") + (invest if i == k else 0)
            co2 = demand * v(a, "co2", "faktor_geothermie")
        yearly.append(cost)
        co2_kg += co2
    summary = _summary(yearly, invest, co2_kg)
    summary["jahre_bis_anschluss"] = k
    return summary


def _summary(yearly, invest, co2_kg):
    cumulative, total = [], 0.0
    for cost in yearly:
        total += cost
        cumulative.append(round(total))
    return {
        "gesamt_eur": round(total),
        "investition_eur": round(invest),
        "kumuliert_eur": cumulative,
        "co2_t": round(co2_kg / 1000, 1),
    }


def compare(inputs, a, conn_year, stake_eur=0):
    demand = heat_demand_kwh(inputs, a)
    start = v(a, "allgemein", "startjahr")
    return {
        "waermebedarf_kwh": round(demand),
        "jahre": list(range(start, start + v(a, "allgemein", "jahre"))),
        "anschlussjahr": conn_year,
        "optionen": {
            "fernwaerme": scenario_district(inputs, a, demand, conn_year, stake_eur),
            "waermepumpe": scenario_heat_pump(inputs, a, demand),
            "bestand": scenario_keep(inputs, a, demand),
        },
    }


def stake_return(amount_eur, demand_kwh, a):
    """Expected return of a stake in the network ('Bürgerbeteiligung')."""
    b = "beteiligung"
    if not v(a, b, "mindestbetrag_eur") <= amount_eur <= v(a, b, "hoechstbetrag_eur"):
        raise ValueError(
            f"Betrag muss zwischen {v(a, b, 'mindestbetrag_eur')} und {v(a, b, 'hoechstbetrag_eur')} € liegen."
        )
    interest = amount_eur * v(a, b, "zins")
    if demand_kwh is None:
        bonus = None  # heat demand unknown until the house form is filled in
    else:
        bonus = round(demand_kwh * v(a, b, "waermepreis_rabatt_ct") / 100 if amount_eur >= v(a, b, "rabatt_ab_eur") else 0)
    return {
        "betrag_eur": round(amount_eur),
        "zins": v(a, b, "zins"),
        "zinsen_pro_jahr_eur": round(interest),
        "zinsen_gesamt_eur": round(interest * v(a, b, "laufzeit_jahre")),
        "laufzeit_jahre": v(a, b, "laufzeit_jahre"),
        "waermepreis_bonus_eur_pro_jahr": bonus,
        "anteil_am_netz": amount_eur / v(a, b, "netz_investition_eur"),
    }
