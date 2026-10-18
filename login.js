import {emailLogin,emailRegister,resetPass,login,auth,onAuthStateChanged} from "./firebase.js";
const $=id=>document.getElementById(id);
let mode="in",busy=false;
const MSG={
  "auth/invalid-email":"Email noto'g'ri yozilgan",
  "auth/email-already-in-use":"Bu email band. «Kirish» bo'limidan kiring",
  "auth/weak-password":"Parol kamida 6 ta belgi bo'lsin",
  "auth/invalid-credential":"Email yoki parol noto'g'ri",
  "auth/wrong-password":"Email yoki parol noto'g'ri",
  "auth/user-not-found":"Email yoki parol noto'g'ri",
  "auth/too-many-requests":"Juda ko'p urinish. Birozdan keyin qayta urinib ko'ring",
  "auth/network-request-failed":"Internet yo'q yoki sekin",
  "auth/operation-not-allowed":"Email/parol Firebase'da yoqilmagan"
};
const say=(t,ok)=>{$("err").textContent=t;$("err").style.color=ok?"#4ade80":"#f87171"};
const err=e=>say(MSG[e.code]||"Xato: "+(e.code||e.message));
function setMode(m){
  mode=m;$("name").hidden=m=="in";
  $("tin").classList.toggle("on",m=="in");$("tup").classList.toggle("on",m=="up");
  $("go").textContent=m=="in"?"Kirish":"Ro'yxatdan o'tish";
  $("pw").autocomplete=m=="in"?"current-password":"new-password";say("");
}
$("tin").onclick=()=>setMode("in");$("tup").onclick=()=>setMode("up");
onAuthStateChanged(auth,u=>{if(u&&!busy)location.replace("index.html")});
$("go").onclick=async()=>{
  const e=$("em").value.trim(),p=$("pw").value,n=$("name").value.trim();
  if(!e||!p)return say("Email va parolni yozing");
  if(mode=="up"&&n.length<2)return say("Ismingizni yozing");
  busy=true;$("go").disabled=true;say("");
  try{
    if(mode=="up")await emailRegister(n,e,p);else await emailLogin(e,p);
    location.replace("index.html");
  }catch(x){busy=false;$("go").disabled=false;err(x)}
};
$("pw").onkeydown=e=>{if(e.key=="Enter")$("go").click()};
$("fg").onclick=async()=>{
  const e=$("em").value.trim();if(!e)return say("Avval email yozing");
  try{await resetPass(e);say("Parolni tiklash xati emailingizga yuborildi (spam papkani ham tekshiring)",1)}catch(x){err(x)}
};
$("g").onclick=()=>login().catch(err);
