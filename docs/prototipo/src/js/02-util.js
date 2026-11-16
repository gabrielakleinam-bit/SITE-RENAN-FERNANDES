/* =====================================================================
   02 · UTILIDADES: texto, moeda, duração, capas, ícones e gráfico de teia
   ===================================================================== */

const $ = id => document.getElementById(id);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const brl = v => Number(v||0).toLocaleString('pt-BR', {style:'currency', currency:'BRL'});
const initials = n => String(n||'').split(' ').filter(Boolean).map(p=>p[0]).slice(0,2).join('').toUpperCase();
const hashStr = s => { let h=7; for(const ch of String(s)) h=(h*31+ch.charCodeAt(0))>>>0; return h; };
const cur = () => courses.find(c=>c.id===state.course) || courses[0];
const courseById = id => courses.find(c=>c.id===id);
const cName = id => (courseById(id)||{title:'(removido)'}).title;

let toastT;
function toast(msg){
  const el=$('toast'); el.textContent=msg; el.classList.add('show');
  clearTimeout(toastT); toastT=setTimeout(()=>el.classList.remove('show'),2800);
}

/* ---------- duração ----------
   Regra única do site: duração do curso = soma dos vídeos + 4 min por aula de texto. */
const TEXT_SEC = 240;
function parseDur(s){
  const m=/^(\d+):(\d{1,2})(?::(\d{1,2}))?$/.exec(String(s||'').trim());
  if(!m) return 0;
  return m[3]!==undefined ? (+m[1])*3600+(+m[2])*60+(+m[3]) : (+m[1])*60+(+m[2]);
}
function fmtClock(sec){
  sec=Math.max(0,Math.round(sec||0)); const h=Math.floor(sec/3600), m=Math.floor(sec%3600/60), s=sec%60;
  return h ? `${h}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}` : `${m}:${String(s).padStart(2,'0')}`;
}
function fmtTotal(sec){
  const min=Math.round(sec/60);
  if(min<60) return `${min} min`;
  const h=Math.floor(min/60), r=min%60;
  return r ? `${h} h ${r} min` : `${h} h`;
}
function stats(c){
  let aulas=0, sec=0, videos=0;
  const mods=modulesOf(c);
  mods.forEach(m=>m.lessons.forEach(l=>{
    if(l.type==='teste') return;
    aulas++;
    if(l.type==='video'){ videos++; sec+=parseDur(l.d); }
    else if(l.type==='texto') sec+=TEXT_SEC;
  }));
  return {mods:mods.length, aulas, videos, sec};
}
const durLabel = c => fmtTotal(stats(c).sec);

/* ---------- módulos ----------
   Lição: {t:título, type:'video'|'texto'|'material'|'teste', d:'m:ss', src, kind:'file'|'yt'|'link', file, texto} */
function modulesOf(c){ return c.modules || genMods(c); }
function genMods(c){ // conteúdo de exemplo para os cursos-modelo
  if(c._mods) return c._mods;
  const base=[[7,40],[11,15],[5,30]], h=hashStr(c.id), terap=c.cat==='Para terapeutas';
  const n = terap ? Math.min(c.axes.length,5) : 4;
  c._mods = c.axes.slice(0,n).map((a,i)=>{
    const d=k=>{ const [m,s]=base[k]; return `${m+((h>>(i+k))%5)+(terap?6:0)}:${String(s).padStart(2,'0')}`; };
    return {title:`Módulo ${i+1}: ${a}`, lessons:[
      {t:`${a}: fundamentos`, d:d(0), type:'video'},
      {t:`${a}: demonstração comentada`, d:d(1), type:'video'},
      {t:'Prática guiada', d:d(2), type:'video'},
      {t:`Teste do módulo ${i+1}`, d:'8 questões', type:'teste'}
    ]};
  });
  return c._mods;
}
const ytId = u => { const m=String(u||'').match(/(?:youtu\.be\/|youtube(?:-nocookie)?\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/|live\/))([\w-]{11})/); return m?m[1]:''; };

/* ---------- capas ilustradas (proposta) ----------
   Usadas quando o curso não tem imagem de capa. o.center centraliza o desenho (miniaturas). */
const COVER_PAL = {lombar:['#0B2350','#1F6FD1'], bruxismo:['#0F2744','#2E86DE'], pescoco:['#0A1F3F','#3A7BD5'],
                   recuperacao:['#0C1B33','#1557B0'], ventosa:['#13213D','#2A6FDB'], pes:['#0E2748','#3D8FE0']};
const PICTO = (()=>{
  const W='#FFFFFF', L='#8CC4FF';
  return {
    lombar:`<g fill="none" stroke="${W}" stroke-width="6" stroke-linecap="round"><path d="M60 10 C30 60 30 140 70 190" opacity=".35"/><path d="M150 10 C178 60 178 140 140 190" opacity=".35"/></g>
      <g fill="${W}">${[0,1,2,3,4,5,6].map(i=>{const y=18+i*25, x=105+Math.sin(i/6*Math.PI*1.2-.6)*12;
        return `<rect x="${x-26}" y="${y}" width="52" height="17" rx="8" fill="${i>=4?L:W}"/><rect x="${x-40}" y="${y+5}" width="14" height="7" rx="3.5" opacity=".7"/><rect x="${x+26}" y="${y+5}" width="14" height="7" rx="3.5" opacity=".7"/>`}).join('')}</g>`,
    bruxismo:`<g fill="none" stroke="${W}" stroke-width="6" stroke-linecap="round" stroke-linejoin="round">
        <path d="M150 20 C95 10 55 45 55 92 L40 120 L57 126 L56 145 C56 160 68 168 88 165 L100 163 L102 192"/><path d="M150 20 C185 40 190 95 170 130 C160 150 150 165 150 192"/><circle cx="100" cy="88" r="5" fill="${W}"/></g>
      <path d="M78 160 C105 182 140 170 160 128" fill="none" stroke="${L}" stroke-width="9" stroke-linecap="round"/>
      <g stroke="${L}" stroke-width="5" stroke-linecap="round" opacity=".8"><path d="M182 150 l14 6"/><path d="M178 168 l12 12"/><path d="M186 132 l15 0"/></g>`,
    pescoco:`<g fill="none" stroke="${W}" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"><circle cx="100" cy="52" r="32"/>
        <path d="M86 84 L84 112 C70 122 36 130 22 150 C14 162 12 178 12 192"/><path d="M114 84 L116 112 C130 122 164 130 178 150 C186 162 188 178 188 192"/></g>
      <path d="M84 116 C66 126 50 130 40 140 M116 116 C134 126 150 130 160 140" fill="none" stroke="${L}" stroke-width="10" stroke-linecap="round"/><path d="M86 96 L114 96" stroke="${L}" stroke-width="8" stroke-linecap="round"/>`,
    recuperacao:`<g fill="none" stroke="${W}" stroke-width="6" stroke-linecap="round"><path d="M8 168 C50 140 120 136 168 150"/><circle cx="182" cy="140" r="15"/><path d="M8 186 L192 186" opacity=".4"/></g>
      <g fill="${W}"><ellipse cx="70" cy="132" rx="26" ry="11" transform="rotate(-8 70 132)"/><ellipse cx="122" cy="128" rx="26" ry="11" transform="rotate(4 122 128)"/></g>
      <g fill="none" stroke="${W}" stroke-width="6" stroke-linecap="round"><path d="M52 124 L40 60"/><path d="M140 120 L150 56"/></g>
      <g fill="none" stroke="${L}" stroke-width="5" stroke-linecap="round" opacity=".9"><path d="M60 100 q35 -18 70 0"/><path d="M50 82 q50 -26 100 0"/></g>`,
    ventosa:`<path d="M10 180 C60 150 140 150 190 176" fill="none" stroke="${W}" stroke-width="6" stroke-linecap="round" opacity=".55"/>
      <g fill="none" stroke="${W}" stroke-width="6" stroke-linejoin="round">${[[48,150],[100,140],[152,148]].map(([x,y])=>`<path d="M${x-24} ${y} C${x-24} ${y-46} ${x+24} ${y-46} ${x+24} ${y} Z" fill="rgba(140,196,255,.25)"/><path d="M${x-30} ${y} L${x+30} ${y}" stroke="${L}" stroke-width="7" stroke-linecap="round"/>`).join('')}</g>
      <g fill="none" stroke="${L}" stroke-width="4" stroke-linecap="round" opacity=".8"><path d="M100 70 v-24"/><path d="M48 84 v-18"/><path d="M152 82 v-18"/></g>`,
    pes:`<path d="M58 14 C56 70 54 112 62 140 C70 168 96 184 140 184 C170 184 188 176 186 160 C184 146 164 144 140 140 C116 136 100 126 94 104 C88 84 88 50 92 14" fill="none" stroke="${W}" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>
      <g fill="${L}"><circle cx="120" cy="166" r="7"/><circle cx="148" cy="164" r="6"/><circle cx="96" cy="150" r="7"/><circle cx="78" cy="130" r="6"/></g>`,
    generic:`<g fill="none" stroke="${W}" stroke-width="6" stroke-linecap="round"><path d="M20 150 C60 110 140 110 180 150"/><path d="M40 176 C75 146 125 146 160 176" stroke="${L}"/><circle cx="100" cy="72" r="34"/></g>`
  };
})();
function coverSVG(c, o={}){
  const pal=COVER_PAL[c.id]||['#0E2748',['#1F6FD1','#2E86DE','#3A7BD5','#1557B0'][hashStr(c.id)%4]];
  const u='g'+String(c.id).replace(/\W/g,'')+(o.k||'');
  return `<svg viewBox="0 0 800 500" preserveAspectRatio="xMidYMid slice" role="img" aria-label="${esc('Ilustração do curso '+c.title)}" style="display:block;width:100%;height:100%">
    <defs><linearGradient id="${u}a" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${pal[0]}"/><stop offset="1" stop-color="${pal[1]}"/></linearGradient>
      <radialGradient id="${u}b" cx=".68" cy=".42" r=".5"><stop offset="0" stop-color="#fff" stop-opacity=".22"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient></defs>
    <rect width="800" height="500" fill="url(#${u}a)"/><rect width="800" height="500" fill="url(#${u}b)"/>
    <path d="M330 470 A230 230 0 0 1 560 30" fill="none" stroke="#4FA3F0" stroke-width="9" stroke-linecap="round" opacity=".75"/>
    <path d="M-20 430 C180 360 380 470 820 380" fill="none" stroke="#8CC4FF" stroke-width="10" opacity=".35"/>
    <path d="M-20 470 C200 400 420 500 820 420" fill="none" stroke="#4FA3F0" stroke-width="8" opacity=".5"/>
    <g transform="translate(${o.center?'240 50':'445 70'}) scale(1.6)">${PICTO[c.id]||PICTO.generic}</g></svg>`;
}
function coverHTML(c, cls='cover', o={}){
  return c.img
    ? `<div class="${cls}"><img src="${c.img}" alt="" style="width:100%;height:100%;object-fit:cover;display:block"></div>`
    : `<div class="${cls}">${coverSVG(c,o)}</div>`;
}

/* ---------- ícones (traço) ---------- */
const IC = {
  users:'<circle cx="9" cy="8" r="4"/><path d="M2 21a7 7 0 0 1 14 0"/><path d="M16 4a4 4 0 0 1 0 8"/><path d="M22 21a7 7 0 0 0-4-6.3"/>',
  play:'<rect x="3" y="5" width="18" height="14" rx="3"/><path d="M10 9l5 3-5 3z"/>',
  chart:'<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>', money:'<rect x="2" y="6" width="20" height="12" rx="2"/><circle cx="12" cy="12" r="3"/>',
  lock:'<rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>',
  medal:'<circle cx="12" cy="9" r="6"/><path d="M9 14.5 7.5 22 12 19.5 16.5 22 15 14.5"/>',
  chat:'<path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12z"/>', arrow:'<path d="M5 12h14M13 6l6 6-6 6"/>',
  plus:'<path d="M12 5v14M5 12h14"/>', edit:'<path d="M4 20h4L19 9l-4-4L4 16z"/>',
  eye:'<path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
  trash:'<path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13"/>', video:'<rect x="2" y="6" width="14" height="12" rx="2"/><path d="M16 10l6-3v10l-6-3z"/>',
  text:'<path d="M5 5h14M5 10h14M5 15h9"/>', file:'<path d="M6 2h9l5 5v15H6z"/><path d="M14 2v6h6"/>',
  quiz:'<circle cx="12" cy="12" r="9"/><path d="M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.6.3-1 .8-1 1.5V14"/><circle cx="12" cy="17" r=".6" fill="currentColor"/>',
  up:'<path d="M12 19V5M6 11l6-6 6 6"/>', down:'<path d="M12 5v14M6 13l6 6 6-6"/>', x:'<path d="M6 6l12 12M18 6L6 18"/>',
  phone:'<rect x="7" y="2" width="10" height="20" rx="2"/><path d="M11 18h2"/>',
  link:'<path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1"/><path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/>',
  spark:'<path d="M12 3l1.8 4.7L18.5 9.5 13.8 11.3 12 16l-1.8-4.7L5.5 9.5l4.7-1.8z"/><path d="M19 15l.8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8z"/>',
  check:'<path d="M5 12l5 5L20 7"/>', img:'<rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="9" cy="10" r="2"/><path d="M21 16l-5-5-9 9"/>',
  box:'<path d="M3 7l9-4 9 4v10l-9 4-9-4z"/><path d="M3 7l9 4 9-4M12 11v10"/>',
  full:'<path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/>', lockS:'<rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>'
};
const ic = (n,s=20) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${IC[n]}</svg>`;

/* ---------- teia (radar) ---------- */
function pt(cx,cy,r,i,n){const a=-Math.PI/2+2*Math.PI*i/n;return [cx+r*Math.cos(a),cy+r*Math.sin(a)]}
function webRing(cx,cy,r,n,sag){
  let d='';
  for(let i=0;i<n;i++){
    const [x1,y1]=pt(cx,cy,r,i,n),[x2,y2]=pt(cx,cy,r,i+1,n);
    const mx=(x1+x2)/2,my=(y1+y2)/2, qx=mx+(cx-mx)*sag, qy=my+(cy-my)*sag;
    d+=(i===0?`M${x1.toFixed(1)},${y1.toFixed(1)}`:'')+` Q${qx.toFixed(1)},${qy.toFixed(1)} ${x2.toFixed(1)},${y2.toFixed(1)}`;
  }
  return d+'Z';
}
function radar(axes, series, o={}){
  const W=o.w||360, H=o.h||W, pad=o.labels?o.pad||74:6, r=(Math.min(W,H)/2)-pad, cx=W/2, cy=H/2, n=axes.length, rings=o.rings||4;
  const grid=o.grid||'rgba(255,255,255,.28)', lab=o.labelColor||'#C9D3DE';
  let s=`<svg viewBox="0 0 ${W} ${H}" width="100%" role="img" aria-label="${esc(o.aria||'Mapa de competências')}">`;
  for(let k=1;k<=rings;k++) s+=`<path d="${webRing(cx,cy,r*k/rings,n,0.09)}" fill="none" stroke="${grid}" stroke-width="${k===rings?1.4:1}"/>`;
  for(let i=0;i<n;i++){const [x,y]=pt(cx,cy,r,i,n);s+=`<line x1="${cx}" y1="${cy}" x2="${x.toFixed(1)}" y2="${y.toFixed(1)}" stroke="${grid}"/>`}
  series.forEach((se,si)=>{
    const p=se.values.map((v,i)=>pt(cx,cy,r*v/100,i,n));
    const d='M'+p.map(q=>q.map(c=>c.toFixed(1)).join(',')).join(' L')+'Z';
    s+=`<path d="${d}" fill="${se.color}" fill-opacity="${se.fillOp??(se.color==='#4FA3F0'?.12:.34)}" stroke="none" class="${o.animate?'fill-in f'+(si+1):''}"/>`;
    s+=`<path d="${d}" fill="none" stroke="${se.color}" stroke-width="${o.stroke||2.5}" stroke-linejoin="round" pathLength="1" class="${o.animate?'draw'+(si?' late':''):''}"/>`;
    if(o.dots) p.forEach(q=>s+=`<circle cx="${q[0].toFixed(1)}" cy="${q[1].toFixed(1)}" r="3.5" fill="${se.color}" class="${o.animate?'fill-in f'+(si+1):''}"/>`);
  });
  if(o.labels) axes.forEach((a,i)=>{
    const [x,y]=pt(cx,cy,r+16,i,n), c=Math.cos(-Math.PI/2+2*Math.PI*i/n);
    const anchor=Math.abs(c)<.2?'middle':(c>0?'start':'end');
    const dy=y<cy-r*.8?-2:(y>cy+r*.8?12:4);
    const fs=o.fs||13, words=a.split(' '), lines=(a.length>11&&words.length>1)?[words.slice(0,Math.ceil(words.length/2)).join(' '),words.slice(Math.ceil(words.length/2)).join(' ')]:[a];
    const y0=y+dy-(lines.length>1&&y<cy+r*.8?fs*1.1:0);
    s+=`<text x="${x.toFixed(1)}" y="${y0.toFixed(1)}" text-anchor="${anchor}" fill="${lab}" font-family="Atkinson Hyperlegible, sans-serif" font-size="${fs}">${lines.map((l,k)=>`<tspan x="${x.toFixed(1)}" dy="${k?fs*1.15:0}">${esc(l)}</tspan>`).join('')}</text>`;
  });
  return s+'</svg>';
}
