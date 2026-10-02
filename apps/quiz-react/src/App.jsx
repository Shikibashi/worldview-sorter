import { useEffect, useMemo, useRef, useState } from 'react';
import {
  createQuiz, restoreQuiz, currentItem, seekQuestion, answerQuestion, nextQuestion,
  previousQuestion, quizProgress, extendProgressiveQuiz, recordDepthCheckpoint,
  EXPERIENCE_VERSION, COMPATIBLE_EXPERIENCE_VERSIONS
} from '../../../packages/experience/quiz.js';
import { buildQuizSummary } from '../../../packages/experience/summary.js';
import { EXPLORATION_VERSION, initialExplorationV2, recordExplorationV2 } from '../../../packages/experience/exploration.js';
import { localizeItem, localizeSummary, routeLocalizationAvailability } from '../../../packages/localization/index.js';
import { planWorldviewFollowups } from '../../../packages/worldview/index.js';
import { loadRuntime } from './runtime.js';
import ProgressHeader from './components/ProgressHeader.jsx';
import QuestionCard from './components/QuestionCard.jsx';
import ResultsView from './components/ResultsView.jsx';
import HomeScreen from './components/HomeScreen.jsx';
import RouteChooser from './components/RouteChooser.jsx';

const STORAGE_KEY = 'worldview-sorter:quiz-experience:1';
const activityStorageKey = sessionId => `worldview-sorter:exploration:2:${sessionId}`;
const activityDomains = new Set(['ME', 'NE', 'MF', 'VA', 'EP', 'OM', 'MS', 'AH', 'RC', 'EX', 'SO', 'PL']);
const activityFields = {
  domains: value => activityDomains.has(value),
  traditions: value => /^[a-z0-9_-]{2,80}$/i.test(value),
  sourceDomains: value => activityDomains.has(value),
  sourceTraditions: value => /^[a-z0-9_-]{2,80}$/i.test(value),
  unresolvedDomains: value => activityDomains.has(value),
  readingDomains: value => activityDomains.has(value),
  routes: value => ['quick', 'standard', 'full'].includes(value)
};
const specialStateNames = { no_view: 'No view recorded', not_understood: 'Question not understood', not_applicable: 'Not applicable' };

function restoreActivity(sessionId) {
  const initial = initialExplorationV2();
  try {
    const saved = JSON.parse(localStorage.getItem(activityStorageKey(sessionId)) ?? 'null');
    if (saved?.version !== EXPLORATION_VERSION || saved.finished !== true || !Array.isArray(saved.routes)) return initial;
    let activity = initial;
    for (const routeId of [...new Set(saved.routes.filter(activityFields.routes))]) {
      activity = recordExplorationV2(activity, { type: 'completed', routeId });
    }
    const events = [
      ['domains', 'domain_opened', 'domainId'], ['traditions', 'tradition_opened', 'traditionId'],
      ['sourceDomains', 'source_opened', 'domainId'], ['sourceTraditions', 'tradition_source_opened', 'traditionId'],
      ['unresolvedDomains', 'unresolved_opened', 'domainId'], ['readingDomains', 'reading_opened', 'domainId']
    ];
    for (const [field, type, key] of events) {
      const allowed = activityFields[field];
      const values = Array.isArray(saved[field]) ? [...new Set(saved[field].filter(allowed))] : [];
      for (const value of values) activity = recordExplorationV2(activity, { type, [key]: value });
    }
    return activity;
  } catch { return initial; }
}

function download(value, filename) {
  const content = typeof value === 'string' ? value : `${JSON.stringify(value, null, 2)}\n`;
  const url = URL.createObjectURL(new Blob([content], { type: 'application/json' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function replayQualification(runtime, session) {
  if (session.modelReleaseVersion === runtime.activeModelReleaseVersion) return null;
  const historical = runtime.modelReleases.find(release => release.releaseVersion === session.modelReleaseVersion);
  const active = runtime.modelReleases.find(release => release.releaseVersion === runtime.activeModelReleaseVersion);
  const oldEngine = historical?.components.find(component => component.key === 'engine_source');
  const newEngine = active?.components.find(component => component.key === 'engine_source');
  if (oldEngine && newEngine && oldEngine.sha256 === newEngine.sha256) return null;
  return oldEngine ? 'different_inference_code' : 'historical_inference_code_unpinned';
}

export default function App() {
  const [runtime, setRuntime] = useState(null);
  const [screen, setScreen] = useState('home');
  const [quiz, setQuizState] = useState(null);
  const quizRef = useRef(null);
  const [summary, setSummary] = useState(null);
  const [activity, setActivity] = useState(initialExplorationV2);
  const activityRef = useRef(activity);
  const [context, setContext] = useState(null);
  const contextRef = useRef(null);
  const [loadedText, setLoadedText] = useState(null);
  const loadedTextRef = useRef(null);
  const [storageConflict, setStorageConflict] = useState(false);
  const [storageAvailable, setStorageAvailable] = useState(true);
  const [autoAdvance, setAutoAdvance] = useState(false);
  const [notice, setNotice] = useState('');
  const [failure, setFailure] = useState('');
  const [booting, setBooting] = useState(true);
  const [replay, setReplay] = useState(null);
  const [clarifyDomain, setClarifyDomain] = useState('ME');
  const [clarificationPlan, setClarificationPlan] = useState(null);
  const timerRef = useRef(null);
  const shownAtRef = useRef(0);
  const setQuiz = value => {
    quizRef.current = value;
    setQuizState(value);
  };
  const setContextValue = value => {
    contextRef.current = value;
    setContext(value);
  };
  const setActivityValue = value => {
    activityRef.current = value;
    setActivity(value);
  };
  const recordActivity = event => {
    try {
      const next = recordExplorationV2(activityRef.current, event);
      setActivityValue(next);
      const sessionId = quizRef.current?.session?.sessionId;
      if (sessionId) localStorage.setItem(activityStorageKey(sessionId), JSON.stringify(next));
    } catch { /* Activity tracking is optional and cannot block results or navigation. */ }
  };

  useEffect(() => {
    let cancelled = false;
    loadRuntime().then(value => {
      if (cancelled) return;
      setRuntime(value);
      try {
        const saved = localStorage.getItem(STORAGE_KEY);
        loadedTextRef.current = saved;
        setLoadedText(saved);
      } catch {
        setStorageAvailable(false);
        setNotice('This browser does not allow local saving. You can still continue and export your answers.');
      }
      document.body.dataset.ready = 'true';
    }).catch(error => {
      if (cancelled) return;
      setFailure(error.message || 'The current instrument could not be loaded.');
      setScreen('failure');
      document.body.dataset.ready = 'true';
    }).finally(() => { if (!cancelled) setBooting(false); });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    const onStorage = event => {
      if ((event.key === STORAGE_KEY || event.key === null) && event.newValue !== loadedTextRef.current) {
        setStorageConflict(true);
        setNotice('Another tab changed this saved quiz. This tab will not overwrite it. Save a backup and reload to see the latest version.');
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  useEffect(() => {
    if (screen !== 'quiz' || !quiz || quiz.index === null) return;
    shownAtRef.current = performance.now();
    document.getElementById('question-title')?.focus({ preventScroll: true });
  }, [screen, quiz?.index, quiz?.packet?.size]);

  useEffect(() => () => { if (timerRef.current !== null) clearTimeout(timerRef.current); }, []);

  function persist(nextQuiz) {
    if (!nextQuiz) return false;
    if (storageConflict) return false;
    const value = JSON.stringify({ experienceVersion: EXPERIENCE_VERSION, quiz: nextQuiz });
    try {
      const latest = localStorage.getItem(STORAGE_KEY);
      if (latest !== loadedTextRef.current) {
        setStorageConflict(true);
        setNotice('Another tab changed this saved quiz. This tab will not overwrite it. Save a backup and reload to see the latest version.');
        return false;
      }
      localStorage.setItem(STORAGE_KEY, value);
      loadedTextRef.current = value;
      setLoadedText(value);
      setStorageAvailable(true);
      return true;
    } catch {
      setStorageAvailable(false);
      setNotice('Browser storage is unavailable. Continue if you wish, and save a copy of your answers before leaving.');
      return false;
    }
  }

  function setActiveContext(nextQuiz, loadedRuntime, chosenPolicy) {
    const activeModel = loadedRuntime.models.get(nextQuiz.packet.evidenceModelVersion) ?? loadedRuntime.model;
    const activeBank = loadedRuntime.banks.get(nextQuiz.session.bankVersion) ?? loadedRuntime.bank;
    const activePilot = loadedRuntime.pilotsByModel.get(activeModel.modelVersion) ?? loadedRuntime.pilot;
    const formPolicy = loadedRuntime.formPolicies.find(policy => policy.policyVersion === nextQuiz.packet.formPolicyVersion) ?? chosenPolicy;
    const activeAffinityCatalog = nextQuiz.affinityCatalogVersion
      ? loadedRuntime.affinitiesByVersion.get(nextQuiz.affinityCatalogVersion) ?? loadedRuntime.affinityCatalog
      : loadedRuntime.affinityCatalog;
    const activeBundle = nextQuiz.session.localization
      ? loadedRuntime.localizationBundlesByVersion.get(nextQuiz.session.localization.bundleVersion) ?? null
      : null;
    const value = {
      runtime: loadedRuntime, model: activeModel, bank: activeBank, pilot: activePilot,
      scalesDoc: loadedRuntime.scalesDoc, formPolicy,
      progressivePolicy: nextQuiz.depth
        ? loadedRuntime.formPolicies.find(policy => policy.policyVersion === nextQuiz.depth.policyVersion)
        : null,
      affinityCatalog: activeAffinityCatalog,
      affinityPilot: activeModel.modelVersion === loadedRuntime.model.modelVersion
        ? loadedRuntime.affinityPilot : activePilot,
      localizationBundle: activeBundle
    };
    setContextValue(value);
    contextRef.current = value;
    return value;
  }

  function startRoute(size) {
    if (!runtime) return;
    if (storageConflict) { setNotice('Reload before starting another quiz because another tab changed the saved attempt.'); return; }
    if (loadedText && !window.confirm('Starting another quiz replaces the saved attempt on this device. Download a backup first if you want to keep it. Continue?')) return;
    const route = runtime.experience.routes.find(entry => entry.size === size);
    const chosenPolicy = runtime.formPolicies.find(policy => policy.policyVersion === route?.formPolicyVersion);
    if (!route || !chosenPolicy) { setNotice('This route is unavailable in the current release.'); return; }
    const selected = runtime.localizationBundles.get('en-US');
    const refs = chosenPolicy.routes?.find(entry => entry.size === size)?.itemRefs ?? chosenPolicy.frozenItems;
    const availability = routeLocalizationAvailability({ bundle: selected, route: { itemRefs: refs }, bank: runtime.bank, scalesDoc: runtime.scalesDoc, model: runtime.models.get(chosenPolicy.modelVersion) });
    if (!availability.available) { setNotice('This route is unavailable in the current wording release.'); return; }
    try {
      const seed = crypto.randomUUID();
      const newQuiz = createQuiz({
        bank: runtime.bank, pilot: runtime.pilot, scalesDoc: runtime.scalesDoc,
        formPolicy: chosenPolicy, seed, size, sessionId: crypto.randomUUID(),
        localizationBundle: selected, localizationCatalogVersion: runtime.current.localizationCatalog.version,
        modelReleaseVersion: runtime.activeModelReleaseVersion, releaseChannel: 'stable'
      });
      setActivityValue(initialExplorationV2());
      const activeBank = runtime.banks.get(newQuiz.session.bankVersion) ?? runtime.bank;
      seekQuestion(newQuiz, activeBank, 0);
      setActiveContext(newQuiz, runtime, chosenPolicy);
      setQuiz(newQuiz);
      setSummary(null);
      setReplay(null);
      setNotice('');
      persist(newQuiz);
      setScreen('quiz');
      setTimeout(() => document.getElementById('quiz')?.scrollIntoView({ block: 'start', behavior: 'instant' }), 0);
    } catch (error) {
      setNotice(error.message || 'This route could not be started.');
    }
  }

  function finish(nextQuiz, isNew = false) {
    const active = contextRef.current;
    if (!active || !nextQuiz) throw new Error('The saved interpretation release is unavailable.');
    if (active.model.engineVersion === 'generic-evidence-3') {
      if (!active.affinityCatalog) throw new Error('The saved affinity catalog is unavailable.');
      if (nextQuiz.affinityCatalogVersion && nextQuiz.affinityCatalogVersion !== active.affinityCatalog.catalogVersion) {
        throw new Error('The saved affinity catalog version does not match this attempt.');
      }
      nextQuiz.affinityCatalogVersion = active.affinityCatalog.catalogVersion;
    }
    recordDepthCheckpoint(nextQuiz);
    persist(nextQuiz);
    const routeId = nextQuiz.depth?.currentRouteId ?? nextQuiz.packet.routeId ?? 'full';
    const previousActivity = activityRef.current?.version === EXPLORATION_VERSION
      ? activityRef.current : initialExplorationV2();
    if (!previousActivity.routes.includes(routeId)) {
      try {
        const nextActivity = recordExplorationV2(previousActivity, { type: 'completed', routeId });
        setActivityValue(nextActivity);
        localStorage.setItem(activityStorageKey(nextQuiz.session.sessionId), JSON.stringify(nextActivity));
      } catch { setActivityValue(initialExplorationV2()); }
    }
    const rawSummary = buildQuizSummary({
      model: active.model, bank: active.bank, scalesDoc: active.scalesDoc,
      session: nextQuiz.session,
      affinityCatalog: active.model.engineVersion === 'generic-evidence-3' ? active.affinityCatalog : null,
      affinityPilot: active.affinityPilot,
      routeManifest: nextQuiz.depth ? active.progressivePolicy : null
    });
    let finalSummary = rawSummary;
    if (active.localizationBundle) {
      const localized = localizeSummary(rawSummary, active.localizationBundle);
      if (!localized.available) throw new Error('The saved English result copy is unavailable.');
      finalSummary = localized.summary;
    }
    const replayState = replayQualification(active.runtime, nextQuiz.session);
    setQuiz(nextQuiz);
    setSummary(finalSummary);
    setReplay(replayState);
    setScreen('results');
    setNotice(isNew ? '' : 'This is the saved result for the same administration.');
    window.scrollTo({ top: 0, behavior: 'instant' });
  }

  function failResult(nextQuiz, error) {
    persist(nextQuiz);
    setQuiz(nextQuiz);
    setFailure(error.message || 'The results could not be created.');
    setScreen('failure');
  }

  function resumeSaved() {
    if (!runtime || !loadedText) return;
    try {
      const envelope = JSON.parse(loadedText);
      if (!COMPATIBLE_EXPERIENCE_VERSIONS.includes(envelope.experienceVersion)) throw new Error('This saved attempt uses another experience release. Keep its backup for a compatible version.');
      const savedBank = runtime.banks.get(envelope.quiz?.session?.bankVersion);
      if (!savedBank) throw new Error('The saved question bank is unavailable. Keep a backup before starting another attempt.');
      const restored = restoreQuiz(envelope.quiz, {
        bank: savedBank, pilot: runtime.pilot, scalesDoc: runtime.scalesDoc,
        formPolicies: runtime.formPolicies,
        localizationBundles: [...runtime.localizationBundlesByVersion.values()],
        localizationCatalogs: runtime.localizationCatalogs,
        modelReleases: runtime.modelReleases
      });
      const chosenPolicy = runtime.formPolicies.find(policy => policy.policyVersion === restored.packet.formPolicyVersion);
      const active = setActiveContext(restored, runtime, chosenPolicy);
      setActivityValue(restoreActivity(restored.session.sessionId));
      setQuiz(restored);
      setNotice('');
      if (restored.session.completionStatus === 'completed') finish(restored, false);
      else {
        seekQuestion(restored, active.bank, restored.index ?? 0);
        persist(restored);
        setScreen('quiz');
      }
    } catch (error) {
      setFailure(`${error.message || 'The saved attempt could not be reopened.'} Your saved data has not been deleted.`);
      setScreen('failure');
    }
  }

  function respond(state, value) {
    const activeQuiz = quizRef.current;
    const active = contextRef.current;
    if (!activeQuiz || !active || timerRef.current !== null) return;
    try {
      answerQuestion(activeQuiz, active.bank, active.scalesDoc, {
        state, value,
        responseTimeMs: Math.max(0, Math.round(performance.now() - shownAtRef.current))
      });
      persist(activeQuiz);
      setQuiz({ ...activeQuiz });
      if (autoAdvance) {
        timerRef.current = setTimeout(() => {
          timerRef.current = null;
          goNext();
        }, 240);
      }
    } catch (error) { setNotice(error.message || 'That answer could not be saved.'); }
  }

  function goNext() {
    const activeQuiz = quizRef.current;
    const active = contextRef.current;
    if (!activeQuiz || !active || activeQuiz.index === null) return;
    try {
      nextQuestion(activeQuiz, active.bank);
      setQuiz({ ...activeQuiz });
      persist(activeQuiz);
      if (activeQuiz.index === null) {
        try { finish(activeQuiz, true); }
        catch (error) { failResult(activeQuiz, error); }
      }
    } catch (error) { setNotice(error.message || 'Answer the current question before moving on.'); }
  }

  function goBack() {
    const activeQuiz = quizRef.current;
    const active = contextRef.current;
    if (!activeQuiz || !active || activeQuiz.index === null) return;
    if (timerRef.current !== null) { clearTimeout(timerRef.current); timerRef.current = null; }
    try {
      previousQuestion(activeQuiz, active.bank);
      setQuiz({ ...activeQuiz });
      persist(activeQuiz);
    } catch (error) { setNotice(error.message || 'The previous question is unavailable.'); }
  }

  const depth = useMemo(() => {
    if (!quiz?.depth || !context?.progressivePolicy || replay) return { available: false, routes: [], domainId: clarifyDomain, setDomainId: setClarifyDomain, clarificationCount: 0 };
    const policy = context.progressivePolicy;
    const currentIndex = policy.routes.findIndex(route => route.id === quiz.depth.currentRouteId);
    const assigned = new Set(quiz.packet.entries.map(entry => entry.itemId));
    const routes = policy.routes.slice(currentIndex + 1).map(route => ({
      routeId: route.id,
      label: route.id === 'standard' ? 'Continue to Standard' : 'Continue to Full',
      count: route.itemRefs.filter(ref => !assigned.has(ref.itemId)).length
    })).filter(route => route.count > 0);
    let plan = null;
    try {
      plan = planWorldviewFollowups({
        model: context.model, bank: context.bank, scalesDoc: context.scalesDoc,
        input: quiz.session, routeManifest: policy,
        allowedItemRefs: policy.routes.at(-1).itemRefs,
        domainId: clarifyDomain, maxItems: policy.clarificationBudget,
        affinityCatalog: context.affinityCatalog
      });
    } catch { plan = null; }
    return {
      available: routes.length > 0 || Boolean(plan?.entries?.length), routes,
      domainId: clarifyDomain, setDomainId: setClarifyDomain,
      clarificationCount: plan?.entries?.length ?? 0,
      clarificationReason: plan?.entries?.length
        ? 'Selected questions target an identified evidence gap, mixed result, or nearby distinction. Their selection reasons remain recorded with the administration.'
        : 'The reviewed planner found no additional question in this topic that would usefully clarify this result.'
    };
  }, [quiz, context, replay, clarifyDomain]);

  function continueRoute(routeId) {
    const activeQuiz = quizRef.current;
    const active = contextRef.current;
    if (!activeQuiz?.depth || !active?.progressivePolicy || replay) return;
    try {
      const outcome = extendProgressiveQuiz({ quiz: activeQuiz, bank: active.bank, policy: active.progressivePolicy, routeId,
        localizationBundle: active.localizationBundle });
      if (!outcome.added) { setNotice('You have already answered the available questions in that route.'); return; }
      const activeBank = active.bank;
      seekQuestion(activeQuiz, activeBank, activeQuiz.index);
      setQuiz({ ...activeQuiz });
      persist(activeQuiz);
      setSummary(null);
      setReplay(null);
      setNotice('Your route has extended. Previous compatible answers are preserved.');
      setScreen('quiz');
    } catch (error) { setNotice(error.message || 'This route could not be started. Your previous result is still available.'); }
  }

  function clarify(domainId) {
    const activeQuiz = quizRef.current;
    const active = contextRef.current;
    if (!activeQuiz?.depth || !active?.progressivePolicy || replay) return;
    try {
      const plan = planWorldviewFollowups({
        model: active.model, bank: active.bank, scalesDoc: active.scalesDoc,
        input: activeQuiz.session, routeManifest: active.progressivePolicy,
        allowedItemRefs: active.progressivePolicy.routes.at(-1).itemRefs,
        domainId, maxItems: active.progressivePolicy.clarificationBudget,
        affinityCatalog: active.affinityCatalog
      });
      if (!plan.entries.length) { setNotice('No additional reviewed question is justified for this topic.'); return; }
      extendProgressiveQuiz({ quiz: activeQuiz, bank: active.bank, policy: active.progressivePolicy,
        plan, localizationBundle: active.localizationBundle });
      seekQuestion(activeQuiz, active.bank, activeQuiz.index);
      setQuiz({ ...activeQuiz });
      persist(activeQuiz);
      setSummary(null);
      setReplay(null);
      setNotice(`Optional clarification started. ${plan.entries.length} question${plan.entries.length === 1 ? '' : 's'} were selected for a recorded evidence reason.`);
      setScreen('quiz');
    } catch (error) { setNotice(error.message || 'Clarification could not start. Your saved answers remain available.'); }
  }

  function pause() {
    if (timerRef.current !== null) { clearTimeout(timerRef.current); timerRef.current = null; }
    persist(quizRef.current);
    setScreen('home');
    setNotice('Your attempt is saved on this device. Continue when you are ready.');
    window.scrollTo({ top: 0, behavior: 'instant' });
  }

  function stopAtResults() {
    setNotice('You chose to keep this result. Your answers remain saved on this device.');
    setScreen('home');
    window.scrollTo({ top: 0, behavior: 'instant' });
  }

  function discardSaved() {
    if (storageConflict) { setNotice('Reload before deleting the saved attempt because another tab changed it.'); return; }
    if (!window.confirm('Delete the saved questionnaire and raw answers from this browser?')) return;
    try {
      if (localStorage.getItem(STORAGE_KEY) !== loadedTextRef.current) {
        setStorageConflict(true);
        setNotice('Another tab changed the saved attempt. Reload before deleting it.');
        return;
      }
      localStorage.removeItem(STORAGE_KEY);
      loadedTextRef.current = null;
      setLoadedText(null);
      setQuiz(null);
      quizRef.current = null;
      setSummary(null);
      setNotice('The saved attempt was deleted from this browser.');
    } catch { setNotice('This browser could not delete the saved attempt.'); }
  }

  function exportAnswers() {
    const activeQuiz = quizRef.current;
    if (activeQuiz) download(activeQuiz.session, 'worldview-answers.json');
  }

  function exportSummary() {
    if (summary && !replay) download(summary, 'worldview-summary.json');
  }

  if (booting) return <main className="ed wvs-app wvs-loading"><div className="e-wrap"><p className="e-eyebrow">Loading the current release</p><h1>Preparing your<br /><span className="e-accent">worldview map</span></h1><p role="status">Loading the versioned questionnaire and interpretation rules.</p></div></main>;

  if (screen === 'failure') return <main className="ed wvs-app"><div className="e-wrap wvs-failure">
    <p className="e-eyebrow">A momentary problem</p><h1>We could not open<br />this quiz.</h1><p role="alert">{failure}</p>
    <p>Your saved answers have not been deleted.</p>
    {quizRef.current && <button className="e-btn e-btn-primary" type="button" onClick={exportAnswers}>Save raw answers</button>}
    <button className="e-btn e-btn-ghost" type="button" onClick={() => { setFailure(''); setScreen('home'); }}>Return to home</button>
  </div></main>;

  if (screen === 'quiz' && quiz && context) {
    const canonical = currentItem(quiz, context.bank);
    const scale = context.scalesDoc.scales.find(entry => entry.id === canonical?.responseScaleId);
    const realized = context.localizationBundle ? localizeItem(context.localizationBundle, canonical, scale) : null;
    const item = { ...(realized?.item ?? canonical),
      domainLabel: context.model.domains.find(domain => domain.id === canonical?.domainId)?.name ?? canonical?.domainId,
      specialLabels: realized?.specialStates ?? specialStateNames };
    const displayScale = realized?.scale ?? scale;
    const prior = quiz.session.responses.find(response => response.itemId === item.id);
    const progress = quizProgress(quiz);
    return <main id="main" className="ed wvs-app wvs-question-screen" data-screen="quiz">
      <header className="e-nav"><div className="e-wrap"><a className="e-logo" href="#" onClick={event => { event.preventDefault(); pause(); }}><b>Worldview</b><span> Sorter</span></a>
        <button id="pause" className="wvs-text-button" type="button" onClick={pause}>Pause and return later</button></div></header>
      <div id="quiz" className="e-wrap wvs-question-wrap" data-item-id={item.id} data-response-type={item.responseType} data-scale={item.responseScaleId}>
        <ProgressHeader current={quiz.index + 1} total={quiz.packet.size} done={progress.done} skipped={progress.skipped} />
        <div className="wvs-question-stage">
          <QuestionCard key={`${item.id}:${quiz.index}`} item={item} scale={displayScale} prior={prior}
            seed={quiz.session.randomizationSeed} index={quiz.index} onRespond={respond} />
          <div className="wvs-question-navigation">
            <button id="back" className="e-btn e-btn-ghost" type="button" disabled={!quiz.session.presentedItems.some(entry => entry.index < quiz.index && entry.presented && !entry.skippedByBranch)} onClick={goBack}>Back</button>
            <label className="wvs-auto-advance"><input id="auto" type="checkbox" checked={autoAdvance} onChange={event => setAutoAdvance(event.target.checked)} /> Advance after I answer</label>
            <button id="next" className="e-btn e-btn-primary" type="button" disabled={!prior} onClick={goNext}>Next question</button>
          </div>
          <div className="wvs-quiet-actions"><button className="wvs-text-button" type="button" onClick={pause}>Pause and return later</button>
            <button className="wvs-text-button" type="button" onClick={exportAnswers}>Save raw answers</button>
            <span className="wvs-note">{storageConflict ? 'Not saved · another tab changed this attempt' : storageAvailable ? 'Saved on this device' : 'Local saving unavailable · export a backup'}</span>
          </div>
          {notice && <p className="wvs-inline-notice" role="status">{notice}</p>}
        </div>
      </div>
    </main>;
  }

  if (screen === 'results' && quiz && context && summary) return <ResultsView runtime={runtime} quiz={quiz} summary={summary} activity={activity} onActivity={recordActivity}
    replayQualification={replay} depth={depth} onContinueRoute={continueRoute} onClarify={clarify}
    onStop={stopAtResults} onSaveAnswers={exportAnswers} onSaveSummary={exportSummary}
    onRestart={() => { setScreen('home'); window.scrollTo({ top: 0, behavior: 'instant' }); }} />;

  const experienceRoutes = runtime?.experience.routes ?? [];
  const savedSession = (() => { try { return loadedText ? JSON.parse(loadedText).quiz.session : null; } catch { return null; } })();
  if (screen === 'routes') return <RouteChooser routes={experienceRoutes} notice={notice}
    onBack={() => setScreen('home')} onStart={startRoute} />;

  return <HomeScreen loadedText={loadedText} savedSession={savedSession} storageConflict={storageConflict} notice={notice}
    onOpenChooser={() => { setNotice(''); setScreen('routes'); window.scrollTo({ top: 0, behavior: 'instant' }); }}
    onResume={resumeSaved}
    onDownloadBackup={() => loadedText && download(loadedText, 'worldview-local-backup.json')}
    onDiscardSaved={discardSaved} />;
}
