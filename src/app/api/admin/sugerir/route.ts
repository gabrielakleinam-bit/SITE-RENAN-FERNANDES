import { NextResponse } from 'next/server';
import { adminOuNulo, auditar } from '@/lib/sessao';
import { db } from '@/lib/supabase/servidor';
import { GEMINI_KEY } from '@/lib/config';

/* "Sugerir com IA": rascunho de texto pelo Gemini (plano gratuito). A chave fica só no servidor. */
const LIMITE_DIA = 40;
const PEDIDO = {
  resumo: 'um resumo do curso em 2 ou 3 frases (até 300 caracteres), dizendo o que o aluno aprende',
  para_quem: 'um parágrafo curto (até 250 caracteres) dizendo para quem é o curso',
  instrucoes: 'instruções curtas para o aluno aproveitar o curso (frequência, espaço, materiais, cuidados), em até 4 frases',
} as const;

export async function POST(req: Request) {
  const adm = await adminOuNulo();
  if (!adm) return NextResponse.json({ erro: 'Sem permissão.' }, { status: 403 });
  if (!GEMINI_KEY) return NextResponse.json({ erro: 'A sugestão com IA ainda não foi configurada (GEMINI_API_KEY).' }, { status: 503 });
  const { cursoId, campo } = await req.json();
  if (!(campo in PEDIDO)) return NextResponse.json({ erro: 'Campo inválido.' }, { status: 400 });

  const desde = new Date(Date.now() - 86400000).toISOString();
  const { count } = await db().from('auditoria').select('id', { count: 'exact', head: true }).eq('acao', 'sugerir_ia').gte('quando', desde);
  if ((count || 0) >= LIMITE_DIA) return NextResponse.json({ erro: `Limite de ${LIMITE_DIA} sugestões por dia atingido. Tente amanhã.` }, { status: 429 });

  const { data: c } = await db().from('cursos').select('titulo, formacao, resumo').eq('id', cursoId).maybeSingle();
  if (!c) return NextResponse.json({ erro: 'Curso não encontrado.' }, { status: 404 });
  const { data: mods } = await db().from('modulos').select('titulo').eq('curso_id', cursoId).order('ordem');
  const prompt = `Você escreve textos para a página de um curso livre de massoterapia do professor Renan Fernandes (12 anos de experiência em Curitiba).
Curso: "${c.titulo}". Formação: ${c.formacao === 'Para terapeutas' ? 'para terapeutas e estudantes de massoterapia' : 'para leigos que querem cuidar do próprio corpo'}.
Módulos: ${(mods || []).map(m => m.titulo).filter(Boolean).join('; ') || 'ainda não definidos'}.
${c.resumo ? `Resumo atual: ${c.resumo}` : ''}
Escreva ${PEDIDO[campo as keyof typeof PEDIDO]}.
Regras: português do Brasil, tom sóbrio e profissional, sem emojis, sem exclamações, sem promessas de cura ou de resultado garantido, sem termos médicos de diagnóstico. Responda só com o texto, sem título nem aspas.`;

  try {
    const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_KEY}`, {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }], generationConfig: { temperature: 0.6, maxOutputTokens: 400 } }),
    });
    if (r.status === 429) return NextResponse.json({ erro: 'A cota gratuita da IA acabou por agora. Tente de novo mais tarde.' }, { status: 429 });
    const j = await r.json();
    const texto = (j.candidates?.[0]?.content?.parts || []).map((p: { text?: string }) => p.text || '').join('').trim().replace(/^["“]|["”]$/g, '');
    if (!texto) return NextResponse.json({ erro: 'A IA não devolveu texto. Tente de novo.' }, { status: 502 });
    await auditar(adm.id, 'sugerir_ia', cursoId, { campo });
    return NextResponse.json({ texto });
  } catch {
    return NextResponse.json({ erro: 'Não foi possível falar com a IA agora.' }, { status: 502 });
  }
}
