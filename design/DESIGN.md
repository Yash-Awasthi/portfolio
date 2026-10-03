# Design

The source of truth for the site's look. Code wins when the two disagree; update this file with it.

## Direction

A light, editorial developer portfolio for recruiters and engineers. Large sans display type, soft cool
pastel washes that change per section, and a small set of procedural 3D objects that stand in for each project. Motion is
there to order what the reader sees, never to decorate.

## Colour

One cool family only: blues, teals and indigo, muted. No warm hues and no multi-hue rainbow.

| Token | Value | Use |
| --- | --- | --- |
| `paper` | `#eaf0f1` | Base mist. Never pure white |
| `ink` | `#141a1f` | Text, primary button |
| `muted` | `#52606a` | Secondary text |
| `accent` | `#3d5bd9` | Cobalt, the default accent |

The page background blends linearly with scroll. Every element carrying `data-wash` is a colour
stop at its vertical centre, and the wash is the mix of the two stops either side of the middle of
the viewport (`src/lib/tint.js`, checked by `node src/lib/tint.check.mjs`). Section stops:
hero `#e3ecf2`, statement `#e0eee8`, experience `#e7e5f3`, certifications `#dfecee`, contact `#e3e8f5`.
Each work row is a stop in its project's tint; the journey has one stop per milestone.

| Project | Accent | Tint |
| --- | --- | --- |
| Nexus | `#3d5bd9` | `#e1e7f6` |
| WorldFin | `#2a8f8a` | `#dcecea` |
| AdapFit | `#4a7fc1` | `#e0e9f3` |
| PocketDesk | `#5b5fc7` | `#e4e5f5` |
| Case Files | `#3f7f9f` | `#deeaef` |
| Ping | `#6a78d1` | `#e5e8f6` |
| RISC-V attn | `#237a94` | `#d9eaee` |
| Key Router | `#3367a8` | `#dfe6f1` |

Accents in small text are mixed 72% toward ink (`ink()` in `src/lib/tint.js`) to keep contrast.

## Type

- Display and body: Geist Variable. Display weight 540, tracking -0.045em, leading 0.9.
- Labels, dates, stacks: Geist Mono Variable at 12-13px.
- Hero name `clamp(3.4rem, 10.5vw, 10.5rem)`; section heads `clamp(2.6rem, 7vw, 6.5rem)`.
- Emphasis uses weight or colour of the same family. No serif.

## Shape

Interactive controls are pills. Media, panels and grids are square. Hairlines instead of cards.

## Layout

- Container `max-w-[1400px]`, gutters 16px mobile, 32px desktop, 12-column grid from `md`.
- Every multi-column block collapses to one column below 768px.
- Home order: hero, statement, selected work, journey, experience, certifications, contact.
- Project page: title and 3D object, meta and overview, screenshot (only if real), what I built, next project.

## Motion

| Pattern | Where | Why |
| --- | --- | --- |
| Word mask rise, 60ms stagger | Headings | Sets reading order |
| Fade and 24px rise on enter | Blocks | Reveals content as it arrives |
| Scroll-scrubbed word opacity | Statement | Paces a long sentence |
| Pinned scroll with 3D path | Journey | One milestone at a time, path fills in cobalt |
| Curtain between routes | Page change | Ink rises on exit; the destination's colour lifts off on enter |
| Section wash | Background | Each section carries its own cool pastel |
| Hero parallax | Hero | Name drifts up and fades, the 3D form sinks and shrinks |
| Scroll-driven stack band | Below statement | Two rows slide opposite ways with the scroll |
| Progress line | Top edge | Teal to indigo line tracking page scroll |
| Screenshot zoom | Project page | Grows from 88% as it reaches centre |
| Lenis smooth scroll, lerp 0.1 | Global | Even scroll speed for the pinned and scrubbed parts |

Easing `cubic-bezier(0.16, 1, 0.3, 1)`. Reduced motion turns all of it off, removes Lenis and draws
3D frames only on scroll.

## 3D

- One WebGL canvas behind the page; each 3D spot is a drei `View` into it.
- Three materials only: chrome, white clay, and the project's accent colour. Studio lighting from lightformers, no HDR download.
- Objects ease toward the pointer. Project pages allow drag to turn.

Each object loops a short story of what the project does. Entrances use ease-out
`cubic-bezier(0.23, 1, 0.32, 1)`, on-screen movement ease-in-out `cubic-bezier(0.77, 0, 0.175, 1)`
(`src/three/ease.js`, checked by `node src/three/ease.check.mjs`). Nothing appears by scaling from
zero or fading; things move into place. On project pages the entrance waits 0.9 s for the wipe.

Stories are anime.js timelines over a plain object that the frame loop reads (`useStory` in
`src/three/story.js`): an entrance plays once, then the story loops. Passing `still` holds the
loop at one chosen moment.

| Project | Object | Motion |
| --- | --- | --- |
| Hero | Liquid chrome form, three orbiting spheres | Surface ripples, spheres orbit, tilts to the pointer |
| Nexus | Round table, five differently shaped models | A question drops in and splits to every seat; each writes a card; cards turn face down and pass one seat on; debate beads cross the table; cards gather into a verdict gem |
| WorldFin | Clay globe dotted with events, chrome ring | Ring swings into orbit; event pillars rise and settle as the globe turns |
| AdapFit | HRV trace, recovery gauge, four decision pills | The trace runs into the gauge, the needle settles on that morning's score and its decision lifts; four mornings, one per decision |
| PocketDesk | Laptop, phone, QUIC relay | Commands go through the relay to the terminal, which types; a diff card comes back and is approved; desktop frames stream to the phone, whose screen becomes the desktop |
| Case Files | Three case files with their own seals, magnifier | An answer slip leaves one file for another; the magnifier reads its seal and a thread runs back to the file it came from |
| Ping | Two phones, a hand above each | Both hands close into the same V and lock; the six-digit check lights on both screens; the phones turn and the card crosses |
| RISC-V attn | Chip with traces | Signals run in along traces, the die lifts, turns and seats |
| Key Router | Cloud with a TTL dial, chrome key, accent key | The real key slides into the cloud and stays; the gateway key turns out of the other side; requests arc over the cloud and change colour at the swap; replies stream back underneath; the dial drains and the key turns edge-on and retracts |

On the home page, switching projects is a turntable: the current object turns edge-on and the
next turns in from the other side, replaying its entrance, all inside the frame.

Reduced motion (for example Windows with "Animation effects" off) keeps each object's own story
and the colour washes, fades text in without sliding, crossfades pages, and drops pointer tilt,
bobbing, parallax, the sliding band (it wraps instead), the page wipe and smooth scrolling.

## Screens

`screens/` holds captures of the built site at 1440x900 and 390x844.
