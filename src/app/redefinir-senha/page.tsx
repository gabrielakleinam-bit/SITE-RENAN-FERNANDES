'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { clienteNavegador } from '@/lib/supabase/navegador';

export default function RedefinirSenha() {
  const [senha, setSenha] = useState('');
  const [aviso, setAviso] = useState('');
  const router = useRouter();
  async function salvar(e: React.FormEvent) {
    e.preventDefault();
    const { error } = await clienteNavegador().auth.updateUser({ password: senha });
    if (error) { setAviso('Não foi possível trocar a senha. Abra de novo o link do e-mail.'); return; }
    router.push('/'); router.refresh();
  }
  return (
    <div className="wrap placeholder">
      <form className="panel" style={{ maxWidth: 460, margin: '0 auto' }} onSubmit={salvar}>
        <h2>Nova senha</h2>
        <div className="field" style={{ marginTop: 12 }}><label htmlFor="ns">Nova senha</label>
          <input id="ns" type="password" minLength={6} required autoComplete="new-password" value={senha} onChange={e => setSenha(e.target.value)} /></div>
        {aviso && <p className="form-aviso">{aviso}</p>}
        <button className="btn btn-anil full">Salvar nova senha</button>
      </form>
    </div>
  );
}
