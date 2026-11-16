/* Presença na aula.
   O vídeo é dividido em blocos de 5 s. Um bloco só conta se foi assistido em sequência:
   saltos para frente (mais de 3 s entre duas leituras de posição) e voltas não marcam blocos.
   A aula fica concluída com 90% dos blocos. Vale para vídeo enviado e YouTube.
   No M3 a mesma regra roda no servidor, que recebe os intervalos assistidos. */

export const BLOCO_SEG = 5;
export const META = 0.9;
const SALTO_MAX = 3;

export function novaPresenca(durSeg: number): Uint8Array {
  return new Uint8Array(Math.max(1, Math.ceil(Math.max(1, durSeg) / BLOCO_SEG)));
}

/** Marca os blocos entre a última posição e a atual, se o avanço foi contínuo. Retorna a nova "última posição". */
export function marcar(blocos: Uint8Array, ultimaPos: number, pos: number, durSeg: number): number {
  if (pos >= ultimaPos && pos - ultimaPos <= SALTO_MAX) {
    const ini = Math.floor(ultimaPos / BLOCO_SEG);
    const fim = Math.floor(Math.min(pos, durSeg - 0.01) / BLOCO_SEG);
    for (let b = ini; b <= fim; b++) if (b < blocos.length) blocos[b] = 1;
  }
  return pos;
}

export function percentual(blocos: Uint8Array): number {
  let w = 0;
  for (const b of blocos) w += b;
  return Math.round((w / blocos.length) * 100);
}

export const concluida = (blocos: Uint8Array) => percentual(blocos) >= META * 100;
