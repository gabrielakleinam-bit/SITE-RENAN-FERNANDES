'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '../App';
import { Certificado, type DadosCert, type ModeloCert } from '../Certificado';
import { decidirCertificado, enviarArteCertificado, salvarModeloCertificado, usarModeloPadrao } from '@/app/admin/acoes';

interface Item { id: string; status: string; criado: string; d: DadosCert }

export function CertificadosAdmin({ modelo, fila, validar }: { modelo: ModeloCert; fila: Item[]; validar: string }) {
  const { toast } = useApp();
  const router = useRouter();
  const [m, setM] = useState(modelo);
  const [aba, setAba] = useState<'pendente' | 'aprovado' | 'negado'>('pendente');
  const [ocupado, setOcupado] = useState('');
  const exemplo: DadosCert = { nome: 'Maria Aparecida dos Santos', curso: 'Nome do curso', horas: '2 h 10 min', data: new Date().toLocaleDateString('pt-BR'), codigo: 'RF-EXEMPLO' };
  const campos: [keyof ModeloCert, string][] = [['nome_y', 'Nome do aluno'], ['curso_y', 'Curso'], ['horas_y', 'Horas cumpridas'], ['rodape_y', 'Data e código']];
  const lista = fila.filter(f => f.status === aba);

  return (
    <div className="adm-pg wrap">
      <div className="ad-top"><div><h1>Certificados</h1><p>O aluno pede ao concluir 100% do curso. Ao aprovar, o código de validação e a data são gerados e o aluno recebe um aviso.</p></div></div>
      <div className="seg4">
        {([['pendente', 'Para aprovar'], ['aprovado', 'Emitidos'], ['negado', 'Negados']] as const).map(([k, r]) => (
          <button key={k} aria-pressed={aba === k} onClick={() => setAba(k)}>{r}<span>{fila.filter(f => f.status === k).length}</span></button>
        ))}
      </div>
      <div className="acc-list">
        {lista.length ? lista.map(f => (
          <div className="ad-card cert4" key={f.id}>
            <div className="cert-mini"><Certificado d={f.d} m={m} validar={validar} /></div>
            <div className="cert-side">
              <b>{f.d.nome}</b><span className="hint">{f.d.curso} · {f.d.horas}</span>
              {aba === 'pendente' ? (
                <div className="acts">
                  <button className="btn btn-oleo btn-sm" disabled={ocupado === f.id} onClick={async () => { setOcupado(f.id); const r = await decidirCertificado(f.id, true); setOcupado(''); if (r.erro) toast(r.erro); else { toast('Certificado emitido.'); router.refresh(); } }}>Aprovar emissão</button>
                  <button className="btn btn-line btn-sm danger" disabled={ocupado === f.id} onClick={async () => { setOcupado(f.id); await decidirCertificado(f.id, false); setOcupado(''); router.refresh(); }}>Negar</button>
                </div>
              ) : aba === 'aprovado' ? <a className="lnk" href={`/api/certificados/${f.d.codigo}/pdf`}>Baixar PDF · {f.d.codigo}</a> : <span className="tag red">Negado</span>}
            </div>
          </div>
        )) : <div className="ad-card empty">{aba === 'pendente' ? 'Nenhum certificado esperando aprovação.' : 'Nada por aqui ainda.'}</div>}
      </div>

      <h2 className="ad-sub">Modelo do certificado</h2>
      <div className="ad-card tpl4">
        <Certificado d={exemplo} m={m} validar={validar} />
        <div className="tpl-ctl">
          <div className="acts">
            <label className="btn btn-line btn-sm" style={{ cursor: 'pointer' }}>Enviar arte (A4 deitado)
              <input type="file" accept="image/png,image/jpeg" hidden onChange={async e => {
                const f = e.target.files?.[0]; if (!f) return;
                const fd = new FormData(); fd.append('arquivo', f);
                const r = await enviarArteCertificado(fd);
                if (r.erro) toast(r.erro); else { setM(x => ({ ...x, imagem_url: r.url! })); toast('Arte enviada.'); }
              }} />
            </label>
            {m.imagem_url && <button className="btn btn-line btn-sm" onClick={async () => { await usarModeloPadrao(); setM(x => ({ ...x, imagem_url: null })); }}>Usar o modelo padrão</button>}
          </div>
          <span className="hint">PNG ou JPG, 1123 × 794 px ou maior. Deixe o espaço dos campos em branco. Sem arte, vale o modelo da marca (moldura, logo e assinatura do Renan).</span>
          <div className="sl-g">
            {campos.map(([k, r]) => (
              <label className="sl" key={k}>{r}<input type="range" min={5} max={97} step={0.5} value={m[k] as number} onChange={e => setM(x => ({ ...x, [k]: Number(e.target.value) }))} /></label>
            ))}
            <label className="sl">Cor do texto<input type="color" value={m.cor} onChange={e => setM(x => ({ ...x, cor: e.target.value }))} style={{ height: 34 }} /></label>
          </div>
          <button className="btn btn-anil btn-sm" style={{ justifySelf: 'start' }} onClick={async () => { await salvarModeloCertificado(m); toast('Modelo salvo.'); }}>Salvar posições</button>
        </div>
      </div>
    </div>
  );
}
