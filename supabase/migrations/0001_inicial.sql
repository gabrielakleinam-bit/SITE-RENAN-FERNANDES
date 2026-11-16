-- =====================================================================
-- Renan Fernandes Cursos · esquema inicial
-- Rode uma vez no Supabase: SQL Editor > New query > colar > Run.
-- Pode ser rodado de novo sem perder dados (usa "if not exists").
-- =====================================================================

create extension if not exists pgcrypto;

-- ---------- perfis e papéis ----------
create table if not exists public.admins_autorizados (
  email text primary key check (email = lower(email))
);
insert into public.admins_autorizados (email) values ('matheustram@hotmail.com') on conflict do nothing;

create table if not exists public.perfis (
  id uuid primary key references auth.users (id) on delete cascade,
  nome text not null default '',
  email text not null,
  papel text not null default 'aluno' check (papel in ('aluno', 'admin')),
  consentimento_lgpd_em timestamptz,
  ultimo_acesso timestamptz,
  criado_em timestamptz not null default now()
);

create or replace function public.eh_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.perfis where id = auth.uid() and papel = 'admin');
$$;

-- Cria o perfil quando alguém se cadastra. O papel de admin vem da tabela admins_autorizados.
create or replace function public.novo_usuario() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.perfis (id, nome, email, papel, consentimento_lgpd_em)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'nome', new.raw_user_meta_data ->> 'full_name', split_part(new.email, '@', 1)),
    lower(new.email),
    case when exists (select 1 from public.admins_autorizados a where a.email = lower(new.email)) then 'admin' else 'aluno' end,
    case when (new.raw_user_meta_data ->> 'consentimento') = 'true' then now() end
  )
  on conflict (id) do nothing;
  return new;
end $$;

drop trigger if exists ao_criar_usuario on auth.users;
create trigger ao_criar_usuario after insert on auth.users
  for each row execute function public.novo_usuario();

-- Se um e-mail for autorizado depois do cadastro, promove o perfil.
create or replace function public.sincronizar_admins() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  update public.perfis set papel = 'admin' where email = new.email;
  return new;
end $$;
drop trigger if exists ao_autorizar_admin on public.admins_autorizados;
create trigger ao_autorizar_admin after insert on public.admins_autorizados
  for each row execute function public.sincronizar_admins();

-- ---------- catálogo ----------
create table if not exists public.cursos (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  titulo text not null,
  formacao text not null default 'Para você' check (formacao in ('Para você', 'Para terapeutas')),
  professor text not null default 'Renan Fernandes',
  preco numeric(10, 2) not null default 0,
  capa_url text,
  resumo text not null default '',
  para_quem text not null default '',
  instrucoes text not null default '',
  antes int[] not null default '{}',
  depois int[] not null default '{}',
  publicado boolean not null default false,
  arquivado boolean not null default false,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

create table if not exists public.modulos (
  id uuid primary key default gen_random_uuid(),
  curso_id uuid not null references public.cursos (id) on delete cascade,
  ordem int not null default 0,
  titulo text not null default ''
);
create index if not exists modulos_curso on public.modulos (curso_id, ordem);

create table if not exists public.aulas (
  id uuid primary key default gen_random_uuid(),
  modulo_id uuid not null references public.modulos (id) on delete cascade,
  ordem int not null default 0,
  titulo text not null default '',
  tipo text not null default 'video' check (tipo in ('video', 'texto', 'material', 'teste')),
  duracao_seg int,                 -- lida do vídeo (Bunny) ou do YouTube; nunca digitada
  video_fonte text check (video_fonte in ('bunny', 'youtube')),
  video_ref text,                  -- id do vídeo na Bunny ou link do YouTube
  video_status text check (video_status in ('enviando', 'processando', 'pronto', 'erro')),
  texto text,
  material_path text,              -- caminho no bucket "materiais"
  questoes jsonb                   -- teste: [{pergunta, opcoes[], correta}]
);
create index if not exists aulas_modulo on public.aulas (modulo_id, ordem);

create table if not exists public.pacotes (
  id uuid primary key default gen_random_uuid(),
  titulo text not null,
  descricao text not null default '',
  preco numeric(10, 2) not null,
  ativo boolean not null default true,
  ordem int not null default 0
);
create table if not exists public.pacote_cursos (
  pacote_id uuid not null references public.pacotes (id) on delete cascade,
  curso_id uuid not null references public.cursos (id) on delete cascade,
  primary key (pacote_id, curso_id)
);

-- ---------- vendas e acesso ----------
create table if not exists public.pedidos (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid not null references auth.users (id) on delete cascade,
  valor numeric(10, 2) not null,
  metodo text not null default 'pix',
  pacote_id uuid references public.pacotes (id) on delete set null,
  descricao text not null default '',
  status text not null default 'aguardando' check (status in ('aguardando', 'liberado', 'negado')),
  gateway text,                    -- preenchido quando houver confirmação automática
  gateway_id text,
  criado_em timestamptz not null default now(),
  decidido_por uuid references auth.users (id),
  decidido_em timestamptz
);
create table if not exists public.pedido_cursos (
  pedido_id uuid not null references public.pedidos (id) on delete cascade,
  curso_id uuid not null references public.cursos (id) on delete cascade,
  primary key (pedido_id, curso_id)
);
create table if not exists public.matriculas (
  usuario_id uuid not null references auth.users (id) on delete cascade,
  curso_id uuid not null references public.cursos (id) on delete cascade,
  status text not null default 'aguardando' check (status in ('aguardando', 'ativo')),
  liberada_em timestamptz,
  criado_em timestamptz not null default now(),
  primary key (usuario_id, curso_id)
);

create table if not exists public.progresso_aula (
  usuario_id uuid not null references auth.users (id) on delete cascade,
  aula_id uuid not null references public.aulas (id) on delete cascade,
  blocos text not null default '',          -- "0110..." um caractere por bloco de 5 s
  ultima_posicao numeric not null default 0,
  concluida_em timestamptz,
  atualizado_em timestamptz not null default now(),
  primary key (usuario_id, aula_id)
);

-- ---------- dúvidas ----------
create table if not exists public.duvidas (
  id bigint generated always as identity primary key,
  usuario_id uuid not null references auth.users (id) on delete cascade,
  curso_id uuid not null references public.cursos (id) on delete cascade,
  aula_id uuid references public.aulas (id) on delete set null,
  tema text not null default 'Geral',
  titulo text not null,
  status text not null default 'aberta' check (status in ('aberta', 'respondida', 'resolvida')),
  criada_em timestamptz not null default now(),
  atualizada_em timestamptz not null default now()
);
create table if not exists public.mensagens (
  id bigint generated always as identity primary key,
  duvida_id bigint not null references public.duvidas (id) on delete cascade,
  autor_id uuid references auth.users (id) on delete set null,
  professor boolean not null default false,
  texto text not null,
  criada_em timestamptz not null default now()
);

-- ---------- certificados ----------
create table if not exists public.certificados (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid not null references auth.users (id) on delete cascade,
  curso_id uuid not null references public.cursos (id) on delete cascade,
  status text not null default 'pendente' check (status in ('pendente', 'aprovado', 'negado')),
  codigo text unique,
  nome_aluno text not null,
  titulo_curso text not null,
  horas_seg int not null default 0,
  emitido_em timestamptz,
  decidido_por uuid references auth.users (id),
  criado_em timestamptz not null default now(),
  unique (usuario_id, curso_id)
);
create table if not exists public.modelo_certificado (
  id int primary key default 1 check (id = 1),
  imagem_url text,
  cor text not null default '#12161B',
  nome_y numeric not null default 47,
  curso_y numeric not null default 58,
  horas_y numeric not null default 65,
  rodape_y numeric not null default 93
);
insert into public.modelo_certificado (id) values (1) on conflict do nothing;

-- ---------- diagnóstico e auditoria ----------
create table if not exists public.diagnosticos (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid references auth.users (id) on delete cascade,
  respostas jsonb not null,
  eixos jsonb not null,
  recomendados jsonb not null,
  criado_em timestamptz not null default now()
);
create table if not exists public.auditoria (
  id bigint generated always as identity primary key,
  quem uuid references auth.users (id) on delete set null,
  acao text not null,
  alvo text not null default '',
  detalhes jsonb,
  quando timestamptz not null default now()
);

-- ---------- liberação de entrada (transação única) ----------
-- Libera ou nega um pedido; ao liberar, ativa a matrícula de cada curso do pedido.
create or replace function public.decidir_pedido(p_pedido uuid, p_liberar boolean, p_admin uuid)
returns void language plpgsql security definer set search_path = public as $$
declare v_usuario uuid;
begin
  update public.pedidos
     set status = case when p_liberar then 'liberado' else 'negado' end,
         decidido_por = p_admin, decidido_em = now()
   where id = p_pedido and status = 'aguardando'
  returning usuario_id into v_usuario;
  if v_usuario is null then raise exception 'pedido não está aguardando'; end if;

  if p_liberar then
    insert into public.matriculas (usuario_id, curso_id, status, liberada_em)
    select v_usuario, pc.curso_id, 'ativo', now() from public.pedido_cursos pc where pc.pedido_id = p_pedido
    on conflict (usuario_id, curso_id) do update set status = 'ativo', liberada_em = now();
  else
    delete from public.matriculas m
     using public.pedido_cursos pc
     where pc.pedido_id = p_pedido and m.curso_id = pc.curso_id and m.usuario_id = v_usuario and m.status = 'aguardando';
  end if;

  insert into public.auditoria (quem, acao, alvo, detalhes)
  values (p_admin, case when p_liberar then 'liberar_pedido' else 'negar_pedido' end, p_pedido::text, null);
end $$;
revoke all on function public.decidir_pedido(uuid, boolean, uuid) from public, anon, authenticated;

-- ---------- segurança (RLS) ----------
-- O servidor do site usa a chave de serviço e confere permissões no código.
-- As políticas abaixo valem para qualquer acesso direto com a chave pública.
alter table public.admins_autorizados enable row level security;
alter table public.perfis enable row level security;
alter table public.cursos enable row level security;
alter table public.modulos enable row level security;
alter table public.aulas enable row level security;
alter table public.pacotes enable row level security;
alter table public.pacote_cursos enable row level security;
alter table public.pedidos enable row level security;
alter table public.pedido_cursos enable row level security;
alter table public.matriculas enable row level security;
alter table public.progresso_aula enable row level security;
alter table public.duvidas enable row level security;
alter table public.mensagens enable row level security;
alter table public.certificados enable row level security;
alter table public.modelo_certificado enable row level security;
alter table public.diagnosticos enable row level security;
alter table public.auditoria enable row level security;

do $$ begin
  -- perfis: cada um vê o seu; admin vê todos
  drop policy if exists perfil_proprio on public.perfis;
  create policy perfil_proprio on public.perfis for select using (id = auth.uid() or public.eh_admin());

  -- catálogo publicado é público; admin vê tudo
  drop policy if exists cursos_publicos on public.cursos;
  create policy cursos_publicos on public.cursos for select using ((publicado and not arquivado) or public.eh_admin());
  drop policy if exists modulos_publicos on public.modulos;
  create policy modulos_publicos on public.modulos for select using (
    exists (select 1 from public.cursos c where c.id = curso_id and ((c.publicado and not c.arquivado) or public.eh_admin())));
  drop policy if exists pacotes_publicos on public.pacotes;
  create policy pacotes_publicos on public.pacotes for select using (ativo or public.eh_admin());
  drop policy if exists pacote_cursos_publicos on public.pacote_cursos;
  create policy pacote_cursos_publicos on public.pacote_cursos for select using (true);

  -- aulas: conteúdo (vídeo, texto, material) só com matrícula ativa ou admin
  drop policy if exists aulas_matriculado on public.aulas;
  create policy aulas_matriculado on public.aulas for select using (
    public.eh_admin() or exists (
      select 1 from public.modulos m join public.matriculas mt on mt.curso_id = m.curso_id
       where m.id = modulo_id and mt.usuario_id = auth.uid() and mt.status = 'ativo'));

  -- dados do próprio aluno
  drop policy if exists pedidos_proprios on public.pedidos;
  create policy pedidos_proprios on public.pedidos for select using (usuario_id = auth.uid() or public.eh_admin());
  drop policy if exists matriculas_proprias on public.matriculas;
  create policy matriculas_proprias on public.matriculas for select using (usuario_id = auth.uid() or public.eh_admin());
  drop policy if exists progresso_proprio on public.progresso_aula;
  create policy progresso_proprio on public.progresso_aula for select using (usuario_id = auth.uid() or public.eh_admin());
  drop policy if exists duvidas_proprias on public.duvidas;
  create policy duvidas_proprias on public.duvidas for select using (usuario_id = auth.uid() or public.eh_admin());
  drop policy if exists mensagens_proprias on public.mensagens;
  create policy mensagens_proprias on public.mensagens for select using (
    exists (select 1 from public.duvidas d where d.id = duvida_id and (d.usuario_id = auth.uid() or public.eh_admin())));
  drop policy if exists certificados_proprios on public.certificados;
  create policy certificados_proprios on public.certificados for select using (usuario_id = auth.uid() or public.eh_admin());
  drop policy if exists modelo_publico on public.modelo_certificado;
  create policy modelo_publico on public.modelo_certificado for select using (true);
  drop policy if exists diagnosticos_proprios on public.diagnosticos;
  create policy diagnosticos_proprios on public.diagnosticos for select using (usuario_id = auth.uid() or public.eh_admin());
  drop policy if exists auditoria_admin on public.auditoria;
  create policy auditoria_admin on public.auditoria for select using (public.eh_admin());
end $$;

-- ---------- arquivos ----------
insert into storage.buckets (id, name, public) values ('capas', 'capas', true) on conflict (id) do nothing;
insert into storage.buckets (id, name, public) values ('materiais', 'materiais', false) on conflict (id) do nothing;
insert into storage.buckets (id, name, public) values ('certificados', 'certificados', true) on conflict (id) do nothing;
