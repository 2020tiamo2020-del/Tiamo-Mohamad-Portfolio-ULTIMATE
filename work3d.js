/* 03 / SELECTED WORK - 3D studio walkthrough. Reads the 4 existing gallery cards (A-D) and rebuilds them as a scroll-driven camera trip:
   outside facade -> doors open -> hall with 4 chapters. Photos open in the existing lightbox, reels open on Facebook. */
(()=>{
const W=document.getElementById('work');if(!W)return;
const cards=[...W.querySelectorAll('.gallery-card')];if(cards.length<4)return;
const mk=(t,c,p)=>{const e=document.createElement(t);if(c)e.className=c;if(p)p.appendChild(e);return e};
const pad=n=>String(n).padStart(2,'0'),cl=(v,a,b)=>Math.max(a,Math.min(b,v));
const CH=[{k:'A',c:'#b794ff',kind:'pp'},{k:'B',c:'#16d8ff',kind:'pv'},{k:'C',c:'#ffb86b',kind:'lp'},{k:'D',c:'#ff5fa2',kind:'lv'}];
const S=mk('section','w3');S.id='studio';S.setAttribute('aria-label','Selected work - studio walkthrough');
S.innerHTML='<div class="w3-stage"><div class="w3-cam"><div class="w3-rig"><div class="w3-world"></div></div></div><div class="w3-fog"></div><div class="w3-hud"><div class="w3-hn"></div><div class="w3-hc"></div><nav class="w3-rail" aria-label="Work chapters"></nav><div class="w3-hint" data-en="SCROLL TO ENTER THE STUDIO" data-ar="مرّر لتدخل الاستوديو">SCROLL TO ENTER THE STUDIO</div></div></div>';
W.after(S);document.body.classList.add('w3-on');
const world=S.querySelector('.w3-world'),rig=S.querySelector('.w3-rig'),rail=S.querySelector('.w3-rail'),hn=S.querySelector('.w3-hn'),hc=S.querySelector('.w3-hc'),hint=S.querySelector('.w3-hint'),stage=S.querySelector('.w3-stage');
let items=[],chap=[],TOTAL=1,cam=0,tgt=0,mx=0,my=0,tx=0,ty=0,roll=0,doorL,doorR,dY=0,dZ=0,lastKey='';

function build(){
  world.textContent='';rail.textContent='';items=[];chap=[];
  const vw=innerWidth,vh=innerHeight,U=Math.max(.5,Math.min(vh/900,vw/1100)),narrow=vw<700,fy=300*U;
  /* outside: facade */
  const gw=640*U,gh=720*U,fz=-700,box=(c,w,h,x,y,z,ex)=>{const e=mk('div',c,world);e.style.cssText=`width:${w}px;height:${h}px;margin:${-h/2}px 0 0 ${-w/2}px;transform:translate3d(${x}px,${y}px,${z}px);${ex||''}`;return e};
  box('w3-glow',gw*1.6,gh*1.5,0,fy-gh/2,fz-60);
  box('w3-wall',3000,2600,-(gw/2+1500),fy-1300,fz);box('w3-wall',3000,2600,gw/2+1500,fy-1300,fz);
  const lin=box('w3-lintel',gw+4,2600-gh,0,fy-gh-(2600-gh)/2,fz);lin.innerHTML='<b>TIAMO&nbsp;STUDIO</b>';
  mk('div','w3-onair',lin).textContent='ON AIR';
  dY=fy-gh/2;dZ=fz+3;
  doorL=box('w3-door',gw/2,gh,0,dY,dZ,`margin-left:${-gw/2}px;transform-origin:0 50%`);
  doorR=box('w3-door',gw/2,gh,0,dY,dZ,'margin-left:0;transform-origin:100% 50%');
  /* the hall: floor + ceiling run the whole length */
  let z=-1500;
  const frames=[];
  cards.forEach((card,ci)=>{
    const c=CH[ci],h3=card.querySelector('h3'),sm=card.querySelector('small'),figs=[...card.querySelectorAll('.slides>figure')];
    chap.push({z,c,n:0,card,i0:items.length});
    const pl=mk('div','w3-plate',world);pl.style.cssText=`--c:${c.c};transform:translate3d(0,${-40*U}px,${z}px)`;
    pl.innerHTML=`<b>${c.k}</b><h3 data-en="${h3.dataset.en}" data-ar="${h3.dataset.ar}">${h3.textContent}</h3><small data-en="${sm.dataset.en}" data-ar="${sm.dataset.ar}">${sm.textContent}</small>`;
    z-=720;let side=1,n=0;
    figs.forEach(fg=>{
      const vid=fg.querySelector('video'),im=fg.querySelector('img'),btn=fg.querySelector('.media-open');
      if(!vid&&!im)return;n++;side=-side;
      let r=vid?(parseFloat(vid.dataset.ratio)||(c.kind==='pv'?.5625:1.7778)):(c.kind==='pp'?.8:1.6),w,h;
      if(c.kind==='pp'){h=440*U;w=h*r}else if(c.kind==='pv'){h=540*U;w=h*r}else if(c.kind==='lp'){w=Math.min(640*U,vw*.62);h=w/r}else{w=Math.min(680*U,vw*.66);h=w/r}
      if(w>vw*.7)w=vw*.7,h=w/r;
      const sp=c.kind==='pp'?340:430,ry=narrow?10:{pp:34,pv:14,lp:20,lv:12}[c.kind],gap=narrow?vw*.1:{pp:250*U,pv:130*U,lp:70*U,lv:60*U}[c.kind];
      const x=side*(gap+w/2),y=c.kind==='pv'?0:side*(c.kind==='pp'?0:28*U);
      const f=mk('div','w3-f',world);f.style.cssText=`--c:${c.c};width:${w}px;height:${h}px;margin:${-h/2}px 0 0 ${-w/2}px;transform:translate3d(${x}px,${y}px,${z}px) rotateY(${-side*ry}deg)`;
      const it={f,z,v:null,im:null,src:null,btn};
      if(vid){const a=mk('a','w3-in',f);a.href=fg.querySelector('a').href;a.target='_blank';a.rel='noopener noreferrer';a.setAttribute('aria-label',fg.querySelector('a').getAttribute('aria-label')||'Watch reel');
        const v=mk('video','',a);v.muted=v.loop=v.playsInline=true;v.preload='none';v.setAttribute('aria-hidden','true');it.v=v;it.src=vid.dataset.src;
        const ch=mk('span','w3-chip',a);ch.textContent='▶ REEL ↗'}
      else{const b=mk('button','w3-in',f);b.type='button';b.setAttribute('aria-label',btn?btn.getAttribute('aria-label')||'Open photo':'Open photo');
        const i=mk('img','',b);i.alt=im.alt||'';i.decoding='async';i.draggable=false;it.im=i;it.src=im.currentSrc||im.src;
        i.onload=()=>{const rr=i.naturalWidth/i.naturalHeight;if(rr&&Math.abs(rr-r)>.03){const nw=Math.min(h*rr,vw*.7);f.style.width=nw+'px';f.style.marginLeft=-nw/2+'px'}};
        i.onerror=()=>f.classList.add('x');
        b.onclick=()=>btn&&btn.click()}
      mk('i','w3-cap',f).textContent=c.k+' · '+pad(n);
      items.push(it);frames.push(f);z-=sp+(narrow?40:0);
    });
    chap[ci].n=n;z-=360;
  });
  const pl=mk('div','w3-plate',world);pl.style.cssText=`--c:#16d8ff;transform:translate3d(0,${-40*U}px,${z}px)`;
  pl.innerHTML='<h3 data-en="That’s a wrap." data-ar="انتهى العرض.">That’s a wrap.</h3><small data-en="HAVE AN IDEA? LET’S MAKE IT" data-ar="عندك فكرة؟ خلّينا نصنعها">HAVE AN IDEA? LET’S MAKE IT</small><br><a class="btn primary" href="#brief" data-en="Start a project" data-ar="ابدأ مشروعك">Start a project</a>';
  TOTAL=-z-640;const L=TOTAL+3400;
  const fl=mk('div','w3-floor',world);fl.style.cssText=`height:${L}px;transform:translate3d(0,${fy}px,600px) rotateX(-90deg)`;
  const ce=mk('div','w3-ceil',world);ce.style.cssText=`height:${L}px;transform:translate3d(0,${-fy*1.25}px,600px) rotateX(-90deg)`;
  world.prepend(fl,ce);
  chap.forEach((c,i)=>{const b=mk('button','',rail);b.type='button';b.textContent=c.c.k;b.setAttribute('aria-label',c.card.querySelector('h3').textContent);b.style.setProperty('--c',c.c.c);
    b.onclick=()=>{const p=cl((-c.z-880)/TOTAL,0,1);scrollTo({top:S.getBoundingClientRect().top+scrollY+p*(S.offsetHeight-vh),behavior:'smooth'})}});
  S.style.height=TOTAL*.5+vh+'px';lastKey='';
}

function frame(){
  const r=S.getBoundingClientRect();
  if(r.bottom>-200&&r.top<innerHeight+200&&r.height>innerHeight){
    tgt=cl(-r.top/(r.height-innerHeight),0,1)*TOTAL;
    const d=tgt-cam;cam+=d*.085;roll+=((cl(d*.004,-3,3))-roll)*.1;
    tx+=(mx-tx)*.06;ty+=(my-ty)*.06;
    rig.style.transform=`rotateX(${-ty*3}deg) rotateY(${tx*5}deg) rotateZ(${roll}deg)`;
    world.style.transform=`translate3d(0,0,${cam}px)`;
    const o=cl(cam/700,0,1)*112;
    doorL.style.transform=`translate3d(0,${dY}px,${dZ}px) rotateY(${o}deg)`;doorR.style.transform=`translate3d(0,${dY}px,${dZ}px) rotateY(${-o}deg)`;
    hint.style.opacity=cam<120?.75:0;
    let best=1e9,bi=0;
    items.forEach((it,i)=>{
      const dz=it.z+cam,on=dz>-3300&&dz<420;
      if(on!==it.on){it.on=on;it.f.classList.toggle('on',on)}
      if(!on){if(it.v&&!it.v.paused)it.v.pause();return}
      if(!it.l&&dz>-2800){it.l=1;if(it.im)it.im.src=it.src;else if(it.v)it.v.src=it.src}
      it.f.style.opacity=Math.min(1,(dz+3300)/1500,(560-dz)/380);
      if(it.v){const near=dz>-1200&&dz<240;if(near&&it.v.paused)it.v.play().catch(()=>{});else if(!near&&!it.v.paused)it.v.pause()}
      const q=Math.abs(dz+520);if(q<best){best=q;bi=i}
    });
    let ci=0;chap.forEach((c,i)=>{if(cam>=-c.z-1300)ci=i});
    const c=chap[ci],first=c.i0;
    const inRoom=cam>900,key=inRoom?ci+'/'+bi:'out';
    if(key!==lastKey){lastKey=key;
      hn.textContent=inRoom?c.card.querySelector('h3').textContent:'';
      hc.textContent=inRoom?c.c.k+'  '+pad(Math.max(1,bi-first+1))+' / '+pad(c.n):'';
      hc.style.setProperty('--hc',c.c.c);
      [...rail.children].forEach((b,i)=>b.classList.toggle('on',inRoom&&i===ci))}
  }
  requestAnimationFrame(frame);
}

addEventListener('pointermove',e=>{mx=e.clientX/innerWidth*2-1;my=e.clientY/innerHeight*2-1},{passive:true});
let t1,t2;addEventListener('resize',()=>{clearTimeout(t1);t1=setTimeout(build,250)});
const mo=new MutationObserver(()=>{clearTimeout(t2);t2=setTimeout(build,500)});
cards.forEach(c=>{const s=c.querySelector('.slides');s&&mo.observe(s,{childList:true})});
build();requestAnimationFrame(frame);
})();
