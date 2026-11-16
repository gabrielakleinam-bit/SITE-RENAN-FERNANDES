import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { certPorCodigo, linkValidacao, modeloCert } from '@/lib/certificado';
import { usuarioAtual } from '@/lib/sessao';
import { gerarPdfCertificado } from '@/lib/pdf-certificado';

/* PDF do certificado, gerado no servidor. Só o próprio aluno ou o admin baixam. */
export async function GET(_: Request, { params }: { params: Promise<{ codigo: string }> }) {
  const { codigo } = await params;
  const cert = await certPorCodigo(codigo);
  if (!cert) return new Response('Certificado não encontrado.', { status: 404 });
  const u = await usuarioAtual();
  if (!u || (u.id !== cert.usuarioId && u.papel !== 'admin')) return new Response('Entre na conta do aluno para baixar.', { status: 403 });
  const m = await modeloCert(), d = cert.dados;
  const imagem = m.imagem_url ? { bytes: new Uint8Array(await (await fetch(m.imagem_url)).arrayBuffer()), png: m.imagem_url.toLowerCase().endsWith('.png') } : null;
  const logo = await readFile(path.join(process.cwd(), 'public/img/logo-cor.png'));
  const bytes = await gerarPdfCertificado({ ...m, imagem }, { ...d, validar: linkValidacao() }, logo);
  return new Response(Buffer.from(bytes), {
    headers: { 'content-type': 'application/pdf', 'content-disposition': `attachment; filename="certificado-${d.codigo}.pdf"`, 'cache-control': 'private, no-store' },
  });
}
