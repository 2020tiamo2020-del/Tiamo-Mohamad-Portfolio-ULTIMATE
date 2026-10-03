(() => {
"use strict";
const langBtn=document.getElementById("langBtn");
const ref={fn:()=>{}};
const setLanguage=lang=>{
  document.documentElement.lang=lang==="ar"?"ar":"en";
  document.documentElement.dir=lang==="ar"?"rtl":"ltr";
  document.querySelectorAll("[data-en]").forEach(el=>{
    const v=el.getAttribute(lang==="ar"?"data-ar":"data-en");
    if(v!==null)el.innerHTML=v;
  });
  if(langBtn)langBtn.textContent=lang==="ar"?"EN":"AR";
  localStorage.setItem("tiamo-lang",lang);
  ref.fn();
};
setLanguage(localStorage.getItem("tiamo-lang")||"en");
langBtn?.addEventListener("click",()=>setLanguage(document.documentElement.lang==="ar"?"en":"ar"));

const scrollOrbit=document.getElementById("scrollOrbit");
const updateScrollOrbit=()=>{
  if(!scrollOrbit)return;
  const nearBottom=window.scrollY+window.innerHeight>=document.documentElement.scrollHeight-70;
  const atTop=window.scrollY<=30;
  const down=atTop||!nearBottom;
  const core=scrollOrbit.querySelector(".scroll-orbit-core");
  const label=scrollOrbit.querySelector(".scroll-orbit-label");
  if(core)core.textContent=down?"⌄":"⌃";
  if(label){
    label.setAttribute("data-en",down?"DOWN":"TOP");
    label.setAttribute("data-ar",down?"لأسفل":"للأعلى");
    const lang=document.documentElement.lang==="ar"?"ar":"en";
    label.textContent=label.getAttribute(lang==="ar"?"data-ar":"data-en");
  }
};
ref.fn=updateScrollOrbit;
scrollOrbit?.addEventListener("click",()=>{
  const nearBottom=window.scrollY+window.innerHeight>=document.documentElement.scrollHeight-70;
  window.scrollTo({top:nearBottom?0:document.documentElement.scrollHeight,behavior:"smooth"});
});
addEventListener("scroll",updateScrollOrbit,{passive:true});
addEventListener("resize",updateScrollOrbit);
updateScrollOrbit();

const menuBtn=document.getElementById("menuBtn"),nav=document.getElementById("nav");
menuBtn?.addEventListener("click",()=>{
  const open=nav?.classList.toggle("open");
  menuBtn.setAttribute("aria-expanded",open?"true":"false");
  menuBtn.textContent=open?"×":"☰";
});
nav?.querySelectorAll("a").forEach(a=>a.addEventListener("click",()=>{
  nav.classList.remove("open");
  menuBtn?.setAttribute("aria-expanded","false");
  if(menuBtn)menuBtn.textContent="☰";
}));

const ro=new IntersectionObserver(es=>es.forEach(e=>{
  if(e.isIntersecting){e.target.classList.add("visible");ro.unobserve(e.target);}
}),{threshold:.12});
document.querySelectorAll(".reveal").forEach(e=>ro.observe(e));

document.querySelectorAll(".slider").forEach(slider=>{
  const track=slider.querySelector(".slides");
  const slides=[...slider.querySelectorAll(".slides>figure")];
  const prev=slider.querySelector(".prev");
  const next=slider.querySelector(".next");
  const dots=slider.querySelector(".dots");
  if(!track||!slides.length)return;
  let index=0,paused=false,timer;
  const delay=+slider.dataset.delay||6000;
  const markActive=()=>slides.forEach((s,i)=>{
    s.classList.toggle("is-active",i===index);
  });
  const go=(n,manual=false)=>{
    index=(n+slides.length)%slides.length;
    track.style.transform=`translate3d(${-index*100}%,0,0)`;
    markActive();
    dots?.querySelectorAll("button").forEach((d,i)=>d.classList.toggle("active",i===index));
    if(manual)restart();
  };
  slides.forEach((_,i)=>{
    const d=document.createElement("button");
    d.type="button";d.setAttribute("aria-label",`Go to slide ${i+1}`);
    d.addEventListener("click",e=>{e.preventDefault();e.stopPropagation();go(i,true);});
    dots?.appendChild(d);
  });
  const start=()=>{clearInterval(timer);if(slides.length>1)timer=setInterval(()=>{if(!paused)go(index+1);},delay);};
  const restart=()=>{clearInterval(timer);start();};
  prev?.addEventListener("click",e=>{e.preventDefault();e.stopPropagation();go(index-1,true);});
  next?.addEventListener("click",e=>{e.preventDefault();e.stopPropagation();go(index+1,true);});
  slider.addEventListener("mouseenter",()=>paused=true);
  slider.addEventListener("mouseleave",()=>paused=false);
  let touchX=null;
  slider.addEventListener("touchstart",e=>{touchX=e.changedTouches[0].clientX;paused=true;},{passive:true});
  slider.addEventListener("touchend",e=>{
    if(touchX===null)return;
    const dx=e.changedTouches[0].clientX-touchX;
    if(Math.abs(dx)>45)go(index+(dx<0?1:-1),true);
    touchX=null;paused=false;
  },{passive:true});
  go(0);start();
});

document.querySelectorAll(".ba-slider").forEach(slider=>{
  const range=slider.querySelector(".ba-range");
  const wrap=slider.querySelector(".ba-after-wrap");
  const handle=slider.querySelector(".ba-handle");
  if(!range||!wrap||!handle)return;
  const update=v=>{
    v=Math.max(0,Math.min(100,v));
    wrap.style.clipPath=`inset(0 ${100-v}% 0 0)`;
    handle.style.left=v+"%";
  };
  range.addEventListener("input",e=>update(+e.target.value));
  update(+range.value||50);
});

const lightbox=document.getElementById("mediaLightbox");
const image=document.getElementById("lightboxImage");
const close=()=>{
  lightbox?.classList.remove("open");
  document.body.classList.remove("lightbox-open");
  if(image){image.removeAttribute("src");}
};
const openImage=btn=>{
  const src=btn.dataset.full||btn.querySelector("img")?.src;
  if(!src||!lightbox||!image)return;
  image.src=src;image.alt=btn.querySelector("img")?.alt||"";
  lightbox.classList.add("open");
  document.body.classList.add("lightbox-open");
};
document.querySelectorAll(".media-open").forEach(btn=>btn.addEventListener("click",e=>{
  e.preventDefault();e.stopPropagation();openImage(btn);
}));
lightbox?.addEventListener("click",e=>{if(e.target===lightbox)close();});
document.querySelector(".lightbox-close")?.addEventListener("click",close);
document.addEventListener("keydown",e=>{if(e.key==="Escape")close();});

const glow=document.querySelector(".cursor-glow");
if(glow&&matchMedia("(pointer:fine)").matches){
  window.addEventListener("pointermove",e=>{
    glow.style.left=e.clientX+"px";glow.style.top=e.clientY+"px";
  },{passive:true});
}

const canvas=document.getElementById("particles"),ctx=canvas?.getContext("2d");
if(canvas&&ctx&&matchMedia("(prefers-reduced-motion:no-preference)").matches){
  let p=[],rafId=null;
  const resize=()=>{
    canvas.width=innerWidth*devicePixelRatio;
    canvas.height=innerHeight*devicePixelRatio;
    canvas.style.width=innerWidth+"px";canvas.style.height=innerHeight+"px";
    ctx.setTransform(devicePixelRatio,0,0,devicePixelRatio,0,0);
    p=Array.from({length:Math.min(55,Math.floor(innerWidth/25))},()=>({
      x:Math.random()*innerWidth,y:Math.random()*innerHeight,
      r:Math.random()*1.3+.3,vx:(Math.random()-.5)*.18,vy:(Math.random()-.5)*.18
    }));
  };
  const draw=()=>{
    ctx.clearRect(0,0,innerWidth,innerHeight);
    ctx.fillStyle="rgba(181,140,255,.45)";
    p.forEach(a=>{
      a.x+=a.vx;a.y+=a.vy;
      if(a.x<0||a.x>innerWidth)a.vx*=-1;
      if(a.y<0||a.y>innerHeight)a.vy*=-1;
      ctx.beginPath();ctx.arc(a.x,a.y,a.r,0,Math.PI*2);ctx.fill();
    });
    rafId=requestAnimationFrame(draw);
  };
  const start=()=>{if(rafId===null)rafId=requestAnimationFrame(draw);};
  const stop=()=>{if(rafId!==null){cancelAnimationFrame(rafId);rafId=null;}};
  document.addEventListener("visibilitychange",()=>{document.hidden?stop():start();});
  addEventListener("resize",resize);
  resize();draw();
}
})();
