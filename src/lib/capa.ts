// @ts-nocheck -- desenho portado literalmente do protótipo
/* Capas ilustradas, usadas quando o curso não tem imagem (portado do protótipo, 02-util.js).
   Gera SVG como texto; o componente <Capa> injeta o resultado. */
import { esc, hashStr } from './texto.ts';

const COVER_PAL: Record<string, [string, string]> = {lombar:['#0B2350','#1F6FD1'], bruxismo:['#0F2744','#2E86DE'], pescoco:['#0A1F3F','#3A7BD5'],
                   recuperacao:['#0C1B33','#1557B0'], ventosa:['#13213D','#2A6FDB'], pes:['#0E2748','#3D8FE0']};
const PICTO: Record<string, string> = (()=>{
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
export function coverSVG(c: { id: string; titulo: string }, o: { k?: string; center?: boolean } = {}){
  const pal=COVER_PAL[c.id]||['#0E2748',['#1F6FD1','#2E86DE','#3A7BD5','#1557B0'][hashStr(c.id)%4]];
  const u='g'+String(c.id).replace(/\W/g,'')+(o.k||'');
  return `<svg viewBox="0 0 800 500" preserveAspectRatio="xMidYMid slice" role="img" aria-label="${esc('Ilustração do curso '+c.titulo)}" style="display:block;width:100%;height:100%">
    <defs><linearGradient id="${u}a" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${pal[0]}"/><stop offset="1" stop-color="${pal[1]}"/></linearGradient>
      <radialGradient id="${u}b" cx=".68" cy=".42" r=".5"><stop offset="0" stop-color="#fff" stop-opacity=".22"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient></defs>
    <rect width="800" height="500" fill="url(#${u}a)"/><rect width="800" height="500" fill="url(#${u}b)"/>
    <path d="M330 470 A230 230 0 0 1 560 30" fill="none" stroke="#4FA3F0" stroke-width="9" stroke-linecap="round" opacity=".75"/>
    <path d="M-20 430 C180 360 380 470 820 380" fill="none" stroke="#8CC4FF" stroke-width="10" opacity=".35"/>
    <path d="M-20 470 C200 400 420 500 820 420" fill="none" stroke="#4FA3F0" stroke-width="8" opacity=".5"/>
    <g transform="translate(${o.center?'240 50':'445 70'}) scale(1.6)">${PICTO[c.id]||PICTO.generic}</g></svg>`;
}
