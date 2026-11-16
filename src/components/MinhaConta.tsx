'use client';
import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from './App';
import { excluirMinhaConta, salvarNome } from '@/app/acoes-aluno';

export function MinhaConta({ nome, email }: { nome: string; email: string }) {
  const { toast } = useApp();
  const router = useRouter();
  const [n, setN] = useState(nome);
  const [conf, setConf] = useState('');
  const [aviso, setAviso] = useState('');
  return (
    <div className="dv-grid" style={{ gridTemplateColumns: 'minmax(0,1fr)' }}>
      <div className="panel">
        <h2>Seus dados</h2>
        <div className="field" style={{ marginTop: 12 }}><label htmlFor="mn">Nome no certificado</label><input id="mn" value={n} onChange={e => setN(e.target.value)} /></div>
        <button className="btn btn-anil" onClick={async () => { await salvarNome(n); toast('Nome salvo.'); router.refresh(); }}>Salvar</button>
      </div>
      <div className="panel">
        <h2>Privacidade (LGPD)</h2>
        <p className="sub">Você pode baixar uma cópia de tudo o que guardamos sobre você ou excluir a sua conta. Leia a <Link href="/privacidade">Política de Privacidade</Link>.</p>
        <a className="btn btn-line" href="/api/meus-dados">Baixar meus dados</a>
        <div style={{ borderTop: '1px solid var(--linha)', marginTop: 18, paddingTop: 16 }}>
          <b>Excluir minha conta</b>
          <p className="muted" style={{ fontSize: 14, margin: '6px 0 10px' }}>Apaga o seu cadastro, compras, progresso, dúvidas e certificados. Não dá para desfazer. Para confirmar, digite o seu e-mail ({email}).</p>
          <div className="field"><input aria-label="Confirme o e-mail" value={conf} onChange={e => setConf(e.target.value)} placeholder={email} /></div>
          {aviso && <p className="form-aviso">{aviso}</p>}
          <button className="btn btn-sm" style={{ background: '#9B1C1C', color: '#fff' }} disabled={conf.trim().toLowerCase() !== email.toLowerCase()}
            onClick={async () => { const r = await excluirMinhaConta(conf); if (r?.erro) setAviso(r.erro); }}>Excluir minha conta</button>
        </div>
      </div>
    </div>
  );
}
