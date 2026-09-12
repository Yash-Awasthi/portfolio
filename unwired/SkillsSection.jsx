import { useEffect, useRef } from 'react';

const skills = [
  { name: 'React', level: 95, category: 'Frontend' },
  { name: 'TypeScript', level: 90, category: 'Frontend' },
  { name: 'Next.js', level: 88, category: 'Frontend' },
  { name: 'Tailwind CSS', level: 92, category: 'Frontend' },
  { name: 'Node.js', level: 85, category: 'Backend' },
  { name: 'Python', level: 80, category: 'Backend' },
  { name: 'PostgreSQL', level: 75, category: 'Backend' },
  { name: 'Docker', level: 70, category: 'DevOps' },
  { name: 'AWS', level: 72, category: 'DevOps' },
  { name: 'Git', level: 90, category: 'Tools' },
];

const categories = ['Frontend', 'Backend', 'DevOps', 'Tools'];

export default function SkillsSection() {
  const sectionRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const bars = entry.target.querySelectorAll('.skill-bar-fill');
            bars.forEach((bar, index) => {
              setTimeout(() => {
                bar.style.width = bar.dataset.level + '%';
              }, index * 100);
            });
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.2 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <section
      ref={sectionRef}
      className="mx-auto max-w-4xl px-6 py-16"
      id="skills"
    >
      <p className="section-label mb-2">Capabilities</p>
      <h2
        className="mb-8 text-4xl font-bold tracking-tight"
        style={{ color: 'var(--text)' }}
      >
        Skills & Expertise
      </h2>

      <div className="grid gap-8 md:grid-cols-2">
        {categories.map((category) => (
          <div key={category}>
            <h3
              className="mb-4 text-sm font-semibold uppercase tracking-wider"
              style={{ color: 'var(--text-subtle)' }}
            >
              {category}
            </h3>
            <div className="space-y-4">
              {skills
                .filter((skill) => skill.category === category)
                .map((skill) => (
                  <div key={skill.name}>
                    <div className="mb-1 flex items-center justify-between">
                      <span
                        className="text-sm font-medium"
                        style={{ color: 'var(--text)' }}
                      >
                        {skill.name}
                      </span>
                      <span
                        className="text-xs font-mono"
                        style={{ color: 'var(--text-muted)' }}
                      >
                        {skill.level}%
                      </span>
                    </div>
                    <div className="skill-bar">
                      <div
                        className="skill-bar-fill"
                        data-level={skill.level}
                        style={{ width: '0%' }}
                      />
                    </div>
                  </div>
                ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
