(()=>{const s=document.querySelector("section.social-strip.fm");if(!s)return;
const cards=[...s.querySelectorAll(".fm-side")],red=matchMedia("(prefers-reduced-motion:reduce)").matches;
const dly=c=>c.classList.contains("fm-l2")||c.classList.contains("fm-r2")?.28:0,ease=t=>t*t*(3-2*t);
let cur=red?1:0,tgt=cur,raf=0;
const ctr=s.querySelector(".fm-c"),B=.55,cl=t=>Math.max(0,Math.min(1,t)),out=t=>1+1.7*Math.pow(t-1,3)+.7*Math.pow(t-1,2);
const paint=()=>{if(wrap)wrap.style.setProperty("--fmp",cur.toFixed(3));ctr.style.setProperty("--fd",(1-out(cl(cur/B))).toFixed(3));const u=cl((cur-B)/(1-B));cards.forEach(c=>{const q=ease(cl((u-dly(c))/(1-.28)));c.style.setProperty("--fq",q.toFixed(3));c.style.setProperty("--frise",((1-q)*30).toFixed(2)+"cqh");c.style.setProperty("--ftx",((1-q)*38).toFixed(1)+"deg");c.style.pointerEvents=q>.5?"auto":"none"})};
const mq=matchMedia("(min-width:901px)"),wrap=s.parentNode.id==="findme"?s.parentNode:document.createElement("div"),sp=document.createElement("div"),MB=getComputedStyle(s).marginBottom;
wrap.className="fm-pin-wrap";wrap.id="findme";sp.className="fm-pin-spacer";sp.setAttribute("aria-hidden","true");
if(wrap!==s.parentNode){s.parentNode.insertBefore(wrap,s);wrap.appendChild(s)}wrap.appendChild(sp);
if(!wrap.querySelector(".fm-bg")){const bg=document.createElement("div");bg.className="fm-bg";bg.setAttribute("aria-hidden","true");bg.innerHTML='<i class="gd"></i><i class="b1"></i><i class="b2"></i><i class="b3"></i><b class="w1"></b><b class="w2"></b>';wrap.insertBefore(bg,wrap.firstChild);const w1=bg.querySelector(".w1"),w2=bg.querySelector(".w2");const setW=()=>{const d=document.documentElement,ar=d.lang==="ar"||d.dir==="rtl";w1.textContent=ar?"تجدني هنا":"FIND ME";w2.textContent=ar?"تيامو محمد":"TIAMO MOHAMAD";w1.classList.toggle("ar",ar);w2.classList.toggle("ar",ar)};setW();new MutationObserver(setW).observe(document.documentElement,{attributes:true,attributeFilter:["lang","dir"]})}
let pin=false,top=0,P=0;
/* Find Me holds still on screen (sticky) for ~1.2 screens of scrolling: the cards arrive, fan open, then stay put so the links can be read and clicked */
const aim=()=>{const v=innerHeight||1;if(pin){const wt=wrap.getBoundingClientRect().top;tgt=wt>top?B*cl((v*.92-wt)/(v*.92-top)):B+(1-B)*cl(cl((top-wt)/P)/.45)}else{const r=s.getBoundingClientRect();tgt=red?1:cl((v*.86-r.top)/(v*.56))}if(!raf)raf=requestAnimationFrame(tick)};
const layout=()=>{pin=mq.matches&&!red;wrap.classList.toggle("on",pin);
if(!pin){sp.style.height="0px";s.style.removeProperty("--fm-top");s.style.marginBottom="";wrap.style.marginBottom="";aim();return}
const v=innerHeight||1,hd=document.querySelector(".site-header"),hb=hd?hd.getBoundingClientRect().bottom:90;
top=Math.round(Math.max(hb+8,(v-s.offsetHeight)/2));P=Math.round(v*1.2);wrap.style.setProperty("--fmh",s.offsetHeight+"px");wrap.style.setProperty("--fmt",top+"px");
wrap.style.marginBottom=MB;s.style.marginBottom="0px";s.style.setProperty("--fm-top",top+"px");sp.style.height=P+"px";aim()};
let lt=0;const relayout=()=>{clearTimeout(lt);lt=setTimeout(layout,80)};
addEventListener("resize",relayout);addEventListener("load",layout);
/* nav / dock link "Find Me": land where the cards are fully open (pinned) */
const go=()=>{if(!pin)return false;
const y=Math.round(wrap.getBoundingClientRect().top+scrollY-top+P*.58),L=window.__lenis;
if(Math.abs(y-scrollY)>innerHeight*.9)window.__tmJumpUntil=performance.now()+1700;
if(L&&L.scrollTo&&!L.isStopped)L.scrollTo(y,{duration:1.4});else scrollTo({top:y,behavior:"smooth"});
[400,1100,1700].forEach(t=>setTimeout(()=>{try{window.__updateActiveNav&&window.__updateActiveNav()}catch(_){}},t));return true};
window.__frameFindMe=go;
document.addEventListener("click",e=>{const l=e.target.closest&&e.target.closest('a[href="#findme"]');if(!l||!pin)return;e.preventDefault();e.stopImmediatePropagation();
try{if(!l.closest(".st-rail,#stRail"))window.playNavSound&&window.playNavSound()}catch(_){}try{history.pushState(null,"","#findme")}catch(_){}go()},true);
(mq.addEventListener?mq.addEventListener("change",layout):mq.addListener(layout));
if(document.fonts&&document.fonts.ready)document.fonts.ready.then(layout);
if("ResizeObserver"in window)new ResizeObserver(relayout).observe(s);
const tick=()=>{raf=0;cur+=(tgt-cur)*.07;if(Math.abs(tgt-cur)<.002)cur=tgt;paint();if(cur!==tgt)raf=requestAnimationFrame(tick)};
addEventListener("scroll",aim,{passive:true});layout();paint();
const gr=s.querySelector(".fm-gr");
wrap.addEventListener("pointermove",e=>{if(!pin)return;wrap.style.setProperty("--mx",(e.clientX/innerWidth-.5).toFixed(3));wrap.style.setProperty("--my",(e.clientY/innerHeight-.5).toFixed(3));if(gr){const b=gr.getBoundingClientRect(),dx=e.clientX-(b.left+b.width/2),dy=e.clientY-(b.top+b.height/2);gr.style.translate=Math.hypot(dx,dy)<120?(dx*.22).toFixed(1)+"px "+(dy*.28).toFixed(1)+"px":"0px 0px"}});
cards.forEach((c,i)=>{
 c.addEventListener("pointerenter",()=>cards.forEach((o,j)=>{if(o!==c)o.style.setProperty("--fnx",(j<i?-1:1)*(Math.abs(j-i)>0?16:0)+"px")}));
 c.addEventListener("pointermove",e=>{const b=c.getBoundingClientRect(),x=(e.clientX-b.left)/b.width,y=(e.clientY-b.top)/b.height;
  c.style.setProperty("--fry",((x-.5)*12).toFixed(1)+"deg");c.style.setProperty("--frx",((.5-y)*10).toFixed(1)+"deg");c.style.setProperty("--fmx",x*100+"%");c.style.setProperty("--fmy",y*100+"%")});
 c.addEventListener("pointerleave",()=>{cards.forEach(o=>o.style.setProperty("--fnx","0px"));["--frx","--fry"].forEach(p=>c.style.setProperty(p,"0deg"))});
});})();
