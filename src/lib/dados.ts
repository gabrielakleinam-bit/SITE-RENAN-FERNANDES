/* Dados de exemplo (portados de docs/prototipo/src/js/01-dados.js).
   Cursos, preços, números de alunos e conversas são ilustrativos.
   No M2 este arquivo é substituído por consultas ao banco (ver src/lib/catalogo.ts). */
import type { Curso, Duvida, Modulo, Pacote } from './tipos.ts';
import { parseDur } from './duracao.ts';

export const RENAN = {
  nome: 'Renan Fernandes',
  whatsapp: 'https://wa.me/5511950517467?text=' + encodeURIComponent('Olá, Renan! Vim pelo site de cursos.'),
  whatsappAgendar: 'https://wa.me/5511950517467?text=' + encodeURIComponent('Olá, Renan! Quero agendar um atendimento.'),
  whatsappTxt: '+55 11 95051-7467',
  instagram: 'https://www.instagram.com/renanfernandes_massoterapeuta',
  instagramTxt: '@renanfernandes_massoterapeuta',
  tiktok: 'https://www.tiktok.com/@renan_fernandes30',
  tiktokTxt: '@renan_fernandes30',
};

type Base = Omit<Curso, 'modulos' | 'exemplo'>;

const BASE: Base[] = [
  { id: 'lombar', titulo: 'Lombar travada: alívio em casa', formacao: 'Para você', professor: 'Renan Fernandes', preco: 87, nota: 4.9, alunos: 2140,
    resumo: 'Alívio de dores lombares com mobilidade e alongamentos feitos em casa, em sessões curtas.',
    paraQuem: 'Para quem passa muitas horas sentado, sente a lombar travar ao acordar ou depois de esforço.',
    eixos: ['Entender a lombar', 'Mobilidade', 'Alongamentos', 'Postura no dia a dia', 'Sinais de alerta'], antes: [25, 30, 20, 35, 15], depois: [80, 75, 85, 80, 85] },
  { id: 'bruxismo', titulo: 'Automassagem para bruxismo', formacao: 'Para você', professor: 'Renan Fernandes', preco: 67, nota: 4.9, alunos: 3380,
    resumo: 'Automassagem e hábitos para soltar a mandíbula e reduzir a tensão no rosto.',
    paraQuem: 'Para quem range ou aperta os dentes, acorda com o rosto cansado ou tem dor de cabeça tensional.',
    eixos: ['Mandíbula e músculos', 'Pontos de tensão', 'Técnica de automassagem', 'Hábitos e sono', 'Quando procurar ajuda'], antes: [20, 25, 15, 35, 30], depois: [80, 85, 85, 70, 85] },
  { id: 'pescoco', titulo: 'Pescoço e ombros sem tensão', formacao: 'Para você', professor: 'Renan Fernandes', preco: 67, nota: 4.8, alunos: 1960,
    resumo: 'Sequências de poucos minutos para soltar pescoço e ombros no meio do dia.',
    paraQuem: 'Para quem trabalha no computador ou no celular e sente o trapézio pesado no fim do dia.',
    eixos: ['Anatomia do pescoço', 'Automassagem', 'Alongamentos', 'Postura no trabalho', 'Sinais de alerta'], antes: [20, 30, 35, 25, 20], depois: [75, 85, 85, 80, 80] },
  { id: 'recuperacao', titulo: 'Massagem para recuperação muscular', formacao: 'Para terapeutas', professor: 'Renan Fernandes', preco: 497, nota: 5.0, alunos: 640,
    resumo: 'Formação em massagem para recuperação muscular, da anatomia ao atendimento de atletas.',
    paraQuem: 'Para massoterapeutas, estudantes e profissionais do esporte que querem atender com mais precisão.',
    eixos: ['Anatomia palpatória', 'Manobras profundas', 'Pressão e direção', 'Avaliação do cliente', 'Atendimento a atletas', 'Ergonomia'], antes: [40, 30, 35, 30, 20, 35], depois: [85, 80, 85, 80, 75, 85] },
  { id: 'ventosa', titulo: 'Ventosaterapia na prática', formacao: 'Para terapeutas', professor: 'Renan Fernandes', preco: 297, nota: 4.9, alunos: 520,
    resumo: 'Fundamentos, técnica e biossegurança da ventosaterapia no atendimento profissional.',
    paraQuem: 'Para terapeutas que querem incluir a ventosa no atendimento com segurança.',
    eixos: ['Fundamentos', 'Tipos de ventosa', 'Aplicação e tempo', 'Contraindicações', 'Biossegurança'], antes: [25, 30, 15, 30, 40], depois: [80, 85, 80, 90, 90] },
  { id: 'pes', titulo: 'Pés e panturrilhas: liberação completa', formacao: 'Para terapeutas', professor: 'Renan Fernandes', preco: 247, nota: 4.9, alunos: 410,
    resumo: 'Liberação completa de pés e panturrilhas, com sequência pronta para atender.',
    paraQuem: 'Para terapeutas que atendem corredores, quem fica muito em pé e clientes com fascite.',
    eixos: ['Anatomia do pé', 'Pontos de tensão', 'Sequência de liberação', 'Pressão', 'Atendimento'], antes: [30, 25, 20, 35, 40], depois: [80, 80, 85, 80, 85] },
];

const hashStr = (s: string) => { let h = 7; for (const ch of s) h = (h * 31 + ch.charCodeAt(0)) >>> 0; return h; };

/** Módulos de exemplo, gerados como no protótipo (genMods), para que as durações coincidam. */
function modulosExemplo(c: Base): Modulo[] {
  const base: [number, number][] = [[7, 40], [11, 15], [5, 30]];
  const h = hashStr(c.id), terap = c.formacao === 'Para terapeutas';
  const n = terap ? Math.min(c.eixos.length, 5) : 4;
  return c.eixos.slice(0, n).map((a, i) => {
    const d = (k: number) => { const [m, s] = base[k]; return `${m + ((h >> (i + k)) % 5) + (terap ? 6 : 0)}:${String(s).padStart(2, '0')}`; };
    const mod = `m${i + 1}`;
    return {
      id: mod, titulo: `Módulo ${i + 1}: ${a}`,
      aulas: [
        { id: `${mod}-a1`, titulo: `${a}: fundamentos`, tipo: 'video', duracaoSeg: parseDur(d(0)) },
        { id: `${mod}-a2`, titulo: `${a}: demonstração comentada`, tipo: 'video', duracaoSeg: parseDur(d(1)) },
        { id: `${mod}-a3`, titulo: 'Prática guiada', tipo: 'video', duracaoSeg: parseDur(d(2)) },
        { id: `${mod}-t`, titulo: `Teste do módulo ${i + 1}`, tipo: 'teste', rotulo: '8 questões' },
      ],
    };
  });
}

export const CURSOS: Curso[] = BASE.map(c => ({ ...c, modulos: modulosExemplo(c), exemplo: true }));

export const PACOTES: Pacote[] = [
  { id: 'autocuidado', titulo: 'Autocuidado completo', descricao: 'Para soltar o corpo em casa: lombar, pescoço e mandíbula.', cursos: ['lombar', 'pescoco', 'bruxismo'], preco: 167 },
  { id: 'costas', titulo: 'Costas e postura', descricao: 'Para quem passa o dia sentado e sente lombar e ombros.', cursos: ['lombar', 'pescoco'], preco: 127 },
  { id: 'formacao', titulo: 'Formação do terapeuta', descricao: 'Recuperação muscular, ventosaterapia e pés para o atendimento.', cursos: ['recuperacao', 'ventosa', 'pes'], preco: 797 },
];

export const DUVIDAS: Duvida[] = [
  { id: 1, curso: 'lombar', tema: 'Contraindicações', aula: 'Módulo 3, aula 2', titulo: 'Senti uma fisgada na lombar no alongamento do piriforme. Paro?', status: 'respondida', quando: 'há 2 dias',
    mensagens: [{ professor: false, nome: 'Carla S.', texto: 'No terceiro alongamento senti uma fisgada na lombar. Devo parar?' },
      { professor: true, nome: '', texto: 'Pare esse movimento e faça os dois primeiros com amplitude menor. Alongamento pode incomodar, mas não pode fisgar. Se a fisgada voltar ou descer para a perna, procure um médico antes de continuar; isso está na aula de sinais de alerta.' }] },
  { id: 2, curso: 'lombar', tema: 'Gestação', aula: 'Módulo 2, aula 1', titulo: 'Estou grávida. Posso fazer a sequência de mobilidade?', status: 'aberta', quando: 'há 3 horas',
    mensagens: [{ professor: false, nome: 'Ana L.', texto: 'Estou com 5 meses de gestação. Posso fazer a sequência de mobilidade da aula 1?' }] },
  { id: 3, curso: 'lombar', tema: 'Frequência', aula: 'Módulo 3, aula 3', titulo: 'Quantas vezes por dia posso repetir os três movimentos?', status: 'resolvida', quando: 'há 1 semana',
    mensagens: [{ professor: false, nome: 'Pedro A.', texto: 'Os três movimentos podem ser feitos de manhã e à noite?' },
      { professor: true, nome: '', texto: 'Pode, duas vezes ao dia. O que mais conta é a regularidade: 5 minutos todo dia valem mais que meia hora no fim de semana.' },
      { professor: false, nome: 'Pedro A.', texto: 'Combinado, vou manter de manhã e à noite.' }] },
  { id: 4, curso: 'bruxismo', tema: 'Dor de cabeça', aula: 'Módulo 1, aula 2', titulo: 'Sinto dor de cabeça depois da automassagem. É normal?', status: 'aberta', quando: 'há 1 dia',
    mensagens: [{ professor: false, nome: 'Marcos L.', texto: 'Depois de cinco minutos sinto uma dor de cabeça na região da têmpora. É normal?' }] },
  { id: 5, curso: 'bruxismo', tema: 'Dor de cabeça', aula: 'Módulo 1, aula 2', titulo: 'A dor de cabeça passa se eu parar?', status: 'resolvida', quando: 'há 4 dias',
    mensagens: [{ professor: false, nome: 'Júlia M.', texto: 'Se eu parar, a dor passa logo?' },
      { professor: true, nome: '', texto: 'Sim. Pare, respire e retome só na próxima sessão. Se a dor persistir, procure um dentista ou médico.' }] },
  { id: 6, curso: 'pescoco', tema: 'Postura', aula: 'Módulo 2, aula 1', titulo: 'Posso fazer a sequência sentada no trabalho?', status: 'aberta', quando: 'há 2 dias',
    mensagens: [{ professor: false, nome: 'Tatiana R.', texto: 'Trabalho o dia todo sentada. Consigo fazer a sequência na cadeira?' }] },
];

/* Contas de demonstração (até o login real do M2). Qualquer senha. */
export interface MatriculaDemo { status: 'ativo' | 'aguardando'; feitas: number }
export const CONTAS_DEMO: Record<string, { nome: string; papel: 'aluno' | 'admin'; mats: Record<string, MatriculaDemo> }> = {
  'admin@teste.com': { nome: 'Administração', papel: 'admin', mats: {} },
  'cliente@teste.com': { nome: 'Cliente de Teste', papel: 'aluno', mats: { lombar: { status: 'aguardando', feitas: 0 } } },
  'ana@exemplo.com.br': { nome: 'Ana Lima', papel: 'aluno', mats: { lombar: { status: 'ativo', feitas: 9 } } },
  'rafael@exemplo.com.br': { nome: 'Rafael Costa', papel: 'aluno', mats: { recuperacao: { status: 'ativo', feitas: 8 } } },
};
