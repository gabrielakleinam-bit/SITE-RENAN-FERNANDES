/* Camada de acesso ao catálogo. As páginas só falam com estas funções.
   M1: dados de exemplo em memória. M2: as mesmas assinaturas passam a consultar o Supabase. */
import { CURSOS, PACOTES, DUVIDAS } from './dados.ts';
import type { Curso } from './tipos.ts';

export async function listarCursos(): Promise<Curso[]> { return CURSOS; }
export async function buscarCurso(slug: string): Promise<Curso | undefined> { return CURSOS.find(c => c.id === slug); }
export async function listarPacotes() { return PACOTES.filter(p => p.cursos.every(id => CURSOS.some(c => c.id === id))); }
export async function duvidasDoCurso(cursoId: string) { return DUVIDAS.filter(d => d.curso === cursoId); }
