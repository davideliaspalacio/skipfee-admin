'use client';

import { Icon } from '@/lib/icons';
import { useLogout } from '@/lib/queries';
import type { Membership } from '@/lib/api';
import { useRouter } from 'next/navigation';
import styles from './suspendida.module.css';

const SOPORTE = process.env.NEXT_PUBLIC_SOPORTE_WHATSAPP;

/**
 * Pantalla de cuenta suspendida.
 *
 * Sin esto, un negocio bloqueado entra al panel y ve un tablero vacío con
 * errores rojos por todas partes: cada query devuelve 403 y ninguna dice por
 * qué. El resultado es un ticket de soporte que empieza con "se me dañó todo".
 *
 * Así que el bloqueo se explica en una sola pantalla, con el motivo, qué pasó
 * con sus datos (nada: siguen ahí) y un camino para volver. La salida siempre
 * es hablar con alguien: si venció una prueba y el dueño quiere pagar, lo peor
 * que puede pasar es que no encuentre cómo.
 */
export function CuentaSuspendida({
  membership,
  motivo,
}: {
  membership: Membership;
  /** 'prueba' cierra solo el panel · 'suspension' apaga también la venta. */
  motivo: 'prueba' | 'suspension';
}) {
  const logout = useLogout();
  const router = useRouter();

  const porPrueba = motivo === 'prueba';
  const mensaje = encodeURIComponent(
    `Hola, soy de ${membership.companyName} y quiero reactivar mi cuenta de Skipfee.`,
  );

  return (
    <div className={styles.pantalla}>
      <div className={styles.tarjeta}>
        <span className={styles.icono}>
          <Icon.AlertTriangle size={22} />
        </span>

        <h1>{porPrueba ? 'Se acabó tu prueba' : 'Tu cuenta está suspendida'}</h1>

        <p className={styles.entrada}>
          {porPrueba ? (
            <>
              Los días de prueba de <b>{membership.companyName}</b> terminaron, así que el panel
              quedó en pausa hasta que activemos tu cuenta.
            </>
          ) : (
            <>
              <b>{membership.companyName}</b> está suspendida: el panel y el bot están en pausa.
            </>
          )}
        </p>

        <ul className={styles.lista}>
          <li>
            <Icon.CheckCircle size={15} />
            <span>
              <b>Tus datos están intactos.</b> Tu carta, tus zonas, tus clientes y tu historial de
              pedidos siguen ahí, tal como los dejaste.
            </span>
          </li>
          <li>
            <Icon.MessageCircle size={15} />
            <span>
              {porPrueba ? (
                <>
                  <b>Tus clientes siguen pidiendo.</b> El bot atiende y la tienda cobra como
                  siempre: lo único cerrado es tu panel. No vas a perder ventas mientras
                  arreglamos esto.
                </>
              ) : (
                <>
                  <b>Tu WhatsApp no responde pedidos</b> mientras dure la pausa. Tus clientes que
                  escriban no reciben respuesta del bot.
                </>
              )}
            </span>
          </li>
          <li>
            <Icon.Clock size={15} />
            <span>
              <b>Se reactiva el mismo día</b> que arreglemos la cuenta. No hay que volver a
              configurar nada.
            </span>
          </li>
        </ul>

        <div className={styles.acciones}>
          {SOPORTE ? (
            <a
              className="btn btn-primary sm sq"
              href={`https://wa.me/${SOPORTE}?text=${mensaje}`}
              target="_blank"
              rel="noreferrer"
            >
              <Icon.MessageCircle size={14} /> Escribirnos por WhatsApp
            </a>
          ) : (
            <a className="btn btn-primary sm sq" href="mailto:hola@skipfee.co?subject=Reactivar%20mi%20cuenta">
              <Icon.Send size={14} /> Escribirnos por correo
            </a>
          )}
          <button
            type="button"
            className="btn btn-ghost sm sq"
            onClick={() => logout.mutate(undefined, { onSettled: () => router.replace('/login') })}
          >
            Cerrar sesión
          </button>
        </div>
      </div>
    </div>
  );
}
