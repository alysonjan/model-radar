#!/usr/bin/env node
/**
 * whats-new — diff OpenRouter's free, keyless catalogue against the curated
 * snapshot in src/data/models.ts, and print what is missing.
 *
 *   npm run whats-new
 *   npm run whats-new -- --days=45 --limit=30
 *   npm run whats-new -- --draft          # ready-to-paste TS skeletons
 *
 * No API key, no scraping: same public endpoint the live wire calls.
 */
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import process from 'node:process'

const ROOT = path.resolve(new URL('..', import.meta.url).pathname)
const MODELS_PATH = path.join(ROOT, 'src/data/models.ts')
const ENDPOINT = 'https://openrouter.ai/api/v1/models'

const args = process.argv.slice(2)
const has = (n) => args.includes(`--${n}`)
const opt = (n) => {
  const hit = args.find((a) => a.startsWith(`--${n}=`))
  return hit ? hit.slice(n.length + 3) : undefined
}

const DAYS = Number(opt('days') ?? 21)
const LIMIT = Number(opt('limit') ?? 20)
const DRAFT = has('draft')

const norm = (s) => String(s).toLowerCase().replace(/[^a-z0-9]+/g, '')

const VENDOR_GUESS = {
  openai: 'openai',
  anthropic: 'anthropic',
  google: 'google',
  meta: 'meta',
  'meta-llama': 'meta',
  qwen: 'alibaba',
  alibaba: 'alibaba',
  deepseek: 'deepseek',
  moonshotai: 'moonshot',
  'x-ai': 'xai',
  mistralai: 'mistral',
  'z-ai': 'zhipu',
  tencent: 'tencent',
  minimax: 'minimax',
  nvidia: 'nvidia',
  cohere: 'cohere',
  'ibm-granite': 'ibm',
  thinkingmachines: 'thinkingmachines',
  xiaomi: 'xiaomi',
  inclusionai: 'inclusionai',
  stepfun: 'stepfun',
  upstage: 'upstage',
  baidu: 'baidu',
  'meituan-longcat': 'longcat',
  nousresearch: 'nous',
  sarvam: 'sarvam',
  'mbzuai-ifm': 'mbzuai',
  ricursive: 'ricursive',
}

const parseExisting = async () => {
  const src = await readFile(MODELS_PATH, 'utf8')
  const names = new Set()
  for (const m of src.matchAll(/^\s{4}name: '([^']+)'/gm)) names.add(norm(m[1]))
  for (const m of src.matchAll(/^\s{4}id: '([^']+)'/gm)) names.add(norm(m[1]))
  return names
}

const money = (perToken) => {
  const n = Number(perToken) * 1e6
  if (!Number.isFinite(n)) return '—'
  if (n === 0) return 'free'
  if (n < 0.1) return `$${n.toFixed(3)}`
  if (n < 1) return `$${n.toFixed(2)}`
  return `$${n % 1 === 0 ? n.toFixed(0) : n.toFixed(2)}`
}

const slugify = (s) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')

const main = async () => {
  const [existing, res] = await Promise.all([
    parseExisting(),
    fetch(ENDPOINT, { headers: { accept: 'application/json' } }),
  ])
  if (!res.ok) {
    console.error(`OpenRouter answered ${res.status}`)
    process.exit(1)
  }
  const json = await res.json()
  const cutoff = Date.now() - DAYS * 86_400_000

  const fresh = []
  for (const m of json.data ?? []) {
    const id = String(m.id ?? '')
    if (!id || id.includes(':')) continue
    const outputs = m.architecture?.output_modalities ?? []
    if (!outputs.includes('text')) continue
    if (!m.created || m.created * 1000 < cutoff) continue
    // OpenRouter's auto-routers are endpoints, not models, and carry a sentinel price
    if (id.startsWith('openrouter/')) continue
    if (Number(m.pricing?.prompt) < 0) continue
    const name = String(m.name ?? id).replace(/^[^:]+:\s*/, '')
    if (existing.has(norm(name)) || existing.has(norm(id))) continue
    fresh.push({
      id,
      name,
      created: m.created * 1000,
      context: m.context_length ?? null,
      priceIn: m.pricing?.prompt,
      priceOut: m.pricing?.completion,
      open: Boolean(m.hugging_face_id),
      vendor: VENDOR_GUESS[id.split('/')[0]] ?? 'other',
    })
  }
  fresh.sort((a, b) => b.created - a.created)

  console.log(
    `\nOpenRouter catalogue · ${json.data?.length ?? 0} listings · last ${DAYS} days · ${fresh.length} not in models.ts\n`,
  )

  if (!fresh.length) {
    console.log('Nothing missing in that window — the snapshot already covers every recent text model.\n')
    return
  }

  const shown = fresh.slice(0, LIMIT)
  console.log('  added     model                        ctx     $in / $out     id')
  for (const m of shown) {
    const date = new Date(m.created).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      timeZone: 'UTC',
    })
    const ctx = m.context ? `${Math.round(m.context / 1024)}K` : '—'
    console.log(
      `  ${date.padEnd(9)} ${m.name.padEnd(28).slice(0, 28)} ${ctx.padStart(4)}   ` +
        `${money(m.priceIn)} / ${money(m.priceOut)}`.padEnd(16) +
        ` ${m.id}${m.open ? '  [open]' : ''}`,
    )
  }
  if (fresh.length > shown.length) {
    console.log(`  … ${fresh.length - shown.length} more — raise --limit or narrow --days`)
  }

  if (DRAFT) {
    console.log('\n// paste into src/data/models.ts, then fill family, parent and note\n')
    for (const m of shown) {
      const release = new Date(m.created).toISOString().slice(0, 10)
      const priceIn = (Number(m.priceIn) * 1e6).toFixed(2).replace(/\.?0+$/, '') || '0'
      const priceOut = (Number(m.priceOut) * 1e6).toFixed(2).replace(/\.?0+$/, '') || '0'
      console.log(`  {
    id: '${slugify(m.name)}',
    name: '${m.name.replace(/'/g, "\\'")}',
    vendor: '${m.vendor}',
    family: 'TODO',
    // parent: '<previous model id>',
    released: '${release}',
    status: 'GA',
    aa: null,
    contextK: ${m.context ? Math.round(m.context / 1000) : 'null'},
    priceIn: ${priceIn},
    priceOut: ${priceOut},
    weights: '${m.open ? 'open' : 'closed'}',
    note: 'TODO — what changed versus its predecessor.',
    source: 'https://openrouter.ai/${m.id}',
  },`)
    }
    console.log()
  } else {
    console.log('\nAdd the ones worth tracking to src/data/models.ts, then: npm run build')
    console.log('Use --draft to print skeletons you can paste.\n')
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
