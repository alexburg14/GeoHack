"use strict";

const $ = (sel, el = document) => el.querySelector(sel);
const $$ = (sel, el = document) => [...el.querySelectorAll(sel)];
const eur = (n) => new Intl.NumberFormat("de-DE", { maximumFractionDigits: 0 }).format(n) + " €";
const num = (n, d = 0) => new Intl.NumberFormat("de-DE", { maximumFractionDigits: d, minimumFractionDigits: d }).format(n);
const pct = (q) => Math.round(q * 100) + " %";
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

const PHASE_COLORS = { 1: "#BF4416", 2: "#E8763A", 3: "#A3968A" };
const OPTION_LABELS = { fernwaerme: "Geothermie-Fernwärme", waermepumpe: "Wärmepumpe", bestand: "Weiter wie bisher" };
const OPTION_COLORS = { fernwaerme: "#BF4416", waermepumpe: "#2F6F8F", bestand: "#7A6E65" };
const HUBER = { baujahr: 1985, heizung: "gas", heizungsalter: 17, wohnflaeche: 140, personen: 4, sanierung: "teilsaniert" };

const state = {
  streets: [], ranking: [], schwelle: 0.65, config: null, kiAktiv: false,
  check: null, inputs: null, comparison: null, stakeEur: 0, pledged: false, chat: [],
};

async function api(path, body) {
  const res = await fetch(path, body === undefined ? {} : {
    method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.fehler || "Etwas ist schiefgegangen.");
  return data;
}

function toast(text, ms = 4200) {
  const el = $("#toast");
  el.textContent = text;
  el.classList.remove("hidden");
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => el.classList.add("hidden"), ms);
}

/* ---------- Navigation ---------- */

const onEnter = {};
function go(step) {
  $$(".step-panel").forEach((p) => p.classList.toggle("active", p.id === step));
  $$(".steps button").forEach((b) => b.classList.toggle("active", b.dataset.step === step));
  window.scrollTo({ top: 0, behavior: "smooth" });
  onEnter[step]?.();
}
function markDone(step) { $(`.steps button[data-step="${step}"]`)?.classList.add("done"); }

/* ---------- Maps ---------- */

function quoteColor(q) {
  if (q >= state.schwelle) return "#1F5E4E";
  if (q >= 0.5) return "#4F8C7B";
  if (q >= 0.3) return "#8DB5A9";
  return "#C9D8D3";
}

function makeMap(id) {
  const map = L.map(id, { scrollWheelZoom: false }).setView([48.0655, 11.617], 14);
  L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19, attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
  }).addTo(map);
  return { map, layer: L.layerGroup().addTo(map), mode: "phase" };
}

const maps = {};

function drawStreets(m) {
  m.layer.clearLayers();
  const quotes = Object.fromEntries(state.ranking.map((r) => [r.strasse, r.quote]));
  const selected = state.check?.strasse;
  const bounds = [];
  for (const s of state.streets) {
    const isSel = s.name === selected;
    const style = m.mode === "phase"
      ? { color: PHASE_COLORS[s.phase], weight: isSel ? 10 : 6, opacity: 0.95, dashArray: s.phase === 3 ? "8 8" : null }
      : { color: quoteColor(quotes[s.name]), weight: isSel ? 10 : 7, opacity: 0.95 };
    if (isSel) L.geoJSON(s.geometry, { style: { color: "#221C18", weight: style.weight + 6, opacity: 0.85 } }).addTo(m.layer);
    const line = L.geoJSON(s.geometry, { style }).addTo(m.layer);
    const info = m.mode === "phase" ? `${s.label} · Anschluss ${s.expectedConnection}` : `${pct(quotes[s.name])} zugesagt`;
    line.bindTooltip(`<b>${esc(s.name)}</b><br>${esc(info)}`, { sticky: true });
    line.on("click", () => selectStreet(s.name));
    if (isSel) bounds.push(line.getBounds());
  }
  return bounds[0];
}

function renderLegend(el, mode) {
  el.innerHTML = mode === "phase"
    ? Object.entries({ 1: "Bauphase 1 · im Bau", 2: "Bauphase 2 · Zusagen sammeln", 3: "Bauphase 3 · in Planung" })
      .map(([p, t]) => `<span><i style="background:${PHASE_COLORS[p]}"></i>${t}</span>`).join("")
    : [["#1F5E4E", `ab ${pct(state.schwelle)} · Schwelle erreicht`], ["#4F8C7B", "50–64 %"], ["#8DB5A9", "30–49 %"], ["#C9D8D3", "unter 30 %"]]
      .map(([c, t]) => `<span><i style="background:${c}"></i>${t}</span>`).join("");
}

function refreshMaps(zoom = false) {
  for (const [key, m] of Object.entries(maps)) {
    const b = drawStreets(m);
    renderLegend($(key === "map" ? "#map-legend" : "#map2-legend"), m.mode);
    if (zoom && b) m.map.flyToBounds(b, { maxZoom: 16, duration: 0.8, padding: [40, 40] });
  }
}

function selectStreet(name) {
  $("#street-input").value = name;
  if (!$("#pruefen").classList.contains("active")) go("pruefen");
  $("#house-input").focus();
}

/* ---------- Step 1: address check ---------- */

function progressHTML(q, ok) {
  return `<div class="progress"><div class="fill${ok ? " ok" : ""}" style="width:${Math.min(100, q * 100)}%"></div>
    <div class="mark" style="left:${state.schwelle * 100}%" data-label="Schwelle ${pct(state.schwelle)}"></div></div>`;
}

function streetStatusText(c) {
  const base = `${c.zusagen} von ${c.haushalte} Haushalten haben zugesagt (${pct(c.quote)}).`;
  const rest = c.quote >= c.schwelle
    ? " Die Schwelle ist erreicht."
    : ` Noch ${c.fehlende_zusagen} ${c.fehlende_zusagen === 1 ? "Zusage" : "Zusagen"} bis zur Schwelle.`;
  return `${base}${rest} Platz ${c.rang} von ${c.rang_gesamt}.`;
}

function renderCheck() {
  const c = state.check;
  const el = $("#check-result");
  el.classList.remove("hidden");
  const fmtDate = (d) => new Date(d).toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" });
  el.innerHTML = `
    <span class="chip p${c.phase}">${esc(c.phase_label)} · ${esc(c.status)}</span>
    <h2>${esc(c.strasse)} ${esc(c.hausnummer)}</h2>
    <p class="meta">Ihr Anschluss ans Geothermie-Netz kommt voraussichtlich</p>
    <div class="big-date">${esc(c.anschluss)}</div>
    ${progressHTML(c.quote, c.quote >= c.schwelle)}
    <p class="progress-text">${esc(streetStatusText(c))}</p>
    <ul class="updates">${c.updates.map((u) => `<li><time datetime="${u.datum}">${fmtDate(u.datum)}</time>
      <span><b>${esc(u.titel)}</b>${esc(u.text)}</span></li>`).join("")}</ul>
    <div class="cta-row"><button class="btn primary" data-goto="rechnen">Weiter: Was kostet mich das?</button></div>`;
}

async function checkAddress(e) {
  e?.preventDefault();
  $("#address-error").textContent = "";
  try {
    const check = await api("/api/check", { strasse: $("#street-input").value.trim(), hausnummer: $("#house-input").value.trim() });
    if (state.check?.strasse !== check.strasse || state.check?.hausnummer !== check.hausnummer) state.pledged = false;
    state.check = check;
    renderCheck();
    refreshMaps(true);
    renderContext();
    markDone("pruefen");
  } catch (err) {
    $("#address-error").textContent = err.message;
  }
}

/* ---------- Step 2: cost comparison ---------- */

function readHouseForm() {
  const f = $("#house-form");
  return Object.fromEntries(["baujahr", "heizung", "heizungsalter", "wohnflaeche", "personen", "sanierung"].map((k) => [k, f.elements[k].value]));
}

function fillHouseForm(values) {
  const f = $("#house-form");
  for (const [k, v] of Object.entries(values)) f.elements[k].value = v;
}

async function runCompare(e) {
  e?.preventDefault();
  $("#house-error").textContent = "";
  if (!state.check) {
    $("#house-error").innerHTML = 'Bitte zuerst Ihre Adresse prüfen. <button class="link" type="button" data-goto="pruefen">Zu Schritt 1</button>';
    return;
  }
  try {
    const inputs = readHouseForm();
    state.comparison = await api("/api/compare", { strasse: state.check.strasse, inputs, beteiligung_eur: state.stakeEur });
    state.inputs = inputs;
    renderCompare();
    renderContext();
    updateStake();
    markDone("rechnen");
  } catch (err) {
    $("#house-error").textContent = err.message;
  }
}

let chart;
function renderCompare() {
  const r = state.comparison;
  const opts = r.optionen;
  const keys = ["fernwaerme", "waermepumpe", "bestand"];
  const cheapest = keys.reduce((a, b) => (opts[a].gesamt_eur <= opts[b].gesamt_eur ? a : b));
  const cleanest = keys.reduce((a, b) => (opts[a].co2_t <= opts[b].co2_t ? a : b));
  const fuel = state.inputs.heizung === "oel" ? "Öl" : "Gas";
  $("#compare-result").classList.remove("hidden");
  $("#demand-line").textContent = `Geschätzter Wärmebedarf: ${num(r.waermebedarf_kwh)} kWh pro Jahr · Zeitraum ${r.jahre[0]}–${r.jahre.at(-1)}`
    + (state.stakeEur ? ` · mit Beteiligung von ${eur(state.stakeEur)}` : "");
  $("#option-cards").innerHTML = keys.map((k) => {
    const o = opts[k];
    const running = (o.gesamt_eur - o.investition_eur) / r.jahre.length;
    const title = k === "bestand" ? `Weiter mit ${fuel}` : OPTION_LABELS[k];
    const extra = k === "fernwaerme"
      ? `<dt>Anschluss</dt><dd>${r.anschlussjahr}${o.jahre_bis_anschluss ? `, bis dahin ${fuel}` : ""}</dd>`
      : k === "bestand" && o.investition_eur ? "<dt>Kesseltausch</dt><dd>enthalten</dd>" : "";
    return `<div class="card option ${k}">
      <h3>${esc(title)}</h3>
      <div class="total">${eur(o.gesamt_eur)}</div>
      <small class="note">Gesamtkosten in 20 Jahren</small>
      <dl>
        <dt>Investition</dt><dd>${eur(o.investition_eur)}</dd>
        <dt>Laufend Ø pro Jahr</dt><dd>${eur(running)}</dd>
        <dt>CO₂ in 20 Jahren</dt><dd>${num(o.co2_t, 1)} t</dd>
        ${extra}
      </dl>
      <div class="badges">${k === cheapest ? '<span class="chip">Niedrigste Kosten</span>' : ""}${k === cleanest ? '<span class="chip ok">Wenigste CO₂</span>' : ""}</div>
    </div>`;
  }).join("");

  chart?.destroy();
  chart = new Chart($("#cost-chart"), {
    type: "line",
    data: {
      labels: r.jahre,
      datasets: keys.map((k) => ({
        label: k === "bestand" ? `Weiter mit ${fuel}` : OPTION_LABELS[k],
        data: opts[k].kumuliert_eur,
        borderColor: OPTION_COLORS[k], backgroundColor: OPTION_COLORS[k],
        borderWidth: k === "fernwaerme" ? 4 : 2.5, borderDash: k === "bestand" ? [6, 5] : [],
        pointRadius: 0, pointHoverRadius: 4, tension: 0.15,
      })),
    },
    options: {
      maintainAspectRatio: false, interaction: { mode: "index", intersect: false },
      plugins: {
        legend: { position: "bottom", labels: { usePointStyle: true, font: { family: "Inter" } } },
        tooltip: { callbacks: { label: (c) => `${c.dataset.label}: ${eur(c.parsed.y)}` } },
      },
      scales: {
        y: { ticks: { callback: (v) => num(v / 1000) + " Tsd. €" }, grid: { color: "#E6DCCF" } },
        x: { grid: { display: false }, ticks: { maxTicksLimit: 10 } },
      },
    },
  });
  renderAssumptions();
}

const GROUP_LABELS = {
  allgemein: "Allgemein", waermebedarf: "Wärmebedarf", bestand: "Bisherige Heizung (Gas/Öl)", waermepumpe: "Wärmepumpe",
  fernwaerme: "Geothermie-Fernwärme", co2: "CO₂", beteiligung: "Bürgerbeteiligung",
};

function fmtParam(p) {
  if (p.einheit === "") return p.wert < 1 ? pct(p.wert) : String(p.wert); // years and plain counts: no thousands separator
  if (["pro Jahr", "p.a."].includes(p.einheit)) return `${num(p.wert * 100, 1)} % ${p.einheit}`;
  return `${num(p.wert, p.wert % 1 ? 2 : 0)} ${p.einheit}`.trim();
}

function renderAssumptions() {
  const a = state.config;
  $("#assumptions-note").textContent = a.hinweis;
  const rows = [];
  for (const [group, params] of Object.entries(a)) {
    if (!GROUP_LABELS[group]) continue;
    rows.push(`<tr><th colspan="3">${GROUP_LABELS[group]}</th></tr>`);
    for (const p of Object.values(params)) {
      let value;
      if ("wert" in p) value = fmtParam(p);
      else if (p.stufen) value = p.stufen.map((s) => `${s.bis_baujahr === 9999 ? "danach" : "bis " + s.bis_baujahr}: ${num(s.wert, s.wert % 1 ? 1 : 0)}`).join(" · ");
      else if (p.werte) value = Object.entries(p.werte).map(([k, v]) => `${k} ${num(v, 2)}`).join(" · ");
      else if (p.punkte) value = Object.entries(p.punkte).map(([y, v]) => `${y}: ${v}`).join(" · ");
      else continue;
      rows.push(`<tr><td>${esc(p.label)}${p.quelle ? `<div class="src">Quelle: ${esc(p.quelle)}</div>` : ""}</td><td class="num">${esc(value)}</td></tr>`);
    }
  }
  $("#assumptions-table").innerHTML = `<div class="table-scroll"><table>${rows.join("")}</table></div>`;
}

/* ---------- Step 3: advisor ---------- */

function renderChatMode() {
  $("#chat-mode").textContent = state.kiAktiv ? "KI-Berater · antwortet nur mit Ihren Zahlen" : "Offline-Modus · Standardantworten ohne KI-Schlüssel";
}

function renderContext() {
  const c = state.check;
  const rows = [
    ["Adresse", c ? `${c.strasse} ${c.hausnummer}` : "noch nicht geprüft"],
    ["Anschluss", c ? `${c.anschluss} (${c.phase_label})` : "–"],
    ["Kostenvergleich", state.comparison ? `${eur(state.comparison.optionen.fernwaerme.gesamt_eur)} Fernwärme / 20 J.` : "noch nicht berechnet"],
    ["Beteiligung", state.stakeEur ? eur(state.stakeEur) : "keine"],
  ];
  $("#context-card").innerHTML = `<h2>Das weiß der Berater</h2><dl class="context-list">${rows.map(([k, v]) => `<dt>${k}</dt><dd>${esc(v)}</dd>`).join("")}</dl>`;
}

function renderChat() {
  const log = $("#chat-log");
  if (!state.chat.length) {
    log.innerHTML = `<div class="msg assistant">Grüß Gott! Ich beantworte Ihre Fragen zum Geothermie-Anschluss: Zeitplan, Kosten, Wartegarantie und Beteiligung.${state.check ? "" : " Prüfen Sie dafür am besten zuerst Ihre Adresse."}</div>`;
    return;
  }
  log.innerHTML = state.chat.map((m, i) => `<div class="msg ${m.role}${m.typing ? " typing" : ""}">${esc(m.content)}${
    m.ticket ? `<br><button class="btn primary" type="button" data-ticket="${i}">Störung jetzt melden</button>` : ""}</div>`).join("");
  log.scrollTop = log.scrollHeight;
}

async function sendChat(text) {
  text = text.trim();
  if (!text) return;
  if (!state.check) {
    state.chat.push({ role: "user", content: text }, { role: "assistant", content: "Dafür brauche ich zuerst Ihre Adresse. Bitte prüfen Sie sie in Schritt 1, dann kann ich mit Ihren Daten antworten." });
    renderChat();
    return;
  }
  state.chat.push({ role: "user", content: text });
  const typing = { role: "assistant", content: "Der Berater schreibt …", typing: true };
  state.chat.push(typing);
  renderChat();
  $("#chat-input").value = "";
  try {
    const history = state.chat.filter((m) => !m.typing && !m.local).map(({ role, content }) => ({ role, content }));
    const res = await api("/api/chat", {
      messages: history, strasse: state.check.strasse, hausnummer: state.check.hausnummer,
      inputs: state.inputs, beteiligung_eur: state.stakeEur || undefined,
    });
    Object.assign(typing, { content: res.text, typing: false, ticket: res.ticket });
  } catch (err) {
    Object.assign(typing, { content: `Entschuldigung, das hat nicht geklappt (${err.message}).`, typing: false, local: true });
  }
  renderChat();
  markDone("fragen");
}

/* ---------- Waiting guarantee: breakdown ticket ---------- */

function openTicket() {
  const inp = state.inputs || {};
  const lastUser = [...state.chat].reverse().find((m) => m.role === "user")?.content || "";
  $("#ticket-body").innerHTML = `
    <h2 id="ticket-title">Heizung kaputt? Störung melden</h2>
    <p class="note">Gilt für Haushalte mit Zusage: Sie erhalten eine Übergangsheizung bis zum Anschluss, ohne neuen Kessel.</p>
    <form id="ticket-form">
      <div class="row">
        <label style="flex:1">Heizungsart<select name="heizung"><option value="gas">Gas</option><option value="oel"${inp.heizung === "oel" ? " selected" : ""}>Öl</option></select></label>
        <label style="flex:1">Alter (Jahre)<input name="alter" type="number" min="0" max="60" value="${esc(inp.heizungsalter ?? "")}"></label>
      </div>
      <label>Was funktioniert nicht?<textarea name="problem" rows="3" required>${esc(/kaputt|defekt|ausgefallen|geht nicht/i.test(lastUser) && !lastUser.trim().endsWith("?") ? lastUser : "")}</textarea></label>
      <label>Wie dringend?<select name="dringend"><option>Heute, es ist kalt</option><option>In den nächsten Tagen</option><option>Nur zur Info</option></select></label>
      <label>Telefon für den Rückruf<input name="telefon" type="tel" required placeholder="089 …"></label>
      <p class="form-error" id="ticket-error" role="alert"></p>
      <button class="btn primary" type="submit">Meldung absenden</button>
    </form>`;
  $("#ticket-dialog").classList.remove("hidden");
  $("#ticket-form textarea").focus();
  $("#ticket-form").addEventListener("submit", submitTicket);
}

async function submitTicket(e) {
  e.preventDefault();
  const body = Object.fromEntries(new FormData(e.target));
  try {
    const res = await api("/api/ticket", { ...body, strasse: state.check?.strasse, hausnummer: state.check?.hausnummer });
    $("#ticket-body").innerHTML = `
      <span class="chip ok">Meldung eingegangen</span>
      <h2 id="ticket-title" style="margin-top:10px">Wir kümmern uns</h2>
      <div class="ticket-no">${esc(res.ticket)}</div>
      <p><b>Ihr Angebot:</b> ${esc(res.angebot)}</p>
      <p style="margin-top:8px">${esc(res.naechster_schritt)}</p>
      <div class="cta-row"><button class="btn primary" type="button" data-close>Fertig</button></div>`;
    state.chat.push({ role: "assistant", content: `Ihre Störungsmeldung ${res.ticket} ist eingegangen. ${res.naechster_schritt}`, local: true });
    renderChat();
  } catch (err) {
    $("#ticket-error").textContent = err.message;
  }
}

/* ---------- Step 4: pledge + ranking ---------- */

function renderMyStreet() {
  const c = state.check;
  const el = $("#my-street");
  if (!c) {
    el.innerHTML = `<h2>Ihre Straße</h2><p class="note">Prüfen Sie zuerst Ihre Adresse, dann können Sie zusagen.</p>
      <div class="cta-row"><button class="btn primary" data-goto="pruefen">Adresse prüfen</button></div>`;
    return;
  }
  const ok = c.quote >= c.schwelle;
  el.innerHTML = `
    <span class="chip p${c.phase}">${esc(c.phase_label)}</span>
    <h2 style="margin-top:8px">${esc(c.strasse)}</h2>
    <div class="pct${ok ? " ok" : ""}" id="my-pct">${pct(c.quote)}</div>
    <p class="note">der Haushalte haben zugesagt</p>
    ${progressHTML(c.quote, ok)}
    <p class="progress-text" id="my-status">${esc(streetStatusText(c))}</p>
    <div class="actions">
      <button class="btn primary big" id="pledge-btn" ${state.pledged ? "disabled" : ""}>${state.pledged ? "Sie sind dabei ✓" : "Ich bin dabei"}</button>
      <button class="btn ghost" id="invite-btn">Nachbarn einladen</button>
    </div>
    <p class="note" style="margin-top:10px">Mit Ihrer Zusage verzichten Sie bis zum Anschluss auf eine neue Gas- oder Ölheizung. Die Wartegarantie sichert Sie ab.</p>`;
}

function renderRanking(movedStreet) {
  const me = state.check?.strasse;
  $("#ranking").innerHTML = state.ranking.map((r) => `
    <li class="${r.strasse === me ? "me" : ""}${r.strasse === movedStreet ? " moved" : ""}">
      <span class="rank">${r.rang}.</span>
      <span class="name" title="${esc(r.strasse)}">${esc(r.strasse)}</span>
      <span class="bar"><span class="${r.schwelle_erreicht ? "ok" : ""}" style="width:${r.quote * 100}%"></span><i style="left:${state.schwelle * 100}%"></i></span>
      <span class="val">${pct(r.quote)}</span>
    </li>`).join("");
}

function countUp(el, from, to, ms = 1200) {
  const start = performance.now();
  const step = (now) => {
    const t = Math.min(1, (now - start) / ms);
    const eased = 1 - (1 - t) ** 3;
    el.textContent = Math.round((from + (to - from) * eased) * 100) + " %";
    if (t < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}

async function pledge() {
  const btn = $("#pledge-btn");
  btn.disabled = true;
  try {
    const res = await api("/api/pledge", { strasse: state.check.strasse, hausnummer: state.check.hausnummer });
    const before = res.vorher;
    state.check = res.nachher;
    state.pledged = true;
    state.ranking = (await api("/api/ranking")).ranking;
    renderMyStreet();
    // replay the change: start from the old value, then animate to the new one
    const fill = $("#my-street .progress .fill");
    fill.style.width = before.quote * 100 + "%";
    requestAnimationFrame(() => requestAnimationFrame(() => { fill.style.width = state.check.quote * 100 + "%"; }));
    countUp($("#my-pct"), before.quote, state.check.quote);
    renderRanking(state.check.strasse);
    refreshMaps();
    renderCheck();
    markDone("nachbarschaft");
    const rankMsg = before.rang !== state.check.rang ? ` Ihre Straße steigt von Platz ${before.rang} auf Platz ${state.check.rang}.` : "";
    toast(res.schwelle_ueberschritten
      ? `Geschafft! Die ${state.check.strasse} hat die Schwelle überschritten, der Abschnitt kann gebaut werden.${rankMsg}`
      : res.neu ? `Danke! Ihre Zusage zählt für die ganze Straße.${rankMsg}` : "Für diese Adresse liegt schon eine Zusage vor.", 6000);
  } catch (err) {
    toast(err.message);
    btn.disabled = false;
  }
}

async function invite() {
  const link = `${location.origin}/?strasse=${encodeURIComponent(state.check.strasse)}`;
  try { await navigator.clipboard.writeText(link); } catch { /* clipboard blocked: the link is still shown */ }
  await api("/api/refer", { strasse: state.check.strasse }).catch(() => {});
  toast(`Einladungslink kopiert: ${link}`);
}

/* ---------- Stake ---------- */

function stakeAmount() { return Number($("#stake-amount").value); }

function renderStakeInfo() {
  const b = state.config.beteiligung;
  $("#stake-side").innerHTML = `
    <h2>So funktioniert die Beteiligung</h2>
    <ul class="updates" style="border:0;padding:0;margin:0">
      <li><time>Zins</time><span><b>${num(b.zins.wert * 100, 1)} % pro Jahr, fest</b>über ${b.laufzeit_jahre.wert} Jahre Laufzeit</span></li>
      <li><time>Bonus</time><span><b>${num(b.waermepreis_rabatt_ct.wert, 1)} ct/kWh günstigere Wärme</b>ab ${eur(b.rabatt_ab_eur.wert)} Beteiligung</span></li>
      <li><time>Betrag</time><span><b>${eur(b.mindestbetrag_eur.wert)} bis ${eur(b.hoechstbetrag_eur.wert)}</b>pro Haushalt</span></li>
      <li><time>Wofür</time><span><b>Ausbau des Netzes in Unterhaching</b>Ihr Geld bleibt im Ort.</span></li>
    </ul>
    <p class="note" style="margin-top:14px">Demo: Konditionen sind Platzhalter, es findet keine echte Zahlung statt.</p>`;
}

async function updateStake() {
  const amount = stakeAmount();
  $("#stake-error").textContent = "";
  try {
    const r = await api("/api/stake", { betrag: amount, inputs: state.inputs });
    const bonus = r.waermepreis_bonus_eur_pro_jahr;
    $("#stake-result").innerHTML = [
      ["Zinsen pro Jahr", eur(r.zinsen_pro_jahr_eur)],
      [`Zinsen in ${r.laufzeit_jahre} Jahren`, eur(r.zinsen_gesamt_eur)],
      ["Wärmepreis-Bonus pro Jahr", bonus === null ? "nach Schritt 2" : eur(bonus)],
      ["Ihr Anteil am Netz", num(r.anteil_am_netz * 100, 4) + " %"],
    ].map(([k, v]) => `<div class="kpi"><small>${k}</small><b>${v}</b></div>`).join("");
    return r;
  } catch (err) {
    $("#stake-error").textContent = err.message;
  }
}

function stakeCheckout() {
  const amount = stakeAmount();
  $("#stake-side").innerHTML = `
    <h2>Beteiligung bestätigen</h2>
    <div class="pay-mock">
      <p><b>${eur(amount)}</b> Beteiligung am Wärmenetz Unterhaching</p>
      <p class="note">Demo: Hier würde die Zahlung (z. B. SEPA-Lastschrift) erfolgen. Es wird nichts abgebucht.</p>
    </div>
    <div class="cta-row"><button class="btn primary" id="stake-confirm">Zahlungspflichtig bestätigen (Demo)</button>
    <button class="btn ghost" id="stake-cancel">Abbrechen</button></div>`;
}

async function stakeConfirm() {
  state.stakeEur = stakeAmount();
  const r = await updateStake();
  if (!r) return;
  let newTotal = "";
  if (state.inputs && state.check) {
    state.comparison = await api("/api/compare", { strasse: state.check.strasse, inputs: state.inputs, beteiligung_eur: state.stakeEur });
    renderCompare();
    newTotal = `<p style="margin-top:12px">Ihr Kostenvergleich ist aktualisiert: Fernwärme jetzt <b>${eur(state.comparison.optionen.fernwaerme.gesamt_eur)}</b> in 20 Jahren.</p>`;
  }
  renderContext();
  $("#stake-side").innerHTML = `
    <span class="chip ok">Beteiligung gezeichnet (Demo)</span>
    <h2 style="margin-top:10px">Ihr Anteil am Netz</h2>
    <div class="kpis">
      <div class="kpi"><small>Ihr Anteil</small><b>${eur(r.betrag_eur)}</b></div>
      <div class="kpi"><small>Zinsen pro Jahr</small><b>${eur(r.zinsen_pro_jahr_eur)}</b></div>
      <div class="kpi"><small>Bonus pro Jahr</small><b>${r.waermepreis_bonus_eur_pro_jahr === null ? "–" : eur(r.waermepreis_bonus_eur_pro_jahr)}</b></div>
      <div class="kpi"><small>Laufzeit</small><b>${r.laufzeit_jahre} Jahre</b></div>
    </div>
    <p>Sie sind jetzt Miteigentümer des Wärmenetzes in Unterhaching.</p>${newTotal}`;
  markDone("beteiligung");
  toast("Danke! Ihre Beteiligung ist vorgemerkt (Demo).");
}

/* ---------- Operator ---------- */

async function renderOperator() {
  const d = await api("/api/betreiber");
  $("#operator").innerHTML = `
    <div class="op-kpis">
      <div class="kpi"><small>Zusagen gesamt</small><b>${num(d.zusagen)} / ${num(d.haushalte)}</b></div>
      <div class="kpi"><small>Quote gesamt</small><b>${pct(d.zusagen / d.haushalte)}</b></div>
      <div class="kpi"><small>Straßen über Schwelle</small><b>${d.strassen_ueber_schwelle} / ${d.strassen}</b></div>
      <div class="kpi"><small>Kurz vor der Schwelle</small><b>${d.kurz_vor_schwelle.length}</b></div>
    </div>
    <div class="grid-2">
      <div class="card"><h2>Straßen kurz vor der Schwelle</h2><div class="table-scroll"><table class="op-table">
        <tr><th>Straße</th><th>Phase</th><th>Quote</th><th>Fehlend</th><th>Einladungen</th></tr>
        ${d.kurz_vor_schwelle.map((r) => `<tr><td>${esc(r.strasse)}</td><td>${r.phase}</td><td class="num">${pct(r.quote)}</td><td class="num"><b>${r.fehlend}</b></td><td class="num">${r.einladungen}</td></tr>`).join("")}
      </table></div></div>
      <div class="card"><h2>Alte Heizungen in diesen Straßen</h2><div class="table-scroll"><table class="op-table">
        <tr><th>Adresse</th><th>Heizung</th><th>Alter</th><th>Quelle</th></tr>
        ${d.alte_heizungen.map((b) => `<tr><td>${esc(b.adresse)}</td><td>${b.heizung}</td><td class="num">${b.alter} J.</td><td>${esc(b.quelle)}</td></tr>`).join("")}
      </table></div>
      <p class="note" style="margin-top:10px">Demodaten. Echte Haushaltsdaten nur mit Einwilligung (DSGVO), z. B. über Schornsteinfeger oder den Online-Check.</p></div>
    </div>`;
}

/* ---------- Wiring ---------- */

document.addEventListener("click", (e) => {
  const t = e.target.closest("button");
  if (!t) return;
  if (t.dataset.step) go(t.dataset.step);
  else if (t.dataset.goto) go(t.dataset.goto);
  else if (t.dataset.layer) {
    $$(".toggle button").forEach((b) => b.classList.toggle("active", b === t));
    maps.map.mode = t.dataset.layer;
    refreshMaps();
  } else if ("ticket" in t.dataset || t.id === "open-ticket") openTicket();
  else if ("close" in t.dataset) $("#ticket-dialog").classList.add("hidden");
  else if (t.id === "pledge-btn") pledge();
  else if (t.id === "invite-btn") invite();
  else if (t.id === "stake-go") stakeCheckout();
  else if (t.id === "stake-confirm") stakeConfirm();
  else if (t.id === "stake-cancel") renderStakeInfo();
  else if (t.id === "fill-example") fillHouseForm(HUBER);
  else if (t.id === "reset-demo") resetDemo();
  else if (t.closest("#chat-chips")) sendChat(t.textContent);
});
document.addEventListener("keydown", (e) => { if (e.key === "Escape") $("#ticket-dialog").classList.add("hidden"); });
$("#ticket-dialog").addEventListener("click", (e) => { if (e.target.id === "ticket-dialog") e.target.classList.add("hidden"); });

$("#address-form").addEventListener("submit", checkAddress);
$("#house-form").addEventListener("submit", runCompare);
$("#chat-form").addEventListener("submit", (e) => { e.preventDefault(); sendChat($("#chat-input").value); });
$("#stake-range").addEventListener("input", (e) => { $("#stake-amount").value = e.target.value; updateStake(); });
$("#stake-amount").addEventListener("change", (e) => { $("#stake-range").value = e.target.value; updateStake(); });

onEnter.pruefen = () => setTimeout(() => maps.map.invalidateSize(), 50);
onEnter.fragen = () => { renderContext(); renderChat(); };
onEnter.nachbarschaft = async () => {
  if (!maps.map2) { maps.map2 = makeMap("map2"); maps.map2.mode = "quote"; }
  state.ranking = (await api("/api/ranking")).ranking;
  renderMyStreet();
  renderRanking();
  setTimeout(() => { maps.map2.map.invalidateSize(); refreshMaps(true); }, 50);
};
onEnter.beteiligung = () => updateStake();
onEnter.betreiber = () => renderOperator();

async function resetDemo() {
  await api("/api/reset", {});
  state.pledged = false;
  state.chat = [];
  state.stakeEur = 0;
  state.ranking = (await api("/api/ranking")).ranking;
  if (state.check) await checkAddress();
  renderStakeInfo();
  refreshMaps();
  toast("Demo zurückgesetzt.");
}

async function init() {
  const [cfg, streets] = await Promise.all([api("/api/config"), api("/api/streets")]);
  state.config = cfg.annahmen;
  state.kiAktiv = cfg.ki_aktiv;
  state.schwelle = streets.schwelle;
  state.streets = streets.strassen;
  state.ranking = streets.ranking;
  $("#street-list").innerHTML = state.streets.map((s) => `<option value="${esc(s.name)}">`).join("");
  maps.map = makeMap("map");
  refreshMaps();
  renderChatMode();
  renderContext();
  renderChat();
  renderStakeInfo();
  updateStake();
  const preset = new URLSearchParams(location.search).get("strasse");
  if (preset) $("#street-input").value = preset;
}

init().catch((err) => toast(`Die App konnte nicht geladen werden: ${err.message}`, 10000));
