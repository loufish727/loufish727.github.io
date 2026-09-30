# MaintainOps Public Front Door

Static public introduction at https://loufish727.github.io/.
The operational app remains a separate project at /MaintainOps/.

## Local Review

Open index.html in a browser. The site has no build step, backend, login, analytics,
or runtime dependencies. App links deliberately open the live app; they do not
connect the landing page to company data. No application files were changed.

`npm ci` then `npm test` runs desktop/mobile browser, keyboard, accessibility,
asset-size, link, file rendering, and scoped-worker-retirement checks.
Test screenshots are in test-results. The test server closes automatically.

The product tour uses screenshots rendered from MaintainOps components with
synthetic example records. It does not contain production records or identities.
Regenerate with `npm run capture:product -- PATH_TO_MAINTAINOPS_REPO`.
See docs/ASSETS.md for artwork, font licensing, and screenshot provenance.

Existing unrelated project paths remain on disk but are not advertised here.
The legacy root worker is retired without deleting other apps' caches or workers.

## Publishing

Commit the static files to this repository, then use the repository's GitHub Pages
deployment. No MaintainOps database, storage bucket, app deployment, or secret is
needed. Local verification is not proof of a production deployment.
