'use server';
/* Compra de curso ou pacote.
   Pagar NÃO libera a aula: cria um pedido "aguardando" para o admin conferir o Pix e liberar a entrada.
   O preço é sempre calculado aqui no servidor. */
import QRCode from 'qrcode';
import { revalidatePath } from 'next/cache';
import { usuarioAtual } from '@/lib/sessao';
import { db } from '@/lib/supabase/servidor';
import { PIX } from '@/lib/config';
import { payloadPix } from '@/lib/pix';

type Alvo = { curso?: string; pacote?: string };

async function itemDaCompra(usuarioId: string, alvo: Alvo) {
  if (alvo.pacote) {
    const { data: p } = await db().from('pacotes').select('id, titulo, preco, ativo, pacote_cursos(curso_id)').eq('id', alvo.pacote).maybeSingle();
    if (!p || !p.ativo) return null;
    const ids = (p.pacote_cursos as { curso_id: string }[]).map(x => x.curso_id);
    const { data: ja } = await db().from('matriculas').select('curso_id').eq('usuario_id', usuarioId).eq('status', 'ativo').in('curso_id', ids);
    const tem = new Set((ja || []).map(x => x.curso_id));
    return { titulo: 'Pacote ' + p.titulo, valor: Number(p.preco), cursos: ids.filter(id => !tem.has(id)), pacoteId: p.id as string };
  }
  const { data: c } = await db().from('cursos').select('id, titulo, preco, publicado, arquivado').eq('slug', alvo.curso || '').maybeSingle();
  if (!c || !c.publicado || c.arquivado) return null;
  return { titulo: c.titulo as string, valor: Number(c.preco), cursos: [c.id as string], pacoteId: null };
}

export async function gerarPix(alvo: Alvo) {
  const u = await usuarioAtual();
  if (!u) return { erro: 'Entre na sua conta para comprar.' };
  const it = await itemDaCompra(u.id, alvo);
  if (!it) return { erro: 'Este item não está disponível.' };
  if (!it.cursos.length) return { erro: 'Você já tem todos os cursos deste pacote.' };
  if (!PIX.chave) return { titulo: it.titulo, valor: it.valor, semPix: true as const };
  const txid = 'RF' + Math.random().toString(36).slice(2, 10).toUpperCase();
  const payload = payloadPix({ chave: PIX.chave, nome: PIX.nome, cidade: PIX.cidade, valor: it.valor, txid });
  const qr = await QRCode.toDataURL(payload, { margin: 1, width: 360, color: { dark: '#12161B', light: '#FFFFFF' } });
  return { titulo: it.titulo, valor: it.valor, payload, qr, txid };
}

export async function confirmarPagamento(alvo: Alvo & { metodo: 'pix'; txid?: string }) {
  const u = await usuarioAtual();
  if (!u) return { erro: 'Entre na sua conta para comprar.' };
  const it = await itemDaCompra(u.id, alvo);
  if (!it || !it.cursos.length) return { erro: 'Este item não está disponível.' };

  // evita pedidos repetidos para o mesmo item enquanto o primeiro aguarda conferência
  const { data: abertos } = await db().from('pedidos').select('id, pedido_cursos(curso_id)').eq('usuario_id', u.id).eq('status', 'aguardando');
  const mesmo = (abertos || []).find(p => {
    const ids = (p.pedido_cursos as { curso_id: string }[]).map(x => x.curso_id).sort().join();
    return ids === [...it.cursos].sort().join();
  });
  if (mesmo) return { ok: true, pedido: mesmo.id as string };

  const { data: ped, error } = await db().from('pedidos').insert({
    usuario_id: u.id, valor: it.valor, metodo: alvo.metodo, pacote_id: it.pacoteId,
    descricao: it.titulo + (alvo.txid ? ` · Pix ${alvo.txid}` : ''),
  }).select('id').single();
  if (error) return { erro: 'Não foi possível registrar o pedido. Tente de novo.' };
  await db().from('pedido_cursos').insert(it.cursos.map(c => ({ pedido_id: ped.id, curso_id: c })));
  await db().from('matriculas').upsert(it.cursos.map(c => ({ usuario_id: u.id, curso_id: c, status: 'aguardando' })), { onConflict: 'usuario_id,curso_id', ignoreDuplicates: true });
  revalidatePath('/', 'layout');
  return { ok: true, pedido: ped.id as string };
}
