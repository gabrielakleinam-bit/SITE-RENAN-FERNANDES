import { exigirUsuario } from '@/lib/sessao';
import { conversas } from '@/lib/duvidas';
import { listarTodosCursos } from '@/lib/catalogo';
import { db } from '@/lib/supabase/servidor';
import { Duvidas } from '@/components/Duvidas';

export const metadata = { title: 'Dúvidas' };

export default async function PaginaDuvidas({ searchParams }: { searchParams: Promise<{ d?: string; nova?: string; curso?: string; aula?: string }> }) {
  const sp = await searchParams;
  const u = await exigirUsuario('/duvidas');
  const [lista, cursos, { data: mats }] = await Promise.all([
    conversas({ usuarioId: u.id }), listarTodosCursos(),
    db().from('matriculas').select('curso_id').eq('usuario_id', u.id).eq('status', 'ativo'),
  ]);
  const meus = new Set((mats || []).map(m => m.curso_id));
  const opc = cursos.filter(c => meus.has(c.uuid) || u.papel === 'admin').map(c => ({
    uuid: c.uuid, titulo: c.titulo, aulas: c.modulos.flatMap(m => m.aulas).filter(a => a.tipo !== 'teste').map(a => ({ id: a.id, titulo: a.titulo })),
  }));
  return (
    <div className="wrap">
      <div className="teia-top"><h1>Suas dúvidas</h1><p>Converse com o professor sobre cada aula. Você recebe um aviso por e-mail quando ele responder.</p></div>
      <Duvidas lista={lista} modo="aluno" cursos={opc} inicial={sp.d ? Number(sp.d) : undefined} nova={sp.nova ? { curso: sp.curso, aula: sp.aula } : null} />
    </div>
  );
}
