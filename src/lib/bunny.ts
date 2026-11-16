import 'server-only';
/* Bunny Stream: hospedagem dos vídeos enviados pelo painel.
   Fluxo do envio: o servidor cria o vídeo na biblioteca e assina o envio; o navegador manda o arquivo
   direto para a Bunny pelo protocolo TUS (em partes, continua se a conexão cair). A Bunny converte
   para HLS (streaming adaptativo) e informa a duração. O aluno assiste por um link assinado, de validade curta. */
import { createHash } from 'node:crypto';
import { BUNNY } from './config';

const API = 'https://video.bunnycdn.com';

async function chamar(caminho: string, init: RequestInit = {}) {
  const r = await fetch(`${API}/library/${BUNNY.biblioteca}${caminho}`, {
    ...init,
    headers: { AccessKey: BUNNY.chave, accept: 'application/json', 'content-type': 'application/json', ...(init.headers || {}) },
    cache: 'no-store',
  });
  if (!r.ok) throw new Error(`Bunny ${r.status}: ${await r.text().catch(() => '')}`);
  return r.status === 204 ? null : r.json();
}

/** Cria o registro do vídeo e devolve o id (guid). */
export async function criarVideo(titulo: string): Promise<string> {
  const v = await chamar('/videos', { method: 'POST', body: JSON.stringify({ title: titulo.slice(0, 200) || 'Aula' }) });
  return v.guid as string;
}

/** Assinatura do envio TUS: SHA256(biblioteca + chave + expiração + guid). */
export function assinaturaEnvio(guid: string, validadeSeg = 6 * 3600) {
  const expira = Math.floor(Date.now() / 1000) + validadeSeg;
  const assinatura = createHash('sha256').update(BUNNY.biblioteca + BUNNY.chave + expira + guid).digest('hex');
  return { biblioteca: BUNNY.biblioteca, guid, expira, assinatura, endpoint: `${API}/tusupload` };
}

export type EstadoBunny = 'enviando' | 'processando' | 'pronto' | 'erro';

/** Situação do vídeo na Bunny e a duração em segundos (quando já processado). */
export async function situacaoVideo(guid: string): Promise<{ estado: EstadoBunny; duracao: number; progresso: number }> {
  const v = await chamar(`/videos/${guid}`);
  // 0 criado, 1 enviado, 2 processando, 3 convertendo, 4 pronto, 5 erro, 6 falha no envio
  const s: number = v.status;
  const estado: EstadoBunny = s === 4 ? 'pronto' : s === 5 || s === 6 ? 'erro' : s === 0 ? 'enviando' : 'processando';
  return { estado, duracao: Math.round(v.length || 0), progresso: v.encodeProgress || 0 };
}

export async function apagarVideo(guid: string) {
  try { await chamar(`/videos/${guid}`, { method: 'DELETE' }); } catch { /* já removido */ }
}

/** Assina uma URL da CDN (Token Authentication da Bunny, SHA256, liberando a pasta do vídeo inteira). */
export function assinarUrl(url: string, chave: string, validadeSeg: number, pasta: string) {
  const u = new URL(url);
  const expira = Math.floor(Date.now() / 1000) + validadeSeg;
  const params: Record<string, string> = { token_path: pasta };
  let dados = '', dadosUrl = '';
  for (const k of Object.keys(params).sort()) {
    if (dados) dados += '&';
    dados += `${k}=${params[k]}`;
    dadosUrl += `&${k}=${encodeURIComponent(params[k])}`;
  }
  const token = createHash('sha256').update(chave + pasta + expira + dados).digest('base64')
    .replace(/\n/g, '').replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
  return `${u.protocol}//${u.host}/bcdn_token=${token}${dadosUrl}&expires=${expira}${u.pathname}`;
}

/** Endereço HLS para o aluno. Com a chave de token configurada, o link vale por 4 horas. */
export function urlHls(guid: string) {
  const base = `https://${BUNNY.cdn}/${guid}/playlist.m3u8`;
  return BUNNY.chaveToken ? assinarUrl(base, BUNNY.chaveToken, 4 * 3600, `/${guid}/`) : base;
}

export const miniatura = (guid: string) => `https://${BUNNY.cdn}/${guid}/thumbnail.jpg`;
