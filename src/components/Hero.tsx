import { useMemo } from 'react'
import { SNAPSHOT_DATE } from '../data/models'
import { vendor } from '../data/vendors'
import {
  VENDOR_COUNT,
  fmtContext,
  fmtDate,
  fmtPrice,
  fmtShortDate,
  relativeDay,
} from '../lib/derive'
import { CLOSED_COUNT, OPEN_COUNT, gapToClosed, oppositeLeader, scopeStats, type Scope } from '../lib/scope'
import { ScopeSwitch } from './ScopeSwitch'
import { StatusTag, Tag, VendorDot } from './ui'

const CARD_LABEL: Record<Scope, string> = {
  all: 'current frontier',
  open: 'open-weights frontier',
  closed: 'proprietary frontier',
}

export function Hero({
  onOpen,
  scope,
  onScope,
  onOpenSplit,
}: {
  onOpen: (id: string) => void
  scope: Scope
  onScope: (s: Scope) => void
  onOpenSplit: () => void
}) {
  const stats = useMemo(() => scopeStats(scope), [scope])
  const leader = stats.leader
  const runnerUp = stats.runnerUp
  const gap = runnerUp?.aa ? (leader.aa ?? 0) - runnerUp.aa : 0
  const other = oppositeLeader(scope)
  const otherGap = Math.abs((leader.aa ?? 0) - (other.aa ?? 0))
  const otherLabel = scope === 'open' ? 'best proprietary' : scope === 'closed' ? 'best open weights' : 'open weights'
  const otherHint =
    scope === 'open'
      ? `leads by ${otherGap.toFixed(1)}`
      : scope === 'closed'
        ? `downloadable · ${otherGap.toFixed(1)} behind`
        : `${otherGap.toFixed(1)} points behind`

  return (
    <section id="top" className="relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0 grid-bg opacity-80" />
      <div
        className="pointer-events-none absolute -top-[220px] left-1/2 h-[520px] w-[820px] -translate-x-1/2 rounded-full blur-[130px]"
        style={{
          background:
            scope === 'open'
              ? 'radial-gradient(circle, rgb(var(--accent-rgb) / 0.13), transparent 62%)'
              : 'radial-gradient(circle, rgb(var(--accent-rgb) / 0.085), transparent 62%)',
        }}
      />

      <div className="relative mx-auto max-w-[1340px] px-4 pt-11 pb-7 sm:px-7 sm:pt-16">
        <div className="grid items-stretch gap-9 lg:grid-cols-[1.15fr_0.85fr] lg:gap-14">
          <div className="rise flex h-full flex-col">
            <div className="mb-5 flex flex-wrap items-center gap-x-2.5 gap-y-1.5 font-mono text-[9.5px] tracking-[0.14em] text-dim uppercase">
              <span className="flex items-center gap-1.5 text-accent">
                <span className="size-1.5 rounded-full bg-accent" />
                snapshot {fmtDate(SNAPSHOT_DATE)}
              </span>
              <span className="text-line2">/</span>
              <span>{stats.models.length} models</span>
              <span className="text-line2">/</span>
              <span>{VENDOR_COUNT} labs</span>
              <span className="hidden text-line2 sm:inline">/</span>
              <span className="hidden text-mute sm:inline">
                {OPEN_COUNT} open · {CLOSED_COUNT} closed
              </span>
            </div>

            <div className="mb-5 lg:hidden">
              <ScopeSwitch scope={scope} onChange={onScope} />
            </div>

            <h1 className="max-w-[15ch] text-[42px] leading-[0.94] font-semibold tracking-[-0.045em] sm:text-[60px] lg:text-[66px]">
              {scope === 'open' ? (
                <>
                  The open frontier, on{' '}
                  <span className="relative inline-block">
                    <span className="relative z-10 text-accent">one map.</span>
                    <span className="absolute inset-x-0 bottom-1.5 z-0 h-[10px] bg-accent/12" />
                  </span>
                </>
              ) : scope === 'closed' ? (
                <>
                  The closed frontier, on{' '}
                  <span className="relative inline-block">
                    <span className="relative z-10 text-accent">one map.</span>
                    <span className="absolute inset-x-0 bottom-1.5 z-0 h-[10px] bg-accent/12" />
                  </span>
                </>
              ) : (
                <>
                  Every frontier model, on{' '}
                  <span className="relative inline-block">
                    <span className="relative z-10 text-accent">one map.</span>
                    <span className="absolute inset-x-0 bottom-1.5 z-0 h-[10px] bg-accent/12" />
                  </span>
                </>
              )}
            </h1>

            <p className="mt-5 max-w-[520px] text-[14.5px] leading-[1.6] text-mute">
              Who shipped it, how it scores, what it costs, and which model it replaced. Open weights
              and proprietary models are tracked as two frontiers — switch the scope to see either
              side alone.
            </p>

            <div className="mt-6 flex flex-wrap items-center gap-2.5 lg:mt-auto lg:pt-8">
              <a
                href="#frontier"
                className="inline-flex items-center gap-2 rounded-full bg-accent px-4 py-2 text-[12.5px] font-semibold text-ink transition-transform hover:-translate-y-px"
              >
                Explore the frontier
                <svg viewBox="0 0 16 16" className="size-3.5" fill="none" aria-hidden>
                  <path d="M8 3v10m0 0 4-4m-4 4L4 9" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </a>
              <button
                onClick={onOpenSplit}
                className="inline-flex items-center gap-2 rounded-full border border-line2 px-4 py-2 text-[12.5px] text-fg transition-colors hover:border-dim/60 hover:bg-white/[0.03]"
              >
                Open vs closed
                <span className="num rounded-full bg-white/8 px-1.5 py-0.5 text-[9.5px] text-mute">
                  {gapToClosed().toFixed(1)} pt gap
                </span>
              </button>
            </div>
          </div>

          {/* leader card */}
          <button
            onClick={() => onOpen(leader.id)}
            className="panel group relative flex h-full w-full flex-col overflow-hidden p-4 text-left transition-colors hover:border-line2 sm:p-5"
          >
            <div
              className="pointer-events-none absolute -top-16 -right-10 size-48 rounded-full blur-3xl"
              style={{ background: `${vendor(leader.vendor).color}22` }}
            />
            <div className="relative flex items-center justify-between gap-2">
              <span className="label">{CARD_LABEL[scope]}</span>
              <span className="flex items-center gap-1.5">
                {leader.weights !== 'closed' && <Tag tone="open">open</Tag>}
                <span className="font-mono text-[9px] tracking-[0.06em] text-dim">
                  #1 of {stats.scored.length} scored
                </span>
              </span>
            </div>

            <div className="relative mt-4 flex items-end gap-3">
              <div className="num text-[54px] leading-[0.8] font-medium tracking-[-0.05em] sm:text-[62px]">
                {leader.aa?.toFixed(1)}
              </div>
              <div className="mb-1 flex flex-col gap-0.5 pb-0.5">
                <span className="font-mono text-[9px] tracking-[0.1em] text-dim uppercase">
                  intelligence index
                </span>
                <span className="font-mono text-[10px] text-accent">+{gap.toFixed(1)} vs #2</span>
              </div>
            </div>

            <div className="relative mt-4 flex items-center gap-2">
              <VendorDot id={leader.vendor} size={8} />
              <span className="min-w-0 truncate text-[16px] font-semibold tracking-[-0.01em]">
                {leader.name}
              </span>
              <StatusTag status={leader.status} />
            </div>
            <div className="relative mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 font-mono text-[10px] text-dim">
              <span>{vendor(leader.vendor).short}</span>
              <span className="text-line2">·</span>
              <span>{fmtContext(leader.contextK)} ctx</span>
              <span className="text-line2">·</span>
              <span>
                {fmtPrice(leader.priceIn)} in / {fmtPrice(leader.priceOut)} out
              </span>
            </div>

            <div className="relative mt-4 grid grid-cols-2 gap-2 border-t border-line/70 pt-3">
              <div>
                <div className="label mb-1">{otherLabel}</div>
                <div className="flex items-baseline gap-1.5">
                  <span className="num text-[12px] text-fg">{other.aa?.toFixed(1)}</span>
                  <span className="truncate text-[10px] text-dim">{other.name}</span>
                </div>
                <div className="mt-0.5 truncate font-mono text-[9.5px] text-dim">{otherHint}</div>
              </div>
              <div>
                <div className="label mb-1">newest {scope === 'all' ? '' : 'in scope'}</div>
                <div className="truncate text-[12px] font-medium">{stats.newest.name}</div>
                <div className="mt-0.5 truncate font-mono text-[9.5px] text-dim">
                  {vendor(stats.newest.vendor).short} · {relativeDay(stats.newest.released)}
                </div>
              </div>
            </div>

            <div className="relative mt-auto border-t border-line/70 pt-3">
              <div className="label mb-2">just landed</div>
              <ul className="space-y-1.5">
                {stats.byDate.slice(1, 4).map((m) => (
                  <li key={m.id} className="flex items-center gap-2">
                    <span className="num w-10 shrink-0 text-[9px] text-dim">{fmtShortDate(m.released)}</span>
                    <VendorDot id={m.vendor} size={4} />
                    <span className="truncate text-[11px] text-mute">{m.name}</span>
                    <span className="num ml-auto text-[9.5px] text-dim">{m.aa?.toFixed(1) ?? '—'}</span>
                  </li>
                ))}
              </ul>
            </div>
          </button>
        </div>

        {/* stat strip */}
        <div className="mt-9 grid grid-cols-2 gap-2.5 sm:mt-11 lg:grid-cols-4">
          {[
            {
              label: scope === 'all' ? 'models tracked' : `models in scope`,
              value: stats.models.length,
              hint:
                scope === 'all'
                  ? `${OPEN_COUNT} open · ${CLOSED_COUNT} proprietary`
                  : scope === 'open'
                    ? 'downloadable weights · open licences or gated'
                    : 'API-only · no public weights',
            },
            {
              label: 'shipped in 30 days',
              value: stats.recent.length,
              hint: `${stats.last7.length} in the last seven days`,
              accent: 'var(--color-accent)',
            },
            {
              label: scope === 'open' ? 'open-weights leader' : scope === 'closed' ? 'proprietary leader' : 'frontier leader',
              value: leader.aa?.toFixed(1),
              hint: leader.name,
            },
            {
              label:
                scope === 'all' ? 'open-weights leader' : scope === 'open' ? 'best proprietary' : 'best open weights',
              value: other.aa?.toFixed(1),
              hint: `${other.name}`,
            },
          ].map((s) => (
            <div key={s.label} className="panel-flat px-3.5 py-3">
              <div className="label mb-2 truncate">{s.label}</div>
              <div className="num text-[24px] leading-none" style={{ color: s.accent }}>
                {s.value}
              </div>
              <div className="mt-1.5 truncate text-[11px] text-dim">{s.hint}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
