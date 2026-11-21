import { useMemo, useState } from 'react'
import type { Model } from '../data/models'
import { vendor } from '../data/vendors'
import { ancestorsOf, fmtPrice, fmtShortDate, fmtContext } from '../lib/derive'
import { SCOPE_META, scopeStats, type Scope } from '../lib/scope'
import { SectionHead, StatusTag, Tag, VendorDot } from './ui'

function Node({
  m,
  active,
  onClick,
}: {
  m: Model
  active: boolean
  onClick: () => void
}) {
  const v = vendor(m.vendor)
  return (
    <button
      onClick={onClick}
      className={`relative w-[172px] shrink-0 rounded-xl border p-3 text-left transition-colors ${
        active ? 'border-accent/50 bg-accent/[0.04]' : 'border-line bg-white/[0.015] hover:border-line2'
      }`}
    >
      <div className="flex items-center justify-between gap-1">
        <span className="font-mono text-[8.5px] tracking-[0.06em] text-dim">{fmtShortDate(m.released)}</span>
        <span className="flex items-center gap-1">
          <StatusTag status={m.status} />
          {m.weights === 'open' && <Tag tone="open">open</Tag>}
        </span>
      </div>
      <div className="mt-1.5 flex min-h-[34px] items-start gap-1.5">
        <span className="mt-[5px]">
          <VendorDot id={m.vendor} size={5} />
        </span>
        <span className="text-[12.5px] leading-tight font-medium">{m.name}</span>
      </div>
      <div className="mt-2 flex items-baseline gap-1.5">
        <span className="num text-[17px] leading-none" style={{ color: v.color }}>
          {m.aa?.toFixed(1) ?? '—'}
        </span>
        <span className="font-mono text-[8px] text-dim">AA</span>
        <span className="ml-auto font-mono text-[9px] text-dim">
          {fmtPrice(m.priceOut)}/M
        </span>
      </div>
      <div className="mt-1 font-mono text-[8.5px] text-dim">{fmtContext(m.contextK)} ctx</div>
    </button>
  )
}

function Connector({ from, to }: { from: Model; to: Model }) {
  const delta =
    from.aa !== null && to.aa !== null ? Number((to.aa - from.aa).toFixed(1)) : null
  return (
    <div className="relative flex w-[54px] shrink-0 items-center justify-center">
      <span className="absolute inset-x-1 h-px bg-line2/90" />
      <svg viewBox="0 0 8 8" className="absolute right-1 size-2 text-line2" aria-hidden>
        <path d="M1 1l3 3-3 3" stroke="currentColor" fill="none" strokeWidth="1.2" />
      </svg>
      {delta !== null ? (
        <span
          className="relative z-10 rounded-full border bg-panel px-1.5 py-[2px] font-mono text-[8.5px] tabular-nums"
          style={{
            color: delta > 0 ? '#86efac' : delta < 0 ? '#fda4af' : '#9aa3b2',
            borderColor: delta > 0 ? 'rgba(134,239,172,0.3)' : delta < 0 ? 'rgba(251,113,133,0.3)' : '#262c36',
          }}
        >
          {delta > 0 ? '+' : ''}
          {delta}
        </span>
      ) : (
        <span className="relative z-10 rounded-full border border-line bg-panel px-1.5 py-[2px] font-mono text-[8.5px] text-dim">
          →
        </span>
      )}
    </div>
  )
}

export function LineagePanel({
  selectedId,
  onOpen,
  scope,
}: {
  selectedId: string | null
  onOpen: (id: string) => void
  scope: Scope
}) {
  const stats = useMemo(() => scopeStats(scope), [scope])
  const families = useMemo(() => {
    const map = new Map<string, Model[]>()
    for (const m of stats.models) {
      const arr = map.get(m.family) ?? []
      arr.push(m)
      map.set(m.family, arr)
    }
    return [...map.entries()]
      .map(([name, list]) => ({
        name,
        vendor: list[0].vendor,
        models: [...list].sort((a, b) => a.released.localeCompare(b.released)),
      }))
      .sort((a, b) => {
        const am = Math.max(...a.models.map((m) => m.aa ?? 0))
        const bm = Math.max(...b.models.map((m) => m.aa ?? 0))
        return bm - am
      })
  }, [stats])

  const defaultFamily = useMemo(
    () => families.find((f) => f.name === stats.leader.family)?.name ?? families[0]?.name ?? '',
    [families, stats.leader.family],
  )
  const [family, setFamily] = useState(defaultFamily)
  const current = families.find((f) => f.name === family) ?? families.find((f) => f.name === defaultFamily) ?? families[0]
  const selectedChain = selectedId ? ancestorsOf(selectedId) : []
  const related = current ? families.filter((f) => f.vendor === current.vendor && f.name !== current.name) : []

  return (
    <section id="lineage" className="mx-auto max-w-[1340px] px-4 pt-10 sm:px-7">
      <SectionHead
        index="03"
        kicker="where it came from"
        title="Lineage, generation by generation"
        sub={`Pick a family to see what each release replaced. The number on the arrow is the change in intelligence index, so a bigger model is not automatically the better buy.${scope === 'all' ? '' : ` Showing ${SCOPE_META[scope].label.toLowerCase()} only.`}`}
        right={
          <span className="hidden items-center gap-1.5 font-mono text-[9px] tracking-[0.06em] text-dim uppercase sm:flex">
            {families.length} families tracked
          </span>
        }
      />

      <div className="panel overflow-hidden">
        <div className="scroll-x fade-r wrap-lg flex gap-1.5 border-b border-line px-3.5 py-3">
          {families.map((f) => (
            <button
              key={f.name}
              onClick={() => setFamily(f.name)}
              className="chip"
              data-on={f.name === current?.name}
            >
              <span
                className="size-1.5 rounded-full"
                style={{ background: f.name === family ? '#060708' : vendor(f.vendor).color }}
              />
              {f.name}
              <span className="num rounded-sm bg-white/10 px-1 text-[8.5px] opacity-80">
                {f.models.length}
              </span>
            </button>
          ))}
        </div>

        <div className="scroll-x px-4 py-4">
          <div className="mx-auto flex min-w-max items-stretch">
            {current?.models.map((m, i) => (
              <div key={m.id} className="flex items-stretch">
                {i > 0 && <Connector from={current.models[i - 1]} to={m} />}
                <Node m={m} active={m.id === selectedId} onClick={() => onOpen(m.id)} />
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-x-3 gap-y-2 border-t border-line px-4 py-3">
          <span className="label">also from {current ? vendor(current.vendor).short : ''}</span>
          {related.slice(0, 5).map((f) => {
            const best = Math.max(...f.models.map((m) => m.aa ?? 0))
            return (
              <button key={f.name} onClick={() => setFamily(f.name)} className="chip">
                <span className="size-1.5 rounded-full" style={{ background: vendor(f.vendor).color }} />
                {f.name}
                <span className="num opacity-60">{best ? best.toFixed(1) : '—'}</span>
              </button>
            )
          })}
          {related.length === 0 && (
            <span className="font-mono text-[9.5px] text-dim">
              no other multi-generation family from this lab yet
            </span>
          )}
          <span className="ml-auto hidden font-mono text-[9px] text-dim sm:block">
            click a variant to swap the chain
          </span>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line px-4 py-2.5">
          <p className="font-mono text-[9px] leading-[1.6] text-dim">
            {current
              ? `${vendor(current.vendor).name} · ${current.models.length} generations`
              : ''}{' '}
            · parent links come from each lab’s release notes; restricted siblings such as Mythos sit
            in their own family.
          </p>
          {selectedChain.length > 1 && (
            <div className="flex items-center gap-1.5 font-mono text-[9px] text-dim">
              <span className="uppercase">selected</span>
              {selectedChain.map((m, i) => (
                <span key={m.id} className="flex items-center gap-1.5">
                  {i > 0 && <span className="text-line2">›</span>}
                  <button
                    onClick={() => onOpen(m.id)}
                    className={m.id === selectedId ? 'text-accent' : 'text-mute hover:text-fg'}
                  >
                    {m.name}
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
