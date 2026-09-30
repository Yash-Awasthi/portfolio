import { Link, useParams } from 'react-router';
import { useReducedMotion } from 'motion/react';
import { PresentationControls } from '@react-three/drei';
import { ArrowLeft, ArrowRight, ArrowUpRight } from '@phosphor-icons/react';
import { Page, Reveal, Words } from '../components/Motion';
import { Scene } from '../three/Stage';
import { Artifact } from '../three/Artifacts';
import { PROJECTS } from '../data';
import NotFound from './NotFound';

export default function Project() {
  const { slug } = useParams();
  const reduce = useReducedMotion();
  const i = PROJECTS.findIndex((p) => p.slug === slug);
  if (i < 0) return <NotFound />;
  const p = PROJECTS[i];
  const next = PROJECTS[(i + 1) % PROJECTS.length];

  return (
    <Page>
      <title>{`${p.name} | Yash Awasthi`}</title>
      <section className="mx-auto grid max-w-[1400px] gap-8 px-4 pt-24 md:min-h-[100dvh] md:grid-cols-12 md:px-8">
        <div className="flex flex-col md:col-span-6 md:pb-16">
          <Link to="/#work" className="link-underline inline-flex w-fit items-center gap-2 text-[14px] text-muted">
            <ArrowLeft size={14} /> All work
          </Link>
          <div className="mt-auto pt-16">
            <Words as="h1" onLoad delay={0.5} text={p.name} className="display text-[clamp(3.6rem,10vw,9rem)]" />
            <Reveal delay={0.8}>
              <p className="mt-6 max-w-[30ch] text-[clamp(1.25rem,2vw,1.6rem)] leading-snug tracking-tight">{p.line}</p>
            </Reveal>
          </div>
        </div>
        <div className="relative h-[46vh] md:col-span-6 md:h-auto">
          <Scene className="h-full w-full" z={6.2}>
            <PresentationControls
              global={false}
              cursor
              snap
              speed={1.4}
              polar={[-0.4, 0.4]}
              azimuth={[-0.8, 0.8]}
              enabled={!reduce}
            >
              <Artifact shape={p.shape} still={reduce} tilt={0.15} />
            </PresentationControls>
          </Scene>
          <p className="pointer-events-none absolute bottom-2 right-0 font-mono text-[12px] text-muted">Drag to turn</p>
        </div>
      </section>

      <section className="mx-auto max-w-[1400px] px-4 py-24 md:px-8 md:py-32">
        <div className="grid gap-12 md:grid-cols-12">
          <Reveal as="dl" className="grid content-start gap-6 text-[15px] md:col-span-4">
            <div>
              <dt className="text-muted">Year</dt>
              <dd className="mt-1">{p.year}</dd>
            </div>
            <div>
              <dt className="text-muted">Stack</dt>
              <dd className="mt-1 max-w-[32ch] leading-relaxed">{p.stack.join(', ')}</dd>
            </div>
            <div>
              <dt className="text-muted">Links</dt>
              <dd className="mt-1 flex gap-5">
                <ExtLink href={p.github}>Source</ExtLink>
                {p.live && <ExtLink href={p.live}>Live</ExtLink>}
              </dd>
            </div>
          </Reveal>
          <Reveal className="md:col-span-8">
            <p className="max-w-[38ch] text-[clamp(1.4rem,2.5vw,2.1rem)] leading-[1.3] tracking-[-0.02em]">{p.overview}</p>
          </Reveal>
        </div>
      </section>

      {p.image && (
        <section className="mx-auto max-w-[1400px] px-4 md:px-8">
          <Reveal>
            <img
              src={p.image}
              alt={`${p.name} screenshot`}
              loading="lazy"
              className="w-full border border-line bg-surface shadow-[0_30px_80px_-40px_rgba(18,18,20,0.35)]"
            />
          </Reveal>
        </section>
      )}

      <section className="mx-auto max-w-[1400px] px-4 py-24 md:px-8 md:py-32">
        <Words text="What I built" className="display mb-14 text-[clamp(2.4rem,5vw,4.6rem)]" />
        <ul className="grid gap-x-10 gap-y-12 md:grid-cols-2">
          {p.points.map((pt, k) => (
            <Reveal as="li" key={k} delay={k * 0.07} className="border-t border-ink pt-6 text-[clamp(1.1rem,1.5vw,1.3rem)] leading-relaxed">
              {pt}
            </Reveal>
          ))}
        </ul>
      </section>

      <section className="mx-auto max-w-[1400px] px-4 pb-16 md:px-8">
        <Link to={`/work/${next.slug}`} className="group block border-t border-line pt-8">
          <span className="text-[14px] text-muted">Next project</span>
          <span className="display mt-4 flex items-center justify-between gap-6 text-[clamp(3rem,9vw,8rem)]">
            {next.name}
            <ArrowRight
              weight="light"
              className="size-[0.5em] shrink-0 text-accent transition-transform duration-500 group-hover:translate-x-3"
              aria-hidden
            />
          </span>
        </Link>
      </section>
    </Page>
  );
}

function ExtLink({ href, children }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className="link-underline inline-flex items-center gap-1">
      {children}
      <ArrowUpRight size={14} aria-hidden />
    </a>
  );
}
