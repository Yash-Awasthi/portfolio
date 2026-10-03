import os, bpy, bmesh, math as m
from mathutils import Vector

P = dict(
    prof=[(0.24,0.0),(0.27,0.36),(0.36,0.55),(0.50,0.665),(0.66,0.71),(0.84,0.70),(1.00,0.655),(1.14,0.60),(1.28,0.57),
          (1.48,0.565),(1.72,0.575),(1.92,0.55),(2.08,0.48),(2.20,0.36),(2.28,0.20),(2.32,0.0)],
    belly=(0.10, 0.72, 0.28),
    depth=0.86, face_z=1.71, face_w=0.45, face_h=0.30,
    eye_x=0.24, eye_z=1.705, eye_r=0.05, mouth_z=1.622,
    cheek_x=0.32, cheek_z=1.60,
    fur_body=0.154, fur_arm=0.12, fur_leg=0.075, fur_root=(0.42,0.30,0.22), fur_tip=(0.80,0.62,0.48),
    skin=(0.42,0.32,0.24), blush=(0.47,0.24,0.22),
)

def clear():
    for o in list(bpy.data.objects): bpy.data.objects.remove(o)
    for c in (bpy.data.meshes, bpy.data.curves, bpy.data.materials, bpy.data.particles, bpy.data.lights, bpy.data.cameras):
        for x in list(c): c.remove(x)

def catmull(pts, n):
    out = []
    ext = [pts[0]] + pts + [pts[-1]]
    for i in range(1, len(ext) - 2):
        p0, p1, p2, p3 = map(Vector, ext[i-1:i+3])
        for k in range(n):
            t = k / n
            out.append(0.5*((2*p1)+(-p0+p2)*t+(2*p0-5*p1+4*p2-p3)*t*t+(-p0+3*p1-3*p2+p3)*t**3))
    out.append(Vector(pts[-1]))
    return [(v.x, max(v.y, 0)) for v in out]

def revolve(name, prof, depth, seg=64):
    me = bpy.data.meshes.new(name); bm = bmesh.new(); rings = []
    inner = [p for p in prof if p[1] > 1e-3]
    for z, r in inner:
        amp, bz, bw = P['belly']
        bulge = 1 + amp*m.exp(-((z-bz)/bw)**2)
        ring = []
        for i in range(seg):
            c, s_ = m.cos(2*m.pi*i/seg), m.sin(2*m.pi*i/seg)
            ring.append(bm.verts.new((r*c, depth*r*s_*(bulge if s_ < 0 else 1), z)))
        rings.append(ring)
    for a, b in zip(rings, rings[1:]):
        for i in range(seg): bm.faces.new((a[i], a[(i+1)%seg], b[(i+1)%seg], b[i]))
    bot = bm.verts.new((0, 0, prof[0][0])); top = bm.verts.new((0, 0, prof[-1][0]))
    for i in range(seg):
        bm.faces.new((rings[0][(i+1)%seg], rings[0][i], bot)); bm.faces.new((rings[-1][i], rings[-1][(i+1)%seg], top))
    bm.normal_update(); bm.to_mesh(me); bm.free()
    o = bpy.data.objects.new(name, me); bpy.context.collection.objects.link(o)
    for p in me.polygons: p.use_smooth = True
    return o

def tube(name, pts, seg=32):
    """pts: list of (Vector center, radius) along the limb, capped with hemispheres."""
    prof = []
    c0, r0 = pts[0]; c1, r1 = pts[-1]
    d0 = (pts[1][0]-c0).normalized(); d1 = (c1-pts[-2][0]).normalized()
    for k in range(8, 0, -1):
        a = m.pi/2*k/8; prof.append((c0 - d0*r0*m.sin(a), r0*m.cos(a), d0))
    for c, r in pts: prof.append((c, r, None))
    for k in range(1, 9):
        a = m.pi/2*k/8; prof.append((c1 + d1*r1*m.sin(a), r1*m.cos(a), d1))
    me = bpy.data.meshes.new(name); bm = bmesh.new(); rings = []
    q = None; dprev = None
    for i, (c, r, d) in enumerate(prof):
        if d is None:
            j = min(max(i-8, 0), len(pts)-1)
            a = pts[max(j-1, 0)][0]; b = pts[min(j+1, len(pts)-1)][0]; d = (b-a).normalized()
        # parallel transport: rotate the previous frame, so rings never flip their twist
        q = Vector((0, 0, 1)).rotation_difference(d) if q is None else dprev.rotation_difference(d) @ q
        dprev = d
        r = max(r, 1e-3)
        rings.append([bm.verts.new(c + q @ Vector((r*m.cos(2*m.pi*s/seg), r*m.sin(2*m.pi*s/seg), 0))) for s in range(seg)])
    for a, b in zip(rings, rings[1:]):
        for s in range(seg): bm.faces.new((a[s], a[(s+1)%seg], b[(s+1)%seg], b[s]))
    bm.normal_update(); bm.to_mesh(me); bm.free()
    o = bpy.data.objects.new(name, me); bpy.context.collection.objects.link(o)
    for p in me.polygons: p.use_smooth = True
    return o

def smooth_path(ctrl, n=6):
    # catmull-rom through (point, radius) pairs so the limb has no kinks
    pts = [Vector((*p, r)) for p, r in ctrl]
    ext = [pts[0]] + pts + [pts[-1]]; out = []
    for i in range(1, len(ext) - 2):
        p0, p1, p2, p3 = ext[i-1:i+3]
        for k in range(n):
            t = k / n
            out.append(0.5*((2*p1)+(-p0+p2)*t+(2*p0-5*p1+4*p2-p3)*t*t+(-p0+3*p1-3*p2+p3)*t**3))
    out.append(pts[-1])
    return [(Vector(v[:3]), v[3]) for v in out]

def principled(name, col, rough=0.6, sss=0.0):
    mt = bpy.data.materials.new(name); mt.use_nodes = True
    b = next(n for n in mt.node_tree.nodes if n.type == 'BSDF_PRINCIPLED')
    b.inputs['Base Color'].default_value = (*col, 1); b.inputs['Roughness'].default_value = rough
    b.inputs['Subsurface Weight'].default_value = sss
    return mt, b

def rgba_mix(nt):
    mx = nt.nodes.new('ShaderNodeMix'); mx.data_type = 'RGBA'
    A = next(i for i in mx.inputs if i.name == 'A' and i.type == 'RGBA')
    B = next(i for i in mx.inputs if i.name == 'B' and i.type == 'RGBA')
    F = next(i for i in mx.inputs if i.name == 'Factor' and i.type == 'VALUE')
    R = next(o for o in mx.outputs if o.type == 'RGBA')
    return A, B, F, R

TAPER = 0.09

def face_d(x, z, fw, fh):
    # normalised distance from the face centre; 1 on the rim. The top is a touch narrower and rounder.
    v = max(-1, min(1, z / fh))
    xs = abs(x) / (fw * (1 - TAPER * v))
    e = 2.85 if z < 0 else 2.15
    return (xs**e + (abs(z) / fh)**e)**(1 / e)

def face_shell(fw, fh, fz, nu=24, na=96):
    # superellipse patch hugging the head, domed slightly, rim tucked back under the hood fur
    me = bpy.data.meshes.new("Face"); bm = bmesh.new()
    R = 0.575; D = P['depth']
    def pt(u, a):
        c, s_ = m.cos(a), m.sin(a)
        k = 0.7 if s_ < 0 else 0.93
        z = fh*u*m.copysign(abs(s_)**k, s_)
        x = fw*u*m.copysign(abs(c)**k, c)*(1 - TAPER*z/fh)
        y = -D*m.sqrt(max(R*R - x*x, 0.01)) + 0.03 - 0.065*(1 - u*u) + 0.07*max(0, u - 0.85)/0.15
        return (x, y, z)
    c0 = bm.verts.new(pt(0, 0)); rings = []
    for i in range(1, nu + 1):
        rings.append([bm.verts.new(pt(i/nu, 2*m.pi*k/na)) for k in range(na)])
    for k in range(na): bm.faces.new((c0, rings[0][k], rings[0][(k+1) % na]))
    for r0, r1 in zip(rings, rings[1:]):
        for k in range(na): bm.faces.new((r0[k], r1[k], r1[(k+1) % na], r0[(k+1) % na]))
    bm.normal_update()
    if c0.normal.y > 0: bmesh.ops.reverse_faces(bm, faces=bm.faces)
    bm.to_mesh(me); bm.free()
    o = bpy.data.objects.new("Face", me); bpy.context.collection.objects.link(o); o.location = (0, 0, fz)
    for p in me.polygons: p.use_smooth = True
    so = o.modifiers.new("solid", "SOLIDIFY"); so.thickness = 0.04; so.offset = 1.0
    return o

def mitten(arm, sx):
    # a stubby thumb on the inner front of the paw, fused in by remeshing so no seam shows
    th = tube("thumb", smooth_path([((sx*0.76, -0.12, 0.70), 0.092), ((sx*0.70, -0.22, 0.62), 0.09),
                                    ((sx*0.66, -0.28, 0.56), 0.082)], n=6), seg=24)
    bpy.ops.object.select_all(action='DESELECT')
    th.select_set(True); arm.select_set(True); bpy.context.view_layer.objects.active = arm
    bpy.ops.object.join()
    rm = arm.modifiers.new("fuse", "REMESH"); rm.mode = 'VOXEL'; rm.voxel_size = 0.03; rm.use_smooth_shade = True
    bpy.ops.object.modifier_apply(modifier=rm.name)
    sm = arm.modifiers.new("soft", "SMOOTH"); sm.factor = 0.6; sm.iterations = 4
    bpy.ops.object.modifier_apply(modifier=sm.name)
    for p in arm.data.polygons: p.use_smooth = True

def build():
    clear()
    body = revolve("Body", catmull(P['prof'], 5), P['depth'])
    sub = body.modifiers.new("sub", "SUBSURF"); sub.levels = sub.render_levels = 2
    # face hollow: push body inward where the face sits
    vg = body.vertex_groups.new(name="furmask")
    fz, fw, fh = P['face_z'], P['face_w'], P['face_h']
    for v in body.data.vertices:
        x, y, z = v.co
        d = face_d(x, z - fz, fw, fh) if y < -0.2 else 9
        if d < 1.0: v.co.y += 0.03
        elif d < 1.9: v.co.y -= 0.02*m.sin(m.pi*(d-1.0)/0.9)
        vg.add([v.index], min(1, max(0, (d-0.92)/0.08)), 'REPLACE')

    face = face_shell(fw + 0.02, fh + 0.02, fz)

    bpy.context.view_layer.update()
    fe = face.evaluated_get(bpy.context.evaluated_depsgraph_get())
    def surf(x, z):
        o = Vector((x, -5, z)) - face.location
        return fe.ray_cast(o, Vector((0, 1, 0)))[1].y + face.location.y
    for sx, n in ((1, "EyeR"), (-1, "EyeL")):
        bpy.ops.mesh.primitive_uv_sphere_add(radius=P['eye_r'], segments=24, ring_count=12,
            location=(sx*P['eye_x'], surf(sx*P['eye_x'], P['eye_z']) + 0.006, P['eye_z']))
        e = bpy.context.object; e.name = n; e.scale = (1, 0.3, 1)
        for p in e.data.polygons: p.use_smooth = True
        r = P['eye_r']
        bpy.ops.mesh.primitive_uv_sphere_add(radius=r*0.2, segments=16, ring_count=8,
            location=(e.location.x + r*0.38, e.location.y - r*0.3, e.location.z + r*0.42))
        g = bpy.context.object; g.name = "Glint" + n[-1]; g.scale = (1, 0.4, 1)

    cu = bpy.data.curves.new("Mouth", "CURVE"); cu.dimensions = '3D'; cu.bevel_depth = 0.009; cu.bevel_resolution = 4
    sp = cu.splines.new('POLY'); pts = []
    for i in range(11):
        a = m.pi*(1.2 + 0.6*i/10)
        t = -1 + 2*i/10; x = 0.072*t; z = P['mouth_z'] - 0.038*(1 - t*t)**0.8
        pts.append((x, surf(x, z) + 0.002, z))
    sp.points.add(len(pts)-1)
    for p, c in zip(sp.points, pts): p.co = (*c, 1)
    mo = bpy.data.objects.new("Mouth", cu); bpy.context.collection.objects.link(mo)

    for sx, n in ((1, "ArmR"), (-1, "ArmL")):
        arm = tube(n, smooth_path([((sx*0.34, -0.02, 1.22), 0.15), ((sx*0.52, -0.03, 1.06), 0.158),
                             ((sx*0.68, -0.05, 0.88), 0.16), ((sx*0.80, -0.08, 0.68), 0.168),
                             ((sx*0.835, -0.10, 0.54), 0.168), ((sx*0.825, -0.12, 0.46), 0.16)], n=8))
        mitten(arm, sx)
    for sx, n in ((1, "LegR"), (-1, "LegL")):
        o = tube(n, [(Vector((sx*0.285, -0.02, 0.34)), 0.245), (Vector((sx*0.295, -0.03, 0.20)), 0.25),
                     (Vector((sx*0.30, -0.05, 0.10)), 0.25)])
        # soft-clamped sole: flat to stand on, with a rounded edge instead of a crease
        for v in o.data.vertices: v.co.z = 0.03 * m.log1p(m.exp(v.co.z / 0.03))

    materials()
    fur()
    stage()

def materials():
    O = bpy.data.objects
    furm, _ = principled("Fur", P['fur_tip'], 0.9)
    eye, eb = principled("Eye", (0.003, 0.003, 0.003), 0.22)
    eb.inputs['Specular IOR Level'].default_value = 0.25
    glint = bpy.data.materials.new("Glint"); glint.use_nodes = True
    gb = next(n for n in glint.node_tree.nodes if n.type == 'BSDF_PRINCIPLED')
    gb.inputs['Emission Color'].default_value = (1, 1, 1, 1); gb.inputs['Emission Strength'].default_value = 6
    gb.inputs['Base Color'].default_value = (1, 1, 1, 1)
    skin, sb = principled("Skin", P['skin'], 0.6, 0.0)
    nt = skin.node_tree; N = nt.nodes; L = nt.links
    tc = N.new('ShaderNodeTexCoord'); sep = N.new('ShaderNodeSeparateXYZ'); L.new(tc.outputs['Object'], sep.inputs[0])
    acc = None
    for sx in (1, -1):
        dx = N.new('ShaderNodeMath'); dx.operation = 'SUBTRACT'; L.new(sep.outputs['X'], dx.inputs[0]); dx.inputs[1].default_value = sx*P['cheek_x']
        dz = N.new('ShaderNodeMath'); dz.operation = 'SUBTRACT'; L.new(sep.outputs['Z'], dz.inputs[0]); dz.inputs[1].default_value = P['cheek_z'] - P['face_z']
        cv = N.new('ShaderNodeCombineXYZ'); L.new(dx.outputs[0], cv.inputs['X']); L.new(dz.outputs[0], cv.inputs['Z'])
        ln = N.new('ShaderNodeVectorMath'); ln.operation = 'LENGTH'; L.new(cv.outputs[0], ln.inputs[0])
        mr = N.new('ShaderNodeMapRange'); mr.inputs['From Min'].default_value = 0.0; mr.inputs['From Max'].default_value = 0.17
        mr.inputs['To Min'].default_value = 0.75; mr.inputs['To Max'].default_value = 0.0
        mr.interpolation_type = 'SMOOTHSTEP'; L.new(ln.outputs['Value'], mr.inputs['Value'])
        if acc is None: acc = mr
        else:
            mx = N.new('ShaderNodeMath'); mx.operation = 'MAXIMUM'; L.new(acc.outputs[0], mx.inputs[0]); L.new(mr.outputs[0], mx.inputs[1]); acc = mx
    A, B, F, R = rgba_mix(nt); A.default_value = (*P['skin'], 1); B.default_value = (*P['blush'], 1)
    L.new(acc.outputs[0], F); L.new(R, sb.inputs['Base Color'])

    hm = bpy.data.materials.new("FurHair"); hm.use_nodes = True; nt = hm.node_tree; nt.nodes.clear()
    out = nt.nodes.new('ShaderNodeOutputMaterial'); h = nt.nodes.new('ShaderNodeBsdfHairPrincipled')
    h.parametrization = 'COLOR'; h.inputs['Roughness'].default_value = 0.7; h.inputs['Radial Roughness'].default_value = 0.85
    hi = nt.nodes.new('ShaderNodeHairInfo'); A, B, F, R = rgba_mix(nt)
    A.default_value = (*P['fur_root'], 1); B.default_value = (*P['fur_tip'], 1)
    nt.links.new(hi.outputs['Intercept'], F); nt.links.new(R, h.inputs['Color']); nt.links.new(h.outputs[0], out.inputs[0])

    for o in O:
        if o.type not in ('MESH', 'CURVE'): continue
        o.data.materials.clear()
        if o.name.startswith('Glint'): o.data.materials.append(glint)
        elif o.name in ('EyeL', 'EyeR', 'Mouth'): o.data.materials.append(eye)
        elif o.name == 'Face': o.data.materials.append(skin)
        else: o.data.materials.append(furm); o.data.materials.append(hm)

def fur():
    O = bpy.data.objects
    def add(o, count, length, comb=0.10):
        md = o.modifiers.new("fur", "PARTICLE_SYSTEM"); p = md.particle_system.settings
        p.type = 'HAIR'; p.count = count; p.hair_length = length
        p.emit_from = 'FACE'; p.use_even_distribution = True; p.material_slot = "FurHair"
        p.child_type = 'INTERPOLATED'; p.rendered_child_count = 70; p.child_percent = 4
        p.clump_factor = 0.05; p.clump_shape = 0.0
        p.roughness_1 = 0.006; p.roughness_1_size = 1.0; p.roughness_endpoint = 0.05; p.roughness_end_shape = 0.7; p.roughness_2 = 0.012; p.roughness_2_size = 1.0; p.roughness_2_threshold = 0.0
        p.root_radius = 1.0; p.tip_radius = 0.0; p.radius_scale = 0.0032
        p.render_step = 3; p.display_step = 2
        p.effector_weights.gravity = 0.0
        p.object_align_factor[2] = -comb*length
        # hair_length is relative to object size, so rescale to the real strand length
        o.data.update(); dg = bpy.context.evaluated_depsgraph_get()
        hk = o.evaluated_get(dg).particle_systems[0].particles[0].hair_keys
        k = length / (hk[-1].co - hk[0].co).length
        p.normal_factor *= k; p.object_align_factor[2] *= k
        return md
    md = add(O["Body"], 30000, P['fur_body'], comb=0.2); md.particle_system.vertex_group_density = "furmask"
    for n in ("ArmR", "ArmL", "LegR", "LegL"):
        s = O[n].modifiers.new("sub", "SUBSURF"); s.levels = s.render_levels = 1
        add(O[n], 5000, P['fur_leg'] if n.startswith("Leg") else P['fur_arm'])

def stage():
    sc = bpy.context.scene
    cam = bpy.data.cameras.new("Cam"); cam.lens = 95
    co = bpy.data.objects.new("Cam", cam); bpy.context.collection.objects.link(co)
    co.location = (0, -9.5, 1.18); co.rotation_euler = (m.radians(90), 0, 0); sc.camera = co
    def area(n, loc, e, size, col):
        l = bpy.data.lights.new(n, 'AREA'); l.energy = e; l.size = size; l.color = col
        o = bpy.data.objects.new(n, l); bpy.context.collection.objects.link(o); o.location = loc
        o.rotation_euler = (Vector((0, 0, 1.1)) - Vector(loc)).to_track_quat('-Z', 'Y').to_euler()
    area("Key", (-2.5, -4.5, 3.5), 560, 5, (1, 0.95, 0.88))
    area("Fill", (3.5, -4, 1.2), 230, 6, (0.97, 0.97, 1))
    area("Rim", (0.5, 4, 3.5), 350, 4, (1, 0.97, 0.92))
    w = sc.world or bpy.data.worlds.new("W"); sc.world = w; w.use_nodes = True
    bg = next(n for n in w.node_tree.nodes if n.type == 'BACKGROUND')
    bg.inputs[0].default_value = (1, 0.93, 0.86, 1); bg.inputs[1].default_value = 0.7
    try: sc.render.engine = 'CYCLES'
    except TypeError as e: print(e)
    cp = bpy.context.preferences.addons['cycles'].preferences
    cp.compute_device_type = 'OPTIX'; cp.refresh_devices()
    for d in cp.devices: d.use = d.type == 'OPTIX'
    sc.cycles.device = 'GPU'
    # fur only in renders; the viewport stalls with it on
    for o in bpy.data.objects:
        for md in o.modifiers:
            if md.type == 'PARTICLE_SYSTEM': md.show_viewport = False
    sc.cycles.samples = 64; sc.cycles.use_denoising = True
    sc.view_settings.view_transform = 'Standard'; sc.view_settings.exposure = -0.4
    sc.render.resolution_x = 1280; sc.render.resolution_y = 1600; sc.render.film_transparent = True

def render(tag, folder=None):
    sc = bpy.context.scene; sc.render.filepath = os.path.join(folder or os.path.dirname(os.path.abspath(__file__)), tag + ".png")
    bpy.ops.render.render(write_still=True)
