# Legacy — Saunders Wood Works era

Quarantined 2026-07-14 as Phase 0 of the SP redesign (see `../docs/SP-REDESIGN-PLAN.md` in the outer folder, or `docs/OPUS4_BRIEF.md` for the original studio brief).

Everything in here belongs to the original Saunders Wood Works consulting engagement and the
first-generation static pages: the published strategy page, the intake/monday/brain tools,
their assets (`gate.js`, `shared-header.js`, `mapbox-config.js`, `icons/`, `utils/`, images),
the `brain/` knowledge base, and the supplier catalog PDFs (`docs/`).

Still live: `saunders.strategypresentation.com` is served from
`legacy/saunders-strategy.html` via the host rewrite in `../vercel.json`. Old top-level URLs
(`/intake.html`, `/monday.html`, `/brain.html`, `/brain-editor.html`) are also rewritten here.

Related but NOT moved (still referenced by CI): `supabase/functions/mapbox-geocode/` and
`.github/workflows/deploy-mapbox-geocode.yml` — the geocoding edge function used by
`legacy/intake.html`. Retire those together if/when the Saunders intake page is sunset.

Do not build new work on anything in this directory.
