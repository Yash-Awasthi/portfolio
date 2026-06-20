import { useState, useEffect } from 'react';

function useClock() {
  const [time, setTime] = useState('');
  useEffect(() => {
    const fmt = () => new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
    setTime(fmt());
    const t = setInterval(() => setTime(fmt()), 1000);
    return () => clearInterval(t);
  }, []);
  return time;
}

const CHIPS = [
  { label: 'NIT Raipur · CPI 9.26', bg: 'var(--green-light)', color: '#15803D' },
];

export default function Hero() {
  const time = useClock();
  return (
    <div className="relative min-h-screen flex flex-col dot-grid" style={{ paddingBottom: 100 }}>
      <style>{`@keyframes blink{0%,100%{opacity:1}50%{opacity:.5}}`}</style>

      {/* Top bar */}
      <div className="flex items-center justify-between px-6 py-5 md:px-14">
        <div className="flex items-center gap-2" style={{ color: 'var(--text-muted)', fontSize: 13 }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
          <span style={{ fontFamily: '"JetBrains Mono"', fontWeight: 500 }}>{time}</span>
          <span style={{ margin: '0 6px', color: 'var(--border-strong)' }}>·</span>
          <span>Raipur, India</span>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full"
             style={{ background: 'var(--green-light)', border: '1px solid #BBF7D0' }}>
          <span style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--green)', display: 'inline-block',
                         animation: 'blink 2s ease-in-out infinite' }} />
          <span style={{ fontSize: 12, fontWeight: 600, color: '#15803D' }}>Open to Internship</span>
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 flex flex-col items-center justify-center text-center px-6 gap-8">
        <div className="reveal">
          <p className="section-label mb-4">Software Engineer · AI Systems Builder</p>
          <h1 className="font-serif" style={{ fontSize: 'clamp(44px, 7.5vw, 92px)', lineHeight: 1.04, letterSpacing: '-0.02em' }}>
            Yash Vaibhav Awasthi
          </h1>
        </div>

        <div className="reveal reveal-delay-1" style={{ maxWidth: 520 }}>
          <p style={{ fontSize: 'clamp(17px, 2.2vw, 21px)', color: 'var(--text-muted)', lineHeight: 1.6 }}>
            Third-year Computer Science undergraduate at NIT Raipur. Building full-stack and AI-driven systems at the intersection of engineering and research.
          </p>
        </div>

        <div className="reveal reveal-delay-2 flex flex-wrap gap-3 justify-center">
          <button data-cursor="down" className="btn-primary" onClick={() => document.getElementById('projects')?.scrollIntoView({ behavior: 'smooth' })}>
            View Work
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="m5 12 14 0M14 6l6 6-6 6"/></svg>
          </button>
          <a href="mailto:yashawasthi12032006@gmail.com" className="btn-secondary">
            Get in Touch
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
          </a>
        </div>

        <div className="reveal reveal-delay-3 flex flex-wrap gap-2 justify-center">
          {CHIPS.map(c => (
            <span key={c.label} className="px-3 py-1.5 rounded-full text-xs font-semibold"
              style={{ background: c.bg, color: c.color, border: `1px solid ${c.color}30` }}>
              {c.label}
            </span>
          ))}
        </div>

      </div>

      {/* Scroll cue */}
      <div className="flex flex-col items-center gap-2 pb-8 reveal reveal-delay-5"
           style={{ color: 'var(--text-subtle)', fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
        <span>Scroll</span>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m5 9 7 7 7-7"/></svg>
      </div>
    </div>
  );
}
