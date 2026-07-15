"use client";

import { useEffect, useRef, useState } from "react";

// Lovable-style template previews: a thumbnail grid where every card opens a
// modal with the LIVE deck (real iframe, arrow-key navigable, auto-play) —
// not a screenshot of the product, the product. Native <dialog> gives us
// focus containment, ESC, and backdrop dismissal for free.

export type GalleryTemplate = { id: string; name: string; blurb: string };

export function TemplateGallery({ templates }: { templates: GalleryTemplate[] }) {
  const [open, setOpen] = useState<GalleryTemplate | null>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const d = dialogRef.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);

  return (
    <>
      <ul className="lp-tgrid">
        {templates.map((t, i) => (
          <li key={t.id}>
            <button type="button" className="lp-tcard" onClick={() => setOpen(t)}>
              <span className="lp-tthumb">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={`/templates/${t.id}.png`} alt="" loading="lazy" width={1280} height={720} />
                <span className="lp-tthumb-hint" aria-hidden="true">Preview ↗</span>
              </span>
              <span className="lp-tmeta">
                <span className="lp-tnum" aria-hidden="true">{String(i + 1).padStart(2, "0")}</span>
                <strong>{t.name}</strong>
                <span className="lp-tblurb">{t.blurb}</span>
              </span>
              <span className="lp-vh">Preview the {t.name} template</span>
            </button>
          </li>
        ))}
      </ul>

      <dialog
        ref={dialogRef}
        className="lp-tdialog"
        aria-label={open ? `${open.name} template preview` : "Template preview"}
        onClose={() => setOpen(null)}
        onClick={(e) => {
          // Backdrop click: the dialog element itself is the target only when
          // the click lands outside the inner panel.
          if (e.target === dialogRef.current) setOpen(null);
        }}
      >
        {open ? (
          <div className="lp-tdialog-panel">
            <div className="lp-tdialog-bar">
              <strong>
                {open.name} <span className="lp-tdialog-blurb">— {open.blurb}</span>
              </strong>
              <span className="lp-tdialog-actions">
                <a href={`/api/demo/deck?source=sample&template=${open.id}`} target="_blank" rel="noopener">
                  Open full screen ↗
                </a>
                <button type="button" onClick={() => setOpen(null)} aria-label="Close preview">
                  ✕
                </button>
              </span>
            </div>
            <iframe
              className="lp-tdialog-frame"
              src={`/api/demo/deck?source=sample&template=${open.id}&autoplay=1`}
              title={`${open.name} template — live sample deck`}
            />
            <p className="lp-tdialog-hint">A live deck from sample data — arrow keys move between slides.</p>
          </div>
        ) : null}
      </dialog>
    </>
  );
}
