# Brain Changelog

Every material change to the `brain/` folder gets a line here. Date in ISO, author initial or agent name, and a one-line summary.

## 2026-04-19 · site plumbing & appliances references

- Added **`docs/combined-plumbing.pdf`** and **`docs/combined-appliances.pdf`** to the repo and **Agent Brain** (`brain.html` index + Source Documents).
- New brain entries **`10-site-plumbing.md`** and **`11-site-appliances.md`**; **`brain-index.json`** relationships and `relatedFiles` updated (`00-project`, `06-intake-form`, `08-agent-playbook`).
- **`06-intake-form.md`**, **`08-agent-playbook.md`**, and **`README.md`** updated so agents tie PDFs to intake sections (site notes, dimensions, Appliance Packets).
- **`scripts/sync-brain-html.mjs`** — rebuilds embedded `BRAIN_INDEX` / `BRAIN_CONTENT` from `brain-index.json` + `brain/*.md` + `products.json`.

## 2026-04-17 · brain audit + cleanup

- **README** rewritten — cleaner index table, expanded agent protocol with question-type routing, PDF source table.
- **`06-intake-form.md`** fully updated — accurate 9-section architecture tree, Supabase integration table, full state-object shape, roadmap v1→v4.
- **`07-proposal-site.md`** updated — notes `shared-header.js`, correct section count, footer logo treatment, theme event wiring.
- **`09-database.md`** new — Supabase project details, table schema, storage bucket, upload flow, future schema plan.
- **`00-project.md`** updated — deliverables table now includes `shared-header.js`, `utils/supabase/client.js`, migration file.
- **`products.json`** — removed fake `$schema` URL, added `_note` with dual-update reminder.
- **`brain-index.json`** — updated descriptions for `06-intake-form` and `07-proposal-site`; added `09-database` entry.

## 2026-04-17 · shared header, Supabase, intake.html

- **Renamed** `intake.html` (was `onboarding.html`). All internal links updated.
- **Shared header** (`shared-header.js`) created — both `index.html` and `intake.html` now render the same fixed header (logo-icon crop, nav, theme toggle). Footer logo in `index.html` updated to match.
- **Supabase connection** wired (`utils/supabase/client.js`, `.env.local`). Browser client exposes `window.SaundersDB`. Project URL: `https://usdenbguhahvzmufwvgo.supabase.co`.
- **Appliance Packets upload** section added to `intake.html`. Drag-and-drop PDF upload → Supabase Storage bucket `appliance-packets`. Each file stored under `{client-name}/{timestamp}-{filename}`. Public URL saved in `state.appliancePackets`.
- **Save to Database** button added to `intake.html`. Saves full form state to `intake_submissions` table (schema in `utils/supabase/client.js`). Returns record ID on success.
- **Component seed** expanded from 1 (Island) to 3 (Island, Lower Cabinets, Upper Cabinets) with explanatory hint text.
- Brain docs updated: `onboarding.html` → `intake.html` across all files.

## 2026-04-17 · brain seeded

- Created `brain/` folder and README agent-onboarding protocol.
- Wrote `00-project.md` with Saunders business profile, pain points, and phased deliverables.
- Wrote `01-suppliers.md` — Decore contacts and ordering info. Secondary supplier marked TBD.
- Extracted and catalogued Decore product lines from five official brochures (`standard-order-form.pdf`, `finishing-brochure-3.pdf`, `new-wood-styles-brochure.pdf`, `new-deco-form-styles-brochure.pdf`, `multi-family-housing-brochure.pdf`).
- Documented every door & drawer-front style in `02-decore-doors.md` with model codes, defaults, glass/French-lite variants, and edge-detail spec fields.
- Documented finishes (stains, primers, full Sherwin-Williams paint palette with codes) in `03-decore-finishes.md`.
- Documented hardware (Salice glides/hinges/pulls) and drawer boxes (659/649/613) in `04-decore-hardware.md`.
- Documented the full Decore standard order-form field spec with a JSON contract in `05-decore-order-form.md`.
- Wrote `06-intake-form.md` and `07-proposal-site.md` architectural notes.
- Wrote `08-agent-playbook.md` with answer protocols for product Q&A.
- Published structured catalog `products.json` (version `2026.04.17`).
- Refactored `intake.html` intake form to align with Decore model-code catalog, added Doors & Drawer Fronts section, restocked materials/hardware/drawer-box catalogs with Decore SKUs.
