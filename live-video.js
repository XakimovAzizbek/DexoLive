import {clock,fmt,guard,db,ref,set,remove,onValue,onDisconnect,toast} from "./firebase.js";
import {dial} from "./rtc.js";
const feed=document.getElementById("feed"),empty=document.getElementById("empty");
let me,user,cur=null,conn=null,tok=0,g=null;const slides={};

const io=new IntersectionObserver(es=>es.forEach(e=>{
  if(e.intersectionRatio>=.7)activate(e.target);
  else if(cur===e.target&&e.intersectionRatio<.3)deactivate();
}),{threshold:[.3,.7]});

guard(u=>{
  user=u;me=u.uid;
  onValue(ref(db,"lives"),sn=>{
    const v=sn.val()||{};
    Object.keys(slides).forEach(k=>{if(!v[k]){if(cur===slides[k])deactivate();slides[k].remove();delete slides[k]}});
    Object.keys(v).filter(k=>k!==me&&!slides[k]).sort(()=>Math.random()-.5).forEach(k=>make(k,v[k]));
    empty.hidden=!!Object.keys(slides).length;
  });
});

function make(k,d){
  const s=document.createElement("section");s.className="slide";s.uid=k;
  s.innerHTML=`<video class="v main" playsinline autoplay muted></video><video class="v g2 mirror" playsinline autoplay muted></video>
  <div class="info"><img class="av" alt=""><b></b><span class="dot">● JONLI</span><span class="tm"></span></div>
  <div class="side"><button class="rb plus">+</button><button class="rb snd">🔇</button></div>`;
  s.querySelector("b").textContent=d.name||"Mehmon";
  s.querySelector(".av").src=d.photo||"";
  s.querySelector(".plus").onclick=()=>request(s);
  s.querySelector(".snd").onclick=e=>{const v=s.querySelector(".main");v.muted=!v.muted;e.target.textContent=v.muted?"🔇":"🔊"};
  s.ts=d.ts||0;slides[k]=s;feed.append(s);io.observe(s);
}

function activate(s){
  if(cur===s)return;deactivate();cur=s;const t=++tok,v=s.querySelector(".main");
  dial(s.uid,me,"v",{onTrack:st=>{v.srcObject=st;v.play().catch(()=>{})}}).then(c=>{if(t!==tok)c.close();else conn=c});
}
function deactivate(){
  tok++;leave();if(conn){conn.close();conn=null}
  if(cur){cur.querySelector(".main").srcObject=null;cur=null}
}

async function request(s){
  if(s!==cur)return;if(g)return leave();
  const rr=ref(db,`requests/${s.uid}/${me}`),btn=s.querySelector(".plus");
  g={s,rr,btn,unsub:null,conn:null,stream:null};
  await set(rr,{status:"pending",name:user.displayName,photo:user.photoURL||"",ts:Date.now()});
  onDisconnect(rr).remove();btn.textContent="⏳";
  const me_g=g;
  g.unsub=onValue(rr,async sn=>{
    const r=sn.val();if(g!==me_g)return;
    if(!r||r.status=="ended"){toast("Efir egasi qo'ng'iroqni tugatdi");leave()}
    else if(r.status=="rejected"){toast("So'rov rad etildi");leave()}
    else if(r.status=="accepted"&&!me_g.conn){
      try{
        me_g.stream=await navigator.mediaDevices.getUserMedia({video:{facingMode:"user"},audio:true});
        if(g!==me_g){me_g.stream.getTracks().forEach(t=>t.stop());return}
        s.querySelector(".g2").srcObject=me_g.stream;s.classList.add("split");btn.textContent="✕";
        me_g.conn=await dial(s.uid,me,"g",{stream:me_g.stream});
      }catch(e){toast("Kamera/mikrofonga ruxsat bering");leave()}
    }
  });
}
function leave(){
  if(!g)return;const x=g;g=null;
  x.unsub&&x.unsub();x.conn&&x.conn.close();
  x.stream&&x.stream.getTracks().forEach(t=>t.stop());
  remove(x.rr);x.s.classList.remove("split");x.s.querySelector(".g2").srcObject=null;x.btn.textContent="+";
}
addEventListener("pagehide",()=>{leave();conn&&conn.close()});
setInterval(()=>{const n=Date.now()+clock.off;Object.values(slides).forEach(s=>{if(s.ts)s.querySelector(".tm").textContent="⏱ "+fmt(n-s.ts)})},1000);
