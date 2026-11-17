/* Journey Mode — وضع الرحلة (v2): fly-through navigation with light lines */
(()=>{
const $=(s,r=document)=>r.querySelector(s),$$=(s,r=document)=>[...r.querySelectorAll(s)];
const ls=()=>{try{return localStorage.getItem('tiamo-lang')}catch(e){return null}};
const ar=()=>document.documentElement.lang==='ar'||document.documentElement.dir==='rtl'||ls()==='ar';
const txt=e=>e?e.textContent.replace(/\s+/g,' ').replace(/[↗↖]/g,'').trim():'';
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const L={home:['Home','الرئيسية'],about:['About','عنّي'],services:['Services','الخدمات'],work:['Work','الأعمال'],contact:['Contact','تواصل'],exit:['Exit','خروج'],enter:['Start the journey','ابدأ الرحلة'],view:['View in site','شاهد في الموقع'],hint:['SCROLL · SWIPE · ARROWS','مرّر · اسحب · الأسهم'],title:['Journey Mode','وضع الرحلة'],skills:['SKILLS','المهارات'],name:['TIAMO MOHAMAD','تيامو محمد']};
const t=k=>L[k][ar()?1:0];
const SC=['home','about','services','work','contact'],MODE={home:'burst',about:'drift',services:'drift',work:'sweep',contact:'funnel'};
const btn=$('#journeyBtn');if(!btn)return;
let root,cv,cx,W,H,P=[],mode='burst',raf=0,isOpen=false,steps=[],si=0,D,last=0,scene='home',cloud={pts:[],ar:1,a:0},cloudReq=false;
const reduce=matchMedia('(prefers-reduced-motion:reduce)').matches,R=Math.random;

const ICON={
 whatsapp:'<path d="M3 21l1.6-4.6A8.5 8.5 0 1 1 8 19.6z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/><path d="M9 8.6c0 3.4 2.9 6.4 6.4 6.4l1.1-1.5-2-1-.9.8c-1-.4-1.9-1.3-2.3-2.3l.8-.9-1-2z" fill="currentColor"/>',
 facebook:'<path d="M14 8V6.5c0-.7.3-1 1-1h2V2h-3c-2.8 0-4 1.7-4 4v2H7.5v3.5H10V22h4V11.5h2.6L17 8z" fill="currentColor"/>',
 instagram:'<rect x="3" y="3" width="18" height="18" rx="5" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="12" cy="12" r="4" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="17.5" cy="6.5" r="1.2" fill="currentColor"/>',
 tiktok:'<path d="M16.5 3c.3 2.3 1.7 3.8 4 4v3.2c-1.5 0-2.9-.5-4-1.2v6.3a5.8 5.8 0 1 1-5-5.7v3.3a2.6 2.6 0 1 0 1.8 2.4V3z" fill="currentColor"/>',
 ps:'<text x="12" y="16.5" text-anchor="middle" font-size="12" font-weight="800" fill="currentColor" font-family="Inter,sans-serif">Ps</text>',
 star:'<path d="M12 3l2.6 5.6 6 .8-4.4 4.2 1.1 6L12 16.7 6.7 19.6l1.1-6L3.4 9.4l6-.8z" fill="currentColor"/>',
 link:'<path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>'};
const iconOf=(h,l)=>/photoshop/i.test(l||'')?'ps':/wa\.me|whatsapp/.test(h)?'whatsapp':/facebook/.test(h)?'facebook':/instagram/.test(h)?'instagram':/tiktok/.test(h)?'tiktok':/maps|google/.test(h)?'star':'link';

function gather(){
  const role=txt($('.role')).split('•').map(s=>s.trim()).filter(Boolean);
  const about=[
    {k:txt($('#about .section-kicker')),h:txt($('#about .section-title h2')),p:txt($('#about .section-title p'))},
    {k:t('skills'),h:txt($('.hero h1')),p:'',tags:role},
    {k:txt($('.cert-kicker')),h:txt($('.cert-title')),p:txt($('.cert-text'))}
  ].filter(c=>c.h||c.p);
  const services=$$('#services .service-grid article').map(a=>({k:txt($('small',a)),h:txt($('h3',a)),p:txt($('p',a))})).filter(c=>c.h);
  const work=[],seen=new Set();
  $$('#work .gallery-card').forEach(card=>{const cat=txt($('.gallery-head h3',card));let n=0;
    $$('.slides img',card).forEach(im=>{const s=im.currentSrc||im.src||im.dataset.src;if(s&&!seen.has(s)&&n<3&&work.length<15){seen.add(s);n++;work.push({src:s,cat})}})});
  const wa=$('.mini-wa');
  const links=[...(wa?[{href:wa.href,label:'WhatsApp'}]:[]),...$$('.social-links a').slice(0,5).map(a=>({href:a.href,label:txt(a)}))];
  return{about,services,work,links,contact:{h:txt($('#contact h2')),p:txt($('#contact p'))},role:role.join('  •  ')};
}
const cardHTML=c=>`<article class="jm-card"><i class="jm-k">${esc(c.k||'')}</i><h3>${esc(c.h||'')}</h3>${c.p?`<p>${esc(c.p)}</p>`:''}${c.tags?`<ul class="jm-tags">${c.tags.map(x=>`<li>${esc(x)}</li>`).join('')}</ul>`:''}</article>`;
const GH=[[6,12,150],[78,8,170],[14,64,130],[82,62,160],[40,4,110],[46,78,120],[66,30,100],[24,34,100]];

function build(){
  D=gather();steps=[];
  const cnt={home:1,about:D.about.length,services:D.services.length,work:Math.max(D.work.length,1),contact:1};
  SC.forEach(s=>{for(let i=0;i<cnt[s];i++)steps.push([s,i])});
  root.dir=ar()?'rtl':'ltr';
  $('.jm-nav',root).innerHTML=SC.map(s=>`<button type="button" data-s="${s}">${t(s)}</button>`).join('');
  $('.jm-x span',root).textContent=t('exit');$('.jm-hint',root).textContent=t('hint');$('.jm-title',root).textContent=t('title').toUpperCase();
  $('.jm-stage',root).innerHTML=
   `<section class="jm-sc" data-s="home"><div class="jm-hero"><h1 class="jm-word">${t('name')}</h1><p class="jm-role">${esc(D.role)}</p><button class="jm-cta jm-tilt" type="button" data-go="about">${t('enter')}</button></div></section>`+
   ['about','services'].map(s=>`<section class="jm-sc" data-s="${s}"><div class="jm-cards">${D[s].map(c=>cardHTML(c)).join('')}</div></section>`).join('')+
   `<section class="jm-sc" data-s="work"><div class="jm-portal"><div class="jm-vl"></div><div class="jm-ring"></div><div class="jm-ghosts">${D.work.slice(0,GH.length).map((w,k)=>`<img src="${esc(w.src)}" alt="" style="left:${GH[k][0]}%;top:${GH[k][1]}%;--w:${GH[k][2]}px">`).join('')}</div><div class="jm-mid"><div class="jm-frame"><img alt=""></div><div class="jm-cap"><small></small><a class="jm-link" href="#work">${t('view')}</a></div></div></div></section>`+
   `<section class="jm-sc" data-s="contact"><div class="jm-beam"></div><div class="jm-contact"><h3>${esc(D.contact.h)}</h3><p>${esc(D.contact.p)}</p><div class="jm-soc">${D.links.map(l=>`<a class="jm-ic" href="${esc(l.href)}" target="_blank" rel="noopener" title="${esc(l.label)}" aria-label="${esc(l.label)}"><svg viewBox="0 0 24 24" aria-hidden="true">${ICON[iconOf(l.href,l.label)]}</svg></a>`).join('')}</div></div></section>`;
}

function update(first){
  const [s,i]=steps[si];scene=s;const ci=SC.indexOf(s);
  $$('.jm-sc',root).forEach(e=>{const k=SC.indexOf(e.dataset.s);e.classList.toggle('on',k===ci);e.classList.toggle('past',k<ci)});
  $$('.jm-nav button',root).forEach(b=>b.classList.toggle('on',b.dataset.s===s));
  if(s==='about'||s==='services')$$('.jm-card',$(`.jm-sc[data-s=${s}]`,root)).forEach((c,k)=>{c.style.setProperty('--p',k-i);c.style.setProperty('--a',Math.abs(k-i));c.classList.toggle('s',k!==i)});
  if(s==='work'&&D.work.length){const im=$('.jm-frame img',root),w=D.work[i];
    if(im.getAttribute('src')!==w.src){im.src=w.src;im.classList.remove('sw');void im.offsetWidth;im.classList.add('sw')}
    $('.jm-cap small',root).textContent=`${w.cat} · ${String(i+1).padStart(2,'0')} / ${String(D.work.length).padStart(2,'0')}`;
    $$('.jm-ghosts img',root).forEach((g,k)=>{g.style.transform=`translate(${Math.sin(i*1.7+k)*26}px,${Math.cos(i*1.3+k*2)*20}px)`});
    const nx=D.work[i+1];if(nx)new Image().src=nx.src}
  $('.jm-bar i',root).style.width=((si+1)/steps.length*100)+'%';
  setMode(reduce?'drift':MODE[s]);
  if(s==='about')loadCloud();
  if(!first){const sw=$('.jm-sweep',root);sw.classList.remove('go');void sw.offsetWidth;sw.classList.add('go')}
}
function go(n){n=Math.max(0,Math.min(steps.length-1,n));if(n===si)return;si=n;update()}
function goScene(s){const k=steps.findIndex(x=>x[0]===s);if(k>=0)go(k)}

/* portrait → glowing point cloud (like the head in the reference video) */
function loadCloud(){if(cloudReq)return;cloudReq=true;const im=new Image();
  im.onload=()=>{try{const w=150,h=Math.max(1,Math.round(w*im.naturalHeight/im.naturalWidth)),c=document.createElement('canvas');c.width=w;c.height=h;
    const g=c.getContext('2d');g.drawImage(im,0,0,w,h);const d=g.getImageData(0,0,w,h).data,A=[],B=[];
    for(let y=0;y<h;y++)for(let x=0;x<w;x++){const k=(y*w+x)*4,a=d[k+3]/255,l=(d[k]*.3+d[k+1]*.59+d[k+2]*.11)/255;
      if(a>.4&&R()<(.12+l*.88)*.6){const p={x:x/w,y:y/h,l,r:R()*6.28};(l>.5?A:B).push(p)}}
    cloud={A,B,pts:A.concat(B),ar:w/h,a:cloud.a}}catch(e){}};
  im.onerror=()=>{if(!im.dataset.f){im.dataset.f=1;im.src='images/tiamo.jpg'}};im.src='images/tiamo-about.png'}
function drawCloud(now){
  cloud.a+=((scene==='about'&&cloud.pts.length?1:0)-cloud.a)*.09;if(cloud.a<.02)return;
  const ch=H*.78,cw=ch*cloud.ar,ox=W/2-cw/2,oy=H*.14;
  [['#7fe0ff',cloud.A],['#9a6bff',cloud.B]].forEach(([col,arr])=>{cx.fillStyle=col;cx.globalAlpha=cloud.a*.75;
    for(const p of arr)cx.fillRect(ox+p.x*cw+Math.sin(now/900+p.r)*1.2,oy+p.y*ch+Math.cos(now/1100+p.r)*1.2,1.7,1.7)})}

/* light-line canvas */
const COL=['#8b35ff','#16d8ff','#c9a8ff'];
function size(){const d=Math.min(devicePixelRatio||1,2);W=innerWidth;H=innerHeight;cv.width=W*d;cv.height=H*d;cx.setTransform(d,0,0,d,0,0);cx.fillStyle='#05040a';cx.fillRect(0,0,W,H)}
function reset(p,i){const m=mode;p.c=COL[i%3];p.o=.35+R()*.6;p.w=.6+R()*1.1;
  if(m==='burst'){p.x=W/2+(R()-.5)*30;p.y=H/2+(R()-.5)*30;p.a=R()*6.283;p.v=.3+R()*.8}
  else if(m==='funnel'){p.x=R()*W;p.y=-R()*H*.3;p.v=1+R()*2.2;p.s=.5+R()}
  else if(m==='sweep'){p.x=-R()*W*.2;p.y=R()*H;p.v=.8+R()*2.4}
  else{p.x=R()*W;p.y=R()*H;p.dx=(R()-.5)*.35;p.dy=-.15-R()*.4}}
function setMode(m){if(m===mode&&P.length)return;mode=m;P.forEach(reset);if(m==='funnel')P.forEach(p=>{p.y=R()*H*.8})}
function frame(now){if(!isOpen)return;raf=requestAnimationFrame(frame);
  cx.globalAlpha=1;cx.fillStyle='rgba(5,4,10,.2)';cx.fillRect(0,0,W,H);
  drawCloud(now);
  for(let k=0;k<P.length;k++){const p=P[k],ox=p.x,oy=p.y;
    if(mode==='burst'){p.v*=1.03;p.x+=Math.cos(p.a)*p.v;p.y+=Math.sin(p.a)*p.v}
    else if(mode==='funnel'){p.x+=(W/2-p.x)*.02*p.s;p.y+=p.v*1.6}
    else if(mode==='sweep'){p.x+=p.v*5}
    else{p.x+=p.dx;p.y+=p.dy}
    cx.globalAlpha=p.o;cx.strokeStyle=p.c;cx.lineWidth=p.w;cx.beginPath();cx.moveTo(ox,oy);cx.lineTo(p.x,p.y);cx.stroke();
    if(p.x<-60||p.x>W+60||p.y<-60||p.y>H+60||(mode==='funnel'&&p.y>H*.82))reset(p,k)}}

function open(){
  if(isOpen)return;
  try{build();size();
    P=Array.from({length:innerWidth<700?70:150},()=>({}));P.forEach(reset);
    let s='home';['about','services','work','contact'].forEach(id=>{const e=document.getElementById(id);if(e&&e.getBoundingClientRect().top<innerHeight*.5)s=id});
    si=Math.max(0,steps.findIndex(x=>x[0]===s));
    isOpen=true;document.documentElement.classList.add('jm-open');root.classList.add('on');root.setAttribute('aria-hidden','false');
    update(true);raf=requestAnimationFrame(frame);$('.jm-x',root).focus({preventScroll:true});
  }catch(e){isOpen=false;document.documentElement.classList.remove('jm-open');root.classList.remove('on');console.error('Journey Mode',e)}
}
function close(toId){
  if(!isOpen)return;isOpen=false;cancelAnimationFrame(raf);
  root.classList.remove('on');root.setAttribute('aria-hidden','true');document.documentElement.classList.remove('jm-open');
  if(toId){const e=document.getElementById(toId);if(e)setTimeout(()=>e.scrollIntoView({behavior:'smooth'}),60)}else btn.focus({preventScroll:true});
}

root=document.createElement('div');root.id='journey';root.setAttribute('role','dialog');root.setAttribute('aria-modal','true');root.setAttribute('aria-hidden','true');root.setAttribute('data-lenis-prevent','');
root.innerHTML='<canvas class="jm-cv"></canvas><div class="jm-vig"></div><div class="jm-sweep"></div><div class="jm-stage"></div><div class="jm-top"><nav class="jm-nav jm-ch"></nav><button class="jm-x jm-ch" type="button"><b aria-hidden="true">✕</b><span></span></button></div><div class="jm-hud"><span class="jm-title"></span><div class="jm-bar"><i></i></div><span class="jm-hint"></span></div>';
document.body.appendChild(root);cv=$('.jm-cv',root);cx=cv.getContext('2d');

/* every handler runs in the CAPTURE phase on document, so the site's own scripts (smooth-scroll, custom cursor, intro) can't swallow the events */
const inside=e=>isOpen&&root.contains(e.target);
btn.addEventListener('click',e=>{e.stopPropagation();open()});
document.addEventListener('click',e=>{if(!inside(e))return;
  const n=e.target.closest('.jm-nav button');if(n){e.stopPropagation();return goScene(n.dataset.s)}
  if(e.target.closest('.jm-x')){e.stopPropagation();return close()}
  const g=e.target.closest('[data-go]');if(g){e.stopPropagation();return goScene(g.dataset.go)}
  if(e.target.closest('.jm-link')){e.preventDefault();e.stopPropagation();return close('work')}
  const c=e.target.closest('.jm-card.s');if(c){e.stopPropagation();go(si+Math.round(+c.style.getPropertyValue('--p')))}
},true);
document.addEventListener('wheel',e=>{if(!isOpen)return;e.preventDefault();e.stopPropagation();
  if(Math.abs(e.deltaY)<15&&Math.abs(e.deltaX)<15)return;const n=Date.now();if(n-last<650)return;last=n;go(si+((e.deltaY||e.deltaX)>0?1:-1))},{passive:false,capture:true});
document.addEventListener('keydown',e=>{if(!isOpen)return;let h=1;
  if(e.key==='Escape')close();
  else if(/^(ArrowRight|ArrowDown|PageDown)$/.test(e.key))go(si+1);
  else if(/^(ArrowLeft|ArrowUp|PageUp)$/.test(e.key))go(si-1);
  else if(e.key==='Home')go(0);else if(e.key==='End')go(steps.length-1);else h=0;
  if(h){e.preventDefault();e.stopPropagation()}},true);
let tx=0,ty=0;
document.addEventListener('touchstart',e=>{if(inside(e)){tx=e.touches[0].clientX;ty=e.touches[0].clientY}},{passive:true,capture:true});
document.addEventListener('touchmove',e=>{if(inside(e))e.stopPropagation()},{passive:true,capture:true});
document.addEventListener('touchend',e=>{if(!inside(e))return;const dx=e.changedTouches[0].clientX-tx,dy=e.changedTouches[0].clientY-ty;
  if(Math.max(Math.abs(dx),Math.abs(dy))>50)go(si+((Math.abs(dx)>Math.abs(dy)?-dx:-dy)>0?1:-1))},{passive:true,capture:true});
addEventListener('resize',()=>{if(isOpen)size()});
const relang=()=>{btn.setAttribute('aria-label',t('title'));btn.title=t('title');if(isOpen){const k=si;build();si=Math.min(k,steps.length-1);update(true)}};
new MutationObserver(relang).observe(document.documentElement,{attributes:true,attributeFilter:['lang','dir']});
$('#langBtn')?.addEventListener('click',()=>setTimeout(relang,120));
relang();
})();
