/* Journey Mode — وضع الرحلة: alternative light-line navigation overlay */
(()=>{
const $=(s,r=document)=>r.querySelector(s),$$=(s,r=document)=>[...r.querySelectorAll(s)];
const ls=()=>{try{return localStorage.getItem('tiamo-lang')}catch(e){return null}};
const ar=()=>document.documentElement.lang==='ar'||document.documentElement.dir==='rtl'||ls()==='ar';
const txt=e=>e?e.textContent.replace(/\s+/g,' ').replace(/[↗↖]/g,'').trim():'';
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const L={home:['Home','الرئيسية'],about:['About','عنّي'],services:['Services','الخدمات'],work:['Work','الأعمال'],contact:['Contact','تواصل'],exit:['Exit','خروج'],enter:['Start the journey →','ابدأ الرحلة ←'],view:['View in site ↗','شاهد في الموقع ↖'],hint:['SCROLL · SWIPE · ARROWS','مرّر · اسحب · الأسهم'],title:['Journey Mode','وضع الرحلة'],skills:['SKILLS','المهارات'],name:['TIAMO MOHAMAD','تيامو محمد']};
const t=k=>L[k][ar()?1:0];
const SC=['home','about','services','work','contact'],MODE={home:'burst',about:'drift',services:'drift',work:'sweep',contact:'funnel'};
const btn=$('#journeyBtn');if(!btn)return;
let root,cv,cx,W,H,P=[],mode='burst',raf=0,isOpen=false,steps=[],si=0,D,last=0,reduce=matchMedia('(prefers-reduced-motion:reduce)').matches;

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
  const links=[...(wa?[{href:wa.href,label:'WhatsApp'}]:[]),...$$('.social-links a').slice(0,4).map(a=>({href:a.href,label:txt(a)}))];
  return{about,services,work,links,contact:{h:txt($('#contact h2')),p:txt($('#contact p'))},role:role.join('  •  ')};
}
const cardHTML=c=>`<article class="jm-card"><i class="jm-k">${esc(c.k||'')}</i><h3>${esc(c.h||'')}</h3>${c.p?`<p>${esc(c.p)}</p>`:''}${c.tags?`<ul class="jm-tags">${c.tags.map(x=>`<li>${esc(x)}</li>`).join('')}</ul>`:''}</article>`;

function build(){
  D=gather();steps=[];
  const cnt={home:1,about:D.about.length,services:D.services.length,work:Math.max(D.work.length,1),contact:1};
  SC.forEach(s=>{for(let i=0;i<cnt[s];i++)steps.push([s,i])});
  root.dir=ar()?'rtl':'ltr';
  $('.jm-nav',root).innerHTML=SC.map(s=>`<button type="button" data-s="${s}">${t(s)}</button>`).join('');
  $('.jm-x span',root).textContent=t('exit');$('.jm-hint',root).textContent=t('hint');
  $('.jm-stage',root).innerHTML=
   `<section class="jm-sc" data-s="home"><div class="jm-hero"><img src="images/main-logo.webp" alt="" onerror="this.remove()"><h1 class="jm-ghost">${t('name')}</h1><p class="jm-role">${esc(D.role)}</p><button class="jm-cta" type="button" data-go="about">${t('enter')}</button></div></section>`+
   ['about','services'].map(s=>`<section class="jm-sc" data-s="${s}"><div class="jm-cards">${D[s].map(cardHTML).join('')}</div></section>`).join('')+
   `<section class="jm-sc" data-s="work"><div class="jm-portal"><div class="jm-frame"><img alt=""></div><div class="jm-cap"><small></small><a class="jm-link" href="#work">${t('view')}</a></div></div></section>`+
   `<section class="jm-sc" data-s="contact"><div class="jm-contact"><h3>${esc(D.contact.h)}</h3><p>${esc(D.contact.p)}</p><div class="jm-soc">${D.links.map(l=>`<a class="jm-cta" href="${esc(l.href)}" target="_blank" rel="noopener">${esc(l.label)}</a>`).join('')}</div></div></section>`;
  btn.setAttribute('aria-label',t('title'));btn.title=t('title');
  $('.jm-title',root).textContent=t('title').toUpperCase();
}

function update(first){
  const [s,i]=steps[si];
  $$('.jm-sc',root).forEach(e=>e.classList.toggle('on',e.dataset.s===s));
  $$('.jm-nav button',root).forEach(b=>b.classList.toggle('on',b.dataset.s===s));
  if(s==='about'||s==='services')$$('.jm-card',$(`.jm-sc[data-s=${s}]`,root)).forEach((c,k)=>{c.style.setProperty('--p',k-i);c.style.setProperty('--a',Math.abs(k-i))});
  if(s==='work'&&D.work.length){const im=$('.jm-frame img',root),w=D.work[i];if(im.getAttribute('src')!==w.src){im.src=w.src;im.classList.remove('sw');void im.offsetWidth;im.classList.add('sw')}
    $('.jm-cap small',root).textContent=`${w.cat} · ${String(i+1).padStart(2,'0')} / ${String(D.work.length).padStart(2,'0')}`;
    const nx=D.work[i+1];if(nx)new Image().src=nx.src}
  $('.jm-bar i',root).style.width=((si+1)/steps.length*100)+'%';
  setMode(reduce?'drift':MODE[s]);
  if(!first){const sw=$('.jm-sweep',root);sw.classList.remove('go');void sw.offsetWidth;sw.classList.add('go')}
}
function go(n){n=Math.max(0,Math.min(steps.length-1,n));if(n===si)return;si=n;update()}
function goScene(s){const k=steps.findIndex(x=>x[0]===s);if(k>=0)go(k)}

/* light-line canvas */
const COL=['#8b35ff','#16d8ff','#c9a8ff'],R=Math.random;
function size(){const d=Math.min(devicePixelRatio||1,2);W=innerWidth;H=innerHeight;cv.width=W*d;cv.height=H*d;cx.setTransform(d,0,0,d,0,0);cx.fillStyle='#05040a';cx.fillRect(0,0,W,H)}
function reset(p,i){const m=mode;p.c=COL[i%3];p.o=.35+R()*.6;p.w=.6+R()*1.1;
  if(m==='burst'){p.x=W/2+(R()-.5)*30;p.y=H/2+(R()-.5)*30;p.a=R()*6.283;p.v=.3+R()*.8}
  else if(m==='funnel'){p.x=R()*W;p.y=-R()*H*.3;p.v=1+R()*2.2;p.s=.5+R()}
  else if(m==='sweep'){p.x=-R()*W*.2;p.y=R()*H;p.v=.8+R()*2.4}
  else{p.x=R()*W;p.y=R()*H;p.dx=(R()-.5)*.35;p.dy=-.15-R()*.4}}
function setMode(m){if(m===mode&&P.length)return;mode=m;P.forEach(reset)}
function frame(){if(!isOpen)return;raf=requestAnimationFrame(frame);
  cx.globalAlpha=1;cx.fillStyle='rgba(5,4,10,.2)';cx.fillRect(0,0,W,H);
  for(let k=0;k<P.length;k++){const p=P[k],ox=p.x,oy=p.y;
    if(mode==='burst'){p.v*=1.03;p.x+=Math.cos(p.a)*p.v;p.y+=Math.sin(p.a)*p.v}
    else if(mode==='funnel'){p.x+=(W/2-p.x)*.02*p.s;p.y+=p.v*1.6}
    else if(mode==='sweep'){p.x+=p.v*5}
    else{p.x+=p.dx;p.y+=p.dy}
    cx.globalAlpha=p.o;cx.strokeStyle=p.c;cx.lineWidth=p.w;cx.beginPath();cx.moveTo(ox,oy);cx.lineTo(p.x,p.y);cx.stroke();
    if(p.x<-60||p.x>W+60||p.y<-60||p.y>H+60||(mode==='funnel'&&p.y>H*.82))reset(p,k)}}

function open(){
  if(isOpen)return;isOpen=true;build();size();
  P=Array.from({length:innerWidth<700?70:150},()=>({}));P.forEach(reset);
  let s='home';['about','services','work','contact'].forEach(id=>{const e=document.getElementById(id);if(e&&e.getBoundingClientRect().top<innerHeight*.5)s=id});
  si=Math.max(0,steps.findIndex(x=>x[0]===s));
  document.documentElement.classList.add('jm-open');root.classList.add('on');root.setAttribute('aria-hidden','false');
  update(true);frame();$('.jm-x',root).focus();
}
function close(toId){
  if(!isOpen)return;isOpen=false;cancelAnimationFrame(raf);
  root.classList.remove('on');root.setAttribute('aria-hidden','true');document.documentElement.classList.remove('jm-open');
  if(toId){const e=document.getElementById(toId);if(e)setTimeout(()=>e.scrollIntoView({behavior:'smooth'}),60)}else btn.focus();
}

root=document.createElement('div');root.id='journey';root.setAttribute('role','dialog');root.setAttribute('aria-modal','true');root.setAttribute('aria-hidden','true');
root.innerHTML='<canvas class="jm-cv"></canvas><div class="jm-vig"></div><div class="jm-sweep"></div><div class="jm-stage"></div><div class="jm-top"><nav class="jm-nav"></nav><button class="jm-x" type="button"><b aria-hidden="true">✕</b><span></span></button></div><div class="jm-hud"><span class="jm-title"></span><div class="jm-bar"><i></i></div><span class="jm-hint"></span></div>';
document.body.appendChild(root);cv=$('.jm-cv',root);cx=cv.getContext('2d');

btn.addEventListener('click',open);
root.addEventListener('click',e=>{
  const n=e.target.closest('.jm-nav button');if(n)return goScene(n.dataset.s);
  if(e.target.closest('.jm-x'))return close();
  const g=e.target.closest('[data-go]');if(g)return goScene(g.dataset.go);
  if(e.target.closest('.jm-link')){e.preventDefault();return close('work')}
  const c=e.target.closest('.jm-card');if(c&&!e.target.closest('a')){const p=+c.style.getPropertyValue('--p');if(p)go(si+p)}
});
root.addEventListener('wheel',e=>{e.preventDefault();if(Math.abs(e.deltaY)<15&&Math.abs(e.deltaX)<15)return;const n=Date.now();if(n-last<650)return;last=n;go(si+((e.deltaY||e.deltaX)>0?1:-1))},{passive:false});
document.addEventListener('keydown',e=>{if(!isOpen)return;
  if(e.key==='Escape')close();
  else if(/^(ArrowRight|ArrowDown|PageDown)$/.test(e.key)){e.preventDefault();go(si+1)}
  else if(/^(ArrowLeft|ArrowUp|PageUp)$/.test(e.key)){e.preventDefault();go(si-1)}
  else if(e.key==='Home')go(0);else if(e.key==='End')go(steps.length-1)});
let tx=0,ty=0;
root.addEventListener('touchstart',e=>{tx=e.touches[0].clientX;ty=e.touches[0].clientY},{passive:true});
root.addEventListener('touchend',e=>{const dx=e.changedTouches[0].clientX-tx,dy=e.changedTouches[0].clientY-ty;
  if(Math.max(Math.abs(dx),Math.abs(dy))>50)go(si+((Math.abs(dx)>Math.abs(dy)?-dx:-dy)>0?1:-1))},{passive:true});
addEventListener('resize',()=>{if(isOpen)size()});
const relang=()=>{btn.setAttribute('aria-label',t('title'));btn.title=t('title');if(isOpen){const k=si;build();si=Math.min(k,steps.length-1);update(true)}};
new MutationObserver(relang).observe(document.documentElement,{attributes:true,attributeFilter:['lang','dir']});
$('#langBtn')?.addEventListener('click',()=>setTimeout(relang,120));
relang();
})();
