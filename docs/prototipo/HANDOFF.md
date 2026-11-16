# Renan Fernandes Cursos: protótipo para o Claude Code

Este pacote é a especificação navegável da plataforma. O Claude Code deve usá-lo como referência de telas, textos e regras, não como base de produção: tudo aqui roda no navegador, sem servidor.

## Como abrir e alterar

- Ver: abra `dist/index.html` no navegador. Contas de teste (qualquer senha):
  - `admin@teste.com`: administração
  - `cliente@teste.com`: aluno com compra aguardando liberação
- Alterar: edite os arquivos em `src/` e rode `python3 build.py`. O build junta CSS, JS e imagens num arquivo único, `dist/index.html`. Não edite `dist/` à mão.

## Estrutura

```
src/
  index.html            marcação de todas as telas (aluno, admin, painéis)
  css/01-base.css       layout original: cores, tipografia, telas, player
  css/02-aluno.css      logo, carrossel, pacotes, menu da aula, player, diagnóstico, certificado
  css/03-admin.css      painel do administrador e editor
  js/01-dados.js        dados de exemplo e estado da sessão (vira o banco de dados)
  js/02-util.js         utilidades: duração, capas, ícones, gráfico de teia
  js/03-app.js          navegação, papéis, login, início, curso, compra
  js/04-aula.js         menu do módulo, player (arquivo, YouTube, simulado), presença
  js/05-teia.js         diagnóstico com recomendação e evolução
  js/06-duvidas.js      dúvidas do aluno
  js/07-certificado.js  modelo do certificado e visualização do aluno
  js/08-admin.js        Visão, Alunos, Acessos, Certificados, Dúvidas, Cursos e editor
  js/09-init.js         inicialização
  assets/               logo (original, colorida, clara), ilustração, foto do Renan
build.py                gera dist/index.html
```

## Telas

| Tela | Onde | O que faz |
|---|---|---|
| Início | `s-inicio`, 03-app | Hero, carrossel (cursos + diagnóstico), catálogo, pacotes, "Quem ensina" com WhatsApp, Instagram e TikTok |
| Curso | `s-curso`, 03-app | Capa, resumo, para quem é, instruções, módulos, compra, certificado |
| Aula | `s-aula`, 04-aula | Menu lateral, player com controles próprios, presença de 90%, dúvidas |
| Teia | `s-teia`, 05-teia | Diagnóstico de 6 perguntas, recomendação, pacote, evolução |
| Dúvidas | `s-duvidas`, 06-duvidas | Conversas do aluno com o professor |
| Admin Visão | `s-adm-visao`, 08-admin | Pendências, indicadores, onde está cada aluno, por curso, dúvidas frequentes |
| Admin Alunos | `s-adm-alunos` | Busca, cursos, progresso, posição, último acesso |
| Admin Acessos | `s-adm-acessos` | Liberar ou negar entrada depois de conferir o pagamento |
| Admin Certificados | `s-adm-certificados` | Modelo do certificado (upload e posição dos campos) e fila de aprovação |
| Admin Dúvidas | `s-adm-perguntas` | Por curso, ranking de temas, resposta |
| Admin Cursos | `s-adm-cursos`, `s-adm-editor` | Cards, "Ver como aluno", excluir, pacotes, editor em 3 etapas |

## Regras de negócio (manter no produto)

1. **Acesso pago com liberação manual**: pagar cria um pedido "aguardando". A aula só abre depois que o admin clica em "Liberar entrada". Um pedido de pacote libera todos os cursos do pacote.
2. **Amostra grátis**: a primeira aula de cada curso abre sem compra.
3. **Presença**: o vídeo é dividido em blocos de 5 s. Um bloco só conta se foi assistido em sequência (pulos não contam). A aula fica concluída com 90% dos blocos. Vale para vídeo enviado e YouTube.
4. **Duração**: nunca é digitada. Duração do curso = soma dos vídeos + 4 min por aula de texto. Ela aparece no catálogo, no carrossel, nos pacotes, no diagnóstico e no certificado.
5. **YouTube sem sair do site**: o iframe roda sem controles nativos (`controls=0`), com `pointer-events:none` e coberto por uma camada da plataforma. Os controles são da plataforma e enviam comandos pela IFrame API. Uma tela de "fim da aula" cobre as sugestões finais do YouTube. Logo, título e "assistir no YouTube" ficam visíveis, mas não são clicáveis.
6. **Certificado**: o aluno pede ao concluir 100%. O admin aprova ou nega. Na aprovação são gerados o código de validação e a data. O certificado leva o nome do aluno, o curso, as horas cumpridas, a data e o código, sobre o modelo enviado pelo admin.
7. **Diagnóstico**: as regras de pontuação estão em `scoreDiag()` (05-teia). O resultado é o top 3 de cursos, cada um com o motivo, mais o pacote com maior sobreposição.
8. **Papéis**: o admin só vê telas `adm-*`, exceto em "Ver como aluno". No produto, o papel vem do banco (e-mails autorizados), não de um e-mail fixo no código.

## Modelo de dados sugerido (a partir de 01-dados.js)

- `usuarios` (id, nome, email, papel: aluno|admin, criado_em, consentimento_lgpd_em)
- `cursos` (id, titulo, formacao, professor, preco, capa_url, resumo, para_quem, instrucoes, publicado, arquivado)
- `modulos` (id, curso_id, ordem, titulo): cada módulo é um eixo da teia
- `aulas` (id, modulo_id, ordem, titulo, tipo: video|texto|material|teste, duracao_seg, video_fonte: upload|youtube, video_ref, texto, material_url)
- `pacotes` (id, titulo, descricao, preco, ativo) e `pacote_cursos` (pacote_id, curso_id)
- `pedidos` (id, usuario_id, valor, metodo, pacote_id null, status: aguardando|liberado|negado, decidido_por, decidido_em)
- `pedido_cursos` (pedido_id, curso_id)
- `matriculas` (usuario_id, curso_id, status: aguardando|ativo, liberada_em)
- `progresso_aula` (usuario_id, aula_id, blocos_assistidos bitset, concluida_em, ultima_posicao)
- `duvidas` (id, curso_id, aula_id, tema, titulo, status, privada) e `mensagens` (duvida_id, autor_id, texto, criada_em)
- `certificados` (id, usuario_id, curso_id, status: pendente|aprovado|negado, codigo, horas_seg, emitido_em, pdf_url)
- `modelo_certificado` (imagem_url, cor, posicoes jsonb)
- `diagnosticos` (usuario_id, respostas jsonb, eixos jsonb, recomendados jsonb, criado_em)
- `auditoria` (quem, acao, alvo, quando)

## O que é simulado aqui e como fica no produto

| No protótipo | No produto |
|---|---|
| Dados em memória (somem ao recarregar) | Banco (ex.: Supabase/Postgres) com RLS |
| Login sem senha real | Autenticação com e-mail e senha + Google, recuperação de senha |
| Pix e cartão simulados | Gateway (Pix, cartão, boleto). Liberação manual na v1 |
| Vídeo enviado fica no navegador (blob) | Upload retomável do celular → storage privado → HLS com URL assinada |
| Duração do YouTube lida pelo player | YouTube Data API v3 (`contentDetails.duration`) no servidor |
| "Sugerir com IA" com texto modelo | Rota no servidor chamando IA gratuita (Gemini API ou Groq). Chave só no servidor, limite de uso |
| Certificado desenhado em HTML | PDF gerado no servidor (ex.: pdf-lib) com o mesmo layout e posições; página pública de validação por código |
| Player simulado nos cursos de exemplo | Removido; só vídeos reais |

## Pontos de atenção

- **YouTube no iPhone**: o Safari pode exigir o primeiro toque dentro do próprio player. Teste em aparelho real; se precisar, deixe a primeira reprodução sem a camada (só no primeiro toque) ou comece sem som.
- **Termos do YouTube**: não esconda o logo nem a marca do player. A camada só impede cliques. Para controle total sem marca, hospede o vídeo (upload próprio).
- **Pré-visualização no Claude**: o ambiente de artifact bloqueia sites externos, então o YouTube mostra um aviso e o botão "Simular a aula aqui". Fora dele (arquivo local servido por http ou site publicado), o vídeo carrega embutido.
- `confirm()`, `alert()` e downloads ficam bloqueados na pré-visualização do Claude. Por isso a exclusão usa confirmação na própria tela e "Baixar PDF" só mostra um aviso.
