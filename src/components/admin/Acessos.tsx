'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '../App';
import { Pessoa } from './Comum';
import { brl } from '@/lib/duracao';
import { decidirPedido } from '@/app/admin/acoes';

export interface Pedido { id: string; valor: number; metodo: string; descricao: string; status: string; criado: string; decidido: string | null; nome: string; email: string; pacote: boolean; cursos: string[] }

const dt = (s: string) => new Date(s).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit', timeZone: 'America/Sao_Paulo' });

export function Acessos({ pedidos }: { pedidos: Pedido[] }) {
  const [aba, setAba] = useState<'aguardando' | 'liberado' | 'negado'>('aguardando');
  const [ocupado, setOcupado] = useState('');
  const { toast } = useApp();
  const router = useRouter();
  const n = (s: string) => pedidos.filter(p => p.status === s).length;
  const lista = pedidos.filter(p => p.status === aba);

  async function decidir(id: string, liberar: boolean) {
    setOcupado(id);
    const r = await decidirPedido(id, liberar);
    setOcupado('');
    if (r.erro) toast(r.erro); else { toast(liberar ? 'Entrada liberada. O aluno recebe um aviso por e-mail.' : 'Pedido negado.'); router.refresh(); }
  }

  return (
    <div className="adm-pg wrap">
      <div className="ad-top"><div><h1>Acessos</h1><p>Confira o Pix no extrato do banco (valor e identificador começando com RF) e libere a entrada. Um pedido de pacote libera todos os cursos do pacote.</p></div></div>
      <div className="seg4" role="tablist">
        {([['aguardando', 'Aguardando'], ['liberado', 'Liberados'], ['negado', 'Negados']] as const).map(([k, r]) => (
          <button key={k} aria-pressed={aba === k} onClick={() => setAba(k)}>{r}<span>{n(k)}</span></button>
        ))}
      </div>
      <div className="acc-list">
        {lista.length ? lista.map(p => (
          <div className="ad-card acc" key={p.id}>
            <Pessoa nome={p.nome} sub={p.email} />
            <div><b>{p.descricao.split(' · ')[0]}</b>
              <small className="hint" style={{ display: 'block' }}>{p.pacote ? `Pacote: ${p.cursos.join(', ')}` : p.cursos.join(', ')}</small>
              {p.descricao.includes(' · ') && <small className="hint">{p.descricao.split(' · ')[1]}</small>}
            </div>
            <div className="acc-val"><b>{brl(p.valor)}</b><small>{p.metodo === 'pix' ? 'Pix' : p.metodo} · {dt(p.criado)}</small></div>
            {aba === 'aguardando' ? (
              <div className="acts">
                <button className="btn btn-oleo btn-sm" disabled={ocupado === p.id} onClick={() => decidir(p.id, true)}>Liberar entrada</button>
                <button className="btn btn-line btn-sm danger" disabled={ocupado === p.id} onClick={() => decidir(p.id, false)}>Negar</button>
              </div>
            ) : <span className={`tag ${aba === 'liberado' ? 'green' : 'red'}`}>{aba === 'liberado' ? 'Liberado' : 'Negado'}{p.decidido ? ` · ${dt(p.decidido)}` : ''}</span>}
          </div>
        )) : <div className="ad-card empty">{aba === 'aguardando' ? 'Nenhum pagamento esperando liberação.' : 'Nada por aqui ainda.'}</div>}
      </div>
    </div>
  );
}
