'use client';

import { Icon } from '@/lib/icons';
import { ModalCartoon } from './ModalCartoon';
import { EscenaTienda } from './EscenaTienda';
import styles from './cartoon.module.css';

/**
 * La bienvenida: el primer modal que ve alguien que acaba de crear su cuenta.
 *
 * No explica la plataforma entera a propósito. Un tour de doce pasos sobre un
 * panel vacío no se recuerda; lo único que hace falta saber en el minuto uno es
 * **qué son las tres cosas que faltan y por qué**. El resto de la plataforma se
 * explica sola cuando ya haya pedidos que mirar.
 *
 * Y dice cuánto toma. "Diez minutos" es una promesa que se puede cumplir, y
 * quien sabe cuánto va a durar algo lo empieza; quien no lo sabe, lo pospone.
 */
export function BienvenidaModal({
  open,
  nombre,
  onEmpezar,
  onCerrar,
}: {
  open: boolean;
  nombre: string;
  onEmpezar: () => void;
  /** Cerrar sin empezar: se puede, pero no es el camino sugerido. */
  onCerrar: () => void;
}) {
  return (
    <ModalCartoon
      open={open}
      onClose={onCerrar}
      tono="sol"
      escena={<EscenaTienda nombre={nombre} celebrando />}
      titulo={`¡Bienvenido, ${nombre}!`}
      sub="Tu cuenta ya existe. Faltan tres cosas para que puedas vender, y las hacemos juntos ahora."
      pie={
        <>
          <span />
          <button type="button" className={styles.accion} onClick={onEmpezar}>
            Empezar <Icon.ArrowRight size={15} />
          </button>
        </>
      }
    >
      <ol className={styles.pasosBienvenida}>
        <li>
          <span className={styles.numero}>1</span>
          <span>
            <b>Tu carta.</b> Nos mandas una foto y la digitalizamos nosotros. Tú solo revisas que
            no falte nada.
          </span>
        </li>
        <li>
          <span className={styles.numero}>2</span>
          <span>
            <b>Hasta dónde repartes.</b> Con eso el bot sabe a quién le puede cobrar domicilio y a
            quién no le llega.
          </span>
        </li>
        <li>
          <span className={styles.numero}>3</span>
          <span>
            <b>Tu WhatsApp.</b> Es por donde te escriben tus clientes. Se conecta escaneando un
            código, como WhatsApp Web.
          </span>
        </li>
      </ol>

      <p className={styles.pista}>
        Toma unos diez minutos. Puedes salir y volver: lo que llenes queda guardado.
      </p>
    </ModalCartoon>
  );
}
