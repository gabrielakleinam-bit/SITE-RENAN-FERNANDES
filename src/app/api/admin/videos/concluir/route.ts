import { NextResponse } from 'next/server';
import { adminOuNulo, auditar } from '@/lib/sessao';
import { db } from '@/lib/supabase/servidor';
import { apagarVideo } from '@/lib/bunny';

/* O navegador terminou de enviar: liga o vídeo novo à aula e apaga o antigo (a ordem e o progresso dos alunos ficam). */
export async function POST(req: Request) {
  const adm = await adminOuNulo();
  if (!adm) return NextResponse.json({ erro: 'Sem permissão.' }, { status: 403 });
  const { aulaId, guid } = await req.json();
  if (!/^[0-9a-f-]{36}$/i.test(guid || '')) return NextResponse.json({ erro: 'Vídeo inválido.' }, { status: 400 });
  const { data: aula } = await db().from('aulas').select('id, video_fonte, video_ref').eq('id', aulaId).maybeSingle();
  if (!aula) return NextResponse.json({ erro: 'Aula não encontrada.' }, { status: 404 });
  const { error } = await db().from('aulas').update({
    video_fonte: 'bunny', video_ref: guid, video_status: 'processando', duracao_seg: null,
  }).eq('id', aulaId);
  if (error) return NextResponse.json({ erro: 'Não foi possível salvar.' }, { status: 500 });
  if (aula.video_fonte === 'bunny' && aula.video_ref && aula.video_ref !== guid) await apagarVideo(aula.video_ref);
  await auditar(adm.id, 'enviar_video', aulaId, { guid });
  return NextResponse.json({ ok: true });
}
