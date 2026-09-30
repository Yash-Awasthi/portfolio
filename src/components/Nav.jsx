import { Link, useLocation, useNavigate } from 'react-router';
import { PERSON } from '../data';
import { useScrollTo } from '../lib/lenis';

const ANCHORS = [
  { id: 'work', label: 'Work' },
  { id: 'journey', label: 'Journey' },
  { id: 'contact', label: 'Contact' },
];

export function Nav() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const scrollTo = useScrollTo();

  const go = (e, id) => {
    e.preventDefault();
    if (pathname === '/') scrollTo(id);
    else navigate(`/#${id}`);
  };

  return (
    <header className="fixed inset-x-0 top-0 z-30 bg-paper/80 backdrop-blur-md">
      <nav aria-label="Primary" className="mx-auto flex h-16 max-w-[1400px] items-center justify-between px-4 md:px-8">
        <Link
          to="/"
          onClick={(e) => pathname === '/' && (e.preventDefault(), scrollTo('top'))}
          className="text-[15px] font-medium tracking-tight"
        >
          Yash Awasthi
        </Link>
        <div className="flex items-center gap-4 text-[14px] md:gap-8">
          {ANCHORS.map((a) => (
            <a key={a.id} href={`/#${a.id}`} onClick={(e) => go(e, a.id)} className="link-underline hidden sm:inline">
              {a.label}
            </a>
          ))}
          <a
            href={PERSON.resume}
            target="_blank"
            rel="noopener"
            className="rounded-full border border-ink px-4 py-1.5 transition-colors duration-300 hover:bg-ink hover:text-paper active:scale-[0.97]"
          >
            Resume
          </a>
        </div>
      </nav>
    </header>
  );
}
