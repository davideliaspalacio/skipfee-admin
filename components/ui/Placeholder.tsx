/** Marcador temporal para pantallas aún no migradas. Se reemplaza fase por fase. */
export function Placeholder({ title, phase }: { title: string; phase: string }) {
  return (
    <div className="placeholder">
      <div className="ph-badge">{phase}</div>
      <h2>{title}</h2>
      <p>Pantalla pendiente de migrar. Llegará conectada al backend con el nuevo diseño interactivo.</p>
    </div>
  );
}
