'use client';
import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from './App';
import { Capa } from './Capa';
import { BotaoComprar } from './Compra';
import { useUltimoCurso } from './Inicio';
import { brl, rotuloAula } from '@/lib/duracao';
import type { Curso } from '@/lib/tipos';
import { solicitarCertificado } from '@/app/acoes-aluno';

export interface CertAluno { status: 'pendente' | 'aprovado' | 'negado'; codigo: string | null }

/** Quadro de compra: muda conforme o aluno tem o curso, está aguardando liberação ou ainda não comprou. */
export function QuadroCompra({ curso: c, aulas, cert }: { curso: Curso; aulas: number; cert: CertAluno | null }) {
  const { tem, aguardando, admin, feitas } = useApp();
  useUltimoCurso(c.id);
  const primeira = `/cursos/${c.id}/aula`;
  const pct = Math.min(100, Math.round((feitas(c.id) / Math.max(1, aulas)) * 100));
  let corpo: React.ReactNode;
  if (admin) corpo = <>
    <p className="muted" style={{ fontSize: 14, margin: '0 0 12px' }}>Pré-visualização: você vê o curso como o aluno, com todas as aulas abertas.</p>
    <Link className="btn btn-oleo full" href={primeira}>Abrir aulas</Link>
  </>;
  else if (tem(c.id)) corpo = <>
    <span className="owned-tag">Você tem este curso</span>
    <div className="s-prog" style={{ background: '#E3E7EC', margin: '0 0 6px' }} role="img" aria-label={`Progresso ${pct}%`}><b style={{ width: `${pct}%` }} /></div>
    <small className="muted" style={{ display: 'block', marginBottom: 12 }}>{pct}% concluído</small>
    <Link className="btn btn-oleo full" href={primeira}>{pct ? 'Continuar assistindo' : 'Começar o curso'}</Link>
    <Link className="btn btn-quiet full" href="/diagnostico">Ver minha teia</Link>
    <CaixaCertificado slug={c.id} pct={pct} cert={cert} />
  </>;
  else if (aguardando(c.id)) corpo = <>
    <span className="owned-tag" style={{ background: '#FDF0E1', color: '#8A4B12' }}>Pagamento recebido</span>
    <p className="muted" style={{ fontSize: 14, margin: '0 0 12px' }}>Aguardando a liberação da entrada pela equipe. Você recebe um aviso por e-mail assim que as aulas estiverem disponíveis.</p>
    <Link className="btn btn-quiet full" href={primeira}>Assistir aula de amostra</Link>
  </>;
  else corpo = <>
    <div className="big">{brl(c.preco)}</div>
    <div className="inst">pagamento por Pix</div>
    <BotaoComprar className="btn btn-oleo full" rotulo="Comprar curso" curso={c.id} />
    <Link className="btn btn-quiet full" href={primeira}>Assistir aula de amostra</Link>
    <ul><li>Primeira aula grátis</li><li>Demonstrações com câmera nas mãos</li><li>Acesso por 12 meses</li><li>Certificado de curso livre</li><li>7 dias para pedir reembolso</li></ul>
  </>;
  return (
    <div className="buybox">
      <div className="bb-cover"><Capa curso={c} className="bb-c" k="b" /></div>
      {corpo}
    </div>
  );
}

function CaixaCertificado({ slug, pct, cert }: { slug: string; pct: number; cert: CertAluno | null }) {
  const { toast } = useApp();
  const router = useRouter();
  const [ocupado, setOcupado] = useState(false);
  let corpo: React.ReactNode;
  if (cert?.status === 'aprovado' && cert.codigo) corpo = <>
    <b>Certificado emitido</b>
    <div className="acts" style={{ marginTop: 10 }}>
      <Link className="btn btn-anil btn-sm" href={`/certificados/${cert.codigo}`}>Ver certificado</Link>
      <a className="btn btn-line btn-sm" href={`/api/certificados/${cert.codigo}/pdf`}>Baixar PDF</a>
    </div>
  </>;
  else if (cert?.status === 'pendente') corpo = <><b>Certificado em análise</b><p className="muted" style={{ fontSize: 14 }}>A equipe confere e emite em breve. Você recebe um aviso por e-mail.</p></>;
  else if (pct < 100) corpo = <><b>Certificado</b><p className="muted" style={{ fontSize: 14 }}>Disponível ao concluir 100% das aulas.</p></>;
  else corpo = <>
    <b>{cert?.status === 'negado' ? 'Certificado não emitido' : 'Você concluiu o curso'}</b>
    <p className="muted" style={{ fontSize: 14 }}>{cert?.status === 'negado' ? 'O pedido anterior não foi aprovado. Fale com a equipe pelas Dúvidas ou peça de novo.' : 'Peça o seu certificado de curso livre.'}</p>
    <button className="btn btn-anil btn-sm" disabled={ocupado} onClick={async () => {
      setOcupado(true);
      const r = await solicitarCertificado(slug);
      setOcupado(false);
      if (r.erro) toast(r.erro); else { toast('Pedido enviado. O certificado fica em análise.'); router.refresh(); }
    }}>Solicitar certificado</button>
  </>;
  return <div className="cert-box">{corpo}</div>;
}

export function ListaModulos({ curso: c }: { curso: Curso }) {
  const { concluida } = useApp();
  return (
    <div>
      {c.modulos.map((m, i) => (
        <details className="mod" key={m.id} open={i === 0}>
          <summary>Módulo {i + 1}: {m.titulo}<span>{m.aulas.length} {m.aulas.length === 1 ? 'item' : 'itens'}</span></summary>
          {m.aulas.map(l => (
            <div key={l.id} className={`lesson${l.tipo === 'teste' ? ' quiz' : ''}${concluida(l.id) ? ' done' : ''}`}>
              <div>{l.titulo}</div><span>{rotuloAula(l)}</span>
            </div>
          ))}
        </details>
      ))}
    </div>
  );
}
