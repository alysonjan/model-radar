import { useCallback, useEffect, useMemo, useState } from 'react'
import { Header } from './components/Header'
import { Hero } from './components/Hero'
import { FrontierPanel, type View } from './components/FrontierPanel'
import { LatestDrops } from './components/LatestDrops'
import { LineagePanel } from './components/LineagePanel'
import { LabGrid } from './components/LabGrid'
import { ModelsTable } from './components/ModelsTable'
import { LiveWire } from './components/LiveWire'
import { DetailDrawer } from './components/DetailDrawer'
import { Footer } from './components/Footer'
import { LEADER } from './lib/derive'
import { DEFAULT_POLL_MS, useLiveModels } from './hooks/useLiveModels'
import type { Scope } from './lib/scope'

function initialScope(): Scope {
  const s = new URLSearchParams(window.location.search).get('scope')
  return s === 'open' || s === 'closed' ? s : 'all'
}

function initialView(): View {
  const v = new URLSearchParams(window.location.search).get('view')
  return v === 'split' || v === 'price' || v === 'mix' ? (v === 'price' ? 'value' : v === 'mix' ? 'matrix' : v) : 'frontier'
}

export default function App() {
  const [selectedId, setSelectedId] = useState<string>(LEADER.id)
  const [openId, setOpenId] = useState<string | null>(null)
  const [scope, setScope] = useState<Scope>(initialScope)
  const [view, setView] = useState<View>(initialView)

  // ?live=<seconds> stretches or shortens the catalogue poll (used by the tests)
  const pollMs = useMemo(() => {
    const raw = new URLSearchParams(window.location.search).get('live')
    const n = raw ? Number(raw) : NaN
    return Number.isFinite(n) ? Math.max(10, Math.min(3600, Math.round(n))) * 1000 : DEFAULT_POLL_MS
  }, [])
  const live = useLiveModels(pollMs)

  // scope and chart view are shareable: ?scope=open&view=split
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (scope === 'all') params.delete('scope')
    else params.set('scope', scope)
    if (view === 'frontier') params.delete('view')
    else params.set('view', view === 'value' ? 'price' : view === 'matrix' ? 'mix' : view)
    const q = params.toString()
    window.history.replaceState(null, '', q ? `?${q}` : window.location.pathname)
  }, [scope, view])

  const open = useCallback((id: string) => {
    setSelectedId(id)
    setOpenId(id)
  }, [])

  const close = useCallback(() => setOpenId(null), [])

  const openSplit = useCallback(() => {
    setView('split')
    document.getElementById('frontier')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [])

  return (
    <div className="min-h-screen">
      <Header scope={scope} onScope={setScope} live={live} />
      <main>
        <Hero onOpen={open} scope={scope} onScope={setScope} onOpenSplit={openSplit} />
        <FrontierPanel
          selectedId={selectedId}
          onSelect={open}
          scope={scope}
          view={view}
          onView={setView}
        />
        <LatestDrops onOpen={open} scope={scope} />
        <LineagePanel selectedId={selectedId} onOpen={open} scope={scope} />
        <LabGrid onOpen={open} scope={scope} />
        <ModelsTable selectedId={selectedId} onOpen={open} scope={scope} onScope={setScope} />
        <LiveWire feed={live} scope={scope} />
      </main>
      <Footer />
      {openId && <DetailDrawer id={openId} onClose={close} onSelect={open} />}
    </div>
  )
}
