'use client';
/* Player da aula (portado de docs/prototipo/src/js/04-aula.js).
   Um único conjunto de controles (play, barra, velocidade, tela cheia) comanda três fontes:
   - vídeo enviado (<video>; no M3 passa a receber HLS com URL assinada);
   - YouTube: iframe sem controles e sem cliques (pointer-events:none) sob uma camada da
     plataforma, comandado pela IFrame API via postMessage. A tela de fim cobre as sugestões
     do YouTube; nenhum link leva o aluno para fora do site. A marca do YouTube não é escondida;
   - player simulado (só nos cursos de exemplo, tempo acelerado).
   Presença: blocos de 5 s assistidos em sequência; conclui com 90% (src/lib/presenca.ts). */
import { useCallback, useEffect, useRef, useState } from 'react';
import { useApp } from './App';
import { fmtClock } from '@/lib/duracao';
import { BLOCO_SEG, concluida, marcar, novaPresenca, percentual } from '@/lib/presenca';
import type { Aula } from '@/lib/tipos';

const RATES = [0.75, 1, 1.25, 1.5, 2];
type Tipo = 'sim' | 'file' | 'yt' | 'panel';

export const ytId = (u?: string) => {
  const m = String(u || '').match(/(?:youtu\.be\/|youtube(?:-nocookie)?\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/|live\/))([\w-]{11})/);
  return m ? m[1] : '';
};

const PlayIco = () => <svg width="26" height="26" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" fill="#fff" /></svg>;
const PauseIco = () => <svg width="26" height="26" viewBox="0 0 24 24"><rect x="6" y="5" width="4" height="14" rx="1" fill="#fff" /><rect x="14" y="5" width="4" height="14" rx="1" fill="#fff" /></svg>;

export function Player({ aula, exemplo, jaConcluida, onConcluir, onProxima }: {
  aula: Aula; exemplo: boolean; jaConcluida: boolean;
  onConcluir: () => void; onProxima: (() => void) | null;
}) {
  const { toast } = useApp();
  const yt = aula.tipo === 'video' && aula.videoFonte === 'youtube' ? ytId(aula.videoRef) : '';
  const tipoInicial: Tipo =
    aula.tipo === 'texto' || aula.tipo === 'material' ? 'panel'
      : yt ? 'yt'
        : aula.videoRef ? 'file'
          : exemplo ? 'sim' : 'panel';

  const [tipo, setTipo] = useState<Tipo>(tipoInicial);
  const [, setTick] = useState(0);
  const repinta = useCallback(() => setTick(t => t + 1), []);
  const st = useRef({
    dur: Math.max(1, aula.duracaoSeg || 300), pos: 0, rate: 1, playing: false, lastT: 0,
    blocos: novaPresenca(aula.duracaoSeg || 300), done: jaConcluida, fim: false, buf: true, ytOuviu: false, ytBloqueado: false,
  });
  const s = st.current;
  const videoRef = useRef<HTMLVideoElement>(null);
  const frameRef = useRef<HTMLIFrameElement>(null);
  const playerRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const simT = useRef<ReturnType<typeof setInterval> | null>(null);
  const concluirRef = useRef(onConcluir); concluirRef.current = onConcluir;

  const reset = useCallback((dur: number) => {
    s.dur = Math.max(1, dur); s.pos = 0; s.lastT = 0; s.blocos = novaPresenca(s.dur);
  }, [s]);

  const checar = useCallback(() => {
    if (!s.done && concluida(s.blocos)) { s.done = true; toast('Aula concluída.'); concluirRef.current(); }
  }, [s, toast]);

  const onTime = useCallback((t: number) => {
    s.lastT = marcar(s.blocos, s.lastT, t, s.dur);
    s.pos = Math.min(t, s.dur);
    checar(); repinta();
  }, [s, checar, repinta]);

  const parar = useCallback(() => { if (simT.current) clearInterval(simT.current); simT.current = null; }, []);

  const onEnded = useCallback(() => { s.playing = false; parar(); s.fim = true; repinta(); }, [s, parar, repinta]);

  /* ---------- YouTube (IFrame API por postMessage) ---------- */
  const ytSend = useCallback((msg: object) => {
    try { frameRef.current?.contentWindow?.postMessage(JSON.stringify(msg), '*'); } catch { /* iframe indisponível */ }
  }, []);
  const ytCmd = useCallback((func: string, args: unknown[] = []) => ytSend({ event: 'command', func, args, id: 1, channel: 'widget' }), [ytSend]);

  useEffect(() => {
    if (tipo !== 'yt') return;
    let poll: ReturnType<typeof setInterval> | null = null;
    const f = frameRef.current;
    const onLoad = () => { if (poll) clearInterval(poll); poll = setInterval(() => ytSend({ event: 'listening', id: 1, channel: 'widget' }), 500); };
    f?.addEventListener('load', onLoad);
    const espera = setTimeout(() => { if (!s.ytOuviu) { s.ytBloqueado = true; s.buf = false; setTipo('panel'); } }, 8000);
    const onMsg = (e: MessageEvent) => {
      if (!/youtube/.test(e.origin)) return;
      let d: { event?: string; info?: { duration?: number; playerState?: number; currentTime?: number } };
      try { d = JSON.parse(e.data); } catch { return; }
      if (d.event === 'onError') { s.ytBloqueado = true; setTipo('panel'); return; }
      if (!d.info) return;
      if (!s.ytOuviu) { s.ytOuviu = true; s.buf = false; if (poll) { clearInterval(poll); poll = null; } }
      if (d.info.duration && Math.abs(d.info.duration - s.dur) > 1 && !s.blocos.some(Boolean)) reset(d.info.duration);
      if (typeof d.info.playerState === 'number') {
        s.playing = d.info.playerState === 1;
        s.buf = d.info.playerState === 3;
        if (d.info.playerState === 0) onEnded();
      }
      if (typeof d.info.currentTime === 'number') onTime(d.info.currentTime); else repinta();
    };
    window.addEventListener('message', onMsg);
    return () => { f?.removeEventListener('load', onLoad); window.removeEventListener('message', onMsg); if (poll) clearInterval(poll); clearTimeout(espera); };
  }, [tipo, s, ytSend, reset, onEnded, onTime, repinta]);

  /* ---------- carregamento inicial ---------- */
  useEffect(() => {
    if (tipo === 'sim' || tipo === 'panel') { const t = setTimeout(() => { s.buf = false; repinta(); }, 500); return () => clearTimeout(t); }
  }, [tipo, s, repinta]);
  useEffect(() => () => parar(), [parar]);

  /* ---------- comandos (mesmos botões para as três fontes) ---------- */
  const play = () => {
    if (tipo === 'panel') return;
    s.fim = false;
    if (tipo === 'file') { void videoRef.current?.play(); return; }
    if (tipo === 'yt') { ytCmd('playVideo'); s.playing = true; repinta(); return; }
    if (s.playing) return;
    if (s.pos >= s.dur) { s.pos = 0; s.lastT = 0; }
    s.playing = true;
    simT.current = setInterval(() => {
      const t = Math.min(s.dur, s.pos + s.rate * 1.2);
      onTime(t);
      if (t >= s.dur) onEnded();
    }, 100);
    repinta();
  };
  const pause = () => {
    if (tipo === 'file') { videoRef.current?.pause(); return; }
    if (tipo === 'yt') ytCmd('pauseVideo');
    s.playing = false; parar(); repinta();
  };
  const seek = (t: number) => {
    t = Math.max(0, Math.min(s.dur, t)); s.lastT = t; s.pos = t;
    if (tipo === 'file' && videoRef.current) videoRef.current.currentTime = t;
    if (tipo === 'yt') ytCmd('seekTo', [t, true]);
    repinta();
  };
  const velocidade = () => {
    const r = RATES[(RATES.indexOf(s.rate) + 1) % RATES.length]; s.rate = r;
    if (tipo === 'file' && videoRef.current) videoRef.current.playbackRate = r;
    if (tipo === 'yt') ytCmd('setPlaybackRate', [r]);
    repinta();
  };
  const telaCheia = () => {
    const el = playerRef.current;
    try {
      if (document.fullscreenElement) void document.exitFullscreen();
      else el?.requestFullscreen().catch(() => toast('Tela cheia indisponível neste navegador.'));
    } catch { toast('Tela cheia indisponível neste navegador.'); }
  };
  const marcarLido = () => { s.blocos.fill(1); checar(); repinta(); };

  const arrasto = useRef(false);
  const seekDe = (x: number) => { const r = trackRef.current!.getBoundingClientRect(); seek(((x - r.left) / r.width) * s.dur); };

  /* ---------- palco ---------- */
  let palco: React.ReactNode = null;
  let modo: 'sim' | 'media' | 'panel' = 'sim';
  if (tipo === 'panel') {
    modo = 'panel';
    palco = aula.tipo === 'texto' ? (
      <div className="rv-text"><h3>{aula.titulo}</h3>
        <p style={{ whiteSpace: 'pre-line' }}>{aula.texto || 'Texto da aula.'}</p>
        <button className="btn btn-oleo" onClick={marcarLido}>Concluí a leitura</button></div>
    ) : aula.tipo === 'material' ? (
      <div className="rv-text"><h3>{aula.titulo}</h3><p>Material de apoio.</p>
        <div className="acts">
          {aula.materialUrl && <a className="btn btn-oleo" href={aula.materialUrl} target="_blank" rel="noopener">Abrir material</a>}
          <button className="btn btn-ghost" style={{ color: '#fff' }} onClick={marcarLido}>Marcar como visto</button>
        </div></div>
    ) : s.ytBloqueado ? (
      <div className="rv-text"><h3>O vídeo não carregou</h3>
        <p>Não foi possível abrir o vídeo desta aula agora. Verifique a conexão e tente de novo.</p>
        <div className="acts"><button className="btn btn-oleo" onClick={() => { s.ytBloqueado = false; s.ytOuviu = false; s.buf = true; setTipo('yt'); }}>Tentar de novo</button></div></div>
    ) : (
      <div className="rv-text"><h3>Em breve</h3><p>O vídeo desta aula ainda está sendo preparado.</p></div>
    );
  } else if (tipo === 'yt') {
    modo = 'media';
    const origin = typeof location !== 'undefined' ? '&origin=' + encodeURIComponent(location.origin) : '';
    palco = <>
      <iframe ref={frameRef} className="yt" title={aula.titulo} tabIndex={-1} referrerPolicy="strict-origin-when-cross-origin" allow="autoplay; encrypted-media"
        src={`https://www.youtube-nocookie.com/embed/${yt}?enablejsapi=1&controls=0&disablekb=1&fs=0&rel=0&modestbranding=1&iv_load_policy=3&playsinline=1${origin}`} />
      <button className="shield" aria-label="Reproduzir ou pausar" onClick={() => (s.playing ? pause() : play())} />
    </>;
  } else if (tipo === 'file') {
    modo = 'media';
    palco = <>
      <video ref={videoRef} playsInline preload="metadata" src={aula.videoRef}
        onLoadedMetadata={e => { reset(e.currentTarget.duration); s.buf = false; repinta(); }}
        onTimeUpdate={e => onTime(e.currentTarget.currentTime)}
        onPlay={() => { s.playing = true; repinta(); }} onPause={() => { s.playing = false; repinta(); }}
        onEnded={onEnded} onWaiting={() => { s.buf = true; repinta(); }} onPlaying={() => { s.buf = false; repinta(); }}
        onError={() => { s.buf = false; toast('Este navegador não abriu o vídeo.'); }} />
      <button className="shield" aria-label="Reproduzir ou pausar" onClick={() => (s.playing ? pause() : play())} />
    </>;
  }

  const n = s.blocos.length, pct = percentual(s.blocos), atual = Math.min(n - 1, Math.floor(s.pos / BLOCO_SEG));
  const vistos: [number, number][] = [];
  for (let i = 0; i < n;) { if (s.blocos[i]) { let j = i; while (j < n && s.blocos[j]) j++; vistos.push([i, j]); i = j; } else i++; }

  return (
    <div id="playerWrap" data-mode={modo}>
      <div className="player" ref={playerRef}>
        <div className="screenbox">
          <div className={'buf' + (s.buf ? ' on' : '')} aria-hidden="true"><i /></div>
          {palco && <div className="stage">{palco}</div>}
          {s.fim && (
            <div className="end-card">
              <b>{s.done ? 'Aula concluída' : 'Fim do vídeo'}</b>
              <span>{s.done ? 'Ela já conta no seu progresso.' : 'Alguns trechos foram pulados e ainda não contam.'}</span>
              <div className="acts">
                {onProxima && <button className="btn btn-oleo" onClick={onProxima}>Próxima aula</button>}
                <button className="btn btn-ghost" style={{ color: '#fff' }} onClick={() => { s.fim = false; seek(0); play(); }}>Assistir de novo</button>
              </div>
            </div>
          )}
          <span className="demo-note">Demonstração em tempo acelerado</span>
          <button className="bigplay" aria-label="Reproduzir" onClick={play} style={{ display: s.playing || tipo === 'panel' ? 'none' : 'grid' }}>
            <svg width="30" height="30" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" fill="#12161B" /></svg>
          </button>
          <div className="ttl">{aula.titulo}</div>
        </div>
        <div className="controls">
          <button className="ico" aria-label={s.playing ? 'Pausar' : 'Reproduzir'} onClick={() => (s.playing ? pause() : play())}>{s.playing ? <PauseIco /> : <PlayIco />}</button>
          <span className="time">{fmtClock(s.pos)}</span>
          <div className="track" ref={trackRef} role="slider" aria-label="Posição do vídeo" tabIndex={0}
            aria-valuemin={0} aria-valuemax={Math.round(s.dur)} aria-valuenow={Math.round(s.pos)}
            onPointerDown={e => { arrasto.current = true; e.currentTarget.setPointerCapture(e.pointerId); seekDe(e.clientX); }}
            onPointerMove={e => { if (arrasto.current) seekDe(e.clientX); }}
            onPointerUp={() => { arrasto.current = false; if (s.pos > 0 && !s.done) toast('Avançou. O trecho pulado não conta para a conclusão.'); }}
            onKeyDown={e => { if (e.key === 'ArrowRight') seek(s.pos + 10); if (e.key === 'ArrowLeft') seek(s.pos - 10); }}>
            <div className="rail">{vistos.map(([i, j]) => <span key={i} className="seen" style={{ left: `${(i / n) * 100}%`, width: `${((j - i) / n) * 100}%` }} />)}</div>
            <div className="head" style={{ left: `${(s.pos / s.dur) * 100}%` }} />
          </div>
          <span className="time">{fmtClock(s.dur)}</span>
          <button className="speed" aria-label="Velocidade" onClick={velocidade}>{String(s.rate).replace('.', ',')}x</button>
          <button className="ico fs" aria-label="Tela cheia" onClick={telaCheia}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round"><path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" /></svg>
          </button>
        </div>
      </div>
      <div className="presence">
        <div className="presence-head"><h2>Presença na aula</h2><span className="pct">{s.done && pct < 90 ? 'Concluída' : `${pct}%`}</span></div>
        <div className="ribbon" aria-hidden="true">
          {Array.from({ length: n }, (_, i) => <i key={i} className={i === atual ? 'now' : s.blocos[i] ? 'w' : ''} />)}
        </div>
        <div className="meter"><b style={{ width: `${pct}%` }} /><span className="goal" /></div>
        <div className="meter-labels"><span>Assistido de verdade</span><span>Conclui em 90%</span></div>
        <p className="rule">Pode avançar e acelerar até 2x à vontade. Só conta o trecho que passou na tela; os blocos coloridos mostram exatamente o que você já viu.</p>
        <div className={'done-banner' + (s.done ? ' show' : '')}>Aula concluída. Ela já conta no seu progresso e no certificado.</div>
      </div>
    </div>
  );
}
