export const PERSON = {
  name: 'Yash Vaibhav Awasthi',
  role: 'Software engineer',
  intro: 'I build backends, AI systems and mobile apps that keep working when things fail. B.Tech CSE at NIT Raipur.',
  email: 'yashvaibhav.job@gmail.com',
  resume: '/Yash-Vaibhav-Awasthi-Resume.pdf',
};

export const SOCIAL = [
  { label: 'GitHub', href: 'https://github.com/Yash-Awasthi' },
  { label: 'LinkedIn', href: 'https://www.linkedin.com/in/yash-vaibhav-awasthi-909a62293' },
  { label: 'Discord', href: 'https://discord.com/users/yashawasthi_' },
  { label: 'Telegram', href: 'https://t.me/Y1203A' },
];

// `shape` picks the object in three/Artifacts.jsx; `color` is its accent, `tint` the page wash behind it.
// Each stack leads with what the project experiments with.
export const PROJECTS = [
  {
    slug: 'nexus',
    name: 'Nexus',
    line: 'Multi-agent LLM orchestration platform',
    year: '2026',
    stack: ['gVisor / Kata', 'pgvector + BM25', 'MCP', 'TypeScript', 'Fastify', 'React', 'PostgreSQL', 'Redis', 'BullMQ', 'Docker'],
    github: 'https://github.com/Yash-Awasthi/Nexus',
    live: 'https://nexus-api-three-kappa.vercel.app',
    shape: 'council',
    color: '#3d5bd9',
    tint: '#e1e7f6',
    overview:
      'Nexus sends the same task to several language models, coordinates multi-step agents and keeps memory across sessions. It is a self-hostable TypeScript monorepo with a Fastify API, a React dashboard and background workers, and it is bring-your-own-key: provider keys stay inside your deployment.',
    points: [
      'Serves 17 LLM providers behind one streaming, OpenAI-compatible API with health-aware failover.',
      'Runs council deliberation: parallel model dispatch, blind review and debate rounds merged into one verdict.',
      'Coordinates agent teams with task boards, approvals, budget hard stops and a breaker for loops and cost spikes.',
      'Isolates agent code in gVisor or Kata microVMs and recalls memory through pgvector and BM25 hybrid search.',
    ],
  },
  {
    slug: 'worldfin',
    name: 'WorldFin',
    line: 'Geopolitical market advisory',
    year: '2026',
    stack: ['Laya (ModernBERT-large)', 'LoRA / PEFT', 'GDELT', 'Python', 'FastAPI', 'PostgreSQL', 'Cloudflare Workers', 'GitHub Actions'],
    github: 'https://github.com/Yash-Awasthi/fin-scrape',
    live: 'https://winfin.pages.dev/app/',
    image: '/work/worldfin.jpg',
    imageAlt: 'landing page with the live event globe',
    shape: 'globe',
    color: '#2a8f8a',
    tint: '#dcecea',
    overview:
      "WorldFin reads world news from 32 feeds and GDELT's event stream, works out which sectors and tickers each event moves, and turns related events into scenarios with a probability and an instruction: invest, pull out or observe. Every call is then scored against how the stock moved next to the S&P 500.",
    points: [
      'Maps world news from 32 RSS feeds and GDELT to sectors and tickers with invest or pull-out calls.',
      'Fine-tunes Laya with LoRA, lifting held-out sector accuracy from 75% to 86% and direction from 68% to 83%.',
      'Scores every call against SPY; the four-day hit rate holds at 59% over 846 calls (Wilson 56-62%).',
      'Backtests on 25.9M GDELT events across 503 S&P 500 tickers, and runs at $0 a month on free tiers.',
    ],
  },
  {
    slug: 'pocketdesk',
    name: 'PocketDesk',
    line: 'Self-hosted phone control for a PC and its AI agents',
    year: '2026',
    stack: ['iroh (QUIC)', 'NVENC H.264', 'WebCodecs', 'Node.js', 'node-pty', 'Kotlin', 'Android', 'SSH'],
    github: 'https://github.com/Yash-Awasthi/PocketDesk',
    shape: 'phone',
    color: '#5b5fc7',
    tint: '#e4e5f5',
    overview:
      'PocketDesk is a self-hosted bridge between a PC and an Android phone. Coding agents such as Claude Code and Codex run on the PC; the phone drives them, approves what they want to do, and watches and controls the desktop from any network. No cloud and no accounts.',
    points: [
      'Drives Claude Code, Codex and 8 more CLI agents on a PC from an Android app through a Node daemon.',
      'Reaches the PC from any network over QUIC with hole punching and an encrypted relay, with no VPN or port forward.',
      'Streams the desktop at up to 60 fps, one QUIC stream per GOP, cutting lag on a capped link from 5-7 s to under 1 s.',
      'Sends agent permission prompts to the phone as diff cards, and pairs devices with pinned TLS and TOTP.',
    ],
  },
  {
    slug: 'adapfit',
    name: 'AdapFit',
    line: 'Adaptive fitness and recovery engine',
    year: '2026',
    stack: ['Rust (PyO3)', 'Health Connect', 'Python', 'FastAPI', 'PostgreSQL', 'React Native', 'Expo', 'TypeScript', 'Docker'],
    github: 'https://github.com/Yash-Awasthi/adapfit',
    shape: 'rings',
    color: '#4a7fc1',
    tint: '#e0e9f3',
    overview:
      'AdapFit answers one question every morning: what should I do today, and why? It turns daily check-ins and wearable data into a train, reduce, recover or rest decision, and explains the decision instead of showing a dashboard of raw numbers.',
    points: [
      'Turns daily check-ins into train, reduce, recover or rest advice through a FastAPI and React Native app.',
      "Scores recovery against each user's own baseline from HRV, sleep, training load, nutrition and self-report.",
      'Limits the LLM to rewording decisions, behind a safety policy that screens English, Hindi and Hinglish.',
      "Implements per-purpose consent, session revocation, encryption at rest and erasure for India's DPDP Act.",
    ],
  },
  {
    slug: 'case-files',
    name: 'Case Files',
    line: 'Per-player personalised CTF platform',
    year: '2025',
    stack: ['Cloudflare Workers', 'D1', 'Astro', 'React', 'TypeScript', 'Drizzle ORM', 'Playwright', 'Vitest'],
    github: 'https://github.com/Yash-Awasthi/CTF',
    shape: 'files',
    color: '#3f7f9f',
    tint: '#deeaef',
    overview:
      'A browser capture-the-flag event: thirty sequential challenges that tell one investigation. Every player gets their own evidence (names, dates, files, audio, images) derived from an event secret, so a copied answer traces back to its owner.',
    points: [
      'Runs a 30-challenge investigation CTF on Cloudflare Workers and D1 with unique evidence per player.',
      "Derives each player's names, files, audio and images from HMAC seeds, so a copied answer traces to its source.",
      'Scores with time decay and hint penalties, rate-limits submissions and streams admin updates over SSE.',
      'Proves every challenge solvable end to end with Playwright playthroughs and automated puzzle solvers.',
    ],
  },
  {
    slug: 'ping',
    name: 'Ping',
    line: 'Offline gesture-matched contact exchange',
    year: '2026',
    stack: ['MediaPipe Hands', 'Nearby Connections', 'Kotlin', 'Jetpack Compose', 'BLE', 'Wi-Fi Direct', 'Room'],
    github: 'https://github.com/Yash-Awasthi/Ping',
    shape: 'pair',
    color: '#6a78d1',
    tint: '#e5e8f6',
    overview:
      'Two people hold the same hand gesture up to their cameras and their phones swap contact cards. No internet, no accounts, no QR codes. The gesture decides who to connect to; a six-digit check decides whether to trust them.',
    points: [
      'Swaps contact cards offline when two people hold the same hand gesture, with no server or account.',
      "Encodes MediaPipe's 21 hand landmarks into a matching code covering about 40 poses and motions.",
      'Connects phones over BLE and Wi-Fi Direct and seals cards with P-256 ECDH, HKDF and AES-256-GCM.',
      'Releases a card only after both users confirm a six-digit code, since a gesture alone is guessable.',
    ],
  },
  {
    slug: 'risc-v-attn',
    name: 'RISC-V attn',
    line: 'Custom attention instruction in the GCC toolchain',
    year: '2026',
    stack: ['RISC-V ISA extension', 'GCC 15.2 (GIMPLE, RTL)', 'Binutils 2.46', 'C', 'C++', 'Bash'],
    github: 'https://github.com/Yash-Awasthi/RISC-V_Injection',
    shape: 'chip',
    color: '#237a94',
    tint: '#d9eaee',
    overview:
      'A modified RISC-V toolchain with a native attn instruction for transformer attention. C code reaches it through a builtin with no inline assembly, or through an experimental compiler pass that spots the attention loops on its own. The toolchain side is complete; a simulator model and hardware are the next step.',
    points: [
      'Adds an R4-type attn instruction for scaled dot-product attention in the custom-0 opcode space.',
      'Extends Binutils to encode it and GCC with an RTL pattern, -mattn flag and builtin, with no inline assembly.',
      'Adds an experimental 500-line GIMPLE pass that reduces four attention loop nests in plain C to one attn.',
      'Scripts injection of any new custom instruction into GCC, Binutils, LLVM, Spike and QEMU from one spec.',
    ],
  },
  {
    slug: 'key-router',
    name: 'Key Router',
    line: 'Expiring gateway keys for LLM providers',
    year: '2026',
    stack: ['Cloudflare Workers', 'Workers KV', 'Web Crypto', 'JavaScript', 'node:test'],
    github: 'https://github.com/Yash-Awasthi/Key-Router',
    shape: 'key',
    color: '#3367a8',
    tint: '#dfe6f1',
    overview:
      'Key Router hands out access to an LLM provider without handing out the key. A Cloudflare Worker wraps the real key in a disposable gateway key with an expiry, swaps the real key back in at the edge and forwards each request, streaming included.',
    points: [
      'Wraps any OpenAI-compatible provider key in a disposable, expiring gateway key; clients never see the real one.',
      'Proxies requests at the edge on Cloudflare Workers, streaming included, with routes expiring through KV TTL.',
      'Serves Claude Code through Anthropic-compatible endpoints and prints a ready settings file for each key.',
      'Guards the admin page with a constant-time password check and deploys on the free plan in one command.',
    ],
  },
];

export const JOURNEY = [
  {
    when: '2021',
    color: '#237a94',
    title: 'Class X',
    place: 'Kendriya Vidyalaya, Damoh',
    body: 'Finished with 98.2%.',
  },
  {
    when: '2023',
    color: '#2a8f8a',
    title: 'Class XII',
    place: 'Kendriya Vidyalaya, Mahasamund',
    body: 'Finished with 90.2%.',
  },
  {
    when: '2024 - 2028',
    color: '#3f7f9f',
    title: 'B.Tech, Computer Science',
    place: 'NIT Raipur',
    body: 'CGPA 9.26. Class representative for 120+ students and convenor of the Association of Computer Engineers.',
  },
  {
    when: 'May - Jul 2025',
    color: '#3d5bd9',
    title: 'Research intern, Physics',
    place: 'NIT Raipur',
    body: "Replicated and extended MIT Media Lab's TARF sea-to-air speech system. Built a socket pipeline under 200 ms latency and improved signal quality by 8-12 dB.",
  },
  {
    when: 'Jun - Sep 2026',
    color: '#6a78d1',
    title: 'Research intern, Consumer Psychology',
    place: 'IIM Raipur',
    body: 'Working paper on whether human-versus-AI influencer comparisons measure what they claim. Audited 19 published studies and replicated 12 statistics within 0.005 in a reproducible R pipeline.',
  },
  {
    when: 'Jul - Sep 2026',
    color: '#4a7fc1',
    title: 'App development intern',
    place: 'Cloord Solutions',
    body: 'Backend, API and React Native work on a multi-tenant school platform used by 1,000+ parents.',
  },
];

export const CLOORD = {
  org: 'Cloord Solutions',
  role: 'App development intern',
  when: '23 Jul - 23 Sep 2026',
  verify: 'https://drive.google.com/file/d/1Fi3ucbdtgykOgTswaX_vapLCxWNQwM_N/view?usp=sharing',
  stack: ['TypeScript', 'React Native', 'Expo', 'Next.js', 'AWS Cognito', 'DynamoDB', 'AppSync', 'Lambda', 'S3'],
  points: [
    'Built a multi-tenant school platform (Next.js API on Amplify, web portal, 4 Expo apps) for 1,000+ parents.',
    'Hardened 300+ API routes on DynamoDB with org isolation, conditional writes, transactions and rate limits.',
    'Rebuilt fee payments with once-only settlement, an EventBridge sweeper, refunds and receipt cancel windows.',
    'Secured 5 roles on Cognito and S3 presigned access; replaced public Lambda URLs with authenticated routes.',
    'Built live bus tracking on AppSync with driver bus claim, offline retry and TTL expiry, and a GPS staff app.',
  ],
};

export const CERTS = [
  {
    name: 'Agentic AI Foundations Associate',
    issuer: 'Oracle',
    when: 'Aug 2026',
    href: 'https://brm-certview.oracle.com/ords/certview/ScoreReport?ssn=OC8096940&registrationID=asx-d04c983d-78db-4c34-b80d-0201d4bd4ba4',
  },
  {
    name: 'Certified Associate Software Operator',
    issuer: 'Redis',
    when: 'Jul 2026',
    href: 'https://university.redis.io/certificate/tareelgvzdb6ug',
  },
  { name: 'Hedera Certified Foundation', issuer: 'The Hashgraph Association', when: 'Aug 2026' },
];

// Course completions sit below the certifications at a lower weight; each links to its verification page.
const SKILLJAR = 'https://verify.skilljar.com/c/';
export const COURSES = [
  {
    group: 'Mastercard via Forage',
    when: 'Sept 2026',
    items: [
      [
        'Cybersecurity Job Simulation',
        'https://forage-uploads-prod.s3.amazonaws.com/completion-certificates/mfxGwGDp6WkQmtmTf/vcKAB5yYAgvemepGQ_mfxGwGDp6WkQmtmTf_6a9e4f7b6eea872820b3b0d0_1788769923004_completion_certificate.pdf',
      ],
    ],
  },
  {
    group: 'Anthropic Academy',
    when: 'Jul 2026',
    items: [
      ['Building with the Claude API', 'o4x6n69rietm'],
      ['Claude Code in Action', 'chhj3umb82i6'],
      ['MCP: Advanced Topics', 'fkc7c9mh3exj'],
      ['Introduction to MCP', 'dsut5nipc2ps'],
      ['Introduction to Subagents', 'vv7k2d7co667'],
      ['Introduction to Agent Skills', 'bjhipduwc57f'],
      ['Claude with Amazon Bedrock', 'mwxyfw3skoax'],
      ['Claude on Google Cloud', 'k4iyzcgxzuq7'],
      ['Claude Platform 101', '4cfngdzkzay7'],
      ['Claude Code 101', 'odz56vrgrkou'],
      ['Claude 101', '9kn55sgpe52n'],
      ['Introduction to Claude Cowork', 'b2qrufdk8pkh'],
      ['AI Fluency: Framework & Foundations', 'dd2eqr6sv8jk'],
      ['AI Capabilities and Limitations', 'xv5vir5ch4gm'],
      ['AI Fluency for Builders', '8ogcx8vji5b2'],
      ['AI Fluency for Students', 'rkhoeugbxy8t'],
      ['AI Fluency for Educators', 'bkkue8ez8939'],
      ['AI Fluency for Nonprofits', 'txb3kwfdktqw'],
      ['AI Fluency for Small Businesses', 'kqfnic34uuco'],
      ['Teaching AI Fluency', 'ijp5s9dnfzzk'],
    ].map(([name, code]) => [name, SKILLJAR + code]),
  },
];
