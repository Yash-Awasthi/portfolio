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
  { label: 'Telegram', href: 'https://t.me/yvawasthi' },
];

// `shape` picks the object in three/Artifacts.jsx; `color` is its accent, `tint` the page wash behind it.
export const PROJECTS = [
  {
    slug: 'nexus',
    name: 'Nexus',
    line: 'Multi-agent LLM orchestration platform',
    year: '2026',
    stack: ['TypeScript', 'Node.js', 'Fastify', 'React', 'PostgreSQL', 'pgvector', 'Redis', 'BullMQ', 'Docker'],
    github: 'https://github.com/Yash-Awasthi/Nexus',
    live: 'https://nexus-api-three-kappa.vercel.app',
    shape: 'council',
    color: '#3d5bd9',
    tint: '#e1e7f6',
    overview:
      'Nexus sends the same task to several language models, coordinates multi-step agents and keeps memory across sessions. It is a self-hostable TypeScript monorepo with a Fastify API, a React dashboard and background workers, and it is bring-your-own-key: provider keys stay inside your deployment.',
    points: [
      'Runs, compares and coordinates models from 17 providers behind one streaming API.',
      'Council deliberation: parallel model dispatch, blind review and debate rounds merged into one verdict.',
      'Agent teams with task boards, approvals and per-call budget checks that steer failover away from overspend.',
      'Hybrid pgvector and BM25 memory, sandboxed code execution, and JWT auth with encrypted keys.',
    ],
  },
  {
    slug: 'worldfin',
    name: 'WorldFin',
    line: 'Geopolitical market advisory',
    year: '2026',
    stack: ['Python', 'FastAPI', 'PostgreSQL', 'PyTorch', 'Transformers', 'LoRA', 'TypeScript', 'Cloudflare', 'GitHub Actions'],
    github: 'https://github.com/Yash-Awasthi/fin-scrape',
    live: 'https://winfin.pages.dev/app/',
    image: '/work/worldfin.jpg',
    imageAlt: 'landing page with the live event globe',
    shape: 'globe',
    color: '#2a8f8a',
    tint: '#dcecea',
    overview:
      'WorldFin reads world and geopolitical news every 30 minutes, works out which sectors and tickers each event moves, and turns related events into scenarios with a probability and an instruction: invest, pull out or observe. Every call is then scored against the market move that followed.',
    points: [
      'Maps world news to affected sectors and tickers with invest or pull-out calls.',
      'Fine-tuned a ModernBERT classifier with LoRA; nightly retraining lifted held-out sector accuracy from 74% to 82%.',
      'Scores every call against the market move that followed, reporting hit rate, reliability and Brier score.',
      'Runs at $0 a month: FastAPI on Render, Supabase Postgres, Cloudflare Pages, and ingest every 30 minutes.',
    ],
  },
  {
    slug: 'adapfit',
    name: 'AdapFit',
    line: 'Adaptive fitness and recovery engine',
    year: '2026',
    stack: ['Python', 'FastAPI', 'PostgreSQL', 'React Native', 'Expo', 'TypeScript', 'OpenCV', 'Docker'],
    github: 'https://github.com/Yash-Awasthi/adapfit',
    shape: 'rings',
    color: '#4a7fc1',
    tint: '#e0e9f3',
    overview:
      'AdapFit answers one question every morning: what should I do today, and why? It turns daily check-ins and wearable data into a train, reduce, recover or rest decision, and explains the decision instead of showing a dashboard of raw numbers.',
    points: [
      'FastAPI and React Native app that turns daily check-ins into train, reduce, recover or rest advice.',
      "Scores recovery against each user's own baseline from HRV, sleep, training load, nutrition and self-report.",
      'Limits the LLM to rewording decisions, behind a safety policy that blocks diagnosis and fixes emergency replies.',
      "Per-purpose consent, session revocation, encryption at rest and account erasure for India's DPDP Act.",
    ],
  },
  {
    slug: 'pocketdesk',
    name: 'PocketDesk',
    line: 'Self-hosted phone control for a PC and its AI agents',
    year: '2026',
    stack: ['Node.js', 'Kotlin', 'Android', 'WebSocket', 'QUIC', 'TLS', 'SSH'],
    github: 'https://github.com/Yash-Awasthi/PocketDesk',
    shape: 'phone',
    color: '#5b5fc7',
    tint: '#e4e5f5',
    overview:
      'PocketDesk is a self-hosted bridge between a PC and an Android phone. Coding agents such as Claude Code and Codex run on the PC; the phone drives them, approves what they want to do, and can watch and control the desktop. No cloud and no accounts.',
    points: [
      'Node daemon and Kotlin app that drive Claude Code, Codex and other CLI agents on a PC from a phone.',
      'Terminals stream over WebSocket with sequence-numbered replay, resending only missed output on reconnect.',
      'Agent permission prompts reach the phone as diff cards, auto-denied on timeout so agents never hang.',
      'Streams the PC desktop at up to 60 fps, secured by pinned TLS, TOTP pairing and QUIC hole punching.',
    ],
  },
  {
    slug: 'case-files',
    name: 'Case Files',
    line: 'Per-player personalised CTF platform',
    year: '2025',
    stack: ['TypeScript', 'Astro', 'React', 'Cloudflare Workers', 'D1', 'Drizzle ORM', 'Playwright'],
    github: 'https://github.com/Yash-Awasthi/CTF',
    shape: 'files',
    color: '#3f7f9f',
    tint: '#deeaef',
    overview:
      'A browser capture-the-flag event: thirty sequential challenges that tell one investigation. Every player gets their own evidence (names, dates, files, audio, images) derived from an event secret, so a copied answer traces back to its owner.',
    points: [
      'A 30-challenge CTF on Cloudflare Workers and D1 where each player gets unique, generated evidence.',
      'Per-player content derived from HMAC seeds, so a copied answer traces back to its source.',
      'Timed scoring with hint penalties, rate-limited submissions, admin controls and a live SSE feed.',
      'Every challenge verified solvable end to end with Playwright playthroughs and automated puzzle solvers.',
    ],
  },
  {
    slug: 'ping',
    name: 'Ping',
    line: 'Offline gesture-matched contact exchange',
    year: '2026',
    stack: ['Kotlin', 'Jetpack Compose', 'MediaPipe', 'BLE', 'Wi-Fi Direct', 'Room'],
    github: 'https://github.com/Yash-Awasthi/Ping',
    shape: 'pair',
    color: '#6a78d1',
    tint: '#e5e8f6',
    overview:
      'Two people hold the same hand gesture up to their cameras and their phones swap contact cards. No internet, no accounts, no QR codes. The gesture decides who to connect to; a six-digit check decides whether to trust them.',
    points: [
      'An offline Android app where two people swap contacts by holding the same hand gesture.',
      'Turns MediaPipe hand landmarks into a matching code covering about 40 poses, with no enrolment.',
      'Connects phones over BLE and Wi-Fi Direct and seals contact cards with ECDH and AES-256-GCM.',
      'Releases cards only after both users confirm a six-digit code, since a gesture alone is guessable.',
    ],
  },
  {
    slug: 'risc-v-attn',
    name: 'RISC-V attn',
    line: 'Custom attention instruction in the GCC toolchain',
    year: '2026',
    stack: ['C', 'C++', 'RISC-V', 'GCC', 'Binutils'],
    github: 'https://github.com/Yash-Awasthi/RISC-V_Injection',
    shape: 'chip',
    color: '#237a94',
    tint: '#d9eaee',
    overview:
      'A custom RISC-V toolchain that adds a native attn instruction for transformer attention. Plain C code gets the instruction without intrinsics or inline assembly: the compiler recognises the pattern and emits it.',
    points: [
      'Added a custom attn instruction for transformer attention in the custom-0 opcode space.',
      'Extended Binutils to encode it and GCC with an RTL pattern and builtin, avoiding inline assembly.',
      'Wrote an opt-in GIMPLE pass that spots attention loops in plain C and emits the single instruction.',
      'Scripted generation of new custom instructions across GCC, Binutils, LLVM, Spike and QEMU.',
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
  { name: 'Agentic AI Certified Foundations Associate', issuer: 'Oracle', when: 'Aug 2026' },
  {
    name: 'Certified Associate Software Operator',
    issuer: 'Redis',
    when: 'Jul 2026',
    href: 'https://university.redis.io/certificate/tareelgvzdb6ug',
  },
  { name: 'Hedera Certified Foundation', issuer: 'The Hashgraph Association', when: 'Aug 2026' },
];
