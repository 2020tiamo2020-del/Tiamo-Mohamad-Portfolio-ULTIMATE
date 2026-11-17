import * as THREE from "three";

const BASE = "https://2020tiamo2020-del.github.io/Tiamo-Mohamad-Portfolio-ULTIMATE/";
const worlds = [
  {name:"AI DIMENSION", kicker:"IMAGINATION, REIMAGINED", title:"Artificial<br><em>imagination.</em>", desc:"Where concepts become worlds, characters and impossible visual stories.", color:0x9b69ff, assets:[
    ...Array.from({length:15},(_,i)=>({title:`AI / Visual Study ${String(i+1).padStart(2,"0")}`,path:`images/project${i+1}.jpg`,type:"image",description:"A selected visual from the Advertising & Design gallery in the source portfolio."}))
  ]},
  {name:"VISUAL REALITY", kicker:"BEYOND THE FRAME", title:"Reality,<br><em>recomposed.</em>", desc:"Photo manipulation, compositing and carefully crafted visual detail.", color:0x54c9ff, assets:[
    ...Array.from({length:8},(_,i)=>({title:`Photo Composition ${String(i+1).padStart(2,"0")}`,path:`images/pm${i+1}.jpg`,type:"image",description:"A photo manipulation study from the original portfolio gallery."}))
  ]},
  {name:"MOTION CORE", kicker:"STILLNESS IS ONLY THE START", title:"Motion in<br><em>another dimension.</em>", desc:"Cinematic reels and moving images built to hold attention.", color:0x8d9cff, assets:[
    ...Array.from({length:9},(_,i)=>({title:`Cinematic Reel ${String(i+1).padStart(2,"0")}`,path:`Cinematic/cinematic${i}.jpg`,video:`Cinematic/cinematic${i}.webm`,external:[
      "https://www.facebook.com/reel/1876850873302115","https://www.facebook.com/reel/867954499155567","https://www.facebook.com/reel/976256688152014","https://www.facebook.com/reel/1422874995924945","https://www.facebook.com/share/v/18p5iDwYZq/","https://www.facebook.com/reel/743559955488168","https://www.facebook.com/reel/776160234818518","https://www.facebook.com/reel/1536138571245345","https://www.facebook.com/reel/1163887458671137"
    ][i],type:"video",description:"A cinematic motion piece from the original portfolio gallery."}))
  ]},
  {name:"VFX REALM", kicker:"PHYSICS, BENT BY IMAGINATION", title:"The art of<br><em>the impossible.</em>", desc:"Visual effects, atmosphere and creative motion experiments.", color:0xc17bff, assets:[
    ...Array.from({length:6},(_,i)=>({title:`VFX Sequence ${String(i+1).padStart(2,"0")}`,path:`VFX/rm${i}.jpg`,video:`VFX/rm${i}.webm`,external:[
      "https://www.facebook.com/reel/1637910911175923","https://www.facebook.com/reel/1848437869396200","https://www.facebook.com/reel/1666649731363694","https://www.facebook.com/reel/3463296903818986","https://www.facebook.com/reel/25238938432408638","https://www.facebook.com/reel/960751019664003"
    ][i],type:"video",description:"A visual effects sequence from the original VFX gallery."}))
  ]},
  {name:"THE CREATOR", kicker:"THE SIGNATURE BEHIND THE WORLDS", title:"Meet the<br><em>creator.</em>", desc:"Tiamo Mohamad — Digital Media Designer, Photo Compositor and AI Art Director.", color:0xe4b7ff, assets:[
    {title:"Tiamo Mohamad",path:"images/tiamo.jpg",type:"image",description:"The creator behind Tiamo Universe and the visual portfolio."}
  ]}
];

const $ = (s)=>document.querySelector(s);
const canvas=$("#world-canvas");
const scene=new THREE.Scene();
scene.background=new THREE.Color(0x05040b);
scene.fog=new THREE.FogExp2(0x070612,0.012);
const camera=new THREE.PerspectiveCamera(52,innerWidth/innerHeight,.1,500);
camera.position.set(0,8,31);
const renderer=new THREE.WebGLRenderer({canvas,antialias:true,alpha:false,powerPreference:"high-performance"});
renderer.setPixelRatio(Math.min(devicePixelRatio,1.7));
renderer.setSize(innerWidth,innerHeight);
renderer.outputColorSpace=THREE.SRGBColorSpace;
renderer.toneMapping=THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure=1.2;

scene.add(new THREE.AmbientLight(0x8c7aaa,.6));
const keyLight=new THREE.PointLight(0x9a65ff,95,120);keyLight.position.set(0,14,5);scene.add(keyLight);
const blueLight=new THREE.PointLight(0x36bfff,65,100);blueLight.position.set(-18,4,-15);scene.add(blueLight);

const starGeo=new THREE.BufferGeometry(), starCount=1700, starPos=new Float32Array(starCount*3);
for(let i=0;i<starCount;i++){const r=65+Math.random()*115,a=Math.random()*Math.PI*2,b=Math.acos(2*Math.random()-1);starPos[i*3]=r*Math.sin(b)*Math.cos(a);starPos[i*3+1]=r*Math.cos(b);starPos[i*3+2]=r*Math.sin(b)*Math.sin(a)}
starGeo.setAttribute("position",new THREE.BufferAttribute(starPos,3));
const stars=new THREE.Points(starGeo,new THREE.PointsMaterial({color:0xbdaaff,size:.16,transparent:true,opacity:.72,sizeAttenuation:true}));scene.add(stars);

const floor=new THREE.Mesh(new THREE.CircleGeometry(90,96),new THREE.MeshBasicMaterial({color:0x090716,transparent:true,opacity:.72}));floor.rotation.x=-Math.PI/2;floor.position.y=-8;scene.add(floor);
const grid=new THREE.GridHelper(180,60,0x39245c,0x211b36);grid.position.y=-7.94;grid.material.transparent=true;grid.material.opacity=.2;scene.add(grid);

const gateGroups=[];
const raycaster=new THREE.Raycaster(), pointer=new THREE.Vector2();
const mat=(color,emissive=color,emissiveIntensity=1)=>new THREE.MeshStandardMaterial({color,metalness:.72,roughness:.23,emissive,emissiveIntensity});
const coreMat=mat(0x24143e,0x8e5cff,2.2);
const ringMat=(c)=>new THREE.MeshStandardMaterial({color:c,metalness:.45,roughness:.2,emissive:c,emissiveIntensity:2.1});
const positions=[[-15,0,-5],[-8,1,-17],[1,0,-22],[10,1,-16],[17,0,-4]];
worlds.forEach((w,i)=>{
  const group=new THREE.Group();group.position.set(...positions[i]);group.userData.worldIndex=i;
  const platform=new THREE.Mesh(new THREE.CylinderGeometry(4.6,5.6,.8,8,1),mat(0x171326,0x3d2368,.6));platform.position.y=-5.8;group.add(platform);
  const baseRing=new THREE.Mesh(new THREE.TorusGeometry(4.3,.045,8,80),ringMat(w.color));baseRing.rotation.x=Math.PI/2;baseRing.position.y=-5.25;group.add(baseRing);
  const portal=new THREE.Group();portal.position.y=-.1;group.add(portal);
  const outer=new THREE.Mesh(new THREE.TorusGeometry(3.05,.16,16,100),ringMat(w.color));portal.add(outer);
  const inner=new THREE.Mesh(new THREE.TorusGeometry(2.55,.035,8,100),ringMat(0xc9b3ff));portal.add(inner);
  const disc=new THREE.Mesh(new THREE.CircleGeometry(2.48,64),new THREE.MeshBasicMaterial({color:w.color,transparent:true,opacity:.085,side:THREE.DoubleSide}));portal.add(disc);
  const vertical=new THREE.Mesh(new THREE.TorusGeometry(2.78,.025,8,90),ringMat(w.color));vertical.rotation.y=Math.PI/2;portal.add(vertical);
  const core=new THREE.Mesh(new THREE.IcosahedronGeometry(.7,1),mat(0x1b1230,w.color,2.5));core.position.y=0;portal.add(core);
  for(let k=0;k<5;k++){const shard=new THREE.Mesh(new THREE.OctahedronGeometry(.22+Math.random()*.18),mat(0x211a37,w.color,1.6));const a=k/5*Math.PI*2;shard.position.set(Math.cos(a)*3.7,Math.sin(a*2)*1.1,Math.sin(a)*1.5);group.add(shard)}
  const beam=new THREE.Mesh(new THREE.CylinderGeometry(.035,.12,8,12),new THREE.MeshBasicMaterial({color:w.color,transparent:true,opacity:.2}));beam.position.y=-1.3;group.add(beam);
  group.userData.portal=portal;group.userData.core=core;group.userData.pickables=[outer,inner,disc,core,platform];
  gateGroups.push(group);scene.add(group);
});
const center=new THREE.Group();
const centralCore=new THREE.Mesh(new THREE.IcosahedronGeometry(2.2,2),coreMat);center.add(centralCore);
const centerRing=new THREE.Mesh(new THREE.TorusGeometry(4.1,.055,10,140),ringMat(0x9270ff));centerRing.rotation.x=Math.PI/2.7;center.add(centerRing);
const centerRing2=new THREE.Mesh(new THREE.TorusGeometry(3.3,.035,8,120),ringMat(0x4fc9ff));centerRing2.rotation.y=Math.PI/2.4;center.add(centerRing2);
const centerBase=new THREE.Mesh(new THREE.CylinderGeometry(4.4,5.1,.65,12),mat(0x171126,0x7044b7,.8));centerBase.position.y=-5.8;center.add(centerBase);
center.position.set(0,0,1);scene.add(center);

const dustGeo=new THREE.BufferGeometry(), dustCount=650, dust=new Float32Array(dustCount*3);
for(let i=0;i<dustCount;i++){dust[i*3]=(Math.random()-.5)*70;dust[i*3+1]=(Math.random()-.5)*35;dust[i*3+2]=(Math.random()-.5)*70}
dustGeo.setAttribute("position",new THREE.BufferAttribute(dust,3));const dustPts=new THREE.Points(dustGeo,new THREE.PointsMaterial({color:0x9b82cb,size:.055,transparent:true,opacity:.55}));scene.add(dustPts);

let activeWorld=-1, entered=false, detailOpen=false, panelOpen=false;
let targetPosition=new THREE.Vector3(0,8,31), targetLook=new THREE.Vector3(0,0,-7), camGoal=targetPosition.clone(), lookGoal=targetLook.clone();
let dragging=false,lastX=0,lastY=0,theta=0,phi=1.32,zoom=31;
let soundOn=false,audioCtx=null,osc=null,gain=null;
const reduced=matchMedia("(prefers-reduced-motion: reduce)").matches;

function animateCamera(pos,look,duration=1500){
  camGoal.copy(pos);lookGoal.copy(look);
  const start=camera.position.clone(), startLook=new THREE.Vector3();camera.getWorldDirection(startLook);startLook.multiplyScalar(12).add(camera.position);
  const t0=performance.now();
  function step(now){const t=Math.min(1,(now-t0)/duration),e=1-Math.pow(1-t,3);camera.position.lerpVectors(start,camGoal,e);camera.lookAt(new THREE.Vector3().lerpVectors(startLook,lookGoal,e));if(t<1)requestAnimationFrame(step)}
  requestAnimationFrame(step);
}
function travelTo(i){
  activeWorld=i;entered=true;detailOpen=false;$("#detailView").classList.remove("open");$("#introPanel").classList.add("hidden");
  const w=worlds[i],p=gateGroups[i].position;
  $("#worldIndex").innerHTML=`0${i+1} <i>/ 05</i>`;$("#worldKicker").textContent=w.kicker;$("#worldTitle").innerHTML=w.title;$("#worldDescription").textContent=w.desc;
  $("#worldHud").classList.add("visible");$("#bottomHint").style.opacity="0";
  document.querySelectorAll(".dimension").forEach((b,n)=>b.classList.toggle("active",n===i));
  const dest=new THREE.Vector3(p.x*.72,p.y+4.2,p.z+10.5);
  animateCamera(dest,new THREE.Vector3(p.x,p.y,p.z),reduced?1:1700);
  showProjects(i);
}
function returnHome(){
  activeWorld=-1;entered=true;panelOpen=false;detailOpen=false;
  $("#projectPanel").classList.remove("open");$("#detailView").classList.remove("open");$("#worldHud").classList.remove("visible");$("#introPanel").classList.remove("hidden");$("#bottomHint").style.opacity="1";
  document.querySelectorAll(".dimension").forEach((b,n)=>b.classList.toggle("active",n===0));
  animateCamera(new THREE.Vector3(0,8,31),new THREE.Vector3(0,0,-7),1200);
}
function showProjects(i){
  const w=worlds[i];$("#projectHeading").textContent=w.name;$("#projectCount").textContent=`${w.assets.length} PROJECTS`;
  const grid=$("#projectGrid");grid.innerHTML="";
  w.assets.forEach((a,n)=>{
    const card=document.createElement("button");card.className="project-card";
    const img=document.createElement("img");img.loading="lazy";img.alt=a.title;img.src=BASE+a.path;
    img.onerror=()=>{img.removeAttribute("src");img.style.background=`radial-gradient(circle at 30% 20%,#694aa2,#121022 70%)`};
    const cap=document.createElement("div");cap.className="card-caption";cap.innerHTML=`<b>${a.title}</b><span>${a.type==="video"?"PLAY ↗":"VIEW ↗"}</span>`;
    card.append(img,cap);card.addEventListener("click",()=>openDetail(a,i,n));grid.append(card);
  });
  $("#projectPanel").classList.add("open");panelOpen=true;
}
function openDetail(asset,worldIndex,n){
  detailOpen=true;$("#projectPanel").classList.remove("open");panelOpen=false;
  $("#detailType").textContent=`${worlds[worldIndex].name} / ${String(n+1).padStart(2,"0")}`;
  $("#detailTitle").textContent=asset.title;$("#detailDescription").textContent=asset.description;
  const media=$("#detailMedia");media.innerHTML="";
  if(asset.type==="video"&&asset.video){const v=document.createElement("video");v.src=BASE+asset.video;v.poster=BASE+asset.path;v.controls=true;v.autoplay=true;v.muted=true;v.playsInline=true;media.append(v)}
  else{const img=document.createElement("img");img.src=BASE+asset.path;img.alt=asset.title;media.append(img)}
  const ext=$("#detailExternal");ext.href=asset.type==="video"?(asset.external||"https://www.facebook.com/"):BASE+asset.path;ext.textContent=asset.type==="video"?"OPEN VIDEO SOURCE ↗":"OPEN FULL IMAGE ↗";
  $("#detailView").classList.add("open");
}
function closeDetail(){detailOpen=false;$("#detailView").classList.remove("open");if(activeWorld>=0)showProjects(activeWorld)}
function selectGate(i){if(i<0||i>=worlds.length)return;travelTo(i)}
document.querySelectorAll(".dimension").forEach(b=>b.addEventListener("click",()=>selectGate(Number(b.dataset.world))));
$("#enterBtn").addEventListener("click",()=>{entered=true;$("#introPanel").classList.add("hidden");$("#worldHud").classList.add("visible");$("#worldTitle").innerHTML="Choose your<br><em>dimension.</em>";$("#worldKicker").textContent="THE CREATIVE MULTIVERSE";$("#worldDescription").textContent="Five creative territories. One signature.";$("#bottomHint").style.opacity="1";animateCamera(new THREE.Vector3(0,7,27),new THREE.Vector3(0,0,-8),1200)});
$("#backWorldBtn").addEventListener("click",returnHome);$("#homeBtn").addEventListener("click",e=>{e.preventDefault();returnHome()});
$("#closePanelBtn").addEventListener("click",()=>{$("#projectPanel").classList.remove("open");panelOpen=false});
$("#detailBack").addEventListener("click",closeDetail);
$("#helpBtn").addEventListener("click",()=>$("#helpModal").classList.add("open"));$("#helpClose").addEventListener("click",()=>$("#helpModal").classList.remove("open"));$("#helpModal").addEventListener("click",e=>{if(e.target.id==="helpModal")$("#helpModal").classList.remove("open")});
$("#soundBtn").addEventListener("click",()=>{
  soundOn=!soundOn;$("#soundBtn").classList.toggle("active",soundOn);
  if(soundOn){audioCtx=audioCtx||new AudioContext();gain=audioCtx.createGain();gain.gain.value=.018;gain.connect(audioCtx.destination);osc=audioCtx.createOscillator();osc.type="sine";osc.frequency.value=54;osc.connect(gain);osc.start();$("#soundBtn").textContent="♫"}
  else if(osc){osc.stop();osc=null;gain.disconnect();$("#soundBtn").textContent="♪"}
});
function onPointerDown(e){dragging=true;lastX=e.clientX;lastY=e.clientY;canvas.setPointerCapture?.(e.pointerId)}
function onPointerMove(e){if(!dragging)return;const dx=e.clientX-lastX,dy=e.clientY-lastY;lastX=e.clientX;lastY=e.clientY;theta-=dx*.003;phi=THREE.MathUtils.clamp(phi+dy*.003,.45,2.45);if(activeWorld<0){const r=zoom;camGoal.set(Math.sin(theta)*r,Math.cos(phi)*r*.28+5,Math.cos(theta)*r);camera.position.lerp(camGoal,.18);camera.lookAt(0,0,-8)}else{const p=gateGroups[activeWorld].position,r=10;camGoal.set(p.x+Math.sin(theta)*r,p.y+Math.cos(phi)*r*.5+3,p.z+Math.cos(theta)*r);camera.position.lerp(camGoal,.2);camera.lookAt(p)}}
function onPointerUp(e){if(!dragging)return;dragging=false;pointer.x=(e.clientX/innerWidth)*2-1;pointer.y=-(e.clientY/innerHeight)*2+1;raycaster.setFromCamera(pointer,camera);const hits=raycaster.intersectObjects(gateGroups.flatMap(g=>g.userData.pickables),false);if(hits.length){let obj=hits[0].object;let g=gateGroups.find(x=>x.userData.pickables.includes(obj));if(g)selectGate(g.userData.worldIndex)}}
canvas.addEventListener("pointerdown",onPointerDown);canvas.addEventListener("pointermove",onPointerMove);canvas.addEventListener("pointerup",onPointerUp);canvas.addEventListener("pointercancel",()=>dragging=false);
canvas.addEventListener("wheel",e=>{e.preventDefault();zoom=THREE.MathUtils.clamp(zoom+e.deltaY*.018,14,55);if(activeWorld<0){camGoal.set(Math.sin(theta)*zoom,7,Math.cos(theta)*zoom);animateCamera(camGoal,new THREE.Vector3(0,0,-8),300)}},{passive:false});
addEventListener("keydown",e=>{if(e.key==="Escape"){if($("#helpModal").classList.contains("open"))$("#helpModal").classList.remove("open");else if(detailOpen)closeDetail();else if(panelOpen){$("#projectPanel").classList.remove("open");panelOpen=false}else returnHome()}});
addEventListener("resize",()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight);renderer.setPixelRatio(Math.min(devicePixelRatio,1.7))});

const clock=new THREE.Clock();
function render(){
  requestAnimationFrame(render);const t=clock.getElapsedTime();
  stars.rotation.y=t*.006;dustPts.rotation.y=-t*.009;
  gateGroups.forEach((g,i)=>{g.userData.portal.rotation.z=Math.sin(t*.35+i)*.035;g.userData.core.rotation.x=t*.3+i;g.userData.core.rotation.y=t*.42+i;g.position.y=positions[i][1]+Math.sin(t*.55+i)*.16;g.children.forEach((o,j)=>{if(j>4&&o.geometry.type==="OctahedronGeometry")o.rotation.y=t*.25+j})});
  centralCore.rotation.x=t*.11;centralCore.rotation.y=t*.18;centerRing.rotation.z=t*.08;centerRing2.rotation.x=t*.1;
  renderer.render(scene,camera);
}
render();
$("#loadingScreen").classList.add("done");setTimeout(()=>$("#loadingScreen").remove(),700);
