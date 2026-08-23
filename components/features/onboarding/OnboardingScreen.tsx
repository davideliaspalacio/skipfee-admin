'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Icon } from '@/lib/icons';
import { useActiveCompany, useMe, useOnboarding } from '@/lib/queries';
import type { PasoOnboarding } from '@/lib/api';
import { BienvenidaModal } from './BienvenidaModal';
import { CartaModal } from './CartaModal';
import { DatosNegocioModal } from './DatosNegocioModal';
import { FinalModal } from './FinalModal';
import { PrimeraZonaModal } from './PrimeraZonaModal';
import { WhatsAppModal } from './WhatsAppModal';
import styles from './pagina.module.css';

/** WhatsApp de soporte de Skipfee. Sin él, el carril humano no se muestra. */
const SOPORTE = process.env.NEXT_PUBLIC_SOPORTE_WHATSAPP;

/**
 * Primeros pasos — la pantalla que lleva a un negocio de recién creado a
 * recibir su primer pedido.
 *
 * Dos cosas la definen:
 *
 * **1. Acompaña, no lista.** La primera vez no te deja frente a un checklist a
 * ver qué tocas: la bienvenida encadena el primer paso, y al terminar cada uno
 * se abre el siguiente solo. Los puntos del pie del modal dicen por dónde vas.
 * Un checklist es un mapa; esto es alguien caminando contigo. Se puede salir en
 * cualquier momento —cerrar un modal termina el recorrido— y lo que llenaste
 * queda guardado.
 *
 * **2. El estado lo calcula el backend**, nunca casillas manuales. Un checklist
 * que se marca a mano miente: dice "carta lista" cuando alguien tocó el botón,
 * no cuando hay productos.
 *
 * El último paso —recibir un pedido— es el que de verdad importa. Un negocio
 * puede tener todo configurado y no haber vendido nunca; ese es el que hay que
 * llamar.
 */

/** El orden del recorrido. `primerPedido` no entra: no es algo que se configure. */
const RECORRIDO: Array<PasoOnboarding['id']> = ['negocio', 'carta', 'zona', 'whatsapp'];

/**
 * Dónde vive cada cosa cuando el recorrido ya terminó. El modal sirve para
 * arrancar; para el día a día el dueño necesita saber a qué pantalla volver, y
 * ese enlace solo aparece en los pasos ya hechos — antes de terminarlos sería
 * una puerta a un sitio vacío.
 */
/** Nombres cortos para el resumen del costado, donde no cabe el título entero. */
const ETIQUETA_CORTA: Record<PasoOnboarding['id'], string> = {
  negocio: 'Tu negocio',
  carta: 'Carta',
  zona: 'Cobertura',
  whatsapp: 'WhatsApp',
  primerPedido: 'Primer pedido',
};

const DONDE_VIVE: Partial<Record<PasoOnboarding['id'], { label: string; href: string }>> = {
  negocio: { label: 'Ver en Configuración', href: '/configuracion?tab=local' },
  carta: { label: 'Ver en Catálogo', href: '/catalogo' },
  zona: { label: 'Ver en Zonas', href: '/configuracion?tab=zonas' },
  whatsapp: { label: 'Ver en Canales', href: '/canales' },
};

type Abierto = PasoOnboarding['id'] | 'bienvenida' | 'final' | null;

export function OnboardingScreen() {
  const { data, isLoading, isError } = useOnboarding();
  const { data: me } = useMe();
  const router = useRouter();
  const companyCode = useActiveCompany();

  const [abierto, setAbierto] = useState<Abierto>(null);
  /** El recorrido guiado encadena los pasos; salirse lo apaga. */
  const [guiando, setGuiando] = useState(false);

  const nombreNegocio =
    me?.memberships.find(m => String(m.companyCode) === companyCode)?.companyName ?? 'tu negocio';
  const claveBienvenida = companyCode ? `bs_bienvenida_${companyCode}` : null;

  // La bienvenida sale una sola vez por empresa: la segunda ya sería un peaje.
  useEffect(() => {
    if (!claveBienvenida || !data || data.completados > 0) return;
    try {
      if (window.localStorage.getItem(claveBienvenida)) return;
    } catch {
      return;
    }
    setAbierto('bienvenida');
    setGuiando(true);
  }, [claveBienvenida, data]);

  const marcarBienvenidaVista = () => {
    try {
      if (claveBienvenida) window.localStorage.setItem(claveBienvenida, '1');
    } catch {
      /* modo privado: se vuelve a mostrar, no es grave */
    }
  };

  /**
   * Cuál sigue después de `id`. Se calcula sobre el orden fijo y no sobre el
   * `siguiente` del backend a propósito: al terminar un paso, su refetch aún no
   * llegó, y preguntarle al servidor devolvería el que se acaba de completar.
   */
  const siguienteDe = useCallback(
    (id: PasoOnboarding['id'] | null): Abierto => {
      const desde = id ? RECORRIDO.indexOf(id) + 1 : 0;
      for (let i = desde; i < RECORRIDO.length; i++) {
        const paso = data?.pasos.find(p => p.id === RECORRIDO[i]);
        if (paso && !paso.hecho) return RECORRIDO[i];
      }
      return 'final';
    },
    [data],
  );

  const avanzar = (desde: PasoOnboarding['id'] | null) => {
    if (!guiando) {
      setAbierto(null);
      return;
    }
    setAbierto(siguienteDe(desde));
  };

  /** Cerrar a mano termina el recorrido: nadie debería sentirse encerrado. */
  const salir = () => {
    setAbierto(null);
    setGuiando(false);
  };

  if (isLoading) {
    return (
      <div className={styles.pagina}>
        <div className={styles.tarjeta}>
          <p className={styles.cargando}>Revisando cómo va tu negocio…</p>
        </div>
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className={styles.pagina}>
        <div className={styles.tarjeta}>
          <p className={styles.cargando}>
            No pudimos revisar el estado de tu negocio. Intenta recargar la página.
          </p>
        </div>
      </div>
    );
  }

  const { pasos, puedeVender, activo, completados, total } = data;
  const pct = Math.round((completados / total) * 100);
  const pendientes = RECORRIDO.filter(id => !pasos.find(p => p.id === id)?.hecho).length;

  const abrir = (id: PasoOnboarding['id']) => {
    // Abrir un paso suelto desde la lista no arranca el recorrido completo:
    // quien vuelve a editar su carta no quiere que lo lleven a WhatsApp después.
    setGuiando(false);
    setAbierto(id);
  };

  const membresia = me?.memberships.find(m => String(m.companyCode) === companyCode);
  const dominioTienda = `${membresia?.companySlug ?? 'tu-negocio'}.skipfee.co`;

  const progresoDe = (id: PasoOnboarding['id']) =>
    guiando ? { actual: RECORRIDO.indexOf(id) + 1, total: RECORRIDO.length } : undefined;

  const titular = !puedeVender
    ? 'Faltan unos pasos'
    : activo
      ? '¡Ya estás vendiendo!'
      : 'Todo listo para vender';

  const bajada = !puedeVender
    ? 'Termina los marcados como necesarios: sin ellos tu bot no puede cerrar un pedido.'
    : activo
      ? 'Tu bot atiende y los pedidos entran al tablero.'
      : 'Escríbele a tu propio WhatsApp para estrenarlo.';

  return (
    <div className={styles.pagina}>
      <section className={styles.principal}>
        {/* Contador, titular y acción en una sola línea: apilados ocupaban un
            tercio de la pantalla para decir "vas 3 de 5". */}
        <header className={styles.cabecera}>
          <span className={styles.contador} data-completo={completados >= total}>
            {completados}
            <i>/{total}</i>
          </span>

          <span className={styles.cabeceraTexto}>
            <b>{titular}</b>
            <small>{bajada}</small>
          </span>

          {pendientes > 0 && (
            <button
              type="button"
              className={styles.retomar}
              onClick={() => {
                setGuiando(true);
                setAbierto(siguienteDe(null));
              }}
            >
              {completados === 0 ? 'Empezar' : 'Seguir'}
              <Icon.ArrowRight size={15} />
            </button>
          )}
        </header>

        <div
          className={styles.barra}
          role="progressbar"
          aria-valuenow={pct}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <span style={{ transform: `translateX(${pct - 100}%)` }} />
        </div>

        <ol className={styles.pasos}>
          {pasos.map((p, i) => {
            const enRecorrido = RECORRIDO.includes(p.id);
            const donde = DONDE_VIVE[p.id];
            return (
              <li key={p.id} className={styles.paso} data-hecho={p.hecho}>
                <span className={styles.marca} aria-hidden="true">
                  {p.hecho ? <Icon.Check size={14} /> : i + 1}
                </span>

                <span className={styles.texto}>
                  <b>
                    {p.titulo}
                    {p.obligatorio && !p.hecho && <i className={styles.necesario}>necesario</i>}
                  </b>
                  {/* Lo hecho se resume en su dato ("3 productos"); lo pendiente
                      explica por qué importa. Repetir la descripción de algo ya
                      resuelto solo gasta alto. */}
                  <small>{p.hecho ? (p.detalle ?? 'Listo') : (p.detalle ?? p.descripcion)}</small>
                </span>

                <span className={styles.acciones}>
                  {/* Estos enlaces van a pantallas que el candado tiene
                      cerradas hasta que el negocio pueda vender: mostrarlos
                      antes es ofrecer una puerta que rebota. */}
                  {p.hecho && donde && puedeVender && (
                    <Link className={styles.enlace} href={donde.href}>
                      {donde.label}
                    </Link>
                  )}
                  {enRecorrido && (
                    <button
                      type="button"
                      className={styles.accion}
                      data-tono={p.hecho ? 'suave' : 'fuerte'}
                      onClick={() => abrir(p.id)}
                    >
                      {p.hecho ? 'Editar' : 'Hacerlo'}
                    </button>
                  )}
                </span>
              </li>
            );
          })}
        </ol>
      </section>

      {/* El costado usa el ancho que sobraba y responde las preguntas que
          aparecen mientras uno configura: por qué está bloqueado el panel,
          cuál va a ser mi tienda, y a quién le escribo si me atoro. */}
      <aside className={styles.lateral}>
        <div className={styles.ficha}>
          <h2>
            <Icon.Lock size={15} /> El panel se abre al terminar
          </h2>
          <p>
            No es un candado por castigo: un tablero sin pedidos y unos reportes en cero no te
            enseñan nada todavía. Cuando tu bot pueda cerrar un pedido, aparece todo.
          </p>
        </div>

        <div className={styles.ficha}>
          <h2>
            <Icon.ShoppingBag size={15} /> Tu tienda
          </h2>
          <p>Es la página donde tus clientes arman el pedido y pagan.</p>
          <code className={styles.dominio}>{dominioTienda}</code>
        </div>

        {/* Lo que ya existe, contado con sus propios datos. Ver "3 productos ·
            1 zona" pesa más que cualquier frase de aliento. */}
        <div className={styles.ficha}>
          <h2>
            <Icon.Layers size={15} /> Lo que llevas
          </h2>
          <ul className={styles.resumen}>
            {RECORRIDO.map(id => {
              const p = pasos.find(x => x.id === id);
              if (!p) return null;
              return (
                <li key={id} data-hecho={p.hecho}>
                  <span>{ETIQUETA_CORTA[id]}</span>
                  <b>{p.hecho ? (p.detalle ?? 'Listo') : 'Falta'}</b>
                </li>
              );
            })}
          </ul>
        </div>

        {/* Cómo se ve el trabajo cuando esto termine. Nadie configura bien algo
            cuyo resultado no puede imaginar. */}
        <div className={styles.ficha}>
          <h2>
            <Icon.MessageCircle size={15} /> Cómo va a funcionar
          </h2>
          <ol className={styles.flujo}>
            <li>Tu cliente le escribe a tu WhatsApp.</li>
            <li>El bot lo atiende, arma el pedido y le cobra.</li>
            <li>El pedido te llega al tablero, listo para cocinar.</li>
          </ol>
        </div>

        {SOPORTE && (
          <a
            className={styles.fichaEnlace}
            href={`https://wa.me/${SOPORTE}?text=${encodeURIComponent(
              'Hola, estoy montando mi negocio en Skipfee y necesito una mano.',
            )}`}
            target="_blank"
            rel="noreferrer"
          >
            <Icon.MessageCircle size={17} />
            <span>
              <b>¿Se te atravesó algo?</b>
              <small>Escríbenos por WhatsApp y lo montamos contigo.</small>
            </span>
          </a>
        )}
      </aside>

      <BienvenidaModal
        open={abierto === 'bienvenida'}
        nombre={nombreNegocio}
        onEmpezar={() => {
          marcarBienvenidaVista();
          setAbierto(siguienteDe(null));
        }}
        onCerrar={() => {
          marcarBienvenidaVista();
          salir();
        }}
      />

      <DatosNegocioModal
        open={abierto === 'negocio'}
        onClose={salir}
        onCompletado={() => avanzar('negocio')}
        progreso={progresoDe('negocio')}
      />
      <CartaModal
        open={abierto === 'carta'}
        onClose={salir}
        onCompletado={() => avanzar('carta')}
        progreso={progresoDe('carta')}
      />
      <PrimeraZonaModal
        open={abierto === 'zona'}
        onClose={salir}
        onCompletado={() => avanzar('zona')}
        progreso={progresoDe('zona')}
      />
      <WhatsAppModal
        open={abierto === 'whatsapp'}
        onClose={salir}
        onCompletado={() => avanzar('whatsapp')}
        progreso={progresoDe('whatsapp')}
      />
      {/* "Ver mi panel" lleva al tablero de verdad. Es el relevo: al salir de
          Primeros pasos el panel ya está sin candado, y el recorrido por las
          pantallas arranca ahí. Dejarlo cerrando el modal sobre esta misma
          pantalla lo dejaba mirando la lista que acaba de terminar. */}
      <FinalModal
        open={abierto === 'final'}
        nombre={nombreNegocio}
        onClose={salir}
        onVerPanel={() => {
          salir();
          router.push('/pedidos');
        }}
      />
    </div>
  );
}
