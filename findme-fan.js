(()=>{const s=document.querySelector("section.social-strip.fm");if(!s)return;
const cards=[...s.querySelectorAll(".fm-side")],red=matchMedia("(prefers-reduced-motion:reduce)").matches;
const dly=c=>c.classList.contains("fm-l2")||c.classList.contains("fm-r2")?.28:0,ease=t=>t*t*(3-2*t);
let cur=red?1:0,tgt=cur,raf=0;
const ctr=s.querySelector(".fm-c"),B=.55,cl=t=>Math.max(0,Math.min(1,t)),out=t=>1+1.7*Math.pow(t-1,3)+.7*Math.pow(t-1,2);
const paint=()=>{ctr.style.setProperty("--fd",(1-out(cl(cur/B))).toFixed(3));const u=cl((cur-B)/(1-B));cards.forEach(c=>{const q=ease(cl((u-dly(c))/(1-.28)));c.style.setProperty("--fq",q.toFixed(3));c.style.pointerEvents=q>.5?"auto":"none"})};
const aim=()=>{const r=s.getBoundingClientRect(),v=innerHeight;tgt=red?1:Math.max(0,Math.min(1,(v*.86-r.top)/(v*.56)));if(!raf)raf=requestAnimationFrame(tick)};
const tick=()=>{raf=0;cur+=(tgt-cur)*.07;if(Math.abs(tgt-cur)<.002)cur=tgt;paint();if(cur!==tgt)raf=requestAnimationFrame(tick)};
addEventListener("scroll",aim,{passive:true});addEventListener("resize",aim);aim();paint();
cards.forEach((c,i)=>{
 c.addEventListener("pointerenter",()=>cards.forEach((o,j)=>{if(o!==c)o.style.setProperty("--fnx",(j<i?-1:1)*(Math.abs(j-i)>0?16:0)+"px")}));
 c.addEventListener("pointermove",e=>{const b=c.getBoundingClientRect(),x=(e.clientX-b.left)/b.width,y=(e.clientY-b.top)/b.height;
  c.style.setProperty("--fry",((x-.5)*12).toFixed(1)+"deg");c.style.setProperty("--frx",((.5-y)*10).toFixed(1)+"deg");c.style.setProperty("--fmx",x*100+"%");c.style.setProperty("--fmy",y*100+"%")});
 c.addEventListener("pointerleave",()=>{cards.forEach(o=>o.style.setProperty("--fnx","0px"));["--frx","--fry"].forEach(p=>c.style.setProperty(p,"0deg"))});
});})();
