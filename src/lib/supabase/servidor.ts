import 'server-only';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { SUPABASE_ANON, SUPABASE_SERVICE, SUPABASE_URL } from '../config';

/** Cliente com a sessão do visitante (cookies). Usado para saber quem está logado. */
export async function clienteSessao() {
  const loja = await cookies();
  return createServerClient(SUPABASE_URL, SUPABASE_ANON, {
    cookies: {
      getAll: () => loja.getAll(),
      setAll: lista => { try { lista.forEach(({ name, value, options }) => loja.set(name, value, options)); } catch { /* Server Component: o middleware renova */ } },
    },
  });
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let _admin: SupabaseClient<any, 'public', any> | null = null;
/** Cliente com a chave de serviço: ignora RLS. Só no servidor, sempre depois de conferir permissão. */
export function db() {
  if (!_admin) _admin = createClient<any, 'public', any>(SUPABASE_URL, SUPABASE_SERVICE, { auth: { persistSession: false, autoRefreshToken: false } });
  return _admin;
}
