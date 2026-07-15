// ============================================================
//  SP Landing — Blueprint doodles
//  apps/studio/src/app/home/doodles.tsx
//
//  The human layer of the drafting sheet: the king logo mark,
//  handwritten to-do notes with the work scratched OUT (the app
//  does it), and one-line figures enjoying the time back —
//  on the phone, feet up, cheers with a friend. All inline SVG,
//  stroke = currentColor, no images, no requests. Brutalist
//  collage energy: rough boxes, tape marks, tilted placement.
// ============================================================

const HAND = `'Segoe Print','Bradley Hand','Chalkboard SE','Comic Sans MS',cursive`;

/** The SP logo: a bold king. currentColor so it sits on any surface. */
export function KingMark({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden="true" focusable="false" fill="currentColor">
      <path d="M30 3h4v4h4v4h-4v4h-4v-4h-4V7h4z" />
      <circle cx="32" cy="19" r="3.4" />
      <path d="M28 23 L25 27 L27.5 29 L27.5 34 L25.5 42 L21.5 49 L18 52 L18 54 L16 56 L16 60 L48 60 L48 56 L46 54 L46 52 L42.5 49 L38.5 42 L36.5 34 L36.5 29 L39 27 L36 23 Z" />
    </svg>
  );
}

/** Handwritten note frame: rough double-stroke box + tape strip. */
function Note({
  w,
  h,
  title,
  items,
  children,
}: {
  w: number;
  h: number;
  title: string;
  items: { text: string; struck?: boolean; mark?: string }[];
  children?: React.ReactNode;
}) {
  const lineH = 26;
  return (
    <svg viewBox={`0 0 ${w} ${h}`} aria-hidden="true" focusable="false" style={{ width: "100%", height: "auto", display: "block" }}>
      {/* rough box: two offset strokes read as hand-ruled */}
      <rect x="3" y="3" width={w - 6} height={h - 6} fill="none" stroke="currentColor" strokeWidth="2" />
      <rect x="6" y="7" width={w - 11} height={h - 12} fill="none" stroke="currentColor" strokeWidth="0.8" opacity="0.45" />
      {/* tape */}
      <rect x={w / 2 - 22} y="-4" width="44" height="12" fill="currentColor" opacity="0.35" transform={`rotate(-3 ${w / 2} 2)`} />
      <text x="16" y="30" fontFamily={HAND} fontSize="15" fontWeight="700" fill="currentColor" style={{ textTransform: "uppercase", letterSpacing: "0.08em" }}>
        {title}
      </text>
      <line x1="14" y1="37" x2={w - 18} y2="35" stroke="currentColor" strokeWidth="1.4" opacity="0.7" />
      {items.map((it, i) => {
        const y = 58 + i * lineH;
        return (
          <g key={i}>
            <text x="18" y={y} fontFamily={HAND} fontSize="14.5" fill="currentColor" opacity={it.struck ? 0.62 : 1}>
              {it.text}
            </text>
            {it.struck ? (
              <path
                d={`M15 ${y - 5} Q ${w * 0.45} ${y - 9}, ${w - 26} ${y - 4}`}
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
              />
            ) : null}
            {it.mark ? (
              <text x={w - 24} y={y} fontFamily={HAND} fontSize="14" fill="currentColor">
                {it.mark}
              </text>
            ) : null}
          </g>
        );
      })}
      {children}
    </svg>
  );
}

/** The work list — everything scratched out, because the system did it. */
export function NoteWorkDone() {
  return (
    <Note
      w={210}
      h={196}
      title="To do — today"
      items={[
        { text: "write 3 blog posts", struck: true },
        { text: "chase 9 invoices", struck: true },
        { text: "follow up: leads", struck: true },
        { text: "post on socials", struck: true },
        { text: "fix the website", struck: true },
      ]}
    >
      <text x="18" y="188" fontFamily={HAND} fontSize="13" fill="currentColor">
        …it did all of it??
      </text>
    </Note>
  );
}

/** The life list — untouched, waiting, checked with joy. */
export function NoteLifeBack() {
  return (
    <Note
      w={200}
      h={170}
      title="With the time back"
      items={[
        { text: "long lunch", mark: "☀" },
        { text: "gym at 4pm", mark: "✓" },
        { text: "call mom", mark: "♥" },
        { text: "actual weekend", mark: "!!" },
      ]}
    />
  );
}

/* ── One-line figures: people doing anything BUT the busywork ── */

function Figure({ vb, children }: { vb: string; children: React.ReactNode }) {
  return (
    <svg
      viewBox={vb}
      aria-hidden="true"
      focusable="false"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ width: "100%", height: "auto", display: "block" }}
    >
      {children}
    </svg>
  );
}

/** Kicked back, feet on the desk, coffee in hand. */
export function DoodleFeetUp() {
  return (
    <Figure vb="0 0 150 110">
      <circle cx="38" cy="26" r="11" />
      <path d="M35 24 q3 4 7 1" strokeWidth="1.8" /> {/* smile */}
      <path d="M38 37 q-4 18 2 26" /> {/* torso, leaned back */}
      <path d="M40 63 Q70 52 96 46 L114 44" /> {/* legs up */}
      <path d="M114 40 v9" /> {/* foot */}
      <path d="M38 44 q14 -8 22 -14" /> {/* arm to cup */}
      <path d="M60 26 h9 v8 h-9 z M69 28 q5 1 0 5" strokeWidth="2" /> {/* mug */}
      <path d="M96 46 v34 h34" /> {/* desk */}
      <path d="M22 52 q-6 14 4 24" /> {/* chair back */}
      <path className="d-steam" d="M63 12 q2 -5 6 -3 M71 8 q3 -4 6 -1" strokeWidth="1.6" /> {/* steam */}
    </Figure>
  );
}

/** Laughing on the phone, pacing. */
export function DoodleOnPhone() {
  return (
    <Figure vb="0 0 110 130">
      <circle cx="52" cy="22" r="11" />
      <path d="M48 21 q4 4 8 0" strokeWidth="1.8" />
      <rect x="62" y="14" width="7" height="13" rx="2" strokeWidth="2" /> {/* phone */}
      <path d="M52 33 q2 22 0 34" /> {/* torso */}
      <path d="M52 40 q9 -12 12 -21" /> {/* arm up to phone */}
      <path d="M52 44 q-12 4 -16 12" /> {/* other arm gesturing */}
      <path d="M52 67 q-8 20 -14 28 M52 67 q8 18 4 30" /> {/* mid-stride legs */}
      <path className="d-laugh" d="M20 16 q-2 -6 4 -8 M14 30 q-6 0 -6 -6 M24 42 l-6 4" strokeWidth="1.6" /> {/* laughter marks */}
    </Figure>
  );
}

/** Two friends, glasses up. */
export function DoodleCheers() {
  return (
    <Figure vb="0 0 160 120">
      <circle cx="42" cy="34" r="10" />
      <circle cx="118" cy="34" r="10" />
      <path d="M39 33 q3 3 6 0 M115 33 q3 3 6 0" strokeWidth="1.8" />
      <path d="M42 44 q-2 20 0 32 M118 44 q2 20 0 32" /> {/* torsos */}
      <path d="M42 52 q14 -14 24 -22 M118 52 q-14 -14 -24 -22" /> {/* arms raised */}
      <path d="M66 22 l6 8 M94 22 l-6 8 M66 22 q7 -3 14 0 l-4 9 q-3 2 -6 0 z M94 22 q-7 -3 -14 0" strokeWidth="1.8" /> {/* glasses clink */}
      <path className="d-sparks" d="M78 10 l2 -6 M84 12 l4 -5 M72 12 l-3 -5" strokeWidth="1.6" /> {/* sparks */}
      <path d="M42 76 q-6 16 -10 24 M42 76 q6 16 10 24 M118 76 q-6 16 -10 24 M118 76 q6 16 10 24" />
    </Figure>
  );
}

/** Out for a run with the dog — both of them clearly have heads. */
export function DoodleDogRun() {
  return (
    <Figure vb="0 0 180 115">
      <circle cx="48" cy="17" r="11" /> {/* runner's head */}
      <path d="M45 16 q3 4 7 1" strokeWidth="1.8" /> {/* smile */}
      <path d="M48 28 L46 34 Q42 48 46 58" /> {/* neck + leaning torso */}
      <path d="M46 58 q-9 16 -16 22 M46 58 q13 9 16 24" /> {/* running legs */}
      <path d="M46 38 q13 4 22 2" /> {/* arm to leash */}
      <path d="M68 40 Q96 50 116 60" strokeDasharray="5 6" strokeWidth="1.8" /> {/* leash */}
      <circle cx="126" cy="60" r="7" /> {/* dog's head */}
      <path d="M131 55 l6 -7 M121 55 l-2 -8" strokeWidth="1.8" /> {/* ears */}
      <path d="M133 62 q5 1 7 4" strokeWidth="1.8" /> {/* snout */}
      <path d="M124 67 q8 10 22 8 q10 -1 10 -8" strokeWidth="2.2" /> {/* dog back */}
      <path className="d-tail" d="M156 62 q8 -6 6 -12" strokeWidth="1.8" /> {/* wagging tail */}
      <path d="M130 76 l-4 10 M146 76 l2 10 M154 72 l6 9" strokeWidth="2" /> {/* dog legs */}
      <path d="M18 28 h-10 M22 42 h-13 M27 56 h-9" strokeWidth="1.6" /> {/* speed lines */}
    </Figure>
  );
}
