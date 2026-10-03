import { useMemo, useState } from 'react';
import { filterTraditions, inspectTradition, clarificationForTradition } from '../tradition-explorer.js';
import '../styles/tradition-explorer.css';

const findingLabels = {
  overlap: 'Measured overlap', divergence: 'Measured divergence',
  unresolved: 'Evidence remains unresolved', contradictory: 'Mixed or context-dependent evidence',
  partial: 'Only part of this doctrine is mapped', unmeasured: 'Unmeasured',
  under_review: 'Interpretation scope or source link under review', unavailable: 'Public evidence unavailable'
};
const qualificationLabels = {
  legacy_scope_unresolved: 'Some defining doctrine still relies on an inherited interpretation scope.',
  source_claim_unresolved: 'Some defining doctrine lacks a reviewed supporting source link.',
  material_divergence: 'Recorded evidence differs from at least one defining criterion.',
  no_sufficiently_established_affinity: 'The available evidence does not establish an affinity.',
  overlap_with_unmeasured_core: 'Some defining criteria overlap; others were not measured.',
  overlap_with_unresolved_core: 'Some defining criteria overlap; others remain unresolved.',
  overlap_on_measured_core: 'Measured defining criteria overlap. This does not assign an identity.'
};

function DoctrineSource({ source, onOpen }) {
  let secure = false;
  try { secure = new URL(source.url).protocol === 'https:'; } catch { /* Keep unavailable links as text. */ }
  return <div className="wvs-source">
    {secure ? <a href={source.url} target="_blank" rel="noopener noreferrer" onClick={onOpen}>
      {source.title}<span className="sr-only"> (opens in a new tab)</span>
    </a> : <span>{source.title}</span>}
    {source.locator && <p className="wvs-note">{source.locator}</p>}
  </div>;
}

export default function TraditionExplorer({ summary, depth, replayQualification, onClarify, onActivity, renderEvidence }) {
  const [query, setQuery] = useState('');
  const [selectedId, setSelectedId] = useState('');
  const traditions = useMemo(() => filterTraditions(summary, query), [summary, query]);
  const view = useMemo(() => inspectTradition(summary, selectedId), [summary, selectedId]);
  const offer = clarificationForTradition(view, depth, replayQualification);
  const canChooseDomain = Boolean(view?.gapDomains.length && depth?.available && !replayQualification);
  const selectedDomain = view?.gapDomains.some(domain => domain.id === depth?.domainId) ? depth.domainId : '';

  return <section id="tradition-explorer" className="wvs-tradition-explorer" aria-labelledby="explorer-title">
    <h3 id="explorer-title">Your answers and a tradition</h3>
    <p>Choose a public tradition to inspect its doctrine beside your recorded evidence. Selecting a tradition does not change your answers or make it your identity.</p>
    <div className="wvs-explorer-controls">
      <label htmlFor="explorer-search">Search tradition names
        <input id="explorer-search" type="search" value={query} onChange={event => {
          setQuery(event.target.value);
          setSelectedId('');
        }} aria-describedby="explorer-search-status" />
      </label>
      <label htmlFor="explorer-tradition">Choose a tradition to inspect
        <select id="explorer-tradition" value={selectedId} onChange={event => {
          const id = event.target.value;
          setSelectedId(id);
          if (id) onActivity?.({ type: 'tradition_opened', traditionId: id });
        }}>
          <option value="">Choose a tradition</option>
          {traditions.map(tradition => <option key={tradition.id} value={tradition.id}>{tradition.name}</option>)}
        </select>
      </label>
    </div>
    <p id="explorer-search-status" className="wvs-note" role="status">
      {traditions.length ? `${traditions.length} public tradition${traditions.length === 1 ? '' : 's'} available in catalog order. This is not a ranking.`
        : 'No public tradition matches this search. Internal research profiles are not part of this catalog.'}
    </p>

    {view && <article id="tradition-evidence" data-tradition-id={view.id} className="wvs-explorer-evidence">
      <h4>{view.name}</h4>
      <p>{view.context}</p>
      <p className="wvs-qualification">{qualificationLabels[view.state] ?? 'Inspect each criterion and its limitations; no overall classification is made here.'}</p>
      <p className="wvs-note">Catalog {summary.affinityCatalogVersion} · interpretation {summary.modelVersion}. Doctrine sources describe the tradition; interpretation sources explain the scope of the questionnaire evidence.</p>
      <div className="wvs-criteria-list">
        {view.criteria.map(({ criterion, proposition, finding, sources }) => <section className="wvs-explorer-criterion" key={criterion.id} data-finding={finding}>
          <h5>{criterion.role === 'defining' ? 'Defining criterion' : criterion.role === 'disputed' ? 'Disputed criterion' : 'Characteristic criterion'} · {findingLabels[finding]}</h5>
          <p>{criterion.doctrine}</p>
          {criterion.mapping?.note && <p className="wvs-note"><strong>Mapping limit:</strong> {criterion.mapping.note}</p>}
          {finding === 'partial' && <p className="wvs-note">Evidence for the mapped proposition does not establish this whole doctrinal criterion.</p>}
          {finding === 'unmeasured' && <p className="wvs-note">{proposition
            ? 'This administration did not measure the mapped proposition. Missing evidence is not agreement or disagreement.'
            : 'This doctrine has no suitable public proposition mapping. Additional questions are not presented as a way to establish it.'}</p>}
          {finding === 'under_review' && <p className="wvs-note">The recorded rule output is available below, but it is not promoted into a reviewed doctrinal conclusion.</p>}
          {proposition ? <details className="wvs-explorer-provenance">
            <summary>Inspect the proposition, answers, and interpretation sources</summary>
            {renderEvidence(proposition)}
          </details> : <p className="wvs-note">No exact public proposition evidence is available for this criterion.</p>}
          {sources.length > 0 && <div className="wvs-source-list"><strong>Sources for this doctrinal criterion</strong>
            {sources.map(source => <DoctrineSource key={source.id} source={source}
              onOpen={() => onActivity?.({ type: 'tradition_source_opened', traditionId: view.id })} />)}
          </div>}
        </section>)}
      </div>
      {view.nonEntailments.length > 0 && <p className="wvs-note"><strong>Does not imply:</strong> {view.nonEntailments.join(' · ')}</p>}

      {canChooseDomain && <div className="wvs-explorer-followup">
        <h5>Optional clarification of an open topic</h5>
        <p>These topics contain unresolved, directly mapped evidence. The existing planner may offer reviewed questions about the topic, not necessarily every criterion of this tradition. Unmapped and partially mapped doctrine stays limited.</p>
        <label htmlFor="explorer-gap-domain">Choose an open topic
          <select id="explorer-gap-domain" value={selectedDomain} onChange={event => depth.setDomainId(event.target.value)}>
            <option value="">Choose a topic</option>
            {view.gapDomains.map(domain => <option key={domain.id} value={domain.id}>{domain.title}</option>)}
          </select>
        </label>
        {offer ? <>
          <p className="wvs-note">{offer.reason}</p>
          <button id="explorer-clarify" type="button" className="e-btn e-btn-ghost" onClick={() => onClarify(offer.domainId)}>
            Answer {offer.count} optional topic question{offer.count === 1 ? '' : 's'}
          </button>
        </> : <p className="wvs-note" role="status">{selectedDomain
          ? 'The reviewed planner found no additional question justified for this topic. The open evidence remains open.'
          : 'Choose a topic to check whether a reviewed clarification is available.'}</p>}
      </div>}
      {replayQualification && <p className="wvs-note">This is a current reinterpretation of saved answers. Additional questioning remains disabled for this administration.</p>}
    </article>}
  </section>;
}
