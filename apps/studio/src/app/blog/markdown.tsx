// ============================================================
//  SP Blog — constrained markdown renderer (server-side)
//  apps/studio/src/app/blog/markdown.tsx
//
//  Posts are typed TS modules with a small, predictable markdown
//  dialect — this renders it to React elements with zero deps:
//    ## / ###        h2 / h3 (h2 gets a slug id for anchors)
//    - item          unordered list
//    1. item         ordered list
//    > quote         blockquote
//    ---             hr
//    inline          **bold** · *italic* · `code` · [text](href)
//  Anything else is a paragraph. Deck-sample links (/api/demo/…)
//  open in a new tab so the reader doesn't lose the article.
// ============================================================

import type { ReactNode } from "react";

export function headingId(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");
}

const INLINE = /(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`|\[[^\]]+\]\([^)\s]+\))/g;

function renderInline(text: string, keyPrefix: string): ReactNode[] {
  const out: ReactNode[] = [];
  let last = 0;
  let i = 0;
  for (const match of text.matchAll(INLINE)) {
    const token = match[0];
    const start = match.index ?? 0;
    if (start > last) out.push(text.slice(last, start));
    const key = `${keyPrefix}-${i++}`;
    if (token.startsWith("**")) {
      out.push(<strong key={key}>{token.slice(2, -2)}</strong>);
    } else if (token.startsWith("*")) {
      out.push(<em key={key}>{token.slice(1, -1)}</em>);
    } else if (token.startsWith("`")) {
      out.push(<code key={key}>{token.slice(1, -1)}</code>);
    } else {
      const closeBracket = token.indexOf("](");
      const label = token.slice(1, closeBracket);
      const href = token.slice(closeBracket + 2, -1);
      const external = href.startsWith("http") || href.startsWith("/api/");
      out.push(
        <a
          key={key}
          href={href}
          {...(external ? { target: "_blank", rel: "noopener" } : {})}
        >
          {label}
        </a>,
      );
    }
    last = start + token.length;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

export function Markdown({ source }: { source: string }) {
  const blocks = source
    .split(/\n{2,}/)
    .map((b) => b.trim())
    .filter(Boolean);

  return (
    <>
      {blocks.map((block, bi) => {
        const key = `b${bi}`;
        if (block === "---") return <hr key={key} />;
        if (block.startsWith("### ")) {
          const text = block.slice(4);
          return <h3 key={key}>{renderInline(text, key)}</h3>;
        }
        if (block.startsWith("## ")) {
          const text = block.slice(3);
          return (
            <h2 key={key} id={headingId(text)}>
              {renderInline(text, key)}
            </h2>
          );
        }
        const lines = block.split("\n").map((l) => l.trim());
        if (lines.every((l) => l.startsWith("- "))) {
          return (
            <ul key={key}>
              {lines.map((l, li) => (
                <li key={li}>{renderInline(l.slice(2), `${key}-${li}`)}</li>
              ))}
            </ul>
          );
        }
        if (lines.every((l) => /^\d+\.\s/.test(l))) {
          return (
            <ol key={key}>
              {lines.map((l, li) => (
                <li key={li}>{renderInline(l.replace(/^\d+\.\s/, ""), `${key}-${li}`)}</li>
              ))}
            </ol>
          );
        }
        if (lines.every((l) => l.startsWith("> "))) {
          return (
            <blockquote key={key}>
              <p>{renderInline(lines.map((l) => l.slice(2)).join(" "), key)}</p>
            </blockquote>
          );
        }
        return <p key={key}>{renderInline(lines.join(" "), key)}</p>;
      })}
    </>
  );
}
