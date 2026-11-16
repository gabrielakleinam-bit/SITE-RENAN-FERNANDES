/* =====================================================================
   03 · APLICAÇÃO: navegação, papéis, login, início, curso e compra
   ===================================================================== */

/* ---------- navegação ----------
   Telas são <section id="s-NOME">. Qualquer elemento com data-go="NOME" navega.
   Regras: admin só vê telas adm-* (exceto em "Ver como aluno"); aluno não vê adm-*;
   a aula só abre com matrícula liberada, aula de amostra ou pré-visualização. */
function go(screen){
  closeSheets(); closeMenu();
  const isAdm = state.logged && state.role==='admin';
  if(isAdm && !state.preview && !screen.startsWith('adm-')) screen='adm-visao';
  if(isAdm && state.preview && screen.startsWith('adm-')) state.preview=false;
  if(!isAdm && screen.startsWith('adm-')) screen='inicio';

  const sample=state.sampleOk; state.sampleOk=false;
  if(screen==='aula' && !canWatch(cur()) && !sample){
    toast(state.pending.has(state.course) ? 'A aula libera depois da confirmação do pagamento pela equipe.'
                                          : 'Compre o curso para assistir às aulas. A primeira aula é gratuita.');
    screen='curso';
  }
  if(screen!=='aula') stopPlayer();

  document.querySelectorAll('.screen').forEach(s=>s.classList.toggle('active', s.id==='s-'+screen));
  document.querySelectorAll('.nav button').forEach(b=>b.setAttribute('aria-current', b.dataset.go===screen?'page':'false'));
  applyRole();
  ({curso:renderCourse, aula:renderLesson, teia:renderTeia, duvidas:renderThreads}[screen] || (()=>{}))();
  if(screen.startsWith('adm-')) renderAdmin(screen);
  window.scrollTo({top:0, behavior:'instant'});
}
document.addEventListener('click', e=>{
  if(e.target.closest('[data-sample]')) state.sampleOk=true;
  const g=e.target.closest('[data-go]'); if(g){ e.preventDefault(); go(g.dataset.go); }
  if(e.target.closest('[data-close]') || e.target===$('scrim')) closeSheets();
  if(e.target.closest('[data-pv-exit]')){ state.preview=false; go('adm-cursos'); }
});
document.addEventListener('keydown', e=>{ if(e.key==='Escape'){ closeSheets(); closeMenu(); } });

function applyRole(){
  const adminOn = state.logged && state.role==='admin' && !state.preview;
  $('navAluno').hidden = adminOn;
  $('navAdmin').hidden = !adminOn;
  $('pvBar').hidden = !state.preview;
  $('whoName').textContent = state.role==='admin' ? 'Administração' : (state.nome||'Aluno');
  $('whoMail').textContent = state.logged ? state.email : '';
  const av=$('avatarBtn'); if(av) av.textContent = state.role==='admin' ? 'A' : initials(state.nome||'A').slice(0,1);
}

/* ---------- matrícula e progresso do aluno logado ---------- */
const canWatch = c => state.owned.has(c.id) || state.preview;
const doneCount = cid => Object.keys(state.doneLessons).filter(k=>k.startsWith(cid+':')).length;
function progOf(c){
  const a=adm.alunos.find(x=>x.email===state.email);
  const feitas=(a && a.mats[c.id] && a.mats[c.id].feitas) || 0;
  return Math.min(100, Math.round(Math.max(feitas, doneCount(c.id)) / Math.max(1,stats(c).aulas) * 100));
}
function syncStudent(){ // lê as matrículas do aluno na "base" (adm.alunos)
  state.owned=new Set(); state.pending=new Set(); state.doneLessons={};
  const a=adm.alunos.find(x=>x.email===state.email);
  if(a) Object.entries(a.mats).forEach(([cid,m])=>{
    if(m.status==='ativo') state.owned.add(cid);
    if(m.status==='aguardando') state.pending.add(cid);
  });
  renderCarousel();
}

/* ---------- login ---------- */
let pendingCheckout=false, authMode='entrar';
function renderAuth(){
  $('authArea').innerHTML = state.logged
    ? `<button class="avatar" id="avatarBtn" aria-haspopup="menu" aria-label="Abrir menu da conta"></button>`
    : `<button class="btn btn-oleo" id="loginOpen" style="padding:9px 16px">Entrar</button>`;
  applyRole();
}
function closeMenu(){ $('userMenu').classList.remove('open'); }
$('authArea').addEventListener('click', e=>{
  if(e.target.closest('#loginOpen')) openSheet('loginSheet');
  if(e.target.closest('#avatarBtn')) $('userMenu').classList.toggle('open');
});
document.querySelectorAll('[data-auth]').forEach(b=>b.addEventListener('click',()=>{
  authMode=b.dataset.auth;
  document.querySelectorAll('[data-auth]').forEach(x=>x.setAttribute('aria-selected', x===b));
  $('nameField').hidden = authMode!=='criar';
  $('consentRow').hidden = authMode!=='criar';
  $('authSubmit').textContent = authMode==='criar' ? 'Criar conta' : 'Entrar';
}));
function doLogin(){
  state.logged=true;
  state.email=$('fEmail').value.trim().toLowerCase();
  const reg=adm.alunos.find(a=>a.email===state.email);
  state.nome=($('fName').value||'').trim() || (reg&&reg.nome) || state.email.split('@')[0].replace(/^./,c=>c.toUpperCase());
  state.role = state.email===ADMIN_EMAIL ? 'admin' : 'aluno';
  state.preview=false;
  renderAuth(); closeSheets();
  if(state.role==='admin'){ go('adm-visao'); toast('Entrou como administrador.'); return; }
  state.lastStudent=state.email; syncStudent();
  toast(authMode==='criar' ? 'Conta criada. Confirme seu e-mail para receber o certificado.' : 'Você entrou.');
  if(pendingCheckout){ pendingCheckout=false; setTimeout(openCheckout,250); }
  else go(document.querySelector('.screen.active').id.slice(2));
}
function logout(msg){
  state.logged=false; state.role='aluno'; state.email=''; state.nome=''; state.preview=false;
  state.owned=new Set(); state.pending=new Set(); state.doneLessons={};
  renderAuth(); renderCarousel(); toast(msg); go('inicio');
}
$('authForm').addEventListener('submit', e=>{
  e.preventDefault();
  if(authMode==='criar' && !$('fConsent').checked){ toast('Para criar a conta, aceite os Termos e a Política de Privacidade.'); return; }
  doLogin();
});
$('googleBtn').onclick=doLogin;
$('forgotBtn').onclick=()=>toast('Enviamos um link para redefinir a senha no seu e-mail.');
$('logoutBtn').onclick=()=>logout('Você saiu.');
$('logoutAllBtn').onclick=()=>logout('Você saiu de todos os dispositivos.');

/* ---------- painéis deslizantes (login, compra, certificado) ---------- */
let pixT;
function openSheet(id){ $('scrim').classList.add('open'); $(id).classList.add('open'); setTimeout(()=>{ const c=document.querySelector('#'+id+' .close'); if(c) c.focus(); },50); }
function closeSheets(){ $('scrim').classList.remove('open'); document.querySelectorAll('.sheet').forEach(s=>s.classList.remove('open')); clearInterval(pixT); }

/* ---------- início ---------- */
$('heroWeb').innerHTML = radar(
  ['Anatomia','Técnica manual','Pressão e direção','Avaliação','Segurança','Autocuidado'],
  [{values:[35,20,40,25,15,30],color:'#E9A25F'},{values:[82,70,88,66,62,78],color:'#4FA3F0'}],
  {w:420,h:400,labels:true,animate:true,dots:true,stroke:3,aria:'Exemplo de teia antes e depois de um curso'});
$('seeCourses').onclick=()=>$('catalogSection').scrollIntoView({behavior:'smooth'});

function renderChips(){
  const cats=['Todos',...new Set(courses.map(c=>c.cat))];
  $('chips').innerHTML=cats.map(c=>`<button class="chip" aria-pressed="${c===state.filter}" data-cat="${esc(c)}">${esc(c)}</button>`).join('');
}
$('chips').addEventListener('click', e=>{ const b=e.target.closest('[data-cat]'); if(!b) return; state.filter=b.dataset.cat; renderChips(); renderCatalog(); });
function renderCatalog(){
  $('catalog').innerHTML=courses.filter(c=>state.filter==='Todos'||c.cat===state.filter).map(c=>`
    <button class="row" data-course="${c.id}">
      <span class="thumb thumb-cover">${coverHTML(c,'tc',{k:'t',center:true})}</span>
      <span>
        <h3>${esc(c.title)}</h3>
        <span class="meta" style="display:block">${esc(c.teacher)}. ${stats(c).aulas} aulas · ${durLabel(c)} de vídeo.</span>
        <span class="axes" style="display:block">${c.axes.length} competências: ${esc(c.axes.slice(0,3).join(', '))} e mais</span>
      </span>
      <span class="price"><strong>${brl(c.price)}</strong><small>12x de ${brl(c.price/12)}</small></span>
    </button>`).join('');
}
$('catalog').addEventListener('click', e=>{ const r=e.target.closest('[data-course]'); if(r){ selectCourse(r.dataset.course); go('curso'); } });
function selectCourse(id){ if(id!==state.course){ state.course=id; state.lessonRef=null; } }

/* carrossel: um slide por curso, com o diagnóstico na 2ª posição */
let carI=0, carT=null, carPaused=false;
function renderCarousel(){
  const items=courses.map(c=>({c})); items.splice(Math.min(1,items.length),0,{diag:true});
  $('carTrack').innerHTML=items.map((it,i)=>{
    const lab=`aria-roledescription="slide" aria-label="${i+1} de ${items.length}"`;
    if(it.diag) return `<article class="slide" ${lab}>
      <div class="s-vis s-vis-diag"><img src="${ASSETS.ilustracao}" alt=""></div>
      <div class="s-txt"><small class="s-cat">Grátis · 6 perguntas · 2 minutos</small><h3>Não sabe por onde começar?</h3>
        <p>Responda o diagnóstico: ele desenha a sua teia de competências e indica os treinamentos que fazem mais sentido para você.</p>
        <div class="s-act"><button class="btn btn-oleo" data-go="teia">Fazer o teste agora</button></div></div></article>`;
    const c=it.c, owned=state.owned.has(c.id), p=owned?progOf(c):null, s=stats(c);
    return `<article class="slide" ${lab}>
      <div class="s-vis">${coverHTML(c,'s-cover',{k:'s'})}</div>
      <div class="s-txt"><small class="s-cat">${esc(c.cat)} · ${esc(c.teacher)}</small><h3>${esc(c.title)}</h3><p>${esc(c.short||'')}</p>
        <div class="s-facts"><span>${s.aulas} aulas</span><span>${fmtTotal(s.sec)} de vídeo</span><span>${brl(c.price)}</span></div>
        ${p!==null?`<div class="s-prog" role="img" aria-label="Progresso ${p}%"><b style="width:${p}%"></b></div><small class="s-pl">${p}% concluído</small>`:''}
        <div class="s-act"><button class="btn btn-oleo" data-car="${c.id}">${owned?'Continuar o curso':'Conhecer o curso'}</button></div></div></article>`;
  }).join('');
  $('carDots').innerHTML=items.map((it,i)=>`<button data-dot="${i}" aria-label="Ir para ${it.diag?'o diagnóstico':esc(it.c.title)}"></button>`).join('');
  moveCar(carI);
}
function moveCar(i){
  const n=$('carTrack').children.length||1; carI=((i%n)+n)%n;
  $('carTrack').style.transform=`translateX(-${carI*100}%)`;
  document.querySelectorAll('#carDots button').forEach((b,k)=>b.setAttribute('aria-current', k===carI?'true':'false'));
}
function autoCar(){ clearInterval(carT); carT=setInterval(()=>{ if(!carPaused && !document.hidden) moveCar(carI+1); },7000); }
(()=>{
  const car=$('car'); let x0=null;
  car.addEventListener('click', e=>{
    const b=e.target.closest('[data-car]'), d=e.target.closest('[data-dot]');
    if(b){ selectCourse(b.dataset.car); go('curso'); }
    else if(d){ moveCar(+d.dataset.dot); autoCar(); }
    else if(e.target.closest('#carPrev')){ moveCar(carI-1); autoCar(); }
    else if(e.target.closest('#carNext')){ moveCar(carI+1); autoCar(); }
  });
  ['mouseenter','focusin'].forEach(ev=>car.addEventListener(ev,()=>carPaused=true));
  ['mouseleave','focusout'].forEach(ev=>car.addEventListener(ev,()=>carPaused=false));
  car.addEventListener('touchstart', e=>{ x0=e.touches[0].clientX; }, {passive:true});
  car.addEventListener('touchend', e=>{ if(x0===null) return; const dx=e.changedTouches[0].clientX-x0; if(Math.abs(dx)>40){ moveCar(carI+(dx<0?1:-1)); autoCar(); } x0=null; });
})();

/* pacotes */
const packFull = p => p.cursos.reduce((s,id)=>s+((courseById(id)||{}).price||0),0);
const packSec  = p => p.cursos.reduce((s,id)=>{ const c=courseById(id); return s+(c?stats(c).sec:0); },0);
function renderPacks(){
  $('packs').innerHTML=PACKS.filter(p=>p.cursos.every(courseById)).map(p=>{
    const full=packFull(p), cs=p.cursos.map(courseById);
    return `<article class="pack">
      <div class="pack-art">${cs.map((c,i)=>coverHTML(c,'pa',{k:'pk'+p.id+i,center:true})).join('')}<span class="off">${Math.round((1-p.price/full)*100)}% off</span></div>
      <div class="pack-b"><h3>${esc(p.title)}</h3><p>${esc(p.sub)}</p><ul>${cs.map(c=>`<li>${esc(c.title)}</li>`).join('')}</ul>
        <div class="pack-f"><div><s>${brl(full)}</s><b>${brl(p.price)}</b><small>${p.cursos.length} cursos · ${fmtTotal(packSec(p))}</small></div>
        <button class="btn btn-anil" data-pack="${p.id}">Quero o pacote</button></div></div></article>`;
  }).join('');
}
document.addEventListener('click', e=>{
  const b=e.target.closest('[data-pack]'); if(!b) return;
  state.pack=b.dataset.pack;
  if(!state.logged){ pendingCheckout=true; openSheet('loginSheet'); } else openCheckout();
});

/* redes do Renan (aparecem só no bloco "Quem ensina") */
const SOC = {
  wa:'<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2zm0 18.2a8.2 8.2 0 0 1-4.2-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8-.2-.1-.4-.1-.6.1l-.8 1c-.1.2-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.3-.4.3-.4.7-1.4.1-.2 0-.3 0-.5l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2 5.2 5.2 0 0 0 1.1 2.7 11.8 11.8 0 0 0 4.5 4c1.7.7 2.3.8 3.2.6.5-.1 1.5-.6 1.7-1.2.2-.6.2-1.1.2-1.2-.1-.1-.3-.2-.5-.3z"/></svg>',
  ig:'<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1" fill="currentColor"/></svg>',
  tt:'<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M16.6 3c.4 2 1.8 3.5 3.9 3.7v3.1a7 7 0 0 1-3.9-1.2v6.3a5.9 5.9 0 1 1-5.9-5.9h.6v3.2a2.8 2.8 0 1 0 2.2 2.7V3z"/></svg>'
};
$('social').innerHTML=`
  <a href="${RENAN.whatsapp}" target="_blank" rel="noopener">${SOC.wa}<span>WhatsApp <small>${RENAN.whatsappTxt}</small></span></a>
  <a href="${RENAN.instagram}" target="_blank" rel="noopener">${SOC.ig}<span>Instagram <small>${RENAN.instagramTxt}</small></span></a>
  <a href="${RENAN.tiktok}" target="_blank" rel="noopener">${SOC.tt}<span>TikTok <small>${RENAN.tiktokTxt}</small></span></a>`;

/* ---------- página do curso ---------- */
function renderCourse(){
  const c=cur(), owned=state.owned.has(c.id), s=stats(c);
  $('cTitle').textContent=c.title; $('cPic').textContent=initials(c.teacher); $('cTeacher').textContent=c.teacher; $('cCity').textContent='Professor';
  $('cFacts').innerHTML=`<span>${fmtTotal(s.sec)} de vídeo</span><span>${s.aulas} aulas</span>${c.rating?`<span>Nota ${c.rating.toFixed(1).replace('.',',')}</span><span>${c.students.toLocaleString('pt-BR')} alunos</span>`:''}<span>Certificado de curso livre</span>`;
  $('cAbout').innerHTML=[c.short&&`<p>${esc(c.short)}</p>`, c.paraQuem&&`<p><b>Para quem é:</b> ${esc(c.paraQuem)}</p>`, c.instr&&`<p><b>Instruções:</b> ${esc(c.instr)}</p>`].filter(Boolean).join('');

  let box=`<div class="bb-cover">${coverHTML(c,'bb-c',{k:'b'})}</div>`;
  if(state.preview) box+=`<p class="muted" style="font-size:14px;margin:0 0 12px">Pré-visualização: você vê o curso como o aluno, com todas as aulas abertas.</p><button class="btn btn-oleo full" data-go="aula">Abrir aulas</button>`;
  else if(owned) box+=`<span class="owned-tag">Você tem este curso</span><button class="btn btn-oleo" data-go="aula">Continuar assistindo</button><button class="btn btn-quiet full" data-go="teia">Ver minha teia</button>${certBoxHTML(c)}`;
  else if(state.pending.has(c.id)) box+=`<span class="owned-tag" style="background:#FDF0E1;color:#8A4B12">Pagamento recebido</span>
      <p class="muted" style="font-size:14px;margin:0 0 12px">Aguardando a liberação da entrada pela equipe. Você recebe um aviso por e-mail assim que as aulas estiverem disponíveis.</p>
      <button class="btn btn-quiet full" data-go="aula" data-sample="1">Assistir aula de amostra</button>`;
  else box+=`<div class="big">${brl(c.price)}</div><div class="inst">ou 12x de ${brl(c.price/12)} no cartão</div>
      <button class="btn btn-oleo" id="buyBtn">Comprar curso</button>
      <button class="btn btn-quiet full" data-go="aula" data-sample="1">Assistir aula de amostra</button>
      <ul><li>Pix, cartão ou boleto</li><li>Demonstrações com câmera nas mãos</li><li>Acesso por 12 meses</li><li>Diagnóstico de entrada e saída</li><li>7 dias para pedir reembolso</li></ul>`;
  $('buybox').innerHTML=box;

  const mods=modulesOf(c);
  $('cSub').textContent=`${mods.length} módulos, testes ao fim de cada um e avaliação final.`;
  $('modules').innerHTML=mods.map((m,i)=>`
    <details class="mod" ${i===0?'open':''}><summary>${esc(m.title)}<span>${m.lessons.length} itens</span></summary>
      ${m.lessons.map((l,j)=>`<div class="lesson ${l.type==='teste'?'quiz':''} ${state.doneLessons[`${c.id}:${i}:${j}`]?'done':''}"><div>${esc(l.t)}</div><span>${esc(l.d||'em breve')}</span></div>`).join('')}
    </details>`).join('');
  $('cWeb').innerHTML=radar(c.axes,[{values:c.axes.map(()=>100),color:'#4FA3F0',fillOp:.08}],{w:340,h:300,labels:true,pad:70,fs:12,aria:'Competências do curso'});
}
$('buybox').addEventListener('click', e=>{
  if(!e.target.closest('#buyBtn')) return;
  state.pack=null;
  if(!state.logged){ pendingCheckout=true; openSheet('loginSheet'); } else openCheckout();
});

/* ---------- compra (curso ou pacote) ----------
   Pagar NÃO libera a aula: cria um pedido "aguardando" para o admin conferir e liberar. */
function checkoutItem(){
  const p=state.pack && PACKS.find(x=>x.id===state.pack);
  return p ? {titulo:'Pacote '+p.title, preco:p.price, cursos:p.cursos.filter(id=>!state.owned.has(id)), pacote:p.title}
           : {titulo:cur().title, preco:cur().price, cursos:[state.course], pacote:''};
}
function openCheckout(){
  const it=checkoutItem();
  $('coCourse').textContent=it.titulo; $('coPrice').textContent=brl(it.preco);
  $('inst').innerHTML=Array.from({length:12},(_,i)=>`<option>${i+1}x de ${brl(it.preco/(i+1))} sem juros</option>`).join('');
  $('coBody').hidden=false; $('coSuccess').classList.remove('show');
  setPay('pix'); drawQR(); openSheet('checkoutSheet');
  let left=900; clearInterval(pixT);
  pixT=setInterval(()=>{ left--; $('pixTimer').textContent=fmtClock(left); if(left<=0) clearInterval(pixT); },1000);
}
function setPay(p){
  document.querySelectorAll('[data-pay]').forEach(b=>b.setAttribute('aria-selected', b.dataset.pay===p));
  $('payPix').hidden=p!=='pix'; $('payCartao').hidden=p!=='cartao'; $('payBoleto').hidden=p!=='boleto';
}
document.querySelectorAll('[data-pay]').forEach(b=>b.addEventListener('click',()=>setPay(b.dataset.pay)));
function drawQR(){ // QR ilustrativo
  const n=25; let seed=7; const rnd=()=>(seed=(seed*9301+49297)%233280)/233280;
  const finder=(x,y)=>`<rect x="${x}" y="${y}" width="7" height="7" fill="#12161B"/><rect x="${x+1}" y="${y+1}" width="5" height="5" fill="#fff"/><rect x="${x+2}" y="${y+2}" width="3" height="3" fill="#12161B"/>`;
  let s=`<svg viewBox="0 0 ${n} ${n}" shape-rendering="crispEdges" aria-label="QR Code Pix de demonstração">`;
  for(let y=0;y<n;y++) for(let x=0;x<n;x++){
    if((x<8&&y<8)||(x>n-9&&y<8)||(x<8&&y>n-9)) continue;
    if(rnd()>.52) s+=`<rect x="${x}" y="${y}" width="1" height="1" fill="#12161B"/>`;
  }
  $('qr').innerHTML=s+finder(0,0)+finder(n-7,0)+finder(0,n-7)+`<rect x="10" y="10" width="5" height="5" fill="#4FA3F0"/></svg>`;
}
function paid(){
  const it=checkoutItem();
  it.cursos.forEach(id=>state.pending.add(id));
  adminAddPedido(it.cursos, it.preco, it.pacote);
  state.pack=null; clearInterval(pixT);
  $('coBody').hidden=true; $('coSuccess').classList.add('show');
}
$('confirmPix').onclick=paid;
$('confirmCard').onclick=paid;
$('confirmBoleto').onclick=()=>{ closeSheets(); toast('Boleto gerado e enviado para o seu e-mail.'); };
$('copyPix').onclick=()=>toast('Código Pix copiado.');
