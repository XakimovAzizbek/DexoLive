import {db,ref,set,push,remove,onValue,onChildAdded} from "./firebase.js";
const ICE={iceServers:[{urls:"stun:stun.l.google.com:19302"},{urls:"stun:stun1.l.google.com:19302"}]};
const sd=d=>({type:d.type,sdp:d.sdp});
function cand(pc){const q=[];return{
  add:c=>pc.remoteDescription?pc.addIceCandidate(c).catch(()=>{}):q.push(c),
  flush:async()=>{while(q.length)await pc.addIceCandidate(q.shift()).catch(()=>{})}}}

// Taklif beruvchi: type "v" = efirni ko'rish, "g" = mehmon bo'lib o'z videosini yuborish
export async function dial(host,me,type,{stream,onTrack}={}){
  const id=me+"_"+type,p=`calls/${host}/${id}`,pc=new RTCPeerConnection(ICE),c=cand(pc),subs=[];
  if(stream)stream.getTracks().forEach(t=>pc.addTrack(t,stream));
  else{pc.addTransceiver("video",{direction:"recvonly"});pc.addTransceiver("audio",{direction:"recvonly"})}
  pc.ontrack=e=>onTrack&&onTrack(e.streams[0]);
  pc.onicecandidate=e=>e.candidate&&push(ref(db,p+"/c1"),e.candidate.toJSON());
  await remove(ref(db,p));
  await pc.setLocalDescription(await pc.createOffer());
  await set(ref(db,p+"/offer"),sd(pc.localDescription));
  subs.push(onValue(ref(db,p+"/answer"),async s=>{
    if(s.exists()&&!pc.currentRemoteDescription){await pc.setRemoteDescription(s.val());await c.flush()}}));
  subs.push(onChildAdded(ref(db,p+"/c2"),s=>c.add(s.val())));
  return{pc,close(){subs.forEach(f=>f());pc.close();remove(ref(db,p))}};
}

// Host: kelgan takliflarga javob beradi
export function listen(host,stream,onTrack){
  const pcs={},subs=[];
  subs.push(onChildAdded(ref(db,`calls/${host}`),s=>{
    const id=s.key,type=id.split("_")[1],p=`calls/${host}/${id}`;
    subs.push(onValue(ref(db,p+"/offer"),async o=>{
      if(!o.exists()){if(pcs[id]){pcs[id].close();delete pcs[id]}return}
      if(pcs[id])return;
      const pc=pcs[id]=new RTCPeerConnection(ICE),c=cand(pc);
      pc.ontrack=e=>onTrack(e.streams[0],id);
      pc.onicecandidate=e=>e.candidate&&push(ref(db,p+"/c2"),e.candidate.toJSON());
      subs.push(onChildAdded(ref(db,p+"/c1"),x=>c.add(x.val())));
      await pc.setRemoteDescription(o.val());await c.flush();
      if(type=="v")stream.getTracks().forEach(t=>pc.addTrack(t,stream));
      await pc.setLocalDescription(await pc.createAnswer());
      await set(ref(db,p+"/answer"),sd(pc.localDescription));
    }));
  }));
  return{
    drop(id){if(pcs[id]){pcs[id].close();delete pcs[id]}remove(ref(db,`calls/${host}/${id}`))},
    replaceVideo(t){Object.values(pcs).forEach(pc=>pc.getSenders().forEach(s=>{if(s.track&&s.track.kind=="video")s.replaceTrack(t)}))},
    stop(){subs.forEach(f=>f());Object.values(pcs).forEach(p=>p.close());remove(ref(db,`calls/${host}`))}
  };
}
