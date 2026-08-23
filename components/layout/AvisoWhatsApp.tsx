'use client';

import Link from 'next/link';
import { Icon } from '@/lib/icons';
import { useActiveMembership } from '@/lib/queries';

/**
 * Aviso de canal caído.
 *
 * Es el peor modo de falla del producto y el más silencioso: la sesión de
 * Evolution se cae —el celular perdió internet, WhatsApp cerró el dispositivo
 * vinculado, el servidor se reinició— y el negocio deja de recibir pedidos sin
 * que nada cambie en pantalla. Se entera cuando un cliente reclama.
 *
 * Dos decisiones sobre el texto y el alcance:
 *
 * - **Dice lo que cuesta, no el estado técnico.** "No estás recibiendo pedidos"
 *   antes que "sesión desconectada". El dueño no sabe qué es una sesión; sabe
 *   perfectamente qué es perder ventas.
 *
 * - **Solo para quien ya estuvo operando** (`operativoDesde`). A un negocio que
 *   todavía no ha vinculado su número no se le avisa que "se desconectó": nunca
 *   lo estuvo, y ya tiene su paso pendiente en Primeros pasos.
 */
export function AvisoWhatsApp() {
  const membership = useActiveMembership();

  if (!membership?.operativoDesde) return null;
  if (membership.whatsapp !== 'disconnected') return null;

  return (
    <div className="aviso-canal" role="alert">
      <Icon.AlertTriangle size={15} />
      <span>
        <b>Tu WhatsApp está desconectado.</b> No estás recibiendo pedidos.
      </span>
      <Link className="aviso-canal-cta" href="/canales">
        Volver a conectarlo
      </Link>
    </div>
  );
}
