import { useEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router';
import { motion, useReducedMotion, useScroll, useTransform, useMotionValueEvent, AnimatePresence } from 'motion/react';
import { ArrowUpRight, ArrowRight, Copy, Check } from '@phosphor-icons/react';
import { Page, Reveal, Words } from '../components/Motion';
import { Scene } from '../three/Stage';
import { HeroBlob, SwapArtifact, Artifact } from '../three/Artifacts';
import { JourneyPath } from '../three/JourneyPath';
import { PERSON, SOCIAL, PROJECTS, JOURNEY, CLOORD, CERTS } from '../data';
import { useScrollTo } from '../lib/lenis';

const EASE = [0.16, 1, 0.3, 1];

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
      <Work />
      <Journey />
      <Experience />
      <Credentials />
      <Contact />
    </Page>
  );
}

function Hero() {
  const reduce = useReducedMotion();
  const scrollTo = useScrollTo();
  return (
    <section id="top" className="relative mx-auto grid min-h-[100dvh] max-w-[1400px] grid-rows-[1fr_auto] px-4 pt-24 pb-10 md:px-8">
      <Scene
        className="pointer-events-none absolute inset-x-0 top-[10%] h-[48%] md:inset-auto md:right-4 md:top-16 md:h-[64%] md:w-[44%]"
        z={7}
        shadow={false}
      >
        <HeroBlob still={reduce} />
      </Scene>
      <div />
      <div className="relative grid gap-10 md:grid-cols-12 md:items-end">
        <Words
          as="h1"
          onLoad
          delay={0.55}
          text={PERSON.name}
          className="display text-[clamp(3.4rem,10.5vw,10.5rem)] md:col-span-9"
        />
        <Reveal delay={1} className="flex flex-col gap-6 md:col-span-3 md:pb-3">
          <p className="max-w-[34ch] text-[17px] leading-relaxed text-muted">{PERSON.intro}</p>
          <div className="flex flex-wrap gap-3">
            <a
              href="#work"
              onClick={(e) => {
                e.preventDefault();
                scrollTo('work');
              }}
              className="group inline-flex items-center gap-2 rounded-full bg-ink px-5 py-2.5 text-[15px] text-paper transition-transform active:scale-[0.97]"
            >
              View work
              <ArrowRight size={16} className="transition-transform duration-500 group-hover:translate-x-0.5" />
            </a>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

const STATEMENT =
  'I like software that holds up when things go wrong: payments that settle exactly once, terminals that resume where the network dropped them, and models that are scored against what actually happened.';

function Statement() {
  const ref = useRef();
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start 0.85', 'end 0.45'] });
  const words = STATEMENT.split(' ');
  return (
    <section ref={ref} className="mx-auto max-w-[1400px] px-4 py-32 md:px-8 md:py-48">
      <p className="max-w-[26ch] text-[clamp(1.9rem,4.2vw,3.9rem)] font-[480] leading-[1.08] tracking-[-0.03em]">
        {words.map((w, i) => (
          <Word key={i} progress={scrollYProgress} range={[i / words.length, (i + 1) / words.length]}>
            {w}
          </Word>
        ))}
      </p>
    </section>
  );
}

function Word({ progress, range, children }) {
  const reduce = useReducedMotion();
  const opacity = useTransform(progress, range, [0.14, 1]);
  return (
    <>
      <motion.span style={{ opacity: reduce ? 1 : opacity }}>{children}</motion.span>{' '}
    </>
  );
}

function Work() {
  const reduce = useReducedMotion();
  const [active, setActive] = useState(0);
  return (
    <section id="work" className="mx-auto max-w-[1400px] px-4 pb-32 md:px-8">
      <Words text="Selected work" className="display mb-14 text-[clamp(2.8rem,7vw,6.5rem)] md:mb-20" />
      <div className="grid gap-10 md:grid-cols-12">
        <div className="sticky top-24 hidden h-[72vh] md:col-span-5 md:block">
          <Scene className="h-full w-full" z={6.5}>
            <SwapArtifact shape={PROJECTS[active].shape} still={reduce} />
          </Scene>
        </div>
        <ol className="md:col-span-7">
          {PROJECTS.map((p, i) => (
            <motion.li
              key={p.slug}
              onViewportEnter={() => setActive(i)}
              viewport={{ margin: '-45% 0px -45% 0px' }}
              className="border-t border-line last:border-b"
            >
              <Link
                to={`/work/${p.slug}`}
                onMouseEnter={() => setActive(i)}
                onFocus={() => setActive(i)}
                className="group grid grid-cols-[1fr_auto] items-start gap-x-6 gap-y-3 py-8 md:py-10"
              >
                <Scene className="col-span-2 -mx-4 h-56 md:hidden" z={7}>
                  <Artifact shape={p.shape} still={reduce} />
                </Scene>
                <h3
                  className={`display text-[clamp(2.2rem,4.6vw,4.4rem)] transition-colors duration-500 ${
                    active === i ? 'text-ink' : 'text-ink/35'
                  }`}
                >
                  {p.name}
                </h3>
                <ArrowUpRight
                  size={28}
                  weight="light"
                  className={`mt-2 transition-all duration-500 ${
                    active === i ? 'text-accent opacity-100' : 'opacity-0'
                  } group-hover:translate-x-1 group-hover:-translate-y-1`}
                  aria-hidden
                />
                <p className="col-span-2 max-w-[48ch] text-[16px] leading-relaxed text-muted">{p.line}</p>
                <p className="col-span-2 font-mono text-[12px] tracking-wide text-muted">
                  {p.year} &nbsp;/&nbsp; {p.stack.slice(0, 4).join(', ')}
                </p>
              </Link>
            </motion.li>
          ))}
        </ol>
      </div>
    </section>
  );
}

function Journey() {
  const ref = useRef();
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end end'] });
  const [step, setStep] = useState(0);
  useMotionValueEvent(scrollYProgress, 'change', (v) => {
    const i = Math.min(JOURNEY.length - 1, Math.max(0, Math.round(v * (JOURNEY.length - 1))));
    setStep((s) => (s === i ? s : i));
  });
  const item = JOURNEY[step];
  const narrow = window.innerWidth < 768;

  return (
    <section id="journey" ref={ref} className="relative" style={{ height: `${JOURNEY.length * 70 + 60}vh` }}>
      <div className="sticky top-0 mx-auto grid h-[100dvh] max-w-[1400px] grid-rows-[1fr_auto] px-4 pt-20 pb-10 md:grid-cols-12 md:grid-rows-1 md:px-8">
        <Scene className="h-full w-full md:order-2 md:col-span-7" z={narrow ? 11.5 : 8.6} fov={38} shadow={false}>
          <JourneyPath progress={scrollYProgress} count={JOURNEY.length} />
        </Scene>
        <div className="flex flex-col justify-end md:order-1 md:col-span-5 md:justify-center">
          <h2 className="mb-10 text-[15px] text-muted">Journey</h2>
          <div className="relative min-h-[15rem] md:min-h-[18rem]">
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={step}
                initial={reduce ? false : { opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0, transition: { duration: 0.6, ease: EASE } }}
                exit={{ opacity: 0, y: -16, transition: { duration: 0.25 } }}
              >
                <p className="font-mono text-[13px] text-accent">{item.when}</p>
                <h3 className="display mt-4 text-[clamp(2.2rem,4.4vw,4rem)]">{item.title}</h3>
                <p className="mt-3 text-[17px]">{item.place}</p>
                <p className="mt-4 max-w-[40ch] text-[16px] leading-relaxed text-muted">{item.body}</p>
              </motion.div>
            </AnimatePresence>
          </div>
          <div className="mt-8 flex gap-2" aria-hidden>
            {JOURNEY.map((_, i) => (
              <span
                key={i}
                className={`h-[3px] w-8 transition-colors duration-500 ${i <= step ? 'bg-accent' : 'bg-line'}`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function Experience() {
  return (
    <section className="mx-auto max-w-[1400px] px-4 py-32 md:px-8 md:py-44">
      <div className="grid gap-12 md:grid-cols-12">
        <div className="md:col-span-5">
          <Words text="Where I have shipped" className="display text-[clamp(2.6rem,5.4vw,5rem)]" />
          <Reveal className="mt-10" delay={0.1}>
            <p className="text-[22px] font-medium tracking-tight">{CLOORD.org}</p>
            <p className="mt-1 text-[17px] text-muted">{CLOORD.role}</p>
            <p className="mt-1 font-mono text-[13px] text-muted">{CLOORD.when}</p>
          </Reveal>
        </div>
        <div className="md:col-span-7 md:pt-4">
          <ul className="grid gap-x-10 gap-y-10 sm:grid-cols-2">
            {CLOORD.points.map((pt, i) => (
              <Reveal as="li" key={i} delay={i * 0.06} className="border-t border-ink pt-5 text-[17px] leading-relaxed">
                {pt}
              </Reveal>
            ))}
            <Reveal as="li" delay={0.3} className="flex flex-wrap content-start gap-2 pt-5">
              {CLOORD.stack.map((s) => (
                <span key={s} className="rounded-full border border-line px-3 py-1 font-mono text-[12px] text-muted">
                  {s}
                </span>
              ))}
            </Reveal>
          </ul>
        </div>
      </div>
    </section>
  );
}

function Credentials() {
  return (
    <section className="mx-auto max-w-[1400px] px-4 pb-32 md:px-8">
      <h2 className="mb-8 text-[15px] text-muted">Certifications</h2>
      <div className="grid gap-px bg-line md:grid-cols-3">
        {CERTS.map((c, i) => (
          <Reveal key={c.name} delay={i * 0.08} className="flex min-h-[13rem] flex-col justify-between bg-paper p-6 md:p-8">
            <p className="text-[21px] font-medium leading-snug tracking-tight">{c.name}</p>
            <div className="mt-8 flex items-end justify-between gap-4 text-[14px] text-muted">
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
    </section>
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
    <section id="contact" className="mx-auto max-w-[1400px] px-4 pt-24 pb-10 md:px-8">
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
          className="inline-flex items-center gap-2 rounded-full border border-ink px-4 py-2 text-[14px] transition-colors hover:bg-ink hover:text-paper active:scale-[0.97]"
        >
          {copied ? <Check size={16} /> : <Copy size={16} />}
          <span aria-live="polite">{copied ? 'Copied' : 'Copy email'}</span>
        </button>
      </Reveal>
      <footer className="mt-32 flex flex-col gap-6 border-t border-line pt-6 text-[14px] text-muted md:flex-row md:items-center md:justify-between">
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
    </section>
  );
}
