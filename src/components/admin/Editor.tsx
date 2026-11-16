'use client';
/* Editor de treinamento em 3 etapas: Sobre o curso · Módulos e aulas · Revisar e publicar.
   À direita, a prévia ao vivo do card como o aluno verá e o que falta para publicar.
   Cada campo é salvo sozinho (ao sair do campo); não há botão "Salvar". */
import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useApp } from '../App';
import { Capa } from '../Capa';
import { EnvioVideo } from './EnvioVideo';
import { brl, fmtClock, fmtTotal } from '@/lib/duracao';
import { checklist, MIN_MODULOS, totais, type AulaEd, type CursoEd, type ModuloEd } from '@/lib/editor';
import type { Questao } from '@/lib/tipos';
import * as A from '@/app/admin/cursos/acoes';

const I = ({ d, s = 18 }: { d: React.ReactNode; s?: number }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{d}</svg>
);
const IC = {
  video: <><rect x="2" y="6" width="14" height="12" rx="2" /><path d="M16 10l6-3v10l-6-3z" /></>,
  texto: <path d="M5 5h14M5 10h14M5 15h9" />,
  material: <><path d="M6 2h9l5 5v15H6z" /><path d="M14 2v6h6" /></>,
  teste: <><circle cx="12" cy="12" r="9" /><path d="M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.6.3-1 .8-1 1.5V14" /></>,
  up: <path d="M12 19V5M6 11l6-6 6 6" />, down: <path d="M12 5v14M6 13l6 6 6-6" />,
  x: <path d="M6 6l12 12M18 6L6 18" />, plus: <path d="M12 5v14M5 12h14" />,
  spark: <path d="M12 3l1.8 4.7L18.5 9.5 13.8 11.3 12 16l-1.8-4.7L5.5 9.5l4.7-1.8z" />,
  img: <><rect x="3" y="4" width="18" height="16" rx="2" /><circle cx="9" cy="10" r="2" /><path d="M21 16l-5-5-9 9" /></>,
};
const NOME_TIPO = { video: 'Vídeo', texto: 'Texto', material: 'Material', teste: 'Teste' };

/** Botão de excluir com confirmação na própria tela (sem confirm()). */
function Excluir({ onSim, rotulo = 'Excluir' }: { onSim: () => void; rotulo?: string }) {
  const [armado, setArmado] = useState(false);
  useEffect(() => { if (!armado) return; const t = setTimeout(() => setArmado(false), 4000); return () => clearTimeout(t); }, [armado]);
  return armado
    ? <button className="icon-btn armed" onClick={onSim}>Confirmar</button>
    : <button className="icon-btn danger" aria-label={rotulo} title={rotulo} onClick={() => setArmado(true)}><I d={IC.x} s={16} /></button>;
}

export function Editor({ inicial, iaDisponivel }: { inicial: CursoEd; iaDisponivel: boolean }) {
  const { toast } = useApp();
  const [c, setC] = useState(inicial);
  const [etapa, setEtapa] = useState(1);
  const [salvando, setSalvando] = useState(0);

  const trabalho = useCallback(async <T,>(f: () => Promise<T>): Promise<T | undefined> => {
    setSalvando(n => n + 1);
    try { return await f(); } catch (e) { console.error(e); toast('Não foi possível salvar. Verifique a conexão.'); return undefined; } finally { setSalvando(n => n - 1); }
  }, [toast]);

  const campo = (k: 'titulo' | 'formacao' | 'professor' | 'resumo' | 'para_quem' | 'instrucoes', v: string) => setC(x => ({ ...x, [k]: v }));
  const salvarCampo = async (k: keyof CursoEd, v: string | number) => {
    const r = await trabalho(() => A.salvarCurso(c.id, { [k]: v }));
    if (r?.slug) setC(x => ({ ...x, slug: r.slug }));
  };

  const mudarModulo = (id: string, f: (m: ModuloEd) => ModuloEd) => setC(x => ({ ...x, modulos: x.modulos.map(m => (m.id === id ? f(m) : m)) }));
  const mudarAula = useCallback((id: string, p: Partial<AulaEd>) =>
    setC(x => ({ ...x, modulos: x.modulos.map(m => ({ ...m, aulas: m.aulas.map(a => (a.id === id ? { ...a, ...p } : a)) })) })), []);

  const t = totais(c);
  const lista = checklist(c);
  const falta = lista.filter(x => !x.ok);

  return (
    <div className="adm-pg wrap">
      <div className="ad-top">
        <div>
          <Link className="lnk back" href="/admin/cursos">← Voltar para cursos</Link>
          <h1>{c.titulo === 'Novo curso' ? 'Novo treinamento' : c.titulo}</h1>
          <p>{c.publicado ? 'Publicado no catálogo. As mudanças aparecem para os alunos na hora.' : 'Rascunho: os alunos ainda não veem este curso.'} <span className="hint">{salvando ? 'Salvando…' : 'Tudo salvo.'}</span></p>
        </div>
        <div className="acts">
          {c.publicado && <Link className="btn btn-line btn-sm" href={`/cursos/${c.slug}`}>Ver como aluno</Link>}
        </div>
      </div>

      <div className="stepper" role="tablist">
        {['Sobre o curso', 'Módulos e aulas', 'Revisar e publicar'].map((n, i) => (
          <button key={n} role="tab" aria-current={etapa === i + 1 ? 'step' : undefined} aria-selected={etapa === i + 1} onClick={() => setEtapa(i + 1)}>
            <span className="n">{i + 1}</span>{n}
          </button>
        ))}
      </div>

      <div className="ed4">
        <div className="ed4-main">
          {etapa === 1 && <Sobre c={c} campo={campo} salvarCampo={salvarCampo} setC={setC} trabalho={trabalho} iaDisponivel={iaDisponivel} />}
          {etapa === 2 && <Modulos c={c} setC={setC} mudarModulo={mudarModulo} mudarAula={mudarAula} trabalho={trabalho} />}
          {etapa === 3 && <Revisar c={c} setC={setC} trabalho={trabalho} />}
          <div className="ed-nav">
            {etapa > 1 ? <button className="btn btn-line btn-sm" onClick={() => setEtapa(etapa - 1)}>Voltar</button> : <span />}
            {etapa < 3 && <button className="btn btn-anil btn-sm" onClick={() => { setEtapa(etapa + 1); window.scrollTo({ top: 0 }); }}>Continuar</button>}
          </div>
        </div>

        <aside className="pv4">
          <small className="hint">Prévia: como o aluno verá</small>
          <div className="ad-card flush cc">
            <Capa curso={{ id: c.slug, titulo: c.titulo, capaUrl: c.capa_url || undefined }} className="cc-cover" k="ed" />
            <div className="cc-b">
              <span className="tag blue">{c.formacao}</span>
              <h3>{c.titulo}</h3>
              <p className="hint" style={{ margin: 0 }}>{c.resumo ? c.resumo.slice(0, 120) + (c.resumo.length > 120 ? '…' : '') : 'Resumo do curso'}</p>
              <div className="cc-m"><span>{t.modulos} módulos · {t.aulas} aulas · {fmtTotal(t.seg)}</span></div>
              <div className="cc-m"><b>{brl(c.preco)}</b></div>
            </div>
          </div>
          <div className="ad-card">
            <b>{falta.length ? `Falta para publicar (${falta.length})` : 'Pronto para publicar'}</b>
            <ul className="checks sm">
              {lista.map(x => <li key={x.texto} className={x.ok ? 'ok' : ''}>{x.ok ? '✓' : '•'} {x.texto}</li>)}
            </ul>
          </div>
        </aside>
      </div>
    </div>
  );
}

type Trab = <T>(f: () => Promise<T>) => Promise<T | undefined>;

/* ---------- etapa 1 ---------- */
function Sobre({ c, campo, salvarCampo, setC, trabalho, iaDisponivel }: {
  c: CursoEd; campo: (k: 'titulo' | 'formacao' | 'professor' | 'resumo' | 'para_quem' | 'instrucoes', v: string) => void;
  salvarCampo: (k: keyof CursoEd, v: string | number) => Promise<void>; setC: React.Dispatch<React.SetStateAction<CursoEd>>; trabalho: Trab; iaDisponivel: boolean;
}) {
  const { toast } = useApp();
  const [ia, setIa] = useState<string | null>(null);
  const [precoTxt, setPrecoTxt] = useState(c.preco ? String(c.preco).replace('.', ',') : '');

  async function sugerir(k: 'resumo' | 'para_quem' | 'instrucoes') {
    setIa(k);
    try {
      const r = await fetch('/api/admin/sugerir', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ cursoId: c.id, campo: k }) });
      const j = await r.json();
      if (!r.ok) { toast(j.erro || 'A sugestão não está disponível agora.'); return; }
      campo(k, j.texto);
      await salvarCampo(k, j.texto);
      toast('Sugestão inserida. Revise o texto antes de publicar.');
    } finally { setIa(null); }
  }

  async function capa(f: File | undefined) {
    if (!f) return;
    const fd = new FormData(); fd.append('arquivo', f);
    const r = await trabalho(() => A.enviarCapa(c.id, fd));
    if (r?.erro) toast(r.erro); else if (r?.url) setC(x => ({ ...x, capa_url: r.url! }));
  }

  const Texto = ({ k, rot, dica }: { k: 'resumo' | 'para_quem' | 'instrucoes'; rot: string; dica: string }) => (
    <div className="f4">
      <div className="f4-l"><label htmlFor={'f-' + k}>{rot}</label>
        {iaDisponivel && <button type="button" className="ai-btn" disabled={!!ia} onClick={() => sugerir(k)}><I d={IC.spark} s={14} />{ia === k ? 'Escrevendo…' : 'Sugerir com IA'}</button>}
      </div>
      <textarea id={'f-' + k} className="inp" rows={4} defaultValue={c[k]} key={c[k] === '' ? k + '0' : k + c[k].length}
        onBlur={e => { if (e.target.value !== c[k]) { campo(k, e.target.value); salvarCampo(k, e.target.value); } }} />
      <span className="hint">{dica}</span>
    </div>
  );

  return (
    <div className="ad-card fset">
      <div className="f4">
        <label htmlFor="f-titulo">Nome do curso</label>
        <input id="f-titulo" className="inp lg" defaultValue={c.titulo === 'Novo curso' ? '' : c.titulo} placeholder="Ex.: Lombar travada: alívio em casa"
          onBlur={e => { const v = e.target.value.trim(); if (v && v !== c.titulo) { campo('titulo', v); salvarCampo('titulo', v); } }} />
      </div>
      <div className="f2">
        <div className="f4">
          <label>Formação</label>
          <div className="seg4" role="group">
            {(['Para você', 'Para terapeutas'] as const).map(f => (
              <button key={f} type="button" aria-pressed={c.formacao === f} onClick={() => { campo('formacao', f); salvarCampo('formacao', f); }}>{f}</button>
            ))}
          </div>
        </div>
        <div className="f4">
          <label htmlFor="f-preco">Preço</label>
          <div className="money-in"><span>R$</span>
            <input id="f-preco" className="inp" inputMode="decimal" value={precoTxt} placeholder="0,00"
              onChange={e => setPrecoTxt(e.target.value.replace(/[^\d,.]/g, ''))}
              onBlur={() => { const v = Number(precoTxt.replace(/\./g, '').replace(',', '.')) || 0; setC(x => ({ ...x, preco: v })); salvarCampo('preco', v); }} />
          </div>
        </div>
      </div>
      <div className="f4">
        <label htmlFor="f-prof">Professor</label>
        <input id="f-prof" className="inp" defaultValue={c.professor} onBlur={e => { if (e.target.value !== c.professor) { campo('professor', e.target.value); salvarCampo('professor', e.target.value); } }} />
      </div>
      <div className="f4">
        <label>Capa</label>
        {c.capa_url ? (
          <div className="cover-prev">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={c.capa_url} alt="Capa do curso" />
            <div className="acts">
              <label className="btn btn-line btn-sm" style={{ cursor: 'pointer' }}>Trocar imagem<input type="file" accept="image/jpeg,image/png,image/webp" hidden onChange={e => capa(e.target.files?.[0])} /></label>
              <button className="btn btn-line btn-sm danger" onClick={async () => { await trabalho(() => A.removerCapa(c.id)); setC(x => ({ ...x, capa_url: null })); }}>Usar a ilustração</button>
            </div>
          </div>
        ) : (
          <label className="drop">
            <I d={IC.img} s={26} />
            <b>Enviar imagem de capa</b>
            <small>JPG, PNG ou WebP, deitada (16:9), até 8 MB. Sem imagem, o curso usa a ilustração da marca.</small>
            <input type="file" accept="image/jpeg,image/png,image/webp" onChange={e => capa(e.target.files?.[0])} />
          </label>
        )}
      </div>
      {iaDisponivel && (
        <div className="ai-note"><I d={IC.spark} /><div><b>Sugestões com IA</b><small>A IA usa o nome, a formação e os módulos do curso para escrever um rascunho sóbrio, sem promessas de cura. Revise antes de publicar.</small></div></div>
      )}
      <Texto k="resumo" rot="Resumo" dica="Aparece no catálogo, no carrossel e no topo da página do curso." />
      <Texto k="para_quem" rot="Para quem é o curso" dica="Ajuda o aluno a saber se o curso é para ele." />
      <Texto k="instrucoes" rot="Instruções para o aluno" dica="Como aproveitar o curso: frequência, materiais, cuidados." />
    </div>
  );
}

/* ---------- etapa 2 ---------- */
function Modulos({ c, setC, mudarModulo, mudarAula, trabalho }: {
  c: CursoEd; setC: React.Dispatch<React.SetStateAction<CursoEd>>; mudarModulo: (id: string, f: (m: ModuloEd) => ModuloEd) => void;
  mudarAula: (id: string, p: Partial<AulaEd>) => void; trabalho: Trab;
}) {
  const mover = async (i: number, dir: -1 | 1) => {
    const j = i + dir; if (j < 0 || j >= c.modulos.length) return;
    setC(x => { const ms = [...x.modulos]; [ms[i], ms[j]] = [ms[j], ms[i]]; return { ...x, modulos: ms }; });
    await trabalho(() => A.moverModulo(c.id, c.modulos[i].id, dir));
  };
  return (
    <>
      <div className="tip">Cada módulo vira um eixo da teia de competências do curso. Use pelo menos {MIN_MODULOS}. Os vídeos podem ser enviados direto do celular.</div>
      {c.modulos.map((m, i) => (
        <div className="m4" key={m.id}>
          <div className="m4-h">
            <span className="m4-n">{i + 1}</span>
            <input aria-label={`Nome do módulo ${i + 1}`} placeholder="Nome do módulo (ex.: Mobilidade)" defaultValue={m.titulo}
              onBlur={e => { const v = e.target.value.trim(); if (v !== m.titulo) { mudarModulo(m.id, x => ({ ...x, titulo: v })); trabalho(() => A.salvarModulo(m.id, v)); } }} />
            <span className="m4-c">{m.aulas.length} {m.aulas.length === 1 ? 'aula' : 'aulas'}</span>
            <button className="icon-btn" aria-label="Subir módulo" disabled={i === 0} onClick={() => mover(i, -1)}><I d={IC.up} s={16} /></button>
            <button className="icon-btn" aria-label="Descer módulo" disabled={i === c.modulos.length - 1} onClick={() => mover(i, 1)}><I d={IC.down} s={16} /></button>
            <Excluir rotulo="Excluir módulo" onSim={async () => { setC(x => ({ ...x, modulos: x.modulos.filter(y => y.id !== m.id) })); await trabalho(() => A.excluirModulo(m.id)); }} />
          </div>
          {m.aulas.map((a, j) => (
            <LinhaAula key={a.id} a={a} n={j} total={m.aulas.length} trabalho={trabalho} mudarAula={mudarAula}
              mover={async dir => {
                const k = j + dir; if (k < 0 || k >= m.aulas.length) return;
                mudarModulo(m.id, x => { const as = [...x.aulas]; [as[j], as[k]] = [as[k], as[j]]; return { ...x, aulas: as }; });
                await trabalho(() => A.moverAula(m.id, a.id, dir));
              }}
              excluir={async () => { mudarModulo(m.id, x => ({ ...x, aulas: x.aulas.filter(y => y.id !== a.id) })); await trabalho(() => A.excluirAula(a.id)); }} />
          ))}
          <div className="addbar">
            <span className="hint">Adicionar:</span>
            {(['video', 'texto', 'material', 'teste'] as const).map(tp => (
              <button key={tp} className="add-ty" onClick={async () => {
                const nova = await trabalho(() => A.criarAula(m.id, tp));
                if (nova) mudarModulo(m.id, x => ({ ...x, aulas: [...x.aulas, nova] }));
              }}><I d={IC[tp]} s={16} />{NOME_TIPO[tp]}</button>
            ))}
          </div>
        </div>
      ))}
      <button className="add-mod" onClick={async () => { const n = await trabalho(() => A.criarModulo(c.id)); if (n) setC(x => ({ ...x, modulos: [...x.modulos, n as ModuloEd] })); }}>
        <I d={IC.plus} /> Adicionar módulo
      </button>
    </>
  );
}

function LinhaAula({ a, n, total, trabalho, mudarAula, mover, excluir }: {
  a: AulaEd; n: number; total: number; trabalho: Trab; mudarAula: (id: string, p: Partial<AulaEd>) => void;
  mover: (dir: -1 | 1) => void; excluir: () => void;
}) {
  const { toast } = useApp();
  const onMudou = useCallback((p: Partial<AulaEd>) => mudarAula(a.id, p), [a.id, mudarAula]);
  return (
    <div className="l4">
      <span className={`ty ty-${a.tipo}`} title={NOME_TIPO[a.tipo]}><I d={IC[a.tipo]} /></span>
      <div className="l4-b">
        <input className="inp sm" aria-label="Título da aula" defaultValue={a.titulo}
          onBlur={e => { const v = e.target.value.trim(); if (v && v !== a.titulo) { mudarAula(a.id, { titulo: v }); trabalho(() => A.salvarAula(a.id, { titulo: v })); } }} />
        {a.tipo === 'video' && <EnvioVideo aula={a} onMudou={onMudou} />}
        {a.tipo === 'texto' && (
          <>
            <textarea className="inp" rows={5} placeholder="Texto da aula" defaultValue={a.texto || ''}
              onBlur={e => { if (e.target.value !== (a.texto || '')) { mudarAula(a.id, { texto: e.target.value }); trabalho(() => A.salvarAula(a.id, { texto: e.target.value })); } }} />
            <span className="hint">Conta 4 minutos na duração do curso.</span>
          </>
        )}
        {a.tipo === 'material' && (
          <label className="drop sm">
            <I d={IC.material} />
            <b>{a.material_path ? 'Arquivo enviado: ' + a.material_path.split('/').pop()?.replace(/^\d+-/, '') : 'Enviar arquivo (PDF, imagem…)'}</b>
            <small>{a.material_path ? 'Toque para trocar.' : 'Até 45 MB. Só alunos matriculados conseguem abrir.'}</small>
            <input type="file" onChange={async e => {
              const f = e.target.files?.[0]; if (!f) return;
              const fd = new FormData(); fd.append('arquivo', f);
              const r = await trabalho(() => A.enviarMaterial(a.id, fd));
              if (r?.erro) toast(r.erro); else if (r?.caminho) mudarAula(a.id, { material_path: r.caminho });
            }} />
          </label>
        )}
        {a.tipo === 'teste' && <EditorTeste a={a} salvar={qs => { mudarAula(a.id, { questoes: qs }); trabalho(() => A.salvarAula(a.id, { questoes: qs })); }} />}
        {a.tipo === 'video' && a.duracao_seg ? <span className="hint">Duração: {fmtClock(a.duracao_seg)} (lida do vídeo)</span> : null}
      </div>
      <div className="l4-a">
        <button className="icon-btn" aria-label="Subir aula" disabled={n === 0} onClick={() => mover(-1)}><I d={IC.up} s={16} /></button>
        <button className="icon-btn" aria-label="Descer aula" disabled={n === total - 1} onClick={() => mover(1)}><I d={IC.down} s={16} /></button>
        <Excluir rotulo="Excluir aula" onSim={excluir} />
      </div>
    </div>
  );
}

function EditorTeste({ a, salvar }: { a: AulaEd; salvar: (q: Questao[]) => void }) {
  const [qs, setQs] = useState<Questao[]>(a.questoes || []);
  const atual = useRef(qs); atual.current = qs;
  const mudar = (i: number, p: Partial<Questao>) => setQs(x => x.map((q, k) => (k === i ? { ...q, ...p } : q)));
  const persistir = () => salvar(atual.current);
  return (
    <div className="q4">
      {qs.map((q, i) => (
        <div className="qz" key={i}>
          <div className="q4-h">
            <input className="inp sm" placeholder={`Pergunta ${i + 1}`} value={q.pergunta} onChange={e => mudar(i, { pergunta: e.target.value })} onBlur={persistir} />
            <button className="icon-btn danger" aria-label="Remover pergunta" onClick={() => { const n = qs.filter((_, k) => k !== i); setQs(n); salvar(n); }}><I d={IC.x} s={14} /></button>
          </div>
          {q.opcoes.map((o, k) => (
            <label className="qz-o" key={k}>
              <input type="radio" name={`c-${a.id}-${i}`} checked={q.correta === k} onChange={() => { const n = qs.map((x, j) => (j === i ? { ...x, correta: k } : x)); setQs(n); salvar(n); }} aria-label="Resposta correta" />
              <input className="inp sm" placeholder={`Alternativa ${k + 1}`} value={o}
                onChange={e => mudar(i, { opcoes: q.opcoes.map((y, j) => (j === k ? e.target.value : y)) })} onBlur={persistir} />
            </label>
          ))}
          <span className="hint">Marque a alternativa correta.</span>
        </div>
      ))}
      <button className="add-ty" style={{ justifySelf: 'start' }} onClick={() => setQs(x => [...x, { pergunta: '', opcoes: ['', '', '', ''], correta: 0 }])}>
        <I d={IC.plus} s={16} /> Adicionar pergunta
      </button>
    </div>
  );
}

/* ---------- etapa 3 ---------- */
function Revisar({ c, setC, trabalho }: { c: CursoEd; setC: React.Dispatch<React.SetStateAction<CursoEd>>; trabalho: Trab }) {
  const { toast } = useApp();
  const t = totais(c);
  const lista = checklist(c);
  const pode = lista.every(x => x.ok);
  return (
    <div className="ad-card">
      <div className="sumgrid">
        <div><b>{t.modulos}</b><small>módulos</small></div>
        <div><b>{t.aulas}</b><small>aulas</small></div>
        <div><b>{t.videos}</b><small>vídeos</small></div>
        <div><b>{fmtTotal(t.seg)}</b><small>duração total</small></div>
      </div>
      <p className="hint">A duração é a soma dos vídeos mais 4 minutos por aula de texto. Ela aparece no catálogo, nos pacotes e no certificado.</p>
      {t.semVideo > 0 && <p className="form-aviso">{t.semVideo} {t.semVideo === 1 ? 'aula de vídeo está' : 'aulas de vídeo estão'} sem arquivo.</p>}
      <ul className="checks">
        {lista.map(x => <li key={x.texto} className={x.ok ? 'ok' : ''}>{x.ok ? '✓' : '✕'} {x.texto}</li>)}
      </ul>
      <div className="acts" style={{ marginTop: 18 }}>
        {c.publicado ? (
          <button className="btn btn-line" onClick={async () => { await trabalho(() => A.publicarCurso(c.id, false)); setC(x => ({ ...x, publicado: false })); toast('O curso saiu do catálogo.'); }}>Tirar do catálogo</button>
        ) : (
          <button className="btn btn-oleo" disabled={!pode} onClick={async () => {
            const r = await trabalho(() => A.publicarCurso(c.id, true));
            if (r?.erro) toast(r.erro); else { setC(x => ({ ...x, publicado: true })); toast('Publicado. O curso já aparece no catálogo e no carrossel.'); }
          }}>Publicar no catálogo</button>
        )}
      </div>
    </div>
  );
}
