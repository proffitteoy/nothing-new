"""Original full-scale study. Blender 4.5 LTS: blender -b --python scripts/build-project-room.py

Metres, Z-up. Editable geometry and procedural materials remain in study.blend.
Two Cycles diffuse-light bakes carry window/lamp shadows and bounced light into
an unlit GLB; no continuous shadow maps or post-processing are needed at runtime.
"""
import bpy
import math
import random
import numpy as np
import json
import os
from pathlib import Path
from mathutils import Vector, Matrix
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
random.seed(24)
details = json.loads((SOURCE / "study-details.json").read_text(encoding="utf-8"))
detail_ids = list(details["surfaces"])
detail_image = bpy.data.images.load(str(SOURCE / "study-details.png"))
detail_image.pack()


def stabilize_key_lighting(pixels):
    # A key legend can occupy less than one bake texel. Pool the separate
    # keyboards' receiver samples rather than turning UV padding into dark keys.
    artwork=np.array(detail_image.pixels[:],dtype=np.float32).reshape(4096,4096,4)
    for laptop in [False,True]:
        keys=[key for key in details["keys"] if key["laptop"]==laptop]
        samples=[]
        for key in keys:
            x,y,w,h=details["surfaces"][key["surface"]]
            source=artwork[4096-y-h:4096-y,x:x+w,:3]
            tile=pixels[4096-y-h:4096-y,x:x+w,:3]
            mask=source.min(axis=2)>.12
            if np.any(mask):
                light=tile[mask]/np.maximum(source[mask]*(1-.32*tile[mask]),1e-5)
                samples.append(np.median(light,axis=0))
        lighting=np.quantile(samples,.85,axis=0)
        for key in keys:
            x,y,w,h=details["surfaces"][key["surface"]]
            rgb=artwork[4096-y-h:4096-y,x:x+w,:3]*lighting
            tile=pixels[4096-y-h:4096-y,x:x+w,:3]
            tile[:]=rgb/(1+.32*rgb)
            # Tiny palette pads sit below the legend UV region. Key skirts use
            # these pooled, directional tones instead of subpixel bake islands.
            colour=np.median(tile[8:20,32:48],axis=(0,1))
            for index,shade in enumerate([.40,.62,.84,1.]):
                tile[0:8,index*16:(index+1)*16]=colour*shade


def material(name, color, roughness=.6):
    m = bpy.data.materials.new(name)
    m.diffuse_color = (*color, 1)
    m.use_nodes = True
    p = m.node_tree.nodes.get("Principled BSDF")
    p.inputs["Base Color"].default_value = (*color, 1)
    p.inputs["Roughness"].default_value = roughness
    return m


wood = material("Oiled walnut", (.115, .064, .033), .38)
oak = material("Natural oak floor", (.38, .29, .20), .62)
cream = material("Powder coated warm white", (.72, .72, .69), .45)
paper = material("Off-white paper", (.82, .82, .76), .87)
ink = material("Charcoal anodized aluminium", (.019, .023, .028), .36)
rubber = material("Black rubber and mesh", (.014, .016, .019), .86)
blue = material("Indigo cloth", (.10, .15, .25), .76)
blue_light = material("Cool screen white", (.45, .63, .76), .48)
pink = material("Muted terracotta", (.38, .17, .105), .68)
wall = material("Mineral white plaster", (.68, .67, .62), .91)
glass = material("Overcast blue outside", (.59, .72, .79), .7)
gold = material("Brushed champagne metal", (.32, .27, .18), .35)
graphite = material("Whiteboard marker", (.06, .085, .12), .8)
screen_white = material("LCD white", (.52, .59, .64), .45)
screen_dark = material("LCD charcoal", (.008, .014, .023), .45)

key_ivory = material("Warm ivory PBT", (.761, .738, .651), .72)
key_dark = material("Laptop key ABS", (.0144, .0212, .0296), .68)
page_edge = material("Uncoated page edges", (.70, .675, .59), .93)
# Fine page strata are colour variation, not thousands of extra mesh slivers.
n, l = page_edge.node_tree.nodes, page_edge.node_tree.links
wave = n.new("ShaderNodeTexWave")
wave.wave_type, wave.bands_direction = "BANDS", "Z"
wave.inputs["Scale"].default_value = 350
wave.inputs["Distortion"].default_value = 1.2
mix = n.new("ShaderNodeMixRGB")
mix.inputs[1].default_value = (.57, .55, .48, 1)
mix.inputs[2].default_value = (.78, .75, .66, 1)
l.new(wave.outputs["Color"], mix.inputs[0])
l.new(mix.outputs[0], n.get("Principled BSDF").inputs["Base Color"])

def detail_material(name, emission=False):
    mat = material(name, (1, 1, 1), .65)
    nodes, links = mat.node_tree.nodes, mat.node_tree.links
    uv = nodes.new("ShaderNodeUVMap")
    uv.uv_map = "DetailUV"
    tex = nodes.new("ShaderNodeTexImage")
    tex.name = "Original printed artwork"
    tex.image = detail_image
    links.new(uv.outputs["UV"], tex.inputs["Vector"])
    output = nodes.get("Material Output")
    if emission:
        links.new(tex.outputs["Color"], output.inputs["Surface"])
    else:
        links.new(tex.outputs["Color"], nodes.get("Principled BSDF").inputs["Base Color"])
    return mat

printed = detail_material("Printed type and bookcloth")
lcd = detail_material("LCD pixels", True)

# Subtle grain follows real metre coordinates; no coarse speckled plaster.
for mat, scale, strength in [(wood, (2, 95, 5), .42), (oak, (3, 100, 6), .19),
                              (wall, (130, 130, 130), .022), (blue, (240,240,240), .05)]:
    n, l = mat.node_tree.nodes, mat.node_tree.links
    tex = n.new("ShaderNodeTexNoise")
    tex.inputs["Scale"].default_value = 1
    tex.inputs["Detail"].default_value = 3
    mapping = n.new("ShaderNodeVectorMath")
    mapping.operation = "MULTIPLY"
    mapping.inputs[1].default_value = scale
    coords = n.new("ShaderNodeTexCoord")
    l.new(coords.outputs["Object"], mapping.inputs[0])
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


def box(name, pos, size, mat, bevel=.003, rot=None):
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
    curve.resolution_u = 5
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
    c.body, c.size, c.extrude = body, size, 0
    c.resolution_u = 3
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


def detail_plane(name, pos, size, surface, display=False, rot=(math.pi/2, 0, 0)):
    w, h = size
    mesh = bpy.data.meshes.new(name)
    mesh.from_pydata([(-w/2,-h/2,0),(w/2,-h/2,0),(w/2,h/2,0),(-w/2,h/2,0)], [], [(0,1,2,3)])
    uv = mesh.uv_layers.new(name="DetailUV")
    x,y,pw,ph = details["surfaces"][surface]
    if surface.startswith("key-"): ph=56
    for loop,coord in zip(uv.data,[(x/4096,1-(y+ph)/4096),((x+pw)/4096,1-(y+ph)/4096),((x+pw)/4096,1-y/4096),(x/4096,1-y/4096)]):
        loop.uv = coord
    mesh.attributes.new("detail_surface", "INT", "FACE").data[0].value = detail_ids.index(surface)+1
    obj = bpy.data.objects.new(name, mesh)
    bpy.context.collection.objects.link(obj)
    obj.location, obj.rotation_euler = pos, rot
    return finish(obj, name, lcd if display else printed)


def transform_objects(objects, pivot, degrees, axis="Z"):
    centre = Vector(pivot)
    transform = Matrix.Translation(centre) @ Matrix.Rotation(math.radians(degrees), 4, axis) @ Matrix.Translation(-centre)
    bpy.context.view_layer.update()
    for obj in objects:
        obj.matrix_world = transform @ obj.matrix_world


def keycap(name, pos, width, depth, height, mat, surface):
    # Tapered skirts, rounded shoulders and a shallow dished top at 19.05 mm pitch.
    x,y,z = pos
    rings = [(width/2,depth/2,0), (width/2,depth/2,height*.32),
             (width/2-.0018,depth/2-.0018,height),
             (width/2-.003,depth/2-.003,height-.00055)]
    verts = [(x+sx*w,y+sy*d,z+h) for w,d,h in rings for sx,sy in [(-1,-1),(1,-1),(1,1),(-1,1)]]
    faces = [(3,2,1,0)]
    for ring in range(3):
        for side in range(4):
            a,b = ring*4+side,ring*4+(side+1)%4
            faces.append((a,b,b+4,a+4))
    faces.append((12,13,14,15))
    mesh = bpy.data.meshes.new(name)
    mesh.from_pydata(verts,[],faces)
    uv=mesh.uv_layers.new(name="DetailUV")
    attr=mesh.attributes.new("detail_surface","INT","FACE")
    tx,ty,tw,th=details["surfaces"][surface]
    for face in mesh.polygons:
        attr.data[face.index].value=detail_ids.index(surface)+1
        tone=0 if face.index<5 else 1 if face.index<9 else 2 if face.index<13 else 3
        for i in face.loop_indices:
            uv.data[i].uv=((tx+tone*16+8)/4096,1-(ty+60)/4096)
    obj = bpy.data.objects.new(name,mesh)
    bpy.context.collection.objects.link(obj)
    finish(obj,name,mat)
    patch = min(depth-.006, width-.006)
    detail_plane(name+" legend", (x-width/2+.003+patch/2,y,z+height-.00050), (patch,patch), surface, rot=(0,0,0))


def volume(index, pos, thickness=.035, depth=.225, height=.27, angle=0, lean=0, stacked=False):
    item = details["books"][index]
    color = tuple(((int(item["color"][i:i+2],16)/255+.055)/1.055)**2.4 for i in [1,3,5])
    cloth = material(item["title"]+" bookcloth", color, .82)
    start = len(groups[current])
    # Local book origin is the centre of its lower edge; spine faces -Y.
    for side in [-1,1]:
        box(item["title"]+" cover",(side*(thickness/2-.0012),0,height/2),(.0024,depth,height),cloth,.0007)
    box(item["title"]+" recessed page block",(0,.003,height/2),(thickness-.006,depth-.012,height-.008),page_edge,.001)
    box(item["title"]+" bound spine",(0,-depth/2+.003,height/2),(thickness,.006,height),cloth,.002)
    detail_plane(item["title"]+" spine title",(0,-depth/2-.00005,height/2),(thickness-.001,height-.002),item["id"])
    # Small grooves where the covers hinge; endpaper remains visible from above.
    for side in [-1,1]:
        box("Spine hinge",(side*(thickness/2-.002),-depth/2-.00015,height/2),(.00055,.0003,height-.009),cloth,0)
    objects = groups[current][start:]
    rotation = Matrix.Rotation(math.radians(angle),4,"Z") @ Matrix.Rotation(math.radians(90 if stacked else lean),4,"Y")
    if stacked:
        # Lay the closed book on its cover, with its bottom no lower than pos.z.
        offset = Vector(pos)+Vector((0,0,thickness/2))-rotation @ Vector((0,0,height/2))
    else:
        offset = Vector((pos[0],pos[1],pos[2]+abs(math.sin(math.radians(lean)))*thickness/2))
    bpy.context.view_layer.update()
    for obj in objects:
        obj.matrix_world = Matrix.Translation(offset) @ rotation @ obj.matrix_world


def monitor(name, pos, width, height, surface, tilt):
    x,y,z = pos
    start = len(groups[current])
    box(name+" thin front bezel",(x,y,z),(width,.013,height),ink,.002)
    box(name+" tapered rear housing",(x,y+.011,z),(width-.032,.023,height-.032),ink,.009)
    box(name+" rear centre enclosure",(x,y+.027,z-.022),(width*.54,.018,height*.65),ink,.006)
    detail_plane(name+" LCD",(x,y-.0071,z+.002),(width-.013,height-.022),surface,True)
    box(name+" lower chin",(x,y-.0073,z-height/2+.005),(width-.008,.0014,.007),ink,.001)
    cylinder(name+" power indicator",(x+width/2-.018,y-.0084,z-height/2+.006),.0011,.0005,blue_light,8,(math.pi/2,0,0))
    box(name+" rear VESA plate",(x,y+.043,z-.015),(.08,.011,.08),ink,.003)
    cylinder(name+" tilt hinge",(x,y+.045,z-.022),.019,.085,ink,16,(0,math.pi/2,0))
    for i in range(12):
        box(name+" rear cooling slot",(x-.084+i*.015,y+.037,z+height*.24),(.008,.001,.016),rubber,.001)
    for i in range(3):
        box(name+" rear connector",(x-.031+i*.025,y+.041,z-height*.26),(.018,.004,.007),rubber,.001)
    transform_objects(groups[current][start:],(x,y,z),tilt,"X")


# Full-size interior; floor has no raised display plinth or rounded carpet.
for i in range(18):
    box("Oak plank", (-2.125+i*.25, -.15, -.022), (.248, 4.5, .04), oak, .001)
current = "wall_back"
# Broad continuous wall, with a real window opening above the left-hand monitor.
box("Back wall lower", (0, 1.65, .64), (7, .12, 1.28), wall, .002)
box("Back wall upper", (0, 1.65, 2.90), (7, .12, .70), wall, .002)
box("Back wall left", (-2.60, 1.65, 1.92), (1.80, .12, 1.28), wall, .002)
box("Back wall right", (1.55, 1.65, 1.92), (3.90, .12, 1.28), wall, .002)
for x in [-1.70, -.99, -.28]:
    box("Rear window mullion", (x,1.64,1.92), (.025,.06,1.30), ink, .001)
for z in [1.28,2.56]:
    box("Rear window rail", (-.99,1.64,z), (1.44,.06,.025), ink, .001)
box("Rear window sill", (-.99,1.57,1.267), (1.54,.26,.025), cream, .002)
box("Rear window sky", (-.99,1.77,1.92), (1.4,.005,1.26), glass, 0)
box("Back skirting", (0, 1.572, .055), (7, .03, .11), cream, .001)
current = "wall_left"
box("Window wall lower", (-2.22, -.1, .43), (.12, 3.5, .86), wall, .002)
box("Window wall upper", (-2.22, -.1, 2.9), (.12, 3.5, .2), wall, .002)
for y in [-1.72, 1.52]:
    box("Window wall return", (-2.22, y, 1.83), (.12, .26, 1.94), wall, .002)
for y in [-1.55, -.12, 1.34]:
    box("Window mullion", (-2.20, y, 1.8), (.065, .045, 1.86), ink, .002)
for z in [.88, 2.72]:
    box("Window horizontal frame", (-2.20, -.1, z), (.07, 2.96, .055), ink, .002)
box("Window sill", (-2.10, -.1, .86), (.31, 3.03, .035), cream, .002)
# Exterior glazing is outside the light opening, avoiding a solid wall in the bake.
box("Distant sky", (-2.36, -.1, 1.8), (.008, 2.93, 1.78), glass, 0)
current="room"

# A 2.05 m desk, 74 cm high, thin walnut surface and steel frame.
box("Walnut desktop", (-.22, .50, .722), (2.05, .83, .036), wood, .006)
for x in [-1.16, .70]:
    for y in [.16, .84]:
        box("Steel desk leg", (x,y,.35), (.032,.032,.70), ink, .002)
        box("Adjustable rubber foot", (x,y,.013), (.039,.039,.026), rubber, .002)
box("Underdesk cable tray", (-.15,.80,.645), (1.32,.12,.045), ink, .003)
box("Desk rear brace", (-.22,.82,.665), (1.87,.028,.035), ink, .002)
box("Felt desk mat", (-.12,.39,.744), (1.05,.46,.004), rubber, .005)
box("Laptop riser top", (-.12,.65,.892), (.39,.28,.014), ink, .004)
for x in [-.285,.045]:
    box("Riser leg", (x,.69,.823), (.012,.20,.132), ink, .002)

current="iris"
box("Laptop aluminium base", (-.12,.53,.912), (.355,.247,.014), cream, .004)
panel_start=len(groups[current])
box("Laptop display back",(-.12,.667,1.047),(.356,.009,.237),ink,.003)
detail_plane("Iris workspace LCD",(-.12,.6618,1.048),(.338,.211),"iris",True)
cylinder("Laptop webcam",(-.12,.6614,1.160),.0018,.0005,rubber,10,(math.pi/2,0,0))
transform_objects(groups[current][panel_start:],(-.12,.667,.929),-12,"X")
cylinder("Laptop display hinge",(-.12,.652,.925),.006,.31,ink,20,(0,math.pi/2,0))
box("Laptop keyboard recess",(-.12,.565,.9195),(.307,.114,.001),rubber,.002)
for key in details["keys"]:
    if not key["laptop"]: continue
    pitch=.0200
    x=-.27+(key["x"]+key["units"]/2)*pitch
    y=.516+key["row"]*.017
    keycap("Laptop "+(key["label"] or "Space"),(x,y,.9198),key["units"]*pitch-.0024,.0146,.0018,key_dark,key["surface"])
box("Trackpad inset",(-.12,.453,.9197),(.116,.068,.001),ink,.002)
box("Glass trackpad",(-.12,.453,.9204),(.114,.066,.0006),cream,.002)
for side in [-1,1]:
    for i in range(12):
        box("Laptop speaker perforation",(-.12+side*.162,.517+i*.0075,.9199),(.0026,.003,.0003),rubber,.0004)
anchor("iris",(-.12,.64,1.18))

current="topp"
box("Portrait foot", (.40,.68,.75), (.23,.17,.015), ink)
box("Portrait stand", (.40,.79,.944), (.024,.026,.39), ink)
monitor("Portrait monitor",(.40,.74,1.105),.303,.527,"topp",-5)
anchor("topp",(.40,.71,1.40))

current="competitions"
box("Landscape foot",(-.79,.60,.75),(.23,.17,.015),ink)
box("Landscape stand",(-.79,.69,.93),(.028,.028,.36),ink)
monitor("Landscape monitor",(-.79,.64,1.048),.61,.356,"campus",-6)
anchor("competitions",(-.79,.62,1.255))

current="rumor"
for i in range(5):
    box("A4 working manuscript",(-.45+i*.002,.145-i*.002,.747+i*.0007),(.297,.210,.00065),paper,.0002,rot=(0,0,-.10+i*.023))
text("Manuscript heading","EARLY PROPAGATION",(-.578,.216,.751),.011,graphite,(0,0,0))
nodes=[(-.45,.09),(-.50,.14),(-.40,.14),(-.535,.18),(-.475,.18),(-.425,.18),(-.365,.18)]
for a,b in [(0,1),(0,2),(1,3),(1,4),(2,5),(2,6)]:
    line("Propagation edge",[(nodes[a][0],nodes[a][1],.752),(nodes[b][0],nodes[b][1],.752)],graphite,.0008)
for x,y in nodes: cylinder("Propagation node",(x,y,.753),.003,.001,blue,10)
anchor("rumor",(-.45,.12,.79))
current="room"
line("Mechanical pencil",[(-.247,.07,.751),(-.205,.205,.751)],ink,.0035)
box("Keyboard aluminium lower case",(-.07,.383,.754),(.368,.145,.016),cream,.0025)
box("Keyboard case seam",(-.07,.383,.7625),(.366,.143,.0012),ink,.002)
box("Keyboard switch plate",(-.07,.383,.764),(.355,.132,.002),rubber,.002)
for key in details["keys"]:
    if key["laptop"]: continue
    pitch=.01905
    x=-.246+(key["x"]+key["units"]/2)*pitch
    y=.325+key["row"]*pitch+(0.009 if key["row"]==5 else 0)
    height=.008+key["row"]*.00065
    mat = key_ivory
    keycap("PBT "+(key["label"] or "Space"),(x,y,.765),key["units"]*pitch-.0016,.01745,height,mat,key["surface"])
    if key["label"] in ["F","J"]:
        box("Home row tactile bar",(x,y-.004,.765+height+.0001),(.004,.0008,.0005),key_ivory,.0002)
for x in [.050,.061,.072]:
    cylinder("Keyboard status LED",(x,.404,.766),.0011,.0006,blue_light,8)
box("Keyboard USB socket",(-.16,.456,.758),(.009,.001,.0038),ink,.001)
o=ball("Mouse",(.247,.35,.764),.047,cream)
o.scale=(.70,1.25,.42)
line("Mouse seam",[(.247,.352,.784),(.247,.393,.778)],ink,.0008)
for x in [-.12,.40,-.79]:
    line("Monitor cable",[(x,.77,1.00),(x+.05,.84,.76),(x+.07,.83,.64),(x+.14,.79,.63)],rubber,.003)
line("Keyboard cable",[(-.16,.456,.758),(-.16,.51,.756),(-.23,.53,.752),(-.36,.79,.746)],rubber,.002)

# Articulated task lamp, with hardware-scale seams and a broad light diffuser.
cylinder("Lamp foot",(-1.06,.84,.752),.080,.018,ink,32)
line("Lamp lower arm",[(-1.06,.84,.765),(-1.10,.84,1.055)],ink,.008)
line("Lamp upper arm",[(-1.10,.84,1.055),(-.89,.80,1.31)],ink,.008)
ball("Lamp hinge",(-1.10,.84,1.055),.017,ink)
box("Lamp head",(-.81,.77,1.30),(.26,.055,.026),ink,.005)
box("Lamp diffuser",(-.81,.77,1.282),(.22,.040,.003),paper,.002)

# Chair pulled to the left, leaving the desk and papers in the opening view.
cx,cy=-1.15,-.48
cylinder("Chair lift",(cx,cy,.29),.025,.35,ink)
for i in range(5):
    a=i*math.tau/5
    end=(cx+math.cos(a)*.30,cy+math.sin(a)*.30,.07)
    line("Chair leg",[(cx,cy,.15),end],ink,.012)
    cylinder("Chair caster",end,.031,.041,rubber,16,(math.pi/2,0,a))
box("Chair cushion",(cx,cy,.455),(.46,.44,.065),rubber,.025)
box("Chair back frame",(cx,cy-.20,.72),(.44,.035,.48),ink,.018,rot=(.13,0,-.15))
box("Chair upholstered back",(cx,cy-.18,.72),(.404,.030,.44),rubber,.020,rot=(.13,0,-.15))
for x in [cx-.25,cx+.25]:
    line("Chair arm support",[(x,cy,.45),(x,cy,.635)],ink,.01)
    box("Chair armrest",(x,cy+.01,.64),(.048,.24,.024),rubber,.008)

# Open archive at the right, whiteboard above it: an active research wall.
for x in [1.07,1.81]: box("Archive upright",(x,1.18,.57),(.026,.43,1.14),wood)
for z in [.10,.45,.82,1.14]: box("Archive shelf",(1.44,1.18,z),(.77,.43,.026),wood)
box("Archive back",(1.44,1.395,.57),(.77,.014,1.13),wood)
current="gudhi"
for x in [1.224,1.296]:
    box("Algorithm binder cloth cover",(x,1.17,.624),(.003,.295,.316),blue,.0008)
box("Algorithm binder recessed pages",(1.26,1.174,.624),(.064,.278,.304),page_edge,.001)
box("Algorithm binder spine",(1.26,1.025,.624),(.075,.005,.316),blue,.002)
box("Binder paper insert",(1.26,1.017,.663),(.050,.002,.13),paper,.001)
text("GUDHI label","GUDHI",(1.237,1.014,.697),.013,graphite)
for z in [.625,.609]: box("Folio rule",(1.26,1.013,z),(.035,.001,.002),graphite,0)
cylinder("Binder finger hole",(1.26,1.011,.526),.010,.003,ink,16,(math.pi/2,0,0))
anchor("gudhi",(1.26,.96,.67))
current="animeko"
box("Vision archive box",(1.57,1.17,.597),(.27,.295,.257),cream,.003)
box("Archive lid",(1.57,1.17,.730),(.278,.304,.019),cream,.002)
box("Archive label frame",(1.57,1.016,.623),(.176,.004,.075),ink,.001)
box("Archive paper label",(1.57,1.012,.623),(.16,.002,.063),paper,.001)
text("Animeko label","ANIMEKO",(1.503,1.009,.630),.022,graphite)
text("Vision subtitle","VISION / CNN",(1.505,1.009,.608),.010,graphite)
anchor("animeko",(1.57,1.005,.78))
current="room"
# A populated reference library: distinct bindings, inset paper and readable spines.
cursor=1.135
for i in range(9):
    thickness=.036+(i%3)*.009
    if i==6: cursor+=.085
    if i==8: cursor+=.035
    volume(i,(cursor+thickness/2,1.17+(i%3-1)*.008,.115),thickness,.23+(i%2)*.025,.245+(i%4)*.012,lean=-7 if i==8 else 0)
    cursor+=thickness+.003
for x in [1.126,1.74]:
    box("Steel library bookend",(x,1.18,.205),(.004,.20,.18),ink,.001)
    box("Bookend foot",(x+(.025 if x<1.3 else -.025),1.18,.116),(.052,.20,.002),ink,.0005)
stack_z=.834
for i in range(3):
    thickness=.025+i*.007
    volume(9+i,(1.28,1.175,stack_z),thickness,.24,.28-i*.012,angle=(-3+i*3),stacked=True)
    stack_z += thickness+.001
for i in range(4):
    volume(12+i,(1.51+i*.066,1.18,.834),.036+(i%2)*.008,.235,.255-i*.014,lean=4 if i==3 else 0)
# A slim working volume beside the two existing contribution archives.
volume(16,(1.12,1.17,.465),.037,.252,.30)

# Whiteboard is fixed to the back wall and fades together with that wall.
current="wall_back"
box("Whiteboard aluminium frame",(1.12,1.563,1.88),(1.50,.028,.88),cream,.005)
box("Whiteboard enamel",(1.12,1.543,1.88),(1.463,.008,.841),paper,.003)
box("Marker tray",(1.12,1.505,1.428),(1.18,.08,.018),cream,.002)
text("Whiteboard title","QUESTIONS / IN PROGRESS",(.47,1.535,2.185),.040,graphite)
text("Whiteboard formula","d_B(D, E) = inf  sup ||x - g(x)||",(.49,1.534,2.062),.036,graphite)
text("Whiteboard footnote","structure -> distance -> evidence",(.49,1.534,1.524),.030,blue)
wn=[(.59,1.74),(.78,1.86),(.98,1.71),(1.06,1.95),(1.28,1.83),(1.48,1.94),(1.63,1.69)]
for a,b in [(0,1),(1,2),(1,3),(2,4),(3,4),(4,5),(4,6),(5,6)]:
    line("Whiteboard topology",[(wn[a][0],1.532,wn[a][1]),(wn[b][0],1.532,wn[b][1])],blue,.0014)
for x,z in wn:
    cylinder("Whiteboard node",(x,1.529,z),.007,.002,graphite,12,(math.pi/2,0,0))
for i,m in enumerate([graphite,blue,pink]):
    line("Whiteboard marker",[(.70+i*.20,1.482,1.44),(.83+i*.20,1.482,1.44)],m,.006)
box("Whiteboard eraser",(1.52,1.477,1.447),(.105,.048,.026),ink,.003)
current="notes"
box("Open notebook cloth cover",(.48,.20,.748),(.29,.21,.007),blue,.002,rot=(0,0,-.10))
for side in [-1,1]:
    box("Notebook paper block",(.48+side*.071,.20,.755),(.137,.193,.008),paper,.002)
    for j in range(8): box("Notebook ruled line",(.48+side*.071,.121+j*.021,.760),(.112,.0007,.0003),graphite,0)
line("Notebook ribbon",[(.48,.29,.759),(.48,.10,.758),(.50,.07,.747)],pink,.0013)
anchor("notes",(.49,.15,.79))

# Headphones on a desk-side stand, rather than oversized on the keyboard area.
current="headphones"
cylinder("Headphone stand base",(.71,.49,.755),.068,.017,ink,24)
line("Headphone stand",[(.71,.49,.765),(.71,.49,1.075)],gold,.009)
box("Headphone saddle",(.71,.49,1.079),(.10,.038,.021),rubber,.007)
line("Headphone spring band",[(.616,.475,.949),(.612,.475,1.03),(.71,.475,1.112),(.808,.475,1.03),(.804,.475,.949)],ink,.012)
for x in [.62,.80]:
    o=ball("Ear cushion",(x,.475,.945),.053,rubber)
    o.scale=(.43,.76,1)
    o=ball("Ear cup shell",(x+(-.015 if x<.7 else .015),.475,.945),.050,ink)
    o.scale=(.32,.78,1)
anchor("headphones",(.71,.46,1.15))
current="anime"
box("Picture frame",(1.67,1.22,1.311),(.23,.020,.29),wood,.003)
box("Picture mount",(1.67,1.206,1.311),(.209,.004,.27),paper,.001)
box("Picture image",(1.67,1.201,1.311),(.172,.001,.218),blue,0)
# Small original mountains and moon, no copyrighted or private source photograph.
line("Picture ridge",[(1.59,1.198,1.24),(1.64,1.198,1.35),(1.69,1.198,1.27),(1.73,1.198,1.31)],cream,.0014)
cylinder("Picture moon",(1.71,1.198,1.38),.015,.002,paper,24,(math.pi/2,0,0))
anchor("anime",(1.67,1.195,1.50))
current="room"
# A glass of water and a restrained stack of loose research pages.
cylinder("Ceramic mug",(-.89,.23,.80),.035,.11,cream,32)
cylinder("Coffee surface",(-.89,.23,.857),.030,.002,wood,32)
line("Mug handle",[(-.923,.23,.839),(-.95,.23,.832),(-.95,.23,.793),(-.923,.23,.783)],cream,.006)
for i in range(7):
    box("Research printout",(-.98,.43,.744+i*.001),(.18,.13,.0008),paper,.0002,rot=(0,0,.03*i))

# Side and rear areas reward a full orbit; they do not introduce new navigation.
current="room"
# Left reading shelf, just inside the side window, facing into the room.
for y in [-1.62,-.96]:
    box("Reading shelf side",(-1.96,y,.66),(.31,.024,1.32),wood)
for z in [.08,.48,.88,1.32]:
    box("Reading shelf board",(-1.96,-1.29,z),(.32,.68,.024),wood)
box("Reading shelf back",(-2.115,-1.29,.66),(.018,.67,1.30),wood)
for row in range(3):
    cursor=-1.585
    for i in range(6):
        thickness=.035+(i%3)*.009
        if row==1 and i>=4:
            volume(17+row*6+i,(-1.95,-1.135,.493+(0 if i==4 else .045)),.044,.242,.255,angle=90,stacked=True)
        else:
            if i==5: cursor+=.045
            volume(17+row*6+i,(-1.96,cursor+thickness/2,.093+row*.40),thickness,.242,.255+(i%3)*.026,angle=90,lean=-7 if i==5 else 0)
            cursor+=thickness+.003
# Right-hand drawers and corkboard, visible from oblique and rear angles.
box("Side cabinet body",(1.73,-.27,.405),(.62,.64,.79),cream,.005)
box("Side cabinet top",(1.73,-.27,.810),(.65,.67,.027),wood,.004)
for z in [.20,.44,.68]:
    box("Drawer front",(1.73,-.598,z),(.575,.012,.219),cream,.003)
    line("Drawer pull",[(1.65,-.615,z+.022),(1.81,-.615,z+.022)],ink,.005)
volume(35,(1.70,-.26,.824),.034,.24,.29,angle=7,stacked=True)
for i in range(3):
    box("Loose reading paper",(1.69,-.26,.860+i*.0008),(.26,.20,.00065),paper,.0002,rot=(0,0,.10))
current="wall_right"
# A low side partition keeps the opening view light; the near side fades on orbit.
box("Right wall",(2.22,-.12,1.5),(.12,3.54,3),wall,.002)
box("Right skirting",(2.142,-.12,.055),(.025,3.54,.11),cream,.001)
box("Cork board frame",(2.14,-.35,1.68),(.03,.86,.64),wood,.003)
box("Cork board",(2.119,-.35,1.68),(.01,.81,.59),oak,.001)
for i in range(5):
    y=-.65+(i%3)*.21
    z=1.56+(i//3)*.20
    box("Pinned note",(2.109,y,z),(.001,.16,.14),paper,.0004,rot=(.05*(i-2),0,0))
    ball("Note pin",(2.103,y,z+.05),.006,blue)
current="room"
# A reading seat and a standing lamp behind the initial observer's desk view.
box("Reading chair seat",(.93,-1.52,.45),(.50,.48,.065),blue,.02)
box("Reading chair back",(.93,-1.75,.73),(.50,.05,.50),blue,.018,rot=(.10,0,0))
for x in [.72,1.14]:
    for y in [-1.71,-1.33]:
        box("Reading chair leg",(x,y,.225),(.025,.025,.45),wood,.002)
cylinder("Reading lamp foot",(1.56,-1.65,.02),.145,.028,ink,32)
line("Reading lamp stem",[(1.56,-1.65,.04),(1.56,-1.65,1.50)],ink,.011)
cylinder("Reading lamp shade",(1.56,-1.65,1.50),.16,.20,cream,32)
cylinder("Reading lamp lower diffuser",(1.56,-1.65,1.40),.145,.002,paper,32)

# Both secondary screens turn toward the seated observer, anchors included.
for name,pivot,degrees in [("competitions",(-.79,.64,.75),15),("topp",(.40,.74,.75),-17)]:
    transform_objects(groups[name]+[bpy.data.objects["anchor_"+name]],pivot,degrees)

# Join only by interaction group. Multi-material modelling remains editable.
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
scene.cycles.samples=int(os.environ.get("ROOM_BAKE_SAMPLES", "32"))
scene.cycles.use_denoising=True
scene.render.bake.use_pass_direct=True
scene.render.bake.use_pass_indirect=True
scene.render.bake.use_pass_color=True
scene.render.bake.use_pass_diffuse=True
scene.render.bake.use_pass_glossy=False
scene.render.bake.use_pass_transmission=False
scene.render.bake.use_pass_emit=True
scene.render.bake.margin=6
bpy.ops.object.select_all(action="DESELECT")
for o in meshes: o.select_set(True)
bpy.context.view_layer.objects.active=meshes[0]
for obj in meshes:
    layer = obj.data.uv_layers.new(name="BakeUV")
    obj.data.uv_layers.active = layer
    layer.active_render = True
bpy.ops.object.mode_set(mode="EDIT")
bpy.ops.mesh.select_all(action="SELECT")
bpy.ops.uv.smart_project(angle_limit=1.15,island_margin=.003)
bpy.ops.object.mode_set(mode="OBJECT")


def area(name,pos,power,color,size,target):
    d=bpy.data.lights.new(name,"AREA")
    d.energy,d.color,d.shape,d.size=power,color,"DISK",size
    o=bpy.data.objects.new(name,d)
    scene.collection.objects.link(o)
    o.location=pos
    o.rotation_euler=(Vector(target)-o.location).to_track_quat('-Z','Y').to_euler()
    return o


key=area("Window daylight",(-1.00,1.51,2.05),100,(1,.93,.83),1.25,(-.2,.0,.5))
fill=area("Room bounce",(0,-1.5,2.7),45,(1,.91,.78),2.5,(0,.5,.7))
lamp=area("Task lamp",(-.81,.77,1.268),1,(1,.72,.43),.20,(-.30,.26,.74))
screen=area("Screen spill",(-.45,.60,1.06),.35,(.57,.73,1),.48,(-.4,.1,.74))
scene.world.use_nodes=True
world=scene.world.node_tree.nodes.get("Background")
world.inputs["Color"].default_value=(.67,.76,.90,1)
world.inputs["Strength"].default_value=.17
# Emissive glazing and displays retain a little self-light in the dark bake.
for mat,power in [(glass,.85),(blue_light,.25),(screen_white,.50),(screen_dark,1.5)]:
    bsdf=mat.node_tree.nodes.get("Principled BSDF")
    bsdf.inputs["Emission Color"].default_value=mat.diffuse_color
    bsdf.inputs["Emission Strength"].default_value=power

cam_data=bpy.data.cameras.new("Composition camera")
cam=bpy.data.objects.new("Composition camera",cam_data)
scene.collection.objects.link(cam)
scene.camera=cam
cam_data.lens=28
cam_data.sensor_fit="VERTICAL"
cam_data.sensor_height=24
cam.location=(-.62,-2.72,1.90)
target=Vector((.08,.50,1.06))
cam.rotation_euler=(target-cam.location).to_track_quat('-Z','Y').to_euler()
scene.render.film_transparent=True
scene.render.resolution_x=1440
scene.render.resolution_y=1000
scene.render.resolution_percentage=100
scene.view_settings.view_transform="Standard"
scene.view_settings.look="None"
scene.view_settings.exposure=0
scene.view_settings.gamma=1
bpy.context.preferences.filepaths.save_version=0
# Save the source before replacing any procedural materials with the baked maps.
bpy.ops.wm.save_as_mainfile(filepath=str(SOURCE/"study.blend"),compress=True)

# Bake printed patches as white receivers, then multiply the original high-resolution
# artwork by that local illumination. The LCD keeps its own emitted colours.
bsdf = printed.node_tree.nodes.get("Principled BSDF")
for link in list(bsdf.inputs["Base Color"].links): printed.node_tree.links.remove(link)
bsdf.inputs["Base Color"].default_value = (1,1,1,1)

# Bake a joined duplicate once per lighting state. Original interaction meshes retain
# their global UV layout and names; hiding them avoids coincident shadow geometry.
bpy.ops.object.select_all(action="DESELECT")
for o in meshes: o.select_set(True)
bpy.context.view_layer.objects.active=meshes[0]
bpy.ops.object.duplicate()
bpy.ops.object.join()
bake_proxy=bpy.context.object
bake_proxy.name="Lighting bake proxy"
for o in meshes: o.hide_render=True
originals=list(bpy.data.materials)
atlases={}
for name,night in [("day",False),("night",True)]:
    key.data.energy=14 if night else 100
    key.data.color=(.44,.59,1) if night else (1,.93,.83)
    fill.data.energy=6 if night else 45
    lamp.data.energy=8 if night else 1
    screen.data.energy=1.5 if night else .35
    world.inputs["Strength"].default_value=.025 if night else .17
    atlas=bpy.data.images.new("Study "+name+" light bake",width=3072,height=3072)
    for mat in originals:
        if not mat.use_nodes: continue
        node=mat.node_tree.nodes.get("Bake target") or mat.node_tree.nodes.new("ShaderNodeTexImage")
        node.name="Bake target"
        node.image=atlas
        mat.node_tree.nodes.active=node
    bpy.ops.object.select_all(action="DESELECT")
    bake_proxy.select_set(True)
    bpy.context.view_layer.objects.active=bake_proxy
    print("Baking physically lit "+name,flush=True)
    bpy.ops.object.bake(type="COMBINED")
    raw=np.array(atlas.pixels[:],dtype=np.float32).reshape(3072,3072,4)
    # Preserve 3072-square room lighting; reserve the right/bottom bands of a
    # 4096-square atlas for screen pixels, key legends and printed book spines.
    # Small text must not be denoised along with diffuse room lighting.
    illuminants={}
    for obj in meshes:
        attr=obj.data.attributes.get("detail_surface")
        if not attr: continue
        uvs=obj.data.uv_layers["BakeUV"].data
        for face in obj.data.polygons:
            index=attr.data[face.index].value
            if not index: continue
            surface=detail_ids[index-1]
            uv=sum((uvs[i].uv for i in face.loop_indices),Vector((0,0)))/len(face.loop_indices)
            px,py=np.clip(np.array(uv)*3072,2,3069).astype(int)
            illuminants[surface]=np.median(raw[py-1:py+2,px-1:px+2,:3].reshape(-1,3),axis=0)
    pixels=raw.reshape(-1,4)
    pixels[:,:3]=pixels[:,:3]/(1+pixels[:,:3]*.32)
    atlas.pixels.foreach_set(pixels.ravel())
    atlas.filepath_raw=str(SOURCE/("study-atlas.png" if name=="day" else "study-night.png"))
    atlas.file_format="PNG"
    if name=="day": atlas.save()
    # Embedded day JPG and separate night JPG keep the total delivery below 4 MiB.
    scene.render.image_settings.file_format="JPEG"
    scene.render.image_settings.quality=88
    # Color-only OpenImageDenoise removes path-tracing noise from the static lightmap.
    # This runs offline; runtime has no denoising or screen-space effect.
    denoise_scene=bpy.data.scenes.new("Atlas denoise")
    denoise_scene.collection.objects.link(cam)
    denoise_scene.camera=cam
    denoise_scene.render.engine="CYCLES"
    denoise_scene.cycles.samples=1
    denoise_scene.render.resolution_x=3072
    denoise_scene.render.resolution_y=3072
    denoise_scene.render.resolution_percentage=100
    denoise_scene.view_settings.view_transform="Standard"
    denoise_scene.view_settings.look="None"
    denoise_scene.use_nodes=True
    compositor=denoise_scene.node_tree.nodes
    compositor.clear()
    image_node=compositor.new("CompositorNodeImage")
    image_node.image=atlas
    denoise=compositor.new("CompositorNodeDenoise")
    composite=compositor.new("CompositorNodeComposite")
    denoise_scene.node_tree.links.new(image_node.outputs["Image"],denoise.inputs["Image"])
    denoise_scene.node_tree.links.new(denoise.outputs["Image"],composite.inputs["Image"])
    denoise_scene.render.image_settings.file_format="JPEG"
    denoise_scene.render.image_settings.quality=86
    denoise_scene.render.filepath=str(OUT/("study-"+name+".jpg"))
    bpy.ops.render.render(write_still=True,scene=denoise_scene.name)
    bpy.data.scenes.remove(denoise_scene)
    denoised=bpy.data.images.load(str(OUT/("study-"+name+".jpg")),check_existing=False)
    composite_pixels=np.array(detail_image.pixels[:],dtype=np.float32).reshape(4096,4096,4).copy()
    for surface,light in illuminants.items():
        x,y,w,h=details["surfaces"][surface]
        tile=composite_pixels[4096-y-h:4096-y,x:x+w,:3]
        if surface in ["campus","iris","topp"]:
            tile *= .92 if night else .86
        else:
            tile *= light
            tile /= 1+tile*.32
    composite_pixels[1024:,:3072]=np.array(denoised.pixels[:],dtype=np.float32).reshape(3072,3072,4)
    composite_pixels[:,:,3]=1
    stabilize_key_lighting(composite_pixels)
    combined=bpy.data.images.new("Study "+name+" detailed atlas",width=4096,height=4096)
    combined.pixels.foreach_set(composite_pixels.ravel())
    scene.render.image_settings.file_format="JPEG"
    scene.render.image_settings.color_mode="RGB"
    scene.render.image_settings.quality=88
    combined.save_render(str(OUT/("study-"+name+".jpg")),scene=scene)
    if name=="day":
        combined.filepath_raw=str(SOURCE/"study-atlas.png")
        combined.file_format="PNG"
        combined.save()
    atlases[name]=bpy.data.images.load(str(OUT/("study-"+name+".jpg")),check_existing=False)
    bpy.data.images.remove(denoised)
    bpy.data.images.remove(combined)
    bpy.data.images.remove(atlas)

# Reuse a single unlit material and texture at runtime. High-resolution faces keep
# their explicit artwork UVs; ordinary geometry uses the upper-left light bake.
for obj in meshes:
    bake_uv=obj.data.uv_layers["BakeUV"]
    detail_uv=obj.data.uv_layers.get("DetailUV")
    attr=obj.data.attributes.get("detail_surface")
    for face in obj.data.polygons:
        is_detail=attr and attr.data[face.index].value>0
        for i in face.loop_indices:
            bake_uv.data[i].uv=detail_uv.data[i].uv if is_detail else bake_uv.data[i].uv*.75+Vector((0,.25))
    # Copy names, not RNA layer handles: removing a layer shifts their indices.
    for name in [uv.name for uv in obj.data.uv_layers]:
        if name!="BakeUV": obj.data.uv_layers.remove(obj.data.uv_layers[name])
    obj.data.uv_layers.active=obj.data.uv_layers["BakeUV"]
    obj.data.uv_layers["BakeUV"].active_render=True

bpy.data.objects.remove(bake_proxy,do_unlink=True)
for o in meshes: o.hide_render=False
baked=bpy.data.materials.new("Baked interior light")
baked.use_nodes=True
n=baked.node_tree.nodes
n.clear()
tex=n.new("ShaderNodeTexImage")
tex.image=atlases["day"]
output=n.new("ShaderNodeOutputMaterial")
# Blender's exporter recognizes a direct color-to-surface link as KHR_materials_unlit.
baked.node_tree.links.new(tex.outputs["Color"],output.inputs["Surface"])
for obj in meshes:
    obj.data.materials.clear()
    obj.data.materials.append(baked)
    for face in obj.data.polygons: face.material_index=0
bpy.ops.object.select_all(action="DESELECT")
for o in scene.objects:
    if o.type in {"MESH","EMPTY"}: o.select_set(True)
bpy.ops.export_scene.gltf(filepath=str(OUT/"study.glb"),export_format="GLB",use_selection=True,export_yup=True,export_materials="EXPORT",export_extras=False,export_normals=False)
# Same baked surface and perspective in posters and WebGL.
scene.cycles.samples=16
scene.render.image_settings.file_format="PNG"
scene.render.image_settings.color_mode="RGBA"
bpy.data.objects["wall_left"].hide_render=False
for name,night,mobile,detail in [("day",False,False,False),("night",True,False,False),("detail",False,False,True),("mobile",False,True,False),("mobile-night",True,True,False)]:
    tex.image=atlases["night" if night else "day"]
    scene.render.resolution_x=750 if mobile else 1440
    scene.render.resolution_y=1100 if mobile else 1000
    cam.location=(-.75,-4.8,2.30) if mobile else (-.62,-2.72,1.90)
    cam_data.shift_x=.12 if detail else 0
    cam.rotation_euler=(target-cam.location).to_track_quat('-Z','Y').to_euler()
    scene.render.filepath=str(OUT/(name+".png"))
    bpy.ops.render.render(write_still=True)
print("Full-scale study source, light bakes and responsive views complete",flush=True)
