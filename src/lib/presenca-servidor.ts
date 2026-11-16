/* Regra de presença aplicada no servidor (fonte da verdade).
   O navegador manda a posição a cada ~5 s. Um trecho só conta se o avanço for contínuo e compatível
   com o tempo real que passou (até 2x de velocidade, com folga de 4 s). Saltos e voltas só movem a posição. */
import { BLOCO_SEG, META } from './presenca.ts';

export interface EstadoPresenca { blocos: string; ultima: number; atualizado: number }

export function aplicarTick(e: EstadoPresenca, pos: number, agora: number, dur: number, evento: 'tick' | 'seek') {
  const n = Math.max(1, Math.ceil(dur / BLOCO_SEG));
  const b = (e.blocos || '').padEnd(n, '0').slice(0, n).split('');
  pos = Math.max(0, Math.min(dur, pos));
  if (evento === 'tick') {
    const dt = Math.max(0, (agora - e.atualizado) / 1000);
    const d = pos - e.ultima;
    if (d >= 0 && d <= dt * 2 + 4 && d <= 40) {
      const ini = Math.floor(e.ultima / BLOCO_SEG), fim = Math.floor(Math.min(pos, dur - 0.01) / BLOCO_SEG);
      for (let k = ini; k <= fim; k++) if (k < n) b[k] = '1';
    }
  }
  const blocos = b.join('');
  const pct = Math.round((blocos.split('').filter(x => x === '1').length / n) * 100);
  return { blocos, ultima: pos, atualizado: agora, pct, concluida: pct >= META * 100 };
}
