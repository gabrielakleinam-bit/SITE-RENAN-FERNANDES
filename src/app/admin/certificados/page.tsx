import { db } from '@/lib/supabase/servidor';
import { linkValidacao, modeloCert } from '@/lib/certificado';
import { fmtTotal } from '@/lib/duracao';
import { CertificadosAdmin } from '@/components/admin/CertificadosAdmin';

export const metadata = { title: 'Certificados' };

export default async function Certificados() {
  const [m, { data }] = await Promise.all([
    modeloCert(),
    db().from('certificados').select('id, nome_aluno, titulo_curso, horas_seg, status, codigo, criado_em, emitido_em').order('criado_em', { ascending: false }).limit(200),
  ]);
  const fila = (data || []).map(c => ({
    id: c.id as string, status: c.status as string, criado: c.criado_em as string,
    d: { nome: c.nome_aluno, curso: c.titulo_curso, horas: fmtTotal(c.horas_seg), codigo: c.codigo || '',
      data: new Date(c.emitido_em || Date.now()).toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' }) },
  }));
  return <CertificadosAdmin modelo={m} fila={fila} validar={linkValidacao()} />;
}
