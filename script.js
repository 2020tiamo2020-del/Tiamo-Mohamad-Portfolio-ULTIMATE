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
 let touchX=null;slider.addEventListener("touchstart",e=>{touchX=e.changedTouches[0].clientX;paused=true},{passive:true});
 slider.addEventListener("touchend",e=>{if(touchX===null)return;const dx=e.changedTouches[0].clientX-touchX;if(Math.abs(dx)>45)go(index+(dx<0?1:-1),true);touchX=null;paused=false},{passive:true});
 go(0);start();
});

const lightbox = document.getElementById("mediaLightbox");
const lightboxImage = document.getElementById("lightboxImage");

// إنشاء مشغل فيديو مخفي جوة الصندوق عشان نستخدمه للفيديوهات فقط
let lightboxVideo = document.getElementById("lightboxVideo");
if (!lightboxVideo && lightbox) {
    lightboxVideo = document.createElement("video");
    lightboxVideo.id = "lightboxVideo";
    lightboxVideo.controls = true;
    lightboxVideo.style.maxWidth = "100%";
    lightboxVideo.style.maxHeight = "80vh";
    lightboxVideo.style.display = "none"; // مخفي في العادي
    lightbox.appendChild(lightboxVideo);
}

// دالة الإغلاق (بتطفي الفيديو والصورة لما تقفل الصندوق)
const close = () => {
    lightbox?.classList.remove("open");
    lightbox?.setAttribute("aria-hidden", "true");
    document.body.classList.remove("lightbox-open");
    if (lightboxImage) lightboxImage.removeAttribute("src");
    if (lightboxVideo) {
        lightboxVideo.pause();
        lightboxVideo.removeAttribute("src");
        lightboxVideo.load();
    }
};

// تشغيل الصندوق بذكاء بناءً على نوع الكارت
document.querySelectorAll(".media-open").forEach((btn) => {
    btn.addEventListener("click", (e) => {
                const src = btn.dataset.src;
        let videoSrc = src;
        
        // تحويل رابط ريلز الفيسبوك إلى صيغة المشغل الرسمي المتوافق مع موقعك
        if (src && src.includes("facebook.com") && src.includes("/reel/")) {
            const reelId = src.split("/reel/")[1].split("/")[0].split("?")[0];
            videoSrc = `https://facebook.com{reelId}%2F&show_text=false&t=0`;
        }

        // التأكد إذا كان الكارت المضغوط عليه هو المربع رقم 4 الخاص بالفيديوهات
        const isVideo = btn.closest(".gallery-card")?.querySelector("h3")?.textContent.includes("VIDEO") || btn.dataset.type === "video";

        if (src) {
            if (isVideo) {
                if (lightboxImage) lightboxImage.style.display = "none"; // إخفاء الصورة تماماً
                
                // لو الرابط جاي من فيسبوك، هنشغله جوة iframe عشان الحماية
                if (src.includes("facebook.com")) {
                    if (lightboxVideo) lightboxVideo.style.display = "none";
                    let iframe = document.getElementById("lightboxIframe");
                    if (!iframe) {
                        iframe = document.createElement("iframe");
                        iframe.id = "lightboxIframe";
                        iframe.style.width = "100%";
                        iframe.style.height = "80vh";
                        iframe.style.maxWidth = "420px"; // أنسب عرض طولي لشاشة الريلز
                        iframe.style.border = "none";
                        lightbox.appendChild(iframe);
                    }
                    iframe.style.display = "block";
                    iframe.src = videoSrc;
                } else if (lightboxVideo) {
                    // تشغيل الفيديوهات العادية MP4 لو مش فيسبوك
                    const iframe = document.getElementById("lightboxIframe");
                    if (iframe) iframe.style.display = "none";
                    lightboxVideo.style.display = "block";
                    lightboxVideo.src = videoSrc;
                    lightboxVideo.play().catch(err => console.log("Auto-play prevented"));
                }
            } else if (lightboxImage) {
                // عرض الصور العادية في السكاشن التانية
                const iframe = document.getElementById("lightboxIframe");
                if (iframe) iframe.style.display = "none";
                if (lightboxVideo) lightboxVideo.style.display = "none";
                lightboxImage.style.display = "block";
                lightboxImage.src = src;
                lightboxImage.alt = btn.querySelector("img")?.alt || "Gallery Image";
            }

            }
            lightbox?.classList.add("open");
            lightbox?.setAttribute("aria-hidden", "false");
            document.body.classList.add("lightbox-open");
        }
    });
});

lightbox?.addEventListener("click", (e) => { if (e.target === lightbox) close(); });
document.querySelector(".lightbox-close")?.addEventListener("click", close);
document.addEventListener("keydown", (e) => { if (e.key === "Escape") close(); });

lightbox?.addEventListener("click",e=>{if(e.target===lightbox)close()});document.querySelector(".lightbox-close")?.addEventListener("click",close);document.addEventListener("keydown",e=>{if(e.key==="Escape")close()});

const glow=document.querySelector(".cursor-glow");if(glow&&matchMedia("(pointer:fine)").matches)window.addEventListener("pointermove",e=>{glow.style.left=e.clientX+"px";glow.style.top=e.clientY+"px"},{passive:true});

const canvas=document.getElementById("particles"),ctx=canvas?.getContext("2d");
if(canvas&&ctx&&matchMedia("(prefers-reduced-motion:no-preference)").matches){let p=[];const resize=()=>{canvas.width=innerWidth*devicePixelRatio;canvas.height=innerHeight*devicePixelRatio;canvas.style.width=innerWidth+"px";canvas.style.height=innerHeight+"px";ctx.setTransform(devicePixelRatio,0,0,devicePixelRatio,0,0);p=Array.from({length:Math.min(55,Math.floor(innerWidth/25))},()=>({x:Math.random()*innerWidth,y:Math.random()*innerHeight,r:Math.random()*1.3+.3,vx:(Math.random()-.5)*.18,vy:(Math.random()-.5)*.18}))};const draw=()=>{ctx.clearRect(0,0,innerWidth,innerHeight);ctx.fillStyle="rgba(181,140,255,.45)";p.forEach(a=>{a.x+=a.vx;a.y+=a.vy;if(a.x<0||a.x>innerWidth)a.vx*=-1;if(a.y<0||a.y>innerHeight)a.vy*=-1;ctx.beginPath();ctx.arc(a.x,a.y,a.r,0,Math.PI*2);ctx.fill()});requestAnimationFrame(draw)};addEventListener("resize",resize);resize();draw()}
})();
