/* Configuração lida das variáveis de ambiente (Vercel > Settings > Environment Variables).
   Veja .env.example. Nada aqui com prefixo NEXT_PUBLIC_ é segredo; o resto só existe no servidor. */
export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
export const SUPABASE_ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
export const SUPABASE_SERVICE = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
export const supabaseConfigurado = () => !!(SUPABASE_URL && SUPABASE_ANON && SUPABASE_SERVICE);

export const BUNNY = {
  biblioteca: process.env.BUNNY_LIBRARY_ID || '',
  chave: process.env.BUNNY_API_KEY || '',
  cdn: process.env.BUNNY_CDN_HOST || '',          // ex.: vz-1234abcd-567.b-cdn.net
  chaveToken: process.env.BUNNY_TOKEN_KEY || '',  // opcional: Token Authentication da zona
};
export const bunnyConfigurado = () => !!(BUNNY.biblioteca && BUNNY.chave && BUNNY.cdn);

export const PIX = {
  chave: process.env.PIX_CHAVE || '',
  nome: process.env.PIX_NOME || 'Renan Fernandes',
  cidade: process.env.PIX_CIDADE || 'Curitiba',
};

export const GEMINI_KEY = process.env.GEMINI_API_KEY || '';
export const YOUTUBE_KEY = process.env.YOUTUBE_API_KEY || '';
export const RESEND_KEY = process.env.RESEND_API_KEY || '';
export const EMAIL_REMETENTE = process.env.EMAIL_REMETENTE || '';
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || '').replace(/\/$/, '');
