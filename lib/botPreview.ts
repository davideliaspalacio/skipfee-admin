/**
 * Utilidades del preview de mensajes del bot: valores de ejemplo para las
 * variables y la interpolación `{{x}}` (espeja `render` del backend).
 */

export const SAMPLE_VARS: Record<string, string> = {
  nombre: 'Juan',
  correo: 'juan@correo.com',
  direccion: 'Cra 43A #5-15, apto 502',
  zona: 'El Poblado',
  tarifa: '4.500',
  pedido: '1043',
  saludo: 'Hola Juan',
};

export function renderTemplate(tpl: string, vars: Record<string, string> = SAMPLE_VARS): string {
  return tpl.replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (_m, k: string) =>
    vars[k] !== undefined ? vars[k] : '',
  );
}
