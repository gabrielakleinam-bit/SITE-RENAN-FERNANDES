/* Tipos do domínio. Espelham o modelo de dados do plano (tabelas cursos, modulos, aulas, pacotes).
   No M2 estes tipos passam a ser preenchidos pelo Supabase. */

export type Formacao = 'Para você' | 'Para terapeutas';
export type TipoAula = 'video' | 'texto' | 'material' | 'teste';

export interface Aula {
  id: string;            // ex.: "m1-a2"
  titulo: string;
  tipo: TipoAula;
  /** Duração em segundos. Só vídeos têm duração lida do arquivo ou do YouTube; nunca é digitada. */
  duracaoSeg?: number;
  /** Rótulo livre para testes ("8 questões"). */
  rotulo?: string;
  videoFonte?: 'bunny' | 'youtube' | null;
  videoRef?: string;     // conteúdo protegido: só preenchido para quem pode assistir
  videoStatus?: 'enviando' | 'processando' | 'pronto' | 'erro' | null;
  texto?: string;
  materialUrl?: string;
  materialPath?: string | null;
  questoes?: Questao[] | null;
}

export interface Questao { pergunta: string; opcoes: string[]; correta: number }

export interface Modulo {
  id: string;
  titulo: string;
  aulas: Aula[];
}

export interface Curso {
  id: string;            // slug, usado na URL
  uuid: string;          // id no banco
  publicado?: boolean;
  arquivado?: boolean;
  titulo: string;
  formacao: Formacao;
  professor: string;
  preco: number;
  nota?: number;
  alunos?: number;
  resumo: string;
  paraQuem: string;
  instrucoes?: string;
  capaUrl?: string;
  /** Eixos da teia de competências (um por módulo). */
  eixos: string[];
  antes: number[];
  depois: number[];
  modulos: Modulo[];
  /** Curso de exemplo: sem vídeo real, usa o player simulado. */
  exemplo?: boolean;
}

export interface Pacote {
  id: string;
  ativo?: boolean;
  titulo: string;
  descricao: string;
  cursos: string[];
  preco: number;
}

export interface Duvida {
  id: number;
  curso: string;
  tema: string;
  aula: string;
  titulo: string;
  status: 'aberta' | 'respondida' | 'resolvida';
  quando: string;
  mensagens: { professor: boolean; nome: string; texto: string }[];
}
