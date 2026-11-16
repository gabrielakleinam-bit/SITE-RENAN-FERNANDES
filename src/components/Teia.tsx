import { radar } from '@/lib/teia';

type Serie = { values: number[]; color: string; fillOp?: number };

/** Gráfico de teia (SVG gerado no servidor). */
export function Teia({ eixos, series, opcoes, className, style }: {
  eixos: string[]; series: Serie[]; opcoes?: Record<string, unknown>; className?: string; style?: React.CSSProperties;
}) {
  return <div className={className} style={style} dangerouslySetInnerHTML={{ __html: radar(eixos, series, opcoes) }} />;
}
