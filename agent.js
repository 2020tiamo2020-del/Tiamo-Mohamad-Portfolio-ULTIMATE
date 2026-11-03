(function(){
"use strict";
var D=document,H=D.documentElement,$=function(s,r){return(r||D).querySelector(s)};
var ENDPOINT=window.TIAMO_AGENT_ENDPOINT||""; // optional Cloudflare Worker URL for a real LLM
var WA="https://wa.me/201278536645?text=";
function lang(){try{var l=localStorage.getItem("tiamo-lang");if(l)return l}catch(e){}return H.dir==="rtl"||H.lang==="ar"?"ar":"en"}
function T(o){return o[lang()]||o.en}
/* ---------- Director Mode presets ---------- */
var G={
 nostalgia:{k:/نوستالج|تسعين|90s|retro|vhs|nostalg|قديم/i,n:{en:"90s nostalgia",ar:"نوستالجيا التسعينات"},c:["#ffb347","#ff6b6b","#7a4b2a"],p:"#ff9a3d",b:"#ffd27a",lb:1,grain:.3},
 cyber:{k:/سايبر|cyber|neon|نيون|مطر|rain|future|مستقبل/i,n:{en:"Cyberpunk rain",ar:"سايبربانك"},c:["#ff2bd6","#16d8ff","#12002b"],p:"#ff2bd6",b:"#16d8ff",lb:1,grain:.14},
 noir:{k:/noir|اسود|أسود|ابيض|أبيض|b&w|غموض|dark mood|دراما/i,n:{en:"Film noir",ar:"نوار"},c:["#ffffff","#8a8a8a","#0a0a0a"],p:"#cfcfcf",b:"#ffffff",lb:1,grain:.28,gray:1},
 dream:{k:/حالم|dream|pastel|باستيل|هادي|calm|soft|ناعم/i,n:{en:"Dreamy pastel",ar:"حالم باستيل"},c:["#ffc8dd","#bde0fe","#cdb4db"],p:"#cdb4db",b:"#bde0fe",lb:0,grain:.08},
 gold:{k:/ذهب|gold|دافي|warm|sunset|غروب|luxury|فخم/i,n:{en:"Golden hour",ar:"الساعة الذهبية"},c:["#f9c74f","#f3722c","#3d1f0a"],p:"#f3722c",b:"#f9c74f",lb:1,grain:.12},
 alien:{k:/فضاء|space|alien|sci|خيال|fantasy|سحر|magic|green/i,n:{en:"Alien green",ar:"فضائي أخضر"},c:["#39ff88","#0ff","#031a12"],p:"#14d96a",b:"#39ff88",lb:1,grain:.16}
};
var EXT=[],layer,tag,cur=null,keep={p:getComputedStyle(H).getPropertyValue("--purple"),b:getComputedStyle(H).getPropertyValue("--blue")};
function build(){layer=D.createElement("div");layer.id="tmgrade";layer.setAttribute("aria-hidden","true");
 layer.innerHTML='<i class="g-tint"></i><i class="g-vig"></i><i class="g-grain"></i><i class="g-bar t"></i><i class="g-bar b"></i>';
 D.body.appendChild(layer);tag=D.createElement("div");tag.className="tma-tag";D.body.appendChild(tag)}
function grade(id){
 if(!id||id==="off"){cur=null;layer.classList.remove("on","lb");H.style.setProperty("--purple",keep.p);H.style.setProperty("--blue",keep.b);H.style.filter="";tag.classList.remove("on");return}
 var g=G[id];cur=id;$(".g-tint",layer).style.background="linear-gradient(135deg,"+g.c[0]+","+g.c[1]+","+g.c[2]+")";
 $(".g-grain",layer).style.opacity=g.grain;layer.classList.add("on");layer.classList.toggle("lb",!!g.lb);
 H.style.setProperty("--purple",g.p);H.style.setProperty("--blue",g.b);H.style.filter=g.gray?"grayscale(.9) contrast(1.1)":"";
 tag.textContent=T(g.n);tag.classList.add("on");setTimeout(function(){tag.classList.remove("on")},2600)}
/* ---------- tools ---------- */
var NAV=[[/about|مين|عنك|نبذ/i,"about"],[/service|خدم/i,"services"],[/work|شغل|اعمال|أعمال|project|مشاريع/i,"work"],[/reel|ريل|cinema|سينم|فيديو|video|vfx/i,"cinema"],[/\bai\b|ذكاء|creation|ابداع|إبداع/i,"creation"],[/before|after|قبل|بعد|photoshop|فوتوشوب/i,"beforeafter"],[/process|خطوات|مراحل|اسلوب/i,"process"],[/brief|ابدأ|ابدا/i,"brief"],[/contact|تواصل|اتصل|whats|واتس|رقم/i,"contact"]];
function go(id){var el=D.getElementById(id);if(el)el.scrollIntoView({behavior:"smooth",block:"start"});else scrollTo({top:0,behavior:"smooth"})}
function click(sel){var e=$(sel);if(e)e.click();return !!e}
/* ---------- brief whisperer ---------- */
var SV=[[/قهو|cafe|coffee|مطعم|restaurant|اعلان|إعلان|ad\b|ads|تسويق/i,{en:"Ad / Reel",ar:"إعلان / ريل"}],[/لوجو|logo|براند|brand|هوية/i,{en:"Logo & Branding",ar:"لوجو وهوية"}],[/صور|photo|فوتوشوب|photoshop|ترميم|restor|تعديل/i,{en:"Photoshop & Photo work",ar:"فوتوشوب وتعديل صور"}],[/\bai\b|ذكاء|لوحة|\bart\b|فن|خيال/i,{en:"AI Art",ar:"فن بالذكاء الاصطناعي"}],[/فيديو|video|مونتاج|montage|vfx|فيلم|film|سينم/i,{en:"Video & VFX",ar:"فيديو وVFX"}]];
function brief(txt){
 var s=T({en:"Creative project",ar:"مشروع إبداعي"});SV.some(function(x){if(x[0].test(txt)){s=T(x[1]);return 1}});
 var id=null;Object.keys(G).some(function(k){if(G[k].k.test(txt)){id=k;return 1}});id=id||"cyber";var g=G[id];
 var shots=T({en:["Establishing wide shot, slow push-in","Hero close-up with rim light","Detail / texture macro","Closing frame with logo on negative space"],ar:["لقطة افتتاحية واسعة مع تقريب بطيء","كلوز أب للعنصر الرئيسي بإضاءة جانبية","لقطة تفاصيل ماكرو","لقطة ختامية واللوجو في مساحة فاضية"]});
 var msg=T({en:"Hi Tiamo, brief from your site agent:\n• Type: "+s+"\n• Mood: "+g.n.en+"\n• My idea: "+txt,ar:"أهلاً تيامو، بريف من وكيل موقعك:\n• النوع: "+s+"\n• المود: "+g.n.ar+"\n• فكرتي: "+txt});
 var c=D.createElement("div");c.className="tma-card";var h=D.createElement("h4");h.textContent=s+" · "+T(g.n);c.appendChild(h);
 var sw=D.createElement("div");sw.className="tma-sw";g.c.forEach(function(x){var i=D.createElement("i");i.style.background=x;sw.appendChild(i)});c.appendChild(sw);
 var ol=D.createElement("ol");shots.forEach(function(x){var li=D.createElement("li");li.textContent=x;ol.appendChild(li)});c.appendChild(ol);
 var a=D.createElement("a");a.className="tma-btn";a.target="_blank";a.rel="noopener";a.href=WA+encodeURIComponent(msg);a.textContent=T({en:"Send this brief to Tiamo",ar:"ابعت البريف لتيامو"});c.appendChild(a);
 grade(id);return c}
/* ---------- brain ---------- */
function think(q){
 var t=q.trim(),r;for(var i=0;i<EXT.length;i++){var x=EXT[i](t,lang());if(x)return x}
 if(/^(hi|hello|hey|اهلا|أهلا|مرحبا|سلام|هاي|ازيك)/i.test(t))return {t:T({en:"Hey! I'm Tiamo's twin. Ask me to show you work, change the mood of the whole site, or turn your idea into a brief.",ar:"أهلاً! أنا توأم تيامو. اطلب مني أوريك شغل، أغيّر مود الموقع كله، أو أحوّل فكرتك لبريف."})};
 if(/\b(reset|off)\b|رجع|رجّع|عادي|الغ|ألغ/i.test(t)){grade("off");return {t:T({en:"Back to the original look.",ar:"رجعت الشكل الأصلي."})}}
 if(/عربي|arabic|بالعربي/i.test(t)){click("#langBtn");return {t:"تمام."}}
 if(/english|انجليزي|إنجليزي/i.test(t)){click("#langBtn");return {t:"Done."}}
 if(/music|موسيق|اغني|أغني/i.test(t)){click("#tmOrb");return {t:T({en:"Music toggled.",ar:"غيّرت حالة الموسيقى."})}}
 if(/عايز|محتاج|اعمل|عاوز|i want|i need|make me|create for/i.test(t)&&t.length>14)return {t:T({en:"Here's a first brief from your idea:",ar:"ده أول بريف طلعته من فكرتك:"}),card:brief(t)};
 var id=null;Object.keys(G).some(function(k){if(G[k].k.test(t)){id=k;return 1}});
 if(id||/mood|مود|اجواء|أجواء|grade|director/i.test(t)){id=id||"cyber";grade(id);return {t:T({en:"Director mode: "+G[id].n.en+". Say 'reset' to undo.",ar:"وضع المخرج: "+G[id].n.ar+". قول 'رجّع' للإلغاء."})}}
 NAV.some(function(n){if(n[0].test(t)){r=n[1];return 1}});
 if(r){go(r);return {t:T({en:"Taking you there.",ar:"ماشي، هوديك هناك."})}}
 return null}
function ask(q){
 var a=think(q);if(a)return Promise.resolve(a);
 if(!ENDPOINT)return Promise.resolve({t:T({en:"I didn't catch that. Try: 'show reels', 'mood: noir', or 'I want an ad for my coffee shop'.",ar:"مفهمتش قصدك. جرّب: 'وريني الريلز'، 'مود: نوار'، أو 'عايز إعلان لمحل القهوة بتاعي'."})});
 return fetch(ENDPOINT,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({q:q,lang:lang()})}).then(function(r){return r.json()}).then(function(j){return {t:String(j.reply||"")}}).catch(function(){return {t:T({en:"My brain is offline right now.",ar:"مخي مش متصل دلوقتي."})}})}
/* ---------- UI ---------- */
function ui(){
 var w=D.createElement("div");w.className="tma";
 w.innerHTML='<div class="tma-bubble" role="status"></div><section class="tma-panel" aria-label="Tiamo Twin"><div class="tma-head"><span>Tiamo Twin <small></small></span><button class="tma-chip" type="button" data-x>✕</button></div><div class="tma-log" aria-live="polite"></div><div class="tma-chips"></div><form class="tma-form"><input type="text" autocomplete="off" maxlength="300"><button class="tma-btn" type="submit">↵</button></form></section><button class="tma-orb" type="button" aria-label="Tiamo Twin"><span class="tma-eyes"><span class="tma-eye"><i></i></span><span class="tma-eye"><i></i></span></span></button>';
 D.body.appendChild(w);
 var orb=$(".tma-orb",w),log=$(".tma-log",w),bub=$(".tma-bubble",w),inp=$("input",w),chips=$(".tma-chips",w);
 function say(c,txt){var m=D.createElement("div");m.className="tma-m "+c;m.textContent=txt;log.appendChild(m);if(c==="b"&&API.onsay)API.onsay(txt);log.scrollTop=log.scrollHeight}
 function texts(){$(".tma-head small",w).textContent=T({en:"· your guide",ar:"· دليلك"});inp.placeholder=T({en:"Ask, or type a mood…",ar:"اسأل أو اكتب مود…"});
  chips.innerHTML="";T({en:["Show reels","Mood: noir","Cyberpunk","Edit photo: warmer","Roast: a cat in a city","Camera","Reset"],ar:["وريني الريلز","مود: نوار","سايبربانك","عدّل الصورة: أدفأ","Roast: قطة في مدينة","كاميرا","رجّع"]}).forEach(function(x){var b=D.createElement("button");b.type="button";b.className="tma-chip";b.textContent=x;b.onclick=function(){send(x)};chips.appendChild(b)})}
 function send(q){if(!q)return;say("u",q);ask(q).then(function(a){say("b",a.t);if(a.card){log.appendChild(a.card);log.scrollTop=log.scrollHeight}})}
 function open(v){w.classList.toggle("open",v);if(v){texts();if(!log.children.length)say("b",T({en:"Hi, I'm Tiamo's twin. What are we making today?",ar:"أهلاً، أنا توأم تيامو. هنعمل إيه النهارده؟"}));setTimeout(function(){inp.focus()},300)}}
 orb.onclick=function(){open(!w.classList.contains("open"))};$("[data-x]",w).onclick=function(){open(false)};
 D.addEventListener("keydown",function(e){if(e.key==="Escape")open(false)});
 $("form",w).onsubmit=function(e){e.preventDefault();var v=inp.value;inp.value="";send(v)};
 /* eyes follow cursor */
 var eyes=w.querySelectorAll(".tma-eye i");
 addEventListener("pointermove",function(e){var r=orb.getBoundingClientRect(),dx=e.clientX-(r.left+r.width/2),dy=e.clientY-(r.top+r.height/2),d=Math.hypot(dx,dy)||1,k=Math.min(3,d/60);
  eyes.forEach(function(i){i.style.transform="translate("+dx/d*k+"px,"+dy/d*k+"px)"})},{passive:true});
 /* context whispers */
 var WH={about:{en:"That's the man himself. Ask me about his style.",ar:"ده تيامو نفسه. اسألني عن أسلوبه."},services:{en:"12 services. Want me to pick the right one for your idea?",ar:"12 خدمة. تحب أختار لك المناسبة لفكرتك؟"},work:{en:"Notice the lighting on these. Hover and take your time.",ar:"لاحظ الإضاءة في الشغل ده. خدّ وقتك."},cinema:{en:"Try 'mood: cyberpunk' while you watch these.",ar:"جرّب تكتب 'مود: سايبربانك' وانت بتتفرج."},creation:{en:"Double-click any image and it will talk to you.",ar:"اضغط دوبل كليك على أي صورة وهتتكلم معاك."},beforeafter:{en:"Drag the line. This is where the magic is.",ar:"حرّك الخط. هنا السحر."},brief:{en:"Skip the form: just tell me your idea in one line.",ar:"سيب الفورم: قولي فكرتك في سطر."}};
 var seen={},tm,io=new IntersectionObserver(function(es){es.forEach(function(e){var id=e.target.id;if(e.isIntersecting&&WH[id]&&!seen[id]&&!w.classList.contains("open")){seen[id]=1;clearTimeout(tm);bub.textContent=T(WH[id]);bub.classList.add("on");tm=setTimeout(function(){bub.classList.remove("on")},4500)}})},{threshold:.45});
 Object.keys(WH).forEach(function(id){var s=D.getElementById(id);if(s)io.observe(s)});API.send=send;API.say=say;API.open=open;API.form=$("form",w);API.log=log;API.inp=inp;API.orb=orb}
var API={grade:grade,go:go,G:G,T:T,lang:lang,use:function(f){EXT.push(f)}};window.TiamoAgent=API;
function init(){build();ui();var sc=D.createElement("script");sc.src="agent-plus.js?v=1";D.body.appendChild(sc)}
if(D.readyState==="loading")D.addEventListener("DOMContentLoaded",init);else init();
})();
