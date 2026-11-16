import Link from 'next/link';

export function EmBreve({ titulo, texto, marco }: { titulo: string; texto: string; marco: string }) {
  return (
    <div className="wrap placeholder">
      <div className="teia-top">
        <h1>{titulo}</h1>
        <p>{texto}</p>
      </div>
      <div className="panel" style={{ marginTop: 20 }}>
        <h2>Em construção</h2>
        <p className="sub">Esta tela entra no {marco}. Enquanto isso, conheça os cursos.</p>
        <Link className="btn btn-oleo" href="/#catalogSection">Ver cursos</Link>
      </div>
    </div>
  );
}
