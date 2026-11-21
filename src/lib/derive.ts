import { MODELS, SNAPSHOT_DATE, type Model } from '../data/models'

const DAY = 86_400_000

export function dateObj(iso: string): Date {
  return new Date(`${iso}T00:00:00Z`)
}

export function daysSince(iso: string, ref = SNAPSHOT_DATE): number {
  return Math.round((dateObj(ref).getTime() - dateObj(iso).getTime()) / DAY)
}

export function fmtDate(iso: string): string {
  return dateObj(iso).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  })
}

export function fmtShortDate(iso: string): string {
  return dateObj(iso).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    timeZone: 'UTC',
  })
}

export function fmtPrice(n: number | null | undefined): string {
  if (n === null || n === undefined) return '—'
  if (n === 0) return 'free'
  if (n < 0.1) return `$${n.toFixed(3)}`
  if (n < 1) return `$${n.toFixed(2)}`
  if (Number.isInteger(n)) return `$${n}`
  return `$${n.toFixed(2)}`
}

export function fmtContext(k: number | null | undefined): string {
  if (!k) return '—'
  if (k >= 1000) {
    const v = k / 1000
    return `${v % 1 === 0 ? v.toFixed(0) : v.toFixed(2).replace(/0$/, '')}M`
  }
  return `${k}K`
}

export function fmtScore(n: number | null | undefined): string {
  return n === null || n === undefined ? '—' : n.toFixed(1)
}

export function relativeDay(iso: string): string {
  const d = daysSince(iso)
  if (d <= 0) return 'today'
  if (d === 1) return 'yesterday'
  if (d < 7) return `${d} days ago`
  if (d < 14) return 'last week'
  if (d < 60) return `${Math.round(d / 7)} weeks ago`
  return `${Math.round(d / 30)} months ago`
}

export function isNew(iso: string, within = 7): boolean {
  return daysSince(iso) <= within
}

export const SCORED = MODELS.filter((m) => m.aa !== null).sort(
  (a, b) => (b.aa as number) - (a.aa as number),
)

export const BY_DATE = [...MODELS].sort((a, b) => b.released.localeCompare(a.released))

export const LEADER = SCORED[0]
export const NEWEST = BY_DATE[0]

export const OPEN_LEADER = SCORED.filter((m) => m.weights === 'open')[0]

export const REPO_DAYS = 30
export const RECENT_RELEASES = BY_DATE.filter((m) => daysSince(m.released) <= REPO_DAYS)
export const LAST_7 = BY_DATE.filter((m) => daysSince(m.released) <= 7)

export const VENDOR_COUNT = new Set(MODELS.map((m) => m.vendor)).size

export function rankOf(id: string): number | null {
  const i = SCORED.findIndex((m) => m.id === id)
  return i === -1 ? null : i + 1
}

/** Score with the leader’s score subtracted. */
export function deltaToLeader(m: Model): number | null {
  if (m.aa === null) return null
  return m.aa - (LEADER.aa as number)
}

/** ancestor chain, oldest first, ending with the model itself */
export function ancestorsOf(id: string): Model[] {
  const chain: Model[] = []
  const seen = new Set<string>()
  let cur = MODELS.find((m) => m.id === id)
  while (cur && !seen.has(cur.id)) {
    chain.unshift(cur)
    seen.add(cur.id)
    cur = cur.parent ? MODELS.find((m) => m.id === cur!.parent) : undefined
  }
  return chain
}

export function childrenOf(id: string): Model[] {
  return MODELS.filter((m) => m.parent === id).sort((a, b) =>
    a.released.localeCompare(b.released),
  )
}

export function descendantsOf(id: string): Model[] {
  const out: Model[] = []
  const walk = (mid: string) => {
    for (const c of childrenOf(mid)) {
      out.push(c)
      walk(c.id)
    }
  }
  walk(id)
  return out
}

export interface Family {
  name: string
  vendor: Model['vendor']
  models: Model[]
}

export const FAMILIES: Family[] = (() => {
  const map = new Map<string, Model[]>()
  for (const m of MODELS) {
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
    .filter((f) => f.models.length > 1)
    .sort((a, b) => {
      const am = Math.max(...a.models.map((m) => m.aa ?? 0))
      const bm = Math.max(...b.models.map((m) => m.aa ?? 0))
      return bm - am
    })
})()

/** Best score available at each date — the frontier envelope. */
export function frontierSeries(models: Model[]): { t: number; v: number }[] {
  const scored = models
    .filter((m) => m.aa !== null)
    .sort((a, b) => a.released.localeCompare(b.released))
  let best = 0
  return scored.map((m) => {
    best = Math.max(best, m.aa as number)
    return { t: dateObj(m.released).getTime(), v: best }
  })
}

export function pctFromTop(score: number): number {
  return Math.max(0, Math.min(100, (score / 70) * 100))
}

export function valueRatio(m: Model): number | null {
  if (m.aa === null || !m.priceOut) return null
  return m.aa / m.priceOut
}

export function median(nums: number[]): number {
  if (!nums.length) return 0
  const s = [...nums].sort((a, b) => a - b)
  const mid = Math.floor(s.length / 2)
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2
}
