import { MODELS, SNAPSHOT_DATE, SCORE_AS_OF, SCORE_INDEX } from '../data/models'
import { fmtDate } from '../lib/derive'

const SOURCES = [
  {
    name: 'Artificial Analysis',
    note: 'Intelligence Index v5 scores',
    href: 'https://artificialanalysis.ai/leaderboards/models',
  },
  {
    name: 'BenchLM',
    note: 'coding / agentic / knowledge boards',
    href: 'https://benchlm.ai/frontier-ai-models',
  },
  {
    name: 'The Durability Curve',
    note: 'release chronology · CC BY 4.0',
    href: 'https://durabilitycurve.com/chart/',
  },
  {
    name: 'OpenRouter',
    note: 'live catalogue feed',
    href: 'https://openrouter.ai/models',
  },
]

export function Footer() {
  return (
    <footer className="mt-12 border-t border-line">
      <div className="mx-auto grid max-w-[1340px] gap-8 px-4 py-9 sm:px-7 md:grid-cols-[1.3fr_1fr_1fr]">
        <div>
          <div className="flex items-center gap-2">
            <svg viewBox="0 0 28 28" className="size-6" aria-hidden>
              <circle cx="14" cy="14" r="11" fill="none" stroke="#2b323d" strokeWidth="1" />
              <circle cx="14" cy="14" r="2.2" fill="var(--color-accent)" />
              <path d="M14 14 23.5 6.5" stroke="var(--color-accent)" strokeWidth="1" opacity=".55" />
            </svg>
            <span className="text-[13px] font-semibold">Model Radar</span>
          </div>
          <p className="mt-3 max-w-[340px] text-[11.5px] leading-[1.6] text-dim">
            A single-page tracker for the AI frontier: {MODELS.length} models across 27 labs, with
            their scores, prices, lineages and a live wire to new arrivals. Curated snapshot{' '}
            {fmtDate(SNAPSHOT_DATE)}.
          </p>
          <p className="mt-3 font-mono text-[9px] leading-relaxed text-dim">
            Built with Vite, React and TypeScript. Static output — no server, no tracking.
          </p>
        </div>

        <div>
          <div className="label mb-3">sources</div>
          <ul className="space-y-2">
            {SOURCES.map((s) => (
              <li key={s.name}>
                <a
                  href={s.href}
                  target="_blank"
                  rel="noreferrer"
                  className="group flex flex-col text-[11.5px] text-mute transition-colors hover:text-fg"
                >
                  <span className="flex items-center gap-1">
                    {s.name}
                    <span className="text-[9px] text-dim group-hover:text-accent">↗</span>
                  </span>
                  <span className="font-mono text-[9px] text-dim">{s.note}</span>
                </a>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <div className="label mb-3">how to read it</div>
          <ul className="space-y-2 text-[11.5px] leading-[1.5] text-mute">
            <li>
              Scores are the <span className="text-mute">{SCORE_INDEX}</span>, best published
              configuration, as of {SCORE_AS_OF}. High-effort reasoning runs are preferred, so the
              top line is generous.
            </li>
            <li>
              A missing score means no public eval — not a weak model. New releases usually appear
              in the live wire days before a score lands.
            </li>
            <li>
              <span className="text-mute">Open weights</span> means the weights are downloadable —
              open licence or gated — not that the model is OSI open source. The scope switch (All /
              Open / Closed) filters every section, and the SPLIT chart overlays both frontiers on
              one axis.
            </li>
            <li>
              Prices are list prices on the snapshot date; introductory pricing is called out in the
              model note.
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-line/70">
        <div className="mx-auto flex max-w-[1340px] flex-wrap items-center justify-between gap-2 px-4 py-3 sm:px-7">
          <span className="font-mono text-[9px] text-dim">
            snapshot {SNAPSHOT_DATE} · scores {SCORE_AS_OF} · 27 labs
          </span>
          <span className="font-mono text-[9px] text-dim">
            press esc to close a panel · click any dot for the full spec
          </span>
        </div>
      </div>
    </footer>
  )
}
