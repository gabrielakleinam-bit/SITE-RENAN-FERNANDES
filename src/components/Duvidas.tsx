'use client';
/* Conversas de dúvidas: o mesmo componente serve o aluno (/duvidas) e o professor (/admin/duvidas). */
import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from './App';
import { novaDuvida, responderComoAluno } from '@/app/acoes-aluno';
import { resolverDuvida, responderDuvida } from '@/app/admin/acoes';

export interface ConversaUI {
  id: number; titulo: string; tema: string; status: 'aberta' | 'respondida' | 'resolvida'; curso: string; cursoId: string; aula: string;
  aluno: string; atualizada: string; mensagens: { professor: boolean; nome: string; texto: string; quando: string }[];
}
interface CursoOpc { uuid: string; titulo: string; aulas: { id: string; titulo: string }[] }

const quando = (s: string) => new Date(s).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit', timeZone: 'America/Sao_Paulo' });
const ROTULO = { aberta: 'aberta', respondida: 'respondida', resolvida: 'resolvida' };

export function Duvidas({ lista, modo, cursos, inicial, nova }: {
  lista: ConversaUI[]; modo: 'aluno' | 'professor'; cursos: CursoOpc[]; inicial?: number;
  nova?: { curso?: string; aula?: string } | null;
}) {
  const { toast } = useApp();
  const router = useRouter();
  const [filtro, setFiltro] = useState('');
  const [sel, setSel] = useState<number | 'nova' | null>(nova ? 'nova' : inicial ?? lista[0]?.id ?? (modo === 'aluno' ? 'nova' : null));
  const [texto, setTexto] = useState('');
  const [ocupado, setOcupado] = useState(false);
  const vis = filtro ? lista.filter(c => c.cursoId === filtro) : lista;
  const atual = typeof sel === 'number' ? lista.find(c => c.id === sel) : null;
  const ranking = useMemo(() => {
    const n: Record<string, number> = {};
    for (const c of vis) n[c.tema] = (n[c.tema] || 0) + 1;
    return Object.entries(n).sort((a, b) => b[1] - a[1]).slice(0, 5);
  }, [vis]);

  async function enviar() {
    if (!atual || !texto.trim()) return;
    setOcupado(true);
    const r = modo === 'professor' ? await responderDuvida(atual.id, texto) : await responderComoAluno(atual.id, texto);
    setOcupado(false);
    if (r.erro) { toast(r.erro); return; }
    setTexto(''); toast(modo === 'professor' ? 'Resposta enviada. O aluno recebe um aviso por e-mail.' : 'Mensagem enviada.'); router.refresh();
  }

  return (
    <div className="dv-grid">
      <div>
        {modo === 'professor' && (
          <select className="inp sm" style={{ marginBottom: 12 }} value={filtro} onChange={e => setFiltro(e.target.value)} aria-label="Filtrar por curso">
            <option value="">Todos os cursos</option>
            {cursos.map(c => <option key={c.uuid} value={c.uuid}>{c.titulo}</option>)}
          </select>
        )}
        {modo === 'aluno' && <button className="btn btn-anil full" style={{ marginBottom: 12 }} onClick={() => setSel('nova')}>Nova pergunta</button>}
        <div className="thread-list">
          {vis.length ? vis.map(c => (
            <button key={c.id} className="thread-btn" aria-current={sel === c.id} onClick={() => setSel(c.id)}>
              <strong>{c.titulo}</strong>
              <span className="ctx"><span className={`status ${c.status}`}>{ROTULO[c.status]}</span>{modo === 'professor' ? c.aluno + ' · ' : ''}{c.curso}</span>
            </button>
          )) : <p className="pad muted">{modo === 'aluno' ? 'Você ainda não fez perguntas.' : 'Nenhuma dúvida.'}</p>}
        </div>
        {modo === 'professor' && ranking.length > 0 && (
          <div className="ad-card" style={{ marginTop: 14 }}>
            <b>Temas mais perguntados</b>
            {ranking.map(([t, n], i) => <div className="rank-i" key={t}><span className="rk">{i + 1}</span><div>{t}</div><span className="hint">{n}</span></div>)}
          </div>
        )}
      </div>

      {sel === 'nova' ? <NovaPergunta cursos={cursos} nova={nova} onCriada={id => { setSel(id); router.refresh(); }} /> : atual ? (
        <div className="convo">
          <h2>{atual.titulo}</h2>
          <p className="ctx">{atual.curso}{atual.aula ? ` · ${atual.aula}` : ''} · tema: {atual.tema}</p>
          {atual.mensagens.map((m, i) => (
            <div key={i} className={'msg' + (m.professor ? ' prof' : '')}>
              <span className="pic">{m.professor ? '' : m.nome.slice(0, 1).toUpperCase()}</span>
              <div><div className="name"><b>{m.nome}</b> · {quando(m.quando)}</div><div className="bubble">{m.texto}</div></div>
            </div>
          ))}
          {atual.status === 'resolvida' && modo === 'aluno' ? <p className="muted">Esta dúvida foi marcada como resolvida. Abra uma nova pergunta se precisar.</p> : (
            <div className="composer">
              <textarea placeholder={modo === 'professor' ? 'Escreva a resposta' : 'Escreva uma mensagem'} value={texto} onChange={e => setTexto(e.target.value)} />
              <div className="row2">
                {modo === 'professor' && atual.status !== 'resolvida'
                  ? <button className="btn btn-line btn-sm" onClick={async () => { await resolverDuvida(atual.id); toast('Marcada como resolvida.'); router.refresh(); }}>Marcar como resolvida</button>
                  : <span />}
                <button className="btn btn-anil" disabled={ocupado || !texto.trim()} onClick={enviar}>{modo === 'professor' ? 'Responder' : 'Enviar'}</button>
              </div>
            </div>
          )}
        </div>
      ) : <div className="convo"><p className="muted">Escolha uma conversa.</p></div>}
    </div>
  );
}

function NovaPergunta({ cursos, nova, onCriada }: { cursos: CursoOpc[]; nova?: { curso?: string; aula?: string } | null; onCriada: (id: number) => void }) {
  const { toast } = useApp();
  const [curso, setCurso] = useState(nova?.curso && cursos.some(c => c.uuid === nova.curso) ? nova.curso : cursos[0]?.uuid || '');
  const [aula, setAula] = useState(nova?.aula || '');
  const [tema, setTema] = useState('');
  const [titulo, setTitulo] = useState('');
  const [texto, setTexto] = useState('');
  const [ocupado, setOcupado] = useState(false);
  const aulas = cursos.find(c => c.uuid === curso)?.aulas || [];
  if (!cursos.length) return <div className="convo"><h2>Nova pergunta</h2><p className="muted">As perguntas ficam disponíveis para quem tem um curso.</p></div>;
  return (
    <form className="convo" onSubmit={async e => {
      e.preventDefault(); setOcupado(true);
      const r = await novaDuvida({ curso, aula: aula || undefined, tema: tema || 'Geral', titulo, texto });
      setOcupado(false);
      if (r.erro) toast(r.erro); else { toast('Pergunta enviada. Você recebe um aviso quando o professor responder.'); onCriada(r.id!); }
    }}>
      <h2>Nova pergunta</h2>
      <div className="fset" style={{ marginTop: 14 }}>
        <div className="f4"><label htmlFor="dq-c">Curso</label>
          <select id="dq-c" className="inp" value={curso} onChange={e => { setCurso(e.target.value); setAula(''); }}>{cursos.map(c => <option key={c.uuid} value={c.uuid}>{c.titulo}</option>)}</select></div>
        <div className="f4"><label htmlFor="dq-a">Aula (opcional)</label>
          <select id="dq-a" className="inp" value={aula} onChange={e => setAula(e.target.value)}><option value="">Sobre o curso em geral</option>{aulas.map(a => <option key={a.id} value={a.id}>{a.titulo}</option>)}</select></div>
        <div className="f4"><label htmlFor="dq-t">Tema</label>
          <input id="dq-t" className="inp" list="temas" placeholder="Ex.: Postura, Contraindicações, Frequência" value={tema} onChange={e => setTema(e.target.value)} />
          <datalist id="temas">{['Postura', 'Contraindicações', 'Frequência', 'Dor', 'Técnica', 'Gestação', 'Geral'].map(t => <option key={t} value={t} />)}</datalist></div>
        <div className="f4"><label htmlFor="dq-ti">Pergunta em uma frase</label><input id="dq-ti" className="inp" required value={titulo} onChange={e => setTitulo(e.target.value)} /></div>
        <div className="f4"><label htmlFor="dq-x">Detalhes</label><textarea id="dq-x" className="inp" rows={4} required value={texto} onChange={e => setTexto(e.target.value)} /></div>
        <button className="btn btn-anil" disabled={ocupado}>{ocupado ? 'Enviando…' : 'Enviar pergunta'}</button>
      </div>
    </form>
  );
}
