/* =====================================================================
   04 · AULA: menu do módulo, player e presença
   Um único conjunto de controles (play, barra, velocidade, tela cheia) comanda
   três fontes: vídeo enviado (<video>), YouTube (IFrame API por postMessage) e,
   nos cursos de exemplo, um player simulado.
   YouTube: o iframe fica sem controles e sem cliques (pointer-events:none) sob uma
   camada da plataforma. Logo, título, "assistir no YouTube" e sugestões do fim do
   vídeo não são clicáveis: o aluno nunca sai do site.
   Presença: a aula conta como concluída com 90% dos blocos de 5 s assistidos.
   Pular trechos não marca blocos.
   ===================================================================== */

const P = { kind:'sim', video:null, frame:null, timer:null, lastT:0, ytHeard:false, ytWait:null, ytPoll:null };
const PLAY_ICO=`<svg width="26" height="26" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" fill="#fff"/></svg>`;
const PAUSE_ICO=`<svg width="26" height="26" viewBox="0 0 24 24"><rect x="6" y="5" width="4" height="14" rx="1" fill="#fff"/><rect x="14" y="5" width="4" height="14" rx="1" fill="#fff"/></svg>`;
const RATES=[0.75,1,1.25,1.5,2];

/* ---------- menu lateral ---------- */
function renderModMenu(){
  const c=cur(), ok=canWatch(c), ref=state.lessonRef;
  $('modMenu').innerHTML=`<h3 class="mm-course">${esc(c.title)}</h3><p class="mm-sum">${stats(c).aulas} aulas · ${durLabel(c)}</p>`+
    modulesOf(c).map((m,mi)=>`<h4 class="mm-mod">${esc(m.title)}</h4>`+m.lessons.map((l,li)=>{
      const done=!!state.doneLessons[`${c.id}:${mi}:${li}`], on=ref&&ref.mi===mi&&ref.li===li, locked=!ok&&!(mi===0&&li===0);
      return `<button class="mm-l${on?' on':''}${done?' ok':''}${locked?' lock':''}" data-mm="${mi}:${li}" ${on?'aria-current="true"':''}>
        <span class="ic">${done?'✓':locked?ic('lockS',12):''}</span><span class="mm-t">${esc(l.t)}</span><span class="d">${esc(l.d||'em breve')}</span></button>`;
    }).join('')).join('');
}
$('modMenu').addEventListener('click', e=>{ const b=e.target.closest('[data-mm]'); if(b){ const [mi,li]=b.dataset.mm.split(':').map(Number); loadLesson(mi,li); } });

/* ---------- abrir aula ---------- */
function loadLesson(mi,li){
  const c=cur(), l=(modulesOf(c)[mi]||{lessons:[]}).lessons[li];
  if(!l) return;
  if(l.type==='teste'){ toast('Teste do módulo: libera ao concluir as aulas do módulo.'); return; }
  if(!canWatch(c) && !(mi===0&&li===0)){ toast('Esta aula faz parte do curso. A primeira aula é gratuita.'); return; }
  state.lessonRef={cid:c.id, mi, li};
  renderLesson();
}
function renderLesson(){
  const c=cur();
  if(!state.lessonRef || state.lessonRef.cid!==c.id) state.lessonRef={cid:c.id, mi:0, li:0};
  const {mi,li}=state.lessonRef, l=modulesOf(c)[mi].lessons[li];
  $('lTitle').textContent=l.t;
  $('qaMini').innerHTML=threads.filter(t=>t.course===c.id).slice(0,2).map(t=>`<button class="q" data-thread="${t.id}"><strong>${esc(t.title)}</strong><span>${t.msgs.length} mensagens, ${esc(t.status)}</span></button>`).join('')
    || '<p class="muted">Nenhuma dúvida nesta aula ainda.</p>';
  mountLesson(l);
  renderModMenu();
}
$('qaMini').addEventListener('click', e=>{ const b=e.target.closest('[data-thread]'); if(b){ state.thread=+b.dataset.thread; go('duvidas'); } });

function resetPresence(sec){
  state.dur=Math.max(1,sec||300); state.pos=0; state.done=false; state.playing=false; P.lastT=0;
  state.watched=new Uint8Array(Math.ceil(state.dur/BLOCK));
  $('timeTotal').textContent=fmtClock(state.dur);
  $('track').setAttribute('aria-valuemax', Math.round(state.dur));
  $('ribbon').innerHTML='<i></i>'.repeat(state.watched.length);
}
function stage(html, mode){ // mode: 'media' (controles visíveis) | 'panel' (texto, material, aviso)
  $('stage').innerHTML=html; $('stage').hidden=!html;
  $('playerWrap').dataset.mode = html ? mode : 'sim';
}
function mountLesson(l){
  stopPlayer();
  resetPresence(parseDur(l.d)||300);
  $('endCard').hidden=true;
  buffering(true);
  const yt = ytId(l.src);
  if(l.type==='texto'){
    P.kind='panel';
    stage(`<div class="rv-text"><h3>${esc(l.t)}</h3><p>${esc(l.texto||'Texto da aula.').replace(/\n/g,'<br>')}</p><button class="btn btn-oleo" data-mark-done>Concluí a leitura</button></div>`,'panel');
  } else if(l.type==='material'){
    P.kind='panel';
    stage(`<div class="rv-text"><h3>${esc(l.t)}</h3><p>Material de apoio${l.file?': '+esc(l.file):''}.</p>
      <div class="acts">${l.src?`<a class="btn btn-oleo" href="${esc(l.src)}" target="_blank" rel="noopener">Abrir material</a>`:''}<button class="btn btn-ghost" style="color:#fff" data-mark-done>Marcar como visto</button></div></div>`,'panel');
  } else if(yt){
    P.kind='yt'; P.ytHeard=false;
    const origin = location.origin && location.origin!=='null' ? '&origin='+encodeURIComponent(location.origin) : '';
    stage(`<iframe class="yt" title="${esc(l.t)}" tabindex="-1" referrerpolicy="strict-origin-when-cross-origin" allow="autoplay; encrypted-media"
        src="https://www.youtube-nocookie.com/embed/${yt}?enablejsapi=1&controls=0&disablekb=1&fs=0&rel=0&modestbranding=1&iv_load_policy=3&playsinline=1${origin}"></iframe>
      <button class="shield" data-shield aria-label="Reproduzir ou pausar"></button>`,'media');
    P.frame=$('stage').querySelector('iframe');
    P.frame.addEventListener('load', ()=>{ clearInterval(P.ytPoll); P.ytPoll=setInterval(()=>ytSend({event:'listening',id:1,channel:'widget'}),500); });
    P.ytWait=setTimeout(()=>{ if(!P.ytHeard) ytBlocked(l); },6000);
  } else if(l.src){
    P.kind='file';
    stage(`<video playsinline preload="metadata" src="${esc(l.src)}"></video><button class="shield" data-shield aria-label="Reproduzir ou pausar"></button>`,'media');
    const v=P.video=$('stage').querySelector('video');
    v.addEventListener('loadedmetadata',()=>{ resetPresence(v.duration); buffering(false); paint(); });
    v.addEventListener('timeupdate',()=>onTime(v.currentTime));
    v.addEventListener('play',()=>{ state.playing=true; paint(); });
    v.addEventListener('pause',()=>{ state.playing=false; paint(); });
    v.addEventListener('ended',onEnded);
    v.addEventListener('waiting',()=>buffering(true)); v.addEventListener('playing',()=>buffering(false));
    v.addEventListener('error',()=>{ buffering(false); stage(`<div class="rv-text"><h3>Este navegador não abriu o arquivo</h3><p>Vídeos do iPhone (MOV/HEVC) são convertidos para streaming no envio, no site publicado.</p></div>`,'panel'); });
  } else if(courseById(state.course).modules){
    P.kind='panel';
    stage(`<div class="rv-text"><h3>Em breve</h3><p>O vídeo desta aula ainda está sendo preparado.</p></div>`,'panel');
  } else {
    P.kind='sim'; stage('','sim');
  }
  if(P.kind!=='yt' && P.kind!=='file') setTimeout(()=>buffering(false),500);
  paint();
}
function stopPlayer(){
  clearInterval(P.timer); clearInterval(P.ytPoll); clearTimeout(P.ytWait);
  if(P.video) P.video.pause();
  P.video=null; P.frame=null; state.playing=false;
  if($('stage')){ $('stage').innerHTML=''; $('stage').hidden=true; }
}
function buffering(on){ $('buf').classList.toggle('on',!!on); }

/* ---------- YouTube (IFrame API por postMessage) ---------- */
function ytSend(msg){ try{ P.frame && P.frame.contentWindow.postMessage(JSON.stringify(msg),'*'); }catch(_){} }
const ytCmd = (func,args=[]) => ytSend({event:'command',func,args,id:1,channel:'widget'});
addEventListener('message', e=>{
  if(P.kind!=='yt' || !/youtube/.test(e.origin)) return;
  let d; try{ d=JSON.parse(e.data); }catch(_){ return; }
  if(d.event==='onError'){ ytBlocked(); return; }
  if(!d.info) return;
  if(!P.ytHeard){ P.ytHeard=true; buffering(false); }
  if(d.info.duration && Math.abs(d.info.duration-state.dur)>1 && !state.watched.some(Boolean)) resetPresence(d.info.duration);
  if(typeof d.info.playerState==='number'){
    state.playing = d.info.playerState===1;
    if(d.info.playerState===0) onEnded();
    buffering(d.info.playerState===3);
  }
  if(typeof d.info.currentTime==='number') onTime(d.info.currentTime);
  else paint();
});
function ytBlocked(){ // o ambiente de teste do Claude bloqueia vídeos de outros sites
  if(P.kind!=='yt') return;
  clearInterval(P.ytPoll); buffering(false);
  P.kind='panel';
  stage(`<div class="rv-text"><h3>Vídeo do YouTube</h3>
    <p>Esta pré-visualização do Claude bloqueia vídeos de outros sites. No site publicado, o vídeo toca aqui mesmo, com os controles da plataforma, sem levar o aluno ao YouTube.</p>
    <div class="acts"><button class="btn btn-oleo" data-sim-here>Simular a aula aqui</button></div></div>`,'panel');
}

/* ---------- comandos (mesmos botões para as três fontes) ---------- */
function pPlay(){
  if(P.kind==='panel') return;
  $('endCard').hidden=true;
  if(P.kind==='file') return void P.video.play();
  if(P.kind==='yt'){ ytCmd('playVideo'); state.playing=true; return paint(); }
  if(state.playing) return;
  if(state.pos>=state.dur) state.pos=0;
  state.playing=true;
  P.timer=setInterval(()=>{ // simulado: tempo acelerado (~12x) para demonstração
    const t=Math.min(state.dur, state.pos+state.rate*1.2);
    onTime(t);
    if(t>=state.dur) onEnded();
  },100);
  paint();
}
function pPause(){
  if(P.kind==='file') return void P.video.pause();
  if(P.kind==='yt'){ ytCmd('pauseVideo'); state.playing=false; return paint(); }
  state.playing=false; clearInterval(P.timer); paint();
}
function pSeek(t){
  t=Math.max(0,Math.min(state.dur,t)); P.lastT=t; state.pos=t;
  if(P.kind==='file') P.video.currentTime=t;
  if(P.kind==='yt') ytCmd('seekTo',[t,true]);
  paint();
}
function pRate(r){
  state.rate=r; $('speedBtn').textContent=String(r).replace('.',',')+'x';
  if(P.kind==='file') P.video.playbackRate=r;
  if(P.kind==='yt') ytCmd('setPlaybackRate',[r]);
}
function onTime(t){ // marca só trechos assistidos em sequência
  if(t>=P.lastT && t-P.lastT<=3){
    for(let b=Math.floor(P.lastT/BLOCK); b<=Math.floor(Math.min(t,state.dur-0.01)/BLOCK); b++) if(b<state.watched.length) state.watched[b]=1;
  }
  P.lastT=t; state.pos=Math.min(t,state.dur); paint();
}
function onEnded(){
  state.playing=false; clearInterval(P.timer); paint();
  const nx=nextLesson();
  $('endCard').innerHTML=`<b>${state.done?'Aula concluída':'Fim do vídeo'}</b><span>${state.done?'Ela já conta no seu progresso.':'Alguns trechos foram pulados e ainda não contam.'}</span>
    <div class="acts">${nx?`<button class="btn btn-oleo" data-next>Próxima aula</button>`:''}<button class="btn btn-ghost" style="color:#fff" data-replay>Assistir de novo</button></div>`;
  $('endCard').hidden=false; // cobre as sugestões do fim do vídeo do YouTube
}
function nextLesson(){
  const c=cur(), mods=modulesOf(c); let {mi,li}=state.lessonRef;
  while(true){
    li++; if(li>=mods[mi].lessons.length){ mi++; li=0; } if(mi>=mods.length) return null;
    if(mods[mi].lessons[li].type!=='teste') return {mi,li};
  }
}

function paint(){
  const n=state.watched.length, w=state.watched.reduce((a,b)=>a+b,0), pct=Math.round(w/n*100), cb=Math.min(n-1,Math.floor(state.pos/BLOCK));
  const cells=$('ribbon').children;
  for(let i=0;i<cells.length;i++) cells[i].className = i===cb ? 'now' : state.watched[i] ? 'w' : '';
  $('pct').textContent=pct+'%'; $('meterFill').style.width=pct+'%';
  $('timeNow').textContent=fmtClock(state.pos);
  $('head').style.left=(state.pos/state.dur*100)+'%';
  $('track').setAttribute('aria-valuenow',Math.round(state.pos));
  let segs='', i=0;
  while(i<n){ if(state.watched[i]){ let j=i; while(j<n&&state.watched[j]) j++; segs+=`<span class="seen" style="left:${i/n*100}%;width:${(j-i)/n*100}%"></span>`; i=j; } else i++; }
  $('railSeen').innerHTML=segs;
  $('playBtn').innerHTML=state.playing?PAUSE_ICO:PLAY_ICO;
  $('playBtn').setAttribute('aria-label',state.playing?'Pausar':'Reproduzir');
  $('bigPlay').style.display = state.playing || P.kind==='panel' ? 'none' : 'grid';
  if(pct>=90 && !state.done){
    state.done=true; toast('Aula concluída.');
    const r=state.lessonRef; if(r){ state.doneLessons[`${r.cid}:${r.mi}:${r.li}`]=true; renderModMenu(); }
  }
  $('doneBanner').classList.toggle('show',state.done);
}

/* ---------- eventos dos controles ---------- */
$('playBtn').onclick=()=>state.playing?pPause():pPlay();
$('bigPlay').onclick=pPlay;
$('speedBtn').onclick=()=>pRate(RATES[(RATES.indexOf(state.rate)+1)%RATES.length]);
$('fsBtn').onclick=()=>{ const el=document.querySelector('.player'); try{ document.fullscreenElement ? document.exitFullscreen() : el.requestFullscreen().catch(()=>toast('Tela cheia indisponível nesta pré-visualização.')); }catch(_){ toast('Tela cheia indisponível nesta pré-visualização.'); } };
$('stage').addEventListener('click', e=>{
  if(e.target.closest('[data-shield]')) state.playing?pPause():pPlay();
  if(e.target.closest('[data-mark-done]')){ state.watched.fill(1); paint(); }
  if(e.target.closest('[data-sim-here]')){ P.kind='sim'; stage('','sim'); paint(); }
});
$('endCard').addEventListener('click', e=>{
  if(e.target.closest('[data-next]')){ const nx=nextLesson(); if(nx) loadLesson(nx.mi,nx.li); }
  if(e.target.closest('[data-replay]')){ $('endCard').hidden=true; pSeek(0); pPlay(); }
});
(()=>{
  const track=$('track'); let drag=false;
  const seekFrom=ev=>{ const r=track.getBoundingClientRect(); pSeek(((ev.touches?ev.touches[0].clientX:ev.clientX)-r.left)/r.width*state.dur); };
  track.addEventListener('pointerdown',e=>{ drag=true; track.setPointerCapture(e.pointerId); seekFrom(e); });
  track.addEventListener('pointermove',e=>{ if(drag) seekFrom(e); });
  track.addEventListener('pointerup',()=>{ drag=false; if(state.pos>0&&!state.done) toast('Avançou. O trecho pulado não conta para a conclusão.'); });
  track.addEventListener('keydown',e=>{ if(e.key==='ArrowRight') pSeek(state.pos+10); if(e.key==='ArrowLeft') pSeek(state.pos-10); });
})();
