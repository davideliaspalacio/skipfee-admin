'use client';

import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Icon } from '@/lib/icons';
import { useScreenNav } from '@/lib/hooks';
import type { ScreenId } from '@/lib/nav';
import { useActiveCompany, useMe, useProducts } from '@/lib/queries';
import { claveRecorrido, usePedidoDeRecorrido } from '@/lib/recorrido';
import { EscenaCarta } from './EscenaCarta';
import { EscenaTienda } from './EscenaTienda';
import {
  EscenaAjustes,
  EscenaBandeja,
  EscenaPanelAbre,
  EscenaRuta,
  EscenaTablero,
} from './EscenasRecorrido';
import { ModalCartoon } from './ModalCartoon';
import styles from './cartoon.module.css';

/**
 * El recorrido por el panel: lo que pasa el día que se abre el candado.
 *
 * Hasta ese momento el dueño solo conoció una pantalla, Primeros pasos. Al
 * terminar de conectar su WhatsApp le aparecen once de golpe, y ninguna se
 * explica sola cuando está vacía. Este recorrido lo lleva por las cinco que va
 * a usar de verdad y le dice, de cada una, **cuándo va a volver a abrirla** —
 * no qué botones tiene. Un manual se olvida; "aquí vuelves cuando se te acabe
 * el pollo" se queda.
 *
 * Tres decisiones que lo definen:
 *
 * **Lleva de verdad.** Cada paso navega a su pantalla y el modal se queda
 * encima, con el fondo translúcido: detrás está el tablero real del negocio,
 * no una captura. Al terminar, el dueño ya sabe llegar porque ya llegó.
 *
 * **Cinco, no once.** Dashboard, Reportes y Clientes están en cero el primer
 * día: enseñarlos sería enseñar pantallas vacías. Salón es para quien atiende
 * mesas y Canales ya lo vio conectando su WhatsApp. Se explican solos cuando
 * haya algo que mirar.
 *
 * **Se puede abandonar.** Cerrar termina el recorrido, y se retoma desde
 * Configuración cuando quiera. Nadie aprende encerrado.
 */

interface Paso {
  id: string;
  /** A dónde lleva. Sin esto es un paso de marco (apertura y cierre). */
  pantalla?: ScreenId;
  tono: 'verde' | 'sol' | 'cielo';
  escena: ReactNode;
  titulo: string;
  sub: string;
  cuerpo: ReactNode;
  /** Texto del botón que avanza. El último cierra. */
  cta: string;
}

/**
 * La carta real del negocio en la pizarra. Se monta solo mientras el paso de
 * Catálogo está abierto: `useProducts` reconsulta cada 10 s y no tiene sentido
 * pagar ese ciclo en todas las pantallas del panel por una ilustración.
 */
function CartaDelNegocio() {
  const { data } = useProducts();
  const productos = useMemo(
    () => (data ?? []).map(p => ({ nombre: p.name, precio: p.price })),
    [data],
  );
  return <EscenaCarta productos={productos} />;
}

export function RecorridoPanel({
  puedeArrancar,
  pantallas,
}: {
  /** El panel acaba de abrirse para alguien que vivió el candado cerrado. */
  puedeArrancar: boolean;
  /** Screens que el rol tiene permitidas: no se lleva a nadie a una puerta cerrada. */
  pantallas: Set<ScreenId>;
}) {
  const irA = useScreenNav();
  const companyCode = useActiveCompany();
  const { data: me } = useMe();
  const pedido = usePedidoDeRecorrido();

  const [indice, setIndice] = useState<number | null>(null);

  const clave = claveRecorrido(companyCode);
  const nombreNegocio =
    me?.memberships.find(m => String(m.companyCode) === companyCode)?.companyName ?? 'tu negocio';

  const pasos = useMemo<Paso[]>(() => {
    const todos: Paso[] = [
      {
        id: 'apertura',
        tono: 'verde',
        escena: <EscenaPanelAbre />,
        titulo: 'Se abrió tu panel',
        sub: 'Ya puedes recibir pedidos, así que le quitamos el candado a todo lo demás.',
        cta: 'Muéstrame',
        cuerpo: (
          <>
            <p className={styles.pista}>
              Son cinco pantallas las que vas a usar de verdad. Te cuento para qué sirve cada una y
              cuándo vas a volver a ella. Toma un minuto y puedes salirte cuando quieras.
            </p>
          </>
        ),
      },
      {
        id: 'pedidos',
        pantalla: 'pedidos',
        tono: 'cielo',
        escena: <EscenaTablero />,
        titulo: 'Pedidos',
        sub: 'El tablero donde aterriza todo lo que vendes. Es el que vas a dejar abierto todo el día.',
        cta: 'Siguiente',
        cuerpo: (
          <ul className={styles.lista}>
            <li>
              <Icon.LayoutGrid size={16} />
              <span>
                <b>Los pedidos entran solos.</b> Cuando tu cliente paga, la tarjeta aparece en la
                primera columna. No tienes que copiar nada de WhatsApp.
              </span>
            </li>
            <li>
              <Icon.ArrowRight size={16} />
              <span>
                <b>Arrastras la tarjeta según avanza:</b> a cocina cuando la ponen al fuego, a
                empacado cuando está lista, a la calle cuando sale.
              </span>
            </li>
            <li>
              <Icon.MessageCircle size={16} />
              <span>
                <b>Cada movida le avisa al cliente</b> por WhatsApp. Ese es el truco: mueves la
                tarjeta y dejas de responder «¿ya casi?».
              </span>
            </li>
          </ul>
        ),
      },
      {
        id: 'whatsapp',
        pantalla: 'whatsapp',
        tono: 'verde',
        escena: <EscenaBandeja />,
        titulo: 'WhatsApp',
        sub: 'Todas las conversaciones de tu bot, para las veces en que no basta con el bot.',
        cta: 'Siguiente',
        cuerpo: (
          <>
            <ul className={styles.lista}>
              <li>
                <Icon.Bot size={16} />
                <span>
                  <b>El bot atiende solo.</b> Aquí ves, chat por chat, qué le está respondiendo a
                  cada cliente.
                </span>
              </li>
              <li>
                <Icon.User size={16} />
                <span>
                  <b>Puedes tomar el control.</b> El bot se hace a un lado y los mensajes salen
                  escritos por ti, desde el mismo número.
                </span>
              </li>
            </ul>
            <p className={styles.pista}>
              Vuelves cuando alguien pregunta algo raro, pide un cambio o se queda esperando.
              Mientras nadie se atore, no tienes que abrirla.
            </p>
          </>
        ),
      },
      {
        id: 'catalogo',
        pantalla: 'catalogo',
        tono: 'sol',
        escena: <CartaDelNegocio />,
        titulo: 'Catálogo',
        sub: 'Lo que tu bot puede vender. Si un producto no está aquí, tu cliente no lo puede pedir.',
        cta: 'Siguiente',
        cuerpo: (
          <>
            <ul className={styles.lista}>
              <li>
                <Icon.Package size={16} />
                <span>
                  <b>Se acabó algo: lo apagas.</b> Deja de aparecerle a los clientes hasta que lo
                  vuelvas a prender. Nadie pide lo que no tienes.
                </span>
              </li>
              <li>
                <Icon.DollarSign size={16} />
                <span>
                  <b>Subiste precios: los cambias aquí.</b> El bot cobra el nuevo desde el pedido
                  siguiente.
                </span>
              </li>
            </ul>
            <p className={styles.pista}>
              Vuelves cada vez que cambie tu carta: un plato nuevo, uno que quitaste, una foto que
              quedó mejor.
            </p>
          </>
        ),
      },
      {
        id: 'despachos',
        pantalla: 'despachos',
        tono: 'cielo',
        escena: <EscenaRuta />,
        titulo: 'Despachos',
        sub: 'Para cuando se te juntan varios pedidos listos al tiempo.',
        cta: 'Siguiente',
        cuerpo: (
          <>
            <ul className={styles.lista}>
              <li>
                <Icon.Route size={16} />
                <span>
                  <b>Agrupa por zona y ordena las paradas</b> por el camino más corto, para que no
                  se cruce la ciudad dos veces.
                </span>
              </li>
              <li>
                <Icon.Copy size={16} />
                <span>
                  <b>Copias la lista y se la pasas a quien entregue</b> — tu motorizado, un
                  domiciliario o una app. Aquí no se registra a nadie.
                </span>
              </li>
            </ul>
            <p className={styles.pista}>
              Si repartes de a un pedido, ni la mires. El día que salgan cuatro juntos, agradeces
              que exista.
            </p>
          </>
        ),
      },
      {
        id: 'configuracion',
        pantalla: 'configuracion',
        tono: 'verde',
        escena: <EscenaAjustes />,
        titulo: 'Configuración',
        sub: 'Las reglas con las que trabaja tu negocio cuando tú no estás mirando.',
        cta: 'Siguiente',
        cuerpo: (
          <>
            <ul className={styles.lista}>
              <li>
                <Icon.Clock size={16} />
                <span>
                  <b>Horarios.</b> Fuera de tu horario el bot avisa que estás cerrado en vez de
                  tomar un pedido que nadie va a cocinar.
                </span>
              </li>
              <li>
                <Icon.MapPin size={16} />
                <span>
                  <b>Zonas y domicilio.</b> Hasta dónde llevas y cuánto cobras por llevarlo.
                </span>
              </li>
              <li>
                <Icon.Bot size={16} />
                <span>
                  <b>Lo que dice el bot.</b> Sus mensajes, escritos con tus palabras.
                </span>
              </li>
              <li>
                <Icon.Users size={16} />
                <span>
                  <b>Tu equipo.</b> Quién entra al panel y qué puede ver cada uno.
                </span>
              </li>
            </ul>
            <p className={styles.pista}>
              Vuelves cuando cambie algo del negocio, no todos los días.
            </p>
          </>
        ),
      },
      {
        id: 'cierre',
        tono: 'sol',
        escena: <EscenaTienda nombre={nombreNegocio} celebrando />,
        titulo: 'Eso es todo',
        sub: 'Con esas cinco pantallas se opera un día completo.',
        cta: 'Ir a mis pedidos',
        cuerpo: (
          <ul className={styles.lista}>
            <li>
              <Icon.BarChart size={16} />
              <span>
                <b>Dashboard, Clientes y Reportes se llenan solos</b> con lo que vayas vendiendo.
                Hoy están en cero; ábrelos cuando te dé curiosidad.
              </span>
            </li>
            <li>
              <Icon.Compass size={16} />
              <span>
                <b>¿Se te olvidó cuál era cuál?</b> Este recorrido se vuelve a ver desde
                Configuración, en el botón «Ver el recorrido» de arriba.
              </span>
            </li>
          </ul>
        ),
      },
    ];

    // A un rol sin permiso para una pantalla no se le enseña la pantalla.
    return todos.filter(p => !p.pantalla || pantallas.has(p.pantalla));
  }, [nombreNegocio, pantallas]);

  const marcarVisto = () => {
    try {
      if (clave) window.localStorage.setItem(clave, '1');
    } catch {
      /* modo privado: se vuelve a mostrar, no es grave */
    }
  };

  // Arranca solo, una vez por empresa. La marca se escribe al abrir y no al
  // terminar: si el dueño recarga a mitad del recorrido, lo retoma cuando
  // quiera desde Configuración — pero no se lo encuentra otra vez de sorpresa.
  useEffect(() => {
    if (!puedeArrancar || !clave) return;
    try {
      if (window.localStorage.getItem(clave)) return;
      window.localStorage.setItem(clave, '1');
    } catch {
      return;
    }
    setIndice(0);
  }, [puedeArrancar, clave]);

  // Retomarlo a mano. El primer valor se ignora: al montar solo interesa que el
  // contador cambie, no en cuánto va.
  const pedidoPrevio = useRef(pedido);
  useEffect(() => {
    if (pedido === pedidoPrevio.current) return;
    pedidoPrevio.current = pedido;
    setIndice(0);
  }, [pedido]);

  const paso = indice === null ? null : pasos[indice];

  // La navegación de verdad: el modal se queda encima de la pantalla que
  // describe. Sin esto sería un modal diciendo "ve a Pedidos".
  const destino = paso?.pantalla ?? null;
  useEffect(() => {
    if (destino) irA(destino);
  }, [destino, irA]);

  if (!paso) return null;

  const conPantalla = pasos.filter(p => p.pantalla);
  const posicion = paso.pantalla ? conPantalla.indexOf(paso) + 1 : 0;
  const esUltimo = indice === pasos.length - 1;

  const cerrar = () => {
    marcarVisto();
    setIndice(null);
  };

  const avanzar = () => {
    if (esUltimo) {
      cerrar();
      // El recorrido termina donde empieza el trabajo, no donde quedó el último paso.
      if (pantallas.has('pedidos')) irA('pedidos');
      return;
    }
    setIndice(i => (i === null ? null : i + 1));
  };

  return (
    <ModalCartoon
      open
      onClose={cerrar}
      traslucido
      tono={paso.tono}
      escena={paso.escena}
      titulo={paso.titulo}
      sub={paso.sub}
      progreso={posicion > 0 ? { actual: posicion, total: conPantalla.length } : undefined}
      pie={
        <>
          {esUltimo ? (
            <span />
          ) : (
            <button type="button" className={styles.accionSuave} onClick={cerrar}>
              Saltar el recorrido
            </button>
          )}
          <button type="button" className={styles.accion} onClick={avanzar}>
            {paso.cta} <Icon.ArrowRight size={15} />
          </button>
        </>
      }
    >
      {paso.cuerpo}
    </ModalCartoon>
  );
}
