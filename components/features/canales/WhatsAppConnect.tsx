'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Icon } from '@/lib/icons';
import { Panel } from '@/components/ui/Panel';
import { Field } from '@/components/ui/Field';
import { qrToDataUrl, type WhatsAppProviderKind } from '@/lib/api';
import {
  useConnectWhatsAppSession,
  useLogoutWhatsAppSession,
  useUpdateWhatsAppProvider,
  useWhatsAppProvider,
  useWhatsAppSession,
} from '@/lib/queries';
import styles from './whatsapp.module.css';

/**
 * Conexión del WhatsApp del negocio.
 *
 * La idea que ordena toda la pantalla: **vincular no es recibir**. Un QR
 * escaneado deja la sesión "conectada" aunque el servidor nunca nos entregue
 * los mensajes, y entonces el operario cree que ya vende y no le entra nada.
 * Por eso el estado se cuenta en tres hitos separados y el último —tráfico
 * real— es el único que dice "listo".
 */

/** El QR de WhatsApp caduca cerca del minuto. */
const QR_TTL_S = 60;

type Stage = 'servidor' | 'vinculado' | 'recibiendo';

function StageRail({
  done,
  current,
  managed,
}: {
  done: Stage[];
  current: Stage | null;
  /** Servidor compartido de Skipfee: el negocio no configura nada. */
  managed: boolean;
}) {
  const all: Array<{ id: Stage; label: string; sub: string }> = [
    { id: 'servidor', label: 'Servidor', sub: 'Dónde vive tu WhatsApp' },
    { id: 'vinculado', label: 'WhatsApp vinculado', sub: 'Escaneaste el código' },
    { id: 'recibiendo', label: 'Recibiendo pedidos', sub: 'Llegó el primer mensaje' },
  ];
  // Con servidor gestionado el paso "Servidor" no es del negocio: lo ponemos
  // nosotros. Mostrarlo sería pedirle al restaurante que celebre un trámite que
  // nunca hizo.
  const steps = managed ? all.filter(s => s.id !== 'servidor') : all;
  return (
    <ol className={styles.rail}>
      {steps.map((s, i) => {
        const isDone = done.includes(s.id);
        const isCurrent = current === s.id;
        return (
          <li
            key={s.id}
            className={styles.railStep}
            data-state={isDone ? 'done' : isCurrent ? 'current' : 'todo'}
          >
            <span className={styles.railMark} aria-hidden="true">
              {isDone ? <Icon.Check size={13} /> : i + 1}
            </span>
            <span className={styles.railText}>
              <b>{s.label}</b>
              <small>{s.sub}</small>
            </span>
          </li>
        );
      })}
    </ol>
  );
}

function ProviderChoice({
  value,
  onPick,
  busy,
}: {
  value: WhatsAppProviderKind;
  onPick: (p: WhatsAppProviderKind) => void;
  busy: boolean;
}) {
  const options: Array<{
    id: WhatsAppProviderKind;
    name: string;
    lead: string;
    pros: string[];
    cons: string[];
  }> = [
    {
      id: 'kapso',
      name: 'WhatsApp oficial',
      lead: 'La vía de Meta. Es la recomendada.',
      pros: ['Tu nombre comercial visible', 'Botones y listas en el chat', 'La cuenta no corre riesgo'],
      cons: ['Verificación con Meta antes de vender'],
    },
    {
      id: 'evolution',
      name: 'Vincular por código QR',
      lead: 'Como WhatsApp Web. Empiezas hoy mismo.',
      pros: ['Listo en minutos, sin trámites', 'Sirve con el número que ya usas'],
      cons: ['Meta puede bloquear el número', 'El menú va en texto, sin botones'],
    },
  ];

  return (
    <div className={styles.choice} role="radiogroup" aria-label="Cómo conectar WhatsApp">
      {options.map(o => {
        const active = value === o.id;
        return (
          <button
            key={o.id}
            type="button"
            role="radio"
            aria-checked={active}
            disabled={busy}
            className={styles.choiceOpt}
            data-active={active}
            onClick={() => !active && onPick(o.id)}
          >
            <span className={styles.choiceHead}>
              <span className={styles.choiceDot} aria-hidden="true" />
              <b>{o.name}</b>
              {o.id === 'kapso' && <span className={styles.rec}>Recomendada</span>}
            </span>
            <span className={styles.choiceLead}>{o.lead}</span>
            <ul className={styles.choiceList}>
              {o.pros.map(p => (
                <li key={p} data-kind="pro">
                  <Icon.Check size={13} />
                  {p}
                </li>
              ))}
              {o.cons.map(c => (
                <li key={c} data-kind="con">
                  <Icon.AlertTriangle size={13} />
                  {c}
                </li>
              ))}
            </ul>
          </button>
        );
      })}
    </div>
  );
}

export function WhatsAppConnect() {
  const providerQ = useWhatsAppProvider();
  const cfg = providerQ.data;
  const isEvolution = cfg?.provider === 'evolution';

  const sessionQ = useWhatsAppSession(!!isEvolution && !!cfg?.evolution.configured);
  const updateProvider = useUpdateWhatsAppProvider();
  const connect = useConnectWhatsAppSession();
  const logout = useLogoutWhatsAppSession();

  const [form, setForm] = useState({ baseUrl: '', apiKey: '', instance: '' });
  const [editing, setEditing] = useState(false);
  const [qrLeft, setQrLeft] = useState(QR_TTL_S);
  const autoRefreshed = useRef(false);

  const managed = cfg?.evolution.managed ?? true;
  const session = sessionQ.data?.session;
  const lastInboundAt = sessionQ.data?.lastInboundAt ?? null;
  const qr = qrToDataUrl(connect.data?.session.qr ?? session?.qr);
  const linked = session?.status === 'connected';
  const receiving = linked && !!lastInboundAt;

  // Cuenta regresiva del QR: caduca al minuto y hay que pedir uno nuevo.
  useEffect(() => {
    if (!qr || linked) return;
    setQrLeft(QR_TTL_S);
    autoRefreshed.current = false;
    const t = setInterval(() => setQrLeft(s => Math.max(0, s - 1)), 1000);
    return () => clearInterval(t);
  }, [qr, linked]);

  // Un solo auto-refresco: si tras ese minuto sigue sin escanear, mejor que
  // pida el código a mano que dejar el navegador pidiendo QR eternamente.
  useEffect(() => {
    if (qrLeft === 0 && !linked && !autoRefreshed.current && !connect.isPending) {
      autoRefreshed.current = true;
      connect.mutate();
    }
  }, [qrLeft, linked, connect]);

  const serverReady = cfg?.evolution.configured ?? false;
  const stages = useMemo(() => {
    const done: Stage[] = [];
    if (serverReady) done.push('servidor');
    if (linked) done.push('vinculado');
    if (receiving) done.push('recibiendo');
    const current: Stage | null = !serverReady
      ? 'servidor'
      : !linked
        ? 'vinculado'
        : !receiving
          ? 'recibiendo'
          : null;
    return { done, current };
  }, [serverReady, linked, receiving]);

  if (providerQ.isLoading) {
    return (
      <Panel title="WhatsApp del negocio">
        <div className={styles.loading} role="status">
          Cargando la configuración del canal…
        </div>
      </Panel>
    );
  }

  if (providerQ.isError || !cfg) {
    return (
      <Panel title="WhatsApp del negocio">
        <div className={styles.alert} data-tone="error" role="alert">
          <Icon.AlertCircle size={16} />
          <div>
            <b>No pudimos leer la configuración del canal.</b>
            <p>{providerQ.error?.message ?? 'Intenta recargar la página.'}</p>
          </div>
        </div>
      </Panel>
    );
  }

  const saveServer = () => {
    updateProvider.mutate(
      {
        provider: 'evolution',
        evolution: {
          baseUrl: form.baseUrl.trim(),
          apiKey: form.apiKey.trim(),
          instance: form.instance.trim(),
        },
      },
      { onSuccess: () => setEditing(false) },
    );
  };

  // Con servidor gestionado por Skipfee el negocio no ve formulario alguno:
  // esos datos son infraestructura nuestra, no del restaurante.
  const showServerForm =
    isEvolution && !cfg.evolution.managed && (!cfg.evolution.configured || editing);

  return (
    <Panel
      title="WhatsApp del negocio"
      meta={
        <span className={styles.headState} data-state={receiving ? 'live' : linked ? 'linked' : 'off'}>
          <span className={styles.headDot} aria-hidden="true" />
          {receiving ? 'Recibiendo pedidos' : linked ? 'Vinculado, sin tráfico' : 'Sin conectar'}
        </span>
      }
    >
      <div className={styles.wrap}>
        <ProviderChoice
          value={cfg.provider}
          busy={updateProvider.isPending}
          onPick={p => updateProvider.mutate({ provider: p })}
        />

        {cfg.provider === 'kapso' ? (
          <div className={styles.kapso}>
            <div className={styles.kapsoBody}>
              <h3>Verificación con Meta</h3>
              <p>
                El número queda a nombre de tu negocio y los clientes ven tu marca en el
                chat. Necesitas una cuenta de WhatsApp Business verificada; el equipo de
                Skipfee hace el trámite contigo.
              </p>
              <p className={styles.kapsoNote}>
                <Icon.Info size={14} />
                Este canal no se vincula con un código: no hay sesión que se caiga ni QR que
                volver a escanear.
              </p>
            </div>
            <dl className={styles.kv}>
              <div>
                <dt>Estado</dt>
                <dd>{cfg.kapso.configured ? 'Credenciales cargadas' : 'Falta configurar'}</dd>
              </div>
              <div>
                <dt>Número</dt>
                <dd className={styles.mono}>{cfg.kapso.phoneNumberId ?? '—'}</dd>
              </div>
            </dl>
          </div>
        ) : (
          <div className={styles.evo}>
            <StageRail done={stages.done} current={stages.current} managed={managed} />

            <div className={styles.evoMain}>
              {managed && !serverReady ? (
                /* Servidor gestionado que Skipfee aún no habilitó. Sin esto el
                   operario vería un botón de QR que solo puede fallar. */
                <div className={styles.waiting}>
                  <h3>Este canal todavía no está disponible</h3>
                  <p>
                    La conexión por código QR corre sobre la infraestructura de
                    Skipfee y aún no está habilitada para tu cuenta. Escríbenos y la
                    activamos; mientras tanto puedes operar con WhatsApp oficial.
                  </p>
                </div>
              ) : showServerForm ? (
                <div className={styles.form}>
                  <h3>Datos de tu servidor</h3>
                  <p className={styles.formLead}>
                    Los entrega quien te montó el servidor de WhatsApp. Se guardan cifrados y
                    no se vuelven a mostrar.
                  </p>
                  <Field label="Dirección del servidor" htmlFor="evo-url" required>
                    <input
                      id="evo-url"
                      className="input"
                      placeholder="https://wa.tunegocio.co"
                      value={form.baseUrl}
                      onChange={e => setForm(f => ({ ...f, baseUrl: e.target.value }))}
                    />
                  </Field>
                  <Field label="Llave de acceso" htmlFor="evo-key" required>
                    <input
                      id="evo-key"
                      className="input"
                      type="password"
                      placeholder="••••••••"
                      value={form.apiKey}
                      onChange={e => setForm(f => ({ ...f, apiKey: e.target.value }))}
                    />
                  </Field>
                  <Field
                    label="Nombre de la instancia"
                    htmlFor="evo-inst"
                    required
                    hint="Solo letras, números, punto, guion y guion bajo."
                  >
                    <input
                      id="evo-inst"
                      className="input"
                      placeholder="bros-and-subs"
                      value={form.instance}
                      onChange={e => setForm(f => ({ ...f, instance: e.target.value }))}
                    />
                  </Field>
                  <div className={styles.formActions}>
                    <button
                      type="button"
                      className="btn btn-primary sm sq"
                      disabled={
                        updateProvider.isPending ||
                        !form.baseUrl.trim() ||
                        !form.apiKey.trim() ||
                        !form.instance.trim()
                      }
                      onClick={saveServer}
                    >
                      {updateProvider.isPending ? 'Guardando…' : 'Guardar y continuar'}
                    </button>
                    {cfg.evolution.configured && (
                      <button
                        type="button"
                        className="btn btn-ghost sm sq"
                        onClick={() => setEditing(false)}
                      >
                        Cancelar
                      </button>
                    )}
                  </div>
                </div>
              ) : receiving ? (
                <div className={styles.done}>
                  <span className={styles.doneMark} aria-hidden="true">
                    <Icon.CheckCircle size={22} />
                  </span>
                  <h3>Tu WhatsApp está recibiendo pedidos</h3>
                  <p>
                    Llegó el primer mensaje {relTime(lastInboundAt)}. El bot ya está
                    atendiendo: los pedidos entran solos al tablero.
                  </p>
                  <div className={styles.doneActions}>
                    {!managed && (
                      <button
                        type="button"
                        className="btn btn-ghost sm sq"
                        onClick={() => setEditing(true)}
                      >
                        Cambiar servidor
                      </button>
                    )}
                    <button
                      type="button"
                      className="btn btn-ghost sm sq"
                      disabled={logout.isPending}
                      onClick={() => logout.mutate()}
                    >
                      {logout.isPending ? 'Desvinculando…' : 'Desvincular'}
                    </button>
                  </div>
                </div>
              ) : linked ? (
                <div className={styles.waiting}>
                  <h3>Vinculado. Falta la primera prueba.</h3>
                  <p>
                    El teléfono quedó conectado{session?.phone ? ` (${session.phone})` : ''}, pero
                    todavía no ha entrado ningún mensaje. <b>Escríbele al WhatsApp del negocio
                    desde otro celular</b> y esta pantalla te confirma cuando llegue.
                  </p>
                  <div className={styles.pulseRow} role="status" aria-live="polite">
                    <span className={styles.pulse} aria-hidden="true" />
                    Esperando el primer mensaje…
                  </div>
                  <p className={styles.hintLow}>
                    Si escribes y no pasa nada en un minuto, vuelve a generar el código: el
                    servidor pudo quedar sin saber a dónde entregarnos los mensajes.
                  </p>
                  <div className={styles.doneActions}>
                    <button
                      type="button"
                      className="btn btn-ghost sm sq"
                      disabled={connect.isPending}
                      onClick={() => connect.mutate()}
                    >
                      Reintentar la conexión
                    </button>
                    <button
                      type="button"
                      className="btn btn-ghost sm sq"
                      disabled={logout.isPending}
                      onClick={() => logout.mutate()}
                    >
                      Desvincular
                    </button>
                  </div>
                </div>
              ) : (
                <div className={styles.link}>
                  <div className={styles.qrCol}>
                    <div className={styles.qrFrame} data-empty={!qr}>
                      {qr ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={qr} alt="Código QR para vincular WhatsApp" width={220} height={220} />
                      ) : (
                        <span className={styles.qrPlaceholder}>
                          <Icon.MessageCircle size={26} />
                          El código aparece aquí
                        </span>
                      )}
                    </div>
                    {qr && !linked && (
                      <p className={styles.qrTtl} role="status" aria-live="polite">
                        {qrLeft > 0
                          ? `El código vence en ${qrLeft} s`
                          : 'El código venció. Genera uno nuevo.'}
                      </p>
                    )}
                  </div>

                  <div className={styles.linkCol}>
                    <h3>Vincula tu WhatsApp</h3>
                    <ol className={styles.steps}>
                      <li>Abre WhatsApp en el celular del negocio.</li>
                      <li>
                        Entra a <b>Ajustes</b> → <b>Dispositivos vinculados</b>.
                      </li>
                      <li>
                        Toca <b>Vincular un dispositivo</b> y apunta al código.
                      </li>
                    </ol>
                    <button
                      type="button"
                      className="btn btn-primary sm sq"
                      disabled={connect.isPending}
                      onClick={() => connect.mutate()}
                    >
                      {connect.isPending
                        ? 'Generando…'
                        : qr
                          ? 'Generar un código nuevo'
                          : 'Generar código'}
                    </button>
                    {connect.isError && (
                      <div className={styles.alert} data-tone="error" role="alert">
                        <Icon.AlertCircle size={16} />
                        <div>
                          <b>No pudimos hablar con tu servidor.</b>
                          <p>{connect.error.message}</p>
                        </div>
                      </div>
                    )}
                    {connect.data?.webhook && !connect.data.webhook.registered && (
                      <div className={styles.alert} data-tone="warn" role="alert">
                        <Icon.AlertTriangle size={16} />
                        <div>
                          <b>El servidor no quedó avisado de dónde entregarnos los mensajes.</b>
                          <p>
                            Puedes escanear igual, pero no entrarán pedidos hasta resolverlo.
                          </p>
                        </div>
                      </div>
                    )}
                    <p className={styles.risk}>
                      <Icon.AlertTriangle size={14} />
                      Este canal no es oficial de Meta. Es la forma rápida de arrancar, pero el
                      número puede ser bloqueado; para operar en firme, pásate a WhatsApp
                      oficial.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </Panel>
  );
}

/** "hace 3 minutos" en es-CO, sin traer una librería de fechas. */
function relTime(iso: string | null): string {
  if (!iso) return '';
  const diff = Date.now() - new Date(iso).getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return 'hace un momento';
  if (min < 60) return `hace ${min} ${min === 1 ? 'minuto' : 'minutos'}`;
  const h = Math.floor(min / 60);
  if (h < 24) return `hace ${h} ${h === 1 ? 'hora' : 'horas'}`;
  const d = Math.floor(h / 24);
  return `hace ${d} ${d === 1 ? 'día' : 'días'}`;
}
