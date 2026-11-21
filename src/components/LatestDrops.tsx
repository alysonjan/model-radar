import { useMemo } from 'react'
import { BY_DATE, fmtContext, fmtDate, fmtPrice, relativeDay } from '../lib/derive'
import { inScope, type Scope } from '../lib/scope'
import { vendor } from '../data/vendors'
import { SectionHead, StatusTag, VendorDot } from './ui'

export function LatestDrops({ onOpen, scope }: { onOpen: (id: string) => void; scope: Scope }) {
  const items = useMemo(() => BY_DATE.filter((m) => inScope(m, scope)).slice(0, 8), [scope])

  return (
    <section id="releases" className="mx-auto max-w-[1340px] px-4 pt-10 sm:px-7">
      <SectionHead
        index="02"
        kicker="what shipped"
        title="Latest drops"
        sub={scope === 'all' ? 'Every release in the last few weeks, newest first. Scores appear once an independent eval is published — an unscored model is not a weak one, just unmeasured.' : `Newest ${scope === 'open' ? 'open-weights' : 'proprietary'} releases first. Scores appear once an independent eval is published.`}
        right={
          <a
            href="#models"
            className="hidden items-center gap-1.5 font-mono text-[10px] tracking-[0.06em] text-mute uppercase hover:text-accent sm:flex"
          >
            all {BY_DATE.filter((m) => inScope(m, scope)).length} models <span className="text-accent">→</span>
          </a>
        }
      />

      <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 xl:grid-cols-4">
        {items.map((m) => {
          const v = vendor(m.vendor)
          return (
            <button
              key={m.id}
              onClick={() => onOpen(m.id)}
              className="panel-flat group relative overflow-hidden p-3.5 text-left transition-colors hover:border-line2 hover:bg-panel2"
            >
              <span
                className="absolute inset-y-0 left-0 w-[2px] opacity-70"
                style={{ background: v.color }}
              />
              <div className="flex items-center gap-2">
                <VendorDot id={m.vendor} size={5} />
                <span className="font-mono text-[9px] tracking-[0.08em] text-dim uppercase">
                  {v.short} · {relativeDay(m.released)}
                </span>
                <span className="ml-auto flex items-center gap-1.5">
                  {!m.name.toLowerCase().includes(m.status.toLowerCase()) && <StatusTag status={m.status} />}
                </span>
              </div>

              <div className="mt-2.5 flex items-baseline gap-2">
                <span className="truncate text-[14.5px] font-semibold tracking-[-0.01em]">
                  {m.name}
                </span>
              </div>

              <div className="mt-2 flex items-end gap-2">
                <span className="num text-[20px] leading-none" style={{ color: v.color }}>
                  {m.aa?.toFixed(1) ?? '—'}
                </span>
                <span className="font-mono text-[8.5px] leading-tight text-dim uppercase">
                  aa index
                </span>
                <span className="ml-auto font-mono text-[10px] text-mute">
                  {m.priceOut === 0 ? 'free' : m.priceOut ? `${fmtPrice(m.priceOut)}/M out` : '—'}
                </span>
              </div>

              <div className="mt-1.5 flex items-center gap-2 font-mono text-[9px] text-dim">
                <span>{fmtContext(m.contextK)} ctx</span>
                <span className="text-line2">·</span>
                <span className="truncate">{fmtDate(m.released)}</span>
                {m.weights === 'open' && (
                  <>
                    <span className="text-line2">·</span>
                    <span className="text-accent/80">open</span>
                  </>
                )}
              </div>

              <p className="mt-2 line-clamp-2 min-h-[35px] text-[11.5px] leading-[1.5] text-dim">{m.note}</p>
            </button>
          )
        })}
      </div>
    </section>
  )
}
