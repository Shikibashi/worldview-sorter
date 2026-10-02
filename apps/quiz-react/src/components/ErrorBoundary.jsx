import { Component } from 'react';

/**
 * Adapted from the user-owned Shikibashi/12axes React app boundary. It keeps a
 * rendering failure recoverable without logging or transmitting answer data.
 */
export default class ErrorBoundary extends Component {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  render() {
    if (!this.state.failed) return this.props.children;
    let mayHaveSavedAttempt = false;
    try { mayHaveSavedAttempt = Boolean(localStorage.getItem('worldview-sorter:quiz-experience:1')); } catch { /* Storage may be disabled. */ }
    return (
      <main className="ed wvs-app app-shell wvs-failure" data-screen="failure">
        <div className="e-wrap">
          <p className="e-eyebrow">A momentary problem</p>
          <h1>We could not show<br /><span className="e-accent">this part of your map.</span></h1>
          <p role="alert">The page encountered an unexpected error. No answer data was sent.</p>
          <p>{mayHaveSavedAttempt ? 'Your saved attempt may still be available in this browser.' : 'Your browser does not show a saved attempt.'}</p>
          <button className="e-btn e-btn-primary" type="button" onClick={() => window.location.reload()}>Reload the page</button>
        </div>
      </main>
    );
  }
}
