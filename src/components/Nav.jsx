import { useEffect, useState } from 'react';

const GithubIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
    <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z"/>
  </svg>
);

const NAV_LINKS = ['about', 'projects', 'contact'];

export default function Nav() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const handle = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handle, { passive: true });
    return () => window.removeEventListener('scroll', handle);
  }, []);

  const scrollTo = (id) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
    setMobileOpen(false);
  };

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled
          ? 'bg-black/85 backdrop-blur-md border-b border-white/[0.06]'
          : 'bg-transparent'
      }`}
    >
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <button
          onClick={() => scrollTo('hero')}
          className="font-mono text-sm font-bold text-gold tracking-[0.25em] hover:opacity-75 transition-opacity select-none"
        >
          Y.A
        </button>

        {/* Desktop links */}
        <div className="hidden sm:flex items-center gap-8">
          {NAV_LINKS.map((s) => (
            <button
              key={s}
              onClick={() => scrollTo(s)}
              className="text-xs font-mono tracking-[0.18em] text-gray-500 hover:text-white capitalize transition-colors duration-200 uppercase"
            >
              {s}
            </button>
          ))}
          <a
            href="https://github.com/Yash-Awasthi"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="GitHub"
            className="text-gray-500 hover:text-white transition-colors duration-200"
          >
            <GithubIcon />
          </a>
        </div>

        {/* Mobile hamburger */}
        <button
          className="sm:hidden text-gray-400 hover:text-white"
          onClick={() => setMobileOpen((o) => !o)}
          aria-label="Menu"
        >
          <div className="w-5 space-y-1">
            <span className={`block h-px bg-current transition-all ${mobileOpen ? 'rotate-45 translate-y-2' : ''}`} />
            <span className={`block h-px bg-current transition-all ${mobileOpen ? 'opacity-0' : ''}`} />
            <span className={`block h-px bg-current transition-all ${mobileOpen ? '-rotate-45 -translate-y-1' : ''}`} />
          </div>
        </button>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="sm:hidden bg-black/95 border-t border-white/[0.06] px-6 py-4 space-y-4">
          {NAV_LINKS.map((s) => (
            <button
              key={s}
              onClick={() => scrollTo(s)}
              className="block w-full text-left text-sm font-mono tracking-widest text-gray-400 hover:text-white capitalize uppercase py-1"
            >
              {s}
            </button>
          ))}
          <a
            href="https://github.com/Yash-Awasthi"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-sm font-mono text-gray-400 hover:text-white py-1"
          >
            <GithubIcon />
            <span>GitHub</span>
          </a>
        </div>
      )}
    </nav>
  );
}
