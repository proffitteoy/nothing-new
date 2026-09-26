"""Original study assets. Blender 4.5 LTS: blender -b --python scripts/build-project-room.py

Units are metres; Blender Z is up. Export converts to glTF Y-up. The editable
source, baked colour/AO atlas, GLB and four composition renders share one scene.
No external model, photograph, screen capture or typeface is bundled.
"""

import bpy
import math
from pathlib import Path
from mathutils import Vector
from collections import defaultdict

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "public" / "projects-room"
SOURCE = ROOT / "design" / "projects-room"
OUT.mkdir(parents=True, exist_ok=True)
SOURCE.mkdir(parents=True, exist_ok=True)
bpy.ops.object.select_all(action="SELECT")
bpy.ops.object.delete(use_global=False)
groups = defaultdict(list)
current = "room"


def material(name, color, roughness=0.8):
    m = bpy.data.materials.new(name)
    m.diffuse_color = (*color, 1)
    m.use_nodes = True
    p = m.node_tree.nodes.get("Principled BSDF")
    p.inputs["Base Color"].default_value = (*color, 1)
    p.inputs["Roughness"].default_value = roughness
    return m


wood = material("Smoked walnut", (0.22, 0.105, 0.056))
oak = material("Honey oak", (0.49, 0.30, 0.16))
cream = material("Warm porcelain", (0.88, 0.85, 0.75))
paper = material("Uncoated paper", (0.96, 0.925, 0.82))
ink = material("Graphite", (0.038, 0.053, 0.064))
sage = material("Sage linen", (0.30, 0.40, 0.24))
sage_light = material("Soft moss", (0.44, 0.51, 0.34))
blue = material("Cornflower", (0.25, 0.39, 0.61))
blue_light = material("Screen blue", (0.54, 0.72, 0.82))
pink = material("Faded rose", (0.64, 0.38, 0.32))
wall = material("Chalk plaster", (0.77, 0.76, 0.66))
glass = material("Window daylight", (0.69, 0.82, 0.79))
gold = material("Brass", (0.64, 0.44, 0.20))

# Procedural grain and woven plaster are baked into the exported atlas.
for mat, scale, strength in [(wood, (2, 65, 4), .32), (oak, (3, 85, 6), .20),
                              (sage, (100, 100, 100), .13), (wall, (70, 70, 70), .07)]:
    n, l = mat.node_tree.nodes, mat.node_tree.links
    tex = n.new("ShaderNodeTexNoise")
    tex.inputs["Scale"].default_value = 1
    mapping = n.new("ShaderNodeVectorMath")
    mapping.operation = "MULTIPLY"
    mapping.inputs[1].default_value = scale
    coords = n.new("ShaderNodeTexCoord")
    l.new(coords.outputs["Generated"], mapping.inputs[0])
    l.new(mapping.outputs[0], tex.inputs["Vector"])
    mix = n.new("ShaderNodeMixRGB")
    mix.blend_type = "MULTIPLY"
    mix.inputs[0].default_value = strength
    mix.inputs[1].default_value = mat.diffuse_color
    l.new(tex.outputs["Fac"], mix.inputs[2])
    l.new(mix.outputs[0], n.get("Principled BSDF").inputs["Base Color"])


def finish(obj, name, mat):
    obj.name = name
    obj.data.materials.append(mat)
    groups[current].append(obj)
    return obj


def box(name, pos, size, mat, bevel=.025, rot=None):
    bpy.ops.mesh.primitive_cube_add(size=1, location=pos)
    o = bpy.context.object
    o.dimensions = size
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    if bevel:
        b = o.modifiers.new("Soft manufactured edges", "BEVEL")
        b.width, b.segments = bevel, 2
        bpy.ops.object.modifier_apply(modifier=b.name)
        o.modifiers.new("Weighted normals", "WEIGHTED_NORMAL")
        bpy.ops.object.modifier_apply(modifier="Weighted normals")
    if rot:
        o.rotation_euler = rot
    return finish(o, name, mat)


def cylinder(name, pos, radius, depth, mat, vertices=24, rot=None):
    bpy.ops.mesh.primitive_cylinder_add(vertices=vertices, radius=radius, depth=depth, location=pos)
    o = bpy.context.object
    if rot:
        o.rotation_euler = rot
    for p in o.data.polygons:
        p.use_smooth = True
    return finish(o, name, mat)


def ball(name, pos, radius, mat):
    bpy.ops.mesh.primitive_uv_sphere_add(segments=12, ring_count=8, radius=radius, location=pos)
    o = bpy.context.object
    for p in o.data.polygons:
        p.use_smooth = True
    return finish(o, name, mat)


def line(name, points, mat, radius=.009):
    curve = bpy.data.curves.new(name, "CURVE")
    curve.dimensions = "3D"
    curve.resolution_u = 8
    curve.bevel_depth, curve.bevel_resolution = radius, 2
    s = curve.splines.new("BEZIER")
    s.bezier_points.add(len(points)-1)
    for p, v in zip(s.bezier_points, points):
        p.co = v
        p.handle_left_type = p.handle_right_type = "AUTO"
    o = bpy.data.objects.new(name, curve)
    bpy.context.collection.objects.link(o)
    bpy.context.view_layer.objects.active = o
    o.select_set(True)
    bpy.ops.object.convert(target="MESH")
    o.select_set(False)
    return finish(o, name, mat)


def text(name, body, pos, size, mat, rot=(math.pi/2, 0, 0)):
    c = bpy.data.curves.new(name, "FONT")
    c.body, c.size, c.extrude = body, size, .0005
    o = bpy.data.objects.new(name, c)
    bpy.context.collection.objects.link(o)
    o.location, o.rotation_euler = pos, rot
    bpy.ops.object.select_all(action="DESELECT")
    o.select_set(True)
    bpy.context.view_layer.objects.active = o
    bpy.ops.object.convert(target="MESH")
    return finish(o, name, mat)


def anchor(name, pos):
    o = bpy.data.objects.new("anchor_" + name, None)
    bpy.context.collection.objects.link(o)
    o.location = pos


# Raised, open-top architectural section with individually removable walls.
box("Foundation", (0, 0, -.10), (5.35, 4.05, .20), cream, .08)
for i in range(16):
    box("Floorboard", (-2.47+i*.33, 0, .025), (.325, 3.86, .055), oak, .005)
box("Woven rug", (-.25, -.45, .072), (3.8, 2.6, .035), sage_light, .13)
for i in [-1, 1]:
    box("Rug stripe", (-.25, -.45+i*1.15, .095), (3.45, .018, .002), cream, 0)
current = "wall_back"
box("Rear wall lower", (0, 1.95, .64), (5.25, .13, 1.18), wall)
box("Rear wall upper", (0, 1.95, 2.95), (5.25, .13, .26), wall)
box("Rear wall right", (1.90, 1.95, 2), (1.4, .13, 1.65), wall)
box("Rear wall left", (-2.48, 1.95, 2), (.28, .13, 1.65), wall)
box("Window glass", (-.59, 1.99, 2.03), (3.55, .025, 1.55), glass, 0)
for x in [-2.38, -.6, 1.18]:
    box("Window frame", (x, 1.84, 2.02), (.06, .14, 1.65), cream, .006)
for z in [1.23, 2.83]:
    box("Window frame", (-.6, 1.84, z), (3.62, .16, .06), cream, .006)
box("Window sill", (-.6, 1.73, 1.20), (3.85, .43, .10), cream)
line("Curtain rail", [(-2.52, 1.66, 2.95), (1.45, 1.66, 2.95)], gold, .025)
# Continuous folded mesh rather than an array of cylinders.
for x0, width in [(-2.48, .50), (.20, 1.12)]:
    verts, faces = [], []
    segments = 48
    for iz in range(5):
        z = .68 + iz*.55
        for ix in range(segments+1):
            x = x0 + width*ix/segments
            y = 1.65 + .075*math.sin(ix/segments*math.pi*12) + .02*math.sin(iz)
            verts.append((x,y,z))
    for iz in range(4):
        for ix in range(segments):
            a = iz*(segments+1)+ix
            faces.append((a,a+1,a+segments+2,a+segments+1))
    mesh = bpy.data.meshes.new("Linen folds")
    mesh.from_pydata(verts, [], faces)
    o=bpy.data.objects.new("Green linen curtain",mesh)
    bpy.context.collection.objects.link(o)
    for p in mesh.polygons: p.use_smooth=True
    finish(o,o.name,sage)
current = "wall_left"
box("Left wall", (-2.64, .30, 1.40), (.12, 3.30, 2.72), wall)
box("Left skirting", (-2.54, .30, .19), (.075, 3.3, .19), cream)
current = "room"

# Workbench based on the supplied photograph.
box("Walnut desktop", (-.42, .60, 1.33), (3.42, 1.22, .11), wood, .045)
for x in [-1.94, 1.10]:
    for y in [.15, 1.03]:
        box("Steel desk leg", (x,y,.69), (.07,.07,1.24), ink, .008)
box("Desk rear brace", (-.42,1.06,.40), (3.12,.05,.075), ink, .006)
box("Laptop riser top", (-.34,.83,1.65), (1.04,.51,.055), ink)
for x in [-.78,.10]:
    box("Riser leg", (x,.85,1.50), (.045,.40,.29), ink, .008)

current = "iris"
box("Laptop base", (-.34,.65,1.706), (.94,.61,.04), cream, .018)
box("Laptop display back", (-.34,.92,2.02), (.95,.04,.63), ink, .025)
box("Laptop display", (-.34,.893,2.02), (.87,.008,.54), ink, .006)
text("Iris title", "I R I S  /  WORKSPACE", (-.73,.886,2.22), .045, cream)
for i in range(5):
    box("Iris sidebar", (-.70,.884,2.13-i*.073), (.085,.003,.022), blue_light, .003)
    box("Iris conversation", (-.22+.025*(i%2),.884,2.13-i*.073), (.52-.055*(i%3),.003,.026), blue if i%2 else sage_light, .003)
anchor("iris", (-.34,.90,2.38))

current = "topp"
box("Portrait foot", (.77,.74,1.414), (.44,.33,.045), ink)
box("Portrait stand", (.77,.88,1.70), (.065,.07,.56), ink)
box("Portrait display back", (.77,.81,1.94), (.55,.055,.91), ink)
box("Portrait display", (.77,.774,1.94), (.48,.008,.82), paper, .006)
text("Topp title", "TOPP", (.575,.767,2.265), .060, ink)
line("Diagram axes", [(.59,.764,1.72),(.59,.764,2.13),(.59,.764,1.72),(.97,.764,1.72)], ink, .004)
line("Diagram diagonal", [(.59,.763,1.72),(.97,.763,2.10)], sage, .003)
for x,z in [(.67,1.98),(.73,2.09),(.85,2.04),(.77,1.91),(.90,2.13),(.65,1.83)]:
    ball("Diagram point",(x,.755,z),.012,blue)
    line("Pairing",[(x,.758,z),(x+.04,.758,z+.02)],pink,.003)
for i in range(3): box("Topp reading",(.77,.762,1.61+i*.026),(.31-i*.03,.002,.009),sage,0)
anchor("topp", (.80,.78,2.47))

current = "competitions"
box("Landscape support",(-1.40,.61,1.48),(.06,.16,.24),ink)
box("Landscape display back",(-1.40,.49,1.73),(.85,.055,.51),ink)
box("Landscape display",(-1.40,.454,1.73),(.78,.008,.44),paper,.006)
text("Campus title","CAMPUS / 2026",(-1.75,.447,1.875),.042,ink)
for i in range(3):
    box("Campus card",(-1.66+i*.257,.444,1.70),(.214,.003,.17),[sage_light,blue_light,pink][i],.006)
    box("Campus caption",(-1.66+i*.257,.441,1.575),(.19,.002,.016),ink,.002)
anchor("competitions",(-1.42,.45,2.075))

current = "rumor"
for i in range(3):
    box("Manuscript sheet",(-.38+i*.015,-.015-i*.012,1.40+i*.008),(.64,.43,.009),paper,.005,rot=(0,0,.07-i*.045))
text("Manuscript heading","TOPOLOGY / FIELD NOTES",(-.63,.11,1.429),.032,ink,(0,0,0))
nodes=[(-.35,-.12),(-.49,-.02),(-.20,-.02),(-.56,.06),(-.44,.06),(-.24,.06),(-.12,.06)]
for a,b in [(0,1),(0,2),(1,3),(1,4),(2,5),(2,6)]:
    line("Propagation edge",[(nodes[a][0],nodes[a][1],1.432),(nodes[b][0],nodes[b][1],1.432)],ink,.003)
for x,y in nodes: cylinder("Propagation node",(x,y,1.435),.011,.004,blue,12)
anchor("rumor",(-.40,-.09,1.50))
current="room"
line("Pen",[(.045,-.18,1.421),(.115,.16,1.421)],ink,.009)
box("Keyboard tray",(-.47,.33,1.422),(1.20,.35,.055),cream,.025)
for row in range(4):
    for col in range(14):
        box("Keycap",(-1.012+col*.083,.213+row*.078,1.46),(.071,.062,.022),paper if col%5 else cream,.006)
box("Space key",(-.43,.185,1.462),(.37,.045,.023),paper,.006)
o=ball("Mouse",(.41,.30,1.43),.105,cream)
o.scale=(.68,1.12,.42)
line("Mouse seam",[(.41,.31,1.47),(.41,.375,1.469)],ink,.003)
for x in [-.40,.80,-1.40]:
    line("Braided cable",[(x,1.01,1.78),(x+.2,1.20,1.36),(x+.24,1.22,.76),(x+.11,1.08,.16)],ink,.008)

# Slim lamp and soft research chair.
cylinder("Lamp base",(-1.94,.94,1.42),.17,.028,cream)
line("Lamp upright",[(-1.94,.94,1.43),(-1.94,.94,2.39)],cream,.019)
box("Lamp bar",(-1.61,.94,2.40),(.69,.06,.045),cream,.02)
box("Lamp diffuser",(-1.61,.94,2.37),(.59,.045,.008),paper,.006)
cylinder("Chair base",(-.4,-.95,.23),.16,.18,ink)
for i in range(5):
    a=i*math.tau/5
    end=(-.4+math.cos(a)*.43,-.95+math.sin(a)*.43,.13)
    line("Chair foot",[(-.4,-.95,.26),end],ink,.025)
    ball("Castor",end,.055,ink)
cylinder("Chair stem",(-.4,-.95,.48),.034,.5,ink)
box("Chair cushion",(-.4,-.95,.75),(.70,.67,.13),sage,.10)
box("Chair back",(-.4,-1.23,1.10),(.65,.11,.56),sage,.12,rot=(.12,0,0))
for x in [-.74,-.06]:
    line("Chair arm",[(x,-1.05,.77),(x,-1.05,1.01),(x,-.70,1.01)],ink,.018)

# Low archive shelf; independently selectable contribution folders.
for x in [1.49,2.39]: box("Shelf side",(x,.29,.72),(.06,.87,1.30),wood)
for z in [.14,.70,1.34]: box("Shelf horizontal",(1.94,.29,z),(.95,.88,.06),wood)
box("Shelf back",(1.94,.70,.72),(.92,.045,1.26),wood)
current="gudhi"
box("Algorithm folio",(1.76,.13,.965),(.21,.48,.45),blue,.018)
box("Folio label",(1.76,-.115,1.00),(.155,.01,.23),paper,.004)
text("GUDHI spine","GUDHI",(1.693,-.123,1.02),.039,ink)
text("GUDHI subtitle","PATCHES",(1.691,-.123,.965),.023,ink)
anchor("gudhi",(1.75,-.19,1.20))
current="animeko"
box("Vision archive",(2.12,.15,.928),(.37,.47,.37),sage,.015)
box("Archive label",(2.12,-.092,.96),(.29,.012,.16),paper,.004)
text("Animeko label","ANIMEKO",(1.99,-.103,.985),.037,ink)
text("Animeko subtitle","VISION / CNN",(1.993,-.103,.928),.023,ink)
anchor("animeko",(2.14,-.18,1.15))
current="room"
for i,m in enumerate([cream,pink,blue,oak]):
    box("Reference book",(1.69+i*.16,.29,.415),(.12,.47,.43-i*.02),m,.008)

current="notes"
box("Notebook cover",(1.93,.31,1.407),(.64,.47,.025),blue,.009)
for i in [-1,1]:
    box("Notebook pages",(1.93+i*.155,.30,1.43),(.29,.42,.025),paper,.005)
    for j in range(6): box("Notebook lines",(1.93+i*.155,.16+j*.052,1.445),(.23,.004,.001),sage,0)
anchor("notes",(1.95,.24,1.52))
current="headphones"
for x in [-1.57,-1.20]:
    o=ball("Ear pad",(x,.035,1.468),.12,cream)
    o.scale=(.80,1,.50)
line("Headphone band",[(-1.59,.055,1.46),(-1.61,.16,1.68),(-1.40,.24,1.74),(-1.17,.16,1.68),(-1.18,.055,1.46)],cream,.030)
anchor("headphones",(-1.38,.06,1.80))
current="anime"
box("Picture frame",(-2.05,.44,1.64),(.39,.045,.46),oak,.012)
box("Picture ground",(-2.05,.411,1.64),(.33,.012,.40),blue,.002)
# Original tiny botanical illustration, no photograph or third-party art.
line("Illustration stem",[(-2.05,.402,1.50),(-2.09,.401,1.72),(-2.02,.400,1.80)],cream,.006)
for x,z in [(-2.14,1.62),(-2.03,1.68),(-2.14,1.74),(-2.0,1.77)]:
    o=ball("Illustration petals",(x,.393,z),.042,paper)
    o.scale=(1,.15,.48)
anchor("anime",(-2.07,.40,1.98))
current="room"
cylinder("Plant pot",(1.96,1.44,.29),.19,.37,cream)
for i in range(7):
    a=i*2.4
    x,y=1.96+math.cos(a)*.23,1.44+math.sin(a)*.18
    line("Plant stem",[(1.96,1.44,.38),(x,y,.77+(i%3)*.10)],sage,.01)
    o=ball("Plant leaf",(x,y,.77+(i%3)*.10),.12,sage_light if i%2 else sage)
    o.scale=(.48,1,.22)
    o.rotation_euler=(.3,i*.4,a)

# Consolidate by interaction group; keep modelling groups editable in the .blend.
meshes=[]
for name, objects in groups.items():
    bpy.ops.object.select_all(action="DESELECT")
    for o in objects: o.select_set(True)
    bpy.context.view_layer.objects.active=objects[0]
    bpy.ops.object.join()
    obj=bpy.context.object
    obj.name=name
    bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
    meshes.append(obj)

scene=bpy.context.scene
scene.render.engine="CYCLES"
scene.cycles.samples=12
scene.cycles.bake_type="DIFFUSE"
scene.render.bake.use_pass_direct=False
scene.render.bake.use_pass_indirect=False
scene.render.bake.use_pass_color=True
scene.render.bake.margin=8
bpy.ops.object.select_all(action="DESELECT")
for o in meshes: o.select_set(True)
bpy.context.view_layer.objects.active=meshes[0]
bpy.ops.object.mode_set(mode="EDIT")
bpy.ops.mesh.select_all(action="SELECT")
bpy.ops.uv.smart_project(angle_limit=1.15,island_margin=.008)
bpy.ops.object.mode_set(mode="OBJECT")
atlas=bpy.data.images.new("Study colour atlas",width=2048,height=2048)
ao=bpy.data.images.new("Study ambient occlusion",width=2048,height=2048)
for mat in list(bpy.data.materials):
    if not mat.use_nodes: continue
    node=mat.node_tree.nodes.new("ShaderNodeTexImage")
    node.name="Bake target"
    node.image=atlas
    mat.node_tree.nodes.active=node
print("Baking original colour atlas",flush=True)
bpy.ops.object.bake(type="DIFFUSE")
for mat in bpy.data.materials:
    if mat.use_nodes and mat.node_tree.nodes.get("Bake target"):
        mat.node_tree.nodes.get("Bake target").image=ao
print("Baking ambient occlusion",flush=True)
bpy.ops.object.bake(type="AO")
import numpy as np
colors=np.array(atlas.pixels[:],dtype=np.float32).reshape(-1,4)
occlusion=np.array(ao.pixels[:],dtype=np.float32).reshape(-1,4)
colors[:,:3]*=.55+.45*occlusion[:,:3]
atlas.pixels.foreach_set(colors.ravel())
atlas.filepath_raw=str(SOURCE/"study-atlas.png")
atlas.file_format="PNG"
atlas.save()
atlas.pack()
baked=material("Baked walnut, linen and paper",(1,1,1))
tex=baked.node_tree.nodes.new("ShaderNodeTexImage")
tex.image=atlas
baked.node_tree.links.new(tex.outputs["Color"],baked.node_tree.nodes.get("Principled BSDF").inputs["Base Color"])
for obj in meshes:
    obj.data.materials.clear()
    obj.data.materials.append(baked)
    for face in obj.data.polygons: face.material_index=0

# Export only the asset, with a single shared atlas and stable object names.
bpy.ops.object.select_all(action="DESELECT")
for o in bpy.context.scene.objects:
    if o.type in {"MESH","EMPTY"}: o.select_set(True)
bpy.ops.export_scene.gltf(filepath=str(OUT/"study.glb"),export_format="GLB",use_selection=True,export_yup=True,export_materials="EXPORT",export_extras=False)

def area(name,pos,power,color,size,target):
    d=bpy.data.lights.new(name,"AREA")
    d.energy,d.color,d.shape,d.size=power,color,"DISK",size
    o=bpy.data.objects.new(name,d)
    scene.collection.objects.link(o)
    o.location=pos
    o.rotation_euler=(Vector(target)-o.location).to_track_quat('-Z','Y').to_euler()
    return o

key=area("Window softbox",(-3,-2,7),650,(1,.89,.73),5,(0,0,0))
fill=area("Sky fill",(3,-1,5),400,(.77,.86,1),4,(0,0,1))
lamp=area("Desk lamp glow",(-1.60,.90,2.32),0,(1,.68,.33),.7,(-.5,.3,1.3))
cam_data=bpy.data.cameras.new("Composition camera")
cam=bpy.data.objects.new("Composition camera",cam_data)
scene.collection.objects.link(cam)
scene.camera=cam
cam_data.lens=45
cam.location=(-6.4,-9.3,6.5)
target=Vector((0,.10,1.22))
cam.rotation_euler=(target-cam.location).to_track_quat('-Z','Y').to_euler()
scene.world.color=(.3,.3,.3)
scene.render.engine="CYCLES"
scene.cycles.samples=32
scene.cycles.use_denoising=True
scene.render.film_transparent=True
scene.render.resolution_x=1440
scene.render.resolution_y=1100
scene.render.resolution_percentage=100
scene.view_settings.view_transform="AgX"
# The near wall is cut away, matching the runtime orbit rule.
bpy.data.objects["wall_left"].hide_render=True
bpy.context.preferences.filepaths.save_version = 0
bpy.ops.wm.save_as_mainfile(filepath=str(SOURCE/"study.blend"),compress=True)
for name,night,mobile,detail in [("day",False,False,False),("night",True,False,False),("detail",False,False,True),("mobile",False,True,False)]:
    key.data.energy=90 if night else 650
    key.data.color=(.53,.65,1) if night else (1,.89,.73)
    fill.data.energy=90 if night else 400
    lamp.data.energy=65 if night else 8
    scene.world.color=(.07,.08,.12) if night else (.3,.3,.3)
    scene.render.resolution_x=750 if mobile else 1440
    scene.render.resolution_y=1100
    cam.location=(-8.7,-12.6,9.0) if mobile else (-6.4,-9.3,6.5)
    cam_data.shift_x=.16 if detail else 0
    cam.rotation_euler=(target-cam.location).to_track_quat('-Z','Y').to_euler()
    scene.render.filepath=str(OUT/(name+".png"))
    bpy.ops.render.render(write_still=True)
print("Study source, baked GLB and four views complete",flush=True)
