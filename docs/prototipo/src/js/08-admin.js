/* =====================================================================
   08 · ADMINISTRAÇÃO
   Visão · Alunos · Acessos · Certificados · Dúvidas · Cursos (+ editor)
   ===================================================================== */

let admBusca='', admCurso='', admAcessoTab='aguardando', ed=null, delArm=null;

const put = (id,html) => { const el=$(id); if(el) el.innerHTML=html; };
const allMats = () => adm.alunos.flatMap(a=>Object.entries(a.mats).map(([cid,m])=>({a,cid,m})));
const pctOf = (cid,feitas) => { const c=courseById(cid); return c ? Math.min(100,Math.round((feitas||0)/Math.max(1,stats(c).aulas)*100)) : 0; };
const AV_COLORS=['#1F6FD1','#0E7C66','#7A4FD1','#B5651D','#2A4D7A','#0F766E','#9B3B5A'];
const avatar = (n,s=40) => `<span class="av" style="width:${s}px;height:${s}px;background:${AV_COLORS[hashStr(n)%AV_COLORS.length]}">${esc(initials(n))}</span>`;
const chip = (t,k='') => `<span class="chip ${k}">${t}</span>`;
const bar = p => `<div class="pbar"><div class="pb"><b style="width:${p}%"></b></div><span>${p}%</span></div>`;
const adHead = (t,sub,act='') => `<div class="ad-top"><div><h1>${t}</h1>${sub?`<p>${sub}</p>`:''}</div>${act}</div>`;
function ensureAluno(email,nome){
  let a=adm.alunos.find(x=>x.email===email);
  if(!a){ a={email,nome:nome||email.split('@')[0],cadastro:hoje(),mats:{}}; adm.alunos.push(a); }
  return a;
}

/* chamado pela compra do aluno: cria pedido "aguardando" e a matrícula pendente */
function adminAddPedido(cids, valor, pacote){
  const met=((document.querySelector('[data-pay][aria-selected="true"]')||{}).textContent||'Pix').trim();
  adm.pedidos.unshift({id:'p'+Date.now(),email:state.email,nome:state.nome,cursos:cids,valor,pacote,metodo:met,data:'agora',status:'aguardando'});
  const a=ensureAluno(state.email,state.nome);
  cids.forEach(cid=>{ if(!a.mats[cid] || a.mats[cid].status!=='ativo') a.mats[cid]={status:'aguardando',feitas:0,pos:'—',ultimo:'—'}; });
}

function renderAdmin(screen){
  if(screen==='adm-editor' && !ed) ed=blankEd();
  ({'adm-visao':renderVisao,'adm-alunos':renderAlunos,'adm-acessos':renderAcessos,'adm-certificados':renderCertificados,
    'adm-perguntas':renderPerguntas,'adm-cursos':renderCursos,'adm-editor':renderEditor}[screen]||(()=>{}))();
}

/* ---------- Visão ---------- */
function renderVisao(){
  const mats=allMats(), ativos=mats.filter(x=>x.m.status==='ativo');
  const media=ativos.length?Math.round(ativos.reduce((s,x)=>s+pctOf(x.cid,x.m.feitas),0)/ativos.length):0;
  const n={pag:adm.pedidos.filter(p=>p.status==='aguardando').length, cert:adm.certs.filter(k=>k.status==='pendente').length, duv:threads.filter(t=>t.status==='aberta').length};
  const vendas=adm.pedidos.filter(p=>p.status==='liberado').reduce((s,p)=>s+p.valor,0);
  const todo=(k,label,sub,to,icn)=>`<button class="todo-i ${k?'on':''}" data-go="${to}"><span class="ti-ic">${ic(icn)}</span><span class="ti-t"><b>${k}</b> ${label}<small>${sub}</small></span><span class="ti-a">${ic('arrow',18)}</span></button>`;
  const kpi=(icn,lab,val,sub)=>`<div class="ad-card ad-kpi"><span class="ic">${ic(icn)}</span><small>${lab}</small><b>${val}</b><em>${sub}</em></div>`;
  const onde=ativos.sort((a,b)=>pctOf(b.cid,b.m.feitas)-pctOf(a.cid,a.m.feitas)).map(x=>`<div class="ad-row r-onde">
      <div class="person">${avatar(x.a.nome,36)}<div><b>${esc(x.a.nome)}</b><small>${esc(x.m.ultimo)}</small></div></div>
      <div class="ell"><small class="muted">${esc(cName(x.cid))}</small><div>${chip(esc(x.m.pos),x.m.pos==='Concluído'?'green':'blue')}</div></div>${bar(pctOf(x.cid,x.m.feitas))}</div>`).join('')
    || '<p class="muted pad">Nenhum aluno com acesso liberado.</p>';
  const porCurso=courses.map(c=>{
    const lm=mats.filter(x=>x.cid===c.id), at=lm.filter(x=>x.m.status==='ativo'), ag=lm.length-at.length;
    const med=at.length?Math.round(at.reduce((s,x)=>s+pctOf(c.id,x.m.feitas),0)/at.length):0;
    const ab=threads.filter(t=>t.course===c.id&&t.status==='aberta').length;
    return `<div class="ad-row r-curso"><div class="person">${coverHTML(c,'mini-cover',{k:'v',center:true})}<div><b>${esc(c.title)}</b><small>${at.length} ativos${ag?` · ${ag} aguardando`:''}${ab?` · ${ab} dúvida${ab>1?'s':''}`:''}</small></div></div>${bar(med)}</div>`;
  }).join('');
  const temas={};
  threads.forEach(t=>{ const k=t.course+'|'+t.tema; (temas[k]=temas[k]||{course:t.course,tema:t.tema,n:0}).n++; });
  const rank=Object.values(temas).sort((a,b)=>b.n-a.n).slice(0,5).map((t,i)=>`<div class="rank-i"><span class="rk">${i+1}</span><div><b>${esc(t.tema)}</b><small>${esc(cName(t.course))}</small></div><span class="chip">${t.n}</span></div>`).join('');
  put('av-visao', adHead('Olá, Renan','Resumo da plataforma hoje. O que precisa de decisão sua aparece primeiro.',`<button class="btn btn-anil" data-ad="novo">${ic('plus',18)} Novo treinamento</button>`)+`
    <div class="todo">${todo(n.pag,'pagamentos para liberar','Confira na conta e libere a entrada','adm-acessos','lock')}
      ${todo(n.cert,'certificados para aprovar','Aprove ou negue a emissão','adm-certificados','medal')}
      ${todo(n.duv,'dúvidas sem resposta','Responda aos alunos','adm-perguntas','chat')}</div>
    <div class="ad-kpis">${kpi('users','Alunos cadastrados',adm.alunos.length,`${ativos.length} com acesso liberado`)}
      ${kpi('chart','Progresso médio',media+'%','nos cursos em andamento')}
      ${kpi('play','Treinamentos publicados',courses.length,`${courses.reduce((s,c)=>s+stats(c).aulas,0)} aulas no total`)}
      ${kpi('money','Vendas confirmadas',brl(vendas),'pagamentos liberados')}</div>
    <div class="ad-cols">
      <section class="ad-card flush"><div class="sec-h"><h2>Onde estão os alunos agora</h2><button class="lnk" data-go="adm-alunos">Ver todos</button></div>${onde}</section>
      <div class="ad-stack">
        <section class="ad-card flush"><div class="sec-h"><h2>Por treinamento</h2></div>${porCurso}</section>
        <section class="ad-card"><div class="sec-h nopad"><h2>Dúvidas mais frequentes</h2><button class="lnk" data-go="adm-perguntas">Responder</button></div>${rank||'<p class="muted">Sem dúvidas.</p>'}</section>
      </div></div>`);
}

/* ---------- Alunos ---------- */
function renderAlunos(){
  const q=admBusca.trim().toLowerCase();
  const rows=adm.alunos.filter(a=>!q||(a.nome+' '+a.email).toLowerCase().includes(q)).map(a=>{
    const ms=Object.entries(a.mats), at=ms.filter(([,m])=>m.status==='ativo');
    return `<div class="ad-row r-aluno"><div class="person">${avatar(a.nome)}<div><b>${esc(a.nome)}</b><small>${esc(a.email)} · desde ${esc(a.cadastro)}</small></div></div>
      <div>${ms.length?ms.map(([cid,m])=>`<div class="mc"><span>${esc(cName(cid))}</span>${m.status==='aguardando'?chip('Aguardando liberação','amber'):bar(pctOf(cid,m.feitas))}</div>`).join(''):'<span class="muted">Sem matrícula</span>'}</div>
      <div>${at.map(([,m])=>chip(esc(m.pos),m.pos==='Concluído'?'green':'blue')).join(' ')||'<span class="muted">—</span>'}</div>
      <div class="muted">${at.map(([,m])=>esc(m.ultimo)).join('<br>')||'—'}</div></div>`;
  }).join('');
  put('av-alunos', adHead('Alunos',`${adm.alunos.length} cadastrados. Curso, progresso e a aula em que cada um está.`)+`
    <div class="ad-card flush"><div class="sec-h"><div class="search4">${ic('users',18)}<input id="admBusca" placeholder="Buscar por nome ou e-mail" value="${esc(admBusca)}"></div></div>
      <div class="ad-row r-aluno th"><span>Aluno</span><span>Cursos e progresso</span><span>Onde está</span><span>Último acesso</span></div>
      ${rows||'<p class="muted pad">Nenhum aluno encontrado.</p>'}</div>`);
}

/* ---------- Acessos (liberar entrada após conferir o pagamento) ---------- */
function renderAcessos(){
  const n=s=>adm.pedidos.filter(p=>p.status===s).length;
  const tabs=[['aguardando','Aguardando'],['liberado','Liberados'],['negado','Negados']].map(([k,t])=>`<button data-tab="${k}" aria-pressed="${admAcessoTab===k}">${t} <span>${n(k)}</span></button>`).join('');
  const lista=adm.pedidos.filter(p=>p.status===admAcessoTab).map(p=>`<div class="ad-card acc">
      <div class="person">${avatar(p.nome)}<div><b>${esc(p.nome)}</b><small>${esc(p.email)}</small></div></div>
      <div>${p.pacote?`<small class="muted">Pacote ${esc(p.pacote)}</small><br>`:''}${p.cursos.map(cid=>chip(esc(cName(cid)),'blue')).join(' ')}</div>
      <div class="acc-val"><b>${brl(p.valor)}</b><small>${esc(p.metodo)} · ${esc(p.data)}</small></div>
      ${p.status==='aguardando'
        ?`<div class="acts"><button class="btn btn-sm btn-anil" data-ad="liberar" data-id="${p.id}">${ic('check',16)} Liberar entrada</button><button class="btn btn-sm btn-line danger" data-ad="negar" data-id="${p.id}">Negar</button></div>`
        :chip(p.status==='liberado'?'Liberado':'Negado',p.status==='liberado'?'green':'red')}</div>`).join('');
  put('av-acessos', adHead('Acessos','O aluno paga e fica aguardando. Confira o valor na conta e libere a entrada: só então as aulas abrem.')+`
    <div class="seg4">${tabs}</div><div class="acc-list">${lista||'<div class="ad-card empty">Nada aqui por enquanto.</div>'}</div>`);
}
function decidirPedido(id, ok){
  const p=adm.pedidos.find(x=>x.id===id); if(!p) return;
  p.status = ok ? 'liberado' : 'negado';
  const a=ensureAluno(p.email,p.nome);
  p.cursos.forEach(cid=>{
    if(ok){ const ant=a.mats[cid]||{}; a.mats[cid]={status:'ativo',feitas:ant.feitas||0,pos:ant.feitas?ant.pos:'Ainda não começou',ultimo:'—'}; }
    else if(a.mats[cid] && a.mats[cid].status!=='ativo') delete a.mats[cid];
  });
  toast(ok ? 'Entrada liberada. O aluno já pode começar.' : 'Entrada negada. O aluno é avisado por e-mail.');
  renderAcessos();
}

/* ---------- Certificados: modelo + fila de aprovação ---------- */
function renderCertificados(){
  const ord={pendente:0,aprovado:1,negado:2};
  const lista=[...adm.certs].sort((a,b)=>ord[a.status]-ord[b.status]).map(k=>{
    const st=k.status==='pendente'?chip('Aguardando aprovação','amber'):k.status==='aprovado'?chip('Emitido','green'):chip('Negado','red');
    return `<div class="ad-card cert4"><div class="cert-mini">${certHTML(certData(k))}</div>
      <div class="cert-side"><div class="person">${avatar(k.nome)}<div><b>${esc(k.nome)}</b><small>${esc(k.email)}</small></div></div>${st}
        <small class="muted">${esc(cName(k.curso))}. Solicitado ${esc(k.data)}. Progresso conferido: 100%.</small>
        ${k.status==='pendente'?`<div class="acts"><button class="btn btn-sm btn-anil" data-ad="aprovar" data-id="${k.id}">${ic('check',16)} Aprovar emissão</button><button class="btn btn-sm btn-line danger" data-ad="negarCert" data-id="${k.id}">Negar</button></div>`:''}</div></div>`;
  }).join('');
  const sl=(k,lab)=>`<label class="sl"><span>${lab}</span><input type="range" min="5" max="95" value="${certTpl[k]}" data-tpl="${k}"></label>`;
  put('av-certificados', adHead('Certificados','O aluno pede ao concluir. Você aprova ou nega; ao aprovar, o certificado sai com o nome dele, as horas cumpridas e um código de validação.')+`
    <section class="ad-card tpl4">
      <div class="tpl-prev" id="tplPrev">${certHTML(sampleCert())}</div>
      <div class="tpl-ctl"><h2>Modelo do certificado</h2>
        <p class="muted">Envie a arte do certificado (imagem A4 deitada, PNG ou JPG) ou use o modelo padrão da marca. Os campos em destaque entram sozinhos para cada aluno.</p>
        <label class="drop sm">${ic('img',22)}<b>${certTpl.bg?'Trocar modelo':'Enviar modelo'}</b><small>1123 × 794 px ou maior, sem os dados do aluno</small><input type="file" accept="image/*" data-tpl-img></label>
        ${certTpl.bg?`<button class="btn btn-sm btn-line" data-ad="tplPadrao">Voltar ao modelo padrão</button>`:''}
        <div class="sl-g">${sl('nomeY','Nome do aluno')}${sl('cursoY','Curso')}${sl('horasY','Horas cumpridas')}${sl('rodapeY','Data e código')}</div>
        <div class="f4"><label>Cor do texto</label><div class="seg4">${[['#12161B','Escuro'],['#FFFFFF','Claro'],['#0B3B78','Azul']].map(([v,t])=>`<button data-ad="tplCor" data-v="${v}" aria-pressed="${certTpl.cor===v}">${t}</button>`).join('')}</div></div>
      </div>
    </section>
    <h2 class="ad-sub">Pedidos de certificado</h2>
    <div class="acc-list">${lista||'<div class="ad-card empty">Nenhum pedido de certificado.</div>'}</div>`);
}
function decidirCert(id, ok){
  const k=adm.certs.find(x=>x.id===id); if(!k) return;
  if(ok){ k.status='aprovado'; k.emitido=hoje(); k.codigo='CF-'+Math.random().toString(36).slice(2,10).toUpperCase(); toast('Certificado aprovado e emitido.'); }
  else { k.status='negado'; toast('Emissão negada.'); }
  renderCertificados();
}

/* ---------- Dúvidas ---------- */
function renderPerguntas(){
  const fil=`<button data-cf="" aria-pressed="${!admCurso}">Todos</button>`+courses.filter(c=>threads.some(t=>t.course===c.id)).map(c=>`<button data-cf="${c.id}" aria-pressed="${admCurso===c.id}">${esc(c.title)}</button>`).join('');
  const lst=threads.filter(t=>!admCurso||t.course===admCurso).sort((a,b)=>(a.status==='aberta'?0:1)-(b.status==='aberta'?0:1));
  const temas={}; lst.forEach(t=>{ temas[t.tema]=(temas[t.tema]||0)+1; });
  const rank=Object.entries(temas).sort((a,b)=>b[1]-a[1]).map(([tema,n],i)=>`<div class="rank-i"><span class="rk">${i+1}</span><div><b>${esc(tema)}</b></div><span class="chip">${n}</span></div>`).join('')||'<p class="muted">Sem perguntas.</p>';
  const cards=lst.map(t=>`<div class="ad-card q4"><div class="q4-h"><b>${esc(t.title)}</b>${t.status==='aberta'?chip('Aberta','amber'):t.status==='respondida'?chip('Respondida','blue'):chip('Resolvida','green')}</div>
      <small class="muted">${esc(cName(t.course))} · ${esc(t.lesson)} · tema: ${esc(t.tema)} · ${esc(t.when)}</small>
      <div class="bubs">${t.msgs.map(m=>`<div class="bub ${m.prof?'me':''}"><small>${m.prof?'Renan (professor)':esc(m.name)}</small>${esc(m.text)}</div>`).join('')}</div>
      ${t.status!=='resolvida'?`<textarea class="inp" id="rp-${t.id}" rows="2" placeholder="Escreva a resposta do professor"></textarea>
        <div class="acts"><button class="btn btn-sm btn-anil" data-ad="responder" data-id="${t.id}">Responder</button><button class="btn btn-sm btn-line" data-ad="resolver" data-id="${t.id}">Marcar como resolvida</button></div>`:''}</div>`).join('');
  put('av-perguntas', adHead('Dúvidas','Perguntas por curso e por aula. Os temas que mais se repetem pedem um trecho a mais na aula.')+`
    <div class="seg4">${fil}</div>
    <div class="ad-cols q-cols"><div class="acc-list">${cards||'<div class="ad-card empty">Nenhuma dúvida.</div>'}</div>
      <section class="ad-card"><div class="sec-h nopad"><h2>Temas mais perguntados</h2></div>${rank}</section></div>`);
}

/* ---------- Cursos (lista) ---------- */
function renderCursos(){
  const cards=courses.map(c=>{
    const s=stats(c), at=allMats().filter(x=>x.cid===c.id&&x.m.status==='ativo').length, armed=delArm===c.id;
    return `<article class="ad-card cc flushc">${coverHTML(c,'cc-cover',{k:'c'})}
      <div class="cc-b">${chip(esc(c.cat))}<h3>${esc(c.title)}</h3><p class="muted">${s.mods} módulos · ${s.aulas} aulas · ${fmtTotal(s.sec)}</p>
        <div class="cc-m"><b>${brl(c.price)}</b><span>${at} aluno${at===1?'':'s'} ativo${at===1?'':'s'}</span></div>
        <div class="cc-a"><button class="btn btn-sm btn-anil" data-ad="editar" data-id="${c.id}">${ic('edit',16)} Editar</button>
          <button class="btn btn-sm btn-line" data-ad="ver" data-id="${c.id}">${ic('eye',16)} Ver como aluno</button>
          <button class="icon-btn ${armed?'armed':''}" data-ad="excluir" data-id="${c.id}" aria-label="Excluir ${esc(c.title)}">${armed?'Confirmar':ic('trash',16)}</button></div></div></article>`;
  }).join('');
  const packs=PACKS.map(p=>`<div class="ad-row r-pack"><div class="person"><span class="ti-ic">${ic('box')}</span><div><b>${esc(p.title)}</b><small>${esc(p.cursos.map(cName).join(' + '))}</small></div></div><div><b>${brl(p.price)}</b> <small class="muted"><s>${brl(packFull(p))}</s></small></div></div>`).join('');
  put('av-cursos', adHead('Treinamentos','Cada treinamento tem módulos e aulas. O que você publicar aparece no catálogo e no destaque da página inicial.',`<button class="btn btn-anil" data-ad="novo">${ic('plus',18)} Novo treinamento</button>`)+`
    <div class="how4"><div><span class="hn">1</span><b>Sobre o curso</b><small>Nome, preço, capa e textos. A IA sugere os textos.</small></div>
      <div><span class="hn">2</span><b>Módulos e aulas</b><small>Envie o vídeo gravado no celular ou cole o link do YouTube. A duração é lida sozinha.</small></div>
      <div><span class="hn">3</span><b>Publicar</b><small>Revise o resumo e publique. O catálogo atualiza na hora.</small></div></div>
    <div class="cc-grid"><button class="cc-new" data-ad="novo"><span>${ic('plus',28)}</span><b>Novo treinamento</b><small>Comece pelo nome e pela capa</small></button>${cards}</div>
    <section class="ad-card flush" style="margin-top:22px"><div class="sec-h"><h2>Pacotes</h2><small class="muted">Combinações com desconto exibidas na página inicial</small></div>${packs}</section>`);
}

/* ---------- Editor de treinamento (3 etapas) ---------- */
const TYPES={video:['Vídeo','video'],texto:['Texto','text'],material:['Material','file'],teste:['Teste','quiz']};
const blankEd = () => ({isNew:true,id:'c'+Date.now().toString(36),title:'',cat:'Para você',teacher:'Renan Fernandes',price:'',img:'',short:'',paraQuem:'',instr:'',modules:[],step:1,ai:{}});
function openEditor(cid){
  const c=cid&&courseById(cid);
  ed = !c ? blankEd() : {isNew:false,id:c.id,title:c.title,cat:c.cat,teacher:c.teacher,price:c.price,img:c.img||'',short:c.short||'',paraQuem:c.paraQuem||'',instr:c.instr||'',step:1,ai:{},
    modules:modulesOf(c).map(m=>({title:m.title.replace(/^Módulo \d+:\s*/,''),lessons:m.lessons.map(l=>({t:l.t,type:l.type,d:l.type==='video'?(l.d||''):'',src:l.src||'',file:l.file||'',kind:l.kind||'',texto:l.texto||'',dst:l.d?'ok':''}))}))};
  go('adm-editor');
}
function edStats(){
  let aulas=0,sec=0,videos=0,semMidia=0;
  ed.modules.forEach(m=>m.lessons.forEach(l=>{
    if(l.type==='teste') return; aulas++;
    if(l.type==='video'){ videos++; sec+=parseDur(l.d); if(!l.src) semMidia++; }
    if(l.type==='texto') sec+=TEXT_SEC;
  }));
  return {aulas,sec,videos,semMidia};
}
const edChecks = () => [
  [!!ed.title.trim(),'Nome do treinamento'], [Number(ed.price)>0,'Preço'], [!!(ed.short.trim()&&ed.paraQuem.trim()),'Resumo e para quem é'],
  [ed.modules.length>=3,'Pelo menos 3 módulos'], [ed.modules.length>0&&ed.modules.every(m=>m.lessons.length),'Todo módulo com aula'],
  [ed.modules.every(m=>m.lessons.every(l=>l.t.trim())),'Toda aula com título']];
const checksHTML = (cls='') => `<ul class="checks ${cls}">${edChecks().map(([v,t])=>`<li class="${v?'ok':''}">${ic(v?'check':'x',cls?14:16)} ${t}</li>`).join('')}</ul>`;
function aiField(key,label,hint,rows){
  return `<div class="f4"><div class="f4-l"><label for="ek-${key}">${label}</label>
      <button class="ai-btn" data-ed="ai" data-k="${key}" ${ed.ai[key]?'disabled':''}>${ic('spark',15)} ${ed.ai[key]?'Gerando…':'Sugerir com IA'}</button></div>
    <small class="hint">${hint}</small><textarea class="inp" id="ek-${key}" data-ek="${key}" rows="${rows}">${esc(ed[key])}</textarea></div>`;
}
function lessonMedia(l,mi,li){
  const ref=`${mi}:${li}`;
  if(l.type==='video'){
    if(!l.src) return `<div class="media-opts">
      <label class="drop sm">${ic('phone',22)}<b>Enviar vídeo do celular</b><small>MP4 ou MOV, direto da galeria</small><input type="file" accept="video/*" data-lf="${ref}"></label>
      <div class="yt-in">${ic('link',18)}<input class="inp" data-yt="${ref}" placeholder="ou cole o link do YouTube"></div></div>`;
    const yt=l.kind==='yt';
    const dur = l.dst==='busy' ? '<span class="muted">lendo duração…</span>' : l.d ? `<b>${esc(l.d)}</b> <span class="muted">${l.dst==='manual'?'informada':'detectada'}</span>` : '<span class="muted">duração não lida</span>';
    return `<div class="media-ok">${ic(yt?'link':'phone',18)}<div class="mo-t"><b>${yt?'YouTube (toca dentro do site)':'Vídeo enviado'}</b><small>${esc(yt?'youtu.be/'+ytId(l.src):l.file)}</small></div>
        <div class="mo-d">${dur}</div><button class="icon-btn" data-ed="lclear" data-m="${mi}" data-l="${li}" aria-label="Trocar vídeo">${ic('x',16)}</button></div>
      ${l.dst==='manual'?`<div class="manual"><small>A pré-visualização do Claude bloqueia o YouTube, então a duração não foi lida aqui. No site publicado ela é lida sozinha. Para testar, informe:</small><input class="inp sm" data-ld="${ref}" value="${esc(l.d)}" placeholder="ex.: 8:40"></div>`:''}`;
  }
  if(l.type==='texto') return `<textarea class="inp" data-lx="${ref}" rows="3" placeholder="Texto da aula (conta como 4 min de leitura)">${esc(l.texto)}</textarea>`;
  if(l.type==='material') return l.src
    ? `<div class="media-ok">${ic('file',18)}<div class="mo-t"><b>${esc(l.file||'Link do material')}</b><small>${l.file?'Arquivo anexado':esc(l.src)}</small></div><button class="icon-btn" data-ed="lclear" data-m="${mi}" data-l="${li}" aria-label="Trocar material">${ic('x',16)}</button></div>`
    : `<div class="media-opts"><label class="drop sm">${ic('file',22)}<b>Enviar arquivo</b><small>PDF, DOC, PPT ou ZIP</small><input type="file" accept=".pdf,.doc,.docx,.ppt,.pptx,.zip" data-lf="${ref}"></label>
       <div class="yt-in">${ic('link',18)}<input class="inp" data-ll="${ref}" placeholder="ou cole um link"></div></div>`;
  return `<small class="muted">Teste de múltipla escolha. As questões são cadastradas depois de publicar.</small>`;
}
function renderEditor(){
  const s=edStats(), ok=edChecks().every(c=>c[0]);
  const steps=[[1,'Sobre o curso'],[2,'Módulos e aulas'],[3,'Revisar e publicar']].map(([n,t])=>`<button data-ed="step" data-s="${n}" ${ed.step===n?'aria-current="step"':''}><span class="n">${n}</span>${t}</button>`).join('');
  let body;
  if(ed.step===1) body=`<div class="ad-card fset">
      <div class="f4"><label for="ek-title">Nome do treinamento</label><input class="inp lg" id="ek-title" data-ek="title" value="${esc(ed.title)}" placeholder="Ex.: Lombar travada: alívio em casa"></div>
      <div class="f2"><div class="f4"><label>Formação</label><div class="seg4">${['Para você','Para terapeutas'].map(v=>`<button data-ed="cat" data-v="${v}" aria-pressed="${ed.cat===v}">${v}</button>`).join('')}</div></div>
        <div class="f4"><label for="ek-price">Preço</label><div class="money-in"><span>R$</span><input class="inp" id="ek-price" data-ek="price" type="number" min="0" step="1" value="${esc(ed.price)}" placeholder="0"></div></div></div>
      <div class="f4"><label for="ek-teacher">Professor</label><input class="inp" id="ek-teacher" data-ek="teacher" value="${esc(ed.teacher)}"></div>
      <div class="f4"><label>Capa</label>${ed.img
        ?`<div class="cover-prev"><img src="${ed.img}" alt=""><button class="btn btn-sm btn-line" data-ed="imgclear">Trocar imagem</button></div>`
        :`<label class="drop">${ic('img',26)}<b>Enviar imagem de capa</b><small>Foto horizontal, de preferência 1600 × 1000. Sem imagem, usamos a ilustração da marca.</small><input type="file" accept="image/*" data-img></label>`}</div></div>
    <div class="ai-note">${ic('spark',22)}<div><b>Textos com ajuda de IA</b><small>No site publicado, “Sugerir com IA” chama um modelo de IA gratuito (por exemplo, Gemini ou Llama pelo plano gratuito do Groq) com o nome, a formação e os módulos do curso. Você revisa antes de publicar. Neste protótipo, a sugestão é simulada.</small></div></div>
    <div class="ad-card fset">${aiField('short','Resumo','Aparece no catálogo e no destaque da página inicial. Uma ou duas frases.',2)}
      ${aiField('paraQuem','Para quem é o curso','Quem vai aproveitar mais. Ajuda o aluno a decidir.',2)}
      ${aiField('instr','Instruções para o aluno','Como assistir, cuidados e o que ter em mãos.',3)}</div>
    <div class="ed-nav"><span></span><button class="btn btn-anil" data-ed="step" data-s="2">Continuar para módulos ${ic('arrow',18)}</button></div>`;
  else if(ed.step===2) body=`<div class="tip">${ic('chart',18)}<span>Cada módulo vira um eixo da teia de competências do aluno. Use no mínimo 3.</span></div>
    ${ed.modules.map((m,mi)=>`<div class="m4">
      <div class="m4-h"><span class="m4-n">${mi+1}</span><input data-mt="${mi}" value="${esc(m.title)}" placeholder="Nome do módulo ${mi+1}" aria-label="Nome do módulo ${mi+1}">
        <span class="m4-c">${m.lessons.length} aula${m.lessons.length===1?'':'s'}</span>
        <button class="icon-btn" data-ed="mup" data-m="${mi}" ${mi===0?'disabled':''} aria-label="Subir módulo">${ic('up',16)}</button>
        <button class="icon-btn" data-ed="mdown" data-m="${mi}" ${mi===ed.modules.length-1?'disabled':''} aria-label="Descer módulo">${ic('down',16)}</button>
        <button class="icon-btn danger" data-ed="mdel" data-m="${mi}" aria-label="Remover módulo">${ic('trash',16)}</button></div>
      ${m.lessons.map((l,li)=>`<div class="l4"><span class="ty ty-${l.type}">${ic(TYPES[l.type][1],18)}</span>
        <div class="l4-b"><input class="inp sm" data-lt="${mi}:${li}" value="${esc(l.t)}" placeholder="Título da aula (${TYPES[l.type][0].toLowerCase()})">${lessonMedia(l,mi,li)}</div>
        <div class="l4-a"><button class="icon-btn" data-ed="lup" data-m="${mi}" data-l="${li}" ${li===0?'disabled':''} aria-label="Subir aula">${ic('up',15)}</button>
          <button class="icon-btn" data-ed="ldown" data-m="${mi}" data-l="${li}" ${li===m.lessons.length-1?'disabled':''} aria-label="Descer aula">${ic('down',15)}</button>
          <button class="icon-btn danger" data-ed="ldel" data-m="${mi}" data-l="${li}" aria-label="Remover aula">${ic('x',15)}</button></div></div>`).join('')}
      <div class="addbar"><span class="muted">Adicionar:</span>${Object.entries(TYPES).map(([k,[t,icn]])=>`<button class="add-ty" data-ed="ladd" data-m="${mi}" data-t="${k}">${ic(icn,16)} ${t}</button>`).join('')}</div></div>`).join('')
      || '<div class="ad-card empty">Nenhum módulo ainda. Comece pelo primeiro.</div>'}
    <button class="add-mod" data-ed="madd">${ic('plus',20)} Adicionar módulo</button>
    <div class="ed-nav"><button class="btn btn-line" data-ed="step" data-s="1">Voltar</button><button class="btn btn-anil" data-ed="step" data-s="3">Revisar ${ic('arrow',18)}</button></div>`;
  else body=`<div class="ad-card">
      <div class="sumgrid"><div><b>${ed.modules.length}</b><small>módulos</small></div><div><b>${s.aulas}</b><small>aulas</small></div><div><b>${s.videos}</b><small>vídeos</small></div><div><b>${fmtTotal(s.sec)}</b><small>de conteúdo</small></div></div>
      <small class="muted">A duração total é a soma dos vídeos. Você não precisa informar horas.</small>
      ${checksHTML()}${s.semMidia?`<ul class="checks"><li class="warn">${ic('video',16)} ${s.semMidia} vídeo${s.semMidia>1?'s':''} sem arquivo ou link (aparece como “em breve”)</li></ul>`:''}</div>
    <div class="ed-nav"><button class="btn btn-line" data-ed="step" data-s="2">Voltar</button><button class="btn btn-oleo" data-ed="publish" ${ok?'':'disabled'}>${ic('check',18)} ${ed.isNew?'Publicar no catálogo':'Salvar alterações'}</button></div>`;
  const prev={id:ed.id,title:ed.title||'Nome do treinamento',img:ed.img};
  put('av-editor', `<div class="ad-top"><div><button class="lnk back" data-go="adm-cursos">← Treinamentos</button><h1>${ed.isNew?'Novo treinamento':'Editar treinamento'}</h1></div></div>
    <nav class="stepper" aria-label="Etapas">${steps}</nav>
    <div class="ed4"><div class="ed4-main">${body}</div>
      <aside class="pv4"><small class="muted">Como o aluno vai ver</small>
        <div class="ad-card flushc">${coverHTML(prev,'cc-cover',{k:'p'})}
          <div class="cc-b">${chip(esc(ed.cat))}<h3 id="pvT">${esc(prev.title)}</h3><p class="muted" id="pvS">${esc(ed.short||'O resumo aparece aqui.')}</p>
            <p class="muted" style="font-size:13px">${ed.modules.length} módulos · ${s.aulas} aulas · ${fmtTotal(s.sec)}</p>
            <div class="cc-m"><b id="pvP">${Number(ed.price)>0?brl(ed.price):'R$ —'}</b></div></div></div>
        <div id="pvC">${checksHTML('sm')}</div></aside></div>`);
}
function refreshPreview(){ // atualiza a prévia sem redesenhar o formulário (mantém o foco)
  if(!$('pvT')) return;
  $('pvT').textContent=ed.title||'Nome do treinamento';
  $('pvS').textContent=ed.short||'O resumo aparece aqui.';
  $('pvP').textContent=Number(ed.price)>0?brl(ed.price):'R$ —';
  $('pvC').innerHTML=checksHTML('sm');
}
function aiSuggest(key){ // no produto: POST /api/ia/sugerir → modelo gratuito (Gemini/Groq) no servidor
  const t=ed.title.trim()||'este curso', tema=t.split(':')[0].toLowerCase(), terap=ed.cat==='Para terapeutas';
  const mods=ed.modules.map(m=>m.title.trim()).filter(Boolean);
  const txt={
    short: (mods.length?`${t} em ${mods.length} módulos: ${mods.slice(0,3).join(', ').toLowerCase()}${mods.length>3?' e mais':''}.`:`${t} em aulas curtas.`)+' Demonstração comentada e câmera no detalhe das mãos.',
    paraQuem: terap ? `Para massoterapeutas, estudantes e profissionais da saúde que querem incluir ${tema} no atendimento com mais segurança.`
                    : `Para quem quer aprender ${tema} em casa, sem experiência prévia, com exercícios seguros para o dia a dia.`,
    instr: `Assista às aulas na ordem dos módulos e faça o diagnóstico de entrada antes de começar. Tenha uma toalha${terap?' e uma maca ou colchonete':' e um colchonete'} por perto. Pare qualquer movimento que cause dor aguda e procure um profissional de saúde se ela persistir.`
  }[key];
  ed.ai[key]=true; renderEditor();
  setTimeout(()=>{ ed[key]=txt; ed.ai[key]=false; renderEditor(); toast('Sugestão gerada. Revise antes de publicar.'); },900);
}
function publishEd(){
  if(!edChecks().every(c=>c[0])) return toast('Complete os itens da lista antes de publicar.');
  const modules=ed.modules.map((m,i)=>({title:`Módulo ${i+1}: ${m.title.trim()||'Sem nome'}`,lessons:m.lessons.map(l=>({
    t:l.t.trim(), type:l.type, d:l.type==='video'?(l.d||''):{texto:'Leitura',teste:'Teste',material:'Material'}[l.type], src:l.src||'', file:l.file||'', kind:l.kind||'', texto:l.texto||''}))}));
  const base={title:ed.title.trim(),cat:ed.cat,teacher:ed.teacher,price:Number(ed.price)||0,img:ed.img,short:ed.short,paraQuem:ed.paraQuem,instr:ed.instr,modules};
  const c=courseById(ed.id);
  if(c){ Object.assign(c,base); delete c._mods; }
  else { const axes=modules.slice(0,6).map(m=>m.title.replace(/^Módulo \d+:\s*/,'')); courses.push({id:ed.id,rating:0,students:0,axes,before:axes.map(()=>0),after:axes.map(()=>0),...base}); }
  const novo=ed.isNew; ed=null;
  refreshStudentViews(); toast(novo?'Treinamento publicado no catálogo.':'Alterações salvas.'); go('adm-cursos');
}

/* ---------- duração automática ----------
   Arquivo: lida dos metadados no navegador (no produto, confirmada pelo ffprobe na conversão).
   YouTube: no produto, YouTube Data API v3 (contentDetails.duration) pelo servidor.
   Aqui o protótipo tenta ler pelo player embutido; se o ambiente bloquear, pede a duração. */
function readFileDuration(url,cb){
  const v=document.createElement('video'); let done=false;
  const fin=d=>{ if(done) return; done=true; cb(d); v.removeAttribute('src'); };
  v.preload='metadata'; v.muted=true; v.onloadedmetadata=()=>fin(isFinite(v.duration)?v.duration:null); v.onerror=()=>fin(null);
  setTimeout(()=>fin(null),8000); v.src=url;
}
function readYtDuration(id,cb){
  const f=document.createElement('iframe'); let done=false, tick;
  f.style.cssText='position:fixed;left:-9999px;top:0;width:320px;height:180px;border:0';
  f.src=`https://www.youtube-nocookie.com/embed/${id}?enablejsapi=1&mute=1`;
  const on=e=>{ if(!/youtube/.test(e.origin)) return; try{ const d=JSON.parse(e.data); if(d.info&&d.info.duration>0) fin(d.info.duration); }catch(_){} };
  const fin=d=>{ if(done) return; done=true; clearInterval(tick); removeEventListener('message',on); f.remove(); cb(d); };
  addEventListener('message',on); document.body.appendChild(f);
  f.onload=()=>{ tick=setInterval(()=>{ try{ f.contentWindow.postMessage(JSON.stringify({event:'listening',id:1,channel:'widget'}),'*'); }catch(_){} },400); };
  setTimeout(()=>fin(null),6000);
}

/* ---------- eventos da administração ---------- */
document.addEventListener('click', e=>{
  const tab=e.target.closest('[data-tab]'), cf=e.target.closest('[data-cf]'), ad=e.target.closest('[data-ad]'), edb=e.target.closest('[data-ed]');
  if(tab){ admAcessoTab=tab.dataset.tab; return renderAcessos(); }
  if(cf){ admCurso=cf.dataset.cf; return renderPerguntas(); }
  if(ad){
    const id=ad.dataset.id, a=ad.dataset.ad;
    if(a!=='excluir') delArm=null;
    if(a==='liberar') decidirPedido(id,true);
    if(a==='negar') decidirPedido(id,false);
    if(a==='aprovar') decidirCert(id,true);
    if(a==='negarCert') decidirCert(id,false);
    if(a==='tplPadrao'){ certTpl.bg=''; renderCertificados(); }
    if(a==='tplCor'){ certTpl.cor=ad.dataset.v; renderCertificados(); }
    if(a==='responder'){
      const t=threads.find(x=>x.id===+id), txt=($('rp-'+id)||{}).value||'';
      if(!txt.trim()) return toast('Escreva a resposta antes de enviar.');
      t.msgs.push({prof:true,name:'',text:txt.trim()}); t.status='respondida'; toast('Resposta enviada ao aluno por e-mail.'); renderPerguntas();
    }
    if(a==='resolver'){ threads.find(x=>x.id===+id).status='resolvida'; renderPerguntas(); }
    if(a==='novo') openEditor(null);
    if(a==='editar') openEditor(id);
    if(a==='ver'){ state.preview=true; selectCourse(id); state.lessonRef=null; go('curso'); }
    if(a==='excluir'){ // confirmação na própria tela (o navegador do Claude bloqueia confirm())
      if(delArm!==id){ delArm=id; return renderCursos(); }
      courses.splice(courses.findIndex(c=>c.id===id),1); delArm=null;
      refreshStudentViews(); toast('Treinamento excluído.'); renderCursos();
    }
    return;
  }
  if(edb && ed){
    const a=edb.dataset.ed, mi=+edb.dataset.m, li=+edb.dataset.l, Ls=ed.modules[mi]&&ed.modules[mi].lessons;
    const swap=(arr,i,j)=>{ if(j>=0&&j<arr.length) [arr[i],arr[j]]=[arr[j],arr[i]]; };
    if(a==='step'){ ed.step=+edb.dataset.s; renderEditor(); return scrollTo({top:0}); }
    if(a==='ai') return aiSuggest(edb.dataset.k);
    if(a==='publish') return publishEd();
    if(a==='cat') ed.cat=edb.dataset.v;
    if(a==='imgclear') ed.img='';
    if(a==='madd') ed.modules.push({title:'',lessons:[]});
    if(a==='mup') swap(ed.modules,mi,mi-1);
    if(a==='mdown') swap(ed.modules,mi,mi+1);
    if(a==='mdel') ed.modules.splice(mi,1);
    if(a==='ladd') Ls.push({t:'',type:edb.dataset.t,d:'',src:'',file:'',kind:'',texto:'',dst:''});
    if(a==='lup') swap(Ls,li,li-1);
    if(a==='ldown') swap(Ls,li,li+1);
    if(a==='ldel') Ls.splice(li,1);
    if(a==='lclear') Object.assign(Ls[li],{src:'',file:'',kind:'',d:'',dst:''});
    renderEditor();
  }
});
const lref = (t,k) => { const [mi,li]=t.dataset[k].split(':').map(Number); return ed.modules[mi].lessons[li]; };
document.addEventListener('input', e=>{
  const t=e.target;
  if(t.id==='admBusca'){ admBusca=t.value; renderAlunos(); const el=$('admBusca'); el.focus(); el.setSelectionRange(el.value.length,el.value.length); return; }
  if(t.dataset.tpl){ certTpl[t.dataset.tpl]=+t.value; $('tplPrev').innerHTML=certHTML(sampleCert()); return; }
  if(!ed) return;
  if(t.dataset.ek){ ed[t.dataset.ek]=t.value; return refreshPreview(); }
  if(t.dataset.mt!==undefined){ ed.modules[+t.dataset.mt].title=t.value; return refreshPreview(); }
  if(t.dataset.lt){ lref(t,'lt').t=t.value; return refreshPreview(); }
  if(t.dataset.ld){ const l=lref(t,'ld'); l.d=t.value; l.dst='manual'; return; }
  if(t.dataset.lx){ lref(t,'lx').texto=t.value; }
});
document.addEventListener('change', e=>{
  const t=e.target;
  if(t.dataset.tplImg!==undefined && t.files[0]){ const r=new FileReader(); r.onload=()=>{ certTpl.bg=r.result; renderCertificados(); }; r.readAsDataURL(t.files[0]); return; }
  if(!ed) return;
  if(t.dataset.img!==undefined && t.files[0]){ const r=new FileReader(); r.onload=()=>{ ed.img=r.result; renderEditor(); }; r.readAsDataURL(t.files[0]); return; }
  if(t.dataset.yt){
    const l=lref(t,'yt'), id=ytId(t.value);
    if(!id) return toast('Link do YouTube não reconhecido. Copie o endereço do vídeo.');
    Object.assign(l,{src:'https://youtu.be/'+id,kind:'yt',file:'',d:'',dst:'busy'}); if(!l.t.trim()) l.t='Aula em vídeo';
    renderEditor();
    readYtDuration(id,d=>{ if(d){ l.d=fmtClock(d); l.dst='ok'; } else l.dst='manual'; if(ed) renderEditor(); });
  }
  if(t.dataset.ll){ Object.assign(lref(t,'ll'),{src:t.value.trim(),file:'',kind:'link'}); renderEditor(); }
  if(t.dataset.lf && t.files[0]){
    const l=lref(t,'lf'), f=t.files[0]; // no produto: upload retomável para o storage privado + conversão HLS
    Object.assign(l,{file:`${f.name} · ${(f.size/1048576).toFixed(0)} MB`,src:URL.createObjectURL(f),kind:'file'});
    if(!l.t.trim()) l.t=f.name.replace(/\.[^.]+$/,'').replace(/[_-]+/g,' ');
    if(l.type!=='video') return renderEditor();
    l.dst='busy'; renderEditor();
    readFileDuration(l.src,d=>{ if(d){ l.d=fmtClock(d); l.dst='ok'; } else l.dst='manual'; if(ed) renderEditor(); });
  }
});
