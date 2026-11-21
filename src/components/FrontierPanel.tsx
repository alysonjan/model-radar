import { useEffect, useMemo, useRef, useState } from 'react'
import { MODELS, SCORE_AS_OF, SNAPSHOT_DATE, type Model } from '../data/models'
import { vendor } from '../data/vendors'
import { dateObj, fmtContext, fmtDate, fmtPrice, frontierSeries } from '../lib/derive'
import { gapToClosed, scopeStats, type Scope } from '../lib/scope'
import { Arrow, Tag, VendorDot } from './ui'

export type View = 'frontier' | 'value' | 'matrix' | 'split'
type Range = '6m' | '12m' | 'all'

const RANGES: { id: Range; label: string; months: number | null }[] = [
  { id: '6m', label: '6M', months: 6 },
  { id: '12m', label: '12M', months: 12 },
  { id: 'all', label: 'ALL', months: null },
]

function useWidth<T extends HTMLElement>() {
  const ref = useRef<T | null>(null)
  const [w, setW] = useState(0)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const ro = new ResizeObserver((entries) => {
      const cw = entries[0]?.contentRect.width ?? 0
      setW(cw)
    })
    ro.observe(el)
    setW(el.getBoundingClientRect().width)
    return () => ro.disconnect()
  }, [])
  return { ref, w }
}

const M = { l: 36, r: 14, t: 26, b: 26 }
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

function monthsBetween(a: Date, b: Date): Date[] {
  const out: Date[] = []
  const d = new Date(Date.UTC(a.getUTCFullYear(), a.getUTCMonth(), 1))
  while (d.getTime() <= b.getTime()) {
    out.push(new Date(d))
    d.setUTCMonth(d.getUTCMonth() + 1)
  }
  return out
}

/* ─────────────────────────── time × score ─────────────────────────── */

function TimeScatter({
  models,
  w,
  h,
  selectedId,
  hoverId,
  onHover,
  onSelect,
  focusVendor,
}: {
  models: Model[]
  w: number
  h: number
  selectedId: string | null
  hoverId: string | null
  onHover: (id: string | null) => void
  onSelect: (id: string) => void
  focusVendor: string | null
}) {
  const iw = w - M.l - M.r
  const ih = h - M.t - M.b

  const scored = useMemo(
    () => models.filter((m) => m.aa !== null).sort((a, b) => a.released.localeCompare(b.released)),
    [models],
  )

  const t0 = useMemo(
    () => Math.min(...scored.map((m) => dateObj(m.released).getTime())),
    [scored],
  )
  const t1 = useMemo(() => dateObj('2026-11-19').getTime(), [])
  const span = Math.max(1, t1 - t0)
  const pad = span * 0.03

  const x = (t: number) => M.l + ((t - (t0 - pad)) / (span + pad * 2)) * iw
  const y = (v: number) => M.t + ih - (v / 70) * ih

  const months = monthsBetween(new Date(Math.max(t0 - pad, dateObj('2025-01-01').getTime())), new Date(t1))
  const every = months.length > 16 ? 2 : 1

  const envelope = useMemo(() => {
    const pts = frontierSeries(scored)
    if (!pts.length) return { line: '', area: '' }
    let line = `M${x(pts[0].t).toFixed(1)},${y(pts[0].v).toFixed(1)}`
    for (let i = 1; i < pts.length; i += 1) {
      line += ` H${x(pts[i].t).toFixed(1)} V${y(pts[i].v).toFixed(1)}`
    }
    const first = pts[0]
    const last = pts[pts.length - 1]
    const area = `${line} L${x(last.t).toFixed(1)},${y(0).toFixed(1)} L${x(first.t).toFixed(1)},${y(0).toFixed(1)} Z`
    return { line, area }
  }, [scored, w, h])

  // label priority: records (new all-time bests), newest releases
  const labels = useMemo(() => {
    const out: string[] = []
    let best = -1
    for (const m of scored) {
      if ((m.aa ?? 0) > best) {
        best = m.aa as number
        out.push(m.id)
      }
    }
    const newest = [...scored].sort((a, b) => b.released.localeCompare(a.released)).slice(0, w < 560 ? 2 : 3)
    for (const m of newest) if (!out.includes(m.id)) out.push(m.id)
    if (selectedId && !out.includes(selectedId)) out.push(selectedId)
    // on a phone only the latest records are labelled, or the plot turns to noise
    if (w < 560) return out.filter((id) => id === selectedId || newest.some((m) => m.id === id) || out.indexOf(id) >= out.length - 4)
    return out
  }, [scored, selectedId])

  const placed: { x1: number; x2: number; y1: number; y2: number }[] = []
  const labelNodes: { m: Model; x: number; y: number; dy: number }[] = []
  for (const id of labels) {
    const m = models.find((mm) => mm.id === id)
    if (!m || m.aa === null) continue
    const px = x(dateObj(m.released).getTime())
    const py = y(m.aa)
    const text = m.name
    const width = text.length * 4.9 + 4
    const above = py > M.t + 18
    const ly = above ? py - 9 : py + 15
    const box = {
      x1: px - width / 2,
      x2: px + width / 2,
      y1: ly - 8,
      y2: ly + 3,
    }
    const clash = placed.some(
      (p) => box.x1 < p.x2 + 2 && box.x2 > p.x1 - 2 && box.y1 < p.y2 + 1 && box.y2 > p.y1 - 1,
    )
    if (clash) continue
    placed.push(box)
    labelNodes.push({ m, x: px, y: py, dy: ly })
  }

  return (
    <svg width={w} height={h} role="img" aria-label="Capability against release date">
      <defs>
        <linearGradient id="frontierFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--color-accent)" stopOpacity="0.14" />
          <stop offset="100%" stopColor="var(--color-accent)" stopOpacity="0" />
        </linearGradient>
        <clipPath id="plotClip">
          <rect x={M.l} y={M.t - 4} width={iw} height={ih + 4} />
        </clipPath>
      </defs>

      {/* grid */}
      {[0, 10, 20, 30, 40, 50, 60, 70].map((tick) => (
        <g key={tick}>
          <line
            x1={M.l}
            x2={w - M.r}
            y1={y(tick)}
            y2={y(tick)}
            stroke={tick === 0 ? '#262c36' : '#181d24'}
            strokeWidth={1}
          />
          <text
            x={M.l - 7}
            y={y(tick) + 3}
            textAnchor="end"
            className="num"
            fontSize="9"
            fill="#5d6572"
          >
            {tick}
          </text>
        </g>
      ))}

      {months.map((d, i) => {
        if (i % every !== 0) return null
        const px = x(d.getTime())
        if (px < M.l || px > w - M.r) return null
        const label =
          d.getUTCMonth() === 0
            ? `Jan ’${String(d.getUTCFullYear()).slice(2)}`
            : MONTHS[d.getUTCMonth()]
        return (
          <g key={d.toISOString()}>
            <line
              x1={px}
              x2={px}
              y1={M.t}
              y2={M.t + ih}
              stroke="#141920"
              strokeWidth={1}
              strokeDasharray={d.getUTCMonth() === 0 ? undefined : '2 4'}
            />
            <text
              x={px}
              y={h - 8}
              textAnchor="middle"
              fontSize="9"
              fill="#5d6572"
              className="num"
            >
              {label}
            </text>
          </g>
        )
      })}

      <g clipPath="url(#plotClip)">
        <path d={envelope.area} fill="url(#frontierFill)" />
        <path
          d={envelope.line}
          fill="none"
          stroke="var(--color-accent)"
          strokeWidth="1.8"
          strokeOpacity="0.7"
          strokeLinejoin="round"
          style={{ filter: 'drop-shadow(0 0 6px rgb(var(--accent-rgb) / 0.25))' }}
        />
      </g>

      {scored.map((m) => {
        const px = x(dateObj(m.released).getTime())
        const py = y(m.aa as number)
        const color = vendor(m.vendor).color
        const dim = focusVendor && m.vendor !== focusVendor
        const isSel = selectedId === m.id
        const isHover = hoverId === m.id
        const isOpen = m.weights !== 'closed'
        return (
          <g
            key={m.id}
            tabIndex={0}
            role="button"
            aria-label={`${m.name}, ${m.aa?.toFixed(1)} on the intelligence index`}
            onClick={() => onSelect(m.id)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') onSelect(m.id)
            }}
            onPointerEnter={() => onHover(m.id)}
            onPointerLeave={() => onHover(null)}
            style={{ cursor: 'pointer', opacity: dim ? 0.16 : 1, transition: 'opacity .2s' }}
          >
            {(isSel || isHover) && (
              <circle cx={px} cy={py} r={11} fill={color} fillOpacity={isSel ? 0.18 : 0.1} />
            )}
            <circle
              cx={px}
              cy={py}
              r={11}
              fill="transparent"
            />
            <circle
              cx={px}
              cy={py}
              r={isSel || isHover ? 5.5 : 3.6}
              fill={color}
              fillOpacity={0.9}
              stroke={isOpen ? '#e9ecf1' : '#060708'}
              strokeOpacity={isOpen ? 0.7 : 0.9}
              strokeWidth={isOpen ? 1.2 : 1}
            />
            <title>{`${m.name} — ${m.aa?.toFixed(1)} · ${fmtDate(m.released)}`}</title>
          </g>
        )
      })}

      {labelNodes.map(({ m, x: px, dy }) => (
        <text
          key={`l-${m.id}`}
          x={Math.max(M.l + 34, Math.min(w - M.r - 34, px))}
          y={dy}
          textAnchor="middle"
          fontSize="9.5"
          fill={selectedId === m.id ? '#e9ecf1' : '#b3bcc9'}
          stroke="#060708"
          strokeWidth="3"
          paintOrder="stroke"
          className="num"
          pointerEvents="none"
        >
          {m.name}
        </text>
      ))}

      <text x={M.l} y={12} fontSize="9" fill="#6f7887" className="label">
        AA index v5
      </text>
    </svg>
  )
}

/* ─────────────────────────── price × score ─────────────────────────── */

function PriceScatter({
  models,
  w,
  h,
  selectedId,
  hoverId,
  onHover,
  onSelect,
  focusVendor,
}: {
  models: Model[]
  w: number
  h: number
  selectedId: string | null
  hoverId: string | null
  onHover: (id: string | null) => void
  onSelect: (id: string) => void
  focusVendor: string | null
}) {
  const iw = w - M.l - M.r
  const ih = h - M.t - M.b
  const pts = useMemo(
    () => models.filter((m) => m.aa !== null && !!m.priceOut && m.priceOut > 0),
    [models],
  )
  const lx0 = Math.log10(0.05)
  const lx1 = Math.log10(200)
  const x = (p: number) => M.l + ((Math.log10(p) - lx0) / (lx1 - lx0)) * iw
  const y = (v: number) => M.t + ih - (v / 70) * ih

  const ticks = [0.1, 0.3, 1, 3, 10, 30, 100]
  const bestValue = useMemo(
    () =>
      [...pts]
        .sort((a, b) => (b.aa as number) / (b.priceOut as number) - (a.aa as number) / (a.priceOut as number))
        .slice(0, 4)
        .map((m) => m.id),
    [pts],
  )

  // label in priority order, skipping any that would collide with one already placed
  const labelIds: string[] = []
  const boxes: { x1: number; x2: number; y1: number; y2: number }[] = []
  const priority = [
    ...pts.filter((m) => m.id === selectedId || m.id === hoverId),
    ...pts.filter((m) => bestValue.includes(m.id) && m.id !== selectedId && m.id !== hoverId),
  ]
  for (const m of priority) {
    if (m.aa === null || !m.priceOut) continue
    const px = x(m.priceOut)
    const py = y(m.aa)
    const textW = m.name.length * 4.7 + 4
    const box = { x1: px + 8, x2: px + 8 + textW, y1: py - 9, y2: py + 3 }
    if (box.x2 > w - M.r + 40) {
      box.x1 = px - 8 - textW
      box.x2 = px - 8
    }
    const clash = boxes.some(
      (b) => box.x1 < b.x2 + 3 && box.x2 > b.x1 - 3 && box.y1 < b.y2 + 2 && box.y2 > b.y1 - 2,
    )
    if (clash) continue
    boxes.push(box)
    labelIds.push(m.id)
  }

  return (
    <svg width={w} height={h} role="img" aria-label="Output price against capability">
      {[0, 10, 20, 30, 40, 50, 60, 70].map((tick) => (
        <g key={tick}>
          <line
            x1={M.l}
            x2={w - M.r}
            y1={y(tick)}
            y2={y(tick)}
            stroke={tick === 0 ? '#262c36' : '#181d24'}
          />
          <text x={M.l - 7} y={y(tick) + 3} textAnchor="end" fontSize="9" fill="#5d6572" className="num">
            {tick}
          </text>
        </g>
      ))}
      {ticks.map((p) => (
        <g key={p}>
          <line x1={x(p)} x2={x(p)} y1={M.t} y2={M.t + ih} stroke="#141920" strokeDasharray="2 4" />
          <text x={x(p)} y={h - 8} textAnchor="middle" fontSize="9" fill="#5d6572" className="num">
            ${p < 1 ? p.toFixed(1) : p}
          </text>
        </g>
      ))}

      <text x={M.l + 4} y={M.t - 10} fontSize="9" fill="#6f7887" className="label">
        AA index v5 ↑
      </text>
      <text x={w - M.r - 4} y={h - 8} fontSize="9" fill="#6f7887" textAnchor="end" className="label">
        output $ / 1M tokens →
      </text>

      {pts.map((m) => {
        const px = x(m.priceOut as number)
        const py = y(m.aa as number)
        const color = vendor(m.vendor).color
        const dim = focusVendor && m.vendor !== focusVendor
        const isSel = selectedId === m.id
        const isHover = hoverId === m.id
        const labelled = labelIds.includes(m.id)
        return (
          <g
            key={m.id}
            tabIndex={0}
            role="button"
            aria-label={`${m.name}, ${m.aa?.toFixed(1)} at ${fmtPrice(m.priceOut)} per million`}
            onClick={() => onSelect(m.id)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') onSelect(m.id)
            }}
            onPointerEnter={() => onHover(m.id)}
            onPointerLeave={() => onHover(null)}
            style={{ cursor: 'pointer', opacity: dim ? 0.14 : 1, transition: 'opacity .2s' }}
          >
            <circle cx={px} cy={py} r={11} fill="transparent" />
            <circle cx={px} cy={py} r={isSel || isHover ? 6 : 4} fill={color} fillOpacity={0.9} stroke="#060708" strokeWidth={1} />
            {labelled && (
              <text
                x={px + 8}
                y={py + 3}
                fontSize="9"
                fill={isSel || isHover ? '#e9ecf1' : '#a9b1be'}
                className="num"
              >
                {m.name}
              </text>
            )}
            <title>{`${m.name} — ${fmtPrice(m.priceOut)}/1M out · ${m.aa?.toFixed(1)}`}</title>
          </g>
        )
      })}
    </svg>
  )
}

/* ─────────────────────────── matrix ─────────────────────────── */

const MATRIX_COLS = [
  { key: 'aa', label: 'Overall' },
  { key: 'coding', label: 'Coding' },
  { key: 'agentic', label: 'Agentic' },
  { key: 'knowledge', label: 'Knowledge' },
] as const

function Matrix({
  models,
  selectedId,
  onSelect,
  onHover,
}: {
  models: Model[]
  selectedId: string | null
  onSelect: (id: string) => void
  onHover: (id: string | null) => void
}) {
  const rows = useMemo(
    () => [...models].filter((m) => m.aa !== null).sort((a, b) => (b.aa as number) - (a.aa as number)).slice(0, 12),
    [models],
  )

  const val = (m: Model, key: (typeof MATRIX_COLS)[number]['key']): number | null => {
    if (key === 'aa') return m.aa
    return m.bench?.[key] ?? null
  }

  // normalise within each column so the heat reads as "best in this column"
  const ranges = useMemo(() => {
    const out: Record<string, { min: number; max: number }> = {}
    for (const c of MATRIX_COLS) {
      const vals = rows.map((m) => val(m, c.key)).filter((v): v is number => v !== null)
      out[c.key] = { min: Math.min(...vals), max: Math.max(...vals) }
    }
    return out
  }, [rows])

  const heat = (key: (typeof MATRIX_COLS)[number]['key'], v: number): number => {
    const r = ranges[key]
    const t = r.max === r.min ? 1 : (v - r.min) / (r.max - r.min)
    return 0.08 + Math.max(0, Math.min(1, t)) * 0.38
  }

  return (
    <div className="px-4 pb-4">
      <div className="grid grid-cols-[minmax(170px,1.6fr)_repeat(4,minmax(52px,1fr))] gap-x-1.5">
        <div className="label pb-2">model</div>
        {MATRIX_COLS.map((c) => (
          <div key={c.key} className="label pb-2 text-right">
            {c.label}
          </div>
        ))}
        {rows.map((m) => {
          const color = vendor(m.vendor).color
          return (
            <div
              key={m.id}
              className={`col-span-5 grid grid-cols-subgrid items-center gap-x-1.5 border-t border-line/60 py-1 ${
                selectedId === m.id ? 'bg-accent/[0.04]' : ''
              }`}
            >
              <button
                onClick={() => onSelect(m.id)}
                onPointerEnter={() => onHover(m.id)}
                onPointerLeave={() => onHover(null)}
                className={`flex items-center gap-2 py-1 pl-1 text-left ${selectedId === m.id ? 'text-accent' : 'text-mute hover:text-fg'}`}
              >
                <VendorDot id={m.vendor} size={5} />
                <span className="truncate text-[11.5px]">{m.name}</span>
              </button>
              {MATRIX_COLS.map((c) => {
                const v = val(m, c.key)
                const alpha = v === null ? 0 : heat(c.key, v)
                return (
                  <div
                    key={c.key}
                    onClick={() => onSelect(m.id)}
                    className="cursor-pointer rounded-[3px] py-[5px] text-right font-mono text-[10.5px] tabular-nums"
                    style={{
                      background: v === null ? 'transparent' : `${color}${Math.round(alpha * 255).toString(16).padStart(2, '0')}`,
                      color: v === null ? '#4a525e' : 'rgba(233,236,241,0.94)',
                    }}
                  >
                    {v === null ? '–' : v.toFixed(1)}
                  </div>
                )
              })}
            </div>
          )
        })}
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <span className="label">heat</span>
        <span
          className="h-1.5 w-24 rounded-full"
          style={{ background: 'linear-gradient(90deg, rgba(255,255,255,0.07), rgb(var(--accent-rgb) / 0.5))' }}
        />
        <span className="font-mono text-[9px] text-dim">
          lowest → highest in each column · hue is the lab · dash = not on the board
        </span>
      </div>
    </div>
  )
}

/* ─────────────────────── open vs closed frontiers ─────────────────────── */

function SplitScatter({
  w,
  h,
  selectedId,
  hoverId,
  onHover,
  onSelect,
}: {
  w: number
  h: number
  selectedId: string | null
  hoverId: string | null
  onHover: (id: string | null) => void
  onSelect: (id: string) => void
}) {
  const iw = w - M.l - M.r
  const ih = h - M.t - M.b
  const closed = MODELS.filter((m) => m.weights === 'closed' && m.aa !== null)
  const open = MODELS.filter((m) => m.weights !== 'closed' && m.aa !== null)
  const scored = [...closed, ...open]

  const t0 = Math.min(...scored.map((m) => dateObj(m.released).getTime()))
  const t1 = dateObj(SNAPSHOT_DATE).getTime()
  const span = Math.max(1, t1 - t0)
  const x = (t: number) => M.l + ((t - t0) / span) * iw
  const y = (v: number) => M.t + ih - (v / 70) * ih

  const lineFor = (arr: Model[]) => {
    const pts = frontierSeries(arr)
    if (!pts.length) return { d: '', last: 0 }
    let d = `M${x(pts[0].t).toFixed(1)},${y(pts[0].v).toFixed(1)}`
    for (let i = 1; i < pts.length; i += 1) {
      d += ` H${x(pts[i].t).toFixed(1)} V${y(pts[i].v).toFixed(1)}`
    }
    return { d, last: pts[pts.length - 1].v }
  }
  const cLine = lineFor(closed)
  const oLine = lineFor(open)
  const gap = Number((cLine.last - oLine.last).toFixed(1))

  const months = monthsBetween(new Date(t0), new Date(t1))
  const every = months.length > 16 ? 2 : 1
  const bracketX = w - M.r - 6

  return (
    <svg width={w} height={h} role="img" aria-label="Open weights against proprietary models over time">
      <text x={M.l} y={12} fontSize="9" fill="#6f7887" className="label">
        AA index v5
      </text>
      {[0, 10, 20, 30, 40, 50, 60, 70].map((tick) => (
        <g key={tick}>
          <line
            x1={M.l}
            x2={w - M.r}
            y1={y(tick)}
            y2={y(tick)}
            stroke={tick === 0 ? '#262c36' : '#181d24'}
          />
          <text x={M.l - 7} y={y(tick) + 3} textAnchor="end" fontSize="9" fill="#5d6572" className="num">
            {tick}
          </text>
        </g>
      ))}

      {months.map((d, i) => {
        if (i % every !== 0) return null
        const px = x(d.getTime())
        if (px < M.l || px > w - M.r) return null
        const label = d.getUTCMonth() === 0 ? `Jan ’${String(d.getUTCFullYear()).slice(2)}` : MONTHS[d.getUTCMonth()]
        return (
          <text key={d.toISOString()} x={px} y={h - 8} textAnchor="middle" fontSize="9" fill="#5d6572" className="num">
            {label}
          </text>
        )
      })}

      {scored.map((m) => {
        const px = x(dateObj(m.released).getTime())
        const py = y(m.aa as number)
        const color = vendor(m.vendor).color
        const dimmed = selectedId !== m.id && hoverId !== m.id
        return (
          <g
            key={m.id}
            tabIndex={0}
            role="button"
            aria-label={`${m.name}, ${m.aa?.toFixed(1)}`}
            onClick={() => onSelect(m.id)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') onSelect(m.id)
            }}
            onPointerEnter={() => onHover(m.id)}
            onPointerLeave={() => onHover(null)}
            style={{ cursor: 'pointer', opacity: dimmed ? 0.55 : 1 }}
          >
            <circle cx={px} cy={py} r={10} fill="transparent" />
            <circle
              cx={px}
              cy={py}
              r={selectedId === m.id || hoverId === m.id ? 5 : 3}
              fill={color}
              fillOpacity={m.weights === 'closed' ? 0.5 : 0.9}
              stroke={m.weights === 'closed' ? '#060708' : '#e9ecf1'}
              strokeWidth={m.weights === 'closed' ? 1 : 0.9}
              strokeOpacity={0.7}
            />
            <title>{`${m.name} — ${m.aa?.toFixed(1)} · ${m.weights === 'closed' ? 'proprietary' : 'open weights'}`}</title>
          </g>
        )
      })}

      <path d={cLine.d} fill="none" stroke="#e9ecf1" strokeWidth="1.5" strokeOpacity="0.75" strokeLinejoin="round" />
      <path
        d={oLine.d}
        fill="none"
        stroke="var(--color-accent)"
        strokeWidth="2"
        strokeLinejoin="round"
        style={{ filter: 'drop-shadow(0 0 6px rgb(var(--accent-rgb) / 0.3))' }}
      />

      {gap > 0 && (
        <g>
          <line
            x1={bracketX}
            x2={bracketX}
            y1={y(oLine.last)}
            y2={y(cLine.last)}
            stroke="#6d7583"
            strokeDasharray="2 3"
          />
          <line x1={bracketX - 3} x2={bracketX + 3} y1={y(oLine.last)} y2={y(oLine.last)} stroke="#6d7583" />
          <line x1={bracketX - 3} x2={bracketX + 3} y1={y(cLine.last)} y2={y(cLine.last)} stroke="#6d7583" />
          <text
            x={bracketX - 7}
            y={(y(oLine.last) + y(cLine.last)) / 2 + 3}
            textAnchor="end"
            fontSize="10"
            fill="#cbd5e1"
            className="num"
          >
            {gap.toFixed(1)} pt gap
          </text>
        </g>
      )}

      <g>
        <rect x={M.l + 4} y={M.t - 2} width={11} height={2} rx={1} fill="#e9ecf1" opacity="0.75" />
        <text x={M.l + 20} y={M.t + 4} fontSize="9" fill="#b3bcc9" className="num">
          closed (proprietary) {cLine.last.toFixed(1)}
        </text>
        <rect x={M.l + 4} y={M.t + 12} width={11} height={2} rx={1} fill="var(--color-accent)" />
        <text x={M.l + 20} y={M.t + 18} fontSize="9" fill="var(--color-accent)" className="num">
          open weights {oLine.last.toFixed(1)}
        </text>
      </g>
    </svg>
  )
}

/* ─────────────────────────── readout ─────────────────────────── */

function Readout({
  model,
  onOpen,
  mode,
  reference,
}: {
  model: Model
  onOpen: (id: string) => void
  mode: 'hover' | 'selected' | 'leader'
  reference: Model
}) {
  const color = vendor(model.vendor).color
  const isLeader = model.id === reference.id
  const delta =
    model.aa !== null && reference.aa !== null && !isLeader ? model.aa - reference.aa : null

  return (
    <div className="flex min-h-0 flex-col border-line p-4 lg:border-l">
      <div className="mb-3 flex items-center justify-between">
        <span className="label">{mode === 'hover' ? 'hovering' : mode === 'leader' ? 'live readout' : 'selected'}</span>
        {model.weights === 'closed' ? (
          <Tag tone="closed">proprietary</Tag>
        ) : (
          <Tag tone="open">open weights</Tag>
        )}
      </div>

      <div className="flex items-start gap-2">
        <span className="mt-[5px]">
          <VendorDot id={model.vendor} size={7} />
        </span>
        <div className="min-w-0">
          <div className="text-[15px] leading-tight font-semibold tracking-[-0.01em]">{model.name}</div>
          <div className="mt-0.5 font-mono text-[9.5px] text-dim">
            {vendor(model.vendor).short} · {fmtDate(model.released)}
          </div>
        </div>
      </div>

      <div className="mt-3.5 flex items-end justify-between gap-2">
        <div className="flex items-end gap-1.5">
          <span className="num text-[34px] leading-[0.85] font-medium" style={{ color }}>
            {model.aa?.toFixed(1) ?? '—'}
          </span>
          <span className="mb-1 font-mono text-[8px] tracking-[0.08em] text-dim uppercase">aa v5</span>
        </div>
        <div className="mb-0.5 text-right">
          {isLeader ? (
            <Tag tone="new">leader</Tag>
          ) : delta !== null ? (
            <span className="font-mono text-[9px] text-mute">
              {delta > 0 ? '+' : ''}
              {delta.toFixed(1)} vs #1
            </span>
          ) : (
            <span className="font-mono text-[9px] text-dim">unscored</span>
          )}
          <div className="mt-1 font-mono text-[8px] text-dim">
            {model.aaConfig ? `${model.aaConfig} effort` : 'no published eval'}
          </div>
        </div>
      </div>

      <div className="mt-3 space-y-1.5">
        {(['coding', 'agentic', 'knowledge'] as const).map((k) => {
          const v = model.bench?.[k]
          return (
            <div key={k} className="flex items-center gap-2">
              <span className="w-[54px] font-mono text-[9px] tracking-[0.04em] text-dim uppercase">{k}</span>
              <span className="h-[3px] flex-1 overflow-hidden rounded-full bg-white/8">
                <span
                  className="block h-full rounded-full"
                  style={{ width: `${v ? Math.min(100, v) : 0}%`, background: color, opacity: 0.8 }}
                />
              </span>
              <span className="num w-8 text-right text-[9.5px] text-mute">{v?.toFixed(1) ?? '—'}</span>
            </div>
          )
        })}
      </div>

      <div className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2 border-t border-line/70 pt-3">
        <div>
          <div className="label mb-1">context</div>
          <div className="num text-[11.5px]">{fmtContext(model.contextK)}</div>
        </div>
        <div>
          <div className="label mb-1">price / 1M</div>
          <div className="num text-[11.5px]">
            {fmtPrice(model.priceIn)} / {fmtPrice(model.priceOut)}
          </div>
        </div>
        <div className="col-span-2 flex items-center justify-between border-t border-line/60 pt-2">
          <span className="label">replaces</span>
          {model.parent ? (
            <button
              onClick={() => onOpen(model.parent as string)}
              className="max-w-[150px] truncate font-mono text-[10px] text-mute hover:text-accent"
            >
              {MODELS.find((m) => m.id === model.parent)?.name ?? model.parent}
            </button>
          ) : (
            <span className="font-mono text-[9.5px] text-dim">first of its line</span>
          )}
        </div>
      </div>

      <p className="mt-3 line-clamp-3 text-[11px] leading-[1.5] text-dim">{model.note}</p>

      <button
        onClick={() => onOpen(model.id)}
        className="mt-auto flex items-center gap-1.5 pt-3 text-left font-mono text-[10px] tracking-[0.06em] text-accent uppercase hover:text-fg"
      >
        full spec <Arrow className="size-3" />
      </button>
    </div>
  )
}

/* ─────────────────────────── panel ─────────────────────────── */

export function FrontierPanel({
  selectedId,
  onSelect,
  scope,
  view,
  onView,
}: {
  selectedId: string | null
  onSelect: (id: string) => void
  scope: Scope
  view: View
  onView: (v: View) => void
}) {
  const [range, setRange] = useState<Range>('12m')
  const [hoverId, setHoverId] = useState<string | null>(null)
  const [focusVendor, setFocusVendor] = useState<string | null>(null)
  const { ref, w } = useWidth<HTMLDivElement>()
  const stats = useMemo(() => scopeStats(scope), [scope])
  const closedLeader = useMemo(() => scopeStats('closed').leader, [])
  const scoped = stats.models

  const rangeStart = useMemo(() => {
    const conf = RANGES.find((r) => r.id === range)
    if (!conf?.months) return null
    const d = dateObj('2026-11-19')
    d.setUTCMonth(d.getUTCMonth() - conf.months)
    return d.getTime()
  }, [range])

  const inRange = useMemo(
    () => (rangeStart ? scoped.filter((m) => dateObj(m.released).getTime() >= rangeStart) : scoped),
    [scoped, rangeStart],
  )

  const model = useMemo(() => {
    // the split chart always draws both sides, so its readout may point at a model
    // outside the current scope
    if (view === 'split') {
      const anyId = hoverId ?? selectedId
      return (anyId ? MODELS.find((m) => m.id === anyId) : undefined) ?? stats.leader
    }
    const hovered = hoverId ? scoped.find((m) => m.id === hoverId) : undefined
    const selected = selectedId ? scoped.find((m) => m.id === selectedId) : undefined
    return hovered ?? selected ?? stats.leader
  }, [view, hoverId, selectedId, scoped, stats.leader])

  const height = w < 640 ? 300 : 372
  const counts = useMemo(() => {
    const c = new Map<string, number>()
    for (const m of inRange) c.set(m.vendor, (c.get(m.vendor) ?? 0) + 1)
    return [...c.entries()].sort((a, b) => b[1] - a[1])
  }, [inRange])

  return (
    <section id="frontier" className="mx-auto max-w-[1340px] px-4 pt-4 sm:px-7">
      <div className="panel overflow-hidden">
        <div className="flex flex-wrap items-end justify-between gap-4 border-b border-line px-4 py-3.5 sm:px-5">
          <div>
            <div className="label mb-2 flex items-center gap-2">
              <span className="text-accent/80">01</span>
              <span className="h-px w-5 bg-line2" />
              {view === 'split' || scope === 'all'
                ? 'the frontier'
                : scope === 'open'
                  ? 'the frontier · open weights'
                  : 'the frontier · proprietary'}
            </div>
            <h2 className="text-[19px] leading-tight font-semibold tracking-[-0.02em] sm:text-[22px]">
              {view === 'frontier' &&
                (scope === 'all'
                  ? 'Capability, release by release'
                  : scope === 'open'
                    ? 'The open-weights frontier, release by release'
                    : 'The proprietary frontier, release by release')}
              {view === 'value' && 'What each point of intelligence costs'}
              {view === 'matrix' && 'One score is never the whole story'}
              {view === 'split' && 'How far open weights trail the closed frontier'}
            </h2>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {view === 'frontier' && (
              <div className="flex rounded-full border border-line bg-white/[0.02] p-0.5">
                {RANGES.map((r) => (
                  <button
                    key={r.id}
                    onClick={() => setRange(r.id)}
                    className={`rounded-full px-2.5 py-1 font-mono text-[9.5px] tracking-[0.06em] transition-colors ${
                      range === r.id ? 'bg-white/10 text-fg' : 'text-dim hover:text-mute'
                    }`}
                  >
                    {r.label}
                  </button>
                ))}
              </div>
            )}
            <span className="hidden h-4 w-px bg-line2 sm:block" />
            <div className="flex rounded-full border border-line bg-white/[0.02] p-0.5">
              {[
                { id: 'frontier' as View, label: 'TIME' },
                { id: 'value' as View, label: 'PRICE' },
                { id: 'matrix' as View, label: 'MIX' },
                { id: 'split' as View, label: 'SPLIT' },
              ].map((t) => (
                <button
                  key={t.id}
                  onClick={() => onView(t.id)}
                  className={`rounded-full px-2.5 py-1 font-mono text-[9.5px] tracking-[0.06em] transition-colors ${
                    view === t.id ? 'bg-accent text-ink' : 'text-dim hover:text-mute'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-[1fr_268px]">
          <div className="min-w-0">
            <div ref={ref} className="w-full px-1">
              {w > 0 && view === 'frontier' && (
                <TimeScatter
                  models={inRange}
                  w={w}
                  h={height}
                  selectedId={selectedId}
                  hoverId={hoverId}
                  onHover={setHoverId}
                  onSelect={onSelect}
                  focusVendor={focusVendor}
                />
              )}
              {w > 0 && view === 'value' && (
                <PriceScatter
                  models={scoped}
                  w={w}
                  h={height}
                  selectedId={selectedId}
                  hoverId={hoverId}
                  onHover={setHoverId}
                  onSelect={onSelect}
                  focusVendor={focusVendor}
                />
              )}
              {w > 0 && view === 'matrix' && (
                <div className="pt-3">
                  <Matrix models={scoped} selectedId={selectedId} onSelect={onSelect} onHover={setHoverId} />
                </div>
              )}
              {w > 0 && view === 'split' && (
                <SplitScatter
                  w={w}
                  h={height}
                  selectedId={selectedId}
                  hoverId={hoverId}
                  onHover={setHoverId}
                  onSelect={onSelect}
                />
              )}
            </div>

            <div className="flex flex-wrap items-center gap-1.5 px-4 pb-3.5">
              {counts.map(([vid, n]) => {
                const v = vendor(vid)
                const on = focusVendor === vid
                return (
                  <button
                    key={vid}
                    onClick={() => setFocusVendor(on ? null : vid)}
                    className="chip"
                    data-on={on}
                    title={`${v.name} — ${n} release${n === 1 ? '' : 's'} in range`}
                  >
                    <span className="size-1.5 rounded-full" style={{ background: on ? '#060708' : v.color }} />
                    {v.short}
                    <span className="num rounded-sm bg-white/10 px-1 text-[8.5px] opacity-80">{n}</span>
                  </button>
                )
              })}
              {focusVendor && (
                <button onClick={() => setFocusVendor(null)} className="chip chip-static text-accent">
                  clear
                </button>
              )}
              <span className="ml-1 hidden font-mono text-[9px] text-dim sm:inline">
                {view === 'split'
                  ? 'white = proprietary · lime = open weights'
                  : scope === 'all'
                    ? 'ring = open weights'
                    : 'shaded by lab'}
              </span>
            </div>
          </div>

          <div className="hidden lg:block">
            <Readout
              model={model}
              onOpen={onSelect}
              mode={hoverId ? 'hover' : selectedId ? 'selected' : 'leader'}
              reference={view === 'split' ? closedLeader : stats.leader}
            />
          </div>
        </div>

        <div className="border-t border-line px-4 py-2.5 sm:px-5">
          <p className="font-mono text-[9px] leading-[1.6] text-dim">
            {view === 'frontier' &&
              `Each dot is one release. Height = Artificial Analysis Intelligence Index v5, best published configuration (as of ${SCORE_AS_OF}). The line is the best score available on that date — the frontier envelope.`}
            {view === 'value' &&
              'Output list price against index score, log price axis. Top-left is the efficient corner; top-right is frontier at any cost. Open-weight and free models included where a price exists.'}
            {view === 'matrix' &&
              'Overall is the AA index; coding, agentic and knowledge come from BenchLM’s published top-10 boards, so blanks mean “didn’t make the board”, not zero.'}
            {view === 'split' &&
              `Two frontiers on the same axes: the best proprietary score and the best downloadable-weights score at each date. The right-hand bracket is today’s gap — ${gapToClosed().toFixed(1)} points — so it is directly comparable, not an estimate.`}
          </p>
        </div>
      </div>

      {/* mobile readout */}
      <div className="panel mt-2.5 lg:hidden">
        <Readout
          model={model}
          onOpen={onSelect}
          mode={hoverId ? 'hover' : selectedId ? 'selected' : 'leader'}
          reference={stats.leader}
        />
      </div>
    </section>
  )
}
