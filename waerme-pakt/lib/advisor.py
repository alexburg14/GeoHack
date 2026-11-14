"""LLM advisor: answers residents' questions using only the numbers the app computed.

Calls the Claude Messages API over raw HTTP (urllib) because the Anthropic SDK cannot be
installed in the hackathon environment (no pip). Without an API key, or when the API
call fails, it falls back to a rule-based answer so the live demo never breaks.
"""
import json
import urllib.error
import urllib.request

API_VERSION = "2026-10-21"
FALLBACK_BETA = "server-side-fallback-2026-07-01"
DEFAULT_MODEL = "claude-opus-5-5"

TICKET_TOKEN = "[[FORMULAR_HEIZUNG_KAPUTT]]"

SYSTEM_PROMPT = f"""Du bist der Wärme-Pakt-Berater, ein digitaler Ansprechpartner für Bürgerinnen und Bürger in Starnberg, die überlegen, ihr Haus an das Geothermie-Fernwärmenetz anzuschließen. Dies ist ein Hackathon-Prototyp mit Demodaten.

So sprichst du:
- Freundlich, bodenständig und ehrlich, wie ein Nachbar, der sich auskennt. Siezen.
- Kurz: meist 2 bis 5 Sätze. Höchstens eine kurze Aufzählung. Kein Markdown mit Überschriften oder Fettdruck.
- Einfaches Deutsch ohne Fachjargon. Wenn ein Fachwort nötig ist, erkläre es in einem Halbsatz.

Zahlen und Fakten:
- Verwende ausschließlich Zahlen, Termine und Bedingungen aus dem KONTEXT unten. Erfinde keine Preise, Förderquoten, Termine oder Zusagen.
- Wenn etwas nicht im Kontext steht, sag das offen und verweise auf den Kundenservice des Wärmenetz-Betreibers.
- Alle Preise im Kontext sind Platzhalter für die Demo. Erwähne das, wenn jemand konkret nach Preisen fragt.
- Die Zusage-Bedingungen (Schwellen-Vertrag, Ausstiegsklausel, Preisgarantie) im Kontext sind Vorschläge, die noch nicht verbindlich sind. Sag das, wenn du sie nennst.
- Sei ehrlich, auch wenn eine andere Option günstiger ist. Erkläre dann, was neben dem Preis zählt (CO₂, kein Gerät im Haus, lokale Wärme, Beteiligung, Preisentwicklung).

Wartegarantie und Störungen:
- Erkläre die Wartegarantie mit dem Text aus dem Kontext.
- Wenn jemand meldet, dass die Heizung kaputt ist oder ausgefallen ist: Zeige Verständnis, erkläre kurz die Wartegarantie und frage nach den nötigen Angaben (Heizungsart, Alter, was genau nicht funktioniert, wie dringend, Telefonnummer für Rückruf). Hänge dann am Ende deiner Antwort genau diese Markierung an: {TICKET_TOKEN}
  Die App zeigt dann ein Formular, mit dem die Meldung abgeschickt wird. Versprich keine Uhrzeit für den Techniker."""


def build_context(check, inputs, comparison, stake, assumptions):
    """Everything the advisor may cite, computed server-side."""
    labels = {"fernwaerme": "Geothermie-Fernwärme", "waermepumpe": "Wärmepumpe", "bestand": "Weiter mit bisheriger Heizung"}
    context = {
        "adresse": check,
        "wartegarantie": assumptions["wartegarantie"]["text"],
        "zusage_bedingungen": assumptions["zusage"],
        "hinweis": assumptions["hinweis"],
    }
    if inputs:
        context["gebaeude"] = inputs
    if comparison:
        context["kostenvergleich_20_jahre"] = {
            "waermebedarf_kwh_pro_jahr": comparison["waermebedarf_kwh"],
            "anschlussjahr": comparison["anschlussjahr"],
            "optionen": {
                labels[key]: {
                    "gesamtkosten_eur": opt["gesamt_eur"],
                    "anschaffung_eur": opt["anschaffung_eur"],
                    "investition_inkl_ersatz_eur": opt["investition_eur"],
                    "co2_tonnen_20_jahre": opt["co2_t"],
                }
                for key, opt in comparison["optionen"].items()
            },
            "annahmen": {
                group: {k: f"{p['wert']} {p.get('einheit', '')}".strip() for k, p in values.items() if isinstance(p, dict) and "wert" in p}
                for group, values in assumptions.items()
                if group in ("bestand", "waermepumpe", "fernwaerme", "co2")
            },
        }
    if stake:
        context["beteiligung"] = stake
    return json.dumps(context, ensure_ascii=False, indent=1)


def answer(messages, context, api_key, model=DEFAULT_MODEL, base_url=None, brand="Wärme-Pakt"):
    """Return {"text", "mode", "ticket"}; mode is "llm" or "offline"."""
    if api_key:
        try:
            text = _call_claude(messages, context, api_key, model, base_url, brand)
            return _finish(text, "llm")
        except (urllib.error.URLError, TimeoutError, KeyError, ValueError) as err:
            print(f"[advisor] API call failed, using offline answer: {err}")
    return _finish(_offline_answer(messages[-1]["content"], json.loads(context)), "offline")


def _finish(text, mode):
    ticket = TICKET_TOKEN in text
    return {"text": text.replace(TICKET_TOKEN, "").strip(), "mode": mode, "ticket": ticket}


def _call_claude(messages, context, api_key, model, base_url, brand="Wärme-Pakt"):
    body = {
        "model": model,
        "max_tokens": 16000,
        # the landing page uses the advisor under its own brand (EnergiePlus)
        "system": f"{SYSTEM_PROMPT.replace('Wärme-Pakt-Berater', f'{brand}-Berater')}\n\nKONTEXT (JSON):\n{context}",
        "messages": messages,
        "output_config": {"effort": "low"},
        "fallbacks": "default",
    }
    request = urllib.request.Request(
        (base_url or "https://api.anthropic.com").rstrip("/") + "/v1/messages",
        data=json.dumps(body).encode("utf-8"),
        headers={
            "content-type": "application/json",
            "x-api-key": api_key,
            "anthropic-version": API_VERSION,
            "anthropic-beta": FALLBACK_BETA,
        },
        method="POST",
    )
    try:
        with urllib.request.urlopen(request, timeout=60) as response:
            data = json.loads(response.read())
    except urllib.error.HTTPError as err:
        detail = err.read().decode("utf-8", "replace")[:300]
        raise ValueError(f"HTTP {err.code}: {detail}") from err
    if data.get("stop_reason") == "refusal":
        return "Dazu kann ich leider nichts sagen. Bei Fragen zu Ihrem Anschluss hilft Ihnen der Kundenservice des Wärmenetz-Betreibers gern weiter."
    text = "".join(block["text"] for block in data["content"] if block["type"] == "text").strip()
    if not text:
        raise ValueError("empty response")
    return text


def _eur(value):
    return f"{value:,.0f} €".replace(",", ".")


def _offline_answer(question, ctx):
    """Keyword answers from the same context, for demos without an API key."""
    q = question.lower()
    adresse = ctx.get("adresse") or {}
    vergleich = ctx.get("kostenvergleich_20_jahre")

    if any(w in q for w in ("kaputt", "defekt", "ausgefallen", "ausfall", "geht nicht", "funktioniert nicht", "störung", "kalt")):
        return (
            "Keine Sorge, genau dafür gibt es die Wartegarantie: "
            f"{ctx['wartegarantie']} Damit wir schnell helfen können, brauchen wir Heizungsart, Alter, "
            "was genau nicht funktioniert und eine Telefonnummer für den Rückruf. " + TICKET_TOKEN
        )
    if any(w in q for w in ("aussteig", "ausstieg", "rücktritt", "zurücktret", "kündig", "binde", "gebunden", "verpflicht", "preisgarantie", "vertrag")):
        lines = "\n".join(f"- {b['titel']}: {b['text']}" for b in ctx["zusage_bedingungen"]["bedingungen"])
        return f"Für Ihre Zusage sind diese Bedingungen vorgeschlagen (noch nicht verbindlich):\n{lines}\nDazu kommt die Wartegarantie, falls Ihre Heizung vorher ausfällt."
    if vergleich and any(w in q for w in ("kost", "teuer", "preis", "günstig", "lohnt", "wärmepumpe", "spar", "co2", "co₂")):
        o = vergleich["optionen"]
        fw, wp, best = o["Geothermie-Fernwärme"], o["Wärmepumpe"], o["Weiter mit bisheriger Heizung"]
        return (
            f"Über 20 Jahre kommen wir mit den Demo-Annahmen auf {_eur(fw['gesamtkosten_eur'])} für Fernwärme, "
            f"{_eur(wp['gesamtkosten_eur'])} für eine Wärmepumpe und {_eur(best['gesamtkosten_eur'])}, wenn Sie bei Ihrer Heizung bleiben. "
            f"Beim CO₂ liegt die Geothermie klar vorn: {fw['co2_tonnen_20_jahre']} t statt {wp['co2_tonnen_20_jahre']} t bzw. "
            f"{best['co2_tonnen_20_jahre']} t. Dazu kommt: kein Gerät im Haus, Wärme aus Starnberg und keine Wartung. "
            "Die Preise sind Platzhalter, bis echte Zahlen vorliegen."
        )
    if any(w in q for w in ("wann", "dauer", "zeit", "2029", "termin", "warum dauert", "anschluss")) and adresse:
        return (
            f"Die {adresse.get('strasse')} liegt in {adresse.get('phase_label')} ({adresse.get('status')}). "
            f"Der Anschluss ist voraussichtlich {adresse.get('anschluss')}. Ein Geothermie-Netz braucht von der Bohrung bis zum Hausanschluss "
            f"mehrere Jahre. Gebaut wird ein Abschnitt, sobald genug Nachbarn zugesagt haben: In Ihrer Straße sind es gerade "
            f"{round(adresse.get('quote', 0) * 100)} %, die Schwelle liegt bei {round(adresse.get('schwelle', 0) * 100)} %."
        )
    if any(w in q for w in ("beteilig", "rendite", "zins", "anteil", "invest")):
        b = ctx.get("beteiligung")
        if b:
            return (
                f"Mit {_eur(b['betrag_eur'])} Beteiligung erhalten Sie {b['zins'] * 100:.1f} % Zinsen pro Jahr, also etwa "
                f"{_eur(b['zinsen_pro_jahr_eur'])} jährlich und {_eur(b['zinsen_gesamt_eur'])} über {b['laufzeit_jahre']} Jahre. "
                f"Dazu kommt ein Wärmepreis-Bonus von rund {_eur(b['waermepreis_bonus_eur_pro_jahr'])} pro Jahr. Alle Werte sind Demo-Platzhalter."
            )
        return "Über den Reiter „Beteiligung“ können Sie einen Betrag wählen. Ich rechne Ihnen dann Zinsen und Wärmepreis-Bonus vor."
    return (
        "Gute Frage. Ich kann Ihnen zu Anschlusstermin, Kostenvergleich, Wartegarantie und Bürgerbeteiligung Auskunft geben. "
        "Für alles andere hilft Ihnen der Kundenservice des Wärmenetz-Betreibers weiter. (Offline-Modus ohne KI-Schlüssel)"
    )
