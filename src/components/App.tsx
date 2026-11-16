'use client';
/* Estado do visitante no navegador: usuário, matrículas, aulas concluídas, avisos e o painel de login.
   Os dados vêm do servidor (layout) e são recarregados com router.refresh() depois de cada mudança. */
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';

export interface Usuario { id: string; email: string; nome: string; papel: 'aluno' | 'admin' }
export interface EstadoAluno { mats: Record<string, 'ativo' | 'aguardando'>; concluidas: string[]; feitas: Record<string, number> }

interface Ctx {
  pronto: boolean;
  usuario: Usuario | null;
  admin: boolean;
  configurado: boolean;
  tem: (slug: string) => boolean;
  aguardando: (slug: string) => boolean;
  feitas: (slug: string) => number;
  concluida: (aulaId: string) => boolean;
  marcarConcluida: (slug: string, aulaId: string) => void;
  ultimoCurso: string;
  setUltimoCurso: (slug: string) => void;
  loginAberto: boolean;
  abrirLogin: (depois?: () => void) => void;
  fecharLogin: () => void;
  depoisDoLogin: React.MutableRefObject<(() => void) | null>;
  toast: (msg: string) => void;
}

const C = createContext<Ctx | null>(null);

export function AppProvider({ children, usuario, estado, configurado, primeiroCurso }: {
  children: React.ReactNode; usuario: Usuario | null; estado: EstadoAluno; configurado: boolean; primeiroCurso: string;
}) {
  const [extras, setExtras] = useState<{ concl: string[]; feitas: Record<string, number> }>({ concl: [], feitas: {} });
  const [ultimo, setUltimo] = useState(primeiroCurso);
  const [loginAberto, setLoginAberto] = useState(false);
  const [msg, setMsg] = useState<{ t: string; n: number } | null>(null);
  const depoisDoLogin = useRef<(() => void) | null>(null);

  useEffect(() => { setExtras({ concl: [], feitas: {} }); }, [estado]);
  useEffect(() => { try { const s = localStorage.getItem('rf-ultimo-curso'); if (s) setUltimo(s); } catch { /* sem armazenamento */ } }, []);
  const toast = useCallback((t: string) => setMsg({ t, n: Date.now() }), []);
  useEffect(() => { if (!msg) return; const id = setTimeout(() => setMsg(null), 3200); return () => clearTimeout(id); }, [msg]);

  const setUltimoCurso = useCallback((slug: string) => {
    setUltimo(slug);
    try { localStorage.setItem('rf-ultimo-curso', slug); } catch { /* sem armazenamento */ }
  }, []);

  const v = useMemo<Ctx>(() => {
    const concl = new Set([...estado.concluidas, ...extras.concl]);
    const admin = usuario?.papel === 'admin';
    return {
      pronto: true, usuario, admin, configurado,
      tem: s => admin || estado.mats[s] === 'ativo',
      aguardando: s => estado.mats[s] === 'aguardando',
      feitas: s => (estado.feitas[s] || 0) + (extras.feitas[s] || 0),
      concluida: a => concl.has(a),
      marcarConcluida: (s, a) => setExtras(x => x.concl.includes(a) || estado.concluidas.includes(a) ? x
        : { concl: [...x.concl, a], feitas: { ...x.feitas, [s]: (x.feitas[s] || 0) + 1 } }),
      ultimoCurso: ultimo, setUltimoCurso,
      loginAberto,
      abrirLogin: depois => { depoisDoLogin.current = depois || null; setLoginAberto(true); },
      fecharLogin: () => setLoginAberto(false),
      depoisDoLogin, toast,
    };
  }, [usuario, estado, extras, configurado, ultimo, setUltimoCurso, loginAberto, toast]);

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
