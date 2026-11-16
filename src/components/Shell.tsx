'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { useApp } from './App';
import { iniciais } from '@/lib/duracao';
import { clienteNavegador } from '@/lib/supabase/navegador';

const P = (d: React.ReactNode) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">{d}</svg>
);
const ICONES = {
  inicio: P(<path d="M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z" />),
  curso: P(<><path d="M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2z" /><path d="M4 19V5" /></>),
  aula: P(<><rect x="3" y="5" width="18" height="14" rx="3" /><path d="M10 9l5 3-5 3z" /></>),
  teia: P(<><path d="M12 2l8.6 5v10L12 22l-8.6-5V7z" /><path d="M12 7l4.3 2.5v5L12 17l-4.3-2.5v-5z" /><path d="M12 2v20M3.4 7l17.2 10M20.6 7L3.4 17" /></>),
  duvidas: P(<path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12z" />),
  visao: P(<><rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" /><rect x="3" y="14" width="7" height="7" rx="1.5" /><rect x="14" y="14" width="7" height="7" rx="1.5" /></>),
  alunos: P(<><circle cx="9" cy="8" r="4" /><path d="M2 21a7 7 0 0 1 14 0" /><path d="M16 4a4 4 0 0 1 0 8" /><path d="M22 21a7 7 0 0 0-4-6.3" /></>),
  acessos: P(<><rect x="4" y="11" width="16" height="10" rx="2" /><path d="M8 11V7a4 4 0 0 1 8 0v4" /></>),
  certificados: P(<><circle cx="12" cy="9" r="6" /><path d="M9 14.5 7.5 22 12 19.5 16.5 22 15 14.5" /></>),
};

export function Topo() {
  const { usuario, abrirLogin, toast } = useApp();
  const [menu, setMenu] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const path = usePathname();
  const router = useRouter();
  useEffect(() => setMenu(false), [path]);
  useEffect(() => {
    if (!menu) return;
    const f = (e: MouseEvent) => { if (!ref.current?.contains(e.target as Node)) setMenu(false); };
    const k = (e: KeyboardEvent) => { if (e.key === 'Escape') setMenu(false); };
    document.addEventListener('click', f); document.addEventListener('keydown', k);
    return () => { document.removeEventListener('click', f); document.removeEventListener('keydown', k); };
  }, [menu]);

  async function sair(global: boolean) {
    setMenu(false);
    await clienteNavegador().auth.signOut({ scope: global ? 'global' : 'local' });
    toast(global ? 'Você saiu de todos os dispositivos.' : 'Você saiu.');
    router.push('/'); router.refresh();
  }

  const admin = usuario?.papel === 'admin';
  return (
    <header className="top">
      <Link className="logo" href={admin ? '/admin' : '/'} aria-label="Renan Fernandes Massoterapia, ir para o início">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className="logo-img" src="/img/logo-clara.webp" alt="Renan Fernandes Massoterapia" />
      </Link>
      {!admin && <Link className="top-search" href="/#catalogSection" style={{ textDecoration: 'none' }}>Buscar cursos, técnicas ou regiões do corpo</Link>}
      <div className="spacer" />
      <div ref={ref}>
        {usuario ? (
          <button className="avatar" aria-haspopup="menu" aria-expanded={menu} aria-label="Abrir menu da conta" onClick={() => setMenu(m => !m)}>
            {admin ? 'A' : iniciais(usuario.nome).slice(0, 1)}
          </button>
        ) : (
          <button className="btn btn-oleo" style={{ padding: '9px 16px' }} onClick={() => abrirLogin()}>Entrar</button>
        )}
        <div className={'menu' + (menu ? ' open' : '')} role="menu">
          <div className="who"><strong>{admin ? 'Administração' : usuario?.nome}</strong><span>{usuario?.email}</span></div>
          {admin ? <>
            <Link role="menuitem" className="menu-a" href="/admin">Painel</Link>
            <Link role="menuitem" className="menu-a" href="/">Ver o site como aluno</Link>
          </> : <>
            <Link role="menuitem" className="menu-a" href="/diagnostico">Minha teia</Link>
            <Link role="menuitem" className="menu-a" href="/duvidas">Minhas dúvidas</Link>
            <Link role="menuitem" className="menu-a" href="/minha-conta">Minha conta</Link>
          </>}
          <button role="menuitem" onClick={() => sair(false)}>Sair</button>
          <button role="menuitem" onClick={() => sair(true)}>Sair de todos os dispositivos</button>
        </div>
      </div>
    </header>
  );
}

type Item = [keyof typeof ICONES, string, string, (p: string) => boolean];

export function Navegacao() {
  const path = usePathname();
  const { ultimoCurso, admin } = useApp();
  const noPainel = path.startsWith('/admin');
  const itens: Item[] = admin && noPainel ? [
    ['visao', 'Visão', '/admin', p => p === '/admin'],
    ['alunos', 'Alunos', '/admin/alunos', p => p.startsWith('/admin/alunos')],
    ['acessos', 'Acessos', '/admin/acessos', p => p.startsWith('/admin/acessos')],
    ['certificados', 'Certificados', '/admin/certificados', p => p.startsWith('/admin/certificados')],
    ['duvidas', 'Dúvidas', '/admin/duvidas', p => p.startsWith('/admin/duvidas')],
    ['curso', 'Cursos', '/admin/cursos', p => p.startsWith('/admin/cursos')],
  ] : [
    ['inicio', 'Início', '/', p => p === '/'],
    ['curso', 'Curso', ultimoCurso ? `/cursos/${ultimoCurso}` : '/#catalogSection', p => /^\/cursos\/[^/]+$/.test(p)],
    ['aula', 'Aula', ultimoCurso ? `/cursos/${ultimoCurso}/aula` : '/#catalogSection', p => p.includes('/aula')],
    ['teia', 'Teia', '/diagnostico', p => p.startsWith('/diagnostico')],
    ['duvidas', 'Dúvidas', '/duvidas', p => p.startsWith('/duvidas')],
  ];
  return (
    <>
      <nav className="nav" aria-label={noPainel ? 'Navegação do administrador' : 'Navegação principal'}>
        {itens.map(([k, rot, href, ativo]) => (
          <Link key={k + rot} href={href} aria-current={ativo(path) ? 'page' : undefined}>{ICONES[k]}{rot}</Link>
        ))}
      </nav>
      {admin && !noPainel && (
        <div id="pvBar">Pré-visualização como aluno <Link href="/admin/cursos" className="pv-sair">Voltar ao painel</Link></div>
      )}
    </>
  );
}

/** Formulário de entrar / criar conta / recuperar senha (Supabase Auth). */
export function FormLogin({ onPronto, voltar }: { onPronto?: () => void; voltar?: string }) {
  const { toast, depoisDoLogin } = useApp();
  const router = useRouter();
  const [modo, setModo] = useState<'entrar' | 'criar'>('entrar');
  const [email, setEmail] = useState('');
  const [nome, setNome] = useState('');
  const [senha, setSenha] = useState('');
  const [aceite, setAceite] = useState(false);
  const [ocupado, setOcupado] = useState(false);
  const [aviso, setAviso] = useState('');
  const sb = { get auth() { return clienteNavegador().auth; }, from: (t: string) => clienteNavegador().from(t) };
  const callback = (next: string) => `${location.origin}/auth/callback?next=${encodeURIComponent(next)}`;

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    setAviso('');
    if (modo === 'criar' && !aceite) { setAviso('Para criar a conta, aceite os Termos e a Política de Privacidade.'); return; }
    setOcupado(true);
    try {
      if (modo === 'criar') {
        const { data, error } = await sb.auth.signUp({
          email, password: senha,
          options: { data: { nome, consentimento: 'true' }, emailRedirectTo: callback(voltar || '/') },
        });
        if (error) throw error;
        if (!data.session) { setAviso('Conta criada. Enviamos um link de confirmação para o seu e-mail; abra-o para entrar.'); return; }
      } else {
        const { error } = await sb.auth.signInWithPassword({ email, password: senha });
        if (error) throw error;
      }
      const { data: u } = await sb.auth.getUser();
      const { data: perfil } = await sb.from('perfis').select('papel').eq('id', u.user!.id).maybeSingle();
      onPronto?.();
      toast(modo === 'criar' ? 'Conta criada.' : 'Você entrou.');
      const f = depoisDoLogin.current; depoisDoLogin.current = null;
      if (perfil?.papel === 'admin' && !voltar) router.push('/admin');
      else if (voltar) router.push(voltar);
      router.refresh();
      if (f) setTimeout(f, 400);
    } catch (err) {
      const m = (err as Error).message || '';
      setAviso(/Invalid login/i.test(m) ? 'E-mail ou senha incorretos.'
        : /Email not confirmed/i.test(m) ? 'Confirme o seu e-mail pelo link que enviamos antes de entrar.'
          : /already registered/i.test(m) ? 'Este e-mail já tem conta. Use "Entrar".'
            : /Password should be/i.test(m) ? 'A senha precisa ter pelo menos 6 caracteres.'
              : 'Não foi possível concluir agora. Tente de novo em instantes.');
    } finally { setOcupado(false); }
  }

  async function google() {
    const { error } = await sb.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: callback(voltar || '/') } });
    if (error) setAviso('O login com Google ainda não está ativado. Use e-mail e senha.');
  }

  async function esqueci() {
    if (!email.includes('@')) { setAviso('Digite o seu e-mail acima e toque de novo em "Esqueci minha senha".'); return; }
    await sb.auth.resetPasswordForEmail(email, { redirectTo: callback('/redefinir-senha') });
    setAviso('Se houver uma conta com este e-mail, enviamos um link para criar uma nova senha.');
  }

  return (
    <>
      <div className="tabs" role="tablist">
        <button role="tab" aria-selected={modo === 'entrar'} onClick={() => { setModo('entrar'); setAviso(''); }}>Entrar</button>
        <button role="tab" aria-selected={modo === 'criar'} onClick={() => { setModo('criar'); setAviso(''); }}>Criar conta</button>
      </div>
      <form onSubmit={enviar}>
        {modo === 'criar' && (
          <div className="field"><label htmlFor="fName">Nome completo</label><input id="fName" autoComplete="name" required value={nome} onChange={e => setNome(e.target.value)} /></div>
        )}
        <div className="field"><label htmlFor="fEmail">E-mail</label><input id="fEmail" type="email" autoComplete="email" required value={email} onChange={e => setEmail(e.target.value)} /></div>
        <div className="field"><label htmlFor="fPass">Senha</label><input id="fPass" type="password" minLength={6} required autoComplete={modo === 'criar' ? 'new-password' : 'current-password'} value={senha} onChange={e => setSenha(e.target.value)} /></div>
        {modo === 'criar' && (
          <label className="consent"><input type="checkbox" checked={aceite} onChange={e => setAceite(e.target.checked)} /> <span>Li e aceito os <Link href="/termos">Termos de Uso</Link> e a <Link href="/privacidade">Política de Privacidade</Link>, e autorizo o tratamento dos meus dados conforme a LGPD.</span></label>
        )}
        {aviso && <p className="form-aviso" role="alert">{aviso}</p>}
        <button className="btn btn-anil full" disabled={ocupado}>{ocupado ? 'Aguarde…' : modo === 'criar' ? 'Criar conta' : 'Entrar'}</button>
        <div className="or">ou</div>
        <button type="button" className="btn btn-ghost full" onClick={google}>Continuar com Google</button>
        <button type="button" className="btn btn-quiet full" onClick={esqueci}>Esqueci minha senha</button>
      </form>
    </>
  );
}

export function LoginSheet() {
  const { loginAberto, fecharLogin } = useApp();
  const fechar = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (!loginAberto) return;
    const t = setTimeout(() => fechar.current?.focus(), 50);
    const k = (e: KeyboardEvent) => { if (e.key === 'Escape') fecharLogin(); };
    document.addEventListener('keydown', k);
    return () => { clearTimeout(t); document.removeEventListener('keydown', k); };
  }, [loginAberto, fecharLogin]);
  return (
    <>
      <div className={'scrim' + (loginAberto ? ' open' : '')} onClick={fecharLogin} />
      <div className={'sheet' + (loginAberto ? ' open' : '')} role="dialog" aria-modal="true" aria-labelledby="loginTitle" aria-hidden={!loginAberto}>
        <div className="grab" />
        <button className="close" ref={fechar} onClick={fecharLogin}>Fechar</button>
        <h2 id="loginTitle">Entrar</h2>
        {loginAberto && <FormLogin onPronto={fecharLogin} />}
      </div>
    </>
  );
}
