'use client';

import { useState } from 'react';
import { Icon } from '@/lib/icons';
import { COP, type Zone } from '@/lib/data';
import { useIsDark } from '@/lib/hooks';
import { useZones, usePatchZone, useCreateZone, useDeleteZone, useUnarchiveZone, useSettings } from '@/lib/queries';
import { Modal } from '@/components/ui/Modal';
import { RouteMap } from '@/components/ui/RouteMap';
import { ZonaCoverageMap } from './ZonaCoverageMap';
import styles from './configuracion.module.css';

function zoneKey(z: Zone): string {
  return `${z.id}:${z.name}:${z.tarifa}:${z.color}:${z.lat}:${z.lng}:${z.coverageRadiusM ?? ''}`;
}

/**
 * Panel "Zonas y tarifas": lista editable de zonas activas (nombre, tarifa,
 * color, centro lat/lng + radio de cobertura) + crear + archivar/desarchivar.
 *
 * Cobertura: editor visual <ZonaCoverageMap> (portado del Vite app) — busca el
 * barrio/comuna con Google Places y carga la forma real (polígono) de OSM, con
 * fallback a centro + radio. Cada fila además tiene un editor rápido de centro+radio.
 */
export function ZonasPanel() {
  const { data: zones, isLoading, isError } = useZones(true);
  const { data: settings } = useSettings();
  const dark = useIsDark();
  const [creating, setCreating] = useState(false);

  const active = (zones ?? []).filter(z => !z.archived);
  const archived = (zones ?? []).filter(z => z.archived);

  const origin = {
    lat: Number.isFinite(settings?.localLat) ? (settings!.localLat as number) : 6.2447,
    lng: Number.isFinite(settings?.localLng) ? (settings!.localLng as number) : -75.5736,
    label: settings?.localLabel || 'Local',
  };
  const stops = active
    .filter(z => Number.isFinite(z.lat) && Number.isFinite(z.lng))
    .map(z => ({ id: z.id, lat: z.lat, lng: z.lng }));

  return (
    <div className={styles.stack}>
      <div className={styles.card}>
        <div className={styles.cardHead}>
          <div>
            <div className={styles.cardTitle}><Icon.MapPin size={15} /> Zonas de cobertura</div>
            <div className={styles.cardSub}>Cada zona tiene su tarifa de domicilio. El bot la cobra automáticamente.</div>
          </div>
          <button className="btn btn-primary sm" onClick={() => setCreating(v => !v)}>
            <Icon.Plus size={13} /> Nueva zona
          </button>
        </div>

        {creating && <ZonaCreateForm onClose={() => setCreating(false)} />}

        {isLoading && <div className={styles.loading}>Cargando zonas…</div>}
        {isError && <div className={styles.loading}>No se pudieron cargar las zonas.</div>}
        {zones && active.length === 0 && !creating && <div className={styles.loading}>No hay zonas activas. Creá la primera.</div>}
        {active.map(z => <ZonaRow key={zoneKey(z)} zone={z} />)}
      </div>

      {zones && active.length > 0 && <ZonaCoverageMap zones={active} />}

      {archived.length > 0 && (
        <div className={styles.card}>
          <div className={styles.cardHead}>
            <div>
              <div className={styles.cardTitle}>Zonas archivadas</div>
              <div className={styles.cardSub}>No se ofrecen en el bot. Podés desarchivarlas cuando quieras.</div>
            </div>
          </div>
          {archived.map(z => <ZonaArchivedRow key={z.id} zone={z} />)}
        </div>
      )}
    </div>
  );
}

function ZonaRow({ zone }: { zone: Zone }) {
  const patch = usePatchZone();
  const del = useDeleteZone();
  const [d, setD] = useState({ name: zone.name, tarifa: zone.tarifa, color: zone.color });
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [coverageOpen, setCoverageOpen] = useState(false);

  const dirty = d.name !== zone.name || d.tarifa !== zone.tarifa || d.color !== zone.color;

  return (
    <div className={styles.zoneRow}>
      <input type="color" className={styles.zoneColor} value={d.color} onChange={e => setD({ ...d, color: e.target.value })} aria-label="Color" />
      <input className="input" value={d.name} maxLength={60} onChange={e => setD({ ...d, name: e.target.value })} aria-label="Nombre" />
      <div className={styles.tarifaInput}>
        <span className={styles.subtle}>$</span>
        <input className="input" type="number" min={0} value={d.tarifa} onChange={e => setD({ ...d, tarifa: Number(e.target.value) })} aria-label="Tarifa" />
      </div>
      <div className="flex" style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
        {dirty && (
          <button className="btn btn-primary sm" onClick={() => patch.mutate({ zoneId: zone.id, body: d })} disabled={patch.isPending || !d.name.trim()}>
            <Icon.Check size={12} /> Guardar
          </button>
        )}
        <button className="btn btn-ghost sm" onClick={() => setCoverageOpen(true)} title="Editar cobertura (centro + radio)">
          <Icon.Navigation size={13} /> Cobertura
        </button>
        <button className="iconbtn" onClick={() => setConfirmOpen(true)} disabled={del.isPending} title="Archivar zona" aria-label="Archivar zona">
          <Icon.X size={15} />
        </button>
      </div>

      <Modal
        open={confirmOpen}
        onClose={() => { if (!del.isPending) setConfirmOpen(false); }}
        title="Archivar zona"
        sub="El bot dejará de ofrecerla."
        size="sm"
        footer={
          <>
            <button className="btn" onClick={() => setConfirmOpen(false)} disabled={del.isPending}>Cancelar</button>
            <button className="btn btn-primary" style={{ background: 'var(--coral)', borderColor: 'var(--coral)' }} onClick={() => del.mutate(zone.id, { onSuccess: () => setConfirmOpen(false) })} disabled={del.isPending}>
              <Icon.X size={13} /> {del.isPending ? 'Archivando…' : 'Archivar'}
            </button>
          </>
        }
      >
        <p style={{ fontSize: 14 }}>¿Seguro que querés archivar <strong>{zone.name}</strong>?</p>
        <p className={styles.subtle} style={{ marginTop: 10 }}>
          El bot dejará de ofrecerla a clientes nuevos. Los pedidos viejos la conservan y podés desarchivarla después.
        </p>
      </Modal>

      <ZonaCoverageModal zone={zone} open={coverageOpen} onClose={() => setCoverageOpen(false)} />
    </div>
  );
}

/** Editor simplificado de cobertura: centro (lat/lng) + radio en metros. */
function ZonaCoverageModal({ zone, open, onClose }: { zone: Zone; open: boolean; onClose: () => void }) {
  const patch = usePatchZone();
  const dark = useIsDark();
  const [lat, setLat] = useState(String(zone.lat ?? ''));
  const [lng, setLng] = useState(String(zone.lng ?? ''));
  const [radius, setRadius] = useState(String(zone.coverageRadiusM ?? 1500));

  const latNum = Number.parseFloat(lat);
  const lngNum = Number.parseFloat(lng);
  const radiusNum = Number.parseInt(radius, 10);
  const latValid = Number.isFinite(latNum) && latNum >= -90 && latNum <= 90;
  const lngValid = Number.isFinite(lngNum) && lngNum >= -180 && lngNum <= 180;
  const radiusValid = Number.isFinite(radiusNum) && radiusNum >= 100 && radiusNum <= 20000;
  const valid = latValid && lngValid && radiusValid;

  const save = () => {
    if (!valid) return;
    patch.mutate(
      { zoneId: zone.id, body: { lat: latNum, lng: lngNum, coverageRadiusM: radiusNum } },
      { onSuccess: onClose },
    );
  };

  const stops = latValid && lngValid ? [{ id: zone.id, lat: latNum, lng: lngNum }] : [];

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`Cobertura · ${zone.name}`}
      sub="Centro y radio de la zona. El bot usa el radio como respaldo de cobertura."
      footer={
        <>
          <button className="btn" onClick={onClose} disabled={patch.isPending}>Cancelar</button>
          <button className="btn btn-primary" onClick={save} disabled={!valid || patch.isPending}>
            <Icon.Check size={13} /> {patch.isPending ? 'Guardando…' : 'Guardar'}
          </button>
        </>
      }
    >
      <div className={styles.grid2}>
        <div className={styles.col}>
          <span className={styles.label}>Latitud</span>
          <input className="input" value={lat} inputMode="decimal" onChange={e => setLat(e.target.value)} />
          {!latValid && <span className={styles.err}>Entre -90 y 90.</span>}
        </div>
        <div className={styles.col}>
          <span className={styles.label}>Longitud</span>
          <input className="input" value={lng} inputMode="decimal" onChange={e => setLng(e.target.value)} />
          {!lngValid && <span className={styles.err}>Entre -180 y 180.</span>}
        </div>
        <div className={`${styles.col} ${styles.full}`}>
          <span className={styles.label}>Radio de cobertura (metros)</span>
          <input className="input" type="number" min={100} max={20000} step={100} value={radius} onChange={e => setRadius(e.target.value)} />
          {!radiusValid && <span className={styles.err}>Entre 100 y 20.000 m.</span>}
        </div>
      </div>
      <div style={{ marginTop: 12 }}>
        <RouteMap origin={{ lat: latValid ? latNum : 6.2447, lng: lngValid ? lngNum : -75.5736, label: zone.name }} stops={stops} color={zone.color} dark={dark} height={200} />
      </div>
    </Modal>
  );
}

function ZonaArchivedRow({ zone }: { zone: Zone }) {
  const unarchive = useUnarchiveZone();
  return (
    <div className={styles.zoneArchived}>
      <span className={styles.dot} style={{ background: zone.color }} />
      <b>{zone.name}</b>
      <span className={styles.subtle}>{COP(zone.tarifa)}</span>
      <div className={styles.spacer} />
      <button className="btn btn-ghost sm" onClick={() => unarchive.mutate(zone.id)} disabled={unarchive.isPending}>
        <Icon.Check size={12} /> {unarchive.isPending ? 'Restaurando…' : 'Desarchivar'}
      </button>
    </div>
  );
}

function ZonaCreateForm({ onClose }: { onClose: () => void }) {
  const create = useCreateZone();
  const [name, setName] = useState('');
  const [tarifa, setTarifa] = useState(4500);
  const [color, setColor] = useState('#5E6AD2');

  const canSave = name.trim().length > 0 && tarifa >= 0 && !create.isPending;

  const save = () => {
    create.mutate({ name: name.trim(), tarifa, color }, { onSuccess: () => { setName(''); onClose(); } });
  };

  return (
    <div className={styles.createRow}>
      <input type="color" className={styles.zoneColor} value={color} onChange={e => setColor(e.target.value)} aria-label="Color de la zona nueva" />
      <input className="input" placeholder="Nombre de la zona" value={name} maxLength={60} onChange={e => setName(e.target.value)} aria-label="Nombre de la zona nueva" />
      <div className={styles.tarifaInput}>
        <span className={styles.subtle}>$</span>
        <input className="input" type="number" min={0} placeholder="Tarifa" value={tarifa} onChange={e => setTarifa(Number(e.target.value))} aria-label="Tarifa de la zona nueva" />
      </div>
      <div className="flex" style={{ display: 'flex', gap: 6 }}>
        <button className="btn btn-primary sm" onClick={save} disabled={!canSave}>{create.isPending ? 'Creando…' : 'Crear'}</button>
        <button className="btn btn-ghost sm" onClick={onClose}>Cancelar</button>
      </div>
    </div>
  );
}
