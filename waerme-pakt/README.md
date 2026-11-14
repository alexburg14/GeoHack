# Wärme-Pakt · Geothermie Hackathon Pullach (Challenge 3)

Web-App für Bürgerinnen und Bürger in Starnberg (PLZ 82319): Adresse prüfen → Kosten vergleichen → Berater fragen → zusagen.
Jede Zusage zählt für die ganze Straße; ab 65 % wird ein Abschnitt gebaut.

## Starten

```bash
python3 server.py
```

Dann <http://127.0.0.1:8000> öffnen. Keine Abhängigkeiten außer Python 3.10+ (nur Standardbibliothek);
Leaflet, Chart.js und Schriften kommen per CDN, die Karte von OpenStreetMap (Internet nötig).

**KI-Berater:** `.env.example` nach `.env` kopieren und `ANTHROPIC_API_KEY` eintragen. Ohne Schlüssel (oder wenn die
API nicht erreichbar ist) antwortet der Berater im Offline-Modus mit Standardantworten aus denselben Zahlen,
damit die Live-Demo nie hängen bleibt.

**Tests:** `python3 -m unittest -v`

## Demo-Ablauf (Familie Huber)

0. http://localhost:8000/suche → „gasheizung 17 jahre alt tauschen“ → Anzeige „Fernwärme kommt in die Ottostraße“ anklicken
   → Startseite mit den vier Sorgen (Wartegarantie, Schwellen-Vertrag, Preisgarantie, Ausstiegsklausel) → „Adresse prüfen“
1. Schritt 1: `Ottostraße` (schon eingetragen), Nr. `12` → Bauphase 2, Anschluss 2029, 61 % zugesagt
2. Schritt 2: „Beispiel: Familie Huber“ → Vergleich berechnen (Baujahr 1985, Gas, 17 Jahre, 140 m², 4 Personen)
3. Schritt 3: „Was passiert, wenn meine Heizung vorher kaputtgeht?“ → Wartegarantie, „Störung jetzt melden“ → Ticket
4. Beteiligung: 2.000 € → Zinsen, Wärmepreis-Bonus, „Beteiligung zeichnen“ (Zahlung nur als Attrappe)
5. Schritt 4: „Ich bin dabei“ → Ottostraße springt von 61 % auf 67 %, über die Schwelle, Platz 8 → 6

„Demo zurücksetzen“ (Fußzeile) stellt die Zusagen wieder auf den Ausgangsstand.

**Mitgliederportal** (in der Präsentation, letzte Folie): Suche → Anzeige klicken → „Mitglieder“ in der Kopfzeile
(oder nach „Beitritt bestätigen“ auf „Genossenschaft“). Familie Huber als Mitglied: Fortschritt bis zum Wärmerabatt,
Zahlungen (weitere Anteile in Raten, Bankverbindung), Nachbarn werben. „Zusage simulieren (Demo)“ lässt eine
Einladung zusagen, das Ausbaugebiet rückt näher an die Schwelle. Rabatt-Regel in `config/assumptions.json`
(„genossenschaft“), Demo-Mitglied in `data/genossenschaft.json`.

## Aufbau

```
server.py               HTTP-Server + JSON-API (Standardbibliothek)
lib/cost_model.py       20-Jahres-Kosten und CO₂: reine Funktionen
lib/advisor.py          KI-Berater (Claude Messages API über urllib) + Offline-Antworten
config/assumptions.json ALLE Preise und Faktoren (Platzhalter!), in der App unter „Annahmen“ sichtbar
data/streets.json       20 Straßen: echte OSM-Geometrie, Demo-Haushalte/Zusagen/Bauphasen
data/updates.json       Baufortschritt (Demo)
presentation/           Spectacle-Präsentation (React + Vite, Build nach static/presentation/)
static/                 Frontend (HTML, CSS, JS)
static/presentation/    Gebaute Spectacle-Präsentation (unter /presentation/ erreichbar)
tests/                  Unit-Tests des Kostenmodells
tools/build_streets.py  erzeugt data/streets.json aus einem Overpass-Export
```

API: `GET /api/config | /api/streets | /api/ranking | /api/updates | /api/betreiber`,
`POST /api/check | /api/compare | /api/stake | /api/pledge | /api/refer | /api/chat | /api/ticket | /api/reset`.

Der Berater bekommt Adresse, Eingaben und das serverseitig berechnete Ergebnis als Kontext und darf nur diese Zahlen
verwenden. Modell: `claude-opus-5-5` (änderbar über `ANTHROPIC_MODEL` in `.env`), mit serverseitigem Refusal-Fallback.

## Daten

- Straßengeometrie: © OpenStreetMap-Mitwirkende (ODbL), Overpass-Abfrage:
  `area["name"="Starnberg"]["admin_level"="8"]->.a;way(area.a)["highway"~"residential|living_street|tertiary|secondary"]["name"];out tags geom;`
  `tools/build_streets.py` behält davon nur Straßen innerhalb seiner BBOX rund um die Ortsmitte.
- Fernwärmepreis 16,43 ct/kWh (Vergleichswert Unterhaching): Praxisforum Geothermie Bayern / Enerchange, 13.02.2026 (Beispiel EFH 27.000 kWh)
- Alles andere (Haushalte, Zusagen, Bauphasen, Preise, Förderquoten, Beteiligungskonditionen) sind **Platzhalter**.
  Vor echtem Einsatz durch Daten des Betreibers ersetzen. Laut Teilnahmebedingungen dürfen
  bereitgestellte Betriebsdaten nur während des Events genutzt und müssen danach gelöscht werden.

## Offene Punkte

- Echte Preise, Netzplan und Haushaltszahlen von den Mentoren einsetzen
- Produktentscheidungen: Preisgarantie, Frühzeichner-Rabatt (in der Rechnung: 1.500 €), Schwellen-Vertrag, Ausstiegsklausel
- Zusagen liegen nur im Arbeitsspeicher (Neustart = Ausgangsstand); kein Login
