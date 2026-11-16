'use client';
import Link from 'next/link';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useApp } from './App';
import { Capa } from './Capa';
import { brl, fmtTotal } from '@/lib/duracao';
import type { Curso, Formacao } from '@/lib/tipos';

export interface CursoResumo { curso: Curso; aulas: number; sec: number }

/* ---------- carrossel: um slide por curso, com o diagnóstico na 2ª posição ----------
   Troca a cada 7 s, pausa com mouse em cima ou foco, setas, bolinhas e arrastar no celular. */
export function Carrossel({ itens }: { itens: CursoResumo[] }) {
  const { tem, feitas, admin } = useApp();
  const slides: (CursoResumo | 'diag')[] = [...itens];
  slides.splice(Math.min(1, slides.length), 0, 'diag');
  const n = slides.length;
  const [i, setI] = useState(0);
  const pausado = useRef(false);
  const x0 = useRef<number | null>(null);
  const [ciclo, setCiclo] = useState(0); // reinicia o timer após interação

  const ir = useCallback((k: number) => { setI(((k % n) + n) % n); setCiclo(c => c + 1); }, [n]);

  useEffect(() => {
    const t = setInterval(() => { if (!pausado.current && !document.hidden) setI(x => (x + 1) % n); }, 7000);
    return () => clearInterval(t);
  }, [n, ciclo]);

  return (
    <div className="car" role="region" aria-roledescription="carrossel" aria-label="Cursos em destaque"
      onMouseEnter={() => (pausado.current = true)} onMouseLeave={() => (pausado.current = false)}
      onFocus={() => (pausado.current = true)} onBlur={() => (pausado.current = false)}
      onTouchStart={e => (x0.current = e.touches[0].clientX)}
      onTouchEnd={e => {
        if (x0.current === null) return;
        const dx = e.changedTouches[0].clientX - x0.current;
        if (Math.abs(dx) > 40) ir(i + (dx < 0 ? 1 : -1));
        x0.current = null;
      }}>
      <div className="car-viewport">
        <div className="car-track" style={{ transform: `translateX(-${i * 100}%)` }}>
          {slides.map((it, k) => {
            const lab = { 'aria-roledescription': 'slide', 'aria-label': `${k + 1} de ${n}`, 'aria-hidden': k !== i } as const;
            if (it === 'diag') return (
              <article className="slide" key="diag" {...lab}>
                <div className="s-vis s-vis-diag">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/img/ilustracao-clara.webp" alt="" />
                </div>
                <div className="s-txt">
                  <small className="s-cat">Grátis · 6 perguntas · 2 minutos</small>
                  <h3>Não sabe por onde começar?</h3>
                  <p>Responda o diagnóstico: ele desenha a sua teia de competências e indica os treinamentos que fazem mais sentido para você.</p>
                  <div className="s-act"><Link className="btn btn-oleo" href="/diagnostico" tabIndex={k === i ? 0 : -1}>Fazer o teste agora</Link></div>
                </div>
              </article>
            );
            const c = it.curso, meu = tem(c.id) && !admin, p = meu ? Math.min(100, Math.round((feitas(c.id) / Math.max(1, it.aulas)) * 100)) : null;
            return (
              <article className="slide" key={c.id} {...lab}>
                <div className="s-vis"><Capa curso={c} className="s-cover" k="s" /></div>
                <div className="s-txt">
                  <small className="s-cat">{c.formacao} · {c.professor}</small>
                  <h3>{c.titulo}</h3>
                  <p>{c.resumo}</p>
                  <div className="s-facts"><span>{it.aulas} aulas</span><span>{fmtTotal(it.sec)} de vídeo</span><span>{brl(c.preco)}</span></div>
                  {p !== null && <>
                    <div className="s-prog" role="img" aria-label={`Progresso ${p}%`}><b style={{ width: `${p}%` }} /></div>
                    <small className="s-pl">{p}% concluído</small>
                  </>}
                  <div className="s-act">
                    <Link className="btn btn-oleo" href={meu ? `/cursos/${c.id}/aula` : `/cursos/${c.id}`} tabIndex={k === i ? 0 : -1}>
                      {meu ? 'Continuar o curso' : 'Conhecer o curso'}
                    </Link>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </div>
      <div className="car-bar">
        <div className="car-dots">
          {slides.map((it, k) => (
            <button key={k} aria-current={k === i ? 'true' : 'false'} onClick={() => ir(k)}
              aria-label={`Ir para ${it === 'diag' ? 'o diagnóstico' : it.curso.titulo}`} />
          ))}
        </div>
        <div className="car-btns">
          <button aria-label="Destaque anterior" onClick={() => ir(i - 1)}>&#8249;</button>
          <button aria-label="Próximo destaque" onClick={() => ir(i + 1)}>&#8250;</button>
        </div>
      </div>
    </div>
  );
}

/* ---------- catálogo com filtro por formação ---------- */
export function Catalogo({ itens }: { itens: CursoResumo[] }) {
  const [f, setF] = useState<'Todos' | Formacao>('Todos');
  const cats = ['Todos', ...new Set(itens.map(x => x.curso.formacao))] as ('Todos' | Formacao)[];
  return (
    <>
      <div className="chips" role="toolbar" aria-label="Filtrar por área">
        {cats.map(c => <button key={c} className="chip" aria-pressed={c === f} onClick={() => setF(c)}>{c}</button>)}
      </div>
      <div className="catalog">
        {itens.filter(x => f === 'Todos' || x.curso.formacao === f).map(({ curso: c, aulas, sec }) => (
          <Link className="row" key={c.id} href={`/cursos/${c.id}`}>
            <span className="thumb thumb-cover"><Capa curso={c} className="tc" k="t" center /></span>
            <span>
              <h3>{c.titulo}</h3>
              <span className="meta" style={{ display: 'block' }}>{c.professor}. {aulas} aulas · {fmtTotal(sec)} de vídeo.</span>
              <span className="axes" style={{ display: 'block' }}>{c.eixos.length} competências: {c.eixos.slice(0, 3).join(', ')} e mais</span>
            </span>
            <span className="price"><strong>{brl(c.preco)}</strong><small>12x de {brl(c.preco / 12)}</small></span>
          </Link>
        ))}
      </div>
    </>
  );
}

export { BotaoComprar } from './Compra';

export function VerCursos() {
  return (
    <button className="btn btn-ghost" onClick={() => document.getElementById('catalogSection')?.scrollIntoView({ behavior: 'smooth' })}>
      Ver cursos
    </button>
  );
}

export function useUltimoCurso(id: string) {
  const { setUltimoCurso } = useApp();
  useEffect(() => setUltimoCurso(id), [id, setUltimoCurso]);
}

export function MarcaUltimoCurso({ id }: { id: string }) { useUltimoCurso(id); return null; }

