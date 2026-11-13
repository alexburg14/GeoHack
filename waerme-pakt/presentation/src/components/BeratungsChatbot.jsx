import React, { useState } from 'react';

const QUICK_REPLIES = [
  'Wie hoch ist meine Förderung?',
  'Wann startet der Ausbau?',
  'Fernwärme vs. Wärmepumpe?',
  'Rückruf anfordern',
];

function getBotReply(userText) {
  const lower = userText.toLowerCase();
  if (lower.includes('förder') || lower.includes('zuschuss') || lower.includes('geld')) {
    return 'Über die BEG-Förderung erhalten Sie aktuell bis zu 70 % Zuschuss auf den Fernwärme-Hausanschluss (Grundförderung + Geschwindigkeits- & Einkommensbonus).';
  }
  if (lower.includes('ausbau') || lower.includes('wann') || lower.includes('straße') || lower.includes('strasse')) {
    return 'In geplanten Straßen wie der Sonnenallee startet der Tiefbau voraussichtlich in Q2 2027. Unter „Netzkarte & Ersparnis“ können Sie Ihre Straße direkt prüfen.';
  }
  if (lower.includes('wärmepumpe') || lower.includes('vergleich')) {
    return 'Im Altbau oder Mehrfamilienhaus ist Fernwärme oft günstiger und platzsparender, da kein Außengerät und meist kein Heizkörpertausch nötig sind.';
  }
  if (lower.includes('rückruf') || lower.includes('termin') || lower.includes('kontakt')) {
    return 'Gerne! Unser Energie-Team meldet sich innerhalb von 24 Stunden kostenlos und unverbindlich bei Ihnen.';
  }
  return 'Vielen Dank für Ihre Frage! Für eine genaue Einschätzung Ihres Gebäudes schließen Sie gerne den 4-Schritte-Check oben ab oder fordern Sie einen kostenlosen Rückruf an.';
}

export default function BeratungsChatbot() {
  const [messages, setMessages] = useState([
    {
      sender: 'bot',
      text: 'Hallo! Ich bin Ihr EnergiePlus-Assistent. Brauchen Sie noch weitere Hilfe?',
    },
  ]);
  const [input, setInput] = useState('');

  const sendMessage = (textToSend) => {
    const cleaned = (textToSend ?? input).trim();
    if (!cleaned) return;
    const reply = getBotReply(cleaned);
    setMessages((prev) => [
      ...prev,
      { sender: 'user', text: cleaned },
      { sender: 'bot', text: reply },
    ]);
    setInput('');
  };

  return (
    <div
      style={{
        marginTop: '20px',
        backgroundColor: '#ffffff',
        border: '1px solid #cfc2b1',
        borderRadius: '16px',
        overflow: 'hidden',
        boxShadow: '0 6px 20px rgba(34, 28, 24, 0.06)',
      }}
    >
      {/* Chat Header */}
      <div
        style={{
          backgroundColor: '#221c18',
          color: '#ffffff',
          padding: '10px 16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '9px' }}>
          <span
            style={{
              width: '26px',
              height: '26px',
              borderRadius: '50%',
              backgroundColor: '#e8763a',
              color: '#221c18',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '14px',
            }}
          >
            💬
          </span>
          <div>
            <div style={{ fontSize: '13.5px', fontWeight: 700 }}>EnergiePlus Beratungs-Chat</div>
            <div style={{ fontSize: '11px', color: '#f2c3a6' }}>● Online • Sofortige Antworten</div>
          </div>
        </div>
        <span style={{ fontSize: '11px', color: '#cfc2b1' }}>KI-Assistent</span>
      </div>

      {/* Messages List */}
      <div
        style={{
          padding: '14px 16px',
          backgroundColor: '#f6f1ea',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
          maxHeight: '185px',
          overflowY: 'auto',
        }}
      >
        {messages.map((msg, idx) => {
          const isBot = msg.sender === 'bot';
          return (
            <div
              key={idx}
              style={{
                alignSelf: isBot ? 'flex-start' : 'flex-end',
                maxWidth: '80%',
                backgroundColor: isBot ? '#ffffff' : '#221c18',
                color: isBot ? '#221c18' : '#ffffff',
                border: isBot ? '1px solid #dcd0c1' : 'none',
                borderRadius: isBot ? '12px 12px 12px 4px' : '12px 12px 4px 12px',
                padding: '8px 12px',
                fontSize: '13px',
                lineHeight: 1.4,
              }}
            >
              {msg.text}
            </div>
          );
        })}
      </div>

      {/* Quick Reply Chips */}
      <div
        style={{
          padding: '8px 16px 0',
          backgroundColor: '#ffffff',
          display: 'flex',
          flexWrap: 'wrap',
          gap: '6px',
        }}
      >
        {QUICK_REPLIES.map((q) => (
          <button
            key={q}
            type="button"
            onClick={() => sendMessage(q)}
            style={{
              border: '1px solid #cfc2b1',
              backgroundColor: '#f6f1ea',
              color: '#221c18',
              borderRadius: '999px',
              padding: '4px 10px',
              fontSize: '11.5px',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            {q}
          </button>
        ))}
      </div>

      {/* Chat Input */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          sendMessage(input);
        }}
        style={{
          padding: '10px 16px 12px',
          backgroundColor: '#ffffff',
          display: 'flex',
          gap: '8px',
        }}
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.stopPropagation()}
          placeholder="Frage stellen (z. B. zu Förderung, Kosten, Ausbau)..."
          aria-label="Chat-Nachricht"
          style={{
            flex: 1,
            padding: '8px 12px',
            borderRadius: '8px',
            border: '1px solid #cfc2b1',
            fontSize: '13px',
            outline: 'none',
          }}
        />
        <button
          type="submit"
          style={{
            border: 'none',
            borderRadius: '8px',
            backgroundColor: '#e8763a',
            color: '#221c18',
            padding: '8px 14px',
            fontSize: '13px',
            fontWeight: 700,
            cursor: 'pointer',
          }}
        >
          Senden
        </button>
      </form>
    </div>
  );
}
