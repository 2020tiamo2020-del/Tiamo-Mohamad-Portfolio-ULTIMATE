(function(){
"use strict";
var A=window.TiamoAgent,D=document,$=function(s,r){return(r||D).querySelector(s)},T=A.T;
function el(t,c,x){var e=D.createElement(t);if(c)e.className=c;if(x!=null)e.textContent=x;return e}
var st=D.createElement("style");st.textContent=".tma-ly{display:flex;align-items:center;gap:8px;margin:5px 0;font-size:12px;opacity:0;transform:translateX(-8px);transition:.5s}.tma-ly.on{opacity:1;transform:none}.tma-ly b{width:8px;height:8px;border-radius:50%;background:#16d8ff;box-shadow:0 0 8px #16d8ff}.tma-ly i{flex:1;height:5px;border-radius:5px;background:rgba(255,255,255,.1);overflow:hidden}.tma-ly i::after{content:'';display:block;height:100%;width:var(--w);background:linear-gradient(90deg,#8b35ff,#16d8ff)}.tma-bar{display:grid;grid-template-columns:78px 1fr 22px;gap:8px;align-items:center;margin:4px 0;font-size:12px}.tma-bar i{height:6px;border-radius:6px;background:rgba(255,255,255,.1);overflow:hidden}.tma-bar i::after{content:'';display:block;height:100%;width:var(--w);background:linear-gradient(90deg,#8b35ff,#16d8ff);transition:width 1s}.tma-q{padding:8px 10px;border-radius:10px;background:rgba(255,255,255,.06);margin:8px 0;color:#e8e3f7;font-size:12.5px;line-height:1.5}.tma-row{display:flex;gap:6px;flex-wrap:wrap}.tma-th{width:100%;max-height:150px;object-fit:cover;border-radius:10px;margin-bottom:8px}.tma-mic{width:38px;border-radius:50%;border:1px solid rgba(255,255,255,.16);background:rgba(255,255,255,.05);color:#f6f3ff;cursor:pointer;font-size:15px}.tma-mic.rec{background:#ff3b6b;animation:tmaPulse 1s infinite}.tma-mb{display:grid;grid-template-columns:repeat(4,1fr);gap:6px;margin:6px 0 10px}.tma-mb img,.tma-mb i{aspect-ratio:3/4;width:100%;object-fit:cover;border-radius:8px;display:block}.tma-mb i{background:linear-gradient(110deg,rgba(255,255,255,.05) 30%,rgba(255,255,255,.14) 50%,rgba(255,255,255,.05) 70%);background-size:200% 100%;animation:tmaSh 1.2s infinite}@keyframes tmaSh{to{background-position:-200% 0}}.tma-cam{position:fixed;inset-inline-start:18px;bottom:18px;z-index:9991;font-size:11px;padding:7px 12px;border-radius:99px;background:rgba(12,9,20,.9);border:1px solid #16d8ff;color:#f6f3ff;cursor:pointer;display:none}";D.head.appendChild(st);
/* ===== Photoshop Agent ===== */
var OPS=[[/أدفأ|دافي|warm|دفء/i,"Color Balance · Warm","توازن الألوان · دافئ","sepia(.22) saturate(1.15) hue-rotate(-8deg)"],[/أبرد|بارد|cool|cold/i,"Color Balance · Cool","توازن الألوان · بارد","hue-rotate(14deg) saturate(.95) brightness(1.03)"],[/درام|dramatic|contrast|كونتراست/i,"Curves · S-curve","منحنيات · S","contrast(1.3) brightness(.93) saturate(1.08)"],[/أفتح|افتح|brighter|brighten/i,"Exposure +","تعريض +","brightness(1.18)"],[/أغمق|اغمق|darker|moodier/i,"Exposure −","تعريض −","brightness(.8) contrast(1.1)"],[/حيوي|vivid|زاهي|saturat/i,"Vibrance +","حيوية +","saturate(1.5)"],[/أبيض وأسود|ابيض واسود|black and white|b&w|\bbw\b|مونو/i,"Black & White","أبيض وأسود","grayscale(1) contrast(1.15)"],[/ناعم|soft|dreamy|توهج/i,"Soft Glow","توهج ناعم","blur(.5px) brightness(1.06) saturate(1.1)"]];
var fx=[];function pane(){return $(".ba-after-pane")}
function setFx(){var p=pane();if(p)p.style.filter=fx.join(" ")}
function psEdit(t){
 if(!/edit|retouch|photo|عدّ?ل|خلي|الصورة|صورة/i.test(t))return null;
 var hit=OPS.filter(function(o){return o[0].test(t)});if(!hit.length)return null;
 A.go("beforeafter");var c=el("div","tma-card");c.appendChild(el("h4",0,T({en:"Layers",ar:"الطبقات"})));
 hit.forEach(function(o,i){var r=el("div","tma-ly");r.appendChild(el("b"));r.appendChild(el("span",0,T({en:o[1],ar:o[2]})));var b=el("i");b.style.setProperty("--w",(60+Math.random()*40|0)+"%");r.appendChild(b);c.appendChild(r);
  setTimeout(function(){r.classList.add("on");fx.push(o[3]);setFx()},500+i*700)});
 var b=el("button","tma-chip",T({en:"Undo edits",ar:"تراجع عن التعديل"}));b.type="button";b.onclick=function(){fx=[];setFx()};c.appendChild(b);
 return {t:T({en:"Editing the 'after' photo live. Scroll up to watch.",ar:"بعدّل صورة الـ After قدامك. شوفها فوق."}),card:c}}
/* ===== Ask the Artwork ===== */
D.addEventListener("dblclick",function(e){var t=e.target.closest&&e.target.closest(".cr-wall [data-u]");if(!t)return;var u=t.dataset.u,im=new Image();
 im.onload=function(){var cv=el("canvas");cv.width=cv.height=8;var x=cv.getContext("2d");x.drawImage(im,0,0,8,8);var d=x.getImageData(0,0,8,8).data,r=0,g=0,b=0,n=64;
  for(var i=0;i<d.length;i+=4){r+=d[i];g+=d[i+1];b+=d[i+2]}r/=n;g/=n;b/=n;var L=(r+g+b)/3,k=L<75?0:L>165?1:r-b>18?2:3;
  var V=[{en:"I live in the shadows. Tiamo left just enough light so you'd lean closer.",ar:"أنا عايشة في الضلمة. تيامو سابلي ضوء كفاية عشان تقرّب."},{en:"I'm all daylight. Nothing to hide, and every color fought to be here.",ar:"أنا نور كله. مفيش حاجة مخبّياها، وكل لون اتحارب عشان يبقى هنا."},{en:"Warm like the last ten minutes before sunset. Stay a little.",ar:"دافية زي آخر عشر دقايق قبل الغروب. استنى شوية."},{en:"I'm the quiet one: cool tones, slow breathing, a little mystery.",ar:"أنا الهادية: ألوان باردة ونفس بطيء وشوية غموض."}];
  var n=(u.match(/(\d+)\.\w+$/)||[0,"?"])[1],c=el("div","tma-card"),th=el("img","tma-th");th.src=u;th.alt="";c.appendChild(th);
  c.appendChild(el("h4",0,T({en:"Artwork #"+n+" says:",ar:"العمل رقم "+n+" بيقول:"})));c.appendChild(el("div","tma-q",T(V[k])));
  var a=el("a","tma-btn",T({en:"I want a piece like this",ar:"عايز شغل زي ده"}));a.target="_blank";a.rel="noopener";a.href="https://wa.me/201278536645?text="+encodeURIComponent(T({en:"Hi Tiamo, I loved AI artwork #"+n+" and want something similar.",ar:"أهلاً تيامو، عجبني العمل رقم "+n+" وعايز حاجة زيه."}));c.appendChild(a);
  A.open(true);A.say("b",T({en:"You woke an artwork up. Listen:",ar:"صحّيت لوحة. اسمعها:"}));A.log.appendChild(c);A.log.scrollTop=A.log.scrollHeight};im.src=u});
/* ===== Roast My Prompt ===== */
var DIM=[["Subject","الموضوع",null],["Light","الإضاءة",/light|rim|neon|sunset|golden|backlit|volumetric|glow|إضاءة|ضوء|نيون|غروب/i],["Lens","العدسة",/\b\d{2,3}\s?mm\b|lens|bokeh|macro|wide|close-?up|f\/\d|عدسة|لقطة|ماكرو/i],["Style","الأسلوب",/style|photoreal|illustrat|oil|3d|render|anime|cinematic|film|kodak|ستايل|أسلوب|سينمائي/i],["Color","الألوان",/mood|palette|teal|orange|pastel|moody|color|colour|ألوان|مود|باليت/i],["Detail","التفاصيل",/8k|detailed|texture|intricate|sharp|تفاصيل|ملمس/i]];
var ADD=["warm rim light","85mm lens, shallow depth of field","cinematic film still","teal and orange palette","ultra-detailed texture, 8k"];
function roast(t){var m=t.match(/^(?:roast|قيّم|قيم|قيّمي)[^:：]*[:：]\s*([\s\S]+)/i)||t.match(/(?:prompt|برومبت)\s*[:：]\s*([\s\S]+)/i);
 if(!/roast|قيّ?م|برومبت.*[:：]|prompt\s*[:：]/i.test(t))return null;
 if(!m)return {t:T({en:"Send it like this: Roast: your prompt here",ar:"ابعته كده: Roast: البرومبت بتاعك هنا"})};
 var p=m[1].trim(),w=p.split(/\s+/).length,sc=DIM.map(function(d,i){var s=i?(d[2].test(p)?8+(w>14?1:0):2):Math.min(9,2+w);return Math.max(2,Math.min(10,s|0))});
 var tot=Math.round(sc.reduce(function(a,b){return a+b},0)/sc.length*10)/10,low=sc.indexOf(Math.min.apply(0,sc));
 var R={en:["Your subject is lonely. Give it a world.","No light? Bold, if you like cameras that guess.","No lens info, so the AI will pick a boring default.","No style: you asked for 'an image', not a vision.","Colors left to chance. The model will choose beige.","Where are the details? It reads like a first draft."],ar:["الموضوع وحيد. اديله عالم حواليه.","من غير إضاءة؟ جريء، لو بتحب كاميرات بتخمّن.","من غير عدسة، الـ AI هيختار الافتراضي المملّ.","من غير أسلوب: طلبت 'صورة' مش رؤية.","الألوان متسابة للصدفة. الموديل هيختار البيج.","فين التفاصيل؟ شكله مسودة أولى."]};
 var imp=p+", "+sc.map(function(s,i){return i&&s<5?ADD[i-1]:null}).filter(Boolean).join(", ");
 var c=el("div","tma-card");c.appendChild(el("h4",0,T({en:"Score "+tot+" / 10",ar:"الدرجة "+tot+" / 10"})));
 DIM.forEach(function(d,i){var r=el("div","tma-bar");r.appendChild(el("span",0,T({en:d[0],ar:d[1]})));var b=el("i");b.style.setProperty("--w","0%");r.appendChild(b);r.appendChild(el("span",0,sc[i]));c.appendChild(r);setTimeout(function(){b.style.setProperty("--w",sc[i]*10+"%")},200+i*120)});
 c.appendChild(el("div","tma-q","“"+T({en:R.en[low],ar:R.ar[low]})+"”"));c.appendChild(el("div","tma-q",imp));
 var row=el("div","tma-row"),cp=el("button","tma-chip",T({en:"Copy improved",ar:"انسخ المحسّن"}));cp.type="button";cp.onclick=function(){try{navigator.clipboard.writeText(imp)}catch(e){}};
 var dl=el("button","tma-btn",T({en:"Download card",ar:"نزّل الكارت"}));dl.type="button";dl.onclick=function(){card(tot,sc,T({en:R.en[low],ar:R.ar[low]}))};row.appendChild(cp);row.appendChild(dl);c.appendChild(row);
 return {t:T({en:"Roasted. Here's the damage:",ar:"اتشوى. دي النتيجة:"}),card:c}}
function card(tot,sc,line){var cv=el("canvas");cv.width=1080;cv.height=1350;var x=cv.getContext("2d"),g=x.createLinearGradient(0,0,1080,1350);g.addColorStop(0,"#1a0b3a");g.addColorStop(1,"#05040a");x.fillStyle=g;x.fillRect(0,0,1080,1350);
 x.fillStyle="#f6f3ff";x.font="700 64px sans-serif";x.fillText("ROAST MY PROMPT",70,130);x.font="800 220px sans-serif";x.fillStyle="#16d8ff";x.fillText(tot,70,380);x.font="40px sans-serif";x.fillStyle="#a7a1b7";x.fillText("/ 10",70,440);
 DIM.forEach(function(d,i){var y=540+i*95;x.fillStyle="#f6f3ff";x.font="34px sans-serif";x.fillText(d[0],70,y);x.fillStyle="rgba(255,255,255,.12)";x.fillRect(300,y-28,640,18);var q=x.createLinearGradient(300,0,940,0);q.addColorStop(0,"#8b35ff");q.addColorStop(1,"#16d8ff");x.fillStyle=q;x.fillRect(300,y-28,64*sc[i],18)});
 x.fillStyle="#f6f3ff";x.font="italic 38px sans-serif";var ws=("“"+line+"”").split(" "),ln="",y=1180;ws.forEach(function(w){if(x.measureText(ln+w).width>940){x.fillText(ln,70,y);y+=52;ln=""}ln+=w+" "});x.fillText(ln,70,y);
 x.fillStyle="#8b35ff";x.font="600 30px sans-serif";x.fillText("Tiamo Mohamad · Twin",70,1300);var a=el("a");a.download="roast.png";a.href=cv.toDataURL("image/png");a.click()}
/* ===== Camera gaze ===== */
var cam=null,btn=el("button","tma-cam",T({en:"Stop camera",ar:"إيقاف الكاميرا"}));btn.type="button";D.body.appendChild(btn);
function stopCam(){if(!cam)return;cam.on=false;cam.s.getTracks().forEach(function(t){t.stop()});var p=cam.p;if(p)p.style.transform="";cam=null;btn.style.display="none"}
btn.onclick=stopCam;
function startCam(){
 if(cam)return {t:T({en:"Camera is already on.",ar:"الكاميرا شغالة بالفعل."})};
 if(!navigator.mediaDevices||!navigator.mediaDevices.getUserMedia)return {t:T({en:"Your browser has no camera access.",ar:"المتصفح مفيهوش وصول للكاميرا."})};
 navigator.mediaDevices.getUserMedia({video:{width:160,height:120},audio:false}).then(function(s){
  var v=el("video");v.srcObject=s;v.muted=true;v.playsInline=true;v.play();var cv=el("canvas");cv.width=64;cv.height=48;var x=cv.getContext("2d",{willReadFrequently:true});
  var img=$("#about img[alt='Tiamo Mohamad']"),p=img&&img.parentElement;if(!p){s.getTracks().forEach(function(t){t.stop()});return}
  cam={s:s,on:true,p:p};btn.style.display="block";A.go("about");p.style.transition="transform .18s linear";
  var prev=null,mx=.5,my=.5;
  (function loop(){if(!cam||!cam.on)return;x.drawImage(v,0,0,64,48);var d=x.getImageData(0,0,64,48).data,g=new Uint8Array(3072),sx=0,sy=0,n=0;
   for(var i=0,j=0;i<d.length;i+=4,j++){g[j]=(d[i]+d[i+1]+d[i+2])/3;if(prev&&Math.abs(g[j]-prev[j])>22){sx+=j%64;sy+=(j/64)|0;n++}}
   prev=g;if(n>14){mx+=((1-sx/n/64)-mx)*.35;my+=((sy/n/48)-my)*.35}else{mx+=(.5-mx)*.02;my+=(.5-my)*.02}
   p.style.transform="perspective(900px) rotateY("+(mx-.5)*34+"deg) rotateX("+(.5-my)*22+"deg)";setTimeout(loop,70)})()
 }).catch(function(){A.say("b",T({en:"Camera permission was denied. That's fine.",ar:"اتمنع إذن الكاميرا. عادي."}))});
 return {t:T({en:"Camera on. It runs only in your browser, nothing is uploaded. Move around and watch the portrait in About follow you.",ar:"الكاميرا اشتغلت. بتشتغل جوه متصفحك بس ومفيش حاجة بتترفع. اتحرك وشوف الصورة في About بتتابعك."})}}
/* ===== Mood board ===== */
var poolP=null;function rgb(h){h=h.replace("#","");return[parseInt(h.slice(0,2),16),parseInt(h.slice(2,4),16),parseInt(h.slice(4,6),16)]}
function loadOne(b,ex,i){return new Promise(function(res){var im=new Image();im.onload=function(){var r={u:im.src,n:b,avg:null};try{var cv=el("canvas");cv.width=cv.height=8;var x=cv.getContext("2d");x.drawImage(im,0,0,8,8);var d=x.getImageData(0,0,8,8).data,a=[0,0,0];for(var k=0;k<d.length;k+=4){a[0]+=d[k];a[1]+=d[k+1];a[2]+=d[k+2]}r.avg=a.map(function(v){return v/64})}catch(e){}res(r)};im.onerror=function(){res(i+1<ex.length?loadOne(b,ex,i+1):null)};im.src="images/"+b+"."+ex[i]})}
function getPool(){if(poolP)return poolP;var nm=[],i;for(i=1;i<=12;i++)nm.push("l"+i);for(i=1;i<=6;i++){nm.push("project"+i);nm.push("pm"+i)}var out=[];
 poolP=(function nx(i){if(i>=nm.length||out.length>=14)return Promise.resolve(out);return Promise.all(nm.slice(i,i+6).map(function(n){return loadOne(n,["jpg","webp","png"],0)})).then(function(r){r.forEach(function(x){if(x)out.push(x)});return nx(i+6)})})(0);return poolP}
A.onbrief=function(mb,g){for(var i=0;i<4;i++)mb.appendChild(el("i"));
 getPool().then(function(p){mb.textContent="";if(!p.length){mb.remove();return}var cols=g.c.map(rgb);
  var s=p.map(function(x){return[x.avg?Math.min.apply(0,cols.map(function(c){return Math.hypot(c[0]-x.avg[0],c[1]-x.avg[1],c[2]-x.avg[2])})):Math.random()*300,x]}).sort(function(a,b){return a[0]-b[0]}).slice(0,4);
  s.forEach(function(e){var im=el("img");im.src=e[1].u;im.alt="";mb.appendChild(im)});
  var cap=el("small",0,T({en:"Mood board from Tiamo's work",ar:"مود بورد من أعمال تيامو"}));cap.style.cssText="color:#a7a1b7;font-size:11px";mb.parentNode.insertBefore(cap,mb);
  var a=$(".tma-btn",mb.parentNode);if(a)a.href+=encodeURIComponent("\n• "+T({en:"Reference images",ar:"صور مرجعية"})+": "+s.map(function(e){return e[1].n}).join(", "))})};
/* ===== Voice ===== */
var SR=window.SpeechRecognition||window.webkitSpeechRecognition,spoke=false;
function speak(txt){try{var u=new SpeechSynthesisUtterance(txt);u.lang=A.lang()==="ar"?"ar-EG":"en-US";speechSynthesis.cancel();speechSynthesis.speak(u)}catch(e){}}
function mic(){if(!SR||!A.form)return;var b=el("button","tma-mic","🎙");b.type="button";b.setAttribute("aria-label","Voice");A.form.insertBefore(b,A.form.firstChild);var rec=null;
 b.onclick=function(){if(rec){rec.stop();return}rec=new SR();rec.lang=A.lang()==="ar"?"ar-EG":"en-US";rec.interimResults=false;b.classList.add("rec");
  rec.onresult=function(e){var t=e.results[0][0].transcript;spoke=true;A.send(t)};rec.onend=function(){rec=null;b.classList.remove("rec")};rec.onerror=function(){rec=null;b.classList.remove("rec")};try{rec.start()}catch(e){rec=null;b.classList.remove("rec")}}}
A.onsay=function(t){if(spoke){spoke=false;speak(t)}};
/* ===== wire ===== */
A.use(function(t){
 if(/stop camera|اقفل الكاميرا|وقف الكاميرا|إيقاف الكاميرا/i.test(t)){stopCam();return {t:T({en:"Camera off.",ar:"قفلت الكاميرا."})}}
 var r=roast(t);if(r)return r;
 if(/camera|كاميرا|بصلي|look at me/i.test(t))return startCam();
 if(/\b(reset|off)\b|رجع|رجّع|عادي|الغ|ألغ/i.test(t)){fx=[];setFx();return null}
 return psEdit(t)});
if(A.form)mic();
})();
