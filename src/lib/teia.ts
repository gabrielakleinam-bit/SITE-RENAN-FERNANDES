// @ts-nocheck -- desenho portado literalmente do protótipo
/* Gráfico de teia (radar), portado do protótipo (02-util.js). Gera SVG como texto. */
import { esc } from './texto.ts';

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
export function radar(axes: string[], series: { values: number[]; color: string; fillOp?: number }[], o: any = {}){
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
