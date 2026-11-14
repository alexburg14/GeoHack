import React, { useState } from 'react';
import { generateSearchResults } from '../data/adGenerator';
import AdLandingPage from './AdLandingPage';

const SUGGESTED_QUERIES = [
  'Fernwärme Anschluss',
  'Heizung modernisieren',
  'Klimafreundlich heizen',
  'Wärmepumpe Alternative',
];

function GoogleWordmark({ size = 'large' }) {
  const fontSize = size === 'large' ? '4.4rem' : '1.65rem';
  const letters = [
    { char: 'G', color: '#4285F4' },
    { char: 'o', color: '#EA4335' },
    { char: 'o', color: '#FBBC05' },
    { char: 'g', color: '#4285F4' },
    { char: 'l', color: '#34A853' },
    { char: 'e', color: '#EA4335' },
  ];

  return (
    <span
      style={{
        fontSize,
        fontWeight: 600,
        letterSpacing: '-0.03em',
        userSelect: 'none',
        lineHeight: 1,
        display: 'inline-flex',
        alignItems: 'baseline',
      }}
    >
      {letters.map((item, idx) => (
        <span key={idx} style={{ color: item.color }}>
          {item.char}
        </span>
      ))}
    </span>
  );
}

function SearchIcon({ color = '#9aa0a6', size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="7" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  );
}

function MicIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path d="M12 14a3 3 0 0 0 3-3V6a3 3 0 0 0-6 0v5a3 3 0 0 0 3 3Z" fill="#4285F4" />
      <path d="M17 11a5 5 0 0 1-10 0H5a7 7 0 0 0 6 6.92V21h2v-3.08A7 7 0 0 0 19 11h-2Z" fill="#34A853" />
    </svg>
  );
}

export default function FakeGoogleSlide() {
  const [inputValue, setInputValue] = useState('');
  const [searchData, setSearchData] = useState(null);
  const [showAnatomy, setShowAnatomy] = useState(false);
  const [activeAdPage, setActiveAdPage] = useState(null);

  const runSearch = (queryText) => {
    const cleaned = (queryText ?? inputValue).trim();
    if (!cleaned) return;
    setInputValue(cleaned);
    setSearchData(generateSearchResults(cleaned));
    setActiveAdPage(null);
  };

  const resetToHome = () => {
    setSearchData(null);
    setInputValue('');
    setShowAnatomy(false);
    setActiveAdPage(null);
  };

  const handleInputKeyDown = (e) => {
    // Prevent Spectacle from changing slides while typing in the search bar
    e.stopPropagation();
    if (e.key === 'Enter') {
      e.preventDefault();
      runSearch(inputValue);
    }
  };

  const triggerAdClick = (label) => {
    setActiveAdPage(label);
  };

  if (activeAdPage) {
    return (
      <AdLandingPage
        clickedFrom={activeAdPage}
        onBackToSearch={() => setActiveAdPage(null)}
      />
    );
  }

  // HOME VIEW (Fake Google Search Page)
  if (!searchData) {
    return (
      <div
        style={{
          width: '100%',
          height: '100%',
          backgroundColor: '#ffffff',
          color: '#202124',
          borderRadius: '14px',
          boxShadow: '0 20px 50px rgba(0, 0, 0, 0.25)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        {/* Fake Browser Top Bar */}
        <div
          style={{
            height: '38px',
            backgroundColor: '#f1f3f4',
            borderBottom: '1px solid #dadce0',
            display: 'flex',
            alignItems: 'center',
            padding: '0 14px',
            gap: '12px',
          }}
        >
          <div style={{ display: 'flex', gap: '7px' }}>
            <span style={{ width: 11, height: 11, borderRadius: '50%', background: '#ff5f56' }} />
            <span style={{ width: 11, height: 11, borderRadius: '50%', background: '#ffbd2e' }} />
            <span style={{ width: 11, height: 11, borderRadius: '50%', background: '#27c93f' }} />
          </div>
          <div
            style={{
              flex: 1,
              maxWidth: '460px',
              backgroundColor: '#ffffff',
              borderRadius: '999px',
              padding: '4px 14px',
              fontSize: '12px',
              color: '#5f6368',
              border: '1px solid #e0e0e0',
            }}
          >
            https://www.google.com
          </div>
          <div style={{ marginLeft: 'auto', fontSize: '12px', color: '#5f6368' }}>
            Interactive Demo • Type anything &amp; press Enter
          </div>
        </div>

        {/* Centered Google Home Content */}
        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '24px',
          }}
        >
          <div style={{ marginBottom: '26px' }}>
            <GoogleWordmark size="large" />
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              runSearch(inputValue);
            }}
            style={{
              width: '100%',
              maxWidth: '580px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
            }}
          >
            <div
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '11px 18px',
                borderRadius: '999px',
                border: '1px solid #dfe1e5',
                boxShadow: '0 2px 8px rgba(32, 33, 36, 0.08)',
                backgroundColor: '#fff',
              }}
            >
              <SearchIcon />
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleInputKeyDown}
                placeholder="Search Google or type a product..."
                aria-label="Search Google"
                autoFocus
                style={{
                  flex: 1,
                  border: 'none',
                  outline: 'none',
                  fontSize: '16px',
                  color: '#202124',
                  background: 'transparent',
                }}
              />
              {inputValue && (
                <button
                  type="button"
                  onClick={() => setInputValue('')}
                  style={{
                    border: 'none',
                    background: 'transparent',
                    color: '#70757a',
                    cursor: 'pointer',
                    fontSize: '18px',
                    lineHeight: 1,
                    padding: '0 4px',
                  }}
                  title="Clear"
                >
                  ×
                </button>
              )}
              <MicIcon />
            </div>

            <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
              <button
                type="submit"
                style={{
                  backgroundColor: '#f8f9fa',
                  border: '1px solid #f8f9fa',
                  borderRadius: '6px',
                  color: '#3c4043',
                  fontSize: '14px',
                  padding: '9px 18px',
                  cursor: 'pointer',
                  fontWeight: 500,
                }}
              >
                Google Search
              </button>
              <button
                type="button"
                onClick={() => {
                  const pick =
                    inputValue.trim() ||
                    SUGGESTED_QUERIES[Math.floor(Math.random() * SUGGESTED_QUERIES.length)];
                  runSearch(pick);
                }}
                style={{
                  backgroundColor: '#f8f9fa',
                  border: '1px solid #f8f9fa',
                  borderRadius: '6px',
                  color: '#3c4043',
                  fontSize: '14px',
                  padding: '9px 18px',
                  cursor: 'pointer',
                  fontWeight: 500,
                }}
              >
                I&apos;m Feeling Lucky
              </button>
            </div>
          </form>

          {/* Quick Suggestion Chips */}
          <div
            style={{
              marginTop: '30px',
              display: 'flex',
              alignItems: 'center',
              flexWrap: 'wrap',
              justifyContent: 'center',
              gap: '8px',
            }}
          >
            <span style={{ fontSize: '12px', color: '#70757a', marginRight: '4px' }}>
              Try searching:
            </span>
            {SUGGESTED_QUERIES.map((q) => (
              <button
                key={q}
                type="button"
                onClick={() => runSearch(q)}
                style={{
                  border: '1px solid #dadce0',
                  backgroundColor: '#f8f9fa',
                  color: '#1a73e8',
                  borderRadius: '999px',
                  padding: '5px 12px',
                  fontSize: '12px',
                  cursor: 'pointer',
                  fontWeight: 500,
                }}
              >
                {q}
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // RESULTS VIEW (SERP + Sponsored Advertisement)
  const { primaryAd, organicResults, resultCount, query } = searchData;

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        backgroundColor: '#ffffff',
        color: '#202124',
        borderRadius: '14px',
        boxShadow: '0 20px 50px rgba(0, 0, 0, 0.25)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      {/* Top Search Header */}
      <div
        className="gs-header"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '18px',
          padding: '14px 24px',
          borderBottom: '1px solid #ebebeb',
          backgroundColor: '#ffffff',
        }}
      >
        <button
          type="button"
          onClick={resetToHome}
          title="Back to Google Home"
          style={{
            border: 'none',
            background: 'transparent',
            cursor: 'pointer',
            padding: 0,
            display: 'flex',
            alignItems: 'center',
          }}
        >
          <GoogleWordmark size="small" />
        </button>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            runSearch(inputValue);
          }}
          className="gs-form"
          style={{ flex: 1, maxWidth: '520px' }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '8px 16px',
              borderRadius: '999px',
              border: '1px solid #dfe1e5',
              boxShadow: '0 1px 6px rgba(32, 33, 36, 0.1)',
            }}
          >
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleInputKeyDown}
              aria-label="Search query"
              style={{
                flex: 1,
                border: 'none',
                outline: 'none',
                fontSize: '14px',
                color: '#202124',
              }}
            />
            <button
              type="submit"
              style={{
                border: 'none',
                background: 'transparent',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                padding: 0,
              }}
              title="Search"
            >
              <SearchIcon color="#4285F4" size={17} />
            </button>
          </div>
        </form>

        <div className="gs-actions" style={{ marginLeft: 'auto', display: 'flex', gap: '8px' }}>
          <button
            type="button"
            className="gs-anatomy"
            onClick={() => setShowAnatomy((prev) => !prev)}
            style={{
              border: showAnatomy ? '1px solid #ea4335' : '1px solid #dadce0',
              backgroundColor: showAnatomy ? '#fce8e6' : '#ffffff',
              color: showAnatomy ? '#c5221f' : '#3c4043',
              borderRadius: '8px',
              padding: '7px 12px',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            {showAnatomy ? 'Hide Ad Anatomy' : 'Highlight Ad Anatomy'}
          </button>
          <button
            type="button"
            onClick={resetToHome}
            style={{
              border: '1px solid #dadce0',
              backgroundColor: '#f8f9fa',
              color: '#3c4043',
              borderRadius: '8px',
              padding: '7px 12px',
              fontSize: '12px',
              fontWeight: 500,
              cursor: 'pointer',
            }}
          >
            New Search
          </button>
        </div>
      </div>

      {/* Results Body */}
      <div
        className="animate-fade-up gs-results"
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '14px 28px 24px',
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1.65fr) minmax(240px, 0.9fr)',
          gap: '24px',
          alignItems: 'start',
        }}
      >
        {/* Left Column: Sponsored Search Ad + Organic Results */}
        <div>
          <div style={{ fontSize: '12px', color: '#70757a', marginBottom: '12px' }}>
            {resultCount} for <strong>&ldquo;{query}&rdquo;</strong>
          </div>

          {/* SPONSORED TEXT AD */}
          <div
            className={showAnatomy ? 'ad-anatomy-ring' : ''}
            style={{
              padding: '14px 16px',
              borderRadius: '12px',
              backgroundColor: '#f8fbff',
              border: '1px solid #d2e3fc',
              marginBottom: '18px',
              position: 'relative',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  color: '#202124',
                  backgroundColor: '#fef08a',
                  padding: '2px 7px',
                  borderRadius: '4px',
                  letterSpacing: '0.02em',
                }}
              >
                Sponsored
              </span>
              <span style={{ fontSize: '12px', color: '#4d5156' }}>
                {primaryAd.brand} • {primaryAd.domain}
              </span>
              {showAnatomy && (
                <span
                  style={{
                    marginLeft: 'auto',
                    fontSize: '11px',
                    fontWeight: 700,
                    color: '#c5221f',
                  }}
                >
                  ① Paid Top Placement
                </span>
              )}
            </div>

            <button
              type="button"
              onClick={() => triggerAdClick(primaryAd.headline)}
              style={{
                border: 'none',
                background: 'transparent',
                padding: 0,
                textAlign: 'left',
                fontSize: '19px',
                fontWeight: 500,
                color: '#1a0dab',
                cursor: 'pointer',
                lineHeight: 1.3,
                marginBottom: '5px',
              }}
            >
              {primaryAd.headline}
            </button>

            <p style={{ margin: '0 0 8px', fontSize: '13.5px', color: '#4d5156', lineHeight: 1.45 }}>
              {primaryAd.description}
            </p>

            <div
              style={{
                display: 'inline-block',
                fontSize: '12px',
                fontWeight: 600,
                color: '#137333',
                backgroundColor: '#e6f4ea',
                padding: '3px 9px',
                borderRadius: '6px',
                marginBottom: '10px',
              }}
            >
              🏷️ {primaryAd.promo}
            </div>

            {/* Sitelinks */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {primaryAd.sitelinks.map((link) => (
                <button
                  key={link}
                  type="button"
                  onClick={() => triggerAdClick(link)}
                  style={{
                    border: '1px solid #d2e3fc',
                    backgroundColor: '#ffffff',
                    color: '#1a73e8',
                    borderRadius: '999px',
                    padding: '4px 11px',
                    fontSize: '12px',
                    cursor: 'pointer',
                    fontWeight: 500,
                  }}
                >
                  {link} →
                </button>
              ))}
            </div>
          </div>

          {/* ORGANIC RESULTS */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {organicResults.map((item, idx) => (
              <div key={idx} style={{ padding: '2px 4px' }}>
                <div style={{ fontSize: '12px', color: '#4d5156', marginBottom: '2px' }}>
                  <strong>{item.siteName}</strong> • {item.url}
                </div>
                <div
                  style={{
                    fontSize: '17px',
                    color: '#1a0dab',
                    fontWeight: 500,
                    marginBottom: '3px',
                  }}
                >
                  {item.title}
                </div>
                <div style={{ fontSize: '13px', color: '#4d5156', lineHeight: 1.4 }}>
                  {item.snippet}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: Sponsored Fernwärme Benefits Card */}
        <div
          className={showAnatomy ? 'ad-anatomy-ring' : ''}
          style={{
            border: '1px solid #dadce0',
            borderRadius: '14px',
            overflow: 'hidden',
            backgroundColor: '#ffffff',
            boxShadow: '0 4px 14px rgba(0, 0, 0, 0.06)',
          }}
        >
          <div
            style={{
              background: `linear-gradient(135deg, ${primaryAd.accent}, #111827)`,
              color: '#ffffff',
              padding: '18px 16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div>
              <div
                style={{
                  fontSize: '10px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  opacity: 0.85,
                  marginBottom: '4px',
                }}
              >
                Gesponsert • {primaryAd.brand}
              </div>
              <div style={{ fontSize: '18px', fontWeight: 700 }}>Fernwärme Anschluss</div>
            </div>
            <div style={{ fontSize: '34px' }}>{primaryAd.badgeEmoji}</div>
          </div>

          <div style={{ padding: '14px 16px' }}>
            <div style={{ fontSize: '14px', fontWeight: 600, color: '#202124', marginBottom: '10px' }}>
              Ihre Vorteile auf einen Blick:
            </div>

            <ul
              style={{
                margin: '0 0 14px 0',
                padding: 0,
                listStyle: 'none',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
              }}
            >
              {primaryAd.benefits.map((benefit, idx) => (
                <li
                  key={idx}
                  style={{
                    fontSize: '12.5px',
                    color: '#3c4043',
                    lineHeight: 1.4,
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '7px',
                  }}
                >
                  <span style={{ color: '#0f766e', fontWeight: 700 }}>✓</span>
                  <span>{benefit}</span>
                </li>
              ))}
            </ul>

            <button
              type="button"
              onClick={() => triggerAdClick('Fernwärme Verfügbarkeit prüfen')}
              style={{
                width: '100%',
                border: 'none',
                borderRadius: '8px',
                backgroundColor: primaryAd.accent,
                color: '#ffffff',
                padding: '10px 14px',
                fontSize: '14px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Verfügbarkeit prüfen →
            </button>

            {showAnatomy && (
              <div
                style={{
                  marginTop: '10px',
                  fontSize: '11px',
                  color: '#c5221f',
                  fontWeight: 600,
                }}
              >
                ② Sponsored Info-Card mit konkreten Vorteilen &amp; CTA
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
