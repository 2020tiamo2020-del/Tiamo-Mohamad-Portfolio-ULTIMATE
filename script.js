(() => {
"use strict";
const langBtn=document.getElementById("langBtn");
const setLanguage=lang=>{document.documentElement.lang=lang==="ar"?"ar":"en";document.documentElement.dir=lang==="ar"?"rtl":"ltr";document.querySelectorAll("[data-en]").forEach(el=>{const v=el.getAttribute(lang==="ar"?"data-ar":"data-en");if(v!==null)el.innerHTML=v});if(langBtn)langBtn.textContent=lang==="ar"?"EN":"AR";localStorage.setItem("tiamo-lang",lang)};
setLanguage(localStorage.getItem("tiamo-lang")||"en");
langBtn?.addEventListener("click",()=>setLanguage(document.documentElement.lang==="ar"?"en":"ar"));

// Contextual floating navigator: top -> bottom, bottom -> top.
const scrollOrbit=document.getElementById("scrollOrbit");
const updateScrollOrbit=()=>{
  if(!scrollOrbit)return;
  const nearBottom=window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 70;
  const atTop=window.scrollY <= 30;
  const down=atTop || !nearBottom;
  scrollOrbit.classList.toggle("is-up",!down);
  const core=scrollOrbit.querySelector(".scroll-orbit-core"),label=scrollOrbit.querySelector(".scroll-orbit-label");
  if(core)core.textContent=down?"⌄":"⌃";
  scrollOrbit.setAttribute("aria-label",down?"Scroll to bottom":"Scroll to top");
  if(label){label.setAttribute("data-en",down?"DOWN":"TOP");label.setAttribute("data-ar",down?"لأسفل":"للأعلى");const lang=document.documentElement.lang==="ar"?"ar":"en";label.textContent=label.getAttribute(lang==="ar"?"data-ar":"data-en");}
};
scrollOrbit?.addEventListener("click",()=>{
  const nearBottom=window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 70;
  window.scrollTo({top:nearBottom?0:document.documentElement.scrollHeight,behavior:"smooth"});
});
addEventListener("scroll",updateScrollOrbit,{passive:true});
addEventListener("resize",updateScrollOrbit);
updateScrollOrbit();
const menuBtn=document.getElementById("menuBtn"),nav=document.getElementById("nav");
menuBtn?.addEventListener("click",()=>nav?.classList.toggle("open"));
const ro=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){e.target.classList.add("visible");ro.unobserve(e.target)}}),{threshold:.12});
document.querySelectorAll(".reveal").forEach(e=>ro.observe(e));

document.querySelectorAll(".slider").forEach(slider=>{
  const track=slider.querySelector(".slides"),slides=[...slider.querySelectorAll(".slides>figure")],prev=slider.querySelector(".prev"),next=slider.querySelector(".next"),dots=slider.querySelector(".dots");
  if(!track||!slides.length)return;
  let index=0,paused=false,timer; const delay=+slider.dataset.delay||4000;
  const markActive=()=>slides.forEach((slide,i)=>{slide.classList.toggle("is-active",i===index);const media=slide.querySelector("img");if(media){const src=media.currentSrc||media.src||"";slide.style.setProperty("--media-bg",`url("${src.replace(/"/g,'\"')}")`)}});
  const go=(n,manual=false)=>{index=(n+slides.length)%slides.length;track.style.transform=`translate3d(${-index*100}%,0,0)`;markActive();dots?.querySelectorAll("button").forEach((d,i)=>d.classList.toggle("active",i===index));if(manual)restart()};
  slides.forEach((_,i)=>{const d=document.createElement("button");d.type="button";d.setAttribute("aria-label",`Go to slide ${i+1}`);d.addEventListener("click",e=>{e.preventDefault();e.stopPropagation();go(i,true)});dots?.appendChild(d)});
  const start=()=>{clearInterval(timer);if(slides.length>1)timer=setInterval(()=>{if(!paused)go(index+1)},delay)};
  const restart=()=>{clearInterval(timer);start()};
  prev?.addEventListener("click",e=>{e.preventDefault();e.stopPropagation();go(index-1,true)});
  next?.addEventListener("click",e=>{e.preventDefault();e.stopPropagation();go(index+1,true)});
  slider.addEventListener("mouseenter",()=>paused=true);slider.addEventListener("mouseleave",()=>paused=false);slider.addEventListener("focusin",()=>paused=true);slider.addEventListener("focusout",()=>paused=false);
  let touchX=null;slider.addEventListener("touchstart",e=>{touchX=e.changedTouches[0].clientX;paused=true},{passive:true});
  slider.addEventListener("touchend",e=>{if(touchX===null)return;const dx=e.changedTouches[0].clientX-touchX;if(Math.abs(dx)>45)go(index+(dx<0?1:-1),true);touchX=null;paused=false},{passive:true});
  go(0);start();
});

const lightbox=document.getElementById("mediaLightbox"),image=document.getElementById("lightboxImage"),stage=document.querySelector(".lightbox-stage");
let lightboxFrame=null;
const close=()=>{lightbox?.classList.remove("open");lightbox?.setAttribute("aria-hidden","true");document.body.classList.remove("lightbox-open");if(image){image.removeAttribute("src");image.style.display=""}if(lightboxFrame){lightboxFrame.remove();lightboxFrame=null}};
const openImage=btn=>{const src=btn.dataset.full||btn.querySelector("img")?.src;if(!src||!lightbox||!image)return;if(lightboxFrame){lightboxFrame.remove();lightboxFrame=null}image.src=src;image.alt=btn.querySelector("img")?.alt||"Tiamo Mohamad artwork";image.style.display="block";lightbox.classList.add("open");lightbox.setAttribute("aria-hidden","false");document.body.classList.add("lightbox-open")};
const facebookEmbed=url=>{try{const u=new URL(url);if(!["facebook.com","www.facebook.com","m.facebook.com"].includes(u.hostname))return null;return `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(u.href)}&show_text=false&width=1280&height=720`}catch{return null}};
const openVideo=link=>{const embed=facebookEmbed(link?.href);if(!embed||!lightbox||!stage)return;if(image){image.removeAttribute("src");image.style.display="none"}if(lightboxFrame)lightboxFrame.remove();lightboxFrame=document.createElement("iframe");lightboxFrame.className="lightbox-video";lightboxFrame.src=embed;lightboxFrame.title="Facebook Reel";lightboxFrame.allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share";lightboxFrame.allowFullscreen=true;lightboxFrame.loading="lazy";stage.insertBefore(lightboxFrame,stage.querySelector(".lightbox-caption"));lightbox.classList.add("open");lightbox.setAttribute("aria-hidden","false");document.body.classList.add("lightbox-open")};

document.querySelectorAll(".media-open").forEach(btn=>btn.addEventListener("click",e=>{e.preventDefault();e.stopPropagation();openImage(btn)}));
// Video/Reel links intentionally use their native Facebook href (open externally).
lightbox?.addEventListener("click",e=>{if(e.target===lightbox)close()});document.querySelector(".lightbox-close")?.addEventListener("click",close);document.addEventListener("keydown",e=>{if(e.key==="Escape")close()});
const glow=document.querySelector(".cursor-glow");if(glow&&matchMedia("(pointer:fine)").matches)window.addEventListener("pointermove",e=>{glow.style.left=e.clientX+"px";glow.style.top=e.clientY+"px"},{passive:true});
const canvas=document.getElementById("particles"),ctx=canvas?.getContext("2d");
if(canvas&&ctx&&matchMedia("(prefers-reduced-motion:no-preference)").matches){let p=[];const resize=()=>{canvas.width=innerWidth*devicePixelRatio;canvas.height=innerHeight*devicePixelRatio;canvas.style.width=innerWidth+"px";canvas.style.height=innerHeight+"px";ctx.setTransform(devicePixelRatio,0,0,devicePixelRatio,0,0);p=Array.from({length:Math.min(55,Math.floor(innerWidth/25))},()=>({x:Math.random()*innerWidth,y:Math.random()*innerHeight,r:Math.random()*1.3+.3,vx:(Math.random()-.5)*.18,vy:(Math.random()-.5)*.18}))};const draw=()=>{ctx.clearRect(0,0,innerWidth,innerHeight);ctx.fillStyle="rgba(181,140,255,.45)";p.forEach(a=>{a.x+=a.vx;a.y+=a.vy;if(a.x<0||a.x>innerWidth)a.vx*=-1;if(a.y<0||a.y>innerHeight)a.vy*=-1;ctx.beginPath();ctx.arc(a.x,a.y,a.r,0,Math.PI*2);ctx.fill()});requestAnimationFrame(draw)};addEventListener("resize",resize);resize();draw()}
})();
