'use client';
/* Player da aula. Um único conjunto de controles (play, barra, velocidade, tela cheia) comanda:
   - vídeo enviado (Bunny, HLS com link assinado; hls.js fora do Safari);
   - YouTube: iframe sem controles e sem cliques (pointer-events:none) sob uma camada da plataforma,
     comandado pela IFrame API via postMessage. A tela de fim cobre as sugestões do YouTube; nenhum
     link leva o aluno para fora do site. A marca do YouTube não é escondida.
   Presença: o navegador marca os blocos para mostrar na hora; o servidor (/api/progresso) decide a conclusão. */
import { useCallback, useEffect, useRef, useState } from 'react';
import { useApp } from './App';
import { fmtClock } from '@/lib/duracao';
import { BLOCO_SEG, marcar, novaPresenca, percentual } from '@/lib/presenca';

const RATES = [0.75, 1, 1.25, 1.5, 2];
export type Midia = { tipo: 'hls'; url: string } | { tipo: 'yt'; id: string };

const PlayIco = () => <svg width="26" height="26" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" fill="#fff" /></svg>;
const PauseIco = () => <svg width="26" height="26" viewBox="0 0 24 24"><rect x="6" y="5" width="4" height="14" rx="1" fill="#fff" /><rect x="14" y="5" width="4" height="14" rx="1" fill="#fff" /></svg>;

export function Player({ midia, titulo, duracao, blocosIniciais, jaConcluida, registrar, onConcluir, onProxima, rotuloProxima }: {
  midia: Midia; titulo: string; duracao: number; blocosIniciais: string; jaConcluida: boolean;
  registrar: (pos: number, evento: 'tick' | 'seek') => Promise<{ concluida?: boolean; blocos?: string } | null>;
  onConcluir: () => void; onProxima: (() => void) | null; rotuloProxima?: string;
}) {
  const { toast } = useApp();
  const [, setTick] = useState(0);
  const repinta = useCallback(() => setTick(t => t + 1), []);
  const st = useRef((() => {
    const b = novaPresenca(duracao || 300);
    for (let i = 0; i < Math.min(b.length, blocosIniciais.length); i++) if (blocosIniciais[i] === '1') b[i] = 1;
    return { dur: Math.max(1, duracao || 300), pos: 0, rate: 1, playing: false, lastT: 0, blocos: b, done: jaConcluida, fim: false, buf: true, falhou: false, ultimoEnvio: 0 };
  })());
  const s = st.current;
  const videoRef = useRef<HTMLVideoElement>(null);
  const frameRef = useRef<HTMLIFrameElement>(null);
  const playerRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const cb = useRef({ registrar, onConcluir }); cb.current = { registrar, onConcluir };

  const enviar = useCallback(async (evento: 'tick' | 'seek') => {
    s.ultimoEnvio = Date.now();
    const r = await cb.current.registrar(s.pos, evento);
    if (!r) return;
    if (r.blocos) for (let i = 0; i < Math.min(s.blocos.length, r.blocos.length); i++) if (r.blocos[i] === '1') s.blocos[i] = 1;
    if (r.concluida && !s.done) { s.done = true; toast('Aula concluída.'); cb.current.onConcluir(); }
    repinta();
  }, [s, toast, repinta]);

  const onTime = useCallback((t: number) => {
    s.lastT = marcar(s.blocos, s.lastT, t, s.dur);
    s.pos = Math.min(t, s.dur);
    if (s.playing && Date.now() - s.ultimoEnvio >= 5000) void enviar('tick');
    repinta();
  }, [s, enviar, repinta]);

  const onEnded = useCallback(() => { s.playing = false; s.fim = true; void enviar('tick'); repinta(); }, [s, enviar, repinta]);

  /* ---------- HLS ---------- */
  useEffect(() => {
    if (midia.tipo !== 'hls') return;
    const v = videoRef.current!;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let hls: any = null;
    if (v.canPlayType('application/vnd.apple.mpegurl')) v.src = midia.url;
    else {
      import('hls.js').then(({ default: Hls }) => {
        if (!Hls.isSupported()) { v.src = midia.url; return; }
        hls = new Hls({ maxBufferLength: 30 });
        hls.loadSource(midia.url);
        hls.attachMedia(v);
        hls.on(Hls.Events.ERROR, (_: unknown, d: { fatal?: boolean }) => { if (d.fatal) { s.falhou = true; s.buf = false; repinta(); } });
      });
    }
    return () => { hls?.destroy(); };
  }, [midia, s, repinta]);

  /* ---------- YouTube (IFrame API por postMessage) ---------- */
  const ytSend = useCallback((msg: object) => {
    try { frameRef.current?.contentWindow?.postMessage(JSON.stringify(msg), '*'); } catch { /* */ }
  }, []);
  const ytCmd = useCallback((func: string, args: unknown[] = []) => ytSend({ event: 'command', func, args, id: 1, channel: 'widget' }), [ytSend]);
  useEffect(() => {
    if (midia.tipo !== 'yt') return;
    let poll: ReturnType<typeof setInterval> | null = null, ouviu = false;
    const f = frameRef.current;
    const onLoad = () => { if (poll) clearInterval(poll); poll = setInterval(() => ytSend({ event: 'listening', id: 1, channel: 'widget' }), 500); };
    f?.addEventListener('load', onLoad);
    const espera = setTimeout(() => { if (!ouviu) { s.falhou = true; s.buf = false; repinta(); } }, 10000);
    const onMsg = (e: MessageEvent) => {
      if (!/youtube/.test(e.origin)) return;
      let d: { event?: string; info?: { playerState?: number; currentTime?: number } };
      try { d = JSON.parse(e.data); } catch { return; }
      if (d.event === 'onError') { s.falhou = true; repinta(); return; }
      if (!d.info) return;
      if (!ouviu) { ouviu = true; s.buf = false; if (poll) { clearInterval(poll); poll = null; } }
      if (typeof d.info.playerState === 'number') {
        const tocando = d.info.playerState === 1;
        if (tocando && !s.playing) void enviar('seek');
        s.playing = tocando;
        s.buf = d.info.playerState === 3;
        if (d.info.playerState === 0) onEnded();
      }
      if (typeof d.info.currentTime === 'number') onTime(d.info.currentTime); else repinta();
    };
    window.addEventListener('message', onMsg);
    return () => { f?.removeEventListener('load', onLoad); window.removeEventListener('message', onMsg); if (poll) clearInterval(poll); clearTimeout(espera); };
  }, [midia, s, ytSend, onEnded, onTime, enviar, repinta]);

  /* ---------- comandos ---------- */
  const play = () => {
    s.fim = false;
    if (midia.tipo === 'hls') { void videoRef.current?.play(); return; }
    ytCmd('playVideo'); s.playing = true; repinta();
  };
  const pause = () => {
    if (midia.tipo === 'hls') { videoRef.current?.pause(); return; }
    ytCmd('pauseVideo'); s.playing = false; repinta();
  };
  const seek = (t: number) => {
    t = Math.max(0, Math.min(s.dur, t)); s.lastT = t; s.pos = t;
    if (midia.tipo === 'hls' && videoRef.current) videoRef.current.currentTime = t;
    if (midia.tipo === 'yt') ytCmd('seekTo', [t, true]);
    void enviar('seek');
    repinta();
  };
  const velocidade = () => {
    const r = RATES[(RATES.indexOf(s.rate) + 1) % RATES.length]; s.rate = r;
    if (midia.tipo === 'hls' && videoRef.current) videoRef.current.playbackRate = r;
    if (midia.tipo === 'yt') ytCmd('setPlaybackRate', [r]);
    repinta();
  };
  const telaCheia = () => {
    const el = playerRef.current;
    const v = videoRef.current as (HTMLVideoElement & { webkitEnterFullscreen?: () => void }) | null;
    try {
      if (document.fullscreenElement) void document.exitFullscreen();
      else if (el?.requestFullscreen) el.requestFullscreen().catch(() => v?.webkitEnterFullscreen?.());
      else v?.webkitEnterFullscreen?.(); // iPhone
    } catch { toast('Tela cheia indisponível neste navegador.'); }
  };

  const arrasto = useRef(false);
  const seekDe = (x: number) => { const r = trackRef.current!.getBoundingClientRect(); seek(((x - r.left) / r.width) * s.dur); };

  const n = s.blocos.length, pct = percentual(s.blocos), atual = Math.min(n - 1, Math.floor(s.pos / BLOCO_SEG));
  const vistos: [number, number][] = [];
  for (let i = 0; i < n;) { if (s.blocos[i]) { let j = i; while (j < n && s.blocos[j]) j++; vistos.push([i, j]); i = j; } else i++; }
  const origin = typeof location !== 'undefined' ? '&origin=' + encodeURIComponent(location.origin) : '';

  return (
    <div id="playerWrap" data-mode={s.falhou ? 'panel' : 'media'}>
      <div className="player" ref={playerRef}>
        <div className="screenbox">
          <div className={'buf' + (s.buf ? ' on' : '')} aria-hidden="true"><i /></div>
          <div className="stage">
            {s.falhou ? (
              <div className="rv-text"><h3>O vídeo não carregou</h3><p>Verifique a conexão e recarregue a página. Se continuar, avise a equipe pelas Dúvidas.</p></div>
            ) : midia.tipo === 'yt' ? <>
              <iframe ref={frameRef} className="yt" title={titulo} tabIndex={-1} referrerPolicy="strict-origin-when-cross-origin" allow="autoplay; encrypted-media"
                src={`https://www.youtube-nocookie.com/embed/${midia.id}?enablejsapi=1&controls=0&disablekb=1&fs=0&rel=0&modestbranding=1&iv_load_policy=3&playsinline=1${origin}`} />
              <button className="shield" aria-label="Reproduzir ou pausar" onClick={() => (s.playing ? pause() : play())} />
            </> : <>
              <video ref={videoRef} playsInline preload="metadata" controlsList="nodownload" onContextMenu={e => e.preventDefault()}
                onLoadedMetadata={e => { const d = e.currentTarget.duration; if (isFinite(d) && Math.abs(d - s.dur) > 2 && !s.blocos.some(Boolean)) { s.dur = d; s.blocos = novaPresenca(d); } s.buf = false; repinta(); }}
                onTimeUpdate={e => onTime(e.currentTarget.currentTime)}
                onPlay={() => { s.playing = true; void enviar('seek'); repinta(); }} onPause={() => { s.playing = false; repinta(); }}
                onEnded={onEnded} onWaiting={() => { s.buf = true; repinta(); }} onPlaying={() => { s.buf = false; repinta(); }} />
              <button className="shield" aria-label="Reproduzir ou pausar" onClick={() => (s.playing ? pause() : play())} />
            </>}
          </div>
          {s.fim && (
            <div className="end-card">
              <b>{s.done ? 'Aula concluída' : 'Fim do vídeo'}</b>
              <span>{s.done ? 'Ela já conta no seu progresso.' : 'Alguns trechos foram pulados e ainda não contam.'}</span>
              <div className="acts">
                {onProxima && <button className="btn btn-oleo" onClick={onProxima}>{rotuloProxima || 'Próxima aula'}</button>}
                <button className="btn btn-ghost" style={{ color: '#fff' }} onClick={() => { s.fim = false; seek(0); play(); }}>Assistir de novo</button>
              </div>
            </div>
          )}
          {!s.falhou && (
            <button className="bigplay" aria-label="Reproduzir" onClick={play} style={{ display: s.playing ? 'none' : 'grid' }}>
              <svg width="30" height="30" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" fill="#12161B" /></svg>
            </button>
          )}
          {!s.playing && <div className="ttl">{titulo}</div>}
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
