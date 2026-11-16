import { NextResponse } from 'next/server';
import { adminOuNulo } from '@/lib/sessao';
import { db } from '@/lib/supabase/servidor';
import { situacaoVideo } from '@/lib/bunny';

/* Consulta a conversão na Bunny. Quando fica pronto, grava a duração lida do vídeo. */
export async function GET(req: Request) {
  if (!(await adminOuNulo())) return NextResponse.json({ erro: 'Sem permissão.' }, { status: 403 });
  const aulaId = new URL(req.url).searchParams.get('aulaId') || '';
  const { data: aula } = await db().from('aulas').select('id, video_fonte, video_ref, video_status, duracao_seg').eq('id', aulaId).maybeSingle();
  if (!aula) return NextResponse.json({ erro: 'Aula não encontrada.' }, { status: 404 });
  if (aula.video_fonte !== 'bunny' || !aula.video_ref || aula.video_status === 'pronto') {
    return NextResponse.json({ estado: aula.video_status, duracao: aula.duracao_seg, progresso: 100 });
  }
  try {
    const s = await situacaoVideo(aula.video_ref);
    const novo = { video_status: s.estado, duracao_seg: s.estado === 'pronto' && s.duracao ? s.duracao : aula.duracao_seg };
    if (novo.video_status !== aula.video_status || novo.duracao_seg !== aula.duracao_seg) await db().from('aulas').update(novo).eq('id', aulaId);
    return NextResponse.json({ estado: s.estado, duracao: novo.duracao_seg, progresso: s.progresso });
  } catch {
    return NextResponse.json({ estado: aula.video_status, duracao: aula.duracao_seg, progresso: 0 });
  }
}
