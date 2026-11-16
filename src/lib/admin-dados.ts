import 'server-only';
/* Consultas do painel: alunos, onde cada um está, progresso por curso. */
import { db } from './supabase/servidor';
import { listarTodosCursos } from './catalogo';
import type { Curso } from './tipos';

export interface LinhaAluno {
  id: string; nome: string; email: string; criado: string; ultimo: string | null;
  cursos: { slug: string; titulo: string; status: string; feitas: number; total: number; pct: number; posicao: string; quando: string | null }[];
}

/* eslint-disable @typescript-eslint/no-explicit-any */
export async function dadosAlunos() {
  const cursos = await listarTodosCursos();
  const porUuid = new Map(cursos.map(c => [c.uuid, c]));
  const aulaInfo = new Map<string, { curso: Curso; mi: number; li: number }>();
  for (const c of cursos) c.modulos.forEach((m, mi) => m.aulas.forEach((a, li) => aulaInfo.set(a.id, { curso: c, mi, li })));

  const [{ data: perfis }, { data: mats }, { data: prog }] = await Promise.all([
    db().from('perfis').select('id, nome, email, criado_em, ultimo_acesso').eq('papel', 'aluno').order('criado_em', { ascending: false }),
    db().from('matriculas').select('usuario_id, curso_id, status'),
    db().from('progresso_aula').select('usuario_id, aula_id, concluida_em, atualizado_em'),
  ]);

  const alunos: LinhaAluno[] = (perfis || []).map((p: any) => {
    const minhas = (mats || []).filter((m: any) => m.usuario_id === p.id);
    const meuProg = (prog || []).filter((x: any) => x.usuario_id === p.id);
    return {
      id: p.id, nome: p.nome, email: p.email, criado: p.criado_em, ultimo: p.ultimo_acesso,
      cursos: minhas.map((m: any) => {
        const c = porUuid.get(m.curso_id);
        if (!c) return null;
        const ids = c.modulos.flatMap(x => x.aulas).filter(a => a.tipo !== 'teste').map(a => a.id);
        const doCurso = meuProg.filter((x: any) => ids.includes(x.aula_id));
        const feitas = doCurso.filter((x: any) => x.concluida_em).length;
        const ultimo = doCurso.sort((a: any, b: any) => (a.atualizado_em < b.atualizado_em ? 1 : -1))[0];
        const info = ultimo ? aulaInfo.get(ultimo.aula_id) : null;
        return {
          slug: c.id, titulo: c.titulo, status: m.status, feitas, total: ids.length, pct: ids.length ? Math.round((feitas / ids.length) * 100) : 0,
          posicao: m.status !== 'ativo' ? 'Aguardando liberação' : feitas === ids.length && ids.length ? 'Concluído' : info ? `Módulo ${info.mi + 1} · Aula ${info.li + 1}` : 'Ainda não começou',
          quando: ultimo?.atualizado_em || null,
        };
      }).filter(Boolean) as LinhaAluno['cursos'],
    };
  });
  return { alunos, cursos };
}

export function quando(iso: string | null) {
  if (!iso) return '—';
  const d = new Date(iso), agora = new Date();
  const dias = Math.floor((agora.getTime() - d.getTime()) / 86400000);
  const hora = d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Sao_Paulo' });
  if (dias === 0 && d.toDateString() === agora.toDateString()) return `hoje, ${hora}`;
  if (dias <= 1) return `ontem, ${hora}`;
  if (dias < 7) return `há ${dias} dias`;
  return d.toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' });
}
