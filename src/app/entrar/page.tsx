import { redirect } from 'next/navigation';
import { FormLogin } from '@/components/Shell';
import { usuarioAtual } from '@/lib/sessao';

export const metadata = { title: 'Entrar' };

export default async function Entrar({ searchParams }: { searchParams: Promise<{ voltar?: string; erro?: string }> }) {
  const { voltar, erro } = await searchParams;
  const destino = voltar && voltar.startsWith('/') && !voltar.startsWith('//') ? voltar : undefined;
  const u = await usuarioAtual();
  if (u) redirect(destino || (u.papel === 'admin' ? '/admin' : '/'));
  return (
    <div className="wrap placeholder">
      <div className="panel" style={{ maxWidth: 460, margin: '0 auto' }}>
        <h2>Entrar</h2>
        {erro && <p className="form-aviso">O link expirou ou já foi usado. Entre com e-mail e senha ou peça um novo link.</p>}
        <FormLogin voltar={destino} />
      </div>
    </div>
  );
}
