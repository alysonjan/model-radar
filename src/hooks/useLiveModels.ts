import { useCallback, useEffect, useRef, useState } from 'react'
import { SNAPSHOT_DATE } from '../data/models'

export interface LiveModel {
  id: string
  name: string
  vendorName: string
  created: number
  context: number | null
  priceIn: number | null
  priceOut: number | null
  open: boolean
  inputs: string[]
  outputs: string[]
}

interface Cache {
  at: number
  total: number
  items: LiveModel[]
}

const ENDPOINT = 'https://openrouter.ai/api/v1/models'
const CACHE_KEY = 'mr.live.v1'
const SNAPSHOT_END = Date.parse(`${SNAPSHOT_DATE}T23:59:59Z`)

/** OpenRouter has no ETag and serves a ~930 KB catalogue behind a 120 s CDN cache,
 *  so a poll is a full download. Ten minutes keeps a left-open tab cheap while
 *  still catching a same-day listing on its own. */
export const DEFAULT_POLL_MS = 10 * 60 * 1000

type State = 'loading' | 'live' | 'cached' | 'error'

function readCache(): Cache | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as Cache
    if (!Array.isArray(parsed.items) || !parsed.at) return null
    return parsed
  } catch {
    return null
  }
}

function toNumber(v: unknown): number | null {
  const n = typeof v === 'string' ? Number.parseFloat(v) : typeof v === 'number' ? v : NaN
  return Number.isFinite(n) ? n : null
}

function parse(raw: unknown): { items: LiveModel[]; total: number } {
  const list = Array.isArray((raw as { data?: unknown[] })?.data)
    ? ((raw as { data: unknown[] }).data as Record<string, unknown>[])
    : []

  const items: LiveModel[] = []
  for (const m of list) {
    const id = String(m.id ?? '')
    if (!id || id.includes(':')) continue
    const arch = (m.architecture ?? {}) as Record<string, unknown>
    const outputs = Array.isArray(arch.output_modalities) ? (arch.output_modalities as string[]) : []
    if (!outputs.includes('text')) continue
    const pricing = (m.pricing ?? {}) as Record<string, string>
    const name = String(m.name ?? id)
    const nameParts = name.split(': ')
    const vendorName = nameParts.length > 1 ? nameParts[0] : id.split('/')[0]
    const displayName = nameParts.length > 1 ? nameParts.slice(1).join(': ') : name
    items.push({
      id,
      name: displayName,
      vendorName,
      created: Number(m.created ?? 0) * 1000,
      context: toNumber(m.context_length),
      priceIn: toNumber(pricing.prompt) === null ? null : (toNumber(pricing.prompt) as number) * 1e6,
      priceOut:
        toNumber(pricing.completion) === null ? null : (toNumber(pricing.completion) as number) * 1e6,
      open: Boolean(m.hugging_face_id),
      inputs: Array.isArray(arch.input_modalities) ? (arch.input_modalities as string[]) : [],
      outputs,
    })
  }

  items.sort((a, b) => b.created - a.created)
  return { items: items.slice(0, 80), total: items.length }
}

export function useLiveModels(intervalMs: number = DEFAULT_POLL_MS) {
  const [items, setItems] = useState<LiveModel[]>([])
  const [total, setTotal] = useState(0)
  const [at, setAt] = useState<number | null>(null)
  const [state, setState] = useState<State>('loading')
  const [error, setError] = useState<string | null>(null)
  const [paused, setPaused] = useState(false)
  const abortRef = useRef<AbortController | null>(null)
  const lastAttempt = useRef(0)
  const firstLoad = useRef<number | null>(null)
  const hasData = useRef(false)

  const load = useCallback(async (manual = false) => {
    // no visibility guard here: the interval and the visibility handler already
    // skip when hidden, and the first load must still run in a background tab
    // (otherwise the panel sits at "syncing" until the user focuses it)
    abortRef.current?.abort()
    const ctrl = new AbortController()
    abortRef.current = ctrl
    lastAttempt.current = Date.now()
    if (manual) setState('loading')
    setError(null)

    try {
      const res = await fetch(ENDPOINT, { signal: ctrl.signal, headers: { Accept: 'application/json' } })
      if (!res.ok) throw new Error(`catalogue answered ${res.status}`)
      const json: unknown = await res.json()
      const parsed = parse(json)
      if (!parsed.items.length) throw new Error('catalogue returned no text models')
      setItems(parsed.items)
      setTotal(parsed.total)
      setAt(Date.now())
      setState('live')
      hasData.current = true
      if (firstLoad.current === null) firstLoad.current = Date.now()
      try {
        localStorage.setItem(CACHE_KEY, JSON.stringify({ at: Date.now(), ...parsed } satisfies Cache))
      } catch {
        /* storage full or blocked — the live data still renders */
      }
    } catch (err) {
      if (ctrl.signal.aborted) return
      setError(err instanceof Error ? err.message : 'request failed')
      // a failed background poll keeps the numbers on screen
      if (hasData.current) return
      const cache = readCache()
      if (cache) {
        setItems(cache.items)
        setTotal(cache.total)
        setAt(cache.at)
        setState('cached')
      } else {
        setState('error')
      }
    }
  }, [])

  useEffect(() => {
    void load()
    return () => abortRef.current?.abort()
  }, [load])

  // poll while the tab is visible; catch up immediately when it comes back
  useEffect(() => {
    if (paused) return
    const id = window.setInterval(() => {
      if (document.visibilityState === 'visible') void load()
    }, intervalMs)
    const onVisible = () => {
      if (document.visibilityState === 'visible' && Date.now() - lastAttempt.current > intervalMs) {
        void load()
      }
    }
    document.addEventListener('visibilitychange', onVisible)
    return () => {
      window.clearInterval(id)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [paused, intervalMs, load])

  const togglePaused = useCallback(() => {
    if (paused) {
      void load() // resume with a fresh poll so the countdown restarts immediately
      setPaused(false)
    } else {
      setPaused(true)
    }
  }, [paused, load])

  const newSinceSnapshot = items.filter((m) => m.created > SNAPSHOT_END).length
  const newSinceOpen = firstLoad.current
    ? items.filter((m) => m.created > (firstLoad.current as number)).length
    : 0

  return {
    items,
    total,
    at,
    state,
    error,
    paused,
    togglePaused,
    intervalMs,
    newSinceSnapshot,
    newSinceOpen,
    refresh: () => void load(true),
  }
}

export type LiveFeed = ReturnType<typeof useLiveModels>
