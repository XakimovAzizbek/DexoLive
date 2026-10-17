import {login,auth,onAuthStateChanged} from "./firebase.js";
onAuthStateChanged(auth,u=>{if(u)location.replace("index.html")});
document.getElementById("g").onclick=()=>login().catch(e=>document.getElementById("err").textContent="Xato: "+e.code);
