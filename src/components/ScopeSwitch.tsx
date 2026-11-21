import { CLOSED_COUNT, OPEN_COUNT, SCOPE_META, type Scope } from '../lib/scope'

const ITEMS: { id: Scope; count: number }[] = [
  { id: 'all', count: OPEN_COUNT + CLOSED_COUNT },
  { id: 'open', count: OPEN_COUNT },
  { id: 'closed', count: CLOSED_COUNT },
]

export function ScopeSwitch({
  scope,
  onChange,
  size = 'md',
  counts = true,
}: {
  scope: Scope
  onChange: (s: Scope) => void
  size?: 'sm' | 'md'
  counts?: boolean
}) {
  return (
    <div
      role="tablist"
      aria-label="Filter by access"
      className="inline-flex shrink-0 items-center gap-0.5 rounded-full border border-line bg-white/[0.02] p-0.5"
    >
      {ITEMS.map((item) => {
        const on = scope === item.id
        const meta = SCOPE_META[item.id]
        return (
          <button
            key={item.id}
            role="tab"
            aria-selected={on}
            onClick={() => onChange(item.id)}
            title={
              item.id === 'open'
                ? 'Downloadable weights — open licence or gated'
                : item.id === 'closed'
                  ? 'Proprietary · API only, no public weights'
                  : 'Every tracked model'
            }
            className={`flex items-center gap-1 rounded-full font-mono tabular-nums transition-colors ${
              size === 'sm' ? 'px-2 py-[3px] text-[9px]' : 'px-2.5 py-[5px] text-[9.5px]'
            } ${on ? '' : 'text-dim hover:text-mute'}`}
            style={
              on
                ? {
                    background: item.id === 'open' ? 'rgb(var(--accent-rgb) / 0.14)' : 'rgba(255,255,255,0.1)',
                    color: item.id === 'open' ? 'var(--color-accent)' : '#e9ecf1',
                    boxShadow: `inset 0 0 0 1px ${item.id === 'open' ? 'rgb(var(--accent-rgb) / 0.3)' : 'rgba(255,255,255,0.1)'}`,
                  }
                : undefined
            }
          >
            <span
              className="size-1.5 rounded-full"
              style={{ background: item.id === 'all' ? '#8b93a1' : meta.color }}
            />
            {meta.short}
            {counts && <span className="opacity-60">{item.count}</span>}
          </button>
        )
      })}
    </div>
  )
}
