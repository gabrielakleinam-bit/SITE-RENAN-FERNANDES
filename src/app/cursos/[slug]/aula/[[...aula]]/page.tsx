import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { buscarCurso, duvidasDoCurso } from '@/lib/catalogo';
import { statsCurso } from '@/lib/duracao';
import { SalaDeAula } from '@/components/SalaDeAula';

type Props = { params: Promise<{ slug: string; aula?: string[] }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const c = await buscarCurso((await params).slug);
  return c ? { title: `Aula · ${c.titulo}` } : {};
}

/* M1: o conteúdo da aula vai para o navegador e o bloqueio é só visual.
   M3: a aula só é entregue pelo servidor com matrícula liberada (RLS) e URL de vídeo assinada. */
export default async function PaginaAula({ params }: Props) {
  const { slug, aula } = await params;
  const c = await buscarCurso(slug);
  if (!c) notFound();
  const s = statsCurso(c);
  const aulaId = aula?.[0] || c.modulos[0]?.aulas[0]?.id || '';
  return <SalaDeAula curso={c} aulaId={aulaId} aulas={s.aulas} sec={s.sec} duvidas={await duvidasDoCurso(c.id)} />;
}
