import { useEffect, useMemo, useState } from 'react'
import { SCORE_INDEX } from '../data/models'
import { fmtContext, fmtDate, fmtPrice } from '../lib/derive'
import type { LiveFeed } from '../hooks/useLiveModels'
import { SectionHead, Tag } from './ui'
import { SCOPE_META, type Scope } from '../lib/scope'

function timeAgo(ts: number | null): string {
  if (!ts) return '—'
  const mins = Math.max(0, Math.round((Date.now() - ts) / 60000))
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins} min ago`
  return `${Math.round(mins / 60)} h ago`
}

/** Countdown that doubles as the pause control, so the poll is visible and stoppable. */
function SyncPill({ feed }: { feed: LiveFeed }) {
  const [now, setNow] = useState(Date.now())
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(id)
  }, [])

  const { at, intervalMs, paused, togglePaused, state } = feed
  const remain = at && !paused ? Math.max(0, at + intervalMs - now) : null
  const clock =
    remain === null
      ? null
      : `${Math.floor(remain / 60000)}:${String(Math.floor((remain % 60000) / 1000)).padStart(2, '0')}`

  return (
    <button
      onClick={togglePaused}
      title={paused ? 'Resume the auto-refresh' : `Auto-refresh every ${Math.round(intervalMs / 60000)} min — click to pause`}
      className="flex items-center gap-2 rounded-full border border-line bg-white/[0.02] px-3 py-1.5 font-mono text-[9.5px] text-mute transition-colors hover:border-line2 hover:text-fg"
    >
      <span
        className={`size-1.5 rounded-full ${
          state === 'error' ? 'bg-rose-400' : paused ? 'bg-dim' : 'bg-accent'
        } ${state === 'live' && !paused ? 'live-dot' : ''}`}
      />
      {state === 'loading'
        ? 'syncing'
        : state === 'error'
          ? 'offline'
          : paused
            ? 'paused'
            : clock
              ? `${clock} · auto`
              : 'live'}
    </button>
  )
}

export function LiveWire({ feed, scope }: { feed: LiveFeed; scope: Scope }) {
  const { items, total, at, state, error, refresh, newSinceSnapshot, newSinceOpen, intervalMs } = feed
  const [expanded, setExpanded] = useState(false)
  const visible = useMemo(
    () => items.filter((m) => (scope === 'all' ? true : scope === 'open' ? m.open : !m.open)),
    [items, scope],
  )
  const shown = expanded ? visible.slice(0, 40) : visible.slice(0, 8)

  return (
    <section id="live" className="mx-auto max-w-[1340px] px-4 pt-10 sm:px-7">
      <SectionHead
        index="06"
        kicker="the live wire"
        title="New arrivals, straight from the catalogue"
        sub={`OpenRouter’s public model list, fetched in your browser and re-checked every ${Math.round(intervalMs / 60000)} minutes while this tab is open — no key, no curation, including models the scored board has not caught up with yet.${scope === 'all' ? '' : ` Filtered to ${SCOPE_META[scope].label.toLowerCase()} (${scope === 'open' ? 'a Hugging Face repo is listed' : 'no public weights listed'}).`}`}
        right={<SyncPill feed={feed} />}
      />

      <div className="panel overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-4 py-3">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-[9.5px] text-dim">
            <span className="text-mute">
              {state === 'loading' ? 'reading catalogue…' : `${visible.length} of ${total} text models`}
            </span>
            <span className="text-line2">·</span>
            <span>
              {visible.length
                ? `newest ${fmtDate(new Date(visible[0].created).toISOString().slice(0, 10))}`
                : '—'}
            </span>
            <span className="text-line2">·</span>
            <span>synced {timeAgo(at)}</span>
            {newSinceSnapshot > 0 ? (
              <>
                <span className="text-line2">·</span>
                <span className="text-accent">{newSinceSnapshot} since the snapshot</span>
              </>
            ) : (
              <>
                <span className="text-line2">·</span>
                <span>no newer arrivals yet</span>
              </>
            )}
            {newSinceOpen > 0 && (
              <>
                <span className="text-line2">·</span>
                <span className="text-accent">{newSinceOpen} new while you were here</span>
              </>
            )}
            {state === 'cached' && (
              <>
                <span className="text-line2">·</span>
                <span className="text-amber-300/80">showing saved copy</span>
              </>
            )}
            {error && state === 'live' && (
              <>
                <span className="text-line2">·</span>
                <span className="text-amber-300/80">last refresh failed, keeping these</span>
              </>
            )}
          </div>
          <button
            onClick={refresh}
            disabled={state === 'loading'}
            className="flex items-center gap-1.5 rounded-full border border-line px-2.5 py-1 font-mono text-[9.5px] tracking-[0.04em] text-mute uppercase transition-colors hover:border-line2 hover:text-fg disabled:opacity-40"
          >
            <svg viewBox="0 0 16 16" className="size-3" fill="none" aria-hidden>
              <path d="M13 8a5 5 0 1 1-1.5-3.5M13 2v3h-3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
            </svg>
            refresh
          </button>
        </div>

        {state === 'error' && (
          <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-8">
            <div>
              <div className="text-[13px] font-medium">The catalogue didn’t answer.</div>
              <p className="mt-1 font-mono text-[10px] text-dim">
                {error} — the curated snapshot above is unaffected, and the poll will retry in{' '}
                {Math.round(intervalMs / 60000)} min.
              </p>
            </div>
            <button
              onClick={refresh}
              className="rounded-full border border-line2 px-3 py-1.5 font-mono text-[10px] text-fg hover:bg-white/5"
            >
              try again
            </button>
          </div>
        )}

        {state !== 'error' && (
          <>
            <div className="grid grid-cols-[50px_minmax(0,1fr)_auto] gap-3 border-b border-line/50 px-4 py-1.5 font-mono text-[8.5px] tracking-[0.1em] text-dim uppercase sm:grid-cols-[50px_minmax(0,1fr)_130px_66px_66px_16px]">
              <span>added</span>
              <span>model / api id</span>
              <span className="hidden sm:block">lab</span>
              <span className="hidden text-right sm:block">ctx</span>
              <span className="text-right">$ / 1m</span>
              <span className="hidden sm:block" />
            </div>
            <div className="divide-y divide-line/60">
              {shown.map((m) => (
                <a
                  key={m.id}
                  href={`https://openrouter.ai/${m.id}`}
                  target="_blank"
                  rel="noreferrer"
                  className="grid grid-cols-[50px_minmax(0,1fr)_auto] items-center gap-3 px-4 py-2.5 transition-colors hover:bg-white/[0.025] sm:grid-cols-[50px_minmax(0,1fr)_130px_66px_66px_16px]"
                >
                  <span className="num text-[10px] text-dim">
                    {new Date(m.created).toLocaleDateString('en-GB', {
                      day: 'numeric',
                      month: 'short',
                      timeZone: 'UTC',
                    })}
                  </span>
                  <span className="flex min-w-0 flex-col gap-1">
                    <span className="flex min-w-0 items-center gap-2">
                      <span className="truncate text-[12.5px] text-fg">{m.name}</span>
                      {m.created > Date.parse('2026-11-19T23:59:59Z') && <Tag tone="new">new</Tag>}
                      {m.open && <Tag tone="open">open</Tag>}
                    </span>
                    <span className="truncate font-mono text-[8.5px] text-dim">{m.id}</span>
                  </span>
                  <span className="hidden truncate font-mono text-[9.5px] text-dim sm:block">
                    {m.vendorName}
                  </span>
                  <span className="num hidden text-right text-[10px] text-mute sm:block">
                    {fmtContext(m.context ? m.context / 1000 : null)}
                  </span>
                  <span className="num text-right text-[10px] text-mute">
                    {m.priceOut === null ? '—' : m.priceOut === 0 ? 'free' : `${fmtPrice(m.priceOut)}/M`}
                  </span>
                  <span className="hidden text-right text-[10px] text-dim sm:block">↗</span>
                </a>
              ))}
              {state === 'loading' &&
                Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-3 px-4 py-3">
                    <span className="h-2 w-10 animate-pulse rounded bg-white/5" />
                    <span className="h-2 flex-1 animate-pulse rounded bg-white/5" />
                    <span className="h-2 w-16 animate-pulse rounded bg-white/5" />
                  </div>
                ))}
            </div>
          </>
        )}

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line px-4 py-2.5">
          <p className="font-mono text-[9px] leading-relaxed text-dim">
            Dates are catalogue entry times, not launch days · prices are per 1M tokens as OpenRouter
            serves them · “open” means a Hugging Face repo is listed · auto-refresh stops when the
            tab is hidden · {SCORE_INDEX} not applied here.
          </p>
          {visible.length > 8 && (
            <button
              onClick={() => setExpanded((e) => !e)}
              className="font-mono text-[9.5px] tracking-[0.04em] text-accent uppercase hover:text-fg"
            >
              {expanded ? 'show less' : `show ${Math.min(40, visible.length) - 8} more`}
            </button>
          )}
        </div>
      </div>
    </section>
  )
}
