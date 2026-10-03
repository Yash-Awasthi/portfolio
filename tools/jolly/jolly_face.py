import bpy, bmesh, math as m
from mathutils import Vector

# Face morph targets. Run after jolly_build.build() and before jolly_export.run().
# Eyes: blink, happy (^ ^), sleepy, wide, shy. Glints: hide. Mouth ribbon: open, ooh, pout, shy.
# Tongue: open. Names are read by Jolly.jsx.

U, V = 28, 6
MOUTH_Z = 1.622

def sqr(x): return max(x, 0.0) ** 0.5

def line(u, v, w=0.072, depth=0.038, th=0.0045):
    return w * u, MOUTH_Z - depth * max(1 - u * u, 0) ** 0.8 + th * v

MOUTH_KEYS = {
    "open": lambda u, v: (0.075 * u, MOUTH_Z - 0.002 - 0.006 * (1 - u * u) - 0.075 * sqr(1 - u * u) * (v + 1) / 2),
    "ooh": lambda u, v: (0.03 * u * sqr(1 - v * v), MOUTH_Z - 0.03 + 0.032 * v),
    "pout": lambda u, v: (0.034 * u, MOUTH_Z - 0.01 + 0.012 * (1 - u * u) + 0.007 * v),
    "shy": lambda u, v: line(u, v, 0.05, 0.02),
}
TONGUE_KEYS = {"open": lambda u, v: (0.035 * u * sqr(1 - v * v), MOUTH_Z - 0.058 + 0.021 * v)}

def eye_keys(r):
    def blink(c): return Vector((c.x * 1.05, c.y, c.z * 0.06))
    def happy(c):
        # a clean ^ arc: parabolic centre line, even thickness, soft round ends
        u = max(-1.0, min(1.0, c.x / r))
        s = c.z / max(sqr(r * r - c.x * c.x), 1e-6)
        s = max(-1.0, min(1.0, s))
        zc = 1.0 * r * sqr(1 - u * u) - 0.5 * r
        t = 0.26 * r * sqr(1 - u ** 6) + 0.03 * r
        return Vector((c.x * 1.1, c.y * 0.5, zc + s * t))
    def sleepy(c): return Vector((c.x * 1.05, c.y, -0.35 * r + c.z * 0.55))
    def wide(c): return c * 1.3
    def shy(c): return Vector((c.x * 0.9, c.y, -0.1 * r + c.z * 0.8))
    return {"blink": blink, "sleepy": sleepy, "wide": wide, "shy": shy}

def add_keys(o, fns):
    o.shape_key_add(name="Basis")
    for name, f in fns.items():
        sk = o.shape_key_add(name=name)
        for i, v in enumerate(o.data.vertices): sk.data[i].co = f(v.co)

def ribbon(name, basis, surf):
    me = bpy.data.meshes.new(name); bm = bmesh.new(); grid = []
    for j in range(V + 1):
        row = []
        for i in range(U + 1):
            u, v = -1 + 2 * i / U, -1 + 2 * j / V
            x, z = basis(u, v); row.append(bm.verts.new((x, surf(x, z), z)))
        grid.append(row)
    for j in range(V):
        for i in range(U): bm.faces.new((grid[j][i], grid[j][i + 1], grid[j + 1][i + 1], grid[j + 1][i]))
    bm.normal_update(); bm.to_mesh(me); bm.free()
    o = bpy.data.objects.new(name, me); bpy.context.collection.objects.link(o)
    for p in me.polygons: p.use_smooth = True
    return o

def keyed(o, fns, surf):
    # keys are stored as offsets from the grid's own parameters, so rebuild each from (u, v)
    o.shape_key_add(name="Basis")
    n = 0
    for name, f in fns.items():
        sk = o.shape_key_add(name=name); n = 0
        for j in range(V + 1):
            for i in range(U + 1):
                u, v = -1 + 2 * i / U, -1 + 2 * j / V
                x, z = f(u, v); sk.data[n].co = (x, surf(x, z), z); n += 1

def build():
    O = bpy.data.objects
    face = O["Face"]; bpy.context.view_layer.update()
    fe = face.evaluated_get(bpy.context.evaluated_depsgraph_get())
    def surf(x, z, lift=0.004):
        # the front of the face looks toward -y, so lifting means a smaller y
        o = Vector((x, -5, z)) - face.location
        return fe.ray_cast(o, Vector((0, 1, 0)))[1].y + face.location.y - lift
    old = O.get("Mouth")
    if old:
        cu = old.data; O.remove(old)
        if cu.users == 0: (bpy.data.curves if hasattr(cu, "splines") else bpy.data.meshes).remove(cu)
    eye_mat = bpy.data.materials["Eye"]
    mouth = ribbon("Mouth", lambda u, v: line(u, v), surf)
    keyed(mouth, MOUTH_KEYS, surf)
    mouth.data.materials.append(eye_mat)
    tongue = ribbon("Tongue", lambda u, v: (0.0006 * u, MOUTH_Z - 0.058 + 0.0006 * v), lambda x, z: surf(x, z, 0.006))
    keyed(tongue, TONGUE_KEYS, lambda x, z: surf(x, z, 0.006))
    tongue.data.materials.append(eye_mat)
    for n in ("EyeL", "EyeR"):
        add_keys(O[n], eye_keys(0.05))
        e = O[n]; lash("Lash" + n[-1], e, e.location.y - 0.004)
    for n in ("GlintL", "GlintR"):
        g = O[n]
        c = sum((v.co for v in g.data.vertices), Vector()) / len(g.data.vertices)
        add_keys(g, {"hide": lambda co, c=c: c + (co - c) * 0.001})


def lash(name, eye, surf_y):
    # happy ^ eye: a tube swept along a flattened half circle with round ends. Symmetric by
    # construction; the basis is a point at the eye centre and the "show" key is the full arc.
    a, b, tr, N, M, C = 0.056, 0.042, 0.0125, 28, 12, 6
    def ring(c, t, n, rad):
        t = t.normalized(); bi = Vector((0, 1, 0))
        return [c + rad * (m.cos(2 * m.pi * k / M) * n + m.sin(2 * m.pi * k / M) * bi) for k in range(M)]
    def at(th):
        c = Vector((a * m.cos(th), 0, b * m.sin(th) - 0.3 * b))
        t = Vector((-a * m.sin(th), 0, b * m.cos(th))); n = Vector((b * m.cos(th), 0, a * m.sin(th))).normalized()
        return c, t, n
    rings = []
    for k in range(C, 0, -1):
        c, t, n = at(0.0); ang = m.pi / 2 * k / C
        rings.append(ring(c - t.normalized() * tr * m.sin(ang), t, n, tr * m.cos(ang)))
    for i in range(N + 1):
        c, t, n = at(m.pi * i / N); rings.append(ring(c, t, n, tr))
    for k in range(1, C + 1):
        c, t, n = at(m.pi); ang = m.pi / 2 * k / C
        rings.append(ring(c + t.normalized() * tr * m.sin(ang), t, n, tr * m.cos(ang)))
    bm = bmesh.new(); vs = [[bm.verts.new(p) for p in r] for r in rings]
    for r0, r1 in zip(vs, vs[1:]):
        for k in range(M): bm.faces.new((r0[k], r0[(k + 1) % M], r1[(k + 1) % M], r1[k]))
    bm.normal_update(); me = bpy.data.meshes.new(name); bm.to_mesh(me); bm.free()
    o = bpy.data.objects.new(name, me); bpy.context.collection.objects.link(o)
    for p in me.polygons: p.use_smooth = True
    o.location = (eye.location.x, surf_y, eye.location.z)
    o.shape_key_add(name="Basis")
    sk = o.shape_key_add(name="show")
    full = [v.co.copy() for v in me.vertices]
    for v in me.vertices: sk.data[v.index].co = full[v.index]
    for v in me.vertices: o.data.shape_keys.key_blocks["Basis"].data[v.index].co = Vector((0, 0, 0))
    o.data.materials.append(bpy.data.materials["Eye"])
    return o
