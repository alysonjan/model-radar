import { Fragment, useMemo, useState } from 'react'
import { MODELS, type Model } from '../data/models'
import { VENDORS, vendor } from '../data/vendors'
import {
  fmtContext,
  fmtDate,
  fmtPrice,
  fmtScore,
  isNew,
  rankOf,
} from '../lib/derive'
import { ScoreBar, SectionHead, Tag, VendorDot, WeightsTag } from './ui'
import { ScopeSwitch } from './ScopeSwitch'
import { SCOPE_META, inScope, type Scope } from '../lib/scope'

type SortKey = 'name' | 'vendor' | 'released' | 'aa' | 'coding' | 'agentic' | 'knowledge' | 'contextK' | 'priceOut' | 'weights'
type Dir = 'asc' | 'desc'

const LABELS: Record<SortKey, string> = {
  name: 'model',
  vendor: 'lab',
  released: 'released',
  aa: 'score',
  coding: 'coding',
  agentic: 'agentic',
  knowledge: 'knowledge',
  contextK: 'context',
  priceOut: '$ / 1m',
  weights: 'weights',
}

function value(m: Model, k: SortKey): number | string | null {
  switch (k) {
    case 'name':
      return m.name.toLowerCase()
    case 'vendor':
      return vendor(m.vendor).name
    case 'released':
      return m.released
    case 'aa':
      return m.aa
    case 'coding':
      return m.bench?.coding ?? null
    case 'agentic':
      return m.bench?.agentic ?? null
    case 'knowledge':
      return m.bench?.knowledge ?? null
    case 'contextK':
      return m.contextK
    case 'priceOut':
      return m.priceOut ?? null
    case 'weights':
      return m.weights
  }
}

export function ModelsTable({
  selectedId,
  onOpen,
  scope,
  onScope,
}: {
  selectedId: string | null
  onOpen: (id: string) => void
  scope: Scope
  onScope: (s: Scope) => void
}) {
  const [q, setQ] = useState('')
  const [lab, setLab] = useState('all')
  const [grouped, setGrouped] = useState(true)
  const [sort, setSort] = useState<{ key: SortKey; dir: Dir }>({ key: 'aa', dir: 'desc' })

  const rows = useMemo(() => {
    const needle = q.trim().toLowerCase()
    const out = MODELS.filter((m) => {
      if (lab !== 'all' && m.vendor !== lab) return false
      if (!inScope(m, scope)) return false
      if (!needle) return true
      return (
        m.name.toLowerCase().includes(needle) ||
        m.family.toLowerCase().includes(needle) ||
        vendor(m.vendor).name.toLowerCase().includes(needle) ||
        m.note.toLowerCase().includes(needle)
      )
    })

    out.sort((a, b) => {
      const va = value(a, sort.key)
      const vb = value(b, sort.key)
      if (va === null && vb === null) return 0
      if (va === null) return 1
      if (vb === null) return -1
      const cmp = typeof va === 'number' && typeof vb === 'number' ? va - vb : String(va).localeCompare(String(vb))
      return sort.dir === 'asc' ? cmp : -cmp
    })
    return out
  }, [q, lab, scope, sort])

  const toggle = (k: SortKey) =>
    setSort((s) => (s.key === k ? { key: k, dir: s.dir === 'asc' ? 'desc' : 'asc' } : { key: k, dir: k === 'name' || k === 'vendor' ? 'asc' : 'desc' }))

  const groups = useMemo(() => {
    if (scope !== 'all' || !grouped) return [{ key: 'all', label: null as string | null, rows }]
    const open = rows.filter((m) => m.weights !== 'closed')
    const closed = rows.filter((m) => m.weights === 'closed')
    return [
      { key: 'open', label: 'open weights', rows: open },
      { key: 'closed', label: 'proprietary', rows: closed },
    ]
  }, [rows, scope, grouped])

  const labs = useMemo(
    () =>
      [...VENDORS]
        .map((v) => ({ ...v, n: MODELS.filter((m) => m.vendor === v.id).length }))
        .filter((v) => v.n > 0)
        .sort((a, b) => b.n - a.n),
    [],
  )

  return (
    <section id="models" className="mx-auto max-w-[1340px] px-4 pt-10 sm:px-7">
      <SectionHead
        index="05"
        kicker="the full board"
        title="Every model, every number"
        sub={`Search, filter and sort the set${scope === 'all' ? ' — grouped into open weights and proprietary' : `, scoped to ${SCOPE_META[scope].label.toLowerCase()}`}. Click any row for the full spec, its lineage and the source.`}
        right={
          <span className="hidden font-mono text-[9px] tracking-[0.06em] text-dim uppercase sm:block">
            {rows.length} shown · {scope === 'all' ? 'both' : SCOPE_META[scope].short.toLowerCase()}
          </span>
        }
      />

      <div className="panel overflow-hidden">
        <div className="flex flex-col gap-2 border-b border-line p-3 lg:flex-row lg:items-center">
          <label className="relative flex-1">
            <svg viewBox="0 0 16 16" className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-dim" fill="none" aria-hidden>
              <circle cx="7" cy="7" r="4.2" stroke="currentColor" strokeWidth="1.3" />
              <path d="m10.5 10.5 3 3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
            </svg>
            <input
              id="model-search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search a model, lab or family…"
              className="w-full rounded-lg border border-line bg-white/[0.02] py-1.5 pr-8 pl-8 text-[12.5px] text-fg placeholder:text-dim focus:border-line2 focus:outline-none"
            />
            {q && (
              <button
                onClick={() => setQ('')}
                aria-label="Clear search"
                className="absolute top-1/2 right-2 -translate-y-1/2 font-mono text-[11px] text-dim hover:text-fg"
              >
                ✕
              </button>
            )}
          </label>

          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <select
                value={lab}
                onChange={(e) => setLab(e.target.value)}
                className="appearance-none rounded-lg border border-line bg-panel py-1.5 pr-7 pl-2.5 font-mono text-[10.5px] tracking-[0.03em] text-mute focus:border-line2 focus:outline-none"
              >
                <option value="all">all labs</option>
                {labs.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.short} ({v.n})
                  </option>
                ))}
              </select>
              <span className="pointer-events-none absolute top-1/2 right-2 -translate-y-1/2 text-[9px] text-dim">▾</span>
            </div>

            <ScopeSwitch scope={scope} onChange={onScope} size="sm" />

            <button
              onClick={() => setGrouped((g) => !g)}
              className="chip"
              data-on={scope === 'all' && grouped}
              disabled={scope !== 'all'}
              style={scope !== 'all' ? { opacity: 0.4, cursor: 'not-allowed' } : undefined}
              title="Split the list into open weights and proprietary"
            >
              group by access
            </button>

            {(q || lab !== 'all' || scope !== 'all') && (
              <button
                onClick={() => {
                  setQ('')
                  setLab('all')
                  onScope('all')
                }}
                className="font-mono text-[9.5px] text-accent uppercase hover:text-fg"
              >
                reset
              </button>
            )}
          </div>
        </div>

        <div className="max-h-[600px] overflow-auto">
          <table className="tbl w-full min-w-[980px] border-collapse">
            <thead>
              <tr>
                {(['name', 'vendor', 'released', 'aa', 'coding', 'agentic', 'knowledge', 'contextK', 'priceOut', 'weights'] as SortKey[]).map((k) => (
                  <th
                    key={k}
                    onClick={() => toggle(k)}
                    className={`${k === 'priceOut' ? 'text-right' : ''} ${
                      k === 'agentic' || k === 'knowledge' ? 'hidden xl:table-cell' : ''
                    }`}
                  >
                    <span className="inline-flex items-center gap-1">
                      {LABELS[k]}
                      {sort.key === k && <span className="text-accent">{sort.dir === 'asc' ? '↑' : '↓'}</span>}
                    </span>
                  </th>
                ))}
                <th className="cursor-default">parent</th>
              </tr>
            </thead>
            <tbody>
              {groups.map((g) => {
                const best = Math.max(...g.rows.map((m) => m.aa ?? 0))
                return (
                  <Fragment key={g.key}>
                    {g.label && (
                      <tr className="group-row">
                        <td
                          colSpan={11}
                          style={{
                            background:
                              g.key === 'open' ? 'rgb(var(--accent-rgb) / 0.075)' : 'rgba(255,255,255,0.055)',
                            borderTopColor:
                              g.key === 'open' ? 'rgb(var(--accent-rgb) / 0.45)' : 'rgba(255,255,255,0.24)',
                          }}
                        >
                          <span className="flex items-center gap-2.5">
                            <span
                              className="size-1.5 rounded-full"
                              style={{ background: g.key === 'open' ? 'var(--color-accent)' : '#cbd5e1' }}
                            />
                            <span className="text-fg">{g.label}</span>
                            <span className="text-dim">{g.rows.length} models</span>
                            {best > 0 && (
                              <span className="ml-auto text-dim">
                                best <span className="text-fg">{best.toFixed(1)}</span>
                              </span>
                            )}
                          </span>
                        </td>
                      </tr>
                    )}
                    {g.rows.map((m) => {
                const rank = rankOf(m.id)
                return (
                  <tr key={m.id} data-sel={selectedId === m.id} onClick={() => onOpen(m.id)}>
                    <td className="max-w-[230px]">
                      <div className="flex items-center gap-2">
                        <VendorDot id={m.vendor} size={5} />
                        <span className="truncate font-medium text-fg">{m.name}</span>
                        {isNew(m.released) && <Tag tone="new">new</Tag>}
                        {m.status !== 'GA' && <Tag tone={m.status === 'Preview' ? 'preview' : 'limited'}>{m.status}</Tag>}
                      </div>
                    </td>
                    <td className="text-[11.5px] text-fg/75">{vendor(m.vendor).short}</td>
                    <td className="num text-[10.5px] text-mute">{fmtDate(m.released)}</td>
                    <td>
                      <div className="flex items-center gap-2">
                        <span className="num w-8 text-[12px] text-fg">{fmtScore(m.aa)}</span>
                        <ScoreBar value={m.aa ?? 0} color={vendor(m.vendor).color} width={40} />
                        <span className="num w-6 text-[9px] text-dim">{rank ? `#${rank}` : ''}</span>
                      </div>
                    </td>
                    <td className="num text-[11px] text-fg/70">{m.bench?.coding?.toFixed(1) ?? '–'}</td>
                    <td className="num hidden text-[11px] text-fg/70 xl:table-cell">{m.bench?.agentic?.toFixed(1) ?? '–'}</td>
                    <td className="num hidden text-[11px] text-fg/70 xl:table-cell">{m.bench?.knowledge?.toFixed(1) ?? '–'}</td>
                    <td className="num text-[11px] text-fg/70">{fmtContext(m.contextK)}</td>
                    <td className="num text-right text-[11px] text-fg/70">
                      {m.priceOut === 0 ? 'free' : fmtPrice(m.priceOut)}
                      <span className="ml-1 text-[9px] text-dim">out</span>
                    </td>
                    <td>
                      <WeightsTag weights={m.weights} />
                    </td>
                    <td className="max-w-[160px] truncate text-[10.5px] text-mute">
                      {m.parent ? MODELS.find((p) => p.id === m.parent)?.name ?? '—' : '—'}
                    </td>
                  </tr>
                )
                    })}
                  </Fragment>
                )
              })}
            </tbody>
          </table>
          {rows.length === 0 && (
            <div className="px-4 py-10 text-center font-mono text-[11px] text-dim">
              no model matches “{q}” — try a lab name or clear the filters
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-line px-3.5 py-2.5">
          <p className="font-mono text-[9px] leading-relaxed text-dim">
            – means no published result yet. Coding, agentic and knowledge come from BenchLM’s top-10 boards.
          </p>
          <p className="font-mono text-[9px] text-dim">
            {rows.length} rows · snapshot 19 Nov 2026
          </p>
        </div>
      </div>
    </section>
  )
}
