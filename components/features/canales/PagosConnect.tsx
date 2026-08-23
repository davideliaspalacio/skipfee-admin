'use client';

import { useState } from 'react';
import { Icon } from '@/lib/icons';
import { Panel } from '@/components/ui/Panel';
import { Tag } from '@/components/ui/Chip';
import { usePayments, useUpdatePayments } from '@/lib/queries';
import styles from './pagos.module.css';

/**
 * Pasarela de pagos.
 *
 * Toda empresa nueva arranca en modo prueba, y eso no es una cortesía: Wompi
 * exige RUT, cuenta bancaria a nombre del comercio, selfie y contrato firmado,
 * y el 89,7% de los micronegocios colombianos ni siquiera tiene registro en
 * Cámara de Comercio. Sin pasarela de prueba, el dueño no puede ver funcionar
 * lo que compró hasta terminar un trámite bancario que dura semanas.
 *
 * El cambio a Wompi es explícito y se valida contra las llaves cargadas: no se
 * deja pasar sin las tres, porque ese error se descubriría cuando un cliente
 * intenta pagar.
 *
 * Entre "simulado" y "cobrando" hay un tercer estado que no es un modo aparte:
 * Wompi con llaves `pub_test_`. El pago se ve y se comporta como el real —el
 * widget, las tarjetas, el webhook— pero no mueve dinero. El entorno lo decide
 * el prefijo de la llave, así que la etiqueta no puede mentir.
 */
export function PagosConnect() {
  const { data, isLoading } = usePayments();
  const guardar = useUpdatePayments();
  const [abierto, setAbierto] = useState(false);
  const [publicKey, setPublicKey] = useState('');
  const [integrity, setIntegrity] = useState('');
  const [events, setEvents] = useState('');

  if (isLoading || !data) {
    return (
      <Panel title="Cómo te pagan">
        <div className={styles.cargando}>Revisando tu pasarela…</div>
      </Panel>
    );
  }

  const enPrueba = data.mode === 'mock';
  // Con llaves `pub_test_` el widget de Wompi corre contra su sandbox: se ve y
  // se comporta igual, pero no mueve un peso. Es el paso intermedio entre la
  // pasarela simulada y cobrar de verdad.
  const enSandbox = data.entorno === 'pruebas';
  const puedeGuardar =
    !guardar.isPending &&
    (publicKey.trim().length > 9 || integrity.trim().length > 9 || events.trim().length > 9);

  const guardarLlaves = () => {
    const wompi: Record<string, string> = {};
    if (publicKey.trim()) wompi.publicKey = publicKey.trim();
    if (integrity.trim()) wompi.integritySecret = integrity.trim();
    if (events.trim()) wompi.eventsSecret = events.trim();
    guardar.mutate(
      { wompi },
      {
        onSuccess: () => {
          setPublicKey('');
          setIntegrity('');
          setEvents('');
        },
      },
    );
  };

  return (
    <Panel
      title="Cómo te pagan"
      meta={
        enPrueba ? (
          <Tag tone="sun">Pasarela simulada</Tag>
        ) : enSandbox ? (
          <Tag tone="sun">Wompi · pruebas</Tag>
        ) : (
          <Tag tone="green">Cobrando de verdad</Tag>
        )
      }
    >
      <div className={styles.wrap}>
        <div className={styles.modos}>
          <button
            type="button"
            className={styles.modo}
            data-activo={enPrueba}
            disabled={guardar.isPending || enPrueba}
            onClick={() => guardar.mutate({ mode: 'mock' })}
          >
            <span className={styles.modoTitulo}>
              <Icon.Sliders size={15} /> Pasarela de prueba
            </span>
            <span className={styles.modoTexto}>
              El pedido se marca pagado sin cobrar un peso. Sirve para recorrer todo el flujo —bot,
              carrito, cocina, entrega— antes de tener cuenta a nombre del negocio.
            </span>
          </button>

          <button
            type="button"
            className={styles.modo}
            data-activo={!enPrueba}
            disabled={guardar.isPending || !enPrueba || !data.wompi.configured}
            onClick={() => guardar.mutate({ mode: 'real' })}
          >
            <span className={styles.modoTitulo}>
              <Icon.DollarSign size={15} /> Wompi
              {enSandbox && <span className={styles.etiqueta}>pruebas</span>}
            </span>
            <span className={styles.modoTexto}>
              {enSandbox
                ? 'Tus llaves son de prueba: el pago se ve y se comporta como el real, pero no mueve dinero. Cuando quieras cobrar, cambia las llaves por las de producción.'
                : data.wompi.configured
                  ? 'Tus clientes pagan de verdad y la plata cae en tu cuenta.'
                  : 'Carga tus llaves aquí abajo. Con las de prueba (pub_test_…) recorres el pago completo sin mover dinero.'}
            </span>
          </button>
        </div>

        {(enPrueba || enSandbox) && (
          <p className={styles.aviso}>
            <Icon.AlertTriangle size={15} />
            <span>
              {enPrueba ? (
                <>
                  Con la pasarela simulada, <b>ningún pedido cobra dinero</b>. Cambia a Wompi antes
                  de publicar tu número a clientes reales.
                </>
              ) : (
                <>
                  Estás con llaves de prueba de Wompi: <b>ningún pedido cobra dinero</b>. Paga con
                  las tarjetas de prueba de Wompi (la 4242 4242 4242 4242 aprueba). Para cobrar de
                  verdad, reemplaza las tres llaves por las de producción.
                </>
              )}
            </span>
          </p>
        )}

        <div className={styles.llaves}>
          <button
            type="button"
            className={styles.desplegar}
            onClick={() => setAbierto(v => !v)}
            aria-expanded={abierto}
          >
            <Icon.ChevronDown size={14} />
            {data.wompi.configured ? 'Cambiar mis llaves de Wompi' : 'Cargar mis llaves de Wompi'}
          </button>

          {abierto && (
            <div className={styles.form}>
              <p className={styles.formAyuda}>
                Están en tu panel de Wompi, en <b>Desarrolladores → Llaves</b>. Las que empiezan por{' '}
                <b>pub_test_</b> son de prueba y no mueven dinero; las <b>pub_prod_</b> cobran de
                verdad. Los secretos no se vuelven a mostrar: si los cambias, se reemplazan.
              </p>

              <label className={styles.campo}>
                <span>Llave pública</span>
                <input
                  className="input"
                  value={publicKey}
                  placeholder={data.wompi.publicKey ?? 'pub_test_… o pub_prod_…'}
                  onChange={e => setPublicKey(e.target.value)}
                />
              </label>

              <label className={styles.campo}>
                <span>Secreto de integridad {data.wompi.hasIntegritySecret && '· cargado'}</span>
                <input
                  className="input"
                  type="password"
                  value={integrity}
                  placeholder="test_integrity_… o prod_integrity_…"
                  onChange={e => setIntegrity(e.target.value)}
                />
              </label>

              <label className={styles.campo}>
                <span>Secreto de eventos {data.wompi.hasEventsSecret && '· cargado'}</span>
                <input
                  className="input"
                  type="password"
                  value={events}
                  placeholder="test_events_… o prod_events_…"
                  onChange={e => setEvents(e.target.value)}
                />
              </label>

              <div className={styles.formPie}>
                <button
                  type="button"
                  className="btn btn-primary sm sq"
                  disabled={!puedeGuardar}
                  onClick={guardarLlaves}
                >
                  {guardar.isPending ? 'Guardando…' : 'Guardar llaves'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </Panel>
  );
}
