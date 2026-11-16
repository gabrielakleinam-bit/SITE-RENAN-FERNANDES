/* Tipos e regras do editor de treinamento (usados no servidor e no navegador). */
import type { Questao } from './tipos';

export interface AulaEd {
  id: string; ordem: number; titulo: string; tipo: 'video' | 'texto' | 'material' | 'teste';
  duracao_seg: number | null; video_fonte: 'bunny' | 'youtube' | null; video_ref: string | null;
  video_status: 'enviando' | 'processando' | 'pronto' | 'erro' | null;
  texto: string | null; material_path: string | null; questoes: Questao[] | null;
}
export interface ModuloEd { id: string; ordem: number; titulo: string; aulas: AulaEd[] }
export interface CursoEd {
  id: string; slug: string; titulo: string; formacao: 'Para você' | 'Para terapeutas'; professor: string; preco: number;
  capa_url: string | null; resumo: string; para_quem: string; instrucoes: string; publicado: boolean; arquivado: boolean;
  modulos: ModuloEd[];
}

export const MIN_MODULOS = 3;
export const TEXTO_SEG = 240;

export function totais(c: CursoEd) {
  let aulas = 0, videos = 0, seg = 0, semVideo = 0, processando = 0;
  for (const m of c.modulos) for (const a of m.aulas) {
    if (a.tipo === 'teste') continue;
    aulas++;
    if (a.tipo === 'video') {
      videos++;
      if (!a.video_ref) semVideo++;
      else if (a.video_status !== 'pronto') processando++;
      seg += a.duracao_seg || 0;
    } else if (a.tipo === 'texto') seg += TEXTO_SEG;
  }
  return { modulos: c.modulos.length, aulas, videos, seg, semVideo, processando };
}

/** O que falta para publicar. Publicar só é possível com todos os itens ok. */
export function checklist(c: CursoEd) {
  const t = totais(c);
  const testesSemQuestao = c.modulos.flatMap(m => m.aulas).filter(a => a.tipo === 'teste' && !(a.questoes && a.questoes.length)).length;
  const textosVazios = c.modulos.flatMap(m => m.aulas).filter(a => a.tipo === 'texto' && !(a.texto || '').trim()).length;
  const materiaisSemArquivo = c.modulos.flatMap(m => m.aulas).filter(a => a.tipo === 'material' && !a.material_path).length;
  return [
    { ok: c.titulo.trim().length >= 4 && c.titulo !== 'Novo curso', texto: 'Nome do curso' },
    { ok: c.preco > 0, texto: 'Preço' },
    { ok: c.resumo.trim().length >= 20, texto: 'Resumo' },
    { ok: c.para_quem.trim().length >= 20, texto: 'Para quem é o curso' },
    { ok: t.modulos >= MIN_MODULOS, texto: `Pelo menos ${MIN_MODULOS} módulos (cada um vira um eixo da teia)` },
    { ok: c.modulos.every(m => m.titulo.trim()), texto: 'Nome em todos os módulos' },
    { ok: c.modulos.length > 0 && c.modulos.every(m => m.aulas.some(a => a.tipo !== 'teste')), texto: 'Pelo menos uma aula em cada módulo' },
    { ok: t.videos > 0 && t.semVideo === 0, texto: t.semVideo ? `Vídeo em todas as aulas de vídeo (faltam ${t.semVideo})` : 'Vídeo em todas as aulas de vídeo' },
    { ok: t.processando === 0, texto: t.processando ? `Vídeos prontos (${t.processando} ainda processando)` : 'Vídeos prontos' },
    { ok: textosVazios === 0, texto: 'Texto nas aulas de leitura' },
    { ok: materiaisSemArquivo === 0, texto: 'Arquivo nas aulas de material' },
    { ok: testesSemQuestao === 0, texto: 'Perguntas nos testes' },
  ];
}

export function slugify(s: string) {
  return s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60) || 'curso';
}
