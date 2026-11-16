# Renan Fernandes Cursos

Plataforma de cursos de massoterapia do Renan Fernandes. Next.js (App Router) + TypeScript.
O protótipo navegável que serve de especificação está em `docs/prototipo/` (leia `HANDOFF.md` e `PROMPT_CLAUDE_CODE.md`).

## Rodar

```bash
npm install
npm run dev        # http://localhost:3000
npm test           # regras de presença, duração e pacotes
npm run build
```

Hospedagem: Vercel (plano Hobby por enquanto). Importe o repositório na Vercel; não há variáveis de ambiente no M1.

## Estrutura

```
src/app/                   rotas
  page.tsx                 início: hero, carrossel, catálogo, pacotes, como funciona, quem ensina
  cursos/[slug]/           página do curso
  cursos/[slug]/aula/      aula com menu lateral (/cursos/lombar/aula/m1-a2)
  diagnostico/, duvidas/   entram no M5
  globals.css              estilos portados do protótipo
src/components/            App (sessão e avisos), Shell (topo, navegação, login), Inicio, Curso, SalaDeAula, Player
src/lib/
  tipos.ts                 tipos do domínio
  dados.ts                 dados de exemplo (somem no M2)
  catalogo.ts              acesso aos dados: as páginas só usam estas funções
  duracao.ts               regra única de duração (vídeos + 4 min por texto)
  presenca.ts              presença por blocos de 5 s, conclui com 90%
  capa.ts, teia.ts         capas ilustradas e gráfico de teia (SVG)
```

## Marcos

- [x] **M1** layout do aluno com dados de exemplo (início, curso, aula com menu lateral e presença)
- [ ] **M2** Supabase (login, perfis) e editor de treinamento
- [ ] **M3** streaming, presença no servidor, matrícula, pedidos e liberação de entrada
- [ ] **M4** painel Visão e Alunos
- [ ] **M5** diagnóstico, dúvidas e certificados

### Contas de demonstração (M1, qualquer senha)

- `cliente@teste.com`: compra aguardando liberação (lombar)
- `ana@exemplo.com.br`: aluna com o curso de lombar
- `admin@teste.com`: administração (painel nos próximos marcos)
