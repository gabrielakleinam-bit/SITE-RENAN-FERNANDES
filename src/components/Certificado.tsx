/* Certificado em HTML (mesmo desenho no admin, no aluno e no PDF). */
export interface ModeloCert { imagem_url: string | null; cor: string; nome_y: number; curso_y: number; horas_y: number; rodape_y: number }
export interface DadosCert { nome: string; curso: string; horas: string; data: string; codigo: string }

function FundoPadrao() {
  const t = (y: number, txt: string, o: React.SVGProps<SVGTextElement> = {}) =>
    <text x="561.5" y={y} textAnchor="middle" fontFamily="Atkinson Hyperlegible, sans-serif" fill="#5C6670" {...o}>{txt}</text>;
  return (
    <svg viewBox="0 0 1123 794" preserveAspectRatio="none" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }} aria-hidden="true">
      <rect width="1123" height="794" fill="#FFFFFF" />
      <rect x="28" y="28" width="1067" height="738" fill="none" stroke="#13171C" strokeWidth="3" />
      <rect x="42" y="42" width="1039" height="710" fill="none" stroke="#4FA3F0" strokeWidth="1.5" />
      <path d="M42 690 C300 630 560 740 1081 650 L1081 752 L42 752 Z" fill="#EAF3FE" />
      <path d="M42 715 C320 660 600 760 1081 680" fill="none" stroke="#4FA3F0" strokeWidth="3" opacity=".7" />
      <image href="/img/logo-cor.webp" x="471" y="62" width="181" height="106" />
      {t(226, 'CERTIFICADO', { fontFamily: 'Bricolage Grotesque, sans-serif', fontWeight: 800, fontSize: 38, letterSpacing: 6, fill: '#13171C' })}
      {t(258, 'DE CONCLUSÃO DE CURSO LIVRE', { fontSize: 17, letterSpacing: 4 })}
      {t(318, 'Certificamos que', { fontSize: 18 })}
      <line x1="431" y1="628" x2="692" y2="628" stroke="#13171C" strokeWidth="1.2" />
      {t(652, 'Renan Fernandes', { fontSize: 16, fontWeight: 700, fill: '#13171C' })}
      {t(672, 'Massoterapeuta · responsável pelo conteúdo', { fontSize: 13 })}
    </svg>
  );
}

export function Certificado({ d, m, validar }: { d: DadosCert; m: ModeloCert; validar: string }) {
  const f = (y: number, cls: string, c: React.ReactNode) => <div className={`cf ${cls}`} style={{ top: `${y}%`, color: m.cor }}>{c}</div>;
  return (
    <div className="cert" role="img" aria-label={`Certificado de ${d.nome}`}>
      {m.imagem_url
        // eslint-disable-next-line @next/next/no-img-element
        ? <img src={m.imagem_url} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
        : <FundoPadrao />}
      {f(m.nome_y, 'cf-nome', d.nome)}
      {f(m.curso_y, 'cf-curso', <>concluiu o curso livre <b>{d.curso}</b></>)}
      {f(m.horas_y, 'cf-horas', <>com carga horária cumprida de <b>{d.horas}</b></>)}
      {f(m.rodape_y, 'cf-rod', `Emitido em ${d.data} · Código ${d.codigo || '—'} · valide em ${validar}`)}
    </div>
  );
}
