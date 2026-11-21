import { SNAPSHOT_DATE } from '../data/models'
import type { LiveFeed } from '../hooks/useLiveModels'
import { ScopeSwitch } from './ScopeSwitch'
import type { Scope } from '../lib/scope'
import { fmtDate } from '../lib/derive'

const NAV = [
  { href: '#frontier', label: 'Frontier' },
  { href: '#releases', label: 'Releases' },
  { href: '#lineage', label: 'Lineage' },
  { href: '#labs', label: 'Labs' },
  { href: '#models', label: 'Models' },
  { href: '#live', label: 'Live wire' },
]

export function Header({
  scope,
  onScope,
  live,
}: {
  scope: Scope
  onScope: (s: Scope) => void
  live: Pick<LiveFeed, 'state' | 'newSinceSnapshot'>
}) {
  const wire =
    live.state === 'loading'
      ? { text: 'WIRE SYNC', tone: '#9aa3b2' }
      : live.state === 'error'
        ? { text: 'WIRE OFFLINE', tone: '#fb7185' }
        : live.newSinceSnapshot > 0
          ? { text: `WIRE · ${live.newSinceSnapshot} NEW`, tone: 'var(--color-accent)' }
          : { text: 'WIRE LIVE', tone: 'var(--color-accent)' }
  return (
    <header className="sticky top-0 z-40 border-b border-line/80 bg-ink/85 backdrop-blur-xl">
      <div className="mx-auto flex h-[58px] max-w-[1340px] items-center gap-4 px-4 sm:px-7">
        <a href="#top" className="flex shrink-0 items-center gap-2.5">
          <span className="relative grid size-7 place-items-center">
            <svg viewBox="0 0 28 28" className="size-7" aria-hidden>
              <circle cx="14" cy="14" r="11" fill="none" stroke="#2b323d" strokeWidth="1" />
              <circle cx="14" cy="14" r="6.5" fill="none" stroke="#3d4652" strokeWidth="1" />
              <circle cx="14" cy="14" r="2.2" fill="var(--color-accent)" />
              <path d="M14 14 23.5 6.5" stroke="var(--color-accent)" strokeWidth="1" opacity=".55" />
            </svg>
          </span>
          <span className="flex flex-col leading-none">
            <span className="text-[13.5px] font-semibold tracking-[-0.01em]">Model Radar</span>
            <span className="mt-0.5 hidden font-mono text-[8.5px] tracking-[0.16em] text-dim uppercase sm:block">
              frontier tracker
            </span>
          </span>
        </a>

        <nav className="-mx-1 ml-2 hidden items-center gap-0.5 border-l border-line pl-3 md:flex">
          {NAV.map((n) => (
            <a
              key={n.href}
              href={n.href}
              className="rounded-md px-2.5 py-1.5 text-[12.5px] text-mute transition-colors hover:bg-white/5 hover:text-fg"
            >
              {n.label}
            </a>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <div className="hidden lg:block">
            <ScopeSwitch scope={scope} onChange={onScope} size="sm" />
          </div>
          <span className="hidden items-center gap-1.5 rounded-full border border-line bg-white/[0.02] px-2.5 py-1 font-mono text-[9.5px] tracking-[0.08em] text-mute sm:flex">
            <span
              className={`size-1.5 rounded-full ${live.state === 'live' ? 'live-dot' : ''}`}
              style={{ background: wire.tone }}
            />
            {wire.text}
          </span>
          <span className="hidden font-mono text-[9.5px] tracking-[0.08em] text-dim lg:block">
            SNAPSHOT {fmtDate(SNAPSHOT_DATE).toUpperCase()}
          </span>
        </div>
      </div>

      <div className="scroll-x flex gap-1 border-t border-line/60 px-3 py-1.5 md:hidden">
        {NAV.map((n) => (
          <a
            key={n.href}
            href={n.href}
            className="shrink-0 rounded-md px-2.5 py-1 font-mono text-[10px] tracking-[0.06em] text-mute uppercase"
          >
            {n.label}
          </a>
        ))}
      </div>
    </header>
  )
}
