import os, bpy, math as m
from mathutils import Euler, Matrix, Quaternion, Vector

FPS = 24
# web model frame (x right, y up, z toward viewer) to Blender (x right, -y toward viewer, z up)
C = Matrix(((1, 0, 0), (0, 0, -1), (0, 1, 0)))

def rig():
    return bpy.data.objects["Rig"]

def rot(pb, x=0, y=0, z=0, order='YXZ'):
    # offset given in the web model frame, measured from rest, same as pose() in Jolly.jsx
    r = C @ Euler((x, y, z), order).to_matrix() @ C.inverted()
    M = pb.bone.matrix_local.to_3x3()
    pb.rotation_quaternion = (M.inverted() @ r @ M).to_quaternion()

def move(pb, x=0, y=0, z=0):
    pb.location = pb.bone.matrix_local.to_3x3().inverted() @ (C @ Vector((x, y, z)))

def reach(o, side, target, pole):
    """Two-bone reach in pose space: the paw tip goes to `target` (web model frame), elbow bent toward `pole`."""
    arm, hand = o.pose.bones["arm_" + side], o.pose.bones["hand_" + side]
    t, pv = C @ Vector(target), C @ Vector(pole)
    s = arm.head.copy()
    l1, l2 = arm.length, hand.length
    d = min(max((t - s).length, abs(l1 - l2) + 1e-3), l1 + l2 - 1e-3)
    u = (t - s).normalized()
    ca = (l1 * l1 + d * d - l2 * l2) / (2 * l1 * d)
    up = (pv - u * pv.dot(u)).normalized()
    elbow = s + u * l1 * ca + up * l1 * m.sqrt(max(0, 1 - ca * ca))
    for pb, a, b in ((arm, s, elbow), (hand, None, s + u * d)):
        bpy.context.view_layer.update()
        a = pb.head.copy() if a is None else a
        q = (pb.tail - pb.head).rotation_difference(b - a)
        pb.matrix = Matrix.Translation(a) @ q.to_matrix().to_4x4() @ Matrix.Translation(-pb.head) @ pb.matrix
    bpy.context.view_layer.update()

LAST = {}
POLE = {'R': (1, -0.6, -0.3), 'L': (-1, -0.6, -0.3)}

def key(o, f, pose):
    """pose: {bone: dict(r=(x,y,z[,order]), t=(x,y,z), s=(sx,sy,sz)), 'ik': {side: (x,y,z) or ((x,y,z), pole)}}.
    Unlisted bones return to rest."""
    # posing with the action attached lets each view-layer update overwrite the pose from existing keys
    act = o.animation_data.action
    o.animation_data.action = None
    for pb in o.pose.bones:
        p = pose.get(pb.name, {})
        rot(pb, *p.get('r', (0, 0, 0)))
        move(pb, *p.get('t', (0, 0, 0)))
        pb.scale = p.get('s', (1, 1, 1))
    bpy.context.view_layer.update()
    for side, tgt in pose.get('ik', {}).items():
        tgt, pole = (tgt, POLE[side]) if isinstance(tgt[0], (int, float)) else tgt
        reach(o, side, tgt, pole)
    o.animation_data.action = act
    if act.slots: o.animation_data.action_slot = act.slots[0]
    for pb in o.pose.bones:
        # q and -q are the same turn, but keys must stay on one side or interpolation swings the long way
        last = LAST.get(pb.name)
        if last is not None and pb.rotation_quaternion.dot(last) < 0: pb.rotation_quaternion.negate()
        LAST[pb.name] = pb.rotation_quaternion.copy()
        for path in ('rotation_quaternion', 'location', 'scale'):
            pb.keyframe_insert(path, frame=f)

def action(name, poses, cyclic=False):
    o = rig()
    for pb in o.pose.bones: pb.rotation_mode = 'QUATERNION'
    old = bpy.data.actions.get(name)
    if old: bpy.data.actions.remove(old)
    o.animation_data_create()
    a = bpy.data.actions.new(name)
    o.animation_data.action = a
    LAST.clear()
    # keys start at frame 0: the exporter measures clips from 0, so a later start adds a held frame
    for f, p in poses: key(o, f - 1, p)
    a.use_fake_user = True
    a.use_frame_range = True
    a.frame_range = (poses[0][0] - 1, poses[-1][0] - 1)
    a.use_cyclic = cyclic
    o.animation_data.action = None
    return a

def mirror(p):
    out = {}
    for b, v in p.items():
        if b == 'ik':
            out[b] = {{'R': 'L', 'L': 'R'}[sd]: (((-t[0][0], *t[0][1:]), (-t[1][0], *t[1][1:])) if isinstance(t[0], tuple) else (-t[0], *t[1:])) for sd, t in v.items()}
            continue
        n = b[:-1] + {'R': 'L', 'L': 'R'}[b[-1]] if b[-2:] in ('_R', '_L') else b
        w = dict(v)
        if 'r' in v:
            x, y, z, *o = v['r']; w['r'] = (x, -y, -z, *o)
        if 't' in v:
            x, y, z = v['t']; w['t'] = (-x, y, z)
        out[n] = w
    return out

def run_cycle():
    # 12 frames = two strides at 24 fps. Keys: contact, down, pass, up; second half mirrored.
    contact = {
        'root': {'t': (0, 0.02, 0), 's': (1.0, 1.04, 1.0), 'r': (0, 0, 0.04)},
        'spine': {'r': (0.22, 0.06, 0)},
        'head': {'r': (-0.12, -0.04, 0.03)},
        'leg_R': {'r': (-1.0, 0, 0)},
        'leg_L': {'r': (0.85, 0, 0), 't': (0, 0.1, 0)},
        'arm_R': {'r': (0.9, 0, 0.25, 'XYZ')},
        'arm_L': {'r': (-1.0, 0, -0.25, 'XYZ')},
        'hand_R': {'r': (-0.5, 0, 0)},
        'hand_L': {'r': (-0.15, 0, 0)},
    }
    down = {
        'root': {'t': (0, -0.07, 0), 's': (1.07, 0.88, 1.07), 'r': (0, 0, 0.06)},
        'spine': {'r': (0.3, 0.04, 0)},
        'head': {'r': (-0.02, -0.02, 0.05)},
        'leg_R': {'r': (-0.3, 0, 0)},
        'leg_L': {'r': (0.25, 0, 0), 't': (0, 0.12, 0)},
        'arm_R': {'r': (0.55, 0, 0.32, 'XYZ')},
        'arm_L': {'r': (-0.6, 0, -0.32, 'XYZ')},
        'hand_R': {'r': (-0.3, 0, 0)},
        'hand_L': {'r': (-0.35, 0, 0)},
    }
    passing = {
        'root': {'t': (0, 0.12, 0), 's': (0.95, 1.1, 0.95), 'r': (0, 0, 0.02)},
        'spine': {'r': (0.2, 0, 0)},
        'head': {'r': (-0.16, 0, 0.0)},
        'leg_R': {'r': (0.25, 0, 0)},
        'leg_L': {'r': (-0.3, 0, 0), 't': (0, 0.24, 0)},
        'arm_R': {'r': (0.0, 0, 0.3, 'XYZ')},
        'arm_L': {'r': (0.0, 0, -0.3, 'XYZ')},
        'hand_R': {'r': (-0.2, 0, 0)},
        'hand_L': {'r': (-0.2, 0, 0)},
    }
    up = {
        'root': {'t': (0, 0.2, 0), 's': (0.97, 1.06, 0.97), 'r': (0, 0, -0.01)},
        'spine': {'r': (0.16, -0.03, 0)},
        'head': {'r': (-0.2, 0.02, -0.01)},
        'leg_R': {'r': (0.8, 0, 0), 't': (0, 0.1, 0)},
        'leg_L': {'r': (-0.85, 0, 0), 't': (0, 0.08, 0)},
        'arm_R': {'r': (-0.6, 0, 0.25, 'XYZ')},
        'arm_L': {'r': (0.65, 0, -0.25, 'XYZ')},
        'hand_R': {'r': (-0.1, 0, 0)},
        'hand_L': {'r': (-0.45, 0, 0)},
    }
    half = [contact, down, passing, up]
    keys = [(f, p) for f, p in zip((1, 2, 4, 5), half)]
    keys += [(f + 6, mirror(p)) for f, p in zip((1, 2, 4, 5), half)]
    keys.append((13, contact))
    return action('run', keys, cyclic=True)

def P(ik=None, **bones):
    out = {k: v if isinstance(v, dict) else {'r': v} for k, v in bones.items()}
    if ik: out['ik'] = ik
    return out

def root(t=(0, 0, 0), s=(1, 1, 1), r=(0, 0, 0)):
    return {'t': t, 's': s, 'r': r}

def squash(k, y=0):
    # volume-keeping squash from the feet: k > 0 squashes, k < 0 stretches
    return root(t=(0, y, 0), s=(1 + k * 0.6, 1 - k, 1 + k * 0.6))

REST = P()
# arms hanging relaxed, a touch out from the body
EASY = dict(arm_R=(0, 0, 0.08, 'XYZ'), arm_L=(0, 0, -0.08, 'XYZ'))

def arrive():
    # skid on the heels, rock forward past balance, wobble back and settle
    return action('arrive', [
        (1, P(root=root(t=(-0.08, -0.03, 0), s=(1.04, 0.94, 1.04), r=(-0.32, 0, 0)), spine=(-0.3, 0, 0), head=(0.14, 0, 0),
              leg_R=(-0.55, 0, 0), leg_L=(-0.45, 0, 0),
              arm_R=(-0.3, 0, 0.9, 'XYZ'), arm_L=(-0.3, 0, -0.9, 'XYZ'), hand_R=(-0.4, 0, 0), hand_L=(-0.4, 0, 0))),
        (6, P(root=root(t=(-0.14, -0.05, 0), s=(1.06, 0.9, 1.06), r=(-0.42, 0, 0.02)), spine=(-0.36, 0, 0.04), head=(0.2, 0, -0.04),
              leg_R=(-0.6, 0, 0), leg_L=(-0.5, 0, 0),
              arm_R=(-0.5, 0, 1.15, 'XYZ'), arm_L=(-0.5, 0, -1.1, 'XYZ'), hand_R=(-0.6, 0, 0), hand_L=(-0.6, 0, 0))),
        (11, P(root=squash(-0.05, 0.01), spine=(0.3, 0, 0), head=(-0.12, 0, 0),
               arm_R=(0.6, 0, 0.5, 'XYZ'), arm_L=(0.6, 0, -0.5, 'XYZ'), hand_R=(0.3, 0, 0), hand_L=(0.3, 0, 0))),
        (16, P(root=squash(0.03), spine=(-0.12, 0, -0.03), head=(0.08, 0, 0.04),
               arm_R=(-0.25, 0, 0.3, 'XYZ'), arm_L=(-0.25, 0, -0.3, 'XYZ'))),
        (21, P(root=squash(-0.01), spine=(0.06, 0, 0.02), head=(-0.04, 0, -0.02), **EASY)),
        (27, P(spine=(-0.02, 0, 0), **EASY)),
        (32, P(**EASY)),
    ])

def bounce():
    # happy bounce: crouch, spring up with arms thrown up, land soft, settle
    up = dict(arm_R=(-0.3, 0, 2.1, 'XYZ'), arm_L=(-0.3, 0, -2.1, 'XYZ'), hand_R=(-0.4, 0, 0), hand_L=(-0.4, 0, 0))
    return action('bounce', [
        (1, P(**EASY)),
        (5, P(root=squash(0.14, -0.02), spine=(0.12, 0, 0), head=(0.1, 0, 0),
              arm_R=(0.35, 0, 0.35, 'XYZ'), arm_L=(0.35, 0, -0.35, 'XYZ'))),
        (8, P(root=squash(-0.1, 0.16), spine=(-0.08, 0, 0), head=(-0.18, 0, 0), leg_R=(0.2, 0, 0), leg_L=(0.2, 0, 0), **up)),
        (11, P(root=squash(-0.03, 0.3), spine=(-0.05, 0, 0), head=(-0.2, 0, 0.05), leg_R=(0.35, 0, 0), leg_L=(0.35, 0, 0), **up)),
        (14, P(root=squash(-0.04, 0.12), head=(-0.1, 0, 0), arm_R=(-0.2, 0, 1.6, 'XYZ'), arm_L=(-0.2, 0, -1.6, 'XYZ'))),
        (16, P(root=squash(0.13, -0.01), spine=(0.1, 0, 0), head=(0.12, 0, 0),
               arm_R=(0.1, 0, 0.7, 'XYZ'), arm_L=(0.1, 0, -0.7, 'XYZ'))),
        (19, P(root=squash(-0.03), head=(-0.04, 0, 0), arm_R=(0, 0, 0.3, 'XYZ'), arm_L=(0, 0, -0.3, 'XYZ'))),
        (24, P(**EASY)),
    ])

def wave_keys():
    # right paw raised beside the face with the elbow low and out, swaying side to side
    def k(w):
        return P(root=root(r=(0, 0, -0.015 * w)), spine=(0, 0, -0.05), head=(0, 0.04, 0.1 + 0.03 * w),
                 ik={'R': ((0.66 + 0.08 * w, 1.74 + 0.03 * w, 0.46), (1, -0.5, -0.2))}, arm_L=(0, 0, -0.1, 'XYZ'))
    return [(1, k(-1)), (6, k(1)), (11, k(-1)), (16, k(1)), (21, k(-1))]

def wave():
    return action('wave', wave_keys(), cyclic=True)

def wave_l():
    return action('waveL', [(f, mirror(p)) for f, p in wave_keys()], cyclic=True)

def idle():
    # four-second breath with a slow weight shift; loops
    def k(b, s):
        return P(root=root(s=(1 + 0.006 * b, 1 + 0.012 * b, 1 + 0.006 * b), r=(0, 0, 0.025 * s)),
                 spine=(0.01 * b, 0, -0.02 * s), head=(-0.015 * b, 0.03 * s, 0.015 * s),
                 arm_R=(0, 0, 0.08 + 0.02 * b, 'XYZ'), arm_L=(0, 0, -0.08 - 0.02 * b, 'XYZ'),
                 leg_R={'t': (0, 0.02 * max(0, -s), 0)}, leg_L={'t': (0, 0.02 * max(0, s), 0)})
    return action('idle', [(1, k(-1, 0)), (25, k(1, 1)), (49, k(-1, 0)), (73, k(1, -1)), (97, k(-1, 0))], cyclic=True)

def think():
    # paw to the chin, head tilted, a slow tap; loops
    def k(tap, look):
        return P(ik={'R': (0.15, 1.36 + 0.03 * tap, 0.68)}, head=(-0.14, 0.1 * look, 0.2), spine=(0, 0.04 * look, 0.03),
                 arm_L=(0.15, 0, -0.15, 'XYZ'), hand_L=(-0.2, 0, 0))
    return action('think', [(1, k(0, -1)), (13, k(1, -0.6)), (19, k(0, 0)), (31, k(1, 0.4)), (49, k(0, 1)), (61, k(1, 0.6)),
                            (73, k(0, 0)), (85, k(1, -0.6)), (97, k(0, -1))], cyclic=True)

def shy():
    # head down and turned away, paws knotted at the belly, a bashful twist; loops
    def k(w):
        return P(ik={'R': ((0.08, 0.86, 0.66), (1, -0.2, 0.4)), 'L': ((-0.08, 0.86, 0.66), (-1, -0.2, 0.4))},
                 root=root(s=(1.03, 0.97, 1.03), r=(0, 0.12 * w, 0)), spine=(0.12, 0.08 * w, 0.03 * w), head=(0.34, -0.38 + 0.06 * w, 0.18))
    return action('shy', [(1, k(-1)), (25, k(1)), (49, k(-1))], cyclic=True)

def clap():
    # paws swing apart and smack together in front of the chest; loops at 2 claps per second
    o, c = 0.36, 0.055
    def k(gap, sq):
        return P(ik={'R': ((gap, 1.02, 0.66), (1, -0.4, -0.4)), 'L': ((-gap, 1.02, 0.66), (-1, -0.4, -0.4))},
                 root=squash(sq), head=(-0.08 - sq, 0, 0))
    return action('clap', [(1, k(c, 0.03)), (4, k(o * 0.8, -0.01)), (7, k(o, -0.02)), (10, k(o * 0.4, 0)), (13, k(c, 0.03))], cyclic=True)

def dance():
    # two-beat side step: bounce on each beat, arms pump alternately, head bobs against the body; loops
    def k(side, down):
        a, b = (1.5, 0.4) if side > 0 else (0.4, 1.5)
        return P(root=root(t=(0.06 * side, -0.05 * down + 0.08 * (1 - down), 0), s=(1 + 0.05 * down, 1 - 0.07 * down, 1 + 0.05 * down), r=(0, 0.15 * side, 0.1 * side)),
                 spine=(0.05 * down, 0, -0.08 * side), head=(0.06 * down, -0.1 * side, -0.14 * side),
                 arm_R=(-0.3, 0, a, 'XYZ'), arm_L=(-0.3, 0, -b, 'XYZ'), hand_R=(-0.5, 0, 0), hand_L=(-0.5, 0, 0),
                 leg_R={'r': (-0.35 * max(0, -side) * (1 - down), 0, 0), 't': (0, 0.08 * max(0, -side) * (1 - down), 0)},
                 leg_L={'r': (-0.35 * max(0, side) * (1 - down), 0, 0), 't': (0, 0.08 * max(0, side) * (1 - down), 0)})
    return action('dance', [(1, k(1, 1)), (7, k(1, 0)), (13, k(-1, 1)), (19, k(-1, 0)), (25, k(1, 1))], cyclic=True)

def yawn():
    # arms rise and reach back with the head thrown back, a long hold, then a slump
    up = P(root=squash(-0.06, 0.03), spine=(-0.16, 0, 0), head=(-0.4, 0, 0.05),
           arm_R=(0.4, 0, 2.3, 'XYZ'), arm_L=(0.4, 0, -2.3, 'XYZ'), hand_R=(0.3, 0, 0), hand_L=(0.3, 0, 0))
    return action('yawn', [
        (1, P(**EASY)),
        (10, P(root=squash(0.04), spine=(0.08, 0, 0), head=(0.1, 0, 0), arm_R=(0.1, 0, 0.6, 'XYZ'), arm_L=(0.1, 0, -0.6, 'XYZ'))),
        (24, up),
        (44, P(root=squash(-0.07, 0.03), spine=(-0.18, 0, 0.02), head=(-0.44, 0, 0.08),
               arm_R=(0.45, 0, 2.4, 'XYZ'), arm_L=(0.45, 0, -2.35, 'XYZ'), hand_R=(0.4, 0, 0), hand_L=(0.4, 0, 0))),
        (56, P(root=squash(0.05), spine=(0.12, 0, 0), head=(0.22, 0, 0), arm_R=(0, 0, 0.1, 'XYZ'), arm_L=(0, 0, -0.1, 'XYZ'))),
        (64, P(root=squash(0.02), spine=(0.05, 0, 0), head=(0.06, 0, 0), **EASY)),
        (72, P(**EASY)),
    ])

def sleepy():
    # dozing on his feet: the head sinks slowly, jerks up, sinks again; loops
    def k(h, s=0):
        return P(root=squash(0.03 + s), spine=(0.1 + 0.06 * h, 0, 0.02), head=(0.08 + 0.4 * h, 0, 0.06 * h),
                 arm_R=(0.05, 0, 0.02, 'XYZ'), arm_L=(0.05, 0, -0.02, 'XYZ'), hand_R=(0.1, 0, 0), hand_L=(0.1, 0, 0))
    return action('sleepy', [(1, k(0)), (40, k(0.85)), (46, k(1)), (49, k(-0.1, -0.03)), (54, k(0.05)), (72, k(0.3)), (96, k(0))], cyclic=True)

def sneeze():
    # ah... ah... (head rises in two catches) then choo: a snap forward with a squash, and recovery
    return action('sneeze', [
        (1, P(**EASY)),
        (8, P(root=squash(-0.03), spine=(-0.08, 0, 0), head=(-0.2, 0, 0), arm_R=(0.1, 0, 0.3, 'XYZ'), arm_L=(0.1, 0, -0.3, 'XYZ'))),
        (12, P(root=squash(-0.02), spine=(-0.06, 0, 0), head=(-0.16, 0, 0), arm_R=(0.1, 0, 0.3, 'XYZ'), arm_L=(0.1, 0, -0.3, 'XYZ'))),
        (20, P(root=squash(-0.06), spine=(-0.16, 0, 0), head=(-0.34, 0, 0.04), arm_R=(0.2, 0, 0.5, 'XYZ'), arm_L=(0.2, 0, -0.5, 'XYZ'))),
        (23, P(root=squash(0.12, -0.02), spine=(0.28, 0, 0), head=(0.28, 0, 0), arm_R=(-0.6, 0, 0.2, 'XYZ'), arm_L=(-0.6, 0, -0.2, 'XYZ'),
               hand_R=(-0.4, 0, 0), hand_L=(-0.4, 0, 0))),
        (28, P(root=squash(0.04), spine=(0.12, 0, 0), head=(0.14, 0, -0.08))),
        (34, P(root=squash(-0.01), head=(0, 0, -0.04), **EASY)),
        (40, P(**EASY)),
    ])

def surprised():
    # a startled hop: a tiny dip, straight up with arms flung wide, legs tucked, a hard landing that settles
    wide = dict(arm_R=(-0.2, 0, 2.0, 'XYZ'), arm_L=(-0.2, 0, -2.0, 'XYZ'), hand_R=(0.4, 0, 0), hand_L=(0.4, 0, 0))
    return action('surprised', [
        (1, P(**EASY)),
        (3, P(root=squash(0.08), head=(0.08, 0, 0))),
        (6, P(root=squash(-0.12, 0.26), spine=(-0.1, 0, 0), head=(-0.22, 0, 0), leg_R=(0.5, 0, 0), leg_L=(0.5, 0, 0), **wide)),
        (9, P(root=squash(-0.04, 0.34), spine=(-0.08, 0, 0), head=(-0.2, 0, 0), leg_R=(0.6, 0, 0), leg_L=(0.6, 0, 0), **wide)),
        (13, P(root=squash(0.0, 0.08), head=(-0.1, 0, 0), arm_R=(-0.1, 0, 1.4, 'XYZ'), arm_L=(-0.1, 0, -1.4, 'XYZ'))),
        (15, P(root=squash(0.15, -0.01), spine=(0.1, 0, 0), head=(0.1, 0, 0), arm_R=(0, 0, 0.8, 'XYZ'), arm_L=(0, 0, -0.8, 'XYZ'))),
        (19, P(root=squash(-0.03), arm_R=(0, 0, 0.5, 'XYZ'), arm_L=(0, 0, -0.5, 'XYZ'))),
        (26, P(**EASY)),
    ])

def peekaboo():
    # paws cover the eyes, a hold with a little giggle wiggle, then they fling open: boo!
    eyes = lambda w=0: {'R': ((0.24, 1.71 + 0.01 * w, 0.66), (1, -0.5, 0.2)), 'L': ((-0.24, 1.71 - 0.01 * w, 0.66), (-1, -0.5, 0.2))}
    return action('peekaboo', [
        (1, P(**EASY)),
        (9, P(ik=eyes(), head=(0.16, 0, 0), spine=(0.06, 0, 0), root=squash(0.03))),
        (17, P(ik=eyes(1), head=(0.18, 0.05, 0.05), spine=(0.06, 0, 0.03), root=squash(0.04))),
        (25, P(ik=eyes(-1), head=(0.18, -0.05, -0.05), spine=(0.06, 0, -0.03), root=squash(0.04))),
        (33, P(ik=eyes(), head=(0.2, 0, 0), spine=(0.08, 0, 0), root=squash(0.06))),
        (37, P(root=squash(-0.1, 0.1), spine=(-0.12, 0, 0), head=(-0.2, 0, 0),
               arm_R=(-0.4, 0, 1.6, 'XYZ'), arm_L=(-0.4, 0, -1.6, 'XYZ'), hand_R=(0.4, 0, 0), hand_L=(0.4, 0, 0))),
        (41, P(root=squash(0.06), spine=(-0.04, 0, 0), head=(-0.08, 0, 0),
               arm_R=(-0.3, 0, 1.3, 'XYZ'), arm_L=(-0.3, 0, -1.3, 'XYZ'), hand_R=(0.2, 0, 0), hand_L=(0.2, 0, 0))),
        (52, P(head=(-0.04, 0, 0.06), arm_R=(-0.1, 0, 0.5, 'XYZ'), arm_L=(-0.1, 0, -0.5, 'XYZ'))),
        (60, P(**EASY)),
    ])

def heart():
    # paws meet over the chest in a heart, elbows out, a sway side to side; held then released
    hh = lambda w=0: {'R': ((0.09, 1.3, 0.74), (1, 0.3, 0.2)), 'L': ((-0.09, 1.3, 0.74), (-1, 0.3, 0.2))}
    return action('heart', [
        (1, P(**EASY)),
        (10, P(ik=hh(), head=(0.04, 0, 0.14), spine=(0.06, 0, 0.04), root=squash(0.03))),
        (22, P(ik=hh(), head=(0.04, 0.05, -0.14), spine=(0.06, 0, -0.04), root=root(r=(0, 0, -0.04)))),
        (34, P(ik=hh(), head=(0.04, -0.05, 0.14), spine=(0.06, 0, 0.04), root=root(r=(0, 0, 0.04)))),
        (46, P(ik=hh(), head=(0.04, 0, 0.1), spine=(0.06, 0, 0.02))),
        (56, P(**EASY)),
    ])

def stretch():
    # up on the toes with both arms straight up, a lean each way, then a long relaxing exhale
    up = lambda lean: P(root=root(t=(0, 0.06, 0), s=(0.95, 1.09, 0.95), r=(0, 0, 0.1 * lean)),
                        spine=(-0.08, 0, 0.22 * lean), head=(-0.2, 0, 0.12 * lean),
                        arm_R=(-0.3, 0, 2.35, 'XYZ'), arm_L=(-0.3, 0, -2.35, 'XYZ'), hand_R=(-0.3, 0, 0), hand_L=(-0.3, 0, 0))
    return action('stretch', [
        (1, P(**EASY)),
        (8, P(root=squash(0.05), arm_R=(0.2, 0, 0.5, 'XYZ'), arm_L=(0.2, 0, -0.5, 'XYZ'))),
        (20, up(0)), (34, up(1)), (50, up(-1)), (60, up(0)),
        (70, P(root=squash(0.06), spine=(0.14, 0, 0), head=(0.16, 0, 0), arm_R=(0.05, 0, 0.15, 'XYZ'), arm_L=(0.05, 0, -0.15, 'XYZ'))),
        (80, P(**EASY)),
    ])

def spin():
    # a quick twirl on the spot with arms out, a small hop and a dizzy wobble after
    out = dict(arm_R=(-0.2, 0, 1.5, 'XYZ'), arm_L=(-0.2, 0, -1.5, 'XYZ'), hand_R=(-0.2, 0, 0), hand_L=(-0.2, 0, 0))
    k = lambda a, y, sq=0: P(root=root(t=(0, y, 0), s=(1 + sq * 0.6, 1 - sq, 1 + sq * 0.6), r=(0, a, 0)), head=(-0.05, 0, 0), **out)
    return action('spin', [
        (1, P(**EASY)),
        (4, P(root=squash(0.1, -0.02), spine=(0.06, 0, 0), arm_R=(0, 0, 0.8, 'XYZ'), arm_L=(0, 0, -0.8, 'XYZ'))),
        (7, k(m.pi / 2, 0.12, -0.03)),
        (10, k(m.pi, 0.18, -0.05)),
        (13, k(1.5 * m.pi, 0.12, -0.03)),
        (16, k(2 * m.pi, 0.0, 0.1)),
        (20, P(root=root(r=(0, 0, 0.06)), head=(0, 0, -0.1), arm_R=(0, 0, 0.7, 'XYZ'), arm_L=(0, 0, -0.7, 'XYZ'))),
        (24, P(root=root(r=(0, 0, -0.04)), head=(0, 0, 0.06), **EASY)),
        (28, P(**EASY)),
    ])

def bow():
    # a polite bow with a paw over the heart, a hold, then up with a bounce
    down = P(root=root(r=(0.42, 0, 0)), spine=(0.55, 0, 0), head=(0.35, 0, 0), ik={'R': ((0.18, 1.08, 0.55), (1, -0.3, -0.3))},
             arm_L=(0.5, 0, -0.3, 'XYZ'), hand_L=(-0.3, 0, 0))
    return action('bow', [
        (1, P(**EASY)),
        (9, P(root=squash(0.04), spine=(-0.06, 0, 0), head=(-0.1, 0, 0), ik={'R': ((0.18, 1.08, 0.55), (1, -0.3, -0.3))}, arm_L=(0.2, 0, -0.2, 'XYZ'))),
        (19, down),
        (31, down),
        (38, P(root=squash(-0.06, 0.06), spine=(-0.1, 0, 0), head=(-0.18, 0, 0), arm_R=(-0.2, 0, 0.6, 'XYZ'), arm_L=(-0.2, 0, -0.6, 'XYZ'))),
        (44, P(root=squash(0.03), **EASY)),
        (49, P(**EASY)),
    ])

def laugh():
    # belly laugh: paws on the belly, head thrown back, the whole body bouncing
    ik = {'R': ((0.3, 0.9, 0.74), (1, -0.4, 0.2)), 'L': ((-0.3, 0.9, 0.74), (-1, -0.4, 0.2))}
    a = lambda: P(ik=ik, root=squash(0.06, -0.01), spine=(-0.12, 0, 0.05), head=(-0.32, 0, 0.1))
    b = lambda: P(ik=ik, root=squash(-0.03, 0.03), spine=(-0.06, 0, -0.05), head=(-0.2, 0, -0.1))
    keys = [(1, P(**EASY)), (5, a())]
    f = 8
    for i in range(12):
        keys.append((f, b() if i % 2 == 0 else a())); f += 3
    keys += [(f + 1, P(ik=ik, root=squash(0.02), head=(-0.1, 0, 0))), (f + 8, P(**EASY))]
    return action('laugh', keys)

CLIPS = [run_cycle, arrive, bounce, wave, wave_l, idle, think, shy, clap, dance, yawn, sleepy, sneeze, surprised, peekaboo, heart, stretch, spin, bow, laugh]

def build_all():
    bpy.context.scene.render.fps = FPS
    return [c() for c in CLIPS]

OUT = os.path.normpath(os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..", "public", "jolly.glb"))

def export():
    o = rig()
    if o.animation_data: o.animation_data.action = None
    for pb in o.pose.bones:
        pb.rotation_quaternion = (1, 0, 0, 0); pb.location = (0, 0, 0); pb.scale = (1, 1, 1)
    bpy.ops.object.select_all(action='DESELECT')
    for x in bpy.data.objects:
        if x.type in ('MESH', 'ARMATURE') and x.name != "SideCam": x.select_set(True)
    bpy.ops.export_scene.gltf(filepath=OUT, use_selection=True, export_apply=True, export_skins=True,
                              export_attributes=True, export_vertex_color='NAME', export_vertex_color_name='fur',
                              export_animations=True, export_animation_mode='ACTIONS', export_anim_single_armature=True,
                              export_bake_animation=False, export_force_sampling=True, export_optimize_animation_size=True,
                              export_yup=True, export_texcoords=False, export_morph=True, export_morph_normal=False,
                              export_cameras=False, export_lights=False,
                              export_meshopt_compression_enable=True, export_meshopt_extension='EXT_meshopt_compression')
