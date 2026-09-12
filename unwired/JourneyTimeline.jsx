import { useEffect, useRef } from 'react';

const milestones = [
  {
    year: '2024',
    title: 'Full-Stack Development',
    description: 'Building production applications with React, Node.js, and cloud infrastructure.',
    icon: '🚀',
  },
  {
    year: '2023',
    title: 'Cloud & DevOps',
    description: 'Mastering AWS, Docker, and CI/CD pipelines for scalable deployments.',
    icon: '☁️',
  },
  {
    year: '2022',
    title: 'Frontend Specialization',
    description: 'Deep dive into React ecosystem, TypeScript, and modern CSS patterns.',
    icon: '🎨',
  },
  {
    year: '2021',
    title: 'First Professional Role',
    description: 'Joined a startup as a frontend developer, shipping real products to users.',
    icon: '💼',
  },
  {
    year: '2020',
    title: 'Open Source Contributions',
    description: 'Started contributing to open source projects and building a public portfolio.',
    icon: '🌐',
  },
  {
    year: '2019',
    title: 'Learning to Code',
    description: 'Began the journey with HTML, CSS, and JavaScript. Built first projects.',
    icon: '📚',
  },
];

export default function JourneyTimeline() {
  const sectionRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.2 }
    );

    const items = sectionRef.current?.querySelectorAll('.timeline-item');
    items?.forEach((item) => observer.observe(item));

    return () => observer.disconnect();
  }, []);

  return (
    <section
      ref={sectionRef}
      className="mx-auto max-w-4xl px-6 py-16"
      id="journey"
    >
      <p className="section-label mb-2">Path</p>
      <h2
        className="mb-8 text-4xl font-bold tracking-tight"
        style={{ color: 'var(--text)' }}
      >
        My Journey
      </h2>

      <div className="relative pl-12">
        <div className="timeline-line" />

        {milestones.map((milestone, index) => (
          <div
            key={milestone.year}
            className="timeline-item reveal mb-12 last:mb-0"
            style={{ transitionDelay: `${index * 0.1}s` }}
          >
            <div
              className="timeline-dot"
              style={{ top: '8px' }}
            />

            <div
              className="rounded-lg p-5"
              style={{
                background: 'var(--surface)',
                border: '1px solid var(--border)',
              }}
            >
              <div className="mb-2 flex items-center gap-3">
                <span className="text-2xl">{milestone.icon}</span>
                <div>
                  <span
                    className="text-xs font-mono font-medium"
                    style={{ color: 'var(--accent)' }}
                  >
                    {milestone.year}
                  </span>
                  <h3
                    className="text-lg font-bold"
                    style={{ color: 'var(--text)' }}
                  >
                    {milestone.title}
                  </h3>
                </div>
              </div>
              <p
                className="text-sm leading-relaxed"
                style={{ color: 'var(--text-muted)' }}
              >
                {milestone.description}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
