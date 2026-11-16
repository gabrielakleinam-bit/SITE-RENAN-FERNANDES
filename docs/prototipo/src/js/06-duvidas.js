/* =====================================================================
   06 · DÚVIDAS DO ALUNO (conversa com o professor, por aula)
   ===================================================================== */

function renderThreads(){
  const c=cur(), list=threads.filter(t=>t.course===c.id);
  if(!list.some(t=>t.id===state.thread) && list[0]) state.thread=list[0].id;
  $('threadList').innerHTML=list.map(t=>`
    <button class="thread-btn" data-thread="${t.id}" aria-current="${t.id===state.thread}">
      <strong>${esc(t.title)}</strong><span class="ctx"><span class="status ${t.status}">${t.status}</span>${esc(t.lesson)}, ${esc(t.when)}</span>
    </button>`).join('') || '<p class="muted">Nenhuma dúvida neste curso ainda.</p>';
  const t=threads.find(x=>x.id===state.thread && x.course===c.id);
  $('convo').innerHTML = !t ? `<h2>${esc(c.title)}</h2><p class="ctx">Escreva a primeira dúvida sobre este curso.</p>${composer(false)}` : `
    <h2>${esc(t.title)}</h2><p class="ctx">${esc(c.title)}, ${esc(t.lesson)}</p>
    ${t.msgs.map(m=>{ const name=m.prof?c.teacher:m.name; return `
      <div class="msg ${m.prof?'prof':''}"><div class="pic">${initials(name)}</div>
        <div><div class="name"><b>${esc(name)}</b>${m.prof?', professor':''}</div><div class="bubble">${esc(m.text)}</div></div></div>`; }).join('')}
    ${composer(t.status==='respondida')}`;
}
function composer(canResolve){
  return `<div class="composer">
    <label for="reply" style="color:var(--carvao);font-weight:700">Escrever</label>
    <textarea id="reply" placeholder="Escreva sua dúvida ou complemente a conversa"></textarea>
    <div class="row2"><label><input type="checkbox" id="priv"> Só eu e o professor vemos</label><button class="btn btn-anil" id="send">Enviar</button></div>
    ${canResolve?'<button class="btn btn-quiet" id="resolve">Marcar como resolvida</button>':''}</div>`;
}
$('threadList').addEventListener('click', e=>{
  const b=e.target.closest('[data-thread]'); if(!b) return;
  state.thread=+b.dataset.thread; renderThreads();
  if(innerWidth<900) $('convo').scrollIntoView({behavior:'smooth'});
});
$('convo').addEventListener('click', e=>{
  let t=threads.find(x=>x.id===state.thread && x.course===state.course);
  if(e.target.closest('#send')){
    const v=$('reply').value.trim();
    if(!v) return toast('Escreva a dúvida antes de enviar.');
    if(!t){ t={id:Date.now(),course:state.course,tema:'Geral',lesson:'Geral',title:v.slice(0,80),status:'aberta',when:'agora',msgs:[]}; threads.push(t); state.thread=t.id; }
    t.msgs.push({prof:false,name:state.nome||'Você',text:v}); t.status='aberta'; t.when='agora';
    renderThreads(); toast('Dúvida enviada. O professor recebe um aviso por e-mail.');
  }
  if(e.target.closest('#resolve')){ t.status='resolvida'; renderThreads(); toast('Dúvida marcada como resolvida.'); }
});
