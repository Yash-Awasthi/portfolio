import { useState, useEffect } from 'react';
import Hero from './sections/Hero';
import About from './sections/About';
import Skills from './sections/Skills';
import Projects from './sections/Projects';
import Journey from './sections/Journey';
import Contact from './sections/Contact';
import BottomDock from './components/BottomDock';

/* ── Scroll reveal observer ─────────────────────────────────────────────── */
function useScrollReveal() {
  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => entries.forEach(e => {
        if (e.isIntersecting) { e.target.classList.add('visible'); io.unobserve(e.target); }
      }),
      { threshold: 0.12 }
    );
    document.querySelectorAll('.reveal').forEach(el => io.observe(el));
    return () => io.disconnect();
  }, []);
}

export default function App() {
  const [active, setActive] = useState('home');

  useScrollReveal();


  /* Section active tracking */
  useEffect(() => {
    const ids = ['home','about','projects','journey','contact'];
    const io  = new IntersectionObserver(
      entries => entries.forEach(e => { if (e.isIntersecting) setActive(e.target.id); }),
      { rootMargin: '-40% 0px -40% 0px' }
    );
    ids.forEach(id => { const el = document.getElementById(id); if (el) io.observe(el); });
    return () => io.disconnect();
  }, []);

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg)' }}>
      {/* Sections */}
      <section id="home">    <Hero />     </section>
      <section id="about">   <About />    </section>
                             <Skills />
      <section id="projects"><Projects /> </section>
      <section id="journey"> <Journey />  </section>
      <section id="contact"> <Contact />  </section>

      {/* Dock */}
      <BottomDock active={active} />
    </div>
  );
}
