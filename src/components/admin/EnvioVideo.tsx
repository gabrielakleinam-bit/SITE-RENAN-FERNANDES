'use client';
/* Envio de vídeo da aula.
   - Do celular (galeria ou câmera), MP4 ou MOV: vai direto para a Bunny por TUS, em partes de 25 MB.
     Se a conexão cair, o envio tenta de novo sozinho; se a página fechar, escolher o mesmo arquivo continua de onde parou.
   - Ou um link do YouTube: a duração é lida pelo player do YouTube no navegador.
   A duração nunca é digitada: vem dos metadados do arquivo (estimativa) e é confirmada pela Bunny após a conversão. */
import { useEffect, useRef, useState } from 'react';
import type { AulaEd } from '@/lib/editor';
import { fmtClock } from '@/lib/duracao';
import { ytId } from '@/lib/youtube';
import { removerVideo } from '@/app/admin/cursos/acoes';

type Fase = { tipo: 'parado' } | { tipo: 'enviando'; pct: number; enviado: number; total: number } | { tipo: 'processando'; pct: number } | { tipo: 'erro'; msg: string };

interface Assinatura { biblioteca: string; guid: string; expira: number; assinatura: string; endpoint: string }

const Ico = ({ d }: { d: React.ReactNode }) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{d}</svg>
);
const mb = (b: number) => (b / 1024 / 1024).toFixed(b > 100 * 1024 * 1024 ? 0 : 1).replace('.', ',') + ' MB';

function lerDuracaoArquivo(f: File): Promise<number> {
  return new Promise(res => {
    const v = document.createElement('video');
    v.preload = 'metadata';
    v.onloadedmetadata = () => { URL.revokeObjectURL(v.src); res(isFinite(v.duration) ? v.duration : 0); };
    v.onerror = () => res(0);
    v.src = URL.createObjectURL(f);
    setTimeout(() => res(0), 8000);
  });
}

/* Lê a duração de um vídeo do YouTube pela IFrame API (sem chave). */
let ytApi: Promise<void> | null = null;
function carregarYtApi() {
  if (ytApi) return ytApi;
  ytApi = new Promise(res => {
    const w = window as unknown as { YT?: { Player: unknown }; onYouTubeIframeAPIReady?: () => void };
    if (w.YT?.Player) return res();
    const ant = w.onYouTubeIframeAPIReady;
    w.onYouTubeIframeAPIReady = () => { ant?.(); res(); };
    const s = document.createElement('script'); s.src = 'https://www.youtube.com/iframe_api'; document.head.appendChild(s);
  });
  return ytApi;
}
async function lerDuracaoYoutube(id: string): Promise<number> {
  try {
    await Promise.race([carregarYtApi(), new Promise((_, r) => setTimeout(r, 8000))]);
  } catch { return 0; }
  return new Promise(res => {
    const div = document.createElement('div');
    div.style.cssText = 'position:fixed;left:-9999px;top:0;width:200px;height:120px';
    document.body.appendChild(div);
    let feito = false;
    const fim = (d: number) => { if (feito) return; feito = true; try { p.destroy(); } catch { /* */ } div.remove(); res(d); };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const YT = (window as any).YT;
    const p = new YT.Player(div, {
      videoId: id, playerVars: { controls: 0, mute: 1 },
      events: {
        onReady: () => {
          const tenta = (n: number) => { const d = p.getDuration?.() || 0; if (d > 0 || n <= 0) fim(d); else setTimeout(() => tenta(n - 1), 500); };
          tenta(10);
        },
        onError: () => fim(0),
      },
    });
    setTimeout(() => fim(0), 12000);
  });
}

export function EnvioVideo({ aula, onMudou }: { aula: AulaEd; onMudou: (p: Partial<AulaEd>) => void }) {
  const [fase, setFase] = useState<Fase>(aula.video_fonte === 'bunny' && aula.video_status && aula.video_status !== 'pronto' && aula.video_status !== 'erro'
    ? { tipo: 'processando', pct: 0 } : { tipo: 'parado' });
  const [estimada, setEstimada] = useState(0);
  const [link, setLink] = useState('');
  const [ocupadoYt, setOcupadoYt] = useState(false);
  const [confirmaRemover, setConfirmaRemover] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const upRef = useRef<any>(null);
  const mudou = useRef(onMudou); mudou.current = onMudou;

  // acompanha a conversão na Bunny até ficar pronto
  useEffect(() => {
    if (fase.tipo !== 'processando') return;
    let vivo = true;
    const passo = async () => {
      try {
        const r = await fetch(`/api/admin/videos/status?aulaId=${aula.id}`);
        const s = await r.json();
        if (!vivo) return;
        if (s.estado === 'pronto') { mudou.current({ video_status: 'pronto', duracao_seg: s.duracao }); setFase({ tipo: 'parado' }); return; }
        if (s.estado === 'erro') { mudou.current({ video_status: 'erro' }); setFase({ tipo: 'erro', msg: 'A conversão falhou. Envie o vídeo de novo.' }); return; }
        setFase({ tipo: 'processando', pct: s.progresso || 0 });
      } catch { /* tenta de novo */ }
      if (vivo) setTimeout(passo, 5000);
    };
    const t = setTimeout(passo, 1500);
    return () => { vivo = false; clearTimeout(t); };
  }, [fase.tipo, aula.id]);

  useEffect(() => () => { upRef.current?.abort?.(); }, []);

  async function enviar(f: File | undefined) {
    if (!f) return;
    if (!/^video\//.test(f.type) && !/\.(mp4|mov|m4v)$/i.test(f.name)) { setFase({ tipo: 'erro', msg: 'Escolha um arquivo de vídeo (MP4 ou MOV).' }); return; }
    setEstimada(0);
    lerDuracaoArquivo(f).then(setEstimada);
    setFase({ tipo: 'enviando', pct: 0, enviado: 0, total: f.size });

    const chave = `rf-envio:${aula.id}:${f.name}:${f.size}:${f.lastModified}`;
    let ass: Assinatura | null = null;
    try { const s = localStorage.getItem(chave); if (s) { const x = JSON.parse(s); if (x.expira * 1000 > Date.now() + 600000) ass = x; } } catch { /* */ }
    if (!ass) {
      const r = await fetch('/api/admin/videos', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ aulaId: aula.id }) });
      const j = await r.json();
      if (!r.ok) { setFase({ tipo: 'erro', msg: j.erro || 'Não foi possível começar o envio.' }); return; }
      ass = j as Assinatura;
      try { localStorage.setItem(chave, JSON.stringify(ass)); } catch { /* */ }
    }
    const a = ass;
    onMudou({ video_status: 'enviando' });
    const tus = await import('tus-js-client');
    const up = new tus.Upload(f, {
      endpoint: a.endpoint,
      chunkSize: 25 * 1024 * 1024,
      retryDelays: [0, 2000, 5000, 10000, 20000, 30000, 60000, 60000, 120000],
      headers: { AuthorizationSignature: a.assinatura, AuthorizationExpire: String(a.expira), VideoId: a.guid, LibraryId: String(a.biblioteca) },
      metadata: { filetype: f.type || 'video/mp4', title: aula.titulo },
      onProgress: (env, tot) => setFase({ tipo: 'enviando', pct: Math.round((env / tot) * 100), enviado: env, total: tot }),
      onError: err => {
        console.error(err);
        setFase({ tipo: 'erro', msg: 'O envio parou. Verifique a internet e escolha o mesmo arquivo de novo: ele continua de onde parou.' });
      },
      onSuccess: async () => {
        try { localStorage.removeItem(chave); } catch { /* */ }
        const r = await fetch('/api/admin/videos/concluir', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ aulaId: aula.id, guid: a.guid }) });
        if (!r.ok) { setFase({ tipo: 'erro', msg: 'O vídeo foi enviado, mas não foi possível ligá-lo à aula. Tente de novo.' }); return; }
        onMudou({ video_fonte: 'bunny', video_ref: a.guid, video_status: 'processando', duracao_seg: null });
        setFase({ tipo: 'processando', pct: 0 });
      },
    });
    upRef.current = up;
    const anteriores = await up.findPreviousUploads();
    if (anteriores.length) up.resumeFromPreviousUpload(anteriores[0]);
    up.start();
  }

  async function usarYoutube() {
    const id = ytId(link);
    if (!id) { setFase({ tipo: 'erro', msg: 'Link do YouTube inválido. Cole o endereço do vídeo (youtube.com/watch?v=… ou youtu.be/…).' }); return; }
    setOcupadoYt(true); setFase({ tipo: 'parado' });
    const dur = await lerDuracaoYoutube(id);
    const r = await fetch('/api/admin/youtube', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ aulaId: aula.id, url: link, duracao: dur }) });
    const j = await r.json();
    setOcupadoYt(false);
    if (!r.ok) { setFase({ tipo: 'erro', msg: j.erro }); return; }
    onMudou({ video_fonte: 'youtube', video_ref: `https://www.youtube.com/watch?v=${id}`, video_status: j.estado, duracao_seg: j.duracao || null });
    if (!j.duracao) setFase({ tipo: 'erro', msg: 'Não foi possível ler a duração deste vídeo. Confira se ele é público ou "não listado" (não privado) e cole o link de novo.' });
    setLink('');
  }

  async function remover() {
    await removerVideo(aula.id);
    onMudou({ video_fonte: null, video_ref: null, video_status: null, duracao_seg: null });
    setConfirmaRemover(false);
  }

  const tem = !!aula.video_ref;
  const enviando = fase.tipo === 'enviando';

  return (
    <div className="media-opts" style={{ gridTemplateColumns: '1fr' }}>
      {tem && !enviando && (
        <div className="media-ok">
          <Ico d={aula.video_fonte === 'youtube' ? <><rect x="2" y="5" width="20" height="14" rx="4" /><path d="M10 9l5 3-5 3z" /></> : <><rect x="2" y="6" width="14" height="12" rx="2" /><path d="M16 10l6-3v10l-6-3z" /></>} />
          <div className="mo-t">
            <b>{aula.video_fonte === 'youtube' ? 'Vídeo do YouTube' : 'Vídeo enviado'}</b>
            <small>{aula.video_status === 'pronto' ? 'Pronto para os alunos' : fase.tipo === 'processando' ? `Convertendo para streaming${fase.pct ? ` · ${fase.pct}%` : ''}…` : aula.video_status === 'erro' ? 'Com problema: envie de novo' : 'Processando…'}</small>
          </div>
          <span className="mo-d">{aula.duracao_seg ? fmtClock(aula.duracao_seg) : '—'}</span>
          {confirmaRemover
            ? <button className="icon-btn armed" onClick={remover}>Remover?</button>
            : <button className="icon-btn danger" aria-label="Remover vídeo" title="Remover vídeo" onClick={() => setConfirmaRemover(true)}>✕</button>}
        </div>
      )}

      {enviando && (
        <div className="upl" role="status">
          <div className="upl-l"><b>Enviando vídeo… {fase.pct}%</b><span>{mb(fase.enviado)} de {mb(fase.total)}</span></div>
          <div className="pb"><b style={{ width: `${fase.pct}%` }} /></div>
          <small className="hint">Pode continuar editando. Mantenha esta página aberta até terminar.{estimada ? ` Duração do arquivo: ${fmtClock(estimada)}.` : ''}</small>
        </div>
      )}

      {fase.tipo === 'erro' && <p className="form-aviso" role="alert" style={{ margin: 0 }}>{fase.msg}</p>}

      {!enviando && (
        <>
          <div className="cam-row">
            <label className="add-ty" style={{ cursor: 'pointer' }}>
              <Ico d={<><rect x="7" y="2" width="10" height="20" rx="2" /><path d="M11 18h2" /></>} />
              {tem ? 'Trocar vídeo' : 'Enviar vídeo do celular'}
              <input type="file" accept="video/mp4,video/quicktime,video/*" hidden onChange={e => { enviar(e.target.files?.[0]); e.target.value = ''; }} />
            </label>
            <label className="add-ty" style={{ cursor: 'pointer' }}>
              <Ico d={<><path d="M23 7l-7 5 7 5V7z" /><rect x="1" y="5" width="15" height="14" rx="2" /></>} />
              Gravar com a câmera
              <input type="file" accept="video/*" capture="environment" hidden onChange={e => { enviar(e.target.files?.[0]); e.target.value = ''; }} />
            </label>
          </div>
          <div className="yt-in">
            <Ico d={<><path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1" /><path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1" /></>} />
            <input className="inp sm" placeholder="ou cole o link do YouTube" value={link} onChange={e => setLink(e.target.value)} inputMode="url" />
            <button className="btn btn-anil btn-sm" style={{ margin: 4 }} disabled={!link || ocupadoYt} onClick={usarYoutube}>{ocupadoYt ? 'Lendo…' : 'Usar'}</button>
          </div>
        </>
      )}
    </div>
  );
}
