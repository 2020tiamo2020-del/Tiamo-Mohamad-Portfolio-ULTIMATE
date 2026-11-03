/* T the cat — interactive AI assistant (AR/EN). Talks to a Cloudflare Worker; no keys in the browser. */
(function(){
  "use strict";
  var me=document.currentScript||document.querySelector('script[src*="tm-cat.js"]');
  var API=(me&&me.getAttribute("data-api"))||window.TM_CAT_API||"";
  var WA="https://wa.me/201278536645";
  var S={
    en:{name:"T · Assistant",sub:"Ask me about Tiamo's work",tip:"Ask T",ph:"Type your question…",hello:"Hi, I'm T 🐱 Ask me about Tiamo's services, work, or how to start a project.",
      chips:["What services do you offer?","How do I start a project?","Show me the work"],err:"I couldn't reach my brain right now. You can message Tiamo directly on WhatsApp.",wa:"Prefer a human? ",wal:"WhatsApp Tiamo",close:"Close",send:"Send"},
    ar:{name:"تي · المساعد",sub:"اسألني عن أعمال تيامو",tip:"اسأل تي",ph:"اكتب سؤالك…",hello:"أهلاً، أنا تي 🐱 اسألني عن خدمات تيامو وأعماله أو إزاي تبدأ مشروع.",
      chips:["إيه الخدمات المتاحة؟","أبدأ مشروع إزاي؟","وريني الأعمال"],err:"مقدرتش أوصل للمساعد دلوقتي. تقدر تكلم تيامو مباشرة على واتساب.",wa:"عايز تكلم شخص؟ ",wal:"واتساب تيامو",close:"إغلاق",send:"إرسال"}
  };
  function lang(){var l=document.documentElement.lang;if(l==="ar"||l==="en")return l;try{var q=localStorage.getItem("tiamo-lang");if(q==="ar"||q==="en")return q}catch(e){}return document.documentElement.dir==="rtl"?"ar":"en"}
  function el(t,c,h){var e=document.createElement(t);if(c)e.className=c;if(h!=null)e.innerHTML=h;return e}

  var btn=el("button","tmc",'<span class="tmc-body"><img src="images/tm-cat.webp" alt="" width="160" height="160" decoding="async"><i class="tmc-eye l"></i><i class="tmc-eye r"></i></span><i class="tmc-dot"></i><span class="tmc-tip"></span>');
  btn.type="button";btn.id="tmCat";
  var panel=el("div","tmc-panel");panel.id="tmCatPanel";panel.setAttribute("role","dialog");panel.setAttribute("aria-hidden","true");
  panel.innerHTML='<div class="tmc-h"><img src="images/tm-cat.webp" alt=""><div><b></b><small></small></div><button type="button" class="tmc-x">×</button></div><div class="tmc-log" aria-live="polite"></div><div class="tmc-chips"></div><div class="tmc-wa"></div><form class="tmc-f"><input type="text" maxlength="500" autocomplete="off"><button type="submit">➤</button></form>';
  document.body.appendChild(btn);document.body.appendChild(panel);
  var $=function(s){return panel.querySelector(s)};
  var log=$(".tmc-log"),chips=$(".tmc-chips"),form=$(".tmc-f"),inp=form.querySelector("input"),sendB=form.querySelector("button"),eyes=btn.querySelectorAll(".tmc-eye");
  var hist=[],busy=false,cur="";

  function paint(){
    var L=lang(),t=S[L];cur=L;
    panel.dir=L==="ar"?"rtl":"ltr";
    $(".tmc-h b").textContent=t.name;$(".tmc-h small").textContent=t.sub;$(".tmc-x").setAttribute("aria-label",t.close);
    btn.setAttribute("aria-label",t.tip);btn.querySelector(".tmc-tip").textContent=t.tip;
    inp.placeholder=t.ph;sendB.setAttribute("aria-label",t.send);
    $(".tmc-wa").innerHTML=t.wa+'<a href="'+WA+'" target="_blank" rel="noopener">'+t.wal+'</a>';
    chips.innerHTML="";t.chips.forEach(function(c){var b=el("button");b.type="button";b.textContent=c;b.onclick=function(){ask(c)};chips.appendChild(b)});
    var first=log.querySelector(".tmc-m.hello");if(first)first.textContent=t.hello;
  }
  function add(txt,cls){var m=el("div","tmc-m "+cls);m.textContent=txt;log.appendChild(m);log.scrollTop=log.scrollHeight;return m}
  function open(v){
    btn.classList.toggle("open",v);panel.classList.toggle("open",v);panel.setAttribute("aria-hidden",v?"false":"true");
    if(v){btn.classList.add("seen");if(!log.children.length){var m=add(S[cur].hello,"b");m.classList.add("hello")}setTimeout(function(){inp.focus({preventScroll:true})},350)}
  }
  btn.addEventListener("click",function(){open(!panel.classList.contains("open"))});
  $(".tmc-x").addEventListener("click",function(){open(false)});
  addEventListener("keydown",function(e){if(e.key==="Escape"&&panel.classList.contains("open"))open(false)});
  form.addEventListener("submit",function(e){e.preventDefault();var v=inp.value.trim();if(v)ask(v)});

  function ask(q){
    if(busy)return;busy=true;sendB.disabled=true;inp.value="";chips.style.display="none";
    add(q,"u");hist.push({role:"user",content:q});hist=hist.slice(-8);
    var wait=el("div","tmc-m b",'<span class="tmc-typing"><i></i><i></i><i></i></span>');log.appendChild(wait);log.scrollTop=log.scrollHeight;
    btn.classList.add("happy");
    var done=function(txt,ok){wait.remove();var m=add(txt,"b");if(ok)hist.push({role:"assistant",content:txt});busy=false;sendB.disabled=false;btn.classList.remove("happy");inp.focus({preventScroll:true})};
    if(!API){done(S[cur].err,false);return}
    var ctl=new AbortController(),to=setTimeout(function(){ctl.abort()},25000);
    fetch(API.replace(/\/$/,"")+"/chat",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({messages:hist,lang:cur}),signal:ctl.signal})
      .then(function(r){if(!r.ok)throw new Error(r.status);return r.json()})
      .then(function(j){clearTimeout(to);if(!j||!j.reply)throw new Error("empty");done(String(j.reply),true)})
      .catch(function(){clearTimeout(to);done(S[cur].err,false)});
  }

  /* alignment: sit centred right above the scroll orb, never covering it */
  function place(){
    var o=document.getElementById("scrollOrbit");if(!o)return;
    var r=o.getBoundingClientRect();if(!r.width||getComputedStyle(o).display==="none")return;
    var s=btn.offsetWidth||54,vw=document.documentElement.clientWidth;
    btn.style.right=Math.max(8,vw-(r.left+r.width/2)-s/2)+"px";
    btn.style.bottom=(innerHeight-r.top+12)+"px";
    panel.style.bottom=(innerHeight-r.top+12+s+10)+"px";
  }
  /* eyes follow pointer / touch */
  var ex=0,ey=0,raf=0;
  function look(x,y){
    var b=btn.getBoundingClientRect();var dx=x-(b.left+b.width/2),dy=y-(b.top+b.height/2),d=Math.hypot(dx,dy)||1,k=Math.min(1,d/260);
    ex=dx/d*k*2.4;ey=dy/d*k*1.6;
    if(!raf)raf=requestAnimationFrame(function(){raf=0;for(var i=0;i<eyes.length;i++)eyes[i].style.transform="translate("+ex.toFixed(2)+"px,"+ey.toFixed(2)+"px)"})
  }
  addEventListener("pointermove",function(e){look(e.clientX,e.clientY)},{passive:true});
  addEventListener("touchstart",function(e){var t=e.touches[0];if(t)look(t.clientX,t.clientY)},{passive:true});
  (function blink(){setTimeout(function(){btn.classList.add("blink");setTimeout(function(){btn.classList.remove("blink");blink()},130)},2400+Math.random()*3200)})();

  /* stay out of the way of intro, cinema scene and image viewer */
  function gate(){
    var b=document.body,g=document.getElementById("enterGate");
    var gv=g&&g.offsetParent!==null&&getComputedStyle(g).visibility!=="hidden"&&getComputedStyle(g).opacity!=="0";
    var hide=gv||b.classList.contains("tm-zoom-lock")||b.classList.contains("tm-pre-h")||b.classList.contains("lightbox-open")||b.classList.contains("cn-on")||b.classList.contains("cn-gating");
    btn.classList.toggle("off",!!hide);
    if(hide&&panel.classList.contains("open"))open(false);
    panel.style.display=hide?"none":"";
    if(!hide){place()}
    if(!hide&&!btn.classList.contains("on")){btn.classList.add("on");setTimeout(function(){if(!btn.classList.contains("seen")&&!panel.classList.contains("open")){btn.classList.add("hint");setTimeout(function(){btn.classList.remove("hint")},3500)}},2500)}
  }
  new MutationObserver(gate).observe(document.body,{attributes:true,attributeFilter:["class"]});
  new MutationObserver(function(){if(lang()!==cur)paint()}).observe(document.documentElement,{attributes:true,attributeFilter:["lang","dir"]});
  addEventListener("storage",function(){if(lang()!==cur)paint()});
  addEventListener("resize",place,{passive:true});addEventListener("load",function(){place();gate()});
  setInterval(function(){gate();if(lang()!==cur)paint()},1200);
  paint();gate();
})();
