# Jolly source

Everything needed to rebuild and edit the 3D Jolly in `public/jolly.glb` (a fan tribute, not affiliated with Meta).

| File | Does |
| --- | --- |
| `jolly.blend` | The working scene (rig, face shape keys, 20 animation actions) |
| `jolly_build.py` | Body, hood face opening, arms with mitten thumbs, legs, eyes |
| `jolly_face.py` | Face morph targets: blink, happy arc, sleepy, wide, shy, mouth open, "o", pout, tongue |
| `jolly_export.py` | Rig, hand weights, AO bake, fur attribute (R density, G length, B AO), first GLB export |
| `jolly_anim.py` | The authored clips and the final GLB export with animations and morph targets |
| `rebuild.py` | Runs all four in order |

## Rebuild

Needs Blender 5.x. In Blender's Scripting tab:

```python
import sys; sys.path.insert(0, r"C:/path/to/portfolio/tools/jolly")
import rebuild; rebuild.run()
```

This overwrites `public/jolly.glb` (about 1.3 MB; keep it under 2 MB). Clip lengths must match `CLIPS` in
`src/three/jollyMind.js`, which the web code reads, and bone poses use the web model frame
(x right, y up, z toward the viewer), the same as `pose()` in `src/three/Jolly.jsx`.

The web side lives in `src/three/Jolly.jsx` (fur shells, clip player, physics) and `src/three/jollyMind.js`
(behaviour); check the behaviour with `node src/three/jollyMind.check.mjs`.
