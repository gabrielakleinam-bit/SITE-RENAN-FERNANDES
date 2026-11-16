/* Diagnóstico gratuito: perguntas e regras de pontuação (portadas de scoreDiag no protótipo).
   Cada resposta soma pontos aos cursos ligados a ela e guarda o motivo; os 3 maiores viram a recomendação.
   Os cursos são reconhecidos pelo endereço (slug). Cursos novos entram pela formação. Pesos: etapa futura no painel. */
export interface Pergunta { k: string; q: string; sub?: string; multi?: boolean; only?: string; opts: [string, string][] }

export const PERGUNTAS: Pergunta[] = [
  { k: 'perfil', q: 'Você quer aprender para…', opts: [['eu', 'Cuidar de mim'], ['terapeuta', 'Atender clientes (sou terapeuta ou estudante)']] },
  { k: 'regiao', multi: true, q: 'Onde você sente mais tensão ou dor?', sub: 'Pode marcar mais de uma.', opts: [['lombar', 'Lombar'], ['pescoco', 'Pescoço e ombros'], ['mandibula', 'Mandíbula e rosto'], ['pes', 'Pés e panturrilhas'], ['treino', 'Músculos depois do treino'], ['nenhum', 'Nenhum incômodo agora']] },
  { k: 'freq', q: 'Com que frequência isso acontece?', opts: [['rara', 'Raramente'], ['semana', 'Algumas vezes por semana'], ['dia', 'Quase todo dia']] },
  { k: 'rotina', q: 'Como é a sua rotina?', opts: [['sentado', 'Muitas horas sentado'], ['empe', 'Muitas horas em pé'], ['treino', 'Treino ou esporte com frequência'], ['variada', 'Variada']] },
  { k: 'conhece', q: 'Quanto você conhece do próprio corpo (músculos, postura, alongamento)?', opts: [['pouco', 'Pouco'], ['basico', 'O básico'], ['bastante', 'Bastante']] },
  { k: 'foco', multi: true, only: 'terapeuta', q: 'O que você quer acrescentar ao atendimento?', sub: 'Pode marcar mais de uma.', opts: [['recuperacao', 'Recuperação muscular e atletas'], ['ventosa', 'Ventosaterapia'], ['pes', 'Pés e panturrilhas'], ['autocuidado', 'Orientar autocuidado aos clientes']] },
];

export type Respostas = Record<string, string | string[] | undefined>;
export interface CursoDiag { id: string; formacao: string }
export const EIXOS = ['Conhecimento do corpo', 'Autocuidado', 'Postura', 'Alívio de tensão', 'Prevenção', 'Técnica manual'];

export function pontuar(a: Respostas, cursos: CursoDiag[]) {
  const sc: Record<string, number> = {}, why: Record<string, string[]> = {};
  cursos.forEach(c => { sc[c.id] = 0; why[c.id] = []; });
  const add = (id: string, n: number, r?: string) => { if (sc[id] === undefined) return; sc[id] += n; if (r && !why[id].includes(r)) why[id].push(r); };
  const reg = (a.regiao as string[]) || [], ter = a.perfil === 'terapeuta', intens = ({ dia: 3, semana: 2 } as Record<string, number>)[a.freq as string] || 1;
  if (reg.includes('lombar')) add('lombar', 3 + intens, 'você marcou a lombar');
  if (reg.includes('pescoco')) add('pescoco', 3 + intens, 'você marcou pescoço e ombros');
  if (reg.includes('mandibula')) add('bruxismo', 3 + intens, 'você marcou a mandíbula');
  if (reg.includes('pes')) add('pes', ter ? 4 : 2, 'você marcou pés e panturrilhas');
  if (reg.includes('treino')) add('recuperacao', ter ? 4 : 2, 'você sente os músculos depois do treino');
  if (a.rotina === 'sentado') { add('lombar', 2, 'passa muitas horas sentado'); add('pescoco', 2, 'passa muitas horas sentado'); }
  if (a.rotina === 'empe') { add('pes', 2, 'fica muitas horas em pé'); add('lombar', 1); }
  if (a.rotina === 'treino') add('recuperacao', 2, 'treina com frequência');
  for (const f of (a.foco as string[]) || []) {
    if (f === 'recuperacao') add('recuperacao', 5, 'quer atender recuperação muscular');
    if (f === 'ventosa') add('ventosa', 5, 'quer incluir ventosaterapia');
    if (f === 'pes') add('pes', 5, 'quer atender pés e panturrilhas');
    if (f === 'autocuidado') ['lombar', 'pescoco', 'bruxismo'].forEach(id => add(id, 2, 'quer orientar autocuidado aos clientes'));
  }
  cursos.forEach(c => { sc[c.id] += c.formacao === 'Para terapeutas' ? (ter ? 2 : -4) : (ter ? 0 : 2); });
  const k = ({ pouco: 25, basico: 50, bastante: 75 } as Record<string, number>)[a.conhece as string] || 40;
  return {
    ranking: cursos.map(c => ({ id: c.id, s: sc[c.id], why: why[c.id] })).filter(x => x.s > 0).sort((x, y) => y.s - x.s),
    eixos: EIXOS,
    valores: [k, Math.max(15, k - 10 + (ter ? 10 : 0)), ({ sentado: 30, empe: 40, treino: 55, variada: 60 } as Record<string, number>)[a.rotina as string] || 45,
      ({ dia: 20, semana: 40, rara: 70 } as Record<string, number>)[a.freq as string] || 50, Math.max(20, 75 - reg.filter(r => r !== 'nenhum').length * 12), ter ? Math.min(80, k + 5) : Math.max(15, k - 15)],
  };
}

export function melhorPacote<T extends { cursos: string[] }>(ids: string[], pacotes: T[]): T | null {
  let best: T | null = null, bs = 1;
  for (const p of pacotes) { const n = p.cursos.filter(id => ids.includes(id)).length; if (n > bs) { bs = n; best = p; } }
  return best;
}
