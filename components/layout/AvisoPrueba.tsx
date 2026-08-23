'use client';

import { Icon } from '@/lib/icons';
import { useActiveMembership } from '@/lib/queries';

/**
 * Aviso de prueba gratis.
 *
 * Aparece solo cuando hay algo que decir: el plan es `trial` y el reloj ya
 * arrancó. Un negocio que todavía está montando su carta no necesita una barra
 * contándole los días —el reloj ni siquiera corre para él—, y uno en cortesía o
 * ya pagando no necesita verla nunca.
 *
 * Los tres tonos son deliberados: informativo mientras sobra tiempo, ámbar en
 * la última semana, rojo cuando se acabó. Un aviso que se ve igual el día 12 que
 * el día 1 no avisa de nada.
 */
export function AvisoPrueba() {
  const membership = useActiveMembership();

  if (!membership || membership.plan !== 'trial') return null;

  const dias = membership.diasRestantes;
  const suspendida = membership.status === 'suspended';

  if (!suspendida && (dias === null || dias === undefined)) return null;

  const vencida = suspendida || (dias ?? 0) <= 0;
  // Con pruebas de 7 días, avisar en ámbar desde el día 7 sería pintar toda la
  // prueba de urgente. El ámbar entra en los últimos 3.
  const tono = vencida ? 'vencida' : (dias ?? 99) <= 3 ? 'ultima' : 'info';

  const texto = vencida
    ? 'Tu prueba terminó. Tus clientes siguen pidiendo; escríbenos para reabrir tu panel.'
    : dias === 1
      ? 'Te queda 1 día de prueba.'
      : `Te quedan ${dias} días de prueba.`;

  return (
    <div className="aviso-prueba" data-tono={tono} role="status">
      {vencida ? <Icon.AlertTriangle size={15} /> : <Icon.Clock size={15} />}
      <span>{texto}</span>
    </div>
  );
}
