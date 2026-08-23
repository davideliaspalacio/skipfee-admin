'use client';

import { Icon } from '@/lib/icons';
import { EscenaTienda } from './EscenaTienda';
import { ModalCartoon } from './ModalCartoon';
import styles from './cartoon.module.css';

/**
 * El cierre del recorrido.
 *
 * Deliberadamente NO dice "listo, ya terminaste": dice cuál es la única cosa
 * que falta, y es una que el dueño hace con su propio celular. La métrica de
 * activación no es "configuración completa", es "primer pedido recibido" — un
 * negocio con todo montado que nunca se estrenó sigue siendo un negocio que no
 * vendió.
 */
export function FinalModal({
  open,
  nombre,
  onClose,
  onVerPanel,
}: {
  open: boolean;
  nombre: string;
  onClose: () => void;
  /**
   * Salir por la puerta grande: lleva al tablero, que es donde el recorrido
   * por el panel toma el relevo. Se separa de `onClose` porque cerrar con la X
   * es abandonar, y a quien abandona no se le arrastra a otra pantalla.
   */
  onVerPanel?: () => void;
}) {
  return (
    <ModalCartoon
      open={open}
      onClose={onClose}
      tono="verde"
      escena={<EscenaTienda nombre={nombre} celebrando />}
      titulo="¡Tu negocio ya puede vender!"
      sub="Falta una sola cosa, y es la más divertida: estrenarlo."
      pie={
        <>
          <span />
          <button type="button" className={styles.accion} onClick={onVerPanel ?? onClose}>
            Ver mi panel <Icon.ArrowRight size={15} />
          </button>
        </>
      }
    >
      <ul className={styles.lista}>
        <li>
          <Icon.Phone size={16} />
          <span>
            <b>Escríbele a tu propio WhatsApp</b> desde otro celular, como si fueras un cliente.
          </span>
        </li>
        <li>
          <Icon.MessageCircle size={16} />
          <span>
            <b>Tu bot te va a atender.</b> Te pide los datos, te manda el link y armas el pedido.
          </span>
        </li>
        <li>
          <Icon.LayoutGrid size={16} />
          <span>
            <b>El pedido aparece en tu tablero.</b> Ahí es donde vas a trabajar de ahora en
            adelante.
          </span>
        </li>
      </ul>
    </ModalCartoon>
  );
}
