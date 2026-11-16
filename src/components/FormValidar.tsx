export function FormValidar() {
  return (
    <form action="/validar/ir" method="get" className="copybox">
      <input name="c" placeholder="Código (ex.: RF-1A2B3C4D)" aria-label="Código do certificado" required style={{ padding: 12 }} />
      <button className="btn btn-anil">Validar</button>
    </form>
  );
}

