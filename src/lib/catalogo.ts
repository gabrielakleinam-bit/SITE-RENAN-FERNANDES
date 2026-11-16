import 'server-only';
/* Acesso ao catálogo. As páginas só falam com estas funções.
   O conteúdo protegido da aula (vídeo, texto, material, questões) NÃO sai daqui: veja conteudoAula(). */
import { db } from './supabase/servidor';
import { supabaseConfigurado } from './config';
import type { Aula, Curso, Modulo, Pacote } from './tipos';

const CAMPOS_CURSO = 'id, slug, titulo, formacao, professor, preco, capa_url, resumo, para_quem, instrucoes, antes, depois, publicado, arquivado';
const CAMPOS_AULA = 'id, modulo_id, ordem, titulo, tipo, duracao_seg, video_fonte, video_status';

/* eslint-disable @typescript-eslint/no-explicit-any */
function montar(c: any, mods: any[], aulas: any[]): Curso {
  const modulos: Modulo[] = mods.filter(m => m.curso_id === c.id).sort((a, b) => a.ordem - b.ordem).map(m => ({
    id: m.id,
    titulo: m.titulo,
    aulas: aulas.filter(a => a.modulo_id === m.id).sort((a, b) => a.ordem - b.ordem).map((a): Aula => ({
      id: a.id, titulo: a.titulo, tipo: a.tipo, duracaoSeg: a.duracao_seg ?? undefined,
      rotulo: a.tipo === 'teste' ? 'teste' : undefined,
      videoFonte: a.video_fonte, videoStatus: a.video_status,
    })),
  }));
  const eixos = modulos.map(m => m.titulo || 'Módulo');
  const fit = (v: number[] | null, d: number) => eixos.map((_, i) => (v && v[i] != null ? v[i] : d));
  return {
    id: c.slug, uuid: c.id, titulo: c.titulo, formacao: c.formacao, professor: c.professor, preco: Number(c.preco),
    capaUrl: c.capa_url || undefined, resumo: c.resumo, paraQuem: c.para_quem, instrucoes: c.instrucoes || undefined,
    eixos, antes: fit(c.antes, 30), depois: fit(c.depois, 80), modulos, publicado: c.publicado, arquivado: c.arquivado,
  };
}

async function carregar(filtro: (q: any) => any): Promise<Curso[]> {
  if (!supabaseConfigurado()) return [];
  const { data: cursos, error } = await filtro(db().from('cursos').select(CAMPOS_CURSO)).order('criado_em');
  if (error) throw error;
  if (!cursos?.length) return [];
  const ids = cursos.map((c: any) => c.id);
  const { data: mods } = await db().from('modulos').select('id, curso_id, ordem, titulo').in('curso_id', ids);
  const mids = (mods || []).map(m => m.id);
  const { data: aulas } = mids.length ? await db().from('aulas').select(CAMPOS_AULA).in('modulo_id', mids) : { data: [] };
  return cursos.map((c: any) => montar(c, mods || [], aulas || []));
}

/** Cursos publicados (catálogo público). */
export const listarCursos = () => carregar(q => q.eq('publicado', true).eq('arquivado', false));
/** Todos os cursos (painel). */
export const listarTodosCursos = () => carregar(q => q.eq('arquivado', false));

export async function buscarCurso(slug: string, opts: { rascunho?: boolean } = {}): Promise<Curso | undefined> {
  const r = await carregar(q => { q = q.eq('slug', slug); return opts.rascunho ? q : q.eq('publicado', true).eq('arquivado', false); });
  return r[0];
}
export async function buscarCursoPorId(id: string): Promise<Curso | undefined> {
  return (await carregar(q => q.eq('id', id)))[0];
}

export async function listarPacotes(opts: { todos?: boolean } = {}): Promise<Pacote[]> {
  if (!supabaseConfigurado()) return [];
  let q = db().from('pacotes').select('id, titulo, descricao, preco, ativo, ordem, pacote_cursos(cursos(slug))').order('ordem');
  if (!opts.todos) q = q.eq('ativo', true);
  const { data } = await q;
  return (data || []).map((p: any) => ({
    id: p.id, titulo: p.titulo, descricao: p.descricao, preco: Number(p.preco), ativo: p.ativo,
    cursos: (p.pacote_cursos || []).map((x: any) => x.cursos?.slug).filter(Boolean),
  }));
}

/** Conteúdo completo de uma aula. Só chame depois de conferir o acesso (podeAssistir). */
export async function conteudoAula(aulaId: string) {
  const { data } = await db().from('aulas').select('id, tipo, video_fonte, video_ref, video_status, duracao_seg, texto, material_path, questoes').eq('id', aulaId).maybeSingle();
  return data as null | {
    id: string; tipo: string; video_fonte: 'bunny' | 'youtube' | null; video_ref: string | null; video_status: string | null;
    duracao_seg: number | null; texto: string | null; material_path: string | null; questoes: any;
  };
}
