# Prompt para o Claude Code: plataforma de cursos Renan Fernandes Massoterapia

Quero transformar o protótipo anexado numa plataforma de cursos de verdade. O pacote tem:
- `dist/index.html`: protótipo navegável (abra no navegador).
- `src/`: código organizado por tela (CSS e JS separados) e `build.py`.
- `HANDOFF.md`: mapa das telas, regras de negócio, modelo de dados sugerido e o que é simulado. **Leia primeiro.**

O protótipo é a referência de layout e de comportamento: mantenha o visual dele e use as telas como especificação. Não reaproveite o código de estado em memória; reimplemente com backend.

## 1. Identidade visual (não negociável)

- Mantenha o layout do protótipo: barra superior escura, navegação lateral no desktop e inferior no celular, cards brancos sobre fundo cinza-claro, cantos arredondados, pouca decoração.
- Cores: fundo escuro `#13171C`, azul `#4FA3F0`, cinza-claro `#F1F3F6`, texto `#12161B`, secundário `#5C6670`. Laranja `#E9A25F` só para o "antes" na teia.
- Fontes: Bricolage Grotesque (títulos) e Atkinson Hyperlegible (texto).
- Logotipo "Renan Fernandes Massoterapia" no canto superior esquerdo (versão clara sobre o fundo escuro), no rodapé, na tela de carregamento e no certificado. O arquivo original do logo está anexo.
- Foto e nome do Renan como responsável: bloco "Quem ensina", página do curso e respostas do professor.
- Tom sóbrio e profissional: sem emojis, sem animações lúdicas.
- Carregamento: tela inicial com o logo e uma barra fina azul. Ao abrir uma aula, barra azul no topo do vídeo.
- Redes do Renan **uma única vez**, no bloco "Quem ensina" (o rodapé tem só o logo e o aviso legal):
  - WhatsApp: +55 11 95051-7467 (`https://wa.me/5511950517467`), também no botão "Agendar pelo WhatsApp"
  - Instagram: `https://www.instagram.com/renanfernandes_massoterapeuta`
  - TikTok: `https://www.tiktok.com/@renan_fernandes30`

## 2. Perfis

- **Aluno**: cadastro, login (e-mail e senha, e Google), recuperação de senha.
- **Administrador**: login com e-mail e senha. O acesso administrativo é definido por e-mail autorizado no banco de dados, não no código.
- Contas de teste do protótipo: `admin@teste.com` (administração) e `cliente@teste.com` (aluno com uma compra aguardando liberação).

## 3. Área do aluno

- **Início**:
  - **Carrossel de destaques**: um slide por curso, com imagem de capa grande, resumo, número de aulas, duração total, preço e, se matriculado, o progresso e o botão "Continuar o curso". O segundo slide é sempre o **diagnóstico gratuito** ("Não sabe por onde começar?"). Troca automática a cada 7 segundos, pausa ao passar o mouse ou focar, setas, bolinhas e gesto de arrastar no celular.
  - **Catálogo** com filtro por formação ("Para você", "Para terapeutas"). Cada curso mostra capa, aulas e duração.
  - **Pacotes com desconto**: cards com as capas dos cursos, a lista de cursos, o preço cheio riscado, o preço do pacote, o % de desconto e a duração somada. Pacotes iniciais (o administrador pode editar):
    - Autocuidado completo: lombar + pescoço e ombros + bruxismo, R$ 167 (cheio R$ 221)
    - Costas e postura: lombar + pescoço e ombros, R$ 127 (cheio R$ 154)
    - Formação do terapeuta: recuperação muscular + ventosaterapia + pés e panturrilhas, R$ 797 (cheio R$ 1.041)
  - Blocos "Como funciona" e "Quem ensina".
- **Curso**: capa, resumo, "Para quem é", instruções, módulos e aulas, competências. O quadro de compra mostra preço, "Comprar curso" e "Assistir aula de amostra" (a primeira aula é gratuita). Se o pagamento estiver aguardando liberação, mostra esse aviso no lugar.
- **Aula**: **menu lateral à esquerda** com o curso, a duração total, os módulos e as aulas (concluída, bloqueada, duração). Clicar numa aula troca o conteúdo sem sair da tela.
  - Vídeo enviado: player próprio com streaming.
  - Vídeo do YouTube: **o aluno nunca sai do site**. Embed `youtube-nocookie.com` com `controls=0`, `disablekb=1`, `fs=0`, `rel=0`, `iv_load_policy=3`, `playsinline=1`. O iframe fica com `pointer-events:none` sob uma camada da plataforma que recebe os cliques. Play, pausa, barra, velocidade e tela cheia são os controles da plataforma, que comandam o player pela IFrame API. No fim do vídeo, a tela "Aula concluída / Próxima aula" cobre as sugestões do YouTube. Nenhum link leva ao YouTube. Teste no iPhone (primeiro toque) e não esconda a marca do YouTube.
  - Texto: leitura com botão "Concluí a leitura". Material: botão para abrir o arquivo.
  - **Presença**: a aula só conta como concluída depois de 90% do trecho assistido. Pular trechos não conta. Isso vale para o player próprio e para o YouTube (pela posição informada pela IFrame API).
- **Diagnóstico (Teia)**:
  - Perguntas, uma por tela, com barra de progresso e botão "Voltar":
    1. Você quer aprender para… (cuidar de mim / atender clientes)
    2. Onde sente mais tensão ou dor? (várias: lombar, pescoço e ombros, mandíbula, pés e panturrilhas, músculos depois do treino, nenhum)
    3. Com que frequência? (raramente / algumas vezes por semana / quase todo dia)
    4. Como é sua rotina? (sentado / em pé / treino / variada)
    5. Quanto conhece do próprio corpo? (pouco / básico / bastante)
    6. Só para terapeutas: o que quer acrescentar ao atendimento? (várias: recuperação muscular, ventosa, pés, orientar autocuidado)
  - **Resultado**: teia com 6 eixos (conhecimento do corpo, autocuidado, postura, alívio de tensão, prevenção, técnica manual) e os **3 treinamentos mais indicados**, cada um com o motivo ("Porque você marcou a lombar e passa muitas horas sentado"). Abaixo, o **pacote** que reúne a maior parte deles.
  - Regras de pontuação: implemente as do protótipo (função `scoreDiag`) e deixe os pesos configuráveis pelo administrador numa etapa futura.
  - Para quem já tem curso, abaixo do diagnóstico fica a teia de evolução (entrada × saída).
- **Dúvidas**: conversas com o professor por aula.
- **Certificado**: após a conclusão. Estados: "Solicitar", "Em análise", "Emitido" (ver o certificado e baixar o PDF) e "Não emitido". O certificado mostra o nome do aluno, o curso, as **horas cumpridas** (duração calculada do curso), a data e o código de validação, sobre o modelo definido pelo admin.

## 4. Área do administrador

Menu: **Visão**, **Alunos**, **Acessos**, **Certificados**, **Dúvidas**, **Cursos**. O visual segue o protótipo: cards brancos com sombra suave, avatares com iniciais, etiquetas coloridas por status e barras de progresso.

- **Visão**: saudação, três cartões de pendências clicáveis (pagamentos para liberar, certificados para aprovar, dúvidas sem resposta), indicadores (alunos, progresso médio, treinamentos e aulas publicados, vendas confirmadas), a lista "Onde estão os alunos agora" (aluno, curso, módulo e aula, progresso, último acesso), o resumo "Por treinamento" e "Dúvidas mais frequentes".
- **Alunos**: busca. Para cada aluno: cursos com progresso, posição atual e último acesso.
- **Acessos**: abas Aguardando, Liberados e Negados. Cada pedido mostra aluno, curso ou pacote, valor, forma de pagamento e data. Ações "Liberar entrada" e "Negar". Um pedido de pacote libera todos os cursos do pacote. Toda decisão vai para o log de auditoria (quem, quando).
- **Certificados**:
  - **Modelo do certificado**: o admin envia a arte (imagem A4 deitada, PNG ou JPG) ou usa o modelo padrão da marca (moldura, logo, "Certificado de conclusão de curso livre", assinatura do Renan). Ajusta a posição vertical de cada campo (nome, curso, horas cumpridas, data e código) e a cor do texto, com prévia ao vivo.
  - **Fila**: cada pedido mostra o certificado já montado com o nome do aluno. Ações "Aprovar emissão" e "Negar". Ao aprovar, o servidor gera o PDF com o mesmo layout (por exemplo, com pdf-lib) e um código de validação com página pública de consulta.
- **Dúvidas**: filtro por curso, ranking de temas, conversa em balões, resposta (o aluno recebe e-mail) e "Marcar como resolvida".
- **Cursos**: grade de cards com capa, formação, módulos, aulas, duração, preço e alunos ativos. Ações "Editar", "Ver como aluno" (pré-visualização com todas as aulas abertas e uma barra "Voltar ao painel") e "Excluir" (confirmação na própria tela; curso com alunos ativos é arquivado, não excluído). Abaixo, os **pacotes** (criar, editar, desativar).

### 4.1 Editor de treinamento (fluxo em 3 etapas)

Etapas no topo e, à direita, a **prévia ao vivo** do card como o aluno verá, com a lista do que falta para publicar.

1. **Sobre o curso**: nome, formação (botões "Para você" e "Para terapeutas"), preço, professor e capa (enviar imagem; sem imagem, usa a ilustração da marca). Três textos com o botão **"Sugerir com IA"**: **Resumo**, **Para quem é o curso** e **Instruções para o aluno**.
   - **IA gratuita**: o botão chama um modelo gratuito pelo servidor (Gemini API no plano gratuito, ou Llama pelo plano gratuito do Groq). A chave fica no servidor, nunca no navegador. O prompt usa o nome, a formação e os módulos do curso e pede texto em pt-BR, sóbrio, sem promessas de cura. A sugestão preenche o campo para o administrador revisar. Com limite de uso e mensagem clara se a cota acabar.
   - **Não há campo de horas nem de cidade.**
2. **Módulos e aulas**: cada módulo é um card numerado com nome, contador de aulas, setas para reordenar e excluir. Cada módulo vira um eixo da teia, com no mínimo 3. Em cada módulo, botões para adicionar aula do tipo **Vídeo**, **Texto**, **Material** ou **Teste**. Aula de vídeo:
   - **"Enviar vídeo do celular"** (galeria ou câmera; MP4 e MOV) **ou** "colar o link do YouTube".
   - **Duração lida automaticamente**: no arquivo, pelos metadados no envio e confirmada pelo ffprobe na conversão; no YouTube, pela YouTube Data API v3 (`contentDetails.duration`). O administrador não digita duração.
   - Upload retomável (em partes, continua se a conexão cair), com barra de progresso e status "enviando", "processando" e "pronto". Conversão para streaming adaptativo (HLS, pelo menos 720p). O aluno assiste com URL assinada de validade curta e nunca baixa o arquivo original. É possível trocar o vídeo sem perder a ordem nem o progresso dos alunos.
3. **Revisar e publicar**: totais (módulos, aulas, vídeos, **duração total somada dos vídeos**), checklist e aviso de vídeos sem arquivo. O botão "Publicar no catálogo" fica bloqueado até a checklist fechar. Ao publicar, o curso entra no catálogo e no carrossel.

## 5. Duração exibida no site

A duração de cada curso e de cada pacote é sempre calculada: soma dos vídeos, mais 4 minutos por aula de texto. Ela aparece no carrossel, no catálogo, na página do curso, no menu da aula, nos pacotes, no diagnóstico e no certificado.

## 6. Requisitos técnicos

- Backend real para contas, cursos, módulos, aulas, matrículas, progresso, perguntas, pedidos, pacotes, certificados, arquivos e log de auditoria. O protótipo guarda tudo no navegador e isso não serve para produção.
- Sugestão de stack (justifique a escolha): Next.js + Supabase (autenticação, Postgres, storage) e um serviço de vídeo com HLS e URLs assinadas (por exemplo, Mux, Cloudflare Stream ou Bunny Stream). Compare custo por minuto armazenado e assistido.
- Permissões no servidor (RLS ou equivalente): o aluno só recebe a aula com matrícula liberada. Só administradores acessam a área administrativa.
- Pagamentos: Pix, cartão e boleto, com conferência manual pelo administrador nesta primeira versão. Deixe o caminho pronto para a confirmação automática pelo gateway depois.
- LGPD: consentimento no cadastro, política de privacidade, dados mínimos, exportação e exclusão dos dados do aluno.
- Aviso de conteúdo educativo em cada curso de saúde.
- Interface e código em português (pt-BR). Responsivo, com o celular como prioridade.

## 7. Como quero o trabalho

1. Antes de codar, apresente: a stack com justificativa, o modelo de dados, o mapa de telas e o plano em marcos.
2. Espere meu ok.
3. Marcos com resultado visível:
   - **M1**: layout do aluno (início com carrossel, catálogo e pacotes; curso; aula com menu lateral) com dados de exemplo.
   - **M2**: login, perfis e o editor de treinamento (3 etapas, upload do celular, link do YouTube, duração automática, sugestão com IA).
   - **M3**: streaming com presença de 90%, matrícula, pedidos (curso e pacote), aba Acessos e liberação de entrada.
   - **M4**: Visão e Alunos (indicadores, posição de cada aluno, progresso).
   - **M5**: diagnóstico com recomendação, Dúvidas e Certificados (PDF com código).
4. Ao fim de cada marco: rode a aplicação, mostre o que funciona e liste o que ficou de fora e o que depende de mim.

Comece pelo plano, sem código.
