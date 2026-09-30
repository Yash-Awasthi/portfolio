import { motion, useReducedMotion } from 'motion/react';

const EASE = [0.16, 1, 0.3, 1];

// Route wrapper: a panel in the page's colour lifts off on enter; an ink panel rises on exit.
export function Page({ children, color = '#141a1f' }) {
  const reduce = useReducedMotion();
  return (
    <>
      <motion.main
        id="main"
        className="relative z-[1]"
        initial={reduce ? false : { opacity: 0, y: 28 }}
        animate={{ opacity: 1, y: 0, transition: { duration: 0.9, ease: EASE, delay: 0.25 } }}
        exit={{ opacity: 0, y: -16, transition: { duration: 0.4, ease: EASE } }}
      >
        {children}
      </motion.main>
      {!reduce && (
        <>
          <motion.div
            aria-hidden
            className="pointer-events-none fixed inset-0 z-50 origin-top"
            style={{ backgroundColor: color }}
            initial={{ scaleY: 1 }}
            animate={{ scaleY: 0, transition: { duration: 0.8, ease: EASE } }}
            exit={{ scaleY: 0 }}
          />
          <motion.div
            aria-hidden
            className="pointer-events-none fixed inset-0 z-50 origin-bottom bg-ink"
            initial={{ scaleY: 0 }}
            animate={{ scaleY: 0 }}
            exit={{ scaleY: 1, transition: { duration: 0.55, ease: EASE } }}
          />
        </>
      )}
    </>
  );
}

export function Reveal({ as = 'div', delay = 0, y = 24, className, children, ...props }) {
  const reduce = useReducedMotion();
  const M = motion[as];
  return (
    <M
      className={className}
      initial={reduce ? false : { opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.25 }}
      transition={{ duration: 0.9, ease: EASE, delay }}
      {...props}
    >
      {children}
    </M>
  );
}

// Heading whose words rise out of a clip mask, staggered.
export function Words({ text, as = 'h2', className, delay = 0, onLoad = false }) {
  const reduce = useReducedMotion();
  const M = motion[as];
  const words = text.split(' ');
  const trigger = onLoad ? { animate: 'show' } : { whileInView: 'show', viewport: { once: true, amount: 0.4 } };
  return (
    <M className={className} initial={reduce ? false : 'hide'} {...trigger} aria-label={text}>
      {words.map((w, i) => (
        <span key={i} aria-hidden>
          <span className="inline-block overflow-hidden pb-[0.08em] align-top">
            <motion.span
              className="inline-block"
              variants={{
                hide: { y: '110%' },
                show: { y: 0, transition: { duration: 1, ease: EASE, delay: delay + i * 0.06 } },
              }}
            >
              {w}
            </motion.span>
          </span>
          {i < words.length - 1 && ' '}
        </span>
      ))}
    </M>
  );
}
