'use client';
import Link from 'next/link';
import { useApp } from './App';
import { Capa } from './Capa';
import { BotaoComprar, useUltimoCurso } from './Inicio';
import { brl, rotuloAula } from '@/lib/duracao';
import type { Curso } from '@/lib/tipos';

/** Quadro de compra: muda conforme o aluno tem o curso, está aguardando liberação ou ainda não comprou. */
export function QuadroCompra({ curso: c }: { curso: Curso }) {
  const { tem, aguardando, pronto } = useApp();
  useUltimoCurso(c.id);
  const primeira = `/cursos/${c.id}/aula`;
  let corpo: React.ReactNode;
  if (pronto && tem(c.id)) corpo = <>
    <span className="owned-tag">Você tem este curso</span>
    <Link className="btn btn-oleo full" href={primeira}>Continuar assistindo</Link>
    <Link className="btn btn-quiet full" href="/diagnostico">Ver minha teia</Link>
  </>;
  else if (pronto && aguardando(c.id)) corpo = <>
    <span className="owned-tag" style={{ background: '#FDF0E1', color: '#8A4B12' }}>Pagamento recebido</span>
    <p className="muted" style={{ fontSize: 14, margin: '0 0 12px' }}>Aguardando a liberação da entrada pela equipe. Você recebe um aviso por e-mail assim que as aulas estiverem disponíveis.</p>
    <Link className="btn btn-quiet full" href={primeira}>Assistir aula de amostra</Link>
  </>;
  else corpo = <>
    <div className="big">{brl(c.preco)}</div>
    <div className="inst">ou 12x de {brl(c.preco / 12)} no cartão</div>
    <BotaoComprar className="btn btn-oleo full" rotulo="Comprar curso" titulo={c.titulo} />
    <Link className="btn btn-quiet full" href={primeira}>Assistir aula de amostra</Link>
    <ul><li>Pix, cartão ou boleto</li><li>Demonstrações com câmera nas mãos</li><li>Acesso por 12 meses</li><li>Diagnóstico de entrada e saída</li><li>7 dias para pedir reembolso</li></ul>
  </>;
  return (
    <div className="buybox">
      <div className="bb-cover"><Capa curso={c} className="bb-c" k="b" /></div>
      {corpo}
    </div>
  );
}

export function ListaModulos({ curso: c }: { curso: Curso }) {
  const { concluida } = useApp();
  return (
    <div>
      {c.modulos.map((m, i) => (
        <details className="mod" key={m.id} open={i === 0}>
          <summary>{m.titulo}<span>{m.aulas.length} itens</span></summary>
          {m.aulas.map(l => (
            <div key={l.id} className={`lesson${l.tipo === 'teste' ? ' quiz' : ''}${concluida(c.id, l.id) ? ' done' : ''}`}>
              <div>{l.titulo}</div><span>{rotuloAula(l)}</span>
            </div>
          ))}
        </details>
      ))}
    </div>
  );
}
