import { useMemo, useState } from 'react';
import { shuffleWithSeed } from '../../../../packages/runtime/index.js';

const specialLabels = {
  no_view: 'I do not currently have a view',
  not_understood: 'I do not understand this question',
  not_applicable: 'Not applicable to me'
};

function sameValue(left, right) {
  return JSON.stringify(left) === JSON.stringify(right);
}

export default function QuestionCard({ item, scale, prior, seed, index, onRespond }) {
  const [ranks, setRanks] = useState(() => {
    if (prior?.state !== 'answered' || !Array.isArray(prior.value)) return {};
    return Object.fromEntries(prior.value.map((id, rank) => [id, String(rank + 1)]));
  });
  const orderedOptions = useMemo(() => item.responseType === 'ranking'
    ? shuffleWithSeed(item.options, `${seed}:${item.id}:rank-display`)
    : item.options, [item, seed]);
  const assignedRanks = Object.values(ranks).filter(Boolean);
  const rankingReady = item.responseType === 'ranking' &&
    Object.keys(ranks).length === item.options.length &&
    new Set(assignedRanks).size === item.options.length;
  const answerOptions = ['likert', 'paired_choice'].includes(item.responseType)
    ? scale.options.map(option => ({ label: option.label, value: option.value }))
    : item.options.map(option => ({ label: option.label, value: option.id }));

  return (
    <article className="wvs-question-card" aria-labelledby="question-title" key={`${item.id}:${index}`}>
      <header className="wvs-question-heading">
        <p className="e-eyebrow">{item.domainLabel}</p>
        <h1 id="question-title" tabIndex="-1">{item.text}</h1>
        <p className="wvs-question-instruction">
          {item.responseType === 'ranking'
            ? 'Rank every option once, from most important to least important. You can change any selection before confirming.'
            : item.responseScaleId === 'agreement5'
              ? 'Choose the response that best fits your view.'
              : item.responseScaleId === 'paired5'
                ? 'Compare the two positions and choose the response that best fits your view.'
                : item.responseScaleId === 'importance5'
                  ? 'How important is this to you? This does not change whether your answer supports a philosophical proposition.'
                  : item.responseScaleId === 'moral_relevance5'
                    ? 'How relevant is this to your moral judgment?'
                    : 'Choose the option closest to your view.'}
        </p>
      </header>

      {item.responseType === 'paired_choice' && (
        <div className="wvs-pair-context" aria-label="Positions being compared">
          {orderedOptions.map(option => <p key={option.id}>{option.label}</p>)}
        </div>
      )}

      {item.responseType === 'ranking' ? (
        <div id="answer-options" className="wvs-ranking" role="group" aria-labelledby="question-title">
          {orderedOptions.map(option => (
            <label className="wvs-rank-row" key={option.id}>
              <span>{option.label}</span>
              <select aria-label={`Rank: ${option.label}`} value={ranks[option.id] ?? ''}
                onChange={event => setRanks(previous => ({ ...previous, [option.id]: event.target.value }))}>
                <option value="">Choose rank</option>
                {item.options.map((_, rank) => <option key={rank + 1} value={String(rank + 1)}>
                  {rank + 1}{rank === 0 ? ' · highest priority' : rank === item.options.length - 1 ? ' · lowest priority' : ''}
                </option>)}
              </select>
            </label>
          ))}
              <button id="confirm-ranking" className="e-btn e-btn-primary" type="button" disabled={!rankingReady}
            onClick={() => onRespond('answered', orderedOptions.slice().sort((a, b) => Number(ranks[a.id]) - Number(ranks[b.id])).map(option => option.id))}>
            Confirm ranking
          </button>
          <p className="wvs-answer-hint" role="status">
            {!Object.keys(ranks).length || rankingReady ? '' : 'Choose a unique rank for every option.'}
          </p>
        </div>
      ) : (
        <div id="answer-options" className="wvs-answer-grid" role="group" aria-labelledby="question-title">
          {answerOptions.map(option => {
            const selected = prior?.state === 'answered' && sameValue(prior.value, option.value);
            return (
              <button className={`wvs-answer answer${selected ? ' is-selected' : ''}`} key={String(option.value)} type="button"
                aria-pressed={selected} onClick={() => onRespond('answered', option.value)}>
                <span className="wvs-answer-mark" aria-hidden="true">{selected ? '✓' : ''}</span>
                <span>{option.label}</span>
              </button>
            );
          })}
        </div>
      )}

      <div className="wvs-special-options" role="group" aria-label="Other ways to respond">
        {item.specialStates.map(state => (
          <button className={`wvs-special${prior?.state === state ? ' is-selected' : ''}`} key={state} type="button"
            aria-pressed={prior?.state === state} onClick={() => onRespond(state, null)}>
            {item.specialLabels?.[state] ?? specialLabels[state] ?? state}
          </button>
        ))}
      </div>
    </article>
  );
}
