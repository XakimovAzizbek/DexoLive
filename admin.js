import {guard,ADMIN,db,ref,set,remove,onValue,toast,clock} from "./firebase.js";
const $=id=>document.getElementById(id);
function el(tag,cls,text,p){const e=document.createElement(tag);if(cls)e.className=cls;if(text!=null)e.textContent=text;if(p)p.append(e);return e}
let lives={},reports={},bans={};

guard(u=>{
  if(u.uid!==ADMIN){location.replace("index.html");return}
  const err=e=>toast("Xato: "+e.code);
  onValue(ref(db,"lives"),s=>{lives=s.val()||{};draw()},err);
  onValue(ref(db,"reports"),s=>{reports=s.val()||{};draw()},err);
  onValue(ref(db,"bans"),s=>{bans=s.val()||{};draw()},err);
});

const stop=async h=>{await remove(ref(db,"lives/"+h));await remove(ref(db,"calls/"+h))};
async function ban(h,name,hours){
  const until=hours===-1?-1:Date.now()+clock.off+hours*3600000;
  try{await set(ref(db,"bans/"+h),{until,name,ts:Date.now()});await stop(h);toast("Bloklandi ✅")}
  catch(e){toast("Xato: "+(e.code||e.message))}
}
const when=b=>b.until===-1?"Umrbod":(b.until>Date.now()+clock.off?"Tugashi: ":"Muddati tugagan: ")+(b.until===-1?"":new Date(b.until).toLocaleString());

function draw(){
  const list=$("list");list.textContent="";
  const ids=[...new Set([...Object.keys(lives),...Object.keys(reports)])];
  if(!ids.length)el("small","","Hozircha efir ham, shikoyat ham yo'q",list);
  ids.sort((a,b)=>Object.keys(reports[b]||{}).length-Object.keys(reports[a]||{}).length).forEach(h=>{
    const rs=Object.values(reports[h]||{}),live=lives[h];
    const name=(live&&live.name)||(rs[0]&&rs[0].hostName)||h;
    const c=el("div","card","",list);
    el("b","",name+(live?"  ● JONLI":"")+(rs.length?"  🚩 "+rs.length:""),c);
    el("small","","UID: "+h,c);
    if(rs.length){
      const cnt={};rs.forEach(r=>cnt[r.reason]=(cnt[r.reason]||0)+1);
      el("small","",Object.entries(cnt).map(([k,v])=>k+": "+v).join(" • "),c);
    }
    if(bans[h])el("small","","🚫 "+when(bans[h]),c);
    const r1=el("div","row","",c),inp=el("input","in","",r1);
    inp.type="number";inp.min="0";inp.placeholder="soat";inp.inputMode="decimal";
    const tb=el("button","sm no","⏱ Vaqtincha",r1);
    tb.onclick=()=>{const hrs=parseFloat(inp.value);if(!(hrs>0))return toast("Soatni yozing (masalan 10)");ban(h,name,hrs)};
    const pb=el("button","sm no","♾ Umrbod",r1);
    pb.onclick=()=>{if(confirm(name+" umrbod bloklansinmi?"))ban(h,name,-1)};
    const r2=el("div","row","",c);
    if(live){const sb=el("button","sm gray","⏹ Efirni to'xtatish",r2);sb.onclick=()=>stop(h)}
    if(rs.length){const cb=el("button","sm gray","🧹 Shikoyatlarni tozalash",r2);cb.onclick=()=>remove(ref(db,"reports/"+h))}
  });
  const bl=$("bans");bl.textContent="";
  const bi=Object.entries(bans);
  if(!bi.length)el("small","","Bloklanganlar yo'q",bl);
  bi.forEach(([h,b])=>{
    const c=el("div","card","",bl);
    el("b","",b.name||h,c);el("small","","UID: "+h,c);el("small","",when(b),c);
    const ub=el("button","sm ok","Blokdan chiqarish",c);
    ub.onclick=()=>remove(ref(db,"bans/"+h));
  });
}
