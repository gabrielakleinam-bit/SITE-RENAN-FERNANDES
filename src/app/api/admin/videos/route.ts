import { NextResponse } from 'next/server';
import { adminOuNulo } from '@/lib/sessao';
import { db } from '@/lib/supabase/servidor';
import { assinaturaEnvio, criarVideo } from '@/lib/bunny';
import { bunnyConfigurado } from '@/lib/config';

/* Começa o envio de um vídeo: cria o vídeo na Bunny e devolve a assinatura para o navegador enviar direto. */
export async function POST(req: Request) {
  if (!(await adminOuNulo())) return NextResponse.json({ erro: 'Sem permissão.' }, { status: 403 });
  if (!bunnyConfigurado()) return NextResponse.json({ erro: 'O envio de vídeos ainda não foi configurado (Bunny Stream). Use um link do YouTube por enquanto.' }, { status: 503 });
  const { aulaId } = await req.json();
  const { data: aula } = await db().from('aulas').select('id, titulo').eq('id', aulaId).maybeSingle();
  if (!aula) return NextResponse.json({ erro: 'Aula não encontrada.' }, { status: 404 });
  try {
    const guid = await criarVideo(aula.titulo);
    return NextResponse.json(assinaturaEnvio(guid));
  } catch (e) {
    console.error(e);
    return NextResponse.json({ erro: 'A Bunny recusou o pedido. Confira a biblioteca e a chave nas variáveis da Vercel.' }, { status: 502 });
  }
}
