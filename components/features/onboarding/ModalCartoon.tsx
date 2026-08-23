'use client';

import { useEffect, type ReactNode } from 'react';
import { Icon } from '@/lib/icons';
import styles from './cartoon.module.css';

/**
 * El envoltorio de los modales de Primeros pasos.
 *
 * Por qué tiene un mundo propio y no reusa `<Modal>`: el panel es una
 * herramienta de trabajo —densa, oscura, seria— y está bien que lo sea. Pero
 * estos modales no son operación: son el primer día de alguien que acaba de
 * abrir su cuenta, no sabe qué es una zona de cobertura y está decidiendo si
 * esto le va a servir. Ahí lo que hay que transmitir no es eficiencia, es
 * "esto es fácil y ya casi".
 *
 * Así que pintan su propio suelo claro en los dos temas. No es un descuido del
 * modo oscuro: es que un mundo de caricatura en gris carbón deja de ser un
 * mundo de caricatura. La ilustración es el 40% de la pantalla porque es la que
 * hace el trabajo de explicar; el formulario solo recoge lo que ya se entendió.
 *
 * El trazo grueso y la sombra dura no son un disfraz importado: el design
 * system ya tiene botones con sombra sólida desplazada (`0 6px 0`). Esto sube
 * ese mismo idioma de volumen, no inventa otro.
 */
export function ModalCartoon({
  open,
  onClose,
  escena,
  titulo,
  sub,
  children,
  pie,
  tono = 'verde',
  ancho = 'normal',
  progreso,
  traslucido = false,
}: {
  open: boolean;
  onClose: () => void;
  /** La ilustración de arriba. Es la que explica; el texto solo confirma. */
  escena: ReactNode;
  titulo: string;
  sub?: string;
  children: ReactNode;
  pie: ReactNode;
  tono?: 'verde' | 'sol' | 'cielo';
  /** 'ancho' para los pasos que necesitan mapa o dos columnas. */
  ancho?: 'normal' | 'ancho';
  /** Puntos de "vas por aquí" mientras el recorrido guiado está activo. */
  progreso?: { actual: number; total: number };
  /**
   * Deja ver la pantalla de atrás. Lo usa el recorrido por el panel: ahí el
   * fondo no es un formulario que estorba, es el tablero real del que habla el
   * modal, y taparlo con velo opaco sería explicar algo escondiéndolo.
   */
  traslucido?: boolean;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    const previo = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = previo;
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <>
      <div
        className={styles.fondo}
        data-traslucido={traslucido ? 'true' : undefined}
        onClick={onClose}
        aria-hidden="true"
      />
      <div className={styles.marco} data-ancho={ancho} role="dialog" aria-modal="true" aria-label={titulo}>
        <div className={styles.escena} data-tono={tono}>
          {escena}
          <button type="button" className={styles.cerrar} onClick={onClose} aria-label="Cerrar">
            <Icon.X size={16} />
          </button>
        </div>

        <div className={styles.cuerpo}>
          <h2 className={styles.titulo}>{titulo}</h2>
          {sub && <p className={styles.sub}>{sub}</p>}
          <div className={styles.contenido}>{children}</div>
        </div>

        <div className={styles.pie}>
          {progreso && (
            <span
              className={styles.puntos}
              aria-label={`Paso ${progreso.actual} de ${progreso.total}`}
            >
              {Array.from({ length: progreso.total }, (_, i) => (
                <i key={i} data-estado={i + 1 < progreso.actual ? 'hecho' : i + 1 === progreso.actual ? 'aqui' : 'falta'} />
              ))}
            </span>
          )}
          {pie}
        </div>
      </div>
    </>
  );
}
