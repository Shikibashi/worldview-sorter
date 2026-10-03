import { useEffect, useMemo, useState } from 'react';
import { resultStatusLabel, formatResponseCoverage } from '../../../../packages/experience/result-overview.js';
import { buildShareSnapshot, shareSnapshotText, shareSnapshotSvg, readingTrailFor, compareTraditions } from '../../../../packages/experience/engagement.js';
import ResultsNav from './ResultsNav.jsx';
import TraditionExplorer from './TraditionExplorer.jsx';

const statusLabels = {
  supported: 'Supported', opposed: 'Opposed', leaned_toward: 'Leaned toward', mixed: 'Mixed',
  mixed_context_dependent: 'Mixed or context-dependent', insufficient_evidence: 'Insufficient evidence',
  not_measured: 'Not measured', model_review_required: 'Under review'
};
const coverageLabels = {
  not_measured: 'Not measured on this route', partially_assessed: 'Partly assessed',
  assessed_unresolved: 'Asked, but unresolved', meaningfully_assessed: 'Some positions interpreted'
};
const domainStateLegend = [
  ['supported', 'Supported'],
  ['opposed', 'Opposed'],
  ['mixed_context_dependent', 'Mixed'],
  ['insufficient_evidence', 'Insufficient evidence'],
  ['not_measured', 'Not measured']
];

function ExternalSource({ source, onOpen }) {
  let valid = false;
  try { valid = new URL(source.url).protocol === 'https:'; } catch {}
  return valid
    ? <a href={source.url} target="_blank" rel="noopener noreferrer" onClick={onOpen}>{source.title}<span className="sr-only"> (opens in a new tab)</span></a>
    : <span>{source.title}</span>;
}

function Pattern({ row, onActivity }) {
  const proposition = row.proposition ?? row.scope;
  return (
    <article className="wvs-result-item pattern" data-state={row.displayState ?? row.status} data-commitment-id={row.id}>
      <div className="wvs-result-item-head">
        <span className={`wvs-state wvs-state-${row.displayState ?? row.status}`}>{resultStatusLabel(row)}</span>
        <h3>{row.label}</h3>
      </div>
      {proposition && <p className="wvs-proposition"><strong>{row.propositionBasis === 'inherited_rule_scope' ? 'Authored rule scope' : 'Proposition'}</strong> · {proposition}</p>}
      {row.propositionBasis === 'inherited_rule_scope' && <p className="wvs-note">This is an inherited interpretation scope, not a separately reviewed standalone proposition.</p>}
      {row.explanation && <p>{row.explanation}</p>}
      {row.boundary && <p className="wvs-note"><strong>Limit:</strong> {row.boundary}</p>}
      {row.evidence?.length > 0 && (
        <details className="wvs-evidence-details">
          <summary>Why this appears · answers and sources</summary>
          <div className="wvs-evidence-list">
            {row.evidence.map((entry, index) => (
              <div className="wvs-evidence" key={`${entry.itemId}:${entry.itemRevision}:${index}`}>
                <p>{entry.text}</p>
                <p><strong>Your response:</strong> {entry.answer}</p>
                <p className="wvs-note"><strong>Evidence meaning:</strong> {(entry.meaning ?? entry.interpretation ?? 'not recorded').replaceAll('_', ' ')} · {entry.itemId} revision {entry.itemRevision}</p>
              </div>
            ))}
          </div>
          {row.interpretationRule?.neighbors?.length > 0 && <p className="wvs-note"><strong>Nearby views not settled:</strong> {row.interpretationRule.neighbors.join(' · ')}</p>}
          {row.interpretationRule?.nonEntailments?.length > 0 && <p className="wvs-note"><strong>This does not imply:</strong> {row.interpretationRule.nonEntailments.join(' · ')}</p>}
          {row.interpretationRule?.falsePositives?.length > 0 && <p className="wvs-note"><strong>Similar answers can also reflect:</strong> {row.interpretationRule.falsePositives.join(' · ')}</p>}
          {row.sources?.length > 0 && <div className="wvs-source-list"><strong>Sources behind this interpretation</strong>
            {row.sources.map(source => <div className="wvs-source" key={source.id}>
              <ExternalSource source={source} onOpen={() => onActivity({ type: 'source_opened', domainId: row.domainId })} />
              {source.locator && <span className="wvs-note">{source.locator}</span>}
              {source.claimLinks?.map((link, index) => <p className="wvs-note" key={index}>Rule-linked source claim ({link.relationship}): {link.claim}</p>)}
              {source.validatesThisQuiz === false && <p className="wvs-note">This source does not validate the questionnaire.</p>}
            </div>)}
          </div>}
          {row.interpretationRule && <details className="wvs-technical"><summary>Technical provenance</summary>
            <p>Interpretation {row.interpretationRule.version} · {row.interpretationRule.kind} rule {row.interpretationRule.id}</p>
          </details>}
        </details>
      )}
    </article>
  );
}

function AffinityCard({ tradition, presentation, onActivity }) {
  const state = presentation?.state ?? tradition.summaryState;
  return (
    <article className="wvs-affinity-card" data-tradition-id={tradition.id} data-state={state}>
      <p className="e-eyebrow">{tradition.scope.replaceAll('_', ' ')}</p>
      <h3>{tradition.name}</h3>
      <p className="wvs-affinity-state">{state.replaceAll('_', ' ')}</p>
      <p>{tradition.context}</p>
      {tradition.overlap?.some(criterion => criterion.role === 'defining') && <p><strong>Measured overlap:</strong> {tradition.overlap.filter(c => c.role === 'defining').map(c => c.doctrine).join(' ')}</p>}
      {tradition.divergence?.some(criterion => criterion.role === 'defining') && <p><strong>Measured divergence:</strong> {tradition.divergence.filter(c => c.role === 'defining').map(c => c.doctrine).join(' ')}</p>}
      {tradition.unmeasuredDefining?.length > 0 && <p className="wvs-note">{tradition.unmeasuredDefining.length} defining commitment{tradition.unmeasuredDefining.length === 1 ? ' is' : 's are'} unmeasured.</p>}
      <details onToggle={event => { if (event.currentTarget.open) onActivity({ type: 'tradition_opened', traditionId: tradition.id }); }}>
        <summary>Inspect commitments, open doctrine, and sources</summary>
        <div className="wvs-criteria-list">
          {tradition.criteria?.map(criterion => (
            <section className="wvs-criterion" key={criterion.id} data-finding={criterion.finding}>
              <strong>{criterion.finding.replaceAll('_', ' ')} · {criterion.role}</strong>
              <p>{criterion.doctrine}</p>
              <p className="wvs-note">{criterion.mapping.note}</p>
              {criterion.mapping.propositionId && <p className="wvs-note">Current evidence: {criterion.observedState?.replaceAll('_', ' ') ?? 'not observed'} · proposition {criterion.mapping.propositionId}</p>}
            </section>
          ))}
        </div>
        {tradition.nonEntailments?.length > 0 && <p className="wvs-note"><strong>Does not imply:</strong> {tradition.nonEntailments.join(' · ')}</p>}
        {tradition.neighbors?.length > 0 && <p className="wvs-note"><strong>Nearby views:</strong> {tradition.neighbors.join(' · ')}</p>}
        {tradition.sources?.length > 0 && <div className="wvs-source-list"><strong>Sources</strong>{tradition.sources.map(source => <div key={source.id}><ExternalSource source={source} onOpen={() => onActivity({ type: 'tradition_source_opened', traditionId: tradition.id })} /></div>)}</div>}
      </details>
    </article>
  );
}

function saveBlob(content, fileName, mimeType) {
  const href = URL.createObjectURL(new Blob([content], { type: mimeType }));
  const link = document.createElement('a');
  link.href = href;
  link.download = fileName;
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(href), 1000);
}

export default function ResultsView({ runtime, quiz, summary, activity, onActivity, replayQualification, depth, onContinueRoute, onClarify, onStop, onSaveAnswers, onSaveSummary, onRestart }) {
  const [shareOpen, setShareOpen] = useState(false);
  const [shareFormat, setShareFormat] = useState('overview');
  const [selectedIds, setSelectedIds] = useState(() => summary.overview?.[0] ? [summary.overview[0].id] : []);
  const [domainId, setDomainId] = useState(summary.domains[0]?.id ?? '');
  const [traditionId, setTraditionId] = useState(summary.affinities?.traditions?.[0]?.id ?? '');
  const [shareError, setShareError] = useState('');
  const [shareSnapshot, setShareSnapshot] = useState(null);
  const [readingId, setReadingId] = useState('');
  const [readingTrail, setReadingTrail] = useState(null);
  const [leftTradition, setLeftTradition] = useState(summary.affinities?.traditions?.[0]?.id ?? '');
  const [rightTradition, setRightTradition] = useState(summary.affinities?.traditions?.[1]?.id ?? '');
  const [traditionComparison, setTraditionComparison] = useState(null);
  const routeId = quiz.depth?.currentRouteId ?? quiz.packet.routeId ?? 'full';
  const answerableRows = summary.rows.filter(row => !['insufficient_evidence', 'not_measured'].includes(row.status) &&
    (row.inferenceStatus !== 'derived' || row.presentationReview?.state === 'eligible'));
  const summaryForNav = useMemo(() => ({ ...summary, routeCanContinue: depth.available }), [summary, depth.available]);
  const states = ['supported', 'opposed', 'mixed_context_dependent', 'insufficient_evidence', 'not_measured'];
  const counts = Object.fromEntries(states.map(state => [state, summary.rows.filter(row => row.status === state || (state === 'mixed_context_dependent' && row.status === 'mixed')).length]));

  useEffect(() => {
    if (!shareOpen || replayQualification) return;
    try {
      const snapshot = buildShareSnapshot({
        summary,
        administration: {
          completed: quiz.session.completionStatus === 'completed',
          instrumentVersion: quiz.session.instrumentVersion,
          formPolicyVersion: quiz.packet.formPolicyVersion ?? null,
          routeId,
          routeVersion: quiz.packet.routeVersion ?? null,
          modelReleaseVersion: quiz.session.modelReleaseVersion ?? null,
          localization: {
            locale: 'en-US', language: 'en', direction: 'ltr',
            bundleVersion: quiz.session.localization?.bundleVersion ?? null,
            catalogVersion: quiz.session.localization?.catalogVersion ?? null
          }
        },
        format: shareFormat,
        selectedIds,
        domainId,
        traditionId,
        exploration: shareFormat === 'exploration' ? activity : null,
        snapshotId: crypto.randomUUID(),
        createdAt: new Date().toISOString()
      });
      setShareSnapshot(snapshot);
      setShareError('');
    } catch (error) {
      setShareSnapshot(null);
      setShareError(error.message || 'Choose evidence for this card.');
    }
  }, [shareOpen, replayQualification, summary, quiz, routeId, shareFormat, selectedIds, domainId, traditionId, activity]);

  const openShare = () => {
    if (replayQualification) return;
    setShareOpen(true);
    setTimeout(() => document.getElementById('share-title')?.focus(), 0);
  };
  const toggleShareRow = id => setSelectedIds(previous => previous.includes(id)
    ? previous.filter(value => value !== id)
    : previous.length < 4 ? [...previous, id] : previous);
  const readChoice = value => {
    setReadingId(value);
    if (!value) { setReadingTrail(null); return; }
    const [kind, id] = value.split(':');
    try {
      setReadingTrail(readingTrailFor(summary, { kind, id }));
      if (kind === 'proposition') {
        const row = summary.rows.find(candidate => candidate.id === id);
        if (row) onActivity({ type: 'reading_opened', domainId: row.domainId });
      } else onActivity({ type: 'tradition_opened', traditionId: id });
    }
    catch { setReadingTrail(null); }
  };
  const compareChoice = () => {
    if (!summary.affinities || !leftTradition || !rightTradition || leftTradition === rightTradition) {
      setTraditionComparison({ error: 'Choose two different traditions.' });
      return;
    }
    setTraditionComparison(compareTraditions(summary.affinities, leftTradition, rightTradition));
    onActivity({ type: 'tradition_opened', traditionId: leftTradition });
    onActivity({ type: 'tradition_opened', traditionId: rightTradition });
  };

  return (
    <main id="main" className="ed wvs-app wvs-results-page">
      <div id="results">
      <header className="e-nav"><div className="e-wrap">
        <a className="e-logo" href="#top"><b>Worldview</b><span> Sorter</span></a>
        <div className="e-nav-links"><a href="#domains-title">Your map</a><a href="#affinity-section">Traditions</a><a href="#tension-section">Open questions</a></div>
      </div></header>

      <div className="e-wrap wvs-results-layout">
        <div className="wvs-results-content">
          <header className="wvs-results-heading" id="top">
            <p className="e-eyebrow">Your field guide · {routeId} route</p>
            <h1>Your worldview<br /><span className="e-accent">map</span></h1>
            <p className="e-lead">A guide to what your answers support, where they differ, and what this route left open.</p>
          </header>

          {replayQualification && <aside id="result-replay-notice" className="wvs-notice" role="status">
            <strong>Current reinterpretation of saved answers.</strong> This saved administration used a different or unpinned inference engine. Its original result cannot be verified here. Deepening and sharing are unavailable; your raw answers remain available.
          </aside>}

          <section id="result-at-a-glance" className="wvs-result-hero" aria-labelledby="glance-title">
            <p className="e-eyebrow">01 / At a glance</p>
            <h2 id="glance-title">What this route found</h2>
            <p className="wvs-qualification">These are categorical evidence states, not scores or probabilities. A shorter route leaves more views unmeasured.</p>
            <div className="wvs-count-grid" aria-label="Result state counts">
              <div><strong>{counts.supported}</strong><span>Supported</span></div>
              <div><strong>{counts.opposed}</strong><span>Opposed</span></div>
              <div><strong>{counts.mixed_context_dependent}</strong><span>Mixed</span></div>
              <div><strong>{counts.insufficient_evidence}</strong><span>Insufficient</span></div>
              <div><strong>{counts.not_measured}</strong><span>Not measured</span></div>
            </div>
            {summary.overview?.length > 0 && <div className="wvs-overview-rows">
              <h3>Examples of directly interpreted positions</h3>
              {summary.overview.slice(0, 4).map(row => <div className="wvs-overview-row" key={row.id}>
                <span className="wvs-state wvs-state-supported">{resultStatusLabel(row)}</span><strong>{row.label}</strong>
                <a href={`#domain-${row.domainId}`}>Inspect the evidence</a>
              </div>)}
            </div>}
            <p className="wvs-note">{formatResponseCoverage(quiz.session)}</p>
          </section>

          <section id="domains-section" className="wvs-section" aria-labelledby="domains-title">
            <div className="wvs-section-heading"><p className="e-eyebrow">02 / Your positions</p><h2 id="domains-title">Twelve philosophical domains</h2>
              <p>Each area shows what this route could interpret. Open a topic to inspect the propositions, answers, limitations, and sources behind it.</p>
            </div>
            <div id="domain-map-legend" className="wvs-domain-legend" role="group" aria-label="Evidence state key">
              <strong>Evidence state key</strong>
              {domainStateLegend.map(([state, label]) => <span className="wvs-domain-legend-item" key={state}>
                <i className={`wvs-domain-legend-mark wvs-strip-${state}`} aria-hidden="true" />{label}
              </span>)}
            </div>
            <div id="domain-map" className="wvs-domain-list">
              {summary.domains.map((domain, index) => (
                <details className="wvs-domain domain" id={`domain-${domain.id}`} key={domain.id}
                  onToggle={event => {
                    if (!event.currentTarget.open) return;
                    onActivity({ type: 'domain_opened', domainId: domain.id });
                    if (domain.rows.some(row => ['mixed', 'mixed_context_dependent', 'insufficient_evidence'].includes(row.status))) {
                      onActivity({ type: 'unresolved_opened', domainId: domain.id });
                    }
                  }}>
                  <summary>
                    <span className="wvs-domain-number">{String(index + 1).padStart(2, '0')}</span>
                    <span className="wvs-domain-title"><strong>{domain.title}</strong><small>{domain.prompt}</small></span>
                    <span className={`wvs-domain-status wvs-domain-${domain.measurementStatus}`}>{coverageLabels[domain.measurementStatus] ?? 'Evidence status available'}</span>
                    <span className="wvs-domain-toggle" aria-hidden="true">+</span>
            <span className="domain-strip" aria-label={`${domain.rows.filter(row => row.status === 'supported').length} supported, ${domain.rows.filter(row => row.status === 'opposed').length} opposed, ${domain.rows.filter(row => ['mixed', 'mixed_context_dependent'].includes(row.status)).length} mixed, ${domain.rows.filter(row => row.status === 'insufficient_evidence').length} insufficient, ${domain.rows.filter(row => row.status === 'not_measured').length} not measured`}>
                      {['supported', 'opposed', 'mixed_context_dependent', 'insufficient_evidence', 'not_measured'].map(state => {
                        const count = domain.rows.filter(row => row.status === state || (state === 'mixed_context_dependent' && row.status === 'mixed')).length;
                        return count ? <i className={`wvs-strip-${state}`} key={state} aria-hidden="true">{count}</i> : null;
                      })}
                    </span>
                  </summary>
                  <div className="wvs-domain-body">
                    {domain.rows?.length ? domain.rows.map(row => <Pattern key={row.id} row={row} onActivity={onActivity} />)
                      : <p className="wvs-note">No reviewed interpretation is available in this domain for this route. Recorded answers are not converted into an assumed view.</p>}
                    {domain.unresolvedConstructCount > 0 && <p className="wvs-note">{domain.unresolvedConstructCount} additional distinctions in this topic have no public comparison rule.</p>}
                  </div>
                </details>
              ))}
            </div>
          </section>

          {summary.affinities?.traditions?.length > 0 && <section id="affinity-section" className="wvs-section" aria-labelledby="affinity-title">
            <div className="wvs-section-heading"><p className="e-eyebrow">03 / Doctrinal comparison</p><h2 id="affinity-title">Philosophical traditions</h2>
              <p>Affinity is comparison, not identity. Several traditions can overlap, or none may fit the evidence. Unmeasured defining commitments remain visible.</p>
            </div>
            <div className="wvs-affinity-grid">
              {summary.affinities.traditions.map(tradition => <AffinityCard key={tradition.id} tradition={tradition}
                presentation={summary.affinityPresentation?.traditions?.find(row => row.traditionId === tradition.id)} onActivity={onActivity} />)}
            </div>
            <p className="wvs-note">Catalog {summary.affinityCatalogVersion}. These comparisons do not assign a philosophical identity or percentage match.</p>
          </section>}

          {summary.tensions?.length > 0 && <section id="tension-section" className="wvs-section" aria-labelledby="tension-title">
            <div className="wvs-section-heading"><p className="e-eyebrow">04 / Open questions</p><h2 id="tension-title">Answers worth exploring</h2>
              <p>A mixed result is not a consistency grade. Some views coexist; others call for a distinction or clarification.</p>
            </div>
            <div className="wvs-tension-list">{summary.tensions.map((tension, index) => <article className="wvs-tension" key={tension.id ?? index}>
              <span>Potential tension</span><p>{tension.explanation}</p>
            </article>)}</div>
          </section>}

          <section id="activity-section" className="wvs-section" aria-labelledby="activity-title">
            <div className="wvs-section-heading"><p className="e-eyebrow">05 / Exploration activity</p><h2 id="activity-title">What you have explored</h2>
              <p>This records navigation and reading activity only. It does not assess beliefs or change your results.</p>
            </div>
            <p id="exploration-progress" role="status">
              {activity.domains.length} of 12 topics opened · {activity.traditions.length} traditions inspected · {activity.sourceDomains.length + activity.sourceTraditions.length} source trails opened · {activity.routes.length} route depth{activity.routes.length === 1 ? '' : 's'} completed.
            </p>
            <details className="wvs-milestones">
              <summary>Optional exploration milestones</summary>
              {activity.milestones.length
                ? <ul>{activity.milestones.map(id => <li key={id}>{({
                  'all-domains-explored': 'Opened every domain', 'source-trail-opened': 'Opened a philosophical source',
                  'two-traditions-inspected': 'Inspected two philosophical traditions', 'open-question-inspected': 'Inspected an open question',
                  'multiple-depths-explored': 'Completed more than one depth on this administration'
                })[id] ?? id}</li>)}</ul>
                : <p className="wvs-note">No exploration milestones recorded yet.</p>}
            </details>
          </section>

          <section id="depth-section" className="wvs-section wvs-depth-section" aria-labelledby="depth-title">
            <div className="wvs-section-heading"><p className="e-eyebrow">05 / Your choice</p><h2 id="depth-title">Explore further, if you want</h2>
              <p>Your earlier answers stay with this administration. New questions add evidence; unanswered distinctions remain open until asked.</p>
            </div>
            {depth.available ? <div className="wvs-depth-controls">
              {depth.routes.map(route => <button className="e-btn e-btn-primary" type="button" key={route.routeId}
                onClick={() => onContinueRoute(route.routeId)}>{route.label} · up to {route.count} new questions</button>)}
              <div className="wvs-clarify-control">
                <label htmlFor="clarify-domain">Choose a topic to clarify</label>
                <select id="clarify-domain" value={depth.domainId} onChange={event => depth.setDomainId(event.target.value)}>
                  {summary.domains.map(domain => <option value={domain.id} key={domain.id}>{domain.title}</option>)}
                </select>
                <button className="e-btn e-btn-ghost" type="button" disabled={!depth.clarificationCount}
                  onClick={() => onClarify(depth.domainId)}>{depth.clarificationCount
                    ? `Answer ${depth.clarificationCount} more question${depth.clarificationCount === 1 ? '' : 's'} about this topic`
                    : 'No useful clarification is available here'}</button>
                <p className="wvs-note">{depth.clarificationReason || 'Clarification is offered only when the reviewed planner identifies a useful evidence gap.'}</p>
              </div>
              <button className="wvs-text-button" type="button" onClick={onStop}>Keep this result and stop</button>
            </div> : <p className="wvs-note">This administration has no deeper public route available. You can keep this result or start a new administration.</p>}
          </section>

          <section id="reading-section" className="wvs-section" aria-labelledby="reading-title">
            <div className="wvs-section-heading"><p className="e-eyebrow">06 / Continue reading</p><h2 id="reading-title">Follow a source trail</h2>
              <p>Read about the question and nearby positions. A source is offered for inquiry, not because you belong to a tradition.</p>
            </div>
            <label htmlFor="reading-choice">Choose an interpreted position or tradition</label>
            <select id="reading-choice" value={readingId} onChange={event => readChoice(event.target.value)}>
              <option value="">Choose a result or tradition</option>
              {summary.rows.filter(row => row.sources?.length).map(row => <option key={`p:${row.id}`} value={`proposition:${row.id}`}>{row.label} · {resultStatusLabel(row)}</option>)}
              {summary.affinities?.traditions?.map(tradition => <option key={`t:${tradition.id}`} value={`tradition:${tradition.id}`}>{tradition.name} · tradition</option>)}
            </select>
            {readingTrail && <article className="wvs-reading-trail"><h3>{readingTrail.title}</h3><p>{readingTrail.question}</p><p>{readingTrail.why}</p>
              {readingTrail.alternatives?.length > 0 && <p><strong>Nearby views:</strong> {readingTrail.alternatives.join(' · ')}</p>}
              {readingTrail.nonEntailments?.length > 0 && <p><strong>Does not imply:</strong> {readingTrail.nonEntailments.join(' · ')}</p>}
              <h4>Sources</h4>{readingTrail.sources?.map(source => <div key={source.url}><ExternalSource source={source} /></div>)}
            </article>}
          </section>

          {summary.affinities?.traditions?.length > 1 && <section id="compare-section" className="wvs-section" aria-labelledby="compare-title">
            <div className="wvs-section-heading"><p className="e-eyebrow">07 / Compare</p><h2 id="compare-title">Explore and compare traditions</h2>
              <p>See shared and diverging doctrine, disputed areas, and criteria this route did not measure. There is no winner or distance score.</p>
            </div>
            <TraditionExplorer summary={summary} depth={depth} replayQualification={replayQualification}
              onClarify={onClarify} onActivity={onActivity}
              renderEvidence={row => <Pattern row={row} onActivity={onActivity} />} />
            <h3>Compare two traditions</h3>
            <div className="wvs-compare-controls">
              <label>First tradition<select value={leftTradition} onChange={event => setLeftTradition(event.target.value)}>
                {summary.affinities.traditions.map(row => <option value={row.id} key={row.id}>{row.name}</option>)}
              </select></label>
              <label>Second tradition<select value={rightTradition} onChange={event => setRightTradition(event.target.value)}>
                {summary.affinities.traditions.map(row => <option value={row.id} key={row.id}>{row.name}</option>)}
              </select></label>
              <button className="e-btn e-btn-ghost" type="button" onClick={compareChoice}>Compare doctrine</button>
            </div>
            {traditionComparison && <div className="wvs-comparison-result" aria-live="polite">
              {traditionComparison.error ? <p>{traditionComparison.error}</p> : <>
                <p>{traditionComparison.note}</p>
                {[traditionComparison.left, traditionComparison.right].map(tradition => <section key={tradition.id}>
                  <h3>{tradition.name}</h3><p>{tradition.context}</p>
                  {tradition.criteria.filter(c => c.role === 'defining').map(c => <p key={c.id}><strong>{c.finding.replaceAll('_', ' ')}:</strong> {c.doctrine}</p>)}
                  {tradition.nonEntailments?.length > 0 && <p className="wvs-note"><strong>Does not imply:</strong> {tradition.nonEntailments.join(' · ')}</p>}
                </section>)}
              </>}
            </div>}
          </section>}

          <section id="method-section" className="wvs-section wvs-method-section" aria-labelledby="method-title">
            <p className="e-eyebrow">08 / How to read this</p><h2 id="method-title">Evidence before labels</h2>
            <p>{summary.academicNotice}</p><p>{summary.coverageNotice}</p>
            <p>Interpretation {summary.modelVersion} · item bank {summary.bankVersion} · route policy {quiz.packet.formPolicyVersion} · result semantics {summary.resultSemanticsVersion}.</p>
          </section>

          <div className="wvs-result-actions">
            <button className="e-btn e-btn-primary" type="button" id="share-open" onClick={openShare} disabled={Boolean(replayQualification)}>Choose what to share</button>
            <button className="e-btn e-btn-ghost" type="button" id="summary-save" onClick={onSaveSummary} disabled={Boolean(replayQualification)}>Save summary</button>
            <button className="e-btn e-btn-ghost" type="button" id="result-answers" onClick={onSaveAnswers}>Save raw answers</button>
            <button className="e-btn e-btn-ghost" type="button" id="restart" onClick={onRestart}>Explore again</button>
          </div>

          {shareOpen && <section className="wvs-share-panel" aria-labelledby="share-title">
            <h2 id="share-title" tabIndex="-1">Your choice, your snapshot</h2>
            <p>Create a selected historical snapshot on this device. Nothing is uploaded or published. Raw answers, account data, and research consent are excluded. This is a saved snapshot, not a public link.</p>
            <label>Card format<select id="share-format" value={shareFormat} onChange={event => setShareFormat(event.target.value)}>
              <option value="overview">Overview</option><option value="domain">One domain</option><option value="affinity">One philosophical affinity</option><option value="exploration">Exploration activity</option>
            </select></label>
            {shareFormat === 'overview' && <fieldset id="share-options"><legend>Select up to four evidence-backed positions</legend>
              {answerableRows.map(row => <label className="wvs-share-option" key={row.id}>
                <input type="checkbox" checked={selectedIds.includes(row.id)} onChange={() => toggleShareRow(row.id)} disabled={!selectedIds.includes(row.id) && selectedIds.length >= 4} />
                <span>{resultStatusLabel(row)}: {row.label}</span>
              </label>)}
            </fieldset>}
            {shareFormat === 'domain' && <label>Domain<select value={domainId} onChange={event => setDomainId(event.target.value)}>
              {summary.domains.map(domain => <option value={domain.id} key={domain.id}>{domain.title}</option>)}
            </select></label>}
            {shareFormat === 'affinity' && <label>Tradition<select value={traditionId} onChange={event => setTraditionId(event.target.value)}>
              {summary.affinities?.traditions?.map(tradition => <option value={tradition.id} key={tradition.id}>{tradition.name}</option>)}
            </select></label>}
            {shareFormat === 'exploration' && <p className="wvs-note">This snapshot records the topics, traditions, sources, and route depths you opened. It does not include answers or interpreted beliefs.</p>}
            <label htmlFor="share-preview">Exact text to copy</label>
            <textarea id="share-preview" readOnly rows="7" value={shareSnapshot ? shareSnapshotText(shareSnapshot) : shareError} />
            {shareError && <p role="status" className="wvs-note">{shareError}</p>}
            <div className="wvs-share-actions">
              <button className="e-btn e-btn-primary" id="copy-share" type="button" disabled={!shareSnapshot} onClick={async () => {
                try { await navigator.clipboard.writeText(shareSnapshotText(shareSnapshot)); setShareError('The preview was copied. Nothing was posted.'); }
                catch { document.getElementById('share-preview')?.select(); setShareError('Clipboard access is unavailable. The preview is selected for you to copy manually.'); }
              }}>Copy text</button>
              <button className="e-btn e-btn-ghost" id="download-share-json" type="button" disabled={!shareSnapshot}
                onClick={() => saveBlob(`${JSON.stringify(shareSnapshot, null, 2)}\n`, `worldview-${shareFormat}-${shareSnapshot.snapshotId}.json`, 'application/json')}>Save accessible snapshot</button>
              <button className="e-btn e-btn-ghost" id="download-share-svg" type="button" disabled={!shareSnapshot}
                onClick={() => saveBlob(shareSnapshotSvg(shareSnapshot), `worldview-${shareFormat}-${shareSnapshot.snapshotId}.svg`, 'image/svg+xml')}>Save image card</button>
              <a className="e-btn e-btn-ghost" href="./apps/quiz/share.html">Open or compare a saved snapshot</a>
              <button className="wvs-text-button" type="button" onClick={() => setShareOpen(false)}>Close</button>
            </div>
            <p className="wvs-note">The accessible JSON and text remain the full context. The image is only a compact view of the same selected, versioned result.</p>
          </section>}
        </div>
        <aside className="wvs-results-aside"><ResultsNav summary={summaryForNav} activity={activity} /></aside>
      </div>
      <footer className="e-foot"><div className="e-wrap"><span>Worldview Sorter</span><p>Curiosity, not a verdict.</p></div></footer>
      </div>
    </main>
  );
}