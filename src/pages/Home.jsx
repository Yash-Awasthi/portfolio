import { Suspense, useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { Link, useLocation } from 'react-router';
import { motion, useReducedMotion, useScroll, useSpring, useTransform, useMotionValueEvent, AnimatePresence } from 'motion/react';
import { ArrowUpRight, ArrowRight, ArrowUp, Copy, Check } from '@phosphor-icons/react';
import { Page, Reveal, Words } from '../components/Motion';
import { Scene } from '../three/Stage';
import { SwapArtifact, Artifact } from '../three/Artifacts';
import { Jolly } from '../three/Jolly';
import { JourneyPath } from '../three/JourneyPath';
import { PERSON, SOCIAL, PROJECTS, JOURNEY, CLOORD, CERTS, COURSES } from '../data';
import { useScrollTo } from '../lib/lenis';
import { ink, wash } from '../lib/tint';

const EASE = [0.16, 1, 0.3, 1];

// Cool pastel washes the page eases between as each section reaches mid-screen.
const WASH = {
  hero: '#e3ecf2',
  statement: '#e0eee8',
  experience: '#e7e5f3',
  credentials: '#dfecee',
  contact: '#e3e8f5',
};

const JOURNEY_COLORS = JOURNEY.map((j) => j.color);
const JOURNEY_VH = JOURNEY.length * 70 + 60;

export default function Home() {
  const { hash } = useLocation();
  const scrollTo = useScrollTo();
  useEffect(() => {
    if (!hash) return;
    const t = setTimeout(() => scrollTo(hash.slice(1), true), 120);
    return () => clearTimeout(t);
  }, [hash, scrollTo]);

  return (
    <Page>
      <Hero />
      <Statement />
      <Band />
      <Work />
      <Journey />
      <Experience />
      <Credentials />
      <Contact />
      <Dock />
    </Page>
  );
}

function Dock() {
  const scrollTo = useScrollTo();
  const [away, setAway] = useState(false);
  useEffect(() => {
    const on = () => setAway((document.getElementById('top')?.getBoundingClientRect().bottom ?? 0) < 40);
    on();
    window.addEventListener('scroll', on, { passive: true });
    return () => window.removeEventListener('scroll', on);
  }, []);
  const btn = 'inline-flex h-10 items-center justify-center gap-2 rounded-full px-3.5 text-[0.875rem] transition-transform active:scale-95';
  return (
    <div
      className={`fixed bottom-4 right-4 z-40 flex items-center gap-1.5 rounded-full border border-ink/10 bg-paper/80 p-1.5 shadow-lg backdrop-blur-md transition duration-500 ${away ? 'translate-y-0 opacity-100' : 'pointer-events-none translate-y-4 opacity-0'}`}
    >
      <button type="button" onClick={() => scrollTo('top')} aria-label="Back to top" className={`${btn} w-10 bg-ink px-0 text-paper`}>
        <ArrowUp size="1.125rem" />
      </button>
    </div>
  );
}

function Hero() {
  const reduce = useReducedMotion();
  const scrollTo = useScrollTo();
  const ref = useRef();
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] });
  const nameY = useTransform(scrollYProgress, [0, 1], [0, -140]);
  const fade = useTransform(scrollYProgress, [0, 0.8], [1, 0]);

  return (
    <motion.section
      id="top"
      ref={ref}
      data-wash={WASH.hero}
      className="relative mx-auto max-w-[87.5rem] px-4 pt-28 pb-10 md:px-8 md:pt-32"
    >
      <div
        className="relative grid items-end gap-x-6 gap-y-8 md:grid-cols-12 [--fs:clamp(3.4rem,8.6vw,10.5rem)]"
      >
        <motion.div
          className="order-2 md:order-none md:col-span-7 md:row-start-1"
          style={reduce ? undefined : { y: nameY, opacity: fade }}
        >
          <Words
            as="h1"
            onLoad
            delay={0.55}
            text={PERSON.name}
            className="display text-[length:var(--fs)]"
          />
        </motion.div>
        <motion.div
          className="order-3 md:order-none md:col-span-7 md:row-start-2"
          style={reduce ? undefined : { y: nameY, opacity: fade }}
        >
          <Reveal delay={1} className="flex flex-wrap gap-3">
            <a
              href="#work"
              onClick={(e) => {
                e.preventDefault();
                scrollTo('work');
              }}
              className="group inline-flex items-center gap-2 rounded-full bg-ink px-5 py-2.5 text-[0.9375rem] text-paper transition-transform active:scale-[0.97]"
            >
              View work
              <ArrowRight size="1rem" className="transition-transform duration-500 group-hover:translate-x-0.5" />
            </a>
          </Reveal>
        </motion.div>
        {/* Jolly spans the name block: top 20px above it, feet on the baseline of its second line; the canvas
            is taller than that box (room to hop and wave) but takes no layout space */}
        <div className="pointer-events-none relative order-1 h-[min(38vh,20rem)] md:order-none md:col-span-5 md:col-start-8 md:row-span-2 md:row-start-1 md:-mt-28 md:h-auto md:self-stretch">
          <div className="absolute inset-0">
            <Scene id="hero-jolly" className="h-full w-full" style={{ transform: 'translateX(100vw)' }} radius={1.3} bare>
              <Suspense fallback={null}>
                <Jolly calm={reduce} />
              </Suspense>
            </Scene>
            <p
              id="jolly-say"
              aria-hidden="true"
              className="absolute left-[14%] top-[27%] origin-bottom-right rounded-2xl rounded-br-sm bg-white px-3.5 py-1.5 text-[0.9375rem] font-medium text-ink opacity-0 shadow-sm"
            >
              Hi there!
            </p>
          </div>
        </div>
      </div>
    </motion.section>
  );
}

// Plain runs stay ink; the three examples each light up in a project colour as they are reached.
const STATEMENT = [
  ['I like software that holds up when things go wrong:'],
  ['payments that settle exactly once,', '#4a7fc1'],
  ['terminals that resume where the network dropped them,', '#5b5fc7'],
  ['and'],
  ['models that are scored against what actually happened.', '#2a8f8a'],
];

function Statement() {
  const ref = useRef();
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start 0.85', 'end 0.45'] });
  const words = STATEMENT.flatMap(([text, color]) => text.split(' ').map((w) => [w, color]));
  return (
    <motion.section
      ref={ref}
      data-wash={WASH.statement}
      className="mx-auto max-w-[87.5rem] px-4 py-32 md:px-8 md:py-48"
    >
      <p className="max-w-[26ch] text-[clamp(1.9rem,4.2vw,3.9rem)] font-[480] leading-[1.08] tracking-[-0.03em]">
        {words.map(([w, color], i) => (
          <Word key={i} progress={scrollYProgress} range={[i / words.length, (i + 1) / words.length]} color={color}>
            {w}
          </Word>
        ))}
      </p>
    </motion.section>
  );
}

function Word({ progress, range, color, children }) {
  const opacity = useTransform(progress, range, [0.14, 1]);
  return (
    <>
      <motion.span style={{ opacity, color: color ? ink(color) : undefined }}>{children}</motion.span>{' '}
    </>
  );
}

const BAND = [
  ['TypeScript', 'Python', 'Kotlin', 'C++', 'React', 'Node.js', 'FastAPI', 'Fastify'],
  ['PostgreSQL', 'Redis', 'AWS', 'Cloudflare', 'PyTorch', 'Docker', 'Three.js', 'React Native'],
];
const BAND_COLORS = ['#3d5bd9', '#2a8f8a'];

// The page's one marquee: two rows of the stack, pushed sideways by the scroll itself. Scroll-driven,
// so it stays on under reduced motion; the rows would otherwise wrap and lose the effect.
function Band() {
  const ref = useRef();
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] });
  const left = useTransform(scrollYProgress, [0, 1], ['4%', '-38%']);
  const right = useTransform(scrollYProgress, [0, 1], ['-38%', '4%']);
  return (
    <section ref={ref} aria-label="Stack" className="overflow-hidden py-10 md:py-16">
      {BAND.map((row, r) => (
        <motion.p
          key={r}
          style={{ x: r ? right : left }}
          className="display flex w-max gap-[0.35em] whitespace-nowrap py-2 text-[clamp(3rem,9vw,8.5rem)]"
        >
          {[...row, ...row].map((w, i) => (
            <span
              key={i}
              style={
                (i + r) % 3 === 0
                  ? { color: BAND_COLORS[(i + r * 3) % BAND_COLORS.length] }
                  : { WebkitTextStroke: '1.5px #141a1f', color: 'transparent' }
              }
            >
              {w}
            </span>
          ))}
        </motion.p>
      ))}
    </section>
  );
}

// A hidden View still compiles and draws every frame at 0x0, so each layout mounts only its own 3D.
const WIDE = '(min-width: 48rem)';
const onWide = (cb) => {
  const q = window.matchMedia(WIDE);
  q.addEventListener('change', cb);
  return () => q.removeEventListener('change', cb);
};
const useWide = () => useSyncExternalStore(onWide, () => window.matchMedia(WIDE).matches);

function Work() {
  const [active, activate] = useState(0);
  const p = PROJECTS[active];
  const wide = useWide();
  const reduce = useReducedMotion();
  const box = useRef();
  const list = useRef();
  const lift = useSpring(0, { stiffness: 140, damping: 26 });
  const { scrollY } = useScroll();
  // The object sits beside the active row, kept within the list; the sticky box itself never moves.
  const place = useCallback(() => {
    const b = box.current?.getBoundingClientRect();
    const l = list.current?.getBoundingClientRect();
    const r = list.current?.children[active]?.getBoundingClientRect();
    if (!b?.height || !r) return;
    const y = Math.min(Math.max(r.top + r.height / 2 - (b.top + b.height / 2), l.top - b.top), l.bottom - b.bottom);
    if (reduce) lift.jump(y);
    else lift.set(y);
  }, [active, reduce, lift]);
  useMotionValueEvent(scrollY, 'change', place);
  useEffect(() => {
    place();
    window.addEventListener('resize', place);
    return () => window.removeEventListener('resize', place);
  }, [place]);

  return (
    <motion.section
      id="work"
      className="mx-auto max-w-[87.5rem] px-4 pt-16 pb-32 md:px-8"
    >
      <Words text="Selected work" className="display mb-14 text-[clamp(2.8rem,7vw,6.5rem)] md:mb-20" />
      <div className="grid gap-10 md:grid-cols-12">
        <div ref={box} className="sticky top-24 hidden h-[min(72vh,40rem)] md:col-span-5 md:block">
          <motion.div style={{ y: lift }} className="h-full w-full">
            {wide && (
              <Scene className="h-full w-full" radius={1.55}>
                <SwapArtifact shape={p.shape} color={p.color} />
              </Scene>
            )}
          </motion.div>
        </div>
        <ol ref={list} className="md:col-span-7">
          {PROJECTS.map((item, i) => {
            const on = active === i;
            return (
              <motion.li
                key={item.slug}
                onViewportEnter={() => activate(i)}
                viewport={{ margin: '-45% 0px -45% 0px' }}
                data-wash={item.tint}
                className="border-t border-ink/15 last:border-b"
              >
                <Link
                  to={`/work/${item.slug}`}
                  onMouseEnter={() => activate(i)}
                  onFocus={() => activate(i)}
                  className="group relative grid grid-cols-[1fr_auto] items-start gap-x-6 gap-y-3 py-8 md:py-10"
                >
                  {!wide && (
                    <Scene className="col-span-2 -mx-4 h-60 md:hidden" radius={1.65}>
                      <Artifact shape={item.shape} color={item.color} />
                    </Scene>
                  )}
                  <h3
                    className={`display text-[clamp(2.2rem,4.6vw,4.4rem)] transition-colors duration-500 ${
                      on ? 'text-ink' : 'text-ink/30'
                    }`}
                  >
                    {item.name}
                  </h3>
                  <ArrowUpRight
                    size="1.75rem"
                    weight="light"
                    style={{ color: item.color }}
                    className={`mt-2 transition-all duration-500 ${on ? 'opacity-100' : 'opacity-0'} group-hover:translate-x-1 group-hover:-translate-y-1`}
                    aria-hidden
                  />
                  <p className="col-span-2 max-w-[48ch] text-[1rem] leading-relaxed text-muted">{item.line}</p>
                  <p className="col-span-2 font-mono text-[0.75rem] tracking-wide text-muted">
                    {item.year} &nbsp;/&nbsp; {item.stack.slice(0, 4).join(', ')}
                  </p>
                  <span
                    aria-hidden
                    className="absolute inset-x-0 -top-px h-[0.1875rem] origin-left transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)]"
                    style={{ backgroundColor: item.color, transform: `scaleX(${on ? 1 : 0})` }}
                  />
                </Link>
              </motion.li>
            );
          })}
        </ol>
      </div>
    </motion.section>
  );
}

function Journey() {
  const ref = useRef();
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end end'] });
  const [step, setStep] = useState(0);
  useMotionValueEvent(scrollYProgress, 'change', (v) => {
    setStep(Math.min(JOURNEY.length - 1, Math.max(0, Math.round(v * (JOURNEY.length - 1)))));
  });
  const item = JOURNEY[step];

  return (
    <motion.section
      id="journey"
      ref={ref}
      className="relative"
      style={{ height: `${JOURNEY_VH}vh` }}
    >
      {JOURNEY.map((j, i) => (
        // Colour stops placed where the viewport centre sits when milestone i is showing.
        <span
          key={i}
          aria-hidden
          data-wash={wash(j.color)}
          className="absolute left-0 h-0 w-0"
          style={{ top: `${(i / (JOURNEY.length - 1)) * (JOURNEY_VH - 100) + 50}vh` }}
        />
      ))}
      <div className="sticky top-0 mx-auto grid h-[100dvh] max-w-[87.5rem] grid-rows-[1fr_auto] px-4 pt-20 pb-10 md:grid-cols-12 md:grid-rows-1 md:px-8">
        <Scene className="h-full w-full md:order-2 md:col-span-7" radius={2.95} fov={38}>
          <JourneyPath progress={scrollYProgress} stops={JOURNEY_COLORS} />
        </Scene>
        <div className="flex flex-col justify-end md:order-1 md:col-span-5 md:justify-center">
          <h2 className="mb-10 text-[0.9375rem] text-muted">Journey</h2>
          <div className="relative min-h-[15rem] md:min-h-[18rem]">
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={step}
                initial={reduce ? { opacity: 0 } : { opacity: 0, y: 24, filter: 'blur(6px)' }}
                animate={{ opacity: 1, y: 0, filter: 'blur(0px)', transition: { duration: 0.6, ease: EASE } }}
                exit={reduce ? { opacity: 0, transition: { duration: 0.2 } } : { opacity: 0, y: -16, filter: 'blur(6px)', transition: { duration: 0.25 } }}
              >
                <p className="font-mono text-[0.8125rem]" style={{ color: ink(item.color) }}>
                  {item.when}
                </p>
                <h3 className="display mt-4 text-[clamp(2.2rem,4.4vw,4rem)]">{item.title}</h3>
                <p className="mt-3 text-[1.0625rem]">{item.place}</p>
                <p className="mt-4 max-w-[40ch] text-[1rem] leading-relaxed text-muted">{item.body}</p>
              </motion.div>
            </AnimatePresence>
          </div>
          <div className="mt-8 flex gap-2" aria-hidden>
            {JOURNEY.map((j, i) => (
              <span
                key={i}
                className="h-[0.1875rem] w-8 transition-colors duration-500"
                style={{ backgroundColor: i <= step ? j.color : 'rgb(20 26 31 / 0.12)' }}
              />
            ))}
          </div>
        </div>
      </div>
    </motion.section>
  );
}

function Experience() {
  return (
    <motion.section
      data-wash={WASH.experience}
      className="mx-auto max-w-[87.5rem] px-4 py-32 md:px-8 md:py-44"
    >
      <div className="grid gap-12 md:grid-cols-12">
        <div className="md:col-span-5">
          <Words text="Where I have shipped" className="display text-[clamp(2.6rem,5.4vw,5rem)]" />
          <Reveal className="mt-10" delay={0.1}>
            <p className="text-[1.375rem] font-medium tracking-tight">{CLOORD.org}</p>
            <p className="mt-1 text-[1.0625rem] text-muted">{CLOORD.role}</p>
            <p className="mt-1 font-mono text-[0.8125rem] text-muted">{CLOORD.when}</p>
            <a
              href={CLOORD.verify}
              target="_blank"
              rel="noopener noreferrer"
              className="link-underline mt-4 inline-flex items-center gap-1 text-[0.875rem]"
            >
              Verify internship
              <ArrowUpRight size="0.875rem" aria-hidden />
            </a>
          </Reveal>
        </div>
        <div className="md:col-span-7 md:pt-4">
          <ul className="grid gap-x-10 gap-y-10 sm:grid-cols-2">
            {CLOORD.points.map((pt, i) => (
              <Reveal
                as="li"
                key={i}
                delay={i * 0.06}
                className="border-t-[0.125rem] pt-5 text-[1.0625rem] leading-relaxed"
                style={{ borderColor: PROJECTS[i % PROJECTS.length].color }}
              >
                {pt}
              </Reveal>
            ))}
            <Reveal as="li" delay={0.3} className="flex flex-wrap content-start gap-2 pt-5">
              {CLOORD.stack.map((s) => (
                <span key={s} className="rounded-full border border-ink/15 bg-white/40 px-3 py-1 font-mono text-[0.75rem] text-muted">
                  {s}
                </span>
              ))}
            </Reveal>
          </ul>
        </div>
      </div>
    </motion.section>
  );
}

const CERT_COLORS = ['#3d5bd9', '#2a8f8a', '#5b5fc7'];

function Credentials() {
  return (
    <motion.section
      data-wash={WASH.credentials}
      className="mx-auto max-w-[87.5rem] px-4 pb-32 md:px-8"
    >
      <h2 className="mb-8 text-[0.9375rem] text-muted">Certifications</h2>
      <div className="grid gap-4 md:grid-cols-3">
        {CERTS.map((c, i) => (
          <Reveal
            key={c.name}
            delay={i * 0.08}
            className="flex min-h-[13rem] flex-col justify-between border-t-[0.125rem] bg-white/40 p-6 transition-transform duration-500 hover:-translate-y-1 md:p-8"
            style={{ borderColor: CERT_COLORS[i] }}
          >
            <p className="text-[1.3125rem] font-medium leading-snug tracking-tight">{c.name}</p>
            <div className="mt-8 flex items-end justify-between gap-4 text-[0.875rem] text-muted">
              <span>
                {c.issuer}
                <br />
                {c.when}
              </span>
              {c.href && (
                <a href={c.href} target="_blank" rel="noopener noreferrer" className="link-underline text-ink">
                  Verify
                </a>
              )}
            </div>
          </Reveal>
        ))}
      </div>
      <Reveal as="dl" className="mt-12 grid gap-8 border-t border-ink/15 pt-6 md:grid-cols-12">
        {COURSES.map((g) => (
          <div key={g.group} className={g.items.length > 1 ? 'md:col-span-9' : 'md:col-span-3'}>
            <dt className="text-[0.875rem] text-muted">
              {g.group} <span className="font-mono text-[0.75rem]">&nbsp;/&nbsp; {g.when}</span>
            </dt>
            <dd className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-[0.875rem]">
              {g.items.map(([name, href]) => (
                <a key={href} href={href} target="_blank" rel="noopener noreferrer" className="link-underline">
                  {name}
                </a>
              ))}
            </dd>
          </div>
        ))}
      </Reveal>
    </motion.section>
  );
}

function Contact() {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(PERSON.email);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      window.location.href = `mailto:${PERSON.email}`;
    }
  };
  return (
    <motion.section
      id="contact"
      data-wash={WASH.contact}
      className="mx-auto max-w-[87.5rem] px-4 pt-24 pb-10 md:px-8"
    >
      <Words text="Get in touch" className="display text-[clamp(3.4rem,11vw,11rem)]" />
      <Reveal className="mt-12 flex flex-wrap items-center gap-4">
        <a
          href={`mailto:${PERSON.email}`}
          className="link-underline break-all text-[clamp(1.25rem,2.6vw,2.2rem)] tracking-tight"
        >
          {PERSON.email}
        </a>
        <button
          type="button"
          onClick={copy}
          className="inline-flex items-center gap-2 rounded-full border border-ink px-4 py-2 text-[0.875rem] transition-colors hover:bg-ink hover:text-paper active:scale-[0.97]"
        >
          {copied ? <Check size="1rem" /> : <Copy size="1rem" />}
          <span aria-live="polite">{copied ? 'Copied' : 'Copy email'}</span>
        </button>
      </Reveal>
      <footer className="mt-32 flex flex-col gap-6 border-t border-ink/15 pt-6 text-[0.875rem] text-muted md:flex-row md:items-center md:justify-between">
        <ul className="flex flex-wrap gap-x-6 gap-y-2">
          {SOCIAL.map((s) => (
            <li key={s.label}>
              <a href={s.href} target="_blank" rel="noopener noreferrer" className="link-underline text-ink">
                {s.label}
              </a>
            </li>
          ))}
        </ul>
        <p>&copy; 2026 {PERSON.name}</p>
      </footer>
    </motion.section>
  );
}
