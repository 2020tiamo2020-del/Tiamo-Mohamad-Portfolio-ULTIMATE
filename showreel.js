/* SHOWREEL AD - scroll-driven, no libraries. Edit CONFIG to change words / timing. */
(()=>{"use strict";
const CONFIG={scenes:[ // [start,end] of scroll progress per scene
  {a:0,b:.17,en:"Imagine",ar:"تخيّل"},
  {a:.17,b:.34,en:"Create",ar:"ابتكر"},
  {a:.34,b:.51,en:"AI Art",ar:"ذكاء اصطناعي"},
  {a:.51,b:.68,en:"Photoshop",ar:"فوتوشوب"},
  {a:.68,b:.84,en:"VFX",ar:"مؤثرات"},
  {a:.84,b:1,en:"Signature",ar:"بصمتي"}],
 smooth:.14};
const S=document.getElementById("showreel");if(!S)return;
const $=q=>S.querySelector(q),$$=q=>[...S.querySelectorAll(q)];
const cl=(v,a=0,b=1)=>Math.min(b,Math.max(a,v)),L=(a,b,t)=>a+(b-a)*t,ease=t=>t*t*(3-2*t),
  out=t=>1-Math.pow(1-t,3),loc=(p,a,b)=>cl((p-a)/(b-a));
const env=(p,a,b,f=.22)=>{const t=loc(p,a,b);return ease(cl(t/f))*ease(cl((1-t)/f))}; // fade in/out inside a scene
const el={base:$(".sr-base"),top:$(".sr-top"),bot:$(".sr-bot"),seam:$(".sr-seam"),ws:$$(".sr-w"),rider:$(".sr-rider"),col:$(".sr-rider .col"),
 lens:$(".sr-lensimg"),li:$$(".sr-lensimg i"),ring:$(".sr-ring"),slab:$(".sr-slab"),x:$$(".sr-x i"),flash:$(".sr-flash"),fin:$(".sr-final"),
 n:$(".sr-hud b"),bar:$(".sr-bar i"),mq:$(".sr-marq span"),stage:$(".sr-stage")};
const isAr=()=>document.documentElement.lang==="ar";
const words=()=>{$$("[data-sr]").forEach(n=>{const v=n.dataset[isAr()?"ar":"en"];if(v&&n.innerHTML!==v)n.innerHTML=v})};
words();new MutationObserver(words).observe(document.documentElement,{attributes:true,attributeFilter:["lang"]});
const reduce=matchMedia("(prefers-reduced-motion: reduce)").matches;
let target=0,cur=0,live=false,raf=0;
const measure=()=>{const r=S.getBoundingClientRect();target=cl(-r.top/Math.max(1,r.height-innerHeight));};
function draw(p){
  const[v,h]=[innerWidth,innerHeight],sc=CONFIG.scenes;
  const[s1,s2,s3,s4,s5,s6]=sc.map(s=>[s.a,s.b]);
  // base parallax + palette
  el.base.style.transform=`scale(${1.12+p*.1}) translateY(${-p*6}%)`;
  // scene 1: green slab wipes through, word IMAGINE behind rider
  let t=loc(p,...s1),sx=t<.5?L(-120,0,out(t*2)):L(0,130,ease((t-.5)*2));
  el.slab.style.transform=`translateX(${p>s1[1]+.01?130:sx}%) skewX(-14deg)`;
  // scene 2: split screen, halves slide in opposite directions, seam glows
  const e2=env(p,...s2,.25),m2=loc(p,...s2);
  el.top.style.opacity=el.bot.style.opacity=e2;
  el.top.style.transform=`translateX(${L(-30,30,m2)}vw)`;el.bot.style.transform=`translateX(${L(30,-30,m2)}vw)`;
  el.seam.style.opacity=e2;el.seam.style.transform=`scaleX(${.2+e2*.8})`;
  // scene 3: colour sweeps across the rider (B&W -> neon)
  const c=p<s3[0]?0:p>s3[1]?1:out(loc(p,...s3));
  el.col.style.clipPath=`inset(0 ${(1-c)*100}% 0 0)`;
  // scene 4: X slash + flash + shake
  const m4=loc(p,...s4),xa=m4<.5?out(m4*2):1,xb=m4<.5?0:ease((m4-.5)*2),X=L(-150,0,xa)+L(0,150,xb);
  el.x[0].style.transform=`translate(-50%,-50%) rotate(28deg) translateX(${p<s4[0]?-150:X}vw)`;
  el.x[1].style.transform=`translate(-50%,-50%) rotate(-28deg) translateX(${p<s4[0]?150:-X}vw)`;
  const fl=Math.max(0,1-Math.abs(m4-.5)*10);el.flash.style.opacity=p>s4[0]&&p<s4[1]?fl*.9:0;
  el.stage.style.transform=fl>.2?`translate(${(Math.sin(p*900)*fl*8).toFixed(1)}px,${(Math.cos(p*700)*fl*6).toFixed(1)}px)`:"";
  // scene 5: lens window into "work" images follows scroll
  const e5=env(p,...s5,.2),m5=loc(p,...s5),lx=L(.3,.7,m5)*v,ly=h*(.5+Math.sin(m5*Math.PI*2)*.1),R=e5*Math.min(v,h)*.34;
  el.lens.style.clipPath=`circle(${R}px at ${lx}px ${ly}px)`;
  el.ring.style.cssText+=`;left:${lx}px;top:${ly}px;width:${R*2}px;height:${R*2}px;opacity:${e5}`;
  const k=Math.min(2,Math.floor(m5*3));el.li.forEach((n,i)=>n.style.opacity=i===k?1:0);
  // words: behind rider, each scene
  el.ws.forEach((w,i)=>{const[a,b]=[sc[i].a,sc[i].b];if(i===5){w.style.opacity=0;return}
    const e=env(p,a,b,.28),m=loc(p,a,b);
    w.style.opacity=e;w.style.transform=`translateX(${L(i%2?12:-12,i%2?-12:12,m)}vw) scale(${L(.92,1.08,m)})`});
  // rider: float + zoom, glow at the end
  const zs=1+p*.1+(p>s6[0]?loc(p,...s6)*.05:0);
  el.rider.style.transform=`translateX(-50%) scale(${zs}) translateY(${-Math.sin(p*Math.PI)*2}%)`;
  // final lockup
  const f=ease(loc(p,s6[0]+.03,s6[1]-.01));el.fin.style.opacity=f;el.fin.style.transform=`translateY(${(1-f)*30}px)`;
  // hud
  const idx=Math.min(5,sc.findIndex(s=>p<=s.b)<0?5:sc.findIndex(s=>p<=s.b));
  el.n.textContent="0"+(idx+1)+" / 06";el.bar.style.width=p*100+"%";el.mq.style.transform=`translateX(${-p*40}%)`;
}
function tick(){cur+=(target-cur)*CONFIG.smooth*3;if(Math.abs(target-cur)<.0002)cur=target;draw(cur);raf=cur!==target&&live?requestAnimationFrame(tick):0}
const kick=()=>{measure();if(!raf)raf=requestAnimationFrame(tick)};
if(reduce){draw(1);return}
new IntersectionObserver(([e])=>{live=e.isIntersecting;if(live){addEventListener("scroll",kick,{passive:true});addEventListener("resize",kick);kick()}else{removeEventListener("scroll",kick);removeEventListener("resize",kick)}},{rootMargin:"20% 0px"}).observe(S);
draw(0);
})();
