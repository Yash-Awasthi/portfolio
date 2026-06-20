const LINKS = [
  {
    label: 'GitHub',
    href:  'https://github.com/Yash-Awasthi',
    icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z"/></svg>,
  },
  {
    label: 'LinkedIn',
    href:  'https://linkedin.com/in/yash-vaibhav-awasthi',
    icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>,
  },
  {
    label: 'Discord',
    href:  'https://discord.com/users/yashawasthi_',
    icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/></svg>,
  },
  {
    label: 'Telegram',
    href:  'https://t.me/yvawasthi',
    icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/></svg>,
  },
];

const BTN = {
  display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 10,
  borderRadius: 50, fontWeight: 700, fontSize: 15, textDecoration: 'none',
  transition: 'opacity 0.2s, transform 0.15s', letterSpacing: '-0.01em', width: '100%',
  maxWidth: 420,
};

export default function Contact() {
  return (
    <section id="contact" style={{ background: '#0D0D14', padding: 'clamp(72px,10vw,120px) clamp(20px,6vw,80px) 64px' }}>
      <div style={{ maxWidth: 640, margin: '0 auto', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>

        <div className="reveal reveal-delay-1" style={{ marginBottom: 14 }}>
          <h2 style={{ fontSize: 'clamp(36px,6vw,64px)', fontWeight: 800, lineHeight: 1.1,
                       letterSpacing: '-0.03em', color: '#FFFFFF', fontFamily: '"Inter",sans-serif' }}>
            Get in touch
          </h2>
        </div>

        <p className="reveal reveal-delay-2" style={{ fontSize: 'clamp(15px,2vw,18px)', color: '#8B8BA0', lineHeight: 1.7, marginBottom: 40, maxWidth: 480 }}>
          Open to internship opportunities in backend systems, AI engineering, and full-stack development.
          If you are working on something interesting, I would be glad to hear about it.
        </p>

        <div className="reveal reveal-delay-3" style={{ display: 'flex', flexDirection: 'column', gap: 12, alignItems: 'center', width: '100%', marginBottom: 48 }}>
          {/* Resume — primary CTA */}
          <a
            href="https://drive.google.com/file/d/1dchKY9cIlt9-3kzsGW2AsO2SFqRVir70/view?usp=drive_link"
            target="_blank" rel="noopener noreferrer"
            style={{ ...BTN, background: '#FFFFFF', color: '#0D0D14', padding: '14px 28px' }}
            onMouseEnter={e => { e.currentTarget.style.opacity='0.88'; e.currentTarget.style.transform='translateY(-2px)'; }}
            onMouseLeave={e => { e.currentTarget.style.opacity='1'; e.currentTarget.style.transform=''; }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
              <line x1="16" y1="13" x2="8" y2="13"/>
              <line x1="16" y1="17" x2="8" y2="17"/>
              <polyline points="10 9 9 9 8 9"/>
            </svg>
            View Resume
          </a>

          {/* Email — secondary */}
          <a
            href="mailto:yashawasthi12032006@gmail.com"
            style={{ ...BTN, background: 'transparent', color: '#C8C8DC', padding: '13px 28px',
                     border: '1px solid #2E2E45' }}
            onMouseEnter={e => { e.currentTarget.style.background='#1A1A28'; e.currentTarget.style.color='#FFF'; e.currentTarget.style.transform='translateY(-2px)'; }}
            onMouseLeave={e => { e.currentTarget.style.background='transparent'; e.currentTarget.style.color='#C8C8DC'; e.currentTarget.style.transform=''; }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
              <polyline points="22,6 12,13 2,6"/>
            </svg>
            yashawasthi12032006@gmail.com
          </a>
        </div>

        <div className="reveal reveal-delay-4" style={{ display: 'flex', flexWrap: 'wrap', gap: 10, justifyContent: 'center' }}>
          {LINKS.map(l => (
            <a key={l.label} href={l.href} target="_blank" rel="noopener noreferrer"
               style={{ display: 'inline-flex', alignItems: 'center', gap: 8,
                        padding: '9px 18px', borderRadius: 50,
                        background: '#1A1A28', border: '1px solid #2E2E45',
                        color: '#C8C8DC', fontSize: 13, fontWeight: 500,
                        textDecoration: 'none', transition: 'background 0.2s,transform 0.15s,color 0.2s' }}
               onMouseEnter={e => { e.currentTarget.style.background='#252538'; e.currentTarget.style.transform='translateY(-2px)'; e.currentTarget.style.color='#FFF'; }}
               onMouseLeave={e => { e.currentTarget.style.background='#1A1A28'; e.currentTarget.style.transform=''; e.currentTarget.style.color='#C8C8DC'; }}>
              {l.icon}{l.label}
            </a>
          ))}
        </div>

      </div>
    </section>
  );
}
