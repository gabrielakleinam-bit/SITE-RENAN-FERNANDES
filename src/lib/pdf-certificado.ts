/* Desenho do PDF do certificado (A4 deitado), com o mesmo layout e posições do modelo HTML. */
import { PDFDocument, rgb, StandardFonts, type PDFFont } from 'pdf-lib';

export interface ModeloPdf { imagem: { bytes: Uint8Array; png: boolean } | null; cor: string; nome_y: number; curso_y: number; horas_y: number; rodape_y: number }
export interface DadosPdf { nome: string; curso: string; horas: string; data: string; codigo: string; validar: string }

const W = 842, H = 595;
const hex = (h: string) => { const n = parseInt(h.replace('#', ''), 16); return rgb(((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255); };
/** As fontes padrão do PDF só têm o alfabeto latino (WinAnsi): remove o que não couber. */
export const seguro = (s: string) => s.replace(/[^\u0020-\u007E\u00A0-\u00FF\u2013\u2014\u2018\u2019\u201C\u201D\u2022\u2026\u20AC]/g, '');

export async function gerarPdfCertificado(m: ModeloPdf, d: DadosPdf, logoPng: Uint8Array) {
  const pdf = await PDFDocument.create();
  pdf.setTitle(`Certificado ${seguro(d.codigo)}`); pdf.setAuthor('Renan Fernandes Massoterapia');
  const pg = pdf.addPage([W, H]);
  const reg = await pdf.embedFont(StandardFonts.Helvetica), neg = await pdf.embedFont(StandardFonts.HelveticaBold);
  const sx = W / 1123, sy = H / 794;
  const centro = (txt: string, yTopo: number, f: PDFFont, tam: number, cor = rgb(0.36, 0.4, 0.44), esp = 0) => {
    const larg = f.widthOfTextAtSize(txt, tam) + esp * (txt.length - 1);
    let x = (W - larg) / 2;
    if (!esp) { pg.drawText(txt, { x, y: H - yTopo, size: tam, font: f, color: cor }); return; }
    for (const ch of txt) { pg.drawText(ch, { x, y: H - yTopo, size: tam, font: f, color: cor }); x += f.widthOfTextAtSize(ch, tam) + esp; }
  };

  if (m.imagem) {
    const img = m.imagem.png ? await pdf.embedPng(m.imagem.bytes) : await pdf.embedJpg(m.imagem.bytes);
    pg.drawImage(img, { x: 0, y: 0, width: W, height: H });
  } else {
    const azul = hex('#4FA3F0'), escuro = hex('#13171C');
    pg.drawRectangle({ x: 28 * sx, y: 28 * sy, width: 1067 * sx, height: 738 * sy, borderColor: escuro, borderWidth: 2.2 });
    pg.drawRectangle({ x: 42 * sx, y: 42 * sy, width: 1039 * sx, height: 710 * sy, borderColor: azul, borderWidth: 1 });
    pg.drawSvgPath('M42 690 C300 630 560 740 1081 650 L1081 752 L42 752 Z', { x: 0, y: H, scale: sx, color: hex('#EAF3FE') });
    pg.drawSvgPath('M42 715 C320 660 600 760 1081 680', { x: 0, y: H, scale: sx, borderColor: azul, borderWidth: 2, borderOpacity: 0.7 });
    const logo = await pdf.embedPng(logoPng);
    pg.drawImage(logo, { x: 471 * sx, y: H - (62 + 106) * sy, width: 181 * sx, height: 106 * sy });
    centro('CERTIFICADO', 226 * sy, neg, 28, escuro, 4);
    centro('DE CONCLUSÃO DE CURSO LIVRE', 258 * sy, reg, 12.5, undefined, 2.5);
    centro('Certificamos que', 318 * sy, reg, 13.5);
    pg.drawLine({ start: { x: 431 * sx, y: H - 628 * sy }, end: { x: 692 * sx, y: H - 628 * sy }, thickness: 0.9, color: escuro });
    centro('Renan Fernandes', 652 * sy, neg, 12, escuro);
    centro('Massoterapeuta · responsável pelo conteúdo', 672 * sy, reg, 9.5);
  }

  const cor = hex(m.cor || '#12161B');
  const ajusta = (txt: string, f: PDFFont, tam: number) => { while (f.widthOfTextAtSize(txt, tam) > W * 0.84 && tam > 8) tam -= 0.5; return tam; };
  const linha = (txt: string, yPct: number, f: PDFFont, tam: number) => { txt = seguro(txt); const t = ajusta(txt, f, tam); centro(txt, (yPct / 100) * H + t * 0.35, f, t, cor); };
  linha(d.nome, m.nome_y, neg, 34);
  linha(`concluiu o curso livre ${d.curso}`, m.curso_y, reg, 15);
  linha(`com carga horária cumprida de ${d.horas}`, m.horas_y, reg, 15);
  linha(`Emitido em ${d.data} · Código ${d.codigo} · valide em ${d.validar}`, m.rodape_y, reg, 9);

  return pdf.save();
}
