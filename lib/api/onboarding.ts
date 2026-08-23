import { tenantMultipart, tenantRequest } from './client';

/** Un paso del recorrido de puesta en marcha. */
export interface PasoOnboarding {
  id: 'negocio' | 'carta' | 'zona' | 'whatsapp' | 'primerPedido';
  titulo: string;
  descripcion: string;
  hecho: boolean;
  obligatorio: boolean;
  detalle?: string;
}

export interface EstadoOnboarding {
  pasos: PasoOnboarding[];
  /** Tiene carta, zona y WhatsApp: el bot ya puede cerrar un pedido. */
  puedeVender: boolean;
  /** Ya recibió al menos un pedido. Es el hito que indica activación real. */
  activo: boolean;
  completados: number;
  total: number;
  siguiente: PasoOnboarding['id'] | null;
}

export function fetchOnboarding(): Promise<EstadoOnboarding> {
  return tenantRequest<EstadoOnboarding>('/onboarding');
}

// =========================================================================
// Carta: leer una foto → revisar → guardar
// =========================================================================

export interface ProductoExtraido {
  nombre: string;
  descripcion: string | null;
  precio: number | null;
  categoria: string;
  confianza: number;
  /** Motivos por los que hay que mirarlo. Vacío = se leyó limpio. */
  avisos: string[];
}

export interface CartaExtraida {
  categorias: string[];
  productos: ProductoExtraido[];
  necesitanRevision: number;
}

/**
 * Manda la foto o el PDF de la carta y devuelve un BORRADOR.
 * No guarda nada: el dueño revisa y confirma con `importarCarta`.
 */
export function extraerCarta(file: File): Promise<CartaExtraida> {
  const form = new FormData();
  form.append('file', file);
  return tenantMultipart<CartaExtraida>('/catalog/extract', form);
}

export interface ProductoAImportar {
  nombre: string;
  descripcion?: string | null;
  precio: number;
  categoria: string;
}

export function importarCarta(
  productos: ProductoAImportar[],
  reemplazar = false,
): Promise<{ importados: number; categorias: string[] }> {
  return tenantRequest('/catalog/import', {
    method: 'POST',
    body: JSON.stringify({ productos, reemplazar }),
  });
}
