import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { buscarCurso, listarCursos } from '@/lib/catalogo';
import { fmtTotal, statsCurso } from '@/lib/duracao';
import { Teia } from '@/components/Teia';
import { ListaModulos, QuadroCompra } from '@/components/Curso';

type Props = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  return (await listarCursos()).map(c => ({ slug: c.id }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const c = await buscarCurso((await params).slug);
  return c ? { title: c.titulo, description: c.resumo } : {};
}

export default async function PaginaCurso({ params }: Props) {
  const c = await buscarCurso((await params).slug);
  if (!c) notFound();
  const s = statsCurso(c);

  return (
    <>
      <div className="course-hero">
        <div className="wrap course-grid">
          <div>
            <Link className="crumb" href="/#catalogSection">Voltar para cursos</Link>
            <h1>{c.titulo}</h1>
            <div className="teacher">
              <div className="pic" aria-hidden="true" />
              <div><strong>{c.professor}</strong><small>Professor</small></div>
            </div>
            <div className="facts">
              <span>{fmtTotal(s.sec)} de vídeo</span>
              <span>{s.aulas} aulas</span>
              {c.nota && <><span>Nota {c.nota.toFixed(1).replace('.', ',')}</span><span>{c.alunos?.toLocaleString('pt-BR')} alunos</span></>}
              <span>Certificado de curso livre</span>
            </div>
            <div className="c-about">
              <p>{c.resumo}</p>
              <p><b>Para quem é:</b> {c.paraQuem}</p>
              {c.instrucoes && <p><b>Instruções:</b> {c.instrucoes}</p>}
              <p className="aviso-saude">Conteúdo educativo. Este curso não substitui avaliação médica ou fisioterapêutica; em caso de dor forte, persistente ou que irradia, procure um profissional de saúde.</p>
            </div>
          </div>
          <QuadroCompra curso={c} />
        </div>
      </div>
      <div className="wrap two">
        <div className="panel">
          <h2>Conteúdo do curso</h2>
          <p className="sub">{c.modulos.length} módulos, testes ao fim de cada um e avaliação final.</p>
          <ListaModulos curso={c} />
        </div>
        <div className="panel">
          <h2>Competências</h2>
          <p className="sub">Os eixos que o professor definiu. Seu diagnóstico mede cada um antes e depois.</p>
          <Teia style={{ background: 'var(--mata)', borderRadius: 16, padding: 6 }} eixos={c.eixos}
            series={[{ values: c.eixos.map(() => 100), color: '#4FA3F0', fillOp: 0.08 }]}
            opcoes={{ w: 340, h: 300, labels: true, pad: 70, fs: 12, aria: 'Competências do curso' }} />
        </div>
      </div>
    </>
  );
}
