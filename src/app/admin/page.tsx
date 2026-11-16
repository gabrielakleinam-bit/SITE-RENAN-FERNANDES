import Link from 'next/link';
import { db } from '@/lib/supabase/servidor';
import { exigirAdmin } from '@/lib/sessao';
import { dadosAlunos, quando } from '@/lib/admin-dados';
import { brl, fmtTotal, statsCurso } from '@/lib/duracao';
import { Barra, Ic, Pessoa } from '@/components/admin/Comum';

export const metadata = { title: 'Visão' };

export default async function Visao() {
  const adm = await exigirAdmin();
  const [{ alunos, cursos }, ped, cert, duv, vendas, temas] = await Promise.all([
    dadosAlunos(),
    db().from('pedidos').select('id', { count: 'exact', head: true }).eq('status', 'aguardando'),
    db().from('certificados').select('id', { count: 'exact', head: true }).eq('status', 'pendente'),
    db().from('duvidas').select('id', { count: 'exact', head: true }).eq('status', 'aberta'),
    db().from('pedidos').select('valor').eq('status', 'liberado'),
    db().from('duvidas').select('tema, curso_id'),
  ]);
  const pend = [
    { n: ped.count || 0, t: 'Pagamentos para liberar', s: 'Confira o Pix e libere a entrada', href: '/admin/acessos', d: <><rect x="4" y="11" width="16" height="10" rx="2" /><path d="M8 11V7a4 4 0 0 1 8 0v4" /></> },
    { n: cert.count || 0, t: 'Certificados para aprovar', s: 'Alunos que concluíram 100%', href: '/admin/certificados', d: <><circle cx="12" cy="9" r="6" /><path d="M9 14.5 7.5 22 12 19.5 16.5 22 15 14.5" /></> },
    { n: duv.count || 0, t: 'Dúvidas sem resposta', s: 'Responda pelo painel', href: '/admin/duvidas', d: <path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12z" /> },
  ];
  const mats = alunos.flatMap(a => a.cursos.filter(c => c.status === 'ativo'));
  const media = mats.length ? Math.round(mats.reduce((s, c) => s + c.pct, 0) / mats.length) : 0;
  const publicados = cursos.filter(c => c.publicado);
  const aulasPub = publicados.reduce((s, c) => s + statsCurso(c).aulas, 0);
  const total = (vendas.data || []).reduce((s, v) => s + Number(v.valor), 0);
  const onde = alunos.flatMap(a => a.cursos.filter(c => c.status === 'ativo').map(c => ({ a, c })))
    .sort((x, y) => ((x.c.quando || '') < (y.c.quando || '') ? 1 : -1)).slice(0, 8);
  const contTema: Record<string, number> = {};
  for (const t of temas.data || []) contTema[t.tema] = (contTema[t.tema] || 0) + 1;
  const ranking = Object.entries(contTema).sort((a, b) => b[1] - a[1]).slice(0, 5);
  const hora = Number(new Date().toLocaleString('pt-BR', { hour: 'numeric', hour12: false, timeZone: 'America/Sao_Paulo' }));

  return (
    <div className="adm-pg wrap">
      <div className="ad-top"><div><h1>{hora < 12 ? 'Bom dia' : hora < 18 ? 'Boa tarde' : 'Boa noite'}{adm.nome ? `, ${adm.nome.split(' ')[0]}` : ''}</h1><p>O que precisa da sua atenção e como os alunos estão indo.</p></div></div>
      <div className="todo">
        {pend.map(p => (
          <Link key={p.t} href={p.href} className={'todo-i' + (p.n ? ' on' : '')} style={{ textDecoration: 'none' }}>
            <span className="ti-ic"><Ic d={p.d} /></span>
            <span className="ti-t"><b>{p.n}</b>{p.t}<small>{p.s}</small></span>
            <span className="ti-a">›</span>
          </Link>
        ))}
      </div>
      <div className="ad-kpis">
        <div className="ad-card ad-kpi"><small>Alunos</small><b>{alunos.length}</b><em>{mats.length} matrículas ativas</em></div>
        <div className="ad-card ad-kpi"><small>Progresso médio</small><b>{media}%</b><em>nos cursos ativos</em></div>
        <div className="ad-card ad-kpi"><small>Publicados</small><b>{publicados.length}</b><em>{aulasPub} aulas no ar</em></div>
        <div className="ad-card ad-kpi"><small>Vendas confirmadas</small><b>{brl(total)}</b><em>{vendas.data?.length || 0} pedidos liberados</em></div>
      </div>
      <div className="ad-cols">
        <div className="ad-card flush">
          <div className="sec-h"><h2>Onde estão os alunos agora</h2><Link className="lnk" href="/admin/alunos">Ver todos</Link></div>
          <div className="ad-row th r-onde"><span>Aluno</span><span>Curso e posição</span><span>Progresso</span></div>
          {onde.length ? onde.map(({ a, c }) => (
            <div className="ad-row r-onde" key={a.id + c.slug}>
              <Pessoa nome={a.nome} sub={quando(c.quando)} />
              <div className="ell"><small className="hint">{c.titulo}</small>{c.posicao}</div>
              <Barra pct={c.pct} />
            </div>
          )) : <p className="pad muted">Nenhum aluno com matrícula ativa ainda.</p>}
        </div>
        <div className="ad-stack">
          <div className="ad-card flush">
            <div className="sec-h"><h2>Por treinamento</h2></div>
            {publicados.length ? publicados.map(c => {
              const m = mats.filter(x => x.slug === c.id);
              const pct = m.length ? Math.round(m.reduce((s, x) => s + x.pct, 0) / m.length) : 0;
              return (
                <div className="ad-row r-curso" key={c.uuid}>
                  <div><b>{c.titulo}</b><small className="hint" style={{ display: 'block' }}>{m.length} {m.length === 1 ? 'aluno' : 'alunos'} · {fmtTotal(statsCurso(c).sec)}</small></div>
                  <Barra pct={pct} />
                </div>
              );
            }) : <p className="pad muted">Nenhum curso publicado. <Link className="lnk" href="/admin/cursos">Criar ou publicar</Link></p>}
          </div>
          <div className="ad-card">
            <div className="sec-h nopad"><h2>Dúvidas mais frequentes</h2></div>
            {ranking.length ? ranking.map(([t, n], i) => (
              <div className="rank-i" key={t}><span className="rk">{i + 1}</span><div><b>{t}</b></div><span className="hint">{n}</span></div>
            )) : <p className="muted">Sem dúvidas ainda.</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
