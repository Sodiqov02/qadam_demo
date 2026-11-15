const {test}=require('node:test');
const assert=require('node:assert/strict');
const vm=require('node:vm');
const fs=require('node:fs');
const base='https://sodiqov02.github.io/qadam_demo/3d/';
function setup({quota=false}={}) {
 const handlers={},stored=new Map();let requests=0,offline=false;
 const cache={match:async r=>stored.get(r.url)?.clone(),put:async (r,v)=>{if(quota)throw Error('quota');stored.set(r.url,new Response(await v.arrayBuffer(),{status:v.status}));}};
 const context={URL,Map,Promise,self:{location:{origin:new URL(base).origin},addEventListener:(n,f)=>handlers[n]=f,skipWaiting:async()=>{},clients:{claim:async()=>{}}},caches:{open:async()=>cache,keys:async()=>[],delete:async()=>{}},fetch:async r=>{requests++;if(offline)throw Error('offline');return new Response('complete-model',{status:r.url.includes('missing')?404:200});}};
 vm.runInNewContext(fs.readFileSync(__dirname+'/../sw.js','utf8'),context);
 return {stored,count:()=>requests,offline:()=>offline=true,async load(path,{range=false}={}){let result;const waits=[];const request=new Request(new URL(path,base),range?{headers:{range:'bytes=0-50'}}:{});handlers.fetch({request,respondWith:p=>result=p,waitUntil:p=>waits.push(p)});if(!result)return null;const response=await result;await Promise.all(waits);return response;}};
}
test('repeat model open comes from persistent cache, including offline',async()=>{
 const env=setup();assert.equal(await (await env.load('assets/osh-fast.glb')).text(),'complete-model');env.offline();assert.equal(await (await env.load('assets/osh-fast.glb')).text(),'complete-model');assert.equal(env.count(),1);
});
test('models do not prefetch one another or USDZ; USDZ is cached only on request',async()=>{
 const env=setup();await env.load('assets/osh-fast.glb');assert.equal(env.stored.size,1);await env.load('assets/fruits-fast.usdz');assert.equal(env.stored.size,2);assert.equal(env.count(),2);
});
test('cache quota failure preserves successful online response',async()=>{
 const env=setup({quota:true});assert.equal(await (await env.load('assets/osh-fast.glb')).text(),'complete-model');assert.equal(env.stored.size,0);
});
test('HTML, unrelated resources and range requests bypass cache',async()=>{
 const env=setup();for(const p of ['plov/','../data/menu.json','assets/osh.glb'])assert.equal(await env.load(p),null);assert.equal(await env.load('assets/osh-fast.glb',{range:true}),null);assert.equal(env.count(),0);
});
