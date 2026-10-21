// Yuz effektlari (toj, ko'zoynak, mo'ylov...). MediaPipe yuzni topadi, rasmlarni kanvasga chizamiz.
const CDN="https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14";
const MODEL="https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task";
export const FX=[["none","❌"],["crown","👑"],["partyhat","🥳"],["catears","🐱"],["glasses","😎"],["hearteyes","😍"],["mustache","🥸"],["clownnose","🤡"]];

// Effekt rasmlari (SVG, o'zimiz chizganmiz)
const S=(w,h,b)=>`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">${b}</svg>`;
const SVG={
 crown:S(200,120,`<defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffe066"/><stop offset="1" stop-color="#e0a800"/></linearGradient></defs><path d="M10 112V30l45 40 45-60 45 60 45-40v82z" fill="url(#g)" stroke="#b8860b" stroke-width="6" stroke-linejoin="round"/><rect x="10" y="92" width="180" height="20" fill="#f5b700" stroke="#b8860b" stroke-width="4"/><g fill="#ff3b5c"><circle cx="55" cy="102" r="6"/><circle cx="100" cy="102" r="6"/><circle cx="145" cy="102" r="6"/></g><g fill="#fff59d"><circle cx="10" cy="30" r="8"/><circle cx="100" cy="10" r="8"/><circle cx="190" cy="30" r="8"/></g>`),
 partyhat:S(140,180,`<path d="M70 12l58 158H12z" fill="#ec4899" stroke="#8b5cf6" stroke-width="5" stroke-linejoin="round"/><path d="M40 100l60 0M28 135l84 0" stroke="#ffe066" stroke-width="8"/><g fill="#8b5cf6"><circle cx="70" cy="70" r="6"/><circle cx="50" cy="118" r="6"/><circle cx="90" cy="118" r="6"/><circle cx="38" cy="152" r="6"/><circle cx="102" cy="152" r="6"/></g><circle cx="70" cy="12" r="12" fill="#ffe066"/>`),
 catears:S(300,120,`<path d="M20 120L40 10l70 70z" fill="#555" stroke="#222" stroke-width="5" stroke-linejoin="round"/><path d="M45 100l8-55 38 35z" fill="#ff8fb1"/><path d="M280 120L260 10l-70 70z" fill="#555" stroke="#222" stroke-width="5" stroke-linejoin="round"/><path d="M255 100l-8-55-38 35z" fill="#ff8fb1"/>`),
 glasses:S(200,52,`<g fill="#000"><rect x="0" y="4" width="200" height="12"/><rect x="8" y="16" width="76" height="12"/><rect x="16" y="28" width="60" height="12"/><rect x="24" y="40" width="44" height="10"/><rect x="116" y="16" width="76" height="12"/><rect x="124" y="28" width="60" height="12"/><rect x="132" y="40" width="44" height="10"/></g><g fill="#fff"><rect x="24" y="18" width="12" height="8"/><rect x="36" y="26" width="12" height="8"/><rect x="48" y="18" width="12" height="8"/><rect x="132" y="18" width="12" height="8"/><rect x="144" y="26" width="12" height="8"/><rect x="156" y="18" width="12" height="8"/></g>`),
 heart:S(100,90,`<path d="M50 86C10 56 0 36 0 22 0 9 11 0 25 0c11 0 21 6 25 15C54 6 64 0 75 0c14 0 25 9 25 22 0 14-10 34-50 64z" fill="#ff3b5c"/><ellipse cx="26" cy="20" rx="9" ry="6" fill="#fff" opacity=".6"/>`),
 mustache:S(200,70,`<path d="M100 30C85 8 50 5 25 20 10 28 5 42 12 56c2-6 9-14 24-16 20-2 44 10 64 0 20 10 44-2 64 0 15 2 22 10 24 16 7-14 2-28-13-36C150 5 115 8 100 30z" fill="#2b1b0e"/>`),
 nose:S(100,100,`<circle cx="50" cy="50" r="46" fill="#ff2d2d" stroke="#b30000" stroke-width="5"/><ellipse cx="34" cy="34" rx="12" ry="8" fill="#fff" opacity=".6"/>`)
};
const imgs={};
function img(k){
  if(!imgs[k]){const i=new Image();i.src="data:image/svg+xml;utf8,"+encodeURIComponent(SVG[k]);imgs[k]=i}
  return imgs[k];
}

let lm=null,loading=null;
function ensure(){
  if(lm)return Promise.resolve(lm);
  if(!loading)loading=(async()=>{
    const {FaceLandmarker,FilesetResolver}=await import(CDN+"/vision_bundle.mjs");
    const fs=await FilesetResolver.forVisionTasks(CDN+"/wasm");
    const mk=d=>FaceLandmarker.createFromOptions(fs,{baseOptions:{modelAssetPath:MODEL,delegate:d},runningMode:"VIDEO",numFaces:1});
    try{lm=await mk("GPU")}catch(e){lm=await mk("CPU")}
    return lm;
  })().catch(e=>{loading=null;throw e});
  return loading;
}

const vid=document.createElement("video"),cv=document.createElement("canvas"),ctx=cv.getContext("2d");
vid.muted=true;vid.playsInline=true;
let cur="none",raf=0,out=null,running=false,last=-1,res=null;
const P=(l,i)=>({x:l[i].x*cv.width,y:l[i].y*cv.height});
const mid=(a,b)=>({x:(a.x+b.x)/2,y:(a.y+b.y)/2});
const dist=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
function put(k,c,w,ang,ay=.5){
  const im=img(k);if(!im.complete||!im.naturalWidth)return;
  const h=w*im.naturalHeight/im.naturalWidth;
  ctx.save();ctx.translate(c.x,c.y);ctx.rotate(ang);ctx.drawImage(im,-w/2,-h*ay,w,h);ctx.restore();
}
function render(){
  if(!running)return;
  raf=requestAnimationFrame(render);
  if(vid.readyState<2)return;
  ctx.drawImage(vid,0,0,cv.width,cv.height);
  if(vid.currentTime!==last){last=vid.currentTime;try{res=lm.detectForVideo(vid,performance.now())}catch(e){res=null}}
  const l=res&&res.faceLandmarks&&res.faceLandmarks[0];if(!l)return;
  const L=P(l,33),R=P(l,263),roll=Math.atan2(R.y-L.y,R.x-L.x),Wf=dist(P(l,234),P(l,454));
  const eL=mid(P(l,33),P(l,133)),eR=mid(P(l,263),P(l,362)),De=dist(eL,eR),T=P(l,10);
  const up={x:Math.sin(roll),y:-Math.cos(roll)},top=k=>({x:T.x+up.x*Wf*k,y:T.y+up.y*Wf*k});
  switch(cur){
   case "crown":put("crown",top(.04),Wf*.95,roll,.95);break;
   case "partyhat":put("partyhat",top(.03),Wf*.7,roll,.95);break;
   case "catears":put("catears",top(.02),Wf*1.1,roll,.8);break;
   case "glasses":put("glasses",mid(eL,eR),De*2.1,roll);break;
   case "hearteyes":put("heart",eL,De*.6,roll);put("heart",eR,De*.6,roll);break;
   case "mustache":put("mustache",mid(P(l,164),P(l,0)),dist(P(l,61),P(l,291))*1.7,roll,.4);break;
   case "clownnose":put("nose",P(l,1),Wf*.24,roll);break;
  }
}
async function startFx(rawTrack,id){
  await ensure();
  Object.keys(SVG).forEach(img);
  stopFx();cur=id;
  vid.srcObject=new MediaStream([rawTrack]);await vid.play();
  if(!vid.videoWidth)await new Promise(r=>{vid.onloadedmetadata=r});
  const s=Math.min(1,720/Math.max(vid.videoWidth,vid.videoHeight));
  cv.width=Math.round(vid.videoWidth*s);cv.height=Math.round(vid.videoHeight*s);
  out=cv.captureStream(30).getVideoTracks()[0];
  running=true;last=-1;res=null;render();
  return out;
}
function stopFx(){running=false;cancelAnimationFrame(raf);if(out){out.stop();out=null}vid.srcObject=null}

// fx.set(xomKameraTreki, effektId) -> yuboriladigan video trek (effekt bo'lmasa xom trekning o'zi)
export function fxController(){
  let id="none";
  return{
    get id(){return id},
    async set(raw,newId){
      id=newId;
      if(id==="none"||!raw){stopFx();return raw}
      if(out&&vid.srcObject&&vid.srcObject.getVideoTracks()[0]===raw){cur=id;return out}
      return startFx(raw,id);
    },
    stop(){stopFx();id="none"}
  };
}
export function buildFxPanel(onPick){
  const p=document.createElement("div");p.className="fxp";p.hidden=true;
  FX.forEach(([id,ic])=>{
    const b=document.createElement("button");b.className="fxi"+(id=="none"?" on":"");b.textContent=ic;
    b.onclick=()=>{p.querySelectorAll(".fxi").forEach(x=>x.classList.toggle("on",x===b));onPick(id)};
    p.append(b);
  });
  return p;
}
