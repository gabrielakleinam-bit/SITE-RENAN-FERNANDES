import { certPorCodigo } from '@/lib/certificado';
import { FormValidar } from '@/components/FormValidar';

export const metadata = { title: 'Validar certificado' };

/* Página pública: confirma que um certificado existe e foi emitido. */
export default async function Validar({ params }: { params: Promise<{ codigo: string }> }) {
  const codigo = decodeURIComponent((await params).codigo).trim().toUpperCase();
  const c = await certPorCodigo(codigo);
  return (
    <div className="wrap placeholder">
      <div className="panel" style={{ maxWidth: 640 }}>
        <h2>Validação de certificado</h2>
        {c ? (
          <>
            <span className="owned-tag" style={{ marginTop: 12 }}>Certificado válido</span>
            <p><b>{c.dados.nome}</b> concluiu o curso livre <b>{c.dados.curso}</b>, com carga horária cumprida de {c.dados.horas}.</p>
            <p className="muted">Emitido em {c.dados.data} por Renan Fernandes Massoterapia · código {c.dados.codigo}</p>
          </>
        ) : <p className="form-aviso" style={{ marginTop: 12 }}>Nenhum certificado emitido com o código {codigo}.</p>}
        <div style={{ marginTop: 18 }}><FormValidar /></div>
      </div>
    </div>
  );
}
