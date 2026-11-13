"""Wärme-Pakt demo server: static frontend + JSON API. Python standard library only.

Run:  python3 server.py            (http://127.0.0.1:8000)
Env:  .env with ANTHROPIC_API_KEY=... enables the LLM advisor (else offline answers).
"""
import json
import os
import random
import re
import threading
from datetime import date
from http import HTTPStatus
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

from lib import advisor
from lib import cost_model as cm

ROOT = Path(__file__).resolve().parent
STATIC = ROOT / "static"
CONTENT_TYPES = {".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8",
                 ".css": "text/css; charset=utf-8", ".json": "application/json", ".svg": "image/svg+xml",
                 ".png": "image/png", ".ico": "image/x-icon"}


def load_env(path=ROOT / ".env"):
    env = {}
    if path.exists():
        for line in path.read_text(encoding="utf-8").splitlines():
            line = line.strip()
            if line and not line.startswith("#") and "=" in line:
                key, value = line.split("=", 1)
                env[key.strip()] = value.strip().strip('"').strip("'")
    return env


ENV = load_env()
API_KEY = ENV.get("ANTHROPIC_API_KEY") or os.environ.get("ANTHROPIC_API_KEY")
MODEL = ENV.get("ANTHROPIC_MODEL", advisor.DEFAULT_MODEL)
BASE_URL = ENV.get("ANTHROPIC_BASE_URL")  # only from .env, so a shell-level proxy setting is not picked up by accident

ASSUMPTIONS = cm.load_assumptions()
THRESHOLD = cm.v(ASSUMPTIONS, "allgemein", "zusage_schwelle")
STREETS = json.loads((ROOT / "data/streets.json").read_text(encoding="utf-8"))
UPDATES = json.loads((ROOT / "data/updates.json").read_text(encoding="utf-8"))
STREET_BY_NAME = {s["name"]: s for s in STREETS}


class PledgeStore:
    """Pledge counts per street, in memory. Reset restores the demo starting point."""

    def __init__(self):
        self.lock = threading.Lock()
        self.reset()

    def reset(self):
        with self.lock:
            self.counts = {s["name"]: s["pledged"] for s in STREETS}
            self.addresses = set()
            self.referrals = {s["name"]: 0 for s in STREETS}

    def pledge(self, street, house_number):
        with self.lock:
            key = (street, house_number.lower())
            if key in self.addresses:
                return False
            if self.counts[street] >= STREET_BY_NAME[street]["households"]:
                return False
            self.addresses.add(key)
            self.counts[street] += 1
            return True

    def refer(self, street):
        with self.lock:
            self.referrals[street] += 1

    def ranking(self):
        with self.lock:
            rows = [
                {
                    "strasse": s["name"],
                    "phase": s["phase"],
                    "haushalte": s["households"],
                    "zusagen": self.counts[s["name"]],
                    "quote": self.counts[s["name"]] / s["households"],
                    "einladungen": self.referrals[s["name"]],
                }
                for s in STREETS
            ]
        rows.sort(key=lambda r: (-r["quote"], r["strasse"]))
        for i, row in enumerate(rows, 1):
            row["rang"] = i
            row["schwelle_erreicht"] = row["quote"] >= THRESHOLD
        return rows


PLEDGES = PledgeStore()


def street_check(name, house_number=""):
    street = STREET_BY_NAME.get(name)
    if not street:
        raise ValueError("Diese Straße liegt nicht im geplanten Netzgebiet der Demo.")
    row = next(r for r in PLEDGES.ranking() if r["strasse"] == name)
    missing = max(0, -(-int(THRESHOLD * 1000 * row["haushalte"]) // 1000) - row["zusagen"])
    return {
        "strasse": name,
        "hausnummer": house_number,
        "phase": street["phase"],
        "phase_label": street["label"],
        "status": street["status"],
        "anschluss": street["expectedConnection"],
        "anschlussjahr": cm.connection_year(street["expectedConnection"]),
        "haushalte": row["haushalte"],
        "zusagen": row["zusagen"],
        "quote": row["quote"],
        "schwelle": THRESHOLD,
        "fehlende_zusagen": missing,
        "rang": row["rang"],
        "rang_gesamt": len(STREETS),
        "updates": [u for u in UPDATES if u["phase"] == street["phase"]],
    }


def comparison_for(body):
    check = street_check(body.get("strasse", ""))
    inputs = cm.validate_inputs(body.get("inputs") or {})
    stake = float(body.get("beteiligung_eur") or 0)
    return check, inputs, cm.compare(inputs, ASSUMPTIONS, check["anschlussjahr"], stake)


def clean_messages(raw):
    if not isinstance(raw, list) or not raw:
        raise ValueError("Keine Nachricht erhalten.")
    messages = []
    for m in raw[-20:]:
        role, content = m.get("role"), str(m.get("content", "")).strip()[:2000]
        if role not in ("user", "assistant") or not content:
            raise ValueError("Ungültige Nachricht.")
        messages.append({"role": role, "content": content})
    while messages and messages[0]["role"] != "user":
        messages.pop(0)
    if not messages or messages[-1]["role"] != "user":
        raise ValueError("Die letzte Nachricht muss von Ihnen kommen.")
    return messages


def operator_view():
    ranking = PLEDGES.ranking()
    near = [
        {**r, "fehlend": max(0, -(-int(THRESHOLD * 1000 * r["haushalte"]) // 1000) - r["zusagen"])}
        for r in ranking
        if not r["schwelle_erreicht"] and r["quote"] >= THRESHOLD - 0.15
    ]
    rng = random.Random(42)
    boilers = []
    for r in near:
        for _ in range(2):
            boilers.append({
                "adresse": f"{r['strasse']} {rng.randint(1, 60)}",
                "heizung": rng.choice(["Gas", "Gas", "Öl"]),
                "alter": rng.randint(18, 31),
                "quelle": rng.choice(["Schornsteinfeger (mit Einwilligung)", "Infoabend", "Online-Check"]),
            })
    boilers.sort(key=lambda b: -b["alter"])
    return {
        "haushalte": sum(r["haushalte"] for r in ranking),
        "zusagen": sum(r["zusagen"] for r in ranking),
        "strassen_ueber_schwelle": sum(r["schwelle_erreicht"] for r in ranking),
        "strassen": len(ranking),
        "kurz_vor_schwelle": near,
        "alte_heizungen": boilers,
    }


class Handler(BaseHTTPRequestHandler):
    server_version = "WaermePakt/0.1"

    def log_message(self, fmt, *args):
        print(f"[{self.log_date_time_string()}] {fmt % args}")

    def send_json(self, payload, status=HTTPStatus.OK):
        data = json.dumps(payload, ensure_ascii=False).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(data)))
        self.send_header("Cache-Control", "no-store")
        self.end_headers()
        self.wfile.write(data)

    def read_json(self):
        length = int(self.headers.get("Content-Length") or 0)
        if length > 100_000:
            raise ValueError("Anfrage zu groß.")
        return json.loads(self.rfile.read(length) or b"{}")

    def do_GET(self):
        path = self.path.split("?", 1)[0]
        routes = {
            "/api/config": lambda: {"annahmen": ASSUMPTIONS, "schwelle": THRESHOLD, "ki_aktiv": bool(API_KEY)},
            "/api/streets": lambda: {"strassen": [
                {k: s[k] for k in ("name", "phase", "label", "status", "expectedConnection", "geometry")} for s in STREETS
            ], "ranking": PLEDGES.ranking(), "schwelle": THRESHOLD},
            "/api/ranking": lambda: {"ranking": PLEDGES.ranking(), "schwelle": THRESHOLD},
            "/api/updates": lambda: {"updates": UPDATES},
            "/api/betreiber": operator_view,
        }
        if path in routes:
            return self.send_json(routes[path]())
        self.serve_static(path)

    def do_POST(self):
        path = self.path.split("?", 1)[0]
        try:
            body = self.read_json()
            if path == "/api/check":
                return self.send_json(street_check(body.get("strasse", ""), str(body.get("hausnummer", ""))[:10]))
            if path == "/api/compare":
                _, _, result = comparison_for(body)
                return self.send_json(result)
            if path == "/api/stake":
                demand = None
                if body.get("inputs"):
                    demand = cm.heat_demand_kwh(cm.validate_inputs(body["inputs"]), ASSUMPTIONS)
                return self.send_json(cm.stake_return(float(body.get("betrag", 0)), demand, ASSUMPTIONS))
            if path == "/api/pledge":
                return self.send_json(self.pledge(body))
            if path == "/api/refer":
                street_check(body.get("strasse", ""))
                PLEDGES.refer(body["strasse"])
                return self.send_json({"ok": True})
            if path == "/api/chat":
                return self.send_json(self.chat(body))
            if path == "/api/ticket":
                return self.send_json(self.ticket(body))
            if path == "/api/reset":
                PLEDGES.reset()
                return self.send_json({"ok": True})
            self.send_json({"fehler": "Unbekannte Adresse."}, HTTPStatus.NOT_FOUND)
        except (ValueError, json.JSONDecodeError) as err:
            self.send_json({"fehler": str(err)}, HTTPStatus.BAD_REQUEST)

    def pledge(self, body):
        street = body.get("strasse", "")
        house_number = str(body.get("hausnummer", "")).strip()[:10]
        if not house_number:
            raise ValueError("Bitte Hausnummer angeben.")
        before = street_check(street)
        added = PLEDGES.pledge(street, house_number)
        after = street_check(street, house_number)
        return {"neu": added, "vorher": before, "nachher": after,
                "schwelle_ueberschritten": before["quote"] < THRESHOLD <= after["quote"]}

    def chat(self, body):
        messages = clean_messages(body.get("messages"))
        check = street_check(body.get("strasse", ""), str(body.get("hausnummer", ""))[:10])
        check.pop("updates")
        inputs = comparison = stake = None
        if body.get("inputs"):
            _, inputs, comparison = comparison_for(body)
            if body.get("beteiligung_eur"):
                demand = cm.heat_demand_kwh(inputs, ASSUMPTIONS)
                stake = cm.stake_return(float(body["beteiligung_eur"]), demand, ASSUMPTIONS)
        context = advisor.build_context(check, inputs, comparison, stake, ASSUMPTIONS)
        return advisor.answer(messages, context, API_KEY, MODEL, BASE_URL)

    def ticket(self, body):
        phone = str(body.get("telefon", "")).strip()
        problem = str(body.get("problem", "")).strip()
        if not re.fullmatch(r"[0-9 +/()-]{6,20}", phone):
            raise ValueError("Bitte eine gültige Telefonnummer angeben.")
        if len(problem) < 3:
            raise ValueError("Bitte kurz beschreiben, was nicht funktioniert.")
        number = f"WP-{date.today().year}-{random.randint(1000, 9999)}"
        return {
            "ticket": number,
            "angebot": "Übergangsheizung (mobile Heizzentrale) ohne Investition, bis Ihr Haus ans Netz geht. "
                       "Sie zahlen nur die Wärme, die Sie verbrauchen.",
            "naechster_schritt": "Ein Techniker aus Unterhaching ruft Sie an, um einen Termin zu vereinbaren.",
        }

    def serve_static(self, path):
        rel = "index.html" if path in ("", "/") else path.lstrip("/").removeprefix("static/")
        target = (STATIC / rel).resolve()
        if not target.is_relative_to(STATIC) or not target.is_file():
            return self.send_json({"fehler": "Nicht gefunden."}, HTTPStatus.NOT_FOUND)
        data = target.read_bytes()
        self.send_response(HTTPStatus.OK)
        self.send_header("Content-Type", CONTENT_TYPES.get(target.suffix, "application/octet-stream"))
        self.send_header("Content-Length", str(len(data)))
        self.send_header("Cache-Control", "no-cache")
        self.end_headers()
        self.wfile.write(data)


def main():
    host = os.environ.get("HOST", "127.0.0.1")
    port = int(os.environ.get("PORT", "8000"))
    mode = f"KI-Berater aktiv ({MODEL})" if API_KEY else "KI-Berater offline (kein ANTHROPIC_API_KEY in .env)"
    print(f"Wärme-Pakt läuft auf http://{host}:{port}  ·  {mode}")
    ThreadingHTTPServer((host, port), Handler).serve_forever()


if __name__ == "__main__":
    main()
