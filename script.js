(() => {
"use strict";
const langBtn=document.getElementById("langBtn");
const setLanguage=lang=>{document.documentElement.lang=lang==="ar"?"ar":"en";document.documentElement.dir=lang==="ar"?"rtl":"ltr";document.querySelectorAll("[data-en]").forEach(el=>{const v=el.getAttribute(lang==="ar"?"data-ar":"data-en");if(v!==null)el.innerHTML=v});if(langBtn)langBtn.textContent=lang==="ar"?"EN":"AR";localStorage.setItem("tiamo-lang",lang)};
setLanguage(localStorage.getItem("tiamo-lang")||"en");
langBtn?.addEventListener("click",()=>setLanguage(document.documentElement.lang==="ar"?"en":"ar"));
const menuBtn=document.getElementById("menuBtn"),nav=document.getElementById("nav");
menuBtn?.addEventListener("click",()=>nav?.classList.toggle("open"));
const ro=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){e.target.classList.add("visible");ro.unobserve(e.target)}}),{threshold:.12});
document.querySelectorAll(".reveal").forEach(e=>ro.observe(e));

document.querySelectorAll(".slider").forEach(slider=>{
 const track=slider.querySelector(".slides"),slides=[...slider.querySelectorAll(".slides>figure")],prev=slider.querySelector(".prev"),next=slider.querySelector(".next"),dots=slider.querySelector(".dots");
 if(!track||slides.length<2)return; let index=0,paused=false,timer; const delay=+slider.dataset.delay||4000;
 slides.forEach((_,i)=>{const d=document.createElement("button");d.type="button";d.setAttribute("aria-label",`Go to slide ${i+1}`);d.onclick=()=>go(i,true);dots.appendChild(d)});
 const go=(n,manual=false)=>{index=(n+slides.length)%slides.length;track.style.transform=`translate3d(${-index*100}%,0,0)`;dots.querySelectorAll("button").forEach((d,i)=>d.classList.toggle("active",i===index));if(manual)restart()};
 const start=()=>{clearInterval(timer);timer=setInterval(()=>{if(!paused)go(index+1)},delay)},restart=()=>{clearInterval(timer);start()};
 prev?.addEventListener("click",e=>{e.stopPropagation();go(index-1,true)});next?.addEventListener("click",e=>{e.stopPropagation();go(index+1,true)});
 slider.addEventListener("mouseenter",()=>paused=true);slider.addEventListener("mouseleave",()=>paused=false);
 slider.addEventListener("focusin",()=>paused=true);slider.addEventListener("focusout",()=>paused=false);
 let touchX=null;slider.addEventListener("touchstart",e=>{touchX=e.changedTouches.clientX;paused=true},{passive:true});
 slider.addEventListener("touchend",e=>{if(touchX===null)return;const dx=e.changedTouches.clientX-touchX;if(Math.abs(dx)>45)go(index+(dx<0?1:-1),true);touchX=null;paused=false},{passive:true});
 go(0);start();
});

// === إدارة الـ Lightbox والمشغلات الذكية المطلقة ===
const lightbox=document.getElementById("mediaLightbox"),image=document.getElementById("lightboxImage");
const lightboxIframe=document.getElementById("lightboxIframe");

const close=()=>{
    lightbox?.classList.remove("open");
    lightbox?.setAttribute("aria-hidden","true");
    document.body.classList.remove("lightbox-open");
    if(image) { image.removeAttribute("src"); image.style.display = "block"; }
    if(lightboxIframe) { lightboxIframe.src = ""; lightboxIframe.style.display = "none"; }
};

document.querySelectorAll(".media-open").forEach(btn=>btn.addEventListener("click",(e)=>{
    e.stopPropagation();
    
    // جلب الرابط المباشر المخزن في زرار الضغط نفسه
    const fullSrc = btn.dataset.full;
    const thumbSrc = btn.querySelector("img")?.src;
    
    if(!lightbox) return;

    // فحص ذكي: لو الرابط المخزن أو الـ full عبارة عن رابط فيسبوك ريلز
    if (fullSrc && fullSrc.includes("facebook.com")) {
        if(image) image.style.display = "none";
        if(lightboxIframe) {
            lightboxIframe.style.display = "block";
            // تحويل الرابط تلقائيًا وبشكل فوري لصيغة المشغل بدون خريطة ثابتة
            lightboxIframe.src = "https://facebook.com" + encodeURIComponent(fullSrc) + "&show_text=false&t=0";
        }
    } else if (thumbSrc && (thumbSrc.includes("vfx") || thumbSrc.includes("rm"))) {
        // حل بديل إضافي: لو مفيش fullSrc بس الصورة تبع قسم الموشن، بنوزع الروابط بناءً على ترتيب الزرار داخل السلايدر الخاص به
        const parentSlider = btn.closest(".slides") || btn.closest(".work-slider");
        const allItems = parentSlider ? [...parentSlider.querySelectorAll(".media-open")] : [];
        const itemIndex = allItems.indexOf(btn);
        
        const fbReelsArray = [
            "https://facebook.comhttps%3A%2F%2Fwww.facebook.com%2Freel%2F4017785205147909&show_text=false&t=0",
            "https://facebook.comhttps%3A%2F%2Fwww.facebook.com%2Freel%2F3463296903818986&show_text=false&t=0",
            "https://facebook.comhttps%3A%2F%2Fwww.facebook.com%2Freel%2F1666649731363694&show_text=false&t=0",
            "https://facebook.comhttps%3A%2F%2Fwww.facebook.com%2Freel%2F1848437869396200&show_text=false&t=0",
            "https://facebook.comhttps%3A%2F%2Fwww.facebook.com%2Freel%2F25238938432408638&show_text=false&t=0"
        ];
        
        const matchedReel = (itemIndex >= 0 && itemIndex < fbReelsArray.length) ? fbReelsArray[itemIndex] : fbReelsArray[0];
        if(image) image.style.display = "none";
        if(lightboxIframe) { lightboxIframe.style.display = "block"; lightboxIframe.src = matchedReel; }
    } else if (image && (fullSrc || thumbSrc)) {
        // تشغيل الصور العادية لبقية السكاشن
        if(lightboxIframe) lightboxIframe.style.display = "none";
        image.style.display = "block";
        image.src = fullSrc || thumbSrc;
        image.alt = btn.querySelector("img")?.alt || "Tiamo Mohamad artwork";
    }

    lightbox.classList.add("open");
    lightbox.setAttribute("aria-hidden","false");
    document.body.classList.add("lightbox-open");
}));

lightbox?.addEventListener("click",e=>{if(e.target===lightbox)close()});
document.querySelector(".lightbox-close")?.addEventListener("click",close);
document.addEventListener("keydown",e=>{if(e.key==="Escape")close()});

const glow=document.querySelector(".cursor-glow");if(glow&&matchMedia("(pointer:fine)").matches)window.addEventListener("pointermove",e=>{glow.style.left=e.clientX+"px";glow.style.top=e.clientY+"px"},{passive:true});

const canvas=document.getElementById("particles"),ctx=canvas?.getContext("2d");
if(canvas&&ctx&&matchMedia("(prefers-reduced-motion:no-preference)").matches){let p=[];const resize=()=>{canvas.width=innerWidth*devicePixelRatio;canvas.height=innerHeight*devicePixelRatio;canvas.style.width=innerWidth+"px";canvas.style.height=innerHeight+"px";ctx.setTransform(devicePixelRatio,0,0,devicePixelRatio,0,0);p=Array.from({length:Math.min(55,Math.floor(innerWidth/25))},()=>({x:Math.random()*innerWidth,y:Math.random()*innerHeight,r:Math.random()*1.3+.3,vx:(Math.random()-.5)*.18,vy:(Math.random()-.5)*.18}))};const draw=()=>{ctx.clearRect(0,0,innerWidth,innerHeight);ctx.fillStyle="rgba(181,140,255,.45)";p.forEach(a=>{a.x+=a.vx;a.y+=a.vy;if(a.x<0||a.x>innerWidth)a.vx*=-1;if(a.y<0||a.y>innerHeight)a.vy*=-1;ctx.beginPath();ctx.arc(a.x,a.y,a.r,0,Math.PI*2);ctx.fill()});requestAnimationFrame(draw)};addEventListener("resize",resize);resize();draw()}
})();
