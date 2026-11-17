import * as THREE from "three";

const ASSET = "https://2020tiamo2020-del.github.io/Tiamo-Mohamad-Portfolio-ULTIMATE/";
const worlds = [
  {name:"AI DIMENSION",desc:"Worlds imagined with artificial intelligence — concepts, campaigns and visual experiments.",folder:"images",items:Array.from({length:15},(_,i)=>({title:`AI CREATION ${String(i+1).padStart(2,"0")}`,image:`images/project${i+1}.jpg`}))},
  {name:"VISUAL REALITY",desc:"Photo compositing and Photoshop artistry — reality reshaped, detail by detail.",folder:"images",items:Array.from({length:8},(_,i)=>({title:`VISUAL ART ${String(i+1).padStart(2,"0")}`,image:`images/pm${i+1}.jpg`}))},
  {name:"MOTION CORE",desc:"Moving images, cinematic storytelling and visual rhythm.",items:Array.from({length:9},(_,i)=>({title:`CINEMATIC ${String(i+1).padStart(2,"0")}`,image:`Cinematic/cinematic${i}.jpg`,video:`Cinematic/cinematic${i}.webm`}))},
  {name:"VFX REALM",desc:"Visual effects, atmosphere and impossible worlds made believable.",items:Array.from({length:6},(_,i)=>({title:`VFX SEQUENCE ${String(i+1).padStart(2,"0")}`,image:`VFX/rm${i}.jpg`,video:`VFX/rm${i}.webm`}))},
  {name:"THE CREATOR",desc:"Behind the worlds: the artist, the process and the creative vision.",items:[{title:"TIAMO MOHAMAD",image:"images/tiamo.jpg"}]}
];

const canvas=document.querySelector("#world");
const scene=new THREE.Scene();
scene.fog=new THREE.FogExp2(0x080611,.018);
const camera=new THREE.PerspectiveCamera(52,innerWidth/innerHeight,.1,300);
camera.position.set(0,5,25);
const renderer=new THREE.WebGLRenderer({canvas,antialias:true,alpha:true});
renderer.setPixelRatio(Math.min(devicePixelRatio,1.7));
renderer.setSize(innerWidth,innerHeight);
renderer.outputColorSpace=THREE.SRGBColorSpace;
renderer.toneMapping=THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure=1.25;

scene.add(new THREE.AmbientLight(0x7f69a8,.75));
const key=new THREE.PointLight(0x9d65ff,95,70);key.position.set(0,8,2);scene.add(key);
const blue=new THREE.PointLight(0x246dff,70,65);blue.position.set(-13,-3,-12);scene.add(blue);
const warm=new THREE.PointLight(0x8e43ce,55,60);warm.position.set(14,2,-15);scene.add(warm);

const starGeo=new THREE.BufferGeometry(), starCount=2200, starPos=new Float32Array(starCount*3);
for(let i=0;i<starCount;i++){const r=45+Math.random()*100,a=Math.random()*Math.PI*2,b=Math.acos(2*Math.random()-1);starPos[i*3]=r*Math.sin(b)*Math.cos(a);starPos[i*3+1]=r*Math.cos(b);starPos[i*3+2]=r*Math.sin(b)*Math.sin(a);}
starGeo.setAttribute("position",new THREE.BufferAttribute(starPos,3));
const stars=new THREE.Points(starGeo,new THREE.PointsMaterial({color:0xcbb6ff,size:.13,transparent:true,opacity:.8}));
scene.add(stars);

const dustGeo=new THREE.BufferGeometry(), dustCount=900, dustPos=new Float32Array(dustCount*3);
for(let i=0;i<dustCount;i++){dustPos[i*3]=(Math.random()-.5)*65;dustPos[i*3+1]=(Math.random()-.5)*30;dustPos[i*3+2]=(Math.random()-.5)*65;}
dustGeo.setAttribute("position",new THREE.BufferAttribute(dustPos,3));
const dust=new THREE.Points(dustGeo,new THREE.PointsMaterial({color:0x9f7acb,size:.045,transparent:true,opacity:.65}));
scene.add(dust);

const hub=new THREE.Group();scene.add(hub);
const core=new THREE.Mesh(new THREE.IcosahedronGeometry(2.3,2),new THREE.MeshPhysicalMaterial({color:0x211534,metalness:.7,roughness:.23,emissive:0x30104e,emissiveIntensity:.8,clearcoat:1}));
hub.add(core);
for(let i=0;i<3;i++){const ring=new THREE.Mesh(new THREE.TorusGeometry(4.2+i*.85,.018,8,180),new THREE.MeshBasicMaterial({color:i===1?0x3984ff:0xb17bff,transparent:true,opacity:.7}));ring.rotation.set(.8+i*.45,.3+i*.7,.2);hub.add(ring);}
const halo=new THREE.Mesh(new THREE.SphereGeometry(5.8,32,24),new THREE.MeshBasicMaterial({color:0x7a36d8,transparent:true,opacity:.055,side:THREE.BackSide}));hub.add(halo);

const gates=[];
const gateColors=[0x9b68ff,0x4b8dff,0xc17bff,0x6a68ff,0xd2a5ff];
const gateGeo=new THREE.TorusGeometry(2.15,.065,12,80);
worlds.forEach((w,i)=>{
  const angle=(i/5)*Math.PI*2-Math.PI/2;
  const group=new THREE.Group();
  group.position.set(Math.cos(angle)*11,Math.sin(angle)*3.2,-8+Math.sin(angle*2)*1.5);
  group.lookAt(0,0,0);
  const glow=new THREE.Mesh(gateGeo,new THREE.MeshBasicMaterial({color:gateColors[i],transparent:true,opacity:.88}));
  group.add(glow);
  const inner=new THREE.Mesh(new THREE.CircleGeometry(1.92,64),new THREE.MeshBasicMaterial({color:gateColors[i],transparent:true,opacity:.10,side:THREE.DoubleSide}));
  group.add(inner);
  const orbit=new THREE.Mesh(new THREE.TorusGeometry(2.65,.012,6,90),new THREE.MeshBasicMaterial({color:0xc7a5ff,transparent:true,opacity:.5}));
  orbit.rotation.z=.7;group.add(orbit);
  const pLight=new THREE.PointLight(gateColors[i],16,12);group.add(pLight);
  const hit=new THREE.Mesh(new THREE.CircleGeometry(2.6,32),new THREE.MeshBasicMaterial({transparent:true,opacity:0,side:THREE.DoubleSide,depthWrite:false}));
  hit.userData.worldIndex=i;group.add(hit);
  group.userData={index:i,hit,glow};
  hub.add(group);gates.push(group);
});

const floor=new THREE.Mesh(new THREE.PlaneGeometry(180,180,1,1),new THREE.MeshBasicMaterial({color:0x20133b,wireframe:true,transparent:true,opacity:.13}));
floor.rotation.x=-Math.PI/2;floor.position.y=-8;scene.add(floor);

const raycaster=new THREE.Raycaster(), pointer=new THREE.Vector2();
let pointerDown=null,dragging=false,entered=false,activeWorld=-1,detailOpen=false, targetYaw=0,targetPitch=0,currentYaw=0,currentPitch=0, soundOn=false,audioCtx=null;
const intro=document.querySelector("#intro"),worldUI=document.querySelector("#worldUI"),detail=document.querySelector("#detail");
const statusText=document.querySelector("#statusText"),toast=document.querySelector("#toast");
function notify(msg){toast.textContent=msg;toast.classList.add("show");setTimeout(()=>toast.classList.remove("show"),2200);}
function setStatus(msg){statusText.textContent=msg;}
function showWorldUI(){worldUI.classList.add("active");worldUI.setAttribute("aria-hidden","false");}
function hideWorldUI(){worldUI.classList.remove("active");worldUI.setAttribute("aria-hidden","true");}
function travelTo(index){
  activeWorld=index;detailOpen=false;detail.classList.remove("active");detail.setAttribute("aria-hidden","true");
  document.querySelectorAll("#dimensionList button").forEach((b,i)=>b.classList.toggle("selected",i===index));
  const gate=gates[index], dest=gate.position.clone().add(new THREE.Vector3(0,0,5.5));
  const start=camera.position.clone(), end=new THREE.Vector3(dest.x*.7,dest.y*.7+1.5,dest.z+9);
  const startT=performance.now(),duration=1250;
  setStatus("TRAVELLING TO "+worlds[index].name);
  function step(now){const t=Math.min(1,(now-startT)/duration),e=1-Math.pow(1-t,4);camera.position.lerpVectors(start,end,e);camera.lookAt(gate.position);if(t<1)requestAnimationFrame(step);else openDimension(index);}
  requestAnimationFrame(step);
}
function openDimension(index){
  const w=worlds[index];detailOpen=true;
  document.querySelector("#detailEyebrow").textContent=`DIMENSION 0${index+1}`;
  document.querySelector("#detailTitle").innerHTML=w.name.replace(" "," <em>")+"</em>";
  document.querySelector("#detailDescription").textContent=w.desc;
  document.querySelector("#detailCount").textContent=`${w.items.length} SELECTED WORK${w.items.length===1?"":"S"}`;
  const grid=document.querySelector("#workGrid");grid.innerHTML="";
  w.items.forEach((item,i)=>{
    const card=document.createElement("button");card.className="work-card";card.type="button";
    const img=document.createElement("img");img.loading="lazy";img.src=ASSET+item.image;img.alt=item.title;img.onerror=()=>{img.style.opacity="0";card.classList.add("missing");};
    const label=document.createElement("span");label.textContent=item.title;
    card.append(img,label);
    if(item.video){const play=document.createElement("i");play.className="play";play.textContent="▶";card.append(play);}
    card.addEventListener("click",()=>openWork(item));
    grid.append(card);
  });
  detail.classList.add("active");detail.setAttribute("aria-hidden","false");setStatus(w.name+" / WORK ARCHIVE");
}
function openWork(item){
  if(item.video){const url=ASSET+item.video;const win=window.open(url,"_blank","noopener");if(!win)notify("Allow pop-ups to open this video.");}
  else {const url=ASSET+item.image;window.open(url,"_blank","noopener");}
}
function returnToUniverse(){
  detail.classList.remove("active");detail.setAttribute("aria-hidden","true");detailOpen=false;
  camera.position.set(0,5,25);camera.lookAt(0,0,0);setStatus("UNIVERSE MAP / SELECT A DIMENSION");
}
document.querySelector("#enterBtn").addEventListener("click",()=>{entered=true;intro.style.opacity="0";intro.style.transform="translateY(-52%) scale(.97)";setTimeout(()=>{intro.style.display="none";showWorldUI();setStatus("UNIVERSE MAP / SELECT A DIMENSION");},550);});
document.querySelectorAll("#dimensionList button").forEach(b=>b.addEventListener("click",()=>travelTo(Number(b.dataset.world))));
document.querySelector("#closeDetail").addEventListener("click",returnToUniverse);

function toggleSound(){
  soundOn=!soundOn;document.querySelector("#soundBtn").textContent=soundOn?"ON":"OFF";
  if(soundOn){try{audioCtx=audioCtx||new (window.AudioContext||window.webkitAudioContext)();const osc=audioCtx.createOscillator(),gain=audioCtx.createGain();osc.type="sine";osc.frequency.value=54;gain.gain.value=.012;osc.connect(gain);gain.connect(audioCtx.destination);osc.start();window._tiamoOsc=osc;window._tiamoGain=gain;}catch(e){notify("Ambient audio is unavailable in this browser.");}}
  else if(window._tiamoOsc){window._tiamoOsc.stop();window._tiamoOsc=null;}
}
document.querySelector("#soundBtn").addEventListener("click",toggleSound);

canvas.addEventListener("pointerdown",e=>{pointerDown={x:e.clientX,y:e.clientY};dragging=false;});
canvas.addEventListener("pointermove",e=>{if(pointerDown){const dx=e.clientX-pointerDown.x,dy=e.clientY-pointerDown.y;if(Math.abs(dx)+Math.abs(dy)>4)dragging=true;targetYaw+=dx*.0009;targetPitch=Math.max(-.35,Math.min(.35,targetPitch+dy*.0005));pointerDown={x:e.clientX,y:e.clientY};}});
canvas.addEventListener("pointerup",e=>{if(!pointerDown)return;if(!dragging&&entered&&!detailOpen){pointer.x=(e.clientX/innerWidth)*2-1;pointer.y=-(e.clientY/innerHeight)*2+1;raycaster.setFromCamera(pointer,camera);const hits=raycaster.intersectObjects(gates.map(g=>g.userData.hit));if(hits.length)travelTo(hits[0].object.userData.worldIndex);}pointerDown=null;});
canvas.addEventListener("pointercancel",()=>pointerDown=null);
canvas.addEventListener("wheel",e=>{if(!entered||detailOpen)return;camera.position.z=Math.max(13,Math.min(34,camera.position.z+e.deltaY*.012));},{passive:true});

const clock=new THREE.Clock();
function animate(){requestAnimationFrame(animate);const t=clock.getElapsedTime();hub.rotation.y+=.0007;core.rotation.x=Math.sin(t*.25)*.12;core.rotation.y+=.003;stars.rotation.y=t*.002;dust.rotation.y=-t*.003;gates.forEach((g,i)=>{g.rotation.z=Math.sin(t*.45+i)*.035;g.position.y+=Math.sin(t*.65+i*1.7)*.0018;g.userData.glow.material.opacity=.65+Math.sin(t*1.5+i)*.2;});currentYaw+=(targetYaw-currentYaw)*.04;currentPitch+=(targetPitch-currentPitch)*.04;if(entered&&!detailOpen){camera.position.x=Math.sin(currentYaw)*2.5;camera.position.y=5+currentPitch*8;camera.lookAt(0,0,0);}renderer.render(scene,camera);}
animate();
addEventListener("resize",()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight);renderer.setPixelRatio(Math.min(devicePixelRatio,1.7));});
setTimeout(()=>document.querySelector("#loader").classList.add("done"),900);
