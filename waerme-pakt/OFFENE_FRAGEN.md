# Offene Fragen an die Mentoren und Entscheidungen im Team

Jede Antwort ersetzt einen Platzhalter in `config/assumptions.json`. Nach dem Eintragen: `python3 -m unittest` und
Server neu starten. Die Werte erscheinen dann automatisch im Kostenvergleich, unter „Annahmen“ und beim KI-Berater.

## Fragen an den Betreiber

| Frage | Feld in `assumptions.json` | Platzhalter heute |
|---|---|---|
| Wärmepreis für ein Einfamilienhaus: Arbeitspreis, Grundpreis, Messpreis? | `fernwaerme.mischpreis_ct` | 16,43 ct/kWh (Praxisforum, Vergleichswert Unterhaching) |
| Wie ist die Preisgleitklausel aufgebaut (Index, Anpassung pro Jahr)? | `fernwaerme.preissteigerung` | 2 % pro Jahr |
| Was kostet ein Hausanschluss mit Übergabestation, und gibt es eine Förderung (BEW/BEG)? | `fernwaerme.anschlusskosten_eur`, `fernwaerme.foerderquote` | 9.000 €, 30 % |
| Welche Zusagequote braucht ein Straßenabschnitt wirklich? | `allgemein.zusage_schwelle` | 65 % |
| Welche Straßen sind in welcher Bauphase, mit welchem Anschlussjahr? | `data/streets.json` (`phase`, `expectedConnection`) | Demodaten |
| Was kann eine Übergangsheizung leisten, und was kostet sie den Betreiber? | `wartegarantie.text` | Mobile Heizzentrale ohne Investition |
| Gibt es schon ein Beteiligungsmodell (Genossenschaft, Nachrangdarlehen)? Zins, Laufzeit, Mindestbetrag? | `beteiligung.*` | 3 % p. a., 10 Jahre, ab 500 € |
| Investitionssumme für den Netzausbau? | `beteiligung.netz_investition_eur` | 40 Mio. € |

Hinweis: Laut Teilnahmebedingungen dürfen bereitgestellte Betriebsdaten nur während des Events genutzt und müssen
danach gelöscht werden. Echte Werte also nicht dauerhaft ins öffentliche Repository committen.

## Entscheidungen im Team (Preis- und Lock-in-Risiko)

| Option | Wofür | Was es in der App bedeutet |
|---|---|---|
| **Frühzeichner-Rabatt** | Belohnt frühe Zusagen | Schon eingebaut: `fernwaerme.fruehzeichner_rabatt_eur` (1.500 €) |
| **Preisgarantie** (z. B. Preisdeckel gegenüber Gas für X Jahre) | Preisrisiko | Neues Feld + Hinweis im Kostenvergleich nötig |
| **Schwellen-Vertrag** (Zusage wird nur wirksam, wenn die Straße die Schwelle erreicht) | Risiko „Ich sage zu, und dann passiert nichts“ | Text beim Button „Ich bin dabei“ anpassen |
| **Ausstiegsklausel** (Rücktritt, falls Anschluss später als X Jahre nach Zusage kommt) | Zeit- und Lock-in-Risiko | Text beim Button + Wissen des Beraters |

Stand in der App: Schwellen-Vertrag, Ausstiegsklausel (2 Jahre Verzug) und Preisgarantie (5 Jahre nicht über
Gas-Vergleichswert) sind als **Vorschlag** in `assumptions.json` → `zusage` eingetragen und unter dem Button
„Ich bin dabei“ sichtbar. Texte dort ändern oder Einträge löschen, sobald entschieden ist.

Empfehlung für den Pitch: Schwellen-Vertrag und Ausstiegsklausel kosten den Betreiber wenig, nehmen aber genau die
Angst, die die Zusage bremst. Eine Preisgarantie nur mit dem Betreiber gemeinsam festlegen.
