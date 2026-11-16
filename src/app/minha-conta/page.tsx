import { exigirUsuario } from '@/lib/sessao';
import { MinhaConta } from '@/components/MinhaConta';

export const metadata = { title: 'Minha conta', robots: { index: false } };

export default async function Conta() {
  const u = await exigirUsuario('/minha-conta');
  return (
    <div className="wrap placeholder">
      <div className="teia-top"><h1>Minha conta</h1><p>{u.email}</p></div>
      <MinhaConta nome={u.nome} email={u.email} />
    </div>
  );
}
