import type { CSSProperties, ReactNode } from 'react'
import type { Model } from '../data/models'
import { vendor } from '../data/vendors'

export function VendorDot({ id, size = 7 }: { id: string; size?: number }) {
  const v = vendor(id)
  return (
    <span
      aria-hidden
      className="inline-block shrink-0 rounded-full"
      style={{ width: size, height: size, background: v.color, boxShadow: `0 0 10px ${v.color}55` }}
    />
  )
}

const TONES: Record<string, { fg: string; bg: string; bd: string }> = {
  open: { fg: 'var(--color-accent)', bg: 'rgb(var(--accent-rgb) / 0.14)', bd: 'rgb(var(--accent-rgb) / 0.38)' },
  closed: { fg: '#9aa3b2', bg: 'rgba(255,255,255,0.04)', bd: 'rgba(255,255,255,0.1)' },
  gated: { fg: '#fbbf24', bg: 'rgba(251,191,36,0.09)', bd: 'rgba(251,191,36,0.26)' },
  new: { fg: '#060708', bg: 'var(--color-accent)', bd: 'var(--color-accent)' },
  preview: { fg: '#c4b5fd', bg: 'rgba(196,181,253,0.09)', bd: 'rgba(196,181,253,0.26)' },
  limited: { fg: '#fb7185', bg: 'rgba(251,113,133,0.08)', bd: 'rgba(251,113,133,0.26)' },
  neutral: { fg: '#9aa3b2', bg: 'rgba(255,255,255,0.035)', bd: 'rgba(255,255,255,0.09)' },
}

export function Tag({
  children,
  tone = 'neutral',
  className = '',
}: {
  children: ReactNode
  tone?: keyof typeof TONES | string
  className?: string
}) {
  const t = TONES[tone] ?? TONES.neutral
  return (
    <span
      className={`inline-flex items-center rounded-full border px-1.5 py-[2px] font-mono text-[9px] leading-[1.4] tracking-[0.08em] uppercase ${className}`}
      style={{ color: t.fg, background: t.bg, borderColor: t.bd }}
    >
      {children}
    </span>
  )
}

export function WeightsTag({ weights }: { weights: Model['weights'] }) {
  if (weights === 'open') return <Tag tone="open">open</Tag>
  if (weights === 'gated') return <Tag tone="gated">gated</Tag>
  return <Tag tone="closed">closed</Tag>
}

export function StatusTag({ status }: { status: Model['status'] }) {
  if (status === 'GA') return null
  return <Tag tone={status === 'Preview' ? 'preview' : 'limited'}>{status}</Tag>
}

export function ScoreBar({
  value,
  color = 'var(--color-accent)',
  width = 100,
  height = 3,
  max = 70,
}: {
  value: number
  color?: string
  width?: number | string
  height?: number
  max?: number
}) {
  const pct = Math.max(2, Math.min(100, (value / max) * 100))
  return (
    <span
      className="inline-block overflow-hidden rounded-full bg-white/8 align-middle"
      style={{ width, height }}
    >
      <span
        className="block h-full rounded-full"
        style={{ width: `${pct}%`, background: color, opacity: 0.85 }}
      />
    </span>
  )
}

export function SectionHead({
  index,
  kicker,
  title,
  sub,
  right,
}: {
  index: string
  kicker: string
  title: ReactNode
  sub?: ReactNode
  right?: ReactNode
}) {
  return (
    <div className="mb-5 flex flex-wrap items-end justify-between gap-x-8 gap-y-4">
      <div className="min-w-0">
        <div className="label mb-2.5 flex items-center gap-2">
          <span className="text-accent/80">{index}</span>
          <span className="h-px w-5 bg-line2" />
          <span>{kicker}</span>
        </div>
        <h2 className="text-[23px] leading-[1.1] font-semibold tracking-[-0.025em] sm:text-[27px]">
          {title}
        </h2>
        {sub ? (
          <p className="mt-1.5 max-w-[640px] text-[13px] leading-[1.55] text-mute">{sub}</p>
        ) : null}
      </div>
      {right ? <div className="shrink-0">{right}</div> : null}
    </div>
  )
}

export function KeyStat({
  label,
  value,
  hint,
  accent,
  style,
}: {
  label: string
  value: ReactNode
  hint?: ReactNode
  accent?: string
  style?: CSSProperties
}) {
  return (
    <div className="panel-flat relative overflow-hidden p-3.5" style={style}>
      <div className="label mb-2">{label}</div>
      <div className="num text-[22px] leading-none font-medium" style={{ color: accent }}>
        {value}
      </div>
      {hint ? <div className="mt-1.5 text-[11.5px] leading-tight text-dim">{hint}</div> : null}
    </div>
  )
}

export function Arrow({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 16" fill="none" className={className} aria-hidden>
      <path d="M3 8h9m0 0L8.5 4.5M12 8l-3.5 3.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
