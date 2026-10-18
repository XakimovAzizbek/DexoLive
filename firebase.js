import {initializeApp} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {getAuth,GoogleAuthProvider,signInWithPopup,onAuthStateChanged,signOut} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import {getDatabase,ref as _r,onValue as _o,get as _g,onChildAdded as _c,query as _q,limitToLast as _l} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";
export {ref,set,update,remove,push,onValue,onChildAdded,onDisconnect,serverTimestamp} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";
export {onAuthStateChanged,signOut};

const app=initializeApp({
  apiKey:"AIzaSyDIeG8dVbm0Yk7FR1hPzrBoD7rgDKWAFoY",
  authDomain:"user1111-c84a0.firebaseapp.com",
  databaseURL:"https://user1111-c84a0-default-rtdb.firebaseio.com",
  projectId:"user1111-c84a0",
  storageBucket:"user1111-c84a0.firebasestorage.app",
  messagingSenderId:"901723757936",
  appId:"1:901723757936:web:86de73959a6bb4700c03b5"
});
export const auth=getAuth(app), db=getDatabase(app);
export const login=()=>signInWithPopup(auth,new GoogleAuthProvider());
export const guard=cb=>onAuthStateChanged(auth,u=>u?cb(u):location.replace("login.html"));
export function toast(t){const d=document.createElement("div");d.className="toast";d.textContent=t;document.body.append(d);setTimeout(()=>d.remove(),3000)}

// Ikki barmoq bilan kattalashtirishni o'chirish
document.addEventListener("gesturestart",e=>e.preventDefault());
document.addEventListener("touchmove",e=>{if(e.touches.length>1)e.preventDefault()},{passive:false});

// Server vaqti (hamma qurilmada bir xil taymer uchun)
export const clock={off:0};
_o(_r(db,".info/serverTimeOffset"),s=>{clock.off=s.val()||0});
export const fmt=ms=>{const s=Math.max(0,Math.floor(ms/1000)),h=Math.floor(s/3600),m=String(Math.floor(s%3600/60)).padStart(2,"0"),x=String(s%60).padStart(2,"0");return(h?h+":":"")+m+":"+x};

// Admin va bloklash
export const ADMIN="CDtXaLkOGuQiNX0MRWqSsJ5DzAe2";
export async function banInfo(uid){
  const b=(await _g(_r(db,"bans/"+uid))).val();
  return b&&(b.until===-1||b.until>Date.now()+clock.off)?b:null;
}

// Chat, tomoshabinlar soni va layk (host va tomoshabin uchun umumiy)
function heart(box){
  const e=document.createElement("span");e.className="heart";
  e.textContent=["❤️","💖","💜","🧡"][Math.random()*4|0];e.style.right=(14+Math.random()*50)+"px";
  box.append(e);setTimeout(()=>e.remove(),1800);
}
function addMsg(box,m){
  const d=document.createElement("div"),b=document.createElement("b");
  d.className="msg";b.textContent=(m.name||"Mehmon")+": ";d.append(b,document.createTextNode(m.text||""));
  box.append(d);while(box.children.length>30)box.firstChild.remove();
}
export function watchSocial(h,ui){
  const seen=new Set();let first=true;
  const subs=[
    _o(_r(db,"watching/"+h),s=>{ui.views.textContent=s.size}),
    _o(_r(db,"likes/"+h),s=>{
      ui.likes.textContent=s.size;
      s.forEach(c=>{if(!seen.has(c.key)){seen.add(c.key);if(!first)heart(ui.hearts)}});
      first=false;if(ui.liked)ui.liked(s.hasChild(ui.me));
    }),
    _c(_q(_r(db,"chat/"+h),_l(30)),s=>addMsg(ui.chat,s.val()))
  ];
  return()=>{subs.forEach(f=>f());ui.chat.textContent="";ui.views.textContent=ui.likes.textContent="0"};
}
