/* =====================================================================
   01 · DADOS DE EXEMPLO
   Tudo aqui é ilustrativo e vive só na memória do navegador.
   No produto, cada bloco vira uma tabela (ver HANDOFF.md, "Modelo de dados").
   ===================================================================== */

const ADMIN_EMAIL = 'admin@teste.com';      // conta de teste da administração
const CLIENTE_EMAIL = 'cliente@teste.com';  // conta de teste do aluno

const RENAN = {
  nome: 'Renan Fernandes',
  whatsapp: 'https://wa.me/5511950517467?text=' + encodeURIComponent('Olá, Renan! Vim pelo site de cursos.'),
  whatsappTxt: '+55 11 95051-7467',
  instagram: 'https://www.instagram.com/renanfernandes_massoterapeuta',
  instagramTxt: '@renanfernandes_massoterapeuta',
  tiktok: 'https://www.tiktok.com/@renan_fernandes30',
  tiktokTxt: '@renan_fernandes30'
};

/* ---------- cursos ----------
   Não há campo de horas: a duração é sempre calculada a partir das aulas (stats()).
   Cursos sem "modules" usam módulos de exemplo gerados por genMods(). */
const courses = [
  {id:'lombar', title:'Lombar travada: alívio em casa', cat:'Para você', teacher:'Renan Fernandes', price:87, rating:4.9, students:2140,
   short:'Alívio de dores lombares com mobilidade e alongamentos feitos em casa, em sessões curtas.',
   paraQuem:'Para quem passa muitas horas sentado, sente a lombar travar ao acordar ou depois de esforço.',
   axes:['Entender a lombar','Mobilidade','Alongamentos','Postura no dia a dia','Sinais de alerta'], before:[25,30,20,35,15], after:[80,75,85,80,85]},
  {id:'bruxismo', title:'Automassagem para bruxismo', cat:'Para você', teacher:'Renan Fernandes', price:67, rating:4.9, students:3380,
   short:'Automassagem e hábitos para soltar a mandíbula e reduzir a tensão no rosto.',
   paraQuem:'Para quem range ou aperta os dentes, acorda com o rosto cansado ou tem dor de cabeça tensional.',
   axes:['Mandíbula e músculos','Pontos de tensão','Técnica de automassagem','Hábitos e sono','Quando procurar ajuda'], before:[20,25,15,35,30], after:[80,85,85,70,85]},
  {id:'pescoco', title:'Pescoço e ombros sem tensão', cat:'Para você', teacher:'Renan Fernandes', price:67, rating:4.8, students:1960,
   short:'Sequências de poucos minutos para soltar pescoço e ombros no meio do dia.',
   paraQuem:'Para quem trabalha no computador ou no celular e sente o trapézio pesado no fim do dia.',
   axes:['Anatomia do pescoço','Automassagem','Alongamentos','Postura no trabalho','Sinais de alerta'], before:[20,30,35,25,20], after:[75,85,85,80,80]},
  {id:'recuperacao', title:'Massagem para recuperação muscular', cat:'Para terapeutas', teacher:'Renan Fernandes', price:497, rating:5.0, students:640,
   short:'Formação em massagem para recuperação muscular, da anatomia ao atendimento de atletas.',
   paraQuem:'Para massoterapeutas, estudantes e profissionais do esporte que querem atender com mais precisão.',
   axes:['Anatomia palpatória','Manobras profundas','Pressão e direção','Avaliação do cliente','Atendimento a atletas','Ergonomia'], before:[40,30,35,30,20,35], after:[85,80,85,80,75,85]},
  {id:'ventosa', title:'Ventosaterapia na prática', cat:'Para terapeutas', teacher:'Renan Fernandes', price:297, rating:4.9, students:520,
   short:'Fundamentos, técnica e biossegurança da ventosaterapia no atendimento profissional.',
   paraQuem:'Para terapeutas que querem incluir a ventosa no atendimento com segurança.',
   axes:['Fundamentos','Tipos de ventosa','Aplicação e tempo','Contraindicações','Biossegurança'], before:[25,30,15,30,40], after:[80,85,80,90,90]},
  {id:'pes', title:'Pés e panturrilhas: liberação completa', cat:'Para terapeutas', teacher:'Renan Fernandes', price:247, rating:4.9, students:410,
   short:'Liberação completa de pés e panturrilhas, com sequência pronta para atender.',
   paraQuem:'Para terapeutas que atendem corredores, quem fica muito em pé e clientes com fascite.',
   axes:['Anatomia do pé','Pontos de tensão','Sequência de liberação','Pressão','Atendimento'], before:[30,25,20,35,40], after:[80,80,85,80,85]}
];

/* ---------- pacotes (sugestão de preço) ---------- */
const PACKS = [
  {id:'autocuidado', title:'Autocuidado completo', sub:'Para soltar o corpo em casa: lombar, pescoço e mandíbula.', cursos:['lombar','pescoco','bruxismo'], price:167},
  {id:'costas', title:'Costas e postura', sub:'Para quem passa o dia sentado e sente lombar e ombros.', cursos:['lombar','pescoco'], price:127},
  {id:'formacao', title:'Formação do terapeuta', sub:'Recuperação muscular, ventosaterapia e pés para o atendimento.', cursos:['recuperacao','ventosa','pes'], price:797}
];

/* ---------- dúvidas (por curso, aula e tema) ---------- */
const threads = [
  {id:1, course:'lombar', tema:'Contraindicações', lesson:'Módulo 3, aula 2', title:'Senti uma fisgada na lombar no alongamento do piriforme. Paro?', status:'respondida', when:'há 2 dias',
   msgs:[{prof:false,name:'Carla S.',text:'No terceiro alongamento senti uma fisgada na lombar. Devo parar?'},
         {prof:true,name:'',text:'Pare esse movimento e faça os dois primeiros com amplitude menor. Alongamento pode incomodar, mas não pode fisgar. Se a fisgada voltar ou descer para a perna, procure um médico antes de continuar; isso está na aula de sinais de alerta.'}]},
  {id:2, course:'lombar', tema:'Gestação', lesson:'Módulo 2, aula 1', title:'Estou grávida. Posso fazer a sequência de mobilidade?', status:'aberta', when:'há 3 horas',
   msgs:[{prof:false,name:'Ana L.',text:'Estou com 5 meses de gestação. Posso fazer a sequência de mobilidade da aula 1?'}]},
  {id:3, course:'lombar', tema:'Frequência', lesson:'Módulo 3, aula 3', title:'Quantas vezes por dia posso repetir os três movimentos?', status:'resolvida', when:'há 1 semana',
   msgs:[{prof:false,name:'Pedro A.',text:'Os três movimentos podem ser feitos de manhã e à noite?'},
         {prof:true,name:'',text:'Pode, duas vezes ao dia. O que mais conta é a regularidade: 5 minutos todo dia valem mais que meia hora no fim de semana.'},
         {prof:false,name:'Pedro A.',text:'Combinado, vou manter de manhã e à noite.'}]},
  {id:4, course:'bruxismo', tema:'Dor de cabeça', lesson:'Módulo 1, aula 2', title:'Sinto dor de cabeça depois da automassagem. É normal?', status:'aberta', when:'há 1 dia',
   msgs:[{prof:false,name:'Marcos L.',text:'Depois de cinco minutos sinto uma dor de cabeça na região da têmpora. É normal?'}]},
  {id:5, course:'bruxismo', tema:'Dor de cabeça', lesson:'Módulo 1, aula 2', title:'A dor de cabeça passa se eu parar?', status:'resolvida', when:'há 4 dias',
   msgs:[{prof:false,name:'Júlia M.',text:'Se eu parar, a dor passa logo?'},
         {prof:true,name:'',text:'Sim. Pare, respire e retome só na próxima sessão. Se a dor persistir, procure um dentista ou médico.'}]},
  {id:6, course:'pescoco', tema:'Postura', lesson:'Módulo 2, aula 1', title:'Posso fazer a sequência sentada no trabalho?', status:'aberta', when:'há 2 dias',
   msgs:[{prof:false,name:'Tatiana R.',text:'Trabalho o dia todo sentada. Consigo fazer a sequência na cadeira?'}]}
];

/* ---------- alunos, matrículas, pedidos e certificados ----------
   mats[cursoId].status: 'aguardando' (pagou, espera liberação) | 'ativo' (liberado)
   pedidos[].status: 'aguardando' | 'liberado' | 'negado'
   certs[].status:   'pendente'   | 'aprovado' | 'negado' */
const adm = {
  alunos: [
    {email:'ana@exemplo.com.br',    nome:'Ana Lima',      cadastro:'03/09/2026', mats:{lombar:{status:'ativo',feitas:9,pos:'Módulo 3 · Aula 2',ultimo:'hoje, 08:40'}}},
    {email:'pedro@exemplo.com.br',  nome:'Pedro Alves',   cadastro:'21/09/2026', mats:{bruxismo:{status:'ativo',feitas:3,pos:'Módulo 1 · Aula 3',ultimo:'ontem, 21:15'}}},
    {email:'carla@exemplo.com.br',  nome:'Carla Souza',   cadastro:'12/08/2026', mats:{lombar:{status:'ativo',feitas:12,pos:'Concluído',ultimo:'há 3 dias'}}},
    {email:'julia@exemplo.com.br',  nome:'Júlia Mendes',  cadastro:'14/10/2026', mats:{pescoco:{status:'ativo',feitas:2,pos:'Módulo 1 · Aula 3',ultimo:'há 5 dias'}}},
    {email:'rafael@exemplo.com.br', nome:'Rafael Costa',  cadastro:'29/07/2026', mats:{recuperacao:{status:'ativo',feitas:8,pos:'Módulo 3 · Aula 2',ultimo:'hoje, 07:02'}}},
    {email:'marcos@exemplo.com.br', nome:'Marcos Lima',   cadastro:'16/11/2026', mats:{bruxismo:{status:'aguardando',feitas:0,pos:'—',ultimo:'—'}}},
    {email:'tatiana@exemplo.com.br',nome:'Tatiana Rocha', cadastro:'15/11/2026', mats:{pescoco:{status:'aguardando',feitas:0,pos:'—',ultimo:'—'}}},
    {email:CLIENTE_EMAIL,           nome:'Cliente de Teste', cadastro:'16/11/2026', mats:{lombar:{status:'aguardando',feitas:0,pos:'—',ultimo:'—'}}}
  ],
  pedidos: [
    {id:'p1',email:'marcos@exemplo.com.br', nome:'Marcos Lima',     cursos:['bruxismo'],valor:67,metodo:'Pix',   data:'hoje, 09:12', status:'aguardando'},
    {id:'p2',email:'tatiana@exemplo.com.br',nome:'Tatiana Rocha',   cursos:['pescoco'], valor:67,metodo:'Cartão',data:'ontem, 17:40',status:'aguardando'},
    {id:'p4',email:CLIENTE_EMAIL,           nome:'Cliente de Teste',cursos:['lombar'],  valor:87,metodo:'Pix',   data:'hoje, 11:05', status:'aguardando'},
    {id:'p3',email:'ana@exemplo.com.br',    nome:'Ana Lima',        cursos:['lombar'],  valor:87,metodo:'Pix',   data:'03/09/2026',  status:'liberado'}
  ],
  certs: [
    {id:'k1',email:'carla@exemplo.com.br',nome:'Carla Souza',curso:'lombar',data:'há 3 dias',status:'pendente',codigo:''}
  ]
};

/* ---------- modelo do certificado (editável em Administração > Certificados) ----------
   bg: imagem enviada pelo admin (A4 deitado). Sem imagem, usa o modelo padrão da marca.
   *Y: posição vertical de cada campo, em % da altura. */
const certTpl = { bg:'', cor:'#12161B', nomeY:47, cursoY:58, horasY:65, rodapeY:93 };

/* ---------- diagnóstico: perguntas ---------- */
const DQ = [
  {k:'perfil', q:'Você quer aprender para…', opts:[['eu','Cuidar de mim'],['terapeuta','Atender clientes (sou terapeuta ou estudante)']]},
  {k:'regiao', multi:true, q:'Onde você sente mais tensão ou dor?', sub:'Pode marcar mais de uma.', opts:[['lombar','Lombar'],['pescoco','Pescoço e ombros'],['mandibula','Mandíbula e rosto'],['pes','Pés e panturrilhas'],['treino','Músculos depois do treino'],['nenhum','Nenhum incômodo agora']]},
  {k:'freq', q:'Com que frequência isso acontece?', opts:[['rara','Raramente'],['semana','Algumas vezes por semana'],['dia','Quase todo dia']]},
  {k:'rotina', q:'Como é a sua rotina?', opts:[['sentado','Muitas horas sentado'],['empe','Muitas horas em pé'],['treino','Treino ou esporte com frequência'],['variada','Variada']]},
  {k:'conhece', q:'Quanto você conhece do próprio corpo (músculos, postura, alongamento)?', opts:[['pouco','Pouco'],['basico','O básico'],['bastante','Bastante']]},
  {k:'foco', multi:true, only:'terapeuta', q:'O que você quer acrescentar ao atendimento?', sub:'Pode marcar mais de uma.', opts:[['recuperacao','Recuperação muscular e atletas'],['ventosa','Ventosaterapia'],['pes','Pés e panturrilhas'],['autocuidado','Orientar autocuidado aos clientes']]}
];

/* ---------- estado da sessão ---------- */
const BLOCK = 5; // presença: a aula é dividida em blocos de 5 s
const state = {
  logged:false, role:'aluno', email:'', nome:'', lastStudent:'',
  course:'lombar', owned:new Set(), pending:new Set(), doneLessons:{},
  filter:'Todos', view:'ambos', thread:1,
  preview:false, sampleOk:false, pack:null, diag:null,
  lessonRef:null, dur:300, pos:0, rate:1, playing:false, watched:new Uint8Array(60), done:false
};
