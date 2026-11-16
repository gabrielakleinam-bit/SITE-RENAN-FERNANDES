# Como colocar a plataforma no ar

São 4 passos obrigatórios (Supabase, banco, Bunny, Vercel) e alguns opcionais. Leva cerca de 30 minutos.
Todos os nomes de variáveis estão em `.env.example`.

## 1. Supabase (banco de dados, login e arquivos) · grátis

1. Crie uma conta em supabase.com e um projeto novo (região **South America (São Paulo)**). Guarde a senha do banco.
2. Em **Project Settings → API**, copie:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role** (secreta) → `SUPABASE_SERVICE_ROLE_KEY`
3. Em **Authentication → URL Configuration**:
   - **Site URL**: o endereço do site na Vercel (ex.: `https://site-renan-fernandes.vercel.app`)
   - **Redirect URLs**: adicione `https://SEU-SITE.vercel.app/**` e, se for testar numa prévia, o endereço dela com `/**` no fim (aparece em Vercel → Deployments).
4. Em **Authentication → Emails → SMTP** (opcional, recomendado): o envio de e-mails do plano grátis é limitado a poucas mensagens por hora. Para produção, configure um SMTP (pode ser o mesmo Resend do passo 6).

## 2. Banco de dados · 2 minutos

No Supabase, abra **SQL Editor → New query**, cole e rode, nesta ordem:

1. `supabase/migrations/0001_inicial.sql`: cria as tabelas, as permissões e os espaços de arquivos. Já cadastra **matheustram@hotmail.com** como administrador.
2. `supabase/migrations/0002_exemplos.sql` (opcional): cria os 6 cursos e os 3 pacotes do protótipo como **rascunho**, com módulos e aulas, sem vídeos. É só enviar os vídeos pelo editor e publicar.

Depois, crie a conta do administrador no próprio site (**Entrar → Criar conta** com matheustram@hotmail.com). Ela entra direto no painel.
Para autorizar outro administrador: `insert into admins_autorizados (email) values ('outro@email.com');`

## 3. Bunny Stream (vídeos enviados do celular) · cerca de US$ 1 a 5 por mês

1. Crie uma conta em bunny.net e vá em **Stream → Add Video Library** (região: São Paulo / South America).
2. Na biblioteca, abra **API**:
   - **Video Library ID** → `BUNNY_LIBRARY_ID`
   - **API Key** → `BUNNY_API_KEY`
   - **CDN Hostname** (ex.: `vz-1234abcd-567.b-cdn.net`) → `BUNNY_CDN_HOST`
3. Proteção dos vídeos (recomendado): em **Security**, ative **Token Authentication** e copie a chave → `BUNNY_TOKEN_KEY`. Com ela, cada aluno recebe um link que vale 4 horas.
4. Em **Encoding**, deixe pelo menos 720p ligado.

Sem a Bunny, o editor continua aceitando **links do YouTube** (não listados).

## 4. Vercel

Em **Settings → Environment Variables**, cadastre as variáveis acima (marque Production, Preview e Development) e também:

- `NEXT_PUBLIC_SITE_URL` = o endereço do site (ex.: `https://site-renan-fernandes.vercel.app`)
- `PIX_CHAVE` = a chave Pix que recebe os pagamentos (CPF, CNPJ, e-mail, telefone ou aleatória)
- `PIX_NOME` e `PIX_CIDADE` = nome e cidade do recebedor, como no banco

Depois, em **Deployments**, clique nos três pontos do último deploy → **Redeploy**.

## Opcionais

5. **Sugestões com IA** (grátis): crie uma chave em aistudio.google.com → **Get API key** → `GEMINI_API_KEY`. Sem ela, o botão "Sugerir com IA" não aparece.
6. **Avisos por e-mail** (grátis até 3.000/mês): conta em resend.com, verifique um domínio e crie uma chave → `RESEND_API_KEY`; remetente em `EMAIL_REMETENTE` (ex.: `Renan Fernandes Cursos <cursos@seudominio.com.br>`).
7. **Login com Google**: no Google Cloud, crie credenciais OAuth (tipo "Web"), com a URL de retorno que o Supabase mostra em **Authentication → Providers → Google**; cole o Client ID e o Secret lá e ative.
8. **Duração do YouTube pelo servidor**: chave da YouTube Data API v3 → `YOUTUBE_API_KEY`. Sem ela, a duração é lida pelo player no navegador do admin.

## Como funciona a liberação manual (v1)

1. O aluno paga o Pix pelo QR Code (o valor já vem preenchido e o identificador começa com **RF**) e toca em "Já fiz o Pix".
2. O pedido aparece em **Painel → Acessos → Aguardando**.
3. Você confere o Pix no extrato e clica em **Liberar entrada**. O aluno recebe o aviso por e-mail (se o passo 6 estiver feito).

A confirmação automática por gateway (Asaas ou Mercado Pago) fica para uma próxima etapa: os pedidos já têm os campos `gateway` e `gateway_id`.
