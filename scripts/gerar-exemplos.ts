/* Gera supabase/migrations/0002_exemplos.sql a partir dos cursos de exemplo (src/lib/dados.ts).
   Os cursos entram como RASCUNHO (publicado = false): o admin envia os vídeos e publica.
   Uso: node --experimental-strip-types scripts/gerar-exemplos.ts */
import { writeFileSync } from 'node:fs';
import { CURSOS, PACOTES } from '../src/lib/dados.ts';

const q = (s: string) => `'${String(s).replace(/'/g, "''")}'`;
const arr = (a: number[]) => `'{${a.join(',')}}'`;
let sql = `-- Cursos e pacotes iniciais, como RASCUNHO (sem vídeos). Rode depois do 0001.
-- Gerado por scripts/gerar-exemplos.ts. Só insere se ainda não existir curso com o mesmo endereço.
do $$
declare c uuid; m uuid; p uuid;
begin
`;
for (const c of CURSOS) {
  sql += `  if not exists (select 1 from public.cursos where slug = ${q(c.id)}) then
    insert into public.cursos (slug, titulo, formacao, preco, resumo, para_quem, antes, depois, publicado)
    values (${q(c.id)}, ${q(c.titulo)}, ${q(c.formacao)}, ${c.preco}, ${q(c.resumo)}, ${q(c.paraQuem)}, ${arr(c.antes)}, ${arr(c.depois)}, false)
    returning id into c;\n`;
  c.modulos.forEach((mod, i) => {
    sql += `    insert into public.modulos (curso_id, ordem, titulo) values (c, ${i}, ${q(c.eixos[i])}) returning id into m;\n`;
    mod.aulas.forEach((a, j) => {
      sql += `    insert into public.aulas (modulo_id, ordem, titulo, tipo) values (m, ${j}, ${q(a.titulo)}, ${q(a.tipo)});\n`;
    });
  });
  sql += `  end if;\n`;
}
for (const p of PACOTES) {
  sql += `  if not exists (select 1 from public.pacotes where titulo = ${q(p.titulo)}) then
    insert into public.pacotes (titulo, descricao, preco, ordem) values (${q(p.titulo)}, ${q(p.descricao)}, ${p.preco}, ${PACOTES.indexOf(p)}) returning id into p;
    insert into public.pacote_cursos (pacote_id, curso_id) select p, id from public.cursos where slug in (${p.cursos.map(q).join(', ')});
  end if;\n`;
}
sql += `end $$;\n`;
writeFileSync(new URL('../supabase/migrations/0002_exemplos.sql', import.meta.url), sql);
console.log('ok');
