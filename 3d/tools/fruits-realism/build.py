"""Deterministic glTF 2.0 food asset. Python 3 + numpy + Pillow; no runtime dependencies.

Source composition/scale: fruits-clean-v2.glb. New parametrically sculpted geometry,
UVs, smooth normals, embedded skin albedo and separate micro-normal/roughness maps.
Skin atlas is generated source artwork; previews must be rendered from this GLB.
"""
import sys, json, struct, io, math
from pathlib import Path
import numpy as np
from PIL import Image, ImageFilter

ROOT = Path(__file__).resolve().parents[3]
OUT = ROOT / '3d/assets/fruits-real-v1.glb'
ATLAS = Image.open(Path(__file__).with_name('skin-atlas.png')).convert('RGB')
RNG = np.random.default_rng(240914)
PI = np.pi
gltf = dict(asset={'version':'2.0','generator':'Qadam fruit studio 1.0'}, scene=0,
            scenes=[{'nodes':[]}], nodes=[], meshes=[], materials=[], textures=[],
            images=[], samplers=[{'magFilter':9729,'minFilter':9987,'wrapS':10497,'wrapT':10497}],
            accessors=[], bufferViews=[], buffers=[])
chunks=[]
byte_offset=0
mesh_records=[]

def blob(data, target=None):
    global byte_offset
    data=bytes(data); n=len(data)
    view={'buffer':0,'byteOffset':byte_offset,'byteLength':n}
    if target: view['target']=target
    gltf['bufferViews'].append(view)
    padded=data+b'\x00'*((-n)%4);chunks.append(padded);byte_offset+=len(padded)
    return len(gltf['bufferViews'])-1

def accessor(arr, kind, component=5126, bounds=False):
    arr=np.asarray(arr,dtype={5126:'<f4',5125:'<u4',5121:'u1'}[component])
    item={'bufferView':blob(arr.tobytes(),34963 if kind=='SCALAR' else 34962),
          'componentType':component,'count':len(arr),'type':kind}
    if bounds: item.update(min=arr.min(axis=0).tolist(),max=arr.max(axis=0).tolist())
    if component==5121:item['normalized']=True
    gltf['accessors'].append(item);return len(gltf['accessors'])-1

def texture(array, name, jpeg=False):
    im=Image.fromarray(np.uint8(np.clip(array,0,255)))
    if not jpeg: im=im.resize((256,256),Image.Resampling.LANCZOS)
    buf=io.BytesIO();im.save(buf,format='JPEG' if jpeg else 'PNG',quality=91,optimize=True)
    gltf['images'].append({'name':name,'bufferView':blob(buf.getvalue()),'mimeType':'image/jpeg' if jpeg else 'image/png'})
    gltf['textures'].append({'source':len(gltf['images'])-1,'sampler':0})
    return len(gltf['textures'])-1

def noise(n, coarse, seed):
    rng=np.random.default_rng(seed)
    small=Image.fromarray(np.uint8(rng.random((coarse,coarse))*255))
    return np.asarray(small.resize((n,n),Image.Resampling.BICUBIC),dtype=float)/255

def skin(kind, tile, roughness, normal_strength, seed):
    n=512
    if tile is not None:
        w,h=ATLAS.size;x,y=tile
        img=ATLAS.crop((x*w//2,y*h//2,(x+1)*w//2,(y+1)*h//2)).resize((n,n),Image.Resampling.LANCZOS)
        rgb=np.array(img,dtype=float)
        # Mirrored repeat makes longitude continuous without painting a seam.
        col=np.arange(n); col=np.where(col<n//2,col*2,(n-1-col)*2)
        rgb=rgb[:,col]
        if kind=='peach':
            soft=np.array(Image.fromarray(rgb.astype('uint8')).filter(ImageFilter.GaussianBlur(1.1)),dtype=float)
            rgb=0.42*rgb+0.58*soft
    else:
        broad=noise(n,12,seed);fine=noise(n,90,seed+1)
        color=np.array([61,51,69]) if kind=='grape' else np.array([72,93,28])
        rgb=np.tile(color,(n,n,1)).astype(float)
        rgb+=(broad[...,None]-.5)*np.array([36,32,42])
        rgb+=(fine[...,None]-.5)*8
    micro=noise(n,240,seed+2); broad=noise(n,18,seed+3)
    luminance=rgb.mean(axis=2)/255
    low=np.asarray(Image.fromarray(np.uint8(luminance*255)).filter(ImageFilter.GaussianBlur(3)),float)/255
    height=(luminance-low)*.5+(micro-.5)*.15
    # All fruit skins have small pores; the roughness maps remain non-metallic.
    dx=(np.roll(height,-1,axis=1)-np.roll(height,1,axis=1))*normal_strength
    dy=(np.roll(height,-1,axis=0)-np.roll(height,1,axis=0))*normal_strength
    normals=np.stack([-dx,dy,np.ones_like(dx)],axis=-1)
    normals/=np.linalg.norm(normals,axis=-1,keepdims=True)
    orm=np.zeros((n,n,3));orm[:,:,0]=255
    orm[:,:,1]=np.clip(roughness+(broad-.5)*.14+(micro-.5)*.07,.15,.96)*255
    mat={'name':kind+' skin','pbrMetallicRoughness':{
        'baseColorTexture':{'index':texture(rgb,kind+' albedo',True)},
        'metallicFactor':0,'roughnessFactor':1,
        'metallicRoughnessTexture':{'index':texture(orm,kind+' roughness')}},
        'normalTexture':{'index':texture((normals*.5+.5)*255,kind+' micro-normal'),'scale':.6}}
    gltf['materials'].append(mat);return len(gltf['materials'])-1

def simple(name, color, rough):
    # glTF factors are linear; convert artist-authored sRGB swatches correctly.
    c=np.array(color)/255;c=np.where(c<=.04045,c/12.92,((c+.055)/1.055)**2.4)
    gltf['materials'].append({'name':name,'pbrMetallicRoughness':{'baseColorFactor':[*c.tolist(),1], 'metallicFactor':0,'roughnessFactor':rough}})
    return len(gltf['materials'])-1

apple_mat=skin('apple',(0,0),.34,2.5,1)
orange_mat=skin('orange',(1,0),.52,4.5,2)
peach_mat=skin('peach',(0,1),.78,1.2,3)
pom_mat=skin('pomegranate',(1,1),.40,2.4,4)
grape_mat=skin('grape',None,.53,1.3,5)
leaf_mat=skin('leaf',None,.59,2,6)
stem_mat=simple('dry woody stems',(92,63,30),.86)
crown_mat=simple('pomegranate calyx',(125,66,35),.72)
plate_mat=simple('warm porcelain glaze',(236,230,213),.23)
rim_mat=simple('fine olive ceramic rim',(80,92,65),.27)

def mesh(name, vertices, faces, uv, mat):
    vertices=np.asarray(vertices,float);faces=np.asarray(faces,np.uint32).reshape(-1,3)
    normal=np.zeros_like(vertices)
    cross=np.cross(vertices[faces[:,1]]-vertices[faces[:,0]],vertices[faces[:,2]]-vertices[faces[:,0]])
    for k in range(3):np.add.at(normal,faces[:,k],cross)
    normal_length=np.linalg.norm(normal,axis=1,keepdims=True)
    normal=np.divide(normal,normal_length,out=np.zeros_like(normal),where=normal_length>1e-12)
    normal[normal_length[:,0]<=1e-12]=[0,1,0]
    attrs={'POSITION':accessor(vertices,'VEC3',bounds=True),'NORMAL':accessor(normal,'VEC3')}
    if uv is not None:
        uv=np.asarray(uv,float)
        attrs['TEXCOORD_0']=accessor(uv,'VEC2')
        tangent=np.zeros_like(vertices)
        p0,p1,p2=vertices[faces[:,0]],vertices[faces[:,1]],vertices[faces[:,2]]
        t0,t1,t2=uv[faces[:,0]],uv[faces[:,1]],uv[faces[:,2]]
        d1,d2=p1-p0,p2-p0;dt1,dt2=t1-t0,t2-t0
        denominator=dt1[:,0]*dt2[:,1]-dt1[:,1]*dt2[:,0]
        valid=np.abs(denominator)>1e-12
        direction=np.zeros_like(d1)
        direction[valid]=(d1[valid]*dt2[valid,1,None]-d2[valid]*dt1[valid,1,None])/denominator[valid,None]
        for k in range(3):np.add.at(tangent,faces[:,k],direction)
        tangent-=normal*np.sum(normal*tangent,axis=1,keepdims=True)
        tangent_length=np.linalg.norm(tangent,axis=1,keepdims=True)
        tangent=np.divide(tangent,tangent_length,out=np.zeros_like(tangent),where=tangent_length>1e-12)
        tangent[tangent_length[:,0]<=1e-12]=[1,0,0]
        attrs['TANGENT']=accessor(np.column_stack([tangent,np.ones(len(tangent))]),'VEC4')
    primitive={'attributes':attrs,'indices':accessor(faces.flatten(),'SCALAR',5125),'material':mat}
    gltf['meshes'].append({'name':name,'primitives':[primitive]})
    gltf['nodes'].append({'name':name,'mesh':len(gltf['meshes'])-1})
    gltf['scenes'][0]['nodes'].append(len(gltf['nodes'])-1)
    mesh_records.append((name,vertices,normal,primitive))

def rotation(rx=0,ry=0,rz=0):
    a,b,c=np.deg2rad([rx,ry,rz]);
    return np.array([[np.cos(c),-np.sin(c),0],[np.sin(c),np.cos(c),0],[0,0,1]]) @ np.array([[np.cos(b),0,np.sin(b)],[0,1,0],[-np.sin(b),0,np.cos(b)]]) @ np.array([[1,0,0],[0,np.cos(a),-np.sin(a)],[0,np.sin(a),np.cos(a)]])

def fruit(name,kind,center,radii,mat,angles=(0,0,0),phase=0,nu=96,nv=64):
    theta=np.linspace(.0001,PI-.0001,nv+1)[:,None]
    phi=np.linspace(0,2*PI,nu+1)[None,:]
    st=np.sin(theta);ct=np.cos(theta)
    lobes=1+.025*np.cos(5*phi+phase)*st**2
    asym=1+.025*np.sin(3*phi+theta*2+phase)*st+.014*np.cos(7*phi-3*theta)*st
    radial=st*lobes*asym
    vertical=np.broadcast_to(ct,(nv+1,nu+1)).copy()
    if kind=='apple':
        radial*=1+.08*ct
        vertical-=.26*np.exp(-(theta/.29)**2)
        vertical+=.12*np.exp(-((PI-theta)/.25)**2)
        vertical+=.04*np.cos(5*phi+phase)*np.exp(-(theta/.6)**2)
    elif kind=='orange':
        vertical-=.055*np.exp(-(theta/.22)**2)
        vertical+=.05*np.exp(-((PI-theta)/.2)**2)
        radial*=1+.007*np.sin(23*phi+theta*37)*st
    elif kind=='peach':
        seam=np.exp(-(np.sin(phi-phase)/.085)**2)*(.5+.5*np.cos(phi-phase))
        radial*=1-.055*seam
        vertical-=.13*np.exp(-(theta/.24)**2)
        vertical+=.025*np.cos(phi-phase)*st
    elif kind=='pomegranate':
        radial*=1+.035*np.cos(6*phi+phase)*st-.1*ct
        vertical-=.085*np.exp(-(theta/.27)**2)
    x=radial*np.cos(phi)*radii[0];z=radial*np.sin(phi)*radii[2]
    y=vertical*radii[1]
    v=np.stack([x,y,z],axis=-1).reshape(-1,3)
    rot=rotation(*angles);v=v@rot.T+center
    uv=np.stack(np.broadcast_arrays(phi/(2*PI),theta/PI),axis=-1).reshape(-1,2)
    f=[]
    for j in range(nv):
        for i in range(nu):
            a=j*(nu+1)+i;b=a+nu+1
            f.extend([(a,a+1,b),(a+1,b+1,b)])
    mesh(name,v,f,uv,mat)
    return np.array(center)+rot@np.array([0,radii[1]*(.74 if kind=='apple' else .87 if kind=='peach' else .95),0]),rot

def tube(name,points,radii,mat,sides=10):
    pts=np.asarray(points);v=[];uv=[]
    for j,p in enumerate(pts):
        t=pts[min(j+1,len(pts)-1)]-pts[max(j-1,0)];t=t/np.linalg.norm(t)
        n=np.cross(t,[0,0,1] if abs(t[2])<.9 else [1,0,0]);n/=np.linalg.norm(n);b=np.cross(t,n)
        for i in range(sides+1):
            ang=i*2*PI/sides;v.append(p+radii[j]*(n*np.cos(ang)+b*np.sin(ang)));uv.append([i/sides,j/(len(pts)-1)])
    f=[]
    for j in range(len(pts)-1):
        for i in range(sides):
            a=j*(sides+1)+i;b=a+sides+1;f.extend([(a,b,a+1),(a+1,b,b+1)])
    mesh(name,v,f,uv,mat)

def stem(name,tip,rot,length=.012):
    local=np.array([[0,-.002,0],[.001,length*.35,0],[.0025,length*.72,.0008],[.004,length,.001]])
    tube(name,local@rot.T+tip,[.0018,.00165,.0013,.001],stem_mat)

def leaf(name,base,length,width,angles):
    v=[];uv=[];rows=22;cols=8
    for j in range(rows+1):
        t=j/rows;wid=width*np.sin(PI*t)**.75*(1+.055*np.sin(t*PI*18))
        for i in range(cols+1):
            s=i/cols*2-1
            v.append([s*wid,.007*np.sin(PI*t)-.003*abs(s)+.0015*np.sin(t*13)*s,length*t]);uv.append([i/cols,t])
    v=np.array(v)@rotation(*angles).T+base;f=[]
    for j in range(rows):
        for i in range(cols):
            a=j*(cols+1)+i;b=a+cols+1;f.extend([(a,b,a+1),(a+1,b,b+1)])
    mesh(name,v,f,uv,leaf_mat)
    gltf['materials'][leaf_mat]['doubleSided']=True
    mid=np.array([[0,.007*np.sin(PI*t)+.00025,length*t] for t in np.linspace(0,1,12)])@rotation(*angles).T+base
    tube(name+' central vein',mid,np.linspace(.00045,.00015,len(mid)),stem_mat,6)

# Real plate dimensions: diameter 34 cm, shallow bowl, rolled lip and foot ring.
profile=[(0,.007),(.07,.007),(.092,.007),(.108,.009),(.124,.013),(.14,.019),(.155,.024),(.163,.026),(.168,.0265),(.170,.0255),(.1705,.024),(.1695,.0225),(.163,.021),(.151,.018),(.136,.013),(.12,.007),(.107,.004),(.103,.002),(.102,0),(.096,0),(.095,.003),(.085,.004),(0,.004)]
# Interpolate smooth profile with Catmull-Rom, preserve Y=0.
smooth=[]
for j in range(len(profile)-1):
    p0=np.array(profile[max(0,j-1)]);p1=np.array(profile[j]);p2=np.array(profile[j+1]);p3=np.array(profile[min(len(profile)-1,j+2)])
    for t in np.linspace(0,1,4,endpoint=False):
        q=.5*((2*p1)+(-p0+p2)*t+(2*p0-5*p1+4*p2-p3)*t*t+(-p0+3*p1-3*p2+p3)*t**3)
        smooth.append((max(0,q[0]),max(0,q[1])))
smooth.append(profile[-1]);v=[];uv=[];f=[];segments=160
for j,(r,y) in enumerate(smooth):
    for i in range(segments+1):
        a=i*2*PI/segments;v.append([r*np.cos(a),y,r*np.sin(a)]);uv.append([i/segments,j/(len(smooth)-1)])
for j in range(len(smooth)-1):
    for i in range(segments):
        a=j*(segments+1)+i;b=a+segments+1;f.extend([(a,a+1,b),(a+1,b+1,b)])
mesh('Porcelain plate - rolled lip and foot',v,f,uv,plate_mat)
# A restrained glazed ring, physically thin rather than a large painted stripe.
ring=[]
for t in np.linspace(0,2*PI,193):ring.append([.165*np.cos(t),.027,.165*np.sin(t)])
tube('Hand-glazed olive rim',ring,[.00065]*len(ring),rim_mat,8)

# Composition follows clean-v2's fruit assortment, with natural sizes and asymmetry.
tip,rot=fruit('Gala apple','apple',[-.035,.053,.020],[.042,.045,.040],apple_mat,(-8,32,-12),.4)
stem('Apple woody curved stem',tip,rot)
leaf('Apple leaf',tip,.033,.010,(28,110,-20))
fruit('Navel orange','orange',[-.064,.050,-.056],[.038,.038,.037],orange_mat,(7,40,8),.8)
fruit('Small mandarin','orange',[-.003,.042,.097],[.031,.027,.031],orange_mat,(15,-30,0),1.8)
tip,rot=fruit('Blushed peach front','peach',[.065,.049,.064],[.040,.039,.037],peach_mat,(-15,-35,18),.65)
stem('Peach short stalk',tip,rot,.005)
tip,rot=fruit('Blushed peach rear','peach',[-.002,.061,-.076],[.038,.037,.038],peach_mat,(12,105,-8),1.2)
tip,rot=fruit('Ruby pomegranate','pomegranate',[.072,.061,-.029],[.043,.046,.042],pom_mat,(5,-22,-13),.2)
# Open six-point calyx: a flared, lobed crown, not six cylinders.
verts=[];uv=[];faces=[];seg=60
for j in range(7):
    t=j/6
    for i in range(seg+1):
        a=i/seg*2*PI;star=(.5+.5*np.cos(6*a))**1.3
        radius=.006*(1-.2*np.sin(PI*t))+.003*t*t
        y=t*(.008+.006*star)
        verts.append([radius*np.cos(a),y,radius*np.sin(a)]);uv.append([i/seg,t])
for j in range(6):
    for i in range(seg):
        a=j*(seg+1)+i;b=a+seg+1;faces.extend([(a,b,a+1),(a+1,b,b+1)])
mesh('Pomegranate open six-point crown',np.array(verts)@rot.T+tip,faces,uv,crown_mat)
gltf['materials'][crown_mat]['doubleSided']=True

# Branching, irregular bunch of dark grapes in the left/front quarter.
grape_positions=[]
for row,count in enumerate([4,5,5,4,3,2]):
    for k in range(count):
        x=-.101+(k-(count-1)/2)*.017+RNG.uniform(-.002,.002)
        z=-.015+row*.019+RNG.uniform(-.003,.003)
        y=.032+.012*np.sin(k*1.9+row*.6)+.007*(1-row/7)
        r=RNG.uniform(.010,.013)
        grape_positions.append([x,y,z])
        fruit(f'Grape {row}-{k}','grape',[x,y,z],[r*.93,r*1.15,r],grape_mat,(RNG.uniform(-25,25),RNG.uniform(0,360),RNG.uniform(-25,25)),k+row,28,20)
branch=np.array([[-.092,.069,-.034],[-.096,.058,-.013],[-.101,.049,.016],[-.102,.034,.053],[-.104,.024,.084]])
tube('Grape main woody branch',branch,[.0023,.002,.0016,.0012,.0007],stem_mat)
for i,p in enumerate(grape_positions[::3]):
    near=branch[np.argmin(np.linalg.norm(branch-np.array(p),axis=1))]
    tube(f'Grape pedicel {i}',[near,(near+p)/2+[0,.003,0],np.array(p)+[0,.009,0]],[.00085,.0007,.00045],stem_mat,7)
leaf('Grape leaf',[-.099,.050,-.021],.039,.022,(-10,-65,16))

# Approximate baked diffuse contact occlusion, based on the actual fruit bounds.
# It is independent of the presentation light and follows the asset into AR.
occluders=[]
for name,verts,norm,prim in mesh_records:
    if name in ['Gala apple','Navel orange','Small mandarin','Blushed peach front','Blushed peach rear','Ruby pomegranate'] or name.startswith('Grape ') and name[6:7].isdigit():
        lo=verts.min(axis=0);hi=verts.max(axis=0)
        occluders.append((name,(lo+hi)/2,np.min(hi-lo)*.47))
for name,verts,norm,prim in mesh_records:
    occlusion=np.zeros(len(verts))
    for other,center,radius in occluders:
        if other==name:continue
        delta=center-verts;distance=np.linalg.norm(delta,axis=1)
        direction=delta/np.maximum(distance[:,None],1e-8)
        facing=np.maximum(0,np.sum(norm*direction,axis=1))
        solid=1-np.sqrt(1-np.minimum(.999,(radius/np.maximum(distance,1e-6))**2))
        occlusion+=solid*facing
    if name!='Porcelain plate - rolled lip and foot':
        occlusion+=np.maximum(0,-norm[:,1])*.38*np.exp(-np.maximum(0,verts[:,1]-.01)/.08)
    ao=np.clip(1-.85*occlusion,.28,1)
    color=np.column_stack([np.repeat(np.round(ao[:,None]*255),3,axis=1),np.full(len(verts),255)])
    prim['attributes']['COLOR_0']=accessor(color,'VEC4',5121)

gltf['buffers']=[{'byteLength':byte_offset}]
j=json.dumps(gltf,separators=(',',':')).encode();j+=b' '*((-len(j))%4)
binary=b''.join(chunks)
result=struct.pack('<4sII',b'glTF',2,12+8+len(j)+8+len(binary))+struct.pack('<I4s',len(j),b'JSON')+j+struct.pack('<I4s',len(binary),b'BIN\0')+binary
OUT.write_bytes(result)
print(f'BUILT {OUT.name}: {len(result)} bytes, {len(gltf["meshes"])} meshes, {len(gltf["images"])} embedded PBR maps')
