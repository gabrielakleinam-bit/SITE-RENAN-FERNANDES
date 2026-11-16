import 'server-only';
import { db } from './supabase/servidor';
import type { Usuario } from './sessao';
import type { Curso } from './tipos';

export interface EstadoAluno {
  mats: Record<string, 'ativo' | 'aguardando'>;   // por slug do curso
  concluidas: string[];                             // ids de aulas concluídas
  feitas: Record<string, number>;                   // aulas concluídas por slug
}

export const ESTADO_VAZIO: EstadoAluno = { mats: {}, concluidas: [], feitas: {} };

export async function estadoAluno(u: Usuario | null): Promise<EstadoAluno> {
  if (!u) return ESTADO_VAZIO;
  const [{ data: mats }, { data: prog }] = await Promise.all([
    db().from('matriculas').select('status, cursos(slug)').eq('usuario_id', u.id),
    db().from('progresso_aula').select('aula_id, aulas(modulos(cursos(slug)))').eq('usuario_id', u.id).not('concluida_em', 'is', null),
  ]);
  const e: EstadoAluno = { mats: {}, concluidas: [], feitas: {} };
  /* eslint-disable @typescript-eslint/no-explicit-any */
  for (const m of (mats || []) as any[]) if (m.cursos?.slug) e.mats[m.cursos.slug] = m.status;
  for (const p of (prog || []) as any[]) {
    e.concluidas.push(p.aula_id);
    const slug = p.aulas?.modulos?.cursos?.slug;
    if (slug) e.feitas[slug] = (e.feitas[slug] || 0) + 1;
  }
  return e;
}

/** Regra de acesso: admin vê tudo; a primeira aula do curso é amostra grátis; o resto exige matrícula ativa. */
export async function podeAssistir(u: Usuario | null, curso: Curso, aulaId: string): Promise<boolean> {
  if (u?.papel === 'admin') return true;
  const primeira = curso.modulos.flatMap(m => m.aulas).find(a => a.tipo !== 'teste');
  if (primeira?.id === aulaId) return true;
  if (!u) return false;
  const { data } = await db().from('matriculas').select('status').eq('usuario_id', u.id).eq('curso_id', curso.uuid).maybeSingle();
  return data?.status === 'ativo';
}
