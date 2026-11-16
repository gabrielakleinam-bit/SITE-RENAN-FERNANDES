'use client';
import Link from 'next/link';
import { useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from './App';
import { useUltimoCurso } from './Inicio';
import { Player, type Midia } from './Player';
import { fmtTotal, rotuloAula } from '@/lib/duracao';
import type { Curso } from '@/lib/tipos';
import { corrigirTeste } from '@/app/acoes-aluno';

export type Conteudo =
  | { tipo: 'video'; midia: Midia; duracao: number }
  | { tipo: 'processando' } | { tipo: 'semvideo' }
  | { tipo: 'texto'; texto: string }
  | { tipo: 'material'; url: string | null; nome: string }
  | { tipo: 'teste'; questoes: { pergunta: string; opcoes: string[] }[] }
  | { tipo: 'bloqueada' };

export interface DuvidaMini { id: number; titulo: string; status: string; mensagens: number }

const Cadeado = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect x="4" y="11" width="16" height="10" rx="2" /><path d="M8 11V7a4 4 0 0 1 8 0v4" />
  </svg>
);

/** Tela da aula: menu lateral com módulos e aulas; clicar numa aula troca o conteúdo sem sair da tela. */
export function SalaDeAula({ curso: c, aulaId, conteudo, blocos, aulas, sec, duvidas }: {
  curso: Curso; aulaId: string; conteudo: Conteudo; blocos: string; aulas: number; sec: number; duvidas: DuvidaMini[];
}) {
  const { tem, aguardando, concluida, marcarConcluida, toast, usuario, abrirLogin } = useApp();
  const router = useRouter();
  useUltimoCurso(c.id);

  const todas = c.modulos.flatMap(m => m.aulas);
  const amostra = todas.find(a => a.tipo !== 'teste')?.id;
  const pode = (id: string) => tem(c.id) || id === amostra;
  const aula = todas.find(a => a.id === aulaId) || todas[0];
  const idx = todas.indexOf(aula);
  const proxima = todas.slice(idx + 1).find(a => pode(a.id));
  const url = (id: string) => `/cursos/${c.id}/aula/${id}`;
  const irProxima = proxima ? () => router.replace(url(proxima.id), { scroll: false }) : null;

  const registrar = useCallback(async (pos: number, evento: 'tick' | 'seek') => {
    if (!usuario) return null;
    try {
      const r = await fetch('/api/progresso', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ aulaId: aula.id, curso: c.id, pos, evento }) });
      return r.ok ? await r.json() : null;
    } catch { return null; }
  }, [usuario, aula.id, c.id]);

  const concluirLeitura = async () => {
    if (!usuario) { abrirLogin(); return; }
    const r = await fetch('/api/progresso', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ aulaId: aula.id, curso: c.id, concluir: true }) });
    if (r.ok) { marcarConcluida(c.id, aula.id); toast('Aula concluída.'); router.refresh(); }
  };

  let palco: React.ReactNode;
  const painel = (h: string, p: React.ReactNode, acts?: React.ReactNode) => (
    <div id="playerWrap" data-mode="panel">
      <div className="player"><div className="screenbox"><div className="stage"><div className="rv-text"><h3>{h}</h3>{p}{acts && <div className="acts">{acts}</div>}</div></div></div></div>
    </div>
  );
  switch (conteudo.tipo) {
    case 'video':
      palco = <Player key={aula.id} midia={conteudo.midia} titulo={aula.titulo} duracao={conteudo.duracao} blocosIniciais={blocos}
        jaConcluida={concluida(aula.id)} registrar={registrar} onConcluir={() => marcarConcluida(c.id, aula.id)} onProxima={irProxima} />;
      break;
    case 'processando': palco = painel('Vídeo em preparação', <p>O vídeo desta aula está sendo convertido para streaming. Volte em alguns minutos.</p>); break;
    case 'semvideo': palco = painel('Em breve', <p>O vídeo desta aula ainda está sendo preparado.</p>); break;
    case 'texto':
      palco = <div className="panel leitura"><h2>{aula.titulo}</h2><div className="leitura-t">{conteudo.texto}</div>
        {concluida(aula.id) ? <p className="ok-txt">Leitura concluída.</p> : <button className="btn btn-oleo" onClick={concluirLeitura}>Concluí a leitura</button>}
        {irProxima && concluida(aula.id) && <button className="btn btn-quiet" onClick={irProxima}>Próxima aula</button>}</div>;
      break;
    case 'material':
      palco = painel(aula.titulo, <p>Material de apoio{conteudo.nome ? `: ${conteudo.nome}` : ''}.</p>, <>
        {conteudo.url && <a className="btn btn-oleo" href={conteudo.url} target="_blank" rel="noopener">Abrir material</a>}
        {!concluida(aula.id) && <button className="btn btn-ghost" style={{ color: '#fff' }} onClick={concluirLeitura}>Marcar como visto</button>}
      </>);
      break;
    case 'teste': palco = <Teste key={aula.id} slug={c.id} aulaId={aula.id} questoes={conteudo.questoes} />; break;
    default:
      palco = painel('Esta aula faz parte do curso',
        <p>{aguardando(c.id) ? 'Seu pagamento foi recebido. A aula libera assim que a equipe confirmar a entrada.' : 'A primeira aula é gratuita. Para assistir às demais, compre o curso.'}</p>,
        <>{amostra && <Link className="btn btn-oleo" href={url(amostra)} replace>Assistir aula de amostra</Link>}
          <Link className="btn btn-ghost" style={{ color: '#fff' }} href={`/cursos/${c.id}`}>Ver o curso</Link></>);
  }

  return (
    <div className="wrap aula-grid">
      <aside className="modmenu" aria-label="Módulos e aulas do curso">
        <h3 className="mm-course"><Link href={`/cursos/${c.id}`} style={{ textDecoration: 'none' }}>{c.titulo}</Link></h3>
        <p className="mm-sum">{aulas} aulas · {fmtTotal(sec)}</p>
        {c.modulos.map((m, mi) => (
          <div key={m.id} style={{ display: 'contents' }}>
            <h4 className="mm-mod">Módulo {mi + 1}: {m.titulo}</h4>
            {m.aulas.map(l => {
              const feita = concluida(l.id), on = l.id === aula.id, trava = !pode(l.id);
              const cls = `mm-l${on ? ' on' : ''}${feita ? ' ok' : ''}${trava ? ' lock' : ''}`;
              const miolo = <>
                <span className="ic">{feita ? '✓' : trava ? <Cadeado /> : ''}</span>
                <span className="mm-t">{l.titulo}</span>
                <span className="d">{rotuloAula(l)}</span>
              </>;
              if (trava) return <button key={l.id} className={cls} onClick={() => toast(aguardando(c.id) ? 'A aula libera depois da confirmação do pagamento pela equipe.' : 'Esta aula faz parte do curso. A primeira aula é gratuita.')}>{miolo}</button>;
              return <Link key={l.id} className={cls} href={url(l.id)} scroll={false} replace aria-current={on ? 'true' : undefined}>{miolo}</Link>;
            })}
          </div>
        ))}
      </aside>

      <div className="aula-main">
        {palco}
        <div className="two" style={{ marginTop: 20 }}>
          <div className="panel">
            <h2>Dúvidas desta aula</h2>
            <p className="sub">O professor responde por aqui. Você recebe um aviso por e-mail.</p>
            <div className="qa-mini">
              {duvidas.length ? duvidas.map(t => (
                <Link className="q" key={t.id} href={`/duvidas?d=${t.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                  <strong>{t.titulo}</strong><span>{t.mensagens} {t.mensagens === 1 ? 'mensagem' : 'mensagens'}, {t.status}</span>
                </Link>
              )) : <p className="muted">Você ainda não fez perguntas neste curso.</p>}
            </div>
            <Link className="btn btn-anil full" style={{ marginTop: 14 }} href={`/duvidas?nova=1&curso=${c.uuid}&aula=${aula.id}`}>Perguntar ao professor</Link>
          </div>
        </div>
      </div>
    </div>
  );
}

function Teste({ slug, aulaId, questoes }: { slug: string; aulaId: string; questoes: { pergunta: string; opcoes: string[] }[] }) {
  const [resp, setResp] = useState<number[]>(questoes.map(() => -1));
  const [res, setRes] = useState<{ certas: boolean[]; gabarito: number[]; acertos: number; total: number } | null>(null);
  const { toast } = useApp();
  if (!questoes.length) return <div className="panel"><h2>Teste do módulo</h2><p className="sub">As perguntas ainda não foram cadastradas.</p></div>;
  return (
    <div className="panel">
      <h2>Teste do módulo</h2>
      <p className="sub">Escolha uma alternativa em cada pergunta. A correção aparece na hora.</p>
      <div className="dq-opts" style={{ gridTemplateColumns: '1fr' }}>
        {questoes.map((q, i) => (
          <fieldset key={i} style={{ border: 0, padding: 0, margin: '0 0 14px' }}>
            <legend style={{ fontWeight: 700, marginBottom: 8 }}>{i + 1}. {q.pergunta}</legend>
            {q.opcoes.map((o, k) => {
              const marcado = resp[i] === k;
              const cor = res ? (res.gabarito[i] === k ? '#DDF3EA' : marcado ? '#FBE7E7' : undefined) : undefined;
              return (
                <button key={k} className="dq-o" style={{ width: '100%', marginBottom: 6, background: cor }} aria-pressed={marcado} disabled={!!res}
                  onClick={() => setResp(r => r.map((x, j) => (j === i ? k : x)))}>
                  <span className="dq-c">{marcado ? '✓' : ''}</span>{o}
                </button>
              );
            })}
          </fieldset>
        ))}
      </div>
      {res ? (
        <div className="acts" style={{ alignItems: 'center' }}>
          <b>{res.acertos} de {res.total} certas.</b>
          <button className="btn btn-line btn-sm" onClick={() => { setRes(null); setResp(questoes.map(() => -1)); }}>Refazer</button>
        </div>
      ) : (
        <button className="btn btn-oleo" onClick={async () => {
          if (resp.some(r => r < 0)) { toast('Responda todas as perguntas.'); return; }
          const r = await corrigirTeste(slug, aulaId, resp);
          if (r.erro !== undefined) toast(r.erro); else setRes({ certas: r.certas!, gabarito: r.gabarito!, acertos: r.acertos!, total: r.total! });
        }}>Corrigir</button>
      )}
    </div>
  );
}
