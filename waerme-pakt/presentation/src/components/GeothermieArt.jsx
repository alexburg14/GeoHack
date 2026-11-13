import React, { useId } from 'react';

// Houses on the street, connected to the geothermal doublet below (title slide + landing hero).
export default function GeothermieArt({ className, style }) {
  const houses = [69, 175, 281, 387];
  // unique gradient ids: the art appears on the title slide and on the landing hero
  const uid = useId().replace(/:/g, '');
  const earth = `earth-${uid}`;
  const glow = `glow-${uid}`;
  return (
    <svg className={className} style={style} viewBox="0 0 486 819" preserveAspectRatio="xMidYMid slice">
      <defs>
        <linearGradient id={earth} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#3a2e27" />
          <stop offset="0.55" stopColor="#5a3423" />
          <stop offset="1" stopColor="#b8481b" />
        </linearGradient>
        <radialGradient id={glow} cx="0.5" cy="1" r="0.6">
          <stop offset="0" stopColor="#f0a060" stopOpacity="0.9" />
          <stop offset="1" stopColor="#f0a060" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect x="0" y="455" width="486" height="364" fill={`url(#${earth})`} />
      <ellipse cx="243" cy="819" rx="300" ry="130" fill={`url(#${glow})`} />
      {[545, 625, 695].map((y) => (
        <path key={y} d={`M0 ${y} Q243 ${y - 12} 486 ${y + 4}`} stroke="#000" strokeOpacity="0.18" fill="none" />
      ))}
      <line x1="0" y1="455" x2="486" y2="455" stroke="#e9e1d8" strokeWidth="2" />
      {houses.map((x, i) => (
        <g key={x}>
          <path d={`M${x - 38} 404 L${x} 367 L${x + 38} 404 Z`} fill="#4a3f38" />
          <rect x={x - 30} y="404" width="60" height="50" fill="#3a312c" />
          <rect
            x={x - 9}
            y="418"
            width="18"
            height="18"
            fill={i < 3 ? '#f2a65a' : 'none'}
            stroke={i < 3 ? 'none' : '#6a5d55'}
            strokeWidth="1.5"
          />
          <line
            x1={x}
            y1="456"
            x2={x}
            y2="485"
            stroke={i < 3 ? '#e8763a' : '#8a7a70'}
            strokeWidth="3.5"
            strokeDasharray={i < 3 ? 'none' : '4 4'}
          />
        </g>
      ))}
      <line x1="69" y1="485" x2="387" y2="485" stroke="#e8763a" strokeWidth="4" strokeLinecap="round" />
      <polyline points="228,485 228,652 190,765" stroke="#e8763a" strokeWidth="4" fill="none" strokeLinecap="round" />
      <polyline points="258,485 258,652 304,765" stroke="#7aaed6" strokeWidth="4" fill="none" strokeLinecap="round" />
    </svg>
  );
}
