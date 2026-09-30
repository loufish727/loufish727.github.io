# Public Front Door Verification

Scope: the separate public-site repository only. No MaintainOps app source,
company data, database, permissions, credentials, or storage changed.

## September 30, 2026 Local Evidence

`npm test` passed in Chromium and WebKit at 320x568, 390x844, 768x1024,
844x390, 1024x768, 1440x900, and 1920x1080. Physical phones were not tested.

- First viewport shows the MaintainOps brand and a hint of the next section.
- No horizontal page overflow or clipped headings, text, or controls.
- Oxanium and Manrope load locally in both engines. The wordmark remains visible
  at 320 and 390 pixels with both font downloads blocked, and hero text/control
  rows do not overlap. Combined font weight is 38,880 bytes, below the 45 KB budget.
- Hero and three app previews load; each preview is visibly sample data.
- The abstract-metal hero replaces the literal machinery illustration. Tests
  check the desktop/mobile image selection and the approved tagline,
  "Keeping operations strong," including the social-sharing title.
- Tabs work by pointer and keyboard, including arrow keys, Home and End.
- All visible links/buttons have at least 44x44-pixel targets.
- All internal anchors and image links resolve. App buttons target /MaintainOps/.
- Axe reports zero violations for WCAG A/AA, WCAG 2.1 AA and best-practice checks
  at 390 and 1440 pixels in both engines. This is not an accessibility certification.
- JavaScript-disabled visitors see all three previews, with inactive tab controls
  hidden. Local-file previews also load and tab correctly.
- The page makes no third-party, analytics, authentication, or database requests.
- Root service-worker retirement preserves sibling app registrations; the retired
  worker no longer clears origin-wide caches. Tests do not modify live workers.
- No SimpleCart link or visible reference remains on the public page. The legacy
  app files remain untouched and accessible at their existing path.
- Public asset budgets passed. The landing-page script is under 4 KB, with no
  runtime library or framework. Product previews range from 70 to 102 KB each.
  Abstract hero artwork is 103 KB on desktop and 25 KB on mobile (decimal KB).
- `npm install` reported zero dependency vulnerabilities.

Local screenshots and machine-readable evidence are generated into test-results
and excluded from source control. Deployment status is verified separately after
publishing; these local results alone do not establish that the site is live.

The app's Strict LFES command is not copied into this independent static site.
These are risk-scoped public-site checks, not a claim that authenticated application
flows or a production deployment were rerun.
