import { useEffect, useState } from 'react';

const sections = [
  ['result-at-a-glance', 'Overview'],
  ['domains-title', '12 domains'],
  ['affinity-section', 'Traditions'],
  ['tension-section', 'Tensions'],
  ['activity-section', 'Exploration'],
  ['depth-section', 'Explore further'],
  ['reading-section', 'Reading'],
  ['compare-section', 'Compare'],
  ['method-section', 'Method']
];

export default function ResultsNav({ summary, activity }) {
  const visible = sections.filter(([id]) => {
    if (id === 'affinity-section') return Boolean(summary.affinities?.traditions?.length);
    if (id === 'tension-section') return Boolean(summary.tensions?.length);
    if (id === 'activity-section') return Boolean(activity?.finished);
    if (id === 'depth-section') return Boolean(summary.routeCanContinue);
    if (id === 'compare-section') return Boolean(summary.affinities?.traditions?.length > 1);
    return true;
  });
  const [active, setActive] = useState(visible[0]?.[0] ?? sections[0][0]);
  useEffect(() => {
    const observer = new IntersectionObserver(entries => {
      const current = entries.filter(entry => entry.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
      if (current) setActive(current.target.id);
    }, { rootMargin: '-35% 0px -55% 0px' });
    visible.forEach(([id]) => {
      const target = document.getElementById(id);
      if (target) observer.observe(target);
    });
    return () => observer.disconnect();
  }, [summary, activity, visible.length]);
  return (
    <nav id="result-nav" className="wvs-results-nav" aria-label="On this page">
      <p>On this page</p>
      {visible.map(([id, label], index) => (
        <a key={id} className={active === id ? 'is-active' : ''} href={`#${id}`}>
          <span>{String(index + 1).padStart(2, '0')}</span>{label}
        </a>
      ))}
    </nav>
  );
}
