/**
 * ScrollAnimations — applies scroll-triggered animations to portfolio sections.
 * Uses the scroll_animations.ts library for parallax and progress-based effects.
 */
import { useEffect, useRef } from 'react';

export default function ScrollAnimations({ children }) {
  const containerRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
          }
        });
      },
      { threshold: 0.1, rootMargin: '0px 0px -50px 0px' }
    );

    const animatableElements = containerRef.current.querySelectorAll('[data-scroll-animate]');
    animatableElements.forEach((el) => {
      el.style.opacity = '0';
      el.style.transform = 'translateY(30px)';
      el.style.transition = 'opacity 0.6s ease-out, transform 0.6s ease-out';
      observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  return (
    <div ref={containerRef} className="scroll-animations-container">
      {children}
    </div>
  );
}
