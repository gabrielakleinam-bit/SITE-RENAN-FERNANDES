/* =====================================================================
   05 · TEIA: diagnóstico com recomendação e evolução por curso
   ===================================================================== */

let dq={i:0, a:{}};
const dqList = () => DQ.filter(q=>!q.only || dq.a.perfil===q.only);

function renderTeia(){
  renderDiag();
  const has=state.owned.size>0;
  $('evo').hidden=!has;
  if(!has) return;
  if(!state.owned.has(state.course)) state.course=[...state.owned][0];
  const c=cur(), ser=[];
  $('tTitle').textContent='Sua teia em '+c.title;
  if(state.view!=='depois') ser.push({values:c.before,color:'#E9A25F'});
  if(state.view!=='antes') ser.push({values:c.after,color:'#4FA3F0'});
  $('bigWeb').innerHTML=radar(c.axes,ser,{w:440,h:400,labels:true,dots:true,stroke:3,animate:true,aria:'Teia de competências antes e depois'});
  const avg=a=>Math.round(a.reduce((x,y)=>x+y,0)/a.length);
  $('tAvg').textContent=`Média foi de ${avg(c.before)} para ${avg(c.after)} pontos.`;
  $('axisList').innerHTML=c.axes.map((a,i)=>`<div class="axis-row"><span>${esc(a)}</span><span class="delta">+${c.after[i]-c.before[i]}</span>
    <div class="bars"><span class="d" style="width:${c.after[i]}%"></span><span class="a" style="width:${c.before[i]}%"></span></div></div>`).join('');
}
document.querySelectorAll('[data-view]').forEach(b=>b.addEventListener('click',()=>{
  state.view=b.dataset.view;
  document.querySelectorAll('[data-view]').forEach(x=>x.setAttribute('aria-pressed',x===b));
  renderTeia();
}));
$('redo').onclick=()=>toast('Diagnóstico de saída: 2 questões por competência, cerca de 5 minutos.');

/* ---------- questionário ---------- */
function renderDiag(){
  if(state.diag) return renderDiagResult();
  const list=dqList(), q=list[dq.i], val=dq.a[q.k]||(q.multi?[]:'');
  $('diag').innerHTML=`<div class="dq">
    <div class="dq-top"><small>Diagnóstico gratuito · pergunta ${dq.i+1} de ${list.length}</small><div class="dq-bar"><b style="width:${Math.round(dq.i/list.length*100)}%"></b></div></div>
    <h2>${esc(q.q)}</h2>${q.sub?`<p class="muted">${esc(q.sub)}</p>`:''}
    <div class="dq-opts">${q.opts.map(([v,t])=>{ const on=q.multi?val.includes(v):val===v;
      return `<button class="dq-o" data-dq="${v}" aria-pressed="${on}"><span class="dq-c">${on?'✓':''}</span>${esc(t)}</button>`; }).join('')}</div>
    <div class="dq-nav"><button class="btn btn-quiet" data-dqnav="back" ${dq.i===0?'disabled':''}>Voltar</button>
      ${q.multi?`<button class="btn btn-anil" data-dqnav="next" ${val.length?'':'disabled'}>${dq.i===list.length-1?'Ver resultado':'Continuar'}</button>`:''}</div></div>`;
}
function nextQ(){
  if(dq.i<dqList().length-1){ dq.i++; renderDiag(); return; }
  state.diag=scoreDiag(dq.a); renderDiag(); $('diag').scrollIntoView({behavior:'smooth',block:'start'});
}
$('diag').addEventListener('click', e=>{
  const o=e.target.closest('[data-dq]'), n=e.target.closest('[data-dqnav]'), r=e.target.closest('[data-car]');
  if(o){
    const q=dqList()[dq.i], v=o.dataset.dq;
    if(!q.multi){ dq.a[q.k]=v; return nextQ(); }
    let sel=dq.a[q.k]||[];
    sel = v==='nenhum' ? ['nenhum'] : (sel=sel.filter(x=>x!=='nenhum'), sel.includes(v)?sel.filter(x=>x!==v):[...sel,v]);
    dq.a[q.k]=sel; renderDiag();
  }
  if(n){
    if(n.dataset.dqnav==='back'){ dq.i=Math.max(0,dq.i-1); renderDiag(); }
    if(n.dataset.dqnav==='next') nextQ();
    if(n.dataset.dqnav==='redo'){ state.diag=null; dq={i:0,a:{}}; renderDiag(); }
  }
  if(r){ selectCourse(r.dataset.car); go('curso'); }
});

/* ---------- pontuação ----------
   Cada resposta soma pontos aos cursos ligados a ela e guarda o motivo.
   Os 3 maiores viram a recomendação. Pesos configuráveis no produto. */
function scoreDiag(a){
  const sc={}, why={}; courses.forEach(c=>{ sc[c.id]=0; why[c.id]=[]; });
  const add=(id,n,r)=>{ if(sc[id]===undefined) return; sc[id]+=n; if(r && !why[id].includes(r)) why[id].push(r); };
  const reg=a.regiao||[], ter=a.perfil==='terapeuta', intens={dia:3,semana:2}[a.freq]||1;
  if(reg.includes('lombar'))    add('lombar',3+intens,'você marcou a lombar');
  if(reg.includes('pescoco'))   add('pescoco',3+intens,'você marcou pescoço e ombros');
  if(reg.includes('mandibula')) add('bruxismo',3+intens,'você marcou a mandíbula');
  if(reg.includes('pes'))       add('pes',ter?4:2,'você marcou pés e panturrilhas');
  if(reg.includes('treino'))    add('recuperacao',ter?4:2,'você sente os músculos depois do treino');
  if(a.rotina==='sentado'){ add('lombar',2,'passa muitas horas sentado'); add('pescoco',2,'passa muitas horas sentado'); }
  if(a.rotina==='empe'){ add('pes',2,'fica muitas horas em pé'); add('lombar',1); }
  if(a.rotina==='treino') add('recuperacao',2,'treina com frequência');
  (a.foco||[]).forEach(f=>{
    if(f==='recuperacao') add('recuperacao',5,'quer atender recuperação muscular');
    if(f==='ventosa') add('ventosa',5,'quer incluir ventosaterapia');
    if(f==='pes') add('pes',5,'quer atender pés e panturrilhas');
    if(f==='autocuidado') ['lombar','pescoco','bruxismo'].forEach(id=>add(id,2,'quer orientar autocuidado aos clientes'));
  });
  courses.forEach(c=>{ sc[c.id] += c.cat==='Para terapeutas' ? (ter?2:-4) : (ter?0:2); });
  const k={pouco:25,basico:50,bastante:75}[a.conhece]||40;
  return {
    ranked: courses.map(c=>({c,s:sc[c.id],why:why[c.id]})).filter(x=>x.s>0).sort((x,y)=>y.s-x.s),
    axes: ['Conhecimento do corpo','Autocuidado','Postura','Alívio de tensão','Prevenção','Técnica manual'],
    vals: [k, Math.max(15,k-10+(ter?10:0)), {sentado:30,empe:40,treino:55,variada:60}[a.rotina]||45,
           {dia:20,semana:40,rara:70}[a.freq]||50, Math.max(20,75-reg.filter(r=>r!=='nenhum').length*12), ter?Math.min(80,k+5):Math.max(15,k-15)]
  };
}
function bestPack(ids){
  let best=null, bs=1;
  PACKS.forEach(p=>{ const n=p.cursos.filter(id=>ids.includes(id)).length; if(n>bs){ bs=n; best=p; } });
  return best;
}
function renderDiagResult(){
  const r=state.diag, top=r.ranked.slice(0,3), pk=bestPack(top.map(x=>x.c.id));
  $('diag').innerHTML=`<div class="dq dq-res"><div class="dq-res-g">
    <div class="webpanel">${radar(r.axes,[{values:r.vals,color:'#E9A25F'}],{w:420,h:380,labels:true,dots:true,stroke:3,pad:84,fs:12,aria:'Sua teia de competências hoje'})}
      <div class="legend"><span><i style="background:var(--lavanda)"></i>Você hoje</span></div></div>
    <div><small class="muted">Resultado do diagnóstico</small><h2>Indicados para você</h2>
      <p class="muted">A teia mostra onde você está hoje. Os treinamentos abaixo são os que mais combinam com as suas respostas.</p>
      <div class="rec">${top.map((x,i)=>`<button class="rec-i" data-car="${x.c.id}">${coverHTML(x.c,'rec-c',{k:'r',center:true})}
        <div><small>${i===0?'Mais indicado':'Também indicado'}</small><b>${esc(x.c.title)}</b>
        <span>${x.why.length?'Porque '+esc(x.why.slice(0,2).join(' e ')):esc(x.c.short||'')}</span>
        <em>${stats(x.c).aulas} aulas · ${durLabel(x.c)} · ${brl(x.c.price)}</em></div></button>`).join('') || '<p class="muted">Veja o catálogo completo na página inicial.</p>'}</div>
      ${pk?`<div class="rec-pack"><div><small>Economize no pacote</small><b>${esc(pk.title)}</b><span>${pk.cursos.length} cursos por ${brl(pk.price)} <s>${brl(packFull(pk))}</s></span></div><button class="btn btn-anil" data-pack="${pk.id}">Quero o pacote</button></div>`:''}
      <button class="btn btn-quiet" data-dqnav="redo">Refazer o diagnóstico</button></div></div></div>`;
}
