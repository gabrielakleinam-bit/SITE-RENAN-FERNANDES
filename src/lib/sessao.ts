import 'server-only';
import { cache } from 'react';
import { redirect } from 'next/navigation';
import { clienteSessao, db } from './supabase/servidor';
import { supabaseConfigurado } from './config';

export interface Usuario { id: string; email: string; nome: string; papel: 'aluno' | 'admin' }

/** Usuário logado (ou null). O papel vem do banco, nunca do código. */
export const usuarioAtual = cache(async (): Promise<Usuario | null> => {
  if (!supabaseConfigurado()) return null;
  const sb = await clienteSessao();
  const { data } = await sb.auth.getUser();
  const u = data.user;
  if (!u) return null;
  const { data: p } = await db().from('perfis').select('nome, email, papel').eq('id', u.id).maybeSingle();
  if (!p) return { id: u.id, email: u.email || '', nome: (u.email || '').split('@')[0], papel: 'aluno' };
  return { id: u.id, email: p.email, nome: p.nome, papel: p.papel };
});

export async function exigirUsuario(voltar = '/') {
  const u = await usuarioAtual();
  if (!u) redirect(`/entrar?voltar=${encodeURIComponent(voltar)}`);
  return u;
}

export async function exigirAdmin() {
  const u = await usuarioAtual();
  if (!u) redirect('/entrar?voltar=/admin');
  if (u.papel !== 'admin') redirect('/');
  return u;
}

/** Para rotas de API: devolve o admin ou null (a rota responde 403). */
export async function adminOuNulo() {
  const u = await usuarioAtual();
  return u && u.papel === 'admin' ? u : null;
}

export async function auditar(quem: string | null, acao: string, alvo = '', detalhes?: unknown) {
  await db().from('auditoria').insert({ quem, acao, alvo, detalhes: detalhes ?? null });
}
