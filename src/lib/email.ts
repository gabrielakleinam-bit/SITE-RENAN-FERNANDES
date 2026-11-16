import 'server-only';
/* Avisos por e-mail (Resend). Sem RESEND_API_KEY, não envia nada e o site segue funcionando. */
import { EMAIL_REMETENTE, RESEND_KEY, SITE_URL } from './config';

export async function avisar(para: string, assunto: string, texto: string, link?: string) {
  if (!RESEND_KEY || !EMAIL_REMETENTE || !para) return;
  const url = link && SITE_URL ? SITE_URL + link : '';
  const html = `<div style="font-family:Arial,sans-serif;font-size:16px;line-height:1.5;color:#12161B;max-width:520px">
    <p>${texto.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/\n/g, '<br>')}</p>
    ${url ? `<p><a href="${url}" style="display:inline-block;background:#4FA3F0;color:#12161B;padding:12px 18px;border-radius:12px;text-decoration:none;font-weight:bold">Abrir no site</a></p>` : ''}
    <p style="color:#5C6670;font-size:13px">Renan Fernandes Cursos</p></div>`;
  try {
    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${RESEND_KEY}`, 'content-type': 'application/json' },
      body: JSON.stringify({ from: EMAIL_REMETENTE, to: [para], subject: assunto, html }),
    });
  } catch (e) { console.error('e-mail não enviado', e); }
}
