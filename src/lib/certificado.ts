import 'server-only';
import { db } from './supabase/servidor';
import { fmtTotal } from './duracao';
import { SITE_URL, supabaseConfigurado } from './config';

export interface Modelo { imagem_url: string | null; cor: string; nome_y: number; curso_y: number; horas_y: number; rodape_y: number }
export interface DadosCert { nome: string; curso: string; horas: string; data: string; codigo: string }

export async function modeloCert(): Promise<Modelo> {
  const { data } = await db().from('modelo_certificado').select('imagem_url, cor, nome_y, curso_y, horas_y, rodape_y').eq('id', 1).maybeSingle();
  return (data as Modelo) || { imagem_url: null, cor: '#12161B', nome_y: 47, curso_y: 58, horas_y: 65, rodape_y: 93 };
}

export async function certPorCodigo(codigo: string) {
  if (!supabaseConfigurado()) return null;
  const { data } = await db().from('certificados').select('usuario_id, nome_aluno, titulo_curso, horas_seg, emitido_em, codigo, status').eq('codigo', codigo).eq('status', 'aprovado').maybeSingle();
  if (!data) return null;
  return {
    usuarioId: data.usuario_id as string,
    dados: {
      nome: data.nome_aluno, curso: data.titulo_curso, horas: fmtTotal(data.horas_seg),
      data: new Date(data.emitido_em).toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' }), codigo: data.codigo,
    } as DadosCert,
  };
}

export const linkValidacao = () => (SITE_URL ? SITE_URL.replace(/^https?:\/\//, '') : 'o site') + '/validar';
