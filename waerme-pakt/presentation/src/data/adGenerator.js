function capitalizeWords(text) {
  return text
    .trim()
    .split(/\s+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

const FERNWAERME_AD = {
  brand: 'Stadtwerke EnergiePlus',
  domain: 'www.fernwaerme-anschluss.example.de',
  headline: 'Fernwärme Anschluss – Jetzt umsteigen & Vorteile sichern',
  description:
    'Klimafreundlich, zuverlässig und wartungsarm heizen: Mit einem Fernwärme-Hausanschluss sparen Sie Platz im Keller, senken Ihren CO₂-Ausstoß und profitieren von planbaren Heizkosten.',
  promo: 'Vorteil: Bis zu 70 % staatliche Förderung möglich & kein eigener Heizkessel nötig',
  benefits: [
    'Platzsparend: Kein Heizkessel, kein Öltank, kein Schornsteinfeger',
    'Klimafreundlich: Hoher Anteil erneuerbarer Energien & Abwärme',
    'Wartungsarm & sicher: Hohe Versorgungssicherheit rund um die Uhr',
    'Zukunftssicher: Erfüllt gesetzliche Klimavorgaben (GEG) mühelos',
  ],
  sitelinks: [
    'Verfügbarkeit prüfen',
    'Alle Vorteile im Überblick',
    'Förderung berechnen',
    'Kostenlose Beratung',
  ],
  accent: '#0f766e',
  badgeEmoji: '🔥',
};

export function generateSearchResults(rawQuery) {
  const query = rawQuery.trim() || 'Fernwärme Anschluss';
  const titleQuery = capitalizeWords(query);
  const slug =
    query
      .toLowerCase()
      .replace(/[^a-z0-9äöüß]+/g, '-')
      .replace(/^-|-$/g, '') || 'fernwaerme';

  const organicResults = [
    {
      siteName: 'Wikipedia',
      url: `https://de.wikipedia.org/wiki/${encodeURIComponent(titleQuery.replace(/\s+/g, '_'))}`,
      title: `${titleQuery} — Überblick, Fakten & Hintergründe`,
      snippet: `Umfassende Informationen rund um ${query}: Funktionsweise, Aufbau, Anwendungsbereiche und wichtige Hinweise für Eigentümer und Haushalte.`,
    },
    {
      siteName: 'Verbraucherportal',
      url: `https://www.verbraucherportal.example.de/ratgeber/${slug}`,
      title: `${titleQuery}: Kosten, Voraussetzungen & Vergleich 2026`,
      snippet: `Unabhängiger Ratgeber zu ${query}. Erfahren Sie, welche Fördermöglichkeiten es gibt und worauf Sie bei der Planung achten sollten.`,
    },
    {
      siteName: 'Energie-Forum',
      url: `https://forum.example.de/thema/${slug}`,
      title: `Erfahrungen mit ${query} — Lohnt sich der Wechsel?`,
      snippet: `312 Antworten • „Seit wir angeschlossen sind, haben wir deutlich mehr Platz im Technikraum und müssen uns um keine Wartung mehr kümmern..."`,
    },
  ];

  return {
    query,
    resultCount: 'Ungefähr 4.820.000 Ergebnisse (0,34 Sekunden)',
    primaryAd: FERNWAERME_AD,
    organicResults,
  };
}
