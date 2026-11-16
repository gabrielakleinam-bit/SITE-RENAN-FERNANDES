import { iniciais } from '@/lib/duracao';
import { hashStr } from '@/lib/texto';

const CORES = ['#1F6FD1', '#14724D', '#8A4B12', '#5B3FB0', '#A4262C', '#0E6E86'];

export function Pessoa({ nome, sub, t = 38 }: { nome: string; sub?: string; t?: number }) {
  return (
    <div className="person">
      <span className="av" style={{ width: t, height: t, background: CORES[hashStr(nome) % CORES.length] }}>{iniciais(nome) || '?'}</span>
      <div style={{ minWidth: 0 }}><b>{nome || 'Sem nome'}</b>{sub && <small>{sub}</small>}</div>
    </div>
  );
}

export function Barra({ pct }: { pct: number }) {
  return <div className="pbar"><div className="pb"><b style={{ width: `${pct}%` }} /></div>{pct}%</div>;
}

export const Ic = ({ d, s = 20 }: { d: React.ReactNode; s?: number }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{d}</svg>
);
