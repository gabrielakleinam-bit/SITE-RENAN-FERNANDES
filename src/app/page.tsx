import Link from 'next/link';
import { listarCursos, listarPacotes } from '@/lib/catalogo';
import { brl, fmtTotal, precoCheioPacote, segPacote, statsCurso } from '@/lib/duracao';
import { RENAN } from '@/lib/dados';
import { Capa } from '@/components/Capa';
import { Teia } from '@/components/Teia';
import { BotaoComprar, Carrossel, Catalogo, VerCursos } from '@/components/Inicio';
import { Redes } from '@/components/Redes';
import { Rodape } from '@/components/Rodape';

export default async function Inicio() {
  const cursos = await listarCursos();
  const pacotes = await listarPacotes();
  const itens = cursos.map(curso => { const s = statsCurso(curso); return { curso, aulas: s.aulas, sec: s.sec }; });

  return (
    <>
      <div className="hero">
        <div className="wrap hero-grid">
          <div>
            <h1>Aprenda a cuidar do corpo com quem já fez mais de 17 mil atendimentos.</h1>
            <p className="lead">12 anos de massoterapia em Curitiba, agora em aulas em vídeo: autocuidado para quem convive com tensão no dia a dia e formação para terapeutas. Antes da primeira aula, um diagnóstico de 5 minutos desenha a teia do que você já sabe. No fim, a mesma teia mostra o quanto evoluiu.</p>
            <div className="ctas">
              <Link className="btn btn-oleo" href="/diagnostico">Fazer diagnóstico grátis</Link>
              <VerCursos />
            </div>
          </div>
          <div>
            <Teia className="hero-web"
              eixos={['Anatomia', 'Técnica manual', 'Pressão e direção', 'Avaliação', 'Segurança', 'Autocuidado']}
              series={[{ values: [35, 20, 40, 25, 15, 30], color: '#E9A25F' }, { values: [82, 70, 88, 66, 62, 78], color: '#4FA3F0' }]}
              opcoes={{ w: 420, h: 400, labels: true, animate: true, dots: true, stroke: 3, aria: 'Exemplo de teia antes e depois de um curso' }} />
            <div className="legend">
              <span><i style={{ background: 'var(--lavanda)' }} />Antes do curso</span>
              <span><i style={{ background: 'var(--oleo)' }} />Depois do curso</span>
            </div>
          </div>
        </div>
      </div>

      <div className="wrap">
        <div className="section" id="destaques">
          <div className="section-head"><h2>Em destaque</h2></div>
          <Carrossel itens={itens} />
        </div>

        <div className="section" id="catalogSection">
          <div className="section-head"><h2>Cursos</h2></div>
          <Catalogo itens={itens} />
        </div>

        <div className="section" id="pacotes">
          <div className="section-head"><h2>Pacotes com desconto</h2></div>
          <div className="packs">
            {pacotes.map(p => {
              const cheio = precoCheioPacote(p, cursos);
              const cs = p.cursos.map(id => cursos.find(c => c.id === id)!);
              return (
                <article className="pack" key={p.id}>
                  <div className="pack-art">
                    {cs.map((c, i) => <Capa key={c.id} curso={c} className="pa" k={`pk${p.id}${i}`} center />)}
                    <span className="off">{Math.round((1 - p.preco / cheio) * 100)}% off</span>
                  </div>
                  <div className="pack-b">
                    <h3>{p.titulo}</h3>
                    <p>{p.descricao}</p>
                    <ul>{cs.map(c => <li key={c.id}>{c.titulo}</li>)}</ul>
                    <div className="pack-f">
                      <div><s>{brl(cheio)}</s><b>{brl(p.preco)}</b><small>{p.cursos.length} cursos · {fmtTotal(segPacote(p, cursos))}</small></div>
                      <BotaoComprar className="btn btn-anil" rotulo="Quero o pacote" titulo={`Pacote ${p.titulo}`} />
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </div>

        <div className="section">
          <div className="section-head"><h2>Como funciona</h2></div>
          <div className="journey">
            {[
              ['Diagnóstico de entrada', 'Perguntas rápidas por competência desenham sua teia inicial.'],
              ['Aulas em vídeo', 'Demonstrações em modelo, com câmera no detalhe das mãos. Avance e acelere quando quiser; a aula conta quando 90% dela passou pela tela.'],
              ['Testes por módulo', 'Anatomia, contraindicações e protocolo em múltipla escolha, com correção na hora.'],
              ['Diagnóstico final', 'A teia de saída aparece sobre a de entrada, eixo por eixo.'],
              ['Certificado', 'Certificado de curso livre, com carga horária e código de validação público.'],
            ].map(([t, d], i) => (
              <div className="step" key={t}><div className="knot">{i + 1}</div><div><h3>{t}</h3><p>{d}</p></div></div>
            ))}
          </div>
        </div>

        <div className="teach about">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className="about-pic" alt="Renan Fernandes" src="/img/renan-foto.jpg" />
          <div>
            <h2 style={{ fontSize: 26, fontWeight: 800 }}>Quem ensina</h2>
            <p style={{ marginTop: 8 }}>Renan Fernandes é massoterapeuta há 12 anos em Curitiba, com foco em recuperação muscular e alívio de tensões. Nas aulas, a câmera fica onde importa: nas mãos dele, do jeito que você já conhece do Instagram.</p>
            <dl className="about-facts">
              <div><dt>Experiência</dt><dd>12 anos</dd></div>
              <div><dt>Atendimentos</dt><dd>+17 mil</dd></div>
              <div><dt>Atende em</dt><dd>Curitiba e região</dd></div>
            </dl>
            <Redes />
          </div>
          <a className="btn btn-oleo" href={RENAN.whatsappAgendar} target="_blank" rel="noopener">Agendar pelo WhatsApp</a>
        </div>
        <Rodape />
      </div>
    </>
  );
}
