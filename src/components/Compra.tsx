'use client';
/* Painel de compra (curso ou pacote). Pix com QR e "copia e cola"; o pedido fica aguardando a conferência da equipe. */
import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from './App';
import { brl, fmtClock } from '@/lib/duracao';
import { confirmarPagamento, gerarPix } from '@/app/acoes-compra';

type Pix = Awaited<ReturnType<typeof gerarPix>>;

export function BotaoComprar({ rotulo, className, curso, pacote }: { rotulo: string; className: string; curso?: string; pacote?: string }) {
  const { usuario, abrirLogin, admin, toast } = useApp();
  const [aberto, setAberto] = useState(false);
  const abrir = () => {
    if (admin) { toast('Você está como administrador: a compra fica para os alunos.'); return; }
    if (usuario) setAberto(true); else abrirLogin(() => setAberto(true));
  };
  return (
    <>
      <button className={className} onClick={abrir}>{rotulo}</button>
      {aberto && <PainelCompra curso={curso} pacote={pacote} fechar={() => setAberto(false)} />}
    </>
  );
}

function PainelCompra({ curso, pacote, fechar }: { curso?: string; pacote?: string; fechar: () => void }) {
  const router = useRouter();
  const [aba, setAba] = useState<'pix' | 'cartao' | 'boleto'>('pix');
  const [pix, setPix] = useState<Pix | null>(null);
  const [resto, setResto] = useState(900);
  const [feito, setFeito] = useState(false);
  const [ocupado, setOcupado] = useState(false);
  const [erro, setErro] = useState('');
  const [copiado, setCopiado] = useState(false);
  const [aberto, setAberto] = useState(false);
  const fecharRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    requestAnimationFrame(() => setAberto(true));
    gerarPix({ curso, pacote }).then(setPix);
    const k = (e: KeyboardEvent) => { if (e.key === 'Escape') fechar(); };
    document.addEventListener('keydown', k);
    setTimeout(() => fecharRef.current?.focus(), 60);
    return () => document.removeEventListener('keydown', k);
  }, [curso, pacote, fechar]);
  useEffect(() => { const t = setInterval(() => setResto(r => Math.max(0, r - 1)), 1000); return () => clearInterval(t); }, []);

  async function paguei() {
    setOcupado(true); setErro('');
    const r = await confirmarPagamento({ curso, pacote, metodo: 'pix', txid: pix && 'txid' in pix ? pix.txid : undefined });
    setOcupado(false);
    if ('erro' in r && r.erro) { setErro(r.erro); return; }
    setFeito(true); router.refresh();
  }

  const ok = pix && !('erro' in pix && pix.erro);
  return (
    <>
      <div className={'scrim' + (aberto ? ' open' : '')} onClick={fechar} />
      <div className={'sheet' + (aberto ? ' open' : '')} role="dialog" aria-modal="true" aria-labelledby="coTitle">
        <div className="grab" />
        <button className="close" ref={fecharRef} onClick={fechar}>Fechar</button>
        {!feito ? (
          <>
            <h2 id="coTitle">Finalizar compra</h2>
            {pix && 'erro' in pix && pix.erro ? <p className="form-aviso" style={{ marginTop: 12 }}>{pix.erro}</p> : (
              <>
                <div className="summary"><span>{ok ? pix!.titulo : 'Carregando…'}</span><b>{ok ? brl(pix!.valor!) : ''}</b></div>
                <div className="tabs" role="tablist">
                  {(['pix', 'cartao', 'boleto'] as const).map(a => (
                    <button key={a} role="tab" aria-selected={aba === a} onClick={() => setAba(a)}>{a === 'pix' ? 'Pix' : a === 'cartao' ? 'Cartão' : 'Boleto'}</button>
                  ))}
                </div>
                {aba === 'pix' && ok && (
                  'semPix' in pix! ? (
                    <p className="muted">O pagamento por Pix ainda está sendo configurado. Para comprar agora, fale com a equipe pelo WhatsApp que aparece no fim da página inicial.</p>
                  ) : (
                    <div className="pix">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={'qr' in pix! ? pix!.qr : ''} alt="QR Code Pix" width={180} height={180} style={{ borderRadius: 12, border: '1px solid var(--linha)' }} />
                      <div className="timer">Pague em até <b>{fmtClock(resto)}</b> para garantir o pedido</div>
                      <div className="copybox">
                        <input readOnly value={'payload' in pix! ? pix!.payload : ''} aria-label="Código Pix copia e cola" onFocus={e => e.target.select()} />
                        <button className="btn btn-anil" onClick={async () => {
                          try { await navigator.clipboard.writeText('payload' in pix! ? pix!.payload! : ''); setCopiado(true); } catch { setCopiado(false); }
                        }}>{copiado ? 'Copiado' : 'Copiar'}</button>
                      </div>
                      <p className="hint" style={{ textAlign: 'left' }}>Depois de pagar no app do seu banco, toque em &quot;Já fiz o Pix&quot;. A equipe confere o pagamento e libera as aulas; você recebe um aviso por e-mail.</p>
                      {erro && <p className="form-aviso">{erro}</p>}
                      <button className="btn btn-oleo full" disabled={ocupado} onClick={paguei}>{ocupado ? 'Registrando…' : 'Já fiz o Pix'}</button>
                    </div>
                  )
                )}
                {aba !== 'pix' && (
                  <p className="muted" style={{ marginTop: 8 }}>O pagamento por {aba === 'cartao' ? 'cartão' : 'boleto'} chega em breve. Por enquanto, use o Pix; se preferir {aba === 'cartao' ? 'parcelar no cartão' : 'boleto'}, fale com a equipe pelo WhatsApp da página inicial.</p>
                )}
              </>
            )}
          </>
        ) : (
          <div className="success show">
            <div className="check"><svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="#1F9D6B" strokeWidth="2.5" strokeLinecap="round"><path d="M5 12l5 5L20 7" /></svg></div>
            <h2>Pedido recebido</h2>
            <p>A equipe confere o Pix e libera as aulas. Você recebe um aviso por e-mail assim que a entrada for liberada. Enquanto isso, a primeira aula de cada curso já está aberta.</p>
            <button className="btn btn-anil full" onClick={fechar}>Entendi</button>
          </div>
        )}
      </div>
    </>
  );
}
