import 'server-only';
import { db } from './supabase/servidor';

export interface Conversa {
  id: number; titulo: string; tema: string; status: 'aberta' | 'respondida' | 'resolvida'; curso: string; cursoId: string; aula: string;
  aluno: string; atualizada: string; mensagens: { professor: boolean; nome: string; texto: string; quando: string }[];
}

/* eslint-disable @typescript-eslint/no-explicit-any */
export async function conversas(filtro: { usuarioId?: string }): Promise<Conversa[]> {
  let q = db().from('duvidas').select('id, titulo, tema, status, atualizada_em, usuario_id, curso_id, cursos(titulo), aulas(titulo), mensagens(professor, texto, criada_em, autor_id)')
    .order('atualizada_em', { ascending: false }).limit(300);
  if (filtro.usuarioId) q = q.eq('usuario_id', filtro.usuarioId);
  const { data } = await q;
  const ids = [...new Set((data || []).map((d: any) => d.usuario_id))];
  const { data: perfis } = ids.length ? await db().from('perfis').select('id, nome').in('id', ids) : { data: [] };
  const nome = (id: string) => (perfis || []).find((p: any) => p.id === id)?.nome || 'Aluno';
  return (data || []).map((d: any) => ({
    id: d.id, titulo: d.titulo, tema: d.tema, status: d.status, curso: d.cursos?.titulo || '', cursoId: d.curso_id, aula: d.aulas?.titulo || '',
    aluno: nome(d.usuario_id), atualizada: d.atualizada_em,
    mensagens: (d.mensagens || []).sort((a: any, b: any) => (a.criada_em < b.criada_em ? -1 : 1))
      .map((m: any) => ({ professor: m.professor, nome: m.professor ? 'Renan Fernandes' : nome(d.usuario_id), texto: m.texto, quando: m.criada_em })),
  }));
}
