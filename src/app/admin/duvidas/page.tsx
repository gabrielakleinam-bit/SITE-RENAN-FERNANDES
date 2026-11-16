import { conversas } from '@/lib/duvidas';
import { listarTodosCursos } from '@/lib/catalogo';
import { Duvidas } from '@/components/Duvidas';

export const metadata = { title: 'Dúvidas' };

export default async function DuvidasAdmin() {
  const [lista, cursos] = await Promise.all([conversas({}), listarTodosCursos()]);
  const ordem = { aberta: 0, respondida: 1, resolvida: 2 };
  lista.sort((a, b) => ordem[a.status] - ordem[b.status] || (a.atualizada < b.atualizada ? 1 : -1));
  return (
    <div className="adm-pg wrap">
      <div className="ad-top"><div><h1>Dúvidas</h1><p>{lista.filter(c => c.status === 'aberta').length} sem resposta. Ao responder, o aluno recebe um aviso por e-mail.</p></div></div>
      <Duvidas lista={lista} modo="professor" cursos={cursos.map(c => ({ uuid: c.uuid, titulo: c.titulo, aulas: [] }))} />
    </div>
  );
}
