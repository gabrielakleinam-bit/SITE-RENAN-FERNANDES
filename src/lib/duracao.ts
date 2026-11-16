import type { Curso, Pacote } from './tipos.ts';

/* Regra única do site: duração do curso = soma dos vídeos + 4 min por aula de texto.
   Testes não contam como aula nem somam tempo. */
export const TEXTO_SEG = 240;

export function parseDur(s: string): number {
  const m = /^(\d+):(\d{1,2})(?::(\d{1,2}))?$/.exec(String(s || '').trim());
  if (!m) return 0;
  return m[3] !== undefined ? +m[1] * 3600 + +m[2] * 60 + +m[3] : +m[1] * 60 + +m[2];
}

export function fmtClock(sec: number): string {
  sec = Math.max(0, Math.round(sec || 0));
  const h = Math.floor(sec / 3600), m = Math.floor((sec % 3600) / 60), s = sec % 60;
  return h ? `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}` : `${m}:${String(s).padStart(2, '0')}`;
}

export function fmtTotal(sec: number): string {
  const min = Math.round(sec / 60);
  if (min < 60) return `${min} min`;
  const h = Math.floor(min / 60), r = min % 60;
  return r ? `${h} h ${r} min` : `${h} h`;
}

export interface Stats { mods: number; aulas: number; videos: number; sec: number }

export function statsCurso(c: Curso): Stats {
  let aulas = 0, sec = 0, videos = 0;
  for (const m of c.modulos) for (const l of m.aulas) {
    if (l.tipo === 'teste') continue;
    aulas++;
    if (l.tipo === 'video') { videos++; sec += l.duracaoSeg || 0; }
    else if (l.tipo === 'texto') sec += TEXTO_SEG;
  }
  return { mods: c.modulos.length, aulas, videos, sec };
}

export const rotuloAula = (l: { tipo: string; duracaoSeg?: number; rotulo?: string }) =>
  l.rotulo || (l.tipo === 'video' && l.duracaoSeg ? fmtClock(l.duracaoSeg) : l.tipo === 'texto' ? 'leitura' : 'em breve');

export function precoCheioPacote(p: Pacote, cursos: Curso[]): number {
  return p.cursos.reduce((s, id) => s + (cursos.find(c => c.id === id)?.preco || 0), 0);
}

export function segPacote(p: Pacote, cursos: Curso[]): number {
  return p.cursos.reduce((s, id) => {
    const c = cursos.find(x => x.id === id);
    return s + (c ? statsCurso(c).sec : 0);
  }, 0);
}

export const brl = (v: number) =>
  Number(v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

export const iniciais = (n: string) =>
  String(n || '').split(' ').filter(Boolean).map(p => p[0]).slice(0, 2).join('').toUpperCase();
