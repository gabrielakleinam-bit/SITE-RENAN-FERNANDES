import { dadosAlunos, quando } from '@/lib/admin-dados';
import { Barra, Pessoa } from '@/components/admin/Comum';
import { BuscaAlunos } from '@/components/admin/BuscaAlunos';

export const metadata = { title: 'Alunos' };

export default async function Alunos({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const q = ((await searchParams).q || '').trim().toLowerCase();
  const { alunos } = await dadosAlunos();
  const lista = q ? alunos.filter(a => a.nome.toLowerCase().includes(q) || a.email.includes(q)) : alunos;
  return (
    <div className="adm-pg wrap">
      <div className="ad-top"><div><h1>Alunos</h1><p>{alunos.length} cadastrados. Cursos, progresso, posição atual e último acesso.</p></div><BuscaAlunos inicial={q} /></div>
      <div className="ad-card flush">
        <div className="ad-row th r-aluno"><span>Aluno</span><span>Cursos</span><span>Posição</span><span>Último acesso</span></div>
        {lista.length ? lista.map(a => (
          <div className="ad-row r-aluno" key={a.id}>
            <Pessoa nome={a.nome} sub={a.email} />
            <div>{a.cursos.length ? a.cursos.map(c => (
              <div className="mc" key={c.slug}><span>{c.titulo}{c.status !== 'ativo' && <span className="tag amber" style={{ marginLeft: 6 }}>aguardando</span>}</span><Barra pct={c.pct} /></div>
            )) : <span className="hint">Sem cursos</span>}</div>
            <div>{a.cursos.map(c => <div key={c.slug} className="hint" style={{ margin: '3px 0' }}>{c.posicao}</div>)}</div>
            <span className="hint">{quando(a.ultimo)}</span>
          </div>
        )) : <p className="pad muted">{q ? 'Nenhum aluno encontrado.' : 'Nenhum aluno cadastrado ainda.'}</p>}
      </div>
    </div>
  );
}
