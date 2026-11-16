/* =====================================================================
   07 · CERTIFICADO
   O admin envia um modelo (imagem A4 deitada) ou usa o modelo padrão da marca.
   Sobre o modelo entram os campos: nome do aluno, curso, horas cumpridas,
   data e código de validação. Posição e cor são ajustáveis.
   No produto, o PDF é gerado no servidor com o mesmo layout (ver HANDOFF.md).
   ===================================================================== */

/* modelo padrão: moldura, logo, título e assinatura (sem os campos variáveis) */
function certDefaultBg(){
  return `<svg viewBox="0 0 1123 794" preserveAspectRatio="none" style="position:absolute;inset:0;width:100%;height:100%" aria-hidden="true">
    <rect width="1123" height="794" fill="#FFFFFF"/>
    <rect x="28" y="28" width="1067" height="738" fill="none" stroke="#13171C" stroke-width="3"/>
    <rect x="42" y="42" width="1039" height="710" fill="none" stroke="#4FA3F0" stroke-width="1.5"/>
    <path d="M42 690 C300 630 560 740 1081 650 L1081 752 L42 752 Z" fill="#EAF3FE"/>
    <path d="M42 715 C320 660 600 760 1081 680" fill="none" stroke="#4FA3F0" stroke-width="3" opacity=".7"/>
    <image href="${ASSETS.logoCor}" x="471" y="62" width="181" height="106"/>
    <text x="561.5" y="226" text-anchor="middle" font-family="Bricolage Grotesque, sans-serif" font-weight="800" font-size="38" letter-spacing="6" fill="#13171C">CERTIFICADO</text>
    <text x="561.5" y="258" text-anchor="middle" font-family="Atkinson Hyperlegible, sans-serif" font-size="17" letter-spacing="4" fill="#5C6670">DE CONCLUSÃO DE CURSO LIVRE</text>
    <text x="561.5" y="318" text-anchor="middle" font-family="Atkinson Hyperlegible, sans-serif" font-size="18" fill="#5C6670">Certificamos que</text>
    <line x1="431" y1="628" x2="692" y2="628" stroke="#13171C" stroke-width="1.2"/>
    <text x="561.5" y="652" text-anchor="middle" font-family="Atkinson Hyperlegible, sans-serif" font-size="16" font-weight="700" fill="#13171C">Renan Fernandes</text>
    <text x="561.5" y="672" text-anchor="middle" font-family="Atkinson Hyperlegible, sans-serif" font-size="13" fill="#5C6670">Massoterapeuta · responsável pelo conteúdo</text>
  </svg>`;
}
/* d = {nome, curso, horas, data, codigo} */
function certHTML(d, tpl=certTpl){
  const bg = tpl.bg ? `<img src="${tpl.bg}" alt="" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover">` : certDefaultBg();
  const cor = tpl.cor || '#12161B';
  const f = (y,cls,html) => `<div class="cf ${cls}" style="top:${y}%;color:${cor}">${html}</div>`;
  return `<div class="cert" role="img" aria-label="${esc('Certificado de '+d.nome)}">${bg}
    ${f(tpl.nomeY,'cf-nome',esc(d.nome))}
    ${f(tpl.cursoY,'cf-curso',`concluiu o curso livre <b>${esc(d.curso)}</b>`)}
    ${f(tpl.horasY,'cf-horas',`com carga horária cumprida de <b>${esc(d.horas)}</b>`)}
    ${f(tpl.rodapeY,'cf-rod',`Emitido em ${esc(d.data)} · Código ${esc(d.codigo||'—')} · valide em renanfernandes.com.br/validar`)}</div>`;
}
const hoje = () => new Date().toLocaleDateString('pt-BR');
const sampleCert = () => ({nome:'Maria Aparecida dos Santos', curso:courses[0].title, horas:durLabel(courses[0]), data:hoje(), codigo:'CF-EXEMPLO1'});
function certData(k){ const c=courseById(k.curso); return {nome:k.nome, curso:c?c.title:'', horas:c?durLabel(c):'', data:k.emitido||hoje(), codigo:k.codigo}; }

/* ---------- lado do aluno: caixa na página do curso + visualização ---------- */
const certOf = cid => adm.certs.filter(k=>k.email===state.email && k.curso===cid).slice(-1)[0];
function certBoxHTML(c){
  const k=certOf(c.id), prog=progOf(c);
  if(k && k.status==='aprovado') return `<div class="cert-box"><b>Certificado emitido</b><p class="muted" style="margin:6px 0 10px">Código ${esc(k.codigo)} · ${durLabel(c)}</p><button class="btn btn-anil full" data-st="ver" data-id="${c.id}">Ver certificado</button></div>`;
  if(k && k.status==='pendente') return `<div class="cert-box"><b>Certificado em análise</b><p class="muted" style="margin:6px 0 0">A equipe confere a conclusão antes da emissão.</p></div>`;
  if(k && k.status==='negado') return `<div class="cert-box"><b>Certificado não emitido</b><p class="muted" style="margin:6px 0 0">Fale com a equipe pelo canal de dúvidas.</p></div>`;
  if(prog>=100) return `<div class="cert-box"><b>Curso concluído</b><p class="muted" style="margin:6px 0 10px">Solicite o certificado com o seu nome.</p><button class="btn btn-oleo full" data-st="solicitar" data-id="${c.id}">Solicitar certificado</button></div>`;
  return `<div class="cert-box"><b>Certificado</b><p class="muted" style="margin:6px 0 10px">Disponível quando você concluir todas as aulas (${prog}% agora).</p><button class="btn btn-ghost full" style="color:var(--carvao)" data-st="demo" data-id="${c.id}">Simular conclusão (demo)</button></div>`;
}
document.addEventListener('click', e=>{
  const b=e.target.closest('[data-st]'); if(!b) return;
  const id=b.dataset.id, c=courseById(id);
  if(b.dataset.st==='solicitar'){
    adm.certs.push({id:'k'+Date.now(),email:state.email,nome:state.nome,curso:id,data:'agora',status:'pendente',codigo:''});
    toast('Pedido enviado. A equipe confere e libera o certificado.'); renderCourse();
  }
  if(b.dataset.st==='demo'){
    modulesOf(c).forEach((m,mi)=>m.lessons.forEach((l,li)=>{ if(l.type!=='teste') state.doneLessons[`${id}:${mi}:${li}`]=true; }));
    toast('Conclusão simulada.'); renderCourse();
  }
  if(b.dataset.st==='ver'){
    $('certView').innerHTML=certHTML(certData(certOf(id)));
    openSheet('certSheet');
  }
});
$('certPdf').onclick=()=>toast('No site publicado, este botão baixa o PDF gerado no servidor.');
