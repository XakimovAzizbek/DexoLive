import {initializeApp} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {getAuth,GoogleAuthProvider,signInWithPopup,onAuthStateChanged,signOut} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import {getDatabase} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";
export {ref,set,update,remove,push,onValue,onChildAdded,onDisconnect} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";
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
