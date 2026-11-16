/* Pix "copia e cola" estático (BR Code, padrão EMV do Banco Central) com valor e identificador.
   O pagamento é conferido manualmente pelo admin na aba Acessos. */
const campo = (id: string, v: string) => id + String(v.length).padStart(2, '0') + v;

export function crc16(s: string) {
  let crc = 0xffff;
  for (let i = 0; i < s.length; i++) {
    crc ^= s.charCodeAt(i) << 8;
    for (let j = 0; j < 8; j++) crc = crc & 0x8000 ? ((crc << 1) ^ 0x1021) & 0xffff : (crc << 1) & 0xffff;
  }
  return crc.toString(16).toUpperCase().padStart(4, '0');
}

const limpar = (s: string, n: number) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^A-Za-z0-9 ]/g, '').toUpperCase().slice(0, n);

export function payloadPix({ chave, nome, cidade, valor, txid }: { chave: string; nome: string; cidade: string; valor: number; txid: string }) {
  const conta = campo('00', 'br.gov.bcb.pix') + campo('01', chave.trim());
  let p = campo('00', '01') + campo('26', conta) + campo('52', '0000') + campo('53', '986')
    + campo('54', valor.toFixed(2)) + campo('58', 'BR') + campo('59', limpar(nome, 25) || 'RECEBEDOR')
    + campo('60', limpar(cidade, 15) || 'BRASIL') + campo('62', campo('05', txid.replace(/[^A-Za-z0-9]/g, '').slice(0, 25) || '***'));
  p += '6304';
  return p + crc16(p);
}
