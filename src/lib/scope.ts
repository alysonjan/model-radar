import { MODELS, type Model } from '../data/models'
import { daysSince } from './derive'

/** 'open' means downloadable weights — open licence or gated. Licences vary,
 *  so the UI says "open weights", never "open source". */
export type Scope = 'all' | 'open' | 'closed'

export const SCOPE_META: Record<Scope, { label: string; short: string; color: string }> = {
  all: { label: 'All models', short: 'All', color: '#e9ecf1' },
  open: { label: 'Open weights', short: 'Open', color: 'var(--color-accent)' },
  closed: { label: 'Proprietary', short: 'Closed', color: '#cbd5e1' },
}

export function inScope(m: Model, scope: Scope): boolean {
  if (scope === 'all') return true
  if (scope === 'open') return m.weights !== 'closed'
  return m.weights === 'closed'
}

export function isOpen(m: Model): boolean {
  return m.weights !== 'closed'
}

export const OPEN_MODELS = MODELS.filter(isOpen)
export const CLOSED_MODELS = MODELS.filter((m) => m.weights === 'closed')

export const OPEN_COUNT = OPEN_MODELS.length
export const CLOSED_COUNT = CLOSED_MODELS.length

const scoreDesc = (a: Model, b: Model) => (b.aa as number) - (a.aa as number)

export function scopeStats(scope: Scope) {
  const models = MODELS.filter((m) => inScope(m, scope))
  const scored = models.filter((m) => m.aa !== null).sort(scoreDesc)
  const byDate = [...models].sort((a, b) => b.released.localeCompare(a.released))
  const openScored = [...OPEN_MODELS].filter((m) => m.aa !== null).sort(scoreDesc)
  const closedScored = [...CLOSED_MODELS].filter((m) => m.aa !== null).sort(scoreDesc)

  return {
    scope,
    models,
    scored,
    byDate,
    leader: scored[0] ?? MODELS.filter((m) => m.aa !== null).sort(scoreDesc)[0],
    runnerUp: scored[1],
    newest: byDate[0] ?? MODELS[0],
    openLeader: openScored[0],
    closedLeader: closedScored[0],
    recent: models.filter((m) => daysSince(m.released) <= 30),
    last7: models.filter((m) => daysSince(m.released) <= 7),
    openShare: models.length ? models.filter(isOpen).length / models.length : 0,
  }
}

/** The other side of the fence, for the compare row in the hero. */
export function oppositeLeader(scope: Scope): Model {
  if (scope === 'open') return scopeStats('closed').leader
  return scopeStats('open').leader
}

export function gapToClosed(): number {
  const c = scopeStats('closed').leader.aa ?? 0
  const o = scopeStats('open').leader.aa ?? 0
  return Number((c - o).toFixed(1))
}
