import { Routes, Route, useLocation } from 'react-router';
import { AnimatePresence, motion, useReducedMotion, useScroll, useSpring } from 'motion/react';
import { ReactLenis } from 'lenis/react';
import { Stage } from './three/Stage';
import { Nav } from './components/Nav';
import { useScrollTo } from './lib/lenis';
import { tint, useScrollWash } from './lib/tint';
import Home from './pages/Home';
import Project from './pages/Project';
import NotFound from './pages/NotFound';

export default function App() {
  const reduce = useReducedMotion();
  return reduce ? (
    <Site />
  ) : (
    <ReactLenis root options={{ lerp: 0.1 }}>
      <Site />
    </ReactLenis>
  );
}

function Site() {
  const location = useLocation();
  const scrollTo = useScrollTo();
  const toTop = () => !window.location.hash && scrollTo('top', true);
  useScrollWash(location.pathname);

  return (
    <>
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:bg-ink focus:px-4 focus:py-2 focus:text-paper">
        Skip to content
      </a>
      <motion.div aria-hidden className="fixed inset-0 -z-10" style={{ backgroundColor: tint }} />
      <Progress />
      <Stage />
      <Nav />
      <AnimatePresence mode="wait" onExitComplete={toTop}>
        <Routes location={location} key={location.pathname}>
          <Route path="/" element={<Home />} />
          <Route path="/work/:slug" element={<Project />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </AnimatePresence>
      <div className="grain" aria-hidden />
    </>
  );
}

const BAR = 'linear-gradient(90deg, #2a8f8a, #3d5bd9, #5b5fc7)';

function Progress() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 180, damping: 30, restDelta: 0.001 });
  return (
    <motion.div
      aria-hidden
      className="fixed inset-x-0 top-0 z-40 h-[3px] origin-left"
      style={{ scaleX, backgroundImage: BAR }}
    />
  );
}
