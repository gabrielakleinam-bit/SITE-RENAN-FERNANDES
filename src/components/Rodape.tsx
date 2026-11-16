/* Rodapé: só o logo e o aviso legal (as redes ficam no bloco "Quem ensina"). */
export function Rodape() {
  return (
    <>
      <div className="foot-logo">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/img/logo-cor.webp" alt="Renan Fernandes Massoterapia" />
      </div>
      <p className="foot">
        Cursos livres: não habilitam como técnico em massoterapia e não substituem avaliação médica ou fisioterapêutica.
        Nesta versão de demonstração, cursos, preços, números de alunos e conversas são ilustrativos.
      </p>
    </>
  );
}
