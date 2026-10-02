export default function ProgressHeader({ current, total, done, skipped = 0 }) {
  const percent = total ? Math.round((done / total) * 100) : 0;
  const segments = Math.max(1, Math.min(12, total));
  const answered = Math.max(0, done);
  const perSegment = total / segments;
  return (
    <header className="wvs-progress">
      <div className="wvs-progress-copy">
        <span id="position">Question <strong>{current}</strong> of {total}</span>
        <span id="progress-caption">{done} of {total} positions complete{skipped ? ` · ${skipped} skipped by branch` : ''}</span>
      </div>
      <div id="progress" className="wvs-progress-segments" role="progressbar" aria-label="Questionnaire progress, not a worldview score"
        aria-valuemin="0" aria-valuemax="100" aria-valuenow={percent}>
        {Array.from({ length: segments }, (_, index) => {
          const start = index * perSegment;
          const fill = answered >= start + perSegment ? 100 : answered > start ? ((answered - start) / perSegment) * 100 : 0;
          return <span key={index} aria-hidden="true"><i style={{ width: `${fill}%` }} /></span>;
        })}
      </div>
    </header>
  );
}
