'use client';
/* Estado do aluno no navegador: sessão de demonstração, matrículas, aulas concluídas, avisos.
   M1: tudo local (contas de teste do protótipo). M2: a sessão vem do Supabase Auth e as
   matrículas e o progresso vêm do banco; os componentes continuam usando useApp(). */
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { CONTAS_DEMO } from '@/lib/dados';

export interface Usuario { email: string; nome: string; papel: 'aluno' | 'admin' }

interface Salvo {
  usuario: Usuario | null;
  concluidas: Record<string, true>;   // "cursoId:aulaId"
  ultimoCurso: string;
}

interface Ctx {
  pronto: boolean;
  usuario: Usuario | null;
  tem: (cursoId: string) => boolean;
  aguardando: (cursoId: string) => boolean;
  feitas: (cursoId: string) => number;
  concluida: (cursoId: string, aulaId: string) => boolean;
  marcarConcluida: (cursoId: string, aulaId: string) => void;
  ultimoCurso: string;
  setUltimoCurso: (id: string) => void;
  entrar: (email: string, nome?: string) => Usuario;
  sair: (msg?: string) => void;
  loginAberto: boolean;
  abrirLogin: (depois?: () => void) => void;
  fecharLogin: () => void;
  depoisDoLogin: React.MutableRefObject<(() => void) | null>;
  toast: (msg: string) => void;
}

const C = createContext<Ctx | null>(null);
const CHAVE = 'rf-demo-v1';
const VAZIO: Salvo = { usuario: null, concluidas: {}, ultimoCurso: 'lombar' };

function ler(): Salvo {
  try { const s = localStorage.getItem(CHAVE); return s ? { ...VAZIO, ...JSON.parse(s) } : VAZIO; } catch { return VAZIO; }
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [s, setS] = useState<Salvo>(VAZIO);
  const [pronto, setPronto] = useState(false);
  const [loginAberto, setLoginAberto] = useState(false);
  const [msg, setMsg] = useState<{ t: string; n: number } | null>(null);
  const depoisDoLogin = useRef<(() => void) | null>(null);

  useEffect(() => { setS(ler()); setPronto(true); }, []);
  useEffect(() => { if (pronto) try { localStorage.setItem(CHAVE, JSON.stringify(s)); } catch { /* armazenamento indisponível */ } }, [s, pronto]);

  const toast = useCallback((t: string) => setMsg({ t, n: Date.now() }), []);
  useEffect(() => { if (!msg) return; const id = setTimeout(() => setMsg(null), 2800); return () => clearTimeout(id); }, [msg]);

  const mats = s.usuario ? CONTAS_DEMO[s.usuario.email]?.mats || {} : {};

  const v = useMemo<Ctx>(() => ({
    pronto,
    usuario: s.usuario,
    tem: id => mats[id]?.status === 'ativo',
    aguardando: id => mats[id]?.status === 'aguardando',
    feitas: id => Math.max(mats[id]?.feitas || 0, Object.keys(s.concluidas).filter(k => k.startsWith(id + ':')).length),
    concluida: (c, a) => !!s.concluidas[`${c}:${a}`],
    marcarConcluida: (c, a) => setS(x => ({ ...x, concluidas: { ...x.concluidas, [`${c}:${a}`]: true } })),
    ultimoCurso: s.ultimoCurso,
    setUltimoCurso: id => setS(x => (x.ultimoCurso === id ? x : { ...x, ultimoCurso: id })),
    entrar: (email, nome) => {
      email = email.trim().toLowerCase();
      const conta = CONTAS_DEMO[email];
      const u: Usuario = {
        email,
        nome: nome?.trim() || conta?.nome || email.split('@')[0].replace(/^./, c => c.toUpperCase()),
        papel: conta?.papel || 'aluno',
      };
      setS(x => ({ ...x, usuario: u, concluidas: {} }));
      return u;
    },
    sair: m => { setS(x => ({ ...x, usuario: null, concluidas: {} })); toast(m || 'Você saiu.'); },
    loginAberto,
    abrirLogin: depois => { depoisDoLogin.current = depois || null; setLoginAberto(true); },
    fecharLogin: () => setLoginAberto(false),
    depoisDoLogin,
    toast,
  }), [pronto, s, mats, loginAberto, toast]);

  return (
    <C.Provider value={v}>
      {children}
      <div className={'toast' + (msg ? ' show' : '')} role="status" aria-live="polite">{msg?.t}</div>
    </C.Provider>
  );
}

export function useApp() {
  const v = useContext(C);
  if (!v) throw new Error('useApp fora do AppProvider');
  return v;
}
