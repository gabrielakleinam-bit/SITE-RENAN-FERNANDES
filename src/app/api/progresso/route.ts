import { NextResponse } from 'next/server';
import { usuarioAtual } from '@/lib/sessao';
import { db } from '@/lib/supabase/servidor';
import { aplicarTick } from '@/lib/presenca-servidor';
import { buscarCurso } from '@/lib/catalogo';
import { podeAssistir } from '@/lib/aluno';

/* Registra a presença do aluno na aula.
   { aulaId, curso, pos, evento: 'tick' | 'seek' }  ou  { aulaId, curso, concluir: true } (texto e material) */
export async function POST(req: Request) {
  const u = await usuarioAtual();
  if (!u) return NextResponse.json({ erro: 'Entre na sua conta.' }, { status: 401 });
  const b = await req.json();
  const curso = await buscarCurso(String(b.curso || ''), { rascunho: u.papel === 'admin' });
  const aula = curso?.modulos.flatMap(m => m.aulas).find(a => a.id === b.aulaId);
  if (!curso || !aula) return NextResponse.json({ erro: 'Aula não encontrada.' }, { status: 404 });
  if (!(await podeAssistir(u, curso, aula.id))) return NextResponse.json({ erro: 'Sem acesso.' }, { status: 403 });
  if (u.papel === 'admin') return NextResponse.json({ ok: true, pct: 0, concluida: false, blocos: '' });

  const agora = Date.now();
  const { data: atual } = await db().from('progresso_aula').select('blocos, ultima_posicao, concluida_em, atualizado_em')
    .eq('usuario_id', u.id).eq('aula_id', aula.id).maybeSingle();

  if (b.concluir) {
    if (aula.tipo !== 'texto' && aula.tipo !== 'material') return NextResponse.json({ erro: 'Use o vídeo.' }, { status: 400 });
    await db().from('progresso_aula').upsert({ usuario_id: u.id, aula_id: aula.id, blocos: '1', ultima_posicao: 0, concluida_em: atual?.concluida_em || new Date().toISOString(), atualizado_em: new Date().toISOString() });
    return NextResponse.json({ ok: true, pct: 100, concluida: true, blocos: '1' });
  }

  const dur = aula.duracaoSeg || 0;
  if (aula.tipo !== 'video' || !dur) return NextResponse.json({ erro: 'Aula sem vídeo.' }, { status: 400 });
  const r = aplicarTick(
    { blocos: atual?.blocos || '', ultima: Number(atual?.ultima_posicao || 0), atualizado: atual ? new Date(atual.atualizado_em).getTime() : agora },
    Number(b.pos) || 0, agora, dur, b.evento === 'tick' && atual ? 'tick' : 'seek',
  );
  const concluidaEm = atual?.concluida_em || (r.concluida ? new Date(agora).toISOString() : null);
  await db().from('progresso_aula').upsert({
    usuario_id: u.id, aula_id: aula.id, blocos: r.blocos, ultima_posicao: r.ultima, concluida_em: concluidaEm, atualizado_em: new Date(agora).toISOString(),
  });
  await db().from('perfis').update({ ultimo_acesso: new Date(agora).toISOString() }).eq('id', u.id);
  return NextResponse.json({ ok: true, pct: r.pct, concluida: !!concluidaEm, blocos: r.blocos });
}
