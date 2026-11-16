import { listarPacotes, listarTodosCursos } from '@/lib/catalogo';
import { db } from '@/lib/supabase/servidor';
import { statsCurso } from '@/lib/duracao';
import { CursosAdmin } from '@/components/admin/CursosAdmin';

export const metadata = { title: 'Cursos' };

export default async function Cursos() {
  const [cursos, pacotes, { data: mats }] = await Promise.all([
    listarTodosCursos(), listarPacotes({ todos: true }),
    db().from('matriculas').select('curso_id').eq('status', 'ativo'),
  ]);
  const ativos: Record<string, number> = {};
  for (const m of mats || []) ativos[m.curso_id] = (ativos[m.curso_id] || 0) + 1;
  const itens = cursos.map(c => ({ curso: c, ...statsCurso(c), alunos: ativos[c.uuid] || 0 }));
  return <CursosAdmin itens={itens} pacotes={pacotes} />;
}
