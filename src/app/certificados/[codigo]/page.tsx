import Link from 'next/link';
import { notFound } from 'next/navigation';
import { certPorCodigo, linkValidacao, modeloCert } from '@/lib/certificado';
import { exigirUsuario } from '@/lib/sessao';
import { Certificado } from '@/components/Certificado';

export const metadata = { title: 'Certificado', robots: { index: false } };

export default async function VerCertificado({ params }: { params: Promise<{ codigo: string }> }) {
  const { codigo } = await params;
  const u = await exigirUsuario(`/certificados/${codigo}`);
  const c = await certPorCodigo(codigo);
  if (!c || (c.usuarioId !== u.id && u.papel !== 'admin')) notFound();
  return (
    <div className="wrap placeholder">
      <div className="cert-view">
        <h1 style={{ fontSize: 32, fontWeight: 800 }}>Seu certificado</h1>
        <Certificado d={c.dados} m={await modeloCert()} validar={linkValidacao()} />
        <div className="acts">
          <a className="btn btn-oleo" href={`/api/certificados/${codigo}/pdf`}>Baixar PDF</a>
          <Link className="btn btn-line" href={`/validar/${codigo}`}>Página pública de validação</Link>
        </div>
      </div>
    </div>
  );
}
