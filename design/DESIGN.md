# Design

The source of truth for the site's look. Code wins when the two disagree; update this file with it.

## Direction

A light, editorial developer portfolio for recruiters and engineers. Large sans display type, a lot of
paper, one accent, and a small set of procedural 3D objects that stand in for each project. Motion is
there to order what the reader sees, never to decorate.

## Colour

| Token | Value | Use |
| --- | --- | --- |
| `paper` | `#f3f3f1` | Page background. Cool off-white, no cream |
| `surface` | `#fbfbfa` | Image backgrounds |
| `ink` | `#121214` | Text, primary button, rules |
| `muted` | `#5e5f66` | Secondary text (6:1 on paper) |
| `line` | `#d9d9d6` | Hairlines, inactive states |
| `accent` | `#2a45e8` | Cobalt. Active state, dates, arrows, one material in every 3D object |

One accent across the whole site. Light theme only.

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
| Ink curtain between routes | Page change | Marks leaving one page for another |
| Lenis smooth scroll, lerp 0.1 | Global | Even scroll speed for the pinned and scrubbed parts |

Easing `cubic-bezier(0.16, 1, 0.3, 1)`. Reduced motion turns all of it off, removes Lenis and draws
3D frames only on scroll.

## 3D

- One WebGL canvas behind the page; each 3D spot is a drei `View` into it.
- Three materials only: chrome, white clay, cobalt. Studio lighting from lightformers, no HDR download.
- Objects ease toward the pointer. Project pages allow drag to turn.

| Project | Object |
| --- | --- |
| Hero | Liquid chrome form with a cobalt satellite |
| Nexus | Cobalt core with chrome models orbiting it |
| WorldFin | Clay globe dotted with cobalt events, chrome ring |
| AdapFit | Three nested rings |
| PocketDesk | Monitor and phone |
| Case Files | Fanned stack of files, top one cobalt |
| Ping | Two phones with beads passing between them |
| RISC-V attn | Chip with a cobalt die |

## Screens

`screens/` holds captures of the built site at 1440x900 and 390x844.
