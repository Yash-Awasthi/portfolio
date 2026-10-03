# Portfolio

Personal site for Yash Vaibhav Awasthi. React 19, Vite, Tailwind CSS 4, React Three Fiber and drei
for the 3D layer, anime.js for the 3D stories, Motion for transitions and Lenis for scrolling.

## Develop

Node.js 20 or later.

```
npm install
npm run dev       # local dev server
npm run build     # production build in dist/
npm run preview   # serve the build
npm run lint
```

## Where things live

| Path | Holds |
| --- | --- |
| `src/data.js` | Every piece of copy: projects, journey, experience, certifications, links |
| `src/pages/` | Home, project detail (`/work/:slug`) and 404 |
| `src/three/` | The shared canvas, the per-project 3D objects and the journey path |
| `src/components/` | Navigation and the motion primitives |
| `public/work/` | Real project screenshots only |
| `public/Yash-Vaibhav-Awasthi-Resume.pdf` | Built from the master CV (`Desktop/cv/portfolio-cv`) |
| `design/` | Design system notes and captured screens |

To add a project, append an entry to `PROJECTS` in `src/data.js` and pick one of the shapes in
`src/three/Artifacts.jsx`. The home list, the detail page and the next-project link pick it up.

## Deploy

Vercel, with `vercel.json` rewriting every path to `index.html` so project URLs load directly.

## Credits

The victory hand animation (public/victory.json) is from Google Noto Emoji Animation, licensed CC BY 4.0.
