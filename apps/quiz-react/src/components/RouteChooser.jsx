/** Adapted from the user's Shikibashi/12axes depth-choice screen. */
export default function RouteChooser({ routes, notice, onBack, onStart }) {
  return (
    <main id="main" className="ed wvs-app app-shell" data-screen="variant">
      <header className="e-nav">
        <div className="e-wrap">
          <a className="e-logo" href="#home" onClick={event => { event.preventDefault(); onBack(); }} aria-label="Worldview Sorter home"><b>Worldview</b><span> Sorter</span></a>
          <button className="wvs-text-button" type="button" onClick={onBack}>← Back to home</button>
        </div>
      </header>
      <section className="e-fmt" id="route-chooser" aria-labelledby="route-title">
        <div className="e-wrap">
          <p className="e-eyebrow">Choose your depth</p>
          <h1 id="route-title">How far would you<br /><span className="e-accent">like to explore?</span></h1>
          <p className="e-lead">Every route gives you a useful starting map. Shorter routes leave more distinctions unmeasured; you can continue later using the same answers.</p>
          <ul className="e-fmt-grid">
            {routes.map((route, index) => (
              <li className={route.recommended ? 'e-fmt-card e-hi' : 'e-fmt-card'} key={route.id}>
                <div className="e-fmt-top">
                  <span className="e-fmt-tag">{route.label}</span>
                  {route.recommended && <span className="e-rec">Recommended</span>}
                </div>
                <p className="e-fmt-num"><strong>{route.size}</strong> questions</p>
                <p className="e-fmt-desc">{route.description}</p>
                <p className="e-fmt-meta"><span>Depth {index + 1} of {routes.length}</span><span>Evidence scope expands by route</span></p>
                <button className={`e-btn route ${route.recommended ? 'e-btn-light' : 'e-btn-primary'}`} type="button" data-size={route.size}
                  onClick={() => onStart(route.size)}>Start {route.label.replace(' exploration', '').replace(' pilot', '')} <span aria-hidden="true">→</span></button>
              </li>
            ))}
          </ul>
          <ul className="e-fmt-note">
            <li>Stop after any route</li><li>Resume later on this device</li><li>Continue without repeating saved answers</li>
          </ul>
          <p className="wvs-note">Question counts and route descriptions come from the active release. A shorter route does not provide the same evidence as Full.</p>
          {notice && <p className="wvs-inline-notice" role="status">{notice}</p>}
        </div>
      </section>
    </main>
  );
}
