'use client';
import Link from 'next/link';
import { useMemo, useState } from 'react';
import { Capa } from './Capa';
import { BotaoComprar } from './Compra';
import { radar } from '@/lib/teia';
import { brl, fmtTotal } from '@/lib/duracao';
import { melhorPacote, PERGUNTAS, pontuar, type Respostas } from '@/lib/diagnostico';
import type { Curso, Pacote } from '@/lib/tipos';
import { salvarDiagnostico } from '@/app/acoes-aluno';

export interface CursoResumoDiag { curso: Curso; aulas: number; sec: number }

export function Diagnostico({ cursos, pacotes }: { cursos: CursoResumoDiag[]; pacotes: Pacote[] }) {
  const [i, setI] = useState(0);
  const [a, setA] = useState<Respostas>({});
  const [res, setRes] = useState<ReturnType<typeof pontuar> | null>(null);
  const lista = useMemo(() => PERGUNTAS.filter(q => !q.only || a.perfil === q.only), [a.perfil]);
  const q = lista[i];

  function avancar(novo: Respostas) {
    const l = PERGUNTAS.filter(x => !x.only || novo.perfil === x.only);
    if (i < l.length - 1) { setI(i + 1); return; }
    const r = pontuar(novo, cursos.map(x => ({ id: x.curso.id, formacao: x.curso.formacao })));
    setRes(r);
    void salvarDiagnostico(novo, { eixos: r.eixos, valores: r.valores }, r.ranking.slice(0, 3).map(x => x.id));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  if (res) {
    const top = res.ranking.slice(0, 3).map(x => ({ ...x, it: cursos.find(c => c.curso.id === x.id)! })).filter(x => x.it);
    const pk = melhorPacote(top.map(x => x.id), pacotes);
    const cheio = pk ? pk.cursos.reduce((s, id) => s + (cursos.find(c => c.curso.id === id)?.curso.preco || 0), 0) : 0;
    return (
      <div className="dq dq-res"><div className="dq-res-g">
        <div className="webpanel">
          <div dangerouslySetInnerHTML={{ __html: radar(res.eixos, [{ values: res.valores, color: '#E9A25F' }], { w: 420, h: 380, labels: true, dots: true, stroke: 3, pad: 84, fs: 12, aria: 'Sua teia de competências hoje' }) }} />
          <div className="legend"><span><i style={{ background: 'var(--lavanda)' }} />Você hoje</span></div>
        </div>
        <div>
          <small className="muted">Resultado do diagnóstico</small><h2>Indicados para você</h2>
          <p className="muted">A teia mostra onde você está hoje. Os treinamentos abaixo são os que mais combinam com as suas respostas.</p>
          <div className="rec">
            {top.length ? top.map((x, k) => (
              <Link className="rec-i" key={x.id} href={`/cursos/${x.id}`}>
                <Capa curso={x.it.curso} className="rec-c" k="r" center />
                <div><small>{k === 0 ? 'Mais indicado' : 'Também indicado'}</small><b>{x.it.curso.titulo}</b>
                  <span>{x.why.length ? 'Porque ' + x.why.slice(0, 2).join(' e ') : x.it.curso.resumo}</span>
                  <em>{x.it.aulas} aulas · {fmtTotal(x.it.sec)} · {brl(x.it.curso.preco)}</em></div>
              </Link>
            )) : <p className="muted">Veja o catálogo completo na <Link href="/#catalogSection">página inicial</Link>.</p>}
          </div>
          {pk && (
            <div className="rec-pack">
              <div><small>Economize no pacote</small><b>{pk.titulo}</b><span>{pk.cursos.length} cursos por {brl(pk.preco)} <s>{brl(cheio)}</s></span></div>
              <BotaoComprar className="btn btn-anil" rotulo="Quero o pacote" pacote={pk.id} />
            </div>
          )}
          <button className="btn btn-quiet" onClick={() => { setRes(null); setA({}); setI(0); }}>Refazer o diagnóstico</button>
        </div>
      </div></div>
    );
  }

  const val = a[q.k] || (q.multi ? [] : '');
  return (
    <div className="dq">
      <div className="dq-top"><small>Diagnóstico gratuito · pergunta {i + 1} de {lista.length}</small><div className="dq-bar"><b style={{ width: `${Math.round((i / lista.length) * 100)}%` }} /></div></div>
      <h2>{q.q}</h2>{q.sub && <p className="muted">{q.sub}</p>}
      <div className="dq-opts">
        {q.opts.map(([v, t]) => {
          const on = q.multi ? (val as string[]).includes(v) : val === v;
          return (
            <button key={v} className="dq-o" aria-pressed={on} onClick={() => {
              if (!q.multi) { const n = { ...a, [q.k]: v }; setA(n); avancar(n); return; }
              let sel = (a[q.k] as string[]) || [];
              sel = v === 'nenhum' ? ['nenhum'] : sel.filter(x => x !== 'nenhum');
              if (v !== 'nenhum') sel = sel.includes(v) ? sel.filter(x => x !== v) : [...sel, v];
              setA({ ...a, [q.k]: sel });
            }}><span className="dq-c">{on ? '✓' : ''}</span>{t}</button>
          );
        })}
      </div>
      <div className="dq-nav">
        <button className="btn btn-quiet" disabled={i === 0} onClick={() => setI(Math.max(0, i - 1))}>Voltar</button>
        {q.multi && <button className="btn btn-anil" disabled={!(val as string[]).length} onClick={() => avancar(a)}>{i === lista.length - 1 ? 'Ver resultado' : 'Continuar'}</button>}
      </div>
    </div>
  );
}
