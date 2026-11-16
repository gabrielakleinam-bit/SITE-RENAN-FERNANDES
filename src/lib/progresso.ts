import 'server-only';
import { db } from './supabase/servidor';
import type { Curso } from './tipos';

/** Aulas (não-teste) do curso e quantas o aluno concluiu. */
export async function progressoCurso(usuarioId: string, curso: Curso) {
  const ids = curso.modulos.flatMap(m => m.aulas).filter(a => a.tipo !== 'teste').map(a => a.id);
  if (!ids.length) return { total: 0, feitas: 0, pct: 0, concluidas: new Set<string>() };
  const { data } = await db().from('progresso_aula').select('aula_id').eq('usuario_id', usuarioId).in('aula_id', ids).not('concluida_em', 'is', null);
  const concluidas = new Set((data || []).map(x => x.aula_id as string));
  return { total: ids.length, feitas: concluidas.size, pct: Math.round((concluidas.size / ids.length) * 100), concluidas };
}
