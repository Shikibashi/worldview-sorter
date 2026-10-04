# GitHub Pages production deployment

Production is `https://worldview.edriffles.us/`. Build and validate locally; do not use GitHub Actions. Publish only the verified `dist/pages/` artifact to the root of the `gh-pages` branch and configure Pages for branch publishing (`build_type: legacy`, source `gh-pages:/`). A source push is not a deployment. Existing Actions workflows must remain disabled.

## Local verification

Run `npm test`, `npm run build:production`, `node scripts/verify-production-site.mjs`, `npm run test:quiz:browser`, `npm run test:production:browser`, and `npm run test:tradition-explorer:browser`. Install Playwright Chromium before browser checks. For model release 1.21.0, Quick/Standard/Full contain 64/120/253 questions.

The build must run after the source commit so `dist/pages/deployment.json` records the exact commit. Verify model, bank, route and affinity versions. For successor releases also run `scripts/release-successor.mjs --plan <plan> --verify --base <pre-release-main>` to establish byte-for-byte reproduction.

## Artifact boundary

Only publish the contents of `dist/pages/`, with `.nojekyll` and a `CNAME` containing `worldview.edriffles.us`. Never publish the repository root, `apps/server/`, `apps/web/`, private storage, research exports, secrets, scripts, or runtime receipts. The production verifier checks the allowed public boundary. Retain versioned model data needed for saved historical administrations.

Static mode disables API configuration requests, research submission, feedback and product-event collection. Answers remain in local browser storage unless explicitly exported or shared. GitHub Pages may retain ordinary hosting request logs.

## Promotion

Commit the reviewed source on `main` and push without triggering Actions. Build and verify that exact commit locally. Create an artifact-only commit on `gh-pages`, preserving its existing history when present; never force-push over another deployment. Configure Pages through the repository Pages API with `build_type: legacy` and source branch `gh-pages`, path `/`. Request a Pages build if needed through the Pages builds API, not an Actions dispatch.

Keep the custom domain and HTTPS enforcement enabled. DNS must resolve `worldview.edriffles.us` to `shikibashi.github.io` using an unproxied CNAME.

## Live verification and rollback

After Pages reports a successful build, fetch the public `deployment.json` and verify its source commit and release versions, not just the HTTP status. Check the root page and current versioned data, and verify that `/apps/server/`, `/apps/web/`, `/.data/`, `/api/`, and `/scripts/` are unavailable. Run production browser flows against the public origin when supported. Record any unrun live checks.

Rollback by rebuilding a known-good source commit and publishing its complete verified artifact in a new `gh-pages` commit. Preserve historical evidence files. Never edit frozen model or questionnaire artifacts to repair hosting. Deployment does not migrate or recover users' local answers.
