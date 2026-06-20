const PILLARS = [
  {
    icon: '🏆',
    label: 'Competitive Programming',
    detail: '500+ problems across LeetCode, Codeforces, and CodeChef (3-star, max rating 1626). Global Rank 113 in CodeChef Starters 213 Div3.',
    color: '#D97706',
    bg: '#FEF3E6',
  },
  {
    icon: '🔐',
    label: 'Cybersecurity',
    detail: 'Cryptography, reverse engineering, CTF challenges, network security, and secure systems design.',
    color: '#DC2626',
    bg: '#FEF2F2',
  },
  {
    icon: '🤖',
    label: 'AI & Machine Learning',
    detail: 'Multi-agent LLM orchestration, RAG pipelines, on-device ML, agentic systems, and real-time signal processing (DSP).',
    color: '#9333EA',
    bg: '#F5F3FF',
  },
  {
    icon: '⚙️',
    label: 'Systems & Engineering',
    detail: 'Full-stack development across backend APIs, databases, deployment pipelines, and real-time WebSocket systems.',
    color: '#0891B2',
    bg: '#ECFEFF',
  },
];

const LOOKING_AT = ['Fintech', 'Cybersecurity', 'AI and Automations', 'Blockchain'];

export default function About() {
  return (
    <section style={{ padding: 'clamp(48px, 8vw, 96px) clamp(20px, 6vw, 80px)' }}>

      <div className="reveal mb-12">
        <p className="section-label mb-2">About</p>
        <h2 className="font-serif" style={{ fontSize: 'clamp(32px, 5vw, 52px)', lineHeight: 1.15, letterSpacing: '-0.01em' }}>
          Who&apos;s behind the code
        </h2>
      </div>

      {/* Desktop: 2-column layout. Mobile: single column */}
      <div className="about-grid" style={{ display: 'grid', gap: 16 }}>

        {/* Left — Bio: height:100% so it stretches to match the right column */}
        <div className="bento-card reveal reveal-delay-1" style={{ padding: '28px 30px', height: '100%', boxSizing: 'border-box' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
            <div style={{ width: 56, height: 56, borderRadius: 16, flexShrink: 0,
                          background: 'linear-gradient(135deg, var(--accent-light), var(--warm-light))',
                          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26 }}>
              🧑‍💻
            </div>
            <div>
              <h3 style={{ fontWeight: 700, fontSize: 18, marginBottom: 2 }}>Yash Vaibhav Awasthi</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>NIT Raipur · B.Tech CSE · 2024–2028</p>
            </div>
          </div>

          <p style={{ color: 'var(--text-muted)', lineHeight: 1.75, fontSize: 14, marginBottom: 18 }}>
            Third-year Computer Science undergraduate at NIT Raipur, CPI 9.26. I work at the intersection
            of competitive programming, cybersecurity, and AI systems — and I build across that entire range
            rather than specialising in one lane.
          </p>

          <p style={{ color: 'var(--text-muted)', lineHeight: 1.75, fontSize: 14, marginBottom: 20 }}>
            My research internship in real-time signal processing introduced me to low-latency pipeline design.
            Since then I have shipped production-grade systems in TypeScript, Python, and React — from financial
            intelligence platforms to multi-agent LLM orchestration.
          </p>

          <div>
            <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase',
                        color: 'var(--text-muted)', marginBottom: 10 }}>Currently looking toward</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
              {LOOKING_AT.map(t => (
                <span key={t} style={{
                  padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 600,
                  background: 'var(--accent-light)', color: 'var(--accent)',
                  border: '1px solid var(--accent)25',
                }}>{t}</span>
              ))}
            </div>
          </div>
        </div>

        {/* Right — Pillars 2×2 + Education */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* 2x2 pillars */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            {PILLARS.map((p, i) => (
              <div key={p.label} className={`bento-card reveal reveal-delay-${i + 2}`} style={{ padding: '18px 20px' }}>
                <div style={{ fontSize: 22, marginBottom: 8 }}>{p.icon}</div>
                <p style={{ fontWeight: 700, fontSize: 12.5, color: p.color, marginBottom: 6, lineHeight: 1.3 }}>
                  {p.label}
                </p>
                <p style={{ color: 'var(--text-muted)', fontSize: 12, lineHeight: 1.6 }}>
                  {p.detail}
                </p>
              </div>
            ))}
          </div>

          {/* Education */}
          <div className="bento-card reveal reveal-delay-3" style={{ padding: '20px 22px' }}>
            <p className="section-label mb-3">Education</p>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
              <div style={{ width: 40, height: 40, borderRadius: 10, flexShrink: 0,
                            background: 'var(--warm-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>
                🎓
              </div>
              <div>
                <p style={{ fontWeight: 600, fontSize: 14 }}>B.Tech, Computer Science and Engineering</p>
                <p style={{ color: 'var(--text-muted)', fontSize: 12.5, marginTop: 3 }}>National Institute of Technology Raipur · 2024 – 2028</p>
                <p style={{ color: 'var(--text-muted)', fontSize: 12.5 }}>CPI: 9.26 / 10.0</p>
                <p style={{ color: 'var(--text-muted)', fontSize: 12.5, marginTop: 4 }}>Class Representative · Executive, ACE NIT Raipur</p>
              </div>
            </div>
          </div>

        </div>
      </div>

      <style>{`
        .about-grid {
          grid-template-columns: 1fr;
        }
        @media (min-width: 768px) {
          .about-grid {
            grid-template-columns: 1fr 1fr;
          }
        }
        @media (max-width: 480px) {
          .about-grid > div:last-child > div:first-child {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </section>
  );
}
