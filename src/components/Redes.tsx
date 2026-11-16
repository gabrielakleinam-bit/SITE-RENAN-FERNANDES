import { RENAN } from '@/lib/dados';

/* Redes do Renan: aparecem uma única vez, no bloco "Quem ensina". */
export function Redes() {
  return (
    <div className="soc" style={{ marginTop: 18 }}>
      <a href={RENAN.whatsapp} target="_blank" rel="noopener">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2zm0 18.2a8.2 8.2 0 0 1-4.2-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8-.2-.1-.4-.1-.6.1l-.8 1c-.1.2-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.3-.4.3-.4.7-1.4.1-.2 0-.3 0-.5l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2 5.2 5.2 0 0 0 1.1 2.7 11.8 11.8 0 0 0 4.5 4c1.7.7 2.3.8 3.2.6.5-.1 1.5-.6 1.7-1.2.2-.6.2-1.1.2-1.2-.1-.1-.3-.2-.5-.3z" /></svg>
        <span>WhatsApp <small>{RENAN.whatsappTxt}</small></span>
      </a>
      <a href={RENAN.instagram} target="_blank" rel="noopener">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="5" /><circle cx="12" cy="12" r="4" /><circle cx="17.5" cy="6.5" r="1" fill="currentColor" /></svg>
        <span>Instagram <small>{RENAN.instagramTxt}</small></span>
      </a>
      <a href={RENAN.tiktok} target="_blank" rel="noopener">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M16.6 3c.4 2 1.8 3.5 3.9 3.7v3.1a7 7 0 0 1-3.9-1.2v6.3a5.9 5.9 0 1 1-5.9-5.9h.6v3.2a2.8 2.8 0 1 0 2.2 2.7V3z" /></svg>
        <span>TikTok <small>{RENAN.tiktokTxt}</small></span>
      </a>
    </div>
  );
}
