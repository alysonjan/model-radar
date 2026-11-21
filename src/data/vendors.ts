export type VendorId =
  | 'anthropic'
  | 'openai'
  | 'google'
  | 'meta'
  | 'alibaba'
  | 'deepseek'
  | 'moonshot'
  | 'xai'
  | 'mistral'
  | 'zhipu'
  | 'tencent'
  | 'minimax'
  | 'nvidia'
  | 'cohere'
  | 'ibm'
  | 'thinkingmachines'
  | 'xiaomi'
  | 'inclusionai'
  | 'stepfun'
  | 'upstage'
  | 'nanbeige'
  | 'baidu'
  | 'longcat'
  | 'nous'
  | 'sarvam'
  | 'mbzuai'
  | 'ricursive'

export interface Vendor {
  id: VendorId
  name: string
  short: string
  color: string
  hq: string
  site: string
  blurb: string
}

export const VENDORS: Vendor[] = [
  {
    id: 'anthropic',
    name: 'Anthropic',
    short: 'Anthropic',
    color: '#E5896A',
    hq: 'San Francisco, US',
    site: 'https://www.anthropic.com',
    blurb:
      'Safety-first lab behind Claude. Four tiers — Fable at the top, then Opus, Sonnet and Haiku — plus Mythos, the same top-tier weights with fewer cyber and biology safeguards, sold to vetted organisations.',
  },
  {
    id: 'openai',
    name: 'OpenAI',
    short: 'OpenAI',
    color: '#38D39F',
    hq: 'San Francisco, US',
    site: 'https://openai.com',
    blurb:
      'Frontier lab behind GPT-6. Tiers are named Astra (largest), Sol (mid), Terra (fast visual), Luna (cheapest); the Cyber line ships to screened security teams first. gpt-oss is its open-weight arm.',
  },
  {
    id: 'google',
    name: 'Google DeepMind',
    short: 'Google',
    color: '#5B9DFF',
    hq: 'Mountain View, US / London, UK',
    site: 'https://deepmind.google',
    blurb:
      'Gemini family on Google’s own TPUs. Carbon is the flagship, Argon the previous flagship, Hydrogen the fast tier, Neon the mid-priced coder — all with ~1M-token context and native video/audio input.',
  },
  {
    id: 'meta',
    name: 'Meta Superintelligence Labs',
    short: 'Meta',
    color: '#8B7CFF',
    hq: 'Menlo Park, US',
    site: 'https://ai.meta.com',
    blurb:
      'Muse is Meta’s frontier line: Wonder (closed flagship), Ember (cheap agent tier), Spark (agentic coding, with an open-weight 816B variant) and Glimmer (30B, Apache 2.0).',
  },
  {
    id: 'alibaba',
    name: 'Alibaba · Qwen',
    short: 'Alibaba',
    color: '#C084FC',
    hq: 'Hangzhou, China',
    site: 'https://qwen.ai',
    blurb:
      'The Qwen family, served through Model Studio and QwenCloud. Max tiers stay proprietary (Qwen4-Max is a 2.4T-parameter MoE); the 27B and Flash tiers ship open weights, which is why so many fine-tunes start here.',
  },
  {
    id: 'deepseek',
    name: 'DeepSeek',
    short: 'DeepSeek',
    color: '#22D3EE',
    hq: 'Hangzhou, China',
    site: 'https://www.deepseek.com',
    blurb:
      'Open-weight lab that keeps resetting the price floor. V4 comes in Pro (quality) and Flash (cost) lines; checkpoints are re-post-trained in public and weights land on Hugging Face.',
  },
  {
    id: 'moonshot',
    name: 'Moonshot AI',
    short: 'Moonshot',
    color: '#E879F9',
    hq: 'Beijing, China',
    site: 'https://www.moonshot.ai',
    blurb:
      'Kimi models, built around very long context and agentic coding. K3 is a 2.8T-parameter MoE released under a modified MIT licence — the strongest downloadable model on the board.',
  },
  {
    id: 'xai',
    name: 'xAI',
    short: 'xAI',
    color: '#D4D4D8',
    hq: 'Palo Alto, US',
    site: 'https://x.ai',
    blurb:
      'Grok, trained on the Colossus cluster and shipped through the API, Cursor, Grok Build and partners such as OpenRouter and Vercel. Iterates in small, frequent point releases.',
  },
  {
    id: 'mistral',
    name: 'Mistral AI',
    short: 'Mistral',
    color: '#FF8A3D',
    hq: 'Paris, France',
    site: 'https://mistral.ai',
    blurb:
      'Europe’s frontier lab. Mixes proprietary flagships with genuinely open releases (Large 4 is open-weight under the Mistral Ecosystem licence) and specialised models for code, OCR and robotics.',
  },
  {
    id: 'zhipu',
    name: 'Z.ai · Zhipu',
    short: 'Z.ai',
    color: '#FB7185',
    hq: 'Beijing, China',
    site: 'https://z.ai',
    blurb:
      'GLM models under MIT licences, positioned for agentic engineering and coding plans. GLM-5.3 is the flagship; the Flash tier is natively multimodal at roughly a tenth of the price.',
  },
  {
    id: 'tencent',
    name: 'Tencent',
    short: 'Tencent',
    color: '#BEF264',
    hq: 'Shenzhen, China',
    site: 'https://hy.tencent.ai',
    blurb:
      'The Hunyuan / Hy line, served on Tencent Cloud TokenHub and inside WeChat-scale products. Hy4 added vision and computer use; Hy4 flash is the cost-optimised tier, with weights promised open.',
  },
  {
    id: 'minimax',
    name: 'MiniMax',
    short: 'MiniMax',
    color: '#FBBF24',
    hq: 'Shanghai, China',
    site: 'https://www.minimax.io',
    blurb:
      'Long-context models at aggressive prices, aimed at agent and consumer workloads. M3.1 Flash is the current cheap tier; weights are downloadable under a restricted licence.',
  },
  {
    id: 'nvidia',
    name: 'NVIDIA',
    short: 'NVIDIA',
    color: '#76B900',
    hq: 'Santa Clara, US',
    site: 'https://build.nvidia.com',
    blurb:
      'Nemotron models, designed to be deployed on your own GPUs with an open licence. Ultra is the largest, Super VL adds vision, Lightning is the throughput tier.',
  },
  {
    id: 'cohere',
    name: 'Cohere',
    short: 'Cohere',
    color: '#F0ABFC',
    hq: 'Toronto, Canada',
    site: 'https://cohere.com',
    blurb:
      'Enterprise-first lab: Command for RAG and tool use, North for private deployments. Weights are open for research; the commercial pitch is data residency and on-prem.',
  },
  {
    id: 'ibm',
    name: 'IBM',
    short: 'IBM',
    color: '#7DD3FC',
    hq: 'Armonk, US',
    site: 'https://www.ibm.com/granite',
    blurb:
      'Granite is a small-model family for enterprise RAG and governance, Apache 2.0 at 3B and 8B. Also the base for several community fine-tunes.',
  },
  {
    id: 'thinkingmachines',
    name: 'Thinking Machines Lab',
    short: 'TML',
    color: '#FCA5A5',
    hq: 'San Francisco, US',
    site: 'https://thinkingmachines.ai',
    blurb:
      'Mira Murati’s lab, shipping through its Tinker fine-tuning platform. Inkling is a sparse MoE with vision; the small variant went Apache 2.0 ten days after launch.',
  },
  {
    id: 'xiaomi',
    name: 'Xiaomi',
    short: 'Xiaomi',
    color: '#FFD166',
    hq: 'Beijing, China',
    site: 'https://mimo.xiaomi.com',
    blurb:
      'MiMo models for phone, car and home assistants. Open weights under a Xiaomi licence, tuned for on-device and edge deployment.',
  },
  {
    id: 'inclusionai',
    name: 'InclusionAI · Ant',
    short: 'InclusionAI',
    color: '#5EEAD4',
    hq: 'Hangzhou, China',
    site: 'https://www.inclusionai.com',
    blurb:
      'Ant Group’s research label. Ling models are open-weight, free on several gateways, and focused on efficient reasoning.',
  },
  {
    id: 'stepfun',
    name: 'StepFun',
    short: 'StepFun',
    color: '#C4B5FD',
    hq: 'Shanghai, China',
    site: 'https://www.stepfun.com',
    blurb:
      'Chinese model lab with a multimodal and reasoning focus; Step 5 is its current preview frontier model.',
  },
  {
    id: 'upstage',
    name: 'Upstage',
    short: 'Upstage',
    color: '#A3A3A3',
    hq: 'Seoul, South Korea',
    site: 'https://www.upstage.ai',
    blurb:
      'Korean enterprise lab. Solar Pro 4 targets document AI and bilingual Korean/English workloads.',
  },
  {
    id: 'nanbeige',
    name: 'Nanbeige Lab',
    short: 'Nanbeige',
    color: '#A3A3A3',
    hq: 'Beijing, China',
    site: 'https://huggingface.co/nanbeige',
    blurb:
      'Research group publishing small, strong open models; the 33B scores well above its weight class.',
  },
  {
    id: 'baidu',
    name: 'Baidu',
    short: 'Baidu',
    color: '#A3A3A3',
    hq: 'Beijing, China',
    site: 'https://ernie.baidu.com',
    blurb:
      'ERNIE models, distributed through Baidu’s cloud and free preview tiers. A 1M-context flash model is the current entry point.',
  },
  {
    id: 'longcat',
    name: 'LongCat · Meituan',
    short: 'LongCat',
    color: '#A3A3A3',
    hq: 'Beijing, China',
    site: 'https://longcat.chat',
    blurb:
      'Meituan’s model team. LongCat-2.5 is a 1.6T multimodal agent model, open-sourced under MIT a week after its API launch.',
  },
  {
    id: 'nous',
    name: 'Nous Research',
    short: 'Nous',
    color: '#A3A3A3',
    hq: 'US (distributed)',
    site: 'https://nousresearch.com',
    blurb:
      'Open-research collective. Publishes fine-tunes and tools (Hermes, Atropos) on Apache 2.0, usually on top of a strong open base model.',
  },
  {
    id: 'sarvam',
    name: 'Sarvam AI',
    short: 'Sarvam',
    color: '#A3A3A3',
    hq: 'Bengaluru, India',
    site: 'https://www.sarvam.ai',
    blurb:
      'Indian lab focused on Indic languages and decision-style models that return calibrated probabilities instead of prose.',
  },
  {
    id: 'mbzuai',
    name: 'IFM · MBZUAI',
    short: 'MBZUAI',
    color: '#A3A3A3',
    hq: 'Abu Dhabi, UAE',
    site: 'https://ifm.ai',
    blurb:
      'Institute of Foundation Models at MBZUAI. PAN 2 is an open world model that simulates action outcomes as short video.',
  },
  {
    id: 'ricursive',
    name: 'Ricursive Intelligence',
    short: 'Ricursive',
    color: '#A3A3A3',
    hq: 'US',
    site: 'https://www.ricursive.com',
    blurb:
      'New lab whose first release is a from-scratch 65B dense model tuned for agentic coding, Apache 2.0.',
  },
]

export const VENDOR_MAP: Record<string, Vendor> = Object.fromEntries(
  VENDORS.map((v) => [v.id, v]),
)

export function vendor(id: string): Vendor {
  return VENDOR_MAP[id] ?? VENDORS[0]
}
