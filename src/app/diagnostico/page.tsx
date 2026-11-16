import Link from 'next/link';
import { listarCursos, listarPacotes } from '@/lib/catalogo';
import { statsCurso } from '@/lib/duracao';
import { usuarioAtual } from '@/lib/sessao';
import { progressoCurso } from '@/lib/progresso';
import { db } from '@/lib/supabase/servidor';
import { Diagnostico } from '@/components/Diagnostico';
import { Teia } from '@/components/Teia';

export const metadata = { title: 'Diagnóstico' };

export default async function PaginaDiagnostico() {
  const [cursos, pacotes, u] = await Promise.all([listarCursos(), listarPacotes(), usuarioAtual()]);
  const itens = cursos.map(curso => { const s = statsCurso(curso); return { curso, aulas: s.aulas, sec: s.sec }; });

  // evolução: para cada curso do aluno, quanto de cada módulo (eixo) já foi concluído
  const evolucao: { titulo: string; slug: string; eixos: string[]; valores: number[] }[] = [];
  if (u) {
    const { data: mats } = await db().from('matriculas').select('curso_id').eq('usuario_id', u.id).eq('status', 'ativo');
    for (const c of cursos.filter(x => (mats || []).some(m => m.curso_id === x.uuid))) {
      const p = await progressoCurso(u.id, c);
      const valores = c.modulos.map(m => { const as = m.aulas.filter(a => a.tipo !== 'teste'); return as.length ? Math.round((as.filter(a => p.concluidas.has(a.id)).length / as.length) * 100) : 0; });
      evolucao.push({ titulo: c.titulo, slug: c.id, eixos: c.eixos, valores });
    }
  }

  return (
    <div className="wrap">
      <div id="diag"><Diagnostico cursos={itens} pacotes={pacotes.filter(p => p.cursos.every(id => cursos.some(c => c.id === id)))} /></div>
      {evolucao.map(e => (
        <div id="evo" key={e.slug}>
          <div className="teia-top"><h1>Sua teia em {e.titulo}</h1><p>Cada eixo é um módulo do curso e vai de 0 a 100: quanto dele você já concluiu.</p></div>
          <div className="teia-grid">
            <div className="webpanel">
              <Teia eixos={e.eixos} series={[{ values: e.valores, color: '#4FA3F0' }]} opcoes={{ w: 440, h: 400, labels: true, dots: true, stroke: 3, animate: true, aria: 'Evolução por módulo' }} />
              <div className="legend"><span><i style={{ background: 'var(--oleo)' }} />Concluído</span></div>
            </div>
            <div className="panel">
              <h2>Evolução por eixo</h2>
              <p className="sub">Média de {Math.round(e.valores.reduce((s, v) => s + v, 0) / Math.max(1, e.valores.length))}% concluído.</p>
              {e.eixos.map((x, i) => (
                <div className="axis-row" key={x + i}><span>{x}</span><span className="delta">{e.valores[i]}%</span>
                  <div className="bars"><span className="d" style={{ width: `${e.valores[i]}%` }} /></div></div>
              ))}
              <Link className="btn btn-ghost full" style={{ marginTop: 16, color: 'var(--mata)' }} href={`/cursos/${e.slug}/aula`}>Continuar o curso</Link>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
