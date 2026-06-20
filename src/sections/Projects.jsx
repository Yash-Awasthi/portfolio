const PROJECTS = [
  {
    name: 'NEXUS',
    tagline: 'Multi-Agent AI Orchestration Platform',
    desc: '107-package TypeScript pnpm monorepo — 15 LLM provider drivers, multi-model council deliberation, pgvector memory with graph-BFS retrieval, polyglot code execution via Piston API.',
    tags: ['TypeScript', 'React', 'Fastify', 'PostgreSQL', 'pgvector', 'Docker', 'BullMQ'],
    github: 'https://github.com/Yash-Awasthi/Nexus',
    live: 'https://nexus-api-three-kappa.vercel.app',
    accent: '#4B60F8',
    bg: 'linear-gradient(135deg, #EEF0FF 0%, #E0E4FD 100%)',
    icon: '🤖',
    highlight: 'Featured',
  },
  {
    name: 'FinScrape',
    tagline: 'AI Financial News Intelligence Engine',
    desc: 'Autonomous pipeline scraping 11 financial sources (Bloomberg, Reuters, FT) with TLS fingerprinting at >95% success rate. Hybrid AI + keyword scoring, sub-second Telegram alerts.',
    tags: ['Python', 'TypeScript', 'Cloudflare Workers', 'WebSockets', 'Redis'],
    github: 'https://github.com/Yash-Awasthi/fin-scrape',
    accent: '#0891B2',
    bg: 'linear-gradient(135deg, #ECFEFF 0%, #CFFAFE 100%)',
    icon: '📊',
  },
  {
    name: 'Aura',
    tagline: 'Gesture-authenticated Offline Contact Exchange',
    desc: 'Android app for local-first contact sharing — no server, no account needed. Gesture authentication with post-quantum key exchange. Works fully offline via Bluetooth/NFC.',
    tags: ['Kotlin', 'Android', 'Cryptography', 'Bluetooth', 'NFC'],
    github: 'https://github.com/Yash-Awasthi/Aura',
    accent: '#C026D3',
    bg: 'linear-gradient(135deg, #FDF4FF 0%, #F5D0FE 100%)',
    icon: '🔐',
  },
  {
    name: 'RISC-V Injection',
    tagline: 'Custom Instruction in RISC-V Toolchain',
    desc: 'Implemented a custom attn RISC-V instruction that compiles transformer attention patterns to hardware. Extended the GCC toolchain for transparent code generation.',
    tags: ['C', 'GCC', 'RISC-V', 'Systems', 'Compilers'],
    github: 'https://github.com/Yash-Awasthi/RISC-V_Injection',
    accent: '#EA580C',
    bg: 'linear-gradient(135deg, #FFF7ED 0%, #FED7AA 100%)',
    icon: '⚙️',
  },
];

function ProjectCard({ p, index }) {
  return (
    <div className={`project-card reveal reveal-delay-${(index % 3) + 1} flex flex-col`}>
      {/* Header visual */}
      <div className="relative p-8 flex items-center gap-4" style={{ background: p.bg, minHeight: 130 }}>
        {p.highlight && (
          <span className="absolute top-4 right-4 px-2.5 py-1 rounded-full text-xs font-semibold"
                style={{ background: p.accent + '22', color: p.accent, border: `1px solid ${p.accent}33` }}>
            {p.highlight}
          </span>
        )}
        <div className="rounded-2xl flex items-center justify-center flex-shrink-0 float-b"
             style={{ width: 60, height: 60, background: '#fff', fontSize: 28, boxShadow: '0 4px 16px rgba(0,0,0,0.10)' }}>
          {p.icon}
        </div>
        <div>
          <div style={{ fontFamily: '"JetBrains Mono"', fontSize: 11, color: p.accent, fontWeight: 600, letterSpacing: '0.08em', marginBottom: 4 }}>
            {p.tags[0]}
          </div>
          <h3 style={{ fontWeight: 800, fontSize: 22, letterSpacing: '-0.01em' }}>{p.name}</h3>
        </div>
      </div>

      {/* Content */}
      <div className="flex flex-col flex-1 p-6 gap-4">
        <p style={{ fontWeight: 600, fontSize: 14, color: p.accent }}>{p.tagline}</p>
        <p style={{ color: 'var(--text-muted)', fontSize: 14, lineHeight: 1.65, flex: 1 }}>{p.desc}</p>

        {/* Tags */}
        <div className="flex flex-wrap gap-1.5">
          {p.tags.map(t => <span key={t} className="tag">{t}</span>)}
        </div>

        {/* Links */}
        <div className="flex gap-3 pt-2" style={{ borderTop: '1px solid var(--border)' }}>
          <a data-cursor="redirect" href={p.github} target="_blank" rel="noopener noreferrer"
             className="flex items-center gap-1.5 text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z"/></svg>
            GitHub
          </a>
          {p.live && (
            <a data-cursor="eyes" href={p.live} target="_blank" rel="noopener noreferrer"
               className="flex items-center gap-1.5 text-xs font-medium" style={{ color: p.accent }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
              Live
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

export default function Projects() {
  return (
    <section style={{ padding: 'clamp(48px, 8vw, 96px) clamp(20px, 6vw, 80px)' }}>
      <div className="reveal mb-12">
        <p className="section-label mb-2">Work</p>
        <h2 className="font-serif" style={{ fontSize: 'clamp(32px, 5vw, 52px)', lineHeight: 1.15, letterSpacing: '-0.01em' }}>
          Things I&apos;ve shipped
        </h2>
      </div>

      <div className="projects-grid">
        {PROJECTS.map((p, i) => <ProjectCard key={p.name} p={p} index={i} />)}
      </div>

      <style>{`
        .projects-grid {
          display: grid;
          gap: 24px;
          grid-template-columns: repeat(4, 1fr);
        }
        @media (max-width: 1024px) {
          .projects-grid { grid-template-columns: repeat(2, 1fr); }
        }
        @media (max-width: 600px) {
          .projects-grid { grid-template-columns: 1fr; }
        }
      `}</style>

      {/* GitHub link */}
      <div className="reveal mt-10 flex justify-center">
        <a href="https://github.com/Yash-Awasthi" target="_blank" rel="noopener noreferrer"
           className="btn-secondary">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z"/></svg>
          View all on GitHub
        </a>
      </div>
    </section>
  );
}
