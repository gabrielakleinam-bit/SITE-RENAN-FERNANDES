-- Cursos e pacotes iniciais, como RASCUNHO (sem vídeos). Rode depois do 0001.
-- Gerado por scripts/gerar-exemplos.ts. Só insere se ainda não existir curso com o mesmo endereço.
do $$
declare c uuid; m uuid; p uuid;
begin
  if not exists (select 1 from public.cursos where slug = 'lombar') then
    insert into public.cursos (slug, titulo, formacao, preco, resumo, para_quem, antes, depois, publicado)
    values ('lombar', 'Lombar travada: alívio em casa', 'Para você', 87, 'Alívio de dores lombares com mobilidade e alongamentos feitos em casa, em sessões curtas.', 'Para quem passa muitas horas sentado, sente a lombar travar ao acordar ou depois de esforço.', '{25,30,20,35,15}', '{80,75,85,80,85}', false)
    returning id into c;
    insert into public.modulos (curso_id, ordem, titulo) values (c, 0, 'Entender a lombar') returning id into m;
    insert into public.aulas (modulo_id, ordem, titulo, tipo) values (m, 0, 'Entender a lombar: fundamentos', 'video');
    insert into public.aulas (modulo_id, ordem, titulo, tipo) values (m, 1, 'Entender a lombar: demonstração comentada', 'video');
    insert into public.aulas (modulo_id, ordem, titulo, tipo) values (m, 2, 'Prática guiada', 'video');
    insert into public.aulas (modulo_id, ordem, titulo, tipo) values (m, 3, 'Teste do módulo 1', 'teste');
    insert into public.modulos (curso_id, ordem, titulo) values (c, 1, 'Mobilidade') returning id into m;
    insert into public.aulas (modulo_id, ordem, titulo, tipo) values (m, 0, 'Mobilidade: fundamentos', 'video');
    insert into public.aulas (modulo_id, ordem, titulo, tipo) values (m, 1, 'Mobilidade: demonstração comentada', 'video');
    insert into public.aulas (modulo_id, ordem, titulo, tipo) values (m, 2, 'Prática guiada', 'video');
    insert into public.aulas (modulo_id, ordem, titulo, tipo) values (m, 3, 'Teste do módulo 2', 'teste');
    insert into public.modulos (curso_id, ordem, titulo) values (c, 2, 'Alongamentos') returning id into m;
    insert into public.aulas (modulo_id, ordem, titulo, tipo) values (m, 0, 'Alongamentos: fundamentos', 'video');
    insert into public.aulas (modulo_id, ordem, titulo, tipo) values (m, 1, 'Alongamentos: demonstração comentada', 'video');
    insert into public.aulas (modulo_id, ordem, titulo, tipo) values (m, 2, 'Prática guiada', 'video');
    insert into public.aulas (modulo_id, ordem, titulo, tipo) values (m, 3, 'Teste do módulo 3', 'teste');
    insert into public.modulos (curso_id, ordem, titulo) values (c, 3, 'Postura no dia a dia') returning id into m;
    insert into public.aulas (modulo_id, ordem, titulo, tipo) values (m, 0, 'Postura no dia a dia: fundamentos', 'video');
    insert into public.aulas (modulo_id, ordem, titulo, tipo) values (m, 1, 'Postura no dia a dia: demonstração comentada', 'video');
    insert into public.aulas (modulo_id, ordem, titulo, tipo) values (m, 2, 'Prática guiada', 'video');
    insert into public.aulas (modulo_id, ordem, titulo, tipo) values (m, 3, 'Teste do módulo 4', 'teste');
  end if;
  if not exists (select 1 from public.cursos where slug = 'bruxismo') then
    insert into public.cursos (slug, titulo, formacao, preco, resumo, para_quem, antes, depois, publicado)
    values ('bruxismo', 'Automassagem para bruxismo', 'Para você', 67, 'Automassagem e hábitos para soltar a mandíbula e reduzir a tensão no rosto.', 'Para quem range ou aperta os dentes, acorda com o rosto cansado ou tem dor de cabeça tensional.', '{20,25,15,35,30}', '{80,85,85,70,85}', false)
    returning id into c;
    insert into public.modulos (curso_id, ordem, titulo) values (c, 0, 'Mandíbula e músculos') returning id into m;
    insert into public.aulas (modulo_id, ordem, titulo, tipo) values (m, 0, 'Mandíbula e músculos: fundamentos', 'video');
    insert into public.aulas (modulo_id, ordem, titulo, tipo) values (m, 1, 'Mandíbula e músculos: demonstração comentada', 'video');
    insert into public.aulas (modulo_id, ordem, titulo, tipo) values (m, 2, 'Prática guiada', 'video');
    insert into public.aulas (modulo_id, ordem, titulo, tipo) values (m, 3, 'Teste do módulo 1', 'teste');
    insert into public.modulos (curso_id, ordem, titulo) values (c, 1, 'Pontos de tensão') returning id into m;
    insert into public.aulas (modulo_id, ordem, titulo, tipo) values (m, 0, 'Pontos de tensão: fundamentos', 'video');
    insert into public.aulas (modulo_id, ordem, titulo, tipo) values (m, 1, 'Pontos de tensão: demonstração comentada', 'video');
    insert into public.aulas (modulo_id, ordem, titulo, tipo) values (m, 2, 'Prática guiada', 'video');
    insert into public.aulas (modulo_id, ordem, titulo, tipo) values (m, 3, 'Teste do módulo 2', 'teste');
    insert into public.modulos (curso_id, ordem, titulo) values (c, 2, 'Técnica de automassagem') returning id into m;
    insert into public.aulas (modulo_id, ordem, titulo, tipo) values (m, 0, 'Técnica de automassagem: fundamentos', 'video');
    insert into public.aulas (modulo_id, ordem, titulo, tipo) values (m, 1, 'Técnica de automassagem: demonstração comentada', 'video');
    insert into public.aulas (modulo_id, ordem, titulo, tipo) values (m, 2, 'Prática guiada', 'video');
    insert into public.aulas (modulo_id, ordem, titulo, tipo) values (m, 3, 'Teste do módulo 3', 'teste');
    insert into public.modulos (curso_id, ordem, titulo) values (c, 3, 'Hábitos e sono') returning id into m;
    insert into public.aulas (modulo_id, ordem, titulo, tipo) values (m, 0, 'Hábitos e sono: fundamentos', 'video');
    insert into public.aulas (modulo_id, ordem, titulo, tipo) values (m, 1, 'Hábitos e sono: demonstração comentada', 'video');
    insert into public.aulas (modulo_id, ordem, titulo, tipo) values (m, 2, 'Prática guiada', 'video');
    insert into public.aulas (modulo_id, ordem, titulo, tipo) values (m, 3, 'Teste do módulo 4', 'teste');
  end if;
  if not exists (select 1 from public.cursos where slug = 'pescoco') then
    insert into public.cursos (slug, titulo, formacao, preco, resumo, para_quem, antes, depois, publicado)
    values ('pescoco', 'Pescoço e ombros sem tensão', 'Para você', 67, 'Sequências de poucos minutos para soltar pescoço e ombros no meio do dia.', 'Para quem trabalha no computador ou no celular e sente o trapézio pesado no fim do dia.', '{20,30,35,25,20}', '{75,85,85,80,80}', false)
    returning id into c;
    insert into public.modulos (curso_id, ordem, titulo) values (c, 0, 'Anatomia do pescoço') returning id into m;
    insert into public.aulas (modulo_id, ordem, titulo, tipo) values (m, 0, 'Anatomia do pescoço: fundamentos', 'video');
    insert into public.aulas (modulo_id, ordem, titulo, tipo) values (m, 1, 'Anatomia do pescoço: demonstração comentada', 'video');
    insert into public.aulas (modulo_id, ordem, titulo, tipo) values (m, 2, 'Prática guiada', 'video');
    insert into public.aulas (modulo_id, ordem, titulo, tipo) values (m, 3, 'Teste do módulo 1', 'teste');
    insert into public.modulos (curso_id, ordem, titulo) values (c, 1, 'Automassagem') returning id into m;
    insert into public.aulas (modulo_id, ordem, titulo, tipo) values (m, 0, 'Automassagem: fundamentos', 'video');
    insert into public.aulas (modulo_id, ordem, titulo, tipo) values (m, 1, 'Automassagem: demonstração comentada', 'video');
    insert into public.aulas (modulo_id, ordem, titulo, tipo) values (m, 2, 'Prática guiada', 'video');
    insert into public.aulas (modulo_id, ordem, titulo, tipo) values (m, 3, 'Teste do módulo 2', 'teste');
    insert into public.modulos (curso_id, ordem, titulo) values (c, 2, 'Alongamentos') returning id into m;
    insert into public.aulas (modulo_id, ordem, titulo, tipo) values (m, 0, 'Alongamentos: fundamentos', 'video');
    insert into public.aulas (modulo_id, ordem, titulo, tipo) values (m, 1, 'Alongamentos: demonstração comentada', 'video');
    insert into public.aulas (modulo_id, ordem, titulo, tipo) values (m, 2, 'Prática guiada', 'video');
    insert into public.aulas (modulo_id, ordem, titulo, tipo) values (m, 3, 'Teste do módulo 3', 'teste');
    insert into public.modulos (curso_id, ordem, titulo) values (c, 3, 'Postura no trabalho') returning id into m;
    insert into public.aulas (modulo_id, ordem, titulo, tipo) values (m, 0, 'Postura no trabalho: fundamentos', 'video');
    insert into public.aulas (modulo_id, ordem, titulo, tipo) values (m, 1, 'Postura no trabalho: demonstração comentada', 'video');
    insert into public.aulas (modulo_id, ordem, titulo, tipo) values (m, 2, 'Prática guiada', 'video');
    insert into public.aulas (modulo_id, ordem, titulo, tipo) values (m, 3, 'Teste do módulo 4', 'teste');
  end if;
  if not exists (select 1 from public.cursos where slug = 'recuperacao') then
    insert into public.cursos (slug, titulo, formacao, preco, resumo, para_quem, antes, depois, publicado)
    values ('recuperacao', 'Massagem para recuperação muscular', 'Para terapeutas', 497, 'Formação em massagem para recuperação muscular, da anatomia ao atendimento de atletas.', 'Para massoterapeutas, estudantes e profissionais do esporte que querem atender com mais precisão.', '{40,30,35,30,20,35}', '{85,80,85,80,75,85}', false)
    returning id into c;
    insert into public.modulos (curso_id, ordem, titulo) values (c, 0, 'Anatomia palpatória') returning id into m;
    insert into public.aulas (modulo_id, ordem, titulo, tipo) values (m, 0, 'Anatomia palpatória: fundamentos', 'video');
    insert into public.aulas (modulo_id, ordem, titulo, tipo) values (m, 1, 'Anatomia palpatória: demonstração comentada', 'video');
    insert into public.aulas (modulo_id, ordem, titulo, tipo) values (m, 2, 'Prática guiada', 'video');
    insert into public.aulas (modulo_id, ordem, titulo, tipo) values (m, 3, 'Teste do módulo 1', 'teste');
    insert into public.modulos (curso_id, ordem, titulo) values (c, 1, 'Manobras profundas') returning id into m;
    insert into public.aulas (modulo_id, ordem, titulo, tipo) values (m, 0, 'Manobras profundas: fundamentos', 'video');
    insert into public.aulas (modulo_id, ordem, titulo, tipo) values (m, 1, 'Manobras profundas: demonstração comentada', 'video');
    insert into public.aulas (modulo_id, ordem, titulo, tipo) values (m, 2, 'Prática guiada', 'video');
    insert into public.aulas (modulo_id, ordem, titulo, tipo) values (m, 3, 'Teste do módulo 2', 'teste');
    insert into public.modulos (curso_id, ordem, titulo) values (c, 2, 'Pressão e direção') returning id into m;
    insert into public.aulas (modulo_id, ordem, titulo, tipo) values (m, 0, 'Pressão e direção: fundamentos', 'video');
    insert into public.aulas (modulo_id, ordem, titulo, tipo) values (m, 1, 'Pressão e direção: demonstração comentada', 'video');
    insert into public.aulas (modulo_id, ordem, titulo, tipo) values (m, 2, 'Prática guiada', 'video');
    insert into public.aulas (modulo_id, ordem, titulo, tipo) values (m, 3, 'Teste do módulo 3', 'teste');
    insert into public.modulos (curso_id, ordem, titulo) values (c, 3, 'Avaliação do cliente') returning id into m;
    insert into public.aulas (modulo_id, ordem, titulo, tipo) values (m, 0, 'Avaliação do cliente: fundamentos', 'video');
    insert into public.aulas (modulo_id, ordem, titulo, tipo) values (m, 1, 'Avaliação do cliente: demonstração comentada', 'video');
    insert into public.aulas (modulo_id, ordem, titulo, tipo) values (m, 2, 'Prática guiada', 'video');
    insert into public.aulas (modulo_id, ordem, titulo, tipo) values (m, 3, 'Teste do módulo 4', 'teste');
    insert into public.modulos (curso_id, ordem, titulo) values (c, 4, 'Atendimento a atletas') returning id into m;
    insert into public.aulas (modulo_id, ordem, titulo, tipo) values (m, 0, 'Atendimento a atletas: fundamentos', 'video');
    insert into public.aulas (modulo_id, ordem, titulo, tipo) values (m, 1, 'Atendimento a atletas: demonstração comentada', 'video');
    insert into public.aulas (modulo_id, ordem, titulo, tipo) values (m, 2, 'Prática guiada', 'video');
    insert into public.aulas (modulo_id, ordem, titulo, tipo) values (m, 3, 'Teste do módulo 5', 'teste');
  end if;
  if not exists (select 1 from public.cursos where slug = 'ventosa') then
    insert into public.cursos (slug, titulo, formacao, preco, resumo, para_quem, antes, depois, publicado)
    values ('ventosa', 'Ventosaterapia na prática', 'Para terapeutas', 297, 'Fundamentos, técnica e biossegurança da ventosaterapia no atendimento profissional.', 'Para terapeutas que querem incluir a ventosa no atendimento com segurança.', '{25,30,15,30,40}', '{80,85,80,90,90}', false)
    returning id into c;
    insert into public.modulos (curso_id, ordem, titulo) values (c, 0, 'Fundamentos') returning id into m;
    insert into public.aulas (modulo_id, ordem, titulo, tipo) values (m, 0, 'Fundamentos: fundamentos', 'video');
    insert into public.aulas (modulo_id, ordem, titulo, tipo) values (m, 1, 'Fundamentos: demonstração comentada', 'video');
    insert into public.aulas (modulo_id, ordem, titulo, tipo) values (m, 2, 'Prática guiada', 'video');
    insert into public.aulas (modulo_id, ordem, titulo, tipo) values (m, 3, 'Teste do módulo 1', 'teste');
    insert into public.modulos (curso_id, ordem, titulo) values (c, 1, 'Tipos de ventosa') returning id into m;
    insert into public.aulas (modulo_id, ordem, titulo, tipo) values (m, 0, 'Tipos de ventosa: fundamentos', 'video');
    insert into public.aulas (modulo_id, ordem, titulo, tipo) values (m, 1, 'Tipos de ventosa: demonstração comentada', 'video');
    insert into public.aulas (modulo_id, ordem, titulo, tipo) values (m, 2, 'Prática guiada', 'video');
    insert into public.aulas (modulo_id, ordem, titulo, tipo) values (m, 3, 'Teste do módulo 2', 'teste');
    insert into public.modulos (curso_id, ordem, titulo) values (c, 2, 'Aplicação e tempo') returning id into m;
    insert into public.aulas (modulo_id, ordem, titulo, tipo) values (m, 0, 'Aplicação e tempo: fundamentos', 'video');
    insert into public.aulas (modulo_id, ordem, titulo, tipo) values (m, 1, 'Aplicação e tempo: demonstração comentada', 'video');
    insert into public.aulas (modulo_id, ordem, titulo, tipo) values (m, 2, 'Prática guiada', 'video');
    insert into public.aulas (modulo_id, ordem, titulo, tipo) values (m, 3, 'Teste do módulo 3', 'teste');
    insert into public.modulos (curso_id, ordem, titulo) values (c, 3, 'Contraindicações') returning id into m;
    insert into public.aulas (modulo_id, ordem, titulo, tipo) values (m, 0, 'Contraindicações: fundamentos', 'video');
    insert into public.aulas (modulo_id, ordem, titulo, tipo) values (m, 1, 'Contraindicações: demonstração comentada', 'video');
    insert into public.aulas (modulo_id, ordem, titulo, tipo) values (m, 2, 'Prática guiada', 'video');
    insert into public.aulas (modulo_id, ordem, titulo, tipo) values (m, 3, 'Teste do módulo 4', 'teste');
    insert into public.modulos (curso_id, ordem, titulo) values (c, 4, 'Biossegurança') returning id into m;
    insert into public.aulas (modulo_id, ordem, titulo, tipo) values (m, 0, 'Biossegurança: fundamentos', 'video');
    insert into public.aulas (modulo_id, ordem, titulo, tipo) values (m, 1, 'Biossegurança: demonstração comentada', 'video');
    insert into public.aulas (modulo_id, ordem, titulo, tipo) values (m, 2, 'Prática guiada', 'video');
    insert into public.aulas (modulo_id, ordem, titulo, tipo) values (m, 3, 'Teste do módulo 5', 'teste');
  end if;
  if not exists (select 1 from public.cursos where slug = 'pes') then
    insert into public.cursos (slug, titulo, formacao, preco, resumo, para_quem, antes, depois, publicado)
    values ('pes', 'Pés e panturrilhas: liberação completa', 'Para terapeutas', 247, 'Liberação completa de pés e panturrilhas, com sequência pronta para atender.', 'Para terapeutas que atendem corredores, quem fica muito em pé e clientes com fascite.', '{30,25,20,35,40}', '{80,80,85,80,85}', false)
    returning id into c;
    insert into public.modulos (curso_id, ordem, titulo) values (c, 0, 'Anatomia do pé') returning id into m;
    insert into public.aulas (modulo_id, ordem, titulo, tipo) values (m, 0, 'Anatomia do pé: fundamentos', 'video');
    insert into public.aulas (modulo_id, ordem, titulo, tipo) values (m, 1, 'Anatomia do pé: demonstração comentada', 'video');
    insert into public.aulas (modulo_id, ordem, titulo, tipo) values (m, 2, 'Prática guiada', 'video');
    insert into public.aulas (modulo_id, ordem, titulo, tipo) values (m, 3, 'Teste do módulo 1', 'teste');
    insert into public.modulos (curso_id, ordem, titulo) values (c, 1, 'Pontos de tensão') returning id into m;
    insert into public.aulas (modulo_id, ordem, titulo, tipo) values (m, 0, 'Pontos de tensão: fundamentos', 'video');
    insert into public.aulas (modulo_id, ordem, titulo, tipo) values (m, 1, 'Pontos de tensão: demonstração comentada', 'video');
    insert into public.aulas (modulo_id, ordem, titulo, tipo) values (m, 2, 'Prática guiada', 'video');
    insert into public.aulas (modulo_id, ordem, titulo, tipo) values (m, 3, 'Teste do módulo 2', 'teste');
    insert into public.modulos (curso_id, ordem, titulo) values (c, 2, 'Sequência de liberação') returning id into m;
    insert into public.aulas (modulo_id, ordem, titulo, tipo) values (m, 0, 'Sequência de liberação: fundamentos', 'video');
    insert into public.aulas (modulo_id, ordem, titulo, tipo) values (m, 1, 'Sequência de liberação: demonstração comentada', 'video');
    insert into public.aulas (modulo_id, ordem, titulo, tipo) values (m, 2, 'Prática guiada', 'video');
    insert into public.aulas (modulo_id, ordem, titulo, tipo) values (m, 3, 'Teste do módulo 3', 'teste');
    insert into public.modulos (curso_id, ordem, titulo) values (c, 3, 'Pressão') returning id into m;
    insert into public.aulas (modulo_id, ordem, titulo, tipo) values (m, 0, 'Pressão: fundamentos', 'video');
    insert into public.aulas (modulo_id, ordem, titulo, tipo) values (m, 1, 'Pressão: demonstração comentada', 'video');
    insert into public.aulas (modulo_id, ordem, titulo, tipo) values (m, 2, 'Prática guiada', 'video');
    insert into public.aulas (modulo_id, ordem, titulo, tipo) values (m, 3, 'Teste do módulo 4', 'teste');
    insert into public.modulos (curso_id, ordem, titulo) values (c, 4, 'Atendimento') returning id into m;
    insert into public.aulas (modulo_id, ordem, titulo, tipo) values (m, 0, 'Atendimento: fundamentos', 'video');
    insert into public.aulas (modulo_id, ordem, titulo, tipo) values (m, 1, 'Atendimento: demonstração comentada', 'video');
    insert into public.aulas (modulo_id, ordem, titulo, tipo) values (m, 2, 'Prática guiada', 'video');
    insert into public.aulas (modulo_id, ordem, titulo, tipo) values (m, 3, 'Teste do módulo 5', 'teste');
  end if;
  if not exists (select 1 from public.pacotes where titulo = 'Autocuidado completo') then
    insert into public.pacotes (titulo, descricao, preco, ordem) values ('Autocuidado completo', 'Para soltar o corpo em casa: lombar, pescoço e mandíbula.', 167, 0) returning id into p;
    insert into public.pacote_cursos (pacote_id, curso_id) select p, id from public.cursos where slug in ('lombar', 'pescoco', 'bruxismo');
  end if;
  if not exists (select 1 from public.pacotes where titulo = 'Costas e postura') then
    insert into public.pacotes (titulo, descricao, preco, ordem) values ('Costas e postura', 'Para quem passa o dia sentado e sente lombar e ombros.', 127, 1) returning id into p;
    insert into public.pacote_cursos (pacote_id, curso_id) select p, id from public.cursos where slug in ('lombar', 'pescoco');
  end if;
  if not exists (select 1 from public.pacotes where titulo = 'Formação do terapeuta') then
    insert into public.pacotes (titulo, descricao, preco, ordem) values ('Formação do terapeuta', 'Recuperação muscular, ventosaterapia e pés para o atendimento.', 797, 2) returning id into p;
    insert into public.pacote_cursos (pacote_id, curso_id) select p, id from public.cursos where slug in ('recuperacao', 'ventosa', 'pes');
  end if;
end $$;
