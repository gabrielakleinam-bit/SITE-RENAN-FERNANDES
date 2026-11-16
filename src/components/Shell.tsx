'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { useApp } from './App';
import { iniciais } from '@/lib/duracao';

const ICONES = {
  inicio: <path d="M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z" />,
  curso: <><path d="M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2z" /><path d="M4 19V5" /></>,
  aula: <><rect x="3" y="5" width="18" height="14" rx="3" /><path d="M10 9l5 3-5 3z" /></>,
  teia: <><path d="M12 2l8.6 5v10L12 22l-8.6-5V7z" /><path d="M12 7l4.3 2.5v5L12 17l-4.3-2.5v-5z" /><path d="M12 2v20M3.4 7l17.2 10M20.6 7L3.4 17" /></>,
  duvidas: <path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12z" />,
};

export function Topo() {
  const { usuario, abrirLogin, sair } = useApp();
  const [menu, setMenu] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const path = usePathname();
  useEffect(() => setMenu(false), [path]);
  useEffect(() => {
    if (!menu) return;
    const f = (e: MouseEvent) => { if (!ref.current?.contains(e.target as Node)) setMenu(false); };
    const k = (e: KeyboardEvent) => { if (e.key === 'Escape') setMenu(false); };
    document.addEventListener('click', f); document.addEventListener('keydown', k);
    return () => { document.removeEventListener('click', f); document.removeEventListener('keydown', k); };
  }, [menu]);

  return (
    <header className="top">
      <Link className="logo" href="/" aria-label="Renan Fernandes Massoterapia, ir para o início">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className="logo-img" src="/img/logo-clara.webp" alt="Renan Fernandes Massoterapia" />
      </Link>
      <div className="top-search" role="search">Buscar cursos, técnicas ou regiões do corpo</div>
      <div className="spacer" />
      <div ref={ref}>
        {usuario ? (
          <button className="avatar" aria-haspopup="menu" aria-expanded={menu} aria-label="Abrir menu da conta" onClick={() => setMenu(m => !m)}>
            {usuario.papel === 'admin' ? 'A' : iniciais(usuario.nome).slice(0, 1)}
          </button>
        ) : (
          <button className="btn btn-oleo" style={{ padding: '9px 16px' }} onClick={() => abrirLogin()}>Entrar</button>
        )}
        <div className={'menu' + (menu ? ' open' : '')} role="menu">
          <div className="who"><strong>{usuario?.nome}</strong><span>{usuario?.email}</span></div>
          <Link role="menuitem" className="menu-a" href="/diagnostico">Minha teia</Link>
          <Link role="menuitem" className="menu-a" href="/duvidas">Minhas dúvidas</Link>
          <button role="menuitem" onClick={() => { setMenu(false); sair('Você saiu.'); }}>Sair</button>
          <button role="menuitem" onClick={() => { setMenu(false); sair('Você saiu de todos os dispositivos.'); }}>Sair de todos os dispositivos</button>
        </div>
      </div>
    </header>
  );
}

export function Navegacao() {
  const path = usePathname();
  const { ultimoCurso } = useApp();
  const itens: [keyof typeof ICONES, string, string, (p: string) => boolean][] = [
    ['inicio', 'Início', '/', p => p === '/'],
    ['curso', 'Curso', `/cursos/${ultimoCurso}`, p => /^\/cursos\/[^/]+$/.test(p)],
    ['aula', 'Aula', `/cursos/${ultimoCurso}/aula`, p => p.includes('/aula')],
    ['teia', 'Teia', '/diagnostico', p => p.startsWith('/diagnostico')],
    ['duvidas', 'Dúvidas', '/duvidas', p => p.startsWith('/duvidas')],
  ];
  return (
    <nav className="nav" aria-label="Navegação principal">
      {itens.map(([k, rot, href, ativo]) => (
        <Link key={k} href={href} aria-current={ativo(path) ? 'page' : undefined}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">{ICONES[k]}</svg>
          {rot}
        </Link>
      ))}
    </nav>
  );
}

export function LoginSheet() {
  const { loginAberto, fecharLogin, entrar, toast, depoisDoLogin } = useApp();
  const router = useRouter();
  const [modo, setModo] = useState<'entrar' | 'criar'>('entrar');
  const [email, setEmail] = useState('');
  const [nome, setNome] = useState('');
  const [senha, setSenha] = useState('');
  const [aceite, setAceite] = useState(false);
  const fechar = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!loginAberto) return;
    const t = setTimeout(() => fechar.current?.focus(), 50);
    const k = (e: KeyboardEvent) => { if (e.key === 'Escape') fecharLogin(); };
    document.addEventListener('keydown', k);
    return () => { clearTimeout(t); document.removeEventListener('keydown', k); };
  }, [loginAberto, fecharLogin]);

  function concluir(mail: string) {
    if (!mail.includes('@')) { toast('Informe um e-mail válido.'); return; }
    const u = entrar(mail, modo === 'criar' ? nome : undefined);
    fecharLogin();
    if (u.papel === 'admin') { toast('Entrou como administrador. O painel chega nos próximos marcos.'); return; }
    toast(modo === 'criar' ? 'Conta criada. Confirme seu e-mail para receber o certificado.' : 'Você entrou.');
    const f = depoisDoLogin.current; depoisDoLogin.current = null;
    if (f) setTimeout(f, 250); else router.refresh();
  }

  return (
    <>
      <div className={'scrim' + (loginAberto ? ' open' : '')} onClick={fecharLogin} />
      <div className={'sheet' + (loginAberto ? ' open' : '')} role="dialog" aria-modal="true" aria-labelledby="loginTitle" aria-hidden={!loginAberto}>
        <div className="grab" />
        <button className="close" ref={fechar} onClick={fecharLogin}>Fechar</button>
        <h2 id="loginTitle">{modo === 'criar' ? 'Criar conta' : 'Entrar'}</h2>
        <p style={{ color: 'var(--muted)', fontSize: 14, margin: '6px 0 0' }}>
          Versão de demonstração. Contas de teste: <b>cliente@teste.com</b> (compra aguardando liberação), <b>ana@exemplo.com.br</b> (aluna com o curso de lombar) e <b>admin@teste.com</b>. Qualquer senha.
        </p>
        <div className="tabs" role="tablist">
          <button role="tab" aria-selected={modo === 'entrar'} onClick={() => setModo('entrar')}>Entrar</button>
          <button role="tab" aria-selected={modo === 'criar'} onClick={() => setModo('criar')}>Criar conta</button>
        </div>
        <form onSubmit={e => {
          e.preventDefault();
          if (modo === 'criar' && !aceite) { toast('Para criar a conta, aceite os Termos e a Política de Privacidade.'); return; }
          concluir(email);
        }}>
          {modo === 'criar' && (
            <div className="field"><label htmlFor="fName">Nome completo</label><input id="fName" autoComplete="name" value={nome} onChange={e => setNome(e.target.value)} /></div>
          )}
          <div className="field"><label htmlFor="fEmail">E-mail</label><input id="fEmail" type="email" autoComplete="email" required value={email} onChange={e => setEmail(e.target.value)} /></div>
          <div className="field"><label htmlFor="fPass">Senha</label><input id="fPass" type="password" autoComplete={modo === 'criar' ? 'new-password' : 'current-password'} value={senha} onChange={e => setSenha(e.target.value)} /></div>
          {modo === 'criar' && (
            <label className="consent"><input type="checkbox" checked={aceite} onChange={e => setAceite(e.target.checked)} /> Li e aceito os Termos de Uso e a Política de Privacidade, e autorizo o tratamento dos meus dados conforme a LGPD.</label>
          )}
          <button className="btn btn-anil full">{modo === 'criar' ? 'Criar conta' : 'Entrar'}</button>
          <div className="or">ou</div>
          <button type="button" className="btn btn-ghost full" onClick={() => toast('O login com Google entra no M2, com o Supabase.')}>Continuar com Google</button>
          <button type="button" className="btn btn-quiet full" onClick={() => toast('A recuperação de senha entra no M2.')}>Esqueci minha senha</button>
        </form>
      </div>
    </>
  );
}
