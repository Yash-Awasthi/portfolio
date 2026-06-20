import { useState } from 'react';

const EVENTS = [
  {
    year: '2024',
    title: 'Joined NIT Raipur',
    sub: 'B.Tech CSE · 2024–2028',
    desc: 'Placed in the top percentile from the outset. Focused on algorithms, systems programming, and competitive problem solving.',
    more: '500+ problems solved across LeetCode, CodeChef (3-star, max rating 1626) and Codeforces. Built strong foundations in algorithms, operating systems, computer networks, and compilers within the first year.',
    color: '#15803D', bg: 'var(--green-light)',
  },
  {
    year: 'May – Jul 2025',
    title: 'Research Internship',
    sub: 'Dept. of Physics, NIT Raipur · Supervisor: Prof. Janapati',
    desc: 'Replicated MIT Media Lab\'s TARF approach — a real-time Python DSP pipeline for underwater-to-air speech transmission.',
    more: 'Achieved end-to-end latency under 200 ms and an estimated SNR improvement of 8–12 dB over baseline. Implemented spectral subtraction, band-pass filtering (NumPy/SciPy), and cross-modal signal alignment. Delivered a working prototype within eight weeks.',
    color: '#0891B2', bg: '#ECFEFF',
  },
  {
    year: 'Mar 2026',
    title: 'FinScrape',
    sub: 'AI Financial News Intelligence Engine',
    desc: 'Aggregated 11 financial sources (Bloomberg, Reuters, FT) using TLS fingerprinting to bypass anti-bot systems at a >95% success rate.',
    more: 'Hybrid AI + keyword-scoring pipeline with a 200+ keyword lexicon. Real-time React dashboard with WebSocket streaming, Workers AI analysis, and Telegram alerts with sub-1s latency. Fully deployed and operational.',
    color: '#D97706', bg: '#FEF3E6',
    tag: 'Live',
  },
  {
    year: 'May 2026',
    title: 'NEXUS',
    sub: 'Multi-Agent AI Orchestration Platform',
    desc: 'A 107-package TypeScript pnpm monorepo with 15 LLM provider drivers, multi-agent council deliberation, and graph-BFS long-term memory.',
    more: 'Drivers stream native SSE/NDJSON with no buffering; 3-category failover classifier covers 30+ error patterns. pgvector memory with IVFFlat ANN indexing and BM25+RRF hybrid search. Sandboxed code execution across 8 languages via Piston API. API deployed on Render, UI on Vercel.',
    color: 'var(--accent)', bg: 'var(--accent-light)',
    github: 'https://github.com/Yash-Awasthi/Nexus',
    live: 'https://nexus.example.com',
  },
  {
    year: '2026',
    title: 'Aura',
    sub: 'Gesture-Authenticated Offline Contact Exchange',
    desc: 'Android application with no server dependency and no account requirement. Cryptographic key exchange over Bluetooth and NFC.',
    more: 'Gesture-based authentication using device motion sensors. ML Kit on-device signature recognition. Operates fully offline — no internet connection required.',
    color: '#C026D3', bg: '#FDF4FF',
    github: 'https://github.com/Yash-Awasthi/Aura',
  },
];

export default function Journey() {
  const [expanded, setExpanded] = useState(null);

  return (
    <section style={{ padding: 'clamp(48px, 8vw, 96px) clamp(20px, 6vw, 80px)' }}>
      <div className="reveal mb-14">
        <p className="section-label mb-2">Journey</p>
        <h2 className="font-serif" style={{ fontSize: 'clamp(32px, 5vw, 52px)', lineHeight: 1.15, letterSpacing: '-0.01em' }}>
          The career timeline
        </h2>
      </div>

      <div style={{ maxWidth: 780, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 14 }}>
        {EVENTS.map((ev, i) => (
          <div
            key={ev.title}
            className={`bento-card reveal reveal-delay-${(i % 4) + 1}`}
            style={{ padding: '18px 22px', borderLeft: `3px solid ${ev.color}` }}
          >
            {/* Header row */}
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, flexWrap: 'wrap', marginBottom: 6 }}>
              <span style={{
                width: 10, height: 10, borderRadius: '50%',
                background: ev.color, flexShrink: 0, marginTop: 5,
                boxShadow: `0 0 0 3px ${ev.color}22`,
              }}/>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  <p style={{ fontWeight: 700, fontSize: 15 }}>{ev.title}</p>

                  {ev.github && (
                    <a href={ev.github} target="_blank" rel="noopener noreferrer"
                       style={{ color: 'var(--text-muted)', lineHeight: 0 }} aria-label="GitHub">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z"/>
                      </svg>
                    </a>
                  )}

                  {ev.live && (
                    <a href={ev.live} target="_blank" rel="noopener noreferrer"
                       style={{ color: ev.color, lineHeight: 0 }} aria-label="Live">
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
                        <polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>
                      </svg>
                    </a>
                  )}

                  {ev.tag && (
                    <span style={{ padding: '2px 8px', borderRadius: 20, fontSize: 11, fontWeight: 600,
                                   background: ev.bg, color: ev.color, border: `1px solid ${ev.color}30` }}>
                      {ev.tag}
                    </span>
                  )}
                </div>
                <p style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: '"JetBrains Mono"', marginTop: 2 }}>
                  {ev.sub}
                </p>
              </div>

              <span style={{ fontSize: 11, fontWeight: 600, color: ev.color,
                             fontFamily: '"JetBrains Mono"', whiteSpace: 'nowrap', marginLeft: 'auto' }}>
                {ev.year}
              </span>
            </div>

            <p style={{ color: 'var(--text-muted)', fontSize: 13.5, lineHeight: 1.65, marginLeft: 20 }}>
              {ev.desc}
            </p>

            {expanded === i && (
              <p style={{ color: 'var(--text-muted)', fontSize: 13, lineHeight: 1.7,
                          marginLeft: 20, marginTop: 10, paddingTop: 10, borderTop: '1px solid var(--border)' }}>
                {ev.more}
              </p>
            )}

            <button
              onClick={() => setExpanded(expanded === i ? null : i)}
              style={{ marginLeft: 20, marginTop: 8, background: 'none', border: 'none', padding: 0,
                       fontSize: 12, fontWeight: 600, color: ev.color,
                       display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer' }}
            >
              {expanded === i ? 'Show less ↑' : 'View more ↓'}
            </button>
          </div>
        ))}
      </div>
    </section>
  );
}
