import React, { useRef, useState } from 'react';
import { STREETS, STAKE, THRESHOLD, PHASES, TOWN, findStreet, areaOfStreet } from '../data/town';
import {
  DISCOUNT_YEARS,
  DISCOUNT_PCT_PER_SHARE,
  DISCOUNT_PCT_MAX,
  EXAMPLE_DEMAND_KWH,
  INSTALLMENTS_MAX,
  DEMO_MEMBER,
  DEMO_MEMBERS,
  DEMO_RAISED,
  memberDiscount,
} from '../data/genossenschaft';
import UPDATES from '../../../data/updates.json';
import StoerungMelden from './StoerungMelden';
import './mitglieder.css';

// Member portal of the Wärme-Genossenschaft: progress, payments, referrals for the demo member (Familie Huber).
// Everything lives in component state: nothing is stored or sent, no money moves.
// Pledges are shown per district (Ausbaugebiet), never per street, like on the Nachbarschaft page.

const SHARE_EUR = STAKE.mindestbetrag_eur.wert; // one cooperative share = minimum stake
const MAX_SHARES = Math.floor(STAKE.hoechstbetrag_eur.wert / SHARE_EUR);
const NETWORK_EUR = STAKE.netz_investition_eur.wert;

const eur = (n) => `${Math.round(n).toLocaleString('de-DE')} €`;
const num = (n, d = 0) => n.toLocaleString('de-DE', { minimumFractionDigits: d, maximumFractionDigits: d });
// round down, so a share is never shown as reaching the threshold before it does
const pct = (x) => `${Math.floor(x * 100 + 1e-9)} %`;
const day = (d) => (typeof d === 'string' ? new Date(`${d}T12:00:00`) : d).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' });
const iso = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
// Spectacle uses the arrow keys for slide navigation; keep them inside form fields.
const stopKeys = (e) => e.stopPropagation();

// Debit dates on the 5th: next month first, then every three months.
const debitDates = (count, from = new Date()) =>
  Array.from({ length: count }, (_, i) => new Date(from.getFullYear(), from.getMonth() + 1 + 3 * i, 5));

// ISO 13616 mod-97 check, done in chunks so it works without BigInt; German IBANs have 22 characters.
function ibanValid(raw) {
  const iban = raw.replace(/\s+/g, '').toUpperCase();
  if (!/^[A-Z]{2}\d{2}[A-Z0-9]{11,30}$/.test(iban) || (iban.startsWith('DE') && iban.length !== 22)) return false;
  const digits = (iban.slice(4) + iban.slice(0, 4)).replace(/[A-Z]/g, (c) => String(c.charCodeAt(0) - 55));
  let rest = 0;
  for (let i = 0; i < digits.length; i += 7) rest = Number(String(rest) + digits.slice(i, i + 7)) % 97;
  return rest === 1;
}
const maskIban = (iban) => `${iban.slice(0, 4)} •••• •••• •••• ${iban.slice(-4, -2)} ${iban.slice(-2)}`;

const REF_STATUS = {
  eingeladen: { label: 'Eingeladen', cls: '', step: 1 },
  zugesagt: { label: 'Hat zugesagt', cls: 'hot', step: 2 },
  mitglied: { label: 'Mitglied', cls: 'ok', step: 3 },
};

const TABS = [
  { id: 'fortschritt', label: 'Fortschritt' },
  { id: 'zahlungen', label: 'Zahlungen' },
  { id: 'werben', label: 'Nachbarn werben' },
  { id: 'stoerung', label: 'Störung melden' },
];

function AreaBar({ area, extra = 0 }) {
  const share = (area.pledged + extra) / area.households;
  const missing = Math.max(0, Math.ceil(THRESHOLD * area.households - 1e-9) - area.pledged - extra);
  return (
    <div className="mp-area">
      <div className="mp-area-head">
        <b>{area.name}</b>
        <span>{pct(share)}</span>
      </div>
      <div className="ep-progress">
        <span style={{ width: `${Math.min(100, share * 100)}%`, background: share >= THRESHOLD ? 'var(--ok)' : undefined }} />
        <i style={{ left: `${THRESHOLD * 100}%` }} />
      </div>
      <small>
        {share >= THRESHOLD ? 'Schwelle erreicht, der Bau wird beauftragt' : `noch ${missing} ${missing === 1 ? 'Zusage' : 'Zusagen'} bis ${pct(THRESHOLD)}`}
      </small>
    </div>
  );
}

export default function MitgliederPage({ demandKwh, onCheckAddress, initialTab = 'fortschritt' }) {
  const [tab, setTab] = useState(initialTab);
  const [shares, setShares] = useState(DEMO_MEMBER.anteile);
  const [payments, setPayments] = useState(DEMO_MEMBER.zahlungen);
  const [raised, setRaised] = useState(DEMO_RAISED);
  const [bank, setBank] = useState({ iban: DEMO_MEMBER.iban, holder: DEMO_MEMBER.kontoinhaber });
  const [referrals, setReferrals] = useState(DEMO_MEMBER.empfehlungen);
  const [tickets, setTickets] = useState(DEMO_MEMBER.meldungen);
  const [toast, setToast] = useState('');
  const toastTimer = useRef(null);

  const flash = (text) => {
    setToast(text);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(''), 3500);
  };

  const street = findStreet(DEMO_MEMBER.strasse);
  const area = areaOfStreet(street);
  const connYear = Number(String(street.expectedConnection).match(/\d{4}/)[0]);
  const demand = demandKwh || EXAMPLE_DEMAND_KWH;
  const discount = memberDiscount(shares, demand);

  // Pledges the member's invitations brought in during the demo, per district
  const extraPledges = (a) =>
    referrals.filter((r) => r.neu_zugesagt && areaOfStreet(findStreet(r.strasse))?.id === a.id).length;
  const ownExtra = extraPledges(area);
  const ownShare = (area.pledged + ownExtra) / area.households;
  const reached = ownShare >= THRESHOLD;
  const referralAreas = [area, ...new Set(referrals.map((r) => areaOfStreet(findStreet(r.strasse))).filter((a) => a && a.id !== area.id))];

  const booked = payments.filter((p) => p.status === 'gebucht').reduce((n, p) => n + p.betrag, 0);
  const planned = payments.filter((p) => p.status === 'geplant');
  const membersInvited = referrals.filter((r) => r.status === 'mitglied').length;

  const milestones = [
    { title: 'Mitglied geworden', text: `Mitgliedsnummer ${DEMO_MEMBER.nummer} · ${day(DEMO_MEMBER.mitglied_seit)}`, state: 'done' },
    {
      title: `${area.name} erreicht ${pct(THRESHOLD)} Zusagen`,
      text: reached ? 'Schwelle erreicht, der Bau wird beauftragt.' : `${pct(ownShare)} zugesagt. Jede Einladung hilft.`,
      state: reached ? 'done' : 'now',
    },
    { title: 'Leitung in Ihrer Straße', text: `${PHASES[street.phase].label} · Bauphase ${street.phase}`, state: reached ? 'now' : '' },
    { title: 'Hausanschluss', text: `Geplant ${street.expectedConnection}`, state: '' },
    { title: 'Wärmerabatt läuft', text: `${connYear} bis ${connYear + DISCOUNT_YEARS - 1} · ${num(discount.pct)} % auf den Wärmepreis`, state: '' },
  ];

  /* ---------- Zahlungen ---------- */
  const room = MAX_SHARES - shares;
  const [buyShares, setBuyShares] = useState(2);
  const [rates, setRates] = useState(1);
  const buyOk = Number.isInteger(buyShares) && buyShares >= 1 && buyShares <= room;
  const after = memberDiscount(shares + (buyOk ? buyShares : 0), demand);
  const total = (buyOk ? buyShares : 0) * SHARE_EUR;
  const dates = debitDates(rates);

  const buy = () => {
    if (!buyOk) return;
    const base = Math.floor(total / rates);
    const label = `Einlage ${buyShares} ${buyShares === 1 ? 'Anteil' : 'Anteile'}`;
    setPayments((ps) => [
      ...ps,
      ...dates.map((d, i) => ({
        datum: iso(d),
        betrag: base + (i < total % rates ? 1 : 0),
        status: 'geplant',
        text: rates === 1 ? label : `${label}, Rate ${i + 1} von ${rates}`,
      })),
    ]);
    setShares((s) => s + buyShares);
    setRaised((r) => r + total);
    flash(`${buyShares} ${buyShares === 1 ? 'Anteil' : 'Anteile'} gezeichnet. Ihr Wärmerabatt: ${num(after.pct)} %.`);
  };

  const [bankEdit, setBankEdit] = useState(false);
  const [ibanInput, setIbanInput] = useState('');
  const [holderInput, setHolderInput] = useState('');
  const [bankError, setBankError] = useState('');
  const saveBank = (e) => {
    e.preventDefault();
    const iban = ibanInput.replace(/\s+/g, '').toUpperCase();
    if (!ibanValid(iban)) return setBankError('Diese IBAN ist ungültig. Bitte prüfen Sie die Eingabe.');
    if (holderInput.trim().length < 3) return setBankError('Bitte den Namen des Kontoinhabers angeben.');
    setBank({ iban, holder: holderInput.trim() });
    setBankEdit(false);
    setBankError('');
    flash('Bankverbindung gespeichert. Die nächste Lastschrift geht an das neue Konto.');
  };

  /* ---------- Nachbarn werben ---------- */
  const [refName, setRefName] = useState('');
  const [refStreet, setRefStreet] = useState(DEMO_MEMBER.strasse);
  const [refHouse, setRefHouse] = useState('');
  const [refError, setRefError] = useState('');
  const invite = (e) => {
    e.preventDefault();
    const s = findStreet(refStreet);
    if (refName.trim().length < 2) return setRefError('Bitte den Namen Ihrer Nachbarn angeben.');
    if (!s) return setRefError(`Diese Straße liegt nicht im geplanten Netzgebiet von ${TOWN}.`);
    if (refHouse.trim() && referrals.some((r) => r.strasse === s.name && r.hausnummer.toLowerCase() === refHouse.trim().toLowerCase()))
      return setRefError('Diesen Haushalt haben Sie schon eingeladen.');
    setReferrals((rs) => [...rs, { name: refName.trim(), strasse: s.name, hausnummer: refHouse.trim(), datum: iso(new Date()), status: 'eingeladen' }]);
    setRefName('');
    setRefHouse('');
    setRefError('');
    flash(`${refName.trim()} ist vorgemerkt. Schicken Sie jetzt Ihren Einladungslink.`);
  };
  // Presenter control: the invited household pledges (in the real product this comes from the address check)
  const simulatePledge = (idx) => {
    setReferrals((rs) => rs.map((r, i) => (i === idx ? { ...r, status: 'zugesagt', neu_zugesagt: true } : r)));
    flash(`${referrals[idx].name} hat zugesagt. ${areaOfStreet(findStreet(referrals[idx].strasse))?.name} rückt näher an die Schwelle.`);
  };
  const inviteLink = `https://waerme-pakt.example.de/?von=empfehlung&code=${DEMO_MEMBER.nummer}`;
  const copyLink = () => {
    navigator.clipboard?.writeText(inviteLink).then(() => flash('Link kopiert.'), () => {});
  };

  /* ---------- Störung melden ---------- */
  const reportProblem = ({ art, text, uebergang, erreichbar }) => {
    const nummer = `WP-${new Date().getFullYear()}-${1000 + Math.floor(Math.random() * 9000)}`;
    const when = erreichbar === 'Jederzeit' ? 'so schnell wie möglich' : erreichbar.toLowerCase();
    setTickets((ts) => [...ts, {
      nummer, datum: iso(new Date()), art, text, uebergang, stufe: 1,
      naechster: `Ein Techniker aus ${TOWN} ruft Sie ${when} zurück und vereinbart einen Termin.`,
    }]);
    flash(`Meldung ${nummer} ist eingegangen. Wir rufen Sie zurück.`);
  };
  // Presenter control: move a ticket one step forward
  const advanceTicket = (nummer) => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    setTickets((ts) => ts.map((t) => {
      if (t.nummer !== nummer) return t;
      const stufe = t.stufe + 1;
      if (stufe === 2) return { ...t, stufe, naechster: `Techniker-Termin am ${day(tomorrow)} zwischen 8 und 12 Uhr.` };
      if (stufe === 3 && t.uebergang)
        return { ...t, stufe, naechster: 'Die mobile Heizzentrale steht vor Ihrem Haus. Sie zahlen nur die Wärme, die Sie verbrauchen.' };
      return {
        ...t, stufe: t.uebergang ? 4 : 3, naechster: null,
        loesung: t.uebergang
          ? `Übergangsheizung läuft bis zu Ihrem Anschluss ${street.expectedConnection}. Ihre Zusage bleibt bestehen.`
          : 'Störung behoben.',
      };
    }));
  };

  return (
    <div className="ep-page mp" style={{ maxWidth: 1080 }}>
      <div className="mp-hero">
        <div>
          <p className="eyebrow">Mitgliederportal · Wärme-Genossenschaft {TOWN}</p>
          <h1>Guten Tag, {DEMO_MEMBER.name}</h1>
          <p>
            Mitglied {DEMO_MEMBER.nummer} seit {day(DEMO_MEMBER.mitglied_seit)} · {DEMO_MEMBER.strasse} {DEMO_MEMBER.hausnummer} · Anschluss{' '}
            {street.expectedConnection}
          </p>
        </div>
        <div className="mp-kpis">
          <div><small>Anteile</small><b>{shares}</b><small>{eur(shares * SHARE_EUR)} Einlage</small></div>
          <div><small>Wärmerabatt</small><b>{num(discount.pct)} %</b><small>≈ {eur(discount.perYear)} pro Jahr</small></div>
          <div><small>Eingeladen</small><b>{referrals.length}</b><small>davon {membersInvited} {membersInvited === 1 ? 'Mitglied' : 'Mitglieder'}</small></div>
          <div><small>{area.name}</small><b>{pct(ownShare)}</b><small>Ziel {pct(THRESHOLD)}</small></div>
        </div>
      </div>

      <div className="mp-tabs" role="tablist">
        {TABS.map((t) => (
          <button key={t.id} type="button" role="tab" aria-selected={tab === t.id} className={tab === t.id ? 'active' : ''} onClick={() => setTab(t.id)}>
            {t.label}
          </button>
        ))}
        <span className="mp-demo">Demo: Es wird nichts gespeichert und kein Geld bewegt.</span>
      </div>

      {tab === 'fortschritt' && (
        <div className="mp-grid" key="fortschritt">
          <div className="ep-card">
            <h2>Ihr Weg zur Geothermie</h2>
            <ol className="mp-timeline">
              {milestones.map((m) => (
                <li key={m.title} className={m.state}>
                  <b>{m.title}</b>
                  <span>{m.text}</span>
                </li>
              ))}
            </ol>
          </div>
          <div className="mp-stack">
            <div className="ep-card">
              <h2>Ihr Ausbaugebiet</h2>
              <AreaBar area={area} extra={ownExtra} />
              {!reached && (
                <button type="button" className="ep-btn primary" style={{ marginTop: 14 }} onClick={() => setTab('werben')}>
                  Nachbarn einladen
                </button>
              )}
            </div>
            <div className="ep-card">
              <h2>Ihre Genossenschaft</h2>
              <div className="ep-kpis two">
                <div className="ep-kpi"><small>Mitglieder</small><b>{num(DEMO_MEMBERS)}</b></div>
                <div className="ep-kpi"><small>Kapital</small><b>{num(raised / 1e6, 1)} Mio. €</b></div>
              </div>
              <div className="ep-progress"><span style={{ width: `${(raised / NETWORK_EUR) * 100}%` }} /></div>
              <small className="mp-note">{pct(raised / NETWORK_EUR)} der {num(NETWORK_EUR / 1e6)} Mio. € Netzausbau kommen von Mitgliedern.</small>
            </div>
          </div>
          <div className="ep-card mp-wide">
            <h2>Neuigkeiten aus Bauphase {street.phase}</h2>
            <ul className="mp-updates">
              {UPDATES.filter((u) => u.phase === street.phase)
                .sort((a, b) => b.datum.localeCompare(a.datum))
                .map((u) => (
                  <li key={u.titel}>
                    <time>{day(u.datum)}</time>
                    <div><b>{u.titel}</b><p>{u.text}</p></div>
                  </li>
                ))}
            </ul>
          </div>
        </div>
      )}

      {tab === 'zahlungen' && (
        <div className="mp-grid" key="zahlungen">
          <div className="mp-stack">
            <div className="ep-card">
              <h2>Ihre Einlage</h2>
              <div className="ep-kpis two">
                <div className="ep-kpi"><small>Gezeichnet</small><b>{eur(shares * SHARE_EUR)}</b><small className="sub">{shares} × {eur(SHARE_EUR)}</small></div>
                <div className="ep-kpi">
                  <small>Eingezahlt</small><b>{eur(booked)}</b>
                  <small className="sub">{planned[0] ? `Nächste Lastschrift ${day(planned[0].datum)}: ${eur(planned[0].betrag)}` : 'Alles bezahlt'}</small>
                </div>
              </div>
              <table className="mp-ledger">
                <thead><tr><th>Datum</th><th>Buchung</th><th className="num">Betrag</th><th>Status</th></tr></thead>
                <tbody>
                  {[...payments].sort((a, b) => a.datum.localeCompare(b.datum)).map((p, i) => (
                    <tr key={i}>
                      <td>{day(p.datum)}</td>
                      <td>{p.text}</td>
                      <td className="num">{eur(p.betrag)}</td>
                      <td><span className={`mp-chip ${p.status === 'gebucht' ? 'ok' : ''}`}>{p.status === 'gebucht' ? 'Gebucht' : 'Geplant'}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="ep-card">
              <div className="mp-card-head">
                <h2>Bankverbindung</h2>
                {!bankEdit && (
                  <button type="button" className="ep-btn ghost small" onClick={() => { setBankEdit(true); setHolderInput(bank.holder); setIbanInput(''); }}>
                    Ändern
                  </button>
                )}
              </div>
              {!bankEdit ? (
                <dl className="mp-facts">
                  <dt>Kontoinhaber</dt><dd>{bank.holder}</dd>
                  <dt>IBAN</dt><dd>{maskIban(bank.iban)}</dd>
                  <dt>Verfahren</dt><dd>SEPA-Lastschrift</dd>
                </dl>
              ) : (
                <form onSubmit={saveBank} autoComplete="off">
                  <label className="field" htmlFor="mp-iban">IBAN</label>
                  <input id="mp-iban" className="text" value={ibanInput} onChange={(e) => setIbanInput(e.target.value)} onKeyDown={stopKeys} placeholder="DE.. .... .... .... .... .." autoFocus />
                  <label className="field" htmlFor="mp-holder" style={{ marginTop: 10 }}>Kontoinhaber</label>
                  <input id="mp-holder" className="text" value={holderInput} onChange={(e) => setHolderInput(e.target.value)} onKeyDown={stopKeys} />
                  <div style={{ display: 'flex', gap: 10, marginTop: 12 }}>
                    <button type="submit" className="ep-btn primary">Speichern</button>
                    <button type="button" className="ep-btn ghost" onClick={() => { setBankEdit(false); setBankError(''); }}>Abbrechen</button>
                  </div>
                  {bankError && <p className="mp-error" role="alert">{bankError}</p>}
                </form>
              )}
            </div>
          </div>

          <div className="ep-card">
            <h2>Weitere Anteile zeichnen</h2>
            <p className="mp-note">
              1 Anteil = {eur(SHARE_EUR)}. Jeder Anteil bringt {num(DISCOUNT_PCT_PER_SHARE)} % Rabatt auf den Wärmepreis, höchstens{' '}
              {num(DISCOUNT_PCT_MAX)} %, {DISCOUNT_YEARS} Jahre ab Anschluss. Sie können noch {room} Anteile zeichnen.
            </p>
            <label className="field" htmlFor="mp-shares" style={{ marginTop: 14 }}>Anzahl Anteile</label>
            <div className="mp-stepper">
              <button type="button" aria-label="Einen Anteil weniger" onClick={() => setBuyShares((n) => Math.max(1, n - 1))}>−</button>
              <input id="mp-shares" className="text" type="number" min={1} max={room} value={buyShares}
                onChange={(e) => setBuyShares(Math.floor(Number(e.target.value)))} onKeyDown={stopKeys} />
              <button type="button" aria-label="Einen Anteil mehr" onClick={() => setBuyShares((n) => Math.min(room, n + 1))}>+</button>
            </div>
            <p className="mp-label">Zahlung per Lastschrift</p>
            <div className="mp-rates">
              {Array.from({ length: INSTALLMENTS_MAX }, (_, i) => i + 1).map((n) => (
                <button key={n} type="button" className={`ep-chip ${rates === n ? 'selected' : ''}`} onClick={() => setRates(n)}>
                  {n === 1 ? 'Auf einmal' : `${n} Raten`}
                </button>
              ))}
            </div>
            {buyOk ? (
              <div className="mp-preview">
                <div><span>Einlage</span><b>{eur(total)}</b></div>
                <div>
                  <span>Lastschrift</span>
                  <b>{rates === 1 ? `am ${day(dates[0])}` : `${rates} × ${eur(Math.floor(total / rates))}${total % rates ? '+' : ''} ab ${day(dates[0])}`}</b>
                </div>
                <div><span>Wärmerabatt</span><b>{num(discount.pct)} % → {num(after.pct)} %</b></div>
                <p>
                  {after.perYear > discount.perYear
                    ? `${rates > 1 ? 'Raten alle drei Monate. ' : ''}Etwa ${eur(after.perYear - discount.perYear)} mehr Rabatt pro Jahr, ${eur(after.total - discount.total)} über ${DISCOUNT_YEARS} Jahre (bei ${num(demand)} kWh, heutiger Preis).`
                    : 'Höchstrabatt schon erreicht. Weitere Anteile erhöhen Ihr Eigentum am Netz, nicht den Rabatt.'}
                </p>
              </div>
            ) : (
              <p className="mp-error">{room < 1 ? 'Sie haben die höchste Einlage pro Haushalt erreicht.' : `Bitte zwischen 1 und ${room} Anteilen wählen.`}</p>
            )}
            <button type="button" className="ep-btn primary" style={{ width: '100%' }} disabled={!buyOk} onClick={buy}>
              Anteile verbindlich zeichnen
            </button>
            <p className="mp-note" style={{ marginTop: 10 }}>Rabatt-Regel: Vorschlag des Teams, noch nicht mit dem Betreiber abgestimmt.</p>
          </div>
        </div>
      )}

      {tab === 'werben' && (
        <div className="mp-grid even" key="werben">
          <div className="mp-stack">
            <div className="ep-card">
              <h2>Warum einladen?</h2>
              <p className="mp-note">
                Gebaut wird erst, wenn {pct(THRESHOLD)} der Haushalte im Ausbaugebiet zusagen. Jede Zusage zählt für das Gebiet der Eingeladenen.
              </p>
              {referralAreas.map((a) => <AreaBar key={a.id} area={a} extra={extraPledges(a)} />)}
            </div>
            <form className="ep-card" onSubmit={invite} autoComplete="off">
              <h2>Nachbarn einladen</h2>
              <label className="field" htmlFor="mp-ref-name">Name</label>
              <input id="mp-ref-name" className="text" value={refName} onChange={(e) => setRefName(e.target.value)} onKeyDown={stopKeys} placeholder="z. B. Familie Maier" />
              <div className="mp-addr">
                <div>
                  <label className="field" htmlFor="mp-ref-street">Straße</label>
                  <input id="mp-ref-street" className="text" list="mp-streets" value={refStreet} onChange={(e) => setRefStreet(e.target.value)} onKeyDown={stopKeys} />
                </div>
                <div>
                  <label className="field" htmlFor="mp-ref-house">Nr.</label>
                  <input id="mp-ref-house" className="text" value={refHouse} onChange={(e) => setRefHouse(e.target.value)} onKeyDown={stopKeys} />
                </div>
              </div>
              <datalist id="mp-streets">{STREETS.map((s) => <option key={s.id} value={s.name} />)}</datalist>
              <button type="submit" className="ep-btn primary" style={{ marginTop: 12 }}>Einladung vormerken</button>
              {refError && <p className="mp-error" role="alert">{refError}</p>}
            </form>
            <div className="ep-card">
              <h2>Ihr Einladungslink</h2>
              <div className="mp-link">
                <code>{inviteLink}</code>
                <button type="button" className="ep-btn ghost small" onClick={copyLink}>Kopieren</button>
              </div>
            </div>
          </div>
          <div className="ep-card">
            <h2>Ihre Einladungen</h2>
            <ul className="mp-referrals">
              {referrals.map((r, i) => ({ r, i })).reverse().map(({ r, i }) => {
                const st = REF_STATUS[r.status];
                return (
                  <li key={i}>
                    <div className="mp-ref-head">
                      <b>{r.name}</b>
                      <span className={`mp-chip ${st.cls}`}>{st.label}</span>
                    </div>
                    <small>{r.strasse} {r.hausnummer} · eingeladen am {day(r.datum)}</small>
                    <ol className="mp-ref-steps">
                      {['Eingeladen', 'Zugesagt', 'Mitglied'].map((label, k) => <li key={label} className={k < st.step ? 'done' : ''}>{label}</li>)}
                    </ol>
                    {r.status === 'eingeladen' && (
                      <button type="button" className="mp-simulate" onClick={() => simulatePledge(i)}>Zusage simulieren (Demo)</button>
                    )}
                  </li>
                );
              })}
            </ul>
            {onCheckAddress && (
              <p className="mp-note" style={{ marginTop: 12 }}>
                Eingeladene prüfen ihre Adresse über den Link.{' '}
                <button type="button" className="mp-inline" onClick={onCheckAddress}>So sieht das aus →</button>
              </p>
            )}
          </div>
        </div>
      )}

      {tab === 'stoerung' && (
        <StoerungMelden heating={DEMO_MEMBER.heizung} tickets={tickets} onSubmit={reportProblem} onAdvance={advanceTicket} />
      )}

      {toast && <div className="mp-toast" role="status">{toast}</div>}
    </div>
  );
}
