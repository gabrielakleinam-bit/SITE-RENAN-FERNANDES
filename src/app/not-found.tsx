import Link from 'next/link';

export default function NaoEncontrado() {
  return (
    <div className="wrap placeholder">
      <div className="panel">
        <h2>Página não encontrada</h2>
        <p className="sub">O endereço pode ter mudado.</p>
        <Link className="btn btn-oleo" href="/">Ir para o início</Link>
      </div>
    </div>
  );
}
