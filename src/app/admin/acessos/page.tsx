import { db } from '@/lib/supabase/servidor';
import { Acessos, type Pedido } from '@/components/admin/Acessos';

export const metadata = { title: 'Acessos' };

export default async function PaginaAcessos() {
  const { data } = await db().from('pedidos')
    .select('id, valor, metodo, descricao, status, criado_em, decidido_em, usuario_id, pacote_id, pedido_cursos(cursos(titulo))')
    .order('criado_em', { ascending: false }).limit(300);
  const ids = [...new Set((data || []).map(p => p.usuario_id))];
  const { data: perfis } = ids.length ? await db().from('perfis').select('id, nome, email').in('id', ids) : { data: [] };
  const pedidos: Pedido[] = (data || []).map(p => {
    const pf = (perfis || []).find(x => x.id === p.usuario_id);
    return {
      id: p.id, valor: Number(p.valor), metodo: p.metodo, descricao: p.descricao, status: p.status, criado: p.criado_em, decidido: p.decidido_em,
      nome: pf?.nome || '(conta excluída)', email: pf?.email || '', pacote: !!p.pacote_id,
      cursos: ((p.pedido_cursos || []) as unknown as { cursos: { titulo: string } | null }[]).map(x => x.cursos?.titulo || '').filter(Boolean),
    };
  });
  return <Acessos pedidos={pedidos} />;
}
