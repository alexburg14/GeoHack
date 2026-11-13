import copy
import unittest

from lib import cost_model as cm

HUBER = {
    "baujahr": 1985,
    "heizung": "gas",
    "heizungsalter": 17,
    "wohnflaeche": 140,
    "personen": 4,
    "sanierung": "teilsaniert",
}


class CostModelTest(unittest.TestCase):
    def setUp(self):
        self.a = cm.load_assumptions()

    def test_heat_demand_huber(self):
        # 140 m² × 140 kWh/m² × 0.85 + 4 × 700 kWh
        self.assertAlmostEqual(cm.heat_demand_kwh(HUBER, self.a), 140 * 140 * 0.85 + 4 * 700)

    def test_co2_price_interpolates_and_clamps(self):
        self.assertEqual(cm.co2_price(2026, self.a), 65)
        self.assertEqual(cm.co2_price(2029, self.a), 115)
        self.assertEqual(cm.co2_price(2020, self.a), 65)
        self.assertEqual(cm.co2_price(2099, self.a), 250)

    def test_connection_year_parses_text(self):
        self.assertEqual(cm.connection_year("Herbst 2027"), 2027)
        self.assertEqual(cm.connection_year("2029"), 2029)
        with self.assertRaises(ValueError):
            cm.connection_year("bald")

    def test_keep_replaces_boiler_once_at_end_of_life(self):
        demand = cm.heat_demand_kwh(HUBER, self.a)
        keep = cm.scenario_keep(HUBER, self.a, demand)
        self.assertEqual(keep["investition_eur"], 11000)
        yearly = [keep["kumuliert_eur"][0]] + [
            b - a for a, b in zip(keep["kumuliert_eur"], keep["kumuliert_eur"][1:])
        ]
        # 17-year-old boiler with a 20-year lifetime is replaced in year index 3
        self.assertGreater(yearly[3] - yearly[2], 10000)
        self.assertLess(abs(yearly[4] - yearly[2]), 1000)

    def test_district_uses_old_boiler_until_connection(self):
        demand = cm.heat_demand_kwh(HUBER, self.a)
        keep = cm.scenario_keep(HUBER, self.a, demand)
        district = cm.scenario_district(HUBER, self.a, demand, 2029)
        self.assertEqual(district["jahre_bis_anschluss"], 3)
        self.assertEqual(district["kumuliert_eur"][:3], keep["kumuliert_eur"][:3])
        # connection fee 9000 × 0.7 − 1500 early-signer discount
        self.assertEqual(district["investition_eur"], 4800)

    def test_heat_pump_adds_old_building_surcharge(self):
        demand = cm.heat_demand_kwh(HUBER, self.a)
        old = cm.scenario_heat_pump(HUBER, self.a, demand)
        new = cm.scenario_heat_pump({**HUBER, "baujahr": 2005}, self.a, demand)
        self.assertEqual(old["investition_eur"], 15000 + 6000)
        self.assertEqual(new["investition_eur"], 15000)

    def test_geothermal_has_lowest_co2(self):
        result = cm.compare(HUBER, self.a, 2029)
        co2 = {k: o["co2_t"] for k, o in result["optionen"].items()}
        self.assertEqual(min(co2, key=co2.get), "fernwaerme")
        self.assertEqual(len(result["jahre"]), 20)

    def test_stake_bonus_needs_minimum_amount(self):
        demand = cm.heat_demand_kwh(HUBER, self.a)
        small = cm.stake_return(500, demand, self.a)
        big = cm.stake_return(2000, demand, self.a)
        self.assertEqual(small["waermepreis_bonus_eur_pro_jahr"], 0)
        self.assertEqual(big["zinsen_pro_jahr_eur"], 60)
        self.assertEqual(big["zinsen_gesamt_eur"], 600)
        self.assertEqual(big["waermepreis_bonus_eur_pro_jahr"], round(demand * 0.005))
        with self.assertRaises(ValueError):
            cm.stake_return(100, demand, self.a)

    def test_stake_lowers_district_cost(self):
        result = cm.compare(HUBER, self.a, 2029)
        with_stake = cm.compare(HUBER, self.a, 2029, stake_eur=2000)
        self.assertLess(
            with_stake["optionen"]["fernwaerme"]["gesamt_eur"],
            result["optionen"]["fernwaerme"]["gesamt_eur"],
        )

    def test_validate_inputs_rejects_bad_values(self):
        self.assertEqual(cm.validate_inputs({**HUBER, "baujahr": "1985"})["baujahr"], 1985)
        for bad in ({**HUBER, "heizung": "holz"}, {**HUBER, "wohnflaeche": 5}, {"baujahr": 1985}):
            with self.assertRaises(ValueError):
                cm.validate_inputs(bad)

    def test_assumption_change_flows_through(self):
        cheap = copy.deepcopy(self.a)
        cheap["fernwaerme"]["mischpreis_ct"]["wert"] = 10
        self.assertLess(
            cm.compare(HUBER, cheap, 2029)["optionen"]["fernwaerme"]["gesamt_eur"],
            cm.compare(HUBER, self.a, 2029)["optionen"]["fernwaerme"]["gesamt_eur"],
        )


if __name__ == "__main__":
    unittest.main()
