'use client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useApp } from './App';
import { useUltimoCurso } from './Inicio';
import { Player } from './Player';
import { fmtTotal, rotuloAula } from '@/lib/duracao';
import type { Curso, Duvida } from '@/lib/tipos';

const Cadeado = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect x="4" y="11" width="16" height="10" rx="2" /><path d="M8 11V7a4 4 0 0 1 8 0v4" />
  </svg>
);

/** Tela da aula: menu lateral com módulos e aulas; clicar numa aula troca o conteúdo sem sair da tela. */
export function SalaDeAula({ curso: c, aulaId, aulas, sec, duvidas }: {
  curso: Curso; aulaId: string; aulas: number; sec: number; duvidas: Duvida[];
}) {
  const { tem, aguardando, concluida, marcarConcluida, toast, pronto } = useApp();
  const router = useRouter();
  useUltimoCurso(c.id);

  const todas = c.modulos.flatMap(m => m.aulas);
  const amostra = c.modulos[0]?.aulas[0]?.id;
  const liberado = tem(c.id);
  const pode = (id: string) => liberado || id === amostra;
  const aula = todas.find(a => a.id === aulaId && a.tipo !== 'teste') || todas[0];
  const idx = todas.indexOf(aula);
  const proxima = todas.slice(idx + 1).find(a => a.tipo !== 'teste' && pode(a.id));
  const url = (id: string) => `/cursos/${c.id}/aula/${id}`;

  return (
    <div className="wrap aula-grid">
      <aside className="modmenu" aria-label="Módulos e aulas do curso">
        <h3 className="mm-course"><Link href={`/cursos/${c.id}`} style={{ textDecoration: 'none' }}>{c.titulo}</Link></h3>
        <p className="mm-sum">{aulas} aulas · {fmtTotal(sec)}</p>
        {c.modulos.map(m => (
          <div key={m.id} style={{ display: 'contents' }}>
            <h4 className="mm-mod">{m.titulo}</h4>
            {m.aulas.map(l => {
              const feita = concluida(c.id, l.id), on = l.id === aula.id, trava = !pode(l.id);
              const cls = `mm-l${on ? ' on' : ''}${feita ? ' ok' : ''}${trava ? ' lock' : ''}`;
              const miolo = <>
                <span className="ic">{feita ? '✓' : trava ? <Cadeado /> : ''}</span>
                <span className="mm-t">{l.titulo}</span>
                <span className="d">{rotuloAula(l)}</span>
              </>;
              if (l.tipo === 'teste') return <button key={l.id} className={cls} onClick={() => toast('Teste do módulo: libera ao concluir as aulas do módulo.')}>{miolo}</button>;
              if (trava) return <button key={l.id} className={cls} onClick={() => toast(aguardando(c.id) ? 'A aula libera depois da confirmação do pagamento pela equipe.' : 'Esta aula faz parte do curso. A primeira aula é gratuita.')}>{miolo}</button>;
              return <Link key={l.id} className={cls} href={url(l.id)} scroll={false} replace aria-current={on ? 'true' : undefined}>{miolo}</Link>;
            })}
          </div>
        ))}
      </aside>

      <div className="aula-main">
        {pronto && !pode(aula.id) ? (
          <div className="player" style={{ marginTop: 0 }}>
            <div className="screenbox">
              <div className="stage"><div className="rv-text">
                <h3>Esta aula faz parte do curso</h3>
                <p>{aguardando(c.id) ? 'Seu pagamento foi recebido. A aula libera assim que a equipe confirmar a entrada.' : 'A primeira aula é gratuita. Para assistir às demais, compre o curso.'}</p>
                <div className="acts">
                  {amostra && <Link className="btn btn-oleo" href={url(amostra)} replace>Assistir aula de amostra</Link>}
                  <Link className="btn btn-ghost" style={{ color: '#fff' }} href={`/cursos/${c.id}`}>Ver o curso</Link>
                </div>
              </div></div>
            </div>
          </div>
        ) : (
          <Player key={aula.id} aula={aula} exemplo={!!c.exemplo} jaConcluida={concluida(c.id, aula.id)}
            onConcluir={() => marcarConcluida(c.id, aula.id)}
            onProxima={proxima ? () => router.replace(url(proxima.id), { scroll: false }) : null} />
        )}
        <div className="two" style={{ marginTop: 20 }}>
          <div className="panel">
            <h2>Dúvidas desta aula</h2>
            <p className="sub">O professor responde por aqui. Você recebe um aviso por e-mail.</p>
            <div className="qa-mini">
              {duvidas.length ? duvidas.slice(0, 2).map(t => (
                <Link className="q" key={t.id} href={`/duvidas?d=${t.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                  <strong>{t.titulo}</strong><span>{t.mensagens.length} mensagens, {t.status}</span>
                </Link>
              )) : <p className="muted">Nenhuma dúvida nesta aula ainda.</p>}
            </div>
            <Link className="btn btn-anil full" style={{ marginTop: 14 }} href="/duvidas">Perguntar ao professor</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
