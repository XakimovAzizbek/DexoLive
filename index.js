import {auth,onAuthStateChanged,signOut} from "./firebase.js";
const $=id=>document.getElementById(id);
onAuthStateChanged(auth,u=>{
  $("u").hidden=$("out").hidden=!u;$("in").hidden=!!u;
  if(u){$("n").textContent=u.displayName;$("p").src=u.photoURL||""}
});
$("out").onclick=()=>signOut(auth);
