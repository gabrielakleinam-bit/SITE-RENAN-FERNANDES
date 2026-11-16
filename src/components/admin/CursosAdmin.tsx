'use client';
import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '../App';
import { Capa } from '../Capa';
import { brl, fmtTotal } from '@/lib/duracao';
import type { Curso, Pacote } from '@/lib/tipos';
import { criarCurso, excluirCurso, excluirPacote, salvarPacote } from '@/app/admin/cursos/acoes';

interface Item { curso: Curso; mods: number; aulas: number; sec: number; alunos: number }

function BotaoExcluir({ item }: { item: Item }) {
  const { toast } = useApp();
  const router = useRouter();
  const [armado, setArmado] = useState(false);
  if (!armado) return <button className="btn btn-line btn-sm danger" onClick={() => setArmado(true)}>Excluir</button>;
  return (
    <span className="acts" style={{ alignItems: 'center' }}>
      <small className="hint">{item.alunos ? `Tem ${item.alunos} aluno(s): será arquivado.` : 'Excluir de vez?'}</small>
      <button className="btn btn-sm" style={{ background: '#9B1C1C', color: '#fff' }} onClick={async () => {
        const r = await excluirCurso(item.curso.uuid);
        toast(r.arquivado ? 'Curso arquivado: os alunos atuais mantêm o acesso.' : 'Curso excluído.');
        router.refresh();
      }}>Confirmar</button>
      <button className="btn btn-line btn-sm" onClick={() => setArmado(false)}>Cancelar</button>
    </span>
  );
}

export function CursosAdmin({ itens, pacotes }: { itens: Item[]; pacotes: Pacote[] }) {
  const [criando, setCriando] = useState(false);
  return (
    <div className="adm-pg wrap">
      <div className="ad-top">
        <div><h1>Cursos</h1><p>Crie e edite treinamentos, envie os vídeos e publique no catálogo.</p></div>
      </div>
      <div className="cc-grid">
        {itens.map(it => {
          const c = it.curso;
          return (
            <article className="ad-card flush cc" key={c.uuid}>
              <Capa curso={c} className="cc-cover" k={'a' + c.uuid.slice(0, 6)} />
              <div className="cc-b">
                <span className={`tag ${c.publicado ? 'green' : 'amber'}`}>{c.publicado ? 'Publicado' : 'Rascunho'}</span>
                <h3>{c.titulo}</h3>
                <span className="hint">{c.formacao} · {it.mods} módulos · {it.aulas} aulas · {fmtTotal(it.sec)}</span>
                <div className="cc-m"><b>{brl(c.preco)}</b><span>{it.alunos} {it.alunos === 1 ? 'aluno ativo' : 'alunos ativos'}</span></div>
                <div className="cc-a">
                  <Link className="btn btn-anil btn-sm" href={`/admin/cursos/${c.uuid}`}>Editar</Link>
                  {c.publicado && <Link className="btn btn-line btn-sm" href={`/cursos/${c.id}`}>Ver como aluno</Link>}
                  <BotaoExcluir item={it} />
                </div>
              </div>
            </article>
          );
        })}
        <form action={criarCurso} onSubmit={() => setCriando(true)}>
          <button className="cc-new" style={{ width: '100%' }} disabled={criando}>
            <span><svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg></span>
            <b>{criando ? 'Criando…' : 'Novo treinamento'}</b>
            <small>Nome, módulos, vídeos e publicação em 3 etapas</small>
          </button>
        </form>
      </div>
      <Pacotes pacotes={pacotes} cursos={itens.map(i => i.curso)} />
    </div>
  );
}

function Pacotes({ pacotes, cursos }: { pacotes: Pacote[]; cursos: Curso[] }) {
  const { toast } = useApp();
  const router = useRouter();
  const [ed, setEd] = useState<(Pacote & { novo?: boolean }) | null>(null);
  const cheio = (ids: string[]) => ids.reduce((s, id) => s + (cursos.find(c => c.id === id)?.preco || 0), 0);

  async function salvar() {
    if (!ed) return;
    const r = await salvarPacote({
      id: ed.novo ? undefined : ed.id, titulo: ed.titulo, descricao: ed.descricao, preco: ed.preco, ativo: ed.ativo ?? true,
      cursos: ed.cursos.map(slug => cursos.find(c => c.id === slug)!.uuid),
    });
    if (r.erro) { toast(r.erro); return; }
    toast('Pacote salvo.'); setEd(null); router.refresh();
  }

  return (
    <>
      <h2 className="ad-sub">Pacotes</h2>
      <div className="ad-card flush">
        {pacotes.map(p => (
          <div className="ad-row r-pack" key={p.id}>
            <div>
              <b>{p.titulo}</b> {!p.ativo && <span className="tag">Desativado</span>}
              <small className="hint" style={{ display: 'block' }}>{p.cursos.map(s => cursos.find(c => c.id === s)?.titulo || s).join(' + ')}</small>
              <small className="hint">{brl(p.preco)} (cheio {brl(cheio(p.cursos))})</small>
            </div>
            <div className="acts">
              <button className="btn btn-line btn-sm" onClick={() => setEd({ ...p })}>Editar</button>
              <button className="btn btn-line btn-sm" onClick={async () => {
                await salvarPacote({ id: p.id, titulo: p.titulo, descricao: p.descricao, preco: p.preco, ativo: !p.ativo, cursos: p.cursos.map(s => cursos.find(c => c.id === s)!.uuid) });
                router.refresh();
              }}>{p.ativo ? 'Desativar' : 'Ativar'}</button>
              <button className="btn btn-line btn-sm danger" onClick={async () => { await excluirPacote(p.id); router.refresh(); }}>Excluir</button>
            </div>
          </div>
        ))}
        <div className="pad"><button className="add-ty" onClick={() => setEd({ id: '', titulo: '', descricao: '', preco: 0, cursos: [], ativo: true, novo: true })}>+ Novo pacote</button></div>
      </div>
      {ed && (
        <div className="ad-card fset" style={{ marginTop: 14 }}>
          <div className="f4"><label>Nome do pacote</label><input className="inp" value={ed.titulo} onChange={e => setEd({ ...ed, titulo: e.target.value })} /></div>
          <div className="f4"><label>Descrição</label><input className="inp" value={ed.descricao} onChange={e => setEd({ ...ed, descricao: e.target.value })} /></div>
          <div className="f4"><label>Cursos</label>
            {cursos.map(c => (
              <label key={c.uuid} className="consent" style={{ margin: 0 }}>
                <input type="checkbox" checked={ed.cursos.includes(c.id)} onChange={e => setEd({ ...ed, cursos: e.target.checked ? [...ed.cursos, c.id] : ed.cursos.filter(x => x !== c.id) })} />
                {c.titulo} · {brl(c.preco)}{!c.publicado && ' (rascunho)'}
              </label>
            ))}
          </div>
          <div className="f4"><label>Preço do pacote</label>
            <div className="money-in"><span>R$</span><input className="inp" inputMode="decimal" defaultValue={ed.preco ? String(ed.preco).replace('.', ',') : ''} onChange={e => setEd({ ...ed, preco: Number(e.target.value.replace(/\./g, '').replace(',', '.')) || 0 })} /></div>
            <span className="hint">Preço cheio: {brl(cheio(ed.cursos))}{ed.preco > 0 && cheio(ed.cursos) > 0 ? ` · ${Math.round((1 - ed.preco / cheio(ed.cursos)) * 100)}% de desconto` : ''}</span>
          </div>
          <div className="acts"><button className="btn btn-anil btn-sm" onClick={salvar}>Salvar pacote</button><button className="btn btn-line btn-sm" onClick={() => setEd(null)}>Cancelar</button></div>
        </div>
      )}
    </>
  );
}
