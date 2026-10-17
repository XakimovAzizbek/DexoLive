import {guard,db,ref,set,update,remove,onValue,onDisconnect,toast} from "./firebase.js";
import {listen} from "./rtc.js";
const $=id=>document.getElementById(id);
let user,stream,srv,unReq,guest=null,pend=null,busy=false;

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
    await Promise.race([
      set(ref(db,"lives/"+id),{name:user.displayName||"Mehmon",photo:user.photoURL||"",ts:Date.now()}),
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
  }catch(e){
    $("go").textContent="Efirni boshlash";
    toast("Xato: "+(e.code||e.message));
  }
  busy=false;
};
function stopLive(){
  endGuest();unReq&&unReq();unReq=null;srv.stop();srv=null;
  const id=user.uid;["lives","requests"].forEach(p=>remove(ref(db,p+"/"+id)));
  $("go").textContent="Efirni boshlash";$("go").classList.remove("red");$("live").hidden=true;$("req").hidden=true;
}
$("yes").onclick=()=>{
  if(!pend)return;guest=pend;$("req").hidden=true;
  update(ref(db,`requests/${user.uid}/${guest}`),{status:"accepted"});
  $("stage").classList.add("split");$("end").hidden=false;
};
$("no").onclick=()=>{if(pend){update(ref(db,`requests/${user.uid}/${pend}`),{status:"rejected"});$("req").hidden=true}};
$("end").onclick=()=>{if(guest){update(ref(db,`requests/${user.uid}/${guest}`),{status:"ended"});endGuest()}};
$("mic").onclick=()=>{if(!stream)return;const t=stream.getAudioTracks()[0];t.enabled=!t.enabled;$("mic").textContent=t.enabled?"🎤":"🔇"};
addEventListener("pagehide",()=>{if(srv)stopLive()});
