import { useMemo } from 'react'
import { MODELS } from '../data/models'
import { VENDORS } from '../data/vendors'
import { BY_DATE, fmtShortDate } from '../lib/derive'
import { SCOPE_META, inScope, isOpen, type Scope } from '../lib/scope'
import { SectionHead, VendorDot } from './ui'

interface LabRow {
  id: string
  name: string
  hq: string
  blurb: string
  color: string
  count: number
  openCount: number
  total: number
  best: number | null
  bestId: string | null
  latest: { name: string; released: string; open: boolean }
}

const clip = (s: string, n = 116): string =>
  s.length <= n ? s : `${s.slice(0, n).replace(/\s+\S*$/, '')}…`

export function LabGrid({ onOpen, scope }: { onOpen: (id: string) => void; scope: Scope }) {
  const rows = useMemo<LabRow[]>(() => {
    return VENDORS.map((v) => {
      const all = MODELS.filter((m) => m.vendor === v.id)
      const models = all.filter((m) => inScope(m, scope))
      const scored = models.filter((m) => m.aa !== null).sort((a, b) => (b.aa as number) - (a.aa as number))
      const latest = [...models].sort((a, b) => b.released.localeCompare(a.released))[0]
      return {
        id: v.id,
        name: v.name,
        hq: v.hq,
        blurb: clip(v.blurb.split(/(?<=\.)\s/)[0]),
        color: v.color,
        count: models.length,
        openCount: all.filter(isOpen).length,
        total: all.length,
        best: scored[0]?.aa ?? null,
        bestId: scored[0]?.id ?? null,
        latest: {
          name: latest?.name ?? '—',
          released: latest?.released ?? BY_DATE[0].released,
          open: latest ? isOpen(latest) : false,
        },
      }
    })
      .filter((r) => r.count > 0)
      .sort((a, b) => (b.best ?? -1) - (a.best ?? -1) || b.count - a.count)
  }, [scope])

  // strongest scored labs, plus the most recently active, so a lab shipping
  // this week is never hidden behind an older high score
  const shown = useMemo(() => {
    const top = rows.slice(0, 8)
    const recent = [...rows]
      .filter((r) => !top.includes(r))
      .sort((a, b) => b.latest.released.localeCompare(a.latest.released))
      .slice(0, 4)
    return [...top, ...recent]
  }, [rows])

  return (
    <section id="labs" className="mx-auto max-w-[1340px] px-4 pt-10 sm:px-7">
      <SectionHead
        index="04"
        kicker="who is shipping"
        title="The labs behind the leaderboard"
        sub={`Twelve months of releases, grouped by the lab that made them — ${SCOPE_META[scope].label.toLowerCase()} only. The big number is a lab’s best published score in scope; the footer is its newest release, and the bar shows how much of its output is downloadable.`}
        right={
          <span className="hidden font-mono text-[9px] tracking-[0.06em] text-dim uppercase sm:block">
            {rows.length} labs · {rows.reduce((n, r) => n + r.count, 0)} models
          </span>
        }
      />

      <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 xl:grid-cols-4">
        {shown.map((lab) => {
          const openPct = lab.total ? (lab.openCount / lab.total) * 100 : 0
          return (
            <button
              key={lab.id}
              onClick={() => lab.bestId && onOpen(lab.bestId)}
              className="panel-flat group relative flex flex-col overflow-hidden p-3.5 text-left transition-colors hover:border-line2 hover:bg-panel2"
            >
              <span className="absolute inset-x-0 top-0 h-[2px] opacity-60" style={{ background: lab.color }} />
              <div className="flex items-center justify-between gap-2">
                <div className="flex min-w-0 items-center gap-2">
                  <VendorDot id={lab.id} size={6} />
                  <span className="truncate text-[13px] font-semibold tracking-[-0.01em]">{lab.name}</span>
                </div>
                <span className="num shrink-0 text-[17px] leading-none" style={{ color: lab.color }}>
                  {lab.best?.toFixed(1) ?? '—'}
                </span>
              </div>
              <div className="mt-1 flex items-center gap-1.5 font-mono text-[8.5px] tracking-[0.04em] text-dim">
                <span>{lab.hq}</span>
              </div>
              <p className="mt-2 line-clamp-2 text-[11px] leading-[1.5] text-dim">{lab.blurb}</p>

              <div className="mt-2.5">
                <div className="flex h-[3px] overflow-hidden rounded-full bg-white/8">
                  <span style={{ width: `${openPct}%`, background: 'var(--color-accent)', opacity: 0.75 }} />
                </div>
                <div className="mt-1 flex items-center justify-between font-mono text-[8px] text-dim">
                  <span>{lab.openCount} open</span>
                  <span>{lab.total - lab.openCount} closed</span>
                </div>
              </div>

              <div className="mt-2 flex items-center justify-between gap-2 border-t border-line/60 pt-2 font-mono text-[9px] text-dim">
                <span className="shrink-0">
                  {lab.count} in scope
                </span>
                <span className="flex min-w-0 items-center gap-1.5 text-mute">
                  <span className="shrink-0">{fmtShortDate(lab.latest.released)}</span>
                  <span className="truncate">{lab.latest.name}</span>
                  <span className="shrink-0 text-dim transition-colors group-hover:text-accent">↗</span>
                </span>
              </div>
            </button>
          )
        })}
      </div>

      <p className="mt-3 font-mono text-[9px] leading-relaxed text-dim">
        Eight labs with the strongest in-scope model, plus the four most recently active — all{' '}
        {rows.length} appear in the table below. The bar is the lab’s share of downloadable-weights
        releases across the whole snapshot. Click a card for its best in-scope model.
      </p>
    </section>
  )
}
