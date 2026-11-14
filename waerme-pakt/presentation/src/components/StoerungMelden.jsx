import React, { useState } from 'react';
import assumptions from '../../../config/assumptions.json';

// "Störung melden" tab of the member portal: members report a problem with their current heating.
// Before the connection the Wartegarantie applies (interim heating without investment, config/assumptions.json).
// Demo only: tickets live in the portal's state, nobody is called.

const GUARANTEE = assumptions.wartegarantie.text;

export const PROBLEMS = [
  { id: 'ausfall', label: 'Heizung fällt ganz aus', emoji: '🥶', urgent: true },
  { id: 'wasser', label: 'Kein Warmwasser', emoji: '🚿', urgent: true },
  { id: 'schwach', label: 'Heizt zu schwach', emoji: '🌡️', urgent: false },
  { id: 'undicht', label: 'Undicht oder Wasser am Gerät', emoji: '💧', urgent: true },
  { id: 'fehler', label: 'Geräusche oder Fehlermeldung', emoji: '⚠️', urgent: false },
  { id: 'sonstiges', label: 'Etwas anderes', emoji: '❓', urgent: false },
];
const SINCE = ['Seit heute', 'Seit ein paar Tagen', 'Seit über einer Woche'];
const REACH = ['Vormittags', 'Nachmittags', 'Abends', 'Jederzeit'];

// Ticket progress; tickets that qualify for the Wartegarantie get the interim heating step.
export const ticketSteps = (t) =>
  t.uebergang
    ? ['Eingegangen', 'Termin', 'Übergangsheizung', 'Erledigt']
    : ['Eingegangen', 'Techniker-Termin', 'Erledigt'];

const day = (iso) => new Date(`${iso}T12:00:00`).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' });
const stopKeys = (e) => e.stopPropagation();

export default function StoerungMelden({ heating, tickets, onSubmit, onAdvance }) {
  const [problem, setProblem] = useState(null);
  const [since, setSince] = useState(SINCE[0]);
  const [text, setText] = useState('');
  const [phone, setPhone] = useState('');
  const [reach, setReach] = useState(REACH[3]);
  const [error, setError] = useState('');

  const heatingAge = new Date().getFullYear() - heating.baujahr;
  const chosen = PROBLEMS.find((p) => p.id === problem);

  const submit = (e) => {
    e.preventDefault();
    if (!chosen) return setError('Bitte wählen Sie aus, was passiert ist.');
    if (chosen.id === 'sonstiges' && text.trim().length < 3) return setError('Bitte beschreiben Sie kurz, was nicht funktioniert.');
    if (!/^[0-9 +/()-]{6,20}$/.test(phone.trim())) return setError('Bitte eine gültige Telefonnummer für den Rückruf angeben.');
    setError('');
    onSubmit({ art: chosen.label, text: [since, text.trim()].filter(Boolean).join(' · '), uebergang: chosen.urgent, erreichbar: reach });
    setProblem(null);
    setText('');
  };

  return (
    <div className="mp-grid" key="stoerung">
      <form className="ep-card" onSubmit={submit} autoComplete="off">
        <h2>Störung melden</h2>
        <div className="mp-safety" role="note">
          <b>Gasgeruch?</b> Kein Licht und keine Schalter betätigen, Fenster öffnen, Haus verlassen und von draußen den
          Notruf 112 oder den Gas-Notdienst Ihres Netzbetreibers anrufen.
        </div>

        <p className="mp-label">Was ist passiert?</p>
        <div className="mp-problems">
          {PROBLEMS.map((p) => (
            <button key={p.id} type="button" className={`ep-option ${problem === p.id ? 'selected' : ''}`} onClick={() => setProblem(p.id)}>
              <span className="emoji">{p.emoji}</span>
              {p.label}
            </button>
          ))}
        </div>

        <p className="mp-label">Seit wann?</p>
        <div className="mp-rates">
          {SINCE.map((s) => (
            <button key={s} type="button" className={`ep-chip ${since === s ? 'selected' : ''}`} onClick={() => setSince(s)}>{s}</button>
          ))}
        </div>

        <label className="field" htmlFor="mp-problem-text" style={{ marginTop: 14 }}>
          Beschreibung {chosen?.id === 'sonstiges' ? '' : '(optional)'}
        </label>
        <textarea id="mp-problem-text" className="mp-textarea" rows={2} value={text} onChange={(e) => setText(e.target.value)} onKeyDown={stopKeys}
          placeholder="z. B. Fehlercode F28 im Display, Druck unter 1 bar" />

        <div className="mp-addr" style={{ gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)' }}>
          <div>
            <label className="field" htmlFor="mp-phone">Rückrufnummer</label>
            <input id="mp-phone" className="text" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} onKeyDown={stopKeys} placeholder="08151 …" />
          </div>
          <div>
            <label className="field" htmlFor="mp-reach">Erreichbar</label>
            <select id="mp-reach" className="mp-select" value={reach} onChange={(e) => setReach(e.target.value)} onKeyDown={stopKeys}>
              {REACH.map((r) => <option key={r}>{r}</option>)}
            </select>
          </div>
        </div>

        {chosen?.urgent && (
          <div className="mp-guarantee-hit">
            <b>Ihre Wartegarantie greift.</b> Sie bekommen eine Übergangsheizung ohne Investition, bis Ihr Haus am Netz ist.
            Einen neuen Gaskessel brauchen Sie nicht.
          </div>
        )}
        <button type="submit" className="ep-btn primary" style={{ width: '100%', marginTop: 14 }}>Störung melden</button>
        {error && <p className="mp-error" role="alert">{error}</p>}
      </form>

      <div className="mp-stack">
        <div className="ep-card">
          <h2>Ihre Wartegarantie</h2>
          <dl className="mp-facts">
            <dt>Heizung</dt><dd>{heating.art}, {heatingAge} Jahre alt</dd>
            <dt>Gilt bis</dt><dd>zu Ihrem Hausanschluss</dd>
          </dl>
          <p className="mp-note" style={{ marginTop: 10 }}>{GUARANTEE}</p>
        </div>

        <div className="ep-card">
          <h2>Ihre Meldungen</h2>
          <ul className="mp-referrals">
            {[...tickets].reverse().map((t) => {
              const steps = ticketSteps(t);
              const done = t.stufe >= steps.length;
              return (
                <li key={t.nummer}>
                  <div className="mp-ref-head">
                    <b>{t.art}</b>
                    <span className={`mp-chip ${done ? 'ok' : 'hot'}`}>{done ? 'Erledigt' : steps[t.stufe - 1]}</span>
                  </div>
                  <small>{t.nummer} · {day(t.datum)}{t.text ? ` · ${t.text}` : ''}</small>
                  <ol className="mp-ref-steps" style={{ gridTemplateColumns: `repeat(${steps.length}, minmax(0, 1fr))` }}>
                    {steps.map((s, k) => <li key={s} className={k < t.stufe ? 'done' : ''}>{s}</li>)}
                  </ol>
                  {t.loesung && <p className="mp-note">{t.loesung}</p>}
                  {!done && t.naechster && <p className="mp-note"><b>Nächster Schritt:</b> {t.naechster}</p>}
                  {!done && (
                    <button type="button" className="mp-simulate" onClick={() => onAdvance(t.nummer)}>Status weiter (Demo)</button>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </div>
  );
}
