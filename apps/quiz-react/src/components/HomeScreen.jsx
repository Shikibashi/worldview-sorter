/**
 * Home flow adapted from the user-owned Shikibashi/12axes React experience.
 * The example is deliberately categorical and fictional; no 12Axes result
 * scoring or profile data is used here.
 */
export default function HomeScreen({
  loadedText,
  savedSession,
  storageConflict,
  notice,
  onOpenChooser,
  onResume,
  onDownloadBackup,
  onDiscardSaved
}) {
  return (
    <main id="main" className="ed wvs-app app-shell wvs-home" data-screen="home">
      <header className="e-nav">
        <div className="e-wrap">
          <a className="e-logo" href="#top" aria-label="Worldview Sorter home"><b>Worldview</b><span> Sorter</span></a>
          <nav className="e-nav-links" aria-label="Main navigation">
            <a href="#example">Example result</a>
            <a href="#method">How it works</a>
          </nav>
        </div>
      </header>

      {notice && <div className="e-wrap"><p className="wvs-inline-notice" role="status">{notice}</p></div>}

      {loadedText && (
        <section className="e-wrap wvs-saved-panel" aria-labelledby="saved-title">
          <div>
            <p className="e-eyebrow">Saved on this device</p>
            <h2 id="saved-title">{savedSession?.completionStatus === 'completed' ? 'Your completed map is ready' : 'Your quiz is waiting for you'}</h2>
            <p>{savedSession?.completionStatus === 'completed' ? 'Reopen the same administration and its pinned model.' : 'Continue from the last saved question.'}</p>
          </div>
          <div className="wvs-saved-actions">
            <button id="resume" className="e-btn e-btn-primary" type="button" disabled={storageConflict} onClick={onResume}>Continue saved attempt</button>
            <button className="e-btn e-btn-ghost" type="button" onClick={onDownloadBackup}>Download backup</button>
            <button className="wvs-text-button" type="button" onClick={onDiscardSaved}>Delete saved attempt</button>
          </div>
        </section>
      )}

      <section className="e-hero" id="top">
        <div className="e-wrap">
          <div className="wvs-home-copy">
            <p className="e-eyebrow">A field guide to your philosophical outlook</p>
            <h1>Explore what<br /><span className="e-accent">holds your views together.</span></h1>
            <p className="e-lead">Answer questions about knowledge, ethics, reality, and social life. See what your answers support, where they differ, and what remains open.</p>
            <div className="e-hero-actions">
              <button id="choose-route" className="e-btn e-btn-primary" type="button" onClick={onOpenChooser}>Choose your route <span aria-hidden="true">→</span></button>
              <a className="e-btn e-btn-ghost" href="#example">See what results look like</a>
            </div>
            <ul className="e-hero-labels"><li>No identity label</li><li>No timer</li><li>Pause whenever you like</li><li>Answers stay on this device</li></ul>
          </div>
          <div className="wvs-example-card example-result" aria-label="Illustrative result preview, not your prediction">
            <p className="e-hero-example-label">Illustrative example with fictional answers</p>
            <div className="wvs-example-main"><span className="wvs-state wvs-state-supported">Supported</span><h2>One position can be clear</h2>
              <p>Some answers support a specific view of moral obligation.</p></div>
            <div className="wvs-example-split"><div><span className="wvs-state wvs-state-mixed_context_dependent">Mixed</span><p>Responsibility may depend on context.</p></div>
              <div><span className="wvs-state wvs-state-not_measured">Not measured</span><p>A short route may leave the philosophy of mind open.</p></div></div>
            <p className="wvs-note">Fictional example. Your result uses only the questions you answered.</p>
          </div>
        </div>
      </section>

      <section className="e-sec e-dark" id="example">
        <div className="e-wrap">
          <div className="e-sec-head"><p className="e-eyebrow">What your answers produce</p><h2>A map, not a label</h2>
            <p className="e-lead">Results describe specific philosophical positions. They keep clear, mixed, insufficient, and unmeasured evidence separate.</p></div>
          <ol className="e-steps">
            <li className="e-step"><span className="e-n">01</span><h3>See the overview</h3><p>Scan a categorical map across twelve domains. It is not a set of artificial percentages.</p></li>
            <li className="e-step"><span className="e-n">02</span><h3>Open the evidence</h3><p>Inspect the answers, distinctions, limitations, and sources behind an interpretation.</p></li>
            <li className="e-step"><span className="e-n">03</span><h3>Choose what comes next</h3><p>Stop, explore a tension, compare traditions, or answer targeted follow-up questions.</p></li>
          </ol>
          <div className="e-ex-foot"><p>Choose how much depth you want. You can stop after any route.</p><button className="e-btn e-btn-light" type="button" onClick={onOpenChooser}>View routes <span aria-hidden="true">→</span></button></div>
        </div>
      </section>

      <section className="e-sec wvs-method" id="method">
        <div className="e-wrap wvs-method-grid">
          <div><p className="e-eyebrow">A research-informed exploration</p><h2>Interpretation stays tied to evidence.</h2></div>
          <div>
            <p>This is an exploratory philosophical questionnaire, not a validated psychological assessment. The authored model has not been tested for population norms, reliability, or equivalent performance across groups.</p>
            <p>Answers are stored in your browser. They are not sent to an account or research server. You can export or deliberately share selected results.</p>
            <p>Neutral, no view, insufficient evidence, mixed answers, and not measured are different outcomes. Missing questions do not count as agreement.</p>
            <p><a href="./docs/QUIZ_EXPERIENCE.md">How the questionnaire works</a> · <a href="./docs/BETA_KNOWN_LIMITATIONS.md">Current limitations</a></p>
          </div>
        </div>
      </section>
      <footer className="e-foot"><div className="e-wrap"><span>Worldview Sorter</span><p>Curiosity, not a verdict.</p></div></footer>
    </main>
  );
}
