import {clock,fmt,guard,db,ref,set,update,remove,onValue,onDisconnect,toast} from "./firebase.js";
import {listen} from "./rtc.js";
const $=id=>document.getElementById(id);
let user,stream,srv,unReq,guest=null,pend=null,busy=false,cam="user",camBusy=false,t0=0,tick=null;

guard(u=>{user=u;let first=true;onValue(ref(db,".info/connected"),x=>{if(x.val())toast("Baza bilan ulandi ✅");else if(first)setTimeout(()=>{if(!srv)toast("Baza bilan ulanish yo'q ❌")},6000);first=false});$("name").textContent=u.displayName;preview()});
async function preview(){
  try{stream=await navigator.mediaDevices.getUserMedia({video:{facingMode:"user"},audio:true});$("me").srcObject=stream}
  catch(e){toast("Kamera va mikrofonga ruxsat bering")}
}
function endGuest(){
  if(guest&&srv)srv.drop(guest+"_g");
  guest=null;$("guest").srcObject=null;$("stage").classList.remove("split");$("end").hidden=true;
}
$("go").onclick=async()=>{
  if(srv)return stopLive();
  if(busy)return;busy=true;$("go").textContent="Ulanmoqda...";
  try{
    if(!stream)await preview();
    if(!stream)throw new Error("Kamera ruxsati yo'q");
    const id=user.uid;
    t0=Date.now()+clock.off;
    await Promise.race([
      set(ref(db,"lives/"+id),{name:user.displayName||"Mehmon",photo:user.photoURL||"",ts:t0}),
      new Promise((_,j)=>setTimeout(()=>j(new Error("Database javob bermadi (Rules yoki databaseURL'ni tekshiring)")),20000))
    ]);
    ["lives","calls","requests"].forEach(p=>onDisconnect(ref(db,p+"/"+id)).remove());
    srv=listen(id,stream,(s,cid)=>{if(cid.endsWith("_g"))$("guest").srcObject=s});
    unReq=onValue(ref(db,"requests/"+id),sn=>{
      const v=sn.val()||{};
      if(guest&&!(v[guest]&&v[guest].status=="accepted"))endGuest();
      const p=Object.entries(v).find(([,r])=>r.status=="pending");
      if(p&&!guest){pend=p[0];$("rn").textContent=p[1].name;$("req").hidden=false}
      else{pend=null;$("req").hidden=true}
    },e=>toast("Xato: "+e.code));
    $("go").textContent="Efirni tugatish";$("go").classList.add("red");$("live").hidden=false;
    clearInterval(tick);const up=()=>{$("tm").textContent=fmt(Date.now()+clock.off-t0)};up();tick=setInterval(up,1000);
  }catch(e){
    $("go").textContent="Efirni boshlash";
    toast("Xato: "+(e.code||e.message));
  }
  busy=false;
};
function stopLive(){
  endGuest();unReq&&unReq();unReq=null;srv.stop();srv=null;
  const id=user.uid;["lives","requests"].forEach(p=>remove(ref(db,p+"/"+id)));
  $("go").textContent="Efirni boshlash";$("go").classList.remove("red");$("live").hidden=true;clearInterval(tick);$("req").hidden=true;
}
$("yes").onclick=()=>{
  if(!pend)return;guest=pend;$("req").hidden=true;
  update(ref(db,`requests/${user.uid}/${guest}`),{status:"accepted"});
  $("stage").classList.add("split");$("end").hidden=false;
};
$("no").onclick=()=>{if(pend){update(ref(db,`requests/${user.uid}/${pend}`),{status:"rejected"});$("req").hidden=true}};
$("end").onclick=()=>{if(guest){update(ref(db,`requests/${user.uid}/${guest}`),{status:"ended"});endGuest()}};
$("mic").onclick=()=>{if(!stream)return;const t=stream.getAudioTracks()[0];t.enabled=!t.enabled;$("mic").textContent=t.enabled?"🎤":"🔇"};

// Kamera almashtirish: oldi -> orqa -> ekran (agar brauzer qo'llasa) -> oldi
const modes=["user","environment"];
if(navigator.mediaDevices&&navigator.mediaDevices.getDisplayMedia)modes.push("screen");
const icons={user:"🤳",environment:"📷",screen:"🖥"};
async function grab(m){
  if(m=="screen"){
    const d=await navigator.mediaDevices.getDisplayMedia({video:true}),t=d.getVideoTracks()[0];
    t.onended=()=>{if(cam=="screen")nextCam()};return t;
  }
  const s=await navigator.mediaDevices.getUserMedia({video:{facingMode:{ideal:m}}});
  return s.getVideoTracks()[0];
}
async function nextCam(){
  if(camBusy||!stream)return;camBusy=true;
  for(let i=1;i<=modes.length;i++){
    const m=modes[(modes.indexOf(cam)+i)%modes.length],old=stream.getVideoTracks()[0];
    let t,mm=m;
    if(m!="screen")old.stop();
    try{t=await grab(m)}catch(e){
      if(m=="screen"){toast("Ekran ulashish ishlamadi");continue}
      try{t=await grab("user");mm="user"}catch(_){toast("Kamera ochilmadi");break}
    }
    old.onended=null;stream.removeTrack(old);stream.addTrack(t);
    cam=mm;srv&&srv.replaceVideo(t);
    $("me").srcObject=stream;$("me").classList.toggle("mirror",cam=="user");
    $("cam").textContent=icons[cam];break;
  }
  camBusy=false;
}
$("cam").onclick=nextCam;
addEventListener("pagehide",()=>{if(srv)stopLive()});
