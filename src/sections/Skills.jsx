const CATEGORIES = [
  {
    label: 'Languages',
    color: 'var(--accent)',
    bg: 'var(--accent-light)',
    skills: ['C', 'C++', 'Java', 'TypeScript', 'SQL', 'Kotlin', 'Go'],
  },
  {
    label: 'Frontend',
    color: '#0891B2',
    bg: '#ECFEFF',
    skills: ['React', 'Next.js', 'Three.js', 'Tailwind CSS', 'Vite', 'Framer Motion'],
  },
  {
    label: 'Backend',
    color: 'var(--warm)',
    bg: 'var(--warm-light)',
    skills: ['Fastify', 'Node.js', 'Hono', 'REST', 'gRPC', 'WebSockets', 'BullMQ'],
  },
  {
    label: 'AI & ML',
    color: '#9333EA',
    bg: '#F5F3FF',
    skills: ['PyTorch', 'Transformers', 'RAG Pipelines', 'LLM Orchestration', 'pgvector', 'Embeddings', 'Agentic Systems'],
  },
  {
    label: 'Security',
    color: '#DC2626',
    bg: '#FEF2F2',
    skills: ['Cryptography', 'CTF', 'Reverse Engineering', 'Network Security', 'TLS Fingerprinting', 'Secure Systems'],
  },
  {
    label: 'Infrastructure',
    color: '#15803D',
    bg: 'var(--green-light)',
    skills: ['Docker', 'GitHub Actions', 'Vercel', 'Render', 'Cloudflare Workers'],
  },
];

export default function Skills() {
  return (
    <section style={{ padding: 'clamp(48px, 7vw, 80px) clamp(20px, 6vw, 80px)', borderTop: '1px solid var(--border)' }}>
      <div className="reveal mb-10">
        <p className="section-label mb-2">Skills</p>
        <h2 className="font-serif" style={{ fontSize: 'clamp(28px, 4vw, 44px)', lineHeight: 1.15, letterSpacing: '-0.01em' }}>
          What I work with
        </h2>
      </div>

      <div className="skills-grid">
        {CATEGORIES.map((cat, ci) => (
          <div
            key={cat.label}
            className={`bento-card reveal reveal-delay-${(ci % 4) + 1}`}
            style={{ padding: '20px 22px' }}
          >
            <div className="flex items-center gap-2 mb-4">
              <span style={{
                width: 8, height: 8, borderRadius: '50%',
                background: cat.color, flexShrink: 0,
                boxShadow: `0 0 0 3px ${cat.color}22`,
              }}/>
              <span style={{ fontWeight: 700, fontSize: 12, color: cat.color, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                {cat.label}
              </span>
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
              {cat.skills.map(s => (
                <span key={s} style={{
                  padding: '4px 10px',
                  borderRadius: 20,
                  fontSize: 12,
                  fontWeight: 500,
                  background: cat.bg,
                  color: cat.color,
                  border: `1px solid ${cat.color}25`,
                }}>
                  {s}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
      <style>{`
        .skills-grid {
          display: grid;
          gap: 16px;
          grid-template-columns: repeat(6, 1fr);
        }
        @media (max-width: 1200px) {
          .skills-grid { grid-template-columns: repeat(3, 1fr); }
        }
        @media (max-width: 768px) {
          .skills-grid { grid-template-columns: repeat(2, 1fr); }
        }
        @media (max-width: 480px) {
          .skills-grid { grid-template-columns: 1fr; }
        }
      `}</style>
    </section>
  );
}
