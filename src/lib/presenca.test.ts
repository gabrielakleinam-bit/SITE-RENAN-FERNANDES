import { test } from 'node:test';
import assert from 'node:assert/strict';
import { novaPresenca, marcar, percentual, concluida } from './presenca.ts';
import { statsCurso, fmtTotal, parseDur, TEXTO_SEG } from './duracao.ts';
import { CURSOS, PACOTES } from './dados.ts';

test('assistir em sequência marca todos os blocos', () => {
  const dur = 100, b = novaPresenca(dur);
  let last = 0;
  for (let t = 0; t <= dur; t += 1) last = marcar(b, last, t, dur);
  assert.equal(percentual(b), 100);
  assert.ok(concluida(b));
});

test('pular para o fim não marca o trecho pulado', () => {
  const dur = 100, b = novaPresenca(dur);
  let last = 0;
  for (let t = 0; t <= 20; t += 1) last = marcar(b, last, t, dur);
  last = marcar(b, last, 95, dur);           // salto
  for (let t = 95; t <= 100; t += 1) last = marcar(b, last, t, dur);
  assert.ok(percentual(b) < 50);
  assert.ok(!concluida(b));
});

test('89% não conclui, 90% conclui', () => {
  const b = novaPresenca(500); // 100 blocos
  b.fill(1, 0, 89);
  assert.ok(!concluida(b));
  b[89] = 1;
  assert.ok(concluida(b));
});

test('duração do curso soma vídeos e 4 min por texto, sem contar testes', () => {
  const c = {
    ...CURSOS[0],
    modulos: [{ id: 'm1', titulo: 'M', aulas: [
      { id: 'a', titulo: 'v', tipo: 'video' as const, duracaoSeg: parseDur('10:00') },
      { id: 'b', titulo: 't', tipo: 'texto' as const },
      { id: 'c', titulo: 'q', tipo: 'teste' as const, rotulo: '8 questões' },
    ] }],
  };
  const s = statsCurso(c);
  assert.equal(s.aulas, 2);
  assert.equal(s.sec, 600 + TEXTO_SEG);
  assert.equal(fmtTotal(s.sec), '14 min');
});

test('pacotes iniciais têm os preços do briefing', () => {
  const p = Object.fromEntries(PACOTES.map(x => [x.id, x]));
  const cheio = (id: string) => p[id].cursos.reduce((s, c) => s + CURSOS.find(x => x.id === c)!.preco, 0);
  assert.equal(p.autocuidado.preco, 167); assert.equal(cheio('autocuidado'), 221);
  assert.equal(p.costas.preco, 127);      assert.equal(cheio('costas'), 154);
  assert.equal(p.formacao.preco, 797);    assert.equal(cheio('formacao'), 1041);
});

import { crc16, payloadPix } from './pix.ts';
test('CRC16 do Pix confere com o valor de referência', () => {
  assert.equal(crc16('123456789'), '29B1'); // CRC-16/CCITT-FALSE
  const p = payloadPix({ chave: 'renan@exemplo.com', nome: 'Renan Fernandes', cidade: 'Curitiba', valor: 87, txid: 'RF123' });
  assert.ok(p.startsWith('000201'));
  assert.ok(p.includes('540587.00'));
  assert.equal(p.slice(-4), crc16(p.slice(0, -4)));
});

import { aplicarTick } from './presenca-servidor.ts';
test('servidor: avanço contínuo em tempo real conta; salto não conta', () => {
  let e = { blocos: '', ultima: 0, atualizado: 0 }, t = 0;
  for (let pos = 5; pos <= 100; pos += 5) { t += 5000; e = { ...aplicarTick(e, pos, t, 100, 'tick') }; }
  assert.equal(aplicarTick(e, 100, t, 100, 'seek').pct, 100);
  const f = aplicarTick({ blocos: '', ultima: 0, atualizado: 0 }, 95, 1000, 100, 'tick'); // pulou 95 s em 1 s
  assert.equal(f.pct, 0);
});
test('servidor: não aceita avançar mais rápido que 2x', () => {
  const r = aplicarTick({ blocos: '', ultima: 0, atualizado: 0 }, 30, 5000, 100, 'tick'); // 30 s em 5 s
  assert.equal(r.pct, 0);
  const ok = aplicarTick({ blocos: '', ultima: 0, atualizado: 0 }, 10, 5000, 100, 'tick'); // 2x
  assert.ok(ok.pct > 0);
});

import { pontuar } from './diagnostico.ts';
test('diagnóstico: lombar + sentado indica o curso de lombar primeiro, com o motivo', () => {
  const r = pontuar({ perfil: 'eu', regiao: ['lombar'], freq: 'dia', rotina: 'sentado', conhece: 'pouco' }, CURSOS.map(c => ({ id: c.id, formacao: c.formacao })));
  assert.equal(r.ranking[0].id, 'lombar');
  assert.ok(r.ranking[0].why.includes('você marcou a lombar') && r.ranking[0].why.includes('passa muitas horas sentado'));
  assert.ok(!r.ranking.some(x => x.id === 'ventosa'));
});
