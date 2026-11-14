import React, { useEffect, useRef, useState } from 'react';
import './fragen.css';

// "Fragen" tab: the Wärme-Pakt advisor from the Python app (static/app.js, step 3), same backend (/api/chat).
// The server builds the context from address and house data and answers with Claude, or offline without an API key.
// In development Vite proxies /api to the Python server (vite.config.js); in the build both share one origin.

// Prepared questions with the team's answers: shown instantly, without asking the server.
// Free questions typed into the field still go to the advisor (/api/chat).
const QUESTIONS = [
  {
    q: 'Meine Gasheizung ist schon 20 Jahre alt – was passiert, wenn sie in den 5 Jahren kaputtgeht?',
    a: 'Kein Problem! Mit Ihrem Vorvertrag greift ab Tag 1 unsere Havarie-Garantie: Fällt Ihre alte Heizung vor dem Anschluss aus, übernehmen wir die Reparatur oder stellen Ihnen kostenlos ein mobiles Heizmodul / eine Miet-Wärmepumpe bereit, bis die Leitung liegt. Ihr Risiko liegt bei 0 €.',
    ticket: true,
  },
  {
    q: 'Warum soll ich 5 Jahre warten, wenn ich innerhalb von 3 Monaten eine Wärmepumpe einbauen lassen kann?',
    a: 'Weil Sie über 20 Jahre rund 30.000 € sparen: Sie zahlen dank Early-Bird-Bonus fast nichts für den Hausanschluss, brauchen keine teure Altbau-Sanierung (Fußbodenheizung) und müssen nach 16 Jahren keine zweite Wärmepumpe für 18.000 € kaufen.',
  },
  {
    q: 'Was passiert, wenn bei der Bohrung gar kein heißes Wasser gefunden wird?',
    a: 'Das geologische Bohrrisiko tragen ausschließlich wir als Versorger (abgesichert über eine staatliche Fündigkeitsversicherung). Sollte das Projekt wider Erwarten nicht realisiert werden, erlischt Ihr Vorvertrag automatisch und völlig kostenfrei für Sie.',
  },
];

const stopKeys = (e) => e.stopPropagation();

async function api(path, body) {
  const res = await fetch(path, body === undefined ? {} : {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.fehler || 'Der Berater ist gerade nicht erreichbar.');
  return data;
}

// chat: [{ role, content, typing?, local?, ticket? }] is kept by the parent so it survives tab switches.
export default function FragenPage({ street, houseNo, outsideNetwork, connection, inputs, houseLabel, chat, setChat, onCheckAddress, onReportProblem }) {
  const [text, setText] = useState('');
  const [aiActive, setAiActive] = useState(null); // null = unknown / server not reachable
  const [busy, setBusy] = useState(false);
  const logRef = useRef(null);

  useEffect(() => {
    api('/api/config').then((c) => setAiActive(c.ki_aktiv), () => setAiActive(null));
  }, []);

  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
  }, [chat]);

  // Prepared question: question and answer appear at once, the answer pops in.
  const ask = ({ q, a, ticket }) => {
    if (busy) return;
    setChat((c) => [...c, { role: 'user', content: q, local: true }, { role: 'assistant', content: a, local: true, ticket, pop: true }]);
  };

  const send = async (raw) => {
    const question = raw.trim();
    if (!question || busy) return;
    setText('');
    if (!street) {
      setChat((c) => [
        ...c,
        { role: 'user', content: question },
        {
          role: 'assistant',
          local: true,
          content: outsideNetwork
            ? 'Ihre Straße liegt nicht im geplanten Netzgebiet der Demo. Probieren Sie in Schritt 1 eine Straße aus dem Netzgebiet, z. B. die Ottostraße.'
            : 'Dafür brauche ich zuerst Ihre Adresse. Bitte prüfen Sie sie in Schritt 1, dann kann ich mit Ihren Daten antworten.',
        },
      ]);
      return;
    }
    const history = [...chat.filter((m) => !m.local), { role: 'user', content: question }].map(({ role, content }) => ({ role, content }));
    setChat((c) => [...c, { role: 'user', content: question }, { role: 'assistant', content: 'Der Berater schreibt …', typing: true }]);
    setBusy(true);
    let reply;
    try {
      const res = await api('/api/chat', { messages: history, strasse: street, hausnummer: houseNo, inputs: inputs || undefined });
      reply = { role: 'assistant', content: res.text, ticket: res.ticket };
    } catch (err) {
      reply = { role: 'assistant', local: true, content: `Entschuldigung, das hat nicht geklappt (${err.message}).` };
    }
    setChat((c) => [...c.filter((m) => !m.typing), reply]);
    setBusy(false);
  };

  const mode =
    aiActive === null ? 'Verbindung zum Berater wird geprüft …'
      : aiActive ? 'KI-Berater · antwortet nur mit Ihren Zahlen'
        : 'Offline-Modus · Standardantworten ohne KI-Schlüssel';

  return (
    <div className="ep-page" style={{ maxWidth: 1080 }}>
      <div>
        <p className="eyebrow">Fragen</p>
        <h1 style={{ fontSize: 30 }}>Fragen Sie den Wärme-Pakt-Berater</h1>
        <p className="muted" style={{ marginTop: 6 }}>
          Er kennt Ihre Adresse und Ihre Hausdaten und rechnet nur mit diesen Zahlen. Er erfindet keine Preise.
        </p>
      </div>

      <div className="fr-grid">
        <div className="ep-card fr-chat">
          <div className="fr-head">
            <span className="fr-avatar" aria-hidden="true">W</span>
            <div>
              <b>Wärme-Pakt-Berater</b>
              <small>{mode}</small>
            </div>
          </div>
          <div className="fr-log" ref={logRef} aria-live="polite">
            {chat.length === 0 && (
              <div className="fr-msg assistant">
                Grüß Gott! Ich beantworte Ihre Fragen zum Geothermie-Anschluss: Zeitplan, Kosten, Wartegarantie und Genossenschaft.
                {street ? '' : ' Prüfen Sie dafür am besten zuerst Ihre Adresse.'}
              </div>
            )}
            {chat.map((m, i) => (
              <div key={i} className={`fr-msg ${m.role} ${m.typing ? 'typing' : ''} ${m.pop ? 'pop' : ''}`}>
                {m.content}
                {m.ticket && (
                  <button type="button" className="ep-btn primary" onClick={onReportProblem}>Störung jetzt melden</button>
                )}
              </div>
            ))}
          </div>
          <div className="fr-chips">
            {QUESTIONS.map((item) => (
              <button key={item.q} type="button" onClick={() => ask(item)} disabled={busy}>{item.q}</button>
            ))}
          </div>
          <form className="fr-form" onSubmit={(e) => { e.preventDefault(); send(text); }}>
            <input className="text" value={text} onChange={(e) => setText(e.target.value)} onKeyDown={stopKeys}
              placeholder="Ihre Frage …" aria-label="Ihre Frage" maxLength={2000} />
            <button type="submit" className="ep-btn primary" disabled={busy || !text.trim()}>Senden</button>
          </form>
        </div>

        <div className="fr-side">
          <div className="ep-card fr-warn">
            <h2>Heizung kaputt?</h2>
            <p>
              Wenn Ihre Heizung vor dem Anschluss ausfällt, greift die <b>Wartegarantie</b>: Sie bekommen eine Übergangsheizung und
              müssen keinen neuen Kessel kaufen.
            </p>
            <button type="button" className="ep-btn primary" onClick={onReportProblem}>Störung melden</button>
          </div>
          <div className="ep-card">
            <h2>Das weiß der Berater</h2>
            <dl className="fr-context">
              <dt>Adresse</dt><dd>{street ? `${street} ${houseNo}` : 'noch nicht geprüft'}</dd>
              <dt>Anschluss</dt><dd>{street ? connection : '–'}</dd>
              <dt>Haus</dt><dd>{inputs ? houseLabel : 'noch nicht berechnet'}</dd>
            </dl>
            {!street && (
              <button type="button" className="ep-btn ghost" style={{ marginTop: 12 }} onClick={onCheckAddress}>Adresse prüfen</button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
