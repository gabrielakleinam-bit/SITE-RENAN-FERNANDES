# Renan Fernandes Cursos

Plataforma de cursos de massoterapia do Renan Fernandes. Next.js (App Router) + TypeScript + Supabase + Bunny Stream.
O protótipo navegável que serve de especificação está em `docs/prototipo/`.

**Para colocar no ar, siga [docs/CONFIGURACAO.md](docs/CONFIGURACAO.md).**

## Rodar

```bash
npm install
cp .env.example .env.local   # preencha as chaves
npm run dev                  # http://localhost:3000
npm test                     # presença, duração, Pix, diagnóstico
npm run build
```

Sem as variáveis do Supabase o site abre, mostra um aviso de configuração e o catálogo fica vazio.

## O que tem

**Aluno**: início (carrossel, catálogo, pacotes), página do curso, compra por Pix com conferência manual, aula com menu lateral,
player próprio (vídeo enviado em HLS com link assinado, ou YouTube sem sair do site), presença de 90% registrada no servidor,
testes por módulo, diagnóstico com recomendação, dúvidas com o professor, certificado com PDF e validação pública,
conta com exportação e exclusão de dados (LGPD).

**Administrador** (`/admin`): Visão, Alunos, Acessos (liberar entrada), Certificados (fila e modelo), Dúvidas e Cursos,
com o editor em 3 etapas: upload de vídeo direto do celular (retomável), link do YouTube, duração automática,
sugestão de texto com IA e checklist para publicar. Pacotes com desconto.

## Estrutura

```
supabase/migrations/       esquema do banco (rodar no SQL Editor)
src/app/                   páginas e rotas de API
  admin/                   painel (protegido no servidor)
  api/admin/videos/        envio para a Bunny (assinatura TUS, conclusão, status)
  api/progresso/           presença na aula
  api/certificados/        PDF
src/components/            telas (Editor e EnvioVideo em components/admin)
src/lib/
  catalogo.ts              leitura do catálogo (o conteúdo das aulas só sai após conferir o acesso)
  sessao.ts, aluno.ts      usuário logado, papel (vem do banco) e regra de acesso
  bunny.ts                 Bunny Stream (criar vídeo, assinar envio, link assinado HLS)
  presenca*.ts             regra de presença (navegador e servidor)
  duracao.ts               duração = soma dos vídeos + 4 min por aula de texto
  pix.ts                   Pix copia e cola (BR Code)
  diagnostico.ts           perguntas e pontuação
  pdf-certificado.ts       PDF do certificado
```

## Regras de negócio

1. Pagar cria um pedido "aguardando"; a aula só abre depois de "Liberar entrada". Pacote libera todos os cursos dele.
2. A primeira aula de cada curso é grátis.
3. Presença: blocos de 5 s assistidos em sequência; conclui com 90%. O servidor recusa saltos e avanço acima de 2x.
4. Duração nunca é digitada: vem da Bunny ou do YouTube.
5. Certificado: o aluno pede com 100%; o admin aprova e o código de validação é gerado.
6. Papel de admin vem da tabela `admins_autorizados`.
