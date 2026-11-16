import { FormValidar } from '@/components/FormValidar';
export const metadata = { title: 'Validar certificado' };

export default function PaginaValidar() {
  return (
    <div className="wrap placeholder">
      <div className="panel" style={{ maxWidth: 640 }}>
        <h2>Validar certificado</h2>
        <p className="sub">Digite o código impresso no rodapé do certificado.</p>
        <FormValidar />
      </div>
    </div>
  );
}
