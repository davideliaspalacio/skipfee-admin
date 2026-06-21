'use client';

import { useMemo, useState } from 'react';
import { Icon } from '@/lib/icons';
import { Modal } from '@/components/ui/Modal';
import { Field } from '@/components/ui/Field';
import { Panel } from '@/components/ui/Panel';
import { Tag } from '@/components/ui/Chip';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { PageHeader, EmptyState } from '@/components/ui/Feedback';
import { usePlatformCompanies, useCreateCompany, useActiveRole } from '@/lib/queries';
import { isPlatformOwner } from '@/lib/roles';
import type { Company } from '@/lib/api';
import styles from './empresas.module.css';

const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

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

      <Panel title="Empresas" meta={meta} noPad>
        <DataTable columns={columns} rows={companies} rowKey={c => c.id} empty={empty} />
      </Panel>

      {creating && <CompanyCreateModal onClose={() => setCreating(false)} />}
    </div>
  );
}

function CompanyCreateModal({ onClose }: { onClose: () => void }) {
  const create = useCreateCompany();
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [slugTouched, setSlugTouched] = useState(false);
  const [email, setEmail] = useState('');

  // Si el usuario no ha tocado el slug, se autocompleta desde el nombre.
  const effectiveSlug = slugTouched ? slug : slugify(name);

  const slugValid = effectiveSlug.length >= 2 && SLUG_RE.test(effectiveSlug);
  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  const canSave = !create.isPending && name.trim().length > 0 && slugValid && emailValid;

  const submit = () => {
    if (!canSave) return;
    create.mutate(
      { name: name.trim(), slug: effectiveSlug, superAdminEmail: email.trim() },
      { onSuccess: () => onClose() },
    );
  };

  return (
    <Modal
      open
      onClose={() => { if (!create.isPending) onClose(); }}
      title="Nueva empresa"
      sub="Crea una empresa y su primer super_admin. Se le invitará por email."
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
          hint="Recibirá acceso como super_admin de la empresa."
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
      </div>
    </Modal>
  );
}
