# GitHub Pages production deployment

The public site is intended to be a static artifact at `https://worldview.edriffles.us/`. The default `main` branch is the production source; the draft `construct-registry-v0.1` branch is not a deployment trigger. The [Pages workflow](../.github/workflows/deploy-pages.yml) checks out the triggering commit, runs model and browser validation, builds `dist/pages/`, verifies its file boundary, uploads the artifact, and deploys through the `github-pages` environment. Manual dispatch is allowed only on `main`.

## Build and artifact

Run `npm ci`, `npm test`, `npm run build:production`, `node scripts/verify-production-site.mjs`, and `npm run test:production:browser`. Install Playwright Chromium before the browser test. The static test uses synthetic answers and serves the assembled artifact, including the custom-domain root. It completes the actual 64, 120, and 245 item routes, checks local pause/resume, result generation, source links, exports, sharing preview, accessibility, mobile zoom, reduced motion, and absence of collector requests.

The artifact contains a generated root `index.html`, the quiz and snapshot viewer, their browser module import graph, exact runtime data references (including historical models needed by saved administrations), selected public documents, and `deployment.json`. The latter identifies the Git commit, application, item bank, model, route, result semantics, and affinity versions. The builder starts with an empty output directory and rejects unexpected module imports. The verifier rejects server, development UI, private data, research exports, scripts, fixtures, symlinks, and unapproved paths. Neither the repository root nor `apps/server/` is published.

Static mode is marked in the generated HTML. It disables API configuration requests, research upload, feedback, product events, and old research-receipt controls. Raw answers remain in local browser storage until the user exports them or deliberately shares a selected snapshot. GitHub Pages still receives ordinary page requests; operator-side request logging and retention must be reviewed in GitHub's service terms. The public site has no account or server-side answer store.

## Domain and HTTPS

Configure the repository Pages source as **GitHub Actions** and set the Pages custom domain to `worldview.edriffles.us` in repository settings or the Pages API. At the authoritative DNS provider create an unproxied CNAME:

```text
worldview.edriffles.us.  CNAME  shikibashi.github.io.
```

A `CNAME` file in the artifact is not the configuration mechanism for an Actions-based Pages site. Protect the `github-pages` environment so only `main` can deploy. After DNS propagates and GitHub provisions its certificate, enable **Enforce HTTPS** in Pages settings. Verify the public CNAME, valid certificate, HTTP-to-HTTPS behavior, root page, versioned JSON and modules, browser console/network, result generation, exports, mobile layout, and 404 responses for `/apps/server/`, `/.data/`, `/api/`, and `/scripts/`. A green workflow alone does not establish a working custom domain.

## Promotion and rollback

Promote a reviewed, green commit to `main`; do not dispatch production from a draft branch. Record its commit SHA and `deployment.json` with the release note. A previous known-good `main` commit can be redeployed by reverting or restoring its complete code/content bundle on `main`, then running the same Pages workflow. Keep any historical model files needed by existing local saves. Never edit a frozen item, rule, route, or model manifest to repair hosting. A Pages-only fix changes the build/workflow or static shell while leaving philosophical inputs untouched.

The deployment does not migrate or recover local browser answers. Encourage users to export a backup before clearing storage or switching devices. If the release is broken, stop promotion, preserve the failing workflow and public response evidence, restore the prior verified commit, and confirm the public domain and core flow again.
