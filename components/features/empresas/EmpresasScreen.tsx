'use client';

import { useMemo, useState } from 'react';
import { Icon } from '@/lib/icons';
import { Modal } from '@/components/ui/Modal';
import { Field } from '@/components/ui/Field';
import { Panel } from '@/components/ui/Panel';
import { Tag } from '@/components/ui/Chip';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { PageHeader, EmptyState } from '@/components/ui/Feedback';
import {
  usePlatformCompanies,
  useCreateCompany,
  useUpdateCompany,
  usePlatformSettings,
  usePatchPlatformSettings,
  useActiveRole,
} from '@/lib/queries';
import { isPlatformOwner } from '@/lib/roles';
import type { Company, CompanyPlan } from '@/lib/api';
import styles from './empresas.module.css';

const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

function makeTempPassword(): string {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const bytes = new Uint8Array(6);
  if (typeof window !== 'undefined' && window.crypto?.getRandomValues) {
    window.crypto.getRandomValues(bytes);
  } else {
    for (let i = 0; i < bytes.length; i++) bytes[i] = Math.floor(Math.random() * alphabet.length);
  }
  const code = Array.from(bytes, b => alphabet[b % alphabet.length]).join('');
  return `Skipfee-${code}!2026`;
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' });
}

/** Slug sugerido a partir del nombre (minúsculas, guiones, sin acentos). */
function slugify(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '') // quita marcas diacríticas (acentos)
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Pantalla "Empresas" (solo owner de la plataforma). Lista todas las empresas y
 * permite crear nuevas (con su primer super_admin). El gate por rol vive aquí y
 * en `visibleScreenIds`/AdminShell; esta pantalla además se autoprotege por si
 * se navega por URL directa.
 */
export function EmpresasScreen() {
  const role = useActiveRole();
  const owner = isPlatformOwner(role);

  const { data, isLoading, error, isFetching } = usePlatformCompanies();
  const [creating, setCreating] = useState(false);
  // Se guarda el id, no la fila: la ficha muta la empresa (plan, estado,
  // prueba) y con una copia congelada el modal seguiría mostrando el estado
  // anterior hasta cerrarlo y volver a abrirlo.
  const [fichaId, setFichaId] = useState<string | null>(null);

  const companies = useMemo<Company[]>(() => data ?? [], [data]);

  if (!owner) {
    return (
      <div className={styles.unauth}>
        <EmptyState
          icon={<Icon.AlertTriangle size={22} />}
          title="No autorizado"
          sub="Esta sección es solo para el owner de la plataforma."
        />
      </div>
    );
  }

  const columns: Column<Company>[] = [
    {
      key: 'code',
      label: 'Código',
      num: true,
      render: c => <span className={styles.code}>{c.code}</span>,
    },
    {
      key: 'name',
      label: 'Empresa',
      render: c => (
        <div className={styles.who}>
          <span className={styles.name}>{c.name}</span>
          <span className={styles.slug}>{c.slug}</span>
        </div>
      ),
    },
    {
      key: 'status',
      label: 'Estado',
      render: c =>
        c.status === 'active' ? (
          <Tag tone="green">Activa</Tag>
        ) : (
          <Tag tone="coral">Suspendida</Tag>
        ),
    },
    {
      key: 'plan',
      label: 'Suscripción',
      render: c => <Suscripcion company={c} />,
    },
    {
      key: 'next_order_number',
      label: 'Pedidos',
      num: true,
      render: c => <span>{Math.max(0, c.next_order_number - 1)}</span>,
    },
    {
      key: 'created_at',
      label: 'Creada',
      render: c => <span>{formatDate(c.created_at)}</span>,
    },
    {
      key: 'acciones',
      label: '',
      render: c => (
        <button type="button" className="btn btn-ghost sm sq" onClick={() => setFichaId(c.id)}>
          Administrar
        </button>
      ),
    },
  ];

  const meta = error ? (
    <span style={{ color: 'var(--coral)' }}>Error al cargar</span>
  ) : isLoading ? (
    <span>Cargando…</span>
  ) : (
    <span>
      {companies.length} {companies.length === 1 ? 'empresa' : 'empresas'}
      {isFetching ? ' · actualizando…' : ''}
    </span>
  );

  const ficha = fichaId ? (companies.find(c => c.id === fichaId) ?? null) : null;

  const empty = error ? (
    <EmptyState
      icon={<Icon.Layers size={22} />}
      title="No se pudieron cargar las empresas"
      sub="Revisa tu conexión con el backend e inténtalo de nuevo."
    />
  ) : isLoading ? (
    <EmptyState icon={<Icon.Layers size={22} />} title="Cargando empresas…" />
  ) : (
    <EmptyState
      icon={<Icon.Layers size={22} />}
      title="Todavía no hay empresas"
      sub="Crea la primera con el botón “Nueva empresa”."
    />
  );

  return (
    <div className={styles.wrap}>
      <PageHeader
        title="Empresas"
        sub="Gestión de empresas de la plataforma"
        actions={
          <button type="button" className="btn btn-primary sm" onClick={() => setCreating(true)}>
            <Icon.Plus size={14} /> Nueva empresa
          </button>
        }
      />

      <PlataformaPanel />

      <Panel title="Empresas" meta={meta} noPad>
        <DataTable columns={columns} rows={companies} rowKey={c => c.id} empty={empty} />
      </Panel>

      {creating && <CompanyCreateModal onClose={() => setCreating(false)} />}
      {ficha && <FichaEmpresaModal company={ficha} onClose={() => setFichaId(null)} />}
    </div>
  );
}

function CompanyCreateModal({ onClose }: { onClose: () => void }) {
  const create = useCreateCompany();
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [slugTouched, setSlugTouched] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState(() => makeTempPassword());

  // Si el usuario no ha tocado el slug, se autocompleta desde el nombre.
  const effectiveSlug = slugTouched ? slug : slugify(name);

  const slugValid = effectiveSlug.length >= 2 && SLUG_RE.test(effectiveSlug);
  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  const passwordValid = password.trim().length >= 8;
  const canSave = !create.isPending && name.trim().length > 0 && slugValid && emailValid && passwordValid;

  const submit = () => {
    if (!canSave) return;
    create.mutate(
      {
        name: name.trim(),
        slug: effectiveSlug,
        superAdminEmail: email.trim(),
        superAdminPassword: password.trim(),
      },
      { onSuccess: () => onClose() },
    );
  };

  return (
    <Modal
      open
      onClose={() => { if (!create.isPending) onClose(); }}
      title="Nueva empresa"
      sub="Crea una empresa y su primer super_admin con contraseña temporal para el primer ingreso."
      footer={
        <>
          <button type="button" className="btn btn-ghost sm" onClick={onClose} disabled={create.isPending}>
            Cancelar
          </button>
          <button type="button" className="btn btn-primary sm" onClick={submit} disabled={!canSave}>
            <Icon.Check size={14} />
            {create.isPending ? 'Creando…' : 'Crear empresa'}
          </button>
        </>
      }
    >
      <div className={styles.form}>
        <Field label="Nombre" htmlFor="co-name" required>
          <input
            id="co-name"
            className="input"
            placeholder="Ej. Bros & Subs"
            value={name}
            maxLength={120}
            onChange={e => setName(e.target.value)}
            autoFocus
          />
        </Field>

        <Field
          label="Slug"
          htmlFor="co-slug"
          required
          hint="Identificador en URLs. Minúsculas, números y guiones (ej. bros-and-subs)."
        >
          <input
            id="co-slug"
            className="input"
            placeholder="bros-and-subs"
            value={effectiveSlug}
            maxLength={63}
            onChange={e => {
              setSlugTouched(true);
              setSlug(e.target.value.toLowerCase());
            }}
            onKeyDown={e => { if (e.key === 'Enter' && canSave) submit(); }}
            aria-invalid={effectiveSlug.length > 0 && !slugValid}
          />
        </Field>

        <Field
          label="Email del super_admin"
          htmlFor="co-email"
          required
          hint="Quedará como owner operativo de esta empresa."
        >
          <input
            id="co-email"
            className="input"
            type="email"
            inputMode="email"
            placeholder="dueno@empresa.com"
            value={email}
            onChange={e => setEmail(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && canSave) submit(); }}
            aria-invalid={email.length > 0 && !emailValid}
          />
        </Field>

        <Field
          label="Contraseña temporal"
          htmlFor="co-password"
          required
          hint="Compártela solo por un canal seguro y pídele cambiarla después del primer ingreso."
        >
          <div className={styles.inlineActions}>
            <input
              id="co-password"
              className="input"
              type="text"
              value={password}
              minLength={8}
              onChange={e => setPassword(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && canSave) submit(); }}
              aria-invalid={password.length > 0 && !passwordValid}
            />
            <button
              type="button"
              className="btn btn-ghost sm"
              onClick={() => setPassword(makeTempPassword())}
              disabled={create.isPending}
            >
              Regenerar
            </button>
          </div>
        </Field>

        <div className={styles.credentialBox}>
          <b>Credenciales iniciales</b>
          <span>Email: {email.trim() || 'dueno@empresa.com'}</span>
          <span>Password: {password || 'mínimo 8 caracteres'}</span>
        </div>
      </div>
    </Modal>
  );
}

const PLANES: Array<{ id: CompanyPlan; label: string; ayuda: string }> = [
  { id: 'trial', label: 'Prueba', ayuda: 'Con reloj. Al vencer se cierra su panel; la venta sigue.' },
  { id: 'activo', label: 'Pagando', ayuda: 'Sin vencimiento por calendario.' },
  { id: 'cortesia', label: 'Cortesía', ayuda: 'Piloto, demos y socios. Nunca vence.' },
];

/** Estado de suscripción de una empresa, en una celda. */
function Suscripcion({ company }: { company: Company }) {
  if (company.plan === 'cortesia') return <Tag>Cortesía</Tag>;
  if (company.plan === 'activo') return <Tag tone="green">Pagando</Tag>;

  // En prueba: lo que importa es cuánto queda, no la etiqueta.
  const dias = company.diasRestantes;
  if (dias === null || dias === undefined) {
    return <span className={styles.slug}>Prueba sin arrancar</span>;
  }
  if (dias <= 0) return <Tag tone="coral">Prueba vencida</Tag>;
  return (
    <Tag tone={dias <= 7 ? 'sun' : 'active'}>
      {dias === 1 ? 'Queda 1 día' : `Quedan ${dias} días`}
    </Tag>
  );
}

/**
 * Configuración de la plataforma. Hoy es un solo número —los días de prueba de
 * las altas nuevas— y el modo de vencimiento.
 *
 * `avisar` existe para poder encender el cron y mirar a quién le habría vencido
 * antes de apagarle el negocio a nadie.
 */
function PlataformaPanel() {
  const { data, isLoading } = usePlatformSettings();
  const guardar = usePatchPlatformSettings();
  const [dias, setDias] = useState<number | null>(null);

  const valor = dias ?? data?.trialDays ?? 7;
  const sucio = data ? valor !== data.trialDays : false;

  return (
    <Panel
      title="Prueba gratis"
      meta={isLoading ? <span>Cargando…</span> : undefined}
    >
      <div className={styles.plataforma}>
        <div className={styles.plataformaCampo}>
          <label htmlFor="trial-days">Días de prueba</label>
          <div className={styles.grupoBotones}>
            <input
              id="trial-days"
              className="input"
              type="number"
              min={1}
              max={365}
              value={valor}
              onChange={e => setDias(Math.max(1, Math.min(365, Number(e.target.value))))}
              style={{ width: 90 }}
            />
            <button
              type="button"
              className="btn btn-primary sm"
              disabled={!sucio || guardar.isPending}
              onClick={() => guardar.mutate({ trialDays: valor }, { onSuccess: () => setDias(null) })}
            >
              {guardar.isPending ? 'Guardando…' : 'Guardar'}
            </button>
          </div>
          <small>
            Aplica a las empresas que arranquen de aquí en adelante. Los relojes que ya corren no se
            tocan: mover la meta a mitad de la prueba es cómo se pierde un cliente.
          </small>
        </div>

        <div className={styles.plataformaCampo}>
          <span>Al vencer</span>
          <div className={styles.grupoBotones}>
            {(['bloquear', 'avisar'] as const).map(modo => (
              <button
                key={modo}
                type="button"
                className={`btn sm ${data?.alVencer === modo ? 'btn-primary' : 'btn-ghost'}`}
                disabled={guardar.isPending}
                onClick={() => guardar.mutate({ alVencer: modo })}
              >
                {modo === 'bloquear' ? 'Bloquear su panel' : 'Solo avisar'}
              </button>
            ))}
          </div>
          <small>
            Al vencer se cierra el <b>panel del negocio</b>, no su venta: el bot sigue atendiendo y
            la tienda sigue cobrando. El dolor cae sobre quien firma el cheque, no sobre sus
            clientes. «Solo avisar» ni siquiera cierra el panel: deja el reporte y nada más.
          </small>
        </div>
      </div>
    </Panel>
  );
}

/** Ficha de una empresa: activar/suspender, plan y reloj de la prueba. */
function FichaEmpresaModal({ company, onClose }: { company: Company; onClose: () => void }) {
  const actualizar = useUpdateCompany();
  const pendiente = actualizar.isPending;

  const aplicar = (body: Parameters<typeof actualizar.mutate>[0]['body']) =>
    actualizar.mutate({ codeOrSlug: company.code, body });

  return (
    <Modal
      open
      onClose={() => { if (!pendiente) onClose(); }}
      title={company.name}
      sub={`${company.slug} · código ${company.code}`}
      footer={
        <button type="button" className="btn sm" onClick={onClose} disabled={pendiente}>
          Cerrar
        </button>
      }
    >
      <div className={styles.ficha}>
        <div className={styles.fichaBloque}>
          <b>Estado</b>
          <p>
            {company.status === 'active'
              ? 'Opera con normalidad: panel y bot funcionando.'
              : 'Suspendida: el panel y el bot devuelven error. Nadie puede pedir ni operar.'}
          </p>
          <div className={styles.grupoBotones}>
            <button
              type="button"
              className={`btn sm ${company.status === 'active' ? 'btn-ghost' : 'btn-primary'}`}
              disabled={pendiente || company.status === 'active'}
              onClick={() => aplicar({ status: 'active' })}
            >
              Activar
            </button>
            <button
              type="button"
              className="btn btn-ghost sm"
              disabled={pendiente || company.status === 'suspended'}
              onClick={() => aplicar({ status: 'suspended' })}
            >
              Suspender
            </button>
          </div>
        </div>

        <div className={styles.fichaBloque}>
          <b>Plan</b>
          <div className={styles.grupoBotones}>
            {PLANES.map(p => (
              <button
                key={p.id}
                type="button"
                className={`btn sm ${company.plan === p.id ? 'btn-primary' : 'btn-ghost'}`}
                disabled={pendiente || company.plan === p.id}
                onClick={() => aplicar({ plan: p.id })}
              >
                {p.label}
              </button>
            ))}
          </div>
          <p>{PLANES.find(p => p.id === company.plan)?.ayuda}</p>
        </div>

        {company.plan === 'trial' && (
          <div className={styles.fichaBloque}>
            <b>Prueba</b>
            <p>
              {company.trial_ends_at
                ? `Vence el ${formatDate(company.trial_ends_at)}${
                    company.diasRestantes !== null && company.diasRestantes !== undefined
                      ? company.diasRestantes > 0
                        ? ` · quedan ${company.diasRestantes} días`
                        : ' · ya venció'
                      : ''
                  }.`
                : 'El reloj todavía no arranca: empieza cuando el negocio quede operativo (carta, zona y WhatsApp).'}
            </p>
            <div className={styles.grupoBotones}>
              {[7, 14, 30].map(d => (
                <button
                  key={d}
                  type="button"
                  className="btn btn-ghost sm"
                  disabled={pendiente}
                  onClick={() => aplicar({ extenderDias: d })}
                >
                  +{d} días
                </button>
              ))}
              <button
                type="button"
                className="btn btn-ghost sm"
                disabled={pendiente}
                onClick={() => aplicar({ reiniciarTrial: true })}
              >
                Reiniciar
              </button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
