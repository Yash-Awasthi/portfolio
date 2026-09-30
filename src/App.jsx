import { Routes, Route, useLocation } from 'react-router';
import { AnimatePresence, useReducedMotion } from 'motion/react';
import { ReactLenis } from 'lenis/react';
import { Stage } from './three/Stage';
import { Nav } from './components/Nav';
import { useScrollTo } from './lib/lenis';
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

  return (
    <>
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:bg-ink focus:px-4 focus:py-2 focus:text-paper">
        Skip to content
      </a>
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
