'use server';
/* Ações do aluno: certificado, dúvidas, diagnóstico e conta (LGPD). */
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { usuarioAtual } from '@/lib/sessao';
import { db } from '@/lib/supabase/servidor';
import { buscarCurso } from '@/lib/catalogo';
import { progressoCurso } from '@/lib/progresso';
import { statsCurso } from '@/lib/duracao';
import { clienteSessao } from '@/lib/supabase/servidor';

export async function solicitarCertificado(slug: string) {
  const u = await usuarioAtual();
  if (!u) return { erro: 'Entre na sua conta.' };
  const c = await buscarCurso(slug);
  if (!c) return { erro: 'Curso não encontrado.' };
  const { data: m } = await db().from('matriculas').select('status').eq('usuario_id', u.id).eq('curso_id', c.uuid).maybeSingle();
  if (m?.status !== 'ativo') return { erro: 'O certificado é para alunos matriculados.' };
  const p = await progressoCurso(u.id, c);
  if (p.pct < 100) return { erro: `Conclua todas as aulas para pedir o certificado (você está em ${p.pct}%).` };
  const { data: ja } = await db().from('certificados').select('id, status').eq('usuario_id', u.id).eq('curso_id', c.uuid).maybeSingle();
  if (ja && ja.status !== 'negado') return { ok: true };
  const dados = { usuario_id: u.id, curso_id: c.uuid, status: 'pendente', nome_aluno: u.nome, titulo_curso: c.titulo, horas_seg: statsCurso(c).sec, codigo: null, emitido_em: null };
  if (ja) await db().from('certificados').update(dados).eq('id', ja.id); else await db().from('certificados').insert(dados);
  revalidatePath(`/cursos/${slug}`);
  return { ok: true };
}

/* ---------- dúvidas ---------- */
export async function novaDuvida(f: { curso: string; aula?: string; tema: string; titulo: string; texto: string }) {
  const u = await usuarioAtual();
  if (!u) return { erro: 'Entre na sua conta.' };
  if (f.titulo.trim().length < 5 || f.texto.trim().length < 5) return { erro: 'Escreva a pergunta com um pouco mais de detalhe.' };
  const { data: c } = await db().from('cursos').select('id').eq('id', f.curso).maybeSingle();
  if (!c) return { erro: 'Escolha o curso.' };
  if (u.papel !== 'admin') {
    const { data: m } = await db().from('matriculas').select('status').eq('usuario_id', u.id).eq('curso_id', c.id).maybeSingle();
    if (m?.status !== 'ativo') return { erro: 'As perguntas ficam disponíveis para quem tem o curso.' };
  }
  const { data: d, error } = await db().from('duvidas').insert({
    usuario_id: u.id, curso_id: c.id, aula_id: f.aula || null, tema: (f.tema || 'Geral').slice(0, 60), titulo: f.titulo.slice(0, 200),
  }).select('id').single();
  if (error) return { erro: 'Não foi possível enviar.' };
  await db().from('mensagens').insert({ duvida_id: d.id, autor_id: u.id, professor: false, texto: f.texto.slice(0, 4000) });
  revalidatePath('/duvidas');
  return { ok: true, id: d.id as number };
}

export async function responderComoAluno(duvidaId: number, texto: string) {
  const u = await usuarioAtual();
  if (!u) return { erro: 'Entre na sua conta.' };
  const { data: d } = await db().from('duvidas').select('id, usuario_id').eq('id', duvidaId).maybeSingle();
  if (!d || d.usuario_id !== u.id) return { erro: 'Conversa não encontrada.' };
  if (!texto.trim()) return { erro: 'Escreva a mensagem.' };
  await db().from('mensagens').insert({ duvida_id: duvidaId, autor_id: u.id, professor: false, texto: texto.slice(0, 4000) });
  await db().from('duvidas').update({ status: 'aberta', atualizada_em: new Date().toISOString() }).eq('id', duvidaId);
  revalidatePath('/duvidas');
  return { ok: true };
}

/* ---------- diagnóstico ---------- */
export async function salvarDiagnostico(respostas: unknown, eixos: unknown, recomendados: string[]) {
  const u = await usuarioAtual();
  await db().from('diagnosticos').insert({ usuario_id: u?.id || null, respostas, eixos, recomendados });
  return { ok: true };
}

/* ---------- conta (LGPD) ---------- */
export async function salvarNome(nome: string) {
  const u = await usuarioAtual();
  if (!u) return { erro: 'Entre na sua conta.' };
  await db().from('perfis').update({ nome: nome.trim().slice(0, 120) }).eq('id', u.id);
  revalidatePath('/', 'layout');
  return { ok: true };
}

export async function excluirMinhaConta(confirmacao: string) {
  const u = await usuarioAtual();
  if (!u) return { erro: 'Entre na sua conta.' };
  if (confirmacao.trim().toLowerCase() !== u.email.toLowerCase()) return { erro: 'Digite o seu e-mail exatamente como está na conta.' };
  if (u.papel === 'admin') return { erro: 'Contas de administrador não podem ser excluídas por aqui.' };
  await db().from('auditoria').insert({ quem: null, acao: 'excluir_conta', alvo: u.id });
  await db().auth.admin.deleteUser(u.id);   // apaga perfil, pedidos, progresso, dúvidas e certificados (em cascata)
  const sb = await clienteSessao();
  await sb.auth.signOut();
  redirect('/?conta=excluida');
}

/* ---------- teste do módulo: correção na hora (o gabarito fica no servidor) ---------- */
export async function corrigirTeste(slug: string, aulaId: string, respostas: number[]) {
  const u = await usuarioAtual();
  if (!u) return { erro: 'Entre na sua conta.' };
  const c = await buscarCurso(slug, { rascunho: u.papel === 'admin' });
  if (!c || !c.modulos.some(m => m.aulas.some(a => a.id === aulaId && a.tipo === 'teste'))) return { erro: 'Teste não encontrado.' };
  const { podeAssistir } = await import('@/lib/aluno');
  if (!(await podeAssistir(u, c, aulaId))) return { erro: 'Sem acesso.' };
  const { data } = await db().from('aulas').select('questoes').eq('id', aulaId).single();
  const qs = (data?.questoes || []) as { correta: number }[];
  const certas = qs.map((q, i) => respostas[i] === q.correta);
  return { certas, gabarito: qs.map(q => q.correta), acertos: certas.filter(Boolean).length, total: qs.length };
}
