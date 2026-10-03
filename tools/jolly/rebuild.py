"""Rebuilds public/jolly.glb from scratch. Run inside Blender 5.x (Scripting tab, or the Blender MCP):

    import sys; sys.path.insert(0, r"<path to this folder>"); import rebuild; rebuild.run()
"""
import importlib, os, sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import bpy
import jolly_anim, jolly_build, jolly_export, jolly_face


def run(save=True):
    for mod in (jolly_build, jolly_face, jolly_export, jolly_anim):
        importlib.reload(mod)
    jolly_build.build()
    jolly_face.build()
    jolly_export.run()
    jolly_anim.build_all()
    jolly_anim.export()
    if save:
        bpy.ops.wm.save_mainfile()
