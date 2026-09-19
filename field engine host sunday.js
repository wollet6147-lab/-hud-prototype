'use strict';
/* F1rstHUD FIELD ENGINE HOST — runs the FROZEN Ahead Lab engine verbatim in the browser without an iframe.
   2026-09-18 (experimental host candidate): also exposes `api.internals` — the same LAB surface the replay loader exposes (tile/graph plumbing) so a
   host module (field_tile_supply.js, hwy_prefetch.js) can replace ensureGraph. Nothing about snap/chain/exit selection is reachable through it.
   Mirrors /tmp/ahead/runner.js: the lab HTML is fetched, its SHA-256 verified, its <script> extracted unchanged and
   evaluated with a stub `document` (real document is used only for downloads). No engine code is copied or forked. */
(function(root,factory){ if(typeof module==='object'&&module.exports) module.exports=factory(); else root.F1Host=factory(); })(typeof self!=='undefined'?self:this,function(){
const TAIL='\n;api.step=step;api.resetEngine=resetEngine;api.setMode=m=>{MODE=m;};api.getMode=()=>MODE;api.setFast=v=>{FAST=v;};api.getORIGIN=()=>ORIGIN;api.setOrigin=(a,b)=>setOrigin(a,b);api.REPLAY=REPLAY;api.PKG=PKG;api.TILES=TILES;api.CTR=CTR;api.loadPackageObject=loadPackageObject;api.buildPackage=buildPackage;api.log=log;'
 +'\n;(function(){ const ensureGraph0=ensureGraph; api.internals={getP:()=>P,tileSetFor:(a,b,c,d)=>tileSetFor(a,b,c,d),getTile:(z,x,y)=>getTile(z,x,y),buildGraph:(k,t)=>buildGraph(k,t),tileGroundSize:(la,z)=>tileGroundSize(la,z),lon2tx:(lo,z)=>lon2tx(lo,z),lat2ty:(la,z)=>lat2ty(la,z),mpd:()=>({lon:MPD_LON,lat:MPD_LAT}),toXY:(la,lo)=>toXY(la,lo),getGraph:()=>GRAPH,getGraphKey:()=>GRAPH_KEY,setGraph:(g,k)=>{GRAPH=g;GRAPH_KEY=k;},ensureGraph0,setEnsureGraph:f=>{ensureGraph=f||ensureGraph0;},getEngine:()=>ENGINE,lruPut:(k,v)=>lruPut(k,v),lruGet:k=>lruGet(k),decodeTile:b=>decodeTile(b),inflight:()=>inflight}; })();';
async function sha256Hex(text){ if(typeof crypto!=='undefined'&&crypto.subtle){ const b=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(text)); return [...new Uint8Array(b)].map(x=>x.toString(16).padStart(2,'0')).join(''); } return require('crypto').createHash('sha256').update(text).digest('hex'); }
function mkEl(){ return {value:'',textContent:'',innerHTML:'',classList:{add(){},remove(){},toggle(){},contains(){return false;}},appendChild(){},remove(){},style:{},getBoundingClientRect:()=>({width:800,height:340}),getContext:()=>({setTransform(){},clearRect(){},beginPath(){},moveTo(){},lineTo(){},arc(){},stroke(){},fill(){},fillText(){},fillRect(){},strokeRect(){},save(){},restore(){},translate(){},scale(){}}),onclick:null,files:[],click(){},addEventListener(){},checked:false,disabled:false}; }
function stubDocument(realDoc,tokenProvider){ const els={};
  return {getElementById:id=>{ if(id==='token') return {value:tokenProvider()||''}; return els[id]||(els[id]=mkEl()); },querySelector:()=>mkEl(),querySelectorAll:()=>[],
    createElement:tag=>realDoc?realDoc.createElement(tag):mkEl(), body:{appendChild:n=>{ if(realDoc&&n&&n.nodeType) realDoc.body.appendChild(n); }}, addEventListener(){}, removeEventListener(){}, hidden:false, visibilityState:'visible'}; }
/* loadFrozenEngine(htmlText, {expectedSha, tokenProvider, realDocument}) -> api  (throws if the hash does not match) */
async function loadFrozenEngine(htmlText,o){ o=o||{}; const sha=await sha256Hex(htmlText);
  if(o.expectedSha&&sha!==o.expectedSha) throw new Error('engine hash mismatch: got '+sha.slice(0,16)+'… expected '+o.expectedSha.slice(0,16)+'…');
  const src=htmlText.split('<script>').slice(1).join('<script>').split('</script>')[0];
  const api={sha}; const doc=stubDocument(o.realDocument||null,o.tokenProvider||(()=>''));
  const fn=new Function('document','api','localStorage','window',src+TAIL);
  fn(doc,api,o.localStorage||(typeof localStorage!=='undefined'?localStorage:{getItem:()=>null,setItem(){}}),o.window||(typeof window!=='undefined'?window:{isSecureContext:true}));
  return api; }
/* fix shape identical to the lab's recordFix() */
function fixFromCoords(c,t){ return {t:t||Date.now(),lat:c.latitude,lon:c.longitude,acc:c.accuracy,heading:(c.heading!=null&&!Number.isNaN(c.heading))?c.heading:null,speed:(c.speed!=null&&!Number.isNaN(c.speed))?c.speed:null}; }
/* liveDispatch semantics from the lab (busy/pending, drop intermediate fixes) */
function makeDispatcher(api,onResult,onError){ let busy=false,pending=null,dropped=0; async function dispatch(f){ if(busy){ if(pending) dropped++; pending=f; return; } busy=true; try{ onResult(await api.step(f),f); }catch(e){ onError&&onError(e,f); } busy=false; if(pending){ const p=pending; pending=null; dispatch(p); } } dispatch.dropped=()=>dropped; return dispatch; }
return {loadFrozenEngine,fixFromCoords,makeDispatcher,sha256Hex};
});
