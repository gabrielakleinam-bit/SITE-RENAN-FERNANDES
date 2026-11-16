import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { buscarCurso, conteudoAula } from '@/lib/catalogo';
import { statsCurso } from '@/lib/duracao';
import { usuarioAtual } from '@/lib/sessao';
import { podeAssistir } from '@/lib/aluno';
import { db } from '@/lib/supabase/servidor';
import { urlHls } from '@/lib/bunny';
import { ytId } from '@/lib/youtube';
import { SalaDeAula, type Conteudo, type DuvidaMini } from '@/components/SalaDeAula';

type Props = { params: Promise<{ slug: string; aula?: string[] }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const c = await buscarCurso((await params).slug, { rascunho: true });
  return c ? { title: `Aula · ${c.titulo}`, robots: { index: false } } : {};
}

/* O conteúdo da aula só sai do servidor para quem pode assistir (matrícula liberada, amostra ou admin).
   O vídeo enviado vai por link assinado de validade curta. */
export default async function PaginaAula({ params }: Props) {
  const { slug, aula } = await params;
  const u = await usuarioAtual();
  const c = await buscarCurso(slug, { rascunho: u?.papel === 'admin' });
  if (!c) notFound();
  const todas = c.modulos.flatMap(m => m.aulas);
  if (!todas.length) notFound();
  const a = todas.find(x => x.id === aula?.[0]) || todas.find(x => x.tipo !== 'teste') || todas[0];
  const s = statsCurso(c);

  let conteudo: Conteudo = { tipo: 'bloqueada' };
  let blocos = '';
  if (await podeAssistir(u, c, a.id)) {
    const k = await conteudoAula(a.id);
    if (a.tipo === 'video') {
      if (!k?.video_ref) conteudo = { tipo: 'semvideo' };
      else if (k.video_status !== 'pronto' || !k.duracao_seg) conteudo = { tipo: 'processando' };
      else if (k.video_fonte === 'youtube') conteudo = { tipo: 'video', midia: { tipo: 'yt', id: ytId(k.video_ref) }, duracao: k.duracao_seg };
      else conteudo = { tipo: 'video', midia: { tipo: 'hls', url: urlHls(k.video_ref) }, duracao: k.duracao_seg };
    } else if (a.tipo === 'texto') conteudo = { tipo: 'texto', texto: k?.texto || '' };
    else if (a.tipo === 'material') {
      const path = k?.material_path;
      const url = path ? (await db().storage.from('materiais').createSignedUrl(path, 3600)).data?.signedUrl || null : null;
      conteudo = { tipo: 'material', url, nome: path ? path.split('/').pop()!.replace(/^\d+-/, '') : '' };
    } else conteudo = { tipo: 'teste', questoes: ((k?.questoes || []) as { pergunta: string; opcoes: string[] }[]).map(q => ({ pergunta: q.pergunta, opcoes: q.opcoes })) };
    if (u) {
      const { data: p } = await db().from('progresso_aula').select('blocos').eq('usuario_id', u.id).eq('aula_id', a.id).maybeSingle();
      blocos = p?.blocos || '';
    }
  }

  let duvidas: DuvidaMini[] = [];
  if (u) {
    const { data } = await db().from('duvidas').select('id, titulo, status, mensagens(count)').eq('usuario_id', u.id).eq('curso_id', c.uuid).order('atualizada_em', { ascending: false }).limit(3);
    duvidas = (data || []).map(d => ({ id: d.id, titulo: d.titulo, status: d.status, mensagens: (d.mensagens as unknown as { count: number }[])[0]?.count || 0 }));
  }

  return <SalaDeAula curso={c} aulaId={a.id} conteudo={conteudo} blocos={blocos} aulas={s.aulas} sec={s.sec} duvidas={duvidas} />;
}
