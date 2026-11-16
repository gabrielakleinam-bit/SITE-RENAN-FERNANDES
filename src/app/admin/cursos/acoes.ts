'use server';
/* Ações do painel de cursos. Todas conferem se quem chama é administrador. */
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { exigirAdmin, auditar } from '@/lib/sessao';
import { db } from '@/lib/supabase/servidor';
import { apagarVideo } from '@/lib/bunny';
import { checklist, slugify, type AulaEd, type CursoEd } from '@/lib/editor';
import type { Questao } from '@/lib/tipos';

const CAMPOS_AULA = 'id, modulo_id, ordem, titulo, tipo, duracao_seg, video_fonte, video_ref, video_status, texto, material_path, questoes';

export async function carregarEditor(id: string): Promise<CursoEd | null> {
  await exigirAdmin();
  const { data: c } = await db().from('cursos').select('*').eq('id', id).maybeSingle();
  if (!c) return null;
  const { data: mods } = await db().from('modulos').select('id, ordem, titulo').eq('curso_id', id).order('ordem');
  const mids = (mods || []).map(m => m.id);
  const { data: aulas } = mids.length ? await db().from('aulas').select(CAMPOS_AULA).in('modulo_id', mids).order('ordem') : { data: [] };
  return {
    id: c.id, slug: c.slug, titulo: c.titulo, formacao: c.formacao, professor: c.professor, preco: Number(c.preco),
    capa_url: c.capa_url, resumo: c.resumo, para_quem: c.para_quem, instrucoes: c.instrucoes, publicado: c.publicado, arquivado: c.arquivado,
    modulos: (mods || []).map(m => ({ ...m, aulas: (aulas || []).filter(a => a.modulo_id === m.id) as AulaEd[] })),
  };
}

async function slugLivre(base: string, ignorar?: string) {
  let s = slugify(base), n = 1;
  for (;;) {
    const { data } = await db().from('cursos').select('id').eq('slug', s).maybeSingle();
    if (!data || data.id === ignorar) return s;
    s = `${slugify(base)}-${++n}`;
  }
}

function tocar(cursoId?: string) {
  revalidatePath('/', 'layout');
  if (cursoId) revalidatePath(`/admin/cursos/${cursoId}`);
}

export async function criarCurso() {
  const adm = await exigirAdmin();
  const { data, error } = await db().from('cursos').insert({ titulo: 'Novo curso', slug: await slugLivre('novo-curso-' + Date.now().toString(36)) }).select('id').single();
  if (error) throw error;
  await db().from('modulos').insert([0, 1, 2].map(i => ({ curso_id: data.id, ordem: i, titulo: '' })));
  await auditar(adm.id, 'criar_curso', data.id);
  redirect(`/admin/cursos/${data.id}`);
}

export async function salvarCurso(id: string, campos: Partial<Pick<CursoEd, 'titulo' | 'formacao' | 'professor' | 'preco' | 'resumo' | 'para_quem' | 'instrucoes'>>) {
  await exigirAdmin();
  const upd: Record<string, unknown> = { atualizado_em: new Date().toISOString() };
  for (const k of ['titulo', 'formacao', 'professor', 'resumo', 'para_quem', 'instrucoes'] as const) if (campos[k] !== undefined) upd[k] = String(campos[k]).slice(0, 4000);
  if (campos.preco !== undefined) upd.preco = Math.max(0, Math.round(Number(campos.preco) * 100) / 100 || 0);
  if (upd.formacao && !['Para você', 'Para terapeutas'].includes(upd.formacao as string)) delete upd.formacao;
  if (typeof upd.titulo === 'string') {
    const { data: atual } = await db().from('cursos').select('publicado').eq('id', id).single();
    if (!atual?.publicado && (upd.titulo as string).trim()) upd.slug = await slugLivre(upd.titulo as string, id);
  }
  const { data, error } = await db().from('cursos').update(upd).eq('id', id).select('slug').single();
  if (error) throw error;
  tocar(id);
  return { slug: data.slug as string };
}

export async function enviarCapa(id: string, form: FormData) {
  await exigirAdmin();
  const f = form.get('arquivo');
  if (!(f instanceof File) || !f.size) return { erro: 'Escolha uma imagem.' };
  if (!/^image\/(jpeg|png|webp)$/.test(f.type)) return { erro: 'Use uma imagem JPG, PNG ou WebP.' };
  if (f.size > 8 * 1024 * 1024) return { erro: 'A imagem precisa ter até 8 MB.' };
  const caminho = `${id}/${Date.now()}.${f.type.split('/')[1].replace('jpeg', 'jpg')}`;
  const { error } = await db().storage.from('capas').upload(caminho, f, { contentType: f.type, upsert: true });
  if (error) return { erro: 'Não foi possível enviar a imagem.' };
  const url = db().storage.from('capas').getPublicUrl(caminho).data.publicUrl;
  await db().from('cursos').update({ capa_url: url }).eq('id', id);
  tocar(id);
  return { url };
}

export async function removerCapa(id: string) {
  await exigirAdmin();
  await db().from('cursos').update({ capa_url: null }).eq('id', id);
  tocar(id);
}

/* ---------- módulos ---------- */
export async function criarModulo(cursoId: string) {
  await exigirAdmin();
  const { count } = await db().from('modulos').select('id', { count: 'exact', head: true }).eq('curso_id', cursoId);
  const { data, error } = await db().from('modulos').insert({ curso_id: cursoId, ordem: count || 0, titulo: '' }).select('id, ordem, titulo').single();
  if (error) throw error;
  tocar(cursoId);
  return { ...data, aulas: [] };
}

export async function salvarModulo(id: string, titulo: string) {
  await exigirAdmin();
  await db().from('modulos').update({ titulo: titulo.slice(0, 120) }).eq('id', id);
  tocar();
}

async function reordenar(tabela: 'modulos' | 'aulas', pai: 'curso_id' | 'modulo_id', paiId: string, id: string, dir: -1 | 1) {
  const { data: itens } = await db().from(tabela).select('id, ordem').eq(pai, paiId).order('ordem');
  const lista = (itens || []).map(x => x.id);
  const i = lista.indexOf(id), j = i + dir;
  if (i < 0 || j < 0 || j >= lista.length) return;
  [lista[i], lista[j]] = [lista[j], lista[i]];
  await Promise.all(lista.map((x, k) => db().from(tabela).update({ ordem: k }).eq('id', x)));
}

export async function moverModulo(cursoId: string, id: string, dir: -1 | 1) {
  await exigirAdmin();
  await reordenar('modulos', 'curso_id', cursoId, id, dir);
  tocar(cursoId);
}

export async function excluirModulo(id: string) {
  const adm = await exigirAdmin();
  const { data: aulas } = await db().from('aulas').select('video_fonte, video_ref').eq('modulo_id', id);
  for (const a of aulas || []) if (a.video_fonte === 'bunny' && a.video_ref) await apagarVideo(a.video_ref);
  await db().from('modulos').delete().eq('id', id);
  await auditar(adm.id, 'excluir_modulo', id);
  tocar();
}

/* ---------- aulas ---------- */
const TITULO_PADRAO = { video: 'Nova aula em vídeo', texto: 'Nova aula de leitura', material: 'Material de apoio', teste: 'Teste do módulo' };

export async function criarAula(moduloId: string, tipo: AulaEd['tipo']) {
  await exigirAdmin();
  const { count } = await db().from('aulas').select('id', { count: 'exact', head: true }).eq('modulo_id', moduloId);
  const { data, error } = await db().from('aulas').insert({
    modulo_id: moduloId, ordem: count || 0, tipo, titulo: TITULO_PADRAO[tipo] || 'Nova aula',
    questoes: tipo === 'teste' ? [] : null,
  }).select(CAMPOS_AULA).single();
  if (error) throw error;
  tocar();
  return data as AulaEd;
}

export async function salvarAula(id: string, campos: { titulo?: string; texto?: string; questoes?: Questao[] }) {
  await exigirAdmin();
  const upd: Record<string, unknown> = {};
  if (campos.titulo !== undefined) upd.titulo = campos.titulo.slice(0, 200);
  if (campos.texto !== undefined) upd.texto = campos.texto.slice(0, 50000);
  if (campos.questoes !== undefined) {
    upd.questoes = campos.questoes.slice(0, 50).map(q => ({
      pergunta: String(q.pergunta || '').slice(0, 500),
      opcoes: (q.opcoes || []).slice(0, 6).map(o => String(o).slice(0, 300)),
      correta: Math.max(0, Math.min(5, Number(q.correta) || 0)),
    }));
  }
  await db().from('aulas').update(upd).eq('id', id);
  tocar();
}

export async function moverAula(moduloId: string, id: string, dir: -1 | 1) {
  await exigirAdmin();
  await reordenar('aulas', 'modulo_id', moduloId, id, dir);
  tocar();
}

export async function excluirAula(id: string) {
  const adm = await exigirAdmin();
  const { data: a } = await db().from('aulas').select('video_fonte, video_ref, material_path').eq('id', id).maybeSingle();
  if (a?.video_fonte === 'bunny' && a.video_ref) await apagarVideo(a.video_ref);
  if (a?.material_path) await db().storage.from('materiais').remove([a.material_path]);
  await db().from('aulas').delete().eq('id', id);
  await auditar(adm.id, 'excluir_aula', id);
  tocar();
}

export async function removerVideo(id: string) {
  await exigirAdmin();
  const { data: a } = await db().from('aulas').select('video_fonte, video_ref').eq('id', id).maybeSingle();
  if (a?.video_fonte === 'bunny' && a.video_ref) await apagarVideo(a.video_ref);
  await db().from('aulas').update({ video_fonte: null, video_ref: null, video_status: null, duracao_seg: null }).eq('id', id);
  tocar();
}

export async function enviarMaterial(aulaId: string, form: FormData) {
  await exigirAdmin();
  const f = form.get('arquivo');
  if (!(f instanceof File) || !f.size) return { erro: 'Escolha um arquivo.' };
  if (f.size > 45 * 1024 * 1024) return { erro: 'O arquivo precisa ter até 45 MB.' };
  const nome = f.name.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^\w.-]+/g, '_').slice(-80);
  const caminho = `${aulaId}/${Date.now()}-${nome}`;
  const { data: a } = await db().from('aulas').select('material_path').eq('id', aulaId).maybeSingle();
  const { error } = await db().storage.from('materiais').upload(caminho, f, { contentType: f.type || 'application/octet-stream' });
  if (error) return { erro: 'Não foi possível enviar o arquivo.' };
  if (a?.material_path) await db().storage.from('materiais').remove([a.material_path]);
  await db().from('aulas').update({ material_path: caminho }).eq('id', aulaId);
  tocar();
  return { caminho };
}

/* ---------- publicar, arquivar, excluir ---------- */
export async function publicarCurso(id: string, publicar: boolean) {
  const adm = await exigirAdmin();
  if (publicar) {
    const c = await carregarEditor(id);
    if (!c) return { erro: 'Curso não encontrado.' };
    const falta = checklist(c).filter(x => !x.ok);
    if (falta.length) return { erro: 'Ainda falta: ' + falta.map(x => x.texto.toLowerCase()).join(', ') + '.' };
  }
  await db().from('cursos').update({ publicado: publicar, arquivado: false }).eq('id', id);
  await auditar(adm.id, publicar ? 'publicar_curso' : 'despublicar_curso', id);
  tocar(id);
  return { ok: true };
}

export async function excluirCurso(id: string) {
  const adm = await exigirAdmin();
  const { count } = await db().from('matriculas').select('usuario_id', { count: 'exact', head: true }).eq('curso_id', id).eq('status', 'ativo');
  if (count) {
    await db().from('cursos').update({ arquivado: true, publicado: false }).eq('id', id);
    await auditar(adm.id, 'arquivar_curso', id, { alunos: count });
    tocar();
    return { arquivado: true, alunos: count };
  }
  const { data: mods } = await db().from('modulos').select('id').eq('curso_id', id);
  const mids = (mods || []).map(m => m.id);
  if (mids.length) {
    const { data: aulas } = await db().from('aulas').select('video_fonte, video_ref').in('modulo_id', mids);
    for (const a of aulas || []) if (a.video_fonte === 'bunny' && a.video_ref) await apagarVideo(a.video_ref);
  }
  await db().from('cursos').delete().eq('id', id);
  await auditar(adm.id, 'excluir_curso', id);
  tocar();
  return { arquivado: false };
}

/* ---------- pacotes ---------- */
export async function salvarPacote(p: { id?: string; titulo: string; descricao: string; preco: number; ativo: boolean; cursos: string[] }) {
  const adm = await exigirAdmin();
  if (!p.titulo.trim() || !(p.preco > 0) || p.cursos.length < 2) return { erro: 'Informe nome, preço e pelo menos 2 cursos.' };
  const dados = { titulo: p.titulo.slice(0, 120), descricao: p.descricao.slice(0, 400), preco: p.preco, ativo: p.ativo };
  let id = p.id;
  if (id) await db().from('pacotes').update(dados).eq('id', id);
  else id = (await db().from('pacotes').insert(dados).select('id').single()).data!.id as string;
  await db().from('pacote_cursos').delete().eq('pacote_id', id);
  await db().from('pacote_cursos').insert(p.cursos.map(c => ({ pacote_id: id, curso_id: c })));
  await auditar(adm.id, 'salvar_pacote', id!);
  tocar();
  return { ok: true };
}

export async function excluirPacote(id: string) {
  const adm = await exigirAdmin();
  await db().from('pacotes').delete().eq('id', id);
  await auditar(adm.id, 'excluir_pacote', id);
  tocar();
}
