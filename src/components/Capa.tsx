import { coverSVG } from '@/lib/capa';
import type { Curso } from '@/lib/tipos';

/** Capa do curso: imagem enviada pelo admin ou, sem imagem, a ilustração da marca. */
export function Capa({ curso, className = 'cover', k, center }: { curso: Pick<Curso, 'id' | 'titulo' | 'capaUrl'>; className?: string; k?: string; center?: boolean }) {
  if (curso.capaUrl) {
    return (
      <div className={className}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={curso.capaUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
      </div>
    );
  }
  return <div className={className} dangerouslySetInnerHTML={{ __html: coverSVG(curso, { k, center }) }} />;
}
