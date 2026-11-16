'use server';
/* Ações do painel: liberar entrada, certificados e dúvidas. */
import { randomBytes } from 'node:crypto';
import { revalidatePath } from 'next/cache';
import { exigirAdmin, auditar } from '@/lib/sessao';
import { db } from '@/lib/supabase/servidor';
import { avisar } from '@/lib/email';

async function emailDe(usuarioId: string) {
  const { data } = await db().from('perfis').select('email, nome').eq('id', usuarioId).maybeSingle();
  return data;
}

export async function decidirPedido(pedidoId: string, liberar: boolean) {
  const adm = await exigirAdmin();
  const { error } = await db().rpc('decidir_pedido', { p_pedido: pedidoId, p_liberar: liberar, p_admin: adm.id });
  if (error) return { erro: 'Este pedido já foi decidido.' };
  const { data: p } = await db().from('pedidos').select('usuario_id, descricao').eq('id', pedidoId).single();
  const pessoa = await emailDe(p!.usuario_id);
  if (pessoa) {
    if (liberar) await avisar(pessoa.email, 'Suas aulas estão liberadas', `Olá, ${pessoa.nome}. A sua entrada em "${p!.descricao.split(' · ')[0]}" foi liberada. Bom estudo!`, '/');
    else await avisar(pessoa.email, 'Sobre o seu pedido', `Olá, ${pessoa.nome}. Não conseguimos confirmar o pagamento de "${p!.descricao.split(' · ')[0]}". Responda pelo site, em Dúvidas, ou fale com a equipe.`);
  }
  revalidatePath('/admin', 'layout');
  return { ok: true };
}

export async function decidirCertificado(id: string, aprovar: boolean) {
  const adm = await exigirAdmin();
  const { data: c } = await db().from('certificados').select('usuario_id, titulo_curso, status').eq('id', id).maybeSingle();
  if (!c || c.status !== 'pendente') return { erro: 'Este pedido já foi decidido.' };
  const codigo = aprovar ? 'RF-' + randomBytes(4).toString('hex').toUpperCase() : null;
  await db().from('certificados').update({
    status: aprovar ? 'aprovado' : 'negado', codigo, emitido_em: aprovar ? new Date().toISOString() : null, decidido_por: adm.id,
  }).eq('id', id);
  await auditar(adm.id, aprovar ? 'aprovar_certificado' : 'negar_certificado', id, { codigo });
  const pessoa = await emailDe(c.usuario_id);
  if (pessoa && aprovar) await avisar(pessoa.email, 'Seu certificado foi emitido', `Olá, ${pessoa.nome}. O certificado do curso "${c.titulo_curso}" está pronto. Código de validação: ${codigo}.`, `/certificados/${codigo}`);
  revalidatePath('/admin', 'layout');
  return { ok: true };
}

export async function salvarModeloCertificado(m: { cor: string; nome_y: number; curso_y: number; horas_y: number; rodape_y: number }) {
  const adm = await exigirAdmin();
  const lim = (v: number) => Math.max(5, Math.min(97, Number(v) || 50));
  await db().from('modelo_certificado').update({
    cor: /^#[0-9a-f]{6}$/i.test(m.cor) ? m.cor : '#12161B', nome_y: lim(m.nome_y), curso_y: lim(m.curso_y), horas_y: lim(m.horas_y), rodape_y: lim(m.rodape_y),
  }).eq('id', 1);
  await auditar(adm.id, 'modelo_certificado');
  revalidatePath('/admin/certificados');
  return { ok: true };
}

export async function enviarArteCertificado(form: FormData) {
  await exigirAdmin();
  const f = form.get('arquivo');
  if (!(f instanceof File) || !f.size) return { erro: 'Escolha uma imagem.' };
  if (!/^image\/(jpeg|png)$/.test(f.type)) return { erro: 'Use PNG ou JPG, A4 deitado.' };
  if (f.size > 10 * 1024 * 1024) return { erro: 'A imagem precisa ter até 10 MB.' };
  const caminho = `modelo/${Date.now()}.${f.type === 'image/png' ? 'png' : 'jpg'}`;
  const { error } = await db().storage.from('certificados').upload(caminho, f, { contentType: f.type });
  if (error) return { erro: 'Não foi possível enviar.' };
  const url = db().storage.from('certificados').getPublicUrl(caminho).data.publicUrl;
  await db().from('modelo_certificado').update({ imagem_url: url }).eq('id', 1);
  revalidatePath('/admin/certificados');
  return { url };
}

export async function usarModeloPadrao() {
  await exigirAdmin();
  await db().from('modelo_certificado').update({ imagem_url: null }).eq('id', 1);
  revalidatePath('/admin/certificados');
}

export async function responderDuvida(duvidaId: number, texto: string) {
  const adm = await exigirAdmin();
  if (!texto.trim()) return { erro: 'Escreva a resposta.' };
  const { data: d } = await db().from('duvidas').select('usuario_id, titulo').eq('id', duvidaId).maybeSingle();
  if (!d) return { erro: 'Dúvida não encontrada.' };
  await db().from('mensagens').insert({ duvida_id: duvidaId, autor_id: adm.id, professor: true, texto: texto.slice(0, 4000) });
  await db().from('duvidas').update({ status: 'respondida', atualizada_em: new Date().toISOString() }).eq('id', duvidaId);
  const pessoa = await emailDe(d.usuario_id);
  if (pessoa) await avisar(pessoa.email, 'O professor respondeu sua dúvida', `Olá, ${pessoa.nome}. O Renan respondeu: "${d.titulo}".`, `/duvidas?d=${duvidaId}`);
  revalidatePath('/admin/duvidas');
  return { ok: true };
}

export async function resolverDuvida(duvidaId: number) {
  await exigirAdmin();
  await db().from('duvidas').update({ status: 'resolvida', atualizada_em: new Date().toISOString() }).eq('id', duvidaId);
  revalidatePath('/admin/duvidas');
  return { ok: true };
}
