import { NextResponse } from 'next/server';
import { adminOuNulo, auditar } from '@/lib/sessao';
import { db } from '@/lib/supabase/servidor';
import { apagarVideo } from '@/lib/bunny';
import { YOUTUBE_KEY } from '@/lib/config';
import { isoParaSeg, ytId } from '@/lib/youtube';

/* Liga um vídeo do YouTube à aula. A duração vem do player (lida no navegador do admin) ou,
   se houver chave, da YouTube Data API v3 (contentDetails.duration). */
export async function POST(req: Request) {
  const adm = await adminOuNulo();
  if (!adm) return NextResponse.json({ erro: 'Sem permissão.' }, { status: 403 });
  const { aulaId, url, duracao } = await req.json();
  const id = ytId(url);
  if (!id) return NextResponse.json({ erro: 'Link do YouTube inválido. Cole o endereço do vídeo (youtube.com/watch?v=… ou youtu.be/…).' }, { status: 400 });
  let seg = Math.round(Number(duracao) || 0);
  if (YOUTUBE_KEY) {
    try {
      const r = await fetch(`https://www.googleapis.com/youtube/v3/videos?part=contentDetails&id=${id}&key=${YOUTUBE_KEY}`, { cache: 'no-store' });
      const j = await r.json();
      const s = isoParaSeg(j.items?.[0]?.contentDetails?.duration || '');
      if (s) seg = s;
    } catch { /* fica a duração lida no navegador */ }
  }
  const { data: aula } = await db().from('aulas').select('video_fonte, video_ref').eq('id', aulaId).maybeSingle();
  if (!aula) return NextResponse.json({ erro: 'Aula não encontrada.' }, { status: 404 });
  await db().from('aulas').update({
    video_fonte: 'youtube', video_ref: `https://www.youtube.com/watch?v=${id}`, video_status: seg ? 'pronto' : 'erro', duracao_seg: seg || null,
  }).eq('id', aulaId);
  if (aula.video_fonte === 'bunny' && aula.video_ref) await apagarVideo(aula.video_ref);
  await auditar(adm.id, 'video_youtube', aulaId, { id });
  return NextResponse.json({ ok: true, duracao: seg, estado: seg ? 'pronto' : 'erro' });
}
