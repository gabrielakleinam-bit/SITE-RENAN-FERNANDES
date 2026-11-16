import { usuarioAtual } from '@/lib/sessao';
import { db } from '@/lib/supabase/servidor';

/* LGPD: exportação dos dados do aluno em JSON. */
export async function GET() {
  const u = await usuarioAtual();
  if (!u) return new Response('Entre na sua conta.', { status: 401 });
  const t = (tab: string, cols = '*') => db().from(tab).select(cols).eq('usuario_id', u.id).then(r => r.data || []);
  const [perfil, pedidos, matriculas, progresso, duvidas, certificados, diagnosticos] = await Promise.all([
    db().from('perfis').select('*').eq('id', u.id).maybeSingle().then(r => r.data),
    t('pedidos'), t('matriculas'), t('progresso_aula'), t('duvidas', '*, mensagens(texto, professor, criada_em)'), t('certificados'), t('diagnosticos'),
  ]);
  const corpo = JSON.stringify({ exportado_em: new Date().toISOString(), perfil, pedidos, matriculas, progresso, duvidas, certificados, diagnosticos }, null, 2);
  return new Response(corpo, { headers: { 'content-type': 'application/json; charset=utf-8', 'content-disposition': 'attachment; filename="meus-dados.json"', 'cache-control': 'no-store' } });
}
