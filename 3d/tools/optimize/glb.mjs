import {NodeIO} from '@gltf-transform/core';
import {ALL_EXTENSIONS, EXTMeshoptCompression} from '@gltf-transform/extensions';
import {MeshoptEncoder,MeshoptDecoder} from 'meshoptimizer';
import fs from 'node:fs';
import {fileURLToPath} from 'node:url';
import {reorder} from '@gltf-transform/functions';
await Promise.all([MeshoptEncoder.ready,MeshoptDecoder.ready]);
const io=new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({'meshopt.encoder':MeshoptEncoder,'meshopt.decoder':MeshoptDecoder});
const root=fileURLToPath(new URL('../../assets/',import.meta.url));
for(const name of ['osh','fruits-real-v1']) {
 const doc=await io.read(root+name+'.glb');
 await doc.transform(reorder({encoder:MeshoptEncoder,target:'size'}));
 doc.createExtension(EXTMeshoptCompression).setRequired(true).setEncoderOptions({method:EXTMeshoptCompression.EncoderMethod.QUANTIZE});
 await io.write(root+name+'-fast.glb',doc);
 const decoded=await io.read(root+name+'-fast.glb');
 const original=await io.read(root+name+'.glb');
 const signature = doc => doc.getRoot().listMeshes().map(m=>m.listPrimitives().map(p=>{
 const at=p.listSemantics().sort(),ix=p.getIndices().getArray();const result=[];
 for(let k=0;k<ix.length;k+=3){const vs=[];for(let t=0;t<3;t++)vs.push(at.map(s=>{const a=p.getAttribute(s),arr=a.getArray(),n=a.getElementSize();return Array.from(arr.slice(ix[k+t]*n,(ix[k+t]+1)*n));}).flat().join(','));result.push([vs.join('|'),[vs[1],vs[2],vs[0]].join('|'),[vs[2],vs[0],vs[1]].join('|')].sort()[0]);}
 return result.sort();}));
 if(JSON.stringify(signature(original))!==JSON.stringify(signature(decoded)))throw Error('oriented geometry/UV/normal mismatch');
 const tt=original.getRoot().listTextures(),uu=decoded.getRoot().listTextures();
 if(tt.length!==uu.length)throw Error('texture count');
 for(let i=0;i<tt.length;i++)if(!Buffer.from(tt[i].getImage()).equals(Buffer.from(uu[i].getImage())))throw Error('texture changed');
 console.log(name,fs.statSync(root+name+'.glb').size,'->',fs.statSync(root+name+'-fast.glb').size,'oriented triangles, vertex attributes and textures preserved exactly');
}
