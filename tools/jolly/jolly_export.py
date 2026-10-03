import os, bpy, math as m
from mathutils import Vector

OUT = os.path.normpath(os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..", "public", "jolly.glb"))

def smooth(a, b, x):
    t = min(1, max(0, (x - a) / (b - a))); return t*t*(3 - 2*t)

def arm_chain(sx):
    # must follow the arm path in jolly_build.py
    return [Vector((sx*0.34, -0.02, 1.22)), Vector((sx*0.68, -0.05, 0.88)), Vector((sx*0.80, -0.15, 0.40))]

def make_rig():
    old = bpy.data.objects.get("Rig")
    if old: bpy.data.objects.remove(old)
    arm = bpy.data.armatures.new("Rig"); rig = bpy.data.objects.new("Rig", arm)
    bpy.context.collection.objects.link(rig)
    bpy.context.view_layer.objects.active = rig
    bpy.ops.object.mode_set(mode='EDIT')
    eb = arm.edit_bones
    def bone(name, h, t, parent=None):
        b = eb.new(name); b.head = h; b.tail = t
        if parent: b.parent = eb[parent]; b.use_connect = False
        return b
    bone("root", (0, 0, 0), (0, 0, 0.3))
    bone("spine", (0, 0, 0.3), (0, 0, 1.25), "root")
    bone("head", (0, 0, 1.25), (0, 0, 2.3), "spine")
    for sx, s in ((1, "R"), (-1, "L")):
        a, e, w = arm_chain(sx)
        bone("arm_" + s, a, e, "spine"); bone("hand_" + s, e, w, "arm_" + s)
        bone("leg_" + s, (sx*0.27, -0.02, 0.40), (sx*0.28, -0.04, 0.0), "root")
    bpy.ops.object.mode_set(mode='OBJECT')
    return rig

def seg_t(p, a, b):
    ab = b - a; return max(0, min(1, (p - a).dot(ab) / ab.length_squared))

def skin(o, rig, weights):
    o.vertex_groups.clear()
    groups = {}
    for v in o.data.vertices:
        for name, w in weights(v.co).items():
            if w <= 1e-4: continue
            g = groups.get(name) or o.vertex_groups.new(name=name); groups[name] = g
            g.add([v.index], w, 'REPLACE')
    md = o.modifiers.new("rig", "ARMATURE"); md.object = rig
    o.parent = rig

# parts that move relative to each other must not shade each other in the bake: the shader does
# that live. Arms are left out of the body bake and body out of the arm bake; the face bake
# leaves out eyes and mouth, which change shape.
HIDE_FOR = {"Face": ("EyeL", "EyeR", "GlintL", "GlintR", "Mouth", "Tongue", "LashL", "LashR"), "Body": ("ArmR", "ArmL", "Face"), "ArmR": ("Body", "ArmL"), "ArmL": ("Body", "ArmR")}

def bake_ao(objs):
    sc = bpy.context.scene
    sc.render.engine = 'CYCLES'; sc.cycles.samples = 256
    sc.world.light_settings.distance = 0.35
    out = {}
    for o in objs:
        me = o.data
        for n in [a.name for a in me.color_attributes]: me.color_attributes.remove(me.color_attributes[n])
        me.color_attributes.new("ao", 'FLOAT_COLOR', 'POINT')
        me.color_attributes.active_color = me.color_attributes["ao"]
        bpy.ops.object.select_all(action='DESELECT'); o.select_set(True); bpy.context.view_layer.objects.active = o
        hid = [bpy.data.objects[n] for n in HIDE_FOR.get(o.name, ())]
        for h in hid: h.hide_render = True
        bpy.ops.object.bake(type='AO', target='VERTEX_COLORS')
        for h in hid: h.hide_render = False
        out[o.name] = [d.color[0] for d in me.color_attributes["ao"].data]
        me.color_attributes.remove(me.color_attributes["ao"])
    return out

def proximity(o, others, far=0.16):
    # fur shortens where another part sits within a fur length, so the layers stop slicing it
    from mathutils.bvhtree import BVHTree
    trees = [BVHTree.FromObject(x, bpy.context.evaluated_depsgraph_get()) for x in others]
    out = []
    for v in o.data.vertices:
        p = o.matrix_world @ v.co
        d = min((t.find_nearest(p)[3] or 9) for t in trees)
        out.append(smooth(0.01, far, d))
    return out

def fur_attr(o, density, length, ao, near=None):
    me = o.data
    if "fur" in me.color_attributes: me.color_attributes.remove(me.color_attributes["fur"])
    ca = me.color_attributes.new("fur", 'FLOAT_COLOR', 'POINT')
    for i, v in enumerate(me.vertices):
        ca.data[i].color = (density(v), length * (near[i] if near else 1), ao[i], 1)

def run():
    O = bpy.data.objects
    mo = O["Mouth"]
    if mo.type == 'CURVE':
        bpy.ops.object.select_all(action='DESELECT'); mo.select_set(True)
        bpy.context.view_layer.objects.active = mo; bpy.ops.object.convert(target='MESH')
    for o in O:
        for md in list(o.modifiers):
            if md.type == 'PARTICLE_SYSTEM': o.modifiers.remove(md)
    for o in O:
        if o.type != 'MESH': continue
        bpy.ops.object.select_all(action='DESELECT'); o.select_set(True); bpy.context.view_layer.objects.active = o
        for md in list(o.modifiers):
            if md.type in ('SUBSURF', 'SOLIDIFY'):
                if md.type == 'SUBSURF': md.levels = 1
                bpy.ops.object.modifier_apply(modifier=md.name)
    ao = bake_ao([o for o in O if o.type == 'MESH'])
    rig = make_rig()
    body = O["Body"]
    mask = body.vertex_groups.get("furmask")
    dens = {v.index: next((g.weight for g in v.groups if g.group == mask.index), 1.0) for v in body.data.vertices} if mask else {}
    # body fur shortens where it would slice into the face, arms and legs and draw contour stripes
    near = [1.0] * len(body.data.vertices)
    for parts, floor, far in ((["Face"], 0.7, 0.4), (["LegR", "LegL"], 0.15, 0.16)):
        for i, k in enumerate(proximity(body, [O[n] for n in parts], far)):
            near[i] = min(near[i], floor + (1 - floor) * k)
    fur_attr(body, lambda v: dens.get(v.index, 1.0), 1.0, ao["Body"], near)
    for n in ("ArmR", "ArmL"): fur_attr(O[n], lambda v: 1.0, 0.8, ao[n])
    for n in ("LegR", "LegL"): fur_attr(O[n], lambda v: 1.0, 0.5, ao[n], proximity(O[n], [body]))
    fur_attr(O["Face"], lambda v: 0.0, 0.0, ao["Face"])

    def body_wt(c):
        h = smooth(1.06, 1.4, c.z)
        # skin over the shoulder follows the arm partway, so a raised arm stretches the armpit
        sx = 1 if c.x > 0 else -1
        a = arm_chain(sx)[0]
        k = 0.4 * smooth(0.36, 0.1, (c - a).length) * smooth(0.22, 0.42, abs(c.x)) * smooth(1.3, 1.1, c.z)
        return {"head": h * (1 - k), "spine": (1 - h) * (1 - k), "arm_" + ("R" if sx > 0 else "L"): k}
    skin(body, rig, body_wt)
    for sx, s in ((1, "R"), (-1, "L")):
        a, e, w = arm_chain(sx)
        def wt(c, a=a, e=e, w=w, s=s):
            # blend across the elbow so the sleeve bends instead of creasing
            d1 = (c - (a + (e - a)*seg_t(c, a, e))).length; d2 = (c - (e + (w - e)*seg_t(c, e, w))).length
            k = smooth(-0.12, 0.12, d1 - d2)
            # the root buried in the body stays with the spine, so the arm bends out of it
            r = 0.6 * smooth(0.3, 0.0, seg_t(c, a, e))
            return {"arm_" + s: (1 - k) * (1 - r), "hand_" + s: k * (1 - r), "spine": r}
        skin(O["Arm" + s], rig, wt)
        skin(O["Leg" + s], rig, lambda c, s=s: {"leg_" + s: 1.0})
    for n in ("Face", "EyeL", "EyeR", "GlintL", "GlintR", "Mouth", "Tongue", "LashL", "LashR"):
        o = O[n]; mw = o.matrix_world.copy()
        o.parent = rig; o.parent_type = 'BONE'; o.parent_bone = "head"
        o.matrix_world = mw
    for o in O:
        sub = o.modifiers.get("sub")
        if sub: sub.levels = 1
    bpy.ops.object.select_all(action='DESELECT')
    for o in O:
        if o.type in ('MESH', 'CURVE', 'ARMATURE'): o.select_set(True)
    bpy.ops.export_scene.gltf(filepath=OUT, use_selection=True, export_apply=True, export_skins=True,
                              export_attributes=True, export_vertex_color='NAME', export_vertex_color_name='fur',
                              export_animations=False, export_yup=True, export_texcoords=False,
                              export_morph=True, export_morph_normal=False, export_cameras=False, export_lights=False,
                              export_meshopt_compression_enable=True, export_meshopt_extension='EXT_meshopt_compression')
