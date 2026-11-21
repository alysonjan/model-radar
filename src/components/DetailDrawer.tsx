import { useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { MODELS, SCORE_AS_OF, SCORE_INDEX, type Model } from '../data/models'
import { vendor } from '../data/vendors'
import {
  LEADER,
  SCORED,
  ancestorsOf,
  childrenOf,
  fmtContext,
  fmtDate,
  fmtPrice,
  rankOf,
  relativeDay,
} from '../lib/derive'
import { Arrow, StatusTag, Tag, VendorDot, WeightsTag } from './ui'

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-line/50 py-2 last:border-0">
      <span className="shrink-0 font-mono text-[9.5px] tracking-[0.06em] text-dim uppercase">{label}</span>
      <span className="text-right text-[11.5px] leading-snug text-mute">{children}</span>
    </div>
  )
}

function BenchRow({ label, value, color }: { label: string; value?: number; color: string }) {
  return (
    <div className="flex items-center gap-2.5">
      <span className="w-[62px] font-mono text-[9.5px] tracking-[0.05em] text-dim uppercase">{label}</span>
      <span className="h-[4px] flex-1 overflow-hidden rounded-full bg-white/8">
        <span
          className="block h-full rounded-full"
          style={{ width: `${value ? Math.min(100, value) : 0}%`, background: color, opacity: 0.85 }}
        />
      </span>
      <span className="num w-9 text-right text-[10.5px] text-fg">{value?.toFixed(1) ?? '—'}</span>
    </div>
  )
}

export function DetailDrawer({
  id,
  onClose,
  onSelect,
}: {
  id: string
  onClose: () => void
  onSelect: (id: string) => void
}) {
  const model = MODELS.find((m) => m.id === id)
  const closeRef = useRef<HTMLButtonElement | null>(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    closeRef.current?.focus()
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    setCopied(false)
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
    }
  }, [onClose, id])

  if (!model) return null

  const v = vendor(model.vendor)
  const rank = rankOf(model.id)
  const leaderScore = LEADER.aa as number
  const delta = model.aa !== null ? model.aa - leaderScore : null
  const parents = ancestorsOf(model.id).slice(0, -1)
  const kids = childrenOf(model.id)
  const note = model.note

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(model.name)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1600)
    } catch {
      setCopied(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end" role="dialog" aria-modal="true" aria-label={`${model.name} spec`}>
      <button
        aria-label="Close"
        onClick={onClose}
        className="fade-in absolute inset-0 cursor-default bg-ink/75 backdrop-blur-[2px]"
      />
      <aside className="drawer relative flex h-full w-full flex-col border-l border-line2 bg-panel shadow-[-30px_0_80px_-30px_rgba(0,0,0,0.8)] sm:max-w-[540px]">
        <div className="flex items-center justify-between border-b border-line px-4 py-3 sm:px-5">
          <span className="label flex items-center gap-2">
            <span style={{ color: v.color }}>●</span> model spec
          </span>
          <button
            ref={closeRef}
            onClick={onClose}
            aria-label="Close panel"
            className="grid size-7 place-items-center rounded-full border border-line text-mute transition-colors hover:border-line2 hover:text-fg"
          >
            <svg viewBox="0 0 14 14" className="size-3" fill="none" aria-hidden>
              <path d="m3 3 8 8M11 3l-8 8" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          <div className="px-4 pt-5 sm:px-5">
            <div className="flex flex-wrap items-center gap-1.5">
              <VendorDot id={model.vendor} size={6} />
              <span className="font-mono text-[9.5px] tracking-[0.08em] text-dim uppercase">
                {v.name}
              </span>
              <span className="text-line2">·</span>
              <span className="font-mono text-[9.5px] text-dim">{model.family}</span>
              <span className="ml-auto flex gap-1.5">
                <StatusTag status={model.status} />
                <WeightsTag weights={model.weights} />
              </span>
            </div>

            <h2 className="mt-2.5 text-[27px] leading-[1.05] font-semibold tracking-[-0.03em]">
              {model.name}
            </h2>
            <p className="mt-1.5 font-mono text-[10px] text-dim">
              released {fmtDate(model.released)} · {relativeDay(model.released)}
              {model.aaConfig ? ` · evaluated at ${model.aaConfig} effort` : ''}
            </p>

            {/* score */}
            <div className="mt-5 grid grid-cols-[1fr_auto] items-end gap-3 rounded-xl border border-line bg-white/[0.018] p-4">
              <div>
                <div className="label mb-2">intelligence index · 0–70</div>
                <div className="flex items-end gap-2">
                  <span className="num text-[40px] leading-[0.8] font-medium" style={{ color: v.color }}>
                    {model.aa?.toFixed(1) ?? '—'}
                  </span>
                  {delta !== null && (
                    <span className="mb-1 font-mono text-[10px] text-mute">
                      {delta === 0 ? 'the leader' : `${delta > 0 ? '+' : ''}${delta.toFixed(1)} vs #1`}
                    </span>
                  )}
                </div>
                <div className="mt-2.5 h-1 w-full overflow-hidden rounded-full bg-white/8">
                  <div
                    className="relative h-full"
                    style={{ width: `${((model.aa ?? 0) / 70) * 100}%`, background: v.color, opacity: 0.75 }}
                  />
                </div>
              </div>
              <div className="pb-1 text-right">
                <div className="label mb-1.5">rank</div>
                <div className="num text-[16px]">{rank ? `#${rank}` : '—'}</div>
                <div className="mt-1 font-mono text-[8.5px] text-dim">of {SCORED.length}</div>
              </div>
            </div>

            {/* benchmarks */}
            <div className="mt-5">
              <div className="label mb-2.5">capability breakdown · 0–100</div>
              <div className="space-y-2">
                <BenchRow label="coding" value={model.bench?.coding} color={v.color} />
                <BenchRow label="agentic" value={model.bench?.agentic} color={v.color} />
                <BenchRow label="knowledge" value={model.bench?.knowledge} color={v.color} />
              </div>
              <p className="mt-2 font-mono text-[9px] leading-relaxed text-dim">
                {model.bench
                  ? 'Sub-scores from BenchLM’s published top-10 boards; blanks were not on the board.'
                  : 'No independent sub-scores published for this model yet.'}
              </p>
            </div>

            {/* specs */}
            <div className="mt-5">
              <div className="label mb-1.5">specification</div>
              <div className="rounded-xl border border-line px-3.5 py-1">
                <Row label="context">{fmtContext(model.contextK)} tokens</Row>
                <Row label="input price">
                  {model.priceIn === null || model.priceIn === undefined
                    ? '—'
                    : `${fmtPrice(model.priceIn)} / 1M`}
                </Row>
                <Row label="output price">
                  {model.priceOut === null || model.priceOut === undefined
                    ? '—'
                    : `${fmtPrice(model.priceOut)} / 1M`}
                </Row>
                <Row label="weights">
                  {model.weights === 'open'
                    ? `downloadable${model.license ? ` · ${model.license}` : ''}`
                    : model.weights === 'gated'
                      ? `gated${model.license ? ` · ${model.license}` : ''}`
                      : 'proprietary'}
                </Row>
                {model.params && <Row label="parameters">{model.params}</Row>}
                <Row label="modalities">{model.modalities ?? 'text → text'}</Row>
              </div>
            </div>

            {/* manufacturer */}
            <div className="mt-5">
              <div className="label mb-2">made by</div>
              <div className="rounded-xl border border-line bg-white/[0.015] p-3.5">
                <div className="flex items-center gap-2">
                  <VendorDot id={model.vendor} size={6} />
                  <span className="text-[12.5px] font-medium">{v.name}</span>
                  <span className="ml-auto font-mono text-[9px] text-dim">{v.hq}</span>
                </div>
                <p className="mt-2 text-[11.5px] leading-[1.55] text-mute">{v.blurb}</p>
              </div>
            </div>

            {/* lineage */}
            <div className="mt-5">
              <div className="label mb-2">lineage</div>
              <div className="rounded-xl border border-line p-3.5">
                {parents.length ? (
                  <div className="flex flex-wrap items-center gap-1.5">
                    {parents.map((p, i) => (
                      <span key={p.id} className="flex items-center gap-1.5">
                        {i > 0 && <span className="text-[10px] text-line2">›</span>}
                        <button
                          onClick={() => onSelect(p.id)}
                          className="rounded-md border border-line px-2 py-1 font-mono text-[10px] text-mute transition-colors hover:border-line2 hover:text-fg"
                        >
                          {p.name}
                        </button>
                      </span>
                    ))}
                    <span className="text-[10px] text-line2">›</span>
                    <span className="rounded-md border border-accent/40 bg-accent/[0.06] px-2 py-1 font-mono text-[10px] text-accent">
                      {model.name}
                    </span>
                  </div>
                ) : (
                  <p className="font-mono text-[10px] text-dim">No predecessor in the tracked set — first of its line.</p>
                )}

                {kids.length > 0 && (
                  <div className="mt-3 border-t border-line/60 pt-2.5">
                    <span className="font-mono text-[9px] tracking-[0.06em] text-dim uppercase">
                      replaced by
                    </span>
                    <div className="mt-1.5 flex flex-wrap gap-1.5">
                      {kids.map((k) => (
                        <button
                          key={k.id}
                          onClick={() => onSelect(k.id)}
                          className="flex items-center gap-1 rounded-md border border-line px-2 py-1 font-mono text-[10px] text-mute hover:border-line2 hover:text-fg"
                        >
                          {k.name}
                          <Arrow className="size-2.5" />
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* note */}
            <div className="mt-5">
              <div className="label mb-2">what changed</div>
              <p className="text-[12.5px] leading-[1.6] text-mute">{note}</p>
            </div>

            <div className="mt-5 flex flex-wrap items-center gap-2 border-t border-line pt-4">
              <button
                onClick={copy}
                className="rounded-full border border-line px-3 py-1.5 font-mono text-[10px] tracking-[0.04em] text-mute uppercase transition-colors hover:border-line2 hover:text-fg"
              >
                {copied ? 'copied ✓' : 'copy name'}
              </button>
              {model.source && (
                <a
                  href={model.source}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1 rounded-full border border-line px-3 py-1.5 font-mono text-[10px] tracking-[0.04em] text-mute uppercase transition-colors hover:border-line2 hover:text-fg"
                >
                  vendor source ↗
                </a>
              )}
              <span className="ml-auto font-mono text-[8.5px] text-dim">
                {SCORE_INDEX} · {SCORE_AS_OF}
              </span>
            </div>

            <div className="h-5" />
          </div>
        </div>

        <div className="flex items-center justify-between border-t border-line px-4 py-2.5 sm:px-5">
          <span className="font-mono text-[9px] text-dim">esc to close</span>
          <div className="flex items-center gap-1.5">
            {kindTag(model)}
            <span className="font-mono text-[9px] text-dim">{model.id}</span>
          </div>
        </div>
      </aside>
    </div>
  )
}

function kindTag(m: Model) {
  if (m.weights === 'open') return <Tag tone="open">downloadable</Tag>
  if (m.status === 'Limited') return <Tag tone="limited">restricted</Tag>
  return <Tag tone="neutral">api only</Tag>
}
